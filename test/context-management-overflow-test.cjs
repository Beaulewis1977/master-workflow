#!/usr/bin/env node

/**
 * Context Management and Overflow Protection Test Suite
 * 
 * Tests the system's ability to handle context overflow scenarios and
 * implement intelligent context management strategies including:
 * - Context window overflow detection and prevention
 * - Intelligent context pruning and prioritization
 * - Context compression and optimization
 * - Multi-agent context synchronization
 */

const fs = require('fs').promises;
const path = require('path');
const { performance } = require('perf_hooks');

class ContextManagementOverflowTest {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.testResults = [];
    this.maxContextSize = 200000; // 200k tokens
    this.warningThreshold = 0.8; // 80% of max context
    this.criticalThreshold = 0.95; // 95% of max context
  }

  /**
   * Test context overflow detection and prevention
   */
  async testContextOverflowDetectionPrevention() {
    const testName = "Context Overflow Detection and Prevention";
    const startTime = performance.now();
    
    try {
      // Initialize Queen Controller with overflow protection
      const queenControllerPath = path.join(this.projectRoot, 'intelligence-engine', 'queen-controller.js');
      const { QueenController } = require(queenControllerPath);
      
      const queen = new QueenController({
        maxConcurrent: 3,
        contextWindowSize: this.maxContextSize,
        overflowProtection: true,
        contextMonitoring: true
      });
      
      await queen.initialize();
      
      // Spawn test agent with context overflow monitoring
      const testAgent = await queen.spawnAgent('overflow-test-agent', {
        contextWindow: this.maxContextSize,
        overflowProtection: true,
        monitorContextUsage: true
      });
      
      if (!testAgent) {
        throw new Error('Failed to spawn test agent');
      }
      
      // Test 1: Gradual context buildup to warning threshold
      let currentContextSize = 0;
      const contextBuildupSteps = [];
      
      while (currentContextSize < this.maxContextSize * this.warningThreshold) {
        const contextChunk = this.generateContextChunk(15000); // ~15k tokens
        const addResult = await queen.addContextToAgent(testAgent.id, contextChunk);
        
        if (addResult) {
          currentContextSize += contextChunk.estimatedTokens;
          contextBuildupSteps.push({
            step: contextBuildupSteps.length + 1,
            contextSize: currentContextSize,
            percentage: (currentContextSize / this.maxContextSize) * 100,
            warningTriggered: addResult.warningTriggered || false
          });
        }
      }
      
      // Verify warning threshold detection
      const warningTriggered = contextBuildupSteps.some(step => step.warningTriggered);
      
      if (!warningTriggered && currentContextSize > this.maxContextSize * this.warningThreshold) {
        throw new Error('Warning threshold not properly detected');
      }
      
      // Test 2: Approach critical threshold and verify prevention
      const criticalTestChunk = this.generateContextChunk(25000); // ~25k tokens
      const criticalAddResult = await queen.addContextToAgent(testAgent.id, criticalTestChunk);
      
      // Should trigger overflow prevention
      if (!criticalAddResult || !criticalAddResult.overflowPrevented) {
        throw new Error('Overflow prevention not triggered at critical threshold');
      }
      
      // Test 3: Verify agent context integrity
      const finalContextState = await queen.getAgentContextState(testAgent.id);
      
      if (!finalContextState || finalContextState.corrupted) {
        throw new Error('Agent context integrity compromised');
      }
      
      const duration = performance.now() - startTime;
      this.logSuccess(testName, duration, {
        buildupSteps: contextBuildupSteps.length,
        maxContextReached: Math.max(...contextBuildupSteps.map(s => s.percentage)),
        warningTriggered: warningTriggered,
        overflowPrevented: criticalAddResult?.overflowPrevented || false,
        contextIntegrityMaintained: !finalContextState?.corrupted
      });
      
      return true;
      
    } catch (error) {
      const duration = performance.now() - startTime;
      this.logError(testName, error, duration);
      return false;
    }
  }

  /**
   * Test intelligent context pruning and prioritization
   */
  async testIntelligentContextPruning() {
    const testName = "Intelligent Context Pruning and Prioritization";
    const startTime = performance.now();
    
    try {
      const queenControllerPath = path.join(this.projectRoot, 'intelligence-engine', 'queen-controller.js');
      const { QueenController } = require(queenControllerPath);
      
      const queen = new QueenController({
        maxConcurrent: 2,
        contextWindowSize: this.maxContextSize,
        intelligentPruning: true,
        contextPrioritization: true
      });
      
      await queen.initialize();
      
      const pruningAgent = await queen.spawnAgent('pruning-test-agent', {
        contextWindow: this.maxContextSize,
        intelligentPruning: true
      });
      
      if (!pruningAgent) {
        throw new Error('Failed to spawn pruning test agent');
      }
      
      // Create context with different priorities
      const contextItems = [
        { type: 'core-logic', content: 'a'.repeat(20000), priority: 'high', lastAccessed: Date.now() },
        { type: 'utility-functions', content: 'b'.repeat(15000), priority: 'medium', lastAccessed: Date.now() - 300000 },
        { type: 'test-data', content: 'c'.repeat(30000), priority: 'low', lastAccessed: Date.now() - 600000 },
        { type: 'documentation', content: 'd'.repeat(25000), priority: 'low', lastAccessed: Date.now() - 900000 },
        { type: 'api-specs', content: 'e'.repeat(18000), priority: 'high', lastAccessed: Date.now() - 60000 },
        { type: 'config-files', content: 'f'.repeat(12000), priority: 'medium', lastAccessed: Date.now() - 120000 }
      ];
      
      // Add all context items to reach near-capacity
      for (const item of contextItems) {
        await queen.addContextToAgent(pruningAgent.id, item);
      }
      
      // Verify context is near capacity
      const contextState = await queen.getAgentContextState(pruningAgent.id);
      
      if (contextState.utilizationPercentage < 85) {
        throw new Error('Context not sufficiently filled for pruning test');
      }
      
      // Trigger intelligent pruning by adding more high-priority content
      const newHighPriorityContent = {
        type: 'critical-update',
        content: 'g'.repeat(40000),
        priority: 'critical',
        lastAccessed: Date.now()
      };
      
      const pruningResult = await queen.addContextToAgent(pruningAgent.id, newHighPriorityContent, {
        allowPruning: true,
        intelligentPruning: true
      });
      
      if (!pruningResult || !pruningResult.pruningPerformed) {
        throw new Error('Intelligent pruning was not performed');
      }
      
      // Verify pruning logic - low priority, old items should be removed first
      const finalContextState = await queen.getAgentContextState(pruningAgent.id);
      const remainingItems = finalContextState.items || [];
      
      const highPriorityRetained = remainingItems.filter(item => 
        item.priority === 'high' || item.priority === 'critical'
      ).length;
      
      const lowPriorityRetained = remainingItems.filter(item => 
        item.priority === 'low'
      ).length;
      
      // High priority items should be retained more than low priority
      if (highPriorityRetained <= lowPriorityRetained) {
        throw new Error('Intelligent pruning did not properly prioritize content');
      }
      
      // Verify critical content was added
      const criticalContentPresent = remainingItems.some(item => 
        item.type === 'critical-update'
      );
      
      if (!criticalContentPresent) {
        throw new Error('Critical content not properly added after pruning');
      }
      
      const duration = performance.now() - startTime;
      this.logSuccess(testName, duration, {
        originalItems: contextItems.length,
        itemsAfterPruning: remainingItems.length,
        highPriorityRetained: highPriorityRetained,
        lowPriorityRetained: lowPriorityRetained,
        pruningPerformed: pruningResult?.pruningPerformed || false,
        criticalContentAdded: criticalContentPresent
      });
      
      return true;
      
    } catch (error) {
      const duration = performance.now() - startTime;
      this.logError(testName, error, duration);
      return false;
    }
  }

  /**
   * Test context compression and optimization
   */
  async testContextCompressionOptimization() {
    const testName = "Context Compression and Optimization";
    const startTime = performance.now();
    
    try {
      const queenControllerPath = path.join(this.projectRoot, 'intelligence-engine', 'queen-controller.js');
      const { QueenController } = require(queenControllerPath);
      
      const queen = new QueenController({
        maxConcurrent: 2,
        contextWindowSize: this.maxContextSize,
        contextCompression: true,
        contextOptimization: true
      });
      
      await queen.initialize();
      
      const compressionAgent = await queen.spawnAgent('compression-test-agent', {
        contextWindow: this.maxContextSize,
        compressionEnabled: true
      });
      
      if (!compressionAgent) {
        throw new Error('Failed to spawn compression test agent');
      }
      
      // Create compressible context content
      const compressibleContent = {
        // Repetitive code patterns
        repeatedFunctions: 'function test() { console.log("test"); }\n'.repeat(500),
        // Similar JSON structures
        jsonData: JSON.stringify({
          users: new Array(100).fill(0).map((_, i) => ({
            id: i,
            name: `User${i}`,
            email: `user${i}@example.com`,
            status: 'active'
          }))
        }),
        // Repetitive documentation
        documentation: 'This function handles user authentication and validation. '.repeat(200),
        // Similar configuration files
        configs: JSON.stringify({
          environments: {
            dev: { apiUrl: 'dev-api.example.com', debug: true },
            staging: { apiUrl: 'staging-api.example.com', debug: false },
            prod: { apiUrl: 'api.example.com', debug: false }
          }
        }),
        type: 'compressible-content',
        priority: 'medium'
      };
      
      // Measure original size
      const originalSize = JSON.stringify(compressibleContent).length;
      
      // Add content with compression
      const compressionResult = await queen.addContextToAgent(compressionAgent.id, compressibleContent, {
        enableCompression: true,
        compressionStrategy: 'intelligent'
      });
      
      if (!compressionResult) {
        throw new Error('Failed to add content with compression');
      }
      
      // Verify compression occurred
      if (!compressionResult.compressionApplied) {
        throw new Error('Compression was not applied to compressible content');
      }
      
      const compressionRatio = compressionResult.compressedSize / originalSize;
      
      if (compressionRatio > 0.8) { // Expect at least 20% compression
        throw new Error(`Insufficient compression achieved: ${(compressionRatio * 100).toFixed(1)}%`);
      }
      
      // Test context retrieval and decompression
      const retrievedContext = await queen.getAgentContext(compressionAgent.id);
      
      if (!retrievedContext) {
        throw new Error('Failed to retrieve compressed context');
      }
      
      // Verify decompression integrity
      const decompressedContent = retrievedContext.items.find(item => 
        item.type === 'compressible-content'
      );
      
      if (!decompressedContent) {
        throw new Error('Compressed content not found after retrieval');
      }
      
      // Test optimization features
      const optimizationResult = await queen.optimizeAgentContext(compressionAgent.id, {
        removeRedundancy: true,
        consolidateSimilar: true,
        updateIndexing: true
      });
      
      if (!optimizationResult || !optimizationResult.optimizationApplied) {
        throw new Error('Context optimization was not applied');
      }
      
      const duration = performance.now() - startTime;
      this.logSuccess(testName, duration, {
        originalSize: originalSize,
        compressedSize: compressionResult.compressedSize,
        compressionRatio: (compressionRatio * 100).toFixed(1) + '%',
        compressionApplied: compressionResult.compressionApplied,
        optimizationApplied: optimizationResult?.optimizationApplied || false,
        contentIntegrityMaintained: !!decompressedContent
      });
      
      return true;
      
    } catch (error) {
      const duration = performance.now() - startTime;
      this.logError(testName, error, duration);
      return false;
    }
  }

  /**
   * Test multi-agent context synchronization
   */
  async testMultiAgentContextSynchronization() {
    const testName = "Multi-Agent Context Synchronization";
    const startTime = performance.now();
    
    try {
      const queenControllerPath = path.join(this.projectRoot, 'intelligence-engine', 'queen-controller.js');
      const { QueenController } = require(queenControllerPath);
      
      const queen = new QueenController({
        maxConcurrent: 4,
        contextWindowSize: this.maxContextSize,
        contextSynchronization: true,
        sharedContextEnabled: true
      });
      
      await queen.initialize();
      
      // Spawn multiple agents for synchronization testing
      const syncAgents = [];
      
      for (let i = 0; i < 4; i++) {
        const agent = await queen.spawnAgent(`sync-agent-${i}`, {
          contextWindow: this.maxContextSize,
          contextSyncEnabled: true,
          sharedContextAccess: true
        });
        
        if (agent) {
          syncAgents.push(agent);
        }
      }
      
      if (syncAgents.length < 3) {
        throw new Error('Failed to spawn required agents for synchronization test');
      }
      
      // Test 1: Shared context creation and propagation
      const sharedContext = {
        projectInfo: {
          name: 'sync-test-project',
          version: '1.0.0',
          description: 'Testing context synchronization across agents'
        },
        codebase: {
          files: ['index.js', 'utils.js', 'config.js'],
          totalLines: 1500,
          lastUpdate: new Date().toISOString()
        },
        type: 'shared-context',
        syncRequired: true
      };
      
      // Add shared context to first agent
      const sharedContextResult = await queen.addSharedContext(syncAgents[0].id, sharedContext, {
        syncToAgents: syncAgents.slice(1).map(a => a.id),
        immediateSync: true
      });
      
      if (!sharedContextResult || !sharedContextResult.syncInitiated) {
        throw new Error('Shared context synchronization was not initiated');
      }
      
      // Wait for synchronization to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify synchronization across all agents
      const syncVerifications = [];
      
      for (const agent of syncAgents.slice(1)) {
        const agentContext = await queen.getAgentContext(agent.id);
        const hasSyncedContent = agentContext?.items?.some(item => 
          item.type === 'shared-context' && item.projectInfo?.name === 'sync-test-project'
        );
        
        syncVerifications.push({
          agentId: agent.id,
          syncedCorrectly: hasSyncedContent
        });
      }
      
      const successfulSyncs = syncVerifications.filter(v => v.syncedCorrectly).length;
      
      if (successfulSyncs < 2) {
        throw new Error(`Context synchronization failed: ${successfulSyncs}/${syncVerifications.length} agents`);
      }
      
      // Test 2: Context conflict resolution during sync
      const conflictingUpdates = [
        { agentId: syncAgents[0].id, update: { version: '1.1.0', updatedBy: 'agent-0' } },
        { agentId: syncAgents[1].id, update: { version: '1.0.1', updatedBy: 'agent-1' } }
      ];
      
      // Apply conflicting updates simultaneously
      const conflictPromises = conflictingUpdates.map(({ agentId, update }) =>
        queen.updateSharedContext(agentId, 'sync-test-project', update, {
          handleConflicts: true
        })
      );
      
      const conflictResults = await Promise.all(conflictPromises);
      
      // Test conflict resolution
      const conflictResolution = await queen.resolveContextConflicts({
        strategy: 'merge-with-timestamp',
        notifyAllAgents: true
      });
      
      if (!conflictResolution || !conflictResolution.resolved) {
        throw new Error('Context conflict resolution failed');
      }
      
      // Test 3: Context synchronization with overflow protection
      const largeSharedUpdate = this.generateContextChunk(50000); // Large update
      largeSharedUpdate.type = 'large-shared-update';
      largeSharedUpdate.syncRequired = true;
      
      const largeSyncResult = await queen.addSharedContext(syncAgents[0].id, largeSharedUpdate, {
        syncToAgents: syncAgents.slice(1).map(a => a.id),
        overflowProtection: true,
        prioritizeSync: true
      });
      
      // Should handle overflow during sync
      const syncWithOverflowProtection = largeSyncResult && 
        (largeSyncResult.syncCompleted || largeSyncResult.partialSync);
      
      const duration = performance.now() - startTime;
      this.logSuccess(testName, duration, {
        agentCount: syncAgents.length,
        successfulSyncs: successfulSyncs,
        conflictResolutionWorked: conflictResolution?.resolved || false,
        overflowProtectionDuringSync: syncWithOverflowProtection
      });
      
      return true;
      
    } catch (error) {
      const duration = performance.now() - startTime;
      this.logError(testName, error, duration);
      return false;
    }
  }

  /**
   * Test context window utilization optimization
   */
  async testContextWindowUtilizationOptimization() {
    const testName = "Context Window Utilization Optimization";
    const startTime = performance.now();
    
    try {
      const queenControllerPath = path.join(this.projectRoot, 'intelligence-engine', 'queen-controller.js');
      const { QueenController } = require(queenControllerPath);
      
      const queen = new QueenController({
        maxConcurrent: 3,
        contextWindowSize: this.maxContextSize,
        utilizationOptimization: true,
        adaptiveContextManagement: true
      });
      
      await queen.initialize();
      
      const optimizationAgent = await queen.spawnAgent('optimization-agent', {
        contextWindow: this.maxContextSize,
        adaptiveManagement: true
      });
      
      if (!optimizationAgent) {
        throw new Error('Failed to spawn optimization test agent');
      }
      
      // Create various types of context content
      const contextTypes = [
        { name: 'active-code', frequency: 'high', size: 20000 },
        { name: 'reference-docs', frequency: 'medium', size: 30000 },
        { name: 'legacy-code', frequency: 'low', size: 25000 },
        { name: 'test-fixtures', frequency: 'low', size: 15000 },
        { name: 'current-task', frequency: 'very-high', size: 35000 }
      ];
      
      const utilizationSteps = [];
      
      // Add content and track utilization optimization
      for (const contextType of contextTypes) {
        const content = this.generateContextChunk(contextType.size);
        content.type = contextType.name;
        content.accessFrequency = contextType.frequency;
        content.lastAccessed = Date.now();
        
        const addResult = await queen.addContextToAgent(optimizationAgent.id, content, {
          trackUtilization: true,
          optimizeAfterAdd: true
        });
        
        if (addResult) {
          utilizationSteps.push({
            contentType: contextType.name,
            utilizationBefore: addResult.utilizationBefore || 0,
            utilizationAfter: addResult.utilizationAfter || 0,
            optimizationApplied: addResult.optimizationApplied || false
          });
        }
      }
      
      // Test utilization analysis
      const utilizationAnalysis = await queen.analyzeContextUtilization(optimizationAgent.id);
      
      if (!utilizationAnalysis) {
        throw new Error('Context utilization analysis failed');
      }
      
      // Verify optimization strategies were applied
      const optimizationStrategies = utilizationAnalysis.appliedStrategies || [];
      const expectedStrategies = ['frequency-based-prioritization', 'size-optimization', 'access-pattern-optimization'];
      
      const appliedExpectedStrategies = expectedStrategies.filter(strategy =>
        optimizationStrategies.includes(strategy)
      ).length;
      
      if (appliedExpectedStrategies < 2) {
        throw new Error('Insufficient optimization strategies applied');
      }
      
      // Test adaptive context management
      const adaptiveTest = await queen.testAdaptiveContextManagement(optimizationAgent.id, {
        simulateHighLoad: true,
        simulateMemoryPressure: true,
        duration: 2000 // 2 seconds
      });
      
      if (!adaptiveTest || !adaptiveTest.adapted) {
        throw new Error('Adaptive context management did not respond to load conditions');
      }
      
      const duration = performance.now() - startTime;
      this.logSuccess(testName, duration, {
        contextTypesAdded: contextTypes.length,
        optimizationSteps: utilizationSteps.length,
        strategiesApplied: appliedExpectedStrategies,
        utilizationImproved: utilizationAnalysis.utilizationImproved || false,
        adaptiveManagementWorked: adaptiveTest?.adapted || false
      });
      
      return true;
      
    } catch (error) {
      const duration = performance.now() - startTime;
      this.logError(testName, error, duration);
      return false;
    }
  }

  /**
   * Generate a context chunk with specified size
   */
  generateContextChunk(sizeInTokens) {
    const avgCharsPerToken = 4; // Rough estimate
    const contentSize = sizeInTokens * avgCharsPerToken;
    
    return {
      content: 'x'.repeat(contentSize),
      metadata: {
        generatedAt: new Date().toISOString(),
        estimatedTokens: sizeInTokens,
        contentType: 'test-data'
      },
      estimatedTokens: sizeInTokens
    };
  }

  /**
   * Log successful test result
   */
  logSuccess(testName, duration, details = {}) {
    this.testResults.push({
      name: testName,
      success: true,
      duration: duration,
      details: details,
      timestamp: new Date().toISOString()
    });
    
    console.log(`✅ ${testName} (${duration.toFixed(2)}ms)`);
  }

  /**
   * Log failed test result
   */
  logError(testName, error, duration) {
    this.testResults.push({
      name: testName,
      success: false,
      error: error.message,
      duration: duration,
      timestamp: new Date().toISOString()
    });
    
    console.log(`❌ ${testName}: ${error.message} (${duration.toFixed(2)}ms)`);
  }

  /**
   * Run all context management tests
   */
  async runAllTests() {
    console.log('🧠 Running Context Management and Overflow Protection Tests\n');
    
    const tests = [
      () => this.testContextOverflowDetectionPrevention(),
      () => this.testIntelligentContextPruning(),
      () => this.testContextCompressionOptimization(),
      () => this.testMultiAgentContextSynchronization(),
      () => this.testContextWindowUtilizationOptimization()
    ];
    
    for (const test of tests) {
      await test();
    }
    
    const passed = this.testResults.filter(r => r.success).length;
    const total = this.testResults.length;
    
    console.log(`\n📊 Context Management Tests Complete: ${passed}/${total} passed`);
    
    return {
      passed,
      total,
      results: this.testResults
    };
  }
}

module.exports = ContextManagementOverflowTest;

// Run tests if executed directly
if (require.main === module) {
  const contextTest = new ContextManagementOverflowTest();
  contextTest.runAllTests()
    .then(results => {
      process.exit(results.passed === results.total ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Context management tests failed:', error);
      process.exit(1);
    });
}