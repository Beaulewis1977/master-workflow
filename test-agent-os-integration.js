/**
 * Agent-OS Integration Test Script
 * Tests the three-layer context architecture and conditional file loading
 */

const AgentOSIntegration = require('./.ai-workflow/intelligence-engine/agent-os-integration');
const AgentOSQueenBridge = require('./.ai-workflow/intelligence-engine/agent-os-queen-bridge');
const path = require('path');
const fs = require('fs').promises;

class AgentOSIntegrationTest {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
  }

  /**
   * Run all integration tests
   */
  async runAllTests() {
    console.log('Starting Agent-OS Integration Tests...\n');

    await this.testAgentOSInitialization();
    await this.testContextLayerLoading();
    await this.testConditionalFileLoading();
    await this.testContextReduction();
    await this.testAgentAssignment();
    await this.testQueenControllerBridge();
    await this.testCommandExecution();

    this.printResults();
    return this.testResults;
  }

  /**
   * Test Agent-OS initialization
   */
  async testAgentOSInitialization() {
    const testName = 'Agent-OS Initialization';
    try {
      const agentOS = new AgentOSIntegration();
      
      // Test configuration loading
      const config = await agentOS.loadConfig();
      this.assert(config.version === '2.0', 'Config version should be 2.0');
      this.assert(config.integration === 'claude-flow-workflow', 'Integration type correct');
      
      // Test layer configuration
      this.assert(agentOS.layers.standards.path === '.agent-os/standards', 'Standards path correct');
      this.assert(agentOS.layers.product.path === '.agent-os/product', 'Product path correct');
      this.assert(agentOS.layers.specifications.path === '.agent-os/specs', 'Specs path correct');

      this.testPassed(testName);
    } catch (error) {
      this.testFailed(testName, error.message);
    }
  }

  /**
   * Test context layer loading strategies
   */
  async testContextLayerLoading() {
    const testName = 'Context Layer Loading';
    try {
      const agentOS = new AgentOSIntegration();
      
      // Test different loading strategies
      const strategies = ['plan-product', 'create-spec', 'execute-tasks', 'analyze-product'];
      
      for (const strategy of strategies) {
        const loadingStrategy = agentOS.getLoadingStrategy(strategy);
        this.assert(typeof loadingStrategy === 'object', `Loading strategy for ${strategy} should be object`);
        this.assert('standards' in loadingStrategy, `Standards layer defined for ${strategy}`);
        this.assert('product' in loadingStrategy, `Product layer defined for ${strategy}`);
        this.assert('specifications' in loadingStrategy, `Specifications layer defined for ${strategy}`);
      }

      this.testPassed(testName);
    } catch (error) {
      this.testFailed(testName, error.message);
    }
  }

  /**
   * Test conditional file loading
   */
  async testConditionalFileLoading() {
    const testName = 'Conditional File Loading';
    try {
      const agentOS = new AgentOSIntegration();
      
      // Test standards layer loading
      const standards = await agentOS.loadStandardsLayer('conditional');
      this.assert(typeof standards === 'object', 'Standards should be loaded as object');
      
      // Test product layer loading
      const product = await agentOS.loadProductLayer('conditional');
      this.assert(typeof product === 'object', 'Product should be loaded as object');
      
      // Test specifications layer loading
      const specs = await agentOS.loadSpecificationsLayer('selective', { featureType: 'api' });
      this.assert(specs instanceof Map, 'Specifications should be loaded as Map');

      this.testPassed(testName);
    } catch (error) {
      this.testFailed(testName, error.message);
    }
  }

  /**
   * Test context reduction calculations
   */
  async testContextReduction() {
    const testName = 'Context Reduction';
    try {
      const agentOS = new AgentOSIntegration();
      
      // Initialize with different commands to test reduction
      const commands = ['plan-product', 'create-spec', 'execute-tasks'];
      
      for (const command of commands) {
        const result = await agentOS.initialize(command);
        
        this.assert(typeof result.reduction === 'number', `Reduction should be number for ${command}`);
        this.assert(result.reduction >= 0 && result.reduction <= 100, `Reduction should be 0-100% for ${command}`);
        this.assert(result.context.metadata.totalSize >= 0, `Context size should be non-negative for ${command}`);
        
        console.log(`  ${command}: ${result.reduction}% context reduction achieved`);
      }

      this.testPassed(testName);
    } catch (error) {
      this.testFailed(testName, error.message);
    }
  }

  /**
   * Test agent assignment logic
   */
  async testAgentAssignment() {
    const testName = 'Agent Assignment';
    try {
      const agentOS = new AgentOSIntegration();
      
      const commands = {
        'plan-product': '1-orchestration-coordinator.md',
        'create-spec': '1-documentation-generator.md',
        'execute-tasks': '1-neural-swarm-architect.md',
        'analyze-product': '1-intelligence-analyzer.md'
      };
      
      for (const [command, expectedAgent] of Object.entries(commands)) {
        const assignment = await agentOS.getAgentAssignment(command);
        this.assert(assignment.agent === expectedAgent, `Agent assignment for ${command} should be ${expectedAgent}`);
      }

      this.testPassed(testName);
    } catch (error) {
      this.testFailed(testName, error.message);
    }
  }

  /**
   * Test Queen Controller bridge integration
   */
  async testQueenControllerBridge() {
    const testName = 'Queen Controller Bridge';
    try {
      // Mock Queen Controller
      const mockQueenController = {
        maxConcurrent: 10,
        contextWindowSize: 200000
      };
      
      const bridge = new AgentOSQueenBridge(mockQueenController);
      
      // Test initialization
      this.assert(bridge.config.maxConcurrentAgents === 10, 'Max concurrent agents should be 10');
      this.assert(bridge.config.maxContextPerAgent === 200000, 'Context window should be 200k');
      
      // Test system status
      const status = bridge.getSystemStatus();
      this.assert(status.bridge.initialized === true, 'Bridge should be initialized');
      this.assert(Array.isArray(status.bridge.agentCapabilities), 'Agent capabilities should be array');

      this.testPassed(testName);
    } catch (error) {
      this.testFailed(testName, error.message);
    }
  }

  /**
   * Test command execution
   */
  async testCommandExecution() {
    const testName = 'Command Execution';
    try {
      const mockQueenController = {
        maxConcurrent: 10,
        contextWindowSize: 200000
      };
      
      const bridge = new AgentOSQueenBridge(mockQueenController);
      
      // Test executing a simple command
      const result = await bridge.executeCommand('create-spec', {
        featureName: 'test-feature',
        featureType: 'api'
      });
      
      this.assert(result.success === true, 'Command execution should succeed');
      this.assert(typeof result.selectedAgent === 'string', 'Selected agent should be specified');
      this.assert(typeof result.contextReduction === 'number', 'Context reduction should be reported');
      this.assert(result.contextReduction >= 0, 'Context reduction should be non-negative');

      console.log(`  Command executed successfully with ${result.contextReduction}% context reduction`);
      console.log(`  Selected agent: ${result.selectedAgent}`);

      this.testPassed(testName);
    } catch (error) {
      this.testFailed(testName, error.message);
    }
  }

  /**
   * Assert condition with error reporting
   */
  assert(condition, message) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  /**
   * Record test passed
   */
  testPassed(testName) {
    this.testResults.passed++;
    this.testResults.total++;
    this.testResults.details.push({ test: testName, status: 'PASSED' });
    console.log(`✅ ${testName}: PASSED`);
  }

  /**
   * Record test failed
   */
  testFailed(testName, error) {
    this.testResults.failed++;
    this.testResults.total++;
    this.testResults.details.push({ test: testName, status: 'FAILED', error });
    console.log(`❌ ${testName}: FAILED - ${error}`);
  }

  /**
   * Print test results summary
   */
  printResults() {
    console.log('\n' + '='.repeat(50));
    console.log('AGENT-OS INTEGRATION TEST RESULTS');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${this.testResults.total}`);
    console.log(`Passed: ${this.testResults.passed}`);
    console.log(`Failed: ${this.testResults.failed}`);
    console.log(`Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(1)}%`);
    
    if (this.testResults.failed > 0) {
      console.log('\nFailed Tests:');
      this.testResults.details
        .filter(detail => detail.status === 'FAILED')
        .forEach(detail => {
          console.log(`  - ${detail.test}: ${detail.error}`);
        });
    }
    
    console.log('\n' + '='.repeat(50));
  }
}

// Run tests if script is executed directly
if (require.main === module) {
  const tester = new AgentOSIntegrationTest();
  tester.runAllTests()
    .then(results => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = AgentOSIntegrationTest;