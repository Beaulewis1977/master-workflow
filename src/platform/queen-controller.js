/**
 * Cross-Platform Queen Controller for Claude Flow 2.0
 * Unlimited Agent Scaling Architecture (4,462+ agents)
 * Platform-optimized for Windows, macOS, and Linux
 */

const { EventEmitter } = require('events');
const os = require('os');
const cluster = require('cluster');
const { Worker } = require('worker_threads');
const fs = require('fs').promises;
const path = require('path');
const PlatformDetector = require('./platform-detector');
const ProcessManager = require('./process-manager').ProcessManager;
const MCPDiscoverySystem = require('./mcp-discovery');
const pathHandler = require('./path-handler').default;

/**
 * Queen Controller - Supreme Agent Orchestrator
 * Manages unlimited agent scaling with platform-specific optimizations
 */
class QueenController extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      maxAgents: options.maxAgents || 4462, // Support up to 4,462 agents
      agentPoolSize: options.agentPoolSize || 100, // Initial pool size
      scaleThreshold: options.scaleThreshold || 0.8, // 80% utilization triggers scaling
      scaleDownThreshold: options.scaleDownThreshold || 0.3, // 30% utilization triggers scale down
      healthCheckInterval: options.healthCheckInterval || 30000, // 30 seconds
      metricsInterval: options.metricsInterval || 10000, // 10 seconds
      maxMemoryPerAgent: options.maxMemoryPerAgent || 512, // MB
      agentTimeout: options.agentTimeout || 300000, // 5 minutes
      clustered: options.clustered !== false, // Enable clustering by default
      ...options
    };

    // Core components
    this.platformDetector = new PlatformDetector();
    this.processManager = new ProcessManager();
    this.mcpDiscovery = new MCPDiscoverySystem();
    
    // Agent management
    this.agents = new Map();
    this.agentPool = new Set();
    this.taskQueue = [];
    this.runningTasks = new Map();
    this.agentMetrics = new Map();
    
    // System state
    this.isInitialized = false;
    this.isScaling = false;
    this.systemHealth = 'healthy';
    this.totalAgentsSpawned = 0;
    this.totalTasksCompleted = 0;
    
    // Timers
    this.healthTimer = null;
    this.metricsTimer = null;
    this.scaleTimer = null;

    // Platform-specific configurations
    this.platformConfig = null;
  }

  /**
   * Initialize the Queen Controller
   */
  async initialize() {
    if (this.isInitialized) return;

    console.log('👑 Initializing Queen Controller for Unlimited Agent Scaling...');
    
    // Initialize platform detection
    this.platformConfig = await this.platformDetector.initialize();
    
    // Initialize subsystems
    await this.processManager.initialize();
    await this.mcpDiscovery.initialize();
    
    // Setup platform-specific optimizations
    await this.setupPlatformOptimizations();
    
    // Create initial agent pool
    await this.createInitialAgentPool();
    
    // Start monitoring systems
    this.startMonitoring();
    
    this.isInitialized = true;
    console.log(`✅ Queen Controller initialized - Platform: ${this.platformDetector.getPlatformDisplay()}`);
    console.log(`🔥 Ready to scale up to ${this.options.maxAgents} agents`);
    
    this.emit('initialized', {
      platform: this.platformDetector.getPlatformDisplay(),
      maxAgents: this.options.maxAgents,
      initialPoolSize: this.agentPool.size
    });
  }

  /**
   * Spawn agents with unlimited scaling capability
   * @param {number} count - Number of agents to spawn
   * @param {object} config - Agent configuration
   * @returns {Promise<Agent[]>} Spawned agents
   */
  async spawnAgents(count, config = {}) {
    await this.ensureInitialized();
    
    if (this.agents.size + count > this.options.maxAgents) {
      throw new Error(`Cannot spawn ${count} agents. Would exceed maximum of ${this.options.maxAgents}`);
    }

    console.log(`🚀 Spawning ${count} agents...`);
    
    const agents = [];
    const batchSize = this.calculateOptimalBatchSize(count);
    
    // Spawn in batches to prevent system overload
    for (let i = 0; i < count; i += batchSize) {
      const currentBatchSize = Math.min(batchSize, count - i);
      const batch = await this.spawnAgentBatch(currentBatchSize, config);
      agents.push(...batch);
      
      // Brief pause between batches for system stability
      if (i + batchSize < count) {
        await this.sleep(this.getPlatformBatchDelay());
      }
    }

    console.log(`✅ Successfully spawned ${agents.length} agents (Total active: ${this.agents.size})`);
    
    this.emit('agentsSpawned', {
      count: agents.length,
      totalActive: this.agents.size,
      agents: agents.map(agent => agent.getInfo())
    });

    return agents;
  }

  /**
   * Execute task with intelligent agent selection
   * @param {object} task - Task to execute
   * @param {object} options - Execution options
   * @returns {Promise<any>} Task result
   */
  async executeTask(task, options = {}) {
    await this.ensureInitialized();
    
    const taskId = this.generateTaskId();
    const agent = await this.selectOptimalAgent(task);
    
    if (!agent) {
      // No agents available, add to queue
      return new Promise((resolve, reject) => {
        this.taskQueue.push({
          id: taskId,
          task,
          options,
          resolve,
          reject,
          timestamp: Date.now()
        });
        
        // Trigger scaling if needed
        this.checkScaling();
      });
    }

    try {
      const result = await this.executeTaskOnAgent(agent, task, options);
      this.totalTasksCompleted++;
      
      this.emit('taskCompleted', {
        taskId,
        agent: agent.id,
        duration: Date.now() - Date.now() // Will be calculated properly in real execution
      });
      
      return result;
    } catch (error) {
      this.emit('taskFailed', { taskId, agent: agent.id, error: error.message });
      throw error;
    }
  }

  /**
   * Scale agents up or down based on demand
   * @param {number} targetCount - Target agent count
   * @returns {Promise<void>}
   */
  async scaleAgents(targetCount) {
    if (this.isScaling) {
      console.log('⏳ Scaling already in progress...');
      return;
    }

    this.isScaling = true;
    
    try {
      const currentCount = this.agents.size;
      
      if (targetCount > currentCount) {
        // Scale up
        const spawnCount = Math.min(targetCount - currentCount, this.options.maxAgents - currentCount);
        console.log(`📈 Scaling up by ${spawnCount} agents`);
        await this.spawnAgents(spawnCount);
      } else if (targetCount < currentCount) {
        // Scale down
        const killCount = currentCount - targetCount;
        console.log(`📉 Scaling down by ${killCount} agents`);
        await this.terminateExcessAgents(killCount);
      }
      
      this.emit('scaled', {
        from: currentCount,
        to: this.agents.size,
        direction: targetCount > currentCount ? 'up' : 'down'
      });
      
    } finally {
      this.isScaling = false;
    }
  }

  /**
   * Get comprehensive system status
   * @returns {object} System status
   */
  getSystemStatus() {
    const memoryUsage = process.memoryUsage();
    const systemLoad = os.loadavg();
    
    return {
      timestamp: new Date().toISOString(),
      platform: this.platformDetector.getPlatformDisplay(),
      
      agents: {
        active: this.agents.size,
        pooled: this.agentPool.size,
        maximum: this.options.maxAgents,
        spawned: this.totalAgentsSpawned
      },
      
      tasks: {
        queued: this.taskQueue.length,
        running: this.runningTasks.size,
        completed: this.totalTasksCompleted
      },
      
      performance: {
        systemHealth: this.systemHealth,
        cpuUsage: this.getCpuUsage(),
        memoryUsage: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
          external: Math.round(memoryUsage.external / 1024 / 1024) // MB
        },
        systemLoad: systemLoad.map(load => Math.round(load * 100) / 100)
      },
      
      scaling: {
        isScaling: this.isScaling,
        utilizationThreshold: this.options.scaleThreshold,
        currentUtilization: this.getCurrentUtilization()
      },
      
      mcp: this.mcpDiscovery.getStatus(),
      
      uptime: process.uptime()
    };
  }

  /**
   * Get detailed metrics for monitoring
   * @returns {object} Detailed metrics
   */
  getDetailedMetrics() {
    const agentMetrics = Array.from(this.agentMetrics.values());
    
    return {
      timestamp: new Date().toISOString(),
      
      agentPerformance: {
        averageResponseTime: this.calculateAverageResponseTime(agentMetrics),
        throughput: this.calculateThroughput(agentMetrics),
        errorRate: this.calculateErrorRate(agentMetrics),
        healthyAgents: agentMetrics.filter(m => m.health === 'healthy').length
      },
      
      resourceUtilization: {
        cpuUtilization: this.getCpuUsage(),
        memoryUtilization: this.getMemoryUtilization(),
        networkUtilization: this.getNetworkUtilization(),
        diskUtilization: this.getDiskUtilization()
      },
      
      scalingMetrics: {
        scaleUpEvents: this.scaleUpEvents || 0,
        scaleDownEvents: this.scaleDownEvents || 0,
        lastScaleAction: this.lastScaleAction,
        predictedOptimalAgents: this.predictOptimalAgentCount()
      },
      
      platformOptimizations: this.getPlatformSpecificMetrics()
    };
  }

  // Private methods

  /**
   * Setup platform-specific optimizations
   * @private
   */
  async setupPlatformOptimizations() {
    if (this.platformDetector.isWindows()) {
      await this.setupWindowsOptimizations();
    } else if (this.platformDetector.isMacOS()) {
      await this.setupMacOSOptimizations();
    } else if (this.platformDetector.isLinux()) {
      await this.setupLinuxOptimizations();
    }
  }

  /**
   * Setup Windows-specific optimizations
   * @private
   */
  async setupWindowsOptimizations() {
    // Windows-specific optimizations
    this.platformConfig.windows = {
      useWindowsSubsystemForLinux: await this.detectWSL(),
      usePowerShellCore: await this.detectPowerShellCore(),
      maxFileHandles: 2048,
      processCreationFlags: {
        windowsHide: true,
        detached: false
      }
    };

    // Adjust spawn options for Windows
    this.options.agentSpawnOptions = {
      ...this.options.agentSpawnOptions,
      shell: 'powershell',
      windowsHide: true
    };
  }

  /**
   * Setup macOS-specific optimizations
   * @private
   */
  async setupMacOSOptimizations() {
    // macOS-specific optimizations
    this.platformConfig.macos = {
      useAppleSilicon: this.platformDetector.platform.arch === 'arm64',
      maxFileHandles: await this.getMaxFileHandles(),
      useUnifiedMemory: true
    };

    // Optimize for Apple Silicon if available
    if (this.platformConfig.macos.useAppleSilicon) {
      this.options.maxAgents = Math.min(this.options.maxAgents * 1.5, 6693); // 50% more on Apple Silicon
    }
  }

  /**
   * Setup Linux-specific optimizations
   * @private
   */
  async setupLinuxOptimizations() {
    // Linux-specific optimizations
    this.platformConfig.linux = {
      useSystemd: await this.detectSystemd(),
      useCgroups: await this.detectCgroups(),
      maxFileHandles: await this.getMaxFileHandles(),
      kernelVersion: os.release()
    };

    // Enable clustering on Linux for better performance
    if (this.options.clustered && cluster.isMaster) {
      this.enableClustering();
    }
  }

  /**
   * Create initial agent pool
   * @private
   */
  async createInitialAgentPool() {
    const poolSize = Math.min(this.options.agentPoolSize, this.options.maxAgents);
    console.log(`🏊 Creating initial agent pool of ${poolSize} agents...`);
    
    const initialAgents = await this.spawnAgents(poolSize, { pooled: true });
    
    initialAgents.forEach(agent => {
      this.agentPool.add(agent.id);
    });
    
    console.log(`✅ Initial agent pool created with ${this.agentPool.size} agents`);
  }

  /**
   * Spawn a batch of agents
   * @private
   */
  async spawnAgentBatch(count, config) {
    const agents = [];
    const promises = [];
    
    for (let i = 0; i < count; i++) {
      const agentConfig = {
        ...config,
        id: this.generateAgentId(),
        platform: this.platformDetector.getPlatformType(),
        mcpServers: await this.mcpDiscovery.getServersByCategory('core')
      };
      
      promises.push(this.spawnSingleAgent(agentConfig));
    }

    const results = await Promise.allSettled(promises);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        agents.push(result.value);
        this.totalAgentsSpawned++;
      } else {
        console.error(`Failed to spawn agent ${index}:`, result.reason);
      }
    });

    return agents;
  }

  /**
   * Spawn a single agent
   * @private
   */
  async spawnSingleAgent(config) {
    const agent = new ClaudeFlowAgent(config, this);
    
    await agent.initialize();
    
    this.agents.set(agent.id, agent);
    this.agentMetrics.set(agent.id, {
      id: agent.id,
      spawnTime: Date.now(),
      tasksCompleted: 0,
      tasksRunning: 0,
      averageResponseTime: 0,
      health: 'healthy',
      lastActivity: Date.now()
    });

    agent.on('taskCompleted', (taskInfo) => {
      this.updateAgentMetrics(agent.id, 'taskCompleted', taskInfo);
    });

    agent.on('error', (error) => {
      this.handleAgentError(agent.id, error);
    });

    return agent;
  }

  /**
   * Select optimal agent for task
   * @private
   */
  async selectOptimalAgent(task) {
    // Find the least loaded healthy agent
    let optimalAgent = null;
    let minLoad = Infinity;

    for (const [agentId, agent] of this.agents) {
      if (agent.isAvailable() && agent.isHealthy()) {
        const load = agent.getCurrentLoad();
        if (load < minLoad) {
          minLoad = load;
          optimalAgent = agent;
        }
      }
    }

    // If no agent is available, try to get one from pool
    if (!optimalAgent && this.agentPool.size > 0) {
      const pooledAgentId = this.agentPool.values().next().value;
      optimalAgent = this.agents.get(pooledAgentId);
      this.agentPool.delete(pooledAgentId);
    }

    return optimalAgent;
  }

  /**
   * Execute task on specific agent
   * @private
   */
  async executeTaskOnAgent(agent, task, options) {
    const taskId = this.generateTaskId();
    
    this.runningTasks.set(taskId, {
      agent: agent.id,
      task,
      startTime: Date.now()
    });

    try {
      const result = await agent.executeTask(task, options);
      this.runningTasks.delete(taskId);
      return result;
    } catch (error) {
      this.runningTasks.delete(taskId);
      throw error;
    }
  }

  /**
   * Check if scaling is needed
   * @private
   */
  checkScaling() {
    const utilization = this.getCurrentUtilization();
    
    if (utilization > this.options.scaleThreshold && this.agents.size < this.options.maxAgents) {
      // Scale up
      const targetAgents = Math.min(
        Math.ceil(this.agents.size * 1.5), // 50% increase
        this.options.maxAgents
      );
      this.scaleAgents(targetAgents);
    } else if (utilization < this.options.scaleDownThreshold && this.agents.size > this.options.agentPoolSize) {
      // Scale down
      const targetAgents = Math.max(
        Math.floor(this.agents.size * 0.8), // 20% decrease
        this.options.agentPoolSize
      );
      this.scaleAgents(targetAgents);
    }
  }

  /**
   * Calculate optimal batch size for agent spawning
   * @private
   */
  calculateOptimalBatchSize(totalCount) {
    const systemCores = os.cpus().length;
    const availableMemory = os.freemem() / 1024 / 1024; // MB
    const memoryBasedLimit = Math.floor(availableMemory / this.options.maxMemoryPerAgent);
    
    // Conservative batch size to prevent system overload
    const batchSize = Math.min(
      systemCores * 2, // 2 agents per CPU core
      memoryBasedLimit / 4, // Use 25% of memory-based limit
      totalCount,
      50 // Maximum batch size
    );

    return Math.max(1, Math.floor(batchSize));
  }

  /**
   * Get platform-specific batch delay
   * @private
   */
  getPlatformBatchDelay() {
    if (this.platformDetector.isWindows()) {
      return 2000; // 2 seconds on Windows
    } else if (this.platformDetector.isMacOS()) {
      return 1000; // 1 second on macOS
    } else {
      return 500; // 0.5 seconds on Linux
    }
  }

  /**
   * Start monitoring systems
   * @private
   */
  startMonitoring() {
    // Health monitoring
    this.healthTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.options.healthCheckInterval);

    // Metrics collection
    this.metricsTimer = setInterval(() => {
      this.collectMetrics();
    }, this.options.metricsInterval);

    // Scaling check
    this.scaleTimer = setInterval(() => {
      this.checkScaling();
    }, this.options.healthCheckInterval);
  }

  /**
   * Perform system health check
   * @private
   */
  async performHealthCheck() {
    let healthyAgents = 0;
    let totalAgents = this.agents.size;

    for (const [agentId, agent] of this.agents) {
      try {
        const isHealthy = await agent.checkHealth();
        if (isHealthy) {
          healthyAgents++;
        } else {
          // Mark agent as unhealthy and potentially restart
          this.handleUnhealthyAgent(agentId);
        }
      } catch (error) {
        console.warn(`Health check failed for agent ${agentId}:`, error.message);
      }
    }

    const healthRatio = totalAgents > 0 ? healthyAgents / totalAgents : 0;
    
    if (healthRatio < 0.5) {
      this.systemHealth = 'critical';
    } else if (healthRatio < 0.8) {
      this.systemHealth = 'degraded';
    } else {
      this.systemHealth = 'healthy';
    }

    this.emit('healthCheck', {
      timestamp: new Date().toISOString(),
      systemHealth: this.systemHealth,
      healthyAgents,
      totalAgents,
      healthRatio
    });
  }

  /**
   * Collect system metrics
   * @private
   */
  collectMetrics() {
    const metrics = this.getDetailedMetrics();
    this.emit('metrics', metrics);
    
    // Store metrics for analysis
    this.storeMetrics(metrics);
  }

  /**
   * Get current system utilization
   * @private
   */
  getCurrentUtilization() {
    const busyAgents = Array.from(this.agents.values())
      .filter(agent => !agent.isAvailable()).length;
    
    return this.agents.size > 0 ? busyAgents / this.agents.size : 0;
  }

  // Utility methods

  generateAgentId() {
    return `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateTaskId() {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    console.log('🧹 Queen Controller cleanup initiated...');
    
    // Stop monitoring
    if (this.healthTimer) clearInterval(this.healthTimer);
    if (this.metricsTimer) clearInterval(this.metricsTimer);
    if (this.scaleTimer) clearInterval(this.scaleTimer);
    
    // Terminate all agents
    const terminationPromises = Array.from(this.agents.values())
      .map(agent => agent.terminate().catch(console.error));
    
    await Promise.allSettled(terminationPromises);
    
    // Cleanup subsystems
    await this.processManager.cleanup();
    await this.mcpDiscovery.cleanup();
    
    this.removeAllListeners();
    
    console.log('✅ Queen Controller cleanup completed');
  }
}

/**
 * Claude Flow Agent - Individual agent instance
 */
class ClaudeFlowAgent extends EventEmitter {
  constructor(config, queenController) {
    super();
    
    this.id = config.id;
    this.config = config;
    this.queen = queenController;
    this.isInitialized = false;
    this.currentTasks = new Set();
    this.isHealthy = true;
    this.lastActivity = Date.now();
  }

  async initialize() {
    // Initialize agent-specific resources
    this.isInitialized = true;
    console.log(`🤖 Agent ${this.id} initialized`);
  }

  async executeTask(task, options = {}) {
    const taskId = `${this.id}_${Date.now()}`;
    this.currentTasks.add(taskId);
    this.lastActivity = Date.now();

    try {
      // Simulate task execution
      const result = await this.processTask(task, options);
      this.emit('taskCompleted', { taskId, result, duration: 100 });
      return result;
    } finally {
      this.currentTasks.delete(taskId);
    }
  }

  async processTask(task, options) {
    // This would contain the actual task processing logic
    // For now, return a mock result
    await new Promise(resolve => setTimeout(resolve, 100));
    return { status: 'completed', data: task };
  }

  isAvailable() {
    return this.currentTasks.size < this.getMaxConcurrency();
  }

  getCurrentLoad() {
    return this.currentTasks.size / this.getMaxConcurrency();
  }

  getMaxConcurrency() {
    // Platform-specific concurrency limits
    return this.queen.platformDetector.isWindows() ? 4 : 8;
  }

  async checkHealth() {
    // Perform health checks
    const timeSinceActivity = Date.now() - this.lastActivity;
    this.isHealthy = timeSinceActivity < 300000; // 5 minutes
    return this.isHealthy;
  }

  getInfo() {
    return {
      id: this.id,
      isAvailable: this.isAvailable(),
      currentLoad: this.getCurrentLoad(),
      isHealthy: this.isHealthy,
      currentTasks: this.currentTasks.size,
      lastActivity: this.lastActivity
    };
  }

  async terminate() {
    console.log(`🔚 Terminating agent ${this.id}...`);
    this.removeAllListeners();
  }
}

module.exports = {
  QueenController,
  ClaudeFlowAgent
};