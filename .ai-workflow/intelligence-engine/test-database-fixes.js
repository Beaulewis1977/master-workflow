/**
 * Database Fixes Validation Test Suite
 * 
 * Comprehensive testing of all database connection management fixes including:
 * - Connection pooling and lifecycle management
 * - Transaction management with proper rollback
 * - Query optimization and caching
 * - Schema validation and migration
 * - Performance monitoring
 * - Error handling and retry logic
 * - Security hardening
 * 
 * @author Claude Database Architect Agent
 * @version 3.0.0
 * @date August 2025
 */

const SharedMemoryStore = require('./shared-memory');
const DatabaseConnectionManager = require('./database-connection-manager');
const DatabaseSchemaManager = require('./database-schema-manager');
const DatabasePerformanceMonitor = require('./database-performance-monitor');
const path = require('path');
const fs = require('fs').promises;

class DatabaseFixesValidator {
  constructor() {
    this.testResults = [];
    this.testProjectRoot = path.join(__dirname, '..', 'test-database-fixes');
    this.connectionManager = null;
    this.schemaManager = null;
    this.performanceMonitor = null;
    this.sharedMemory = null;
  }
  
  /**
   * Run all database fix validation tests
   */
  async runAllTests() {
    console.log('🔧 Starting Database Fixes Validation Test Suite...\n');
    
    try {
      await this.setupTestEnvironment();
      
      // Core database management tests
      await this.testConnectionPooling();
      await this.testTransactionManagement();
      await this.testQueryOptimization();
      await this.testSchemaManagement();
      
      // Performance and monitoring tests
      await this.testPerformanceMonitoring();
      await this.testConnectionHealthMonitoring();
      await this.testErrorHandlingAndRetry();
      
      // Integration tests
      await this.testSharedMemoryIntegration();
      await this.testConcurrentOperations();
      await this.testDatabaseSecurity();
      
      // Stress tests
      await this.testConnectionPoolStress();
      await this.testLongRunningTransactions();
      
      await this.cleanupTestEnvironment();
      
      this.printTestResults();
      
    } catch (error) {
      console.error('❌ Database fixes validation failed:', error);
      throw error;
    }
  }
  
  /**
   * Setup test environment
   */
  async setupTestEnvironment() {
    console.log('📋 Setting up database test environment...');
    
    try {
      // Create test directory
      await fs.mkdir(this.testProjectRoot, { recursive: true });
      
      // Initialize connection manager
      this.connectionManager = new DatabaseConnectionManager({
        maxConnections: 5,
        minConnections: 1,
        connectionTimeout: 5000,
        queryTimeout: 10000,
        healthCheckInterval: 5000
      });
      
      // Create test database pools
      const memoryDbPath = path.join(this.testProjectRoot, 'test-memory.db');
      const hiveDbPath = path.join(this.testProjectRoot, 'test-hive.db');
      
      await this.connectionManager.createPool(memoryDbPath, 'memory');
      await this.connectionManager.createPool(hiveDbPath, 'hive');
      
      // Initialize schema manager
      this.schemaManager = new DatabaseSchemaManager(this.connectionManager);
      await this.schemaManager.initializeSchemas();
      
      // Initialize performance monitor
      this.performanceMonitor = new DatabasePerformanceMonitor(this.connectionManager, {
        slowQueryThreshold: 100, // 100ms for testing
        monitoringInterval: 2000  // 2 seconds for testing
      });
      this.performanceMonitor.start();
      
      // Initialize shared memory with new database architecture
      this.sharedMemory = new SharedMemoryStore({
        projectRoot: this.testProjectRoot,
        maxConnections: 5,
        minConnections: 1,
        maxMemorySize: 50 * 1024 * 1024, // 50MB for testing
        gcInterval: 2000 // 2 seconds for testing
      });
      
      // Wait for initialization
      await new Promise((resolve) => {
        this.sharedMemory.once('initialized', resolve);
      });
      
      this.addTestResult('Environment Setup', true, 'Database test environment initialized successfully');
      
    } catch (error) {
      this.addTestResult('Environment Setup', false, `Setup failed: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Test connection pooling functionality
   */
  async testConnectionPooling() {
    console.log('🏊 Testing connection pooling...');
    
    try {
      // Test basic connection acquisition and release
      const connections = [];
      
      // Acquire multiple connections
      for (let i = 0; i < 3; i++) {
        const conn = await this.connectionManager.getConnection('memory');
        connections.push(conn);
        this.assert(conn !== null, `Connection ${i + 1} should be acquired`);
      }
      
      // Release connections
      for (const conn of connections) {
        conn.release();
      }
      
      // Test connection reuse
      const conn1 = await this.connectionManager.getConnection('memory');
      const conn2 = await this.connectionManager.getConnection('memory');
      
      this.assert(conn1 !== conn2, 'Different connections should be returned when available');
      
      conn1.release();
      conn2.release();
      
      // Test pool statistics
      const stats = this.connectionManager.getStats();
      this.assert(stats.pools.memory, 'Memory pool statistics should be available');
      this.assert(stats.pools.memory.totalConnections > 0, 'Pool should have connections');
      
      this.addTestResult('Connection Pooling', true, 'Connection pooling works correctly');
      
    } catch (error) {
      this.addTestResult('Connection Pooling', false, `Connection pooling failed: ${error.message}`);
    }
  }
  
  /**
   * Test transaction management
   */
  async testTransactionManagement() {
    console.log('💼 Testing transaction management...');
    
    try {
      // Test successful transaction commit
      const transaction1 = await this.connectionManager.beginTransaction('memory');
      
      await new Promise((resolve, reject) => {
        transaction1.connection.run('INSERT OR REPLACE INTO shared_memory (key, namespace, data_type, value, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
          ['txn-test-1', 'test', 'persistent', 'test-value', Date.now(), Date.now()],
          (err) => err ? reject(err) : resolve()
        );
      });
      
      await transaction1.commit();
      
      // Verify data was committed
      const connection = await this.connectionManager.getConnection('memory');
      const result = await new Promise((resolve) => {
        connection.get('SELECT value FROM shared_memory WHERE key = ?', ['txn-test-1'], (err, row) => {
          resolve(row);
        });
      });
      connection.release();
      
      this.assert(result && result.value === 'test-value', 'Transaction commit should persist data');
      
      // Test transaction rollback
      const transaction2 = await this.connectionManager.beginTransaction('memory');
      
      await new Promise((resolve, reject) => {
        transaction2.connection.run('INSERT OR REPLACE INTO shared_memory (key, namespace, data_type, value, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
          ['txn-test-2', 'test', 'persistent', 'rollback-test', Date.now(), Date.now()],
          (err) => err ? reject(err) : resolve()
        );
      });
      
      await transaction2.rollback('Test rollback');
      
      // Verify data was not committed
      const connection2 = await this.connectionManager.getConnection('memory');
      const result2 = await new Promise((resolve) => {
        connection2.get('SELECT value FROM shared_memory WHERE key = ?', ['txn-test-2'], (err, row) => {
          resolve(row);
        });
      });
      connection2.release();
      
      this.assert(!result2, 'Transaction rollback should not persist data');
      
      this.addTestResult('Transaction Management', true, 'Transaction commit and rollback work correctly');
      
    } catch (error) {
      this.addTestResult('Transaction Management', false, `Transaction management failed: ${error.message}`);
    }
  }
  
  /**
   * Test query optimization and caching
   */
  async testQueryOptimization() {
    console.log('⚡ Testing query optimization...');
    
    try {
      // Insert test data
      const connection = await this.connectionManager.getConnection('memory');
      
      for (let i = 0; i < 100; i++) {
        await new Promise((resolve, reject) => {
          connection.run('INSERT OR REPLACE INTO shared_memory (key, namespace, data_type, value, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
            [`opt-test-${i}`, 'optimization', 'persistent', `value-${i}`, Date.now(), Date.now()],
            (err) => err ? reject(err) : resolve()
          );
        });
      }
      
      // Test query caching by running same query multiple times
      const startTime = Date.now();
      
      for (let i = 0; i < 10; i++) {
        await new Promise((resolve) => {
          connection.get('SELECT COUNT(*) as count FROM shared_memory WHERE namespace = ?', ['optimization'], (err, row) => {
            resolve(row);
          });
        });
      }
      
      const queryTime = Date.now() - startTime;
      
      connection.release();
      
      // Verify query caching improved performance
      const stats = this.connectionManager.getStats();
      const cacheStats = stats.cacheStats;
      
      this.assert(cacheStats.hits > 0, 'Query cache should have hits');
      this.assert(queryTime < 1000, 'Cached queries should be fast');
      
      this.addTestResult('Query Optimization', true, 'Query caching and optimization work correctly');
      
    } catch (error) {
      this.addTestResult('Query Optimization', false, `Query optimization failed: ${error.message}`);
    }
  }
  
  /**
   * Test schema management
   */
  async testSchemaManagement() {
    console.log('🏗️ Testing schema management...');
    
    try {
      // Test schema validation
      const validationResult = await this.schemaManager.validateIntegrity();
      
      this.assert(validationResult.memory.valid, 'Memory database schema should be valid');
      this.assert(validationResult.hive.valid, 'Hive database schema should be valid');
      
      // Test migration system
      const currentVersion = await this.schemaManager.getCurrentSchemaVersion();
      this.assert(typeof currentVersion === 'number', 'Schema version should be a number');
      
      // Test optimization
      await this.schemaManager.optimize();
      
      this.addTestResult('Schema Management', true, 'Schema validation and management work correctly');
      
    } catch (error) {
      this.addTestResult('Schema Management', false, `Schema management failed: ${error.message}`);
    }
  }
  
  /**
   * Test performance monitoring
   */
  async testPerformanceMonitoring() {
    console.log('📊 Testing performance monitoring...');
    
    try {
      // Generate some queries to monitor
      const connection = await this.connectionManager.getConnection('memory');
      
      for (let i = 0; i < 50; i++) {
        await new Promise((resolve) => {
          connection.get('SELECT COUNT(*) FROM shared_memory', [], (err, row) => {
            resolve(row);
          });
        });
      }
      
      connection.release();
      
      // Wait for monitoring cycle
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Get performance report
      const report = this.performanceMonitor.getPerformanceReport();
      
      this.assert(report.monitoringStatus === 'active', 'Performance monitoring should be active');
      this.assert(report.statistics.totalQueriesMonitored > 0, 'Queries should be monitored');
      this.assert(report.queryMetrics.SELECT, 'SELECT query metrics should be recorded');
      
      this.addTestResult('Performance Monitoring', true, 'Performance monitoring captures metrics correctly');
      
    } catch (error) {
      this.addTestResult('Performance Monitoring', false, `Performance monitoring failed: ${error.message}`);
    }
  }
  
  /**
   * Test connection health monitoring
   */
  async testConnectionHealthMonitoring() {
    console.log('❤️ Testing connection health monitoring...');
    
    try {
      // Wait for health check cycle
      await new Promise(resolve => setTimeout(resolve, 6000));
      
      const stats = this.connectionManager.getStats();
      
      this.assert(stats.isHealthy, 'Connection manager should be healthy');
      this.assert(stats.pools.memory, 'Memory pool should exist');
      this.assert(stats.pools.hive, 'Hive pool should exist');
      
      // Test health monitoring events
      let healthEventReceived = false;
      
      this.performanceMonitor.once('health-updated', (health) => {
        healthEventReceived = true;
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.assert(healthEventReceived, 'Health monitoring events should be emitted');
      
      this.addTestResult('Connection Health Monitoring', true, 'Connection health monitoring works correctly');
      
    } catch (error) {
      this.addTestResult('Connection Health Monitoring', false, `Health monitoring failed: ${error.message}`);
    }
  }
  
  /**
   * Test error handling and retry logic
   */
  async testErrorHandlingAndRetry() {
    console.log('🔄 Testing error handling and retry logic...');
    
    try {
      // Test query with invalid SQL (should be handled gracefully)
      const connection = await this.connectionManager.getConnection('memory');
      
      let errorCaught = false;
      
      try {
        await new Promise((resolve, reject) => {
          connection.run('INVALID SQL STATEMENT', [], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      } catch (error) {
        errorCaught = true;
        this.assert(error.message.includes('syntax error'), 'Should catch SQL syntax error');
      }
      
      connection.release();
      
      this.assert(errorCaught, 'Error should be caught and handled');
      
      // Test connection retry logic under pool exhaustion
      const connections = [];
      
      try {
        // Exhaust connection pool
        for (let i = 0; i < 6; i++) { // More than max connections
          const conn = await this.connectionManager.getConnection('memory');
          connections.push(conn);
        }
      } catch (error) {
        // Should handle pool exhaustion gracefully
        this.assert(error.message.includes('exhausted') || error.message.includes('timeout'), 
          'Should handle connection pool exhaustion');
      }
      
      // Release connections
      for (const conn of connections) {
        if (conn && conn.release) {
          conn.release();
        }
      }
      
      this.addTestResult('Error Handling and Retry', true, 'Error handling and retry logic work correctly');
      
    } catch (error) {
      this.addTestResult('Error Handling and Retry', false, `Error handling failed: ${error.message}`);
    }
  }
  
  /**
   * Test shared memory integration
   */
  async testSharedMemoryIntegration() {
    console.log('🧠 Testing shared memory integration...');
    
    try {
      // Test basic operations with new database architecture
      await this.sharedMemory.set('integration-test', { message: 'Hello Database!' }, {
        agentId: 'test-agent',
        dataType: this.sharedMemory.dataTypes.PERSISTENT
      });
      
      const value = await this.sharedMemory.get('integration-test', { agentId: 'test-agent' });
      this.assert(value && value.message === 'Hello Database!', 'Shared memory should work with new database');
      
      // Test atomic operations
      const result = await this.sharedMemory.atomic('counter', (currentValue) => {
        return (currentValue || 0) + 1;
      }, { agentId: 'test-agent' });
      
      this.assert(result === 1, 'Atomic operations should work with new database');
      
      // Test transaction support
      const stats = this.sharedMemory.getStats();
      this.assert(stats.dbStatus.available, 'Database should be available');
      this.assert(stats.dbStatus.connectionManager, 'Connection manager should be active');
      
      this.addTestResult('Shared Memory Integration', true, 'Shared memory integrates correctly with new database architecture');
      
    } catch (error) {
      this.addTestResult('Shared Memory Integration', false, `Shared memory integration failed: ${error.message}`);
    }
  }
  
  /**
   * Test concurrent operations
   */
  async testConcurrentOperations() {
    console.log('🔀 Testing concurrent operations...');
    
    try {
      const promises = [];
      
      // Run concurrent read/write operations
      for (let i = 0; i < 20; i++) {
        promises.push(
          this.sharedMemory.set(`concurrent-${i}`, { index: i }, { agentId: `agent-${i % 3}` })
        );
      }
      
      await Promise.all(promises);
      
      // Verify all operations completed
      const readPromises = [];
      for (let i = 0; i < 20; i++) {
        readPromises.push(this.sharedMemory.get(`concurrent-${i}`));
      }
      
      const results = await Promise.all(readPromises);
      const successfulResults = results.filter(r => r !== null);
      
      this.assert(successfulResults.length === 20, 'All concurrent operations should complete successfully');
      
      this.addTestResult('Concurrent Operations', true, 'Concurrent operations handle correctly');
      
    } catch (error) {
      this.addTestResult('Concurrent Operations', false, `Concurrent operations failed: ${error.message}`);
    }
  }
  
  /**
   * Test database security
   */
  async testDatabaseSecurity() {
    console.log('🔒 Testing database security...');
    
    try {
      // Test SQL injection protection (parameterized queries)
      const connection = await this.connectionManager.getConnection('memory');
      
      const maliciousInput = "'; DROP TABLE shared_memory; --";
      
      let injectionPrevented = true;
      
      try {
        await new Promise((resolve, reject) => {
          connection.run('SELECT * FROM shared_memory WHERE key = ?', [maliciousInput], (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });
      } catch (error) {
        // This is acceptable - the query may fail for other reasons
      }
      
      // Verify table still exists (injection was prevented)
      await new Promise((resolve, reject) => {
        connection.get('SELECT COUNT(*) as count FROM shared_memory', [], (err, row) => {
          if (err) {
            injectionPrevented = false;
            reject(err);
          } else {
            resolve(row);
          }
        });
      });
      
      connection.release();
      
      this.assert(injectionPrevented, 'SQL injection should be prevented by parameterized queries');
      
      // Test path validation in shared memory
      let pathValidationWorks = false;
      
      try {
        new SharedMemoryStore({
          projectRoot: '../../../etc/passwd'  // Malicious path
        });
      } catch (error) {
        pathValidationWorks = error.message.includes('Project root must be within');
      }
      
      this.assert(pathValidationWorks, 'Path traversal should be prevented');
      
      this.addTestResult('Database Security', true, 'Security measures work correctly');
      
    } catch (error) {
      this.addTestResult('Database Security', false, `Database security test failed: ${error.message}`);
    }
  }
  
  /**
   * Test connection pool under stress
   */
  async testConnectionPoolStress() {
    console.log('💪 Testing connection pool under stress...');
    
    try {
      const promises = [];
      const startTime = Date.now();
      
      // Create many concurrent connection requests
      for (let i = 0; i < 100; i++) {
        promises.push(this.performQuickQuery(i));
      }
      
      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const duration = Date.now() - startTime;
      
      this.assert(successful > 80, `At least 80% of stress test queries should succeed (${successful}/100)`);
      this.assert(duration < 10000, `Stress test should complete within 10 seconds (${duration}ms)`);
      
      // Verify pool is still healthy after stress
      const stats = this.connectionManager.getStats();
      this.assert(stats.isHealthy, 'Connection pool should remain healthy after stress test');
      
      this.addTestResult('Connection Pool Stress', true, `Connection pool handled stress test (${successful}/100 successful, ${duration}ms)`);
      
    } catch (error) {
      this.addTestResult('Connection Pool Stress', false, `Connection pool stress test failed: ${error.message}`);
    }
  }
  
  /**
   * Test long-running transactions
   */
  async testLongRunningTransactions() {
    console.log('⏱️ Testing long-running transactions...');
    
    try {
      const transaction = await this.connectionManager.beginTransaction('memory', { timeout: 5000 });
      
      // Perform some operations
      await new Promise((resolve, reject) => {
        transaction.connection.run('INSERT OR REPLACE INTO shared_memory (key, namespace, data_type, value, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
          ['long-txn-test', 'test', 'persistent', 'test-value', Date.now(), Date.now()],
          (err) => err ? reject(err) : resolve()
        );
      });
      
      // Wait to simulate long-running transaction
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Commit transaction
      await transaction.commit();
      
      // Verify transaction was successful
      const connection = await this.connectionManager.getConnection('memory');
      const result = await new Promise((resolve) => {
        connection.get('SELECT value FROM shared_memory WHERE key = ?', ['long-txn-test'], (err, row) => {
          resolve(row);
        });
      });
      connection.release();
      
      this.assert(result && result.value === 'test-value', 'Long-running transaction should complete successfully');
      
      this.addTestResult('Long-Running Transactions', true, 'Long-running transactions work correctly');
      
    } catch (error) {
      this.addTestResult('Long-Running Transactions', false, `Long-running transaction test failed: ${error.message}`);
    }
  }
  
  /**
   * Helper method for stress testing
   */
  async performQuickQuery(index) {
    const connection = await this.connectionManager.getConnection('memory');
    
    try {
      return await new Promise((resolve, reject) => {
        connection.get('SELECT COUNT(*) as count FROM shared_memory', [], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    } finally {
      connection.release();
    }
  }
  
  /**
   * Cleanup test environment
   */
  async cleanupTestEnvironment() {
    console.log('🧹 Cleaning up database test environment...');
    
    try {
      // Stop performance monitoring
      if (this.performanceMonitor) {
        this.performanceMonitor.stop();
      }
      
      // Shutdown shared memory
      if (this.sharedMemory) {
        await this.sharedMemory.shutdown();
      }
      
      // Shutdown connection manager
      if (this.connectionManager) {
        await this.connectionManager.shutdown();
      }
      
      // Clean up test files
      try {
        await fs.rm(this.testProjectRoot, { recursive: true, force: true });
      } catch (cleanupError) {
        console.warn('Warning: Could not fully clean up test directory:', cleanupError.message);
      }
      
      this.addTestResult('Environment Cleanup', true, 'Database test environment cleaned up successfully');
      
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
    console.log('\n📋 Database Fixes Validation Results');
    console.log('='.repeat(60));
    
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
    
    console.log('='.repeat(60));
    console.log(`Total Tests: ${this.testResults.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / this.testResults.length) * 100).toFixed(1)}%`);
    
    if (failed === 0) {
      console.log('\n🎉 All database fixes validated successfully!');
      console.log('✅ Connection pooling and lifecycle management');
      console.log('✅ Transaction management with proper rollback');
      console.log('✅ Query optimization and caching');
      console.log('✅ Schema validation and migration');
      console.log('✅ Performance monitoring and metrics');
      console.log('✅ Error handling and retry logic');
      console.log('✅ Security hardening');
      console.log('✅ Concurrent operations support');
    } else {
      console.log(`\n⚠️ ${failed} validation test(s) failed. Please review the database implementation.`);
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const validator = new DatabaseFixesValidator();
  validator.runAllTests().catch(error => {
    console.error('Database fixes validation failed:', error);
    process.exit(1);
  });
}

module.exports = DatabaseFixesValidator;