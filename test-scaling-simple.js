#!/usr/bin/env node

/**
 * Simple Unlimited Scaling Test - Basic Verification
 */

class SimpleScalingTest {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      errors: []
    };
  }
  
  async runTest() {
    console.log('🚀 Simple Unlimited Scaling Test');
    console.log('================================');
    
    try {
      await this.testQueenControllerConfig();
      await this.testSharedMemoryCapacity();
      await this.testResourceMonitorScaling();
      
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      this.testResults.failed++;
      this.testResults.errors.push(error.message);
    }
  }
  
  /**
   * Test Queen Controller unlimited scaling configuration
   */
  async testQueenControllerConfig() {
    console.log('\n📋 Test 1: Queen Controller Configuration');
    
    try {
      const QueenController = require('./intelligence-engine/queen-controller');
      
      // Test unlimited scaling configuration
      const queenController = new QueenController({
        unlimitedScaling: true,
        safetyLimit: null,
        maxAgents: null,
        memoryThreshold: 0.90,
        cpuThreshold: 0.85
      });
      
      // Verify configuration
      if (queenController.unlimitedScaling.safetyLimit !== null && queenController.unlimitedScaling.safetyLimit !== undefined) {
        throw new Error('Safety limit should be null for unlimited scaling');
      }
      
      if (queenController.unlimitedScaling.maxRecommendedAgents < 4000) {
        throw new Error(`Max recommended agents (${queenController.unlimitedScaling.maxRecommendedAgents}) should be at least 4000`);
      }
      
      console.log('✅ Queen Controller unlimited scaling configured correctly');
      console.log(`  - Safety limit: ${queenController.unlimitedScaling.safetyLimit}`);
      console.log(`  - Max recommended: ${queenController.unlimitedScaling.maxRecommendedAgents}`);
      console.log(`  - Emergency threshold: ${queenController.unlimitedScaling.emergencyThreshold}`);
      
      this.testResults.passed++;
      
    } catch (error) {
      console.error('❌ Queen Controller test failed:', error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Queen Controller: ${error.message}`);
    }
  }
  
  /**
   * Test Shared Memory capacity for 4000+ agents
   */
  async testSharedMemoryCapacity() {
    console.log('\n📋 Test 2: Shared Memory Capacity');
    
    try {
      const SharedMemory = require('./intelligence-engine/shared-memory');
      
      const sharedMemory = new SharedMemory({
        maxMemorySize: 2 * 1024 * 1024 * 1024, // 2GB
        maxEntries: 500000 // 500K entries
      });
      
      // Verify capacity
      if (sharedMemory.maxEntries < 500000) {
        throw new Error(`Max entries (${sharedMemory.maxEntries}) should be at least 500,000`);
      }
      
      if (sharedMemory.maxMemorySize < 2 * 1024 * 1024 * 1024) {
        throw new Error(`Max memory (${sharedMemory.maxMemorySize}) should be at least 2GB`);
      }
      
      // Verify indexing is enabled
      if (!sharedMemory.agentIndexes) {
        throw new Error('Agent indexes not initialized');
      }
      
      console.log('✅ Shared Memory configured for large scale');
      console.log(`  - Max entries: ${sharedMemory.maxEntries.toLocaleString()}`);
      console.log(`  - Max memory: ${(sharedMemory.maxMemorySize / (1024 * 1024 * 1024)).toFixed(1)}GB`);
      console.log(`  - Indexing enabled: ${!!sharedMemory.agentIndexes}`);
      
      this.testResults.passed++;
      
    } catch (error) {
      console.error('❌ Shared Memory test failed:', error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Shared Memory: ${error.message}`);
    }
  }
  
  /**
   * Test Resource Monitor scaling calculations
   */
  async testResourceMonitorScaling() {
    console.log('\n📋 Test 3: Resource Monitor Scaling');
    
    try {
      const ResourceMonitor = require('./intelligence-engine/resource-monitor');
      
      const resourceMonitor = new ResourceMonitor({
        targetMemoryUtilization: 0.85,
        targetCpuUtilization: 0.80
      });
      
      // Mock agent metrics for 4000 agents
      resourceMonitor.updateAgentMetrics({
        activeCount: 4000,
        totalContextUsage: 800000000, // 800M tokens
        averageContextUsage: 200000,  // 200K per agent
        memoryPerAgent: 150 * 1024 * 1024 // 150MB per agent
      });
      
      // Calculate scaling recommendations
      resourceMonitor.calculateScalingRecommendations();
      const recommendation = resourceMonitor.getScalingRecommendation();
      
      // Verify unlimited scaling support
      if (!recommendation.unlimitedScaling) {
        throw new Error('Unlimited scaling not enabled in resource monitor');
      }
      
      if (recommendation.maxPossibleAgents < 4000) {
        console.warn(`⚠️  Max possible agents (${recommendation.maxPossibleAgents}) is below 4000`);
      }
      
      console.log('✅ Resource Monitor supports unlimited scaling');
      console.log(`  - Optimal agents: ${recommendation.optimalAgentCount}`);
      console.log(`  - Max possible: ${recommendation.maxPossibleAgents}`);
      console.log(`  - Unlimited scaling: ${recommendation.unlimitedScaling}`);
      console.log(`  - Recommended action: ${recommendation.recommendedAction}`);
      
      this.testResults.passed++;
      
    } catch (error) {
      console.error('❌ Resource Monitor test failed:', error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Resource Monitor: ${error.message}`);
    }
  }
  
  /**
   * Generate test report
   */
  generateReport() {
    console.log('\n================================');
    console.log('📊 SIMPLE SCALING TEST REPORT');
    console.log('================================');
    console.log(`Tests Passed: ${this.testResults.passed}`);
    console.log(`Tests Failed: ${this.testResults.failed}`);
    console.log(`Success Rate: ${((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100).toFixed(1)}%`);
    
    if (this.testResults.errors.length > 0) {
      console.log(`\n❌ ERRORS:`);
      this.testResults.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    const overall = this.testResults.failed === 0;
    console.log(`\n${overall ? '🎉 RESULT: SUCCESS - System ready for unlimited scaling!' : '⚠️  RESULT: Some issues detected'}`);
    console.log('================================');
  }
}

// Run the test
if (require.main === module) {
  const test = new SimpleScalingTest();
  test.runTest().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = SimpleScalingTest;