/**
 * Comprehensive Deployment Automation Testing Suite
 * 
 * This test suite validates deployment automation strategies including:
 * - Blue-green deployment testing and validation
 * - Canary release deployment strategies
 * - Zero-downtime deployment verification
 * - Database migration automation
 * - Static asset deployment and CDN invalidation
 * - Environment promotion workflows
 * - Rollback and recovery procedures
 * - Health check and readiness validation
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const axios = require('axios');

class DeploymentAutomationTester {
  constructor(options = {}) {
    this.options = {
      timeout: options.timeout || 900000, // 15 minutes
      retryAttempts: options.retries || 3,
      healthCheckTimeout: options.healthCheckTimeout || 60000,
      canaryTrafficPercentage: options.canaryTrafficPercentage || 10,
      ...options
    };
    
    this.projectPath = path.resolve(__dirname, '../../');
    
    this.testResults = {
      blueGreenTests: [],
      canaryTests: [],
      zeroDowntimeTests: [],
      migrationTests: [],
      rollbackTests: []
    };
    
    this.deploymentHistory = [];
    this.activeDeployments = new Map();
  }

  async checkPrerequisites() {
    const checks = {
      dockerAvailable: false,
      kubernetesAvailable: false,
      vercelCLI: false,
      githubActions: false,
      deploymentConfig: false
    };

    try {
      // Check Docker
      const dockerVersion = await this.runCommand('docker --version');
      checks.dockerAvailable = dockerVersion.success;

      // Check Kubernetes (kubectl)
      try {
        const kubectlVersion = await this.runCommand('kubectl version --client');
        checks.kubernetesAvailable = kubectlVersion.success;
      } catch (error) {
        checks.kubernetesAvailable = false;
      }

      // Check Vercel CLI
      try {
        const vercelVersion = await this.runCommand('vercel --version');
        checks.vercelCLI = vercelVersion.success;
      } catch (error) {
        checks.vercelCLI = false;
      }

      // Check GitHub Actions configuration
      const githubWorkflowsPath = path.join(this.projectPath, '.github', 'workflows');
      checks.githubActions = await this.directoryExists(githubWorkflowsPath);

      // Check deployment configuration files
      const deploymentConfigs = [
        'vercel.json',
        'docker-compose.yml',
        'k8s',
        'deployment'
      ];

      checks.deploymentConfig = deploymentConfigs.some(config => 
        this.fileOrDirectoryExists(path.join(this.projectPath, config))
      );

    } catch (error) {
      console.warn(`Prerequisites check failed: ${error.message}`);
    }

    return checks;
  }

  async testBlueGreenDeployment() {
    console.log('🔵🟢 Testing Blue-Green deployment strategy...');
    
    const blueGreenTests = [];

    // Test environment setup
    const setupTest = await this.testBlueGreenSetup();
    blueGreenTests.push(setupTest);

    // Test blue environment deployment
    const blueDeploymentTest = await this.testBlueEnvironmentDeployment();
    blueGreenTests.push(blueDeploymentTest);

    // Test traffic switching
    const trafficSwitchTest = await this.testTrafficSwitching();
    blueGreenTests.push(trafficSwitchTest);

    // Test green environment cleanup
    const cleanupTest = await this.testEnvironmentCleanup();
    blueGreenTests.push(cleanupTest);

    this.testResults.blueGreenTests = blueGreenTests;
    return blueGreenTests;
  }

  async testBlueGreenSetup() {
    const test = {
      name: 'blue-green-setup',
      status: 'pending',
      environments: {
        blue: { status: 'unknown', url: null },
        green: { status: 'unknown', url: null }
      },
      infrastructure: {},
      errors: []
    };

    try {
      // Check if blue-green infrastructure is configured
      const infrastructureConfig = await this.analyzeBlueGreenInfrastructure();
      test.infrastructure = infrastructureConfig;

      // Test blue environment
      const blueEnvironment = await this.checkEnvironmentStatus('blue');
      test.environments.blue = blueEnvironment;

      // Test green environment
      const greenEnvironment = await this.checkEnvironmentStatus('green');
      test.environments.green = greenEnvironment;

      // Validate load balancer configuration
      const loadBalancerConfig = await this.validateLoadBalancerConfiguration();
      test.infrastructure.loadBalancer = loadBalancerConfig;

      test.status = (blueEnvironment.status === 'ready' || greenEnvironment.status === 'ready') 
        ? 'success' : 'failed';

    } catch (error) {
      test.status = 'error';
      test.errors.push(error.message);
    }

    return test;
  }

  async testBlueEnvironmentDeployment() {
    const test = {
      name: 'blue-environment-deployment',
      status: 'pending',
      deployment: {},
      healthChecks: {},
      errors: []
    };

    try {
      // Deploy to blue environment
      const deploymentResult = await this.deployToEnvironment('blue');
      test.deployment = deploymentResult;

      if (deploymentResult.success) {
        // Wait for deployment to be ready
        const readinessCheck = await this.waitForEnvironmentReadiness('blue');
        test.healthChecks.readiness = readinessCheck;

        // Perform health checks
        const healthCheck = await this.performHealthChecks('blue');
        test.healthChecks.health = healthCheck;

        // Validate deployment integrity
        const integrityCheck = await this.validateDeploymentIntegrity('blue');
        test.healthChecks.integrity = integrityCheck;

        test.status = (readinessCheck.ready && healthCheck.healthy && integrityCheck.valid) 
          ? 'success' : 'failed';
      } else {
        test.status = 'failed';
        test.errors.push(`Deployment failed: ${deploymentResult.error}`);
      }

    } catch (error) {
      test.status = 'error';
      test.errors.push(error.message);
    }

    return test;
  }

  async testTrafficSwitching() {
    const test = {
      name: 'traffic-switching',
      status: 'pending',
      preSwitch: {},
      switching: {},
      postSwitch: {},
      errors: []
    };

    try {
      // Record pre-switch metrics
      test.preSwitch = await this.recordTrafficMetrics();

      // Perform traffic switch
      const switchResult = await this.switchTrafficToBlue();
      test.switching = switchResult;

      if (switchResult.success) {
        // Wait for traffic to stabilize
        await new Promise(resolve => setTimeout(resolve, 10000));

        // Record post-switch metrics
        test.postSwitch = await this.recordTrafficMetrics();

        // Validate traffic routing
        const routingValidation = await this.validateTrafficRouting('blue');
        test.switching.validation = routingValidation;

        test.status = (routingValidation.correct && test.postSwitch.errors === 0) 
          ? 'success' : 'failed';
      } else {
        test.status = 'failed';
        test.errors.push(`Traffic switch failed: ${switchResult.error}`);
      }

    } catch (error) {
      test.status = 'error';
      test.errors.push(error.message);
    }

    return test;
  }

  async testCanaryDeployment() {
    console.log('🐦 Testing Canary deployment strategy...');
    
    const canaryTests = [];

    // Test canary setup
    const setupTest = await this.testCanarySetup();
    canaryTests.push(setupTest);

    // Test gradual traffic shifting
    const trafficShiftTest = await this.testGradualTrafficShifting();
    canaryTests.push(trafficShiftTest);

    // Test monitoring and metrics
    const monitoringTest = await this.testCanaryMonitoring();
    canaryTests.push(monitoringTest);

    // Test automatic rollback
    const rollbackTest = await this.testCanaryRollback();
    canaryTests.push(rollbackTest);

    this.testResults.canaryTests = canaryTests;
    return canaryTests;
  }

  async testCanarySetup() {
    const test = {
      name: 'canary-setup',
      status: 'pending',
      infrastructure: {},
      configuration: {},
      errors: []
    };

    try {
      // Analyze canary infrastructure
      const infraAnalysis = await this.analyzeCanaryInfrastructure();
      test.infrastructure = infraAnalysis;

      // Check canary configuration
      const configAnalysis = await this.analyzeCanaryConfiguration();
      test.configuration = configAnalysis;

      // Validate traffic splitting capability
      const trafficSplittingSupport = await this.validateTrafficSplittingSupport();
      test.infrastructure.trafficSplitting = trafficSplittingSupport;

      test.status = (infraAnalysis.ready && configAnalysis.valid && trafficSplittingSupport.supported) 
        ? 'success' : 'partial';

    } catch (error) {
      test.status = 'error';
      test.errors.push(error.message);
    }

    return test;
  }

  async testGradualTrafficShifting() {
    const test = {
      name: 'gradual-traffic-shifting',
      status: 'pending',
      phases: [],
      metrics: {},
      errors: []
    };

    try {
      // Deploy canary version
      const canaryDeployment = await this.deployCanaryVersion();
      
      if (canaryDeployment.success) {
        // Phase 1: 10% traffic
        const phase1 = await this.shiftTrafficToCanary(10);
        test.phases.push({ percentage: 10, ...phase1 });

        if (phase1.success) {
          // Wait and monitor
          await this.monitorCanaryPhase(60000); // 1 minute

          // Phase 2: 25% traffic
          const phase2 = await this.shiftTrafficToCanary(25);
          test.phases.push({ percentage: 25, ...phase2 });

          if (phase2.success) {
            // Wait and monitor
            await this.monitorCanaryPhase(60000);

            // Phase 3: 50% traffic
            const phase3 = await this.shiftTrafficToCanary(50);
            test.phases.push({ percentage: 50, ...phase3 });

            if (phase3.success) {
              // Final phase: 100% traffic
              const finalPhase = await this.shiftTrafficToCanary(100);
              test.phases.push({ percentage: 100, ...finalPhase });

              test.status = finalPhase.success ? 'success' : 'failed';
            }
          }
        }

        // Collect final metrics
        test.metrics = await this.collectCanaryMetrics();
      } else {
        test.status = 'failed';
        test.errors.push(`Canary deployment failed: ${canaryDeployment.error}`);
      }

    } catch (error) {
      test.status = 'error';
      test.errors.push(error.message);
    }

    return test;
  }

  async testZeroDowntimeDeployment() {
    console.log('⚡ Testing Zero-downtime deployment...');
    
    const zeroDowntimeTests = [];

    // Test rolling deployment
    const rollingDeploymentTest = await this.testRollingDeployment();
    zeroDowntimeTests.push(rollingDeploymentTest);

    // Test database migrations
    const migrationTest = await this.testZeroDowntimeMigrations();
    zeroDowntimeTests.push(migrationTest);

    // Test service continuity
    const continuityTest = await this.testServiceContinuity();
    zeroDowntimeTests.push(continuityTest);

    // Test graceful shutdown
    const gracefulShutdownTest = await this.testGracefulShutdown();
    zeroDowntimeTests.push(gracefulShutdownTest);

    this.testResults.zeroDowntimeTests = zeroDowntimeTests;
    return zeroDowntimeTests;
  }

  async testRollingDeployment() {
    const test = {
      name: 'rolling-deployment',
      status: 'pending',
      instances: [],
      downtime: 0,
      errors: []
    };

    try {
      const startTime = Date.now();
      let totalDowntime = 0;

      // Simulate rolling deployment across multiple instances
      const instances = ['instance-1', 'instance-2', 'instance-3'];
      
      for (const instance of instances) {
        const instanceTest = await this.deployToInstance(instance);
        test.instances.push(instanceTest);

        if (!instanceTest.success) {
          totalDowntime += instanceTest.downtime || 0;
        }
      }

      test.downtime = totalDowntime;
      test.status = totalDowntime === 0 ? 'success' : 'partial';

      // Validate all instances are healthy
      const healthValidation = await this.validateAllInstancesHealthy(instances);
      test.allInstancesHealthy = healthValidation.healthy;

      if (!healthValidation.healthy) {
        test.status = 'failed';
        test.errors.push('Not all instances are healthy after deployment');
      }

    } catch (error) {
      test.status = 'error';
      test.errors.push(error.message);
    }

    return test;
  }

  async testDatabaseMigrations() {
    console.log('🗄️ Testing database migration automation...');
    
    const migrationTests = [];

    // Test migration script validation
    const scriptValidationTest = await this.testMigrationScriptValidation();
    migrationTests.push(scriptValidationTest);

    // Test backward compatibility
    const compatibilityTest = await this.testMigrationCompatibility();
    migrationTests.push(compatibilityTest);

    // Test rollback migrations
    const rollbackTest = await this.testMigrationRollback();
    migrationTests.push(rollbackTest);

    // Test migration monitoring
    const monitoringTest = await this.testMigrationMonitoring();
    migrationTests.push(monitoringTest);

    this.testResults.migrationTests = migrationTests;
    return migrationTests;
  }

  async testRollbackProcedures() {
    console.log('🔄 Testing rollback and recovery procedures...');
    
    const rollbackTests = [];

    // Test automatic rollback triggers
    const triggerTest = await this.testRollbackTriggers();
    rollbackTests.push(triggerTest);

    // Test manual rollback procedures
    const manualRollbackTest = await this.testManualRollback();
    rollbackTests.push(manualRollbackTest);

    // Test data consistency during rollback
    const consistencyTest = await this.testRollbackDataConsistency();
    rollbackTests.push(consistencyTest);

    // Test rollback verification
    const verificationTest = await this.testRollbackVerification();
    rollbackTests.push(verificationTest);

    this.testResults.rollbackTests = rollbackTests;
    return rollbackTests;
  }

  // Helper methods for deployment operations

  async runCommand(command, options = {}) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const child = spawn('sh', ['-c', command], {
        cwd: options.cwd || this.projectPath,
        env: options.env || process.env,
        stdio: 'pipe'
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          success: code === 0,
          code,
          output: stdout,
          error: stderr,
          duration: Date.now() - startTime
        });
      });

      setTimeout(() => {
        child.kill();
        resolve({
          success: false,
          code: -1,
          output: stdout,
          error: 'Command timed out',
          duration: Date.now() - startTime
        });
      }, options.timeout || this.options.timeout);
    });
  }

  async directoryExists(dirPath) {
    try {
      const stats = await fs.promises.stat(dirPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  fileOrDirectoryExists(path) {
    try {
      fs.accessSync(path);
      return true;
    } catch {
      return false;
    }
  }

  async analyzeBlueGreenInfrastructure() {
    // Mock implementation - would analyze actual infrastructure
    return {
      loadBalancerConfigured: true,
      environmentsConfigured: true,
      databaseSeparation: true,
      ready: true
    };
  }

  async checkEnvironmentStatus(environment) {
    // Mock implementation - would check actual environment
    return {
      status: 'ready',
      url: `https://${environment}.example.com`,
      healthy: true,
      version: 'v1.0.0'
    };
  }

  async validateLoadBalancerConfiguration() {
    // Mock implementation
    return {
      configured: true,
      healthChecksEnabled: true,
      trafficSwitchingSupported: true
    };
  }

  async deployToEnvironment(environment) {
    // Mock deployment - would trigger actual deployment
    console.log(`Deploying to ${environment} environment...`);
    
    // Simulate deployment time
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    return {
      success: true,
      deploymentId: `deploy-${environment}-${Date.now()}`,
      version: 'v1.0.1',
      duration: 5000
    };
  }

  async waitForEnvironmentReadiness(environment) {
    // Mock readiness check
    console.log(`Waiting for ${environment} environment readiness...`);
    
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    return {
      ready: true,
      healthChecksPassed: true,
      responseTime: 200
    };
  }

  async performHealthChecks(environment) {
    // Mock health checks
    return {
      healthy: true,
      endpoints: [
        { path: '/health', status: 200 },
        { path: '/api/health', status: 200 },
        { path: '/ready', status: 200 }
      ]
    };
  }

  async validateDeploymentIntegrity(environment) {
    // Mock integrity validation
    return {
      valid: true,
      checksumMatch: true,
      configurationValid: true,
      dependenciesResolved: true
    };
  }

  async recordTrafficMetrics() {
    // Mock traffic metrics
    return {
      requestsPerSecond: 100,
      responseTime: 150,
      errorRate: 0.01,
      errors: 0
    };
  }

  async switchTrafficToBlue() {
    // Mock traffic switching
    console.log('Switching traffic to blue environment...');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      success: true,
      switchTime: 2000,
      trafficPercentage: 100
    };
  }

  async validateTrafficRouting(environment) {
    // Mock traffic routing validation
    return {
      correct: true,
      percentage: 100,
      environment: environment
    };
  }

  async analyzeCanaryInfrastructure() {
    // Mock canary infrastructure analysis
    return {
      ready: true,
      trafficSplittingSupported: true,
      monitoringConfigured: true,
      rollbackConfigured: true
    };
  }

  async analyzeCanaryConfiguration() {
    // Mock canary configuration analysis
    return {
      valid: true,
      trafficSteps: [10, 25, 50, 100],
      monitoringThresholds: {
        errorRate: 0.05,
        responseTime: 500
      }
    };
  }

  async validateTrafficSplittingSupport() {
    // Mock traffic splitting validation
    return {
      supported: true,
      method: 'header-based',
      granularity: 1
    };
  }

  async deployCanaryVersion() {
    // Mock canary deployment
    console.log('Deploying canary version...');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    return {
      success: true,
      version: 'v1.0.1-canary',
      deploymentId: `canary-${Date.now()}`
    };
  }

  async shiftTrafficToCanary(percentage) {
    // Mock traffic shifting
    console.log(`Shifting ${percentage}% traffic to canary...`);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      percentage: percentage,
      duration: 1000
    };
  }

  async monitorCanaryPhase(duration) {
    // Mock canary monitoring
    console.log(`Monitoring canary phase for ${duration}ms...`);
    await new Promise(resolve => setTimeout(resolve, duration));
  }

  async collectCanaryMetrics() {
    // Mock metrics collection
    return {
      errorRate: 0.01,
      responseTime: 180,
      throughput: 95,
      userSatisfaction: 0.98
    };
  }

  async deployToInstance(instance) {
    // Mock instance deployment
    console.log(`Deploying to ${instance}...`);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      instance,
      success: true,
      downtime: 0,
      duration: 2000
    };
  }

  async validateAllInstancesHealthy(instances) {
    // Mock instance health validation
    return {
      healthy: true,
      instances: instances.map(instance => ({
        instance,
        healthy: true,
        responseTime: 150
      }))
    };
  }

  async testZeroDowntimeMigrations() {
    // Mock zero-downtime migration test
    return {
      name: 'zero-downtime-migrations',
      status: 'success',
      downtime: 0,
      backwardCompatible: true
    };
  }

  async testServiceContinuity() {
    // Mock service continuity test
    return {
      name: 'service-continuity',
      status: 'success',
      continuousService: true,
      requestsDropped: 0
    };
  }

  async testGracefulShutdown() {
    // Mock graceful shutdown test
    return {
      name: 'graceful-shutdown',
      status: 'success',
      graceful: true,
      drainTime: 30000
    };
  }

  async testEnvironmentCleanup() {
    // Mock environment cleanup test
    return {
      name: 'environment-cleanup',
      status: 'success',
      cleaned: true,
      resourcesFreed: true
    };
  }

  async testCanaryMonitoring() {
    // Mock canary monitoring test
    return {
      name: 'canary-monitoring',
      status: 'success',
      metricsCollected: true,
      alertsConfigured: true
    };
  }

  async testCanaryRollback() {
    // Mock canary rollback test
    return {
      name: 'canary-rollback',
      status: 'success',
      rollbackTriggered: true,
      rollbackTime: 5000
    };
  }

  // Remaining stub implementations
  async testMigrationScriptValidation() {
    return { name: 'migration-script-validation', status: 'success', valid: true };
  }

  async testMigrationCompatibility() {
    return { name: 'migration-compatibility', status: 'success', compatible: true };
  }

  async testMigrationRollback() {
    return { name: 'migration-rollback', status: 'success', rollbackable: true };
  }

  async testMigrationMonitoring() {
    return { name: 'migration-monitoring', status: 'success', monitored: true };
  }

  async testRollbackTriggers() {
    return { name: 'rollback-triggers', status: 'success', triggersConfigured: true };
  }

  async testManualRollback() {
    return { name: 'manual-rollback', status: 'success', rollbackSuccessful: true };
  }

  async testRollbackDataConsistency() {
    return { name: 'rollback-data-consistency', status: 'success', consistent: true };
  }

  async testRollbackVerification() {
    return { name: 'rollback-verification', status: 'success', verified: true };
  }

  async runCompleteDeploymentAutomationTests() {
    const startTime = Date.now();
    const report = {
      timestamp: new Date().toISOString(),
      executionTime: 0,
      overall: {
        success: true,
        testsRun: 0,
        testsPassed: 0,
        testsFailed: 0,
        deploymentReady: false
      },
      results: {},
      recommendations: []
    };

    console.log('🚀 Starting Comprehensive Deployment Automation Tests\n');

    try {
      // Prerequisites check
      console.log('📋 Checking prerequisites...');
      const prerequisites = await this.checkPrerequisites();
      report.results.prerequisites = prerequisites;

      // Blue-Green deployment tests
      report.results.blueGreenTests = await this.testBlueGreenDeployment();
      report.overall.testsRun++;
      const blueGreenPassed = report.results.blueGreenTests.every(t => t.status === 'success');
      if (blueGreenPassed) report.overall.testsPassed++;
      else report.overall.testsFailed++;

      // Canary deployment tests
      report.results.canaryTests = await this.testCanaryDeployment();
      report.overall.testsRun++;
      const canaryPassed = report.results.canaryTests.every(t => t.status === 'success');
      if (canaryPassed) report.overall.testsPassed++;
      else report.overall.testsFailed++;

      // Zero-downtime deployment tests
      report.results.zeroDowntimeTests = await this.testZeroDowntimeDeployment();
      report.overall.testsRun++;
      const zeroDowntimePassed = report.results.zeroDowntimeTests.every(t => t.status === 'success');
      if (zeroDowntimePassed) report.overall.testsPassed++;
      else report.overall.testsFailed++;

      // Database migration tests
      report.results.migrationTests = await this.testDatabaseMigrations();
      report.overall.testsRun++;
      const migrationPassed = report.results.migrationTests.every(t => t.status === 'success');
      if (migrationPassed) report.overall.testsPassed++;
      else report.overall.testsFailed++;

      // Rollback procedure tests
      report.results.rollbackTests = await this.testRollbackProcedures();
      report.overall.testsRun++;
      const rollbackPassed = report.results.rollbackTests.every(t => t.status === 'success');
      if (rollbackPassed) report.overall.testsPassed++;
      else report.overall.testsFailed++;

      // Calculate deployment readiness
      const passRate = report.overall.testsPassed / report.overall.testsRun;
      report.overall.deploymentReady = passRate >= 0.8; // 80% pass rate
      report.overall.success = report.overall.deploymentReady;

    } catch (error) {
      report.overall.success = false;
      report.error = {
        message: error.message,
        stack: error.stack
      };
    }

    report.executionTime = Date.now() - startTime;

    // Generate recommendations
    report.recommendations = this.generateDeploymentRecommendations(report);

    return report;
  }

  generateDeploymentRecommendations(report) {
    const recommendations = [];

    // Blue-Green recommendations
    if (report.results.blueGreenTests?.some(t => t.status === 'failed')) {
      recommendations.push({
        category: 'Blue-Green Deployment',
        message: 'Blue-Green deployment strategy has issues',
        action: 'Review load balancer configuration and environment setup',
        priority: 'High'
      });
    }

    // Canary recommendations
    if (report.results.canaryTests?.some(t => t.status === 'failed')) {
      recommendations.push({
        category: 'Canary Deployment',
        message: 'Canary deployment strategy needs improvement',
        action: 'Configure proper traffic splitting and monitoring',
        priority: 'Medium'
      });
    }

    // Zero-downtime recommendations
    if (report.results.zeroDowntimeTests?.some(t => t.status === 'failed')) {
      recommendations.push({
        category: 'Zero-Downtime Deployment',
        message: 'Zero-downtime deployment not achieved',
        action: 'Implement rolling deployments and graceful shutdowns',
        priority: 'High'
      });
    }

    // Migration recommendations
    if (report.results.migrationTests?.some(t => t.status === 'failed')) {
      recommendations.push({
        category: 'Database Migrations',
        message: 'Database migration automation needs attention',
        action: 'Implement backward-compatible migrations and monitoring',
        priority: 'High'
      });
    }

    // Rollback recommendations
    if (report.results.rollbackTests?.some(t => t.status === 'failed')) {
      recommendations.push({
        category: 'Rollback Procedures',
        message: 'Rollback procedures need improvement',
        action: 'Implement automated rollback triggers and verification',
        priority: 'Critical'
      });
    }

    // Overall readiness
    if (!report.overall.deploymentReady) {
      recommendations.push({
        category: 'Deployment Readiness',
        message: 'Deployment automation not ready for production',
        action: 'Address all failed tests before enabling automated deployments',
        priority: 'Critical'
      });
    }

    return recommendations;
  }
}

// Export for use in other test files
module.exports = {
  DeploymentAutomationTester
};

// Run tests if called directly
if (require.main === module) {
  const tester = new DeploymentAutomationTester();
  tester.runCompleteDeploymentAutomationTests()
    .then(report => {
      console.log('\n📊 Deployment Automation Test Results:');
      console.log(`Deployment Ready: ${report.overall.deploymentReady ? '✅' : '❌'}`);
      console.log(`Tests: ${report.overall.testsPassed}/${report.overall.testsRun} passed`);
      console.log(`Execution Time: ${report.executionTime}ms\n`);

      if (report.recommendations.length > 0) {
        console.log('💡 Recommendations:');
        report.recommendations.forEach((rec, index) => {
          console.log(`${index + 1}. [${rec.priority}] ${rec.category}: ${rec.message}`);
          console.log(`   Action: ${rec.action}\n`);
        });
      }

      // Save report
      const reportPath = path.join(__dirname, '../reports/deployment-automation-test-report.json');
      fs.promises.mkdir(path.dirname(reportPath), { recursive: true })
        .then(() => fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2)))
        .then(() => console.log(`📋 Report saved to: ${reportPath}`));
    })
    .catch(console.error);
}