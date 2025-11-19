/**
 * Cross-Platform Process Management System for Claude Flow 2.0
 * Handles platform-specific process spawning, management, and monitoring
 * Optimized for Windows, macOS, and Linux environments
 */

const { spawn, exec, fork } = require('child_process');
const { EventEmitter } = require('events');
const os = require('os');
const path = require('path');
const fs = require('fs').promises;
const { promisify } = require('util');
const PlatformDetector = require('./platform-detector');
const pathHandler = require('./path-handler').default;

const execAsync = promisify(exec);

/**
 * Cross-Platform Process Manager
 */
class ProcessManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      maxProcesses: options.maxProcesses || os.cpus().length * 2,
      processTimeout: options.processTimeout || 300000, // 5 minutes
      restartDelay: options.restartDelay || 5000,
      maxRestarts: options.maxRestarts || 3,
      logLevel: options.logLevel || 'info',
      ...options
    };
    
    this.platformDetector = new PlatformDetector();
    this.platform = null;
    this.processes = new Map();
    this.processCount = 0;
    this.isInitialized = false;
  }

  /**
   * Initialize the process manager
   */
  async initialize() {
    if (this.isInitialized) return;
    
    this.platform = await this.platformDetector.initialize();
    this.isInitialized = true;
    
    // Setup platform-specific configurations
    this.setupPlatformConfig();
    
    this.log('info', `Process Manager initialized for ${this.platformDetector.getPlatformDisplay()}`);
  }

  /**
   * Spawn a new process with platform-specific optimizations
   * @param {string} command - Command to execute
   * @param {string[]} args - Command arguments
   * @param {object} options - Spawn options
   * @returns {Promise<ManagedProcess>} Managed process instance
   */
  async spawn(command, args = [], options = {}) {
    await this.ensureInitialized();
    
    if (this.processCount >= this.options.maxProcesses) {
      throw new Error(`Maximum process limit reached: ${this.options.maxProcesses}`);
    }

    const processOptions = this.buildProcessOptions(options);
    const managedProcess = new ManagedProcess(command, args, processOptions, this);
    
    await managedProcess.start();
    
    this.processes.set(managedProcess.id, managedProcess);
    this.processCount++;
    
    this.emit('processSpawned', managedProcess);
    
    return managedProcess;
  }

  /**
   * Spawn Claude Flow agent with platform optimizations
   * @param {string} agentType - Type of agent to spawn
   * @param {object} config - Agent configuration
   * @returns {Promise<ManagedProcess>} Agent process
   */
  async spawnClaudeFlowAgent(agentType, config = {}) {
    const command = this.getNodeCommand();
    const args = this.buildClaudeFlowAgentArgs(agentType, config);
    const options = this.getAgentSpawnOptions(config);
    
    return await this.spawn(command, args, options);
  }

  /**
   * Spawn multiple agents in parallel (Queen Controller support)
   * @param {number} agentCount - Number of agents to spawn
   * @param {object} config - Base configuration
   * @returns {Promise<ManagedProcess[]>} Array of agent processes
   */
  async spawnAgentSwarm(agentCount = 10, config = {}) {
    const agents = [];
    const batchSize = Math.min(agentCount, this.options.maxProcesses);
    
    this.log('info', `Spawning ${agentCount} agents in batches of ${batchSize}`);
    
    for (let i = 0; i < agentCount; i += batchSize) {
      const batch = [];
      const currentBatchSize = Math.min(batchSize, agentCount - i);
      
      for (let j = 0; j < currentBatchSize; j++) {
        const agentId = i + j;
        const agentConfig = {
          ...config,
          agentId,
          port: (config.basePort || 3000) + agentId
        };
        
        batch.push(this.spawnClaudeFlowAgent('worker', agentConfig));
      }
      
      const batchResults = await Promise.all(batch);
      agents.push(...batchResults);
      
      // Brief pause between batches to prevent system overload
      if (i + batchSize < agentCount) {
        await this.sleep(1000);
      }
    }
    
    this.log('info', `Successfully spawned ${agents.length} agents`);
    return agents;
  }

  /**
   * Execute command with platform-specific handling
   * @param {string} command - Command to execute
   * @param {object} options - Execution options
   * @returns {Promise<object>} Execution result
   */
  async execute(command, options = {}) {
    await this.ensureInitialized();
    
    const execOptions = {
      timeout: options.timeout || this.options.processTimeout,
      maxBuffer: options.maxBuffer || 1024 * 1024 * 10, // 10MB
      env: { ...process.env, ...options.env },
      cwd: options.cwd || process.cwd(),
      ...this.getPlatformExecOptions()
    };

    try {
      const result = await execAsync(command, execOptions);
      return {
        success: true,
        stdout: result.stdout,
        stderr: result.stderr,
        command
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stdout: error.stdout || '',
        stderr: error.stderr || '',
        code: error.code,
        command
      };
    }
  }

  /**
   * Kill process by ID
   * @param {string} processId - Process ID to kill
   * @param {boolean} force - Force kill
   * @returns {Promise<boolean>} Success status
   */
  async killProcess(processId, force = false) {
    const managedProcess = this.processes.get(processId);
    if (!managedProcess) {
      return false;
    }

    try {
      await managedProcess.kill(force);
      this.processes.delete(processId);
      this.processCount--;
      this.emit('processKilled', processId);
      return true;
    } catch (error) {
      this.log('error', `Failed to kill process ${processId}: ${error.message}`);
      return false;
    }
  }

  /**
   * Kill all managed processes
   * @param {boolean} force - Force kill all processes
   * @returns {Promise<number>} Number of processes killed
   */
  async killAll(force = false) {
    const processIds = Array.from(this.processes.keys());
    let killedCount = 0;

    await Promise.all(processIds.map(async (processId) => {
      const success = await this.killProcess(processId, force);
      if (success) killedCount++;
    }));

    this.log('info', `Killed ${killedCount}/${processIds.length} processes`);
    return killedCount;
  }

  /**
   * Get process information
   * @param {string} processId - Process ID
   * @returns {object|null} Process information
   */
  getProcessInfo(processId) {
    const managedProcess = this.processes.get(processId);
    return managedProcess ? managedProcess.getInfo() : null;
  }

  /**
   * List all managed processes
   * @returns {object[]} Array of process information
   */
  listProcesses() {
    return Array.from(this.processes.values()).map(process => process.getInfo());
  }

  /**
   * Get system process information
   * @returns {Promise<object[]>} System processes
   */
  async getSystemProcesses() {
    if (this.platformDetector.isWindows()) {
      return await this.getWindowsProcesses();
    } else {
      return await this.getUnixProcesses();
    }
  }

  /**
   * Monitor process health
   * @param {number} interval - Monitoring interval in ms
   */
  startHealthMonitoring(interval = 30000) {
    if (this.healthMonitorInterval) {
      clearInterval(this.healthMonitorInterval);
    }

    this.healthMonitorInterval = setInterval(() => {
      this.performHealthCheck();
    }, interval);

    this.log('info', `Health monitoring started (interval: ${interval}ms)`);
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring() {
    if (this.healthMonitorInterval) {
      clearInterval(this.healthMonitorInterval);
      this.healthMonitorInterval = null;
      this.log('info', 'Health monitoring stopped');
    }
  }

  // Private methods

  /**
   * Setup platform-specific configuration
   * @private
   */
  setupPlatformConfig() {
    this.platformConfig = {
      isWindows: this.platformDetector.isWindows(),
      isMacOS: this.platformDetector.isMacOS(),
      isLinux: this.platformDetector.isLinux(),
      shell: this.platform.platformConfig.commands.shell,
      maxFileDescriptors: this.platform.platformConfig.processes.maxFileDescriptors,
      spawnOptions: this.platform.platformConfig.processes.processSpawnOptions
    };
  }

  /**
   * Build platform-specific process options
   * @private
   * @param {object} options - User options
   * @returns {object} Platform-specific options
   */
  buildProcessOptions(options) {
    const baseOptions = {
      stdio: options.stdio || 'pipe',
      env: { ...process.env, ...options.env },
      cwd: options.cwd || process.cwd(),
      ...this.platformConfig.spawnOptions
    };

    // Platform-specific optimizations
    if (this.platformConfig.isWindows) {
      baseOptions.windowsHide = options.windowsHide !== false;
      baseOptions.windowsVerbatimArguments = options.windowsVerbatimArguments || false;
    } else {
      baseOptions.uid = options.uid;
      baseOptions.gid = options.gid;
    }

    return baseOptions;
  }

  /**
   * Get Node.js command for current platform
   * @private
   * @returns {string} Node command
   */
  getNodeCommand() {
    return process.execPath;
  }

  /**
   * Build Claude Flow agent arguments
   * @private
   * @param {string} agentType - Agent type
   * @param {object} config - Agent configuration
   * @returns {string[]} Command arguments
   */
  buildClaudeFlowAgentArgs(agentType, config) {
    const args = [
      '-e', `require('claude-flow').startAgent('${agentType}', ${JSON.stringify(config)})`
    ];

    return args;
  }

  /**
   * Get agent spawn options
   * @private
   * @param {object} config - Agent configuration
   * @returns {object} Spawn options
   */
  getAgentSpawnOptions(config) {
    return {
      env: {
        ...process.env,
        CLAUDE_FLOW_AGENT_ID: config.agentId,
        CLAUDE_FLOW_AGENT_PORT: config.port,
        CLAUDE_FLOW_LOG_LEVEL: this.options.logLevel
      },
      stdio: ['ignore', 'pipe', 'pipe', 'ipc']
    };
  }

  /**
   * Get platform-specific exec options
   * @private
   * @returns {object} Exec options
   */
  getPlatformExecOptions() {
    const options = {};

    if (this.platformConfig.isWindows) {
      options.windowsHide = true;
      options.shell = 'cmd';
    } else {
      options.shell = '/bin/bash';
    }

    return options;
  }

  /**
   * Get Windows processes
   * @private
   * @returns {Promise<object[]>} Windows processes
   */
  async getWindowsProcesses() {
    try {
      const result = await this.execute('tasklist /fo csv /nh');
      if (!result.success) return [];

      return result.stdout.split('\n')
        .filter(line => line.trim())
        .map(line => {
          const parts = line.split('","');
          if (parts.length >= 5) {
            return {
              name: parts[0].replace(/"/g, ''),
              pid: parseInt(parts[1]),
              memory: parts[4].replace(/[",]/g, '')
            };
          }
          return null;
        })
        .filter(Boolean);
    } catch (error) {
      this.log('error', `Failed to get Windows processes: ${error.message}`);
      return [];
    }
  }

  /**
   * Get Unix processes
   * @private
   * @returns {Promise<object[]>} Unix processes
   */
  async getUnixProcesses() {
    try {
      const result = await this.execute('ps aux');
      if (!result.success) return [];

      return result.stdout.split('\n')
        .slice(1) // Skip header
        .filter(line => line.trim())
        .map(line => {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 11) {
            return {
              user: parts[0],
              pid: parseInt(parts[1]),
              cpu: parseFloat(parts[2]),
              memory: parseFloat(parts[3]),
              command: parts.slice(10).join(' ')
            };
          }
          return null;
        })
        .filter(Boolean);
    } catch (error) {
      this.log('error', `Failed to get Unix processes: ${error.message}`);
      return [];
    }
  }

  /**
   * Perform health check on all processes
   * @private
   */
  async performHealthCheck() {
    const healthReport = {
      timestamp: new Date().toISOString(),
      totalProcesses: this.processCount,
      healthyProcesses: 0,
      unhealthyProcesses: 0,
      issues: []
    };

    for (const [processId, managedProcess] of this.processes.entries()) {
      try {
        const isHealthy = await managedProcess.checkHealth();
        if (isHealthy) {
          healthReport.healthyProcesses++;
        } else {
          healthReport.unhealthyProcesses++;
          healthReport.issues.push({
            processId,
            issue: 'Process not responding',
            timestamp: new Date().toISOString()
          });
          
          // Attempt restart if configured
          if (managedProcess.restartCount < this.options.maxRestarts) {
            this.log('warn', `Restarting unresponsive process: ${processId}`);
            await managedProcess.restart();
          }
        }
      } catch (error) {
        healthReport.unhealthyProcesses++;
        healthReport.issues.push({
          processId,
          issue: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    this.emit('healthReport', healthReport);
    
    if (healthReport.issues.length > 0) {
      this.log('warn', `Health check found ${healthReport.issues.length} issues`);
    }
  }

  /**
   * Ensure manager is initialized
   * @private
   */
  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  /**
   * Sleep utility
   * @private
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Log message
   * @private
   * @param {string} level - Log level
   * @param {string} message - Log message
   */
  log(level, message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}] ProcessManager: ${message}`);
    this.emit('log', { level, message, timestamp });
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    this.stopHealthMonitoring();
    await this.killAll(true);
    this.removeAllListeners();
  }
}

/**
 * Managed Process wrapper
 */
class ManagedProcess extends EventEmitter {
  constructor(command, args, options, manager) {
    super();
    
    this.id = this.generateId();
    this.command = command;
    this.args = args;
    this.options = options;
    this.manager = manager;
    this.process = null;
    this.startTime = null;
    this.restartCount = 0;
    this.isHealthy = true;
    this.lastHeartbeat = null;
  }

  /**
   * Start the process
   */
  async start() {
    try {
      this.process = spawn(this.command, this.args, this.options);
      this.startTime = new Date();
      this.setupProcessHandlers();
      
      this.emit('started', this.getInfo());
      this.manager.log('info', `Process started: ${this.id} (${this.command})`);
      
      return this;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Kill the process
   * @param {boolean} force - Force kill
   */
  async kill(force = false) {
    if (!this.process) return;

    const signal = force ? 'SIGKILL' : 'SIGTERM';
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (force) {
          reject(new Error('Failed to force kill process'));
        } else {
          // Try force kill
          this.process.kill('SIGKILL');
          resolve();
        }
      }, 5000);

      this.process.on('exit', () => {
        clearTimeout(timeout);
        resolve();
      });

      this.process.kill(signal);
    });
  }

  /**
   * Restart the process
   */
  async restart() {
    try {
      await this.kill();
      this.restartCount++;
      
      await this.manager.sleep(this.manager.options.restartDelay);
      await this.start();
      
      this.emit('restarted', this.getInfo());
      this.manager.log('info', `Process restarted: ${this.id} (count: ${this.restartCount})`);
      
      return this;
    } catch (error) {
      this.emit('restartError', error);
      throw error;
    }
  }

  /**
   * Check process health
   */
  async checkHealth() {
    if (!this.process || this.process.killed) {
      this.isHealthy = false;
      return false;
    }

    // Simple health check - process is running
    try {
      process.kill(this.process.pid, 0);
      this.isHealthy = true;
      this.lastHeartbeat = new Date();
      return true;
    } catch (error) {
      this.isHealthy = false;
      return false;
    }
  }

  /**
   * Send message to process (if IPC enabled)
   * @param {any} message - Message to send
   */
  send(message) {
    if (this.process && this.process.send) {
      this.process.send(message);
    } else {
      throw new Error('IPC not available for this process');
    }
  }

  /**
   * Get process information
   */
  getInfo() {
    return {
      id: this.id,
      command: this.command,
      args: this.args,
      pid: this.process ? this.process.pid : null,
      startTime: this.startTime,
      uptime: this.startTime ? Date.now() - this.startTime.getTime() : 0,
      restartCount: this.restartCount,
      isHealthy: this.isHealthy,
      lastHeartbeat: this.lastHeartbeat,
      status: this.getStatus()
    };
  }

  /**
   * Get process status
   * @private
   */
  getStatus() {
    if (!this.process) return 'not_started';
    if (this.process.killed) return 'killed';
    if (this.process.exitCode !== null) return 'exited';
    return 'running';
  }

  /**
   * Setup process event handlers
   * @private
   */
  setupProcessHandlers() {
    this.process.on('exit', (code, signal) => {
      this.emit('exit', { code, signal });
      this.manager.log('info', `Process exited: ${this.id} (code: ${code}, signal: ${signal})`);
    });

    this.process.on('error', (error) => {
      this.isHealthy = false;
      this.emit('error', error);
      this.manager.log('error', `Process error: ${this.id} - ${error.message}`);
    });

    if (this.process.stdout) {
      this.process.stdout.on('data', (data) => {
        this.emit('stdout', data);
      });
    }

    if (this.process.stderr) {
      this.process.stderr.on('data', (data) => {
        this.emit('stderr', data);
      });
    }

    if (this.process.send) {
      this.process.on('message', (message) => {
        this.emit('message', message);
      });
    }
  }

  /**
   * Generate unique process ID
   * @private
   */
  generateId() {
    return `proc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = {
  ProcessManager,
  ManagedProcess
};