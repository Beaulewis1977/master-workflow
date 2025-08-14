#!/usr/bin/env node

/**
 * Enhanced MCP Testing and Validation System Orchestrator
 * 
 * Master orchestrator for comprehensive testing of enhanced MCP server integrations
 * Coordinates all testing frameworks and generates consolidated reports
 */

const fs = require('fs').promises;
const path = require('path');
const { performance } = require('perf_hooks');

// Import all test frameworks
const MCPIntegrationTestSuite = require('./mcp-integration-test-suite');
const UnlimitedScalingLoadTest = require('./unlimited-scaling-load-test');
const PerformanceRegressionTest = require('./performance-regression-test');
const E2EIntegrationTest = require('./e2e-integration-test');
const CICDPipelineTest = require('./ci-cd-pipeline-test');
const MockServerInfrastructure = require('./mock-server-infrastructure');

class EnhancedMCPTestOrchestrator {
  constructor() {
    this.testResults = {
      startTime: Date.now(),
      endTime: null,
      testSuites: [],
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        successRate: 0,
        overallStatus: 'unknown'
      },
      productionReadiness: {
        mcpServerIntegration: false,
        unlimitedScaling: false,
        performanceTargets: false,
        endToEndWorkflows: false,
        cicdPipeline: false,
        mockInfrastructure: false,
        overallReady: false
      },
      keyMetrics: {
        maxStableAgents: 0,
        serverConnectivityRate: 0,
        performanceImprovement: 0,
        testCoverage: 0,
        automationRate: 0
      }
    };

    // Test suite configurations
    this.testSuiteConfigs = [
      {
        name: 'MCP Server Integration',
        class: MCPIntegrationTestSuite,
        priority: 1,
        critical: true,
        description: 'Tests connectivity, authentication, and failover for 125+ MCP servers',
        estimatedDuration: 300000, // 5 minutes
        metrics: ['serverConnectivity', 'agentBinding', 'failover']
      },
      {
        name: 'Unlimited Scaling Load Testing',
        class: UnlimitedScalingLoadTest,
        priority: 2,
        critical: true,
        description: 'Tests Queen Controller scaling from 10 to 4,462 agents',
        estimatedDuration: 600000, // 10 minutes
        metrics: ['scalability', 'resourceManagement', 'stability']
      },
      {
        name: 'Performance Regression Testing',
        class: PerformanceRegressionTest,
        priority: 3,
        critical: true,
        description: 'Validates 40-60% performance improvement targets',
        estimatedDuration: 480000, // 8 minutes
        metrics: ['performance', 'regression', 'optimization']
      },
      {
        name: 'End-to-End Integration',
        class: E2EIntegrationTest,
        priority: 4,
        critical: true,
        description: 'Tests complete workflows with multiple agents and servers',
        estimatedDuration: 420000, // 7 minutes
        metrics: ['workflows', 'integration', 'userExperience']
      },
      {
        name: 'CI/CD Pipeline Integration',
        class: CICDPipelineTest,
        priority: 5,
        critical: false,
        description: 'Tests automated pipeline execution and deployment',
        estimatedDuration: 360000, // 6 minutes
        metrics: ['automation', 'deployment', 'qualityGates']
      },
      {
        name: 'Mock Server Infrastructure',
        class: MockServerInfrastructure,
        priority: 6,
        critical: false,
        description: 'Tests offline capabilities and mock server functionality',
        estimatedDuration: 240000, // 4 minutes
        metrics: ['mocking', 'offlineTesting', 'dataGeneration']
      }
    ];

    // Production readiness criteria
    this.readinessCriteria = {
      mcpServerIntegration: { minSuccessRate: 90, weight: 0.25 },
      unlimitedScaling: { minAgents: 2000, minSuccessRate: 85, weight: 0.25 },
      performanceTargets: { minImprovement: 40, minSuccessRate: 80, weight: 0.20 },
      endToEndWorkflows: { minSuccessRate: 85, weight: 0.15 },
      cicdPipeline: { minSuccessRate: 80, weight: 0.10 },
      mockInfrastructure: { minSuccessRate: 85, weight: 0.05 }
    };
  }

  /**
   * Run all test suites in sequence
   */
  async runAllTestSuites() {
    console.log('🚀 Starting Enhanced MCP Testing and Validation System\n');
    console.log('=' .repeat(80));
    console.log('TESTING ENHANCED MCP ECOSYSTEM v3.0');
    console.log('• 125+ MCP Servers across 17 categories');
    console.log('• Unlimited Scaling Queen Controller (up to 4,462 agents)');
    console.log('• 42+ Specialized Agents');
    console.log('• Performance Optimization System (40-60% improvement targets)');
    console.log('=' .repeat(80) + '\n');

    const sortedSuites = this.testSuiteConfigs.sort((a, b) => a.priority - b.priority);
    
    for (const suiteConfig of sortedSuites) {
      console.log(`\n🔧 Running ${suiteConfig.name}`);
      console.log(`📝 ${suiteConfig.description}`);
      console.log(`⏱️  Estimated duration: ${(suiteConfig.estimatedDuration / 1000 / 60).toFixed(1)} minutes`);
      console.log('-'.repeat(60));
      
      const suiteStartTime = performance.now();
      
      try {
        // Create test suite instance
        const testSuite = new suiteConfig.class();
        
        // Run the test suite
        const suiteResult = await testSuite.runAllTests();
        
        const suiteDuration = performance.now() - suiteStartTime;
        
        // Process results
        const processedResult = this.processTestSuiteResult(
          suiteConfig, 
          suiteResult, 
          suiteDuration
        );
        
        this.testResults.testSuites.push(processedResult);
        
        // Display immediate results
        this.displaySuiteResult(processedResult);
        
        // Check if critical test failed and should stop
        if (suiteConfig.critical && processedResult.status === 'failed') {
          const continueOnFailure = await this.handleCriticalFailure(suiteConfig, processedResult);
          if (!continueOnFailure) {
            console.log('\n🛑 Stopping test execution due to critical failure\n');
            break;
          }
        }
        
      } catch (error) {
        console.error(`❌ Test suite ${suiteConfig.name} failed with error: ${error.message}`);
        
        const failedResult = {
          name: suiteConfig.name,
          status: 'failed',
          critical: suiteConfig.critical,
          duration: performance.now() - suiteStartTime,
          error: error.message,
          successRate: '0.0'
        };
        
        this.testResults.testSuites.push(failedResult);
        
        if (suiteConfig.critical) {
          console.log('\n🛑 Critical test suite failed, continuing with caution\n');
        }
      }
    }
    
    console.log('\n' + '='.repeat(80));
  }

  /**
   * Process test suite result
   */
  processTestSuiteResult(suiteConfig, suiteResult, duration) {
    // Extract relevant metrics based on suite type
    let successRate = '0.0';
    let keyMetrics = {};
    
    if (typeof suiteResult === 'boolean') {
      successRate = suiteResult ? '100.0' : '0.0';
    } else if (suiteResult && typeof suiteResult.summary === 'object') {
      successRate = suiteResult.summary.successRate || '0.0';
      keyMetrics = this.extractKeyMetrics(suiteConfig.name, suiteResult);
    }
    
    return {
      name: suiteConfig.name,
      status: parseFloat(successRate) >= 80 ? 'passed' : 'failed',
      critical: suiteConfig.critical,
      successRate: successRate,
      duration: duration,
      estimatedDuration: suiteConfig.estimatedDuration,
      keyMetrics: keyMetrics,
      fullResults: suiteResult
    };
  }

  /**
   * Extract key metrics from test results
   */
  extractKeyMetrics(suiteName, results) {
    const metrics = {};
    
    switch (suiteName) {
      case 'MCP Server Integration':
        metrics.serversConnected = results.summary?.totalServers || 0;
        metrics.agentBindingRate = results.summary?.successRate || 0;
        break;
        
      case 'Unlimited Scaling Load Testing':
        metrics.maxStableAgents = results.summary?.maxStableAgents || 0;
        metrics.resourceEfficiency = results.summary?.successRate || 0;
        break;
        
      case 'Performance Regression Testing':
        metrics.performanceImprovement = results.summary?.overallImprovement || 0;
        metrics.targetsMetCount = results.summary?.targetsMetCount || 0;
        break;
        
      case 'End-to-End Integration':
        metrics.workflowsSuccessful = results.summary?.successfulWorkflows || 0;
        metrics.avgExecutionTime = results.summary?.avgExecutionTime || 0;
        break;
        
      case 'CI/CD Pipeline Integration':
        metrics.pipelinesWorking = results.summary?.successfulPipelines || 0;
        metrics.deploymentSuccess = results.summary?.successRate || 0;
        break;
        
      case 'Mock Server Infrastructure':
        metrics.mockServersWorking = results.summary?.workingMockServers || 0;
        metrics.dataQuality = results.summary?.successRate || 0;
        break;
    }
    
    return metrics;
  }

  /**
   * Display individual suite result
   */
  displaySuiteResult(result) {
    const emoji = result.status === 'passed' ? '✅' : '❌';
    const criticalFlag = result.critical ? ' [CRITICAL]' : '';
    const duration = (result.duration / 1000).toFixed(2);
    
    console.log(`\n${emoji} ${result.name}${criticalFlag}: ${result.status.toUpperCase()}`);
    console.log(`   📈 Success Rate: ${result.successRate}%`);
    console.log(`   ⏱️  Duration: ${duration}s`);
    
    // Display key metrics
    if (Object.keys(result.keyMetrics).length > 0) {
      console.log('   📊 Key Metrics:');
      for (const [metric, value] of Object.entries(result.keyMetrics)) {
        console.log(`      ${metric}: ${value}`);
      }
    }
  }

  /**
   * Handle critical test failure
   */
  async handleCriticalFailure(suiteConfig, result) {
    console.log(`\n⚠️  CRITICAL TEST FAILURE: ${suiteConfig.name}`);
    console.log(`📉 Success Rate: ${result.successRate}%`);
    
    if (result.error) {
      console.log(`❌ Error: ${result.error}`);
    }
    
    // In a real implementation, this could prompt for user input
    // For automated testing, we'll continue with a warning
    console.log('⚠️  Continuing with remaining tests (production readiness may be compromised)');
    
    return true; // Continue execution
  }

  /**
   * Analyze production readiness
   */
  analyzeProductionReadiness() {
    console.log('\n🔍 Analyzing Production Readiness...\n');
    
    const readiness = this.testResults.productionReadiness;
    let overallScore = 0;
    
    // MCP Server Integration
    const mcpSuite = this.testResults.testSuites.find(s => s.name === 'MCP Server Integration');
    if (mcpSuite) {
      const successRate = parseFloat(mcpSuite.successRate);
      readiness.mcpServerIntegration = successRate >= this.readinessCriteria.mcpServerIntegration.minSuccessRate;
      overallScore += readiness.mcpServerIntegration ? this.readinessCriteria.mcpServerIntegration.weight : 0;
      
      console.log(`✅ MCP Server Integration: ${readiness.mcpServerIntegration ? 'READY' : 'NOT READY'} (${successRate}%)`);
    }
    
    // Unlimited Scaling
    const scalingSuite = this.testResults.testSuites.find(s => s.name === 'Unlimited Scaling Load Testing');
    if (scalingSuite) {
      const successRate = parseFloat(scalingSuite.successRate);
      const maxAgents = scalingSuite.keyMetrics.maxStableAgents || 0;
      readiness.unlimitedScaling = successRate >= this.readinessCriteria.unlimitedScaling.minSuccessRate &&
                                  maxAgents >= this.readinessCriteria.unlimitedScaling.minAgents;
      overallScore += readiness.unlimitedScaling ? this.readinessCriteria.unlimitedScaling.weight : 0;
      
      console.log(`🚀 Unlimited Scaling: ${readiness.unlimitedScaling ? 'READY' : 'NOT READY'} (${maxAgents} max agents, ${successRate}%)`);
    }
    
    // Performance Targets
    const perfSuite = this.testResults.testSuites.find(s => s.name === 'Performance Regression Testing');
    if (perfSuite) {
      const improvement = perfSuite.keyMetrics.performanceImprovement || 0;
      const successRate = parseFloat(perfSuite.successRate);
      readiness.performanceTargets = improvement >= this.readinessCriteria.performanceTargets.minImprovement &&
                                    successRate >= this.readinessCriteria.performanceTargets.minSuccessRate;
      overallScore += readiness.performanceTargets ? this.readinessCriteria.performanceTargets.weight : 0;
      
      console.log(`⚡ Performance Targets: ${readiness.performanceTargets ? 'READY' : 'NOT READY'} (${improvement.toFixed(1)}% improvement, ${successRate}%)`);
    }
    
    // End-to-End Workflows
    const e2eSuite = this.testResults.testSuites.find(s => s.name === 'End-to-End Integration');
    if (e2eSuite) {
      const successRate = parseFloat(e2eSuite.successRate);
      readiness.endToEndWorkflows = successRate >= this.readinessCriteria.endToEndWorkflows.minSuccessRate;
      overallScore += readiness.endToEndWorkflows ? this.readinessCriteria.endToEndWorkflows.weight : 0;
      
      console.log(`🔄 End-to-End Workflows: ${readiness.endToEndWorkflows ? 'READY' : 'NOT READY'} (${successRate}%)`);
    }
    
    // CI/CD Pipeline
    const cicdSuite = this.testResults.testSuites.find(s => s.name === 'CI/CD Pipeline Integration');
    if (cicdSuite) {
      const successRate = parseFloat(cicdSuite.successRate);
      readiness.cicdPipeline = successRate >= this.readinessCriteria.cicdPipeline.minSuccessRate;
      overallScore += readiness.cicdPipeline ? this.readinessCriteria.cicdPipeline.weight : 0;
      
      console.log(`⚙️ CI/CD Pipeline: ${readiness.cicdPipeline ? 'READY' : 'NOT READY'} (${successRate}%)`);
    }
    
    // Mock Infrastructure
    const mockSuite = this.testResults.testSuites.find(s => s.name === 'Mock Server Infrastructure');
    if (mockSuite) {
      const successRate = parseFloat(mockSuite.successRate);
      readiness.mockInfrastructure = successRate >= this.readinessCriteria.mockInfrastructure.minSuccessRate;
      overallScore += readiness.mockInfrastructure ? this.readinessCriteria.mockInfrastructure.weight : 0;
      
      console.log(`🛠️ Mock Infrastructure: ${readiness.mockInfrastructure ? 'READY' : 'NOT READY'} (${successRate}%)`);
    }
    
    // Overall readiness
    readiness.overallReady = overallScore >= 0.8; // 80% weighted score
    
    console.log(`\n📊 Overall Production Readiness Score: ${(overallScore * 100).toFixed(1)}%`);
    console.log(`🏭 Production Ready: ${readiness.overallReady ? 'YES' : 'NO'}`);
    
    return readiness;
  }

  /**
   * Generate comprehensive summary
   */
  generateSummary() {
    const totalTests = this.testResults.testSuites.length;
    const passedTests = this.testResults.testSuites.filter(s => s.status === 'passed').length;
    const failedTests = totalTests - passedTests;
    const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : '0.0';
    
    // Determine overall status
    let overallStatus = 'unknown';
    if (parseFloat(successRate) >= 90) {
      overallStatus = 'excellent';
    } else if (parseFloat(successRate) >= 80) {
      overallStatus = 'good';
    } else if (parseFloat(successRate) >= 60) {
      overallStatus = 'fair';
    } else {
      overallStatus = 'poor';
    }
    
    // Extract key metrics
    const keyMetrics = {
      maxStableAgents: Math.max(...this.testResults.testSuites
        .map(s => s.keyMetrics.maxStableAgents || 0)),
      serverConnectivityRate: this.testResults.testSuites
        .find(s => s.name === 'MCP Server Integration')?.successRate || 0,
      performanceImprovement: this.testResults.testSuites
        .find(s => s.name === 'Performance Regression Testing')?.keyMetrics.performanceImprovement || 0,
      testCoverage: parseFloat(successRate),
      automationRate: this.testResults.testSuites
        .find(s => s.name === 'CI/CD Pipeline Integration')?.successRate || 0
    };
    
    this.testResults.summary = {
      totalTests,
      passedTests,
      failedTests,
      successRate: parseFloat(successRate),
      overallStatus
    };
    
    this.testResults.keyMetrics = keyMetrics;
    
    return {
      summary: this.testResults.summary,
      keyMetrics,
      overallStatus
    };
  }

  /**
   * Generate comprehensive test report
   */
  async generateFinalReport() {
    this.testResults.endTime = Date.now();
    this.testResults.totalDuration = this.testResults.endTime - this.testResults.startTime;
    
    console.log('\n📄 Generating Comprehensive Test Report...\n');
    
    // Analyze production readiness
    const productionReadiness = this.analyzeProductionReadiness();
    
    // Generate summary
    const summary = this.generateSummary();
    
    const finalReport = {
      metadata: {
        executionTime: new Date().toISOString(),
        totalDuration: this.testResults.totalDuration,
        testFramework: 'Enhanced MCP Testing and Validation System v3.0',
        systemVersion: 'Enhanced MCP Ecosystem v3.0'
      },
      
      summary: this.testResults.summary,
      
      keyMetrics: this.testResults.keyMetrics,
      
      productionReadiness: this.testResults.productionReadiness,
      
      testSuites: this.testResults.testSuites.map(suite => ({
        name: suite.name,
        status: suite.status,
        critical: suite.critical,
        successRate: suite.successRate,
        duration: suite.duration,
        keyMetrics: suite.keyMetrics
      })),
      
      recommendations: this.generateRecommendations(),
      
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch,
        workingDirectory: process.cwd()
      }
    };
    
    // Save detailed report
    const reportPath = path.join(__dirname, 'ENHANCED-MCP-COMPREHENSIVE-TEST-REPORT.json');
    await fs.writeFile(reportPath, JSON.stringify(finalReport, null, 2));
    
    // Generate markdown summary
    const markdownSummary = this.generateMarkdownSummary(finalReport);
    const summaryPath = path.join(__dirname, 'ENHANCED-MCP-TEST-SUMMARY.md');
    await fs.writeFile(summaryPath, markdownSummary);
    
    console.log(`📄 Detailed report saved: ${reportPath}`);
    console.log(`📋 Summary report saved: ${summaryPath}`);
    
    return finalReport;
  }

  /**
   * Generate recommendations based on test results
   */
  generateRecommendations() {
    const recommendations = [];
    
    // Analyze failed tests
    const failedSuites = this.testResults.testSuites.filter(s => s.status === 'failed');
    
    if (failedSuites.length > 0) {
      recommendations.push({
        type: 'critical',
        title: 'Address Failed Test Suites',
        description: `${failedSuites.length} test suite(s) failed: ${failedSuites.map(s => s.name).join(', ')}`,
        priority: 'high'
      });
    }
    
    // Check scaling capabilities
    const scalingSuite = this.testResults.testSuites.find(s => s.name === 'Unlimited Scaling Load Testing');
    if (scalingSuite && scalingSuite.keyMetrics.maxStableAgents < 2000) {
      recommendations.push({
        type: 'performance',
        title: 'Improve Scaling Capabilities',
        description: `Maximum stable agents: ${scalingSuite.keyMetrics.maxStableAgents}. Target: 2000+`,
        priority: 'medium'
      });
    }
    
    // Check performance improvements
    const perfSuite = this.testResults.testSuites.find(s => s.name === 'Performance Regression Testing');
    if (perfSuite && perfSuite.keyMetrics.performanceImprovement < 40) {
      recommendations.push({
        type: 'performance',
        title: 'Enhance Performance Optimizations',
        description: `Current improvement: ${perfSuite.keyMetrics.performanceImprovement}%. Target: 40-60%`,
        priority: 'medium'
      });
    }
    
    // Check overall success rate
    if (this.testResults.summary.successRate < 90) {
      recommendations.push({
        type: 'quality',
        title: 'Improve Overall Test Success Rate',
        description: `Current success rate: ${this.testResults.summary.successRate}%. Target: >90%`,
        priority: 'medium'
      });
    }
    
    // Production readiness recommendations
    if (!this.testResults.productionReadiness.overallReady) {
      recommendations.push({
        type: 'deployment',
        title: 'Address Production Readiness Issues',
        description: 'System is not yet production-ready. Review failed criteria and implement fixes.',
        priority: 'high'
      });
    }
    
    return recommendations;
  }

  /**
   * Generate markdown summary
   */
  generateMarkdownSummary(report) {
    const statusEmoji = {
      'excellent': '🎉',
      'good': '👍',
      'fair': '⚠️',
      'poor': '❌',
      'unknown': '❓'
    };
    
    const emoji = statusEmoji[report.summary.overallStatus] || '❓';
    
    return `# Enhanced MCP Testing and Validation System Report

${emoji} **Overall Status: ${report.summary.overallStatus.toUpperCase()}**  
**Success Rate: ${report.summary.successRate}%**  
**Production Ready: ${report.productionReadiness.overallReady ? 'YES' : 'NO'}**

## Executive Summary

- **Total Test Suites**: ${report.summary.totalTests}
- **Test Suites Passed**: ${report.summary.passedTests}
- **Test Suites Failed**: ${report.summary.failedTests}
- **Execution Duration**: ${(report.metadata.totalDuration / 1000 / 60).toFixed(1)} minutes
- **Execution Date**: ${report.metadata.executionTime}

## Key Metrics

- **Maximum Stable Agents**: ${report.keyMetrics.maxStableAgents}
- **Server Connectivity Rate**: ${report.keyMetrics.serverConnectivityRate}%
- **Performance Improvement**: ${report.keyMetrics.performanceImprovement}%
- **Test Coverage**: ${report.keyMetrics.testCoverage}%
- **Automation Rate**: ${report.keyMetrics.automationRate}%

## Production Readiness Status

${Object.entries(report.productionReadiness)
  .filter(([key]) => key !== 'overallReady')
  .map(([key, value]) => {
    const displayName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    const emoji = value ? '✅' : '❌';
    return `- ${emoji} **${displayName}**: ${value ? 'READY' : 'NOT READY'}`;
  }).join('\n')}

## Test Suite Results

${report.testSuites.map(suite => `
### ${suite.name} ${suite.critical ? '[CRITICAL]' : ''}
- **Status**: ${suite.status === 'passed' ? '✅ PASSED' : '❌ FAILED'}
- **Success Rate**: ${suite.successRate}%
- **Duration**: ${(suite.duration / 1000).toFixed(2)}s
${Object.keys(suite.keyMetrics).length > 0 ? 
  '- **Key Metrics**: ' + Object.entries(suite.keyMetrics)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ') : ''}
`).join('')}

## Recommendations

${report.recommendations.length > 0 ? 
  report.recommendations.map((rec, index) => 
    `${index + 1}. **${rec.title}** (${rec.priority.toUpperCase()}): ${rec.description}`
  ).join('\n') : 
  'No specific recommendations - all systems performing well!'}

## System Environment

- **Node.js Version**: ${report.environment.nodeVersion}
- **Platform**: ${report.environment.platform}
- **Architecture**: ${report.environment.architecture}
- **Working Directory**: ${report.environment.workingDirectory}

---
*Report generated by Enhanced MCP Testing and Validation System v3.0*
`;
  }

  /**
   * Display final results
   */
  displayFinalResults(report) {
    console.log('\n' + '='.repeat(80));
    console.log('🎯 ENHANCED MCP TESTING AND VALIDATION SYSTEM COMPLETE');
    console.log('='.repeat(80));
    
    const statusEmojis = {
      'excellent': '🎉',
      'good': '👍',
      'fair': '⚠️',
      'poor': '💥',
      'unknown': '❓'
    };
    
    const statusEmoji = statusEmojis[report.summary.overallStatus] || '❓';
    
    console.log(`\n${statusEmoji} OVERALL RESULTS:`);
    console.log(`   📊 Test Suites: ${report.summary.totalTests}`);
    console.log(`   ✅ Passed: ${report.summary.passedTests}`);
    console.log(`   ❌ Failed: ${report.summary.failedTests}`);
    console.log(`   📈 Success Rate: ${report.summary.successRate}%`);
    console.log(`   ⏱️  Total Duration: ${(report.metadata.totalDuration / 1000 / 60).toFixed(1)} minutes`);
    
    console.log(`\n📊 KEY METRICS:`);
    console.log(`   🚀 Max Stable Agents: ${report.keyMetrics.maxStableAgents}`);
    console.log(`   🔌 Server Connectivity: ${report.keyMetrics.serverConnectivityRate}%`);
    console.log(`   ⚡ Performance Improvement: ${report.keyMetrics.performanceImprovement}%`);
    console.log(`   🧪 Test Coverage: ${report.keyMetrics.testCoverage}%`);
    console.log(`   🤖 Automation Rate: ${report.keyMetrics.automationRate}%`);
    
    console.log(`\n🏭 PRODUCTION READINESS:`);
    const readyCount = Object.values(report.productionReadiness).filter(Boolean).length - 1; // Exclude overallReady
    const totalCriteria = Object.keys(report.productionReadiness).length - 1;
    console.log(`   📋 Criteria Met: ${readyCount}/${totalCriteria}`);
    console.log(`   🚦 Overall Status: ${report.productionReadiness.overallReady ? '✅ PRODUCTION READY' : '❌ NOT READY'}`);
    
    if (report.recommendations.length > 0) {
      console.log(`\n💡 KEY RECOMMENDATIONS:`);
      report.recommendations.slice(0, 3).forEach((rec, index) => {
        const priorityEmoji = rec.priority === 'high' ? '🔥' : rec.priority === 'medium' ? '⚠️' : 'ℹ️';
        console.log(`   ${priorityEmoji} ${rec.title}`);
      });
    }
    
    console.log(`\n📄 Reports generated:`);
    console.log(`   - Detailed: ENHANCED-MCP-COMPREHENSIVE-TEST-REPORT.json`);
    console.log(`   - Summary: ENHANCED-MCP-TEST-SUMMARY.md`);
    
    console.log('\n' + '='.repeat(80));
    
    return report.productionReadiness.overallReady;
  }

  /**
   * Main execution method
   */
  async run() {
    try {
      console.log('🧪 Enhanced MCP Testing and Validation System v3.0');
      console.log('Comprehensive testing for enhanced MCP server integrations\n');
      
      // Run all test suites
      await this.runAllTestSuites();
      
      // Generate final report
      const report = await this.generateFinalReport();
      
      // Display final results
      const isProductionReady = this.displayFinalResults(report);
      
      return isProductionReady;
      
    } catch (error) {
      console.error('❌ Test orchestrator failed:', error);
      console.error(error.stack);
      return false;
    }
  }
}

// Export for use in other files
module.exports = EnhancedMCPTestOrchestrator;

// Run if executed directly
if (require.main === module) {
  const orchestrator = new EnhancedMCPTestOrchestrator();
  
  orchestrator.run()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Fatal error in test orchestrator:', error);
      process.exit(1);
    });
}