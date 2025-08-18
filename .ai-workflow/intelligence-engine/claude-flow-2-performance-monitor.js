/**
 * Claude Flow 2.0 Performance Monitor
 * 
 * Comprehensive performance tracking and optimization system for
 * the Queen Controller architecture with 2.8-4.4x speedup targets.
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

class ClaudeFlow2PerformanceMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      targetSpeedupFactor: options.targetSpeedupFactor || 3.6, // Average of 2.8-4.4x
      tokenReductionTarget: options.tokenReductionTarget || 32.3, // 32.3% reduction
      responseTimeTarget: options.responseTimeTarget || 1000, // Sub-second target
      accuracyTarget: options.accuracyTarget || 0.89, // 89%+ accuracy
      monitoringInterval: options.monitoringInterval || 10000, // 10 seconds
      metricsRetention: options.metricsRetention || 86400000, // 24 hours
      projectRoot: options.projectRoot || process.cwd()
    };
    
    // Performance baselines (from previous system)
    this.baselines = {
      averageTaskTime: 5000, // 5 seconds baseline
      averageTokenUsage: 50000, // 50k tokens baseline
      averageResponseTime: 2000, // 2 seconds baseline
      baselineAccuracy: 0.65 // 65% baseline accuracy
    };
    
    // Current performance metrics
    this.metrics = {
      // Speed performance
      currentSpeedupFactor: 1.0,
      peakSpeedupFactor: 1.0,
      averageTaskCompletionTime: 0,
      taskCompletionTimes: [],
      
      // Token efficiency
      currentTokenReduction: 0,
      peakTokenReduction: 0,
      averageTokenUsage: 0,
      tokenUsageHistory: [],
      
      // Response time
      averageResponseTime: 0,
      responseTimeHistory: [],
      subSecondResponseRate: 0,
      
      // Accuracy
      currentAccuracy: 0,
      accuracyHistory: [],
      
      // WASM/SIMD performance
      wasmOperations: 0,
      simdOperations: 0,
      wasmSpeedupFactor: 1.0,
      
      // Topology performance
      topologyOptimizations: 0,
      communicationEfficiency: 0,
      
      // Overall system health
      systemHealthScore: 0,
      performanceGrade: 'C',
      
      // Timestamps
      lastUpdate: Date.now(),
      measurementWindow: 300000, // 5 minutes
      
      // Counters
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0
    };
    
    // Performance history for trending
    this.performanceHistory = [];
    this.maxHistorySize = 1000; // Keep last 1000 measurements
    
    // Component references
    this.queenController = null;
    this.wasmCore = null;
    this.topologyManager = null;
    this.capabilityMatcher = null;
    
    // Monitoring state
    this.monitoring = false;
    this.monitoringInterval = null;
    
    // Alerts and thresholds
    this.alertThresholds = {
      lowSpeedupFactor: 2.0,
      lowTokenReduction: 15.0,
      highResponseTime: 2000,
      lowAccuracy: 0.75
    };
    
    this.activeAlerts = new Set();
  }
  
  /**
   * Initialize performance monitor
   */
  async initialize(components = {}) {
    try {
      console.log('Initializing Claude Flow 2.0 Performance Monitor...');
      
      // Set component references
      this.queenController = components.queenController;
      this.wasmCore = components.wasmCore;
      this.topologyManager = components.topologyManager;
      this.capabilityMatcher = components.capabilityMatcher;
      
      // Load historical baselines if available
      await this.loadBaselines();
      
      // Start monitoring
      this.startMonitoring();
      
      console.log('Performance Monitor initialized with targets:');
      console.log(`- Speedup Factor: ${this.config.targetSpeedupFactor}x`);
      console.log(`- Token Reduction: ${this.config.tokenReductionTarget}%`);
      console.log(`- Response Time: <${this.config.responseTimeTarget}ms`);
      console.log(`- Accuracy: >${(this.config.accuracyTarget * 100).toFixed(1)}%`);
      
      this.emit('monitor-initialized', {
        targets: this.config,
        baselines: this.baselines
      });
      
      return true;
      
    } catch (error) {
      console.error('Failed to initialize Performance Monitor:', error);
      throw error;
    }
  }
  
  /**
   * Load performance baselines from previous measurements
   */
  async loadBaselines() {
    try {
      const baselinesPath = path.join(this.config.projectRoot, '.hive-mind', 'performance-baselines.json');
      const baselinesData = await fs.readFile(baselinesPath, 'utf-8');
      const savedBaselines = JSON.parse(baselinesData);
      
      this.baselines = { ...this.baselines, ...savedBaselines };
      
      console.log('Loaded performance baselines from previous measurements');
      
    } catch (error) {
      console.log('No previous baselines found, using default values');
    }
  }
  
  /**
   * Start performance monitoring
   */
  startMonitoring() {
    if (this.monitoring) {
      console.warn('Performance monitoring already active');
      return;
    }
    
    this.monitoring = true;
    
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.collectMetrics();
        this.analyzePerformance();
        this.checkAlerts();
        this.updateSystemHealth();
      } catch (error) {
        console.error('Performance monitoring error:', error);
      }
    }, this.config.monitoringInterval);
    
    console.log(`Performance monitoring started (${this.config.monitoringInterval}ms interval)`);
  }
  
  /**
   * Collect metrics from all system components
   */
  async collectMetrics() {
    const timestamp = Date.now();
    
    try {
      // Collect Queen Controller metrics
      if (this.queenController) {
        const qcStatus = this.queenController.getStatus();
        await this.processQueenControllerMetrics(qcStatus);
      }
      
      // Collect WASM Core metrics
      if (this.wasmCore && this.wasmCore.isInitialized()) {
        const wasmMetrics = this.wasmCore.getMetrics();
        this.processWasmMetrics(wasmMetrics);
      }
      
      // Collect Topology Manager metrics
      if (this.topologyManager) {
        const topologyStats = this.topologyManager.getTopologyStats();
        this.processTopologyMetrics(topologyStats);
      }
      
      // Collect Capability Matcher metrics
      if (this.capabilityMatcher && this.capabilityMatcher.isEnabled()) {
        const matchingStats = this.capabilityMatcher.getMatchingStats();
        this.processCapabilityMatcherMetrics(matchingStats);
      }
      
      // Update timestamp
      this.metrics.lastUpdate = timestamp;
      
    } catch (error) {
      console.error('Metrics collection failed:', error);
    }
  }
  
  /**
   * Process Queen Controller metrics
   */
  async processQueenControllerMetrics(qcStatus) {
    if (!qcStatus.metrics) return;
    
    const metrics = qcStatus.metrics;
    
    // Calculate task completion performance
    if (metrics.averageCompletionTime > 0) {
      const taskSpeedup = this.baselines.averageTaskTime / metrics.averageCompletionTime;
      this.metrics.currentSpeedupFactor = Math.max(this.metrics.currentSpeedupFactor * 0.9 + taskSpeedup * 0.1, 1.0);
      this.metrics.peakSpeedupFactor = Math.max(this.metrics.peakSpeedupFactor, taskSpeedup);
      
      this.metrics.taskCompletionTimes.push({
        time: metrics.averageCompletionTime,
        timestamp: Date.now()
      });
      
      // Keep only recent measurements
      if (this.metrics.taskCompletionTimes.length > 100) {
        this.metrics.taskCompletionTimes.shift();
      }
    }
    
    // Calculate token usage efficiency
    if (qcStatus.agents && qcStatus.agents.length > 0) {
      const totalTokens = qcStatus.agents.reduce((sum, agent) => sum + (agent.tokenUsage || 0), 0);
      const averageTokens = totalTokens / qcStatus.agents.length;
      
      if (averageTokens > 0) {
        const tokenReduction = Math.max(0, ((this.baselines.averageTokenUsage - averageTokens) / this.baselines.averageTokenUsage) * 100);
        this.metrics.currentTokenReduction = tokenReduction;
        this.metrics.peakTokenReduction = Math.max(this.metrics.peakTokenReduction, tokenReduction);
        
        this.metrics.tokenUsageHistory.push({
          usage: averageTokens,
          reduction: tokenReduction,
          timestamp: Date.now()
        });
        
        if (this.metrics.tokenUsageHistory.length > 100) {
          this.metrics.tokenUsageHistory.shift();
        }
      }
    }
    
    // Update operation counters
    this.metrics.totalOperations += metrics.tasksDistributed || 0;
    this.metrics.successfulOperations += metrics.tasksCompleted || 0;
    this.metrics.failedOperations += (metrics.errors || []).length;
  }
  
  /**
   * Process WASM Core metrics
   */
  processWasmMetrics(wasmMetrics) {
    this.metrics.wasmOperations += wasmMetrics.predictionsExecuted || 0;
    this.metrics.simdOperations += wasmMetrics.simdOperations || 0;
    this.metrics.wasmSpeedupFactor = wasmMetrics.speedupFactor || 1.0;
    
    // Factor WASM speedup into overall speedup
    this.metrics.currentSpeedupFactor = Math.max(
      this.metrics.currentSpeedupFactor,
      this.metrics.wasmSpeedupFactor
    );
    
    // Track response times from WASM operations
    if (wasmMetrics.averageExecutionTime > 0) {
      this.metrics.responseTimeHistory.push({
        time: wasmMetrics.averageExecutionTime,
        timestamp: Date.now(),
        source: 'wasm'
      });
    }
  }
  
  /**
   * Process Topology Manager metrics
   */
  processTopologyMetrics(topologyStats) {
    this.metrics.topologyOptimizations += (topologyStats.switchHistory || []).length;
    
    // Calculate communication efficiency
    if (topologyStats.connectionCount && topologyStats.agentCount) {
      const maxConnections = topologyStats.agentCount * (topologyStats.agentCount - 1);
      this.metrics.communicationEfficiency = 
        Math.min(100, (topologyStats.connectionCount / maxConnections) * 100);
    }
  }
  
  /**
   * Process Capability Matcher metrics
   */
  processCapabilityMatcherMetrics(matchingStats) {
    this.metrics.currentAccuracy = matchingStats.currentAccuracy || 0;
    
    this.metrics.accuracyHistory.push({
      accuracy: this.metrics.currentAccuracy,
      timestamp: Date.now()
    });
    
    if (this.metrics.accuracyHistory.length > 100) {
      this.metrics.accuracyHistory.shift();
    }
    
    // Track matching response times
    if (matchingStats.averageExecutionTime > 0) {
      this.metrics.responseTimeHistory.push({
        time: matchingStats.averageExecutionTime,
        timestamp: Date.now(),
        source: 'capability_matcher'
      });
    }
  }
  
  /**
   * Analyze overall performance
   */
  analyzePerformance() {
    // Calculate overall response time
    if (this.metrics.responseTimeHistory.length > 0) {
      const recentResponses = this.metrics.responseTimeHistory
        .filter(r => Date.now() - r.timestamp < this.metrics.measurementWindow);
      
      if (recentResponses.length > 0) {
        this.metrics.averageResponseTime = 
          recentResponses.reduce((sum, r) => sum + r.time, 0) / recentResponses.length;
        
        const subSecondCount = recentResponses.filter(r => r.time < 1000).length;
        this.metrics.subSecondResponseRate = (subSecondCount / recentResponses.length) * 100;
      }
    }
    
    // Store performance snapshot
    this.storePerformanceSnapshot();
    
    // Emit performance update
    this.emit('performance-update', {
      metrics: this.metrics,
      targets: this.config,
      timestamp: Date.now()
    });
  }
  
  /**
   * Store performance snapshot for trending
   */
  storePerformanceSnapshot() {
    const snapshot = {
      timestamp: Date.now(),
      speedupFactor: this.metrics.currentSpeedupFactor,
      tokenReduction: this.metrics.currentTokenReduction,
      responseTime: this.metrics.averageResponseTime,
      accuracy: this.metrics.currentAccuracy,
      healthScore: this.metrics.systemHealthScore
    };
    
    this.performanceHistory.push(snapshot);
    
    // Trim history if too large
    if (this.performanceHistory.length > this.maxHistorySize) {
      this.performanceHistory.shift();
    }
  }
  
  /**
   * Check performance alerts
   */
  checkAlerts() {
    const alerts = [];
    
    // Speedup factor alert
    if (this.metrics.currentSpeedupFactor < this.alertThresholds.lowSpeedupFactor) {
      alerts.push({
        type: 'low_speedup',
        severity: 'warning',
        message: `Speedup factor (${this.metrics.currentSpeedupFactor.toFixed(2)}x) below threshold (${this.alertThresholds.lowSpeedupFactor}x)`,
        value: this.metrics.currentSpeedupFactor,
        threshold: this.alertThresholds.lowSpeedupFactor
      });
    }
    
    // Token reduction alert
    if (this.metrics.currentTokenReduction < this.alertThresholds.lowTokenReduction) {
      alerts.push({
        type: 'low_token_reduction',
        severity: 'warning',
        message: `Token reduction (${this.metrics.currentTokenReduction.toFixed(1)}%) below threshold (${this.alertThresholds.lowTokenReduction}%)`,
        value: this.metrics.currentTokenReduction,
        threshold: this.alertThresholds.lowTokenReduction
      });
    }
    
    // Response time alert
    if (this.metrics.averageResponseTime > this.alertThresholds.highResponseTime) {
      alerts.push({
        type: 'high_response_time',
        severity: 'critical',
        message: `Response time (${this.metrics.averageResponseTime.toFixed(0)}ms) above threshold (${this.alertThresholds.highResponseTime}ms)`,
        value: this.metrics.averageResponseTime,
        threshold: this.alertThresholds.highResponseTime
      });
    }
    
    // Accuracy alert
    if (this.metrics.currentAccuracy < this.alertThresholds.lowAccuracy) {
      alerts.push({
        type: 'low_accuracy',
        severity: 'warning',
        message: `Accuracy (${(this.metrics.currentAccuracy * 100).toFixed(1)}%) below threshold (${(this.alertThresholds.lowAccuracy * 100).toFixed(1)}%)`,
        value: this.metrics.currentAccuracy,
        threshold: this.alertThresholds.lowAccuracy
      });
    }
    
    // Process new alerts
    alerts.forEach(alert => {
      if (!this.activeAlerts.has(alert.type)) {
        this.activeAlerts.add(alert.type);
        this.emit('performance-alert', alert);
        console.warn(`PERFORMANCE ALERT: ${alert.message}`);
      }
    });
    
    // Clear resolved alerts
    for (const alertType of this.activeAlerts) {
      if (!alerts.find(a => a.type === alertType)) {
        this.activeAlerts.delete(alertType);
        this.emit('alert-resolved', { type: alertType });
      }
    }
  }
  
  /**
   * Update system health score
   */
  updateSystemHealth() {
    let healthScore = 0;
    let weights = 0;
    
    // Speedup factor contribution (25% weight)
    const speedupScore = Math.min(100, (this.metrics.currentSpeedupFactor / this.config.targetSpeedupFactor) * 100);
    healthScore += speedupScore * 0.25;
    weights += 0.25;
    
    // Token reduction contribution (20% weight)
    const tokenScore = Math.min(100, (this.metrics.currentTokenReduction / this.config.tokenReductionTarget) * 100);
    healthScore += tokenScore * 0.20;
    weights += 0.20;
    
    // Response time contribution (25% weight)
    const responseScore = this.metrics.averageResponseTime > 0 ? 
      Math.max(0, 100 - (this.metrics.averageResponseTime / this.config.responseTimeTarget) * 100) : 100;
    healthScore += responseScore * 0.25;
    weights += 0.25;
    
    // Accuracy contribution (30% weight)
    const accuracyScore = (this.metrics.currentAccuracy / this.config.accuracyTarget) * 100;
    healthScore += accuracyScore * 0.30;
    weights += 0.30;
    
    this.metrics.systemHealthScore = weights > 0 ? healthScore / weights : 0;
    
    // Determine performance grade
    if (this.metrics.systemHealthScore >= 90) {
      this.metrics.performanceGrade = 'A';
    } else if (this.metrics.systemHealthScore >= 80) {
      this.metrics.performanceGrade = 'B';
    } else if (this.metrics.systemHealthScore >= 70) {
      this.metrics.performanceGrade = 'C';
    } else if (this.metrics.systemHealthScore >= 60) {
      this.metrics.performanceGrade = 'D';
    } else {
      this.metrics.performanceGrade = 'F';
    }
  }
  
  /**
   * Generate performance report
   */
  generatePerformanceReport() {
    const report = {
      timestamp: Date.now(),
      systemHealth: {
        score: this.metrics.systemHealthScore,
        grade: this.metrics.performanceGrade
      },
      targets: this.config,
      currentPerformance: {
        speedupFactor: {
          current: this.metrics.currentSpeedupFactor,
          peak: this.metrics.peakSpeedupFactor,
          target: this.config.targetSpeedupFactor,
          achieved: (this.metrics.currentSpeedupFactor / this.config.targetSpeedupFactor) * 100
        },
        tokenReduction: {
          current: this.metrics.currentTokenReduction,
          peak: this.metrics.peakTokenReduction,
          target: this.config.tokenReductionTarget,
          achieved: (this.metrics.currentTokenReduction / this.config.tokenReductionTarget) * 100
        },
        responseTime: {
          average: this.metrics.averageResponseTime,
          target: this.config.responseTimeTarget,
          subSecondRate: this.metrics.subSecondResponseRate
        },
        accuracy: {
          current: this.metrics.currentAccuracy,
          target: this.config.accuracyTarget,
          achieved: (this.metrics.currentAccuracy / this.config.accuracyTarget) * 100
        }
      },
      componentStatus: {
        wasmCore: {
          operations: this.metrics.wasmOperations,
          simdOperations: this.metrics.simdOperations,
          speedupFactor: this.metrics.wasmSpeedupFactor
        },
        topology: {
          optimizations: this.metrics.topologyOptimizations,
          communicationEfficiency: this.metrics.communicationEfficiency
        }
      },
      operationalMetrics: {
        totalOperations: this.metrics.totalOperations,
        successfulOperations: this.metrics.successfulOperations,
        failedOperations: this.metrics.failedOperations,
        successRate: this.metrics.totalOperations > 0 ? 
          (this.metrics.successfulOperations / this.metrics.totalOperations) * 100 : 0
      },
      alerts: Array.from(this.activeAlerts)
    };
    
    return report;
  }
  
  /**
   * Get current performance metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      report: this.generatePerformanceReport(),
      history: this.performanceHistory.slice(-50) // Last 50 snapshots
    };
  }
  
  /**
   * Save performance baselines
   */
  async saveBaselines() {
    try {
      const baselinesPath = path.join(this.config.projectRoot, '.hive-mind', 'performance-baselines.json');
      await fs.writeFile(baselinesPath, JSON.stringify(this.baselines, null, 2));
      console.log('Performance baselines saved');
    } catch (error) {
      console.error('Failed to save baselines:', error);
    }
  }
  
  /**
   * Stop performance monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.monitoring = false;
    console.log('Performance monitoring stopped');
  }
  
  /**
   * Shutdown performance monitor
   */
  async shutdown() {
    this.stopMonitoring();
    
    // Save current baselines
    await this.saveBaselines();
    
    // Clear data
    this.performanceHistory = [];
    this.activeAlerts.clear();
    
    console.log('Claude Flow 2.0 Performance Monitor shutdown complete');
  }
}

module.exports = { ClaudeFlow2PerformanceMonitor };