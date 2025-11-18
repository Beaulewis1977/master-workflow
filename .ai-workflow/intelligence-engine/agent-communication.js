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
    
    // Core messaging infrastructure
    this.messageQueue = [];
    this.maxQueueSize = 200;
    this.chainedTasks = new Map();
    this.activeChannels = new Map();
    this.messageHistory = [];
    this.maxHistorySize = 1000;
    
    // Agent registry
    this.registeredAgents = new Map();
    this.agentSubscriptions = new Map();
    
    // Performance tracking
    this.metrics = {
      messagesSent: 0,
      messagesReceived: 0,
      messagesDropped: 0,
      averageLatency: 0,
      taskChainsCompleted: 0,
      parallelExecutions: 0
    };
    
    // Shared memory integration
    this.sharedMemory = sharedMemory;
    
    // Message priorities
    this.priorityLevels = {
      CRITICAL: 0,
      HIGH: 1,
      NORMAL: 2,
      LOW: 3
    };
    
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
   * Start the message processor for handling queued messages
   */
  startMessageProcessor() {
    this.processorInterval = setInterval(() => {
      this.processMessageQueue();
    }, 100); // Process every 100ms
  }

  /**
   * Register an agent with the communication system
   */
  registerAgent(agentId, agentConfig) {
    this.registeredAgents.set(agentId, {
      id: agentId,
      name: agentConfig.name,
      type: agentConfig.type,
      status: 'active',
      registeredAt: Date.now(),
      lastActivity: Date.now(),
      messageCount: 0
    });
    
    // Create dedicated channel for agent
    this.activeChannels.set(agentId, new EventEmitter());
    
    // Initialize subscription list
    this.agentSubscriptions.set(agentId, new Set());
    
    this.emit('agent.registered', { agentId, config: agentConfig });
    
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
   * Send a message from one agent to another
   */
  async sendMessage(fromAgent, toAgent, message, options = {}) {
    const messageId = crypto.randomUUID();
    const timestamp = Date.now();
    
    // Validate agents
    if (!this.registeredAgents.has(fromAgent) || !this.registeredAgents.has(toAgent)) {
      throw new Error('Invalid agent ID(s)');
    }
    
    // Construct message envelope
    const envelope = {
      id: messageId,
      from: fromAgent,
      to: toAgent,
      timestamp,
      priority: options.priority || this.priorityLevels.NORMAL,
      type: message.type || 'generic',
      payload: message,
      requiresAck: options.requiresAck || false,
      timeout: options.timeout || 30000,
      retries: options.retries || 0
    };
    
    // Add to queue if queue not full
    if (this.messageQueue.length >= this.maxQueueSize) {
      this.metrics.messagesDropped++;
      this.emit('queue.full', { dropped: envelope });
      
      if (options.priority === this.priorityLevels.CRITICAL) {
        // Force process critical messages
        this.messageQueue.shift(); // Remove oldest
        this.messageQueue.push(envelope);
      } else {
        throw new Error('Message queue full');
      }
    } else {
      this.messageQueue.push(envelope);
    }
    
    // Sort queue by priority
    this.messageQueue.sort((a, b) => a.priority - b.priority);
    
    // Update metrics
    this.metrics.messagesSent++;
    this.updateAgentActivity(fromAgent);
    
    // Store in shared memory if available
    if (this.sharedMemory) {
      await this.sharedMemory.set(
        `messages:${messageId}`,
        envelope,
        { ttl: 3600000 } // 1 hour TTL
      );
    }
    
    this.emit('message.sent', envelope);
    
    return messageId;
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
   * Process the message queue
   */
  async processMessageQueue() {
    if (this.messageQueue.length === 0) return;
    
    // Process up to 10 messages per cycle
    const messagesToProcess = Math.min(10, this.messageQueue.length);
    
    for (let i = 0; i < messagesToProcess; i++) {
      const message = this.messageQueue.shift();
      if (!message) continue;
      
      try {
        await this.deliverMessage(message);
      } catch (error) {
        console.error('Message delivery failed:', error);
        
        // Retry logic
        if (message.retries > 0) {
          message.retries--;
          this.messageQueue.push(message);
        } else {
          this.emit('message.failed', { message, error });
        }
      }
    }
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