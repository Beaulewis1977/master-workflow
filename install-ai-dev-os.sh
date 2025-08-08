#!/bin/bash

# AI Development Operating System (AIDOS) - Master Installer
# This script installs and configures the complete 4-system integration:
# - Tmux-Orchestrator (24/7 autonomous operation)
# - Agent OS (spec-driven planning)
# - Claude-Flow (multi-agent coordination)
# - Claude Code Sub-Agents (specialized execution)
# - Intelligence Engine (automatic approach selection)

set -e

# Check if we need sudo for certain operations
NEED_SUDO=""
if [ "$EUID" -ne 0 ]; then
    # Check if we can write to system directories
    if ! touch /usr/local/bin/.test 2>/dev/null; then
        NEED_SUDO="sudo"
        echo "Note: This script may require sudo for some operations."
        echo "You will be prompted for your password if needed."
    else
        rm -f /usr/local/bin/.test
    fi
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Configuration
AI_DEV_HOME="$HOME/.ai-dev-os"
CLAUDE_HOME="$HOME/.claude"
TMUX_ORCH_HOME="$HOME/.tmux-orchestrator"

# Functions
print_header() {
    echo -e "\n${BOLD}${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${CYAN}  $1${NC}"
    echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

check_command() {
    if command -v $1 &> /dev/null; then
        print_success "$1 is installed"
        return 0
    else
        print_error "$1 is not installed"
        return 1
    fi
}

# Welcome Message
clear
echo -e "${BOLD}${MAGENTA}"
cat << "EOF"
    ___    ____   ____                 ____  _____
   /   |  /  _/  / __ \___ _   __     / __ \/ ___/
  / /| |  / /   / / / / _ \ | / /    / / / /\__ \ 
 / ___ |_/ /   / /_/ /  __/ |/ /    / /_/ /___/ / 
/_/  |_/___/  /_____/\___/|___/     \____//____/  
                                                   
AI Development Operating System Installer v1.0
EOF
echo -e "${NC}"
echo -e "${CYAN}Creating an autonomous AI development environment...${NC}\n"

# Step 1: Check Prerequisites
print_header "Step 1: Checking Prerequisites"

MISSING_DEPS=0

if ! check_command node; then
    MISSING_DEPS=1
    echo "  Install with: curl -fsSL https://deb.nodesource.com/setup_lts.x | ${NEED_SUDO} -E bash - && ${NEED_SUDO} apt-get install -y nodejs"
    echo "  Or if you need sudo, the script will prompt you when needed."
fi

if ! check_command npm; then
    MISSING_DEPS=1
    echo "  Node.js installation should include npm"
fi

if ! check_command tmux; then
    MISSING_DEPS=1
    echo "  Install with: ${NEED_SUDO} apt-get install tmux"
    if [ -n "$NEED_SUDO" ]; then
        echo "  Or run: sudo apt-get install tmux"
    fi
fi

if ! check_command git; then
    MISSING_DEPS=1
    echo "  Install with: ${NEED_SUDO} apt-get install git"
    if [ -n "$NEED_SUDO" ]; then
        echo "  Or run: sudo apt-get install git"
    fi
fi

if [ $MISSING_DEPS -eq 1 ]; then
    print_warning "Missing dependencies detected"
    echo -e "${CYAN}Would you like to auto-install missing dependencies? (y/N): ${NC}"
    read -n 1 auto_install
    echo ""
    
    if [ "$auto_install" = "y" ] || [ "$auto_install" = "Y" ]; then
        print_info "Attempting to install missing dependencies..."
        
        # Install tmux if missing
        if ! check_command tmux; then
            print_info "Installing tmux..."
            if [ -n "$NEED_SUDO" ]; then
                sudo apt-get update && sudo apt-get install -y tmux
            else
                apt-get update && apt-get install -y tmux
            fi
        fi
        
        # Install git if missing
        if ! check_command git; then
            print_info "Installing git..."
            if [ -n "$NEED_SUDO" ]; then
                sudo apt-get install -y git
            else
                apt-get install -y git
            fi
        fi
        
        # Install Node.js if missing
        if ! check_command node; then
            print_info "Installing Node.js..."
            curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
            sudo apt-get install -y nodejs
        fi
        
        # Re-check dependencies
        MISSING_DEPS=0
        if ! check_command node; then MISSING_DEPS=1; fi
        if ! check_command npm; then MISSING_DEPS=1; fi
        if ! check_command tmux; then MISSING_DEPS=1; fi
        if ! check_command git; then MISSING_DEPS=1; fi
        
        if [ $MISSING_DEPS -eq 1 ]; then
            print_error "Failed to install some dependencies. Please install manually."
            exit 1
        fi
    else
        print_error "Please install missing dependencies and run this script again"
        exit 1
    fi
fi

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ required (found: $(node -v))"
    exit 1
fi

print_success "All prerequisites satisfied"

# Step 2: Create Directory Structure
print_header "Step 2: Creating AI Dev OS Directory Structure"

mkdir -p "$AI_DEV_HOME"/{bin,integrations,templates,configs,logs}
mkdir -p "$AI_DEV_HOME"/integrations/{agent-os,claude-flow,tmux-orchestrator}
mkdir -p "$AI_DEV_HOME"/templates/{web-app,api-service,cli-tool,microservices,library,mobile-app}
mkdir -p "$CLAUDE_HOME"/{commands,agents,hooks}

print_success "Directory structure created"

# Step 3: Install Claude Code
print_header "Step 3: Installing Claude Code"

if command -v claude &> /dev/null; then
    print_warning "Claude Code already installed, skipping..."
else
    print_info "Installing Claude Code globally..."
    npm install -g @anthropic-ai/claude-code
    print_success "Claude Code installed"
fi

# Step 4: Install Agent OS
print_header "Step 4: Installing Agent OS"

if [ -f "$CLAUDE_HOME/commands/plan-product.md" ]; then
    print_warning "Agent OS already installed, skipping..."
else
    print_info "Downloading and installing Agent OS..."
    
    # Download the setup script
    curl -fsSL https://raw.githubusercontent.com/buildermethods/agent-os/main/setup.sh -o /tmp/agent-os-setup.sh
    chmod +x /tmp/agent-os-setup.sh
    
    # Run the setup
    bash /tmp/agent-os-setup.sh
    
    # Run Claude Code specific setup
    curl -fsSL https://raw.githubusercontent.com/buildermethods/agent-os/main/setup-claude-code.sh -o /tmp/agent-os-claude.sh
    chmod +x /tmp/agent-os-claude.sh
    bash /tmp/agent-os-claude.sh
    
    print_success "Agent OS installed"
fi

# Step 5: Install Claude-Flow
print_header "Step 5: Installing Claude-Flow"

if [ -d "$HOME/.claude-flow" ]; then
    print_warning "Claude-Flow appears to be installed, checking version..."
fi

print_info "Installing Claude-Flow (alpha)..."
npx claude-flow@alpha init --force

print_success "Claude-Flow installed"

# Step 6: Install Tmux-Orchestrator
print_header "Step 6: Installing Tmux-Orchestrator"

if [ -d "$TMUX_ORCH_HOME" ]; then
    print_warning "Tmux-Orchestrator directory exists, updating..."
    cd "$TMUX_ORCH_HOME"
    git pull
else
    print_info "Cloning Tmux-Orchestrator..."
    git clone https://github.com/Jedward23/Tmux-Orchestrator.git "$TMUX_ORCH_HOME"
fi

# Make scripts executable
chmod +x "$TMUX_ORCH_HOME"/*.sh 2>/dev/null || true

print_success "Tmux-Orchestrator installed"

# Step 7: Create Integration Scripts
print_header "Step 7: Creating Integration Scripts"

# Create the main ai-dev CLI
cat > "$AI_DEV_HOME/bin/ai-dev" << 'EOFD'
#!/bin/bash

# AI Development OS - Main CLI Interface
# Commands: init, start, stop, status, orchestrate, flow, agent, sync

AI_DEV_HOME="$HOME/.ai-dev-os"
COMMAND=$1
shift

case $COMMAND in
    init)
        bash "$AI_DEV_HOME/bin/ai-dev-init" "$@"
        ;;
    start)
        bash "$AI_DEV_HOME/bin/ai-dev-start" "$@"
        ;;
    stop)
        bash "$AI_DEV_HOME/bin/ai-dev-stop" "$@"
        ;;
    status)
        bash "$AI_DEV_HOME/bin/ai-dev-status" "$@"
        ;;
    orchestrate)
        bash "$AI_DEV_HOME/bin/ai-dev-orchestrate" "$@"
        ;;
    flow)
        npx claude-flow@alpha "$@"
        ;;
    agent)
        # Route to Agent OS commands
        claude "$@"
        ;;
    sync)
        bash "$AI_DEV_HOME/bin/ai-dev-sync" "$@"
        ;;
    analyze)
        # Run complexity analysis
        if [ -f "$AI_DEV_HOME/intelligence-engine/complexity-analyzer.js" ]; then
            node "$AI_DEV_HOME/intelligence-engine/complexity-analyzer.js" "${1:-.}"
        else
            echo "Intelligence engine not installed"
            exit 1
        fi
        ;;
    help|--help|-h)
        echo "AI Development OS - Command Line Interface"
        echo ""
        echo "Usage: ai-dev [command] [options]"
        echo ""
        echo "Commands:"
        echo "  init [options]   Initialize with intelligent approach selection"
        echo "    --auto         Let AI select optimal approach"
        echo "    --interactive  Show analysis and let user choose (default)"
        echo "    --swarm        Force Simple Swarm approach"
        echo "    --hive         Force Hive-Mind approach"
        echo "    --sparc        Force Hive-Mind + SPARC approach"
        echo "  start            Start all AI development systems"
        echo "  stop             Stop all AI development systems"
        echo "  status           Check status of all systems"
        echo "  orchestrate      Start 24/7 autonomous development"
        echo "  flow [cmd]       Run Claude-Flow commands"
        echo "  agent [cmd]      Run Agent OS commands"
        echo "  analyze [path]   Analyze project complexity"
        echo "  sync             Synchronize all configurations"
        echo "  help             Show this help message"
        echo ""
        echo "Examples:"
        echo "  ai-dev init --auto \"Build REST API\""
        echo "  ai-dev init --interactive"
        echo "  ai-dev analyze /path/to/project"
        ;;
    *)
        echo "Unknown command: $COMMAND"
        echo "Run 'ai-dev help' for usage information"
        exit 1
        ;;
esac
EOFD

chmod +x "$AI_DEV_HOME/bin/ai-dev"

# Create ai-dev-init script (wrapper for enhanced version)
cat > "$AI_DEV_HOME/bin/ai-dev-init" << 'EOFI'
#!/bin/bash

# AI Dev OS - Project Initializer
# Wrapper that calls the enhanced intelligent initializer if available

AI_DEV_HOME="$HOME/.ai-dev-os"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENHANCED_INIT=""

# Look for enhanced init in multiple locations
if [ -f "$SCRIPT_DIR/ai-dev-init-enhanced" ]; then
    ENHANCED_INIT="$SCRIPT_DIR/ai-dev-init-enhanced"
elif [ -f "$AI_DEV_HOME/bin/ai-dev-init-enhanced" ]; then
    ENHANCED_INIT="$AI_DEV_HOME/bin/ai-dev-init-enhanced"
elif [ -f "$(dirname "$(dirname "$SCRIPT_DIR")")/MASTER-WORKFLOW/bin/ai-dev-init-enhanced" ]; then
    ENHANCED_INIT="$(dirname "$(dirname "$SCRIPT_DIR")")/MASTER-WORKFLOW/bin/ai-dev-init-enhanced"
fi

# If enhanced version exists, use it
if [ -n "$ENHANCED_INIT" ] && [ -f "$ENHANCED_INIT" ]; then
    exec "$ENHANCED_INIT" "$@"
fi

# Otherwise, fallback to basic initialization
PROJECT_TYPE=$1
PROJECT_DIR=$(pwd)

detect_project_type() {
    if [ -f "package.json" ]; then
        if grep -q "react\|vue\|angular\|next" package.json; then
            echo "web-app"
        else
            echo "api-service"
        fi
    elif [ -f "requirements.txt" ] || [ -f "setup.py" ]; then
        echo "api-service"
    elif [ -f "go.mod" ]; then
        echo "api-service"
    elif [ -f "Cargo.toml" ]; then
        echo "cli-tool"
    elif [ -f "pom.xml" ] || [ -f "build.gradle" ]; then
        echo "api-service"
    else
        echo "unknown"
    fi
}

if [ -z "$PROJECT_TYPE" ]; then
    echo "Detecting project type..."
    PROJECT_TYPE=$(detect_project_type)
    if [ "$PROJECT_TYPE" = "unknown" ]; then
        echo "Could not detect project type. Please specify: web-app, api-service, cli-tool, etc."
        exit 1
    fi
    echo "Detected project type: $PROJECT_TYPE"
fi

echo "Initializing AI Development OS for $PROJECT_TYPE project..."

# Create project structure
mkdir -p .ai-dev .claude .agent-os/specs .claude-flow .tmux-orchestrator

# Copy template files
TEMPLATE_DIR="$AI_DEV_HOME/templates/$PROJECT_TYPE"
if [ -d "$TEMPLATE_DIR" ]; then
    cp -r "$TEMPLATE_DIR"/* .
    echo "✅ Applied $PROJECT_TYPE template"
else
    echo "⚠️  No template found for $PROJECT_TYPE, using defaults"
fi

# Create project configuration
cat > .ai-dev/project.json << EOF
{
  "projectType": "$PROJECT_TYPE",
  "projectDir": "$PROJECT_DIR",
  "initialized": "$(date -Iseconds)",
  "systems": {
    "agentOS": true,
    "claudeFlow": true,
    "tmuxOrchestrator": true,
    "subAgents": true
  }
}
EOF

# Create Claude settings with hooks
cat > .claude/settings.json << 'EOF'
{
  "dangerouslySkipPermissions": false,
  "hooks": {
    "user-prompt-submit-hook": "echo '$(date): User prompt submitted' >> .ai-dev/activity.log",
    "tool-call-hook": "echo '$(date): Tool ${TOOL_NAME} called' >> .ai-dev/activity.log",
    "model-response-hook": "echo '$(date): Model responded' >> .ai-dev/activity.log"
  },
  "autoSave": true,
  "maxConcurrentTools": 10
}
EOF

echo "✅ AI Development OS initialized for project"
echo ""
echo "Next steps:"
echo "1. Run 'ai-dev start' to start all systems"
echo "2. Run 'ai-dev orchestrate' for 24/7 autonomous development"
echo "3. Use '/plan-product' in Claude Code to begin planning"
EOFI

chmod +x "$AI_DEV_HOME/bin/ai-dev-init"

# Create ai-dev-status script
cat > "$AI_DEV_HOME/bin/ai-dev-status" << 'EOFS'
#!/bin/bash

# AI Dev OS - System Status Checker

echo ""
echo "AI Development OS Status"
echo "═══════════════════════════════════════════════════════"
echo ""

# Check Claude Code
if command -v claude &> /dev/null; then
    echo "Claude Code:          ✅ Installed"
else
    echo "Claude Code:          ❌ Not installed"
fi

# Check Agent OS
if [ -f "$HOME/.claude/commands/plan-product.md" ]; then
    AGENT_COUNT=$(ls -1 "$HOME/.claude/agents/" 2>/dev/null | wc -l)
    echo "Agent OS:             ✅ Configured ($AGENT_COUNT agents)"
else
    echo "Agent OS:             ❌ Not configured"
fi

# Check Claude-Flow
if [ -d "$HOME/.claude-flow" ]; then
    echo "Claude-Flow:          ✅ Installed"
else
    echo "Claude-Flow:          ❌ Not installed"
fi

# Check Tmux-Orchestrator
if [ -d "$HOME/.tmux-orchestrator" ]; then
    SESSIONS=$(tmux list-sessions 2>/dev/null | wc -l)
    if [ "$SESSIONS" -gt 0 ]; then
        echo "Tmux-Orchestrator:    ✅ Running ($SESSIONS sessions)"
    else
        echo "Tmux-Orchestrator:    ✅ Installed (no active sessions)"
    fi
else
    echo "Tmux-Orchestrator:    ❌ Not installed"
fi

# Check current project
if [ -f ".ai-dev/project.json" ]; then
    PROJECT_TYPE=$(grep projectType .ai-dev/project.json | cut -d'"' -f4)
    echo ""
    echo "Current Project:      ✅ $PROJECT_TYPE"
else
    echo ""
    echo "Current Project:      ⚠️  Not initialized (run 'ai-dev init')"
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo ""
EOFS

chmod +x "$AI_DEV_HOME/bin/ai-dev-status"

# Create ai-dev-orchestrate script
cat > "$AI_DEV_HOME/bin/ai-dev-orchestrate" << 'EOFO'
#!/bin/bash

# AI Dev OS - Autonomous Orchestration Starter

PROJECT_NAME=${1:-"autonomous-dev"}

echo "Starting 24/7 Autonomous Development Session..."
echo ""

# Create master orchestration session
tmux new-session -d -s "$PROJECT_NAME-orchestrator" -n "control"

# Create project manager window
tmux new-window -t "$PROJECT_NAME-orchestrator" -n "pm"

# Create engineer windows
tmux new-window -t "$PROJECT_NAME-orchestrator" -n "backend"
tmux new-window -t "$PROJECT_NAME-orchestrator" -n "frontend"
tmux new-window -t "$PROJECT_NAME-orchestrator" -n "testing"

# Send initial commands
tmux send-keys -t "$PROJECT_NAME-orchestrator:control" "claude --dangerously-skip-permissions" Enter
sleep 2
tmux send-keys -t "$PROJECT_NAME-orchestrator:control" "/plan-product" Enter

echo "✅ Autonomous orchestration started"
echo ""
echo "To view the session: tmux attach -t $PROJECT_NAME-orchestrator"
echo "To stop: tmux kill-session -t $PROJECT_NAME-orchestrator"
EOFO

chmod +x "$AI_DEV_HOME/bin/ai-dev-orchestrate"

print_success "Integration scripts created"

# Step 7.5: Install Intelligence Engine (if available)
print_header "Step 7.5: Installing Intelligence Engine"

MASTER_WORKFLOW_DIR="$(dirname "$(realpath "$0")")"
if [ -d "$MASTER_WORKFLOW_DIR/intelligence-engine" ]; then
    print_info "Installing intelligence engine components..."
    
    # Copy intelligence engine to AI Dev Home
    cp -r "$MASTER_WORKFLOW_DIR/intelligence-engine" "$AI_DEV_HOME/"
    
    # Copy enhanced init script
    if [ -f "$MASTER_WORKFLOW_DIR/bin/ai-dev-init-enhanced" ]; then
        cp "$MASTER_WORKFLOW_DIR/bin/ai-dev-init-enhanced" "$AI_DEV_HOME/bin/"
        chmod +x "$AI_DEV_HOME/bin/ai-dev-init-enhanced"
    fi
    
    print_success "Intelligence engine installed"
    print_info "Enhanced features available:"
    echo "  • Automatic project complexity analysis"
    echo "  • Intelligent Claude Flow approach selection"
    echo "  • Interactive mode with AI recommendations"
    echo "  • Project stage detection (idea/early/active/mature)"
else
    print_warning "Intelligence engine not found in $MASTER_WORKFLOW_DIR"
    print_info "Standard initialization will be used"
fi

# Step 8: Configure Claude Code Integration
print_header "Step 8: Configuring Claude Code Integration"

# Create master integration configuration
cat > "$CLAUDE_HOME/integrations.json" << 'EOFC'
{
  "version": "1.0.0",
  "systems": {
    "agent-os": {
      "enabled": true,
      "triggers": ["new-project", "planning-needed", "spec-required"],
      "commands": ["plan-product", "create-spec", "analyze-product", "execute-tasks"],
      "auto-invoke": {
        "on-new-project": "plan-product",
        "on-feature-request": "create-spec"
      }
    },
    "claude-flow": {
      "enabled": true,
      "cli": "npx claude-flow@alpha",
      "triggers": ["complex-task", "multi-agent-needed", "parallel-work"],
      "modes": {
        "swarm": "quick-single-objective",
        "hive-mind": "complex-multi-feature"
      }
    },
    "tmux-orchestrator": {
      "enabled": true,
      "triggers": ["long-running", "autonomous-needed", "schedule-required"],
      "capabilities": ["24-7-operation", "session-persistence", "cross-project"],
      "auto-start": false
    },
    "sub-agents": {
      "enabled": true,
      "available": [
        "test-runner",
        "context-fetcher",
        "git-workflow",
        "file-creator",
        "date-checker",
        "code-reviewer",
        "security-auditor",
        "architect"
      ]
    }
  },
  "routing": {
    "simple-task": "direct-execution",
    "complex-task": "claude-flow",
    "planning-required": "agent-os-first",
    "long-running": "tmux-orchestrator",
    "specialized": "sub-agent-delegation"
  },
  "coordination": {
    "primary-interface": "claude-code",
    "orchestrator": "tmux-orchestrator",
    "context-provider": "agent-os",
    "workflow-engine": "claude-flow",
    "executors": "sub-agents"
  }
}
EOFC

# Update/Create global Claude settings
if [ -f "$CLAUDE_HOME/settings.json" ]; then
    print_warning "Backing up existing Claude settings to settings.json.backup"
    cp "$CLAUDE_HOME/settings.json" "$CLAUDE_HOME/settings.json.backup"
fi

cat > "$CLAUDE_HOME/settings.json" << 'EOFCS'
{
  "dangerouslySkipPermissions": false,
  "hooks": {
    "user-prompt-submit-hook": "echo '[AI-DEV-OS] User prompt: ${USER_PROMPT}' >> ~/.ai-dev-os/logs/activity.log",
    "tool-call-hook": "echo '[AI-DEV-OS] Tool called: ${TOOL_NAME}' >> ~/.ai-dev-os/logs/activity.log",
    "model-response-hook": "echo '[AI-DEV-OS] Response generated' >> ~/.ai-dev-os/logs/activity.log"
  },
  "autoSave": true,
  "maxConcurrentTools": 10,
  "integrations": {
    "configPath": "~/.claude/integrations.json",
    "autoLoad": true
  }
}
EOFCS

print_success "Claude Code integration configured"

# Step 9: Add to PATH
print_header "Step 9: Adding AI Dev OS to PATH"

# Detect shell
SHELL_RC="$HOME/.bashrc"
if [ -n "$ZSH_VERSION" ]; then
    SHELL_RC="$HOME/.zshrc"
fi

# Check if already in PATH
if ! grep -q "ai-dev-os/bin" "$SHELL_RC"; then
    echo "" >> "$SHELL_RC"
    echo "# AI Development OS" >> "$SHELL_RC"
    echo "export PATH=\"\$HOME/.ai-dev-os/bin:\$PATH\"" >> "$SHELL_RC"
    echo "export AI_DEV_HOME=\"\$HOME/.ai-dev-os\"" >> "$SHELL_RC"
    print_success "Added to PATH in $SHELL_RC"
else
    print_warning "Already in PATH"
fi

# Step 10: Create Sample Templates
print_header "Step 10: Creating Project Templates"

# Web App Template
mkdir -p "$AI_DEV_HOME/templates/web-app/.claude/agents"
cat > "$AI_DEV_HOME/templates/web-app/.claude/agents/frontend-specialist.md" << 'EOFT'
---
name: frontend-specialist
description: Expert in modern frontend development
tools: Read, Write, Edit, Bash, Grep
---

You are a frontend development specialist with expertise in:
- React, Vue, Angular, and modern frameworks
- Component architecture and state management
- Responsive design and CSS frameworks
- Performance optimization and accessibility
- Testing with Jest, Cypress, and other tools

Focus on creating clean, maintainable, and performant frontend code.
EOFT

# API Service Template
mkdir -p "$AI_DEV_HOME/templates/api-service/.claude/agents"
cat > "$AI_DEV_HOME/templates/api-service/.claude/agents/api-architect.md" << 'EOFT'
---
name: api-architect
description: Expert in API design and backend development
tools: Read, Write, Edit, Bash, Grep
---

You are an API architecture specialist with expertise in:
- RESTful and GraphQL API design
- Microservices architecture
- Database design and optimization
- Authentication and authorization
- API documentation and testing

Focus on creating scalable, secure, and well-documented APIs.
EOFT

print_success "Project templates created"

# Step 11: Environment Variables
print_header "Step 11: Setting Environment Variables"

if [ -z "$ANTHROPIC_API_KEY" ]; then
    print_warning "ANTHROPIC_API_KEY not set"
    echo "Please add your API key to $SHELL_RC:"
    echo "export ANTHROPIC_API_KEY='your-api-key'"
else
    print_success "ANTHROPIC_API_KEY is configured"
fi

# Final Setup Summary
print_header "Installation Complete! 🎉"

echo -e "${GREEN}AI Development OS has been successfully installed!${NC}"
echo ""
echo -e "${CYAN}Installed Components:${NC}"
echo "  • Claude Code (Global AI Interface)"
echo "  • Agent OS (Planning & Specifications)"
echo "  • Claude-Flow (Multi-Agent Coordination)"
echo "  • Tmux-Orchestrator (24/7 Autonomous Operation)"
echo "  • Integration Scripts (ai-dev CLI)"
echo ""
echo -e "${CYAN}Directory Structure:${NC}"
echo "  • ~/.ai-dev-os/       (Main installation)"
echo "  • ~/.claude/          (Claude Code & integrations)"
echo "  • ~/.claude-flow/     (Claude-Flow memory)"
echo "  • ~/.tmux-orchestrator/ (Tmux sessions)"
echo ""
echo -e "${CYAN}Next Steps:${NC}"
echo "  1. Reload your shell: source $SHELL_RC"
echo "  2. Navigate to a project directory"
echo "  3. Run: ai-dev init"
echo "  4. Start development: ai-dev start"
echo "  5. For 24/7 mode: ai-dev orchestrate"
echo ""
echo -e "${YELLOW}Important:${NC}"
echo "  • Set ANTHROPIC_API_KEY if not already done"
echo "  • Run 'ai-dev help' for all available commands"
echo "  • Check status with 'ai-dev status'"
echo ""
echo -e "${BOLD}${MAGENTA}Welcome to the future of AI-powered development! 🚀${NC}"