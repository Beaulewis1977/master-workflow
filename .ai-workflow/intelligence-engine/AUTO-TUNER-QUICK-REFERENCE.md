# Auto-Tuner Quick Reference Guide

## Installation & Setup

```javascript
const AutoTuner = require('./auto-tuner');
const PerformanceMonitor = require('./performance-monitor');

// Create instances
const tuner = new AutoTuner({
  strategy: 'auto',           // Strategy: auto, bayesian, grid, genetic, annealing, bandit
  maxIterations: 100,         // Maximum tuning iterations
  improvementTarget: 0.20     // 20% improvement target
});

const perfMonitor = new PerformanceMonitor();

// Initialize and start
await tuner.initialize(perfMonitor);
await tuner.startTuning();
```

---

## Quick Start Commands

### 1. Fast Optimization (10-20 minutes)
```javascript
const tuner = new AutoTuner({
  strategy: 'bandit',
  maxIterations: 20,
  improvementTarget: 0.10
});
```

### 2. Best Performance (60-80 minutes)
```javascript
const tuner = new AutoTuner({
  strategy: 'genetic',
  maxIterations: 80,
  improvementTarget: 0.25
});
```

### 3. Production Safe (40-50 minutes)
```javascript
const tuner = new AutoTuner({
  strategy: 'bayesian',
  maxIterations: 50,
  improvementTarget: 0.20,
  enableRollback: true,
  regressionThreshold: -0.05
});
```

---

## Strategy Selection Guide

| Use Case | Strategy | Time | Improvement |
|----------|----------|------|-------------|
| **Quick wins** | `bandit` | 10-20 min | 10-18% |
| **Production deployment** | `bayesian` | 30-50 min | 15-25% |
| **Maximum performance** | `genetic` | 40-80 min | 15-30% |
| **Parameter exploration** | `grid` | 50-100 min | 10-20% |
| **Fine-tuning** | `annealing` | 60-100 min | 12-22% |
| **Don't know** | `auto` | 40-60 min | 20-30% |

---

## Configuration Options

### Core Options
```javascript
{
  strategy: 'auto',                    // Optimization strategy
  maxIterations: 100,                  // Max tuning iterations
  improvementTarget: 0.20,             // Target improvement (20%)
  convergenceThreshold: 0.01,          // Convergence threshold (1%)

  // Non-disruptive tuning
  gradualChangeRate: 0.1,              // Max 10% change per step
  stabilizationPeriod: 30000,          // 30s stabilization
  measurementPeriod: 60000,            // 60s measurement

  // Safety
  regressionThreshold: -0.05,          // -5% is regression
  enableRollback: true,                // Enable rollback
  maxRollbacks: 3,                     // Max consecutive rollbacks

  // Persistence
  enablePersistence: true,             // Save configurations
  configPath: './tuning-configs',      // Config directory

  // Monitoring
  enableMonitoring: true,              // Enable monitoring
  monitoringInterval: 5000             // 5s monitoring
}
```

---

## Events

### Listen for Events
```javascript
// Initialization
tuner.on('initialized', (data) => {
  console.log('Baseline score:', data.baseline.score);
});

// Progress updates
tuner.on('progress', (progress) => {
  console.log(`Progress: ${progress.progress}%`);
  console.log(`Best improvement: ${progress.bestImprovement}%`);
});

// New best configuration
tuner.on('new-best', (data) => {
  console.log('New best config found!');
  console.log('Improvement:', data.performance.improvement);
  console.log('Config:', data.config);
});

// Rollback events
tuner.on('rollback', (data) => {
  console.log('Rolled back to previous config');
});

// Completion
tuner.on('tuning-complete', (result) => {
  console.log('Tuning complete!');
  console.log('Final improvement:', result.improvement);
  console.log('Iterations:', result.iterations);
  console.log('Best config:', result.bestConfiguration);
});
```

---

## API Methods

### Control Methods
```javascript
// Start tuning
await tuner.startTuning();

// Stop tuning
tuner.stop();

// Get current status
const status = tuner.getStatus();
console.log(status.improvement);
console.log(status.bestConfiguration);
```

### Configuration Methods
```javascript
// Get preset configurations
const lowResource = tuner.getLowResourceConfig();
const balanced = tuner.getBalancedConfig();
const highPerf = tuner.getHighPerformanceConfig();
const memoryOpt = tuner.getMemoryOptimizedConfig();
const cpuOpt = tuner.getCPUOptimizedConfig();

// Generate random configuration
const random = tuner.randomConfiguration();

// Get current configuration
const current = tuner.getCurrentConfiguration();

// Apply configuration manually
await tuner.applyConfiguration(config);
```

### Utility Methods
```javascript
// Calculate distance between configs
const distance = tuner.configDistance(config1, config2);

// Measure current performance
const perf = await tuner.measurePerformance();

// Check for regression
const isRegression = tuner.detectRegression(performance);

// Rollback to previous config
await tuner.rollback();
```

---

## Preset Configurations

### Low Resources (4 workers, minimal memory)
```javascript
{
  workerPool: 4,
  memoryThreshold: 0.6,
  gcInterval: 30000,
  gpuBatchSize: 16,
  gpuMemoryPool: 256,
  networkTimeout: 60000,
  networkRetries: 5,
  cacheSize: 500,
  cacheEvictionPolicy: 'lru'
}
```

### Balanced (16 workers, moderate resources)
```javascript
{
  workerPool: 16,
  memoryThreshold: 0.75,
  gcInterval: 60000,
  gpuBatchSize: 32,
  gpuMemoryPool: 512,
  networkTimeout: 30000,
  networkRetries: 3,
  cacheSize: 1000,
  cacheEvictionPolicy: 'lru'
}
```

### High Performance (32 workers, maximum resources)
```javascript
{
  workerPool: 32,
  memoryThreshold: 0.9,
  gcInterval: 120000,
  gpuBatchSize: 128,
  gpuMemoryPool: 2048,
  networkTimeout: 10000,
  networkRetries: 1,
  cacheSize: 5000,
  cacheEvictionPolicy: 'lfu'
}
```

---

## Performance Metrics

### Measured Metrics
- **Response Time**: API/request response time (ms)
- **Throughput**: Requests per second
- **Memory Usage**: Heap utilization (%)
- **CPU Usage**: CPU utilization (%)

### Composite Score
```javascript
Score =
  0.30 * (1000 - responseTime) / 1000 +
  0.40 * throughput / 1000 +
  0.15 * (100 - memoryUsage) / 100 +
  0.15 * (100 - cpuUsage) / 100
```

### Expected Improvements
- Response Time: 30-50% reduction
- Throughput: 50-80% increase
- Memory Usage: 20-40% reduction
- CPU Usage: 25-40% reduction

---

## Common Patterns

### Pattern 1: Quick Initial Optimization
```javascript
// Step 1: Fast optimization with bandit
const quickTuner = new AutoTuner({
  strategy: 'bandit',
  maxIterations: 20
});
await quickTuner.startTuning();
const quickConfig = quickTuner.getStatus().bestConfiguration;

// Step 2: Fine-tune with bayesian
const fineTuner = new AutoTuner({
  strategy: 'bayesian',
  maxIterations: 40
});
await fineTuner.initialize(perfMonitor);
await fineTuner.applyConfiguration(quickConfig);
await fineTuner.startTuning();
```

### Pattern 2: A/B Testing
```javascript
// Test configuration A
await tuner.applyConfiguration(configA);
await tuner.stabilize();
const perfA = await tuner.measurePerformance();

// Test configuration B
await tuner.applyConfiguration(configB);
await tuner.stabilize();
const perfB = await tuner.measurePerformance();

// Compare
const winner = perfA.score > perfB.score ? configA : configB;
```

### Pattern 3: Scheduled Tuning
```javascript
// Run tuning daily at 2 AM
const schedule = require('node-schedule');

schedule.scheduleJob('0 2 * * *', async () => {
  console.log('Starting scheduled tuning...');

  const tuner = new AutoTuner({
    strategy: 'auto',
    maxIterations: 50
  });

  await tuner.initialize(perfMonitor);
  await tuner.startTuning();

  const result = tuner.getStatus();
  console.log('Tuning complete:', result.improvement);
});
```

### Pattern 4: Continuous Monitoring
```javascript
// Monitor and re-tune if performance degrades
perfMonitor.on('performance-degradation', async () => {
  console.log('Performance degradation detected, re-tuning...');

  const tuner = new AutoTuner({
    strategy: 'bayesian',
    maxIterations: 30
  });

  await tuner.initialize(perfMonitor);
  await tuner.startTuning();
});
```

---

## Troubleshooting

### Problem: Tuning Not Improving Performance

**Possible Causes**:
- Baseline too high (already optimized)
- Measurement noise
- External factors affecting performance

**Solutions**:
```javascript
// Increase measurement period
const tuner = new AutoTuner({
  measurementPeriod: 120000  // 2 minutes
});

// Use longer stabilization
const tuner = new AutoTuner({
  stabilizationPeriod: 60000  // 1 minute
});

// Try different strategy
const tuner = new AutoTuner({
  strategy: 'genetic'  // Better for complex landscapes
});
```

### Problem: Too Many Rollbacks

**Possible Causes**:
- Aggressive change rate
- High performance variance
- Too strict regression threshold

**Solutions**:
```javascript
// More gradual changes
const tuner = new AutoTuner({
  gradualChangeRate: 0.05  // 5% changes
});

// Less strict regression threshold
const tuner = new AutoTuner({
  regressionThreshold: -0.10  // -10% before rollback
});

// More rollbacks allowed
const tuner = new AutoTuner({
  maxRollbacks: 5
});
```

### Problem: Tuning Takes Too Long

**Solutions**:
```javascript
// Reduce iterations
const tuner = new AutoTuner({
  maxIterations: 30
});

// Use faster strategy
const tuner = new AutoTuner({
  strategy: 'bandit'
});

// Reduce measurement time
const tuner = new AutoTuner({
  stabilizationPeriod: 15000,  // 15s
  measurementPeriod: 30000     // 30s
});
```

### Problem: Not Converging

**Possible Causes**:
- Complex parameter landscape
- Too low iteration limit
- High variance in measurements

**Solutions**:
```javascript
// Increase iterations
const tuner = new AutoTuner({
  maxIterations: 150
});

// Use genetic algorithm
const tuner = new AutoTuner({
  strategy: 'genetic'  // Better for complex spaces
});

// Lower improvement target
const tuner = new AutoTuner({
  improvementTarget: 0.10  // 10% instead of 20%
});
```

---

## Best Practices

### ✅ DO

- **Establish baseline during stable operation**
- **Use auto strategy when unsure**
- **Enable rollback in production**
- **Monitor system during tuning**
- **Start with conservative settings**
- **Save best configurations**
- **Run during off-peak hours**

### ❌ DON'T

- **Tune during traffic spikes**
- **Disable rollback in production**
- **Set aggressive change rates**
- **Ignore performance alerts**
- **Tune during incidents**
- **Skip baseline establishment**
- **Use production for experiments**

---

## Performance Tips

### Tip 1: Two-Phase Tuning
```javascript
// Phase 1: Fast exploration (20 iterations)
// Phase 2: Fine-tuning (40 iterations)
```

### Tip 2: Parameter Prioritization
Focus on high-impact parameters first:
1. Worker Pool Size (high impact)
2. Memory Threshold (high impact)
3. GPU Batch Size (high impact)
4. Cache Size (medium impact)
5. Network timeouts (medium impact)

### Tip 3: Gradual Rollout
```javascript
// Test on staging first
await tuner.startTuning(); // on staging

// Apply to production gradually
// Apply to 10% → 50% → 100% of servers
```

---

## File Locations

### Auto-Tuner Files
```
.ai-workflow/intelligence-engine/
├── auto-tuner.js                          # Main implementation
├── test-auto-tuner.js                     # Test suite
├── AUTO-TUNER-IMPLEMENTATION-SUMMARY.md   # Full documentation
└── AUTO-TUNER-QUICK-REFERENCE.md          # This file
```

### Configuration Files
```
.ai-workflow/intelligence-engine/tuning-configs/
├── best-configuration.json
├── config-{timestamp}.json
└── tuning-results-{timestamp}.json
```

---

## Command Line Testing

### Run Full Test Suite
```bash
cd .ai-workflow/intelligence-engine
node test-auto-tuner.js
```

### Run Single Strategy Test
```bash
node -e "
const { testStrategy } = require('./test-auto-tuner');
testStrategy('bayesian').then(() => console.log('Done'));
"
```

### Quick Performance Test
```bash
node -e "
const AutoTuner = require('./auto-tuner');
const tuner = new AutoTuner({ strategy: 'bandit', maxIterations: 10 });
// ... initialize and run
"
```

---

## Integration Examples

### With Queen Controller
```javascript
const queenController = new QueenController();

tuner.on('configuration-changed', (config) => {
  queenController.updateWorkerPool(config.workerPool);
  queenController.updateMemoryThreshold(config.memoryThreshold);
});
```

### With Shared Memory
```javascript
tuner.on('tuning-complete', async (result) => {
  await sharedMemory.set('optimal-config', result.bestConfiguration);
  await sharedMemory.set('performance-baseline', result.baseline);
});
```

### With Monitoring Dashboard
```javascript
tuner.on('progress', (progress) => {
  dashboard.updateProgress(progress.progress);
  dashboard.updateImprovement(progress.bestImprovement);
});
```

---

## Version Info

- **Version**: 3.0.0
- **Implementation Date**: November 20, 2025
- **Node.js**: v18+
- **Dependencies**: None (pure Node.js)

---

## Support

For issues or questions:
1. Check AUTO-TUNER-IMPLEMENTATION-SUMMARY.md
2. Review test cases in test-auto-tuner.js
3. Enable debug logging
4. Check configuration files in tuning-configs/

---

**Quick Reference Version**: 1.0.0
**Last Updated**: November 20, 2025
