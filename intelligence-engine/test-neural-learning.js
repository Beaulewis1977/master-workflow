/**
 * Test Suite for Neural Learning System
 * 
 * Comprehensive tests for the WASM-based neural learning system including:
 * - WASM core initialization and functionality
 * - Pattern recording and similarity detection
 * - Success metrics tracking and analysis
 * - Prediction accuracy and optimization suggestions
 * - Persistence and loading capabilities
 */

const { NeuralLearningSystem, WASMNeuralCore, PatternRecorder, SuccessMetrics } = require('./neural-learning.js');
const fs = require('fs');
const path = require('path');

/**
 * Test Framework
 */
class TestRunner {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
        this.results = [];
    }

    addTest(name, testFunction) {
        this.tests.push({ name, testFunction });
    }

    async runAll() {
        console.log(`\n🧪 Running Neural Learning System Tests\n${'='.repeat(50)}\n`);
        
        for (const test of this.tests) {
            try {
                console.log(`🔬 Testing: ${test.name}`);
                await test.testFunction();
                this.passed++;
                this.results.push({ name: test.name, status: 'PASSED', error: null });
                console.log(`✅ PASSED: ${test.name}\n`);
            } catch (error) {
                this.failed++;
                this.results.push({ name: test.name, status: 'FAILED', error: error.message });
                console.log(`❌ FAILED: ${test.name}`);
                console.log(`   Error: ${error.message}\n`);
            }
        }

        this.printSummary();
        return this.failed === 0;
    }

    printSummary() {
        const total = this.passed + this.failed;
        const passRate = ((this.passed / total) * 100).toFixed(1);
        
        console.log(`\n${'='.repeat(50)}`);
        console.log(`📊 Test Summary:`);
        console.log(`   Total Tests: ${total}`);
        console.log(`   Passed: ${this.passed}`);
        console.log(`   Failed: ${this.failed}`);
        console.log(`   Pass Rate: ${passRate}%`);
        
        if (this.failed > 0) {
            console.log(`\n❌ Failed Tests:`);
            this.results.filter(r => r.status === 'FAILED').forEach(r => {
                console.log(`   - ${r.name}: ${r.error}`);
            });
        }
        
        console.log(`${'='.repeat(50)}\n`);
    }

    assert(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }

    assertApproximate(actual, expected, tolerance = 0.1, message = '') {
        const diff = Math.abs(actual - expected);
        if (diff > tolerance) {
            throw new Error(`${message} Expected ~${expected}, got ${actual} (diff: ${diff})`);
        }
    }

    assertArrayEqual(actual, expected, message = '') {
        if (actual.length !== expected.length) {
            throw new Error(`${message} Array length mismatch: expected ${expected.length}, got ${actual.length}`);
        }
        for (let i = 0; i < actual.length; i++) {
            if (Math.abs(actual[i] - expected[i]) > 0.1) {
                throw new Error(`${message} Array element ${i}: expected ${expected[i]}, got ${actual[i]}`);
            }
        }
    }
}

/**
 * Test Data Generators
 */
class TestDataGenerator {
    static generateWorkflowData(overrides = {}) {
        return {
            id: `test-workflow-${Date.now()}`,
            type: 'code-analysis',
            taskCount: 5,
            duration: 45000,
            complexity: 7,
            userInteractions: 3,
            errorCount: 0,
            resourceUsage: 0.4,
            projectSize: 15000,
            teamSize: 3,
            timeOfDay: 14,
            dayOfWeek: 2,
            cpuUsage: 0.3,
            memoryUsage: 0.4,
            networkLatency: 50,
            primaryLanguage: 'javascript',
            workflowType: 'analysis',
            projectType: 'web-app',
            userPreferences: {
                speed: 0.8,
                quality: 0.9,
                automation: 0.7
            },
            ...overrides
        };
    }

    static generateOutcome(success = true, overrides = {}) {
        return {
            success: success,
            duration: success ? 43000 : 65000,
            quality: success ? 0.9 : 0.3,
            userRating: success ? 4.5 : 2.1,
            errors: success ? [] : ['syntax_error', 'type_error'],
            resourceUsage: { 
                cpu: success ? 0.4 : 0.8, 
                memory: success ? 0.3 : 0.7 
            },
            optimizationPotential: success ? 0.2 : 0.8,
            ...overrides
        };
    }

    static generateTrainingData(count = 100) {
        const data = [];
        for (let i = 0; i < count; i++) {
            const success = Math.random() > 0.3; // 70% success rate
            const workflowData = this.generateWorkflowData({
                id: `training-${i}`,
                complexity: Math.floor(Math.random() * 10) + 1,
                taskCount: Math.floor(Math.random() * 15) + 1
            });
            const outcome = this.generateOutcome(success);
            data.push({ workflowData, outcome });
        }
        return data;
    }
}

/**
 * Individual Test Suites
 */

// Test WASM Neural Core
async function testWASMNeuralCore(runner) {
    const core = new WASMNeuralCore();
    
    // Test initialization
    const initialized = await core.initializeWASM();
    runner.assert(initialized, 'WASM core should initialize successfully');
    runner.assert(core.isInitialized, 'WASM core should be marked as initialized');
    
    // Test architecture
    runner.assert(core.architecture.totalWeights > 0, 'Architecture should have weights');
    runner.assert(core.architecture.totalActivations > 0, 'Architecture should have activations');
    console.log(`   Architecture: ${core.architecture.totalWeights} weights, ${core.architecture.totalActivations} activations`);
    
    // Test memory allocation
    if (core.weights) {
        runner.assert(core.weights.length === core.architecture.totalWeights, 'Weights array should match architecture');
        runner.assert(core.activations.length === core.architecture.totalActivations, 'Activations array should match architecture');
    }
    
    // Test forward pass
    const input = new Float32Array(core.architecture.inputSize);
    for (let i = 0; i < input.length; i++) {
        input[i] = Math.random();
    }
    
    const output = new Float32Array(core.architecture.outputSize);
    const result = core.forward(input, output);
    
    runner.assert(result.length === core.architecture.outputSize, 'Forward pass should return correct output size');
    
    // Test that output sums to approximately 1 (softmax)
    const sum = Array.from(output).reduce((a, b) => a + b, 0);
    runner.assertApproximate(sum, 1.0, 0.1, 'Output should sum to ~1 (softmax)');
    
    // Test training
    const target = new Float32Array(core.architecture.outputSize);
    target[0] = 1.0; // Set first output as target
    
    const weightsBefore = core.getWeights().slice();
    core.train(input, target, 0.1);
    const weightsAfter = core.getWeights();
    
    // Weights should have changed
    let changed = false;
    for (let i = 0; i < Math.min(100, weightsBefore.length); i++) {
        if (Math.abs(weightsBefore[i] - weightsAfter[i]) > 1e-6) {
            changed = true;
            break;
        }
    }
    runner.assert(changed, 'Training should modify weights');
    
    console.log(`   Forward pass: ${input.length} inputs → ${output.length} outputs`);
    console.log(`   Training: weights modified = ${changed}`);
}

// Test Pattern Recorder
async function testPatternRecorder(runner) {
    const recorder = new PatternRecorder();
    
    // Test pattern recording
    const workflowData = TestDataGenerator.generateWorkflowData();
    const outcome = TestDataGenerator.generateOutcome(true);
    
    const pattern = recorder.recordPattern(workflowData, outcome);
    
    runner.assert(pattern.id, 'Pattern should have an ID');
    runner.assert(pattern.features.length === 32, 'Pattern should have 32 features');
    runner.assert(pattern.successRate === 1.0, 'New successful pattern should have 100% success rate');
    runner.assert(recorder.patterns.size === 1, 'Recorder should have 1 pattern');
    
    // Test feature extraction
    const features = recorder.extractFeatures(workflowData);
    runner.assert(features.length === 32, 'Features should have length 32');
    runner.assertApproximate(features[0], workflowData.taskCount / 100, 0.1, 'First feature should be normalized task count');
    
    // Test similar pattern detection
    const similarWorkflow = TestDataGenerator.generateWorkflowData({
        complexity: workflowData.complexity + 1 // Slightly different
    });
    const similarFeatures = recorder.extractFeatures(similarWorkflow);
    const similar = recorder.getSimilarPatterns(similarFeatures, 5);
    
    runner.assert(similar.length > 0, 'Should find similar patterns');
    runner.assert(similar[0].similarity > 0.5, 'Similar pattern should have decent similarity');
    
    // Test multiple patterns with different types to avoid deduplication
    for (let i = 0; i < 10; i++) {
        const data = TestDataGenerator.generateWorkflowData({ 
            id: `test-${i}`, 
            complexity: i + 1,
            workflowType: `type-${i}`, // Different types to avoid deduplication
            projectType: `project-${i}`
        });
        const out = TestDataGenerator.generateOutcome(Math.random() > 0.5);
        recorder.recordPattern(data, out);
    }
    
    // Should have at least the original pattern plus some new ones (some might deduplicate)
    runner.assert(recorder.patterns.size > 1, `Should have more than 1 pattern, got ${recorder.patterns.size}`);
    
    console.log(`   Patterns recorded: ${recorder.patterns.size}`);
    console.log(`   Feature vector size: ${features.length}`);
    console.log(`   Similar patterns found: ${similar.length}`);
}

// Test Success Metrics
async function testSuccessMetrics(runner) {
    const metrics = new SuccessMetrics();
    
    // Test outcome recording
    const workflowData = TestDataGenerator.generateWorkflowData();
    const outcome = TestDataGenerator.generateOutcome(true);
    
    const metric = metrics.recordOutcome(workflowData, outcome);
    
    runner.assert(metric.success === true, 'Metric should record success');
    runner.assert(metric.duration === outcome.duration, 'Metric should record duration');
    runner.assert(metrics.metrics.totalWorkflows === 1, 'Should have 1 total workflow');
    runner.assert(metrics.metrics.successfulWorkflows === 1, 'Should have 1 successful workflow');
    
    // Test batch recording
    const trainingData = TestDataGenerator.generateTrainingData(20);
    for (const { workflowData, outcome } of trainingData) {
        metrics.recordOutcome(workflowData, outcome);
    }
    
    runner.assert(metrics.metrics.totalWorkflows === 21, 'Should have 21 total workflows');
    runner.assert(metrics.metrics.averageTime > 0, 'Should have average time > 0');
    runner.assert(metrics.metrics.errorRate >= 0 && metrics.metrics.errorRate <= 1, 'Error rate should be 0-1');
    
    // Test prediction
    const prediction = metrics.predictSuccess(workflowData);
    runner.assert(prediction >= 0 && prediction <= 1, 'Prediction should be 0-1');
    
    // Test trend analysis
    const trends = metrics.analyzePerformanceTrends();
    runner.assert(['improving', 'declining', 'stable', 'insufficient_data'].includes(trends.trend), 
                  'Trend should be valid');
    
    // Test optimization suggestions
    const suggestions = metrics.getOptimizationSuggestions();
    runner.assert(Array.isArray(suggestions), 'Suggestions should be an array');
    
    console.log(`   Total workflows: ${metrics.metrics.totalWorkflows}`);
    console.log(`   Success rate: ${(metrics.metrics.successfulWorkflows / metrics.metrics.totalWorkflows * 100).toFixed(1)}%`);
    console.log(`   Trend: ${trends.trend} (confidence: ${(trends.confidence * 100).toFixed(1)}%)`);
    console.log(`   Optimization suggestions: ${suggestions.length}`);
}

// Test Neural Learning System Integration
async function testNeuralLearningSystem(runner) {
    const testDir = './test-neural-data';
    const system = new NeuralLearningSystem({
        persistencePath: testDir,
        autoSave: false, // Disable for testing
        batchSize: 5
    });
    
    // Test initialization
    const initialized = await system.initialize();
    runner.assert(initialized, 'System should initialize successfully');
    
    const status = system.getSystemStatus();
    runner.assert(status.initialized, 'Status should show initialized');
    runner.assert(status.modelWeights > 0, 'Should have model weights');
    
    // Test learning
    const workflowData = TestDataGenerator.generateWorkflowData();
    const outcome = TestDataGenerator.generateOutcome(true);
    
    const learningResult = await system.learn(workflowData, outcome);
    runner.assert(learningResult.pattern, 'Learning should return pattern');
    runner.assert(learningResult.metrics, 'Learning should return metrics');
    
    // Test prediction
    const prediction = await system.predict(workflowData);
    runner.assert(prediction.successProbability >= 0 && prediction.successProbability <= 1,
                  'Success probability should be 0-1');
    runner.assert(prediction.confidence >= 0 && prediction.confidence <= 1,
                  'Confidence should be 0-1');
    runner.assert(Array.isArray(prediction.optimizations), 'Should have optimizations array');
    
    // Test batch learning
    console.log('   Training with batch data...');
    const trainingData = TestDataGenerator.generateTrainingData(15);
    for (const { workflowData, outcome } of trainingData) {
        await system.learn(workflowData, outcome);
    }
    
    // Flush training queue
    await system.flushTraining();
    
    const statusAfterTraining = system.getSystemStatus();
    runner.assert(statusAfterTraining.performance.trainingIterations > 0,
                  'Should have training iterations');
    
    // Test analytics
    const analytics = system.getAnalytics();
    runner.assert(analytics.insights, 'Analytics should have insights');
    runner.assert(analytics.insights.topPatterns, 'Analytics should have top patterns');
    
    // Test persistence
    await system.savePersistentData();
    runner.assert(fs.existsSync(path.join(testDir, 'neural-learning-data.json')),
                  'Persistence file should be created');
    
    // Test loading
    const system2 = new NeuralLearningSystem({
        persistencePath: testDir,
        autoSave: false
    });
    await system2.initialize();
    
    const status2 = system2.getSystemStatus();
    runner.assert(status2.patterns.total > 0, 'Loaded system should have patterns');
    
    console.log(`   Learned from ${statusAfterTraining.metrics.totalWorkflows} workflows`);
    console.log(`   Training iterations: ${statusAfterTraining.performance.trainingIterations}`);
    console.log(`   Patterns: ${statusAfterTraining.patterns.total}`);
    console.log(`   Predictions served: ${statusAfterTraining.performance.predictionsServed}`);
    
    // Cleanup
    if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true });
    }
}

// Test Performance and Edge Cases
async function testPerformanceAndEdgeCases(runner) {
    const system = new NeuralLearningSystem({
        autoSave: false,
        batchSize: 10
    });
    
    await system.initialize();
    
    // Test performance with many predictions
    console.log('   Performance testing...');
    const startTime = Date.now();
    
    for (let i = 0; i < 100; i++) {
        const workflowData = TestDataGenerator.generateWorkflowData({ id: `perf-${i}` });
        await system.predict(workflowData);
    }
    
    const endTime = Date.now();
    const avgPredictionTime = (endTime - startTime) / 100;
    
    runner.assert(avgPredictionTime < 100, 'Average prediction time should be < 100ms');
    
    // Test edge cases
    
    // Empty workflow data
    try {
        await system.predict({});
        // Should not throw, should handle gracefully
    } catch (error) {
        runner.assert(false, 'Should handle empty workflow data gracefully');
    }
    
    // Extreme values
    const extremeWorkflow = TestDataGenerator.generateWorkflowData({
        taskCount: 1000,
        complexity: 50,
        duration: 1000000
    });
    
    const extremePrediction = await system.predict(extremeWorkflow);
    runner.assert(extremePrediction.successProbability >= 0 && extremePrediction.successProbability <= 1,
                  'Should handle extreme values');
    
    // Test with minimal data
    const minimalSystem = new NeuralLearningSystem({ autoSave: false });
    await minimalSystem.initialize();
    
    const minimalPrediction = await minimalSystem.predict(TestDataGenerator.generateWorkflowData());
    runner.assert(minimalPrediction.successProbability >= 0 && minimalPrediction.successProbability <= 1,
                  'Should work with minimal training data');
    
    console.log(`   Average prediction time: ${avgPredictionTime.toFixed(2)}ms`);
    console.log(`   Edge cases handled: ✓`);
}

// Test XNNPACK Integration (if available)
async function testXNNPACKIntegration(runner) {
    console.log('   XNNPACK integration test...');
    
    // This is a placeholder test - actual XNNPACK integration would require
    // proper WebAssembly compilation with XNNPACK backend
    const core = new WASMNeuralCore();
    await core.initializeWASM();
    
    // Test that the core can handle the workload efficiently
    const iterations = 1000;
    const startTime = Date.now();
    
    const input = new Float32Array(core.architecture.inputSize);
    const output = new Float32Array(core.architecture.outputSize);
    
    // Fill input with random values
    for (let i = 0; i < input.length; i++) {
        input[i] = Math.random();
    }
    
    // Run many forward passes
    for (let i = 0; i < iterations; i++) {
        core.forward(input, output);
    }
    
    const endTime = Date.now();
    const avgInferenceTime = (endTime - startTime) / iterations;
    
    runner.assert(avgInferenceTime < 5, 'Inference should be fast (< 5ms per forward pass)');
    
    console.log(`   ${iterations} forward passes in ${endTime - startTime}ms`);
    console.log(`   Average inference time: ${avgInferenceTime.toFixed(3)}ms`);
    
    // Test memory usage (should be within 512KB limit)
    const memoryUsage = core.weights.byteLength + core.activations.byteLength;
    const memoryLimitBytes = 512 * 1024; // 512KB
    
    runner.assert(memoryUsage <= memoryLimitBytes, 
                  `Memory usage should be <= 512KB (actual: ${(memoryUsage/1024).toFixed(1)}KB)`);
    
    console.log(`   Memory usage: ${(memoryUsage/1024).toFixed(1)}KB / 512KB`);
}

/**
 * Main Test Execution
 */
async function runTests() {
    const runner = new TestRunner();
    
    // Add all test cases
    runner.addTest('WASM Neural Core', () => testWASMNeuralCore(runner));
    runner.addTest('Pattern Recorder', () => testPatternRecorder(runner));
    runner.addTest('Success Metrics', () => testSuccessMetrics(runner));
    runner.addTest('Neural Learning System Integration', () => testNeuralLearningSystem(runner));
    runner.addTest('Performance and Edge Cases', () => testPerformanceAndEdgeCases(runner));
    runner.addTest('XNNPACK Integration', () => testXNNPACKIntegration(runner));
    
    // Run all tests
    const allPassed = await runner.runAll();
    
    if (allPassed) {
        console.log('🎉 All tests passed! Neural Learning System is ready for production.');
    } else {
        console.log('⚠️  Some tests failed. Please review and fix issues before deployment.');
        process.exit(1);
    }
    
    return allPassed;
}

// Export for use in other test files
module.exports = {
    TestRunner,
    TestDataGenerator,
    runTests
};

// Run tests if this file is executed directly
if (require.main === module) {
    runTests().catch(console.error);
}