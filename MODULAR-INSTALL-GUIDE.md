# 📦 Modular Installation Guide

## Overview

The Intelligent Workflow System v2.0 features a fully modular architecture. You can install only the components you need, and add more later as your requirements grow.

## 🎯 Component Selection During Installation

When you run `install-modular.sh`, you'll see an interactive menu:

### Step 1: Component Selection

```
╔══════════════════════════════════════════════════════════════╗
║     Intelligent Workflow System - Modular Installation      ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Select components to install:                              ║
║                                                              ║
║  [✓] Core Workflow System (required)                        ║
║  [ ] Claude Code Integration                                ║
║  [ ] Agent-OS Planning System                               ║
║  [ ] Claude Flow 2.0 Multi-Agent                           ║
║  [ ] TMux Orchestrator (24/7 operation)                    ║
║                                                              ║
║  [1] Toggle Claude Code    [4] Toggle TMux                 ║
║  [2] Toggle Agent-OS       [A] Select All                  ║
║  [3] Toggle Claude Flow    [N] Select None (Core only)     ║
║                                                              ║
║  [C] Continue with installation                            ║
║  [Q] Quit                                                  ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

### Step 2: Claude Code Configuration (if selected)

If you selected Claude Code, you'll be asked about permissions:

```
Do you have a 'yolo' alias for Claude Code with --dangerously-skip-permissions? (y/n)
```

- **Yes**: System will use your `yolo` alias
- **No**: You'll be asked if you want to skip permissions
  - If yes: Uses `claude --dangerously-skip-permissions`
  - If no: Uses standard `claude` command

### Step 3: Initial Prompt Collection

After configuration, you can optionally enter your project requirements:

- **Unlimited size**: Paste entire project specifications
- **Multi-line support**: Use Ctrl+D when finished
- **Saved for reuse**: Access with `./ai-workflow prompt`
- **Smart analysis**: System recommends approach based on prompt complexity

## 🧩 Component Details

### Core Workflow System (Always Installed)
```
✅ Required Component
```
- Project complexity analyzer
- Intelligent approach selector
- Basic workflow orchestration
- CLI interface
- Configuration management

**Use Cases:**
- Basic project analysis
- Manual workflow planning
- Foundation for other components

### Claude Code Integration
```
☐ Optional Component
```
- Sub-agents in `.claude/agents/`
- Slash commands in `.claude/commands/`
- Automated hooks for triggers
- Recovery specialist agent

**Use Cases:**
- Automated code completion
- Fixing incomplete projects
- Interactive AI assistance
- Custom agent workflows

**Commands Enabled:**
```bash
./ai-workflow agents list
./ai-workflow agents status
./ai-workflow recover analyze
./ai-workflow recover execute
```

### Agent-OS Planning System
```
☐ Optional Component
```
- Specification templates
- Product planning tools
- Task management
- Documentation generation

**Use Cases:**
- Product specification
- Feature planning
- Structured development
- Documentation-first approach

**Commands Enabled:**
```bash
/plan-product
/create-spec [feature]
/analyze-product
/execute-tasks
```

### Claude Flow 2.0 Multi-Agent
```
☐ Optional Component
```
- Simple Swarm (single agent)
- Hive-Mind (multi-agent)
- SPARC methodology
- All version variants

**Use Cases:**
- Complex project orchestration
- Multi-agent collaboration
- Enterprise development
- Systematic phases

**Commands Enabled:**
```bash
./ai-workflow init --swarm
./ai-workflow init --hive
./ai-workflow init --sparc
```

### TMux Orchestrator
```
☐ Optional Component
```
- 24/7 background operation
- Session management
- Multi-window orchestration
- Detached execution

**Use Cases:**
- Long-running processes
- Continuous operation
- Background workflows
- Server deployments

**Commands Enabled:**
```bash
./ai-workflow tmux start
./ai-workflow tmux attach
./ai-workflow tmux list
```

## 🔄 Execution Modes

The system automatically selects the best execution mode:

### With TMux (if installed)
- Creates detached sessions
- Multiple windows for agents
- Background operation
- Attachable/detachable

### Without TMux (fallback)
- Uses Node.js child processes
- Runs in background
- Logs to files
- Process management via PID

## 📊 Component Combinations

### Minimal Setup (Core Only)
```
Components: Core
Best For: Analysis, planning, manual execution
```

### AI-Assisted Development
```
Components: Core + Claude Code
Best For: Automated coding, project completion
```

### Full Planning Suite
```
Components: Core + Claude Code + Agent-OS
Best For: Specification-driven development
```

### Multi-Agent Powerhouse
```
Components: Core + Claude Flow + Claude Code
Best For: Complex projects, team simulation
```

### Enterprise Stack
```
Components: All
Best For: Maximum capability, 24/7 operation
```

## 🔧 Post-Installation Management

### Verifying Installation
```bash
# Run verification to check all components work together
./ai-workflow verify

# Output shows:
# - Core system files present
# - Claude Code integration status
# - Agent-OS customization
# - Claude Flow initialization
# - TMux configuration
# - Component communication health
```

### Managing YOLO Mode
```bash
# Enable YOLO mode (if you have the alias)
./ai-workflow yolo on

# Disable YOLO mode
./ai-workflow yolo off

# Check current mode
./ai-workflow yolo status
```

### Adding Components Later
```bash
# Check current components
./ai-workflow components

# Add missing component
./ai-workflow add claude-flow
./ai-workflow add tmux
```

### Updating Configuration
```bash
# Edit installation config
nano .ai-workflow/installation-config.json

# View current config
cat .ai-workflow/installation-config.json | jq
```

### Working with Prompts
```bash
# Execute saved prompt
./ai-workflow prompt

# Edit saved prompt
./ai-workflow prompt edit

# Re-analyze prompt
./ai-workflow analyze .ai-workflow/initial-prompt.md
```

## 🚀 Quick Start Examples

### Example 1: Core Only
```bash
# Install with core only
./install-modular.sh
# Select: N (None/Core only)

# Analyze project
./ai-workflow analyze

# Manual planning
./ai-workflow init
```

### Example 2: With Claude Code
```bash
# Install with Claude Code
./install-modular.sh
# Select: 1 (Toggle Claude Code)

# Use recovery mode for incomplete project
./ai-workflow recover analyze
./ai-workflow recover execute
```

### Example 3: Full Power
```bash
# Install everything
./install-modular.sh
# Select: A (All)

# Enter large prompt during installation
# Then execute automatically
./ai-workflow prompt
```

## 💡 Tips

1. **Start Small**: Install core first, add components as needed
2. **Save Prompts**: Enter detailed requirements during installation
3. **Check Logs**: Find detailed logs in `.ai-workflow/logs/`
4. **TMux Optional**: System works perfectly without TMux
5. **Mix & Match**: Any component combination works

## 🔍 Troubleshooting

### Component Not Working
```bash
# Check if component is installed
./ai-workflow components

# Check configuration
cat .ai-workflow/installation-config.json

# Re-run installer to add component
./install-modular.sh
```

### Process Management
```bash
# Without TMux: Check background processes
./ai-workflow status

# View process logs
ls -la .ai-workflow/logs/process-*.log
```

### Prompt Issues
```bash
# Check saved prompt
cat .ai-workflow/initial-prompt.md

# Re-enter prompt
./ai-workflow prompt edit
```

## 📈 Performance Considerations

- **Core Only**: Minimal resource usage
- **With Claude Code**: Requires Claude API access
- **With Claude Flow**: Network calls for multi-agent
- **With TMux**: Additional terminal sessions
- **All Components**: Full resource utilization

Choose components based on your system capabilities and project needs!