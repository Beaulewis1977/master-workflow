#!/bin/bash

# Intelligent Workflow System - Modular Interactive Installer
# Allows users to select which components to install
# Collects initial project prompt for immediate execution

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
DIM='\033[2m'

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(pwd)"
INSTALL_DIR="$PROJECT_DIR/.ai-workflow"

# Component flags (default all disabled except core)
INSTALL_CORE=true
INSTALL_CLAUDE_CODE=false
INSTALL_AGENT_OS=false
INSTALL_CLAUDE_FLOW=false
INSTALL_TMUX=false

# Configuration
CONFIG_FILE="$INSTALL_DIR/installation-config.json"
PROMPT_FILE="$INSTALL_DIR/initial-prompt.md"

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

# Component selection menu
show_component_menu() {
    clear
    echo -e "${CYAN}${BOLD}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}${BOLD}║     Intelligent Workflow System - Modular Installation      ║${NC}"
    echo -e "${CYAN}${BOLD}╠══════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${CYAN}${BOLD}║                                                              ║${NC}"
    echo -e "${CYAN}${BOLD}║  Select components to install:                              ║${NC}"
    echo -e "${CYAN}${BOLD}║                                                              ║${NC}"
    
    # Core (always selected)
    echo -e "${CYAN}${BOLD}║  ${GREEN}[✓]${CYAN} Core Workflow System ${DIM}(required)${NC}                       ${CYAN}${BOLD}║${NC}"
    
    # Claude Code
    if [ "$INSTALL_CLAUDE_CODE" = true ]; then
        echo -e "${CYAN}${BOLD}║  ${GREEN}[✓]${NC} Claude Code Integration                              ${CYAN}${BOLD}║${NC}"
    else
        echo -e "${CYAN}${BOLD}║  ${DIM}[ ]${NC} Claude Code Integration                              ${CYAN}${BOLD}║${NC}"
    fi
    
    # Agent-OS
    if [ "$INSTALL_AGENT_OS" = true ]; then
        echo -e "${CYAN}${BOLD}║  ${GREEN}[✓]${NC} Agent-OS Planning System                             ${CYAN}${BOLD}║${NC}"
    else
        echo -e "${CYAN}${BOLD}║  ${DIM}[ ]${NC} Agent-OS Planning System                             ${CYAN}${BOLD}║${NC}"
    fi
    
    # Claude Flow
    if [ "$INSTALL_CLAUDE_FLOW" = true ]; then
        echo -e "${CYAN}${BOLD}║  ${GREEN}[✓]${NC} Claude Flow 2.0 Multi-Agent                          ${CYAN}${BOLD}║${NC}"
    else
        echo -e "${CYAN}${BOLD}║  ${DIM}[ ]${NC} Claude Flow 2.0 Multi-Agent                          ${CYAN}${BOLD}║${NC}"
    fi
    
    # TMux
    if [ "$INSTALL_TMUX" = true ]; then
        echo -e "${CYAN}${BOLD}║  ${GREEN}[✓]${NC} TMux Orchestrator ${DIM}(24/7 operation)${NC}                  ${CYAN}${BOLD}║${NC}"
    else
        echo -e "${CYAN}${BOLD}║  ${DIM}[ ]${NC} TMux Orchestrator ${DIM}(24/7 operation)${NC}                  ${CYAN}${BOLD}║${NC}"
    fi
    
    echo -e "${CYAN}${BOLD}║                                                              ║${NC}"
    echo -e "${CYAN}${BOLD}║  ${YELLOW}[1]${NC} Toggle Claude Code    ${YELLOW}[4]${NC} Toggle TMux               ${CYAN}${BOLD}║${NC}"
    echo -e "${CYAN}${BOLD}║  ${YELLOW}[2]${NC} Toggle Agent-OS       ${YELLOW}[A]${NC} Select All                ${CYAN}${BOLD}║${NC}"
    echo -e "${CYAN}${BOLD}║  ${YELLOW}[3]${NC} Toggle Claude Flow    ${YELLOW}[N]${NC} Select None (Core only)   ${CYAN}${BOLD}║${NC}"
    echo -e "${CYAN}${BOLD}║                                                              ║${NC}"
    echo -e "${CYAN}${BOLD}║  ${GREEN}[C]${NC} Continue with installation                            ${CYAN}${BOLD}║${NC}"
    echo -e "${CYAN}${BOLD}║  ${RED}[Q]${NC} Quit                                                  ${CYAN}${BOLD}║${NC}"
    echo -e "${CYAN}${BOLD}║                                                              ║${NC}"
    echo -e "${CYAN}${BOLD}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Handle component selection
handle_component_selection() {
    while true; do
        show_component_menu
        read -n 1 -p "Select option: " choice
        echo ""
        
        case $choice in
            1) INSTALL_CLAUDE_CODE=$([ "$INSTALL_CLAUDE_CODE" = true ] && echo false || echo true) ;;
            2) INSTALL_AGENT_OS=$([ "$INSTALL_AGENT_OS" = true ] && echo false || echo true) ;;
            3) INSTALL_CLAUDE_FLOW=$([ "$INSTALL_CLAUDE_FLOW" = true ] && echo false || echo true) ;;
            4) INSTALL_TMUX=$([ "$INSTALL_TMUX" = true ] && echo false || echo true) ;;
            A|a) 
                INSTALL_CLAUDE_CODE=true
                INSTALL_AGENT_OS=true
                INSTALL_CLAUDE_FLOW=true
                INSTALL_TMUX=true
                ;;
            N|n)
                INSTALL_CLAUDE_CODE=false
                INSTALL_AGENT_OS=false
                INSTALL_CLAUDE_FLOW=false
                INSTALL_TMUX=false
                ;;
            C|c) break ;;
            Q|q) 
                echo "Installation cancelled."
                exit 0
                ;;
            *) echo "Invalid option. Please try again." ;;
        esac
    done
}

# Collect initial prompt and optional images, plus project instructions
collect_initial_prompt() {
    print_header "Project Requirements & Initial Prompt"
    
    echo -e "${CYAN}Enter your project requirements and initial task.${NC}"
    echo -e "${DIM}You can paste or type multiple lines. Press Ctrl+D when done.${NC}"
    echo -e "${DIM}This prompt will be saved and can be executed immediately after installation.${NC}"
    echo ""
    echo -e "${YELLOW}────────────────────────────────────────────────────────────────${NC}"
    
    # Collect multi-line input
    PROMPT_CONTENT=$(cat)
    
    # Save prompt
    mkdir -p "$(dirname "$PROMPT_FILE")"
    echo "$PROMPT_CONTENT" > "$PROMPT_FILE"
    
    # Optional: attach images directory and embed references
    echo ""
    read -p "Would you like to attach images to the prompt? (y/n): " -n 1 -r
    echo ""
    ATTACH_IMAGES_DIR=""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter a directory path with images (jpg|jpeg|png|gif|webp): " ATTACH_IMAGES_DIR
        if [ -n "$ATTACH_IMAGES_DIR" ] && [ -d "$ATTACH_IMAGES_DIR" ]; then
            IMG_DEST="$INSTALL_DIR/assets/images"
            mkdir -p "$IMG_DEST"
            # Copy supported image files (POSIX)
            BEFORE_COUNT=$(ls -1 "$IMG_DEST" 2>/dev/null | wc -l | tr -d ' ')
            find "$ATTACH_IMAGES_DIR" -maxdepth 1 -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.gif" -o -iname "*.webp" \) -exec cp {} "$IMG_DEST" \; 2>/dev/null || true
            AFTER_COUNT=$(ls -1 "$IMG_DEST" 2>/dev/null | wc -l | tr -d ' ')
            # Windows PowerShell fallback if no files copied
            if [ "$AFTER_COUNT" = "$BEFORE_COUNT" ]; then
                if command -v powershell >/dev/null 2>&1; then
                    powershell -NoProfile -Command "\
                        $src = \"$ATTACH_IMAGES_DIR\"; \
                        $dst = \"$IMG_DEST\"; \
                        New-Item -ItemType Directory -Force -Path $dst | Out-Null; \
                        Get-ChildItem -Path $src -File | Where-Object { $_.Extension -match '(?i)\.(jpg|jpeg|png|gif|webp)$' } | ForEach-Object { Copy-Item $_.FullName -Destination $dst -Force } \
                    " 2>/dev/null || true
                fi
            fi
            # Append references to prompt
            echo -e "\n\n## Attached Images" >> "$PROMPT_FILE"
            for f in "$IMG_DEST"/*; do
                [ -f "$f" ] || continue
                rel=".ai-workflow/assets/images/$(basename "$f")"
                echo "- ![image]($rel)" >> "$PROMPT_FILE"
            done
            print_success "Images attached to prompt"
        else
            print_warning "Directory not found. Skipping image attachment."
        fi
    fi

    # Collect project instructions
    echo ""
    read -p "Would you like to add project-specific instructions now? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Enter project instructions. Press Ctrl+D when done."
        PROJECT_INSTRUCTIONS=$(cat)
        mkdir -p "$PROJECT_DIR/.ai-dev"
        echo "$PROJECT_INSTRUCTIONS" > "$PROJECT_DIR/.ai-dev/project-instructions.md"
        print_success "Project instructions saved to .ai-dev/project-instructions.md"
    fi
    
    # Show summary
    PROMPT_LENGTH=${#PROMPT_CONTENT}
    PROMPT_LINES=$(echo "$PROMPT_CONTENT" | wc -l)
    
    echo -e "${YELLOW}────────────────────────────────────────────────────────────────${NC}"
    echo ""
    print_success "Prompt saved: $PROMPT_LINES lines, $PROMPT_LENGTH characters"
    
    # Analyze prompt complexity
    if [ $PROMPT_LENGTH -gt 2000 ]; then
        print_info "Large prompt detected - recommending Hive-Mind approach"
        RECOMMENDED_APPROACH="hiveMind"
    elif [ $PROMPT_LENGTH -gt 500 ]; then
        print_info "Medium prompt detected - recommending standard approach"
        RECOMMENDED_APPROACH="standard"
    else
        print_info "Simple prompt detected - Simple Swarm may be sufficient"
        RECOMMENDED_APPROACH="simpleSwarm"
    fi
}
collect_initial_prompt() {
    print_header "Project Requirements & Initial Prompt"
    
    echo -e "${CYAN}Enter your project requirements and initial task.${NC}"
    echo -e "${DIM}You can paste or type multiple lines. Press Ctrl+D when done.${NC}"
    echo -e "${DIM}This prompt will be saved and can be executed immediately after installation.${NC}"
    echo ""
    echo -e "${YELLOW}────────────────────────────────────────────────────────────────${NC}"
    
    # Collect multi-line input
    PROMPT_CONTENT=$(cat)
    
    # Save prompt
    mkdir -p "$(dirname "$PROMPT_FILE")"
    echo "$PROMPT_CONTENT" > "$PROMPT_FILE"
    
    # Show summary
    PROMPT_LENGTH=${#PROMPT_CONTENT}
    PROMPT_LINES=$(echo "$PROMPT_CONTENT" | wc -l)
    
    echo -e "${YELLOW}────────────────────────────────────────────────────────────────${NC}"
    echo ""
    print_success "Prompt saved: $PROMPT_LINES lines, $PROMPT_LENGTH characters"
    
    # Analyze prompt complexity
    if [ $PROMPT_LENGTH -gt 2000 ]; then
        print_info "Large prompt detected - recommending Hive-Mind approach"
        RECOMMENDED_APPROACH="hiveMind"
    elif [ $PROMPT_LENGTH -gt 500 ]; then
        print_info "Medium prompt detected - recommending standard approach"
        RECOMMENDED_APPROACH="standard"
    else
        print_info "Simple prompt detected - Simple Swarm may be sufficient"
        RECOMMENDED_APPROACH="simpleSwarm"
    fi
}

# Check Node.js
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

# Install Node.js
install_node() {
    print_info "Installing Node.js v20..."
    
    if [ "$OS_TYPE" = "debian" ]; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [ "$OS_TYPE" = "macos" ]; then
        if command -v brew &> /dev/null; then
            brew install node@20
        else
            print_error "Please install Homebrew first or download Node.js from nodejs.org"
            return 1
        fi
    else
        print_error "Please install Node.js 18+ from https://nodejs.org"
        return 1
    fi
}

# Check and install optional dependencies
check_optional_dependencies() {
    # Claude Code
    if [ "$INSTALL_CLAUDE_CODE" = true ]; then
        if command -v claude &> /dev/null; then
            print_success "Claude Code found"
        else
            print_info "Installing Claude Code..."
            npm install -g @anthropic-ai/claude-code || print_warning "Claude Code installation failed - continuing"
        fi
    fi
    
    # TMux
    if [ "$INSTALL_TMUX" = true ]; then
        if command -v tmux &> /dev/null; then
            print_success "TMux found"
        else
            print_info "Installing TMux..."
            if [ "$OS_TYPE" = "debian" ]; then
                sudo apt-get update && sudo apt-get install -y tmux
            elif [ "$OS_TYPE" = "macos" ]; then
                brew install tmux
            else
                print_warning "Please install TMux manually for 24/7 operation"
            fi
        fi
    fi
    
    # jq (useful for all components)
    if ! command -v jq &> /dev/null; then
        print_info "Installing jq for JSON processing..."
        if [ "$OS_TYPE" = "debian" ]; then
            sudo apt-get update && sudo apt-get install -y jq
        elif [ "$OS_TYPE" = "macos" ]; then
            brew install jq
        fi
    fi
}

# Create directory structure based on selected components
create_directory_structure() {
    print_header "Creating Directory Structure"
    
    # Core directories (always created)
    mkdir -p "$INSTALL_DIR"/{intelligence-engine,bin,lib,hooks,logs,recovery,configs}
    mkdir -p "$INSTALL_DIR"/logs/{agents,sessions}
    mkdir -p "$INSTALL_DIR"/recovery/{checkpoints,backups}
    mkdir -p "$INSTALL_DIR"/supervisor
    mkdir -p "$PROJECT_DIR"/.ai-dev
    
    # Claude Code directories
    if [ "$INSTALL_CLAUDE_CODE" = true ]; then
        mkdir -p "$PROJECT_DIR"/.claude/{agents,commands,hooks}
        print_success "Created Claude Code directories"
    fi
    
    # Agent-OS directories
    if [ "$INSTALL_AGENT_OS" = true ]; then
        mkdir -p "$PROJECT_DIR"/.agent-os/{specs,plans,tasks,instructions,standards}
        print_success "Created Agent-OS directories"
    fi
    
    # Claude Flow directories
    if [ "$INSTALL_CLAUDE_FLOW" = true ]; then
        mkdir -p "$PROJECT_DIR"/.claude-flow/{sparc-phases,memory,.hive-mind}
        print_success "Created Claude Flow directories"
    fi
    
    # TMux directories
    if [ "$INSTALL_TMUX" = true ]; then
        mkdir -p "$PROJECT_DIR"/.tmux-orchestrator/{sessions,schedules}
        mkdir -p "$INSTALL_DIR"/tmux-scripts
        print_success "Created TMux Orchestrator directories"
    fi
    
    print_success "Directory structure created"
}

# Install core system files
install_core_system() {
    print_header "Installing Core Workflow System"
    
    # Copy intelligence engine (including project-scanner.js)
    if [ -d "$SCRIPT_DIR/intelligence-engine" ]; then
        cp -r "$SCRIPT_DIR/intelligence-engine/"* "$INSTALL_DIR/intelligence-engine/"
        chmod +x "$INSTALL_DIR/intelligence-engine/user-choice-handler.sh" 2>/dev/null || true
        chmod +x "$INSTALL_DIR/intelligence-engine/"*.js 2>/dev/null || true
        print_success "Intelligence engine installed (with project-scanner)"
    else
        print_warning "Intelligence engine files not found"
    fi
    
    # Copy workflow runner with CORRECT name
    if [ -f "$SCRIPT_DIR/workflow-runner-modular.js" ]; then
        cp "$SCRIPT_DIR/workflow-runner-modular.js" "$INSTALL_DIR/workflow-runner.js"
        print_success "Modular workflow runner installed"
    elif [ -f "$SCRIPT_DIR/workflow-runner.js" ]; then
        cp "$SCRIPT_DIR/workflow-runner.js" "$INSTALL_DIR/workflow-runner.js"
        print_success "Standard workflow runner installed"
    else
        print_warning "Workflow runner not found"
    fi
    chmod +x "$INSTALL_DIR/workflow-runner.js" 2>/dev/null || true
    
    # Copy configs
    if [ -d "$SCRIPT_DIR/configs" ]; then
        cp -r "$SCRIPT_DIR/configs/"* "$INSTALL_DIR/configs/"
        print_success "Configuration files installed"
    else
        print_warning "Configuration files not found"
    fi
    
    # Analyze project for customization
    print_info "Analyzing project for customization..."
    if [ -f "$INSTALL_DIR/intelligence-engine/complexity-analyzer.js" ]; then
        ANALYSIS_RESULT=$(node "$INSTALL_DIR/intelligence-engine/complexity-analyzer.js" 2>/dev/null || echo '{}')
        mkdir -p "$PROJECT_DIR/.ai-dev"
        echo "$ANALYSIS_RESULT" > "$PROJECT_DIR/.ai-dev/analysis.json"
        print_success "Project analyzed for customization"
    fi
}

# Install Claude Code components
install_claude_code_components() {
    if [ "$INSTALL_CLAUDE_CODE" != true ]; then
        return
    fi
    
    print_header "Installing Claude Code Components"
    
    # Install agents
    if [ -d "$SCRIPT_DIR/agent-templates" ]; then
        for agent_file in "$SCRIPT_DIR/agent-templates"/*.md; do
            if [ -f "$agent_file" ]; then
                cp "$agent_file" "$PROJECT_DIR/.claude/agents/"
            fi
        done
        print_success "Agents installed to .claude/agents/"
    fi
    
    # Install slash commands
    if [ -d "$SCRIPT_DIR/slash-commands" ]; then
        for cmd_file in "$SCRIPT_DIR/slash-commands"/*.md; do
            if [ -f "$cmd_file" ]; then
                cp "$cmd_file" "$PROJECT_DIR/.claude/commands/"
            fi
        done
        print_success "Commands installed to .claude/commands/"
    fi
    
    # Create Claude Code settings
    cat > "$PROJECT_DIR/.claude/settings.json" << 'EOF'
{
  "dangerouslySkipPermissions": false,
  "autoSave": true,
  "maxConcurrentTools": 10,
  "defaultMcpServer": "context7",
  "hooks": {
    "user-prompt-submit-hook": ".ai-workflow/hooks/user-prompt-submit-hook.sh",
    "tool-call-hook": ".ai-workflow/hooks/tool-call-hook.sh",
    "model-response-hook": ".ai-workflow/hooks/model-response-hook.sh"
  }
}
EOF
    print_success "Claude Code settings configured"
    
    # Create hooks inline (they don't exist as files)
    print_info "Creating Claude Code hooks..."
    
    # User prompt submit hook
    cat > "$INSTALL_DIR/hooks/user-prompt-submit-hook.sh" << 'EOF'
#!/bin/bash
# Intercepts prompts to trigger workflow automation

PROMPT="$1"
LOG_FILE="$(dirname "$0")/../logs/hooks.log"

mkdir -p "$(dirname "$LOG_FILE")"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Prompt: $PROMPT" >> "$LOG_FILE"
# Broadcast to agent bus as JSONL
BUS_FILE="$(dirname "$0")/../logs/agent-bus.jsonl"
TS="$(date -Iseconds)"
ESC_PROMPT=$(echo "$PROMPT" | head -c 1000 | sed 's/"/\\"/g')
AGN="${CLAUDE_AGENT_NAME:-unknown}"; ROL="${CLAUDE_ROLE:-prompt-hook}"
if [ "${AI_BUS_ENABLED:-true}" = "true" ]; then
BUS_FILE="$(dirname "$0")/../logs/agent-bus.jsonl"
TS="$(date -Iseconds)"; AGN="${CLAUDE_AGENT_NAME:-unknown}"; ROL="${CLAUDE_ROLE:-prompt-hook}"
echo "{\"ts\":\"$TS\",\"type\":\"prompt\",\"agent\":\"$AGN\",\"role\":\"$ROL\",\"prompt\":\"$ESC_PROMPT\"}" >> "$BUS_FILE"
fi

# Trigger workflows based on keywords
if [[ "$PROMPT" == *"complete"* ]] || [[ "$PROMPT" == *"finish"* ]] || [[ "$PROMPT" == *"fix"* ]]; then
    echo "🚀 Triggering completion workflow..."
    WORKFLOW_DIR="$(dirname "$0")/.."
    node "$WORKFLOW_DIR/workflow-runner.js" --mode recovery --async &
fi

if [[ "$PROMPT" == *"analyze"* ]]; then
    echo "🔍 Triggering analysis..."
    WORKFLOW_DIR="$(dirname "$0")/.."
    node "$WORKFLOW_DIR/intelligence-engine/complexity-analyzer.js" &
fi
EOF
    chmod +x "$INSTALL_DIR/hooks/user-prompt-submit-hook.sh"
    
    # Tool call hook
    cat > "$INSTALL_DIR/hooks/tool-call-hook.sh" << 'EOF'
#!/bin/bash
# Monitors tool usage

TOOL="$1"
ARGS="$2"
LOG_FILE="$(dirname "$0")/../logs/tools.log"

mkdir -p "$(dirname "$LOG_FILE")"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Tool: $TOOL, Args: $ARGS" >> "$LOG_FILE"
# Broadcast to agent bus as JSONL
BUS_FILE="$(dirname "$0")/../logs/agent-bus.jsonl"
TS="$(date -Iseconds)"
AGN="${CLAUDE_AGENT_NAME:-unknown}"; ROL="${CLAUDE_ROLE:-tool-hook}"
if [ "${AI_BUS_ENABLED:-true}" = "true" ]; then
TS="$(date -Iseconds)"; AGN="${CLAUDE_AGENT_NAME:-unknown}"; ROL="${CLAUDE_ROLE:-tool-hook}"
echo "{\"ts\":\"$TS\",\"type\":\"tool\",\"agent\":\"$AGN\",\"role\":\"$ROL\",\"tool\":\"$TOOL\",\"args\":\"$ARGS\"}" >> "$BUS_FILE"
fi
EOF
    chmod +x "$INSTALL_DIR/hooks/tool-call-hook.sh"
    
    # Model response hook

    # Event bus (JSONL) to broadcast agent events
    EVENT_BUS_FILE="$INSTALL_DIR/logs/agent-bus.jsonl"
    touch "$EVENT_BUS_FILE" 2>/dev/null || true

    cat > "$INSTALL_DIR/hooks/model-response-hook.sh" << 'EOF'
#!/bin/bash
# Logs model responses

RESPONSE="$1"
LOG_FILE="$(dirname "$0")/../logs/responses.log"

mkdir -p "$(dirname "$LOG_FILE")"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Response: ${RESPONSE:0:200}..." >> "$LOG_FILE"
# Broadcast to agent bus as JSONL (truncated excerpt)
BUS_FILE="$(dirname "$0")/../logs/agent-bus.jsonl"
TS="$(date -Iseconds)"
EXCERPT=$(echo "$RESPONSE" | head -c 500 | sed 's/"/\\"/g')
AGN="${CLAUDE_AGENT_NAME:-unknown}"; ROL="${CLAUDE_ROLE:-response-hook}"
if [ "${AI_BUS_ENABLED:-true}" = "true" ]; then
BUS_FILE="$(dirname "$0")/../logs/agent-bus.jsonl"
TS="$(date -Iseconds)"; AGN="${CLAUDE_AGENT_NAME:-unknown}"; ROL="${CLAUDE_ROLE:-response-hook}"
echo "{\"ts\":\"$TS\",\"type\":\"response\",\"agent\":\"$AGN\",\"role\":\"$ROL\",\"excerpt\":\"$EXCERPT\"}" >> "$BUS_FILE"
fi
EOF
    chmod +x "$INSTALL_DIR/hooks/model-response-hook.sh"
    
    print_success "Claude Code hooks created"
    
    # Create recovery specialist agent
    print_info "Creating recovery specialist agent..."
    cat > "$PROJECT_DIR/.claude/agents/recovery-specialist.md" << 'EOF'
---
name: recovery-specialist
description: Specializes in completing incomplete projects, fixing messy code, and recovering from partial implementations
color: orange
tools: Read, Write, MultiEdit, Grep, Glob, Task, TodoWrite, Bash, WebSearch
---

You are the Recovery Specialist Agent, expert at completing partially finished projects.

## Core Competencies

### 1. Incomplete Work Detection
- Find TODO, FIXME, HACK, XXX comments
- Identify stub functions and not-implemented errors
- Detect empty or failing tests
- Find missing documentation
- Identify uncommitted changes

### 2. Recovery Planning
- Prioritize critical bugs first
- Fix failing tests second
- Implement stub functions third
- Complete TODO items fourth
- Add missing documentation last

### 3. Implementation
- Fix one issue at a time
- Test after each fix
- Commit regularly
- Document changes

## Workflow

1. Run project scanner to find all issues
2. Create prioritized task list
3. Fix issues in priority order
4. Test and verify each fix
5. Document completion status

## Commands

Use `/recover analyze` to start recovery process.
EOF
    print_success "Recovery specialist agent created"
    
    # Create recovery command
    print_info "Creating recovery command..."
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
}

# Install Agent-OS components with FULL CUSTOMIZATION
install_agent_os_components() {
    if [ "$INSTALL_AGENT_OS" != true ]; then
        return
    fi
    
    print_header "Installing and Customizing Agent-OS Components"
    
    # Load project analysis for customization
    ANALYSIS_FILE="$PROJECT_DIR/.ai-dev/analysis.json"
    if [ -f "$ANALYSIS_FILE" ]; then
        print_info "Using project analysis for Agent-OS customization..."
        
        # Extract tech stack info from analysis
        TECH_STACK=$(cat "$ANALYSIS_FILE" | jq -r '.factors.techStack // {}' 2>/dev/null || echo '{}')
        LANGUAGES=$(echo "$TECH_STACK" | jq -r '.languages[]?' 2>/dev/null || echo '')
        FRAMEWORKS=$(echo "$TECH_STACK" | jq -r '.frameworks[]?' 2>/dev/null || echo '')
        DATABASES=$(echo "$TECH_STACK" | jq -r '.databases[]?' 2>/dev/null || echo '')
        STAGE=$(cat "$ANALYSIS_FILE" | jq -r '.stage // "early"' 2>/dev/null || echo 'early')
        SCORE=$(cat "$ANALYSIS_FILE" | jq -r '.score // 50' 2>/dev/null || echo '50')
    else
        print_warning "No analysis found, using default Agent-OS configuration"
        LANGUAGES=""
        FRAMEWORKS=""
        DATABASES=""
        STAGE="early"
        SCORE="50"
    fi
    
    # Create CUSTOMIZED instructions.md
    print_info "Creating customized Agent-OS instructions..."
    cat > "$PROJECT_DIR/.agent-os/instructions/instructions.md" << EOF
# Agent-OS Instructions - Customized for This Project

## Project Analysis
- **Complexity Score**: $SCORE/100
- **Stage**: $STAGE
- **Languages**: ${LANGUAGES:-Not detected}
- **Frameworks**: ${FRAMEWORKS:-Not detected}
- **Databases**: ${DATABASES:-Not detected}

## Available Commands
- \`/plan-product\` - Create product specifications
- \`/create-spec {feature}\` - Generate feature specifications
- \`/analyze-product\` - Analyze existing product
- \`/execute-tasks\` - Execute planned tasks

## Technology-Specific Guidelines

EOF
    
    # Add language-specific guidelines
    if [[ "$LANGUAGES" == *"JavaScript"* ]] || [[ "$LANGUAGES" == *"TypeScript"* ]]; then
        cat >> "$PROJECT_DIR/.agent-os/instructions/instructions.md" << 'EOF'
### JavaScript/TypeScript Development
- Use ES6+ features and modern syntax
- Implement proper error handling with try/catch
- Use async/await for asynchronous operations
- Follow ESLint/Prettier conventions
- Write unit tests with Jest or Mocha

EOF
    fi
    
    if [[ "$LANGUAGES" == *"Python"* ]]; then
        cat >> "$PROJECT_DIR/.agent-os/instructions/instructions.md" << 'EOF'
### Python Development
- Follow PEP 8 style guidelines
- Use type hints for function signatures
- Implement proper exception handling
- Use virtual environments for dependencies
- Write tests with pytest or unittest

EOF
    fi
    
    # Add framework-specific guidelines
    if [[ "$FRAMEWORKS" == *"React"* ]]; then
        cat >> "$PROJECT_DIR/.agent-os/instructions/instructions.md" << 'EOF'
### React Development
- Use functional components with hooks
- Implement proper state management
- Follow component composition patterns
- Use React.memo for optimization
- Write tests with React Testing Library

EOF
    fi
    
    if [[ "$FRAMEWORKS" == *"Express"* ]]; then
        cat >> "$PROJECT_DIR/.agent-os/instructions/instructions.md" << 'EOF'
### Express.js Development
- Use middleware for cross-cutting concerns
- Implement proper error handling middleware
- Use route separation for organization
- Implement input validation (express-validator)
- Add security headers (helmet)

EOF
    fi
    
    # Add stage-specific planning
    cat >> "$PROJECT_DIR/.agent-os/instructions/instructions.md" << EOF

## Planning Approach ($STAGE Stage)
EOF
    
    case "$STAGE" in
        idea)
            cat >> "$PROJECT_DIR/.agent-os/instructions/instructions.md" << 'EOF'
- Focus on requirements gathering
- Create detailed specifications
- Design system architecture
- Plan implementation phases
- Define success criteria
EOF
            ;;
        early)
            cat >> "$PROJECT_DIR/.agent-os/instructions/instructions.md" << 'EOF'
- Establish coding standards
- Set up development environment
- Create foundation components
- Implement core features
- Set up testing framework
EOF
            ;;
        active)
            cat >> "$PROJECT_DIR/.agent-os/instructions/instructions.md" << 'EOF'
- Maintain code quality
- Add new features systematically
- Refactor when necessary
- Ensure test coverage
- Document APIs and components
EOF
            ;;
        mature)
            cat >> "$PROJECT_DIR/.agent-os/instructions/instructions.md" << 'EOF'
- Focus on optimization
- Improve performance
- Enhance security
- Update documentation
- Plan for scaling
EOF
            ;;
    esac
    
    print_success "Created customized Agent-OS instructions"
    
    # Create standards.md based on detected tech stack
    print_info "Creating coding standards document..."
    cat > "$PROJECT_DIR/.agent-os/instructions/standards.md" << EOF
# Coding Standards - ${LANGUAGES:-General} Project

## Overview
These standards are customized based on your project's technology stack.

## Code Style
EOF
    
    if [[ "$LANGUAGES" == *"JavaScript"* ]]; then
        cat >> "$PROJECT_DIR/.agent-os/instructions/standards.md" << 'EOF'

### JavaScript Standards
- Use 2 spaces for indentation
- Use single quotes for strings
- Add semicolons at the end of statements
- Use camelCase for variables and functions
- Use PascalCase for classes and components
- Use UPPER_SNAKE_CASE for constants
EOF
    fi
    
    if [[ "$LANGUAGES" == *"Python"* ]]; then
        cat >> "$PROJECT_DIR/.agent-os/instructions/standards.md" << 'EOF'

### Python Standards
- Use 4 spaces for indentation
- Use snake_case for variables and functions
- Use PascalCase for classes
- Use UPPER_SNAKE_CASE for constants
- Maximum line length: 79 characters
- Use docstrings for all public functions
EOF
    fi
    
    print_success "Created coding standards document"
    
    # Create product spec template
    cat > "$PROJECT_DIR/.agent-os/specs/product-spec-template.md" << 'EOF'
# Product Specification

## Product Name
[Product name here]

## Vision
[Product vision statement]

## Target Users
- [User persona 1]
- [User persona 2]

## Core Features
1. [Feature 1]
2. [Feature 2]
3. [Feature 3]

## Technical Requirements
- [Requirement 1]
- [Requirement 2]

## Success Metrics
- [Metric 1]
- [Metric 2]
EOF
    
    # Create feature template
    cat > "$PROJECT_DIR/.agent-os/specs/feature-template.md" << 'EOF'
# Feature Specification

## Feature Name
[Feature name]

## Description
[Detailed description]

## User Stories
- As a [user], I want to [action] so that [benefit]

## Acceptance Criteria
- [ ] Criteria 1
- [ ] Criteria 2

## Technical Design
[Technical approach]

## Testing Plan
[How to test this feature]
EOF
    
    # Create implementation plan based on complexity
    cat > "$PROJECT_DIR/.agent-os/plans/implementation-plan.md" << EOF
# Implementation Plan

## Project Complexity: $SCORE/100

## Phase 1: Foundation (Week 1-2)
- [ ] Set up development environment
- [ ] Initialize project structure
- [ ] Configure build tools
- [ ] Set up version control

## Phase 2: Core Features (Week 3-4)
- [ ] Implement basic functionality
- [ ] Create data models
- [ ] Set up API endpoints
- [ ] Implement authentication

## Phase 3: Advanced Features (Week 5-6)
- [ ] Add complex features
- [ ] Implement integrations
- [ ] Optimize performance
- [ ] Add caching

## Phase 4: Polish & Deploy (Week 7-8)
- [ ] Complete testing
- [ ] Fix bugs
- [ ] Update documentation
- [ ] Deploy to production
EOF
    
    # Create task template
    cat > "$PROJECT_DIR/.agent-os/tasks/task-template.md" << 'EOF'
# Task List

## Priority 1 - Critical
- [ ] Task 1
- [ ] Task 2

## Priority 2 - High
- [ ] Task 3
- [ ] Task 4

## Priority 3 - Medium
- [ ] Task 5
- [ ] Task 6

## Priority 4 - Low
- [ ] Task 7
- [ ] Task 8
EOF
    
    # Create Agent-OS configuration
    cat > "$PROJECT_DIR/.agent-os/agentOS-config.json" << EOF
{
  "version": "1.0",
  "integration": "intelligent-workflow",
  "projectAnalysis": {
    "score": $SCORE,
    "stage": "$STAGE",
    "languages": [${LANGUAGES:+\"$LANGUAGES\"}],
    "frameworks": [${FRAMEWORKS:+\"$FRAMEWORKS\"}],
    "databases": [${DATABASES:+\"$DATABASES\"}]
  },
  "features": {
    "planning": true,
    "specifications": true,
    "taskManagement": true,
    "documentation": true,
    "customization": true
  },
  "commands": [
    "/plan-product",
    "/create-spec",
    "/analyze-product",
    "/execute-tasks"
  ],
  "generatedAt": "$(date -Iseconds)"
}
EOF
    
    print_success "Agent-OS components installed and fully customized for your project!"
}

# Decide Claude Flow version based on analysis and/or user/environment
# Sets SELECTED_CLAUDE_FLOW_VERSION and exports CLAUDE_FLOW_VERSION for downstream tools
decide_claude_flow_version() {
    print_header "Selecting Claude Flow Version"

    # If user provided env var, respect it
    if [ -n "${CLAUDE_FLOW_VERSION}" ]; then
        SELECTED_CLAUDE_FLOW_VERSION="${CLAUDE_FLOW_VERSION}"
        print_info "Using CLAUDE_FLOW_VERSION from environment: ${SELECTED_CLAUDE_FLOW_VERSION}"
    else
        # Default selection based on analysis
        local ANALYSIS_FILE="$PROJECT_DIR/.ai-dev/analysis.json"
        local STAGE="early"
        local SCORE=50
        if [ -f "$ANALYSIS_FILE" ]; then
            STAGE=$(jq -r '.stage // "early"' "$ANALYSIS_FILE" 2>/dev/null || echo "early")
            SCORE=$(jq -r '.score // 50' "$ANALYSIS_FILE" 2>/dev/null || echo "50")
        fi

        # Heuristic mapping
        # - mature or high score => stable
        # - active medium => latest
        # - idea/early or low score => alpha
        if [ "$STAGE" = "mature" ] || [ "$SCORE" -gt 70 ]; then
            SELECTED_CLAUDE_FLOW_VERSION="stable"
        elif [ "$STAGE" = "active" ] && [ "$SCORE" -ge 31 ] && [ "$SCORE" -le 70 ]; then
            SELECTED_CLAUDE_FLOW_VERSION="latest"
        else
            SELECTED_CLAUDE_FLOW_VERSION="alpha"
        fi
        print_info "Auto-selected Claude Flow version: ${SELECTED_CLAUDE_FLOW_VERSION} (stage=$STAGE, score=$SCORE)"
    fi

    # Export for child processes and tmux scripts
    export CLAUDE_FLOW_VERSION="$SELECTED_CLAUDE_FLOW_VERSION"
}

# Generate approach recommendation and customized documentation
# Uses the local intelligence engine: approach-selector + document-customizer
# Writes outputs into the project (Agent-OS docs, CLAUDE.md, slash commands, etc.)
generate_approach_and_docs() {
    print_header "Generating Approach Recommendation and Customized Docs"

    local ANALYSIS_FILE="$PROJECT_DIR/.ai-dev/analysis.json"
    if [ ! -f "$ANALYSIS_FILE" ]; then
        print_warning "Analysis file not found. Skipping documentation customization."
        return
    fi

    mkdir -p "$INSTALL_DIR/lib" "$INSTALL_DIR/configs"

    # Create a small runner to select approach with version awareness
    cat > "$INSTALL_DIR/lib/select-approach.js" <<'EOF'
const fs = require('fs');
const path = require('path');
const ApproachSelector = require(path.join(__dirname, '..', 'intelligence-engine', 'approach-selector.js'));

const analysisPath = process.argv[2];
const outPath = process.argv[3];
const versionFromEnv = process.env.CLAUDE_FLOW_VERSION || 'alpha';

if (!analysisPath || !outPath) {
  console.error('Usage: select-approach.js <analysis.json> <out.json>');
  process.exit(1);
}

try {
  const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));
  const selector = new ApproachSelector();
  const rec = selector.selectApproach(analysis, null, analysis.taskDescription || '', versionFromEnv);
  fs.writeFileSync(outPath, JSON.stringify(rec, null, 2));
  console.log('Approach written to', outPath);
} catch (e) {
  console.error('Error selecting approach:', e.message);
  process.exit(1);
}
EOF

    # Create a runner to generate and write documents
    cat > "$INSTALL_DIR/lib/generate-docs.js" <<'EOF'
const fs = require('fs');
const path = require('path');
const DocumentCustomizer = require(path.join(__dirname, '..', 'intelligence-engine', 'document-customizer.js'));

const analysisPath = process.argv[2];
const approachPath = process.argv[3];

if (!analysisPath || !approachPath) {
  console.error('Usage: generate-docs.js <analysis.json> <approach.json>');
  process.exit(1);
}

function writeFileSafely(targetPath, content) {
  const dir = path.dirname(targetPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(targetPath, content, 'utf8');
}

(async () => {
  try {
    const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));
    const approach = JSON.parse(fs.readFileSync(approachPath, 'utf8'));

    const customizer = new DocumentCustomizer(analysis, approach);
    const docs = await customizer.generateDocuments();

    // Single-file docs
    const singleDocs = ['claude', 'agentOS', 'contributing', 'deployment', 'architecture'];
    for (const key of singleDocs) {
      const doc = docs[key];
      if (doc && doc.path && doc.content) {
        writeFileSafely(path.join(process.cwd(), doc.path), doc.content);
      }
    }

    // Workflows array
    if (Array.isArray(docs.workflows)) {
      for (const wf of docs.workflows) {
        writeFileSafely(path.join(process.cwd(), wf.path), wf.content);
      }
    }

    // SPARC phases
    if (Array.isArray(docs.sparc)) {
      for (const ph of docs.sparc) {
        writeFileSafely(path.join(process.cwd(), ph.path), ph.content);
      }
    }

    // Agents
    if (docs.agents && docs.agents.files) {
      const baseDir = path.join(process.cwd(), '.claude', 'agents');
      fs.mkdirSync(baseDir, { recursive: true });
      for (const [fileName, content] of Object.entries(docs.agents.files)) {
        writeFileSafely(path.join(baseDir, fileName), content);
      }
    }

    // Slash commands
    if (docs.slashCommands && docs.slashCommands.files) {
      const cmdDir = path.join(process.cwd(), '.claude', 'commands');
      fs.mkdirSync(cmdDir, { recursive: true });
      for (const [fileName, content] of Object.entries(docs.slashCommands.files)) {
        writeFileSafely(path.join(cmdDir, fileName), content);
      }
    }

    console.log('Customized documents generated.');
  } catch (e) {
    console.error('Error generating docs:', e.message);
    process.exit(1);
  }
})();
EOF

    chmod +x "$INSTALL_DIR/lib/select-approach.js" "$INSTALL_DIR/lib/generate-docs.js" 2>/dev/null || true

    # Run approach selection and docs generation
    local APPROACH_JSON="$INSTALL_DIR/configs/approach.json"
    node "$INSTALL_DIR/lib/select-approach.js" "$ANALYSIS_FILE" "$APPROACH_JSON" >/dev/null 2>&1 || print_warning "Approach selection failed"

    if [ -f "$APPROACH_JSON" ]; then
        print_success "Approach selected and saved to configs/approach.json"
        node "$INSTALL_DIR/lib/generate-docs.js" "$ANALYSIS_FILE" "$APPROACH_JSON" >/dev/null 2>&1 || print_warning "Document customization failed"
        
        # Component-aware cleanup of generated docs
        if [ "$INSTALL_CLAUDE_CODE" != true ]; then
            rm -rf "$PROJECT_DIR/.claude" 2>/dev/null || true
            print_info "Claude Code not selected - removed .claude docs"
        fi
        if [ "$INSTALL_AGENT_OS" != true ]; then
            rm -rf "$PROJECT_DIR/.agent-os" 2>/dev/null || true
            print_info "Agent-OS not selected - removed .agent-os docs"
        fi
        if [ "$INSTALL_CLAUDE_FLOW" != true ]; then
            rm -rf "$PROJECT_DIR/.claude-flow" 2>/dev/null || true
            print_info "Claude Flow not selected - removed .claude-flow docs"
        fi

        [ -f "$PROJECT_DIR/.claude/CLAUDE.md" ] && print_success "CLAUDE.md generated" || true
        [ -f "$PROJECT_DIR/.agent-os/instructions/instructions.md" ] && print_success "Agent-OS instructions generated" || true
    else
        print_warning "Skipping documentation customization (no approach.json)"
    fi
}

# Install Claude Flow components
# Also generate a default hive-config.json based on analysis/approach if Claude Flow is selected
generate_hive_config() {
    if [ "$INSTALL_CLAUDE_FLOW" != true ]; then
        return
    fi

    local ANALYSIS_FILE="$PROJECT_DIR/.ai-dev/analysis.json"
    local APPROACH_JSON="$INSTALL_DIR/configs/approach.json"
    [ -f "$ANALYSIS_FILE" ] || return
    [ -f "$APPROACH_JSON" ] || return

    local PROJECT_NAME_BASENAME
    PROJECT_NAME_BASENAME=$(basename "$PROJECT_DIR")

    mkdir -p "$PROJECT_DIR/.claude-flow"

    # Derive role counts from approach/score
    local SCORE
    SCORE=$(jq -r '.score // 50' "$APPROACH_JSON" 2>/dev/null || echo '50')
    local SELECTED
    SELECTED=$(jq -r '.selected' "$APPROACH_JSON" 2>/dev/null || echo '')

    local AGENTS=5
    if echo "$SELECTED" | grep -qi 'hiveMindSparc'; then
        if [ "$SCORE" -lt 80 ]; then AGENTS=8; elif [ "$SCORE" -lt 90 ]; then AGENTS=10; else AGENTS=12; fi
    else
        if [ "$SCORE" -lt 40 ]; then AGENTS=4; elif [ "$SCORE" -lt 60 ]; then AGENTS=5; else AGENTS=6; fi
    fi

    cat > "$PROJECT_DIR/.claude-flow/hive-config.json" << EOF
{
  "project": "$PROJECT_NAME_BASENAME",
  "memoryDir": ".claude-flow/memory",
  "roles": [
    { "name": "Queen", "capabilities": ["plan", "coordinate", "review"], "priority": 1,
      "prompt": "You are the Queen agent. Coordinate sub-agents, maintain global plan, and ensure quality."
    },
    { "name": "Architect", "capabilities": ["architecture", "standards", "docs"], "priority": 2,
      "prompt": "You are the Architect. Define system architecture, enforce standards, and drive documentation quality."
    },
    { "name": "Backend", "capabilities": ["api", "db", "auth"], "priority": 3,
      "prompt": "You are the Backend engineer. Implement APIs, data models, and authentication with best practices."
    },
    { "name": "Frontend", "capabilities": ["ui", "ux", "components"], "priority": 3,
      "prompt": "You are the Frontend engineer. Build accessible, performant UI components and flows."
    },
    { "name": "Integrator", "capabilities": ["agents", "workflows", "integrations"], "priority": 2,
      "prompt": "You are the Integrator. Connect systems, orchestrate workflows, ensure seamless handoffs."
    }
  ],
  "agentCount": $AGENTS,
  "persistence": {
    "enabled": true,
    "logs": ".claude-flow/memory/logs",
    "artifacts": ".claude-flow/memory/artifacts",
    "policies": {
      "maxLogFiles": 1000,
      "maxArtifactSizeMB": 100,
      "rotateLogs": true,
      "retentionDays": 30
    },
    "routing": {
      "Queen": {"logs": ".claude-flow/memory/logs/queen", "artifacts": ".claude-flow/memory/artifacts/queen"},
      "Architect": {"logs": ".claude-flow/memory/logs/architect", "artifacts": ".claude-flow/memory/artifacts/architect"},
      "Backend": {"logs": ".claude-flow/memory/logs/backend", "artifacts": ".claude-flow/memory/artifacts/backend"},
      "Frontend": {"logs": ".claude-flow/memory/logs/frontend", "artifacts": ".claude-flow/memory/artifacts/frontend"},
      "Integrator": {"logs": ".claude-flow/memory/logs/integrator", "artifacts": ".claude-flow/memory/artifacts/integrator"}
    }
  },
  "claudeFlowVersion": "${CLAUDE_FLOW_VERSION:-alpha}",
  "mcpServers": {
    "autoDiscover": true,
    "filesystem": { "enabled": true, "root": "." },
    "git": { "enabled": true, "repo": "auto" },
    "http": { "enabled": true }
  },
  "tools": [
    { "name": "grep", "type": "builtin", "description": "Search files" },
    { "name": "httpClient", "type": "mcp", "server": "http" },
    { "name": "fs", "type": "mcp", "server": "filesystem" },
    { "name": "git", "type": "mcp", "server": "git" }
  ]
}
EOF

  "project": "$PROJECT_NAME_BASENAME",
  "memoryDir": ".claude-flow/memory",
  "roles": [
    { "name": "Queen", "capabilities": ["plan", "coordinate", "review"], "priority": 1 },
    { "name": "Architect", "capabilities": ["architecture", "standards", "docs"], "priority": 2 },
    { "name": "Backend", "capabilities": ["api", "db", "auth"], "priority": 3 },
    { "name": "Frontend", "capabilities": ["ui", "ux", "components"], "priority": 3 },
    { "name": "Integrator", "capabilities": ["agents", "workflows", "integrations"], "priority": 2 }
  ],
  "agentCount": $AGENTS,
  "persistence": {
    "enabled": true,
    "logs": ".claude-flow/memory/logs",
    "artifacts": ".claude-flow/memory/artifacts"
  },
  "claudeFlowVersion": "${CLAUDE_FLOW_VERSION:-alpha}"
}
EOF

    # Remove the duplicate block potentially appended by shell heredoc issues
    # Keep only the first JSON object by truncating at the first closing brace pattern
    if command -v awk >/dev/null 2>&1; then
        awk 'BEGIN{c=0} {print} /}\s*$/ {c++; if(c==1){exit}}' "$PROJECT_DIR/.claude-flow/hive-config.json" > "$PROJECT_DIR/.claude-flow/hive-config.json.tmp" 2>/dev/null || true
        mv "$PROJECT_DIR/.claude-flow/hive-config.json.tmp" "$PROJECT_DIR/.claude-flow/hive-config.json" 2>/dev/null || true
    fi
    # Validate JSON if jq is available
    if command -v jq >/dev/null 2>&1; then
        tmp_file="$PROJECT_DIR/.claude-flow/hive-config.json.tmp"
        jq '.' "$PROJECT_DIR/.claude-flow/hive-config.json" > "$tmp_file" 2>/dev/null && mv "$tmp_file" "$PROJECT_DIR/.claude-flow/hive-config.json"
    fi

    mkdir -p "$PROJECT_DIR/.claude-flow/memory/logs" "$PROJECT_DIR/.claude-flow/memory/artifacts"
    print_success "Generated .claude-flow/hive-config.json with $AGENTS agents"
}

install_claude_flow_components() {
    if [ "$INSTALL_CLAUDE_FLOW" != true ]; then
        return
    fi
    
    print_header "Initializing Claude Flow 2.0"
    
    # Initialize Claude Flow if not already initialized
    if [ ! -f "$PROJECT_DIR/.claude-flow/hive-config.json" ]; then
        print_info "Initializing Claude Flow..."
        cd "$PROJECT_DIR"
        npx claude-flow@alpha init --quiet 2>/dev/null || print_warning "Claude Flow initialization skipped"
        cd - > /dev/null
    fi
    
    print_success "Claude Flow ready"
}

# Install TMux components
install_tmux_components() {
    if [ "$INSTALL_TMUX" != true ]; then
        return
    fi
    
    print_header "Installing TMux Orchestrator Components"
    
    # Copy TMux scripts
    if [ -d "$SCRIPT_DIR/tmux-scripts" ]; then
        cp -r "$SCRIPT_DIR/tmux-scripts/"* "$INSTALL_DIR/tmux-scripts/"
        chmod +x "$INSTALL_DIR/tmux-scripts/"*.sh
        print_success "TMux scripts installed"
    fi
    
    # Create TMux configuration
    cat > "$PROJECT_DIR/.tmux-orchestrator/config.json" << 'EOF'
{
  "sessions": {
    "default_windows": {
      "simpleSwarm": 1,
      "hiveMind": 4,
      "hiveMindSparc": 6
    },
    "auto_restart": true,
    "log_sessions": true
  }
}
EOF
    
    print_success "TMux Orchestrator configured"
}

# Create modular CLI
create_modular_cli() {
    print_header "Creating Modular CLI"
    
    cat > "$INSTALL_DIR/bin/ai-workflow" << 'EOF'
#!/bin/bash

# Modular AI Workflow CLI
# Adapts based on installed components

INSTALL_DIR="$(dirname "$(dirname "$(readlink -f "$0")")")"
PROJECT_DIR="$(pwd)"
CONFIG_FILE="$INSTALL_DIR/installation-config.json"

# Load configuration
if [ -f "$CONFIG_FILE" ]; then
    COMPONENTS=$(jq -r '.components' "$CONFIG_FILE" 2>/dev/null || echo '{}')
    HAS_CLAUDE_CODE=$(echo "$COMPONENTS" | jq -r '.claudeCode' 2>/dev/null || echo "false")
    HAS_AGENT_OS=$(echo "$COMPONENTS" | jq -r '.agentOS' 2>/dev/null || echo "false")
    HAS_CLAUDE_FLOW=$(echo "$COMPONENTS" | jq -r '.claudeFlow' 2>/dev/null || echo "false")
    HAS_TMUX=$(echo "$COMPONENTS" | jq -r '.tmux' 2>/dev/null || echo "false")
else
    HAS_CLAUDE_CODE="false"
    HAS_AGENT_OS="false"
    HAS_CLAUDE_FLOW="false"
    HAS_TMUX="false"
fi

case "$1" in
    supervisor)
        shift
        action="$1"; shift || true
        PID_FILE="$INSTALL_DIR/supervisor/supervisor.pid"
        case "$action" in
            start)
                INTERVAL=${1:-1800}
                if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
                    echo "Supervisor already running (PID $(cat "$PID_FILE")). Use 'supervisor stop' first."
                else
                    nohup "$INSTALL_DIR/supervisor/supervisor.sh" "$INTERVAL" >/dev/null 2>&1 &
                    echo $! > "$PID_FILE"
                    echo "Supervisor started (PID $(cat "$PID_FILE")) at interval ${INTERVAL}s"
                fi
                ;;
            stop)
                if [ -f "$PID_FILE" ]; then
                    kill "$(cat "$PID_FILE")" 2>/dev/null || true
                    rm -f "$PID_FILE"
                    echo "Supervisor stopped."
                else
                    echo "No supervisor PID file found."
                fi
                ;;
            status|*)
                if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
                    echo "Supervisor running (PID $(cat "$PID_FILE")). Log: $INSTALL_DIR/logs/supervisor.log"
                else
                    echo "Supervisor not running."
                fi
                ;;
        esac
        ;;
    status-dashboard)
        shift
        PORT=${1:-8787}
        if [ "${AI_TOOLS_USE_NPX:-false}" = "true" ] && command -v npx >/dev/null 2>&1; then
            (AGENT_BUS_PORT=$PORT npx --yes --package ai-workflow-tools@${AI_TOOLS_VERSION:-latest} agent-bus-http >/dev/null 2>&1 &) || true
            echo "Agent Bus HTTP dashboard (npx) on http://localhost:$PORT"
            echo "SSE stream: http://localhost:$PORT/events/stream?type=prompt|tool|response"
        elif [ -f "$INSTALL_DIR/bin/tmp_rovodev_agent_bus_http.js" ]; then
            AGENT_BUS_PORT=$PORT node "$INSTALL_DIR/bin/tmp_rovodev_agent_bus_http.js" &
            echo "Agent Bus HTTP dashboard started on http://localhost:$PORT"
            echo "SSE stream: http://localhost:$PORT/events/stream?type=prompt|tool|response"
        else
            echo "Dashboard script not found."
        fi
        ;;
    mcp)
        shift
        subcmd="$1"; shift || true
        case "$subcmd" in
            refresh|discover|scan)
                node "$INSTALL_DIR/lib/mcp-discover.js" "$INSTALL_DIR/configs/mcp-registry.json"
                if command -v jq >/dev/null 2>&1; then
                    echo "\nDetected MCP Servers:" && jq -r '.servers | to_entries[] | "  - \(.key): \(.value)"' "$INSTALL_DIR/configs/mcp-registry.json" 2>/dev/null || true
                    echo "\nDetected Tools:" && jq -r '.tools[] | "  - \(.name) (\(.type)\(.server? // ""))"' "$INSTALL_DIR/configs/mcp-registry.json" 2>/dev/null || true
                else
                    cat "$INSTALL_DIR/configs/mcp-registry.json"
                fi
                ;;
            *)
                echo "Usage: ai-workflow mcp refresh" ;;
        esac
        ;;
    init)
        shift
        node "$INSTALL_DIR/workflow-runner.js" init "$@"
        ;;
    analyze)
        shift
        node "$INSTALL_DIR/intelligence-engine/complexity-analyzer.js" "$@"
        ;;
    prompt)
        # Re-collect or execute saved prompt
        shift
        if [ "$1" = "edit" ]; then
            ${EDITOR:-nano} "$INSTALL_DIR/initial-prompt.md"
        else
            echo "Executing saved prompt..."
            node "$INSTALL_DIR/workflow-runner.js" execute-prompt
        fi
        ;;
    yolo)
        # Toggle or check YOLO mode
        shift
        case "$1" in
            on)
                # Enable YOLO mode
                if [ -f "$CONFIG_FILE" ]; then
                    jq '.claudeCommand = "yolo" | .skipPermissions = true' "$CONFIG_FILE" > "$CONFIG_FILE.tmp" && mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"
                    echo "✓ YOLO mode enabled - using 'yolo' command"
                fi
                ;;
            off)
                # Disable YOLO mode
                if [ -f "$CONFIG_FILE" ]; then
                    jq '.claudeCommand = "claude" | .skipPermissions = false' "$CONFIG_FILE" > "$CONFIG_FILE.tmp" && mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"
                    echo "✓ YOLO mode disabled - using standard 'claude' command"
                fi
                ;;
            status|*)
                # Show current mode
                if [ -f "$CONFIG_FILE" ]; then
                    CURRENT_CMD=$(jq -r '.claudeCommand' "$CONFIG_FILE" 2>/dev/null || echo "claude")
                    SKIP_PERMS=$(jq -r '.skipPermissions' "$CONFIG_FILE" 2>/dev/null || echo "false")
                    echo "Current Claude command: $CURRENT_CMD"
                    echo "Skip permissions: $SKIP_PERMS"
                fi
                ;;
        esac
        ;;
    components)
        echo "Installed Components:"
        echo "  Core Workflow: ✓"
        [ "$HAS_CLAUDE_CODE" = "true" ] && echo "  Claude Code: ✓" || echo "  Claude Code: ✗"
        [ "$HAS_AGENT_OS" = "true" ] && echo "  Agent-OS: ✓" || echo "  Agent-OS: ✗"
        [ "$HAS_CLAUDE_FLOW" = "true" ] && echo "  Claude Flow: ✓" || echo "  Claude Flow: ✗"
        [ "$HAS_TMUX" = "true" ] && echo "  TMux Orchestrator: ✓" || echo "  TMux Orchestrator: ✗"
        
        # Also show Claude command mode
        if [ -f "$CONFIG_FILE" ]; then
            CURRENT_CMD=$(jq -r '.claudeCommand' "$CONFIG_FILE" 2>/dev/null || echo "claude")
            echo ""
            echo "Claude Command Mode: $CURRENT_CMD"
        fi
        ;;
    verify)
        # Verify all components work together
        echo "Verifying Component Integration..."
        echo ""
        
        # Check core system
        echo "Core System:"
        [ -f "$INSTALL_DIR/workflow-runner.js" ] && echo "  ✓ Workflow runner" || echo "  ✗ Workflow runner missing"
        [ -f "$INSTALL_DIR/intelligence-engine/complexity-analyzer.js" ] && echo "  ✓ Complexity analyzer" || echo "  ✗ Complexity analyzer missing"
        [ -f "$INSTALL_DIR/intelligence-engine/project-scanner.js" ] && echo "  ✓ Project scanner" || echo "  ✗ Project scanner missing"
        
        # Check Claude Code if installed
        if [ "$HAS_CLAUDE_CODE" = "true" ]; then
            echo ""
            echo "Claude Code Integration:"
            [ -d "$PROJECT_DIR/.claude/agents" ] && echo "  ✓ Agents directory" || echo "  ✗ Agents missing"
            [ -f "$PROJECT_DIR/.claude/agents/recovery-specialist.md" ] && echo "  ✓ Recovery specialist" || echo "  ✗ Recovery specialist missing"
            [ -d "$INSTALL_DIR/hooks" ] && echo "  ✓ Hooks configured" || echo "  ✗ Hooks missing"
            
            if [ -f "$CONFIG_FILE" ]; then
                CLAUDE_CMD=$(jq -r '.claudeCommand' "$CONFIG_FILE" 2>/dev/null || echo "not set")
                echo "  Claude command: $CLAUDE_CMD"
            fi
        fi
        
        # Check Agent-OS if installed
        if [ "$HAS_AGENT_OS" = "true" ]; then
            echo ""
            echo "Agent-OS Integration:"
            [ -f "$PROJECT_DIR/.agent-os/instructions/instructions.md" ] && echo "  ✓ Instructions customized" || echo "  ✗ Instructions missing"
            [ -f "$PROJECT_DIR/.agent-os/agentOS-config.json" ] && echo "  ✓ Configuration" || echo "  ✗ Configuration missing"
            
            # Check if customization happened
            if [ -f "$PROJECT_DIR/.agent-os/instructions/instructions.md" ]; then
                grep -q "JavaScript" "$PROJECT_DIR/.agent-os/instructions/instructions.md" 2>/dev/null && echo "  ✓ Tech-specific guidelines" || echo "  ⚠ Generic guidelines only"
            fi
        fi
        
        # Check Claude Flow if installed
        if [ "$HAS_CLAUDE_FLOW" = "true" ]; then
            echo ""
            echo "Claude Flow Integration:"
            [ -d "$PROJECT_DIR/.claude-flow" ] && echo "  ✓ Claude Flow initialized" || echo "  ✗ Not initialized"
            FLOW_VERSION="${CLAUDE_FLOW_VERSION:-alpha}"
            echo "  Version: $FLOW_VERSION"
        fi
        
        # Check TMux if installed
        if [ "$HAS_TMUX" = "true" ]; then
            echo ""
            echo "TMux Orchestrator:"
            [ -d "$INSTALL_DIR/tmux-scripts" ] && echo "  ✓ TMux scripts" || echo "  ✗ Scripts missing"
            [ -d "$PROJECT_DIR/.tmux-orchestrator" ] && echo "  ✓ Configuration" || echo "  ✗ Configuration missing"
        else
            echo ""
            echo "TMux: Not installed (using process mode)"
        fi
        
        # Check communication
        echo ""
        echo "Component Communication:"
        [ -f "$PROJECT_DIR/.ai-dev/analysis.json" ] && echo "  ✓ Project analysis available" || echo "  ⚠ No analysis performed"
        [ -f "$CONFIG_FILE" ] && echo "  ✓ Installation config" || echo "  ✗ Config missing"
        
        # Test workflow execution readiness
        echo ""
        echo "Workflow Readiness:"
        if [ -f "$INSTALL_DIR/workflow-runner.js" ] && [ -f "$CONFIG_FILE" ]; then
            echo "  ✓ Ready to execute workflows"
        else
            echo "  ✗ Not ready - missing components"
        fi
        ;;
    add)
        # Add component post-installation
        shift
        case "$1" in
            claude-code|claudecode)
                echo "Adding Claude Code integration..."
                # Re-run installer for specific component
                ;;
            agent-os|agentos)
                echo "Adding Agent-OS integration..."
                ;;
            claude-flow|claudeflow)
                echo "Adding Claude Flow 2.0..."
                ;;
            tmux)
                echo "Adding TMux Orchestrator..."
                ;;
            *)
                echo "Unknown component: $1"
                echo "Available: claude-code, agent-os, claude-flow, tmux"
                ;;
        esac
        ;;
    bus)
        shift
        subcmd="$1"; shift || true
        case "$subcmd" in
            tail)
                if [ -f "$INSTALL_DIR/bin/tmp_rovodev_agent_bus_tail.sh" ]; then
                    bash "$INSTALL_DIR/bin/tmp_rovodev_agent_bus_tail.sh" "$@"
                else
                    echo "Tail script not found."
                fi
                ;;
            tui)
                if [ -f "$INSTALL_DIR/bin/tmp_rovodev_agent_bus_tui.js" ]; then
                    if [ "${AI_TOOLS_USE_NPX:-false}" = "true" ] && command -v npx >/dev/null 2>&1; then
                    npx --yes --package ai-workflow-tools@${AI_TOOLS_VERSION:-latest} agent-bus-tui "$@"
                else
                    node "$INSTALL_DIR/bin/tmp_rovodev_agent_bus_tui.js" "$@"
                fi
                else
                    echo "TUI script not found."
                fi
                ;;
            *) echo "Usage: ai-workflow bus tail|tui [--type T] [--agent A] [--role R]" ;;
        esac
        ;;
    help|--help|-h)
        cat << HELP
Modular AI Workflow System

Core Commands (always available):
  init [options]          Initialize workflow
  analyze [path]          Analyze project complexity
  prompt [edit]           View/edit saved prompt
  components              List installed components
  verify                  Verify component integration
  add [component]         Add component post-install
  yolo [on|off|status]    Manage YOLO mode (skip permissions)
  help                    Show this help

EOF
        
        if [ "$HAS_CLAUDE_CODE" = "true" ]; then
            echo "Claude Code Commands:"
            echo "  agents list            List installed agents"
            echo "  agents status          Show agent status"
            echo ""
        fi
        
        if [ "$HAS_CLAUDE_FLOW" = "true" ]; then
            echo "Claude Flow Commands:"
            echo "  swarm [task]           Run simple swarm"
            echo "  hive [project]         Run hive-mind"
            echo "  sparc                  Run SPARC wizard"
            echo ""
        fi
        
        if [ "$HAS_TMUX" = "true" ]; then
            echo "TMux Commands:"
            echo ""
            echo "Bus Commands:"
            echo "  bus tail [--type T] [--agent A] [--role R]  Tail the event bus"
            echo "  status-dashboard [port]                    Start HTTP+SSE dashboard"
            echo "  tmux start             Start background session"
            echo "  tmux attach            Attach to session"
            echo "  tmux list              List sessions"
            echo ""
        fi
        
        echo "Environment Variables:"
        echo "  CLAUDE_FLOW_VERSION    Claude Flow version"
        echo "  AI_WORKFLOW_MODE       Default mode"
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
    
    print_success "Modular CLI created"
}

# Save installation configuration
save_installation_config() {
    cat > "$CONFIG_FILE" << EOF
{
  "version": "2.0",
  "components": {
    "core": true,
    "claudeCode": $INSTALL_CLAUDE_CODE,
    "agentOS": $INSTALL_AGENT_OS,
    "claudeFlow": $INSTALL_CLAUDE_FLOW,
    "tmux": $INSTALL_TMUX
  },
  "executionMode": $([ "$INSTALL_TMUX" = true ] && echo '"tmux"' || echo '"process"'),
  "claudeCommand": "$CLAUDE_COMMAND",
  "skipPermissions": $SKIP_PERMISSIONS,
  "initialPrompt": "$PROMPT_FILE",
  "recommendedApproach": "${RECOMMENDED_APPROACH:-standard}",
  "installedAt": "$(date -Iseconds)",
  "projectDir": "$PROJECT_DIR",
  "installDir": "$INSTALL_DIR"
}
EOF
    
    print_success "Configuration saved with Claude command: $CLAUDE_COMMAND"
}

# Main installation flow
main() {
    clear
    print_header "🚀 Intelligent Workflow System - Modular Installer"
    
    echo -e "${CYAN}This installer will help you set up a customized workflow system.${NC}"
    echo -e "${CYAN}You can choose which components to install based on your needs.${NC}"
    echo ""
    echo -e "${YELLOW}Press any key to continue...${NC}"
    read -n 1
    
    # Step 1: Component selection
    handle_component_selection
    
    # Step 2: Show selected components
    clear
    print_header "Selected Components"
    echo -e "  ${GREEN}✓${NC} Core Workflow System"
    [ "$INSTALL_CLAUDE_CODE" = true ] && echo -e "  ${GREEN}✓${NC} Claude Code Integration"
    [ "$INSTALL_AGENT_OS" = true ] && echo -e "  ${GREEN}✓${NC} Agent-OS Planning System"
    [ "$INSTALL_CLAUDE_FLOW" = true ] && echo -e "  ${GREEN}✓${NC} Claude Flow 2.0 Multi-Agent"
    [ "$INSTALL_TMUX" = true ] && echo -e "  ${GREEN}✓${NC} TMux Orchestrator"
    echo ""
    
    # Step 3: Configure Claude Code execution mode (if Claude Code selected)
    CLAUDE_COMMAND="claude"
    SKIP_PERMISSIONS="false"
    
    if [ "$INSTALL_CLAUDE_CODE" = true ]; then
        echo ""
        read -p "Do you have a 'yolo' alias for Claude Code with --dangerously-skip-permissions? (y/n): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            CLAUDE_COMMAND="yolo"
            SKIP_PERMISSIONS="true"
            print_info "YOLO mode enabled - will use 'yolo' command"
        else
            read -p "Would you like to use --dangerously-skip-permissions? (y/n): " -n 1 -r
            echo ""
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                CLAUDE_COMMAND="claude --dangerously-skip-permissions"
                SKIP_PERMISSIONS="true"
                print_info "Permissions skipping enabled"
            else
                CLAUDE_COMMAND="claude"
                SKIP_PERMISSIONS="false"
                print_info "Standard Claude Code mode (with permissions)"
            fi
        fi
    fi
    
    # Step 4: Collect initial prompt
    read -p "Would you like to enter an initial project prompt? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        collect_initial_prompt
    fi
    
    # Step 4: Check dependencies
    print_header "Checking Dependencies"
    
    if ! check_node; then
        read -p "Install Node.js 20? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            install_node
        else
            print_error "Node.js 18+ is required. Please install and try again."
            exit 1
        fi
    fi
    
    check_optional_dependencies
    
    # Step 5: Create directories
    create_directory_structure
    
    # Step 6: Install components
    install_core_system
    # Decide version and generate docs before CF init so templates are ready
    decide_claude_flow_version
    generate_approach_and_docs
    install_claude_code_components
    install_agent_os_components
    generate_hive_config
    install_claude_flow_components
    install_tmux_components
    
    # Step 7: Create CLI
    create_modular_cli
    
    # Step 8: Save configuration

    # Generate MCP registry
    node "$INSTALL_DIR/lib/mcp-discover.js" "$INSTALL_DIR/configs/mcp-registry.json" >/dev/null 2>&1 || true

    # Start background supervisor loop to re-run analysis and refresh docs
    cat > "$INSTALL_DIR/supervisor/supervisor.sh" << 'EOF'
#!/bin/bash
set -e
INSTALL_DIR="$(dirname "$0")/.."
PROJECT_DIR="$(pwd)"
ANALYSIS_FILE="$PROJECT_DIR/.ai-dev/analysis.json"
APPROACH_JSON="$INSTALL_DIR/configs/approach.json"
LOG_FILE="$INSTALL_DIR/logs/supervisor.log"
INTERVAL=${1:-1800} # seconds

log() { echo "[$(date -Iseconds)] $1" | tee -a "$LOG_FILE"; }

# Optional filesystem event watcher (Linux) using inotifywait
start_inotify_watcher() {
  if command -v inotifywait >/dev/null 2>&1; then
    log "Starting inotify-based file watcher"
    (
      inotifywait -mr -e modify,create,delete --exclude '\\.git|\\.ai-workflow|\\.claude|\\.agent-os|\\.claude-flow|node_modules' "$PROJECT_DIR" 2>/dev/null \
      | while read -r path _ file; do
          log "File change detected: $path$file"
          if [ -f "$INSTALL_DIR/intelligence-engine/complexity-analyzer.js" ]; then
            node "$INSTALL_DIR/intelligence-engine/complexity-analyzer.js" > "$ANALYSIS_FILE" 2>>"$LOG_FILE" || log "Analysis failed (fswatch)"
          fi
          if [ -f "$ANALYSIS_FILE" ]; then
            CLAUDE_FLOW_VERSION=${CLAUDE_FLOW_VERSION:-alpha} node "$INSTALL_DIR/lib/select-approach.js" "$ANALYSIS_FILE" "$APPROACH_JSON" >>"$LOG_FILE" 2>&1 || log "Approach selection failed (fswatch)"
            node "$INSTALL_DIR/lib/generate-docs.js" "$ANALYSIS_FILE" "$APPROACH_JSON" >>"$LOG_FILE" 2>&1 || log "Doc generation failed (fswatch)"
          fi
        done
    ) &
  else
    log "inotifywait not found; file watcher disabled"
  fi
}

# Determine latest tmux session started by orchestrator
get_tmux_session() {
  local infoDir="$INSTALL_DIR/logs/sessions"
  local latestFile
  latestFile=$(ls -1t "$infoDir"/*.info 2>/dev/null | head -n 1)
  if [ -n "$latestFile" ] && command -v jq >/dev/null 2>&1; then
    jq -r '.session // empty' "$latestFile"
  fi
}

# macOS fswatch watcher
start_fswatch_watcher() {
  if command -v fswatch >/dev/null 2>&1; then
    log "Starting fswatch-based file watcher"
    (
      fswatch -0 -or --exclude='\.git' --exclude='\.ai-workflow' --exclude='\.claude' --exclude='\.agent-os' --exclude='\.claude-flow' --exclude='node_modules' "$PROJECT_DIR" \
      | while IFS= read -r -d '' event; do
          log "File change detected (fswatch): $event"
          if [ -f "$INSTALL_DIR/intelligence-engine/complexity-analyzer.js" ]; then
            node "$INSTALL_DIR/intelligence-engine/complexity-analyzer.js" > "$ANALYSIS_FILE" 2>>"$LOG_FILE" || log "Analysis failed (fswatch)"
          fi
          if [ -f "$ANALYSIS_FILE" ]; then
            CLAUDE_FLOW_VERSION=${CLAUDE_FLOW_VERSION:-alpha} node "$INSTALL_DIR/lib/select-approach.js" "$ANALYSIS_FILE" "$APPROACH_JSON" >>"$LOG_FILE" 2>&1 || log "Approach selection failed (fswatch)"
            node "$INSTALL_DIR/lib/generate-docs.js" "$ANALYSIS_FILE" "$APPROACH_JSON" >>"$LOG_FILE" 2>&1 || log "Doc generation failed (fswatch)"
          fi
        done
    ) &
  else
    log "fswatch not found; macOS watcher disabled"
  fi
}

# Start watcher in background (non-blocking)
start_inotify_watcher
start_fswatch_watcher

# Capture previous selected approach (if any)
PREV_SELECTED=""
if [ -f "$APPROACH_JSON" ]; then
  PREV_SELECTED=$(jq -r '.selected // empty' "$APPROACH_JSON" 2>/dev/null)
fi

while true; do
  log "Supervisor tick - re-analyzing project"
  if [ -f "$INSTALL_DIR/intelligence-engine/complexity-analyzer.js" ]; then
    node "$INSTALL_DIR/intelligence-engine/complexity-analyzer.js" > "$ANALYSIS_FILE" 2>>"$LOG_FILE" || log "Analysis failed"
  fi
  if [ -f "$ANALYSIS_FILE" ]; then
    CLAUDE_FLOW_VERSION=${CLAUDE_FLOW_VERSION:-alpha} node "$INSTALL_DIR/lib/select-approach.js" "$ANALYSIS_FILE" "$APPROACH_JSON" >>"$LOG_FILE" 2>&1 || log "Approach selection failed"
    # Detect approach change
    # Broadcast approach change to event bus if changed
    BUS_FILE="$INSTALL_DIR/logs/agent-bus.jsonl"
    TS=$(date -Iseconds)
    OLD="$PREV_SELECTED"
    if [ -f "$APPROACH_JSON" ]; then
      NEW_SELECTED=$(jq -r '.selected // empty' "$APPROACH_JSON" 2>/dev/null)
    fi
    if [ -n "$NEW_SELECTED" ] && [ "$NEW_SELECTED" != "$OLD" ]; then
      echo "{\"ts\":\"$TS\",\"type\":\"approach_change\",\"agent\":\"supervisor\",\"role\":\"watcher\",\"from\":\"$OLD\",\"to\":\"$NEW_SELECTED\"}" >> "$BUS_FILE"
    fi

    NEW_SELECTED=""
    if [ -f "$APPROACH_JSON" ]; then
      NEW_SELECTED=$(jq -r '.selected // empty' "$APPROACH_JSON" 2>/dev/null)
    fi
    if [ -n "$NEW_SELECTED" ] && [ "$NEW_SELECTED" != "$PREV_SELECTED" ]; then
      log "Approach changed from '$PREV_SELECTED' to '$NEW_SELECTED'"
      PREV_SELECTED="$NEW_SELECTED"
      # Restart orchestration if tmux is installed and selected
      if command -v tmux >/dev/null 2>&1 && tmux has-session -t "$TMUX_SESSION" 2>/dev/null; then
        tmux kill-session -t "$TMUX_SESSION" 2>/dev/null || true
      fi
      if command -v tmux >/dev/null 2>&1; then
        WORKFLOW_TYPE="hive-mind"
        if echo "$NEW_SELECTED" | grep -qi 'hiveMindSparc'; then WORKFLOW_TYPE="hive-mind-sparc"; fi
        if echo "$NEW_SELECTED" | grep -qi 'simpleSwarm'; then WORKFLOW_TYPE="simple-swarm"; fi
        CLAUDE_FLOW_VERSION=${CLAUDE_FLOW_VERSION:-alpha} "$INSTALL_DIR/tmux-scripts/orchestrate-workflow.sh" "${PROJECT_NAME:-workflow}" "$WORKFLOW_TYPE" || log "TMux orchestration restart failed"
      fi
    fi
    node "$INSTALL_DIR/lib/generate-docs.js" "$ANALYSIS_FILE" "$APPROACH_JSON" >>"$LOG_FILE" 2>&1 || log "Doc generation failed"
  fi
  sleep "$INTERVAL"
done
EOF
    chmod +x "$INSTALL_DIR/supervisor/supervisor.sh"

    # On Windows without tmux, try to start PowerShell supervisor automatically
    if [[ "$OS_TYPE" == "windows" ]]; then
      if command -v powershell >/dev/null 2>&1; then
        powershell -NoProfile -WindowStyle Hidden -Command "Start-Process pwsh -ArgumentList '-NoProfile','-File','supervisor-windows.ps1'" 2>/dev/null || true
      fi
    fi

    read -p "Start the background supervisor to auto-refresh analysis/docs? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      nohup "$INSTALL_DIR/supervisor/supervisor.sh" 1800 >/dev/null 2>&1 &
      echo $! > "$INSTALL_DIR/supervisor/supervisor.pid"
      print_success "Supervisor started (every 30 min). Logs: $INSTALL_DIR/logs/supervisor.log"
    else
      print_info "You can start it later: $INSTALL_DIR/supervisor/supervisor.sh [seconds]"
    fi

    save_installation_config
    
    # Step 9: Final summary

    # Optional auto-run
    echo ""
    read -p "Would you like to auto-run the selected approach now? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Decide execution based on components and mode
        if [ "$INSTALL_TMUX" = true ]; then
            WORKFLOW_TYPE="hive-mind"
            if [ -f "$INSTALL_DIR/configs/approach.json" ]; then
                if grep -q 'hiveMindSparc' "$INSTALL_DIR/configs/approach.json" 2>/dev/null; then
                    WORKFLOW_TYPE="hive-mind-sparc"
                elif grep -q 'simpleSwarm' "$INSTALL_DIR/configs/approach.json" 2>/dev/null; then
                    WORKFLOW_TYPE="simple-swarm"
                fi
            fi
            CLAUDE_FLOW_VERSION=${CLAUDE_FLOW_VERSION:-alpha} "$INSTALL_DIR/tmux-scripts/orchestrate-workflow.sh" "${PROJECT_NAME:-workflow}" "$WORKFLOW_TYPE" || print_warning "TMux orchestration failed"
        else
            # No tmux: run approach command directly
            if [ -f "$INSTALL_DIR/configs/approach.json" ]; then
                CMD=$(jq -r '.command' "$INSTALL_DIR/configs/approach.json" 2>/dev/null)
                if [ -n "$CMD" ] && [ "$INSTALL_CLAUDE_FLOW" = true ]; then
                    echo "Running: $CMD"
                    bash -lc "$CMD" || print_warning "Approach command failed"
                else
                    print_warning "Claude Flow not installed or command missing; skipping"
                fi
            else
                print_warning "No approach.json found; skipping auto-run"
            fi
        fi
    fi


    print_header "✅ Installation Complete!"
    
    echo -e "${GREEN}The Intelligent Workflow System has been installed!${NC}\n"
    
    echo -e "${CYAN}📁 Installation Summary:${NC}"
    echo -e "  • Core System: $INSTALL_DIR"
    [ "$INSTALL_CLAUDE_CODE" = true ] && echo -e "  • Claude Code: Agents & Commands installed"
    [ "$INSTALL_AGENT_OS" = true ] && echo -e "  • Agent-OS: Planning system ready"
    [ "$INSTALL_CLAUDE_FLOW" = true ] && echo -e "  • Claude Flow: Multi-agent system ready"
    [ "$INSTALL_TMUX" = true ] && echo -e "  • TMux: 24/7 operation enabled"
    echo ""
    
    echo -e "${CYAN}🚀 Quick Start:${NC}"
    echo -e "  ${BOLD}./ai-workflow components${NC}  - View installed components"
    echo -e "  ${BOLD}./ai-workflow analyze${NC}     - Analyze project complexity"
    
    if [ -f "$PROMPT_FILE" ] && [ -s "$PROMPT_FILE" ]; then
        echo -e "  ${BOLD}./ai-workflow prompt${NC}      - Execute saved prompt"
    fi
    
    if [ "$INSTALL_CLAUDE_FLOW" = true ]; then
        echo -e "  ${BOLD}./ai-workflow init --auto${NC} - Start automatic workflow"
    fi
    
    echo ""
    echo -e "${GREEN}Installation complete! Your workflow system is ready.${NC}"
    
    # Ask if user wants to execute saved prompt
    if [ -f "$PROMPT_FILE" ] && [ -s "$PROMPT_FILE" ]; then
        echo ""
        read -p "Would you like to execute your saved prompt now? (y/n): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "Executing prompt..."
            ./ai-workflow prompt
        fi
    fi
}

# Run main installation
main "$@"