# Claude Flow 2.0 Usage Guide

This comprehensive guide covers all features and workflows available in Claude Flow 2.0, from basic commands to advanced orchestration techniques.

## Table of Contents

- [Getting Started](#getting-started)
- [Core Commands](#core-commands)
- [Web UI Dashboard](#web-ui-dashboard)
- [Agent Management](#agent-management)
- [MCP Server Integration](#mcp-server-integration)
- [Project Workflows](#project-workflows)
- [Configuration Management](#configuration-management)
- [Monitoring and Debugging](#monitoring-and-debugging)
- [Advanced Features](#advanced-features)
- [Best Practices](#best-practices)

## Getting Started

After installation, Claude Flow 2.0 provides a rich set of commands and features. Start by checking the system status:

```bash
npx claude-flow@2.0.0 status
```

### Basic Command Structure

All Claude Flow 2.0 commands follow this pattern:
```bash
npx claude-flow@2.0.0 [command] [options] [arguments]
```

### Help System

Get help for any command:
```bash
# General help
npx claude-flow@2.0.0 help

# Command-specific help
npx claude-flow@2.0.0 help [command]

# List all available commands
npx claude-flow@2.0.0 --help
```

## Core Commands

### System Management

#### `init` - Initialize Claude Flow 2.0
```bash
# Quick start with defaults
npx claude-flow@2.0.0 init --claude --webui

# Custom configuration
npx claude-flow@2.0.0 init --approach hive --agents 20 --webui

# Enterprise setup
npx claude-flow@2.0.0 init --approach sparc --agents 50 --claude --webui --experimental
```

**Options:**
- `--claude`: Enable Claude AI integration
- `--webui`: Start Web UI dashboard
- `--approach <type>`: Set orchestration approach (hive, sparc, swarm)
- `--agents <count>`: Number of agents to spawn (1-4462)
- `--experimental`: Enable experimental features
- `--port <port>`: Web UI port (default: 3000)
- `--offline`: Offline mode (no internet required)

#### `status` - Check System Status
```bash
# Basic status
npx claude-flow@2.0.0 status

# Detailed status
npx claude-flow@2.0.0 status --verbose

# JSON output
npx claude-flow@2.0.0 status --json
```

#### `stop` - Stop All Processes
```bash
# Graceful shutdown
npx claude-flow@2.0.0 stop

# Force stop
npx claude-flow@2.0.0 stop --force

# Stop specific component
npx claude-flow@2.0.0 stop --component webui
```

#### `restart` - Restart System
```bash
# Restart all components
npx claude-flow@2.0.0 restart

# Restart with new configuration
npx claude-flow@2.0.0 restart --agents 30

# Quick restart (skip initialization)
npx claude-flow@2.0.0 restart --quick
```

### Agent Management

#### `agents` - Manage Agents
```bash
# List active agents
npx claude-flow@2.0.0 agents list

# Show agent details
npx claude-flow@2.0.0 agents info [agent-id]

# Scale agents
npx claude-flow@2.0.0 agents scale 25

# Reset agents
npx claude-flow@2.0.0 agents reset
```

#### `spawn` - Create New Agents
```bash
# Spawn additional agents
npx claude-flow@2.0.0 spawn --count 10 --type code-analyzer

# Spawn with specific configuration
npx claude-flow@2.0.0 spawn --config ./agent-config.json

# Spawn for specific task
npx claude-flow@2.0.0 spawn --task "API development" --count 5
```

### MCP Server Management

#### `mcp` - MCP Server Operations
```bash
# List discovered servers
npx claude-flow@2.0.0 mcp list

# Refresh server discovery
npx claude-flow@2.0.0 mcp refresh

# Test server connectivity
npx claude-flow@2.0.0 mcp test [server-name]

# Install additional server
npx claude-flow@2.0.0 mcp install [server-name]

# Configure custom server
npx claude-flow@2.0.0 mcp add --name custom-api --url http://api.example.com
```

### Project Analysis

#### `analyze` - Analyze Current Project
```bash
# Basic analysis
npx claude-flow@2.0.0 analyze

# Deep analysis
npx claude-flow@2.0.0 analyze --deep

# Analysis with recommendations
npx claude-flow@2.0.0 analyze --recommendations

# Export analysis
npx claude-flow@2.0.0 analyze --export analysis-report.json
```

#### `build` - Build Project
```bash
# Standard build
npx claude-flow@2.0.0 build

# Build with optimization
npx claude-flow@2.0.0 build --optimize

# Build with specific agents
npx claude-flow@2.0.0 build --agents build-specialist,test-runner

# Watch mode
npx claude-flow@2.0.0 build --watch
```

### Testing and Validation

#### `test` - Run Tests
```bash
# Run all tests
npx claude-flow@2.0.0 test

# Run specific test suite
npx claude-flow@2.0.0 test --suite unit

# Run with coverage
npx claude-flow@2.0.0 test --coverage

# Continuous testing
npx claude-flow@2.0.0 test --watch
```

#### `validate` - Validate System
```bash
# Full system validation
npx claude-flow@2.0.0 validate

# Validate configuration
npx claude-flow@2.0.0 validate config

# Validate agents
npx claude-flow@2.0.0 validate agents

# Performance validation
npx claude-flow@2.0.0 validate performance
```

## Web UI Dashboard

The Web UI provides a comprehensive interface for monitoring and managing your Claude Flow 2.0 system.

### Accessing the Dashboard

Default URL: `http://localhost:3000`

```bash
# Start with custom port
npx claude-flow@2.0.0 init --webui --port 4000

# Access from external network
npx claude-flow@2.0.0 init --webui --host 0.0.0.0
```

### Dashboard Sections

#### 1. System Overview
- **Real-time Status**: System health and performance metrics
- **Agent Activity**: Live view of agent tasks and status
- **Resource Usage**: CPU, memory, and network utilization
- **Recent Activity**: Timeline of system events

#### 2. Agent Manager
- **Agent List**: All active agents with status and performance
- **Agent Details**: Individual agent information and logs
- **Task Queue**: Pending and executing tasks
- **Performance Metrics**: Agent-specific performance data

#### 3. MCP Server Monitor
- **Server Status**: Connection status for all MCP servers
- **Usage Statistics**: Request/response metrics
- **Server Configuration**: View and modify server settings
- **Connection Testing**: Test connectivity and performance

#### 4. Project Analysis
- **Codebase Insights**: Structure, complexity, and quality metrics
- **Technology Stack**: Detected languages, frameworks, and tools
- **Recommendations**: AI-powered improvement suggestions
- **Progress Tracking**: Development progress and milestones

#### 5. Logs and Debugging
- **System Logs**: Real-time log streaming with filtering
- **Agent Logs**: Individual agent log streams
- **Error Tracking**: Error detection and resolution suggestions
- **Performance Profiling**: Detailed performance analysis

### Web UI Features

#### Real-time Updates
The dashboard updates in real-time using WebSocket connections:
- Live agent status changes
- Real-time log streaming
- Performance metric updates
- Task completion notifications

#### Interactive Controls
- **Agent Control**: Start, stop, and configure agents
- **Task Management**: Queue, prioritize, and monitor tasks
- **Configuration**: Modify settings without restart
- **Emergency Controls**: Quick shutdown and recovery options

#### Customizable Views
- **Dashboard Layout**: Drag-and-drop widget arrangement
- **Filtering**: Advanced filtering for logs and metrics
- **Themes**: Light and dark mode support
- **Export**: Export data and reports in various formats

## Agent Management

### Agent Types

Claude Flow 2.0 includes specialized agents for different tasks:

#### Core Agents
- **Queen Controller**: Master orchestration agent
- **Code Analyzer**: Analyzes and understands codebases
- **Test Runner**: Executes and manages tests
- **Security Scanner**: Identifies security vulnerabilities
- **Documentation Generator**: Creates and maintains documentation

#### Specialized Agents
- **API Builder**: Develops APIs and integrations
- **Frontend Specialist**: React, Vue, Angular development
- **Backend Engineer**: Server-side development
- **Database Architect**: Database design and optimization
- **DevOps Engineer**: Deployment and infrastructure

#### Custom Agents
Create custom agents for specific needs:

```bash
# Generate custom agent template
npx claude-flow@2.0.0 agent create --name custom-agent --template base

# Configure custom agent
npx claude-flow@2.0.0 agent configure --name custom-agent --config ./custom-config.json

# Deploy custom agent
npx claude-flow@2.0.0 agent deploy --name custom-agent --count 3
```

### Agent Orchestration

#### Hierarchical Management
- **Queen Controller**: Top-level orchestration
- **Squad Leaders**: Manage groups of related agents
- **Worker Agents**: Execute specific tasks

#### Task Distribution
```bash
# Assign specific task to agent type
npx claude-flow@2.0.0 task assign --task "API development" --agent-type api-builder

# Load balance across agents
npx claude-flow@2.0.0 task distribute --task "code review" --agents 5

# Priority-based assignment
npx claude-flow@2.0.0 task assign --task "security scan" --priority high
```

#### Agent Communication
Agents communicate through:
- **Message Bus**: Real-time message passing
- **Shared Memory**: Common data storage
- **Event System**: Event-driven coordination
- **Task Queue**: Centralized task management

### Scaling Strategies

#### Auto-scaling
```bash
# Enable auto-scaling
npx claude-flow@2.0.0 config set agents.autoScale true

# Set scaling thresholds
npx claude-flow@2.0.0 config set agents.scaleUp.threshold 80
npx claude-flow@2.0.0 config set agents.scaleDown.threshold 20

# Set scaling limits
npx claude-flow@2.0.0 config set agents.minCount 5
npx claude-flow@2.0.0 config set agents.maxCount 100
```

#### Manual Scaling
```bash
# Scale up
npx claude-flow@2.0.0 agents scale 30

# Scale specific agent type
npx claude-flow@2.0.0 agents scale --type code-analyzer --count 10

# Scale down gracefully
npx claude-flow@2.0.0 agents scale 15 --graceful
```

## MCP Server Integration

### Understanding MCP Servers

MCP (Model Context Protocol) servers provide specialized capabilities to Claude Flow 2.0:

- **Database Servers**: PostgreSQL, MySQL, MongoDB, Redis
- **Cloud Services**: AWS, GCP, Azure, Vercel, Netlify
- **Development Tools**: Git, Docker, Kubernetes, CI/CD
- **APIs and Services**: REST APIs, GraphQL, WebSockets
- **File Systems**: Local and remote file operations

### Server Discovery

Claude Flow 2.0 automatically discovers available MCP servers:

```bash
# Manual discovery
npx claude-flow@2.0.0 mcp discover

# Discovery with specific categories
npx claude-flow@2.0.0 mcp discover --categories database,cloud

# Discovery from custom registry
npx claude-flow@2.0.0 mcp discover --registry https://custom-registry.com
```

### Server Configuration

#### Automatic Configuration
Most servers are configured automatically based on environment:

```bash
# Environment-based configuration
export DATABASE_URL="postgresql://user:pass@localhost:5432/db"
export AWS_REGION="us-east-1"
export DOCKER_HOST="unix:///var/run/docker.sock"

npx claude-flow@2.0.0 mcp refresh
```

#### Manual Configuration
```bash
# Add custom server
npx claude-flow@2.0.0 mcp add \
  --name company-api \
  --url https://api.company.com \
  --auth bearer:$API_TOKEN

# Configure server options
npx claude-flow@2.0.0 mcp configure \
  --server database \
  --timeout 30000 \
  --retries 3
```

#### Server Presets
Use predefined server configurations:

```bash
# Web development preset
npx claude-flow@2.0.0 mcp preset web-dev

# Data science preset
npx claude-flow@2.0.0 mcp preset data-science

# Enterprise preset
npx claude-flow@2.0.0 mcp preset enterprise
```

### Server Operations

#### Health Monitoring
```bash
# Check server health
npx claude-flow@2.0.0 mcp health

# Test specific server
npx claude-flow@2.0.0 mcp test postgresql

# Performance benchmarks
npx claude-flow@2.0.0 mcp benchmark --server redis
```

#### Server Management
```bash
# Enable/disable servers
npx claude-flow@2.0.0 mcp enable postgresql
npx claude-flow@2.0.0 mcp disable mysql

# Update server configurations
npx claude-flow@2.0.0 mcp update --server aws --region us-west-2

# Remove server
npx claude-flow@2.0.0 mcp remove --server old-api
```

## Project Workflows

### Development Workflows

#### Feature Development
```bash
# Start feature development
npx claude-flow@2.0.0 workflow start feature --name user-authentication

# Development with specific agents
npx claude-flow@2.0.0 workflow start feature \
  --name user-auth \
  --agents api-builder,test-runner,security-scanner

# Complete feature
npx claude-flow@2.0.0 workflow complete feature --name user-authentication
```

#### Bug Fixing
```bash
# Start bug investigation
npx claude-flow@2.0.0 workflow start bugfix --issue 123

# Assign debugging agents
npx claude-flow@2.0.0 workflow assign bugfix \
  --issue 123 \
  --agents code-analyzer,test-runner

# Verify bug fix
npx claude-flow@2.0.0 workflow verify bugfix --issue 123
```

#### Code Review
```bash
# Start code review process
npx claude-flow@2.0.0 workflow start review --pr 456

# Automated review
npx claude-flow@2.0.0 workflow review \
  --pr 456 \
  --agents code-analyzer,security-scanner,test-runner

# Generate review report
npx claude-flow@2.0.0 workflow report review --pr 456
```

### Deployment Workflows

#### Continuous Integration
```bash
# CI pipeline
npx claude-flow@2.0.0 workflow start ci

# Custom CI with specific steps
npx claude-flow@2.0.0 workflow start ci \
  --steps build,test,security-scan,deploy

# CI with parallel execution
npx claude-flow@2.0.0 workflow start ci --parallel
```

#### Production Deployment
```bash
# Production deployment
npx claude-flow@2.0.0 workflow start deploy --env production

# Blue-green deployment
npx claude-flow@2.0.0 workflow start deploy \
  --strategy blue-green \
  --env production

# Rollback deployment
npx claude-flow@2.0.0 workflow rollback --deployment 789
```

### Custom Workflows

#### Creating Custom Workflows
```bash
# Create workflow template
npx claude-flow@2.0.0 workflow create --name custom-workflow

# Edit workflow configuration
npx claude-flow@2.0.0 workflow edit --name custom-workflow
```

Example workflow configuration (`custom-workflow.json`):
```json
{
  "name": "custom-workflow",
  "description": "Custom development workflow",
  "steps": [
    {
      "name": "analyze",
      "agent": "code-analyzer",
      "parallel": false
    },
    {
      "name": "build",
      "agent": "build-specialist",
      "depends": ["analyze"]
    },
    {
      "name": "test",
      "agents": ["test-runner", "security-scanner"],
      "parallel": true,
      "depends": ["build"]
    },
    {
      "name": "deploy",
      "agent": "devops-engineer",
      "depends": ["test"]
    }
  ]
}
```

## Configuration Management

### Configuration Files

Claude Flow 2.0 uses multiple configuration files:

#### Main Configuration (`.claude-flow/config.json`)
```json
{
  "version": "2.0.0",
  "project": {
    "name": "my-project",
    "type": "web-app",
    "language": "javascript"
  },
  "agents": {
    "count": 10,
    "approach": "hive",
    "scaling": {
      "enabled": true,
      "min": 5,
      "max": 100
    }
  },
  "webui": {
    "enabled": true,
    "port": 3000,
    "host": "localhost"
  },
  "mcp": {
    "autoDiscovery": true,
    "preset": "standard"
  }
}
```

#### Agent Configuration (`.claude-flow/agents.json`)
```json
{
  "agents": [
    {
      "type": "code-analyzer",
      "count": 2,
      "priority": "high",
      "config": {
        "languages": ["javascript", "typescript"],
        "frameworks": ["react", "node"]
      }
    },
    {
      "type": "test-runner",
      "count": 3,
      "priority": "medium",
      "config": {
        "testFrameworks": ["jest", "cypress"],
        "coverage": true
      }
    }
  ]
}
```

#### MCP Configuration (`.claude-flow/mcp.json`)
```json
{
  "servers": [
    {
      "name": "postgresql",
      "enabled": true,
      "config": {
        "url": "postgresql://localhost:5432/mydb",
        "poolSize": 10
      }
    },
    {
      "name": "redis",
      "enabled": true,
      "config": {
        "url": "redis://localhost:6379",
        "timeout": 5000
      }
    }
  ]
}
```

### Configuration Commands

#### View Configuration
```bash
# View all configuration
npx claude-flow@2.0.0 config show

# View specific section
npx claude-flow@2.0.0 config show agents

# Export configuration
npx claude-flow@2.0.0 config export --file my-config.json
```

#### Modify Configuration
```bash
# Set configuration value
npx claude-flow@2.0.0 config set agents.count 20

# Set nested value
npx claude-flow@2.0.0 config set agents.scaling.max 200

# Import configuration
npx claude-flow@2.0.0 config import --file new-config.json

# Reset to defaults
npx claude-flow@2.0.0 config reset
```

#### Environment-specific Configuration
```bash
# Development configuration
npx claude-flow@2.0.0 config set --env development agents.count 5

# Production configuration
npx claude-flow@2.0.0 config set --env production agents.count 50

# Switch environment
npx claude-flow@2.0.0 config env production
```

## Monitoring and Debugging

### System Monitoring

#### Real-time Monitoring
```bash
# Monitor system in real-time
npx claude-flow@2.0.0 monitor

# Monitor specific component
npx claude-flow@2.0.0 monitor agents

# Monitor with custom interval
npx claude-flow@2.0.0 monitor --interval 5s
```

#### Performance Metrics
```bash
# Show performance metrics
npx claude-flow@2.0.0 metrics

# Performance report
npx claude-flow@2.0.0 metrics report

# Export metrics
npx claude-flow@2.0.0 metrics export --format json
```

### Logging

#### Log Management
```bash
# View logs
npx claude-flow@2.0.0 logs

# View agent-specific logs
npx claude-flow@2.0.0 logs --agent code-analyzer

# Follow logs in real-time
npx claude-flow@2.0.0 logs --follow

# Filter logs by level
npx claude-flow@2.0.0 logs --level error

# Export logs
npx claude-flow@2.0.0 logs export --file system-logs.txt
```

#### Log Configuration
```bash
# Set log level
npx claude-flow@2.0.0 config set logging.level debug

# Enable file logging
npx claude-flow@2.0.0 config set logging.file true

# Set log retention
npx claude-flow@2.0.0 config set logging.retention 7d
```

### Debugging

#### Debug Mode
```bash
# Enable debug mode
npx claude-flow@2.0.0 debug enable

# Debug specific component
npx claude-flow@2.0.0 debug --component agents

# Debug with verbose output
npx claude-flow@2.0.0 debug --verbose
```

#### Diagnostics
```bash
# Run system diagnostics
npx claude-flow@2.0.0 diagnose

# Diagnose specific issue
npx claude-flow@2.0.0 diagnose --issue agent-communication

# Generate diagnostic report
npx claude-flow@2.0.0 diagnose --report
```

#### Troubleshooting Tools
```bash
# System health check
npx claude-flow@2.0.0 healthcheck

# Validate configuration
npx claude-flow@2.0.0 validate config

# Test connections
npx claude-flow@2.0.0 test connections

# Repair system
npx claude-flow@2.0.0 repair --auto
```

## Advanced Features

### Experimental Features

Enable experimental features for cutting-edge capabilities:

```bash
# Enable all experimental features
npx claude-flow@2.0.0 config set experimental.enabled true

# Enable specific features
npx claude-flow@2.0.0 config set experimental.features.ai-optimization true
npx claude-flow@2.0.0 config set experimental.features.quantum-scaling true
```

### Plugin System

#### Install Plugins
```bash
# Install from registry
npx claude-flow@2.0.0 plugin install @claudeflow/advanced-analytics

# Install from file
npx claude-flow@2.0.0 plugin install ./my-plugin.tar.gz

# Install from git
npx claude-flow@2.0.0 plugin install github:username/plugin-name
```

#### Manage Plugins
```bash
# List installed plugins
npx claude-flow@2.0.0 plugin list

# Enable/disable plugins
npx claude-flow@2.0.0 plugin enable advanced-analytics
npx claude-flow@2.0.0 plugin disable old-plugin

# Update plugins
npx claude-flow@2.0.0 plugin update
```

### API Integration

#### REST API
Claude Flow 2.0 provides a REST API for external integration:

```bash
# Start API server
npx claude-flow@2.0.0 api start --port 3001

# API endpoints
curl http://localhost:3001/api/status
curl http://localhost:3001/api/agents
curl -X POST http://localhost:3001/api/agents/spawn
```

#### WebSocket API
For real-time communication:

```javascript
const ws = new WebSocket('ws://localhost:3001/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Agent update:', data);
};

// Send command
ws.send(JSON.stringify({
  command: 'agents.list',
  id: 'req-123'
}));
```

## Best Practices

### Performance Optimization

#### Agent Count Optimization
- **Small projects** (< 1000 files): 5-10 agents
- **Medium projects** (1000-10000 files): 10-25 agents
- **Large projects** (> 10000 files): 25-100 agents
- **Enterprise projects**: 100+ agents with auto-scaling

#### Resource Management
```bash
# Set memory limits
npx claude-flow@2.0.0 config set performance.memoryLimit 4GB

# CPU limiting
npx claude-flow@2.0.0 config set performance.cpuLimit 80

# I/O optimization
npx claude-flow@2.0.0 config set performance.ioOptimization true
```

### Security Best Practices

#### Access Control
```bash
# Enable authentication
npx claude-flow@2.0.0 config set security.auth.enabled true

# Set API keys
npx claude-flow@2.0.0 config set security.apiKey $SECURE_API_KEY

# Configure CORS
npx claude-flow@2.0.0 config set security.cors.origins "https://mydomain.com"
```

#### Network Security
```bash
# Bind to localhost only
npx claude-flow@2.0.0 config set webui.host localhost

# Enable HTTPS
npx claude-flow@2.0.0 config set webui.ssl.enabled true
npx claude-flow@2.0.0 config set webui.ssl.cert ./cert.pem
npx claude-flow@2.0.0 config set webui.ssl.key ./key.pem
```

### Development Best Practices

#### Version Control Integration
```bash
# Git hooks integration
npx claude-flow@2.0.0 hooks install

# Pre-commit analysis
npx claude-flow@2.0.0 config set hooks.preCommit.analysis true

# Automatic testing
npx claude-flow@2.0.0 config set hooks.preCommit.test true
```

#### CI/CD Integration
```bash
# Jenkins integration
npx claude-flow@2.0.0 ci jenkins --job-name my-project

# GitHub Actions
npx claude-flow@2.0.0 ci github-actions --workflow build

# Custom CI
npx claude-flow@2.0.0 ci custom --config ./ci-config.json
```

### Production Deployment

#### Production Configuration
```bash
# Production mode
npx claude-flow@2.0.0 config set environment production

# Disable debug features
npx claude-flow@2.0.0 config set debug.enabled false

# Enable monitoring
npx claude-flow@2.0.0 config set monitoring.enabled true
```

#### High Availability
```bash
# Enable clustering
npx claude-flow@2.0.0 config set cluster.enabled true

# Set cluster size
npx claude-flow@2.0.0 config set cluster.size 3

# Configure load balancer
npx claude-flow@2.0.0 config set loadBalancer.strategy round-robin
```

---

This comprehensive usage guide covers all aspects of Claude Flow 2.0. For specific use cases, see the [Examples Guide](./EXAMPLES.md). For advanced configuration, check the [Advanced Features Guide](./ADVANCED.md).