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
   * Initialize SQLite integration with advanced connection management
   */
  async initializeSQLiteIntegration() {
    this.dbStatus = { available: false, reason: 'not_initialized' };
    
    try {
      // Initialize connection pools for both databases
      await this.dbManager.createPool(this.dbPaths.memory, 'memory');
      await this.dbManager.createPool(this.dbPaths.hive, 'hive');
      
      // Set up database schemas
      await this.initializeSchemas();
      
      // Set up event listeners for database monitoring
      this.setupDatabaseEventListeners();
      
      this.dbStatus = { 
        available: true, 
        connectionManager: 'active',
        pools: ['memory', 'hive']
      };
      
      console.log('[DATABASE] SQLite integration initialized with connection management');
      
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
   * Initialize database schemas using the schema manager
   */
  async initializeSchemas() {
    if (!this.schemaManager) {
      throw new Error('Schema manager not initialized');
    }
    
    try {
      await this.schemaManager.initializeSchemas();
      console.log('[DATABASE] Schemas initialized successfully');
    } catch (error) {
      console.error('[DATABASE] Schema initialization failed:', error.message);
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
      totalEntries: this.entryCount, // Alias for test compatibility
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
      
      // Shutdown database connection manager
      if (this.dbManager) {
        await this.dbManager.shutdown();
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