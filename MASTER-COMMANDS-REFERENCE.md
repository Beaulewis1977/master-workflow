# MASTER-COMMANDS-REFERENCE.md

## 📦 Installation Commands

### Main Installers

#### Interactive Modular Installation (Recommended)
```bash
./install-modular.sh
```
**Description**: Interactive installer that lets you select specific components based on your needs. Provides component selection menu and collects initial project prompt.

**Features**:
- Component selection menu (Core, Claude Code, Agent-OS, Claude Flow, TMux)
- Initial project prompt collection
- Claude Code execution mode configuration (YOLO mode support)
- Automatic dependency installation
- Project complexity analysis integration

**Usage Example**:
```bash
# Clone and navigate to project
git clone <repository> && cd project-directory

# Run interactive installer
/path/to/MASTER-WORKFLOW/install-modular.sh

# Follow prompts to select components and configure
```

**Expected Outcome**: Creates `.ai-workflow/` directory with selected components, symlinked CLI at `./ai-workflow`

---

#### Production Installation
```bash
./install-production.sh
```
**Description**: Installs all components for maximum functionality. Includes complete intelligence engine, all integrations, and production monitoring.

**What Gets Installed**:
- Complete intelligence engine
- All integrations (Claude Code, Agent-OS, Claude Flow)
- TMux orchestrator with fallback modes
- Full configuration templates
- Production logging and monitoring
- Recovery specialist agent
- All slash commands

**Best For**: Production environments, team collaboration, complex projects requiring all features

**Usage Example**:
```bash
cd /path/to/your/project
/path/to/MASTER-WORKFLOW/install-production.sh
```

---

#### AI-Dev-OS Integration
```bash
./install-ai-dev-os.sh
```
**Description**: Integrates with AI Development Operating System for a complete development environment. System-wide installation with global CLI access.

**Features**:
- System-wide installation in `~/.ai-dev-os`
- Global CLI access via `ai-dev` command
- Cross-project configuration sharing
- Enhanced tmux orchestration
- Integrated development environment

**Configuration Locations**:
```bash
~/.ai-dev-os/          # AI-Dev-OS installation
~/.claude/             # Claude Code settings
~/.tmux-orchestrator/  # TMux configuration
```

**Usage Example**:
```bash
# Install AI-Dev-OS integration
/path/to/MASTER-WORKFLOW/install-ai-dev-os.sh

# Use globally
ai-dev init --auto "Build REST API"
ai-dev status
```

---

#### Standalone Installation
```bash
./install-standalone.sh
```
**Description**: Minimal installation with core functionality only. Completely independent per-project installation.

**What Gets Installed**:
- Core intelligence engine
- Basic project analysis
- Simple workflow execution
- Essential CLI commands
- Local configuration only

**Best For**: Quick prototyping, learning the system, minimal resource usage, simple projects

**Installation Structure**:
```
project/
├── .ai-workflow/           # Local installation
├── .ai-dev/               # Project metadata
└── ai-workflow            # CLI command
```

---

### Component-Specific Installations

#### Claude Code Integration
```bash
# Install Claude Code globally
npm install -g @anthropic-ai/claude-code

# Add to existing workflow
./ai-workflow add claude-code
```
**Description**: Installs Claude Code CLI and integrates with workflow system

**Post-Installation Commands**:
```bash
# Verify installation
claude --version

# Configure with workflow hooks
./ai-workflow components
```

---

#### Agent-OS Planning System
```bash
# Download and install Agent-OS
curl -fsSL https://raw.githubusercontent.com/buildermethods/agent-os/main/setup-claude-code.sh | bash

# Add to existing workflow
./ai-workflow add agent-os
```
**Description**: Installs specification-driven development system with Claude Code integration

**Available Commands After Installation**:
- `/plan-product` - Create product specifications
- `/create-spec {feature}` - Generate feature specifications
- `/analyze-product` - Analyze existing product
- `/execute-tasks` - Execute planned tasks

---

#### Claude Flow 2.0 Multi-Agent
```bash
# Install Claude Flow alpha version
npx claude-flow@alpha init --force

# Add to existing workflow
./ai-workflow add claude-flow
```
**Description**: Installs multi-agent coordination system with swarm and hive-mind capabilities

**Version Options**:
```bash
# Set version via environment variable
export CLAUDE_FLOW_VERSION=alpha    # Default
export CLAUDE_FLOW_VERSION=beta
export CLAUDE_FLOW_VERSION=stable
export CLAUDE_FLOW_VERSION=2.0
```

---

#### TMux Orchestrator
```bash
# Install TMux (system dependency)
sudo apt-get install tmux  # Ubuntu/Debian
brew install tmux          # macOS

# Add to existing workflow
./ai-workflow add tmux
```
**Description**: Enables 24/7 autonomous operation with session persistence

**Configuration**:
```bash
# Start autonomous session
./ai-workflow tmux start

# Attach to session
./ai-workflow tmux attach

# List active sessions
./ai-workflow tmux list
```

---

### Configuration During Installation

#### Claude Code Execution Modes
```bash
# Standard mode (with permissions)
CLAUDE_COMMAND="claude"

# Skip permissions mode
CLAUDE_COMMAND="claude --dangerously-skip-permissions"

# YOLO mode (if alias exists)
CLAUDE_COMMAND="yolo"
```

**Configuration Commands**:
```bash
# Enable YOLO mode post-installation
./ai-workflow yolo on

# Disable YOLO mode
./ai-workflow yolo off

# Check current mode
./ai-workflow yolo status
```

---

#### Component Selection Options
During modular installation, choose from:

| Component | Description | Recommended For |
|-----------|-------------|-----------------|
| **Core Workflow** | Intelligence engine, complexity analysis | ✅ All users |
| **Claude Code Integration** | AI-powered agents and automation | 🎯 AI development |
| **Agent-OS Planning** | Specification-driven development | 📋 Large projects |
| **Claude Flow 2.0** | Multi-agent coordination | 🤖 Complex workflows |
| **TMux Orchestrator** | 24/7 autonomous operation | ⚙️ Production environments |

---

### Post-Installation Setup

#### Verify Installation
```bash
# Check installation status
./ai-workflow status

# Verify all components
./ai-workflow verify

# View installed components
./ai-workflow components

# Test project analysis
./ai-workflow analyze
```

---

#### Initial Configuration
```bash
# Edit project settings
vim .ai-dev/config.json

# Configure Claude Code (if installed)
vim .claude/settings.json

# View configuration
./ai-workflow status
```

---

#### Component Management
```bash
# Add components after installation
./ai-workflow add claude-code
./ai-workflow add agent-os
./ai-workflow add claude-flow
./ai-workflow add tmux

# Remove specific component
./ai-workflow remove claude-code

# Update all components
./ai-workflow update

# Reset to core only
./ai-workflow reset --core-only
```

---

### Environment Variables

#### Core Environment Variables
```bash
# Claude Flow version control
export CLAUDE_FLOW_VERSION="alpha"     # alpha, beta, stable, 2.0

# Execution mode
export AI_WORKFLOW_MODE="interactive"  # auto, interactive, manual

# TMux configuration
export TMUX_SESSION_NAME="ai-workflow"

# Logging level
export LOG_LEVEL="info"                # debug, info, warn, error

# Environment mode
export NODE_ENV="development"          # development, production
```

#### API Configuration
```bash
# Required for Claude Code
export ANTHROPIC_API_KEY="your-api-key"

# Optional integrations
export OPENAI_API_KEY="your-openai-key"
export GITHUB_TOKEN="your-github-token"
```

#### Installation-Specific Variables
```bash
# Custom installation paths
export AI_DEV_HOME="$HOME/.ai-dev-os"
export CLAUDE_HOME="$HOME/.claude"
export TMUX_ORCH_HOME="$HOME/.tmux-orchestrator"

# Skip dependency checks (advanced)
export SKIP_DEPS_CHECK="false"

# Auto-install missing dependencies
export AUTO_INSTALL_DEPS="true"
```

---

### Quick Reference Commands

#### Installation Verification
```bash
# Check prerequisites
node --version    # Should be 18+
npm --version
git --version
tmux -V

# Verify Claude Code
claude --version

# Check environment
echo $ANTHROPIC_API_KEY
```

#### Troubleshooting Installation
```bash
# Fix permissions
chmod +x install-*.sh

# Run with explicit bash
bash install-modular.sh

# Check logs
tail -f .ai-workflow/logs/installation.log

# Debug mode
DEBUG=* ./ai-workflow analyze

# Clean reinstall
rm -rf .ai-workflow .ai-dev .claude .agent-os .claude-flow
./install-modular.sh
```

#### Quick Start After Installation
```bash
# Interactive mode (recommended for first use)
./ai-workflow init

# Automatic mode with task
./ai-workflow init --auto "Create a REST API"

# Force specific approach
./ai-workflow init --swarm    # Simple tasks
./ai-workflow init --hive     # Complex projects
./ai-workflow init --sparc    # Enterprise methodology

# Analyze before deciding
./ai-workflow analyze
```

---

### Related Commands

#### Container Installation
```bash
# Build Docker image
docker build -t master-workflow .

# Run container
docker run -it -v $(pwd):/workspace master-workflow

# Docker Compose
docker-compose up
docker-compose exec master-workflow ./ai-workflow init
```

#### System Integration
```bash
# Add to PATH (AI-Dev-OS only)
echo 'export PATH="$HOME/.ai-dev-os/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Create global alias
alias mw='./ai-workflow'

# Shell completion (if available)
./ai-workflow completion bash > /etc/bash_completion.d/ai-workflow
```

---

### Installation Modes Summary

| Mode | Command | Use Case | Output Location |
|------|---------|----------|-----------------|
| **Interactive** | `./install-modular.sh` | Custom component selection | `./ai-workflow/` |
| **Production** | `./install-production.sh` | All features, production ready | `./ai-workflow/` |
| **AI-Dev-OS** | `./install-ai-dev-os.sh` | System-wide, global access | `~/.ai-dev-os/` |
| **Standalone** | `./install-standalone.sh` | Minimal, project-local | `./ai-workflow/` |
| **Container** | `docker build . && docker run` | Isolated environment | `/workspace/` |

All installations create a local CLI accessible via `./ai-workflow` with context-aware commands based on installed components.

---

## 🚀 Workflow Execution Commands

### Workflow Initialization

#### Interactive Mode (Default)
```bash
./ai-workflow init
./ai-workflow init --interactive
```
**Description**: Launches interactive workflow selection based on project analysis. Prompts for user input and preferences.

#### Automatic Mode
```bash
./ai-workflow init --auto "Build a REST API"
./ai-workflow init --auto
```
**Description**: Automatically selects the best approach based on complexity analysis. Includes task description for better context.

#### Force Specific Approaches
```bash
# Simple Swarm (0-30 complexity)
./ai-workflow init --swarm "Fix authentication bug"

# Hive-Mind (30-70 complexity)
./ai-workflow init --hive "Add user profile feature"
./ai-workflow init --hive

# SPARC Enterprise (70+ complexity)
./ai-workflow init --sparc
./ai-workflow init --sparc "Refactor entire application"
```

---

### Direct Claude Flow Execution

#### Version-Specific Commands
```bash
# Alpha version (default)
npx claude-flow@alpha swarm "Small task"
npx claude-flow@alpha hive-mind spawn "Complex task" --agents 6 --claude

# Beta version
npx claude-flow@beta hive-mind spawn "Feature work" --agents 5 --claude

# Stable version
npx claude-flow@stable hive-mind spawn "Production task" --agents 4 --claude

# Latest version
npx --yes claude-flow@latest hive-mind spawn "Your objective" --claude

# Version 2.0
npx claude-flow@2.0 hive-mind spawn "Enterprise task" --agents 8 --claude
```

#### SPARC Methodology Execution
```bash
# TTY Environment (Interactive terminals)
npx --yes claude-flow@latest hive-mind spawn "MASTER-WORKFLOW" --sparc --agents 10 --claude

# Non-TTY Environment (CI/CD, scripts)
export CF_DB_DIR="$HOME/.claude-flow-db"
mkdir -p "$CF_DB_DIR"
./ai-workflow init --sparc
```

#### Environment Variable Control
```bash
# Set version via environment
export CLAUDE_FLOW_VERSION=alpha    # or beta, stable, 2.0, latest
npx claude-flow@$CLAUDE_FLOW_VERSION hive-mind spawn "Task" --agents 6

# Version-specific execution with override
CLAUDE_FLOW_VERSION=stable npx claude-flow@stable hive-mind spawn "Feature X" --agents 6
```

---

### TMux Session Management

#### Starting Sessions
```bash
# Start workflow in TMux
./ai-workflow tmux start

# Start with specific session name
tmux new -s ai-swarm -d
tmux send-keys -t ai-swarm 'npx claude-flow@alpha hive-mind spawn "your objective" --agents 6 --claude' C-m
```

#### Session Control
```bash
# Attach to running session
./ai-workflow tmux attach
tmux attach -t ai-swarm

# List active sessions
./ai-workflow tmux list
tmux ls

# Check session status
./ai-workflow tmux status

# Stop session
./ai-workflow tmux stop
tmux kill-session -t ai-swarm
```

---

### Background Execution Patterns

#### Start in Background
```bash
# Background with logging
npx --yes claude-flow@latest hive-mind spawn "your objective" --claude &> /tmp/swarm.log & disown

# Monitor background execution
tail -f /tmp/swarm.log

# Background via nohup
nohup ./ai-workflow init --auto "Build API" > workflow.log 2>&1 &
```

#### Process Control
```bash
# Pause current execution
Ctrl+C                      # Graceful pause

# Suspend and background
Ctrl+Z                      # Suspend process
bg                         # Move to background
disown                     # Detach from terminal

# Bring back to foreground
fg                         # Resume in foreground
jobs                       # List background jobs
```

#### Autorun Mode
```bash
# Enable autorun for non-interactive execution
AIWF_AUTORUN=true ./ai-workflow init --auto "your objective"

# Skip prompts with autorun
export AIWF_AUTORUN=true
./ai-workflow init --hive
```

---

### Resume and Recovery Commands

#### Resume Interrupted Workflows
```bash
# Resume Claude Flow session
npx claude-flow@alpha hive-mind resume <session-id>

# Get session status
npx claude-flow@alpha hive-mind status

# List available sessions
npx claude-flow@alpha hive-mind list
```

#### Recovery Operations
```bash
# Analyze incomplete work
./ai-workflow recover analyze

# Generate recovery plan
./ai-workflow recover plan

# Execute recovery
./ai-workflow recover execute

# Full recovery workflow
./ai-workflow recover analyze && ./ai-workflow recover execute
```

---

### TTY vs Non-TTY Distinctions

#### TTY Environment (Interactive Terminal)
```bash
# Direct execution with interactive prompts
npx claude-flow@latest hive-mind spawn "Task" --sparc --agents 10 --claude

# Interactive workflow selection
./ai-workflow init --interactive

# Claude Code with permissions prompts
claude "Your task here"
```

#### Non-TTY Environment (Scripts, CI/CD)
```bash
# Setup required environment
export CF_DB_DIR="$HOME/.claude-flow-db"
mkdir -p "$CF_DB_DIR"

# Skip permissions mode
export CLAUDE_COMMAND="claude --dangerously-skip-permissions"

# Use YOLO mode if configured
./ai-workflow yolo on
./ai-workflow init --auto "Task"

# Force non-interactive
yes | ./ai-workflow init --hive
```

---

### Common Execution Patterns

#### Quick Start Patterns
```bash
# Small task (Simple Swarm)
./ai-workflow init --swarm "Fix typo in README"

# Feature development (Hive-Mind)
./ai-workflow init --hive "Add payment processing"

# Major refactoring (SPARC)
./ai-workflow init --sparc "Migrate to microservices"

# Let system decide
./ai-workflow init --auto "Your objective here"
```

#### Multi-Agent Patterns
```bash
# Specify agent count
npx claude-flow@alpha hive-mind spawn "Build feature" --agents 6 --claude

# Maximum agents for complex tasks
npx claude-flow@latest hive-mind spawn "Enterprise app" --agents 10 --claude

# Minimal agents for simple tasks
npx claude-flow@alpha swarm "Quick fix" --agents 2
```

#### Development Workflow
```bash
# 1. Analyze project first
./ai-workflow analyze

# 2. Review recommendations
./ai-workflow status

# 3. Execute with appropriate approach
./ai-workflow init --auto

# 4. Monitor execution
./ai-workflow status-dashboard 8787
```

#### Production Deployment
```bash
# Start in TMux for persistence
tmux new -s production -d
tmux send-keys -t production './ai-workflow init --sparc' C-m

# Monitor remotely
tmux attach -t production -r  # Read-only attach

# Background with logging
nohup ./ai-workflow init --auto "Deploy to production" > deploy.log 2>&1 &
tail -f deploy.log
```

---

### Monitoring and Status

#### Real-time Monitoring
```bash
# Start status dashboard
./ai-workflow status-dashboard 8787

# Access dashboard
# http://localhost:8787/ui

# Event stream monitoring
AGENT_BUS_PORT=8787 node package-tools/bin/agent-bus-http.js &
curl -N http://127.0.0.1:8787/events/stream

# Get current snapshot
curl -sS http://127.0.0.1:8787/ | jq
```

#### Health Checks
```bash
# System health
./ai-workflow health
curl -sS http://127.0.0.1:13800/health | jq

# Component verification
./ai-workflow verify
./ai-workflow components

# Environment scan
curl -sS http://127.0.0.1:13800/api/env/scan | jq
```

---

### Advanced Execution Examples

#### Complex Multi-Step Workflow
```bash
# 1. Clean setup
rm -rf .ai-workflow .claude-flow
./install-modular.sh

# 2. Configure for production
export CLAUDE_FLOW_VERSION=stable
export AIWF_AUTORUN=true
./ai-workflow yolo on

# 3. Execute with monitoring
tmux new -s workflow -d
tmux send-keys -t workflow './ai-workflow init --sparc "Build SaaS platform"' C-m
./ai-workflow status-dashboard 8787
```

#### CI/CD Integration
```bash
#!/bin/bash
# CI/CD script example

# Setup non-TTY environment
export CF_DB_DIR="$HOME/.claude-flow-db"
export CLAUDE_COMMAND="claude --dangerously-skip-permissions"
export AIWF_AUTORUN=true

# Execute workflow
./ai-workflow init --auto "Run tests and deploy" 2>&1 | tee workflow.log

# Check completion
if ./ai-workflow verify; then
  echo "Workflow completed successfully"
  exit 0
else
  echo "Workflow failed"
  exit 1
fi
```

#### Development with Hot Reload
```bash
# Terminal 1: Run workflow
./ai-workflow init --hive "Develop feature"

# Terminal 2: Monitor events
./ai-workflow status-dashboard 8787

# Terminal 3: Watch logs
tail -f .claude-flow/memory/logs/*.log

# Terminal 4: Test changes
./ai-workflow verify
./ai-workflow analyze
```

---

## 🔍 Monitoring & Debugging Commands

### Status and Health Monitoring

#### System Status Commands
```bash
# Basic system status
./ai-workflow status

# Detailed health check
./ai-workflow health

# Component verification
./ai-workflow verify

# Environment scan
./ai-workflow env-scan
```

**Expected Output Example**:
```json
{
  "status": "healthy",
  "components": {
    "intelligence-engine": "active",
    "claude-code": "connected",
    "agent-os": "ready",
    "tmux": "running"
  },
  "complexity": 45,
  "active_sessions": 2
}
```

#### Service Health Endpoints
```bash
# Main health endpoint
curl -sS http://127.0.0.1:13800/health | jq

# Detailed system status
curl -sS http://127.0.0.1:13800/api/status | jq

# Environment information
curl -sS http://127.0.0.1:13800/api/env/scan | jq
```

---

### Event Bus Monitoring

#### Real-time Event Tail
```bash
# Start event bus tail
./ai-workflow events tail

# Tail with filters
./ai-workflow events tail --type="agent"
./ai-workflow events tail --level="error"
./ai-workflow events tail --component="intelligence-engine"
```

**Example Output**:
```
[2025-01-18 10:30:45] AGENT  intelligence-engine  Complexity analysis complete: 45
[2025-01-18 10:30:46] QUEUE  workflow-manager     Task queued: create-api-endpoint
[2025-01-18 10:30:47] EXEC   claude-code          Executing: implement user auth
```

#### Event Bus TUI (Terminal UI)
```bash
# Launch interactive event monitor
./ai-workflow events tui

# TUI with specific focus
./ai-workflow events tui --focus=agents
./ai-workflow events tui --focus=errors
```

**TUI Controls**:
- `q` - Quit
- `↑/↓` - Scroll events
- `f` - Filter events
- `c` - Clear screen
- `p` - Pause/Resume

#### HTTP Event Streaming
```bash
# Start HTTP event server
AGENT_BUS_PORT=8787 node package-tools/bin/agent-bus-http.js &

# Stream events via curl
curl -N http://127.0.0.1:8787/events/stream

# Get current event snapshot
curl -sS http://127.0.0.1:8787/ | jq

# Filter events by type
curl -N "http://127.0.0.1:8787/events/stream?type=agent"

# Get event history
curl -sS "http://127.0.0.1:8787/events/history?limit=100" | jq
```

#### WebSocket Event Monitoring
```bash
# Connect to WebSocket events (using wscat)
wscat -c ws://127.0.0.1:8787/events/ws

# JavaScript WebSocket example
node -e "
const WebSocket = require('ws');
const ws = new WebSocket('ws://127.0.0.1:8787/events/ws');
ws.on('message', data => console.log(JSON.parse(data)));
"
```

---

### Engine API Monitoring

#### Intelligence Engine Status
```bash
# Engine health check
curl -sS http://127.0.0.1:13800/api/engine/status | jq

# Active agents list
curl -sS http://127.0.0.1:13800/api/agents | jq

# Current workflow state
curl -sS http://127.0.0.1:13800/api/workflow/current | jq

# Engine configuration
curl -sS http://127.0.0.1:13800/api/engine/config | jq
```

**Example Engine Status Response**:
```json
{
  "status": "active",
  "uptime": "2h 15m 30s",
  "agents": {
    "total": 6,
    "active": 4,
    "idle": 2
  },
  "workflow": {
    "phase": "execution",
    "progress": 65,
    "current_task": "implement-auth-middleware"
  },
  "resources": {
    "cpu": 45,
    "memory": 78,
    "disk": 23
  }
}
```

#### Workflow Execution Monitoring
```bash
# Current workflow details
curl -sS http://127.0.0.1:13800/api/workflow/details | jq

# Task queue status
curl -sS http://127.0.0.1:13800/api/workflow/queue | jq

# Execution timeline
curl -sS http://127.0.0.1:13800/api/workflow/timeline | jq

# Performance metrics
curl -sS http://127.0.0.1:13800/api/workflow/metrics | jq
```

#### Agent Performance Monitoring
```bash
# Individual agent status
curl -sS http://127.0.0.1:13800/api/agents/{agent-id}/status | jq

# Agent performance metrics
curl -sS http://127.0.0.1:13800/api/agents/{agent-id}/metrics | jq

# Agent task history
curl -sS http://127.0.0.1:13800/api/agents/{agent-id}/history | jq

# All agents summary
curl -sS http://127.0.0.1:13800/api/agents/summary | jq
```

---

### Integration Status Checking

#### Component Integration Status
```bash
# Check all integrations
./ai-workflow integrations status

# Specific integration check
./ai-workflow integrations check claude-code
./ai-workflow integrations check agent-os
./ai-workflow integrations check claude-flow
./ai-workflow integrations check tmux

# Integration health with details
./ai-workflow integrations health --verbose
```

**Integration Status Output**:
```bash
✅ Claude Code Integration
   Status: Connected
   Version: 2.1.4
   Mode: YOLO enabled
   API: Authenticated

✅ Agent-OS Integration  
   Status: Active
   Specifications: 12 loaded
   Tasks: 8 pending, 4 complete

❌ Claude Flow Integration
   Status: Disconnected
   Error: Version mismatch
   Expected: alpha, Found: beta
```

#### Dependency Verification
```bash
# Check all dependencies
./ai-workflow deps check

# Install missing dependencies
./ai-workflow deps install

# Verify specific tools
node --version    # Should be 18+
npm --version
git --version
tmux -V          # For TMux integration
claude --version # For Claude Code
```

#### Configuration Validation
```bash
# Validate all configurations
./ai-workflow config validate

# Check environment variables
./ai-workflow config env

# Verify API keys
./ai-workflow config keys-check

# Test integration connections
./ai-workflow config test-connections
```

---

### Logs and Debugging

#### Log File Locations
```bash
# Main workflow logs
tail -f .ai-workflow/logs/workflow.log

# Intelligence engine logs
tail -f .ai-workflow/logs/intelligence-engine.log

# Component-specific logs
tail -f .ai-workflow/logs/claude-code.log
tail -f .ai-workflow/logs/agent-os.log
tail -f .ai-workflow/logs/claude-flow.log

# Error logs only
tail -f .ai-workflow/logs/errors.log

# Debug logs (if enabled)
tail -f .ai-workflow/logs/debug.log
```

#### Log Level Control
```bash
# Set debug logging
export LOG_LEVEL=debug
./ai-workflow init --auto "task"

# Specific component debugging
export DEBUG=intelligence-engine:*
./ai-workflow analyze

# Verbose workflow execution
export VERBOSE=true
./ai-workflow init --hive "task" --verbose

# Silent mode (errors only)
export LOG_LEVEL=error
./ai-workflow init --auto "task" --silent
```

#### Advanced Debugging Commands
```bash
# Debug mode execution
DEBUG=* ./ai-workflow init --auto "debug task"

# Trace mode for deep debugging
TRACE=true ./ai-workflow analyze

# Memory usage monitoring
./ai-workflow debug memory

# Performance profiling
./ai-workflow debug profile --duration=30s

# Network diagnostics
./ai-workflow debug network

# Disk usage analysis
./ai-workflow debug disk
```

---

### Status Dashboard

#### Web Dashboard
```bash
# Start status dashboard
./ai-workflow status-dashboard 8787

# Access dashboard URLs
# Main Dashboard: http://localhost:8787/ui
# API Docs: http://localhost:8787/api/docs
# Health: http://localhost:8787/health
# Metrics: http://localhost:8787/metrics
```

**Dashboard Features**:
- Real-time agent status
- Task execution progress
- System resource usage
- Event timeline
- Error tracking
- Performance charts

#### API Endpoints Summary
```bash
# Quick status check
curl -sS http://127.0.0.1:8787/ | jq

# Detailed metrics
curl -sS http://127.0.0.1:8787/metrics | jq

# Active agents
curl -sS http://127.0.0.1:8787/agents | jq

# Current tasks
curl -sS http://127.0.0.1:8787/tasks | jq

# System resources
curl -sS http://127.0.0.1:8787/resources | jq
```

---

### Debug Environment Variables

#### Core Debug Variables
```bash
# General debugging
export DEBUG=*                    # Debug everything
export DEBUG=intelligence-engine:* # Debug specific component
export VERBOSE=true               # Verbose output
export TRACE=true                 # Trace execution

# Logging control
export LOG_LEVEL=debug            # debug, info, warn, error
export LOG_FORMAT=json            # json, text, structured
export LOG_TIMESTAMP=true         # Include timestamps

# Component debugging
export DEBUG_CLAUDE_CODE=true     # Claude Code debugging
export DEBUG_AGENT_OS=true        # Agent-OS debugging
export DEBUG_WORKFLOW=true        # Workflow debugging
export DEBUG_EVENTS=true          # Event system debugging
```

#### Performance Debugging
```bash
# Memory debugging
export NODE_OPTIONS="--max-old-space-size=4096"
export DEBUG_MEMORY=true

# CPU profiling
export NODE_OPTIONS="--prof"
export PROFILE=true

# Network debugging
export DEBUG_NETWORK=true
export HTTP_DEBUG=true

# Timing analysis
export TIME_EXECUTION=true
export BENCHMARK=true
```

#### Integration Debugging
```bash
# Claude Flow debugging
export CF_DEBUG=true
export CF_VERBOSE=true

# TMux debugging
export TMUX_DEBUG=true

# API debugging
export API_DEBUG=true
export HTTP_LOGS=true

# Database debugging (if applicable)
export DB_DEBUG=true
export SQL_LOGS=true
```

---

### Quick Diagnostic Workflows

#### Health Check Workflow
```bash
#!/bin/bash
# Complete system health check

echo "🔍 Running Master Workflow Health Check..."

# 1. Basic status
echo "📊 System Status:"
./ai-workflow status

# 2. Component verification
echo "🔧 Component Check:"
./ai-workflow verify

# 3. Integration status
echo "🔗 Integration Status:"
./ai-workflow integrations status

# 4. Dependency check
echo "📦 Dependencies:"
./ai-workflow deps check

# 5. Configuration validation
echo "⚙️  Configuration:"
./ai-workflow config validate

# 6. Health endpoints
echo "🌐 API Health:"
curl -sS http://127.0.0.1:13800/health | jq -r '.status'

echo "✅ Health check complete!"
```

#### Performance Analysis Workflow
```bash
#!/bin/bash
# Performance analysis and bottleneck detection

echo "🚀 Performance Analysis Starting..."

# 1. Resource monitoring
echo "📈 Resource Usage:"
curl -sS http://127.0.0.1:8787/resources | jq

# 2. Agent performance
echo "🤖 Agent Performance:"
curl -sS http://127.0.0.1:8787/agents | jq '.[] | {id, status, cpu, memory, tasks}'

# 3. Task execution metrics
echo "📋 Task Metrics:"
curl -sS http://127.0.0.1:8787/tasks | jq '.[] | {id, status, duration, performance}'

# 4. Memory analysis
echo "🧠 Memory Analysis:"
./ai-workflow debug memory

# 5. Network diagnostics
echo "🌐 Network Status:"
./ai-workflow debug network

echo "📊 Performance analysis complete!"
```

#### Error Investigation Workflow
```bash
#!/bin/bash
# Error investigation and troubleshooting

echo "🔍 Error Investigation Starting..."

# 1. Check error logs
echo "📝 Recent Errors:"
tail -20 .ai-workflow/logs/errors.log

# 2. System health
echo "🏥 System Health:"
curl -sS http://127.0.0.1:13800/health | jq '.status, .errors'

# 3. Failed tasks
echo "❌ Failed Tasks:"
curl -sS http://127.0.0.1:8787/tasks | jq '.[] | select(.status == "failed")'

# 4. Agent issues
echo "🤖 Agent Issues:"
curl -sS http://127.0.0.1:8787/agents | jq '.[] | select(.status != "healthy")'

# 5. Integration problems
echo "🔗 Integration Issues:"
./ai-workflow integrations status | grep -E "❌|ERROR|FAILED"

# 6. Configuration errors
echo "⚙️  Configuration Issues:"
./ai-workflow config validate --errors-only

echo "🔎 Error investigation complete!"
```

#### Recovery Workflow
```bash
#!/bin/bash
# System recovery and restoration

echo "🔄 Recovery Workflow Starting..."

# 1. Stop current operations
echo "⏹️  Stopping active workflows..."
./ai-workflow stop

# 2. Health assessment
echo "🏥 Assessing system health..."
./ai-workflow health --detailed

# 3. Clear temporary data
echo "🧹 Cleaning temporary data..."
rm -rf .ai-workflow/temp/*
rm -rf .claude-flow/temp/*

# 4. Restart services
echo "🚀 Restarting services..."
./ai-workflow restart

# 5. Verify recovery
echo "✅ Verifying recovery..."
sleep 5
./ai-workflow verify

# 6. Resume if applicable
echo "▶️  Resuming operations..."
./ai-workflow resume

echo "🎉 Recovery workflow complete!"
```

---

### Monitoring Best Practices

#### Continuous Monitoring Setup
```bash
# Terminal 1: Main workflow
./ai-workflow init --hive "your task"

# Terminal 2: Event monitoring
./ai-workflow events tui

# Terminal 3: Resource monitoring
watch -n 2 'curl -sS http://127.0.0.1:8787/resources | jq'

# Terminal 4: Log monitoring
tail -f .ai-workflow/logs/workflow.log
```

#### Automated Monitoring Script
```bash
#!/bin/bash
# monitoring-daemon.sh - Continuous monitoring with alerts

while true; do
    # Check system health
    health=$(curl -sS http://127.0.0.1:13800/health | jq -r '.status')
    
    if [ "$health" != "healthy" ]; then
        echo "🚨 ALERT: System unhealthy - $health" | logger
        # Send notification (email, Slack, etc.)
    fi
    
    # Check resource usage
    cpu=$(curl -sS http://127.0.0.1:8787/resources | jq -r '.cpu')
    memory=$(curl -sS http://127.0.0.1:8787/resources | jq -r '.memory')
    
    if (( $(echo "$cpu > 90" | bc -l) )); then
        echo "🚨 ALERT: High CPU usage - ${cpu}%" | logger
    fi
    
    if (( $(echo "$memory > 85" | bc -l) )); then
        echo "🚨 ALERT: High memory usage - ${memory}%" | logger
    fi
    
    sleep 30
done
```

This comprehensive monitoring and debugging section provides all the tools needed to effectively monitor, debug, and troubleshoot the Master Workflow system, from basic status checks to advanced performance analysis and automated recovery workflows.

---

## 🧪 Testing Commands

### Main Test Suites

#### NPM Test Commands
```bash
# Run all tests (unit + integration)
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration
```
**Description**: Core test execution using Jest framework for automated testing of workflow components.

**Expected Output**:
```
✓ Unit tests: 24 passed, 0 failed
✓ Integration tests: 12 passed, 0 failed
✓ Test coverage: 85% lines, 78% branches
```

---

### Individual Test Runners

#### Unit Testing
```bash
# Run specific unit test file
jest workflow-runner.test.js

# Run tests with coverage
jest --coverage

# Run tests in watch mode
jest --watch

# Run tests matching pattern
jest --testNamePattern="complexity"
```
**Description**: Individual test execution with Jest for targeted testing and development feedback.

**Coverage Reports**: Generated in `coverage/` directory with HTML reports accessible via browser.

#### Integration Testing
```bash
# Run integration tests with verbose output
jest --testMatch='**/*.integration.test.js' --verbose

# Run integration tests for specific component
jest --testMatch='**/intelligence-engine.integration.test.js'

# Run integration tests with custom timeout
jest --testMatch='**/*.integration.test.js' --testTimeout=30000
```
**Description**: Full system integration testing to verify component interactions and end-to-end workflows.

---

### Analysis Engine Tests

#### Intelligence Engine Testing
```bash
# Test intelligence engine components
node .ai-workflow/intelligence-engine/integration-checker.js

# Test with JSON output for CI
node .ai-workflow/intelligence-engine/integration-checker.js --json

# Health check with detailed report
npm run health
```
**Description**: Comprehensive testing of the intelligence engine including complexity analysis, integration checks, and health monitoring.

**Health Check Output**:
```json
{
  "health": {
    "overall": 92,
    "core": 95,
    "integrations": 89,
    "connectivity": 92,
    "status": "Excellent"
  },
  "recommendations": []
}
```

#### Complexity Analysis Testing
```bash
# Test complexity analyzer
node .ai-workflow/intelligence-engine/complexity-analyzer.js --test

# Analyze current project complexity
./ai-workflow analyze

# Verify complexity scoring accuracy
./ai-workflow analyze --verbose --test-mode
```
**Description**: Tests the project complexity analysis engine to ensure accurate workflow approach selection.

**Expected Complexity Scores**:
- 0-30: Simple Swarm recommended
- 30-70: Hive-Mind coordination recommended  
- 70+: SPARC Enterprise methodology recommended

#### Document Customizer Testing
```bash
# Test document customization engine
node .ai-workflow/intelligence-engine/document-customizer.js --test

# Test with sample document
./ai-workflow customize-docs --test

# Validate document templates
./ai-workflow verify --docs
```
**Description**: Tests document generation and customization capabilities for project documentation.

---

### Component Testing

#### Core Workflow Components
```bash
# Test workflow runner
./ai-workflow verify

# Test workflow initialization
./ai-workflow init --test-mode

# Test specific workflow approaches
./ai-workflow init --swarm --dry-run
./ai-workflow init --hive --dry-run
./ai-workflow init --sparc --dry-run
```
**Description**: Tests core workflow execution engine and approach selection logic.

#### Integration Component Testing
```bash
# Test Claude Code integration
./ai-workflow integrations check claude-code

# Test Agent-OS integration
./ai-workflow integrations check agent-os

# Test Claude Flow integration
./ai-workflow integrations check claude-flow

# Test TMux orchestrator
./ai-workflow integrations check tmux

# Test all integrations
./ai-workflow integrations status
```
**Description**: Validates external tool integrations and API connectivity.

**Integration Test Results**:
```
✅ Claude Code Integration: Connected (v2.1.4)
✅ Agent-OS Integration: Active (12 specs loaded)
❌ Claude Flow Integration: Version mismatch (expected: alpha, found: beta)
✅ TMux Orchestrator: Available
```

#### API Endpoint Testing
```bash
# Test engine API endpoints
curl -sS http://127.0.0.1:13800/health | jq
curl -sS http://127.0.0.1:13800/api/status | jq

# Test event bus endpoints
curl -sS http://127.0.0.1:8787/health | jq
curl -N http://127.0.0.1:8787/events/stream

# Test dashboard API
curl -sS http://127.0.0.1:8787/api/agents | jq
curl -sS http://127.0.0.1:8787/api/tasks | jq
```
**Description**: Tests HTTP API endpoints for health, status, and real-time monitoring functionality.

---

### Performance Testing

#### Performance Test Suite
```bash
# Run performance tests from performance-docs
cd performance-docs

# Quick performance test (30 seconds)
npm run test:quick

# Full performance test suite (5 minutes)
npm run test:full

# Specific performance tests
npm run test:throughput
npm run test:latency
npm run test:stress
npm run test:endurance
npm run test:scalability
```
**Description**: Comprehensive performance testing suite measuring throughput, latency, memory usage, and scalability.

**Performance Targets**:
- Throughput: 500,000 operations/second
- Latency P95: <5.0ms
- Memory per agent: <25MB
- Success rate: >99.9%
- Availability: >99.97%

#### Benchmark Testing
```bash
# Run standard benchmarks
npm run benchmark

# Quick benchmark (2 minutes)
npm run benchmark:quick

# Full benchmark suite
npm run benchmark:full

# Custom benchmark duration
npm run test:performance -- --duration 120
```
**Description**: Standardized performance benchmarks for comparing system performance across versions and configurations.

#### Load Testing
```bash
# Test system under load
npm run test:stress

# Endurance testing (extended duration)
npm run test:endurance

# Scalability testing
npm run test:scalability

# Custom load testing
npm run test:performance -- --tests stress --duration 300
```
**Description**: Tests system behavior under high load, extended operation, and scaling scenarios.

---

### Performance Monitoring

#### Real-time Performance Monitoring
```bash
# Start performance monitoring dashboard
npm run monitor:start

# Open performance dashboard
npm run monitor:dashboard

# Generate performance report
npm run report:generate

# View latest performance report
npm run report:latest
```
**Description**: Real-time performance monitoring with web dashboard for continuous performance tracking.

**Dashboard Features**:
- Real-time throughput metrics
- Latency distribution graphs
- Memory usage trending
- Agent performance tracking
- Error rate monitoring

#### Performance Optimization
```bash
# Run optimization tools
npm run optimize

# Dry-run optimization (preview changes)
npm run optimize:dry-run

# Optimize specific components
npm run optimize:agents
npm run optimize:memory
npm run optimize:cache
```
**Description**: Automated performance optimization tools for system tuning and resource efficiency.

---

### CI/CD Integration

#### GitHub Actions Test Pipeline
```yaml
# From .github/workflows/ci.yml
name: Continuous Integration

on:
  push:
    branches: [ main, 'claude-phase-*-complete' ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
```

#### CI Test Commands
```bash
# Run CI test suite locally
npm run ci

# Validate project structure
npm run validate

# Run security scan
npm run security-scan

# Cross-platform compatibility test
npm run test:compatibility
```
**Description**: CI/CD pipeline testing commands for continuous integration and deployment validation.

#### Automated Test Execution
```bash
# Pre-commit testing
npm run test:pre-commit

# Pre-push validation
npm run test:pre-push

# Release testing
npm run test:release

# Production readiness check
npm run test:production
```
**Description**: Automated testing hooks for development workflow integration and quality gates.

---

### Test Coverage and Reporting

#### Coverage Analysis
```bash
# Generate test coverage report
jest --coverage

# Coverage with threshold enforcement
jest --coverage --coverageThreshold='{"global":{"lines":80,"branches":75}}'

# Export coverage for CI
jest --coverage --coverageReporters=lcov

# View coverage report in browser
open coverage/lcov-report/index.html
```
**Description**: Test coverage analysis and reporting for code quality assurance.

**Coverage Targets**:
- Lines: >80%
- Branches: >75%
- Functions: >85%
- Statements: >80%

#### Test Reporting
```bash
# Generate JUnit XML report
jest --reporters=default --reporters=jest-junit

# Generate JSON test report
jest --json --outputFile=test-results.json

# Generate HTML test report
jest --reporters=default --reporters=jest-html-reporter

# Custom test reporting
jest --reporters=./custom-reporter.js
```
**Description**: Test result reporting in various formats for CI/CD integration and team visibility.

#### Quality Metrics
```bash
# Run code quality analysis
npm run lint

# Type checking (if TypeScript)
npm run type-check

# Security vulnerability scan
npm audit

# Dependency analysis
npm run deps:check
```
**Description**: Code quality and security analysis tools integrated with the testing pipeline.

---

### Testing Best Practices

#### Test Organization
```
project/
├── tests/
│   ├── unit/                 # Unit tests
│   ├── integration/          # Integration tests
│   ├── performance/          # Performance tests
│   ├── fixtures/             # Test data
│   └── helpers/              # Test utilities
├── jest.config.js            # Jest configuration
└── coverage/                 # Coverage reports
```

#### Test Execution Patterns
```bash
# Development workflow
npm run test:watch           # Continuous testing during development
npm run test:changed         # Test only changed files
npm run test:related         # Test related to changed files

# Pre-deployment workflow
npm run test:unit           # Fast unit tests first
npm run test:integration    # Integration tests if units pass
npm run test:performance    # Performance validation
npm run test:e2e           # End-to-end validation
```

#### Test Environment Configuration
```bash
# Set test environment variables
export NODE_ENV=test
export TEST_TIMEOUT=30000
export COVERAGE_THRESHOLD=80

# Test database setup (if applicable)
export TEST_DB_URL="sqlite::memory:"

# Mock external services
export MOCK_EXTERNAL_APIS=true
export CLAUDE_MOCK_MODE=true
```

---

### Troubleshooting Tests

#### Common Test Issues
```bash
# Fix test timeouts
jest --testTimeout=60000

# Debug failing tests
jest --verbose --no-cache

# Run tests in debug mode
node --inspect-brk node_modules/.bin/jest

# Clear Jest cache
jest --clearCache
```

#### Test Data Management
```bash
# Reset test database
npm run test:db:reset

# Seed test data
npm run test:db:seed

# Clean test artifacts
npm run test:clean

# Validate test fixtures
npm run test:fixtures:validate
```

---

### Expected Test Results

#### Successful Test Run Output
```
Test Suites: 8 passed, 8 total
Tests:       42 passed, 42 total
Snapshots:   0 total
Time:        15.234 s
Coverage:    85.67% lines, 78.23% branches
```

#### Performance Test Results
```
Performance Test Results:
✓ Throughput: 487,234 ops/sec (target: 500,000)
✓ Latency P95: 4.2ms (target: <5.0ms)
✓ Memory usage: 23.4MB/agent (target: <25MB)
✓ Success rate: 99.94% (target: >99.9%)
✓ Availability: 99.98% (target: >99.97%)
```

#### Integration Health Check
```
Integration Health Report:
📊 Overall Health: 92% (Excellent)
  Core Systems: 95%
  Integrations: 89%
  Connectivity: 92%

💡 Recommendations:
  • Update Claude Flow to alpha version
  • Configure MCP server registry
```

This comprehensive testing section provides complete coverage of all testing capabilities in the Master Workflow system, from unit tests to performance benchmarks and CI/CD integration.

---

## 🗑️ Uninstall & Cleanup Commands

### Main Uninstaller

#### Safe Interactive Uninstaller
```bash
# Preview what would be removed (default - safe)
./ai-workflow uninstall

# Actually perform uninstallation
./ai-workflow uninstall --no-dry-run

# Create backup before removal
./ai-workflow uninstall --no-dry-run --backup
```
**Description**: Safe, interactive uninstaller that preserves user-generated content while removing only system-installed components.

**Safety Features**:
- Dry-run by default (preview mode)
- Preserves user-generated content
- Git-tracked file protection
- Backup creation option
- Typed acknowledgment required for actual removal

---

### Uninstaller Flags & Options

#### Core Uninstaller Flags
```bash
# Execution control
--dry-run              # Preview what would be removed (default)
--no-dry-run           # Actually perform the uninstallation
--yes, -y              # Skip all prompts (non-interactive mode)
--interactive          # Enable interactive mode with enhanced UI
--non-interactive      # Run without prompts

# Content preservation
--keep-generated       # Keep generated documents (default)
--no-keep-generated    # Remove generated documents too
--purge-caches         # Remove cache and log files (default)
--no-purge-caches      # Keep cache and log files

# Safety options
--git-protect          # Protect git-tracked files (default)
--ignore-git           # Allow removal of git-tracked files
--backup [path]        # Create backup before removal

# Output options
--json                 # Output plan in JSON format
--debug                # Enable debug output
--force-enable         # Bypass feature flag check
--help, -h             # Show help message
```

#### Uninstaller Usage Examples
```bash
# Safe preview (default behavior)
./ai-workflow uninstall

# Complete uninstall with backup
./ai-workflow uninstall --no-dry-run --backup /tmp/ai-workflow-backup

# Non-interactive uninstall for automation
./ai-workflow uninstall --no-dry-run --yes

# Conservative uninstall (keep everything possible)
./ai-workflow uninstall --no-dry-run --keep-generated --no-purge-caches

# Aggressive cleanup (remove everything)
./ai-workflow uninstall --no-dry-run --no-keep-generated --ignore-git
```

---

### Component Removal Commands

#### Individual Component Removal
```bash
# Remove specific components
./ai-workflow remove claude-code
./ai-workflow remove agent-os
./ai-workflow remove claude-flow
./ai-workflow remove tmux

# Remove multiple components
./ai-workflow remove claude-code agent-os

# Reset to core only (removes all integrations)
./ai-workflow reset --core-only
```
**Description**: Selective component removal while preserving core workflow functionality.

#### Integration Cleanup
```bash
# Clean Claude Code integration
rm -rf .claude/
rm ~/.claude/settings.json

# Clean Agent-OS integration
rm -rf .agent-os/
rm -rf ~/.agent-os/

# Clean Claude Flow integration
rm -rf .claude-flow/
rm -rf ~/.claude-flow-db/

# Clean TMux configuration
rm -rf ~/.tmux-orchestrator/
```
**Description**: Manual cleanup commands for specific integrations.

---

### Manual Cleanup Procedures

#### Complete Manual Removal
```bash
# Remove all workflow directories
rm -rf .ai-workflow/
rm -rf .ai-dev/
rm -rf .claude/
rm -rf .agent-os/
rm -rf .claude-flow/

# Remove CLI symlink
rm -f ai-workflow

# Remove global installations (if using AI-Dev-OS)
rm -rf ~/.ai-dev-os/
rm -rf ~/.claude/
rm -rf ~/.tmux-orchestrator/

# Remove logs and caches
rm -rf ~/.ai-workflow-logs/
rm -rf /tmp/ai-workflow-*
```
**Description**: Complete manual removal for emergency cleanup or when automated uninstaller fails.

#### Selective Manual Cleanup
```bash
# Remove only temporary files
rm -rf .ai-workflow/temp/
rm -rf .ai-workflow/logs/
rm -rf .claude-flow/temp/

# Remove only caches
rm -rf .ai-workflow/cache/
rm -rf ~/.claude-flow-db/cache/

# Remove only session data
rm -rf .ai-workflow/sessions/
rm -rf .tmux-orchestrator/sessions/
```
**Description**: Targeted cleanup for specific issues while preserving configuration.

---

### What Gets Preserved vs Removed

#### Always Preserved (Safe Items)
```
✅ User-created files and directories
✅ Git-tracked content (unless --ignore-git used)
✅ Custom configuration files
✅ Project source code
✅ User-generated documentation
✅ Custom scripts and tools
✅ Database files with user data
✅ Environment configuration files
```

#### Removed by Default (System Items)
```
❌ .ai-workflow/ directory (system files)
❌ .ai-dev/ metadata
❌ .claude/ settings (integration files)
❌ .agent-os/ specifications
❌ .claude-flow/ session data
❌ ai-workflow CLI symlink
❌ Temporary files and caches
❌ System-generated logs
❌ Installation artifacts
```

#### Conditionally Removed (Flag-Dependent)
```
🔄 Generated documentation (--keep-generated controls)
🔄 Cache and log files (--purge-caches controls)
🔄 Git-tracked system files (--git-protect controls)
🔄 Global installations (--scope controls)
```

---

### Recovery After Uninstall

#### Reinstallation After Cleanup
```bash
# Standard reinstallation
./install-modular.sh

# Restore from backup
tar -xzf ai-workflow-backup.tar.gz
./ai-workflow restore --backup-path ./backup/

# Reconfigure integrations
./ai-workflow add claude-code
./ai-workflow add agent-os
./ai-workflow verify
```

#### Configuration Recovery
```bash
# Restore configuration from backup
cp backup/.ai-dev/config.json .ai-dev/
cp backup/.claude/settings.json .claude/

# Regenerate missing configuration
./ai-workflow init --reconfigure
./ai-workflow verify --fix-config
```

---

## 📜 NPM Scripts & Package Commands

### Main NPM Scripts

#### Core Execution Scripts
```bash
# Start main workflow runner
npm start

# Start intelligence engine
npm run engine

# Setup development environment
npm run setup
```

#### Testing Scripts
```bash
# Run all tests (unit + integration)
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration
```

#### Health & Monitoring Scripts
```bash
# Run integration checker
npm run check

# Generate health report (JSON format)
npm run health
```

#### Claude Flow Version Scripts
```bash
# Run specific Claude Flow versions
npm run claude-flow:alpha
npm run claude-flow:beta
npm run claude-flow:stable
npm run claude-flow:latest
```

### Extended NPM Commands

#### Development Workflow
```bash
# Install dependencies
npm install

# Update dependencies
npm update

# Audit security vulnerabilities
npm audit

# Fix security issues
npm audit fix

# Clean install (removes node_modules)
npm ci
```

#### Package Management
```bash
# List installed packages
npm list

# Check outdated packages
npm outdated

# Install specific package
npm install <package-name>

# Install development dependency
npm install --save-dev <package-name>

# Uninstall package
npm uninstall <package-name>
```

#### Script Execution Patterns
```bash
# Run scripts with custom arguments
npm run test -- --verbose
npm run health -- --detailed

# Run multiple scripts in sequence
npm run setup && npm run check && npm start

# Run scripts in parallel (requires npm-run-all)
npm-run-all --parallel start engine
```

---

## 🌍 Environment Variables Reference

### Core System Variables

#### Claude Flow Configuration
```bash
# Version control
export CLAUDE_FLOW_VERSION="alpha"        # alpha, beta, stable, 2.0, latest

# Database configuration
export CF_DB_DIR="$HOME/.claude-flow-db"  # Claude Flow database location

# Training and experimental features
export ENABLE_CF_TRAINING="false"         # Enable Claude Flow training
export CF_ENABLE_EXPERIMENTAL="false"     # Enable experimental features
export CF_TRAINING_EPOCHS="3"             # Number of training epochs

# Memory operations
export ENABLE_CF_MEMORY_OPS="false"       # Enable memory operations
export CF_MEMORY_ACTION="summarize"       # Memory action: summarize, compress, archive
```

#### Workflow Execution Variables
```bash
# Execution modes
export AI_WORKFLOW_MODE="interactive"     # auto, interactive, manual
export AIWF_AUTORUN="false"              # Auto-run workflows after selection

# Permission handling
export YOLO_MODE="false"                  # Enable YOLO mode (skip permissions)
export CLAUDE_COMMAND="claude"            # Claude Code command to use
# Alternative: export CLAUDE_COMMAND="claude --dangerously-skip-permissions"
```

#### Logging and Debugging
```bash
# Logging configuration
export LOG_LEVEL="info"                   # debug, info, warn, error
export LOG_FORMAT="text"                  # text, json, structured
export LOG_TIMESTAMP="true"               # Include timestamps in logs

# Debug settings
export DEBUG=""                           # Debug namespaces (e.g., "intelligence-engine:*")
export VERBOSE="false"                    # Verbose output
export TRACE="false"                      # Trace execution
```

#### System Configuration
```bash
# Environment
export NODE_ENV="development"             # development, production, test

# Port configuration
export AGENT_BUS_PORT="8787"             # Event bus port
export ENGINE_PORT="13800"               # Intelligence engine port

# Session management
export TMUX_SESSION_NAME="ai-workflow"   # Default TMux session name
```

---

### Integration Variables

#### Claude Code Integration
```bash
# API configuration
export ANTHROPIC_API_KEY="your-key-here" # Required for Claude Code

# Execution modes
export CLAUDE_EXECUTION_MODE="standard"   # standard, yolo, safe
export SKIP_PERMISSION_CHECKS="false"    # Skip all permission checks
```

#### TMux Orchestrator
```bash
# TMux configuration
export TMUX_ORCHESTRATOR_ENABLED="true"  # Enable TMux orchestration
export AUTO_START_TMUX="false"           # Auto-start TMux sessions
export TMUX_SESSION_PERSISTENCE="true"   # Enable session persistence
```

#### Agent-OS Integration
```bash
# Agent-OS configuration
export AGENT_OS_ENABLED="true"           # Enable Agent-OS integration
export AGENT_OS_SPEC_DIR=".agent-os"     # Specification directory
export AGENT_OS_AUTO_EXECUTE="false"     # Auto-execute tasks
```

#### Performance Variables
```bash
# Memory management
export NODE_OPTIONS="--max-old-space-size=4096"  # Node.js memory limit
export DEBUG_MEMORY="false"                      # Memory debugging

# Performance optimization
export ENABLE_CACHING="true"             # Enable caching
export CACHE_TTL="3600"                  # Cache time-to-live (seconds)
export MAX_CONCURRENT_AGENTS="10"        # Maximum concurrent agents
```

---

### Feature Flags

#### Experimental Features
```bash
# Feature toggles
export ENABLE_NEURAL_LEARNING="false"    # Enable neural learning
export ENABLE_ADVANCED_ANALYSIS="true"   # Enable advanced analysis engines
export ENABLE_SMART_RECOVERY="true"      # Enable smart recovery features

# UI enhancements
export ENABLE_RICH_UI="true"             # Enable rich terminal UI
export ENABLE_WEB_DASHBOARD="true"       # Enable web dashboard
export ENABLE_REAL_TIME_EVENTS="true"    # Enable real-time event streaming
```

#### Development Flags
```bash
# Development mode
export DEVELOPMENT_MODE="false"          # Enable development features
export HOT_RELOAD="false"               # Enable hot reload for development
export MOCK_EXTERNAL_APIS="false"       # Mock external API calls

# Testing flags
export TEST_MODE="false"                # Enable test mode
export MOCK_CLAUDE_RESPONSES="false"    # Mock Claude API responses
export ENABLE_TEST_HOOKS="false"        # Enable testing hooks
```

---

### API Keys and Authentication

#### Required API Keys
```bash
# Primary API keys
export ANTHROPIC_API_KEY="sk-ant-..."   # Required for Claude Code (Primary)

# Optional integrations
export OPENAI_API_KEY="sk-..."          # Optional for OpenAI features
export GITHUB_TOKEN="ghp_..."           # Optional for GitHub integration
```

#### Authentication Configuration
```bash
# Authentication settings
export API_TIMEOUT="30000"              # API timeout in milliseconds
export MAX_RETRIES="3"                  # Maximum API retry attempts
export RATE_LIMIT_BUFFER="1000"         # Rate limit buffer in milliseconds
```

---

### Installation Paths

#### System Paths
```bash
# Installation directories
export AI_DEV_HOME="$HOME/.ai-dev-os"           # AI-Dev-OS installation
export CLAUDE_HOME="$HOME/.claude"              # Claude Code settings
export TMUX_ORCH_HOME="$HOME/.tmux-orchestrator" # TMux orchestrator config

# Workflow paths
export WORKFLOW_HOME="$(pwd)/.ai-workflow"      # Local workflow installation
export CONFIG_DIR="$WORKFLOW_HOME/configs"      # Configuration directory
export LOGS_DIR="$WORKFLOW_HOME/logs"          # Logs directory
```

#### Backup and Storage
```bash
# Backup configuration
export BACKUP_DIR="$HOME/.ai-workflow-backups" # Backup storage location
export BACKUP_RETENTION_DAYS="30"              # Backup retention period
export AUTO_BACKUP="true"                      # Enable automatic backups

# Temporary storage
export TEMP_DIR="/tmp/ai-workflow"              # Temporary files directory
export CACHE_DIR="$HOME/.ai-workflow-cache"    # Cache directory
```

---

## ⚡ Quick Reference

### Most Common Commands

#### Essential Daily Commands
```bash
# Quick start workflow
./ai-workflow init --auto "your objective"

# Check system status
./ai-workflow status

# Health check
./ai-workflow health

# Analyze project complexity
./ai-workflow analyze

# Start monitoring dashboard
./ai-workflow status-dashboard 8787
```

#### Workflow Execution Shortcuts
```bash
# Force specific approaches
./ai-workflow init --swarm    # Simple tasks (0-30 complexity)
./ai-workflow init --hive     # Medium tasks (30-70 complexity)
./ai-workflow init --sparc    # Complex tasks (70+ complexity)

# Let system decide automatically
./ai-workflow init --auto

# Background execution
nohup ./ai-workflow init --auto "task" > workflow.log 2>&1 &
```

#### Quick Problem Solving
```bash
# Fix permissions issues
node .ai-workflow/check-hive-permissions.js fix

# Toggle YOLO mode
./toggle-permissions.sh toggle

# Emergency reset
./ai-workflow reset --emergency

# Quick recovery
./ai-workflow recover execute
```

---

### Quick Start Workflows

#### First-Time Setup
```bash
# 1. Install (choose one)
./install-modular.sh          # Interactive component selection
./install-production.sh       # Full production installation
./install-standalone.sh       # Minimal installation

# 2. Verify installation
./ai-workflow verify

# 3. Configure
export ANTHROPIC_API_KEY="your-key"
./ai-workflow yolo on         # Optional: enable YOLO mode

# 4. Start first workflow
./ai-workflow init --auto "your objective"
```

#### Development Workflow
```bash
# 1. Morning startup
./ai-workflow status          # Check system health
./ai-workflow supervisor start # Start file watcher

# 2. Start development task
./ai-workflow init --hive "implement feature X"

# 3. Monitor progress
./ai-workflow status-dashboard 8787

# 4. End of day
./ai-workflow tmux start      # Persist session overnight
```

#### Production Deployment
```bash
# 1. Production setup
export NODE_ENV=production
export CLAUDE_FLOW_VERSION=stable
export AIWF_AUTORUN=true

# 2. Start in TMux for persistence
tmux new -s production -d
tmux send-keys -t production './ai-workflow init --sparc "deploy application"' C-m

# 3. Monitor remotely
./ai-workflow status-dashboard 8787
curl -N http://127.0.0.1:8787/events/stream
```

---

### Troubleshooting Shortcuts

#### Quick Diagnostics
```bash
# System health pipeline
./ai-workflow health && ./ai-workflow verify && ./ai-workflow integrations status

# Check all dependencies
node --version && npm --version && git --version && tmux -V && claude --version

# Environment validation
echo $ANTHROPIC_API_KEY && echo $CLAUDE_FLOW_VERSION && echo $NODE_ENV
```

#### Common Fix Commands
```bash
# Permission fixes
chmod +x install-*.sh
node .ai-workflow/check-hive-permissions.js fix

# Clean restart
rm -rf .ai-workflow/temp/* && ./ai-workflow restart

# Integration fixes
./ai-workflow remove claude-code && ./ai-workflow add claude-code
./ai-workflow update

# Cache clearing
rm -rf .ai-workflow/cache/* .claude-flow/temp/*
```

#### Emergency Recovery
```bash
# Complete system recovery
./ai-workflow stop
rm -rf .ai-workflow/temp/* .claude-flow/temp/*
./ai-workflow restart
./ai-workflow verify --fix-all

# Backup and reinstall
cp -r .ai-workflow .ai-workflow.backup
rm -rf .ai-workflow .ai-dev
./install-modular.sh
```

---

### Performance Optimization Shortcuts

#### Quick Performance Boost
```bash
# Enable optimizations
export NODE_OPTIONS="--max-old-space-size=4096"
export ENABLE_CACHING=true
export MAX_CONCURRENT_AGENTS=6

# Clear caches and restart
rm -rf .ai-workflow/cache/* && ./ai-workflow restart

# Monitor performance
curl -sS http://127.0.0.1:8787/resources | jq
```

#### Resource Monitoring
```bash
# Real-time monitoring
watch -n 2 'curl -sS http://127.0.0.1:8787/resources | jq'

# Memory usage
curl -sS http://127.0.0.1:8787/agents | jq '.[] | {id, memory}'

# Performance metrics
curl -sS http://127.0.0.1:8787/metrics | jq '.performance'
```

---

### Integration Quick Setup

#### Claude Code Quick Setup
```bash
# Install and configure
npm install -g @anthropic-ai/claude-code
export ANTHROPIC_API_KEY="your-key"
./ai-workflow add claude-code
./ai-workflow yolo on
claude --version
```

#### Claude Flow Quick Setup
```bash
# Set version and test
export CLAUDE_FLOW_VERSION=alpha
npx claude-flow@alpha --version
./ai-workflow add claude-flow
npx claude-flow@alpha swarm "test task"
```

#### TMux Quick Setup
```bash
# Install and configure
sudo apt install tmux  # or brew install tmux
./ai-workflow add tmux
./ai-workflow tmux start
tmux ls
```

---

### Monitoring & Events Quick Access

#### Real-time Monitoring
```bash
# Start all monitoring
./ai-workflow status-dashboard 8787 &
./ai-workflow events tui &
tail -f .ai-workflow/logs/workflow.log

# Access URLs
# Dashboard: http://localhost:8787/ui
# Events: http://localhost:8787/events/stream
# Health: http://localhost:8787/health
```

#### Quick Status Checks
```bash
# One-liner status
curl -sS http://127.0.0.1:13800/health | jq -r '.status'

# Agent count
curl -sS http://127.0.0.1:8787/agents | jq 'length'

# Current task
curl -sS http://127.0.0.1:8787/tasks | jq '.[] | select(.status == "active") | .name'
```

This comprehensive quick reference section provides immediate access to the most frequently used commands, workflows, and troubleshooting procedures for efficient Master Workflow system operation.

---

## 🔧 Utility & Helper Commands

### Permission Management

#### Hive-Mind Permissions Checker
```bash
# Check permissions for all .hive-mind directories
node .ai-workflow/check-hive-permissions.js check

# Fix permission issues automatically
node .ai-workflow/check-hive-permissions.js fix

# Initialize new .hive-mind directory
node .ai-workflow/check-hive-permissions.js init [directory]
```
**Description**: Comprehensive permission management for .hive-mind directories used by multi-agent workflows.

**Features**:
- Scans all .hive-mind directories in project
- Identifies permission issues blocking agent access
- Automatically fixes ownership and permission problems
- Creates proper directory structures with correct permissions

**Usage Example**:
```bash
# Run health check on all hive directories
node .ai-workflow/check-hive-permissions.js check

# Sample output:
# 🔍 Checking permissions for 3 .hive-mind directories...
# ✅ All .hive-mind directories have proper permissions
```

#### YOLO Mode (Skip Permissions)
```bash
# Toggle YOLO mode (skip permissions)
./toggle-permissions.sh toggle

# Enable YOLO mode
./toggle-permissions.sh on

# Disable YOLO mode  
./toggle-permissions.sh off

# Check current status
./toggle-permissions.sh status
```
**Description**: Quick toggle for Claude Code's `--dangerously-skip-permissions` flag to streamline development.

**⚠️ Security Warning**: YOLO mode allows Claude Code to execute commands without asking permission. Use only in trusted development environments.

**Configuration Locations**:
- Global: `~/.claude/settings.json`
- Project: `.claude/settings.json`
- System: `~/.ai-dev-os/configs/system.conf`

---

### Documentation Generation

#### Intelligent Document Generator
```bash
# Generate project documentation based on analysis
node .ai-workflow/intelligence-engine/document-generator-v2.js

# Generate with custom templates
node .ai-workflow/intelligence-engine/document-customizer.js

# Generate Claude.md for Claude Code integration
node .ai-workflow/intelligence-engine/claude-md-generator.js

# Interactive document updater
node .ai-workflow/intelligence-engine/interactive-document-updater.js
```
**Description**: AI-powered documentation generation that analyzes your codebase and creates comprehensive, up-to-date documentation.

**Features**:
- Automatic code analysis and documentation generation
- Template-based customization for different project types
- Integration with Claude Code for AI-assisted documentation
- Interactive updates based on code changes

#### Agent-OS Document Analyzer
```bash
# Analyze and document Agent-OS specifications
node .ai-workflow/intelligence-engine/agent-os-document-analyzer.js

# Test document analyzer
node .ai-workflow/intelligence-engine/test-agent-os-document-analyzer.js
```
**Description**: Specialized documentation analysis for Agent-OS specification-driven development projects.

---

### Supervisor Commands

#### Workflow Supervisor
```bash
# Start supervisor with default interval (30 minutes)
./ai-workflow supervisor start

# Start with custom interval (in seconds)
./ai-workflow supervisor start 900

# Stop supervisor
./ai-workflow supervisor stop

# Check supervisor status
./ai-workflow supervisor status
```
**Description**: Automated supervisor that monitors project changes and maintains optimal workflow configuration.

**Supervisor Features**:
- **File System Monitoring**: Watches for code changes using inotify (Linux) or fswatch (macOS)
- **Automatic Re-analysis**: Triggers complexity analysis when files change
- **Approach Adaptation**: Adjusts workflow approach based on project evolution
- **TMux Integration**: Automatically restarts workflow sessions when approach changes
- **Event Broadcasting**: Sends approach changes to event bus for monitoring

**Log Locations**:
```bash
# View supervisor logs
tail -f .ai-workflow/logs/supervisor.log

# Check session information
ls .ai-workflow/logs/sessions/
```

#### TMux Orchestration
```bash
# Start TMux workflow orchestration
./ai-workflow tmux start

# Attach to running session
./ai-workflow tmux attach

# List active sessions
./ai-workflow tmux list

# Stop TMux session
./ai-workflow tmux stop
```
**Description**: TMux-based orchestration for persistent, 24/7 autonomous workflow execution.

---

### Analysis Engines

#### Core Complexity Analyzer
```bash
# Analyze project complexity
./ai-workflow analyze

# Analyze with verbose output
node .ai-workflow/intelligence-engine/complexity-analyzer.js --verbose

# Test mode analysis
node .ai-workflow/intelligence-engine/complexity-analyzer.js --test
```
**Description**: Intelligent complexity analysis engine that determines optimal workflow approach.

**Analysis Factors**:
- Code structure and architecture patterns
- Project size and scope
- Technology stack complexity
- Team collaboration requirements
- Dependencies and integrations

#### Specialized Analysis Engines
```bash
# API Analysis Engine
node .ai-workflow/intelligence-engine/analysis-engines/api-analysis-engine.js

# Architecture Detection Engine
node .ai-workflow/intelligence-engine/analysis-engines/architecture-detection-engine.js

# Business Logic Extractor
node .ai-workflow/intelligence-engine/analysis-engines/business-logic-extractor.js

# Database Analysis Engine
node .ai-workflow/intelligence-engine/analysis-engines/database-analysis-engine.js

# Pattern Detection Engine
node .ai-workflow/intelligence-engine/analysis-engines/pattern-detection-engine.js

# Performance Analysis Engine
node .ai-workflow/intelligence-engine/analysis-engines/performance-analysis-engine.js

# Security Analysis Engine
node .ai-workflow/intelligence-engine/analysis-engines/security-analysis-engine.js

# Test Analysis Engine
node .ai-workflow/intelligence-engine/analysis-engines/test-analysis-engine.js
```
**Description**: Specialized analysis engines for different aspects of software projects.

**Engine Capabilities**:
- **API Analysis**: REST/GraphQL endpoint analysis, API documentation generation
- **Architecture Detection**: Design patterns, architectural styles, framework identification
- **Business Logic**: Core business rules extraction and documentation
- **Database Analysis**: Schema analysis, query optimization, data flow mapping
- **Pattern Detection**: Code patterns, anti-patterns, best practices validation
- **Performance Analysis**: Bottleneck detection, optimization recommendations
- **Security Analysis**: Vulnerability scanning, security best practices validation
- **Test Analysis**: Test coverage analysis, test strategy recommendations

#### Deep Codebase Analyzer
```bash
# Comprehensive codebase analysis
node .ai-workflow/intelligence-engine/deep-codebase-analyzer.js

# Project structure scanning
node .ai-workflow/intelligence-engine/project-scanner.js
```
**Description**: Deep analysis tools for comprehensive codebase understanding and documentation.

---

### Configuration Scripts

#### MCP Server Discovery
```bash
# Discover and configure MCP servers
./ai-workflow mcp refresh

# Alternative commands
./ai-workflow mcp discover
./ai-workflow mcp scan
```
**Description**: Automatic discovery and configuration of Model Context Protocol (MCP) servers for enhanced AI capabilities.

**MCP Registry Management**:
```bash
# View discovered servers
jq '.servers' .ai-workflow/configs/mcp-registry.json

# View available tools
jq '.tools' .ai-workflow/configs/mcp-registry.json
```

#### Component Integration
```bash
# Add new components after installation
./ai-workflow add claude-code
./ai-workflow add agent-os
./ai-workflow add claude-flow
./ai-workflow add tmux

# Remove components
./ai-workflow remove claude-code

# Update all components
./ai-workflow update

# Reset to core only
./ai-workflow reset --core-only
```
**Description**: Dynamic component management for modular workflow customization.

#### Environment Configuration
```bash
# Scan environment for missing dependencies
./ai-workflow env-scan

# Check configuration validity
./ai-workflow config validate

# Test integration connections
./ai-workflow config test-connections

# View component status
./ai-workflow components
```
**Description**: Environment validation and configuration management tools.

---

### Recovery Operations

#### Process Recovery
```bash
# Process recovery script
bash .ai-workflow/lib/process-recovery.sh

# Session recovery
./ai-workflow recover analyze
./ai-workflow recover plan
./ai-workflow recover execute

# Full recovery workflow
./ai-workflow recover analyze && ./ai-workflow recover execute
```
**Description**: Comprehensive recovery operations for interrupted workflows and failed processes.

**Recovery Capabilities**:
- **Process State Recovery**: Restore interrupted workflow sessions
- **Session Persistence**: Maintain workflow state across system restarts
- **Error Analysis**: Identify and categorize failure causes
- **Automatic Remediation**: Apply fixes for common issues
- **Backup Integration**: Restore from backup points when available

#### TMux Session Recovery
```bash
# Recover TMux sessions
tmux list-sessions
tmux attach -t session-name

# Session information
ls .ai-workflow/logs/sessions/*.info

# Check session status from logs
jq '.session' .ai-workflow/logs/sessions/latest.info
```
**Description**: TMux session recovery for persistent workflow execution.

#### Workflow State Recovery
```bash
# Check workflow state
./ai-workflow status

# Verify system health
./ai-workflow health

# Restore from backup
./ai-workflow restore --backup-id <backup-id>

# Emergency reset
./ai-workflow reset --emergency
```
**Description**: Workflow state management and recovery operations.

---

### Smart Tool Selection

#### Intelligent Tool Selector
```bash
# Test smart tool selection
node .ai-workflow/intelligence-engine/smart-tool-selector.js

# Integration checking
node .ai-workflow/intelligence-engine/integration-checker.js

# Integration with JSON output
node .ai-workflow/intelligence-engine/integration-checker.js --json
```
**Description**: AI-powered tool selection based on project analysis and requirements.

**Smart Selection Features**:
- **Context Analysis**: Analyzes project context for optimal tool selection
- **Integration Health**: Monitors tool integration status and compatibility
- **Performance Optimization**: Selects tools based on performance requirements
- **Fallback Management**: Provides alternatives when primary tools are unavailable

#### Approach Selector
```bash
# Intelligent approach selection
node .ai-workflow/intelligence-engine/approach-selector.js

# Custom approach selection
./ai-workflow init --auto "Your project description"
```
**Description**: Intelligent workflow approach selection based on project complexity and requirements.

---

### System Utilities

#### Installation Dependency Management
```bash
# Install missing dependencies
bash .ai-workflow/intelligence-engine/install-dependencies.sh

# Verify dependencies
./ai-workflow deps check

# Install missing dependencies
./ai-workflow deps install
```
**Description**: Automated dependency management and installation verification.

#### System Health Monitoring
```bash
# System health check
./ai-workflow health

# Detailed health report with JSON output
npm run health

# Component verification
./ai-workflow verify

# Integration status
./ai-workflow integrations status
```
**Description**: Comprehensive system health monitoring and validation.

#### Memory and Neural Learning
```bash
# Test neural learning system
node .ai-workflow/intelligence-engine/test-neural-learning.js

# Memory integration testing
node .ai-workflow/intelligence-engine/memory-integration-example.js

# Shared memory management
node .ai-workflow/intelligence-engine/shared-memory.js
```
**Description**: Advanced memory management and neural learning capabilities for adaptive workflows.

---

### Development Utilities

#### Testing Utilities
```bash
# Test various phases
node .ai-workflow/intelligence-engine/test-phase3-implementation.js
node .ai-workflow/intelligence-engine/test-phase4-implementation.js
node .ai-workflow/intelligence-engine/test-phase5-implementation.js
node .ai-workflow/intelligence-engine/test-phase6-neural-integration.js

# Test preservation features
node .ai-workflow/intelligence-engine/test-preservation-features.js

# Test shared memory
node .ai-workflow/intelligence-engine/test-shared-memory.js
```
**Description**: Development testing utilities for system components and features.

#### Agent Management
```bash
# Sub-agent manager
node .ai-workflow/intelligence-engine/sub-agent-manager.js

# Agent communication testing
node .ai-workflow/intelligence-engine/agent-communication.js

# Queen controller
node .ai-workflow/intelligence-engine/queen-controller.js
```
**Description**: Advanced agent management and coordination utilities.

---

### Quick Reference

#### Essential Utility Commands
```bash
# Permission check and fix
node .ai-workflow/check-hive-permissions.js check

# Toggle YOLO mode
./toggle-permissions.sh toggle

# System health check
./ai-workflow health

# Start supervisor
./ai-workflow supervisor start

# Analyze project
./ai-workflow analyze

# Generate documentation
node .ai-workflow/intelligence-engine/document-generator-v2.js

# Discover MCP servers
./ai-workflow mcp refresh

# Process recovery
./ai-workflow recover execute
```

#### Troubleshooting Quick Fixes
```bash
# Fix permissions
node .ai-workflow/check-hive-permissions.js fix

# Emergency reset
./ai-workflow reset --emergency

# Dependency check
./ai-workflow deps check

# Integration health
./ai-workflow integrations status

# Clear cache and restart
rm -rf .ai-workflow/temp/* && ./ai-workflow restart
```

---

### Environment Variables for Utilities

#### Core Utility Variables
```bash
# Supervisor configuration
export SUPERVISOR_INTERVAL=1800           # Supervisor check interval
export ENABLE_FILE_WATCHER=true          # Enable filesystem monitoring

# Permission management
export YOLO_MODE=false                   # Global YOLO mode setting
export SKIP_PERMISSION_CHECKS=false     # Skip all permission checks

# Documentation generation
export DOC_GENERATION_MODE=auto         # auto, manual, interactive
export CUSTOM_TEMPLATE_DIR=/path/to/templates

# Analysis engine configuration
export ANALYSIS_DEPTH=comprehensive     # quick, standard, comprehensive
export ENABLE_NEURAL_LEARNING=true      # Enable adaptive learning

# Recovery settings
export AUTO_RECOVERY=true               # Enable automatic recovery
export BACKUP_RETENTION_DAYS=30        # Backup retention period
```

This comprehensive utility section provides complete coverage of all helper commands, configuration scripts, analysis engines, and recovery operations available in the Master Workflow system.