#!/usr/bin/env node

/**
 * Claude Flow 2.0 Dependency Management CLI
 * 
 * Main command-line interface for the dependency management system.
 * This script can be used standalone or integrated with Claude Flow 2.0 init.
 * 
 * Usage:
 *   npx claude-flow-deps check              # Check dependencies only
 *   npx claude-flow-deps install            # Install missing dependencies
 *   npx claude-flow-deps verify             # Verify installed dependencies
 *   npx claude-flow-deps test               # Run test suite
 *   npx claude-flow-deps --help             # Show help
 */

const path = require('path');
const chalk = require('chalk');
const ClaudeFlowDependencyManager = require('./claude-flow-dependency-manager');
const DependencyManagerTest = require('./test/dependency-manager-test');

class ClaudeFlowDepsCLI {
  constructor() {
    this.version = '2.0.0';
    this.commands = {
      check: this.runCheck.bind(this),
      install: this.runInstall.bind(this),
      verify: this.runVerify.bind(this),
      test: this.runTest.bind(this),
      help: this.showHelp.bind(this),
      version: this.showVersion.bind(this)
    };
  }

  /**
   * Main CLI entry point
   */
  async run(args = process.argv.slice(2)) {
    try {
      const { command, options } = this.parseArguments(args);
      
      // Handle help and version first
      if (options.help || command === 'help') {
        return this.showHelp();
      }
      
      if (options.version || command === 'version') {
        return this.showVersion();
      }

      // Execute command
      const commandHandler = this.commands[command];
      if (commandHandler) {
        await commandHandler(options);
      } else {
        console.error(chalk.red(`❌ Unknown command: ${command}`));
        console.log('Run with --help for available commands');
        process.exit(1);
      }
      
    } catch (error) {
      console.error(chalk.red('💥 CLI Error:'), error.message);
      if (options?.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }

  /**
   * Parse command-line arguments
   */
  parseArguments(args) {
    const options = {
      verbose: false,
      quiet: false,
      nonInteractive: false,
      offline: false,
      skipOptional: false,
      dryRun: false,
      help: false,
      version: false
    };
    
    let command = 'install'; // default command
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      if (arg.startsWith('--')) {
        const flag = arg.slice(2);
        switch (flag) {
          case 'verbose':
          case 'v':
            options.verbose = true;
            break;
          case 'quiet':
          case 'q':
            options.quiet = true;
            break;
          case 'non-interactive':
          case 'y':
            options.nonInteractive = true;
            break;
          case 'offline':
            options.offline = true;
            break;
          case 'skip-optional':
            options.skipOptional = true;
            break;
          case 'dry-run':
            options.dryRun = true;
            break;
          case 'help':
          case 'h':
            options.help = true;
            break;
          case 'version':
            options.version = true;
            break;
          default:
            console.warn(chalk.yellow(`⚠️  Unknown option: --${flag}`));
        }
      } else if (arg.startsWith('-')) {
        const flags = arg.slice(1);
        for (const flag of flags) {
          switch (flag) {
            case 'v':
              options.verbose = true;
              break;
            case 'q':
              options.quiet = true;
              break;
            case 'y':
              options.nonInteractive = true;
              break;
            case 'h':
              options.help = true;
              break;
            default:
              console.warn(chalk.yellow(`⚠️  Unknown flag: -${flag}`));
          }
        }
      } else {
        // First non-flag argument is the command
        if (!['check', 'install', 'verify', 'test', 'help', 'version'].includes(command)) {
          command = arg;
        }
      }
    }
    
    return { command, options };
  }

  /**
   * Run dependency check only
   */
  async runCheck(options) {
    console.log(chalk.cyan.bold('🔍 Claude Flow 2.0 Dependency Check'));
    console.log('═'.repeat(50));
    
    const manager = new ClaudeFlowDependencyManager({
      ...options,
      checkOnly: true
    });
    
    const result = await manager.runDependencyCheckOnly();
    
    if (result.success) {
      console.log(chalk.green('\n✅ Dependency check completed successfully'));
    } else {
      console.error(chalk.red('\n❌ Dependency check failed'));
      process.exit(1);
    }
  }

  /**
   * Run dependency installation
   */
  async runInstall(options) {
    console.log(chalk.cyan.bold('📦 Claude Flow 2.0 Dependency Installation'));
    console.log('═'.repeat(50));
    
    const manager = new ClaudeFlowDependencyManager(options);
    const result = await manager.ensureDependencies('install');
    
    if (result.success) {
      console.log(chalk.green('\n🎉 Installation completed successfully!'));
      console.log(chalk.cyan('\nNext steps:'));
      console.log('  • Run: npx claude-flow@2.0.0 init --claude --webui');
      console.log('  • Visit: https://docs.claude-flow.dev for documentation');
    } else {
      console.error(chalk.red('\n❌ Installation failed'));
      if (result.error) {
        console.error(chalk.red(`Error: ${result.error}`));
      }
      process.exit(1);
    }
  }

  /**
   * Run post-installation verification
   */
  async runVerify(options) {
    console.log(chalk.cyan.bold('🔬 Claude Flow 2.0 Dependency Verification'));
    console.log('═'.repeat(50));
    
    const PostInstallVerifier = require('./verification/post-install-verifier');
    const verifier = new PostInstallVerifier(options);
    
    // Get list of dependencies to verify
    const manager = new ClaudeFlowDependencyManager(options);
    const dependencies = Object.entries(manager.checker.dependencies).map(([key, dep]) => ({
      key,
      name: dep.name,
      required: dep.required
    }));
    
    const result = await verifier.verifyAllDependencies(dependencies);
    
    if (result.failed === 0) {
      console.log(chalk.green('\n✅ All dependencies verified successfully!'));
    } else {
      console.log(chalk.red(`\n⚠️  ${result.failed} dependencies have issues`));
      process.exit(1);
    }
  }

  /**
   * Run test suite
   */
  async runTest(options) {
    console.log(chalk.cyan.bold('🧪 Claude Flow 2.0 Dependency Manager Test Suite'));
    console.log('═'.repeat(50));
    
    const tester = new DependencyManagerTest();
    const result = await tester.runAllTests();
    
    if (result.failed === 0) {
      console.log(chalk.green('\n🎉 All tests passed!'));
    } else {
      console.log(chalk.red(`\n❌ ${result.failed} tests failed`));
      process.exit(1);
    }
  }

  /**
   * Show help information
   */
  showHelp() {
    console.log(chalk.cyan.bold('\n📚 Claude Flow 2.0 Dependency Manager'));
    console.log('═'.repeat(50));
    
    console.log(chalk.yellow('\nUsage:'));
    console.log('  claude-flow-deps <command> [options]');
    
    console.log(chalk.yellow('\nCommands:'));
    console.log('  check      Check dependency status (no installation)');
    console.log('  install    Install missing dependencies (default)');
    console.log('  verify     Verify installed dependencies');
    console.log('  test       Run test suite');
    console.log('  help       Show this help message');
    console.log('  version    Show version information');
    
    console.log(chalk.yellow('\nOptions:'));
    console.log('  -v, --verbose           Enable verbose output');
    console.log('  -q, --quiet             Suppress non-essential output');
    console.log('  -y, --non-interactive   Run without user prompts');
    console.log('      --offline           Skip network-dependent features');
    console.log('      --skip-optional     Skip optional dependencies');
    console.log('      --dry-run           Show what would be done without executing');
    console.log('  -h, --help              Show this help message');
    console.log('      --version           Show version information');
    
    console.log(chalk.yellow('\nExamples:'));
    console.log('  claude-flow-deps                    # Install all dependencies (interactive)');
    console.log('  claude-flow-deps check              # Check status only');
    console.log('  claude-flow-deps install -y         # Install non-interactively');
    console.log('  claude-flow-deps verify --verbose   # Detailed verification');
    console.log('  claude-flow-deps install --dry-run  # Show what would be installed');
    
    console.log(chalk.yellow('\nIntegration with Claude Flow 2.0:'));
    console.log('  npx claude-flow@2.0.0 init --claude --webui');
    console.log('  # Automatically runs dependency check before initialization');
    
    console.log(chalk.gray('\nFor more information:'));
    console.log('  Documentation: https://docs.claude-flow.dev/dependencies');
    console.log('  GitHub Issues: https://github.com/claude-flow/claude-flow-2.0/issues');
    console.log('  Discord: https://discord.gg/claude-flow');
    
    console.log('');
  }

  /**
   * Show version information
   */
  showVersion() {
    console.log(chalk.cyan.bold('\n📋 Version Information'));
    console.log('═'.repeat(30));
    
    console.log(`Claude Flow Dependency Manager: ${this.version}`);
    console.log(`Node.js: ${process.version}`);
    console.log(`Platform: ${process.platform} ${process.arch}`);
    
    // Check if Claude Flow is available
    const { exec } = require('child_process');
    exec('npx claude-flow@2.0.0 --version', (error, stdout) => {
      if (!error && stdout) {
        console.log(`Claude Flow: ${stdout.trim()}`);
      }
    });
    
    console.log('');
  }
}

/**
 * Integration function for use within Claude Flow 2.0 init
 */
async function integrateWithClaudeFlow(claudeFlowCommand, options = {}) {
  console.log(chalk.cyan('🔍 Checking Claude Flow 2.0 dependencies...'));
  
  const manager = new ClaudeFlowDependencyManager({
    nonInteractive: options.nonInteractive || false,
    verbose: options.verbose || false,
    quiet: options.quiet || false
  });
  
  try {
    const result = await manager.ensureDependencies(claudeFlowCommand);
    
    if (result.success) {
      if (!result.skipped) {
        console.log(chalk.green('✅ Dependencies verified successfully'));
      }
      return true;
    } else {
      console.error(chalk.red('❌ Dependency check failed'));
      console.error(chalk.red('Please run: npx claude-flow-deps install'));
      return false;
    }
  } catch (error) {
    console.error(chalk.red('💥 Dependency check error:'), error.message);
    return false;
  }
}

/**
 * Quick check function for CI/CD environments
 */
async function quickDependencyCheck() {
  const manager = new ClaudeFlowDependencyManager({
    nonInteractive: true,
    quiet: true
  });
  
  try {
    const result = await manager.ensureDependencies('check');
    return result.success;
  } catch (error) {
    return false;
  }
}

// Export for use as module
module.exports = {
  ClaudeFlowDepsCLI,
  integrateWithClaudeFlow,
  quickDependencyCheck
};

// Run CLI if called directly
if (require.main === module) {
  const cli = new ClaudeFlowDepsCLI();
  cli.run().catch((error) => {
    console.error(chalk.red('💥 Unexpected error:'), error.message);
    process.exit(1);
  });
}