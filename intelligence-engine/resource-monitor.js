/**
 * Resource Monitor - Advanced System Resource Monitoring for Unlimited Agent Scaling
 * 
 * This module provides real-time monitoring of system resources to enable intelligent
 * agent scaling decisions. It tracks memory, CPU, I/O, and agent-specific metrics
 * to ensure optimal performance and stability.
 * 
 * Features:
 * - Real-time memory and CPU monitoring
 * - Context window pressure tracking
 * - Network and disk I/O monitoring
 * - Predictive resource usage modeling
 * - Alert system for resource thresholds
 */

const EventEmitter = require('events');
const os = require('os');
const fs = require('fs').promises;
const path = require('path');

class ResourceMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Configuration
    this.config = {
      monitoringInterval: options.monitoringInterval || 1000, // 1 second
      memoryThreshold: options.memoryThreshold || 0.85, // 85% memory usage alert
      cpuThreshold: options.cpuThreshold || 0.80, // 80% CPU usage alert
      contextThreshold: options.contextThreshold || 0.90, // 90% context usage alert
      maxAgentsPerGB: options.maxAgentsPerGB || 5, // Conservative estimate
      targetMemoryUtilization: options.targetMemoryUtilization || 0.70, // 70% target
      targetCpuUtilization: options.targetCpuUtilization || 0.80, // 80% target
      ...options
    };
    
    // System information
    this.systemInfo = {
      totalMemory: os.totalmem(),
      cpuCount: os.cpus().length,
      platform: os.platform(),
      arch: os.arch()
    };
    
    // Current metrics
    this.currentMetrics = {
      memory: {
        total: 0,
        used: 0,
        free: 0,
        available: 0,
        utilization: 0
      },
      cpu: {
        usage: 0,
        loadAverage: [0, 0, 0],
        utilization: 0
      },
      agents: {
        active: 0,
        totalContextUsage: 0,
        averageContextUsage: 0,
        memoryPerAgent: 0
      },
      io: {
        diskUsage: 0,
        networkConnections: 0
      },
      scaling: {
        optimalAgentCount: 0,
        maxPossibleAgents: 0,
        recommendedAction: 'maintain'
      }
    };
    
    // Historical metrics for trend analysis
    this.metricHistory = [];
    this.maxHistorySize = 300; // 5 minutes at 1-second intervals
    
    // Monitoring state
    this.isMonitoring = false;
    this.monitoringTimer = null;
    
    // Alert state
    this.alertStates = {
      memory: false,
      cpu: false,
      context: false
    };
  }
  
  /**
   * Start resource monitoring
   */
  async start() {
    if (this.isMonitoring) {
      console.warn('Resource monitoring is already active');
      return;
    }
    
    console.log('Starting advanced resource monitoring for unlimited agent scaling...');
    
    // Initial metrics collection
    await this.collectMetrics();
    
    // Start monitoring loop
    this.monitoringTimer = setInterval(() => {
      this.collectMetrics().catch(error => {
        console.error('Resource monitoring error:', error);
        this.emit('monitoring-error', error);
      });
    }, this.config.monitoringInterval);
    
    this.isMonitoring = true;
    this.emit('monitoring-started', this.currentMetrics);
    
    console.log(`Resource monitoring started - Target: ${this.config.targetMemoryUtilization * 100}% memory, ${this.config.targetCpuUtilization * 100}% CPU`);
  }
  
  /**
   * Stop resource monitoring
   */
  stop() {
    if (!this.isMonitoring) return;
    
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }
    
    this.isMonitoring = false;
    this.emit('monitoring-stopped');
    console.log('Resource monitoring stopped');
  }
  
  /**
   * Collect comprehensive system metrics
   */
  async collectMetrics() {
    const startTime = Date.now();
    
    try {
      // Memory metrics
      await this.collectMemoryMetrics();
      
      // CPU metrics
      await this.collectCpuMetrics();
      
      // I/O metrics
      await this.collectIoMetrics();
      
      // Calculate scaling recommendations
      this.calculateScalingRecommendations();
      
      // Store in history
      this.storeMetricsHistory();
      
      // Check thresholds and emit alerts
      this.checkThresholds();
      
      // Emit metrics update
      this.emit('metrics-updated', {
        metrics: this.currentMetrics,
        collectionTime: Date.now() - startTime
      });
      
    } catch (error) {
      console.error('Failed to collect metrics:', error);
      this.emit('collection-error', error);
    }
  }
  
  /**
   * Collect memory usage metrics
   */
  async collectMemoryMetrics() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    
    // Try to get more detailed memory info on Linux
    let availableMemory = freeMemory;
    if (os.platform() === 'linux') {
      try {
        const meminfo = await fs.readFile('/proc/meminfo', 'utf-8');
        const availableMatch = meminfo.match(/MemAvailable:\s+(\d+)\s+kB/);
        if (availableMatch) {
          availableMemory = parseInt(availableMatch[1]) * 1024; // Convert KB to bytes
        }
      } catch (error) {
        // Fallback to free memory if /proc/meminfo is not available
      }
    }
    
    this.currentMetrics.memory = {
      total: totalMemory,
      used: usedMemory,
      free: freeMemory,
      available: availableMemory,
      utilization: usedMemory / totalMemory
    };
  }
  
  /**
   * Collect CPU usage metrics
   */
  async collectCpuMetrics() {
    const cpus = os.cpus();
    const loadAverage = os.loadavg();
    
    // Calculate CPU usage over time (simplified version)
    let totalIdle = 0;
    let totalTick = 0;
    
    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });
    
    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 1 - (idle / total);
    
    this.currentMetrics.cpu = {
      usage: Math.max(0, Math.min(1, usage)),
      loadAverage: loadAverage,
      utilization: Math.min(loadAverage[0] / cpus.length, 1),
      cores: cpus.length
    };
  }
  
  /**
   * Collect I/O and network metrics
   */
  async collectIoMetrics() {
    // Simplified I/O metrics - in production, use more sophisticated monitoring
    const process = require('process');
    
    this.currentMetrics.io = {
      diskUsage: 0, // Placeholder - implement disk monitoring if needed
      networkConnections: 0, // Placeholder - implement network monitoring if needed
      processMemory: process.memoryUsage(),
      uptime: process.uptime()
    };
  }
  
  /**
   * Update agent-specific metrics
   */
  updateAgentMetrics(agentMetrics) {
    this.currentMetrics.agents = {
      active: agentMetrics.activeCount || 0,
      totalContextUsage: agentMetrics.totalContextUsage || 0,
      averageContextUsage: agentMetrics.averageContextUsage || 0,
      memoryPerAgent: agentMetrics.memoryPerAgent || 0,
      agentTypes: agentMetrics.agentTypes || {}
    };
  }
  
  /**
   * Calculate optimal agent scaling recommendations
   */
  calculateScalingRecommendations() {
    const memory = this.currentMetrics.memory;
    const cpu = this.currentMetrics.cpu;
    const agents = this.currentMetrics.agents;
    
    // Memory-based calculation
    const estimatedMemoryPerAgent = 200 * 1024 * 1024; // 200MB per agent (conservative)
    const maxAgentsByMemory = Math.floor(
      (memory.available * this.config.targetMemoryUtilization) / estimatedMemoryPerAgent
    );
    
    // CPU-based calculation
    const maxAgentsByCpu = Math.floor(
      cpu.cores * this.config.targetCpuUtilization * 5 // 5 agents per core at 80% utilization
    );
    
    // Context-based calculation (200k tokens per agent)
    const maxAgentsByContext = Math.floor(
      (memory.available * 0.5) / (200000 * 2) // Conservative context memory estimation
    );
    
    // Take the most restrictive limit
    const optimalAgentCount = Math.min(maxAgentsByMemory, maxAgentsByCpu, maxAgentsByContext);
    const maxPossibleAgents = Math.max(maxAgentsByMemory, maxAgentsByCpu, maxAgentsByContext);
    
    // Determine recommended action
    let recommendedAction = 'maintain';
    const currentAgents = agents.active;
    
    if (currentAgents < optimalAgentCount * 0.7) {
      recommendedAction = 'scale_up';
    } else if (currentAgents > optimalAgentCount * 1.1) {
      recommendedAction = 'scale_down';
    } else if (memory.utilization > this.config.memoryThreshold || 
               cpu.utilization > this.config.cpuThreshold) {
      recommendedAction = 'scale_down';
    }
    
    this.currentMetrics.scaling = {
      optimalAgentCount: Math.max(1, optimalAgentCount),
      maxPossibleAgents: Math.max(1, maxPossibleAgents),
      recommendedAction,
      constraints: {
        memory: maxAgentsByMemory,
        cpu: maxAgentsByCpu,
        context: maxAgentsByContext
      },
      utilizationTargets: {
        memory: this.config.targetMemoryUtilization,
        cpu: this.config.targetCpuUtilization
      }
    };
  }
  
  /**
   * Store metrics in history for trend analysis
   */
  storeMetricsHistory() {
    const historyEntry = {
      timestamp: Date.now(),
      memory: { ...this.currentMetrics.memory },
      cpu: { ...this.currentMetrics.cpu },
      agents: { ...this.currentMetrics.agents },
      scaling: { ...this.currentMetrics.scaling }
    };
    
    this.metricHistory.push(historyEntry);
    
    // Maintain history size
    if (this.metricHistory.length > this.maxHistorySize) {
      this.metricHistory.shift();
    }
  }
  
  /**
   * Check thresholds and emit alerts
   */
  checkThresholds() {
    const memory = this.currentMetrics.memory;
    const cpu = this.currentMetrics.cpu;
    const agents = this.currentMetrics.agents;
    
    // Memory threshold check
    if (memory.utilization > this.config.memoryThreshold) {
      if (!this.alertStates.memory) {
        this.alertStates.memory = true;
        this.emit('threshold-exceeded', {
          type: 'memory',
          current: memory.utilization,
          threshold: this.config.memoryThreshold,
          recommendation: 'Scale down agents or increase memory'
        });
      }
    } else {
      this.alertStates.memory = false;
    }
    
    // CPU threshold check
    if (cpu.utilization > this.config.cpuThreshold) {
      if (!this.alertStates.cpu) {
        this.alertStates.cpu = true;
        this.emit('threshold-exceeded', {
          type: 'cpu',
          current: cpu.utilization,
          threshold: this.config.cpuThreshold,
          recommendation: 'Scale down agents or optimize CPU usage'
        });
      }
    } else {
      this.alertStates.cpu = false;
    }
    
    // Context threshold check
    if (agents.averageContextUsage > this.config.contextThreshold) {
      if (!this.alertStates.context) {
        this.alertStates.context = true;
        this.emit('threshold-exceeded', {
          type: 'context',
          current: agents.averageContextUsage,
          threshold: this.config.contextThreshold,
          recommendation: 'Optimize context usage or reduce agent workload'
        });
      }
    } else {
      this.alertStates.context = false;
    }
  }
  
  /**
   * Get current metrics snapshot
   */
  getMetrics() {
    return {
      current: { ...this.currentMetrics },
      system: { ...this.systemInfo },
      config: { ...this.config },
      isMonitoring: this.isMonitoring
    };
  }
  
  /**
   * Get metrics history for trend analysis
   */
  getMetricsHistory(duration = 300000) { // Last 5 minutes by default
    const cutoffTime = Date.now() - duration;
    return this.metricHistory.filter(entry => entry.timestamp >= cutoffTime);
  }
  
  /**
   * Get scaling recommendation
   */
  getScalingRecommendation() {
    return {
      ...this.currentMetrics.scaling,
      confidence: this.calculateRecommendationConfidence()
    };
  }
  
  /**
   * Calculate confidence in scaling recommendation
   */
  calculateRecommendationConfidence() {
    if (this.metricHistory.length < 10) return 0.5; // Low confidence with limited history
    
    // Analyze trend stability
    const recentHistory = this.metricHistory.slice(-10);
    const memoryVariance = this.calculateVariance(recentHistory.map(h => h.memory.utilization));
    const cpuVariance = this.calculateVariance(recentHistory.map(h => h.cpu.utilization));
    
    // Lower variance = higher confidence
    const stability = Math.max(0, 1 - (memoryVariance + cpuVariance));
    
    return Math.min(0.95, Math.max(0.1, stability));
  }
  
  /**
   * Calculate variance for stability analysis
   */
  calculateVariance(values) {
    if (values.length === 0) return 1;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return variance;
  }
  
  /**
   * Predict resource usage for additional agents
   */
  predictResourceUsage(additionalAgents) {
    const currentMemory = this.currentMetrics.memory.utilization;
    const currentCpu = this.currentMetrics.cpu.utilization;
    const currentAgents = this.currentMetrics.agents.active;
    
    // Simple linear prediction (can be enhanced with ML models)
    const memoryPerAgent = currentAgents > 0 ? currentMemory / currentAgents : 0.05; // 5% per agent default
    const cpuPerAgent = currentAgents > 0 ? currentCpu / currentAgents : 0.1; // 10% per agent default
    
    const predictedMemory = currentMemory + (additionalAgents * memoryPerAgent);
    const predictedCpu = currentCpu + (additionalAgents * cpuPerAgent);
    
    return {
      predictedMemoryUtilization: predictedMemory,
      predictedCpuUtilization: predictedCpu,
      withinThresholds: predictedMemory <= this.config.memoryThreshold && 
                       predictedCpu <= this.config.cpuThreshold,
      recommendedLimit: Math.max(0, additionalAgents - 1) // Conservative recommendation
    };
  }
  
  /**
   * Get resource status summary
   */
  getResourceStatus() {
    const metrics = this.currentMetrics;
    const scaling = this.getScalingRecommendation();
    
    return {
      status: this.isMonitoring ? 'active' : 'inactive',
      health: this.getOverallHealth(),
      resources: {
        memory: {
          usage: `${(metrics.memory.utilization * 100).toFixed(1)}%`,
          available: `${(metrics.memory.available / (1024 * 1024 * 1024)).toFixed(1)}GB`,
          threshold: `${(this.config.memoryThreshold * 100).toFixed(0)}%`
        },
        cpu: {
          usage: `${(metrics.cpu.utilization * 100).toFixed(1)}%`,
          cores: metrics.cpu.cores,
          threshold: `${(this.config.cpuThreshold * 100).toFixed(0)}%`
        },
        agents: {
          active: metrics.agents.active,
          optimal: scaling.optimalAgentCount,
          maximum: scaling.maxPossibleAgents
        }
      },
      recommendation: {
        action: scaling.recommendedAction,
        confidence: `${(scaling.confidence * 100).toFixed(0)}%`
      }
    };
  }
  
  /**
   * Get overall system health indicator
   */
  getOverallHealth() {
    const memory = this.currentMetrics.memory.utilization;
    const cpu = this.currentMetrics.cpu.utilization;
    
    if (memory > this.config.memoryThreshold || cpu > this.config.cpuThreshold) {
      return 'critical';
    } else if (memory > this.config.memoryThreshold * 0.8 || cpu > this.config.cpuThreshold * 0.8) {
      return 'warning';
    } else {
      return 'healthy';
    }
  }
}

module.exports = ResourceMonitor;