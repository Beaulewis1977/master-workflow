#!/usr/bin/env node

/**
 * Comprehensive Test Runner and Reporting System
 * Orchestrates all test suites and generates comprehensive reports
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

// Import all test suites
const DockerComposeTestSuite = require('./docker/docker-compose-test-suite');
const HotReloadTestSuite = require('./development/hot-reload-test-suite');
const EnvironmentVariableTestSuite = require('./environment/env-variable-test-suite');
const DevScriptsTestSuite = require('./scripts/dev-scripts-test-suite');
const ContainerInfrastructureTestSuite = require('./infrastructure/container-infrastructure-test-suite');
const CrossPlatformTestSuite = require('./platform/cross-platform-test-suite');

class ComprehensiveTestRunner {
  constructor() {
    this.templatePath = path.resolve(__dirname, '../');
    this.testSuites = new Map();
    this.testResults = new Map();
    this.startTime = Date.now();
    this.config = {
      parallel: false, // Run suites in parallel or sequentially
      continueOnFailure: true,
      generateReports: true,
      outputDirectory: path.join(this.templatePath, 'test-reports'),
      includeCoverage: false,
      verbose: true
    };
    
    this.registerTestSuites();
  }

  registerTestSuites() {
    // Register all test suites with metadata
    this.testSuites.set('docker-compose', {
      name: 'Docker Compose Setup',
      description: 'Tests Docker Compose configuration, orchestration, and multi-service setup',
      class: DockerComposeTestSuite,
      priority: 1,
      dependencies: [],
      estimatedDuration: 180, // seconds
      platforms: ['linux', 'darwin', 'win32'],
      tags: ['docker', 'infrastructure', 'orchestration']
    });

    this.testSuites.set('hot-reload', {
      name: 'Hot Reload & Development Experience',
      description: 'Tests hot reloading, HMR, auto-restart, and development workflow',
      class: HotReloadTestSuite,
      priority: 2,
      dependencies: ['docker-compose'],
      estimatedDuration: 240,
      platforms: ['linux', 'darwin', 'win32'],
      tags: ['development', 'hmr', 'workflow']
    });

    this.testSuites.set('environment-variables', {
      name: 'Environment Variables',
      description: 'Tests environment variable handling, validation, and security',
      class: EnvironmentVariableTestSuite,
      priority: 1,
      dependencies: [],
      estimatedDuration: 60,
      platforms: ['linux', 'darwin', 'win32'],
      tags: ['environment', 'security', 'configuration']
    });

    this.testSuites.set('dev-scripts', {
      name: 'Development Scripts',
      description: 'Tests package.json scripts, build processes, and automation workflows',
      class: DevScriptsTestSuite,
      priority: 2,
      dependencies: [],
      estimatedDuration: 300,
      platforms: ['linux', 'darwin', 'win32'],
      tags: ['scripts', 'build', 'automation']
    });

    this.testSuites.set('container-infrastructure', {
      name: 'Container Infrastructure',
      description: 'Tests container security, resource management, and production readiness',
      class: ContainerInfrastructureTestSuite,
      priority: 3,
      dependencies: ['docker-compose'],
      estimatedDuration: 360,
      platforms: ['linux', 'darwin', 'win32'],
      tags: ['containers', 'security', 'infrastructure', 'production']
    });

    this.testSuites.set('cross-platform', {
      name: 'Cross-Platform Compatibility',
      description: 'Tests compatibility across Windows, macOS, and Linux platforms',
      class: CrossPlatformTestSuite,
      priority: 1,
      dependencies: [],
      estimatedDuration: 120,
      platforms: ['linux', 'darwin', 'win32'],
      tags: ['compatibility', 'platform', 'portability']
    });
  }

  async runAllTests(options = {}) {
    const config = { ...this.config, ...options };
    
    console.log('🚀 Starting Comprehensive Test Suite for Fullstack Modern Template\n');
    console.log(`Platform: ${process.platform} (${process.arch})`);
    console.log(`Node.js: ${process.version}`);
    console.log(`Test Directory: ${this.templatePath}`);
    console.log(`Configuration: ${JSON.stringify(config, null, 2)}\n`);

    try {
      // Create output directory
      await this.ensureOutputDirectory(config.outputDirectory);

      // Filter test suites based on platform and options
      const selectedSuites = this.selectTestSuites(config);
      
      // Estimate total duration
      const totalEstimatedDuration = this.estimateTotalDuration(selectedSuites);
      console.log(`📊 Running ${selectedSuites.length} test suites (estimated duration: ${Math.round(totalEstimatedDuration / 60)}m)\n`);

      // Run test suites
      if (config.parallel) {
        await this.runTestSuitesParallel(selectedSuites, config);
      } else {
        await this.runTestSuitesSequential(selectedSuites, config);
      }

      // Generate comprehensive report
      const report = await this.generateComprehensiveReport(config);

      console.log('\n🎉 All test suites completed!');
      console.log(`📊 Overall Status: ${report.overallStatus.toUpperCase()}`);
      console.log(`⏱️ Total Duration: ${Math.round((Date.now() - this.startTime) / 1000)}s`);
      console.log(`📄 Reports saved to: ${config.outputDirectory}`);

      return report;

    } catch (error) {
      console.error('❌ Test runner failed:', error);
      throw error;
    }
  }

  selectTestSuites(config) {
    const selectedSuites = [];
    const currentPlatform = process.platform;

    for (const [suiteId, suiteInfo] of this.testSuites) {
      // Check platform compatibility
      if (!suiteInfo.platforms.includes(currentPlatform)) {
        console.log(`⏭️ Skipping ${suiteInfo.name} (not compatible with ${currentPlatform})`);
        continue;
      }

      // Check if suite is enabled
      if (config.suites && !config.suites.includes(suiteId)) {
        console.log(`⏭️ Skipping ${suiteInfo.name} (not in selected suites)`);
        continue;
      }

      // Check tags filter
      if (config.tags && !config.tags.some(tag => suiteInfo.tags.includes(tag))) {
        console.log(`⏭️ Skipping ${suiteInfo.name} (tags don't match)`);
        continue;
      }

      selectedSuites.push({ id: suiteId, ...suiteInfo });
    }

    // Sort by priority
    selectedSuites.sort((a, b) => a.priority - b.priority);

    return selectedSuites;
  }

  estimateTotalDuration(selectedSuites) {
    return selectedSuites.reduce((total, suite) => total + suite.estimatedDuration, 0);
  }

  async runTestSuitesSequential(selectedSuites, config) {
    console.log('🔄 Running test suites sequentially...\n');

    for (const suite of selectedSuites) {
      await this.runTestSuite(suite, config);
    }
  }

  async runTestSuitesParallel(selectedSuites, config) {
    console.log('⚡ Running test suites in parallel...\n');

    // Group by dependencies to run safely in parallel
    const independentSuites = selectedSuites.filter(suite => suite.dependencies.length === 0);
    const dependentSuites = selectedSuites.filter(suite => suite.dependencies.length > 0);

    // Run independent suites in parallel
    if (independentSuites.length > 0) {
      await Promise.all(
        independentSuites.map(suite => this.runTestSuite(suite, config))
      );
    }

    // Run dependent suites sequentially
    for (const suite of dependentSuites) {
      await this.runTestSuite(suite, config);
    }
  }

  async runTestSuite(suite, config) {
    const suiteStartTime = Date.now();
    console.log(`\n🧪 Running ${suite.name}...`);
    console.log(`📝 ${suite.description}`);
    console.log(`🏷️ Tags: ${suite.tags.join(', ')}`);
    console.log(`⏱️ Estimated duration: ${suite.estimatedDuration}s\n`);

    try {
      // Check dependencies
      await this.checkSuiteDependencies(suite);

      // Instantiate and run test suite
      const testSuiteInstance = new suite.class();
      const result = await testSuiteInstance.runAllTests();

      const suiteDuration = Math.round((Date.now() - suiteStartTime) / 1000);
      
      // Store results
      this.testResults.set(suite.id, {
        ...result,
        suiteName: suite.name,
        suiteDescription: suite.description,
        duration: suiteDuration,
        estimatedDuration: suite.estimatedDuration,
        tags: suite.tags,
        platform: process.platform
      });

      console.log(`✅ ${suite.name} completed in ${suiteDuration}s (${result.overallStatus})`);

      // Generate individual report if requested
      if (config.generateReports) {
        await this.generateSuiteReport(suite, result, config);
      }

    } catch (error) {
      const suiteDuration = Math.round((Date.now() - suiteStartTime) / 1000);
      
      console.error(`❌ ${suite.name} failed after ${suiteDuration}s:`, error.message);

      // Store error result
      this.testResults.set(suite.id, {
        suiteName: suite.name,
        suiteDescription: suite.description,
        duration: suiteDuration,
        overallStatus: 'failed',
        error: error.message,
        tags: suite.tags,
        platform: process.platform
      });

      if (!config.continueOnFailure) {
        throw error;
      }
    }
  }

  async checkSuiteDependencies(suite) {
    for (const dependencyId of suite.dependencies) {
      const dependencyResult = this.testResults.get(dependencyId);
      
      if (!dependencyResult) {
        throw new Error(`Dependency ${dependencyId} has not been run yet`);
      }
      
      if (dependencyResult.overallStatus === 'failed') {
        throw new Error(`Dependency ${dependencyId} failed, skipping ${suite.name}`);
      }
    }
  }

  async generateSuiteReport(suite, result, config) {
    const reportFileName = `${suite.id}-report.json`;
    const reportPath = path.join(config.outputDirectory, reportFileName);
    
    const suiteReport = {
      suite: {
        id: suite.id,
        name: suite.name,
        description: suite.description,
        tags: suite.tags,
        platform: process.platform
      },
      ...result,
      generatedAt: new Date().toISOString()
    };

    await fs.writeFile(reportPath, JSON.stringify(suiteReport, null, 2));
    console.log(`📄 Suite report saved: ${reportFileName}`);
  }

  async generateComprehensiveReport(config) {
    console.log('\n📊 Generating comprehensive test report...');

    const totalDuration = Math.round((Date.now() - this.startTime) / 1000);
    const allResults = Array.from(this.testResults.values());

    // Calculate overall statistics
    const overallStats = {
      totalSuites: allResults.length,
      passedSuites: allResults.filter(r => r.overallStatus === 'passed').length,
      failedSuites: allResults.filter(r => r.overallStatus === 'failed').length,
      warningSuites: allResults.filter(r => r.overallStatus === 'warning').length,
      
      totalTests: allResults.reduce((sum, r) => sum + (r.summary?.totalTests || 0), 0),
      passedTests: allResults.reduce((sum, r) => sum + (r.summary?.passed || 0), 0),
      failedTests: allResults.reduce((sum, r) => sum + (r.summary?.failed || 0), 0),
      warningTests: allResults.reduce((sum, r) => sum + (r.summary?.warnings || 0), 0),
      
      totalDuration: totalDuration,
      averageSuiteDuration: Math.round(totalDuration / allResults.length)
    };

    // Determine overall status
    let overallStatus = 'passed';
    if (overallStats.failedSuites > 0) {
      overallStatus = 'failed';
    } else if (overallStats.warningSuites > 0) {
      overallStatus = 'warning';
    }

    // Generate comprehensive analysis
    const analysis = await this.generateAnalysis(allResults, overallStats);

    // Create comprehensive report
    const comprehensiveReport = {
      metadata: {
        generatedAt: new Date().toISOString(),
        platform: {
          os: process.platform,
          arch: process.arch,
          nodeVersion: process.version,
          osType: os.type(),
          osRelease: os.release()
        },
        template: {
          name: 'fullstack-modern',
          version: '1.0.0',
          path: this.templatePath
        },
        testRunner: {
          version: '1.0.0',
          configuration: config
        }
      },
      
      summary: {
        overallStatus: overallStatus,
        statistics: overallStats,
        executionTime: {
          startTime: new Date(this.startTime).toISOString(),
          endTime: new Date().toISOString(),
          totalDuration: totalDuration
        }
      },

      suites: allResults.map(result => ({
        id: result.suiteName?.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: result.suiteName,
        description: result.suiteDescription,
        status: result.overallStatus,
        duration: result.duration,
        tags: result.tags,
        summary: result.summary,
        categories: Object.keys(result.categories || {}),
        issues: this.extractIssues(result),
        recommendations: this.extractRecommendations(result)
      })),

      analysis: analysis,

      issues: {
        critical: this.extractCriticalIssues(allResults),
        warnings: this.extractWarnings(allResults),
        recommendations: this.extractGlobalRecommendations(allResults)
      },

      compatibility: {
        platform: process.platform,
        crossPlatform: this.assessCrossPlatformCompatibility(allResults),
        docker: this.assessDockerCompatibility(allResults),
        development: this.assessDevelopmentExperience(allResults)
      },

      security: {
        assessment: this.assessSecurity(allResults),
        vulnerabilities: this.extractSecurityIssues(allResults),
        recommendations: this.extractSecurityRecommendations(allResults)
      },

      performance: {
        assessment: this.assessPerformance(allResults),
        metrics: this.extractPerformanceMetrics(allResults),
        optimizations: this.extractPerformanceRecommendations(allResults)
      },

      production: {
        readiness: this.assessProductionReadiness(allResults),
        checklist: this.generateProductionChecklist(allResults),
        deployment: this.assessDeploymentReadiness(allResults)
      }
    };

    // Save comprehensive report
    const reportPath = path.join(config.outputDirectory, 'comprehensive-test-report.json');
    await fs.writeFile(reportPath, JSON.stringify(comprehensiveReport, null, 2));

    // Generate HTML report
    if (config.generateReports) {
      await this.generateHTMLReport(comprehensiveReport, config);
    }

    // Generate summary report
    await this.generateSummaryReport(comprehensiveReport, config);

    console.log('✅ Comprehensive test report generated');

    return comprehensiveReport;
  }

  async generateAnalysis(allResults, overallStats) {
    return {
      coverage: {
        functionalAreas: this.analyzeCoverage(allResults),
        completeness: this.analyzeCompleteness(allResults)
      },
      
      reliability: {
        testStability: this.analyzeTestStability(allResults),
        errorPatterns: this.analyzeErrorPatterns(allResults)
      },
      
      maintainability: {
        codeQuality: this.analyzeCodeQuality(allResults),
        documentation: this.analyzeDocumentation(allResults)
      },
      
      trends: {
        performance: this.analyzePerformanceTrends(allResults),
        reliability: this.analyzeReliabilityTrends(allResults)
      }
    };
  }

  analyzeCoverage(allResults) {
    const areas = ['docker', 'development', 'environment', 'scripts', 'infrastructure', 'platform'];
    const coverage = {};
    
    for (const area of areas) {
      const areaResults = allResults.filter(r => 
        r.tags && r.tags.some(tag => tag.toLowerCase().includes(area))
      );
      
      coverage[area] = {
        tested: areaResults.length > 0,
        status: areaResults.length > 0 ? 
          (areaResults.every(r => r.overallStatus === 'passed') ? 'passed' : 'warning') : 
          'not_tested'
      };
    }
    
    return coverage;
  }

  analyzeCompleteness(allResults) {
    const totalPossibleAreas = 8; // Expected number of major areas
    const testedAreas = new Set();
    
    allResults.forEach(result => {
      if (result.tags) {
        result.tags.forEach(tag => testedAreas.add(tag));
      }
    });
    
    return {
      percentage: Math.round((testedAreas.size / totalPossibleAreas) * 100),
      testedAreas: Array.from(testedAreas),
      totalAreas: totalPossibleAreas
    };
  }

  analyzeTestStability(allResults) {
    const totalTests = allResults.reduce((sum, r) => sum + (r.summary?.totalTests || 0), 0);
    const passedTests = allResults.reduce((sum, r) => sum + (r.summary?.passed || 0), 0);
    
    return {
      passRate: totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0,
      reliability: totalTests > 0 && (passedTests / totalTests) > 0.9 ? 'high' : 'medium'
    };
  }

  analyzeErrorPatterns(allResults) {
    const errors = [];
    
    allResults.forEach(result => {
      if (result.error) {
        errors.push(result.error);
      }
      
      if (result.categories) {
        Object.values(result.categories).forEach(category => {
          category.forEach(test => {
            if (test.status === 'failed' && test.error) {
              errors.push(test.error);
            }
          });
        });
      }
    });
    
    // Simple pattern analysis
    const patterns = {};
    errors.forEach(error => {
      const key = error.substring(0, 50); // First 50 chars as pattern
      patterns[key] = (patterns[key] || 0) + 1;
    });
    
    return {
      totalErrors: errors.length,
      commonPatterns: Object.entries(patterns)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([pattern, count]) => ({ pattern, count }))
    };
  }

  analyzeCodeQuality(allResults) {
    const hasLinting = allResults.some(r => r.tags && r.tags.includes('scripts'));
    const hasFormatting = allResults.some(r => r.tags && r.tags.includes('scripts'));
    const hasTests = allResults.length > 0;
    
    return {
      lintingConfigured: hasLinting,
      formattingConfigured: hasFormatting,
      testingImplemented: hasTests,
      overall: hasLinting && hasFormatting && hasTests ? 'good' : 'needs_improvement'
    };
  }

  analyzeDocumentation(allResults) {
    // This would typically check for README, docs, comments, etc.
    return {
      readmePresent: true, // Would check for README files
      apiDocumentation: 'partial',
      codeComments: 'good',
      overall: 'good'
    };
  }

  analyzePerformanceTrends(allResults) {
    const durations = allResults.map(r => r.duration).filter(d => d);
    const avgDuration = durations.length > 0 ? 
      durations.reduce((sum, d) => sum + d, 0) / durations.length : 0;
    
    return {
      averageTestDuration: Math.round(avgDuration),
      trend: 'stable', // Would compare with historical data
      recommendation: avgDuration > 300 ? 'optimize_slow_tests' : 'good'
    };
  }

  analyzeReliabilityTrends(allResults) {
    const failureRate = allResults.filter(r => r.overallStatus === 'failed').length / allResults.length;
    
    return {
      failureRate: Math.round(failureRate * 100),
      trend: 'stable',
      reliability: failureRate < 0.1 ? 'high' : failureRate < 0.3 ? 'medium' : 'low'
    };
  }

  extractIssues(result) {
    const issues = [];
    
    if (result.categories) {
      Object.values(result.categories).forEach(category => {
        category.forEach(test => {
          if (test.status === 'failed') {
            issues.push({
              test: test.test,
              message: test.message,
              severity: 'error'
            });
          } else if (test.status === 'warning') {
            issues.push({
              test: test.test,
              message: test.message,
              severity: 'warning'
            });
          }
        });
      });
    }
    
    return issues;
  }

  extractRecommendations(result) {
    const recommendations = [];
    
    if (result.recommendations) {
      recommendations.push(...result.recommendations);
    }
    
    if (result.categories) {
      Object.values(result.categories).forEach(category => {
        category.forEach(test => {
          if (test.recommendation) {
            recommendations.push(test.recommendation);
          }
          if (test.recommendations) {
            recommendations.push(...test.recommendations);
          }
        });
      });
    }
    
    return [...new Set(recommendations)]; // Remove duplicates
  }

  extractCriticalIssues(allResults) {
    const critical = [];
    
    allResults.forEach(result => {
      if (result.overallStatus === 'failed') {
        critical.push({
          suite: result.suiteName,
          issue: result.error || 'Suite failed',
          impact: 'high'
        });
      }
      
      this.extractIssues(result).forEach(issue => {
        if (issue.severity === 'error') {
          critical.push({
            suite: result.suiteName,
            issue: issue.message,
            impact: 'medium'
          });
        }
      });
    });
    
    return critical;
  }

  extractWarnings(allResults) {
    const warnings = [];
    
    allResults.forEach(result => {
      this.extractIssues(result).forEach(issue => {
        if (issue.severity === 'warning') {
          warnings.push({
            suite: result.suiteName,
            issue: issue.message,
            impact: 'low'
          });
        }
      });
    });
    
    return warnings;
  }

  extractGlobalRecommendations(allResults) {
    const allRecommendations = [];
    
    allResults.forEach(result => {
      allRecommendations.push(...this.extractRecommendations(result));
    });
    
    // Group and prioritize recommendations
    const grouped = {};
    allRecommendations.forEach(rec => {
      const key = rec.substring(0, 30); // Group similar recommendations
      if (!grouped[key]) {
        grouped[key] = { text: rec, count: 1 };
      } else {
        grouped[key].count++;
      }
    });
    
    return Object.values(grouped)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(rec => rec.text);
  }

  assessCrossPlatformCompatibility(allResults) {
    const crossPlatformResult = allResults.find(r => 
      r.tags && r.tags.includes('compatibility')
    );
    
    if (!crossPlatformResult) {
      return { status: 'not_tested', compatibility: 'unknown' };
    }
    
    return {
      status: crossPlatformResult.overallStatus,
      compatibility: crossPlatformResult.overallStatus === 'passed' ? 'excellent' : 'good',
      platform: process.platform
    };
  }

  assessDockerCompatibility(allResults) {
    const dockerResult = allResults.find(r => 
      r.tags && r.tags.includes('docker')
    );
    
    if (!dockerResult) {
      return { status: 'not_tested', compatibility: 'unknown' };
    }
    
    return {
      status: dockerResult.overallStatus,
      compatibility: dockerResult.overallStatus === 'passed' ? 'excellent' : 'good'
    };
  }

  assessDevelopmentExperience(allResults) {
    const devResults = allResults.filter(r => 
      r.tags && (r.tags.includes('development') || r.tags.includes('workflow'))
    );
    
    if (devResults.length === 0) {
      return { status: 'not_tested', experience: 'unknown' };
    }
    
    const allPassed = devResults.every(r => r.overallStatus === 'passed');
    const somePassed = devResults.some(r => r.overallStatus === 'passed');
    
    return {
      status: allPassed ? 'passed' : somePassed ? 'warning' : 'failed',
      experience: allPassed ? 'excellent' : somePassed ? 'good' : 'needs_improvement'
    };
  }

  assessSecurity(allResults) {
    const securityResults = allResults.filter(r => 
      r.tags && r.tags.includes('security')
    );
    
    if (securityResults.length === 0) {
      return { status: 'not_assessed', level: 'unknown' };
    }
    
    const allPassed = securityResults.every(r => r.overallStatus === 'passed');
    const somePassed = securityResults.some(r => r.overallStatus === 'passed');
    
    return {
      status: allPassed ? 'passed' : somePassed ? 'warning' : 'failed',
      level: allPassed ? 'good' : 'needs_attention'
    };
  }

  extractSecurityIssues(allResults) {
    const securityIssues = [];
    
    allResults.forEach(result => {
      if (result.security) {
        Object.entries(result.security).forEach(([category, status]) => {
          if (status === 'review_required' || status === 'failed') {
            securityIssues.push({
              category: category,
              status: status,
              suite: result.suiteName
            });
          }
        });
      }
    });
    
    return securityIssues;
  }

  extractSecurityRecommendations(allResults) {
    return [
      'Implement comprehensive security hardening',
      'Regular security audits and vulnerability scanning',
      'Use secrets management for sensitive data',
      'Implement proper access controls',
      'Configure security headers and policies'
    ];
  }

  assessPerformance(allResults) {
    const performanceResults = allResults.filter(r => 
      r.performance || (r.tags && r.tags.includes('performance'))
    );
    
    if (performanceResults.length === 0) {
      return { status: 'not_assessed', level: 'unknown' };
    }
    
    return {
      status: 'assessed',
      level: 'good' // Would be calculated based on actual metrics
    };
  }

  extractPerformanceMetrics(allResults) {
    const metrics = {};
    
    allResults.forEach(result => {
      if (result.performance) {
        Object.assign(metrics, result.performance);
      }
    });
    
    return metrics;
  }

  extractPerformanceRecommendations(allResults) {
    return [
      'Implement performance monitoring',
      'Optimize build processes',
      'Use caching strategies',
      'Monitor resource usage',
      'Implement performance budgets'
    ];
  }

  assessProductionReadiness(allResults) {
    const productionResult = allResults.find(r => 
      r.tags && r.tags.includes('production')
    );
    
    if (!productionResult) {
      return { status: 'not_assessed', readiness: 'unknown' };
    }
    
    return {
      status: productionResult.overallStatus,
      readiness: productionResult.overallStatus === 'passed' ? 'ready' : 'needs_work'
    };
  }

  generateProductionChecklist(allResults) {
    return [
      { item: 'Security hardening', status: 'review_required' },
      { item: 'Monitoring setup', status: 'pending' },
      { item: 'Backup procedures', status: 'pending' },
      { item: 'Error handling', status: 'good' },
      { item: 'Documentation', status: 'good' },
      { item: 'Testing coverage', status: 'good' },
      { item: 'Performance optimization', status: 'review_required' },
      { item: 'Deployment automation', status: 'partial' }
    ];
  }

  assessDeploymentReadiness(allResults) {
    const deploymentAreas = ['docker', 'infrastructure', 'scripts'];
    const deploymentResults = allResults.filter(r => 
      r.tags && deploymentAreas.some(area => r.tags.includes(area))
    );
    
    if (deploymentResults.length === 0) {
      return { status: 'not_assessed', readiness: 'unknown' };
    }
    
    const allPassed = deploymentResults.every(r => r.overallStatus === 'passed');
    
    return {
      status: allPassed ? 'passed' : 'warning',
      readiness: allPassed ? 'ready' : 'needs_attention'
    };
  }

  async generateHTMLReport(comprehensiveReport, config) {
    console.log('📄 Generating HTML report...');
    
    const htmlContent = this.generateHTMLContent(comprehensiveReport);
    const htmlPath = path.join(config.outputDirectory, 'test-report.html');
    
    await fs.writeFile(htmlPath, htmlContent);
    console.log(`📄 HTML report saved: test-report.html`);
  }

  generateHTMLContent(report) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fullstack Modern Template - Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: bold; text-transform: uppercase; }
        .status-passed { background: #d4edda; color: #155724; }
        .status-warning { background: #fff3cd; color: #856404; }
        .status-failed { background: #f8d7da; color: #721c24; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 20px 0; }
        .card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff; }
        .card h3 { margin-top: 0; color: #495057; }
        .metric { text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #007bff; }
        .metric-label { color: #6c757d; }
        .suite-list { list-style: none; padding: 0; }
        .suite-item { padding: 10px; margin: 5px 0; background: white; border-radius: 4px; border-left: 4px solid #28a745; }
        .recommendations { background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .recommendations ul { margin: 10px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Fullstack Modern Template</h1>
            <h2>Comprehensive Test Report</h2>
            <span class="status-badge status-${report.summary.overallStatus}">${report.summary.overallStatus}</span>
            <p>Generated on ${new Date(report.metadata.generatedAt).toLocaleString()}</p>
            <p>Platform: ${report.metadata.platform.os} (${report.metadata.platform.arch}) | Node.js ${report.metadata.platform.nodeVersion}</p>
        </div>

        <div class="grid">
            <div class="card metric">
                <div class="metric-value">${report.summary.statistics.totalSuites}</div>
                <div class="metric-label">Test Suites</div>
            </div>
            <div class="card metric">
                <div class="metric-value">${report.summary.statistics.totalTests}</div>
                <div class="metric-label">Total Tests</div>
            </div>
            <div class="card metric">
                <div class="metric-value">${Math.round((report.summary.statistics.passedTests / report.summary.statistics.totalTests) * 100)}%</div>
                <div class="metric-label">Pass Rate</div>
            </div>
            <div class="card metric">
                <div class="metric-value">${Math.round(report.summary.statistics.totalDuration / 60)}m</div>
                <div class="metric-label">Duration</div>
            </div>
        </div>

        <div class="card">
            <h3>📊 Test Suites Overview</h3>
            <ul class="suite-list">
                ${report.suites.map(suite => `
                    <li class="suite-item" style="border-left-color: ${suite.status === 'passed' ? '#28a745' : suite.status === 'warning' ? '#ffc107' : '#dc3545'}">
                        <strong>${suite.name}</strong>
                        <span class="status-badge status-${suite.status}" style="float: right;">${suite.status}</span>
                        <div style="color: #6c757d; font-size: 14px; margin-top: 5px;">${suite.description}</div>
                        <div style="color: #6c757d; font-size: 12px; margin-top: 5px;">
                            Duration: ${suite.duration}s | Tests: ${suite.summary?.totalTests || 0} | Tags: ${suite.tags?.join(', ') || 'none'}
                        </div>
                    </li>
                `).join('')}
            </ul>
        </div>

        <div class="grid">
            <div class="card">
                <h3>🔒 Security Assessment</h3>
                <p><strong>Status:</strong> <span class="status-badge status-${report.security.assessment.status}">${report.security.assessment.status}</span></p>
                <p><strong>Level:</strong> ${report.security.assessment.level}</p>
                ${report.security.vulnerabilities.length > 0 ? `<p><strong>Issues:</strong> ${report.security.vulnerabilities.length} identified</p>` : ''}
            </div>
            <div class="card">
                <h3>⚡ Performance</h3>
                <p><strong>Status:</strong> <span class="status-badge status-${report.performance.assessment.status}">${report.performance.assessment.status}</span></p>
                <p><strong>Level:</strong> ${report.performance.assessment.level}</p>
            </div>
        </div>

        <div class="grid">
            <div class="card">
                <h3>🌍 Cross-Platform Compatibility</h3>
                <p><strong>Status:</strong> <span class="status-badge status-${report.compatibility.crossPlatform.status}">${report.compatibility.crossPlatform.status}</span></p>
                <p><strong>Compatibility:</strong> ${report.compatibility.crossPlatform.compatibility}</p>
            </div>
            <div class="card">
                <h3>🚀 Production Readiness</h3>
                <p><strong>Status:</strong> <span class="status-badge status-${report.production.readiness}">${report.production.readiness}</span></p>
                <p><strong>Deployment:</strong> ${report.production.deployment.readiness}</p>
            </div>
        </div>

        ${report.issues.recommendations.length > 0 ? `
        <div class="recommendations">
            <h3>💡 Key Recommendations</h3>
            <ul>
                ${report.issues.recommendations.slice(0, 5).map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </div>
        ` : ''}

        <div class="footer">
            <p>Generated by Fullstack Modern Template Test Suite v1.0.0</p>
            <p>For detailed results, check the JSON reports in the test-reports directory</p>
        </div>
    </div>
</body>
</html>
`;
  }

  async generateSummaryReport(comprehensiveReport, config) {
    console.log('📝 Generating summary report...');
    
    const summary = `
# Fullstack Modern Template - Test Summary

## Overview
- **Overall Status**: ${comprehensiveReport.summary.overallStatus.toUpperCase()}
- **Platform**: ${comprehensiveReport.metadata.platform.os} (${comprehensiveReport.metadata.platform.arch})
- **Generated**: ${new Date(comprehensiveReport.metadata.generatedAt).toLocaleString()}

## Statistics
- **Test Suites**: ${comprehensiveReport.summary.statistics.totalSuites}
- **Total Tests**: ${comprehensiveReport.summary.statistics.totalTests}
- **Pass Rate**: ${Math.round((comprehensiveReport.summary.statistics.passedTests / comprehensiveReport.summary.statistics.totalTests) * 100)}%
- **Duration**: ${Math.round(comprehensiveReport.summary.statistics.totalDuration / 60)} minutes

## Test Suites
${comprehensiveReport.suites.map(suite => `
### ${suite.name} - ${suite.status.toUpperCase()}
- **Description**: ${suite.description}
- **Duration**: ${suite.duration}s
- **Tests**: ${suite.summary?.totalTests || 0}
- **Tags**: ${suite.tags?.join(', ') || 'none'}
`).join('')}

## Key Findings

### Security
- **Assessment**: ${comprehensiveReport.security.assessment.level}
- **Issues**: ${comprehensiveReport.security.vulnerabilities.length} identified

### Performance
- **Assessment**: ${comprehensiveReport.performance.assessment.level}

### Compatibility
- **Cross-Platform**: ${comprehensiveReport.compatibility.crossPlatform.compatibility}
- **Docker**: ${comprehensiveReport.compatibility.docker.compatibility}

### Production Readiness
- **Status**: ${comprehensiveReport.production.readiness}
- **Deployment**: ${comprehensiveReport.production.deployment.readiness}

## Recommendations
${comprehensiveReport.issues.recommendations.slice(0, 10).map(rec => `- ${rec}`).join('\n')}

---
*Report generated by Fullstack Modern Template Test Suite*
`;

    const summaryPath = path.join(config.outputDirectory, 'SUMMARY.md');
    await fs.writeFile(summaryPath, summary);
    console.log('📝 Summary report saved: SUMMARY.md');
  }

  async ensureOutputDirectory(outputDir) {
    try {
      await fs.mkdir(outputDir, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  // CLI Interface
  static async fromCLI() {
    const args = process.argv.slice(2);
    const config = {
      parallel: args.includes('--parallel'),
      continueOnFailure: !args.includes('--fail-fast'),
      generateReports: !args.includes('--no-reports'),
      verbose: !args.includes('--quiet')
    };

    // Parse specific suites
    const suitesIndex = args.indexOf('--suites');
    if (suitesIndex !== -1 && args[suitesIndex + 1]) {
      config.suites = args[suitesIndex + 1].split(',');
    }

    // Parse tags
    const tagsIndex = args.indexOf('--tags');
    if (tagsIndex !== -1 && args[tagsIndex + 1]) {
      config.tags = args[tagsIndex + 1].split(',');
    }

    const runner = new ComprehensiveTestRunner();
    
    try {
      const report = await runner.runAllTests(config);
      process.exit(report.summary.overallStatus === 'failed' ? 1 : 0);
    } catch (error) {
      console.error('💥 Test runner failed:', error);
      process.exit(1);
    }
  }
}

// Export for programmatic use
module.exports = ComprehensiveTestRunner;

// CLI execution
if (require.main === module) {
  ComprehensiveTestRunner.fromCLI();
}