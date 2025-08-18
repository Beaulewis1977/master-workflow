/**
 * Dynamic Scaler - Intelligent Agent Scaling for Unlimited Concurrency
 * 
 * This module implements intelligent auto-scaling logic that removes the hard-coded
 * 10-agent limit and enables unlimited agent scaling based on system resources,
 * workload patterns, and performance requirements.
 * 
 * Features:
 * - Dynamic calculation of optimal agent count
 * - Workload-based scaling decisions
 * - Predictive scaling using historical data
 * - Safe scaling with gradual ramp-up/down
 * - Integration with resource monitoring
 */

const EventEmitter = require('events');

class DynamicScaler extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Configuration
    this.config = {
      minAgents: options.minAgents || 1,
      maxAgents: options.maxAgents || 1000, // Soft limit for safety
      defaultTargetUtilization: options.defaultTargetUtilization || 0.70,
      scaleUpThreshold: options.scaleUpThreshold || 0.80, // Scale up at 80% utilization
      scaleDownThreshold: options.scaleDownThreshold || 0.40, // Scale down at 40% utilization
      scaleUpCooldown: options.scaleUpCooldown || 30000, // 30 seconds
      scaleDownCooldown: options.scaleDownCooldown || 60000, // 60 seconds
      scalingStepSize: options.scalingStepSize || 0.25, // 25% increments
      maxScalingStep: options.maxScalingStep || 10, // Max 10 agents per scaling event
      predictionWindow: options.predictionWindow || 300000, // 5 minutes
      agentStartupTime: options.agentStartupTime || 2000, // 2 seconds estimated
      agentShutdownTime: options.agentShutdownTime || 1000, // 1 second estimated
      ...options
    };
    
    // Scaling state
    this.currentTarget = this.config.minAgents;
    this.lastScaleUp = 0;
    this.lastScaleDown = 0;
    this.scalingHistory = [];
    this.maxHistorySize = 100;
    
    // Performance tracking
    this.performanceMetrics = {
      averageSpawnTime: 2000,
      averageTaskCompletionTime: 30000,
      successRate: 0.95,
      resourceEfficiency: 0.80
    };
    
    // Workload analysis
    this.workloadPatterns = {
      averageTasksPerMinute: 0,
      peakTasksPerMinute: 0,
      taskComplexityDistribution: new Map(),
      agentTypePreferences: new Map()
    };
    
    // Predictive models
    this.predictionModels = {
      linear: true,
      exponential: false,
      seasonal: false // Can be enhanced later
    };
  }
  
  /**
   * Calculate optimal agent count based on current conditions
   */
  calculateOptimalAgentCount(resourceMetrics, workloadMetrics, currentAgents) {
    const calculations = {
      byResource: this.calculateByResourceConstraints(resourceMetrics),
      byWorkload: this.calculateByWorkload(workloadMetrics, currentAgents),
      byPerformance: this.calculateByPerformance(currentAgents),
      byPrediction: this.calculateByPrediction(resourceMetrics, workloadMetrics)
    };
    
    // Weight different calculation methods
    const weights = {
      resource: 0.40,  // Resource constraints are critical
      workload: 0.30,  // Current workload is important
      performance: 0.20, // Historical performance matters
      prediction: 0.10   // Predictive scaling for optimization
    };
    
    const weightedAverage = (
      calculations.byResource * weights.resource +
      calculations.byWorkload * weights.workload +
      calculations.byPerformance * weights.performance +
      calculations.byPrediction * weights.prediction
    );
    
    // Apply constraints and rounding
    const optimal = Math.max(
      this.config.minAgents,
      Math.min(this.config.maxAgents, Math.round(weightedAverage))
    );
    
    return {
      optimal,
      calculations,
      weights,
      confidence: this.calculateConfidence(calculations, resourceMetrics)
    };
  }
  
  /**
   * Calculate agent count based on resource constraints
   */
  calculateByResourceConstraints(resourceMetrics) {
    if (!resourceMetrics.scaling) {
      return this.config.minAgents;
    }
    
    const scaling = resourceMetrics.scaling;
    
    // Use the most restrictive constraint for safety
    return Math.min(
      scaling.constraints.memory || this.config.maxAgents,
      scaling.constraints.cpu || this.config.maxAgents,
      scaling.constraints.context || this.config.maxAgents
    );
  }
  
  /**
   * Calculate agent count based on current workload
   */
  calculateByWorkload(workloadMetrics, currentAgents) {
    const {
      taskQueueSize = 0,
      averageTaskDuration = 30000,
      taskThroughput = 1,
      agentUtilization = 0.5
    } = workloadMetrics;
    
    // If no workload data, maintain current
    if (taskQueueSize === 0 && agentUtilization < 0.1) {
      return Math.max(this.config.minAgents, currentAgents * 0.5);
    }
    
    // Calculate based on queue length and processing capacity
    const idealProcessingTime = 60000; // 1 minute ideal queue processing time
    const agentsNeededForQueue = Math.ceil(
      (taskQueueSize * averageTaskDuration) / idealProcessingTime
    );
    
    // Calculate based on utilization
    const targetUtilization = this.config.defaultTargetUtilization;
    const agentsNeededForUtilization = Math.ceil(currentAgents * agentUtilization / targetUtilization);
    
    // Calculate based on throughput requirements
    const agentsNeededForThroughput = Math.ceil(taskThroughput / 2); // 2 tasks per agent per minute
    
    return Math.max(
      agentsNeededForQueue,
      agentsNeededForUtilization,
      agentsNeededForThroughput
    );
  }
  
  /**
   * Calculate agent count based on performance history
   */
  calculateByPerformance(currentAgents) {
    const performance = this.performanceMetrics;
    
    // If performance is good, maintain or slightly optimize
    if (performance.successRate > 0.90 && performance.resourceEfficiency > 0.75) {
      return currentAgents;
    }
    
    // If success rate is low, might need more agents for redundancy
    if (performance.successRate < 0.80) {
      return Math.ceil(currentAgents * 1.2);
    }
    
    // If resource efficiency is low, might need fewer agents
    if (performance.resourceEfficiency < 0.60) {
      return Math.max(this.config.minAgents, Math.floor(currentAgents * 0.8));
    }
    
    return currentAgents;
  }
  
  /**
   * Calculate agent count based on predictive analysis
   */
  calculateByPrediction(resourceMetrics, workloadMetrics) {
    const history = this.scalingHistory.slice(-10); // Last 10 scaling events
    
    if (history.length < 3) {
      return this.currentTarget; // Not enough data for prediction
    }
    
    // Simple trend analysis
    const recentTargets = history.slice(-5).map(h => h.targetCount);
    const trend = this.calculateTrend(recentTargets);
    
    // Predict based on trend
    let predicted = this.currentTarget;
    
    if (trend > 0.1) {
      // Upward trend
      predicted = Math.ceil(this.currentTarget * (1 + trend * 0.1));
    } else if (trend < -0.1) {
      // Downward trend
      predicted = Math.floor(this.currentTarget * (1 + trend * 0.1));
    }
    
    return Math.max(this.config.minAgents, predicted);
  }
  
  /**
   * Calculate confidence in the scaling decision
   */
  calculateConfidence(calculations, resourceMetrics) {
    // Check agreement between calculation methods
    const values = Object.values(calculations);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Lower standard deviation = higher confidence
    const agreementScore = Math.max(0, 1 - (standardDeviation / mean));
    
    // Resource health affects confidence
    const resourceHealth = resourceMetrics.memory?.utilization < 0.8 && 
                           resourceMetrics.cpu?.utilization < 0.8 ? 1 : 0.5;
    
    // Historical success affects confidence
    const historyScore = this.performanceMetrics.successRate;
    
    return Math.min(0.95, (agreementScore * 0.4 + resourceHealth * 0.3 + historyScore * 0.3));
  }
  
  /**
   * Determine if scaling action should be taken
   */
  shouldScale(optimalCount, currentCount, resourceMetrics) {
    const now = Date.now();
    const difference = optimalCount - currentCount;
    const relativeChange = Math.abs(difference) / currentCount;
    
    // Check cooldown periods
    if (difference > 0) {
      // Scale up
      if (now - this.lastScaleUp < this.config.scaleUpCooldown) {
        return { should: false, reason: 'scale_up_cooldown' };
      }
    } else if (difference < 0) {
      // Scale down
      if (now - this.lastScaleDown < this.config.scaleDownCooldown) {
        return { should: false, reason: 'scale_down_cooldown' };
      }
    }
    
    // Check if change is significant enough
    const minSignificantChange = 0.1; // 10%
    if (relativeChange < minSignificantChange && Math.abs(difference) < 2) {
      return { should: false, reason: 'change_too_small' };
    }
    
    // Check resource pressure for emergency scaling
    const memoryPressure = resourceMetrics.memory?.utilization > 0.9;
    const cpuPressure = resourceMetrics.cpu?.utilization > 0.9;
    
    if ((memoryPressure || cpuPressure) && difference > 0) {
      return { should: false, reason: 'resource_pressure' };
    }
    
    // Calculate scaling step size
    const maxStep = this.config.maxScalingStep;
    const stepSize = Math.min(maxStep, Math.max(1, Math.abs(difference) * this.config.scalingStepSize));
    
    const targetChange = difference > 0 ? 
      Math.min(stepSize, difference) : 
      Math.max(-stepSize, difference);
    
    return {
      should: true,
      direction: difference > 0 ? 'up' : 'down',
      targetCount: currentCount + targetChange,
      stepSize: Math.abs(targetChange),
      reason: difference > 0 ? 'workload_increase' : 'workload_decrease'
    };
  }
  
  /**
   * Execute scaling decision
   */
  async executeScaling(scalingDecision, queenController) {
    const now = Date.now();
    
    try {
      const { direction, targetCount, stepSize, reason } = scalingDecision;
      
      console.log(`DYNAMIC SCALER: Executing ${direction} scaling - target: ${targetCount}, step: ${stepSize}, reason: ${reason}`);
      
      // Record scaling event
      this.recordScalingEvent({
        timestamp: now,
        direction,
        previousCount: this.currentTarget,
        targetCount,
        stepSize,
        reason
      });
      
      // Update scaling timestamps
      if (direction === 'up') {
        this.lastScaleUp = now;
      } else {
        this.lastScaleDown = now;
      }
      
      // Update current target
      this.currentTarget = targetCount;
      
      // Emit scaling event
      this.emit('scaling-executed', {
        direction,
        targetCount,
        stepSize,
        reason,
        timestamp: now
      });
      
      return {
        success: true,
        newTarget: targetCount,
        scalingTime: Date.now() - now
      };
      
    } catch (error) {
      console.error('DYNAMIC SCALER: Scaling execution failed:', error);
      this.emit('scaling-failed', {
        error: error.message,
        decision: scalingDecision
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Record scaling event in history
   */
  recordScalingEvent(event) {
    this.scalingHistory.push(event);
    
    // Maintain history size
    if (this.scalingHistory.length > this.maxHistorySize) {
      this.scalingHistory.shift();
    }
  }
  
  /**
   * Update performance metrics from system feedback
   */
  updatePerformanceMetrics(metrics) {
    this.performanceMetrics = {
      ...this.performanceMetrics,
      ...metrics
    };
  }
  
  /**
   * Update workload patterns from queue analysis
   */
  updateWorkloadPatterns(patterns) {
    this.workloadPatterns = {
      ...this.workloadPatterns,
      ...patterns
    };
  }
  
  /**
   * Calculate trend from historical data
   */
  calculateTrend(values) {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const sumX = values.reduce((sum, _, i) => sum + i, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + (i * val), 0);
    const sumXX = values.reduce((sum, _, i) => sum + (i * i), 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    return isNaN(slope) ? 0 : slope;
  }
  
  /**
   * Get scaling recommendation without executing
   */
  getScalingRecommendation(resourceMetrics, workloadMetrics, currentAgents) {
    const optimal = this.calculateOptimalAgentCount(resourceMetrics, workloadMetrics, currentAgents);
    const scalingDecision = this.shouldScale(optimal.optimal, currentAgents, resourceMetrics);
    
    return {
      currentCount: currentAgents,
      optimalCount: optimal.optimal,
      confidence: optimal.confidence,
      shouldScale: scalingDecision.should,
      recommendation: scalingDecision,
      calculations: optimal.calculations,
      constraints: {
        minAgents: this.config.minAgents,
        maxAgents: this.config.maxAgents,
        lastScaleUp: this.lastScaleUp,
        lastScaleDown: this.lastScaleDown
      }
    };
  }
  
  /**
   * Get current scaler status
   */
  getStatus() {
    return {
      currentTarget: this.currentTarget,
      config: this.config,
      performanceMetrics: this.performanceMetrics,
      workloadPatterns: this.workloadPatterns,
      scalingHistory: this.scalingHistory.slice(-10), // Last 10 events
      lastScaleUp: this.lastScaleUp,
      lastScaleDown: this.lastScaleDown
    };
  }
  
  /**
   * Reset scaler state (useful for testing)
   */
  reset() {
    this.currentTarget = this.config.minAgents;
    this.lastScaleUp = 0;
    this.lastScaleDown = 0;
    this.scalingHistory = [];
    this.performanceMetrics = {
      averageSpawnTime: 2000,
      averageTaskCompletionTime: 30000,
      successRate: 0.95,
      resourceEfficiency: 0.80
    };
  }
  
  /**
   * Optimize configuration based on historical performance
   */
  optimizeConfiguration() {
    const history = this.scalingHistory.slice(-20); // Last 20 events
    
    if (history.length < 10) return false;
    
    // Analyze scaling frequency
    const avgTimeBetweenScaling = history.length > 1 ? 
      (history[history.length - 1].timestamp - history[0].timestamp) / (history.length - 1) : 0;
    
    // If scaling too frequently, increase cooldown
    if (avgTimeBetweenScaling < this.config.scaleUpCooldown) {
      this.config.scaleUpCooldown = Math.min(this.config.scaleUpCooldown * 1.2, 120000);
      this.config.scaleDownCooldown = Math.min(this.config.scaleDownCooldown * 1.2, 180000);
      return true;
    }
    
    // If not scaling enough, decrease cooldown
    if (avgTimeBetweenScaling > this.config.scaleUpCooldown * 3) {
      this.config.scaleUpCooldown = Math.max(this.config.scaleUpCooldown * 0.9, 10000);
      this.config.scaleDownCooldown = Math.max(this.config.scaleDownCooldown * 0.9, 20000);
      return true;
    }
    
    return false;
  }
}

module.exports = DynamicScaler;