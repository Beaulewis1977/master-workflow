# /list - Agent Listing and Discovery Command

## Overview
List and discover all available agents in the unlimited scaling system with detailed information and filtering capabilities.

## Syntax

### Basic Listing
```
/list
/list --active
/list --available
/list --templates
```

### Filtered Listing
```
/list --category <category>
/list --priority <min-max>
/list --tools <tool-name>
/list --mcp <server-name>
/list --color <color>
```

### Detailed Views
```
/list --detailed
/list --resources
/list --performance
/list --conflicts
```

## Output Formats

### Standard List
```
Available Agents (42 discovered + unlimited scaling):

Active Agents:
✅ api-integration-specialist (blue, priority: 7, tools: 8, mcp: 4)
✅ database-performance-optimizer (green, priority: 8, tools: 6, mcp: 6)
✅ security-audit-specialist (red, priority: 9, tools: 10, mcp: 5)

Available Templates:
📋 code-reviewer
📋 api-specialist
📋 database-architect
📋 security-auditor
```

### Detailed View
```
Agent: api-integration-specialist
├── Status: Active (ID: agent_1723456789_abc123)
├── Description: Advanced API integration and testing specialist
├── Color: blue
├── Priority: 7
├── Resources: 512mb allocated (256mb used)
├── Tools: [Read, Write, Edit, MultiEdit, Bash, WebSearch, WebFetch, Task]
├── MCP Servers: [context7, perplexity, github-official, docker]
├── Performance: 98.5% uptime, 1.2s avg response
├── Conflicts: None detected
└── Last Modified: 2024-08-14 10:30:00 UTC
```

### Resource Overview
```
System Resources (Unlimited Scaling Active):
├── Total Agents: 42 active / 4,462 maximum
├── Memory Usage: 12.5GB / 64GB available
├── CPU Load: 23% average
├── MCP Connections: 125 servers available
└── Performance Score: 94.2%

Top Resource Users:
1. ml-trainer (2048mb, priority: 9)
2. data-scientist (1024mb, priority: 8)
3. security-auditor (768mb, priority: 9)
```

## Filtering Options

### By Category
```
/list --category development
/list --category security
/list --category testing
/list --category ai-ml
```

### By Capability
```
/list --tools Bash
/list --mcp github-official
/list --priority 8-10
```

### By Status
```
/list --active
/list --idle
/list --error
/list --maintenance
```

## Search Functionality
```
/list --search "api testing"
/list --search --fuzzy "databse optim"
/list --filter-description "security"
```

## Export Options
```
/list --export json
/list --export yaml
/list --export csv
/list --summary
```