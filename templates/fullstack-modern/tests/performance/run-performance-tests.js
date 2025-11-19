#!/usr/bin/env node

/**
 * Performance Test Runner for Fullstack Modern Template
 * 
 * Executes comprehensive performance testing suite and generates reports
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { ComprehensivePerformanceTestingSuite } = require('./comprehensive-performance-testing-suite');
const { PerformanceBenchmarkSuite } = require('./performance-benchmark-suite');
const { LoadTestingBenchmarkSuite } = require('./load-testing-benchmark-suite');

class PerformanceTestRunner {
  constructor() {
    this.config = {
      // Environment URLs - can be overridden via environment variables
      apiBaseURL: process.env.API_URL || 'http://localhost:8000/api',
      frontendURL: process.env.FRONTEND_URL || 'http://localhost:3000',
      wsURL: process.env.WS_URL || 'ws://localhost:8000',
      
      // Test configuration
      testSuite: process.env.TEST_SUITE || 'comprehensive', // comprehensive, benchmark, load
      maxVirtualUsers: parseInt(process.env.MAX_VIRTUAL_USERS) || 1000,
      testDuration: parseInt(process.env.TEST_DURATION) || 300000, // 5 minutes
      
      // Output configuration
      outputDir: process.env.OUTPUT_DIR || './performance-reports',
      reportFormat: process.env.REPORT_FORMAT || 'json', // json, html, markdown
      
      // CI/CD integration
      ciMode: process.env.CI === 'true',
      failOnThresholds: process.env.FAIL_ON_THRESHOLDS === 'true',
      
      // Performance thresholds for CI/CD
      thresholds: {
        overallScore: parseInt(process.env.MIN_PERFORMANCE_SCORE) || 80,
        responseTime: parseInt(process.env.MAX_RESPONSE_TIME) || 500,
        errorRate: parseFloat(process.env.MAX_ERROR_RATE) || 1.0,
        throughput: parseInt(process.env.MIN_THROUGHPUT) || 100
      }
    };

    this.testResults = {};
    this.startTime = Date.now();
  }

  async run() {
    console.log('🚀 Starting Performance Test Runner...\n');
    console.log('Configuration:');
    console.log(`  Test Suite: ${this.config.testSuite}`);
    console.log(`  API URL: ${this.config.apiBaseURL}`);
    console.log(`  Frontend URL: ${this.config.frontendURL}`);
    console.log(`  WebSocket URL: ${this.config.wsURL}`);
    console.log(`  Max Virtual Users: ${this.config.maxVirtualUsers}`);
    console.log(`  Test Duration: ${this.config.testDuration / 1000}s`);
    console.log(`  Output Directory: ${this.config.outputDir}`);
    console.log(`  CI Mode: ${this.config.ciMode}`);
    console.log('');

    try {
      // Ensure output directory exists
      await this.ensureOutputDirectory();

      // Check if services are running
      await this.checkServiceAvailability();

      // Run selected test suite
      const testResults = await this.runTestSuite();

      // Generate reports
      await this.generateReports(testResults);

      // Check thresholds for CI/CD
      if (this.config.ciMode || this.config.failOnThresholds) {
        await this.checkPerformanceThresholds(testResults);
      }

      console.log('\\n✅ Performance testing completed successfully!');
      console.log(`📊 Results saved to: ${this.config.outputDir}`);

      return testResults;

    } catch (error) {
      console.error('❌ Performance testing failed:', error.message);
      
      if (this.config.ciMode) {
        process.exit(1);
      }
      
      throw error;
    }
  }

  async ensureOutputDirectory() {
    try {
      await fs.access(this.config.outputDir);
    } catch {
      await fs.mkdir(this.config.outputDir, { recursive: true });
      console.log(`📁 Created output directory: ${this.config.outputDir}`);
    }
  }

  async checkServiceAvailability() {
    console.log('🔍 Checking service availability...');
    
    const axios = require('axios');
    const services = [
      { name: 'API Server', url: this.config.apiBaseURL.replace('/api', '/health') },
      { name: 'Frontend', url: this.config.frontendURL }
    ];

    for (const service of services) {
      try {
        console.log(`  Checking ${service.name} at ${service.url}...`);
        const response = await axios.get(service.url, { 
          timeout: 10000,
          validateStatus: () => true // Accept any status code
        });
        
        if (response.status < 400) {
          console.log(`  ✅ ${service.name} is available (${response.status})`);
        } else {
          console.log(`  ⚠️  ${service.name} returned status ${response.status}`);
        }
      } catch (error) {
        const message = `❌ ${service.name} is not available: ${error.message}`;
        console.log(`  ${message}`);
        
        if (this.config.ciMode) {
          throw new Error(message);
        } else {
          console.log('  ⚠️  Continuing with tests (non-CI mode)');
        }
      }
    }
    
    console.log('');
  }

  async runTestSuite() {
    console.log(`🎯 Running ${this.config.testSuite} test suite...\\n`);

    switch (this.config.testSuite.toLowerCase()) {
      case 'comprehensive':
        return await this.runComprehensiveTests();
      
      case 'benchmark':
        return await this.runBenchmarkTests();
      
      case 'load':
        return await this.runLoadTests();
      
      case 'all':
        return await this.runAllTestSuites();
      
      default:
        throw new Error(`Unknown test suite: ${this.config.testSuite}`);
    }
  }

  async runComprehensiveTests() {
    const suite = new ComprehensivePerformanceTestingSuite({
      apiBaseURL: this.config.apiBaseURL,
      frontendURL: this.config.frontendURL,
      wsURL: this.config.wsURL,
      maxVirtualUsers: this.config.maxVirtualUsers,
      testDuration: this.config.testDuration
    });

    return await suite.runAllTests();
  }

  async runBenchmarkTests() {
    const suite = new PerformanceBenchmarkSuite({
      baseURL: this.config.apiBaseURL.replace('/api', ''),
      frontendURL: this.config.frontendURL,
      wsURL: this.config.wsURL,
      maxVirtualUsers: this.config.maxVirtualUsers,
      testDuration: this.config.testDuration
    });

    return await suite.runAllTests();
  }

  async runLoadTests() {
    const suite = new LoadTestingBenchmarkSuite({
      apiBaseURL: this.config.apiBaseURL,
      frontendURL: this.config.frontendURL,
      wsURL: this.config.wsURL,
      maxVirtualUsers: this.config.maxVirtualUsers,
      testDuration: this.config.testDuration
    });

    return await suite.runAllTests();
  }

  async runAllTestSuites() {
    console.log('🏃‍♂️ Running all test suites sequentially...\\n');
    
    const results = {
      comprehensive: await this.runComprehensiveTests(),
      benchmark: await this.runBenchmarkTests(),
      load: await this.runLoadTests(),
      consolidatedMetrics: {}
    };

    // Consolidate metrics from all suites
    results.consolidatedMetrics = this.consolidateMetrics(results);

    return results;
  }

  consolidateMetrics(results) {
    const metrics = {
      overallScore: 0,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      avgResponseTime: 0,
      maxThroughput: 0,
      avgErrorRate: 0,
      recommendations: []
    };

    const suites = ['comprehensive', 'benchmark', 'load'];
    const validResults = suites.filter(suite => results[suite] && results[suite].summary);

    if (validResults.length === 0) {
      return metrics;
    }

    // Aggregate metrics
    validResults.forEach(suite => {
      const result = results[suite];
      if (result.summary) {
        metrics.totalTests += result.summary.totalTests || 0;
        metrics.passedTests += result.summary.passed || 0;
        metrics.failedTests += result.summary.failed || 0;
      }

      if (result.summary && result.summary.overallScore) {
        metrics.overallScore += result.summary.overallScore;
      }

      if (result.performanceMetrics) {
        if (result.performanceMetrics.avgResponseTime) {
          metrics.avgResponseTime += parseFloat(result.performanceMetrics.avgResponseTime) || 0;
        }
        if (result.performanceMetrics.avgThroughput) {
          metrics.maxThroughput = Math.max(metrics.maxThroughput, parseFloat(result.performanceMetrics.avgThroughput) || 0);
        }
        if (result.performanceMetrics.avgErrorRate) {
          metrics.avgErrorRate += parseFloat(result.performanceMetrics.avgErrorRate) || 0;
        }
      }

      if (result.recommendations) {
        if (Array.isArray(result.recommendations)) {
          metrics.recommendations.push(...result.recommendations);
        } else if (result.recommendations.immediate) {
          metrics.recommendations.push(...result.recommendations.immediate);
        }
      }
    });

    // Calculate averages
    metrics.overallScore = Math.round(metrics.overallScore / validResults.length);
    metrics.avgResponseTime = Math.round(metrics.avgResponseTime / validResults.length);
    metrics.avgErrorRate = Math.round((metrics.avgErrorRate / validResults.length) * 100) / 100;
    metrics.successRate = metrics.totalTests > 0 ? 
      Math.round((metrics.passedTests / metrics.totalTests) * 100) : 0;

    // Remove duplicate recommendations
    metrics.recommendations = [...new Set(metrics.recommendations)];

    return metrics;
  }

  async generateReports(testResults) {
    console.log('📊 Generating performance reports...\\n');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reports = [];

    // Generate JSON report
    if (this.config.reportFormat === 'json' || this.config.reportFormat === 'all') {
      const jsonReport = await this.generateJSONReport(testResults, timestamp);
      reports.push(jsonReport);
    }

    // Generate HTML report
    if (this.config.reportFormat === 'html' || this.config.reportFormat === 'all') {
      const htmlReport = await this.generateHTMLReport(testResults, timestamp);
      reports.push(htmlReport);
    }

    // Generate Markdown report
    if (this.config.reportFormat === 'markdown' || this.config.reportFormat === 'all') {
      const markdownReport = await this.generateMarkdownReport(testResults, timestamp);
      reports.push(markdownReport);
    }

    // Generate CI/CD report
    if (this.config.ciMode) {
      const ciReport = await this.generateCIReport(testResults, timestamp);
      reports.push(ciReport);
    }

    console.log('📄 Generated reports:');
    reports.forEach(report => console.log(`  • ${report}`));
    console.log('');

    return reports;
  }

  async generateJSONReport(testResults, timestamp) {
    const reportPath = path.join(this.config.outputDir, `performance-report-${timestamp}.json`);
    
    const report = {
      metadata: {
        timestamp: new Date().toISOString(),
        testDuration: Date.now() - this.startTime,
        configuration: this.config,
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          memory: process.memoryUsage()
        }
      },
      results: testResults,
      summary: testResults.consolidatedMetrics || testResults.summary || {}
    };

    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    return reportPath;
  }

  async generateHTMLReport(testResults, timestamp) {
    const reportPath = path.join(this.config.outputDir, `performance-report-${timestamp}.html`);
    
    const html = this.generateHTMLContent(testResults);
    await fs.writeFile(reportPath, html);
    return reportPath;
  }

  generateHTMLContent(testResults) {
    const summary = testResults.consolidatedMetrics || testResults.summary || {};
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Performance Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .score-circle { display: inline-block; width: 120px; height: 120px; border-radius: 50%; background: conic-gradient(#4CAF50 ${summary.overallScore || 0}%, #e0e0e0 0%); position: relative; }
        .score-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 24px; font-weight: bold; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 30px 0; }
        .metric-card { background: #f9f9f9; padding: 20px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 32px; font-weight: bold; color: #2196F3; }
        .metric-label { color: #666; margin-top: 5px; }
        .recommendations { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .recommendations h3 { margin-top: 0; color: #856404; }
        .recommendations ul { margin: 0; padding-left: 20px; }
        .status-badge { padding: 4px 8px; border-radius: 4px; color: white; font-weight: bold; }
        .status-pass { background-color: #4CAF50; }
        .status-fail { background-color: #f44336; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Performance Test Report</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
            <div class="score-circle">
                <div class="score-text">${summary.overallScore || 0}</div>
            </div>
            <p>Overall Performance Score</p>
        </div>
        
        <div class="metrics">
            <div class="metric-card">
                <div class="metric-value">${summary.totalTests || 0}</div>
                <div class="metric-label">Total Tests</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${summary.passedTests || 0}</div>
                <div class="metric-label">Passed Tests</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${summary.avgResponseTime || 0}ms</div>
                <div class="metric-label">Avg Response Time</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${summary.maxThroughput || 0}</div>
                <div class="metric-label">Max Throughput (RPS)</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${summary.avgErrorRate || 0}%</div>
                <div class="metric-label">Avg Error Rate</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${summary.successRate || 0}%</div>
                <div class="metric-label">Success Rate</div>
            </div>
        </div>
        
        ${summary.recommendations && summary.recommendations.length > 0 ? `
        <div class="recommendations">
            <h3>Performance Recommendations</h3>
            <ul>
                ${summary.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </div>
        ` : ''}
        
        <div style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
            Report generated by Fullstack Modern Template Performance Testing Suite
        </div>
    </div>
</body>
</html>`;
  }

  async generateMarkdownReport(testResults, timestamp) {
    const reportPath = path.join(this.config.outputDir, `performance-report-${timestamp}.md`);
    
    const markdown = this.generateMarkdownContent(testResults);
    await fs.writeFile(reportPath, markdown);
    return reportPath;
  }

  generateMarkdownContent(testResults) {
    const summary = testResults.consolidatedMetrics || testResults.summary || {};
    
    return `# Performance Test Report

**Generated:** ${new Date().toISOString()}
**Test Suite:** ${this.config.testSuite}
**Duration:** ${Math.round((Date.now() - this.startTime) / 1000)}s

## Overall Performance Score: ${summary.overallScore || 0}/100

## Test Summary

| Metric | Value |
|--------|-------|
| Total Tests | ${summary.totalTests || 0} |
| Passed Tests | ${summary.passedTests || 0} |
| Failed Tests | ${summary.failedTests || 0} |
| Success Rate | ${summary.successRate || 0}% |
| Average Response Time | ${summary.avgResponseTime || 0}ms |
| Max Throughput | ${summary.maxThroughput || 0} RPS |
| Average Error Rate | ${summary.avgErrorRate || 0}% |

## Performance Metrics

### Response Time Distribution
- **Average:** ${summary.avgResponseTime || 0}ms
- **Target:** < ${this.config.thresholds.responseTime}ms
- **Status:** ${(summary.avgResponseTime || 0) <= this.config.thresholds.responseTime ? '✅ PASS' : '❌ FAIL'}

### Throughput
- **Maximum:** ${summary.maxThroughput || 0} RPS
- **Target:** > ${this.config.thresholds.throughput} RPS
- **Status:** ${(summary.maxThroughput || 0) >= this.config.thresholds.throughput ? '✅ PASS' : '❌ FAIL'}

### Error Rate
- **Average:** ${summary.avgErrorRate || 0}%
- **Target:** < ${this.config.thresholds.errorRate}%
- **Status:** ${(summary.avgErrorRate || 0) <= this.config.thresholds.errorRate ? '✅ PASS' : '❌ FAIL'}

${summary.recommendations && summary.recommendations.length > 0 ? `
## Recommendations

${summary.recommendations.map(rec => `- ${rec}`).join('\\n')}
` : ''}

## Configuration

- **API URL:** ${this.config.apiBaseURL}
- **Frontend URL:** ${this.config.frontendURL}
- **WebSocket URL:** ${this.config.wsURL}
- **Max Virtual Users:** ${this.config.maxVirtualUsers}
- **Test Duration:** ${this.config.testDuration / 1000}s

---
*Report generated by Fullstack Modern Template Performance Testing Suite*
`;
  }

  async generateCIReport(testResults, timestamp) {
    const reportPath = path.join(this.config.outputDir, `ci-performance-report-${timestamp}.json`);
    
    const summary = testResults.consolidatedMetrics || testResults.summary || {};
    
    const ciReport = {
      passed: this.evaluateOverallSuccess(summary),
      score: summary.overallScore || 0,
      thresholds: this.config.thresholds,
      metrics: {
        totalTests: summary.totalTests || 0,
        passedTests: summary.passedTests || 0,
        failedTests: summary.failedTests || 0,
        successRate: summary.successRate || 0,
        avgResponseTime: summary.avgResponseTime || 0,
        maxThroughput: summary.maxThroughput || 0,
        avgErrorRate: summary.avgErrorRate || 0
      },
      recommendations: summary.recommendations || [],
      timestamp: new Date().toISOString()
    };

    await fs.writeFile(reportPath, JSON.stringify(ciReport, null, 2));
    return reportPath;
  }

  evaluateOverallSuccess(summary) {
    const scoreCheck = (summary.overallScore || 0) >= this.config.thresholds.overallScore;
    const responseTimeCheck = (summary.avgResponseTime || 0) <= this.config.thresholds.responseTime;
    const errorRateCheck = (summary.avgErrorRate || 0) <= this.config.thresholds.errorRate;
    const throughputCheck = (summary.maxThroughput || 0) >= this.config.thresholds.throughput;

    return scoreCheck && responseTimeCheck && errorRateCheck && throughputCheck;
  }

  async checkPerformanceThresholds(testResults) {
    console.log('🎯 Checking performance thresholds...\\n');
    
    const summary = testResults.consolidatedMetrics || testResults.summary || {};
    const checks = [
      {
        name: 'Overall Score',
        value: summary.overallScore || 0,
        threshold: this.config.thresholds.overallScore,
        operator: '>=',
        passed: (summary.overallScore || 0) >= this.config.thresholds.overallScore
      },
      {
        name: 'Response Time',
        value: summary.avgResponseTime || 0,
        threshold: this.config.thresholds.responseTime,
        operator: '<=',
        passed: (summary.avgResponseTime || 0) <= this.config.thresholds.responseTime
      },
      {
        name: 'Error Rate',
        value: summary.avgErrorRate || 0,
        threshold: this.config.thresholds.errorRate,
        operator: '<=',
        passed: (summary.avgErrorRate || 0) <= this.config.thresholds.errorRate
      },
      {
        name: 'Throughput',
        value: summary.maxThroughput || 0,
        threshold: this.config.thresholds.throughput,
        operator: '>=',
        passed: (summary.maxThroughput || 0) >= this.config.thresholds.throughput
      }
    ];

    let allPassed = true;

    checks.forEach(check => {
      const status = check.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`  ${check.name}: ${check.value} ${check.operator} ${check.threshold} - ${status}`);
      
      if (!check.passed) {
        allPassed = false;
      }
    });

    console.log('');

    if (!allPassed && this.config.failOnThresholds) {
      throw new Error('Performance thresholds not met');
    }

    return allPassed;
  }
}

// CLI handling
async function main() {
  const args = process.argv.slice(2);
  const runner = new PerformanceTestRunner();

  // Parse command line arguments
  args.forEach(arg => {
    if (arg.startsWith('--suite=')) {
      runner.config.testSuite = arg.split('=')[1];
    } else if (arg.startsWith('--format=')) {
      runner.config.reportFormat = arg.split('=')[1];
    } else if (arg.startsWith('--output=')) {
      runner.config.outputDir = arg.split('=')[1];
    } else if (arg === '--ci') {
      runner.config.ciMode = true;
    } else if (arg === '--fail-on-thresholds') {
      runner.config.failOnThresholds = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Performance Test Runner for Fullstack Modern Template

Usage: node run-performance-tests.js [options]

Options:
  --suite=<suite>           Test suite to run (comprehensive, benchmark, load, all)
  --format=<format>         Report format (json, html, markdown, all)
  --output=<dir>            Output directory for reports
  --ci                      Enable CI mode
  --fail-on-thresholds      Fail if performance thresholds are not met
  --help, -h                Show this help message

Environment Variables:
  API_URL                   API base URL (default: http://localhost:8000/api)
  FRONTEND_URL              Frontend URL (default: http://localhost:3000)
  WS_URL                    WebSocket URL (default: ws://localhost:8000)
  TEST_SUITE                Test suite to run
  MAX_VIRTUAL_USERS         Maximum virtual users for load testing
  TEST_DURATION             Test duration in milliseconds
  OUTPUT_DIR                Output directory for reports
  REPORT_FORMAT             Report format
  CI                        Enable CI mode (true/false)
  FAIL_ON_THRESHOLDS        Fail on threshold violations (true/false)
  MIN_PERFORMANCE_SCORE     Minimum overall performance score
  MAX_RESPONSE_TIME         Maximum acceptable response time (ms)
  MAX_ERROR_RATE            Maximum acceptable error rate (%)
  MIN_THROUGHPUT            Minimum acceptable throughput (RPS)

Examples:
  node run-performance-tests.js --suite=comprehensive --format=html
  node run-performance-tests.js --suite=load --ci --fail-on-thresholds
  API_URL=https://api.example.com node run-performance-tests.js
`);
      process.exit(0);
    }
  });

  try {
    await runner.run();
    process.exit(0);
  } catch (error) {
    console.error('Performance testing failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { PerformanceTestRunner };