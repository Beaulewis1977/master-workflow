/**
 * Sub-Agent Manager - Lifecycle and Resource Management
 * 
 * Manages the complete lifecycle of sub-agents including spawning, monitoring,
 * resource allocation, and termination. Integrates with TMux sessions for
 * multi-window coordination and tracks context window usage.
 */

const { spawn } = require('child_process');
const EventEmitter = require('events');
const path = require('path');
const fs = require('fs').promises;

class SubAgentManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Configuration
    this.maxAgents = options.maxAgents || 10;
    this.contextWindowLimit = options.contextWindowLimit || 200000; // 200k tokens
    this.projectRoot = options.projectRoot || process.cwd();
    this.tmuxEnabled = options.tmuxEnabled !== false;
    
    // Agent registry
    this.agents = new Map();
    this.processes = new Map();
    this.sessions = new Map();
    
    // Resource tracking
    this.resources = {
      memory: new Map(),
      cpu: new Map(),
      tokens: new Map(),
      startTimes: new Map()
    };
    
    // Performance metrics
    this.metrics = {
      totalSpawned: 0,
      totalTerminated: 0,
      averageLifetime: 0,
      peakConcurrent: 0,
      contextOverflows: 0,
      errors: []
    };
    
    // TMux configuration
    this.tmuxConfig = {
      sessionPrefix: 'queen-agent-',
      windowLayout: 'tiled',
      paneSync: false
    };
    
    // Agent template paths
    this.templatePaths = {
      default: path.join(this.projectRoot, '.claude/agents'),
      workflow: path.join(this.projectRoot, '.ai-workflow/agent-templates'),
      custom: path.join(this.projectRoot, 'agent-templates')
    };
    
    // Start resource monitoring
    this.startResourceMonitoring();
  }
  
  /**
   * Spawn a new sub-agent with lifecycle management
   * @param {string} agentId - Unique agent identifier
   * @param {string} type - Agent type/role
   * @param {object} config - Agent configuration
   */
  async spawnAgent(agentId, type, config = {}) {
    // Check resource limits
    if (this.agents.size >= this.maxAgents) {
      throw new Error(`Maximum agent limit reached: ${this.maxAgents}`);
    }
    
    // Create agent metadata
    const agent = {
      id: agentId,
      type: type,
      status: 'spawning',
      config: {
        ...config,
        contextWindow: config.contextWindow || this.contextWindowLimit,
        timeout: config.timeout || 300000, // 5 minutes default
        retries: config.retries || 3
      },
      spawnTime: Date.now(),
      pid: null,
      sessionId: null,
      tokenUsage: 0,
      messageCount: 0
    };
    
    // Register agent
    this.agents.set(agentId, agent);
    this.resources.tokens.set(agentId, 0);
    this.resources.startTimes.set(agentId, Date.now());
    
    try {
      // Load agent template
      const template = await this.loadAgentTemplate(type);
      agent.template = template;
      
      // Create TMux session if enabled
      if (this.tmuxEnabled) {
        agent.sessionId = await this.createTmuxSession(agentId, type);
        this.sessions.set(agentId, agent.sessionId);
      }
      
      // Spawn agent process
      const process = await this.spawnAgentProcess(agent);
      agent.pid = process.pid;
      this.processes.set(agentId, process);
      
      // Initialize resource tracking
      this.initializeResourceTracking(agentId, process.pid);
      
      // Update status
      agent.status = 'active';
      this.metrics.totalSpawned++;
      
      // Update peak concurrent
      if (this.agents.size > this.metrics.peakConcurrent) {
        this.metrics.peakConcurrent = this.agents.size;
      }
      
      // Emit spawn event
      this.emit('agent-spawned', {
        agentId,
        type,
        pid: process.pid,
        sessionId: agent.sessionId
      });
      
      // Set up lifecycle monitoring
      this.monitorAgentLifecycle(agentId);
      
      return agent;
      
    } catch (error) {
      // Clean up on error
      agent.status = 'error';
      agent.error = error.message;
      this.agents.delete(agentId);
      
      this.metrics.errors.push({
        agentId,
        error: error.message,
        timestamp: Date.now()
      });
      
      throw error;
    }
  }
  
  /**
   * Load agent template from various locations
   */
  async loadAgentTemplate(type) {
    const templateFileName = `${type}.md`;
    const searchPaths = [
      path.join(this.templatePaths.default, templateFileName),
      path.join(this.templatePaths.workflow, templateFileName),
      path.join(this.templatePaths.custom, templateFileName)
    ];
    
    for (const templatePath of searchPaths) {
      try {
        const content = await fs.readFile(templatePath, 'utf-8');
        return {
          path: templatePath,
          content: content,
          type: type
        };
      } catch (error) {
        // Continue searching
      }
    }
    
    // Return default template if none found
    return {
      type: type,
      content: this.getDefaultTemplate(type),
      isDefault: true
    };
  }
  
  /**
   * Spawn the actual agent process
   */
  async spawnAgentProcess(agent) {
    const command = this.buildAgentCommand(agent);
    
    // Spawn process with proper environment
    const env = {
      ...process.env,
      AGENT_ID: agent.id,
      AGENT_TYPE: agent.type,
      CONTEXT_WINDOW: agent.config.contextWindow,
      PROJECT_ROOT: this.projectRoot,
      QUEEN_CONTROLLER: 'true'
    };
    
    const processOptions = {
      cwd: this.projectRoot,
      env: env,
      shell: true,
      detached: false
    };
    
    // Spawn the process
    const agentProcess = spawn(command.cmd, command.args, processOptions);
    
    // Handle process output
    agentProcess.stdout.on('data', (data) => {
      this.handleAgentOutput(agent.id, data.toString());
    });
    
    agentProcess.stderr.on('data', (data) => {
      this.handleAgentError(agent.id, data.toString());
    });
    
    agentProcess.on('exit', (code, signal) => {
      this.handleAgentExit(agent.id, code, signal);
    });
    
    return agentProcess;
  }
  
  /**
   * Build command to spawn agent
   */
  buildAgentCommand(agent) {
    // Use npx claude-flow for actual agent spawning
    const baseCommand = 'npx --yes claude-flow@latest';
    
    // Map agent types to claude-flow commands
    const commandMap = {
      'code-analyzer': 'analyze',
      'test-runner': 'test',
      'doc-generator': 'document',
      'deployment-engineer': 'deploy',
      'security-scanner': 'security',
      'performance-optimizer': 'optimize'
    };
    
    const flowCommand = commandMap[agent.type] || 'agent';
    
    return {
      cmd: baseCommand,
      args: [
        flowCommand,
        '--agent-id', agent.id,
        '--type', agent.type,
        '--context-window', agent.config.contextWindow,
        '--mode', 'sub-agent'
      ]
    };
  }
  
  /**
   * Create TMux session for agent
   */
  async createTmuxSession(agentId, type) {
    const sessionName = `${this.tmuxConfig.sessionPrefix}${agentId}`;
    
    try {
      // Create new tmux session
      await this.execCommand(`tmux new-session -d -s ${sessionName} -n ${type}`);
      
      // Set up panes if needed
      if (this.tmuxConfig.windowLayout === 'split') {
        await this.execCommand(`tmux split-window -t ${sessionName} -h`);
        await this.execCommand(`tmux split-window -t ${sessionName} -v`);
      }
      
      return sessionName;
    } catch (error) {
      console.warn(`TMux session creation failed: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Initialize resource tracking for agent
   */
  initializeResourceTracking(agentId, pid) {
    // Track memory usage
    this.resources.memory.set(agentId, {
      current: 0,
      peak: 0,
      average: 0,
      samples: []
    });
    
    // Track CPU usage
    this.resources.cpu.set(agentId, {
      current: 0,
      peak: 0,
      average: 0,
      samples: []
    });
    
    // Start tracking interval for this agent
    const trackingInterval = setInterval(() => {
      if (!this.agents.has(agentId)) {
        clearInterval(trackingInterval);
        return;
      }
      
      this.updateResourceMetrics(agentId, pid);
    }, 5000); // Update every 5 seconds
  }
  
  /**
   * Update resource metrics for an agent
   */
  async updateResourceMetrics(agentId, pid) {
    try {
      // Get process stats (simplified - would use proper system calls in production)
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      // Update memory tracking
      const memData = this.resources.memory.get(agentId);
      if (memData) {
        memData.current = memUsage.heapUsed;
        memData.samples.push(memUsage.heapUsed);
        if (memUsage.heapUsed > memData.peak) {
          memData.peak = memUsage.heapUsed;
        }
        memData.average = memData.samples.reduce((a, b) => a + b, 0) / memData.samples.length;
      }
      
      // Update CPU tracking
      const cpuData = this.resources.cpu.get(agentId);
      if (cpuData) {
        const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to percentage
        cpuData.current = cpuPercent;
        cpuData.samples.push(cpuPercent);
        if (cpuPercent > cpuData.peak) {
          cpuData.peak = cpuPercent;
        }
        cpuData.average = cpuData.samples.reduce((a, b) => a + b, 0) / cpuData.samples.length;
      }
      
      // Check for resource warnings
      if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB warning
        this.emit('resource-warning', {
          agentId,
          type: 'memory',
          value: memUsage.heapUsed,
          threshold: 500 * 1024 * 1024
        });
      }
      
    } catch (error) {
      // Ignore errors in resource tracking
    }
  }
  
  /**
   * Monitor agent lifecycle
   */
  monitorAgentLifecycle(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) return;
    
    // Set timeout for agent
    if (agent.config.timeout) {
      setTimeout(() => {
        if (this.agents.has(agentId) && this.agents.get(agentId).status === 'active') {
          this.terminateAgent(agentId, 'timeout');
        }
      }, agent.config.timeout);
    }
    
    // Monitor context window usage
    const contextInterval = setInterval(() => {
      if (!this.agents.has(agentId)) {
        clearInterval(contextInterval);
        return;
      }
      
      const tokenUsage = this.resources.tokens.get(agentId) || 0;
      if (tokenUsage > agent.config.contextWindow * 0.9) {
        this.emit('context-warning', {
          agentId,
          usage: tokenUsage,
          limit: agent.config.contextWindow,
          percentage: (tokenUsage / agent.config.contextWindow) * 100
        });
      }
      
      if (tokenUsage >= agent.config.contextWindow) {
        this.metrics.contextOverflows++;
        this.terminateAgent(agentId, 'context-overflow');
        clearInterval(contextInterval);
      }
    }, 10000); // Check every 10 seconds
  }
  
  /**
   * Update token usage for an agent
   */
  updateTokenUsage(agentId, tokens) {
    const current = this.resources.tokens.get(agentId) || 0;
    const updated = current + tokens;
    this.resources.tokens.set(agentId, updated);
    
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.tokenUsage = updated;
    }
    
    return updated;
  }
  
  /**
   * Handle agent output
   */
  handleAgentOutput(agentId, output) {
    const agent = this.agents.get(agentId);
    if (!agent) return;
    
    // Update message count
    agent.messageCount++;
    
    // Estimate token usage (rough estimate: 1 token per 4 characters)
    const estimatedTokens = Math.ceil(output.length / 4);
    this.updateTokenUsage(agentId, estimatedTokens);
    
    // Emit output event
    this.emit('agent-output', {
      agentId,
      type: agent.type,
      output: output,
      timestamp: Date.now()
    });
  }
  
  /**
   * Handle agent errors
   */
  handleAgentError(agentId, error) {
    const agent = this.agents.get(agentId);
    if (!agent) return;
    
    this.metrics.errors.push({
      agentId,
      type: agent.type,
      error: error,
      timestamp: Date.now()
    });
    
    this.emit('agent-error', {
      agentId,
      type: agent.type,
      error: error
    });
    
    // Check if we should retry
    if (agent.config.retries > 0) {
      agent.config.retries--;
      this.emit('agent-retry', {
        agentId,
        remainingRetries: agent.config.retries
      });
    } else {
      this.terminateAgent(agentId, 'error');
    }
  }
  
  /**
   * Handle agent process exit
   */
  handleAgentExit(agentId, code, signal) {
    const agent = this.agents.get(agentId);
    if (!agent) return;
    
    agent.status = 'terminated';
    agent.exitCode = code;
    agent.exitSignal = signal;
    agent.endTime = Date.now();
    
    // Calculate lifetime
    const lifetime = agent.endTime - agent.spawnTime;
    this.updateAverageLifetime(lifetime);
    
    // Clean up resources
    this.cleanupAgent(agentId);
    
    this.emit('agent-terminated', {
      agentId,
      type: agent.type,
      code,
      signal,
      lifetime
    });
  }
  
  /**
   * Terminate an agent
   */
  async terminateAgent(agentId, reason = 'manual') {
    const agent = this.agents.get(agentId);
    if (!agent) return false;
    
    // Update status
    agent.status = 'terminating';
    agent.terminationReason = reason;
    
    // Kill process
    const process = this.processes.get(agentId);
    if (process) {
      try {
        process.kill('SIGTERM');
        
        // Force kill after timeout
        setTimeout(() => {
          if (this.processes.has(agentId)) {
            process.kill('SIGKILL');
          }
        }, 5000);
      } catch (error) {
        console.error(`Error terminating agent ${agentId}:`, error);
      }
    }
    
    // Close TMux session
    if (this.tmuxEnabled && agent.sessionId) {
      try {
        await this.execCommand(`tmux kill-session -t ${agent.sessionId}`);
      } catch (error) {
        // Ignore TMux errors
      }
    }
    
    // Clean up
    await this.cleanupAgent(agentId);
    
    this.metrics.totalTerminated++;
    
    return true;
  }
  
  /**
   * Clean up agent resources
   */
  async cleanupAgent(agentId) {
    // Remove from registries
    this.agents.delete(agentId);
    this.processes.delete(agentId);
    this.sessions.delete(agentId);
    
    // Clean up resource tracking
    this.resources.memory.delete(agentId);
    this.resources.cpu.delete(agentId);
    this.resources.tokens.delete(agentId);
    this.resources.startTimes.delete(agentId);
  }
  
  /**
   * Update average lifetime metric
   */
  updateAverageLifetime(lifetime) {
    const total = this.metrics.totalTerminated;
    if (total === 0) {
      this.metrics.averageLifetime = lifetime;
    } else {
      this.metrics.averageLifetime = 
        (this.metrics.averageLifetime * (total - 1) + lifetime) / total;
    }
  }
  
  /**
   * Get agent status
   */
  getAgentStatus(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) return null;
    
    return {
      id: agent.id,
      type: agent.type,
      status: agent.status,
      pid: agent.pid,
      sessionId: agent.sessionId,
      tokenUsage: agent.tokenUsage,
      messageCount: agent.messageCount,
      lifetime: Date.now() - agent.spawnTime,
      resources: {
        memory: this.resources.memory.get(agentId),
        cpu: this.resources.cpu.get(agentId)
      }
    };
  }
  
  /**
   * Get all agents status
   */
  getAllAgentsStatus() {
    const statuses = [];
    for (const agentId of this.agents.keys()) {
      statuses.push(this.getAgentStatus(agentId));
    }
    return statuses;
  }
  
  /**
   * Get performance metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      currentActive: this.agents.size,
      resourceUsage: {
        totalMemory: Array.from(this.resources.memory.values())
          .reduce((sum, data) => sum + (data.current || 0), 0),
        totalCpu: Array.from(this.resources.cpu.values())
          .reduce((sum, data) => sum + (data.current || 0), 0),
        totalTokens: Array.from(this.resources.tokens.values())
          .reduce((sum, val) => sum + val, 0)
      }
    };
  }
  
  /**
   * Start resource monitoring loop
   */
  startResourceMonitoring() {
    this.monitoringInterval = setInterval(() => {
      this.emit('metrics-update', this.getMetrics());
    }, 10000); // Every 10 seconds
  }
  
  /**
   * Execute shell command (helper)
   */
  execCommand(command) {
    return new Promise((resolve, reject) => {
      require('child_process').exec(command, (error, stdout, stderr) => {
        if (error) reject(error);
        else resolve(stdout);
      });
    });
  }
  
  /**
   * Get default template for agent type
   */
  getDefaultTemplate(type) {
    return `---
name: ${type}
description: Default ${type} agent
context_window: ${this.contextWindowLimit}
---

You are a specialized ${type} agent.

## Core Responsibilities
- Perform ${type} tasks efficiently
- Report results to Queen Controller
- Collaborate with other agents

## Communication Protocol
- Input: Task assignments from Queen Controller
- Output: Results and status updates
`;
  }
  
  /**
   * Shutdown manager
   */
  async shutdown() {
    // Stop monitoring
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    // Terminate all agents
    const agentIds = Array.from(this.agents.keys());
    for (const agentId of agentIds) {
      await this.terminateAgent(agentId, 'shutdown');
    }
    
    this.emit('shutdown-complete');
  }
}

module.exports = SubAgentManager;