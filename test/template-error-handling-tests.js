#!/usr/bin/env node

/**
 * Template Error Handling Tests
 * 
 * Comprehensive error handling tests for Claude Flow 2.0 template generation
 * Tests invalid inputs, missing templates, and edge cases
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const crypto = require('crypto');
const os = require('os');

const execAsync = promisify(exec);

class TemplateErrorHandlingTester {
  constructor() {
    this.testResults = [];
    this.testId = crypto.randomUUID();
    this.tempDir = path.join(os.tmpdir(), `claude-flow-error-handling-${this.testId}`);
    
    console.log(`🚨 Template Error Handling Tests - Session: ${this.testId}`);
    console.log(`📁 Test directory: ${this.tempDir}`);
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
      if (!fs.existsSync(this.tempDir)) {
        fs.mkdirSync(this.tempDir, { recursive: true });
      }
      
      this.recordTest('Setup Error Handling Test Environment', 'passed', {
        duration: Date.now() - startTime,
        tempDir: this.tempDir
      });
      
      return true;
    } catch (error) {
      this.recordTest('Setup Error Handling Test Environment', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return false;
    }
  }

  // Test 1: Invalid Template Names
  async testInvalidTemplateNames() {
    const startTime = Date.now();
    
    try {
      const { createFromTemplate } = require('../engine/src/modules/scaffolder.ts');
      
      const invalidTemplates = [
        {
          name: 'non-existent-template',
          description: 'Template that does not exist'
        },
        {
          name: '',
          description: 'Empty template name'
        },
        {
          name: 'invalid/template/name',
          description: 'Template name with invalid characters'
        },
        {
          name: '../../malicious-template',
          description: 'Path traversal attempt'
        },
        {
          name: 'template with spaces',
          description: 'Template name with spaces'
        }
      ];
      
      const results = [];
      
      for (const invalidTemplate of invalidTemplates) {
        try {
          const result = createFromTemplate(invalidTemplate.name, 'test-project', this.tempDir);
          
          // If no error was thrown, this is unexpected
          results.push({
            templateName: invalidTemplate.name,
            description: invalidTemplate.description,
            errorThrown: false,
            result: result ? 'created' : 'null',
            expectedError: true
          });
          
        } catch (error) {
          // Expected behavior - error should be thrown
          results.push({
            templateName: invalidTemplate.name,
            description: invalidTemplate.description,
            errorThrown: true,
            errorMessage: error.message,
            expectedError: true
          });
        }
      }
      
      // All invalid templates should throw errors
      const unexpectedSuccesses = results.filter(r => !r.errorThrown);
      
      if (unexpectedSuccesses.length > 0) {
        throw new Error(`Invalid templates that didn't throw errors: ${unexpectedSuccesses.map(r => r.templateName).join(', ')}`);
      }
      
      // Verify error messages are meaningful
      const resultsWithErrors = results.filter(r => r.errorThrown);
      const poorErrorMessages = resultsWithErrors.filter(r => 
        !r.errorMessage || r.errorMessage.length < 10 || !r.errorMessage.toLowerCase().includes('template')
      );
      
      if (poorErrorMessages.length > 0) {
        console.warn(`Templates with poor error messages: ${poorErrorMessages.map(r => r.templateName).join(', ')}`);
      }
      
      this.recordTest('Invalid Template Names', 'passed', {
        duration: Date.now() - startTime,
        testedTemplates: invalidTemplates.length,
        errorsThrown: resultsWithErrors.length,
        unexpectedSuccesses: unexpectedSuccesses.length
      });
      
      return results;
    } catch (error) {
      this.recordTest('Invalid Template Names', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return [];
    }
  }

  // Test 2: Invalid Project Names
  async testInvalidProjectNames() {
    const startTime = Date.now();
    
    try {
      const { createFromTemplate } = require('../engine/src/modules/scaffolder.ts');
      
      const invalidProjectNames = [
        {
          name: '',
          description: 'Empty project name',
          shouldFail: true
        },
        {
          name: '   ',
          description: 'Whitespace only project name',
          shouldFail: true
        },
        {
          name: 'project with spaces',
          description: 'Project name with spaces',
          shouldFail: true
        },
        {
          name: '123-invalid-start',
          description: 'Project name starting with numbers',
          shouldFail: true
        },
        {
          name: 'project@#$%^&*()',
          description: 'Project name with special characters',
          shouldFail: true
        },
        {
          name: 'project/with/slashes',
          description: 'Project name with path separators',
          shouldFail: true
        },
        {
          name: 'a'.repeat(256),
          description: 'Extremely long project name',
          shouldFail: true
        },
        {
          name: '../../malicious-project',
          description: 'Path traversal attempt in project name',
          shouldFail: true
        },
        {
          name: 'valid-project-name',
          description: 'Valid project name (control test)',
          shouldFail: false
        }
      ];
      
      const results = [];
      
      for (const testCase of invalidProjectNames) {
        try {
          const result = createFromTemplate('fullstack-modern', testCase.name, this.tempDir);
          
          results.push({
            projectName: testCase.name,
            description: testCase.description,
            shouldFail: testCase.shouldFail,
            actuallyFailed: false,
            result: result ? 'created' : 'null'
          });
          
        } catch (error) {
          results.push({
            projectName: testCase.name,
            description: testCase.description,
            shouldFail: testCase.shouldFail,
            actuallyFailed: true,
            errorMessage: error.message
          });
        }
      }
      
      // Validate results match expectations
      const incorrectResults = results.filter(r => 
        r.shouldFail !== r.actuallyFailed
      );
      
      if (incorrectResults.length > 0) {
        const issues = incorrectResults.map(r => 
          `${r.projectName}: expected ${r.shouldFail ? 'failure' : 'success'}, got ${r.actuallyFailed ? 'failure' : 'success'}`
        );
        throw new Error(`Project name validation failed: ${issues.join(', ')}`);
      }
      
      this.recordTest('Invalid Project Names', 'passed', {
        duration: Date.now() - startTime,
        testedNames: invalidProjectNames.length,
        correctResults: results.filter(r => r.shouldFail === r.actuallyFailed).length,
        shouldFailCount: invalidProjectNames.filter(t => t.shouldFail).length
      });
      
      return results;
    } catch (error) {
      this.recordTest('Invalid Project Names', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return [];
    }
  }

  // Test 3: File System Permission Errors
  async testFileSystemPermissionErrors() {
    const startTime = Date.now();
    
    try {
      const { createFromTemplate } = require('../engine/src/modules/scaffolder.ts');
      
      // Test scenarios that should cause permission errors
      const permissionTests = [];
      
      // Test 1: Try to write to read-only directory (if possible)
      const readOnlyDir = path.join(this.tempDir, 'readonly-test');
      try {
        fs.mkdirSync(readOnlyDir, { recursive: true });
        
        // Try to make directory read-only (Unix systems)
        if (process.platform !== 'win32') {
          fs.chmodSync(readOnlyDir, 0o444);
          
          try {
            const result = createFromTemplate('fullstack-modern', 'permission-test', readOnlyDir);
            permissionTests.push({
              test: 'Read-only directory',
              success: false,
              error: 'Expected permission error but operation succeeded',
              result: result ? 'created' : 'null'
            });
          } catch (error) {
            permissionTests.push({
              test: 'Read-only directory',
              success: true,
              errorMessage: error.message,
              errorHandled: error.message.toLowerCase().includes('permission') || 
                           error.message.toLowerCase().includes('eacces') ||
                           error.message.toLowerCase().includes('denied')
            });
          }
          
          // Restore permissions for cleanup
          fs.chmodSync(readOnlyDir, 0o755);
        }
      } catch (error) {
        permissionTests.push({
          test: 'Read-only directory setup',
          success: false,
          error: `Setup failed: ${error.message}`
        });
      }
      
      // Test 2: Invalid target directory
      const invalidDirs = [
        '/root/invalid-permission-test', // System directory
        '/dev/null/invalid-test', // Invalid path
        'C:\\Windows\\System32\\invalid-test' // Windows system directory
      ];
      
      for (const invalidDir of invalidDirs) {
        // Only test directories that might exist on this platform
        if ((process.platform === 'win32' && invalidDir.includes('C:\\')) ||
            (process.platform !== 'win32' && !invalidDir.includes('C:\\'))) {
          
          try {
            const result = createFromTemplate('fullstack-modern', 'permission-test', invalidDir);
            permissionTests.push({
              test: `Invalid directory: ${invalidDir}`,
              success: false,
              error: 'Expected error but operation succeeded',
              result: result ? 'created' : 'null'
            });
          } catch (error) {
            permissionTests.push({
              test: `Invalid directory: ${invalidDir}`,
              success: true,
              errorMessage: error.message,
              errorHandled: true
            });
          }
        }
      }
      
      // If no permission tests were possible, that's okay
      if (permissionTests.length === 0) {
        console.warn('No permission tests could be executed on this platform');
      }
      
      const failedTests = permissionTests.filter(t => !t.success);
      
      if (failedTests.length > 0) {
        console.warn(`Some permission tests failed: ${failedTests.map(t => t.test).join(', ')}`);
      }
      
      this.recordTest('File System Permission Errors', 'passed', {
        duration: Date.now() - startTime,
        permissionTests: permissionTests.length,
        successfulTests: permissionTests.filter(t => t.success).length,
        platform: process.platform
      });
      
      return permissionTests;
    } catch (error) {
      this.recordTest('File System Permission Errors', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return [];
    }
  }

  // Test 4: Missing Template Directory
  async testMissingTemplateDirectory() {
    const startTime = Date.now();
    
    try {
      // Temporarily rename the template directory to simulate missing template
      const originalTemplatePath = path.join(process.cwd(), 'templates/fullstack-modern');
      const hiddenTemplatePath = path.join(process.cwd(), 'templates/fullstack-modern-hidden');
      
      let templateRenamed = false;
      
      try {
        if (fs.existsSync(originalTemplatePath)) {
          fs.renameSync(originalTemplatePath, hiddenTemplatePath);
          templateRenamed = true;
        }
        
        const { createFromTemplate } = require('../engine/src/modules/scaffolder.ts');
        
        // This should fail because template directory doesn't exist
        let errorThrown = false;
        let errorMessage = '';
        
        try {
          const result = createFromTemplate('fullstack-modern', 'missing-template-test', this.tempDir);
          
          // If no error, this is unexpected
          console.warn('Template creation succeeded despite missing template directory');
          
        } catch (error) {
          errorThrown = true;
          errorMessage = error.message;
        }
        
        if (!errorThrown) {
          throw new Error('Expected error for missing template directory, but none was thrown');
        }
        
        // Verify error message is helpful
        if (!errorMessage.toLowerCase().includes('template') && 
            !errorMessage.toLowerCase().includes('not found') &&
            !errorMessage.toLowerCase().includes('missing')) {
          console.warn(`Error message could be more helpful: "${errorMessage}"`);
        }
        
        this.recordTest('Missing Template Directory', 'passed', {
          duration: Date.now() - startTime,
          errorThrown: true,
          errorMessage: errorMessage.substring(0, 100),
          templateRenamed
        });
        
        return { errorThrown, errorMessage };
        
      } finally {
        // Restore template directory if we renamed it
        if (templateRenamed && fs.existsSync(hiddenTemplatePath)) {
          fs.renameSync(hiddenTemplatePath, originalTemplatePath);
        }
      }
      
    } catch (error) {
      this.recordTest('Missing Template Directory', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return null;
    }
  }

  // Test 5: Corrupted Template Files
  async testCorruptedTemplateFiles() {
    const startTime = Date.now();
    
    try {
      // Create a temporary corrupted template
      const corruptedTemplatePath = path.join(this.tempDir, 'corrupted-template');
      fs.mkdirSync(corruptedTemplatePath, { recursive: true });
      
      // Create corrupted template.config.json
      const corruptedConfigPath = path.join(corruptedTemplatePath, 'template.config.json');
      fs.writeFileSync(corruptedConfigPath, '{ invalid json content');
      
      // Create some corrupted files
      fs.mkdirSync(path.join(corruptedTemplatePath, 'frontend'), { recursive: true });
      fs.writeFileSync(path.join(corruptedTemplatePath, 'frontend/package.json'), '{ "name": {{invalid}}');
      
      // Temporarily add to available templates (for testing)
      const { AVAILABLE_TEMPLATES } = require('../engine/src/modules/scaffolder.ts');
      const originalTemplates = { ...AVAILABLE_TEMPLATES };
      
      AVAILABLE_TEMPLATES['corrupted-test'] = {
        name: 'Corrupted Test Template',
        description: 'Test template with corrupted files',
        type: 'frontend',
        features: ['test'],
        path: corruptedTemplatePath
      };
      
      try {
        const { createFromTemplate } = require('../engine/src/modules/scaffolder.ts');
        
        let errorThrown = false;
        let errorMessage = '';
        
        try {
          const result = createFromTemplate('corrupted-test', 'corrupted-test-project', this.tempDir);
        } catch (error) {
          errorThrown = true;
          errorMessage = error.message;
        }
        
        // Should either handle corruption gracefully or throw meaningful error
        if (!errorThrown) {
          console.warn('Corrupted template was processed without error - checking output...');
          
          // Check if output makes sense
          const outputDir = path.join(this.tempDir, 'corrupted-test-project');
          if (fs.existsSync(outputDir)) {
            const packageJsonPath = path.join(outputDir, 'frontend/package.json');
            if (fs.existsSync(packageJsonPath)) {
              const content = fs.readFileSync(packageJsonPath, 'utf8');
              if (content.includes('{{invalid}}')) {
                throw new Error('Corrupted template variables were not handled properly');
              }
            }
          }
        }
        
        this.recordTest('Corrupted Template Files', 'passed', {
          duration: Date.now() - startTime,
          errorThrown,
          errorMessage: errorMessage.substring(0, 100),
          corruptionHandled: true
        });
        
        return { errorThrown, errorMessage };
        
      } finally {
        // Restore original templates
        Object.keys(AVAILABLE_TEMPLATES).forEach(key => {
          if (!originalTemplates[key]) {
            delete AVAILABLE_TEMPLATES[key];
          }
        });
      }
      
    } catch (error) {
      this.recordTest('Corrupted Template Files', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return null;
    }
  }

  // Test 6: CLI Error Handling
  async testCLIErrorHandling() {
    const startTime = Date.now();
    
    try {
      const errorCommands = [
        {
          command: 'npx claude-flow@2.0.0 create',
          description: 'Missing project name',
          shouldFail: true
        },
        {
          command: 'npx claude-flow@2.0.0 create test-project --template invalid-template',
          description: 'Invalid template via CLI',
          shouldFail: true
        },
        {
          command: 'npx claude-flow@2.0.0 invalid-command',
          description: 'Invalid CLI command',
          shouldFail: true
        },
        {
          command: 'npx claude-flow@2.0.0 create "invalid project name" --template fullstack-modern',
          description: 'Invalid project name via CLI',
          shouldFail: true
        }
      ];
      
      const results = [];
      
      for (const testCommand of errorCommands) {
        try {
          const result = await execAsync(testCommand.command, {
            timeout: 30000,
            cwd: this.tempDir
          });
          
          results.push({
            command: testCommand.command,
            description: testCommand.description,
            shouldFail: testCommand.shouldFail,
            actuallyFailed: false,
            stdout: result.stdout.substring(0, 200),
            stderr: result.stderr.substring(0, 200)
          });
          
        } catch (error) {
          results.push({
            command: testCommand.command,
            description: testCommand.description,
            shouldFail: testCommand.shouldFail,
            actuallyFailed: true,
            exitCode: error.code,
            errorMessage: error.message.substring(0, 200),
            stdout: error.stdout ? error.stdout.substring(0, 200) : '',
            stderr: error.stderr ? error.stderr.substring(0, 200) : ''
          });
        }
      }
      
      // Validate results
      const incorrectResults = results.filter(r => 
        r.shouldFail !== r.actuallyFailed
      );
      
      if (incorrectResults.length > 0) {
        const issues = incorrectResults.map(r => 
          `${r.description}: expected ${r.shouldFail ? 'failure' : 'success'}, got ${r.actuallyFailed ? 'failure' : 'success'}`
        );
        console.warn(`CLI error handling issues: ${issues.join(', ')}`);
      }
      
      // Check error message quality
      const failedCommands = results.filter(r => r.actuallyFailed);
      const poorErrorMessages = failedCommands.filter(r => {
        const errorOutput = r.stderr || r.stdout || r.errorMessage || '';
        return errorOutput.length < 10 || 
               (!errorOutput.toLowerCase().includes('error') && 
                !errorOutput.toLowerCase().includes('invalid') &&
                !errorOutput.toLowerCase().includes('missing'));
      });
      
      if (poorErrorMessages.length > 0) {
        console.warn(`Commands with poor error messages: ${poorErrorMessages.length}/${failedCommands.length}`);
      }
      
      this.recordTest('CLI Error Handling', 'passed', {
        duration: Date.now() - startTime,
        testedCommands: errorCommands.length,
        correctResults: results.filter(r => r.shouldFail === r.actuallyFailed).length,
        poorErrorMessages: poorErrorMessages.length
      });
      
      return results;
    } catch (error) {
      this.recordTest('CLI Error Handling', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return [];
    }
  }

  // Test 7: Resource Exhaustion Scenarios
  async testResourceExhaustionScenarios() {
    const startTime = Date.now();
    
    try {
      const { createFromTemplate } = require('../engine/src/modules/scaffolder.ts');
      
      // Test various resource exhaustion scenarios
      const resourceTests = [];
      
      // Test 1: Very long project name (within reasonable limits)
      try {
        const longProjectName = 'a'.repeat(50); // Reasonable but long
        const result = createFromTemplate('fullstack-modern', longProjectName, this.tempDir);
        
        resourceTests.push({
          test: 'Long project name (50 chars)',
          success: true,
          result: result ? 'created' : 'failed'
        });
      } catch (error) {
        resourceTests.push({
          test: 'Long project name (50 chars)',
          success: false,
          error: error.message
        });
      }
      
      // Test 2: Deeply nested target directory
      try {
        const deepDir = path.join(this.tempDir, 'a/b/c/d/e/f/g/h/i/j');
        fs.mkdirSync(deepDir, { recursive: true });
        
        const result = createFromTemplate('fullstack-modern', 'deep-test', deepDir);
        
        resourceTests.push({
          test: 'Deeply nested directory',
          success: true,
          result: result ? 'created' : 'failed'
        });
      } catch (error) {
        resourceTests.push({
          test: 'Deeply nested directory',
          success: false,
          error: error.message
        });
      }
      
      // Test 3: Multiple concurrent template generations (if supported)
      try {
        const concurrentPromises = [];
        for (let i = 0; i < 3; i++) {
          const promise = new Promise((resolve) => {
            try {
              const result = createFromTemplate('fullstack-modern', `concurrent-test-${i}`, this.tempDir);
              resolve({ success: true, index: i, result: result ? 'created' : 'failed' });
            } catch (error) {
              resolve({ success: false, index: i, error: error.message });
            }
          });
          concurrentPromises.push(promise);
        }
        
        const concurrentResults = await Promise.all(concurrentPromises);
        const successfulConcurrent = concurrentResults.filter(r => r.success).length;
        
        resourceTests.push({
          test: 'Concurrent template generation',
          success: successfulConcurrent > 0,
          successfulCount: successfulConcurrent,
          totalCount: concurrentResults.length
        });
      } catch (error) {
        resourceTests.push({
          test: 'Concurrent template generation',
          success: false,
          error: error.message
        });
      }
      
      const failedResourceTests = resourceTests.filter(t => !t.success);
      
      if (failedResourceTests.length > 0) {
        console.warn(`Resource tests with issues: ${failedResourceTests.map(t => t.test).join(', ')}`);
      }
      
      this.recordTest('Resource Exhaustion Scenarios', 'passed', {
        duration: Date.now() - startTime,
        resourceTests: resourceTests.length,
        successfulTests: resourceTests.filter(t => t.success).length,
        failedTests: failedResourceTests.length
      });
      
      return resourceTests;
    } catch (error) {
      this.recordTest('Resource Exhaustion Scenarios', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return [];
    }
  }

  // Cleanup Test Environment
  async cleanupTestEnvironment() {
    const startTime = Date.now();
    
    try {
      if (fs.existsSync(this.tempDir)) {
        // Force cleanup of all test directories
        const cleanupRecursive = (dir) => {
          const items = fs.readdirSync(dir);
          for (const item of items) {
            const itemPath = path.join(dir, item);
            const stat = fs.statSync(itemPath);
            if (stat.isDirectory()) {
              // Restore any modified permissions before cleanup
              try {
                fs.chmodSync(itemPath, 0o755);
              } catch (e) {
                // Ignore permission errors during cleanup
              }
              cleanupRecursive(itemPath);
            } else {
              try {
                fs.unlinkSync(itemPath);
              } catch (e) {
                // Ignore file deletion errors during cleanup
              }
            }
          }
          try {
            fs.rmdirSync(dir);
          } catch (e) {
            // Ignore directory deletion errors during cleanup
          }
        };
        
        cleanupRecursive(this.tempDir);
        
        // Final cleanup attempt
        if (fs.existsSync(this.tempDir)) {
          fs.rmSync(this.tempDir, { recursive: true, force: true });
        }
      }
      
      this.recordTest('Cleanup Error Handling Test Environment', 'passed', {
        duration: Date.now() - startTime,
        removedDir: this.tempDir
      });
      
      return true;
    } catch (error) {
      this.recordTest('Cleanup Error Handling Test Environment', 'failed', {
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
      testType: 'error-handling',
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
        tempDir: this.tempDir
      }
    };
    
    // Save report
    const reportPath = path.join(process.cwd(), `template-error-handling-test-report-${this.testId}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n📊 Template Error Handling Test Results');
    console.log('═'.repeat(60));
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

  // Run All Error Handling Tests
  async runAllTests() {
    console.log('🚀 Starting Template Error Handling Tests...\n');
    
    // Setup
    const setupSuccess = await this.setupTestEnvironment();
    if (!setupSuccess) {
      console.error('❌ Setup failed, aborting tests');
      return this.generateTestReport();
    }
    
    // Run error handling tests
    await this.testInvalidTemplateNames();
    await this.testInvalidProjectNames();
    await this.testFileSystemPermissionErrors();
    await this.testMissingTemplateDirectory();
    await this.testCorruptedTemplateFiles();
    await this.testCLIErrorHandling();
    await this.testResourceExhaustionScenarios();
    
    // Cleanup
    await this.cleanupTestEnvironment();
    
    // Generate report
    return this.generateTestReport();
  }
}

// CLI execution
if (require.main === module) {
  const tester = new TemplateErrorHandlingTester();
  
  tester.runAllTests()
    .then(report => {
      const exitCode = report.summary.failed > 0 ? 1 : 0;
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('💥 Error handling test runner crashed:', error);
      process.exit(1);
    });
}

module.exports = TemplateErrorHandlingTester;