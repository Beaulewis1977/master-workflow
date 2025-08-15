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
const DatabaseConnectionManager = require('./database-connection-manager');
const DatabaseSchemaManager = require('./database-schema-manager');

class SharedMemoryStore extends EventEmitter {
  /**
   * Security: Validate project root path to prevent traversal attacks
   */
  validateProjectRoot(projectRoot) {
    if (!projectRoot || typeof projectRoot !== 'string') {
      throw new Error('Project root must be a valid string path');
    }
    
    try {
      const resolvedRoot = path.resolve(projectRoot);
      const currentDir = process.cwd();
      
      // Ensure the project root is either current directory or a subdirectory
      // This prevents accessing parent directories or system paths
      if (!resolvedRoot.startsWith(path.resolve(currentDir)) && resolvedRoot !== path.resolve(currentDir)) {
        // Allow specific safe directories for testing/development
        const allowedRoots = [
          path.resolve('/tmp'),
          path.resolve('/var/tmp'),
          path.resolve(require('os').tmpdir())
        ];
        
        const isAllowed = allowedRoots.some(allowed => resolvedRoot.startsWith(allowed));
        if (!isAllowed) {
          throw new Error('Project root must be within current working directory or allowed temporary directories');
        }
      }
      
      // Validate path format
      if (resolvedRoot.includes('\0') || resolvedRoot.includes('..')) {
        throw new Error('Invalid characters in project root path');
      }
      
      return resolvedRoot;
    } catch (error) {
      console.error('[SECURITY] Project root validation failed:', error.message);
      throw error;
    }
  }

  /**
   * Security: Safe path joining to prevent traversal
   */
  securePathJoin(...segments) {
    try {
      // Filter out dangerous segments
      const safeSegments = segments.filter(segment => {
        if (!segment || typeof segment !== 'string') return false;
        if (segment.includes('\0')) return false;
        if (segment.includes('..')) return false;
        if (path.isAbsolute(segment) && segment !== segments[0]) return false; // Only first segment can be absolute
        return true;
      });
      
      if (safeSegments.length !== segments.length) {
        throw new Error('Dangerous path segments detected');
      }
      
      const joinedPath = path.join(...safeSegments);
      const resolvedPath = path.resolve(joinedPath);
      
      // Ensure the resolved path is still within the project root
      if (!resolvedPath.startsWith(path.resolve(this.projectRoot || process.cwd()))) {
        throw new Error('Path traversal attempt detected');
      }
      
      return resolvedPath;
    } catch (error) {
      console.error('[SECURITY] Secure path join failed:', error.message, { segments });
      throw error;
    }
  }

  /**
   * Security: Validate file path before any file operation
   */
  validateFilePath(filePath, operation = 'unknown') {
    if (!filePath || typeof filePath !== 'string') {
      throw new Error('File path must be a valid string');
    }
    
    try {
      const resolvedPath = path.resolve(filePath);
      const allowedBasePath = path.resolve(this.hiveMindPath);
      
      // Ensure file is within the hive-mind directory
      if (!resolvedPath.startsWith(allowedBasePath)) {
        console.error(`[SECURITY] Blocked ${operation}: File access outside allowed directory`, {
          requestedPath: filePath,
          resolvedPath: resolvedPath,
          allowedBasePath: allowedBasePath
        });
        throw new Error('File access outside allowed directory');
      }
      
      // Check for dangerous characters
      if (resolvedPath.includes('\0')) {
        throw new Error('Null bytes in file path');
      }
      
      // Validate file extension for specific operations
      const allowedExtensions = ['.json', '.db', '.log', '.tmp', '.sqlite', '.sqlite3'];
      const ext = path.extname(resolvedPath).toLowerCase();
      if (ext && !allowedExtensions.includes(ext)) {
        console.warn(`[SECURITY] Warning: Unusual file extension ${ext} for ${operation}`);
      }
      
      return resolvedPath;
    } catch (error) {
      console.error(`[SECURITY] File path validation failed for ${operation}:`, error.message);
      throw error;
    }
  }

  constructor(options = {}) {
    super();
    
    // Security: Validate and sanitize projectRoot to prevent path traversal
    this.projectRoot = this.validateProjectRoot(options.projectRoot || process.cwd());
    this.hiveMindPath = this.securePathJoin(this.projectRoot, '.hive-mind');
    this.maxMemorySize = options.maxMemorySize || 2 * 1024 * 1024 * 1024; // 2GB default for 4000+ agents
    this.maxEntries = options.maxEntries || 500000; // 500K entries to support 4000+ agents
    this.gcInterval = options.gcInterval || 300000; // 5 minutes
    this.compressionThreshold = options.compressionThreshold || 1024 * 1024; // 1MB
    
    // In-memory storage layers optimized for 4000+ agents
    this.memoryCache = new Map(); // Fast access cache
    this.persistentStore = new Map(); // Persistent data store
    this.versionStore = new Map(); // Version tracking
    this.metadataStore = new Map(); // Entry metadata
    this.subscriberStore = new Map(); // Pub/Sub subscribers
    this.lockStore = new Map(); // Atomic operation locks
    
    // High-performance indexing for large agent counts
    this.agentIndexes = {
      byNamespace: new Map(), // Fast lookup by namespace
      byDataType: new Map(),  // Fast lookup by data type
      byAgent: new Map(),     // Fast lookup by agent ID
      expirationQueue: [],    // Sorted array for efficient expiration
      accessQueue: []         // LRU tracking for efficient eviction
    };
    
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
    
    // SQLite integration paths with security validation
    this.dbPaths = {
      hive: this.securePathJoin(this.hiveMindPath, 'hive.db'),
      memory: this.securePathJoin(this.hiveMindPath, 'memory.db'),
      sessions: this.securePathJoin(this.hiveMindPath, 'sessions')
    };
    
    // Initialize database connection manager
    this.dbManager = new DatabaseConnectionManager({
      maxConnections: options.maxConnections || 10,
      minConnections: options.minConnections || 2,
      connectionTimeout: options.connectionTimeout || 10000,
      queryTimeout: options.queryTimeout || 30000,
      enableWAL: options.enableWAL !== false,
      healthCheckInterval: options.healthCheckInterval || 60000
    });
    
    // Initialize database schema manager
    this.schemaManager = new DatabaseSchemaManager(this.dbManager);
    
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
   * Ensure directory structure exists with security validation
   */
  async ensureDirectoryStructure() {
    try {
      // Validate and create hive-mind directory
      const validatedHivePath = this.validateFilePath(this.hiveMindPath, 'directory_creation');
      await fs.mkdir(validatedHivePath, { recursive: true, mode: 0o750 }); // Secure permissions
      
      // Validate and create sessions directory
      const validatedSessionsPath = this.validateFilePath(this.dbPaths.sessions, 'directory_creation');
      await fs.mkdir(validatedSessionsPath, { recursive: true, mode: 0o750 });
      
      // Create backup directory with security validation
      const backupPath = this.securePathJoin(this.hiveMindPath, 'backups');
      const validatedBackupPath = this.validateFilePath(backupPath, 'directory_creation');
      await fs.mkdir(validatedBackupPath, { recursive: true, mode: 0o750 });
      
      console.log('[SECURITY] Directory structure created with secure permissions');
      
    } catch (error) {
      console.error('[SECURITY] Failed to create directory structure:', error.message);
      throw new Error(`Failed to create directory structure: ${error.message}`);
    }
  }
  
  /**
   * Initialize SQLite integration with advanced connection management - FIXED
   */
  async initializeSQLiteIntegration() {
    this.dbStatus = { available: false, reason: 'not_initialized' };
    
    try {
      // Check if SQLite3 module is available
      if (!this.dbManager.sqlite3) {
        throw new Error('SQLite3 module not available');
      }
      
      // Ensure database files directory exists
      const dbDir = path.dirname(this.dbPaths.memory);
      await fs.mkdir(dbDir, { recursive: true });
      
      // Initialize connection pools for both databases with retry logic
      console.log('[DATABASE FIX] Creating connection pool for memory database...');
      await this.dbManager.createPool(this.dbPaths.memory, 'memory');
      
      console.log('[DATABASE FIX] Creating connection pool for hive database...');
      await this.dbManager.createPool(this.dbPaths.hive, 'hive');
      
      // Set up database schemas with error handling
      console.log('[DATABASE FIX] Initializing schemas...');
      await this.initializeSchemas();
      
      // Set up event listeners for database monitoring
      this.setupDatabaseEventListeners();
      
      // Test connections to ensure they work
      await this.testDatabaseConnections();
      
      this.dbStatus = { 
        available: true, 
        connectionManager: 'active',
        pools: ['memory', 'hive'],
        initialized: Date.now()
      };
      
      console.log('[DATABASE FIX] SQLite integration initialized successfully');
      
    } catch (error) {
      // Enhanced fallback to file-based persistence
      this.dbStatus = { 
        available: false, 
        reason: 'sqlite_unavailable',
        fallback: 'file_based',
        error: error.message,
        timestamp: Date.now()
      };
      
      console.warn('[DATABASE FIX] SQLite unavailable, using file-based persistence:', error.message);
      
      // Try to initialize basic file-based operations
      try {
        await this.ensureDirectoryStructure();
        console.log('[DATABASE FIX] File-based persistence initialized as fallback');
      } catch (fileError) {
        console.error('[DATABASE FIX] Failed to initialize file-based persistence:', fileError.message);
      }
    }
  }
  
  /**
   * Test database connections to ensure they're working - NEW FIX
   */
  async testDatabaseConnections() {
    const testPromises = [];
    
    for (const poolName of ['memory', 'hive']) {
      testPromises.push(this.testSingleConnection(poolName));
    }
    
    await Promise.all(testPromises);
    console.log('[DATABASE FIX] All database connections tested successfully');
  }
  
  /**
   * Test a single database connection
   */
  async testSingleConnection(poolName) {
    let connection = null;
    try {
      connection = await this.dbManager.getConnection(poolName);
      
      // Simple test query
      await new Promise((resolve, reject) => {
        connection.get('SELECT 1 as test', [], (err, row) => {
          if (err) {
            reject(new Error(`Connection test failed for ${poolName}: ${err.message}`));
          } else if (row && row.test === 1) {
            resolve();
          } else {
            reject(new Error(`Unexpected result from connection test for ${poolName}`));
          }
        });
      });
      
      console.log(`[DATABASE FIX] Connection test passed for ${poolName}`);
      
    } catch (error) {
      console.error(`[DATABASE FIX] Connection test failed for ${poolName}:`, error.message);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  /**
   * Initialize database schemas using the schema manager
   */
  async initializeSchemas() {
    if (!this.schemaManager) {
      throw new Error('Schema manager not initialized');
    }
    
    try {
      await this.schemaManager.initializeSchemas();
      console.log('[DATABASE FIX] Schemas initialized successfully');
    } catch (error) {
      console.error('[DATABASE FIX] Schema initialization failed:', error.message);
      throw error;
    }
  }
  
  /**
   * Setup database event listeners for monitoring
   */
  setupDatabaseEventListeners() {
    if (!this.dbManager) {
      return;
    }
    
    // Listen to connection events
    this.dbManager.on('query-success', (event) => {
      this.stats.totalMemoryUsed = this.memoryUsage;
    });
    
    this.dbManager.on('query-error', (event) => {
      console.error('[DATABASE] Query error:', event.error.message);
      this.emit('database-error', event);
    });
    
    this.dbManager.on('health-check', (metrics) => {
      this.emit('database-health', metrics);
    });
    
    this.dbManager.on('connection-released', (event) => {
      // Update connection statistics
    });
    
    console.log('[DATABASE] Event listeners configured');
  }
  
  /**
   * Start connection health monitoring
   */
  startConnectionHealthMonitoring() {
    if (!this.dbManager) {
      return;
    }
    
    // Health monitoring is handled by the DatabaseConnectionManager
    console.log('[DATABASE] Connection health monitoring started');
  }
  
  /**
   * Initialize memory-specific SQLite database with path validation
   */
  async initializeMemoryDB() {
    return new Promise((resolve, reject) => {
      try {
        const validatedMemoryPath = this.validateFilePath(this.dbPaths.memory, 'database_creation');
        this.memoryDB = new this.sqlite3.Database(validatedMemoryPath, (err) => {
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
            console.log('[SECURITY] Memory database initialized with secure path');
            resolve();
          });
        });
      } catch (error) {
        console.error('[SECURITY] Memory database initialization failed:', error.message);
        reject(error);
      }
    });
  }
  
  /**
   * Initialize hive-specific SQLite database with path validation
   */
  async initializeHiveDB() {
    return new Promise((resolve, reject) => {
      try {
        const validatedHivePath = this.validateFilePath(this.dbPaths.hive, 'database_creation');
        this.hiveDB = new this.sqlite3.Database(validatedHivePath, (err) => {
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
            console.log('[SECURITY] Hive database initialized with secure path');
            resolve();
          });
        });
      } catch (error) {
        console.error('[SECURITY] Hive database initialization failed:', error.message);
        reject(error);
      }
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
   * Load data from files (fallback) with secure path validation
   */
  async loadFromFiles() {
    try {
      const memoryFile = this.securePathJoin(this.hiveMindPath, 'shared-memory.json');
      const validatedMemoryFile = this.validateFilePath(memoryFile, 'file_read');
      
      try {
        console.log('[SECURITY] Loading memory data from validated path:', validatedMemoryFile);
        const data = await fs.readFile(validatedMemoryFile, 'utf-8');
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
   * Set multiple values in bulk for efficiency
   * @param {Array} entries - Array of {key, value, options} objects
   */
  async setBulk(entries) {
    if (!Array.isArray(entries)) {
      throw new Error('setBulk requires an array of entries');
    }

    const results = [];
    for (const entry of entries) {
      try {
        await this.set(entry.key, entry.value, entry.options || {});
        results.push({ key: entry.key, success: true });
      } catch (error) {
        results.push({ key: entry.key, success: false, error: error.message });
      }
    }
    
    return results;
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
      
      // Update high-performance indexes for fast lookups
      this.updateIndexes(key, metadata, 'set');
      
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
      
      // Update indexes
      if (metadata) {
        this.updateIndexes(key, metadata, 'delete');
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
   * Get all keys matching a pattern or namespace - OPTIMIZED FOR 4000+ AGENTS
   * @param {object} options - Search options
   */
  async keys(options = {}) {
    try {
      const opts = {
        namespace: options.namespace,
        pattern: options.pattern,
        dataType: options.dataType,
        agentId: options.agentId,
        includeExpired: options.includeExpired || false
      };
      
      let candidateKeys = null;
      
      // Use indexes for fast lookup when possible
      if (opts.agentId) {
        candidateKeys = this.agentIndexes.byAgent.get(opts.agentId);
      } else if (opts.namespace) {
        candidateKeys = this.agentIndexes.byNamespace.get(opts.namespace);
      } else if (opts.dataType) {
        candidateKeys = this.agentIndexes.byDataType.get(opts.dataType);
      }
      
      // Fall back to full scan if no indexes match
      if (!candidateKeys) {
        candidateKeys = new Set([
          ...this.memoryCache.keys(),
          ...this.persistentStore.keys()
        ]);
      }
      
      const filteredKeys = [];
      const now = Date.now();
      
      for (const key of candidateKeys) {
        const metadata = this.metadataStore.get(key);
        
        // Skip expired entries unless specifically requested
        if (!opts.includeExpired && metadata?.expiresAt && metadata.expiresAt < now) {
          continue;
        }
        
        // Apply additional filters
        if (opts.namespace && metadata?.namespace !== opts.namespace) {
          continue;
        }
        
        if (opts.dataType && metadata?.dataType !== opts.dataType) {
          continue;
        }
        
        if (opts.agentId && metadata?.agentId !== opts.agentId) {
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
      totalEntries: this.entryCount, // Alias for test compatibility
      maxMemorySize: this.maxMemorySize,
      maxEntries: this.maxEntries,
      memoryUtilization: `${(this.memoryUsage / this.maxMemorySize * 100).toFixed(2)}%`,
      entryUtilization: `${(this.entryCount / this.maxEntries * 100).toFixed(2)}%`,
      dbStatus: this.dbStatus,
      activeSubscribers: this.subscriberStore.size,
      activeLocks: this.lockStore.size,
      
      // Index statistics for 4000+ agent optimization
      indexes: {
        namespaces: this.agentIndexes.byNamespace.size,
        dataTypes: this.agentIndexes.byDataType.size,
        agents: this.agentIndexes.byAgent.size,
        expirationQueueSize: this.agentIndexes.expirationQueue.length,
        accessQueueSize: this.agentIndexes.accessQueue.length
      }
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
   * Perform atomic operations on memory values - FIXED: Enhanced concurrent access handling
   * @param {string} key - Key to operate on
   * @param {function} operation - Function to perform atomically
   * @param {object} options - Operation options
   */
  async atomic(key, operation, options = {}) {
    const agentId = options.agentId || 'system';
    const maxRetries = options.maxRetries || 3;
    const retryDelay = options.retryDelay || 100;
    let lock = null;
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        // Enhanced lock acquisition with retry logic
        lock = await this.acquireLockWithRetry(key, agentId, {
          timeout: options.timeout || 10000,
          retryCount: attempt
        });
        
        if (!lock) {
          throw new Error(`Failed to acquire lock for key: ${key} after ${attempt + 1} attempts`);
        }
        
        // Get current value with validation
        const currentValue = await this.get(key, { agentId });
        
        // Perform operation with timeout protection
        const operationPromise = Promise.resolve(operation(currentValue));
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Operation timeout')), options.operationTimeout || 5000);
        });
        
        const newValue = await Promise.race([operationPromise, timeoutPromise]);
        
        // Set new value if operation returned something
        if (newValue !== undefined) {
          await this.set(key, newValue, {
            agentId,
            ...options,
            skipLockCheck: true // We already have the lock
          });
        }
        
        // Log successful atomic operation
        console.log(`SHARED MEMORY FIX: Atomic operation completed for key ${key} by agent ${agentId}`);
        
        return newValue;
        
      } catch (error) {
        attempt++;
        
        // Log the error
        console.warn(`SHARED MEMORY FIX: Atomic operation attempt ${attempt}/${maxRetries} failed for key ${key}:`, error.message);
        
        // Release lock on error
        if (lock) {
          try {
            await this.releaseLock(key, agentId);
            lock = null;
          } catch (releaseError) {
            console.error(`SHARED MEMORY FIX: Failed to release lock on error:`, releaseError.message);
          }
        }
        
        // If this was the last attempt, throw the error
        if (attempt >= maxRetries) {
          this.emit('error', error);
          throw new Error(`Atomic operation failed after ${maxRetries} attempts: ${error.message}`);
        }
        
        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt - 1)));
        
      } finally {
        // Always release lock if we still have it
        if (lock) {
          try {
            await this.releaseLock(key, agentId);
          } catch (releaseError) {
            console.error(`SHARED MEMORY FIX: Failed to release lock in finally block:`, releaseError.message);
          }
        }
      }
    }
  }
  
  /**
   * Enhanced lock acquisition with retry mechanism - NEW FIX
   */
  async acquireLockWithRetry(key, agentId, options = {}) {
    const maxLockRetries = options.maxLockRetries || 5;
    const lockRetryDelay = options.lockRetryDelay || 100;
    let lockAttempt = 0;
    
    while (lockAttempt < maxLockRetries) {
      try {
        const lock = await this.acquireLock(key, agentId, {
          timeout: options.timeout || 10000
        });
        
        if (lock) {
          console.log(`SHARED MEMORY FIX: Lock acquired for key ${key} by agent ${agentId} on attempt ${lockAttempt + 1}`);
          return lock;
        }
        
      } catch (error) {
        // Check if it's a "already locked" error
        if (error.message.includes('already locked') || error.message.includes('SQLITE_MISUSE')) {
          lockAttempt++;
          
          console.warn(`SHARED MEMORY FIX: Lock acquisition attempt ${lockAttempt}/${maxLockRetries} failed for key ${key}:`, error.message);
          
          if (lockAttempt < maxLockRetries) {
            // Wait before retry with jitter to reduce thundering herd
            const jitter = Math.random() * 50; // 0-50ms random jitter
            await new Promise(resolve => 
              setTimeout(resolve, lockRetryDelay * Math.pow(2, lockAttempt - 1) + jitter)
            );
            continue;
          }
        }
        
        throw error;
      }
    }
    
    throw new Error(`Failed to acquire lock for key ${key} after ${maxLockRetries} attempts`);
  }

  /**
   * Start garbage collection process - FIXED: Enhanced with memory threshold triggers
   */
  startGarbageCollection() {
    if (this.gcTimer) {
      clearInterval(this.gcTimer);
    }
    
    // Main periodic garbage collection
    this.gcTimer = setInterval(async () => {
      try {
        await this.runGarbageCollection();
      } catch (error) {
        console.error('[GC FIX] Scheduled garbage collection failed:', error.message);
        this.emit('error', new Error(`Garbage collection failed: ${error.message}`));
      }
    }, this.gcInterval);
    
    // Add memory pressure trigger - NEW FIX
    this.memoryPressureTimer = setInterval(async () => {
      try {
        await this.checkMemoryPressure();
      } catch (error) {
        console.error('[GC FIX] Memory pressure check failed:', error.message);
      }
    }, 30000); // Check every 30 seconds
    
    // Add immediate cleanup trigger for expired items - NEW FIX
    this.expiredCleanupTimer = setInterval(async () => {
      try {
        await this.cleanupExpiredEntries();
      } catch (error) {
        console.error('[GC FIX] Expired cleanup failed:', error.message);
      }
    }, 60000); // Check every minute
    
    console.log(`[GC FIX] Enhanced garbage collection started with ${this.gcInterval}ms interval + memory pressure monitoring`);
  }
  
  /**
   * Check for memory pressure and trigger early GC if needed - NEW FIX
   */
  async checkMemoryPressure() {
    const memoryUsageRatio = this.memoryUsage / this.maxMemorySize;
    const entryCountRatio = this.entryCount / this.maxEntries;
    
    // Trigger early GC if memory usage exceeds thresholds
    if (memoryUsageRatio > 0.8 || entryCountRatio > 0.8) {
      console.log(`[GC FIX] Memory pressure detected - Memory: ${(memoryUsageRatio * 100).toFixed(1)}%, Entries: ${(entryCountRatio * 100).toFixed(1)}%`);
      await this.runGarbageCollection();
    }
  }
  
  /**
   * Quick cleanup of expired entries - NEW FIX
   */
  async cleanupExpiredEntries() {
    const now = Date.now();
    let expiredCount = 0;
    
    // Check for expired entries and clean them up immediately
    const expiredKeys = [];
    
    for (const [key, metadata] of this.metadataStore) {
      if (metadata.expiresAt && metadata.expiresAt < now) {
        expiredKeys.push(key);
      }
    }
    
    // Clean up expired entries
    for (const key of expiredKeys) {
      try {
        await this.delete(key);
        expiredCount++;
      } catch (error) {
        console.warn(`[GC FIX] Failed to cleanup expired key ${key}:`, error.message);
      }
    }
    
    if (expiredCount > 0) {
      console.log(`[GC FIX] Quick cleanup removed ${expiredCount} expired entries`);
    }
    
    return expiredCount;
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
   * Update high-performance indexes for fast lookups - OPTIMIZED FOR 4000+ AGENTS
   */
  updateIndexes(key, metadata, operation) {
    try {
      if (operation === 'set') {
        // Update namespace index
        if (!this.agentIndexes.byNamespace.has(metadata.namespace)) {
          this.agentIndexes.byNamespace.set(metadata.namespace, new Set());
        }
        this.agentIndexes.byNamespace.get(metadata.namespace).add(key);
        
        // Update data type index
        if (!this.agentIndexes.byDataType.has(metadata.dataType)) {
          this.agentIndexes.byDataType.set(metadata.dataType, new Set());
        }
        this.agentIndexes.byDataType.get(metadata.dataType).add(key);
        
        // Update agent index
        if (metadata.agentId) {
          if (!this.agentIndexes.byAgent.has(metadata.agentId)) {
            this.agentIndexes.byAgent.set(metadata.agentId, new Set());
          }
          this.agentIndexes.byAgent.get(metadata.agentId).add(key);
        }
        
        // Update expiration queue (sorted insertion for efficiency)
        if (metadata.expiresAt) {
          this.insertIntoExpirationQueue(key, metadata.expiresAt);
        }
        
        // Update access queue for LRU
        this.updateAccessQueue(key);
        
      } else if (operation === 'delete') {
        // Remove from all indexes
        this.removeFromIndexes(key, metadata);
      }
    } catch (error) {
      console.warn('Failed to update indexes for key', key, ':', error.message);
    }
  }
  
  /**
   * Insert key into expiration queue maintaining sorted order
   */
  insertIntoExpirationQueue(key, expiresAt) {
    const item = { key, expiresAt };
    const queue = this.agentIndexes.expirationQueue;
    
    // Binary search for insertion point
    let left = 0;
    let right = queue.length;
    
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (queue[mid].expiresAt <= expiresAt) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }
    
    queue.splice(left, 0, item);
    
    // Maintain reasonable queue size for performance
    if (queue.length > 10000) {
      queue.splice(0, queue.length - 10000);
    }
  }
  
  /**
   * Update access queue for LRU tracking
   */
  updateAccessQueue(key) {
    const queue = this.agentIndexes.accessQueue;
    
    // Remove existing entry if present
    const index = queue.indexOf(key);
    if (index !== -1) {
      queue.splice(index, 1);
    }
    
    // Add to end (most recently used)
    queue.push(key);
    
    // Maintain reasonable queue size
    if (queue.length > 50000) {
      queue.splice(0, queue.length - 50000);
    }
  }
  
  /**
   * Remove key from all indexes
   */
  removeFromIndexes(key, metadata) {
    if (metadata) {
      // Remove from namespace index
      const namespaceSet = this.agentIndexes.byNamespace.get(metadata.namespace);
      if (namespaceSet) {
        namespaceSet.delete(key);
        if (namespaceSet.size === 0) {
          this.agentIndexes.byNamespace.delete(metadata.namespace);
        }
      }
      
      // Remove from data type index
      const dataTypeSet = this.agentIndexes.byDataType.get(metadata.dataType);
      if (dataTypeSet) {
        dataTypeSet.delete(key);
        if (dataTypeSet.size === 0) {
          this.agentIndexes.byDataType.delete(metadata.dataType);
        }
      }
      
      // Remove from agent index
      if (metadata.agentId) {
        const agentSet = this.agentIndexes.byAgent.get(metadata.agentId);
        if (agentSet) {
          agentSet.delete(key);
          if (agentSet.size === 0) {
            this.agentIndexes.byAgent.delete(metadata.agentId);
          }
        }
      }
    }
    
    // Remove from expiration queue
    const expQueue = this.agentIndexes.expirationQueue;
    const expIndex = expQueue.findIndex(item => item.key === key);
    if (expIndex !== -1) {
      expQueue.splice(expIndex, 1);
    }
    
    // Remove from access queue
    const accessQueue = this.agentIndexes.accessQueue;
    const accessIndex = accessQueue.indexOf(key);
    if (accessIndex !== -1) {
      accessQueue.splice(accessIndex, 1);
    }
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
   * Persist data to SQLite using connection manager
   */
  async persistToSQLite(key, serializedValue, metadata) {
    if (!this.dbStatus.available || !this.dbManager) return;
    
    let connection = null;
    
    try {
      connection = await this.dbManager.getConnection('memory');
      
      const sql = `
        INSERT OR REPLACE INTO shared_memory 
        (key, namespace, data_type, value, metadata, version, 
         created_at, updated_at, expires_at, size_bytes, access_count, last_accessed) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
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
      ];
      
      return new Promise((resolve, reject) => {
        connection.run(sql, params, function(err) {
          if (err) {
            reject(new Error(`Failed to persist data for key ${key}: ${err.message}`));
          } else {
            resolve({ lastID: this.lastID, changes: this.changes });
          }
        });
      });
      
    } catch (error) {
      console.error('[DATABASE] Persist error:', error.message);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }
  
  /**
   * Get data from SQLite using connection manager
   */
  async getFromSQLite(key, version = null) {
    if (!this.dbStatus.available || !this.dbManager) return null;
    
    let connection = null;
    
    try {
      connection = await this.dbManager.getConnection('memory');
      
      let query = 'SELECT * FROM shared_memory WHERE key = ?';
      const params = [key];
      
      if (version) {
        query = 'SELECT * FROM memory_versions WHERE key = ? AND version = ?';
        params.push(version);
      }
      
      return new Promise((resolve, reject) => {
        connection.get(query, params, (err, row) => {
          if (err) {
            reject(new Error(`Failed to get data for key ${key}: ${err.message}`));
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
            reject(new Error(`Failed to parse data for key ${key}: ${parseError.message}`));
          }
        });
      });
      
    } catch (error) {
      console.error('[DATABASE] Get error:', error.message);
      return null;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }
  
  /**
   * Delete data from SQLite - FIXED to use connection manager
   */
  async deleteFromSQLite(key, deleteVersions = false) {
    if (!this.dbStatus.available || !this.dbManager) return;
    
    let connection = null;
    
    try {
      connection = await this.dbManager.getConnection('memory');
      
      // Delete from shared_memory table
      await new Promise((resolve, reject) => {
        connection.run('DELETE FROM shared_memory WHERE key = ?', [key], (err) => {
          if (err) {
            reject(new Error(`Failed to delete from shared_memory: ${err.message}`));
          } else {
            resolve();
          }
        });
      });
      
      // Delete versions if requested
      if (deleteVersions) {
        await new Promise((resolve, reject) => {
          connection.run('DELETE FROM memory_versions WHERE key = ?', [key], (err) => {
            if (err) {
              reject(new Error(`Failed to delete versions: ${err.message}`));
            } else {
              resolve();
            }
          });
        });
      }
      
      console.log(`[DATABASE FIX] Successfully deleted key ${key} from SQLite`);
      
    } catch (error) {
      console.error('[DATABASE FIX] Delete error:', error.message);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }
  
  /**
   * Update access statistics in SQLite - FIXED to use connection manager
   */
  async updateAccessStats(key, accessCount, lastAccessed) {
    if (!this.dbStatus.available || !this.dbManager) return;
    
    let connection = null;
    
    try {
      connection = await this.dbManager.getConnection('memory');
      
      await new Promise((resolve, reject) => {
        connection.run(`
          UPDATE shared_memory 
          SET access_count = ?, last_accessed = ? 
          WHERE key = ?
        `, [accessCount, lastAccessed, key], (err) => {
          if (err) {
            reject(new Error(`Failed to update access stats: ${err.message}`));
          } else {
            resolve();
          }
        });
      });
      
    } catch (error) {
      console.error('[DATABASE FIX] Access stats update error:', error.message);
      // Don't throw, this is non-critical
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }
  
  /**
   * Persist lock to SQLite - FIXED to use connection manager
   */
  async persistLockToSQLite(lock) {
    if (!this.dbStatus.available || !this.dbManager) return;
    
    let connection = null;
    
    try {
      connection = await this.dbManager.getConnection('memory');
      
      await new Promise((resolve, reject) => {
        connection.run(`
          INSERT OR REPLACE INTO memory_locks 
          (key, agent_id, lock_type, acquired_at, expires_at) 
          VALUES (?, ?, ?, ?, ?)
        `, [
          lock.key,
          lock.agentId,
          lock.lockType,
          lock.acquiredAt,
          lock.expiresAt
        ], (err) => {
          if (err) {
            reject(new Error(`Failed to persist lock: ${err.message}`));
          } else {
            resolve();
          }
        });
      });
      
    } catch (error) {
      console.error('[DATABASE FIX] Lock persistence error:', error.message);
      // Don't throw, locks are also stored in memory
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }
  
  /**
   * Remove lock from SQLite - FIXED to use connection manager
   */
  async removeLockFromSQLite(key) {
    if (!this.dbStatus.available || !this.dbManager) return;
    
    let connection = null;
    
    try {
      connection = await this.dbManager.getConnection('memory');
      
      await new Promise((resolve, reject) => {
        connection.run('DELETE FROM memory_locks WHERE key = ?', [key], (err) => {
          if (err) {
            reject(new Error(`Failed to remove lock: ${err.message}`));
          } else {
            resolve();
          }
        });
      });
      
    } catch (error) {
      console.error('[DATABASE FIX] Lock removal error:', error.message);
      // Don't throw, locks are also managed in memory
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }
  
  /**
   * Save current state to files (backup and fallback) with secure path validation
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
      
      const memoryFile = this.securePathJoin(this.hiveMindPath, 'shared-memory.json');
      const backupFile = this.securePathJoin(this.hiveMindPath, 'backups', `shared-memory-${Date.now()}.json`);
      
      const validatedMemoryFile = this.validateFilePath(memoryFile, 'file_write');
      const validatedBackupFile = this.validateFilePath(backupFile, 'file_write');
      
      // Save current state with secure path
      await fs.writeFile(validatedMemoryFile, JSON.stringify(data, null, 2));
      
      // Create backup with secure path
      await fs.writeFile(validatedBackupFile, JSON.stringify(data, null, 2));
      
      console.log('[SECURITY] Memory state saved to files with validated paths');
      
    } catch (error) {
      console.error('[SECURITY] Failed to save memory state:', error);
      throw error;
    }
  }
  
  /**
   * Distribute neural pattern to all agents
   * @param {object} pattern - Neural pattern to distribute
   * @param {string} namespace - Target namespace
   */
  async distributeNeuralPattern(pattern, namespace = this.namespaces.CROSS_AGENT) {
    const patternId = `neural_pattern_${pattern.id || Date.now()}`;
    
    // Add distribution metadata
    const distributedPattern = {
      ...pattern,
      distributedAt: Date.now(),
      distributionId: patternId,
      sourceAgent: pattern.sourceAgent || 'queen-controller'
    };
    
    // Store pattern for all agents to access
    await this.set(patternId, distributedPattern, {
      namespace: namespace,
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      dataType: this.dataTypes.SHARED
    });
    
    // Notify subscribers about new pattern
    this.emit('pattern-distributed', {
      patternId,
      pattern: distributedPattern,
      namespace
    });
    
    // Update pattern distribution stats
    this.stats.patternsDistributed = (this.stats.patternsDistributed || 0) + 1;
    
    return patternId;
  }

  /**
   * Aggregate success metrics from multiple agents
   * @param {string} agentId - ID of the reporting agent
   * @param {object} metrics - Success metrics to aggregate
   */
  async aggregateSuccessMetrics(agentId, metrics) {
    const metricsKey = 'global_success_metrics';
    const agentMetricsKey = `agent_metrics_${agentId}`;
    
    // Store agent-specific metrics
    await this.set(agentMetricsKey, {
      agentId,
      metrics,
      timestamp: Date.now()
    }, {
      namespace: this.namespaces.METRICS,
      ttl: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    // Aggregate into global metrics
    let globalMetrics = await this.get(metricsKey, {
      namespace: this.namespaces.METRICS
    }) || {
      totalAgents: 0,
      totalTasks: 0,
      successfulTasks: 0,
      totalDuration: 0,
      averageDuration: 0,
      successRate: 0,
      lastUpdate: 0,
      agentContributions: {}
    };
    
    // Update with new agent metrics
    const previousContribution = globalMetrics.agentContributions[agentId] || {
      tasks: 0,
      successfulTasks: 0,
      duration: 0
    };
    
    globalMetrics.agentContributions[agentId] = {
      tasks: metrics.totalTasks || 0,
      successfulTasks: metrics.successfulTasks || 0,
      duration: metrics.totalDuration || 0,
      lastUpdate: Date.now()
    };
    
    // Recalculate global metrics
    const allContributions = Object.values(globalMetrics.agentContributions);
    globalMetrics.totalAgents = allContributions.length;
    globalMetrics.totalTasks = allContributions.reduce((sum, contrib) => sum + contrib.tasks, 0);
    globalMetrics.successfulTasks = allContributions.reduce((sum, contrib) => sum + contrib.successfulTasks, 0);
    globalMetrics.totalDuration = allContributions.reduce((sum, contrib) => sum + contrib.duration, 0);
    globalMetrics.averageDuration = globalMetrics.totalTasks > 0 ? globalMetrics.totalDuration / globalMetrics.totalTasks : 0;
    globalMetrics.successRate = globalMetrics.totalTasks > 0 ? globalMetrics.successfulTasks / globalMetrics.totalTasks : 0;
    globalMetrics.lastUpdate = Date.now();
    
    // Store updated global metrics
    await this.set(metricsKey, globalMetrics, {
      namespace: this.namespaces.METRICS
    });
    
    // Notify about metrics update
    this.emit('metrics-aggregated', {
      agentId,
      globalMetrics,
      previousContribution,
      newContribution: globalMetrics.agentContributions[agentId]
    });
    
    return globalMetrics;
  }

  /**
   * Synchronize neural weights across agents
   * @param {Array} weights - Neural weights to sync
   * @param {string} agentId - ID of the contributing agent
   */
  async syncNeuralWeights(weights, agentId) {
    const weightsKey = 'neural_weights_sync';
    const contributionKey = `weights_contribution_${agentId}`;
    
    // Store agent's weight contribution
    const contribution = {
      agentId,
      weights,
      timestamp: Date.now(),
      weightCount: weights.length
    };
    
    await this.set(contributionKey, contribution, {
      namespace: this.namespaces.CROSS_AGENT,
      ttl: 60 * 60 * 1000 // 1 hour
    });
    
    // Get all weight contributions
    const allContributions = [];
    const contributionKeys = await this.keys({
      namespace: this.namespaces.CROSS_AGENT
    });
    
    for (const key of contributionKeys) {
      if (key.startsWith('weights_contribution_')) {
        const contrib = await this.get(key, {
          namespace: this.namespaces.CROSS_AGENT
        });
        if (contrib && contrib.timestamp > Date.now() - 60 * 60 * 1000) { // Only recent contributions
          allContributions.push(contrib);
        }
      }
    }
    
    // Average the weights if we have multiple contributions
    let synchronizedWeights = weights;
    if (allContributions.length > 1) {
      synchronizedWeights = this.averageNeuralWeights(allContributions);
    }
    
    // Store synchronized weights
    const syncData = {
      synchronizedWeights,
      contributingAgents: allContributions.map(c => c.agentId),
      synchronizedAt: Date.now(),
      contributionCount: allContributions.length
    };
    
    await this.set(weightsKey, syncData, {
      namespace: this.namespaces.CROSS_AGENT
    });
    
    // Notify about weight synchronization
    this.emit('weights-synchronized', {
      agentId,
      synchronizedWeights,
      contributingAgents: syncData.contributingAgents,
      contributionCount: syncData.contributionCount
    });
    
    return synchronizedWeights;
  }

  /**
   * Get collaborative learning data for an agent
   * @param {string} requestingAgent - ID of the agent requesting the data
   */
  async getCollaborativeLearningData(requestingAgent = 'unknown') {
    try {
      const learningData = {
        patterns: [],
        metrics: null,
        weights: null,
        lastUpdate: Date.now(),
        requestingAgent
      };
      
      // Get recent neural patterns
      const patternKeys = await this.keys({
        namespace: this.namespaces.CROSS_AGENT
      });
      
      for (const key of patternKeys) {
        if (key.startsWith('neural_pattern_')) {
          const pattern = await this.get(key, {
            namespace: this.namespaces.CROSS_AGENT
          });
          if (pattern) {
            learningData.patterns.push(pattern);
          }
        }
      }
      
      // Get global success metrics
      learningData.metrics = await this.get('global_success_metrics', {
        namespace: this.namespaces.METRICS
      });
      
      // Get synchronized weights
      const weightSync = await this.get('neural_weights_sync', {
        namespace: this.namespaces.CROSS_AGENT
      });
      if (weightSync) {
        learningData.weights = weightSync.synchronizedWeights;
      }
      
      // Update access stats
      this.stats.collaborativeDataRequests = (this.stats.collaborativeDataRequests || 0) + 1;
      
      return learningData;
      
    } catch (error) {
      console.error('Failed to get collaborative learning data:', error);
      return {
        patterns: [],
        metrics: null,
        weights: null,
        error: error.message,
        lastUpdate: Date.now(),
        requestingAgent
      };
    }
  }

  /**
   * Average neural weights from multiple agent contributions
   * @param {Array} contributions - Array of weight contributions
   */
  averageNeuralWeights(contributions) {
    if (contributions.length === 0) return [];
    if (contributions.length === 1) return contributions[0].weights;
    
    const weightCount = contributions[0].weights.length;
    const averagedWeights = new Array(weightCount).fill(0);
    
    // Sum all weights
    for (const contribution of contributions) {
      if (contribution.weights.length === weightCount) {
        for (let i = 0; i < weightCount; i++) {
          averagedWeights[i] += contribution.weights[i];
        }
      }
    }
    
    // Average the weights
    const contributionCount = contributions.length;
    for (let i = 0; i < weightCount; i++) {
      averagedWeights[i] /= contributionCount;
    }
    
    return averagedWeights;
  }

  /**
   * Clean up old patterns and sync data
   */
  async cleanupCollaborativeData() {
    const cutoffTime = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago
    
    try {
      // Clean up old patterns
      const patternKeys = await this.keys({
        namespace: this.namespaces.CROSS_AGENT
      });
      
      let cleanedPatterns = 0;
      let cleanedContributions = 0;
      
      for (const key of patternKeys) {
        if (key.startsWith('neural_pattern_')) {
          const pattern = await this.get(key, {
            namespace: this.namespaces.CROSS_AGENT
          });
          if (pattern && pattern.distributedAt < cutoffTime) {
            await this.delete(key, { namespace: this.namespaces.CROSS_AGENT });
            cleanedPatterns++;
          }
        } else if (key.startsWith('weights_contribution_')) {
          const contribution = await this.get(key, {
            namespace: this.namespaces.CROSS_AGENT
          });
          if (contribution && contribution.timestamp < cutoffTime) {
            await this.delete(key, { namespace: this.namespaces.CROSS_AGENT });
            cleanedContributions++;
          }
        }
      }
      
      // Clean up old agent metrics
      const metricsKeys = await this.keys({
        namespace: this.namespaces.METRICS
      });
      
      let cleanedMetrics = 0;
      const metricsRetentionTime = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days
      
      for (const key of metricsKeys) {
        if (key.startsWith('agent_metrics_')) {
          const metrics = await this.get(key, {
            namespace: this.namespaces.METRICS
          });
          if (metrics && metrics.timestamp < metricsRetentionTime) {
            await this.delete(key, { namespace: this.namespaces.METRICS });
            cleanedMetrics++;
          }
        }
      }
      
      console.log(`Collaborative data cleanup: ${cleanedPatterns} patterns, ${cleanedContributions} weight contributions, ${cleanedMetrics} agent metrics`);
      
      return {
        cleanedPatterns,
        cleanedContributions,
        cleanedMetrics
      };
      
    } catch (error) {
      console.error('Failed to cleanup collaborative data:', error);
      return { error: error.message };
    }
  }

  /**
   * Shutdown the shared memory store gracefully - FIXED: Clean up all timers
   */
  async shutdown() {
    try {
      console.log('[GC FIX] Shutting down SharedMemoryStore...');
      
      // Stop all garbage collection timers
      if (this.gcTimer) {
        clearInterval(this.gcTimer);
        console.log('[GC FIX] Main garbage collection timer stopped');
      }
      
      if (this.memoryPressureTimer) {
        clearInterval(this.memoryPressureTimer);
        console.log('[GC FIX] Memory pressure timer stopped');
      }
      
      if (this.expiredCleanupTimer) {
        clearInterval(this.expiredCleanupTimer);
        console.log('[GC FIX] Expired cleanup timer stopped');
      }
      
      // Run final cleanup
      try {
        await this.runGarbageCollection();
        console.log('[GC FIX] Final garbage collection completed');
      } catch (error) {
        console.warn('[GC FIX] Final garbage collection failed:', error.message);
      }
      
      // Save current state
      await this.saveToFiles();
      console.log('[GC FIX] Memory state saved to files');
      
      // Shutdown database connection manager
      if (this.dbManager) {
        await this.dbManager.shutdown();
        console.log('[GC FIX] Database connection manager shut down');
      }
      
      // Clear all data structures
      this.memoryCache.clear();
      this.persistentStore.clear();
      this.metadataStore.clear();
      this.versionStore.clear();
      this.subscriberStore.clear();
      this.lockStore.clear();
      
      this.emit('shutdown-complete');
      console.log('[GC FIX] SharedMemoryStore shutdown complete');
      
    } catch (error) {
      console.error('[GC FIX] Shutdown error:', error.message);
      this.emit('error', error);
      throw error;
    }
  }
}

module.exports = SharedMemoryStore;