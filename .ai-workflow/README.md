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
