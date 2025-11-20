# Predictive Analytics Engine - Quick Start Guide

## 🚀 5-Minute Setup

### 1. Initialize the Engine

```javascript
const { PredictiveAnalyticsEngine } = require('./predictive-analytics');

const analytics = new PredictiveAnalyticsEngine({
    enableGPU: true,           // Enable GPU acceleration
    updateInterval: 30000      // Update every 30 seconds
});

await analytics.initialize();
```

### 2. Generate a Prediction

```javascript
const prediction = await analytics.predict(
    // Workflow data
    {
        id: 'my-workflow',
        type: 'code-analysis',
        complexity: 7,
        taskCount: 5
    },
    // System metrics
    {
        agents: {
            'test-runner': { utilization: 0.75 }
        },
        resources: {
            cpu: 0.65,
            memory: 0.72
        },
        metrics: {
            cpu: 0.65,
            successRate: 0.92
        }
    }
);

console.log('Success Probability:', prediction.workflowSuccessProbability);
console.log('Estimated Time:', prediction.estimatedCompletionTime, 'ms');
```

### 3. Update Metrics (Real-time)

```javascript
setInterval(async () => {
    await analytics.update(Date.now(), {
        cpu: getCurrentCPU(),
        memory: getCurrentMemory(),
        duration: getLastDuration(),
        successRate: getSuccessRate()
    });
}, 30000);
```

## 📊 Common Use Cases

### Predict Workflow Success

```javascript
const { workflowSuccessProbability, confidenceInterval } =
    await analytics.predict(workflowData, systemMetrics);

if (workflowSuccessProbability < 0.7) {
    console.warn('Low success probability - consider optimization');
}
```

### Detect Bottlenecks

```javascript
const prediction = await analytics.predict(workflowData, systemMetrics);

if (prediction.bottlenecks.length > 0) {
    console.log('Bottlenecks detected:');
    prediction.bottlenecks.forEach(b => {
        console.log(`  - ${b.type}: ${b.severity}`);
        console.log(`    Recommendation: ${b.recommendation}`);
    });
}
```

### Optimize Costs

```javascript
const prediction = await analytics.predict(workflowData, systemMetrics);
const { costOptimization } = prediction;

console.log(`Current Cost: $${costOptimization.currentCost}`);
console.log(`Potential Savings: $${costOptimization.savings}`);

costOptimization.recommendations.forEach(rec => {
    console.log(`  - ${rec.description}`);
    console.log(`    Savings: $${rec.savings}`);
});
```

### Detect Anomalies

```javascript
const prediction = await analytics.predict(workflowData, systemMetrics);

if (prediction.anomalies.length > 0) {
    prediction.anomalies.forEach(anomaly => {
        console.log(`Anomaly detected in ${anomaly.metric}`);
        console.log(`Severity: ${anomaly.severity}`);
        console.log(`Deviation: ${anomaly.deviation[anomaly.metric].zScore} σ`);
    });
}
```

### Analyze Trends

```javascript
const prediction = await analytics.predict(workflowData, systemMetrics);
const { trends } = prediction;

console.log('Success Rate Trend:', trends.successRate.direction);
console.log('Average Time Trend:', trends.averageTime.direction);
```

## 🎯 Dashboard Integration

### Get Dashboard Data

```javascript
const dashboardData = analytics.getDashboardData();

// Use in your dashboard
return {
    forecasts: dashboardData.forecasts,      // Time series charts
    anomalies: dashboardData.anomalies,      // Recent anomalies
    bottlenecks: dashboardData.bottlenecks,  // Recent bottlenecks
    costs: dashboardData.costs,              // Cost history
    performance: dashboardData.performance   // Engine stats
};
```

### Express.js Example

```javascript
const express = require('express');
const app = express();

app.get('/api/analytics/predict', async (req, res) => {
    const prediction = await analytics.predict(
        req.body.workflow,
        req.body.systemMetrics
    );
    res.json(prediction);
});

app.get('/api/analytics/dashboard', async (req, res) => {
    res.json(analytics.getDashboardData());
});

app.listen(3000);
```

## ⚡ Performance Tips

### 1. Enable GPU Acceleration

```javascript
const analytics = new PredictiveAnalyticsEngine({
    enableGPU: true,                    // Enable GPU
    memoryPoolSize: 512 * 1024 * 1024  // 512MB pool
});
```

### 2. Batch Updates

```javascript
// Instead of updating individually
const metrics = collectMetrics(); // Collect all at once
await analytics.update(Date.now(), metrics);
```

### 3. Use Prediction Cache

```javascript
// Predictions are automatically cached for 1 minute
// Identical requests within 1 minute use cached results
const pred1 = await analytics.predict(workflow, metrics); // Computed
const pred2 = await analytics.predict(workflow, metrics); // Cached (instant)
```

## 🔧 Configuration Options

### Full Configuration

```javascript
const analytics = new PredictiveAnalyticsEngine({
    // GPU settings
    enableGPU: true,
    memoryPoolSize: 512 * 1024 * 1024,

    // Update settings
    updateInterval: 30000,

    // Time series forecaster
    forecaster: {
        horizonMinutes: 60,
        windowSize: 20,
        features: ['cpu', 'memory', 'duration', 'successRate']
    },

    // Bottleneck detector
    bottleneck: {
        capacityThreshold: 0.8,
        responseTimeThreshold: 5000,
        queueThreshold: 10
    },

    // Cost optimizer
    cost: {
        costPerCPUHour: 0.05,
        costPerGBMemoryHour: 0.01,
        costPerGPUHour: 0.50,
        costPerGBTransfer: 0.001
    },

    // Anomaly detector
    anomaly: {
        contamination: 0.05,
        numTrees: 100,
        sampleSize: 256,
        features: ['cpu', 'memory', 'duration', 'errorRate']
    },

    // Trend analyzer
    trend: {
        features: ['successRate', 'averageTime', 'errorRate', 'throughput'],
        seasonalityPeriods: [24, 168],
        trendWindowSize: 50
    }
});
```

## 📈 Monitoring

### Check Engine Status

```javascript
const status = analytics.getStatus();

console.log('Initialized:', status.initialized);
console.log('GPU Enabled:', status.gpuEnabled);
console.log('Total Predictions:', status.performance.predictions);
console.log('Average Latency:', status.performance.averageLatency, 'ms');
```

### Listen to Events

```javascript
analytics.on('initialized', () => {
    console.log('Engine ready');
});

analytics.on('prediction', (prediction) => {
    console.log('New prediction:', prediction);
});

analytics.on('periodic-update', () => {
    console.log('Periodic update completed');
});
```

## 🛠️ Troubleshooting

### Issue: Slow Predictions (>50ms)

**Solution:**
```javascript
// Check GPU status
const status = analytics.getStatus();
if (!status.gpuEnabled) {
    console.log('GPU not enabled - consider enabling GPU acceleration');
}

// Reduce window size
const analytics = new PredictiveAnalyticsEngine({
    forecaster: { windowSize: 10 }  // Reduce from 20
});
```

### Issue: Inaccurate Predictions

**Solution:**
```javascript
// Ensure sufficient historical data
const status = analytics.getStatus();
if (status.components.forecaster.timeSeriesSize < 50) {
    console.log('Need more historical data for accurate predictions');
}

// Add more training data
for (let i = 0; i < 100; i++) {
    await analytics.update(timestamp, metrics);
}
```

### Issue: High False Positive Rate

**Solution:**
```javascript
// Adjust contamination rate
const analytics = new PredictiveAnalyticsEngine({
    anomaly: {
        contamination: 0.03  // Reduce from 0.05 (5% to 3%)
    }
});
```

## 📚 Complete Example

```javascript
const { PredictiveAnalyticsEngine } = require('./predictive-analytics');
const { NeuralLearningSystem } = require('./neural-learning');

async function main() {
    // 1. Initialize systems
    const neuralSystem = new NeuralLearningSystem();
    await neuralSystem.initialize();

    const analytics = new PredictiveAnalyticsEngine({
        enableGPU: true,
        updateInterval: 30000
    });

    await analytics.initialize(neuralSystem);

    // 2. Add historical data
    for (let i = 0; i < 50; i++) {
        await analytics.update(Date.now() - i * 60000, {
            cpu: 0.5 + Math.random() * 0.3,
            memory: 0.6 + Math.random() * 0.2,
            duration: 40000 + Math.random() * 20000,
            successRate: 0.85 + Math.random() * 0.1
        });
    }

    // 3. Make prediction
    const prediction = await analytics.predict(
        {
            id: 'workflow-1',
            type: 'code-analysis',
            complexity: 7
        },
        {
            agents: {
                'test-runner': { utilization: 0.75 }
            },
            resources: {
                cpu: 0.65,
                memory: 0.72
            },
            metrics: {
                cpu: 0.65,
                successRate: 0.92
            }
        }
    );

    // 4. Use results
    console.log('\n=== Prediction Results ===');
    console.log('Success Probability:',
        (prediction.workflowSuccessProbability * 100).toFixed(1) + '%');
    console.log('Estimated Time:',
        prediction.estimatedCompletionTime, 'ms');
    console.log('Confidence Interval:',
        prediction.confidenceInterval);
    console.log('Bottlenecks:', prediction.bottlenecks.length);
    console.log('Anomalies:', prediction.anomalies.length);
    console.log('Cost Savings:',
        '$' + prediction.costOptimization.savings.toFixed(2));
    console.log('Prediction Latency:',
        prediction.performance.latency, 'ms');

    // 5. Act on results
    if (prediction.workflowSuccessProbability < 0.7) {
        console.log('\n⚠️ Low success probability - reviewing bottlenecks...');
        prediction.bottlenecks.forEach(b => {
            console.log(`  - ${b.type}: ${b.recommendation}`);
        });
    }

    if (prediction.anomalies.length > 0) {
        console.log('\n🚨 Anomalies detected - investigating...');
        prediction.anomalies.forEach(a => {
            console.log(`  - ${a.metric}: ${a.severity} severity`);
        });
    }

    if (prediction.costOptimization.savings > 10) {
        console.log('\n💰 Cost optimization opportunities...');
        prediction.costOptimization.recommendations.forEach(r => {
            console.log(`  - ${r.description}`);
        });
    }

    // 6. Get dashboard data
    const dashboardData = analytics.getDashboardData();
    console.log('\n📊 Dashboard data available for visualization');

    // 7. Cleanup
    await analytics.shutdown();
}

main().catch(console.error);
```

## 🎓 Next Steps

1. **Read Full Documentation**: [PREDICTIVE-ANALYTICS-README.md](./PREDICTIVE-ANALYTICS-README.md)
2. **Run Tests**: `node test-predictive-analytics.js`
3. **Explore Examples**: Check `predictive-analytics.js` (bottom section)
4. **Integrate with Dashboard**: Use `getDashboardData()` for visualization
5. **Optimize Configuration**: Tune parameters for your use case

## 🔗 Related Files

- **Implementation**: `predictive-analytics.js`
- **Tests**: `test-predictive-analytics.js`
- **Full Docs**: `PREDICTIVE-ANALYTICS-README.md`
- **Summary**: `PHASE-10-PREDICTIVE-ANALYTICS-SUMMARY.md`

## 💡 Quick Tips

✅ Always initialize before using
✅ Provide historical data for accuracy
✅ Enable GPU for better performance
✅ Monitor prediction latency
✅ Act on bottleneck recommendations
✅ Review cost optimization suggestions
✅ Investigate anomalies promptly
✅ Track trends for long-term planning

---

**Version**: 1.0.0
**Status**: Production Ready ✅
**Support**: See full documentation for detailed API reference
