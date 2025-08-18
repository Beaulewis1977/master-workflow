#!/usr/bin/env node

/**
 * Phase 6 Neural Integration Test Suite
 * Tests the integration between Queen Controller and Neural Learning System
 */

const QueenController = require('./queen-controller');
const SharedMemoryStore = require('./shared-memory');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_PROJECT_ROOT = path.join(__dirname, '..', 'test-data');
const NEURAL_DATA_PATH = path.join(TEST_PROJECT_ROOT, '.hive-mind', 'neural-data');

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  details: []
};

function logTest(testName, passed, details) {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${testName}`);
  
  if (details) {
    console.log(`    ${details}`);
  }
  
  testResults.details.push({ testName, passed, details });
  
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

async function setupTestEnvironment() {
  // Create test directories
  const dirs = [
    TEST_PROJECT_ROOT,
    path.join(TEST_PROJECT_ROOT, '.hive-mind'),
    NEURAL_DATA_PATH
  ];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  console.log('Test environment setup complete');
}

async function cleanupTestEnvironment() {
  try {
    if (fs.existsSync(NEURAL_DATA_PATH)) {
      fs.rmSync(NEURAL_DATA_PATH, { recursive: true, force: true });
    }
  } catch (error) {
    console.warn('Cleanup warning:', error.message);
  }
}

async function testQueenControllerNeuralInitialization() {
  console.log('\n🧠 Testing Queen Controller Neural Initialization...');
  
  try {
    const sharedMemory = new SharedMemoryStore({
      projectRoot: TEST_PROJECT_ROOT
    });

    // Wait for initialization to complete
    await new Promise((resolve, reject) => {
      sharedMemory.once('ready', resolve);
      sharedMemory.once('error', reject);
      setTimeout(resolve, 2000); // Fallback timeout
    });

    const queenController = new QueenController({
      projectRoot: TEST_PROJECT_ROOT,
      sharedMemory: sharedMemory,
      maxConcurrent: 5
    });

    // Wait for initialization to complete
    await new Promise((resolve) => {
      queenController.once('neural-learning-ready', resolve);
      // Fallback timeout
      setTimeout(resolve, 3000);
    });

    const status = queenController.getStatus();
    
    logTest(
      'Neural Learning System Integration',
      status.neuralLearning && status.neuralLearning.initialized,
      `Initialized: ${status.neuralLearning?.initialized}, WASM: ${status.neuralLearning?.wasmEnabled}`
    );

    logTest(
      'Neural Learning System Methods Available',
      typeof queenController.selectOptimalAgent === 'function' &&
      typeof queenController.recordTaskOutcome === 'function' &&
      typeof queenController.getPredictedSuccess === 'function',
      'All required methods are present'
    );

    await queenController.shutdown();
    await sharedMemory.shutdown();

  } catch (error) {
    logTest('Neural Learning System Integration', false, error.message);
  }
}

async function testNeuralAgentSelection() {
  console.log('\n🎯 Testing Neural Agent Selection...');
  
  try {
    const sharedMemory = new SharedMemoryStore({
      projectRoot: TEST_PROJECT_ROOT
    });

    // Wait for initialization to complete
    await new Promise((resolve, reject) => {
      sharedMemory.once('ready', resolve);
      sharedMemory.once('error', reject);
      setTimeout(resolve, 2000); // Fallback timeout
    });

    const queenController = new QueenController({
      projectRoot: TEST_PROJECT_ROOT,
      sharedMemory: sharedMemory,
      maxConcurrent: 5
    });

    // Wait for neural system to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));

    const testTask = {
      id: 'test-task-1',
      name: 'Test Code Analysis',
      description: 'Analyze JavaScript code for patterns and issues',
      category: 'analysis',
      complexity: 7,
      estimatedDuration: 30000,
      projectSize: 15000,
      language: 'javascript',
      projectType: 'web'
    };

    const selection = await queenController.selectOptimalAgent(testTask);

    logTest(
      'Neural Agent Selection Returns Valid Result',
      selection && selection.agentType && selection.reasoning,
      `Agent: ${selection.agentType}, Success Prob: ${selection.reasoning?.successProbability?.toFixed(3)}`
    );

    logTest(
      'Agent Selection Includes Predictions',
      selection.prediction !== null || selection.reasoning.fallback === true,
      selection.reasoning.fallback ? 'Used fallback method' : 'Neural predictions available'
    );

    await queenController.shutdown();
    await sharedMemory.shutdown();

  } catch (error) {
    logTest('Neural Agent Selection', false, error.message);
  }
}

async function testTaskOutcomeRecording() {
  console.log('\n📊 Testing Task Outcome Recording...');
  
  try {
    const sharedMemory = new SharedMemoryStore({
      projectRoot: TEST_PROJECT_ROOT
    });

    // Wait for initialization to complete
    await new Promise((resolve, reject) => {
      sharedMemory.once('ready', resolve);
      sharedMemory.once('error', reject);
      setTimeout(resolve, 2000); // Fallback timeout
    });

    const queenController = new QueenController({
      projectRoot: TEST_PROJECT_ROOT,
      sharedMemory: sharedMemory,
      maxConcurrent: 5
    });

    // Wait for neural system to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate an agent with a task
    const testAgent = {
      id: 'test-agent-1',
      type: 'code-analyzer',
      task: {
        id: 'test-task-outcome',
        category: 'analysis',
        complexity: 6,
        projectSize: 12000,
        language: 'javascript',
        projectType: 'web'
      },
      startTime: Date.now() - 45000,
      tokenUsage: 25000,
      status: 'completed'
    };

    queenController.subAgents.set(testAgent.id, testAgent);

    const outcome = {
      success: true,
      quality: 0.9,
      userRating: 4.5,
      errors: [],
      optimizationPotential: 0.7
    };

    const metrics = {
      duration: 45000,
      cpuUsage: 0.4,
      memoryUsage: 0.3,
      userInteractions: 2
    };

    const learningResult = await queenController.recordTaskOutcome(
      testAgent.task.id,
      outcome,
      metrics
    );

    logTest(
      'Task Outcome Recording',
      learningResult && learningResult.pattern,
      `Pattern recorded: ${learningResult?.pattern?.id}, Queue size: ${learningResult?.trainingQueueSize}`
    );

    // Test shared memory integration
    const globalMetrics = await sharedMemory.get('global_neural_metrics', {
      namespace: sharedMemory.namespaces.CROSS_AGENT
    });

    logTest(
      'Shared Memory Neural Metrics',
      globalMetrics && globalMetrics.totalLearned > 0,
      `Total learned: ${globalMetrics?.totalLearned}, Success rate: ${globalMetrics?.successRate?.toFixed(3)}`
    );

    await queenController.shutdown();
    await sharedMemory.shutdown();

  } catch (error) {
    logTest('Task Outcome Recording', false, error.message);
  }
}

async function testSuccessPrediction() {
  console.log('\n🔮 Testing Success Prediction...');
  
  try {
    const sharedMemory = new SharedMemoryStore({
      projectRoot: TEST_PROJECT_ROOT
    });

    // Wait for initialization to complete
    await new Promise((resolve, reject) => {
      sharedMemory.once('ready', resolve);
      sharedMemory.once('error', reject);
      setTimeout(resolve, 2000); // Fallback timeout
    });

    const queenController = new QueenController({
      projectRoot: TEST_PROJECT_ROOT,
      sharedMemory: sharedMemory,
      maxConcurrent: 5
    });

    // Wait for neural system to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));

    const testTask = {
      id: 'test-prediction-task',
      name: 'API Development Task',
      category: 'api',
      complexity: 8,
      estimatedDuration: 60000,
      projectSize: 20000,
      language: 'typescript',
      projectType: 'api'
    };

    const prediction = await queenController.getPredictedSuccess(testTask);

    logTest(
      'Success Prediction Returns Valid Data',
      prediction && 
      typeof prediction.successProbability === 'number' &&
      typeof prediction.confidence === 'number',
      `Success: ${prediction.successProbability?.toFixed(3)}, Confidence: ${prediction.confidence?.toFixed(3)}`
    );

    logTest(
      'Prediction Includes Risk Analysis',
      prediction.riskFactors !== undefined &&
      prediction.optimizations !== undefined,
      `Risks: ${prediction.riskFactors?.length || 0}, Optimizations: ${prediction.optimizations?.length || 0}`
    );

    await queenController.shutdown();
    await sharedMemory.shutdown();

  } catch (error) {
    logTest('Success Prediction', false, error.message);
  }
}

async function testDistributeTaskWithNeural() {
  console.log('\n🚀 Testing Task Distribution with Neural Integration...');
  
  try {
    const sharedMemory = new SharedMemoryStore({
      projectRoot: TEST_PROJECT_ROOT
    });

    // Wait for initialization to complete
    await new Promise((resolve, reject) => {
      sharedMemory.once('ready', resolve);
      sharedMemory.once('error', reject);
      setTimeout(resolve, 2000); // Fallback timeout
    });

    const queenController = new QueenController({
      projectRoot: TEST_PROJECT_ROOT,
      sharedMemory: sharedMemory,
      maxConcurrent: 5
    });

    // Wait for neural system to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));

    const testTask = {
      id: 'test-distribute-task',
      name: 'Frontend Component Development',
      description: 'Create React components with TypeScript',
      category: 'frontend',
      complexity: 6,
      estimatedDuration: 40000,
      projectSize: 18000,
      language: 'typescript',
      projectType: 'web'
    };

    const agentId = await queenController.distributeTask(testTask);

    logTest(
      'Task Distribution with Neural Predictions',
      agentId !== null,
      `Agent spawned: ${agentId}, Active agents: ${queenController.activeAgents.size}`
    );

    // Check if agent has neural predictions in context
    if (agentId) {
      const agent = queenController.subAgents.get(agentId);
      logTest(
        'Agent Context Contains Neural Data',
        agent && (agent.context?.neuralPredictions || agent.context?.selectionReasoning),
        `Neural predictions: ${!!agent.context?.neuralPredictions}, Reasoning: ${!!agent.context?.selectionReasoning}`
      );
    }

    await queenController.shutdown();
    await sharedMemory.shutdown();

  } catch (error) {
    logTest('Task Distribution with Neural Integration', false, error.message);
  }
}

async function testSharedMemoryIntegration() {
  console.log('\n🔗 Testing Shared Memory Integration...');
  
  try {
    const sharedMemory = new SharedMemoryStore({
      projectRoot: TEST_PROJECT_ROOT
    });

    // Wait for initialization to complete
    await new Promise((resolve, reject) => {
      sharedMemory.once('ready', resolve);
      sharedMemory.once('error', reject);
      setTimeout(resolve, 2000); // Fallback timeout
    });

    const queenController = new QueenController({
      projectRoot: TEST_PROJECT_ROOT,
      sharedMemory: sharedMemory,
      maxConcurrent: 5
    });

    // Wait for neural system to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if neural status is shared
    const neuralStatus = await sharedMemory.get('neural_status', {
      namespace: sharedMemory.namespaces.CROSS_AGENT
    });

    logTest(
      'Neural Status Shared in Memory',
      neuralStatus && neuralStatus.initialized !== undefined,
      `Status available: ${!!neuralStatus}, Initialized: ${neuralStatus?.initialized}`
    );

    // Test cross-agent pattern sharing
    const testPattern = {
      id: 'test-pattern',
      workflowData: { type: 'test' },
      outcomeData: { success: true },
      timestamp: Date.now()
    };

    await sharedMemory.set('learned_pattern_test', testPattern, {
      namespace: sharedMemory.namespaces.CROSS_AGENT,
      ttl: 60000
    });

    const retrievedPattern = await sharedMemory.get('learned_pattern_test', {
      namespace: sharedMemory.namespaces.CROSS_AGENT
    });

    logTest(
      'Pattern Sharing via Shared Memory',
      retrievedPattern && retrievedPattern.id === 'test-pattern',
      `Pattern retrieved: ${!!retrievedPattern}, ID match: ${retrievedPattern?.id === 'test-pattern'}`
    );

    await queenController.shutdown();
    await sharedMemory.shutdown();

  } catch (error) {
    logTest('Shared Memory Integration', false, error.message);
  }
}

async function testBackwardCompatibility() {
  console.log('\n🔄 Testing Backward Compatibility...');
  
  try {
    // Test Queen Controller without shared memory (backward compatibility)
    const queenController = new QueenController({
      projectRoot: TEST_PROJECT_ROOT,
      maxConcurrent: 3
    });

    // Wait for neural system to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));

    const status = queenController.getStatus();

    logTest(
      'Works Without Shared Memory',
      status.active !== undefined && status.neuralLearning !== undefined,
      `Status available: ${!!status}, Neural available: ${!!status.neuralLearning}`
    );

    // Test traditional task distribution still works
    const testTask = {
      id: 'backward-compat-task',
      name: 'Test Backward Compatibility',
      description: 'Test analysis task',
      category: 'analysis'
    };

    const agentId = await queenController.distributeTask(testTask);

    logTest(
      'Traditional Task Distribution Still Works',
      agentId !== null || queenController.taskQueue.length > 0,
      `Task handled: ${agentId ? 'Agent spawned' : 'Queued'}`
    );

    await queenController.shutdown();

  } catch (error) {
    logTest('Backward Compatibility', false, error.message);
  }
}

async function runAllTests() {
  console.log('🧪 Phase 6 Neural Integration Test Suite');
  console.log('==========================================\n');

  await setupTestEnvironment();

  // Run all test suites
  await testQueenControllerNeuralInitialization();
  await testNeuralAgentSelection();
  await testTaskOutcomeRecording();
  await testSuccessPrediction();
  await testDistributeTaskWithNeural();
  await testSharedMemoryIntegration();
  await testBackwardCompatibility();

  await cleanupTestEnvironment();

  // Print summary
  console.log('\n📊 Test Results Summary');
  console.log('=======================');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);

  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.details
      .filter(test => !test.passed)
      .forEach(test => {
        console.log(`  - ${test.testName}: ${test.details}`);
      });
    
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed! Neural integration is working correctly.');
    process.exit(0);
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testResults
};