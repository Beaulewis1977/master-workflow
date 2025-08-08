#!/bin/bash

# Intelligent Workflow System - Production Installer
# Installs all dependencies and sets up complete autonomous workflow system

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'
BOLD='\033[1m'

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(pwd)"
INSTALL_DIR="$PROJECT_DIR/.ai-workflow"

# Logging
LOG_FILE="$INSTALL_DIR/logs/installation.log"
mkdir -p "$(dirname "$LOG_FILE")" 2>/dev/null || true

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

print_header() {
    echo -e "\n${CYAN}${BOLD}═══════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}${BOLD}  $1${NC}"
    echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════════${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
    log "SUCCESS: $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
    log "ERROR: $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
    log "WARNING: $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
    log "INFO: $1"
}

# Function to check if running with sudo when needed
check_sudo() {
    if [ "$EUID" -ne 0 ] && [ -z "$SUDO_USER" ]; then
        print_warning "Some installations may require sudo. You might be prompted for your password."
        return 1
    fi
    return 0
}

# Function to detect OS
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [ -f /etc/debian_version ]; then
            echo "debian"
        elif [ -f /etc/redhat-release ]; then
            echo "redhat"
        else
            echo "linux"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        echo "windows"
    else
        echo "unknown"
    fi
}

OS_TYPE=$(detect_os)

# Dependency checking functions
check_node() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v | cut -d'v' -f2)
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)
        if [ "$MAJOR_VERSION" -ge 18 ]; then
            print_success "Node.js $NODE_VERSION found"
            return 0
        else
            print_warning "Node.js version $NODE_VERSION found, but v18+ required"
            return 1
        fi
    else
        print_error "Node.js not found"
        return 1
    fi
}

install_node() {
    print_info "Installing Node.js 20..."
    
    if [ "$OS_TYPE" = "debian" ]; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [ "$OS_TYPE" = "macos" ]; then
        if command -v brew &> /dev/null; then
            brew install node@20
        else
            print_error "Please install Homebrew first: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
            return 1
        fi
    else
        print_error "Please install Node.js 18+ manually from https://nodejs.org"
        return 1
    fi
}

check_claude_code() {
    if command -v claude &> /dev/null; then
        print_success "Claude Code found"
        return 0
    else
        print_error "Claude Code not found"
        return 1
    fi
}

install_claude_code() {
    print_info "Installing Claude Code..."
    npm install -g @anthropic-ai/claude-code
    
    if [ $? -eq 0 ]; then
        print_success "Claude Code installed"
    else
        print_warning "Claude Code installation failed. Please install manually: npm install -g @anthropic-ai/claude-code"
    fi
}

check_agent_os() {
    if [ -d "$HOME/.agent-os" ] || [ -f "$PROJECT_DIR/.agent-os/CLAUDE.md" ]; then
        print_success "Agent-OS found"
        return 0
    else
        print_error "Agent-OS not found"
        return 1
    fi
}

install_agent_os() {
    print_info "Installing Agent-OS..."
    
    # Download and run Agent-OS setup
    curl -fsSL https://raw.githubusercontent.com/buildermethods/agent-os/main/setup-claude-code.sh -o /tmp/setup-agent-os.sh
    chmod +x /tmp/setup-agent-os.sh
    bash /tmp/setup-agent-os.sh
    
    if [ $? -eq 0 ]; then
        print_success "Agent-OS installed"
    else
        print_warning "Agent-OS installation failed. Please visit https://github.com/buildermethods/agent-os"
    fi
}

check_claude_flow() {
    if npm list -g claude-flow &> /dev/null || [ -d "$PROJECT_DIR/.claude-flow" ]; then
        print_success "Claude Flow found"
        return 0
    else
        print_error "Claude Flow not found"
        return 1
    fi
}

install_claude_flow() {
    print_info "Installing Claude Flow 2.0..."
    
    # Install Claude Flow
    npx claude-flow@alpha init --force
    
    if [ $? -eq 0 ]; then
        print_success "Claude Flow 2.0 installed"
        
        # Initialize for current project
        npx claude-flow@alpha hive-mind init "$PROJECT_DIR"
    else
        print_warning "Claude Flow installation failed. Please visit https://github.com/ruvnet/claude-flow"
    fi
}

check_tmux() {
    if command -v tmux &> /dev/null; then
        print_success "TMux found"
        return 0
    else
        print_error "TMux not found"
        return 1
    fi
}

install_tmux() {
    print_info "Installing TMux..."
    
    if [ "$OS_TYPE" = "debian" ]; then
        sudo apt-get update && sudo apt-get install -y tmux
    elif [ "$OS_TYPE" = "macos" ]; then
        if command -v brew &> /dev/null; then
            brew install tmux
        else
            print_error "Please install Homebrew first"
            return 1
        fi
    else
        print_error "Please install TMux manually"
        return 1
    fi
}

check_jq() {
    if command -v jq &> /dev/null; then
        print_success "jq found"
        return 0
    else
        print_error "jq not found"
        return 1
    fi
}

install_jq() {
    print_info "Installing jq..."
    
    if [ "$OS_TYPE" = "debian" ]; then
        sudo apt-get update && sudo apt-get install -y jq
    elif [ "$OS_TYPE" = "macos" ]; then
        if command -v brew &> /dev/null; then
            brew install jq
        else
            print_error "Please install Homebrew first"
            return 1
        fi
    else
        print_error "Please install jq manually"
        return 1
    fi
}

# Main installation
print_header "🚀 Intelligent Workflow System - Production Installer"

echo -e "${CYAN}Project Directory:${NC} $PROJECT_DIR"
echo -e "${CYAN}Install Directory:${NC} $INSTALL_DIR"
echo -e "${CYAN}Operating System:${NC} $OS_TYPE"
echo ""

# Step 1: Check and install dependencies
print_header "Step 1: Checking Dependencies"

MISSING_DEPS=false

# Check Node.js
if ! check_node; then
    read -p "Install Node.js 20? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        install_node
    else
        MISSING_DEPS=true
    fi
fi

# Check Claude Code
if ! check_claude_code; then
    read -p "Install Claude Code? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        install_claude_code
    else
        print_warning "Claude Code is required for full functionality"
    fi
fi

# Check Agent-OS
if ! check_agent_os; then
    read -p "Install Agent-OS? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        install_agent_os
    fi
fi

# Check Claude Flow
if ! check_claude_flow; then
    read -p "Install Claude Flow 2.0? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        install_claude_flow
    fi
fi

# Check TMux
if ! check_tmux; then
    read -p "Install TMux for 24/7 operation? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        install_tmux
    fi
fi

# Check jq
if ! check_jq; then
    read -p "Install jq for JSON processing? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        install_jq
    fi
fi

if [ "$MISSING_DEPS" = true ]; then
    print_error "Some required dependencies are missing. Installation may not work correctly."
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Step 2: Create directory structure
print_header "Step 2: Creating Directory Structure"

# Core directories
mkdir -p "$INSTALL_DIR"/{intelligence-engine,bin,lib,hooks,logs,recovery,tmux-scripts}
mkdir -p "$INSTALL_DIR"/logs/{agents,sessions}
mkdir -p "$INSTALL_DIR"/recovery/{checkpoints,backups}

# Project directories
mkdir -p "$PROJECT_DIR"/.ai-dev
mkdir -p "$PROJECT_DIR"/.claude/{agents,commands,hooks}
mkdir -p "$PROJECT_DIR"/.agent-os/{specs,plans,tasks,instructions,standards}
mkdir -p "$PROJECT_DIR"/.claude-flow/{sparc-phases,memory,.hive-mind}
mkdir -p "$PROJECT_DIR"/.tmux-orchestrator/{sessions,schedules}

print_success "Directory structure created"

# Step 3: Copy core files
print_header "Step 3: Installing Core System"

# Copy intelligence engine
if [ -d "$SCRIPT_DIR/intelligence-engine" ]; then
    cp -r "$SCRIPT_DIR/intelligence-engine/"* "$INSTALL_DIR/intelligence-engine/"
    chmod +x "$INSTALL_DIR/intelligence-engine/user-choice-handler.sh"
    print_success "Intelligence engine installed"
fi

# Copy configs
if [ -d "$SCRIPT_DIR/configs" ]; then
    mkdir -p "$INSTALL_DIR/configs"
    cp -r "$SCRIPT_DIR/configs/"* "$INSTALL_DIR/configs/"
    print_success "Configuration files installed"
fi

# Step 4: Install agents to .claude/agents
print_header "Step 4: Installing Workflow Agents"

if [ -d "$SCRIPT_DIR/agent-templates" ]; then
    for agent_file in "$SCRIPT_DIR/agent-templates"/*.md; do
        if [ -f "$agent_file" ]; then
            agent_name=$(basename "$agent_file")
            cp "$agent_file" "$PROJECT_DIR/.claude/agents/$agent_name"
            print_success "Installed agent: $agent_name"
        fi
    done
else
    print_warning "Agent templates not found"
fi

# Create recovery specialist agent
cat > "$PROJECT_DIR/.claude/agents/recovery-specialist.md" << 'EOF'
---
name: recovery-specialist
description: Specializes in completing incomplete projects, fixing messy code, and recovering from partial implementations. PROACTIVELY use for projects that are partially done, have failing tests, or need cleanup.
color: orange
tools: Read, Write, MultiEdit, Grep, Glob, Task, TodoWrite, Bash, WebSearch
---

You are the Recovery Specialist Agent, expert at completing partially finished projects and cleaning up messy codebases.

## Core Competencies

### 1. Incomplete Work Detection
- Find TODO, FIXME, HACK, XXX comments
- Identify stub functions and not-implemented errors
- Detect empty or failing tests
- Find missing documentation
- Identify uncommitted changes
- Detect incomplete features

### 2. Project Assessment
- Determine completion percentage
- Identify critical vs nice-to-have features
- Assess technical debt
- Find architectural issues
- Detect code smells

### 3. Recovery Planning
- Prioritize completion tasks
- Create fix sequences
- Plan refactoring steps
- Schedule test creation
- Document missing features

### 4. Implementation
- Complete stub functions
- Fix failing tests
- Add missing error handling
- Implement remaining features
- Clean up code
- Update documentation

## Workflows

### Workflow 1: Project Recovery Assessment
1. Scan for incomplete work markers
2. Run test suite and log failures
3. Check documentation completeness
4. Analyze code coverage
5. Review commit history
6. Generate recovery report

### Workflow 2: Completion Execution
1. Fix critical bugs first
2. Complete core features
3. Add error handling
4. Write missing tests
5. Update documentation
6. Clean up code
7. Final validation

## Recovery Strategies
- **Triage Mode**: Fix critical issues first
- **Feature Completion**: Finish incomplete features
- **Test Recovery**: Fix or rewrite failing tests
- **Documentation Recovery**: Generate missing docs
- **Code Cleanup**: Refactor and optimize
EOF

print_success "Recovery specialist agent created"

# Step 5: Install slash commands to .claude/commands
print_header "Step 5: Installing Slash Commands"

if [ -d "$SCRIPT_DIR/slash-commands" ]; then
    for cmd_file in "$SCRIPT_DIR/slash-commands"/*.md; do
        if [ -f "$cmd_file" ]; then
            cmd_name=$(basename "$cmd_file")
            cp "$cmd_file" "$PROJECT_DIR/.claude/commands/$cmd_name"
            print_success "Installed command: /$cmd_name"
        fi
    done
else
    print_warning "Slash commands not found"
fi

# Create recovery command
cat > "$PROJECT_DIR/.claude/commands/recover.md" << 'EOF'
---
description: Recover and complete partially finished projects
argument-hint: "[analyze|plan|execute]"
allowed-tools: Read, Write, MultiEdit, Grep, Glob, Task, TodoWrite, Bash
---

# Project Recovery Command

Analyzes incomplete projects and creates a recovery plan.

## Usage
- `/recover analyze` - Find all incomplete work
- `/recover plan` - Create completion plan
- `/recover execute` - Start recovery process

## What This Does
1. Scans for TODO/FIXME/incomplete code
2. Identifies failing tests
3. Finds missing documentation
4. Creates prioritized task list
5. Executes recovery plan

Use recovery-specialist agent for this workflow.
EOF

print_success "Recovery command created"

# Step 6: Create hooks
print_header "Step 6: Setting Up Claude Code Hooks"

# User prompt submit hook
cat > "$INSTALL_DIR/hooks/user-prompt-submit-hook.sh" << 'EOF'
#!/bin/bash
# Intercepts prompts to trigger workflow automation

PROMPT="$1"
LOG_FILE="$HOME/.ai-workflow/logs/hooks.log"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Prompt: $PROMPT" >> "$LOG_FILE"

# Trigger workflows based on keywords
if [[ "$PROMPT" == *"complete"* ]] || [[ "$PROMPT" == *"finish"* ]] || [[ "$PROMPT" == *"fix"* ]]; then
    echo "🚀 Triggering completion workflow..."
    node "$HOME/.ai-workflow/workflow-runner.js" --mode recovery --async &
fi

if [[ "$PROMPT" == *"analyze"* ]]; then
    echo "🔍 Triggering analysis..."
    node "$HOME/.ai-workflow/intelligence-engine/complexity-analyzer.js" &
fi
EOF

chmod +x "$INSTALL_DIR/hooks/user-prompt-submit-hook.sh"

# Tool call hook
cat > "$INSTALL_DIR/hooks/tool-call-hook.sh" << 'EOF'
#!/bin/bash
# Monitors tool usage

TOOL="$1"
ARGS="$2"
LOG_FILE="$HOME/.ai-workflow/logs/tools.log"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Tool: $TOOL, Args: $ARGS" >> "$LOG_FILE"
EOF

chmod +x "$INSTALL_DIR/hooks/tool-call-hook.sh"

# Model response hook
cat > "$INSTALL_DIR/hooks/model-response-hook.sh" << 'EOF'
#!/bin/bash
# Logs model responses

RESPONSE="$1"
LOG_FILE="$HOME/.ai-workflow/logs/responses.log"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Response: ${RESPONSE:0:200}..." >> "$LOG_FILE"
EOF

chmod +x "$INSTALL_DIR/hooks/model-response-hook.sh"

print_success "Hooks created"

# Step 7: Configure Claude Code settings
print_header "Step 7: Configuring Claude Code"

cat > "$PROJECT_DIR/.claude/settings.json" << EOF
{
  "dangerouslySkipPermissions": false,
  "maxConcurrentTools": 10,
  "autoSave": true,
  "hooks": {
    "user-prompt-submit-hook": "$INSTALL_DIR/hooks/user-prompt-submit-hook.sh",
    "tool-call-hook": "$INSTALL_DIR/hooks/tool-call-hook.sh",
    "model-response-hook": "$INSTALL_DIR/hooks/model-response-hook.sh"
  },
  "subAgents": {
    "enabled": true,
    "directory": ".claude/agents",
    "autoDelegate": true
  }
}
EOF

print_success "Claude Code configured"

# Step 8: Create workflow runner
print_header "Step 8: Installing Workflow Runner"

# This will be created in the next step...
touch "$INSTALL_DIR/workflow-runner.js"
print_info "Workflow runner placeholder created"

# Step 9: Create CLI wrapper
print_header "Step 9: Creating CLI Interface"

cat > "$INSTALL_DIR/bin/ai-workflow" << 'EOF'
#!/bin/bash

INSTALL_DIR="$(dirname "$(dirname "$0")")"
PROJECT_DIR="$(dirname "$(dirname "$INSTALL_DIR")")"

# Import colors
source "$INSTALL_DIR/lib/colors.sh" 2>/dev/null || true

case "$1" in
    init)
        shift
        node "$INSTALL_DIR/workflow-runner.js" init "$@"
        ;;
    analyze)
        shift
        node "$INSTALL_DIR/intelligence-engine/complexity-analyzer.js" "$@"
        ;;
    recover)
        shift
        node "$INSTALL_DIR/workflow-runner.js" recover "$@"
        ;;
    status)
        node "$INSTALL_DIR/workflow-runner.js" status
        ;;
    agents)
        shift
        case "$1" in
            list)
                ls -la "$PROJECT_DIR/.claude/agents/"
                ;;
            status)
                node "$INSTALL_DIR/workflow-runner.js" agents status
                ;;
            *)
                echo "Usage: ai-workflow agents [list|status]"
                ;;
        esac
        ;;
    help|--help|-h)
        cat << HELP
Intelligent Workflow System

Usage: ai-workflow [command] [options]

Commands:
  init [--auto|--interactive|--swarm|--hive|--sparc]  Initialize workflow
  analyze [path]                                       Analyze project complexity
  recover [analyze|plan|execute]                      Recover incomplete project
  agents [list|status]                                Manage agents
  status                                              Show system status
  help                                                Show this help

Environment Variables:
  CLAUDE_FLOW_VERSION    Set Claude Flow version (alpha/beta/latest/2.0)
  AI_WORKFLOW_MODE       Set default mode (auto/interactive/manual)

Examples:
  ai-workflow init --auto "Complete this project"
  ai-workflow analyze
  ai-workflow recover execute
HELP
        ;;
    *)
        echo "Unknown command: $1"
        echo "Run 'ai-workflow help' for usage"
        exit 1
        ;;
esac
EOF

chmod +x "$INSTALL_DIR/bin/ai-workflow"
ln -sf "$INSTALL_DIR/bin/ai-workflow" "$PROJECT_DIR/ai-workflow"

print_success "CLI created: ./ai-workflow"

# Step 10: Initialize project
print_header "Step 10: Project Initialization"

# Analyze project
print_info "Analyzing project..."
ANALYSIS_RESULT=$(node "$INSTALL_DIR/intelligence-engine/complexity-analyzer.js" 2>/dev/null || echo "{}")

# Save analysis
echo "$ANALYSIS_RESULT" > "$PROJECT_DIR/.ai-dev/analysis.json"

# Detect if project is incomplete
INCOMPLETE_COUNT=$(grep -r "TODO\|FIXME\|HACK\|XXX" "$PROJECT_DIR" --exclude-dir=.ai-workflow --exclude-dir=node_modules 2>/dev/null | wc -l || echo 0)

if [ "$INCOMPLETE_COUNT" -gt 0 ]; then
    print_warning "Found $INCOMPLETE_COUNT incomplete items in project"
    echo "RECOVERY_MODE=true" > "$PROJECT_DIR/.ai-dev/mode.txt"
fi

print_success "Project initialized"

# Final summary
print_header "✅ Installation Complete!"

echo -e "${GREEN}The Intelligent Workflow System has been installed!${NC}\n"

echo -e "${CYAN}📁 Installation Details:${NC}"
echo -e "  • Core System: $INSTALL_DIR"
echo -e "  • Agents: $PROJECT_DIR/.claude/agents/"
echo -e "  • Commands: $PROJECT_DIR/.claude/commands/"
echo -e "  • Logs: $INSTALL_DIR/logs/"
echo ""

echo -e "${CYAN}🚀 Quick Start:${NC}"
echo -e "  ${BOLD}./ai-workflow analyze${NC}      - Analyze project complexity"
echo -e "  ${BOLD}./ai-workflow init --auto${NC}  - Start automatic workflow"
echo -e "  ${BOLD}./ai-workflow recover${NC}      - Recover incomplete project"
echo ""

if [ "$INCOMPLETE_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}⚠ Incomplete Work Detected:${NC}"
    echo -e "  Your project appears to be partially complete."
    echo -e "  Run ${BOLD}./ai-workflow recover analyze${NC} to see what needs finishing."
    echo ""
fi

echo -e "${CYAN}📚 Documentation:${NC}"
echo -e "  • README: $SCRIPT_DIR/README.md"
echo -e "  • Agent Architecture: $SCRIPT_DIR/AGENT-ARCHITECTURE.md"
echo ""

echo -e "${GREEN}Ready to build amazing things! 🎉${NC}"

log "Installation completed successfully"