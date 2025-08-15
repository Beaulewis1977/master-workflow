/**
 * Architecture Detection Engine - Simplified Stub Version  
 * Detects software architecture patterns without external dependencies
 * 
 * @author Claude Code Analyzer Agent
 * @version 1.0.0-stub
 */

const fs = require('fs').promises;
const path = require('path');

class ArchitectureDetectionEngine {
  constructor(sharedMemory) {
    this.sharedMemory = sharedMemory;
    this.detectedArchitectures = new Map();
    
    // Architecture pattern signatures
    this.architecturePatterns = {
      mvc: {
        indicators: ['controller', 'model', 'view', 'routes'],
        confidence: 0.8,
        description: 'Model-View-Controller pattern'
      },
      mvp: {
        indicators: ['presenter', 'view', 'model'],
        confidence: 0.7,
        description: 'Model-View-Presenter pattern'
      },
      mvvm: {
        indicators: ['viewmodel', 'binding', 'observable'],
        confidence: 0.7,
        description: 'Model-View-ViewModel pattern'
      },
      layered: {
        indicators: ['service', 'repository', 'dto', 'entity', 'dao'],
        confidence: 0.8,
        description: 'Layered/N-tier architecture'
      },
      microservices: {
        indicators: ['service', 'docker', 'kubernetes', 'api-gateway', 'consul'],
        confidence: 0.9,
        description: 'Microservices architecture'
      },
      eventdriven: {
        indicators: ['event', 'publish', 'subscribe', 'queue', 'kafka'],
        confidence: 0.8,
        description: 'Event-driven architecture'
      },
      hexagonal: {
        indicators: ['port', 'adapter', 'boundary', 'usecase'],
        confidence: 0.7,
        description: 'Hexagonal/Ports and Adapters architecture'
      },
      restful: {
        indicators: ['rest', 'api', 'resource', 'endpoint'],
        confidence: 0.6,
        description: 'RESTful API architecture'
      }
    };
    
    // Technology stack indicators
    this.techStackIndicators = {
      frontend: {
        react: ['react', 'jsx', 'component', 'hooks'],
        vue: ['vue', 'component', 'vuex'],
        angular: ['angular', 'component', 'service', 'module'],
        svelte: ['svelte', '.svelte'],
        vanilla: ['html', 'css', 'javascript']
      },
      backend: {
        nodejs: ['express', 'koa', 'fastify', 'nest'],
        python: ['django', 'flask', 'fastapi', 'tornado'],
        java: ['spring', 'springframework', 'boot'],
        csharp: ['asp.net', 'mvc', 'core'],
        go: ['gin', 'echo', 'fiber'],
        php: ['laravel', 'symfony', 'codeigniter']
      },
      database: {
        sql: ['mysql', 'postgresql', 'sqlite', 'mssql'],
        nosql: ['mongodb', 'redis', 'cassandra', 'dynamodb'],
        orm: ['sequelize', 'typeorm', 'mongoose', 'hibernate']
      }
    };
  }
  
  /**
   * Main architecture detection method
   */
  async detectArchitecture(projectPath) {
    const analysisId = `architecture-${Date.now()}`;
    
    try {
      const files = await this.scanProjectStructure(projectPath);
      const packageInfo = await this.analyzePackageFiles(projectPath);
      
      const result = {
        type: 'unknown',
        confidence: 0,
        patterns: [],
        techStack: {},
        structure: this.analyzeDirectoryStructure(files),
        recommendations: [],
        timestamp: Date.now()
      };
      
      // Detect architecture patterns
      result.patterns = await this.detectArchitecturePatterns(files);
      
      // Determine primary architecture
      const primaryArch = this.determinePrimaryArchitecture(result.patterns);
      result.type = primaryArch.type;
      result.confidence = primaryArch.confidence;
      
      // Detect technology stack
      result.techStack = await this.detectTechnologyStack(files, packageInfo);
      
      // Generate recommendations
      result.recommendations = this.generateArchitectureRecommendations(result);
      
      // Store results
      await this.storeResults(analysisId, result);
      
      return result;
      
    } catch (error) {
      console.error('Architecture detection error:', error);
      return {
        type: 'unknown',
        confidence: 0,
        patterns: [],
        techStack: {},
        structure: {},
        recommendations: [],
        error: error.message
      };
    }
  }
  
  /**
   * Scan project structure
   */
  async scanProjectStructure(projectPath) {
    const files = [];
    
    const scanDir = async (dir, relativePath = '') => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relPath = path.join(relativePath, entry.name);
          
          if (entry.isDirectory() && !this.shouldSkipDirectory(entry.name)) {
            await scanDir(fullPath, relPath);
          } else if (entry.isFile()) {
            files.push({
              name: entry.name,
              path: fullPath,
              relativePath: relPath,
              extension: path.extname(entry.name),
              directory: path.dirname(relPath)
            });
          }
        }
      } catch (error) {
        // Ignore permission errors
      }
    };
    
    await scanDir(projectPath);
    return files;
  }
  
  /**
   * Analyze package and configuration files
   */
  async analyzePackageFiles(projectPath) {
    const packageInfo = {
      dependencies: [],
      devDependencies: [],
      scripts: {},
      frameworks: [],
      buildTools: []
    };
    
    try {
      // Check package.json
      const packagePath = path.join(projectPath, 'package.json');
      try {
        const packageContent = await fs.readFile(packagePath, 'utf-8');
        const pkg = JSON.parse(packageContent);
        
        packageInfo.dependencies = Object.keys(pkg.dependencies || {});
        packageInfo.devDependencies = Object.keys(pkg.devDependencies || {});
        packageInfo.scripts = pkg.scripts || {};
      } catch (error) {
        // package.json doesn't exist or is invalid
      }
      
      // Check other config files
      const configFiles = ['docker-compose.yml', 'Dockerfile', 'k8s.yaml', 'serverless.yml'];
      for (const configFile of configFiles) {
        try {
          await fs.access(path.join(projectPath, configFile));
          packageInfo.buildTools.push(configFile);
        } catch (error) {
          // Config file doesn't exist
        }
      }
      
    } catch (error) {
      console.warn('Error analyzing package files:', error.message);
    }
    
    return packageInfo;
  }
  
  /**
   * Detect architecture patterns in project
   */
  async detectArchitecturePatterns(files) {
    const patterns = [];
    
    for (const [patternName, config] of Object.entries(this.architecturePatterns)) {
      const matches = this.findArchitectureIndicators(files, config.indicators);
      
      if (matches.length > 0) {
        const confidence = this.calculatePatternConfidence(matches, config.indicators.length);
        
        patterns.push({
          name: patternName,
          description: config.description,
          confidence: confidence * config.confidence,
          indicators: matches,
          score: matches.length
        });
      }
    }
    
    return patterns.sort((a, b) => b.confidence - a.confidence);
  }
  
  /**
   * Find architecture indicators in files
   */
  findArchitectureIndicators(files, indicators) {
    const matches = [];
    
    for (const indicator of indicators) {
      const indicatorFiles = files.filter(file => 
        file.name.toLowerCase().includes(indicator) ||
        file.directory.toLowerCase().includes(indicator) ||
        file.relativePath.toLowerCase().includes(indicator)
      );
      
      if (indicatorFiles.length > 0) {
        matches.push({
          indicator,
          files: indicatorFiles.map(f => f.relativePath),
          count: indicatorFiles.length
        });
      }
    }
    
    return matches;
  }
  
  /**
   * Calculate pattern confidence
   */
  calculatePatternConfidence(matches, totalIndicators) {
    const foundIndicators = matches.length;
    const baseConfidence = foundIndicators / totalIndicators;
    
    // Boost confidence based on file count
    const totalFiles = matches.reduce((sum, match) => sum + match.count, 0);
    const fileBonus = Math.min(0.3, totalFiles * 0.05);
    
    return Math.min(1.0, baseConfidence + fileBonus);
  }
  
  /**
   * Determine primary architecture
   */
  determinePrimaryArchitecture(patterns) {
    if (patterns.length === 0) {
      return { type: 'monolithic', confidence: 0.5 };
    }
    
    const topPattern = patterns[0];
    
    // If confidence is too low, default to monolithic
    if (topPattern.confidence < 0.3) {
      return { type: 'monolithic', confidence: 0.6 };
    }
    
    return {
      type: topPattern.name,
      confidence: topPattern.confidence
    };
  }
  
  /**
   * Detect technology stack
   */
  async detectTechnologyStack(files, packageInfo) {
    const techStack = {
      frontend: [],
      backend: [],
      database: [],
      deployment: [],
      testing: []
    };
    
    // Check file extensions and names
    for (const [category, technologies] of Object.entries(this.techStackIndicators)) {
      for (const [tech, indicators] of Object.entries(technologies)) {
        const confidence = this.calculateTechConfidence(files, packageInfo, indicators);
        
        if (confidence > 0.3) {
          techStack[category].push({
            name: tech,
            confidence,
            indicators: indicators.filter(ind => 
              this.findTechIndicator(files, packageInfo, ind)
            )
          });
        }
      }
    }
    
    // Sort by confidence
    for (const category of Object.keys(techStack)) {
      techStack[category].sort((a, b) => b.confidence - a.confidence);
    }
    
    return techStack;
  }
  
  /**
   * Calculate technology confidence
   */
  calculateTechConfidence(files, packageInfo, indicators) {
    let matches = 0;
    
    for (const indicator of indicators) {
      if (this.findTechIndicator(files, packageInfo, indicator)) {
        matches++;
      }
    }
    
    return matches / indicators.length;
  }
  
  /**
   * Find technology indicator
   */
  findTechIndicator(files, packageInfo, indicator) {
    // Check dependencies
    if (packageInfo.dependencies.includes(indicator) || 
        packageInfo.devDependencies.includes(indicator)) {
      return true;
    }
    
    // Check file names and content
    return files.some(file => 
      file.name.toLowerCase().includes(indicator) ||
      file.relativePath.toLowerCase().includes(indicator)
    );
  }
  
  /**
   * Analyze directory structure
   */
  analyzeDirectoryStructure(files) {
    const structure = {
      depth: 0,
      directories: new Set(),
      commonPatterns: [],
      organization: 'unknown'
    };
    
    // Calculate directory depth and collect directories
    for (const file of files) {
      const dirs = file.directory.split(path.sep).filter(d => d.length > 0);
      structure.depth = Math.max(structure.depth, dirs.length);
      
      for (const dir of dirs) {
        structure.directories.add(dir);
      }
    }
    
    // Detect common organizational patterns
    const dirs = Array.from(structure.directories);
    
    if (dirs.includes('src') && dirs.includes('test')) {
      structure.organization = 'source-based';
      structure.commonPatterns.push('src-test-separation');
    }
    
    if (dirs.includes('components') && dirs.includes('pages')) {
      structure.commonPatterns.push('component-based');
    }
    
    if (dirs.includes('models') && dirs.includes('views') && dirs.includes('controllers')) {
      structure.commonPatterns.push('mvc-directories');
    }
    
    return {
      depth: structure.depth,
      directories: dirs,
      commonPatterns: structure.commonPatterns,
      organization: structure.organization
    };
  }
  
  /**
   * Generate architecture recommendations
   */
  generateArchitectureRecommendations(result) {
    const recommendations = [];
    
    // Low confidence recommendations
    if (result.confidence < 0.5) {
      recommendations.push({
        type: 'structure',
        priority: 'high',
        title: 'Unclear Architecture Pattern',
        description: 'Consider organizing code with clearer architectural patterns',
        impact: 'maintainability'
      });
    }
    
    // Monolithic recommendations
    if (result.type === 'monolithic' && result.structure.depth > 5) {
      recommendations.push({
        type: 'refactoring',
        priority: 'medium',
        title: 'Consider Modularization',
        description: 'Deep directory structure suggests need for better modularization',
        impact: 'scalability'
      });
    }
    
    // Missing test patterns
    if (!result.structure.commonPatterns.includes('src-test-separation')) {
      recommendations.push({
        type: 'testing',
        priority: 'medium',
        title: 'Add Test Organization',
        description: 'Consider separating test files from source code',
        impact: 'testing'
      });
    }
    
    // Technology stack recommendations
    if (result.techStack.database && result.techStack.database.length > 2) {
      recommendations.push({
        type: 'technology',
        priority: 'low',
        title: 'Database Technology Consolidation',
        description: 'Multiple database technologies detected - consider consolidation',
        impact: 'complexity'
      });
    }
    
    return recommendations;
  }
  
  /**
   * Helper methods
   */
  
  shouldSkipDirectory(name) {
    return [
      'node_modules', '.git', 'dist', 'build', '.next', 
      'coverage', 'tmp', 'temp', '.cache', '.vscode'
    ].includes(name);
  }
  
  /**
   * Store results in shared memory
   */
  async storeResults(analysisId, results) {
    try {
      await this.sharedMemory.set(
        `architecture-analysis:${analysisId}`,
        results,
        {
          namespace: this.sharedMemory.namespaces?.TASK_RESULTS || 'task-results',
          dataType: this.sharedMemory.dataTypes?.PERSISTENT || 'persistent',
          ttl: 3600000 // 1 hour
        }
      );
    } catch (error) {
      console.warn('Failed to store architecture analysis results:', error);
    }
  }
  
  /**
   * Get analysis summary
   */
  getAnalysisSummary(result) {
    return {
      primaryArchitecture: result.type,
      confidence: result.confidence,
      patternCount: result.patterns.length,
      techStackCount: Object.values(result.techStack).flat().length,
      structureDepth: result.structure.depth,
      recommendationCount: result.recommendations.length
    };
  }
}

module.exports = ArchitectureDetectionEngine;