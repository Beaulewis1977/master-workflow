#!/usr/bin/env node

/**
 * Master Comprehensive Test Runner
 * 
 * Orchestrates all comprehensive integration tests for Claude Flow 2.0,
 * Agent-OS, and Claude Code sub-agents system. Provides consolidated
 * reporting and test suite management.
 */

const fs = require('fs').promises;
const path = require('path');
const { performance } = require('perf_hooks');

// Import all test suites
const ComprehensiveIntegrationTest = require('./comprehensive-integration-test.cjs');
const AgentOSClaudeFlowPipelineTest = require('./agent-os-claude-flow-pipeline-test.cjs');
const MultiAgentCollaborationTest = require('./multi-agent-collaboration-test.cjs');
const ContextManagementOverflowTest = require('./context-management-overflow-test.cjs');

class MasterComprehensiveTestRunner {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.testSuites = [];
    this.masterResults = {
      startTime: Date.now(),
      endTime: null,
      totalDuration: 0,
      overallResults: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        successRate: 0
      },
      suiteResults: [],
      performanceMetrics: {
        claudeFlow2Performance: {},
        agentOSPerformance: {},
        multiAgentPerformance: {},
        contextManagementPerformance: {}
      },
      systemValidation: {
        claudeFlow2Integration: false,
        agentOSIntegration: false,
        subAgentOrchestration: false,
        endToEndWorkflows: false,
        performanceTargetsMet: false,
        scalabilityValidated: false,
        errorRecoveryTested: false
      }
    };
  }

  /**
   * Initialize all test suites
   */
  async initializeTestSuites() {
    console.log('🚀 Initializing Comprehensive Test Suite System\n');
    
    this.testSuites = [
      {
        name: 'Claude Flow 2.0 & Core Integration',
        instance: new ComprehensiveIntegrationTest(),
        priority: 1,
        description: 'Tests WASM acceleration, topology types, neural selection, and performance metrics'
      },
      {
        name: 'Agent-OS to Claude Flow Pipeline',
        instance: new AgentOSClaudeFlowPipelineTest(),
        priority: 2,
        description: 'Tests spec-driven development and three-layer context architecture'
      },
      {
        name: 'Multi-Agent Collaboration',
        instance: new MultiAgentCollaborationTest(),
        priority: 3,
        description: 'Tests cross-agent communication and collaborative workflows'
      },
      {
        name: 'Context Management & Overflow Protection',
        instance: new ContextManagementOverflowTest(),
        priority: 4,
        description: 'Tests context overflow handling and intelligent management'
      }
    ];
    
    console.log(`✅ Initialized ${this.testSuites.length} test suites\n`);
  }

  /**
   * Run all test suites in sequence
   */
  async runAllTestSuites() {
    console.log('🎯 Starting Master Comprehensive Test Execution\n');
    console.log('=' .repeat(80));
    
    for (const suite of this.testSuites) {
      console.log(`\n🔧 Running ${suite.name}`);
      console.log(`📝 ${suite.description}`);
      console.log('-'.repeat(60));
      
      const suiteStartTime = performance.now();
      
      try {
        let suiteResult;
        
        // Run the appropriate test method based on suite type
        if (suite.instance instanceof ComprehensiveIntegrationTest) {
          suiteResult = await suite.instance.runAllTests();
        } else if (suite.instance.runAllTests) {
          suiteResult = await suite.instance.runAllTests();
        } else {
          throw new Error(`Test suite ${suite.name} does not have runAllTests method`);
        }
        
        const suiteDuration = performance.now() - suiteStartTime;
        
        const suiteResultSummary = {
          name: suite.name,
          passed: suiteResult.passed || 0,
          total: suiteResult.total || 0,
          failed: (suiteResult.total || 0) - (suiteResult.passed || 0),
          duration: suiteDuration,
          successRate: suiteResult.total > 0 ? ((suiteResult.passed / suiteResult.total) * 100).toFixed(1) : '0.0',
          details: suiteResult.results || suiteResult.tests || []
        };
        
        this.masterResults.suiteResults.push(suiteResultSummary);
        this.updateOverallResults(suiteResultSummary);
        
        console.log(`\n📊 ${suite.name} Complete:`);
        console.log(`   ✅ Passed: ${suiteResultSummary.passed}`);
        console.log(`   ❌ Failed: ${suiteResultSummary.failed}`);
        console.log(`   📈 Success Rate: ${suiteResultSummary.successRate}%`);
        console.log(`   ⏱️  Duration: ${(suiteDuration / 1000).toFixed(2)}s`);
        
      } catch (error) {
        console.error(`❌ Test suite ${suite.name} failed: ${error.message}`);
        
        const failedSuiteResult = {
          name: suite.name,
          passed: 0,
          total: 1,
          failed: 1,
          duration: performance.now() - suiteStartTime,
          successRate: '0.0',
          error: error.message,
          details: []
        };
        
        this.masterResults.suiteResults.push(failedSuiteResult);
        this.updateOverallResults(failedSuiteResult);
      }
    }
    
    console.log('\n' + '='.repeat(80));
  }

  /**
   * Update overall test results
   */
  updateOverallResults(suiteResult) {
    this.masterResults.overallResults.totalTests += suiteResult.total;
    this.masterResults.overallResults.passed += suiteResult.passed;
    this.masterResults.overallResults.failed += suiteResult.failed;
    
    const total = this.masterResults.overallResults.totalTests;
    const passed = this.masterResults.overallResults.passed;
    
    this.masterResults.overallResults.successRate = total > 0 ? 
      ((passed / total) * 100).toFixed(1) : '0.0';
  }

  /**
   * Validate system integration status
   */
  async validateSystemIntegration() {
    console.log('\n🔍 Validating System Integration Status...\n');
    
    const validation = this.masterResults.systemValidation;
    
    // Check Claude Flow 2.0 Integration
    const claudeFlowSuite = this.masterResults.suiteResults.find(s => 
      s.name.includes('Claude Flow 2.0')
    );
    
    if (claudeFlowSuite) {
      validation.claudeFlow2Integration = (claudeFlowSuite.passed / claudeFlowSuite.total) >= 0.8;
      console.log(`✅ Claude Flow 2.0 Integration: ${validation.claudeFlow2Integration ? 'PASSED' : 'FAILED'}`);
    }
    
    // Check Agent-OS Integration
    const agentOSSuite = this.masterResults.suiteResults.find(s => 
      s.name.includes('Agent-OS')
    );
    
    if (agentOSSuite) {
      validation.agentOSIntegration = (agentOSSuite.passed / agentOSSuite.total) >= 0.8;
      console.log(`✅ Agent-OS Integration: ${validation.agentOSIntegration ? 'PASSED' : 'FAILED'}`);
    }
    
    // Check Sub-Agent Orchestration
    const collaborationSuite = this.masterResults.suiteResults.find(s => 
      s.name.includes('Multi-Agent')
    );
    
    if (collaborationSuite) {
      validation.subAgentOrchestration = (collaborationSuite.passed / collaborationSuite.total) >= 0.8;
      console.log(`✅ Sub-Agent Orchestration: ${validation.subAgentOrchestration ? 'PASSED' : 'FAILED'}`);
    }
    
    // Check Context Management
    const contextSuite = this.masterResults.suiteResults.find(s => 
      s.name.includes('Context Management')
    );
    
    if (contextSuite) {
      validation.errorRecoveryTested = (contextSuite.passed / contextSuite.total) >= 0.8;
      console.log(`✅ Context & Error Recovery: ${validation.errorRecoveryTested ? 'PASSED' : 'FAILED'}`);
    }
    
    // Overall system validation
    const validationResults = Object.values(validation);
    const validationsPassed = validationResults.filter(Boolean).length;
    const validationsTotal = validationResults.length;
    
    validation.endToEndWorkflows = validationsPassed >= validationsTotal * 0.8;
    validation.performanceTargetsMet = this.masterResults.overallResults.successRate >= 85;
    validation.scalabilityValidated = this.masterResults.overallResults.totalTests >= 15;
    
    console.log(`\n📊 Overall System Validation:`);
    console.log(`   🎯 End-to-End Workflows: ${validation.endToEndWorkflows ? 'PASSED' : 'FAILED'}`);
    console.log(`   ⚡ Performance Targets: ${validation.performanceTargetsMet ? 'PASSED' : 'FAILED'}`);
    console.log(`   📈 Scalability: ${validation.scalabilityValidated ? 'PASSED' : 'FAILED'}`);
    
    return validation;
  }

  /**
   * Generate performance analysis
   */
  async generatePerformanceAnalysis() {
    console.log('\n⚡ Generating Performance Analysis...\n');
    
    const performanceData = {
      overallMetrics: {
        totalTestDuration: this.masterResults.totalDuration,
        averageTestDuration: this.masterResults.totalDuration / this.masterResults.overallResults.totalTests,
        testsPerSecond: (this.masterResults.overallResults.totalTests / (this.masterResults.totalDuration / 1000)).toFixed(2)
      },
      suitePerformance: this.masterResults.suiteResults.map(suite => ({
        name: suite.name,
        duration: suite.duration,
        testCount: suite.total,
        averageDuration: suite.total > 0 ? suite.duration / suite.total : 0,
        efficiency: suite.successRate
      })),
      recommendations: []
    };
    
    // Generate performance recommendations
    const slowSuites = performanceData.suitePerformance
      .filter(suite => suite.averageDuration > 5000) // >5 seconds per test
      .map(suite => suite.name);
    
    if (slowSuites.length > 0) {
      performanceData.recommendations.push(
        `Optimize slow test suites: ${slowSuites.join(', ')}`
      );
    }
    
    const failingSuites = this.masterResults.suiteResults
      .filter(suite => parseFloat(suite.successRate) < 80)
      .map(suite => suite.name);
    
    if (failingSuites.length > 0) {
      performanceData.recommendations.push(
        `Address failing test suites: ${failingSuites.join(', ')}`
      );
    }
    
    console.log(`📊 Performance Metrics:`);
    console.log(`   ⏱️  Total Duration: ${(performanceData.overallMetrics.totalTestDuration / 1000).toFixed(2)}s`);
    console.log(`   📈 Tests/Second: ${performanceData.overallMetrics.testsPerSecond}`);
    console.log(`   🎯 Average Test Duration: ${(performanceData.overallMetrics.averageTestDuration / 1000).toFixed(2)}s`);
    
    if (performanceData.recommendations.length > 0) {
      console.log(`\n💡 Recommendations:`);
      performanceData.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }
    
    return performanceData;
  }

  /**
   * Generate comprehensive final report
   */
  async generateFinalReport() {
    this.masterResults.endTime = Date.now();
    this.masterResults.totalDuration = this.masterResults.endTime - this.masterResults.startTime;
    
    console.log('\n📄 Generating Comprehensive Test Report...\n');
    
    const systemValidation = await this.validateSystemIntegration();
    const performanceAnalysis = await this.generatePerformanceAnalysis();
    
    const finalReport = {
      summary: {
        executionTime: new Date().toISOString(),
        totalDuration: this.masterResults.totalDuration,
        overallResults: this.masterResults.overallResults,
        systemValidation: systemValidation
      },
      suiteResults: this.masterResults.suiteResults,
      performanceAnalysis: performanceAnalysis,
      recommendations: [
        ...performanceAnalysis.recommendations,
        ...(this.masterResults.overallResults.successRate < 90 ? 
          ['Investigate and fix failing tests to achieve >90% success rate'] : []),
        ...(this.masterResults.totalDuration > 300000 ? // >5 minutes
          ['Consider test parallelization to reduce total execution time'] : [])
      ],
      testEnvironment: {
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch,
        workingDirectory: this.projectRoot
      }
    };
    
    // Save report to file
    const reportPath = path.join(this.projectRoot, 'test', 'MASTER-COMPREHENSIVE-TEST-REPORT.json');
    await fs.writeFile(reportPath, JSON.stringify(finalReport, null, 2));
    
    // Generate markdown summary
    const markdownSummary = this.generateMarkdownSummary(finalReport);
    const summaryPath = path.join(this.projectRoot, 'test', 'COMPREHENSIVE-TEST-SUMMARY.md');
    await fs.writeFile(summaryPath, markdownSummary);
    
    console.log(`📄 Detailed report saved: ${reportPath}`);
    console.log(`📋 Summary report saved: ${summaryPath}`);
    
    return finalReport;
  }

  /**
   * Generate markdown summary report
   */
  generateMarkdownSummary(report) {
    const successEmoji = report.summary.overallResults.successRate >= 90 ? '✅' : 
                        report.summary.overallResults.successRate >= 75 ? '⚠️' : '❌';
    
    return `# Comprehensive Integration Test Report

${successEmoji} **Overall Success Rate: ${report.summary.overallResults.successRate}%**

## Executive Summary

- **Total Tests Executed**: ${report.summary.overallResults.totalTests}
- **Tests Passed**: ${report.summary.overallResults.passed}
- **Tests Failed**: ${report.summary.overallResults.failed}
- **Execution Duration**: ${(report.summary.totalDuration / 1000).toFixed(2)} seconds
- **Execution Date**: ${report.summary.executionTime}

## System Integration Status

${Object.entries(report.summary.systemValidation).map(([key, value]) => {
  const emoji = value ? '✅' : '❌';
  const displayName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  return `- ${emoji} **${displayName}**: ${value ? 'PASSED' : 'FAILED'}`;
}).join('\n')}

## Test Suite Results

${report.suiteResults.map(suite => `
### ${suite.name}
- **Tests**: ${suite.total} (${suite.passed} passed, ${suite.failed} failed)
- **Success Rate**: ${suite.successRate}%
- **Duration**: ${(suite.duration / 1000).toFixed(2)}s
${suite.error ? `- **Error**: ${suite.error}` : ''}
`).join('')}

## Performance Analysis

- **Average Test Duration**: ${(report.performanceAnalysis.overallMetrics.averageTestDuration / 1000).toFixed(2)}s
- **Tests Per Second**: ${report.performanceAnalysis.overallMetrics.testsPerSecond}
- **Total Execution Time**: ${(report.performanceAnalysis.overallMetrics.totalTestDuration / 1000).toFixed(2)}s

## Recommendations

${report.recommendations.length > 0 ? 
  report.recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n') : 
  'No specific recommendations - all tests performing well!'}

## Test Environment

- **Node.js Version**: ${report.testEnvironment.nodeVersion}
- **Platform**: ${report.testEnvironment.platform}
- **Architecture**: ${report.testEnvironment.architecture}
- **Working Directory**: ${report.testEnvironment.workingDirectory}

---
*Report generated by Master Comprehensive Test Runner*
`;
  }

  /**
   * Display final results summary
   */
  displayFinalSummary(report) {
    console.log('\n' + '='.repeat(80));
    console.log('🎯 COMPREHENSIVE TEST SUITE COMPLETE');
    console.log('='.repeat(80));
    
    const successEmoji = report.summary.overallResults.successRate >= 90 ? '🎉' : 
                        report.summary.overallResults.successRate >= 75 ? '⚠️' : '💥';
    
    console.log(`\n${successEmoji} OVERALL RESULTS:`);
    console.log(`   📊 Total Tests: ${report.summary.overallResults.totalTests}`);
    console.log(`   ✅ Passed: ${report.summary.overallResults.passed}`);
    console.log(`   ❌ Failed: ${report.summary.overallResults.failed}`);
    console.log(`   📈 Success Rate: ${report.summary.overallResults.successRate}%`);
    console.log(`   ⏱️  Total Duration: ${(report.summary.totalDuration / 1000).toFixed(2)}s`);
    
    console.log(`\n🏗️ SYSTEM INTEGRATION STATUS:`);
    Object.entries(report.summary.systemValidation).forEach(([key, value]) => {
      const emoji = value ? '✅' : '❌';
      const displayName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      console.log(`   ${emoji} ${displayName}`);
    });
    
    if (report.recommendations.length > 0) {
      console.log(`\n💡 KEY RECOMMENDATIONS:`);
      report.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }
    
    console.log(`\n📄 Reports saved to:`);
    console.log(`   - ${path.join(this.projectRoot, 'test', 'MASTER-COMPREHENSIVE-TEST-REPORT.json')}`);
    console.log(`   - ${path.join(this.projectRoot, 'test', 'COMPREHENSIVE-TEST-SUMMARY.md')}`);
    
    console.log('\n' + '='.repeat(80));
    
    return report.summary.overallResults.successRate >= 80;
  }

  /**
   * Main execution method
   */
  async run() {
    try {
      console.log('🔬 Master Comprehensive Test Runner for Claude Flow 2.0 System');
      console.log('Testing: Claude Flow 2.0 + Agent-OS + Claude Code Sub-Agents\n');
      
      await this.initializeTestSuites();
      await this.runAllTestSuites();
      
      const report = await this.generateFinalReport();
      const success = this.displayFinalSummary(report);
      
      return success;
      
    } catch (error) {
      console.error('❌ Master test runner failed:', error);
      console.error(error.stack);
      return false;
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const masterRunner = new MasterComprehensiveTestRunner();
  
  masterRunner.run()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Fatal error in test execution:', error);
      process.exit(1);
    });
}

module.exports = MasterComprehensiveTestRunner;