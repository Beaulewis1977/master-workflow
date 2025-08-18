/**
 * Resource Management System
 * 
 * Comprehensive resource monitoring, allocation, and cleanup
 * for the intelligence engine system.
 * 
 * @author Recovery Specialist Agent
 * @version 1.0.0
 * @date August 2025
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const os = require('os');
const path = require('path');
const crypto = require('crypto');

class ResourceManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      // Memory thresholds
      memoryWarningThreshold: options.memoryWarningThreshold || 0.8,  // 80%
      memoryCriticalThreshold: options.memoryCriticalThreshold || 0.9, // 90%
      memoryCheckInterval: options.memoryCheckInterval || 10000,      // 10 seconds
      
      // CPU thresholds
      cpuWarningThreshold: options.cpuWarningThreshold || 80,         // 80%
      cpuCriticalThreshold: options.cpuCriticalThreshold || 95,       // 95%
      cpuCheckInterval: options.cpuCheckInterval || 5000,             // 5 seconds
      
      // Disk thresholds
      diskWarningThreshold: options.diskWarningThreshold || 0.85,     // 85%
      diskCriticalThreshold: options.diskCriticalThreshold || 0.95,   // 95%
      diskCheckInterval: options.diskCheckInterval || 30000,          // 30 seconds
      
      // Connection limits
      maxDatabaseConnections: options.maxDatabaseConnections || 100,
      maxFileHandles: options.maxFileHandles || 1000,
      maxNetworkConnections: options.maxNetworkConnections || 500,
      
      // Cleanup settings
      tempFileMaxAge: options.tempFileMaxAge || 3600000,              // 1 hour
      logFileMaxSize: options.logFileMaxSize || 100 * 1024 * 1024,   // 100MB
      cleanupInterval: options.cleanupInterval || 300000,             // 5 minutes
      
      // Process limits
      maxProcesses: options.maxProcesses || 50,
      processTimeout: options.processTimeout || 300000,               // 5 minutes
      
      ...options
    };
    
    // Resource tracking
    this.resources = {
      memory: {
        current: { used: 0, total: 0, percentage: 0 },
        history: [],
        alerts: []
      },
      cpu: {
        current: { usage: 0, load: [0, 0, 0] },
        history: [],
        alerts: []
      },
      disk: {
        current: { used: 0, total: 0, percentage: 0 },
        history: [],
        alerts: []
      },
      connections: {
        database: { active: 0, max: this.options.maxDatabaseConnections },
        files: { active: 0, max: this.options.maxFileHandles },
        network: { active: 0, max: this.options.maxNetworkConnections }
      },
      processes: {
        active: new Map(),
        count: 0,
        max: this.options.maxProcesses
      }
    };
    
    // Monitoring timers
    this.timers = {
      memory: null,
      cpu: null,
      disk: null,
      cleanup: null
    };
    
    // Cleanup registry
    this.cleanupTasks = new Map();
    this.tempFiles = new Set();
    this.managedResources = new Set();
    
    // Metrics
    this.metrics = {
      resourceLeaks: 0,
      cleanupOperations: 0,
      alertsTriggered: 0,
      resourcesReleased: 0,
      memoryReclaimed: 0,
      startTime: Date.now()
    };
    
    // Initialize system
    this.initialize();
  }
  
  /**
   * Initialize resource management system
   */
  async initialize() {
    try {
      console.log('[RESOURCES] Initializing resource management system...');
      
      // Start monitoring
      this.startMemoryMonitoring();
      this.startCPUMonitoring();
      this.startDiskMonitoring();
      this.startCleanupTasks();
      
      // Setup cleanup handlers
      this.setupCleanupHandlers();
      
      console.log('[RESOURCES] Resource management system initialized');
      this.emit('initialized');
      
    } catch (error) {
      console.error('[RESOURCES] Failed to initialize:', error.message);
      this.emit('error', error);
    }
  }
  
  /**
   * Start memory monitoring
   */
  startMemoryMonitoring() {
    this.timers.memory = setInterval(async () => {
      try {
        await this.checkMemoryUsage();
      } catch (error) {
        console.error('[RESOURCES] Memory monitoring error:', error.message);
      }
    }, this.options.memoryCheckInterval);
    
    console.log('[RESOURCES] Memory monitoring started');
  }
  
  /**
   * Start CPU monitoring
   */
  startCPUMonitoring() {
    this.timers.cpu = setInterval(async () => {
      try {
        await this.checkCPUUsage();
      } catch (error) {
        console.error('[RESOURCES] CPU monitoring error:', error.message);
      }
    }, this.options.cpuCheckInterval);
    
    console.log('[RESOURCES] CPU monitoring started');
  }
  
  /**
   * Start disk monitoring
   */
  startDiskMonitoring() {
    this.timers.disk = setInterval(async () => {
      try {
        await this.checkDiskUsage();
      } catch (error) {
        console.error('[RESOURCES] Disk monitoring error:', error.message);
      }
    }, this.options.diskCheckInterval);
    
    console.log('[RESOURCES] Disk monitoring started');
  }
  
  /**
   * Start cleanup tasks
   */
  startCleanupTasks() {
    this.timers.cleanup = setInterval(async () => {
      try {
        await this.performCleanup();
      } catch (error) {
        console.error('[RESOURCES] Cleanup error:', error.message);
      }
    }, this.options.cleanupInterval);
    
    console.log('[RESOURCES] Cleanup tasks started');
  }
  
  /**
   * Check memory usage and trigger alerts if needed
   */
  async checkMemoryUsage() {
    const memoryInfo = process.memoryUsage();
    const systemMemory = {
      total: os.totalmem(),
      free: os.freemem()
    };
    
    const processMemory = {
      rss: memoryInfo.rss,
      heapTotal: memoryInfo.heapTotal,
      heapUsed: memoryInfo.heapUsed,
      external: memoryInfo.external
    };
    
    const systemUsed = systemMemory.total - systemMemory.free;
    const systemPercentage = systemUsed / systemMemory.total;
    
    // Update current state
    this.resources.memory.current = {
      system: {
        used: systemUsed,
        total: systemMemory.total,
        percentage: systemPercentage
      },
      process: processMemory,
      timestamp: Date.now()
    };
    
    // Add to history (keep last 100 entries)
    this.resources.memory.history.push(this.resources.memory.current);
    if (this.resources.memory.history.length > 100) {
      this.resources.memory.history.shift();
    }
    
    // Check thresholds
    await this.checkMemoryThresholds(systemPercentage);
  }
  
  /**
   * Check memory thresholds and trigger alerts
   */
  async checkMemoryThresholds(percentage) {
    const now = Date.now();
    
    if (percentage >= this.options.memoryCriticalThreshold) {
      const alert = {
        level: 'critical',
        type: 'memory',
        percentage: Math.round(percentage * 100),
        timestamp: now,
        message: `Critical memory usage: ${Math.round(percentage * 100)}%`
      };
      
      this.resources.memory.alerts.push(alert);
      this.metrics.alertsTriggered++;
      
      console.error(`[RESOURCES] ${alert.message}`);
      this.emit('resource.critical', alert);
      
      // Trigger emergency cleanup
      await this.performEmergencyCleanup('memory');
      
    } else if (percentage >= this.options.memoryWarningThreshold) {
      const alert = {
        level: 'warning',
        type: 'memory',
        percentage: Math.round(percentage * 100),
        timestamp: now,
        message: `High memory usage: ${Math.round(percentage * 100)}%`
      };
      
      this.resources.memory.alerts.push(alert);
      this.metrics.alertsTriggered++;
      
      console.warn(`[RESOURCES] ${alert.message}`);
      this.emit('resource.warning', alert);
    }
    
    // Cleanup old alerts (keep last 50)
    if (this.resources.memory.alerts.length > 50) {
      this.resources.memory.alerts = this.resources.memory.alerts.slice(-50);
    }
  }
  
  /**
   * Check CPU usage
   */
  async checkCPUUsage() {
    const startUsage = process.cpuUsage();
    const startTime = process.hrtime();
    
    // Wait a short interval to measure CPU usage
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const endUsage = process.cpuUsage(startUsage);
    const endTime = process.hrtime(startTime);
    
    const totalTime = (endTime[0] * 1000000 + endTime[1] / 1000) * 1000; // microseconds
    const cpuTime = endUsage.user + endUsage.system; // microseconds
    const cpuPercentage = (cpuTime / totalTime) * 100;
    
    const loadAverage = os.loadavg();
    
    // Update current state
    this.resources.cpu.current = {
      usage: Math.min(cpuPercentage, 100), // Cap at 100%
      load: loadAverage,
      timestamp: Date.now()
    };
    
    // Add to history
    this.resources.cpu.history.push(this.resources.cpu.current);
    if (this.resources.cpu.history.length > 100) {
      this.resources.cpu.history.shift();
    }
    
    // Check thresholds
    await this.checkCPUThresholds(cpuPercentage);
  }
  
  /**
   * Check CPU thresholds and trigger alerts
   */
  async checkCPUThresholds(percentage) {
    const now = Date.now();
    
    if (percentage >= this.options.cpuCriticalThreshold) {
      const alert = {
        level: 'critical',
        type: 'cpu',
        percentage: Math.round(percentage),
        timestamp: now,
        message: `Critical CPU usage: ${Math.round(percentage)}%`
      };
      
      this.resources.cpu.alerts.push(alert);
      this.metrics.alertsTriggered++;
      
      console.error(`[RESOURCES] ${alert.message}`);
      this.emit('resource.critical', alert);
      
      // Trigger process throttling
      await this.throttleProcesses();
      
    } else if (percentage >= this.options.cpuWarningThreshold) {
      const alert = {
        level: 'warning',
        type: 'cpu',
        percentage: Math.round(percentage),
        timestamp: now,
        message: `High CPU usage: ${Math.round(percentage)}%`
      };
      
      this.resources.cpu.alerts.push(alert);
      this.metrics.alertsTriggered++;
      
      console.warn(`[RESOURCES] ${alert.message}`);
      this.emit('resource.warning', alert);
    }
    
    // Cleanup old alerts
    if (this.resources.cpu.alerts.length > 50) {
      this.resources.cpu.alerts = this.resources.cpu.alerts.slice(-50);
    }
  }
  
  /**
   * Check disk usage
   */
  async checkDiskUsage() {
    try {
      const stats = await fs.statfs(process.cwd());
      
      const total = stats.blocks * stats.bsize;
      const free = stats.bavail * stats.bsize;
      const used = total - free;
      const percentage = used / total;
      
      // Update current state
      this.resources.disk.current = {
        used,
        total,
        free,
        percentage,
        timestamp: Date.now()
      };
      
      // Add to history
      this.resources.disk.history.push(this.resources.disk.current);
      if (this.resources.disk.history.length > 100) {
        this.resources.disk.history.shift();
      }
      
      // Check thresholds
      await this.checkDiskThresholds(percentage);
      
    } catch (error) {
      console.warn('[RESOURCES] Failed to check disk usage:', error.message);
    }
  }
  
  /**
   * Check disk thresholds and trigger alerts
   */
  async checkDiskThresholds(percentage) {
    const now = Date.now();
    
    if (percentage >= this.options.diskCriticalThreshold) {
      const alert = {
        level: 'critical',
        type: 'disk',
        percentage: Math.round(percentage * 100),
        timestamp: now,
        message: `Critical disk usage: ${Math.round(percentage * 100)}%`
      };
      
      this.resources.disk.alerts.push(alert);
      this.metrics.alertsTriggered++;
      
      console.error(`[RESOURCES] ${alert.message}`);
      this.emit('resource.critical', alert);
      
      // Trigger emergency disk cleanup
      await this.performEmergencyCleanup('disk');
      
    } else if (percentage >= this.options.diskWarningThreshold) {
      const alert = {
        level: 'warning',
        type: 'disk',
        percentage: Math.round(percentage * 100),
        timestamp: now,
        message: `High disk usage: ${Math.round(percentage * 100)}%`
      };
      
      this.resources.disk.alerts.push(alert);
      this.metrics.alertsTriggered++;
      
      console.warn(`[RESOURCES] ${alert.message}`);
      this.emit('resource.warning', alert);
    }
    
    // Cleanup old alerts
    if (this.resources.disk.alerts.length > 50) {
      this.resources.disk.alerts = this.resources.disk.alerts.slice(-50);
    }
  }
  
  /**
   * Perform regular cleanup tasks
   */
  async performCleanup() {
    console.log('[RESOURCES] Performing regular cleanup...');
    
    const cleanupStart = Date.now();
    let cleanedItems = 0;
    let reclaimedBytes = 0;
    
    try {
      // Clean up temporary files
      const tempCleanup = await this.cleanupTempFiles();
      cleanedItems += tempCleanup.files;
      reclaimedBytes += tempCleanup.bytes;
      
      // Clean up old log files
      const logCleanup = await this.cleanupLogFiles();
      cleanedItems += logCleanup.files;
      reclaimedBytes += logCleanup.bytes;
      
      // Clean up expired resources
      const resourceCleanup = await this.cleanupExpiredResources();
      cleanedItems += resourceCleanup.resources;
      
      // Clean up completed processes
      const processCleanup = await this.cleanupProcesses();
      cleanedItems += processCleanup.processes;
      
      // Update metrics
      this.metrics.cleanupOperations++;
      this.metrics.resourcesReleased += cleanedItems;
      this.metrics.memoryReclaimed += reclaimedBytes;
      
      const duration = Date.now() - cleanupStart;
      
      if (cleanedItems > 0 || reclaimedBytes > 0) {
        console.log(
          `[RESOURCES] Cleanup completed: ${cleanedItems} items, ` +
          `${this.formatBytes(reclaimedBytes)} reclaimed in ${duration}ms`
        );
      }
      
      this.emit('cleanup.completed', {
        items: cleanedItems,
        bytes: reclaimedBytes,
        duration
      });
      
    } catch (error) {
      console.error('[RESOURCES] Cleanup failed:', error.message);
      this.emit('cleanup.failed', { error: error.message });
    }
  }
  
  /**
   * Clean up temporary files
   */
  async cleanupTempFiles() {
    let cleanedFiles = 0;
    let reclaimedBytes = 0;
    
    const tempDirs = [
      os.tmpdir(),
      path.join(process.cwd(), '.tmp'),
      path.join(process.cwd(), 'tmp')
    ];
    
    for (const tempDir of tempDirs) {
      try {
        const files = await fs.readdir(tempDir, { withFileTypes: true });
        
        for (const file of files) {
          const filePath = path.join(tempDir, file.name);
          
          try {
            const stats = await fs.stat(filePath);
            const age = Date.now() - stats.mtime.getTime();
            
            if (age > this.options.tempFileMaxAge) {
              if (file.isDirectory()) {
                await fs.rm(filePath, { recursive: true, force: true });
              } else {
                await fs.rm(filePath, { force: true });
              }
              
              cleanedFiles++;
              reclaimedBytes += stats.size;
            }
          } catch (error) {
            // File might have been deleted or permission denied
            continue;
          }
        }
      } catch (error) {
        // Directory might not exist
        continue;
      }
    }
    
    return { files: cleanedFiles, bytes: reclaimedBytes };
  }
  
  /**
   * Clean up old log files
   */
  async cleanupLogFiles() {
    let cleanedFiles = 0;
    let reclaimedBytes = 0;
    
    const logDirs = [
      path.join(process.cwd(), 'logs'),
      path.join(process.cwd(), '.logs'),
      path.join(process.cwd(), '.ai-workflow', 'logs')
    ];
    
    for (const logDir of logDirs) {
      try {
        const files = await fs.readdir(logDir);
        
        for (const file of files) {
          if (!file.endsWith('.log')) continue;
          
          const filePath = path.join(logDir, file);
          
          try {
            const stats = await fs.stat(filePath);
            
            if (stats.size > this.options.logFileMaxSize) {
              // Truncate large log files instead of deleting
              const content = await fs.readFile(filePath, 'utf-8');
              const lines = content.split('\n');
              const keepLines = lines.slice(-1000); // Keep last 1000 lines
              
              await fs.writeFile(filePath, keepLines.join('\n'));
              
              const newStats = await fs.stat(filePath);
              reclaimedBytes += stats.size - newStats.size;
              cleanedFiles++;
            }
          } catch (error) {
            continue;
          }
        }
      } catch (error) {
        continue;
      }
    }
    
    return { files: cleanedFiles, bytes: reclaimedBytes };
  }
  
  /**
   * Clean up expired resources
   */
  async cleanupExpiredResources() {
    let cleanedResources = 0;
    const now = Date.now();
    
    // Check managed resources for expiration
    for (const resource of this.managedResources) {
      if (resource.expiresAt && resource.expiresAt < now) {
        try {
          if (resource.cleanup && typeof resource.cleanup === 'function') {
            await resource.cleanup();
          }
          
          this.managedResources.delete(resource);
          cleanedResources++;
          
        } catch (error) {
          console.warn(`[RESOURCES] Failed to cleanup resource ${resource.id}:`, error.message);
        }
      }
    }
    
    return { resources: cleanedResources };
  }
  
  /**
   * Clean up completed processes
   */
  async cleanupProcesses() {
    let cleanedProcesses = 0;
    const now = Date.now();
    
    for (const [pid, processInfo] of this.resources.processes.active) {
      // Check if process is still running
      try {
        process.kill(pid, 0); // Signal 0 just checks if process exists
        
        // Check for timeout
        if (processInfo.timeout && now > processInfo.timeout) {
          console.warn(`[RESOURCES] Terminating timed out process ${pid}`);
          
          try {
            process.kill(pid, 'SIGTERM');
            
            // Give it 5 seconds to terminate gracefully
            setTimeout(() => {
              try {
                process.kill(pid, 'SIGKILL');
              } catch (error) {
                // Process already terminated
              }
            }, 5000);
            
          } catch (error) {
            // Process might have already terminated
          }
          
          this.resources.processes.active.delete(pid);
          cleanedProcesses++;
        }
        
      } catch (error) {
        // Process doesn't exist anymore
        this.resources.processes.active.delete(pid);
        cleanedProcesses++;
      }
    }
    
    this.resources.processes.count = this.resources.processes.active.size;
    
    return { processes: cleanedProcesses };
  }
  
  /**
   * Perform emergency cleanup when resources are critically low
   */
  async performEmergencyCleanup(resourceType) {
    console.log(`[RESOURCES] Performing emergency ${resourceType} cleanup...`);
    
    try {
      switch (resourceType) {
        case 'memory':
          await this.emergencyMemoryCleanup();
          break;
          
        case 'disk':
          await this.emergencyDiskCleanup();
          break;
          
        case 'cpu':
          await this.throttleProcesses();
          break;
      }
      
      this.emit('emergency.cleanup', { resourceType });
      
    } catch (error) {
      console.error(`[RESOURCES] Emergency ${resourceType} cleanup failed:`, error.message);
      this.emit('emergency.cleanup.failed', { resourceType, error: error.message });
    }
  }
  
  /**
   * Emergency memory cleanup
   */
  async emergencyMemoryCleanup() {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      console.log('[RESOURCES] Forced garbage collection');
    }
    
    // Clear caches if available
    if (this.sharedMemory && typeof this.sharedMemory.clearCache === 'function') {
      await this.sharedMemory.clearCache();
      console.log('[RESOURCES] Cleared shared memory cache');
    }
    
    // Terminate non-essential processes
    let terminated = 0;
    for (const [pid, processInfo] of this.resources.processes.active) {
      if (!processInfo.essential) {
        try {
          process.kill(pid, 'SIGTERM');
          this.resources.processes.active.delete(pid);
          terminated++;
        } catch (error) {
          // Process might have already terminated
        }
        
        if (terminated >= 5) break; // Limit emergency terminations
      }
    }
    
    if (terminated > 0) {
      console.log(`[RESOURCES] Emergency: terminated ${terminated} non-essential processes`);
    }
  }
  
  /**
   * Emergency disk cleanup
   */
  async emergencyDiskCleanup() {
    // Aggressive temp file cleanup
    await this.cleanupTempFiles();
    
    // Clear all log files (keep only basic structure)
    const logDirs = [
      path.join(process.cwd(), 'logs'),
      path.join(process.cwd(), '.logs')
    ];
    
    for (const logDir of logDirs) {
      try {
        const files = await fs.readdir(logDir);
        
        for (const file of files) {
          if (file.endsWith('.log')) {
            const filePath = path.join(logDir, file);
            await fs.writeFile(filePath, ''); // Empty the log file
          }
        }
      } catch (error) {
        continue;
      }
    }
    
    console.log('[RESOURCES] Emergency: cleared log files');
  }
  
  /**
   * Throttle processes to reduce CPU usage
   */
  async throttleProcesses() {
    console.log('[RESOURCES] Throttling processes to reduce CPU usage...');
    
    // This is a placeholder - actual implementation would depend on
    // the specific processes and how they can be throttled
    
    this.emit('processes.throttled');
  }
  
  /**
   * Register a managed resource for automatic cleanup
   */
  registerResource(resource) {
    const managedResource = {
      id: crypto.randomUUID(),
      ...resource,
      registeredAt: Date.now(),
      expiresAt: resource.ttl ? Date.now() + resource.ttl : null
    };
    
    this.managedResources.add(managedResource);
    
    return managedResource.id;
  }
  
  /**
   * Unregister a managed resource
   */
  unregisterResource(resourceId) {
    for (const resource of this.managedResources) {
      if (resource.id === resourceId) {
        this.managedResources.delete(resource);
        return true;
      }
    }
    return false;
  }
  
  /**
   * Track a database connection
   */
  trackDatabaseConnection(connectionId, metadata = {}) {
    this.resources.connections.database.active++;
    
    const connectionInfo = {
      id: connectionId,
      createdAt: Date.now(),
      ...metadata
    };
    
    // Warn if approaching limit
    if (this.resources.connections.database.active > 
        this.resources.connections.database.max * 0.9) {
      console.warn(
        `[RESOURCES] Database connections near limit: ` +
        `${this.resources.connections.database.active}/${this.resources.connections.database.max}`
      );
    }
    
    return connectionInfo;
  }
  
  /**
   * Release a database connection
   */
  releaseDatabaseConnection(connectionId) {
    if (this.resources.connections.database.active > 0) {
      this.resources.connections.database.active--;
    }
  }
  
  /**
   * Track a process
   */
  trackProcess(pid, metadata = {}) {
    const processInfo = {
      pid,
      startedAt: Date.now(),
      timeout: metadata.timeout ? Date.now() + metadata.timeout : null,
      essential: metadata.essential || false,
      ...metadata
    };
    
    this.resources.processes.active.set(pid, processInfo);
    this.resources.processes.count = this.resources.processes.active.size;
    
    // Check process limit
    if (this.resources.processes.count > this.resources.processes.max) {
      console.warn(
        `[RESOURCES] Process limit exceeded: ` +
        `${this.resources.processes.count}/${this.resources.processes.max}`
      );
      
      this.emit('process.limit.exceeded', {
        current: this.resources.processes.count,
        max: this.resources.processes.max
      });
    }
    
    return processInfo;
  }
  
  /**
   * Release a process
   */
  releaseProcess(pid) {
    if (this.resources.processes.active.has(pid)) {
      this.resources.processes.active.delete(pid);
      this.resources.processes.count = this.resources.processes.active.size;
    }
  }
  
  /**
   * Setup cleanup handlers for graceful shutdown
   */
  setupCleanupHandlers() {
    const cleanup = async (signal) => {
      console.log(`[RESOURCES] Received ${signal}, performing cleanup...`);
      await this.shutdown();
      process.exit(0);
    };
    
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('SIGUSR2', cleanup); // nodemon restart
    
    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      console.error('[RESOURCES] Uncaught exception:', error);
      await this.performEmergencyCleanup('memory');
    });
    
    process.on('unhandledRejection', async (reason, promise) => {
      console.error('[RESOURCES] Unhandled promise rejection:', reason);
      this.metrics.resourceLeaks++;
    });
  }
  
  /**
   * Get system status
   */
  getStatus() {
    const uptime = Date.now() - this.metrics.startTime;
    
    return {
      uptime,
      resources: this.resources,
      metrics: this.metrics,
      configuration: {
        thresholds: {
          memory: {
            warning: this.options.memoryWarningThreshold,
            critical: this.options.memoryCriticalThreshold
          },
          cpu: {
            warning: this.options.cpuWarningThreshold,
            critical: this.options.cpuCriticalThreshold
          },
          disk: {
            warning: this.options.diskWarningThreshold,
            critical: this.options.diskCriticalThreshold
          }
        },
        limits: {
          processes: this.options.maxProcesses,
          databaseConnections: this.options.maxDatabaseConnections,
          fileHandles: this.options.maxFileHandles
        }
      },
      managedResources: this.managedResources.size,
      cleanupTasks: this.cleanupTasks.size
    };
  }
  
  /**
   * Format bytes to human readable string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('[RESOURCES] Shutting down resource manager...');
    
    // Stop all monitoring timers
    Object.values(this.timers).forEach(timer => {
      if (timer) clearInterval(timer);
    });
    
    // Perform final cleanup
    try {
      await this.performCleanup();
    } catch (error) {
      console.error('[RESOURCES] Final cleanup failed:', error.message);
    }
    
    // Clean up all managed resources
    for (const resource of this.managedResources) {
      try {
        if (resource.cleanup && typeof resource.cleanup === 'function') {
          await resource.cleanup();
        }
      } catch (error) {
        console.error(`[RESOURCES] Failed to cleanup resource ${resource.id}:`, error.message);
      }
    }
    
    // Clear all tracking
    this.managedResources.clear();
    this.cleanupTasks.clear();
    this.tempFiles.clear();
    this.resources.processes.active.clear();
    
    this.emit('shutdown-complete');
    console.log('[RESOURCES] Resource manager shutdown complete');
  }
}

module.exports = ResourceManager;