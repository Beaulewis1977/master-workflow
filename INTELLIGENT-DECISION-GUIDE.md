# Intelligent Workflow Decision System - Implementation Guide

## Overview
The Intelligent Workflow Decision System provides automated project analysis and optimal Claude Flow approach selection for the AI Development OS. It analyzes project complexity, detects development stage, and recommends the best AI coordination approach.

## Core Components

### 1. Complexity Analyzer (`intelligence-engine/complexity-analyzer.js`)
Analyzes projects across multiple dimensions:
- **Project Size**: File count and code volume
- **Dependencies**: Package complexity and ecosystem
- **Architecture**: Monolith vs microservices, frontend/backend separation
- **Technology Stack**: Languages, frameworks, databases detected
- **Features**: Authentication, real-time, API, deployment infrastructure
- **Team Indicators**: Documentation, CI/CD, contribution guidelines
- **Testing**: Test coverage and testing frameworks

**Complexity Score**: 0-100 scale
- 0-30: Simple projects → Simple Swarm
- 31-70: Medium complexity → Hive-Mind
- 71-100: Complex projects → Hive-Mind + SPARC

### 2. Approach Selector (`intelligence-engine/approach-selector.js`)
Maps complexity analysis to optimal Claude Flow approach:
- **Simple Swarm**: Quick single-agent coordination for straightforward tasks
- **Hive-Mind**: Multi-agent coordination for medium complexity projects
- **Hive-Mind + SPARC**: Enterprise methodology for complex systematic development

### 3. User Choice Handler (`intelligence-engine/user-choice-handler.sh`)
Interactive interface providing:
- **Automatic Mode**: AI selects optimal approach
- **Interactive Mode**: User sees analysis and chooses
- **Manual Override**: Force specific approach with warnings
- **Analysis Mode**: View recommendations without executing

## Project Lifecycle Stages

### Stage Detection
The system identifies four project stages:

1. **Idea Stage** (Documentation only)
   - No code files present
   - Planning documents (README, requirements)
   - Generates foundational documentation

2. **Early Stage** (Basic structure)
   - Minimal code (<50 files)
   - Basic project structure
   - No or minimal tests

3. **Active Stage** (Substantial development)
   - Significant codebase (50+ files)
   - Tests present
   - Established patterns

4. **Mature Stage** (Production-ready)
   - Deployment configuration
   - CI/CD pipelines
   - Comprehensive testing
   - Monitoring setup

## Usage

### Installation
```bash
# Run the enhanced installer
./install-ai-dev-os.sh

# The intelligence engine is automatically installed
# Located at: ~/.ai-dev-os/intelligence-engine/
```

### Command Line Interface

#### Automatic Mode (AI Decides)
```bash
# Let AI analyze and choose optimal approach
ai-dev init --auto "Build REST API with authentication"

# Smart initialization with automatic selection
ai-dev init --smart
```

#### Interactive Mode (User Chooses)
```bash
# Default mode - shows analysis and options
ai-dev init --interactive

# Or simply
ai-dev init
```

#### Manual Override
```bash
# Force specific approaches
ai-dev init --swarm   # Force Simple Swarm
ai-dev init --hive    # Force Hive-Mind
ai-dev init --sparc   # Force Hive-Mind + SPARC
```

#### Analysis Only
```bash
# Analyze project without initialization
ai-dev analyze

# Get recommendations without setup
ai-dev init --analyze-only
```

## Approach Details

### Simple Swarm
- **Command**: `npx claude-flow@alpha swarm`
- **Best For**: Single features, bug fixes, prototypes
- **Time**: 5-30 minutes
- **Agents**: 1
- **Complexity**: 0-30

### Hive-Mind
- **Command**: `npx claude-flow@alpha hive-mind spawn --agents [4-6] --claude`
- **Best For**: Multi-feature development, fullstack applications
- **Time**: 30 minutes - 4 hours
- **Agents**: 4-6
- **Complexity**: 31-70

### Hive-Mind + SPARC
- **Command**: `npx claude-flow@alpha hive-mind spawn --agents [8-12] --claude`
- **Best For**: Enterprise applications, systematic development
- **Time**: 4+ hours
- **Agents**: 8-12
- **Complexity**: 71-100
- **SPARC Phases**:
  - Specification
  - Pseudocode
  - Architecture
  - Refinement
  - Completion

## Configuration

### User Preferences
The system learns from user choices and stores preferences:
```
~/.ai-dev-os/user-preferences.json
```

### Project Configuration
After initialization, approach selection is saved:
```
.ai-dev/approach-selection.json
```

## Integration Points

### With Claude Code
- Enhanced CLAUDE.md with project context
- Approach-specific instructions
- Intelligent sub-agent coordination

### With Agent OS
- Stage-appropriate planning templates
- Complexity-aware specifications
- Adaptive documentation generation

### With Claude Flow
- Proper command generation
- Agent count optimization
- SPARC methodology integration

### With Tmux Orchestrator
- Session configuration based on approach
- Window layout optimization
- Resource allocation

## Troubleshooting

### Common Issues

1. **Analysis Fails**
   - Ensure Node.js v18+ installed
   - Check project has readable files
   - Verify not in system directory

2. **Wrong Approach Selected**
   - Use manual override
   - Update user preferences
   - Check complexity factors

3. **Command Generation Issues**
   - Verify Claude Flow installed
   - Check npx availability
   - Ensure proper npm configuration

## Testing

Run the test suite:
```bash
# Full test suite (requires jq)
./test/test-intelligent-system.sh

# Basic Node.js tests
node ./test/test-basic.js
```

## Architecture

```
intelligence-engine/
├── complexity-analyzer.js    # Project analysis
├── approach-selector.js      # Approach mapping
└── user-choice-handler.sh    # User interface

bin/
├── ai-dev-init-enhanced      # Enhanced initializer
└── ai-dev-init               # Wrapper script

test/
├── test-intelligent-system.sh # Full test suite
└── test-basic.js             # Basic tests
```

## Future Enhancements

1. **Machine Learning Integration**
   - Learn from project outcomes
   - Improve recommendations over time

2. **Custom Approach Definitions**
   - User-defined complexity mappings
   - Project-specific approaches

3. **Team Collaboration**
   - Shared preference profiles
   - Team-wide standards

4. **Performance Metrics**
   - Track approach effectiveness
   - Measure development velocity

## Migration from Standard System

For existing installations:
1. Pull latest MASTER-WORKFLOW
2. Re-run `install-ai-dev-os.sh`
3. Intelligence engine auto-installs
4. Use `ai-dev init --interactive` for existing projects

## Support

- Check installation: `ai-dev status`
- View analysis: `ai-dev analyze`
- Test system: `node test/test-basic.js`
- Report issues: Create issue in repository