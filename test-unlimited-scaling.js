#!/usr/bin/env node

/**
 * Test Script for Unlimited Sub-Agent Scaling
 * 
 * This script validates the unlimited scaling capabilities of the Queen Controller
 * by testing resource monitoring, dynamic scaling, conflict detection, and
 * agent registry functionality.
 */

const path = require('path');
const QueenController = require('./intelligence-engine/queen-controller');

class UnlimitedScalingTester {
  constructor() {
    this.testResults = [];
    this.queen = null;
    this.testStartTime = Date.now();
  }
  
  /**
   * Run all unlimited scaling tests
   */
  async runTests() {
    console.log('🚀 Starting Unlimited Sub-Agent Scaling Tests...\n');
    
    try {
      // Test 1: Initialize Queen Controller with unlimited scaling
      await this.testQueenControllerInitialization();
      
      // Test 2: Test resource monitoring
      await this.testResourceMonitoring();
      
      // Test 3: Test dynamic agent registry
      await this.testDynamicAgentRegistry();
      
      // Test 4: Test dynamic scaling calculation
      await this.testDynamicScaling();
      
      // Test 5: Test conflict detection
      await this.testConflictDetection();
      
      // Test 6: Test unlimited agent spawning
      await this.testUnlimitedAgentSpawning();
      
      // Test 7: Test system status reporting
      await this.testSystemStatus();
      
      // Cleanup
      await this.cleanup();
      
      // Report results
      this.reportResults();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      await this.cleanup();
      process.exit(1);
    }
  }
  
  /**
   * Test Queen Controller initialization with unlimited scaling
   */
  async testQueenControllerInitialization() {
    console.log('🔧 Test 1: Queen Controller Initialization with Unlimited Scaling');
    
    try {
      this.queen = new QueenController({
        projectRoot: __dirname,
        unlimitedScaling: true,
        safetyLimit: 100,
        memoryThreshold: 0.85,
        cpuThreshold: 0.80
      });
      
      // Wait for initialization to complete
      await new Promise((resolve) => {
        this.queen.once('unlimited-scaling-initialized', resolve);
        // Fallback timeout
        setTimeout(resolve, 5000);
      });
      
      // Verify unlimited scaling is enabled
      const status = this.queen.getStatus();
      
      this.addTestResult('Queen Controller Initialization', {
        passed: status.unlimitedScaling?.enabled === true,
        details: {
          unlimitedScalingEnabled: status.unlimitedScaling?.enabled,
          agentTypesDiscovered: status.unlimitedScaling?.agentTypesAvailable,
          conflictDetection: status.unlimitedScaling?.conflictDetection,
          resourceMonitoring: !!status.unlimitedScaling?.resourceStatus
        }
      });
      
      console.log(`   ✅ Unlimited scaling enabled: ${status.unlimitedScaling?.enabled}`);
      console.log(`   📋 Agent types discovered: ${status.unlimitedScaling?.agentTypesAvailable || 0}`);
      console.log(`   🔍 Conflict detection: ${status.unlimitedScaling?.conflictDetection}`);
      
    } catch (error) {
      this.addTestResult('Queen Controller Initialization', {
        passed: false,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Test resource monitoring capabilities
   */
  async testResourceMonitoring() {
    console.log('\n📊 Test 2: Resource Monitoring');
    
    try {
      const resourceStatus = this.queen.resourceMonitor?.getResourceStatus();
      const metrics = this.queen.resourceMonitor?.getMetrics();
      
      this.addTestResult('Resource Monitoring', {
        passed: !!resourceStatus && !!metrics,
        details: {
          resourceStatus: resourceStatus?.status,
          health: resourceStatus?.health,
          memoryUsage: resourceStatus?.resources?.memory?.usage,
          cpuUsage: resourceStatus?.resources?.cpu?.usage,
          optimalAgents: resourceStatus?.resources?.agents?.optimal,
          maxAgents: resourceStatus?.resources?.agents?.maximum
        }
      });
      
      if (resourceStatus) {
        console.log(`   💾 Memory usage: ${resourceStatus.resources?.memory?.usage || 'N/A'}`);
        console.log(`   🖥️  CPU usage: ${resourceStatus.resources?.cpu?.usage || 'N/A'}`);
        console.log(`   🎯 Optimal agents: ${resourceStatus.resources?.agents?.optimal || 'N/A'}`);
        console.log(`   📈 Max possible agents: ${resourceStatus.resources?.agents?.maximum || 'N/A'}`);
        console.log(`   💚 System health: ${resourceStatus.health || 'N/A'}`);
      }
      
    } catch (error) {
      this.addTestResult('Resource Monitoring', {
        passed: false,
        error: error.message
      });
    }
  }
  
  /**
   * Test dynamic agent registry
   */
  async testDynamicAgentRegistry() {
    console.log('\n🗂️  Test 3: Dynamic Agent Registry');
    
    try {
      const registry = this.queen.dynamicAgentRegistry;
      const stats = registry?.getStats();
      const agentTypes = registry?.getAgentTypes();
      
      // Test agent search functionality
      const searchResults = registry?.searchAgents('analyzer') || [];
      
      this.addTestResult('Dynamic Agent Registry', {
        passed: !!registry && (stats?.totalAgentTypes || 0) > 0,
        details: {
          totalAgentTypes: stats?.totalAgentTypes,
          validAgents: stats?.validAgents,
          invalidAgents: stats?.invalidAgents,
          searchResults: searchResults.length,
          isInitialized: stats?.isInitialized,
          discoveryTime: stats?.discoveryTime
        }
      });
      
      if (stats) {
        console.log(`   📁 Total agent types: ${stats.totalAgentTypes}`);
        console.log(`   ✅ Valid agents: ${stats.validAgents}`);
        console.log(`   ❌ Invalid agents: ${stats.invalidAgents}`);
        console.log(`   🔍 Search results for 'analyzer': ${searchResults.length}`);
        console.log(`   ⏱️  Discovery time: ${stats.discoveryTime}ms`);
      }
      
      // List some available agent types
      if (agentTypes && agentTypes.size > 0) {
        const sampleTypes = Array.from(agentTypes.keys()).slice(0, 5);
        console.log(`   🎭 Sample agent types: ${sampleTypes.join(', ')}`);
      }
      
    } catch (error) {
      this.addTestResult('Dynamic Agent Registry', {
        passed: false,
        error: error.message
      });
    }
  }
  
  /**
   * Test dynamic scaling calculation
   */
  async testDynamicScaling() {
    console.log('\n⚖️  Test 4: Dynamic Scaling');
    
    try {
      const optimalLimit = await this.queen.calculateDynamicAgentLimit();
      const scaler = this.queen.dynamicScaler;
      const scalerStatus = scaler?.getStatus();
      
      // Test scaling recommendation
      const resourceMetrics = this.queen.resourceMonitor?.getMetrics();
      const workloadMetrics = {
        taskQueueSize: 5,
        averageTaskDuration: 30000,
        taskThroughput: 2,
        agentUtilization: 0.6
      };
      
      const recommendation = scaler?.getScalingRecommendation(
        resourceMetrics?.current, 
        workloadMetrics, 
        this.queen.activeAgents.size
      );
      
      this.addTestResult('Dynamic Scaling', {
        passed: optimalLimit > 0 && !!recommendation,
        details: {
          optimalLimit,
          currentTarget: scalerStatus?.currentTarget,
          shouldScale: recommendation?.shouldScale,
          recommendedAction: recommendation?.recommendation?.reason,
          confidence: recommendation?.confidence
        }
      });
      
      console.log(`   🎯 Optimal agent limit: ${optimalLimit}`);
      console.log(`   📊 Current target: ${scalerStatus?.currentTarget || 'N/A'}`);
      console.log(`   🔄 Should scale: ${recommendation?.shouldScale || false}`);
      console.log(`   💡 Recommendation: ${recommendation?.recommendation?.reason || 'maintain'}`);
      console.log(`   🎪 Confidence: ${((recommendation?.confidence || 0) * 100).toFixed(1)}%`);
      
    } catch (error) {
      this.addTestResult('Dynamic Scaling', {
        passed: false,
        error: error.message
      });
    }
  }
  
  /**
   * Test conflict detection
   */
  async testConflictDetection() {
    console.log('\n🔍 Test 5: Conflict Detection');
    
    try {
      const conflictDetector = this.queen.conflictDetector;
      const status = conflictDetector?.getStatus();
      
      // Test conflict analysis with a sample task
      const sampleTask = {
        id: 'test-task-001',
        description: 'Analyze package.json file and update dependencies',
        files: ['package.json', 'package-lock.json'],
        operation: 'write',
        dependencies: []
      };
      
      const conflictAnalysis = await conflictDetector?.analyzeTaskConflicts(sampleTask, 'test-agent-001');
      
      this.addTestResult('Conflict Detection', {
        passed: !!conflictDetector && !!conflictAnalysis,
        details: {
          detectorStatus: status?.stats,
          analysisCompleted: !!conflictAnalysis,
          hasConflicts: conflictAnalysis?.hasConflicts,
          riskLevel: conflictAnalysis?.riskLevel,
          conflictCount: conflictAnalysis?.conflicts?.length || 0,
          recommendationCount: conflictAnalysis?.recommendations?.length || 0
        }
      });
      
      if (status) {
        console.log(`   📊 Active file locks: ${status.activeLocks?.files || 0}`);
        console.log(`   🔒 Active resource locks: ${status.activeLocks?.resources || 0}`);
        console.log(`   👥 Active agents tracked: ${status.activeAgents || 0}`);
      }
      
      if (conflictAnalysis) {
        console.log(`   ⚠️  Conflicts detected: ${conflictAnalysis.hasConflicts}`);
        console.log(`   📈 Risk level: ${conflictAnalysis.riskLevel}`);
        console.log(`   🎯 Can proceed: ${conflictAnalysis.canProceed}`);
      }
      
    } catch (error) {
      this.addTestResult('Conflict Detection', {
        passed: false,
        error: error.message
      });
    }
  }
  
  /**
   * Test unlimited agent spawning capabilities
   */
  async testUnlimitedAgentSpawning() {
    console.log('\n🚀 Test 6: Unlimited Agent Spawning');
    
    try {
      const initialAgentCount = this.queen.activeAgents.size;
      const spawnedAgents = [];
      
      // Try to spawn multiple agents using discovered types
      const availableTypes = this.queen.dynamicAgentRegistry.getAgentTypes();
      const agentTypes = Array.from(availableTypes.keys()).slice(0, 3);
      
      for (let i = 0; i < 3; i++) {
        const agentType = agentTypes[i % agentTypes.length];
        const task = {
          id: `test-task-${i + 1}`,
          name: `Test Task ${i + 1}`,
          description: `Test unlimited scaling with task ${i + 1}`,
          category: 'testing'
        };
        
        try {
          const agentId = await this.queen.spawnSubAgent(agentType, task, {});
          if (agentId) {
            spawnedAgents.push(agentId);
          }
        } catch (error) {
          console.log(`   ⚠️  Failed to spawn ${agentType}: ${error.message}`);
        }
      }
      
      const finalAgentCount = this.queen.activeAgents.size;
      const agentsSpawned = finalAgentCount - initialAgentCount;
      
      this.addTestResult('Unlimited Agent Spawning', {
        passed: agentsSpawned > 0,
        details: {
          initialCount: initialAgentCount,
          finalCount: finalAgentCount,
          agentsSpawned,
          spawnedAgentIds: spawnedAgents,
          dynamicLimitRespected: finalAgentCount <= await this.queen.calculateDynamicAgentLimit()
        }
      });
      
      console.log(`   📊 Initial agents: ${initialAgentCount}`);
      console.log(`   📈 Final agents: ${finalAgentCount}`);
      console.log(`   ✨ Agents spawned: ${agentsSpawned}`);
      console.log(`   🎯 Dynamic limit respected: ${finalAgentCount <= await this.queen.calculateDynamicAgentLimit()}`);
      
      // Clean up spawned agents
      for (const agentId of spawnedAgents) {
        await this.queen.terminateAgent(agentId, 'test_cleanup');
      }
      
    } catch (error) {
      this.addTestResult('Unlimited Agent Spawning', {
        passed: false,
        error: error.message
      });
    }
  }
  
  /**
   * Test system status reporting
   */
  async testSystemStatus() {
    console.log('\n📋 Test 7: System Status Reporting');
    
    try {
      const status = this.queen.getStatus();
      const hasUnlimitedScalingInfo = !!status.unlimitedScaling;
      const hasResourceInfo = !!status.unlimitedScaling?.resourceStatus;
      const hasAgentInfo = Array.isArray(status.agents);
      
      this.addTestResult('System Status Reporting', {
        passed: hasUnlimitedScalingInfo && hasAgentInfo,
        details: {
          unlimitedScalingEnabled: status.unlimitedScaling?.enabled,
          dynamicLimit: status.unlimitedScaling?.dynamicLimit,
          agentTypesAvailable: status.unlimitedScaling?.agentTypesAvailable,
          activeAgents: status.active,
          queuedTasks: status.queued,
          completedTasks: status.completed,
          hasResourceInfo,
          hasNeuralLearningInfo: !!status.neuralLearning
        }
      });
      
      console.log(`   🔢 Active agents: ${status.active}`);
      console.log(`   📝 Queued tasks: ${status.queued}`);
      console.log(`   ✅ Completed tasks: ${status.completed}`);
      console.log(`   🎭 Agent types available: ${status.unlimitedScaling?.agentTypesAvailable || 0}`);
      console.log(`   🎯 Dynamic limit: ${status.unlimitedScaling?.dynamicLimit || 'N/A'}`);
      console.log(`   🧠 Neural learning: ${status.neuralLearning?.initialized ? 'Active' : 'Inactive'}`);
      
    } catch (error) {
      this.addTestResult('System Status Reporting', {
        passed: false,
        error: error.message
      });
    }
  }
  
  /**
   * Add test result
   */
  addTestResult(testName, result) {
    this.testResults.push({
      testName,
      passed: result.passed,
      timestamp: Date.now(),
      details: result.details || {},
      error: result.error
    });
  }
  
  /**
   * Clean up test resources
   */
  async cleanup() {
    if (this.queen) {
      try {
        await this.queen.shutdown();
        console.log('\n🧹 Cleanup completed');
      } catch (error) {
        console.warn('Cleanup warning:', error.message);
      }
    }
  }
  
  /**
   * Report test results
   */
  reportResults() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const duration = Date.now() - this.testStartTime;
    
    console.log('\n' + '='.repeat(80));
    console.log('🏁 UNLIMITED SCALING TEST RESULTS');
    console.log('='.repeat(80));
    console.log(`📊 Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    console.log('\n📋 Detailed Results:');
    this.testResults.forEach((result, index) => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${result.testName}`);
      
      if (!result.passed && result.error) {
        console.log(`   Error: ${result.error}`);
      }
      
      if (result.details && Object.keys(result.details).length > 0) {
        console.log(`   Details: ${JSON.stringify(result.details, null, 2).split('\n').join('\n   ')}`);
      }
    });
    
    if (passedTests === totalTests) {
      console.log('\n🎉 ALL TESTS PASSED! Unlimited scaling is working correctly.');
    } else {
      console.log(`\n⚠️  ${failedTests} test(s) failed. Check the details above.`);
    }
    
    console.log('\n' + '='.repeat(80));
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new UnlimitedScalingTester();
  tester.runTests().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = UnlimitedScalingTester;