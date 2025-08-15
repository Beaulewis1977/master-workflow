#!/usr/bin/env node

/**
 * Claude Flow 2.0 Dependency Manager - Main Integration Module
 * 
 * This is the main entry point that integrates all dependency management
 * components with the Claude Flow 2.0 initialization system.
 * 
 * Features:
 * - Automatic dependency checking before any Claude Flow operation
 * - Interactive installation with user prompts
 * - Integration with existing Claude Flow commands
 * - Support for offline/enterprise environments
 * - Comprehensive error handling and recovery
 */

const path = require('path');
const fs = require('fs').promises;
const DependencyChecker = require('./dependency-checker');
const CrossPlatformInstaller = require('./installers/cross-platform-installer');
const InteractiveInstallerUI = require('./ui/interactive-installer-ui');
const chalk = require('chalk');

class ClaudeFlowDependencyManager {
  constructor(options = {}) {
    this.options = {
      nonInteractive: options.nonInteractive || false,
      verbose: options.verbose || false,
      offline: options.offline || false,
      skipOptional: options.skipOptional || false,
      dryRun: options.dryRun || false,
      configFile: options.configFile || '.claude-flow-config.json',
      ...options
    };

    this.checker = new DependencyChecker(this.options);
    this.installer = new CrossPlatformInstaller(this.options);
    this.ui = new InteractiveInstallerUI(this.options);
    
    this.installationHistory = [];
    this.systemInfo = null;
  }

  /**
   * Main entry point for dependency management
   * Called before any Claude Flow 2.0 operation
   */
  async ensureDependencies(command = 'init') {
    try {
      // Load existing configuration
      await this.loadConfiguration();
      
      // Check if we need to run dependency check
      if (await this.shouldSkipDependencyCheck(command)) {
        return { success: true, skipped: true };
      }

      // Start dependency checking process
      return await this.runDependencyCheckAndInstall();
      
    } catch (error) {
      this.ui.displayError(error, 'Dependency management failed');
      return { success: false, error: error.message };
    }
  }

  /**
   * Run the complete dependency check and installation process
   */
  async runDependencyCheckAndInstall() {
    let results = { success: false };

    try {
      // Show welcome banner (unless quiet mode)
      if (!this.options.nonInteractive && !this.options.quiet) {
        this.ui.displayWelcomeBanner();
        this.ui.displaySystemRequirements();
        this.ui.displayPlatformNotes();
      }

      // Step 1: Gather user preferences
      let preferences = { installMode: 'express', verbosity: 'normal' };
      
      if (!this.options.nonInteractive) {
        preferences = await this.ui.gatherInstallationPreferences();
        
        if (preferences.installMode === 'check-only') {
          return await this.runDependencyCheckOnly();
        }
      }

      // Step 2: Check all dependencies
      console.log(chalk.cyan.bold('\n🔍 Checking Dependencies...'));
      const checkResults = await this.checker.checkAllDependencies();
      
      // Step 3: Determine what needs to be installed
      const installationPlan = this.createInstallationPlan(checkResults, preferences);
      
      if (installationPlan.dependencies.length === 0) {
        console.log(chalk.green.bold('\n✅ All dependencies are already satisfied!'));
        await this.saveConfiguration({ lastCheck: Date.now(), allDependenciesSatisfied: true });
        return { success: true, message: 'All dependencies satisfied' };
      }

      // Step 4: Display plan and get confirmation
      if (!this.options.nonInteractive) {
        this.ui.displayInstallationPlan(installationPlan);
        
        if (preferences.installMode === 'custom') {
          const selectedDeps = await this.ui.selectDependencies(this.checker.dependencies);
          installationPlan.dependencies = installationPlan.dependencies.filter(
            dep => selectedDeps.includes(dep.key)
          );
        }
        
        const confirmed = await this.ui.confirmInstallation(installationPlan);
        if (!confirmed) {
          console.log(chalk.yellow('\n⏹️  Installation cancelled by user'));
          return { success: false, cancelled: true };
        }
      }

      // Step 5: Execute installation
      results = await this.executeInstallationPlan(installationPlan);
      
      // Step 6: Save configuration and results
      await this.saveInstallationResults(results);
      
      return results;

    } catch (error) {
      console.error(chalk.red('\n❌ Dependency management failed:'), error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Run dependency check only (no installation)
   */
  async runDependencyCheckOnly() {
    console.log(chalk.cyan.bold('\n🔍 Dependency Check (No Installation)'));
    
    const checkResults = await this.checker.checkAllDependencies();
    
    // Display results without installation options
    console.log('\n' + chalk.yellow.bold('📊 Dependency Status Summary:'));
    console.log('═'.repeat(60));
    
    const categories = this.groupResultsByCategory(checkResults);
    
    for (const [category, deps] of Object.entries(categories)) {
      console.log(chalk.cyan.bold(`\n${category.toUpperCase()}:`));
      
      for (const [key, result] of deps) {
        const dep = this.checker.dependencies[key];
        const status = this.getStatusDisplay(result, dep.required);
        console.log(`  ${status.icon} ${dep.name}${status.version}`);
      }
    }
    
    return { success: true, checkOnly: true, results: checkResults };
  }

  /**
   * Create installation plan based on check results
   */
  createInstallationPlan(checkResults, preferences) {
    const plan = {
      dependencies: [],
      estimatedTime: 0,
      diskSpace: '~500MB',
      requiresInternet: true,
      warnings: []
    };

    for (const [key, result] of Object.entries(checkResults)) {
      const dep = this.checker.dependencies[key];
      
      // Skip if already installed and compatible
      if (result.installed && result.compatible) {
        continue;
      }
      
      // Skip optional dependencies if requested
      if (!dep.required && (this.options.skipOptional || !preferences.includeOptional)) {
        continue;
      }
      
      // Add to installation plan
      plan.dependencies.push({
        key,
        name: dep.name,
        description: dep.description,
        required: dep.required,
        estimatedTime: this.getEstimatedInstallTime(key),
        category: dep.category,
        reason: result.installed ? 'outdated' : 'missing'
      });
      
      plan.estimatedTime += this.getEstimatedInstallTime(key);
    }

    // Add platform-specific warnings
    this.addPlatformWarnings(plan);
    
    return plan;
  }

  /**
   * Execute the installation plan
   */
  async executeInstallationPlan(plan) {
    const results = {
      total: plan.dependencies.length,
      successful: 0,
      failed: 0,
      skipped: 0,
      successfulDependencies: [],
      failedDependencies: [],
      skippedDependencies: []
    };

    this.ui.startInstallationProgress(plan.dependencies.length);

    for (const dep of plan.dependencies) {
      try {
        this.ui.updateStepProgress(dep.name, 'in-progress');
        
        // Execute installation
        const installResult = await this.installSingleDependency(dep);
        
        if (installResult.success) {
          this.ui.updateStepProgress(dep.name, 'completed', installResult.details);
          results.successful++;
          results.successfulDependencies.push({
            name: dep.name,
            version: installResult.version || 'unknown'
          });
        } else {
          throw new Error(installResult.error || 'Installation failed');
        }
        
      } catch (error) {
        // Handle installation failure
        const action = this.options.nonInteractive ? 'skip' : 
          await this.ui.askForRetry(dep.name, error);
        
        switch (action) {
          case 'retry':
            // Retry installation once
            try {
              const retryResult = await this.installSingleDependency(dep);
              if (retryResult.success) {
                this.ui.updateStepProgress(dep.name, 'completed', retryResult.details);
                results.successful++;
                results.successfulDependencies.push({
                  name: dep.name,
                  version: retryResult.version || 'unknown'
                });
              } else {
                throw new Error(retryResult.error);
              }
            } catch (retryError) {
              this.ui.updateStepProgress(dep.name, 'failed', retryError.message);
              results.failed++;
              results.failedDependencies.push({
                name: dep.name,
                error: retryError.message
              });
            }
            break;
            
          case 'skip':
            this.ui.updateStepProgress(dep.name, 'skipped', 'Skipped by user');
            results.skipped++;
            results.skippedDependencies.push({
              name: dep.name,
              reason: 'Skipped due to installation failure'
            });
            break;
            
          case 'manual':
            this.ui.updateStepProgress(dep.name, 'skipped', 'Manual installation required');
            results.skipped++;
            results.skippedDependencies.push({
              name: dep.name,
              reason: 'Manual installation required'
            });
            this.displayManualInstallInstructions(dep);
            break;
            
          case 'abort':
            throw new Error('Installation aborted by user');
        }
      }
    }

    // Display final results
    this.ui.displayInstallationResults(results);
    
    results.success = results.failed === 0 || (results.successful > 0 && results.failed < results.total);
    
    return results;
  }

  /**
   * Install a single dependency
   */
  async installSingleDependency(dep) {
    const installerMethod = this.getInstallerMethod(dep.key);
    
    if (!installerMethod) {
      return { 
        success: false, 
        error: `No installer available for ${dep.name} on ${process.platform}` 
      };
    }

    try {
      await installerMethod.call(this.installer);
      
      // Verify installation
      const verification = await this.verifyInstallation(dep.key);
      
      return {
        success: verification.success,
        version: verification.version,
        details: verification.details,
        error: verification.error
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get installer method for a dependency
   */
  getInstallerMethod(dependencyKey) {
    const methods = {
      'nodejs': this.installer.installNodejs,
      'git': this.installer.installGit,
      'claude-code-cli': this.installer.installClaudeCodeCLI,
      'claude-flow': this.installer.installClaudeFlow,
      'agent-os': this.installer.installAgentOS,
      'tmux': this.installer.installTmux
    };

    return methods[dependencyKey];
  }

  /**
   * Verify installation of a dependency
   */
  async verifyInstallation(dependencyKey) {
    try {
      const dep = this.checker.dependencies[dependencyKey];
      const result = await this.checker.executeCheck(dep);
      
      return {
        success: result.installed && result.compatible,
        version: result.version,
        details: result.note || `v${result.version}`,
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Determine if dependency check should be skipped
   */
  async shouldSkipDependencyCheck(command) {
    // Skip for certain commands
    const skipCommands = ['help', 'version', '--help', '--version'];
    if (skipCommands.includes(command)) {
      return true;
    }

    // Check configuration
    const config = await this.loadConfiguration();
    
    // Skip if checked recently (within 24 hours) and all dependencies were satisfied
    if (config.lastCheck && config.allDependenciesSatisfied) {
      const hoursSinceCheck = (Date.now() - config.lastCheck) / (1000 * 60 * 60);
      if (hoursSinceCheck < 24) {
        return true;
      }
    }

    return false;
  }

  /**
   * Load configuration from file
   */
  async loadConfiguration() {
    try {
      const configPath = path.join(process.cwd(), this.options.configFile);
      const configData = await fs.readFile(configPath, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      // Return default configuration if file doesn't exist
      return {
        lastCheck: null,
        allDependenciesSatisfied: false,
        installationHistory: []
      };
    }
  }

  /**
   * Save configuration to file
   */
  async saveConfiguration(updates) {
    try {
      const config = await this.loadConfiguration();
      const newConfig = { ...config, ...updates };
      
      const configPath = path.join(process.cwd(), this.options.configFile);
      await fs.writeFile(configPath, JSON.stringify(newConfig, null, 2));
    } catch (error) {
      // Ignore save errors
      console.warn(chalk.yellow('Warning: Could not save configuration'));
    }
  }

  /**
   * Save installation results
   */
  async saveInstallationResults(results) {
    const installationRecord = {
      timestamp: Date.now(),
      platform: process.platform,
      results: results,
      claudeFlowVersion: '2.0.0'
    };

    await this.saveConfiguration({
      lastCheck: Date.now(),
      allDependenciesSatisfied: results.success && results.failed === 0,
      lastInstallation: installationRecord
    });
  }

  // Utility methods

  getEstimatedInstallTime(dependencyKey) {
    const times = {
      'nodejs': 120000, // 2 minutes
      'git': 60000,     // 1 minute
      'claude-code-cli': 30000, // 30 seconds
      'claude-flow': 30000,     // 30 seconds
      'agent-os': 45000,        // 45 seconds
      'tmux': 30000,            // 30 seconds
      'npm': 15000              // 15 seconds
    };

    return times[dependencyKey] || 60000; // Default 1 minute
  }

  addPlatformWarnings(plan) {
    switch (process.platform) {
      case 'win32':
        plan.warnings.push('Windows: Some installations may require running as Administrator');
        plan.warnings.push('Windows: TMux has limited support, Windows Terminal recommended');
        break;
      case 'darwin':
        plan.warnings.push('macOS: May prompt for Xcode Command Line Tools installation');
        break;
      case 'linux':
        plan.warnings.push('Linux: Sudo permissions required for system packages');
        break;
    }
  }

  groupResultsByCategory(results) {
    const grouped = {};
    
    for (const [key, result] of Object.entries(results)) {
      const dep = this.checker.dependencies[key];
      const category = dep.category || 'other';
      
      if (!grouped[category]) {
        grouped[category] = [];
      }
      
      grouped[category].push([key, result]);
    }
    
    return grouped;
  }

  getStatusDisplay(result, required) {
    if (result.installed && result.compatible) {
      return { 
        icon: '✅', 
        version: ` v${result.version}` 
      };
    } else if (result.installed && !result.compatible) {
      return { 
        icon: '⚠️ ', 
        version: ` v${result.version} (outdated)` 
      };
    } else if (required) {
      return { 
        icon: '❌', 
        version: ' (missing)' 
      };
    } else {
      return { 
        icon: '⚪', 
        version: ' (not installed)' 
      };
    }
  }

  displayManualInstallInstructions(dep) {
    const dependency = this.checker.dependencies[dep.key];
    
    console.log(chalk.yellow.bold(`\n📋 Manual Installation: ${dep.name}`));
    console.log('═'.repeat(50));
    console.log(`Description: ${dependency.description}`);
    
    if (dependency.installMethods[process.platform]) {
      console.log(`Command: ${dependency.installMethods[process.platform]}`);
    }
    
    if (dependency.fallbackUrl) {
      console.log(`Download: ${dependency.fallbackUrl}`);
    }
  }
}

/**
 * Command-line interface
 */
async function runCLI() {
  const args = process.argv.slice(2);
  
  const options = {
    nonInteractive: args.includes('--non-interactive') || args.includes('-y'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    offline: args.includes('--offline'),
    skipOptional: args.includes('--skip-optional'),
    dryRun: args.includes('--dry-run'),
    quiet: args.includes('--quiet') || args.includes('-q')
  };

  const manager = new ClaudeFlowDependencyManager(options);
  
  try {
    const command = args.find(arg => !arg.startsWith('--')) || 'init';
    const result = await manager.ensureDependencies(command);
    
    if (result.success) {
      console.log(chalk.green('\n✅ Dependency management completed successfully'));
      process.exit(0);
    } else {
      console.error(chalk.red('\n❌ Dependency management failed'));
      if (result.error) {
        console.error(chalk.red(`Error: ${result.error}`));
      }
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red('\n💥 Fatal error:'), error.message);
    process.exit(1);
  }
}

module.exports = ClaudeFlowDependencyManager;

// Run CLI if called directly
if (require.main === module) {
  runCLI();
}