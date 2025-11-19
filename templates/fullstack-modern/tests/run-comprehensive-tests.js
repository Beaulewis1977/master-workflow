#!/usr/bin/env node

/**
 * Comprehensive Test Execution Script for Fullstack Modern Template
 * 
 * This script orchestrates the execution of all test suites including:
 * - Full-stack data flow testing
 * - Real-time WebSocket testing
 * - Database integrity and ACID compliance
 * - Error handling and failure scenarios
 * - Security validation and penetration testing
 * - Load testing and performance benchmarks
 * - Master test orchestration with parallel execution
 */

const fs = require('fs');
const path = require('path');
const { MasterTestOrchestrator } = require('./master-test-orchestrator');

class ComprehensiveTestRunner {
  constructor(options = {}) {
    this.options = {
      // Test environment configuration
      frontendURL: options.frontendURL || process.env.FRONTEND_URL || 'http://localhost:3000',
      backendURL: options.backendURL || process.env.BACKEND_URL || 'http://localhost:8000',
      wsURL: options.wsURL || process.env.WS_URL || 'ws://localhost:8000',
      databaseURL: options.databaseURL || process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/test_db',
      
      // Test execution configuration
      parallel: options.parallel !== false,
      generateReports: options.generateReports !== false,
      stopOnFailure: options.stopOnFailure || false,
      testSuites: options.testSuites || 'all',
      
      // Performance testing configuration
      maxVirtualUsers: options.maxVirtualUsers || 100,
      testDuration: options.testDuration || 120000, // 2 minutes for CI
      
      // Output configuration
      outputDirectory: options.outputDirectory || './test-reports',
      verbose: options.verbose || false,
      
      ...options
    };

    this.results = {
      startTime: null,
      endTime: null,
      totalDuration: 0,
      testSuites: {},
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        successRate: 0
      },
      recommendations: [],
      criticalIssues: []
    };
  }

  async run() {
    console.log('🚀 Starting Comprehensive Test Suite for Fullstack Modern Template');
    console.log('=' .repeat(80));
    console.log('');
    
    this.results.startTime = Date.now();

    try {
      // Validate environment
      await this.validateEnvironment();
      
      // Setup test environment
      await this.setupTestEnvironment();
      
      // Run test suites based on configuration
      if (this.options.testSuites === 'all') {
        await this.runAllTestSuites();
      } else {
        await this.runSelectedTestSuites();
      }
      
      // Generate comprehensive report
      await this.generateFinalReport();
      
      // Display results
      this.displayResults();
      
    } catch (error) {
      console.error('💥 Test execution failed:', error.message);
      if (this.options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    } finally {
      this.results.endTime = Date.now();
      this.results.totalDuration = this.results.endTime - this.results.startTime;
      
      // Cleanup
      await this.cleanup();
    }
  }

  async validateEnvironment() {
    console.log('🔍 Validating test environment...');
    
    const validations = [];
    
    // Check if services are running
    try {
      const axios = require('axios');
      
      // Check backend API
      try {
        await axios.get(`${this.options.backendURL}/api/health`, { timeout: 5000 });
        validations.push({ service: 'Backend API', status: 'running', url: this.options.backendURL });
      } catch (error) {
        validations.push({ service: 'Backend API', status: 'not_running', url: this.options.backendURL, error: error.message });
      }
      
      // Check frontend
      try {
        await axios.get(this.options.frontendURL, { timeout: 5000 });
        validations.push({ service: 'Frontend', status: 'running', url: this.options.frontendURL });
      } catch (error) {
        validations.push({ service: 'Frontend', status: 'not_running', url: this.options.frontendURL, error: error.message });
      }
      
    } catch (error) {
      console.warn('⚠️  Could not validate all services - some tests may fail');
    }
    
    // Check database connection
    try {
      const { Client } = require('pg');
      const client = new Client({ connectionString: this.options.databaseURL });
      await client.connect();
      await client.query('SELECT 1');
      await client.end();
      validations.push({ service: 'Database', status: 'connected' });
    } catch (error) {
      validations.push({ service: 'Database', status: 'not_connected', error: error.message });
    }
    
    // Display validation results
    validations.forEach(validation => {
      const icon = validation.status === 'running' || validation.status === 'connected' ? '✅' : '❌';
      console.log(`  ${icon} ${validation.service}: ${validation.status}`);
      if (validation.error && this.options.verbose) {
        console.log(`     Error: ${validation.error}`);
      }
    });
    
    console.log('');
  }

  async setupTestEnvironment() {
    console.log('🛠️  Setting up test environment...');
    
    // Create output directory
    if (!fs.existsSync(this.options.outputDirectory)) {
      fs.mkdirSync(this.options.outputDirectory, { recursive: true });
      console.log(`  📁 Created output directory: ${this.options.outputDirectory}`);
    }
    
    // Setup test data if needed
    console.log('  📊 Test environment ready');
    console.log('');
  }

  async runAllTestSuites() {
    console.log('🧪 Running All Test Suites...');
    console.log('');
    
    const orchestrator = new MasterTestOrchestrator({
      parallel: this.options.parallel,
      generateReports: true,
      stopOnCriticalFailure: this.options.stopOnFailure,
      frontendURL: this.options.frontendURL,
      backendURL: this.options.backendURL,
      wsURL: this.options.wsURL,
      databaseURL: this.options.databaseURL,
      maxVirtualUsers: this.options.maxVirtualUsers
    });
    
    const orchestratorResult = await orchestrator.runCompleteTestSuite();
    this.results.testSuites.masterOrchestrator = orchestratorResult;
    
    // Also run individual comprehensive test suites
    await this.runIndividualTestSuites();
  }

  async runIndividualTestSuites() {
    console.log('🔬 Running Individual Comprehensive Test Suites...');
    console.log('');
    
    const testSuites = [
      {
        name: 'dataFlowIntegration',
        description: 'Full-Stack Data Flow Integration Tests',
        runner: () => this.runDataFlowTests()
      },
      {
        name: 'websocketTesting',
        description: 'Real-Time WebSocket Testing',
        runner: () => this.runWebSocketTests()
      },
      {
        name: 'databaseIntegrity',
        description: 'Database Integrity and ACID Compliance Tests',
        runner: () => this.runDatabaseIntegrityTests()
      },
      {
        name: 'errorHandling',
        description: 'Comprehensive Error Handling Tests',
        runner: () => this.runErrorHandlingTests()
      },
      {
        name: 'securityValidation',
        description: 'Security Validation and Penetration Tests',
        runner: () => this.runSecurityTests()
      },
      {
        name: 'loadTesting',
        description: 'Load Testing and Performance Benchmarks',
        runner: () => this.runLoadTests()
      }
    ];\
    
    if (this.options.parallel) {
      // Run test suites in parallel
      const promises = testSuites.map(async (suite) => {\
        try {\
          console.log(`  🚀 Starting ${suite.description}...`);\
          const result = await suite.runner();\
          console.log(`  ✅ Completed ${suite.description}`);\
          return { name: suite.name, result, status: 'completed' };\
        } catch (error) {\
          console.log(`  ❌ Failed ${suite.description}: ${error.message}`);\
          return { name: suite.name, error: error.message, status: 'failed' };\
        }\
      });\
      \
      const results = await Promise.allSettled(promises);\
      results.forEach((result, index) => {\
        const suite = testSuites[index];\
        this.results.testSuites[suite.name] = result.status === 'fulfilled' ? result.value : result.reason;\
      });\
    } else {\
      // Run test suites sequentially\
      for (const suite of testSuites) {\
        try {\
          console.log(`  🧪 Running ${suite.description}...`);\
          const result = await suite.runner();\
          this.results.testSuites[suite.name] = { result, status: 'completed' };\
          console.log(`  ✅ Completed ${suite.description}`);\
          \
          if (this.options.stopOnFailure && result.summary && result.summary.failed > 0) {\
            console.log(`  🛑 Stopping due to failures in ${suite.description}`);\
            break;\
          }\
        } catch (error) {\
          console.log(`  ❌ Failed ${suite.description}: ${error.message}`);\
          this.results.testSuites[suite.name] = { error: error.message, status: 'failed' };\
          \
          if (this.options.stopOnFailure) {\
            throw error;\
          }\
        }\
      }\
    }\
  }\

  async runDataFlowTests() {\
    const { DataFlowIntegrationTestSuite } = require('./full-stack/data-flow-integration-tests');\
    const suite = new DataFlowIntegrationTestSuite({\
      frontendURL: this.options.frontendURL,\
      backendURL: this.options.backendURL,\
      wsURL: this.options.wsURL\
    });\
    \
    return await suite.runAllTests();\
  }\

  async runWebSocketTests() {\
    const { WebSocketTestFramework } = require('./websocket/websocket-test-framework');\
    const suite = new WebSocketTestFramework({\
      url: this.options.wsURL,\
      timeout: 15000,\
      concurrentConnections: 50\
    });\
    \
    return await suite.runAllTests();\
  }\

  async runDatabaseIntegrityTests() {\
    const { DatabaseIntegrityTestSuite } = require('./database/database-integrity-test-suite');\
    const suite = new DatabaseIntegrityTestSuite({\
      connectionString: this.options.databaseURL\
    });\
    \
    return await suite.runAllTests();\
  }\

  async runErrorHandlingTests() {\
    const { ComprehensiveErrorHandlingTestSuite } = require('./error-handling/comprehensive-error-handling-test-suite');\
    const suite = new ComprehensiveErrorHandlingTestSuite({\
      apiBaseURL: `${this.options.backendURL}/api`,\
      frontendURL: this.options.frontendURL\
    });\
    \
    return await suite.runAllTests();\
  }\

  async runSecurityTests() {\
    const { SecurityValidationTestSuite } = require('./security/security-validation-tests');\
    const suite = new SecurityValidationTestSuite({\
      baseURL: this.options.backendURL,\
      frontendURL: this.options.frontendURL\
    });\
    \
    return await suite.runAllTests();\
  }\

  async runLoadTests() {\
    const { LoadTestingBenchmarkSuite } = require('./performance/load-testing-benchmark-suite');\
    const suite = new LoadTestingBenchmarkSuite({\
      apiBaseURL: `${this.options.backendURL}/api`,\
      frontendURL: this.options.frontendURL,\
      wsURL: this.options.wsURL,\
      maxVirtualUsers: this.options.maxVirtualUsers,\
      testDuration: this.options.testDuration\
    });\
    \
    return await suite.runAllTests();\
  }\

  async runSelectedTestSuites() {\
    const selected = Array.isArray(this.options.testSuites) \
      ? this.options.testSuites \
      : this.options.testSuites.split(',');\
    \
    console.log(`🎯 Running Selected Test Suites: ${selected.join(', ')}`);\
    console.log('');\
    \
    for (const suiteName of selected) {\
      try {\
        let result;\
        \
        switch (suiteName.trim()) {\
          case 'dataFlow':\
            result = await this.runDataFlowTests();\
            break;\
          case 'websocket':\
            result = await this.runWebSocketTests();\
            break;\
          case 'database':\
            result = await this.runDatabaseIntegrityTests();\
            break;\
          case 'errorHandling':\
            result = await this.runErrorHandlingTests();\
            break;\
          case 'security':\
            result = await this.runSecurityTests();\
            break;\
          case 'load':\
            result = await this.runLoadTests();\
            break;\
          default:\
            console.log(`  ❓ Unknown test suite: ${suiteName}`);\
            continue;\
        }\
        \
        this.results.testSuites[suiteName] = { result, status: 'completed' };\
        console.log(`  ✅ Completed ${suiteName} tests`);\
        \
      } catch (error) {\
        console.log(`  ❌ Failed ${suiteName} tests: ${error.message}`);\
        this.results.testSuites[suiteName] = { error: error.message, status: 'failed' };\
        \
        if (this.options.stopOnFailure) {\
          throw error;\
        }\
      }\
    }\
  }\

  async generateFinalReport() {\
    console.log('📊 Generating comprehensive test report...');\
    \
    // Calculate summary statistics\
    let totalTests = 0;\
    let passedTests = 0;\
    let failedTests = 0;\
    \
    Object.values(this.results.testSuites).forEach(suiteResult => {\
      if (suiteResult.result && suiteResult.result.summary) {\
        totalTests += suiteResult.result.summary.totalTests || suiteResult.result.summary.total || 0;\
        passedTests += suiteResult.result.summary.passed || 0;\
        failedTests += suiteResult.result.summary.failed || 0;\
      }\
    });\
    \
    this.results.summary = {\
      total: totalTests,\
      passed: passedTests,\
      failed: failedTests,\
      skipped: totalTests - passedTests - failedTests,\
      successRate: totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(2) : 0\
    };\
    \
    // Generate recommendations\
    this.generateRecommendations();\
    \
    // Identify critical issues\
    this.identifyCriticalIssues();\
    \
    // Save detailed report\
    const reportPath = path.join(this.options.outputDirectory, 'comprehensive-test-report.json');\
    fs.writeFileSync(reportPath, JSON.stringify({\
      metadata: {\
        timestamp: new Date().toISOString(),\
        duration: this.results.totalDuration,\
        environment: {\
          frontend: this.options.frontendURL,\
          backend: this.options.backendURL,\
          websocket: this.options.wsURL,\
          database: this.options.databaseURL ? '[configured]' : '[not configured]'\
        },\
        configuration: {\
          parallel: this.options.parallel,\
          maxVirtualUsers: this.options.maxVirtualUsers,\
          testDuration: this.options.testDuration\
        }\
      },\
      results: this.results\
    }, null, 2));\
    \
    console.log(`  📄 Detailed report saved to: ${reportPath}`);\
    \
    // Generate HTML report\
    await this.generateHTMLReport();\
  }\

  async generateHTMLReport() {\
    const htmlContent = `\
<!DOCTYPE html>\
<html>\
<head>\
    <title>Comprehensive Test Report - Fullstack Modern Template</title>\
    <style>\
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }\
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }\
        .header { text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px; }\
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }\
        .metric { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #007bff; }\
        .metric h3 { margin: 0 0 10px 0; color: #333; }\
        .metric .value { font-size: 2em; font-weight: bold; color: #007bff; }\
        .success { border-left-color: #28a745; } .success .value { color: #28a745; }\
        .danger { border-left-color: #dc3545; } .danger .value { color: #dc3545; }\
        .warning { border-left-color: #ffc107; } .warning .value { color: #ffc107; }\
        .test-suite { margin-bottom: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; }\
        .test-suite h3 { margin-top: 0; color: #333; }\
        .status-passed { color: #28a745; font-weight: bold; }\
        .status-failed { color: #dc3545; font-weight: bold; }\
        .recommendations { background: #e3f2fd; padding: 20px; border-radius: 8px; margin-top: 20px; }\
        .critical-issues { background: #ffebee; padding: 20px; border-radius: 8px; margin-top: 20px; }\
        ul { padding-left: 20px; }\
        li { margin-bottom: 8px; }\
    </style>\
</head>\
<body>\
    <div class=\"container\">\
        <div class=\"header\">\
            <h1>🧪 Comprehensive Test Report</h1>\
            <p>Fullstack Modern Template - Test Execution Results</p>\
            <p>Generated: ${new Date().toLocaleString()}</p>\
            <p>Duration: ${Math.round(this.results.totalDuration / 1000)}s</p>\
        </div>\
        \
        <div class=\"summary\">\
            <div class=\"metric ${this.results.summary.total > 0 ? 'success' : 'warning'}\">\
                <h3>Total Tests</h3>\
                <div class=\"value\">${this.results.summary.total}</div>\
            </div>\
            <div class=\"metric ${this.results.summary.passed > 0 ? 'success' : 'warning'}\">\
                <h3>Passed</h3>\
                <div class=\"value\">${this.results.summary.passed}</div>\
            </div>\
            <div class=\"metric ${this.results.summary.failed === 0 ? 'success' : 'danger'}\">\
                <h3>Failed</h3>\
                <div class=\"value\">${this.results.summary.failed}</div>\
            </div>\
            <div class=\"metric ${parseFloat(this.results.summary.successRate) >= 90 ? 'success' : parseFloat(this.results.summary.successRate) >= 70 ? 'warning' : 'danger'}\">\
                <h3>Success Rate</h3>\
                <div class=\"value\">${this.results.summary.successRate}%</div>\
            </div>\
        </div>\
        \
        <div class=\"test-suites\">\
            <h2>📋 Test Suite Results</h2>\
            ${Object.entries(this.results.testSuites).map(([name, suite]) => `\
                <div class=\"test-suite\">\
                    <h3>${this.formatSuiteName(name)}</h3>\
                    <p>Status: <span class=\"status-${suite.status === 'completed' ? 'passed' : 'failed'}\">${suite.status}</span></p>\
                    ${suite.result && suite.result.summary ? `\
                        <p>Tests: ${suite.result.summary.passed || 0}/${suite.result.summary.total || suite.result.summary.totalTests || 0} passed</p>\
                        <p>Success Rate: ${suite.result.summary.successRate || 'N/A'}</p>\
                    ` : ''}\
                    ${suite.error ? `<p style=\"color: #dc3545;\">Error: ${suite.error}</p>` : ''}\
                </div>\
            `).join('')}\
        </div>\
        \
        ${this.results.criticalIssues.length > 0 ? `\
            <div class=\"critical-issues\">\
                <h2>🚨 Critical Issues</h2>\
                <ul>\
                    ${this.results.criticalIssues.map(issue => `<li>${issue}</li>`).join('')}\
                </ul>\
            </div>\
        ` : ''}\
        \
        ${this.results.recommendations.length > 0 ? `\
            <div class=\"recommendations\">\
                <h2>💡 Recommendations</h2>\
                <ul>\
                    ${this.results.recommendations.map(rec => `<li>${rec}</li>`).join('')}\
                </ul>\
            </div>\
        ` : ''}\
    </div>\
</body>\
</html>`;\
    \
    const htmlReportPath = path.join(this.options.outputDirectory, 'comprehensive-test-report.html');\
    fs.writeFileSync(htmlReportPath, htmlContent);\
    console.log(`  📊 HTML report saved to: ${htmlReportPath}`);\
  }\

  formatSuiteName(name) {\
    const nameMap = {\
      masterOrchestrator: '🎯 Master Test Orchestrator',\
      dataFlowIntegration: '🔄 Full-Stack Data Flow Integration',\
      websocketTesting: '🌐 Real-Time WebSocket Testing',\
      databaseIntegrity: '🗄️ Database Integrity & ACID Compliance',\
      errorHandling: '🔧 Comprehensive Error Handling',\
      securityValidation: '🔒 Security Validation & Penetration Testing',\
      loadTesting: '📊 Load Testing & Performance Benchmarks'\
    };\
    \
    return nameMap[name] || name;\
  }\

  generateRecommendations() {\
    const recommendations = [];\
    \
    // Analyze results and generate recommendations\
    Object.entries(this.results.testSuites).forEach(([name, suite]) => {\
      if (suite.status === 'failed') {\
        recommendations.push(`Fix issues in ${this.formatSuiteName(name)} test suite`);\
      }\
      \
      if (suite.result && suite.result.recommendations) {\
        recommendations.push(...suite.result.recommendations);\
      }\
    });\
    \
    // Add general recommendations based on success rate\
    if (parseFloat(this.results.summary.successRate) < 70) {\
      recommendations.push('Overall test success rate is below 70% - comprehensive review needed');\
    }\
    \
    if (this.results.summary.failed > 0) {\
      recommendations.push('Address all failing tests before production deployment');\
    }\
    \
    this.results.recommendations = [...new Set(recommendations)]; // Remove duplicates\
  }\

  identifyCriticalIssues() {\
    const criticalIssues = [];\
    \
    // Identify critical issues that block production deployment\
    Object.entries(this.results.testSuites).forEach(([name, suite]) => {\
      if (name === 'securityValidation' && suite.status === 'failed') {\
        criticalIssues.push('Security validation failures detected - immediate attention required');\
      }\
      \
      if (name === 'databaseIntegrity' && suite.status === 'failed') {\
        criticalIssues.push('Database integrity issues detected - data corruption risk');\
      }\
      \
      if (name === 'errorHandling' && suite.status === 'failed') {\
        criticalIssues.push('Error handling failures - poor user experience expected');\
      }\
    });\
    \
    this.results.criticalIssues = criticalIssues;\
  }\

  displayResults() {\
    console.log('');\
    console.log('=' .repeat(80));\
    console.log('📊 COMPREHENSIVE TEST EXECUTION SUMMARY');\
    console.log('=' .repeat(80));\
    console.log('');\
    \
    console.log(`🎯 Overall Results:`);\
    console.log(`   Total Tests: ${this.results.summary.total}`);\
    console.log(`   Passed: ${this.results.summary.passed} ✅`);\
    console.log(`   Failed: ${this.results.summary.failed} ${this.results.summary.failed > 0 ? '❌' : '✅'}`);\
    console.log(`   Success Rate: ${this.results.summary.successRate}%`);\
    console.log(`   Execution Time: ${Math.round(this.results.totalDuration / 1000)}s`);\
    console.log('');\
    \
    console.log(`📋 Test Suite Results:`);\
    Object.entries(this.results.testSuites).forEach(([name, suite]) => {\
      const icon = suite.status === 'completed' ? '✅' : '❌';\
      console.log(`   ${icon} ${this.formatSuiteName(name)}: ${suite.status}`);\
      \
      if (suite.result && suite.result.summary) {\
        const summary = suite.result.summary;\
        console.log(`      Tests: ${summary.passed || 0}/${summary.total || summary.totalTests || 0} passed`);\
      }\
    });\
    console.log('');\
    \
    if (this.results.criticalIssues.length > 0) {\
      console.log(`🚨 Critical Issues:`);\
      this.results.criticalIssues.forEach(issue => {\
        console.log(`   ⚠️  ${issue}`);\
      });\
      console.log('');\
    }\
    \
    if (this.results.recommendations.length > 0) {\
      console.log(`💡 Recommendations:`);\
      this.results.recommendations.slice(0, 5).forEach(rec => {\
        console.log(`   • ${rec}`);\
      });\
      console.log('');\
    }\
    \
    console.log(`📄 Detailed reports available in: ${this.options.outputDirectory}`);\
    console.log('');\
    console.log('=' .repeat(80));\
    \
    // Exit with appropriate code\
    const exitCode = this.results.summary.failed > 0 || this.results.criticalIssues.length > 0 ? 1 : 0;\
    if (exitCode === 1) {\
      console.log('❌ Test execution completed with failures');\
    } else {\
      console.log('✅ Test execution completed successfully');\
    }\
    \
    process.exit(exitCode);\
  }\

  async cleanup() {\
    // Perform any necessary cleanup\
    console.log('🧹 Cleaning up test environment...');\
  }\
}\

// CLI Interface\
function parseArguments() {\
  const args = process.argv.slice(2);\
  const options = {};\
  \
  for (let i = 0; i < args.length; i++) {\
    const arg = args[i];\
    \
    switch (arg) {\
      case '--frontend-url':\
        options.frontendURL = args[++i];\
        break;\
      case '--backend-url':\
        options.backendURL = args[++i];\
        break;\
      case '--ws-url':\
        options.wsURL = args[++i];\
        break;\
      case '--database-url':\
        options.databaseURL = args[++i];\
        break;\
      case '--parallel':\
        options.parallel = true;\
        break;\
      case '--sequential':\
        options.parallel = false;\
        break;\
      case '--stop-on-failure':\
        options.stopOnFailure = true;\
        break;\
      case '--test-suites':\
        options.testSuites = args[++i];\
        break;\
      case '--max-users':\
        options.maxVirtualUsers = parseInt(args[++i]);\
        break;\
      case '--duration':\
        options.testDuration = parseInt(args[++i]) * 1000; // Convert to milliseconds\
        break;\
      case '--output':\
        options.outputDirectory = args[++i];\
        break;\
      case '--verbose':\
        options.verbose = true;\
        break;\
      case '--help':\
        displayHelp();\
        process.exit(0);\
        break;\
    }\
  }\
  \
  return options;\
}\

function displayHelp() {\
  console.log(`\
🧪 Comprehensive Test Runner for Fullstack Modern Template\

Usage: node run-comprehensive-tests.js [options]\

Options:\
  --frontend-url <url>     Frontend URL (default: http://localhost:3000)\
  --backend-url <url>      Backend URL (default: http://localhost:8000)\
  --ws-url <url>          WebSocket URL (default: ws://localhost:8000)\
  --database-url <url>     Database connection string\
  --parallel              Run tests in parallel (default)\
  --sequential            Run tests sequentially\
  --stop-on-failure       Stop execution on first failure\
  --test-suites <list>    Run specific test suites (comma-separated)\
                          Options: dataFlow,websocket,database,errorHandling,security,load,all\
  --max-users <number>    Maximum virtual users for load testing (default: 100)\
  --duration <seconds>    Test duration in seconds (default: 120)\
  --output <directory>    Output directory for reports (default: ./test-reports)\
  --verbose               Enable verbose output\
  --help                  Display this help message\

Examples:\
  # Run all tests with default configuration\
  node run-comprehensive-tests.js\
  \
  # Run specific test suites\
  node run-comprehensive-tests.js --test-suites security,database,load\
  \
  # Run with custom URLs and configuration\
  node run-comprehensive-tests.js --backend-url http://staging.api.com --max-users 200 --duration 300\
  \
  # Run sequentially with verbose output\
  node run-comprehensive-tests.js --sequential --verbose --stop-on-failure\
`);\
}\

// Main execution\
if (require.main === module) {\
  const options = parseArguments();\
  const runner = new ComprehensiveTestRunner(options);\
  runner.run();\
}\

module.exports = { ComprehensiveTestRunner };