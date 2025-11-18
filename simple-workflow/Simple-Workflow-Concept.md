# Simple Workflow System
## JSON-Driven AI Development Without Complexity

### Executive Summary

The Simple Workflow System provides a streamlined alternative to the full 4-system integration. It uses **JSON configuration files** and **prompt templates** to orchestrate Claude Code, Agent OS, and Claude-Flow without requiring Tmux or 24/7 operation.

**Key Benefits:**
- ✅ No complex setup required
- ✅ JSON-based configuration (easy to modify)
- ✅ Template-driven workflows
- ✅ Sequential or parallel execution
- ✅ Perfect for single-session development
- ✅ Version control friendly

---

## Core Concept

### Traditional 4-System Approach
```
Tmux-Orchestrator → Claude Code → Agent OS → Claude-Flow → Sub-Agents
(Complex, 24/7, Autonomous)
```

### Simple Workflow Approach
```
JSON Workflow → Script Runner → Claude Code + Agent OS + Claude-Flow
(Simple, On-demand, Controlled)
```

---

## How It Works

### 1. Workflow Definition (JSON)
Define your entire development workflow in a simple JSON file:

```json
{
  "workflow": "create-api",
  "version": "1.0",
  "description": "Build a REST API with authentication",
  "steps": [
    {
      "id": "plan",
      "type": "agent-os",
      "command": "plan-product",
      "prompt": "Create a REST API with JWT authentication..."
    },
    {
      "id": "implement",
      "type": "claude-flow",
      "mode": "swarm",
      "prompt": "Implement the API based on the specifications"
    },
    {
      "id": "test",
      "type": "sub-agent",
      "agent": "test-engineer",
      "prompt": "Create comprehensive tests for the API"
    }
  ]
}
```

### 2. Execution Script
A simple script reads the JSON and executes each step:

```bash
./run-workflow.sh workflows/create-api.json
```

### 3. Interactive or Automated
- **Interactive Mode**: Prompts for confirmation at each step
- **Auto Mode**: Runs through entire workflow automatically
- **Checkpoint Mode**: Save progress and resume later

---

## Architecture Comparison

### Full 4-System Stack
- **Pros**: 24/7 operation, fully autonomous, complex coordination
- **Cons**: Complex setup, resource intensive, learning curve
- **Best For**: Large projects, continuous development, teams

### Simple Workflow System
- **Pros**: Easy setup, transparent process, version controlled
- **Cons**: No 24/7 operation, manual triggering, sequential by default
- **Best For**: Individual developers, specific tasks, learning

---

## Workflow Components

### 1. **Workflow Files** (`workflows/*.json`)
Pre-defined development workflows for common tasks

### 2. **Templates** (`templates/*.json`)
Reusable prompt templates and configurations

### 3. **Runner Script** (`run-workflow.sh`)
Executes workflows step by step

### 4. **Config File** (`config.json`)
System settings and API configurations

---

## Use Cases

### Use Case 1: API Development
**Scenario**: Build a complete REST API in one session

```json
{
  "workflow": "rest-api",
  "steps": [
    {
      "type": "agent-os",
      "action": "plan",
      "output": "specs/api.md"
    },
    {
      "type": "claude-flow",
      "action": "implement",
      "input": "specs/api.md"
    },
    {
      "type": "sub-agent",
      "agent": "test-engineer",
      "action": "test"
    }
  ]
}
```

### Use Case 2: Feature Addition
**Scenario**: Add a new feature to existing project

```json
{
  "workflow": "add-feature",
  "steps": [
    {
      "type": "claude",
      "prompt": "Analyze existing code structure"
    },
    {
      "type": "agent-os",
      "command": "create-spec",
      "feature": "user-notifications"
    },
    {
      "type": "claude-flow",
      "mode": "swarm",
      "task": "implement-notifications"
    }
  ]
}
```

### Use Case 3: Code Refactoring
**Scenario**: Refactor legacy code systematically

```json
{
  "workflow": "refactor",
  "steps": [
    {
      "type": "agent-os",
      "command": "analyze-product"
    },
    {
      "type": "claude",
      "prompt": "Identify refactoring opportunities"
    },
    {
      "type": "claude-flow",
      "mode": "hive-mind",
      "task": "refactor-incrementally"
    }
  ]
}
```

### Use Case 4: Bug Fix Workflow
**Scenario**: Systematic bug fixing process

```json
{
  "workflow": "bug-fix",
  "steps": [
    {
      "type": "claude",
      "prompt": "Locate and analyze bug: {{bug_description}}"
    },
    {
      "type": "sub-agent",
      "agent": "debugger",
      "action": "investigate"
    },
    {
      "type": "claude",
      "prompt": "Implement fix"
    },
    {
      "type": "sub-agent",
      "agent": "test-engineer",
      "action": "verify-fix"
    }
  ]
}
```

---

## Workflow Types

### 1. **Sequential Workflows**
Steps execute one after another
```json
{
  "execution": "sequential",
  "steps": [...]
}
```

### 2. **Parallel Workflows**
Multiple steps run simultaneously
```json
{
  "execution": "parallel",
  "groups": [
    {
      "name": "frontend",
      "steps": [...]
    },
    {
      "name": "backend",
      "steps": [...]
    }
  ]
}
```

### 3. **Conditional Workflows**
Steps execute based on conditions
```json
{
  "steps": [
    {
      "id": "check",
      "type": "claude",
      "prompt": "Check if tests exist"
    },
    {
      "id": "create-tests",
      "type": "sub-agent",
      "condition": "check.result == 'no-tests'",
      "agent": "test-engineer"
    }
  ]
}
```

### 4. **Template-Based Workflows**
Reusable workflow templates
```json
{
  "extends": "templates/crud-api.json",
  "variables": {
    "entity": "user",
    "database": "postgresql"
  }
}
```

---

## Advantages Over Complex Systems

### 1. **Simplicity**
- No Tmux knowledge required
- No complex orchestration
- Clear, readable JSON configs

### 2. **Transparency**
- See exactly what will happen
- Step-by-step execution
- Easy debugging

### 3. **Version Control**
- JSON files are git-friendly
- Track workflow changes
- Share workflows with team

### 4. **Customization**
- Easy to modify workflows
- Create custom templates
- Mix and match components

### 5. **Resource Efficiency**
- Only runs when needed
- No background processes
- Lower API costs

---

## When to Use Simple Workflows

### ✅ Perfect For:
- **Individual developers** working on specific tasks
- **Learning** the AI development systems
- **Prototyping** and experiments
- **Single-session** development tasks
- **Predictable, repeatable** processes
- **CI/CD integration** (JSON-driven automation)

### ❌ Not Ideal For:
- **24/7 autonomous** development
- **Complex multi-day** projects
- **Real-time coordination** across teams
- **Highly dynamic** workflows

---

## Integration with Existing Tools

### Git Integration
```bash
# Version control your workflows
git add workflows/
git commit -m "Add API development workflow"
git push
```

### CI/CD Integration
```yaml
# GitHub Actions example
- name: Run AI Workflow
  run: |
    ./run-workflow.sh workflows/test-suite.json
```

### IDE Integration
```json
// VS Code task
{
  "label": "AI: Create Feature",
  "type": "shell",
  "command": "./run-workflow.sh",
  "args": ["workflows/add-feature.json"]
}
```

---

## Workflow Library

### Pre-built Workflows Included:
1. **create-web-app.json** - Full web application
2. **create-api.json** - REST API with auth
3. **add-feature.json** - Add feature to existing project
4. **fix-bug.json** - Bug fixing workflow
5. **refactor-code.json** - Code refactoring
6. **create-tests.json** - Test generation
7. **deploy-app.json** - Deployment setup
8. **optimize-performance.json** - Performance optimization
9. **security-audit.json** - Security review
10. **documentation.json** - Generate documentation

---

## Migration Path

### Starting Simple → Growing Complex

1. **Start**: Use simple workflows for individual tasks
2. **Learn**: Understand how systems work together
3. **Customize**: Create your own workflow JSONs
4. **Scale**: Add parallel execution as needed
5. **Upgrade**: Move to full 4-system when ready

```
Simple Workflows → Parallel Workflows → Tmux Orchestration → 24/7 Autonomous
```

---

## Examples

### Example 1: Morning Routine Workflow
```json
{
  "workflow": "morning-routine",
  "description": "Start the day with code review and planning",
  "steps": [
    {
      "name": "Review Yesterday's Work",
      "type": "claude",
      "prompt": "Review commits from yesterday and summarize changes"
    },
    {
      "name": "Check Issues",
      "type": "claude",
      "prompt": "Check GitHub issues and prioritize"
    },
    {
      "name": "Plan Today",
      "type": "agent-os",
      "command": "plan-product",
      "prompt": "Plan today's development tasks based on priorities"
    }
  ]
}
```

### Example 2: End-to-End Feature Workflow
```json
{
  "workflow": "complete-feature",
  "variables": {
    "feature_name": "user-authentication"
  },
  "steps": [
    {
      "name": "Specification",
      "type": "agent-os",
      "command": "create-spec",
      "prompt": "Create spec for {{feature_name}}"
    },
    {
      "name": "Implementation",
      "type": "claude-flow",
      "mode": "hive-mind",
      "prompt": "Implement {{feature_name}} based on specifications"
    },
    {
      "name": "Testing",
      "type": "sub-agent",
      "agent": "test-engineer",
      "prompt": "Create tests for {{feature_name}}"
    },
    {
      "name": "Documentation",
      "type": "claude",
      "prompt": "Document {{feature_name}} implementation"
    },
    {
      "name": "Review",
      "type": "sub-agent",
      "agent": "code-reviewer",
      "prompt": "Review {{feature_name}} for quality and security"
    }
  ]
}
```

---

## Conclusion

The Simple Workflow System provides a **practical, accessible alternative** to complex AI orchestration. It maintains the power of three core systems (Claude Code, Agent OS, Claude-Flow) while removing the complexity of 24/7 orchestration.

**Key Takeaway**: Start simple, scale when needed. JSON workflows give you control, transparency, and flexibility without the overhead of complex systems.

---

*Simple Workflow System - AI Development Made Accessible*