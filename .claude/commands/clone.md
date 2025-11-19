# /clone - Agent Cloning Command

## Overview
Duplicate successful agents with modifications for rapid deployment and scaling.

## Syntax

### Basic Cloning
```
/clone <source-agent> <new-agent-name>
/clone <source-agent> <new-agent-name> --modify {changes}
```

### Advanced Cloning
```
/clone <source-agent> {
  new_name: "<new-agent-name>",
  modifications: {
    description: "<new description>",
    color: "<new-color>",
    tools: ["add:tool1", "remove:tool2"],
    mcp_servers: ["add:server1"],
    priority: <new-priority>
  },
  batch: {
    count: <number>,
    naming_pattern: "<pattern>",
    modifications_per_clone: [...]
  }
}
```

## Cloning Strategies

### Exact Duplicate
```
/clone api-tester api-tester-v2
```

### Modified Clone
```
/clone api-tester enhanced-api-tester {
  modifications: {
    description: "Enhanced API tester with GraphQL support",
    mcp_servers: ["add:graphql-tools"],
    priority: 8
  }
}
```

### Batch Cloning
```
/clone code-reviewer {
  batch: {
    count: 3,
    naming_pattern: "code-reviewer-{language}",
    modifications_per_clone: [
      { description: "JavaScript/TypeScript code reviewer", specialization: "js-ts" },
      { description: "Python code reviewer", specialization: "python" },
      { description: "Go code reviewer", specialization: "golang" }
    ]
  }
}
```

## Template Creation from Clones

### Extract Template
```
/clone api-tester --extract-template api-specialist-v2
Creating template from successful agent...
Template saved: /root/repo/.claude/templates/api-specialist-v2.yaml
```

### Template-Based Cloning
```
/clone --from-template api-specialist-v2 new-api-tester {
  modifications: {
    mcp_servers: ["add:postman-integration"]
  }
}
```

## Inheritance and Relationships

### Parent-Child Relationships
```
Clone Hierarchy:
api-tester (parent)
├── api-tester-v2 (exact clone)
├── enhanced-api-tester (modified clone)
└── batch-api-testers/
    ├── api-tester-rest
    ├── api-tester-graphql
    └── api-tester-websocket
```

### Inheritance Rules
- Tool permissions inherited by default
- MCP server connections shared
- Resource limits inherited unless overridden
- Performance metrics tracked separately

## Configuration Inheritance

### Full Inheritance
```yaml
source_agent: api-tester
clone_settings:
  inherit_all: true
  override: {}
```

### Selective Inheritance
```yaml
source_agent: api-tester
clone_settings:
  inherit:
    - tools
    - mcp_servers
    - priority
  override:
    description: "New specialized description"
    color: "purple"
```

### Custom Inheritance Rules
```yaml
inheritance_rules:
  tools: "inherit_all"
  mcp_servers: "inherit_and_add"
  description: "override_required"
  color: "randomize"
  priority: "inherit_with_offset"
```

## Batch Operations

### Multi-Environment Cloning
```
/clone production-api-tester {
  environments: ["development", "staging", "testing"],
  naming_pattern: "{env}-api-tester",
  environment_specific_configs: {
    development: { mcp_servers: ["add:debug-tools"] },
    staging: { priority: 6 },
    testing: { tools: ["add:performance-monitor"] }
  }
}
```

### Regional Deployment
```
/clone global-monitor {
  regions: ["us-east", "eu-west", "asia-pacific"],
  modifications_per_region: {
    "us-east": { mcp_servers: ["add:aws-us-east"] },
    "eu-west": { mcp_servers: ["add:aws-eu-west"] },
    "asia-pacific": { mcp_servers: ["add:gcp-asia"] }
  }
}
```

## Version Management

### Versioned Cloning
```
/clone api-tester api-tester-v2.1 --version-bump minor
/clone api-tester api-tester-v3.0 --version-bump major
```

### Clone History Tracking
```
Clone History for api-tester:
├── v1.0 (original)
├── v1.1 (bug fixes) → api-tester-stable
├── v2.0 (feature additions) → api-tester-enhanced
└── v3.0 (architecture changes) → api-tester-next
```

## Performance Optimization

### Smart Cloning
- Shared resource optimization
- Deduplicated MCP connections
- Efficient memory allocation
- Load balancing considerations

### Clone Monitoring
```
Clone Performance Metrics:
├── Creation Time: 1.2s average
├── Resource Overhead: 5% per clone
├── Success Rate: 99.1%
└── Optimization Suggestions: 3 available
```

## Error Handling and Recovery

### Clone Validation
- Source agent verification
- Resource availability check
- Name conflict detection
- Permission validation

### Failed Clone Recovery
- Automatic cleanup
- Partial clone handling
- Resource deallocation
- Error reporting and suggestions