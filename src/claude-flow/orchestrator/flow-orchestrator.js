/**
 * Claude Flow Orchestrator
 * Orchestrates multi-agent workflows with dependencies and conditions
 */

import { EventEmitter } from 'events';
import { AgentOS } from '../../agent-os/core/agent-runtime.js';

export class FlowOrchestrator extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      maxConcurrency: config.maxConcurrency || 3,
      verbose: config.verbose || false,
      ...config
    };

    this.agents = new Map();
    this.activeFlows = new Map();
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(workflow) {
    const flowId = this._generateFlowId(workflow);

    const flowState = {
      id: flowId,
      workflow,
      status: 'running',
      startTime: Date.now(),
      agentResults: new Map(),
      currentPhase: 0
    };

    this.activeFlows.set(flowId, flowState);
    this.emit('flow:start', { flowId, workflow });

    try {
      // Parse workflow definition
      const phases = this._parseWorkflow(workflow);

      // Execute phases
      for (let i = 0; i < phases.length; i++) {
        flowState.currentPhase = i;
        const phase = phases[i];

        this._log(`Executing phase ${i + 1}/${phases.length}`, phase);
        this.emit('phase:start', { flowId, phase, index: i });

        const phaseResults = await this._executePhase(phase, flowState);

        // Store results
        for (const [agentId, result] of Object.entries(phaseResults)) {
          flowState.agentResults.set(agentId, result);
        }

        this.emit('phase:complete', { flowId, phase, results: phaseResults });

        // Check if we should continue
        if (phase.condition && !this._evaluateCondition(phase.condition, flowState)) {
          this._log('Condition not met, stopping workflow');
          break;
        }
      }

      // Success
      flowState.status = 'completed';
      flowState.duration = Date.now() - flowState.startTime;

      this.emit('flow:complete', { flowId, results: Object.fromEntries(flowState.agentResults) });

      return {
        success: true,
        flowId,
        results: Object.fromEntries(flowState.agentResults),
        duration: flowState.duration
      };

    } catch (error) {
      flowState.status = 'error';
      flowState.error = error.message;

      this.emit('flow:error', { flowId, error });

      return {
        success: false,
        flowId,
        error: error.message,
        results: Object.fromEntries(flowState.agentResults)
      };
    } finally {
      this.activeFlows.delete(flowId);
    }
  }

  /**
   * Parse workflow definition into phases
   */
  _parseWorkflow(workflow) {
    const { agents, phases } = workflow;

    // If workflow has explicit phases, use them
    if (phases && Array.isArray(phases)) {
      return phases;
    }

    // Otherwise, create sequential phases from agents
    if (agents && Array.isArray(agents)) {
      return agents.map((agent, index) => ({
        name: `phase_${index + 1}`,
        agents: [agent],
        parallel: false
      }));
    }

    throw new Error('Workflow must define either phases or agents');
  }

  /**
   * Execute a phase of the workflow
   */
  async _executePhase(phase, flowState) {
    const { agents, parallel } = phase;
    const results = {};

    if (parallel) {
      // Execute all agents in parallel
      const promises = agents.map(agent =>
        this._executeAgent(agent, flowState).then(result => ({ agent, result }))
      );

      const agentResults = await Promise.all(promises);

      for (const { agent, result } of agentResults) {
        const agentId = agent.id || agent.type || `agent_${Date.now()}`;
        results[agentId] = result;
      }
    } else {
      // Execute agents sequentially
      for (const agent of agents) {
        const agentId = agent.id || agent.type || `agent_${Date.now()}`;
        results[agentId] = await this._executeAgent(agent, flowState);
      }
    }

    return results;
  }

  /**
   * Execute a single agent
   */
  async _executeAgent(agentConfig, flowState) {
    const agentId = agentConfig.id || `agent_${Date.now()}`;

    this._log(`Executing agent: ${agentId}`, agentConfig);
    this.emit('agent:start', { agentId, config: agentConfig });

    try {
      // Get or create agent
      let agent = this.agents.get(agentId);

      if (!agent) {
        agent = new AgentOS({
          type: agentConfig.type || 'general',
          memory: agentConfig.memory !== false,
          planning: agentConfig.planning !== false,
          verbose: this.config.verbose
        });
        this.agents.set(agentId, agent);
      }

      // Build context from previous results
      const context = this._buildContext(agentConfig, flowState);

      // Execute the agent task
      const result = await agent.execute({
        task: agentConfig.task,
        context,
        constraints: agentConfig.constraints
      });

      this.emit('agent:complete', { agentId, result });

      return result;

    } catch (error) {
      this.emit('agent:error', { agentId, error });
      throw error;
    }
  }

  /**
   * Build context for an agent from previous results
   */
  _buildContext(agentConfig, flowState) {
    const context = { ...agentConfig.context };

    // If agent specifies dependencies, include their results
    if (agentConfig.dependsOn) {
      const dependencies = Array.isArray(agentConfig.dependsOn)
        ? agentConfig.dependsOn
        : [agentConfig.dependsOn];

      for (const depId of dependencies) {
        const depResult = flowState.agentResults.get(depId);
        if (depResult) {
          context[depId] = depResult;
        }
      }
    }

    return context;
  }

  /**
   * Evaluate a condition
   */
  _evaluateCondition(condition, flowState) {
    // Simple condition evaluation
    // Could be expanded to support complex expressions

    if (typeof condition === 'function') {
      return condition(flowState);
    }

    if (typeof condition === 'object') {
      const { agent, field, operator, value } = condition;
      const agentResult = flowState.agentResults.get(agent);

      if (!agentResult) return false;

      const actualValue = field ? agentResult[field] : agentResult;

      switch (operator) {
        case '==': return actualValue == value;
        case '===': return actualValue === value;
        case '!=': return actualValue != value;
        case '>': return actualValue > value;
        case '<': return actualValue < value;
        case '>=': return actualValue >= value;
        case '<=': return actualValue <= value;
        default: return false;
      }
    }

    return Boolean(condition);
  }

  /**
   * Get active flows
   */
  getActiveFlows() {
    return Array.from(this.activeFlows.values()).map(flow => ({
      id: flow.id,
      status: flow.status,
      currentPhase: flow.currentPhase,
      uptime: Date.now() - flow.startTime
    }));
  }

  /**
   * Shutdown all agents
   */
  async shutdown() {
    this._log('Shutting down orchestrator');

    const shutdownPromises = [];
    for (const agent of this.agents.values()) {
      shutdownPromises.push(agent.shutdown());
    }

    await Promise.all(shutdownPromises);
    this.agents.clear();
    this.activeFlows.clear();
    this.removeAllListeners();
  }

  /**
   * Generate a flow ID
   */
  _generateFlowId(workflow) {
    const name = workflow.name || 'unnamed';
    return `flow_${name}_${Date.now()}`;
  }

  /**
   * Internal logging
   */
  _log(message, data = {}) {
    if (this.config.verbose) {
      console.log(`[FlowOrchestrator] ${message}`, data);
    }
    this.emit('log', { message, data, timestamp: Date.now() });
  }
}

export default FlowOrchestrator;
