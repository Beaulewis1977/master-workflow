/**
 * Master Test Orchestrator for Fullstack Modern Template
 * 
 * This orchestrator runs comprehensive testing across all production deployment scenarios:
 * - Vercel configuration and deployment validation
 * - CI/CD pipeline testing and automation
 * - Docker production build optimization and security
 * - Production environment validation and monitoring
 * - Deployment automation (blue-green, canary, zero-downtime)
 * - Performance monitoring and alerting systems
 * - Security compliance and vulnerability assessment
 * 
 * Provides unified reporting and production readiness assessment.
 */

const fs = require('fs');
const path = require('path');
const { VercelConfigValidator } = require('./vercel/vercel-config-validation-tests');
const { VercelDeploymentTester } = require('./vercel/vercel-deployment-tests');
const { GitHubActionsPipelineTester } = require('./ci-cd/github-actions-pipeline-tests');
const { DockerProductionBuildTester } = require('./docker/docker-production-build-tests');
const { ProductionEnvironmentValidator } = require('./production/production-environment-validation-tests');
const { DeploymentAutomationTester } = require('./deployment/deployment-automation-tests');
const { PerformanceMonitoringTester } = require('./monitoring/performance-monitoring-tests');
const { SecurityComplianceTester } = require('./security/security-compliance-tests');
const { DataFlowIntegrationTestSuite } = require('./full-stack/data-flow-integration-tests');
const { WebSocketTestFramework } = require('./websocket/websocket-test-framework');
const { SecurityValidationTestSuite } = require('./security/security-validation-tests');
const { DatabaseIntegrityTestSuite } = require('./database/database-integrity-test-suite');
const { ComprehensiveErrorHandlingTestSuite } = require('./error-handling/comprehensive-error-handling-test-suite');
const { LoadTestingBenchmarkSuite } = require('./performance/load-testing-benchmark-suite');

class MasterTestOrchestrator {
  constructor(options = {}) {
    this.options = {
      timeout: options.timeout || 1800000, // 30 minutes
      parallel: options.parallel !== false, // Default to parallel execution
      stopOnCriticalFailure: options.stopOnCriticalFailure !== false,
      generateReports: options.generateReports !== false,
      ...options
    };
    
    this.projectPath = path.resolve(__dirname, '../');
    this.reportsPath = path.join(this.projectPath, 'reports');
    
    this.testSuites = {
      vercelConfig: new VercelConfigValidator(),
      vercelDeployment: new VercelDeploymentTester(),
      cicdPipeline: new GitHubActionsPipelineTester(),
      dockerBuilds: new DockerProductionBuildTester(),
      productionEnvironment: new ProductionEnvironmentValidator(),
      deploymentAutomation: new DeploymentAutomationTester(),
      performanceMonitoring: new PerformanceMonitoringTester(),
      securityCompliance: new SecurityComplianceTester(),
      
      // New comprehensive test suites
      dataFlowIntegration: new DataFlowIntegrationTestSuite({
        frontendURL: options.frontendURL || 'http://localhost:3000',
        backendURL: options.backendURL || 'http://localhost:8000',
        wsURL: options.wsURL || 'ws://localhost:8000'
      }),
      websocketTesting: new WebSocketTestFramework({
        url: options.wsURL || 'ws://localhost:8000',
        timeout: 15000,
        concurrentConnections: 50
      }),
      securityValidation: new SecurityValidationTestSuite({
        baseURL: options.backendURL || 'http://localhost:8000',
        frontendURL: options.frontendURL || 'http://localhost:3000'
      }),
      databaseIntegrity: new DatabaseIntegrityTestSuite({
        connectionString: options.databaseURL || process.env.DATABASE_URL
      }),
      errorHandling: new ComprehensiveErrorHandlingTestSuite({
        apiBaseURL: options.backendURL || 'http://localhost:8000/api',
        frontendURL: options.frontendURL || 'http://localhost:3000'
      }),
      loadTesting: new LoadTestingBenchmarkSuite({
        apiBaseURL: options.backendURL || 'http://localhost:8000/api',
        frontendURL: options.frontendURL || 'http://localhost:3000',
        wsURL: options.wsURL || 'ws://localhost:8000',
        maxVirtualUsers: options.maxVirtualUsers || 500
      })
    };
    
    this.executionResults = {};
    this.overallReport = {};
  }

  async runCompleteTestSuite() {
    const startTime = Date.now();
    
    console.log('🚀 Starting Comprehensive Production Deployment Testing Suite');
    console.log('=' .repeat(80));
    console.log('');

    // Initialize master report
    this.overallReport = {
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        template: 'fullstack-modern',
        executionMode: this.options.parallel ? 'parallel' : 'sequential'
      },
      executionTime: 0,
      overall: {
        success: true,
        productionReady: false,
        suitesRun: 0,
        suitesPassed: 0,
        suitesFailed: 0,
        overallScore: 0
      },
      suiteResults: {},
      criticalIssues: [],
      recommendations: [],
      productionReadinessAssessment: {}
    };

    try {
      // Create reports directory
      await this.ensureReportsDirectory();

      // Run prerequisites check across all suites
      console.log('📋 Running Prerequisites Assessment...');
      const prerequisites = await this.checkAllPrerequisites();
      this.overallReport.prerequisites = prerequisites;
      
      if (!this.arePrerequisitesMet(prerequisites)) {
        console.log('⚠️  Some prerequisites not met. Tests may be limited.\n');
      }

      // Execute test suites
      if (this.options.parallel) {
        await this.runTestSuitesInParallel();
      } else {
        await this.runTestSuitesSequentially();
      }

      // Generate comprehensive analysis
      await this.generateComprehensiveAnalysis();

      // Assess production readiness
      await this.assessProductionReadiness();

      // Generate consolidated recommendations
      await this.generateConsolidatedRecommendations();

    } catch (error) {
      this.overallReport.overall.success = false;
      this.overallReport.criticalError = {
        message: error.message,
        stack: error.stack
      };
      console.error('💥 Critical error during test execution:', error.message);
    }

    this.overallReport.executionTime = Date.now() - startTime;

    // Generate and save final report
    await this.generateFinalReport();

    // Display summary
    this.displayExecutionSummary();

    return this.overallReport;
  }

  async checkAllPrerequisites() {
    console.log('  Checking prerequisites across all test suites...');
    
    const prerequisites = {};
    
    for (const [suiteName, suite] of Object.entries(this.testSuites)) {
      try {
        if (typeof suite.checkPrerequisites === 'function') {
          prerequisites[suiteName] = await suite.checkPrerequisites();
        } else {
          prerequisites[suiteName] = { available: true, note: 'No prerequisites check available' };
        }
      } catch (error) {
        prerequisites[suiteName] = { 
          available: false, 
          error: error.message 
        };
      }
    }

    return prerequisites;
  }

  arePrerequisitesMet(prerequisites) {
    const criticalSuites = ['vercelConfig', 'securityCompliance', 'productionEnvironment'];
    
    return criticalSuites.every(suite => {
      const prereqs = prerequisites[suite];
      if (!prereqs) return false;
      
      // Check if at least 80% of prerequisites are met
      const prereqValues = Object.values(prereqs).filter(v => typeof v === 'boolean');
      const metCount = prereqValues.filter(v => v === true).length;
      return prereqValues.length === 0 || (metCount / prereqValues.length) >= 0.8;
    });
  }

  async runTestSuitesInParallel() {
    console.log('⚡ Running test suites in parallel...\n');

    const testPromises = Object.entries(this.testSuites).map(([suiteName, suite]) => 
      this.runSingleTestSuite(suiteName, suite)
    );

    const results = await Promise.allSettled(testPromises);

    // Process results
    results.forEach((result, index) => {
      const suiteName = Object.keys(this.testSuites)[index];
      
      if (result.status === 'fulfilled') {
        this.executionResults[suiteName] = result.value;
      } else {
        this.executionResults[suiteName] = {
          error: result.reason.message,
          status: 'error'
        };
      }
    });
  }

  async runTestSuitesSequentially() {
    console.log('📋 Running test suites sequentially...\n');

    for (const [suiteName, suite] of Object.entries(this.testSuites)) {
      try {
        const result = await this.runSingleTestSuite(suiteName, suite);
        this.executionResults[suiteName] = result;

        // Check for critical failures
        if (this.options.stopOnCriticalFailure && this.isCriticalFailure(result)) {
          console.log(`💥 Critical failure in ${suiteName}, stopping execution.`);
          break;
        }

      } catch (error) {
        this.executionResults[suiteName] = {
          error: error.message,
          status: 'error'
        };

        if (this.options.stopOnCriticalFailure) {
          console.log(`💥 Critical error in ${suiteName}, stopping execution.`);
          break;
        }
      }
    }
  }

  async runSingleTestSuite(suiteName, suite) {
    console.log(`🧪 Running ${this.formatSuiteName(suiteName)} tests...`);
    
    const startTime = Date.now();
    let result = {};

    try {
      // Determine which method to call based on the suite
      switch (suiteName) {
        case 'vercelConfig':
          result = await suite.runCompleteValidation();
          break;
        case 'vercelDeployment':
          result = await suite.runCompleteDeploymentTests();
          break;
        case 'cicdPipeline':
          result = await suite.runCompletePipelineTests();
          break;
        case 'dockerBuilds':
          result = await suite.runCompleteDockerTests();
          break;
        case 'productionEnvironment':
          result = await suite.runCompleteProductionValidation();
          break;
        case 'deploymentAutomation':
          result = await suite.runCompleteDeploymentAutomationTests();
          break;
        case 'performanceMonitoring':
          result = await suite.runCompletePerformanceMonitoringTests();
          break;
        case 'securityCompliance':
          result = await suite.runCompleteSecurityComplianceTests();
          break;
        case 'dataFlowIntegration':
          result = await suite.runAllTests();
          break;
        case 'websocketTesting':
          result = await suite.runAllTests();
          break;
        case 'securityValidation':
          result = await suite.runAllTests();
          break;
        case 'databaseIntegrity':
          result = await suite.runAllTests();
          break;
        case 'errorHandling':
          result = await suite.runAllTests();
          break;
        case 'loadTesting':
          result = await suite.runAllTests();
          break;
        default:
          throw new Error(`Unknown test suite: ${suiteName}`);
      }

      result.suiteName = suiteName;
      result.executionTime = Date.now() - startTime;
      
      console.log(`  ✅ ${this.formatSuiteName(suiteName)} completed in ${result.executionTime}ms`);
      
    } catch (error) {
      result = {
        suiteName,
        error: error.message,
        status: 'error',
        executionTime: Date.now() - startTime
      };
      
      console.log(`  ❌ ${this.formatSuiteName(suiteName)} failed: ${error.message}`);
    }

    return result;
  }

  isCriticalFailure(result) {
    // Define criteria for critical failures
    if (result.error) return true;
    if (result.overall && result.overall.success === false) return true;
    if (result.overall && result.overall.score < 50) return true;
    
    return false;
  }

  async generateComprehensiveAnalysis() {
    console.log('\n📊 Generating comprehensive analysis...');

    const analysis = {
      suiteAnalysis: {},
      crossSuiteInsights: {},
      riskAssessment: {},
      performanceMetrics: {}
    };

    // Analyze each suite
    for (const [suiteName, result] of Object.entries(this.executionResults)) {
      analysis.suiteAnalysis[suiteName] = this.analyzeSuiteResult(suiteName, result);
    }

    // Cross-suite analysis
    analysis.crossSuiteInsights = this.generateCrossSuiteInsights();

    // Risk assessment
    analysis.riskAssessment = this.generateRiskAssessment();

    // Performance metrics
    analysis.performanceMetrics = this.aggregatePerformanceMetrics();

    this.overallReport.analysis = analysis;
  }

  analyzeSuiteResult(suiteName, result) {
    const analysis = {
      status: result.error ? 'error' : (result.overall?.success ? 'success' : 'failed'),
      score: this.calculateSuiteScore(result),
      executionTime: result.executionTime || 0,
      keyMetrics: this.extractKeyMetrics(suiteName, result),
      issues: this.extractIssues(result),
      recommendations: result.recommendations || []
    };

    // Update overall counters
    this.overallReport.overall.suitesRun++;
    if (analysis.status === 'success') {
      this.overallReport.overall.suitesPassed++;
    } else {
      this.overallReport.overall.suitesFailed++;
    }

    // Store in main results
    this.overallReport.suiteResults[suiteName] = analysis;

    return analysis;
  }

  calculateSuiteScore(result) {
    if (result.error) return 0;
    
    // Different scoring strategies based on result structure
    if (result.overall?.score !== undefined) {
      return result.overall.score;
    }
    
    if (result.overall?.testsPassed !== undefined && result.overall?.testsRun !== undefined) {
      return result.overall.testsRun > 0 ? 
        Math.round((result.overall.testsPassed / result.overall.testsRun) * 100) : 0;
    }
    
    if (result.overall?.success === true) return 100;
    if (result.overall?.success === false) return 0;
    
    return 50; // Unknown/partial
  }

  extractKeyMetrics(suiteName, result) {
    const metrics = {};

    switch (suiteName) {
      case 'vercelConfig':
        metrics.configurationScore = result.overall?.score || 0;
        metrics.securityScore = result.validations?.security?.securityScore || 0;
        break;
        
      case 'vercelDeployment':
        metrics.deploymentSuccess = result.overall?.success || false;
        metrics.functionsCount = result.results?.serverlessFunctions?.length || 0;
        break;
        
      case 'cicdPipeline':
        metrics.workflowsValid = result.results?.workflowValidation?.filter(w => w.status === 'success').length || 0;
        metrics.securityPassed = result.results?.securityScanning?.every(s => s.status === 'success') || false;
        break;
        
      case 'dockerBuilds':
        metrics.imagesBuilt = result.results?.buildOptimization?.length || 0;
        metrics.securityIssues = result.results?.securityScanning?.reduce((sum, s) => 
          sum + (s.vulnerabilities?.critical || 0) + (s.vulnerabilities?.high || 0), 0) || 0;
        break;
        
      case 'productionEnvironment':
        metrics.productionReady = result.overall?.productionReady || false;
        metrics.sslCompliant = result.results?.sslTests?.every(t => t.status === 'success') || false;
        break;
        
      case 'deploymentAutomation':
        metrics.deploymentReady = result.overall?.deploymentReady || false;
        metrics.zeroDowntime = result.results?.zeroDowntimeTests?.every(t => t.status === 'success') || false;
        break;
        
      case 'performanceMonitoring':
        metrics.monitoringReady = result.overall?.monitoringReady || false;
        metrics.alertingConfigured = result.results?.alertingTests?.every(t => t.status === 'success') || false;
        break;
        
      case 'securityCompliance':
        metrics.complianceScore = result.overall?.complianceScore || 0;
        metrics.securityReady = result.overall?.securityReady || false;
        break;
    }

    return metrics;
  }

  extractIssues(result) {
    const issues = [];
    
    if (result.error) {
      issues.push({
        severity: 'critical',
        category: 'execution',
        message: result.error
      });
    }

    // Extract issues from recommendations with high/critical priority
    if (result.recommendations) {
      result.recommendations.forEach(rec => {
        if (['Critical', 'High'].includes(rec.priority)) {
          issues.push({
            severity: rec.priority.toLowerCase(),
            category: rec.category,
            message: rec.message,
            action: rec.action
          });
        }
      });
    }

    return issues;
  }

  generateCrossSuiteInsights() {
    const insights = {
      securityConsistency: this.analyzeSecurityConsistency(),
      performanceCorrelation: this.analyzePerformanceCorrelation(),
      deploymentReadiness: this.analyzeDeploymentReadiness(),
      configurationAlignment: this.analyzeConfigurationAlignment()
    };

    return insights;
  }

  analyzeSecurityConsistency() {
    const securityResults = [
      this.overallReport.suiteResults.vercelConfig?.keyMetrics?.securityScore || 0,
      this.overallReport.suiteResults.dockerBuilds?.keyMetrics?.securityIssues ? 
        (100 - this.overallReport.suiteResults.dockerBuilds.keyMetrics.securityIssues) : 100,
      this.overallReport.suiteResults.securityCompliance?.keyMetrics?.complianceScore || 0
    ];

    const avgScore = securityResults.reduce((sum, score) => sum + score, 0) / securityResults.length;
    const variance = securityResults.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / securityResults.length;

    return {
      averageScore: Math.round(avgScore),
      consistency: variance < 100 ? 'high' : variance < 400 ? 'medium' : 'low',
      variance: Math.round(variance)
    };
  }

  analyzePerformanceCorrelation() {
    return {
      monitoringSetup: this.overallReport.suiteResults.performanceMonitoring?.keyMetrics?.monitoringReady || false,
      deploymentOptimization: this.overallReport.suiteResults.deploymentAutomation?.keyMetrics?.zeroDowntime || false,
      correlation: 'positive' // Would be calculated based on actual metrics
    };
  }

  analyzeDeploymentReadiness() {
    const readinessFactors = {
      configuration: this.overallReport.suiteResults.vercelConfig?.status === 'success',
      cicd: this.overallReport.suiteResults.cicdPipeline?.status === 'success',
      containers: this.overallReport.suiteResults.dockerBuilds?.status === 'success',
      environment: this.overallReport.suiteResults.productionEnvironment?.keyMetrics?.productionReady || false,
      automation: this.overallReport.suiteResults.deploymentAutomation?.keyMetrics?.deploymentReady || false
    };

    const readyCount = Object.values(readinessFactors).filter(Boolean).length;
    const readinessPercentage = (readyCount / Object.keys(readinessFactors).length) * 100;

    return {
      factors: readinessFactors,
      percentage: Math.round(readinessPercentage),
      ready: readinessPercentage >= 90
    };
  }

  analyzeConfigurationAlignment() {
    return {
      vercelDockerAlignment: 'consistent', // Would analyze actual configs
      cicdDeploymentAlignment: 'consistent',
      monitoringSecurityAlignment: 'consistent',
      overallAlignment: 'good'
    };
  }

  generateRiskAssessment() {
    const risks = [];

    // Security risks
    const securityScore = this.overallReport.suiteResults.securityCompliance?.keyMetrics?.complianceScore || 0;
    if (securityScore < 80) {
      risks.push({
        category: 'Security',
        level: securityScore < 60 ? 'high' : 'medium',
        description: 'Security compliance below production standards',
        impact: 'Data breaches, compliance violations',
        mitigation: 'Address security test failures and implement recommended controls'
      });
    }

    // Deployment risks
    const deploymentReady = this.overallReport.suiteResults.deploymentAutomation?.keyMetrics?.deploymentReady || false;
    if (!deploymentReady) {
      risks.push({
        category: 'Deployment',
        level: 'medium',
        description: 'Deployment automation not fully configured',
        impact: 'Manual deployments, potential downtime',
        mitigation: 'Implement automated deployment strategies'
      });
    }

    // Performance risks
    const monitoringReady = this.overallReport.suiteResults.performanceMonitoring?.keyMetrics?.monitoringReady || false;
    if (!monitoringReady) {
      risks.push({
        category: 'Performance',
        level: 'medium',
        description: 'Performance monitoring not comprehensive',
        impact: 'Undetected performance issues, poor user experience',
        mitigation: 'Implement comprehensive monitoring and alerting'
      });
    }

    return {
      risks,
      overallRiskLevel: this.calculateOverallRiskLevel(risks)
    };
  }

  calculateOverallRiskLevel(risks) {
    if (risks.some(r => r.level === 'high')) return 'high';
    if (risks.some(r => r.level === 'medium')) return 'medium';
    return 'low';
  }

  aggregatePerformanceMetrics() {
    const totalExecutionTime = Object.values(this.executionResults)
      .reduce((sum, result) => sum + (result.executionTime || 0), 0);

    const avgExecutionTime = this.overallReport.overall.suitesRun > 0 ? 
      totalExecutionTime / this.overallReport.overall.suitesRun : 0;

    return {
      totalExecutionTime,
      averageExecutionTime: Math.round(avgExecutionTime),
      parallelEfficiency: this.options.parallel ? 
        Math.round((avgExecutionTime * this.overallReport.overall.suitesRun) / totalExecutionTime * 100) : 100
    };
  }

  async assessProductionReadiness() {
    console.log('🏭 Assessing production readiness...');

    const readinessFactors = {
      security: {
        weight: 30,
        score: this.overallReport.suiteResults.securityCompliance?.keyMetrics?.complianceScore || 0,
        critical: true
      },
      deployment: {
        weight: 25,
        score: this.overallReport.suiteResults.deploymentAutomation?.score || 0,
        critical: true
      },
      environment: {
        weight: 20,
        score: this.overallReport.suiteResults.productionEnvironment?.score || 0,
        critical: true
      },
      monitoring: {
        weight: 15,
        score: this.overallReport.suiteResults.performanceMonitoring?.score || 0,
        critical: false
      },
      cicd: {
        weight: 10,
        score: this.overallReport.suiteResults.cicdPipeline?.score || 0,
        critical: false
      }
    };

    // Calculate weighted score
    let weightedScore = 0;
    let totalWeight = 0;
    let criticalFailures = 0;

    for (const [factor, config] of Object.entries(readinessFactors)) {
      weightedScore += (config.score * config.weight) / 100;
      totalWeight += config.weight;
      
      if (config.critical && config.score < 70) {
        criticalFailures++;
      }
    }

    const overallScore = Math.round((weightedScore / totalWeight) * 100);
    const productionReady = overallScore >= 85 && criticalFailures === 0;

    this.overallReport.overall.overallScore = overallScore;
    this.overallReport.overall.productionReady = productionReady;

    this.overallReport.productionReadinessAssessment = {
      factors: readinessFactors,
      overallScore,
      productionReady,
      criticalFailures,
      requirements: {
        minimumScore: 85,
        criticalFailuresAllowed: 0,
        met: productionReady
      },
      nextSteps: this.generateNextSteps(readinessFactors, productionReady)
    };
  }

  generateNextSteps(readinessFactors, productionReady) {
    const steps = [];

    if (productionReady) {
      steps.push({
        priority: 'High',
        action: 'Deploy to staging environment for final validation',
        category: 'Deployment'
      });
      steps.push({
        priority: 'Medium',
        action: 'Set up production monitoring and alerting',
        category: 'Monitoring'
      });
    } else {
      // Identify areas that need improvement
      Object.entries(readinessFactors).forEach(([factor, config]) => {
        if (config.score < 70) {
          steps.push({
            priority: config.critical ? 'Critical' : 'High',
            action: `Improve ${factor} configuration and testing`,
            category: factor,
            currentScore: config.score,
            targetScore: 85
          });
        }
      });
    }

    return steps;
  }

  async generateConsolidatedRecommendations() {
    console.log('💡 Generating consolidated recommendations...');

    const allRecommendations = [];

    // Collect recommendations from all suites
    Object.values(this.executionResults).forEach(result => {
      if (result.recommendations) {
        allRecommendations.push(...result.recommendations);
      }
    });

    // Categorize and prioritize
    const categorized = this.categorizeRecommendations(allRecommendations);
    const prioritized = this.prioritizeRecommendations(categorized);
    const deduplicated = this.deduplicateRecommendations(prioritized);

    this.overallReport.recommendations = deduplicated;
  }

  categorizeRecommendations(recommendations) {
    const categories = {
      security: [],
      performance: [],
      deployment: [],
      monitoring: [],
      configuration: [],
      other: []
    };

    recommendations.forEach(rec => {
      const category = this.determineCategory(rec.category);
      categories[category].push(rec);
    });

    return categories;
  }

  determineCategory(category) {
    const categoryMap = {
      'Security': 'security',
      'Performance': 'performance',
      'Deployment': 'deployment',
      'Monitoring': 'monitoring',
      'Configuration': 'configuration'
    };

    return categoryMap[category] || 'other';
  }

  prioritizeRecommendations(categorized) {
    const priorityOrder = ['Critical', 'High', 'Medium', 'Low'];
    
    Object.keys(categorized).forEach(category => {
      categorized[category].sort((a, b) => {
        const aPriority = priorityOrder.indexOf(a.priority);
        const bPriority = priorityOrder.indexOf(b.priority);
        return aPriority - bPriority;
      });
    });

    return categorized;
  }

  deduplicateRecommendations(categorized) {
    const deduplicated = {};
    
    Object.keys(categorized).forEach(category => {
      const unique = [];
      const seen = new Set();
      
      categorized[category].forEach(rec => {
        const key = `${rec.message}-${rec.action}`;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(rec);
        }
      });
      
      deduplicated[category] = unique;
    });

    return deduplicated;
  }

  async generateFinalReport() {
    console.log('\n📋 Generating final report...');

    if (this.options.generateReports) {
      // Save comprehensive JSON report
      const jsonReportPath = path.join(this.reportsPath, 'master-test-report.json');
      await fs.promises.writeFile(
        jsonReportPath, 
        JSON.stringify(this.overallReport, null, 2)
      );

      // Generate HTML report
      await this.generateHTMLReport();

      // Generate executive summary
      await this.generateExecutiveSummary();

      console.log(`  📊 Reports saved to: ${this.reportsPath}`);
    }
  }

  async generateHTMLReport() {
    const htmlContent = this.createHTMLReport();
    const htmlReportPath = path.join(this.reportsPath, 'master-test-report.html');
    await fs.promises.writeFile(htmlReportPath, htmlContent);
  }

  createHTMLReport() {
    // Basic HTML report template
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Fullstack Modern Template - Production Readiness Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .success { color: green; }
        .failed { color: red; }
        .warning { color: orange; }
        .score { font-size: 24px; font-weight: bold; }
        .section { margin: 20px 0; }
        .recommendation { background: #fff3cd; padding: 10px; margin: 5px 0; border-left: 4px solid #ffc107; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Production Readiness Report</h1>
        <p>Template: Fullstack Modern</p>
        <p>Generated: ${this.overallReport.metadata.timestamp}</p>
        <div class="score ${this.overallReport.overall.productionReady ? 'success' : 'failed'}">
            Overall Score: ${this.overallReport.overall.overallScore}/100
        </div>
        <p class="${this.overallReport.overall.productionReady ? 'success' : 'failed'}">
            Production Ready: ${this.overallReport.overall.productionReady ? 'YES' : 'NO'}
        </p>
    </div>

    <div class="section">
        <h2>Test Suite Results</h2>
        ${Object.entries(this.overallReport.suiteResults).map(([suite, result]) => `
            <div>
                <h3 class="${result.status}">${this.formatSuiteName(suite)}</h3>
                <p>Status: ${result.status}</p>
                <p>Score: ${result.score}/100</p>
                <p>Execution Time: ${result.executionTime}ms</p>
            </div>
        `).join('')}
    </div>

    <div class="section">
        <h2>Top Recommendations</h2>
        ${Object.entries(this.overallReport.recommendations).map(([category, recs]) => 
          recs.slice(0, 3).map(rec => `
            <div class="recommendation">
                <strong>[${rec.priority}] ${rec.category}</strong>: ${rec.message}
                <br><small>Action: ${rec.action}</small>
            </div>
          `).join('')
        ).join('')}
    </div>
</body>
</html>`;
  }

  async generateExecutiveSummary() {
    const summary = {
      title: 'Production Readiness Executive Summary',
      template: 'Fullstack Modern',
      timestamp: this.overallReport.metadata.timestamp,
      
      overview: {
        productionReady: this.overallReport.overall.productionReady,
        overallScore: this.overallReport.overall.overallScore,
        testSuitesRun: this.overallReport.overall.suitesRun,
        testSuitesPassed: this.overallReport.overall.suitesPassed
      },
      
      keyFindings: this.generateKeyFindings(),
      
      riskAssessment: this.overallReport.analysis?.riskAssessment || {},
      
      recommendations: this.getTopRecommendations(),
      
      nextSteps: this.overallReport.productionReadinessAssessment?.nextSteps || []
    };

    const summaryPath = path.join(this.reportsPath, 'executive-summary.json');
    await fs.promises.writeFile(summaryPath, JSON.stringify(summary, null, 2));
  }

  generateKeyFindings() {
    const findings = [];

    // Security findings
    const securityScore = this.overallReport.suiteResults.securityCompliance?.keyMetrics?.complianceScore || 0;
    findings.push({
      area: 'Security',
      status: securityScore >= 85 ? 'good' : securityScore >= 70 ? 'needs improvement' : 'critical',
      score: securityScore,
      description: `Security compliance at ${securityScore}%`
    });

    // Deployment findings
    const deploymentReady = this.overallReport.suiteResults.deploymentAutomation?.keyMetrics?.deploymentReady || false;
    findings.push({
      area: 'Deployment',
      status: deploymentReady ? 'good' : 'needs improvement',
      description: `Deployment automation ${deploymentReady ? 'ready' : 'needs configuration'}`
    });

    // Performance findings
    const monitoringReady = this.overallReport.suiteResults.performanceMonitoring?.keyMetrics?.monitoringReady || false;
    findings.push({
      area: 'Monitoring',
      status: monitoringReady ? 'good' : 'needs improvement',
      description: `Performance monitoring ${monitoringReady ? 'ready' : 'needs setup'}`
    });

    return findings;
  }

  getTopRecommendations() {
    const allRecs = [];
    
    Object.values(this.overallReport.recommendations).forEach(categoryRecs => {
      allRecs.push(...categoryRecs);
    });

    return allRecs
      .filter(rec => ['Critical', 'High'].includes(rec.priority))
      .slice(0, 5);
  }

  displayExecutionSummary() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 EXECUTION SUMMARY');
    console.log('='.repeat(80));
    
    console.log(`\n🎯 Overall Results:`);
    console.log(`   Production Ready: ${this.overallReport.overall.productionReady ? '✅ YES' : '❌ NO'}`);
    console.log(`   Overall Score: ${this.overallReport.overall.overallScore}/100`);
    console.log(`   Test Suites: ${this.overallReport.overall.suitesPassed}/${this.overallReport.overall.suitesRun} passed`);
    console.log(`   Execution Time: ${Math.round(this.overallReport.executionTime / 1000)}s`);

    console.log(`\n📋 Test Suite Results:`);
    Object.entries(this.overallReport.suiteResults).forEach(([suite, result]) => {
      const icon = result.status === 'success' ? '✅' : result.status === 'error' ? '💥' : '⚠️';
      console.log(`   ${icon} ${this.formatSuiteName(suite)}: ${result.score}/100`);
    });

    if (this.overallReport.analysis?.riskAssessment?.risks?.length > 0) {
      console.log(`\n⚠️  Risk Assessment:`);
      this.overallReport.analysis.riskAssessment.risks.forEach(risk => {
        console.log(`   [${risk.level.toUpperCase()}] ${risk.category}: ${risk.description}`);
      });
    }

    const topRecs = this.getTopRecommendations();
    if (topRecs.length > 0) {
      console.log(`\n💡 Top Recommendations:`);
      topRecs.slice(0, 3).forEach((rec, index) => {
        console.log(`   ${index + 1}. [${rec.priority}] ${rec.message}`);
      });
    }

    if (this.options.generateReports) {
      console.log(`\n📋 Detailed reports available in: ${this.reportsPath}`);
    }

    console.log('\n' + '='.repeat(80));
  }

  formatSuiteName(suiteName) {
    const nameMap = {
      vercelConfig: 'Vercel Configuration',
      vercelDeployment: 'Vercel Deployment',
      cicdPipeline: 'CI/CD Pipeline',
      dockerBuilds: 'Docker Production Builds',
      productionEnvironment: 'Production Environment',
      deploymentAutomation: 'Deployment Automation',
      performanceMonitoring: 'Performance Monitoring',
      securityCompliance: 'Security Compliance'
    };

    return nameMap[suiteName] || suiteName;
  }

  async ensureReportsDirectory() {
    try {
      await fs.promises.access(this.reportsPath);
    } catch {
      await fs.promises.mkdir(this.reportsPath, { recursive: true });
    }
  }
}

// Export for use in other files
module.exports = {
  MasterTestOrchestrator
};

// Run tests if called directly
if (require.main === module) {
  const orchestrator = new MasterTestOrchestrator({
    parallel: true,
    generateReports: true,
    stopOnCriticalFailure: false
  });

  orchestrator.runCompleteTestSuite()
    .then(report => {
      process.exit(report.overall.productionReady ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test orchestration failed:', error);
      process.exit(1);
    });
}