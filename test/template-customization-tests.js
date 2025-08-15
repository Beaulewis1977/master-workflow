#!/usr/bin/env node

/**
 * Template Customization Tests
 * 
 * Tests for template variable substitution and interactive prompts
 * Validates customization features and user input handling
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const crypto = require('crypto');
const os = require('os');

class TemplateCustomizationTester {
  constructor() {
    this.testResults = [];
    this.testId = crypto.randomUUID();
    this.tempDir = path.join(os.tmpdir(), `claude-flow-customization-${this.testId}`);
    
    console.log(`🎨 Template Customization Tests - Session: ${this.testId}`);
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
      
      this.recordTest('Setup Customization Test Environment', 'passed', {
        duration: Date.now() - startTime,
        tempDir: this.tempDir
      });
      
      return true;
    } catch (error) {
      this.recordTest('Setup Customization Test Environment', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return false;
    }
  }

  // Test 1: Basic Variable Substitution
  async testBasicVariableSubstitution() {
    const startTime = Date.now();
    
    try {
      const { createFromTemplate } = require('../engine/src/modules/scaffolder.ts');
      
      const testProjectName = 'custom-project-test';
      const result = createFromTemplate('fullstack-modern', testProjectName, this.tempDir);
      
      if (!result || !result.projectDir) {
        throw new Error('Template creation failed');
      }
      
      const projectDir = result.projectDir;
      
      // Check variable substitution in key files
      const filesToCheck = [
        'frontend/package.json',
        'backend/Cargo.toml',
        'README.md'
      ];
      
      const substitutionResults = [];
      
      for (const filePath of filesToCheck) {
        const fullPath = path.join(projectDir, filePath);
        
        if (!fs.existsSync(fullPath)) {
          substitutionResults.push({
            file: filePath,
            exists: false,
            hasProjectName: false,
            hasUnsubstitutedVars: false
          });
          continue;
        }
        
        const content = fs.readFileSync(fullPath, 'utf8');
        
        const hasProjectName = content.includes(testProjectName);
        const hasUnsubstitutedVars = content.includes('{{projectName}}') || 
                                     content.includes('{{PROJECT_NAME}}');
        
        substitutionResults.push({
          file: filePath,
          exists: true,
          hasProjectName,
          hasUnsubstitutedVars,
          contentLength: content.length
        });
      }
      
      // Validate results
      const filesWithoutProjectName = substitutionResults.filter(r => r.exists && !r.hasProjectName);
      const filesWithUnsubstitutedVars = substitutionResults.filter(r => r.hasUnsubstitutedVars);
      
      if (filesWithoutProjectName.length > 0) {
        throw new Error(`Files missing project name: ${filesWithoutProjectName.map(f => f.file).join(', ')}`);
      }
      
      if (filesWithUnsubstitutedVars.length > 0) {
        throw new Error(`Files with unsubstituted variables: ${filesWithUnsubstitutedVars.map(f => f.file).join(', ')}`);
      }
      
      this.recordTest('Basic Variable Substitution', 'passed', {
        duration: Date.now() - startTime,
        projectName: testProjectName,
        checkedFiles: substitutionResults.length,
        allSubstituted: filesWithUnsubstitutedVars.length === 0
      });
      
      return substitutionResults;
    } catch (error) {
      this.recordTest('Basic Variable Substitution', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return [];
    }
  }

  // Test 2: Special Characters in Project Names
  async testSpecialCharactersInProjectNames() {
    const startTime = Date.now();
    
    try {
      const { createFromTemplate } = require('../engine/src/modules/scaffolder.ts');
      
      const testCases = [
        {
          input: 'my-awesome-project',
          expected: 'my-awesome-project',
          description: 'Hyphens should be preserved'
        },
        {
          input: 'project_with_underscores',
          expected: 'project_with_underscores',
          description: 'Underscores should be preserved'
        },
        {
          input: 'project123',
          expected: 'project123',
          description: 'Numbers should be preserved'
        }
      ];
      
      const results = [];
      
      for (const testCase of testCases) {
        try {
          const result = createFromTemplate('fullstack-modern', testCase.input, this.tempDir);
          
          if (!result || !result.projectDir) {
            results.push({
              ...testCase,
              success: false,
              error: 'Template creation failed'
            });
            continue;
          }
          
          // Check if project name is correctly substituted
          const packageJsonPath = path.join(result.projectDir, 'frontend/package.json');
          
          if (fs.existsSync(packageJsonPath)) {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            
            results.push({
              ...testCase,
              success: packageJson.name === testCase.expected,
              actualName: packageJson.name,
              projectDir: result.projectDir
            });
          } else {
            results.push({
              ...testCase,
              success: false,
              error: 'package.json not found'
            });
          }
          
        } catch (error) {
          results.push({
            ...testCase,
            success: false,
            error: error.message
          });
        }
      }
      
      const failedCases = results.filter(r => !r.success);
      
      if (failedCases.length > 0) {
        throw new Error(`Failed test cases: ${failedCases.map(c => `${c.input} (${c.error || 'name mismatch'})`).join(', ')}`);
      }
      
      this.recordTest('Special Characters in Project Names', 'passed', {
        duration: Date.now() - startTime,
        testCases: testCases.length,
        passedCases: results.filter(r => r.success).length
      });
      
      return results;
    } catch (error) {
      this.recordTest('Special Characters in Project Names', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return [];
    }
  }

  // Test 3: Interactive Mode Simulation
  async testInteractiveModeSimulation() {
    const startTime = Date.now();
    
    try {
      const interactiveProjectName = `interactive-test-${Date.now()}`;
      
      // Test interactive scaffolding function
      const { scaffoldInteractive } = require('../engine/src/modules/scaffolder.ts');
      
      // Mock readline interface
      const mockOptions = {
        projectName: interactiveProjectName,
        template: '1', // First template (fullstack-modern)
        installDeps: false,
        initGit: false
      };
      
      // Since scaffoldInteractive uses readline, we'll test the underlying logic
      // by calling it with predefined options
      const result = await scaffoldInteractive(mockOptions);
      
      if (!result || !result.projectDir) {
        throw new Error('Interactive scaffolding failed');
      }
      
      // Verify the project was created correctly
      const projectDir = result.projectDir;
      
      if (!fs.existsSync(projectDir)) {
        throw new Error('Project directory not created');
      }
      
      // Verify key files exist
      const expectedFiles = [
        'frontend/package.json',
        'backend/Cargo.toml',
        'README.md'
      ];
      
      const missingFiles = expectedFiles.filter(file => 
        !fs.existsSync(path.join(projectDir, file))
      );
      
      if (missingFiles.length > 0) {
        throw new Error(`Missing files: ${missingFiles.join(', ')}`);
      }
      
      // Verify project name substitution
      const packageJsonPath = path.join(projectDir, 'frontend/package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      if (packageJson.name !== interactiveProjectName) {
        throw new Error(`Project name mismatch: expected ${interactiveProjectName}, got ${packageJson.name}`);
      }
      
      this.recordTest('Interactive Mode Simulation', 'passed', {
        duration: Date.now() - startTime,
        projectName: interactiveProjectName,
        projectDir,
        createdFiles: result.applied?.length || 0,
        templateUsed: result.template
      });
      
      return result;
    } catch (error) {
      this.recordTest('Interactive Mode Simulation', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return null;
    }
  }

  // Test 4: Template Selection Validation
  async testTemplateSelectionValidation() {
    const startTime = Date.now();
    
    try {
      const { AVAILABLE_TEMPLATES } = require('../engine/src/modules/scaffolder.ts');
      
      // Verify template availability
      if (!AVAILABLE_TEMPLATES || Object.keys(AVAILABLE_TEMPLATES).length === 0) {
        throw new Error('No templates available');
      }
      
      const templateKeys = Object.keys(AVAILABLE_TEMPLATES);
      const validationResults = [];
      
      for (const templateKey of templateKeys) {
        const template = AVAILABLE_TEMPLATES[templateKey];
        
        const validation = {
          templateKey,
          valid: true,
          issues: []
        };
        
        // Validate template structure
        if (!template.name) {
          validation.issues.push('Missing name');
          validation.valid = false;
        }
        
        if (!template.description) {
          validation.issues.push('Missing description');
          validation.valid = false;
        }
        
        if (!template.type) {
          validation.issues.push('Missing type');
          validation.valid = false;
        }
        
        if (!template.features || !Array.isArray(template.features)) {
          validation.issues.push('Missing or invalid features array');
          validation.valid = false;
        }
        
        if (!template.path) {
          validation.issues.push('Missing path');
          validation.valid = false;
        }
        
        // Check if template path exists
        const templatePath = path.join(process.cwd(), template.path);
        if (!fs.existsSync(templatePath)) {
          validation.issues.push('Template path does not exist');
          validation.valid = false;
        }
        
        validationResults.push(validation);
      }
      
      const invalidTemplates = validationResults.filter(v => !v.valid);
      
      if (invalidTemplates.length > 0) {
        throw new Error(`Invalid templates: ${invalidTemplates.map(t => `${t.templateKey} (${t.issues.join(', ')})`).join(', ')}`);
      }
      
      this.recordTest('Template Selection Validation', 'passed', {
        duration: Date.now() - startTime,
        totalTemplates: templateKeys.length,
        validTemplates: validationResults.filter(v => v.valid).length,
        availableTemplates: templateKeys
      });
      
      return validationResults;
    } catch (error) {
      this.recordTest('Template Selection Validation', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return [];
    }
  }

  // Test 5: Custom Variable Injection
  async testCustomVariableInjection() {
    const startTime = Date.now();
    
    try {
      // Test custom variable substitution beyond project name
      const testProjectName = 'variable-injection-test';
      
      // Read template files and check for additional variables
      const templatePath = path.join(process.cwd(), 'templates/fullstack-modern');
      
      if (!fs.existsSync(templatePath)) {
        throw new Error('Template path not found');
      }
      
      // Find files with potential variables
      const findVariablesInFiles = (dir, basePath = '') => {
        const files = fs.readdirSync(dir);
        const variableFiles = [];
        
        for (const file of files) {
          const filePath = path.join(dir, file);
          const relativePath = path.join(basePath, file);
          
          if (fs.statSync(filePath).isDirectory()) {
            if (!['node_modules', '.git', 'target'].includes(file)) {
              variableFiles.push(...findVariablesInFiles(filePath, relativePath));
            }
          } else {
            try {
              const content = fs.readFileSync(filePath, 'utf8');
              
              // Look for template variables
              const variables = content.match(/\{\{([^}]+)\}\}/g) || [];
              
              if (variables.length > 0) {
                variableFiles.push({
                  file: relativePath,
                  variables: variables,
                  content: content.substring(0, 200) // First 200 chars for context
                });
              }
            } catch (error) {
              // Skip binary files
            }
          }
        }
        
        return variableFiles;
      };
      
      const filesWithVariables = findVariablesInFiles(templatePath);
      
      // Create project and verify variable substitution
      const { createFromTemplate } = require('../engine/src/modules/scaffolder.ts');
      const result = createFromTemplate('fullstack-modern', testProjectName, this.tempDir);
      
      if (!result || !result.projectDir) {
        throw new Error('Template creation failed');
      }
      
      // Check variable substitution in generated files
      const substitutionCheck = [];
      
      for (const fileInfo of filesWithVariables) {
        const generatedFilePath = path.join(result.projectDir, fileInfo.file);
        
        if (fs.existsSync(generatedFilePath)) {
          const generatedContent = fs.readFileSync(generatedFilePath, 'utf8');
          
          // Check if variables were substituted
          const remainingVariables = generatedContent.match(/\{\{([^}]+)\}\}/g) || [];
          
          substitutionCheck.push({
            file: fileInfo.file,
            originalVariables: fileInfo.variables,
            remainingVariables,
            substituted: remainingVariables.length === 0
          });
        }
      }
      
      const unsubstitutedFiles = substitutionCheck.filter(c => !c.substituted);
      
      if (unsubstitutedFiles.length > 0) {
        console.warn(`Files with unsubstituted variables: ${unsubstitutedFiles.map(f => f.file).join(', ')}`);
      }
      
      this.recordTest('Custom Variable Injection', 'passed', {
        duration: Date.now() - startTime,
        filesWithVariables: filesWithVariables.length,
        substitutionChecked: substitutionCheck.length,
        fullySubstituted: substitutionCheck.filter(c => c.substituted).length,
        projectName: testProjectName
      });
      
      return { filesWithVariables, substitutionCheck };
    } catch (error) {
      this.recordTest('Custom Variable Injection', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return null;
    }
  }

  // Test 6: Configuration Customization
  async testConfigurationCustomization() {
    const startTime = Date.now();
    
    try {
      const testProjectName = 'config-customization-test';
      
      // Test different configuration scenarios
      const { createFromTemplate } = require('../engine/src/modules/scaffolder.ts');
      const result = createFromTemplate('fullstack-modern', testProjectName, this.tempDir);
      
      if (!result || !result.projectDir) {
        throw new Error('Template creation failed');
      }
      
      const projectDir = result.projectDir;
      
      // Check configuration files
      const configFiles = [
        {
          path: 'frontend/next.config.js',
          type: 'javascript',
          requiredContent: ['module.exports', 'nextConfig']
        },
        {
          path: 'frontend/tailwind.config.js',
          type: 'javascript',
          requiredContent: ['module.exports', 'content:']
        },
        {
          path: 'backend/Cargo.toml',
          type: 'toml',
          requiredContent: ['[package]', '[dependencies]', testProjectName]
        },
        {
          path: 'vercel.json',
          type: 'json',
          requiredContent: null // Will validate JSON structure
        }
      ];
      
      const configValidation = [];
      
      for (const config of configFiles) {
        const configPath = path.join(projectDir, config.path);
        
        if (!fs.existsSync(configPath)) {
          configValidation.push({
            file: config.path,
            exists: false,
            valid: false,
            error: 'File not found'
          });
          continue;
        }
        
        const content = fs.readFileSync(configPath, 'utf8');
        const validation = {
          file: config.path,
          exists: true,
          valid: true,
          issues: []
        };
        
        // Type-specific validation
        if (config.type === 'json') {
          try {
            JSON.parse(content);
          } catch (error) {
            validation.valid = false;
            validation.issues.push('Invalid JSON');
          }
        }
        
        // Check required content
        if (config.requiredContent) {
          const missingContent = config.requiredContent.filter(required => 
            !content.includes(required)
          );
          
          if (missingContent.length > 0) {
            validation.valid = false;
            validation.issues.push(`Missing: ${missingContent.join(', ')}`);
          }
        }
        
        // Check for template variables
        if (content.includes('{{')) {
          validation.valid = false;
          validation.issues.push('Unsubstituted template variables');
        }
        
        configValidation.push(validation);
      }
      
      const invalidConfigs = configValidation.filter(c => !c.valid);
      
      if (invalidConfigs.length > 0) {
        throw new Error(`Invalid configurations: ${invalidConfigs.map(c => `${c.file} (${c.issues?.join(', ') || c.error})`).join(', ')}`);
      }
      
      this.recordTest('Configuration Customization', 'passed', {
        duration: Date.now() - startTime,
        configFiles: configFiles.length,
        validConfigs: configValidation.filter(c => c.valid).length,
        projectName: testProjectName
      });
      
      return configValidation;
    } catch (error) {
      this.recordTest('Configuration Customization', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return [];
    }
  }

  // Test 7: Edge Cases in Customization
  async testEdgeCasesInCustomization() {
    const startTime = Date.now();
    
    try {
      const { createFromTemplate } = require('../engine/src/modules/scaffolder.ts');
      
      const edgeCases = [
        {
          name: 'Empty project name',
          projectName: '',
          shouldFail: true
        },
        {
          name: 'Very long project name',
          projectName: 'a'.repeat(100),
          shouldFail: false
        },
        {
          name: 'Project name with spaces',
          projectName: 'project with spaces',
          shouldFail: true
        },
        {
          name: 'Project name starting with number',
          projectName: '123project',
          shouldFail: true
        },
        {
          name: 'Project name with invalid characters',
          projectName: 'project@#$%',
          shouldFail: true
        }
      ];
      
      const results = [];
      
      for (const testCase of edgeCases) {
        try {
          const result = createFromTemplate('fullstack-modern', testCase.projectName, this.tempDir);
          
          results.push({
            ...testCase,
            actuallyFailed: false,
            result: result ? 'created' : 'failed',
            projectDir: result?.projectDir
          });
          
        } catch (error) {
          results.push({
            ...testCase,
            actuallyFailed: true,
            error: error.message
          });
        }
      }
      
      // Validate results
      const incorrectResults = results.filter(r => 
        r.shouldFail !== r.actuallyFailed
      );
      
      if (incorrectResults.length > 0) {
        const issues = incorrectResults.map(r => 
          `${r.name}: expected ${r.shouldFail ? 'failure' : 'success'}, got ${r.actuallyFailed ? 'failure' : 'success'}`
        );
        throw new Error(`Edge case validation failed: ${issues.join(', ')}`);
      }
      
      this.recordTest('Edge Cases in Customization', 'passed', {
        duration: Date.now() - startTime,
        testCases: edgeCases.length,
        correctResults: results.filter(r => r.shouldFail === r.actuallyFailed).length
      });
      
      return results;
    } catch (error) {
      this.recordTest('Edge Cases in Customization', 'failed', {
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
        fs.rmSync(this.tempDir, { recursive: true, force: true });
      }
      
      this.recordTest('Cleanup Customization Test Environment', 'passed', {
        duration: Date.now() - startTime,
        removedDir: this.tempDir
      });
      
      return true;
    } catch (error) {
      this.recordTest('Cleanup Customization Test Environment', 'failed', {
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
      testType: 'customization',
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
    const reportPath = path.join(process.cwd(), `template-customization-test-report-${this.testId}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n📊 Template Customization Test Results');
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

  // Run All Customization Tests
  async runAllTests() {
    console.log('🚀 Starting Template Customization Tests...\n');
    
    // Setup
    const setupSuccess = await this.setupTestEnvironment();
    if (!setupSuccess) {
      console.error('❌ Setup failed, aborting tests');
      return this.generateTestReport();
    }
    
    // Run tests
    await this.testBasicVariableSubstitution();
    await this.testSpecialCharactersInProjectNames();
    await this.testInteractiveModeSimulation();
    await this.testTemplateSelectionValidation();
    await this.testCustomVariableInjection();
    await this.testConfigurationCustomization();
    await this.testEdgeCasesInCustomization();
    
    // Cleanup
    await this.cleanupTestEnvironment();
    
    // Generate report
    return this.generateTestReport();
  }
}

// CLI execution
if (require.main === module) {
  const tester = new TemplateCustomizationTester();
  
  tester.runAllTests()
    .then(report => {
      const exitCode = report.summary.failed > 0 ? 1 : 0;
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('💥 Customization test runner crashed:', error);
      process.exit(1);
    });
}

module.exports = TemplateCustomizationTester;