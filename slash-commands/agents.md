---
description: Manage and coordinate workflow agents
argument-hint: "[list|status|activate|test] [agent-name]"
allowed-tools: Read, Write, Task, Bash
---

# Workflow Agent Management

Manage the six specialized workflow agents that power the Intelligent Workflow Decision System.

## Available Agents
1. **workflow-orchestrator** - Master coordinator
2. **complexity-analyzer-agent** - Project analysis specialist
3. **approach-selector-agent** - Approach selection expert
4. **document-customizer-agent** - Documentation generator
5. **sparc-methodology-agent** - SPARC phase manager
6. **integration-coordinator-agent** - System integration specialist

## Commands
- `/agents list` - List all available workflow agents
- `/agents status` - Check status of all agents
- `/agents activate [name]` - Activate specific agent
- `/agents test [name]` - Test agent functionality
- `/agents info [name]` - Show detailed agent information

## Agent Activation by Complexity
- **0-30**: workflow-orchestrator only
- **31-50**: + complexity-analyzer, approach-selector
- **51-70**: + document-customizer, integration-coordinator
- **71-100**: + sparc-methodology-agent (all agents)

## Inter-Agent Communication
Agents communicate through structured YAML messages:
```yaml
FROM: workflow-orchestrator
TO: complexity-analyzer-agent
TYPE: Analysis Request
PAYLOAD: {project_path, depth}
```

## Agent Responsibilities
Each agent has specific responsibilities:
- **Orchestrator**: Coordinates all operations
- **Analyzer**: Evaluates project complexity
- **Selector**: Chooses optimal approach
- **Customizer**: Generates documentation
- **SPARC Manager**: Handles enterprise methodology
- **Integrator**: Manages external systems

Use workflow-orchestrator to coordinate agent activities and monitor their status.