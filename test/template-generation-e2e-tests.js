#!/usr/bin/env node

/**
 * Template Generation End-to-End Tests
 * 
 * Complete end-to-end tests for Claude Flow 2.0 template generation
 * Tests the actual CLI command: npx claude-flow@2.0.0 create my-app --template fullstack-modern
 */

const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const crypto = require('crypto');
const os = require('os');

const execAsync = promisify(exec);

class TemplateGenerationE2ETester {
  constructor() {
    this.testResults = [];
    this.testId = crypto.randomUUID();
    this.tempDir = path.join(os.tmpdir(), `claude-flow-e2e-test-${this.testId}`);
    this.testProjectName = `e2e-test-app-${Date.now()}`;
    this.templateName = 'fullstack-modern';
    this.cliCommand = 'npx claude-flow@2.0.0';
    
    console.log(`🎭 Template Generation E2E Tests - Session: ${this.testId}`);
    console.log(`📁 Test directory: ${this.tempDir}`);
    console.log(`🎨 Template: ${this.templateName}`);
    console.log(`📦 Project: ${this.testProjectName}`);
    console.log(`⌨️  CLI Command: ${this.cliCommand}`);
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
    
    if (details.stdout) {
      console.log(`   Output: ${details.stdout.substring(0, 200)}${details.stdout.length > 200 ? '...' : ''}`);
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
      
      // Verify node and npm are available
      await execAsync('node --version', { timeout: 5000 });
      await execAsync('npm --version', { timeout: 5000 });
      
      // Verify npx is available
      await execAsync('npx --version', { timeout: 5000 });
      
      this.recordTest('Setup E2E Test Environment', 'passed', {
        duration: Date.now() - startTime,
        tempDir: this.tempDir,
        projectName: this.testProjectName,
        nodeVersion: (await execAsync('node --version')).stdout.trim(),
        npmVersion: (await execAsync('npm --version')).stdout.trim()
      });
      
      return true;
    } catch (error) {
      this.recordTest('Setup E2E Test Environment', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return false;
    }
  }

  // Test 1: CLI Command Help and Version
  async testCLIHelpAndVersion() {
    const startTime = Date.now();
    
    try {
      // Test help command
      let helpOutput;
      try {
        const helpResult = await execAsync(`${this.cliCommand} --help`, { 
          timeout: 30000,
          cwd: this.tempDir 
        });
        helpOutput = helpResult.stdout;
      } catch (error) {
        // Help might exit with code 1, check if we got output
        if (error.stdout) {
          helpOutput = error.stdout;
        } else {
          throw error;
        }
      }
      
      // Test version command
      let versionOutput;
      try {
        const versionResult = await execAsync(`${this.cliCommand} --version`, { 
          timeout: 30000,
          cwd: this.tempDir 
        });
        versionOutput = versionResult.stdout;
      } catch (error) {
        // Version might exit with code 1, check if we got output
        if (error.stdout) {
          versionOutput = error.stdout;
        } else {
          throw error;
        }
      }
      
      this.recordTest('CLI Command Help and Version', 'passed', {
        duration: Date.now() - startTime,
        helpOutputLength: helpOutput ? helpOutput.length : 0,
        versionOutputLength: versionOutput ? versionOutput.length : 0
      });
      
      return { helpOutput, versionOutput };
    } catch (error) {
      this.recordTest('CLI Command Help and Version', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return null;
    }
  }

  // Test 2: Full CLI Command Execution
  async testFullCLICommandExecution() {
    const startTime = Date.now();
    
    try {
      const command = `${this.cliCommand} create ${this.testProjectName} --template ${this.templateName}`;
      
      console.log(`   🚀 Executing: ${command}`);
      
      const result = await execAsync(command, {
        timeout: 120000, // 2 minutes timeout
        cwd: this.tempDir,
        env: { ...process.env, NODE_ENV: 'test' }
      });
      
      const projectDir = path.join(this.tempDir, this.testProjectName);
      
      // Verify project directory was created
      if (!fs.existsSync(projectDir)) {
        throw new Error(`Project directory not created: ${projectDir}`);
      }
      
      this.recordTest('Full CLI Command Execution', 'passed', {
        duration: Date.now() - startTime,
        command,
        projectDir,
        stdoutLength: result.stdout.length,
        stderrLength: result.stderr.length,
        exitCode: 0
      });
      
      return { projectDir, stdout: result.stdout, stderr: result.stderr };
    } catch (error) {
      this.recordTest('Full CLI Command Execution', 'failed', {
        duration: Date.now() - startTime,
        error: error.message,
        stdout: error.stdout || '',
        stderr: error.stderr || '',
        exitCode: error.code || -1
      });
      return null;
    }
  }

  // Test 3: Interactive CLI Mode Simulation
  async testInteractiveCLIMode() {
    const startTime = Date.now();
    
    try {
      const interactiveProjectName = `interactive-${this.testProjectName}`;
      
      // Simulate interactive mode using spawn
      const child = spawn('npx', ['claude-flow@2.0.0', 'create'], {
        cwd: this.tempDir,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      // Simulate user inputs
      setTimeout(() => {
        child.stdin.write(`${interactiveProjectName}\n`); // Project name
      }, 1000);
      
      setTimeout(() => {
        child.stdin.write('1\n'); // Template selection (first template)
      }, 2000);
      
      setTimeout(() => {
        child.stdin.write('n\n'); // Don't install dependencies
      }, 3000);
      
      setTimeout(() => {
        child.stdin.write('n\n'); // Don't initialize git
      }, 4000);
      
      const result = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          child.kill();
          reject(new Error('Interactive mode timeout'));
        }, 60000); // 1 minute timeout
        
        child.on('close', (code) => {
          clearTimeout(timeout);
          resolve({ code, stdout, stderr });
        });
        
        child.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
      
      const projectDir = path.join(this.tempDir, interactiveProjectName);
      const projectExists = fs.existsSync(projectDir);
      
      this.recordTest('Interactive CLI Mode Simulation', 'passed', {
        duration: Date.now() - startTime,
        projectName: interactiveProjectName,
        projectExists,
        exitCode: result.code,
        stdoutLength: result.stdout.length,
        stderrLength: result.stderr.length
      });
      
      return { projectDir, projectExists, ...result };
    } catch (error) {
      this.recordTest('Interactive CLI Mode Simulation', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return null;
    }
  }

  // Test 4: CLI with Invalid Template
  async testCLIWithInvalidTemplate() {
    const startTime = Date.now();
    
    try {
      const invalidTemplate = 'non-existent-template';
      const command = `${this.cliCommand} create invalid-project --template ${invalidTemplate}`;
      
      let errorCaught = false;
      let result;
      
      try {
        result = await execAsync(command, {
          timeout: 30000,
          cwd: this.tempDir
        });
      } catch (error) {
        errorCaught = true;
        result = error;
      }
      
      if (!errorCaught) {
        throw new Error('Expected command to fail with invalid template');
      }
      
      // Verify error message mentions the invalid template
      const errorMessage = result.stderr || result.stdout || result.message;
      if (!errorMessage.toLowerCase().includes('template') && 
          !errorMessage.toLowerCase().includes('not found')) {
        throw new Error('Error message should mention template not found');
      }
      
      this.recordTest('CLI with Invalid Template', 'passed', {
        duration: Date.now() - startTime,
        command,
        errorCaught: true,
        exitCode: result.code || -1,
        errorMessage: errorMessage.substring(0, 200)
      });
      
      return result;
    } catch (error) {
      this.recordTest('CLI with Invalid Template', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return null;
    }
  }

  // Test 5: CLI with Invalid Project Name
  async testCLIWithInvalidProjectName() {
    const startTime = Date.now();
    
    try {
      const invalidNames = ['', '123-invalid', 'invalid name with spaces', 'invalid/name'];
      let allTestsPassed = true;
      const results = [];
      
      for (const invalidName of invalidNames) {
        const command = `${this.cliCommand} create "${invalidName}" --template ${this.templateName}`;
        
        let errorCaught = false;
        try {
          await execAsync(command, {
            timeout: 30000,
            cwd: this.tempDir
          });
        } catch (error) {
          errorCaught = true;
          results.push({
            projectName: invalidName,
            errorCaught: true,
            exitCode: error.code || -1
          });
        }
        
        if (!errorCaught) {
          allTestsPassed = false;
          results.push({
            projectName: invalidName,
            errorCaught: false,
            exitCode: 0
          });
        }
      }
      
      if (!allTestsPassed) {
        throw new Error('Some invalid project names were accepted');
      }
      
      this.recordTest('CLI with Invalid Project Name', 'passed', {
        duration: Date.now() - startTime,
        testedNames: invalidNames.length,
        allErrorsCaught: allTestsPassed,
        results
      });
      
      return results;
    } catch (error) {
      this.recordTest('CLI with Invalid Project Name', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return null;
    }
  }

  // Test 6: CLI Output and Progress Indicators
  async testCLIOutputAndProgress() {
    const startTime = Date.now();
    
    try {
      const progressProjectName = `progress-${this.testProjectName}`;
      const command = `${this.cliCommand} create ${progressProjectName} --template ${this.templateName}`;
      
      const result = await execAsync(command, {
        timeout: 120000,
        cwd: this.tempDir
      });
      
      const output = result.stdout + result.stderr;
      
      // Check for expected output patterns
      const expectedPatterns = [
        /creating|generating|building/i,
        /success|complete|done/i,
        progressProjectName
      ];
      
      const missingPatterns = expectedPatterns.filter(pattern => !pattern.test(output));
      
      if (missingPatterns.length > 0) {
        console.warn(`Missing output patterns: ${missingPatterns.length}/${expectedPatterns.length}`);
      }
      
      // Check for error indicators
      const errorPatterns = [
        /error/i,
        /failed/i,
        /exception/i
      ];
      
      const foundErrors = errorPatterns.filter(pattern => pattern.test(output));
      
      if (foundErrors.length > 0) {
        throw new Error(`Unexpected error patterns in output: ${foundErrors.length}`);
      }
      
      this.recordTest('CLI Output and Progress Indicators', 'passed', {
        duration: Date.now() - startTime,
        outputLength: output.length,
        expectedPatternsFound: expectedPatterns.length - missingPatterns.length,
        errorPatternsFound: foundErrors.length
      });
      
      return { output, expectedPatterns: expectedPatterns.length - missingPatterns.length };
    } catch (error) {
      this.recordTest('CLI Output and Progress Indicators', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return null;
    }
  }

  // Test 7: Project Validation After CLI Generation
  async testProjectValidationAfterGeneration() {
    const startTime = Date.now();
    
    try {
      const projectDir = path.join(this.tempDir, this.testProjectName);
      
      if (!fs.existsSync(projectDir)) {
        throw new Error('Project directory not found');
      }
      
      // Validate project structure
      const requiredFiles = [
        'frontend/package.json',
        'backend/Cargo.toml',
        'docker-compose.yml',
        'README.md',
        'DEPLOYMENT.md',
        'vercel.json'
      ];
      
      const missingFiles = requiredFiles.filter(file => 
        !fs.existsSync(path.join(projectDir, file))
      );
      
      if (missingFiles.length > 0) {
        throw new Error(`Missing required files: ${missingFiles.join(', ')}`);
      }
      
      // Validate package.json
      const packageJsonPath = path.join(projectDir, 'frontend/package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      if (packageJson.name !== this.testProjectName) {
        throw new Error(`Project name mismatch: expected ${this.testProjectName}, got ${packageJson.name}`);
      }
      
      // Validate Cargo.toml
      const cargoTomlPath = path.join(projectDir, 'backend/Cargo.toml');
      const cargoContent = fs.readFileSync(cargoTomlPath, 'utf8');
      
      if (!cargoContent.includes(this.testProjectName)) {
        throw new Error('Project name not found in Cargo.toml');
      }
      
      // Validate README
      const readmePath = path.join(projectDir, 'README.md');
      const readmeContent = fs.readFileSync(readmePath, 'utf8');
      
      if (!readmeContent.includes(this.testProjectName)) {
        throw new Error('Project name not found in README.md');
      }
      
      this.recordTest('Project Validation After CLI Generation', 'passed', {
        duration: Date.now() - startTime,
        projectDir,
        requiredFilesPresent: requiredFiles.length - missingFiles.length,
        projectNameCorrect: true,
        readmeLength: readmeContent.length
      });
      
      return { projectDir, packageJson, cargoContent, readmeContent };
    } catch (error) {
      this.recordTest('Project Validation After CLI Generation', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return null;
    }
  }

  // Test 8: CLI Performance Benchmarking
  async testCLIPerformanceBenchmarking() {
    const startTime = Date.now();
    
    try {
      const benchmarkProjectName = `benchmark-${this.testProjectName}`;
      const command = `${this.cliCommand} create ${benchmarkProjectName} --template ${this.templateName}`;
      
      console.log('   ⏱️  Running performance benchmark...');
      
      const benchmarkStart = Date.now();
      const result = await execAsync(command, {
        timeout: 300000, // 5 minutes max
        cwd: this.tempDir
      });
      const benchmarkDuration = Date.now() - benchmarkStart;
      
      const projectDir = path.join(this.tempDir, benchmarkProjectName);
      
      // Count generated files
      const countFiles = (dir) => {
        let count = 0;
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const itemPath = path.join(dir, item);
          const stat = fs.statSync(itemPath);
          if (stat.isDirectory()) {
            count += countFiles(itemPath);
          } else {
            count++;
          }
        }
        return count;
      };
      
      const totalFiles = countFiles(projectDir);
      
      // Calculate metrics
      const filesPerSecond = totalFiles / (benchmarkDuration / 1000);
      const averageTimePerFile = benchmarkDuration / totalFiles;
      
      // Performance thresholds
      const maxDuration = 60000; // 1 minute max
      const minFilesPerSecond = 1; // At least 1 file per second
      
      if (benchmarkDuration > maxDuration) {
        throw new Error(`Generation took too long: ${benchmarkDuration}ms (max: ${maxDuration}ms)`);
      }
      
      if (filesPerSecond < minFilesPerSecond) {
        throw new Error(`Generation too slow: ${filesPerSecond.toFixed(2)} files/sec (min: ${minFilesPerSecond})`);
      }
      
      this.recordTest('CLI Performance Benchmarking', 'passed', {
        duration: Date.now() - startTime,
        generationDuration: benchmarkDuration,
        totalFiles,
        filesPerSecond: parseFloat(filesPerSecond.toFixed(2)),
        averageTimePerFile: parseFloat(averageTimePerFile.toFixed(2)),
        projectDir
      });
      
      return {
        benchmarkDuration,
        totalFiles,
        filesPerSecond,
        averageTimePerFile
      };
    } catch (error) {
      this.recordTest('CLI Performance Benchmarking', 'failed', {
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
        // Clean up all test projects
        const items = fs.readdirSync(this.tempDir);
        for (const item of items) {
          const itemPath = path.join(this.tempDir, item);
          if (fs.statSync(itemPath).isDirectory()) {
            fs.rmSync(itemPath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(itemPath);
          }
        }
        fs.rmdirSync(this.tempDir);
      }
      
      this.recordTest('Cleanup E2E Test Environment', 'passed', {
        duration: Date.now() - startTime,
        removedDir: this.tempDir
      });
      
      return true;
    } catch (error) {
      this.recordTest('Cleanup E2E Test Environment', 'failed', {
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
      testType: 'e2e',
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
        templateName: this.templateName,
        cliCommand: this.cliCommand
      }
    };
    
    // Save report
    const reportPath = path.join(process.cwd(), `template-generation-e2e-test-report-${this.testId}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n📊 Template Generation E2E Test Results');
    console.log('═'.repeat(60));
    console.log(`📋 Test Session: ${this.testId}`);
    console.log(`⌨️  CLI Command: ${this.cliCommand}`);
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

  // Run All E2E Tests
  async runAllTests() {
    console.log('🚀 Starting Template Generation E2E Tests...\n');
    
    // Setup
    const setupSuccess = await this.setupTestEnvironment();
    if (!setupSuccess) {
      console.error('❌ Setup failed, aborting tests');
      return this.generateTestReport();
    }
    
    // Run tests in order
    await this.testCLIHelpAndVersion();
    await this.testFullCLICommandExecution();
    await this.testInteractiveCLIMode();
    await this.testCLIWithInvalidTemplate();
    await this.testCLIWithInvalidProjectName();
    await this.testCLIOutputAndProgress();
    await this.testProjectValidationAfterGeneration();
    await this.testCLIPerformanceBenchmarking();
    
    // Cleanup
    await this.cleanupTestEnvironment();
    
    // Generate report
    return this.generateTestReport();
  }
}

// CLI execution
if (require.main === module) {
  const tester = new TemplateGenerationE2ETester();
  
  tester.runAllTests()
    .then(report => {
      const exitCode = report.summary.failed > 0 ? 1 : 0;
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('💥 E2E test runner crashed:', error);
      process.exit(1);
    });
}

module.exports = TemplateGenerationE2ETester;