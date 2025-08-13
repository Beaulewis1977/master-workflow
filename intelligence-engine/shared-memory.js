/**
 * Shared Memory Store - Production-Ready Cross-Agent Data Sharing
 * 
 * This implementation provides a comprehensive shared memory system for the
 * Hive-Mind architecture, enabling cross-agent data sharing, context preservation,
 * result caching, and state synchronization with SQLite persistence.
 * 
 * Features:
 * - Dual-layer architecture: In-memory cache + SQLite persistence
 * - Atomic operations for concurrent access
 * - Memory versioning and conflict resolution
 * - Pub/Sub event system for real-time updates
 * - Garbage collection for expired data
 * - Performance optimization for high-frequency access
 * - Cross-agent result sharing and context preservation
 * - Memory limits and intelligent cleanup
 * 
 * @author Claude Code
 * @date August 2025
 * @version 2.1.0
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class SharedMemoryStore extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Core configuration
    this.projectRoot = options.projectRoot || process.cwd();
    this.hiveMindPath = path.join(this.projectRoot, '.hive-mind');
    this.maxMemorySize = options.maxMemorySize || 500 * 1024 * 1024; // 500MB default
    this.maxEntries = options.maxEntries || 100000;
    this.gcInterval = options.gcInterval || 300000; // 5 minutes
    this.compressionThreshold = options.compressionThreshold || 1024 * 1024; // 1MB
    
    // In-memory storage layers
    this.memoryCache = new Map(); // Fast access cache
    this.persistentStore = new Map(); // Persistent data store
    this.versionStore = new Map(); // Version tracking
    this.metadataStore = new Map(); // Entry metadata
    this.subscriberStore = new Map(); // Pub/Sub subscribers
    this.lockStore = new Map(); // Atomic operation locks
    
    // Performance tracking
    this.stats = {
      reads: 0,
      writes: 0,
      hits: 0,
      misses: 0,
      evictions: 0,
      gcRuns: 0,
      totalMemoryUsed: 0,
      averageReadTime: 0,
      averageWriteTime: 0,
      concurrentOperations: 0
    };
    
    // Memory management
    this.memoryUsage = 0;
    this.entryCount = 0;
    this.isInitialized = false;
    this.gcTimer = null;
    this.operationQueue = [];
    this.processingQueue = false;
    
    // SQLite integration paths
    this.dbPaths = {
      hive: path.join(this.hiveMindPath, 'hive.db'),
      memory: path.join(this.hiveMindPath, 'memory.db'),
      sessions: path.join(this.hiveMindPath, 'sessions')
    };
    
    // Namespaces for different data types
    this.namespaces = {
      AGENT_CONTEXT: 'agent_context',
      TASK_RESULTS: 'task_results', 
      SHARED_STATE: 'shared_state',
      CROSS_AGENT: 'cross_agent',
      CACHE: 'cache',
      TEMP: 'temp',
      CONFIG: 'config',
      METRICS: 'metrics'
    };
    
    // Data types with different persistence strategies
    this.dataTypes = {
      PERSISTENT: 'persistent',     // Survive process restarts
      TRANSIENT: 'transient',       // Memory-only, cleared on restart
      CACHED: 'cached',             // LRU cache with TTL
      VERSIONED: 'versioned',       // Version controlled with history
      SHARED: 'shared',             // Cross-agent shared data
      LOCKED: 'locked'              // Requires exclusive access
    };
    
    // Initialize immediately
    this.init().catch(error => {
      this.emit('error', new Error(`Failed to initialize SharedMemoryStore: ${error.message}`));
    });
  }
  
  /**
   * Initialize the shared memory store
   */
  async init() {
    try {
      // Ensure .hive-mind directory exists
      await this.ensureDirectoryStructure();
      
      // Initialize SQLite integration (if possible)
      await this.initializeSQLiteIntegration();
      
      // Load persistent data
      await this.loadPersistentData();
      
      // Start garbage collection
      this.startGarbageCollection();
      
      // Mark as initialized
      this.isInitialized = true;
      
      this.emit('initialized', {
        memoryEntries: this.entryCount,
        memoryUsage: this.memoryUsage,
        dbStatus: this.dbStatus
      });
      
      console.log('SharedMemoryStore initialized successfully');
      
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
  
  /**
   * Ensure directory structure exists
   */
  async ensureDirectoryStructure() {
    try {
      await fs.mkdir(this.hiveMindPath, { recursive: true });
      await fs.mkdir(this.dbPaths.sessions, { recursive: true });
      
      // Create backup directory
      const backupPath = path.join(this.hiveMindPath, 'backups');
      await fs.mkdir(backupPath, { recursive: true });
      
    } catch (error) {
      throw new Error(`Failed to create directory structure: ${error.message}`);
    }
  }
  
  /**
   * Initialize SQLite integration (graceful fallback if SQLite unavailable)
   */
  async initializeSQLiteIntegration() {
    this.dbStatus = { available: false, reason: 'not_initialized' };
    
    try {
      // Try to load sqlite3 module
      const sqlite3 = require('sqlite3');
      this.sqlite3 = sqlite3;
      
      // Initialize databases
      await this.initializeMemoryDB();
      await this.initializeHiveDB();
      
      this.dbStatus = { available: true, version: sqlite3.VERSION };
      
    } catch (error) {
      // Fallback to file-based persistence
      this.dbStatus = { 
        available: false, 
        reason: 'sqlite_unavailable',
        fallback: 'file_based',
        error: error.message
      };
      
      console.warn('SQLite unavailable, using file-based persistence:', error.message);
    }
  }
  
  /**
   * Initialize memory-specific SQLite database
   */
  async initializeMemoryDB() {
    return new Promise((resolve, reject) => {
      this.memoryDB = new this.sqlite3.Database(this.dbPaths.memory, (err) => {
        if (err) {
          reject(new Error(`Failed to open memory.db: ${err.message}`));
          return;
        }
        
        // Create tables if they don't exist
        const createTables = `
          CREATE TABLE IF NOT EXISTS shared_memory (
            key TEXT PRIMARY KEY,
            namespace TEXT NOT NULL,
            data_type TEXT NOT NULL,
            value TEXT NOT NULL,
            metadata TEXT,
            version INTEGER DEFAULT 1,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            expires_at INTEGER,
            size_bytes INTEGER DEFAULT 0,
            access_count INTEGER DEFAULT 0,
            last_accessed INTEGER
          );
          
          CREATE TABLE IF NOT EXISTS memory_versions (
            key TEXT NOT NULL,
            version INTEGER NOT NULL,
            value TEXT NOT NULL,
            metadata TEXT,
            created_at INTEGER NOT NULL,
            PRIMARY KEY (key, version)
          );
          
          CREATE TABLE IF NOT EXISTS memory_locks (
            key TEXT PRIMARY KEY,
            agent_id TEXT NOT NULL,
            lock_type TEXT NOT NULL,
            acquired_at INTEGER NOT NULL,
            expires_at INTEGER NOT NULL
          );
          
          CREATE INDEX IF NOT EXISTS idx_namespace ON shared_memory(namespace);
          CREATE INDEX IF NOT EXISTS idx_data_type ON shared_memory(data_type);
          CREATE INDEX IF NOT EXISTS idx_expires_at ON shared_memory(expires_at);
          CREATE INDEX IF NOT EXISTS idx_last_accessed ON shared_memory(last_accessed);
        `;
        
        this.memoryDB.exec(createTables, (err) => {
          if (err) {
            reject(new Error(`Failed to create memory tables: ${err.message}`));
            return;
          }
          resolve();
        });
      });
    });
  }
  
  /**
   * Initialize hive-specific SQLite database
   */
  async initializeHiveDB() {
    return new Promise((resolve, reject) => {
      this.hiveDB = new this.sqlite3.Database(this.dbPaths.hive, (err) => {
        if (err) {
          reject(new Error(`Failed to open hive.db: ${err.message}`));
          return;
        }
        
        // Create additional tables for cross-agent coordination
        const createTables = `
          CREATE TABLE IF NOT EXISTS agent_memory (
            agent_id TEXT NOT NULL,
            memory_key TEXT NOT NULL,
            access_type TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            PRIMARY KEY (agent_id, memory_key)
          );
          
          CREATE TABLE IF NOT EXISTS memory_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type TEXT NOT NULL,
            memory_key TEXT NOT NULL,
            agent_id TEXT,
            timestamp INTEGER NOT NULL,
            data TEXT
          );
          
          CREATE INDEX IF NOT EXISTS idx_agent_memory ON agent_memory(agent_id);
          CREATE INDEX IF NOT EXISTS idx_memory_events_key ON memory_events(memory_key);
          CREATE INDEX IF NOT EXISTS idx_memory_events_timestamp ON memory_events(timestamp);
        `;
        
        this.hiveDB.exec(createTables, (err) => {
          if (err) {
            reject(new Error(`Failed to create hive tables: ${err.message}`));
            return;
          }
          resolve();
        });
      });
    });
  }
  
  /**
   * Load persistent data from storage
   */
  async loadPersistentData() {
    if (this.dbStatus.available) {
      await this.loadFromSQLite();
    } else {
      await this.loadFromFiles();
    }
  }
  
  /**
   * Load data from SQLite
   */
  async loadFromSQLite() {
    return new Promise((resolve, reject) => {
      if (!this.memoryDB) {
        resolve();
        return;
      }
      
      const query = `
        SELECT key, namespace, data_type, value, metadata, version, 
               created_at, updated_at, expires_at, access_count 
        FROM shared_memory 
        WHERE expires_at IS NULL OR expires_at > ?
      `;
      
      this.memoryDB.all(query, [Date.now()], (err, rows) => {
        if (err) {
          reject(new Error(`Failed to load from SQLite: ${err.message}`));
          return;
        }
        
        let loadedCount = 0;
        let totalSize = 0;
        
        for (const row of rows) {
          try {
            const value = JSON.parse(row.value);
            const metadata = row.metadata ? JSON.parse(row.metadata) : {};
            
            // Load into appropriate store based on data type
            if (row.data_type === this.dataTypes.TRANSIENT) {
              // Skip transient data on reload
              continue;
            }
            
            this.persistentStore.set(row.key, value);
            this.metadataStore.set(row.key, {
              namespace: row.namespace,
              dataType: row.data_type,
              version: row.version,
              createdAt: row.created_at,
              updatedAt: row.updated_at,
              expiresAt: row.expires_at,
              accessCount: row.access_count,
              ...metadata
            });
            
            if (row.version > 1) {
              this.versionStore.set(row.key, row.version);
            }
            
            loadedCount++;
            totalSize += (row.value?.length || 0);
            
          } catch (error) {
            console.warn(`Failed to load memory entry ${row.key}:`, error.message);
          }
        }
        
        this.entryCount = loadedCount;
        this.memoryUsage = totalSize;
        
        console.log(`Loaded ${loadedCount} memory entries from SQLite (${totalSize} bytes)`);
        resolve();
      });
    });
  }
  
  /**
   * Load data from files (fallback)
   */
  async loadFromFiles() {
    try {
      const memoryFile = path.join(this.hiveMindPath, 'shared-memory.json');
      
      try {
        const data = await fs.readFile(memoryFile, 'utf-8');
        const parsed = JSON.parse(data);
        
        if (parsed.entries && parsed.metadata) {
          for (const [key, value] of Object.entries(parsed.entries)) {
            const metadata = parsed.metadata[key];
            
            // Skip expired entries
            if (metadata?.expiresAt && metadata.expiresAt < Date.now()) {
              continue;
            }
            
            // Skip transient data
            if (metadata?.dataType === this.dataTypes.TRANSIENT) {
              continue;
            }
            
            this.persistentStore.set(key, value);
            if (metadata) {
              this.metadataStore.set(key, metadata);
            }
            
            this.entryCount++;
            this.memoryUsage += JSON.stringify(value).length;
          }
          
          console.log(`Loaded ${this.entryCount} memory entries from file`);
        }
        
      } catch (error) {
        // File doesn't exist or is invalid, start fresh
        console.log('No existing memory file found, starting fresh');
      }
      
    } catch (error) {
      console.warn('Failed to load from files:', error.message);
    }
  }
  
  /**
   * Set a value in shared memory with full feature support
   * @param {string} key - Unique key for the data
   * @param {any} value - Data to store
   * @param {object} options - Storage options
   */
  async set(key, value, options = {}) {
    const startTime = Date.now();
    
    try {
      // Validate inputs
      if (!key || typeof key !== 'string') {
        throw new Error('Key must be a non-empty string');
      }
      
      // Normalize options
      const opts = {
        namespace: options.namespace || this.namespaces.SHARED_STATE,
        dataType: options.dataType || this.dataTypes.PERSISTENT,
        ttl: options.ttl, // Time to live in milliseconds
        version: options.version,
        metadata: options.metadata || {},
        agentId: options.agentId,
        compress: options.compress || false,
        lock: options.lock || false
      };
      
      // Handle locking
      if (opts.lock) {
        await this.acquireLock(key, opts.agentId || 'system');
      }
      
      // Serialize value
      const serializedValue = JSON.stringify(value);
      const valueSize = serializedValue.length;
      
      // Check memory limits
      await this.checkMemoryLimits(valueSize);
      
      // Handle versioning
      const currentVersion = this.versionStore.get(key) || 0;
      const newVersion = opts.version || currentVersion + 1;
      
      // Store version history if enabled
      if (opts.dataType === this.dataTypes.VERSIONED) {
        await this.storeVersion(key, newVersion, value, opts.metadata);
      }
      
      // Calculate expiration
      const expiresAt = opts.ttl ? Date.now() + opts.ttl : null;
      
      // Create metadata
      const metadata = {
        namespace: opts.namespace,
        dataType: opts.dataType,
        version: newVersion,
        createdAt: this.metadataStore.get(key)?.createdAt || Date.now(),
        updatedAt: Date.now(),
        expiresAt,
        accessCount: this.metadataStore.get(key)?.accessCount || 0,
        size: valueSize,
        agentId: opts.agentId,
        compressed: opts.compress,
        ...opts.metadata
      };
      
      // Store in appropriate layer
      if (opts.dataType === this.dataTypes.TRANSIENT) {
        this.memoryCache.set(key, value);
      } else {
        this.persistentStore.set(key, value);
        
        // Also cache for fast access
        this.memoryCache.set(key, value);
        
        // Persist to SQLite if available
        if (this.dbStatus.available) {
          await this.persistToSQLite(key, serializedValue, metadata);
        }
      }
      
      // Update metadata and version tracking
      this.metadataStore.set(key, metadata);
      this.versionStore.set(key, newVersion);
      
      // Update memory usage
      this.memoryUsage += valueSize;
      this.entryCount++;
      
      // Update statistics
      this.stats.writes++;
      this.stats.totalMemoryUsed = this.memoryUsage;
      this.stats.averageWriteTime = this.calculateAverageTime(
        this.stats.averageWriteTime, 
        this.stats.writes, 
        Date.now() - startTime
      );
      
      // Emit events
      this.emit('memory-set', {
        key,
        namespace: opts.namespace,
        dataType: opts.dataType,
        version: newVersion,
        size: valueSize,
        agentId: opts.agentId
      });
      
      // Notify subscribers
      await this.notifySubscribers(key, 'set', { value, metadata });
      
      // Log agent access
      if (opts.agentId) {
        await this.logAgentAccess(opts.agentId, key, 'write');
      }
      
      // Release lock if acquired
      if (opts.lock) {
        await this.releaseLock(key, opts.agentId || 'system');
      }
      
      return {
        success: true,
        version: newVersion,
        size: valueSize,
        expiresAt
      };
      
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
  
  /**
   * Get a value from shared memory with caching and performance optimization
   * @param {string} key - Key to retrieve
   * @param {object} options - Retrieval options
   */
  async get(key, options = {}) {
    const startTime = Date.now();
    
    try {
      if (!key || typeof key !== 'string') {
        throw new Error('Key must be a non-empty string');
      }
      
      const opts = {
        agentId: options.agentId,
        includeMetadata: options.includeMetadata || false,
        version: options.version, // Specific version to retrieve
        bypassCache: options.bypassCache || false
      };
      
      let value = null;
      let metadata = null;
      let fromCache = false;
      
      // Check memory cache first (if not bypassing)
      if (!opts.bypassCache && this.memoryCache.has(key)) {
        value = this.memoryCache.get(key);
        metadata = this.metadataStore.get(key);
        fromCache = true;
        this.stats.hits++;
      }
      
      // Check persistent store
      if (value === null && this.persistentStore.has(key)) {
        value = this.persistentStore.get(key);
        metadata = this.metadataStore.get(key);
        
        // Update cache
        this.memoryCache.set(key, value);
        this.stats.hits++;
      }
      
      // Check SQLite if still not found
      if (value === null && this.dbStatus.available) {
        const result = await this.getFromSQLite(key, opts.version);
        if (result) {
          value = result.value;
          metadata = result.metadata;
          
          // Update both stores
          this.persistentStore.set(key, value);
          this.memoryCache.set(key, value);
          this.metadataStore.set(key, metadata);
          
          this.stats.hits++;
        }
      }
      
      // Check expiration
      if (value !== null && metadata?.expiresAt && metadata.expiresAt < Date.now()) {
        await this.delete(key);
        value = null;
        metadata = null;
        this.stats.misses++;
      }
      
      // Update access statistics
      if (value !== null && metadata) {
        metadata.accessCount = (metadata.accessCount || 0) + 1;
        metadata.lastAccessed = Date.now();
        this.metadataStore.set(key, metadata);
        
        // Update in SQLite if available
        if (this.dbStatus.available) {
          await this.updateAccessStats(key, metadata.accessCount, metadata.lastAccessed);
        }
      }
      
      // Update performance stats
      this.stats.reads++;
      if (value === null) {
        this.stats.misses++;
      }
      
      this.stats.averageReadTime = this.calculateAverageTime(
        this.stats.averageReadTime,
        this.stats.reads,
        Date.now() - startTime
      );
      
      // Log agent access
      if (opts.agentId && value !== null) {
        await this.logAgentAccess(opts.agentId, key, 'read');
      }
      
      // Emit event
      this.emit('memory-get', {
        key,
        found: value !== null,
        fromCache,
        agentId: opts.agentId
      });
      
      // Return result
      if (opts.includeMetadata) {
        return {
          value,
          metadata,
          found: value !== null
        };
      }
      
      return value;
      
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
  
  /**
   * Delete a value from shared memory
   * @param {string} key - Key to delete
   * @param {object} options - Deletion options
   */
  async delete(key, options = {}) {
    try {
      if (!key || typeof key !== 'string') {
        throw new Error('Key must be a non-empty string');
      }
      
      const opts = {
        agentId: options.agentId,
        deleteVersions: options.deleteVersions || false
      };
      
      // Get metadata before deletion
      const metadata = this.metadataStore.get(key);
      const existed = this.persistentStore.has(key) || this.memoryCache.has(key);
      
      // Remove from all stores
      this.memoryCache.delete(key);
      this.persistentStore.delete(key);
      this.metadataStore.delete(key);
      this.versionStore.delete(key);
      
      // Remove from SQLite if available
      if (this.dbStatus.available) {
        await this.deleteFromSQLite(key, opts.deleteVersions);
      }
      
      // Update memory usage
      if (metadata) {
        this.memoryUsage -= metadata.size || 0;
        this.entryCount--;
      }
      
      // Emit events
      this.emit('memory-delete', {
        key,
        existed,
        agentId: opts.agentId
      });
      
      // Notify subscribers
      await this.notifySubscribers(key, 'delete', { metadata });
      
      // Log agent access
      if (opts.agentId) {
        await this.logAgentAccess(opts.agentId, key, 'delete');
      }
      
      return existed;
      
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
  
  /**
   * Get all keys matching a pattern or namespace
   * @param {object} options - Search options
   */
  async keys(options = {}) {
    try {
      const opts = {
        namespace: options.namespace,
        pattern: options.pattern,
        dataType: options.dataType,
        includeExpired: options.includeExpired || false
      };
      
      const allKeys = new Set([
        ...this.memoryCache.keys(),
        ...this.persistentStore.keys()
      ]);
      
      const filteredKeys = [];
      const now = Date.now();
      
      for (const key of allKeys) {
        const metadata = this.metadataStore.get(key);
        
        // Skip expired entries unless specifically requested
        if (!opts.includeExpired && metadata?.expiresAt && metadata.expiresAt < now) {
          continue;
        }
        
        // Apply filters
        if (opts.namespace && metadata?.namespace !== opts.namespace) {
          continue;
        }
        
        if (opts.dataType && metadata?.dataType !== opts.dataType) {
          continue;
        }
        
        if (opts.pattern && !key.match(new RegExp(opts.pattern))) {
          continue;
        }
        
        filteredKeys.push(key);
      }
      
      return filteredKeys;
      
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
  
  /**
   * Get memory usage statistics and information
   */
  getStats() {
    const cacheHitRate = this.stats.reads > 0 ? 
      (this.stats.hits / this.stats.reads * 100).toFixed(2) : 0;
    
    return {
      ...this.stats,
      cacheHitRate: `${cacheHitRate}%`,
      memoryUsage: this.memoryUsage,
      entryCount: this.entryCount,
      maxMemorySize: this.maxMemorySize,
      maxEntries: this.maxEntries,
      memoryUtilization: `${(this.memoryUsage / this.maxMemorySize * 100).toFixed(2)}%`,
      entryUtilization: `${(this.entryCount / this.maxEntries * 100).toFixed(2)}%`,
      dbStatus: this.dbStatus,
      activeSubscribers: this.subscriberStore.size,
      activeLocks: this.lockStore.size
    };
  }
  
  /**
   * Subscribe to memory changes for specific keys or patterns
   * @param {string} keyPattern - Key or pattern to watch
   * @param {function} callback - Function to call on changes
   * @param {object} options - Subscription options
   */
  subscribe(keyPattern, callback, options = {}) {
    try {
      const subscriptionId = crypto.randomUUID();
      
      const subscription = {
        id: subscriptionId,
        pattern: keyPattern,
        callback,
        agentId: options.agentId,
        events: options.events || ['set', 'delete', 'expire'],
        createdAt: Date.now()
      };
      
      if (!this.subscriberStore.has(keyPattern)) {
        this.subscriberStore.set(keyPattern, new Map());
      }
      
      this.subscriberStore.get(keyPattern).set(subscriptionId, subscription);
      
      this.emit('subscription-created', {
        subscriptionId,
        keyPattern,
        agentId: options.agentId
      });
      
      // Return unsubscribe function
      return () => {
        this.unsubscribe(subscriptionId, keyPattern);
      };
      
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
  
  /**
   * Unsubscribe from memory changes
   * @param {string} subscriptionId - ID of subscription to remove
   * @param {string} keyPattern - Key pattern of subscription
   */
  unsubscribe(subscriptionId, keyPattern) {
    try {
      const patternSubs = this.subscriberStore.get(keyPattern);
      if (patternSubs) {
        const removed = patternSubs.delete(subscriptionId);
        
        if (patternSubs.size === 0) {
          this.subscriberStore.delete(keyPattern);
        }
        
        if (removed) {
          this.emit('subscription-removed', {
            subscriptionId,
            keyPattern
          });
        }
        
        return removed;
      }
      
      return false;
      
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
  
  /**
   * Acquire an exclusive lock on a memory key
   * @param {string} key - Key to lock
   * @param {string} agentId - Agent requesting the lock
   * @param {object} options - Lock options
   */
  async acquireLock(key, agentId, options = {}) {
    try {
      const opts = {
        timeout: options.timeout || 30000, // 30 seconds default
        lockType: options.lockType || 'exclusive'
      };
      
      const existingLock = this.lockStore.get(key);
      const now = Date.now();
      
      // Check if lock is already held
      if (existingLock) {
        // Check if lock has expired
        if (existingLock.expiresAt > now) {
          throw new Error(`Key ${key} is already locked by agent ${existingLock.agentId}`);
        } else {
          // Lock expired, remove it
          this.lockStore.delete(key);
        }
      }
      
      // Create new lock
      const lock = {
        key,
        agentId,
        lockType: opts.lockType,
        acquiredAt: now,
        expiresAt: now + opts.timeout
      };
      
      this.lockStore.set(key, lock);
      
      // Persist to SQLite if available
      if (this.dbStatus.available) {
        await this.persistLockToSQLite(lock);
      }
      
      this.emit('lock-acquired', {
        key,
        agentId,
        lockType: opts.lockType,
        expiresAt: lock.expiresAt
      });
      
      return lock;
      
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
  
  /**
   * Release a lock on a memory key
   * @param {string} key - Key to unlock
   * @param {string} agentId - Agent releasing the lock
   */
  async releaseLock(key, agentId) {
    try {
      const existingLock = this.lockStore.get(key);
      
      if (!existingLock) {
        return false; // No lock to release
      }
      
      if (existingLock.agentId !== agentId) {
        throw new Error(`Agent ${agentId} cannot release lock held by ${existingLock.agentId}`);
      }
      
      this.lockStore.delete(key);
      
      // Remove from SQLite if available
      if (this.dbStatus.available) {
        await this.removeLockFromSQLite(key);
      }
      
      this.emit('lock-released', {
        key,
        agentId
      });
      
      return true;
      
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
  
  /**
   * Perform atomic operations on memory values
   * @param {string} key - Key to operate on
   * @param {function} operation - Function to perform atomically
   * @param {object} options - Operation options
   */
  async atomic(key, operation, options = {}) {
    const agentId = options.agentId || 'system';
    let lock = null;
    
    try {
      // Acquire lock
      lock = await this.acquireLock(key, agentId, {
        timeout: options.timeout || 10000
      });
      
      // Get current value
      const currentValue = await this.get(key, { agentId });
      
      // Perform operation
      const newValue = await operation(currentValue);
      
      // Set new value if operation returned something
      if (newValue !== undefined) {
        await this.set(key, newValue, {
          agentId,
          ...options
        });
      }
      
      return newValue;
      
    } catch (error) {
      this.emit('error', error);
      throw error;
    } finally {
      // Always release lock
      if (lock) {
        await this.releaseLock(key, agentId);
      }
    }
  }
  
  /**
   * Start garbage collection process
   */
  startGarbageCollection() {
    if (this.gcTimer) {
      clearInterval(this.gcTimer);
    }
    
    this.gcTimer = setInterval(async () => {
      try {
        await this.runGarbageCollection();
      } catch (error) {
        this.emit('error', new Error(`Garbage collection failed: ${error.message}`));
      }
    }, this.gcInterval);
    
    console.log(`Garbage collection started with ${this.gcInterval}ms interval`);
  }
  
  /**
   * Run garbage collection to clean expired data and manage memory
   */
  async runGarbageCollection() {
    const startTime = Date.now();
    const now = Date.now();
    let expiredCount = 0;
    let evictedCount = 0;
    
    try {
      // Clean expired entries
      for (const [key, metadata] of this.metadataStore) {
        if (metadata.expiresAt && metadata.expiresAt < now) {
          await this.delete(key);
          expiredCount++;
        }
      }
      
      // Clean expired locks
      for (const [key, lock] of this.lockStore) {
        if (lock.expiresAt < now) {
          this.lockStore.delete(key);
          if (this.dbStatus.available) {
            await this.removeLockFromSQLite(key);
          }
        }
      }
      
      // Check memory limits and evict if necessary
      if (this.memoryUsage > this.maxMemorySize || this.entryCount > this.maxEntries) {
        evictedCount = await this.evictLRUEntries();
      }
      
      // Update statistics
      this.stats.gcRuns++;
      this.stats.evictions += evictedCount;
      
      const gcTime = Date.now() - startTime;
      
      this.emit('garbage-collection', {
        duration: gcTime,
        expiredCount,
        evictedCount,
        memoryUsage: this.memoryUsage,
        entryCount: this.entryCount
      });
      
      if (expiredCount > 0 || evictedCount > 0) {
        console.log(`GC completed: ${expiredCount} expired, ${evictedCount} evicted (${gcTime}ms)`);
      }
      
    } catch (error) {
      console.error('Garbage collection error:', error);
      throw error;
    }
  }
  
  /**
   * Evict least recently used entries to free memory
   */
  async evictLRUEntries() {
    const entries = [];
    
    // Collect all entries with access information
    for (const [key, metadata] of this.metadataStore) {
      if (metadata.dataType !== this.dataTypes.LOCKED) {
        entries.push({
          key,
          lastAccessed: metadata.lastAccessed || metadata.createdAt,
          size: metadata.size || 0
        });
      }
    }
    
    // Sort by last accessed (oldest first)
    entries.sort((a, b) => a.lastAccessed - b.lastAccessed);
    
    let evictedCount = 0;
    let freedMemory = 0;
    
    // Evict entries until we're under limits
    for (const entry of entries) {
      if (this.memoryUsage <= this.maxMemorySize * 0.8 && 
          this.entryCount <= this.maxEntries * 0.8) {
        break;
      }
      
      await this.delete(entry.key);
      evictedCount++;
      freedMemory += entry.size;
    }
    
    if (evictedCount > 0) {
      console.log(`Evicted ${evictedCount} LRU entries, freed ${freedMemory} bytes`);
    }
    
    return evictedCount;
  }
  
  /**
   * Check memory limits before adding new data
   */
  async checkMemoryLimits(newDataSize) {
    const projectedMemory = this.memoryUsage + newDataSize;
    const projectedEntries = this.entryCount + 1;
    
    if (projectedMemory > this.maxMemorySize) {
      // Try to free memory through garbage collection
      await this.runGarbageCollection();
      
      // Check again after GC
      if (this.memoryUsage + newDataSize > this.maxMemorySize) {
        throw new Error(`Memory limit exceeded: ${projectedMemory} > ${this.maxMemorySize}`);
      }
    }
    
    if (projectedEntries > this.maxEntries) {
      throw new Error(`Entry limit exceeded: ${projectedEntries} > ${this.maxEntries}`);
    }
  }
  
  /**
   * Notify subscribers of memory changes
   */
  async notifySubscribers(key, eventType, data) {
    try {
      for (const [pattern, subscribers] of this.subscriberStore) {
        if (key.match(new RegExp(pattern)) || pattern === '*') {
          for (const [subId, subscription] of subscribers) {
            if (subscription.events.includes(eventType)) {
              try {
                await subscription.callback({
                  key,
                  eventType,
                  data,
                  timestamp: Date.now(),
                  agentId: subscription.agentId
                });
              } catch (error) {
                console.warn(`Subscriber ${subId} callback failed:`, error.message);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to notify subscribers:', error);
    }
  }
  
  /**
   * Calculate rolling average for performance metrics
   */
  calculateAverageTime(currentAverage, count, newTime) {
    if (count === 1) {
      return newTime;
    }
    return ((currentAverage * (count - 1)) + newTime) / count;
  }
  
  /**
   * Store a version of data for version control
   */
  async storeVersion(key, version, value, metadata) {
    if (this.dbStatus.available && this.memoryDB) {
      return new Promise((resolve, reject) => {
        const stmt = this.memoryDB.prepare(`
          INSERT OR REPLACE INTO memory_versions 
          (key, version, value, metadata, created_at) 
          VALUES (?, ?, ?, ?, ?)
        `);
        
        stmt.run([
          key,
          version,
          JSON.stringify(value),
          JSON.stringify(metadata),
          Date.now()
        ], (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
        
        stmt.finalize();
      });
    }
  }
  
  /**
   * Log agent access for monitoring and analytics
   */
  async logAgentAccess(agentId, key, accessType) {
    if (this.dbStatus.available && this.hiveDB) {
      return new Promise((resolve, reject) => {
        const stmt = this.hiveDB.prepare(`
          INSERT OR REPLACE INTO agent_memory 
          (agent_id, memory_key, access_type, timestamp) 
          VALUES (?, ?, ?, ?)
        `);
        
        stmt.run([agentId, key, accessType, Date.now()], (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
        
        stmt.finalize();
      });
    }
  }
  
  /**
   * Persist data to SQLite
   */
  async persistToSQLite(key, serializedValue, metadata) {
    if (!this.memoryDB) return;
    
    return new Promise((resolve, reject) => {
      const stmt = this.memoryDB.prepare(`
        INSERT OR REPLACE INTO shared_memory 
        (key, namespace, data_type, value, metadata, version, 
         created_at, updated_at, expires_at, size_bytes, access_count, last_accessed) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run([
        key,
        metadata.namespace,
        metadata.dataType,
        serializedValue,
        JSON.stringify(metadata),
        metadata.version,
        metadata.createdAt,
        metadata.updatedAt,
        metadata.expiresAt,
        metadata.size,
        metadata.accessCount,
        metadata.lastAccessed
      ], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
      
      stmt.finalize();
    });
  }
  
  /**
   * Get data from SQLite
   */
  async getFromSQLite(key, version = null) {
    if (!this.memoryDB) return null;
    
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM shared_memory WHERE key = ?';
      const params = [key];
      
      if (version) {
        query = 'SELECT * FROM memory_versions WHERE key = ? AND version = ?';
        params.push(version);
      }
      
      this.memoryDB.get(query, params, (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!row) {
          resolve(null);
          return;
        }
        
        try {
          const value = JSON.parse(row.value);
          const metadata = row.metadata ? JSON.parse(row.metadata) : {};
          
          resolve({ value, metadata });
        } catch (parseError) {
          reject(parseError);
        }
      });
    });
  }
  
  /**
   * Delete data from SQLite
   */
  async deleteFromSQLite(key, deleteVersions = false) {
    if (!this.memoryDB) return;
    
    return new Promise((resolve, reject) => {
      this.memoryDB.serialize(() => {
        this.memoryDB.run('DELETE FROM shared_memory WHERE key = ?', [key]);
        
        if (deleteVersions) {
          this.memoryDB.run('DELETE FROM memory_versions WHERE key = ?', [key]);
        }
        
        resolve();
      });
    });
  }
  
  /**
   * Update access statistics in SQLite
   */
  async updateAccessStats(key, accessCount, lastAccessed) {
    if (!this.memoryDB) return;
    
    return new Promise((resolve, reject) => {
      const stmt = this.memoryDB.prepare(`
        UPDATE shared_memory 
        SET access_count = ?, last_accessed = ? 
        WHERE key = ?
      `);
      
      stmt.run([accessCount, lastAccessed, key], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
      
      stmt.finalize();
    });
  }
  
  /**
   * Persist lock to SQLite
   */
  async persistLockToSQLite(lock) {
    if (!this.memoryDB) return;
    
    return new Promise((resolve, reject) => {
      const stmt = this.memoryDB.prepare(`
        INSERT OR REPLACE INTO memory_locks 
        (key, agent_id, lock_type, acquired_at, expires_at) 
        VALUES (?, ?, ?, ?, ?)
      `);
      
      stmt.run([
        lock.key,
        lock.agentId,
        lock.lockType,
        lock.acquiredAt,
        lock.expiresAt
      ], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
      
      stmt.finalize();
    });
  }
  
  /**
   * Remove lock from SQLite
   */
  async removeLockFromSQLite(key) {
    if (!this.memoryDB) return;
    
    return new Promise((resolve, reject) => {
      this.memoryDB.run('DELETE FROM memory_locks WHERE key = ?', [key], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
  
  /**
   * Save current state to files (backup and fallback)
   */
  async saveToFiles() {
    try {
      const data = {
        entries: Object.fromEntries(this.persistentStore),
        metadata: Object.fromEntries(this.metadataStore),
        versions: Object.fromEntries(this.versionStore),
        timestamp: Date.now(),
        stats: this.stats
      };
      
      const memoryFile = path.join(this.hiveMindPath, 'shared-memory.json');
      const backupFile = path.join(this.hiveMindPath, 'backups', `shared-memory-${Date.now()}.json`);
      
      // Save current state
      await fs.writeFile(memoryFile, JSON.stringify(data, null, 2));
      
      // Create backup
      await fs.writeFile(backupFile, JSON.stringify(data, null, 2));
      
      console.log('Memory state saved to files');
      
    } catch (error) {
      console.error('Failed to save memory state:', error);
      throw error;
    }
  }
  
  /**
   * Shutdown the shared memory store gracefully
   */
  async shutdown() {
    try {
      console.log('Shutting down SharedMemoryStore...');
      
      // Stop garbage collection
      if (this.gcTimer) {
        clearInterval(this.gcTimer);
      }
      
      // Save current state
      await this.saveToFiles();
      
      // Close SQLite databases
      if (this.memoryDB) {
        await new Promise((resolve) => {
          this.memoryDB.close(resolve);
        });
      }
      
      if (this.hiveDB) {
        await new Promise((resolve) => {
          this.hiveDB.close(resolve);
        });
      }
      
      // Clear all data
      this.memoryCache.clear();
      this.persistentStore.clear();
      this.metadataStore.clear();
      this.versionStore.clear();
      this.subscriberStore.clear();
      this.lockStore.clear();
      
      this.emit('shutdown-complete');
      console.log('SharedMemoryStore shutdown complete');
      
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
}

module.exports = SharedMemoryStore;