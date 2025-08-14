/**
 * Agent Communication System
 * 
 * Provides inter-agent messaging, task chaining, and parallel execution
 * for the Queen Controller's 10-agent architecture.
 * 
 * @module agent-communication
 * @version 3.0.0
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

/**
 * AgentCommunication class manages all inter-agent messaging and coordination
 */
class AgentCommunication extends EventEmitter {
  constructor(sharedMemory = null) {
    super();
    
    // Core messaging infrastructure - PERFORMANCE OPTIMIZED
    this.messageQueue = [];
    this.priorityQueues = new Map(); // Separate queues by priority
    this.maxQueueSize = 500; // Increased for better throughput
    this.chainedTasks = new Map();
    this.activeChannels = new Map();
    this.messageHistory = [];
    this.maxHistorySize = 500; // Reduced to save memory
    
    // Message batching for performance
    this.batchSize = 20; // Process multiple messages at once
    this.batchTimeout = 10; // Max wait time for batching (ms)
    this.messageBatch = [];
    this.batchTimer = null;
    
    // Connection pooling for agents
    this.connectionPools = new Map();
    this.maxConnectionsPerAgent = 5;
    
    // Agent registry with performance optimizations
    this.registeredAgents = new Map();
    this.agentSubscriptions = new Map();
    this.agentChannelCache = new Map(); // Cache for faster lookups
    
    // Enhanced performance tracking
    this.metrics = {
      messagesSent: 0,
      messagesReceived: 0,
      messagesDropped: 0,
      averageLatency: 0,
      taskChainsCompleted: 0,
      parallelExecutions: 0,
      batchesProcessed: 0,
      averageBatchSize: 0,
      queueProcessingTime: 0,
      peakQueueSize: 0,
      throughputPerSecond: 0
    };
    
    // Performance monitoring
    this.lastThroughputCheck = Date.now();
    this.messagesInLastSecond = 0;
    
    // Shared memory integration
    this.sharedMemory = sharedMemory;
    
    // Enhanced message priorities with weights
    this.priorityLevels = {
      CRITICAL: { level: 0, weight: 100 },
      HIGH: { level: 1, weight: 10 },
      NORMAL: { level: 2, weight: 1 },
      LOW: { level: 3, weight: 0.1 }
    };
    
    // Initialize priority queues
    Object.keys(this.priorityLevels).forEach(priority => {
      this.priorityQueues.set(priority, []);
    });
    
    // Initialize event bus
    this.initializeEventBus();
    
    // Start message processor
    this.startMessageProcessor();
  }

  /**
   * Initialize the event bus for agent communication
   */
  initializeEventBus() {
    // Set up core event listeners
    this.on('message.sent', this.handleMessageSent.bind(this));
    this.on('message.received', this.handleMessageReceived.bind(this));
    this.on('task.chained', this.handleTaskChained.bind(this));
    this.on('task.completed', this.handleTaskCompleted.bind(this));
    
    // Error handling
    this.on('error', this.handleError.bind(this));
  }

  /**
   * Start the message processor for handling queued messages - PERFORMANCE OPTIMIZED
   */
  startMessageProcessor() {
    // Dynamic processing interval based on queue size and load
    let processingInterval = 25; // Start with 25ms for better performance (was 100ms)
    
    const adaptiveProcessing = async () => {
      const queueSize = this.getTotalQueueSize();
      const startTime = Date.now();
      
      try {
        // Adaptive interval: faster when busy, slower when idle
        if (queueSize > 100) {
          processingInterval = 5; // High load - process very frequently
        } else if (queueSize > 50) {
          processingInterval = 10; // Medium-high load
        } else if (queueSize > 20) {
          processingInterval = 15; // Medium load  
        } else if (queueSize > 5) {
          processingInterval = 25; // Normal load
        } else if (queueSize === 0) {
          processingInterval = 100; // Idle - save CPU (was 200ms, now 100ms)
        } else {
          processingInterval = 50; // Low load
        }
        
        // Update peak queue size metric
        if (queueSize > this.metrics.peakQueueSize) {
          this.metrics.peakQueueSize = queueSize;
        }
        
        // Process messages
        await this.processMessageQueue();
        
        // Update processing time metric
        const processingTime = Date.now() - startTime;
        this.metrics.queueProcessingTime = 
          (this.metrics.queueProcessingTime * 0.9) + (processingTime * 0.1); // Exponential moving average
        
        // Update throughput metric
        this.updateThroughputMetrics();
        
      } catch (error) {
        console.error('PERFORMANCE FIX: Message processing error:', error);
        processingInterval = Math.min(processingInterval * 2, 1000); // Back off on error, max 1s
      }
      
      // Schedule next run
      this.processorTimeout = setTimeout(adaptiveProcessing, processingInterval);
    };
    
    // Start adaptive processing
    adaptiveProcessing();
    
    // Track processing metrics
    this.processingMetrics = {
      intervalAdjustments: 0,
      avgProcessingTime: 0,
      batchesProcessed: 0
    };
    
    // Start throughput monitoring
    this.startThroughputMonitoring();
    
    console.log('PERFORMANCE FIX: Adaptive message processor started with 25ms base interval (was 100ms)');
  }
  
  /**
   * Get total queue size across all priority levels
   */
  getTotalQueueSize() {
    let total = this.messageQueue.length;
    for (const queue of this.priorityQueues.values()) {
      total += queue.length;
    }
    return total;
  }
  
  /**
   * Monitor throughput for performance tracking
   */
  startThroughputMonitoring() {
    setInterval(() => {
      const now = Date.now();
      const elapsed = now - this.lastThroughputCheck;
      
      if (elapsed >= 1000) { // Update every second
        this.metrics.throughputPerSecond = 
          Math.round((this.messagesInLastSecond * 1000) / elapsed);
        
        this.messagesInLastSecond = 0;
        this.lastThroughputCheck = now;
      }
    }, 1000);
  }
  
  /**
   * Update throughput metrics
   */
  updateThroughputMetrics() {
    this.messagesInLastSecond++;
  }

  /**
   * Register an agent with the communication system - FIXED: Enhanced validation and caching
   */
  registerAgent(agentId, agentConfig) {
    // Validate agent registration data
    if (!agentId || typeof agentId !== 'string') {
      throw new Error('Agent ID must be a non-empty string');
    }
    
    if (!agentConfig || typeof agentConfig !== 'object') {
      throw new Error('Agent config must be a valid object');
    }
    
    // Check if agent is already registered
    if (this.registeredAgents.has(agentId)) {
      console.warn(`REGISTRY FIX: Agent ${agentId} already registered, updating configuration`);
      // Update existing registration instead of creating new one
      const existingAgent = this.registeredAgents.get(agentId);
      existingAgent.name = agentConfig.name || existingAgent.name;
      existingAgent.type = agentConfig.type || existingAgent.type;
      existingAgent.lastActivity = Date.now();
      existingAgent.status = 'active';
      
      this.emit('agent.updated', { agentId, config: agentConfig });
      return true;
    }
    
    const agentData = {
      id: agentId,
      name: agentConfig.name || agentId,
      type: agentConfig.type || 'unknown',
      status: 'active',
      registeredAt: Date.now(),
      lastActivity: Date.now(),
      messageCount: 0,
      capabilities: agentConfig.capabilities || [],
      contextWindow: agentConfig.contextWindow || 200000
    };
    
    this.registeredAgents.set(agentId, agentData);
    
    // Create dedicated channel for agent with error handling
    const agentChannel = new EventEmitter();
    agentChannel.setMaxListeners(100); // Prevent memory leaks
    agentChannel.on('error', (error) => {
      console.error(`REGISTRY FIX: Channel error for agent ${agentId}:`, error);
      this.emit('agent.channel.error', { agentId, error });
    });
    
    this.activeChannels.set(agentId, agentChannel);
    
    // Initialize subscription list
    this.agentSubscriptions.set(agentId, new Set());
    
    // Update agent channel cache for faster lookups
    this.agentChannelCache.set(agentId, agentChannel);
    
    console.log(`REGISTRY FIX: Agent ${agentId} registered successfully as ${agentConfig.type}`);
    
    this.emit('agent.registered', { 
      agentId, 
      config: agentConfig,
      registeredAt: agentData.registeredAt
    });
    
    return true;
  }

  /**
   * Unregister an agent from the communication system
   */
  unregisterAgent(agentId) {
    if (!this.registeredAgents.has(agentId)) {
      return false;
    }
    
    // Clean up agent data
    this.registeredAgents.delete(agentId);
    this.activeChannels.delete(agentId);
    this.agentSubscriptions.delete(agentId);
    
    // Remove from any active task chains
    for (const [chainId, chain] of this.chainedTasks) {
      chain.tasks = chain.tasks.filter(task => task.agentId !== agentId);
    }
    
    this.emit('agent.unregistered', { agentId });
    
    return true;
  }

  /**
   * Send a message from one agent to another - PERFORMANCE OPTIMIZED
   * FIXED: Enhanced agent validation and registry synchronization
   */
  async sendMessage(fromAgent, toAgent, message, options = {}) {
    const messageId = crypto.randomUUID();
    const timestamp = Date.now();
    const startTime = performance.now();
    
    try {
      // Enhanced agent validation with registry synchronization
      const fromAgentData = this.registeredAgents.get(fromAgent);
      
      // Special handling for system/broadcast messages
      if (fromAgent === 'system' || fromAgent === 'queen-controller') {
        // Allow system messages even without registration
      } else if (!fromAgentData) {
        // Try to refresh registry before failing
        await this.refreshAgentRegistry();
        const refreshedFromAgent = this.registeredAgents.get(fromAgent);
        if (!refreshedFromAgent) {
          throw new Error(`Invalid source agent ID: ${fromAgent} not found in registry`);
        }
      }
      
      // Handle broadcast messages
      if (toAgent === 'broadcast' || toAgent === '*' || toAgent === 'all') {
        return await this.handleBroadcastMessage(fromAgent, message, options);
      }
      
      // Validate target agent with retry
      const toAgentData = this.registeredAgents.get(toAgent);
      if (!toAgentData) {
        // Try registry refresh for target agent
        await this.refreshAgentRegistry();
        const refreshedToAgent = this.registeredAgents.get(toAgent);
        if (!refreshedToAgent) {
          throw new Error(`Invalid target agent ID: ${toAgent} not found in registry`);
        }
      }
    
      // Construct optimized message envelope
      const priority = options.priority !== undefined ? options.priority : this.priorityLevels.NORMAL.level;
      const envelope = {
        id: messageId,
        from: fromAgent,
        to: toAgent,
        timestamp,
        priority,
        type: message.type || 'generic',
        payload: message,
        requiresAck: options.requiresAck || false,
        timeout: options.timeout || 30000,
        retries: options.retries || 0,
        originalRetries: options.retries || 0,
        size: JSON.stringify(message).length // Track message size
      };
    
      // Enhanced queue management with priority-based queuing
      const totalQueueSize = this.getTotalQueueSize();
      
      if (totalQueueSize >= this.maxQueueSize) {
        // Handle queue overflow intelligently
        if (priority === this.priorityLevels.CRITICAL.level) {
          // Critical messages: evict lowest priority messages
          this.evictLowPriorityMessages(1);
        } else if (priority === this.priorityLevels.HIGH.level) {
          // High priority: try to evict normal/low priority
          const evicted = this.evictLowPriorityMessages(1, ['LOW', 'NORMAL']);
          if (!evicted) {
            this.metrics.messagesDropped++;
            this.emit('queue.full', { dropped: envelope });
            throw new Error('Message queue full - could not evict lower priority messages');
          }
        } else {
          this.metrics.messagesDropped++;
          this.emit('queue.full', { dropped: envelope });
          throw new Error('Message queue full');
        }
      }
      
      // Add to appropriate priority queue
      this.addMessageToQueue(envelope);
    
      // Update metrics and agent activity
      this.metrics.messagesSent++;
      this.updateAgentActivity(fromAgent);
      
      // Store in shared memory asynchronously for better performance
      if (this.sharedMemory) {
        // Don't await - store asynchronously to avoid blocking
        this.sharedMemory.set(
          `messages:${messageId}`,
          envelope,
          { ttl: 3600000 } // 1 hour TTL
        ).catch(error => {
          console.warn('PERFORMANCE FIX: Failed to store message in shared memory:', error.message);
        });
      }
      
      const sendTime = performance.now() - startTime;
      
      // Emit event with performance data
      this.emit('message.sent', {
        ...envelope,
        sendTime,
        queueSize: totalQueueSize
      });
      
      // Track send performance
      if (sendTime > 10) { // Log slow sends
        console.log(`PERFORMANCE FIX: Message send took ${sendTime.toFixed(2)}ms for ${messageId}`);
      }
      
      return messageId;
      
    } catch (error) {
      const sendTime = performance.now() - startTime;
      console.error(`PERFORMANCE FIX: Send message failed in ${sendTime.toFixed(2)}ms:`, error.message);
      throw error;
    }
  }
  
  /**
   * Evict low priority messages to make room
   */
  evictLowPriorityMessages(count, allowedPriorities = ['LOW', 'NORMAL']) {
    let evicted = 0;
    
    for (const priority of allowedPriorities.reverse()) {
      const queue = this.priorityQueues.get(priority);
      if (queue && queue.length > 0) {
        const toEvict = Math.min(count - evicted, queue.length);
        const evictedMessages = queue.splice(-toEvict); // Remove from end (oldest)
        
        evictedMessages.forEach(msg => {
          this.emit('message.evicted', { message: msg, reason: 'queue_full' });
        });
        
        evicted += toEvict;
        
        if (evicted >= count) {
          break;
        }
      }
    }
    
    if (evicted > 0) {
      this.metrics.messagesDropped += evicted;
      console.log(`PERFORMANCE FIX: Evicted ${evicted} low-priority messages`);
    }
    
    return evicted > 0;
  }

  /**
   * Broadcast a message to all registered agents
   */
  async broadcastToAll(message, options = {}) {
    const fromAgent = options.from || 'system';
    const messageIds = [];
    
    for (const [agentId] of this.registeredAgents) {
      if (agentId !== fromAgent) {
        try {
          const messageId = await this.sendMessage(fromAgent, agentId, message, options);
          messageIds.push(messageId);
        } catch (error) {
          console.error(`Failed to broadcast to ${agentId}:`, error);
        }
      }
    }
    
    this.emit('broadcast.sent', { 
      from: fromAgent, 
      message, 
      recipients: messageIds.length 
    });
    
    return messageIds;
  }

  /**
   * Chain multiple tasks for sequential execution
   */
  async chainTasks(taskSequence, options = {}) {
    const chainId = crypto.randomUUID();
    
    // Validate task sequence
    if (!Array.isArray(taskSequence) || taskSequence.length === 0) {
      throw new Error('Invalid task sequence');
    }
    
    // Create task chain
    const chain = {
      id: chainId,
      tasks: taskSequence.map((task, index) => ({
        ...task,
        index,
        status: 'pending',
        result: null,
        startTime: null,
        endTime: null
      })),
      currentIndex: 0,
      status: 'pending',
      createdAt: Date.now(),
      options
    };
    
    this.chainedTasks.set(chainId, chain);
    
    // Start execution
    this.executeChain(chainId);
    
    this.emit('task.chained', { chainId, taskCount: taskSequence.length });
    
    return chainId;
  }

  /**
   * Execute tasks in a chain sequentially
   */
  async executeChain(chainId) {
    const chain = this.chainedTasks.get(chainId);
    if (!chain) return;
    
    chain.status = 'running';
    
    for (let i = 0; i < chain.tasks.length; i++) {
      const task = chain.tasks[i];
      
      if (chain.status === 'cancelled') {
        break;
      }
      
      try {
        task.status = 'running';
        task.startTime = Date.now();
        
        // Send task to agent
        const messageId = await this.sendMessage(
          'queen-controller',
          task.agentId,
          {
            type: 'task.execute',
            task: task.payload,
            chainId,
            taskIndex: i,
            previousResult: i > 0 ? chain.tasks[i - 1].result : null
          },
          { priority: this.priorityLevels.HIGH }
        );
        
        // Wait for completion (with timeout)
        const result = await this.waitForTaskCompletion(
          messageId,
          task.timeout || 60000
        );
        
        task.result = result;
        task.status = 'completed';
        task.endTime = Date.now();
        
      } catch (error) {
        task.status = 'failed';
        task.endTime = Date.now();
        task.error = error.message;
        
        if (!chain.options.continueOnError) {
          chain.status = 'failed';
          break;
        }
      }
      
      chain.currentIndex = i + 1;
    }
    
    // Update chain status
    if (chain.status === 'running') {
      chain.status = chain.tasks.every(t => t.status === 'completed') 
        ? 'completed' 
        : 'partial';
    }
    
    this.metrics.taskChainsCompleted++;
    
    this.emit('chain.completed', {
      chainId,
      status: chain.status,
      duration: Date.now() - chain.createdAt
    });
    
    return chain;
  }

  /**
   * Execute multiple tasks in parallel
   */
  async parallelExecute(tasks, options = {}) {
    const executionId = crypto.randomUUID();
    const startTime = Date.now();
    
    // Validate tasks
    if (!Array.isArray(tasks) || tasks.length === 0) {
      throw new Error('Invalid task list');
    }
    
    // Create parallel execution promises
    const taskPromises = tasks.map(async (task) => {
      try {
        const messageId = await this.sendMessage(
          'queen-controller',
          task.agentId,
          {
            type: 'task.execute',
            task: task.payload,
            executionId,
            parallel: true
          },
          { 
            priority: options.priority || this.priorityLevels.NORMAL,
            timeout: task.timeout || 60000
          }
        );
        
        const result = await this.waitForTaskCompletion(
          messageId,
          task.timeout || 60000
        );
        
        return {
          taskId: task.id,
          agentId: task.agentId,
          status: 'completed',
          result
        };
        
      } catch (error) {
        return {
          taskId: task.id,
          agentId: task.agentId,
          status: 'failed',
          error: error.message
        };
      }
    });
    
    // Wait for all tasks with optional timeout
    let results;
    if (options.timeout) {
      results = await Promise.race([
        Promise.allSettled(taskPromises),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Parallel execution timeout')), options.timeout)
        )
      ]);
    } else {
      results = await Promise.allSettled(taskPromises);
    }
    
    this.metrics.parallelExecutions++;
    
    const duration = Date.now() - startTime;
    
    this.emit('parallel.completed', {
      executionId,
      taskCount: tasks.length,
      duration,
      results: results.map(r => r.status === 'fulfilled' ? r.value : r.reason)
    });
    
    return {
      executionId,
      duration,
      results: results.map(r => r.status === 'fulfilled' ? r.value : r.reason)
    };
  }

  /**
   * Subscribe an agent to specific event types
   */
  subscribeToEvents(agentId, eventTypes) {
    if (!this.registeredAgents.has(agentId)) {
      throw new Error('Agent not registered');
    }
    
    const subscriptions = this.agentSubscriptions.get(agentId);
    
    eventTypes.forEach(eventType => {
      subscriptions.add(eventType);
      
      // Create event listener
      this.on(eventType, (data) => {
        this.sendMessage('system', agentId, {
          type: 'event.notification',
          eventType,
          data
        }, { priority: this.priorityLevels.HIGH });
      });
    });
    
    return true;
  }

  /**
   * Process the message queue - PERFORMANCE OPTIMIZED
   */
  async processMessageQueue() {
    const startTime = Date.now();
    
    // Process priority queues first, then main queue
    const allMessages = this.collectMessagesForBatch();
    
    if (allMessages.length === 0) {
      return;
    }
    
    // Adaptive batch size based on queue load
    const queueSize = this.getTotalQueueSize();
    const adaptiveBatchSize = Math.min(
      queueSize > 100 ? 50 : // High load - larger batches
      queueSize > 50 ? 30 :  // Medium load
      queueSize > 20 ? 20 :  // Normal load
      15,                    // Low load
      allMessages.length
    );
    
    const messagesToProcess = allMessages.slice(0, adaptiveBatchSize);
    
    // Process messages in parallel batches for better performance
    const batchPromises = [];
    const concurrencyLimit = Math.min(10, messagesToProcess.length);
    
    for (let i = 0; i < messagesToProcess.length; i += concurrencyLimit) {
      const batch = messagesToProcess.slice(i, i + concurrencyLimit);
      batchPromises.push(this.processBatch(batch));
    }
    
    try {
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Update metrics
      this.metrics.batchesProcessed++;
      this.metrics.averageBatchSize = 
        ((this.metrics.averageBatchSize * (this.metrics.batchesProcessed - 1)) + messagesToProcess.length) / 
        this.metrics.batchesProcessed;
      
      // Handle failed batches
      batchResults.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`PERFORMANCE FIX: Batch ${index} failed:`, result.reason);
        }
      });
      
    } catch (error) {
      console.error('PERFORMANCE FIX: Batch processing failed:', error);
    }
    
    const processingTime = Date.now() - startTime;
    console.log(`PERFORMANCE FIX: Processed ${messagesToProcess.length} messages in ${processingTime}ms (${Math.round(messagesToProcess.length / (processingTime / 1000))} msgs/sec)`);
  }
  
  /**
   * Collect messages from all queues for batch processing
   */
  collectMessagesForBatch() {
    const messages = [];
    
    // Collect from priority queues in order (critical first)
    const priorityOrder = ['CRITICAL', 'HIGH', 'NORMAL', 'LOW'];
    
    for (const priority of priorityOrder) {
      const queue = this.priorityQueues.get(priority);
      if (queue && queue.length > 0) {
        // Take more messages from higher priority queues
        const takeCount = priority === 'CRITICAL' ? queue.length : 
                         priority === 'HIGH' ? Math.min(10, queue.length) :
                         priority === 'NORMAL' ? Math.min(5, queue.length) :
                         Math.min(2, queue.length);
        
        messages.push(...queue.splice(0, takeCount));
      }
    }
    
    // Add from main queue (for backward compatibility)
    if (this.messageQueue.length > 0) {
      const takeCount = Math.min(10, this.messageQueue.length);
      messages.push(...this.messageQueue.splice(0, takeCount));
    }
    
    return messages;
  }
  
  /**
   * Process a batch of messages concurrently
   */
  async processBatch(messages) {
    const batchPromises = messages.map(async (message) => {
      try {
        await this.deliverMessage(message);
        return { success: true, messageId: message.id };
      } catch (error) {
        // Retry logic with exponential backoff
        if (message.retries > 0) {
          message.retries--;
          message.nextRetry = Date.now() + (Math.pow(2, (message.originalRetries || 3) - message.retries) * 100);
          
          // Add back to appropriate queue
          this.addMessageToQueue(message);
          
          return { success: false, messageId: message.id, retry: true, error: error.message };
        } else {
          this.emit('message.failed', { message, error });
          return { success: false, messageId: message.id, retry: false, error: error.message };
        }
      }
    });
    
    return await Promise.allSettled(batchPromises);
  }
  
  /**
   * Add message to appropriate priority queue
   */
  addMessageToQueue(message) {
    const priority = this.getPriorityName(message.priority);
    const queue = this.priorityQueues.get(priority);
    
    if (queue) {
      // Insert with delay consideration for retries
      if (message.nextRetry && Date.now() < message.nextRetry) {
        setTimeout(() => {
          queue.push(message);
        }, message.nextRetry - Date.now());
      } else {
        queue.push(message);
      }
    } else {
      // Fallback to main queue
      this.messageQueue.push(message);
    }
  }
  
  /**
   * Get priority name from priority level
   */
  getPriorityName(priorityLevel) {
    for (const [name, config] of Object.entries(this.priorityLevels)) {
      if (config.level === priorityLevel) {
        return name;
      }
    }
    return 'NORMAL';
  }

  /**
   * Deliver a message to its destination
   */
  async deliverMessage(envelope) {
    const toAgent = this.registeredAgents.get(envelope.to);
    if (!toAgent) {
      throw new Error(`Agent ${envelope.to} not found`);
    }
    
    const channel = this.activeChannels.get(envelope.to);
    if (!channel) {
      throw new Error(`Channel for ${envelope.to} not found`);
    }
    
    // Calculate latency
    const latency = Date.now() - envelope.timestamp;
    this.updateLatencyMetrics(latency);
    
    // Deliver message
    channel.emit('message', envelope);
    
    // Update metrics
    this.metrics.messagesReceived++;
    this.updateAgentActivity(envelope.to);
    toAgent.messageCount++;
    
    // Add to history
    this.addToHistory(envelope);
    
    // Store delivery confirmation if needed
    if (envelope.requiresAck && this.sharedMemory) {
      await this.sharedMemory.set(
        `delivery:${envelope.id}`,
        {
          delivered: true,
          timestamp: Date.now(),
          latency
        }
      );
    }
    
    this.emit('message.delivered', { 
      messageId: envelope.id, 
      to: envelope.to,
      latency 
    });
  }

  /**
   * Wait for task completion
   */
  waitForTaskCompletion(messageId, timeout) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.removeListener(`task.result.${messageId}`, handler);
        reject(new Error('Task timeout'));
      }, timeout);
      
      const handler = (result) => {
        clearTimeout(timer);
        resolve(result);
      };
      
      this.once(`task.result.${messageId}`, handler);
    });
  }

  /**
   * Update agent activity timestamp
   */
  updateAgentActivity(agentId) {
    const agent = this.registeredAgents.get(agentId);
    if (agent) {
      agent.lastActivity = Date.now();
    }
  }

  /**
   * Update latency metrics
   */
  updateLatencyMetrics(latency) {
    const alpha = 0.1; // Exponential moving average factor
    this.metrics.averageLatency = 
      alpha * latency + (1 - alpha) * this.metrics.averageLatency;
  }

  /**
   * Add message to history
   */
  addToHistory(envelope) {
    this.messageHistory.push({
      id: envelope.id,
      from: envelope.from,
      to: envelope.to,
      type: envelope.type,
      timestamp: envelope.timestamp
    });
    
    // Trim history if too large
    if (this.messageHistory.length > this.maxHistorySize) {
      this.messageHistory.shift();
    }
  }

  /**
   * Handle message sent event
   */
  handleMessageSent(envelope) {
    console.log(`Message sent: ${envelope.id} from ${envelope.from} to ${envelope.to}`);
  }

  /**
   * Handle message received event
   */
  handleMessageReceived(envelope) {
    console.log(`Message received: ${envelope.id} by ${envelope.to}`);
  }

  /**
   * Handle task chained event
   */
  handleTaskChained(data) {
    console.log(`Task chain created: ${data.chainId} with ${data.taskCount} tasks`);
  }

  /**
   * Handle task completed event
   */
  handleTaskCompleted(data) {
    console.log(`Task completed: ${data.taskId} with status ${data.status}`);
  }

  /**
   * Handle errors
   */
  handleError(error) {
    console.error('Communication error:', error);
  }

  /**
   * Get communication metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      queueSize: this.messageQueue.length,
      registeredAgents: this.registeredAgents.size,
      activeChains: this.chainedTasks.size,
      historySize: this.messageHistory.length
    };
  }

  /**
   * Get agent status
   */
  getAgentStatus(agentId) {
    const agent = this.registeredAgents.get(agentId);
    if (!agent) return null;
    
    return {
      ...agent,
      subscriptions: Array.from(this.agentSubscriptions.get(agentId) || []),
      queuedMessages: this.messageQueue.filter(m => m.to === agentId).length
    };
  }

  /**
   * Clear message queue
   */
  clearQueue() {
    const dropped = this.messageQueue.length;
    this.messageQueue = [];
    this.metrics.messagesDropped += dropped;
    
    this.emit('queue.cleared', { dropped });
  }

  /**
   * Handle broadcast messages with enhanced error handling - FIXED
   */
  async handleBroadcastMessage(fromAgent, message, options = {}) {
    const broadcastId = crypto.randomUUID();
    const messageIds = [];
    const startTime = performance.now();
    
    try {
      // Refresh registry to ensure we have latest agent list
      await this.refreshAgentRegistry();
      
      const activeAgents = [];
      for (const [agentId, agentData] of this.registeredAgents) {
        if (agentId !== fromAgent && 
            agentData.status === 'active' && 
            Date.now() - agentData.lastActivity < 300000) { // 5 minutes
          activeAgents.push(agentId);
        }
      }
      
      console.log(`BROADCAST FIX: Broadcasting from ${fromAgent} to ${activeAgents.length} active agents`);
      
      // Create message envelope for broadcast
      const broadcastEnvelope = {
        id: broadcastId,
        from: fromAgent,
        to: 'broadcast',
        timestamp: Date.now(),
        priority: options.priority || this.priorityLevels.NORMAL.level,
        type: 'broadcast',
        payload: message,
        targetAgents: activeAgents,
        requiresAck: options.requiresAck || false
      };
      
      // Send to each active agent with individual tracking
      for (const targetAgent of activeAgents) {
        try {
          const individualMessageId = await this.sendIndividualMessage(
            fromAgent, targetAgent, message, {
              ...options,
              broadcastId,
              isBroadcast: true
            }
          );
          messageIds.push(individualMessageId);
        } catch (error) {
          console.error(`BROADCAST FIX: Failed to send to ${targetAgent}:`, error.message);
        }
      }
      
      // Store broadcast envelope for tracking
      if (this.sharedMemory) {
        this.sharedMemory.set(
          `broadcast:${broadcastId}`,
          broadcastEnvelope,
          { ttl: 300000 } // 5 minutes TTL
        ).catch(error => {
          console.warn('BROADCAST FIX: Failed to store broadcast envelope:', error.message);
        });
      }
      
      const broadcastTime = performance.now() - startTime;
      
      this.emit('message.broadcast', {
        broadcastId,
        fromAgent,
        targetCount: activeAgents.length,
        successCount: messageIds.length,
        broadcastTime,
        messageIds
      });
      
      console.log(`BROADCAST FIX: Broadcast complete in ${broadcastTime.toFixed(2)}ms - ${messageIds.length}/${activeAgents.length} successful`);
      
      return messageIds;
      
    } catch (error) {
      const broadcastTime = performance.now() - startTime;
      console.error(`BROADCAST FIX: Broadcast failed in ${broadcastTime.toFixed(2)}ms:`, error.message);
      throw error;
    }
  }
  
  /**
   * Send individual message with enhanced validation - FIXED
   */
  async sendIndividualMessage(fromAgent, toAgent, message, options = {}) {
    const messageId = crypto.randomUUID();
    const timestamp = Date.now();
    
    // Create message envelope with validation
    const envelope = {
      id: messageId,
      from: fromAgent,
      to: toAgent,
      timestamp,
      priority: options.priority || this.priorityLevels.NORMAL.level,
      type: message.type || 'generic',
      payload: message,
      requiresAck: options.requiresAck || false,
      timeout: options.timeout || 30000,
      retries: options.retries || 0,
      originalRetries: options.retries || 0,
      size: JSON.stringify(message).length,
      broadcastId: options.broadcastId,
      isBroadcast: options.isBroadcast || false
    };
    
    // Add to appropriate queue
    this.addMessageToQueue(envelope);
    
    // Update metrics
    this.metrics.messagesSent++;
    this.updateAgentActivity(fromAgent);
    
    return messageId;
  }
  
  /**
   * Refresh agent registry to sync with current state - NEW FIX
   */
  async refreshAgentRegistry() {
    try {
      // Clean up inactive agents (haven't been active in 10 minutes)
      const cutoffTime = Date.now() - 600000; // 10 minutes
      const inactiveAgents = [];
      
      for (const [agentId, agentData] of this.registeredAgents) {
        if (agentData.lastActivity < cutoffTime) {
          inactiveAgents.push(agentId);
        }
      }
      
      for (const inactiveAgentId of inactiveAgents) {
        console.log(`REGISTRY FIX: Removing inactive agent ${inactiveAgentId}`);
        this.unregisterAgent(inactiveAgentId);
      }
      
      console.log(`REGISTRY FIX: Registry refreshed - ${this.registeredAgents.size} active agents, removed ${inactiveAgents.length} inactive`);
      
    } catch (error) {
      console.error('REGISTRY FIX: Failed to refresh agent registry:', error.message);
    }
  }

  /**
   * Shutdown the communication system
   */
  shutdown() {
    clearInterval(this.processorInterval);
    this.removeAllListeners();
    this.clearQueue();
    
    // Clear all data structures
    this.registeredAgents.clear();
    this.activeChannels.clear();
    this.agentSubscriptions.clear();
    this.chainedTasks.clear();
    this.messageHistory = [];
    
    console.log('Agent communication system shutdown complete');
  }
}

// Export the class
module.exports = AgentCommunication;