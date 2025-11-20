# Circuit Breaker Integration Implementation Plan

## 📋 **Overview**

Integration of the original claude-flow's circuit breaker pattern into your Queen Controller for fault tolerance and prevention of cascading failures.

---

## 🎯 **Source Analysis**

### **Original Location**
- **File**: `src/coordination/circuit-breaker.ts`
- **Repository**: https://github.com/ruvnet/claude-flow
- **Purpose**: Fault tolerance through failure isolation and automatic recovery

### **Key Components to Extract**
1. **CircuitBreaker** class with state management
2. **CircuitState** enum (CLOSED, OPEN, HALF_OPEN)
3. **CircuitBreakerConfig** configuration
4. **CircuitBreakerMetrics** tracking
5. **Failure detection and recovery logic**

---

## 🏗️ **Implementation Plan**

### **Phase 1: Core Circuit Breaker (Days 1-2)**

#### **1.1 Create Circuit Breaker Module**
**Target File**: `src/coordination/circuit-breaker.js`

**Implementation Steps**:
```javascript
// Extract from original: src/coordination/circuit-breaker.ts
// Convert TypeScript to JavaScript
// Integrate with your Queen Controller

class CircuitBreaker {
  constructor(name, config) {
    this.name = name;
    this.config = {
      failureThreshold: 5,      // Open after 5 failures
      successThreshold: 3,      // Close after 3 successes
      timeout: 60000,           // Wait 60s before retry
      halfOpenLimit: 2,         // Max requests in half-open
      ...config
    };

    // State management
    this.state = 'CLOSED';
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = null;
    this.lastSuccessTime = null;
    this.nextAttempt = null;
    this.halfOpenRequests = 0;
    this.totalRequests = 0;
    this.rejectedRequests = 0;
  }

  // Extract: execute() method with protection
  // Extract: canExecute() state checking
  // Extract: onSuccess() and onFailure() handlers
  // Extract: transitionTo() state management
}
```

#### **1.2 Circuit Breaker Manager**
**Target File**: `src/coordination/circuit-breaker-manager.js`

```javascript
class CircuitBreakerManager {
  constructor() {
    this.breakers = new Map();
    this.globalConfig = {
      failureThreshold: 5,
      successThreshold: 3,
      timeout: 60000,
      halfOpenLimit: 2
    };
  }

  createBreaker(name, config = {}) {
    const breaker = new CircuitBreaker(name, {
      ...this.globalConfig,
      ...config
    });
    
    this.breakers.set(name, breaker);
    return breaker;
  }

  getBreaker(name) {
    return this.breakers.get(name);
  }

  getAllMetrics() {
    const metrics = {};
    for (const [name, breaker] of this.breakers) {
      metrics[name] = breaker.getMetrics();
    }
    return metrics;
  }

  // Extract: resetAll() method for recovery
  // Extract: getOpenBreakers() for monitoring
}
```

### **Phase 2: Queen Controller Integration (Days 3-4)**

#### **2.1 Integration Points**
**Modify**: `.ai-workflow/intelligence-engine/queen-controller.js`

**Add to constructor**:
```javascript
// After existing initialization
this.circuitBreakers = new CircuitBreakerManager();
this.circuitBreakerConfig = {
  enabled: options.circuitBreaker !== false,
  agentFailureThreshold: options.agentFailureThreshold || 3,
  agentRecoveryTimeout: options.agentRecoveryTimeout || 30000,
  ...options.circuitBreaker
};
```

**Add to initializeUnlimitedScaling()**:
```javascript
// Initialize circuit breaker system
if (this.circuitBreakerConfig.enabled) {
  this.initializeCircuitBreakers();
}
```

#### **2.2 Enhanced Task Assignment**
**Modify existing assignTask() method**:
```javascript
async assignTask(taskId, agentId) {
  const task = this.tasks.get(taskId);
  const agent = this.subAgents.get(agentId);

  if (!task || !agent) {
    throw new Error('Task or agent not found');
  }

  // NEW: Circuit breaker protection
  if (this.circuitBreakerConfig.enabled) {
    let breaker = this.circuitBreakers.getBreaker(agentId);
    if (!breaker) {
      breaker = this.circuitBreakers.createBreaker(agentId, {
        failureThreshold: this.circuitBreakerConfig.agentFailureThreshold,
        timeout: this.circuitBreakerConfig.agentRecoveryTimeout
      });
    }

    // Execute with circuit breaker protection
    return await breaker.execute(async () => {
      return await this._executeTaskAssignment(task, agent);
    });
  }

  // Fallback to original logic
  return await this._executeTaskAssignment(task, agent);
}

async _executeTaskAssignment(task, agent) {
  // Original assignment logic moved here
  task.assignedTo = agent.id;
  task.status = 'running';
  task.startedAt = new Date();

  agent.status = 'busy';
  agent.currentTask = task;

  this.emit('task:assigned', { task, agent });
  this.executeTask(task, agent);
}
```

#### **2.3 Agent Failure Handling**
**Add new method**:
```javascript
async handleAgentFailure(agentId, error) {
  console.error(`Agent ${agentId} failure:`, error);

  // Record failure in circuit breaker
  if (this.circuitBreakerConfig.enabled) {
    const breaker = this.circuitBreakers.getBreaker(agentId);
    if (breaker) {
      breaker.onFailure();
    }
  }

  // Handle failed tasks
  const agent = this.subAgents.get(agentId);
  if (agent && agent.currentTask) {
    await this.handleTaskFailure(agent.currentTask.id, error);
  }

  // Reset agent state
  if (agent) {
    agent.status = 'failed';
    agent.currentTask = null;
    agent.lastFailure = new Date();
  }

  this.emit('agent:failed', { agentId, error });
}
```

### **Phase 3: Advanced Features (Days 5-7)**

#### **3.1 Background Monitoring**
**Add to Queen Controller**:
```javascript
startCircuitBreakerMonitoring() {
  if (!this.circuitBreakerConfig.enabled) return;

  // Monitor circuit breaker states
  const monitorWorker = setInterval(() => {
    this.checkCircuitBreakerHealth();
  }, 10000); // Check every 10 seconds

  this.backgroundWorkers.set('circuitBreakerMonitor', monitorWorker);
}

checkCircuitBreakerHealth() {
  const metrics = this.circuitBreakers.getAllMetrics();
  const openBreakers = [];

  for (const [agentId, breakerMetrics] of Object.entries(metrics)) {
    if (breakerMetrics.state === 'OPEN') {
      openBreakers.push({
        agentId,
        failures: breakerMetrics.failures,
        rejectionRate: breakerMetrics.rejectionRate
      });
    }
  }

  if (openBreakers.length > 0) {
    this.emit('circuit-breaker:alert', {
      openBreakers,
      totalBreakers: Object.keys(metrics).length,
      timestamp: new Date()
    });
  }
}
```

#### **3.2 Automatic Recovery**
**Add recovery mechanisms**:
```javascript
async attemptAgentRecovery(agentId) {
  const agent = this.subAgents.get(agentId);
  const breaker = this.circuitBreakers.getBreaker(agentId);

  if (!agent || !breaker) {
    return false;
  }

  // Check if agent is ready for recovery
  if (breaker.state === 'HALF_OPEN') {
    try {
      // Test with a simple health check task
      await this._executeHealthCheck(agentId);
      
      // If successful, circuit breaker will handle state transition
      console.log(`Agent ${agentId} recovery successful`);
      return true;
    } catch (error) {
      console.log(`Agent ${agentId} recovery failed:`, error.message);
      return false;
    }
  }

  return false;
}

async _executeHealthCheck(agentId) {
  // Simple health check - can be extended
  const healthTask = {
    id: `health-${Date.now()}`,
    type: 'health-check',
    description: 'Agent health check',
    priority: 1
  };

  return await this.assignTask(healthTask.id, agentId);
}
```

---

## 📁 **File Structure**

### **New Files to Create**
```
src/coordination/
├── circuit-breaker.js         # Core circuit breaker implementation
├── circuit-breaker-manager.js # Multi-breaker management
├── fault-tolerance.js         # Advanced fault tolerance features
└── recovery-manager.js        # Automatic recovery mechanisms

tests/coordination/
├── circuit-breaker.test.js    # Unit tests
├── fault-tolerance.test.js    # Integration tests
└── recovery.test.js           # Recovery mechanism tests
```

### **Files to Modify**
```
.ai-workflow/intelligence-engine/
└── queen-controller.js        # Integration points

src/claude-flow/orchestrator/
└── flow-orchestrator.js       # Optional: add circuit breaker
```

---

## 🧪 **Testing Strategy**

### **Unit Tests**
**File**: `tests/coordination/circuit-breaker.test.js`

```javascript
describe('CircuitBreaker', () => {
  let circuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker('test-breaker', {
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 1000,
      halfOpenLimit: 1
    });
  });

  test('should start in CLOSED state', () => {
    expect(circuitBreaker.state).toBe('CLOSED');
  });

  test('should open after failure threshold', async () => {
    // Simulate failures
    for (let i = 0; i < 3; i++) {
      try {
        await circuitBreaker.execute(() => Promise.reject(new Error('Test failure')));
      } catch (error) {
        // Expected failures
      }
    }

    expect(circuitBreaker.state).toBe('OPEN');
  });

  test('should reject requests when OPEN', async () => {
    // Trigger open state
    circuitBreaker.transitionTo('OPEN');

    await expect(circuitBreaker.execute(() => Promise.resolve('success')))
      .rejects.toThrow('Circuit breaker \'test-breaker\' is OPEN');
  });

  test('should close after success threshold', async () => {
    // Open circuit
    circuitBreaker.transitionTo('OPEN');
    circuitBreaker.nextAttempt = new Date(Date.now() - 1000);

    // Successful executions in half-open
    for (let i = 0; i < 2; i++) {
      await circuitBreaker.execute(() => Promise.resolve('success'));
    }

    expect(circuitBreaker.state).toBe('CLOSED');
  });
});
```

### **Integration Tests**
**File**: `tests/coordination/fault-tolerance.test.js`

```javascript
describe('Fault Tolerance Integration', () => {
  let queenController;

  beforeEach(async () => {
    queenController = new QueenController({
      circuitBreaker: {
        enabled: true,
        agentFailureThreshold: 2,
        agentRecoveryTimeout: 5000
      }
    });
    await queenController.initialize();
  });

  test('should open circuit breaker after agent failures', async () => {
    const agentId = await queenController.registerAgent('test-agent', 'worker');

    // Simulate agent failures
    await queenController.handleAgentFailure(agentId, new Error('Failure 1'));
    await queenController.handleAgentFailure(agentId, new Error('Failure 2'));

    const breaker = queenController.circuitBreakers.getBreaker(agentId);
    expect(breaker.state).toBe('OPEN');
  });

  test('should reject tasks for failed agents', async () => {
    const agentId = await queenController.registerAgent('test-agent', 'worker');

    // Trigger circuit breaker
    const breaker = queenController.circuitBreakers.getBreaker(agentId);
    breaker.transitionTo('OPEN');

    // Attempt to assign task
    await expect(queenController.assignTask('task1', agentId))
      .rejects.toThrow('Circuit breaker');
  });
});
```

---

## ⚙️ **Configuration**

### **Default Configuration**
```javascript
// config/circuit-breaker.js
module.exports = {
  circuitBreaker: {
    enabled: true,
    agentFailureThreshold: 5,      // Failures before opening
    agentSuccessThreshold: 3,      // Successes before closing
    agentRecoveryTimeout: 60000,    // Wait time before retry
    halfOpenMaxRequests: 2,         // Max requests in half-open
    monitoringInterval: 10000,      // Health check interval
    autoRecoveryEnabled: true       // Automatic recovery attempts
  }
};
```

### **Environment Variables**
```bash
# .env
CIRCUIT_BREAKER_ENABLED=true
CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
CIRCUIT_BREAKER_RECOVERY_TIMEOUT=60000
CIRCUIT_BREAKER_MONITORING_INTERVAL=10000
```

---

## 📊 **Performance Metrics**

### **Key Metrics to Track**
1. **Circuit Breaker States**: Number of OPEN/CLOSED/HALF_OPEN breakers
2. **Failure Rates**: Per-agent failure percentages
3. **Recovery Times**: Time from OPEN to CLOSED state
4. **Rejection Rates**: Percentage of requests rejected
5. **Recovery Success Rate**: Percentage of successful recoveries

### **Monitoring Implementation**
```javascript
getCircuitBreakerMetrics() {
  return {
    totalBreakers: this.circuitBreakers.breakers.size,
    stateDistribution: this._getStateDistribution(),
    averageFailureRate: this._getAverageFailureRate(),
    recoveryMetrics: this._getRecoveryMetrics(),
    openBreakers: this._getOpenBreakers(),
    timestamp: new Date()
  };
}

_getStateDistribution() {
  const states = { CLOSED: 0, OPEN: 0, HALF_OPEN: 0 };
  
  for (const breaker of this.circuitBreakers.breakers.values()) {
    states[breaker.state]++;
  }
  
  return states;
}
```

---

## 🚀 **Deployment Steps**

### **Step 1: Preparation**
1. Backup existing Queen Controller
2. Create feature branch for circuit breaker integration
3. Set up monitoring for circuit breaker metrics

### **Step 2: Implementation**
1. Create circuit-breaker.js module
2. Create circuit-breaker-manager.js
3. Add integration points to Queen Controller
4. Implement background monitoring

### **Step 3: Testing**
1. Run unit tests for circuit breaker logic
2. Execute fault injection tests
3. Perform recovery testing
4. Validate performance under failure conditions

### **Step 4: Deployment**
1. Deploy to staging environment
2. Enable circuit breaker with conservative thresholds
3. Monitor failure rates and recovery times
4. Gradual rollout with threshold tuning

---

## 🎯 **Success Criteria**

### **Functional Requirements**
- ✅ Circuit breaker opens after configured failure threshold
- ✅ Requests are rejected when circuit is OPEN
- ✅ Circuit transitions to HALF_OPEN after timeout
- ✅ Circuit closes after success threshold in HALF_OPEN
- ✅ Automatic recovery mechanisms function correctly

### **Performance Requirements**
- ✅ <1ms overhead for circuit breaker checks
- ✅ <100ms failure detection time
- ✅ <5 second recovery time for transient failures
- ✅ Zero impact on non-failed agent performance

### **Reliability Requirements**
- ✅ 99.9% uptime during failure conditions
- ✅ No cascading failures across agents
- ✅ Graceful degradation under high failure rates
- ✅ Complete recovery after transient issues

---

## 🔧 **Troubleshooting**

### **Common Issues**
1. **Circuit breaker not opening**
   - Check failure threshold configuration
   - Verify failure reporting is working
   - Ensure circuit breaker is enabled

2. **Circuit breaker stuck in OPEN state**
   - Check timeout configuration
   - Verify success threshold is reachable
   - Review recovery logic

3. **High rejection rates**
   - Adjust failure thresholds
   - Review agent health monitoring
   - Check for systemic issues

### **Debug Tools**
```javascript
// Debug circuit breaker state
debugCircuitBreaker(agentId) {
  const breaker = this.circuitBreakers.getBreaker(agentId);
  return breaker ? breaker.getMetrics() : null;
}

// Force circuit breaker state (for testing)
forceCircuitBreakerState(agentId, state) {
  const breaker = this.circuitBreakers.getBreaker(agentId);
  if (breaker) {
    breaker.transitionTo(state);
  }
}
```

---

## 📝 **Documentation Updates**

### **API Documentation**
- Add CircuitBreaker class docs
- Document configuration options
- Update Queen Controller API with circuit breaker methods

### **User Guide**
- Explain circuit breaker benefits
- Provide configuration examples
- Add troubleshooting section

### **Technical Documentation**
- Fault tolerance architecture diagrams
- Circuit breaker state flow charts
- Performance impact analysis