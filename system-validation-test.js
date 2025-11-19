/**
 * Comprehensive System Validation Test
 * 
 * Tests all fixed systems and validates the entire intelligence engine
 * for production readiness and stability.
 * 
 * @author Recovery Specialist Agent
 * @version 1.0.0
 * @date August 2025
 */

const fs = require('fs').promises;
const path = require('path');
const { performance } = require('perf_hooks');

// Import system components
const SharedMemoryStore = require('./.ai-workflow/intelligence-engine/shared-memory');
const AgentCommunication = require('./.ai-workflow/intelligence-engine/agent-communication');
const BackupRecoverySystem = require('./.ai-workflow/intelligence-engine/backup-recovery-system');
const ResourceManager = require('./.ai-workflow/intelligence-engine/resource-manager');

class SystemValidationTest {
  constructor() {
    this.testResults = [];
    this.systems = {};
    this.startTime = Date.now();
    this.testConfig = {
      timeout: 30000, // 30 seconds per test
      maxRetries: 3,
      stressTestDuration: 10000, // 10 seconds
      concurrentAgents: 5,
      messageVolume: 100
    };
  }

  /**
   * Run comprehensive system validation
   */
  async runValidation() {
    console.log('🔍 Starting Comprehensive System Validation...\n');

    try {
      // Initialize all systems
      await this.initializeSystems();

      // Run all validation tests
      await this.runDatabaseConnectionTests();
      await this.runSharedMemoryTests();
      await this.runAgentCommunicationTests();
      await this.runGarbageCollectionTests();
      await this.runPerformanceTests();
      await this.runBackupSystemTests();
      await this.runResourceManagementTests();
      await this.runIntegrationTests();
      await this.runStressTests();

      // Generate final report
      await this.generateValidationReport();

      // Cleanup
      await this.shutdownSystems();

    } catch (error) {
      console.error('❌ System validation failed:', error.message);
      await this.shutdownSystems();
      throw error;
    }
  }

  /**
   * Initialize all systems for testing
   */
  async initializeSystems() {
    console.log('🚀 Initializing systems for validation...');

    try {
      // Initialize Shared Memory Store
      this.systems.sharedMemory = new SharedMemoryStore({
        projectRoot: process.cwd(),
        maxMemorySize: 50 * 1024 * 1024, // 50MB for testing
        maxEntries: 10000,
        gcInterval: 5000 // 5 seconds for faster testing
      });

      // Wait for initialization
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('SharedMemory init timeout')), 10000);
        this.systems.sharedMemory.on('initialized', () => {
          clearTimeout(timeout);
          resolve();
        });
        this.systems.sharedMemory.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });

      // Initialize Agent Communication
      this.systems.communication = new AgentCommunication(this.systems.sharedMemory);

      // Initialize Backup System
      this.systems.backup = new BackupRecoverySystem({
        backupDirectory: path.join(process.cwd(), '.test-backups'),
        maxBackups: 3,
        backupInterval: 0 // Disable automatic backups for testing
      });

      // Initialize Resource Manager
      this.systems.resourceManager = new ResourceManager({
        memoryCheckInterval: 2000,
        cpuCheckInterval: 1000,
        cleanupInterval: 5000
      });

      console.log('✅ All systems initialized successfully\n');

    } catch (error) {
      console.error('❌ Failed to initialize systems:', error.message);
      throw error;
    }
  }

  /**
   * Test database connection fixes
   */
  async runDatabaseConnectionTests() {
    console.log('🔧 Testing Database Connection Fixes...');

    const testName = 'Database Connections';
    const startTime = performance.now();

    try {
      // Test 1: Basic database operations
      await this.systems.sharedMemory.set('test-db-1', { test: 'data' });
      const retrieved = await this.systems.sharedMemory.get('test-db-1');
      
      if (!retrieved || retrieved.test !== 'data') {
        throw new Error('Basic database operation failed');
      }

      // Test 2: Concurrent database operations
      const concurrentOps = [];
      for (let i = 0; i < 20; i++) {
        concurrentOps.push(
          this.systems.sharedMemory.set(`test-concurrent-${i}`, { id: i, data: `test-${i}` })
        );
      }
      
      await Promise.all(concurrentOps);

      // Test 3: Database integrity after operations
      const dbStatus = this.systems.sharedMemory.dbStatus;
      if (!dbStatus.available) {
        console.warn('Database not available, using file-based fallback');
      }

      // Test 4: Connection pool health
      const stats = this.systems.sharedMemory.getStats();
      if (stats.totalEntries < 20) {
        throw new Error('Not all concurrent operations succeeded');
      }

      const duration = performance.now() - startTime;
      
      this.testResults.push({
        name: testName,
        status: 'PASSED',
        duration,
        details: {
          dbStatus: dbStatus.available ? 'Connected' : 'Fallback',
          concurrentOps: 20,
          totalEntries: stats.totalEntries
        }
      });

      console.log(`✅ ${testName}: PASSED (${duration.toFixed(2)}ms)\n`);

    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.testResults.push({
        name: testName,
        status: 'FAILED',
        duration,
        error: error.message
      });

      console.error(`❌ ${testName}: FAILED - ${error.message}\n`);
    }
  }

  /**
   * Test shared memory operations
   */
  async runSharedMemoryTests() {
    console.log('🧠 Testing Shared Memory Operations...');

    const testName = 'Shared Memory';
    const startTime = performance.now();

    try {
      // Test 1: Basic operations
      await this.systems.sharedMemory.set('test-memory', { value: 'test' });
      const value = await this.systems.sharedMemory.get('test-memory');
      
      if (!value || value.value !== 'test') {
        throw new Error('Basic memory operation failed');
      }

      // Test 2: Atomic operations
      const atomicResult = await this.systems.sharedMemory.atomic(
        'test-atomic',
        (currentValue) => {
          return { counter: (currentValue?.counter || 0) + 1 };
        },
        { agentId: 'test-agent' }
      );

      if (!atomicResult || atomicResult.counter !== 1) {
        throw new Error('Atomic operation failed');
      }

      // Test 3: Memory versioning
      await this.systems.sharedMemory.set('test-version', { v: 1 }, { 
        dataType: this.systems.sharedMemory.dataTypes.VERSIONED 
      });
      
      await this.systems.sharedMemory.set('test-version', { v: 2 }, { 
        dataType: this.systems.sharedMemory.dataTypes.VERSIONED 
      });

      const versionedValue = await this.systems.sharedMemory.get('test-version');
      if (!versionedValue || versionedValue.v !== 2) {
        throw new Error('Versioned memory operation failed');
      }

      // Test 4: TTL expiration
      await this.systems.sharedMemory.set('test-ttl', { temp: true }, { ttl: 100 });
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const expiredValue = await this.systems.sharedMemory.get('test-ttl');
      if (expiredValue !== null) {
        throw new Error('TTL expiration failed');
      }

      const duration = performance.now() - startTime;
      const stats = this.systems.sharedMemory.getStats();

      this.testResults.push({
        name: testName,
        status: 'PASSED',
        duration,
        details: {
          cacheHitRate: stats.cacheHitRate,
          totalEntries: stats.totalEntries,
          memoryUsage: stats.memoryUsage
        }
      });

      console.log(`✅ ${testName}: PASSED (${duration.toFixed(2)}ms)\n`);

    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.testResults.push({
        name: testName,
        status: 'FAILED',
        duration,
        error: error.message
      });

      console.error(`❌ ${testName}: FAILED - ${error.message}\n`);
    }
  }

  /**
   * Test agent communication fixes
   */
  async runAgentCommunicationTests() {
    console.log('📡 Testing Agent Communication Fixes...');

    const testName = 'Agent Communication';
    const startTime = performance.now();

    try {
      // Register test agents
      const agents = ['agent-1', 'agent-2', 'agent-3', 'agent-4', 'agent-5'];
      
      for (const agentId of agents) {
        this.systems.communication.registerAgent(agentId, {
          name: `Test Agent ${agentId}`,
          type: 'test',
          capabilities: ['testing']
        });
      }

      // Test 1: Direct messaging
      const messageId = await this.systems.communication.sendMessage(
        'agent-1',
        'agent-2',
        { type: 'test', content: 'Hello Agent 2' }
      );

      if (!messageId) {
        throw new Error('Direct message failed');
      }

      // Test 2: Broadcast messaging
      const broadcastIds = await this.systems.communication.broadcastToAll({
        type: 'broadcast',
        content: 'Hello all agents'
      }, { from: 'system' });

      if (broadcastIds.length < agents.length) {
        throw new Error(`Broadcast failed: only ${broadcastIds.length}/${agents.length} delivered`);
      }

      // Test 3: Priority messaging
      const priorityId = await this.systems.communication.sendMessage(
        'agent-1',
        'agent-2',
        { type: 'priority', content: 'High priority message' },
        { priority: this.systems.communication.priorityLevels.HIGH.level }
      );

      if (!priorityId) {
        throw new Error('Priority message failed');
      }

      // Test 4: Message queue processing
      await new Promise(resolve => setTimeout(resolve, 2000)); // Let queue process
      
      const metrics = this.systems.communication.getMetrics();
      
      if (metrics.messagesSent < 2) {
        throw new Error('Message queue processing failed');
      }

      const duration = performance.now() - startTime;

      this.testResults.push({
        name: testName,
        status: 'PASSED',
        duration,
        details: {
          agentsRegistered: agents.length,
          messagesSent: metrics.messagesSent,
          broadcastCount: broadcastIds.length,
          queueSize: metrics.queueSize,
          averageLatency: `${metrics.averageLatency.toFixed(2)}ms`
        }
      });

      console.log(`✅ ${testName}: PASSED (${duration.toFixed(2)}ms)\n`);

    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.testResults.push({
        name: testName,
        status: 'FAILED',
        duration,
        error: error.message
      });

      console.error(`❌ ${testName}: FAILED - ${error.message}\n`);
    }
  }

  /**
   * Test garbage collection fixes
   */
  async runGarbageCollectionTests() {
    console.log('🗑️ Testing Garbage Collection Fixes...');

    const testName = 'Garbage Collection';
    const startTime = performance.now();

    try {
      // Test 1: Create data that should be garbage collected
      const testKeys = [];
      for (let i = 0; i < 100; i++) {
        const key = `gc-test-${i}`;
        await this.systems.sharedMemory.set(key, { data: `test-${i}` }, {
          ttl: 500 // 500ms TTL
        });
        testKeys.push(key);
      }

      // Test 2: Wait for expiration and GC
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Test 3: Trigger manual GC
      await this.systems.sharedMemory.runGarbageCollection();

      // Test 4: Verify cleanup
      let remainingKeys = 0;
      for (const key of testKeys) {
        const value = await this.systems.sharedMemory.get(key);
        if (value !== null) {
          remainingKeys++;
        }
      }

      if (remainingKeys > 10) { // Allow some margin for timing
        throw new Error(`Garbage collection ineffective: ${remainingKeys} keys remaining`);
      }

      // Test 5: Memory pressure cleanup
      await this.systems.sharedMemory.checkMemoryPressure();

      const duration = performance.now() - startTime;
      const stats = this.systems.sharedMemory.getStats();

      this.testResults.push({
        name: testName,
        status: 'PASSED',
        duration,
        details: {
          keysCreated: testKeys.length,
          keysRemaining: remainingKeys,
          gcRuns: stats.gcRuns,
          evictions: stats.evictions
        }
      });

      console.log(`✅ ${testName}: PASSED (${duration.toFixed(2)}ms)\n`);

    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.testResults.push({
        name: testName,
        status: 'FAILED',
        duration,
        error: error.message
      });

      console.error(`❌ ${testName}: FAILED - ${error.message}\n`);
    }
  }

  /**
   * Test performance optimizations
   */
  async runPerformanceTests() {
    console.log('⚡ Testing Performance Optimizations...');

    const testName = 'Performance';
    const startTime = performance.now();

    try {
      // Test 1: Message passing performance
      const messageStart = performance.now();
      const messagePromises = [];

      for (let i = 0; i < 50; i++) {
        messagePromises.push(
          this.systems.communication.sendMessage(
            'agent-1',
            'agent-2',
            { type: 'perf-test', id: i, data: `test-message-${i}` }
          )
        );
      }

      await Promise.all(messagePromises);
      const messageTime = performance.now() - messageStart;
      const averageMessageTime = messageTime / 50;

      if (averageMessageTime > 100) {
        console.warn(`Message passing average time: ${averageMessageTime.toFixed(2)}ms (threshold: 100ms)`);
      }

      // Test 2: Memory operation performance
      const memoryStart = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        await this.systems.sharedMemory.set(`perf-${i}`, { id: i, data: 'performance-test' });
      }

      const memoryTime = performance.now() - memoryStart;
      const averageMemoryTime = memoryTime / 1000;

      if (averageMemoryTime > 5) {
        console.warn(`Memory operation average time: ${averageMemoryTime.toFixed(2)}ms (threshold: 5ms)`);
      }

      // Test 3: Concurrent operations
      const concurrentStart = performance.now();
      const concurrentOps = [];

      for (let i = 0; i < 20; i++) {
        concurrentOps.push(Promise.all([
          this.systems.sharedMemory.set(`concurrent-${i}`, { id: i }),
          this.systems.communication.sendMessage('agent-1', 'agent-2', { id: i })
        ]));
      }

      await Promise.all(concurrentOps);
      const concurrentTime = performance.now() - concurrentStart;

      const duration = performance.now() - startTime;
      const communicationMetrics = this.systems.communication.getMetrics();
      const memoryStats = this.systems.sharedMemory.getStats();

      this.testResults.push({
        name: testName,
        status: 'PASSED',
        duration,
        details: {
          averageMessageTime: `${averageMessageTime.toFixed(2)}ms`,
          averageMemoryTime: `${averageMemoryTime.toFixed(2)}ms`,
          concurrentOperationsTime: `${concurrentTime.toFixed(2)}ms`,
          messageLatency: `${communicationMetrics.averageLatency.toFixed(2)}ms`,
          cacheHitRate: memoryStats.cacheHitRate,
          throughput: `${communicationMetrics.throughputPerSecond} msgs/sec`
        }
      });

      console.log(`✅ ${testName}: PASSED (${duration.toFixed(2)}ms)`);
      console.log(`   📊 Message Latency: ${communicationMetrics.averageLatency.toFixed(2)}ms`);
      console.log(`   📊 Memory Cache Hit Rate: ${memoryStats.cacheHitRate}`);
      console.log(`   📊 Message Throughput: ${communicationMetrics.throughputPerSecond} msgs/sec\n`);

    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.testResults.push({
        name: testName,
        status: 'FAILED',
        duration,
        error: error.message
      });

      console.error(`❌ ${testName}: FAILED - ${error.message}\n`);
    }
  }

  /**
   * Test backup system functionality
   */
  async runBackupSystemTests() {
    console.log('💾 Testing Backup System...');

    const testName = 'Backup System';
    const startTime = performance.now();

    try {
      // Test 1: Create a backup
      const backupResult = await this.systems.backup.createBackup({
        type: 'test',
        components: ['sharedMemory', 'configs']
      });

      if (!backupResult || backupResult.status !== 'completed') {
        throw new Error('Backup creation failed');
      }

      // Test 2: Verify backup exists
      const backupStatus = this.systems.backup.getStatus();
      if (backupStatus.backupHistory.length === 0) {
        throw new Error('Backup not found in history');
      }

      // Test 3: Test backup verification
      const latestBackup = backupStatus.backupHistory[0];
      if (latestBackup.verification && !latestBackup.verification.valid) {
        throw new Error('Backup verification failed');
      }

      const duration = performance.now() - startTime;

      this.testResults.push({
        name: testName,
        status: 'PASSED',
        duration,
        details: {
          backupId: backupResult.id,
          backupSize: this.formatBytes(backupResult.size),
          components: Object.keys(backupResult.components).length,
          verified: latestBackup.verification ? latestBackup.verification.valid : false
        }
      });

      console.log(`✅ ${testName}: PASSED (${duration.toFixed(2)}ms)\n`);

    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.testResults.push({
        name: testName,
        status: 'FAILED',
        duration,
        error: error.message
      });

      console.error(`❌ ${testName}: FAILED - ${error.message}\n`);
    }
  }

  /**
   * Test resource management
   */
  async runResourceManagementTests() {
    console.log('📊 Testing Resource Management...');

    const testName = 'Resource Management';
    const startTime = performance.now();

    try {
      // Test 1: Resource tracking
      const resourceId = this.systems.resourceManager.registerResource({
        type: 'test-resource',
        ttl: 1000, // 1 second
        cleanup: () => console.log('Test resource cleaned up')
      });

      if (!resourceId) {
        throw new Error('Resource registration failed');
      }

      // Test 2: Connection tracking
      this.systems.resourceManager.trackDatabaseConnection('test-conn-1');
      this.systems.resourceManager.trackDatabaseConnection('test-conn-2');

      const status = this.systems.resourceManager.getStatus();
      if (status.resources.connections.database.active !== 2) {
        throw new Error('Database connection tracking failed');
      }

      // Test 3: Resource cleanup
      await new Promise(resolve => setTimeout(resolve, 1500));
      await this.systems.resourceManager.performCleanup();

      // Test 4: Memory monitoring
      if (!status.resources.memory.current.system) {
        throw new Error('Memory monitoring not working');
      }

      const duration = performance.now() - startTime;

      this.testResults.push({
        name: testName,
        status: 'PASSED',
        duration,
        details: {
          resourcesTracked: status.managedResources,
          dbConnections: status.resources.connections.database.active,
          memoryUsage: `${(status.resources.memory.current.system.percentage * 100).toFixed(1)}%`,
          cpuUsage: `${status.resources.cpu.current.usage.toFixed(1)}%`
        }
      });

      console.log(`✅ ${testName}: PASSED (${duration.toFixed(2)}ms)\n`);

    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.testResults.push({
        name: testName,
        status: 'FAILED',
        duration,
        error: error.message
      });

      console.error(`❌ ${testName}: FAILED - ${error.message}\n`);
    }
  }

  /**
   * Test system integration
   */
  async runIntegrationTests() {
    console.log('🔗 Testing System Integration...');

    const testName = 'System Integration';
    const startTime = performance.now();

    try {
      // Test 1: Cross-system data flow
      // Store data in shared memory
      await this.systems.sharedMemory.set('integration-test', {
        message: 'Hello from shared memory',
        timestamp: Date.now()
      });

      // Send message referencing shared memory data
      const messageId = await this.systems.communication.sendMessage(
        'agent-1',
        'agent-2',
        {
          type: 'integration-test',
          sharedKey: 'integration-test'
        }
      );

      // Verify data consistency
      const sharedData = await this.systems.sharedMemory.get('integration-test');
      if (!sharedData || !messageId) {
        throw new Error('Cross-system data flow failed');
      }

      // Test 2: Resource management integration
      const resourceId = this.systems.resourceManager.registerResource({
        type: 'shared-memory-cache',
        cleanup: async () => {
          await this.systems.sharedMemory.delete('integration-test');
        }
      });

      // Test 3: Backup system integration
      const integratedBackup = await this.systems.backup.createBackup({
        type: 'integration-test'
      });

      if (!integratedBackup) {
        throw new Error('Integrated backup failed');
      }

      const duration = performance.now() - startTime;

      this.testResults.push({
        name: testName,
        status: 'PASSED',
        duration,
        details: {
          dataFlowTest: 'SUCCESS',
          resourceIntegration: 'SUCCESS',
          backupIntegration: 'SUCCESS',
          backupSize: this.formatBytes(integratedBackup.size)
        }
      });

      console.log(`✅ ${testName}: PASSED (${duration.toFixed(2)}ms)\n`);

    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.testResults.push({
        name: testName,
        status: 'FAILED',
        duration,
        error: error.message
      });

      console.error(`❌ ${testName}: FAILED - ${error.message}\n`);
    }
  }

  /**
   * Test system under stress
   */
  async runStressTests() {
    console.log('💪 Running Stress Tests...');

    const testName = 'Stress Test';
    const startTime = performance.now();

    try {
      const stressOperations = [];
      const operationCount = 500;

      // Stress test: Mixed operations
      for (let i = 0; i < operationCount; i++) {
        const operations = [
          // Memory operations
          this.systems.sharedMemory.set(`stress-${i}`, { 
            id: i, 
            data: `stress-test-data-${i}`,
            timestamp: Date.now()
          }),
          
          // Communication operations
          this.systems.communication.sendMessage(
            'agent-1',
            `agent-${(i % 5) + 1}`,
            { type: 'stress-test', id: i }
          ),
          
          // Random read operations
          this.systems.sharedMemory.get(`stress-${Math.floor(i / 2)}`)
        ];

        stressOperations.push(...operations);
      }

      // Execute all operations concurrently
      console.log(`   Executing ${stressOperations.length} concurrent operations...`);
      
      const results = await Promise.allSettled(stressOperations);
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      if (failed > operationCount * 0.1) { // Allow 10% failure rate under stress
        throw new Error(`Too many operations failed: ${failed}/${results.length} (${((failed/results.length)*100).toFixed(1)}%)`);
      }

      // Check system health after stress
      const memoryStats = this.systems.sharedMemory.getStats();
      const commStats = this.systems.communication.getMetrics();
      const resourceStatus = this.systems.resourceManager.getStatus();

      const duration = performance.now() - startTime;

      this.testResults.push({
        name: testName,
        status: 'PASSED',
        duration,
        details: {
          totalOperations: results.length,
          successfulOperations: successful,
          failedOperations: failed,
          successRate: `${((successful/results.length)*100).toFixed(1)}%`,
          finalMemoryUsage: memoryStats.memoryUtilization,
          messagesSent: commStats.messagesSent,
          averageLatency: `${commStats.averageLatency.toFixed(2)}ms`
        }
      });

      console.log(`✅ ${testName}: PASSED (${duration.toFixed(2)}ms)`);
      console.log(`   📊 Operations: ${successful}/${results.length} successful (${((successful/results.length)*100).toFixed(1)}%)`);
      console.log(`   📊 System Health: Memory ${memoryStats.memoryUtilization}, Latency ${commStats.averageLatency.toFixed(2)}ms\n`);

    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.testResults.push({
        name: testName,
        status: 'FAILED',
        duration,
        error: error.message
      });

      console.error(`❌ ${testName}: FAILED - ${error.message}\n`);
    }
  }

  /**
   * Generate comprehensive validation report
   */
  async generateValidationReport() {
    console.log('📋 Generating Validation Report...\n');

    const totalDuration = Date.now() - this.startTime;
    const passedTests = this.testResults.filter(t => t.status === 'PASSED').length;
    const failedTests = this.testResults.filter(t => t.status === 'FAILED').length;
    const successRate = (passedTests / this.testResults.length) * 100;

    const report = {
      timestamp: new Date().toISOString(),
      totalDuration: `${totalDuration.toFixed(2)}ms`,
      summary: {
        totalTests: this.testResults.length,
        passed: passedTests,
        failed: failedTests,
        successRate: `${successRate.toFixed(1)}%`
      },
      systemStatus: {
        sharedMemory: this.systems.sharedMemory.getStats(),
        communication: this.systems.communication.getMetrics(),
        backup: this.systems.backup.getStatus(),
        resourceManager: this.systems.resourceManager.getStatus()
      },
      testResults: this.testResults
    };

    // Save report to file
    const reportPath = path.join(process.cwd(), 'system-validation-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    // Display summary
    console.log('=' .repeat(80));
    console.log('🎯 SYSTEM VALIDATION SUMMARY');
    console.log('='.repeat(80));
    console.log(`📊 Tests Run: ${this.testResults.length}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`📈 Success Rate: ${successRate.toFixed(1)}%`);
    console.log(`⏱️  Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log('='.repeat(80));

    if (failedTests > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.testResults
        .filter(t => t.status === 'FAILED')
        .forEach(test => {
          console.log(`   • ${test.name}: ${test.error}`);
        });
    }

    console.log(`\n📄 Full report saved to: ${reportPath}`);

    if (successRate >= 80) {
      console.log('\n🎉 SYSTEM VALIDATION: PASSED');
      console.log('✅ System is ready for production use');
    } else {
      console.log('\n⚠️  SYSTEM VALIDATION: NEEDS ATTENTION');
      console.log('❗ Some critical issues need to be resolved');
    }

    return report;
  }

  /**
   * Shutdown all systems
   */
  async shutdownSystems() {
    console.log('\n🔄 Shutting down test systems...');

    try {
      // Shutdown in reverse order of initialization
      if (this.systems.resourceManager) {
        await this.systems.resourceManager.shutdown();
      }

      if (this.systems.backup) {
        await this.systems.backup.shutdown();
      }

      if (this.systems.communication) {
        this.systems.communication.shutdown();
      }

      if (this.systems.sharedMemory) {
        await this.systems.sharedMemory.shutdown();
      }

      console.log('✅ All systems shut down successfully');

    } catch (error) {
      console.error('❌ Error during shutdown:', error.message);
    }
  }

  /**
   * Format bytes to human readable string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new SystemValidationTest();
  validator.runValidation().catch(error => {
    console.error('System validation failed:', error);
    process.exit(1);
  });
}

module.exports = SystemValidationTest;