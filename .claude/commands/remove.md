# /remove - Agent Removal Command

## Overview
Safely remove agents from the unlimited scaling system with proper cleanup and resource deallocation.

## Syntax

### Single Agent Removal
```
/remove <agent-name>
/remove <agent-name> --force
/remove <agent-name> --backup
```

### Batch Removal
```
/remove --pattern "temp-*"
/remove --category testing
/remove --inactive-days 30
/remove --priority-below 3
```

### Safe Removal with Dependencies
```
/remove <agent-name> --check-dependencies
/remove <agent-name> --migrate-tasks
```

## Safety Features

### Pre-removal Validation
- Dependency checking
- Active task verification
- Resource impact assessment
- Backup recommendation

### Confirmation Process
```
Agent Removal Request: api-tester-temp
├── Status: Active (2 running tasks)
├── Dependencies: None detected
├── Resources: 256mb allocated
├── Last Activity: 5 minutes ago
├── Backup Available: Yes
└── Confirm removal? [y/N]
```

### Automatic Backup
```
/remove api-tester --backup
Creating backup: /root/repo/.claude/backups/api-tester-20240814.md
Deregistering from Queen Controller...
Releasing allocated resources...
Agent removed successfully.
```

## Batch Removal Options

### Pattern-Based
```
/remove --pattern "temp-*" --confirm
/remove --pattern "*-test" --dry-run
```

### Criteria-Based
```
/remove --inactive-days 30
/remove --priority-below 3
/remove --memory-usage-below "100mb"
/remove --error-rate-above 50%
```

### Interactive Selection
```
/remove --interactive
Select agents to remove:
☐ temp-agent-1 (inactive 45 days)
☐ test-runner-old (priority 2)
☑ debug-helper (error rate 75%)
☐ performance-monitor (active)
```

## Recovery Options

### Soft Delete
- Move to archive instead of permanent deletion
- Retain configuration for potential restoration
- Maintain resource allocation history

### Restoration
```
/restore <agent-name>
/restore --from-backup <backup-file>
/restore --list-backups
```

## Resource Cleanup

### Automatic Cleanup
- Release allocated memory
- Close MCP server connections
- Clear temporary files
- Update Queen Controller registry

### Manual Cleanup Verification
```
/remove-verify <agent-name>
Checking cleanup status...
├── Memory: Released ✅
├── MCP Connections: Closed ✅
├── Registry: Updated ✅
├── Files: Cleaned ✅
└── Status: Complete
```

## Error Handling

### Failed Removal
- Automatic rollback
- Resource restoration
- Error logging
- Alternative suggestions

### Dependency Conflicts
- Detailed dependency tree
- Migration recommendations
- Force removal options
- Impact assessment