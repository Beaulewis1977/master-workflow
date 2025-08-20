#!/usr/bin/env node

/**
 * Project Complexity Analyzer
 * Analyzes project characteristics and calculates complexity score (0-100)
 * Used to determine optimal Claude Flow approach
 */

const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

class ComplexityAnalyzer {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.analysis = {
      score: 0,
      factors: {},
      stage: 'unknown',
      recommendations: [],
      confidence: 0
    };
    this.config = this.loadConfig();
  }

  /**
   * Load configuration from JSON file
   */
  loadConfig() {
    try {
      const configPath = path.join(__dirname, '..', 'configs', 'approaches.json');
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (error) {
      console.error('Failed to load or parse approaches.json:', error);
      // Return a default/fallback config to prevent crashes
      return {
        approaches: {},
        complexityFactors: {
          size: { weight: 0.15 },
          dependencies: { weight: 0.15 },
          architecture: { weight: 0.20 },
          techStack: { weight: 0.15 },
          features: { weight: 0.15 },
          team: { weight: 0.05 },
          deployment: { weight: 0.10 },
          testing: { weight: 0.05 }
        },
        projectStages: {}
      };
    }
  }

  /**
   * Main analysis function
   */
  async analyze(options = {}) {
    const { promptText } = options;
    try {
      // Detect project stage first
      this.analysis.stage = await this.detectProjectStage();
      
      // Analyze various complexity factors
      const factors = {
        size: await this.analyzeProjectSize(),
        dependencies: await this.analyzeDependencies(),
        architecture: await this.analyzeArchitecture(),
        techStack: await this.analyzeTechStack(),
        features: await this.analyzeFeatures(),
        team: await this.analyzeTeamIndicators(),
        deployment: await this.analyzeDeployment(),
        testing: await this.analyzeTestingComplexity(),
        prompt: await this.analyzePrompt(promptText),
      };

      this.analysis.factors = factors;
      
      // Calculate overall complexity score
      this.analysis.score = this.calculateComplexityScore(factors);
      
      // Calculate confidence in analysis
      this.analysis.confidence = this.calculateConfidence(factors);
      
      // Generate recommendations
      this.analysis.recommendations = this.generateRecommendations();
      
      return this.analysis;
    } catch (error) {
      console.error('Analysis error:', error);
      return this.getDefaultAnalysis();
    }
  }

  /**
   * Detect project lifecycle stage
   */
  async detectProjectStage() {
    const files = await this.getProjectFiles();
    const hasCode = files.some(f => /\.(js|ts|py|go|java|rs|cpp)$/.test(f));
    const hasTests = files.some(f => /test|spec/.test(f));
    const hasDeployment = files.some(f => /dockerfile|docker-compose|k8s|deploy/.test(f.toLowerCase()));
    const hasCI = files.some(f => /\.github\/workflows|\.gitlab-ci|jenkinsfile/.test(f.toLowerCase()));
    
    // Check for documentation only
    if (!hasCode && files.length < 10) {
      return 'idea';
    }
    
    // Check for basic structure
    if (hasCode && files.length < 50 && !hasTests) {
      return 'early';
    }
    
    // Check for active development
    if (hasCode && (hasTests || files.length > 50)) {
      return 'active';
    }
    
    // Check for mature/production
    if (hasDeployment && hasCI && hasTests) {
      return 'mature';
    }
    
    return 'active'; // Default to active if unclear
  }

  /**
   * Analyze project size
   */
  async analyzeProjectSize() {
    const files = await this.getProjectFiles();
    const codeFiles = files.filter(f => /\.(js|ts|py|go|java|rs|cpp|jsx|tsx|vue)$/.test(f));
    
    let score = 0;
    if (codeFiles.length < 10) score = 10;
    else if (codeFiles.length < 50) score = 30;
    else if (codeFiles.length < 200) score = 50;
    else if (codeFiles.length < 500) score = 70;
    else score = 90;
    
    return {
      fileCount: codeFiles.length,
      score,
      description: this.getSizeDescription(codeFiles.length)
    };
  }

  /**
   * Analyze dependencies
   */
  async analyzeDependencies() {
    let dependencyCount = 0;
    let score = 0;
    
    // Check package.json
    const packageJsonPath = path.join(this.projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const deps = Object.keys(packageJson.dependencies || {});
      const devDeps = Object.keys(packageJson.devDependencies || {});
      dependencyCount = deps.length + devDeps.length;
    }
    
    // Check requirements.txt
    const requirementsPath = path.join(this.projectPath, 'requirements.txt');
    if (fs.existsSync(requirementsPath)) {
      const requirements = fs.readFileSync(requirementsPath, 'utf8');
      dependencyCount += requirements.split('\n').filter(l => l.trim() && !l.startsWith('#')).length;
    }
    
    // Check go.mod
    const goModPath = path.join(this.projectPath, 'go.mod');
    if (fs.existsSync(goModPath)) {
      const goMod = fs.readFileSync(goModPath, 'utf8');
      const requires = goMod.match(/require\s+\(/);
      if (requires) {
        dependencyCount += goMod.match(/\t[^\s]+\s+v/g)?.length || 0;
      }
    }
    
    // Calculate score based on dependency count
    if (dependencyCount < 5) score = 10;
    else if (dependencyCount < 20) score = 30;
    else if (dependencyCount < 50) score = 50;
    else if (dependencyCount < 100) score = 70;
    else score = 90;
    
    return {
      count: dependencyCount,
      score,
      description: `${dependencyCount} dependencies detected`
    };
  }

  /**
   * Analyze architecture patterns
   */
  async analyzeArchitecture() {
    const indicators = {
      microservices: 0,
      monolith: 0,
      frontend: 0,
      backend: 0,
      fullstack: 0,
      api: 0,
      database: 0
    };
    
    const files = await this.getProjectFiles();
    
    // Check for microservices patterns
    if (files.some(f => f.includes('services/') || f.includes('microservices/'))) {
      indicators.microservices += 30;
    }
    if (files.some(f => /docker-compose/.test(f))) {
      indicators.microservices += 20;
    }
    
    // Check for frontend patterns
    if (files.some(f => /\.(jsx|tsx|vue)$/.test(f))) {
      indicators.frontend += 30;
    }
    if (files.some(f => f.includes('components/'))) {
      indicators.frontend += 20;
    }
    
    // Check for backend patterns
    if (files.some(f => f.includes('controllers/') || f.includes('routes/'))) {
      indicators.backend += 30;
    }
    if (files.some(f => f.includes('models/') || f.includes('schemas/'))) {
      indicators.backend += 20;
      indicators.database += 20;
    }
    
    // Check for API patterns
    if (files.some(f => f.includes('api/') || /swagger|openapi/.test(f))) {
      indicators.api += 30;
    }
    
    // Determine architecture complexity
    const maxIndicator = Math.max(...Object.values(indicators));
    const architectureTypes = Object.entries(indicators).filter(([k, v]) => v > 20).length;
    
    let score = 20; // Base score
    score += architectureTypes * 15; // Add complexity for each architecture type
    if (indicators.microservices > 20) score += 20; // Extra complexity for microservices
    if (indicators.fullstack > 20 || (indicators.frontend > 20 && indicators.backend > 20)) {
      score += 15; // Extra complexity for fullstack
    }
    
    return {
      patterns: indicators,
      score: Math.min(score, 100),
      primaryArchitecture: Object.entries(indicators).sort((a, b) => b[1] - a[1])[0][0]
    };
  }

  /**
   * Analyze technology stack
   */
  async analyzeTechStack() {
    const stack = {
      languages: [],
      frameworks: [],
      databases: [],
      tools: []
    };
    
    const files = await this.getProjectFiles();
    
    // Detect languages
    if (files.some(f => /\.js$|\.jsx$/.test(f))) stack.languages.push('JavaScript');
    if (files.some(f => /\.ts$|\.tsx$/.test(f))) stack.languages.push('TypeScript');
    if (files.some(f => /\.py$/.test(f))) stack.languages.push('Python');
    if (files.some(f => /\.go$/.test(f))) stack.languages.push('Go');
    if (files.some(f => /\.java$/.test(f))) stack.languages.push('Java');
    if (files.some(f => /\.rs$/.test(f))) stack.languages.push('Rust');
    if (files.some(f => /\.php$/.test(f))) stack.languages.push('PHP');
    if (files.some(f => /\.rb$/.test(f))) stack.languages.push('Ruby');
    if (files.some(f => /\.cs$/.test(f))) stack.languages.push('C#');
    if (files.some(f => /\.swift$/.test(f))) stack.languages.push('Swift');
    if (files.some(f => /\.kt$|\.kts$/.test(f))) stack.languages.push('Kotlin');
    if (files.some(f => /\.c$|\.cpp$|\.h$|\.hpp$/.test(f))) stack.languages.push('C/C++');
    if (files.some(f => /\.sh$/.test(f))) stack.languages.push('Shell');
    if (files.some(f => /\.dart$/.test(f))) stack.languages.push('Dart');
    if (files.some(f => /\.scala$/.test(f))) stack.languages.push('Scala');
    if (files.some(f => /\.r$/.test(f))) stack.languages.push('R');
    if (files.some(f => /\.lua$/.test(f))) stack.languages.push('Lua');
    if (files.some(f => /\.ex$|\.exs$/.test(f))) stack.languages.push('Elixir');
    if (files.some(f => /\.html$|\.htm$/.test(f))) stack.languages.push('HTML');
    if (files.some(f => /\.css$/.test(f))) stack.languages.push('CSS');
    if (files.some(f => /\.scss$|\.sass$/.test(f))) stack.languages.push('Sass/SCSS');
    if (files.some(f => /\.m$|\.mm$/.test(f))) stack.languages.push('Objective-C');
    
    // Check package.json for frameworks
    const packageJsonPath = path.join(this.projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      if (allDeps.react) stack.frameworks.push('React');
      if (allDeps.vue) stack.frameworks.push('Vue');
      if (allDeps.angular) stack.frameworks.push('Angular');
      if (allDeps.express) stack.frameworks.push('Express');
      if (allDeps.next) stack.frameworks.push('Next.js');
      if (allDeps.nestjs) stack.frameworks.push('NestJS');
    }
    
    // Check for databases
    if (files.some(f => /mongodb|mongoose/.test(f.toLowerCase()))) stack.databases.push('MongoDB');
    if (files.some(f => /postgres|pg/.test(f.toLowerCase()))) stack.databases.push('PostgreSQL');
    if (files.some(f => /mysql/.test(f.toLowerCase()))) stack.databases.push('MySQL');
    if (files.some(f => /redis/.test(f.toLowerCase()))) stack.databases.push('Redis');
    
    // Calculate complexity based on tech diversity
    const diversity = stack.languages.length + stack.frameworks.length + stack.databases.length;
    let score = diversity * 10;
    
    // Add complexity for certain technologies
    if (stack.frameworks.includes('NestJS')) score += 15; // Enterprise framework
    if (stack.databases.length > 1) score += 10; // Multiple databases
    if (stack.languages.length > 2) score += 15; // Polyglot project
    
    return {
      ...stack,
      score: Math.min(score, 100),
      diversity
    };
  }

  /**
   * Analyze features based on code patterns using glob for efficiency
   */
  async analyzeFeatures() {
    const features = {
      authentication: false,
      realtime: false,
      api: false,
      database: false,
      testing: false,
      ci_cd: false,
      docker: false,
      kubernetes: false
    };

    const options = { cwd: this.projectPath, nodir: true, dot: true, ignore: 'node_modules/**' };

    // File path-based detection
    features.testing = globSync('**/*{test,spec}*.*', options).length > 0;
    features.ci_cd = globSync('.github/workflows/*.{yml,yaml}', options).length > 0 || globSync('**/*gitlab-ci.yml', options).length > 0;
    features.docker = globSync('**/*Dockerfile*', options).length > 0 || globSync('**/*docker-compose*.yml', options).length > 0;
    features.kubernetes = globSync('**/*k8s*/*.{yml,yaml}', options).length > 0 || globSync('**/helm/**/*', options).length > 0;

    // Content-based detection using glob to find candidate files
    const checkContent = (pattern, regex) => {
      const files = globSync(pattern, options);
      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(this.projectPath, file), 'utf8');
          if (regex.test(content)) return true;
        } catch (e) { /* ignore read errors */ }
      }
      return false;
    };

    features.authentication = checkContent('**/*.{js,ts,py,go,java,php,rb}', /jwt|auth|login|passport|oauth/i);
    features.realtime = checkContent('**/*.{js,ts,py,go,java}', /websocket|socket\.io|ws:|real-time|pubsub/i);
    features.api = checkContent('**/*.{js,ts,py,go,java}', /api|endpoint|route|rest|graphql/i);
    features.database = checkContent('**/*.{js,ts,py,go,java,rb}', /database|mongodb|postgres|mysql|redis|mongoose|sequelize|typeorm/i);

    // Calculate score based on features
    const featureCount = Object.values(features).filter(Boolean).length;
    let score = featureCount * 10;
    
    // Add extra complexity for certain features
    if (features.realtime) score += 15;
    if (features.kubernetes) score += 20;
    if (features.authentication && features.api) score += 10;
    
    return {
      detected: features,
      count: featureCount,
      score: Math.min(score, 100)
    };
  }

  /**
   * Analyze the initial user prompt for complexity indicators
   */
  async analyzePrompt(promptText) {
    if (!promptText || promptText.trim() === '') {
      return { score: 0, keywords: [] };
    }
    let score = 0;
    const keywords = [];

    // Add score based on prompt length
    if (promptText.length > 500) score += 20;
    else if (promptText.length > 100) score += 10;

    // Check for keywords and add/subtract from score
    const keywordMap = {
      'api': 20, 'database': 20, 'authentication': 25, 'real-time': 30,
      'enterprise': 30, 'scalable': 25, 'microservices': 30,
      'prototype': -20, 'simple': -10, 'example': -15,
      'test': 10, 'deployment': 15, 'docker': 15, 'kubernetes': 25,
      'ui': 15, 'frontend': 15, 'backend': 15, 'full-stack': 20,
    };

    for (const [kw, value] of Object.entries(keywordMap)) {
      if (new RegExp(`\\b${kw.replace('-', '[- ]?')}\\b`, 'i').test(promptText)) {
        score += value;
        keywords.push(kw);
      }
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      keywords,
      description: `Analyzed prompt of ${promptText.length} characters.`
    };
  }

  /**
   * Analyze team indicators
   */
  async analyzeTeamIndicators() {
    const indicators = {
      multiContributor: false,
      documentation: false,
      codeReviews: false,
      issueTracking: false
    };
    
    const files = await this.getProjectFiles();
    
    // Check for team collaboration indicators
    indicators.documentation = files.some(f => /readme|docs|documentation/i.test(f));
    indicators.codeReviews = files.some(f => /\.github\/pull_request_template/.test(f));
    indicators.issueTracking = files.some(f => /\.github\/issue_template/.test(f));
    
    // Check for CONTRIBUTING file
    if (files.some(f => /contributing/i.test(f))) {
      indicators.multiContributor = true;
    }
    
    const teamScore = Object.values(indicators).filter(Boolean).length * 10;
    
    return {
      indicators,
      score: teamScore,
      isTeamProject: teamScore > 20
    };
  }

  /**
   * Analyze deployment complexity
   */
  async analyzeDeployment() {
    const deployment = {
      docker: false,
      kubernetes: false,
      cicd: false,
      cloudProvider: null,
      monitoring: false
    };
    
    const files = await this.getProjectFiles();
    
    deployment.docker = files.some(f => /dockerfile|docker-compose/.test(f.toLowerCase()));
    deployment.kubernetes = files.some(f => /k8s|kubernetes|helm/.test(f.toLowerCase()));
    deployment.cicd = files.some(f => /\.github\/workflows|\.gitlab-ci|jenkinsfile|\.circleci/.test(f.toLowerCase()));
    
    // Check for cloud providers
    if (files.some(f => /aws|amplify/.test(f.toLowerCase()))) deployment.cloudProvider = 'AWS';
    else if (files.some(f => /azure/.test(f.toLowerCase()))) deployment.cloudProvider = 'Azure';
    else if (files.some(f => /gcp|google-cloud/.test(f.toLowerCase()))) deployment.cloudProvider = 'GCP';
    else if (files.some(f => /vercel|netlify|heroku/.test(f.toLowerCase()))) deployment.cloudProvider = 'PaaS';
    
    deployment.monitoring = files.some(f => /monitoring|prometheus|grafana|datadog|newrelic/.test(f.toLowerCase()));
    
    // Calculate deployment complexity
    let score = 0;
    if (deployment.docker) score += 20;
    if (deployment.kubernetes) score += 30;
    if (deployment.cicd) score += 20;
    if (deployment.cloudProvider) score += 15;
    if (deployment.monitoring) score += 15;
    
    return {
      ...deployment,
      score: Math.min(score, 100)
    };
  }

  /**
   * Analyze testing complexity
   */
  async analyzeTestingComplexity() {
    const files = await this.getProjectFiles();
    const testFiles = files.filter(f => /test|spec/.test(f));
    
    const testing = {
      hasTests: testFiles.length > 0,
      testFileCount: testFiles.length,
      testTypes: {
        unit: false,
        integration: false,
        e2e: false
      }
    };
    
    // Detect test types
    testing.testTypes.unit = testFiles.some(f => /unit|\.test\.|\.spec\./.test(f));
    testing.testTypes.integration = testFiles.some(f => /integration|api\.test|api\.spec/.test(f));
    testing.testTypes.e2e = testFiles.some(f => /e2e|cypress|playwright|selenium/.test(f));
    
    // Calculate testing score
    let score = 0;
    if (testing.hasTests) score += 20;
    if (testing.testTypes.unit) score += 15;
    if (testing.testTypes.integration) score += 20;
    if (testing.testTypes.e2e) score += 25;
    if (testFiles.length > 20) score += 20;
    
    return {
      ...testing,
      score: Math.min(score, 100)
    };
  }

  /**
   * Calculate overall complexity score
   */
  calculateComplexityScore(factors) {
    const weights = Object.entries(this.config.complexityFactors).reduce((acc, [key, value]) => {
      acc[key] = value.weight;
      return acc;
    }, {});
    
    let weightedScore = 0;
    for (const [factor, weight] of Object.entries(weights)) {
      weightedScore += (factors[factor]?.score || 0) * weight;
    }
    
    // Adjust based on project stage
    const stageAdjustment = this.config.projectStages[this.analysis.stage]?.adjustmentFactor || 1.0;
    weightedScore *= stageAdjustment;

    // Apply caps for idea/early/mature stages from config if they exist
    // For now, keeping the original logic as it's more nuanced than just a factor.
    switch (this.analysis.stage) {
      case 'idea':
        weightedScore = Math.max(5, weightedScore);
        break;
      case 'early':
        weightedScore = Math.max(15, weightedScore);
        break;
      case 'mature':
        weightedScore = Math.min(100, weightedScore);
        break;
    }
    
    return Math.round(Math.min(100, weightedScore));
  }

  /**
   * Calculate confidence in analysis
   */
  calculateConfidence(factors) {
    let confidence = 0;
    let factorCount = 0;
    
    // Check how many factors we could analyze
    for (const factor of Object.values(factors)) {
      if (factor && factor.score > 0) {
        confidence += 12.5; // Each factor adds confidence
        factorCount++;
      }
    }
    
    // Adjust confidence based on project stage clarity
    if (this.analysis.stage !== 'unknown') {
      confidence += 20;
    }
    
    return Math.min(100, Math.round(confidence));
  }

  /**
   * Generate recommendations based on analysis
   */
  generateRecommendations() {
    const recommendations = [];
    const score = this.analysis.score;

    let approachFound = false;
    for (const key in this.config.approaches) {
      const approach = this.config.approaches[key];
      const [min, max] = approach.complexityRange;

      if (score >= min && score <= max) {
        recommendations.push({
          approach: approach.name,
          reason: approach.description, // Or a more detailed reason
          confidence: 0.9 // This could also be made dynamic later
        });
        approachFound = true;
        break;
      }
    }

    if (!approachFound) {
       // Fallback for scores outside all defined ranges
       recommendations.push({
        approach: 'Hive-Mind',
        reason: 'Default recommendation due to score being outside defined ranges.',
        confidence: 0.7
      });
    }
    
    // Add stage-specific recommendations
    switch (this.analysis.stage) {
      case 'idea':
        recommendations.push({
          focus: 'Planning and Architecture',
          suggestion: 'Focus on specification and design before implementation'
        });
        break;
      case 'early':
        recommendations.push({
          focus: 'Foundation Building',
          suggestion: 'Establish patterns and standards early'
        });
        break;
      case 'active':
        recommendations.push({
          focus: 'Feature Development',
          suggestion: 'Maintain consistency while adding features'
        });
        break;
      case 'mature':
        recommendations.push({
          focus: 'Maintenance and Optimization',
          suggestion: 'Focus on refactoring and performance'
        });
        break;
    }
    
    return recommendations;
  }

  /**
   * Get project files recursively
   */
  async getProjectFiles() {
    const files = [];
    const ignoreDirs = ['node_modules', '.git', 'dist', 'build', '.next', '__pycache__', 'venv', 'env'];
    
    function walkDir(dir, prefix = '') {
      try {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const relativePath = prefix ? path.join(prefix, item) : item;
          
          // Skip ignored directories
          if (ignoreDirs.includes(item)) continue;
          
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            walkDir(fullPath, relativePath);
          } else {
            files.push(relativePath);
          }
        }
      } catch (e) {
        // Ignore errors
      }
    }
    
    walkDir(this.projectPath);
    return files;
  }

  /**
   * Get size description
   */
  getSizeDescription(fileCount) {
    if (fileCount < 10) return 'Tiny project';
    if (fileCount < 50) return 'Small project';
    if (fileCount < 200) return 'Medium project';
    if (fileCount < 500) return 'Large project';
    return 'Very large project';
  }

  /**
   * Default analysis for errors
   */
  getDefaultAnalysis() {
    return {
      score: 50,
      stage: 'unknown',
      factors: {},
      recommendations: [{
        approach: 'Hive-Mind',
        reason: 'Default recommendation due to analysis error',
        confidence: 0.5
      }],
      confidence: 0,
      error: true
    };
  }
}

// CLI execution
if (require.main === module) {
  const projectPath = process.argv[2] || process.cwd();
  const promptText = process.argv[3] || ''; // Allow passing prompt as second arg
  const analyzer = new ComplexityAnalyzer(projectPath);
  analyzer.analyze({ promptText }).then(result => {
    console.log(JSON.stringify(result, null, 2));
  });
}

module.exports = ComplexityAnalyzer;