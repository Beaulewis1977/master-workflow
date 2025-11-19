#!/usr/bin/env node

/**
 * Interactive Installer UI for Claude Flow 2.0
 * 
 * Provides beautiful, user-friendly interfaces for dependency installation
 * with progress indicators, animations, and comprehensive feedback.
 */

const chalk = require('chalk');
const inquirer = require('inquirer');
const { EventEmitter } = require('events');

class InteractiveInstallerUI extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = options;
    this.currentStep = 0;
    this.totalSteps = 0;
    this.startTime = null;
  }

  /**
   * Display welcome banner
   */
  displayWelcomeBanner() {
    console.clear();
    console.log(chalk.cyan.bold('╔══════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan.bold('║                                                          ║'));
    console.log(chalk.cyan.bold('║            🤖 Claude Flow 2.0 Setup Wizard             ║'));
    console.log(chalk.cyan.bold('║                                                          ║'));
    console.log(chalk.cyan.bold('║     Intelligent Workflow Decision System Installer      ║'));
    console.log(chalk.cyan.bold('║                                                          ║'));
    console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════╝'));
    console.log('');
    console.log(chalk.gray('This wizard will check and install all required dependencies'));
    console.log(chalk.gray('for Claude Flow 2.0 to function properly on your system.'));
    console.log('');
  }

  /**
   * Display system requirements
   */
  displaySystemRequirements() {
    console.log(chalk.yellow.bold('📋 System Requirements:'));
    console.log('');
    
    const requirements = [
      { name: 'Operating System', requirement: 'Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)', icon: '💻' },
      { name: 'Memory (RAM)', requirement: '8GB minimum, 16GB recommended', icon: '🧠' },
      { name: 'Storage', requirement: '2GB free space for installations', icon: '💾' },
      { name: 'Internet', requirement: 'Required for downloading dependencies', icon: '🌐' },
      { name: 'Permissions', requirement: 'Administrator/sudo access for system installations', icon: '🔐' }
    ];

    requirements.forEach(req => {
      console.log(`  ${req.icon} ${chalk.cyan(req.name)}: ${req.requirement}`);
    });
    
    console.log('');
  }

  /**
   * Ask user for installation preferences
   */
  async gatherInstallationPreferences() {
    console.log(chalk.yellow.bold('🎛️  Installation Preferences:'));
    console.log('');

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'installMode',
        message: 'Choose installation mode:',
        choices: [
          { name: '🚀 Express (recommended) - Install all required dependencies', value: 'express' },
          { name: '🎯 Custom - Choose which dependencies to install', value: 'custom' },
          { name: '🔍 Check Only - Just check current status without installing', value: 'check-only' }
        ],
        default: 'express'
      },
      {
        type: 'confirm',
        name: 'includeOptional',
        message: 'Install optional dependencies (TMux, additional tools)?',
        default: true,
        when: (answers) => answers.installMode !== 'check-only'
      },
      {
        type: 'list',
        name: 'verbosity',
        message: 'Output verbosity level:',
        choices: [
          { name: '🔇 Quiet - Show only results', value: 'quiet' },
          { name: '📝 Normal - Show progress and status', value: 'normal' },
          { name: '🔍 Verbose - Show detailed output', value: 'verbose' }
        ],
        default: 'normal'
      },
      {
        type: 'confirm',
        name: 'createBackup',
        message: 'Create system state backup before installation?',
        default: false,
        when: (answers) => answers.installMode !== 'check-only'
      }
    ]);

    return answers;
  }

  /**
   * Custom dependency selection
   */
  async selectDependencies(availableDependencies) {
    console.log(chalk.yellow.bold('📦 Select Dependencies to Install:'));
    console.log('');

    const choices = Object.entries(availableDependencies).map(([key, dep]) => ({
      name: `${dep.required ? '🔴' : '🟡'} ${dep.name} - ${dep.description}`,
      value: key,
      checked: dep.required
    }));

    const { selectedDependencies } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedDependencies',
        message: 'Choose dependencies to install:',
        choices: choices,
        validate: (answer) => {
          const requiredDeps = Object.entries(availableDependencies)
            .filter(([, dep]) => dep.required)
            .map(([key]) => key);
          
          const missingRequired = requiredDeps.filter(dep => !answer.includes(dep));
          
          if (missingRequired.length > 0) {
            return `You must select all required dependencies. Missing: ${missingRequired.join(', ')}`;
          }
          
          return answer.length > 0 || 'You must select at least one dependency.';
        }
      }
    ]);

    return selectedDependencies;
  }

  /**
   * Display installation plan
   */
  displayInstallationPlan(plan) {
    console.log(chalk.yellow.bold('\n📋 Installation Plan:'));
    console.log('═'.repeat(60));
    
    console.log(chalk.cyan(`\n📊 Summary:`));
    console.log(`  • Dependencies to install: ${plan.dependencies.length}`);
    console.log(`  • Estimated time: ${this.formatTime(plan.estimatedTime)}`);
    console.log(`  • Required disk space: ${plan.diskSpace || 'Unknown'}`);
    console.log(`  • Internet required: ${plan.requiresInternet ? 'Yes' : 'No'}`);

    console.log(chalk.cyan(`\n📦 Dependencies:`));
    plan.dependencies.forEach((dep, index) => {
      const status = dep.required ? chalk.red('REQUIRED') : chalk.yellow('OPTIONAL');
      const time = this.formatTime(dep.estimatedTime || 60);
      
      console.log(`  ${index + 1}. ${dep.name} (${status}) - ${time}`);
      if (dep.description) {
        console.log(`     ${chalk.gray(dep.description)}`);
      }
    });

    if (plan.warnings && plan.warnings.length > 0) {
      console.log(chalk.yellow(`\n⚠️  Warnings:`));
      plan.warnings.forEach(warning => {
        console.log(`  • ${warning}`);
      });
    }

    console.log('');
  }

  /**
   * Confirm installation
   */
  async confirmInstallation(plan) {
    console.log(chalk.yellow.bold('🔐 Final Confirmation:'));
    console.log('');
    console.log(chalk.gray('This installation will:'));
    
    const actions = [
      `Install ${plan.dependencies.length} dependencies`,
      `Require approximately ${this.formatTime(plan.estimatedTime)}`,
      'May require administrator/sudo permissions',
      'Download packages from the internet'
    ];

    actions.forEach(action => {
      console.log(`  • ${action}`);
    });

    console.log('');

    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: 'Proceed with installation?',
        default: true
      }
    ]);

    return confirmed;
  }

  /**
   * Show installation progress
   */
  startInstallationProgress(totalSteps) {
    this.totalSteps = totalSteps;
    this.currentStep = 0;
    this.startTime = Date.now();

    console.log(chalk.green.bold('\n🚀 Starting Installation...'));
    console.log('═'.repeat(60));
  }

  /**
   * Update progress for current step
   */
  updateStepProgress(stepName, status = 'in-progress', details = '') {
    const progress = this.currentStep / this.totalSteps;
    const progressBar = this.createProgressBar(progress, 40);
    const percentage = Math.round(progress * 100);
    
    // Clear current line and show progress
    process.stdout.write('\r\x1b[K');
    process.stdout.write(`${progressBar} ${percentage}% `);
    
    switch (status) {
      case 'in-progress':
        process.stdout.write(chalk.cyan(`Installing ${stepName}...`));
        break;
      case 'completed':
        this.currentStep++;
        const icon = '✅';
        console.log(chalk.green(`${icon} ${stepName} installed successfully`));
        if (details) {
          console.log(chalk.gray(`   ${details}`));
        }
        break;
      case 'failed':
        const errorIcon = '❌';
        console.log(chalk.red(`${errorIcon} ${stepName} installation failed`));
        if (details) {
          console.log(chalk.red(`   ${details}`));
        }
        break;
      case 'skipped':
        this.currentStep++;
        const skipIcon = '⏭️ ';
        console.log(chalk.yellow(`${skipIcon} ${stepName} skipped`));
        if (details) {
          console.log(chalk.gray(`   ${details}`));
        }
        break;
    }
  }

  /**
   * Show spinner for long-running operations
   */
  showSpinner(message) {
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let frameIndex = 0;
    
    const interval = setInterval(() => {
      process.stdout.write(`\r${frames[frameIndex]} ${message}`);
      frameIndex = (frameIndex + 1) % frames.length;
    }, 100);

    return {
      stop: (finalMessage = '') => {
        clearInterval(interval);
        if (finalMessage) {
          process.stdout.write(`\r✅ ${finalMessage}\n`);
        } else {
          process.stdout.write('\r\x1b[K');
        }
      },
      update: (newMessage) => {
        message = newMessage;
      }
    };
  }

  /**
   * Display installation results
   */
  displayInstallationResults(results) {
    const elapsedTime = Date.now() - this.startTime;
    
    console.log('\n' + '═'.repeat(60));
    console.log(chalk.green.bold('🎉 Installation Complete!'));
    console.log('═'.repeat(60));
    
    console.log(chalk.cyan(`\n⏱️  Installation Summary:`));
    console.log(`  • Total time: ${this.formatTime(elapsedTime)}`);
    console.log(`  • Dependencies processed: ${results.total}`);
    console.log(`  • Successful installations: ${chalk.green(results.successful)}`);
    console.log(`  • Failed installations: ${chalk.red(results.failed)}`);
    console.log(`  • Skipped: ${chalk.yellow(results.skipped)}`);

    if (results.successful > 0) {
      console.log(chalk.green(`\n✅ Successfully Installed:`));
      results.successfulDependencies.forEach(dep => {
        console.log(`  • ${dep.name} v${dep.version}`);
      });
    }

    if (results.failed > 0) {
      console.log(chalk.red(`\n❌ Failed Installations:`));
      results.failedDependencies.forEach(dep => {
        console.log(`  • ${dep.name}: ${dep.error}`);
      });
    }

    if (results.skipped > 0) {
      console.log(chalk.yellow(`\n⏭️  Skipped:`));
      results.skippedDependencies.forEach(dep => {
        console.log(`  • ${dep.name}: ${dep.reason}`);
      });
    }

    // Next steps
    console.log(chalk.cyan(`\n🚀 Next Steps:`));
    
    if (results.failed === 0) {
      console.log('  • Run: npx claude-flow@2.0.0 init --claude --webui');
      console.log('  • Visit: https://docs.claude-flow.dev for documentation');
      console.log('  • Join: https://discord.gg/claude-flow for community support');
    } else {
      console.log('  • Review failed installations above');
      console.log('  • Check the troubleshooting guide: https://docs.claude-flow.dev/troubleshooting');
      console.log('  • Run dependency checker again: claude-flow check-deps');
    }

    console.log('');
  }

  /**
   * Display error with help information
   */
  displayError(error, context = '') {
    console.log('\n' + chalk.red.bold('❌ Installation Error'));
    console.log('═'.repeat(50));
    
    console.log(chalk.red(`\nError: ${error.message}`));
    
    if (context) {
      console.log(chalk.gray(`Context: ${context}`));
    }

    console.log(chalk.yellow(`\n🛠️  Troubleshooting Tips:`));
    
    const tips = [
      'Check your internet connection',
      'Verify you have administrator/sudo permissions',
      'Ensure you have sufficient disk space',
      'Try running the installer as administrator',
      'Check firewall and antivirus settings',
      'Visit our troubleshooting guide for platform-specific help'
    ];

    tips.forEach(tip => {
      console.log(`  • ${tip}`);
    });

    console.log(chalk.cyan(`\n📞 Get Help:`));
    console.log('  • Documentation: https://docs.claude-flow.dev');
    console.log('  • GitHub Issues: https://github.com/claude-flow/issues');
    console.log('  • Discord Community: https://discord.gg/claude-flow');
    console.log('');
  }

  /**
   * Create ASCII progress bar
   */
  createProgressBar(progress, width = 40) {
    const filled = Math.round(progress * width);
    const empty = width - filled;
    
    const filledChar = '█';
    const emptyChar = '░';
    
    return chalk.green(filledChar.repeat(filled)) + chalk.gray(emptyChar.repeat(empty));
  }

  /**
   * Format time duration
   */
  formatTime(milliseconds) {
    const seconds = Math.round(milliseconds / 1000);
    
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const remainingMinutes = Math.floor((seconds % 3600) / 60);
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
  }

  /**
   * Show loading animation with dots
   */
  showLoadingDots(message, duration = 3000) {
    return new Promise((resolve) => {
      let dots = '';
      const maxDots = 3;
      
      const interval = setInterval(() => {
        dots = dots.length >= maxDots ? '' : dots + '.';
        process.stdout.write(`\r${message}${dots}   `);
      }, 500);

      setTimeout(() => {
        clearInterval(interval);
        process.stdout.write('\r\x1b[K');
        resolve();
      }, duration);
    });
  }

  /**
   * Display platform-specific notes
   */
  displayPlatformNotes() {
    const platform = process.platform;
    
    console.log(chalk.yellow.bold(`\n💡 ${this.getPlatformName()} Specific Notes:`));
    
    switch (platform) {
      case 'win32':
        console.log('  • Some installations may require PowerShell as Administrator');
        console.log('  • Windows Defender may flag downloads - this is normal');
        console.log('  • TMux has limited support; Windows Terminal is recommended');
        break;
      case 'darwin':
        console.log('  • Xcode Command Line Tools may be required for some packages');
        console.log('  • Homebrew installation is highly recommended');
        console.log('  • System may prompt for permission to install developer tools');
        break;
      case 'linux':
        console.log('  • Sudo permissions will be required for system packages');
        console.log('  • Package manager will vary by distribution');
        console.log('  • Some packages may require additional repositories');
        break;
    }
    
    console.log('');
  }

  getPlatformName() {
    switch (process.platform) {
      case 'win32': return 'Windows';
      case 'darwin': return 'macOS';
      case 'linux': return 'Linux';
      default: return 'Unknown';
    }
  }

  /**
   * Ask for retry on failure
   */
  async askForRetry(failedDependency, error) {
    console.log(chalk.red(`\n❌ Failed to install ${failedDependency}`));
    console.log(chalk.gray(`Error: ${error.message}`));
    
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: '🔄 Retry installation', value: 'retry' },
          { name: '⏭️ Skip this dependency', value: 'skip' },
          { name: '🛠️ Try manual installation', value: 'manual' },
          { name: '❌ Abort installation', value: 'abort' }
        ]
      }
    ]);

    return action;
  }
}

module.exports = InteractiveInstallerUI;