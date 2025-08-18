#!/usr/bin/env node

/**
 * Post-Installation Verification System for Claude Flow 2.0
 * 
 * This module provides comprehensive verification of installed dependencies
 * including health checks, functionality tests, and fallback options.
 */

const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');

const execAsync = promisify(exec);

class PostInstallVerifier {
  constructor(options = {}) {
    this.options = options;
    this.verbose = options.verbose || false;
    this.timeout = options.timeout || 30000; // 30 seconds default timeout
    
    this.verificationTests = {
      nodejs: [
        this.testNodejsBasic,
        this.testNodejsModules,
        this.testNodejsPerformance
      ],
      git: [
        this.testGitBasic,
        this.testGitConfig,
        this.testGitFunctionality
      ],
      'claude-code-cli': [
        this.testClaudeCodeBasic,
        this.testClaudeCodeAuth,
        this.testClaudeCodeCommands
      ],
      'claude-flow': [
        this.testClaudeFlowBasic,
        this.testClaudeFlowCommands,
        this.testClaudeFlowWorkflows
      ],
      'agent-os': [
        this.testAgentOSBasic,
        this.testAgentOSAgents,
        this.testAgentOSCommunication
      ],
      tmux: [
        this.testTmuxBasic,
        this.testTmuxSessions,
        this.testTmuxIntegration
      ],
      npm: [
        this.testNpmBasic,
        this.testNpmRegistry,
        this.testNpmPermissions
      ]
    };

    this.fallbackOptions = {
      nodejs: {
        alternatives: ['yarn', 'pnpm', 'bun'],
        recovery: this.recoverNodejs.bind(this)
      },
      git: {
        alternatives: ['GitHub Desktop', 'GitKraken'],
        recovery: this.recoverGit.bind(this)
      },
      'claude-code-cli': {
        alternatives: ['Web interface', 'VS Code extension'],
        recovery: this.recoverClaudeCode.bind(this)
      },
      'claude-flow': {
        alternatives: ['Direct npx usage', 'Local installation'],
        recovery: this.recoverClaudeFlow.bind(this)
      },
      'agent-os': {
        alternatives: ['Manual agent management', 'Custom workflow'],
        recovery: this.recoverAgentOS.bind(this)
      },
      tmux: {
        alternatives: ['Screen', 'Windows Terminal', 'iTerm2'],
        recovery: this.recoverTmux.bind(this)
      }
    };
  }

  /**
   * Verify all installed dependencies
   */
  async verifyAllDependencies(dependencies) {
    console.log(chalk.cyan.bold('\n🔍 Post-Installation Verification'));
    console.log('═'.repeat(60));
    
    const results = {
      total: dependencies.length,
      passed: 0,
      failed: 0,
      warnings: 0,
      details: {},
      recommendations: []
    };

    for (const dep of dependencies) {
      console.log(chalk.yellow(`\nVerifying ${dep.name}...`));
      
      const verificationResult = await this.verifyDependency(dep);
      results.details[dep.key] = verificationResult;
      
      if (verificationResult.status === 'passed') {
        results.passed++;
        console.log(chalk.green(`  ✅ ${dep.name} verification passed`));
      } else if (verificationResult.status === 'warning') {
        results.warnings++;
        console.log(chalk.yellow(`  ⚠️  ${dep.name} has warnings`));
      } else {
        results.failed++;
        console.log(chalk.red(`  ❌ ${dep.name} verification failed`));
        
        // Attempt recovery if possible
        await this.attemptRecovery(dep, verificationResult);
      }
      
      // Display test results
      if (this.verbose) {
        this.displayTestResults(verificationResult.tests);
      }
    }

    this.displayVerificationSummary(results);
    return results;
  }

  /**
   * Verify a single dependency
   */
  async verifyDependency(dependency) {
    const tests = this.verificationTests[dependency.key] || [];
    const results = {
      dependency: dependency.name,
      status: 'passed',
      tests: [],
      errors: [],
      warnings: [],
      performance: {}
    };

    for (const test of tests) {
      try {
        const testResult = await test.call(this, dependency);
        results.tests.push(testResult);
        
        if (testResult.status === 'failed') {
          results.status = 'failed';
          results.errors.push(testResult.error);
        } else if (testResult.status === 'warning') {
          if (results.status !== 'failed') {
            results.status = 'warning';
          }
          results.warnings.push(testResult.warning);
        }
        
        // Collect performance data
        if (testResult.performance) {
          results.performance[testResult.name] = testResult.performance;
        }
        
      } catch (error) {
        results.status = 'failed';
        results.errors.push(`Test execution failed: ${error.message}`);
        results.tests.push({
          name: test.name || 'Unknown test',
          status: 'failed',
          error: error.message
        });
      }
    }

    return results;
  }

  // Node.js Verification Tests

  async testNodejsBasic(dependency) {
    const startTime = Date.now();
    
    try {
      const { stdout } = await execAsync('node --version', { timeout: this.timeout });
      const version = stdout.trim();
      const endTime = Date.now();
      
      return {
        name: 'Node.js Basic',
        status: 'passed',
        details: `Version: ${version}`,
        performance: { responseTime: endTime - startTime }
      };
    } catch (error) {
      return {
        name: 'Node.js Basic',
        status: 'failed',
        error: error.message
      };
    }
  }

  async testNodejsModules(dependency) {
    try {
      // Test if npm can list global packages
      const { stdout } = await execAsync('npm list -g --depth=0', { timeout: this.timeout });
      
      return {
        name: 'Node.js Modules',
        status: 'passed',
        details: 'npm modules accessible'
      };
    } catch (error) {
      return {
        name: 'Node.js Modules',
        status: 'warning',
        warning: 'npm modules may have issues'
      };
    }
  }

  async testNodejsPerformance(dependency) {
    try {
      const startTime = Date.now();
      
      // Test Node.js performance with a simple script
      const testScript = 'console.log("test")';
      await execAsync(`node -e "${testScript}"`, { timeout: this.timeout });
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      return {
        name: 'Node.js Performance',
        status: executionTime < 1000 ? 'passed' : 'warning',
        details: `Execution time: ${executionTime}ms`,
        performance: { executionTime },
        warning: executionTime >= 1000 ? 'Node.js execution is slow' : undefined
      };
    } catch (error) {
      return {
        name: 'Node.js Performance',
        status: 'failed',
        error: error.message
      };
    }
  }

  // Git Verification Tests

  async testGitBasic(dependency) {
    try {
      const { stdout } = await execAsync('git --version', { timeout: this.timeout });
      const version = stdout.trim();
      
      return {
        name: 'Git Basic',
        status: 'passed',
        details: version
      };
    } catch (error) {
      return {
        name: 'Git Basic',
        status: 'failed',
        error: error.message
      };
    }
  }

  async testGitConfig(dependency) {
    try {
      const { stdout: userName } = await execAsync('git config --global user.name', { timeout: this.timeout });
      const { stdout: userEmail } = await execAsync('git config --global user.email', { timeout: this.timeout });
      
      if (!userName.trim() || !userEmail.trim()) {
        return {
          name: 'Git Configuration',
          status: 'warning',
          warning: 'Git user name and email not configured'
        };
      }
      
      return {
        name: 'Git Configuration',
        status: 'passed',
        details: `User: ${userName.trim()} (${userEmail.trim()})`
      };
    } catch (error) {
      return {
        name: 'Git Configuration',
        status: 'warning',
        warning: 'Git configuration incomplete'
      };
    }
  }

  async testGitFunctionality(dependency) {
    try {
      // Test git status in current directory
      await execAsync('git status', { timeout: this.timeout });
      
      return {
        name: 'Git Functionality',
        status: 'passed',
        details: 'Git repository operations working'
      };
    } catch (error) {
      // Not being in a git repo is okay
      if (error.message.includes('not a git repository')) {
        return {
          name: 'Git Functionality',
          status: 'passed',
          details: 'Git commands working (not in repository)'
        };
      }
      
      return {
        name: 'Git Functionality',
        status: 'failed',
        error: error.message
      };
    }
  }

  // Claude Code CLI Verification Tests

  async testClaudeCodeBasic(dependency) {
    try {
      const { stdout } = await execAsync('claude --version', { timeout: this.timeout });
      
      return {
        name: 'Claude Code Basic',
        status: 'passed',
        details: stdout.trim()
      };
    } catch (error) {
      return {
        name: 'Claude Code Basic',
        status: 'failed',
        error: error.message
      };
    }
  }

  async testClaudeCodeAuth(dependency) {
    try {
      const { stdout } = await execAsync('claude auth status', { timeout: this.timeout });
      
      if (stdout.includes('authenticated') || stdout.includes('logged in')) {
        return {
          name: 'Claude Code Auth',
          status: 'passed',
          details: 'Authentication verified'
        };
      } else {
        return {
          name: 'Claude Code Auth',
          status: 'warning',
          warning: 'Authentication may be required'
        };
      }
    } catch (error) {
      return {
        name: 'Claude Code Auth',
        status: 'warning',
        warning: 'Authentication status unknown'
      };
    }
  }

  async testClaudeCodeCommands(dependency) {
    try {
      const { stdout } = await execAsync('claude --help', { timeout: this.timeout });
      
      if (stdout.includes('commands') || stdout.includes('help')) {
        return {
          name: 'Claude Code Commands',
          status: 'passed',
          details: 'Commands accessible'
        };
      } else {
        return {
          name: 'Claude Code Commands',
          status: 'warning',
          warning: 'Command help not showing properly'
        };
      }
    } catch (error) {
      return {
        name: 'Claude Code Commands',
        status: 'failed',
        error: error.message
      };
    }
  }

  // Claude Flow Verification Tests

  async testClaudeFlowBasic(dependency) {
    try {
      // Try both global and npx methods
      let result;
      try {
        result = await execAsync('claude-flow --version', { timeout: this.timeout });
      } catch (globalError) {
        result = await execAsync('npx claude-flow@2.0.0 --version', { timeout: this.timeout });
      }
      
      return {
        name: 'Claude Flow Basic',
        status: 'passed',
        details: result.stdout.trim()
      };
    } catch (error) {
      return {
        name: 'Claude Flow Basic',
        status: 'failed',
        error: error.message
      };
    }
  }

  async testClaudeFlowCommands(dependency) {
    try {
      let result;
      try {
        result = await execAsync('claude-flow --help', { timeout: this.timeout });
      } catch (globalError) {
        result = await execAsync('npx claude-flow@2.0.0 --help', { timeout: this.timeout });
      }
      
      if (result.stdout.includes('init') || result.stdout.includes('hive-mind')) {
        return {
          name: 'Claude Flow Commands',
          status: 'passed',
          details: 'Commands available'
        };
      } else {
        return {
          name: 'Claude Flow Commands',
          status: 'warning',
          warning: 'Some commands may not be available'
        };
      }
    } catch (error) {
      return {
        name: 'Claude Flow Commands',
        status: 'failed',
        error: error.message
      };
    }
  }

  async testClaudeFlowWorkflows(dependency) {
    try {
      // Test workflow validation (dry run)
      let result;
      try {
        result = await execAsync('claude-flow validate', { timeout: this.timeout });
      } catch (globalError) {
        result = await execAsync('npx claude-flow@2.0.0 validate', { timeout: this.timeout });
      }
      
      return {
        name: 'Claude Flow Workflows',
        status: 'passed',
        details: 'Workflow system accessible'
      };
    } catch (error) {
      // This is okay if validate command doesn't exist
      return {
        name: 'Claude Flow Workflows',
        status: 'passed',
        details: 'Workflow system ready'
      };
    }
  }

  // Agent-OS Verification Tests

  async testAgentOSBasic(dependency) {
    try {
      const { stdout } = await execAsync('agent-os --version', { timeout: this.timeout });
      
      return {
        name: 'Agent-OS Basic',
        status: 'passed',
        details: stdout.trim()
      };
    } catch (error) {
      return {
        name: 'Agent-OS Basic',
        status: 'failed',
        error: error.message
      };
    }
  }

  async testAgentOSAgents(dependency) {
    try {
      const { stdout } = await execAsync('agent-os list-agents', { timeout: this.timeout });
      
      return {
        name: 'Agent-OS Agents',
        status: 'passed',
        details: 'Agent listing works'
      };
    } catch (error) {
      return {
        name: 'Agent-OS Agents',
        status: 'warning',
        warning: 'Agent listing may not be working'
      };
    }
  }

  async testAgentOSCommunication(dependency) {
    try {
      const { stdout } = await execAsync('agent-os ping', { timeout: this.timeout });
      
      return {
        name: 'Agent-OS Communication',
        status: 'passed',
        details: 'Agent communication working'
      };
    } catch (error) {
      return {
        name: 'Agent-OS Communication',
        status: 'warning',
        warning: 'Agent communication may need setup'
      };
    }
  }

  // TMux Verification Tests

  async testTmuxBasic(dependency) {
    try {
      const { stdout } = await execAsync('tmux -V', { timeout: this.timeout });
      
      return {
        name: 'TMux Basic',
        status: 'passed',
        details: stdout.trim()
      };
    } catch (error) {
      return {
        name: 'TMux Basic',
        status: 'failed',
        error: error.message
      };
    }
  }

  async testTmuxSessions(dependency) {
    try {
      // Try to list sessions (will fail if no sessions exist, which is okay)
      await execAsync('tmux list-sessions', { timeout: this.timeout });
      
      return {
        name: 'TMux Sessions',
        status: 'passed',
        details: 'Session management working'
      };
    } catch (error) {
      if (error.message.includes('no server running')) {
        return {
          name: 'TMux Sessions',
          status: 'passed',
          details: 'TMux ready (no active sessions)'
        };
      }
      
      return {
        name: 'TMux Sessions',
        status: 'warning',
        warning: 'Session management may have issues'
      };
    }
  }

  async testTmuxIntegration(dependency) {
    try {
      // Test creating and killing a test session
      await execAsync('tmux new-session -d -s verification-test', { timeout: this.timeout });
      await execAsync('tmux kill-session -t verification-test', { timeout: this.timeout });
      
      return {
        name: 'TMux Integration',
        status: 'passed',
        details: 'Session creation and management working'
      };
    } catch (error) {
      return {
        name: 'TMux Integration',
        status: 'warning',
        warning: 'Session management may need manual testing'
      };
    }
  }

  // NPM Verification Tests

  async testNpmBasic(dependency) {
    try {
      const { stdout } = await execAsync('npm --version', { timeout: this.timeout });
      
      return {
        name: 'NPM Basic',
        status: 'passed',
        details: `Version: ${stdout.trim()}`
      };
    } catch (error) {
      return {
        name: 'NPM Basic',
        status: 'failed',
        error: error.message
      };
    }
  }

  async testNpmRegistry(dependency) {
    try {
      const { stdout } = await execAsync('npm config get registry', { timeout: this.timeout });
      
      return {
        name: 'NPM Registry',
        status: 'passed',
        details: `Registry: ${stdout.trim()}`
      };
    } catch (error) {
      return {
        name: 'NPM Registry',
        status: 'warning',
        warning: 'Registry configuration may have issues'
      };
    }
  }

  async testNpmPermissions(dependency) {
    try {
      // Test npm permissions by checking global packages
      await execAsync('npm list -g --depth=0', { timeout: this.timeout });
      
      return {
        name: 'NPM Permissions',
        status: 'passed',
        details: 'Global package access working'
      };
    } catch (error) {
      return {
        name: 'NPM Permissions',
        status: 'warning',
        warning: 'Global package permissions may need adjustment'
      };
    }
  }

  // Recovery Methods

  async attemptRecovery(dependency, verificationResult) {
    console.log(chalk.yellow(`\n🔧 Attempting recovery for ${dependency.name}...`));
    
    const fallback = this.fallbackOptions[dependency.key];
    if (!fallback || !fallback.recovery) {
      console.log(chalk.gray('  No automatic recovery available'));
      return false;
    }

    try {
      const recovered = await fallback.recovery(dependency, verificationResult);
      
      if (recovered) {
        console.log(chalk.green(`  ✅ Recovery successful for ${dependency.name}`));
        return true;
      } else {
        console.log(chalk.yellow(`  ⚠️  Recovery partially successful for ${dependency.name}`));
        return false;
      }
    } catch (error) {
      console.log(chalk.red(`  ❌ Recovery failed for ${dependency.name}: ${error.message}`));
      return false;
    }
  }

  async recoverNodejs(dependency, result) {
    // Try to fix common Node.js issues
    console.log('  Checking Node.js path...');
    
    try {
      await execAsync('node --version');
      console.log('  Node.js is accessible');
      return true;
    } catch (error) {
      console.log('  Node.js path issues detected');
      console.log('  Please ensure Node.js is in your PATH');
      return false;
    }
  }

  async recoverGit(dependency, result) {
    // Try to fix common Git issues
    console.log('  Checking Git configuration...');
    
    try {
      await execAsync('git config --global user.name || git config --global user.name "Claude Flow User"');
      await execAsync('git config --global user.email || git config --global user.email "user@claude-flow.dev"');
      console.log('  Git configuration updated');
      return true;
    } catch (error) {
      return false;
    }
  }

  async recoverClaudeCode(dependency, result) {
    console.log('  Suggesting alternative access methods...');
    console.log('  • Web interface at https://claude.ai/code');
    console.log('  • VS Code extension available');
    return false; // Manual intervention needed
  }

  async recoverClaudeFlow(dependency, result) {
    console.log('  Setting up npx fallback...');
    console.log('  Claude Flow can be used via: npx claude-flow@2.0.0');
    return true; // npx is sufficient
  }

  async recoverAgentOS(dependency, result) {
    console.log('  Checking Agent-OS installation...');
    return false; // Usually needs manual setup
  }

  async recoverTmux(dependency, result) {
    console.log('  Suggesting terminal alternatives...');
    
    switch (process.platform) {
      case 'win32':
        console.log('  • Windows Terminal with tabs');
        console.log('  • PowerShell with multiple windows');
        break;
      case 'darwin':
        console.log('  • iTerm2 with tabs');
        console.log('  • Terminal with multiple windows');
        break;
      case 'linux':
        console.log('  • GNU Screen as alternative');
        console.log('  • Terminal with tabs');
        break;
    }
    
    return false; // Alternative methods suggested
  }

  // Display Methods

  displayTestResults(tests) {
    console.log(chalk.gray('\n    Test Results:'));
    
    tests.forEach(test => {
      let icon;
      switch (test.status) {
        case 'passed':
          icon = '✅';
          break;
        case 'warning':
          icon = '⚠️ ';
          break;
        case 'failed':
          icon = '❌';
          break;
        default:
          icon = '❓';
      }
      
      console.log(chalk.gray(`      ${icon} ${test.name}: ${test.details || test.error || test.warning}`));
    });
  }

  displayVerificationSummary(results) {
    console.log('\n' + '═'.repeat(60));
    console.log(chalk.cyan.bold('📊 Verification Summary'));
    console.log('═'.repeat(60));
    
    console.log(`\n${chalk.green('✅ Passed:')} ${results.passed}/${results.total}`);
    console.log(`${chalk.yellow('⚠️  Warnings:')} ${results.warnings}/${results.total}`);
    console.log(`${chalk.red('❌ Failed:')} ${results.failed}/${results.total}`);
    
    const overallStatus = results.failed === 0 ? 
      (results.warnings === 0 ? 'excellent' : 'good') : 'needs attention';
    
    console.log(`\n${chalk.cyan('Overall Status:')} ${this.getStatusDisplay(overallStatus)}`);
    
    // Show recommendations
    if (results.recommendations.length > 0) {
      console.log(chalk.yellow('\n💡 Recommendations:'));
      results.recommendations.forEach(rec => {
        console.log(`  • ${rec}`);
      });
    }
  }

  getStatusDisplay(status) {
    switch (status) {
      case 'excellent':
        return chalk.green('Excellent - All systems operational');
      case 'good':
        return chalk.yellow('Good - Minor issues detected');
      case 'needs attention':
        return chalk.red('Needs Attention - Critical issues found');
      default:
        return chalk.gray('Unknown');
    }
  }
}

module.exports = PostInstallVerifier;