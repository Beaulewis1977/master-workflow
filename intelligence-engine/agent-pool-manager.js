/**
 * Agent Pool Manager - Efficient Agent Pooling for Unlimited Scaling
 * 
 * This module provides intelligent agent pooling and lazy loading to support
 * 4000+ agents without overwhelming system resources. It implements tiered
 * activation, agent hibernation, and smart preloading strategies.
 * 
 * Features:
 * - Agent pooling with warm/cold tiers
 * - Lazy loading and activation
 * - Memory-efficient hibernation
 * - Predictive preloading
 * - Load balancing across agent pools
 */

const EventEmitter = require('events');

class AgentPoolManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      // Pool configuration
      warmPoolSize: options.warmPoolSize || 50,      // Keep 50 agents warm
      coldPoolSize: options.coldPoolSize || 200,     // Keep 200 agents in cold storage
      hibernationThreshold: options.hibernationThreshold || 300000, // 5 minutes
      preloadThreshold: options.preloadThreshold || 0.8, // Preload when 80% used
      
      // Memory management
      maxMemoryPerAgent: options.maxMemoryPerAgent || 150 * 1024 * 1024, // 150MB
      hibernatedMemoryPerAgent: options.hibernatedMemoryPerAgent || 10 * 1024 * 1024, // 10MB
      
      // Performance tuning
      activationBatchSize: options.activationBatchSize || 10,
      hibernationBatchSize: options.hibernationBatchSize || 20,
      healthCheckInterval: options.healthCheckInterval || 30000, // 30 seconds
      
      ...options
    };
    
    // Agent pools
    this.pools = {
      active: new Map(),        // Currently active agents
      warm: new Map(),         // Warm agents ready for activation
      cold: new Map(),         // Cold agents in hibernation
      creating: new Set()      // Agents being created
    };
    
    // Pool statistics
    this.stats = {
      totalAgents: 0,
      activeCount: 0,
      warmCount: 0,
      coldCount: 0,
      creatingCount: 0,
      
      activations: 0,
      hibernations: 0,
      creations: 0,
      failures: 0,
      
      memoryUsage: 0,
      averageActivationTime: 0,
      averageHibernationTime: 0
    };
    
    // Agent type tracking for balanced pools
    this.agentTypeStats = new Map();
    
    // Background processes
    this.healthCheckTimer = null;
    this.hibernationTimer = null;
    this.preloadTimer = null;
    
    this.isInitialized = false;
  }
  
  /**
   * Initialize the agent pool manager
   */
  async initialize() {
    if (this.isInitialized) return;
    
    console.log('Initializing Agent Pool Manager for unlimited scaling...');
    
    // Start background processes
    this.startHealthChecking();
    this.startHibernationProcess();
    this.startPreloadProcess();
    
    this.isInitialized = true;
    
    this.emit('initialized', {
      warmPoolSize: this.config.warmPoolSize,
      coldPoolSize: this.config.coldPoolSize,
      memoryOptimized: true
    });
    
    console.log(`Agent Pool Manager initialized - Warm: ${this.config.warmPoolSize}, Cold: ${this.config.coldPoolSize}`);
  }
  
  /**
   * Request an agent from the pool with intelligent activation
   */
  async requestAgent(agentType, priority = 'normal') {
    const startTime = Date.now();
    
    try {
      // Try to get from active pool first
      let agent = this.getFromActivePool(agentType);
      if (agent) {
        this.updateAgentStats(agentType, 'reused');
        return agent;
      }
      
      // Try to activate from warm pool
      agent = await this.activateFromWarmPool(agentType);
      if (agent) {
        this.stats.activations++;
        this.updateActivationTime(Date.now() - startTime);
        this.emit('agent-activated', { agentId: agent.id, type: agentType, source: 'warm' });
        return agent;
      }
      
      // Try to wake from cold pool
      agent = await this.wakeFromColdPool(agentType);
      if (agent) {
        this.stats.activations++;
        this.updateActivationTime(Date.now() - startTime);
        this.emit('agent-activated', { agentId: agent.id, type: agentType, source: 'cold' });
        return agent;
      }
      
      // Create new agent if pools are empty
      if (priority === 'high' || this.shouldCreateNewAgent(agentType)) {
        agent = await this.createNewAgent(agentType);
        if (agent) {
          this.stats.creations++;
          this.emit('agent-created', { agentId: agent.id, type: agentType });
          return agent;
        }
      }
      
      // Return null if no agent available
      return null;
      
    } catch (error) {
      this.stats.failures++;
      this.emit('agent-request-failed', { agentType, error: error.message });
      throw error;
    }
  }
  
  /**
   * Return an agent to the pool for reuse
   */
  async returnAgent(agent, forceHibernation = false) {
    if (!agent || !agent.id) return;
    
    try {
      // Remove from active pool
      this.pools.active.delete(agent.id);
      this.stats.activeCount--;
      
      // Decide where to place the agent
      if (forceHibernation || this.shouldHibernateAgent(agent)) {
        await this.hibernateAgent(agent);
      } else if (this.pools.warm.size < this.config.warmPoolSize) {
        await this.moveToWarmPool(agent);
      } else {
        await this.hibernateAgent(agent);
      }
      
      this.emit('agent-returned', { 
        agentId: agent.id, 
        type: agent.type,
        destination: forceHibernation ? 'hibernated' : 'warm'
      });
      
    } catch (error) {
      console.error('Failed to return agent to pool:', error);
      await this.terminateAgent(agent);
    }
  }
  
  /**
   * Get agent from active pool
   */
  getFromActivePool(agentType) {
    for (const [agentId, agent] of this.pools.active) {
      if (agent.type === agentType && agent.isAvailable()) {
        return agent;
      }
    }
    return null;
  }
  
  /**
   * Activate agent from warm pool
   */
  async activateFromWarmPool(agentType) {
    for (const [agentId, agent] of this.pools.warm) {
      if (agent.type === agentType) {
        // Move to active pool
        this.pools.warm.delete(agentId);
        this.pools.active.set(agentId, agent);
        
        this.stats.warmCount--;
        this.stats.activeCount++;
        
        // Reactivate agent
        await this.reactivateAgent(agent);
        
        return agent;
      }
    }
    return null;
  }
  
  /**
   * Wake agent from cold pool
   */
  async wakeFromColdPool(agentType) {
    for (const [agentId, agent] of this.pools.cold) {
      if (agent.type === agentType) {
        // Move to active pool
        this.pools.cold.delete(agentId);
        this.pools.active.set(agentId, agent);
        
        this.stats.coldCount--;
        this.stats.activeCount++;
        
        // Wake up agent
        await this.wakeupAgent(agent);
        
        return agent;
      }
    }
    return null;
  }
  
  /**
   * Create new agent
   */
  async createNewAgent(agentType) {
    const agentId = this.generateAgentId(agentType);
    
    try {
      this.pools.creating.add(agentId);
      this.stats.creatingCount++;
      
      // Create agent instance (mock implementation)
      const agent = await this.instantiateAgent(agentId, agentType);
      
      // Move to active pool
      this.pools.creating.delete(agentId);
      this.pools.active.set(agentId, agent);
      
      this.stats.creatingCount--;
      this.stats.activeCount++;
      this.stats.totalAgents++;
      
      this.updateAgentTypeStats(agentType, 'created');
      
      return agent;
      
    } catch (error) {
      this.pools.creating.delete(agentId);
      this.stats.creatingCount--;
      throw error;
    }
  }
  
  /**
   * Hibernage agent to save memory
   */
  async hibernateAgent(agent) {
    const startTime = Date.now();
    
    try {
      // Save agent state
      agent.hibernatedState = {
        context: agent.context,
        metadata: agent.metadata,
        hibernatedAt: Date.now()
      };
      
      // Clear heavy objects to save memory
      agent.context = null;
      agent.workingMemory = null;
      agent.taskQueue = [];
      
      // Move to cold pool
      this.pools.cold.set(agent.id, agent);
      this.stats.coldCount++;
      this.stats.hibernations++;
      
      const hibernationTime = Date.now() - startTime;
      this.updateHibernationTime(hibernationTime);
      
      this.emit('agent-hibernated', { 
        agentId: agent.id, 
        type: agent.type,
        hibernationTime 
      });
      
    } catch (error) {
      console.error('Failed to hibernate agent:', error);
      throw error;
    }
  }
  
  /**
   * Wake up hibernated agent
   */
  async wakeupAgent(agent) {
    try {
      // Restore agent state
      if (agent.hibernatedState) {
        agent.context = agent.hibernatedState.context;
        agent.metadata = agent.hibernatedState.metadata;
        agent.hibernatedState = null;
      }
      
      // Reinitialize working memory
      agent.workingMemory = {};
      agent.taskQueue = [];
      agent.lastActivity = Date.now();
      
      // Update status
      agent.status = 'active';
      
      this.emit('agent-woken', { agentId: agent.id, type: agent.type });
      
    } catch (error) {
      console.error('Failed to wake up agent:', error);
      throw error;
    }
  }
  
  /**
   * Move agent to warm pool
   */
  async moveToWarmPool(agent) {
    try {
      // Partially hibernate agent
      agent.status = 'warm';
      agent.lastActivity = Date.now();
      
      // Clear some memory but keep essential data
      if (agent.taskQueue) {
        agent.taskQueue = agent.taskQueue.slice(-5); // Keep last 5 tasks
      }
      
      this.pools.warm.set(agent.id, agent);
      this.stats.warmCount++;
      
      this.emit('agent-warmed', { agentId: agent.id, type: agent.type });
      
    } catch (error) {
      console.error('Failed to move agent to warm pool:', error);
      throw error;
    }
  }
  
  /**
   * Reactivate warm agent
   */
  async reactivateAgent(agent) {
    try {
      agent.status = 'active';
      agent.lastActivity = Date.now();
      
      // Restore full functionality
      if (!agent.taskQueue) {
        agent.taskQueue = [];
      }
      
      this.emit('agent-reactivated', { agentId: agent.id, type: agent.type });
      
    } catch (error) {
      console.error('Failed to reactivate agent:', error);
      throw error;
    }
  }
  
  /**
   * Check if agent should be hibernated
   */
  shouldHibernateAgent(agent) {
    const idleTime = Date.now() - agent.lastActivity;
    return idleTime > this.config.hibernationThreshold;
  }
  
  /**
   * Check if new agent should be created
   */
  shouldCreateNewAgent(agentType) {
    const typeStats = this.agentTypeStats.get(agentType) || { active: 0, warm: 0, cold: 0 };
    const totalForType = typeStats.active + typeStats.warm + typeStats.cold;
    
    // Allow creation if we have less than 10 of this type and total is reasonable
    return totalForType < 10 && this.stats.totalAgents < 5000;
  }
  
  /**
   * Start health checking process
   */
  startHealthChecking() {
    this.healthCheckTimer = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error('Health check failed:', error);
      }
    }, this.config.healthCheckInterval);
  }
  
  /**
   * Start hibernation process
   */
  startHibernationProcess() {
    this.hibernationTimer = setInterval(async () => {
      try {
        await this.processHibernationCandidates();
      } catch (error) {
        console.error('Hibernation process failed:', error);
      }
    }, this.config.hibernationThreshold / 2); // Check at half the hibernation threshold
  }
  
  /**
   * Start preload process
   */
  startPreloadProcess() {
    this.preloadTimer = setInterval(async () => {
      try {
        await this.processPreloadRequirements();
      } catch (error) {
        console.error('Preload process failed:', error);
      }
    }, 60000); // Check every minute
  }
  
  /**
   * Perform health check on all agents
   */
  async performHealthCheck() {
    const unhealthyAgents = [];
    
    // Check active agents
    for (const [agentId, agent] of this.pools.active) {
      if (!await this.checkAgentHealth(agent)) {
        unhealthyAgents.push(agent);
      }
    }
    
    // Remove unhealthy agents
    for (const agent of unhealthyAgents) {
      await this.terminateAgent(agent);
    }
    
    // Update stats
    this.updatePoolStats();
  }
  
  /**
   * Process hibernation candidates
   */
  async processHibernationCandidates() {
    const candidates = [];
    
    // Find idle agents in warm pool
    for (const [agentId, agent] of this.pools.warm) {
      if (this.shouldHibernateAgent(agent)) {
        candidates.push(agent);
      }
    }
    
    // Hibernate in batches
    const batchSize = this.config.hibernationBatchSize;
    for (let i = 0; i < candidates.length; i += batchSize) {
      const batch = candidates.slice(i, i + batchSize);
      await Promise.allSettled(batch.map(agent => this.hibernateFromWarm(agent)));
    }
  }
  
  /**
   * Hibernate agent from warm pool
   */
  async hibernateFromWarm(agent) {
    this.pools.warm.delete(agent.id);
    this.stats.warmCount--;
    await this.hibernateAgent(agent);
  }
  
  /**
   * Process preload requirements
   */
  async processPreloadRequirements() {
    // Check if warm pool needs refilling
    if (this.stats.warmCount < this.config.warmPoolSize * this.config.preloadThreshold) {
      await this.preloadWarmAgents();
    }
  }
  
  /**
   * Preload warm agents from cold pool
   */
  async preloadWarmAgents() {
    const needed = this.config.warmPoolSize - this.stats.warmCount;
    const candidates = Array.from(this.pools.cold.values()).slice(0, needed);
    
    for (const agent of candidates) {
      this.pools.cold.delete(agent.id);
      this.stats.coldCount--;
      await this.moveToWarmPool(agent);
    }
  }
  
  /**
   * Check agent health
   */
  async checkAgentHealth(agent) {
    try {
      // Simple health check - can be enhanced
      return agent && agent.status && agent.id && typeof agent.lastActivity === 'number';
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Terminate unhealthy agent
   */
  async terminateAgent(agent) {
    try {
      // Remove from all pools
      this.pools.active.delete(agent.id);
      this.pools.warm.delete(agent.id);
      this.pools.cold.delete(agent.id);
      
      // Update stats
      this.stats.activeCount = this.pools.active.size;
      this.stats.warmCount = this.pools.warm.size;
      this.stats.coldCount = this.pools.cold.size;
      this.stats.totalAgents--;
      
      this.emit('agent-terminated', { agentId: agent.id, type: agent.type });
      
    } catch (error) {
      console.error('Failed to terminate agent:', error);
    }
  }
  
  /**
   * Update pool statistics
   */
  updatePoolStats() {
    this.stats.activeCount = this.pools.active.size;
    this.stats.warmCount = this.pools.warm.size;
    this.stats.coldCount = this.pools.cold.size;
    this.stats.creatingCount = this.pools.creating.size;
    this.stats.totalAgents = this.stats.activeCount + this.stats.warmCount + this.stats.coldCount;
    
    // Calculate memory usage
    this.stats.memoryUsage = 
      (this.stats.activeCount * this.config.maxMemoryPerAgent) +
      (this.stats.warmCount * this.config.maxMemoryPerAgent * 0.7) +
      (this.stats.coldCount * this.config.hibernatedMemoryPerAgent);
  }
  
  /**
   * Update agent type statistics
   */
  updateAgentTypeStats(agentType, action) {
    if (!this.agentTypeStats.has(agentType)) {
      this.agentTypeStats.set(agentType, { 
        active: 0, warm: 0, cold: 0, 
        created: 0, reused: 0, hibernated: 0 
      });
    }
    
    const stats = this.agentTypeStats.get(agentType);
    stats[action] = (stats[action] || 0) + 1;
  }
  
  /**
   * Update activation time statistics
   */
  updateActivationTime(time) {
    if (this.stats.activations === 1) {
      this.stats.averageActivationTime = time;
    } else {
      this.stats.averageActivationTime = 
        (this.stats.averageActivationTime * (this.stats.activations - 1) + time) / this.stats.activations;
    }
  }
  
  /**
   * Update hibernation time statistics
   */
  updateHibernationTime(time) {
    if (this.stats.hibernations === 1) {
      this.stats.averageHibernationTime = time;
    } else {
      this.stats.averageHibernationTime = 
        (this.stats.averageHibernationTime * (this.stats.hibernations - 1) + time) / this.stats.hibernations;
    }
  }
  
  /**
   * Generate unique agent ID
   */
  generateAgentId(agentType) {
    return `pool_${agentType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Instantiate new agent (mock implementation)
   */
  async instantiateAgent(agentId, agentType) {
    // This would integrate with the actual agent creation logic
    return {
      id: agentId,
      type: agentType,
      status: 'active',
      context: {},
      metadata: {},
      workingMemory: {},
      taskQueue: [],
      lastActivity: Date.now(),
      createdAt: Date.now(),
      isAvailable: () => true
    };
  }
  
  /**
   * Get pool statistics
   */
  getStats() {
    this.updatePoolStats();
    
    return {
      pools: {
        active: this.stats.activeCount,
        warm: this.stats.warmCount,
        cold: this.stats.coldCount,
        creating: this.stats.creatingCount,
        total: this.stats.totalAgents
      },
      performance: {
        activations: this.stats.activations,
        hibernations: this.stats.hibernations,
        creations: this.stats.creations,
        failures: this.stats.failures,
        averageActivationTime: Math.round(this.stats.averageActivationTime),
        averageHibernationTime: Math.round(this.stats.averageHibernationTime)
      },
      memory: {
        estimated: Math.round(this.stats.memoryUsage / (1024 * 1024)), // MB
        activeAgentMemory: Math.round((this.stats.activeCount * this.config.maxMemoryPerAgent) / (1024 * 1024)),
        hibernatedAgentMemory: Math.round((this.stats.coldCount * this.config.hibernatedMemoryPerAgent) / (1024 * 1024))
      },
      agentTypes: Object.fromEntries(this.agentTypeStats)
    };
  }
  
  /**
   * Shutdown the pool manager
   */
  async shutdown() {
    console.log('Shutting down Agent Pool Manager...');
    
    // Stop background processes
    if (this.healthCheckTimer) clearInterval(this.healthCheckTimer);
    if (this.hibernationTimer) clearInterval(this.hibernationTimer);
    if (this.preloadTimer) clearInterval(this.preloadTimer);
    
    // Terminate all agents
    const allAgents = [
      ...this.pools.active.values(),
      ...this.pools.warm.values(),
      ...this.pools.cold.values()
    ];
    
    await Promise.allSettled(allAgents.map(agent => this.terminateAgent(agent)));
    
    this.emit('shutdown-complete');
    console.log('Agent Pool Manager shutdown complete');
  }
}

module.exports = AgentPoolManager;