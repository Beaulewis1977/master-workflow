/**
 * Conflict Detector - Intelligent Conflict Detection for Unlimited Agent Scaling
 * 
 * This module provides advanced conflict detection and resolution capabilities to ensure
 * safe parallel execution of unlimited sub-agents. It prevents file conflicts, resource
 * contention, and dependency violations.
 * 
 * Features:
 * - Real-time file access monitoring
 * - Dependency graph analysis
 * - Resource lock management
 * - Git branch conflict detection
 * - Task isolation and safety checks
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class ConflictDetector extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Configuration
    this.config = {
      projectRoot: options.projectRoot || process.cwd(),
      maxLockDuration: options.maxLockDuration || 300000, // 5 minutes
      lockCleanupInterval: options.lockCleanupInterval || 60000, // 1 minute
      conflictResolutionMode: options.conflictResolutionMode || 'queue', // 'queue', 'abort', 'merge'
      gitBranchTracking: options.gitBranchTracking !== false,
      dependencyAnalysis: options.dependencyAnalysis !== false,
      ...options
    };
    
    // File access tracking
    this.fileAccess = new Map(); // file -> { readers: Set, writers: Set, locks: Set }
    this.agentFileMap = new Map(); // agentId -> Set of files
    this.fileLocks = new Map(); // file -> { agentId, mode, timestamp, duration }
    
    // Resource locks
    this.resourceLocks = new Map(); // resource -> { agentId, type, timestamp }
    this.agentResources = new Map(); // agentId -> Set of resources
    
    // Dependency tracking
    this.taskDependencies = new Map(); // taskId -> { dependencies: Set, dependents: Set }
    this.agentTasks = new Map(); // agentId -> taskId
    this.dependencyGraph = new Map(); // Graph representation
    
    // Git branch tracking
    this.gitBranches = new Map(); // agentId -> branchName
    this.branchFiles = new Map(); // branchName -> Set of modified files
    
    // Conflict detection state
    this.activeConflicts = new Map();
    this.resolvedConflicts = [];
    this.conflictHistory = [];
    
    // Cleanup timer
    this.cleanupTimer = null;
    
    // Statistics
    this.stats = {
      conflictsDetected: 0,
      conflictsResolved: 0,
      conflictsPrevented: 0,
      averageResolutionTime: 0,
      activeLocks: 0
    };
  }
  
  /**
   * Initialize conflict detection system
   */
  async initialize() {
    console.log('Initializing Conflict Detection System for unlimited agent scaling...');
    
    // Start cleanup timer
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredLocks();
    }, this.config.lockCleanupInterval);
    
    // Initialize Git tracking if enabled
    if (this.config.gitBranchTracking) {
      await this.initializeGitTracking();
    }
    
    this.emit('conflict-detector-initialized');
    console.log('Conflict Detection System initialized');
  }
  
  /**
   * Initialize Git branch tracking
   */
  async initializeGitTracking() {
    try {
      const { execSync } = require('child_process');
      const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', {
        cwd: this.config.projectRoot,
        encoding: 'utf-8'
      }).trim();
      
      console.log(`Git tracking initialized on branch: ${currentBranch}`);
      this.mainBranch = currentBranch;
      
    } catch (error) {
      console.warn('Git tracking initialization failed:', error.message);
      this.config.gitBranchTracking = false;
    }
  }
  
  /**
   * Analyze task for potential conflicts before execution
   */
  async analyzeTaskConflicts(task, agentId) {
    const analysis = {
      hasConflicts: false,
      conflicts: [],
      recommendations: [],
      riskLevel: 'low',
      canProceed: true
    };
    
    try {
      // Analyze file conflicts
      await this.analyzeFileConflicts(task, agentId, analysis);
      
      // Analyze dependency conflicts
      if (this.config.dependencyAnalysis) {
        await this.analyzeDependencyConflicts(task, agentId, analysis);
      }
      
      // Analyze resource conflicts
      await this.analyzeResourceConflicts(task, agentId, analysis);
      
      // Analyze Git branch conflicts
      if (this.config.gitBranchTracking) {
        await this.analyzeGitConflicts(task, agentId, analysis);
      }
      
      // Calculate overall risk level
      analysis.riskLevel = this.calculateRiskLevel(analysis.conflicts);
      analysis.canProceed = analysis.riskLevel !== 'critical';
      
      // Generate recommendations
      this.generateRecommendations(analysis);
      
      this.emit('conflict-analysis-completed', {
        taskId: task.id,
        agentId,
        analysis
      });
      
      return analysis;
      
    } catch (error) {
      console.error('Conflict analysis failed:', error);
      return {
        hasConflicts: true,
        conflicts: [{ type: 'analysis_error', message: error.message }],
        riskLevel: 'high',
        canProceed: false
      };
    }
  }
  
  /**
   * Analyze file access conflicts
   */
  async analyzeFileConflicts(task, agentId, analysis) {
    const targetFiles = this.extractTargetFiles(task);
    
    for (const filePath of targetFiles) {
      const normalizedPath = path.resolve(this.config.projectRoot, filePath);
      const access = this.fileAccess.get(normalizedPath);
      
      if (access) {
        // Check for write conflicts
        if (task.operation === 'write' && (access.writers.size > 0 || access.readers.size > 0)) {
          analysis.conflicts.push({
            type: 'file_write_conflict',
            file: filePath,
            conflictingAgents: [...access.writers, ...access.readers],
            severity: 'high'
          });
        }
        
        // Check for read conflicts with active writers
        if (task.operation === 'read' && access.writers.size > 0) {
          analysis.conflicts.push({
            type: 'file_read_conflict',
            file: filePath,
            conflictingAgents: [...access.writers],
            severity: 'medium'
          });
        }
      }
      
      // Check for existing locks
      const lock = this.fileLocks.get(normalizedPath);
      if (lock && lock.agentId !== agentId) {
        analysis.conflicts.push({
          type: 'file_locked',
          file: filePath,
          lockedBy: lock.agentId,
          lockType: lock.mode,
          severity: 'high'
        });
      }
    }
    
    if (analysis.conflicts.length > 0) {
      analysis.hasConflicts = true;
    }
  }
  
  /**
   * Analyze task dependency conflicts
   */
  async analyzeDependencyConflicts(task, agentId, analysis) {
    if (!task.dependencies || task.dependencies.length === 0) {
      return;
    }
    
    // Check for circular dependencies
    const circularDeps = this.detectCircularDependencies(task.id, task.dependencies);
    if (circularDeps.length > 0) {
      analysis.conflicts.push({
        type: 'circular_dependency',
        taskId: task.id,
        circularPath: circularDeps,
        severity: 'critical'
      });
    }
    
    // Check for dependency deadlocks
    const deadlocks = this.detectDependencyDeadlocks(task.id, agentId);
    if (deadlocks.length > 0) {
      analysis.conflicts.push({
        type: 'dependency_deadlock',
        taskId: task.id,
        deadlockChain: deadlocks,
        severity: 'critical'
      });
    }
    
    // Check for resource contention in dependencies
    for (const depId of task.dependencies) {
      const depAgent = this.getAgentForTask(depId);
      if (depAgent) {
        const agentResources = this.agentResources.get(depAgent) || new Set();
        const taskResources = this.extractTaskResources(task);
        
        const resourceOverlap = [...agentResources].filter(r => taskResources.has(r));
        if (resourceOverlap.length > 0) {
          analysis.conflicts.push({
            type: 'resource_dependency_conflict',
            taskId: task.id,
            dependencyTask: depId,
            conflictingResources: resourceOverlap,
            severity: 'medium'
          });
        }
      }
    }
  }
  
  /**
   * Analyze resource conflicts
   */
  async analyzeResourceConflicts(task, agentId, analysis) {
    const taskResources = this.extractTaskResources(task);
    
    for (const resource of taskResources) {
      const lock = this.resourceLocks.get(resource);
      if (lock && lock.agentId !== agentId) {
        analysis.conflicts.push({
          type: 'resource_locked',
          resource: resource,
          lockedBy: lock.agentId,
          lockType: lock.type,
          severity: 'high'
        });
      }
    }
  }
  
  /**
   * Analyze Git branch conflicts
   */
  async analyzeGitConflicts(task, agentId, analysis) {
    if (!this.config.gitBranchTracking) return;
    
    const agentBranch = this.gitBranches.get(agentId);
    const targetFiles = this.extractTargetFiles(task);
    
    if (agentBranch) {
      const branchModifiedFiles = this.branchFiles.get(agentBranch) || new Set();
      
      for (const filePath of targetFiles) {
        // Check if file is modified in other branches
        for (const [branch, files] of this.branchFiles) {
          if (branch !== agentBranch && files.has(filePath)) {
            analysis.conflicts.push({
              type: 'git_branch_conflict',
              file: filePath,
              currentBranch: agentBranch,
              conflictingBranch: branch,
              severity: 'medium'
            });
          }
        }
      }
    }
  }
  
  /**
   * Extract target files from task
   */
  extractTargetFiles(task) {
    const files = new Set();
    
    // Extract from task description
    if (task.description) {
      const fileMatches = task.description.match(/[\w\-./]+\.\w+/g);
      if (fileMatches) {
        fileMatches.forEach(file => files.add(file));
      }
    }
    
    // Extract from task files property
    if (task.files) {
      task.files.forEach(file => files.add(file));
    }
    
    // Extract from task targetFiles property
    if (task.targetFiles) {
      task.targetFiles.forEach(file => files.add(file));
    }
    
    return files;
  }
  
  /**
   * Extract task resources
   */
  extractTaskResources(task) {
    const resources = new Set();
    
    // Database connections
    if (task.database || task.description?.includes('database')) {
      resources.add('database_connection');
    }
    
    // Network ports
    if (task.port) {
      resources.add(`port_${task.port}`);
    }
    
    // External services
    if (task.services) {
      task.services.forEach(service => resources.add(`service_${service}`));
    }
    
    // Memory intensive operations
    if (task.memoryIntensive) {
      resources.add('high_memory');
    }
    
    return resources;
  }
  
  /**
   * Detect circular dependencies
   */
  detectCircularDependencies(taskId, dependencies) {
    const visited = new Set();
    const recursionStack = new Set();
    const path = [];
    
    const dfs = (currentId) => {
      if (recursionStack.has(currentId)) {
        // Found cycle
        const cycleStart = path.indexOf(currentId);
        return path.slice(cycleStart);
      }
      
      if (visited.has(currentId)) {
        return null;
      }
      
      visited.add(currentId);
      recursionStack.add(currentId);
      path.push(currentId);
      
      const taskDeps = this.taskDependencies.get(currentId);
      if (taskDeps) {
        for (const depId of taskDeps.dependencies) {
          const cycle = dfs(depId);
          if (cycle) return cycle;
        }
      }
      
      recursionStack.delete(currentId);
      path.pop();
      return null;
    };
    
    return dfs(taskId) || [];
  }
  
  /**
   * Detect dependency deadlocks
   */
  detectDependencyDeadlocks(taskId, agentId) {
    // Implementation for deadlock detection using graph analysis
    // This is a simplified version - can be enhanced with more sophisticated algorithms
    const deadlocks = [];
    
    // Check for resource-based deadlocks
    const agentResources = this.agentResources.get(agentId) || new Set();
    
    for (const [otherAgentId, otherResources] of this.agentResources) {
      if (otherAgentId === agentId) continue;
      
      const commonResources = [...agentResources].filter(r => otherResources.has(r));
      if (commonResources.length > 0) {
        deadlocks.push({
          type: 'resource_deadlock',
          agents: [agentId, otherAgentId],
          resources: commonResources
        });
      }
    }
    
    return deadlocks;
  }
  
  /**
   * Get agent for task
   */
  getAgentForTask(taskId) {
    for (const [agentId, agentTaskId] of this.agentTasks) {
      if (agentTaskId === taskId) {
        return agentId;
      }
    }
    return null;
  }
  
  /**
   * Calculate risk level based on conflicts
   */
  calculateRiskLevel(conflicts) {
    if (conflicts.length === 0) return 'low';
    
    const criticalConflicts = conflicts.filter(c => c.severity === 'critical');
    const highConflicts = conflicts.filter(c => c.severity === 'high');
    
    if (criticalConflicts.length > 0) return 'critical';
    if (highConflicts.length > 2) return 'high';
    if (highConflicts.length > 0) return 'medium';
    
    return 'low';
  }
  
  /**
   * Generate recommendations for conflict resolution
   */
  generateRecommendations(analysis) {
    analysis.recommendations = [];
    
    for (const conflict of analysis.conflicts) {
      switch (conflict.type) {
        case 'file_write_conflict':
          analysis.recommendations.push({
            action: 'queue_execution',
            message: `Queue task until file ${conflict.file} is available`,
            priority: 'high'
          });
          break;
          
        case 'circular_dependency':
          analysis.recommendations.push({
            action: 'break_dependency',
            message: 'Reorganize task dependencies to break circular reference',
            priority: 'critical'
          });
          break;
          
        case 'resource_locked':
          analysis.recommendations.push({
            action: 'wait_for_resource',
            message: `Wait for resource ${conflict.resource} to be released`,
            priority: 'medium'
          });
          break;
          
        case 'git_branch_conflict':
          analysis.recommendations.push({
            action: 'create_branch',
            message: `Create new branch to avoid conflicts with ${conflict.conflictingBranch}`,
            priority: 'low'
          });
          break;
      }
    }
  }
  
  /**
   * Acquire file lock for agent
   */
  async acquireFileLock(agentId, filePath, mode = 'write', duration = null) {
    const normalizedPath = path.resolve(this.config.projectRoot, filePath);
    const lockDuration = duration || this.config.maxLockDuration;
    
    // Check existing locks
    const existingLock = this.fileLocks.get(normalizedPath);
    if (existingLock && existingLock.agentId !== agentId) {
      throw new Error(`File ${filePath} is locked by agent ${existingLock.agentId}`);
    }
    
    // Acquire lock
    const lock = {
      agentId,
      mode,
      timestamp: Date.now(),
      duration: lockDuration,
      filePath: normalizedPath
    };
    
    this.fileLocks.set(normalizedPath, lock);
    this.stats.activeLocks++;
    
    // Track file access
    if (!this.fileAccess.has(normalizedPath)) {
      this.fileAccess.set(normalizedPath, {
        readers: new Set(),
        writers: new Set(),
        locks: new Set()
      });
    }
    
    const access = this.fileAccess.get(normalizedPath);
    if (mode === 'write') {
      access.writers.add(agentId);
    } else {
      access.readers.add(agentId);
    }
    access.locks.add(agentId);
    
    // Track agent files
    if (!this.agentFileMap.has(agentId)) {
      this.agentFileMap.set(agentId, new Set());
    }
    this.agentFileMap.get(agentId).add(normalizedPath);
    
    this.emit('file-lock-acquired', {
      agentId,
      filePath: normalizedPath,
      mode,
      duration: lockDuration
    });
    
    return lock;
  }
  
  /**
   * Release file lock
   */
  async releaseFileLock(agentId, filePath) {
    const normalizedPath = path.resolve(this.config.projectRoot, filePath);
    const lock = this.fileLocks.get(normalizedPath);
    
    if (!lock || lock.agentId !== agentId) {
      throw new Error(`No lock found for agent ${agentId} on file ${filePath}`);
    }
    
    // Remove lock
    this.fileLocks.delete(normalizedPath);
    this.stats.activeLocks--;
    
    // Update file access
    const access = this.fileAccess.get(normalizedPath);
    if (access) {
      access.readers.delete(agentId);
      access.writers.delete(agentId);
      access.locks.delete(agentId);
      
      if (access.locks.size === 0) {
        this.fileAccess.delete(normalizedPath);
      }
    }
    
    // Update agent files
    const agentFiles = this.agentFileMap.get(agentId);
    if (agentFiles) {
      agentFiles.delete(normalizedPath);
      if (agentFiles.size === 0) {
        this.agentFileMap.delete(agentId);
      }
    }
    
    this.emit('file-lock-released', {
      agentId,
      filePath: normalizedPath
    });
  }
  
  /**
   * Acquire resource lock
   */
  async acquireResourceLock(agentId, resource, type = 'exclusive') {
    const existingLock = this.resourceLocks.get(resource);
    if (existingLock && existingLock.agentId !== agentId) {
      throw new Error(`Resource ${resource} is locked by agent ${existingLock.agentId}`);
    }
    
    const lock = {
      agentId,
      type,
      timestamp: Date.now(),
      resource
    };
    
    this.resourceLocks.set(resource, lock);
    
    // Track agent resources
    if (!this.agentResources.has(agentId)) {
      this.agentResources.set(agentId, new Set());
    }
    this.agentResources.get(agentId).add(resource);
    
    this.emit('resource-lock-acquired', {
      agentId,
      resource,
      type
    });
    
    return lock;
  }
  
  /**
   * Release resource lock
   */
  async releaseResourceLock(agentId, resource) {
    const lock = this.resourceLocks.get(resource);
    if (!lock || lock.agentId !== agentId) {
      throw new Error(`No lock found for agent ${agentId} on resource ${resource}`);
    }
    
    this.resourceLocks.delete(resource);
    
    const agentResources = this.agentResources.get(agentId);
    if (agentResources) {
      agentResources.delete(resource);
      if (agentResources.size === 0) {
        this.agentResources.delete(agentId);
      }
    }
    
    this.emit('resource-lock-released', {
      agentId,
      resource
    });
  }
  
  /**
   * Clean up expired locks
   */
  cleanupExpiredLocks() {
    const now = Date.now();
    const expiredLocks = [];
    
    // Check file locks
    for (const [filePath, lock] of this.fileLocks) {
      if (now - lock.timestamp > lock.duration) {
        expiredLocks.push({ type: 'file', filePath, lock });
      }
    }
    
    // Check resource locks (use default duration)
    for (const [resource, lock] of this.resourceLocks) {
      if (now - lock.timestamp > this.config.maxLockDuration) {
        expiredLocks.push({ type: 'resource', resource, lock });
      }
    }
    
    // Clean up expired locks
    for (const expired of expiredLocks) {
      try {
        if (expired.type === 'file') {
          this.releaseFileLock(expired.lock.agentId, expired.filePath);
        } else {
          this.releaseResourceLock(expired.lock.agentId, expired.resource);
        }
        
        this.emit('lock-expired', expired);
      } catch (error) {
        console.error('Failed to clean up expired lock:', error);
      }
    }
    
    if (expiredLocks.length > 0) {
      console.log(`Cleaned up ${expiredLocks.length} expired locks`);
    }
  }
  
  /**
   * Release all locks for an agent
   */
  async releaseAllLocks(agentId) {
    // Release file locks
    const agentFiles = this.agentFileMap.get(agentId) || new Set();
    for (const filePath of agentFiles) {
      try {
        await this.releaseFileLock(agentId, filePath);
      } catch (error) {
        console.error(`Failed to release file lock for ${filePath}:`, error);
      }
    }
    
    // Release resource locks
    const agentResources = this.agentResources.get(agentId) || new Set();
    for (const resource of agentResources) {
      try {
        await this.releaseResourceLock(agentId, resource);
      } catch (error) {
        console.error(`Failed to release resource lock for ${resource}:`, error);
      }
    }
    
    this.emit('all-locks-released', { agentId });
  }
  
  /**
   * Get conflict detection status
   */
  getStatus() {
    return {
      stats: this.stats,
      activeLocks: {
        files: this.fileLocks.size,
        resources: this.resourceLocks.size
      },
      activeAgents: this.agentFileMap.size,
      activeConflicts: this.activeConflicts.size,
      config: this.config
    };
  }
  
  /**
   * Get locks for agent
   */
  getAgentLocks(agentId) {
    const fileLocks = [];
    const resourceLocks = [];
    
    for (const [filePath, lock] of this.fileLocks) {
      if (lock.agentId === agentId) {
        fileLocks.push({ filePath, ...lock });
      }
    }
    
    for (const [resource, lock] of this.resourceLocks) {
      if (lock.agentId === agentId) {
        resourceLocks.push({ resource, ...lock });
      }
    }
    
    return { fileLocks, resourceLocks };
  }
  
  /**
   * Shutdown conflict detector
   */
  async shutdown() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    // Release all locks
    for (const agentId of this.agentFileMap.keys()) {
      await this.releaseAllLocks(agentId);
    }
    
    this.emit('conflict-detector-shutdown');
    console.log('Conflict Detection System shutdown completed');
  }
}

module.exports = ConflictDetector;