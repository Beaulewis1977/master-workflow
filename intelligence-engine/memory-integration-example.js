/**
 * SharedMemoryStore Integration Example
 * 
 * This example demonstrates how the SharedMemoryStore integrates with the
 * existing Hive-Mind architecture, particularly with the Queen Controller
 * to provide seamless cross-agent data sharing and context preservation.
 * 
 * @author Claude Code
 * @date August 2025
 * @version 2.1.0
 */

const SharedMemoryStore = require('./shared-memory');
const QueenController = require('./queen-controller');
const EventEmitter = require('events');

class HiveMindIntegration extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.projectRoot = options.projectRoot || process.cwd();
    this.maxConcurrentAgents = options.maxConcurrentAgents || 10;
    
    // Initialize shared memory store
    this.memory = new SharedMemoryStore({
      projectRoot: this.projectRoot,
      maxMemorySize: 500 * 1024 * 1024, // 500MB
      maxEntries: 100000,
      gcInterval: 300000 // 5 minutes
    });
    
    // Initialize queen controller with memory integration
    this.queen = new QueenController({
      projectRoot: this.projectRoot,
      maxConcurrent: this.maxConcurrentAgents,
      sharedMemory: this.memory
    });
    
    // Integration state
    this.isInitialized = false;
    this.agentContexts = new Map();
    this.crossAgentChannels = new Map();
    
    // Initialize integration
    this.initialize();
  }
  
  /**
   * Initialize the integration
   */
  async initialize() {
    try {
      console.log('🚀 Initializing Hive-Mind integration...');
      
      // Wait for memory store to initialize
      await new Promise((resolve) => {
        this.memory.once('initialized', resolve);
      });
      
      // Set up event handlers
      this.setupEventHandlers();
      
      // Initialize cross-agent communication channels
      await this.initializeCommunicationChannels();
      
      // Load persistent agent contexts
      await this.loadAgentContexts();
      
      this.isInitialized = true;
      
      console.log('✅ Hive-Mind integration initialized successfully');
      this.emit('integration-ready');
      
    } catch (error) {
      console.error('❌ Failed to initialize Hive-Mind integration:', error);
      this.emit('integration-error', error);
      throw error;
    }
  }
  
  /**
   * Set up event handlers for integration
   */
  setupEventHandlers() {
    // Memory store events
    this.memory.on('memory-set', (event) => {
      this.handleMemoryUpdate(event);
    });
    
    this.memory.on('memory-delete', (event) => {
      this.handleMemoryDeletion(event);
    });
    
    // Queen controller events
    this.queen.on('agent-spawned', (event) => {
      this.handleAgentSpawned(event);
    });
    
    this.queen.on('agent-completed', (event) => {
      this.handleAgentCompleted(event);
    });
    
    this.queen.on('agent-error', (event) => {
      this.handleAgentError(event);
    });
  }
  
  /**
   * Initialize communication channels between agents
   */
  async initializeCommunicationChannels() {
    const channels = [
      'task-coordination',
      'result-sharing',
      'error-reporting',
      'status-updates',
      'context-sync'
    ];
    
    for (const channel of channels) {
      await this.memory.set(`channel:${channel}`, {
        type: 'communication-channel',
        participants: [],
        messages: [],
        created: Date.now()
      }, {
        namespace: this.memory.namespaces.CROSS_AGENT,
        dataType: this.memory.dataTypes.PERSISTENT
      });
      
      this.crossAgentChannels.set(channel, {
        subscribers: new Set(),
        messageHistory: []
      });
    }
    
    console.log(`📡 Initialized ${channels.length} communication channels`);
  }
  
  /**
   * Load persistent agent contexts from previous sessions
   */
  async loadAgentContexts() {
    try {
      const contextKeys = await this.memory.keys({
        namespace: this.memory.namespaces.AGENT_CONTEXT,
        pattern: 'agent-context-.*'
      });
      
      let loadedContexts = 0;
      
      for (const key of contextKeys) {
        const context = await this.memory.get(key, { includeMetadata: true });
        
        if (context && context.found) {
          const agentId = context.metadata.agentId;
          this.agentContexts.set(agentId, {
            ...context.value,
            lastLoaded: Date.now(),
            persistent: true
          });
          loadedContexts++;
        }
      }
      
      console.log(`📂 Loaded ${loadedContexts} persistent agent contexts`);
      
    } catch (error) {
      console.warn('⚠️ Failed to load some agent contexts:', error.message);
    }
  }
  
  /**
   * Spawn an agent with enhanced memory integration
   */
  async spawnAgent(agentType, task, options = {}) {
    try {
      // Prepare enhanced context with memory access
      const enhancedContext = {
        ...options.context,
        memoryStore: this.memory,
        communicationChannels: Array.from(this.crossAgentChannels.keys()),
        sharedNamespaces: this.memory.namespaces,
        agentId: options.agentId || `${agentType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
      
      // Load previous context if exists
      const persistentContext = this.agentContexts.get(enhancedContext.agentId);
      if (persistentContext) {
        enhancedContext.previousSession = persistentContext;
        console.log(`🔄 Restored context for agent ${enhancedContext.agentId}`);
      }
      
      // Spawn agent through queen controller
      const agentId = await this.queen.spawnSubAgent(agentType, task, enhancedContext);
      
      if (agentId) {
        // Initialize agent memory space
        await this.initializeAgentMemorySpace(agentId, agentType, task);
        
        // Subscribe agent to relevant communication channels
        await this.subscribeAgentToChannels(agentId, agentType);
        
        console.log(`🤖 Spawned agent ${agentId} with memory integration`);
      }
      
      return agentId;
      
    } catch (error) {
      console.error('❌ Failed to spawn agent with memory integration:', error);
      throw error;
    }
  }
  
  /**
   * Initialize memory space for a new agent
   */
  async initializeAgentMemorySpace(agentId, agentType, task) {
    const contextKey = `agent-context-${agentId}`;
    const resultsKey = `agent-results-${agentId}`;
    
    // Initialize agent context
    await this.memory.set(contextKey, {
      agentId,
      agentType,
      task,
      status: 'initializing',
      startTime: Date.now(),
      tokenUsage: 0,
      memoryUsage: 0,
      contextWindow: [],
      intermediateResults: [],
      communicationLog: []
    }, {
      namespace: this.memory.namespaces.AGENT_CONTEXT,
      dataType: this.memory.dataTypes.PERSISTENT,
      agentId
    });
    
    // Initialize results storage
    await this.memory.set(resultsKey, {
      agentId,
      taskId: task.id,
      results: [],
      status: 'pending',
      created: Date.now()
    }, {
      namespace: this.memory.namespaces.TASK_RESULTS,
      dataType: this.memory.dataTypes.PERSISTENT,
      agentId
    });
    
    // Store in local tracking
    this.agentContexts.set(agentId, {
      agentType,
      task,
      memoryKeys: [contextKey, resultsKey],
      channels: [],
      status: 'active'
    });
  }
  
  /**
   * Subscribe agent to relevant communication channels
   */
  async subscribeAgentToChannels(agentId, agentType) {
    // Determine relevant channels based on agent type
    const channelMap = {
      'code-analyzer': ['task-coordination', 'result-sharing'],
      'test-runner': ['task-coordination', 'result-sharing', 'error-reporting'],
      'doc-generator': ['result-sharing', 'status-updates'],
      'api-builder': ['task-coordination', 'result-sharing', 'error-reporting'],
      'database-architect': ['task-coordination', 'result-sharing'],
      'security-scanner': ['result-sharing', 'error-reporting'],
      'performance-optimizer': ['result-sharing', 'status-updates'],
      'deployment-engineer': ['task-coordination', 'status-updates', 'error-reporting'],
      'frontend-specialist': ['task-coordination', 'result-sharing'],
      'recovery-specialist': ['error-reporting', 'status-updates']
    };
    
    const relevantChannels = channelMap[agentType] || ['task-coordination'];
    
    for (const channel of relevantChannels) {
      const channelData = this.crossAgentChannels.get(channel);
      if (channelData) {
        channelData.subscribers.add(agentId);
        
        // Update persistent channel data
        await this.memory.atomic(`channel:${channel}`, (currentData) => {
          if (currentData && currentData.participants) {
            currentData.participants.push(agentId);
            currentData.lastUpdated = Date.now();
          }
          return currentData;
        });
      }
    }
    
    // Update agent context
    const agentContext = this.agentContexts.get(agentId);
    if (agentContext) {
      agentContext.channels = relevantChannels;
    }
    
    console.log(`📡 Subscribed agent ${agentId} to channels: ${relevantChannels.join(', ')}`);
  }
  
  /**
   * Share data between agents
   */
  async shareDataBetweenAgents(fromAgentId, toAgentId, data, options = {}) {
    const shareKey = `shared-data-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await this.memory.set(shareKey, {
      fromAgent: fromAgentId,
      toAgent: toAgentId,
      data,
      timestamp: Date.now(),
      type: options.type || 'data-share',
      priority: options.priority || 'normal'
    }, {
      namespace: this.memory.namespaces.CROSS_AGENT,
      dataType: this.memory.dataTypes.PERSISTENT,
      ttl: options.ttl || (24 * 60 * 60 * 1000), // 24 hours default
      agentId: fromAgentId,
      metadata: {
        sharedWith: toAgentId,
        shareType: options.type
      }
    });
    
    // Notify target agent
    await this.sendChannelMessage('result-sharing', {
      type: 'data-share-notification',
      fromAgent: fromAgentId,
      toAgent: toAgentId,
      shareKey,
      data: options.includeData ? data : null
    });
    
    console.log(`🔄 Shared data from ${fromAgentId} to ${toAgentId} (key: ${shareKey})`);
    return shareKey;
  }
  
  /**
   * Send message to communication channel
   */
  async sendChannelMessage(channelName, message) {
    const channel = this.crossAgentChannels.get(channelName);
    if (!channel) {
      throw new Error(`Unknown communication channel: ${channelName}`);
    }
    
    const messageEnvelope = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      channel: channelName,
      message,
      timestamp: Date.now(),
      subscribers: Array.from(channel.subscribers)
    };
    
    // Store in channel history
    channel.messageHistory.push(messageEnvelope);
    
    // Update persistent channel data
    await this.memory.atomic(`channel:${channelName}`, (currentData) => {
      if (currentData && currentData.messages) {
        currentData.messages.push(messageEnvelope);
        currentData.lastMessage = Date.now();
        
        // Keep only last 100 messages
        if (currentData.messages.length > 100) {
          currentData.messages = currentData.messages.slice(-100);
        }
      }
      return currentData;
    });
    
    // Notify subscribers
    for (const subscriberId of channel.subscribers) {
      await this.notifyAgent(subscriberId, 'channel-message', messageEnvelope);
    }
    
    return messageEnvelope.id;
  }
  
  /**
   * Notify an agent of an event
   */
  async notifyAgent(agentId, eventType, data) {
    const notificationKey = `notification-${agentId}-${Date.now()}`;
    
    await this.memory.set(notificationKey, {
      agentId,
      eventType,
      data,
      timestamp: Date.now(),
      status: 'pending'
    }, {
      namespace: this.memory.namespaces.TEMP,
      dataType: this.memory.dataTypes.TRANSIENT,
      ttl: 60000, // 1 minute
      agentId: 'system'
    });
  }
  
  /**
   * Update agent context
   */
  async updateAgentContext(agentId, updates) {
    const contextKey = `agent-context-${agentId}`;
    
    await this.memory.atomic(contextKey, (currentContext) => {
      if (currentContext) {
        return {
          ...currentContext,
          ...updates,
          lastUpdated: Date.now()
        };
      }
      return currentContext;
    }, { agentId });
    
    // Update local tracking
    const localContext = this.agentContexts.get(agentId);
    if (localContext) {
      Object.assign(localContext, updates);
    }
  }
  
  /**
   * Get aggregated results from all agents
   */
  async getAggregatedResults() {
    const resultKeys = await this.memory.keys({
      namespace: this.memory.namespaces.TASK_RESULTS,
      pattern: 'agent-results-.*'
    });
    
    const results = [];
    
    for (const key of resultKeys) {
      const result = await this.memory.get(key, { includeMetadata: true });
      if (result && result.found) {
        results.push({
          key,
          agentId: result.metadata.agentId,
          data: result.value,
          metadata: result.metadata
        });
      }
    }
    
    return {
      totalResults: results.length,
      results,
      aggregatedAt: Date.now(),
      memoryStats: this.memory.getStats()
    };
  }
  
  /**
   * Handle memory update events
   */
  handleMemoryUpdate(event) {
    console.log(`📝 Memory updated: ${event.key} by ${event.agentId}`);
    
    // Broadcast to interested agents if it's cross-agent data
    if (event.namespace === this.memory.namespaces.CROSS_AGENT) {
      this.broadcastCrossAgentUpdate(event);
    }
  }
  
  /**
   * Handle memory deletion events
   */
  handleMemoryDeletion(event) {
    console.log(`🗑️ Memory deleted: ${event.key} by ${event.agentId}`);
  }
  
  /**
   * Handle agent spawned events
   */
  async handleAgentSpawned(event) {
    console.log(`🤖 Agent spawned: ${event.agentId} (${event.type})`);
    
    // Update agent status in memory
    await this.updateAgentContext(event.agentId, {
      status: 'active',
      spawnedAt: event.timestamp
    });
  }
  
  /**
   * Handle agent completed events
   */
  async handleAgentCompleted(event) {
    console.log(`✅ Agent completed: ${event.agentId} (${event.type})`);
    
    // Update agent status and preserve results
    await this.updateAgentContext(event.agentId, {
      status: 'completed',
      completedAt: Date.now(),
      finalResults: event.results,
      performance: {
        runtime: event.runtime,
        tokenUsage: event.tokenUsage
      }
    });
    
    // Clean up transient data but preserve important results
    await this.cleanupAgentMemory(event.agentId, false);
  }
  
  /**
   * Handle agent error events
   */
  async handleAgentError(event) {
    console.error(`❌ Agent error: ${event.agentId} (${event.type}) - ${event.error}`);
    
    // Update agent status with error information
    await this.updateAgentContext(event.agentId, {
      status: 'error',
      error: event.error,
      errorAt: Date.now()
    });
    
    // Broadcast error to error reporting channel
    await this.sendChannelMessage('error-reporting', {
      type: 'agent-error',
      agentId: event.agentId,
      agentType: event.type,
      error: event.error,
      task: event.task
    });
  }
  
  /**
   * Broadcast cross-agent update
   */
  async broadcastCrossAgentUpdate(event) {
    await this.sendChannelMessage('context-sync', {
      type: 'memory-update',
      key: event.key,
      namespace: event.namespace,
      updatedBy: event.agentId,
      timestamp: Date.now()
    });
  }
  
  /**
   * Clean up agent memory
   */
  async cleanupAgentMemory(agentId, fullCleanup = false) {
    const agentContext = this.agentContexts.get(agentId);
    
    if (agentContext) {
      // Remove from communication channels
      for (const channelName of agentContext.channels) {
        const channel = this.crossAgentChannels.get(channelName);
        if (channel) {
          channel.subscribers.delete(agentId);
        }
      }
      
      if (fullCleanup) {
        // Delete all agent memory
        for (const memoryKey of agentContext.memoryKeys) {
          await this.memory.delete(memoryKey, { agentId });
        }
        
        this.agentContexts.delete(agentId);
      } else {
        // Mark as inactive but preserve context
        agentContext.status = 'inactive';
        agentContext.cleanedAt = Date.now();
      }
    }
  }
  
  /**
   * Get system status
   */
  getSystemStatus() {
    return {
      integration: {
        initialized: this.isInitialized,
        activeAgents: this.agentContexts.size,
        communicationChannels: this.crossAgentChannels.size
      },
      memory: this.memory.getStats(),
      queen: this.queen.getStatus(),
      channels: Object.fromEntries(
        Array.from(this.crossAgentChannels.entries()).map(([name, channel]) => [
          name,
          {
            subscribers: channel.subscribers.size,
            messageCount: channel.messageHistory.length
          }
        ])
      )
    };
  }
  
  /**
   * Shutdown the integration
   */
  async shutdown() {
    console.log('🔄 Shutting down Hive-Mind integration...');
    
    try {
      // Clean up all agents
      for (const agentId of this.agentContexts.keys()) {
        await this.cleanupAgentMemory(agentId, false); // Preserve contexts
      }
      
      // Shutdown queen controller
      await this.queen.shutdown();
      
      // Shutdown memory store
      await this.memory.shutdown();
      
      console.log('✅ Hive-Mind integration shutdown complete');
      this.emit('integration-shutdown');
      
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      throw error;
    }
  }
}

module.exports = HiveMindIntegration;

// Example usage
if (require.main === module) {
  async function demonstrateIntegration() {
    console.log('🚀 Starting Hive-Mind Integration Demonstration\n');
    
    const integration = new HiveMindIntegration({
      projectRoot: process.cwd(),
      maxConcurrentAgents: 5
    });
    
    // Wait for initialization
    await new Promise((resolve) => {
      integration.once('integration-ready', resolve);
    });
    
    console.log('✅ Integration ready, demonstrating features...\n');
    
    try {
      // Spawn multiple agents
      const analyzer = await integration.spawnAgent('code-analyzer', {
        id: 'analyze-codebase',
        description: 'Analyze the entire codebase for patterns'
      });
      
      const tester = await integration.spawnAgent('test-runner', {
        id: 'run-tests',
        description: 'Execute all test suites'
      });
      
      console.log(`🤖 Spawned agents: ${analyzer}, ${tester}\n`);
      
      // Demonstrate cross-agent data sharing
      await integration.shareDataBetweenAgents(analyzer, tester, {
        analysisResults: {
          complexity: 'medium',
          testCoverage: 0.75,
          issues: ['missing-tests-in-module-x']
        }
      }, { type: 'analysis-results' });
      
      // Send channel messages
      await integration.sendChannelMessage('task-coordination', {
        type: 'coordination-request',
        from: analyzer,
        message: 'Analysis complete, ready for testing phase'
      });
      
      // Get system status
      const status = integration.getSystemStatus();
      console.log('📊 System Status:', JSON.stringify(status, null, 2));
      
      // Get aggregated results
      const results = await integration.getAggregatedResults();
      console.log(`📋 Aggregated Results: ${results.totalResults} result sets\n`);
      
      console.log('✅ Demonstration complete!');
      
    } catch (error) {
      console.error('❌ Demonstration failed:', error);
    } finally {
      // Shutdown
      await integration.shutdown();
    }
  }
  
  demonstrateIntegration().catch(console.error);
}