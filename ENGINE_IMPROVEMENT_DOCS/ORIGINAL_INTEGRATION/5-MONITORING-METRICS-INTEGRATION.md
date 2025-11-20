# Monitoring & Metrics Integration Implementation Plan

## 📋 **Overview**

Integration of the original claude-flow's comprehensive monitoring and metrics system into your Queen Controller for real-time visibility, performance analytics, and intelligent alerting.

---

## 🎯 **Source Analysis**

### **Original Location**
- **File**: `src/coordination/swarm-monitor.ts`, `src/coordination/metrics.ts`
- **Repository**: https://github.com/ruvnet/claude-flow
- **Purpose**: Real-time monitoring, metrics collection, and health tracking

### **Key Components to Extract**
1. **SwarmMonitor** class for real-time monitoring
2. **MetricsCollector** for performance analytics
3. **HealthChecker** for system health assessment
4. **AlertManager** for intelligent alerting
5. **PerformanceTracker** for optimization insights
6. **ResourceMonitor** for system resource tracking

---

## 🏗️ **Implementation Plan**

### **Phase 1: Core Monitoring Infrastructure (Days 1-2)**

#### **1.1 Create Monitoring System**
**Target File**: `src/coordination/monitoring-system.js`

```javascript
// Extract from original: src/coordination/swarm-monitor.ts, metrics.ts
// Convert TypeScript to JavaScript
// Integrate with your Queen Controller

const EventEmitter = require('events');

class MonitoringSystem extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      enabled: true,
      updateInterval: 1000,          // Update every second
      enableAlerts: true,
      enableHistory: true,
      maxHistorySize: 1000,          // Keep last 1000 data points
      alertThresholds: {
        cpuUsage: 80,                // Alert if CPU > 80%
        memoryUsage: 85,             // Alert if memory > 85%
        taskFailureRate: 20,         // Alert if failure rate > 20%
        agentFailureRate: 30,        // Alert if agent failure rate > 30%
        queueSize: 100               // Alert if task queue > 100
      },
      ...config
    };

    this.isRunning = false;
    this.updateTimer = null;
    this.metrics = new Map();
    this.history = [];
    this.alerts = [];
    this.startTime = new Date();
  }

  async initialize() {
    if (!this.config.enabled) {
      console.log('Monitoring system disabled');
      return;
    }

    console.log('Initializing monitoring system...');
    this.isRunning = true;
    this.startMonitoring();
    this.emit('monitoring:initialized');
  }

  startMonitoring() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }

    this.updateTimer = setInterval(() => {
      this.collectMetrics();
      this.checkAlerts();
      this.updateHistory();
    }, this.config.updateInterval);

    console.log(`Monitoring started with ${this.config.updateInterval}ms interval`);
  }

  stopMonitoring() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }

    this.isRunning = false;
    console.log('Monitoring stopped');
  }

  collectMetrics() {
    const timestamp = new Date();
    const metrics = {
      timestamp,
      system: this.collectSystemMetrics(),
      agents: this.collectAgentMetrics(),
      tasks: this.collectTaskMetrics(),
      performance: this.collectPerformanceMetrics(),
      resources: this.collectResourceMetrics()
    };

    // Store current metrics
    this.metrics.set(timestamp, metrics);

    // Emit metrics event
    this.emit('metrics:collected', metrics);

    return metrics;
  }

  collectSystemMetrics() {
    const uptime = Date.now() - this.startTime.getTime();
    
    return {
      uptime,
      startTime: this.startTime,
      status: this.isRunning ? 'running' : 'stopped',
      totalAgents: this.agentCount || 0,
      activeAgents: this.activeAgentCount || 0,
      totalTasks: this.totalTaskCount || 0,
      completedTasks: this.completedTaskCount || 0,
      failedTasks: this.failedTaskCount || 0,
      pendingTasks: this.pendingTaskCount || 0
    };
  }

  collectAgentMetrics() {
    const agents = this.agents || new Map();
    const agentMetrics = {
      total: agents.size,
      active: 0,
      idle: 0,
      busy: 0,
      failed: 0,
      averageLoad: 0,
      totalUtilization: 0
    };

    let totalLoad = 0;
    
    for (const [agentId, agent] of agents) {
      switch (agent.status) {
        case 'busy':
        case 'running':
          agentMetrics.busy++;
          agentMetrics.active++;
          break;
        case 'idle':
        case 'available':
          agentMetrics.idle++;
          break;
        case 'failed':
          agentMetrics.failed++;
          break;
        default:
          agentMetrics.idle++;
      }

      // Calculate load
      const load = this.calculateAgentLoad(agent);
      totalLoad += load;
    }

    agentMetrics.averageLoad = agents.size > 0 ? totalLoad / agents.size : 0;
    agentMetrics.totalUtilization = agents.size > 0 ? (agentMetrics.busy / agents.size * 100) : 0;

    return agentMetrics;
  }

  collectTaskMetrics() {
    const tasks = this.tasks || new Map();
    const taskMetrics = {
      total: tasks.size,
      completed: 0,
      failed: 0,
      running: 0,
      pending: 0,
      averageCompletionTime: 0,
      failureRate: 0,
      throughput: 0
    };

    let totalCompletionTime = 0;
    let completedCount = 0;

    for (const [taskId, task] of tasks) {
      switch (task.status) {
        case 'completed':
          taskMetrics.completed++;
          if (task.completedAt && task.startedAt) {
            totalCompletionTime += task.completedAt - task.startedAt;
            completedCount++;
          }
          break;
        case 'failed':
          taskMetrics.failed++;
          break;
        case 'running':
          taskMetrics.running++;
          break;
        case 'pending':
          taskMetrics.pending++;
          break;
      }
    }

    taskMetrics.averageCompletionTime = completedCount > 0 ? totalCompletionTime / completedCount : 0;
    taskMetrics.failureRate = taskMetrics.total > 0 ? (taskMetrics.failed / taskMetrics.total * 100) : 0;
    
    // Calculate throughput (tasks per minute)
    const uptimeMinutes = (Date.now() - this.startTime.getTime()) / (1000 * 60);
    taskMetrics.throughput = uptimeMinutes > 0 ? (taskMetrics.completed / uptimeMinutes) : 0;

    return taskMetrics;
  }

  collectPerformanceMetrics() {
    return {
      averageTaskLatency: this.calculateAverageLatency(),
      queueProcessingTime: this.calculateQueueProcessingTime(),
      resourceUtilization: this.calculateResourceUtilization(),
      systemEfficiency: this.calculateSystemEfficiency(),
      bottleneckDetection: this.detectBottlenecks()
    };
  }

  collectResourceMetrics() {
    // This would integrate with your existing resource monitor
    if (this.resourceMonitor) {
      return {
        cpuUsage: this.resourceMonitor.getCurrentCpuUsage(),
        memoryUsage: this.resourceMonitor.getCurrentMemoryUsage(),
        diskUsage: this.resourceMonitor.getCurrentDiskUsage(),
        networkIO: this.resourceMonitor.getCurrentNetworkIO()
      };
    }

    return {
      cpuUsage: 0,
      memoryUsage: 0,
      diskUsage: 0,
      networkIO: 0
    };
  }

  calculateAgentLoad(agent) {
    if (!agent.currentTasks) return 0;
    return agent.currentTasks.size;
  }

  calculateAverageLatency() {
    // Calculate average task completion latency
    const tasks = this.tasks || new Map();
    let totalLatency = 0;
    let count = 0;

    for (const [taskId, task] of tasks) {
      if (task.completedAt && task.startedAt) {
        totalLatency += task.completedAt - task.startedAt;
        count++;
      }
    }

    return count > 0 ? totalLatency / count : 0;
  }

  calculateQueueProcessingTime() {
    // Calculate how long tasks spend in queue
    const tasks = this.tasks || new Map();
    let totalQueueTime = 0;
    let count = 0;

    for (const [taskId, task] of tasks) {
      if (task.startedAt && task.createdAt) {
        totalQueueTime += task.startedAt - task.createdAt;
        count++;
      }
    }

    return count > 0 ? totalQueueTime / count : 0;
  }

  calculateResourceUtilization() {
    if (!this.resourceMonitor) return 0;
    
    const cpu = this.resourceMonitor.getCurrentCpuUsage();
    const memory = this.resourceMonitor.getCurrentMemoryUsage();
    
    return (cpu + memory) / 2;
  }

  calculateSystemEfficiency() {
    const taskMetrics = this.collectTaskMetrics();
    const agentMetrics = this.collectAgentMetrics();
    
    if (taskMetrics.total === 0) return 0;
    
    const successRate = (taskMetrics.completed / taskMetrics.total) * 100;
    const utilizationRate = agentMetrics.totalUtilization;
    
    return (successRate + utilizationRate) / 2;
  }

  detectBottlenecks() {
    const bottlenecks = [];
    
    // Check for common bottlenecks
    const agentMetrics = this.collectAgentMetrics();
    const taskMetrics = this.collectTaskMetrics();
    
    if (agentMetrics.totalUtilization > 90) {
      bottlenecks.push({
        type: 'agent_overload',
        severity: 'high',
        description: 'Agent utilization is very high',
        value: agentMetrics.totalUtilization
      });
    }
    
    if (taskMetrics.pending > 50) {
      bottlenecks.push({
        type: 'task_queue_backlog',
        severity: 'medium',
        description: 'Large task queue backlog',
        value: taskMetrics.pending
      });
    }
    
    if (taskMetrics.failureRate > 15) {
      bottlenecks.push({
        type: 'high_failure_rate',
        severity: 'high',
        description: 'High task failure rate',
        value: taskMetrics.failureRate
      });
    }
    
    return bottlenecks;
  }

  checkAlerts() {
    if (!this.config.enableAlerts) return;

    const currentMetrics = this.metrics.get(new Date());
    if (!currentMetrics) return;

    const alerts = [];

    // Check CPU usage
    if (currentMetrics.resources.cpuUsage > this.config.alertThresholds.cpuUsage) {
      alerts.push({
        type: 'cpu_usage',
        severity: 'warning',
        message: `CPU usage is ${currentMetrics.resources.cpuUsage}%`,
        value: currentMetrics.resources.cpuUsage,
        threshold: this.config.alertThresholds.cpuUsage
      });
    }

    // Check memory usage
    if (currentMetrics.resources.memoryUsage > this.config.alertThresholds.memoryUsage) {
      alerts.push({
        type: 'memory_usage',
        severity: 'warning',
        message: `Memory usage is ${currentMetrics.resources.memoryUsage}%`,
        value: currentMetrics.resources.memoryUsage,
        threshold: this.config.alertThresholds.memoryUsage
      });
    }

    // Check task failure rate
    if (currentMetrics.tasks.failureRate > this.config.alertThresholds.taskFailureRate) {
      alerts.push({
        type: 'task_failure_rate',
        severity: 'error',
        message: `Task failure rate is ${currentMetrics.tasks.failureRate.toFixed(2)}%`,
        value: currentMetrics.tasks.failureRate,
        threshold: this.config.alertThresholds.taskFailureRate
      });
    }

    // Check queue size
    if (currentMetrics.tasks.pending > this.config.alertThresholds.queueSize) {
      alerts.push({
        type: 'queue_size',
        severity: 'warning',
        message: `Task queue size is ${currentMetrics.tasks.pending}`,
        value: currentMetrics.tasks.pending,
        threshold: this.config.alertThresholds.queueSize
      });
    }

    // Emit alerts
    for (const alert of alerts) {
      this.alerts.push({ ...alert, timestamp: new Date() });
      this.emit('alert', alert);
    }

    // Keep only recent alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    return alerts;
  }

  updateHistory() {
    if (!this.config.enableHistory) return;

    const currentMetrics = this.metrics.get(new Date());
    if (currentMetrics) {
      this.history.push({
        timestamp: currentMetrics.timestamp,
        summary: {
          activeAgents: currentMetrics.agents.active,
          completedTasks: currentMetrics.tasks.completed,
          failureRate: currentMetrics.tasks.failureRate,
          systemEfficiency: currentMetrics.performance.systemEfficiency
        }
      });

      // Keep only recent history
      if (this.history.length > this.config.maxHistorySize) {
        this.history = this.history.slice(-this.config.maxHistorySize);
      }
    }
  }

  getCurrentMetrics() {
    return this.metrics.get(new Date()) || null;
  }

  getHistoricalMetrics(minutes = 60) {
    const cutoff = new Date(Date.now() - (minutes * 60 * 1000));
    return this.history.filter(entry => entry.timestamp >= cutoff);
  }

  getAlerts(minutes = 60) {
    const cutoff = new Date(Date.now() - (minutes * 60 * 1000));
    return this.alerts.filter(alert => alert.timestamp >= cutoff);
  }

  getSystemHealth() {
    const currentMetrics = this.getCurrentMetrics();
    if (!currentMetrics) return { status: 'unknown' };

    const health = {
      status: 'healthy',
      score: 100,
      issues: [],
      timestamp: new Date()
    };

    // Calculate health score
    let scoreDeduction = 0;

    if (currentMetrics.tasks.failureRate > 10) {
      scoreDeduction += 20;
      health.issues.push('High task failure rate');
    }

    if (currentMetrics.agents.totalUtilization > 85) {
      scoreDeduction += 15;
      health.issues.push('High agent utilization');
    }

    if (currentMetrics.resources.cpuUsage > 80) {
      scoreDeduction += 10;
      health.issues.push('High CPU usage');
    }

    if (currentMetrics.resources.memoryUsage > 85) {
      scoreDeduction += 10;
      health.issues.push('High memory usage');
    }

    health.score = Math.max(0, 100 - scoreDeduction);

    if (health.score >= 80) {
      health.status = 'healthy';
    } else if (health.score >= 60) {
      health.status = 'degraded';
    } else {
      health.status = 'unhealthy';
    }

    return health;
  }

  // Update method to set data sources
  updateDataSources(queenController) {
    this.agents = queenController.subAgents;
    this.tasks = queenController.tasks;
    this.agentCount = queenController.subAgents.size;
    this.activeAgentCount = queenController.activeAgents.size;
    this.totalTaskCount = queenController.tasks.size;
    this.completedTaskCount = queenController.metrics.tasksCompleted;
    this.failedTaskCount = queenController.metrics.errors.length;
    this.pendingTaskCount = queenController.pendingTasks.size;
    this.resourceMonitor = queenController.resourceMonitor;
  }
}

module.exports = MonitoringSystem;
```

### **Phase 2: Queen Controller Integration (Days 3-4)**

#### **2.1 Integration Points**
**Modify**: `.ai-workflow/intelligence-engine/queen-controller.js`

**Add to constructor**:
```javascript
// Advanced monitoring system
this.monitoringSystem = new MonitoringSystem({
  enabled: options.monitoring !== false,
  updateInterval: options.monitoringInterval || 1000,
  enableAlerts: options.enableAlerts !== false,
  enableHistory: options.enableHistory !== false,
  alertThresholds: {
    cpuUsage: options.cpuAlertThreshold || 80,
    memoryUsage: options.memoryAlertThreshold || 85,
    taskFailureRate: options.failureAlertThreshold || 20,
    ...options.alertThresholds
  }
});
```

**Add to initializeUnlimitedScaling()**:
```javascript
// Initialize monitoring system
if (this.monitoringSystem) {
  await this.monitoringSystem.initialize();
  this.monitoringSystem.updateDataSources(this);
  
  // Setup monitoring event handlers
  this.setupMonitoringEvents();
  
  console.log('Advanced monitoring system initialized');
}
```

#### **2.2 Monitoring Event Handlers**
**Add new method**:
```javascript
setupMonitoringEvents() {
  if (!this.monitoringSystem) return;

  // Listen for alerts
  this.monitoringSystem.on('alert', (alert) => {
    console.warn(`MONITORING ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`);
    
    // Handle critical alerts
    if (alert.severity === 'error') {
      this.handleCriticalAlert(alert);
    }
    
    // Emit to external systems
    this.emit('system:alert', alert);
  });

  // Listen for metrics collection
  this.monitoringSystem.on('metrics:collected', (metrics) => {
    // Update internal metrics
    this.updateInternalMetrics(metrics);
    
    // Emit metrics for external consumption
    this.emit('system:metrics', metrics);
  });

  // Periodic health check
  setInterval(() => {
    const health = this.monitoringSystem.getSystemHealth();
    if (health.status !== 'healthy') {
      this.emit('system:health', health);
    }
  }, 30000); // Check every 30 seconds
}

handleCriticalAlert(alert) {
  switch (alert.type) {
    case 'task_failure_rate':
      console.error('CRITICAL: High task failure rate detected');
      // Implement emergency response
      this.emergencyTaskFailureResponse();
      break;
      
    case 'cpu_usage':
      console.error('CRITICAL: High CPU usage detected');
      // Implement scaling response
      this.emergencyScalingResponse();
      break;
      
    case 'memory_usage':
      console.error('CRITICAL: High memory usage detected');
      // Implement memory cleanup
      this.emergencyMemoryCleanup();
      break;
  }
}

emergencyTaskFailureResponse() {
  // Stop accepting new tasks
  this.acceptingNewTasks = false;
  
  // Analyze failure patterns
  const recentFailures = this.metrics.errors.slice(-10);
  const failurePatterns = this.analyzeFailurePatterns(recentFailures);
  
  console.log('Emergency response activated - analyzing failure patterns:', failurePatterns);
  
  // Emit emergency event
  this.emit('system:emergency', {
    type: 'high_failure_rate',
    patterns: failurePatterns,
    timestamp: new Date()
  });
}

emergencyScalingResponse() {
  // Trigger emergency scaling down
  if (this.dynamicScaler) {
    this.dynamicScaler.emergencyScaleDown();
  }
  
  // Pause non-critical tasks
  this.pauseNonCriticalTasks();
  
  this.emit('system:emergency', {
    type: 'resource_overload',
    action: 'emergency_scale_down',
    timestamp: new Date()
  });
}

emergencyMemoryCleanup() {
  // Clear caches
  if (this.sharedMemoryStore) {
    this.sharedMemoryStore.clear();
  }
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  this.emit('system:emergency', {
    type: 'memory_pressure',
    action: 'cleanup',
    timestamp: new Date()
  });
}
```

#### **2.3 Enhanced Metrics Collection**
**Add metrics updates to existing methods**:
```javascript
// In assignTask method - after successful assignment
if (this.monitoringSystem) {
  this.monitoringSystem.updateDataSources(this);
}

// In handleTaskCompletion method
if (this.monitoringSystem) {
  this.monitoringSystem.updateDataSources(this);
}

// In handleTaskFailure method
if (this.monitoringSystem) {
  this.monitoringSystem.updateDataSources(this);
}
```

### **Phase 3: Advanced Features (Days 5-7)**

#### **3.1 Performance Analytics**
**Target File**: `src/coordination/performance-analytics.js`

```javascript
class PerformanceAnalytics {
  constructor(monitoringSystem) {
    this.monitoringSystem = monitoringSystem;
    this.analytics = {
      trends: new Map(),
      predictions: new Map(),
      recommendations: []
    };
  }

  analyzePerformanceTrends(timeframeMinutes = 60) {
    const historicalData = this.monitoringSystem.getHistoricalMetrics(timeframeMinutes);
    
    if (historicalData.length < 10) {
      return { error: 'Insufficient data for trend analysis' };
    }

    const trends = {
      taskThroughput: this.calculateTrend(historicalData, 'completedTasks'),
      failureRate: this.calculateTrend(historicalData, 'failureRate'),
      systemEfficiency: this.calculateTrend(historicalData, 'systemEfficiency'),
      agentUtilization: this.calculateTrend(historicalData, 'activeAgents')
    };

    // Store trends
    this.analytics.trends.set('latest', trends);

    return trends;
  }

  calculateTrend(data, metric) {
    const values = data.map(entry => entry.summary[metric] || 0);
    
    if (values.length < 2) return { trend: 'stable', change: 0 };

    // Simple linear regression for trend
    const n = values.length;
    const sumX = (n * (n - 1)) / 2; // Sum of indices
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, index) => sum + (index * val), 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6; // Sum of squares of indices

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const avgValue = sumY / n;

    let trend = 'stable';
    if (slope > avgValue * 0.1) trend = 'increasing';
    else if (slope < -avgValue * 0.1) trend = 'decreasing';

    return {
      trend,
      change: slope,
      average: avgValue,
      confidence: this.calculateConfidence(values)
    };
  }

  calculateConfidence(values) {
    // Simple confidence calculation based on variance
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Lower variance = higher confidence
    const coefficientOfVariation = standardDeviation / Math.abs(avg);
    
    if (coefficientOfVariation < 0.1) return 'high';
    if (coefficientOfVariation < 0.3) return 'medium';
    return 'low';
  }

  generateRecommendations() {
    const currentMetrics = this.monitoringSystem.getCurrentMetrics();
    const trends = this.analytics.trends.get('latest');
    
    if (!currentMetrics || !trends) {
      return [];
    }

    const recommendations = [];

    // Performance recommendations
    if (currentMetrics.tasks.failureRate > 15) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        title: 'High Task Failure Rate',
        description: 'Consider reviewing task assignments and agent capabilities',
        action: 'review_agent_capabilities'
      });
    }

    if (trends.systemEfficiency.trend === 'decreasing') {
      recommendations.push({
        type: 'optimization',
        priority: 'medium',
        title: 'Declining System Efficiency',
        description: 'System efficiency is trending downward, consider optimization',
        action: 'optimize_task_distribution'
      });
    }

    if (currentMetrics.agents.totalUtilization > 85) {
      recommendations.push({
        type: 'scaling',
        priority: 'high',
        title: 'High Agent Utilization',
        description: 'Consider scaling up or redistributing workload',
        action: 'scale_agents'
      });
    }

    // Store recommendations
    this.analytics.recommendations = recommendations;

    return recommendations;
  }

  predictPerformance(minutesAhead = 30) {
    const trends = this.analytics.trends.get('latest');
    
    if (!trends) {
      return { error: 'No trend data available for prediction' };
    }

    const predictions = {};

    for (const [metric, trend] of Object.entries(trends)) {
      const currentMetrics = this.monitoringSystem.getCurrentMetrics();
      let currentValue;

      switch (metric) {
        case 'taskThroughput':
          currentValue = currentMetrics.tasks.throughput;
          break;
        case 'failureRate':
          currentValue = currentMetrics.tasks.failureRate;
          break;
        case 'systemEfficiency':
          currentValue = currentMetrics.performance.systemEfficiency;
          break;
        case 'agentUtilization':
          currentValue = currentMetrics.agents.totalUtilization;
          break;
      }

      // Simple linear prediction
      const predictedValue = currentValue + (trend.change * minutesAhead);
      
      predictions[metric] = {
        current: currentValue,
        predicted: Math.max(0, predictedValue), // Ensure non-negative
        trend: trend.trend,
        confidence: trend.confidence
      };
    }

    // Store predictions
    this.analytics.predictions.set('latest', predictions);

    return predictions;
  }

  getAnalyticsReport() {
    return {
      trends: this.analytics.trends.get('latest'),
      predictions: this.analytics.predictions.get('latest'),
      recommendations: this.analytics.recommendations,
      timestamp: new Date()
    };
  }
}

module.exports = PerformanceAnalytics;
```

#### **3.2 Alert Management**
**Target File**: `src/coordination/alert-manager.js`

```javascript
class AlertManager {
  constructor(config = {}) {
    this.config = {
      enabled: true,
      escalationRules: true,
      alertCooldown: 300000, // 5 minutes between same alerts
      maxAlertsPerHour: 50,
      ...config
    };

    this.alertHistory = [];
    this.escalatedAlerts = new Set();
    this.alertCounts = new Map();
    this.lastAlertTimes = new Map();
  }

  processAlert(alert) {
    if (!this.config.enabled) return null;

    // Check cooldown
    const alertKey = `${alert.type}_${alert.severity}`;
    const lastAlertTime = this.lastAlertTimes.get(alertKey);
    
    if (lastAlertTime && (Date.now() - lastAlertTime) < this.config.alertCooldown) {
      return null; // Skip due to cooldown
    }

    // Update tracking
    this.lastAlertTimes.set(alertKey, Date.now());
    this.alertCounts.set(alertKey, (this.alertCounts.get(alertKey) || 0) + 1);

    // Check escalation
    const escalatedAlert = this.checkEscalation(alert);
    
    // Add to history
    this.alertHistory.push({ ...alert, processedAt: new Date() });
    
    // Keep history manageable
    if (this.alertHistory.length > 1000) {
      this.alertHistory = this.alertHistory.slice(-1000);
    }

    return escalatedAlert;
  }

  checkEscalation(alert) {
    if (!this.config.escalationRules) return alert;

    const alertKey = `${alert.type}_${alert.severity}`;
    const count = this.alertCounts.get(alertKey) || 0;

    // Escalation rules
    if (count >= 5 && alert.severity === 'warning') {
      return {
        ...alert,
        severity: 'error',
        escalated: true,
        reason: `Repeated ${count} times in last hour`
      };
    }

    if (count >= 10) {
      return {
        ...alert,
        severity: 'critical',
        escalated: true,
        reason: `Critical: ${count} occurrences in last hour`
      };
    }

    return alert;
  }

  getAlertSummary(timeframeMinutes = 60) {
    const cutoff = new Date(Date.now() - (timeframeMinutes * 60 * 1000));
    const recentAlerts = this.alertHistory.filter(alert => alert.processedAt >= cutoff);

    const summary = {
      total: recentAlerts.length,
      bySeverity: { warning: 0, error: 0, critical: 0 },
      byType: {},
      escalated: 0,
      timestamp: new Date()
    };

    for (const alert of recentAlerts) {
      summary.bySeverity[alert.severity]++;
      summary.byType[alert.type] = (summary.byType[alert.type] || 0) + 1;
      if (alert.escalated) summary.escalated++;
    }

    return summary;
  }

  clearHistory() {
    this.alertHistory = [];
    this.alertCounts.clear();
    this.lastAlertTimes.clear();
    this.escalatedAlerts.clear();
  }
}

module.exports = AlertManager;
```

---

## 📁 **File Structure**

### **New Files to Create**
```
src/coordination/
├── monitoring-system.js       # Core monitoring infrastructure
├── performance-analytics.js   # Performance analysis and predictions
├── alert-manager.js          # Alert processing and escalation
├── health-checker.js         # System health assessment
└── metrics-exporter.js       # External metrics export

tests/coordination/
├── monitoring-system.test.js  # Monitoring system tests
├── performance-analytics.test.js # Analytics tests
└── alert-manager.test.js     # Alert management tests
```

### **Files to Modify**
```
.ai-workflow/intelligence-engine/
└── queen-controller.js       # Integration points

src/claude-flow/orchestrator/
└── flow-orchestrator.js      # Optional: monitoring integration
```

---

## 🧪 **Testing Strategy**

### **Unit Tests**
**File**: `tests/coordination/monitoring-system.test.js`

```javascript
const MonitoringSystem = require('../../src/coordination/monitoring-system');

describe('MonitoringSystem', () => {
  let monitoring;
  let mockQueenController;

  beforeEach(() => {
    mockQueenController = {
      subAgents: new Map([
        ['agent1', { id: 'agent1', status: 'busy', currentTasks: new Set(['task1']) }],
        ['agent2', { id: 'agent2', status: 'idle', currentTasks: new Set() }]
      ]),
      tasks: new Map([
        ['task1', { id: 'task1', status: 'completed', completedAt: Date.now() - 1000 }],
        ['task2', { id: 'task2', status: 'failed' }]
      ]),
      metrics: {
        tasksCompleted: 5,
        errors: [{ timestamp: Date.now() }]
      },
      resourceMonitor: {
        getCurrentCpuUsage: () => 45,
        getCurrentMemoryUsage: () => 60
      }
    };

    monitoring = new MonitoringSystem({
      updateInterval: 100,
      enableAlerts: true
    });
  });

  test('should collect system metrics', async () => {
    monitoring.updateDataSources(mockQueenController);
    const metrics = monitoring.collectMetrics();

    expect(metrics.system.totalAgents).toBe(2);
    expect(metrics.system.activeAgents).toBe(1);
    expect(metrics.tasks.total).toBe(2);
    expect(metrics.tasks.completed).toBe(1);
  });

  test('should detect bottlenecks', async () => {
    monitoring.updateDataSources(mockQueenController);
    const metrics = monitoring.collectMetrics();

    expect(metrics.performance.bottleneckDetection).toBeInstanceOf(Array);
  });

  test('should generate alerts for thresholds', async () => {
    monitoring.updateDataSources(mockQueenController);
    
    // Simulate high failure rate
    mockQueenController.tasks = new Map(Array(10).fill().map((_, i) => [
      `task${i}`, { id: `task${i}`, status: 'failed' }
    ]));
    
    monitoring.updateDataSources(mockQueenController);
    const alerts = monitoring.checkAlerts();

    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0].type).toBe('task_failure_rate');
  });
});
```

---

## ⚙️ **Configuration**

### **Default Configuration**
```javascript
// config/monitoring.js
module.exports = {
  monitoring: {
    enabled: true,
    updateInterval: 1000,              // Metrics collection interval
    enableAlerts: true,
    enableHistory: true,
    maxHistorySize: 1000,
    
    alertThresholds: {
      cpuUsage: 80,
      memoryUsage: 85,
      taskFailureRate: 20,
      agentFailureRate: 30,
      queueSize: 100
    },
    
    alertCooldown: 300000,             // 5 minutes
    maxAlertsPerHour: 50,
    
    analytics: {
      enabled: true,
      predictionWindow: 30,            // minutes
      trendAnalysisWindow: 60,         // minutes
      recommendationsEnabled: true
    }
  }
};
```

---

## 📊 **Performance Metrics**

### **Dashboard Metrics**
1. **System Health Score**: Overall system status (0-100)
2. **Task Throughput**: Tasks completed per minute
3. **Agent Utilization**: Percentage of active agents
4. **Failure Rate**: Percentage of failed tasks
5. **Resource Usage**: CPU, memory, disk utilization
6. **Queue Size**: Number of pending tasks
7. **Average Latency**: Task completion time
8. **System Efficiency**: Overall performance metric

### **Monitoring Implementation**
```javascript
getDashboardData() {
  const currentMetrics = this.monitoringSystem.getCurrentMetrics();
  const health = this.monitoringSystem.getSystemHealth();
  const analytics = this.performanceAnalytics.getAnalyticsReport();

  return {
    health,
    current: currentMetrics,
    analytics,
    alerts: this.monitoringSystem.getAlerts(60),
    timestamp: new Date()
  };
}
```

---

## 🚀 **Deployment Steps**

### **Step 1: Preparation**
1. Backup existing Queen Controller
2. Create feature branch for monitoring integration
3. Set up metrics storage and visualization

### **Step 2: Implementation**
1. Create monitoring-system.js module
2. Implement performance analytics
3. Add alert management system
4. Integrate with Queen Controller

### **Step 3: Testing**
1. Test metrics collection accuracy
2. Verify alert generation and escalation
3. Test performance analytics
4. Validate dashboard data

### **Step 4: Deployment**
1. Deploy with monitoring enabled
2. Set up metrics dashboard
3. Configure alert thresholds
4. Monitor system performance

---

## 🎯 **Success Criteria**

### **Functional Requirements**
- ✅ Real-time metrics collection every second
- ✅ Intelligent alert generation and escalation
- ✅ Performance trend analysis and predictions
- ✅ System health assessment
- ✅ Historical data tracking

### **Performance Requirements**
- ✅ <1% overhead for monitoring operations
- ✅ <100ms metrics collection time
- ✅ Handle 10,000+ metrics data points
- ✅ Real-time alert generation

### **Reliability Requirements**
- ✅ 99.9% monitoring system uptime
- ✅ No data loss during system failures
- ✅ Graceful handling of monitoring failures
- ✅ Accurate metrics reporting

---

## 🔧 **Troubleshooting**

### **Common Issues**
1. **High monitoring overhead**
   - Increase update interval
   - Disable non-essential metrics
   - Optimize data collection

2. **Missing alerts**
   - Check alert thresholds
   - Verify alert configuration
   - Review alert cooldown settings

3. **Inaccurate metrics**
   - Update data sources
   - Check metric calculations
   - Validate data collection logic

### **Debug Tools**
```javascript
// Debug monitoring system
debugMonitoring() {
  return {
    config: this.monitoringSystem.config,
    currentMetrics: this.monitoringSystem.getCurrentMetrics(),
    recentAlerts: this.monitoringSystem.getAlerts(10),
    systemHealth: this.monitoringSystem.getSystemHealth(),
    dataSources: {
      agents: this.monitoringSystem.agents?.size || 0,
      tasks: this.monitoringSystem.tasks?.size || 0
    }
  };
}
```

---

## 📝 **Documentation Updates**

### **API Documentation**
- Document monitoring system methods
- Explain configuration options
- Add metrics reference documentation

### **User Guide**
- Guide to monitoring system setup
- Alert configuration best practices
- Performance optimization recommendations

### **Technical Documentation**
- Monitoring architecture diagrams
- Metrics calculation algorithms
- Alert processing flow charts