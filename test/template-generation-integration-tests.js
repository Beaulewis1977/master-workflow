#!/usr/bin/env node

/**
 * Template Generation Integration Tests
 * 
 * End-to-end integration tests for Claude Flow 2.0 template generation
 * Tests the complete workflow from CLI command to project creation
 */

const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const crypto = require('crypto');
const os = require('os');

const execAsync = promisify(exec);

class TemplateGenerationIntegrationTester {
  constructor() {
    this.testResults = [];
    this.testId = crypto.randomUUID();
    this.tempDir = path.join(os.tmpdir(), `claude-flow-test-${this.testId}`);
    this.testProjectName = `test-app-${Date.now()}`;
    this.templateName = 'fullstack-modern';
    
    console.log(`🔗 Template Generation Integration Tests - Session: ${this.testId}`);
    console.log(`📁 Test directory: ${this.tempDir}`);
    console.log(`🎨 Template: ${this.templateName}`);
    console.log(`📦 Project: ${this.testProjectName}`);
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
      
      // Verify Claude Flow is available
      try {
        await execAsync('which npx', { timeout: 5000 });
      } catch (error) {
        throw new Error('npx command not available');
      }
      
      // Verify we have the scaffolder module
      const scaffolderPath = path.join(process.cwd(), 'engine/src/modules/scaffolder.ts');
      if (!fs.existsSync(scaffolderPath)) {
        throw new Error('Scaffolder module not found');
      }
      
      this.recordTest('Setup Integration Test Environment', 'passed', {
        duration: Date.now() - startTime,
        tempDir: this.tempDir,
        projectName: this.testProjectName
      });
      
      return true;
    } catch (error) {
      this.recordTest('Setup Integration Test Environment', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return false;
    }
  }

  // Test 1: CLI Command Execution
  async testCLICommandExecution() {
    const startTime = Date.now();
    
    try {
      // Test the scaffolder directly first
      const { createFromTemplate } = require('../engine/src/modules/scaffolder.ts');
      
      if (typeof createFromTemplate !== 'function') {
        throw new Error('createFromTemplate function not available');
      }
      
      // Test with mock project
      const result = createFromTemplate(this.templateName, this.testProjectName, this.tempDir);
      
      if (!result || !result.projectDir) {
        throw new Error('Template creation failed - no result returned');
      }
      
      // Verify project directory was created
      if (!fs.existsSync(result.projectDir)) {
        throw new Error(`Project directory not created: ${result.projectDir}`);
      }
      
      this.recordTest('CLI Command Execution', 'passed', {
        duration: Date.now() - startTime,
        projectDir: result.projectDir,
        appliedFiles: result.applied?.length || 0,
        skippedFiles: result.skipped?.length || 0,
        templateName: result.template
      });
      
      return result;
    } catch (error) {
      this.recordTest('CLI Command Execution', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return null;
    }
  }

  // Test 2: Project Structure Generation
  async testProjectStructureGeneration() {
    const startTime = Date.now();
    
    try {
      const projectDir = path.join(this.tempDir, this.testProjectName);
      
      if (!fs.existsSync(projectDir)) {
        throw new Error('Project directory not found');
      }
      
      // Expected structure for fullstack-modern template
      const expectedStructure = [
        'frontend/',
        'backend/',
        'frontend/package.json',
        'frontend/next.config.js',
        'frontend/tailwind.config.js',
        'frontend/src/',
        'frontend/src/app/',
        'frontend/src/lib/',
        'frontend/src/store/',
        'backend/Cargo.toml',
        'backend/src/',
        'backend/src/main.rs',
        'backend/src/config.rs',
        'backend/src/database.rs',
        'backend/src/auth.rs',
        'backend/src/error.rs',
        'backend/src/models.rs',
        'backend/src/websocket.rs',
        'backend/migrations/',
        'docker-compose.yml',
        'vercel.json',
        'README.md',
        'DEPLOYMENT.md'
      ];
      
      const missingItems = [];
      const createdItems = [];
      
      for (const item of expectedStructure) {
        const itemPath = path.join(projectDir, item);
        if (fs.existsSync(itemPath)) {
          createdItems.push(item);
        } else {
          missingItems.push(item);
        }
      }
      
      if (missingItems.length > 0) {
        throw new Error(`Missing expected items: ${missingItems.join(', ')}`);
      }
      
      this.recordTest('Project Structure Generation', 'passed', {
        duration: Date.now() - startTime,
        expectedItems: expectedStructure.length,
        createdItems: createdItems.length,
        missingItems: missingItems.length,
        projectDir
      });
      
      return { createdItems, missingItems };
    } catch (error) {
      this.recordTest('Project Structure Generation', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return null;
    }
  }

  // Test 3: File Content Generation and Substitution
  async testFileContentGeneration() {
    const startTime = Date.now();
    
    try {
      const projectDir = path.join(this.tempDir, this.testProjectName);
      const filesToCheck = [
        'frontend/package.json',
        'backend/Cargo.toml',
        'README.md'
      ];
      
      const fileResults = [];
      
      for (const filePath of filesToCheck) {
        const fullPath = path.join(projectDir, filePath);
        if (!fs.existsSync(fullPath)) {
          throw new Error(`Expected file not found: ${filePath}`);
        }
        
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Check for proper variable substitution
        const hasUnsubstitutedVars = content.includes('{{projectName}}') || 
                                   content.includes('{{PROJECT_NAME}}');
        
        // Check for project name presence
        const hasProjectName = content.includes(this.testProjectName);
        
        // Validate file is not empty
        if (content.trim().length === 0) {
          throw new Error(`File is empty: ${filePath}`);
        }
        
        // Validate JSON files
        if (filePath.endsWith('.json')) {
          try {
            JSON.parse(content);
          } catch (jsonError) {
            throw new Error(`Invalid JSON in ${filePath}: ${jsonError.message}`);
          }
        }
        
        fileResults.push({
          file: filePath,
          contentLength: content.length,
          hasUnsubstitutedVars,
          hasProjectName,
          isValidJson: filePath.endsWith('.json')
        });
      }
      
      const invalidFiles = fileResults.filter(f => f.hasUnsubstitutedVars);
      if (invalidFiles.length > 0) {
        throw new Error(`Files with unsubstituted variables: ${invalidFiles.map(f => f.file).join(', ')}`);
      }
      
      this.recordTest('File Content Generation and Substitution', 'passed', {
        duration: Date.now() - startTime,
        checkedFiles: fileResults.length,
        totalContentLength: fileResults.reduce((sum, f) => sum + f.contentLength, 0),
        filesWithProjectName: fileResults.filter(f => f.hasProjectName).length
      });
      
      return fileResults;
    } catch (error) {
      this.recordTest('File Content Generation and Substitution', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return [];
    }
  }

  // Test 4: Package.json Generation and Validation
  async testPackageJsonGeneration() {
    const startTime = Date.now();
    
    try {
      const projectDir = path.join(this.tempDir, this.testProjectName);
      const packageJsonPath = path.join(projectDir, 'frontend/package.json');
      
      if (!fs.existsSync(packageJsonPath)) {
        throw new Error('frontend/package.json not generated');
      }
      
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Validate structure
      const requiredFields = ['name', 'version', 'scripts', 'dependencies'];
      const missingFields = requiredFields.filter(field => !packageJson[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing package.json fields: ${missingFields.join(', ')}`);
      }
      
      // Validate scripts
      const requiredScripts = ['dev', 'build', 'start', 'lint'];
      const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
      
      if (missingScripts.length > 0) {
        throw new Error(`Missing scripts: ${missingScripts.join(', ')}`);
      }
      
      // Validate dependencies
      const requiredDeps = ['next', 'react', 'react-dom'];
      const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);
      
      if (missingDeps.length > 0) {
        throw new Error(`Missing dependencies: ${missingDeps.join(', ')}`);
      }
      
      // Check project name substitution
      if (packageJson.name !== this.testProjectName) {
        throw new Error(`Project name not substituted correctly: expected ${this.testProjectName}, got ${packageJson.name}`);
      }
      
      this.recordTest('Package.json Generation and Validation', 'passed', {
        duration: Date.now() - startTime,
        projectName: packageJson.name,
        dependenciesCount: Object.keys(packageJson.dependencies).length,
        devDependenciesCount: Object.keys(packageJson.devDependencies || {}).length,
        scriptsCount: Object.keys(packageJson.scripts).length
      });
      
      return packageJson;
    } catch (error) {
      this.recordTest('Package.json Generation and Validation', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return null;
    }
  }

  // Test 5: Cargo.toml Generation and Validation
  async testCargoTomlGeneration() {
    const startTime = Date.now();
    
    try {
      const projectDir = path.join(this.tempDir, this.testProjectName);
      const cargoTomlPath = path.join(projectDir, 'backend/Cargo.toml');
      
      if (!fs.existsSync(cargoTomlPath)) {
        throw new Error('backend/Cargo.toml not generated');
      }
      
      const cargoContent = fs.readFileSync(cargoTomlPath, 'utf8');
      
      // Validate structure
      if (!cargoContent.includes('[package]')) {
        throw new Error('Missing [package] section');
      }
      
      if (!cargoContent.includes('[dependencies]')) {
        throw new Error('Missing [dependencies] section');
      }
      
      // Check project name substitution
      const nameMatch = cargoContent.match(/name\s*=\s*"([^"]+)"/);
      if (!nameMatch || nameMatch[1] !== this.testProjectName) {
        throw new Error(`Project name not substituted in Cargo.toml`);
      }
      
      // Validate dependencies
      const requiredDeps = ['axum', 'tokio', 'serde'];
      const missingDeps = requiredDeps.filter(dep => !cargoContent.includes(dep));
      
      if (missingDeps.length > 0) {
        throw new Error(`Missing Cargo dependencies: ${missingDeps.join(', ')}`);
      }
      
      this.recordTest('Cargo.toml Generation and Validation', 'passed', {
        duration: Date.now() - startTime,
        projectName: nameMatch[1],
        contentLength: cargoContent.length,
        dependenciesFound: requiredDeps.length - missingDeps.length
      });
      
      return cargoContent;
    } catch (error) {
      this.recordTest('Cargo.toml Generation and Validation', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return null;
    }
  }

  // Test 6: Docker Configuration Generation
  async testDockerConfigGeneration() {
    const startTime = Date.now();
    
    try {
      const projectDir = path.join(this.tempDir, this.testProjectName);
      
      // Check docker-compose.yml
      const dockerComposePath = path.join(projectDir, 'docker-compose.yml');
      if (!fs.existsSync(dockerComposePath)) {
        throw new Error('docker-compose.yml not generated');
      }
      
      const dockerComposeContent = fs.readFileSync(dockerComposePath, 'utf8');
      
      // Validate structure
      if (!dockerComposeContent.includes('version:')) {
        throw new Error('Missing version in docker-compose.yml');
      }
      
      if (!dockerComposeContent.includes('services:')) {
        throw new Error('Missing services in docker-compose.yml');
      }
      
      // Check Dockerfiles
      const dockerfiles = [
        'frontend/Dockerfile',
        'frontend/Dockerfile.dev',
        'backend/Dockerfile',
        'backend/Dockerfile.dev'
      ];
      
      const missingDockerfiles = dockerfiles.filter(df => 
        !fs.existsSync(path.join(projectDir, df))
      );
      
      if (missingDockerfiles.length > 0) {
        throw new Error(`Missing Dockerfiles: ${missingDockerfiles.join(', ')}`);
      }
      
      // Validate Dockerfile content
      const frontendDockerfile = fs.readFileSync(path.join(projectDir, 'frontend/Dockerfile'), 'utf8');
      if (!frontendDockerfile.includes('FROM node:')) {
        throw new Error('Frontend Dockerfile missing Node.js base image');
      }
      
      const backendDockerfile = fs.readFileSync(path.join(projectDir, 'backend/Dockerfile'), 'utf8');
      if (!backendDockerfile.includes('FROM rust:')) {
        throw new Error('Backend Dockerfile missing Rust base image');
      }
      
      this.recordTest('Docker Configuration Generation', 'passed', {
        duration: Date.now() - startTime,
        dockerfilesGenerated: dockerfiles.length - missingDockerfiles.length,
        dockerComposeSize: dockerComposeContent.length
      });
      
      return true;
    } catch (error) {
      this.recordTest('Docker Configuration Generation', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return false;
    }
  }

  // Test 7: Environment Configuration
  async testEnvironmentConfiguration() {
    const startTime = Date.now();
    
    try {
      const projectDir = path.join(this.tempDir, this.testProjectName);
      
      // Check for environment configuration files
      const configFiles = [
        'vercel.json',
        'frontend/next.config.js'
      ];
      
      const missingConfigFiles = configFiles.filter(cf => 
        !fs.existsSync(path.join(projectDir, cf))
      );
      
      if (missingConfigFiles.length > 0) {
        throw new Error(`Missing config files: ${missingConfigFiles.join(', ')}`);
      }
      
      // Validate vercel.json
      const vercelConfigPath = path.join(projectDir, 'vercel.json');
      const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
      
      if (!vercelConfig.framework && !vercelConfig.builds) {
        throw new Error('Vercel config missing framework or builds configuration');
      }
      
      // Validate next.config.js
      const nextConfigPath = path.join(projectDir, 'frontend/next.config.js');
      const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
      
      if (!nextConfigContent.includes('module.exports')) {
        throw new Error('next.config.js missing module.exports');
      }
      
      this.recordTest('Environment Configuration', 'passed', {
        duration: Date.now() - startTime,
        configFilesGenerated: configFiles.length - missingConfigFiles.length,
        vercelConfigKeys: Object.keys(vercelConfig).length
      });
      
      return true;
    } catch (error) {
      this.recordTest('Environment Configuration', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return false;
    }
  }

  // Test 8: Source Code Generation
  async testSourceCodeGeneration() {
    const startTime = Date.now();
    
    try {
      const projectDir = path.join(this.tempDir, this.testProjectName);
      
      // Frontend source files
      const frontendSources = [
        'frontend/src/app/page.tsx',
        'frontend/src/app/layout.tsx',
        'frontend/src/app/providers.tsx',
        'frontend/src/lib/api/client.ts',
        'frontend/src/store/auth-store.ts'
      ];
      
      // Backend source files
      const backendSources = [
        'backend/src/main.rs',
        'backend/src/config.rs',
        'backend/src/database.rs',
        'backend/src/auth.rs',
        'backend/src/models.rs'
      ];
      
      const allSources = [...frontendSources, ...backendSources];
      const missingSources = allSources.filter(sf => 
        !fs.existsSync(path.join(projectDir, sf))
      );
      
      if (missingSources.length > 0) {
        throw new Error(`Missing source files: ${missingSources.join(', ')}`);
      }
      
      // Validate TypeScript files have content
      for (const tsFile of frontendSources.filter(f => f.endsWith('.tsx') || f.endsWith('.ts'))) {
        const filePath = path.join(projectDir, tsFile);
        const content = fs.readFileSync(filePath, 'utf8');
        
        if (content.trim().length < 10) {
          throw new Error(`TypeScript file too short: ${tsFile}`);
        }
        
        // Basic syntax check
        if (tsFile.endsWith('.tsx') && !content.includes('export')) {
          throw new Error(`React component missing export: ${tsFile}`);
        }
      }
      
      // Validate Rust files have content
      for (const rustFile of backendSources) {
        const filePath = path.join(projectDir, rustFile);
        const content = fs.readFileSync(filePath, 'utf8');
        
        if (content.trim().length < 10) {
          throw new Error(`Rust file too short: ${rustFile}`);
        }
      }
      
      this.recordTest('Source Code Generation', 'passed', {
        duration: Date.now() - startTime,
        frontendSources: frontendSources.length,
        backendSources: backendSources.length,
        totalSources: allSources.length - missingSources.length
      });
      
      return true;
    } catch (error) {
      this.recordTest('Source Code Generation', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return false;
    }
  }

  // Test 9: Documentation Generation
  async testDocumentationGeneration() {
    const startTime = Date.now();
    
    try {
      const projectDir = path.join(this.tempDir, this.testProjectName);
      
      // Check documentation files
      const docFiles = [
        'README.md',
        'DEPLOYMENT.md'
      ];
      
      const missingDocs = docFiles.filter(df => 
        !fs.existsSync(path.join(projectDir, df))
      );
      
      if (missingDocs.length > 0) {
        throw new Error(`Missing documentation: ${missingDocs.join(', ')}`);
      }
      
      // Validate README.md
      const readmePath = path.join(projectDir, 'README.md');
      const readmeContent = fs.readFileSync(readmePath, 'utf8');
      
      if (!readmeContent.includes(this.testProjectName)) {
        throw new Error('README.md missing project name');
      }
      
      if (readmeContent.length < 100) {
        throw new Error('README.md too short');
      }
      
      // Validate DEPLOYMENT.md
      const deploymentPath = path.join(projectDir, 'DEPLOYMENT.md');
      const deploymentContent = fs.readFileSync(deploymentPath, 'utf8');
      
      if (deploymentContent.length < 100) {
        throw new Error('DEPLOYMENT.md too short');
      }
      
      const requiredSections = ['frontend', 'backend'];
      const missingSections = requiredSections.filter(section => 
        !deploymentContent.toLowerCase().includes(section.toLowerCase())
      );
      
      if (missingSections.length > 0) {
        console.warn(`DEPLOYMENT.md missing sections: ${missingSections.join(', ')}`);
      }
      
      this.recordTest('Documentation Generation', 'passed', {
        duration: Date.now() - startTime,
        readmeLength: readmeContent.length,
        deploymentLength: deploymentContent.length,
        docFilesGenerated: docFiles.length
      });
      
      return true;
    } catch (error) {
      this.recordTest('Documentation Generation', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return false;
    }
  }

  // Cleanup Test Environment
  async cleanupTestEnvironment() {
    const startTime = Date.now();
    
    try {
      if (fs.existsSync(this.tempDir)) {
        fs.rmSync(this.tempDir, { recursive: true, force: true });
      }
      
      this.recordTest('Cleanup Integration Test Environment', 'passed', {
        duration: Date.now() - startTime,
        removedDir: this.tempDir
      });
      
      return true;
    } catch (error) {
      this.recordTest('Cleanup Integration Test Environment', 'failed', {
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
      testType: 'integration',
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
        templateName: this.templateName
      }
    };
    
    // Save report
    const reportPath = path.join(process.cwd(), `template-generation-integration-test-report-${this.testId}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n📊 Template Generation Integration Test Results');
    console.log('═'.repeat(60));
    console.log(`📋 Test Session: ${this.testId}`);
    console.log(`🎨 Template: ${this.templateName}`);
    console.log(`📦 Project: ${this.testProjectName}`);
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

  // Run All Integration Tests
  async runAllTests() {
    console.log('🚀 Starting Template Generation Integration Tests...\n');
    
    // Setup
    const setupSuccess = await this.setupTestEnvironment();
    if (!setupSuccess) {
      console.error('❌ Setup failed, aborting tests');
      return this.generateTestReport();
    }
    
    // Run tests in order
    await this.testCLICommandExecution();
    await this.testProjectStructureGeneration();
    await this.testFileContentGeneration();
    await this.testPackageJsonGeneration();
    await this.testCargoTomlGeneration();
    await this.testDockerConfigGeneration();
    await this.testEnvironmentConfiguration();
    await this.testSourceCodeGeneration();
    await this.testDocumentationGeneration();
    
    // Cleanup
    await this.cleanupTestEnvironment();
    
    // Generate report
    return this.generateTestReport();
  }
}

// CLI execution
if (require.main === module) {
  const tester = new TemplateGenerationIntegrationTester();
  
  tester.runAllTests()
    .then(report => {
      const exitCode = report.summary.failed > 0 ? 1 : 0;
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('💥 Integration test runner crashed:', error);
      process.exit(1);
    });
}

module.exports = TemplateGenerationIntegrationTester;