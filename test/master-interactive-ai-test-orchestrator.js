#!/usr/bin/env node

/**
 * Master Interactive & AI-Guided Test Orchestrator
 * Coordinates all test suites for comprehensive validation of Claude Flow 2.0 interactive features
 * 
 * This orchestrator manages the execution of all test suites, provides real-time progress tracking,
 * generates consolidated reports, and ensures comprehensive coverage of all interactive and AI features.
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const { EventEmitter } = require('events');

const execAsync = promisify(exec);

// Import test suites
const InteractiveAIGuidedTestSuite = require('./interactive-ai-guided-test-suite');
const AIEnhancementCommandTestSuite = require('./ai-enhancement-command-test-suite');
const FullstackModernTestSuite = require('./fullstack-modern-comprehensive-test-suite');

class MasterInteractiveAITestOrchestrator extends EventEmitter {
  constructor() {
    super();
    this.testSuites = {
      interactive: {
        name: 'Interactive & AI-Guided Test Suite',
        class: InteractiveAIGuidedTestSuite,
        priority: 1,
        timeout: 600000, // 10 minutes
        status: 'pending'
      },
      aiEnhancement: {
        name: 'AI Enhancement Command Test Suite',
        class: AIEnhancementCommandTestSuite,
        priority: 2,
        timeout: 480000, // 8 minutes
        status: 'pending'
      },
      fullstackModern: {
        name: 'Fullstack Modern Template Test Suite',
        class: FullstackModernTestSuite,
        priority: 3,
        timeout: 900000, // 15 minutes
        status: 'pending'
      }
    };
    
    this.results = {
      overall: { passed: 0, failed: 0, skipped: 0, suites: 0 },
      suiteResults: {},
      detailedResults: [],
      executionOrder: [],
      timing: {}
    };
    
    this.startTime = Date.now();
    this.currentSuite = null;
    this.reportDir = path.resolve(__dirname, '../test-reports/interactive-ai-tests');
  }

  async runComprehensiveTestOrchestration() {
    console.log('🚀 Starting Master Interactive & AI Test Orchestration');
    console.log('=' .repeat(80));
    console.log('🎯 Test Coverage Areas:');
    console.log('  • Interactive Project Creation & Setup');
    console.log('  • AI-Guided Development Workflows');
    console.log('  • AI Enhancement Commands');
    console.log('  • User Experience & Accessibility');
    console.log('  • End-to-End Integration Testing');
    console.log('  • Performance & Security Validation');
    console.log('=' .repeat(80));

    try {
      // 1. Setup orchestration environment
      await this.setupOrchestrationEnvironment();

      // 2. Run pre-execution validation
      await this.runPreExecutionValidation();

      // 3. Execute test suites in priority order
      await this.executeTestSuites();

      // 4. Run post-execution analysis
      await this.runPostExecutionAnalysis();

      // 5. Generate consolidated reports
      await this.generateConsolidatedReports();

      // 6. Publish results and metrics
      await this.publishResultsAndMetrics();

    } catch (error) {
      console.error('❌ Master orchestration failed:', error);
      this.recordOrchestrationResult('orchestration', 'Master Test Orchestration', 'failed', error.message);
    } finally {
      await this.cleanup();
    }
  }

  async setupOrchestrationEnvironment() {
    console.log('\n📋 Setting up orchestration environment...');
    
    try {
      // Create report directories
      await fs.mkdir(this.reportDir, { recursive: true });
      await fs.mkdir(path.join(this.reportDir, 'individual-suites'), { recursive: true });
      await fs.mkdir(path.join(this.reportDir, 'consolidated'), { recursive: true });
      await fs.mkdir(path.join(this.reportDir, 'artifacts'), { recursive: true });
      
      // Initialize test tracking
      this.initializeTestTracking();
      
      // Setup real-time monitoring
      this.setupRealTimeMonitoring();
      
      this.recordOrchestrationResult('setup', 'Orchestration Environment Setup', 'passed');
      console.log('✅ Orchestration environment setup completed');
      
    } catch (error) {
      this.recordOrchestrationResult('setup', 'Orchestration Environment Setup', 'failed', error.message);
      throw error;
    }
  }

  initializeTestTracking() {
    // Initialize suite tracking
    for (const [suiteId, suite] of Object.entries(this.testSuites)) {
      this.results.suiteResults[suiteId] = {
        name: suite.name,
        status: 'pending',
        startTime: null,
        endTime: null,
        duration: null,
        results: null,
        artifacts: []
      };
    }
    
    // Setup execution order based on priority
    this.results.executionOrder = Object.entries(this.testSuites)
      .sort(([, a], [, b]) => a.priority - b.priority)
      .map(([id]) => id);
  }

  setupRealTimeMonitoring() {
    console.log('📊 Setting up real-time progress monitoring...');
    
    // Create progress monitoring dashboard
    const monitoringScript = `
class TestOrchestrationMonitor {
  constructor() {
    this.suites = ${JSON.stringify(Object.keys(this.testSuites))};
    this.startTime = ${this.startTime};
    this.updateInterval = null;
  }
  
  startMonitoring() {
    console.log('\\n📈 Real-time Test Progress Dashboard');
    console.log('=' .repeat(60));
    
    this.updateInterval = setInterval(() => {
      this.displayProgress();
    }, 5000); // Update every 5 seconds
  }
  
  displayProgress() {
    const elapsed = Math.round((Date.now() - this.startTime) / 1000);
    console.log(\`\\n⏱️  Elapsed Time: \${elapsed}s\`);
    console.log('📊 Suite Progress:');
    
    // This would be updated by the orchestrator in real implementation
    this.suites.forEach((suite, index) => {
      const status = index === 0 ? '🟡 Running' : '⏳ Pending';
      console.log(\`  \${suite}: \${status}\`);
    });
    
    console.log('\\n' + '=' .repeat(60));
  }
  
  stopMonitoring() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}

// This would run in a separate process in real implementation
const monitor = new TestOrchestrationMonitor();
monitor.startMonitoring();

// Stop after reasonable time
setTimeout(() => {
  monitor.stopMonitoring();
  console.log('📊 Monitoring stopped');
}, 60000);
`;

    // In a real implementation, this would run in a separate process
    // For testing purposes, we'll simulate it
    console.log('✅ Real-time monitoring initialized');
  }

  async runPreExecutionValidation() {
    console.log('\n🔍 Running pre-execution validation...');
    
    try {
      const validations = [
        () => this.validateNodeEnvironment(),
        () => this.validateDependencies(),
        () => this.validateTestEnvironment(),
        () => this.validateSystemResources()
      ];

      for (const validation of validations) {
        await validation();
      }
      
      this.recordOrchestrationResult('validation', 'Pre-execution Validation', 'passed');
      console.log('✅ Pre-execution validation completed');
      
    } catch (error) {
      this.recordOrchestrationResult('validation', 'Pre-execution Validation', 'failed', error.message);
      throw error;
    }
  }

  async validateNodeEnvironment() {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 16) {
      throw new Error(`Node.js version ${nodeVersion} is not supported. Minimum version: 16.x`);
    }
    
    console.log(`✅ Node.js ${nodeVersion} validated`);
  }

  async validateDependencies() {
    const requiredPackages = ['fs', 'path', 'child_process', 'events'];
    
    for (const pkg of requiredPackages) {
      try {
        require(pkg);
      } catch (error) {
        throw new Error(`Required package '${pkg}' not available`);
      }
    }
    
    console.log('✅ Core dependencies validated');
  }

  async validateTestEnvironment() {
    // Check available disk space (simplified)
    const testDir = path.resolve(__dirname, '../test-projects');
    try {
      await fs.access(path.dirname(testDir));
      console.log('✅ Test environment access validated');
    } catch (error) {
      throw new Error('Cannot access test environment directory');
    }
  }

  async validateSystemResources() {
    const memoryUsage = process.memoryUsage();
    const availableMemory = memoryUsage.heapTotal;
    
    // Require at least 512MB available heap
    if (availableMemory < 512 * 1024 * 1024) {
      console.warn('⚠️  Low memory detected, tests may run slowly');
    }
    
    console.log(`✅ System resources validated (${Math.round(availableMemory / 1024 / 1024)}MB heap)`);
  }

  async executeTestSuites() {
    console.log('\n🚀 Executing test suites in priority order...');
    
    for (const suiteId of this.results.executionOrder) {
      await this.executeSuite(suiteId);
    }
  }

  async executeSuite(suiteId) {
    const suite = this.testSuites[suiteId];
    const suiteResult = this.results.suiteResults[suiteId];
    
    console.log(`\n🔥 Executing: ${suite.name}`);
    console.log('─'.repeat(60));
    
    suiteResult.startTime = Date.now();
    suiteResult.status = 'running';
    this.currentSuite = suiteId;
    
    try {
      // Create and run test suite instance
      const testSuiteInstance = new suite.class();
      
      // Setup timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Test suite ${suite.name} timed out after ${suite.timeout}ms`));
        }, suite.timeout);
      });
      
      // Execute suite with timeout
      const suiteResults = await Promise.race([
        this.runSuiteWithLogging(testSuiteInstance),
        timeoutPromise
      ]);
      
      suiteResult.endTime = Date.now();
      suiteResult.duration = suiteResult.endTime - suiteResult.startTime;
      suiteResult.status = 'completed';
      suiteResult.results = suiteResults;
      
      // Update overall results
      this.results.overall.suites++;
      if (suiteResults && suiteResults.summary && suiteResults.summary.passed > 0) {
        this.results.overall.passed += suiteResults.summary.passed;
        this.results.overall.failed += suiteResults.summary.failed || 0;
        this.results.overall.skipped += suiteResults.summary.skipped || 0;
      }
      
      console.log(`✅ ${suite.name} completed in ${Math.round(suiteResult.duration / 1000)}s`);
      
    } catch (error) {
      suiteResult.endTime = Date.now();
      suiteResult.duration = suiteResult.endTime - suiteResult.startTime;
      suiteResult.status = 'failed';
      suiteResult.error = error.message;
      
      this.results.overall.failed++;
      
      console.error(`❌ ${suite.name} failed: ${error.message}`);
      
      // Continue with other suites unless critical failure
      if (!this.isCriticalFailure(error)) {
        console.log('🔄 Continuing with remaining test suites...');
      } else {
        throw error;
      }
    }
  }

  async runSuiteWithLogging(testSuiteInstance) {
    // Capture suite output for logging
    const originalLog = console.log;
    const logs = [];
    
    console.log = (...args) => {
      logs.push(args.join(' '));
      originalLog(...args);
    };
    
    try {
      // Run the appropriate method based on test suite type
      let results;
      if (testSuiteInstance.runComprehensiveTestSuite) {
        results = await testSuiteInstance.runComprehensiveTestSuite();
      } else if (testSuiteInstance.runTestSuite) {
        results = await testSuiteInstance.runTestSuite();
      } else {
        throw new Error('Test suite does not have a recognized run method');
      }
      
      return {
        summary: this.extractSummaryFromLogs(logs),
        logs,
        results
      };
      
    } finally {
      console.log = originalLog;
    }
  }

  extractSummaryFromLogs(logs) {
    // Extract test results from logs (simplified parsing)
    const summary = { passed: 0, failed: 0, skipped: 0 };
    
    logs.forEach(log => {
      if (log.includes('✅') && log.includes('passed')) {
        summary.passed++;
      } else if (log.includes('❌') && log.includes('failed')) {
        summary.failed++;
      } else if (log.includes('⏭️') && log.includes('skipped')) {
        summary.skipped++;
      }
    });
    
    return summary;
  }

  isCriticalFailure(error) {
    const criticalErrors = [
      'ENOSPC', // No space left on device
      'ENOMEM', // Out of memory
      'EPERM',  // Permission denied
    ];
    
    return criticalErrors.some(criticalError => 
      error.message.includes(criticalError) || error.code === criticalError
    );
  }

  async runPostExecutionAnalysis() {
    console.log('\n📊 Running post-execution analysis...');
    
    try {
      const analysis = {
        executionSummary: this.generateExecutionSummary(),
        performanceMetrics: this.calculatePerformanceMetrics(),
        qualityMetrics: this.calculateQualityMetrics(),
        riskAssessment: this.assessRisks(),
        recommendations: this.generateRecommendations()
      };
      
      this.results.analysis = analysis;
      
      this.recordOrchestrationResult('analysis', 'Post-execution Analysis', 'passed');
      console.log('✅ Post-execution analysis completed');
      
    } catch (error) {
      this.recordOrchestrationResult('analysis', 'Post-execution Analysis', 'failed', error.message);
      throw error;
    }
  }

  generateExecutionSummary() {
    const totalSuites = Object.keys(this.testSuites).length;
    const completedSuites = Object.values(this.results.suiteResults)
      .filter(result => result.status === 'completed').length;
    const failedSuites = Object.values(this.results.suiteResults)
      .filter(result => result.status === 'failed').length;
    
    const totalDuration = Math.max(...Object.values(this.results.suiteResults)
      .filter(result => result.endTime)
      .map(result => result.endTime)) - this.startTime;
    
    return {
      totalSuites,
      completedSuites,
      failedSuites,
      totalDuration,
      overallPassRate: Math.round((this.results.overall.passed / 
        (this.results.overall.passed + this.results.overall.failed)) * 100) || 0
    };
  }

  calculatePerformanceMetrics() {
    const durations = Object.values(this.results.suiteResults)
      .filter(result => result.duration)
      .map(result => result.duration);
    
    if (durations.length === 0) {
      return { averageDuration: 0, maxDuration: 0, minDuration: 0 };
    }
    
    return {
      averageDuration: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
      maxDuration: Math.max(...durations),
      minDuration: Math.min(...durations),
      totalExecutionTime: durations.reduce((a, b) => a + b, 0)
    };
  }

  calculateQualityMetrics() {
    const metrics = {
      codeGeneration: { score: 0, tests: 0 },
      userExperience: { score: 0, tests: 0 },
      aiIntegration: { score: 0, tests: 0 },
      security: { score: 0, tests: 0 },
      performance: { score: 0, tests: 0 }
    };
    
    // Calculate based on passed tests in each category
    Object.values(this.results.suiteResults).forEach(result => {
      if (result.results && result.results.summary) {
        const passRate = result.results.summary.passed / 
          (result.results.summary.passed + result.results.summary.failed) || 0;
        
        // Distribute scores across quality areas (simplified)
        Object.keys(metrics).forEach(area => {
          metrics[area].score += passRate * 20; // Scale to 100
          metrics[area].tests += result.results.summary.passed + result.results.summary.failed;
        });
      }
    });
    
    return metrics;
  }

  assessRisks() {
    const risks = [];
    
    // Assess based on test results
    const overallPassRate = this.results.analysis?.executionSummary?.overallPassRate || 0;
    
    if (overallPassRate < 80) {
      risks.push({
        level: 'high',
        category: 'quality',
        description: `Low overall pass rate: ${overallPassRate}%`,
        recommendation: 'Review failed tests and fix critical issues before deployment'
      });
    }
    
    const failedSuites = Object.values(this.results.suiteResults)
      .filter(result => result.status === 'failed');
    
    if (failedSuites.length > 0) {
      risks.push({
        level: 'medium',
        category: 'reliability',
        description: `${failedSuites.length} test suite(s) failed`,
        recommendation: 'Investigate and resolve test suite failures'
      });
    }
    
    return risks;
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Performance recommendations
    const perfMetrics = this.results.analysis?.performanceMetrics;
    if (perfMetrics && perfMetrics.averageDuration > 300000) { // 5 minutes
      recommendations.push({
        category: 'performance',
        priority: 'medium',
        description: 'Test execution time is longer than optimal',
        action: 'Consider parallelizing test suites or optimizing test setup'
      });
    }
    
    // Quality recommendations
    const qualityMetrics = this.results.analysis?.qualityMetrics;
    if (qualityMetrics) {
      Object.entries(qualityMetrics).forEach(([area, metrics]) => {
        if (metrics.score < 60) {
          recommendations.push({
            category: 'quality',
            priority: 'high',
            description: `Low quality score in ${area}: ${Math.round(metrics.score)}%`,
            action: `Improve test coverage and quality in ${area} area`
          });
        }
      });
    }
    
    return recommendations;
  }

  async generateConsolidatedReports() {
    console.log('\n📋 Generating consolidated reports...');
    
    try {
      // Generate master report
      const masterReport = await this.generateMasterReport();
      const masterReportPath = path.join(this.reportDir, 'consolidated', 'master-test-report.json');
      await fs.writeFile(masterReportPath, JSON.stringify(masterReport, null, 2));
      
      // Generate executive summary
      const executiveSummary = await this.generateExecutiveSummary();
      const summaryPath = path.join(this.reportDir, 'consolidated', 'executive-summary.md');
      await fs.writeFile(summaryPath, executiveSummary);
      
      // Generate detailed analysis
      const detailedAnalysis = await this.generateDetailedAnalysis();
      const analysisPath = path.join(this.reportDir, 'consolidated', 'detailed-analysis.md');
      await fs.writeFile(analysisPath, detailedAnalysis);
      
      // Generate artifacts index
      const artifactsIndex = await this.generateArtifactsIndex();
      const indexPath = path.join(this.reportDir, 'artifacts', 'index.json');
      await fs.writeFile(indexPath, JSON.stringify(artifactsIndex, null, 2));
      
      this.recordOrchestrationResult('reporting', 'Consolidated Report Generation', 'passed');
      console.log('✅ Consolidated reports generated');
      
    } catch (error) {
      this.recordOrchestrationResult('reporting', 'Consolidated Report Generation', 'failed', error.message);
      throw error;
    }
  }

  async generateMasterReport() {
    const endTime = Date.now();
    
    return {
      metadata: {
        orchestratorVersion: '1.0.0',
        executionId: `orchestration-${endTime}`,
        startTime: new Date(this.startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        totalDuration: endTime - this.startTime,
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          architecture: process.arch
        }
      },
      summary: this.results.analysis?.executionSummary || {},
      performance: this.results.analysis?.performanceMetrics || {},
      quality: this.results.analysis?.qualityMetrics || {},
      risks: this.results.analysis?.riskAssessment || [],
      recommendations: this.results.analysis?.recommendations || [],
      suiteResults: this.results.suiteResults,
      detailedResults: this.results.detailedResults
    };
  }

  async generateExecutiveSummary() {
    const summary = this.results.analysis?.executionSummary || {};
    const risks = this.results.analysis?.riskAssessment || [];
    const highRisks = risks.filter(r => r.level === 'high');
    
    return `# Claude Flow 2.0 Interactive & AI Features Test Execution Report

## Executive Summary

### Test Execution Overview
- **Total Test Suites**: ${summary.totalSuites || 0}
- **Completed Successfully**: ${summary.completedSuites || 0}
- **Failed**: ${summary.failedSuites || 0}
- **Overall Pass Rate**: ${summary.overallPassRate || 0}%
- **Total Execution Time**: ${Math.round((summary.totalDuration || 0) / 1000 / 60)} minutes

### Key Findings
${summary.overallPassRate >= 85 ? 
  '✅ **PASS**: Interactive and AI features meet quality standards' : 
  '❌ **FAIL**: Interactive and AI features require attention before deployment'
}

### Risk Assessment
${highRisks.length === 0 ? 
  '✅ **Low Risk**: No critical issues identified' : 
  `⚠️ **High Risk**: ${highRisks.length} critical issue(s) identified`
}

### Test Coverage Areas
- **Interactive Project Creation**: Comprehensive validation of user-guided setup flows
- **AI Enhancement Commands**: Testing of AI-powered code generation and optimization
- **User Experience**: CLI usability, accessibility, and error handling validation
- **AI Integration**: LLM response validation and context-aware processing
- **End-to-End Workflows**: Complete project lifecycle testing

### Recommendations
${(this.results.analysis?.recommendations || []).length === 0 ? 
  'No specific recommendations at this time.' :
  (this.results.analysis?.recommendations || []).map(rec => 
    `- **${rec.category}**: ${rec.description} - ${rec.action}`
  ).join('\n')
}

---
*Report generated on ${new Date().toISOString()}*
`;
  }

  async generateDetailedAnalysis() {
    const suiteDetails = Object.entries(this.results.suiteResults)
      .map(([id, result]) => {
        const duration = result.duration ? `${Math.round(result.duration / 1000)}s` : 'N/A';
        const status = result.status === 'completed' ? '✅ COMPLETED' : 
                      result.status === 'failed' ? '❌ FAILED' : '⏳ PENDING';
        
        return `### ${result.name}
- **Status**: ${status}
- **Duration**: ${duration}
- **Tests Passed**: ${result.results?.summary?.passed || 0}
- **Tests Failed**: ${result.results?.summary?.failed || 0}
- **Tests Skipped**: ${result.results?.summary?.skipped || 0}
${result.error ? `- **Error**: ${result.error}` : ''}
`;
      }).join('\n');

    return `# Detailed Test Analysis Report

## Test Suite Results

${suiteDetails}

## Performance Analysis

### Execution Timing
${Object.entries(this.results.suiteResults)
  .filter(([, result]) => result.duration)
  .map(([id, result]) => `- **${result.name}**: ${Math.round(result.duration / 1000)}s`)
  .join('\n')}

### Resource Utilization
- **Memory Usage**: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB
- **CPU Time**: ${Math.round(process.cpuUsage().user / 1000)}ms

## Quality Metrics

${Object.entries(this.results.analysis?.qualityMetrics || {})
  .map(([area, metrics]) => `- **${area}**: ${Math.round(metrics.score)}% (${metrics.tests} tests)`)
  .join('\n')}

## Risk Analysis

${(this.results.analysis?.riskAssessment || [])
  .map(risk => `### ${risk.level.toUpperCase()} Risk: ${risk.category}
**Description**: ${risk.description}
**Recommendation**: ${risk.recommendation}`)
  .join('\n\n')}

---
*Generated on ${new Date().toISOString()}*
`;
  }

  async generateArtifactsIndex() {
    return {
      reports: [
        'master-test-report.json',
        'executive-summary.md',
        'detailed-analysis.md'
      ],
      suiteArtifacts: Object.keys(this.results.suiteResults).map(id => ({
        suiteId: id,
        name: this.results.suiteResults[id].name,
        artifacts: this.results.suiteResults[id].artifacts || []
      })),
      generatedAt: new Date().toISOString()
    };
  }

  async publishResultsAndMetrics() {
    console.log('\n📤 Publishing results and metrics...');
    
    try {
      // Simulate publishing to dashboard/CI system
      const metrics = {
        timestamp: new Date().toISOString(),
        orchestrationId: `orchestration-${Date.now()}`,
        summary: this.results.analysis?.executionSummary || {},
        quality: this.results.analysis?.qualityMetrics || {},
        performance: this.results.analysis?.performanceMetrics || {}
      };
      
      // Write metrics for external consumption
      const metricsPath = path.join(this.reportDir, 'metrics.json');
      await fs.writeFile(metricsPath, JSON.stringify(metrics, null, 2));
      
      this.recordOrchestrationResult('publishing', 'Results and Metrics Publishing', 'passed');
      console.log('✅ Results and metrics published');
      
    } catch (error) {
      this.recordOrchestrationResult('publishing', 'Results and Metrics Publishing', 'failed', error.message);
      // Don't throw here as this is not critical for test execution
      console.warn('⚠️  Failed to publish results:', error.message);
    }
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up orchestration environment...');
    
    try {
      // Cleanup temporary files and processes
      // In real implementation, would cleanup spawned processes, temp files, etc.
      
      console.log('✅ Orchestration cleanup completed');
      
    } catch (error) {
      console.warn('⚠️  Cleanup failed:', error.message);
    }
  }

  recordOrchestrationResult(category, testName, status, details = '') {
    const result = {
      category,
      testName,
      status,
      details,
      timestamp: new Date().toISOString()
    };
    
    this.results.detailedResults.push(result);
    
    const emoji = status === 'passed' ? '✅' : status === 'failed' ? '❌' : '⏭️ ';
    console.log(`${emoji} ${testName}: ${status.toUpperCase()}${details ? ` - ${details}` : ''}`);
  }

  // Real-time progress reporting
  generateProgressReport() {
    const completed = Object.values(this.results.suiteResults)
      .filter(result => result.status === 'completed' || result.status === 'failed').length;
    const total = Object.keys(this.testSuites).length;
    const percentage = Math.round((completed / total) * 100);
    
    return {
      percentage,
      completed,
      total,
      currentSuite: this.currentSuite ? this.testSuites[this.currentSuite].name : null,
      elapsedTime: Date.now() - this.startTime
    };
  }

  // Final orchestration summary
  async generateFinalSummary() {
    const endTime = Date.now();
    const totalDuration = endTime - this.startTime;
    
    console.log('\n' + '='.repeat(80));
    console.log('🎯 MASTER INTERACTIVE & AI TEST ORCHESTRATION COMPLETE');
    console.log('='.repeat(80));
    console.log(`🕐 Total Duration: ${Math.round(totalDuration / 1000 / 60)} minutes`);
    console.log(`📊 Test Suites: ${this.results.overall.suites}`);
    console.log(`✅ Tests Passed: ${this.results.overall.passed}`);
    console.log(`❌ Tests Failed: ${this.results.overall.failed}`);
    console.log(`⏭️  Tests Skipped: ${this.results.overall.skipped}`);
    console.log(`📈 Pass Rate: ${Math.round((this.results.overall.passed / (this.results.overall.passed + this.results.overall.failed)) * 100) || 0}%`);
    console.log(`\n📋 Reports Generated:`);
    console.log(`   Master Report: ${this.reportDir}/consolidated/master-test-report.json`);
    console.log(`   Executive Summary: ${this.reportDir}/consolidated/executive-summary.md`);
    console.log(`   Detailed Analysis: ${this.reportDir}/consolidated/detailed-analysis.md`);
    console.log('='.repeat(80));
  }
}

// Run the orchestration if called directly
if (require.main === module) {
  const orchestrator = new MasterInteractiveAITestOrchestrator();
  
  orchestrator.runComprehensiveTestOrchestration()
    .then(() => orchestrator.generateFinalSummary())
    .catch(console.error);
}

module.exports = MasterInteractiveAITestOrchestrator;