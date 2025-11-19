/**
 * Topology Manager - Claude Flow 2.0 Enhancement
 * 
 * Manages 4 different agent communication topologies:
 * - Hierarchical: Tree-like structure with Queen Controller at root
 * - Mesh: All agents can communicate with each other
 * - Ring: Agents form a circular communication pattern
 * - Star: Central hub with spokes to all agents
 * 
 * Supports dynamic topology switching based on task requirements.
 */

const EventEmitter = require('events');

class TopologyManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      initialTopology: options.initialTopology || 'hierarchical',
      maxAgents: options.maxAgents || 10,
      adaptiveTopology: options.adaptiveTopology !== false,
      switchThreshold: options.switchThreshold || 0.3, // Performance degradation threshold
      evaluationInterval: options.evaluationInterval || 30000 // 30 seconds
    };
    
    // Supported topology types
    this.topologyTypes = {
      HIERARCHICAL: 'hierarchical',
      MESH: 'mesh', 
      RING: 'ring',
      STAR: 'star'
    };
    
    // Current topology state
    this.currentTopology = this.config.initialTopology;
    this.topologyGraph = new Map(); // Agent connections
    this.routingTable = new Map(); // Message routing paths
    this.agents = new Map(); // Active agents
    
    // Performance metrics per topology
    this.topologyMetrics = new Map();
    this.initializeTopologyMetrics();
    
    // Communication patterns
    this.messageRoutes = new Map();
    this.latencyMatrix = new Map();
    
    // Topology switching history
    this.switchHistory = [];
    this.lastEvaluation = Date.now();
    
    this.initialized = false;
  }
  
  /**
   * Initialize topology manager
   */
  async initialize() {
    try {
      console.log(`Initializing Topology Manager with ${this.currentTopology} topology...`);
      
      // Build initial topology
      await this.buildTopology(this.currentTopology);
      
      // Start adaptive evaluation if enabled
      if (this.config.adaptiveTopology) {
        this.startAdaptiveEvaluation();
      }
      
      this.initialized = true;
      
      console.log('Topology Manager initialized successfully');
      
      this.emit('topology-initialized', {
        topology: this.currentTopology,
        adaptive: this.config.adaptiveTopology
      });
      
      return true;
      
    } catch (error) {
      console.error('Topology Manager initialization failed:', error);
      throw error;
    }
  }
  
  /**
   * Initialize performance metrics for all topology types
   */
  initializeTopologyMetrics() {
    Object.values(this.topologyTypes).forEach(topology => {
      this.topologyMetrics.set(topology, {
        messagesSent: 0,
        messagesReceived: 0,
        averageLatency: 0,
        throughput: 0,
        errorRate: 0,
        congestionLevel: 0,
        lastUsed: Date.now(),
        performanceScore: 1.0,
        adaptationCount: 0
      });
    });
  }
  
  /**
   * Register an agent with the topology
   */
  async registerAgent(agentId, agentData) {
    if (!this.initialized) {
      throw new Error('Topology Manager not initialized');
    }
    
    this.agents.set(agentId, {
      id: agentId,
      ...agentData,
      connections: new Set(),
      registeredAt: Date.now(),
      messageCount: 0,
      lastActivity: Date.now()
    });
    
    // Rebuild topology with new agent
    await this.buildTopology(this.currentTopology);
    
    this.emit('agent-registered', {
      agentId,
      topology: this.currentTopology,
      connections: this.getAgentConnections(agentId)
    });
    
    console.log(`Agent ${agentId} registered in ${this.currentTopology} topology`);
    
    return true;
  }
  
  /**
   * Unregister an agent from the topology
   */
  async unregisterAgent(agentId) {
    if (!this.agents.has(agentId)) {
      return false;
    }
    
    this.agents.delete(agentId);
    this.topologyGraph.delete(agentId);
    this.routingTable.delete(agentId);
    
    // Remove agent from other agents' connections
    for (const [otherId, connections] of this.topologyGraph) {
      if (connections.has(agentId)) {
        connections.delete(agentId);
      }
    }
    
    // Rebuild topology without the agent
    await this.buildTopology(this.currentTopology);
    
    this.emit('agent-unregistered', {
      agentId,
      topology: this.currentTopology
    });
    
    return true;
  }
  
  /**
   * Build topology based on specified type
   */
  async buildTopology(topologyType) {
    console.log(`Building ${topologyType} topology for ${this.agents.size} agents...`);
    
    const startTime = Date.now();
    
    try {
      // Clear existing topology
      this.topologyGraph.clear();
      this.routingTable.clear();
      
      switch (topologyType) {
        case this.topologyTypes.HIERARCHICAL:
          await this.buildHierarchicalTopology();
          break;
        case this.topologyTypes.MESH:
          await this.buildMeshTopology();
          break;
        case this.topologyTypes.RING:
          await this.buildRingTopology();
          break;
        case this.topologyTypes.STAR:
          await this.buildStarTopology();
          break;
        default:
          throw new Error(`Unknown topology type: ${topologyType}`);
      }
      
      // Build routing table
      await this.buildRoutingTable();
      
      const buildTime = Date.now() - startTime;
      
      this.emit('topology-built', {
        topology: topologyType,
        agentCount: this.agents.size,
        connectionCount: this.getTotalConnections(),
        buildTime
      });
      
      console.log(`${topologyType} topology built in ${buildTime}ms`);
      
    } catch (error) {
      console.error(`Failed to build ${topologyType} topology:`, error);
      throw error;
    }
  }
  
  /**
   * Build hierarchical topology (tree structure)
   */
  async buildHierarchicalTopology() {
    const agentIds = Array.from(this.agents.keys());
    
    // Queen Controller is root, connect to all agents
    const queenId = 'queen-controller';
    this.topologyGraph.set(queenId, new Set(agentIds));
    
    // Each agent connects only to Queen Controller
    agentIds.forEach(agentId => {
      this.topologyGraph.set(agentId, new Set([queenId]));
      this.agents.get(agentId).connections = new Set([queenId]);
    });
    
    // Optional: Create sub-hierarchies for related agents
    this.createSubHierarchies(agentIds);
  }
  
  /**
   * Build mesh topology (all-to-all connections)
   */
  async buildMeshTopology() {
    const agentIds = Array.from(this.agents.keys());
    
    // Connect every agent to every other agent
    agentIds.forEach(agentId => {
      const connections = new Set(agentIds.filter(id => id !== agentId));
      this.topologyGraph.set(agentId, connections);
      this.agents.get(agentId).connections = connections;
    });
  }
  
  /**
   * Build ring topology (circular connections)
   */
  async buildRingTopology() {
    const agentIds = Array.from(this.agents.keys());
    
    if (agentIds.length < 2) {
      // Fallback to star for single agent
      return this.buildStarTopology();
    }
    
    // Create circular connections
    agentIds.forEach((agentId, index) => {
      const nextIndex = (index + 1) % agentIds.length;
      const prevIndex = (index - 1 + agentIds.length) % agentIds.length;
      
      const connections = new Set([
        agentIds[nextIndex],
        agentIds[prevIndex]
      ]);
      
      // Add Queen Controller connection for management
      connections.add('queen-controller');
      
      this.topologyGraph.set(agentId, connections);
      this.agents.get(agentId).connections = connections;
    });
    
    // Queen Controller connects to all agents
    const queenConnections = new Set(agentIds);
    this.topologyGraph.set('queen-controller', queenConnections);
  }
  
  /**
   * Build star topology (central hub)
   */
  async buildStarTopology() {
    const agentIds = Array.from(this.agents.keys());
    
    // Choose central hub (Queen Controller or most capable agent)
    const hubId = this.selectHubAgent(agentIds);
    
    // Hub connects to all agents
    const hubConnections = new Set(agentIds.filter(id => id !== hubId));
    this.topologyGraph.set(hubId, hubConnections);
    
    // Each agent connects only to hub
    agentIds.forEach(agentId => {
      if (agentId !== hubId) {
        const connections = new Set([hubId]);
        this.topologyGraph.set(agentId, connections);
        this.agents.get(agentId).connections = connections;
      }
    });
    
    // Update hub agent connections
    if (this.agents.has(hubId)) {
      this.agents.get(hubId).connections = hubConnections;
    }
  }
  
  /**
   * Create sub-hierarchies for related agent types
   */
  createSubHierarchies(agentIds) {
    const agentsByType = new Map();
    
    // Group agents by type
    agentIds.forEach(agentId => {
      const agent = this.agents.get(agentId);
      const agentType = agent?.type || 'unknown';
      
      if (!agentsByType.has(agentType)) {
        agentsByType.set(agentType, []);
      }
      agentsByType.get(agentType).push(agentId);
    });
    
    // Create connections within each type group
    for (const [agentType, typeAgents] of agentsByType) {
      if (typeAgents.length > 1) {
        typeAgents.forEach(agentId => {
          const agent = this.agents.get(agentId);
          const existingConnections = this.topologyGraph.get(agentId) || new Set();
          
          // Add connections to other agents of same type
          typeAgents.forEach(otherId => {
            if (otherId !== agentId) {
              existingConnections.add(otherId);
              agent.connections.add(otherId);
            }
          });
          
          this.topologyGraph.set(agentId, existingConnections);
        });
      }
    }
  }
  
  /**
   * Select optimal hub agent for star topology
   */
  selectHubAgent(agentIds) {
    // Default to Queen Controller if available
    if (agentIds.includes('queen-controller')) {
      return 'queen-controller';
    }
    
    // Select agent with highest capability score
    let bestAgent = agentIds[0];
    let bestScore = 0;
    
    agentIds.forEach(agentId => {
      const agent = this.agents.get(agentId);
      const score = this.calculateAgentCapabilityScore(agent);
      
      if (score > bestScore) {
        bestScore = score;
        bestAgent = agentId;
      }
    });
    
    return bestAgent;
  }
  
  /**
   * Calculate agent capability score for hub selection
   */
  calculateAgentCapabilityScore(agent) {
    if (!agent) return 0;
    
    let score = 0;
    
    // Factor in agent capabilities
    if (agent.capabilities && agent.capabilities.length > 0) {
      score += agent.capabilities.length * 10;
    }
    
    // Factor in context window size
    if (agent.contextWindow) {
      score += agent.contextWindow / 1000; // Normalize
    }
    
    // Factor in activity level
    const timeSinceActivity = Date.now() - (agent.lastActivity || 0);
    if (timeSinceActivity < 300000) { // Active in last 5 minutes
      score += 50;
    }
    
    return score;
  }
  
  /**
   * Build routing table for efficient message routing
   */
  async buildRoutingTable() {
    const agentIds = Array.from(this.agents.keys());
    agentIds.push('queen-controller');
    
    // Initialize routing table
    agentIds.forEach(fromAgent => {
      this.routingTable.set(fromAgent, new Map());
      
      agentIds.forEach(toAgent => {
        if (fromAgent !== toAgent) {
          const path = this.findShortestPath(fromAgent, toAgent);
          this.routingTable.get(fromAgent).set(toAgent, path);
        }
      });
    });
  }
  
  /**
   * Find shortest path between two agents using BFS
   */
  findShortestPath(fromAgent, toAgent) {
    if (fromAgent === toAgent) return [fromAgent];
    
    const queue = [[fromAgent]];
    const visited = new Set([fromAgent]);
    
    while (queue.length > 0) {
      const path = queue.shift();
      const currentAgent = path[path.length - 1];
      const connections = this.topologyGraph.get(currentAgent) || new Set();
      
      for (const neighbor of connections) {
        if (neighbor === toAgent) {
          return [...path, neighbor];
        }
        
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([...path, neighbor]);
        }
      }
    }
    
    // No path found, return direct connection
    return [fromAgent, toAgent];
  }
  
  /**
   * Route message through topology
   */
  async routeMessage(fromAgent, toAgent, message, options = {}) {
    const routingTable = this.routingTable.get(fromAgent);
    if (!routingTable) {
      throw new Error(`No routing table for agent ${fromAgent}`);
    }
    
    const path = routingTable.get(toAgent);
    if (!path || path.length === 0) {
      throw new Error(`No route from ${fromAgent} to ${toAgent}`);
    }
    
    // Update topology metrics
    this.updateTopologyMetrics('messagesSent', 1);
    
    const route = {
      id: message.id || Date.now().toString(),
      from: fromAgent,
      to: toAgent,
      path: path,
      hops: path.length - 1,
      timestamp: Date.now(),
      topology: this.currentTopology
    };
    
    this.messageRoutes.set(route.id, route);
    
    this.emit('message-routed', route);
    
    return route;
  }
  
  /**
   * Switch to different topology based on performance
   */
  async switchTopology(newTopology, reason = 'manual') {
    if (newTopology === this.currentTopology) {
      console.log(`Already using ${newTopology} topology`);
      return false;
    }
    
    if (!Object.values(this.topologyTypes).includes(newTopology)) {
      throw new Error(`Invalid topology type: ${newTopology}`);
    }
    
    const previousTopology = this.currentTopology;
    const switchTime = Date.now();
    
    try {
      console.log(`Switching topology from ${previousTopology} to ${newTopology} (${reason})...`);
      
      // Build new topology
      await this.buildTopology(newTopology);
      
      // Update current topology
      this.currentTopology = newTopology;
      
      // Record switch in history
      this.switchHistory.push({
        from: previousTopology,
        to: newTopology,
        timestamp: switchTime,
        reason,
        agentCount: this.agents.size
      });
      
      // Update metrics
      this.updateTopologyMetrics('adaptationCount', 1);
      
      const switchDuration = Date.now() - switchTime;
      
      this.emit('topology-switched', {
        previous: previousTopology,
        current: newTopology,
        reason,
        switchTime: switchDuration,
        agentCount: this.agents.size
      });
      
      console.log(`Topology switched to ${newTopology} in ${switchDuration}ms`);
      
      return true;
      
    } catch (error) {
      console.error(`Failed to switch topology to ${newTopology}:`, error);
      
      // Revert to previous topology
      this.currentTopology = previousTopology;
      await this.buildTopology(previousTopology);
      
      throw error;
    }
  }
  
  /**
   * Start adaptive topology evaluation
   */
  startAdaptiveEvaluation() {
    console.log('Starting adaptive topology evaluation...');
    
    this.evaluationInterval = setInterval(async () => {
      try {
        await this.evaluateTopologyPerformance();
      } catch (error) {
        console.error('Topology evaluation failed:', error);
      }
    }, this.config.evaluationInterval);
  }
  
  /**
   * Evaluate current topology performance and suggest changes
   */
  async evaluateTopologyPerformance() {
    const currentMetrics = this.topologyMetrics.get(this.currentTopology);
    if (!currentMetrics) return;
    
    // Calculate performance scores for all topologies
    const performanceScores = new Map();
    
    for (const [topology, metrics] of this.topologyMetrics) {
      const score = this.calculatePerformanceScore(metrics);
      performanceScores.set(topology, score);
    }
    
    // Find best performing topology
    const bestTopology = Array.from(performanceScores.entries())
      .sort((a, b) => b[1] - a[1])[0];
    
    const currentScore = performanceScores.get(this.currentTopology) || 0;
    const bestScore = bestTopology[1];
    
    // Switch if performance improvement exceeds threshold
    if (bestTopology[0] !== this.currentTopology && 
        (bestScore - currentScore) > this.config.switchThreshold) {
      
      await this.switchTopology(
        bestTopology[0],
        `performance_improvement_${((bestScore - currentScore) * 100).toFixed(1)}%`
      );
    }
    
    this.lastEvaluation = Date.now();
    
    this.emit('topology-evaluated', {
      current: this.currentTopology,
      currentScore,
      bestTopology: bestTopology[0],
      bestScore,
      performanceGap: bestScore - currentScore
    });
  }
  
  /**
   * Calculate performance score for topology
   */
  calculatePerformanceScore(metrics) {
    const weights = {
      latency: 0.3,
      throughput: 0.3,
      errorRate: 0.2,
      congestion: 0.2
    };
    
    // Normalize metrics (higher is better for score)
    const latencyScore = Math.max(0, 1 - (metrics.averageLatency / 1000)); // Normalize to 1s
    const throughputScore = Math.min(1, metrics.throughput / 100); // Normalize to 100 msgs/s
    const errorScore = Math.max(0, 1 - metrics.errorRate);
    const congestionScore = Math.max(0, 1 - metrics.congestionLevel);
    
    const score = 
      weights.latency * latencyScore +
      weights.throughput * throughputScore +
      weights.errorRate * errorScore +
      weights.congestion * congestionScore;
    
    return score;
  }
  
  /**
   * Update topology metrics
   */
  updateTopologyMetrics(metric, value, topology = null) {
    const targetTopology = topology || this.currentTopology;
    const metrics = this.topologyMetrics.get(targetTopology);
    
    if (metrics) {
      if (typeof metrics[metric] === 'number') {
        metrics[metric] += value;
      } else {
        metrics[metric] = value;
      }
      metrics.lastUsed = Date.now();
    }
  }
  
  /**
   * Get agent connections
   */
  getAgentConnections(agentId) {
    return Array.from(this.topologyGraph.get(agentId) || []);
  }
  
  /**
   * Get total number of connections
   */
  getTotalConnections() {
    let total = 0;
    for (const connections of this.topologyGraph.values()) {
      total += connections.size;
    }
    return total;
  }
  
  /**
   * Get current topology type
   */
  getCurrentTopology() {
    return this.currentTopology;
  }
  
  /**
   * Get topology statistics
   */
  getTopologyStats() {
    return {
      currentTopology: this.currentTopology,
      agentCount: this.agents.size,
      connectionCount: this.getTotalConnections(),
      routingTableSize: this.routingTable.size,
      switchHistory: this.switchHistory.slice(-10), // Last 10 switches
      metrics: Object.fromEntries(this.topologyMetrics),
      lastEvaluation: this.lastEvaluation
    };
  }
  
  /**
   * Get available topology types
   */
  getAvailableTopologies() {
    return Object.values(this.topologyTypes);
  }
  
  /**
   * Shutdown topology manager
   */
  async shutdown() {
    if (this.evaluationInterval) {
      clearInterval(this.evaluationInterval);
    }
    
    this.topologyGraph.clear();
    this.routingTable.clear();
    this.agents.clear();
    this.messageRoutes.clear();
    this.initialized = false;
    
    console.log('Topology Manager shutdown complete');
  }
}

module.exports = { TopologyManager };