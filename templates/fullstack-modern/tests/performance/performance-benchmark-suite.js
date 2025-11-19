/**
 * Performance Benchmarking and Load Testing Suite for Fullstack Modern Template
 * 
 * Comprehensive performance testing including load testing, stress testing,
 * scalability testing, WebSocket performance, database performance,
 * memory usage analysis, and real-time feature benchmarking.
 */

const axios = require('axios');
const { io } = require('socket.io-client');
const k6 = require('k6');
const { check, sleep } = require('k6');
const WebSocket = require('ws');

class PerformanceBenchmarkSuite {
  constructor(config = {}) {
    this.config = {
      baseURL: config.baseURL || 'http://localhost:8000',
      frontendURL: config.frontendURL || 'http://localhost:3000',
      wsURL: config.wsURL || 'ws://localhost:8000',
      maxVirtualUsers: config.maxVirtualUsers || 100,
      testDuration: config.testDuration || '5m',
      rampUpTime: config.rampUpTime || '2m',
      ...config
    };

    this.testResults = {
      loadTests: [],
      stressTests: [],
      spikeTests: [],
      volumeTests: [],
      enduranceTests: [],
      websocketPerformance: [],
      databasePerformance: [],
      memoryTests: []
    };

    this.metrics = {
      responseTime: [],
      throughput: [],
      errorRate: [],
      resourceUsage: [],
      concurrentConnections: [],
      memoryUsage: []
    };

    this.apiClient = axios.create({
      baseURL: this.config.baseURL,
      timeout: 30000
    });
  }

  /**
   * Load Testing Suite
   */
  async testLoadPerformance() {
    console.log('⚡ Starting Load Performance Tests...');

    const tests = [
      this.testNormalLoad(),
      this.testHighLoad(),
      this.testConcurrentUsers(),
      this.testAPIEndpointLoad(),
      this.testDatabaseLoad()
    ];

    const results = await Promise.allSettled(tests);
    this.testResults.loadTests = results.map((result, index) => ({
      test: tests[index].name || `Load Test ${index + 1}`,
      status: result.status,
      result: result.value || result.reason,
      timestamp: Date.now()
    }));

    return this.testResults.loadTests;
  }

  async testNormalLoad() {
    const testConfig = {
      virtualUsers: 50,
      duration: 60000, // 1 minute
      rampUpTime: 10000 // 10 seconds
    };

    const startTime = Date.now();
    const requests = [];
    const responseTimes = [];
    const errors = [];
    let activeUsers = 0;

    try {
      // Simulate ramp-up
      for (let i = 0; i < testConfig.virtualUsers; i++) {
        setTimeout(async () => {
          activeUsers++;
          await this.simulateUserSession(responseTimes, errors);
          activeUsers--;
        }, (testConfig.rampUpTime / testConfig.virtualUsers) * i);
      }

      // Wait for test duration
      await new Promise(resolve => setTimeout(resolve, testConfig.duration));

      const totalTime = Date.now() - startTime;
      const totalRequests = responseTimes.length;
      const avgResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
        : 0;
      const errorRate = totalRequests > 0 ? (errors.length / totalRequests) * 100 : 0;
      const throughput = totalRequests / (totalTime / 1000);

      const success = avgResponseTime < 500 && errorRate < 5 && throughput > 10;

      this.metrics.responseTime.push(...responseTimes);
      this.metrics.errorRate.push(errorRate);
      this.metrics.throughput.push(throughput);

      return {
        passed: success,
        testConfig,
        metrics: {
          totalRequests,
          avgResponseTime: `${avgResponseTime.toFixed(2)}ms`,
          p95ResponseTime: `${this.calculatePercentile(responseTimes, 95).toFixed(2)}ms`,
          p99ResponseTime: `${this.calculatePercentile(responseTimes, 99).toFixed(2)}ms`,
          errorRate: `${errorRate.toFixed(2)}%`,
          throughput: `${throughput.toFixed(2)} req/s`,
          maxConcurrentUsers: Math.max(activeUsers, testConfig.virtualUsers)
        },
        message: success ? 'Normal load test passed' : 'Normal load test performance issues detected'
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message,
        testConfig,
        message: 'Normal load test failed with error'
      };
    }
  }

  async testHighLoad() {
    const testConfig = {
      virtualUsers: 200,
      duration: 120000, // 2 minutes
      rampUpTime: 30000 // 30 seconds
    };

    const startTime = Date.now();
    const responseTimes = [];
    const errors = [];
    const concurrentConnections = [];
    let activeUsers = 0;
    let maxActiveUsers = 0;

    try {
      // Create user simulation promises
      const userPromises = [];

      for (let i = 0; i < testConfig.virtualUsers; i++) {
        const userPromise = new Promise((resolve) => {
          setTimeout(async () => {
            activeUsers++;
            maxActiveUsers = Math.max(maxActiveUsers, activeUsers);
            
            try {
              await this.simulateUserSession(responseTimes, errors);
            } catch (error) {
              errors.push(error.message);
            }
            
            activeUsers--;
            resolve();
          }, (testConfig.rampUpTime / testConfig.virtualUsers) * i);
        });

        userPromises.push(userPromise);
      }

      // Monitor concurrent connections
      const monitorInterval = setInterval(() => {
        concurrentConnections.push({
          timestamp: Date.now(),
          activeUsers,
          totalRequests: responseTimes.length
        });
      }, 5000);

      // Wait for all users to complete
      await Promise.all(userPromises);
      clearInterval(monitorInterval);

      const totalTime = Date.now() - startTime;
      const totalRequests = responseTimes.length;
      const avgResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
        : 0;
      const errorRate = totalRequests > 0 ? (errors.length / totalRequests) * 100 : 0;
      const throughput = totalRequests / (totalTime / 1000);

      const success = avgResponseTime < 1000 && errorRate < 10 && throughput > 5;

      this.metrics.concurrentConnections.push(...concurrentConnections);

      return {
        passed: success,
        testConfig,
        metrics: {
          totalRequests,
          avgResponseTime: `${avgResponseTime.toFixed(2)}ms`,
          p95ResponseTime: `${this.calculatePercentile(responseTimes, 95).toFixed(2)}ms`,
          p99ResponseTime: `${this.calculatePercentile(responseTimes, 99).toFixed(2)}ms`,
          errorRate: `${errorRate.toFixed(2)}%`,
          throughput: `${throughput.toFixed(2)} req/s`,
          maxConcurrentUsers: maxActiveUsers,
          concurrentConnectionSamples: concurrentConnections.length
        },
        message: success ? 'High load test passed' : 'High load test revealed performance issues'
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message,
        testConfig,
        message: 'High load test failed with error'
      };
    }
  }

  async simulateUserSession(responseTimes, errors) {
    const sessionDuration = 30000 + Math.random() * 30000; // 30-60 seconds
    const sessionStart = Date.now();

    while (Date.now() - sessionStart < sessionDuration) {
      try {
        // Simulate typical user actions
        const actions = [
          () => this.makeRequest('GET', '/api/posts', responseTimes),
          () => this.makeRequest('GET', '/api/users/profile', responseTimes),
          () => this.makeRequest('POST', '/api/posts', responseTimes, { 
            title: 'Test Post', 
            content: 'Load test content' 
          }),
          () => this.makeRequest('GET', '/api/notifications', responseTimes),
          () => this.makeRequest('PATCH', '/api/users/preferences', responseTimes, { 
            theme: 'dark' 
          })
        ];

        const action = actions[Math.floor(Math.random() * actions.length)];
        await action();

        // Random think time between requests
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 3000));
      } catch (error) {
        errors.push(error.message);
      }
    }
  }

  async makeRequest(method, endpoint, responseTimes, data = null) {
    const startTime = Date.now();
    
    try {
      const config = {
        method: method.toLowerCase(),
        url: endpoint,
        data
      };

      await this.apiClient.request(config);
      const responseTime = Date.now() - startTime;
      responseTimes.push(responseTime);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      responseTimes.push(responseTime);
      throw error;
    }
  }

  /**
   * WebSocket Performance Testing
   */
  async testWebSocketPerformance() {
    console.log('🔌 Testing WebSocket Performance...');

    const tests = [
      this.testWebSocketConnectionLoad(),
      this.testWebSocketMessageThroughput(),
      this.testWebSocketLatency(),
      this.testWebSocketConnectionDrop(),
      this.testRealTimeFeaturePerformance()
    ];

    const results = await Promise.allSettled(tests);
    this.testResults.websocketPerformance = results.map((result, index) => ({
      test: tests[index].name || `WebSocket Performance Test ${index + 1}`,
      status: result.status,
      result: result.value || result.reason,
      timestamp: Date.now()
    }));

    return this.testResults.websocketPerformance;
  }

  async testWebSocketConnectionLoad() {
    return new Promise((resolve, reject) => {
      const connectionCount = 100;
      const connections = [];
      let successfulConnections = 0;
      let failedConnections = 0;
      const connectionTimes = [];
      const startTime = Date.now();

      for (let i = 0; i < connectionCount; i++) {
        const connectionStart = Date.now();
        const socket = io(this.config.wsURL, {
          transports: ['websocket'],
          timeout: 10000
        });

        socket.on('connect', () => {
          const connectionTime = Date.now() - connectionStart;
          connectionTimes.push(connectionTime);
          successfulConnections++;
          
          if (successfulConnections + failedConnections === connectionCount) {
            // Clean up connections
            connections.forEach(conn => {
              if (conn.connected) {
                conn.disconnect();
              }
            });

            const totalTime = Date.now() - startTime;
            const avgConnectionTime = connectionTimes.reduce((sum, time) => sum + time, 0) / connectionTimes.length;
            const success = successfulConnections >= connectionCount * 0.95; // 95% success rate

            resolve({
              passed: success,
              totalConnections: connectionCount,
              successfulConnections,
              failedConnections,
              successRate: `${((successfulConnections / connectionCount) * 100).toFixed(2)}%`,
              avgConnectionTime: `${avgConnectionTime.toFixed(2)}ms`,
              totalTime: `${totalTime}ms`,
              connectionsPerSecond: `${(successfulConnections / (totalTime / 1000)).toFixed(2)}`,
              message: success ? 'WebSocket connection load test passed' : 'WebSocket connection issues under load'
            });
          }
        });

        socket.on('connect_error', (error) => {
          failedConnections++;
          
          if (successfulConnections + failedConnections === connectionCount) {
            connections.forEach(conn => {
              if (conn.connected) {
                conn.disconnect();
              }
            });

            const success = successfulConnections >= connectionCount * 0.95;

            resolve({
              passed: success,
              totalConnections: connectionCount,
              successfulConnections,
              failedConnections,
              successRate: `${((successfulConnections / connectionCount) * 100).toFixed(2)}%`,
              message: success ? 'WebSocket connection load test passed' : 'WebSocket connection failures under load'
            });
          }
        });

        connections.push(socket);
      }

      // Timeout after 30 seconds
      setTimeout(() => {
        connections.forEach(conn => {
          if (conn.connected) {
            conn.disconnect();
          }
        });

        reject({
          passed: false,
          error: 'WebSocket connection load test timed out',
          successfulConnections,
          failedConnections,
          message: 'WebSocket connection load test timed out'
        });
      }, 30000);
    });
  }

  async testWebSocketMessageThroughput() {
    return new Promise((resolve, reject) => {
      const testDuration = 30000; // 30 seconds
      const messageInterval = 10; // Send message every 10ms
      let messagesSent = 0;
      let messagesReceived = 0;
      const latencies = [];
      const startTime = Date.now();

      const socket = io(this.config.wsURL, {
        transports: ['websocket']
      });

      socket.on('connect', () => {
        const sendInterval = setInterval(() => {
          if (Date.now() - startTime >= testDuration) {
            clearInterval(sendInterval);
            
            setTimeout(() => {
              socket.disconnect();
              
              const throughput = messagesReceived / (testDuration / 1000);
              const avgLatency = latencies.length > 0 
                ? latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length 
                : 0;
              const messageDeliveryRate = messagesSent > 0 ? (messagesReceived / messagesSent) * 100 : 0;
              
              const success = throughput > 50 && avgLatency < 100 && messageDeliveryRate > 95;

              resolve({
                passed: success,
                testDuration: `${testDuration}ms`,
                messagesSent,
                messagesReceived,
                throughput: `${throughput.toFixed(2)} messages/second`,
                avgLatency: `${avgLatency.toFixed(2)}ms`,
                messageDeliveryRate: `${messageDeliveryRate.toFixed(2)}%`,
                p95Latency: latencies.length > 0 ? `${this.calculatePercentile(latencies, 95).toFixed(2)}ms` : 'N/A',
                message: success ? 'WebSocket message throughput acceptable' : 'WebSocket message throughput issues'
              });
            }, 1000);
            
            return;
          }
          
          const message = {
            type: 'throughput_test',
            sequence: messagesSent,
            timestamp: Date.now()
          };
          
          socket.emit('message', message);
          messagesSent++;
        }, messageInterval);
      });

      socket.on('message', (message) => {
        if (message.type === 'throughput_test') {
          messagesReceived++;
          const latency = Date.now() - message.timestamp;
          latencies.push(latency);
        }
      });

      socket.on('connect_error', (error) => {
        reject({
          passed: false,
          error: error.message,
          message: 'WebSocket message throughput test connection failed'
        });
      });

      // Timeout
      setTimeout(() => {
        socket.disconnect();
        reject({
          passed: false,
          error: 'WebSocket message throughput test timed out',
          message: 'WebSocket message throughput test timed out'
        });
      }, testDuration + 10000);
    });
  }

  /**
   * Database Performance Testing
   */
  async testDatabasePerformance() {
    console.log('🗄️ Testing Database Performance...');

    const tests = [
      this.testDatabaseQueryPerformance(),
      this.testDatabaseConnectionPool(),
      this.testDatabaseConcurrency(),
      this.testDatabaseIndexPerformance(),
      this.testDatabaseTransactionPerformance()
    ];

    const results = await Promise.allSettled(tests);
    this.testResults.databasePerformance = results.map((result, index) => ({
      test: tests[index].name || `Database Performance Test ${index + 1}`,
      status: result.status,
      result: result.value || result.reason,
      timestamp: Date.now()
    }));

    return this.testResults.databasePerformance;
  }

  async testDatabaseQueryPerformance() {
    const queryTests = [
      { name: 'Simple SELECT', endpoint: '/api/posts?limit=10' },
      { name: 'Complex JOIN', endpoint: '/api/posts?include=author,comments&limit=10' },
      { name: 'Aggregation', endpoint: '/api/analytics/post-stats' },
      { name: 'Search Query', endpoint: '/api/posts/search?q=test&limit=10' },
      { name: 'Pagination', endpoint: '/api/posts?page=5&limit=20' }
    ];

    const results = [];

    for (const queryTest of queryTests) {
      const queryTimes = [];
      const errorCount = [];

      // Run each query multiple times
      for (let i = 0; i < 10; i++) {
        const startTime = Date.now();
        
        try {
          await this.apiClient.get(queryTest.endpoint);
          const queryTime = Date.now() - startTime;
          queryTimes.push(queryTime);
        } catch (error) {
          const queryTime = Date.now() - startTime;
          queryTimes.push(queryTime);
          errorCount.push(error.message);
        }
      }

      const avgQueryTime = queryTimes.reduce((sum, time) => sum + time, 0) / queryTimes.length;
      const success = avgQueryTime < 200 && errorCount.length === 0;

      results.push({
        queryName: queryTest.name,
        endpoint: queryTest.endpoint,
        passed: success,
        avgQueryTime: `${avgQueryTime.toFixed(2)}ms`,
        minTime: `${Math.min(...queryTimes)}ms`,
        maxTime: `${Math.max(...queryTimes)}ms`,
        errorCount: errorCount.length,
        runs: queryTimes.length
      });
    }

    const allPassed = results.every(result => result.passed);

    return {
      passed: allPassed,
      queryResults: results,
      testedQueries: queryTests.length,
      passedQueries: results.filter(r => r.passed).length,
      message: allPassed ? 'Database query performance acceptable' : 'Some database queries are slow'
    };
  }

  async testDatabaseConcurrency() {
    const concurrentQueries = 50;
    const startTime = Date.now();
    
    const queryPromises = Array(concurrentQueries).fill().map(async (_, index) => {
      const queryStart = Date.now();
      
      try {
        // Mix of read and write operations
        if (index % 4 === 0) {
          // Write operation
          await this.apiClient.post('/api/posts', {
            title: `Concurrent Test Post ${index}`,
            content: `Content for concurrent test ${index}`
          });
        } else {
          // Read operation
          await this.apiClient.get('/api/posts?limit=5');
        }
        
        return {
          success: true,
          queryTime: Date.now() - queryStart,
          operation: index % 4 === 0 ? 'write' : 'read'
        };
      } catch (error) {
        return {
          success: false,
          queryTime: Date.now() - queryStart,
          operation: index % 4 === 0 ? 'write' : 'read',
          error: error.message
        };
      }
    });

    try {
      const results = await Promise.all(queryPromises);
      const totalTime = Date.now() - startTime;
      
      const successfulQueries = results.filter(r => r.success).length;
      const failedQueries = results.filter(r => !r.success).length;
      const avgQueryTime = results.reduce((sum, r) => sum + r.queryTime, 0) / results.length;
      const queriesPerSecond = results.length / (totalTime / 1000);
      
      const success = successfulQueries >= concurrentQueries * 0.95 && avgQueryTime < 500;

      return {
        passed: success,
        concurrentQueries,
        successfulQueries,
        failedQueries,
        successRate: `${((successfulQueries / concurrentQueries) * 100).toFixed(2)}%`,
        avgQueryTime: `${avgQueryTime.toFixed(2)}ms`,
        queriesPerSecond: `${queriesPerSecond.toFixed(2)}`,
        totalTime: `${totalTime}ms`,
        readOperations: results.filter(r => r.operation === 'read').length,
        writeOperations: results.filter(r => r.operation === 'write').length,
        message: success ? 'Database concurrency performance acceptable' : 'Database concurrency issues detected'
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message,
        concurrentQueries,
        message: 'Database concurrency test failed with error'
      };
    }
  }

  /**
   * Memory Usage and Resource Testing
   */
  async testMemoryUsage() {
    console.log('🧠 Testing Memory Usage and Resource Performance...');

    const tests = [
      this.testMemoryLeaks(),
      this.testLargeDatasetHandling(),
      this.testMemoryUsageUnderLoad(),
      this.testGarbageCollection()
    ];

    const results = await Promise.allSettled(tests);
    this.testResults.memoryTests = results.map((result, index) => ({
      test: tests[index].name || `Memory Test ${index + 1}`,
      status: result.status,
      result: result.value || result.reason,
      timestamp: Date.now()
    }));

    return this.testResults.memoryTests;
  }

  async testMemoryLeaks() {
    // This test would typically be run in a browser environment with performance.memory
    // Here we simulate the concept for the backend
    
    const initialMemory = process.memoryUsage();
    const iterations = 1000;
    
    try {
      // Simulate operations that might cause memory leaks
      for (let i = 0; i < iterations; i++) {
        await this.apiClient.get('/api/posts?limit=1');
        
        // Force garbage collection every 100 iterations (if available)
        if (i % 100 === 0 && global.gc) {
          global.gc();
        }
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = {
        heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
        heapTotal: finalMemory.heapTotal - initialMemory.heapTotal,
        external: finalMemory.external - initialMemory.external,
        rss: finalMemory.rss - initialMemory.rss
      };

      // Consider it a leak if heap usage increased by more than 50MB for 1000 simple requests
      const hasMemoryLeak = memoryIncrease.heapUsed > 50 * 1024 * 1024;

      this.metrics.memoryUsage.push({
        test: 'memory_leak_test',
        initial: initialMemory,
        final: finalMemory,
        increase: memoryIncrease,
        iterations
      });

      return {
        passed: !hasMemoryLeak,
        iterations,
        memoryIncrease: {
          heapUsed: `${(memoryIncrease.heapUsed / 1024 / 1024).toFixed(2)}MB`,
          heapTotal: `${(memoryIncrease.heapTotal / 1024 / 1024).toFixed(2)}MB`,
          external: `${(memoryIncrease.external / 1024 / 1024).toFixed(2)}MB`,
          rss: `${(memoryIncrease.rss / 1024 / 1024).toFixed(2)}MB`
        },
        hasMemoryLeak,
        message: hasMemoryLeak ? 'Potential memory leak detected' : 'No significant memory leak detected'
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message,
        message: 'Memory leak test failed with error'
      };
    }
  }

  async testLargeDatasetHandling() {
    try {
      const datasetSizes = [100, 500, 1000, 5000];
      const results = [];

      for (const size of datasetSizes) {
        const startTime = Date.now();
        const initialMemory = process.memoryUsage();

        try {
          const response = await this.apiClient.get(`/api/posts?limit=${size}`);
          const processingTime = Date.now() - startTime;
          const finalMemory = process.memoryUsage();
          const memoryUsed = finalMemory.heapUsed - initialMemory.heapUsed;

          results.push({
            datasetSize: size,
            passed: processingTime < 5000 && memoryUsed < 100 * 1024 * 1024, // 5s and 100MB limits
            processingTime: `${processingTime}ms`,
            memoryUsed: `${(memoryUsed / 1024 / 1024).toFixed(2)}MB`,
            responseSize: response.data?.length || 0,
            status: response.status
          });
        } catch (error) {
          results.push({
            datasetSize: size,
            passed: false,
            error: error.message,
            processingTime: Date.now() - startTime
          });
        }
      }

      const allPassed = results.every(result => result.passed);

      return {
        passed: allPassed,
        datasetResults: results,
        testedSizes: datasetSizes.length,
        passedSizes: results.filter(r => r.passed).length,
        message: allPassed ? 'Large dataset handling acceptable' : 'Performance issues with large datasets'
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message,
        message: 'Large dataset handling test failed with error'
      };
    }
  }

  /**
   * Utility Methods
   */
  calculatePercentile(values, percentile) {
    if (values.length === 0) return 0;
    
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
  }

  /**
   * Generate Performance Test Report
   */
  generateTestReport() {
    const allTests = [
      ...this.testResults.loadTests,
      ...this.testResults.stressTests,
      ...this.testResults.websocketPerformance,
      ...this.testResults.databasePerformance,
      ...this.testResults.memoryTests
    ];

    const passed = allTests.filter(test => test.status === 'fulfilled' && test.result.passed).length;
    const failed = allTests.filter(test => test.status === 'rejected' || !test.result.passed).length;
    const total = allTests.length;

    const performanceMetrics = {
      avgResponseTime: this.metrics.responseTime.length > 0 
        ? this.metrics.responseTime.reduce((sum, time) => sum + time, 0) / this.metrics.responseTime.length 
        : 0,
      avgThroughput: this.metrics.throughput.length > 0
        ? this.metrics.throughput.reduce((sum, rate) => sum + rate, 0) / this.metrics.throughput.length
        : 0,
      avgErrorRate: this.metrics.errorRate.length > 0
        ? this.metrics.errorRate.reduce((sum, rate) => sum + rate, 0) / this.metrics.errorRate.length
        : 0
    };

    return {
      summary: {
        totalTests: total,
        passed,
        failed,
        successRate: total > 0 ? ((passed / total) * 100).toFixed(2) + '%' : '0%',
        timestamp: new Date().toISOString()
      },
      performanceMetrics: {
        avgResponseTime: `${performanceMetrics.avgResponseTime.toFixed(2)}ms`,
        avgThroughput: `${performanceMetrics.avgThroughput.toFixed(2)} req/s`,
        avgErrorRate: `${performanceMetrics.avgErrorRate.toFixed(2)}%`
      },
      categories: {
        loadTests: this.testResults.loadTests,
        stressTests: this.testResults.stressTests,
        websocketPerformance: this.testResults.websocketPerformance,
        databasePerformance: this.testResults.databasePerformance,
        memoryTests: this.testResults.memoryTests
      },
      recommendations: this.generateRecommendations(allTests, performanceMetrics)
    };
  }

  generateRecommendations(tests, metrics) {
    const recommendations = [];
    
    const failedTests = tests.filter(test => test.status === 'rejected' || !test.result.passed);
    
    if (failedTests.length > 0) {
      recommendations.push('Review failed performance tests and optimize slow components');
    }
    
    if (metrics.avgResponseTime > 500) {
      recommendations.push('Optimize response times - average is above 500ms');
    }
    
    if (metrics.avgErrorRate > 5) {
      recommendations.push('Reduce error rate - currently above 5%');
    }
    
    if (metrics.avgThroughput < 10) {
      recommendations.push('Improve throughput - currently below 10 req/s');
    }
    
    const memoryTests = this.testResults.memoryTests;
    if (memoryTests.some(test => test.result?.hasMemoryLeak)) {
      recommendations.push('Investigate and fix memory leaks');
    }
    
    const dbTests = this.testResults.databasePerformance;
    if (dbTests.some(test => !test.result?.passed)) {
      recommendations.push('Optimize database queries and connection handling');
    }
    
    return recommendations;
  }

  /**
   * Run All Performance Tests
   */
  async runAllTests() {
    console.log('🚀 Starting Comprehensive Performance Benchmark Suite...\n');
    
    try {
      await this.testLoadPerformance();
      await this.testWebSocketPerformance();
      await this.testDatabasePerformance();
      await this.testMemoryUsage();
      
      const report = this.generateTestReport();
      
      console.log('\n📊 Performance Benchmark Results:');
      console.log(`✅ Passed: ${report.summary.passed}`);
      console.log(`❌ Failed: ${report.summary.failed}`);
      console.log(`📈 Success Rate: ${report.summary.successRate}`);
      console.log(`⚡ Average Response Time: ${report.performanceMetrics.avgResponseTime}`);
      console.log(`🔄 Average Throughput: ${report.performanceMetrics.avgThroughput}`);
      console.log(`📉 Average Error Rate: ${report.performanceMetrics.avgErrorRate}`);
      
      if (report.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        report.recommendations.forEach(rec => console.log(`   • ${rec}`));
      }
      
      return report;
    } catch (error) {
      console.error('❌ Performance benchmark suite failed:', error);
      throw error;
    }
  }
}

module.exports = { PerformanceBenchmarkSuite };

// Example usage
if (require.main === module) {
  const benchmarkSuite = new PerformanceBenchmarkSuite({
    baseURL: process.env.API_URL || 'http://localhost:8000',
    frontendURL: process.env.FRONTEND_URL || 'http://localhost:3000',
    wsURL: process.env.WS_URL || 'ws://localhost:8000',
    maxVirtualUsers: 200,
    testDuration: '5m'
  });

  benchmarkSuite.runAllTests()
    .then(report => {
      console.log('\n📄 Full performance report saved to performance-benchmark-report.json');
      require('fs').writeFileSync(
        'performance-benchmark-report.json',
        JSON.stringify(report, null, 2)
      );
    })
    .catch(error => {
      console.error('Performance testing failed:', error);
      process.exit(1);
    });
}