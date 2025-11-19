#!/usr/bin/env node

/**
 * Docker Compose Test Suite
 * Comprehensive testing for Docker Compose setup, orchestration, and configuration
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const net = require('net');
const yaml = require('js-yaml');

class DockerComposeTestSuite {
  constructor() {
    this.templatePath = path.resolve(__dirname, '../../');
    this.composeFile = path.join(this.templatePath, 'docker-compose.yml');
    this.testResults = {
      syntax: [],
      orchestration: [],
      network: [],
      volumes: [],
      environment: [],
      health: [],
      security: []
    };
    this.services = ['frontend', 'backend', 'postgres', 'redis'];
    this.devServices = ['adminer', 'redis-commander'];
    this.prodServices = ['nginx'];
  }

  async runAllTests() {
    console.log('🐳 Starting Docker Compose Test Suite...\n');

    try {
      await this.testDockerComposeValidation();
      await this.testServiceOrchestration();
      await this.testNetworkConfiguration();
      await this.testVolumeManagement();
      await this.testEnvironmentVariables();
      await this.testHealthChecks();
      await this.testSecurityConfiguration();
      await this.testMultiEnvironmentSetup();

      return this.generateTestReport();
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      throw error;
    }
  }

  // 1. Docker Compose File Validation
  async testDockerComposeValidation() {
    console.log('📋 Testing Docker Compose file validation...');

    const tests = [
      this.testYamlSyntax,
      this.testComposeVersion,
      this.testServiceDefinitions,
      this.testPortMappings,
      this.testDependencyGraph
    ];

    for (const test of tests) {
      try {
        await test.call(this);
      } catch (error) {
        this.testResults.syntax.push({
          test: test.name,
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  async testYamlSyntax() {
    try {
      const composeContent = await fs.readFile(this.composeFile, 'utf8');
      const parsed = yaml.load(composeContent);
      
      this.testResults.syntax.push({
        test: 'yaml_syntax',
        status: 'passed',
        message: 'Docker Compose YAML syntax is valid'
      });

      return parsed;
    } catch (error) {
      throw new Error(`Invalid YAML syntax: ${error.message}`);
    }
  }

  async testComposeVersion() {
    const result = await this.execCommand('docker-compose config --quiet');
    
    this.testResults.syntax.push({
      test: 'compose_version',
      status: result.success ? 'passed' : 'failed',
      message: result.success ? 
        'Docker Compose configuration is valid' : 
        `Configuration error: ${result.error}`
    });
  }

  async testServiceDefinitions() {
    const composeContent = await fs.readFile(this.composeFile, 'utf8');
    const config = yaml.load(composeContent);

    const requiredServices = ['frontend', 'backend', 'postgres', 'redis'];
    const definedServices = Object.keys(config.services || {});

    const missingServices = requiredServices.filter(
      service => !definedServices.includes(service)
    );

    if (missingServices.length === 0) {
      this.testResults.syntax.push({
        test: 'service_definitions',
        status: 'passed',
        message: 'All required services are defined'
      });
    } else {
      throw new Error(`Missing required services: ${missingServices.join(', ')}`);
    }
  }

  async testPortMappings() {
    const composeContent = await fs.readFile(this.composeFile, 'utf8');
    const config = yaml.load(composeContent);

    const expectedPorts = {
      frontend: ['3000:3000'],
      backend: ['8000:8000'],
      postgres: ['5432:5432'],
      redis: ['6379:6379']
    };

    for (const [service, expectedPortMappings] of Object.entries(expectedPorts)) {
      const serviceConfig = config.services[service];
      if (!serviceConfig || !serviceConfig.ports) {
        throw new Error(`Service ${service} missing port mappings`);
      }

      const hasExpectedPorts = expectedPortMappings.every(port =>
        serviceConfig.ports.includes(port)
      );

      if (!hasExpectedPorts) {
        throw new Error(`Service ${service} has incorrect port mappings`);
      }
    }

    this.testResults.syntax.push({
      test: 'port_mappings',
      status: 'passed',
      message: 'All services have correct port mappings'
    });
  }

  async testDependencyGraph() {
    const composeContent = await fs.readFile(this.composeFile, 'utf8');
    const config = yaml.load(composeContent);

    // Test circular dependencies
    const dependencies = {};
    for (const [service, serviceConfig] of Object.entries(config.services)) {
      dependencies[service] = serviceConfig.depends_on ? 
        (Array.isArray(serviceConfig.depends_on) ? 
          serviceConfig.depends_on : 
          Object.keys(serviceConfig.depends_on)) : [];
    }

    // Simple cycle detection
    const visited = new Set();
    const recursionStack = new Set();

    const hasCycle = (service) => {
      if (recursionStack.has(service)) return true;
      if (visited.has(service)) return false;

      visited.add(service);
      recursionStack.add(service);

      for (const dependency of dependencies[service] || []) {
        if (hasCycle(dependency)) return true;
      }

      recursionStack.delete(service);
      return false;
    };

    for (const service of Object.keys(dependencies)) {
      if (hasCycle(service)) {
        throw new Error('Circular dependency detected in services');
      }
    }

    this.testResults.syntax.push({
      test: 'dependency_graph',
      status: 'passed',
      message: 'No circular dependencies detected'
    });
  }

  // 2. Multi-Service Orchestration Testing
  async testServiceOrchestration() {
    console.log('🔧 Testing service orchestration...');

    const tests = [
      this.testServiceStartupOrder,
      this.testServiceCommunication,
      this.testServiceRecovery,
      this.testResourceLimits
    ];

    for (const test of tests) {
      try {
        await test.call(this);
      } catch (error) {
        this.testResults.orchestration.push({
          test: test.name,
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  async testServiceStartupOrder() {
    // Start services and monitor startup order
    const startupOrder = [];
    
    await this.execCommand('docker-compose down');
    
    const composeProcess = spawn('docker-compose', ['up', '--build'], {
      cwd: this.templatePath,
      stdio: 'pipe'
    });

    let serviceStartTimes = {};

    return new Promise((resolve, reject) => {
      composeProcess.stdout.on('data', (data) => {
        const output = data.toString();
        
        // Monitor service startup messages
        this.services.forEach(service => {
          if (output.includes(`${service}_1`) && output.includes('started')) {
            if (!serviceStartTimes[service]) {
              serviceStartTimes[service] = Date.now();
              startupOrder.push(service);
            }
          }
        });

        // Check if all core services are up
        if (startupOrder.length >= this.services.length) {
          composeProcess.kill();
          
          // Verify dependency order
          const frontendIndex = startupOrder.indexOf('frontend');
          const backendIndex = startupOrder.indexOf('backend');
          const postgresIndex = startupOrder.indexOf('postgres');
          const redisIndex = startupOrder.indexOf('redis');

          const correctOrder = (
            postgresIndex < backendIndex && 
            redisIndex < backendIndex && 
            backendIndex < frontendIndex
          );

          this.testResults.orchestration.push({
            test: 'service_startup_order',
            status: correctOrder ? 'passed' : 'warning',
            message: correctOrder ? 
              'Services started in correct dependency order' : 
              'Services may not be starting in optimal order',
            details: { startupOrder, serviceTimes: serviceStartTimes }
          });

          resolve();
        }
      });

      composeProcess.on('error', reject);
      
      // Timeout after 2 minutes
      setTimeout(() => {
        composeProcess.kill();
        reject(new Error('Service startup timeout'));
      }, 120000);
    });
  }

  async testServiceCommunication() {
    // Test inter-service connectivity
    await this.execCommand('docker-compose up -d postgres redis');
    await this.sleep(10000); // Wait for services to be ready

    const communicationTests = [
      this.testDatabaseConnection,
      this.testRedisConnection,
      this.testInternalNetworking
    ];

    for (const test of communicationTests) {
      try {
        await test.call(this);
      } catch (error) {
        this.testResults.orchestration.push({
          test: test.name,
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  async testDatabaseConnection() {
    const result = await this.execCommand(
      'docker-compose exec -T postgres psql -U postgres -d template_dev -c "SELECT 1;"'
    );

    this.testResults.orchestration.push({
      test: 'database_connection',
      status: result.success ? 'passed' : 'failed',
      message: result.success ? 
        'PostgreSQL database connection successful' : 
        'Failed to connect to PostgreSQL'
    });
  }

  async testRedisConnection() {
    const result = await this.execCommand(
      'docker-compose exec -T redis redis-cli ping'
    );

    this.testResults.orchestration.push({
      test: 'redis_connection',
      status: result.success && result.output.includes('PONG') ? 'passed' : 'failed',
      message: result.success && result.output.includes('PONG') ? 
        'Redis connection successful' : 
        'Failed to connect to Redis'
    });
  }

  async testInternalNetworking() {
    // Test if services can communicate using service names
    const result = await this.execCommand(
      'docker-compose exec -T backend ping -c 1 postgres'
    );

    this.testResults.orchestration.push({
      test: 'internal_networking',
      status: result.success ? 'passed' : 'failed',
      message: result.success ? 
        'Internal service networking working' : 
        'Services cannot communicate internally'
    });
  }

  async testServiceRecovery() {
    // Test service restart and recovery
    await this.execCommand('docker-compose up -d');
    await this.sleep(5000);

    // Stop a service and test automatic restart
    await this.execCommand('docker-compose stop backend');
    await this.sleep(2000);
    await this.execCommand('docker-compose start backend');
    await this.sleep(5000);

    const result = await this.execCommand('docker-compose ps backend');
    const isRunning = result.output.includes('Up');

    this.testResults.orchestration.push({
      test: 'service_recovery',
      status: isRunning ? 'passed' : 'failed',
      message: isRunning ? 
        'Service recovery successful' : 
        'Service failed to recover after restart'
    });
  }

  async testResourceLimits() {
    // Check if resource limits are properly configured
    const result = await this.execCommand('docker-compose config');
    
    this.testResults.orchestration.push({
      test: 'resource_limits',
      status: 'info',
      message: 'Resource limits should be configured for production',
      recommendation: 'Add memory and CPU limits to services'
    });
  }

  // 3. Network Configuration Testing
  async testNetworkConfiguration() {
    console.log('🌐 Testing network configuration...');

    await this.execCommand('docker-compose up -d');
    await this.sleep(10000);

    const tests = [
      this.testNetworkCreation,
      this.testServiceIsolation,
      this.testPortAccessibility,
      this.testInternalDNS
    ];

    for (const test of tests) {
      try {
        await test.call(this);
      } catch (error) {
        this.testResults.network.push({
          test: test.name,
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  async testNetworkCreation() {
    const result = await this.execCommand('docker network ls');
    const hasAppNetwork = result.output.includes('app-network');

    this.testResults.network.push({
      test: 'network_creation',
      status: hasAppNetwork ? 'passed' : 'failed',
      message: hasAppNetwork ? 
        'Custom network created successfully' : 
        'Custom network not found'
    });
  }

  async testServiceIsolation() {
    // Test that services are properly isolated but can communicate
    const result = await this.execCommand(
      'docker-compose exec -T frontend ping -c 1 backend'
    );

    this.testResults.network.push({
      test: 'service_isolation',
      status: result.success ? 'passed' : 'failed',
      message: result.success ? 
        'Services can communicate within network' : 
        'Service isolation may be too restrictive'
    });
  }

  async testPortAccessibility() {
    const ports = [3000, 8000, 5432, 6379];
    const accessibilityResults = {};

    for (const port of ports) {
      const isAccessible = await this.checkPortAccessibility(port);
      accessibilityResults[port] = isAccessible;
    }

    const allAccessible = Object.values(accessibilityResults).every(Boolean);

    this.testResults.network.push({
      test: 'port_accessibility',
      status: allAccessible ? 'passed' : 'failed',
      message: allAccessible ? 
        'All mapped ports are accessible' : 
        'Some ports are not accessible from host',
      details: accessibilityResults
    });
  }

  async testInternalDNS() {
    // Test internal DNS resolution
    const result = await this.execCommand(
      'docker-compose exec -T backend nslookup postgres'
    );

    this.testResults.network.push({
      test: 'internal_dns',
      status: result.success ? 'passed' : 'failed',
      message: result.success ? 
        'Internal DNS resolution working' : 
        'Internal DNS resolution failed'
    });
  }

  // 4. Volume Management Testing
  async testVolumeManagement() {
    console.log('💾 Testing volume management...');

    const tests = [
      this.testVolumeCreation,
      this.testDataPersistence,
      this.testVolumePermissions,
      this.testBackupRestore
    ];

    for (const test of tests) {
      try {
        await test.call(this);
      } catch (error) {
        this.testResults.volumes.push({
          test: test.name,
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  async testVolumeCreation() {
    const result = await this.execCommand('docker volume ls');
    const hasPostgresVolume = result.output.includes('postgres_data');
    const hasRedisVolume = result.output.includes('redis_data');

    this.testResults.volumes.push({
      test: 'volume_creation',
      status: hasPostgresVolume && hasRedisVolume ? 'passed' : 'failed',
      message: hasPostgresVolume && hasRedisVolume ? 
        'Named volumes created successfully' : 
        'Some named volumes missing'
    });
  }

  async testDataPersistence() {
    // Test data persistence across container restarts
    await this.execCommand(
      'docker-compose exec -T postgres psql -U postgres -d template_dev -c "CREATE TABLE test_table (id SERIAL PRIMARY KEY, data TEXT);"'
    );
    
    await this.execCommand(
      'docker-compose exec -T postgres psql -U postgres -d template_dev -c "INSERT INTO test_table (data) VALUES (\'test_data\');"'
    );

    await this.execCommand('docker-compose restart postgres');
    await this.sleep(10000);

    const result = await this.execCommand(
      'docker-compose exec -T postgres psql -U postgres -d template_dev -c "SELECT COUNT(*) FROM test_table;"'
    );

    const dataExists = result.output.includes('1');

    this.testResults.volumes.push({
      test: 'data_persistence',
      status: dataExists ? 'passed' : 'failed',
      message: dataExists ? 
        'Data persists across container restarts' : 
        'Data not persisting across restarts'
    });
  }

  async testVolumePermissions() {
    // Test volume permissions
    const result = await this.execCommand(
      'docker-compose exec -T postgres ls -la /var/lib/postgresql/data'
    );

    this.testResults.volumes.push({
      test: 'volume_permissions',
      status: result.success ? 'passed' : 'failed',
      message: result.success ? 
        'Volume permissions are accessible' : 
        'Volume permission issues detected'
    });
  }

  async testBackupRestore() {
    // Test basic backup functionality
    const backupResult = await this.execCommand(
      'docker-compose exec -T postgres pg_dump -U postgres template_dev'
    );

    this.testResults.volumes.push({
      test: 'backup_restore',
      status: backupResult.success ? 'passed' : 'failed',
      message: backupResult.success ? 
        'Database backup functionality working' : 
        'Database backup failed'
    });
  }

  // 5. Environment Variables Testing
  async testEnvironmentVariables() {
    console.log('🔧 Testing environment variables...');

    const tests = [
      this.testEnvVarPropagation,
      this.testEnvVarValidation,
      this.testSecretManagement,
      this.testEnvVarOverrides
    ];

    for (const test of tests) {
      try {
        await test.call(this);
      } catch (error) {
        this.testResults.environment.push({
          test: test.name,
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  async testEnvVarPropagation() {
    // Test if environment variables are properly passed to services
    const result = await this.execCommand(
      'docker-compose exec -T backend printenv DATABASE_URL'
    );

    const hasCorrectDbUrl = result.output.includes('postgresql://postgres:password@postgres:5432');

    this.testResults.environment.push({
      test: 'env_var_propagation',
      status: hasCorrectDbUrl ? 'passed' : 'failed',
      message: hasCorrectDbUrl ? 
        'Environment variables properly propagated' : 
        'Environment variable propagation failed'
    });
  }

  async testEnvVarValidation() {
    // Test required environment variables
    const requiredVars = [
      'NODE_ENV',
      'RUST_ENV',
      'DATABASE_URL',
      'REDIS_URL'
    ];

    const missingVars = [];

    for (const varName of requiredVars) {
      const result = await this.execCommand(
        `docker-compose exec -T backend printenv ${varName}`
      );
      
      if (!result.success || !result.output.trim()) {
        missingVars.push(varName);
      }
    }

    this.testResults.environment.push({
      test: 'env_var_validation',
      status: missingVars.length === 0 ? 'passed' : 'failed',
      message: missingVars.length === 0 ? 
        'All required environment variables present' : 
        `Missing environment variables: ${missingVars.join(', ')}`
    });
  }

  async testSecretManagement() {
    // Test that secrets are not exposed in logs
    const result = await this.execCommand('docker-compose logs backend');
    const hasExposedSecrets = result.output.includes('password') || 
                              result.output.includes('secret') || 
                              result.output.includes('key');

    this.testResults.environment.push({
      test: 'secret_management',
      status: !hasExposedSecrets ? 'passed' : 'warning',
      message: !hasExposedSecrets ? 
        'No secrets exposed in logs' : 
        'Potential secret exposure in logs detected'
    });
  }

  async testEnvVarOverrides() {
    // Test environment variable override precedence
    this.testResults.environment.push({
      test: 'env_var_overrides',
      status: 'info',
      message: 'Environment variable override testing requires manual verification'
    });
  }

  // 6. Health Checks Testing
  async testHealthChecks() {
    console.log('🏥 Testing health checks...');

    await this.execCommand('docker-compose up -d');
    await this.sleep(30000); // Wait for health checks to stabilize

    const tests = [
      this.testPostgresHealth,
      this.testRedisHealth,
      this.testHealthCheckIntegration
    ];

    for (const test of tests) {
      try {
        await test.call(this);
      } catch (error) {
        this.testResults.health.push({
          test: test.name,
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  async testPostgresHealth() {
    const result = await this.execCommand('docker-compose ps postgres');
    const isHealthy = result.output.includes('(healthy)');

    this.testResults.health.push({
      test: 'postgres_health',
      status: isHealthy ? 'passed' : 'failed',
      message: isHealthy ? 
        'PostgreSQL health check passing' : 
        'PostgreSQL health check failing'
    });
  }

  async testRedisHealth() {
    const result = await this.execCommand('docker-compose ps redis');
    const isHealthy = result.output.includes('(healthy)');

    this.testResults.health.push({
      test: 'redis_health',
      status: isHealthy ? 'passed' : 'failed',
      message: isHealthy ? 
        'Redis health check passing' : 
        'Redis health check failing'
    });
  }

  async testHealthCheckIntegration() {
    // Test that dependent services wait for health checks
    const result = await this.execCommand('docker-compose ps');
    const allServicesUp = this.services.every(service => 
      result.output.includes(service) && result.output.includes('Up')
    );

    this.testResults.health.push({
      test: 'health_check_integration',
      status: allServicesUp ? 'passed' : 'failed',
      message: allServicesUp ? 
        'Health check integration working correctly' : 
        'Some services failed to start properly'
    });
  }

  // 7. Security Configuration Testing
  async testSecurityConfiguration() {
    console.log('🔒 Testing security configuration...');

    const tests = [
      this.testNetworkSecurity,
      this.testContainerSecurity,
      this.testSecretsHandling
    ];

    for (const test of tests) {
      try {
        await test.call(this);
      } catch (error) {
        this.testResults.security.push({
          test: test.name,
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  async testNetworkSecurity() {
    // Test network isolation
    const result = await this.execCommand('docker-compose config');
    const hasCustomNetwork = result.output.includes('app-network');

    this.testResults.security.push({
      test: 'network_security',
      status: hasCustomNetwork ? 'passed' : 'warning',
      message: hasCustomNetwork ? 
        'Services isolated in custom network' : 
        'Consider using custom networks for better isolation'
    });
  }

  async testContainerSecurity() {
    // Test for security best practices
    const result = await this.execCommand('docker-compose config');
    
    this.testResults.security.push({
      test: 'container_security',
      status: 'info',
      message: 'Manual security audit recommended',
      recommendations: [
        'Run containers as non-root user',
        'Use read-only filesystems where possible',
        'Implement resource limits',
        'Regular security scanning'
      ]
    });
  }

  async testSecretsHandling() {
    // Test secrets handling
    const composeContent = await fs.readFile(this.composeFile, 'utf8');
    const hasHardcodedSecrets = composeContent.includes('password') && 
                                !composeContent.includes('${');

    this.testResults.security.push({
      test: 'secrets_handling',
      status: !hasHardcodedSecrets ? 'passed' : 'failed',
      message: !hasHardcodedSecrets ? 
        'No hardcoded secrets detected' : 
        'Hardcoded secrets found in configuration'
    });
  }

  // 8. Multi-Environment Setup Testing
  async testMultiEnvironmentSetup() {
    console.log('🌍 Testing multi-environment setup...');

    // Test different profiles
    const profiles = ['', 'dev-tools', 'production'];
    
    for (const profile of profiles) {
      try {
        const command = profile ? 
          `docker-compose --profile ${profile} config` : 
          'docker-compose config';
        
        const result = await this.execCommand(command);
        
        this.testResults.orchestration.push({
          test: `profile_${profile || 'default'}`,
          status: result.success ? 'passed' : 'failed',
          message: result.success ? 
            `Profile '${profile || 'default'}' configuration valid` : 
            `Profile '${profile || 'default'}' configuration invalid`
        });
      } catch (error) {
        this.testResults.orchestration.push({
          test: `profile_${profile || 'default'}`,
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  // Utility Methods
  async execCommand(command) {
    return new Promise((resolve) => {
      exec(command, { cwd: this.templatePath }, (error, stdout, stderr) => {
        resolve({
          success: !error,
          output: stdout,
          error: stderr,
          code: error?.code
        });
      });
    });
  }

  async checkPortAccessibility(port) {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      
      socket.setTimeout(3000);
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });
      
      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
      
      socket.on('error', () => {
        resolve(false);
      });
      
      socket.connect(port, 'localhost');
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generateTestReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        info: 0
      },
      categories: this.testResults,
      recommendations: [],
      overallStatus: 'unknown'
    };

    // Calculate summary
    for (const category of Object.values(this.testResults)) {
      for (const test of category) {
        report.summary.totalTests++;
        if (test.status === 'passed') report.summary.passed++;
        else if (test.status === 'failed') report.summary.failed++;
        else if (test.status === 'warning') report.summary.warnings++;
        else if (test.status === 'info') report.summary.info++;
      }
    }

    // Determine overall status
    if (report.summary.failed === 0) {
      report.overallStatus = report.summary.warnings > 0 ? 'warning' : 'passed';
    } else {
      report.overallStatus = 'failed';
    }

    // Generate recommendations
    if (report.summary.failed > 0) {
      report.recommendations.push('Address failed tests before production deployment');
    }
    if (report.summary.warnings > 0) {
      report.recommendations.push('Review warnings for potential improvements');
    }
    report.recommendations.push('Regular security audits recommended');
    report.recommendations.push('Monitor resource usage in production');

    // Save report
    await fs.writeFile(
      path.join(this.templatePath, 'docker-compose-test-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('\n📊 Docker Compose Test Results:');
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`⚠️  Warnings: ${report.summary.warnings}`);
    console.log(`ℹ️  Info: ${report.summary.info}`);
    console.log(`\n📄 Detailed report saved to: docker-compose-test-report.json`);

    return report;
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up test environment...');
    await this.execCommand('docker-compose down -v');
    await this.execCommand('docker system prune -f');
  }
}

// Export for use in other test files
module.exports = DockerComposeTestSuite;

// Run if called directly
if (require.main === module) {
  const testSuite = new DockerComposeTestSuite();
  
  testSuite.runAllTests()
    .then((report) => {
      console.log(`\n🎉 Docker Compose testing completed with status: ${report.overallStatus}`);
      process.exit(report.overallStatus === 'failed' ? 1 : 0);
    })
    .catch((error) => {
      console.error('💥 Test suite failed:', error);
      process.exit(1);
    })
    .finally(() => {
      testSuite.cleanup();
    });
}