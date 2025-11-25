/**
 * Pattern Discovery Engine
 * =========================
 * AST-based pattern detection, code smell identification,
 * and ML-powered bug prediction.
 */

import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';
import * as babelParser from '@babel/parser';
import _traverse from '@babel/traverse';

// Handle both ESM and CJS default exports
const traverse = _traverse.default || _traverse;

export class PatternDiscovery extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      maxFiles: options.maxFiles || 1000,
      minPatternOccurrences: options.minPatternOccurrences || 3,
      detectAntiPatterns: options.detectAntiPatterns !== false,
      detectCodeSmells: options.detectCodeSmells !== false,
      predictBugs: options.predictBugs !== false,
      verbose: options.verbose || false
    };

    this.patterns = new Map();
    this.antiPatterns = new Map();
    this.codeSmells = [];
    this.bugPredictions = [];
    
    this.metrics = {
      filesAnalyzed: 0,
      patternsFound: 0,
      antiPatternsFound: 0,
      codeSmellsFound: 0,
      bugRisk: 0
    };

    // Known patterns and anti-patterns
    this.knownPatterns = this.initializeKnownPatterns();
    this.knownAntiPatterns = this.initializeKnownAntiPatterns();
    this.codeSmellRules = this.initializeCodeSmellRules();
  }

  log(msg) { if (this.options.verbose) console.log(`[Pattern] ${msg}`); }

  async initialize() {
    this.log('Initializing Pattern Discovery Engine...');
    this.emit('initialized');
    return true;
  }

  initializeKnownPatterns() {
    return {
      singleton: {
        name: 'Singleton',
        regex: /static\s+getInstance|private\s+static\s+instance|\.instance\s*=/,
        description: 'Ensures a class has only one instance'
      },
      factory: {
        name: 'Factory',
        regex: /create[A-Z]\w+|factory|Factory|\.create\(/,
        description: 'Creates objects without specifying exact class'
      },
      observer: {
        name: 'Observer',
        regex: /addEventListener|on\(['"]\w+['"],|subscribe|emit\(/,
        description: 'Defines subscription mechanism'
      },
      decorator: {
        name: 'Decorator',
        regex: /@\w+|decorator|Decorator|wrap\(/,
        description: 'Adds behavior to objects dynamically'
      },
      strategy: {
        name: 'Strategy',
        regex: /strategy|Strategy|setStrategy|getStrategy/,
        description: 'Defines family of algorithms'
      },
      middleware: {
        name: 'Middleware',
        regex: /middleware|use\(\s*\w+\s*\)|next\(\)/,
        description: 'Chain of responsibility pattern'
      },
      repository: {
        name: 'Repository',
        regex: /Repository|findById|findAll|save\(|delete\(/,
        description: 'Mediates between domain and data mapping'
      },
      mvc: {
        name: 'MVC',
        regex: /Controller|Model|View|render\(|handleRequest/,
        description: 'Model-View-Controller architecture'
      }
    };
  }

  initializeKnownAntiPatterns() {
    return {
      godClass: {
        name: 'God Class',
        check: (content, metrics) => metrics.methods > 20 || metrics.lines > 500,
        severity: 'high',
        description: 'Class that does too much'
      },
      spaghettiCode: {
        name: 'Spaghetti Code',
        check: (content) => (content.match(/goto|GOTO/g) || []).length > 0,
        severity: 'high',
        description: 'Unstructured and difficult to maintain code'
      },
      copyPaste: {
        name: 'Copy-Paste Programming',
        check: (content, metrics) => metrics.duplicateBlocks > 3,
        severity: 'medium',
        description: 'Duplicated code blocks'
      },
      magicNumbers: {
        name: 'Magic Numbers',
        check: (content) => {
          const matches = content.match(/[^a-zA-Z_]\d{2,}[^a-zA-Z_]/g) || [];
          return matches.length > 10;
        },
        severity: 'low',
        description: 'Unexplained numeric literals'
      },
      deepNesting: {
        name: 'Deep Nesting',
        check: (content) => {
          const maxDepth = this.calculateNestingDepth(content);
          return maxDepth > 5;
        },
        severity: 'medium',
        description: 'Excessive nesting of control structures'
      },
      longMethod: {
        name: 'Long Method',
        check: (content, metrics) => metrics.avgMethodLength > 50,
        severity: 'medium',
        description: 'Methods that are too long'
      }
    };
  }

  initializeCodeSmellRules() {
    return [
      {
        name: 'Long Parameter List',
        check: (content) => /\([^)]{100,}\)/.test(content),
        severity: 'medium'
      },
      {
        name: 'Feature Envy',
        check: (content) => {
          const otherClassCalls = (content.match(/this\.\w+\.\w+\.\w+/g) || []).length;
          return otherClassCalls > 10;
        },
        severity: 'medium'
      },
      {
        name: 'Dead Code',
        check: (content) => /\/\/\s*TODO|FIXME|HACK|XXX/.test(content),
        severity: 'low'
      },
      {
        name: 'Inconsistent Naming',
        check: (content) => {
          const camelCase = (content.match(/[a-z][A-Z]/g) || []).length;
          const snakeCase = (content.match(/[a-z]_[a-z]/g) || []).length;
          return camelCase > 10 && snakeCase > 10;
        },
        severity: 'low'
      },
      {
        name: 'Missing Error Handling',
        check: (content) => {
          const asyncCalls = (content.match(/await\s+\w+/g) || []).length;
          const tryCatch = (content.match(/try\s*{/g) || []).length;
          return asyncCalls > 5 && tryCatch < asyncCalls / 3;
        },
        severity: 'high'
      },
      {
        name: 'Console Statements',
        check: (content) => (content.match(/console\.(log|warn|error)/g) || []).length > 5,
        severity: 'low'
      }
    ];
  }

  /**
   * Analyze a codebase for patterns
   */
  async analyzeCodebase(rootPath) {
    this.log(`Analyzing codebase at ${rootPath}...`);
    this.emit('analysis:start', { rootPath });

    const files = await this.findCodeFiles(rootPath);
    this.log(`Found ${files.length} code files`);

    for (const file of files.slice(0, this.options.maxFiles)) {
      try {
        await this.analyzeFile(file);
        this.metrics.filesAnalyzed++;
      } catch (error) {
        this.log(`Error analyzing ${file}: ${error.message}`);
      }
    }

    // Aggregate results
    const results = {
      patterns: this.aggregatePatterns(),
      antiPatterns: Array.from(this.antiPatterns.values()),
      codeSmells: this.codeSmells,
      bugPredictions: this.bugPredictions,
      metrics: this.metrics,
      summary: this.generateSummary()
    };

    this.emit('analysis:complete', results);
    return results;
  }

  async findCodeFiles(rootPath) {
    const files = [];
    const extensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.go', '.rs'];

    const walk = async (dir) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
          
          if (entry.isDirectory()) {
            await walk(fullPath);
          } else if (extensions.includes(path.extname(entry.name))) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip unreadable directories
      }
    };

    await walk(rootPath);
    return files;
  }

  async analyzeFile(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    const metrics = this.calculateFileMetrics(content);
    
    // Try AST-based analysis for JS/TS files
    const ext = path.extname(filePath);
    if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
      try {
        const astMetrics = await this.analyzeAST(content, filePath, ext);
        Object.assign(metrics, astMetrics);
      } catch (error) {
        this.log(`AST parsing failed for ${filePath}: ${error.message}`);
        // Fall back to regex-based analysis
      }
    }

    // Detect design patterns (regex fallback + AST-enhanced)
    for (const [key, pattern] of Object.entries(this.knownPatterns)) {
      if (pattern.regex.test(content)) {
        this.recordPattern(key, pattern, filePath);
      }
    }

    // Detect anti-patterns
    if (this.options.detectAntiPatterns) {
      for (const [key, antiPattern] of Object.entries(this.knownAntiPatterns)) {
        if (antiPattern.check(content, metrics)) {
          this.recordAntiPattern(key, antiPattern, filePath, metrics);
        }
      }
    }

    // Detect code smells
    if (this.options.detectCodeSmells) {
      for (const rule of this.codeSmellRules) {
        if (rule.check(content)) {
          this.codeSmells.push({
            name: rule.name,
            severity: rule.severity,
            file: filePath
          });
          this.metrics.codeSmellsFound++;
        }
      }
    }

    // Bug prediction
    if (this.options.predictBugs) {
      const bugRisk = this.predictBugRisk(content, metrics, filePath);
      if (bugRisk.risk > 0.5) {
        this.bugPredictions.push(bugRisk);
      }
    }
  }

  /**
   * AST-based code analysis using Babel
   */
  async analyzeAST(content, filePath, ext) {
    const isTypeScript = ext === '.ts' || ext === '.tsx';
    const isJSX = ext === '.jsx' || ext === '.tsx';
    
    const ast = babelParser.parse(content, {
      sourceType: 'module',
      plugins: [
        'classProperties',
        'classPrivateProperties',
        'classPrivateMethods',
        'decorators-legacy',
        'exportDefaultFrom',
        'dynamicImport',
        'optionalChaining',
        'nullishCoalescingOperator',
        ...(isTypeScript ? ['typescript'] : []),
        ...(isJSX ? ['jsx'] : [])
      ],
      errorRecovery: true
    });

    const astMetrics = {
      classes: [],
      functions: [],
      imports: [],
      exports: [],
      complexity: 0,
      maxNesting: 0,
      asyncFunctions: 0,
      arrowFunctions: 0,
      callbacks: 0,
      promises: 0
    };

    let currentNesting = 0;

    traverse(ast, {
      // Track classes
      ClassDeclaration: (nodePath) => {
        const node = nodePath.node;
        const classInfo = {
          name: node.id?.name || 'anonymous',
          methods: [],
          properties: [],
          loc: node.loc?.start
        };
        
        (node.body?.body || []).forEach(member => {
          if (member.type === 'ClassMethod') {
            classInfo.methods.push({
              name: member.key?.name || 'anonymous',
              async: member.async,
              static: member.static,
              kind: member.kind
            });
          } else if (member.type === 'ClassProperty') {
            classInfo.properties.push({
              name: member.key?.name || 'anonymous',
              static: member.static
            });
          }
        });
        
        astMetrics.classes.push(classInfo);
        
        // Detect Singleton pattern via AST
        const hasPrivateInstance = classInfo.properties.some(p => 
          p.name === 'instance' && p.static
        );
        const hasGetInstance = classInfo.methods.some(m => 
          m.name === 'getInstance' && m.static
        );
        if (hasPrivateInstance || hasGetInstance) {
          this.recordPattern('singleton', this.knownPatterns.singleton, filePath);
        }
      },

      // Track functions
      FunctionDeclaration: (nodePath) => {
        const node = nodePath.node;
        astMetrics.functions.push({
          name: node.id?.name || 'anonymous',
          async: node.async,
          params: node.params.length,
          loc: node.loc?.start
        });
        if (node.async) astMetrics.asyncFunctions++;
      },

      // Track arrow functions
      ArrowFunctionExpression: () => {
        astMetrics.arrowFunctions++;
      },

      // Track imports
      ImportDeclaration: (nodePath) => {
        const node = nodePath.node;
        astMetrics.imports.push({
          source: node.source.value,
          specifiers: node.specifiers.map(s => s.local?.name)
        });
      },

      // Track exports
      ExportNamedDeclaration: () => {
        astMetrics.exports.push({ type: 'named' });
      },
      ExportDefaultDeclaration: () => {
        astMetrics.exports.push({ type: 'default' });
      },

      // Calculate cyclomatic complexity
      IfStatement: () => { astMetrics.complexity++; },
      ConditionalExpression: () => { astMetrics.complexity++; },
      SwitchCase: () => { astMetrics.complexity++; },
      ForStatement: () => { astMetrics.complexity++; },
      ForInStatement: () => { astMetrics.complexity++; },
      ForOfStatement: () => { astMetrics.complexity++; },
      WhileStatement: () => { astMetrics.complexity++; },
      DoWhileStatement: () => { astMetrics.complexity++; },
      CatchClause: () => { astMetrics.complexity++; },
      LogicalExpression: (nodePath) => {
        if (nodePath.node.operator === '&&' || nodePath.node.operator === '||') {
          astMetrics.complexity++;
        }
      },

      // Track nesting depth
      BlockStatement: {
        enter: () => {
          currentNesting++;
          astMetrics.maxNesting = Math.max(astMetrics.maxNesting, currentNesting);
        },
        exit: () => {
          currentNesting--;
        }
      },

      // Detect callback patterns
      CallExpression: (nodePath) => {
        const node = nodePath.node;
        const callee = node.callee;
        
        // Check for .then() - Promise pattern
        if (callee.type === 'MemberExpression' && callee.property?.name === 'then') {
          astMetrics.promises++;
        }
        
        // Check for callbacks (function as last argument)
        const lastArg = node.arguments[node.arguments.length - 1];
        if (lastArg && (lastArg.type === 'FunctionExpression' || lastArg.type === 'ArrowFunctionExpression')) {
          astMetrics.callbacks++;
        }

        // Detect Observer pattern
        if (callee.type === 'MemberExpression') {
          const methodName = callee.property?.name;
          if (['addEventListener', 'on', 'subscribe', 'emit'].includes(methodName)) {
            this.recordPattern('observer', this.knownPatterns.observer, filePath);
          }
        }

        // Detect Factory pattern
        if (callee.type === 'Identifier' && /^create[A-Z]/.test(callee.name)) {
          this.recordPattern('factory', this.knownPatterns.factory, filePath);
        }
      }
    });

    // Calculate derived metrics
    astMetrics.cyclomaticComplexity = astMetrics.complexity + 1;
    astMetrics.methodCount = astMetrics.classes.reduce((sum, c) => sum + c.methods.length, 0) + astMetrics.functions.length;
    
    return astMetrics;
  }

  calculateFileMetrics(content) {
    const lines = content.split('\n');
    const methods = (content.match(/function\s+\w+|=>\s*{|\w+\s*\([^)]*\)\s*{/g) || []).length;
    const classes = (content.match(/class\s+\w+/g) || []).length;
    const imports = (content.match(/import\s+|require\s*\(/g) || []).length;
    const comments = (content.match(/\/\/|\/\*|\*\//g) || []).length;

    // Calculate duplicate blocks (simple hash-based)
    const blockHashes = new Set();
    const duplicateBlocks = lines.reduce((count, line, i) => {
      if (i + 5 < lines.length) {
        const block = lines.slice(i, i + 5).join('').replace(/\s/g, '');
        if (block.length > 50) {
          if (blockHashes.has(block)) count++;
          blockHashes.add(block);
        }
      }
      return count;
    }, 0);

    return {
      lines: lines.length,
      methods,
      classes,
      imports,
      comments,
      duplicateBlocks,
      avgMethodLength: methods > 0 ? lines.length / methods : 0,
      commentRatio: lines.length > 0 ? comments / lines.length : 0
    };
  }

  calculateNestingDepth(content) {
    let maxDepth = 0;
    let currentDepth = 0;
    
    for (const char of content) {
      if (char === '{') {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      } else if (char === '}') {
        currentDepth--;
      }
    }
    
    return maxDepth;
  }

  recordPattern(key, pattern, filePath) {
    if (!this.patterns.has(key)) {
      this.patterns.set(key, {
        ...pattern,
        occurrences: [],
        count: 0
      });
    }
    
    const p = this.patterns.get(key);
    p.occurrences.push(filePath);
    p.count++;
    this.metrics.patternsFound++;
  }

  recordAntiPattern(key, antiPattern, filePath, metrics) {
    if (!this.antiPatterns.has(key)) {
      this.antiPatterns.set(key, {
        ...antiPattern,
        occurrences: [],
        count: 0
      });
    }
    
    const ap = this.antiPatterns.get(key);
    ap.occurrences.push({ file: filePath, metrics });
    ap.count++;
    this.metrics.antiPatternsFound++;
  }

  predictBugRisk(content, metrics, filePath) {
    let risk = 0;
    const factors = [];

    // High complexity
    if (metrics.methods > 15) {
      risk += 0.2;
      factors.push('high method count');
    }

    // Low comment ratio
    if (metrics.commentRatio < 0.05) {
      risk += 0.1;
      factors.push('low documentation');
    }

    // Deep nesting
    const nesting = this.calculateNestingDepth(content);
    if (nesting > 4) {
      risk += 0.15;
      factors.push('deep nesting');
    }

    // Long methods
    if (metrics.avgMethodLength > 40) {
      risk += 0.15;
      factors.push('long methods');
    }

    // Many dependencies
    if (metrics.imports > 15) {
      risk += 0.1;
      factors.push('many dependencies');
    }

    // Duplicate code
    if (metrics.duplicateBlocks > 2) {
      risk += 0.15;
      factors.push('duplicate code');
    }

    // Error handling
    const asyncOps = (content.match(/await|\.then\(/g) || []).length;
    const errorHandling = (content.match(/catch|\.catch\(/g) || []).length;
    if (asyncOps > 3 && errorHandling < asyncOps / 2) {
      risk += 0.15;
      factors.push('insufficient error handling');
    }

    this.metrics.bugRisk = Math.max(this.metrics.bugRisk, risk);

    return {
      file: filePath,
      risk: Math.min(1, risk),
      factors,
      recommendation: risk > 0.6 ? 'High priority refactoring needed' :
                      risk > 0.3 ? 'Consider refactoring' : 'Acceptable'
    };
  }

  aggregatePatterns() {
    return Array.from(this.patterns.entries())
      .filter(([_, p]) => p.count >= this.options.minPatternOccurrences)
      .map(([key, p]) => ({
        name: p.name,
        description: p.description,
        count: p.count,
        files: p.occurrences.slice(0, 5)
      }));
  }

  generateSummary() {
    const totalIssues = this.metrics.antiPatternsFound + this.metrics.codeSmellsFound;
    const healthScore = Math.max(0, 100 - totalIssues * 2 - this.metrics.bugRisk * 20);

    return {
      healthScore: Math.round(healthScore),
      grade: healthScore >= 80 ? 'A' : healthScore >= 60 ? 'B' : healthScore >= 40 ? 'C' : 'D',
      topPatterns: this.aggregatePatterns().slice(0, 3).map(p => p.name),
      topIssues: [
        ...Array.from(this.antiPatterns.values()).slice(0, 2).map(a => a.name),
        ...this.codeSmells.slice(0, 2).map(s => s.name)
      ],
      recommendations: this.generateRecommendations()
    };
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.metrics.antiPatternsFound > 5) {
      recommendations.push('Address anti-patterns to improve maintainability');
    }
    if (this.metrics.codeSmellsFound > 10) {
      recommendations.push('Refactor code smells to reduce technical debt');
    }
    if (this.metrics.bugRisk > 0.5) {
      recommendations.push('High bug risk detected - prioritize testing');
    }
    if (this.metrics.patternsFound < 3) {
      recommendations.push('Consider applying design patterns for better structure');
    }

    return recommendations;
  }

  getStatus() {
    return {
      initialized: true,
      metrics: this.metrics,
      patternsFound: this.patterns.size,
      antiPatternsFound: this.antiPatterns.size
    };
  }
}

export default PatternDiscovery;
