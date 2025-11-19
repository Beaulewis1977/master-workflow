/**
 * Agent Communication Bus - Claude Flow 2.0 Enhanced
 * 
 * High-performance communication system for the Queen Controller's
 * multi-agent architecture with topology-aware routing and WASM acceleration.
 */

const EventEmitter = require('events');
const { AgentCommunication } = require('./agent-communication');

class AgentCommunicationBus extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      maxConcurrentConnections: options.maxConcurrentConnections || 100,
      messageBufferSize: options.messageBufferSize || 1000,
      compressionEnabled: options.compressionEnabled !== false,
      encryptionEnabled: options.encryptionEnabled !== false,
      performanceOptimizations: options.performanceOptimizations !== false
    };
    
    // Core communication system
    this.agentComm = new AgentCommunication(options.sharedMemory);
    
    // Claude Flow 2.0 enhancements
    this.topologyManager = null;
    this.wasmCore = null;
    this.performanceMonitor = null;
    
    // Enhanced message routing
    this.routingCache = new Map();
    this.connectionPool = new Map();
    this.messageCompressor = null;
    
    // Performance tracking
    this.busMetrics = {
      totalMessages: 0,
      compressedMessages: 0,
      routingCacheHits: 0,
      averageLatency: 0,
      throughputMbps: 0,
      connectionPoolUtilization: 0,
      topologyOptimizations: 0
    };
    
    this.initialized = false;
  }
  
  /**
   * Initialize the communication bus with Claude Flow 2.0 enhancements
   */
  async initialize(topologyManager = null, wasmCore = null) {
    try {
      console.log('Initializing Agent Communication Bus with Claude Flow 2.0...');
      
      // Initialize base communication system
      await this.agentComm.initialize();
      
      // Set Claude Flow 2.0 components
      this.topologyManager = topologyManager;
      this.wasmCore = wasmCore;
      
      // Initialize performance optimizations
      if (this.config.performanceOptimizations) {
        await this.initializePerformanceOptimizations();
      }
      
      // Set up event forwarding
      this.setupEventForwarding();
      
      this.initialized = true;
      
      console.log('Agent Communication Bus initialized successfully');
      
      this.emit('bus-initialized', {
        topologyAware: !!this.topologyManager,
        wasmAccelerated: !!this.wasmCore,
        performanceOptimized: this.config.performanceOptimizations
      });
      
      return true;
      
    } catch (error) {
      console.error('Failed to initialize Agent Communication Bus:', error);
      throw error;
    }
  }
  
  /**
   * Initialize performance optimizations
   */
  async initializePerformanceOptimizations() {
    // Initialize message compression
    if (this.config.compressionEnabled) {
      this.messageCompressor = {
        compress: (data) => JSON.stringify(data), // Simplified - use zlib in production
        decompress: (data) => JSON.parse(data)
      };
    }
    
    // Initialize connection pooling
    this.initializeConnectionPool();
    
    // Start performance monitoring
    this.startPerformanceMonitoring();
  }
  
  /**
   * Initialize connection pool for efficient agent communication
   */
  initializeConnectionPool() {
    this.connectionPool.set('available', []);
    this.connectionPool.set('active', new Map());
    this.connectionPool.set('stats', {
      created: 0,
      reused: 0,
      destroyed: 0
    });
  }
  
  /**
   * Start performance monitoring
   */
  startPerformanceMonitoring() {
    setInterval(() => {
      this.updatePerformanceMetrics();
    }, 5000); // Update every 5 seconds
  }
  
  /**
   * Set up event forwarding from base communication system
   */
  setupEventForwarding() {
    // Forward important events with enhancements
    this.agentComm.on('message-sent', (data) => {
      this.emit('message-sent', {
        ...data,
        topology: this.topologyManager?.getCurrentTopology(),
        wasmAccelerated: !!this.wasmCore
      });
    });
    
    this.agentComm.on('message-received', (data) => {
      this.emit('message-received', data);
    });
    
    this.agentComm.on('agent-registered', (data) => {
      this.emit('agent-registered', data);
    });
  }
  
  /**
   * Register agent with topology awareness
   */
  async registerAgent(agentId, agentConfig) {
    // Register with base communication system
    const result = this.agentComm.registerAgent(agentId, agentConfig);
    
    // Register with topology manager if available
    if (this.topologyManager) {
      try {
        await this.topologyManager.registerAgent(agentId, agentConfig);
      } catch (error) {
        console.warn(`Failed to register agent ${agentId} with topology manager:`, error.message);
      }
    }
    
    return result;
  }
  
  /**
   * Send message with Claude Flow 2.0 optimizations
   */
  async sendMessage(fromAgent, toAgent, message, options = {}) {
    const startTime = performance.now();
    
    try {
      // Apply topology-aware routing if available
      let routedMessage = message;
      if (this.topologyManager && toAgent !== 'broadcast') {
        try {
          const route = await this.topologyManager.routeMessage(fromAgent, toAgent, message, options);
          routedMessage = {
            ...message,
            route: route,
            topology: this.topologyManager.getCurrentTopology()
          };
        } catch (routingError) {
          console.warn('Topology routing failed, using direct delivery:', routingError.message);
        }
      }
      
      // Apply compression if enabled and message is large
      if (this.messageCompressor && JSON.stringify(routedMessage).length > 1000) {
        routedMessage = {
          ...routedMessage,
          compressed: true,
          payload: this.messageCompressor.compress(routedMessage.payload)
        };
        this.busMetrics.compressedMessages++;
      }
      
      // Send message using base communication system
      const messageId = await this.agentComm.sendMessage(fromAgent, toAgent, routedMessage, options);
      
      // Update metrics
      const latency = performance.now() - startTime;
      this.updateLatencyMetrics(latency);
      this.busMetrics.totalMessages++;
      
      return messageId;
      
    } catch (error) {
      console.error('Enhanced message sending failed:', error);
      throw error;
    }
  }
  
  /**
   * Broadcast message with topology optimization
   */
  async broadcastMessage(fromAgent, message, options = {}) {
    const startTime = performance.now();
    
    try {
      // Use topology-aware broadcasting if available
      if (this.topologyManager) {
        const agents = Array.from(this.agentComm.registeredAgents.keys())
          .filter(id => id !== fromAgent);
        
        const broadcastPromises = agents.map(agentId =>
          this.sendMessage(fromAgent, agentId, message, options)
        );
        
        const results = await Promise.allSettled(broadcastPromises);
        const successful = results.filter(r => r.status === 'fulfilled').length;
        
        this.busMetrics.topologyOptimizations++;
        
        return {
          totalRecipients: agents.length,
          successful: successful,
          failed: agents.length - successful,
          latency: performance.now() - startTime
        };
      } else {
        // Fallback to base system
        return await this.agentComm.broadcastToAll(message, { ...options, from: fromAgent });
      }
      
    } catch (error) {
      console.error('Enhanced broadcasting failed:', error);
      throw error;
    }
  }
  
  /**
   * Chain tasks with topology awareness
   */
  async chainTasks(taskSequence, options = {}) {
    // Optimize task chain based on current topology
    if (this.topologyManager && taskSequence.length > 1) {
      const topology = this.topologyManager.getCurrentTopology();
      
      // Adjust chaining strategy based on topology
      const optimizedOptions = {
        ...options,
        topology: topology,
        parallelization: this.getOptimalParallelization(topology, taskSequence.length)
      };
      
      return await this.agentComm.chainTasks(taskSequence, optimizedOptions);
    }
    
    return await this.agentComm.chainTasks(taskSequence, options);
  }
  
  /**
   * Execute parallel tasks with load balancing
   */
  async parallelExecute(tasks, options = {}) {
    // Use WASM acceleration for task distribution if available
    if (this.wasmCore && tasks.length > 5) {
      try {
        const distributionResult = await this.wasmCore.executeSIMDVectorMultiply(
          new Float32Array(tasks.map(t => t.priority || 1)),
          new Float32Array(tasks.map(t => t.complexity || 1))
        );
        
        // Use distribution result to optimize task execution
        options.loadBalancing = distributionResult.result;
      } catch (error) {
        console.warn('WASM load balancing failed:', error.message);
      }
    }
    
    return await this.agentComm.parallelExecute(tasks, options);
  }
  
  /**
   * Get optimal parallelization level for topology
   */
  getOptimalParallelization(topology, taskCount) {
    switch (topology) {
      case 'mesh':
        return Math.min(taskCount, 8); // High parallelization for mesh
      case 'star':
        return Math.min(taskCount, 4); // Medium for star (hub bottleneck)
      case 'ring':
        return Math.min(taskCount, 3); // Lower for ring (sequential nature)
      case 'hierarchical':
      default:
        return Math.min(taskCount, 5); // Balanced for hierarchical
    }
  }
  
  /**
   * Update latency metrics
   */
  updateLatencyMetrics(latency) {
    const alpha = 0.1; // Exponential moving average
    this.busMetrics.averageLatency = 
      alpha * latency + (1 - alpha) * this.busMetrics.averageLatency;
  }
  
  /**
   * Update performance metrics
   */
  updatePerformanceMetrics() {
    const baseMetrics = this.agentComm.getMetrics();
    
    // Calculate throughput
    const messageRate = baseMetrics.messagesSent + baseMetrics.messagesReceived;
    const avgMessageSize = 1024; // Assume 1KB average message
    this.busMetrics.throughputMbps = (messageRate * avgMessageSize * 8) / (1024 * 1024); // Mbps
    
    // Calculate connection pool utilization
    const poolStats = this.connectionPool.get('stats') || {};
    const totalConnections = poolStats.created || 1;
    const activeConnections = this.connectionPool.get('active')?.size || 0;
    this.busMetrics.connectionPoolUtilization = (activeConnections / totalConnections) * 100;
    
    this.emit('performance-update', this.busMetrics);
  }
  
  /**
   * Get comprehensive metrics
   */
  getMetrics() {
    const baseMetrics = this.agentComm.getMetrics();
    
    return {
      ...baseMetrics,
      bus: this.busMetrics,
      topology: this.topologyManager?.getTopologyStats(),
      wasm: this.wasmCore?.getMetrics(),
      enhanced: {
        topologyAware: !!this.topologyManager,
        wasmAccelerated: !!this.wasmCore,
        compressionEnabled: this.config.compressionEnabled,
        performanceOptimized: this.config.performanceOptimizations
      }
    };
  }
  
  /**
   * Get agent status with enhancements
   */
  getAgentStatus(agentId) {
    const baseStatus = this.agentComm.getAgentStatus(agentId);
    if (!baseStatus) return null;
    
    // Add topology information
    const connections = this.topologyManager?.getAgentConnections(agentId) || [];
    
    return {
      ...baseStatus,
      topology: {
        type: this.topologyManager?.getCurrentTopology(),
        connections: connections,
        connectionCount: connections.length
      },
      performance: {
        wasmAccelerated: !!this.wasmCore,
        compressionEnabled: this.config.compressionEnabled
      }
    };
  }
  
  /**
   * Optimize topology based on communication patterns
   */
  async optimizeTopology() {
    if (!this.topologyManager) {
      console.warn('Topology manager not available for optimization');
      return false;
    }
    
    try {
      // Analyze current communication patterns
      const metrics = this.getMetrics();
      const currentTopology = this.topologyManager.getCurrentTopology();
      
      // Simple optimization logic
      let recommendedTopology = currentTopology;
      
      if (metrics.bus.averageLatency > 100) { // High latency
        recommendedTopology = 'mesh'; // Better connectivity
      } else if (metrics.bus.totalMessages > 1000) { // High volume
        recommendedTopology = 'star'; // Centralized routing
      } else if (metrics.registeredAgents < 5) { // Few agents
        recommendedTopology = 'hierarchical'; // Simple structure
      }
      
      if (recommendedTopology !== currentTopology) {
        console.log(`Recommending topology switch from ${currentTopology} to ${recommendedTopology}`);
        await this.topologyManager.switchTopology(
          recommendedTopology,
          'communication_optimization'
        );
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error('Topology optimization failed:', error);
      return false;
    }
  }
  
  /**
   * Shutdown communication bus
   */
  async shutdown() {
    console.log('Shutting down Agent Communication Bus...');
    
    // Clear caches and pools
    this.routingCache.clear();
    this.connectionPool.clear();
    
    // Shutdown base communication system
    this.agentComm.shutdown();
    
    this.initialized = false;
    
    console.log('Agent Communication Bus shutdown complete');
  }
}

module.exports = { AgentCommunicationBus };