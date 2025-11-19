/**
 * Task Planner
 * Breaks down complex tasks into actionable steps
 */

export class TaskPlanner {
  constructor(config = {}) {
    this.config = config;
    this.planCache = new Map();
  }

  /**
   * Create a plan for a task
   */
  async plan(taskConfig) {
    const { task, context, constraints } = taskConfig;

    // Generate a unique ID for this plan
    const planId = this._generatePlanId(task);

    // Check cache
    if (this.planCache.has(planId)) {
      return { ...this.planCache.get(planId), fromCache: true };
    }

    // Analyze the task
    const analysis = this._analyzeTask(task, context);

    // Break down into steps
    const steps = this._breakdownTask(analysis, constraints);

    // Add dependencies
    const stepsWithDeps = this._addDependencies(steps);

    // Estimate effort
    const estimatedDuration = this._estimateDuration(stepsWithDeps);

    const plan = {
      id: planId,
      task,
      steps: stepsWithDeps,
      estimatedDuration,
      createdAt: Date.now(),
      metadata: {
        stepCount: steps.length,
        complexity: analysis.complexity,
        confidence: analysis.confidence
      }
    };

    // Cache the plan
    this.planCache.set(planId, plan);

    return plan;
  }

  /**
   * Replan when something changes
   */
  async replan(options) {
    const { originalPlan, currentResults, issue } = options;

    // Analyze what went wrong
    const failureAnalysis = this._analyzeFailure(currentResults, issue);

    // Determine which steps to keep
    const completedSteps = currentResults.map(r => r.step);
    const remainingSteps = originalPlan.steps.filter(
      step => !completedSteps.find(cs => cs.id === step.id)
    );

    // Generate new steps to address the issue
    const recoverySteps = this._generateRecoverySteps(failureAnalysis);

    // Merge and reorder
    const newSteps = [...recoverySteps, ...remainingSteps];

    return {
      ...originalPlan,
      id: `${originalPlan.id}_replan_${Date.now()}`,
      steps: newSteps,
      replannedAt: Date.now(),
      reason: issue
    };
  }

  /**
   * Recover from a failure
   */
  async recover(options) {
    const { failedStep, error, previousResults } = options;

    // Determine recovery strategy
    const strategy = this._determineRecoveryStrategy(failedStep, error);

    let recoverySteps = [];

    switch (strategy) {
      case 'retry':
        recoverySteps = [
          {
            ...failedStep,
            id: `${failedStep.id}_retry`,
            retry: true,
            retryCount: (failedStep.retryCount || 0) + 1
          }
        ];
        break;

      case 'alternative':
        recoverySteps = this._generateAlternativeSteps(failedStep, error);
        break;

      case 'skip':
        recoverySteps = this._generateSkipSteps(failedStep);
        break;

      default:
        throw new Error(`Unknown recovery strategy: ${strategy}`);
    }

    return {
      id: `recovery_${Date.now()}`,
      steps: recoverySteps,
      strategy,
      recoveredAt: Date.now()
    };
  }

  /**
   * Analyze a task to understand it
   */
  _analyzeTask(task, context) {
    const taskStr = typeof task === 'string' ? task : JSON.stringify(task);

    // Determine complexity based on keywords and length
    let complexity = 'simple';
    const complexKeywords = ['refactor', 'migrate', 'architecture', 'system', 'multiple', 'integrate'];
    const mediumKeywords = ['add', 'update', 'modify', 'implement', 'create'];

    if (complexKeywords.some(kw => taskStr.toLowerCase().includes(kw))) {
      complexity = 'complex';
    } else if (mediumKeywords.some(kw => taskStr.toLowerCase().includes(kw))) {
      complexity = 'medium';
    }

    // Determine task type
    let type = 'general';
    if (taskStr.match(/test|spec|unit|integration/i)) type = 'testing';
    else if (taskStr.match(/fix|bug|error/i)) type = 'bugfix';
    else if (taskStr.match(/add|new|create|implement/i)) type = 'feature';
    else if (taskStr.match(/refactor|clean|improve/i)) type = 'refactoring';

    return {
      complexity,
      type,
      confidence: 0.8, // Could be improved with ML
      requiresContext: Object.keys(context || {}).length > 0
    };
  }

  /**
   * Break down a task into steps
   */
  _breakdownTask(analysis, constraints = {}) {
    const steps = [];
    const { complexity, type } = analysis;

    // Generate steps based on task type and complexity
    if (type === 'feature') {
      steps.push(
        { id: 'step_1', action: 'analyze_requirements', description: 'Analyze feature requirements' },
        { id: 'step_2', action: 'design_solution', description: 'Design the solution architecture' },
        { id: 'step_3', action: 'implement_core', description: 'Implement core functionality' }
      );

      if (complexity !== 'simple') {
        steps.push(
          { id: 'step_4', action: 'add_tests', description: 'Add tests for the feature' },
          { id: 'step_5', action: 'integrate', description: 'Integrate with existing code' }
        );
      }

      steps.push(
        { id: 'step_6', action: 'verify', description: 'Verify the implementation' }
      );
    } else if (type === 'bugfix') {
      steps.push(
        { id: 'step_1', action: 'reproduce', description: 'Reproduce the bug' },
        { id: 'step_2', action: 'identify_cause', description: 'Identify root cause' },
        { id: 'step_3', action: 'fix', description: 'Fix the bug' },
        { id: 'step_4', action: 'test', description: 'Test the fix' },
        { id: 'step_5', action: 'verify', description: 'Verify no regression' }
      );
    } else if (type === 'refactoring') {
      steps.push(
        { id: 'step_1', action: 'analyze_code', description: 'Analyze existing code' },
        { id: 'step_2', action: 'plan_refactor', description: 'Plan refactoring approach' },
        { id: 'step_3', action: 'refactor', description: 'Perform refactoring' },
        { id: 'step_4', action: 'test', description: 'Run tests to ensure correctness' }
      );
    } else {
      // General task - create basic steps
      steps.push(
        { id: 'step_1', action: 'understand', description: 'Understand the task' },
        { id: 'step_2', action: 'execute', description: 'Execute the task' },
        { id: 'step_3', action: 'verify', description: 'Verify completion' }
      );
    }

    return steps;
  }

  /**
   * Add dependencies between steps
   */
  _addDependencies(steps) {
    return steps.map((step, index) => ({
      ...step,
      dependencies: index > 0 ? [steps[index - 1].id] : [],
      allowParallel: false // Could be improved to detect parallelizable steps
    }));
  }

  /**
   * Estimate duration for steps
   */
  _estimateDuration(steps) {
    // Simple estimation - could be improved with historical data
    const baseTime = 30; // seconds per step
    return steps.length * baseTime * 1000; // milliseconds
  }

  /**
   * Generate a plan ID
   */
  _generatePlanId(task) {
    const str = typeof task === 'string' ? task : JSON.stringify(task);
    return `plan_${Date.now()}_${str.substring(0, 20).replace(/\s/g, '_')}`;
  }

  /**
   * Analyze why something failed
   */
  _analyzeFailure(results, issue) {
    const failedResults = results.filter(r => !r.result?.success);

    return {
      failedCount: failedResults.length,
      totalCount: results.length,
      issue: issue || 'Unknown',
      lastError: failedResults[failedResults.length - 1]?.result?.error
    };
  }

  /**
   * Generate recovery steps
   */
  _generateRecoverySteps(analysis) {
    return [
      {
        id: `recovery_analyze_${Date.now()}`,
        action: 'analyze_failure',
        description: 'Analyze the failure',
        metadata: analysis
      },
      {
        id: `recovery_fix_${Date.now()}`,
        action: 'apply_fix',
        description: 'Apply a fix for the issue'
      }
    ];
  }

  /**
   * Determine recovery strategy
   */
  _determineRecoveryStrategy(failedStep, error) {
    const errorStr = error?.message || error?.toString() || '';

    // Network or timeout errors - retry
    if (errorStr.match(/timeout|network|econnrefused/i)) {
      return 'retry';
    }

    // File not found - alternative approach
    if (errorStr.match(/not found|enoent/i)) {
      return 'alternative';
    }

    // Permission errors - might need to skip
    if (errorStr.match(/permission|eacces/i)) {
      return 'skip';
    }

    // Default to retry for first attempt
    if (!failedStep.retryCount || failedStep.retryCount < 2) {
      return 'retry';
    }

    // Otherwise try alternative
    return 'alternative';
  }

  /**
   * Generate alternative steps
   */
  _generateAlternativeSteps(failedStep, error) {
    return [
      {
        id: `${failedStep.id}_alt_1`,
        action: failedStep.action,
        description: `Alternative approach: ${failedStep.description}`,
        alternative: true,
        originalStep: failedStep.id
      }
    ];
  }

  /**
   * Generate skip steps
   */
  _generateSkipSteps(failedStep) {
    return [
      {
        id: `${failedStep.id}_skip`,
        action: 'skip',
        description: `Skip: ${failedStep.description}`,
        skipped: true,
        originalStep: failedStep.id
      }
    ];
  }
}

export default TaskPlanner;
