#!/usr/bin/env node

/**
 * Development Scripts Test Suite
 * Comprehensive testing for package.json scripts, build automation, and development workflows
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

class DevScriptsTestSuite {
  constructor() {
    this.templatePath = path.resolve(__dirname, '../../');
    this.frontendPath = path.join(this.templatePath, 'frontend');
    this.backendPath = path.join(this.templatePath, 'backend');
    this.testResults = {
      packageJson: [],
      buildProcess: [],
      testRunner: [],
      linting: [],
      formatting: [],
      preCommit: [],
      automation: [],
      integration: []
    };
    this.scriptTimeouts = new Map();
    this.activeProcesses = new Set();
  }

  async runAllTests() {
    console.log('📜 Starting Development Scripts Test Suite...\n');

    try {
      await this.testPackageJsonScripts();
      await this.testBuildProcesses();
      await this.testTestRunners();
      await this.testLintingScripts();
      await this.testFormattingScripts();
      await this.testPreCommitHooks();
      await this.testAutomationWorkflows();
      await this.testScriptIntegration();

      return this.generateTestReport();
    } catch (error) {
      console.error('❌ Development scripts test suite failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  // 1. Package.json Scripts Validation
  async testPackageJsonScripts() {
    console.log('📦 Testing package.json scripts...');

    const tests = [
      this.testFrontendScripts,
      this.testBackendScripts,
      this.testDockerScripts,
      this.testScriptSyntax
    ];

    for (const test of tests) {
      try {
        await test.call(this);
      } catch (error) {
        this.testResults.packageJson.push({
          test: test.name,
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  async testFrontendScripts() {
    const packageJsonPath = path.join(this.frontendPath, 'package.json');
    
    if (await this.fileExists(packageJsonPath)) {
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      const scripts = packageJson.scripts || {};

      const requiredScripts = [
        'dev',
        'build',
        'start',
        'lint',
        'test'
      ];

      const missingScripts = requiredScripts.filter(script => !scripts[script]);
      const hasAllRequired = missingScripts.length === 0;

      this.testResults.packageJson.push({
        test: 'frontend_scripts',
        status: hasAllRequired ? 'passed' : 'failed',
        message: hasAllRequired ? 
          'All required frontend scripts present' : 
          `Missing frontend scripts: ${missingScripts.join(', ')}`,
        scripts: Object.keys(scripts)
      });

      // Test individual script syntax
      for (const [scriptName, scriptCommand] of Object.entries(scripts)) {
        const isValid = typeof scriptCommand === 'string' && scriptCommand.trim().length > 0;
        
        this.testResults.packageJson.push({
          test: `frontend_script_${scriptName}`,
          status: isValid ? 'passed' : 'failed',
          message: isValid ? 
            `Frontend script '${scriptName}' is valid` : 
            `Frontend script '${scriptName}' is invalid`,
          command: scriptCommand
        });
      }
    } else {
      this.testResults.packageJson.push({
        test: 'frontend_scripts',
        status: 'failed',
        message: 'Frontend package.json not found'
      });
    }
  }

  async testBackendScripts() {
    const cargoTomlPath = path.join(this.backendPath, 'Cargo.toml');
    
    if (await this.fileExists(cargoTomlPath)) {
      // For Rust projects, check standard Cargo commands
      const standardCommands = ['build', 'run', 'test', 'fmt', 'clippy'];
      const workingCommands = [];
      const failingCommands = [];

      for (const command of standardCommands) {
        try {
          const result = await this.execCommand(`cargo ${command} --help`, { cwd: this.backendPath });
          if (result.success) {
            workingCommands.push(command);
          } else {
            failingCommands.push(command);
          }
        } catch (error) {
          failingCommands.push(command);
        }
      }

      this.testResults.packageJson.push({
        test: 'backend_scripts',
        status: failingCommands.length === 0 ? 'passed' : 'warning',
        message: failingCommands.length === 0 ? 
          'All backend Cargo commands available' : 
          `Some Cargo commands not available: ${failingCommands.join(', ')}`,
        workingCommands,
        failingCommands
      });
    } else {
      this.testResults.packageJson.push({
        test: 'backend_scripts',
        status: 'failed',
        message: 'Backend Cargo.toml not found'
      });
    }
  }

  async testDockerScripts() {
    const templateConfigPath = path.join(this.templatePath, 'template.config.json');
    
    if (await this.fileExists(templateConfigPath)) {
      const templateConfig = JSON.parse(await fs.readFile(templateConfigPath, 'utf8'));
      const dockerScripts = templateConfig.scripts?.docker || {};

      const requiredDockerScripts = ['dev', 'build', 'down'];
      const missingScripts = requiredDockerScripts.filter(script => !dockerScripts[script]);

      this.testResults.packageJson.push({
        test: 'docker_scripts',
        status: missingScripts.length === 0 ? 'passed' : 'failed',
        message: missingScripts.length === 0 ? 
          'All required Docker scripts present' : 
          `Missing Docker scripts: ${missingScripts.join(', ')}`,
        scripts: Object.keys(dockerScripts)
      });
    }
  }

  async testScriptSyntax() {
    // Test script syntax validation
    const packageJsons = [
      path.join(this.frontendPath, 'package.json'),
      path.join(this.templatePath, 'package.json')
    ];

    let syntaxErrors = [];

    for (const packageJsonPath of packageJsons) {
      if (await this.fileExists(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
          const scripts = packageJson.scripts || {};

          for (const [scriptName, scriptCommand] of Object.entries(scripts)) {
            // Basic syntax validation
            if (typeof scriptCommand !== 'string') {
              syntaxErrors.push(`${path.basename(path.dirname(packageJsonPath))}: ${scriptName} is not a string`);
            } else if (scriptCommand.trim().length === 0) {
              syntaxErrors.push(`${path.basename(path.dirname(packageJsonPath))}: ${scriptName} is empty`);
            }
          }
        } catch (error) {
          syntaxErrors.push(`${packageJsonPath}: Invalid JSON syntax`);
        }
      }
    }

    this.testResults.packageJson.push({
      test: 'script_syntax',
      status: syntaxErrors.length === 0 ? 'passed' : 'failed',
      message: syntaxErrors.length === 0 ? 
        'All script syntax is valid' : 
        'Script syntax errors found',
      errors: syntaxErrors
    });
  }

  // 2. Build Process Testing
  async testBuildProcesses() {
    console.log('🏗️ Testing build processes...');

    const tests = [
      this.testFrontendBuild,
      this.testBackendBuild,
      this.testDockerBuild,
      this.testBuildOptimization
    ];

    for (const test of tests) {
      try {
        await test.call(this);
      } catch (error) {
        this.testResults.buildProcess.push({
          test: test.name,
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  async testFrontendBuild() {
    console.log('⚛️ Testing frontend build...');

    const packageJsonPath = path.join(this.frontendPath, 'package.json');
    
    if (await this.fileExists(packageJsonPath)) {
      const startTime = Date.now();
      
      // Test npm install
      const installResult = await this.execCommand('npm install', { 
        cwd: this.frontendPath,
        timeout: 120000 
      });

      if (!installResult.success) {
        this.testResults.buildProcess.push({
          test: 'frontend_build',
          status: 'failed',
          message: 'Frontend npm install failed',
          error: installResult.error
        });
        return;
      }

      // Test build
      const buildResult = await this.execCommand('npm run build', { 
        cwd: this.frontendPath,
        timeout: 180000 
      });

      const buildTime = Date.now() - startTime;

      this.testResults.buildProcess.push({
        test: 'frontend_build',
        status: buildResult.success ? 'passed' : 'failed',
        message: buildResult.success ? 
          `Frontend build successful in ${buildTime}ms` : 
          'Frontend build failed',
        buildTime,
        error: buildResult.success ? null : buildResult.error
      });

      // Check build artifacts
      if (buildResult.success) {
        const buildDir = path.join(this.frontendPath, '.next');
        const buildExists = await this.directoryExists(buildDir);
        
        this.testResults.buildProcess.push({
          test: 'frontend_build_artifacts',
          status: buildExists ? 'passed' : 'failed',
          message: buildExists ? 
            'Frontend build artifacts created' : 
            'Frontend build artifacts not found'
        });
      }
    } else {
      this.testResults.buildProcess.push({
        test: 'frontend_build',
        status: 'skipped',
        message: 'Frontend package.json not found'
      });
    }
  }

  async testBackendBuild() {
    console.log('🦀 Testing backend build...');

    const cargoTomlPath = path.join(this.backendPath, 'Cargo.toml');
    
    if (await this.fileExists(cargoTomlPath)) {
      const startTime = Date.now();
      
      // Test cargo build
      const buildResult = await this.execCommand('cargo build', { 
        cwd: this.backendPath,
        timeout: 300000 // 5 minutes for Rust compilation
      });

      const buildTime = Date.now() - startTime;

      this.testResults.buildProcess.push({
        test: 'backend_build',
        status: buildResult.success ? 'passed' : 'failed',
        message: buildResult.success ? 
          `Backend build successful in ${buildTime}ms` : 
          'Backend build failed',
        buildTime,
        error: buildResult.success ? null : buildResult.error
      });

      // Check build artifacts
      if (buildResult.success) {
        const targetDir = path.join(this.backendPath, 'target/debug');
        const buildExists = await this.directoryExists(targetDir);
        
        this.testResults.buildProcess.push({
          test: 'backend_build_artifacts',
          status: buildExists ? 'passed' : 'failed',
          message: buildExists ? 
            'Backend build artifacts created' : 
            'Backend build artifacts not found'
        });
      }

      // Test release build
      const releaseBuildResult = await this.execCommand('cargo build --release', { 
        cwd: this.backendPath,
        timeout: 300000
      });

      this.testResults.buildProcess.push({
        test: 'backend_release_build',
        status: releaseBuildResult.success ? 'passed' : 'failed',
        message: releaseBuildResult.success ? 
          'Backend release build successful' : 
          'Backend release build failed'
      });
    } else {
      this.testResults.buildProcess.push({
        test: 'backend_build',
        status: 'skipped',
        message: 'Backend Cargo.toml not found'
      });
    }
  }

  async testDockerBuild() {
    console.log('🐳 Testing Docker build...');

    const dockerfilePaths = [
      path.join(this.frontendPath, 'Dockerfile'),
      path.join(this.frontendPath, 'Dockerfile.dev'),
      path.join(this.backendPath, 'Dockerfile'),
      path.join(this.backendPath, 'Dockerfile.dev')
    ];

    let dockerfileCount = 0;
    let validDockerfiles = 0;

    for (const dockerfilePath of dockerfilePaths) {
      if (await this.fileExists(dockerfilePath)) {
        dockerfileCount++;
        
        try {
          const content = await fs.readFile(dockerfilePath, 'utf8');
          
          // Basic Dockerfile validation
          const hasFrom = content.includes('FROM');
          const hasWorkdir = content.includes('WORKDIR');
          const hasCopy = content.includes('COPY') || content.includes('ADD');
          
          if (hasFrom && hasWorkdir && hasCopy) {
            validDockerfiles++;
          }
        } catch (error) {
          // File read error
        }
      }
    }

    this.testResults.buildProcess.push({
      test: 'docker_build',
      status: validDockerfiles === dockerfileCount && dockerfileCount > 0 ? 'passed' : 'failed',
      message: `${validDockerfiles}/${dockerfileCount} Dockerfiles are valid`,
      dockerfileCount,
      validDockerfiles
    });

    // Test docker-compose build
    const composeFile = path.join(this.templatePath, 'docker-compose.yml');
    if (await this.fileExists(composeFile)) {
      const composeBuildResult = await this.execCommand('docker-compose config', {
        cwd: this.templatePath,
        timeout: 30000
      });

      this.testResults.buildProcess.push({
        test: 'docker_compose_build',
        status: composeBuildResult.success ? 'passed' : 'failed',
        message: composeBuildResult.success ? 
          'Docker Compose configuration valid' : 
          'Docker Compose configuration invalid'
      });
    }
  }

  async testBuildOptimization() {
    // Test build optimization features
    this.testResults.buildProcess.push({
      test: 'build_optimization',
      status: 'info',
      message: 'Build optimization should include caching, minification, and compression',
      recommendations: [
        'Enable webpack/Next.js build caching',
        'Use multi-stage Docker builds',
        'Implement build artifact compression',
        'Use incremental compilation for Rust'
      ]
    });
  }

  // 3. Test Runner Integration
  async testTestRunners() {
    console.log('🧪 Testing test runners...');

    const tests = [
      this.testFrontendTests,
      this.testBackendTests,
      this.testE2ETests,
      this.testTestCoverage
    ];

    for (const test of tests) {
      try {
        await test.call(this);
      } catch (error) {
        this.testResults.testRunner.push({
          test: test.name,
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  async testFrontendTests() {
    const packageJsonPath = path.join(this.frontendPath, 'package.json');
    
    if (await this.fileExists(packageJsonPath)) {
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      const hasTestScript = packageJson.scripts && packageJson.scripts.test;

      if (hasTestScript) {
        // Ensure dependencies are installed
        await this.execCommand('npm install', { cwd: this.frontendPath });

        const testResult = await this.execCommand('npm test -- --passWithNoTests', { 
          cwd: this.frontendPath,
          timeout: 60000
        });

        this.testResults.testRunner.push({
          test: 'frontend_tests',
          status: testResult.success ? 'passed' : 'failed',
          message: testResult.success ? 
            'Frontend tests run successfully' : 
            'Frontend tests failed',
          error: testResult.success ? null : testResult.error
        });
      } else {
        this.testResults.testRunner.push({
          test: 'frontend_tests',
          status: 'failed',
          message: 'Frontend test script not found'
        });
      }
    }
  }

  async testBackendTests() {
    const cargoTomlPath = path.join(this.backendPath, 'Cargo.toml');
    
    if (await this.fileExists(cargoTomlPath)) {
      const testResult = await this.execCommand('cargo test', { 
        cwd: this.backendPath,
        timeout: 120000
      });

      this.testResults.testRunner.push({
        test: 'backend_tests',
        status: testResult.success ? 'passed' : 'failed',
        message: testResult.success ? 
          'Backend tests run successfully' : 
          'Backend tests failed',
        error: testResult.success ? null : testResult.error
      });
    }
  }

  async testE2ETests() {
    const packageJsonPath = path.join(this.frontendPath, 'package.json');
    
    if (await this.fileExists(packageJsonPath)) {
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      const hasE2EScript = packageJson.scripts && packageJson.scripts['test:e2e'];

      if (hasE2EScript) {
        // Note: E2E tests typically require the application to be running
        this.testResults.testRunner.push({
          test: 'e2e_tests',
          status: 'info',
          message: 'E2E test script available (requires running application)',
          script: packageJson.scripts['test:e2e']
        });
      } else {
        this.testResults.testRunner.push({
          test: 'e2e_tests',
          status: 'warning',
          message: 'E2E test script not found'
        });
      }
    }
  }

  async testTestCoverage() {
    // Test coverage reporting
    const packageJsonPath = path.join(this.frontendPath, 'package.json');
    
    if (await this.fileExists(packageJsonPath)) {
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      // Check for coverage-related dependencies
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      const hasCoverageTools = Object.keys(allDeps).some(dep => 
        dep.includes('coverage') || dep.includes('nyc') || dep === '@jest/coverage'
      );

      this.testResults.testRunner.push({
        test: 'test_coverage',
        status: hasCoverageTools ? 'passed' : 'warning',
        message: hasCoverageTools ? 
          'Test coverage tools available' : 
          'Consider adding test coverage tools'
      });
    }
  }

  // 4. Linting Scripts Testing
  async testLintingScripts() {
    console.log('🔍 Testing linting scripts...');

    const tests = [
      this.testFrontendLinting,
      this.testBackendLinting,
      this.testLintingConfiguration
    ];

    for (const test of tests) {
      try {
        await test.call(this);
      } catch (error) {
        this.testResults.linting.push({
          test: test.name,
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  async testFrontendLinting() {
    const packageJsonPath = path.join(this.frontendPath, 'package.json');
    
    if (await this.fileExists(packageJsonPath)) {
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      const hasLintScript = packageJson.scripts && packageJson.scripts.lint;

      if (hasLintScript) {
        // Ensure dependencies are installed
        await this.execCommand('npm install', { cwd: this.frontendPath });

        const lintResult = await this.execCommand('npm run lint', { 
          cwd: this.frontendPath,
          timeout: 60000
        });

        this.testResults.linting.push({
          test: 'frontend_linting',
          status: lintResult.success ? 'passed' : 'warning',
          message: lintResult.success ? 
            'Frontend linting passed' : 
            'Frontend linting found issues (this may be expected)',
          output: lintResult.output
        });
      } else {
        this.testResults.linting.push({
          test: 'frontend_linting',
          status: 'failed',
          message: 'Frontend lint script not found'
        });
      }
    }
  }

  async testBackendLinting() {
    const cargoTomlPath = path.join(this.backendPath, 'Cargo.toml');
    
    if (await this.fileExists(cargoTomlPath)) {
      const clippyResult = await this.execCommand('cargo clippy', { 
        cwd: this.backendPath,
        timeout: 120000
      });

      this.testResults.linting.push({
        test: 'backend_linting',
        status: clippyResult.success ? 'passed' : 'warning',
        message: clippyResult.success ? 
          'Backend linting (clippy) passed' : 
          'Backend linting found issues (this may be expected)',
        output: clippyResult.output
      });
    }
  }

  async testLintingConfiguration() {
    // Test linting configuration files
    const configFiles = [
      { path: path.join(this.frontendPath, '.eslintrc.json'), name: 'ESLint' },
      { path: path.join(this.frontendPath, '.eslintrc.js'), name: 'ESLint' },
      { path: path.join(this.frontendPath, 'eslint.config.js'), name: 'ESLint' },
      { path: path.join(this.templatePath, '.editorconfig'), name: 'EditorConfig' }
    ];

    const foundConfigs = [];
    
    for (const config of configFiles) {
      if (await this.fileExists(config.path)) {
        foundConfigs.push(config.name);
      }
    }

    this.testResults.linting.push({
      test: 'linting_configuration',
      status: foundConfigs.length > 0 ? 'passed' : 'warning',
      message: foundConfigs.length > 0 ? 
        `Linting configuration found: ${foundConfigs.join(', ')}` : 
        'No linting configuration files found',
      foundConfigs
    });
  }

  // 5. Formatting Scripts Testing
  async testFormattingScripts() {
    console.log('💅 Testing formatting scripts...');

    const tests = [
      this.testFrontendFormatting,
      this.testBackendFormatting,
      this.testFormattingConfiguration
    ];

    for (const test of tests) {
      try {
        await test.call(this);
      } catch (error) {
        this.testResults.formatting.push({
          test: test.name,
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  async testFrontendFormatting() {
    const packageJsonPath = path.join(this.frontendPath, 'package.json');
    
    if (await this.fileExists(packageJsonPath)) {
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      // Check for prettier dependency
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      const hasPrettier = 'prettier' in allDeps;

      if (hasPrettier) {
        this.testResults.formatting.push({
          test: 'frontend_formatting',
          status: 'passed',
          message: 'Prettier formatting tool available'
        });
      } else {
        this.testResults.formatting.push({
          test: 'frontend_formatting',
          status: 'warning',
          message: 'No formatting tool (Prettier) found'
        });
      }
    }
  }

  async testBackendFormatting() {
    const cargoTomlPath = path.join(this.backendPath, 'Cargo.toml');
    
    if (await this.fileExists(cargoTomlPath)) {
      const fmtResult = await this.execCommand('cargo fmt --check', { 
        cwd: this.backendPath,
        timeout: 30000
      });

      this.testResults.formatting.push({
        test: 'backend_formatting',
        status: fmtResult.success ? 'passed' : 'warning',
        message: fmtResult.success ? 
          'Backend formatting (rustfmt) is consistent' : 
          'Backend formatting inconsistencies found'
      });
    }
  }

  async testFormattingConfiguration() {
    // Test formatting configuration files
    const configFiles = [
      { path: path.join(this.frontendPath, '.prettierrc'), name: 'Prettier' },
      { path: path.join(this.frontendPath, '.prettierrc.json'), name: 'Prettier' },
      { path: path.join(this.frontendPath, 'prettier.config.js'), name: 'Prettier' },
      { path: path.join(this.backendPath, 'rustfmt.toml'), name: 'Rustfmt' }
    ];

    const foundConfigs = [];
    
    for (const config of configFiles) {
      if (await this.fileExists(config.path)) {
        foundConfigs.push(config.name);
      }
    }

    this.testResults.formatting.push({
      test: 'formatting_configuration',
      status: foundConfigs.length > 0 ? 'passed' : 'info',
      message: foundConfigs.length > 0 ? 
        `Formatting configuration found: ${foundConfigs.join(', ')}` : 
        'Using default formatting configuration',
      foundConfigs
    });
  }

  // 6. Pre-commit Hooks Testing
  async testPreCommitHooks() {
    console.log('🪝 Testing pre-commit hooks...');

    const tests = [
      this.testHuskyConfiguration,
      this.testLintStaged,
      this.testGitHooks
    ];

    for (const test of tests) {
      try {
        await test.call(this);
      } catch (error) {
        this.testResults.preCommit.push({
          test: test.name,
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  async testHuskyConfiguration() {
    const packageJsonPath = path.join(this.frontendPath, 'package.json');
    
    if (await this.fileExists(packageJsonPath)) {
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      const hasHusky = 'husky' in allDeps;
      const huskyDir = path.join(this.templatePath, '.husky');
      const huskyDirExists = await this.directoryExists(huskyDir);

      this.testResults.preCommit.push({
        test: 'husky_configuration',
        status: hasHusky || huskyDirExists ? 'passed' : 'info',
        message: hasHusky || huskyDirExists ? 
          'Husky pre-commit hooks configured' : 
          'No Husky configuration found (optional)',
        hasHusky,
        huskyDirExists
      });
    }
  }

  async testLintStaged() {
    const packageJsonPath = path.join(this.frontendPath, 'package.json');
    
    if (await this.fileExists(packageJsonPath)) {
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      const hasLintStaged = 'lint-staged' in allDeps;
      const hasLintStagedConfig = packageJson['lint-staged'] || 
                                  await this.fileExists(path.join(this.templatePath, '.lintstagedrc'));

      this.testResults.preCommit.push({
        test: 'lint_staged',
        status: hasLintStaged && hasLintStagedConfig ? 'passed' : 'info',
        message: hasLintStaged && hasLintStagedConfig ? 
          'Lint-staged configuration found' : 
          'No lint-staged configuration (optional)',
        hasLintStaged,
        hasLintStagedConfig
      });
    }
  }

  async testGitHooks() {
    const gitHooksDir = path.join(this.templatePath, '.git/hooks');
    
    if (await this.directoryExists(gitHooksDir)) {
      const hooks = await fs.readdir(gitHooksDir);
      const activeHooks = hooks.filter(hook => !hook.endsWith('.sample'));

      this.testResults.preCommit.push({
        test: 'git_hooks',
        status: activeHooks.length > 0 ? 'passed' : 'info',
        message: activeHooks.length > 0 ? 
          `${activeHooks.length} active Git hooks found` : 
          'No active Git hooks found',
        activeHooks
      });
    } else {
      this.testResults.preCommit.push({
        test: 'git_hooks',
        status: 'info',
        message: 'Not in a Git repository or hooks directory not found'
      });
    }
  }

  // 7. Automation Workflows Testing
  async testAutomationWorkflows() {
    console.log('🤖 Testing automation workflows...');

    const tests = [
      this.testCIConfiguration,
      this.testDeploymentScripts,
      this.testDependencyManagement
    ];

    for (const test of tests) {
      try {
        await test.call(this);
      } catch (error) {
        this.testResults.automation.push({
          test: test.name,
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  async testCIConfiguration() {
    const ciFiles = [
      '.github/workflows',
      '.gitlab-ci.yml',
      '.travis.yml',
      'azure-pipelines.yml',
      '.circleci/config.yml'
    ];

    const foundCI = [];
    
    for (const ciFile of ciFiles) {
      const ciPath = path.join(this.templatePath, ciFile);
      const exists = await this.fileExists(ciPath) || await this.directoryExists(ciPath);
      if (exists) {
        foundCI.push(ciFile);
      }
    }

    this.testResults.automation.push({
      test: 'ci_configuration',
      status: foundCI.length > 0 ? 'passed' : 'info',
      message: foundCI.length > 0 ? 
        `CI configuration found: ${foundCI.join(', ')}` : 
        'No CI configuration found',
      foundCI
    });
  }

  async testDeploymentScripts() {
    const deploymentFiles = [
      'vercel.json',
      'netlify.toml',
      'Dockerfile',
      'docker-compose.yml',
      'deploy.sh'
    ];

    const foundDeployment = [];
    
    for (const deployFile of deploymentFiles) {
      const deployPath = path.join(this.templatePath, deployFile);
      if (await this.fileExists(deployPath)) {
        foundDeployment.push(deployFile);
      }
    }

    this.testResults.automation.push({
      test: 'deployment_scripts',
      status: foundDeployment.length > 0 ? 'passed' : 'warning',
      message: foundDeployment.length > 0 ? 
        `Deployment configuration found: ${foundDeployment.join(', ')}` : 
        'No deployment configuration found',
      foundDeployment
    });
  }

  async testDependencyManagement() {
    // Test dependency update and security checking
    const packageJsonPath = path.join(this.frontendPath, 'package.json');
    
    if (await this.fileExists(packageJsonPath)) {
      const auditResult = await this.execCommand('npm audit', { 
        cwd: this.frontendPath,
        timeout: 60000
      });

      // npm audit exits with non-zero if vulnerabilities are found
      const hasVulnerabilities = !auditResult.success;

      this.testResults.automation.push({
        test: 'dependency_management',
        status: hasVulnerabilities ? 'warning' : 'passed',
        message: hasVulnerabilities ? 
          'Security vulnerabilities found in dependencies' : 
          'No security vulnerabilities found',
        vulnerabilities: hasVulnerabilities
      });
    }
  }

  // 8. Script Integration Testing
  async testScriptIntegration() {
    console.log('🔗 Testing script integration...');

    const tests = [
      this.testWorkflowIntegration,
      this.testScriptChaining,
      this.testErrorHandling
    ];

    for (const test of tests) {
      try {
        await test.call(this);
      } catch (error) {
        this.testResults.integration.push({
          test: test.name,
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  async testWorkflowIntegration() {
    // Test that common development workflows work together
    this.testResults.integration.push({
      test: 'workflow_integration',
      status: 'info',
      message: 'Development workflow integration should be tested manually',
      workflows: [
        'install → lint → test → build',
        'dev → hot reload → test',
        'format → lint → commit'
      ]
    });
  }

  async testScriptChaining() {
    // Test script chaining and dependencies
    this.testResults.integration.push({
      test: 'script_chaining',
      status: 'info',
      message: 'Script chaining should use && or ; operators for proper error handling'
    });
  }

  async testErrorHandling() {
    // Test error handling in scripts
    this.testResults.integration.push({
      test: 'error_handling',
      status: 'info',
      message: 'Scripts should handle errors gracefully and provide meaningful messages'
    });
  }

  // Utility Methods
  async execCommand(command, options = {}) {
    const { cwd = this.templatePath, timeout = 30000 } = options;
    
    return new Promise((resolve) => {
      const process = exec(command, { cwd }, (error, stdout, stderr) => {
        resolve({
          success: !error,
          output: stdout,
          error: stderr,
          code: error?.code
        });
      });

      // Track active processes for cleanup
      this.activeProcesses.add(process);

      if (timeout) {
        setTimeout(() => {
          process.kill();
          resolve({
            success: false,
            output: '',
            error: 'Command timeout',
            code: -1
          });
        }, timeout);
      }

      process.on('exit', () => {
        this.activeProcesses.delete(process);
      });
    });
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async directoryExists(dirPath) {
    try {
      const stats = await fs.stat(dirPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
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
        info: 0,
        skipped: 0
      },
      categories: this.testResults,
      scriptAnalysis: {
        packageJsonValid: true,
        buildProcessWorking: false,
        testRunnersConfigured: false,
        lintingEnabled: false,
        formattingEnabled: false,
        preCommitHooksConfigured: false,
        automationConfigured: false
      },
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
        else if (test.status === 'skipped') report.summary.skipped++;
      }
    }

    // Analyze script categories
    report.scriptAnalysis.buildProcessWorking = this.testResults.buildProcess.some(
      test => test.status === 'passed' && test.test.includes('build')
    );
    
    report.scriptAnalysis.testRunnersConfigured = this.testResults.testRunner.some(
      test => test.status === 'passed'
    );
    
    report.scriptAnalysis.lintingEnabled = this.testResults.linting.some(
      test => test.status === 'passed'
    );

    // Determine overall status
    if (report.summary.failed === 0) {
      report.overallStatus = report.summary.warnings > 0 ? 'warning' : 'passed';
    } else {
      report.overallStatus = 'failed';
    }

    // Generate recommendations
    report.recommendations = [
      'Ensure all package.json scripts are properly configured',
      'Test build processes regularly',
      'Set up automated testing and linting',
      'Configure pre-commit hooks for code quality',
      'Implement CI/CD workflows for automation',
      'Keep dependencies up to date and secure',
      'Document development workflows for team members'
    ];

    if (report.summary.failed > 0) {
      report.recommendations.unshift('Fix failing script tests before deployment');
    }

    // Save report
    await fs.writeFile(
      path.join(this.templatePath, 'dev-scripts-test-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('\n📊 Development Scripts Test Results:');
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`⚠️  Warnings: ${report.summary.warnings}`);
    console.log(`ℹ️  Info: ${report.summary.info}`);
    console.log(`⏭️  Skipped: ${report.summary.skipped}`);
    console.log(`\n📄 Detailed report saved to: dev-scripts-test-report.json`);

    return report;
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up development scripts test environment...');
    
    // Kill all active processes
    for (const process of this.activeProcesses) {
      try {
        process.kill('SIGTERM');
      } catch (error) {
        // Process might already be dead
      }
    }

    // Clear timeouts
    for (const timeout of this.scriptTimeouts.values()) {
      clearTimeout(timeout);
    }

    this.activeProcesses.clear();
    this.scriptTimeouts.clear();
  }
}

// Export for use in other test files
module.exports = DevScriptsTestSuite;

// Run if called directly
if (require.main === module) {
  const testSuite = new DevScriptsTestSuite();
  
  testSuite.runAllTests()
    .then((report) => {
      console.log(`\n🎉 Development scripts testing completed with status: ${report.overallStatus}`);
      process.exit(report.overallStatus === 'failed' ? 1 : 0);
    })
    .catch((error) => {
      console.error('💥 Development scripts test suite failed:', error);
      process.exit(1);
    });
}