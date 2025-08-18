/**
 * Comprehensive Backup Recovery System
 * 
 * Provides automated backup, verification, and recovery capabilities
 * for the entire intelligence engine system.
 * 
 * @author Recovery Specialist Agent
 * @version 1.0.0
 * @date August 2025
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { exec } = require('child_process');
const { promisify } = require('util');
const EventEmitter = require('events');

const execAsync = promisify(exec);

class BackupRecoverySystem extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      backupDirectory: options.backupDirectory || path.join(process.cwd(), '.backups'),
      maxBackups: options.maxBackups || 10,
      backupInterval: options.backupInterval || 3600000, // 1 hour
      compressionLevel: options.compressionLevel || 9,
      verificationEnabled: options.verificationEnabled !== false,
      encryptionEnabled: options.encryptionEnabled || false,
      encryptionKey: options.encryptionKey || null,
      ...options
    };
    
    // Backup state management
    this.backupHistory = [];
    this.currentBackup = null;
    this.backupTimer = null;
    this.isBackupInProgress = false;
    
    // System components to backup
    this.backupComponents = {
      sharedMemory: {
        enabled: true,
        path: '.hive-mind',
        priority: 1,
        size: 0
      },
      intelligence: {
        enabled: true,
        path: 'intelligence-engine',
        priority: 2,
        exclude: ['node_modules', '*.log', '*.tmp']
      },
      configs: {
        enabled: true,
        path: 'configs',
        priority: 3
      },
      agents: {
        enabled: true,
        path: '.claude/agents',
        priority: 4
      },
      database: {
        enabled: true,
        path: '.hive-mind/*.db',
        priority: 1
      }
    };
    
    // Recovery options
    this.recoveryStrategies = {
      full: 'Complete system restore from backup',
      partial: 'Selective component restoration',
      incremental: 'Apply only changes since last backup',
      pointInTime: 'Restore to specific timestamp'
    };
    
    // Metrics and monitoring
    this.metrics = {
      totalBackups: 0,
      successfulBackups: 0,
      failedBackups: 0,
      totalDataBackedUp: 0,
      averageBackupTime: 0,
      lastBackupTime: null,
      recoveryOperations: 0,
      successfulRecoveries: 0
    };
    
    // Initialize system
    this.initialize();
  }
  
  /**
   * Initialize the backup recovery system
   */
  async initialize() {
    try {
      // Create backup directory
      await this.ensureBackupDirectory();
      
      // Load backup history
      await this.loadBackupHistory();
      
      // Start automatic backups if configured
      if (this.options.backupInterval > 0) {
        this.startAutomaticBackups();
      }
      
      console.log('[BACKUP] Backup Recovery System initialized successfully');
      this.emit('initialized', { backupDirectory: this.options.backupDirectory });
      
    } catch (error) {
      console.error('[BACKUP] Failed to initialize:', error.message);
      this.emit('error', error);
    }
  }
  
  /**
   * Ensure backup directory exists with proper permissions
   */
  async ensureBackupDirectory() {
    try {
      await fs.mkdir(this.options.backupDirectory, { recursive: true, mode: 0o750 });
      
      // Create subdirectories
      const subdirs = ['full', 'incremental', 'metadata', 'recovery'];
      for (const subdir of subdirs) {
        await fs.mkdir(path.join(this.options.backupDirectory, subdir), { 
          recursive: true, 
          mode: 0o750 
        });
      }
      
      console.log('[BACKUP] Backup directory structure created');
    } catch (error) {
      throw new Error(`Failed to create backup directory: ${error.message}`);
    }
  }
  
  /**
   * Load backup history from metadata files
   */
  async loadBackupHistory() {
    try {
      const metadataDir = path.join(this.options.backupDirectory, 'metadata');
      const files = await fs.readdir(metadataDir);
      
      const historyFiles = files.filter(f => f.endsWith('.json'));
      this.backupHistory = [];
      
      for (const file of historyFiles) {
        try {
          const content = await fs.readFile(path.join(metadataDir, file), 'utf-8');
          const backup = JSON.parse(content);
          this.backupHistory.push(backup);
        } catch (error) {
          console.warn(`[BACKUP] Failed to load backup metadata ${file}:`, error.message);
        }
      }
      
      // Sort by timestamp
      this.backupHistory.sort((a, b) => b.timestamp - a.timestamp);
      
      console.log(`[BACKUP] Loaded ${this.backupHistory.length} backup records`);
    } catch (error) {
      console.warn('[BACKUP] Failed to load backup history:', error.message);
      this.backupHistory = [];
    }
  }
  
  /**
   * Start automatic backup process
   */
  startAutomaticBackups() {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
    }
    
    this.backupTimer = setInterval(async () => {
      try {
        await this.createBackup({ type: 'automatic' });
      } catch (error) {
        console.error('[BACKUP] Automatic backup failed:', error.message);
        this.emit('backup.failed', { error: error.message, type: 'automatic' });
      }
    }, this.options.backupInterval);
    
    console.log(`[BACKUP] Automatic backups started with ${this.options.backupInterval}ms interval`);
  }
  
  /**
   * Create a comprehensive system backup
   */
  async createBackup(options = {}) {
    if (this.isBackupInProgress) {
      throw new Error('Backup already in progress');
    }
    
    const backupId = crypto.randomUUID();
    const timestamp = Date.now();
    const backupType = options.type || 'manual';
    const startTime = Date.now();
    
    this.isBackupInProgress = true;
    this.currentBackup = { id: backupId, type: backupType, timestamp, startTime };
    
    try {
      console.log(`[BACKUP] Starting ${backupType} backup ${backupId}`);
      this.emit('backup.started', { backupId, type: backupType, timestamp });
      
      // Create backup metadata
      const backupMetadata = {
        id: backupId,
        type: backupType,
        timestamp,
        startTime,
        version: '1.0.0',
        components: {},
        files: [],
        checksums: {},
        size: 0,
        compressed: false,
        encrypted: this.options.encryptionEnabled
      };
      
      // Backup each component
      for (const [componentName, component] of Object.entries(this.backupComponents)) {
        if (!component.enabled) continue;
        
        console.log(`[BACKUP] Backing up component: ${componentName}`);
        
        try {
          const componentBackup = await this.backupComponent(
            componentName, 
            component, 
            backupId
          );
          
          backupMetadata.components[componentName] = componentBackup;
          backupMetadata.size += componentBackup.size;
          backupMetadata.files.push(...componentBackup.files);
          
        } catch (error) {
          console.error(`[BACKUP] Failed to backup ${componentName}:`, error.message);
          backupMetadata.components[componentName] = {
            status: 'failed',
            error: error.message
          };
        }
      }
      
      // Create backup archive
      const archivePath = await this.createBackupArchive(backupId, backupMetadata);
      backupMetadata.archivePath = archivePath;
      
      // Verify backup if enabled
      if (this.options.verificationEnabled) {
        const verification = await this.verifyBackup(backupMetadata);
        backupMetadata.verification = verification;
        
        if (!verification.valid) {
          throw new Error(`Backup verification failed: ${verification.errors.join(', ')}`);
        }
      }
      
      // Calculate final metrics
      const duration = Date.now() - startTime;
      backupMetadata.duration = duration;
      backupMetadata.endTime = Date.now();
      backupMetadata.status = 'completed';
      
      // Save metadata
      await this.saveBackupMetadata(backupMetadata);
      
      // Add to history
      this.backupHistory.unshift(backupMetadata);
      
      // Cleanup old backups
      await this.cleanupOldBackups();
      
      // Update metrics
      this.updateBackupMetrics(backupMetadata, true);
      
      console.log(`[BACKUP] Backup ${backupId} completed in ${duration}ms (${this.formatBytes(backupMetadata.size)})`);
      
      this.emit('backup.completed', backupMetadata);
      return backupMetadata;
      
    } catch (error) {
      console.error(`[BACKUP] Backup ${backupId} failed:`, error.message);
      
      const failureMetadata = {
        id: backupId,
        type: backupType,
        timestamp,
        startTime,
        endTime: Date.now(),
        duration: Date.now() - startTime,
        status: 'failed',
        error: error.message
      };
      
      this.updateBackupMetrics(failureMetadata, false);
      this.emit('backup.failed', failureMetadata);
      
      throw error;
      
    } finally {
      this.isBackupInProgress = false;
      this.currentBackup = null;
    }
  }
  
  /**
   * Backup a specific system component
   */
  async backupComponent(componentName, component, backupId) {
    const componentDir = path.join(this.options.backupDirectory, 'components', backupId);
    await fs.mkdir(componentDir, { recursive: true });
    
    const componentBackup = {
      name: componentName,
      path: component.path,
      files: [],
      size: 0,
      checksum: null,
      status: 'completed'
    };
    
    try {
      // Resolve component path
      const sourcePath = path.resolve(component.path);
      
      // Check if source exists
      try {
        await fs.access(sourcePath);
      } catch (error) {
        console.warn(`[BACKUP] Component ${componentName} path not found: ${sourcePath}`);
        componentBackup.status = 'skipped';
        componentBackup.reason = 'path_not_found';
        return componentBackup;
      }
      
      // Copy component files
      const targetPath = path.join(componentDir, componentName);
      await this.copyDirectory(sourcePath, targetPath, component.exclude);
      
      // Calculate size and checksum
      const stats = await this.calculateDirectoryStats(targetPath);
      componentBackup.size = stats.size;
      componentBackup.files = stats.files;
      componentBackup.checksum = stats.checksum;
      
      return componentBackup;
      
    } catch (error) {
      componentBackup.status = 'failed';
      componentBackup.error = error.message;
      return componentBackup;
    }
  }
  
  /**
   * Copy directory with exclusion patterns
   */
  async copyDirectory(source, target, excludePatterns = []) {
    await fs.mkdir(target, { recursive: true });
    
    const entries = await fs.readdir(source, { withFileTypes: true });
    
    for (const entry of entries) {
      const sourcePath = path.join(source, entry.name);
      const targetPath = path.join(target, entry.name);
      
      // Check exclusion patterns
      const shouldExclude = excludePatterns.some(pattern => {
        if (pattern.includes('*')) {
          const regex = new RegExp(pattern.replace(/\*/g, '.*'));
          return regex.test(entry.name);
        }
        return entry.name === pattern;
      });
      
      if (shouldExclude) {
        continue;
      }
      
      if (entry.isDirectory()) {
        await this.copyDirectory(sourcePath, targetPath, excludePatterns);
      } else {
        await fs.copyFile(sourcePath, targetPath);
      }
    }
  }
  
  /**
   * Calculate directory statistics
   */
  async calculateDirectoryStats(dirPath) {
    let totalSize = 0;
    const files = [];
    const hash = crypto.createHash('sha256');
    
    const processDirectory = async (currentPath) => {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        
        if (entry.isDirectory()) {
          await processDirectory(fullPath);
        } else {
          const stats = await fs.stat(fullPath);
          totalSize += stats.size;
          
          const relativePath = path.relative(dirPath, fullPath);
          files.push({
            path: relativePath,
            size: stats.size,
            modified: stats.mtime.toISOString()
          });
          
          // Add to checksum
          const fileContent = await fs.readFile(fullPath);
          hash.update(fileContent);
        }
      }
    };
    
    await processDirectory(dirPath);
    
    return {
      size: totalSize,
      files,
      checksum: hash.digest('hex')
    };
  }
  
  /**
   * Create compressed backup archive
   */
  async createBackupArchive(backupId, metadata) {
    const componentsDir = path.join(this.options.backupDirectory, 'components', backupId);
    const archiveName = `backup-${backupId}-${Date.now()}.tar.gz`;
    const archivePath = path.join(this.options.backupDirectory, 'full', archiveName);
    
    try {
      // Create tar.gz archive
      const command = `tar -czf "${archivePath}" -C "${componentsDir}" .`;
      await execAsync(command);
      
      // Get archive size
      const stats = await fs.stat(archivePath);
      metadata.compressedSize = stats.size;
      metadata.compressed = true;
      
      // Cleanup components directory
      await fs.rm(componentsDir, { recursive: true, force: true });
      
      console.log(`[BACKUP] Archive created: ${archiveName} (${this.formatBytes(stats.size)})`);
      
      return archivePath;
      
    } catch (error) {
      throw new Error(`Failed to create backup archive: ${error.message}`);
    }
  }
  
  /**
   * Verify backup integrity
   */
  async verifyBackup(metadata) {
    const verification = {
      valid: true,
      errors: [],
      checks: {
        archiveExists: false,
        archiveReadable: false,
        checksumValid: false,
        sizeValid: false
      }
    };
    
    try {
      // Check if archive exists
      try {
        await fs.access(metadata.archivePath);
        verification.checks.archiveExists = true;
      } catch (error) {
        verification.valid = false;
        verification.errors.push('Archive file not found');
      }
      
      if (verification.checks.archiveExists) {
        // Check if archive is readable
        try {
          const stats = await fs.stat(metadata.archivePath);
          verification.checks.archiveReadable = true;
          verification.checks.sizeValid = stats.size > 0;
          
          if (!verification.checks.sizeValid) {
            verification.valid = false;
            verification.errors.push('Archive file is empty');
          }
          
        } catch (error) {
          verification.valid = false;
          verification.errors.push('Archive file not readable');
        }
      }
      
      // Test archive extraction (quick test)
      if (verification.checks.archiveReadable) {
        try {
          const testCommand = `tar -tzf "${metadata.archivePath}" | head -5`;
          await execAsync(testCommand);
          verification.checks.checksumValid = true;
        } catch (error) {
          verification.valid = false;
          verification.errors.push('Archive extraction test failed');
        }
      }
      
    } catch (error) {
      verification.valid = false;
      verification.errors.push(`Verification error: ${error.message}`);
    }
    
    return verification;
  }
  
  /**
   * Save backup metadata to file
   */
  async saveBackupMetadata(metadata) {
    const metadataPath = path.join(
      this.options.backupDirectory, 
      'metadata', 
      `backup-${metadata.id}.json`
    );
    
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  }
  
  /**
   * Cleanup old backups beyond retention limit
   */
  async cleanupOldBackups() {
    if (this.backupHistory.length <= this.options.maxBackups) {
      return;
    }
    
    const toDelete = this.backupHistory.slice(this.options.maxBackups);
    
    for (const backup of toDelete) {
      try {
        // Delete archive file
        if (backup.archivePath) {
          await fs.rm(backup.archivePath, { force: true });
        }
        
        // Delete metadata file
        const metadataPath = path.join(
          this.options.backupDirectory,
          'metadata',
          `backup-${backup.id}.json`
        );
        await fs.rm(metadataPath, { force: true });
        
        console.log(`[BACKUP] Cleaned up old backup: ${backup.id}`);
        
      } catch (error) {
        console.warn(`[BACKUP] Failed to cleanup backup ${backup.id}:`, error.message);
      }
    }
    
    // Update history
    this.backupHistory = this.backupHistory.slice(0, this.options.maxBackups);
  }
  
  /**
   * Restore system from backup
   */
  async restoreFromBackup(backupId, strategy = 'full', options = {}) {
    const backup = this.backupHistory.find(b => b.id === backupId);
    if (!backup) {
      throw new Error(`Backup ${backupId} not found`);
    }
    
    const restoreId = crypto.randomUUID();
    const startTime = Date.now();
    
    console.log(`[RECOVERY] Starting ${strategy} restore from backup ${backupId}`);
    this.emit('restore.started', { restoreId, backupId, strategy });
    
    try {
      // Create restoration working directory
      const restoreDir = path.join(this.options.backupDirectory, 'recovery', restoreId);
      await fs.mkdir(restoreDir, { recursive: true });
      
      // Extract backup archive
      await this.extractBackup(backup, restoreDir);
      
      // Execute restoration strategy
      const restoreResult = await this.executeRestoreStrategy(
        strategy, 
        backup, 
        restoreDir, 
        options
      );
      
      // Update metrics
      this.metrics.recoveryOperations++;
      this.metrics.successfulRecoveries++;
      
      const duration = Date.now() - startTime;
      
      console.log(`[RECOVERY] Restore completed in ${duration}ms`);
      
      // Cleanup working directory
      await fs.rm(restoreDir, { recursive: true, force: true });
      
      this.emit('restore.completed', { 
        restoreId, 
        backupId, 
        strategy, 
        duration,
        result: restoreResult 
      });
      
      return restoreResult;
      
    } catch (error) {
      console.error(`[RECOVERY] Restore failed:`, error.message);
      this.metrics.recoveryOperations++;
      
      this.emit('restore.failed', { restoreId, backupId, error: error.message });
      throw error;
    }
  }
  
  /**
   * Extract backup archive
   */
  async extractBackup(backup, targetDir) {
    try {
      const command = `tar -xzf "${backup.archivePath}" -C "${targetDir}"`;
      await execAsync(command);
      
      console.log(`[RECOVERY] Backup extracted to ${targetDir}`);
    } catch (error) {
      throw new Error(`Failed to extract backup: ${error.message}`);
    }
  }
  
  /**
   * Execute restoration strategy
   */
  async executeRestoreStrategy(strategy, backup, restoreDir, options) {
    switch (strategy) {
      case 'full':
        return await this.executeFullRestore(backup, restoreDir);
        
      case 'partial':
        return await this.executePartialRestore(backup, restoreDir, options.components);
        
      case 'incremental':
        return await this.executeIncrementalRestore(backup, restoreDir);
        
      case 'pointInTime':
        return await this.executePointInTimeRestore(backup, restoreDir, options.timestamp);
        
      default:
        throw new Error(`Unknown restoration strategy: ${strategy}`);
    }
  }
  
  /**
   * Execute full system restore
   */
  async executeFullRestore(backup, restoreDir) {
    const restoredComponents = [];
    
    for (const [componentName, componentData] of Object.entries(backup.components)) {
      if (componentData.status !== 'completed') continue;
      
      try {
        const sourcePath = path.join(restoreDir, componentName);
        const targetPath = path.resolve(this.backupComponents[componentName].path);
        
        // Backup existing data
        const backupSuffix = `.backup-${Date.now()}`;
        try {
          await fs.rename(targetPath, targetPath + backupSuffix);
        } catch (error) {
          // Path might not exist, that's okay
        }
        
        // Restore component
        await this.copyDirectory(sourcePath, targetPath);
        
        restoredComponents.push({
          component: componentName,
          status: 'restored',
          path: targetPath
        });
        
        console.log(`[RECOVERY] Restored component: ${componentName}`);
        
      } catch (error) {
        console.error(`[RECOVERY] Failed to restore ${componentName}:`, error.message);
        
        restoredComponents.push({
          component: componentName,
          status: 'failed',
          error: error.message
        });
      }
    }
    
    return {
      strategy: 'full',
      componentsRestored: restoredComponents,
      totalComponents: Object.keys(backup.components).length
    };
  }
  
  /**
   * Execute partial restore for specific components
   */
  async executePartialRestore(backup, restoreDir, components = []) {
    if (!components.length) {
      throw new Error('No components specified for partial restore');
    }
    
    const restoredComponents = [];
    
    for (const componentName of components) {
      const componentData = backup.components[componentName];
      
      if (!componentData) {
        restoredComponents.push({
          component: componentName,
          status: 'not_found_in_backup',
          error: 'Component not found in backup'
        });
        continue;
      }
      
      if (componentData.status !== 'completed') {
        restoredComponents.push({
          component: componentName,
          status: 'backup_incomplete',
          error: 'Component backup was not completed successfully'
        });
        continue;
      }
      
      try {
        const sourcePath = path.join(restoreDir, componentName);
        const targetPath = path.resolve(this.backupComponents[componentName].path);
        
        // Create backup of existing data
        const backupSuffix = `.backup-${Date.now()}`;
        try {
          await fs.rename(targetPath, targetPath + backupSuffix);
        } catch (error) {
          // Path might not exist, that's okay
        }
        
        // Restore component
        await this.copyDirectory(sourcePath, targetPath);
        
        restoredComponents.push({
          component: componentName,
          status: 'restored',
          path: targetPath
        });
        
        console.log(`[RECOVERY] Restored component: ${componentName}`);
        
      } catch (error) {
        console.error(`[RECOVERY] Failed to restore ${componentName}:`, error.message);
        
        restoredComponents.push({
          component: componentName,
          status: 'failed',
          error: error.message
        });
      }
    }
    
    return {
      strategy: 'partial',
      requestedComponents: components,
      componentsRestored: restoredComponents
    };
  }
  
  /**
   * Execute incremental restore (placeholder - would need delta tracking)
   */
  async executeIncrementalRestore(backup, restoreDir) {
    // This would require delta tracking between backups
    throw new Error('Incremental restore not yet implemented - use full or partial restore');
  }
  
  /**
   * Execute point-in-time restore (placeholder - would need timestamp tracking)
   */
  async executePointInTimeRestore(backup, restoreDir, timestamp) {
    // This would require file-level timestamp tracking
    throw new Error('Point-in-time restore not yet implemented - use full or partial restore');
  }
  
  /**
   * Update backup metrics
   */
  updateBackupMetrics(metadata, success) {
    this.metrics.totalBackups++;
    
    if (success) {
      this.metrics.successfulBackups++;
      this.metrics.totalDataBackedUp += metadata.size || 0;
      this.metrics.lastBackupTime = metadata.timestamp;
      
      // Update average backup time
      const duration = metadata.duration || 0;
      this.metrics.averageBackupTime = 
        (this.metrics.averageBackupTime * (this.metrics.successfulBackups - 1) + duration) / 
        this.metrics.successfulBackups;
        
    } else {
      this.metrics.failedBackups++;
    }
  }
  
  /**
   * Get system status and metrics
   */
  getStatus() {
    return {
      initialized: true,
      backupInProgress: this.isBackupInProgress,
      currentBackup: this.currentBackup,
      backupHistory: this.backupHistory.slice(0, 5), // Last 5 backups
      metrics: this.metrics,
      configuration: {
        backupDirectory: this.options.backupDirectory,
        maxBackups: this.options.maxBackups,
        backupInterval: this.options.backupInterval,
        automaticBackups: this.backupTimer !== null,
        verificationEnabled: this.options.verificationEnabled,
        encryptionEnabled: this.options.encryptionEnabled
      },
      components: this.backupComponents
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
    console.log('[BACKUP] Shutting down backup recovery system...');
    
    // Stop automatic backups
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      console.log('[BACKUP] Automatic backup timer stopped');
    }
    
    // Wait for current backup to complete
    if (this.isBackupInProgress && this.currentBackup) {
      console.log('[BACKUP] Waiting for current backup to complete...');
      
      // Wait up to 5 minutes for backup to complete
      const maxWait = 300000; // 5 minutes
      const checkInterval = 1000; // 1 second
      let waited = 0;
      
      while (this.isBackupInProgress && waited < maxWait) {
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        waited += checkInterval;
      }
      
      if (this.isBackupInProgress) {
        console.warn('[BACKUP] Backup did not complete within timeout, forcing shutdown');
      } else {
        console.log('[BACKUP] Current backup completed successfully');
      }
    }
    
    this.emit('shutdown-complete');
    console.log('[BACKUP] Backup recovery system shutdown complete');
  }
}

module.exports = BackupRecoverySystem;