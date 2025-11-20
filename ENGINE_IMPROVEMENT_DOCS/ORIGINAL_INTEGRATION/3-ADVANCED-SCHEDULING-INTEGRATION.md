# Advanced Scheduling Integration Implementation Plan

## 📋 **Overview**

Integration of the original claude-flow's advanced scheduling strategies into your Queen Controller for intelligent task assignment and optimal agent utilization.

---

## 🎯 **Source Analysis**

### **Original Location**
- **File**: `src/coordination/advanced-scheduler.ts`
- **Repository**: https://github.com/ruvnet/claude-flow
- **Purpose**: Multiple intelligent task scheduling strategies

### **Key Components to Extract**
1. **AdvancedTaskScheduler** class
2. **SchedulingStrategy** interface implementations
3. **CapabilitySchedulingStrategy** - capability-based assignment
4. **RoundRobinSchedulingStrategy** - round-robin distribution
5. **LeastLoadedSchedulingStrategy** - load-based assignment
6. **AffinitySchedulingStrategy** - history-based assignment
7. **TaskStats** tracking for performance optimization

---

## 🏗️ **Implementation Plan**

### **Phase 1: Scheduling Strategy Framework (Days 1-2)**

#### **1.1 Create Scheduling Strategy Base**
**Target File**: `src/coordination/scheduling-strategies.js`

```javascript
// Extract from original: src/coordination/advanced-scheduler.ts
// Convert TypeScript interfaces to JavaScript

class SchedulingStrategy {
  constructor(name) {
    this.name = name;
  }

  /**
   * Select the best agent for a task
   * @param {Object} task - Task to assign
   * @param {Array} agents - Available agents
   * @param {Object} context - Scheduling context
   * @returns {string|null} - Selected agent ID or null
   */
  selectAgent(task, agents, context) {
    throw new Error('selectAgent must be implemented by subclass');
  }
}

/**
 * Capability-based scheduling strategy
 */
class CapabilitySchedulingStrategy extends SchedulingStrategy {
  constructor() {
    super('capability');
  }

  selectAgent(task, agents, context) {
    // Filter agents by capability match
    const capableAgents = agents.filter((agent) => {
      const capabilities = context.agentCapabilities.get(agent.id) || agent.capabilities || [];
      return task.type === 'any' || 
             capabilities.includes(task.type) || 
             capabilities.includes('*');
    });

    if (capableAgents.length === 0) {
      return null;
    }

    // Sort by load (ascending) and priority (descending)
    capableAgents.sort((a, b) => {
      const loadA = context.taskLoads.get(a.id) || 0;
      const loadB = context.taskLoads.get(b.id) || 0;

      if (loadA !== loadB) {
        return loadA - loadB;
      }

      const priorityA = context.agentPriorities.get(a.id) || a.priority || 0;
      const priorityB = context.agentPriorities.get(b.id) || b.priority || 0;

      return priorityB - priorityA;
    });

    return capableAgents[0].id;
  }
}

/**
 * Round-robin scheduling strategy
 */
class RoundRobinSchedulingStrategy extends SchedulingStrategy {
  constructor() {
    super('round-robin');
    this.lastIndex = -1;
  }

  selectAgent(task, agents, context) {
    if (agents.length === 0) {
      return null;
    }

    this.lastIndex = (this.lastIndex + 1) % agents.length;
    return agents[this.lastIndex].id;
  }
}

/**
 * Least-loaded scheduling strategy
 */
class LeastLoadedSchedulingStrategy extends SchedulingStrategy {
  constructor() {
    super('least-loaded');
  }

  selectAgent(task, agents, context) {
    if (agents.length === 0) {
      return null;
    }

    let minLoad = Infinity;
    let selectedAgent = null;

    for (const agent of agents) {
      const load = context.taskLoads.get(agent.id) || 0;
      if (load < minLoad) {
        minLoad = load;
        selectedAgent = agent.id;
      }
    }

    return selectedAgent;
  }
}

/**
 * Affinity-based scheduling strategy
 */
class AffinitySchedulingStrategy extends SchedulingStrategy {
  constructor() {
    super('affinity');
  }

  selectAgent(task, agents, context) {
    const taskStats = context.taskHistory.get(task.type);

    if (taskStats?.lastAgent) {
      // Check if the last agent is available and not overloaded
      const lastAgent = agents.find((a) => a.id === taskStats.lastAgent);
      if (lastAgent) {
        const load = context.taskLoads.get(lastAgent.id) || 0;
        const maxLoad = (lastAgent.maxConcurrentTasks || 5) * 0.8;
        
        if (load < maxLoad) {
          return lastAgent.id;
        }
      }
    }

    // Fall back to capability-based selection
    return new CapabilitySchedulingStrategy().selectAgent(task, agents, context);
  }
}

module.exports = {
  SchedulingStrategy,
  CapabilitySchedulingStrategy,
  RoundRobinSchedulingStrategy,
  LeastLoadedSchedulingStrategy,
  AffinitySchedulingStrategy
};
```

#### **1.2 Task Statistics Tracking**
**Target File**: `src/coordination/task-stats.js`

```javascript
class TaskStatsManager {
  constructor() {
    this.taskStats = new Map(); // taskType -> stats
    this.agentPerformance = new Map(); // agentId -> performance data
  }

  recordTaskExecution(taskType, agentId, duration, success) {
    // Update task type statistics
    if (!this.taskStats.has(taskType)) {
      this.taskStats.set(taskType, {
        totalExecutions: 0,
        avgDuration: 0,
        successRate: 0,
        lastAgent: null,
        failures: 0,
        durations: []
      });
    }

    const stats = this.taskStats.get(taskType);
    stats.totalExecutions++;
    stats.durations.push(duration);
    
    // Keep only last 100 durations for average
    if (stats.durations.length > 100) {
      stats.durations.shift();
    }
    
    stats.avgDuration = stats.durations.reduce((sum, d) => sum + d, 0) / stats.durations.length;
    
    if (success) {
      stats.lastAgent = agentId;
    } else {
      stats.failures++;
    }
    
    stats.successRate = ((stats.totalExecutions - stats.failures) / stats.totalExecutions) * 100;

    // Update agent performance
    this.updateAgentPerformance(agentId, duration, success);
  }

  updateAgentPerformance(agentId, duration, success) {
    if (!this.agentPerformance.has(agentId)) {
      this.agentPerformance.set(agentId, {
        totalTasks: 0,
        avgDuration: 0,
        successRate: 0,
        failures: 0,
        durations: []
      });
    }

    const perf = this.agentPerformance.get(agentId);
    perf.totalTasks++;
    perf.durations.push(duration);
    
    if (perf.durations.length > 100) {
      perf.durations.shift();
    }
    
    perf.avgDuration = perf.durations.reduce((sum, d) => sum + d, 0) / perf.durations.length;
    
    if (!success) {
      perf.failures++;
    }
    
    perf.successRate = ((perf.totalTasks - perf.failures) / perf.totalTasks) * 100;
  }

  getTaskStats(taskType) {
    return this.taskStats.get(taskType);
  }

  getAgentPerformance(agentId) {
    return this.agentPerformance.get(agentId);
  }

  getAllStats() {
    return {
      taskStats: Object.fromEntries(this.taskStats),
      agentPerformance: Object.fromEntries(this.agentPerformance)
    };
  }
}

module.exports = TaskStatsManager;
```

### **Phase 2: Advanced Scheduler Implementation (Days 3-4)**

#### **2.1 Create Advanced Scheduler**
**Target File**: `src/coordination/advanced-scheduler.js`

```javascript
const {
  CapabilitySchedulingStrategy,
  RoundRobinSchedulingStrategy,
  LeastLoadedSchedulingStrategy,
  AffinitySchedulingStrategy
} = require('./scheduling-strategies');
const TaskStatsManager = require('./task-stats');

class AdvancedTaskScheduler {
  constructor(queenController, config = {}) {
    this.queenController = queenController;
    this.config = {
      defaultStrategy: 'capability',
      enableAffinity: true,
      enableLoadBalancing: true,
      statsTrackingEnabled: true,
      ...config
    };

    // Initialize scheduling strategies
    this.strategies = new Map();
    this.initializeStrategies();

    // Task statistics tracking
    this.taskStats = this.config.statsTrackingEnabled 
      ? new TaskStatsManager() 
      : null;
  }

  initializeStrategies() {
    this.strategies.set('capability', new CapabilitySchedulingStrategy());
    this.strategies.set('round-robin', new RoundRobinSchedulingStrategy());
    this.strategies.set('least-loaded', new LeastLoadedSchedulingStrategy());
    
    if (this.config.enableAffinity) {
      this.strategies.set('affinity', new AffinitySchedulingStrategy());
    }
  }

  /**
   * Select the best agent for a task using specified strategy
   */
  async selectBestAgent(task, strategyName = null) {
    const strategy = this.strategies.get(strategyName || this.config.defaultStrategy);
    
    if (!strategy) {
      throw new Error(`Unknown scheduling strategy: ${strategyName || this.config.defaultStrategy}`);
    }

    // Get available agents
    const availableAgents = this.getAvailableAgents();
    
    if (availableAgents.length === 0) {
      return null;
    }

    // Build scheduling context
    const context = this.buildSchedulingContext();
    
    // Select agent using strategy
    const selectedAgentId = strategy.selectAgent(task, availableAgents, context);
    
    return selectedAgentId;
  }

  getAvailableAgents() {
    return Array.from(this.queenController.subAgents.values())
      .filter(agent => agent.status === 'idle' || agent.status === 'available');
  }

  buildSchedulingContext() {
    const taskLoads = new Map();
    const agentCapabilities = new Map();
    const agentPriorities = new Map();
    const taskHistory = new Map();

    // Build task loads
    for (const [agentId, agent] of this.queenController.subAgents) {
      taskLoads.set(agentId, this.getAgentTaskCount(agentId));
      agentCapabilities.set(agentId, agent.capabilities || []);
      agentPriorities.set(agentId, agent.priority || 0);
    }

    // Build task history from stats
    if (this.taskStats) {
      const allStats = this.taskStats.getAllStats();
      for (const [taskType, stats] of Object.entries(allStats.taskStats)) {
        taskHistory.set(taskType, stats);
      }
    }

    return {
      taskLoads,
      agentCapabilities,
      agentPriorities,
      taskHistory,
      currentTime: new Date()
    };
  }

  getAgentTaskCount(agentId) {
    const agent = this.queenController.subAgents.get(agentId);
    if (!agent) return 0;
    
    // Count current tasks
    return agent.currentTasks ? agent.currentTasks.size : 0;
  }

  /**
   * Record task execution for statistics and learning
   */
  recordTaskExecution(task, agentId, duration, success = true) {
    if (this.taskStats) {
      this.taskStats.recordTaskExecution(task.type, agentId, duration, success);
    }

    // Update Queen Controller metrics
    this.queenController.metrics.tasksCompleted++;
    if (!success) {
      this.queenController.metrics.errors.push({
        task: task.id,
        agent: agentId,
        error: 'Task execution failed',
        timestamp: new Date()
      });
    }
  }

  /**
   * Get scheduling performance metrics
   */
  getSchedulingMetrics() {
    const baseMetrics = {
      activeStrategies: Array.from(this.strategies.keys()),
      defaultStrategy: this.config.defaultStrategy,
      totalAgents: this.queenController.subAgents.size,
      availableAgents: this.getAvailableAgents().length,
      timestamp: new Date()
    };

    if (this.taskStats) {
      baseMetrics.taskStats = this.taskStats.getAllStats();
    }

    return baseMetrics;
  }

  /**
   * Optimize scheduling strategy based on performance
   */
  optimizeStrategy() {
    if (!this.taskStats) return;

    const stats = this.taskStats.getAllStats();
    
    // Analyze which strategy performs best for different task types
    const strategyPerformance = this.analyzeStrategyPerformance(stats);
    
    // Update configuration based on performance
    this.updateStrategyConfig(strategyPerformance);
  }

  analyzeStrategyPerformance(stats) {
    // Analyze task completion rates, durations, and success rates
    // Return performance metrics for each strategy
    const performance = {};

    for (const [taskType, taskStats] of Object.entries(stats.taskStats)) {
      performance[taskType] = {
        avgDuration: taskStats.avgDuration,
        successRate: taskStats.successRate,
        totalExecutions: taskStats.totalExecutions,
        recommendedStrategy: this.recommendStrategy(taskType, taskStats)
      };
    }

    return performance;
  }

  recommendStrategy(taskType, stats) {
    // Simple recommendation logic - can be enhanced with ML
    if (stats.successRate > 90 && stats.totalExecutions > 10) {
      return 'affinity'; // Use affinity for successful task types
    } else if (stats.avgDuration > 30000) { // Long tasks
      return 'least-loaded'; // Use least-loaded for long tasks
    } else {
      return 'capability'; // Default to capability-based
    }
  }

  updateStrategyConfig(performance) {
    // Update strategy configuration based on performance analysis
    // This can be extended to automatically tune parameters
    console.log('Strategy performance analysis:', performance);
  }
}

module.exports = AdvancedTaskScheduler;
```

### **Phase 3: Queen Controller Integration (Days 5-7)**

#### **3.1 Integration Points**
**Modify**: `.ai-workflow/intelligence-engine/queen-controller.js`

**Add to constructor**:
```javascript
// Advanced scheduling system
this.advancedScheduler = new AdvancedTaskScheduler(this, {
  defaultStrategy: options.defaultSchedulingStrategy || 'capability',
  enableAffinity: options.enableAffinity !== false,
  enableLoadBalancing: options.enableLoadBalancing !== false,
  statsTrackingEnabled: options.enableSchedulingStats !== false
});
```

**Add to initializeUnlimitedScaling()**:
```javascript
// Initialize advanced scheduling
if (this.advancedScheduler) {
  console.log('Advanced scheduling system initialized');
}
```

#### **3.2 Enhanced Task Assignment**
**Modify existing distributeTask method**:
```javascript
async distributeTask(task, dependencies = [], strategy = null) {
  try {
    // Validate task input
    if (!task || !task.id) {
      throw new Error('Task must have a valid ID');
    }

    // Check dependencies
    if (!this.areDependenciesSatisfied(dependencies)) {
      this.pendingTasks.set(task.id, { task, dependencies, strategy });
      return { status: 'pending', reason: 'dependencies_not_satisfied' };
    }

    // NEW: Use advanced scheduling to select agent
    const selectedAgentId = await this.advancedScheduler.selectBestAgent(task, strategy);
    
    if (!selectedAgentId) {
      throw new Error('No suitable agent available for task');
    }

    // Assign task to selected agent
    await this.assignTask(task.id, selectedAgentId);
    
    return { 
      status: 'assigned', 
      agentId: selectedAgentId,
      strategy: strategy || this.advancedScheduler.config.defaultStrategy
    };

  } catch (error) {
    console.error('Task distribution failed:', error);
    this.metrics.errors.push({
      task: task.id,
      error: error.message,
      timestamp: new Date()
    });
    throw error;
  }
}
```

#### **3.3 Task Execution Tracking**
**Modify executeTask method**:
```javascript
async executeTask(task, agent) {
  const startTime = Date.now();
  let success = false;

  try {
    // Existing task execution logic
    console.log(`Executing task ${task.id} on agent ${agent.id}`);
    
    // Simulate or execute actual task
    const result = await this.performTaskExecution(task, agent);
    
    success = true;
    const duration = Date.now() - startTime;

    // NEW: Record execution in advanced scheduler
    this.advancedScheduler.recordTaskExecution(task, agent.id, duration, success);

    // Handle task completion
    await this.handleTaskCompletion(task.id, result, agent.id);

    return result;

  } catch (error) {
    const duration = Date.now() - startTime;
    
    // NEW: Record failure in advanced scheduler
    this.advancedScheduler.recordTaskExecution(task, agent.id, duration, false);

    // Handle task failure
    await this.handleTaskFailure(task.id, error, agent.id);
    
    throw error;
  }
}
```

#### **3.4 Strategy Optimization**
**Add background optimization**:
```javascript
startSchedulingOptimization() {
  if (!this.advancedScheduler) return;

  // Run optimization every 5 minutes
  const optimizationWorker = setInterval(() => {
    this.advancedScheduler.optimizeStrategy();
  }, 300000); // 5 minutes

  this.backgroundWorkers.set('schedulingOptimization', optimizationWorker);
}
```

---

## 📁 **File Structure**

### **New Files to Create**
```
src/coordination/
├── scheduling-strategies.js   # Strategy implementations
├── task-stats.js             # Task statistics tracking
├── advanced-scheduler.js     # Main scheduler class
└── strategy-optimizer.js     # Strategy optimization logic

tests/coordination/
├── scheduling-strategies.test.js  # Strategy unit tests
├── advanced-scheduler.test.js     # Scheduler integration tests
└── optimization.test.js           # Optimization tests
```

### **Files to Modify**
```
.ai-workflow/intelligence-engine/
└── queen-controller.js       # Integration points

src/claude-flow/orchestrator/
└── flow-orchestrator.js      # Optional: advanced scheduling
```

---

## 🧪 **Testing Strategy**

### **Unit Tests**
**File**: `tests/coordination/scheduling-strategies.test.js`

```javascript
const {
  CapabilitySchedulingStrategy,
  RoundRobinSchedulingStrategy,
  LeastLoadedSchedulingStrategy,
  AffinitySchedulingStrategy
} = require('../../src/coordination/scheduling-strategies');

describe('Scheduling Strategies', () => {
  const mockAgents = [
    { id: 'agent1', capabilities: ['coding', 'testing'], priority: 1 },
    { id: 'agent2', capabilities: ['coding'], priority: 2 },
    { id: 'agent3', capabilities: ['testing'], priority: 3 }
  ];

  const mockContext = {
    taskLoads: new Map([
      ['agent1', 2],
      ['agent2', 1],
      ['agent3', 3]
    ]),
    agentCapabilities: new Map([
      ['agent1', ['coding', 'testing']],
      ['agent2', ['coding']],
      ['agent3', ['testing']]
    ]),
    agentPriorities: new Map([
      ['agent1', 1],
      ['agent2', 2],
      ['agent3', 3]
    ])
  };

  describe('CapabilitySchedulingStrategy', () => {
    let strategy;

    beforeEach(() => {
      strategy = new CapabilitySchedulingStrategy();
    });

    test('should select agent with matching capability', () => {
      const task = { type: 'coding' };
      const selected = strategy.selectAgent(task, mockAgents, mockContext);
      
      expect(selected).toBe('agent2'); // Lower load, higher priority
    });

    test('should return null for no capable agents', () => {
      const task = { type: 'design' };
      const selected = strategy.selectAgent(task, mockAgents, mockContext);
      
      expect(selected).toBeNull();
    });
  });

  describe('LeastLoadedSchedulingStrategy', () => {
    let strategy;

    beforeEach(() => {
      strategy = new LeastLoadedSchedulingStrategy();
    });

    test('should select least loaded agent', () => {
      const task = { type: 'any' };
      const selected = strategy.selectAgent(task, mockAgents, mockContext);
      
      expect(selected).toBe('agent2'); // Load 1 (lowest)
    });
  });
});
```

### **Integration Tests**
**File**: `tests/coordination/advanced-scheduler.test.js`

```javascript
const AdvancedTaskScheduler = require('../../src/coordination/advanced-scheduler');

describe('Advanced Task Scheduler', () => {
  let scheduler;
  let mockQueenController;

  beforeEach(() => {
    mockQueenController = {
      subAgents: new Map([
        ['agent1', { id: 'agent1', status: 'idle', capabilities: ['coding'] }],
        ['agent2', { id: 'agent2', status: 'idle', capabilities: ['testing'] }]
      ])
    };

    scheduler = new AdvancedTaskScheduler(mockQueenController);
  });

  test('should select agent using capability strategy', async () => {
    const task = { type: 'coding' };
    const selectedAgent = await scheduler.selectBestAgent(task, 'capability');
    
    expect(selectedAgent).toBe('agent1');
  });

  test('should record task execution statistics', async () => {
    const task = { type: 'coding' };
    scheduler.recordTaskExecution(task, 'agent1', 5000, true);
    
    const stats = scheduler.taskStats.getTaskStats('coding');
    expect(stats.totalExecutions).toBe(1);
    expect(stats.avgDuration).toBe(5000);
    expect(stats.successRate).toBe(100);
  });
});
```

---

## ⚙️ **Configuration**

### **Default Configuration**
```javascript
// config/advanced-scheduling.js
module.exports = {
  advancedScheduling: {
    enabled: true,
    defaultStrategy: 'capability',        // capability, round-robin, least-loaded, affinity
    enableAffinity: true,                 // Enable history-based scheduling
    enableLoadBalancing: true,            // Enable load-based optimization
    statsTrackingEnabled: true,           // Track performance statistics
    optimizationInterval: 300000,         // Strategy optimization interval (5 minutes)
    maxTaskHistory: 100,                  // Max tasks to keep in history
    performanceThreshold: 90              // Success rate threshold for strategy recommendation
  }
};
```

### **Environment Variables**
```bash
# .env
ADVANCED_SCHEDULING_ENABLED=true
DEFAULT_SCHEDULING_STRATEGY=capability
ENABLE_SCHEDULING_AFFINITY=true
SCHEDULING_OPTIMIZATION_INTERVAL=300000
```

---

## 📊 **Performance Metrics**

### **Key Metrics to Track**
1. **Strategy Performance**: Success rates per strategy
2. **Task Distribution**: Balance across agents
3. **Execution Times**: Average duration per task type
4. **Agent Utilization**: Load distribution efficiency
5. **Affinity Effectiveness**: Performance improvement from affinity

### **Monitoring Implementation**
```javascript
getSchedulingMetrics() {
  const baseMetrics = {
    activeStrategies: Array.from(this.strategies.keys()),
    defaultStrategy: this.config.defaultStrategy,
    totalAgents: this.queenController.subAgents.size,
    availableAgents: this.getAvailableAgents().length,
    timestamp: new Date()
  };

  if (this.taskStats) {
    const allStats = this.taskStats.getAllStats();
    
    baseMetrics.performance = {
      totalTaskTypes: Object.keys(allStats.taskStats).length,
      averageSuccessRate: this.calculateAverageSuccessRate(allStats.taskStats),
      averageDuration: this.calculateAverageDuration(allStats.taskStats),
      strategyEffectiveness: this.analyzeStrategyEffectiveness(allStats)
    };
  }

  return baseMetrics;
}
```

---

## 🚀 **Deployment Steps**

### **Step 1: Preparation**
1. Backup existing Queen Controller
2. Create feature branch for advanced scheduling
3. Set up performance monitoring for scheduling metrics

### **Step 2: Implementation**
1. Create scheduling strategy modules
2. Implement advanced scheduler
3. Add integration points to Queen Controller
4. Implement statistics tracking

### **Step 3: Testing**
1. Test each scheduling strategy independently
2. Verify strategy selection logic
3. Test performance under various loads
4. Validate optimization algorithms

### **Step 4: Deployment**
1. Deploy with capability-based strategy as default
2. Monitor performance metrics
3. Gradually enable additional strategies
4. Tune optimization parameters

---

## 🎯 **Success Criteria**

### **Functional Requirements**
- ✅ Multiple scheduling strategies implemented
- ✅ Intelligent agent selection based on capabilities
- ✅ Load balancing across available agents
- ✅ Performance statistics tracking
- ✅ Automatic strategy optimization

### **Performance Requirements**
- ✅ <10ms overhead for strategy selection
- ✅ >80% agent utilization efficiency
- ✅ >90% task assignment success rate
- ✅ <5% load imbalance across agents

### **Intelligence Requirements**
- ✅ Learning from task execution history
- ✅ Adaptive strategy selection
- ✅ Performance-based optimization
- ✅ Predictive agent selection

---

## 🔧 **Troubleshooting**

### **Common Issues**
1. **Poor strategy selection**
   - Check agent capability definitions
   - Verify task type mappings
   - Review context data accuracy

2. **Load imbalance**
   - Adjust strategy weights
   - Check workload tracking
   - Verify agent availability reporting

3. **Performance degradation**
   - Optimize statistics tracking
   - Reduce optimization frequency
   - Review strategy complexity

### **Debug Tools**
```javascript
// Debug scheduling decision
debugSchedulingDecision(taskId) {
  const task = this.tasks.get(taskId);
  if (!task) return null;

  const context = this.buildSchedulingContext();
  const decisions = {};

  for (const [name, strategy] of this.strategies) {
    decisions[name] = strategy.selectAgent(task, this.getAvailableAgents(), context);
  }

  return {
    task,
    context,
    decisions,
    selected: this.advancedScheduler.config.defaultStrategy
  };
}
```

---

## 📝 **Documentation Updates**

### **API Documentation**
- Document all scheduling strategies
- Explain configuration options
- Update Queen Controller API with scheduling methods

### **User Guide**
- Guide to selecting appropriate strategies
- Performance tuning recommendations
- Troubleshooting scheduling issues

### **Technical Documentation**
- Strategy comparison charts
- Performance benchmarking results
- Optimization algorithm documentation