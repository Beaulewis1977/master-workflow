#!/usr/bin/env node

/**
 * Smart Tool Selector
 * Intelligently selects the best tool for each task
 * Adapts based on availability and task requirements
 */

const fs = require('fs');
const path = require('path');
const IntegrationChecker = require('./integration-checker');

class SmartToolSelector {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.integrations = null;
    this.taskPatterns = this.loadTaskPatterns();
  }

  /**
   * Initialize by checking available integrations
   */
  async initialize() {
    const checker = new IntegrationChecker(this.projectPath);
    const results = await checker.checkAll();
    this.integrations = results.integrations;
    return this;
  }

  /**
   * Select best tool for a given task
   */
  async selectTool(task, context = {}) {
    // Ensure we're initialized
    if (!this.integrations) {
      await this.initialize();
    }

    // Analyze task requirements
    const requirements = this.analyzeTask(task);
    
    // Score each available tool
    const scores = this.scoreTools(requirements, context);
    
    // Select best tool with fallback options
    const selection = this.chooseBestTool(scores, requirements);
    
    return {
      primary: selection.primary,
      fallback: selection.fallback,
      command: this.generateCommand(selection.primary, task, context),
      reasoning: selection.reasoning,
      requirements
    };
  }

  /**
   * Analyze task to determine requirements
   */
  analyzeTask(task) {
    const requirements = {
      complexity: 'low',
      coordination: false,
      memory: false,
      realtime: false,
      planning: false,
      testing: false,
      deployment: false,
      aiAssisted: true,
      multiFile: false,
      systemLevel: false
    };

    const taskLower = task.toLowerCase();

    // Complexity detection
    if (taskLower.includes('enterprise') || 
        taskLower.includes('architecture') || 
        taskLower.includes('system design')) {
      requirements.complexity = 'high';
      requirements.planning = true;
    } else if (taskLower.includes('feature') || 
               taskLower.includes('api') || 
               taskLower.includes('integration')) {
      requirements.complexity = 'medium';
    }

    // Coordination needs
    if (taskLower.includes('multi') || 
        taskLower.includes('coordinate') || 
        taskLower.includes('orchestrate')) {
      requirements.coordination = true;
    }

    // Memory requirements
    if (taskLower.includes('context') || 
        taskLower.includes('remember') || 
        taskLower.includes('previous')) {
      requirements.memory = true;
    }

    // Real-time needs
    if (taskLower.includes('real-time') || 
        taskLower.includes('websocket') || 
        taskLower.includes('live')) {
      requirements.realtime = true;
    }

    // Testing requirements
    if (taskLower.includes('test') || 
        taskLower.includes('spec') || 
        taskLower.includes('coverage')) {
      requirements.testing = true;
    }

    // Deployment needs
    if (taskLower.includes('deploy') || 
        taskLower.includes('release') || 
        taskLower.includes('production')) {
      requirements.deployment = true;
    }

    // Multi-file operations
    if (taskLower.includes('refactor') || 
        taskLower.includes('across') || 
        taskLower.includes('multiple files')) {
      requirements.multiFile = true;
    }

    // System-level operations
    if (taskLower.includes('install') || 
        taskLower.includes('configure') || 
        taskLower.includes('setup')) {
      requirements.systemLevel = true;
    }

    return requirements;
  }

  /**
   * Score available tools based on requirements
   */
  scoreTools(requirements, context) {
    const scores = {};

    // Claude Code scoring
    if (this.integrations.claudeCode) {
      scores.claudeCode = this.scoreClaudeCode(requirements, context);
    }

    // Agent-OS scoring
    if (this.integrations.agentOS) {
      scores.agentOS = this.scoreAgentOS(requirements, context);
    }

    // Claude Flow scoring
    if (this.integrations.claudeFlow) {
      scores.claudeFlow = this.scoreClaudeFlow(requirements, context);
    }

    // TMux Orchestrator scoring
    if (this.integrations.tmux) {
      scores.tmux = this.scoreTMux(requirements, context);
    }

    // Fallback: Basic workflow
    scores.basicWorkflow = this.scoreBasicWorkflow(requirements, context);

    return scores;
  }

  /**
   * Score Claude Code for task
   */
  scoreClaudeCode(requirements, context) {
    let score = 0;

    // Claude Code excels at:
    if (requirements.aiAssisted) score += 30;
    if (requirements.complexity === 'low') score += 20;
    if (requirements.complexity === 'medium') score += 15;
    if (!requirements.coordination) score += 10;
    if (requirements.multiFile) score += 15;
    if (requirements.testing) score += 10;

    // Less suitable for:
    if (requirements.complexity === 'high') score -= 10;
    if (requirements.coordination) score -= 15;
    if (requirements.systemLevel) score -= 10;

    // Context bonuses
    if (context.userPreference === 'claude-code') score += 20;
    if (context.previousSuccess === 'claude-code') score += 10;

    return {
      score,
      tool: 'claude-code',
      strengths: ['AI assistance', 'code generation', 'multi-file edits'],
      weaknesses: ['complex coordination', 'system operations']
    };
  }

  /**
   * Score Agent-OS for task
   */
  scoreAgentOS(requirements, context) {
    let score = 0;

    // Agent-OS excels at:
    if (requirements.coordination) score += 25;
    if (requirements.planning) score += 20;
    if (requirements.complexity === 'high') score += 20;
    if (requirements.systemLevel) score += 15;
    if (requirements.deployment) score += 15;

    // Less suitable for:
    if (requirements.complexity === 'low') score -= 10;
    if (!requirements.coordination) score -= 5;

    // Context bonuses
    if (context.userPreference === 'agent-os') score += 20;
    if (context.projectType === 'enterprise') score += 15;

    return {
      score,
      tool: 'agent-os',
      strengths: ['orchestration', 'planning', 'system operations'],
      weaknesses: ['simple tasks', 'quick fixes']
    };
  }

  /**
   * Score Claude Flow for task
   */
  scoreClaudeFlow(requirements, context) {
    let score = 0;

    // Claude Flow excels at:
    if (requirements.coordination) score += 30;
    if (requirements.memory) score += 25;
    if (requirements.complexity === 'medium') score += 20;
    if (requirements.complexity === 'high') score += 25;
    if (requirements.realtime) score += 15;
    if (requirements.planning) score += 20;

    // Specialized approaches
    if (requirements.complexity === 'high' && requirements.planning) {
      score += 20; // SPARC methodology
    }

    // Less suitable for:
    if (requirements.complexity === 'low') score -= 15;
    if (!requirements.coordination && !requirements.memory) score -= 10;

    // Context bonuses
    if (context.userPreference === 'claude-flow') score += 20;
    if (context.agentCount > 1) score += 15;

    return {
      score,
      tool: 'claude-flow',
      strengths: ['multi-agent coordination', 'memory', 'complex workflows'],
      weaknesses: ['simple tasks', 'overhead for small projects'],
      approach: this.selectClaudeFlowApproach(requirements)
    };
  }

  /**
   * Score TMux Orchestrator for task
   */
  scoreTMux(requirements, context) {
    let score = 0;

    // TMux excels at:
    if (requirements.realtime) score += 20;
    if (requirements.coordination) score += 15;
    if (requirements.systemLevel) score += 20;
    if (context.longRunning) score += 25;

    // Less suitable for:
    if (!requirements.coordination) score -= 10;
    if (requirements.complexity === 'low') score -= 15;

    // Context bonuses
    if (context.userPreference === 'tmux') score += 20;
    if (context.sessionManagement) score += 15;

    return {
      score,
      tool: 'tmux',
      strengths: ['session management', 'long-running tasks', 'parallel execution'],
      weaknesses: ['simple tasks', 'overhead for quick operations']
    };
  }

  /**
   * Score basic workflow for task
   */
  scoreBasicWorkflow(requirements, context) {
    let score = 10; // Base score as fallback

    // Basic workflow is good for:
    if (requirements.complexity === 'low') score += 20;
    if (!requirements.coordination) score += 15;
    if (!requirements.memory) score += 10;

    // Less suitable for:
    if (requirements.complexity === 'high') score -= 20;
    if (requirements.coordination) score -= 15;
    if (requirements.planning) score -= 15;

    return {
      score,
      tool: 'basic-workflow',
      strengths: ['simplicity', 'quick execution', 'no dependencies'],
      weaknesses: ['complex tasks', 'coordination', 'memory']
    };
  }

  /**
   * Select Claude Flow approach based on requirements
   */
  selectClaudeFlowApproach(requirements) {
    if (requirements.complexity === 'high' && requirements.planning) {
      return 'hive-mind-sparc';
    } else if (requirements.complexity === 'medium' || requirements.coordination) {
      return 'hive-mind';
    } else {
      return 'simple-swarm';
    }
  }

  /**
   * Choose best tool from scores
   */
  chooseBestTool(scores, requirements) {
    // Sort tools by score
    const sorted = Object.entries(scores)
      .sort((a, b) => b[1].score - a[1].score);

    const primary = sorted[0][1];
    const fallback = sorted[1] ? sorted[1][1] : null;

    // Generate reasoning
    const reasoning = this.generateReasoning(primary, fallback, requirements);

    return {
      primary,
      fallback,
      reasoning
    };
  }

  /**
   * Generate reasoning for tool selection
   */
  generateReasoning(primary, fallback, requirements) {
    let reasoning = `Selected ${primary.tool} because it excels at ${primary.strengths.join(', ')}.`;

    if (requirements.complexity === 'high') {
      reasoning += ' The task complexity requires advanced coordination capabilities.';
    }

    if (requirements.coordination) {
      reasoning += ' Multi-agent coordination is needed for this task.';
    }

    if (fallback && fallback.score > 0) {
      reasoning += ` Fallback option: ${fallback.tool} can handle ${fallback.strengths.join(', ')}.`;
    }

    return reasoning;
  }

  /**
   * Generate command for selected tool
   */
  generateCommand(toolInfo, task, context) {
    switch (toolInfo.tool) {
      case 'claude-code':
        return this.generateClaudeCommand(task, context);
      
      case 'agent-os':
        return this.generateAgentOSCommand(task, context);
      
      case 'claude-flow':
        return this.generateClaudeFlowCommand(toolInfo, task, context);
      
      case 'tmux':
        return this.generateTMuxCommand(task, context);
      
      case 'basic-workflow':
      default:
        return this.generateBasicCommand(task, context);
    }
  }

  /**
   * Generate Claude Code command
   */
  generateClaudeCommand(task, context) {
    let command = context.yoloMode ? 'yolo' : 'claude';
    
    if (context.projectPath) {
      command += ` --project "${context.projectPath}"`;
    }
    
    command += ` "${task}"`;
    
    return command;
  }

  /**
   * Generate Agent-OS command
   */
  generateAgentOSCommand(task, context) {
    return `agent-os orchestrate --task "${task}" --mode ${context.mode || 'auto'}`;
  }

  /**
   * Generate Claude Flow command
   */
  generateClaudeFlowCommand(toolInfo, task, context) {
    const version = context.claudeFlowVersion || 'alpha';
    let command = `npx claude-flow@${version}`;
    
    switch (toolInfo.approach) {
      case 'hive-mind-sparc':
        command += ` hive-mind spawn --sparc --agents ${context.agentCount || 8}`;
        break;
      case 'hive-mind':
        command += ` hive-mind spawn --agents ${context.agentCount || 4}`;
        break;
      case 'simple-swarm':
      default:
        command += ` swarm`;
        break;
    }
    
    command += ` --${context.yoloMode ? 'yolo' : 'claude'} "${task}"`;
    
    return command;
  }

  /**
   * Generate TMux command
   */
  generateTMuxCommand(task, context) {
    return `tmux-orchestrator start --task "${task}" --session ${context.sessionName || 'workflow'}`;
  }

  /**
   * Generate basic workflow command
   */
  generateBasicCommand(task, context) {
    return `./ai-workflow init --auto "${task}"`;
  }

  /**
   * Load task pattern definitions
   */
  loadTaskPatterns() {
    return {
      'feature-development': {
        preferred: ['claude-code', 'claude-flow'],
        requirements: ['aiAssisted', 'multiFile']
      },
      'bug-fix': {
        preferred: ['claude-code'],
        requirements: ['aiAssisted']
      },
      'system-architecture': {
        preferred: ['agent-os', 'claude-flow'],
        requirements: ['planning', 'coordination']
      },
      'testing': {
        preferred: ['claude-code', 'agent-os'],
        requirements: ['testing', 'multiFile']
      },
      'deployment': {
        preferred: ['agent-os', 'tmux'],
        requirements: ['deployment', 'systemLevel']
      },
      'refactoring': {
        preferred: ['claude-code', 'claude-flow'],
        requirements: ['multiFile', 'aiAssisted']
      }
    };
  }

  /**
   * Get recommendations for task
   */
  async getRecommendations(task, context = {}) {
    await this.initialize();
    
    const selection = await this.selectTool(task, context);
    const recommendations = [];

    // Add tool-specific recommendations
    if (!this.integrations[selection.primary.tool]) {
      recommendations.push(`Install ${selection.primary.tool} for optimal performance`);
    }

    // Add approach recommendations
    if (selection.primary.tool === 'claude-flow' && selection.primary.approach === 'hive-mind-sparc') {
      recommendations.push('Consider using SPARC methodology for systematic development');
    }

    // Add context recommendations
    if (selection.requirements.memory && !this.integrations.claudeFlow) {
      recommendations.push('Claude Flow provides memory capabilities for context retention');
    }

    if (selection.requirements.coordination && !this.integrations.agentOS) {
      recommendations.push('Agent-OS enhances multi-system coordination');
    }

    return {
      selection,
      recommendations
    };
  }
}

// CLI execution
if (require.main === module) {
  const task = process.argv[2];
  
  if (!task) {
    console.error('Usage: smart-tool-selector.js "task description"');
    process.exit(1);
  }
  
  const selector = new SmartToolSelector();
  
  selector.getRecommendations(task).then(result => {
    console.log('\n🎯 Tool Selection for:', task);
    console.log('=' .repeat(50));
    
    console.log('\n📊 Selected Tool:', result.selection.primary.tool);
    console.log('💡 Reasoning:', result.selection.reasoning);
    console.log('\n🚀 Command:', result.selection.command);
    
    if (result.selection.fallback) {
      console.log('\n🔄 Fallback:', result.selection.fallback.tool);
    }
    
    if (result.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      result.recommendations.forEach(rec => {
        console.log(`  • ${rec}`);
      });
    }
    
    console.log('\n' + '='.repeat(50));
  });
}

module.exports = SmartToolSelector;