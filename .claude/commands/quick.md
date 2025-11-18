---
description: Quick workflow execution with smart defaults
argument-hint: "[task description]"
allowed-tools: Read, Write, Edit, Bash, Task, TodoWrite
---

# Quick Workflow Execution

Instantly start a workflow with intelligent defaults based on quick analysis.

## What This Does
1. Performs rapid complexity assessment
2. Auto-selects appropriate approach
3. Generates minimal necessary configuration
4. Starts execution immediately
5. No user interaction required

## Usage
- `/quick "Fix authentication bug"` - Simple task, likely Swarm
- `/quick "Build REST API with database"` - Medium task, likely Hive-Mind
- `/quick "Migrate monolith to microservices"` - Complex task, likely SPARC

## Smart Defaults
- Automatically detects project type
- Uses CLAUDE_FLOW_VERSION or defaults to @alpha
- Selects optimal agent count
- Configures appropriate TMux sessions
- Generates essential documentation only

## Examples
```bash
# Quick bug fix
/quick "Fix login validation error"
# → Executes: npx claude-flow@alpha swarm "Fix login validation error"

# Quick feature addition
/quick "Add user profile page with edit functionality"
# → Executes: npx claude-flow@alpha hive-mind spawn "project" --agents 4 --claude

# Quick refactoring
/quick "Refactor database layer to use connection pooling"
# → Analyzes complexity and selects appropriate approach
```

## Auto-Detection Features
- Language detection from file extensions
- Framework detection from dependencies
- Architecture inference from directory structure
- Team size estimation from git history
- Deployment complexity from config files

## Speed Optimizations
- Cached analysis results (5 minute TTL)
- Parallel agent initialization
- Lazy documentation generation
- Progressive enhancement
- Skip optional validations

This command prioritizes speed over comprehensiveness. For detailed analysis and full documentation, use `/workflow init` instead.