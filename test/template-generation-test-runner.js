#!/usr/bin/env node

/**
 * Template Generation Test Runner
 * 
 * Comprehensive test runner that orchestrates all template generation tests
 * Executes all test suites and generates consolidated reports
 */

const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const crypto = require('crypto');
const os = require('os');

const execAsync = promisify(exec);

class TemplateGenerationTestRunner {
  constructor() {
    this.runId = crypto.randomUUID();
    this.startTime = Date.now();
    this.testSuites = [
      {
        name: 'Unit Tests',
        file: 'template-generation-unit-tests.js',
        description: 'Unit tests for template generation functions',
        critical: true,
        timeout: 120000 // 2 minutes
      },
      {
        name: 'Integration Tests',
        file: 'template-generation-integration-tests.js',
        description: 'Integration tests for complete workflow',
        critical: true,
        timeout: 300000 // 5 minutes
      },
      {
        name: 'End-to-End Tests',
        file: 'template-generation-e2e-tests.js',
        description: 'E2E tests for CLI command execution',
        critical: true,
        timeout: 600000 // 10 minutes
      },
      {
        name: 'File Validation Tests',
        file: 'template-file-validation-tests.js',
        description: 'Validation of generated file contents',
        critical: true,
        timeout: 180000 // 3 minutes
      },
      {
        name: 'Customization Tests',
        file: 'template-customization-tests.js',
        description: 'Template variable substitution tests',
        critical: true,
        timeout: 180000 // 3 minutes
      },
      {
        name: 'Error Handling Tests',
        file: 'template-error-handling-tests.js',
        description: 'Error handling and edge cases',
        critical: false,
        timeout: 240000 // 4 minutes
      },
      {
        name: 'Dependency Validation Tests',
        file: 'template-dependency-validation-tests.js',
        description: 'Package.json and dependency validation',
        critical: false,
        timeout: 600000 // 10 minutes (includes installation)
      },
      {
        name: 'Docker Configuration Tests',
        file: 'template-docker-config-tests.js',
        description: 'Docker and deployment configuration tests',
        critical: false,
        timeout: 900000 // 15 minutes (includes builds)
      }
    ];
    
    this.results = [];
    this.reports = [];
    
    console.log(`🚀 Template Generation Test Runner - Run ID: ${this.runId}`);
    console.log(`📅 Started: ${new Date().toISOString()}`);
    console.log(`🧪 Test Suites: ${this.testSuites.length}`);
    console.log('═'.repeat(80));
  }

  // Execute a single test suite
  async executeTestSuite(suite) {
    const suiteStartTime = Date.now();
    
    console.log(`\n🔍 Running: ${suite.name}`);
    console.log(`📝 Description: ${suite.description}`);
    console.log(`⏰ Timeout: ${suite.timeout / 1000}s`);
    console.log(`🔥 Critical: ${suite.critical ? 'Yes' : 'No'}`);
    
    const testFilePath = path.join(__dirname, suite.file);
    
    if (!fs.existsSync(testFilePath)) {
      const result = {
        suite: suite.name,
        status: 'failed',
        error: `Test file not found: ${suite.file}`,
        duration: Date.now() - suiteStartTime,
        critical: suite.critical
      };
      
      this.results.push(result);
      console.log(`❌ ${suite.name} - Test file not found`);
      return result;
    }
    
    try {
      // Execute test suite
      const result = await execAsync(`node "${testFilePath}"`, {
        timeout: suite.timeout,
        cwd: __dirname,
        env: { ...process.env, NODE_ENV: 'test' }
      });
      
      const duration = Date.now() - suiteStartTime;
      
      // Parse output for additional information
      const output = result.stdout + result.stderr;
      const passRateMatch = output.match(/Pass Rate: ([\d.]+)%/);
      const passRate = passRateMatch ? parseFloat(passRateMatch[1]) : null;
      
      const testResult = {
        suite: suite.name,
        status: 'passed',
        duration,
        passRate,
        stdout: result.stdout,
        stderr: result.stderr,
        critical: suite.critical
      };
      
      this.results.push(testResult);
      
      console.log(`✅ ${suite.name} - Completed (${duration}ms)`);
      if (passRate !== null) {
        console.log(`   📊 Pass Rate: ${passRate}%`);
      }
      
      // Try to find and load the test report
      this.loadTestReport(suite);
      
      return testResult;
      
    } catch (error) {
      const duration = Date.now() - suiteStartTime;
      
      const testResult = {
        suite: suite.name,
        status: 'failed',
        duration,
        error: error.message,
        stdout: error.stdout || '',
        stderr: error.stderr || '',
        exitCode: error.code || -1,
        critical: suite.critical
      };
      
      this.results.push(testResult);
      
      console.log(`❌ ${suite.name} - Failed (${duration}ms)`);
      console.log(`   Error: ${error.message.substring(0, 200)}`);
      
      return testResult;
    }
  }

  // Load individual test report if available
  loadTestReport(suite) {
    try {
      // Look for report files with various naming patterns
      const reportPatterns = [
        `template-generation-unit-test-report-*.json`,
        `template-generation-integration-test-report-*.json`,
        `template-generation-e2e-test-report-*.json`,
        `template-file-validation-test-report-*.json`,
        `template-customization-test-report-*.json`,
        `template-error-handling-test-report-*.json`,
        `template-dependency-validation-test-report-*.json`,
        `template-docker-config-test-report-*.json`
      ];
      
      const reportFiles = fs.readdirSync(process.cwd()).filter(file => 
        file.endsWith('.json') && file.includes('test-report')
      );
      
      // Find the most recent report file for this suite
      const relevantReports = reportFiles.filter(file => {
        const lowerFile = file.toLowerCase();
        const lowerSuite = suite.name.toLowerCase().replace(/\s+/g, '-');
        return lowerFile.includes(lowerSuite.split(' ')[0]);
      });
      
      if (relevantReports.length > 0) {
        // Sort by modification time and take the most recent
        const sortedReports = relevantReports
          .map(file => ({
            file,
            mtime: fs.statSync(path.join(process.cwd(), file)).mtime
          }))
          .sort((a, b) => b.mtime - a.mtime);
        
        const reportPath = path.join(process.cwd(), sortedReports[0].file);
        const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
        
        this.reports.push({
          suite: suite.name,
          reportFile: sortedReports[0].file,
          reportData
        });
        
        console.log(`   📄 Report: ${sortedReports[0].file}`);
      }
      
    } catch (error) {
      console.log(`   ⚠️  Could not load report for ${suite.name}: ${error.message}`);
    }
  }

  // Run all test suites
  async runAllTests(options = {}) {
    const {
      parallel = false,
      continueOnFailure = true,
      skipNonCritical = false,
      suitesToRun = []
    } = options;
    
    let suitesToExecute = this.testSuites;
    
    // Filter suites based on options
    if (skipNonCritical) {
      suitesToExecute = suitesToExecute.filter(suite => suite.critical);
    }
    
    if (suitesToRun.length > 0) {
      suitesToExecute = suitesToExecute.filter(suite => 
        suitesToRun.some(name => suite.name.toLowerCase().includes(name.toLowerCase()))
      );
    }
    
    console.log(`\n🎯 Executing ${suitesToExecute.length} test suites...`);
    
    if (parallel && suitesToExecute.length > 1) {
      console.log('⚡ Running tests in parallel...');
      
      // Run tests in parallel
      const promises = suitesToExecute.map(suite => this.executeTestSuite(suite));
      await Promise.all(promises);
      
    } else {
      console.log('🔄 Running tests sequentially...');
      
      // Run tests sequentially
      for (const suite of suitesToExecute) {
        const result = await this.executeTestSuite(suite);
        
        // Stop on critical failure if continueOnFailure is false
        if (!continueOnFailure && result.status === 'failed' && result.critical) {
          console.log(`\n🛑 Stopping execution due to critical failure in ${suite.name}`);
          break;
        }
      }
    }
    
    return this.generateConsolidatedReport();
  }

  // Generate consolidated test report
  generateConsolidatedReport() {
    const totalDuration = Date.now() - this.startTime;
    
    const summary = {
      runId: this.runId,
      startTime: new Date(this.startTime).toISOString(),
      endTime: new Date().toISOString(),
      totalDuration,
      
      totalSuites: this.results.length,
      passedSuites: this.results.filter(r => r.status === 'passed').length,
      failedSuites: this.results.filter(r => r.status === 'failed').length,
      skippedSuites: this.results.filter(r => r.status === 'skipped').length,
      
      criticalSuites: this.results.filter(r => r.critical).length,
      criticalPassed: this.results.filter(r => r.critical && r.status === 'passed').length,
      criticalFailed: this.results.filter(r => r.critical && r.status === 'failed').length,
      
      overallPassRate: this.results.length > 0 
        ? (this.results.filter(r => r.status === 'passed').length / this.results.length * 100).toFixed(2)
        : 0
    };
    
    // Calculate aggregated metrics from individual reports
    const aggregatedMetrics = this.calculateAggregatedMetrics();
    
    const consolidatedReport = {
      runId: this.runId,
      timestamp: new Date().toISOString(),
      testType: 'template-generation-comprehensive',
      
      summary,
      results: this.results,
      individualReports: this.reports,
      aggregatedMetrics,
      
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        cwd: process.cwd(),
        testRunner: 'template-generation-test-runner.js'
      },
      
      recommendations: this.generateRecommendations()
    };
    
    // Save consolidated report
    const reportPath = path.join(process.cwd(), `template-generation-consolidated-report-${this.runId}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(consolidatedReport, null, 2));
    
    // Generate summary report
    const summaryPath = path.join(process.cwd(), `template-generation-test-summary-${this.runId}.md`);
    this.generateMarkdownSummary(consolidatedReport, summaryPath);
    
    this.printSummary(consolidatedReport);
    
    return consolidatedReport;
  }

  // Calculate aggregated metrics from individual test reports
  calculateAggregatedMetrics() {
    const metrics = {
      totalTests: 0,
      totalPassed: 0,
      totalFailed: 0,
      totalSkipped: 0,
      totalDuration: 0,
      
      averagePassRate: 0,
      testCoverage: {},
      performanceMetrics: {}
    };
    
    this.reports.forEach(report => {
      if (report.reportData && report.reportData.summary) {
        const summary = report.reportData.summary;
        
        metrics.totalTests += summary.total || 0;
        metrics.totalPassed += summary.passed || 0;
        metrics.totalFailed += summary.failed || 0;
        metrics.totalSkipped += summary.skipped || 0;
        metrics.totalDuration += summary.totalDuration || 0;
      }
    });
    
    // Calculate average pass rate
    const passRates = this.reports
      .map(r => r.reportData?.summary?.passRate)
      .filter(rate => rate !== undefined && rate !== null)
      .map(rate => parseFloat(rate));
    
    if (passRates.length > 0) {
      metrics.averagePassRate = (passRates.reduce((sum, rate) => sum + rate, 0) / passRates.length).toFixed(2);
    }
    
    return metrics;
  }

  // Generate recommendations based on test results
  generateRecommendations() {
    const recommendations = [];
    
    // Check overall pass rate
    const overallPassRate = parseFloat(this.calculateAggregatedMetrics().averagePassRate);
    
    if (overallPassRate < 90) {
      recommendations.push({
        type: 'quality',
        priority: 'high',
        message: `Overall pass rate is ${overallPassRate}%. Consider investigating failing tests.`
      });
    }
    
    // Check for critical failures
    const criticalFailures = this.results.filter(r => r.critical && r.status === 'failed');
    
    if (criticalFailures.length > 0) {
      recommendations.push({
        type: 'critical',
        priority: 'urgent',
        message: `${criticalFailures.length} critical test suite(s) failed: ${criticalFailures.map(f => f.suite).join(', ')}`
      });
    }
    
    // Check for slow tests
    const slowTests = this.results.filter(r => r.duration > 300000); // 5 minutes
    
    if (slowTests.length > 0) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        message: `Slow test suites detected: ${slowTests.map(t => `${t.suite} (${t.duration}ms)`).join(', ')}`
      });
    }
    
    // Check for missing reports
    const missingReports = this.results.filter(r => 
      !this.reports.some(report => report.suite === r.suite)
    );
    
    if (missingReports.length > 0) {
      recommendations.push({
        type: 'reporting',
        priority: 'low',
        message: `Test reports not found for: ${missingReports.map(r => r.suite).join(', ')}`
      });
    }
    
    return recommendations;
  }

  // Generate Markdown summary report
  generateMarkdownSummary(report, filePath) {
    const md = [];
    
    md.push(`# Template Generation Test Summary`);
    md.push(``);
    md.push(`**Run ID:** ${report.runId}`);
    md.push(`**Date:** ${report.timestamp}`);
    md.push(`**Duration:** ${report.summary.totalDuration}ms`);
    md.push(``);
    
    md.push(`## Overall Results`);
    md.push(``);
    md.push(`| Metric | Value |`);
    md.push(`|--------|-------|`);
    md.push(`| Total Suites | ${report.summary.totalSuites} |`);
    md.push(`| Passed | ${report.summary.passedSuites} |`);
    md.push(`| Failed | ${report.summary.failedSuites} |`);
    md.push(`| Pass Rate | ${report.summary.overallPassRate}% |`);
    md.push(`| Critical Suites | ${report.summary.criticalSuites} |`);
    md.push(`| Critical Passed | ${report.summary.criticalPassed} |`);
    md.push(`| Critical Failed | ${report.summary.criticalFailed} |`);
    md.push(``);
    
    md.push(`## Test Suite Results`);
    md.push(``);
    
    report.results.forEach(result => {
      const status = result.status === 'passed' ? '✅' : result.status === 'failed' ? '❌' : '⚠️';
      const critical = result.critical ? '🔥' : '';
      
      md.push(`### ${status} ${result.suite} ${critical}`);
      md.push(``);
      md.push(`- **Status:** ${result.status}`);
      md.push(`- **Duration:** ${result.duration}ms`);
      md.push(`- **Critical:** ${result.critical ? 'Yes' : 'No'}`);
      
      if (result.passRate !== undefined) {
        md.push(`- **Pass Rate:** ${result.passRate}%`);
      }
      
      if (result.error) {
        md.push(`- **Error:** ${result.error}`);
      }
      
      md.push(``);
    });
    
    if (report.recommendations.length > 0) {
      md.push(`## Recommendations`);
      md.push(``);
      
      report.recommendations.forEach(rec => {
        const priority = rec.priority === 'urgent' ? '🚨' : 
                        rec.priority === 'high' ? '⚠️' : 
                        rec.priority === 'medium' ? 'ℹ️' : '💡';
        
        md.push(`${priority} **${rec.type.toUpperCase()}**: ${rec.message}`);
        md.push(``);
      });
    }
    
    md.push(`## Environment`);
    md.push(``);
    md.push(`- **Node.js:** ${report.environment.nodeVersion}`);
    md.push(`- **Platform:** ${report.environment.platform} (${report.environment.arch})`);
    md.push(`- **Working Directory:** ${report.environment.cwd}`);
    md.push(``);
    
    fs.writeFileSync(filePath, md.join('\n'));
  }

  // Print summary to console
  printSummary(report) {
    console.log('\n');
    console.log('🏁 Template Generation Test Run Complete');
    console.log('═'.repeat(80));
    console.log(`📋 Run ID: ${report.runId}`);
    console.log(`⏱️  Total Duration: ${report.summary.totalDuration}ms`);
    console.log(`📊 Overall Pass Rate: ${report.summary.overallPassRate}%`);
    console.log(``);
    
    console.log(`📈 Suite Summary:`);
    console.log(`   Total: ${report.summary.totalSuites}`);
    console.log(`   Passed: ${report.summary.passedSuites}`);
    console.log(`   Failed: ${report.summary.failedSuites}`);
    console.log(`   Skipped: ${report.summary.skippedSuites}`);
    console.log(``);
    
    console.log(`🔥 Critical Suites:`);
    console.log(`   Total: ${report.summary.criticalSuites}`);
    console.log(`   Passed: ${report.summary.criticalPassed}`);
    console.log(`   Failed: ${report.summary.criticalFailed}`);
    console.log(``);
    
    if (report.summary.failedSuites > 0) {
      console.log(`❌ Failed Suites:`);
      this.results
        .filter(r => r.status === 'failed')
        .forEach(result => {
          console.log(`   - ${result.suite}${result.critical ? ' (CRITICAL)' : ''}`);
        });
      console.log(``);
    }
    
    if (report.recommendations.length > 0) {
      console.log(`💡 Recommendations:`);
      report.recommendations.forEach(rec => {
        const icon = rec.priority === 'urgent' ? '🚨' : '⚠️';
        console.log(`   ${icon} ${rec.message}`);
      });
      console.log(``);
    }
    
    console.log(`📄 Reports Generated:`);
    console.log(`   - Consolidated: template-generation-consolidated-report-${report.runId}.json`);
    console.log(`   - Summary: template-generation-test-summary-${report.runId}.md`);
    console.log('═'.repeat(80));
  }

  // Parse command line arguments
  parseArgs() {
    const args = process.argv.slice(2);
    const options = {
      parallel: false,
      continueOnFailure: true,
      skipNonCritical: false,
      suitesToRun: [],
      help: false
    };
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      switch (arg) {
        case '--parallel':
        case '-p':
          options.parallel = true;
          break;
          
        case '--stop-on-failure':
        case '-s':
          options.continueOnFailure = false;
          break;
          
        case '--critical-only':
        case '-c':
          options.skipNonCritical = true;
          break;
          
        case '--suites':
          i++;
          if (i < args.length) {
            options.suitesToRun = args[i].split(',').map(s => s.trim());
          }
          break;
          
        case '--help':
        case '-h':
          options.help = true;
          break;
      }
    }
    
    return options;
  }

  // Print help message
  printHelp() {
    console.log(`
Template Generation Test Runner

Usage: node template-generation-test-runner.js [options]

Options:
  --parallel, -p              Run test suites in parallel
  --stop-on-failure, -s       Stop execution on first critical failure
  --critical-only, -c         Run only critical test suites
  --suites <names>            Run specific test suites (comma-separated)
  --help, -h                  Show this help message

Examples:
  node template-generation-test-runner.js
  node template-generation-test-runner.js --parallel
  node template-generation-test-runner.js --critical-only
  node template-generation-test-runner.js --suites "unit,integration"

Available Test Suites:
${this.testSuites.map(suite => `  - ${suite.name}${suite.critical ? ' (critical)' : ''}`).join('\n')}
`);
  }
}

// CLI execution
if (require.main === module) {
  const runner = new TemplateGenerationTestRunner();
  const options = runner.parseArgs();
  
  if (options.help) {
    runner.printHelp();
    process.exit(0);
  }
  
  runner.runAllTests(options)
    .then(report => {
      // Exit with error code if critical tests failed
      const criticalFailures = report.results.filter(r => r.critical && r.status === 'failed');
      const exitCode = criticalFailures.length > 0 ? 1 : 0;
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('💥 Test runner crashed:', error);
      process.exit(1);
    });
}

module.exports = TemplateGenerationTestRunner;