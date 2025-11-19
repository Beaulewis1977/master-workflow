/**
 * Database Performance Monitor - Advanced Database Performance Monitoring and Optimization
 * 
 * This module provides comprehensive database performance monitoring with:
 * - Real-time query performance tracking
 * - Connection pool monitoring
 * - Slow query detection and logging
 * - Database health checks
 * - Performance metrics collection
 * - Automatic optimization recommendations
 * 
 * @author Claude Database Architect Agent
 * @version 3.0.0
 * @date August 2025
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

class DatabasePerformanceMonitor extends EventEmitter {
  constructor(connectionManager, options = {}) {
    super();
    
    this.connectionManager = connectionManager;
    this.options = {
      slowQueryThreshold: options.slowQueryThreshold || 1000, // 1 second
      monitoringInterval: options.monitoringInterval || 30000, // 30 seconds
      metricsRetentionDays: options.metricsRetentionDays || 7,
      alertThresholds: {
        connectionPoolUtilization: options.connectionPoolThreshold || 80, // 80%
        averageQueryTime: options.avgQueryTimeThreshold || 500, // 500ms
        errorRate: options.errorRateThreshold || 5, // 5%
        ...options.alertThresholds
      },
      ...options
    };
    
    // Performance metrics storage
    this.metrics = {
      queries: new Map(), // Query performance by type
      connections: new Map(), // Connection pool metrics by pool
      alerts: [],
      slowQueries: [],
      systemHealth: {
        status: 'healthy',
        lastCheck: Date.now(),
        checks: []
      }
    };
    
    // Monitoring state
    this.isMonitoring = false;
    this.monitoringTimer = null;
    
    // Initialize monitoring
    this.initializeMonitoring();
  }
  
  /**
   * Initialize performance monitoring
   */
  initializeMonitoring() {
    if (!this.connectionManager) {
      console.error('[PERF-MONITOR] Connection manager not available');
      return;
    }
    
    // Listen to connection manager events
    this.connectionManager.on('query-success', (event) => {
      this.recordQueryPerformance(event);
    });
    
    this.connectionManager.on('query-error', (event) => {
      this.recordQueryError(event);
    });
    
    this.connectionManager.on('health-check', (metrics) => {
      this.updateConnectionMetrics(metrics);
    });
    
    this.connectionManager.on('transaction-committed', (event) => {
      this.recordTransactionMetrics(event, 'commit');
    });
    
    this.connectionManager.on('transaction-rolled-back', (event) => {
      this.recordTransactionMetrics(event, 'rollback');
    });
    
    console.log('[PERF-MONITOR] Performance monitoring initialized');
  }
  
  /**
   * Start performance monitoring
   */
  start() {
    if (this.isMonitoring) {
      console.warn('[PERF-MONITOR] Monitoring already started');
      return;
    }
    
    this.isMonitoring = true;
    
    // Start periodic monitoring
    this.monitoringTimer = setInterval(() => {
      this.performMonitoringCycle();
    }, this.options.monitoringInterval);
    
    console.log('[PERF-MONITOR] Performance monitoring started');
    this.emit('monitoring-started');
  }
  
  /**
   * Stop performance monitoring
   */
  stop() {
    if (!this.isMonitoring) {
      return;
    }
    
    this.isMonitoring = false;
    
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }
    
    console.log('[PERF-MONITOR] Performance monitoring stopped');
    this.emit('monitoring-stopped');
  }
  
  /**
   * Record query performance metrics
   */
  recordQueryPerformance(event) {
    const { query, duration, poolName, connectionId } = event;
    const queryType = this.extractQueryType(query);
    
    // Initialize query metrics if not exists
    if (!this.metrics.queries.has(queryType)) {
      this.metrics.queries.set(queryType, {
        totalExecutions: 0,
        totalDuration: 0,
        averageDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        errorCount: 0,
        lastExecution: 0
      });
    }
    
    const queryMetrics = this.metrics.queries.get(queryType);
    queryMetrics.totalExecutions++;
    queryMetrics.totalDuration += duration;
    queryMetrics.averageDuration = queryMetrics.totalDuration / queryMetrics.totalExecutions;
    queryMetrics.minDuration = Math.min(queryMetrics.minDuration, duration);
    queryMetrics.maxDuration = Math.max(queryMetrics.maxDuration, duration);
    queryMetrics.lastExecution = Date.now();
    
    // Check for slow queries
    if (duration > this.options.slowQueryThreshold) {
      this.recordSlowQuery({
        query,
        duration,
        poolName,
        connectionId,
        timestamp: Date.now(),
        queryType
      });
    }
    
    // Emit performance event
    this.emit('query-performance', {
      queryType,
      duration,
      poolName,
      isSlowQuery: duration > this.options.slowQueryThreshold
    });
  }
  
  /**
   * Record query error metrics
   */
  recordQueryError(event) {
    const { query, error, poolName } = event;
    const queryType = this.extractQueryType(query);
    
    // Update error count
    if (!this.metrics.queries.has(queryType)) {
      this.metrics.queries.set(queryType, {
        totalExecutions: 0,
        totalDuration: 0,
        averageDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        errorCount: 0,
        lastExecution: 0
      });
    }
    
    const queryMetrics = this.metrics.queries.get(queryType);
    queryMetrics.errorCount++;
    
    // Check error rate threshold
    const errorRate = (queryMetrics.errorCount / Math.max(1, queryMetrics.totalExecutions)) * 100;
    if (errorRate > this.options.alertThresholds.errorRate) {
      this.raiseAlert('high_error_rate', {
        queryType,
        errorRate,
        poolName,
        error: error.message
      });
    }
    
    this.emit('query-error-recorded', {
      queryType,
      error: error.message,
      poolName,
      errorRate
    });
  }
  
  /**
   * Update connection pool metrics
   */
  updateConnectionMetrics(metrics) {
    for (const [poolName, poolStats] of Object.entries(metrics.pools)) {
      this.metrics.connections.set(poolName, {
        ...poolStats,
        utilizationPercent: (poolStats.activeConnections / poolStats.totalConnections) * 100,
        timestamp: Date.now()
      });
      
      // Check connection pool utilization
      const utilization = (poolStats.activeConnections / poolStats.totalConnections) * 100;
      if (utilization > this.options.alertThresholds.connectionPoolUtilization) {
        this.raiseAlert('high_pool_utilization', {
          poolName,
          utilization,
          activeConnections: poolStats.activeConnections,
          totalConnections: poolStats.totalConnections
        });
      }
    }
    
    // Update system health
    this.updateSystemHealth(metrics);
  }
  
  /**
   * Record transaction metrics
   */
  recordTransactionMetrics(event, type) {
    const { transactionId, duration, operations } = event;
    
    if (!this.metrics.transactions) {
      this.metrics.transactions = {
        commits: 0,
        rollbacks: 0,
        totalDuration: 0,
        averageDuration: 0,
        averageOperations: 0
      };
    }
    
    const txnMetrics = this.metrics.transactions;
    txnMetrics[type === 'commit' ? 'commits' : 'rollbacks']++;
    
    const totalTransactions = txnMetrics.commits + txnMetrics.rollbacks;
    txnMetrics.totalDuration += duration;
    txnMetrics.averageDuration = txnMetrics.totalDuration / totalTransactions;
    txnMetrics.averageOperations = (txnMetrics.averageOperations * (totalTransactions - 1) + operations) / totalTransactions;
    
    this.emit('transaction-recorded', {
      type,
      duration,
      operations,
      transactionId
    });
  }
  
  /**
   * Record slow query for analysis
   */
  recordSlowQuery(slowQuery) {
    this.metrics.slowQueries.push(slowQuery);
    
    // Keep only recent slow queries (last 1000)
    if (this.metrics.slowQueries.length > 1000) {
      this.metrics.slowQueries = this.metrics.slowQueries.slice(-1000);
    }
    
    console.warn(`[PERF-MONITOR] Slow query detected: ${slowQuery.queryType} took ${slowQuery.duration}ms`);
    
    this.emit('slow-query-detected', slowQuery);
  }
  
  /**
   * Raise performance alert
   */
  raiseAlert(alertType, details) {
    const alert = {
      id: require('crypto').randomUUID(),
      type: alertType,
      details,
      timestamp: Date.now(),
      severity: this.getAlertSeverity(alertType),
      acknowledged: false
    };
    
    this.metrics.alerts.push(alert);
    
    // Keep only recent alerts (last 100)
    if (this.metrics.alerts.length > 100) {
      this.metrics.alerts = this.metrics.alerts.slice(-100);
    }
    
    console.warn(`[PERF-MONITOR] Alert raised: ${alertType}`, details);
    
    this.emit('performance-alert', alert);
  }
  
  /**
   * Get alert severity level
   */
  getAlertSeverity(alertType) {
    const severityMap = {
      high_error_rate: 'critical',
      high_pool_utilization: 'warning',
      slow_query_threshold: 'warning',
      connection_failure: 'critical',
      memory_usage_high: 'warning',
      disk_space_low: 'critical'
    };
    
    return severityMap[alertType] || 'info';
  }
  
  /**
   * Extract query type from SQL
   */
  extractQueryType(query) {
    if (!query || typeof query !== 'string') {
      return 'unknown';
    }
    
    const cleanQuery = query.trim().toUpperCase();
    
    if (cleanQuery.startsWith('SELECT')) return 'SELECT';
    if (cleanQuery.startsWith('INSERT')) return 'INSERT';
    if (cleanQuery.startsWith('UPDATE')) return 'UPDATE';
    if (cleanQuery.startsWith('DELETE')) return 'DELETE';
    if (cleanQuery.startsWith('CREATE')) return 'CREATE';
    if (cleanQuery.startsWith('ALTER')) return 'ALTER';
    if (cleanQuery.startsWith('DROP')) return 'DROP';
    if (cleanQuery.startsWith('PRAGMA')) return 'PRAGMA';
    if (cleanQuery.startsWith('BEGIN')) return 'BEGIN';
    if (cleanQuery.startsWith('COMMIT')) return 'COMMIT';
    if (cleanQuery.startsWith('ROLLBACK')) return 'ROLLBACK';
    
    return 'OTHER';
  }
  
  /**
   * Perform monitoring cycle
   */
  async performMonitoringCycle() {
    try {
      // Get current system stats
      const systemStats = this.connectionManager.getStats();
      
      // Analyze performance trends
      this.analyzePerformanceTrends();
      
      // Check for performance issues
      this.checkPerformanceIssues(systemStats);
      
      // Generate optimization recommendations
      const recommendations = this.generateOptimizationRecommendations();
      
      // Update system health
      this.updateSystemHealthCheck();
      
      // Emit monitoring cycle complete
      this.emit('monitoring-cycle-complete', {
        timestamp: Date.now(),
        systemStats,
        recommendations,
        alertCount: this.metrics.alerts.filter(a => !a.acknowledged).length
      });
      
    } catch (error) {
      console.error('[PERF-MONITOR] Monitoring cycle error:', error.message);
      this.emit('monitoring-error', error);
    }
  }
  
  /**
   * Analyze performance trends
   */
  analyzePerformanceTrends() {
    // Analyze query performance trends
    for (const [queryType, metrics] of this.metrics.queries) {
      if (metrics.averageDuration > this.options.alertThresholds.averageQueryTime) {
        this.raiseAlert('slow_query_threshold', {
          queryType,
          averageDuration: metrics.averageDuration,
          threshold: this.options.alertThresholds.averageQueryTime
        });
      }
    }
  }
  
  /**
   * Check for performance issues
   */
  checkPerformanceIssues(systemStats) {
    // Check connection pool health
    for (const [poolName, poolStats] of Object.entries(systemStats.pools || {})) {
      const waitingRequests = poolStats.waitingRequests || 0;
      
      if (waitingRequests > 5) {
        this.raiseAlert('high_connection_wait', {
          poolName,
          waitingRequests,
          activeConnections: poolStats.activeConnections
        });
      }
    }
    
    // Check cache performance
    const cacheStats = systemStats.cacheStats || {};
    const hitRate = parseFloat(cacheStats.hitRate) || 0;
    
    if (hitRate < 70) { // Less than 70% hit rate
      this.raiseAlert('low_cache_hit_rate', {
        hitRate,
        cacheSize: cacheStats.size,
        hits: cacheStats.hits,
        misses: cacheStats.misses
      });
    }
  }
  
  /**
   * Generate optimization recommendations
   */
  generateOptimizationRecommendations() {
    const recommendations = [];
    
    // Analyze slow queries
    const recentSlowQueries = this.metrics.slowQueries
      .filter(q => q.timestamp > Date.now() - 3600000) // Last hour
      .reduce((acc, q) => {
        acc[q.queryType] = (acc[q.queryType] || 0) + 1;
        return acc;
      }, {});
    
    for (const [queryType, count] of Object.entries(recentSlowQueries)) {
      if (count > 5) {
        recommendations.push({
          type: 'index_optimization',
          priority: 'high',
          description: `Consider adding indexes for ${queryType} queries (${count} slow queries in last hour)`,
          queryType
        });
      }
    }
    
    // Connection pool recommendations
    for (const [poolName, metrics] of this.metrics.connections) {
      if (metrics.utilizationPercent > 80) {
        recommendations.push({
          type: 'connection_pool',
          priority: 'medium',
          description: `Consider increasing connection pool size for ${poolName} (${metrics.utilizationPercent.toFixed(1)}% utilization)`,
          poolName
        });
      }
    }
    
    // Cache recommendations
    const totalQueries = Array.from(this.metrics.queries.values())
      .reduce((sum, m) => sum + m.totalExecutions, 0);
    
    if (totalQueries > 1000) { // Only recommend if significant query volume
      const selectQueries = this.metrics.queries.get('SELECT');
      if (selectQueries && selectQueries.totalExecutions > totalQueries * 0.6) {
        recommendations.push({
          type: 'caching',
          priority: 'medium',
          description: 'High SELECT query volume detected - consider implementing query result caching',
          selectRatio: (selectQueries.totalExecutions / totalQueries * 100).toFixed(1)
        });
      }
    }
    
    return recommendations;
  }
  
  /**
   * Update system health check
   */
  updateSystemHealthCheck() {
    const health = {
      status: 'healthy',
      lastCheck: Date.now(),
      checks: []
    };
    
    // Check for critical alerts
    const criticalAlerts = this.metrics.alerts.filter(a => 
      !a.acknowledged && a.severity === 'critical' && 
      a.timestamp > Date.now() - 300000 // Last 5 minutes
    );
    
    if (criticalAlerts.length > 0) {
      health.status = 'critical';
      health.checks.push({
        name: 'critical_alerts',
        status: 'failed',
        message: `${criticalAlerts.length} unacknowledged critical alerts`
      });
    }
    
    // Check connection manager health
    const systemStats = this.connectionManager.getStats();
    if (!systemStats.isHealthy) {
      health.status = health.status === 'critical' ? 'critical' : 'warning';
      health.checks.push({
        name: 'connection_manager',
        status: 'warning',
        message: 'Connection manager reports unhealthy state'
      });
    }
    
    // Check query error rates
    let highErrorRateDetected = false;
    for (const [queryType, metrics] of this.metrics.queries) {
      const errorRate = (metrics.errorCount / Math.max(1, metrics.totalExecutions)) * 100;
      if (errorRate > this.options.alertThresholds.errorRate) {
        highErrorRateDetected = true;
        health.checks.push({
          name: 'query_error_rate',
          status: 'warning',
          message: `High error rate for ${queryType} queries: ${errorRate.toFixed(1)}%`
        });
      }
    }
    
    if (highErrorRateDetected && health.status === 'healthy') {
      health.status = 'warning';
    }
    
    // If no issues found, add success checks
    if (health.status === 'healthy') {
      health.checks.push(
        { name: 'alerts', status: 'passed', message: 'No critical alerts' },
        { name: 'connections', status: 'passed', message: 'Connection pools healthy' },
        { name: 'queries', status: 'passed', message: 'Query performance within thresholds' }
      );
    }
    
    this.metrics.systemHealth = health;
    
    this.emit('health-updated', health);
  }
  
  /**
   * Get comprehensive performance report
   */
  getPerformanceReport() {
    return {
      timestamp: Date.now(),
      monitoringStatus: this.isMonitoring ? 'active' : 'stopped',
      systemHealth: this.metrics.systemHealth,
      queryMetrics: Object.fromEntries(this.metrics.queries),
      connectionMetrics: Object.fromEntries(this.metrics.connections),
      transactionMetrics: this.metrics.transactions || {},
      recentSlowQueries: this.metrics.slowQueries.slice(-10), // Last 10
      activeAlerts: this.metrics.alerts.filter(a => !a.acknowledged),
      recommendations: this.generateOptimizationRecommendations(),
      statistics: {
        totalQueriesMonitored: Array.from(this.metrics.queries.values())
          .reduce((sum, m) => sum + m.totalExecutions, 0),
        averageQueryTime: this.getOverallAverageQueryTime(),
        totalSlowQueries: this.metrics.slowQueries.length,
        totalAlerts: this.metrics.alerts.length,
        connectionPools: this.metrics.connections.size
      }
    };
  }
  
  /**
   * Get overall average query time
   */
  getOverallAverageQueryTime() {
    let totalTime = 0;
    let totalQueries = 0;
    
    for (const metrics of this.metrics.queries.values()) {
      totalTime += metrics.totalDuration;
      totalQueries += metrics.totalExecutions;
    }
    
    return totalQueries > 0 ? totalTime / totalQueries : 0;
  }
  
  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId) {
    const alert = this.metrics.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = Date.now();
      
      this.emit('alert-acknowledged', alert);
      return true;
    }
    return false;
  }
  
  /**
   * Clear old metrics data
   */
  async clearOldMetrics() {
    const cutoffTime = Date.now() - (this.options.metricsRetentionDays * 24 * 60 * 60 * 1000);
    
    // Clear old slow queries
    this.metrics.slowQueries = this.metrics.slowQueries.filter(q => q.timestamp > cutoffTime);
    
    // Clear old alerts
    this.metrics.alerts = this.metrics.alerts.filter(a => a.timestamp > cutoffTime);
    
    console.log('[PERF-MONITOR] Old metrics cleared');
  }
  
  /**
   * Export performance data
   */
  async exportPerformanceData(filePath) {
    try {
      const report = this.getPerformanceReport();
      await fs.writeFile(filePath, JSON.stringify(report, null, 2));
      
      console.log(`[PERF-MONITOR] Performance data exported to ${filePath}`);
      return true;
    } catch (error) {
      console.error('[PERF-MONITOR] Failed to export performance data:', error.message);
      return false;
    }
  }
}

module.exports = DatabasePerformanceMonitor;