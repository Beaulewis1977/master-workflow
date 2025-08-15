/**
 * Database Schema Manager - Advanced Schema Management and Migration
 * 
 * This module provides comprehensive database schema management with:
 * - Schema creation and validation
 * - Migration management with rollback support
 * - Index optimization
 * - Constraint management
 * - Performance monitoring
 * 
 * @author Claude Database Architect Agent
 * @version 3.0.0
 * @date August 2025
 */

class DatabaseSchemaManager {
  constructor(connectionManager) {
    this.connectionManager = connectionManager;
    this.schemaVersion = 1;
    this.migrations = new Map();
    
    // Define schema definitions
    this.schemas = {
      memory: this.getMemorySchema(),
      hive: this.getHiveSchema()
    };
    
    // Initialize migration definitions
    this.initializeMigrations();
  }
  
  /**
   * Get memory database schema definition
   */
  getMemorySchema() {
    return {
      tables: {
        shared_memory: {
          columns: {
            key: 'TEXT PRIMARY KEY',
            namespace: 'TEXT NOT NULL',
            data_type: 'TEXT NOT NULL',
            value: 'TEXT NOT NULL',
            metadata: 'TEXT',
            version: 'INTEGER DEFAULT 1',
            created_at: 'INTEGER NOT NULL',
            updated_at: 'INTEGER NOT NULL',
            expires_at: 'INTEGER',
            size_bytes: 'INTEGER DEFAULT 0',
            access_count: 'INTEGER DEFAULT 0',
            last_accessed: 'INTEGER'
          },
          constraints: [
            'CONSTRAINT chk_version CHECK (version > 0)',
            'CONSTRAINT chk_timestamps CHECK (updated_at >= created_at)',
            'CONSTRAINT chk_size CHECK (size_bytes >= 0)',
            'CONSTRAINT chk_access_count CHECK (access_count >= 0)'
          ],
          indexes: [
            'CREATE INDEX IF NOT EXISTS idx_namespace_type ON shared_memory(namespace, data_type)',
            'CREATE INDEX IF NOT EXISTS idx_expires_at_not_null ON shared_memory(expires_at) WHERE expires_at IS NOT NULL',
            'CREATE INDEX IF NOT EXISTS idx_last_accessed_desc ON shared_memory(last_accessed DESC)',
            'CREATE INDEX IF NOT EXISTS idx_access_count_desc ON shared_memory(access_count DESC)',
            'CREATE INDEX IF NOT EXISTS idx_size_bytes ON shared_memory(size_bytes)',
            'CREATE INDEX IF NOT EXISTS idx_created_at_desc ON shared_memory(created_at DESC)'
          ]
        },
        
        memory_versions: {
          columns: {
            key: 'TEXT NOT NULL',
            version: 'INTEGER NOT NULL',
            value: 'TEXT NOT NULL',
            metadata: 'TEXT',
            created_at: 'INTEGER NOT NULL'
          },
          constraints: [
            'PRIMARY KEY (key, version)',
            'FOREIGN KEY (key) REFERENCES shared_memory(key) ON DELETE CASCADE',
            'CONSTRAINT chk_version_positive CHECK (version > 0)'
          ],
          indexes: [
            'CREATE INDEX IF NOT EXISTS idx_versions_created ON memory_versions(created_at DESC)',
            'CREATE INDEX IF NOT EXISTS idx_versions_key_version ON memory_versions(key, version DESC)'
          ]
        },
        
        memory_locks: {
          columns: {
            key: 'TEXT PRIMARY KEY',
            agent_id: 'TEXT NOT NULL',
            lock_type: 'TEXT NOT NULL DEFAULT "exclusive"',
            acquired_at: 'INTEGER NOT NULL',
            expires_at: 'INTEGER NOT NULL'
          },
          constraints: [
            'CONSTRAINT chk_lock_times CHECK (expires_at > acquired_at)',
            'CONSTRAINT chk_lock_type CHECK (lock_type IN ("exclusive", "shared", "read", "write"))'
          ],
          indexes: [
            'CREATE INDEX IF NOT EXISTS idx_locks_expires ON memory_locks(expires_at)',
            'CREATE INDEX IF NOT EXISTS idx_locks_agent ON memory_locks(agent_id)'
          ]
        },
        
        connection_metrics: {
          columns: {
            id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
            timestamp: 'INTEGER NOT NULL',
            active_connections: 'INTEGER NOT NULL',
            query_count: 'INTEGER DEFAULT 0',
            avg_query_time: 'REAL DEFAULT 0.0',
            error_count: 'INTEGER DEFAULT 0',
            cache_hits: 'INTEGER DEFAULT 0',
            cache_misses: 'INTEGER DEFAULT 0'
          },
          constraints: [
            'CONSTRAINT chk_timestamp_positive CHECK (timestamp > 0)',
            'CONSTRAINT chk_counts_positive CHECK (active_connections >= 0 AND query_count >= 0 AND error_count >= 0)'
          ],
          indexes: [
            'CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON connection_metrics(timestamp DESC)'
          ]
        }
      }
    };
  }
  
  /**
   * Get hive database schema definition
   */
  getHiveSchema() {
    return {
      tables: {
        agent_memory: {
          columns: {
            agent_id: 'TEXT NOT NULL',
            memory_key: 'TEXT NOT NULL',
            access_type: 'TEXT NOT NULL',
            timestamp: 'INTEGER NOT NULL',
            duration_ms: 'INTEGER DEFAULT 0',
            success: 'BOOLEAN DEFAULT 1',
            error_message: 'TEXT'
          },
          constraints: [
            'PRIMARY KEY (agent_id, memory_key, timestamp)',
            'CONSTRAINT chk_access_type CHECK (access_type IN ("read", "write", "delete", "lock", "unlock"))',
            'CONSTRAINT chk_duration CHECK (duration_ms >= 0)'
          ],
          indexes: [
            'CREATE INDEX IF NOT EXISTS idx_agent_memory_agent_time ON agent_memory(agent_id, timestamp DESC)',
            'CREATE INDEX IF NOT EXISTS idx_agent_memory_key_time ON agent_memory(memory_key, timestamp DESC)',
            'CREATE INDEX IF NOT EXISTS idx_agent_memory_access_time ON agent_memory(access_type, timestamp DESC)'
          ]
        },
        
        memory_events: {
          columns: {
            id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
            event_type: 'TEXT NOT NULL',
            memory_key: 'TEXT NOT NULL',
            agent_id: 'TEXT',
            timestamp: 'INTEGER NOT NULL',
            data: 'TEXT',
            event_hash: 'TEXT UNIQUE',
            severity: 'TEXT DEFAULT "info"'
          },
          constraints: [
            'CONSTRAINT chk_event_type CHECK (event_type IN ("set", "get", "delete", "expire", "lock", "unlock", "error"))',
            'CONSTRAINT chk_timestamp_positive CHECK (timestamp > 0)',
            'CONSTRAINT chk_severity CHECK (severity IN ("debug", "info", "warn", "error", "critical"))'
          ],
          indexes: [
            'CREATE INDEX IF NOT EXISTS idx_events_type_time ON memory_events(event_type, timestamp DESC)',
            'CREATE INDEX IF NOT EXISTS idx_events_key_time ON memory_events(memory_key, timestamp DESC)',
            'CREATE INDEX IF NOT EXISTS idx_events_agent_time ON memory_events(agent_id, timestamp DESC)',
            'CREATE INDEX IF NOT EXISTS idx_events_severity ON memory_events(severity, timestamp DESC)'
          ]
        },
        
        agent_sessions: {
          columns: {
            session_id: 'TEXT PRIMARY KEY',
            agent_id: 'TEXT NOT NULL',
            started_at: 'INTEGER NOT NULL',
            last_activity: 'INTEGER NOT NULL',
            status: 'TEXT DEFAULT "active"',
            context_data: 'TEXT',
            memory_usage: 'INTEGER DEFAULT 0',
            query_count: 'INTEGER DEFAULT 0',
            error_count: 'INTEGER DEFAULT 0'
          },
          constraints: [
            'CONSTRAINT chk_session_status CHECK (status IN ("active", "idle", "terminated", "error"))',
            'CONSTRAINT chk_session_times CHECK (last_activity >= started_at)',
            'CONSTRAINT chk_session_counts CHECK (memory_usage >= 0 AND query_count >= 0 AND error_count >= 0)'
          ],
          indexes: [
            'CREATE INDEX IF NOT EXISTS idx_sessions_agent ON agent_sessions(agent_id, last_activity DESC)',
            'CREATE INDEX IF NOT EXISTS idx_sessions_status ON agent_sessions(status, last_activity DESC)',
            'CREATE INDEX IF NOT EXISTS idx_sessions_activity ON agent_sessions(last_activity DESC)'
          ]
        },
        
        distributed_locks: {
          columns: {
            lock_id: 'TEXT PRIMARY KEY',
            resource_key: 'TEXT NOT NULL',
            owner_agent: 'TEXT NOT NULL',
            owner_session: 'TEXT',
            acquired_at: 'INTEGER NOT NULL',
            expires_at: 'INTEGER NOT NULL',
            lock_level: 'INTEGER DEFAULT 1',
            lock_mode: 'TEXT DEFAULT "exclusive"'
          },
          constraints: [
            'CONSTRAINT chk_lock_validity CHECK (expires_at > acquired_at)',
            'CONSTRAINT chk_lock_level CHECK (lock_level > 0)',
            'CONSTRAINT chk_lock_mode CHECK (lock_mode IN ("exclusive", "shared", "intent_shared", "intent_exclusive"))',
            'FOREIGN KEY (owner_session) REFERENCES agent_sessions(session_id) ON DELETE SET NULL'
          ],
          indexes: [
            'CREATE INDEX IF NOT EXISTS idx_locks_resource ON distributed_locks(resource_key, expires_at)',
            'CREATE INDEX IF NOT EXISTS idx_locks_owner ON distributed_locks(owner_agent, acquired_at DESC)',
            'CREATE INDEX IF NOT EXISTS idx_locks_session ON distributed_locks(owner_session)',
            'CREATE INDEX IF NOT EXISTS idx_locks_expires ON distributed_locks(expires_at)'
          ]
        },
        
        query_performance: {
          columns: {
            id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
            query_type: 'TEXT NOT NULL',
            execution_time_ms: 'REAL NOT NULL',
            memory_key: 'TEXT',
            agent_id: 'TEXT',
            timestamp: 'INTEGER NOT NULL',
            rows_affected: 'INTEGER DEFAULT 0',
            cache_hit: 'BOOLEAN DEFAULT 0',
            query_hash: 'TEXT'
          },
          constraints: [
            'CONSTRAINT chk_execution_time CHECK (execution_time_ms >= 0)',
            'CONSTRAINT chk_rows_affected CHECK (rows_affected >= 0)'
          ],
          indexes: [
            'CREATE INDEX IF NOT EXISTS idx_performance_type_time ON query_performance(query_type, timestamp DESC)',
            'CREATE INDEX IF NOT EXISTS idx_performance_agent_time ON query_performance(agent_id, timestamp DESC)',
            'CREATE INDEX IF NOT EXISTS idx_performance_execution_time ON query_performance(execution_time_ms DESC)',
            'CREATE INDEX IF NOT EXISTS idx_performance_hash ON query_performance(query_hash)'
          ]
        },
        
        schema_migrations: {
          columns: {
            version: 'INTEGER PRIMARY KEY',
            migration_name: 'TEXT NOT NULL',
            applied_at: 'INTEGER NOT NULL',
            rollback_sql: 'TEXT',
            checksum: 'TEXT'
          },
          constraints: [
            'CONSTRAINT chk_version_positive CHECK (version > 0)'
          ],
          indexes: [
            'CREATE INDEX IF NOT EXISTS idx_migrations_applied ON schema_migrations(applied_at DESC)'
          ]
        }
      }
    };
  }
  
  /**
   * Initialize migration definitions
   */
  initializeMigrations() {
    this.migrations.set(1, {
      name: 'initial_schema',
      up: async (connection) => {
        // Initial schema creation handled by initializeSchemas
      },
      down: async (connection) => {
        // Drop all tables
        const tables = ['shared_memory', 'memory_versions', 'memory_locks', 'connection_metrics',
                       'agent_memory', 'memory_events', 'agent_sessions', 'distributed_locks', 
                       'query_performance', 'schema_migrations'];
        
        for (const table of tables) {
          await this.executeQuery(connection, `DROP TABLE IF EXISTS ${table}`);
        }
      }
    });
    
    // Future migrations can be added here
  }
  
  /**
   * Initialize database schemas
   */
  async initializeSchemas() {
    console.log('[SCHEMA] Initializing database schemas...');
    
    try {
      // Initialize memory database schema
      await this.initializeSchema('memory');
      
      // Initialize hive database schema
      await this.initializeSchema('hive');
      
      console.log('[SCHEMA] All schemas initialized successfully');
      
    } catch (error) {
      console.error('[SCHEMA] Schema initialization failed:', error.message);
      throw error;
    }
  }
  
  /**
   * Initialize schema for a specific database
   */
  async initializeSchema(databaseName) {
    const schema = this.schemas[databaseName];
    if (!schema) {
      throw new Error(`Schema definition not found for database: ${databaseName}`);
    }
    
    const connection = await this.connectionManager.getConnection(databaseName);
    
    try {
      // Create tables
      for (const [tableName, tableDefinition] of Object.entries(schema.tables)) {
        await this.createTable(connection, tableName, tableDefinition);
      }
      
      console.log(`[SCHEMA] ${databaseName} database schema initialized`);
      
    } finally {
      connection.release();
    }
  }
  
  /**
   * Create a table with all constraints and indexes
   */
  async createTable(connection, tableName, definition) {
    // Build CREATE TABLE statement
    const columns = Object.entries(definition.columns)
      .map(([name, type]) => `${name} ${type}`)
      .join(',\n    ');
    
    const constraints = definition.constraints ? 
      definition.constraints.map(c => `    ${c}`).join(',\n') : '';
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        ${columns}${constraints ? ',\n' + constraints : ''}
      );
    `;
    
    await this.executeQuery(connection, createTableSQL);
    
    // Create indexes
    if (definition.indexes) {
      for (const indexSQL of definition.indexes) {
        await this.executeQuery(connection, indexSQL);
      }
    }
    
    console.log(`[SCHEMA] Created table: ${tableName}`);
  }
  
  /**
   * Execute a query with error handling
   */
  async executeQuery(connection, sql, params = []) {
    return new Promise((resolve, reject) => {
      connection.run(sql, params, function(err) {
        if (err) {
          reject(new Error(`Query failed: ${err.message}\\nSQL: ${sql}`));
        } else {
          resolve({ 
            lastID: this && this.lastID ? this.lastID : null, 
            changes: this && this.changes ? this.changes : 0 
          });
        }
      });
    });
  }
  
  /**
   * Run database migration
   */
  async migrate(targetVersion = null) {
    console.log('[MIGRATION] Starting database migration...');
    
    const currentVersion = await this.getCurrentSchemaVersion();
    const target = targetVersion || Math.max(...this.migrations.keys());
    
    if (currentVersion >= target) {
      console.log(`[MIGRATION] Database is already at version ${currentVersion}`);
      return;
    }
    
    console.log(`[MIGRATION] Migrating from version ${currentVersion} to ${target}`);
    
    for (let version = currentVersion + 1; version <= target; version++) {
      const migration = this.migrations.get(version);
      if (!migration) {
        throw new Error(`Migration not found for version ${version}`);
      }
      
      console.log(`[MIGRATION] Applying migration ${version}: ${migration.name}`);
      
      // Start transaction for each migration
      const transaction = await this.connectionManager.beginTransaction('hive');
      
      try {
        await migration.up(transaction.connection);
        await this.recordMigration(transaction.connection, version, migration);
        await transaction.commit();
        
        console.log(`[MIGRATION] Successfully applied migration ${version}`);
        
      } catch (error) {
        console.error(`[MIGRATION] Failed to apply migration ${version}:`, error.message);
        await transaction.rollback(`Migration ${version} failed`);
        throw error;
      }
    }
    
    console.log('[MIGRATION] Migration completed successfully');
  }
  
  /**
   * Get current schema version
   */
  async getCurrentSchemaVersion() {
    const connection = await this.connectionManager.getConnection('hive');
    
    try {
      return new Promise((resolve) => {
        connection.get('SELECT MAX(version) as version FROM schema_migrations', [], (err, row) => {
          if (err || !row) {
            resolve(0); // No migrations applied yet
          } else {
            resolve(row.version || 0);
          }
        });
      });
    } finally {
      connection.release();
    }
  }
  
  /**
   * Record a successful migration
   */
  async recordMigration(connection, version, migration) {
    const sql = `
      INSERT INTO schema_migrations (version, migration_name, applied_at, checksum)
      VALUES (?, ?, ?, ?)
    `;
    
    const checksum = require('crypto').createHash('md5')
      .update(migration.name + version.toString())
      .digest('hex');
    
    await this.executeQuery(connection, sql, [
      version,
      migration.name,
      Date.now(),
      checksum
    ]);
  }
  
  /**
   * Validate database integrity
   */
  async validateIntegrity() {
    console.log('[VALIDATION] Starting database integrity check...');
    
    const results = {
      memory: await this.validateDatabaseIntegrity('memory'),
      hive: await this.validateDatabaseIntegrity('hive')
    };
    
    const allValid = Object.values(results).every(r => r.valid);
    
    console.log(`[VALIDATION] Integrity check ${allValid ? 'PASSED' : 'FAILED'}`);
    return results;
  }
  
  /**
   * Validate integrity of a specific database
   */
  async validateDatabaseIntegrity(databaseName) {
    const connection = await this.connectionManager.getConnection(databaseName);
    const results = { valid: true, issues: [], checks: 0 };
    
    try {
      // Check database integrity
      const integrityCheck = await new Promise((resolve) => {
        connection.get('PRAGMA integrity_check', [], (err, row) => {
          resolve(row ? row.integrity_check : 'unknown');
        });
      });
      
      results.checks++;
      if (integrityCheck !== 'ok') {
        results.valid = false;
        results.issues.push(`Integrity check failed: ${integrityCheck}`);
      }
      
      // Check foreign key constraints
      const fkCheck = await new Promise((resolve) => {
        connection.all('PRAGMA foreign_key_check', [], (err, rows) => {
          resolve(rows || []);
        });
      });
      
      results.checks++;
      if (fkCheck.length > 0) {
        results.valid = false;
        results.issues.push(`Foreign key violations found: ${fkCheck.length}`);
      }
      
    } finally {
      connection.release();
    }
    
    return results;
  }
  
  /**
   * Optimize database performance
   */
  async optimize() {
    console.log('[OPTIMIZATION] Starting database optimization...');
    
    for (const poolName of ['memory', 'hive']) {
      const connection = await this.connectionManager.getConnection(poolName);
      
      try {
        // Analyze tables for better query planning
        await this.executeQuery(connection, 'PRAGMA optimize');
        
        // Update table statistics
        await this.executeQuery(connection, 'ANALYZE');
        
        // Vacuum if needed
        const pageCount = await new Promise((resolve) => {
          connection.get('PRAGMA page_count', [], (err, row) => {
            resolve(row ? row.page_count : 0);
          });
        });
        
        const freeListCount = await new Promise((resolve) => {
          connection.get('PRAGMA freelist_count', [], (err, row) => {
            resolve(row ? row.freelist_count : 0);
          });
        });
        
        // If more than 10% of pages are free, run incremental vacuum
        if (freeListCount > pageCount * 0.1) {
          await this.executeQuery(connection, 'PRAGMA incremental_vacuum');
          console.log(`[OPTIMIZATION] Vacuumed ${poolName} database`);
        }
        
      } finally {
        connection.release();
      }
    }
    
    console.log('[OPTIMIZATION] Database optimization completed');
  }
}

module.exports = DatabaseSchemaManager;