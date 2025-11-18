/**
 * Agent OS - Core Runtime
 * The foundation for AI agent execution with memory, planning, and tool use
 */

import { EventEmitter } from 'events';
import { MemoryManager } from '../memory/memory-manager.js';
import { TaskPlanner } from '../planning/task-planner.js';
import { ExecutionEngine } from '../execution/execution-engine.js';

export class AgentOS extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      type: config.type || 'general',
      memory: config.memory !== false,
      planning: config.planning !== false,
      verbose: config.verbose || false,
      maxIterations: config.maxIterations || 50,
      ...config
    };

    // Initialize subsystems
    this.memory = this.config.memory ? new MemoryManager(this.config) : null;
    this.planner = this.config.planning ? new TaskPlanner(this.config) : null;
    this.executor = new ExecutionEngine(this.config);

    // Agent state
    this.state = {
      status: 'idle', // idle, planning, executing, completed, error
      currentTask: null,
      iteration: 0,
      startTime: null,
      results: []
    };

    this._log('Agent OS initialized', { type: this.config.type });
  }

  /**
   * Execute a task with full agent capabilities
   */
  async execute(taskConfig) {
    this.state.status = 'planning';
    this.state.currentTask = taskConfig;
    this.state.startTime = Date.now();
    this.state.iteration = 0;

    this.emit('task:start', taskConfig);
    this._log('Task execution started', taskConfig);

    try {
      // Step 1: Load context from memory
      let context = {};
      if (this.memory) {
        context = await this.memory.recall({
          task: taskConfig.task,
          context: taskConfig.context
        });
        this._log('Memory recalled', { contextSize: JSON.stringify(context).length });
      }

      // Step 2: Plan the task
      let plan = null;
      if (this.planner) {
        plan = await this.planner.plan({
          task: taskConfig.task,
          context: { ...context, ...taskConfig.context },
          constraints: taskConfig.constraints
        });
        this._log('Plan created', { steps: plan.steps.length });
        this.emit('plan:created', plan);
      }

      // Step 3: Execute the plan
      this.state.status = 'executing';
      const results = await this._executePlan(plan || { steps: [taskConfig] });

      // Step 4: Store results in memory
      if (this.memory) {
        await this.memory.store({
          task: taskConfig.task,
          plan,
          results,
          timestamp: Date.now()
        });
      }

      // Success
      this.state.status = 'completed';
      this.state.results = results;

      const duration = Date.now() - this.state.startTime;
      this._log('Task completed', { duration, resultsCount: results.length });
      this.emit('task:complete', { results, duration });

      return {
        success: true,
        results,
        duration,
        iterations: this.state.iteration
      };

    } catch (error) {
      this.state.status = 'error';
      this._log('Task failed', { error: error.message });
      this.emit('task:error', error);

      return {
        success: false,
        error: error.message,
        duration: Date.now() - this.state.startTime
      };
    }
  }

  /**
   * Execute a plan with iterative refinement
   */
  async _executePlan(plan) {
    const results = [];

    for (const step of plan.steps) {
      if (this.state.iteration >= this.config.maxIterations) {
        throw new Error('Max iterations exceeded');
      }

      this.state.iteration++;
      this.emit('step:start', step);
      this._log(`Executing step ${this.state.iteration}`, step);

      try {
        const result = await this.executor.execute(step);
        results.push({
          step,
          result,
          iteration: this.state.iteration,
          timestamp: Date.now()
        });

        this.emit('step:complete', { step, result });

        // Check if we need to replan based on results
        if (result.needsReplanning && this.planner) {
          this._log('Replanning required');
          const newPlan = await this.planner.replan({
            originalPlan: plan,
            currentResults: results,
            issue: result.issue
          });
          plan.steps = newPlan.steps;
        }

      } catch (error) {
        this._log('Step failed', { error: error.message });

        // Attempt recovery
        if (this.planner && step.allowRecovery !== false) {
          this._log('Attempting recovery');
          const recoveryPlan = await this.planner.recover({
            failedStep: step,
            error,
            previousResults: results
          });
          plan.steps = recoveryPlan.steps;
        } else {
          throw error;
        }
      }
    }

    return results;
  }

  /**
   * Get agent status
   */
  getStatus() {
    return {
      ...this.state,
      uptime: this.state.startTime ? Date.now() - this.state.startTime : 0
    };
  }

  /**
   * Reset agent state
   */
  reset() {
    this.state = {
      status: 'idle',
      currentTask: null,
      iteration: 0,
      startTime: null,
      results: []
    };
    this.emit('agent:reset');
  }

  /**
   * Shutdown agent
   */
  async shutdown() {
    this._log('Shutting down');

    if (this.memory) {
      await this.memory.flush();
    }

    this.emit('agent:shutdown');
    this.removeAllListeners();
  }

  /**
   * Internal logging
   */
  _log(message, data = {}) {
    if (this.config.verbose) {
      console.log(`[AgentOS:${this.config.type}] ${message}`, data);
    }
    this.emit('log', { message, data, timestamp: Date.now() });
  }
}

export default AgentOS;
