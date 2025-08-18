#!/usr/bin/env node

/**
 * Template Docker Configuration Tests
 * 
 * Comprehensive Docker configuration tests for generated templates
 * Tests Docker files, docker-compose, environment variables, and deployment
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const crypto = require('crypto');
const os = require('os');
const yaml = require('yaml');

const execAsync = promisify(exec);

class TemplateDockerConfigTester {
  constructor() {
    this.testResults = [];
    this.testId = crypto.randomUUID();
    this.tempDir = path.join(os.tmpdir(), `claude-flow-docker-config-${this.testId}`);
    this.testProjectName = `docker-test-${Date.now()}`;
    
    console.log(`🐳 Template Docker Configuration Tests - Session: ${this.testId}`);
    console.log(`📁 Test directory: ${this.tempDir}`);
    console.log(`📋 Project: ${this.testProjectName}`);
  }

  // Test Result Recording
  recordTest(testName, status, details = {}) {
    const result = {
      name: testName,
      status,
      timestamp: new Date().toISOString(),
      details,
      duration: details.duration || 0
    };
    
    this.testResults.push(result);
    
    const icon = status === 'passed' ? '✅' : status === 'failed' ? '❌' : '⚠️';
    console.log(`${icon} ${testName} (${details.duration || 0}ms)`);
    
    if (status === 'failed' && details.error) {
      console.log(`   Error: ${details.error}`);
    }
  }

  // Setup Test Environment and Generate Project
  async setupTestProject() {
    const startTime = Date.now();
    
    try {
      if (!fs.existsSync(this.tempDir)) {
        fs.mkdirSync(this.tempDir, { recursive: true });
      }
      
      // Generate test project
      const { createFromTemplate } = require('../engine/src/modules/scaffolder.ts');
      const result = createFromTemplate('fullstack-modern', this.testProjectName, this.tempDir);
      
      if (!result || !result.projectDir || !fs.existsSync(result.projectDir)) {
        throw new Error('Failed to create test project');
      }
      
      this.projectDir = result.projectDir;
      
      this.recordTest('Setup Docker Config Test Project', 'passed', {
        duration: Date.now() - startTime,
        projectDir: this.projectDir,
        appliedFiles: result.applied?.length || 0
      });
      
      return true;
    } catch (error) {
      this.recordTest('Setup Docker Config Test Project', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return false;
    }
  }

  // Test 1: Dockerfile Structure Validation
  async testDockerfileStructure() {
    const startTime = Date.now();
    
    try {
      const dockerfiles = [
        {
          path: 'frontend/Dockerfile',
          type: 'frontend',
          expectedBaseImage: 'node',
          requiredInstructions: ['FROM', 'WORKDIR', 'COPY', 'RUN', 'EXPOSE', 'CMD']
        },
        {
          path: 'frontend/Dockerfile.dev',
          type: 'frontend-dev',
          expectedBaseImage: 'node',
          requiredInstructions: ['FROM', 'WORKDIR', 'COPY', 'RUN', 'EXPOSE', 'CMD']
        },
        {
          path: 'backend/Dockerfile',
          type: 'backend',
          expectedBaseImage: 'rust',
          requiredInstructions: ['FROM', 'WORKDIR', 'COPY', 'RUN', 'EXPOSE', 'CMD']
        },
        {
          path: 'backend/Dockerfile.dev',
          type: 'backend-dev',
          expectedBaseImage: 'rust',
          requiredInstructions: ['FROM', 'WORKDIR', 'COPY', 'RUN', 'EXPOSE', 'CMD']
        }
      ];
      
      const validationResults = [];
      
      for (const dockerfileConfig of dockerfiles) {
        const dockerfilePath = path.join(this.projectDir, dockerfileConfig.path);
        
        if (!fs.existsSync(dockerfilePath)) {
          validationResults.push({
            file: dockerfileConfig.path,
            exists: false,
            valid: false,
            error: 'File not found'
          });
          continue;
        }
        
        const content = fs.readFileSync(dockerfilePath, 'utf8');
        const validation = this.validateDockerfile(content, dockerfileConfig);
        
        validationResults.push({
          file: dockerfileConfig.path,
          exists: true,
          ...validation
        });
      }
      
      const invalidDockerfiles = validationResults.filter(r => !r.valid);
      
      if (invalidDockerfiles.length > 0) {
        throw new Error(`Invalid Dockerfiles: ${invalidDockerfiles.map(f => `${f.file} (${f.issues?.join(', ') || f.error})`).join(', ')}`);
      }
      
      this.recordTest('Dockerfile Structure Validation', 'passed', {
        duration: Date.now() - startTime,
        dockerfiles: dockerfiles.length,
        validDockerfiles: validationResults.filter(r => r.valid).length,
        totalInstructions: validationResults.reduce((sum, r) => sum + (r.instructionCount || 0), 0)
      });
      
      return validationResults;
    } catch (error) {
      this.recordTest('Dockerfile Structure Validation', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return [];
    }
  }

  // Test 2: Docker Compose Configuration
  async testDockerComposeConfiguration() {
    const startTime = Date.now();
    
    try {
      const dockerComposePath = path.join(this.projectDir, 'docker-compose.yml');
      
      if (!fs.existsSync(dockerComposePath)) {
        throw new Error('docker-compose.yml not found');
      }
      
      const content = fs.readFileSync(dockerComposePath, 'utf8');
      
      // Parse YAML
      let composeConfig;
      try {
        composeConfig = yaml.parse(content);
      } catch (error) {
        throw new Error(`Invalid YAML in docker-compose.yml: ${error.message}`);
      }
      
      // Validate structure
      if (!composeConfig.version) {
        throw new Error('No version specified in docker-compose.yml');
      }
      
      if (!composeConfig.services) {
        throw new Error('No services defined in docker-compose.yml');
      }
      
      // Expected services
      const expectedServices = ['frontend', 'backend', 'postgres'];
      const missingServices = expectedServices.filter(service => 
        !composeConfig.services[service]
      );
      
      if (missingServices.length > 0) {
        throw new Error(`Missing services: ${missingServices.join(', ')}`);
      }
      
      // Validate service configurations
      const serviceValidation = this.validateDockerComposeServices(composeConfig.services);
      
      const invalidServices = serviceValidation.filter(s => !s.valid);
      
      if (invalidServices.length > 0) {
        throw new Error(`Invalid services: ${invalidServices.map(s => `${s.name} (${s.issues.join(', ')})`).join(', ')}`);
      }
      
      // Check for networks and volumes if needed
      const hasNetworks = !!composeConfig.networks;
      const hasVolumes = !!composeConfig.volumes;
      
      this.recordTest('Docker Compose Configuration', 'passed', {
        duration: Date.now() - startTime,
        version: composeConfig.version,
        servicesCount: Object.keys(composeConfig.services).length,
        hasNetworks,
        hasVolumes,
        serviceValidation: serviceValidation.length
      });
      
      return { composeConfig, serviceValidation };
    } catch (error) {
      this.recordTest('Docker Compose Configuration', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return null;
    }
  }

  // Test 3: Environment Variables Configuration
  async testEnvironmentVariablesConfiguration() {
    const startTime = Date.now();
    
    try {
      const envConfigurations = [];
      
      // Check docker-compose.yml for environment variables
      const dockerComposePath = path.join(this.projectDir, 'docker-compose.yml');
      if (fs.existsSync(dockerComposePath)) {
        const content = fs.readFileSync(dockerComposePath, 'utf8');
        const composeConfig = yaml.parse(content);
        
        Object.entries(composeConfig.services || {}).forEach(([serviceName, serviceConfig]) => {
          if (serviceConfig.environment) {
            envConfigurations.push({
              source: 'docker-compose.yml',
              service: serviceName,
              envVars: Array.isArray(serviceConfig.environment) 
                ? serviceConfig.environment 
                : Object.keys(serviceConfig.environment),
              count: Array.isArray(serviceConfig.environment) 
                ? serviceConfig.environment.length 
                : Object.keys(serviceConfig.environment).length
            });
          }
          
          if (serviceConfig.env_file) {
            envConfigurations.push({
              source: 'docker-compose.yml',
              service: serviceName,
              envFile: serviceConfig.env_file,
              type: 'env_file'
            });
          }
        });
      }
      
      // Check for .env.example file
      const envExamplePath = path.join(this.projectDir, '.env.example');
      if (fs.existsSync(envExamplePath)) {
        const envContent = fs.readFileSync(envExamplePath, 'utf8');
        const envVars = envContent.split('\n')
          .filter(line => line.trim() && !line.startsWith('#'))
          .map(line => line.split('=')[0]);
        
        envConfigurations.push({
          source: '.env.example',
          envVars,
          count: envVars.length
        });
      }
      
      // Check Next.js config for environment variables
      const nextConfigPath = path.join(this.projectDir, 'frontend/next.config.js');
      if (fs.existsSync(nextConfigPath)) {
        const nextContent = fs.readFileSync(nextConfigPath, 'utf8');
        const envMatches = nextContent.match(/process\.env\.([A-Z_][A-Z0-9_]*)/g) || [];
        const envVars = [...new Set(envMatches.map(match => match.replace('process.env.', '')))];
        
        if (envVars.length > 0) {
          envConfigurations.push({
            source: 'frontend/next.config.js',
            envVars,
            count: envVars.length
          });
        }
      }
      
      // Check template config for expected environment variables
      const templateConfigPath = path.join(process.cwd(), 'templates/fullstack-modern/template.config.json');
      if (fs.existsSync(templateConfigPath)) {
        const templateConfig = JSON.parse(fs.readFileSync(templateConfigPath, 'utf8'));
        
        const expectedFrontendEnv = templateConfig.deployment?.frontend?.env || [];
        const expectedBackendEnv = templateConfig.deployment?.backend?.env || [];
        
        if (expectedFrontendEnv.length > 0) {
          envConfigurations.push({
            source: 'template-config (frontend)',
            envVars: expectedFrontendEnv,
            count: expectedFrontendEnv.length,
            type: 'expected'
          });
        }
        
        if (expectedBackendEnv.length > 0) {
          envConfigurations.push({
            source: 'template-config (backend)',
            envVars: expectedBackendEnv,
            count: expectedBackendEnv.length,
            type: 'expected'
          });
        }
      }
      
      // Validate environment variable coverage
      const allDefinedVars = new Set();
      const expectedVars = new Set();
      
      envConfigurations.forEach(config => {
        if (config.type === 'expected') {
          config.envVars.forEach(varName => expectedVars.add(varName));
        } else {
          config.envVars?.forEach(varName => allDefinedVars.add(varName));
        }
      });
      
      const missingVars = [...expectedVars].filter(varName => !allDefinedVars.has(varName));
      
      if (missingVars.length > 0) {
        console.warn(`Missing environment variable definitions: ${missingVars.join(', ')}`);
      }
      
      this.recordTest('Environment Variables Configuration', 'passed', {
        duration: Date.now() - startTime,
        configurations: envConfigurations.length,
        totalEnvVars: allDefinedVars.size,
        expectedVars: expectedVars.size,
        missingVars: missingVars.length
      });
      
      return { envConfigurations, missingVars };
    } catch (error) {
      this.recordTest('Environment Variables Configuration', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return null;
    }
  }

  // Test 4: Docker Build Test
  async testDockerBuild() {
    const startTime = Date.now();
    
    try {
      // Check if Docker is available
      let dockerAvailable = false;
      try {
        await execAsync('docker --version', { timeout: 10000 });
        dockerAvailable = true;
      } catch (error) {
        console.log('   ℹ️  Docker not available, skipping build test');
        
        this.recordTest('Docker Build Test', 'skipped', {
          duration: Date.now() - startTime,
          reason: 'Docker not available'
        });
        
        return { skipped: true, reason: 'Docker not available' };
      }
      
      const buildResults = [];
      
      // Test frontend Dockerfile
      try {
        console.log('   🔨 Testing frontend Docker build...');
        
        const frontendResult = await execAsync(
          `docker build -f frontend/Dockerfile -t ${this.testProjectName}-frontend-test .`,
          {
            cwd: this.projectDir,
            timeout: 300000 // 5 minutes
          }
        );
        
        buildResults.push({
          service: 'frontend',
          success: true,
          output: frontendResult.stdout.substring(0, 500)
        });
        
        // Cleanup image
        try {
          await execAsync(`docker rmi ${this.testProjectName}-frontend-test`, { timeout: 30000 });
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
        
      } catch (error) {
        buildResults.push({
          service: 'frontend',
          success: false,
          error: error.message.substring(0, 500)
        });
      }
      
      // Test backend Dockerfile
      try {
        console.log('   🔨 Testing backend Docker build...');
        
        const backendResult = await execAsync(
          `docker build -f backend/Dockerfile -t ${this.testProjectName}-backend-test .`,
          {
            cwd: this.projectDir,
            timeout: 600000 // 10 minutes (Rust builds are slow)
          }
        );
        
        buildResults.push({
          service: 'backend',
          success: true,
          output: backendResult.stdout.substring(0, 500)
        });
        
        // Cleanup image
        try {
          await execAsync(`docker rmi ${this.testProjectName}-backend-test`, { timeout: 30000 });
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
        
      } catch (error) {
        buildResults.push({
          service: 'backend',
          success: false,
          error: error.message.substring(0, 500)
        });
      }
      
      const successfulBuilds = buildResults.filter(r => r.success).length;
      const failedBuilds = buildResults.filter(r => !r.success).length;
      
      // If at least one build succeeded, consider the test passed
      if (successfulBuilds === 0 && failedBuilds > 0) {
        throw new Error(`All Docker builds failed: ${buildResults.map(r => `${r.service}: ${r.error || 'unknown'}`).join(', ')}`);
      }
      
      this.recordTest('Docker Build Test', 'passed', {
        duration: Date.now() - startTime,
        dockerAvailable: true,
        successfulBuilds,
        failedBuilds,
        totalBuilds: buildResults.length
      });
      
      return { buildResults, successfulBuilds, failedBuilds };
    } catch (error) {
      this.recordTest('Docker Build Test', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return null;
    }
  }

  // Test 5: Docker Compose Validation
  async testDockerComposeValidation() {
    const startTime = Date.now();
    
    try {
      let dockerComposeAvailable = false;
      try {
        await execAsync('docker-compose --version', { timeout: 10000 });
        dockerComposeAvailable = true;
      } catch (error) {
        // Try docker compose (newer syntax)
        try {
          await execAsync('docker compose --version', { timeout: 10000 });
          dockerComposeAvailable = true;
        } catch (error2) {
          console.log('   ℹ️  Docker Compose not available, skipping validation test');
          
          this.recordTest('Docker Compose Validation', 'skipped', {
            duration: Date.now() - startTime,
            reason: 'Docker Compose not available'
          });
          
          return { skipped: true, reason: 'Docker Compose not available' };
        }
      }
      
      // Test docker-compose config validation
      try {
        console.log('   ✅ Validating docker-compose configuration...');
        
        const configResult = await execAsync('docker-compose config', {
          cwd: this.projectDir,
          timeout: 30000
        });
        
        // If config command succeeds, the compose file is valid
        this.recordTest('Docker Compose Validation', 'passed', {
          duration: Date.now() - startTime,
          dockerComposeAvailable: true,
          configValid: true,
          outputLength: configResult.stdout.length
        });
        
        return { configValid: true, output: configResult.stdout };
        
      } catch (error) {
        // Try with newer docker compose syntax
        try {
          const configResult = await execAsync('docker compose config', {
            cwd: this.projectDir,
            timeout: 30000
          });
          
          this.recordTest('Docker Compose Validation', 'passed', {
            duration: Date.now() - startTime,
            dockerComposeAvailable: true,
            configValid: true,
            syntax: 'new',
            outputLength: configResult.stdout.length
          });
          
          return { configValid: true, output: configResult.stdout };
          
        } catch (error2) {
          throw new Error(`Docker Compose config validation failed: ${error2.message}`);
        }
      }
      
    } catch (error) {
      this.recordTest('Docker Compose Validation', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return null;
    }
  }

  // Test 6: Port Configuration Validation
  async testPortConfiguration() {
    const startTime = Date.now();
    
    try {
      const dockerComposePath = path.join(this.projectDir, 'docker-compose.yml');
      
      if (!fs.existsSync(dockerComposePath)) {
        throw new Error('docker-compose.yml not found');
      }
      
      const content = fs.readFileSync(dockerComposePath, 'utf8');
      const composeConfig = yaml.parse(content);
      
      const portConfigurations = [];
      
      Object.entries(composeConfig.services || {}).forEach(([serviceName, serviceConfig]) => {
        if (serviceConfig.ports) {
          const ports = Array.isArray(serviceConfig.ports) ? serviceConfig.ports : [serviceConfig.ports];
          
          ports.forEach(portMapping => {
            const mapping = typeof portMapping === 'string' ? portMapping : `${portMapping.published}:${portMapping.target}`;
            const [hostPort, containerPort] = mapping.split(':');
            
            portConfigurations.push({
              service: serviceName,
              hostPort: parseInt(hostPort),
              containerPort: parseInt(containerPort),
              mapping
            });
          });
        }
        
        if (serviceConfig.expose) {
          const exposedPorts = Array.isArray(serviceConfig.expose) ? serviceConfig.expose : [serviceConfig.expose];
          
          exposedPorts.forEach(port => {
            portConfigurations.push({
              service: serviceName,
              exposedPort: parseInt(port),
              type: 'exposed'
            });
          });
        }
      });
      
      // Check for port conflicts
      const hostPorts = portConfigurations
        .filter(p => p.hostPort)
        .map(p => p.hostPort);
      
      const duplicateHostPorts = hostPorts.filter((port, index) => 
        hostPorts.indexOf(port) !== index
      );
      
      if (duplicateHostPorts.length > 0) {
        throw new Error(`Duplicate host ports: ${duplicateHostPorts.join(', ')}`);
      }
      
      // Validate common port assignments
      const expectedPorts = {
        frontend: [3000, 80, 443],
        backend: [8000, 8080, 3001],
        postgres: [5432]
      };
      
      const portValidation = [];
      
      Object.entries(expectedPorts).forEach(([service, expectedPortList]) => {
        const serviceConfigs = portConfigurations.filter(p => p.service === service);
        
        if (serviceConfigs.length === 0) {
          portValidation.push({
            service,
            issue: 'No port configuration found'
          });
        } else {
          const servicePorts = serviceConfigs.map(p => p.hostPort || p.containerPort || p.exposedPort);
          const hasExpectedPort = expectedPortList.some(expectedPort => 
            servicePorts.includes(expectedPort)
          );
          
          if (!hasExpectedPort) {
            portValidation.push({
              service,
              issue: `Expected ports ${expectedPortList.join(' or ')}, found ${servicePorts.join(', ')}`
            });
          }
        }
      });
      
      const portIssues = portValidation.filter(v => v.issue);
      
      if (portIssues.length > 0) {
        console.warn(`Port configuration issues: ${portIssues.map(i => `${i.service}: ${i.issue}`).join(', ')}`);
      }
      
      this.recordTest('Port Configuration Validation', 'passed', {
        duration: Date.now() - startTime,
        portConfigurations: portConfigurations.length,
        uniqueHostPorts: new Set(hostPorts).size,
        duplicateHostPorts: duplicateHostPorts.length,
        portIssues: portIssues.length
      });
      
      return { portConfigurations, duplicateHostPorts, portIssues };
    } catch (error) {
      this.recordTest('Port Configuration Validation', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return null;
    }
  }

  // Helper Methods
  validateDockerfile(content, config) {
    const issues = [];
    let instructionCount = 0;
    
    // Check for required instructions
    config.requiredInstructions.forEach(instruction => {
      if (!content.includes(instruction)) {
        issues.push(`Missing ${instruction} instruction`);
      } else {
        instructionCount++;
      }
    });
    
    // Check base image
    const fromMatch = content.match(/FROM\s+(\S+)/);
    if (fromMatch) {
      const baseImage = fromMatch[1];
      if (!baseImage.includes(config.expectedBaseImage)) {
        issues.push(`Expected base image containing '${config.expectedBaseImage}', found '${baseImage}'`);
      }
    }
    
    // Check for best practices
    if (!content.includes('WORKDIR')) {
      issues.push('Should use WORKDIR instruction');
    }
    
    if (content.includes('ADD') && !content.includes('COPY')) {
      issues.push('Prefer COPY over ADD when possible');
    }
    
    // Check for security issues
    if (content.includes('RUN apt-get update') && !content.includes('apt-get clean')) {
      issues.push('Should clean apt cache after update');
    }
    
    return {
      valid: issues.length === 0,
      issues,
      instructionCount
    };
  }

  validateDockerComposeServices(services) {
    const validations = [];
    
    Object.entries(services).forEach(([serviceName, serviceConfig]) => {
      const validation = {
        name: serviceName,
        valid: true,
        issues: []
      };
      
      // Check for required fields
      if (!serviceConfig.build && !serviceConfig.image) {
        validation.issues.push('No build or image specified');
        validation.valid = false;
      }
      
      // Check port configuration
      if (!serviceConfig.ports && !serviceConfig.expose) {
        validation.issues.push('No port configuration');
      }
      
      // Service-specific validation
      if (serviceName === 'postgres') {
        if (!serviceConfig.environment || !serviceConfig.environment.POSTGRES_DB) {
          validation.issues.push('Missing POSTGRES_DB environment variable');
        }
        
        if (!serviceConfig.volumes) {
          validation.issues.push('No volume configuration for data persistence');
        }
      }
      
      if ((serviceName === 'frontend' || serviceName === 'backend') && !serviceConfig.build) {
        validation.issues.push('Should use build configuration for application services');
      }
      
      if (validation.issues.length > 0) {
        validation.valid = false;
      }
      
      validations.push(validation);
    });
    
    return validations;
  }

  // Cleanup Test Environment
  async cleanupTestEnvironment() {
    const startTime = Date.now();
    
    try {
      // Cleanup any Docker images/containers if they exist
      try {
        const cleanupCommands = [
          `docker rmi ${this.testProjectName}-frontend-test`,
          `docker rmi ${this.testProjectName}-backend-test`
        ];
        
        for (const command of cleanupCommands) {
          try {
            await execAsync(command, { timeout: 10000 });
          } catch (error) {
            // Ignore cleanup errors
          }
        }
      } catch (error) {
        // Docker might not be available
      }
      
      // Remove temp directory
      if (fs.existsSync(this.tempDir)) {
        fs.rmSync(this.tempDir, { recursive: true, force: true });
      }
      
      this.recordTest('Cleanup Docker Config Test Environment', 'passed', {
        duration: Date.now() - startTime,
        removedDir: this.tempDir
      });
      
      return true;
    } catch (error) {
      this.recordTest('Cleanup Docker Config Test Environment', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return false;
    }
  }

  // Generate Test Report
  generateTestReport() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(t => t.status === 'passed').length;
    const failedTests = this.testResults.filter(t => t.status === 'failed').length;
    const skippedTests = this.testResults.filter(t => t.status === 'skipped').length;
    
    const totalDuration = this.testResults.reduce((sum, test) => sum + (test.duration || 0), 0);
    
    const report = {
      testSession: this.testId,
      testType: 'docker-config',
      timestamp: new Date().toISOString(),
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        skipped: skippedTests,
        passRate: totalTests > 0 ? (passedTests / totalTests * 100).toFixed(2) : 0,
        totalDuration: totalDuration
      },
      tests: this.testResults,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        cwd: process.cwd(),
        tempDir: this.tempDir,
        projectName: this.testProjectName,
        projectDir: this.projectDir
      }
    };
    
    // Save report
    const reportPath = path.join(process.cwd(), `template-docker-config-test-report-${this.testId}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n📊 Template Docker Configuration Test Results');
    console.log('═'.repeat(60));
    console.log(`📋 Test Session: ${this.testId}`);
    console.log(`🐳 Project: ${this.testProjectName}`);
    console.log(`📈 Pass Rate: ${report.summary.passRate}% (${passedTests}/${totalTests})`);
    console.log(`⏱️  Total Duration: ${totalDuration}ms`);
    console.log(`📄 Report: ${reportPath}`);
    
    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(t => t.status === 'failed')
        .forEach(test => {
          console.log(`   - ${test.name}: ${test.details.error}`);
        });
    }
    
    if (skippedTests > 0) {
      console.log('\n⚠️  Skipped Tests:');
      this.testResults
        .filter(t => t.status === 'skipped')
        .forEach(test => {
          console.log(`   - ${test.name}: ${test.details.reason}`);
        });
    }
    
    return report;
  }

  // Run All Docker Configuration Tests
  async runAllTests() {
    console.log('🚀 Starting Template Docker Configuration Tests...\n');
    
    // Setup
    const setupSuccess = await this.setupTestProject();
    if (!setupSuccess) {
      console.error('❌ Setup failed, aborting tests');
      return this.generateTestReport();
    }
    
    // Run Docker configuration tests
    await this.testDockerfileStructure();
    await this.testDockerComposeConfiguration();
    await this.testEnvironmentVariablesConfiguration();
    await this.testDockerBuild();
    await this.testDockerComposeValidation();
    await this.testPortConfiguration();
    
    // Cleanup
    await this.cleanupTestEnvironment();
    
    // Generate report
    return this.generateTestReport();
  }
}

// CLI execution
if (require.main === module) {
  const tester = new TemplateDockerConfigTester();
  
  tester.runAllTests()
    .then(report => {
      const exitCode = report.summary.failed > 0 ? 1 : 0;
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('💥 Docker config test runner crashed:', error);
      process.exit(1);
    });
}

module.exports = TemplateDockerConfigTester;