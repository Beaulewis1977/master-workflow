# Dependency Graph Integration Implementation Plan

## 📋 **Overview**

Integration of the original claude-flow's dependency graph management into your Queen Controller for handling complex task relationships and execution ordering.

---

## 🎯 **Source Analysis**

### **Original Location**
- **File**: `src/coordination/dependency-graph.ts`
- **Repository**: https://github.com/ruvnet/claude-flow
- **Purpose**: Manage task dependencies and execution order

### **Key Components to Extract**
1. **DependencyGraph** class
2. **TaskDependency** interface
3. **Topological sort algorithm** for execution ordering
4. **Circular dependency detection**
5. **Dependency resolution logic**
6. **Execution planning with dependencies**

---

## 🏗️ **Implementation Plan**

### **Phase 1: Dependency Graph Core (Days 1-2)**

#### **1.1 Create Dependency Graph Module**
**Target File**: `src/coordination/dependency-graph.js`

```javascript
// Extract from original: src/coordination/dependency-graph.ts
// Convert TypeScript to JavaScript
// Integrate with your Queen Controller

class DependencyGraph {
  constructor() {
    this.nodes = new Map(); // taskId -> node data
    this.edges = new Map(); // taskId -> Set of dependencies
    this.reverseEdges = new Map(); // taskId -> Set of dependents
    this.executionOrder = [];
    this.circularDependencies = [];
  }

  /**
   * Add a task to the dependency graph
   */
  addTask(task) {
    if (!task || !task.id) {
      throw new Error('Task must have a valid ID');
    }

    const node = {
      id: task.id,
      task: task,
      dependencies: new Set(),
      dependents: new Set(),
      status: 'pending',
      completed: false,
      createdAt: new Date()
    };

    this.nodes.set(task.id, node);
    this.edges.set(task.id, new Set());
    this.reverseEdges.set(task.id, new Set());

    return node;
  }

  /**
   * Add dependency between tasks
   */
  addDependency(taskId, dependsOnTaskId) {
    if (!this.nodes.has(taskId) || !this.nodes.has(dependsOnTaskId)) {
      throw new Error('Both tasks must exist in the graph');
    }

    // Check for circular dependency
    if (this.wouldCreateCircularDependency(taskId, dependsOnTaskId)) {
      throw new Error(`Adding dependency ${taskId} -> ${dependsOnTaskId} would create a circular dependency`);
    }

    this.edges.get(taskId).add(dependsOnTaskId);
    this.reverseEdges.get(dependsOnTaskId).add(taskId);
    
    // Update node references
    this.nodes.get(taskId).dependencies.add(dependsOnTaskId);
    this.nodes.get(dependsOnTaskId).dependents.add(taskId);

    // Recalculate execution order
    this.calculateExecutionOrder();
  }

  /**
   * Remove dependency between tasks
   */
  removeDependency(taskId, dependsOnTaskId) {
    if (this.edges.has(taskId)) {
      this.edges.get(taskId).delete(dependsOnTaskId);
    }
    
    if (this.reverseEdges.has(dependsOnTaskId)) {
      this.reverseEdges.get(dependsOnTaskId).delete(taskId);
    }

    // Update node references
    const taskNode = this.nodes.get(taskId);
    const depNode = this.nodes.get(dependsOnTaskId);
    
    if (taskNode) taskNode.dependencies.delete(dependsOnTaskId);
    if (depNode) depNode.dependents.delete(taskId);

    // Recalculate execution order
    this.calculateExecutionOrder();
  }

  /**
   * Check if adding dependency would create circular dependency
   */
  wouldCreateCircularDependency(from, to) {
    const visited = new Set();
    const recursionStack = new Set();

    const hasCycle = (node) => {
      if (recursionStack.has(node)) {
        return true;
      }
      
      if (visited.has(node)) {
        return false;
      }

      visited.add(node);
      recursionStack.add(node);

      const dependencies = this.edges.get(node) || new Set();
      for (const dep of dependencies) {
        if (hasCycle(dep)) {
          return true;
        }
      }

      recursionStack.delete(node);
      return false;
    };

    // Temporarily add the edge to test
    this.edges.get(from).add(to);
    
    const hasCircularDep = hasCycle(to);
    
    // Remove the temporary edge
    this.edges.get(from).delete(to);

    return hasCircularDep;
  }

  /**
   * Calculate execution order using topological sort
   */
  calculateExecutionOrder() {
    const visited = new Set();
    const order = [];
    const temp = new Set();

    const visit = (taskId) => {
      if (temp.has(taskId)) {
        // Circular dependency detected
        this.circularDependencies.push(taskId);
        return;
      }

      if (visited.has(taskId)) {
        return;
      }

      temp.add(taskId);

      // Visit all dependencies first
      const dependencies = this.edges.get(taskId) || new Set();
      for (const dep of dependencies) {
        visit(dep);
      }

      temp.delete(taskId);
      visited.add(taskId);
      order.push(taskId);
    };

    // Visit all nodes
    for (const taskId of this.nodes.keys()) {
      if (!visited.has(taskId)) {
        visit(taskId);
      }
    }

    this.executionOrder = order;
    return order;
  }

  /**
   * Get tasks that can be executed (all dependencies completed)
   */
  getExecutableTasks() {
    const executable = [];

    for (const [taskId, node] of this.nodes) {
      if (node.status === 'pending' && this.areDependenciesSatisfied(taskId)) {
        executable.push(taskId);
      }
    }

    return executable;
  }

  /**
   * Check if all dependencies for a task are satisfied
   */
  areDependenciesSatisfied(taskId) {
    const dependencies = this.edges.get(taskId) || new Set();
    
    for (const depId of dependencies) {
      const depNode = this.nodes.get(depId);
      if (!depNode || !depNode.completed) {
        return false;
      }
    }

    return true;
  }

  /**
   * Mark task as completed
   */
  markTaskCompleted(taskId) {
    const node = this.nodes.get(taskId);
    if (node) {
      node.completed = true;
      node.status = 'completed';
      node.completedAt = new Date();
    }
  }

  /**
   * Mark task as failed
   */
  markTaskFailed(taskId, error) {
    const node = this.nodes.get(taskId);
    if (node) {
      node.status = 'failed';
      node.error = error;
      node.failedAt = new Date();
    }
  }

  /**
   * Get tasks that depend on a given task
   */
  getDependents(taskId) {
    return Array.from(this.reverseEdges.get(taskId) || new Set());
  }

  /**
   * Get all dependencies for a task (transitive)
   */
  getAllDependencies(taskId) {
    const allDeps = new Set();
    const visited = new Set();

    const collectDependencies = (id) => {
      if (visited.has(id)) return;
      
      visited.add(id);
      const deps = this.edges.get(id) || new Set();
      
      for (const dep of deps) {
        allDeps.add(dep);
        collectDependencies(dep);
      }
    };

    collectDependencies(taskId);
    return Array.from(allDeps);
  }

  /**
   * Get graph statistics
   */
  getGraphStats() {
    const totalTasks = this.nodes.size;
    const completedTasks = Array.from(this.nodes.values()).filter(n => n.completed).length;
    const failedTasks = Array.from(this.nodes.values()).filter(n => n.status === 'failed').length;
    const pendingTasks = totalTasks - completedTasks - failedTasks;

    return {
      totalTasks,
      completedTasks,
      failedTasks,
      pendingTasks,
      executionOrder: this.executionOrder.length,
      circularDependencies: this.circularDependencies.length,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(2) + '%' : '0%'
    };
  }

  /**
   * Clear the graph
   */
  clear() {
    this.nodes.clear();
    this.edges.clear();
    this.reverseEdges.clear();
    this.executionOrder = [];
    this.circularDependencies = [];
  }

  /**
   * Export graph for visualization/debugging
   */
  export() {
    const exportData = {
      nodes: {},
      edges: [],
      executionOrder: this.executionOrder,
      stats: this.getGraphStats()
    };

    // Export nodes
    for (const [taskId, node] of this.nodes) {
      exportData.nodes[taskId] = {
        id: node.id,
        status: node.status,
        completed: node.completed,
        dependencies: Array.from(node.dependencies),
        dependents: Array.from(node.dependents),
        createdAt: node.createdAt,
        completedAt: node.completedAt,
        failedAt: node.failedAt
      };
    }

    // Export edges
    for (const [taskId, dependencies] of this.edges) {
      for (const depId of dependencies) {
        exportData.edges.push({
          from: taskId,
          to: depId
        });
      }
    }

    return exportData;
  }
}

module.exports = DependencyGraph;
```

### **Phase 2: Queen Controller Integration (Days 3-4)**

#### **2.1 Integration Points**
**Modify**: `.ai-workflow/intelligence-engine/queen-controller.js`

**Add to constructor**:
```javascript
// Dependency graph management
this.dependencyGraph = new DependencyGraph();
this.dependencyConfig = {
  enabled: options.enableDependencyGraph !== false,
  autoResolve: options.autoResolveDependencies !== false,
  maxDependencyDepth: options.maxDependencyDepth || 10,
  ...options.dependencyGraph
};
```

#### **2.2 Enhanced Task Distribution with Dependencies**
**Modify existing distributeTask method**:
```javascript
async distributeTask(task, dependencies = [], options = {}) {
  try {
    // Validate task input
    if (!task || !task.id) {
      throw new Error('Task must have a valid ID');
    }

    // NEW: Add task to dependency graph
    if (this.dependencyConfig.enabled) {
      this.dependencyGraph.addTask(task);
      
      // Add dependencies to graph
      for (const depId of dependencies) {
        if (this.tasks.has(depId)) {
          this.dependencyGraph.addDependency(task.id, depId);
        } else {
          console.warn(`Dependency task ${depId} not found, skipping`);
        }
      }
    }

    // Check if dependencies are satisfied
    if (!this.areDependenciesSatisfied(task.id)) {
      this.pendingTasks.set(task.id, { task, dependencies, options });
      return { 
        status: 'pending', 
        reason: 'dependencies_not_satisfied',
        dependencies: this.getUnsatisfiedDependencies(task.id)
      };
    }

    // Select and assign agent
    const selectedAgentId = await this.selectAgentForTask(task, options.strategy);
    
    if (!selectedAgentId) {
      throw new Error('No suitable agent available for task');
    }

    await this.assignTask(task.id, selectedAgentId);
    
    return { 
      status: 'assigned', 
      agentId: selectedAgentId,
      dependencies: dependencies
    };

  } catch (error) {
    console.error('Task distribution failed:', error);
    
    // Mark task as failed in dependency graph
    if (this.dependencyConfig.enabled) {
      this.dependencyGraph.markTaskFailed(task.id, error.message);
    }
    
    throw error;
  }
}
```

#### **2.3 Dependency Resolution**
**Add new methods**:
```javascript
/**
 * Check if task dependencies are satisfied
 */
areDependenciesSatisfied(taskId) {
  if (!this.dependencyConfig.enabled) {
    return true; // Skip dependency checking if disabled
  }

  return this.dependencyGraph.areDependenciesSatisfied(taskId);
}

/**
 * Get unsatisfied dependencies for a task
 */
getUnsatisfiedDependencies(taskId) {
  if (!this.dependencyConfig.enabled) {
    return [];
  }

  const allDeps = this.dependencyGraph.getAllDependencies(taskId);
  const unsatisfied = [];

  for (const depId of allDeps) {
    const depTask = this.tasks.get(depId);
    if (!depTask || depTask.status !== 'completed') {
      unsatisfied.push(depId);
    }
  }

  return unsatisfied;
}

/**
 * Process pending tasks whose dependencies are now satisfied
 */
async processPendingTasks() {
  if (!this.dependencyConfig.enabled) {
    return;
  }

  const executableTasks = this.dependencyGraph.getExecutableTasks();
  const processedTasks = [];

  for (const taskId of executableTasks) {
    const pendingInfo = this.pendingTasks.get(taskId);
    if (pendingInfo) {
      try {
        // Dependencies are satisfied, distribute the task
        const result = await this.distributeTask(
          pendingInfo.task, 
          [], // Dependencies already added to graph
          pendingInfo.options
        );

        // Remove from pending tasks
        this.pendingTasks.delete(taskId);
        processedTasks.push({ taskId, result });

      } catch (error) {
        console.error(`Failed to distribute pending task ${taskId}:`, error);
      }
    }
  }

  if (processedTasks.length > 0) {
    this.emit('dependencies:resolved', { 
      tasksProcessed: processedTasks.length,
      tasks: processedTasks 
    });
  }

  return processedTasks;
}

/**
 * Handle task completion with dependency resolution
 */
async handleTaskCompletion(taskId, result, agentId) {
  // Existing completion logic...
  const task = this.tasks.get(taskId);
  if (task) {
    task.status = 'completed';
    task.result = result;
    task.completedAt = new Date();
    task.completedBy = agentId;

    // NEW: Mark as completed in dependency graph
    if (this.dependencyConfig.enabled) {
      this.dependencyGraph.markTaskCompleted(taskId);
      
      // Process any tasks that were waiting for this dependency
      await this.processPendingTasks();
    }

    // Update agent status
    const agent = this.subAgents.get(agentId);
    if (agent) {
      agent.status = 'idle';
      agent.currentTask = null;
      agent.metrics.tasksCompleted++;
    }

    this.emit('task:completed', { taskId, result, agentId });
    this.metrics.tasksCompleted++;
  }
}

/**
 * Handle task failure with dependency impact
 */
async handleTaskFailure(taskId, error, agentId) {
  // Existing failure logic...
  const task = this.tasks.get(taskId);
  if (task) {
    task.status = 'failed';
    task.error = error;
    task.failedAt = new Date();

    // NEW: Mark as failed in dependency graph
    if (this.dependencyConfig.enabled) {
      this.dependencyGraph.markTaskFailed(taskId, error);
      
      // Cancel dependent tasks
      const dependents = this.dependencyGraph.getDependents(taskId);
      for (const dependentId of dependents) {
        await this.cancelDependentTask(dependentId, taskId);
      }
    }

    // Update agent status
    const agent = this.subAgents.get(agentId);
    if (agent) {
      agent.status = 'idle';
      agent.currentTask = null;
      agent.metrics.tasksFailed++;
    }

    this.emit('task:failed', { taskId, error, agentId });
  }
}

/**
 * Cancel tasks that depend on a failed task
 */
async cancelDependentTask(taskId, failedDependencyId) {
  const pendingInfo = this.pendingTasks.get(taskId);
  if (pendingInfo) {
    console.log(`Cancelling task ${taskId} due to failed dependency ${failedDependencyId}`);
    
    // Mark as failed
    this.dependencyGraph.markTaskFailed(taskId, `Dependency ${failedDependencyId} failed`);
    
    // Remove from pending
    this.pendingTasks.delete(taskId);
    
    // Emit cancellation event
    this.emit('task:cancelled', { 
      taskId, 
      reason: 'dependency_failed',
      failedDependency: failedDependencyId 
    });
  }
}
```

### **Phase 3: Advanced Features (Days 5-7)**

#### **3.1 Dependency Graph Monitoring**
**Add monitoring capabilities**:
```javascript
startDependencyMonitoring() {
  if (!this.dependencyConfig.enabled) return;

  // Monitor dependency resolution
  const monitorWorker = setInterval(() => {
    this.checkDependencyHealth();
  }, 10000); // Check every 10 seconds

  this.backgroundWorkers.set('dependencyMonitor', monitorWorker);
}

checkDependencyHealth() {
  const stats = this.dependencyGraph.getGraphStats();
  
  // Check for issues
  const issues = [];
  
  if (stats.circularDependencies > 0) {
    issues.push({
      type: 'circular_dependencies',
      count: stats.circularDependencies,
      severity: 'high'
    });
  }
  
  if (parseInt(stats.completionRate) < 50 && stats.totalTasks > 10) {
    issues.push({
      type: 'low_completion_rate',
      rate: stats.completionRate,
      severity: 'medium'
    });
  }

  if (issues.length > 0) {
    this.emit('dependency:alert', {
      issues,
      stats,
      timestamp: new Date()
    });
  }

  return { stats, issues };
}
```

#### **3.2 Dependency Graph Visualization**
**Add visualization support**:
```javascript
getDependencyGraphVisualization() {
  if (!this.dependencyConfig.enabled) {
    return null;
  }

  const graphData = this.dependencyGraph.export();
  
  // Convert to visualization format (e.g., D3.js, Cytoscape)
  const visualizationData = {
    nodes: Object.entries(graphData.nodes).map(([id, data]) => ({
      id,
      label: data.id,
      status: data.status,
      completed: data.completed,
      group: data.completed ? 'completed' : (data.status === 'failed' ? 'failed' : 'pending')
    })),
    edges: graphData.edges.map(edge => ({
      source: edge.from,
      target: edge.to,
      type: 'dependency'
    }))
  };

  return {
    data: visualizationData,
    stats: graphData.stats,
    layout: 'hierarchical' // Recommended layout for dependency graphs
  };
}
```

---

## 📁 **File Structure**

### **New Files to Create**
```
src/coordination/
├── dependency-graph.js        # Core dependency graph implementation
├── dependency-resolver.js     # Advanced dependency resolution
├── dependency-monitor.js      # Monitoring and alerting
└── dependency-visualizer.js   # Visualization support

tests/coordination/
├── dependency-graph.test.js   # Unit tests
├── dependency-resolution.test.js # Integration tests
└── dependency-monitoring.test.js # Monitoring tests
```

### **Files to Modify**
```
.ai-workflow/intelligence-engine/
└── queen-controller.js        # Integration points

src/claude-flow/orchestrator/
└── flow-orchestrator.js       # Optional: dependency support
```

---

## 🧪 **Testing Strategy**

### **Unit Tests**
**File**: `tests/coordination/dependency-graph.test.js`

```javascript
const DependencyGraph = require('../../src/coordination/dependency-graph');

describe('DependencyGraph', () => {
  let graph;

  beforeEach(() => {
    graph = new DependencyGraph();
  });

  test('should add tasks and dependencies', () => {
    const task1 = { id: 'task1', type: 'test' };
    const task2 = { id: 'task2', type: 'test' };

    graph.addTask(task1);
    graph.addTask(task2);
    graph.addDependency('task2', 'task1');

    expect(graph.areDependenciesSatisfied('task1')).toBe(true);
    expect(graph.areDependenciesSatisfied('task2')).toBe(false);
  });

  test('should detect circular dependencies', () => {
    const task1 = { id: 'task1', type: 'test' };
    const task2 = { id: 'task2', type: 'test' };

    graph.addTask(task1);
    graph.addTask(task2);
    graph.addDependency('task2', 'task1');

    expect(() => {
      graph.addDependency('task1', 'task2');
    }).toThrow('circular dependency');
  });

  test('should calculate execution order', () => {
    const task1 = { id: 'task1', type: 'test' };
    const task2 = { id: 'task2', type: 'test' };
    const task3 = { id: 'task3', type: 'test' };

    graph.addTask(task1);
    graph.addTask(task2);
    graph.addTask(task3);
    
    graph.addDependency('task2', 'task1');
    graph.addDependency('task3', 'task2');

    const order = graph.calculateExecutionOrder();
    expect(order).toEqual(['task1', 'task2', 'task3']);
  });

  test('should identify executable tasks', () => {
    const task1 = { id: 'task1', type: 'test' };
    const task2 = { id: 'task2', type: 'test' };
    const task3 = { id: 'task3', type: 'test' };

    graph.addTask(task1);
    graph.addTask(task2);
    graph.addTask(task3);
    
    graph.addDependency('task2', 'task1');
    graph.addDependency('task3', 'task2');

    // Initially only task1 is executable
    let executable = graph.getExecutableTasks();
    expect(executable).toEqual(['task1']);

    // Complete task1
    graph.markTaskCompleted('task1');
    executable = graph.getExecutableTasks();
    expect(executable).toEqual(['task2']);
  });
});
```

### **Integration Tests**
**File**: `tests/coordination/dependency-resolution.test.js`

```javascript
describe('Dependency Resolution Integration', () => {
  let queenController;

  beforeEach(async () => {
    queenController = new QueenController({
      enableDependencyGraph: true,
      autoResolveDependencies: true
    });
    await queenController.initialize();
  });

  test('should handle task dependencies correctly', async () => {
    // Create tasks with dependencies
    const task1 = { id: 'task1', type: 'build', description: 'Build project' };
    const task2 = { id: 'task2', type: 'test', description: 'Run tests' };
    const task3 = { id: 'task3', type: 'deploy', description: 'Deploy application' };

    // Add tasks with dependencies
    await queenController.distributeTask(task1, []);
    await queenController.distributeTask(task2, ['task1']);
    await queenController.distributeTask(task3, ['task2']);

    // task2 and task3 should be pending
    expect(queenController.pendingTasks.has('task2')).toBe(true);
    expect(queenController.pendingTasks.has('task3')).toBe(true);

    // Complete task1
    await queenController.handleTaskCompletion('task1', 'success', 'agent1');

    // task2 should now be executable
    await new Promise(resolve => setTimeout(resolve, 100)); // Allow processing
    expect(queenController.pendingTasks.has('task2')).toBe(false);
  });

  test('should cancel dependent tasks on failure', async () => {
    const task1 = { id: 'task1', type: 'build', description: 'Build project' };
    const task2 = { id: 'task2', type: 'test', description: 'Run tests' };

    await queenController.distributeTask(task1, []);
    await queenController.distributeTask(task2, ['task1']);

    // Fail task1
    await queenController.handleTaskFailure('task1', new Error('Build failed'), 'agent1');

    // task2 should be cancelled
    expect(queenController.dependencyGraph.nodes.get('task2').status).toBe('failed');
  });
});
```

---

## ⚙️ **Configuration**

### **Default Configuration**
```javascript
// config/dependency-graph.js
module.exports = {
  dependencyGraph: {
    enabled: true,
    autoResolve: true,                    // Auto-resolve pending tasks
    maxDependencyDepth: 10,               // Maximum dependency chain depth
    monitoringInterval: 10000,            // Health check interval
    circularDependencyCheck: true,        // Enable circular dependency detection
    dependencyTimeout: 300000,            // Timeout for dependency resolution
    cancelOnFailure: true,                // Cancel dependents on failure
    visualizationEnabled: true           // Enable graph visualization
  }
};
```

### **Environment Variables**
```bash
# .env
DEPENDENCY_GRAPH_ENABLED=true
AUTO_RESOLVE_DEPENDENCIES=true
MAX_DEPENDENCY_DEPTH=10
DEPENDENCY_MONITORING_INTERVAL=10000
```

---

## 📊 **Performance Metrics**

### **Key Metrics to Track**
1. **Dependency Resolution Time**: Time to resolve dependencies
2. **Graph Complexity**: Number of nodes, edges, and depth
3. **Circular Dependencies**: Detection and resolution
4. **Completion Rate**: Percentage of tasks completed
5. **Failure Propagation**: Impact of task failures

### **Monitoring Implementation**
```javascript
getDependencyMetrics() {
  if (!this.dependencyConfig.enabled) {
    return { enabled: false };
  }

  const stats = this.dependencyGraph.getGraphStats();
  
  return {
    enabled: true,
    graph: stats,
    performance: {
      averageResolutionTime: this.calculateAverageResolutionTime(),
      failurePropagationRate: this.calculateFailurePropagationRate(),
      dependencyEfficiency: this.calculateDependencyEfficiency()
    },
    timestamp: new Date()
  };
}
```

---

## 🚀 **Deployment Steps**

### **Step 1: Preparation**
1. Backup existing Queen Controller
2. Create feature branch for dependency graph
3. Set up monitoring for dependency metrics

### **Step 2: Implementation**
1. Create dependency-graph.js module
2. Add integration points to Queen Controller
3. Implement dependency resolution logic
4. Add monitoring and visualization

### **Step 3: Testing**
1. Test dependency detection and resolution
2. Verify circular dependency prevention
3. Test failure propagation handling
4. Validate performance under complex dependencies

### **Step 4: Deployment**
1. Deploy with dependency graph enabled
2. Monitor resolution performance
3. Tune configuration parameters
4. Gradual rollout with monitoring

---

## 🎯 **Success Criteria**

### **Functional Requirements**
- ✅ Accurate dependency tracking and resolution
- ✅ Circular dependency detection and prevention
- ✅ Proper execution order calculation
- ✅ Automatic pending task processing
- ✅ Failure propagation handling

### **Performance Requirements**
- ✅ <50ms dependency resolution time
- ✅ Handle 1000+ tasks with dependencies
- ✅ <1% overhead for dependency management
- ✅ Real-time dependency monitoring

### **Reliability Requirements**
- ✅ No task execution without satisfied dependencies
- ✅ Proper handling of dependency failures
- ✅ Consistent graph state management
- ✅ Recovery from partial failures

---

## 🔧 **Troubleshooting**

### **Common Issues**
1. **Tasks not executing**
   - Check dependency satisfaction
   - Verify dependency graph state
   - Review pending task processing

2. **Circular dependency errors**
   - Review task dependency definitions
   - Check for indirect circular references
   - Use graph visualization to identify issues

3. **Performance degradation**
   - Optimize graph traversal algorithms
   - Reduce monitoring frequency
   - Review dependency depth limits

### **Debug Tools**
```javascript
// Debug dependency graph state
debugDependencyGraph() {
  if (!this.dependencyConfig.enabled) {
    return { enabled: false };
  }

  return {
    graph: this.dependencyGraph.export(),
    pendingTasks: Array.from(this.pendingTasks.keys()),
    executableTasks: this.dependencyGraph.getExecutableTasks(),
    stats: this.dependencyGraph.getGraphStats()
  };
}
```

---

## 📝 **Documentation Updates**

### **API Documentation**
- Document dependency graph methods
- Explain configuration options
- Update Queen Controller API with dependency methods

### **User Guide**
- Guide to defining task dependencies
- Troubleshooting dependency issues
- Best practices for dependency management

### **Technical Documentation**
- Dependency graph architecture diagrams
- Algorithm explanations and complexity analysis
- Performance benchmarking results