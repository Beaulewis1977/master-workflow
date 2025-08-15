/**
 * Business Logic Extractor - Simplified Stub Version
 * Extracts business logic and domain models without external dependencies
 * 
 * @author Claude Code Analyzer Agent  
 * @version 1.0.0-stub
 */

const fs = require('fs').promises;
const path = require('path');

class BusinessLogicExtractor {
  constructor(sharedMemory) {
    this.sharedMemory = sharedMemory;
    this.extractedLogic = new Map();
    
    // Business logic indicators
    this.businessIndicators = {
      domainModels: {
        patterns: ['class.*User', 'class.*Product', 'class.*Order', 'class.*Customer'],
        keywords: ['entity', 'model', 'domain', 'aggregate']
      },
      businessRules: {
        patterns: ['validate', 'calculate', 'process', 'verify', 'check'],
        keywords: ['business', 'rule', 'policy', 'constraint']
      },
      workflows: {
        patterns: ['workflow', 'process', 'step', 'pipeline'],
        keywords: ['orchestration', 'saga', 'state', 'transition']
      },
      services: {
        patterns: ['Service', 'Manager', 'Handler', 'Processor'],
        keywords: ['service', 'use-case', 'interactor', 'command']
      }
    };
    
    // Data flow patterns
    this.dataFlowPatterns = {
      input: ['request', 'input', 'param', 'body', 'form'],
      processing: ['transform', 'map', 'filter', 'reduce', 'compute'],
      output: ['response', 'result', 'return', 'export', 'send'],
      storage: ['save', 'store', 'persist', 'create', 'update', 'delete']
    };
    
    // Domain concepts
    this.domainConcepts = {
      financial: ['payment', 'invoice', 'transaction', 'account', 'balance'],
      ecommerce: ['product', 'order', 'cart', 'shipping', 'inventory'],
      user: ['user', 'profile', 'authentication', 'authorization', 'role'],
      content: ['article', 'post', 'comment', 'media', 'document']
    };
  }
  
  /**
   * Main business logic extraction method
   */
  async extractBusinessLogic(projectPath) {
    const analysisId = `business-logic-${Date.now()}`;
    
    try {
      const files = await this.scanCodeFiles(projectPath);
      
      const result = {
        domainModels: [],
        businessRules: [],
        workflows: [],
        services: [],
        dataFlows: [],
        concepts: {},
        complexity: {},
        recommendations: [],
        timestamp: Date.now()
      };
      
      // Extract different types of business logic
      for (const file of files) {
        const content = await this.readFile(file.path);
        if (content) {
          await this.analyzeFileForBusinessLogic(file, content, result);
        }
      }
      
      // Analyze domain concepts
      result.concepts = this.analyzeDomainConcepts(result);
      
      // Calculate complexity metrics
      result.complexity = this.calculateBusinessComplexity(result);
      
      // Generate recommendations
      result.recommendations = this.generateBusinessRecommendations(result);
      
      // Store results
      await this.storeResults(analysisId, result);
      
      return result;
      
    } catch (error) {
      console.error('Business logic extraction error:', error);
      return {
        domainModels: [],
        businessRules: [],
        workflows: [],
        services: [],
        dataFlows: [],
        concepts: {},
        complexity: {},
        recommendations: [],
        error: error.message
      };
    }
  }
  
  /**
   * Analyze file for business logic
   */
  async analyzeFileForBusinessLogic(file, content, result) {
    const fileName = path.basename(file.path);
    const fileExt = path.extname(fileName);
    
    // Skip non-code files
    if (!this.isCodeFile(fileName)) {
      return;
    }
    
    // Extract domain models
    const models = this.extractDomainModels(content, file.path);
    result.domainModels.push(...models);
    
    // Extract business rules
    const rules = this.extractBusinessRules(content, file.path);
    result.businessRules.push(...rules);
    
    // Extract workflows
    const workflows = this.extractWorkflows(content, file.path);
    result.workflows.push(...workflows);
    
    // Extract services
    const services = this.extractServices(content, file.path);
    result.services.push(...services);
    
    // Extract data flows
    const dataFlows = this.extractDataFlows(content, file.path);
    result.dataFlows.push(...dataFlows);
  }
  
  /**
   * Extract domain models from content
   */
  extractDomainModels(content, filePath) {
    const models = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for class definitions
      const classMatch = line.match(/class\s+(\w+)/);
      if (classMatch) {
        const className = classMatch[1];
        
        // Check if it looks like a domain model
        if (this.isDomainModel(className, content)) {
          models.push({
            name: className,
            type: 'domain-model',
            file: filePath,
            line: i + 1,
            properties: this.extractProperties(content, className),
            methods: this.extractMethods(content, className),
            relationships: this.extractRelationships(content, className)
          });
        }
      }
      
      // Look for interfaces/types (TypeScript)
      const interfaceMatch = line.match(/interface\s+(\w+)/);
      if (interfaceMatch) {
        const interfaceName = interfaceMatch[1];
        
        if (this.isDomainModel(interfaceName, content)) {
          models.push({
            name: interfaceName,
            type: 'domain-interface',
            file: filePath,
            line: i + 1,
            properties: this.extractInterfaceProperties(content, interfaceName)
          });
        }
      }
    }
    
    return models;
  }
  
  /**
   * Extract business rules from content
   */
  extractBusinessRules(content, filePath) {
    const rules = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for validation functions
      if (this.containsBusinessRulePattern(line)) {
        const rule = this.analyzeBusinessRule(line, lines, i, filePath);
        if (rule) {
          rules.push(rule);
        }
      }
    }
    
    return rules;
  }
  
  /**
   * Extract workflows from content
   */
  extractWorkflows(content, filePath) {
    const workflows = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for workflow patterns
      if (this.containsWorkflowPattern(line)) {
        const workflow = {
          name: this.extractWorkflowName(line),
          type: 'workflow',
          file: filePath,
          line: i + 1,
          steps: this.extractWorkflowSteps(content, i),
          complexity: 'medium'
        };
        
        workflows.push(workflow);
      }
    }
    
    return workflows;
  }
  
  /**
   * Extract services from content
   */
  extractServices(content, filePath) {
    const services = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for service classes
      const serviceMatch = line.match(/class\s+(\w*Service|\w*Manager|\w*Handler)/);
      if (serviceMatch) {
        const serviceName = serviceMatch[1];
        
        services.push({
          name: serviceName,
          type: 'service',
          file: filePath,
          line: i + 1,
          methods: this.extractServiceMethods(content, serviceName),
          dependencies: this.extractServiceDependencies(content, serviceName)
        });
      }
    }
    
    return services;
  }
  
  /**
   * Extract data flows from content
   */
  extractDataFlows(content, filePath) {
    const dataFlows = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for data transformation patterns
      for (const [flowType, patterns] of Object.entries(this.dataFlowPatterns)) {
        for (const pattern of patterns) {
          if (line.toLowerCase().includes(pattern)) {
            dataFlows.push({
              type: flowType,
              pattern: pattern,
              file: filePath,
              line: i + 1,
              context: line.trim()
            });
          }
        }
      }
    }
    
    // Group and deduplicate
    return this.groupDataFlows(dataFlows);
  }
  
  /**
   * Helper methods for extraction
   */
  
  isDomainModel(name, content) {
    const domainKeywords = ['user', 'product', 'order', 'customer', 'account', 'item'];
    return domainKeywords.some(keyword => 
      name.toLowerCase().includes(keyword) || 
      content.toLowerCase().includes(`${name.toLowerCase()}.*entity`)
    );
  }
  
  extractProperties(content, className) {
    const properties = [];
    const classRegex = new RegExp(`class\\s+${className}[\\s\\S]*?\\{([\\s\\S]*?)\\}`, 'i');
    const classMatch = content.match(classRegex);
    
    if (classMatch) {
      const classBody = classMatch[1];
      const propMatches = classBody.match(/this\.(\w+)\s*=/g) || [];
      
      for (const match of propMatches) {
        const propName = match.match(/this\.(\w+)/)[1];
        properties.push({
          name: propName,
          type: 'property',
          access: 'public'
        });
      }
    }
    
    return properties;
  }
  
  extractMethods(content, className) {
    const methods = [];
    const classRegex = new RegExp(`class\\s+${className}[\\s\\S]*?\\{([\\s\\S]*?)\\}`, 'i');
    const classMatch = content.match(classRegex);
    
    if (classMatch) {
      const classBody = classMatch[1];
      const methodMatches = classBody.match(/(\w+)\s*\([^)]*\)\s*\{/g) || [];
      
      for (const match of methodMatches) {
        const methodName = match.match(/(\w+)\s*\(/)[1];
        if (methodName !== 'constructor') {
          methods.push({
            name: methodName,
            type: 'method',
            parameters: this.extractMethodParameters(match)
          });
        }
      }
    }
    
    return methods;
  }
  
  extractRelationships(content, className) {
    const relationships = [];
    
    // Simple heuristic: look for other class names in the class
    const classNames = content.match(/class\s+(\w+)/g) || [];
    const otherClasses = classNames
      .map(match => match.match(/class\s+(\w+)/)[1])
      .filter(name => name !== className);
    
    for (const otherClass of otherClasses) {
      if (content.includes(`new ${otherClass}`) || content.includes(`${otherClass}.`)) {
        relationships.push({
          type: 'uses',
          target: otherClass,
          relationship: 'dependency'
        });
      }
    }
    
    return relationships;
  }
  
  containsBusinessRulePattern(line) {
    const rulePatterns = ['validate', 'verify', 'check', 'ensure', 'require', 'must'];
    return rulePatterns.some(pattern => line.toLowerCase().includes(pattern));
  }
  
  analyzeBusinessRule(line, allLines, lineIndex, filePath) {
    const functionMatch = line.match(/(\w+)\s*\([^)]*\)/);
    
    if (functionMatch) {
      return {
        name: functionMatch[1],
        type: 'business-rule',
        file: filePath,
        line: lineIndex + 1,
        context: line.trim(),
        complexity: this.calculateRuleComplexity(allLines, lineIndex)
      };
    }
    
    return null;
  }
  
  containsWorkflowPattern(line) {
    const workflowPatterns = ['workflow', 'process', 'pipeline', 'orchestrate', 'saga'];
    return workflowPatterns.some(pattern => line.toLowerCase().includes(pattern));
  }
  
  extractWorkflowName(line) {
    const match = line.match(/(\w*workflow|\w*process|\w*pipeline)/i);
    return match ? match[1] : 'UnnamedWorkflow';
  }
  
  extractWorkflowSteps(content, startIndex) {
    const steps = [];
    const lines = content.split('\n');
    
    // Look for sequential steps in the next few lines
    for (let i = startIndex + 1; i < Math.min(startIndex + 10, lines.length); i++) {
      const line = lines[i];
      if (line.includes('step') || line.includes('then') || line.includes('next')) {
        steps.push({
          order: steps.length + 1,
          description: line.trim(),
          line: i + 1
        });
      }
    }
    
    return steps;
  }
  
  extractServiceMethods(content, serviceName) {
    return this.extractMethods(content, serviceName);
  }
  
  extractServiceDependencies(content, serviceName) {
    const dependencies = [];
    
    // Look for constructor parameters or imports
    const constructorMatch = content.match(new RegExp(`class\\s+${serviceName}[\\s\\S]*?constructor\\s*\\(([^)]+)\\)`, 'i'));
    
    if (constructorMatch) {
      const params = constructorMatch[1].split(',');
      for (const param of params) {
        const paramName = param.trim().split(':')[0].trim();
        if (paramName) {
          dependencies.push({
            name: paramName,
            type: 'constructor-dependency'
          });
        }
      }
    }
    
    return dependencies;
  }
  
  groupDataFlows(dataFlows) {
    const grouped = {};
    
    for (const flow of dataFlows) {
      if (!grouped[flow.file]) {
        grouped[flow.file] = {};
      }
      
      if (!grouped[flow.file][flow.type]) {
        grouped[flow.file][flow.type] = [];
      }
      
      grouped[flow.file][flow.type].push(flow);
    }
    
    return Object.entries(grouped).map(([file, types]) => ({
      file,
      flows: types
    }));
  }
  
  /**
   * Analyze domain concepts
   */
  analyzeDomainConcepts(result) {
    const concepts = {};
    
    for (const [domain, keywords] of Object.entries(this.domainConcepts)) {
      concepts[domain] = {
        score: 0,
        indicators: [],
        models: []
      };
      
      // Check domain models
      for (const model of result.domainModels) {
        for (const keyword of keywords) {
          if (model.name.toLowerCase().includes(keyword)) {
            concepts[domain].score += 1;
            concepts[domain].indicators.push(keyword);
            concepts[domain].models.push(model.name);
          }
        }
      }
      
      // Check services  
      for (const service of result.services) {
        for (const keyword of keywords) {
          if (service.name.toLowerCase().includes(keyword)) {
            concepts[domain].score += 0.5;
            concepts[domain].indicators.push(keyword);
          }
        }
      }
    }
    
    // Remove empty concepts
    return Object.fromEntries(
      Object.entries(concepts).filter(([_, concept]) => concept.score > 0)
    );
  }
  
  /**
   * Calculate business complexity
   */
  calculateBusinessComplexity(result) {
    return {
      modelComplexity: result.domainModels.length * 2,
      ruleComplexity: result.businessRules.length * 1.5,
      workflowComplexity: result.workflows.reduce((sum, wf) => sum + wf.steps.length, 0),
      serviceComplexity: result.services.reduce((sum, svc) => sum + svc.methods.length, 0),
      overallScore: this.calculateOverallComplexity(result)
    };
  }
  
  calculateOverallComplexity(result) {
    const weights = {
      models: result.domainModels.length * 0.3,
      rules: result.businessRules.length * 0.25,
      workflows: result.workflows.length * 0.25,
      services: result.services.length * 0.2
    };
    
    return Object.values(weights).reduce((sum, val) => sum + val, 0);
  }
  
  calculateRuleComplexity(lines, startIndex) {
    let complexity = 1;
    
    // Check next few lines for complexity indicators
    for (let i = startIndex; i < Math.min(startIndex + 5, lines.length); i++) {
      const line = lines[i];
      if (line.includes('if') || line.includes('switch') || line.includes('for')) {
        complexity++;
      }
    }
    
    return complexity > 3 ? 'high' : complexity > 1 ? 'medium' : 'low';
  }
  
  /**
   * Generate business recommendations
   */
  generateBusinessRecommendations(result) {
    const recommendations = [];
    
    // Domain model recommendations
    if (result.domainModels.length === 0) {
      recommendations.push({
        type: 'domain-modeling',
        priority: 'medium',
        title: 'Add Domain Models',
        description: 'Consider creating explicit domain models to represent business entities',
        impact: 'maintainability'
      });
    }
    
    // Business rules recommendations
    if (result.businessRules.length === 0) {
      recommendations.push({
        type: 'business-rules',
        priority: 'medium',
        title: 'Extract Business Rules',
        description: 'Consider extracting business rules into separate, testable functions',
        impact: 'testability'
      });
    }
    
    // Service organization recommendations
    if (result.services.length === 0 && result.domainModels.length > 3) {
      recommendations.push({
        type: 'service-layer',
        priority: 'high',
        title: 'Add Service Layer',
        description: 'Consider adding service classes to manage business logic',
        impact: 'architecture'
      });
    }
    
    // Complexity recommendations
    if (result.complexity.overallScore > 20) {
      recommendations.push({
        type: 'complexity',
        priority: 'high',
        title: 'Reduce Business Logic Complexity',
        description: 'High business logic complexity detected. Consider refactoring.',
        impact: 'maintainability'
      });
    }
    
    return recommendations;
  }
  
  /**
   * Helper methods
   */
  
  async readFile(filePath) {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      return null;
    }
  }
  
  async scanCodeFiles(projectPath) {
    const files = [];
    
    const scanDir = async (dir) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory() && !this.shouldSkipDirectory(entry.name)) {
            await scanDir(fullPath);
          } else if (entry.isFile() && this.isCodeFile(entry.name)) {
            files.push({ path: fullPath, name: entry.name });
          }
        }
      } catch (error) {
        // Ignore permission errors
      }
    };
    
    await scanDir(projectPath);
    return files;
  }
  
  shouldSkipDirectory(name) {
    return ['node_modules', '.git', 'dist', 'build', '.next', 'coverage'].includes(name);
  }
  
  isCodeFile(fileName) {
    const codeExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cs', '.go', '.php'];
    return codeExtensions.some(ext => fileName.endsWith(ext));
  }
  
  extractMethodParameters(methodSignature) {
    const paramMatch = methodSignature.match(/\(([^)]*)\)/);
    if (paramMatch) {
      return paramMatch[1].split(',').map(p => p.trim()).filter(p => p.length > 0);
    }
    return [];
  }
  
  extractInterfaceProperties(content, interfaceName) {
    const properties = [];
    const interfaceRegex = new RegExp(`interface\\s+${interfaceName}[\\s\\S]*?\\{([\\s\\S]*?)\\}`, 'i');
    const interfaceMatch = content.match(interfaceRegex);
    
    if (interfaceMatch) {
      const interfaceBody = interfaceMatch[1];
      const propMatches = interfaceBody.match(/(\w+)\s*:\s*(\w+)/g) || [];
      
      for (const match of propMatches) {
        const [, name, type] = match.match(/(\w+)\s*:\s*(\w+)/);
        properties.push({
          name,
          type,
          kind: 'interface-property'
        });
      }
    }
    
    return properties;
  }
  
  /**
   * Store results in shared memory
   */
  async storeResults(analysisId, results) {
    try {
      await this.sharedMemory.set(
        `business-logic:${analysisId}`,
        results,
        {
          namespace: this.sharedMemory.namespaces?.TASK_RESULTS || 'task-results',
          dataType: this.sharedMemory.dataTypes?.PERSISTENT || 'persistent',
          ttl: 3600000 // 1 hour
        }
      );
    } catch (error) {
      console.warn('Failed to store business logic analysis results:', error);
    }
  }
  
  /**
   * Get analysis summary
   */
  getAnalysisSummary(result) {
    return {
      domainModelCount: result.domainModels.length,
      businessRuleCount: result.businessRules.length,
      workflowCount: result.workflows.length,
      serviceCount: result.services.length,
      conceptCount: Object.keys(result.concepts).length,
      complexityScore: result.complexity.overallScore,
      recommendationCount: result.recommendations.length
    };
  }
}

module.exports = BusinessLogicExtractor;