# Work Stealing Integration Implementation Plan

## 📋 **Overview**

Integration of the original claude-flow's work stealing algorithm into your Queen Controller for automatic load balancing and optimal resource utilization.

---

## 🎯 **Source Analysis**

### **Original Location**
- **File**: `src/coordination/work-stealing.ts`
- **Repository**: https://github.com/ruvnet/claude-flow
- **Purpose**: Load balancing between agents through task redistribution

### **Key Components to Extract**
1. **WorkStealingCoordinator** class
2. **AgentWorkload** interface
3. **WorkStealingConfig** configuration
4. **Load balancing algorithms**
5. **Task redistribution logic**

---

## 🏗️ **Implementation Plan**

### **Phase 1: Core Work Stealing (Days 1-2)**

#### **1.1 Create Work Stealing Module**
**Target File**: `src/coordination/work-stealing.js`

**Implementation Steps**:
```javascript
// Extract from original: src/coordination/work-stealing.ts
// Convert TypeScript to JavaScript
// Integrate with your Queen Controller

class WorkStealingCoordinator {
  constructor(config, queenController) {
    this.config = {
      enabled: true,
      stealThreshold: 3,        // Min difference to trigger stealing
      maxStealBatch: 5,         // Max tasks to steal at once  
      stealInterval: 5000,      // Check every 5 seconds
      ...config
    };
    
    this.queenController = queenController;
    this.workloads = new Map();
    this.taskDurations = new Map();
    this.stealInterval = null;
  }

  // Extract: initialize() method
  // Extract: updateAgentWorkload() method
  // Extract: checkAndSteal() method
  // Extract: findBestAgent() method
}
```

#### **1.2 Integration Points**
**Modify**: `.ai-workflow/intelligence-engine/queen-controller.js`

**Add to constructor**:
```javascript
// After existing initialization
this.workStealing = new WorkStealingCoordinator(
  options.workStealing || {},
  this
);
```

**Add to initializeUnlimitedScaling()**:
```javascript
// After existing component initialization
await this.workStealing.initialize();
```

### **Phase 2: Task Redistribution (Days 3-4)**

#### **2.1 Add Task Redistribution Logic**
**Target Method**: `redistributeTasks(sourceAgentId, targetAgentId, taskCount)`

**Implementation**:
```javascript
async redistributeTasks(sourceAgentId, targetAgentId, taskCount) {
  const sourceAgent = this.subAgents.get(sourceAgentId);
  const targetAgent = this.subAgents.get(targetAgentId);

  if (!sourceAgent || !targetAgent) {
    throw new Error('Agent not found');
  }

  // Get reassignable tasks (prefer non-critical, low-priority tasks)
  const reassignableTasks = Array.from(sourceAgent.currentTasks || [])
    .filter(task => task.priority < 8) // Don't steal high-priority tasks
    .sort((a, b) => a.priority - b.priority) // Steal lowest priority first
    .slice(0, taskCount);

  console.log(`Redistributing ${reassignableTasks.length} tasks from ${sourceAgentId} to ${targetAgentId}`);

  // Execute redistribution
  for (const task of reassignableTasks) {
    await this._reassignTask(task, sourceAgent, targetAgent);
  }

  // Update workloads
  this._updateWorkloadMetrics(sourceAgentId, targetAgentId);
  
  this.emit('tasks:redistributed', {
    source: sourceAgentId,
    target: targetAgentId,
    taskCount: reassignableTasks.length
  });
}
```

#### **2.2 Workload Tracking**
**Add to existing task assignment methods**:
```javascript
// In assignTask() method - after successful assignment
if (this.workStealing) {
  this.workStealing.updateAgentWorkload(agentId, {
    taskCount: this._getAgentTaskCount(agentId),
    capabilities: agent.capabilities,
    priority: agent.priority || 0,
    lastActivity: new Date()
  });
}
```

### **Phase 3: Background Processing (Days 5-7)**

#### **3.1 Background Workers**
**Add to Queen Controller**:
```javascript
startBackgroundWorkers() {
  // Work stealing monitor
  if (this.workStealing && this.workStealing.config.enabled) {
    const workStealingWorker = setInterval(() => {
      this.workStealing.checkAndSteal();
    }, this.workStealing.config.stealInterval);
    
    this.backgroundWorkers.set('workStealing', workStealingWorker);
  }
}
```

#### **3.2 Event Integration**
**Add event handlers**:
```javascript
setupWorkStealingEvents() {
  // Listen for task completion to update workloads
  this.on('task:completed', (data) => {
    if (this.workStealing && data.agentId) {
      this.workStealing.updateAgentWorkload(data.agentId, {
        taskCount: this._getAgentTaskCount(data.agentId),
        lastActivity: new Date()
      });
    }
  });

  // Listen for new agents
  this.on('agent:registered', (data) => {
    if (this.workStealing && data.agent) {
      this.workStealing.updateAgentWorkload(data.agent.id, {
        taskCount: 0,
        capabilities: data.agent.capabilities || [],
        priority: data.agent.priority || 0
      });
    }
  });
}
```

---

## 📁 **File Structure**

### **New Files to Create**
```
src/coordination/
├── work-stealing.js           # Work stealing coordinator
├── workload-tracker.js        # Agent workload monitoring
└── task-redistributor.js      # Task redistribution logic

tests/coordination/
├── work-stealing.test.js      # Unit tests
└── integration.test.js        # Integration tests
```

### **Files to Modify**
```
.ai-workflow/intelligence-engine/
└── queen-controller.js        # Integration points

src/claude-flow/orchestrator/
└── flow-orchestrator.js       # Optional: add work stealing
```

---

## 🧪 **Testing Strategy**

### **Unit Tests**
**File**: `tests/coordination/work-stealing.test.js`

```javascript
describe('WorkStealingCoordinator', () => {
  let workStealing;
  let mockQueenController;

  beforeEach(() => {
    mockQueenController = {
      redistributeTasks: jest.fn(),
      emit: jest.fn()
    };
    
    workStealing = new WorkStealingCoordinator({
      enabled: true,
      stealThreshold: 2,
      maxStealBatch: 3,
      stealInterval: 1000
    }, mockQueenController);
  });

  test('should initialize with config', () => {
    expect(workStealing.config.enabled).toBe(true);
    expect(workStealing.config.stealThreshold).toBe(2);
  });

  test('should detect workload imbalance', async () => {
    // Setup imbalanced workloads
    workStealing.updateAgentWorkload('agent1', { taskCount: 1 });
    workStealing.updateAgentWorkload('agent2', { taskCount: 8 });

    await workStealing.checkAndStealing();

    expect(mockQueenController.redistributeTasks).toHaveBeenCalledWith(
      'agent2', 'agent1', expect.any(Number)
    );
  });

  test('should not steal when balanced', async () => {
    workStealing.updateAgentWorkload('agent1', { taskCount: 3 });
    workStealing.updateAgentWorkload('agent2', { taskCount: 4 });

    await workStealing.checkAndStealing();

    expect(mockQueenController.redistributeTasks).not.toHaveBeenCalled();
  });
});
```

### **Integration Tests**
**File**: `tests/coordination/integration.test.js`

```javascript
describe('Work Stealing Integration', () => {
  let queenController;

  beforeEach(async () => {
    queenController = new QueenController({
      workStealing: { enabled: true }
    });
    await queenController.initialize();
  });

  test('should redistribute tasks under load', async () => {
    // Register agents
    const agent1 = await queenController.registerAgent('agent1', 'worker');
    const agent2 = await queenController.registerAgent('agent2', 'worker');

    // Create imbalanced load
    await queenController.assignTask('task1', agent2);
    await queenController.assignTask('task2', agent2);
    await queenController.assignTask('task3', agent2);
    await queenController.assignTask('task4', agent2);

    // Wait for work stealing to trigger
    await new Promise(resolve => setTimeout(resolve, 6000));

    // Verify redistribution
    expect(queenController.getAgentTaskCount(agent1)).toBeGreaterThan(0);
    expect(queenController.getAgentTaskCount(agent2)).toBeLessThan(4);
  });
});
```

---

## ⚙️ **Configuration**

### **Default Configuration**
```javascript
// config/work-stealing.js
module.exports = {
  workStealing: {
    enabled: true,
    stealThreshold: 3,        // Min task difference to trigger
    maxStealBatch: 5,         // Max tasks per steal operation
    stealInterval: 5000,      // Check interval in ms
    priorityThreshold: 8,     // Don't steal tasks above this priority
    enablePredictiveStealing: true,  // Use task duration predictions
    maxPredictiveLoad: 30000  // Max predicted load before stealing
  }
};
```

### **Environment Variables**
```bash
# .env
WORK_STEALING_ENABLED=true
WORK_STEALING_THRESHOLD=3
WORK_STEALING_INTERVAL=5000
```

---

## 📊 **Performance Metrics**

### **Key Metrics to Track**
1. **Steal Operations**: Number of successful task redistributions
2. **Load Imbalance**: Standard deviation of task counts across agents
3. **Redistribution Latency**: Time to steal and reassign tasks
4. **Resource Utilization**: CPU/memory usage before/after stealing

### **Monitoring Implementation**
```javascript
getWorkStealingMetrics() {
  return {
    totalSteals: this.metrics.stealOperations || 0,
    averageStealSize: this.metrics.averageStealSize || 0,
    loadImbalance: this._calculateLoadImbalance(),
    redistributionLatency: this.metrics.redistributionLatency || 0,
    lastStealTime: this.metrics.lastStealTime || null,
    timestamp: new Date()
  };
}
```

---

## 🚀 **Deployment Steps**

### **Step 1: Preparation**
1. Backup existing Queen Controller
2. Create feature branch for integration
3. Set up testing environment

### **Step 2: Implementation**
1. Create work-stealing.js module
2. Add integration points to Queen Controller
3. Implement background workers
4. Add configuration options

### **Step 3: Testing**
1. Run unit tests for work stealing
2. Execute integration tests
3. Perform load testing with multiple agents
4. Validate performance improvements

### **Step 4: Deployment**
1. Deploy to staging environment
2. Enable work stealing with feature flag
3. Monitor performance metrics
4. Gradual rollout to production

---

## 🎯 **Success Criteria**

### **Functional Requirements**
- ✅ Work stealing triggers when load imbalance > threshold
- ✅ Tasks are redistributed without data loss
- ✅ High-priority tasks are protected from stealing
- ✅ Background monitoring runs continuously

### **Performance Requirements**
- ✅ Load imbalance reduced by >50%
- ✅ Redistribution completes in <100ms
- ✅ <5% overhead for work stealing operations
- ✅ Zero task loss during redistribution

### **Reliability Requirements**
- ✅ Graceful handling of agent failures during stealing
- ✅ Automatic recovery from steal operation failures
- ✅ No impact on critical task execution
- ✅ Real-time monitoring and alerting

---

## 🔧 **Troubleshooting**

### **Common Issues**
1. **Work stealing not triggering**
   - Check threshold configuration
   - Verify workload tracking is working
   - Ensure background workers are running

2. **Tasks being lost during redistribution**
   - Verify task state management
   - Check error handling in redistributeTasks()
   - Review transaction boundaries

3. **Performance degradation**
   - Adjust steal interval frequency
   - Optimize workload tracking
   - Review background worker efficiency

### **Debug Tools**
```javascript
// Debug work stealing state
debugWorkStealing() {
  return {
    config: this.workStealing.config,
    workloads: Array.from(this.workStealing.workloads.entries()),
    backgroundWorkers: Array.from(this.backgroundWorkers.keys()),
    metrics: this.getWorkStealingMetrics()
  };
}
```

---

## 📝 **Documentation Updates**

### **API Documentation**
- Add WorkStealingCoordinator class docs
- Document configuration options
- Update Queen Controller API with new methods

### **User Guide**
- Explain work stealing benefits
- Provide configuration examples
- Add troubleshooting section

### **Technical Documentation**
- Architecture diagrams
- Integration flow charts
- Performance benchmarking results