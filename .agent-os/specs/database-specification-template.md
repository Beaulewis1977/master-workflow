# Database Specification Template

## Database Change Overview
- **Type**: [Schema Change/Migration/Optimization]
- **Purpose**: [Brief description of database change]
- **Agent Assignment**: database-architect-agent.md
- **Impact**: [Low/Medium/High impact on existing data]

## Schema Changes

### Tables Affected
- **Table Name**: [table_name]
- **Change Type**: [CREATE/ALTER/DROP/INDEX]
- **Reason**: [Why this change is needed]

### New Tables
```sql
CREATE TABLE example_table (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id VARCHAR(255) NOT NULL,
  context_data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Table Alterations
```sql
ALTER TABLE existing_table 
ADD COLUMN new_column VARCHAR(255);

-- Add indexes for performance
CREATE INDEX idx_agent_context ON example_table(agent_id, created_at);
```

## Migration Script

### Up Migration
```sql
-- Migration script to apply changes
BEGIN TRANSACTION;

-- Create new tables
[CREATE TABLE statements]

-- Modify existing tables
[ALTER TABLE statements]

-- Create indexes
[CREATE INDEX statements]

-- Insert default data if needed
[INSERT statements]

COMMIT;
```

### Down Migration
```sql
-- Rollback script to undo changes
BEGIN TRANSACTION;

-- Remove indexes
[DROP INDEX statements]

-- Revert table changes
[ALTER TABLE statements to revert]

-- Drop new tables
[DROP TABLE statements]

COMMIT;
```

## Agent-OS Integration Requirements

### Context Optimization
- **Shared Memory**: Use SQLite for cross-agent data sharing
- **Connection Pooling**: Optimize for 10 concurrent agents
- **Query Optimization**: Ensure queries complete within context window
- **Backup Strategy**: Implement backup points for data safety

### Performance Requirements
- **Query Response Time**: < 100ms for standard queries
- **Connection Limit**: Support 10 concurrent connections
- **Memory Usage**: Optimize for 200k context windows
- **Index Strategy**: Create indexes for frequently accessed data

## Data Validation

### Input Validation
- **Data Types**: [Specify required data types]
- **Constraints**: [Specify constraints and validations]
- **Foreign Keys**: [Define foreign key relationships]
- **Unique Constraints**: [Define unique constraints]

### Data Integrity
- **Referential Integrity**: [Foreign key constraints]
- **Check Constraints**: [Business rule validations]
- **Triggers**: [Automated data validation/transformation]

## Testing Strategy

### Unit Tests
- [ ] Schema creation/modification
- [ ] Data insertion/retrieval
- [ ] Constraint validation
- [ ] Index performance

### Integration Tests
- [ ] Agent data sharing
- [ ] Concurrent access patterns
- [ ] Backup/restore procedures
- [ ] Migration scripts

### Performance Tests
- [ ] Query performance benchmarks
- [ ] Connection pooling efficiency
- [ ] Memory usage optimization
- [ ] Concurrent agent operations

## Security Considerations

### Access Control
- **Permissions**: [Define table/column permissions]
- **Encryption**: [Data encryption requirements]
- **Audit Trail**: [Change tracking requirements]

### SQL Injection Prevention
- **Parameterized Queries**: Use prepared statements
- **Input Sanitization**: Validate all inputs
- **Privilege Separation**: Minimize database permissions

## Rollback Plan

### Rollback Conditions
- [Conditions that would trigger rollback]
- [Performance degradation thresholds]
- [Data integrity issues]

### Rollback Procedure
1. Execute down migration script
2. Restore from backup if necessary
3. Verify data integrity
4. Update application configuration

## Documentation Updates

### Schema Documentation
- [ ] Update database schema documentation
- [ ] Document new tables/columns
- [ ] Update entity relationship diagrams
- [ ] Document performance characteristics

### Agent Integration
- [ ] Update agent data access patterns
- [ ] Document new shared memory structures
- [ ] Update context optimization strategies

## Acceptance Criteria
- [ ] Schema changes applied successfully
- [ ] Migration scripts tested and working
- [ ] Performance requirements met
- [ ] Security requirements satisfied
- [ ] Rollback procedure verified
- [ ] Documentation updated
- [ ] Agent integration working properly