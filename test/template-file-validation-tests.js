#!/usr/bin/env node

/**
 * Template File Validation Tests
 * 
 * Comprehensive file validation tests for generated templates
 * Validates file contents, syntax, dependencies, and configurations
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

class TemplateFileValidationTester {
  constructor() {
    this.testResults = [];
    this.testId = crypto.randomUUID();
    this.tempDir = path.join(os.tmpdir(), `claude-flow-file-validation-${this.testId}`);
    this.testProjectName = `file-validation-test-${Date.now()}`;
    
    console.log(`📋 Template File Validation Tests - Session: ${this.testId}`);
    console.log(`📁 Test directory: ${this.tempDir}`);
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

  // Setup Test Environment and Generate Project
  async setupTestProject() {
    const startTime = Date.now();
    
    try {
      // Create temp directory
      if (!fs.existsSync(this.tempDir)) {
        fs.mkdirSync(this.tempDir, { recursive: true });
      }
      
      // Use the scaffolder to create a test project
      const { createFromTemplate } = require('../engine/src/modules/scaffolder.ts');
      
      const result = createFromTemplate('fullstack-modern', this.testProjectName, this.tempDir);
      
      if (!result || !result.projectDir || !fs.existsSync(result.projectDir)) {
        throw new Error('Failed to create test project');
      }
      
      this.projectDir = result.projectDir;
      
      this.recordTest('Setup Test Project', 'passed', {
        duration: Date.now() - startTime,
        projectDir: this.projectDir,
        appliedFiles: result.applied?.length || 0
      });
      
      return true;
    } catch (error) {
      this.recordTest('Setup Test Project', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return false;
    }
  }

  // Test 1: JSON File Validation
  async testJSONFileValidation() {
    const startTime = Date.now();
    
    try {
      const jsonFiles = [
        'frontend/package.json',
        'vercel.json',
        'frontend/tsconfig.json'
      ];
      
      const validationResults = [];
      
      for (const jsonFile of jsonFiles) {
        const filePath = path.join(this.projectDir, jsonFile);
        
        if (!fs.existsSync(filePath)) {
          validationResults.push({
            file: jsonFile,
            exists: false,
            valid: false,
            error: 'File not found'
          });
          continue;
        }
        
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const parsed = JSON.parse(content);
          
          // Additional validation for specific files
          if (jsonFile === 'frontend/package.json') {
            if (!parsed.name || !parsed.version || !parsed.scripts) {
              throw new Error('Missing required package.json fields');
            }
            
            if (parsed.name !== this.testProjectName) {
              throw new Error('Project name not substituted correctly');
            }
          }
          
          if (jsonFile === 'vercel.json') {
            if (!parsed.framework && !parsed.builds) {
              throw new Error('Missing framework or builds configuration');
            }
          }
          
          if (jsonFile === 'frontend/tsconfig.json') {
            if (!parsed.compilerOptions) {
              throw new Error('Missing compilerOptions');
            }
          }
          
          validationResults.push({
            file: jsonFile,
            exists: true,
            valid: true,
            size: content.length,
            keys: Object.keys(parsed).length
          });
          
        } catch (parseError) {
          validationResults.push({
            file: jsonFile,
            exists: true,
            valid: false,
            error: parseError.message
          });
        }
      }
      
      const invalidFiles = validationResults.filter(r => !r.valid);
      
      if (invalidFiles.length > 0) {
        throw new Error(`Invalid JSON files: ${invalidFiles.map(f => `${f.file} (${f.error})`).join(', ')}`);
      }
      
      this.recordTest('JSON File Validation', 'passed', {
        duration: Date.now() - startTime,
        totalFiles: jsonFiles.length,
        validFiles: validationResults.filter(r => r.valid).length,
        totalSize: validationResults.reduce((sum, r) => sum + (r.size || 0), 0)
      });
      
      return validationResults;
    } catch (error) {
      this.recordTest('JSON File Validation', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return [];
    }
  }

  // Test 2: TypeScript File Validation
  async testTypeScriptFileValidation() {
    const startTime = Date.now();
    
    try {
      const tsFiles = [
        'frontend/src/app/page.tsx',
        'frontend/src/app/layout.tsx',
        'frontend/src/app/providers.tsx',
        'frontend/src/lib/api/client.ts',
        'frontend/src/lib/api/queries.ts',
        'frontend/src/store/auth-store.ts',
        'frontend/src/store/app-store.ts'
      ];
      
      const validationResults = [];
      
      for (const tsFile of tsFiles) {
        const filePath = path.join(this.projectDir, tsFile);
        
        if (!fs.existsSync(filePath)) {
          validationResults.push({
            file: tsFile,
            exists: false,
            valid: false,
            error: 'File not found'
          });
          continue;
        }
        
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Basic syntax validation
        const syntaxIssues = [];
        
        // Check for React components (TSX files)
        if (tsFile.endsWith('.tsx')) {
          if (!content.includes('export default') && !content.includes('export {')) {
            syntaxIssues.push('No export found');
          }
          
          if (!content.includes('React') && !content.includes('react')) {
            syntaxIssues.push('No React import or usage');
          }
        }
        
        // Check for TypeScript features
        if (!content.includes('interface') && !content.includes('type') && !content.includes(': ')) {
          syntaxIssues.push('No TypeScript type annotations found');
        }
        
        // Check for common imports
        const expectedImports = {
          'frontend/src/app/page.tsx': ['react'],
          'frontend/src/lib/api/client.ts': ['axios', 'fetch'],
          'frontend/src/store/auth-store.ts': ['zustand', 'store']
        };
        
        const expectedForFile = expectedImports[tsFile];
        if (expectedForFile) {
          const missingImports = expectedForFile.filter(imp => 
            !content.toLowerCase().includes(imp.toLowerCase())
          );
          
          if (missingImports.length === expectedForFile.length) {
            syntaxIssues.push(`Missing expected imports: ${expectedForFile.join(', ')}`);
          }
        }
        
        // Check for project name substitution
        if (content.includes('{{projectName}}')) {
          syntaxIssues.push('Unsubstituted template variables');
        }
        
        validationResults.push({
          file: tsFile,
          exists: true,
          valid: syntaxIssues.length === 0,
          size: content.length,
          syntaxIssues,
          linesOfCode: content.split('\n').length
        });
      }
      
      const invalidFiles = validationResults.filter(r => !r.valid);
      
      if (invalidFiles.length > 0) {
        throw new Error(`Invalid TypeScript files: ${invalidFiles.map(f => `${f.file} (${f.syntaxIssues?.join(', ')})`).join(', ')}`);
      }
      
      this.recordTest('TypeScript File Validation', 'passed', {
        duration: Date.now() - startTime,
        totalFiles: tsFiles.length,
        validFiles: validationResults.filter(r => r.valid).length,
        totalLinesOfCode: validationResults.reduce((sum, r) => sum + (r.linesOfCode || 0), 0)
      });
      
      return validationResults;
    } catch (error) {
      this.recordTest('TypeScript File Validation', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return [];
    }
  }

  // Test 3: Rust File Validation
  async testRustFileValidation() {
    const startTime = Date.now();
    
    try {
      const rustFiles = [
        'backend/src/main.rs',
        'backend/src/config.rs',
        'backend/src/database.rs',
        'backend/src/auth.rs',
        'backend/src/error.rs',
        'backend/src/models.rs',
        'backend/src/websocket.rs'
      ];
      
      const validationResults = [];
      
      for (const rustFile of rustFiles) {
        const filePath = path.join(this.projectDir, rustFile);
        
        if (!fs.existsSync(filePath)) {
          validationResults.push({
            file: rustFile,
            exists: false,
            valid: false,
            error: 'File not found'
          });
          continue;
        }
        
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Basic Rust syntax validation
        const syntaxIssues = [];
        
        // Check for basic Rust structure
        if (rustFile === 'backend/src/main.rs') {
          if (!content.includes('fn main()') && !content.includes('async fn main()')) {
            syntaxIssues.push('No main function found');
          }
        }
        
        // Check for common Rust patterns
        if (!content.includes('use ') && content.length > 50) {
          syntaxIssues.push('No use statements found');
        }
        
        // Check for functions or structs
        if (!content.includes('fn ') && !content.includes('struct ') && 
            !content.includes('enum ') && !content.includes('impl ')) {
          syntaxIssues.push('No functions, structs, enums, or impl blocks found');
        }
        
        // Check for project name substitution
        if (content.includes('{{projectName}}')) {
          syntaxIssues.push('Unsubstituted template variables');
        }
        
        // File-specific validations
        if (rustFile === 'backend/src/database.rs') {
          if (!content.includes('sqlx') && !content.includes('database')) {
            syntaxIssues.push('Database-related code not found');
          }
        }
        
        if (rustFile === 'backend/src/auth.rs') {
          if (!content.includes('auth') && !content.includes('jwt') && !content.includes('token')) {
            syntaxIssues.push('Authentication-related code not found');
          }
        }
        
        validationResults.push({
          file: rustFile,
          exists: true,
          valid: syntaxIssues.length === 0,
          size: content.length,
          syntaxIssues,
          linesOfCode: content.split('\n').length
        });
      }
      
      const invalidFiles = validationResults.filter(r => !r.valid);
      
      if (invalidFiles.length > 0) {
        throw new Error(`Invalid Rust files: ${invalidFiles.map(f => `${f.file} (${f.syntaxIssues?.join(', ')})`).join(', ')}`);
      }
      
      this.recordTest('Rust File Validation', 'passed', {
        duration: Date.now() - startTime,
        totalFiles: rustFiles.length,
        validFiles: validationResults.filter(r => r.valid).length,
        totalLinesOfCode: validationResults.reduce((sum, r) => sum + (r.linesOfCode || 0), 0)
      });
      
      return validationResults;
    } catch (error) {
      this.recordTest('Rust File Validation', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return [];
    }
  }

  // Test 4: Docker File Validation
  async testDockerFileValidation() {
    const startTime = Date.now();
    
    try {
      const dockerFiles = [
        'frontend/Dockerfile',
        'frontend/Dockerfile.dev',
        'backend/Dockerfile',
        'backend/Dockerfile.dev',
        'docker-compose.yml'
      ];
      
      const validationResults = [];
      
      for (const dockerFile of dockerFiles) {
        const filePath = path.join(this.projectDir, dockerFile);
        
        if (!fs.existsSync(filePath)) {
          validationResults.push({
            file: dockerFile,
            exists: false,
            valid: false,
            error: 'File not found'
          });
          continue;
        }
        
        const content = fs.readFileSync(filePath, 'utf8');
        const syntaxIssues = [];
        
        if (dockerFile.endsWith('Dockerfile') || dockerFile.endsWith('Dockerfile.dev')) {
          // Dockerfile validation
          if (!content.includes('FROM ')) {
            syntaxIssues.push('No FROM instruction found');
          }
          
          if (dockerFile.includes('frontend')) {
            if (!content.includes('node:') && !content.includes('alpine')) {
              syntaxIssues.push('Frontend Dockerfile should use Node.js base image');
            }
          }
          
          if (dockerFile.includes('backend')) {
            if (!content.includes('rust:')) {
              syntaxIssues.push('Backend Dockerfile should use Rust base image');
            }
          }
          
          // Check for common Dockerfile instructions
          const expectedInstructions = ['WORKDIR', 'COPY', 'RUN'];
          const missingInstructions = expectedInstructions.filter(inst => 
            !content.includes(inst)
          );
          
          if (missingInstructions.length > 0) {
            syntaxIssues.push(`Missing instructions: ${missingInstructions.join(', ')}`);
          }
          
        } else if (dockerFile === 'docker-compose.yml') {
          // Docker Compose validation
          if (!content.includes('version:')) {
            syntaxIssues.push('No version specified');
          }
          
          if (!content.includes('services:')) {
            syntaxIssues.push('No services defined');
          }
          
          const expectedServices = ['frontend', 'backend', 'postgres'];
          const missingServices = expectedServices.filter(service => 
            !content.includes(service + ':')
          );
          
          if (missingServices.length > 0) {
            syntaxIssues.push(`Missing services: ${missingServices.join(', ')}`);
          }
          
          if (!content.includes('ports:')) {
            syntaxIssues.push('No port mappings found');
          }
        }
        
        validationResults.push({
          file: dockerFile,
          exists: true,
          valid: syntaxIssues.length === 0,
          size: content.length,
          syntaxIssues,
          linesOfCode: content.split('\n').length
        });
      }
      
      const invalidFiles = validationResults.filter(r => !r.valid);
      
      if (invalidFiles.length > 0) {
        throw new Error(`Invalid Docker files: ${invalidFiles.map(f => `${f.file} (${f.syntaxIssues?.join(', ')})`).join(', ')}`);
      }
      
      this.recordTest('Docker File Validation', 'passed', {
        duration: Date.now() - startTime,
        totalFiles: dockerFiles.length,
        validFiles: validationResults.filter(r => r.valid).length
      });
      
      return validationResults;
    } catch (error) {
      this.recordTest('Docker File Validation', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return [];
    }
  }

  // Test 5: Configuration File Validation
  async testConfigurationFileValidation() {
    const startTime = Date.now();
    
    try {
      const configFiles = [
        'frontend/next.config.js',
        'frontend/tailwind.config.js',
        'backend/Cargo.toml'
      ];
      
      const validationResults = [];
      
      for (const configFile of configFiles) {
        const filePath = path.join(this.projectDir, configFile);
        
        if (!fs.existsSync(filePath)) {
          validationResults.push({
            file: configFile,
            exists: false,
            valid: false,
            error: 'File not found'
          });
          continue;
        }
        
        const content = fs.readFileSync(filePath, 'utf8');
        const syntaxIssues = [];
        
        if (configFile === 'frontend/next.config.js') {
          if (!content.includes('module.exports')) {
            syntaxIssues.push('No module.exports found');
          }
          
          if (!content.includes('nextConfig') && !content.includes('config')) {
            syntaxIssues.push('No Next.js configuration object found');
          }
          
        } else if (configFile === 'frontend/tailwind.config.js') {
          if (!content.includes('module.exports') && !content.includes('export default')) {
            syntaxIssues.push('No export found');
          }
          
          if (!content.includes('content:') && !content.includes('purge:')) {
            syntaxIssues.push('No content/purge configuration found');
          }
          
        } else if (configFile === 'backend/Cargo.toml') {
          if (!content.includes('[package]')) {
            syntaxIssues.push('No [package] section found');
          }
          
          if (!content.includes('[dependencies]')) {
            syntaxIssues.push('No [dependencies] section found');
          }
          
          if (!content.includes(this.testProjectName)) {
            syntaxIssues.push('Project name not found in Cargo.toml');
          }
          
          // Check for required dependencies
          const requiredDeps = ['axum', 'tokio', 'serde'];
          const missingDeps = requiredDeps.filter(dep => !content.includes(dep));
          
          if (missingDeps.length > 0) {
            syntaxIssues.push(`Missing dependencies: ${missingDeps.join(', ')}`);
          }
        }
        
        validationResults.push({
          file: configFile,
          exists: true,
          valid: syntaxIssues.length === 0,
          size: content.length,
          syntaxIssues
        });
      }
      
      const invalidFiles = validationResults.filter(r => !r.valid);
      
      if (invalidFiles.length > 0) {
        throw new Error(`Invalid configuration files: ${invalidFiles.map(f => `${f.file} (${f.syntaxIssues?.join(', ')})`).join(', ')}`);
      }
      
      this.recordTest('Configuration File Validation', 'passed', {
        duration: Date.now() - startTime,
        totalFiles: configFiles.length,
        validFiles: validationResults.filter(r => r.valid).length
      });
      
      return validationResults;
    } catch (error) {
      this.recordTest('Configuration File Validation', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return [];
    }
  }

  // Test 6: Documentation File Validation
  async testDocumentationFileValidation() {
    const startTime = Date.now();
    
    try {
      const docFiles = [
        'README.md',
        'DEPLOYMENT.md'
      ];
      
      const validationResults = [];
      
      for (const docFile of docFiles) {
        const filePath = path.join(this.projectDir, docFile);
        
        if (!fs.existsSync(filePath)) {
          validationResults.push({
            file: docFile,
            exists: false,
            valid: false,
            error: 'File not found'
          });
          continue;
        }
        
        const content = fs.readFileSync(filePath, 'utf8');
        const syntaxIssues = [];
        
        // Basic markdown validation
        if (content.length < 50) {
          syntaxIssues.push('Documentation too short');
        }
        
        if (!content.includes('#')) {
          syntaxIssues.push('No markdown headers found');
        }
        
        // Project name substitution check
        if (!content.includes(this.testProjectName)) {
          syntaxIssues.push('Project name not found in documentation');
        }
        
        // File-specific validation
        if (docFile === 'README.md') {
          const expectedSections = ['installation', 'usage', 'development'];
          const missingSections = expectedSections.filter(section => 
            !content.toLowerCase().includes(section.toLowerCase())
          );
          
          if (missingSections.length > 0) {
            syntaxIssues.push(`Missing README sections: ${missingSections.join(', ')}`);
          }
          
        } else if (docFile === 'DEPLOYMENT.md') {
          const expectedSections = ['frontend', 'backend', 'environment'];
          const missingSections = expectedSections.filter(section => 
            !content.toLowerCase().includes(section.toLowerCase())
          );
          
          if (missingSections.length > 0) {
            syntaxIssues.push(`Missing deployment sections: ${missingSections.join(', ')}`);
          }
        }
        
        validationResults.push({
          file: docFile,
          exists: true,
          valid: syntaxIssues.length === 0,
          size: content.length,
          syntaxIssues,
          wordCount: content.split(/\s+/).length
        });
      }
      
      const invalidFiles = validationResults.filter(r => !r.valid);
      
      if (invalidFiles.length > 0) {
        throw new Error(`Invalid documentation files: ${invalidFiles.map(f => `${f.file} (${f.syntaxIssues?.join(', ')})`).join(', ')}`);
      }
      
      this.recordTest('Documentation File Validation', 'passed', {
        duration: Date.now() - startTime,
        totalFiles: docFiles.length,
        validFiles: validationResults.filter(r => r.valid).length,
        totalWords: validationResults.reduce((sum, r) => sum + (r.wordCount || 0), 0)
      });
      
      return validationResults;
    } catch (error) {
      this.recordTest('Documentation File Validation', 'failed', {
        duration: Date.now() - startTime,
        error: error.message
      });
      return [];
    }
  }

  // Test 7: Directory Structure Validation
  async testDirectoryStructureValidation() {
    const startTime = Date.now();
    
    try {
      const expectedDirs = [
        'frontend/',
        'frontend/src/',
        'frontend/src/app/',
        'frontend/src/lib/',
        'frontend/src/lib/api/',
        'frontend/src/lib/supabase/',
        'frontend/src/lib/websocket/',
        'frontend/src/store/',
        'backend/',
        'backend/src/',
        'backend/migrations/'
      ];
      
      const missingDirs = [];
      const existingDirs = [];
      
      for (const dir of expectedDirs) {
        const dirPath = path.join(this.projectDir, dir);
        if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
          existingDirs.push(dir);
        } else {
          missingDirs.push(dir);
        }
      }
      
      if (missingDirs.length > 0) {
        throw new Error(`Missing directories: ${missingDirs.join(', ')}`);
      }
      
      // Check for unexpected directories
      const checkForUnexpected = (basePath, prefix = '') => {
        const items = fs.readdirSync(basePath);
        const unexpectedDirs = [];
        
        for (const item of items) {
          const itemPath = path.join(basePath, item);
          if (fs.statSync(itemPath).isDirectory()) {
            const relativePath = prefix + item + '/';
            
            // Skip node_modules, .git, etc.
            if (['node_modules/', '.git/', 'target/', '.next/'].includes(relativePath)) {
              continue;
            }
            
            if (!expectedDirs.includes(relativePath)) {
              unexpectedDirs.push(relativePath);
            }
            
            // Recursively check subdirectories
            if (relativePath.startsWith('frontend/') || relativePath.startsWith('backend/')) {
              unexpectedDirs.push(...checkForUnexpected(itemPath, relativePath));
            }
          }
        }
        
        return unexpectedDirs;
      };
      
      const unexpectedDirs = checkForUnexpected(this.projectDir);
      
      this.recordTest('Directory Structure Validation', 'passed', {
        duration: Date.now() - startTime,
        expectedDirs: expectedDirs.length,
        existingDirs: existingDirs.length,
        missingDirs: missingDirs.length,
        unexpectedDirs: unexpectedDirs.length
      });
      
      return { existingDirs, missingDirs, unexpectedDirs };
    } catch (error) {
      this.recordTest('Directory Structure Validation', 'failed', {
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
      
      this.recordTest('Cleanup File Validation Test Environment', 'passed', {
        duration: Date.now() - startTime,
        removedDir: this.tempDir
      });
      
      return true;
    } catch (error) {
      this.recordTest('Cleanup File Validation Test Environment', 'failed', {
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
      testType: 'file-validation',
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
    const reportPath = path.join(process.cwd(), `template-file-validation-test-report-${this.testId}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n📊 Template File Validation Test Results');
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

  // Run All File Validation Tests
  async runAllTests() {
    console.log('🚀 Starting Template File Validation Tests...\n');
    
    // Setup
    const setupSuccess = await this.setupTestProject();
    if (!setupSuccess) {
      console.error('❌ Setup failed, aborting tests');
      return this.generateTestReport();
    }
    
    // Run validation tests
    await this.testJSONFileValidation();
    await this.testTypeScriptFileValidation();
    await this.testRustFileValidation();
    await this.testDockerFileValidation();
    await this.testConfigurationFileValidation();
    await this.testDocumentationFileValidation();
    await this.testDirectoryStructureValidation();
    
    // Cleanup
    await this.cleanupTestEnvironment();
    
    // Generate report
    return this.generateTestReport();
  }
}

// CLI execution
if (require.main === module) {
  const tester = new TemplateFileValidationTester();
  
  tester.runAllTests()
    .then(report => {
      const exitCode = report.summary.failed > 0 ? 1 : 0;
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('💥 File validation test runner crashed:', error);
      process.exit(1);
    });
}

module.exports = TemplateFileValidationTester;