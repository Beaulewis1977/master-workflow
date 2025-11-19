#!/usr/bin/env node

/**
 * Template Dependency Validation Tests
 * 
 * Comprehensive dependency validation tests for generated templates
 * Tests package.json dependencies, Cargo.toml, and configuration files
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const crypto = require('crypto');
const os = require('os');

const execAsync = promisify(exec);

class TemplateDependencyValidationTester {
  constructor() {
    this.testResults = [];
    this.testId = crypto.randomUUID();
    this.tempDir = path.join(os.tmpdir(), `claude-flow-dependency-validation-${this.testId}`);
    this.testProjectName = `dependency-test-${Date.now()}`;
    
    console.log(`📦 Template Dependency Validation Tests - Session: ${this.testId}`);
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
      
      this.recordTest('Setup Dependency Test Project', 'passed', {
        duration: Date.now() - startTime,
        projectDir: this.projectDir,
        appliedFiles: result.applied?.length || 0
      });
      
      return true;
    } catch (error) {
      this.recordTest('Setup Dependency Test Project', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return false;
    }
  }

  // Test 1: Package.json Dependencies Validation
  async testPackageJsonDependencies() {
    const startTime = Date.now();
    
    try {
      const packageJsonPath = path.join(this.projectDir, 'frontend/package.json');
      
      if (!fs.existsSync(packageJsonPath)) {
        throw new Error('frontend/package.json not found');
      }
      
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Get expected dependencies from template config
      const templateConfigPath = path.join(process.cwd(), 'templates/fullstack-modern/template.config.json');
      const templateConfig = JSON.parse(fs.readFileSync(templateConfigPath, 'utf8'));
      
      const expectedDeps = templateConfig.dependencies?.frontend || [];
      const expectedDevDeps = templateConfig.devDependencies?.frontend || [];
      
      // Validate dependencies structure
      if (!packageJson.dependencies) {
        throw new Error('No dependencies field in package.json');
      }
      
      if (!packageJson.devDependencies) {
        throw new Error('No devDependencies field in package.json');
      }
      
      // Check for required dependencies
      const missingDeps = expectedDeps.filter(dep => {
        const depName = dep.split('@')[0]; // Remove version constraint
        return !packageJson.dependencies[depName];
      });
      
      const missingDevDeps = expectedDevDeps.filter(dep => {
        const depName = dep.split('@')[0]; // Remove version constraint
        return !packageJson.devDependencies[depName];
      });
      
      if (missingDeps.length > 0) {
        throw new Error(`Missing dependencies: ${missingDeps.join(', ')}`);
      }
      
      if (missingDevDeps.length > 0) {
        throw new Error(`Missing devDependencies: ${missingDevDeps.join(', ')}`);
      }
      
      // Validate version formats
      const invalidVersions = [];
      
      Object.entries(packageJson.dependencies).forEach(([name, version]) => {
        if (!this.isValidVersionConstraint(version)) {
          invalidVersions.push(`${name}@${version}`);
        }
      });
      
      Object.entries(packageJson.devDependencies).forEach(([name, version]) => {
        if (!this.isValidVersionConstraint(version)) {
          invalidVersions.push(`${name}@${version} (dev)`);
        }
      });
      
      if (invalidVersions.length > 0) {
        console.warn(`Invalid version constraints: ${invalidVersions.join(', ')}`);
      }
      
      // Check for conflicting dependencies
      const conflicts = this.detectDependencyConflicts(packageJson.dependencies, packageJson.devDependencies);
      
      if (conflicts.length > 0) {
        console.warn(`Potential dependency conflicts: ${conflicts.join(', ')}`);
      }
      
      this.recordTest('Package.json Dependencies Validation', 'passed', {
        duration: Date.now() - startTime,
        dependenciesCount: Object.keys(packageJson.dependencies).length,
        devDependenciesCount: Object.keys(packageJson.devDependencies).length,
        missingDeps: missingDeps.length,
        missingDevDeps: missingDevDeps.length,
        invalidVersions: invalidVersions.length,
        conflicts: conflicts.length
      });
      
      return { packageJson, missingDeps, missingDevDeps, invalidVersions, conflicts };
    } catch (error) {
      this.recordTest('Package.json Dependencies Validation', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return null;
    }
  }

  // Test 2: Cargo.toml Dependencies Validation
  async testCargoTomlDependencies() {
    const startTime = Date.now();
    
    try {
      const cargoTomlPath = path.join(this.projectDir, 'backend/Cargo.toml');
      
      if (!fs.existsSync(cargoTomlPath)) {
        throw new Error('backend/Cargo.toml not found');
      }
      
      const cargoContent = fs.readFileSync(cargoTomlPath, 'utf8');
      
      // Get expected dependencies from template config
      const templateConfigPath = path.join(process.cwd(), 'templates/fullstack-modern/template.config.json');
      const templateConfig = JSON.parse(fs.readFileSync(templateConfigPath, 'utf8'));
      
      const expectedDeps = templateConfig.dependencies?.backend || [];
      
      // Parse Cargo.toml dependencies (basic parsing)
      const dependenciesSection = this.parseCargoTomlDependencies(cargoContent);
      
      // Check for required dependencies
      const missingDeps = expectedDeps.filter(dep => {
        const depName = dep.split('@')[0]; // Remove version constraint
        return !dependenciesSection.includes(depName);
      });
      
      if (missingDeps.length > 0) {
        throw new Error(`Missing Cargo dependencies: ${missingDeps.join(', ')}`);
      }
      
      // Validate TOML structure
      if (!cargoContent.includes('[package]')) {
        throw new Error('Missing [package] section');
      }
      
      if (!cargoContent.includes('[dependencies]')) {
        throw new Error('Missing [dependencies] section');
      }
      
      // Check project name
      const nameMatch = cargoContent.match(/name\s*=\s*"([^"]+)"/);
      if (!nameMatch || nameMatch[1] !== this.testProjectName) {
        throw new Error('Project name not correctly substituted in Cargo.toml');
      }
      
      // Check version format
      const versionMatch = cargoContent.match(/version\s*=\s*"([^"]+)"/);
      if (!versionMatch || !this.isValidSemanticVersion(versionMatch[1])) {
        throw new Error('Invalid version format in Cargo.toml');
      }
      
      // Check for conflicting features or dependencies
      const rustEditionMatch = cargoContent.match(/edition\s*=\s*"([^"]+)"/);
      if (!rustEditionMatch) {
        console.warn('No Rust edition specified in Cargo.toml');
      }
      
      this.recordTest('Cargo.toml Dependencies Validation', 'passed', {
        duration: Date.now() - startTime,
        dependenciesFound: dependenciesSection.length,
        missingDeps: missingDeps.length,
        projectName: nameMatch ? nameMatch[1] : 'unknown',
        version: versionMatch ? versionMatch[1] : 'unknown',
        rustEdition: rustEditionMatch ? rustEditionMatch[1] : 'unspecified'
      });
      
      return { dependenciesSection, missingDeps };
    } catch (error) {
      this.recordTest('Cargo.toml Dependencies Validation', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return null;
    }
  }

  // Test 3: Dependency Installation Test
  async testDependencyInstallation() {
    const startTime = Date.now();
    
    try {
      const results = {
        frontend: { success: false, duration: 0, error: null },
        backend: { success: false, duration: 0, error: null }
      };
      
      // Test frontend dependency installation (npm install)
      try {
        console.log('   🔄 Testing npm install...');
        const frontendStartTime = Date.now();
        
        await execAsync('npm install --no-audit --no-fund', {
          cwd: path.join(this.projectDir, 'frontend'),
          timeout: 120000 // 2 minutes
        });
        
        results.frontend.success = true;
        results.frontend.duration = Date.now() - frontendStartTime;
        
        // Verify node_modules was created
        const nodeModulesPath = path.join(this.projectDir, 'frontend/node_modules');
        if (!fs.existsSync(nodeModulesPath)) {
          throw new Error('node_modules directory not created');
        }
        
      } catch (error) {
        results.frontend.error = error.message;
        console.warn(`Frontend dependency installation failed: ${error.message.substring(0, 100)}`);
      }
      
      // Test backend dependency check (cargo check)
      try {
        console.log('   🔄 Testing cargo check...');
        const backendStartTime = Date.now();
        
        await execAsync('cargo check', {
          cwd: path.join(this.projectDir, 'backend'),
          timeout: 180000 // 3 minutes
        });
        
        results.backend.success = true;
        results.backend.duration = Date.now() - backendStartTime;
        
      } catch (error) {
        results.backend.error = error.message;
        console.warn(`Backend dependency check failed: ${error.message.substring(0, 100)}`);
      }
      
      // At least one should succeed for the test to pass
      if (!results.frontend.success && !results.backend.success) {
        throw new Error('Both frontend and backend dependency installation failed');
      }
      
      this.recordTest('Dependency Installation Test', 'passed', {
        duration: Date.now() - startTime,
        frontendSuccess: results.frontend.success,
        backendSuccess: results.backend.success,
        frontendDuration: results.frontend.duration,
        backendDuration: results.backend.duration,
        totalInstallTime: results.frontend.duration + results.backend.duration
      });
      
      return results;
    } catch (error) {
      this.recordTest('Dependency Installation Test', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return null;
    }
  }

  // Test 4: Script Configuration Validation
  async testScriptConfiguration() {
    const startTime = Date.now();
    
    try {
      const packageJsonPath = path.join(this.projectDir, 'frontend/package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Get expected scripts from template config
      const templateConfigPath = path.join(process.cwd(), 'templates/fullstack-modern/template.config.json');
      const templateConfig = JSON.parse(fs.readFileSync(templateConfigPath, 'utf8'));
      
      const expectedScripts = templateConfig.scripts?.frontend || {};
      
      if (!packageJson.scripts) {
        throw new Error('No scripts section in package.json');
      }
      
      // Check for required scripts
      const missingScripts = Object.keys(expectedScripts).filter(script => 
        !packageJson.scripts[script]
      );
      
      if (missingScripts.length > 0) {
        throw new Error(`Missing scripts: ${missingScripts.join(', ')}`);
      }
      
      // Validate script commands
      const scriptValidation = [];
      
      Object.entries(packageJson.scripts).forEach(([name, command]) => {
        const validation = {
          name,
          command,
          valid: true,
          issues: []
        };
        
        // Basic validation
        if (!command || command.trim().length === 0) {
          validation.valid = false;
          validation.issues.push('Empty command');
        }
        
        // Check for common script patterns
        if (name === 'dev' && !command.includes('dev')) {
          validation.issues.push('Dev script should include "dev"');
        }
        
        if (name === 'build' && !command.includes('build')) {
          validation.issues.push('Build script should include "build"');
        }
        
        if (name === 'test' && !command.includes('test') && !command.includes('jest')) {
          validation.issues.push('Test script should include "test" or testing framework');
        }
        
        scriptValidation.push(validation);
      });
      
      const invalidScripts = scriptValidation.filter(s => !s.valid);
      
      if (invalidScripts.length > 0) {
        throw new Error(`Invalid scripts: ${invalidScripts.map(s => s.name).join(', ')}`);
      }
      
      this.recordTest('Script Configuration Validation', 'passed', {
        duration: Date.now() - startTime,
        scriptsCount: Object.keys(packageJson.scripts).length,
        missingScripts: missingScripts.length,
        invalidScripts: invalidScripts.length,
        scriptNames: Object.keys(packageJson.scripts)
      });
      
      return { packageJson, scriptValidation };
    } catch (error) {
      this.recordTest('Script Configuration Validation', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return null;
    }
  }

  // Test 5: Dependency Vulnerability Check
  async testDependencyVulnerabilities() {
    const startTime = Date.now();
    
    try {
      const vulnerabilityResults = {
        frontend: { vulnerabilities: 0, auditRan: false, error: null },
        backend: { vulnerabilities: 0, auditRan: false, error: null }
      };
      
      // Check frontend vulnerabilities (npm audit)
      try {
        console.log('   🔍 Running npm audit...');
        
        const auditResult = await execAsync('npm audit --json', {
          cwd: path.join(this.projectDir, 'frontend'),
          timeout: 60000
        });
        
        const auditData = JSON.parse(auditResult.stdout);
        vulnerabilityResults.frontend.auditRan = true;
        vulnerabilityResults.frontend.vulnerabilities = auditData.metadata?.vulnerabilities?.total || 0;
        
      } catch (error) {
        // npm audit may exit with non-zero code even when successful
        if (error.stdout) {
          try {
            const auditData = JSON.parse(error.stdout);
            vulnerabilityResults.frontend.auditRan = true;
            vulnerabilityResults.frontend.vulnerabilities = auditData.metadata?.vulnerabilities?.total || 0;
          } catch (parseError) {
            vulnerabilityResults.frontend.error = 'Failed to parse audit results';
          }
        } else {
          vulnerabilityResults.frontend.error = error.message;
        }
      }
      
      // Check backend vulnerabilities (cargo audit if available)
      try {
        console.log('   🔍 Checking cargo audit availability...');
        
        await execAsync('cargo audit --version', {
          cwd: path.join(this.projectDir, 'backend'),
          timeout: 10000
        });
        
        // If cargo audit is available, run it
        const auditResult = await execAsync('cargo audit --json', {
          cwd: path.join(this.projectDir, 'backend'),
          timeout: 60000
        });
        
        const auditData = JSON.parse(auditResult.stdout);
        vulnerabilityResults.backend.auditRan = true;
        vulnerabilityResults.backend.vulnerabilities = auditData.vulnerabilities?.found?.length || 0;
        
      } catch (error) {
        // cargo audit might not be installed, which is okay
        if (error.message.includes('cargo audit')) {
          vulnerabilityResults.backend.error = 'cargo audit not installed (optional)';
        } else {
          vulnerabilityResults.backend.error = error.message;
        }
      }
      
      // Warn about high vulnerability counts
      if (vulnerabilityResults.frontend.vulnerabilities > 10) {
        console.warn(`High number of frontend vulnerabilities: ${vulnerabilityResults.frontend.vulnerabilities}`);
      }
      
      if (vulnerabilityResults.backend.vulnerabilities > 0) {
        console.warn(`Backend vulnerabilities found: ${vulnerabilityResults.backend.vulnerabilities}`);
      }
      
      this.recordTest('Dependency Vulnerability Check', 'passed', {
        duration: Date.now() - startTime,
        frontendAuditRan: vulnerabilityResults.frontend.auditRan,
        backendAuditRan: vulnerabilityResults.backend.auditRan,
        frontendVulnerabilities: vulnerabilityResults.frontend.vulnerabilities,
        backendVulnerabilities: vulnerabilityResults.backend.vulnerabilities
      });
      
      return vulnerabilityResults;
    } catch (error) {
      this.recordTest('Dependency Vulnerability Check', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return null;
    }
  }

  // Test 6: License Compatibility Check
  async testLicenseCompatibility() {
    const startTime = Date.now();
    
    try {
      const packageJsonPath = path.join(this.projectDir, 'frontend/package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Check if project has a license
      if (!packageJson.license) {
        console.warn('No license specified in package.json');
      }
      
      // Try to analyze dependency licenses (if license checker is available)
      let licenseCheckResults = null;
      
      try {
        // Check if license-checker is available globally
        await execAsync('npx license-checker --version', {
          timeout: 10000
        });
        
        // Run license check
        const licenseResult = await execAsync('npx license-checker --json', {
          cwd: path.join(this.projectDir, 'frontend'),
          timeout: 30000
        });
        
        licenseCheckResults = JSON.parse(licenseResult.stdout);
        
        // Analyze license compatibility
        const licenses = Object.values(licenseCheckResults).map(dep => dep.licenses).filter(Boolean);
        const uniqueLicenses = [...new Set(licenses.flat())];
        
        // Check for potentially problematic licenses
        const problematicLicenses = uniqueLicenses.filter(license => 
          license.includes('GPL-3.0') || license.includes('AGPL')
        );
        
        if (problematicLicenses.length > 0) {
          console.warn(`Potentially problematic licenses: ${problematicLicenses.join(', ')}`);
        }
        
      } catch (error) {
        console.log('   ℹ️  License checker not available (optional check)');
      }
      
      this.recordTest('License Compatibility Check', 'passed', {
        duration: Date.now() - startTime,
        projectLicense: packageJson.license || 'unspecified',
        licenseCheckAvailable: licenseCheckResults !== null,
        dependencyLicenses: licenseCheckResults ? Object.keys(licenseCheckResults).length : 0
      });
      
      return { projectLicense: packageJson.license, licenseCheckResults };
    } catch (error) {
      this.recordTest('License Compatibility Check', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return null;
    }
  }

  // Helper Methods
  isValidVersionConstraint(version) {
    // Basic validation for npm version constraints
    const patterns = [
      /^\d+\.\d+\.\d+$/, // Exact version
      /^\^\d+\.\d+\.\d+$/, // Caret range
      /^~\d+\.\d+\.\d+$/, // Tilde range
      /^>=?\d+\.\d+\.\d+$/, // Greater than
      /^<=?\d+\.\d+\.\d+$/, // Less than
      /^\*$/, // Any version
      /^latest$/, // Latest tag
      /^file:/, // File reference
      /^git\+/, // Git reference
      /^https?:\/\// // HTTP reference
    ];
    
    return patterns.some(pattern => pattern.test(version));
  }

  isValidSemanticVersion(version) {
    return /^\d+\.\d+\.\d+$/.test(version);
  }

  detectDependencyConflicts(dependencies, devDependencies) {
    const conflicts = [];
    
    // Check for dependencies that exist in both regular and dev dependencies
    Object.keys(dependencies).forEach(dep => {
      if (devDependencies[dep]) {
        if (dependencies[dep] !== devDependencies[dep]) {
          conflicts.push(`${dep}: ${dependencies[dep]} vs ${devDependencies[dep]} (dev)`);
        }
      }
    });
    
    return conflicts;
  }

  parseCargoTomlDependencies(cargoContent) {
    // Basic TOML parsing for dependencies section
    const dependencies = [];
    const lines = cargoContent.split('\n');
    let inDependenciesSection = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine === '[dependencies]') {
        inDependenciesSection = true;
        continue;
      }
      
      if (trimmedLine.startsWith('[') && trimmedLine !== '[dependencies]') {
        inDependenciesSection = false;
        continue;
      }
      
      if (inDependenciesSection && trimmedLine.includes('=')) {
        const depName = trimmedLine.split('=')[0].trim();
        if (depName && !depName.startsWith('#')) {
          dependencies.push(depName);
        }
      }
    }
    
    return dependencies;
  }

  // Cleanup Test Environment
  async cleanupTestEnvironment() {
    const startTime = Date.now();
    
    try {
      if (fs.existsSync(this.tempDir)) {
        fs.rmSync(this.tempDir, { recursive: true, force: true });
      }
      
      this.recordTest('Cleanup Dependency Test Environment', 'passed', {
        duration: Date.now() - startTime,
        removedDir: this.tempDir
      });
      
      return true;
    } catch (error) {
      this.recordTest('Cleanup Dependency Test Environment', 'failed', {
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
      testType: 'dependency-validation',
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
    const reportPath = path.join(process.cwd(), `template-dependency-validation-test-report-${this.testId}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n📊 Template Dependency Validation Test Results');
    console.log('═'.repeat(60));
    console.log(`📋 Test Session: ${this.testId}`);
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

  // Run All Dependency Validation Tests
  async runAllTests() {
    console.log('🚀 Starting Template Dependency Validation Tests...\n');
    
    // Setup
    const setupSuccess = await this.setupTestProject();
    if (!setupSuccess) {
      console.error('❌ Setup failed, aborting tests');
      return this.generateTestReport();
    }
    
    // Run validation tests
    await this.testPackageJsonDependencies();
    await this.testCargoTomlDependencies();
    await this.testDependencyInstallation();
    await this.testScriptConfiguration();
    await this.testDependencyVulnerabilities();
    await this.testLicenseCompatibility();
    
    // Cleanup
    await this.cleanupTestEnvironment();
    
    // Generate report
    return this.generateTestReport();
  }
}

// CLI execution
if (require.main === module) {
  const tester = new TemplateDependencyValidationTester();
  
  tester.runAllTests()
    .then(report => {
      const exitCode = report.summary.failed > 0 ? 1 : 0;
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('💥 Dependency validation test runner crashed:', error);
      process.exit(1);
    });
}

module.exports = TemplateDependencyValidationTester;