# Intelligence Engine

The Intelligence Engine is the core component of the MASTER-WORKFLOW system that provides intelligent decision-making, workflow orchestration, and cross-agent coordination capabilities.

## Components

### Core Modules

#### 1. Queen Controller (`queen-controller.js`)
- **Purpose**: Hierarchical sub-agent architecture master controller
- **Features**:
  - Manages up to 10 concurrent sub-agents
  - Tracks 200k token context windows per agent
  - Handles inter-agent communication
  - Provides task distribution and monitoring
  - Resource usage and performance tracking

#### 2. SharedMemoryStore (`shared-memory.js`) ⭐ **NEW**
- **Purpose**: Production-ready cross-agent data sharing and context preservation
- **Features**:
  - Dual-layer architecture (in-memory + SQLite persistence)
  - Atomic operations for concurrent access
  - Memory versioning and conflict resolution
  - Pub/Sub event system for real-time updates
  - Garbage collection for expired data
  - Performance optimization for high-frequency access
  - Cross-agent result sharing and context preservation
  - Memory limits and intelligent cleanup

#### 3. HiveMindIntegration (`memory-integration-example.js`) ⭐ **NEW**
- **Purpose**: Integration layer between Queen Controller and SharedMemoryStore
- **Features**:
  - Seamless cross-agent data sharing
  - Communication channels for inter-agent messaging
  - Context preservation across agent sessions
  - Result caching and aggregation
  - Event-driven coordination

### Specialized Modules

#### 4. Approach Selector (`approach-selector.js`)
- **Purpose**: Intelligent approach selection for project development
- **Features**: Technology stack analysis, methodology selection

#### 5. Complexity Analyzer (`complexity-analyzer.js`)
- **Purpose**: Project complexity assessment and scoring
- **Features**: Multi-dimensional complexity analysis, scaling recommendations

#### 6. Document Customizer (`document-customizer.js`)
- **Purpose**: Dynamic documentation generation and customization
- **Features**: Template-based document generation, project-specific customization

#### 7. Integration Checker (`integration-checker.js`)
- **Purpose**: System integration validation and compatibility checking
- **Features**: Dependency analysis, compatibility matrix evaluation

#### 8. Project Scanner (`project-scanner.js`)
- **Purpose**: Comprehensive project structure and technology detection
- **Features**: File system analysis, technology stack identification

#### 9. Smart Tool Selector (`smart-tool-selector.js`)
- **Purpose**: Intelligent tool and technology selection
- **Features**: Context-aware tool recommendations, integration assessment

#### 10. Sub-Agent Manager (`sub-agent-manager.js`)
- **Purpose**: Sub-agent lifecycle management and coordination
- **Features**: Agent spawning, monitoring, and task distribution

## Installation

### Quick Setup

```bash
# Install dependencies
./intelligence-engine/install-dependencies.sh

# Verify installation
node intelligence-engine/test-shared-memory.js
```

### Manual Setup

```bash
# Install SQLite3 (optional, will fallback to file-based storage)
npm install sqlite3

# Create .hive-mind directory structure
mkdir -p .hive-mind/{backups,sessions}
touch .hive-mind/{hive.db,memory.db}
```

## Usage Examples

### Basic SharedMemoryStore Usage

```javascript
const SharedMemoryStore = require('./intelligence-engine/shared-memory');

// Initialize
const memory = new SharedMemoryStore({
  projectRoot: process.cwd(),
  maxMemorySize: 500 * 1024 * 1024, // 500MB
  maxEntries: 100000
});

// Wait for initialization
await new Promise(resolve => memory.once('initialized', resolve));

// Store and retrieve data
await memory.set('analysis-results', {
  complexity: 'medium',
  recommendations: ['optimize-performance', 'add-tests']
}, {
  namespace: memory.namespaces.TASK_RESULTS,
  agentId: 'analyzer-001'
});

const results = await memory.get('analysis-results');
console.log('Analysis:', results);
```

### Full Hive-Mind Integration

```javascript
const HiveMindIntegration = require('./intelligence-engine/memory-integration-example');

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

// Share data between agents
await integration.shareDataBetweenAgents(
  analyzerAgent, 
  'test-runner-001',
  { analysisResults: { issues: [], suggestions: [] } }
);

// Get system status
const status = integration.getSystemStatus();
console.log('System Status:', status);
```

### Queen Controller with Memory Integration

```javascript
const QueenController = require('./intelligence-engine/queen-controller');
const SharedMemoryStore = require('./intelligence-engine/shared-memory');

// Initialize shared memory
const memory = new SharedMemoryStore({ projectRoot: process.cwd() });
await new Promise(resolve => memory.once('initialized', resolve));

// Initialize queen with memory integration
const queen = new QueenController({
  projectRoot: process.cwd(),
  maxConcurrent: 5,
  sharedMemory: memory
});

// Spawn agents with enhanced context
const agentId = await queen.spawnSubAgent('code-analyzer', {
  id: 'analysis-task',
  description: 'Analyze codebase quality'
});

// Monitor agents
const status = queen.getStatus();
console.log('Active agents:', status.active);
```

## Architecture

### Memory System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Intelligence Engine                        │
├─────────────────────────────────────────────────────────────┤
│                   Queen Controller                          │
│  ├─ Agent Management        ├─ Task Distribution           │
│  ├─ Resource Monitoring     ├─ Performance Tracking       │
│  └─ Inter-Agent Communication                              │
├─────────────────────────────────────────────────────────────┤
│                 SharedMemoryStore                           │
│  ├─ In-Memory Cache         ├─ SQLite Persistence          │
│  ├─ Pub/Sub Events          ├─ Atomic Operations           │
│  ├─ Memory Versioning       ├─ Garbage Collection          │
│  └─ Lock Management         └─ Performance Optimization    │
├─────────────────────────────────────────────────────────────┤
│                 HiveMind Integration                        │
│  ├─ Cross-Agent Channels    ├─ Context Preservation        │
│  ├─ Result Aggregation      ├─ State Synchronization       │
│  └─ Event Coordination      └─ Communication Routing       │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Agent A ──┐
          ├─→ SharedMemoryStore ──→ SQLite/Files
Agent B ──┤         │
          │         ├─→ Pub/Sub Events ──→ Subscribers
Agent C ──┘         │
                    └─→ Cross-Agent Channels ──→ Other Agents
```

## File Structure

```
intelligence-engine/
├── README.md                           # This file
├── SHARED-MEMORY-README.md            # Detailed SharedMemoryStore docs
├── install-dependencies.sh            # Installation script
├── shared-memory.js                   # SharedMemoryStore implementation
├── test-shared-memory.js              # Comprehensive test suite
├── memory-integration-example.js      # Integration example
├── queen-controller.js                # Enhanced with memory integration
├── approach-selector.js               # Approach selection logic
├── complexity-analyzer.js             # Complexity analysis
├── document-customizer.js             # Document generation
├── integration-checker.js             # Integration validation
├── project-scanner.js                 # Project analysis
├── smart-tool-selector.js             # Tool selection
├── sub-agent-manager.js               # Agent management
└── user-choice-handler.sh             # User interaction handler
```

## Testing

### Comprehensive Test Suite

```bash
# Run full SharedMemoryStore test suite
node intelligence-engine/test-shared-memory.js

# Run integration demonstration
node intelligence-engine/memory-integration-example.js

# Run individual component tests
node test/test-intelligent-system.sh
```

### Test Coverage

The test suite covers:
- ✅ Basic CRUD operations
- ✅ Cross-agent data sharing
- ✅ Context preservation
- ✅ Memory versioning
- ✅ Atomic operations
- ✅ Pub/Sub notifications
- ✅ Garbage collection
- ✅ Performance metrics
- ✅ SQLite integration
- ✅ File-based fallback

## Performance Metrics

### SharedMemoryStore Statistics

```javascript
const stats = memory.getStats();
console.log({
  reads: stats.reads,                    // Total read operations
  writes: stats.writes,                  // Total write operations
  cacheHitRate: stats.cacheHitRate,      // Cache efficiency
  memoryUsage: stats.memoryUsage,        // Current memory usage
  averageReadTime: stats.averageReadTime,   // Performance metrics
  averageWriteTime: stats.averageWriteTime,
  gcRuns: stats.gcRuns,                  // Garbage collection
  evictions: stats.evictions             // Memory management
});
```

## Configuration

### Environment Variables

```bash
# SQLite configuration
export HIVE_MIND_DB_PATH="/custom/path/.hive-mind"
export SQLITE_MEMORY_LIMIT="1000000000"  # 1GB

# Performance tuning
export MEMORY_GC_INTERVAL="300000"       # 5 minutes
export MEMORY_MAX_ENTRIES="100000"
export MEMORY_COMPRESSION_THRESHOLD="1048576"  # 1MB

# Debug settings
export HIVE_MIND_DEBUG="true"
export MEMORY_STORE_VERBOSE="true"
```

### Configuration Options

```javascript
const memory = new SharedMemoryStore({
  projectRoot: process.cwd(),           // Project root directory
  maxMemorySize: 500 * 1024 * 1024,    // 500MB maximum memory
  maxEntries: 100000,                   // Maximum entries
  gcInterval: 300000,                   // GC interval (5 minutes)
  compressionThreshold: 1024 * 1024     // Compression threshold (1MB)
});
```

## Integration Points

### With Existing Systems

#### 1. MASTER-WORKFLOW Integration
- Seamless integration with existing workflow system
- Enhanced agent coordination and data sharing
- Backward compatibility maintained

#### 2. .hive-mind Directory
- Uses existing SQLite databases (`hive.db`, `memory.db`)
- Preserves session data and agent contexts
- Automatic backup and recovery

#### 3. Queen Controller Enhancement
- Enhanced with SharedMemoryStore capabilities
- Maintains existing API compatibility
- Improved performance and reliability

## Security Considerations

### Data Protection
- **Memory Isolation**: Namespace-based data separation
- **Access Control**: Agent-based access permissions
- **Data Expiration**: Automatic cleanup of sensitive data
- **Lock Management**: Prevents concurrent access conflicts

### Best Practices
1. Use appropriate namespaces for data organization
2. Set TTL values for temporary/sensitive data
3. Monitor memory usage and performance metrics
4. Implement proper error handling and logging
5. Regular backup of persistent data

## Troubleshooting

### Common Issues

#### SQLite Not Available
```bash
# Install SQLite3
npm install sqlite3

# Or use file-based fallback (automatic)
# System will continue to work with reduced performance
```

#### Memory Limit Exceeded
```bash
# Increase memory limits or implement cleanup
const memory = new SharedMemoryStore({
  maxMemorySize: 1000 * 1024 * 1024  # 1GB
});
```

#### Performance Issues
```bash
# Monitor memory usage
const stats = memory.getStats();
console.log('Memory utilization:', stats.memoryUtilization);

# Tune garbage collection
const memory = new SharedMemoryStore({
  gcInterval: 60000  # 1 minute
});
```

## Future Enhancements

### Planned Features
- [ ] **Compression**: Automatic compression for large values
- [ ] **Replication**: Multi-node memory synchronization
- [ ] **Query Engine**: SQL-like queries for complex data retrieval
- [ ] **Metrics Dashboard**: Web-based monitoring interface
- [ ] **Encryption**: At-rest and in-transit encryption
- [ ] **Clustering**: Distributed memory across multiple instances

### Contribution Guidelines

1. Follow existing code style and patterns
2. Add comprehensive tests for new features
3. Update documentation for any changes
4. Ensure backward compatibility when possible
5. Performance test any memory-related changes

## Support

### Documentation
- **SharedMemoryStore**: `./SHARED-MEMORY-README.md`
- **API Reference**: Inline code documentation
- **Examples**: `./memory-integration-example.js`

### Getting Help
- Review test files for usage examples
- Check logs for error messages and debugging info
- Monitor performance metrics for optimization opportunities

---

## Summary

The Intelligence Engine provides a robust, production-ready foundation for intelligent workflow orchestration and cross-agent coordination. The new SharedMemoryStore component significantly enhances the system's capabilities by providing reliable, high-performance data sharing and context preservation mechanisms.

**Key Benefits:**
- **Performance**: Dual-layer memory architecture for optimal speed
- **Reliability**: SQLite persistence with file-based fallback
- **Scalability**: Configurable limits and intelligent garbage collection
- **Integration**: Seamless integration with existing systems
- **Production-Ready**: Comprehensive error handling and monitoring

**Created by Claude Code - August 2025**  
**Version 2.1.0 - Enhanced with SharedMemoryStore**