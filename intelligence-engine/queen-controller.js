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
const { NeuralLearningSystem } = require('./neural-learning');

class QueenController extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Core configuration
    this.maxConcurrent = options.maxConcurrent || 10;
    this.contextWindowSize = options.contextWindowSize || 200000; // 200k tokens
    this.projectRoot = options.projectRoot || process.cwd();
    
    // Neural Learning System integration
    this.neuralLearning = new NeuralLearningSystem({
      persistencePath: path.join(this.projectRoot, '.hive-mind', 'neural-data'),
      autoSave: true,
      saveInterval: 300000, // 5 minutes
      learningRate: 0.001
    });
    
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
    
    // Initialize neural learning system
    this.initializeNeuralLearning();
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
   * Distribute a task to appropriate agents with dependency management and neural predictions - FIXED: Enhanced load balancing
   * @param {object} task - Task to distribute
   * @param {array} dependencies - Task dependencies
   */
  async distributeTask(task, dependencies = []) {
    try {
      // Validate task input
      if (!task || !task.id) {
        throw new Error('Task must have a valid ID');
      }
      
      // Validate dependencies are complete
      for (const dep of dependencies) {
        if (!this.completedTasks.has(dep)) {
          this.pendingTasks.set(task.id, { task, dependencies });
          this.emit('task-pending', { 
            taskId: task.id, 
            waitingFor: dependencies.filter(d => !this.completedTasks.has(d))
          });
          console.log(`QUEEN CONTROLLER FIX: Task ${task.id} waiting for dependencies: ${dependencies.filter(d => !this.completedTasks.has(d)).join(', ')}`);
          return null;
        }
      }
      
      // Check if we're at the concurrent agent limit
      if (this.activeAgents.size >= this.maxConcurrent) {
        // Queue the task for later
        this.taskQueue.push({ 
          task, 
          dependencies, 
          queuedAt: Date.now(),
          priority: task.priority || 'normal'
        });
        
        this.emit('task-queued', {
          taskId: task.id,
          queuePosition: this.taskQueue.length,
          activeAgents: this.activeAgents.size,
          maxConcurrent: this.maxConcurrent
        });
        
        console.log(`QUEEN CONTROLLER FIX: Task ${task.id} queued - ${this.activeAgents.size}/${this.maxConcurrent} agents active`);
        return null;
      }
      
      // Use neural learning to select optimal agent type with load balancing
      const agentSelection = await this.selectOptimalAgentWithLoadBalancing(task);
      const agentType = agentSelection.agentType;
      
      // Gather dependency results as context
      const dependencyContext = {};
      for (const dep of dependencies) {
        const result = this.completedTasks.get(dep);
        if (result) {
          dependencyContext[dep] = result;
        }
      }
      
      // Spawn agent for task with neural predictions and load balancing
      const agentId = await this.spawnSubAgent(agentType, task, {
        dependencies: dependencyContext,
        taskMetadata: {
          priority: task.priority || 'normal',
          estimatedTokens: task.estimatedTokens || 50000,
          timeout: task.timeout || 300000, // 5 minutes default
          distributedAt: Date.now(),
          loadBalancingScore: agentSelection.loadBalancingScore
        },
        neuralPredictions: agentSelection.prediction,
        selectionReasoning: agentSelection.reasoning,
        loadBalancing: agentSelection.loadBalancing
      });
      
      if (agentId) {
        this.metrics.tasksDistributed++;
        this.emit('task-distributed', {
          taskId: task.id,
          agentId,
          agentType,
          loadBalancingScore: agentSelection.loadBalancingScore,
          activeAgents: this.activeAgents.size,
          timestamp: Date.now()
        });
        
        console.log(`QUEEN CONTROLLER FIX: Task ${task.id} distributed to ${agentId} (${agentType}) with load balancing score ${agentSelection.loadBalancingScore}`);
      }
      
      return agentId;
      
    } catch (error) {
      console.error(`QUEEN CONTROLLER FIX: Task distribution failed for ${task.id}:`, error.message);
      this.emit('task-distribution-error', {
        taskId: task.id,
        error: error.message,
        timestamp: Date.now()
      });
      return null;
    }
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
   * Handle inter-agent communication - FIXED: Enhanced validation and error handling
   * @param {string} fromAgent - Source agent ID
   * @param {string} toAgent - Target agent ID (or 'broadcast')
   * @param {object} message - Message to send
   */
  async handleInterAgentCommunication(fromAgent, toAgent, message) {
    const timestamp = Date.now();
    
    try {
      // Enhanced source agent validation
      if (!fromAgent || (fromAgent !== 'system' && fromAgent !== 'queen-controller' && !this.subAgents.has(fromAgent))) {
        throw new Error(`Invalid source agent: ${fromAgent}`);
      }
      
      // Create message envelope with enhanced metadata
      const envelope = {
        id: `msg-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
        from: fromAgent,
        to: toAgent,
        timestamp,
        type: message.type || 'data',
        payload: message.payload || message,
        routing: message.routing || 'direct',
        priority: message.priority || 'normal',
        requiresResponse: message.requiresResponse || false,
        timeout: message.timeout || 30000
      };
      
      // Handle broadcast with improved error handling
      if (toAgent === 'broadcast' || toAgent === '*' || toAgent === 'all') {
        return await this.handleBroadcastCommunication(envelope);
      } 
      // Handle targeted message with validation
      else if (this.subAgents.has(toAgent)) {
        const targetAgent = this.subAgents.get(toAgent);
        
        // Check if target agent is active and healthy
        if (targetAgent.status !== 'active') {
          console.warn(`QUEEN CONTROLLER FIX: Target agent ${toAgent} is not active (status: ${targetAgent.status})`);
          this.emit('message-failed', { 
            ...envelope, 
            error: `Target agent ${toAgent} is not active`,
            targetStatus: targetAgent.status
          });
          return false;
        }
        
        await this.deliverMessage(toAgent, envelope);
        this.emit('message-sent', envelope);
      }
      // Handle unknown target with suggestion
      else {
        // Try to find similar agent IDs for helpful error message
        const similarAgents = Array.from(this.subAgents.keys())
          .filter(id => id.includes(toAgent) || toAgent.includes(id))
          .slice(0, 3);
        
        const errorMsg = `Unknown target agent: ${toAgent}` + 
          (similarAgents.length > 0 ? `. Did you mean: ${similarAgents.join(', ')}?` : '');
        
        this.emit('message-failed', { 
          ...envelope, 
          error: errorMsg,
          suggestedAgents: similarAgents
        });
        
        console.error(`QUEEN CONTROLLER FIX: ${errorMsg}`);
        return false;
      }
      
      // Store in shared memory for persistence with TTL
      if (this.sharedMemoryStore) {
        await this.sharedMemoryStore.set(`message_${envelope.id}`, envelope, {
          namespace: this.sharedMemoryStore.namespaces.CROSS_AGENT,
          ttl: 3600000 // 1 hour
        });
      } else {
        // Fallback to in-memory storage
        const messageHistory = this.sharedMemory.get('message_history') || [];
        messageHistory.push(envelope);
        // Keep only recent messages to prevent memory bloat
        if (messageHistory.length > 1000) {
          messageHistory.splice(0, messageHistory.length - 1000);
        }
        this.sharedMemory.set('message_history', messageHistory);
      }
      
      return true;
      
    } catch (error) {
      console.error('QUEEN CONTROLLER FIX: Inter-agent communication failed:', error.message);
      this.emit('communication-error', {
        fromAgent,
        toAgent,
        error: error.message,
        timestamp
      });
      return false;
    }
  }
  
  /**
   * Handle broadcast communication with load balancing - NEW FIX
   */
  async handleBroadcastCommunication(envelope) {
    const startTime = Date.now();
    const deliveryResults = [];
    
    try {
      // Get active agents excluding sender
      const targetAgents = Array.from(this.activeAgents)
        .filter(agentId => agentId !== envelope.from);
      
      if (targetAgents.length === 0) {
        console.warn('QUEEN CONTROLLER FIX: No target agents available for broadcast');
        this.emit('message-broadcast', { 
          ...envelope, 
          targetCount: 0,
          deliveredCount: 0,
          warning: 'No target agents available'
        });
        return true;
      }
      
      console.log(`QUEEN CONTROLLER FIX: Broadcasting to ${targetAgents.length} agents`);
      
      // Deliver to agents in parallel batches to avoid overwhelming the system
      const batchSize = 5; // Process 5 agents at a time
      const batches = [];
      
      for (let i = 0; i < targetAgents.length; i += batchSize) {
        batches.push(targetAgents.slice(i, i + batchSize));
      }
      
      for (const batch of batches) {
        const batchPromises = batch.map(async (agentId) => {
          try {
            await this.deliverMessage(agentId, envelope);
            return { agentId, success: true };
          } catch (error) {
            console.error(`QUEEN CONTROLLER FIX: Failed to deliver broadcast to ${agentId}:`, error.message);
            return { agentId, success: false, error: error.message };
          }
        });
        
        const batchResults = await Promise.allSettled(batchPromises);
        deliveryResults.push(...batchResults.map(result => 
          result.status === 'fulfilled' ? result.value : 
          { agentId: 'unknown', success: false, error: result.reason.message }
        ));
      }
      
      const successfulDeliveries = deliveryResults.filter(result => result.success);
      const failedDeliveries = deliveryResults.filter(result => !result.success);
      
      const broadcastTime = Date.now() - startTime;
      
      this.emit('message-broadcast', { 
        ...envelope,
        targetCount: targetAgents.length,
        deliveredCount: successfulDeliveries.length,
        failedCount: failedDeliveries.length,
        deliveryTime: broadcastTime,
        failedAgents: failedDeliveries
      });
      
      console.log(`QUEEN CONTROLLER FIX: Broadcast completed in ${broadcastTime}ms - ${successfulDeliveries.length}/${targetAgents.length} successful`);
      
      return true;
      
    } catch (error) {
      console.error('QUEEN CONTROLLER FIX: Broadcast communication failed:', error.message);
      this.emit('broadcast-error', {
        envelope,
        error: error.message,
        deliveryResults
      });
      return false;
    }
  }

  /**
   * Deliver message to specific agent - FIXED: Enhanced validation and queuing
   */
  async deliverMessage(agentId, message) {
    try {
      const agent = this.subAgents.get(agentId);
      if (!agent) {
        throw new Error(`Agent ${agentId} not found`);
      }
      
      // Check agent health before delivery
      if (agent.status !== 'active') {
        throw new Error(`Agent ${agentId} is not active (status: ${agent.status})`);
      }
      
      // Initialize message queue if it doesn't exist
      if (!agent.messageQueue) {
        agent.messageQueue = [];
      }
      
      // Check queue size to prevent overflow
      const maxQueueSize = 100;
      if (agent.messageQueue.length >= maxQueueSize) {
        console.warn(`QUEEN CONTROLLER FIX: Message queue full for agent ${agentId}, removing oldest message`);
        agent.messageQueue.shift(); // Remove oldest message
      }
      
      // Add message to queue with metadata
      const queuedMessage = {
        ...message,
        queuedAt: Date.now(),
        retryCount: message.retryCount || 0
      };
      
      agent.messageQueue.push(queuedMessage);
      
      // Update agent context with new message
      agent.context.latestMessage = message;
      agent.context.lastMessageTime = Date.now();
      
      // Update agent activity timestamp
      agent.lastActivity = Date.now();
      
      // Emit successful delivery
      this.emit('message-delivered', {
        agentId,
        messageId: message.id,
        queueSize: agent.messageQueue.length,
        timestamp: Date.now()
      });
      
      console.log(`QUEEN CONTROLLER FIX: Message ${message.id} delivered to agent ${agentId}`);
      
    } catch (error) {
      console.error(`QUEEN CONTROLLER FIX: Failed to deliver message to ${agentId}:`, error.message);
      this.emit('message-delivery-failed', {
        agentId,
        messageId: message.id,
        error: error.message,
        timestamp: Date.now()
      });
      throw error;
    }
  }
  
  /**
   * Handle agent completion with neural learning integration
   */
  async handleAgentCompletion(agent) {
    const agentId = agent.id;
    
    // Get agent results
    const results = this.sharedMemory.get('agent_results').get(agentId) || {};
    
    // Determine if task was successful
    const taskSuccess = results.success !== false && agent.status === 'completed';
    
    // Record task outcome for neural learning
    if (agent.task && agent.task.id) {
      const runtime = Date.now() - agent.startTime;
      
      const outcome = {
        success: taskSuccess,
        quality: results.quality || (taskSuccess ? 0.8 : 0.3),
        userRating: results.userRating || (taskSuccess ? 4 : 2),
        errors: results.errors || [],
        optimizationPotential: results.optimizationPotential || 0.5
      };

      const metrics = {
        duration: runtime,
        cpuUsage: 0.5, // Placeholder - in production, get from system
        memoryUsage: 0.4, // Placeholder
        userInteractions: results.userInteractions || 0
      };

      await this.recordTaskOutcome(agent.task.id, outcome, metrics);
      
      // Mark task as completed
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
   * Initialize Neural Learning System
   */
  async initializeNeuralLearning() {
    try {
      await this.neuralLearning.initialize();
      console.log('Neural Learning System initialized successfully in Queen Controller');
      
      // Share neural learning data with shared memory if available
      if (this.sharedMemoryStore) {
        const neuralStatus = this.neuralLearning.getSystemStatus();
        await this.sharedMemoryStore.set('neural_status', neuralStatus, {
          namespace: this.sharedMemoryStore.namespaces.CROSS_AGENT
        });
      }
      
      this.emit('neural-learning-ready', {
        status: 'initialized',
        wasmEnabled: this.neuralLearning.getSystemStatus().wasmEnabled
      });
      
    } catch (error) {
      console.error('Failed to initialize Neural Learning System:', error);
      this.emit('neural-learning-error', { error: error.message });
    }
  }

  /**
   * Select optimal agent using neural predictions
   * @param {object} task - Task to find the best agent for
   */
  async selectOptimalAgent(task) {
    try {
      // Get neural prediction for the task
      const prediction = await this.neuralLearning.predict({
        id: task.id,
        type: task.category || task.type,
        taskCount: 1,
        duration: task.estimatedDuration || 0,
        complexity: task.complexity || 5,
        projectSize: task.projectSize || 0,
        primaryLanguage: task.language || 'javascript',
        workflowType: task.category || 'general',
        projectType: task.projectType || 'web'
      });

      // Get available agent types based on task capabilities
      const candidateTypes = this.getAgentTypesForTask(task);
      
      // Score each agent type using neural predictions and current load
      let bestAgent = null;
      let bestScore = -1;

      for (const agentType of candidateTypes) {
        // Get current load for this agent type
        const activeAgentsOfType = Array.from(this.activeAgents)
          .filter(id => this.subAgents.get(id)?.type === agentType)
          .length;
        
        // Calculate load factor (prefer less loaded agent types)
        const loadFactor = Math.max(0, 1 - (activeAgentsOfType / 3)); // Normalize to 3 max per type
        
        // Combine neural success probability with load factor
        const score = prediction.successProbability * 0.7 + loadFactor * 0.3;
        
        if (score > bestScore) {
          bestScore = score;
          bestAgent = agentType;
        }
      }

      // Log the selection reasoning
      console.log(`Neural agent selection for task ${task.id}:`);
      console.log(`  Success probability: ${prediction.successProbability.toFixed(3)}`);
      console.log(`  Selected agent: ${bestAgent}`);
      console.log(`  Confidence: ${prediction.confidence.toFixed(3)}`);

      // Share selection data with neural system for future learning
      if (this.sharedMemoryStore) {
        await this.sharedMemoryStore.set(`task_selection_${task.id}`, {
          taskId: task.id,
          selectedAgent: bestAgent,
          prediction: prediction,
          timestamp: Date.now()
        }, {
          namespace: this.sharedMemoryStore.namespaces.TASKS
        });
      }

      return {
        agentType: bestAgent || this.selectAgentType(task),
        prediction: prediction,
        reasoning: {
          successProbability: prediction.successProbability,
          confidence: prediction.confidence,
          optimizations: prediction.optimizations,
          risks: prediction.riskFactors
        }
      };

    } catch (error) {
      console.error('Neural agent selection failed, falling back to traditional method:', error);
      return {
        agentType: this.selectAgentType(task),
        prediction: null,
        reasoning: { fallback: true, error: error.message }
      };
    }
  }

  /**
   * Get agent types suitable for a task based on capabilities
   */
  getAgentTypesForTask(task) {
    const taskKeywords = (task.description || task.name || '').toLowerCase();
    const suitableTypes = [];

    // Check each agent type's capabilities
    for (const [agentType, config] of this.agentTypes.entries()) {
      const capabilities = config.capabilities || [];
      
      // Check if agent capabilities match task requirements
      const hasMatchingCapability = capabilities.some(capability => 
        taskKeywords.includes(capability) || 
        task.requiredCapabilities?.includes(capability)
      );

      if (hasMatchingCapability) {
        suitableTypes.push(agentType);
      }
    }

    // If no specific matches, return all agent types
    return suitableTypes.length > 0 ? suitableTypes : Array.from(this.agentTypes.keys());
  }

  /**
   * Record task outcome and feed to neural learning system
   * @param {string} taskId - Task identifier
   * @param {object} outcome - Task execution outcome
   * @param {object} metrics - Performance metrics
   */
  async recordTaskOutcome(taskId, outcome, metrics) {
    try {
      const agent = Array.from(this.subAgents.values())
        .find(a => a.task?.id === taskId);

      if (!agent) {
        console.warn(`Cannot record outcome for unknown task: ${taskId}`);
        return;
      }

      // Prepare workflow data for neural learning
      const workflowData = {
        id: taskId,
        type: agent.task.category || agent.task.type || 'general',
        workflowType: agent.task.category || 'general',
        projectType: agent.task.projectType || 'web',
        taskCount: 1,
        duration: metrics.duration || (Date.now() - agent.startTime),
        complexity: agent.task.complexity || 5,
        userInteractions: metrics.userInteractions || 0,
        errorCount: outcome.errors?.length || 0,
        resourceUsage: metrics.cpuUsage || 0.5,
        projectSize: agent.task.projectSize || 0,
        primaryLanguage: agent.task.language || 'javascript',
        agentType: agent.type,
        estimatedTokens: agent.tokenUsage || 0,
        contextUsage: agent.tokenUsage / this.contextWindowSize
      };

      // Prepare outcome data
      const outcomeData = {
        success: outcome.success || false,
        duration: metrics.duration || (Date.now() - agent.startTime),
        quality: outcome.quality || (outcome.success ? 0.8 : 0.3),
        userRating: outcome.userRating || (outcome.success ? 4 : 2),
        errors: outcome.errors || [],
        resourceUsage: {
          cpu: metrics.cpuUsage || 0.5,
          memory: metrics.memoryUsage || 0.4
        },
        optimizationPotential: outcome.optimizationPotential || 0.5
      };

      // Learn from this workflow execution
      const learningResult = await this.neuralLearning.learn(workflowData, outcomeData);

      // Ensure learningResult has the expected structure
      if (!learningResult || !learningResult.pattern) {
        // Create a fallback pattern structure
        const fallbackPattern = {
          id: `pattern_${taskId}_${Date.now()}`,
          workflowType: workflowData.type,
          successRate: outcome.success ? 1.0 : 0.0,
          complexity: workflowData.complexity,
          agentType: workflowData.agentType,
          timestamp: Date.now()
        };
        
        return {
          pattern: fallbackPattern,
          success: true,
          fallback: true
        };
      }

      // Share learned patterns with other agents via shared memory
      if (this.sharedMemoryStore) {
        // Store the pattern for cross-agent access
        await this.sharedMemoryStore.set(`learned_pattern_${taskId}`, {
          workflowData,
          outcomeData,
          pattern: learningResult.pattern,
          timestamp: Date.now()
        }, {
          namespace: this.sharedMemoryStore.namespaces.CROSS_AGENT,
          ttl: 24 * 60 * 60 * 1000 // 24 hours
        });

        // Update global neural metrics
        const globalMetrics = await this.sharedMemoryStore.get('global_neural_metrics', {
          namespace: this.sharedMemoryStore.namespaces.CROSS_AGENT
        }) || { totalLearned: 0, successRate: 0, lastUpdate: 0 };

        globalMetrics.totalLearned++;
        globalMetrics.successRate = (globalMetrics.successRate * (globalMetrics.totalLearned - 1) + 
                                   (outcome.success ? 1 : 0)) / globalMetrics.totalLearned;
        globalMetrics.lastUpdate = Date.now();

        await this.sharedMemoryStore.set('global_neural_metrics', globalMetrics, {
          namespace: this.sharedMemoryStore.namespaces.CROSS_AGENT
        });
      }

      this.emit('task-outcome-recorded', {
        taskId,
        agentType: agent.type,
        success: outcome.success,
        learningResult
      });

      console.log(`Recorded task outcome for ${taskId}: ${outcome.success ? 'SUCCESS' : 'FAILURE'}`);

      return learningResult;

    } catch (error) {
      console.error('Failed to record task outcome:', error);
      this.emit('neural-learning-error', { 
        taskId, 
        error: error.message,
        operation: 'record-outcome'
      });
      
      // Return a fallback pattern even on error
      return {
        pattern: {
          id: `error_pattern_${taskId}_${Date.now()}`,
          workflowType: 'unknown',
          successRate: 0.5,
          complexity: 5,
          agentType: 'unknown',
          timestamp: Date.now(),
          error: true
        },
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get predicted success probability for a task
   * @param {object} task - Task to predict success for
   */
  async getPredictedSuccess(task) {
    try {
      const prediction = await this.neuralLearning.predict({
        id: task.id,
        type: task.category || task.type,
        taskCount: 1,
        duration: task.estimatedDuration || 0,
        complexity: task.complexity || 5,
        projectSize: task.projectSize || 0,
        primaryLanguage: task.language || 'javascript',
        workflowType: task.category || 'general',
        projectType: task.projectType || 'web'
      });

      return {
        successProbability: prediction.successProbability,
        confidence: prediction.confidence,
        estimatedDuration: prediction.estimatedDuration,
        riskFactors: prediction.riskFactors,
        optimizations: prediction.optimizations
      };

    } catch (error) {
      console.error('Failed to get success prediction:', error);
      return {
        successProbability: 0.5,
        confidence: 0.1,
        error: error.message
      };
    }
  }

  /**
   * Select optimal agent with load balancing - NEW FIX
   * @param {object} task - Task to find optimal agent for
   */
  async selectOptimalAgentWithLoadBalancing(task) {
    try {
      // Get neural prediction first
      const neuralSelection = await this.selectOptimalAgent(task);
      
      // Calculate load balancing scores for each agent type
      const loadBalancingScores = new Map();
      const agentTypeLoads = new Map();
      
      // Calculate current load per agent type
      for (const [agentId, agent] of this.subAgents) {
        if (agent.status === 'active') {
          const agentType = agent.type;
          const currentLoad = agentTypeLoads.get(agentType) || 0;
          
          // Calculate agent load based on context usage, message queue, and runtime
          const contextLoad = (agent.tokenUsage || 0) / this.contextWindowSize;
          const queueLoad = (agent.messageQueue?.length || 0) / 100; // Normalize queue size
          const runtimeLoad = agent.startTime ? Math.min((Date.now() - agent.startTime) / 300000, 1) : 0; // Normalize to 5 minutes max
          
          const agentLoad = (contextLoad * 0.5 + queueLoad * 0.3 + runtimeLoad * 0.2);
          agentTypeLoads.set(agentType, currentLoad + agentLoad);
        }
      }
      
      // Calculate scores for candidate agent types
      const candidateTypes = this.getAgentTypesForTask(task);
      
      for (const agentType of candidateTypes) {
        const currentLoad = agentTypeLoads.get(agentType) || 0;
        const neuralScore = neuralSelection.agentType === agentType ? 
          (neuralSelection.prediction?.successProbability || 0.5) : 0.3;
        
        // Invert load (lower load = higher score) and combine with neural score
        const loadScore = Math.max(0, 1 - currentLoad);
        const combinedScore = neuralScore * 0.7 + loadScore * 0.3;
        
        loadBalancingScores.set(agentType, {
          combinedScore,
          neuralScore,
          loadScore,
          currentLoad
        });
      }
      
      // Select agent type with highest combined score
      let bestAgentType = neuralSelection.agentType;
      let bestScore = 0;
      
      for (const [agentType, scores] of loadBalancingScores) {
        if (scores.combinedScore > bestScore) {
          bestScore = scores.combinedScore;
          bestAgentType = agentType;
        }
      }
      
      const selectedScores = loadBalancingScores.get(bestAgentType) || {
        combinedScore: 0.5,
        neuralScore: 0.5,
        loadScore: 0.5,
        currentLoad: 0
      };
      
      console.log(`QUEEN CONTROLLER FIX: Load balancing selected ${bestAgentType} (score: ${selectedScores.combinedScore.toFixed(3)}, load: ${selectedScores.currentLoad.toFixed(3)})`);
      
      return {
        agentType: bestAgentType,
        prediction: neuralSelection.prediction,
        reasoning: neuralSelection.reasoning,
        loadBalancingScore: selectedScores.combinedScore,
        loadBalancing: {
          neuralScore: selectedScores.neuralScore,
          loadScore: selectedScores.loadScore,
          currentLoad: selectedScores.currentLoad,
          alternativeTypes: Array.from(loadBalancingScores.entries())
            .sort((a, b) => b[1].combinedScore - a[1].combinedScore)
            .slice(0, 3)
            .map(([type, scores]) => ({ type, score: scores.combinedScore }))
        }
      };
      
    } catch (error) {
      console.error('QUEEN CONTROLLER FIX: Load balancing selection failed:', error.message);
      // Fallback to original selection
      return await this.selectOptimalAgent(task);
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
   * Shutdown Queen Controller with neural learning cleanup
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
    
    // Flush any remaining neural learning training
    try {
      await this.neuralLearning.flushTraining();
      await this.neuralLearning.savePersistentData();
      console.log('Neural learning data saved during shutdown');
    } catch (error) {
      console.error('Failed to save neural learning data:', error);
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
   * Get task queue status
   */
  getTaskQueueStatus() {
    return {
      queued: this.taskQueue.length,
      pending: this.pendingTasks.size,
      completed: this.completedTasks.size,
      nextTask: this.taskQueue[0] || null
    };
  }

  /**
   * Get current status with neural learning metrics
   */
  getStatus() {
    const status = {
      active: this.activeAgents.size,
      activeAgents: this.activeAgents.size,  // Added for backward compatibility
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

    // Add neural learning system status if available
    try {
      status.neuralLearning = this.neuralLearning.getSystemStatus();
    } catch (error) {
      status.neuralLearning = { 
        error: 'Failed to get neural status',
        initialized: false
      };
    }

    return status;
  }
}

module.exports = QueenController;