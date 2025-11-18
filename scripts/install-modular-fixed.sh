#!/usr/bin/env bash
set -e

# Minimal, robust modular installer (fixed)
# - Presents a simple component selector
# - Uses existing standalone installer for core
# - Populates Claude sub-agents/commands and Agent-OS docs
# - Optionally initializes Claude Flow
# - Generates analysis/approach/docs
# - Optionally auto-runs the recommended command

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'; BOLD='\033[1m'

PROJECT_DIR="$(pwd)"
INSTALL_DIR="$PROJECT_DIR/.ai-workflow"

INSTALL_CLAUDE_CODE=false
INSTALL_AGENT_OS=false
INSTALL_CLAUDE_FLOW=false
INSTALL_TMUX=false

print_header(){
  echo -e "\n${CYAN}${BOLD}═══════════════════════════════════════════════════════${NC}"
  echo -e "${CYAN}${BOLD}  $1${NC}"
  echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════════${NC}\n"
}

show_menu(){
  clear
  print_header "Intelligent Workflow - Modular Install (Fixed)"
  echo -e "${BOLD}Select components to install:${NC}\n"
  echo -e "  [$([[ $INSTALL_CLAUDE_CODE == true ]] && echo 'x' || echo ' ')] Claude Code"
  echo -e "  [$([[ $INSTALL_AGENT_OS == true ]] && echo 'x' || echo ' ')] Agent-OS"
  echo -e "  [$([[ $INSTALL_CLAUDE_FLOW == true ]] && echo 'x' || echo ' ')] Claude Flow"
  echo -e "  [$([[ $INSTALL_TMUX == true ]] && echo 'x' || echo ' ')] TMux"
  echo -e "\n  [1] Toggle Claude Code   [2] Toggle Agent-OS"
  echo -e "  [3] Toggle Claude Flow  [4] Toggle TMux"
  echo -e "\n  [C] Continue   [Q] Quit\n"
}

select_components(){
  while true; do
    show_menu
    read -n 1 -p "Select option: " ch; echo ""
    case "${ch}" in
      1) INSTALL_CLAUDE_CODE=$([[ $INSTALL_CLAUDE_CODE == true ]] && echo false || echo true);;
      2) INSTALL_AGENT_OS=$([[ $INSTALL_AGENT_OS == true ]] && echo false || echo true);;
      3) INSTALL_CLAUDE_FLOW=$([[ $INSTALL_CLAUDE_FLOW == true ]] && echo false || echo true);;
      4) INSTALL_TMUX=$([[ $INSTALL_TMUX == true ]] && echo false || echo true);;
      C|c) break;;
      Q|q) echo "Cancelled"; exit 0;;
      *) ;; 
    esac
  done
}

install_core(){
  print_header "Installing core"
  bash ./install-standalone.sh </dev/null || true
}

install_claude_assets(){
  if [[ $INSTALL_CLAUDE_CODE != true ]]; then return; fi
  print_header "Installing Claude sub-agents and commands"
  mkdir -p "$PROJECT_DIR/.claude/agents" "$PROJECT_DIR/.claude/commands"
  cp -f agent-templates/*.md "$PROJECT_DIR/.claude/agents/" 2>/dev/null || true
  cp -f slash-commands/*.md "$PROJECT_DIR/.claude/commands/" 2>/dev/null || true
}

install_agent_os(){
  if [[ $INSTALL_AGENT_OS != true ]]; then return; fi
  print_header "Preparing Agent-OS directories"
  mkdir -p "$PROJECT_DIR/.agent-os/instructions" "$PROJECT_DIR/.agent-os/specs" "$PROJECT_DIR/.agent-os/plans" "$PROJECT_DIR/.agent-os/tasks"
}

init_claude_flow(){
  if [[ $INSTALL_CLAUDE_FLOW != true ]]; then return; fi
  print_header "Initializing Claude Flow"
  (cd "$PROJECT_DIR" && npx --yes claude-flow@alpha init 2>/dev/null || true)
}

generate_analysis_and_docs(){
  print_header "Analyzing and generating docs"
  mkdir -p "$PROJECT_DIR/.ai-dev"
  ./ai-workflow analyze > "$PROJECT_DIR/.ai-dev/analysis.json"
  node "$INSTALL_DIR/intelligence-engine/approach-selector.js" "$PROJECT_DIR/.ai-dev/analysis.json" > "$PROJECT_DIR/.ai-dev/approach.json" || \
  node .ai-workflow/intelligence-engine/approach-selector.js "$PROJECT_DIR/.ai-dev/analysis.json" > "$PROJECT_DIR/.ai-dev/approach.json"
  node "$INSTALL_DIR/intelligence-engine/document-customizer.js" "$PROJECT_DIR/.ai-dev/analysis.json" "$PROJECT_DIR/.ai-dev/approach.json" > "$PROJECT_DIR/.ai-dev/custom-docs.json" 2>/dev/null || true
  jq -r '.claude?.content // empty' "$PROJECT_DIR/.ai-dev/custom-docs.json" > "$PROJECT_DIR/CLAUDE.md" 2>/dev/null || true
  jq -r '.agentOS?.content // empty' "$PROJECT_DIR/.ai-dev/custom-docs.json" > "$PROJECT_DIR/.agent-os/instructions/instructions.md" 2>/dev/null || true
}

maybe_autorun(){
  if [[ $INSTALL_CLAUDE_FLOW != true ]]; then return; fi
  local cmd
  cmd=$(jq -r '.command // empty' "$PROJECT_DIR/.ai-dev/approach.json" 2>/dev/null || echo "")
  if [[ -n "$cmd" ]]; then
    echo -e "\n${CYAN}Running: ${BOLD}$cmd${NC}\n"
    bash -lc "$cmd" || echo -e "${YELLOW}Warning: command failed${NC}"
  else
    echo -e "${YELLOW}No command available to auto-run${NC}"
  fi
}

print_summary(){
  print_header "Done"
  echo -e "Installed to: $INSTALL_DIR"
  echo -e "Claude agents: $(ls -1 .claude/agents 2>/dev/null | wc -l) files"
  echo -e "Slash commands: $(ls -1 .claude/commands 2>/dev/null | wc -l) files"
  [[ -s "$PROJECT_DIR/CLAUDE.md" ]] && echo "CLAUDE.md written" || echo "CLAUDE.md not generated"
  [[ -s "$PROJECT_DIR/.agent-os/instructions/instructions.md" ]] && echo "Agent-OS instructions written" || echo "Agent-OS instructions not generated"
}

# Flow
select_components
install_core
install_claude_assets
install_agent_os
init_claude_flow
generate_analysis_and_docs
maybe_autorun
print_summary


