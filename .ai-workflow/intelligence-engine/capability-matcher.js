/**
 * Capability Matcher - Claude Flow 2.0 Enhancement
 * 
 * Advanced agent selection system using neural predictions and WASM acceleration
 * to achieve 89%+ accuracy in agent-task matching.
 */

const EventEmitter = require('events');

class CapabilityMatcher extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      neuralPredictions: options.neuralPredictions !== false,
      agentTypes: options.agentTypes || new Map(),
      wasmAcceleration: options.wasmAcceleration !== false,
      accuracyTarget: options.accuracyTarget || 0.89, // 89% target accuracy
      learningRate: options.learningRate || 0.001,
      minConfidenceThreshold: options.minConfidenceThreshold || 0.7
    };
    
    // Core components
    this.wasmCore = null; // Will be injected
    this.neuralModel = null;
    this.initialized = false;
    
    // Capability database
    this.capabilityProfiles = new Map(); // Agent type -> capability profile
    this.taskPatterns = new Map(); // Task type -> required capabilities
    this.historicalMatches = []; // Previous matches with outcomes
    
    // Performance tracking
    this.matchingMetrics = {
      totalMatches: 0,
      accurateMatches: 0,
      currentAccuracy: 0.5,
      averageConfidence: 0.5,
      averageExecutionTime: 0,
      neuralPredictions: 0,
      wasmAccelerations: 0,
      capabilityProfiles: 0,
      taskPatterns: 0
    };
    
    // Advanced matching algorithms
    this.matchingAlgorithms = {
      NEURAL_VECTOR: 'neural_vector',
      SEMANTIC_SIMILARITY: 'semantic_similarity', 
      CAPABILITY_DISTANCE: 'capability_distance',
      HYBRID_ENSEMBLE: 'hybrid_ensemble'
    };
    
    this.currentAlgorithm = this.matchingAlgorithms.HYBRID_ENSEMBLE;
    
    // Capability categories
    this.capabilityCategories = {
      TECHNICAL: ['coding', 'testing', 'debugging', 'architecture', 'performance'],
      DOMAIN: ['frontend', 'backend', 'database', 'security', 'devops'],
      PROCESS: ['analysis', 'documentation', 'planning', 'validation', 'deployment'],
      LANGUAGE: ['javascript', 'python', 'java', 'go', 'rust', 'typescript'],
      FRAMEWORK: ['react', 'node', 'express', 'django', 'spring', 'docker']
    };
    
    // Learning system for continuous improvement
    this.learningSystem = {
      enabled: true,
      feedbackBuffer: [],
      bufferSize: 100,
      retrainThreshold: 50,
      modelVersion: 1
    };
  }
  
  /**
   * Initialize capability matcher
   */
  async initialize() {
    try {
      console.log('Initializing Capability Matcher with neural predictions...');
      
      // Initialize capability profiles
      await this.initializeCapabilityProfiles();
      
      // Initialize task patterns
      await this.initializeTaskPatterns();
      
      // Initialize neural model components
      if (this.config.neuralPredictions) {
        await this.initializeNeuralModel();
      }
      
      this.initialized = true;
      
      console.log(`Capability Matcher initialized with ${this.capabilityProfiles.size} agent profiles`);
      console.log(`Target accuracy: ${(this.config.accuracyTarget * 100).toFixed(1)}%`);
      
      this.emit('capability-matcher-ready', {
        profileCount: this.capabilityProfiles.size,
        patternCount: this.taskPatterns.size,
        neuralEnabled: this.config.neuralPredictions,
        wasmEnabled: this.config.wasmAcceleration
      });
      
      return true;
      
    } catch (error) {
      console.error('Capability Matcher initialization failed:', error);
      throw error;
    }
  }
  
  /**
   * Initialize capability profiles for agent types
   */
  async initializeCapabilityProfiles() {
    const profiles = {
      'code-analyzer': {
        technical: { coding: 0.95, testing: 0.7, debugging: 0.9, architecture: 0.8, performance: 0.7 },
        domain: { frontend: 0.6, backend: 0.8, database: 0.6, security: 0.7, devops: 0.5 },
        process: { analysis: 0.95, documentation: 0.8, planning: 0.7, validation: 0.8, deployment: 0.4 },
        language: { javascript: 0.9, python: 0.8, java: 0.7, go: 0.6, rust: 0.5, typescript: 0.9 },
        framework: { react: 0.7, node: 0.8, express: 0.7, django: 0.6, spring: 0.5, docker: 0.6 }
      },
      'test-runner': {
        technical: { coding: 0.7, testing: 0.95, debugging: 0.8, architecture: 0.6, performance: 0.8 },
        domain: { frontend: 0.8, backend: 0.8, database: 0.7, security: 0.6, devops: 0.7 },
        process: { analysis: 0.7, documentation: 0.6, planning: 0.6, validation: 0.95, deployment: 0.6 },
        language: { javascript: 0.9, python: 0.8, java: 0.8, go: 0.6, rust: 0.5, typescript: 0.9 },
        framework: { react: 0.8, node: 0.7, express: 0.6, django: 0.7, spring: 0.6, docker: 0.5 }
      },
      'doc-generator': {
        technical: { coding: 0.6, testing: 0.5, debugging: 0.4, architecture: 0.7, performance: 0.4 },
        domain: { frontend: 0.6, backend: 0.6, database: 0.5, security: 0.5, devops: 0.5 },
        process: { analysis: 0.8, documentation: 0.95, planning: 0.8, validation: 0.7, deployment: 0.3 },
        language: { javascript: 0.7, python: 0.6, java: 0.6, go: 0.5, rust: 0.4, typescript: 0.7 },
        framework: { react: 0.6, node: 0.6, express: 0.5, django: 0.5, spring: 0.4, docker: 0.4 }
      },
      'api-builder': {
        technical: { coding: 0.9, testing: 0.7, debugging: 0.8, architecture: 0.9, performance: 0.8 },
        domain: { frontend: 0.5, backend: 0.95, database: 0.8, security: 0.8, devops: 0.7 },
        process: { analysis: 0.8, documentation: 0.7, planning: 0.8, validation: 0.7, deployment: 0.7 },
        language: { javascript: 0.9, python: 0.8, java: 0.9, go: 0.8, rust: 0.6, typescript: 0.9 },
        framework: { react: 0.4, node: 0.9, express: 0.9, django: 0.8, spring: 0.9, docker: 0.7 }
      },
      'database-architect': {
        technical: { coding: 0.8, testing: 0.6, debugging: 0.7, architecture: 0.95, performance: 0.9 },
        domain: { frontend: 0.3, backend: 0.8, database: 0.95, security: 0.8, devops: 0.8 },
        process: { analysis: 0.9, documentation: 0.7, planning: 0.9, validation: 0.8, deployment: 0.6 },
        language: { javascript: 0.6, python: 0.8, java: 0.8, go: 0.7, rust: 0.6, typescript: 0.6 },
        framework: { react: 0.2, node: 0.6, express: 0.6, django: 0.7, spring: 0.8, docker: 0.8 }
      },
      'security-scanner': {
        technical: { coding: 0.8, testing: 0.8, debugging: 0.8, architecture: 0.8, performance: 0.7 },
        domain: { frontend: 0.7, backend: 0.8, database: 0.8, security: 0.95, devops: 0.8 },
        process: { analysis: 0.9, documentation: 0.7, planning: 0.8, validation: 0.9, deployment: 0.5 },
        language: { javascript: 0.8, python: 0.9, java: 0.8, go: 0.7, rust: 0.8, typescript: 0.8 },
        framework: { react: 0.6, node: 0.7, express: 0.7, django: 0.8, spring: 0.7, docker: 0.8 }
      },
      'performance-optimizer': {
        technical: { coding: 0.9, testing: 0.8, debugging: 0.9, architecture: 0.9, performance: 0.95 },
        domain: { frontend: 0.8, backend: 0.9, database: 0.9, security: 0.6, devops: 0.8 },
        process: { analysis: 0.9, documentation: 0.6, planning: 0.7, validation: 0.8, deployment: 0.6 },
        language: { javascript: 0.9, python: 0.8, java: 0.9, go: 0.9, rust: 0.9, typescript: 0.9 },
        framework: { react: 0.8, node: 0.9, express: 0.8, django: 0.7, spring: 0.8, docker: 0.8 }
      },
      'deployment-engineer': {
        technical: { coding: 0.7, testing: 0.8, debugging: 0.7, architecture: 0.8, performance: 0.8 },
        domain: { frontend: 0.5, backend: 0.7, database: 0.6, security: 0.8, devops: 0.95 },
        process: { analysis: 0.7, documentation: 0.7, planning: 0.8, validation: 0.8, deployment: 0.95 },
        language: { javascript: 0.7, python: 0.8, java: 0.7, go: 0.8, rust: 0.6, typescript: 0.7 },
        framework: { react: 0.5, node: 0.7, express: 0.6, django: 0.6, spring: 0.6, docker: 0.95 }
      },
      'frontend-specialist': {
        technical: { coding: 0.9, testing: 0.8, debugging: 0.8, architecture: 0.7, performance: 0.8 },
        domain: { frontend: 0.95, backend: 0.5, database: 0.4, security: 0.6, devops: 0.5 },
        process: { analysis: 0.7, documentation: 0.7, planning: 0.7, validation: 0.7, deployment: 0.6 },
        language: { javascript: 0.95, python: 0.4, java: 0.3, go: 0.2, rust: 0.2, typescript: 0.95 },
        framework: { react: 0.95, node: 0.7, express: 0.5, django: 0.2, spring: 0.1, docker: 0.5 }
      },
      'recovery-specialist': {
        technical: { coding: 0.8, testing: 0.9, debugging: 0.95, architecture: 0.8, performance: 0.9 },
        domain: { frontend: 0.6, backend: 0.8, database: 0.8, security: 0.9, devops: 0.9 },
        process: { analysis: 0.9, documentation: 0.7, planning: 0.8, validation: 0.9, deployment: 0.8 },
        language: { javascript: 0.8, python: 0.9, java: 0.8, go: 0.7, rust: 0.6, typescript: 0.8 },
        framework: { react: 0.6, node: 0.8, express: 0.7, django: 0.8, spring: 0.7, docker: 0.9 }
      }
    };
    
    for (const [agentType, profile] of Object.entries(profiles)) {
      this.capabilityProfiles.set(agentType, profile);
    }
    
    this.matchingMetrics.capabilityProfiles = this.capabilityProfiles.size;
    
    console.log(`Initialized ${this.capabilityProfiles.size} capability profiles`);
  }
  
  /**
   * Initialize task patterns for common task types
   */
  async initializeTaskPatterns() {
    const patterns = {
      'code-analysis': {
        required: { technical: { coding: 0.8, analysis: 0.9 }, domain: { backend: 0.6 } },
        preferred: { technical: { architecture: 0.7, debugging: 0.7 } },
        weight: 1.0
      },
      'testing': {
        required: { technical: { testing: 0.9 }, process: { validation: 0.8 } },
        preferred: { technical: { debugging: 0.7, coding: 0.6 } },
        weight: 1.0
      },
      'documentation': {
        required: { process: { documentation: 0.9, analysis: 0.7 } },
        preferred: { technical: { architecture: 0.6 } },
        weight: 0.8
      },
      'api-development': {
        required: { technical: { coding: 0.8, architecture: 0.8 }, domain: { backend: 0.9 } },
        preferred: { technical: { testing: 0.7 }, framework: { express: 0.7, node: 0.8 } },
        weight: 1.2
      },
      'database-design': {
        required: { domain: { database: 0.9 }, technical: { architecture: 0.8 } },
        preferred: { technical: { performance: 0.7 } },
        weight: 1.1
      },
      'security-audit': {
        required: { domain: { security: 0.9 }, process: { analysis: 0.8, validation: 0.8 } },
        preferred: { technical: { testing: 0.7 } },
        weight: 1.3
      },
      'performance-optimization': {
        required: { technical: { performance: 0.9, analysis: 0.8 } },
        preferred: { technical: { debugging: 0.8, architecture: 0.7 } },
        weight: 1.2
      },
      'deployment': {
        required: { process: { deployment: 0.9 }, domain: { devops: 0.9 } },
        preferred: { framework: { docker: 0.8 }, technical: { testing: 0.6 } },
        weight: 1.1
      },
      'frontend-development': {
        required: { domain: { frontend: 0.9 }, technical: { coding: 0.8 } },
        preferred: { language: { javascript: 0.9, typescript: 0.8 }, framework: { react: 0.8 } },
        weight: 1.0
      },
      'error-recovery': {
        required: { technical: { debugging: 0.9 }, process: { analysis: 0.8 } },
        preferred: { technical: { testing: 0.7 }, domain: { devops: 0.7 } },
        weight: 1.4
      }
    };
    
    for (const [taskType, pattern] of Object.entries(patterns)) {
      this.taskPatterns.set(taskType, pattern);
    }
    
    this.matchingMetrics.taskPatterns = this.taskPatterns.size;
    
    console.log(`Initialized ${this.taskPatterns.size} task patterns`);
  }
  
  /**
   * Initialize neural model components
   */
  async initializeNeuralModel() {
    // Simple neural model for demonstration
    this.neuralModel = {
      weights: this.initializeRandomWeights(128, 64, 32),
      biases: this.initializeRandomBiases(64, 32),
      activationFunction: 'relu',
      outputFunction: 'softmax',
      trained: false
    };
    
    console.log('Neural model components initialized');
  }
  
  /**
   * Initialize random weights for neural network
   */
  initializeRandomWeights(...layers) {
    const weights = [];
    for (let i = 0; i < layers.length - 1; i++) {
      const layerWeights = [];
      for (let j = 0; j < layers[i + 1]; j++) {
        const neuronWeights = [];
        for (let k = 0; k < layers[i]; k++) {
          neuronWeights.push((Math.random() - 0.5) * 2 / Math.sqrt(layers[i]));
        }
        layerWeights.push(neuronWeights);
      }
      weights.push(layerWeights);
    }
    return weights;
  }
  
  /**
   * Initialize random biases for neural network
   */
  initializeRandomBiases(...layers) {
    const biases = [];
    for (let i = 1; i < layers.length; i++) {
      const layerBiases = [];
      for (let j = 0; j < layers[i]; j++) {
        layerBiases.push((Math.random() - 0.5) * 0.1);
      }
      biases.push(layerBiases);
    }
    return biases;
  }
  
  /**
   * Find optimal agent for a given task
   */
  async findOptimalAgent(taskData, availableAgents = []) {
    if (!this.initialized) {
      throw new Error('Capability Matcher not initialized');
    }
    
    const startTime = performance.now();
    
    try {
      // Extract task requirements
      const taskRequirements = await this.extractTaskRequirements(taskData);
      
      // Get candidate agents
      const candidates = availableAgents.length > 0 
        ? availableAgents 
        : Array.from(this.capabilityProfiles.keys());
      
      // Score each candidate agent
      const agentScores = await Promise.all(
        candidates.map(agentType => this.scoreAgentForTask(agentType, taskRequirements))
      );
      
      // Sort by score
      agentScores.sort((a, b) => b.totalScore - a.totalScore);
      
      // Select best agent with confidence check
      const bestMatch = agentScores[0];
      if (!bestMatch || bestMatch.confidence < this.config.minConfidenceThreshold) {
        throw new Error(`No suitable agent found for task (confidence: ${bestMatch?.confidence || 0})`);
      }
      
      const executionTime = performance.now() - startTime;
      
      // Update metrics
      this.updateMatchingMetrics(executionTime, bestMatch.confidence);
      
      // Store match for learning
      if (this.learningSystem.enabled) {
        this.storeMatchForLearning(taskData, bestMatch, agentScores);
      }
      
      const result = {
        selectedAgent: bestMatch.agentType,
        confidence: bestMatch.confidence,
        matchScore: bestMatch.totalScore,
        executionTime,
        alternatives: agentScores.slice(1, 4), // Top 3 alternatives
        reasoning: bestMatch.reasoning,
        taskRequirements,
        algorithmUsed: this.currentAlgorithm
      };
      
      this.emit('agent-matched', result);
      
      return result;
      
    } catch (error) {
      console.error('Agent matching failed:', error);
      const executionTime = performance.now() - startTime;
      this.updateMatchingMetrics(executionTime, 0, true);
      throw error;
    }
  }
  
  /**
   * Extract task requirements from task data
   */
  async extractTaskRequirements(taskData) {
    const requirements = {
      technical: {},
      domain: {},
      process: {},
      language: {},
      framework: {}
    };
    
    // Analyze task description and type
    const description = (taskData.description || taskData.name || '').toLowerCase();
    const taskType = taskData.type || taskData.category || 'general';
    
    // Check for existing task pattern
    const pattern = this.taskPatterns.get(taskType);
    if (pattern) {
      this.mergeRequirements(requirements, pattern.required);
      this.mergeRequirements(requirements, pattern.preferred, 0.7); // Lower weight for preferred
    }
    
    // Extract from description keywords
    await this.extractRequirementsFromDescription(description, requirements);
    
    // Normalize requirements
    this.normalizeRequirements(requirements);
    
    return {
      ...requirements,
      taskType,
      complexity: taskData.complexity || 5,
      priority: taskData.priority || 'normal',
      estimatedDuration: taskData.estimatedDuration || 0,
      weight: pattern?.weight || 1.0
    };
  }
  
  /**
   * Extract requirements from task description
   */
  async extractRequirementsFromDescription(description, requirements) {
    // Technical keywords
    const technicalKeywords = {
      'coding': ['code', 'develop', 'implement', 'build', 'create'],
      'testing': ['test', 'spec', 'verify', 'validate', 'check'],
      'debugging': ['debug', 'fix', 'error', 'bug', 'issue'],
      'architecture': ['design', 'structure', 'pattern', 'architecture', 'framework'],
      'performance': ['optimize', 'performance', 'speed', 'memory', 'efficient']
    };
    
    // Domain keywords
    const domainKeywords = {
      'frontend': ['frontend', 'ui', 'user interface', 'client', 'browser'],
      'backend': ['backend', 'server', 'api', 'service', 'endpoint'],
      'database': ['database', 'db', 'sql', 'query', 'schema'],
      'security': ['security', 'auth', 'secure', 'vulnerability', 'encrypt'],
      'devops': ['deploy', 'docker', 'kubernetes', 'ci/cd', 'pipeline']
    };
    
    // Process keywords
    const processKeywords = {
      'analysis': ['analyze', 'review', 'examine', 'study', 'evaluate'],
      'documentation': ['document', 'docs', 'readme', 'guide', 'manual'],
      'planning': ['plan', 'strategy', 'roadmap', 'schedule', 'organize'],
      'validation': ['validate', 'verify', 'confirm', 'check', 'ensure'],
      'deployment': ['deploy', 'release', 'publish', 'launch', 'rollout']
    };
    
    // Score based on keyword matches
    this.scoreKeywords(description, technicalKeywords, requirements.technical);
    this.scoreKeywords(description, domainKeywords, requirements.domain);
    this.scoreKeywords(description, processKeywords, requirements.process);
    
    // Language detection
    const languages = ['javascript', 'python', 'java', 'go', 'rust', 'typescript'];
    languages.forEach(lang => {
      if (description.includes(lang)) {
        requirements.language[lang] = 0.9;
      }
    });
    
    // Framework detection
    const frameworks = ['react', 'node', 'express', 'django', 'spring', 'docker'];
    frameworks.forEach(framework => {
      if (description.includes(framework)) {
        requirements.framework[framework] = 0.8;
      }
    });
  }
  
  /**
   * Score requirements based on keyword matches
   */
  scoreKeywords(description, keywords, targetObject) {
    for (const [capability, terms] of Object.entries(keywords)) {
      const matches = terms.filter(term => description.includes(term)).length;
      if (matches > 0) {
        targetObject[capability] = Math.min(0.9, 0.5 + (matches * 0.2));
      }
    }
  }
  
  /**
   * Merge requirements from different sources
   */
  mergeRequirements(target, source, weight = 1.0) {
    for (const [category, capabilities] of Object.entries(source)) {
      if (!target[category]) target[category] = {};
      
      for (const [capability, score] of Object.entries(capabilities)) {
        const currentScore = target[category][capability] || 0;
        target[category][capability] = Math.max(currentScore, score * weight);
      }
    }
  }
  
  /**
   * Normalize requirements to [0, 1] range
   */
  normalizeRequirements(requirements) {
    for (const category of Object.values(requirements)) {
      if (typeof category === 'object') {
        for (const [key, value] of Object.entries(category)) {
          category[key] = Math.max(0, Math.min(1, value));
        }
      }
    }
  }
  
  /**
   * Score an agent type for a specific task
   */
  async scoreAgentForTask(agentType, taskRequirements) {
    const agentProfile = this.capabilityProfiles.get(agentType);
    if (!agentProfile) {
      return {
        agentType,
        totalScore: 0,
        confidence: 0,
        reasoning: { error: 'Agent profile not found' }
      };
    }
    
    const scores = {};
    let totalWeight = 0;
    let weightedScore = 0;
    
    // Score each capability category
    for (const [category, requirements] of Object.entries(taskRequirements)) {
      if (typeof requirements === 'object' && agentProfile[category]) {
        const categoryScore = this.calculateCategoryScore(
          requirements,
          agentProfile[category]
        );
        
        const weight = this.getCategoryWeight(category, taskRequirements.taskType);
        scores[category] = {
          score: categoryScore.score,
          match: categoryScore.match,
          weight: weight
        };
        
        weightedScore += categoryScore.score * weight;
        totalWeight += weight;
      }
    }
    
    // Calculate final score
    const finalScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
    
    // Calculate confidence based on score distribution
    const confidence = this.calculateConfidence(scores, finalScore);
    
    // Apply neural prediction if available
    let neuralAdjustment = 0;
    if (this.config.neuralPredictions && this.wasmCore) {
      try {
        const neuralResult = await this.wasmCore.executeNeuralPrediction(taskRequirements);
        neuralAdjustment = this.extractNeuralAdjustment(neuralResult, agentType);
        this.matchingMetrics.neuralPredictions++;
      } catch (error) {
        console.warn('Neural prediction failed:', error.message);
      }
    }
    
    const adjustedScore = Math.max(0, Math.min(1, finalScore + neuralAdjustment));
    const adjustedConfidence = Math.max(0, Math.min(1, confidence + Math.abs(neuralAdjustment) * 0.1));
    
    return {
      agentType,
      totalScore: adjustedScore,
      confidence: adjustedConfidence,
      categoryScores: scores,
      neuralAdjustment,
      reasoning: {
        finalScore,
        neuralAdjustment,
        categoryBreakdown: scores,
        strongPoints: this.identifyStrongPoints(scores),
        weakPoints: this.identifyWeakPoints(scores)
      }
    };
  }
  
  /**
   * Calculate score for a specific capability category
   */
  calculateCategoryScore(requirements, agentCapabilities) {
    let totalRequirement = 0;
    let totalMatch = 0;
    let count = 0;
    
    for (const [capability, requiredScore] of Object.entries(requirements)) {
      const agentScore = agentCapabilities[capability] || 0;
      const match = Math.min(agentScore / Math.max(requiredScore, 0.1), 1.0);
      
      totalRequirement += requiredScore;
      totalMatch += match * requiredScore;
      count++;
    }
    
    const score = count > 0 ? totalMatch / Math.max(totalRequirement, 0.1) : 0;
    const match = count > 0 ? totalMatch / count : 0;
    
    return { score, match };
  }
  
  /**
   * Get weight for a capability category based on task type
   */
  getCategoryWeight(category, taskType) {
    const weights = {
      technical: 0.35,
      domain: 0.25,
      process: 0.20,
      language: 0.15,
      framework: 0.05
    };
    
    // Adjust weights based on task type
    const taskTypeWeights = {
      'code-analysis': { technical: 0.5, domain: 0.2, process: 0.25 },
      'testing': { technical: 0.4, process: 0.4, domain: 0.15 },
      'documentation': { process: 0.5, technical: 0.25, domain: 0.2 },
      'deployment': { domain: 0.4, process: 0.35, technical: 0.2 }
    };
    
    if (taskTypeWeights[taskType] && taskTypeWeights[taskType][category]) {
      return taskTypeWeights[taskType][category];
    }
    
    return weights[category] || 0.1;
  }
  
  /**
   * Calculate confidence score based on score distribution
   */
  calculateConfidence(categoryScores, finalScore) {
    const scores = Object.values(categoryScores).map(c => c.score);
    
    if (scores.length === 0) return 0;
    
    // Base confidence on final score
    let confidence = finalScore;
    
    // Adjust based on score consistency
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) / scores.length;
    const consistency = Math.max(0, 1 - variance);
    
    confidence = (confidence * 0.7) + (consistency * 0.3);
    
    return Math.max(0, Math.min(1, confidence));
  }
  
  /**
   * Extract neural adjustment from WASM prediction
   */
  extractNeuralAdjustment(neuralResult, agentType) {
    if (!neuralResult || !neuralResult.prediction) return 0;
    
    const prediction = neuralResult.prediction;
    const agentTypes = Array.from(this.capabilityProfiles.keys());
    const agentIndex = agentTypes.indexOf(agentType);
    
    if (agentIndex >= 0 && prediction.agentTypeScores && 
        prediction.agentTypeScores[agentIndex] !== undefined) {
      // Convert neural score to adjustment (-0.2 to +0.2)
      const neuralScore = prediction.agentTypeScores[agentIndex];
      return (neuralScore - 0.5) * 0.4;
    }
    
    return 0;
  }
  
  /**
   * Identify strong points in capability match
   */
  identifyStrongPoints(categoryScores) {
    return Object.entries(categoryScores)
      .filter(([_, data]) => data.score > 0.7)
      .map(([category, data]) => `${category}: ${(data.score * 100).toFixed(1)}%`);
  }
  
  /**
   * Identify weak points in capability match
   */
  identifyWeakPoints(categoryScores) {
    return Object.entries(categoryScores)
      .filter(([_, data]) => data.score < 0.4)
      .map(([category, data]) => `${category}: ${(data.score * 100).toFixed(1)}%`);
  }
  
  /**
   * Store match data for learning
   */
  storeMatchForLearning(taskData, bestMatch, allScores) {
    if (this.learningSystem.feedbackBuffer.length >= this.learningSystem.bufferSize) {
      this.learningSystem.feedbackBuffer.shift();
    }
    
    this.learningSystem.feedbackBuffer.push({
      taskData,
      selectedAgent: bestMatch.agentType,
      confidence: bestMatch.confidence,
      score: bestMatch.totalScore,
      alternatives: allScores,
      timestamp: Date.now(),
      outcome: null // Will be filled when feedback is received
    });
  }
  
  /**
   * Provide feedback on agent matching accuracy
   */
  async provideFeedback(matchId, outcome) {
    // Find match in feedback buffer
    const match = this.learningSystem.feedbackBuffer.find(m => 
      m.timestamp === matchId || m.selectedAgent === matchId
    );
    
    if (!match) {
      console.warn('Match not found for feedback:', matchId);
      return false;
    }
    
    match.outcome = outcome;
    
    // Update accuracy metrics
    this.matchingMetrics.totalMatches++;
    if (outcome.success) {
      this.matchingMetrics.accurateMatches++;
    }
    
    this.matchingMetrics.currentAccuracy = 
      this.matchingMetrics.accurateMatches / this.matchingMetrics.totalMatches;
    
    // Trigger retraining if needed
    const completedMatches = this.learningSystem.feedbackBuffer
      .filter(m => m.outcome !== null).length;
    
    if (completedMatches >= this.learningSystem.retrainThreshold) {
      await this.retrainModel();
    }
    
    this.emit('feedback-received', {
      accuracy: this.matchingMetrics.currentAccuracy,
      totalMatches: this.matchingMetrics.totalMatches,
      targetAccuracy: this.config.accuracyTarget
    });
    
    return true;
  }
  
  /**
   * Retrain model based on feedback
   */
  async retrainModel() {
    console.log('Retraining capability matching model...');
    
    const trainingData = this.learningSystem.feedbackBuffer
      .filter(m => m.outcome !== null);
    
    if (trainingData.length < 10) {
      console.warn('Insufficient training data for retraining');
      return false;
    }
    
    // Simple retraining: adjust capability profiles based on outcomes
    const adjustments = new Map();
    
    trainingData.forEach(match => {
      const agentType = match.selectedAgent;
      const success = match.outcome.success;
      const adjustment = success ? 0.01 : -0.01; // Small adjustments
      
      if (!adjustments.has(agentType)) {
        adjustments.set(agentType, 0);
      }
      adjustments.set(agentType, adjustments.get(agentType) + adjustment);
    });
    
    // Apply adjustments to capability profiles
    for (const [agentType, adjustment] of adjustments) {
      const profile = this.capabilityProfiles.get(agentType);
      if (profile) {
        this.adjustCapabilityProfile(profile, adjustment);
      }
    }
    
    this.learningSystem.modelVersion++;
    
    console.log(`Model retrained (v${this.learningSystem.modelVersion}) with ${trainingData.length} examples`);
    
    // Clear processed feedback
    this.learningSystem.feedbackBuffer = this.learningSystem.feedbackBuffer
      .filter(m => m.outcome === null);
    
    return true;
  }
  
  /**
   * Apply small adjustments to capability profile
   */
  adjustCapabilityProfile(profile, adjustment) {
    for (const category of Object.values(profile)) {
      for (const [capability, score] of Object.entries(category)) {
        category[capability] = Math.max(0, Math.min(1, score + adjustment));
      }
    }
  }
  
  /**
   * Update matching metrics
   */
  updateMatchingMetrics(executionTime, confidence, failed = false) {
    if (!failed) {
      // Update average execution time
      const alpha = 0.1;
      this.matchingMetrics.averageExecutionTime = 
        alpha * executionTime + (1 - alpha) * this.matchingMetrics.averageExecutionTime;
      
      // Update average confidence
      this.matchingMetrics.averageConfidence = 
        alpha * confidence + (1 - alpha) * this.matchingMetrics.averageConfidence;
    }
  }
  
  /**
   * Set WASM core reference
   */
  setWasmCore(wasmCore) {
    this.wasmCore = wasmCore;
  }
  
  /**
   * Get matching statistics
   */
  getMatchingStats() {
    return {
      ...this.matchingMetrics,
      initialized: this.initialized,
      currentAccuracy: this.matchingMetrics.currentAccuracy,
      targetAccuracy: this.config.accuracyTarget,
      accuracyGap: this.config.accuracyTarget - this.matchingMetrics.currentAccuracy,
      learningSystemActive: this.learningSystem.enabled,
      modelVersion: this.learningSystem.modelVersion,
      feedbackBufferSize: this.learningSystem.feedbackBuffer.length
    };
  }
  
  /**
   * Check if capability matcher is enabled
   */
  isEnabled() {
    return this.initialized;
  }
  
  /**
   * Shutdown capability matcher
   */
  async shutdown() {
    this.capabilityProfiles.clear();
    this.taskPatterns.clear();
    this.historicalMatches = [];
    this.learningSystem.feedbackBuffer = [];
    this.initialized = false;
    
    console.log('Capability Matcher shutdown complete');
  }
}

module.exports = { CapabilityMatcher };