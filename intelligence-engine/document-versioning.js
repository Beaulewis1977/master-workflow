#!/usr/bin/env node

/**
 * Document Versioning System
 * Manages document versions and rollback capabilities
 * 
 * Features:
 * - Automatic version snapshots
 * - Semantic versioning for documents
 * - Rollback capabilities with conflict detection
 * - Version comparison and diffing
 * - Branch-like versioning for different customizations
 * - Integration with SharedMemory for persistence
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const EventEmitter = require('events');

class DocumentVersioning extends EventEmitter {
  constructor(sharedMemory) {
    super();
    
    this.sharedMemory = sharedMemory;
    this.versionStore = new Map();
    this.rollbackPoints = [];
    this.currentVersions = new Map();
    this.versionMetadata = new Map();
    
    // Configuration
    this.config = {
      maxVersionsPerDocument: 50,
      maxRollbackPoints: 20,
      autoSnapshot: true,
      compressionEnabled: true,
      branchingEnabled: true,
      semanticVersioning: true
    };
    
    this.initializeVersioning();
  }
  
  /**
   * Initialize versioning system
   */
  async initializeVersioning() {
    try {
      // Load existing versions from shared memory
      await this.loadVersionHistory();
      
      // Setup automatic cleanup
      this.setupCleanupSchedule();
      
      this.emit('versioning-initialized', {
        documentsTracked: this.currentVersions.size,
        totalVersions: this.versionStore.size
      });
      
    } catch (error) {
      this.emit('error', new Error(`Failed to initialize versioning: ${error.message}`));
    }
  }
  
  /**
   * Create a new version snapshot of a document
   */
  async createSnapshot(filePath, content, options = {}) {
    try {
      const normalizedPath = path.resolve(filePath);
      const documentId = this.getDocumentId(normalizedPath);
      
      // Get current version info
      const currentVersion = this.currentVersions.get(documentId) || '0.0.0';
      const newVersion = this.calculateNextVersion(currentVersion, options);
      
      // Create version entry
      const versionEntry = {
        id: this.generateVersionId(),
        documentId,
        filePath: normalizedPath,
        version: newVersion,
        content,
        contentHash: this.calculateContentHash(content),
        timestamp: Date.now(),
        size: content.length,
        author: options.author || 'system',
        message: options.message || 'Automatic snapshot',
        tags: options.tags || [],
        branch: options.branch || 'main',
        parentVersion: currentVersion,
        metadata: {
          type: this.detectDocumentType(normalizedPath),
          encoding: options.encoding || 'utf8',
          lineEndings: this.detectLineEndings(content),
          customizations: options.customizations || [],
          ...options.metadata
        }
      };
      
      // Compress content if enabled and beneficial
      if (this.config.compressionEnabled && content.length > 1024) {
        versionEntry.compressed = true;
        versionEntry.originalSize = content.length;
        versionEntry.content = await this.compressContent(content);
      }
      
      // Store version
      const versionKey = `${documentId}:${newVersion}`;
      this.versionStore.set(versionKey, versionEntry);
      
      // Update current version
      this.currentVersions.set(documentId, newVersion);
      
      // Store metadata
      this.versionMetadata.set(versionEntry.id, {
        documentId,
        version: newVersion,
        timestamp: versionEntry.timestamp,
        size: versionEntry.size,
        branch: versionEntry.branch,
        tags: versionEntry.tags
      });
      
      // Persist to shared memory
      await this.persistVersion(versionEntry);
      
      // Cleanup old versions if needed
      await this.cleanupOldVersions(documentId);
      
      this.emit('version-created', {
        documentId,
        filePath: normalizedPath,
        version: newVersion,
        size: content.length,
        compressed: versionEntry.compressed || false
      });
      
      return {
        id: versionEntry.id,
        versionId: versionEntry.id,
        version: newVersion,
        documentId,
        timestamp: versionEntry.timestamp
      };
      
    } catch (error) {
      this.emit('error', new Error(`Failed to create snapshot: ${error.message}`));
      throw error;
    }
  }
  
  /**
   * Get version history for a document
   */
  async getVersionHistory(filePath, options = {}) {
    try {
      const documentId = this.getDocumentId(path.resolve(filePath));
      const history = [];
      
      for (const [key, version] of this.versionStore) {
        if (version.documentId === documentId) {
          // Filter by branch if specified
          if (options.branch && version.branch !== options.branch) {
            continue;
          }
          
          // Filter by date range if specified
          if (options.since && version.timestamp < options.since) {
            continue;
          }
          
          if (options.until && version.timestamp > options.until) {
            continue;
          }
          
          // Create history entry
          const historyEntry = {
            id: version.id,
            version: version.version,
            timestamp: version.timestamp,
            author: version.author,
            message: version.message,
            size: version.originalSize || version.size,
            branch: version.branch,
            tags: version.tags,
            parentVersion: version.parentVersion,
            metadata: {
              type: version.metadata.type,
              customizations: version.metadata.customizations?.length || 0
            }
          };
          
          // Include content if requested
          if (options.includeContent) {
            historyEntry.content = await this.getVersionContent(version);
          }
          
          // Include diff if requested
          if (options.includeDiff && version.parentVersion !== '0.0.0') {
            const parentContent = await this.getVersionByNumber(documentId, version.parentVersion);
            if (parentContent) {
              historyEntry.diff = await this.generateDiff(
                await this.getVersionContent(parentContent),
                await this.getVersionContent(version)
              );
            }
          }
          
          history.push(historyEntry);
        }
      }
      
      // Sort by timestamp (newest first)
      history.sort((a, b) => b.timestamp - a.timestamp);
      
      // Apply limit if specified
      if (options.limit) {
        return history.slice(0, options.limit);
      }
      
      return history;
      
    } catch (error) {
      this.emit('error', new Error(`Failed to get version history: ${error.message}`));
      throw error;
    }
  }
  
  /**
   * Rollback document to a specific version
   */
  async rollbackToVersion(filePath, version, options = {}) {
    try {
      const normalizedPath = path.resolve(filePath);
      const documentId = this.getDocumentId(normalizedPath);
      
      // Get the target version
      const targetVersion = await this.getVersionByNumber(documentId, version);
      if (!targetVersion) {
        throw new Error(`Version ${version} not found for document ${filePath}`);
      }
      
      // Check for conflicts if not forcing
      if (!options.force) {
        const conflicts = await this.checkRollbackConflicts(documentId, version);
        if (conflicts.length > 0) {
          throw new Error(`Rollback conflicts detected: ${conflicts.join(', ')}`);
        }
      }
      
      // Get version content
      const content = await this.getVersionContent(targetVersion);
      
      // Create rollback snapshot of current state first
      const currentContent = await this.getCurrentContent(normalizedPath);
      if (currentContent) {
        await this.createSnapshot(normalizedPath, currentContent, {
          message: `Pre-rollback snapshot to ${version}`,
          tags: ['rollback-backup'],
          author: options.author || 'system'
        });
      }
      
      // Perform rollback
      if (options.writeToFile !== false) {
        await fs.writeFile(normalizedPath, content, 'utf8');
      }
      
      // Create rollback version
      const currentVersion = this.currentVersions.get(documentId) || '0.0.0';
      const rollbackVersion = this.calculateRollbackVersion(currentVersion);
      
      await this.createSnapshot(normalizedPath, content, {
        message: `Rollback to version ${version}`,
        tags: ['rollback'],
        author: options.author || 'system',
        metadata: {
          rollbackFrom: currentVersion,
          rollbackTo: version,
          rollbackReason: options.reason
        }
      });
      
      // Create rollback point
      const rollbackPoint = {
        id: this.generateVersionId(),
        timestamp: Date.now(),
        documentId,
        filePath: normalizedPath,
        fromVersion: currentVersion,
        toVersion: version,
        description: `Rollback ${path.basename(normalizedPath)} from ${currentVersion} to ${version}`,
        author: options.author || 'system',
        reason: options.reason
      };
      
      this.rollbackPoints.unshift(rollbackPoint);
      
      // Limit rollback points
      if (this.rollbackPoints.length > this.config.maxRollbackPoints) {
        this.rollbackPoints = this.rollbackPoints.slice(0, this.config.maxRollbackPoints);
      }
      
      // Persist rollback points
      await this.persistRollbackPoints();
      
      this.emit('rollback-completed', {
        documentId,
        filePath: normalizedPath,
        fromVersion: currentVersion,
        toVersion: version,
        rollbackId: rollbackPoint.id
      });
      
      return {
        rollbackId: rollbackPoint.id,
        fromVersion: currentVersion,
        toVersion: version,
        content
      };
      
    } catch (error) {
      this.emit('error', new Error(`Failed to rollback: ${error.message}`));
      throw error;
    }
  }
  
  /**
   * Compare two versions of a document
   */
  async compareVersions(filePath, version1, version2, options = {}) {
    try {
      const documentId = this.getDocumentId(path.resolve(filePath));
      
      // Get both versions
      const v1 = await this.getVersionByNumber(documentId, version1);
      const v2 = await this.getVersionByNumber(documentId, version2);
      
      if (!v1) throw new Error(`Version ${version1} not found`);
      if (!v2) throw new Error(`Version ${version2} not found`);
      
      // Get content for both versions
      const content1 = await this.getVersionContent(v1);
      const content2 = await this.getVersionContent(v2);
      
      // Generate diff
      const diff = await this.generateDiff(content1, content2, options);
      
      // Calculate statistics
      const stats = this.calculateDiffStats(diff);
      
      // Create comparison result
      const comparison = {
        documentId,
        filePath: path.resolve(filePath),
        version1: {
          version: v1.version,
          timestamp: v1.timestamp,
          author: v1.author,
          size: v1.originalSize || v1.size,
          message: v1.message
        },
        version2: {
          version: v2.version,
          timestamp: v2.timestamp,
          author: v2.author,
          size: v2.originalSize || v2.size,
          message: v2.message
        },
        diff,
        stats,
        timestamp: Date.now()
      };
      
      // Store comparison result if requested
      if (options.store) {
        await this.storeComparison(comparison);
      }
      
      this.emit('versions-compared', {
        documentId,
        version1,
        version2,
        changes: stats.totalChanges
      });
      
      return comparison;
      
    } catch (error) {
      this.emit('error', new Error(`Failed to compare versions: ${error.message}`));
      throw error;
    }
  }
  
  /**
   * Create a branch for experimental changes
   */
  async createBranch(filePath, branchName, options = {}) {
    try {
      if (!this.config.branchingEnabled) {
        throw new Error('Branching is disabled');
      }
      
      const documentId = this.getDocumentId(path.resolve(filePath));
      const currentVersion = this.currentVersions.get(documentId) || '0.0.0';
      
      // Check if branch already exists
      const existingBranch = await this.getBranchInfo(documentId, branchName);
      if (existingBranch && !options.overwrite) {
        throw new Error(`Branch ${branchName} already exists`);
      }
      
      // Get current content
      const content = await this.getCurrentContent(path.resolve(filePath));
      
      // Create branch version
      await this.createSnapshot(filePath, content, {
        branch: branchName,
        message: options.message || `Created branch ${branchName}`,
        author: options.author || 'system',
        tags: ['branch-start'],
        metadata: {
          branchFrom: currentVersion,
          branchReason: options.reason
        }
      });
      
      this.emit('branch-created', {
        documentId,
        branchName,
        fromVersion: currentVersion
      });
      
      return {
        branchName,
        fromVersion: currentVersion,
        documentId
      };
      
    } catch (error) {
      this.emit('error', new Error(`Failed to create branch: ${error.message}`));
      throw error;
    }
  }
  
  /**
   * Merge changes from a branch
   */
  async mergeBranch(filePath, sourceBranch, targetBranch = 'main', options = {}) {
    try {
      const documentId = this.getDocumentId(path.resolve(filePath));
      
      // Get latest versions from both branches
      const sourceVersion = await this.getLatestVersion(documentId, sourceBranch);
      const targetVersion = await this.getLatestVersion(documentId, targetBranch);
      
      if (!sourceVersion) {
        throw new Error(`No versions found in branch ${sourceBranch}`);
      }
      
      if (!targetVersion) {
        throw new Error(`No versions found in branch ${targetBranch}`);
      }
      
      // Get content from both branches
      const sourceContent = await this.getVersionContent(sourceVersion);
      const targetContent = await this.getVersionContent(targetVersion);
      
      // Detect conflicts
      const conflicts = await this.detectMergeConflicts(sourceContent, targetContent);
      
      if (conflicts.length > 0 && !options.autoResolve) {
        return {
          conflicts,
          requiresResolution: true,
          sourceVersion: sourceVersion.version,
          targetVersion: targetVersion.version
        };
      }
      
      // Perform merge
      let mergedContent;
      if (conflicts.length > 0 && options.autoResolve) {
        mergedContent = await this.autoResolveMergeConflicts(sourceContent, targetContent, conflicts, options);
      } else {
        mergedContent = await this.mergeBranchContent(sourceContent, targetContent, options);
      }
      
      // Create merge version
      const mergeVersion = await this.createSnapshot(filePath, mergedContent, {
        branch: targetBranch,
        message: `Merge ${sourceBranch} into ${targetBranch}`,
        author: options.author || 'system',
        tags: ['merge'],
        metadata: {
          mergeFrom: sourceBranch,
          mergeTo: targetBranch,
          sourceVersion: sourceVersion.version,
          targetVersion: targetVersion.version,
          conflictsResolved: conflicts.length
        }
      });
      
      this.emit('branch-merged', {
        documentId,
        sourceBranch,
        targetBranch,
        mergeVersion: mergeVersion.version,
        conflictsResolved: conflicts.length
      });
      
      return {
        mergeVersion: mergeVersion.version,
        conflictsResolved: conflicts.length,
        mergedContent
      };
      
    } catch (error) {
      this.emit('error', new Error(`Failed to merge branch: ${error.message}`));
      throw error;
    }
  }
  
  /**
   * Get available rollback points
   */
  async getRollbackPoints() {
    return this.rollbackPoints.slice(); // Return copy
  }
  
  /**
   * Get version statistics for a document
   */
  async getVersionStats(filePath) {
    try {
      const documentId = this.getDocumentId(path.resolve(filePath));
      const versions = [];
      
      for (const [key, version] of this.versionStore) {
        if (version.documentId === documentId) {
          versions.push(version);
        }
      }
      
      if (versions.length === 0) {
        return null;
      }
      
      // Calculate statistics
      const sortedVersions = versions.sort((a, b) => a.timestamp - b.timestamp);
      const totalSize = versions.reduce((sum, v) => sum + (v.originalSize || v.size), 0);
      const averageSize = Math.round(totalSize / versions.length);
      
      // Get branches
      const branches = new Set(versions.map(v => v.branch));
      
      // Get authors
      const authors = new Set(versions.map(v => v.author));
      
      // Calculate version frequency
      const timeSpan = sortedVersions[sortedVersions.length - 1].timestamp - sortedVersions[0].timestamp;
      const averageInterval = versions.length > 1 ? Math.round(timeSpan / (versions.length - 1)) : 0;
      
      return {
        documentId,
        filePath: path.resolve(filePath),
        totalVersions: versions.length,
        currentVersion: this.currentVersions.get(documentId),
        branches: Array.from(branches),
        authors: Array.from(authors),
        oldestVersion: sortedVersions[0].version,
        newestVersion: sortedVersions[sortedVersions.length - 1].version,
        totalSize,
        averageSize,
        averageInterval, // milliseconds between versions
        firstVersionDate: new Date(sortedVersions[0].timestamp),
        lastVersionDate: new Date(sortedVersions[sortedVersions.length - 1].timestamp)
      };
      
    } catch (error) {
      this.emit('error', new Error(`Failed to get version stats: ${error.message}`));
      throw error;
    }
  }
  
  /**
   * Utility and helper methods
   */
  getDocumentId(filePath) {
    return crypto.createHash('sha256').update(filePath).digest('hex').substring(0, 16);
  }
  
  generateVersionId() {
    return crypto.randomUUID();
  }
  
  calculateContentHash(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
  }
  
  detectDocumentType(filePath) {
    const extension = path.extname(filePath).toLowerCase().substring(1);
    const typeMap = {
      'md': 'markdown',
      'json': 'json',
      'yml': 'yaml',
      'yaml': 'yaml',
      'js': 'javascript',
      'ts': 'typescript',
      'sh': 'shell',
      'txt': 'text'
    };
    
    return typeMap[extension] || 'unknown';
  }
  
  detectLineEndings(content) {
    const crlfCount = (content.match(/\r\n/g) || []).length;
    const lfCount = (content.match(/(?<!\r)\n/g) || []).length;
    
    if (crlfCount > lfCount) return 'crlf';
    if (lfCount > 0) return 'lf';
    return 'none';
  }
  
  calculateNextVersion(currentVersion, options = {}) {
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    
    if (options.major || options.breaking) {
      return `${major + 1}.0.0`;
    }
    
    if (options.minor || options.feature) {
      return `${major}.${minor + 1}.0`;
    }
    
    // Default to patch increment
    return `${major}.${minor}.${patch + 1}`;
  }
  
  calculateRollbackVersion(currentVersion) {
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    return `${major}.${minor}.${patch + 1}`;
  }
  
  async compressContent(content) {
    // Simple compression - in production, use proper compression library
    return Buffer.from(content).toString('base64');
  }
  
  async decompressContent(compressed) {
    // Simple decompression
    return Buffer.from(compressed, 'base64').toString('utf8');
  }
  
  async getVersionContent(version) {
    if (version.compressed) {
      return await this.decompressContent(version.content);
    }
    return version.content;
  }
  
  async getCurrentContent(filePath) {
    try {
      return await fs.readFile(filePath, 'utf8');
    } catch {
      return null;
    }
  }
  
  async getVersionByNumber(documentId, version) {
    const key = `${documentId}:${version}`;
    return this.versionStore.get(key) || null;
  }
  
  async getLatestVersion(documentId, branch = 'main') {
    let latest = null;
    let latestTimestamp = 0;
    
    for (const [key, version] of this.versionStore) {
      if (version.documentId === documentId && 
          version.branch === branch && 
          version.timestamp > latestTimestamp) {
        latest = version;
        latestTimestamp = version.timestamp;
      }
    }
    
    return latest;
  }
  
  async generateDiff(content1, content2, options = {}) {
    // Simple line-by-line diff - in production, use proper diff library
    const lines1 = content1.split('\n');
    const lines2 = content2.split('\n');
    
    const diff = [];
    const maxLength = Math.max(lines1.length, lines2.length);
    
    for (let i = 0; i < maxLength; i++) {
      const line1 = lines1[i];
      const line2 = lines2[i];
      
      if (line1 === undefined) {
        diff.push({ type: 'added', line: i + 1, content: line2 });
      } else if (line2 === undefined) {
        diff.push({ type: 'removed', line: i + 1, content: line1 });
      } else if (line1 !== line2) {
        diff.push({ type: 'changed', line: i + 1, from: line1, to: line2 });
      }
    }
    
    return diff;
  }
  
  calculateDiffStats(diff) {
    const stats = {
      totalChanges: diff.length,
      added: 0,
      removed: 0,
      changed: 0
    };
    
    diff.forEach(change => {
      stats[change.type]++;
    });
    
    return stats;
  }
  
  async checkRollbackConflicts(documentId, version) {
    // Simple conflict detection - can be enhanced
    const conflicts = [];
    const currentVersion = this.currentVersions.get(documentId);
    
    if (currentVersion && this.compareVersionNumbers(version, currentVersion) > 0) {
      conflicts.push('Target version is newer than current version');
    }
    
    return conflicts;
  }
  
  compareVersionNumbers(version1, version2) {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    
    for (let i = 0; i < 3; i++) {
      if (v1Parts[i] > v2Parts[i]) return 1;
      if (v1Parts[i] < v2Parts[i]) return -1;
    }
    
    return 0;
  }
  
  async getBranchInfo(documentId, branchName) {
    for (const [key, version] of this.versionStore) {
      if (version.documentId === documentId && version.branch === branchName) {
        return {
          branchName,
          latestVersion: version.version,
          timestamp: version.timestamp
        };
      }
    }
    return null;
  }
  
  async detectMergeConflicts(sourceContent, targetContent) {
    // Simple conflict detection - can be enhanced with proper 3-way merge
    const conflicts = [];
    const sourceLines = sourceContent.split('\n');
    const targetLines = targetContent.split('\n');
    
    // Find conflicting lines
    const maxLength = Math.max(sourceLines.length, targetLines.length);
    
    for (let i = 0; i < maxLength; i++) {
      const sourceLine = sourceLines[i];
      const targetLine = targetLines[i];
      
      if (sourceLine !== undefined && 
          targetLine !== undefined && 
          sourceLine !== targetLine) {
        
        // Check if this looks like a significant conflict
        if (sourceLine.trim() && targetLine.trim()) {
          conflicts.push({
            line: i + 1,
            source: sourceLine,
            target: targetLine,
            type: 'content-conflict'
          });
        }
      }
    }
    
    return conflicts;
  }
  
  async autoResolveMergeConflicts(sourceContent, targetContent, conflicts, options) {
    // Simple auto-resolution strategy - prefer target by default
    let resolved = targetContent;
    
    if (options.preferSource) {
      resolved = sourceContent;
    } else if (options.preferTarget) {
      resolved = targetContent;
    }
    
    return resolved;
  }
  
  async mergeBranchContent(sourceContent, targetContent, options) {
    // Simple merge - in production, use proper 3-way merge algorithm
    return options.preferSource ? sourceContent : targetContent;
  }
  
  /**
   * Persistence methods
   */
  async loadVersionHistory() {
    try {
      // Load versions
      const versions = await this.sharedMemory.get('document-versioning:versions');
      if (versions) {
        this.versionStore = new Map(versions);
      }
      
      // Load current versions
      const currentVersions = await this.sharedMemory.get('document-versioning:current');
      if (currentVersions) {
        this.currentVersions = new Map(currentVersions);
      }
      
      // Load rollback points
      const rollbackPoints = await this.sharedMemory.get('document-versioning:rollback-points');
      if (rollbackPoints) {
        this.rollbackPoints = rollbackPoints;
      }
      
    } catch (error) {
      // No existing data, start fresh
    }
  }
  
  async persistVersion(version) {
    const key = `${version.documentId}:${version.version}`;
    
    // Store in shared memory
    await this.sharedMemory.set(
      `document-version:${version.id}`,
      version,
      {
        namespace: this.sharedMemory.namespaces.SHARED_STATE,
        dataType: this.sharedMemory.dataTypes.PERSISTENT
      }
    );
    
    // Update version store in memory
    await this.sharedMemory.set(
      'document-versioning:versions',
      Array.from(this.versionStore.entries()),
      {
        namespace: this.sharedMemory.namespaces.SHARED_STATE,
        dataType: this.sharedMemory.dataTypes.PERSISTENT
      }
    );
    
    // Update current versions
    await this.sharedMemory.set(
      'document-versioning:current',
      Array.from(this.currentVersions.entries()),
      {
        namespace: this.sharedMemory.namespaces.SHARED_STATE,
        dataType: this.sharedMemory.dataTypes.PERSISTENT
      }
    );
  }
  
  async persistRollbackPoints() {
    await this.sharedMemory.set(
      'document-versioning:rollback-points',
      this.rollbackPoints,
      {
        namespace: this.sharedMemory.namespaces.SHARED_STATE,
        dataType: this.sharedMemory.dataTypes.PERSISTENT
      }
    );
  }
  
  async storeComparison(comparison) {
    await this.sharedMemory.set(
      `version-comparison:${Date.now()}`,
      comparison,
      {
        namespace: this.sharedMemory.namespaces.TASK_RESULTS,
        dataType: this.sharedMemory.dataTypes.CACHED,
        ttl: 86400000 // 24 hours
      }
    );
  }
  
  async cleanupOldVersions(documentId) {
    const versions = [];
    
    // Collect all versions for this document
    for (const [key, version] of this.versionStore) {
      if (version.documentId === documentId) {
        versions.push({ key, version });
      }
    }
    
    // Sort by timestamp (oldest first)
    versions.sort((a, b) => a.version.timestamp - b.version.timestamp);
    
    // Remove excess versions
    while (versions.length > this.config.maxVersionsPerDocument) {
      const toRemove = versions.shift();
      this.versionStore.delete(toRemove.key);
    }
  }
  
  setupCleanupSchedule() {
    // Run cleanup every hour
    setInterval(() => {
      this.performScheduledCleanup().catch(error => {
        this.emit('error', new Error(`Scheduled cleanup failed: ${error.message}`));
      });
    }, 3600000);
  }
  
  async performScheduledCleanup() {
    // Clean up expired rollback points
    const cutoffTime = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days
    
    this.rollbackPoints = this.rollbackPoints.filter(point => 
      point.timestamp > cutoffTime
    );
    
    await this.persistRollbackPoints();
  }
}

module.exports = DocumentVersioning;