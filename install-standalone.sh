#!/bin/bash

# Intelligent Workflow Decision System - Standalone Installer
# Installs the complete system in the current project directory
# Each installation is completely independent

set -e

# Installation directory is current directory
PROJECT_DIR="$(pwd)"
INSTALL_DIR="$PROJECT_DIR/.ai-workflow"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

# Script directory (where this installer is located)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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

# Welcome message
clear
echo -e "${BOLD}${MAGENTA}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${MAGENTA}║   Intelligent Workflow Decision System Installer    ║${NC}"
echo -e "${BOLD}${MAGENTA}║           Standalone Project Installation           ║${NC}"
echo -e "${BOLD}${MAGENTA}╚══════════════════════════════════════════════════════╝${NC}\n"

echo -e "${CYAN}Installing in: ${BOLD}$PROJECT_DIR${NC}\n"

# Step 1: Check prerequisites
print_header "Step 1: Checking Prerequisites"

check_command() {
    if command -v $1 &> /dev/null; then
        print_success "$1 is installed"
        return 0
    else
        print_error "$1 is not installed"
        return 1
    fi
}

MISSING_DEPS=0
if ! check_command node; then
    MISSING_DEPS=1
    echo "  Install Node.js 18+ from: https://nodejs.org"
fi

if ! check_command npm; then
    MISSING_DEPS=1
fi

if [ $MISSING_DEPS -eq 1 ]; then
    print_error "Please install missing dependencies first"
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ required (found: $(node -v))"
    exit 1
fi

print_success "All prerequisites satisfied"

# Step 2: Create local installation directory
print_header "Step 2: Creating Local Installation"

# Create directory structure
mkdir -p "$INSTALL_DIR"/{intelligence-engine,bin,templates,configs,logs}
mkdir -p "$PROJECT_DIR"/.ai-dev
mkdir -p "$PROJECT_DIR"/.claude
mkdir -p "$PROJECT_DIR"/.claude/agents
mkdir -p "$PROJECT_DIR"/.claude/commands
mkdir -p "$PROJECT_DIR"/.agent-os/specs
mkdir -p "$PROJECT_DIR"/.agent-os/plans
mkdir -p "$PROJECT_DIR"/.agent-os/tasks
mkdir -p "$PROJECT_DIR"/.claude-flow/sparc-phases
mkdir -p "$PROJECT_DIR"/.tmux-orchestrator

print_success "Directory structure created"

# Step 3: Copy intelligence engine
print_header "Step 3: Installing Intelligence Engine"

if [ -d "$SCRIPT_DIR/intelligence-engine" ]; then
    cp -r "$SCRIPT_DIR/intelligence-engine/"* "$INSTALL_DIR/intelligence-engine/"
    chmod +x "$INSTALL_DIR/intelligence-engine/user-choice-handler.sh"
    print_success "Intelligence engine installed"
else
    print_error "Intelligence engine not found in $SCRIPT_DIR"
    exit 1
fi

# Step 3.5: Copy agent templates and slash commands
print_header "Step 3.5: Installing Agent Templates and Slash Commands"

# Copy agent templates
if [ -d "$SCRIPT_DIR/agent-templates" ]; then
    mkdir -p "$INSTALL_DIR/agent-templates"
    cp -r "$SCRIPT_DIR/agent-templates/"* "$INSTALL_DIR/agent-templates/"
    print_success "Agent templates installed"
else
    print_warning "Agent templates not found, skipping"
fi

# Copy slash commands
if [ -d "$SCRIPT_DIR/slash-commands" ]; then
    mkdir -p "$INSTALL_DIR/slash-commands"
    cp -r "$SCRIPT_DIR/slash-commands/"* "$INSTALL_DIR/slash-commands/"
    print_success "Slash commands installed"
else
    print_warning "Slash commands not found, skipping"
fi

# Copy orchestration configs
if [ -d "$SCRIPT_DIR/configs" ]; then
    cp "$SCRIPT_DIR/configs/orchestration.json" "$INSTALL_DIR/configs/" 2>/dev/null || true
    cp "$SCRIPT_DIR/configs/agent-mappings.json" "$INSTALL_DIR/configs/" 2>/dev/null || true
    cp "$SCRIPT_DIR/configs/communication-protocol.json" "$INSTALL_DIR/configs/" 2>/dev/null || true
    print_success "Orchestration configs installed"
fi

# Step 4: Create local CLI wrapper
print_header "Step 4: Creating Local CLI"

cat > "$INSTALL_DIR/bin/ai-workflow" << 'EOF'
#!/bin/bash

# AI Workflow CLI - Local to this project
INSTALL_DIR="$(dirname "$(dirname "$0")")"
PROJECT_DIR="$(dirname "$(dirname "$INSTALL_DIR")")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

COMMAND=$1
shift

case $COMMAND in
    init)
        # Run initialization with intelligence engine
        MODE="${1:-interactive}"
        TASK="${2:-}"
        CLAUDE_FLOW_VERSION="${CLAUDE_FLOW_VERSION:-alpha}"
        
        export CLAUDE_FLOW_VERSION
        "$INSTALL_DIR/intelligence-engine/user-choice-handler.sh" "$MODE" "$TASK" "$PROJECT_DIR"
        ;;
        
    analyze)
        # Analyze project complexity
        node "$INSTALL_DIR/intelligence-engine/complexity-analyzer.js" "$PROJECT_DIR" | jq '.' 2>/dev/null || \
        node "$INSTALL_DIR/intelligence-engine/complexity-analyzer.js" "$PROJECT_DIR"
        ;;
        
    customize)
        # Generate customized documents
        if [ ! -f "$PROJECT_DIR/.ai-dev/analysis.json" ]; then
            echo "Running analysis first..."
            node "$INSTALL_DIR/intelligence-engine/complexity-analyzer.js" "$PROJECT_DIR" > "$PROJECT_DIR/.ai-dev/analysis.json"
        fi
        
        if [ ! -f "$PROJECT_DIR/.ai-dev/approach.json" ]; then
            echo "Selecting approach..."
            node "$INSTALL_DIR/intelligence-engine/approach-selector.js" "$PROJECT_DIR/.ai-dev/analysis.json" > "$PROJECT_DIR/.ai-dev/approach.json"
        fi
        
        node "$INSTALL_DIR/intelligence-engine/document-customizer.js" "$PROJECT_DIR/.ai-dev/analysis.json" "$PROJECT_DIR/.ai-dev/approach.json"
        ;;
        
    status)
        echo -e "${BOLD}AI Workflow System Status${NC}"
        echo -e "${CYAN}Installation Directory:${NC} $INSTALL_DIR"
        echo -e "${CYAN}Project Directory:${NC} $PROJECT_DIR"
        
        if [ -f "$PROJECT_DIR/.ai-dev/approach.json" ]; then
            APPROACH=$(cat "$PROJECT_DIR/.ai-dev/approach.json" | grep -o '"name":"[^"]*' | cut -d'"' -f4)
            echo -e "${CYAN}Selected Approach:${NC} $APPROACH"
        else
            echo -e "${YELLOW}No approach selected yet${NC}"
        fi
        ;;
        
    help|--help|-h|"")
        echo -e "${BOLD}AI Workflow System - Local Installation${NC}"
        echo ""
        echo "Usage: ./ai-workflow [command] [options]"
        echo ""
        echo "Commands:"
        echo "  init [mode] [task]    Initialize with intelligent approach selection"
        echo "    Modes:"
        echo "      --auto            AI selects optimal approach"
        echo "      --interactive     Show analysis and let user choose (default)"
        echo "      --swarm          Force Simple Swarm"
        echo "      --hive           Force Hive-Mind"
        echo "      --sparc          Force Hive-Mind + SPARC"
        echo ""
        echo "  analyze              Analyze project complexity"
        echo "  customize            Generate customized documents"
        echo "  status               Show system status"
        echo "  help                 Show this help"
        echo ""
        echo "Environment Variables:"
        echo "  CLAUDE_FLOW_VERSION  Set Claude Flow version (alpha/beta/latest/2.0)"
        echo ""
        echo "Examples:"
        echo "  ./ai-workflow init --auto \"Build REST API\""
        echo "  ./ai-workflow analyze"
        echo "  CLAUDE_FLOW_VERSION=beta ./ai-workflow init --sparc"
        ;;
        
    *)
        echo "Unknown command: $COMMAND"
        echo "Run './ai-workflow help' for usage"
        exit 1
        ;;
esac
EOF

chmod +x "$INSTALL_DIR/bin/ai-workflow"

# Create convenience symlink in project root
ln -sf "$INSTALL_DIR/bin/ai-workflow" "$PROJECT_DIR/ai-workflow"

print_success "Local CLI created: ./ai-workflow"

# Step 5: Initialize project configuration
print_header "Step 5: Initializing Project Configuration"

# Create project config
cat > "$PROJECT_DIR/.ai-dev/config.json" << EOF
{
  "version": "2.0",
  "projectDir": "$PROJECT_DIR",
  "installDir": "$INSTALL_DIR",
  "initialized": "$(date -Iseconds)",
  "features": {
    "intelligenceEngine": true,
    "complexityAnalysis": true,
    "approachSelection": true,
    "documentCustomization": true,
    "sparcMethodology": true,
    "claudeFlowVersions": ["alpha", "beta", "latest", "2.0", "stable", "dev"]
  },
  "defaultSettings": {
    "claudeFlowVersion": "alpha",
    "mode": "interactive",
    "autoAnalyze": true,
    "generateDocs": true
  }
}
EOF

print_success "Project configuration created"

# Step 6: Create workflow templates
print_header "Step 6: Creating Workflow Templates"

# Simple workflow template
cat > "$INSTALL_DIR/templates/simple-workflow.json" << 'EOF'
{
  "name": "simple-workflow",
  "description": "Quick single-agent task execution",
  "approach": "simpleSwarm",
  "steps": [
    {
      "type": "analyze",
      "description": "Quick project analysis"
    },
    {
      "type": "execute",
      "command": "npx claude-flow@${version} swarm \"${task}\""
    }
  ]
}
EOF

# Hive-Mind workflow template
cat > "$INSTALL_DIR/templates/hive-workflow.json" << 'EOF'
{
  "name": "hive-workflow",
  "description": "Multi-agent coordination workflow",
  "approach": "hiveMind",
  "steps": [
    {
      "type": "analyze",
      "description": "Comprehensive project analysis"
    },
    {
      "type": "setup",
      "description": "Configure multi-agent environment"
    },
    {
      "type": "execute",
      "command": "npx claude-flow@${version} hive-mind spawn \"${project}\" --agents ${agentCount} --claude"
    }
  ]
}
EOF

# SPARC workflow template
cat > "$INSTALL_DIR/templates/sparc-workflow.json" << 'EOF'
{
  "name": "sparc-workflow",
  "description": "Enterprise SPARC methodology workflow",
  "approach": "hiveMindSparc",
  "steps": [
    {
      "type": "analyze",
      "description": "Deep project analysis"
    },
    {
      "type": "sparc-phases",
      "phases": [
        "specification",
        "pseudocode",
        "architecture",
        "refinement",
        "completion"
      ]
    },
    {
      "type": "execute",
      "command": "npx claude-flow@${version} hive-mind spawn \"${project}\" --sparc --agents ${agentCount} --claude"
    },
    {
      "type": "wizard",
      "command": "npx claude-flow@${version} sparc wizard --interactive"
    }
  ]
}
EOF

print_success "Workflow templates created"

# Step 7: Run initial analysis
print_header "Step 7: Running Initial Analysis"

print_info "Analyzing project..."
node "$INSTALL_DIR/intelligence-engine/complexity-analyzer.js" "$PROJECT_DIR" > "$PROJECT_DIR/.ai-dev/analysis.json" 2>/dev/null || {
    print_warning "Initial analysis failed - will run on first use"
}

if [ -f "$PROJECT_DIR/.ai-dev/analysis.json" ]; then
    SCORE=$(cat "$PROJECT_DIR/.ai-dev/analysis.json" | grep -o '"score":[0-9]*' | cut -d':' -f2)
    STAGE=$(cat "$PROJECT_DIR/.ai-dev/analysis.json" | grep -o '"stage":"[^"]*' | cut -d'"' -f4)
    
    echo -e "${CYAN}Project Analysis:${NC}"
    echo -e "  Complexity Score: ${BOLD}$SCORE/100${NC}"
    echo -e "  Project Stage: ${BOLD}$STAGE${NC}"
    
    print_success "Initial analysis complete"
fi

# Step 8: Create README for this installation
print_header "Step 8: Creating Documentation"

cat > "$INSTALL_DIR/README.md" << 'EOF'
# AI Workflow System - Local Installation

This directory contains the Intelligent Workflow Decision System for this project.

## Quick Start

```bash
# Analyze project
./ai-workflow analyze

# Initialize with AI selection
./ai-workflow init --auto "Your task description"

# Interactive mode (default)
./ai-workflow init

# Force specific approach
./ai-workflow init --sparc
./ai-workflow init --hive
./ai-workflow init --swarm

# Use specific Claude Flow version
CLAUDE_FLOW_VERSION=beta ./ai-workflow init --auto
```

## Features

- **Automatic Complexity Analysis**: Analyzes your project across 8 dimensions
- **Intelligent Approach Selection**: Chooses optimal Claude Flow approach
- **Multiple Claude Flow Versions**: alpha, beta, latest, 2.0, stable, dev
- **User Choice Modes**: Automatic, Interactive, Manual override
- **Deep Document Customization**: Tech-stack specific documentation
- **SPARC Methodology**: Enterprise development phases

## Approaches

1. **Simple Swarm** (0-30 complexity)
   - Quick tasks, single agent
   - Command: `npx claude-flow@[version] swarm`

2. **Hive-Mind** (31-70 complexity)
   - Multi-agent coordination
   - Command: `npx claude-flow@[version] hive-mind spawn`

3. **Hive-Mind + SPARC** (71-100 complexity)
   - Enterprise methodology
   - Command: `npx claude-flow@[version] hive-mind spawn --sparc`

## Project Structure

```
.ai-workflow/           # System installation (local to this project)
├── intelligence-engine/
├── bin/
├── templates/
└── configs/

.ai-dev/               # Project metadata
├── analysis.json      # Complexity analysis
├── approach.json      # Selected approach
└── config.json        # Configuration

.claude/               # Claude Code integration
.agent-os/             # Agent OS specs
.claude-flow/          # Claude Flow config
└── sparc-phases/      # SPARC methodology phases
```

## Customization

Edit `.ai-dev/config.json` to customize defaults:
- `claudeFlowVersion`: Default version (alpha/beta/latest/2.0)
- `mode`: Default mode (auto/interactive)
- `autoAnalyze`: Run analysis automatically
- `generateDocs`: Generate documentation automatically
EOF

print_success "Documentation created"

# Final summary
print_header "✨ Installation Complete!"

echo -e "${GREEN}The Intelligent Workflow Decision System has been installed locally in:${NC}"
echo -e "${BOLD}$INSTALL_DIR${NC}\n"

echo -e "${CYAN}Quick Start Commands:${NC}"
echo -e "  ${BOLD}./ai-workflow analyze${NC}         - Analyze project complexity"
echo -e "  ${BOLD}./ai-workflow init --auto${NC}     - Let AI select approach"
echo -e "  ${BOLD}./ai-workflow init${NC}            - Interactive mode"
echo -e "  ${BOLD}./ai-workflow help${NC}            - Show all commands\n"

echo -e "${CYAN}This installation is:${NC}"
echo -e "  ✅ Completely standalone"
echo -e "  ✅ Independent from other projects"
echo -e "  ✅ Locally configured"
echo -e "  ✅ Ready to use\n"

echo -e "${YELLOW}Next Step:${NC}"
echo -e "Run ${BOLD}./ai-workflow init${NC} to start using the system\n"

# Save installation info
cat > "$INSTALL_DIR/.installation-info" << EOF
{
  "installedAt": "$(date -Iseconds)",
  "installedFrom": "$SCRIPT_DIR",
  "projectDir": "$PROJECT_DIR",
  "nodeVersion": "$(node -v)",
  "standalone": true
}
EOF

exit 0