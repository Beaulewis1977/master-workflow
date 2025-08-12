#!/bin/bash

# TMux Orchestration Script for 24/7 Autonomous Workflow
# Based on Jedward23's TMux-Orchestrator patterns

set -e

# Configuration
PROJECT_NAME="${1:-workflow}"
WORKFLOW_TYPE="${2:-hive-mind}"  # simple-swarm, hive-mind, hive-mind-sparc
SESSION_NAME="workflow-${PROJECT_NAME}-$(date +%s)"
INSTALL_DIR="$(pwd)/.ai-workflow"
LOG_DIR="$INSTALL_DIR/logs/sessions"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}🚀 Starting TMux Orchestration for ${PROJECT_NAME}${NC}"

# Function to send command to tmux window
send_to_window() {
    local window=$1
    local command=$2
    tmux send-keys -t "${SESSION_NAME}:${window}" "$command" C-m
}

# Function to create window with name
create_window() {
    local window_num=$1
    local window_name=$2
    tmux new-window -t "${SESSION_NAME}:${window_num}" -n "$window_name"
}

# Check if tmux is installed
if ! command -v tmux &> /dev/null; then
    echo -e "${RED}TMux is not installed. Please install it first.${NC}"
    exit 1
fi

# Kill existing session if it exists
tmux kill-session -t "$SESSION_NAME" 2>/dev/null || true

# Create new session
echo -e "${GREEN}Creating TMux session: ${SESSION_NAME}${NC}"
tmux new-session -d -s "$SESSION_NAME"

# Configure based on workflow type
case "$WORKFLOW_TYPE" in
    simple-swarm)
        echo -e "${CYAN}Setting up Simple Swarm (1 window)${NC}"
        
        # Window 0: Main swarm agent
        tmux rename-window -t "${SESSION_NAME}:0" "swarm"
        send_to_window 0 "cd $(pwd)"
        send_to_window 0 "npx claude-flow@${CLAUDE_FLOW_VERSION:-alpha} swarm 'Complete project tasks'"
        ;;
    
    hive-mind)
        echo -e "${CYAN}Setting up Hive-Mind (5 windows)${NC}"
        
        # Window 0: Orchestrator
        tmux rename-window -t "${SESSION_NAME}:0" "orchestrator"
        send_to_window 0 "cd $(pwd)"
        send_to_window 0 "node $INSTALL_DIR/workflow-runner.js init --auto"
        
        # Window 1: Queen
        create_window 1 "queen"
        send_to_window 1 "cd $(pwd)"
        send_to_window 1 "npx claude-flow@${CLAUDE_FLOW_VERSION:-alpha} hive-mind spawn '$PROJECT_NAME' --agents 5 --claude"
        
        # Windows 2-4: Worker agents
        for i in {2..4}; do
            create_window $i "worker-$i"
            send_to_window $i "cd $(pwd)"
            send_to_window $i "claude --dangerously-skip-permissions"
            send_to_window $i "# Worker $i ready for tasks"
        done
        ;;
    
    hive-mind-sparc)
        echo -e "${CYAN}Setting up Hive-Mind + SPARC (8 windows)${NC}"
        
        # Window 0: Master Orchestrator
        tmux rename-window -t "${SESSION_NAME}:0" "orchestrator"
        send_to_window 0 "cd $(pwd)"
        send_to_window 0 "node $INSTALL_DIR/workflow-runner.js init --sparc"
        
        # Window 1: Queen with SPARC
        create_window 1 "queen-sparc"
        send_to_window 1 "cd $(pwd)"
        send_to_window 1 "npx claude-flow@${CLAUDE_FLOW_VERSION:-alpha} hive-mind spawn '$PROJECT_NAME' --sparc --agents 10 --claude"
        
        # Window 2: SPARC Phase Manager
        create_window 2 "sparc-phases"
        send_to_window 2 "cd $(pwd)"
        send_to_window 2 "npx claude-flow@alpha sparc wizard --interactive"
        
        # Windows 3-6: Worker agents for SPARC phases
        for i in {3..6}; do
            create_window $i "phase-$((i-2))"
            send_to_window $i "cd $(pwd)"
            send_to_window $i "claude --dangerously-skip-permissions"
            send_to_window $i "# SPARC Phase $((i-2)) agent ready"
        done
        
        # Window 7: Recovery Specialist (for messy projects)
        create_window 7 "recovery"
        send_to_window 7 "cd $(pwd)"
        send_to_window 7 "node $INSTALL_DIR/workflow-runner.js recover analyze"
        ;;
    
    *)
        echo -e "${RED}Unknown workflow type: $WORKFLOW_TYPE${NC}"
        echo "Usage: $0 [project-name] [simple-swarm|hive-mind|hive-mind-sparc]"
        tmux kill-session -t "$SESSION_NAME"
        exit 1
        ;;
esac

# Window for monitoring and logging
LAST_WINDOW=$(($(tmux list-windows -t "$SESSION_NAME" | wc -l) - 1))
create_window $((LAST_WINDOW + 1)) "monitor"
send_to_window $((LAST_WINDOW + 1)) "cd $(pwd)"
send_to_window $((LAST_WINDOW + 1)) "tail -f $INSTALL_DIR/logs/workflow.log"

# Window for auto-commit (every 30 minutes)
create_window $((LAST_WINDOW + 2)) "auto-commit"
send_to_window $((LAST_WINDOW + 2)) "cd $(pwd)"
send_to_window $((LAST_WINDOW + 2)) "while true; do git add . && git commit -m 'Auto-commit: Workflow progress - $(date)' || true; sleep 1800; done"

# Save session info
mkdir -p "$LOG_DIR"
cat > "$LOG_DIR/${SESSION_NAME}.info" << EOF
{
  "session": "$SESSION_NAME",
  "project": "$PROJECT_NAME",
  "type": "$WORKFLOW_TYPE",
  "started": "$(date -Iseconds)",
  "windows": $(tmux list-windows -t "$SESSION_NAME" | wc -l),
  "pid": $$
}
EOF

echo -e "${GREEN}✅ TMux orchestration started!${NC}"
echo ""
echo "Commands:"
echo -e "  ${CYAN}Attach to session:${NC} tmux attach -t $SESSION_NAME"
echo -e "  ${CYAN}List windows:${NC} tmux list-windows -t $SESSION_NAME"
echo -e "  ${CYAN}Switch window:${NC} Ctrl-b [0-9]"
echo -e "  ${CYAN}Detach:${NC} Ctrl-b d"
echo -e "  ${CYAN}Kill session:${NC} tmux kill-session -t $SESSION_NAME"
echo ""
echo -e "${YELLOW}The workflow is now running autonomously in the background!${NC}"
echo -e "${YELLOW}It will continue even if you close your terminal.${NC}"