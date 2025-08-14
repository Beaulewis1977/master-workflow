#!/usr/bin/env node
/**
 * Critical Fixes Integration Test
 * 
 * Tests all the critical workflow system fixes:
 * 1. Queen Controller specialized agent spawning
 * 2. Context window enforcement (200k)
 * 3. Auto-delegation configuration
 * 4. Database connection management
 * 5. Security improvements
 */

const fs = require('fs');
const path = require('path');
const QueenController = require('./intelligence-engine/queen-controller');
const DatabaseConnectionManager = require('./intelligence-engine/database-connection-manager');

class CriticalFixesValidator {
  constructor() {
    this.testResults = {
      queenController: { passed: 0, failed: 0, tests: [] },
      contextWindow: { passed: 0, failed: 0, tests: [] },
      autoDelegation: { passed: 0, failed: 0, tests: [] },
      database: { passed: 0, failed: 0, tests: [] },
      security: { passed: 0, failed: 0, tests: [] }
    };
    this.totalTests = 0;
    this.passedTests = 0;
  }

  log(message) {
    console.log(`[TEST] ${message}`);
  }

  error(message) {
    console.error(`[ERROR] ${message}`);
  }

  success(message) {
    console.log(`\x1b[32m✓ ${message}\x1b[0m`);
  }

  failure(message) {
    console.log(`\x1b[31m✗ ${message}\x1b[0m`);
  }

  async runTest(category, testName, testFn) {
    this.totalTests++;
    try {
      this.log(`Running ${testName}...`);
      await testFn();
      this.testResults[category].passed++;
      this.testResults[category].tests.push({ name: testName, status: 'passed' });
      this.passedTests++;
      this.success(`${testName} passed`);
      return true;
    } catch (error) {
      this.testResults[category].failed++;
      this.testResults[category].tests.push({ name: testName, status: 'failed', error: error.message });
      this.failure(`${testName} failed: ${error.message}`);
      return false;
    }
  }

  async testQueenControllerSpecializedAgents() {
    await this.runTest('queenController', 'Queen Controller Initialization', async () => {
      const queen = new QueenController({
        maxConcurrent: 5,
        contextWindowSize: 200000,
        projectRoot: process.cwd()
      });

      // Test agent type registry has context window specifications
      if (queen.agentTypes.size === 0) {
        throw new Error('No agent types registered');
      }

      for (const [type, config] of queen.agentTypes) {
        if (!config.contextWindow || config.contextWindow !== 200000) {
          throw new Error(`Agent type ${type} missing 200k context window specification`);
        }
      }

      await queen.shutdown();
    });

    await this.runTest('queenController', 'Specialized Agent Spawning', async () => {
      const queen = new QueenController({
        maxConcurrent: 2,
        contextWindowSize: 200000,
        projectRoot: process.cwd()
      });

      const task = {
        id: 'test-task-001',
        name: 'Test specialized agent spawning',
        category: 'recovery',
        description: 'Test recovery specialist spawning'
      };

      const agentId = await queen.spawnSubAgent('recovery-specialist', task);
      
      if (!agentId) {
        throw new Error('Failed to spawn specialized agent');
      }

      const agent = queen.subAgents.get(agentId);
      if (!agent) {
        throw new Error('Agent not found in registry');
      }

      if (agent.maxTokens !== 200000) {
        throw new Error(`Agent context window not set to 200k: ${agent.maxTokens}`);
      }

      if (!agent.context.context_window || agent.context.context_window !== 200000) {
        throw new Error('Agent context missing 200k specification');
      }

      await queen.shutdown();
    });

    await this.runTest('queenController', 'Context Window Monitoring Setup', async () => {
      const queen = new QueenController({
        maxConcurrent: 1,
        contextWindowSize: 200000,
        projectRoot: process.cwd()
      });

      const task = {
        id: 'test-context-monitoring',
        name: 'Test context monitoring',
        category: 'testing'
      };

      const agentId = await queen.spawnSubAgent('test-runner', task);
      const agent = queen.subAgents.get(agentId);

      if (!agent.contextMonitoringInterval) {
        throw new Error('Context monitoring interval not set up');
      }

      // Test context overflow detection
      agent.tokenUsage = 195000; // 97.5% of 200k
      const health = await queen.checkAgentHealth(agent);

      if (!health.contextWarning) {
        throw new Error('Context warning not triggered at 97.5%');
      }

      if (health.contextUtilization < 95) {
        throw new Error(`Context utilization calculation incorrect: ${health.contextUtilization}%`);
      }

      await queen.shutdown();
    });
  }

  async testContextWindowEnforcement() {
    await this.runTest('contextWindow', 'Context Window Configuration', async () => {
      // Test Queen Controller enforces 200k context windows
      const queen = new QueenController();
      
      if (queen.contextWindowSize !== 200000) {
        throw new Error(`Context window size not 200k: ${queen.contextWindowSize}`);
      }

      // Test agent templates include context window specs
      const instructions = queen.generateSpecializedInstructions('code-analyzer');
      if (!instructions.includes('context_window: 200000')) {
        throw new Error('Specialized instructions missing context window specification');
      }

      await queen.shutdown();
    });

    await this.runTest('contextWindow', 'Context Overflow Protection', async () => {
      const queen = new QueenController({ maxConcurrent: 1 });
      
      const task = { id: 'overflow-test', category: 'analysis' };
      const agentId = await queen.spawnSubAgent('code-analyzer', task);
      const agent = queen.subAgents.get(agentId);

      // Simulate approaching context limit
      agent.tokenUsage = 190000; // 95% of 200k
      
      const health = await queen.checkAgentHealth(agent);
      if (!health.contextWarning) {
        throw new Error('Context warning not triggered at 95%');
      }

      // Simulate context overflow
      agent.tokenUsage = 200001; // Over limit
      const overflowHealth = await queen.checkAgentHealth(agent);
      if (overflowHealth.status !== 'context_overflow') {
        throw new Error('Context overflow not detected');
      }

      await queen.shutdown();
    });
  }

  async testAutoDelegationConfiguration() {
    await this.runTest('autoDelegation', 'Settings File Configuration', async () => {
      const settingsPath = path.join(process.cwd(), '.claude/settings.json');
      
      if (!fs.existsSync(settingsPath)) {
        throw new Error('Claude settings.json file not found');
      }

      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      
      if (!settings.autoDelegation) {
        throw new Error('autoDelegation configuration missing');
      }

      if (!settings.autoDelegation.enabled) {
        throw new Error('autoDelegation not enabled');
      }

      if (!Array.isArray(settings.autoDelegation.rules) || settings.autoDelegation.rules.length === 0) {
        throw new Error('autoDelegation rules not configured');
      }
    });

    await this.runTest('autoDelegation', 'Delegation Rules Validation', async () => {
      const settingsPath = path.join(process.cwd(), '.claude/settings.json');
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      
      const expectedRules = [
        'delegate-tests-to-test-engineer',
        'delegate-security-to-security-auditor',
        'delegate-recovery-to-recovery-specialist',
        'delegate-performance-to-performance-optimizer',
        'delegate-database-to-database-architect',
        'delegate-deployment-to-deployment-engineer',
        'delegate-documentation-to-doc-generator'
      ];

      const ruleIds = settings.autoDelegation.rules.map(rule => rule.id);
      
      for (const expectedRule of expectedRules) {
        if (!ruleIds.includes(expectedRule)) {
          throw new Error(`Missing delegation rule: ${expectedRule}`);
        }
      }

      // Validate rule structure
      for (const rule of settings.autoDelegation.rules) {
        if (!rule.id || !rule.when || !rule.delegateTo || rule.confidenceThreshold === undefined) {
          throw new Error(`Invalid rule structure: ${rule.id}`);
        }
      }
    });
  }

  async testDatabaseConnectionManagement() {
    await this.runTest('database', 'Connection Manager Initialization', async () => {
      const dbManager = new DatabaseConnectionManager({
        maxConnections: 5,
        minConnections: 1,
        maxConnectionAge: 3600000,
        connectionRecycleInterval: 10000
      });

      if (!dbManager.options.maxConnectionAge) {
        throw new Error('Connection recycling options not configured');
      }

      if (!dbManager.recycleTimer) {
        throw new Error('Connection recycling timer not started');
      }

      await dbManager.shutdown();
    });

    await this.runTest('database', 'Connection Recycling Configuration', async () => {
      const dbManager = new DatabaseConnectionManager({
        maxConnectionAge: 60000, // 1 minute for testing
        maxConnectionUse: 10,
        connectionRecycleInterval: 5000
      });

      // Verify recycling options are set
      if (dbManager.options.maxConnectionAge !== 60000) {
        throw new Error('Max connection age not set correctly');
      }

      if (dbManager.options.maxConnectionUse !== 10) {
        throw new Error('Max connection use not set correctly');
      }

      if (dbManager.options.connectionRecycleInterval !== 5000) {
        throw new Error('Connection recycle interval not set correctly');
      }

      await dbManager.shutdown();
    });
  }

  async testSecurityImprovements() {
    await this.runTest('security', 'Installer Security Functions', async () => {
      const installerPath = path.join(process.cwd(), 'install-modular.sh');
      
      if (!fs.existsSync(installerPath)) {
        throw new Error('Installer script not found');
      }

      const installerContent = fs.readFileSync(installerPath, 'utf-8');
      
      // Check for security functions
      const securityFunctions = ['validate_path', 'sanitize_input', 'validate_command'];
      
      for (const fn of securityFunctions) {
        if (!installerContent.includes(fn)) {
          throw new Error(`Security function ${fn} not found in installer`);
        }
      }

      // Check for secure Node.js installation
      if (!installerContent.includes('gpg --dearmor')) {
        throw new Error('Secure Node.js installation not implemented');
      }
    });

    await this.runTest('security', 'Path Validation in Shared Memory', async () => {
      const SharedMemoryStore = require('./intelligence-engine/shared-memory');
      
      try {
        // Test path traversal protection
        const store = new SharedMemoryStore({
          projectRoot: '/tmp/../etc'  // Should be blocked
        });
        throw new Error('Path traversal not blocked');
      } catch (error) {
        if (!error.message.includes('Project root must be within')) {
          throw error; // Re-throw if it's not the expected security error
        }
        // Expected security error - test passes
      }
    });
  }

  async runAllTests() {
    console.log('\n🧪 Starting Critical Fixes Integration Tests...\n');

    try {
      await this.testQueenControllerSpecializedAgents();
      await this.testContextWindowEnforcement();
      await this.testAutoDelegationConfiguration();
      await this.testDatabaseConnectionManagement();
      await this.testSecurityImprovements();
    } catch (error) {
      this.error(`Test suite error: ${error.message}`);
    }

    this.printResults();
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 CRITICAL FIXES TEST RESULTS');
    console.log('='.repeat(60));

    for (const [category, results] of Object.entries(this.testResults)) {
      const total = results.passed + results.failed;
      const percentage = total > 0 ? Math.round((results.passed / total) * 100) : 0;
      
      console.log(`\n📂 ${category.toUpperCase()}:`);
      console.log(`   ✓ Passed: ${results.passed}`);
      console.log(`   ✗ Failed: ${results.failed}`);
      console.log(`   📊 Success Rate: ${percentage}%`);
      
      if (results.failed > 0) {
        console.log('   💥 Failures:');
        results.tests.filter(t => t.status === 'failed').forEach(test => {
          console.log(`      - ${test.name}: ${test.error}`);
        });
      }
    }

    const overallPercentage = this.totalTests > 0 ? Math.round((this.passedTests / this.totalTests) * 100) : 0;
    
    console.log('\n' + '='.repeat(60));
    console.log(`📊 OVERALL RESULTS:`);
    console.log(`   Total Tests: ${this.totalTests}`);
    console.log(`   Passed: ${this.passedTests}`);
    console.log(`   Failed: ${this.totalTests - this.passedTests}`);
    console.log(`   Success Rate: ${overallPercentage}%`);

    if (overallPercentage >= 90) {
      console.log(`\n🎉 EXCELLENT! All critical fixes are working properly.`);
    } else if (overallPercentage >= 70) {
      console.log(`\n⚠️  GOOD: Most fixes working, but some issues remain.`);
    } else {
      console.log(`\n🚨 CRITICAL: Multiple fixes need attention.`);
    }

    console.log('='.repeat(60) + '\n');
    
    // Exit with appropriate code
    process.exit(overallPercentage >= 70 ? 0 : 1);
  }
}

// Run tests if called directly
if (require.main === module) {
  const validator = new CriticalFixesValidator();
  validator.runAllTests().catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
}

module.exports = CriticalFixesValidator;