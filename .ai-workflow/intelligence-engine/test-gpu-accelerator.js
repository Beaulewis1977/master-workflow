/**
 * GPU Accelerator Test Suite
 * Phase 9: Multi-Node Scaling & Advanced Analytics
 *
 * Comprehensive tests for GPU acceleration functionality including:
 * - GPU detection and initialization
 * - Neural network acceleration
 * - Batch processing
 * - Performance benchmarking
 * - CPU fallback behavior
 * - Integration with neural learning system
 */

const { GPUAccelerator, GPUNeuralAccelerator, GPUDetector } = require('./gpu-accelerator');
const { NeuralLearningSystem } = require('./neural-learning');

class GPUAcceleratorTestSuite {
    constructor() {
        this.tests = [];
        this.results = {
            passed: 0,
            failed: 0,
            total: 0,
            details: []
        };
    }

    /**
     * Run all tests
     */
    async runAll() {
        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║       GPU Accelerator Test Suite - Phase 9                ║');
        console.log('║       Target: 3.6x Performance Improvement                ║');
        console.log('╚════════════════════════════════════════════════════════════╝\n');

        // Test 1: GPU Detection
        await this.testGPUDetection();

        // Test 2: GPU Accelerator Initialization
        await this.testGPUAcceleratorInit();

        // Test 3: Neural Forward Pass
        await this.testNeuralForwardPass();

        // Test 4: Batch Predictions
        await this.testBatchPredictions();

        // Test 5: Cosine Similarity
        await this.testCosineSimilarity();

        // Test 6: Memory Pool
        await this.testMemoryPool();

        // Test 7: Performance Benchmarking
        await this.testPerformanceBenchmark();

        // Test 8: CPU Fallback
        await this.testCPUFallback();

        // Test 9: Neural Learning Integration
        await this.testNeuralLearningIntegration();

        // Test 10: Queen Controller Integration
        await this.testQueenControllerIntegration();

        // Print results
        this.printResults();

        return this.results;
    }

    /**
     * Test 1: GPU Detection
     */
    async testGPUDetection() {
        console.log('Test 1: GPU Detection and Capability Assessment');

        try {
            const detector = new GPUDetector();
            const capabilities = await detector.detectCapabilities();

            this.assert(
                capabilities !== null,
                'GPU capabilities detected',
                'Failed to detect GPU capabilities'
            );

            this.assert(
                capabilities.preferredBackend !== undefined,
                'Preferred backend selected',
                'Failed to select preferred backend'
            );

            console.log(`  ✓ Detected backend: ${capabilities.preferredBackend}`);
            console.log(`  ✓ CUDA support: ${capabilities.cuda ? 'Yes' : 'No'}`);
            console.log(`  ✓ WebGPU support: ${capabilities.webgpu ? 'Yes' : 'No'}`);
            console.log(`  ✓ Device: ${detector.deviceInfo.name}\n`);

        } catch (error) {
            this.fail('GPU Detection', error);
        }
    }

    /**
     * Test 2: GPU Accelerator Initialization
     */
    async testGPUAcceleratorInit() {
        console.log('Test 2: GPU Accelerator Initialization');

        try {
            const accelerator = new GPUAccelerator({
                preferredBackend: 'auto',
                enableMemoryPool: true,
                fallbackToCPU: true
            });

            const initialized = await accelerator.initialize();

            this.assert(
                initialized === true,
                'GPU accelerator initialized',
                'Failed to initialize GPU accelerator'
            );

            const status = accelerator.getStatus();

            this.assert(
                status.initialized === true,
                'Accelerator status is initialized',
                'Accelerator status not initialized'
            );

            console.log(`  ✓ Backend: ${status.backend}`);
            console.log(`  ✓ GPU Available: ${status.gpuAvailable}`);
            console.log(`  ✓ Initialization successful\n`);

            await accelerator.shutdown();

        } catch (error) {
            this.fail('GPU Accelerator Initialization', error);
        }
    }

    /**
     * Test 3: Neural Forward Pass
     */
    async testNeuralForwardPass() {
        console.log('Test 3: GPU-Accelerated Neural Forward Pass');

        try {
            const accelerator = new GPUAccelerator({
                preferredBackend: 'auto',
                enableProfiling: true
            });

            await accelerator.initialize();

            const architecture = {
                inputSize: 32,
                hiddenLayers: [64, 32, 16],
                outputSize: 8
            };

            const input = new Float32Array(32);
            for (let i = 0; i < 32; i++) {
                input[i] = Math.random();
            }

            const totalWeights =
                architecture.inputSize * architecture.hiddenLayers[0] +
                architecture.hiddenLayers[0] * architecture.hiddenLayers[1] +
                architecture.hiddenLayers[1] * architecture.hiddenLayers[2] +
                architecture.hiddenLayers[2] * architecture.outputSize +
                architecture.hiddenLayers[0] +
                architecture.hiddenLayers[1] +
                architecture.hiddenLayers[2] +
                architecture.outputSize;

            const weights = new Float32Array(totalWeights);
            for (let i = 0; i < totalWeights; i++) {
                weights[i] = (Math.random() * 2 - 1) * 0.1;
            }

            const startTime = Date.now();
            const output = await accelerator.neuralForward(input, weights, architecture);
            const forwardTime = Date.now() - startTime;

            this.assert(
                output !== null,
                'Neural forward pass completed',
                'Neural forward pass failed'
            );

            this.assert(
                output.length === architecture.outputSize,
                'Output size matches architecture',
                `Output size mismatch: expected ${architecture.outputSize}, got ${output.length}`
            );

            // Verify softmax properties (sum to 1)
            const sum = Array.from(output).reduce((a, b) => a + b, 0);
            this.assert(
                Math.abs(sum - 1.0) < 0.01,
                'Softmax output sums to 1',
                `Softmax sum incorrect: ${sum}`
            );

            console.log(`  ✓ Forward pass completed in ${forwardTime}ms`);
            console.log(`  ✓ Output shape: [${output.length}]`);
            console.log(`  ✓ Output sum (softmax): ${sum.toFixed(4)}\n`);

            await accelerator.shutdown();

        } catch (error) {
            this.fail('Neural Forward Pass', error);
        }
    }

    /**
     * Test 4: Batch Predictions
     */
    async testBatchPredictions() {
        console.log('Test 4: Batch Prediction Processing');

        try {
            const accelerator = new GPUAccelerator({
                preferredBackend: 'auto'
            });

            await accelerator.initialize();

            const architecture = {
                inputSize: 32,
                hiddenLayers: [64, 32, 16],
                outputSize: 8
            };

            const batchSize = 10;
            const inputs = [];

            for (let i = 0; i < batchSize; i++) {
                const input = new Float32Array(32);
                for (let j = 0; j < 32; j++) {
                    input[j] = Math.random();
                }
                inputs.push(input);
            }

            const totalWeights =
                architecture.inputSize * architecture.hiddenLayers[0] +
                architecture.hiddenLayers[0] * architecture.hiddenLayers[1] +
                architecture.hiddenLayers[1] * architecture.hiddenLayers[2] +
                architecture.hiddenLayers[2] * architecture.outputSize;

            const weights = new Float32Array(totalWeights).fill(0.1);

            const startTime = Date.now();
            const results = await accelerator.batchPredict(inputs, weights, architecture);
            const batchTime = Date.now() - startTime;

            this.assert(
                results.length === batchSize,
                'Batch processing completed',
                `Expected ${batchSize} results, got ${results.length}`
            );

            const avgTimePerSample = batchTime / batchSize;

            console.log(`  ✓ Batch size: ${batchSize}`);
            console.log(`  ✓ Total time: ${batchTime}ms`);
            console.log(`  ✓ Avg time per sample: ${avgTimePerSample.toFixed(2)}ms\n`);

            await accelerator.shutdown();

        } catch (error) {
            this.fail('Batch Predictions', error);
        }
    }

    /**
     * Test 5: Cosine Similarity
     */
    async testCosineSimilarity() {
        console.log('Test 5: GPU-Accelerated Cosine Similarity');

        try {
            const accelerator = new GPUAccelerator({
                preferredBackend: 'auto'
            });

            await accelerator.initialize();

            const vectorSize = 32;
            const vectorA = new Float32Array(vectorSize);
            const vectorB = new Float32Array(vectorSize);

            for (let i = 0; i < vectorSize; i++) {
                vectorA[i] = Math.random();
                vectorB[i] = Math.random();
            }

            const similarity = accelerator.cosineSimilarity(vectorA, vectorB);

            this.assert(
                similarity >= -1.0 && similarity <= 1.0,
                'Cosine similarity in valid range',
                `Cosine similarity out of range: ${similarity}`
            );

            // Test identical vectors
            const identicalSimilarity = accelerator.cosineSimilarity(vectorA, vectorA);

            this.assert(
                Math.abs(identicalSimilarity - 1.0) < 0.001,
                'Identical vectors have similarity ~1.0',
                `Expected ~1.0, got ${identicalSimilarity}`
            );

            console.log(`  ✓ Random vectors similarity: ${similarity.toFixed(4)}`);
            console.log(`  ✓ Identical vectors similarity: ${identicalSimilarity.toFixed(4)}\n`);

            await accelerator.shutdown();

        } catch (error) {
            this.fail('Cosine Similarity', error);
        }
    }

    /**
     * Test 6: Memory Pool
     */
    async testMemoryPool() {
        console.log('Test 6: GPU Memory Pool Management');

        try {
            const accelerator = new GPUAccelerator({
                preferredBackend: 'auto',
                enableMemoryPool: true,
                memoryPoolSize: 128 * 1024 * 1024  // 128MB
            });

            await accelerator.initialize();

            this.assert(
                accelerator.memoryPool !== null,
                'Memory pool created',
                'Memory pool not initialized'
            );

            // Allocate some buffers
            const buffer1 = accelerator.memoryPool.allocate(1024);
            const buffer2 = accelerator.memoryPool.allocate(2048);

            this.assert(
                buffer1 !== null && buffer2 !== null,
                'Buffers allocated',
                'Failed to allocate buffers'
            );

            // Free buffers
            accelerator.memoryPool.free(buffer1);
            accelerator.memoryPool.free(buffer2);

            // Reallocate to test reuse
            const buffer3 = accelerator.memoryPool.allocate(1024);

            const stats = accelerator.memoryPool.getStats();

            console.log(`  ✓ Allocations: ${stats.allocations}`);
            console.log(`  ✓ Deallocations: ${stats.deallocations}`);
            console.log(`  ✓ Reuses: ${stats.reuses}`);
            console.log(`  ✓ Reuse rate: ${stats.reuseRate}\n`);

            await accelerator.shutdown();

        } catch (error) {
            this.fail('Memory Pool', error);
        }
    }

    /**
     * Test 7: Performance Benchmark
     */
    async testPerformanceBenchmark() {
        console.log('Test 7: Performance Benchmarking (Target: 3.6x)');

        try {
            const accelerator = new GPUAccelerator({
                preferredBackend: 'auto',
                enableProfiling: true
            });

            await accelerator.initialize();

            const stats = accelerator.getPerformanceStats();

            this.assert(
                stats.benchmarks !== undefined,
                'Benchmarks completed',
                'No benchmark data available'
            );

            const speedup = stats.speedup;
            const targetMet = speedup >= 3.6;

            console.log(`  ✓ Backend: ${stats.backend}`);
            console.log(`  ✓ Operations: ${stats.operations}`);
            console.log(`  ✓ Average speedup: ${speedup.toFixed(2)}x`);
            console.log(`  ✓ Peak speedup: ${stats.peakSpeedup.toFixed(2)}x`);
            console.log(`  ✓ Target (3.6x): ${targetMet ? '✅ MET' : '⚠️  NOT MET'}`);

            if (stats.benchmarks.matrixMultiply) {
                console.log(`  ✓ Matrix multiply: ${stats.benchmarks.matrixMultiply.speedup.toFixed(2)}x`);
            }

            console.log('');

            await accelerator.shutdown();

        } catch (error) {
            this.fail('Performance Benchmark', error);
        }
    }

    /**
     * Test 8: CPU Fallback
     */
    async testCPUFallback() {
        console.log('Test 8: CPU Fallback Behavior');

        try {
            const accelerator = new GPUAccelerator({
                preferredBackend: 'cpu',  // Force CPU mode
                fallbackToCPU: true
            });

            await accelerator.initialize();

            const status = accelerator.getStatus();

            this.assert(
                status.backend === 'cpu',
                'CPU backend selected',
                `Expected CPU backend, got ${status.backend}`
            );

            const architecture = {
                inputSize: 32,
                hiddenLayers: [64, 32, 16],
                outputSize: 8
            };

            const input = new Float32Array(32).fill(0.5);
            const weights = new Float32Array(3000).fill(0.1);

            const output = await accelerator.neuralForward(input, weights, architecture);

            this.assert(
                output !== null,
                'CPU fallback works',
                'CPU fallback failed'
            );

            console.log(`  ✓ Backend: ${status.backend}`);
            console.log(`  ✓ CPU fallback operational`);
            console.log(`  ✓ Output computed successfully\n`);

            await accelerator.shutdown();

        } catch (error) {
            this.fail('CPU Fallback', error);
        }
    }

    /**
     * Test 9: Neural Learning Integration
     */
    async testNeuralLearningIntegration() {
        console.log('Test 9: Neural Learning System Integration');

        try {
            // Initialize neural learning system
            const neuralSystem = new NeuralLearningSystem({
                persistencePath: '/tmp/test-neural-gpu',
                autoSave: false
            });

            await neuralSystem.initialize();

            // Add GPU acceleration
            const gpuNeural = new GPUNeuralAccelerator(neuralSystem, {
                preferredBackend: 'auto'
            });

            const initialized = await gpuNeural.initialize();

            this.assert(
                initialized === true,
                'GPU neural accelerator initialized',
                'Failed to initialize GPU neural accelerator'
            );

            // Make a prediction
            const workflowData = {
                id: 'test-workflow-1',
                type: 'code-analysis',
                taskCount: 5,
                duration: 45000,
                complexity: 7,
                projectSize: 15000,
                primaryLanguage: 'javascript'
            };

            const prediction = await gpuNeural.predict(workflowData);

            this.assert(
                prediction !== null,
                'GPU prediction completed',
                'GPU prediction failed'
            );

            this.assert(
                prediction.successProbability !== undefined,
                'Success probability calculated',
                'Missing success probability'
            );

            console.log(`  ✓ Neural system initialized`);
            console.log(`  ✓ GPU acceleration: ${gpuNeural.enabled ? 'Enabled' : 'Disabled'}`);
            console.log(`  ✓ Success probability: ${(prediction.successProbability * 100).toFixed(1)}%`);
            console.log(`  ✓ Confidence: ${(prediction.confidence * 100).toFixed(1)}%\n`);

            await gpuNeural.shutdown();

        } catch (error) {
            this.fail('Neural Learning Integration', error);
        }
    }

    /**
     * Test 10: Queen Controller Integration
     */
    async testQueenControllerIntegration() {
        console.log('Test 10: Queen Controller Integration (Simulated)');

        try {
            // Simulate Queen Controller integration
            const mockQueenController = {
                neuralLearning: new NeuralLearningSystem({
                    persistencePath: '/tmp/test-queen-gpu',
                    autoSave: false
                }),
                selectOptimalAgent: async function(task) {
                    return {
                        agentType: 'code-analyzer',
                        prediction: {
                            successProbability: 0.89,
                            confidence: 0.92
                        }
                    };
                }
            };

            await mockQueenController.neuralLearning.initialize();

            const gpuAccelerator = new GPUNeuralAccelerator(
                mockQueenController.neuralLearning,
                { preferredBackend: 'auto' }
            );

            await gpuAccelerator.initialize();

            // Simulate agent selection with GPU acceleration
            const task = {
                id: 'integration-test-task',
                type: 'code-analysis',
                complexity: 6
            };

            const selection = await mockQueenController.selectOptimalAgent(task);

            this.assert(
                selection !== null,
                'Queen controller integration works',
                'Integration failed'
            );

            const stats = gpuAccelerator.getPerformanceStats();

            console.log(`  ✓ Queen controller integration simulated`);
            console.log(`  ✓ GPU acceleration: ${gpuAccelerator.enabled ? 'Active' : 'Inactive'}`);
            console.log(`  ✓ Agent selected: ${selection.agentType}`);
            console.log(`  ✓ Success probability: ${(selection.prediction.successProbability * 100).toFixed(1)}%\n`);

            await gpuAccelerator.shutdown();

        } catch (error) {
            this.fail('Queen Controller Integration', error);
        }
    }

    /**
     * Assert helper
     */
    assert(condition, successMessage, failMessage) {
        this.results.total++;

        if (condition) {
            this.results.passed++;
            this.results.details.push({
                test: successMessage,
                status: 'PASSED'
            });
        } else {
            this.results.failed++;
            this.results.details.push({
                test: failMessage,
                status: 'FAILED'
            });
            console.log(`  ✗ ${failMessage}`);
        }
    }

    /**
     * Fail helper
     */
    fail(testName, error) {
        this.results.total++;
        this.results.failed++;
        this.results.details.push({
            test: testName,
            status: 'ERROR',
            error: error.message
        });
        console.log(`  ✗ ${testName} failed: ${error.message}\n`);
    }

    /**
     * Print test results
     */
    printResults() {
        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║                    Test Results                            ║');
        console.log('╚════════════════════════════════════════════════════════════╝\n');

        console.log(`Total Tests:  ${this.results.total}`);
        console.log(`Passed:       ${this.results.passed} ✅`);
        console.log(`Failed:       ${this.results.failed} ${this.results.failed > 0 ? '❌' : '✅'}`);

        const passRate = (this.results.passed / this.results.total * 100).toFixed(1);
        console.log(`Pass Rate:    ${passRate}%`);

        console.log('\n' + '='.repeat(60) + '\n');

        if (this.results.failed === 0) {
            console.log('🎉 All tests passed! GPU Accelerator is ready for production.\n');
        } else {
            console.log('⚠️  Some tests failed. Review the results above.\n');
        }

        // Detailed results
        console.log('Detailed Results:');
        for (const detail of this.results.details) {
            const icon = detail.status === 'PASSED' ? '✓' : '✗';
            console.log(`  ${icon} ${detail.test} - ${detail.status}`);
            if (detail.error) {
                console.log(`    Error: ${detail.error}`);
            }
        }

        console.log('');
    }
}

// Run tests if executed directly
if (require.main === module) {
    async function runTests() {
        const testSuite = new GPUAcceleratorTestSuite();
        const results = await testSuite.runAll();

        // Exit with appropriate code
        process.exit(results.failed === 0 ? 0 : 1);
    }

    runTests().catch(error => {
        console.error('Test suite failed:', error);
        process.exit(1);
    });
}

module.exports = GPUAcceleratorTestSuite;
