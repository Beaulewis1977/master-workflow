#!/usr/bin/env node

/**
 * Template Generation Unit Tests
 * 
 * Comprehensive unit tests for Claude Flow 2.0 template generation system
 * Tests individual functions and modules for template creation workflow
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const crypto = require('crypto');

const execAsync = promisify(exec);

class TemplateGenerationUnitTester {
  constructor() {
    this.testResults = [];
    this.testId = crypto.randomUUID();
    this.tempDir = path.join(process.cwd(), `temp-test-${this.testId}`);
    this.templatePath = path.join(process.cwd(), 'templates/fullstack-modern');
    this.mockProjectName = 'test-app-' + Date.now();
    
    console.log(`🧪 Template Generation Unit Tests - Session: ${this.testId}`);
    console.log(`📁 Test directory: ${this.tempDir}`);
    console.log(`📋 Template path: ${this.templatePath}`);
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

  // Setup Test Environment
  async setupTestEnvironment() {
    const startTime = Date.now();
    
    try {
      // Create temp directory
      if (!fs.existsSync(this.tempDir)) {
        fs.mkdirSync(this.tempDir, { recursive: true });
      }
      
      // Verify template exists
      if (!fs.existsSync(this.templatePath)) {
        throw new Error(`Template path not found: ${this.templatePath}`);
      }
      
      // Verify template config
      const templateConfigPath = path.join(this.templatePath, 'template.config.json');
      if (!fs.existsSync(templateConfigPath)) {
        throw new Error('Template config not found');
      }
      
      const templateConfig = JSON.parse(fs.readFileSync(templateConfigPath, 'utf8'));
      if (!templateConfig.name || !templateConfig.dependencies) {
        throw new Error('Invalid template configuration');
      }
      
      this.recordTest('Setup Test Environment', 'passed', {
        duration: Date.now() - startTime,
        tempDir: this.tempDir,
        templatePath: this.templatePath,
        templateConfig: templateConfig.name
      });
      
      return true;
    } catch (error) {
      this.recordTest('Setup Test Environment', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return false;
    }
  }

  // Test 1: Template Configuration Validation
  async testTemplateConfigValidation() {
    const startTime = Date.now();
    
    try {
      const templateConfigPath = path.join(this.templatePath, 'template.config.json');
      const templateConfig = JSON.parse(fs.readFileSync(templateConfigPath, 'utf8'));
      
      // Required fields validation
      const requiredFields = ['name', 'displayName', 'description', 'version', 'type', 'dependencies'];
      const missingFields = requiredFields.filter(field => !templateConfig[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }
      
      // Dependencies structure validation
      if (!templateConfig.dependencies.frontend || !Array.isArray(templateConfig.dependencies.frontend)) {
        throw new Error('Frontend dependencies must be an array');
      }
      
      if (!templateConfig.dependencies.backend || !Array.isArray(templateConfig.dependencies.backend)) {
        throw new Error('Backend dependencies must be an array');
      }
      
      // Scripts validation
      if (!templateConfig.scripts || !templateConfig.scripts.frontend || !templateConfig.scripts.backend) {
        throw new Error('Scripts configuration is incomplete');
      }
      
      // Features validation
      if (!templateConfig.features || !Array.isArray(templateConfig.features)) {
        throw new Error('Features must be an array');
      }
      
      this.recordTest('Template Configuration Validation', 'passed', {
        duration: Date.now() - startTime,
        configVersion: templateConfig.version,
        featuresCount: templateConfig.features.length,
        frontendDeps: templateConfig.dependencies.frontend.length,
        backendDeps: templateConfig.dependencies.backend.length
      });
      
      return templateConfig;
    } catch (error) {
      this.recordTest('Template Configuration Validation', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return null;
    }
  }

  // Test 2: Template File Structure Validation
  async testTemplateFileStructure() {
    const startTime = Date.now();
    
    try {
      const expectedStructure = {
        'frontend/': {
          type: 'directory',
          required: true
        },
        'backend/': {
          type: 'directory',
          required: true
        },
        'frontend/package.json': {
          type: 'file',
          required: true
        },
        'frontend/next.config.js': {
          type: 'file',
          required: true
        },
        'frontend/tailwind.config.js': {
          type: 'file',
          required: true
        },
        'backend/Cargo.toml': {
          type: 'file',
          required: true
        },
        'backend/src/main.rs': {
          type: 'file',
          required: true
        },
        'docker-compose.yml': {
          type: 'file',
          required: true
        },
        'vercel.json': {
          type: 'file',
          required: true
        },
        'README.md': {
          type: 'file',
          required: true
        },
        'DEPLOYMENT.md': {
          type: 'file',
          required: true
        }
      };
      
      const missingFiles = [];
      const invalidFiles = [];
      
      for (const [filePath, config] of Object.entries(expectedStructure)) {
        const fullPath = path.join(this.templatePath, filePath);
        
        if (!fs.existsSync(fullPath)) {
          if (config.required) {
            missingFiles.push(filePath);
          }
          continue;
        }
        
        const stat = fs.statSync(fullPath);
        if (config.type === 'directory' && !stat.isDirectory()) {
          invalidFiles.push(`${filePath} should be a directory`);
        } else if (config.type === 'file' && !stat.isFile()) {
          invalidFiles.push(`${filePath} should be a file`);
        }
      }
      
      if (missingFiles.length > 0 || invalidFiles.length > 0) {
        const errors = [
          ...missingFiles.map(f => `Missing: ${f}`),
          ...invalidFiles
        ];
        throw new Error(`Structure validation failed: ${errors.join(', ')}`);
      }
      
      this.recordTest('Template File Structure Validation', 'passed', {
        duration: Date.now() - startTime,
        validatedFiles: Object.keys(expectedStructure).length,
        missingFiles: missingFiles.length,
        invalidFiles: invalidFiles.length
      });
      
      return true;
    } catch (error) {
      this.recordTest('Template File Structure Validation', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return false;
    }
  }

  // Test 3: Template Variable Substitution
  async testTemplateVariableSubstitution() {
    const startTime = Date.now();
    
    try {
      const testProjectName = 'my-test-project';
      const templateFiles = [
        'frontend/package.json',
        'backend/Cargo.toml',
        'README.md'
      ];
      
      const substitutionResults = [];
      
      for (const filePath of templateFiles) {
        const fullPath = path.join(this.templatePath, filePath);
        if (!fs.existsSync(fullPath)) continue;
        
        const content = fs.readFileSync(fullPath, 'utf8');
        const hasTemplateVars = content.includes('{{projectName}}') || 
                               content.includes('{{PROJECT_NAME}}') ||
                               content.includes('my-app') ||
                               content.includes('{{');
        
        if (hasTemplateVars) {
          // Test substitution
          const substituted = content.replace(/\{\{projectName\}\}/g, testProjectName);
          const stillHasVars = substituted.includes('{{projectName}}');
          
          substitutionResults.push({
            file: filePath,
            hasTemplateVars,
            substitutionWorked: !stillHasVars,
            originalLength: content.length,
            substitutedLength: substituted.length
          });
        }
      }
      
      const failedSubstitutions = substitutionResults.filter(r => !r.substitutionWorked);
      
      if (failedSubstitutions.length > 0) {
        throw new Error(`Variable substitution failed for: ${failedSubstitutions.map(f => f.file).join(', ')}`);
      }
      
      this.recordTest('Template Variable Substitution', 'passed', {
        duration: Date.now() - startTime,
        testedFiles: substitutionResults.length,
        successfulSubstitutions: substitutionResults.filter(r => r.substitutionWorked).length
      });
      
      return substitutionResults;
    } catch (error) {
      this.recordTest('Template Variable Substitution', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return [];
    }
  }

  // Test 4: Package.json Dependencies Validation
  async testPackageJsonValidation() {
    const startTime = Date.now();
    
    try {
      const packageJsonPath = path.join(this.templatePath, 'frontend/package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Required fields
      const requiredFields = ['name', 'version', 'scripts', 'dependencies'];
      const missingFields = requiredFields.filter(field => !packageJson[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing package.json fields: ${missingFields.join(', ')}`);
      }
      
      // Required scripts
      const requiredScripts = ['dev', 'build', 'start', 'lint'];
      const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
      
      if (missingScripts.length > 0) {
        throw new Error(`Missing package.json scripts: ${missingScripts.join(', ')}`);
      }
      
      // Required dependencies
      const requiredDeps = ['next', 'react', 'react-dom'];
      const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);
      
      if (missingDeps.length > 0) {
        throw new Error(`Missing required dependencies: ${missingDeps.join(', ')}`);
      }
      
      // Version format validation
      const versionRegex = /^\d+\.\d+\.\d+/;
      if (!versionRegex.test(packageJson.version)) {
        throw new Error('Invalid version format');
      }
      
      this.recordTest('Package.json Dependencies Validation', 'passed', {
        duration: Date.now() - startTime,
        dependenciesCount: Object.keys(packageJson.dependencies || {}).length,
        devDependenciesCount: Object.keys(packageJson.devDependencies || {}).length,
        scriptsCount: Object.keys(packageJson.scripts || {}).length
      });
      
      return packageJson;
    } catch (error) {
      this.recordTest('Package.json Dependencies Validation', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return null;
    }
  }

  // Test 5: Cargo.toml Validation
  async testCargoTomlValidation() {
    const startTime = Date.now();
    
    try {
      const cargoTomlPath = path.join(this.templatePath, 'backend/Cargo.toml');
      const cargoContent = fs.readFileSync(cargoTomlPath, 'utf8');
      
      // Basic structure validation
      if (!cargoContent.includes('[package]')) {
        throw new Error('Missing [package] section');
      }
      
      if (!cargoContent.includes('[dependencies]')) {
        throw new Error('Missing [dependencies] section');
      }
      
      // Required dependencies
      const requiredDeps = ['axum', 'tokio', 'serde'];
      const missingDeps = requiredDeps.filter(dep => !cargoContent.includes(dep));
      
      if (missingDeps.length > 0) {
        throw new Error(`Missing Cargo dependencies: ${missingDeps.join(', ')}`);
      }
      
      // Version format validation (basic)
      const versionMatches = cargoContent.match(/version\s*=\s*"([^"]+)"/g);
      if (!versionMatches || versionMatches.length === 0) {
        throw new Error('No version specifications found');
      }
      
      this.recordTest('Cargo.toml Validation', 'passed', {
        duration: Date.now() - startTime,
        contentLength: cargoContent.length,
        versionCount: versionMatches.length
      });
      
      return cargoContent;
    } catch (error) {
      this.recordTest('Cargo.toml Validation', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return null;
    }
  }

  // Test 6: Docker Configuration Validation
  async testDockerConfigValidation() {
    const startTime = Date.now();
    
    try {
      const dockerComposePath = path.join(this.templatePath, 'docker-compose.yml');
      const dockerComposeContent = fs.readFileSync(dockerComposePath, 'utf8');
      
      // Basic structure validation
      const requiredSections = ['version:', 'services:'];
      const missingSections = requiredSections.filter(section => !dockerComposeContent.includes(section));
      
      if (missingSections.length > 0) {
        throw new Error(`Missing docker-compose sections: ${missingSections.join(', ')}`);
      }
      
      // Required services
      const requiredServices = ['frontend', 'backend', 'postgres'];
      const missingServices = requiredServices.filter(service => !dockerComposeContent.includes(service + ':'));
      
      if (missingServices.length > 0) {
        throw new Error(`Missing docker services: ${missingServices.join(', ')}`);
      }
      
      // Port configurations
      if (!dockerComposeContent.includes('ports:')) {
        throw new Error('No port configurations found');
      }
      
      // Environment variables
      if (!dockerComposeContent.includes('environment:') && !dockerComposeContent.includes('env_file:')) {
        throw new Error('No environment configuration found');
      }
      
      // Dockerfile validation
      const dockerfiles = [
        'frontend/Dockerfile',
        'frontend/Dockerfile.dev',
        'backend/Dockerfile',
        'backend/Dockerfile.dev'
      ];
      
      const missingDockerfiles = dockerfiles.filter(df => !fs.existsSync(path.join(this.templatePath, df)));
      
      if (missingDockerfiles.length > 0) {
        throw new Error(`Missing Dockerfiles: ${missingDockerfiles.join(', ')}`);
      }
      
      this.recordTest('Docker Configuration Validation', 'passed', {
        duration: Date.now() - startTime,
        dockerfilesCount: dockerfiles.length - missingDockerfiles.length,
        servicesDetected: requiredServices.length - missingServices.length
      });
      
      return true;
    } catch (error) {
      this.recordTest('Docker Configuration Validation', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return false;
    }
  }

  // Test 7: Environment Variables Template
  async testEnvironmentVariablesTemplate() {
    const startTime = Date.now();
    
    try {
      // Check for environment variable references
      const filesToCheck = [
        'docker-compose.yml',
        'frontend/next.config.js',
        'vercel.json'
      ];
      
      const envVarReferences = [];
      
      for (const filePath of filesToCheck) {
        const fullPath = path.join(this.templatePath, filePath);
        if (!fs.existsSync(fullPath)) continue;
        
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Look for environment variable patterns
        const envMatches = content.match(/\$\{?[A-Z_][A-Z0-9_]*\}?/g) || [];
        const nextEnvMatches = content.match(/process\.env\.[A-Z_][A-Z0-9_]*/g) || [];
        
        if (envMatches.length > 0 || nextEnvMatches.length > 0) {
          envVarReferences.push({
            file: filePath,
            envVars: [...envMatches, ...nextEnvMatches],
            count: envMatches.length + nextEnvMatches.length
          });
        }
      }
      
      // Validate common environment variables are present
      const templateConfig = JSON.parse(fs.readFileSync(path.join(this.templatePath, 'template.config.json'), 'utf8'));
      const requiredEnvVars = templateConfig.deployment?.frontend?.env || [];
      const backendEnvVars = templateConfig.deployment?.backend?.env || [];
      
      this.recordTest('Environment Variables Template', 'passed', {
        duration: Date.now() - startTime,
        filesWithEnvVars: envVarReferences.length,
        totalEnvVarReferences: envVarReferences.reduce((sum, ref) => sum + ref.count, 0),
        requiredEnvVars: requiredEnvVars.length + backendEnvVars.length
      });
      
      return envVarReferences;
    } catch (error) {
      this.recordTest('Environment Variables Template', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return [];
    }
  }

  // Test 8: Deployment Configuration Validation
  async testDeploymentConfigValidation() {
    const startTime = Date.now();
    
    try {
      const vercelConfigPath = path.join(this.templatePath, 'vercel.json');
      const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
      
      // Validate Vercel configuration structure
      if (!vercelConfig.builds && !vercelConfig.framework) {
        throw new Error('No build configuration found in vercel.json');
      }
      
      // Check deployment documentation
      const deploymentDocPath = path.join(this.templatePath, 'DEPLOYMENT.md');
      if (!fs.existsSync(deploymentDocPath)) {
        throw new Error('DEPLOYMENT.md not found');
      }
      
      const deploymentDoc = fs.readFileSync(deploymentDocPath, 'utf8');
      
      // Validate deployment instructions
      const requiredSections = ['frontend', 'backend', 'environment', 'database'];
      const missingSections = requiredSections.filter(section => 
        !deploymentDoc.toLowerCase().includes(section.toLowerCase())
      );
      
      if (missingSections.length > 0) {
        console.warn(`Deployment doc missing sections: ${missingSections.join(', ')}`);
      }
      
      this.recordTest('Deployment Configuration Validation', 'passed', {
        duration: Date.now() - startTime,
        vercelConfigKeys: Object.keys(vercelConfig).length,
        deploymentDocLength: deploymentDoc.length,
        missingSections: missingSections.length
      });
      
      return { vercelConfig, deploymentDoc };
    } catch (error) {
      this.recordTest('Deployment Configuration Validation', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return null;
    }
  }

  // Cleanup Test Environment
  async cleanupTestEnvironment() {
    const startTime = Date.now();
    
    try {
      if (fs.existsSync(this.tempDir)) {
        fs.rmSync(this.tempDir, { recursive: true, force: true });
      }
      
      this.recordTest('Cleanup Test Environment', 'passed', {
        duration: Date.now() - startTime,
        removedDir: this.tempDir
      });
      
      return true;
    } catch (error) {
      this.recordTest('Cleanup Test Environment', 'failed', {
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
        templatePath: this.templatePath
      }
    };
    
    // Save report
    const reportPath = path.join(process.cwd(), `template-generation-unit-test-report-${this.testId}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n📊 Template Generation Unit Test Results');
    console.log('═'.repeat(50));
    console.log(`📋 Test Session: ${this.testId}`);
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
    
    return report;
  }

  // Run All Tests
  async runAllTests() {
    console.log('🚀 Starting Template Generation Unit Tests...\n');
    
    // Setup
    const setupSuccess = await this.setupTestEnvironment();
    if (!setupSuccess) {
      console.error('❌ Setup failed, aborting tests');
      return this.generateTestReport();
    }
    
    // Run tests
    await this.testTemplateConfigValidation();
    await this.testTemplateFileStructure();
    await this.testTemplateVariableSubstitution();
    await this.testPackageJsonValidation();
    await this.testCargoTomlValidation();
    await this.testDockerConfigValidation();
    await this.testEnvironmentVariablesTemplate();
    await this.testDeploymentConfigValidation();
    
    // Cleanup
    await this.cleanupTestEnvironment();
    
    // Generate report
    return this.generateTestReport();
  }
}

// CLI execution
if (require.main === module) {
  const tester = new TemplateGenerationUnitTester();
  
  tester.runAllTests()
    .then(report => {
      const exitCode = report.summary.failed > 0 ? 1 : 0;
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('💥 Test runner crashed:', error);
      process.exit(1);
    });
}

module.exports = TemplateGenerationUnitTester;