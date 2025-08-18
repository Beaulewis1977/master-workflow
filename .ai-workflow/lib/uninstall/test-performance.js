#!/usr/bin/env node

/**
 * Performance Test Suite for Uninstaller Manifest Writers
 * Tests efficiency and scalability of manifest operations
 */

const fs = require('fs').promises;
const path = require('path');
const { performance } = require('perf_hooks');
const { ManifestManager } = require('./manifest');

// Simple formatting functions
const format = {
  green: (s) => `✅ ${s}`,
  red: (s) => `❌ ${s}`,
  yellow: (s) => `⚠️ ${s}`,
  blue: (s) => `🔵 ${s}`,
  cyan: (s) => `⚡ ${s}`,
  dim: (s) => `  ${s}`,
  bold: (s) => `\n=== ${s} ===\n`
};

class PerformanceTests {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '../../..');
    this.testRoot = path.join(this.projectRoot, '.ai-workflow/test-performance');
    this.passed = 0;
    this.failed = 0;
    this.tests = [];
    this.metrics = [];
  }

  async setup() {
    await fs.mkdir(this.testRoot, { recursive: true });
    console.log(format.dim('Performance test environment setup complete'));
  }

  async cleanup() {
    try {
      await fs.rm(this.testRoot, { recursive: true, force: true });
    } catch (e) {
      console.warn(format.yellow(`Cleanup warning: ${e.message}`));
    }
    console.log(format.dim('Performance test cleanup complete'));
  }

  async test(name, fn) {
    try {
      const result = await fn();
      this.passed++;
      console.log(format.green(`✓ ${name}`));
      this.tests.push({ name, status: 'passed', result });
      return result;
    } catch (error) {
      this.failed++;
      console.log(format.red(`✗ ${name}`));
      console.log(format.dim(`  Error: ${error.message}`));
      this.tests.push({ name, status: 'failed', error: error.message });
      return null;
    }
  }

  async measurePerformance(name, fn, iterations = 1) {
    const measurements = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      const end = performance.now();
      measurements.push(end - start);
    }

    const average = measurements.reduce((a, b) => a + b, 0) / measurements.length;
    const min = Math.min(...measurements);
    const max = Math.max(...measurements);

    const metric = {
      name,
      iterations,
      average: Math.round(average * 100) / 100,
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      measurements
    };

    this.metrics.push(metric);
    return metric;
  }

  generateTestData(count, prefix = 'test') {
    const items = [];
    for (let i = 0; i < count; i++) {
      items.push({
        path: `.ai-workflow/${prefix}/file${i}.js`,
        origin: 'installed_system_asset',
        content: `// Generated test file ${i}\nmodule.exports = { id: ${i} };`
      });
    }
    return items;
  }

  async runTests() {
    console.log(format.bold('⚡ Running Performance Tests'));
    
    await this.setup();

    // Test 1: Small-scale manifest operations
    await this.test('Small-scale manifest operations (10 items)', async () => {
      const testProject = path.join(this.testRoot, 'small-scale');
      await fs.mkdir(testProject, { recursive: true });
      await fs.mkdir(path.join(testProject, '.ai-workflow'), { recursive: true });

      const manager = new ManifestManager(testProject);
      const items = this.generateTestData(10, 'small');

      const metric = await this.measurePerformance('Small Scale Write', async () => {
        await manager.writeInstallationManifest(items, '3.0.0-perf');
      }, 10);

      if (metric.average > 100) throw new Error(`Too slow: ${metric.average}ms`);
      
      console.log(format.dim(`    Average: ${metric.average}ms (${metric.min}-${metric.max}ms)`));
      return metric;
    });

    // Test 2: Medium-scale manifest operations
    await this.test('Medium-scale manifest operations (100 items)', async () => {
      const testProject = path.join(this.testRoot, 'medium-scale');
      await fs.mkdir(testProject, { recursive: true });
      await fs.mkdir(path.join(testProject, '.ai-workflow'), { recursive: true });

      const manager = new ManifestManager(testProject);
      const items = this.generateTestData(100, 'medium');

      const metric = await this.measurePerformance('Medium Scale Write', async () => {
        await manager.writeInstallationManifest(items, '3.0.0-perf');
      }, 5);

      if (metric.average > 500) throw new Error(`Too slow: ${metric.average}ms`);
      
      console.log(format.dim(`    Average: ${metric.average}ms (${metric.min}-${metric.max}ms)`));
      return metric;
    });

    // Test 3: Large-scale manifest operations
    await this.test('Large-scale manifest operations (1000 items)', async () => {
      const testProject = path.join(this.testRoot, 'large-scale');
      await fs.mkdir(testProject, { recursive: true });
      await fs.mkdir(path.join(testProject, '.ai-workflow'), { recursive: true });

      const manager = new ManifestManager(testProject);
      const items = this.generateTestData(1000, 'large');

      const metric = await this.measurePerformance('Large Scale Write', async () => {
        await manager.writeInstallationManifest(items, '3.0.0-perf');
      }, 3);

      if (metric.average > 2000) throw new Error(`Too slow: ${metric.average}ms`);
      
      console.log(format.dim(`    Average: ${metric.average}ms (${metric.min}-${metric.max}ms)`));
      return metric;
    });

    // Test 4: Deduplication performance
    await this.test('Deduplication performance with overlapping data', async () => {
      const testProject = path.join(this.testRoot, 'deduplication');
      await fs.mkdir(testProject, { recursive: true });
      await fs.mkdir(path.join(testProject, '.ai-workflow'), { recursive: true });

      const manager = new ManifestManager(testProject);
      
      // Initial set of 500 items
      const initialItems = this.generateTestData(500, 'dedup');
      await manager.writeInstallationManifest(initialItems, '3.0.0-perf');

      // Overlapping set (300 duplicates + 200 new)
      const overlappingItems = [
        ...this.generateTestData(300, 'dedup'), // Duplicates
        ...this.generateTestData(200, 'new')     // New items
      ];

      const metric = await this.measurePerformance('Deduplication', async () => {
        await manager.writeInstallationManifest(overlappingItems, '3.0.1-perf');
      }, 5);

      // Verify final count is correct (500 original + 200 new = 700)
      const finalManifest = await manager.loadInstallationManifest();
      if (finalManifest.items.length !== 700) {
        throw new Error(`Expected 700 items, got ${finalManifest.items.length}`);
      }

      console.log(format.dim(`    Average: ${metric.average}ms (${metric.min}-${metric.max}ms)`));
      return metric;
    });

    // Test 5: Memory usage test
    await this.test('Memory usage efficiency', async () => {
      const testProject = path.join(this.testRoot, 'memory-test');
      await fs.mkdir(testProject, { recursive: true });
      await fs.mkdir(path.join(testProject, '.ai-workflow'), { recursive: true });

      const manager = new ManifestManager(testProject);
      
      // Monitor memory before
      const beforeMemory = process.memoryUsage();
      
      // Create large dataset
      const largeItems = this.generateTestData(5000, 'memory');
      
      const metric = await this.measurePerformance('Memory Efficiency', async () => {
        await manager.writeInstallationManifest(largeItems, '3.0.0-mem');
      });

      // Monitor memory after
      const afterMemory = process.memoryUsage();
      const memoryIncrease = afterMemory.heapUsed - beforeMemory.heapUsed;

      // Should not use more than 100MB for 5000 items
      const maxMemoryMB = 100 * 1024 * 1024;
      if (memoryIncrease > maxMemoryMB) {
        throw new Error(`Memory usage too high: ${Math.round(memoryIncrease / 1024 / 1024)}MB`);
      }

      console.log(format.dim(`    Memory increase: ${Math.round(memoryIncrease / 1024 / 1024)}MB`));
      console.log(format.dim(`    Time: ${metric.average}ms`));
      return { metric, memoryIncrease };
    });

    // Test 6: Concurrent operations performance
    await this.test('Concurrent operations performance', async () => {
      const testProject = path.join(this.testRoot, 'concurrent-perf');
      await fs.mkdir(testProject, { recursive: true });
      await fs.mkdir(path.join(testProject, '.ai-workflow'), { recursive: true });

      const manager = new ManifestManager(testProject);

      const metric = await this.measurePerformance('Concurrent Operations', async () => {
        const promises = [];
        
        // 10 concurrent operations
        for (let i = 0; i < 10; i++) {
          promises.push(
            manager.addInstalledItem(`.ai-workflow/concurrent/file${i}.js`, 'installed_system_asset')
          );
        }
        
        await Promise.all(promises);
      }, 5);

      if (metric.average > 1000) throw new Error(`Concurrent operations too slow: ${metric.average}ms`);
      
      console.log(format.dim(`    Average: ${metric.average}ms (${metric.min}-${metric.max}ms)`));
      return metric;
    });

    // Test 7: File system efficiency
    await this.test('File system I/O efficiency', async () => {
      const testProject = path.join(this.testRoot, 'filesystem-test');
      await fs.mkdir(testProject, { recursive: true });
      await fs.mkdir(path.join(testProject, '.ai-workflow'), { recursive: true });

      const manager = new ManifestManager(testProject);
      const items = this.generateTestData(100, 'fs');

      // Test write performance
      const writeMetric = await this.measurePerformance('FS Write', async () => {
        await manager.writeInstallationManifest(items, '3.0.0-fs');
      }, 10);

      // Test read performance
      const readMetric = await this.measurePerformance('FS Read', async () => {
        await manager.loadInstallationManifest();
      }, 20);

      if (writeMetric.average > 200) throw new Error(`Write too slow: ${writeMetric.average}ms`);
      if (readMetric.average > 50) throw new Error(`Read too slow: ${readMetric.average}ms`);

      console.log(format.dim(`    Write: ${writeMetric.average}ms, Read: ${readMetric.average}ms`));
      return { writeMetric, readMetric };
    });

    // Test 8: JSON serialization performance
    await this.test('JSON serialization performance', async () => {
      const testProject = path.join(this.testRoot, 'json-test');
      await fs.mkdir(testProject, { recursive: true });
      await fs.mkdir(path.join(testProject, '.ai-workflow'), { recursive: true });

      const largeItems = this.generateTestData(2000, 'json');
      const manifest = {
        installerVersion: '3.0.0-json',
        installedAt: new Date().toISOString(),
        items: largeItems
      };

      const serializeMetric = await this.measurePerformance('JSON Serialize', () => {
        JSON.stringify(manifest, null, 2);
      }, 10);

      const jsonString = JSON.stringify(manifest, null, 2);
      const parseMetric = await this.measurePerformance('JSON Parse', () => {
        JSON.parse(jsonString);
      }, 10);

      if (serializeMetric.average > 100) throw new Error(`Serialization too slow: ${serializeMetric.average}ms`);
      if (parseMetric.average > 50) throw new Error(`Parsing too slow: ${parseMetric.average}ms`);

      console.log(format.dim(`    Serialize: ${serializeMetric.average}ms, Parse: ${parseMetric.average}ms`));
      console.log(format.dim(`    JSON size: ${Math.round(jsonString.length / 1024)}KB`));
      return { serializeMetric, parseMetric, size: jsonString.length };
    });

    await this.cleanup();
    
    // Print performance summary
    this.printPerformanceSummary();
    
    // Print test summary
    console.log('\n' + format.bold('Performance Test Results:'));
    console.log(format.green(`  Passed: ${this.passed}`));
    if (this.failed > 0) {
      console.log(format.red(`  Failed: ${this.failed}`));
    }
    console.log(format.dim(`  Total:  ${this.passed + this.failed}`));
    
    return this.failed === 0 ? 0 : 1;
  }

  printPerformanceSummary() {
    console.log('\n' + format.bold('⚡ Performance Metrics Summary:'));
    
    this.metrics.forEach(metric => {
      console.log(format.cyan(`  ${metric.name}:`));
      console.log(format.dim(`    Average: ${metric.average}ms`));
      console.log(format.dim(`    Range: ${metric.min}ms - ${metric.max}ms`));
      console.log(format.dim(`    Iterations: ${metric.iterations}`));
    });

    // Performance thresholds analysis
    console.log('\n' + format.bold('📊 Performance Analysis:'));
    
    const fastOps = this.metrics.filter(m => m.average < 100);
    const mediumOps = this.metrics.filter(m => m.average >= 100 && m.average < 500);
    const slowOps = this.metrics.filter(m => m.average >= 500);

    if (fastOps.length > 0) {
      console.log(format.green(`  Fast operations (< 100ms): ${fastOps.length}`));
    }
    if (mediumOps.length > 0) {
      console.log(format.yellow(`  Medium operations (100-500ms): ${mediumOps.length}`));
    }
    if (slowOps.length > 0) {
      console.log(format.red(`  Slow operations (> 500ms): ${slowOps.length}`));
      slowOps.forEach(op => {
        console.log(format.dim(`    - ${op.name}: ${op.average}ms`));
      });
    }

    // Overall assessment
    const overallHealth = slowOps.length === 0 ? 'EXCELLENT' : 
                         slowOps.length <= 2 ? 'GOOD' : 'NEEDS_IMPROVEMENT';
    
    const healthColor = overallHealth === 'EXCELLENT' ? format.green :
                       overallHealth === 'GOOD' ? format.yellow : format.red;
    
    console.log(`\n${healthColor(`  Overall Performance: ${overallHealth}`)}`);
  }
}

// Run tests if executed directly
if (require.main === module) {
  const tester = new PerformanceTests();
  tester.runTests()
    .then(exitCode => {
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('❌ Performance test suite error:', error);
      process.exit(1);
    });
}

module.exports = PerformanceTests;