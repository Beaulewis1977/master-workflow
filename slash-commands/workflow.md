---
description: Initialize and manage the Intelligent Workflow Decision System
argument-hint: "[init|analyze|status|help] [options]"
allowed-tools: Read, Write, Edit, Bash, Task, TodoWrite, Grep, Glob
---

# Intelligent Workflow Command

Execute the Intelligent Workflow Decision System to analyze project complexity and set up the optimal Claude Flow approach.

## Usage
- `/workflow init` - Initialize workflow with interactive mode
- `/workflow init --auto` - Let AI select the best approach automatically
- `/workflow init --swarm` - Force Simple Swarm approach
- `/workflow init --hive` - Force Hive-Mind approach
- `/workflow init --sparc` - Force SPARC methodology
- `/workflow analyze` - Analyze project complexity without setup
- `/workflow status` - Check current workflow status
- `/workflow help` - Show detailed help

## Arguments
- `$ARGUMENTS` will be passed to the workflow system

## Workflow Process
1. Use the workflow-orchestrator agent to coordinate the entire process
2. Trigger complexity-analyzer-agent to evaluate the project
3. Invoke approach-selector-agent to choose optimal approach
4. Generate documentation with document-customizer-agent
5. Set up integrations with integration-coordinator-agent
6. If SPARC is selected, activate sparc-methodology-agent

## Environment Variables
- `CLAUDE_FLOW_VERSION`: Specify Claude Flow version (alpha|beta|latest|2.0|stable|dev)
- `AI_WORKFLOW_MODE`: Set default mode (auto|interactive|manual)

## Examples
```bash
# Automatic selection for current project
/workflow init --auto "Build a REST API with authentication"

# Force SPARC for enterprise project
CLAUDE_FLOW_VERSION=stable /workflow init --sparc

# Just analyze without setup
/workflow analyze
```

## Integration
This command integrates with:
- Claude Flow 2.0 (all versions)
- Agent-OS for specification-driven planning
- TMux Orchestrator for session management
- All workflow-specific sub-agents