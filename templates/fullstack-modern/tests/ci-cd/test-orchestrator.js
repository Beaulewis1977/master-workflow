/**
 * Test Orchestrator and CI/CD Integration for Fullstack Modern Template
 * 
 * Comprehensive test orchestration system that runs all test suites,
 * generates consolidated reports, integrates with CI/CD pipelines,
 * provides parallel test execution, and manages test environments.
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn, exec } = require('child_process');
const util = require('util');

// Import all test suites
const { WebSocketTestFramework } = require('../websocket/websocket-test-framework');
const { ZustandIntegrationTestSuite } = require('../state-management/zustand-integration-tests');
const { APIIntegrationTestSuite } = require('../api/api-integration-test-suite');
const { AuthenticationFlowTestSuite } = require('../auth/authentication-flow-tests');
const { DataFlowIntegrationTestSuite } = require('../full-stack/data-flow-integration-tests');
const { PerformanceBenchmarkSuite } = require('../performance/performance-benchmark-suite');
const { SecurityValidationTestSuite } = require('../security/security-validation-tests');

const execAsync = util.promisify(exec);

class TestOrchestrator {
  constructor(config = {}) {
    this.config = {
      baseURL: config.baseURL || 'http://localhost:8000',
      frontendURL: config.frontendURL || 'http://localhost:3000',
      wsURL: config.wsURL || 'ws://localhost:8000',
      parallel: config.parallel !== false,
      maxConcurrency: config.maxConcurrency || 4,
      timeout: config.timeout || 300000, // 5 minutes default
      reportDir: config.reportDir || './test-reports',
      environment: config.environment || 'test',
      ciMode: config.ciMode || process.env.CI === 'true',
      ...config
    };

    this.testSuites = new Map();
    this.testResults = {
      overall: {},
      suites: {},
      consolidated: {}
    };

    this.environmentSetup = {
      frontend: null,
      backend: null,
      database: null
    };

    this.setupTestSuites();
  }

  setupTestSuites() {
    // Initialize all test suites
    this.testSuites.set('websocket', new WebSocketTestFramework({
      url: this.config.wsURL,
      timeout: 15000
    }));

    this.testSuites.set('zustand', new ZustandIntegrationTestSuite());

    this.testSuites.set('api', new APIIntegrationTestSuite({
      baseURL: this.config.baseURL,
      timeout: 30000
    }));

    this.testSuites.set('auth', new AuthenticationFlowTestSuite({
      baseURL: this.config.baseURL,
      apiURL: this.config.baseURL,
      timeout: 30000
    }));

    this.testSuites.set('dataflow', new DataFlowIntegrationTestSuite({
      frontendURL: this.config.frontendURL,
      backendURL: this.config.baseURL,
      wsURL: this.config.wsURL
    }));

    this.testSuites.set('performance', new PerformanceBenchmarkSuite({
      baseURL: this.config.baseURL,
      frontendURL: this.config.frontendURL,
      wsURL: this.config.wsURL
    }));

    this.testSuites.set('security', new SecurityValidationTestSuite({
      baseURL: this.config.baseURL,
      frontendURL: this.config.frontendURL
    }));
  }

  /**
   * Environment Setup and Teardown
   */
  async setupTestEnvironment() {
    console.log('🏗️ Setting up test environment...');

    try {
      // Ensure report directory exists
      await fs.mkdir(this.config.reportDir, { recursive: true });

      // Setup test database if needed
      if (this.config.environment === 'test') {
        await this.setupTestDatabase();
      }

      // Wait for services to be ready
      await this.waitForServices();

      // Seed test data if configured
      if (this.config.seedData) {
        await this.seedTestData();
      }

      console.log('✅ Test environment setup completed');
      return true;
    } catch (error) {
      console.error('❌ Test environment setup failed:', error.message);
      throw error;
    }
  }

  async setupTestDatabase() {
    try {
      console.log('📊 Setting up test database...');
      
      // Run database migrations
      if (this.config.runMigrations) {
        await execAsync('npm run db:migrate:test');
      }

      // Reset database to clean state
      if (this.config.resetDatabase) {
        await execAsync('npm run db:reset:test');
      }

      console.log('✅ Test database setup completed');
    } catch (error) {
      console.warn('⚠️ Test database setup failed:', error.message);
      // Continue without database setup in some cases
    }
  }

  async waitForServices() {
    const services = [
      { name: 'Backend API', url: `${this.config.baseURL}/health` },
      { name: 'Frontend', url: this.config.frontendURL }
    ];

    const maxRetries = 30;
    const retryDelay = 2000;

    for (const service of services) {
      console.log(`⏳ Waiting for ${service.name} to be ready...`);
      
      let retries = 0;
      while (retries < maxRetries) {
        try {
          const response = await fetch(service.url);
          if (response.ok) {
            console.log(`✅ ${service.name} is ready`);
            break;
          }
        } catch (error) {
          // Service not ready yet
        }

        retries++;
        if (retries === maxRetries) {
          throw new Error(`${service.name} failed to start after ${maxRetries} retries`);
        }

        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  async seedTestData() {
    try {
      console.log('🌱 Seeding test data...');
      
      if (this.config.seedScript) {
        await execAsync(this.config.seedScript);
      } else {
        await execAsync('npm run seed:test');
      }
      
      console.log('✅ Test data seeded successfully');
    } catch (error) {
      console.warn('⚠️ Test data seeding failed:', error.message);
    }
  }

  async teardownTestEnvironment() {
    console.log('🧹 Tearing down test environment...');

    try {
      // Clean up test data
      if (this.config.cleanupData) {
        await this.cleanupTestData();
      }

      // Stop any spawned processes
      await this.stopTestProcesses();

      console.log('✅ Test environment teardown completed');
    } catch (error) {
      console.warn('⚠️ Test environment teardown failed:', error.message);
    }
  }

  async cleanupTestData() {
    try {
      if (this.config.cleanupScript) {
        await execAsync(this.config.cleanupScript);
      } else {
        await execAsync('npm run cleanup:test');
      }
    } catch (error) {
      console.warn('⚠️ Test data cleanup failed:', error.message);
    }
  }

  async stopTestProcesses() {
    // Clean up any background processes started during testing
    if (this.environmentSetup.frontend) {
      this.environmentSetup.frontend.kill();
    }
    if (this.environmentSetup.backend) {
      this.environmentSetup.backend.kill();
    }
  }

  /**
   * Test Execution
   */
  async runAllTests(options = {}) {
    const startTime = Date.now();
    console.log('🚀 Starting comprehensive test suite execution...\n');

    try {
      // Setup environment
      await this.setupTestEnvironment();

      // Select test suites to run
      const suitesToRun = options.suites || Array.from(this.testSuites.keys());
      
      // Run tests
      let testResults;
      if (this.config.parallel && suitesToRun.length > 1) {
        testResults = await this.runTestsInParallel(suitesToRun, options);
      } else {
        testResults = await this.runTestsSequentially(suitesToRun, options);
      }

      // Generate consolidated report
      const consolidatedReport = await this.generateConsolidatedReport(testResults);

      // Save reports
      await this.saveReports(consolidatedReport);

      // Print summary
      this.printTestSummary(consolidatedReport);

      // Teardown environment
      await this.teardownTestEnvironment();

      const totalTime = Date.now() - startTime;
      console.log(`\n⏱️ Total execution time: ${(totalTime / 1000).toFixed(2)}s`);

      return consolidatedReport;
    } catch (error) {
      console.error('❌ Test execution failed:', error);
      await this.teardownTestEnvironment();
      throw error;
    }
  }

  async runTestsInParallel(suitesToRun, options = {}) {
    console.log(`🔄 Running ${suitesToRun.length} test suites in parallel...\n`);

    const concurrency = Math.min(this.config.maxConcurrency, suitesToRun.length);
    const results = {};
    const errors = {};

    // Create chunks for parallel execution
    const chunks = this.chunkArray(suitesToRun, concurrency);
    
    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async (suiteName) => {
        try {
          console.log(`🏃 Starting ${suiteName} test suite...`);
          const startTime = Date.now();
          
          const testSuite = this.testSuites.get(suiteName);
          const result = await this.runTestSuiteWithTimeout(testSuite, suiteName);
          
          const duration = Date.now() - startTime;
          console.log(`✅ ${suiteName} completed in ${(duration / 1000).toFixed(2)}s`);
          
          results[suiteName] = {
            ...result,
            duration,
            status: 'completed'
          };
        } catch (error) {
          console.error(`❌ ${suiteName} failed:`, error.message);
          errors[suiteName] = error.message;
          results[suiteName] = {
            status: 'failed',
            error: error.message,
            duration: 0
          };
        }
      });

      await Promise.all(chunkPromises);
    }

    return { results, errors };
  }

  async runTestsSequentially(suitesToRun, options = {}) {
    console.log(`🔄 Running ${suitesToRun.length} test suites sequentially...\n`);

    const results = {};
    const errors = {};

    for (const suiteName of suitesToRun) {
      try {
        console.log(`🏃 Starting ${suiteName} test suite...`);
        const startTime = Date.now();
        
        const testSuite = this.testSuites.get(suiteName);
        const result = await this.runTestSuiteWithTimeout(testSuite, suiteName);
        
        const duration = Date.now() - startTime;
        console.log(`✅ ${suiteName} completed in ${(duration / 1000).toFixed(2)}s`);
        
        results[suiteName] = {
          ...result,
          duration,
          status: 'completed'
        };
      } catch (error) {
        console.error(`❌ ${suiteName} failed:`, error.message);
        errors[suiteName] = error.message;
        results[suiteName] = {
          status: 'failed',
          error: error.message,
          duration: 0
        };

        // In sequential mode, decide whether to continue or stop
        if (options.stopOnFirstFailure) {
          break;
        }
      }
    }

    return { results, errors };
  }

  async runTestSuiteWithTimeout(testSuite, suiteName) {
    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Test suite ${suiteName} timed out after ${this.config.timeout}ms`));
      }, this.config.timeout);

      try {
        const result = await testSuite.runAllTests();
        clearTimeout(timeoutId);
        resolve(result);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Report Generation
   */
  async generateConsolidatedReport(testResults) {
    const allResults = testResults.results;
    const allErrors = testResults.errors;

    // Calculate overall statistics
    const totalSuites = Object.keys(allResults).length;
    const completedSuites = Object.values(allResults).filter(r => r.status === 'completed').length;
    const failedSuites = Object.values(allResults).filter(r => r.status === 'failed').length;

    // Aggregate test counts from all suites
    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;

    Object.values(allResults).forEach(result => {
      if (result.summary) {
        totalTests += result.summary.totalTests || 0;
        totalPassed += result.summary.passed || 0;
        totalFailed += result.summary.failed || 0;
      }
    });

    // Calculate overall success rate
    const overallSuccessRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(2) : '0';
    const suiteSuccessRate = totalSuites > 0 ? ((completedSuites / totalSuites) * 100).toFixed(2) : '0';

    // Collect all vulnerabilities and performance issues
    const securityIssues = this.collectSecurityIssues(allResults);
    const performanceIssues = this.collectPerformanceIssues(allResults);

    // Generate recommendations
    const recommendations = this.generateOverallRecommendations(allResults, securityIssues, performanceIssues);

    // Calculate quality score
    const qualityScore = this.calculateQualityScore(allResults, securityIssues, performanceIssues);

    const consolidatedReport = {
      meta: {
        timestamp: new Date().toISOString(),
        environment: this.config.environment,
        ciMode: this.config.ciMode,
        executionTime: Object.values(allResults).reduce((sum, r) => sum + (r.duration || 0), 0),
        parallel: this.config.parallel
      },
      overall: {
        totalSuites,
        completedSuites,
        failedSuites,
        suiteSuccessRate: `${suiteSuccessRate}%`,
        totalTests,
        totalPassed,
        totalFailed,
        overallSuccessRate: `${overallSuccessRate}%`,
        qualityScore
      },
      suites: allResults,
      errors: allErrors,
      security: {
        issuesFound: securityIssues.length,
        criticalIssues: securityIssues.filter(i => i.severity === 'critical').length,
        highIssues: securityIssues.filter(i => i.severity === 'high').length,
        details: securityIssues
      },
      performance: {
        issuesFound: performanceIssues.length,
        details: performanceIssues
      },
      recommendations,
      cicd: this.generateCICDRecommendations(allResults, securityIssues, performanceIssues)
    };

    return consolidatedReport;
  }

  collectSecurityIssues(results) {
    const securityIssues = [];
    
    if (results.security?.vulnerabilities?.details) {
      securityIssues.push(...results.security.vulnerabilities.details);
    }

    return securityIssues;
  }

  collectPerformanceIssues(results) {
    const performanceIssues = [];
    
    // Collect from performance suite
    if (results.performance?.performanceMetrics) {
      const metrics = results.performance.performanceMetrics;
      
      if (parseFloat(metrics.avgResponseTime) > 500) {
        performanceIssues.push({
          type: 'Slow Response Time',
          severity: 'medium',
          value: metrics.avgResponseTime,
          threshold: '500ms'
        });
      }
      
      if (parseFloat(metrics.avgThroughput) < 10) {
        performanceIssues.push({
          type: 'Low Throughput',
          severity: 'medium',
          value: metrics.avgThroughput,
          threshold: '10 req/s'
        });
      }
    }

    // Collect from other suites that report performance metrics
    Object.entries(results).forEach(([suiteName, result]) => {
      if (result.performance) {
        // Add suite-specific performance issues
      }
    });

    return performanceIssues;
  }

  generateOverallRecommendations(results, securityIssues, performanceIssues) {
    const recommendations = [];

    // Security recommendations
    if (securityIssues.length > 0) {
      const criticalCount = securityIssues.filter(i => i.severity === 'critical').length;
      if (criticalCount > 0) {
        recommendations.push(`🚨 URGENT: Fix ${criticalCount} critical security vulnerabilities immediately`);
      }
      recommendations.push(`🔒 Address ${securityIssues.length} security issues before production deployment`);
    }

    // Performance recommendations
    if (performanceIssues.length > 0) {
      recommendations.push(`⚡ Optimize ${performanceIssues.length} performance issues for better user experience`);
    }

    // Test coverage recommendations
    Object.entries(results).forEach(([suiteName, result]) => {
      if (result.summary?.successRate) {
        const successRate = parseFloat(result.summary.successRate);
        if (successRate < 90) {
          recommendations.push(`📊 Improve ${suiteName} test suite: ${result.summary.successRate} pass rate`);
        }
      }
    });

    // CI/CD recommendations
    if (this.config.ciMode) {
      recommendations.push('🔄 Integrate security and performance gates in CI/CD pipeline');
      recommendations.push('📋 Set up automated test reporting and notifications');
    }

    return recommendations;
  }

  calculateQualityScore(results, securityIssues, performanceIssues) {
    let score = 100;

    // Deduct for failed test suites
    const failedSuites = Object.values(results).filter(r => r.status === 'failed').length;
    score -= failedSuites * 10;

    // Deduct for security issues
    const criticalSecurity = securityIssues.filter(i => i.severity === 'critical').length;
    const highSecurity = securityIssues.filter(i => i.severity === 'high').length;
    score -= criticalSecurity * 15;
    score -= highSecurity * 8;

    // Deduct for performance issues
    score -= performanceIssues.length * 5;

    // Deduct for low test pass rates
    Object.values(results).forEach(result => {
      if (result.summary?.successRate) {
        const successRate = parseFloat(result.summary.successRate);
        if (successRate < 90) {
          score -= (90 - successRate) * 0.5;
        }
      }
    });

    return Math.max(0, Math.round(score));
  }

  generateCICDRecommendations(results, securityIssues, performanceIssues) {
    const recommendations = {
      gates: [],
      notifications: [],
      optimizations: []
    };

    // Quality gates
    if (securityIssues.filter(i => i.severity === 'critical').length > 0) {
      recommendations.gates.push('Block deployment if critical security vulnerabilities are found');
    }

    recommendations.gates.push('Require minimum 85% test pass rate for deployment');
    recommendations.gates.push('Enforce performance benchmarks (response time < 500ms, throughput > 10 req/s)');

    // Notifications
    recommendations.notifications.push('Send alerts for security vulnerabilities');
    recommendations.notifications.push('Report test failures to development team');
    recommendations.notifications.push('Notify on performance regression');

    // Optimizations
    if (this.config.parallel) {
      recommendations.optimizations.push('Consider further parallelization of test suites');
    }
    recommendations.optimizations.push('Cache test dependencies and setup steps');
    recommendations.optimizations.push('Use incremental testing based on code changes');

    return recommendations;
  }

  /**
   * Report Saving and Distribution
   */
  async saveReports(consolidatedReport) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      // Save consolidated report
      const consolidatedPath = path.join(this.config.reportDir, `consolidated-test-report-${timestamp}.json`);
      await fs.writeFile(consolidatedPath, JSON.stringify(consolidatedReport, null, 2));

      // Save individual suite reports
      for (const [suiteName, result] of Object.entries(consolidatedReport.suites)) {
        if (result.status === 'completed') {
          const suitePath = path.join(this.config.reportDir, `${suiteName}-report-${timestamp}.json`);
          await fs.writeFile(suitePath, JSON.stringify(result, null, 2));
        }
      }

      // Generate HTML report
      const htmlReport = await this.generateHTMLReport(consolidatedReport);
      const htmlPath = path.join(this.config.reportDir, `test-report-${timestamp}.html`);
      await fs.writeFile(htmlPath, htmlReport);

      // Generate JUnit XML for CI/CD integration
      if (this.config.ciMode) {
        const junitXml = this.generateJUnitXML(consolidatedReport);
        const junitPath = path.join(this.config.reportDir, `junit-results-${timestamp}.xml`);
        await fs.writeFile(junitPath, junitXml);
      }

      console.log(`📄 Reports saved to ${this.config.reportDir}/`);
      return {
        consolidated: consolidatedPath,
        html: htmlPath,
        junit: this.config.ciMode ? path.join(this.config.reportDir, `junit-results-${timestamp}.xml`) : null
      };
    } catch (error) {
      console.error('❌ Failed to save reports:', error);
      throw error;
    }
  }

  async generateHTMLReport(consolidatedReport) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fullstack Modern Template - Test Report</title>
    <style>
        body { font-family: 'Segoe UI', system-ui, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 2.5em; }
        .header .meta { margin-top: 10px; opacity: 0.9; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; padding: 30px; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 6px; border-left: 4px solid #667eea; }
        .metric h3 { margin: 0 0 10px 0; color: #495057; }
        .metric .value { font-size: 2em; font-weight: bold; color: #333; }
        .metric .label { color: #6c757d; font-size: 0.9em; }
        .suite { margin: 20px 30px; padding: 20px; border: 1px solid #dee2e6; border-radius: 6px; }
        .suite h3 { margin: 0 0 15px 0; color: #495057; }
        .success { border-left: 4px solid #28a745; }
        .failed { border-left: 4px solid #dc3545; }
        .warning { border-left: 4px solid #ffc107; }
        .security, .performance { margin: 20px 30px; }
        .issue { background: #fff3cd; padding: 10px; margin: 5px 0; border-radius: 4px; border-left: 3px solid #ffc107; }
        .issue.critical { background: #f8d7da; border-color: #dc3545; }
        .issue.high { background: #f1c2c2; border-color: #dc3545; }
        .recommendations { margin: 20px 30px; padding: 20px; background: #e7f3ff; border-radius: 6px; border-left: 4px solid #0084ff; }
        .recommendations h3 { margin: 0 0 15px 0; color: #0056b3; }
        .recommendations li { margin: 5px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Fullstack Modern Template</h1>
            <div class="meta">
                Test Report - ${consolidatedReport.meta.timestamp}<br>
                Environment: ${consolidatedReport.meta.environment} | 
                Execution Time: ${(consolidatedReport.meta.executionTime / 1000).toFixed(2)}s |
                Mode: ${consolidatedReport.meta.parallel ? 'Parallel' : 'Sequential'}
            </div>
        </div>

        <div class="summary">
            <div class="metric">
                <h3>Quality Score</h3>
                <div class="value">${consolidatedReport.overall.qualityScore}/100</div>
                <div class="label">Overall Quality</div>
            </div>
            <div class="metric">
                <h3>Test Suites</h3>
                <div class="value">${consolidatedReport.overall.completedSuites}/${consolidatedReport.overall.totalSuites}</div>
                <div class="label">${consolidatedReport.overall.suiteSuccessRate} Success Rate</div>
            </div>
            <div class="metric">
                <h3>Total Tests</h3>
                <div class="value">${consolidatedReport.overall.totalPassed}/${consolidatedReport.overall.totalTests}</div>
                <div class="label">${consolidatedReport.overall.overallSuccessRate} Pass Rate</div>
            </div>
            <div class="metric">
                <h3>Security Issues</h3>
                <div class="value">${consolidatedReport.security.issuesFound}</div>
                <div class="label">${consolidatedReport.security.criticalIssues} Critical</div>
            </div>
        </div>

        ${Object.entries(consolidatedReport.suites).map(([name, result]) => `
            <div class="suite ${result.status === 'completed' ? 'success' : 'failed'}">
                <h3>${name.charAt(0).toUpperCase() + name.slice(1)} Test Suite</h3>
                <p><strong>Status:</strong> ${result.status}</p>
                ${result.summary ? `
                    <p><strong>Tests:</strong> ${result.summary.passed}/${result.summary.totalTests} passed (${result.summary.successRate})</p>
                    <p><strong>Duration:</strong> ${(result.duration / 1000).toFixed(2)}s</p>
                ` : ''}
                ${result.error ? `<p style="color: #dc3545;"><strong>Error:</strong> ${result.error}</p>` : ''}
            </div>
        `).join('')}

        ${consolidatedReport.security.issuesFound > 0 ? `
            <div class="security">
                <h3>🔒 Security Issues</h3>
                ${consolidatedReport.security.details.slice(0, 10).map(issue => `
                    <div class="issue ${issue.severity}">
                        <strong>${issue.type}</strong> (${issue.severity})<br>
                        ${issue.description || issue.details || ''}
                    </div>
                `).join('')}
                ${consolidatedReport.security.details.length > 10 ? `
                    <p><em>... and ${consolidatedReport.security.details.length - 10} more issues</em></p>
                ` : ''}
            </div>
        ` : ''}

        ${consolidatedReport.performance.issuesFound > 0 ? `
            <div class="performance">
                <h3>⚡ Performance Issues</h3>
                ${consolidatedReport.performance.details.map(issue => `
                    <div class="issue">
                        <strong>${issue.type}</strong><br>
                        Current: ${issue.value} | Threshold: ${issue.threshold}
                    </div>
                `).join('')}
            </div>
        ` : ''}

        <div class="recommendations">
            <h3>💡 Recommendations</h3>
            <ul>
                ${consolidatedReport.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </div>
    </div>
</body>
</html>`;

    return html;
  }

  generateJUnitXML(consolidatedReport) {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites 
    name="Fullstack Modern Template Tests" 
    tests="${consolidatedReport.overall.totalTests}" 
    failures="${consolidatedReport.overall.totalFailed}" 
    time="${(consolidatedReport.meta.executionTime / 1000).toFixed(3)}">
    ${Object.entries(consolidatedReport.suites).map(([name, result]) => `
    <testsuite 
        name="${name}" 
        tests="${result.summary?.totalTests || 0}" 
        failures="${result.summary?.failed || 0}" 
        time="${((result.duration || 0) / 1000).toFixed(3)}">
        ${result.status === 'failed' ? `
        <testcase name="${name}" classname="${name}">
            <failure message="${result.error || 'Test suite failed'}">${result.error || 'Unknown error'}</failure>
        </testcase>
        ` : `
        <testcase name="${name}" classname="${name}" time="${((result.duration || 0) / 1000).toFixed(3)}"/>
        `}
    </testsuite>
    `).join('')}
</testsuites>`;

    return xml;
  }

  printTestSummary(consolidatedReport) {
    console.log('\n📊 TEST EXECUTION SUMMARY');
    console.log('=' .repeat(50));
    console.log(`🏆 Quality Score: ${consolidatedReport.overall.qualityScore}/100`);
    console.log(`📋 Test Suites: ${consolidatedReport.overall.completedSuites}/${consolidatedReport.overall.totalSuites} completed (${consolidatedReport.overall.suiteSuccessRate})`);
    console.log(`✅ Total Tests: ${consolidatedReport.overall.totalPassed}/${consolidatedReport.overall.totalTests} passed (${consolidatedReport.overall.overallSuccessRate})`);
    console.log(`🔒 Security: ${consolidatedReport.security.issuesFound} issues (${consolidatedReport.security.criticalIssues} critical)`);
    console.log(`⚡ Performance: ${consolidatedReport.performance.issuesFound} issues`);
    console.log(`⏱️ Execution Time: ${(consolidatedReport.meta.executionTime / 1000).toFixed(2)}s`);

    if (consolidatedReport.recommendations.length > 0) {
      console.log('\n💡 Key Recommendations:');
      consolidatedReport.recommendations.slice(0, 5).forEach(rec => {
        console.log(`   • ${rec}`);
      });
    }

    // Exit with appropriate code for CI/CD
    if (this.config.ciMode) {
      const hasFailures = consolidatedReport.overall.totalFailed > 0;
      const hasCriticalSecurity = consolidatedReport.security.criticalIssues > 0;
      
      if (hasFailures || hasCriticalSecurity) {
        console.log('\n❌ Tests failed or critical issues found - exiting with error code');
        process.exitCode = 1;
      } else {
        console.log('\n✅ All tests passed and no critical issues found');
        process.exitCode = 0;
      }
    }
  }

  /**
   * Utility Methods
   */
  chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * CLI Integration
   */
  static async runFromCLI() {
    const args = process.argv.slice(2);
    const config = {};

    // Parse CLI arguments
    for (let i = 0; i < args.length; i += 2) {
      const key = args[i].replace(/^--/, '');
      const value = args[i + 1];
      
      switch (key) {
        case 'parallel':
          config.parallel = value !== 'false';
          break;
        case 'suites':
          config.suites = value.split(',');
          break;
        case 'environment':
          config.environment = value;
          break;
        case 'timeout':
          config.timeout = parseInt(value);
          break;
        default:
          config[key] = value;
      }
    }

    const orchestrator = new TestOrchestrator(config);
    
    try {
      const report = await orchestrator.runAllTests(config);
      console.log('\n🎉 Test execution completed successfully!');
      return report;
    } catch (error) {
      console.error('\n💥 Test execution failed:', error.message);
      process.exit(1);
    }
  }
}

module.exports = { TestOrchestrator };

// CLI execution
if (require.main === module) {
  TestOrchestrator.runFromCLI();
}