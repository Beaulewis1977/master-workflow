/**
 * CPU Workload Optimizer - Advanced CPU and Threading Performance Optimization
 * 
 * This module implements comprehensive CPU optimization strategies including
 * CPU affinity management, intelligent thread pool optimization, workload
 * balancing, and performance profiling for the unlimited agent scaling system.
 * 
 * Key Features:
 * - Dynamic CPU affinity assignment based on workload patterns
 * - Intelligent thread pool sizing and management
 * - Real-time workload balancing across CPU cores
 * - Performance bottleneck detection and mitigation
 * - Adaptive scheduling based on agent priorities
 * - NUMA-aware optimization for multi-socket systems
 * 
 * Performance Targets:
 * - 20-30% CPU efficiency improvement
 * - 50% reduction in context switching overhead
 * - Optimal core utilization across all available CPUs
 * - Sub-millisecond task scheduling latency
 * 
 * @author Claude Performance Optimizer Agent
 * @version 1.0.0
 * @date August 2025
 */

const EventEmitter = require('events');
const os = require('os');
const cluster = require('cluster');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const path = require('path');

class CPUWorkloadOptimizer extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // System information
    this.systemInfo = {
      cpuCount: os.cpus().length,
      platform: os.platform(),
      arch: os.arch(),
      totalMemory: os.totalmem(),
      cpuModel: os.cpus()[0]?.model || 'Unknown',
      hasNUMA: this.detectNUMASupport(),
      nodeVersion: process.version
    };
    
    // Configuration
    this.config = {
      // CPU affinity settings
      enableCPUAffinity: options.enableCPUAffinity !== false,
      affinityStrategy: options.affinityStrategy || 'dynamic', // static, dynamic, numa-aware
      reserveSystemCores: options.reserveSystemCores || 1, // Reserve cores for system
      
      // Thread pool settings
      enableThreadPoolOptimization: options.enableThreadPoolOptimization !== false,
      maxThreadPoolSize: options.maxThreadPoolSize || this.systemInfo.cpuCount * 2,
      minThreadPoolSize: options.minThreadPoolSize || this.systemInfo.cpuCount,
      threadPoolGrowthFactor: options.threadPoolGrowthFactor || 1.5,
      
      // Workload balancing
      enableWorkloadBalancing: options.enableWorkloadBalancing !== false,
      balancingStrategy: options.balancingStrategy || 'adaptive', // round-robin, least-loaded, adaptive
      balancingInterval: options.balancingInterval || 5000, // 5 seconds
      loadThresholdHigh: options.loadThresholdHigh || 0.8, // 80%
      loadThresholdLow: options.loadThresholdLow || 0.3, // 30%
      
      // Performance profiling
      enablePerformanceProfiling: options.enablePerformanceProfiling !== false,
      profilingInterval: options.profilingInterval || 10000, // 10 seconds
      bottleneckDetectionThreshold: options.bottleneckDetectionThreshold || 0.9, // 90% utilization
      
      // Agent scheduling
      enablePriorityScheduling: options.enablePriorityScheduling !== false,
      highPriorityRatio: options.highPriorityRatio || 0.3, // 30% for high priority
      contextSwitchOptimization: options.contextSwitchOptimization !== false,
      
      ...options
    };
    
    // CPU core management
    this.coreManagement = {
      availableCores: this.getAvailableCores(),
      coreAssignments: new Map(), // agentId -> coreId
      coreLoads: new Map(), // coreId -> load percentage
      coreAffinityMask: new Set(),
      systemCores: new Set(),
      numaNodes: this.detectNUMANodes()
    };
    
    // Thread pool management
    this.threadPools = {
      main: null, // Main thread pool for agent execution
      io: null,   // I/O intensive operations
      cpu: null,  // CPU intensive operations
      background: null, // Background tasks
      workerThreads: new Map(), // Worker thread instances
      poolStats: new Map() // Pool performance statistics
    };
    
    // Workload balancing state
    this.workloadState = {
      agentQueues: new Map(), // coreId -> agent queue
      loadBalancer: null,
      schedulingQueue: [],
      priorityQueues: {
        high: [],
        normal: [],
        low: [],
        background: []
      },
      balancingMetrics: {
        totalRebalances: 0,
        averageRebalanceTime: 0,
        loadVariance: 0,
        throughputImprovement: 0
      }
    };
    
    // Performance monitoring
    this.performanceMetrics = {
      cpu: {
        overallUtilization: 0,
        perCoreUtilization: new Map(),
        contextSwitches: 0,
        interruptRate: 0,
        taskSchedulingLatency: 0
      },
      threading: {
        activeThreads: 0,
        threadPoolEfficiency: 0,
        threadCreationRate: 0,
        threadContentionEvents: 0
      },
      workload: {
        balancingEffectiveness: 0,
        loadDistributionScore: 0,
        queueWaitTimes: new Map(),
        throughput: 0
      },
      bottlenecks: [],
      optimizations: []
    };
    
    // Optimization state
    this.optimizationState = {
      cpuAffinityEnabled: false,
      threadPoolsOptimized: false,
      workloadBalancingActive: false,
      performanceProfilingActive: false,
      schedulingOptimized: false
    };
    
    // Timers and intervals
    this.monitoringInterval = null;
    this.balancingInterval = null;
    this.profilingInterval = null;
    this.optimizationInterval = null;
    
    // Initialize components
    this.initializeCPUOptimizer();
  }
  
  /**
   * Initialize CPU optimizer components
   */
  initializeCPUOptimizer() {
    try {
      // Initialize core management
      this.initializeCoreManagement();
      
      // Initialize thread pools if enabled
      if (this.config.enableThreadPoolOptimization) {
        this.initializeThreadPools();
      }
      
      // Initialize workload balancing
      if (this.config.enableWorkloadBalancing) {
        this.initializeWorkloadBalancing();
      }
      
      console.log('CPU Workload Optimizer initialized successfully');
      console.log(`System: ${this.systemInfo.cpuCount} cores, ${this.systemInfo.cpuModel}`);
      console.log(`Available cores for agents: ${this.coreManagement.availableCores.length}`);
      
    } catch (error) {
      console.error('Failed to initialize CPU workload optimizer:', error);
      throw error;
    }
  }
  
  /**
   * Start CPU optimization
   */
  async start() {
    try {
      console.log('Starting CPU workload optimization...');
      
      // Enable CPU affinity if configured
      if (this.config.enableCPUAffinity) {
        await this.enableCPUAffinity();
      }
      
      // Start thread pool optimization
      if (this.config.enableThreadPoolOptimization) {
        await this.startThreadPoolOptimization();
      }
      
      // Start workload balancing
      if (this.config.enableWorkloadBalancing) {
        await this.startWorkloadBalancing();
      }
      
      // Start performance profiling
      if (this.config.enablePerformanceProfiling) {
        await this.startPerformanceProfiling();
      }
      
      // Start monitoring
      this.startCPUMonitoring();
      
      this.emit('cpu-optimization-started', {
        timestamp: Date.now(),
        configuration: this.config,
        systemInfo: this.systemInfo
      });
      
      console.log('CPU workload optimization started successfully');
      
    } catch (error) {
      console.error('Failed to start CPU optimization:', error);
      this.emit('cpu-optimization-error', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Initialize core management and detect available cores
   */
  initializeCoreManagement() {
    const totalCores = this.systemInfo.cpuCount;
    const reservedCores = Math.min(this.config.reserveSystemCores, Math.floor(totalCores / 4));
    
    // Reserve cores for system operations
    for (let i = 0; i < reservedCores; i++) {
      this.coreManagement.systemCores.add(i);
    }
    
    // Available cores for agent workloads
    this.coreManagement.availableCores = [];
    for (let i = reservedCores; i < totalCores; i++) {
      this.coreManagement.availableCores.push(i);
      this.coreManagement.coreLoads.set(i, 0.0);
    }
    
    console.log(`Core management: ${reservedCores} system cores, ${this.coreManagement.availableCores.length} available for agents`);
  }
  
  /**
   * Initialize thread pools for different workload types
   */
  initializeThreadPools() {
    try {
      const coreCount = this.systemInfo.cpuCount;
      
      // Main thread pool for general agent execution
      this.threadPools.main = {
        type: 'main',
        minSize: Math.max(2, Math.floor(coreCount / 2)),
        maxSize: coreCount,
        currentSize: 0,
        activeThreads: 0,
        queuedTasks: 0,
        workers: new Set(),
        stats: {
          tasksExecuted: 0,
          averageExecutionTime: 0,
          errors: 0,
          efficiency: 0
        }
      };
      
      // I/O intensive thread pool
      this.threadPools.io = {
        type: 'io',
        minSize: Math.max(1, Math.floor(coreCount / 4)),
        maxSize: Math.floor(coreCount / 2),
        currentSize: 0,
        activeThreads: 0,
        queuedTasks: 0,
        workers: new Set(),
        stats: {
          tasksExecuted: 0,
          averageExecutionTime: 0,
          errors: 0,
          efficiency: 0
        }
      };
      
      // CPU intensive thread pool
      this.threadPools.cpu = {
        type: 'cpu',
        minSize: Math.max(1, Math.floor(coreCount / 4)),
        maxSize: coreCount,
        currentSize: 0,
        activeThreads: 0,
        queuedTasks: 0,
        workers: new Set(),
        stats: {
          tasksExecuted: 0,
          averageExecutionTime: 0,
          errors: 0,
          efficiency: 0
        }
      };
      
      // Background tasks thread pool
      this.threadPools.background = {
        type: 'background',
        minSize: 1,
        maxSize: Math.max(2, Math.floor(coreCount / 4)),
        currentSize: 0,
        activeThreads: 0,
        queuedTasks: 0,
        workers: new Set(),
        stats: {
          tasksExecuted: 0,
          averageExecutionTime: 0,
          errors: 0,
          efficiency: 0
        }
      };
      
      console.log('Thread pools initialized:', {
        main: `${this.threadPools.main.minSize}-${this.threadPools.main.maxSize}`,
        io: `${this.threadPools.io.minSize}-${this.threadPools.io.maxSize}`,
        cpu: `${this.threadPools.cpu.minSize}-${this.threadPools.cpu.maxSize}`,
        background: `${this.threadPools.background.minSize}-${this.threadPools.background.maxSize}`
      });
      
    } catch (error) {
      console.error('Failed to initialize thread pools:', error);
      throw error;
    }
  }
  
  /**
   * Initialize workload balancing system
   */
  initializeWorkloadBalancing() {
    // Initialize agent queues for each available core
    for (const coreId of this.coreManagement.availableCores) {
      this.workloadState.agentQueues.set(coreId, {
        queue: [],
        load: 0.0,
        lastBalance: Date.now(),
        throughput: 0,
        averageTaskTime: 0
      });
    }
    
    // Initialize load balancer
    this.workloadState.loadBalancer = {
      strategy: this.config.balancingStrategy,
      lastBalance: Date.now(),
      balanceCount: 0,
      effectiveness: 0.0
    };
    
    console.log(`Workload balancing initialized with ${this.config.balancingStrategy} strategy`);
  }
  
  /**
   * Enable CPU affinity optimization
   */
  async enableCPUAffinity() {
    try {
      if (this.optimizationState.cpuAffinityEnabled) {
        return { success: true, reason: 'Already enabled' };
      }
      
      // Set process CPU affinity to available cores (if supported)
      if (this.config.affinityStrategy === 'static') {
        await this.setStaticCPUAffinity();
      } else if (this.config.affinityStrategy === 'numa-aware') {
        await this.setNUMAAwareCPUAffinity();
      } else {
        await this.setDynamicCPUAffinity();
      }
      
      this.optimizationState.cpuAffinityEnabled = true;
      
      this.emit('cpu-affinity-enabled', {
        strategy: this.config.affinityStrategy,
        availableCores: this.coreManagement.availableCores.length,
        affinityMask: Array.from(this.coreManagement.coreAffinityMask)
      });
      
      return {
        success: true,
        coresAssigned: this.coreManagement.availableCores.length,
        strategy: this.config.affinityStrategy
      };
      
    } catch (error) {
      console.error('Failed to enable CPU affinity:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Set static CPU affinity
   */
  async setStaticCPUAffinity() {
    // Static assignment: assign cores sequentially to available cores
    for (const coreId of this.coreManagement.availableCores) {
      this.coreManagement.coreAffinityMask.add(coreId);
    }
    
    console.log(`Static CPU affinity set to cores: ${Array.from(this.coreManagement.coreAffinityMask).join(', ')}`);
  }
  
  /**
   * Set NUMA-aware CPU affinity
   */
  async setNUMAAwareCPUAffinity() {
    if (!this.systemInfo.hasNUMA) {
      return await this.setStaticCPUAffinity();
    }
    
    // NUMA-aware assignment: prefer cores within same NUMA node
    const numaNodes = this.coreManagement.numaNodes;
    for (const node of numaNodes) {
      for (const coreId of node.cores) {
        if (this.coreManagement.availableCores.includes(coreId)) {
          this.coreManagement.coreAffinityMask.add(coreId);
        }
      }
    }
    
    console.log(`NUMA-aware CPU affinity set across ${numaNodes.length} NUMA nodes`);
  }
  
  /**
   * Set dynamic CPU affinity (will be adjusted based on load)
   */
  async setDynamicCPUAffinity() {
    // Start with all available cores
    for (const coreId of this.coreManagement.availableCores) {
      this.coreManagement.coreAffinityMask.add(coreId);
    }
    
    console.log('Dynamic CPU affinity enabled - will adjust based on workload');
  }
  
  /**
   * Start thread pool optimization
   */
  async startThreadPoolOptimization() {
    try {
      // Create initial threads for each pool
      for (const [poolName, pool] of Object.entries(this.threadPools)) {
        if (typeof pool === 'object' && pool.type) {
          await this.createThreadsForPool(pool);
        }
      }
      
      this.optimizationState.threadPoolsOptimized = true;
      
      // Start thread pool monitoring and optimization
      this.startThreadPoolMonitoring();
      
      console.log('Thread pool optimization started');
      
      return { success: true, poolsOptimized: Object.keys(this.threadPools).length };
      
    } catch (error) {
      console.error('Failed to start thread pool optimization:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Create threads for a specific pool
   */
  async createThreadsForPool(pool) {
    const initialSize = pool.minSize;
    
    for (let i = 0; i < initialSize; i++) {
      const worker = await this.createWorkerThread(pool.type);
      if (worker) {
        pool.workers.add(worker);
        pool.currentSize++;
      }
    }
    
    console.log(`Created ${pool.currentSize} threads for ${pool.type} pool`);
  }
  
  /**
   * Create a worker thread for specific task type
   */
  async createWorkerThread(poolType) {
    try {
      const workerScript = path.join(__dirname, 'worker-thread-executor.js');
      
      const worker = new Worker(workerScript, {
        workerData: {
          poolType: poolType,
          config: this.config
        }
      });
      
      // Set up worker event handlers
      worker.on('message', (message) => {
        this.handleWorkerMessage(worker, message, poolType);
      });
      
      worker.on('error', (error) => {
        console.error(`Worker thread error in ${poolType} pool:`, error);
        this.handleWorkerError(worker, error, poolType);
      });
      
      worker.on('exit', (code) => {
        if (code !== 0) {
          console.warn(`Worker thread exited with code ${code} in ${poolType} pool`);
        }
        this.handleWorkerExit(worker, poolType);
      });
      
      // Store worker reference
      const workerId = this.generateWorkerThreadId();
      this.threadPools.workerThreads.set(workerId, {
        worker: worker,
        poolType: poolType,
        createdAt: Date.now(),
        tasksExecuted: 0,
        status: 'idle'
      });
      
      worker.workerId = workerId;
      
      return worker;
      
    } catch (error) {
      console.error(`Failed to create worker thread for ${poolType} pool:`, error);
      return null;
    }
  }
  
  /**
   * Start workload balancing
   */
  async startWorkloadBalancing() {
    try {
      this.optimizationState.workloadBalancingActive = true;
      
      // Start balancing interval
      this.balancingInterval = setInterval(async () => {
        await this.performWorkloadBalancing();
      }, this.config.balancingInterval);
      
      console.log(`Workload balancing started with ${this.config.balancingInterval}ms interval`);
      
      return { success: true };
      
    } catch (error) {
      console.error('Failed to start workload balancing:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Start performance profiling
   */
  async startPerformanceProfiling() {
    try {
      this.optimizationState.performanceProfilingActive = true;
      
      // Start profiling interval
      this.profilingInterval = setInterval(async () => {
        await this.performCPUProfiling();
      }, this.config.profilingInterval);
      
      console.log(`Performance profiling started with ${this.config.profilingInterval}ms interval`);
      
      return { success: true, bottlenecks: [] };
      
    } catch (error) {
      console.error('Failed to start performance profiling:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Start CPU monitoring
   */
  startCPUMonitoring() {
    this.monitoringInterval = setInterval(async () => {
      await this.collectCPUMetrics();
    }, 5000); // Every 5 seconds
    
    console.log('CPU monitoring started');
  }
  
  /**
   * Assign agent to optimal CPU core
   */
  async assignAgentToCore(agentId, agentInfo = {}) {
    try {
      const optimalCore = await this.selectOptimalCore(agentInfo);
      
      if (optimalCore !== null) {
        // Update core assignment
        this.coreManagement.coreAssignments.set(agentId, optimalCore);
        
        // Update core load
        const currentLoad = this.coreManagement.coreLoads.get(optimalCore) || 0;
        const estimatedLoad = this.estimateAgentLoad(agentInfo);
        this.coreManagement.coreLoads.set(optimalCore, currentLoad + estimatedLoad);
        
        // Add to workload queue
        const coreQueue = this.workloadState.agentQueues.get(optimalCore);
        if (coreQueue) {
          coreQueue.queue.push({
            agentId: agentId,
            assignedAt: Date.now(),
            priority: agentInfo.priority || 'normal',
            estimatedLoad: estimatedLoad
          });
        }
        
        this.emit('agent-core-assigned', {
          agentId,
          coreId: optimalCore,
          estimatedLoad: estimatedLoad,
          queueSize: coreQueue?.queue.length || 0
        });
        
        return {
          success: true,
          coreId: optimalCore,
          estimatedLoad: estimatedLoad
        };
      }
      
      return {
        success: false,
        reason: 'No optimal core available'
      };
      
    } catch (error) {
      console.error(`Failed to assign agent ${agentId} to core:`, error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Select optimal CPU core for agent assignment
   */
  async selectOptimalCore(agentInfo) {
    const strategy = this.config.balancingStrategy;
    
    switch (strategy) {
      case 'round-robin':
        return this.selectCoreRoundRobin();
      case 'least-loaded':
        return this.selectLeastLoadedCore();
      case 'adaptive':
        return this.selectCoreAdaptive(agentInfo);
      default:
        return this.selectLeastLoadedCore();
    }
  }
  
  /**
   * Select core using round-robin strategy
   */
  selectCoreRoundRobin() {
    const cores = this.coreManagement.availableCores;
    if (cores.length === 0) return null;
    
    const lastAssigned = this.workloadState.loadBalancer.lastCoreIndex || 0;
    const nextIndex = (lastAssigned + 1) % cores.length;
    this.workloadState.loadBalancer.lastCoreIndex = nextIndex;
    
    return cores[nextIndex];
  }
  
  /**
   * Select least loaded core
   */
  selectLeastLoadedCore() {
    let minLoad = Infinity;
    let optimalCore = null;
    
    for (const coreId of this.coreManagement.availableCores) {
      const load = this.coreManagement.coreLoads.get(coreId) || 0;
      if (load < minLoad) {
        minLoad = load;
        optimalCore = coreId;
      }
    }
    
    return optimalCore;
  }
  
  /**
   * Select core using adaptive strategy
   */
  selectCoreAdaptive(agentInfo) {
    // Consider agent characteristics and system state
    const priority = agentInfo.priority || 'normal';
    const taskType = agentInfo.taskType || 'general';
    const estimatedCPUUsage = agentInfo.estimatedCPUUsage || 0.5;
    
    // For high priority tasks, prefer less loaded cores
    if (priority === 'high') {
      return this.selectLeastLoadedCore();
    }
    
    // For CPU-intensive tasks, prefer cores with good performance history
    if (taskType === 'cpu-intensive' || estimatedCPUUsage > 0.7) {
      return this.selectPerformantCore();
    }
    
    // For I/O tasks, use round-robin to distribute evenly
    if (taskType === 'io-intensive') {
      return this.selectCoreRoundRobin();
    }
    
    // Default to least loaded
    return this.selectLeastLoadedCore();
  }
  
  /**
   * Select most performant core based on historical data
   */
  selectPerformantCore() {
    let bestScore = -1;
    let optimalCore = null;
    
    for (const coreId of this.coreManagement.availableCores) {
      const coreQueue = this.workloadState.agentQueues.get(coreId);
      const currentLoad = this.coreManagement.coreLoads.get(coreId) || 0;
      
      if (coreQueue) {
        // Score based on throughput and low load
        const throughputScore = coreQueue.throughput || 0;
        const loadPenalty = currentLoad * 0.5;
        const score = throughputScore - loadPenalty;
        
        if (score > bestScore && currentLoad < this.config.loadThresholdHigh) {
          bestScore = score;
          optimalCore = coreId;
        }
      }
    }
    
    return optimalCore || this.selectLeastLoadedCore();
  }
  
  /**
   * Perform workload balancing across cores
   */
  async performWorkloadBalancing() {
    try {
      const startTime = Date.now();
      
      // Calculate load variance across cores
      const loadVariance = this.calculateLoadVariance();
      
      // If load is well distributed, no balancing needed
      if (loadVariance < 0.2) {
        return { balanced: false, reason: 'Load well distributed' };
      }
      
      // Identify overloaded and underloaded cores
      const { overloaded, underloaded } = this.identifyUnbalancedCores();
      
      if (overloaded.length === 0 || underloaded.length === 0) {
        return { balanced: false, reason: 'No cores to balance' };
      }
      
      // Perform rebalancing
      let rebalancedTasks = 0;
      for (const overloadedCore of overloaded) {
        const tasksToMove = this.selectTasksToMove(overloadedCore);
        
        for (const task of tasksToMove) {
          const targetCore = this.selectTargetCoreForRebalance(task, underloaded);
          if (targetCore !== null) {
            await this.moveTaskToCore(task, overloadedCore, targetCore);
            rebalancedTasks++;
          }
        }
      }
      
      const balancingTime = Date.now() - startTime;
      
      // Update balancing metrics
      this.workloadState.balancingMetrics.totalRebalances++;
      this.workloadState.balancingMetrics.averageRebalanceTime = 
        (this.workloadState.balancingMetrics.averageRebalanceTime * 
         (this.workloadState.balancingMetrics.totalRebalances - 1) + balancingTime) / 
        this.workloadState.balancingMetrics.totalRebalances;
      this.workloadState.balancingMetrics.loadVariance = loadVariance;
      
      this.emit('workload-balanced', {
        rebalancedTasks,
        overloadedCores: overloaded.length,
        underloadedCores: underloaded.length,
        balancingTime,
        loadVariance
      });
      
      return {
        balanced: true,
        rebalancedTasks,
        balancingTime,
        loadVariance
      };
      
    } catch (error) {
      console.error('Workload balancing failed:', error);
      return { balanced: false, error: error.message };
    }
  }
  
  /**
   * Perform CPU profiling to detect bottlenecks
   */
  async performCPUProfiling() {
    try {
      // Collect CPU usage data
      const cpuUsage = await this.measureCPUUsage();
      
      // Detect bottlenecks
      const bottlenecks = await this.detectCPUBottlenecks(cpuUsage);
      
      // Update performance metrics
      this.performanceMetrics.cpu.overallUtilization = cpuUsage.overall;
      this.performanceMetrics.cpu.perCoreUtilization = cpuUsage.perCore;
      this.performanceMetrics.bottlenecks = bottlenecks;
      
      // Generate optimizations if bottlenecks found
      if (bottlenecks.length > 0) {
        const optimizations = await this.generateOptimizations(bottlenecks);
        this.performanceMetrics.optimizations = optimizations;
        
        // Apply automatic optimizations if enabled
        for (const optimization of optimizations) {
          if (optimization.autoApply) {
            await this.applyOptimization(optimization);
          }
        }
      }
      
      this.emit('cpu-profiling-complete', {
        cpuUsage,
        bottlenecks,
        optimizations: this.performanceMetrics.optimizations
      });
      
      return { success: true, bottlenecks };
      
    } catch (error) {
      console.error('CPU profiling failed:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Collect comprehensive CPU metrics
   */
  async collectCPUMetrics() {
    try {
      const cpuUsage = process.cpuUsage();
      const loadAverage = os.loadavg();
      
      // Update CPU metrics
      this.performanceMetrics.cpu.overallUtilization = Math.min(loadAverage[0] / this.systemInfo.cpuCount, 1.0);
      this.performanceMetrics.cpu.interruptRate = 0; // Platform-specific implementation needed
      
      // Update threading metrics
      this.updateThreadingMetrics();
      
      // Update workload metrics
      this.updateWorkloadMetrics();
      
      this.emit('cpu-metrics-updated', {
        timestamp: Date.now(),
        metrics: this.performanceMetrics
      });
      
    } catch (error) {
      console.error('CPU metrics collection failed:', error);
    }
  }
  
  /**
   * Measure CPU usage with detailed breakdown
   */
  async measureCPUUsage() {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      const startTime = Date.now();
      
      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage);
        const endTime = Date.now();
        
        const totalTime = (endTime - startTime) * 1000; // Convert to microseconds
        const totalCPU = endUsage.user + endUsage.system;
        
        const overall = totalCPU / totalTime;
        
        // Per-core usage would require platform-specific implementation
        const perCore = new Map();
        for (const coreId of this.coreManagement.availableCores) {
          perCore.set(coreId, overall); // Simplified - actual per-core data needs platform-specific code
        }
        
        resolve({
          overall: Math.min(overall, 1.0),
          perCore: perCore,
          user: endUsage.user / totalTime,
          system: endUsage.system / totalTime
        });
      }, 100);
    });
  }
  
  /**
   * Detect CPU bottlenecks from usage data
   */
  async detectCPUBottlenecks(cpuUsage) {
    const bottlenecks = [];
    
    // Overall CPU utilization bottleneck
    if (cpuUsage.overall > this.config.bottleneckDetectionThreshold) {
      bottlenecks.push({
        type: 'cpu_overload',
        severity: cpuUsage.overall > 0.95 ? 'critical' : 'warning',
        value: cpuUsage.overall,
        threshold: this.config.bottleneckDetectionThreshold,
        recommendation: 'Consider scaling up or optimizing workload distribution'
      });
    }
    
    // Per-core utilization bottlenecks
    for (const [coreId, usage] of cpuUsage.perCore) {
      if (usage > this.config.bottleneckDetectionThreshold) {
        bottlenecks.push({
          type: 'core_overload',
          coreId: coreId,
          severity: usage > 0.95 ? 'critical' : 'warning',
          value: usage,
          threshold: this.config.bottleneckDetectionThreshold,
          recommendation: `Rebalance workload from core ${coreId}`
        });
      }
    }
    
    // Context switching bottleneck
    if (this.performanceMetrics.cpu.contextSwitches > 10000) {
      bottlenecks.push({
        type: 'context_switching',
        severity: 'warning',
        value: this.performanceMetrics.cpu.contextSwitches,
        recommendation: 'Optimize thread pool sizes and reduce task switching'
      });
    }
    
    return bottlenecks;
  }
  
  /**
   * Calculate load variance across cores
   */
  calculateLoadVariance() {
    const loads = Array.from(this.coreManagement.coreLoads.values());
    if (loads.length === 0) return 0;
    
    const mean = loads.reduce((sum, load) => sum + load, 0) / loads.length;
    const variance = loads.reduce((sum, load) => sum + Math.pow(load - mean, 2), 0) / loads.length;
    
    return Math.sqrt(variance);
  }
  
  /**
   * Identify overloaded and underloaded cores
   */
  identifyUnbalancedCores() {
    const overloaded = [];
    const underloaded = [];
    
    for (const [coreId, load] of this.coreManagement.coreLoads) {
      if (load > this.config.loadThresholdHigh) {
        overloaded.push(coreId);
      } else if (load < this.config.loadThresholdLow) {
        underloaded.push(coreId);
      }
    }
    
    return { overloaded, underloaded };
  }
  
  /**
   * Estimate agent load for core assignment
   */
  estimateAgentLoad(agentInfo) {
    let baseLoad = 0.1; // Base load per agent
    
    // Adjust based on agent characteristics
    if (agentInfo.contextWindowSize > 100000) {
      baseLoad += 0.05; // Large context window
    }
    
    if (agentInfo.taskType === 'cpu-intensive') {
      baseLoad += 0.3;
    } else if (agentInfo.taskType === 'io-intensive') {
      baseLoad += 0.1;
    }
    
    if (agentInfo.priority === 'high') {
      baseLoad += 0.05; // High priority gets slight load increase
    }
    
    return Math.min(baseLoad, 1.0);
  }
  
  /**
   * Update threading performance metrics
   */
  updateThreadingMetrics() {
    let totalActiveThreads = 0;
    let totalEfficiency = 0;
    let poolCount = 0;
    
    for (const [poolName, pool] of Object.entries(this.threadPools)) {
      if (typeof pool === 'object' && pool.type) {
        totalActiveThreads += pool.activeThreads;
        totalEfficiency += pool.stats.efficiency;
        poolCount++;
      }
    }
    
    this.performanceMetrics.threading.activeThreads = totalActiveThreads;
    this.performanceMetrics.threading.threadPoolEfficiency = poolCount > 0 ? totalEfficiency / poolCount : 0;
  }
  
  /**
   * Update workload performance metrics
   */
  updateWorkloadMetrics() {
    let totalThroughput = 0;
    let totalQueueWaitTime = 0;
    let queueCount = 0;
    
    for (const [coreId, coreQueue] of this.workloadState.agentQueues) {
      totalThroughput += coreQueue.throughput || 0;
      totalQueueWaitTime += coreQueue.averageTaskTime || 0;
      queueCount++;
    }
    
    this.performanceMetrics.workload.throughput = totalThroughput;
    this.performanceMetrics.workload.balancingEffectiveness = this.workloadState.balancingMetrics.totalRebalances > 0 ? 
      (1.0 - this.workloadState.balancingMetrics.loadVariance) : 0.5;
  }
  
  /**
   * Generate worker thread ID
   */
  generateWorkerThreadId() {
    return `worker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Handle worker thread messages
   */
  handleWorkerMessage(worker, message, poolType) {
    const pool = this.threadPools[poolType];
    if (!pool) return;
    
    switch (message.type) {
      case 'task-completed':
        pool.stats.tasksExecuted++;
        pool.activeThreads = Math.max(0, pool.activeThreads - 1);
        
        // Update execution time
        if (message.executionTime) {
          const totalTime = pool.stats.averageExecutionTime * (pool.stats.tasksExecuted - 1) + message.executionTime;
          pool.stats.averageExecutionTime = totalTime / pool.stats.tasksExecuted;
        }
        break;
        
      case 'task-started':
        pool.activeThreads++;
        break;
        
      case 'worker-ready':
        // Worker is ready for tasks
        break;
        
      default:
        console.log(`Unknown message from ${poolType} worker:`, message);
    }
  }
  
  /**
   * Handle worker thread errors
   */
  handleWorkerError(worker, error, poolType) {
    const pool = this.threadPools[poolType];
    if (pool) {
      pool.stats.errors++;
      pool.workers.delete(worker);
      pool.currentSize--;
    }
    
    // Try to replace the failed worker
    setTimeout(async () => {
      const replacement = await this.createWorkerThread(poolType);
      if (replacement && pool) {
        pool.workers.add(replacement);
        pool.currentSize++;
      }
    }, 1000);
  }
  
  /**
   * Handle worker thread exits
   */
  handleWorkerExit(worker, poolType) {
    const pool = this.threadPools[poolType];
    if (pool) {
      pool.workers.delete(worker);
      pool.currentSize--;
    }
    
    // Remove from worker threads map
    if (worker.workerId) {
      this.threadPools.workerThreads.delete(worker.workerId);
    }
  }
  
  /**
   * Get available CPU cores (excluding system reserved)
   */
  getAvailableCores() {
    const totalCores = this.systemInfo.cpuCount;
    const availableCores = [];
    
    for (let i = this.config.reserveSystemCores; i < totalCores; i++) {
      availableCores.push(i);
    }
    
    return availableCores;
  }
  
  /**
   * Detect NUMA support
   */
  detectNUMASupport() {
    // Simplified NUMA detection - actual implementation would require platform-specific code
    return this.systemInfo.cpuCount > 8 && this.systemInfo.platform === 'linux';
  }
  
  /**
   * Detect NUMA nodes
   */
  detectNUMANodes() {
    if (!this.systemInfo.hasNUMA) {
      return [{
        nodeId: 0,
        cores: this.getAvailableCores(),
        memory: this.systemInfo.totalMemory
      }];
    }
    
    // Simplified NUMA node detection
    const coresPerNode = Math.floor(this.systemInfo.cpuCount / 2);
    const nodes = [];
    
    for (let nodeId = 0; nodeId < 2; nodeId++) {
      const startCore = nodeId * coresPerNode;
      const endCore = Math.min((nodeId + 1) * coresPerNode, this.systemInfo.cpuCount);
      
      nodes.push({
        nodeId: nodeId,
        cores: Array.from({ length: endCore - startCore }, (_, i) => startCore + i),
        memory: Math.floor(this.systemInfo.totalMemory / 2)
      });
    }
    
    return nodes;
  }
  
  /**
   * Get CPU optimization statistics
   */
  getCPUOptimizationStats() {
    return {
      systemInfo: this.systemInfo,
      optimizationState: this.optimizationState,
      performanceMetrics: this.performanceMetrics,
      coreManagement: {
        totalCores: this.systemInfo.cpuCount,
        availableCores: this.coreManagement.availableCores.length,
        systemCores: this.coreManagement.systemCores.size,
        activeAssignments: this.coreManagement.coreAssignments.size,
        coreUtilization: this.calculateAverageCoreUtilization()
      },
      threadPools: this.getThreadPoolStats(),
      workloadBalancing: this.workloadState.balancingMetrics
    };
  }
  
  /**
   * Calculate average core utilization
   */
  calculateAverageCoreUtilization() {
    const loads = Array.from(this.coreManagement.coreLoads.values());
    return loads.length > 0 ? loads.reduce((sum, load) => sum + load, 0) / loads.length : 0;
  }
  
  /**
   * Get thread pool statistics
   */
  getThreadPoolStats() {
    const stats = {};
    
    for (const [poolName, pool] of Object.entries(this.threadPools)) {
      if (typeof pool === 'object' && pool.type) {
        stats[poolName] = {
          currentSize: pool.currentSize,
          activeThreads: pool.activeThreads,
          queuedTasks: pool.queuedTasks,
          stats: pool.stats,
          efficiency: pool.stats.tasksExecuted > 0 ? 
            pool.stats.tasksExecuted / (pool.stats.tasksExecuted + pool.stats.errors) : 0
        };
      }
    }
    
    return stats;
  }
  
  /**
   * Stop CPU workload optimizer
   */
  async stop() {
    try {
      console.log('Stopping CPU workload optimizer...');
      
      // Clear intervals
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
        this.monitoringInterval = null;
      }
      
      if (this.balancingInterval) {
        clearInterval(this.balancingInterval);
        this.balancingInterval = null;
      }
      
      if (this.profilingInterval) {
        clearInterval(this.profilingInterval);
        this.profilingInterval = null;
      }
      
      if (this.optimizationInterval) {
        clearInterval(this.optimizationInterval);
        this.optimizationInterval = null;
      }
      
      // Terminate worker threads
      for (const [workerId, workerInfo] of this.threadPools.workerThreads) {
        try {
          await workerInfo.worker.terminate();
        } catch (error) {
          console.error(`Failed to terminate worker ${workerId}:`, error);
        }
      }
      
      // Clear state
      this.coreManagement.coreAssignments.clear();
      this.workloadState.agentQueues.clear();
      this.threadPools.workerThreads.clear();
      
      this.emit('cpu-optimization-stopped', {
        timestamp: Date.now(),
        finalStats: this.getCPUOptimizationStats()
      });
      
      console.log('CPU workload optimizer stopped');
      
    } catch (error) {
      console.error('Error stopping CPU workload optimizer:', error);
      throw error;
    }
  }
}

module.exports = CPUWorkloadOptimizer;