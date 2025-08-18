/**
 * Queen Controller - Unlimited Sub-Agent Architecture
 * 
 * This is the master controller for managing unlimited sub-agents with independent 
 * context windows. It orchestrates task distribution, monitors agent health,
 * and aggregates results from concurrent agent operations.
 * 
 * Features:
 * - UNLIMITED concurrent sub-agents (resource-constrained)
 * - Dynamic agent scaling based on system resources
 * - Tracks 200k token context windows per agent
 * - Intelligent conflict detection and resolution
 * - Handles inter-agent communication
 * - Provides shared memory for cross-agent data
 * - Advanced resource monitoring and optimization
 * - Support for 42+ specialized agent types
 */

const EventEmitter = require('events');
const path = require('path');
const fs = require('fs').promises;
const { NeuralLearningSystem } = require('./neural-learning');
const { WasmCoreModule } = require('./wasm-core-module');
const { TopologyManager } = require('./topology-manager');
const { CapabilityMatcher } = require('./capability-matcher');
const ResourceMonitor = require('./resource-monitor');
const DynamicScaler = require('./dynamic-scaler');
const DynamicAgentRegistry = require('./dynamic-agent-registry');
const ConflictDetector = require('./conflict-detector');

class QueenController extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Core configuration - UNLIMITED SCALING ENABLED
    this.maxConcurrent = null; // Removed hard-coded limit - now dynamically calculated
    this.contextWindowSize = options.contextWindowSize || 200000; // 200k tokens
    this.projectRoot = options.projectRoot || process.cwd();
    
    // Unlimited scaling configuration
    this.unlimitedScaling = {
      enabled: options.unlimitedScaling !== false,
      safetyLimit: options.safetyLimit || 1000, // Soft safety limit
      resourceThresholds: {
        memory: options.memoryThreshold || 0.85,
        cpu: options.cpuThreshold || 0.80
      },
      dynamicCalculation: true
    };
    
    // Claude Flow 2.0 Configuration
    this.claudeFlow2Config = {
      wasmAcceleration: options.wasmAcceleration !== false,
      simdOptimization: options.simdOptimization !== false,
      topologyType: options.topologyType || 'hierarchical',
      neuralLiveTraining: options.neuralLiveTraining !== false,
      targetSpeedupFactor: options.targetSpeedupFactor || 3.6, // Average of 2.8-4.4x
      tokenReductionTarget: options.tokenReductionTarget || 32.3 // 32.3% reduction
    };
    
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
    
    // REMOVED: Hard-coded agent type registry - now using Dynamic Agent Registry
    // This enables unlimited agent types from /.claude/agents/ directory
    this.agentTypes = null; // Will be replaced by dynamic registry
    
    // Unlimited scaling system components
    this.resourceMonitor = null;
    this.dynamicScaler = null;
    this.dynamicAgentRegistry = null;
    this.conflictDetector = null;
    
    // Initialize unlimited scaling components
    this.initializeUnlimitedScaling();
    
    // Initialize Claude Flow 2.0 components
    this.initializeClaudeFlow2Components();
    
    // Initialize monitoring
    this.startMonitoring();
    
    // Initialize neural learning system
    this.initializeNeuralLearning();
  }
  
  /**
   * Initialize unlimited scaling system
   */
  async initializeUnlimitedScaling() {
    if (!this.unlimitedScaling.enabled) {
      console.log('Unlimited scaling disabled - using legacy 10-agent limit');
      this.maxConcurrent = 10;
      return;
    }
    
    console.log('Initializing Unlimited Agent Scaling System...');
    
    try {
      // Initialize Resource Monitor
      this.resourceMonitor = new ResourceMonitor({
        projectRoot: this.projectRoot,
        targetMemoryUtilization: this.unlimitedScaling.resourceThresholds.memory,
        targetCpuUtilization: this.unlimitedScaling.resourceThresholds.cpu
      });
      
      // Initialize Dynamic Scaler
      this.dynamicScaler = new DynamicScaler({
        minAgents: 1,
        maxAgents: this.unlimitedScaling.safetyLimit,
        projectRoot: this.projectRoot
      });
      
      // Initialize Dynamic Agent Registry
      this.dynamicAgentRegistry = new DynamicAgentRegistry({
        agentsDirectory: path.join(this.projectRoot, '.claude/agents'),
        fallbackDirectory: path.join(this.projectRoot, 'sub-agent-documentation/agents'),
        contextWindowDefault: this.contextWindowSize
      });
      
      // Initialize Conflict Detector
      this.conflictDetector = new ConflictDetector({
        projectRoot: this.projectRoot
      });
      
      // Start components
      await this.resourceMonitor.start();
      await this.dynamicAgentRegistry.initialize();
      await this.conflictDetector.initialize();
      
      // Setup event handlers
      this.setupUnlimitedScalingEventHandlers();
      
      console.log(`Unlimited Scaling System initialized - discovered ${this.dynamicAgentRegistry.getStats().totalAgentTypes} agent types`);
      
      this.emit('unlimited-scaling-initialized', {
        agentTypes: this.dynamicAgentRegistry.getStats().totalAgentTypes,
        resourceMonitoring: true,
        conflictDetection: true,
        dynamicScaling: true
      });
      
    } catch (error) {
      console.error('Failed to initialize unlimited scaling system:', error);
      this.unlimitedScaling.enabled = false;
      this.maxConcurrent = 10; // Fallback to legacy limit
      this.emit('unlimited-scaling-error', error);
    }
  }
  
  /**
   * Setup event handlers for unlimited scaling components
   */
  setupUnlimitedScalingEventHandlers() {
    // Resource monitor events
    this.resourceMonitor.on('threshold-exceeded', (alert) => {
      console.warn(`RESOURCE ALERT: ${alert.type} threshold exceeded (${(alert.current * 100).toFixed(1)}%)`);
      this.emit('resource-alert', alert);
    });
    
    // Dynamic scaler events
    this.dynamicScaler.on('scaling-executed', (event) => {
      console.log(`SCALING: ${event.direction} to ${event.targetCount} agents (${event.reason})`);
      this.emit('scaling-event', event);
    });
    
    // Agent registry events
    this.dynamicAgentRegistry.on('agent-registered', (event) => {
      console.log(`AGENT REGISTERED: ${event.agentType}`);
    });
    
    // Conflict detector events
    this.conflictDetector.on('conflict-analysis-completed', (event) => {
      if (event.analysis.hasConflicts) {
        console.warn(`CONFLICT DETECTED: Task ${event.taskId} has ${event.analysis.conflicts.length} conflicts`);
      }
    });
  }
  
  /**
   * Calculate dynamic agent limit based on current resources
   */
  async calculateDynamicAgentLimit() {
    if (!this.unlimitedScaling.enabled || !this.resourceMonitor) {
      return this.maxConcurrent || 10;
    }
    
    try {
      const resourceMetrics = this.resourceMonitor.getMetrics();
      const scaling = resourceMetrics.current.scaling;
      
      return Math.min(scaling.optimalAgentCount, this.unlimitedScaling.safetyLimit);
    } catch (error) {
      console.error('Failed to calculate dynamic agent limit:', error);
      return this.maxConcurrent || 10;
    }
  }
  
  /**
   * Get agent configuration from dynamic registry
   */
  async getAgentConfigFromRegistry(type) {
    if (!this.dynamicAgentRegistry) {
      // Fallback to legacy agent types if registry not available
      const legacyTypes = new Map([
        ['code-analyzer', { template: 'code-analyzer-agent.md', capabilities: ['analysis', 'pattern-detection'], contextWindow: 200000 }],
        ['test-runner', { template: 'testing-validation-agent.md', capabilities: ['testing', 'validation'], contextWindow: 200000 }],
        ['doc-generator', { template: 'doc-generator-agent.md', capabilities: ['documentation', 'markdown'], contextWindow: 200000 }]
      ]);
      return legacyTypes.get(type);
    }
    
    return this.dynamicAgentRegistry.getAgentConfig(type);
  }
  
  /**
   * Get available agent types
   */
  async getAvailableAgentTypes() {
    if (!this.dynamicAgentRegistry) {
      return ['code-analyzer', 'test-runner', 'doc-generator'];
    }
    
    const agentTypes = this.dynamicAgentRegistry.getAgentTypes();
    return Array.from(agentTypes.keys()).slice(0, 10).join(', ') + 
           (agentTypes.size > 10 ? ` (and ${agentTypes.size - 10} more)` : '');
  }
  
  /**
   * Spawn a new sub-agent with specific type and context - UNLIMITED SCALING
   * @param {string} type - Agent type from dynamic registry
   * @param {object} task - Task to assign to agent
   * @param {object} context - Initial context for agent
   */
  async spawnSubAgent(type, task, context = {}) {
    // Dynamic concurrent limit calculation
    const optimalLimit = await this.calculateDynamicAgentLimit();
    
    if (this.activeAgents.size >= optimalLimit) {
      this.emit('dynamic-limit-reached', { 
        active: this.activeAgents.size, 
        optimalLimit: optimalLimit,
        queued: this.taskQueue.length,
        reason: 'resource_constraints'
      });
      
      // Queue the task for later
      this.taskQueue.push({ type, task, context });
      return null;
    }
    
    // Conflict detection for unlimited scaling
    if (this.conflictDetector && task) {
      const conflictAnalysis = await this.conflictDetector.analyzeTaskConflicts(task, `temp-${Date.now()}`);
      if (conflictAnalysis.hasConflicts && conflictAnalysis.riskLevel === 'critical') {
        this.emit('task-conflict-detected', {
          taskId: task.id,
          conflicts: conflictAnalysis.conflicts,
          recommendations: conflictAnalysis.recommendations
        });
        
        // Queue task for conflict resolution
        this.taskQueue.push({ type, task, context, conflictAnalysis });
        return null;
      }
    }
    
    // Generate unique agent ID
    const agentId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Get agent configuration from dynamic registry
    const agentConfig = await this.getAgentConfigFromRegistry(type);
    if (!agentConfig) {
      throw new Error(`Unknown agent type: ${type}. Available types: ${await this.getAvailableAgentTypes()}`);
    }
    
    // Create agent instance with explicit 200k context window - FIXED
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
        maxTokens: agentConfig.contextWindow || 200000,
        context_window: 200000, // Explicit 200k context window
        agentTemplate: agentConfig.template
      },
      status: 'initializing',
      startTime: Date.now(),
      tokenUsage: 0,
      maxTokens: agentConfig.contextWindow || 200000, // Enforce context limit
      contextWarned: false,
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
    
    // Initialize agent with specialized template loading - FIXED
    await this.initializeSpecializedAgent(agent);
    
    return agentId;
  }
  
  /**
   * Initialize a spawned agent - LEGACY: Use initializeSpecializedAgent instead
   */
  async initializeAgent(agent) {
    console.warn('DEPRECATED: Using legacy agent initialization. Use initializeSpecializedAgent for proper template loading.');
    return await this.initializeSpecializedAgent(agent);
  }
  
  /**
   * Initialize a specialized agent with Claude Flow 2.0 enhancements - ENHANCED
   */
  async initializeSpecializedAgent(agent) {
    agent.status = 'active';
    
    // Claude Flow 2.0: Register agent with topology manager
    if (this.topologyManager && this.topologyManager.initialized) {
      try {
        await this.topologyManager.registerAgent(agent.id, {
          type: agent.type,
          capabilities: agent.capabilities,
          contextWindow: agent.maxTokens,
          status: 'active'
        });
        agent.topologyRegistered = true;
      } catch (topologyError) {
        console.warn(`Failed to register agent ${agent.id} with topology manager:`, topologyError.message);
        agent.topologyRegistered = false;
      }
    }
    
    // Load specialized agent template from .claude/agents/
    const templatePath = path.join(this.projectRoot, '.claude/agents', agent.template);
    try {
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      agent.instructions = templateContent;
      agent.templateLoaded = true;
      agent.templateSource = 'specialized';
      
      // Claude Flow 2.0: Enhance template with performance optimizations
      const enhancedTemplate = this.enhanceTemplateWithClaudeFlow2(templateContent, agent);
      agent.instructions = enhancedTemplate;
      
      // Validate template has required context window specification
      if (!templateContent.includes('context_window') && !templateContent.includes('200000')) {
        console.warn(`QUEEN CONTROLLER FIX: Template ${agent.template} missing context window specification`);
        agent.instructions += '\n\n## Context Window\ncontext_window: 200000\n';
      }
      
    } catch (error) {
      console.warn(`QUEEN CONTROLLER FIX: Failed to load specialized template for ${agent.type}: ${error.message}`);
      
      // Try to load from sub-agent-documentation/agents/ as fallback
      const fallbackPath = path.join(this.projectRoot, 'sub-agent-documentation/agents', agent.template);
      try {
        const fallbackContent = await fs.readFile(fallbackPath, 'utf-8');
        agent.instructions = fallbackContent;
        agent.templateLoaded = true;
        agent.templateSource = 'fallback';
      } catch (fallbackError) {
        // Use default instructions with 200k context enforcement
        agent.instructions = this.generateSpecializedInstructions(agent.type);
        agent.templateLoaded = false;
        agent.templateSource = 'generated';
      }
    }
    
    // Enforce context window monitoring
    this.setupContextWindowMonitoring(agent);
    
    this.emit('agent-ready', {
      agentId: agent.id,
      type: agent.type,
      templateLoaded: agent.templateLoaded,
      templateSource: agent.templateSource,
      contextWindow: agent.maxTokens,
      claudeFlow2Enhanced: true,
      topologyRegistered: agent.topologyRegistered,
      wasmAcceleration: this.wasmCore?.isInitialized() || false
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
   * Check health status of an agent - FIXED: Enhanced context monitoring
   */
  async checkAgentHealth(agent) {
    // Enhanced health check with context window monitoring
    const health = {
      status: agent.status,
      tokenUsage: agent.tokenUsage,
      contextUtilization: (agent.tokenUsage / agent.maxTokens) * 100,
      memory: process.memoryUsage().heapUsed,
      runtime: Date.now() - agent.startTime,
      contextOverflow: agent.tokenUsage >= agent.maxTokens,
      contextWarning: agent.tokenUsage > (agent.maxTokens * 0.9)
    };
    
    // Update token usage tracking
    this.metrics.contextUsage.set(agent.id, health.tokenUsage);
    
    // Check for context window violations
    if (health.contextOverflow) {
      console.error(`QUEEN CONTROLLER FIX: Agent ${agent.id} exceeded context window: ${agent.tokenUsage}/${agent.maxTokens}`);
      health.status = 'context_overflow';
    } else if (health.contextWarning) {
      console.warn(`QUEEN CONTROLLER FIX: Agent ${agent.id} approaching context limit: ${health.contextUtilization.toFixed(1)}%`);
    }
    
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
   * Initialize Claude Flow 2.0 Components
   */
  async initializeClaudeFlow2Components() {
    try {
      console.log('Initializing Claude Flow 2.0 components...');
      
      // Initialize WASM Core Module
      this.wasmCore = new WasmCoreModule({
        simdEnabled: this.claudeFlow2Config.simdOptimization,
        projectRoot: this.projectRoot,
        maxAgents: this.maxConcurrent
      });
      
      await this.wasmCore.initialize();
      
      // Initialize Topology Manager
      this.topologyManager = new TopologyManager({
        initialTopology: this.claudeFlow2Config.topologyType,
        maxAgents: this.maxConcurrent,
        adaptiveTopology: true
      });
      
      await this.topologyManager.initialize();
      
      // Initialize Capability Matcher
      this.capabilityMatcher = new CapabilityMatcher({
        neuralPredictions: true,
        agentTypes: this.agentTypes,
        wasmAcceleration: this.claudeFlow2Config.wasmAcceleration
      });
      
      await this.capabilityMatcher.initialize();
      
      console.log('Claude Flow 2.0 components initialized successfully');
      
      this.emit('claude-flow-2-ready', {
        wasmEnabled: this.wasmCore.isInitialized(),
        topologyType: this.topologyManager.getCurrentTopology(),
        capabilityMatching: this.capabilityMatcher.isEnabled()
      });
      
    } catch (error) {
      console.error('Failed to initialize Claude Flow 2.0 components:', error);
      this.emit('claude-flow-2-error', { error: error.message });
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
   * Generate default instructions for agent types - LEGACY
   */
  generateDefaultInstructions(type) {
    console.warn('DEPRECATED: Use generateSpecializedInstructions for proper agent setup');
    return this.generateSpecializedInstructions(type);
  }
  
  /**
   * Generate specialized instructions with proper context window enforcement - FIXED
   */
  generateSpecializedInstructions(type) {
    const specializedTemplates = {
      'code-analyzer': `You are a specialized Code Analyzer Agent with a 200,000 token context window.

## Core Responsibilities
- Analyze code structure, patterns, and quality
- Identify performance bottlenecks and optimization opportunities
- Detect anti-patterns and suggest improvements
- Generate comprehensive code analysis reports

## Context Window
context_window: 200000

## Communication Protocol
- Input: Code files and analysis requests from Queen Controller
- Output: Structured analysis reports and recommendations
- Shared Memory: Store analysis results for cross-agent access`,
      
      'test-runner': `You are a specialized Test Runner Agent with a 200,000 token context window.

## Core Responsibilities
- Execute automated tests and validate functionality
- Generate test reports and coverage analysis
- Identify failing tests and suggest fixes
- Coordinate with other agents for integration testing

## Context Window
context_window: 200000

## Communication Protocol
- Input: Test suites and execution requests from Queen Controller
- Output: Test results, coverage reports, and failure analysis
- Shared Memory: Store test results for cross-agent access`,
      
      'doc-generator': `You are a specialized Documentation Generator Agent with a 200,000 token context window.

## Core Responsibilities
- Generate comprehensive documentation and markdown files
- Create API documentation and user guides
- Maintain documentation consistency and quality
- Coordinate with other agents for technical accuracy

## Context Window
context_window: 200000

## Communication Protocol
- Input: Code analysis and documentation requests from Queen Controller
- Output: Generated documentation, guides, and technical content
- Shared Memory: Store documentation templates for cross-agent access`,
      
      'security-scanner': `You are a specialized Security Scanner Agent with a 200,000 token context window.

## Core Responsibilities
- Scan for security vulnerabilities and compliance issues
- Perform security audits and risk assessments
- Generate security reports and remediation suggestions
- Monitor for security best practices

## Context Window
context_window: 200000

## Communication Protocol
- Input: Code and security scan requests from Queen Controller
- Output: Security reports, vulnerability assessments, and remediation plans
- Shared Memory: Store security findings for cross-agent access`,
      
      'recovery-specialist': `You are a specialized Recovery Specialist Agent with a 200,000 token context window.

## Core Responsibilities
- Detect, diagnose, and recover from system failures
- Implement intelligent recovery mechanisms
- Maintain system stability and data integrity
- Coordinate recovery operations across distributed systems

## Context Window
context_window: 200000

## Communication Protocol
- Input: Failure alerts and recovery requests from Queen Controller
- Output: Recovery plans, system diagnostics, and restoration status
- Shared Memory: Store recovery procedures for cross-agent access`
    };
    
    const template = specializedTemplates[type];
    if (template) {
      return template;
    }
    
    // Generic template with context enforcement
    return `You are a specialized ${type} Agent with a 200,000 token context window.

## Core Responsibilities
- Perform ${type} tasks efficiently and accurately
- Collaborate with other specialized agents
- Report results to Queen Controller
- Maintain high quality standards

## Context Window
context_window: 200000

## Communication Protocol
- Input: Task assignments from Queen Controller
- Output: Results, status updates, and progress reports
- Shared Memory: Store results for cross-agent access

## Quality Standards
- Follow SPARC methodology (Specification, Pseudocode, Architecture, Refinement, Completion)
- Ensure all outputs are production-ready
- Validate all work before submission
- Collaborate effectively with other agents`;
  }
  
  /**
   * Setup context window monitoring for an agent - NEW
   */
  setupContextWindowMonitoring(agent) {
    // Monitor context usage every 10 seconds
    const monitoringInterval = setInterval(() => {
      if (!this.subAgents.has(agent.id)) {
        clearInterval(monitoringInterval);
        return;
      }
      
      const currentAgent = this.subAgents.get(agent.id);
      const utilization = (currentAgent.tokenUsage / currentAgent.maxTokens) * 100;
      
      // Warn at 80% utilization
      if (utilization > 80 && !currentAgent.contextWarned) {
        currentAgent.contextWarned = true;
        this.emit('context-warning', {
          agentId: agent.id,
          type: agent.type,
          utilization: utilization,
          tokens: currentAgent.tokenUsage,
          limit: currentAgent.maxTokens
        });
      }
      
      // Emergency shutdown at 95% to prevent overflow
      if (utilization > 95) {
        console.error(`QUEEN CONTROLLER FIX: Emergency shutdown of agent ${agent.id} due to context overflow risk`);
        this.terminateAgent(agent.id, 'context_overflow_prevention');
        clearInterval(monitoringInterval);
      }
    }, 10000);
    
    // Store interval reference for cleanup
    agent.contextMonitoringInterval = monitoringInterval;
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
   * Enhance template with Claude Flow 2.0 optimizations
   */
  enhanceTemplateWithClaudeFlow2(templateContent, agent) {
    let enhanced = templateContent;
    
    // Add Claude Flow 2.0 performance instructions
    const performanceSection = `

## Claude Flow 2.0 Performance Optimizations

### WASM Acceleration
- Leverage SIMD operations for vector calculations
- Use optimized neural predictions for task routing
- Target ${this.claudeFlow2Config.targetSpeedupFactor}x performance improvement

### Token Efficiency
- Optimize context window usage (200k tokens available)
- Target ${this.claudeFlow2Config.tokenReductionTarget}% token reduction
- Use intelligent context compression

### Topology Awareness
- Current topology: ${this.topologyManager?.getCurrentTopology() || 'hierarchical'}
- Optimize communication patterns based on topology
- Enable adaptive topology switching

### Neural Predictions
- Use capability matching for optimal task assignment
- Provide feedback for continuous learning improvement
- Target 89%+ matching accuracy

### MCP Tool Integration
- Prioritize MCP tools for enhanced functionality
- Use context7 as default MCP server
- Leverage tool chaining for complex operations
`;
    
    enhanced += performanceSection;
    
    return enhanced;
  }

  /**
   * Shutdown Queen Controller with unlimited scaling cleanup
   */
  async shutdown() {
    console.log('Shutting down Queen Controller with unlimited scaling system...');
    
    // Stop monitoring
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    // Shutdown unlimited scaling components
    if (this.unlimitedScaling.enabled) {
      if (this.resourceMonitor) {
        this.resourceMonitor.stop();
      }
      
      if (this.conflictDetector) {
        await this.conflictDetector.shutdown();
      }
      
      if (this.dynamicAgentRegistry) {
        await this.dynamicAgentRegistry.shutdown();
      }
      
      console.log('Unlimited scaling components shutdown completed');
    }
    
    // Shutdown Claude Flow 2.0 components
    if (this.wasmCore) {
      await this.wasmCore.shutdown();
    }
    
    if (this.topologyManager) {
      await this.topologyManager.shutdown();
    }
    
    if (this.capabilityMatcher) {
      await this.capabilityMatcher.shutdown();
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
   * Get current status with unlimited scaling metrics
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

    // Add unlimited scaling status
    if (this.unlimitedScaling.enabled) {
      status.unlimitedScaling = {
        enabled: true,
        dynamicLimit: null,
        resourceStatus: null,
        agentTypesAvailable: 0,
        conflictDetection: !!this.conflictDetector
      };
      
      // Get dynamic limit if resource monitor is available
      if (this.resourceMonitor) {
        try {
          const resourceMetrics = this.resourceMonitor.getMetrics();
          status.unlimitedScaling.dynamicLimit = resourceMetrics.current.scaling.optimalAgentCount;
          status.unlimitedScaling.resourceStatus = this.resourceMonitor.getResourceStatus();
        } catch (error) {
          status.unlimitedScaling.resourceError = error.message;
        }
      }
      
      // Get agent types count
      if (this.dynamicAgentRegistry) {
        status.unlimitedScaling.agentTypesAvailable = this.dynamicAgentRegistry.getStats().totalAgentTypes;
      }
    } else {
      status.unlimitedScaling = {
        enabled: false,
        legacyMode: true,
        fixedLimit: this.maxConcurrent
      };
    }

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
  
  /**
   * Calculate average speedup factor across all agents
   */
  calculateAverageSpeedupFactor() {
    if (!this.wasmCore) return 1.0;
    
    const wasmMetrics = this.wasmCore.getMetrics();
    return wasmMetrics.speedupFactor || 1.0;
  }
  
  /**
   * Calculate token reduction achieved
   */
  calculateTokenReduction() {
    const totalTokenUsage = Array.from(this.subAgents.values())
      .reduce((sum, agent) => sum + (agent.tokenUsage || 0), 0);
    
    const expectedTokenUsage = this.subAgents.size * 100000; // Baseline expectation
    
    if (expectedTokenUsage === 0) return 0;
    
    return Math.max(0, ((expectedTokenUsage - totalTokenUsage) / expectedTokenUsage) * 100);
  }
}

module.exports = QueenController;