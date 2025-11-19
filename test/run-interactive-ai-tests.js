#!/usr/bin/env node

/**
 * Interactive AI Test Runner
 * Main entry point for running all interactive and AI-guided testing
 * 
 * This script provides a convenient interface for running comprehensive tests
 * of Claude Flow 2.0's interactive features and AI-guided development workflows.
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

// Import the master orchestrator
const MasterInteractiveAITestOrchestrator = require('./master-interactive-ai-test-orchestrator');

class InteractiveAITestRunner {
  constructor() {
    this.options = {
      mode: 'comprehensive', // comprehensive, quick, individual
      suites: [], // specific suites to run
      timeout: 3600000, // 1 hour default timeout
      verbose: false,
      generateReports: true,
      cleanupAfter: true
    };
    
    this.availableSuites = {
      'interactive': 'Interactive & AI-Guided Test Suite',
      'ai-enhancement': 'AI Enhancement Command Test Suite', 
      'fullstack-modern': 'Fullstack Modern Template Test Suite',
      'orchestrated': 'Full Orchestrated Test Run'
    };
  }

  async run() {
    console.log('🚀 Claude Flow 2.0 Interactive AI Test Runner');
    console.log('=' .repeat(60));
    
    try {
      // Parse command line arguments
      this.parseArguments();
      
      // Display configuration
      this.displayConfiguration();
      
      // Run tests based on mode
      switch (this.options.mode) {
        case 'comprehensive':
          await this.runComprehensiveTests();
          break;
        case 'quick':
          await this.runQuickTests();
          break;
        case 'individual':
          await this.runIndividualSuites();
          break;
        default:
          throw new Error(`Unknown mode: ${this.options.mode}`);
      }
      
    } catch (error) {
      console.error('❌ Test runner failed:', error.message);
      this.displayHelp();
      process.exit(1);
    }
  }

  parseArguments() {
    const args = process.argv.slice(2);
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      switch (arg) {
        case '--mode':
        case '-m':
          this.options.mode = args[++i];
          break;
        case '--suites':
        case '-s':
          this.options.suites = args[++i].split(',').map(s => s.trim());
          break;
        case '--timeout':
        case '-t':
          this.options.timeout = parseInt(args[++i]) * 1000;
          break;
        case '--verbose':
        case '-v':
          this.options.verbose = true;
          break;
        case '--no-reports':
          this.options.generateReports = false;
          break;
        case '--no-cleanup':
          this.options.cleanupAfter = false;
          break;
        case '--help':
        case '-h':
          this.displayHelp();
          process.exit(0);
          break;
        default:
          if (arg.startsWith('-')) {
            console.warn(`⚠️  Unknown option: ${arg}`);
          }
      }
    }
    
    // Validate options
    if (!['comprehensive', 'quick', 'individual'].includes(this.options.mode)) {
      throw new Error(`Invalid mode: ${this.options.mode}`);
    }
    
    if (this.options.mode === 'individual' && this.options.suites.length === 0) {
      throw new Error('Individual mode requires --suites to be specified');
    }
  }

  displayConfiguration() {
    console.log('⚙️  Configuration:');
    console.log(`   Mode: ${this.options.mode}`);
    if (this.options.suites.length > 0) {
      console.log(`   Suites: ${this.options.suites.join(', ')}`);
    }
    console.log(`   Timeout: ${Math.round(this.options.timeout / 1000 / 60)} minutes`);
    console.log(`   Verbose: ${this.options.verbose}`);
    console.log(`   Generate Reports: ${this.options.generateReports}`);
    console.log(`   Cleanup After: ${this.options.cleanupAfter}`);
    console.log('');
  }

  async runComprehensiveTests() {
    console.log('🎯 Running comprehensive interactive AI tests...');
    console.log('This will execute all test suites with full orchestration.');
    console.log('');
    
    const orchestrator = new MasterInteractiveAITestOrchestrator();
    
    // Set up timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Comprehensive tests timed out after ${this.options.timeout}ms`));
      }, this.options.timeout);
    });
    
    try {
      await Promise.race([
        orchestrator.runComprehensiveTestOrchestration(),
        timeoutPromise
      ]);
      
      await orchestrator.generateFinalSummary();
      
      console.log('\n✅ Comprehensive tests completed successfully!');
      
    } catch (error) {
      console.error('❌ Comprehensive tests failed:', error.message);
      throw error;
    }
  }

  async runQuickTests() {
    console.log('⚡ Running quick interactive AI tests...');
    console.log('This will run a subset of critical tests for faster feedback.');
    console.log('');
    
    // Run individual test suites with shorter timeouts
    const quickSuites = ['interactive'];
    
    for (const suiteId of quickSuites) {
      console.log(`🔥 Running ${this.availableSuites[suiteId]}...`);
      
      try {
        await this.runSingleSuite(suiteId, 300000); // 5 minute timeout
        console.log(`✅ ${this.availableSuites[suiteId]} completed`);
      } catch (error) {
        console.error(`❌ ${this.availableSuites[suiteId]} failed:`, error.message);
        throw error;
      }
    }
    
    console.log('\n✅ Quick tests completed successfully!');
  }

  async runIndividualSuites() {
    console.log('🔧 Running individual test suites...');
    console.log(`Suites to run: ${this.options.suites.join(', ')}`);
    console.log('');
    
    for (const suiteId of this.options.suites) {
      if (!this.availableSuites[suiteId]) {
        throw new Error(`Unknown suite: ${suiteId}`);
      }
      
      console.log(`🔥 Running ${this.availableSuites[suiteId]}...`);
      
      try {
        await this.runSingleSuite(suiteId, this.options.timeout);
        console.log(`✅ ${this.availableSuites[suiteId]} completed`);
      } catch (error) {
        console.error(`❌ ${this.availableSuites[suiteId]} failed:`, error.message);
        throw error;
      }
    }
    
    console.log('\n✅ Individual suites completed successfully!');
  }

  async runSingleSuite(suiteId, timeout = 600000) {
    const suitePaths = {
      'interactive': './interactive-ai-guided-test-suite.js',
      'ai-enhancement': './ai-enhancement-command-test-suite.js',
      'fullstack-modern': './fullstack-modern-comprehensive-test-suite.js'
    };
    
    const suitePath = suitePaths[suiteId];
    if (!suitePath) {
      throw new Error(`No executable path for suite: ${suiteId}`);
    }
    
    return new Promise((resolve, reject) => {
      const child = spawn('node', [path.resolve(__dirname, suitePath)], {
        stdio: this.options.verbose ? 'inherit' : 'pipe',
        cwd: __dirname
      });
      
      let output = '';
      
      if (!this.options.verbose) {
        child.stdout.on('data', (data) => {
          output += data.toString();
        });
        
        child.stderr.on('data', (data) => {
          output += data.toString();
        });
      }
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve({ output, exitCode: code });
        } else {
          reject(new Error(`Suite exited with code ${code}`));
        }
      });
      
      child.on('error', reject);
      
      // Set timeout
      setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error(`Suite timed out after ${timeout}ms`));
      }, timeout);
    });
  }

  displayHelp() {
    console.log(`
Claude Flow 2.0 Interactive AI Test Runner

USAGE:
  node run-interactive-ai-tests.js [OPTIONS]

MODES:
  comprehensive    Run all test suites with full orchestration (default)
  quick           Run critical tests for faster feedback
  individual      Run specific test suites

OPTIONS:
  -m, --mode MODE          Test execution mode (comprehensive|quick|individual)
  -s, --suites SUITES      Comma-separated list of suites for individual mode
  -t, --timeout MINUTES    Timeout in minutes (default: 60)
  -v, --verbose            Enable verbose output
  --no-reports            Skip report generation
  --no-cleanup            Skip cleanup after tests
  -h, --help              Show this help message

AVAILABLE SUITES:
  interactive             Interactive & AI-Guided Test Suite
  ai-enhancement          AI Enhancement Command Test Suite
  fullstack-modern        Fullstack Modern Template Test Suite

EXAMPLES:
  # Run comprehensive tests (all suites with orchestration)
  node run-interactive-ai-tests.js

  # Run quick tests for faster feedback
  node run-interactive-ai-tests.js --mode quick

  # Run specific test suites
  node run-interactive-ai-tests.js --mode individual --suites interactive,ai-enhancement

  # Run with verbose output and custom timeout
  node run-interactive-ai-tests.js --verbose --timeout 30

TEST COVERAGE:
  • Interactive Project Creation & Setup
  • AI-Guided Development Workflows  
  • AI Enhancement Commands
  • User Experience & Accessibility
  • End-to-End Integration Testing
  • Performance & Security Validation
`);
  }
}

// Run the test runner if called directly
if (require.main === module) {
  const runner = new InteractiveAITestRunner();
  runner.run().catch((error) => {
    console.error('❌ Test runner execution failed:', error.message);
    process.exit(1);
  });
}

module.exports = InteractiveAITestRunner;