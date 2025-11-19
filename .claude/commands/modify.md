# /modify - Agent Modification Command

## Overview
Modify existing agents with enhanced capabilities, tool access, and MCP server integration.

## Syntax
```
/modify <agent-name> {
  description: "<new description>",
  tools: ["add:tool1", "remove:tool2"],
  mcp_servers: ["add:server1", "remove:server2"],
  color: "<new-color>",
  priority: <1-10>,
  resource_limit: "<memory_mb>"
}
```

## Examples

### Add MCP Servers
```
/modify api-tester {
  mcp_servers: ["add:perplexity", "add:context7"],
  tools: ["add:WebFetch"]
}
```

### Update Description and Priority
```
/modify code-reviewer {
  description: "Enhanced code reviewer with security focus",
  priority: 8,
  mcp_servers: ["add:security-scanner"]
}
```

### Resource Optimization
```
/modify ml-trainer {
  resource_limit: "4096mb",
  priority: 9
}
```

## Modification Types

### Additive Changes
- Add new tools or MCP servers
- Increase resource limits
- Enhance capabilities

### Replacement Changes
- Update descriptions
- Change colors
- Modify priorities

### Removal Changes
- Remove unnecessary tools
- Optimize resource usage
- Reduce complexity

## Validation
- Configuration syntax validation
- Resource availability checking
- Tool permission verification
- MCP server compatibility

## Rollback Support
- Automatic backup creation
- Version history tracking
- Quick rollback capability
- Configuration diff display