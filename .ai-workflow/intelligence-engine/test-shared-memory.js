/**
 * Test Suite for SharedMemoryStore
 * 
 * Comprehensive testing of the shared memory implementation including:
 * - Basic CRUD operations
 * - Cross-agent data sharing
 * - Context preservation
 * - Result caching and retrieval
 * - State synchronization
 * - Memory versioning
 * - Pub/Sub notifications
 * - Garbage collection
 * - Performance optimization
 * 
 * @author Claude Code
 * @date August 2025
 */

const SharedMemoryStore = require('./shared-memory');
const path = require('path');
const fs = require('fs').promises;

class SharedMemoryTester {
  constructor() {
    this.testResults = [];
    this.memoryStore = null;
    this.testProjectRoot = path.join(__dirname, '..', 'test-data');
  }
  
  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🧪 Starting SharedMemoryStore Test Suite...\n');
    
    try {
      await this.setupTestEnvironment();
      
      // Core functionality tests
      await this.testBasicOperations();
      await this.testNamespaceOperations();
      await this.testDataTypes();
      await this.testTTLAndExpiration();
      
      // Advanced features
      await this.testVersioning();
      await this.testAtomicOperations();
      await this.testPubSubSystem();
      await this.testLockingMechanism();
      
      // Cross-agent functionality
      await this.testCrossAgentSharing();
      await this.testContextPreservation();
      await this.testResultCaching();
      
      // Performance and memory management
      await this.testMemoryLimits();
      await this.testGarbageCollection();
      await this.testPerformanceMetrics();
      
      // Integration tests
      await this.testSQLiteIntegration();
      await this.testFileBasedFallback();
      
      await this.cleanupTestEnvironment();
      
      this.printTestResults();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      throw error;
    }
  }
  
  /**
   * Setup test environment
   */
  async setupTestEnvironment() {
    console.log('📋 Setting up test environment...');
    
    try {
      // Create test directory
      await fs.mkdir(this.testProjectRoot, { recursive: true });
      
      // Initialize memory store
      this.memoryStore = new SharedMemoryStore({
        projectRoot: this.testProjectRoot,
        maxMemorySize: 10 * 1024 * 1024, // 10MB for testing
        maxEntries: 1000,
        gcInterval: 5000 // 5 seconds for testing
      });
      
      // Wait for initialization
      await new Promise((resolve) => {
        this.memoryStore.once('initialized', resolve);
      });
      
      this.addTestResult('Environment Setup', true, 'Test environment initialized successfully');
      
    } catch (error) {
      this.addTestResult('Environment Setup', false, `Setup failed: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Test basic CRUD operations
   */
  async testBasicOperations() {
    console.log('🔧 Testing basic operations...');
    
    try {
      // Test SET operation
      const setResult = await this.memoryStore.set('test-key-1', { message: 'Hello, World!' }, {
        agentId: 'test-agent-1',
        metadata: { type: 'greeting' }
      });
      
      this.assert(setResult.success, 'SET operation should succeed');
      this.assert(setResult.version === 1, 'Initial version should be 1');
      
      // Test GET operation
      const getValue = await this.memoryStore.get('test-key-1', { agentId: 'test-agent-1' });
      this.assert(getValue?.message === 'Hello, World!', 'GET should return correct value');
      
      // Test GET with metadata
      const getWithMetadata = await this.memoryStore.get('test-key-1', { 
        includeMetadata: true,
        agentId: 'test-agent-1'
      });
      
      this.assert(getWithMetadata.found, 'GET with metadata should find the value');
      this.assert(getWithMetadata.metadata.agentId === 'test-agent-1', 'Metadata should include agent ID');
      
      // Test UPDATE operation
      await this.memoryStore.set('test-key-1', { message: 'Updated message' }, {
        agentId: 'test-agent-1'
      });
      
      const updatedValue = await this.memoryStore.get('test-key-1');
      this.assert(updatedValue?.message === 'Updated message', 'UPDATE should change the value');
      
      // Test DELETE operation
      const deleteResult = await this.memoryStore.delete('test-key-1', { agentId: 'test-agent-1' });
      this.assert(deleteResult === true, 'DELETE should return true for existing key');
      
      const deletedValue = await this.memoryStore.get('test-key-1');
      this.assert(deletedValue === null, 'GET after DELETE should return null');
      
      this.addTestResult('Basic Operations', true, 'All CRUD operations work correctly');
      
    } catch (error) {
      this.addTestResult('Basic Operations', false, `Basic operations failed: ${error.message}`);
    }
  }
  
  /**
   * Test namespace operations
   */
  async testNamespaceOperations() {
    console.log('🏷️ Testing namespace operations...');
    
    try {
      // Set values in different namespaces
      await this.memoryStore.set('config-1', { setting: 'value1' }, {
        namespace: this.memoryStore.namespaces.CONFIG
      });
      
      await this.memoryStore.set('cache-1', { data: 'cached' }, {
        namespace: this.memoryStore.namespaces.CACHE
      });
      
      await this.memoryStore.set('temp-1', { temp: 'temporary' }, {
        namespace: this.memoryStore.namespaces.TEMP
      });
      
      // Test namespace filtering
      const configKeys = await this.memoryStore.keys({
        namespace: this.memoryStore.namespaces.CONFIG
      });
      
      this.assert(configKeys.includes('config-1'), 'Config namespace should contain config-1');
      this.assert(!configKeys.includes('cache-1'), 'Config namespace should not contain cache-1');
      
      const cacheKeys = await this.memoryStore.keys({
        namespace: this.memoryStore.namespaces.CACHE
      });
      
      this.assert(cacheKeys.includes('cache-1'), 'Cache namespace should contain cache-1');
      this.assert(!cacheKeys.includes('config-1'), 'Cache namespace should not contain config-1');
      
      this.addTestResult('Namespace Operations', true, 'Namespace isolation works correctly');
      
    } catch (error) {
      this.addTestResult('Namespace Operations', false, `Namespace operations failed: ${error.message}`);
    }
  }
  
  /**
   * Test different data types
   */
  async testDataTypes() {
    console.log('📊 Testing data types...');
    
    try {
      // Test PERSISTENT data type
      await this.memoryStore.set('persistent-data', { persist: true }, {
        dataType: this.memoryStore.dataTypes.PERSISTENT
      });
      
      // Test TRANSIENT data type
      await this.memoryStore.set('transient-data', { temporary: true }, {
        dataType: this.memoryStore.dataTypes.TRANSIENT
      });
      
      // Test CACHED data type
      await this.memoryStore.set('cached-data', { cached: true }, {
        dataType: this.memoryStore.dataTypes.CACHED,
        ttl: 10000 // 10 seconds
      });
      
      // Verify data types are stored correctly
      const persistentMeta = await this.memoryStore.get('persistent-data', { includeMetadata: true });
      this.assert(persistentMeta.metadata.dataType === this.memoryStore.dataTypes.PERSISTENT, 
        'Persistent data type should be stored correctly');
      
      const transientMeta = await this.memoryStore.get('transient-data', { includeMetadata: true });
      this.assert(transientMeta.metadata.dataType === this.memoryStore.dataTypes.TRANSIENT,
        'Transient data type should be stored correctly');
      
      this.addTestResult('Data Types', true, 'All data types work correctly');
      
    } catch (error) {
      this.addTestResult('Data Types', false, `Data type operations failed: ${error.message}`);
    }
  }
  
  /**
   * Test TTL and expiration
   */
  async testTTLAndExpiration() {
    console.log('⏰ Testing TTL and expiration...');
    
    try {
      // Set data with short TTL
      await this.memoryStore.set('expire-soon', { data: 'will expire' }, {
        ttl: 1000 // 1 second
      });
      
      // Verify data exists immediately
      const immediateValue = await this.memoryStore.get('expire-soon');
      this.assert(immediateValue?.data === 'will expire', 'Data should exist immediately after setting');
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Verify data has expired
      const expiredValue = await this.memoryStore.get('expire-soon');
      this.assert(expiredValue === null, 'Data should be null after TTL expiration');
      
      this.addTestResult('TTL and Expiration', true, 'TTL expiration works correctly');
      
    } catch (error) {
      this.addTestResult('TTL and Expiration', false, `TTL operations failed: ${error.message}`);
    }
  }
  
  /**
   * Test versioning system
   */
  async testVersioning() {
    console.log('📝 Testing versioning system...');
    
    try {
      // Set versioned data
      const v1Result = await this.memoryStore.set('versioned-key', { version: 1 }, {
        dataType: this.memoryStore.dataTypes.VERSIONED
      });
      
      this.assert(v1Result.version === 1, 'First version should be 1');
      
      // Update versioned data
      const v2Result = await this.memoryStore.set('versioned-key', { version: 2 }, {
        dataType: this.memoryStore.dataTypes.VERSIONED
      });
      
      this.assert(v2Result.version === 2, 'Second version should be 2');
      
      // Get current version
      const currentValue = await this.memoryStore.get('versioned-key');
      this.assert(currentValue?.version === 2, 'Current value should be version 2');
      
      // TODO: Add version history retrieval when implemented
      
      this.addTestResult('Versioning System', true, 'Version tracking works correctly');
      
    } catch (error) {
      this.addTestResult('Versioning System', false, `Versioning failed: ${error.message}`);
    }
  }
  
  /**
   * Test atomic operations
   */
  async testAtomicOperations() {
    console.log('⚛️ Testing atomic operations...');
    
    try {
      // Set initial counter value
      await this.memoryStore.set('counter', 0, { agentId: 'atomic-test' });
      
      // Perform atomic increment
      const result = await this.memoryStore.atomic('counter', (currentValue) => {
        return (currentValue || 0) + 1;
      }, { agentId: 'atomic-test' });
      
      this.assert(result === 1, 'Atomic increment should return 1');
      
      // Verify counter value
      const counterValue = await this.memoryStore.get('counter');
      this.assert(counterValue === 1, 'Counter should be 1 after atomic increment');
      
      // Test concurrent atomic operations
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          this.memoryStore.atomic('counter', (currentValue) => {
            return currentValue + 1;
          }, { agentId: `concurrent-${i}` })
        );
      }
      
      await Promise.all(promises);
      
      const finalCounter = await this.memoryStore.get('counter');
      this.assert(finalCounter === 6, 'Counter should be 6 after 5 concurrent increments');
      
      this.addTestResult('Atomic Operations', true, 'Atomic operations work correctly');
      
    } catch (error) {
      this.addTestResult('Atomic Operations', false, `Atomic operations failed: ${error.message}`);
    }
  }
  
  /**
   * Test pub/sub system
   */
  async testPubSubSystem() {
    console.log('📡 Testing pub/sub system...');
    
    try {
      let notificationReceived = false;
      let notificationData = null;
      
      // Subscribe to pattern
      const unsubscribe = this.memoryStore.subscribe('pubsub-*', (event) => {
        notificationReceived = true;
        notificationData = event;
      }, { agentId: 'subscriber-agent' });
      
      // Set data that matches pattern
      await this.memoryStore.set('pubsub-test', { message: 'Hello subscribers!' }, {
        agentId: 'publisher-agent'
      });
      
      // Wait for notification
      await new Promise(resolve => setTimeout(resolve, 100));
      
      this.assert(notificationReceived, 'Subscriber should receive notification');
      this.assert(notificationData?.key === 'pubsub-test', 'Notification should contain correct key');
      this.assert(notificationData?.eventType === 'set', 'Notification should be for set event');
      
      // Test unsubscribe
      unsubscribe();
      notificationReceived = false;
      
      await this.memoryStore.set('pubsub-test-2', { message: 'Should not notify' });
      await new Promise(resolve => setTimeout(resolve, 100));
      
      this.assert(!notificationReceived, 'Should not receive notification after unsubscribe');
      
      this.addTestResult('Pub/Sub System', true, 'Pub/Sub notifications work correctly');
      
    } catch (error) {
      this.addTestResult('Pub/Sub System', false, `Pub/Sub failed: ${error.message}`);
    }
  }
  
  /**
   * Test locking mechanism
   */
  async testLockingMechanism() {
    console.log('🔒 Testing locking mechanism...');
    
    try {
      const key = 'locked-resource';
      const agentId1 = 'agent-1';
      const agentId2 = 'agent-2';
      
      // Acquire lock
      const lock = await this.memoryStore.acquireLock(key, agentId1, { timeout: 5000 });
      this.assert(lock.agentId === agentId1, 'Lock should be held by agent-1');
      
      // Try to acquire same lock with different agent (should fail)
      try {
        await this.memoryStore.acquireLock(key, agentId2);
        this.assert(false, 'Second lock acquisition should fail');
      } catch (lockError) {
        this.assert(lockError.message.includes('already locked'), 'Should get appropriate lock error');
      }
      
      // Release lock
      const released = await this.memoryStore.releaseLock(key, agentId1);
      this.assert(released === true, 'Lock release should succeed');
      
      // Now second agent should be able to acquire lock
      const secondLock = await this.memoryStore.acquireLock(key, agentId2);
      this.assert(secondLock.agentId === agentId2, 'Second agent should now hold the lock');
      
      await this.memoryStore.releaseLock(key, agentId2);
      
      this.addTestResult('Locking Mechanism', true, 'Exclusive locking works correctly');
      
    } catch (error) {
      this.addTestResult('Locking Mechanism', false, `Locking failed: ${error.message}`);
    }
  }
  
  /**
   * Test cross-agent data sharing
   */
  async testCrossAgentSharing() {
    console.log('🤝 Testing cross-agent data sharing...');
    
    try {
      const agentA = 'analysis-agent';
      const agentB = 'processing-agent';
      const sharedKey = 'shared-analysis-results';
      
      // Agent A stores analysis results
      await this.memoryStore.set(sharedKey, {
        analysisType: 'code-quality',
        results: {
          score: 85,
          issues: ['minor-style-issue'],
          suggestions: ['improve-comments']
        },
        timestamp: Date.now()
      }, {
        namespace: this.memoryStore.namespaces.CROSS_AGENT,
        agentId: agentA,
        metadata: { sharedWith: [agentB] }
      });
      
      // Agent B retrieves shared results
      const sharedData = await this.memoryStore.get(sharedKey, {
        agentId: agentB,
        includeMetadata: true
      });
      
      this.assert(sharedData.found, 'Agent B should be able to access shared data');
      this.assert(sharedData.value.results.score === 85, 'Shared data should be intact');
      this.assert(sharedData.metadata.agentId === agentA, 'Metadata should show original agent');
      
      // Test shared state updates
      await this.memoryStore.set(`${sharedKey}-processed`, {
        originalAnalysis: sharedData.value,
        processedBy: agentB,
        additionalFindings: ['performance-optimization-opportunity'],
        processed: true
      }, {
        namespace: this.memoryStore.namespaces.CROSS_AGENT,
        agentId: agentB
      });
      
      this.addTestResult('Cross-Agent Sharing', true, 'Cross-agent data sharing works correctly');
      
    } catch (error) {
      this.addTestResult('Cross-Agent Sharing', false, `Cross-agent sharing failed: ${error.message}`);
    }
  }
  
  /**
   * Test context preservation
   */
  async testContextPreservation() {
    console.log('💾 Testing context preservation...');
    
    try {
      const agentId = 'context-test-agent';
      const contextKey = `agent-context-${agentId}`;
      
      // Store agent context
      const context = {
        currentTask: 'analyze-codebase',
        progress: 0.6,
        intermediateResults: [
          { file: 'app.js', status: 'analyzed' },
          { file: 'utils.js', status: 'analyzing' }
        ],
        sessionData: {
          startTime: Date.now(),
          tokensUsed: 15000,
          maxTokens: 200000
        }
      };
      
      await this.memoryStore.set(contextKey, context, {
        namespace: this.memoryStore.namespaces.AGENT_CONTEXT,
        dataType: this.memoryStore.dataTypes.PERSISTENT,
        agentId: agentId
      });
      
      // Simulate agent restart - context should be preserved
      const preservedContext = await this.memoryStore.get(contextKey, {
        agentId: agentId,
        includeMetadata: true
      });
      
      this.assert(preservedContext.found, 'Context should be preserved');
      this.assert(preservedContext.value.currentTask === 'analyze-codebase', 'Task should be preserved');
      this.assert(preservedContext.value.progress === 0.6, 'Progress should be preserved');
      this.assert(preservedContext.value.intermediateResults.length === 2, 'Intermediate results should be preserved');
      
      // Update context (simulating progress)
      context.progress = 0.8;
      context.intermediateResults[1].status = 'analyzed';
      context.intermediateResults.push({ file: 'config.js', status: 'analyzing' });
      
      await this.memoryStore.set(contextKey, context, {
        namespace: this.memoryStore.namespaces.AGENT_CONTEXT,
        dataType: this.memoryStore.dataTypes.PERSISTENT,
        agentId: agentId
      });
      
      const updatedContext = await this.memoryStore.get(contextKey, { agentId: agentId });
      this.assert(updatedContext.progress === 0.8, 'Updated progress should be preserved');
      this.assert(updatedContext.intermediateResults.length === 3, 'Updated results should be preserved');
      
      this.addTestResult('Context Preservation', true, 'Agent context preservation works correctly');
      
    } catch (error) {
      this.addTestResult('Context Preservation', false, `Context preservation failed: ${error.message}`);
    }
  }
  
  /**
   * Test result caching
   */
  async testResultCaching() {
    console.log('🗄️ Testing result caching...');
    
    try {
      const cacheKey = 'expensive-computation-result';
      
      // Simulate expensive computation result
      const computationResult = {
        input: { algorithm: 'complex-analysis', dataset: 'large-codebase' },
        output: { 
          complexity: 'high',
          maintainability: 0.7,
          recommendations: ['refactor-module-x', 'optimize-algorithm-y']
        },
        metadata: {
          computationTime: 45000, // 45 seconds
          memoryUsed: '500MB',
          cacheUntil: Date.now() + (60 * 60 * 1000) // 1 hour
        }
      };
      
      // Cache the result
      await this.memoryStore.set(cacheKey, computationResult, {
        namespace: this.memoryStore.namespaces.CACHE,
        dataType: this.memoryStore.dataTypes.CACHED,
        ttl: 60 * 60 * 1000, // 1 hour cache
        agentId: 'computation-agent'
      });
      
      // Retrieve cached result (should be fast)
      const startTime = Date.now();
      const cachedResult = await this.memoryStore.get(cacheKey, {
        agentId: 'requesting-agent'
      });
      const retrievalTime = Date.now() - startTime;
      
      this.assert(cachedResult !== null, 'Cached result should be retrievable');
      this.assert(cachedResult.output.complexity === 'high', 'Cached data should be intact');
      this.assert(retrievalTime < 100, 'Cache retrieval should be fast (< 100ms)');
      
      // Test cache key pattern matching
      const cacheKeys = await this.memoryStore.keys({
        namespace: this.memoryStore.namespaces.CACHE,
        pattern: 'expensive-.*'
      });
      
      this.assert(cacheKeys.includes(cacheKey), 'Cache key should be found by pattern');
      
      this.addTestResult('Result Caching', true, 'Result caching and retrieval work correctly');
      
    } catch (error) {
      this.addTestResult('Result Caching', false, `Result caching failed: ${error.message}`);
    }
  }
  
  /**
   * Test memory limits and enforcement
   */
  async testMemoryLimits() {
    console.log('📏 Testing memory limits...');
    
    try {
      // Get current memory usage
      const initialStats = this.memoryStore.getStats();
      const initialMemoryUsage = initialStats.memoryUsage;
      
      // Try to add data within limits
      const smallData = { data: 'small data chunk' };
      await this.memoryStore.set('small-data', smallData);
      
      // Add larger data chunks approaching the limit
      const largeDataChunk = 'x'.repeat(1024 * 1024); // 1MB string
      
      for (let i = 0; i < 8; i++) { // Add 8MB of data
        await this.memoryStore.set(`large-data-${i}`, { chunk: largeDataChunk });
      }
      
      const afterLargeStats = this.memoryStore.getStats();
      this.assert(afterLargeStats.memoryUsage > initialMemoryUsage, 'Memory usage should increase');
      
      // Try to exceed memory limit (should trigger eviction or fail)
      try {
        const veryLargeChunk = 'x'.repeat(5 * 1024 * 1024); // 5MB
        await this.memoryStore.set('very-large-data', { chunk: veryLargeChunk });
        
        // If we reach here, eviction should have occurred
        const finalStats = this.memoryStore.getStats();
        this.assert(finalStats.evictions > 0, 'Memory limit enforcement should trigger evictions');
        
      } catch (memoryError) {
        // This is acceptable - memory limit exceeded
        this.assert(memoryError.message.includes('Memory limit exceeded'), 'Should get memory limit error');
      }
      
      this.addTestResult('Memory Limits', true, 'Memory limit enforcement works correctly');
      
    } catch (error) {
      this.addTestResult('Memory Limits', false, `Memory limit testing failed: ${error.message}`);
    }
  }
  
  /**
   * Test garbage collection
   */
  async testGarbageCollection() {
    console.log('🗑️ Testing garbage collection...');
    
    try {
      const initialStats = this.memoryStore.getStats();
      const initialGCRuns = initialStats.gcRuns;
      
      // Add some data with short TTL
      for (let i = 0; i < 10; i++) {
        await this.memoryStore.set(`gc-test-${i}`, { data: `test data ${i}` }, {
          ttl: 500 // 500ms TTL
        });
      }
      
      // Wait for TTL to expire and GC to run
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if garbage collection occurred
      const afterGCStats = this.memoryStore.getStats();
      this.assert(afterGCStats.gcRuns > initialGCRuns, 'Garbage collection should have run');
      
      // Verify expired data was cleaned up
      const expiredValue = await this.memoryStore.get('gc-test-0');
      this.assert(expiredValue === null, 'Expired data should be cleaned up by GC');
      
      // Test manual garbage collection
      await this.memoryStore.runGarbageCollection();
      
      const manualGCStats = this.memoryStore.getStats();
      this.assert(manualGCStats.gcRuns === afterGCStats.gcRuns + 1, 'Manual GC should increment run count');
      
      this.addTestResult('Garbage Collection', true, 'Garbage collection works correctly');
      
    } catch (error) {
      this.addTestResult('Garbage Collection', false, `Garbage collection failed: ${error.message}`);
    }
  }
  
  /**
   * Test performance metrics
   */
  async testPerformanceMetrics() {
    console.log('📊 Testing performance metrics...');
    
    try {
      const initialStats = this.memoryStore.getStats();
      
      // Perform multiple operations to generate metrics
      for (let i = 0; i < 100; i++) {
        await this.memoryStore.set(`perf-test-${i}`, { index: i });
        await this.memoryStore.get(`perf-test-${i}`);
      }
      
      const finalStats = this.memoryStore.getStats();
      
      // Verify metrics were tracked
      this.assert(finalStats.reads > initialStats.reads, 'Read count should increase');
      this.assert(finalStats.writes > initialStats.writes, 'Write count should increase');
      this.assert(finalStats.hits > initialStats.hits, 'Cache hits should increase');
      
      // Check performance averages
      this.assert(finalStats.averageReadTime >= 0, 'Average read time should be tracked');
      this.assert(finalStats.averageWriteTime >= 0, 'Average write time should be tracked');
      
      // Check cache hit rate
      this.assert(finalStats.cacheHitRate.includes('%'), 'Cache hit rate should be a percentage');
      
      this.addTestResult('Performance Metrics', true, 'Performance metrics tracking works correctly');
      
    } catch (error) {
      this.addTestResult('Performance Metrics', false, `Performance metrics failed: ${error.message}`);
    }
  }
  
  /**
   * Test SQLite integration
   */
  async testSQLiteIntegration() {
    console.log('🗃️ Testing SQLite integration...');
    
    try {
      const dbStatus = this.memoryStore.dbStatus;
      
      if (dbStatus.available) {
        // Test SQLite persistence
        await this.memoryStore.set('sqlite-test', { persistent: true }, {
          dataType: this.memoryStore.dataTypes.PERSISTENT
        });
        
        // Verify data is in SQLite (by attempting to get it after clearing cache)
        this.memoryStore.memoryCache.clear();
        
        const persistedValue = await this.memoryStore.get('sqlite-test');
        this.assert(persistedValue?.persistent === true, 'Data should persist in SQLite');
        
        this.addTestResult('SQLite Integration', true, 'SQLite persistence works correctly');
        
      } else {
        // SQLite not available, test file-based fallback
        this.assert(dbStatus.fallback === 'file_based', 'Should fallback to file-based storage');
        
        this.addTestResult('SQLite Integration', true, 'File-based fallback configured correctly');
      }
      
    } catch (error) {
      this.addTestResult('SQLite Integration', false, `SQLite integration failed: ${error.message}`);
    }
  }
  
  /**
   * Test file-based fallback
   */
  async testFileBasedFallback() {
    console.log('📁 Testing file-based fallback...');
    
    try {
      // Force save to files
      await this.memoryStore.saveToFiles();
      
      // Check if backup files were created
      const hiveMindPath = path.join(this.testProjectRoot, '.hive-mind');
      const memoryFile = path.join(hiveMindPath, 'shared-memory.json');
      
      try {
        const stats = await fs.stat(memoryFile);
        this.assert(stats.isFile(), 'Memory file should be created');
        
        // Verify file content
        const fileContent = await fs.readFile(memoryFile, 'utf-8');
        const parsed = JSON.parse(fileContent);
        
        this.assert(parsed.entries && typeof parsed.entries === 'object', 'File should contain entries');
        this.assert(parsed.metadata && typeof parsed.metadata === 'object', 'File should contain metadata');
        this.assert(typeof parsed.timestamp === 'number', 'File should contain timestamp');
        
        this.addTestResult('File-Based Fallback', true, 'File-based persistence works correctly');
        
      } catch (fileError) {
        this.addTestResult('File-Based Fallback', false, `File operations failed: ${fileError.message}`);
      }
      
    } catch (error) {
      this.addTestResult('File-Based Fallback', false, `File-based fallback failed: ${error.message}`);
    }
  }
  
  /**
   * Cleanup test environment
   */
  async cleanupTestEnvironment() {
    console.log('🧹 Cleaning up test environment...');
    
    try {
      if (this.memoryStore) {
        await this.memoryStore.shutdown();
      }
      
      // Clean up test files
      try {
        await fs.rm(this.testProjectRoot, { recursive: true, force: true });
      } catch (cleanupError) {
        console.warn('Warning: Could not fully clean up test directory:', cleanupError.message);
      }
      
      this.addTestResult('Environment Cleanup', true, 'Test environment cleaned up successfully');
      
    } catch (error) {
      this.addTestResult('Environment Cleanup', false, `Cleanup failed: ${error.message}`);
    }
  }
  
  /**
   * Add test result
   */
  addTestResult(testName, passed, message) {
    this.testResults.push({
      test: testName,
      passed,
      message,
      timestamp: Date.now()
    });
  }
  
  /**
   * Assert helper
   */
  assert(condition, message) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }
  
  /**
   * Print test results summary
   */
  printTestResults() {
    console.log('\n📋 Test Results Summary');
    console.log('='.repeat(50));
    
    let passed = 0;
    let failed = 0;
    
    for (const result of this.testResults) {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${result.test}: ${result.message}`);
      
      if (result.passed) {
        passed++;
      } else {
        failed++;
      }
    }
    
    console.log('='.repeat(50));
    console.log(`Total Tests: ${this.testResults.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / this.testResults.length) * 100).toFixed(1)}%`);
    
    if (failed === 0) {
      console.log('\n🎉 All tests passed! SharedMemoryStore is working correctly.');
    } else {
      console.log(`\n⚠️ ${failed} test(s) failed. Please review the implementation.`);
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new SharedMemoryTester();
  tester.runAllTests().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = SharedMemoryTester;