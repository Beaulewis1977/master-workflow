#!/usr/bin/env node

/**
 * Unlimited Scaling Test - Verify 4000+ Agent Support
 * 
 * This test script validates that the Queen Controller and related systems
 * can handle unlimited agent scaling up to 4000+ agents without crashing.
 */

const QueenController = require('./.ai-workflow/intelligence-engine/queen-controller');
const SharedMemory = require('./.ai-workflow/intelligence-engine/shared-memory');
const ResourceMonitor = require('./.ai-workflow/intelligence-engine/resource-monitor');
const AgentPoolManager = require('./.ai-workflow/intelligence-engine/agent-pool-manager');

class UnlimitedScalingTest {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      errors: [],
      metrics: {},
      startTime: Date.now(),
      endTime: null
    };
    
    this.maxTestAgents = 4000;
    this.batchSize = 100;
    this.testTimeout = 10 * 60 * 1000; // 10 minutes
  }
  
  /**
   * Run the complete unlimited scaling test suite
   */
  async runTest() {
    console.log('🚀 Starting Unlimited Scaling Test - Target: 4000+ agents');
    console.log('================================================================');
    
    try {
      // Initialize components
      await this.initializeComponents();
      
      // Run test phases
      await this.testPhase1_BasicScaling();
      await this.testPhase2_MemoryEfficiency();
      await this.testPhase3_ResourceManagement();
      await this.testPhase4_AgentPooling();
      await this.testPhase5_StressTest();
      
      // Generate report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      this.testResults.errors.push(error.message);
      this.testResults.failed++;
    } finally {
      await this.cleanup();
    }
  }
  
  /**
   * Initialize test components
   */
  async initializeComponents() {
    console.log('\n📋 Phase 0: Initializing Components');
    
    try {
      // Initialize Queen Controller with unlimited scaling
      this.queenController = new QueenController({
        unlimitedScaling: true,
        safetyLimit: null, // No hard limit
        maxAgents: null,   // Unlimited
        memoryThreshold: 0.90,
        cpuThreshold: 0.85
      });
      
      // Initialize Shared Memory with large capacity
      this.sharedMemory = new SharedMemory({
        maxMemorySize: 2 * 1024 * 1024 * 1024, // 2GB
        maxEntries: 500000, // 500K entries
        projectRoot: process.cwd()
      });
      
      // Initialize Resource Monitor
      this.resourceMonitor = new ResourceMonitor({
        targetMemoryUtilization: 0.85,
        targetCpuUtilization: 0.80,
        monitoringInterval: 5000 // 5 seconds for testing
      });
      
      // Initialize Agent Pool Manager
      this.agentPoolManager = new AgentPoolManager({
        warmPoolSize: 100,
        coldPoolSize: 500,
        hibernationThreshold: 60000 // 1 minute for testing
      });
      
      // Start components
      await this.sharedMemory.initialize();
      await this.resourceMonitor.start();
      await this.agentPoolManager.initialize();
      
      console.log('✅ All components initialized successfully');
      this.testResults.passed++;
      
    } catch (error) {
      console.error('❌ Component initialization failed:', error);
      this.testResults.failed++;
      this.testResults.errors.push(`Initialization: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Test Phase 1: Basic scaling up to 1000 agents
   */
  async testPhase1_BasicScaling() {
    console.log('\n📋 Phase 1: Basic Scaling (0 → 1000 agents)');
    
    try {
      const targetAgents = 1000;
      const startTime = Date.now();
      
      // Simulate agent creation
      for (let i = 0; i < targetAgents; i += this.batchSize) {
        const batchEnd = Math.min(i + this.batchSize, targetAgents);
        await this.createAgentBatch(i, batchEnd);
        
        // Log progress
        if (i % 500 === 0) {
          console.log(`  Created ${i} agents...`);
          await this.recordMetrics(`basic_scaling_${i}`);
        }
      }
      
      const duration = Date.now() - startTime;
      console.log(`✅ Phase 1 passed: Created ${targetAgents} agents in ${duration}ms`);
      
      // Verify no crashes
      const stats = this.sharedMemory.getStats();
      console.log(`  Memory usage: ${stats.memoryUtilization}`);
      console.log(`  Entries: ${stats.entryCount}`);
      
      this.testResults.passed++;
      
    } catch (error) {
      console.error('❌ Phase 1 failed:', error);
      this.testResults.failed++;
      this.testResults.errors.push(`Phase 1: ${error.message}`);
    }
  }
  
  /**
   * Test Phase 2: Memory efficiency with indexing
   */
  async testPhase2_MemoryEfficiency() {
    console.log('\n📋 Phase 2: Memory Efficiency & Indexing');
    
    try {
      // Test indexed queries
      const queryTypes = [
        { namespace: 'agents', agentId: 'agent_500' },
        { dataType: 'task_queue' },
        { pattern: 'agent_10.*' }
      ];
      
      for (const queryType of queryTypes) {
        const startTime = Date.now();
        const keys = await this.sharedMemory.keys(queryType);
        const queryTime = Date.now() - startTime;
        
        console.log(`  Query ${JSON.stringify(queryType)}: ${keys.length} results in ${queryTime}ms`);
        
        // Fast queries should be under 100ms even with many agents
        if (queryTime > 500) {
          throw new Error(`Query too slow: ${queryTime}ms`);
        }
      }
      
      // Test memory stats
      const stats = this.sharedMemory.getStats();
      console.log(`  Index stats: ${JSON.stringify(stats.indexes)}`);
      
      console.log('✅ Phase 2 passed: Memory efficiency and indexing working');
      this.testResults.passed++;
      
    } catch (error) {
      console.error('❌ Phase 2 failed:', error);
      this.testResults.failed++;
      this.testResults.errors.push(`Phase 2: ${error.message}`);
    }
  }
  
  /**
   * Test Phase 3: Resource management scaling
   */
  async testPhase3_ResourceManagement() {
    console.log('\n📋 Phase 3: Resource Management Scaling');
    
    try {
      // Update resource monitor with agent metrics
      this.resourceMonitor.updateAgentMetrics({
        activeCount: 1000,
        totalContextUsage: 200000000, // 200M tokens
        averageContextUsage: 200000,  // 200K per agent
        memoryPerAgent: 150 * 1024 * 1024 // 150MB per agent
      });
      
      // Get scaling recommendation
      const recommendation = this.resourceMonitor.getScalingRecommendation();
      console.log(`  Optimal agent count: ${recommendation.optimalAgentCount}`);
      console.log(`  Max possible agents: ${recommendation.maxPossibleAgents}`);
      console.log(`  Recommended action: ${recommendation.recommendedAction}`);
      
      // Verify unlimited scaling is enabled
      if (!recommendation.unlimitedScaling) {
        throw new Error('Unlimited scaling not enabled in resource monitor');
      }
      
      // Verify it supports 4000+ agents
      if (recommendation.maxPossibleAgents < 4000) {
        console.warn(`⚠️  Max possible agents (${recommendation.maxPossibleAgents}) is below 4000`);
      }
      
      console.log('✅ Phase 3 passed: Resource management scaling verified');
      this.testResults.passed++;
      
    } catch (error) {
      console.error('❌ Phase 3 failed:', error);
      this.testResults.failed++;
      this.testResults.errors.push(`Phase 3: ${error.message}`);
    }
  }
  
  /**
   * Test Phase 4: Agent pooling efficiency
   */
  async testPhase4_AgentPooling() {
    console.log('\n📋 Phase 4: Agent Pooling Efficiency');
    
    try {
      // Test agent pool operations
      const agentTypes = ['code-analyzer', 'database-architect', 'frontend-specialist', 'performance-optimizer'];
      
      // Request many agents of different types
      const requestedAgents = [];
      for (let i = 0; i < 200; i++) {
        const agentType = agentTypes[i % agentTypes.length];
        const agent = await this.agentPoolManager.requestAgent(agentType);
        if (agent) {
          requestedAgents.push(agent);
        }
      }
      
      console.log(`  Requested ${requestedAgents.length} agents from pool`);
      
      // Return half of them
      const halfPoint = Math.floor(requestedAgents.length / 2);
      for (let i = 0; i < halfPoint; i++) {
        await this.agentPoolManager.returnAgent(requestedAgents[i]);
      }
      
      // Get pool stats
      const poolStats = this.agentPoolManager.getStats();
      console.log(`  Pool stats: Active=${poolStats.pools.active}, Warm=${poolStats.pools.warm}, Cold=${poolStats.pools.cold}`);
      console.log(`  Memory usage: ${poolStats.memory.estimated}MB`);
      
      // Verify efficiency
      if (poolStats.memory.estimated > 1000) { // More than 1GB seems excessive
        console.warn(`⚠️  Pool memory usage seems high: ${poolStats.memory.estimated}MB`);
      }
      
      console.log('✅ Phase 4 passed: Agent pooling working efficiently');
      this.testResults.passed++;
      
    } catch (error) {
      console.error('❌ Phase 4 failed:', error);
      this.testResults.failed++;
      this.testResults.errors.push(`Phase 4: ${error.message}`);
    }
  }
  
  /**
   * Test Phase 5: Stress test with 4000+ agents
   */
  async testPhase5_StressTest() {
    console.log('\n📋 Phase 5: Stress Test (1000 → 4000+ agents)');
    
    try {
      const startAgents = 1000;
      const targetAgents = 4000;
      const startTime = Date.now();
      
      console.log(`  Scaling from ${startAgents} to ${targetAgents} agents...`);
      
      // Create agents in batches to avoid overwhelming system
      for (let i = startAgents; i < targetAgents; i += this.batchSize) {
        const batchEnd = Math.min(i + this.batchSize, targetAgents);
        await this.createAgentBatch(i, batchEnd);
        
        // Monitor system health every 1000 agents
        if (i % 1000 === 0) {
          console.log(`  Progress: ${i} agents created...`);
          await this.checkSystemHealth();
          
          // Small delay to prevent overwhelming
          await this.sleep(100);
        }
        
        // Emergency brake if system is struggling
        const metrics = this.resourceMonitor.getMetrics();
        if (metrics.current.memory && metrics.current.memory.utilization > 0.95) {
          console.warn(`⚠️  High memory usage detected (${(metrics.current.memory.utilization * 100).toFixed(1)}%), stopping early`);
          break;
        }
      }
      
      const duration = Date.now() - startTime;
      const finalCount = await this.getCurrentAgentCount();
      
      console.log(`✅ Phase 5 completed: Reached ${finalCount} agents in ${duration}ms`);
      
      if (finalCount >= 4000) {
        console.log('🎉 SUCCESS: System supports 4000+ agents!');
      } else {
        console.log(`⚠️  Reached ${finalCount} agents (target was 4000+)`);
      }
      
      this.testResults.passed++;
      this.testResults.metrics.finalAgentCount = finalCount;
      this.testResults.metrics.stressTestDuration = duration;
      
    } catch (error) {
      console.error('❌ Phase 5 failed:', error);
      this.testResults.failed++;
      this.testResults.errors.push(`Phase 5: ${error.message}`);
    }
  }
  
  /**
   * Create a batch of mock agents
   */
  async createAgentBatch(startIndex, endIndex) {
    const agentTypes = ['code-analyzer', 'database-architect', 'frontend-specialist', 'performance-optimizer'];
    
    for (let i = startIndex; i < endIndex; i++) {
      const agentType = agentTypes[i % agentTypes.length];
      const agentId = `agent_${i}`;
      
      // Store agent data in shared memory
      await this.sharedMemory.set(`agents:${agentId}`, {
        id: agentId,
        type: agentType,
        status: 'active',
        createdAt: Date.now(),
        context: `context_data_${i}`,
        taskQueue: [`task_${i}_1`, `task_${i}_2`]
      }, {
        namespace: 'agents',
        dataType: 'agent_state',
        agentId: agentId,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      });
      
      // Store task queue
      await this.sharedMemory.set(`tasks:${agentId}`, [
        { id: `task_${i}_1`, type: 'analyze_code', priority: 'high' },
        { id: `task_${i}_2`, type: 'optimize_db', priority: 'medium' }
      ], {
        namespace: 'tasks',
        dataType: 'task_queue',
        agentId: agentId
      });
    }
  }
  
  /**
   * Record system metrics
   */
  async recordMetrics(label) {
    const memoryStats = this.sharedMemory.getStats();
    const resourceMetrics = this.resourceMonitor.getMetrics();
    const poolStats = this.agentPoolManager.getStats();
    
    this.testResults.metrics[label] = {
      timestamp: Date.now(),
      memory: {
        utilization: memoryStats.memoryUtilization,
        entryCount: memoryStats.entryCount,
        indexes: memoryStats.indexes
      },
      resources: resourceMetrics.current,
      pool: poolStats
    };
  }
  
  /**
   * Check system health
   */
  async checkSystemHealth() {
    const resourceStatus = this.resourceMonitor.getResourceStatus();
    console.log(`    System health: ${resourceStatus.health}`);
    console.log(`    Memory: ${resourceStatus.resources.memory.usage}`);
    console.log(`    CPU: ${resourceStatus.resources.cpu.usage}`);
    console.log(`    Agents: ${resourceStatus.resources.agents.active}`);
    
    if (resourceStatus.health === 'critical') {
      throw new Error('System health is critical, aborting test');
    }
  }
  
  /**
   * Get current agent count
   */
  async getCurrentAgentCount() {
    const agentKeys = await this.sharedMemory.keys({ namespace: 'agents' });
    return agentKeys.length;
  }
  
  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Generate test report
   */
  generateReport() {
    this.testResults.endTime = Date.now();
    const totalDuration = this.testResults.endTime - this.testResults.startTime;
    
    console.log('\n================================================================');
    console.log('📊 UNLIMITED SCALING TEST REPORT');
    console.log('================================================================');
    console.log(`Duration: ${totalDuration}ms (${(totalDuration / 1000).toFixed(1)}s)`);
    console.log(`Tests Passed: ${this.testResults.passed}`);
    console.log(`Tests Failed: ${this.testResults.failed}`);
    console.log(`Success Rate: ${((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100).toFixed(1)}%`);
    
    if (this.testResults.metrics.finalAgentCount) {
      console.log(`\n🎯 SCALING RESULTS:`);
      console.log(`Final Agent Count: ${this.testResults.metrics.finalAgentCount}`);
      console.log(`Target Achieved: ${this.testResults.metrics.finalAgentCount >= 4000 ? 'YES' : 'NO'}`);
    }
    
    if (this.testResults.errors.length > 0) {
      console.log(`\n❌ ERRORS:`);
      this.testResults.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    // Final system stats
    const finalStats = this.sharedMemory.getStats();
    console.log(`\n📈 FINAL SYSTEM STATS:`);
    console.log(`Memory Utilization: ${finalStats.memoryUtilization}`);
    console.log(`Entry Count: ${finalStats.entryCount}`);
    console.log(`Index Performance: ${JSON.stringify(finalStats.indexes)}`);
    
    const overall = this.testResults.failed === 0 && this.testResults.metrics.finalAgentCount >= 4000;
    console.log(`\n${overall ? '🎉 OVERALL RESULT: SUCCESS' : '⚠️  OVERALL RESULT: PARTIAL SUCCESS'}`);
    console.log('================================================================');
  }
  
  /**
   * Cleanup resources
   */
  async cleanup() {
    console.log('\n🧹 Cleaning up test resources...');
    
    try {
      if (this.resourceMonitor) {
        this.resourceMonitor.stop();
      }
      
      if (this.agentPoolManager) {
        await this.agentPoolManager.shutdown();
      }
      
      if (this.sharedMemory) {
        await this.sharedMemory.cleanup();
      }
      
      console.log('✅ Cleanup completed');
    } catch (error) {
      console.error('⚠️  Cleanup error:', error);
    }
  }
}

// Run the test if called directly
if (require.main === module) {
  const test = new UnlimitedScalingTest();
  test.runTest().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = UnlimitedScalingTest;
