#!/usr/bin/env node

/**
 * Claude Flow 2.0 Comprehensive Dependency Checker
 * 
 * This module checks for all required dependencies and offers automated installation
 * for missing components with cross-platform support and interactive user experience.
 * 
 * Features:
 * - Version validation for all dependencies
 * - Cross-platform installation support (Windows, macOS, Linux)
 * - Interactive prompts with progress indicators
 * - Fallback options for failed installations
 * - Post-installation verification
 * - Enterprise/offline environment support
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const chalk = require('chalk');
const inquirer = require('inquirer');

const execAsync = promisify(exec);

class DependencyChecker {
  constructor(options = {}) {
    this.platform = process.platform;
    this.offline = options.offline || false;
    this.nonInteractive = options.nonInteractive || false;
    this.verbose = options.verbose || false;
    
    this.dependencies = {
      // Core Runtime Dependencies
      nodejs: {
        name: 'Node.js',
        required: true,
        minVersion: '16.0.0',
        recommendedVersion: '18.16.0',
        checkCommand: 'node --version',
        category: 'runtime',
        description: 'JavaScript runtime environment',
        installMethods: {
          windows: 'choco install nodejs',
          macos: 'brew install node',
          linux: 'curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs'
        },
        fallbackUrl: 'https://nodejs.org/download/',
        priority: 1
      },
      
      git: {
        name: 'Git',
        required: true,
        minVersion: '2.20.0',
        recommendedVersion: '2.40.0',
        checkCommand: 'git --version',
        category: 'vcs',
        description: 'Version control system',
        installMethods: {
          windows: 'choco install git',
          macos: 'brew install git',
          linux: 'sudo apt-get update && sudo apt-get install -y git'
        },
        fallbackUrl: 'https://git-scm.com/downloads',
        priority: 2
      },
      
      // Claude Flow Dependencies
      'claude-code-cli': {
        name: 'Claude Code CLI',
        required: true,
        minVersion: '1.0.0',
        checkCommand: 'claude --version',
        category: 'claude',
        description: 'Core AI coding platform',
        installMethods: {
          windows: 'npm install -g @anthropic/claude-code',
          macos: 'npm install -g @anthropic/claude-code',
          linux: 'npm install -g @anthropic/claude-code'
        },
        fallbackUrl: 'https://claude.ai/code/install',
        priority: 3
      },
      
      'claude-flow': {
        name: 'Claude Flow 2.0',
        required: true,
        minVersion: '2.0.0',
        checkCommand: 'npx claude-flow@2.0.0 --version',
        category: 'claude',
        description: 'Workflow orchestration engine',
        installMethods: {
          windows: 'npm install -g claude-flow@2.0.0',
          macos: 'npm install -g claude-flow@2.0.0',
          linux: 'npm install -g claude-flow@2.0.0'
        },
        fallbackCommand: 'npx claude-flow@2.0.0',
        priority: 4
      },
      
      'agent-os': {
        name: 'Agent-OS',
        required: true,
        minVersion: '1.0.0',
        checkCommand: 'agent-os --version',
        category: 'agents',
        description: 'Specialized agents system',
        installMethods: {
          windows: 'npm install -g @agent-os/cli',
          macos: 'npm install -g @agent-os/cli',
          linux: 'npm install -g @agent-os/cli'
        },
        fallbackUrl: 'https://agent-os.dev/install',
        priority: 5
      },
      
      // Optional but Recommended
      tmux: {
        name: 'TMux Orchestrator',
        required: false,
        minVersion: '3.0.0',
        checkCommand: 'tmux -V',
        category: 'terminal',
        description: 'Terminal multiplexing for session management',
        installMethods: {
          windows: 'choco install tmux',
          macos: 'brew install tmux',
          linux: 'sudo apt-get update && sudo apt-get install -y tmux'
        },
        windowsAlternative: 'Windows Terminal with tabs (built-in alternative)',
        priority: 6
      },
      
      // Package Managers
      npm: {
        name: 'npm',
        required: true,
        minVersion: '8.0.0',
        checkCommand: 'npm --version',
        category: 'package-manager',
        description: 'Node.js package manager',
        installMethods: {
          windows: 'npm install -g npm@latest',
          macos: 'npm install -g npm@latest',
          linux: 'npm install -g npm@latest'
        },
        note: 'Usually comes with Node.js',
        priority: 7
      }
    };
    
    this.packageManagers = ['npm', 'yarn', 'pnpm'];
    this.results = {};
    this.installQueue = [];
  }

  /**
   * Main entry point for dependency checking
   */
  async checkAllDependencies() {
    console.log(chalk.cyan.bold('\n🔍 Claude Flow 2.0 Dependency Checker'));
    console.log(chalk.gray('Checking system requirements and dependencies...\n'));

    // Step 1: Check system info
    await this.displaySystemInfo();
    
    // Step 2: Check each dependency
    await this.checkIndividualDependencies();
    
    // Step 3: Display results summary
    this.displayResultsSummary();
    
    // Step 4: Handle missing dependencies
    if (this.hasMissingRequired()) {
      await this.handleMissingDependencies();
    }
    
    // Step 5: Final verification
    await this.finalVerification();
    
    return this.results;
  }

  /**
   * Display system information
   */
  async displaySystemInfo() {
    console.log(chalk.yellow('📋 System Information:'));
    console.log(`  Platform: ${this.platform}`);
    console.log(`  Architecture: ${process.arch}`);
    console.log(`  Node.js: ${process.version}`);
    
    // Check available package managers
    const availableManagers = await this.checkPackageManagers();
    console.log(`  Package Managers: ${availableManagers.join(', ') || 'None detected'}`);
    
    // Check internet connectivity
    const online = await this.checkInternetConnectivity();
    console.log(`  Internet: ${online ? '✅ Connected' : '❌ Offline'}`);
    
    console.log('');
  }

  /**
   * Check each dependency individually
   */
  async checkIndividualDependencies() {
    const sortedDeps = Object.entries(this.dependencies)
      .sort(([,a], [,b]) => a.priority - b.priority);

    for (const [key, dep] of sortedDeps) {
      await this.checkSingleDependency(key, dep);
    }
  }

  /**
   * Check a single dependency
   */
  async checkSingleDependency(key, dep) {
    const status = dep.required ? chalk.red('REQUIRED') : chalk.yellow('OPTIONAL');
    console.log(`Checking ${dep.name} (${status})...`);
    
    try {
      const result = await this.executeCheck(dep);
      this.results[key] = result;
      
      if (result.installed) {
        const versionStatus = this.compareVersions(result.version, dep.minVersion) >= 0 
          ? '✅' : '⚠️ ';
        console.log(`  ${versionStatus} ${dep.name} v${result.version} ${result.compatible ? '(compatible)' : '(needs update)'}`);
      } else {
        const symbol = dep.required ? '❌' : '⚪';
        console.log(`  ${symbol} ${dep.name} (not installed)`);
        if (dep.required) {
          this.installQueue.push({ key, dep, reason: 'missing' });
        }
      }
    } catch (error) {
      this.results[key] = {
        installed: false,
        error: error.message,
        compatible: false
      };
      
      const symbol = dep.required ? '❌' : '⚪';
      console.log(`  ${symbol} ${dep.name} (check failed: ${error.message})`);
      
      if (dep.required) {
        this.installQueue.push({ key, dep, reason: 'check-failed' });
      }
    }
  }

  /**
   * Execute version check for a dependency
   */
  async executeCheck(dep) {
    try {
      const { stdout, stderr } = await execAsync(dep.checkCommand);
      const output = stdout || stderr;
      const version = this.extractVersion(output);
      
      return {
        installed: true,
        version: version,
        compatible: this.compareVersions(version, dep.minVersion) >= 0,
        output: output.trim()
      };
    } catch (error) {
      // Try alternative checks for some dependencies
      if (dep.name === 'Claude Flow 2.0') {
        return await this.checkClaudeFlowAlternative();
      }
      
      throw error;
    }
  }

  /**
   * Alternative check for Claude Flow (using npx)
   */
  async checkClaudeFlowAlternative() {
    try {
      const { stdout } = await execAsync('npx claude-flow@2.0.0 --help');
      return {
        installed: true,
        version: '2.0.0',
        compatible: true,
        output: 'Available via npx',
        note: 'Using npx for on-demand execution'
      };
    } catch (error) {
      return {
        installed: false,
        compatible: false,
        error: 'Not available via npx'
      };
    }
  }

  /**
   * Display comprehensive results summary
   */
  displayResultsSummary() {
    console.log('\n' + chalk.yellow.bold('📊 Dependency Check Results:'));
    console.log('═'.repeat(60));
    
    const categories = this.groupByCategory();
    
    for (const [category, deps] of Object.entries(categories)) {
      console.log(chalk.cyan.bold(`\n${category.toUpperCase()}:`));
      
      for (const [key, result] of deps) {
        const dep = this.dependencies[key];
        const status = this.getStatusSymbol(result, dep.required);
        const versionInfo = result.version ? ` (v${result.version})` : '';
        
        console.log(`  ${status} ${dep.name}${versionInfo}`);
        
        if (result.note) {
          console.log(`    ℹ️  ${result.note}`);
        }
        
        if (!result.compatible && result.version) {
          console.log(`    ⚠️  Minimum version required: v${dep.minVersion}`);
        }
      }
    }
    
    // Summary stats
    const total = Object.keys(this.dependencies).length;
    const installed = Object.values(this.results).filter(r => r.installed).length;
    const required = Object.values(this.dependencies).filter(d => d.required).length;
    const requiredInstalled = Object.entries(this.results)
      .filter(([key, result]) => this.dependencies[key].required && result.installed).length;
    
    console.log('\n' + '═'.repeat(60));
    console.log(chalk.green(`✅ Installed: ${installed}/${total} dependencies`));
    console.log(chalk.blue(`🔧 Required: ${requiredInstalled}/${required} critical dependencies`));
    
    if (requiredInstalled < required) {
      console.log(chalk.red(`❌ Missing: ${required - requiredInstalled} required dependencies`));
    }
  }

  /**
   * Handle missing dependencies with user interaction
   */
  async handleMissingDependencies() {
    if (this.installQueue.length === 0) {
      return;
    }

    console.log('\n' + chalk.red.bold('🚨 Missing Required Dependencies'));
    console.log('The following dependencies are required for Claude Flow 2.0 to function properly:\n');

    // Show missing dependencies
    for (const { key, dep, reason } of this.installQueue) {
      console.log(`  ❌ ${dep.name} - ${dep.description}`);
      if (reason === 'check-failed') {
        console.log(`     (Version check failed - may need reinstallation)`);
      }
    }

    if (this.nonInteractive) {
      console.log('\n' + chalk.yellow('Running in non-interactive mode. Skipping installation prompts.'));
      console.log('Please install missing dependencies manually and run the check again.');
      return;
    }

    // Ask user if they want to install
    const { shouldInstall } = await inquirer.prompt([{
      type: 'confirm',
      name: 'shouldInstall',
      message: 'Would you like to install the missing dependencies automatically?',
      default: true
    }]);

    if (!shouldInstall) {
      console.log('\n' + chalk.yellow('⏸️  Installation skipped. Please install dependencies manually.'));
      this.displayManualInstallInstructions();
      return;
    }

    // Install dependencies
    await this.installDependencies();
  }

  /**
   * Install missing dependencies
   */
  async installDependencies() {
    console.log('\n' + chalk.green.bold('📦 Installing Dependencies...'));
    
    let successCount = 0;
    let failCount = 0;

    for (const { key, dep } of this.installQueue) {
      console.log(`\n${chalk.cyan('Installing')} ${dep.name}...`);
      
      try {
        await this.installSingleDependency(key, dep);
        
        // Verify installation
        const verifyResult = await this.executeCheck(dep);
        if (verifyResult.installed && verifyResult.compatible) {
          console.log(`  ✅ ${dep.name} installed successfully (v${verifyResult.version})`);
          this.results[key] = verifyResult;
          successCount++;
        } else {
          throw new Error('Installation verification failed');
        }
        
      } catch (error) {
        console.log(`  ❌ Failed to install ${dep.name}: ${error.message}`);
        failCount++;
        
        // Try fallback options
        await this.tryFallbackInstallation(key, dep);
      }
    }

    // Installation summary
    console.log('\n' + '═'.repeat(50));
    console.log(chalk.green(`✅ Successfully installed: ${successCount} dependencies`));
    if (failCount > 0) {
      console.log(chalk.red(`❌ Failed to install: ${failCount} dependencies`));
    }
  }

  /**
   * Install a single dependency
   */
  async installSingleDependency(key, dep) {
    const installMethod = dep.installMethods[this.platform];
    
    if (!installMethod) {
      throw new Error(`No installation method available for ${this.platform}`);
    }

    // Special handling for Windows tmux
    if (key === 'tmux' && this.platform === 'win32') {
      console.log(`  ℹ️  ${dep.windowsAlternative || 'Consider using Windows Terminal as an alternative'}`);
      return;
    }

    // Show progress indicator
    const installProcess = this.executeInstallCommand(installMethod);
    await this.showInstallProgress(dep.name, installProcess);
  }

  /**
   * Execute installation command with progress tracking
   */
  async executeInstallCommand(command) {
    return new Promise((resolve, reject) => {
      const [cmd, ...args] = command.split(' ');
      const process = spawn(cmd, args, { 
        stdio: this.verbose ? 'inherit' : 'pipe',
        shell: true 
      });

      let output = '';
      let error = '';

      if (!this.verbose) {
        process.stdout?.on('data', (data) => {
          output += data.toString();
        });

        process.stderr?.on('data', (data) => {
          error += data.toString();
        });
      }

      process.on('close', (code) => {
        if (code === 0) {
          resolve({ output, error });
        } else {
          reject(new Error(`Installation failed with code ${code}: ${error}`));
        }
      });

      process.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Show installation progress with spinner
   */
  async showInstallProgress(name, installPromise) {
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let frameIndex = 0;
    
    const progressInterval = setInterval(() => {
      process.stdout.write(`\r  ${frames[frameIndex]} Installing ${name}...`);
      frameIndex = (frameIndex + 1) % frames.length;
    }, 100);

    try {
      await installPromise;
      clearInterval(progressInterval);
      process.stdout.write(`\r  ✅ Installing ${name}... Done!\n`);
    } catch (error) {
      clearInterval(progressInterval);
      process.stdout.write(`\r  ❌ Installing ${name}... Failed!\n`);
      throw error;
    }
  }

  /**
   * Try fallback installation methods
   */
  async tryFallbackInstallation(key, dep) {
    if (dep.fallbackCommand) {
      console.log(`  🔄 Trying fallback method for ${dep.name}...`);
      try {
        await this.executeInstallCommand(dep.fallbackCommand);
        console.log(`  ✅ ${dep.name} available via fallback method`);
      } catch (error) {
        console.log(`  ❌ Fallback method also failed`);
      }
    }

    if (dep.fallbackUrl) {
      console.log(`  📥 Manual installation required for ${dep.name}`);
      console.log(`     Download from: ${dep.fallbackUrl}`);
    }
  }

  /**
   * Final verification after installations
   */
  async finalVerification() {
    console.log('\n' + chalk.blue.bold('🔍 Final Verification...'));
    
    // Re-check all required dependencies
    const requiredDeps = Object.entries(this.dependencies)
      .filter(([, dep]) => dep.required);
    
    let allGood = true;
    
    for (const [key, dep] of requiredDeps) {
      try {
        const result = await this.executeCheck(dep);
        if (result.installed && result.compatible) {
          console.log(`  ✅ ${dep.name} v${result.version}`);
        } else {
          console.log(`  ❌ ${dep.name} still not working properly`);
          allGood = false;
        }
      } catch (error) {
        console.log(`  ❌ ${dep.name} verification failed`);
        allGood = false;
      }
    }
    
    console.log('\n' + '═'.repeat(50));
    
    if (allGood) {
      console.log(chalk.green.bold('🎉 All required dependencies are ready!'));
      console.log(chalk.green('✅ Claude Flow 2.0 is ready to use.'));
      console.log('\n' + chalk.cyan('Next steps:'));
      console.log('  • Run: npx claude-flow@2.0.0 init --claude --webui');
      console.log('  • Visit the Claude Flow documentation for more information');
    } else {
      console.log(chalk.red.bold('⚠️  Some dependencies still need attention'));
      console.log('Please review the results above and install missing dependencies manually.');
      this.displayManualInstallInstructions();
    }
  }

  /**
   * Display manual installation instructions
   */
  displayManualInstallInstructions() {
    console.log('\n' + chalk.yellow.bold('📋 Manual Installation Instructions:'));
    console.log('═'.repeat(50));
    
    const failed = this.installQueue.filter(({ key }) => 
      !this.results[key]?.installed || !this.results[key]?.compatible
    );
    
    for (const { key, dep } of failed) {
      console.log(`\n${chalk.cyan.bold(dep.name)}:`);
      console.log(`  Description: ${dep.description}`);
      
      if (dep.installMethods[this.platform]) {
        console.log(`  ${this.platform}: ${dep.installMethods[this.platform]}`);
      }
      
      if (dep.fallbackUrl) {
        console.log(`  Download: ${dep.fallbackUrl}`);
      }
      
      if (dep.note) {
        console.log(`  Note: ${dep.note}`);
      }
    }
  }

  // Utility methods

  async checkPackageManagers() {
    const available = [];
    
    for (const manager of this.packageManagers) {
      try {
        await execAsync(`${manager} --version`);
        available.push(manager);
      } catch (error) {
        // Manager not available
      }
    }
    
    return available;
  }

  async checkInternetConnectivity() {
    if (this.offline) return false;
    
    try {
      await execAsync('ping -c 1 google.com', { timeout: 5000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  extractVersion(output) {
    const versionRegex = /v?(\d+\.\d+\.\d+)/;
    const match = output.match(versionRegex);
    return match ? match[1] : '0.0.0';
  }

  compareVersions(version1, version2) {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;
      
      if (v1Part > v2Part) return 1;
      if (v1Part < v2Part) return -1;
    }
    
    return 0;
  }

  groupByCategory() {
    const grouped = {};
    
    for (const [key, result] of Object.entries(this.results)) {
      const dep = this.dependencies[key];
      const category = dep.category || 'other';
      
      if (!grouped[category]) {
        grouped[category] = [];
      }
      
      grouped[category].push([key, result]);
    }
    
    return grouped;
  }

  getStatusSymbol(result, required) {
    if (result.installed && result.compatible) {
      return '✅';
    } else if (result.installed && !result.compatible) {
      return '⚠️ ';
    } else if (required) {
      return '❌';
    } else {
      return '⚪';
    }
  }

  hasMissingRequired() {
    return this.installQueue.some(({ dep }) => dep.required);
  }
}

module.exports = DependencyChecker;

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    offline: args.includes('--offline'),
    nonInteractive: args.includes('--non-interactive') || args.includes('-y')
  };

  const checker = new DependencyChecker(options);
  
  checker.checkAllDependencies()
    .then((results) => {
      const allGood = Object.entries(results).every(([key, result]) => {
        const dep = checker.dependencies[key];
        return !dep.required || (result.installed && result.compatible);
      });
      
      process.exit(allGood ? 0 : 1);
    })
    .catch((error) => {
      console.error(chalk.red('❌ Dependency check failed:'), error.message);
      process.exit(1);
    });
}