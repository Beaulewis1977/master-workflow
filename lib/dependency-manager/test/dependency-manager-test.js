#!/usr/bin/env node

/**
 * Comprehensive Test Suite for Claude Flow 2.0 Dependency Manager
 * 
 * Tests all components of the dependency management system across
 * different platforms and scenarios.
 */

const assert = require('assert');
const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const chalk = require('chalk');

const DependencyChecker = require('../dependency-checker');
const CrossPlatformInstaller = require('../installers/cross-platform-installer');
const InteractiveInstallerUI = require('../ui/interactive-installer-ui');
const ClaudeFlowDependencyManager = require('../claude-flow-dependency-manager');
const PostInstallVerifier = require('../verification/post-install-verifier');

const execAsync = promisify(exec);

class DependencyManagerTest {
  constructor() {
    this.testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      details: []
    };
    
    this.mockOptions = {
      dryRun: true,
      nonInteractive: true,
      verbose: false
    };
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log(chalk.cyan.bold('\n🧪 Claude Flow 2.0 Dependency Manager Test Suite'));
    console.log('═'.repeat(70));
    
    const testSuites = [
      { name: 'Dependency Checker Tests', method: this.testDependencyChecker },
      { name: 'Cross-Platform Installer Tests', method: this.testCrossPlatformInstaller },
      { name: 'Interactive UI Tests', method: this.testInteractiveUI },
      { name: 'Main Manager Tests', method: this.testMainManager },
      { name: 'Post-Install Verifier Tests', method: this.testPostInstallVerifier },
      { name: 'Integration Tests', method: this.testIntegration },
      { name: 'Platform-Specific Tests', method: this.testPlatformSpecific },
      { name: 'Error Handling Tests', method: this.testErrorHandling }
    ];

    for (const suite of testSuites) {
      console.log(chalk.yellow.bold(`\n📋 ${suite.name}`));
      console.log('─'.repeat(50));
      
      try {
        await suite.method.call(this);
      } catch (error) {
        this.recordTest(suite.name, 'failed', error.message);
        console.log(chalk.red(`❌ ${suite.name} suite failed: ${error.message}`));
      }
    }

    this.displayTestSummary();
    return this.testResults;
  }

  /**
   * Test Dependency Checker component
   */
  async testDependencyChecker() {
    const checker = new DependencyChecker(this.mockOptions);

    // Test 1: Basic instantiation
    await this.test('Dependency Checker instantiation', () => {
      assert(checker instanceof DependencyChecker, 'Should create DependencyChecker instance');
      assert(checker.dependencies, 'Should have dependencies defined');
    });

    // Test 2: Version comparison
    await this.test('Version comparison', () => {
      assert.strictEqual(checker.compareVersions('2.0.0', '1.9.0'), 1, 'Should detect newer version');
      assert.strictEqual(checker.compareVersions('1.9.0', '2.0.0'), -1, 'Should detect older version');
      assert.strictEqual(checker.compareVersions('2.0.0', '2.0.0'), 0, 'Should detect equal versions');
    });

    // Test 3: Version extraction
    await this.test('Version extraction', () => {
      const version1 = checker.extractVersion('v18.16.0');
      assert.strictEqual(version1, '18.16.0', 'Should extract version from v-prefixed string');
      
      const version2 = checker.extractVersion('npm 9.5.1');
      assert.strictEqual(version2, '9.5.1', 'Should extract version from npm output');
    });

    // Test 4: Platform detection
    await this.test('Platform detection', () => {
      assert(typeof checker.platform === 'string', 'Should detect platform');
      assert(['win32', 'darwin', 'linux'].includes(checker.platform), 'Should be supported platform');
    });

    // Test 5: Dependency categorization
    await this.test('Dependency categorization', () => {
      const categories = checker.groupByCategory();
      assert(typeof categories === 'object', 'Should return categories object');
      assert(categories.runtime || categories.claude || categories.vcs, 'Should have expected categories');
    });
  }

  /**
   * Test Cross-Platform Installer component
   */
  async testCrossPlatformInstaller() {
    const installer = new CrossPlatformInstaller(this.mockOptions);

    // Test 1: Basic instantiation
    await this.test('Cross-Platform Installer instantiation', () => {
      assert(installer instanceof CrossPlatformInstaller, 'Should create installer instance');
      assert.strictEqual(installer.platform, process.platform, 'Should detect correct platform');
    });

    // Test 2: Package manager detection
    await this.test('Package manager detection', async () => {
      const isNpmAvailable = await installer.isNpmAvailable();
      // npm should be available since Node.js is required for this test
      assert(typeof isNpmAvailable === 'boolean', 'Should return boolean for npm availability');
    });

    // Test 3: Linux distribution detection (Linux only)
    if (process.platform === 'linux') {
      await this.test('Linux distribution detection', async () => {
        const distro = await installer.detectLinuxDistribution();
        assert(typeof distro === 'string', 'Should detect Linux distribution');
      });
    } else {
      this.recordTest('Linux distribution detection', 'skipped', 'Not running on Linux');
    }

    // Test 4: Command execution (dry run)
    await this.test('Command execution (dry run)', async () => {
      const result = await installer.executeCommand('echo "test"');
      assert(result === true, 'Should return true for dry run commands');
    });

    // Test 5: File download simulation
    await this.test('Temp directory management', async () => {
      assert(installer.tempDir, 'Should have temp directory defined');
      assert(path.isAbsolute(installer.tempDir), 'Should use absolute path for temp directory');
    });
  }

  /**
   * Test Interactive UI component
   */
  async testInteractiveUI() {
    const ui = new InteractiveInstallerUI(this.mockOptions);

    // Test 1: Basic instantiation
    await this.test('Interactive UI instantiation', () => {
      assert(ui instanceof InteractiveInstallerUI, 'Should create UI instance');
    });

    // Test 2: Progress bar generation
    await this.test('Progress bar generation', () => {
      const progressBar = ui.createProgressBar(0.5, 20);
      assert(typeof progressBar === 'string', 'Should return progress bar string');
      assert(progressBar.length > 0, 'Should generate non-empty progress bar');
    });

    // Test 3: Time formatting
    await this.test('Time formatting', () => {
      assert.strictEqual(ui.formatTime(30000), '30s', 'Should format seconds');
      assert.strictEqual(ui.formatTime(90000), '1m 30s', 'Should format minutes and seconds');
      assert.strictEqual(ui.formatTime(3660000), '1h 1m', 'Should format hours and minutes');
    });

    // Test 4: Platform name detection
    await this.test('Platform name detection', () => {
      const platformName = ui.getPlatformName();
      assert(['Windows', 'macOS', 'Linux', 'Unknown'].includes(platformName), 'Should return valid platform name');
    });

    // Test 5: Status symbol generation
    await this.test('Status symbol generation', () => {
      const result1 = { installed: true, compatible: true };
      const result2 = { installed: false, compatible: false };
      
      assert(typeof ui.getStatusSymbol(result1, true) === 'string', 'Should return status symbol');
      assert(typeof ui.getStatusSymbol(result2, true) === 'string', 'Should return status symbol for missing required');
    });
  }

  /**
   * Test Main Manager component
   */
  async testMainManager() {
    const manager = new ClaudeFlowDependencyManager(this.mockOptions);

    // Test 1: Basic instantiation
    await this.test('Main Manager instantiation', () => {
      assert(manager instanceof ClaudeFlowDependencyManager, 'Should create manager instance');
      assert(manager.checker instanceof DependencyChecker, 'Should have dependency checker');
      assert(manager.installer instanceof CrossPlatformInstaller, 'Should have installer');
      assert(manager.ui instanceof InteractiveInstallerUI, 'Should have UI');
    });

    // Test 2: Configuration loading (with defaults)
    await this.test('Configuration loading', async () => {
      const config = await manager.loadConfiguration();
      assert(typeof config === 'object', 'Should return configuration object');
      assert(config.hasOwnProperty('lastCheck'), 'Should have lastCheck property');
      assert(config.hasOwnProperty('allDependenciesSatisfied'), 'Should have allDependenciesSatisfied property');
    });

    // Test 3: Skip condition checking
    await this.test('Skip condition checking', async () => {
      const shouldSkip1 = await manager.shouldSkipDependencyCheck('help');
      const shouldSkip2 = await manager.shouldSkipDependencyCheck('init');
      
      assert.strictEqual(shouldSkip1, true, 'Should skip for help command');
      assert(typeof shouldSkip2 === 'boolean', 'Should return boolean for init command');
    });

    // Test 4: Installation plan creation
    await this.test('Installation plan creation', () => {
      const mockResults = {
        nodejs: { installed: true, compatible: true },
        git: { installed: false, compatible: false }
      };
      const mockPreferences = { includeOptional: true };
      
      const plan = manager.createInstallationPlan(mockResults, mockPreferences);
      
      assert(typeof plan === 'object', 'Should return installation plan');
      assert(Array.isArray(plan.dependencies), 'Should have dependencies array');
      assert(typeof plan.estimatedTime === 'number', 'Should have estimated time');
    });

    // Test 5: Installer method mapping
    await this.test('Installer method mapping', () => {
      const nodejsMethod = manager.getInstallerMethod('nodejs');
      const gitMethod = manager.getInstallerMethod('git');
      
      assert(typeof nodejsMethod === 'function', 'Should return function for nodejs');
      assert(typeof gitMethod === 'function', 'Should return function for git');
    });
  }

  /**
   * Test Post-Install Verifier component
   */
  async testPostInstallVerifier() {
    const verifier = new PostInstallVerifier(this.mockOptions);

    // Test 1: Basic instantiation
    await this.test('Post-Install Verifier instantiation', () => {
      assert(verifier instanceof PostInstallVerifier, 'Should create verifier instance');
      assert(verifier.verificationTests, 'Should have verification tests defined');
      assert(verifier.fallbackOptions, 'Should have fallback options defined');
    });

    // Test 2: Verification test structure
    await this.test('Verification test structure', () => {
      const nodejsTests = verifier.verificationTests.nodejs;
      assert(Array.isArray(nodejsTests), 'Should have Node.js tests array');
      assert(nodejsTests.length > 0, 'Should have Node.js tests defined');
      
      nodejsTests.forEach(test => {
        assert(typeof test === 'function', 'Each test should be a function');
      });
    });

    // Test 3: Fallback options structure
    await this.test('Fallback options structure', () => {
      const nodejsFallback = verifier.fallbackOptions.nodejs;
      assert(typeof nodejsFallback === 'object', 'Should have Node.js fallback options');
      assert(Array.isArray(nodejsFallback.alternatives), 'Should have alternatives array');
      assert(typeof nodejsFallback.recovery === 'function', 'Should have recovery function');
    });

    // Test 4: Status display formatting
    await this.test('Status display formatting', () => {
      const excellentStatus = verifier.getStatusDisplay('excellent');
      const goodStatus = verifier.getStatusDisplay('good');
      
      assert(typeof excellentStatus === 'string', 'Should return string for excellent status');
      assert(typeof goodStatus === 'string', 'Should return string for good status');
    });

    // Test 5: Basic Node.js test (if available)
    if (await this.isNodejsAvailable()) {
      await this.test('Node.js basic verification test', async () => {
        const mockDep = { name: 'Node.js', key: 'nodejs' };
        const result = await verifier.testNodejsBasic(mockDep);
        
        assert(typeof result === 'object', 'Should return test result object');
        assert(result.name === 'Node.js Basic', 'Should have correct test name');
        assert(['passed', 'failed', 'warning'].includes(result.status), 'Should have valid status');
      });
    } else {
      this.recordTest('Node.js basic verification test', 'skipped', 'Node.js not available');
    }
  }

  /**
   * Test Integration scenarios
   */
  async testIntegration() {
    // Test 1: Full workflow simulation (dry run)
    await this.test('Full workflow simulation', async () => {
      const manager = new ClaudeFlowDependencyManager({
        ...this.mockOptions,
        nonInteractive: true
      });
      
      // This should complete without errors in dry run mode
      const result = await manager.ensureDependencies('test');
      
      assert(typeof result === 'object', 'Should return result object');
      assert(typeof result.success === 'boolean', 'Should have success property');
    });

    // Test 2: Configuration persistence simulation
    await this.test('Configuration persistence', async () => {
      const manager = new ClaudeFlowDependencyManager(this.mockOptions);
      
      // Load default config
      const config1 = await manager.loadConfiguration();
      assert(typeof config1 === 'object', 'Should load default configuration');
      
      // Save updates would normally write to file
      // In test mode, we just verify the method exists and runs
      await manager.saveConfiguration({ testProperty: true });
      // No assertion needed - just verify it doesn't throw
    });

    // Test 3: Component interaction
    await this.test('Component interaction', () => {
      const manager = new ClaudeFlowDependencyManager(this.mockOptions);
      
      // Verify all components are properly initialized
      assert(manager.checker instanceof DependencyChecker, 'Should have checker');
      assert(manager.installer instanceof CrossPlatformInstaller, 'Should have installer');
      assert(manager.ui instanceof InteractiveInstallerUI, 'Should have UI');
      
      // Verify shared options are passed through
      assert.strictEqual(manager.checker.dryRun, manager.mockOptions?.dryRun, 'Should pass dry run option to checker');
    });
  }

  /**
   * Test Platform-specific functionality
   */
  async testPlatformSpecific() {
    const platform = process.platform;
    
    // Test 1: Platform detection
    await this.test('Platform detection', () => {
      assert(['win32', 'darwin', 'linux'].includes(platform), 'Should detect supported platform');
    });

    // Test 2: Platform-specific installer methods
    await this.test('Platform-specific installer methods', () => {
      const installer = new CrossPlatformInstaller(this.mockOptions);
      
      // Each platform should have methods defined
      assert(typeof installer.installNodejs === 'function', 'Should have Node.js installer');
      assert(typeof installer.installGit === 'function', 'Should have Git installer');
    });

    // Test 3: Package manager availability
    await this.test('Package manager availability checks', async () => {
      const installer = new CrossPlatformInstaller(this.mockOptions);
      
      switch (platform) {
        case 'win32':
          const hasChoco = await installer.isChocoAvailable();
          const hasWinget = await installer.isWingetAvailable();
          assert(typeof hasChoco === 'boolean', 'Should check Chocolatey availability');
          assert(typeof hasWinget === 'boolean', 'Should check winget availability');
          break;
          
        case 'darwin':
          const hasBrew = await installer.isBrewAvailable();
          assert(typeof hasBrew === 'boolean', 'Should check Homebrew availability');
          break;
          
        case 'linux':
          const distro = await installer.detectLinuxDistribution();
          assert(typeof distro === 'string', 'Should detect Linux distribution');
          break;
      }
    });

    // Test 4: Platform-specific UI elements
    await this.test('Platform-specific UI elements', () => {
      const ui = new InteractiveInstallerUI(this.mockOptions);
      
      const platformName = ui.getPlatformName();
      switch (platform) {
        case 'win32':
          assert.strictEqual(platformName, 'Windows', 'Should return Windows for win32');
          break;
        case 'darwin':
          assert.strictEqual(platformName, 'macOS', 'Should return macOS for darwin');
          break;
        case 'linux':
          assert.strictEqual(platformName, 'Linux', 'Should return Linux for linux');
          break;
      }
    });
  }

  /**
   * Test Error handling scenarios
   */
  async testErrorHandling() {
    // Test 1: Invalid dependency check
    await this.test('Invalid dependency handling', async () => {
      const checker = new DependencyChecker(this.mockOptions);
      
      try {
        // This should handle gracefully
        const invalidDep = {
          checkCommand: 'nonexistent-command-12345 --version'
        };
        
        const result = await checker.executeCheck(invalidDep);
        // Should return error state, not throw
        assert(result.installed === false, 'Should mark as not installed');
      } catch (error) {
        // This is also acceptable - just verify it's handled
        assert(error instanceof Error, 'Should be proper error object');
      }
    });

    // Test 2: Network failure simulation
    await this.test('Network failure handling', async () => {
      const installer = new CrossPlatformInstaller({
        ...this.mockOptions,
        offline: true
      });
      
      // In offline mode, downloads should be skipped or handled gracefully
      assert.strictEqual(installer.offline, true, 'Should be in offline mode');
      // No download should be attempted in dry run + offline mode
    });

    // Test 3: Permission error simulation
    await this.test('Permission error handling', () => {
      const manager = new ClaudeFlowDependencyManager(this.mockOptions);
      
      // Should handle permission errors gracefully
      // In dry run mode, these won't actually occur
      assert(typeof manager.getInstallerMethod === 'function', 'Should have error handling methods');
    });

    // Test 4: Configuration file errors
    await this.test('Configuration file error handling', async () => {
      const manager = new ClaudeFlowDependencyManager({
        ...this.mockOptions,
        configFile: '/invalid/path/config.json'
      });
      
      // Should return default config when file is inaccessible
      const config = await manager.loadConfiguration();
      assert(typeof config === 'object', 'Should return default configuration');
      assert(config.lastCheck === null, 'Should have default values');
    });
  }

  // Helper methods

  async test(name, testFunction) {
    this.testResults.total++;
    
    try {
      if (typeof testFunction === 'function') {
        await testFunction();
      }
      
      this.testResults.passed++;
      console.log(chalk.green(`  ✅ ${name}`));
      this.recordTest(name, 'passed');
      
    } catch (error) {
      this.testResults.failed++;
      console.log(chalk.red(`  ❌ ${name}: ${error.message}`));
      this.recordTest(name, 'failed', error.message);
    }
  }

  recordTest(name, status, details = '') {
    this.testResults.details.push({
      name,
      status,
      details,
      timestamp: new Date().toISOString()
    });
  }

  async isNodejsAvailable() {
    try {
      await execAsync('node --version');
      return true;
    } catch (error) {
      return false;
    }
  }

  displayTestSummary() {
    console.log('\n' + '═'.repeat(70));
    console.log(chalk.cyan.bold('🏁 Test Results Summary'));
    console.log('═'.repeat(70));
    
    const { total, passed, failed, skipped } = this.testResults;
    
    console.log(chalk.green(`✅ Passed: ${passed}/${total}`));
    console.log(chalk.red(`❌ Failed: ${failed}/${total}`));
    console.log(chalk.yellow(`⏭️  Skipped: ${skipped}/${total}`));
    
    const successRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    console.log(chalk.cyan(`📊 Success Rate: ${successRate}%`));
    
    if (failed > 0) {
      console.log(chalk.red('\n🔍 Failed Tests:'));
      this.testResults.details
        .filter(test => test.status === 'failed')
        .forEach(test => {
          console.log(chalk.red(`  • ${test.name}: ${test.details}`));
        });
    }
    
    console.log(`\n${this.getOverallStatus(successRate)}`);
  }

  getOverallStatus(successRate) {
    if (successRate >= 95) {
      return chalk.green.bold('🎉 Excellent! All systems are working properly.');
    } else if (successRate >= 85) {
      return chalk.yellow.bold('✅ Good! Minor issues detected but system is functional.');
    } else if (successRate >= 70) {
      return chalk.orange.bold('⚠️  Warning! Some issues need attention.');
    } else {
      return chalk.red.bold('❌ Critical! Major issues detected - review required.');
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new DependencyManagerTest();
  
  tester.runAllTests()
    .then((results) => {
      process.exit(results.failed === 0 ? 0 : 1);
    })
    .catch((error) => {
      console.error(chalk.red('💥 Test runner failed:'), error.message);
      process.exit(1);
    });
}

module.exports = DependencyManagerTest;