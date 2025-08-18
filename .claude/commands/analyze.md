---
description: Quickly analyze project complexity across 8 dimensions
argument-hint: "[path] [--detailed]"
allowed-tools: Read, Grep, Glob, LS, Bash
---

# Project Complexity Analysis

Perform deep analysis of any project to determine complexity score (0-100) and project stage.

## What This Analyzes
1. **Size**: File count, lines of code, directory structure
2. **Dependencies**: Package managers, external libraries
3. **Architecture**: Monolith, microservices, distributed
4. **Tech Stack**: Languages, frameworks, databases
5. **Features**: Auth, realtime, API, testing
6. **Team**: Contributors, collaboration indicators
7. **Deployment**: Docker, Kubernetes, cloud platforms
8. **Testing**: Coverage, test types, quality metrics

## Usage
- `/analyze` - Analyze current directory
- `/analyze /path/to/project` - Analyze specific path
- `/analyze --detailed` - Show detailed breakdown

## Output Format
```yaml
Score: 65/100
Stage: active
Recommendation: Hive-Mind approach
Languages: [JavaScript, TypeScript]
Frameworks: [React, Express]
Complexity Factors:
  - Size: 45/100
  - Dependencies: 60/100
  - Architecture: 70/100
  ...
```

## Decision Mapping
- **0-30**: Simple Swarm (single agent, quick tasks)
- **31-70**: Hive-Mind (multi-agent coordination)
- **71-100**: SPARC (enterprise methodology)

Use complexity-analyzer-agent to perform the analysis and provide recommendations.