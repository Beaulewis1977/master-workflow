#!/usr/bin/env node

/**
 * Claude Flow Approach Selector
 * Intelligently selects the optimal Claude Flow approach based on project analysis
 */

const fs = require('fs');
const path = require('path');

class ApproachSelector {
  constructor() {
    // Claude Flow 2.0 versions available
    this.claudeFlowVersions = {
      'alpha': '@alpha',
      'beta': '@beta', 
      'latest': '@latest',
      '2.0': '@2.0',
      'stable': '@stable',
      'dev': '@dev'
    };
    
    // Default version (can be overridden by user)
    this.defaultVersion = 'alpha';
    
    this.approaches = {
      simpleSwarm: {
        name: 'Simple Swarm',
        command: 'npx claude-flow swarm',  // Version will be added dynamically
        scoreRange: [0, 30],
        description: 'Quick AI coordination for straightforward tasks',
        timeEstimate: '5-30 minutes',
        agentCount: 1,
        bestFor: [
          'Single feature development',
          'Quick prototypes',
          'Bug fixes',
          'Simple integrations',
          'Learning and experimentation'
        ],
        limitations: [
          'No persistent memory',
          'Limited coordination',
          'Single-threaded execution'
        ]
      },
      hiveMind: {
        name: 'Hive-Mind',
        command: 'npx claude-flow hive-mind spawn',  // Version will be added dynamically
        scoreRange: [31, 70],
        description: 'Intelligent multi-agent coordination with specialized roles',
        timeEstimate: '30 minutes - 4 hours',
        agentCount: '4-6',
        bestFor: [
          'Multi-feature development',
          'Fullstack applications',
          'Complex integrations',
          'Team-based development',
          'Medium-scale projects'
        ],
        features: [
          'Specialized agent roles',
          'Cross-session memory',
          'Parallel execution',
          'Intelligent coordination'
        ]
      },
      hiveMindSparc: {
        name: 'Hive-Mind + SPARC',
        command: 'npx claude-flow hive-mind spawn --sparc',  // Version will be added dynamically
        scoreRange: [71, 100],
        description: 'Enterprise methodology with systematic development phases',
        timeEstimate: '4+ hours',
        agentCount: '8-12',
        bestFor: [
          'Enterprise applications',
          'Complex system architecture',
          'Long-term projects',
          'Systematic development',
          'Professional documentation'
        ],
        sparcPhases: [
          'Specification - Requirements and planning',
          'Pseudocode - Algorithm design',
          'Architecture - System design',
          'Refinement - Iterative improvement',
          'Completion - Final implementation'
        ]
      }
    };
    
    this.userPreferences = this.loadUserPreferences();
  }

  /**
   * Select optimal approach based on analysis
   * @param {Object} analysis - Project analysis results
   * @param {string} userChoice - User's approach choice
   * @param {string} taskDescription - Task description
   * @param {string} claudeFlowVersion - Specific Claude Flow version to use
   */
  selectApproach(analysis, userChoice = null, taskDescription = '', claudeFlowVersion = null) {
    // Set Claude Flow version (user choice or default)
    this.selectedVersion = claudeFlowVersion || this.defaultVersion;
    // If user made explicit choice, validate and use it
    if (userChoice) {
      return this.validateUserChoice(userChoice, analysis);
    }
    
    // Otherwise, select based on analysis
    const score = analysis.score || 50;
    const stage = analysis.stage || 'unknown';
    
    // Find approach based on score
    let selectedApproach = null;
    for (const [key, approach] of Object.entries(this.approaches)) {
      if (score >= approach.scoreRange[0] && score <= approach.scoreRange[1]) {
        selectedApproach = key;
        break;
      }
    }
    
    // Adjust based on stage
    selectedApproach = this.adjustForStage(selectedApproach, stage, score);
    
    // Consider task description if provided
    if (taskDescription) {
      selectedApproach = this.adjustForTask(selectedApproach, taskDescription, score);
    }
    
    // Apply user preferences
    selectedApproach = this.applyUserPreferences(selectedApproach, analysis);
    
    return this.prepareRecommendation(selectedApproach, analysis, score);
  }

  /**
   * Validate user choice against analysis
   */
  validateUserChoice(userChoice, analysis) {
    const score = analysis.score || 50;
    let approach = null;
    
    // Map user choice to approach
    switch (userChoice.toLowerCase()) {
      case 'swarm':
      case 'simple':
      case 'simple-swarm':
      case '1':
        approach = 'simpleSwarm';
        break;
      case 'hive':
      case 'hive-mind':
      case 'hivemind':
      case '2':
        approach = 'hiveMind';
        break;
      case 'sparc':
      case 'enterprise':
      case 'hive-mind-sparc':
      case '3':
        approach = 'hiveMindSparc';
        break;
      default:
        // Try to guess from choice
        if (userChoice.includes('simple')) approach = 'simpleSwarm';
        else if (userChoice.includes('sparc')) approach = 'hiveMindSparc';
        else if (userChoice.includes('hive')) approach = 'hiveMind';
    }
    
    if (!approach) {
      return {
        error: true,
        message: `Invalid choice: ${userChoice}`,
        validChoices: ['simple-swarm', 'hive-mind', 'hive-mind-sparc']
      };
    }
    
    // Check if choice matches recommendation
    const recommended = this.getRecommendedApproach(score);
    const mismatch = approach !== recommended;
    
    const result = this.prepareRecommendation(approach, analysis, score);
    
    if (mismatch) {
      result.warning = this.generateMismatchWarning(approach, recommended, score);
      result.mismatch = true;
    }
    
    result.userSelected = true;
    return result;
  }

  /**
   * Adjust approach based on project stage
   */
  adjustForStage(approach, stage, score) {
    switch (stage) {
      case 'idea':
        // Ideas often benefit from systematic planning
        if (score > 20 && approach === 'simpleSwarm') {
          return 'hiveMind'; // Upgrade to get better planning
        }
        break;
      case 'mature':
        // Mature projects might need more coordination
        if (score > 60 && approach === 'hiveMind') {
          return 'hiveMindSparc'; // Consider SPARC for better maintenance
        }
        break;
    }
    return approach;
  }

  /**
   * Adjust approach based on task description
   */
  adjustForTask(approach, taskDescription, score) {
    const task = taskDescription.toLowerCase();
    
    // Keywords suggesting simple tasks
    const simpleKeywords = ['fix', 'bug', 'typo', 'style', 'rename', 'simple', 'quick', 'small'];
    if (simpleKeywords.some(keyword => task.includes(keyword))) {
      if (score < 50) return 'simpleSwarm';
    }
    
    // Keywords suggesting complex tasks
    const complexKeywords = ['architect', 'enterprise', 'system', 'redesign', 'refactor', 'migration', 'infrastructure'];
    if (complexKeywords.some(keyword => task.includes(keyword))) {
      if (score > 40) return 'hiveMindSparc';
    }
    
    // Keywords suggesting multi-agent coordination
    const coordinationKeywords = ['fullstack', 'full-stack', 'frontend and backend', 'multiple', 'parallel', 'team'];
    if (coordinationKeywords.some(keyword => task.includes(keyword))) {
      if (approach === 'simpleSwarm' && score > 20) return 'hiveMind';
    }
    
    return approach;
  }

  /**
   * Apply user preferences from history
   */
  applyUserPreferences(approach, analysis) {
    if (!this.userPreferences || !this.userPreferences.history) {
      return approach;
    }
    
    // Check if user consistently overrides for similar projects
    const similarProjects = this.userPreferences.history.filter(h => 
      Math.abs(h.score - analysis.score) < 10
    );
    
    if (similarProjects.length >= 3) {
      // User has consistent preference for similar complexity
      const preferredApproach = this.getMostCommon(similarProjects.map(p => p.selected));
      if (preferredApproach && preferredApproach !== approach) {
        return preferredApproach;
      }
    }
    
    return approach;
  }

  /**
   * Prepare recommendation object
   */
  prepareRecommendation(approachKey, analysis, score) {
    const approach = this.approaches[approachKey];
    
    return {
      selected: approachKey,
      name: approach.name,
      command: this.buildCommand(approach, analysis),
      score: score,
      stage: analysis.stage,
      description: approach.description,
      timeEstimate: approach.timeEstimate,
      agentCount: approach.agentCount,
      bestFor: approach.bestFor,
      reasoning: this.generateReasoning(approachKey, analysis),
      matchScore: this.calculateMatchScore(approachKey, score),
      alternatives: this.getAlternatives(approachKey, score),
      setupSteps: this.getSetupSteps(approachKey, analysis)
    };
  }

  /**
   * Build actual command with parameters
   */
  buildCommand(approach, analysis) {
    // Get the version suffix
    const version = this.claudeFlowVersions[this.selectedVersion] || '@alpha';
    
    // Build command with version
    let baseCommand = approach.command.replace('npx claude-flow', `npx claude-flow${version}`);
    
    // Add project-specific parameters
    if (approach.name === 'Hive-Mind') {
      const agentCount = this.determineAgentCount(analysis);
      baseCommand += ` --agents ${agentCount} --claude`;
      
      // Add project name if available
      const projectName = analysis.projectName || path.basename(process.cwd());
      baseCommand += ` "${projectName}"`;
    } else if (approach.name === 'Hive-Mind + SPARC') {
      const agentCount = this.determineAgentCount(analysis, true);
      baseCommand += ` --agents ${agentCount} --claude`;
      
      // Add SPARC wizard for initial setup
      baseCommand += ' && npx claude-flow' + version + ' sparc wizard --interactive';
      
      // Add project name
      const projectName = analysis.projectName || path.basename(process.cwd());
      baseCommand = baseCommand.replace('spawn', `spawn "${projectName}"`);
    } else if (approach.name === 'Simple Swarm') {
      // Add task description if provided
      if (analysis.taskDescription) {
        baseCommand += ` "${analysis.taskDescription}"`;
      }
    }
    
    return baseCommand;
  }

  /**
   * Determine optimal agent count
   */
  determineAgentCount(analysis, sparc = false) {
    const score = analysis.score || 50;
    
    if (sparc) {
      if (score < 80) return 8;
      if (score < 90) return 10;
      return 12;
    } else {
      if (score < 40) return 4;
      if (score < 60) return 5;
      return 6;
    }
  }

  /**
   * Generate reasoning for selection
   */
  generateReasoning(approachKey, analysis) {
    const reasons = [];
    const score = analysis.score;
    const stage = analysis.stage;
    
    // Score-based reasoning
    if (approachKey === 'simpleSwarm') {
      reasons.push(`Low complexity score (${score}/100) indicates straightforward task`);
    } else if (approachKey === 'hiveMind') {
      reasons.push(`Medium complexity score (${score}/100) requires coordinated approach`);
    } else {
      reasons.push(`High complexity score (${score}/100) benefits from systematic methodology`);
    }
    
    // Stage-based reasoning
    switch (stage) {
      case 'idea':
        reasons.push('Early stage project needs planning and architecture focus');
        break;
      case 'early':
        reasons.push('Growing project benefits from establishing patterns');
        break;
      case 'active':
        reasons.push('Active development requires efficient feature delivery');
        break;
      case 'mature':
        reasons.push('Mature project needs maintenance and optimization focus');
        break;
    }
    
    // Factor-based reasoning
    if (analysis.factors) {
      if (analysis.factors.architecture?.score > 70) {
        reasons.push('Complex architecture detected');
      }
      if (analysis.factors.features?.detected?.realtime) {
        reasons.push('Real-time features require careful coordination');
      }
      if (analysis.factors.deployment?.kubernetes) {
        reasons.push('Kubernetes deployment adds infrastructure complexity');
      }
    }
    
    return reasons;
  }

  /**
   * Calculate match score for approach
   */
  calculateMatchScore(approachKey, score) {
    const approach = this.approaches[approachKey];
    const [min, max] = approach.scoreRange;
    
    if (score >= min && score <= max) {
      // Perfect match within range
      const rangeMiddle = (min + max) / 2;
      const distance = Math.abs(score - rangeMiddle);
      const maxDistance = (max - min) / 2;
      return Math.round(100 - (distance / maxDistance * 20));
    } else {
      // Outside range, calculate distance penalty
      const distance = score < min ? min - score : score - max;
      return Math.max(0, Math.round(100 - distance * 2));
    }
  }

  /**
   * Get alternative approaches
   */
  getAlternatives(selected, score) {
    const alternatives = [];
    
    for (const [key, approach] of Object.entries(this.approaches)) {
      if (key !== selected) {
        alternatives.push({
          name: approach.name,
          matchScore: this.calculateMatchScore(key, score),
          command: approach.command
        });
      }
    }
    
    return alternatives.sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Get setup steps for approach
   */
  getSetupSteps(approachKey, analysis) {
    const steps = [];
    
    // Common steps
    steps.push('Initialize AI Dev OS environment');
    steps.push('Analyze project complexity');
    
    // Approach-specific steps
    switch (approachKey) {
      case 'simpleSwarm':
        steps.push('Set up simple Claude Flow swarm');
        steps.push('Configure single-agent coordination');
        steps.push('Initialize task-focused session');
        break;
      case 'hiveMind':
        steps.push('Spawn Hive-Mind coordination system');
        steps.push('Configure specialized agent roles');
        steps.push('Set up cross-session memory');
        steps.push('Initialize parallel execution environment');
        break;
      case 'hiveMindSparc':
        steps.push('Initialize SPARC methodology phases');
        steps.push('Spawn enterprise Hive-Mind system');
        steps.push('Configure 8-12 specialized agents');
        steps.push('Set up comprehensive documentation structure');
        steps.push('Initialize cross-phase memory system');
        break;
    }
    
    // Stage-specific steps
    if (analysis.stage === 'idea') {
      steps.push('Generate foundational documentation');
      steps.push('Create implementation roadmap');
    } else if (analysis.stage === 'mature') {
      steps.push('Document existing architecture');
      steps.push('Set up maintenance workflows');
    }
    
    return steps;
  }

  /**
   * Generate mismatch warning
   */
  generateMismatchWarning(selected, recommended, score) {
    const selectedApproach = this.approaches[selected];
    const recommendedApproach = this.approaches[recommended];
    
    const warnings = [];
    
    if (selected === 'simpleSwarm' && score > 50) {
      warnings.push('Simple Swarm may be insufficient for this complexity level');
      warnings.push('Consider limited coordination capabilities');
      warnings.push(`Recommended: ${recommendedApproach.name} for better results`);
    } else if (selected === 'hiveMindSparc' && score < 30) {
      warnings.push('SPARC methodology may be overkill for simple tasks');
      warnings.push('Setup time will exceed task complexity');
      warnings.push(`Recommended: ${recommendedApproach.name} for efficiency`);
    } else {
      warnings.push(`${selectedApproach.name} doesn't match complexity score (${score})`);
      warnings.push(`Optimal approach: ${recommendedApproach.name}`);
    }
    
    return {
      level: Math.abs(score - selectedApproach.scoreRange[0]) > 30 ? 'high' : 'medium',
      messages: warnings,
      recommended: recommended
    };
  }

  /**
   * Get recommended approach for score
   */
  getRecommendedApproach(score) {
    for (const [key, approach] of Object.entries(this.approaches)) {
      if (score >= approach.scoreRange[0] && score <= approach.scoreRange[1]) {
        return key;
      }
    }
    return 'hiveMind'; // Default
  }

  /**
   * Load user preferences
   */
  loadUserPreferences() {
    const prefsPath = path.join(process.env.HOME, '.ai-dev-os', 'user-preferences.json');
    try {
      if (fs.existsSync(prefsPath)) {
        return JSON.parse(fs.readFileSync(prefsPath, 'utf8'));
      }
    } catch (e) {
      // Ignore errors
    }
    return { history: [] };
  }

  /**
   * Save user selection for learning
   */
  saveUserSelection(analysis, selected) {
    const prefsDir = path.join(process.env.HOME, '.ai-dev-os');
    const prefsPath = path.join(prefsDir, 'user-preferences.json');
    
    try {
      if (!fs.existsSync(prefsDir)) {
        fs.mkdirSync(prefsDir, { recursive: true });
      }
      
      const prefs = this.loadUserPreferences();
      if (!prefs.history) prefs.history = [];
      
      prefs.history.push({
        timestamp: new Date().toISOString(),
        score: analysis.score,
        stage: analysis.stage,
        selected: selected,
        projectPath: process.cwd()
      });
      
      // Keep only last 100 entries
      if (prefs.history.length > 100) {
        prefs.history = prefs.history.slice(-100);
      }
      
      fs.writeFileSync(prefsPath, JSON.stringify(prefs, null, 2));
    } catch (e) {
      // Ignore errors
    }
  }

  /**
   * Get most common element from array
   */
  getMostCommon(arr) {
    if (!arr || arr.length === 0) return null;
    
    const counts = {};
    for (const item of arr) {
      counts[item] = (counts[item] || 0) + 1;
    }
    
    let maxCount = 0;
    let mostCommon = null;
    for (const [item, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = item;
      }
    }
    
    return mostCommon;
  }
}

// CLI execution
if (require.main === module) {
  const selector = new ApproachSelector();
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const analysisPath = args[0];
  const userChoice = args[1];
  const taskDescription = args[2] || '';
  
  if (!analysisPath) {
    console.error('Usage: approach-selector.js <analysis.json> [user-choice] [task-description]');
    process.exit(1);
  }
  
  try {
    const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));
    const recommendation = selector.selectApproach(analysis, userChoice, taskDescription);
    
    // Save user selection if made
    if (userChoice && !recommendation.error) {
      selector.saveUserSelection(analysis, recommendation.selected);
    }
    
    console.log(JSON.stringify(recommendation, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

module.exports = ApproachSelector;