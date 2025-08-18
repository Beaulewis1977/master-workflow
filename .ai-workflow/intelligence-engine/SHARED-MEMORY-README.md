# SharedMemoryStore - Production-Ready Cross-Agent Data Sharing

## Overview

The SharedMemoryStore is a comprehensive, production-ready implementation that provides cross-agent data sharing, context preservation, result caching, and state synchronization for the Hive-Mind architecture. It integrates seamlessly with the existing `.hive-mind/` infrastructure and SQLite databases.

## Features

### Core Functionality
- **Dual-layer Architecture**: In-memory cache + SQLite persistence
- **Atomic Operations**: Thread-safe operations for concurrent access
- **Memory Versioning**: Version control with conflict resolution
- **Pub/Sub Events**: Real-time updates and notifications
- **Garbage Collection**: Intelligent cleanup of expired data
- **Performance Optimization**: High-frequency access optimization

### Cross-Agent Capabilities
- **Data Sharing**: Seamless data exchange between agents
- **Context Preservation**: Persistent agent contexts across sessions
- **Result Caching**: Intelligent caching with TTL support
- **State Synchronization**: Real-time state updates
- **Communication Channels**: Structured inter-agent messaging

### Memory Management
- **Memory Limits**: Configurable memory and entry limits
- **LRU Eviction**: Least Recently Used eviction strategy
- **Compression**: Automatic compression for large data
- **Namespace Isolation**: Organized data separation
- **Lock Management**: Exclusive access controls

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SharedMemoryStore                        │
├─────────────────────────────────────────────────────────────┤
│  In-Memory Cache     │  Persistent Store  │  Version Store  │
│  ├─ Fast Access     │  ├─ SQLite DB      │  ├─ Version     │
│  ├─ LRU Eviction    │  ├─ File Fallback  │  │   History    │
│  └─ Transient Data  │  └─ Cross-Session  │  └─ Conflict    │
│                     │      Persistence   │      Resolution │
├─────────────────────────────────────────────────────────────┤
│  Metadata Store     │  Subscriber Store   │  Lock Store    │
│  ├─ Entry Info     │  ├─ Pub/Sub        │  ├─ Exclusive   │
│  ├─ TTL Tracking   │  ├─ Pattern Match  │  │   Locks      │
│  └─ Access Stats   │  └─ Event Routing  │  └─ Timeouts    │
├─────────────────────────────────────────────────────────────┤
│                    Event System                             │
│  ├─ Memory Updates          ├─ Agent Notifications         │
│  ├─ Garbage Collection      ├─ Lock Acquisition/Release   │
│  └─ Performance Metrics     └─ Error Handling             │
└─────────────────────────────────────────────────────────────┘
```

## Integration with Existing Infrastructure

### SQLite Integration
- **hive.db**: Cross-agent coordination and event logging
- **memory.db**: Shared memory persistence and versioning
- **Fallback**: Graceful degradation to file-based storage

### File Structure
```
.hive-mind/
├── hive.db                 # Main coordination database
├── memory.db               # Shared memory database
├── shared-memory.json      # File-based fallback
├── backups/               # Automatic backups
│   └── shared-memory-*.json
└── sessions/              # Session data
    ├── session-*.json
    └── hive-mind-prompt-*.txt
```

## Usage Examples

### Basic Operations

```javascript
const SharedMemoryStore = require('./shared-memory');

// Initialize
const memory = new SharedMemoryStore({
  projectRoot: '/path/to/project',
  maxMemorySize: 500 * 1024 * 1024, // 500MB
  maxEntries: 100000,
  gcInterval: 300000 // 5 minutes
});

// Wait for initialization
await new Promise(resolve => memory.once('initialized', resolve));

// Store data with options
await memory.set('analysis-results', {
  complexity: 'high',
  maintainability: 0.7,
  issues: ['refactor-needed']
}, {
  namespace: memory.namespaces.TASK_RESULTS,
  dataType: memory.dataTypes.PERSISTENT,
  ttl: 24 * 60 * 60 * 1000, // 24 hours
  agentId: 'code-analyzer-001',
  metadata: { analysisType: 'code-quality' }
});

// Retrieve data
const results = await memory.get('analysis-results', {
  agentId: 'requesting-agent',
  includeMetadata: true
});

console.log('Results:', results.value);
console.log('Metadata:', results.metadata);
```

### Cross-Agent Data Sharing

```javascript
// Agent A stores analysis results
await memory.set('shared-analysis', {
  codeQuality: 85,
  testCoverage: 0.78,
  recommendations: ['add-unit-tests', 'refactor-large-functions']
}, {
  namespace: memory.namespaces.CROSS_AGENT,
  agentId: 'analyzer-agent-001',
  metadata: { sharedWith: ['test-agent-001', 'doc-agent-001'] }
});

// Agent B retrieves and processes
const sharedData = await memory.get('shared-analysis', {
  agentId: 'test-agent-001'
});

// Agent B stores processed results
await memory.set('processed-analysis', {
  originalAnalysis: sharedData,
  additionalTests: ['integration-tests', 'performance-tests'],
  testPlan: 'comprehensive-testing-strategy.md'
}, {
  namespace: memory.namespaces.CROSS_AGENT,
  agentId: 'test-agent-001'
});
```

### Context Preservation

```javascript
// Store agent context
const agentId = 'long-running-agent-001';
await memory.set(`agent-context-${agentId}`, {
  currentTask: 'large-codebase-analysis',
  progress: 0.65,
  processedFiles: ['app.js', 'utils.js', 'config.js'],
  currentFile: 'components/dashboard.js',
  intermediateResults: {
    totalFiles: 150,
    analyzedFiles: 98,
    issuesFound: 23
  },
  sessionData: {
    startTime: Date.now(),
    tokensUsed: 85000,
    maxTokens: 200000
  }
}, {
  namespace: memory.namespaces.AGENT_CONTEXT,
  dataType: memory.dataTypes.PERSISTENT,
  agentId: agentId
});

// Later, restore context (even after restart)
const restoredContext = await memory.get(`agent-context-${agentId}`, {
  agentId: agentId
});

console.log(`Resuming analysis at ${restoredContext.progress * 100}% completion`);
```

### Pub/Sub Notifications

```javascript
// Subscribe to data changes
const unsubscribe = memory.subscribe('task-results-*', (event) => {
  console.log(`Task result updated: ${event.key}`);
  console.log(`Event type: ${event.eventType}`);
  console.log(`Updated by: ${event.data.agentId}`);
  
  // Process the update
  if (event.eventType === 'set') {
    handleNewTaskResult(event.key, event.data.value);
  }
}, {
  agentId: 'monitoring-agent',
  events: ['set', 'delete']
});

// Later, unsubscribe
unsubscribe();
```

### Atomic Operations

```javascript
// Safe counter increment
const finalCount = await memory.atomic('global-counter', (currentValue) => {
  return (currentValue || 0) + 1;
}, {
  agentId: 'counter-agent'
});

// Complex atomic update
await memory.atomic('shared-state', (currentState) => {
  if (!currentState) {
    return { initialized: true, agents: [], lastUpdate: Date.now() };
  }
  
  // Add agent if not already present
  if (!currentState.agents.includes('new-agent-001')) {
    currentState.agents.push('new-agent-001');
    currentState.lastUpdate = Date.now();
  }
  
  return currentState;
}, {
  agentId: 'new-agent-001',
  timeout: 5000
});
```

### Locking Mechanism

```javascript
const key = 'critical-resource';
const agentId = 'processing-agent';

try {
  // Acquire exclusive lock
  const lock = await memory.acquireLock(key, agentId, {
    timeout: 30000 // 30 seconds
  });
  
  console.log(`Lock acquired: ${lock.acquiredAt}`);
  
  // Perform critical operations
  const data = await memory.get(key);
  const processedData = await expensiveProcessing(data);
  await memory.set(key, processedData, { agentId });
  
} finally {
  // Always release the lock
  await memory.releaseLock(key, agentId);
}
```

## Configuration Options

### Constructor Options

```javascript
const memory = new SharedMemoryStore({
  projectRoot: '/path/to/project',           // Project root directory
  maxMemorySize: 500 * 1024 * 1024,         // 500MB maximum memory
  maxEntries: 100000,                       // Maximum entries
  gcInterval: 300000,                       // GC interval (5 minutes)
  compressionThreshold: 1024 * 1024         // Compression threshold (1MB)
});
```

### Data Types

```javascript
memory.dataTypes = {
  PERSISTENT: 'persistent',     // Survive process restarts
  TRANSIENT: 'transient',       // Memory-only, cleared on restart
  CACHED: 'cached',             // LRU cache with TTL
  VERSIONED: 'versioned',       // Version controlled with history
  SHARED: 'shared',             // Cross-agent shared data
  LOCKED: 'locked'              // Requires exclusive access
};
```

### Namespaces

```javascript
memory.namespaces = {
  AGENT_CONTEXT: 'agent_context',   // Agent contexts and state
  TASK_RESULTS: 'task_results',     // Task execution results
  SHARED_STATE: 'shared_state',     // Shared application state
  CROSS_AGENT: 'cross_agent',       // Cross-agent communication
  CACHE: 'cache',                   // Cached computations
  TEMP: 'temp',                     // Temporary data
  CONFIG: 'config',                 // Configuration data
  METRICS: 'metrics'                // Performance metrics
};
```

## Performance Metrics

### Available Statistics

```javascript
const stats = memory.getStats();
console.log({
  reads: stats.reads,                    // Total read operations
  writes: stats.writes,                  // Total write operations
  hits: stats.hits,                      // Cache hits
  misses: stats.misses,                  // Cache misses
  cacheHitRate: stats.cacheHitRate,      // Hit rate percentage
  evictions: stats.evictions,            // LRU evictions
  gcRuns: stats.gcRuns,                  // Garbage collection runs
  memoryUsage: stats.memoryUsage,        // Current memory usage
  entryCount: stats.entryCount,          // Current entry count
  averageReadTime: stats.averageReadTime,   // Average read time (ms)
  averageWriteTime: stats.averageWriteTime, // Average write time (ms)
  memoryUtilization: stats.memoryUtilization, // Memory usage %
  entryUtilization: stats.entryUtilization,   // Entry usage %
  dbStatus: stats.dbStatus,              // SQLite status
  activeSubscribers: stats.activeSubscribers, // Pub/sub subscribers
  activeLocks: stats.activeLocks         // Active locks
});
```

## Testing

### Running Tests

```bash
# Run comprehensive test suite
node intelligence-engine/test-shared-memory.js

# Run with coverage (if available)
npm run test

# Run specific test categories
node -e "
const Tester = require('./intelligence-engine/test-shared-memory');
const tester = new Tester();
tester.testBasicOperations().then(() => console.log('Basic tests passed'));
"
```

### Test Coverage

The test suite covers:
- ✅ Basic CRUD operations
- ✅ Namespace isolation
- ✅ Data type handling
- ✅ TTL and expiration
- ✅ Versioning system
- ✅ Atomic operations
- ✅ Pub/Sub notifications
- ✅ Locking mechanism
- ✅ Cross-agent sharing
- ✅ Context preservation
- ✅ Result caching
- ✅ Memory limits
- ✅ Garbage collection
- ✅ Performance metrics
- ✅ SQLite integration
- ✅ File-based fallback

## Integration Example

### Full Integration with Queen Controller

```javascript
const HiveMindIntegration = require('./memory-integration-example');

// Initialize complete system
const integration = new HiveMindIntegration({
  projectRoot: process.cwd(),
  maxConcurrentAgents: 10
});

// Wait for initialization
await new Promise(resolve => integration.once('integration-ready', resolve));

// Spawn agents with memory integration
const analyzerAgent = await integration.spawnAgent('code-analyzer', {
  id: 'analyze-project',
  description: 'Comprehensive project analysis'
});

const testAgent = await integration.spawnAgent('test-runner', {
  id: 'run-tests',
  description: 'Execute test suites'
});

// Share data between agents
await integration.shareDataBetweenAgents(
  analyzerAgent, 
  testAgent, 
  { analysisResults: { complexity: 'medium', issues: [] } }
);

// Monitor system status
const status = integration.getSystemStatus();
console.log('System Status:', status);

// Graceful shutdown
await integration.shutdown();
```

## Best Practices

### Memory Management
1. **Use appropriate data types** for different use cases
2. **Set TTL values** for temporary data
3. **Monitor memory usage** regularly
4. **Use namespaces** to organize data
5. **Implement proper cleanup** in agent lifecycle

### Cross-Agent Communication
1. **Use structured data formats** for sharing
2. **Include metadata** for context
3. **Subscribe to relevant channels** only
4. **Handle notification failures** gracefully
5. **Version shared data structures** for compatibility

### Performance Optimization
1. **Cache frequently accessed data** in memory
2. **Use atomic operations** for concurrent access
3. **Batch operations** when possible
4. **Monitor performance metrics** continuously
5. **Tune garbage collection** intervals

### Error Handling
1. **Handle SQLite unavailability** gracefully
2. **Implement retry logic** for transient failures
3. **Log errors appropriately** without exposing sensitive data
4. **Provide fallback mechanisms** for critical operations
5. **Monitor and alert** on persistent errors

## Troubleshooting

### Common Issues

#### SQLite Not Available
```
Error: Module 'sqlite3' not found
Solution: Run 'npm install sqlite3' or use file-based fallback
```

#### Memory Limit Exceeded
```
Error: Memory limit exceeded: 524288000 > 500000000
Solution: Increase maxMemorySize or implement data cleanup
```

#### Lock Timeout
```
Error: Key shared-resource is already locked by agent agent-001
Solution: Implement proper lock release or increase timeout
```

#### Performance Degradation
```
Issue: High average read/write times
Solution: Check memory usage, run GC, optimize data structure
```

### Debugging

Enable debug logging:
```javascript
const memory = new SharedMemoryStore({
  // ... options
});

memory.on('error', (error) => {
  console.error('Memory Store Error:', error);
});

memory.on('memory-set', (event) => {
  console.log('Memory Set:', event);
});

memory.on('garbage-collection', (event) => {
  console.log('GC Run:', event);
});
```

## Future Enhancements

### Planned Features
- [ ] **Compression**: Automatic compression for large values
- [ ] **Replication**: Multi-node memory synchronization
- [ ] **Query Engine**: SQL-like queries for complex data retrieval
- [ ] **Backup/Restore**: Automated backup and restore mechanisms
- [ ] **Metrics Dashboard**: Web-based monitoring interface
- [ ] **Schema Validation**: JSON schema validation for stored data
- [ ] **Encryption**: At-rest and in-transit encryption
- [ ] **Clustering**: Distributed memory across multiple instances

### Contribution Guidelines

1. **Follow existing code style** and patterns
2. **Add comprehensive tests** for new features
3. **Update documentation** for any changes
4. **Ensure backward compatibility** when possible
5. **Performance test** any memory-related changes

---

## Summary

The SharedMemoryStore provides a robust, production-ready foundation for cross-agent data sharing in the Hive-Mind architecture. It combines the performance of in-memory caching with the reliability of persistent storage, while offering advanced features like versioning, pub/sub notifications, and atomic operations.

**Created by Claude Code - August 2025**  
**Version 2.1.0 - Production Ready**