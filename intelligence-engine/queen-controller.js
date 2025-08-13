/**
 * Queen Controller - Hierarchical Sub-Agent Architecture
 * 
 * This is the master controller for managing multiple sub-agents with independent 
 * context windows. It orchestrates task distribution, monitors agent health,
 * and aggregates results from concurrent agent operations.
 * 
 * Features:
 * - Manages up to 10 concurrent sub-agents
 * - Tracks 200k token context windows per agent
 * - Handles inter-agent communication
 * - Provides shared memory for cross-agent data
 * - Monitors resource usage and performance
 */

const EventEmitter = require('events');
const path = require('path');
const fs = require('fs').promises;

class QueenController extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Core configuration
    this.maxConcurrent = options.maxConcurrent || 10;
    this.contextWindowSize = options.contextWindowSize || 200000; // 200k tokens
    this.projectRoot = options.projectRoot || process.cwd();
    
    // Agent management
    this.subAgents = new Map();
    this.activeAgents = new Set();
    this.taskQueue = [];
    this.pendingTasks = new Map();
    this.completedTasks = new Map();
    
    // Enhanced shared memory with SharedMemoryStore integration
    this.sharedMemoryStore = options.sharedMemory || null;
    
    // Legacy in-memory storage (for backward compatibility)
    this.sharedMemory = new Map();
    this.sharedMemory.set('global_context', {});
    this.sharedMemory.set('agent_results', new Map());
    this.sharedMemory.set('dependencies', new Map());
    
    // Performance tracking
    this.metrics = {
      agentsSpawned: 0,
      tasksDistributed: 0,
      tasksCompleted: 0,
      averageCompletionTime: 0,
      contextUsage: new Map(),
      errors: []
    };
    
    // Agent type registry
    this.agentTypes = new Map([
      ['code-analyzer', { template: 'code-analyzer-agent.md', capabilities: ['analysis', 'pattern-detection'] }],
      ['test-runner', { template: 'test-runner-agent.md', capabilities: ['testing', 'validation'] }],
      ['doc-generator', { template: 'doc-generator-agent.md', capabilities: ['documentation', 'markdown'] }],
      ['api-builder', { template: 'api-builder-agent.md', capabilities: ['api', 'endpoints'] }],
      ['database-architect', { template: 'database-architect-agent.md', capabilities: ['database', 'schema'] }],
      ['security-scanner', { template: 'security-scanner-agent.md', capabilities: ['security', 'audit'] }],
      ['performance-optimizer', { template: 'performance-optimizer-agent.md', capabilities: ['performance', 'optimization'] }],
      ['deployment-engineer', { template: 'deployment-engineer-agent.md', capabilities: ['deployment', 'ci-cd'] }],
      ['frontend-specialist', { template: 'frontend-specialist-agent.md', capabilities: ['frontend', 'ui'] }],
      ['recovery-specialist', { template: 'recovery-specialist-agent.md', capabilities: ['recovery', 'fixes'] }]
    ]);
    
    // Initialize monitoring
    this.startMonitoring();
  }
  
  /**
   * Spawn a new sub-agent with specific type and context
   * @param {string} type - Agent type from registry
   * @param {object} task - Task to assign to agent
   * @param {object} context - Initial context for agent
   */
  async spawnSubAgent(type, task, context = {}) {
    // Check concurrent limit
    if (this.activeAgents.size >= this.maxConcurrent) {
      this.emit('queue-full', { 
        active: this.activeAgents.size, 
        max: this.maxConcurrent,
        queued: this.taskQueue.length 
      });
      
      // Queue the task for later
      this.taskQueue.push({ type, task, context });
      return null;
    }
    
    // Generate unique agent ID
    const agentId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Get agent configuration
    const agentConfig = this.agentTypes.get(type);
    if (!agentConfig) {
      throw new Error(`Unknown agent type: ${type}`);
    }
    
    // Create agent instance
    const agent = {
      id: agentId,
      type: type,
      task: task,
      context: {
        ...context,
        sharedMemory: await this.getSharedContext(),
        sharedMemoryStore: this.sharedMemoryStore,
        projectRoot: this.projectRoot,
        queenId: this.id,
        maxTokens: this.contextWindowSize
      },
      status: 'initializing',
      startTime: Date.now(),
      tokenUsage: 0,
      capabilities: agentConfig.capabilities,
      template: agentConfig.template
    };
    
    // Register agent
    this.subAgents.set(agentId, agent);
    this.activeAgents.add(agentId);
    
    // Update metrics
    this.metrics.agentsSpawned++;
    this.metrics.contextUsage.set(agentId, 0);
    
    // Emit spawn event
    this.emit('agent-spawned', {
      agentId,
      type,
      task: task.id || task.name,
      timestamp: Date.now()
    });
    
    // Initialize agent (simulate async spawn)
    await this.initializeAgent(agent);
    
    return agentId;
  }
  
  /**
   * Initialize a spawned agent
   */
  async initializeAgent(agent) {
    agent.status = 'active';
    
    // Load agent template if exists
    const templatePath = path.join(this.projectRoot, '.claude/agents', agent.template);
    try {
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      agent.instructions = templateContent;
    } catch (error) {
      // Template doesn't exist yet, will be created in Phase 2
      agent.instructions = this.generateDefaultInstructions(agent.type);
    }
    
    this.emit('agent-ready', {
      agentId: agent.id,
      type: agent.type
    });
  }
  
  /**
   * Distribute a task to appropriate agents with dependency management
   * @param {object} task - Task to distribute
   * @param {array} dependencies - Task dependencies
   */
  async distributeTask(task, dependencies = []) {
    // Validate dependencies are complete
    for (const dep of dependencies) {
      if (!this.completedTasks.has(dep)) {
        this.pendingTasks.set(task.id, { task, dependencies });
        this.emit('task-pending', { 
          taskId: task.id, 
          waitingFor: dependencies.filter(d => !this.completedTasks.has(d))
        });
        return null;
      }
    }
    
    // Determine best agent type for task
    const agentType = this.selectAgentType(task);
    
    // Gather dependency results as context
    const dependencyContext = {};
    for (const dep of dependencies) {
      const result = this.completedTasks.get(dep);
      if (result) {
        dependencyContext[dep] = result;
      }
    }
    
    // Spawn agent for task
    const agentId = await this.spawnSubAgent(agentType, task, {
      dependencies: dependencyContext,
      taskMetadata: {
        priority: task.priority || 'normal',
        estimatedTokens: task.estimatedTokens || 50000,
        timeout: task.timeout || 300000 // 5 minutes default
      }
    });
    
    if (agentId) {
      this.metrics.tasksDistributed++;
      this.emit('task-distributed', {
        taskId: task.id,
        agentId,
        agentType
      });
    }
    
    return agentId;
  }
  
  /**
   * Monitor active agents and handle lifecycle
   */
  async monitorAgents() {
    const monitoring = [];
    
    for (const agentId of this.activeAgents) {
      const agent = this.subAgents.get(agentId);
      if (!agent) continue;
      
      // Check agent health
      const health = await this.checkAgentHealth(agent);
      
      if (health.status === 'completed') {
        await this.handleAgentCompletion(agent);
      } else if (health.status === 'error') {
        await this.handleAgentError(agent, health.error);
      } else if (health.tokenUsage > this.contextWindowSize * 0.9) {
        // Agent approaching context limit
        this.emit('agent-context-warning', {
          agentId,
          usage: health.tokenUsage,
          limit: this.contextWindowSize
        });
      }
      
      monitoring.push({
        agentId,
        type: agent.type,
        status: health.status,
        tokenUsage: health.tokenUsage,
        runtime: Date.now() - agent.startTime
      });
    }
    
    return monitoring;
  }
  
  /**
   * Check health status of an agent
   */
  async checkAgentHealth(agent) {
    // Simulate health check - in production would check actual process
    const health = {
      status: agent.status,
      tokenUsage: agent.tokenUsage,
      memory: process.memoryUsage().heapUsed,
      runtime: Date.now() - agent.startTime
    };
    
    // Update token usage tracking
    this.metrics.contextUsage.set(agent.id, health.tokenUsage);
    
    return health;
  }
  
  /**
   * Aggregate results from multiple agents
   * @param {array} agentIds - IDs of agents to aggregate from
   */
  async aggregateResults(agentIds = []) {
    const results = new Map();
    const targetAgents = agentIds.length > 0 ? agentIds : Array.from(this.activeAgents);
    
    for (const agentId of targetAgents) {
      const agent = this.subAgents.get(agentId);
      if (!agent) continue;
      
      // Get results from shared memory
      const agentResults = this.sharedMemory.get('agent_results').get(agentId);
      if (agentResults) {
        results.set(agentId, {
          type: agent.type,
          task: agent.task,
          results: agentResults,
          metrics: {
            tokenUsage: agent.tokenUsage,
            runtime: Date.now() - agent.startTime,
            status: agent.status
          }
        });
      }
    }
    
    // Combine results by type
    const aggregated = {
      byType: new Map(),
      byTask: new Map(),
      overall: {
        totalAgents: results.size,
        successCount: 0,
        errorCount: 0,
        totalTokens: 0,
        averageRuntime: 0
      }
    };
    
    let totalRuntime = 0;
    for (const [agentId, data] of results) {
      // Group by type
      if (!aggregated.byType.has(data.type)) {
        aggregated.byType.set(data.type, []);
      }
      aggregated.byType.get(data.type).push(data);
      
      // Group by task
      const taskId = data.task.id || data.task.name;
      aggregated.byTask.set(taskId, data);
      
      // Update overall metrics
      if (data.metrics.status === 'completed') {
        aggregated.overall.successCount++;
      } else if (data.metrics.status === 'error') {
        aggregated.overall.errorCount++;
      }
      aggregated.overall.totalTokens += data.metrics.tokenUsage;
      totalRuntime += data.metrics.runtime;
    }
    
    aggregated.overall.averageRuntime = totalRuntime / results.size || 0;
    
    return aggregated;
  }
  
  /**
   * Handle inter-agent communication
   * @param {string} fromAgent - Source agent ID
   * @param {string} toAgent - Target agent ID (or 'broadcast')
   * @param {object} message - Message to send
   */
  async handleInterAgentCommunication(fromAgent, toAgent, message) {
    const timestamp = Date.now();
    
    // Validate source agent
    if (!this.subAgents.has(fromAgent)) {
      throw new Error(`Unknown source agent: ${fromAgent}`);
    }
    
    // Create message envelope
    const envelope = {
      id: `msg-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
      from: fromAgent,
      to: toAgent,
      timestamp,
      type: message.type || 'data',
      payload: message.payload || message,
      routing: message.routing || 'direct'
    };
    
    // Handle broadcast
    if (toAgent === 'broadcast' || toAgent === '*') {
      for (const agentId of this.activeAgents) {
        if (agentId !== fromAgent) {
          await this.deliverMessage(agentId, envelope);
        }
      }
      this.emit('message-broadcast', envelope);
    } 
    // Handle targeted message
    else if (this.subAgents.has(toAgent)) {
      await this.deliverMessage(toAgent, envelope);
      this.emit('message-sent', envelope);
    }
    // Handle unknown target
    else {
      this.emit('message-failed', { 
        ...envelope, 
        error: `Unknown target agent: ${toAgent}` 
      });
      return false;
    }
    
    // Store in shared memory for persistence
    const messageHistory = this.sharedMemory.get('message_history') || [];
    messageHistory.push(envelope);
    this.sharedMemory.set('message_history', messageHistory);
    
    return true;
  }
  
  /**
   * Deliver message to specific agent
   */
  async deliverMessage(agentId, message) {
    const agent = this.subAgents.get(agentId);
    if (!agent) return;
    
    // Add to agent's message queue
    if (!agent.messageQueue) {
      agent.messageQueue = [];
    }
    agent.messageQueue.push(message);
    
    // Update agent context with new message
    agent.context.latestMessage = message;
    
    this.emit('message-delivered', {
      agentId,
      messageId: message.id
    });
  }
  
  /**
   * Handle agent completion
   */
  async handleAgentCompletion(agent) {
    const agentId = agent.id;
    
    // Get agent results
    const results = this.sharedMemory.get('agent_results').get(agentId) || {};
    
    // Mark task as completed
    if (agent.task && agent.task.id) {
      this.completedTasks.set(agent.task.id, results);
      this.metrics.tasksCompleted++;
    }
    
    // Calculate average completion time
    const runtime = Date.now() - agent.startTime;
    this.metrics.averageCompletionTime = 
      (this.metrics.averageCompletionTime * (this.metrics.tasksCompleted - 1) + runtime) / 
      this.metrics.tasksCompleted;
    
    // Clean up agent
    this.activeAgents.delete(agentId);
    agent.status = 'completed';
    agent.endTime = Date.now();
    
    this.emit('agent-completed', {
      agentId,
      type: agent.type,
      runtime,
      tokenUsage: agent.tokenUsage,
      results
    });
    
    // Check for pending tasks that can now run
    await this.processPendingTasks();
    
    // Process queued tasks if any
    if (this.taskQueue.length > 0 && this.activeAgents.size < this.maxConcurrent) {
      const queued = this.taskQueue.shift();
      await this.spawnSubAgent(queued.type, queued.task, queued.context);
    }
  }
  
  /**
   * Handle agent errors
   */
  async handleAgentError(agent, error) {
    const agentId = agent.id;
    
    // Log error
    this.metrics.errors.push({
      agentId,
      type: agent.type,
      error: error.message || error,
      timestamp: Date.now()
    });
    
    // Update agent status
    agent.status = 'error';
    agent.error = error;
    agent.endTime = Date.now();
    
    // Clean up
    this.activeAgents.delete(agentId);
    
    this.emit('agent-error', {
      agentId,
      type: agent.type,
      error,
      task: agent.task
    });
    
    // Attempt recovery
    if (agent.task && agent.task.retryOnError) {
      await this.retryTask(agent.task, agent.type);
    }
  }
  
  /**
   * Process pending tasks that were waiting on dependencies
   */
  async processPendingTasks() {
    for (const [taskId, pending] of this.pendingTasks) {
      const { task, dependencies } = pending;
      
      // Check if all dependencies are now complete
      const allComplete = dependencies.every(dep => this.completedTasks.has(dep));
      
      if (allComplete) {
        this.pendingTasks.delete(taskId);
        await this.distributeTask(task, dependencies);
      }
    }
  }
  
  /**
   * Retry a failed task
   */
  async retryTask(task, agentType) {
    task.retryCount = (task.retryCount || 0) + 1;
    
    if (task.retryCount <= 3) {
      this.emit('task-retry', {
        taskId: task.id,
        attempt: task.retryCount
      });
      
      // Add back to queue with delay
      setTimeout(() => {
        this.taskQueue.push({
          type: agentType,
          task,
          context: { isRetry: true, attempt: task.retryCount }
        });
      }, 5000 * task.retryCount); // Exponential backoff
    } else {
      this.emit('task-failed', {
        taskId: task.id,
        reason: 'Max retries exceeded'
      });
    }
  }
  
  /**
   * Select appropriate agent type for a task
   */
  selectAgentType(task) {
    // Task type mapping
    const typeMapping = {
      'analysis': 'code-analyzer',
      'testing': 'test-runner',
      'documentation': 'doc-generator',
      'api': 'api-builder',
      'database': 'database-architect',
      'security': 'security-scanner',
      'performance': 'performance-optimizer',
      'deployment': 'deployment-engineer',
      'frontend': 'frontend-specialist',
      'recovery': 'recovery-specialist'
    };
    
    // Check explicit type
    if (task.agentType) {
      return task.agentType;
    }
    
    // Check task category
    if (task.category && typeMapping[task.category]) {
      return typeMapping[task.category];
    }
    
    // Analyze task description for keywords
    const description = (task.description || task.name || '').toLowerCase();
    for (const [keyword, type] of Object.entries(typeMapping)) {
      if (description.includes(keyword)) {
        return type;
      }
    }
    
    // Default to code analyzer
    return 'code-analyzer';
  }
  
  /**
   * Get shared context for agents (enhanced with SharedMemoryStore)
   */
  async getSharedContext() {
    const baseContext = {
      globalContext: this.sharedMemory.get('global_context'),
      completedTasks: Array.from(this.completedTasks.keys()),
      activeAgents: Array.from(this.activeAgents),
      projectMetadata: {
        root: this.projectRoot,
        timestamp: Date.now()
      }
    };

    // Enhance with SharedMemoryStore data if available
    if (this.sharedMemoryStore) {
      try {
        const memoryStats = this.sharedMemoryStore.getStats();
        
        baseContext.sharedMemoryStore = {
          available: true,
          stats: memoryStats,
          namespaces: this.sharedMemoryStore.namespaces,
          dataTypes: this.sharedMemoryStore.dataTypes
        };
        
        // Get cross-agent data
        const crossAgentKeys = await this.sharedMemoryStore.keys({
          namespace: this.sharedMemoryStore.namespaces.CROSS_AGENT
        });
        
        baseContext.crossAgentData = crossAgentKeys;
        
      } catch (error) {
        console.warn('Failed to get enhanced shared context:', error.message);
        baseContext.sharedMemoryStore = { available: false, error: error.message };
      }
    } else {
      baseContext.sharedMemoryStore = { available: false, reason: 'not_configured' };
    }

    return baseContext;
  }
  
  /**
   * Generate default instructions for agent types
   */
  generateDefaultInstructions(type) {
    const defaults = {
      'code-analyzer': 'Analyze code structure, patterns, and quality.',
      'test-runner': 'Execute tests and validate functionality.',
      'doc-generator': 'Generate documentation and markdown files.',
      'api-builder': 'Build and configure API endpoints.',
      'database-architect': 'Design database schemas and queries.',
      'security-scanner': 'Scan for security vulnerabilities.',
      'performance-optimizer': 'Optimize performance and efficiency.',
      'deployment-engineer': 'Handle deployment and CI/CD.',
      'frontend-specialist': 'Build frontend components and UI.',
      'recovery-specialist': 'Recover from errors and fix issues.'
    };
    
    return defaults[type] || 'Perform assigned tasks efficiently.';
  }
  
  /**
   * Start monitoring loop
   */
  startMonitoring() {
    this.monitoringInterval = setInterval(async () => {
      const status = await this.monitorAgents();
      this.emit('monitoring-update', status);
    }, 5000); // Monitor every 5 seconds
  }
  
  /**
   * Terminate an agent
   */
  async terminateAgent(agentId, reason = 'manual') {
    const agent = this.subAgents.get(agentId);
    if (!agent) return false;
    
    // Clean up
    this.activeAgents.delete(agentId);
    agent.status = 'terminated';
    agent.endTime = Date.now();
    agent.terminationReason = reason;
    
    this.emit('agent-terminated', {
      agentId,
      type: agent.type,
      reason
    });
    
    // Process any queued tasks
    if (this.taskQueue.length > 0 && this.activeAgents.size < this.maxConcurrent) {
      const queued = this.taskQueue.shift();
      await this.spawnSubAgent(queued.type, queued.task, queued.context);
    }
    
    return true;
  }
  
  /**
   * Shutdown Queen Controller
   */
  async shutdown() {
    // Stop monitoring
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    // Terminate all active agents
    for (const agentId of this.activeAgents) {
      await this.terminateAgent(agentId, 'shutdown');
    }
    
    // Save metrics
    const metricsPath = path.join(this.projectRoot, '.hive-mind', 'queen-metrics.json');
    try {
      await fs.writeFile(metricsPath, JSON.stringify(this.metrics, null, 2));
    } catch (error) {
      console.error('Failed to save metrics:', error);
    }
    
    this.emit('shutdown-complete');
  }
  
  /**
   * Get current status
   */
  getStatus() {
    return {
      active: this.activeAgents.size,
      queued: this.taskQueue.length,
      pending: this.pendingTasks.size,
      completed: this.completedTasks.size,
      maxConcurrent: this.maxConcurrent,
      metrics: this.metrics,
      agents: Array.from(this.subAgents.values()).map(agent => ({
        id: agent.id,
        type: agent.type,
        status: agent.status,
        tokenUsage: agent.tokenUsage,
        runtime: agent.endTime ? agent.endTime - agent.startTime : Date.now() - agent.startTime
      }))
    };
  }
}

module.exports = QueenController;