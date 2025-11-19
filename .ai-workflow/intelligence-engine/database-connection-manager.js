/**
 * Database Connection Manager - Professional SQLite Connection Management
 * 
 * This module provides comprehensive database connection management with:
 * - Connection pooling and lifecycle management
 * - Transaction management with proper rollback
 * - Query optimization and caching
 * - Performance monitoring and metrics
 * - Connection health monitoring
 * - Retry logic and error handling
 * - Security hardening
 * 
 * @author Claude Database Architect Agent
 * @version 3.0.0
 * @date August 2025
 */

const EventEmitter = require('events');
const path = require('path');
const crypto = require('crypto');

class DatabaseConnectionManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      maxConnections: options.maxConnections || 10,
      minConnections: options.minConnections || 2,
      idleTimeout: options.idleTimeout || 30000,  // 30 seconds
      connectionTimeout: options.connectionTimeout || 10000, // 10 seconds
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000,
      healthCheckInterval: options.healthCheckInterval || 60000, // 1 minute
      queryTimeout: options.queryTimeout || 30000, // 30 seconds
      enableWAL: options.enableWAL !== false, // Default true
      cacheSize: options.cacheSize || 10000, // 10MB
      busyTimeout: options.busyTimeout || 5000,
      // Connection recycling settings - FIXED
      maxConnectionAge: options.maxConnectionAge || 3600000, // 1 hour
      maxConnectionUse: options.maxConnectionUse || 1000, // Recycle after 1000 uses
      connectionRecycleInterval: options.connectionRecycleInterval || 300000, // 5 minutes
      ...options
    };
    
    // Connection pools by database
    this.pools = new Map();
    
    // Active connections tracking
    this.activeConnections = new Map();
    
    // Connection health monitoring
    this.healthMonitor = null;
    
    // Query performance cache
    this.queryCache = new Map();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      evictions: 0
    };
    
    // Performance metrics
    this.metrics = {
      totalQueries: 0,
      totalErrors: 0,
      totalConnections: 0,
      averageQueryTime: 0,
      connectionFailures: 0,
      retryAttempts: 0,
      cacheHitRate: 0
    };
    
    // Transaction management
    this.activeTransactions = new Map();
    this.transactionTimeouts = new Map();
    
    // Connection recycling timer - FIXED
    this.recycleTimer = null;
    
    // Initialize SQLite module
    this.initializeSQLite();
    
    // Start connection recycling
    this.startConnectionRecycling();
  }
  
  /**
   * Initialize SQLite module with error handling
   */
  initializeSQLite() {
    try {
      this.sqlite3 = require('sqlite3').verbose();
      console.log('[DATABASE] SQLite3 module loaded successfully');
    } catch (error) {
      console.error('[DATABASE] Failed to load sqlite3 module:', error.message);
      this.sqlite3 = null;
    }
  }
  
  /**
   * Create a new database connection pool
   */
  async createPool(databasePath, poolName = 'default') {
    if (!this.sqlite3) {
      throw new Error('SQLite3 module not available');
    }
    
    const pool = {
      name: poolName,
      path: databasePath,
      connections: [],
      waiting: [],
      activeCount: 0,
      totalCreated: 0,
      lastActivity: Date.now(),
      stats: {
        queries: 0,
        errors: 0,
        avgResponseTime: 0
      }
    };
    
    // Create initial connections
    for (let i = 0; i < this.options.minConnections; i++) {
      try {
        const connection = await this.createConnection(databasePath, poolName);
        pool.connections.push(connection);
        pool.totalCreated++;
      } catch (error) {
        console.error(`[DATABASE] Failed to create initial connection ${i + 1}:`, error.message);
      }
    }
    
    this.pools.set(poolName, pool);
    
    // Start health monitoring for this pool
    if (!this.healthMonitor) {
      this.startHealthMonitoring();
    }
    
    console.log(`[DATABASE] Created connection pool '${poolName}' with ${pool.connections.length} connections`);
    return pool;
  }
  
  /**
   * Create a single database connection with optimization
   */
  async createConnection(databasePath, poolName) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const connection = new this.sqlite3.Database(databasePath, this.sqlite3.OPEN_READWRITE | this.sqlite3.OPEN_CREATE, (err) => {
        if (err) {
          this.metrics.connectionFailures++;
          reject(new Error(`Failed to create database connection: ${err.message}`));
          return;
        }
        
        // Configure connection for optimal performance and safety
        connection.serialize(() => {
          const optimizationQueries = [
            // Enable WAL mode for better concurrency
            this.options.enableWAL ? 'PRAGMA journal_mode=WAL' : 'PRAGMA journal_mode=DELETE',
            // Set busy timeout
            `PRAGMA busy_timeout=${this.options.busyTimeout}`,
            // Enable foreign keys
            'PRAGMA foreign_keys=ON',
            // Optimize cache size
            `PRAGMA cache_size=${this.options.cacheSize}`,
            // Use memory for temporary storage
            'PRAGMA temp_store=MEMORY',
            // Balance between safety and performance
            'PRAGMA synchronous=NORMAL',
            // Optimize page size for better I/O
            'PRAGMA page_size=4096'
          ];
          
          let completed = 0;
          const handlePragmaComplete = (err) => {
            if (err) {
              console.warn(`[DATABASE] Pragma warning for ${poolName}:`, err.message);
            }
            completed++;
            if (completed === optimizationQueries.length) {
              // Add connection metadata
              connection.poolName = poolName;
              connection.createdAt = Date.now();
              connection.lastUsed = Date.now();
              connection.queryCount = 0;
              connection.inUse = false;
              connection.connectionId = crypto.randomUUID();
              
              this.metrics.totalConnections++;
              resolve(connection);
            }
          };
          
          // Execute all optimization queries
          optimizationQueries.forEach(query => {
            connection.run(query, handlePragmaComplete);
          });
        });
      });
      
      // Set connection timeout
      const timeout = setTimeout(() => {
        reject(new Error(`Connection timeout after ${this.options.connectionTimeout}ms`));
      }, this.options.connectionTimeout);
      
      connection.on('open', () => {
        clearTimeout(timeout);
      });
      
      connection.on('error', (err) => {
        clearTimeout(timeout);
        this.metrics.connectionFailures++;
        reject(err);
      });
    });
  }
  
  /**
   * Get a connection from the pool with retry logic
   */
  async getConnection(poolName = 'default', retryCount = 0) {
    const pool = this.pools.get(poolName);
    if (!pool) {
      throw new Error(`Connection pool '${poolName}' not found`);
    }
    
    // Find available connection
    const availableConnection = pool.connections.find(conn => !conn.inUse);
    
    if (availableConnection) {
      availableConnection.inUse = true;
      availableConnection.lastUsed = Date.now();
      pool.activeCount++;
      pool.lastActivity = Date.now();
      
      return this.wrapConnection(availableConnection, poolName);
    }
    
    // No available connections - try to create new one if under limit
    if (pool.connections.length < this.options.maxConnections) {
      try {
        const newConnection = await this.createConnection(pool.path, poolName);
        newConnection.inUse = true;
        pool.connections.push(newConnection);
        pool.totalCreated++;
        pool.activeCount++;
        pool.lastActivity = Date.now();
        
        return this.wrapConnection(newConnection, poolName);
      } catch (error) {
        console.error(`[DATABASE] Failed to create new connection for pool '${poolName}':`, error.message);
      }
    }
    
    // Wait for available connection
    return new Promise((resolve, reject) => {
      const waitStartTime = Date.now();
      
      const waitTimeout = setTimeout(() => {
        const waitIndex = pool.waiting.findIndex(w => w.resolve === resolve);
        if (waitIndex >= 0) {
          pool.waiting.splice(waitIndex, 1);
        }
        
        // Retry if configured
        if (retryCount < this.options.maxRetries) {
          this.metrics.retryAttempts++;
          setTimeout(() => {
            this.getConnection(poolName, retryCount + 1)
              .then(resolve)
              .catch(reject);
          }, this.options.retryDelay * Math.pow(2, retryCount)); // Exponential backoff
        } else {
          reject(new Error(`Connection pool '${poolName}' exhausted after ${this.options.maxRetries} retries`));
        }
      }, this.options.connectionTimeout);
      
      pool.waiting.push({
        resolve: (connection) => {
          clearTimeout(waitTimeout);
          resolve(connection);
        },
        reject: (error) => {
          clearTimeout(waitTimeout);
          reject(error);
        },
        timestamp: waitStartTime
      });
    });
  }
  
  /**
   * Wrap connection with monitoring and automatic release
   */
  wrapConnection(connection, poolName) {
    const pool = this.pools.get(poolName);
    
    return new Proxy(connection, {
      get: (target, prop) => {
        if (prop === 'release') {
          return () => this.releaseConnection(connection, poolName);
        }
        
        if (prop === 'run' || prop === 'all' || prop === 'get' || prop === 'each') {
          return (...args) => {
            return this.executeQuery(target, prop, args, poolName);
          };
        }
        
        return target[prop];
      }
    });
  }
  
  /**
   * Execute query with monitoring and caching
   */
  async executeQuery(connection, method, args, poolName) {
    const startTime = Date.now();
    const pool = this.pools.get(poolName);
    
    // Extract query and parameters
    const query = args[0];
    const params = args[1] || [];
    const callback = args[args.length - 1];
    
    // Generate cache key for SELECT queries
    const cacheKey = method === 'get' || method === 'all' ? 
      crypto.createHash('md5').update(query + JSON.stringify(params)).digest('hex') : null;
    
    // Check cache for SELECT queries
    if (cacheKey && this.queryCache.has(cacheKey)) {
      const cached = this.queryCache.get(cacheKey);
      if (cached.expires > Date.now()) {
        this.cacheStats.hits++;
        if (typeof callback === 'function') {
          process.nextTick(() => callback(null, cached.result));
          return;
        }
        return cached.result;
      } else {
        this.queryCache.delete(cacheKey);
      }
    }
    
    // Track query start
    this.metrics.totalQueries++;
    connection.queryCount++;
    
    return new Promise((resolve, reject) => {
      const queryTimeout = setTimeout(() => {
        this.metrics.totalErrors++;
        reject(new Error(`Query timeout after ${this.options.queryTimeout}ms`));
      }, this.options.queryTimeout);
      
      const wrappedCallback = (err, result) => {
        clearTimeout(queryTimeout);
        const duration = Date.now() - startTime;
        
        // Update metrics
        this.updateQueryMetrics(duration, pool, !err);
        
        if (err) {
          this.metrics.totalErrors++;
          pool.stats.errors++;
          this.emit('query-error', {
            error: err,
            query,
            params,
            duration,
            poolName,
            connectionId: connection.connectionId
          });
          
          if (typeof callback === 'function') {
            callback(err);
          } else {
            reject(err);
          }
        } else {
          // Cache successful SELECT queries
          if (cacheKey && result) {
            this.queryCache.set(cacheKey, {
              result,
              expires: Date.now() + 300000 // 5 minutes cache
            });
            
            // Limit cache size
            if (this.queryCache.size > 1000) {
              const oldestKey = this.queryCache.keys().next().value;
              this.queryCache.delete(oldestKey);
              this.cacheStats.evictions++;
            }
          }
          
          pool.stats.queries++;
          this.emit('query-success', {
            query,
            duration,
            poolName,
            connectionId: connection.connectionId
          });
          
          if (typeof callback === 'function') {
            callback(null, result);
          } else {
            resolve(result);
          }
        }
      };
      
      // Replace callback with wrapped version
      const newArgs = [...args];
      if (typeof callback === 'function') {
        newArgs[newArgs.length - 1] = wrappedCallback;
      } else {
        newArgs.push(wrappedCallback);
      }
      
      // Execute the actual query
      connection[method].apply(connection, newArgs);
    });
  }
  
  /**
   * Release connection back to pool
   */
  releaseConnection(connection, poolName) {
    const pool = this.pools.get(poolName);
    if (!pool) return;
    
    connection.inUse = false;
    connection.lastUsed = Date.now();
    pool.activeCount--;
    
    // Check for waiting requests
    if (pool.waiting.length > 0) {
      const waiter = pool.waiting.shift();
      connection.inUse = true;
      pool.activeCount++;
      waiter.resolve(this.wrapConnection(connection, poolName));
    }
    
    this.emit('connection-released', {
      poolName,
      connectionId: connection.connectionId,
      activeConnections: pool.activeCount
    });
  }
  
  /**
   * Begin a transaction with timeout management
   */
  async beginTransaction(poolName = 'default', options = {}) {
    const connection = await this.getConnection(poolName);
    const transactionId = crypto.randomUUID();
    const timeout = options.timeout || 30000; // 30 second default
    
    return new Promise((resolve, reject) => {
      connection.run('BEGIN TRANSACTION', (err) => {
        if (err) {
          this.releaseConnection(connection, poolName);
          reject(new Error(`Failed to begin transaction: ${err.message}`));
          return;
        }
        
        // Track transaction
        this.activeTransactions.set(transactionId, {
          connection,
          poolName,
          startTime: Date.now(),
          operations: 0
        });
        
        // Set transaction timeout
        const timeoutHandle = setTimeout(() => {
          this.rollbackTransaction(transactionId, 'Transaction timeout');
        }, timeout);
        
        this.transactionTimeouts.set(transactionId, timeoutHandle);
        
        resolve({
          id: transactionId,
          connection: this.wrapTransactionConnection(connection, transactionId),
          commit: () => this.commitTransaction(transactionId),
          rollback: (reason) => this.rollbackTransaction(transactionId, reason)
        });
      });
    });
  }
  
  /**
   * Wrap transaction connection to track operations
   */
  wrapTransactionConnection(connection, transactionId) {
    const transaction = this.activeTransactions.get(transactionId);
    
    return new Proxy(connection, {
      get: (target, prop) => {
        if (['run', 'all', 'get', 'each'].includes(prop)) {
          return (...args) => {
            transaction.operations++;
            return target[prop].apply(target, args);
          };
        }
        
        return target[prop];
      }
    });
  }
  
  /**
   * Commit transaction
   */
  async commitTransaction(transactionId) {
    const transaction = this.activeTransactions.get(transactionId);
    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }
    
    return new Promise((resolve, reject) => {
      transaction.connection.run('COMMIT', (err) => {
        // Clear timeout
        const timeoutHandle = this.transactionTimeouts.get(transactionId);
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
          this.transactionTimeouts.delete(transactionId);
        }
        
        // Release connection
        this.releaseConnection(transaction.connection, transaction.poolName);
        this.activeTransactions.delete(transactionId);
        
        if (err) {
          reject(new Error(`Failed to commit transaction: ${err.message}`));
        } else {
          this.emit('transaction-committed', {
            transactionId,
            duration: Date.now() - transaction.startTime,
            operations: transaction.operations
          });
          resolve();
        }
      });
    });
  }
  
  /**
   * Rollback transaction
   */
  async rollbackTransaction(transactionId, reason = 'Manual rollback') {
    const transaction = this.activeTransactions.get(transactionId);
    if (!transaction) {
      console.warn(`[DATABASE] Transaction ${transactionId} not found for rollback`);
      return;
    }
    
    return new Promise((resolve) => {
      transaction.connection.run('ROLLBACK', (err) => {
        if (err) {
          console.error(`[DATABASE] Failed to rollback transaction ${transactionId}:`, err.message);
        }
        
        // Clear timeout
        const timeoutHandle = this.transactionTimeouts.get(transactionId);
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
          this.transactionTimeouts.delete(transactionId);
        }
        
        // Release connection
        this.releaseConnection(transaction.connection, transaction.poolName);
        this.activeTransactions.delete(transactionId);
        
        this.emit('transaction-rolled-back', {
          transactionId,
          reason,
          duration: Date.now() - transaction.startTime,
          operations: transaction.operations
        });
        
        resolve();
      });
    });
  }
  
  /**
   * Update query performance metrics
   */
  updateQueryMetrics(duration, pool, success) {
    // Update global metrics
    this.metrics.averageQueryTime = (
      (this.metrics.averageQueryTime * (this.metrics.totalQueries - 1)) + duration
    ) / this.metrics.totalQueries;
    
    // Update pool metrics
    pool.stats.avgResponseTime = (
      (pool.stats.avgResponseTime * (pool.stats.queries - 1)) + duration
    ) / pool.stats.queries;
    
    // Update cache hit rate
    const totalCacheRequests = this.cacheStats.hits + this.cacheStats.misses;
    this.metrics.cacheHitRate = totalCacheRequests > 0 ? 
      (this.cacheStats.hits / totalCacheRequests) * 100 : 0;
  }
  
  /**
   * Start health monitoring for all pools
   */
  startHealthMonitoring() {
    this.healthMonitor = setInterval(() => {
      this.performHealthCheck();
    }, this.options.healthCheckInterval);
    
    console.log('[DATABASE] Started connection health monitoring');
  }
  
  /**
   * Perform health check on all pools
   */
  async performHealthCheck() {
    for (const [poolName, pool] of this.pools) {
      try {
        await this.checkPoolHealth(poolName, pool);
      } catch (error) {
        console.error(`[DATABASE] Health check failed for pool '${poolName}':`, error.message);
      }
    }
    
    // Clean up old cache entries
    this.cleanupQueryCache();
    
    // Emit health metrics
    this.emit('health-check', {
      pools: Object.fromEntries(
        Array.from(this.pools.entries()).map(([name, pool]) => [
          name,
          {
            totalConnections: pool.connections.length,
            activeConnections: pool.activeCount,
            waitingRequests: pool.waiting.length,
            totalQueries: pool.stats.queries,
            averageResponseTime: pool.stats.avgResponseTime
          }
        ])
      ),
      metrics: this.metrics,
      cacheStats: this.cacheStats
    });
  }
  
  /**
   * Check health of a specific pool
   */
  async checkPoolHealth(poolName, pool) {
    const now = Date.now();
    
    // Remove idle connections beyond timeout
    const idleConnections = pool.connections.filter(
      conn => !conn.inUse && (now - conn.lastUsed) > this.options.idleTimeout
    );
    
    for (const idleConn of idleConnections) {
      if (pool.connections.length > this.options.minConnections) {
        // Remove idle connection
        const index = pool.connections.indexOf(idleConn);
        if (index >= 0) {
          pool.connections.splice(index, 1);
          idleConn.close();
          console.log(`[DATABASE] Removed idle connection from pool '${poolName}'`);
        }
      }
    }
    
    // Ensure minimum connections
    while (pool.connections.length < this.options.minConnections) {
      try {
        const newConnection = await this.createConnection(pool.path, poolName);
        pool.connections.push(newConnection);
        console.log(`[DATABASE] Added connection to maintain minimum for pool '${poolName}'`);
      } catch (error) {
        console.error(`[DATABASE] Failed to create minimum connection for pool '${poolName}':`, error.message);
        break;
      }
    }
    
    // Test a sample of connections
    const testConnections = pool.connections.filter(conn => !conn.inUse).slice(0, 2);
    for (const conn of testConnections) {
      try {
        await new Promise((resolve, reject) => {
          conn.get('SELECT 1 as test', (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });
      } catch (error) {
        console.error(`[DATABASE] Connection health check failed for pool '${poolName}':`, error.message);
        // Remove unhealthy connection
        const index = pool.connections.indexOf(conn);
        if (index >= 0) {
          pool.connections.splice(index, 1);
          conn.close();
        }
      }
    }
  }
  
  /**
   * Clean up expired cache entries
   */
  cleanupQueryCache() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, cached] of this.queryCache) {
      if (cached.expires <= now) {
        this.queryCache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      this.cacheStats.evictions += cleaned;
      console.log(`[DATABASE] Cleaned up ${cleaned} expired cache entries`);
    }
  }
  
  /**
   * Get comprehensive statistics
   */
  getStats() {
    const poolStats = {};
    for (const [name, pool] of this.pools) {
      poolStats[name] = {
        totalConnections: pool.connections.length,
        activeConnections: pool.activeCount,
        waitingRequests: pool.waiting.length,
        totalCreated: pool.totalCreated,
        totalQueries: pool.stats.queries,
        totalErrors: pool.stats.errors,
        averageResponseTime: pool.stats.avgResponseTime,
        lastActivity: pool.lastActivity
      };
    }
    
    return {
      pools: poolStats,
      globalMetrics: this.metrics,
      cacheStats: {
        ...this.cacheStats,
        size: this.queryCache.size,
        hitRate: this.metrics.cacheHitRate.toFixed(2) + '%'
      },
      activeTransactions: this.activeTransactions.size,
      isHealthy: this.isHealthy()
    };
  }
  
  /**
   * Check if connection manager is healthy
   */
  isHealthy() {
    const failureRate = this.metrics.totalQueries > 0 ? 
      (this.metrics.totalErrors / this.metrics.totalQueries) * 100 : 0;
    
    return failureRate < 5; // Less than 5% error rate
  }
  
  /**
   * Start connection recycling to prevent connection exhaustion - FIXED
   */
  startConnectionRecycling() {
    this.recycleTimer = setInterval(() => {
      this.recycleConnections();
    }, this.options.connectionRecycleInterval);
    
    console.log('[DATABASE] Connection recycling started');
  }
  
  /**
   * Recycle aged and overused connections - FIXED
   */
  async recycleConnections() {
    const now = Date.now();
    let recycledCount = 0;
    
    for (const [poolName, pool] of this.pools) {
      const connectionsToRecycle = [];
      
      for (let i = 0; i < pool.connections.length; i++) {
        const connection = pool.connections[i];
        
        // Check if connection should be recycled
        const shouldRecycle = 
          (now - connection.createdAt > this.options.maxConnectionAge) ||
          (connection.queryCount > this.options.maxConnectionUse);
        
        if (shouldRecycle && !connection.inUse) {
          connectionsToRecycle.push({ connection, index: i });
        }
      }
      
      // Recycle connections but maintain minimum pool size
      const minToKeep = Math.max(this.options.minConnections, pool.activeCount);
      const canRecycle = Math.max(0, pool.connections.length - minToKeep);
      const toRecycle = Math.min(connectionsToRecycle.length, canRecycle);
      
      for (let j = 0; j < toRecycle; j++) {
        const { connection, index } = connectionsToRecycle[j];
        
        try {
          // Close old connection
          await new Promise(resolve => {
            connection.close((err) => {
              if (err) {
                console.warn(`[DATABASE] Error closing recycled connection: ${err.message}`);
              }
              resolve();
            });
          });
          
          // Remove from pool
          pool.connections.splice(index - j, 1); // Adjust index for removed items
          
          // Create new connection
          const newConnection = await this.createConnection(pool.path, poolName);
          pool.connections.push(newConnection);
          pool.totalCreated++;
          recycledCount++;
          
        } catch (error) {
          console.error(`[DATABASE] Error recycling connection in pool '${poolName}':`, error.message);
        }
      }
    }
    
    if (recycledCount > 0) {
      console.log(`[DATABASE] Recycled ${recycledCount} connections`);
      this.emit('connections-recycled', { count: recycledCount });
    }
  }
  
  /**
   * Enhanced connection creation with recycling metadata - FIXED
   */
  async createConnectionWithMetadata(databasePath, poolName) {
    const connection = await this.createConnection(databasePath, poolName);
    
    // Add recycling metadata
    connection.createdAt = Date.now();
    connection.queryCount = 0;
    connection.inUse = false;
    connection.lastUsed = Date.now();
    
    return connection;
  }
  
  /**
   * Gracefully shutdown all connections - FIXED: Added recycling timer cleanup
   */
  async shutdown() {
    console.log('[DATABASE] Starting graceful shutdown...');
    
    // Stop health monitoring and recycling
    if (this.healthMonitor) {
      clearInterval(this.healthMonitor);
    }
    
    if (this.recycleTimer) {
      clearInterval(this.recycleTimer);
    }
    
    // Rollback all active transactions
    const transactionPromises = Array.from(this.activeTransactions.keys()).map(
      transactionId => this.rollbackTransaction(transactionId, 'System shutdown')
    );
    
    await Promise.all(transactionPromises);
    
    // Close all connections with timeout handling
    const closePromises = [];
    for (const [poolName, pool] of this.pools) {
      for (const connection of pool.connections) {
        closePromises.push(
          new Promise(resolve => {
            const timeout = setTimeout(() => {
              console.warn(`[DATABASE] Connection close timeout for pool '${poolName}'`);
              resolve();
            }, 5000);
            
            connection.close((err) => {
              clearTimeout(timeout);
              if (err) {
                console.error(`[DATABASE] Error closing connection in pool '${poolName}':`, err.message);
              }
              resolve();
            });
          })
        );
      }
    }
    
    await Promise.allSettled(closePromises);
    
    // Clear all data structures
    this.pools.clear();
    this.activeConnections.clear();
    this.queryCache.clear();
    this.activeTransactions.clear();
    this.transactionTimeouts.clear();
    
    console.log('[DATABASE] Shutdown complete');
    this.emit('shutdown-complete');
  }
}

module.exports = DatabaseConnectionManager;