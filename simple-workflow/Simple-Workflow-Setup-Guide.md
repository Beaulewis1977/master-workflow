# Simple Workflow Setup & User Guide
## Get Started in 5 Minutes - No Complex Setup Required!

---

## Quick Start

### 1. Basic Setup (2 minutes)
```bash
# Navigate to simple-workflow directory
cd ~/simple-workflow

# Make the runner executable
chmod +x scripts/run-workflow.sh

# Run your first workflow
./scripts/run-workflow.sh workflows/hello-world.json
```

That's it! You're ready to use Simple Workflows.

---

## Installation

### Prerequisites
You need the 3 core systems installed (no Tmux required):
1. **Claude Code** - Already installed if you're reading this
2. **Agent OS** - For planning and specifications  
3. **Claude-Flow** - For multi-agent coordination

If not installed, run:
```bash
# Quick install (without Tmux)
npm install -g @anthropic-ai/claude-code
curl -fsSL https://raw.githubusercontent.com/buildermethods/agent-os/main/setup.sh | bash
npx claude-flow@alpha init --force
```

### Setting Up Simple Workflow

#### Step 1: Create Configuration
```bash
# Create your config file
cp config.example.json config.json

# Edit with your settings
nano config.json
```

#### Step 2: Set Permissions
```bash
# Make scripts executable
chmod +x scripts/*.sh
```

#### Step 3: Test Installation
```bash
# Run test workflow
./scripts/run-workflow.sh workflows/test.json
```

---

## Configuration Files

### Main Configuration (`config.json`)
```json
{
  "version": "1.0",
  "settings": {
    "interactive": true,
    "auto_confirm": false,
    "verbose": true,
    "save_outputs": true,
    "output_dir": "./outputs"
  },
  "systems": {
    "claude": {
      "enabled": true,
      "api_key_env": "ANTHROPIC_API_KEY"
    },
    "agent_os": {
      "enabled": true,
      "commands_path": "~/.claude/commands"
    },
    "claude_flow": {
      "enabled": true,
      "command": "npx claude-flow@alpha"
    }
  },
  "defaults": {
    "timeout": 300,
    "retry_attempts": 3,
    "checkpoint_enabled": true
  }
}
```

### Workflow Structure (`workflows/*.json`)
```json
{
  "workflow": "workflow-name",
  "version": "1.0",
  "description": "What this workflow does",
  "author": "Your Name",
  "created": "2024-01-01",
  
  "variables": {
    "project_name": "my-app",
    "language": "javascript"
  },
  
  "steps": [
    {
      "id": "step1",
      "name": "Step Name",
      "type": "claude|agent-os|claude-flow|sub-agent",
      "action": "specific-action",
      "prompt": "What to do",
      "options": {
        "timeout": 60,
        "retry": true
      }
    }
  ],
  
  "on_success": "Success message",
  "on_failure": "Failure message"
}
```

---

## Using Simple Workflows

### Basic Usage

#### Running a Workflow
```bash
# Basic run
./scripts/run-workflow.sh workflows/create-api.json

# With variables
./scripts/run-workflow.sh workflows/create-api.json --var project_name=my-api

# Non-interactive mode
./scripts/run-workflow.sh workflows/create-api.json --auto

# Verbose output
./scripts/run-workflow.sh workflows/create-api.json --verbose
```

#### Available Commands
```bash
# List all workflows
./scripts/list-workflows.sh

# Validate a workflow
./scripts/validate-workflow.sh workflows/my-workflow.json

# Create new workflow from template
./scripts/new-workflow.sh my-workflow

# Run with checkpoint/resume
./scripts/run-workflow.sh workflows/long-task.json --checkpoint
```

### Interactive Mode Features

When running interactively, you can:
- **Review** each step before execution
- **Edit** prompts on the fly
- **Skip** steps if needed
- **Retry** failed steps
- **Save** progress and resume later

### Command Line Options

```bash
./scripts/run-workflow.sh [workflow] [options]

Options:
  --auto              Run without prompts
  --verbose           Show detailed output
  --dry-run          Show what would run without executing
  --checkpoint       Enable save/resume
  --from-step <id>   Start from specific step
  --only-step <id>   Run only specific step
  --var <key=value>  Set workflow variables
  --output <dir>     Output directory
  --config <file>    Use custom config
  --help            Show help
```

---

## Creating Custom Workflows

### Step-by-Step Workflow Creation

#### 1. Start with a Template
```bash
# Create from template
./scripts/new-workflow.sh my-feature

# This creates: workflows/my-feature.json
```

#### 2. Edit Your Workflow
```json
{
  "workflow": "add-auth-feature",
  "description": "Add authentication to application",
  
  "variables": {
    "auth_type": "jwt",
    "database": "postgresql"
  },
  
  "steps": [
    {
      "id": "analyze",
      "name": "Analyze Current Code",
      "type": "claude",
      "prompt": "Analyze the current codebase and identify where to add authentication"
    },
    {
      "id": "spec",
      "name": "Create Specification",
      "type": "agent-os",
      "command": "create-spec",
      "prompt": "Create specification for {{auth_type}} authentication with {{database}}"
    },
    {
      "id": "implement",
      "name": "Implement Authentication",
      "type": "claude-flow",
      "mode": "swarm",
      "prompt": "Implement authentication based on the specification"
    },
    {
      "id": "test",
      "name": "Create Tests",
      "type": "sub-agent",
      "agent": "test-engineer",
      "prompt": "Create comprehensive tests for authentication"
    }
  ]
}
```

#### 3. Test Your Workflow
```bash
# Dry run first
./scripts/run-workflow.sh workflows/add-auth-feature.json --dry-run

# Then run for real
./scripts/run-workflow.sh workflows/add-auth-feature.json
```

### Using Variables

Variables make workflows reusable:

```json
{
  "variables": {
    "feature": "payment-processing",
    "framework": "express",
    "database": "mongodb"
  },
  
  "steps": [
    {
      "prompt": "Implement {{feature}} using {{framework}} with {{database}}"
    }
  ]
}
```

Run with custom variables:
```bash
./scripts/run-workflow.sh workflow.json \
  --var feature=user-management \
  --var framework=fastify \
  --var database=postgresql
```

### Conditional Steps

```json
{
  "steps": [
    {
      "id": "check-tests",
      "type": "claude",
      "prompt": "Check if tests exist",
      "capture_output": "has_tests"
    },
    {
      "id": "create-tests",
      "type": "sub-agent",
      "condition": "has_tests == false",
      "agent": "test-engineer",
      "prompt": "Create unit tests"
    }
  ]
}
```

### Parallel Execution

```json
{
  "execution": "parallel",
  "groups": [
    {
      "name": "frontend",
      "steps": [
        {"type": "claude", "prompt": "Build React components"}
      ]
    },
    {
      "name": "backend",
      "steps": [
        {"type": "claude", "prompt": "Build API endpoints"}
      ]
    }
  ]
}
```

---

## Included Workflow Templates

### 1. Web Application (`workflows/create-web-app.json`)
Complete web app with frontend and backend

### 2. REST API (`workflows/create-api.json`)
RESTful API with authentication and database

### 3. Add Feature (`workflows/add-feature.json`)
Add new feature to existing project

### 4. Bug Fix (`workflows/fix-bug.json`)
Systematic bug fixing process

### 5. Refactor Code (`workflows/refactor.json`)
Code refactoring workflow

### 6. Create Tests (`workflows/create-tests.json`)
Comprehensive test generation

### 7. Deploy Setup (`workflows/deploy.json`)
Deployment configuration

### 8. Security Audit (`workflows/security-audit.json`)
Security review process

### 9. Performance Optimization (`workflows/optimize.json`)
Performance improvement workflow

### 10. Documentation (`workflows/documentation.json`)
Generate project documentation

---

## Practical Examples

### Example 1: Morning Development Session
```bash
# Start your day with planning
./scripts/run-workflow.sh workflows/morning-routine.json

# Work on a feature
./scripts/run-workflow.sh workflows/add-feature.json \
  --var feature="user-notifications"

# End with testing
./scripts/run-workflow.sh workflows/create-tests.json
```

### Example 2: Quick Bug Fix
```bash
# Run bug fix workflow with description
./scripts/run-workflow.sh workflows/fix-bug.json \
  --var bug_description="Users cannot upload files larger than 2MB"
```

### Example 3: Building a New Project
```bash
# Full project creation
./scripts/run-workflow.sh workflows/create-web-app.json \
  --var project_name="social-media-app" \
  --var framework="nextjs" \
  --var database="postgresql"
```

### Example 4: Checkpoint and Resume
```bash
# Start long workflow with checkpoints
./scripts/run-workflow.sh workflows/complex-project.json --checkpoint

# If interrupted, resume from last checkpoint
./scripts/run-workflow.sh --resume last

# Or resume specific checkpoint
./scripts/run-workflow.sh --resume checkpoint-2024-01-15-1030
```

---

## The Workflow Runner Script

### Core Script (`scripts/run-workflow.sh`)
```bash
#!/bin/bash

# Simple Workflow Runner
# Executes JSON workflows step by step

WORKFLOW_FILE=$1
shift
ARGS=$@

# Functions for each system
run_claude() {
  local prompt=$1
  echo "$prompt" | claude
}

run_agent_os() {
  local command=$1
  local prompt=$2
  echo "$prompt" | claude /$command
}

run_claude_flow() {
  local mode=$1
  local prompt=$2
  npx claude-flow@alpha $mode "$prompt"
}

run_sub_agent() {
  local agent=$1
  local prompt=$2
  echo "$prompt" | claude "@$agent:"
}

# Main execution loop
execute_workflow() {
  # Parse JSON and execute each step
  # (Full implementation in actual script)
}

# Run the workflow
execute_workflow "$WORKFLOW_FILE" $ARGS
```

---

## Tips and Best Practices

### 1. Start Simple
Begin with basic sequential workflows before trying parallel or conditional

### 2. Use Templates
Modify existing templates rather than starting from scratch

### 3. Test with Dry Run
Always use `--dry-run` first to see what will happen

### 4. Version Control Your Workflows
```bash
git add workflows/
git commit -m "Add customer portal workflow"
```

### 5. Share Workflows
Workflows are just JSON - share them with your team!

### 6. Use Variables
Make workflows reusable with variables instead of hardcoding

### 7. Checkpoint Long Workflows
Enable checkpoints for workflows that take more than 10 minutes

### 8. Monitor Costs
Use `--verbose` to see API calls and estimate costs

---

## Troubleshooting

### Common Issues

**"Workflow not found"**
- Check file exists: `ls workflows/`
- Check path: use relative or absolute path

**"Step failed"**
- Check the error message
- Try running just that step: `--only-step step-id`
- Increase timeout in config

**"Variable not defined"**
- Provide with `--var name=value`
- Or add to workflow's variables section

**"System not available"**
- Check config.json
- Ensure system is installed
- Run validation: `./scripts/validate-workflow.sh`

### Debug Mode
```bash
# Enable debug output
export DEBUG=true
./scripts/run-workflow.sh workflow.json

# Check logs
tail -f logs/workflow.log
```

---

## Comparison: Simple vs Full System

| Feature | Simple Workflow | Full 4-System |
|---------|----------------|---------------|
| Setup Time | 5 minutes | 30+ minutes |
| Complexity | Low | High |
| 24/7 Operation | No | Yes |
| Customization | Easy (JSON) | Complex |
| Resource Usage | Low | High |
| Cost | Lower | Higher |
| Best For | Tasks | Projects |

---

## Upgrading to Full System

When you're ready for more:

1. **Keep your workflows** - They still work!
2. **Add Tmux** - For 24/7 operation
3. **Enable orchestration** - For autonomous work
4. **Gradual migration** - No need to change everything

```bash
# Your simple workflows remain valid
# Just add orchestration when needed
ai-dev orchestrate --workflow workflows/my-workflow.json
```

---

## Quick Reference

### Commands
```bash
./scripts/run-workflow.sh [workflow] [options]    # Run workflow
./scripts/list-workflows.sh                       # List available
./scripts/new-workflow.sh [name]                  # Create new
./scripts/validate-workflow.sh [workflow]         # Validate JSON
```

### Options
```bash
--auto              # No prompts
--verbose          # Detailed output
--dry-run          # Preview only
--checkpoint       # Save progress
--var key=value    # Set variables
```

### Workflow Types
- `claude` - Direct Claude Code execution
- `agent-os` - Planning and specifications
- `claude-flow` - Multi-agent coordination
- `sub-agent` - Specialized agents

---

## Getting Started Checklist

- [ ] Install prerequisites (Claude Code, Agent OS, Claude-Flow)
- [ ] Copy `config.example.json` to `config.json`
- [ ] Make scripts executable
- [ ] Run test workflow
- [ ] Try hello-world workflow
- [ ] Create your first custom workflow
- [ ] Run with your project

---

## Support and Resources

- **Workflows Library**: `workflows/` directory
- **Templates**: `templates/` directory  
- **Examples**: See included workflows
- **Validation**: `./scripts/validate-workflow.sh`
- **Help**: `./scripts/run-workflow.sh --help`

---

*Simple Workflow System - AI Development Without Complexity*

Start simple, stay productive! 🚀