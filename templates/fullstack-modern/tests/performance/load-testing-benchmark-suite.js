/**
 * Load Testing and Performance Benchmark Suite for Fullstack Modern Template
 * 
 * Comprehensive performance testing including load testing, stress testing,
 * scalability benchmarks, resource utilization monitoring, performance regression
 * detection, and real-world scenario simulations.
 */

const axios = require('axios');
const { EventEmitter } = require('events');
const os = require('os');

class LoadTestingBenchmarkSuite extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      apiBaseURL: config.apiBaseURL || 'http://localhost:8000/api',
      frontendURL: config.frontendURL || 'http://localhost:3000',
      wsURL: config.wsURL || 'ws://localhost:8000',
      maxVirtualUsers: config.maxVirtualUsers || 1000,
      testDuration: config.testDuration || 300000, // 5 minutes
      rampUpTime: config.rampUpTime || 60000, // 1 minute
      ...config
    };

    this.testResults = {
      loadTests: [],
      stressTests: [],
      spikeTests: [],
      volumeTests: [],
      enduranceTests: [],
      scalabilityTests: [],
      resourceTests: []
    };

    this.performanceMetrics = {
      responseTime: {
        min: Infinity,
        max: 0,
        avg: 0,
        p50: 0,
        p90: 0,
        p95: 0,
        p99: 0,
        samples: []
      },
      throughput: {
        requestsPerSecond: 0,
        dataTransferRate: 0,
        transactionsPerSecond: 0
      },
      errors: {
        total: 0,
        rate: 0,
        types: {}
      },
      resources: {
        cpuUsage: [],
        memoryUsage: [],
        networkIO: [],
        diskIO: []
      },
      concurrency: {
        maxConcurrentUsers: 0,
        avgConcurrentUsers: 0,
        connectionErrors: 0
      }
    };

    this.virtualUsers = [];
    this.testStartTime = null;
    this.testEndTime = null;
  }

  /**
   * Load Testing - Normal Expected Load
   */
  async runLoadTests() {
    console.log('📊 Running Load Tests - Normal Expected Load...');

    const tests = [
      this.testNormalTrafficLoad(),
      this.testDatabaseLoad(),
      this.testAPIEndpointLoad(),
      this.testStaticResourceLoad(),
      this.testConcurrentUserSessions()
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

  async testNormalTrafficLoad() {
    const virtualUsers = 50;
    const testDuration = 120000; // 2 minutes
    const rampUpTime = 30000; // 30 seconds

    console.log(`  🎯 Testing normal traffic load: ${virtualUsers} virtual users for ${testDuration/1000}s`);

    const results = await this.executeLoadTest({
      virtualUsers,
      testDuration,
      rampUpTime,
      testName: 'normal_traffic_load',
      scenarios: [
        { endpoint: '/api/posts', method: 'GET', weight: 40 },
        { endpoint: '/api/users/profile', method: 'GET', weight: 20 },
        { endpoint: '/api/posts', method: 'POST', weight: 15 },
        { endpoint: '/api/posts/:id', method: 'GET', weight: 15 },
        { endpoint: '/api/posts/:id', method: 'PUT', weight: 10 }
      ]
    });

    const performanceThresholds = {
      avgResponseTime: 500, // ms
      p95ResponseTime: 1000, // ms
      errorRate: 1, // %
      throughputRPS: 20 // requests per second
    };

    const passed = this.evaluatePerformanceThresholds(results, performanceThresholds);

    return {
      passed,
      virtualUsers,
      testDuration,
      performanceThresholds,
      actualMetrics: {
        avgResponseTime: results.responseTime.avg,
        p95ResponseTime: results.responseTime.p95,
        errorRate: results.errors.rate,
        throughputRPS: results.throughput.requestsPerSecond
      },
      details: results,
      message: passed ? 'Normal traffic load handled successfully' : 'Performance degradation under normal load'
    };
  }

  async testDatabaseLoad() {
    const databaseOperations = [
      { operation: 'read_users', endpoint: '/api/users', method: 'GET', weight: 50 },
      { operation: 'read_posts', endpoint: '/api/posts', method: 'GET', weight: 30 },
      { operation: 'create_post', endpoint: '/api/posts', method: 'POST', weight: 15 },
      { operation: 'update_user', endpoint: '/api/users/profile', method: 'PUT', weight: 5 }
    ];

    const results = await this.executeLoadTest({
      virtualUsers: 30,
      testDuration: 90000, // 1.5 minutes
      rampUpTime: 15000,
      testName: 'database_load',
      scenarios: databaseOperations
    });

    // Database-specific performance thresholds
    const dbThresholds = {
      avgResponseTime: 300, // Database operations should be faster
      p95ResponseTime: 800,
      errorRate: 0.5,
      connectionErrors: 5
    };

    const passed = this.evaluatePerformanceThresholds(results, dbThresholds);

    return {
      passed,
      databaseOperations: databaseOperations.length,
      dbThresholds,
      actualMetrics: {
        avgResponseTime: results.responseTime.avg,
        p95ResponseTime: results.responseTime.p95,
        errorRate: results.errors.rate,
        connectionErrors: results.errors.types.connection || 0
      },
      details: results,
      message: passed ? 'Database load handled efficiently' : 'Database performance issues detected'
    };
  }

  /**
   * Stress Testing - Beyond Normal Capacity
   */
  async runStressTests() {
    console.log('🔥 Running Stress Tests - Beyond Normal Capacity...');

    const tests = [
      this.testHighConcurrencyStress(),
      this.testMemoryStressTest(),
      this.testCPUIntensiveOperations(),
      this.testDatabaseConnectionStress(),
      this.testFileUploadStress()
    ];

    const results = await Promise.allSettled(tests);
    this.testResults.stressTests = results.map((result, index) => ({
      test: tests[index].name || `Stress Test ${index + 1}`,
      status: result.status,
      result: result.value || result.reason,
      timestamp: Date.now()
    }));

    return this.testResults.stressTests;
  }

  async testHighConcurrencyStress() {
    const virtualUsers = 200;
    const testDuration = 180000; // 3 minutes
    const rampUpTime = 60000; // 1 minute

    console.log(`  🚀 Testing high concurrency stress: ${virtualUsers} virtual users`);

    // Monitor system resources during stress test
    const resourceMonitoring = this.startResourceMonitoring();

    const results = await this.executeLoadTest({
      virtualUsers,
      testDuration,
      rampUpTime,
      testName: 'high_concurrency_stress',
      scenarios: [
        { endpoint: '/api/posts', method: 'GET', weight: 60 },
        { endpoint: '/api/posts', method: 'POST', weight: 40 }
      ]
    });

    this.stopResourceMonitoring(resourceMonitoring);

    // Stress test should maintain some level of service even under high load
    const stressThresholds = {
      errorRate: 10, // Allow higher error rate under stress
      responseTimeDegradation: 5, // Max 5x normal response time
      systemRecovery: true // System should recover after load reduction
    };

    const degradationFactor = results.responseTime.avg / 500; // Assuming 500ms baseline
    const passed = results.errors.rate <= stressThresholds.errorRate && 
                   degradationFactor <= stressThresholds.responseTimeDegradation;

    return {
      passed,
      virtualUsers,
      stressThresholds,
      actualMetrics: {
        errorRate: results.errors.rate,
        responseTimeDegradation: degradationFactor,
        maxResponseTime: results.responseTime.max,
        systemRecovered: await this.testSystemRecovery()
      },
      resourceUsage: {
        maxCPU: Math.max(...this.performanceMetrics.resources.cpuUsage),
        maxMemory: Math.max(...this.performanceMetrics.resources.memoryUsage)
      },
      details: results,
      message: passed ? 'System handles high concurrency stress appropriately' : 'System fails under high concurrency stress'
    };
  }

  async testMemoryStressTest() {
    // Test with large payload requests
    const largePayloadSize = 1024 * 1024; // 1MB
    const virtualUsers = 20;
    const requests = [];

    console.log(`  💾 Testing memory stress with large payloads: ${largePayloadSize} bytes`);

    const startMemory = process.memoryUsage();

    for (let i = 0; i < virtualUsers; i++) {
      const largePayload = {
        data: 'A'.repeat(largePayloadSize),
        metadata: {
          size: largePayloadSize,
          iteration: i,
          timestamp: Date.now()
        }
      };

      const request = axios.post(`${this.config.apiBaseURL}/posts`, largePayload, {
        timeout: 30000
      }).then(response => ({
        success: true,
        responseTime: Date.now() - request.startTime,
        size: largePayloadSize
      })).catch(error => ({
        success: false,
        error: error.message,
        code: error.code
      }));

      request.startTime = Date.now();
      requests.push(request);

      // Small delay to prevent overwhelming
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const results = await Promise.all(requests);
    const endMemory = process.memoryUsage();

    const successfulRequests = results.filter(r => r.success).length;
    const memoryIncrease = endMemory.heapUsed - startMemory.heapUsed;
    const memoryLeakDetected = memoryIncrease > (largePayloadSize * virtualUsers * 2); // Allow 2x overhead

    return {
      passed: successfulRequests >= virtualUsers * 0.8 && !memoryLeakDetected,
      virtualUsers,
      successfulRequests,
      payloadSize: largePayloadSize,
      memoryUsage: {
        before: startMemory.heapUsed,
        after: endMemory.heapUsed,
        increase: memoryIncrease,
        leakDetected: memoryLeakDetected
      },
      averageResponseTime: results.filter(r => r.success).reduce((sum, r) => sum + r.responseTime, 0) / successfulRequests,
      message: memoryLeakDetected ? 'Memory leak detected under stress' : 'Memory usage within acceptable limits'
    };
  }

  /**
   * Spike Testing - Sudden Load Increases
   */
  async runSpikeTests() {
    console.log('⚡ Running Spike Tests - Sudden Load Increases...');

    const tests = [
      this.testTrafficSpike(),
      this.testConnectionSpike(),
      this.testDataProcessingSpike()
    ];

    const results = await Promise.allSettled(tests);
    this.testResults.spikeTests = results.map((result, index) => ({
      test: tests[index].name || `Spike Test ${index + 1}`,
      status: result.status,
      result: result.value || result.reason,
      timestamp: Date.now()
    }));

    return this.testResults.spikeTests;
  }

  async testTrafficSpike() {
    console.log('  📈 Testing traffic spike handling...');

    // Start with baseline load
    const baselineUsers = 10;
    const spikeUsers = 100;
    const spikeDuration = 30000; // 30 seconds
    
    // Baseline phase
    console.log(`    Phase 1: Baseline load - ${baselineUsers} users`);
    const baselineResults = await this.executeLoadTest({
      virtualUsers: baselineUsers,
      testDuration: 30000,
      rampUpTime: 5000,
      testName: 'spike_baseline'
    });

    // Spike phase
    console.log(`    Phase 2: Traffic spike - ${spikeUsers} users`);
    const spikeStartTime = Date.now();
    const spikeResults = await this.executeLoadTest({
      virtualUsers: spikeUsers,
      testDuration: spikeDuration,
      rampUpTime: 2000, // Very fast ramp-up to simulate spike
      testName: 'traffic_spike'
    });

    // Recovery phase
    console.log(`    Phase 3: Recovery - back to ${baselineUsers} users`);
    const recoveryResults = await this.executeLoadTest({
      virtualUsers: baselineUsers,
      testDuration: 30000,
      rampUpTime: 5000,
      testName: 'spike_recovery'
    });

    // Analyze spike handling
    const spikeAnalysis = {
      baselineResponseTime: baselineResults.responseTime.avg,
      spikeResponseTime: spikeResults.responseTime.avg,
      recoveryResponseTime: recoveryResults.responseTime.avg,
      responseTimeDegradation: spikeResults.responseTime.avg / baselineResults.responseTime.avg,
      errorRateIncrease: spikeResults.errors.rate - baselineResults.errors.rate,
      recoveryTime: Math.abs(recoveryResults.responseTime.avg - baselineResults.responseTime.avg) / baselineResults.responseTime.avg
    };

    const spikeThresholds = {
      maxResponseTimeDegradation: 10, // 10x degradation acceptable during spike
      maxErrorRateIncrease: 15, // 15% error rate increase acceptable
      maxRecoveryTime: 0.5 // Recovery within 50% of baseline
    };

    const passed = spikeAnalysis.responseTimeDegradation <= spikeThresholds.maxResponseTimeDegradation &&
                   spikeAnalysis.errorRateIncrease <= spikeThresholds.maxErrorRateIncrease &&
                   spikeAnalysis.recoveryTime <= spikeThresholds.maxRecoveryTime;

    return {
      passed,
      baselineUsers,
      spikeUsers,
      spikeDuration,
      spikeAnalysis,
      spikeThresholds,
      phases: {
        baseline: baselineResults,
        spike: spikeResults,
        recovery: recoveryResults
      },
      message: passed ? 'System handles traffic spikes gracefully' : 'System struggles with traffic spikes'
    };
  }

  /**
   * Volume Testing - Large Amounts of Data
   */
  async runVolumeTests() {
    console.log('📦 Running Volume Tests - Large Data Processing...');

    const tests = [
      this.testLargeDatasetProcessing(),
      this.testBulkOperations(),
      this.testLargeFileHandling()
    ];

    const results = await Promise.allSettled(tests);
    this.testResults.volumeTests = results.map((result, index) => ({
      test: tests[index].name || `Volume Test ${index + 1}`,
      status: result.status,
      result: result.value || result.reason,
      timestamp: Date.now()
    }));

    return this.testResults.volumeTests;
  }

  async testLargeDatasetProcessing() {
    const datasetSizes = [1000, 5000, 10000, 50000];
    const processingResults = [];

    for (const size of datasetSizes) {
      console.log(`  📊 Processing dataset of ${size} records...`);

      const startTime = Date.now();
      
      try {
        // Generate large dataset
        const dataset = Array.from({ length: size }, (_, i) => ({
          id: i,
          name: `Record ${i}`,
          data: `Data for record ${i}`,
          timestamp: new Date().toISOString(),
          metadata: {
            index: i,
            batch: Math.floor(i / 100),
            processed: false
          }
        }));

        // Process dataset through API
        const response = await axios.post(`${this.config.apiBaseURL}/data/process`, {
          dataset,
          options: {
            batchSize: 100,
            validateData: true,
            transformData: true
          }
        }, {
          timeout: 120000 // 2 minutes timeout for large datasets
        });

        const processingTime = Date.now() - startTime;
        const throughput = size / (processingTime / 1000); // records per second

        processingResults.push({
          size,
          success: true,
          processingTime,
          throughput: Math.round(throughput),
          responseSize: JSON.stringify(response.data).length
        });

      } catch (error) {
        const processingTime = Date.now() - startTime;
        
        processingResults.push({
          size,
          success: false,
          processingTime,
          error: error.message,
          errorCode: error.code || error.response?.status
        });
      }
    }

    // Analyze volume processing performance
    const successfulTests = processingResults.filter(r => r.success);
    const volumeAnalysis = {
      maxSuccessfulSize: Math.max(...successfulTests.map(r => r.size)),
      avgThroughput: successfulTests.reduce((sum, r) => sum + r.throughput, 0) / successfulTests.length,
      linearScaling: this.analyzeScalingPattern(successfulTests),
      performanceDegradation: this.analyzePerformanceDegradation(successfulTests)
    };

    const volumeThresholds = {
      minSuccessfulSize: 10000,
      minThroughput: 50, // records per second
      maxPerformanceDegradation: 5 // 5x slowdown acceptable for 50x data increase
    };

    const passed = volumeAnalysis.maxSuccessfulSize >= volumeThresholds.minSuccessfulSize &&
                   volumeAnalysis.avgThroughput >= volumeThresholds.minThroughput &&
                   volumeAnalysis.performanceDegradation <= volumeThresholds.maxPerformanceDegradation;

    return {
      passed,
      datasetSizes,
      processingResults,
      volumeAnalysis,
      volumeThresholds,
      message: passed ? 'Large dataset processing performs well' : 'Volume processing performance issues detected'
    };
  }

  /**
   * Endurance Testing - Extended Operation
   */
  async runEnduranceTests() {
    console.log('⏳ Running Endurance Tests - Extended Operation...');

    const tests = [
      this.testLongRunningOperations(),
      this.testMemoryLeakDetection(),
      this.testResourceDegradation()
    ];

    const results = await Promise.allSettled(tests);
    this.testResults.enduranceTests = results.map((result, index) => ({
      test: tests[index].name || `Endurance Test ${index + 1}`,
      status: result.status,
      result: result.value || result.reason,
      timestamp: Date.now()
    }));

    return this.testResults.enduranceTests;
  }

  async testLongRunningOperations() {
    const testDuration = 300000; // 5 minutes
    const virtualUsers = 20;
    const measurementInterval = 30000; // Measure performance every 30 seconds

    console.log(`  ⏱️ Running endurance test for ${testDuration/1000} seconds with ${virtualUsers} users...`);

    const performanceMeasurements = [];
    const resourceMeasurements = [];
    const startTime = Date.now();

    // Start continuous load
    const loadTestPromise = this.executeContinuousLoad({
      virtualUsers,
      testDuration,
      scenarios: [
        { endpoint: '/api/posts', method: 'GET', weight: 70 },
        { endpoint: '/api/posts', method: 'POST', weight: 30 }
      ]
    });

    // Measure performance at intervals
    const measurementInterval = setInterval(async () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;

      // Take performance snapshot
      const performanceSnapshot = await this.takePerformanceSnapshot();
      performanceMeasurements.push({
        timestamp: currentTime,
        elapsed,
        ...performanceSnapshot
      });

      // Take resource snapshot
      const resourceSnapshot = this.takeResourceSnapshot();
      resourceMeasurements.push({
        timestamp: currentTime,
        elapsed,
        ...resourceSnapshot
      });

      console.log(`    📊 ${Math.round(elapsed/1000)}s - Response time: ${performanceSnapshot.avgResponseTime}ms, Memory: ${resourceSnapshot.memoryUsage}MB`);

    }, measurementInterval);

    // Wait for test completion
    const finalResults = await loadTestPromise;
    clearInterval(measurementInterval);

    // Analyze endurance performance
    const enduranceAnalysis = {
      performanceDrift: this.analyzePerformanceDrift(performanceMeasurements),
      memoryLeakDetected: this.analyzeMemoryLeak(resourceMeasurements),
      responseTimeStability: this.analyzeResponseTimeStability(performanceMeasurements),
      errorRateProgression: this.analyzeErrorRateProgression(performanceMeasurements)
    };

    const enduranceThresholds = {
      maxPerformanceDrift: 50, // 50% performance degradation over time
      memoryLeakTolerance: 100, // 100MB memory increase acceptable
      responseTimeVariability: 2, // 2x max variability in response times
      maxErrorRateIncrease: 5 // 5% error rate increase over time
    };

    const passed = enduranceAnalysis.performanceDrift <= enduranceThresholds.maxPerformanceDrift &&
                   !enduranceAnalysis.memoryLeakDetected &&
                   enduranceAnalysis.responseTimeStability <= enduranceThresholds.responseTimeVariability &&
                   enduranceAnalysis.errorRateProgression <= enduranceThresholds.maxErrorRateIncrease;

    return {
      passed,
      testDuration,
      virtualUsers,
      measurementCount: performanceMeasurements.length,
      enduranceAnalysis,
      enduranceThresholds,
      performanceMeasurements,
      resourceMeasurements,
      finalResults,
      message: passed ? 'System shows good endurance characteristics' : 'System degrades under extended load'
    };
  }

  /**
   * Load Test Execution Engine
   */
  async executeLoadTest(options) {
    const {
      virtualUsers,
      testDuration,
      rampUpTime,
      testName,
      scenarios = [{ endpoint: '/api/posts', method: 'GET', weight: 100 }]
    } = options;

    this.testStartTime = Date.now();
    const results = {
      responseTime: { samples: [], min: Infinity, max: 0, avg: 0, p50: 0, p90: 0, p95: 0, p99: 0 },
      throughput: { requestsPerSecond: 0, totalRequests: 0 },
      errors: { total: 0, rate: 0, types: {} },
      concurrency: { active: 0, max: 0 }
    };

    // Calculate ramp-up schedule
    const rampUpInterval = rampUpTime / virtualUsers;
    const activeUsers = [];

    // Ramp up virtual users
    for (let i = 0; i < virtualUsers; i++) {
      setTimeout(() => {
        const user = this.createVirtualUser(i, scenarios, results);
        activeUsers.push(user);
        results.concurrency.active++;
        results.concurrency.max = Math.max(results.concurrency.max, results.concurrency.active);
      }, i * rampUpInterval);
    }

    // Run test for specified duration
    await new Promise(resolve => setTimeout(resolve, testDuration + rampUpTime));

    // Stop all virtual users
    activeUsers.forEach(user => user.stop());
    
    this.testEndTime = Date.now();
    const actualDuration = (this.testEndTime - this.testStartTime) / 1000;

    // Calculate final metrics
    results.responseTime.avg = results.responseTime.samples.reduce((sum, time) => sum + time, 0) / results.responseTime.samples.length;
    results.responseTime.p50 = this.calculatePercentile(results.responseTime.samples, 50);
    results.responseTime.p90 = this.calculatePercentile(results.responseTime.samples, 90);
    results.responseTime.p95 = this.calculatePercentile(results.responseTime.samples, 95);
    results.responseTime.p99 = this.calculatePercentile(results.responseTime.samples, 99);
    
    results.throughput.requestsPerSecond = results.throughput.totalRequests / actualDuration;
    results.errors.rate = (results.errors.total / results.throughput.totalRequests) * 100;

    return results;
  }

  createVirtualUser(userId, scenarios, results) {
    let active = true;
    let requestCount = 0;

    const makeRequest = async () => {
      if (!active) return;

      try {
        // Select scenario based on weight
        const scenario = this.selectScenario(scenarios);
        const startTime = Date.now();
        
        // Prepare request
        const requestConfig = {
          method: scenario.method,
          url: `${this.config.apiBaseURL}${scenario.endpoint}`,
          timeout: 30000
        };

        // Add request body for POST/PUT requests
        if (['POST', 'PUT', 'PATCH'].includes(scenario.method)) {
          requestConfig.data = this.generateRequestData(scenario);
        }

        // Make request
        const response = await axios(requestConfig);
        const responseTime = Date.now() - startTime;

        // Record metrics
        results.responseTime.samples.push(responseTime);
        results.responseTime.min = Math.min(results.responseTime.min, responseTime);
        results.responseTime.max = Math.max(results.responseTime.max, responseTime);
        results.throughput.totalRequests++;
        
        requestCount++;

      } catch (error) {
        const responseTime = Date.now() - startTime;
        
        // Record error metrics
        results.errors.total++;
        results.throughput.totalRequests++;
        
        const errorType = error.code || error.response?.status || 'unknown';
        results.errors.types[errorType] = (results.errors.types[errorType] || 0) + 1;

        // Still record response time for failed requests
        if (responseTime > 0) {
          results.responseTime.samples.push(responseTime);
        }
      }

      // Schedule next request
      if (active) {
        const thinkTime = this.calculateThinkTime();
        setTimeout(makeRequest, thinkTime);
      }
    };

    // Start making requests
    makeRequest();

    return {
      id: userId,
      requestCount: () => requestCount,
      stop: () => { 
        active = false; 
        results.concurrency.active--;
      }
    };
  }

  selectScenario(scenarios) {
    const totalWeight = scenarios.reduce((sum, scenario) => sum + scenario.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const scenario of scenarios) {
      random -= scenario.weight;
      if (random <= 0) {
        return scenario;
      }
    }
    
    return scenarios[0]; // Fallback
  }

  generateRequestData(scenario) {
    switch (scenario.endpoint) {
      case '/api/posts':
        return {
          title: `Load test post ${Date.now()}`,
          content: `This is a test post generated during load testing at ${new Date().toISOString()}`,
          tags: ['load-test', 'performance'],
          metadata: {
            generatedBy: 'load-test-suite',
            timestamp: Date.now()
          }
        };
      
      case '/api/users/profile':
        return {
          name: `Load Test User ${Date.now()}`,
          bio: 'User generated during load testing',
          preferences: {
            theme: 'dark',
            notifications: true
          }
        };

      default:
        return {
          data: `Test data for ${scenario.endpoint}`,
          timestamp: Date.now()
        };
    }
  }

  calculateThinkTime() {
    // Simulate realistic user think time (1-5 seconds)
    return Math.random() * 4000 + 1000;
  }

  calculatePercentile(samples, percentile) {
    if (samples.length === 0) return 0;
    
    const sorted = samples.slice().sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Resource Monitoring
   */
  startResourceMonitoring() {
    const measurements = [];
    
    const measureInterval = setInterval(() => {
      const measurement = this.takeResourceSnapshot();
      measurements.push(measurement);
      this.performanceMetrics.resources.cpuUsage.push(measurement.cpuUsage);
      this.performanceMetrics.resources.memoryUsage.push(measurement.memoryUsage);
    }, 5000); // Every 5 seconds

    return {
      interval: measureInterval,
      measurements
    };
  }

  stopResourceMonitoring(monitoring) {
    clearInterval(monitoring.interval);
    return monitoring.measurements;
  }

  takeResourceSnapshot() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      timestamp: Date.now(),
      memoryUsage: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      memoryTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      cpuUsage: Math.round((cpuUsage.user + cpuUsage.system) / 1000), // ms
      systemMemory: {
        total: Math.round(os.totalmem() / 1024 / 1024), // MB
        free: Math.round(os.freemem() / 1024 / 1024), // MB
        used: Math.round((os.totalmem() - os.freemem()) / 1024 / 1024) // MB
      },
      loadAverage: os.loadavg()
    };
  }

  async takePerformanceSnapshot() {
    // Make a quick test request to measure current performance
    try {
      const startTime = Date.now();
      await axios.get(`${this.config.apiBaseURL}/health`, { timeout: 5000 });
      const responseTime = Date.now() - startTime;
      
      return {
        avgResponseTime: responseTime,
        available: true,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        avgResponseTime: null,
        available: false,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Analysis Methods
   */
  evaluatePerformanceThresholds(results, thresholds) {
    const checks = [];
    
    if (thresholds.avgResponseTime) {
      checks.push(results.responseTime.avg <= thresholds.avgResponseTime);
    }
    
    if (thresholds.p95ResponseTime) {
      checks.push(results.responseTime.p95 <= thresholds.p95ResponseTime);
    }
    
    if (thresholds.errorRate) {
      checks.push(results.errors.rate <= thresholds.errorRate);
    }
    
    if (thresholds.throughputRPS) {
      checks.push(results.throughput.requestsPerSecond >= thresholds.throughputRPS);
    }
    
    return checks.every(check => check);
  }

  analyzeScalingPattern(results) {
    if (results.length < 2) return 'insufficient_data';
    
    const firstResult = results[0];
    const lastResult = results[results.length - 1];
    
    const sizeRatio = lastResult.size / firstResult.size;
    const timeRatio = lastResult.processingTime / firstResult.processingTime;
    
    if (timeRatio <= sizeRatio * 1.2) return 'linear';
    if (timeRatio <= sizeRatio * 2) return 'sub_linear';
    return 'exponential';
  }

  analyzePerformanceDegradation(results) {
    if (results.length < 2) return 0;
    
    const firstThroughput = results[0].throughput;
    const lastThroughput = results[results.length - 1].throughput;
    
    return firstThroughput / lastThroughput;
  }

  analyzePerformanceDrift(measurements) {
    if (measurements.length < 2) return 0;
    
    const firstPerformance = measurements[0].avgResponseTime;
    const lastPerformance = measurements[measurements.length - 1].avgResponseTime;
    
    return ((lastPerformance - firstPerformance) / firstPerformance) * 100;
  }

  analyzeMemoryLeak(measurements) {
    if (measurements.length < 3) return false;
    
    const firstMemory = measurements[0].memoryUsage;
    const lastMemory = measurements[measurements.length - 1].memoryUsage;
    const memoryIncrease = lastMemory - firstMemory;
    
    // Consider memory leak if memory increased by more than 100MB over time
    return memoryIncrease > 100;
  }

  analyzeResponseTimeStability(measurements) {
    const responseTimes = measurements.map(m => m.avgResponseTime).filter(rt => rt !== null);
    if (responseTimes.length < 2) return 0;
    
    const min = Math.min(...responseTimes);
    const max = Math.max(...responseTimes);
    
    return max / min;
  }

  analyzeErrorRateProgression(measurements) {
    // This would analyze error rate changes over time
    // For now, return 0 as placeholder
    return 0;
  }

  async testSystemRecovery() {
    // Test if system recovers after load reduction
    try {
      await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
      const response = await axios.get(`${this.config.apiBaseURL}/health`, { timeout: 5000 });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * Generate Comprehensive Performance Report
   */
  generatePerformanceReport() {
    const allTests = [
      ...this.testResults.loadTests,
      ...this.testResults.stressTests,
      ...this.testResults.spikeTests,
      ...this.testResults.volumeTests,
      ...this.testResults.enduranceTests,
      ...this.testResults.scalabilityTests,
      ...this.testResults.resourceTests
    ];

    const passed = allTests.filter(test => test.status === 'fulfilled' && test.result.passed).length;
    const failed = allTests.filter(test => test.status === 'rejected' || !test.result.passed).length;
    const total = allTests.length;

    return {
      summary: {
        totalTests: total,
        passed,
        failed,
        successRate: total > 0 ? ((passed / total) * 100).toFixed(2) + '%' : '0%',
        testDuration: this.testEndTime - this.testStartTime,
        timestamp: new Date().toISOString()
      },
      performance: {
        responseTime: this.performanceMetrics.responseTime,
        throughput: this.performanceMetrics.throughput,
        errors: this.performanceMetrics.errors,
        concurrency: this.performanceMetrics.concurrency
      },
      resources: {
        maxCPU: Math.max(...this.performanceMetrics.resources.cpuUsage, 0),
        maxMemory: Math.max(...this.performanceMetrics.resources.memoryUsage, 0),
        avgCPU: this.calculateAverage(this.performanceMetrics.resources.cpuUsage),
        avgMemory: this.calculateAverage(this.performanceMetrics.resources.memoryUsage)
      },
      categories: {
        loadTests: this.testResults.loadTests,
        stressTests: this.testResults.stressTests,
        spikeTests: this.testResults.spikeTests,
        volumeTests: this.testResults.volumeTests,
        enduranceTests: this.testResults.enduranceTests,
        scalabilityTests: this.testResults.scalabilityTests,
        resourceTests: this.testResults.resourceTests
      },
      recommendations: this.generatePerformanceRecommendations(allTests)
    };
  }

  generatePerformanceRecommendations(tests) {
    const recommendations = [];
    
    const failedTests = tests.filter(test => test.status === 'rejected' || !test.result.passed);
    
    if (failedTests.some(test => test.test.includes('Load'))) {
      recommendations.push('Optimize application performance to handle normal load better');
    }
    
    if (failedTests.some(test => test.test.includes('Stress'))) {
      recommendations.push('Implement better resource management and scaling strategies');
    }
    
    if (failedTests.some(test => test.test.includes('Spike'))) {
      recommendations.push('Add auto-scaling capabilities to handle traffic spikes');
    }
    
    if (failedTests.some(test => test.test.includes('Volume'))) {
      recommendations.push('Optimize data processing and database queries for large datasets');
    }
    
    if (failedTests.some(test => test.test.includes('Endurance'))) {
      recommendations.push('Fix memory leaks and performance degradation over time');
    }
    
    if (this.performanceMetrics.errors.rate > 5) {
      recommendations.push('Investigate and fix error sources that affect reliability');
    }
    
    return recommendations;
  }

  calculateAverage(array) {
    return array.length > 0 ? array.reduce((sum, val) => sum + val, 0) / array.length : 0;
  }

  /**
   * Run All Performance Tests
   */
  async runAllTests() {
    console.log('🚀 Starting Comprehensive Load Testing and Performance Benchmark Suite...\n');
    
    try {
      await this.runLoadTests();
      await this.runStressTests();
      await this.runSpikeTests();
      await this.runVolumeTests();
      await this.runEnduranceTests();
      
      const report = this.generatePerformanceReport();
      
      console.log('\n📊 Performance Test Results:');
      console.log(`✅ Passed: ${report.summary.passed}`);
      console.log(`❌ Failed: ${report.summary.failed}`);
      console.log(`📈 Success Rate: ${report.summary.successRate}`);
      console.log(`⚡ Max Throughput: ${report.performance.throughput.requestsPerSecond.toFixed(1)} RPS`);
      console.log(`📊 Avg Response Time: ${report.performance.responseTime.avg.toFixed(1)}ms`);
      console.log(`🎯 P95 Response Time: ${report.performance.responseTime.p95.toFixed(1)}ms`);
      console.log(`🔥 Max CPU Usage: ${report.resources.maxCPU.toFixed(1)}%`);
      console.log(`💾 Max Memory Usage: ${report.resources.maxMemory.toFixed(1)}MB`);
      
      if (report.recommendations.length > 0) {
        console.log('\n💡 Performance Recommendations:');
        report.recommendations.forEach(rec => console.log(`   • ${rec}`));
      }
      
      return report;
    } catch (error) {
      console.error('❌ Performance testing suite failed:', error);
      throw error;
    }
  }
}

module.exports = { LoadTestingBenchmarkSuite };

// Example usage
if (require.main === module) {
  const performanceSuite = new LoadTestingBenchmarkSuite({
    apiBaseURL: process.env.API_URL || 'http://localhost:8000/api',
    frontendURL: process.env.FRONTEND_URL || 'http://localhost:3000',
    wsURL: process.env.WS_URL || 'ws://localhost:8000',
    maxVirtualUsers: 500,
    testDuration: 300000 // 5 minutes
  });

  performanceSuite.runAllTests()
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