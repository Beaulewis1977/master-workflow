# AI Dev OS - Technical Setup Documentation
## Complete Installation & Configuration Guide

### Table of Contents
1. [System Requirements](#system-requirements)
2. [Pre-Installation Checklist](#pre-installation-checklist)
3. [Installation Process](#installation-process)
4. [Post-Installation Configuration](#post-installation-configuration)
5. [Verification & Testing](#verification--testing)
6. [Advanced Configuration](#advanced-configuration)
7. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Minimum Requirements
- **OS**: Linux (Ubuntu 20.04+), macOS (12+), WSL2 (Windows)
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **RAM**: 4GB minimum, 8GB recommended
- **Disk Space**: 2GB free space
- **Terminal**: Bash or Zsh shell
- **tmux**: v3.0 or higher

### Required Software
```bash
# Check versions
node --version      # Should be >= v18.0.0
npm --version       # Should be >= 9.0.0
tmux -V            # Should be >= 3.0
git --version      # Any recent version
```

### API Requirements
- **Anthropic API Key**: Required for Claude Code
- **Internet Connection**: Required for package installation

---

## Pre-Installation Checklist

### 1. Install Prerequisites

#### Ubuntu/Debian:
```bash
# Update package list
sudo apt update

# Install Node.js (v20 LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install tmux and git
sudo apt-get install -y tmux git jq curl

# Verify installations
node --version && npm --version && tmux -V
```

#### macOS:
```bash
# Using Homebrew
brew install node@20 tmux git jq

# Verify installations
node --version && npm --version && tmux -V
```

#### Windows (WSL2):
```bash
# First, ensure WSL2 is installed and updated
wsl --update

# Then follow Ubuntu/Debian instructions above
```

### 2. Configure Environment

#### Set up API Key:
```bash
# Add to ~/.bashrc or ~/.zshrc
echo 'export ANTHROPIC_API_KEY="sk-ant-xxxxx"' >> ~/.bashrc
source ~/.bashrc
```

#### Ensure ~/.local/bin is in PATH:
```bash
# For bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc

# For zsh
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc

# Reload shell
source ~/.bashrc  # or ~/.zshrc
```

### 3. Backup Existing Configurations

```bash
# Backup Claude settings if they exist
[ -d ~/.claude ] && cp -r ~/.claude ~/.claude.backup.$(date +%Y%m%d)

# Backup tmux config if exists
[ -f ~/.tmux.conf ] && cp ~/.tmux.conf ~/.tmux.conf.backup.$(date +%Y%m%d)
```

---

## Installation Process

### Option 1: Automated Installation (Recommended)

```bash
# Download installer
curl -fsSL https://raw.githubusercontent.com/yourusername/ai-dev-os/main/install-ai-dev-os.sh -o install-ai-dev-os.sh

# Make executable
chmod +x install-ai-dev-os.sh

# Run installer
./install-ai-dev-os.sh

# Follow the prompts
```

### Option 2: Manual Installation

#### Step 1: Install Claude Code
```bash
# Install globally
npm install -g @anthropic-ai/claude-code

# Verify installation
claude --version
```

#### Step 2: Install Agent OS
```bash
# Base installation
curl -fsSL https://raw.githubusercontent.com/buildermethods/agent-os/main/setup.sh | bash

# Claude Code integration
curl -fsSL https://raw.githubusercontent.com/buildermethods/agent-os/main/setup-claude-code.sh | bash
```

#### Step 3: Install Claude-Flow
```bash
# Initialize Claude-Flow
npx claude-flow@alpha init --force

# Verify installation
ls -la ~/.claude-flow/
```

#### Step 4: Install Tmux-Orchestrator
```bash
# Clone repository
git clone https://github.com/Jedward23/Tmux-Orchestrator.git ~/.tmux-orchestrator

# Make scripts executable
chmod +x ~/.tmux-orchestrator/*.sh
```

#### Step 5: Set up AI Dev OS Integration
```bash
# Create directory structure
mkdir -p ~/.ai-dev-os/{bin,configs,templates,logs}

# Download integration scripts
curl -fsSL [url]/ai-dev -o ~/.ai-dev-os/bin/ai-dev
curl -fsSL [url]/ai-dev-init -o ~/.ai-dev-os/bin/ai-dev-init
curl -fsSL [url]/ai-dev-status -o ~/.ai-dev-os/bin/ai-dev-status
curl -fsSL [url]/ai-dev-orchestrate -o ~/.ai-dev-os/bin/ai-dev-orchestrate

# Make executable
chmod +x ~/.ai-dev-os/bin/*

# Add to PATH
echo 'export PATH="$HOME/.ai-dev-os/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

---

## Post-Installation Configuration

### 1. Configure Claude Code

#### Global Settings (`~/.claude/settings.json`):
```json
{
  "dangerouslySkipPermissions": false,
  "autoSave": true,
  "maxConcurrentTools": 10,
  "hooks": {
    "user-prompt-submit-hook": "echo 'Prompt: ${USER_PROMPT}' >> ~/.ai-dev-os/logs/activity.log",
    "tool-call-hook": "echo 'Tool: ${TOOL_NAME}' >> ~/.ai-dev-os/logs/activity.log",
    "model-response-hook": "echo 'Response generated' >> ~/.ai-dev-os/logs/activity.log"
  }
}
```

#### Integration Configuration (`~/.claude/integrations.json`):
```json
{
  "version": "1.0.0",
  "systems": {
    "agent-os": {
      "enabled": true,
      "commands": ["plan-product", "create-spec", "analyze-product"]
    },
    "claude-flow": {
      "enabled": true,
      "cli": "npx claude-flow@alpha"
    },
    "tmux-orchestrator": {
      "enabled": true,
      "capabilities": ["24-7-operation", "session-persistence"]
    },
    "sub-agents": {
      "enabled": true
    }
  }
}
```

### 2. Configure Tmux

#### Create/Update `~/.tmux.conf`:
```bash
# AI Dev OS Tmux Configuration
set -g mouse on
set -g history-limit 50000
set -g default-terminal "screen-256color"

# Status bar
set -g status-right "#[fg=green]AI-DEV-OS Active #[fg=yellow]| #[fg=cyan]%H:%M"

# Window naming
set-option -g allow-rename off
set-option -g automatic-rename off

# Pane borders
set -g pane-border-style fg=colour235
set -g pane-active-border-style fg=colour51
```

### 3. System Configuration

#### Create system config (`~/.ai-dev-os/configs/system.conf`):
```bash
# AI Development OS Configuration
SKIP_PERMISSIONS=false
AUTO_APPROVE=false
AGENT_OS_ENABLED=true
CLAUDE_FLOW_ENABLED=true
TMUX_ORCHESTRATOR_ENABLED=true
SUB_AGENTS_ENABLED=true
AUTO_START_TMUX=false
AUTO_PLAN_NEW_PROJECTS=false
ENABLE_LOGGING=true
MAX_CONCURRENT_AGENTS=3
```

### 4. Project Templates Setup

```bash
# Create template directories
mkdir -p ~/.ai-dev-os/templates/{web-app,api-service,cli-tool}

# Each template should contain:
~/.ai-dev-os/templates/web-app/
├── .claude/
│   ├── settings.json
│   └── agents/
│       └── frontend-specialist.md
├── .agent-os/
│   └── standards.md
└── .ai-dev/
    └── project.json
```

---

## Verification & Testing

### 1. System Status Check

```bash
# Run comprehensive status check
ai-dev status

# Expected output:
# Claude Code:          ✅ Installed
# Agent OS:             ✅ Configured (5 agents)
# Claude-Flow:          ✅ Installed
# Tmux-Orchestrator:    ✅ Installed
```

### 2. Component Testing

#### Test Claude Code:
```bash
# Basic test
claude --version

# Test with API
echo "Hello, Claude" | claude
```

#### Test Agent OS:
```bash
# Check commands exist
ls -la ~/.claude/commands/

# Test in Claude
claude
# Then type: /plan-product
```

#### Test Claude-Flow:
```bash
# Test swarm mode
npx claude-flow@alpha swarm "create a simple hello world"
```

#### Test Tmux-Orchestrator:
```bash
# Create test session
tmux new-session -d -s test-session
tmux list-sessions
tmux kill-session -t test-session
```

### 3. Integration Test

```bash
# Create test project
mkdir ~/test-ai-project
cd ~/test-ai-project

# Initialize
ai-dev init web-app

# Check created files
ls -la .ai-dev/
ls -la .claude/
ls -la .agent-os/

# Start systems
ai-dev start

# Test orchestration
ai-dev orchestrate test-project
```

---

## Advanced Configuration

### 1. Custom Sub-Agents

#### Create specialized agent (`~/.claude/agents/custom-agent.md`):
```markdown
---
name: custom-specialist
description: Your specialized agent
tools: Read, Write, Edit, Bash
---

You are a specialist in [domain]. Your responsibilities:
- [Responsibility 1]
- [Responsibility 2]
```

### 2. Custom Hooks

#### Advanced hook configuration:
```json
{
  "hooks": {
    "pre-tool-hook": "~/.ai-dev-os/hooks/pre-tool.sh",
    "post-tool-hook": "~/.ai-dev-os/hooks/post-tool.sh",
    "error-hook": "~/.ai-dev-os/hooks/error-handler.sh"
  }
}
```

### 3. Performance Tuning

```bash
# Adjust memory limits
export CLAUDE_FLOW_MAX_MEMORY="4GB"
export NODE_OPTIONS="--max-old-space-size=4096"

# Adjust tmux buffer
tmux set-option -g history-limit 100000

# API rate limiting
export AI_DEV_API_RATE_LIMIT=50  # requests per minute
```

### 4. Security Hardening

```bash
# Secure API key storage
chmod 600 ~/.anthropic/api-key
chmod 700 ~/.claude/
chmod 700 ~/.ai-dev-os/

# Audit logging
echo 'export AI_DEV_AUDIT_LOG="$HOME/.ai-dev-os/logs/audit.log"' >> ~/.bashrc
```

---

## Troubleshooting

### Common Issues & Solutions

#### Issue: "command not found: ai-dev"
```bash
# Solution: Add to PATH
export PATH="$HOME/.ai-dev-os/bin:$PATH"
source ~/.bashrc
```

#### Issue: "Claude Code not responding"
```bash
# Check API key
echo $ANTHROPIC_API_KEY

# Test Claude directly
claude --debug
```

#### Issue: "Tmux sessions disappearing"
```bash
# Install tmux-resurrect
git clone https://github.com/tmux-plugins/tmux-resurrect ~/.tmux/plugins/tmux-resurrect

# Add to ~/.tmux.conf
run-shell ~/.tmux/plugins/tmux-resurrect/resurrect.tmux
```

#### Issue: "Permission denied errors"
```bash
# Fix permissions
chmod +x ~/.ai-dev-os/bin/*
chmod +x ~/.tmux-orchestrator/*.sh

# For skip-permissions
./toggle-permissions.sh on
```

#### Issue: "Integration not working"
```bash
# Verify configurations
cat ~/.claude/integrations.json | jq .
cat ~/.ai-dev-os/configs/system.conf

# Reload configurations
ai-dev sync
```

### Debug Mode

```bash
# Enable debug logging
export AI_DEV_DEBUG=true
export CLAUDE_DEBUG=true
export TMUX_ORCHESTRATOR_DEBUG=true

# Check logs
tail -f ~/.ai-dev-os/logs/debug.log
```

### Getting Help

```bash
# Built-in help
ai-dev help
claude --help

# Check documentation
cat ~/AI-Dev-OS-*.md

# System diagnostics
ai-dev status --verbose
```

---

## Next Steps

1. **Initialize a Project**: Navigate to project and run `ai-dev init`
2. **Configure Permissions**: Run `./ai-dev-config.sh` to customize
3. **Start Development**: Use `ai-dev start` or `ai-dev orchestrate`
4. **Read User Guide**: See `AI-Dev-OS-User-Guide.md` for usage examples

---

*Technical documentation v1.0 - AI Development Operating System*