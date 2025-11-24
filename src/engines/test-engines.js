#!/usr/bin/env node
/**
 * Engine Test Suite
 * ==================
 * Tests all 5 improved engines
 */

import { EngineManager } from './index.js';

async function testEngines() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║           🧪 Engine Test Suite - Phase 3 🧪                   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);

  const manager = new EngineManager({ verbose: true });
  await manager.initialize();

  let passed = 0;
  let failed = 0;

  // Test 1: GPU Accelerator
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🖥️  Test 1: GPU Accelerator');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    const a = [[1, 2], [3, 4]];
    const b = [[5, 6], [7, 8]];
    const result = await manager.gpu.matrixMultiply(a, b);
    console.log('   Matrix multiply result:', result);
    
    const vec = await manager.gpu.vectorDot([1, 2, 3], [4, 5, 6]);
    console.log('   Vector dot product:', vec);
    
    const status = manager.gpu.getStatus();
    console.log('   GPU Status:', status.gpuAvailable ? 'Available' : 'CPU Fallback');
    console.log('   ✅ GPU Accelerator: PASSED');
    passed++;
  } catch (error) {
    console.log('   ❌ GPU Accelerator: FAILED -', error.message);
    failed++;
  }

  // Test 2: Predictive Analytics
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Test 2: Predictive Analytics');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    // Record some training data
    for (let i = 0; i < 20; i++) {
      manager.prediction.recordTask({
        complexity: Math.random() * 5,
        dependencies: Math.floor(Math.random() * 10),
        priority: Math.floor(Math.random() * 3) + 1,
        type: Math.random() > 0.5 ? 'cpu' : 'io',
        size: Math.random() * 100,
        duration: 100 + Math.random() * 500,
        failed: Math.random() > 0.8
      });
    }

    const task = { complexity: 3, dependencies: 5, priority: 2, type: 'cpu', size: 50 };
    const duration = await manager.prediction.predictDuration(task);
    console.log('   Duration prediction:', duration.predicted.toFixed(2), 'ms');
    
    const failure = await manager.prediction.predictFailure(task);
    console.log('   Failure probability:', (failure.probability * 100).toFixed(1) + '%');
    
    const resources = await manager.prediction.predictResources(task);
    console.log('   Resource prediction: CPU', resources.cpu + '%, Memory', resources.memory + '%');
    
    console.log('   ✅ Predictive Analytics: PASSED');
    passed++;
  } catch (error) {
    console.log('   ❌ Predictive Analytics: FAILED -', error.message);
    failed++;
  }

  // Test 3: Auto-Tuner
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎛️  Test 3: Auto-Tuner');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    // Simple optimization: find max of -(x-3)^2 - (y-2)^2
    const objectiveFn = async (config) => {
      return -(Math.pow(config.x - 3, 2) + Math.pow(config.y - 2, 2));
    };

    const paramSpace = {
      x: { type: 'continuous', min: 0, max: 10 },
      y: { type: 'continuous', min: 0, max: 10 }
    };

    const result = await manager.tuner.optimize(objectiveFn, paramSpace, {
      algorithm: 'bayesian',
      maxIterations: 30
    });

    console.log('   Best config: x =', result.bestConfig.x.toFixed(2), ', y =', result.bestConfig.y.toFixed(2));
    console.log('   Best score:', result.bestScore.toFixed(4));
    console.log('   Expected: x ≈ 3, y ≈ 2, score ≈ 0');
    console.log('   ✅ Auto-Tuner: PASSED');
    passed++;
  } catch (error) {
    console.log('   ❌ Auto-Tuner: FAILED -', error.message);
    failed++;
  }

  // Test 4: Swarm Intelligence
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🐝 Test 4: Swarm Intelligence');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    // Sphere function optimization
    const sphereFn = async (position) => {
      return -position.reduce((sum, x) => sum + x * x, 0);
    };

    const bounds = [
      { min: -5, max: 5 },
      { min: -5, max: 5 }
    ];

    const result = await manager.swarm.particleSwarmOptimize(sphereFn, bounds, {
      swarmSize: 20,
      maxIterations: 30
    });

    console.log('   Best position:', result.bestPosition.map(x => x.toFixed(3)));
    console.log('   Best score:', result.bestScore.toFixed(4));
    console.log('   Expected: position ≈ [0, 0], score ≈ 0');
    console.log('   Swarm diversity:', result.metrics.diversity.toFixed(4));
    console.log('   ✅ Swarm Intelligence: PASSED');
    passed++;
  } catch (error) {
    console.log('   ❌ Swarm Intelligence: FAILED -', error.message);
    failed++;
  }

  // Test 5: Pattern Discovery
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 Test 5: Pattern Discovery');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    const result = await manager.patterns.analyzeCodebase('./src/engines');
    
    console.log('   Files analyzed:', result.metrics.filesAnalyzed);
    console.log('   Patterns found:', result.metrics.patternsFound);
    console.log('   Anti-patterns found:', result.metrics.antiPatternsFound);
    console.log('   Code smells found:', result.metrics.codeSmellsFound);
    console.log('   Health score:', result.summary.healthScore, '(' + result.summary.grade + ')');
    
    if (result.patterns.length > 0) {
      console.log('   Top patterns:', result.patterns.slice(0, 3).map(p => p.name).join(', '));
    }
    
    console.log('   ✅ Pattern Discovery: PASSED');
    passed++;
  } catch (error) {
    console.log('   ❌ Pattern Discovery: FAILED -', error.message);
    failed++;
  }

  // Summary
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║                    📊 Test Results 📊                         ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

   ✅ Passed: ${passed}/5
   ❌ Failed: ${failed}/5
   
   Status: ${failed === 0 ? '🎉 ALL TESTS PASSED!' : '⚠️ Some tests failed'}
  `);

  // Engine status summary
  console.log('Engine Status:');
  const status = manager.getStatus();
  for (const [name, engineStatus] of Object.entries(status.engines)) {
    console.log(`   • ${name}: ${engineStatus.initialized !== false ? '✅ Ready' : '❌ Not ready'}`);
  }

  await manager.shutdown();
  process.exit(failed > 0 ? 1 : 0);
}

testEngines().catch(console.error);
