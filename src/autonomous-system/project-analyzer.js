/**
 * ProjectAnalyzer - Deep Codebase Analysis Engine
 * ================================================
 * Part of the Autonomous Documentation & Spec-Driven Development System.
 */

import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';

export class ProjectAnalyzer extends EventEmitter {
  constructor(projectRoot, options = {}) {
    super();
    this.projectRoot = path.resolve(projectRoot);
    this.options = {
      maxFiles: options.maxFiles || 10000,
      maxFileSize: options.maxFileSize || 1048576,
      maxDepth: options.maxDepth || 20,
      ignorePatterns: options.ignorePatterns || [
        'node_modules', '.git', 'dist', 'build', 'coverage',
        '.next', '.nuxt', '.cache', '__pycache__', 'venv'
      ],
      includeTests: options.includeTests !== false,
      deepAnalysis: options.deepAnalysis !== false,
      verbose: options.verbose || false
    };

    this.analysis = {
      structure: {},
      dependencies: {},
      components: new Map(),
      patterns: { architectural: [], design: [], coding: [], naming: [] },
      metrics: {},
      documentation: new Map(),
      gaps: [],
      metadata: { analyzedAt: null, duration: 0, filesAnalyzed: 0, errors: [] }
    };

    this.languageMap = {
      '.js': 'javascript', '.mjs': 'javascript', '.cjs': 'javascript',
      '.jsx': 'react', '.ts': 'typescript', '.tsx': 'react-typescript',
      '.py': 'python', '.java': 'java', '.go': 'go', '.rs': 'rust',
      '.rb': 'ruby', '.php': 'php', '.vue': 'vue', '.svelte': 'svelte'
    };
    this.plugins = [];
  }

  registerPlugin(plugin) {
    if (typeof plugin.analyze === 'function') this.plugins.push(plugin);
  }

  log(msg) {
    if (this.options.verbose) console.log(msg);
  }

  async analyzeProject() {
    const startTime = Date.now();
    this.log('🔍 Starting comprehensive project analysis...');
    this.emit('analysis:start', { projectRoot: this.projectRoot });

    try {
      await this.analyzeProjectStructure();
      await this.analyzeDependencies();
      await this.analyzeComponents();
      await this.identifyPatterns();
      await this.calculateMetrics();
      await this.analyzeDocumentation();
      await this.identifyGaps();
      await this.runPlugins();

      this.analysis.metadata.analyzedAt = new Date().toISOString();
      this.analysis.metadata.duration = Date.now() - startTime;
      this.log(`✅ Analysis completed in ${this.analysis.metadata.duration}ms`);
      this.emit('analysis:complete', this.analysis);
      return this.getAnalysisResult();
    } catch (error) {
      this.analysis.metadata.errors.push({ phase: 'analysis', error: error.message });
      this.emit('analysis:error', error);
      throw error;
    }
  }

  async analyzeProjectStructure() {
    this.log('📁 Analyzing project structure...');
    const tree = await this.buildDirectoryTree(this.projectRoot);
    this.analysis.structure = {
      tree,
      depth: this.calculateTreeDepth(tree),
      totalFiles: this.countFiles(tree),
      totalDirectories: this.countDirectories(tree),
      languages: this.identifyLanguages(tree),
      frameworks: await this.identifyFrameworks(),
      projectType: await this.detectProjectType()
    };
    this.log(`   Found ${this.analysis.structure.totalFiles} files`);
  }

  async buildDirectoryTree(dirPath, relativePath = '', depth = 0) {
    if (depth > this.options.maxDepth) return { _truncated: true };
    const items = {};
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        if (this.shouldIgnore(entry.name)) continue;
        const fullPath = path.join(dirPath, entry.name);
        const relative = path.join(relativePath, entry.name);

        if (entry.isDirectory()) {
          items[entry.name] = {
            type: 'directory', path: fullPath, relativePath: relative,
            children: await this.buildDirectoryTree(fullPath, relative, depth + 1)
          };
        } else if (entry.isFile()) {
          const stat = await fs.stat(fullPath).catch(() => null);
          if (stat && stat.size <= this.options.maxFileSize) {
            items[entry.name] = {
              type: 'file', path: fullPath, relativePath: relative,
              size: stat.size, extension: path.extname(entry.name),
              language: this.getLanguage(entry.name)
            };
            this.analysis.metadata.filesAnalyzed++;
          }
        }
      }
    } catch (error) { /* skip unreadable dirs */ }
    return items;
  }

  shouldIgnore(name) {
    return this.options.ignorePatterns.some(p => 
      p.includes('*') ? new RegExp(p.replace(/\*/g, '.*')).test(name) : name === p
    );
  }

  getLanguage(filename) {
    return this.languageMap[path.extname(filename)] || 'unknown';
  }

  async analyzeDependencies() {
    this.log('📦 Analyzing dependencies...');
    const pkgPath = path.join(this.projectRoot, 'package.json');
    if (await this.fileExists(pkgPath)) {
      const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf8'));
      this.analysis.dependencies.node = {
        production: pkg.dependencies || {},
        development: pkg.devDependencies || {},
        scripts: pkg.scripts || {},
        metadata: { name: pkg.name, version: pkg.version, description: pkg.description }
      };
      this.log(`   Found ${Object.keys(pkg.dependencies || {}).length} dependencies`);
    }
    if (this.options.deepAnalysis) await this.analyzeCodeDependencies();
  }

  async analyzeCodeDependencies() {
    const codeFiles = await this.findCodeFiles();
    const importMap = new Map();
    for (const file of codeFiles.slice(0, 500)) {
      try {
        const content = await fs.readFile(file.path, 'utf8');
        const imports = this.extractImports(content, file.extension);
        if (imports.length > 0) {
          importMap.set(file.relativePath, {
            imports,
            internal: imports.filter(i => i.startsWith('.')),
            external: imports.filter(i => !i.startsWith('.'))
          });
        }
      } catch (e) { /* skip */ }
    }
    this.analysis.dependencies.codeImports = Object.fromEntries(importMap);
  }

  extractImports(content, ext) {
    const imports = [];
    if (['.js', '.mjs', '.ts', '.tsx', '.jsx'].includes(ext)) {
      for (const m of content.matchAll(/import\s+.*?from\s+['"]([^'"]+)['"]/g)) imports.push(m[1]);
      for (const m of content.matchAll(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/g)) imports.push(m[1]);
    }
    return [...new Set(imports)];
  }

  async analyzeComponents() {
    this.log('🧩 Analyzing components...');
    const codeFiles = await this.findCodeFiles();
    for (const file of codeFiles) {
      try {
        const content = await fs.readFile(file.path, 'utf8');
        const components = this.extractComponents(content, file);
        for (const c of components) {
          this.analysis.components.set(c.name, { ...c, file: file.relativePath });
        }
      } catch (e) { /* skip */ }
    }
    this.log(`   Found ${this.analysis.components.size} components`);
  }

  extractComponents(content, file) {
    const components = [];
    // Classes
    for (const m of content.matchAll(/(?:export\s+)?(?:default\s+)?class\s+(\w+)/g)) {
      components.push({ name: m[1], type: 'class', language: file.language, isExported: m[0].includes('export') });
    }
    // Functions
    for (const m of content.matchAll(/(?:export\s+)?(?:async\s+)?function\s+(\w+)/g)) {
      if (!components.find(c => c.name === m[1])) {
        components.push({ name: m[1], type: 'function', language: file.language, isExported: m[0].includes('export') });
      }
    }
    // Arrow functions
    for (const m of content.matchAll(/(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\(/g)) {
      if (!components.find(c => c.name === m[1])) {
        components.push({ name: m[1], type: 'arrow-function', language: file.language, isExported: m[0].includes('export') });
      }
    }
    return components;
  }

  async identifyPatterns() {
    this.log('🔍 Identifying patterns...');
    const tree = this.analysis.structure.tree;
    
    // Architectural patterns
    if (this.hasDir(tree, 'models') && this.hasDir(tree, 'views') && this.hasDir(tree, 'controllers')) {
      this.analysis.patterns.architectural.push({ name: 'MVC', confidence: 0.9 });
    }
    if (this.hasDir(tree, 'services') && this.hasDir(tree, 'repositories')) {
      this.analysis.patterns.architectural.push({ name: 'Layered Architecture', confidence: 0.8 });
    }
    if (this.hasDir(tree, 'domain') && this.hasDir(tree, 'infrastructure')) {
      this.analysis.patterns.architectural.push({ name: 'Clean Architecture', confidence: 0.85 });
    }
    if (this.hasDir(tree, 'packages') || this.hasDir(tree, 'apps')) {
      this.analysis.patterns.architectural.push({ name: 'Monorepo', confidence: 0.9 });
    }
    this.log(`   Found ${this.analysis.patterns.architectural.length} architectural patterns`);
  }

  async calculateMetrics() {
    this.log('📊 Calculating metrics...');
    const codeFiles = await this.findCodeFiles();
    let totalLines = 0;
    for (const file of codeFiles.slice(0, 200)) {
      try {
        const content = await fs.readFile(file.path, 'utf8');
        totalLines += content.split('\n').length;
      } catch (e) { /* skip */ }
    }
    this.analysis.metrics = {
      code: {
        totalFiles: this.analysis.structure.totalFiles,
        totalLines,
        totalComponents: this.analysis.components.size,
        avgComponentsPerFile: this.analysis.structure.totalFiles > 0 
          ? (this.analysis.components.size / this.analysis.structure.totalFiles).toFixed(2) : 0
      },
      complexity: { estimated: this.estimateComplexity() },
      quality: {
        testCoverage: await this.estimateTestCoverage(),
        documentationCoverage: this.calculateDocCoverage()
      }
    };
    this.log(`   Total lines: ${totalLines}, Components: ${this.analysis.components.size}`);
  }

  async analyzeDocumentation() {
    this.log('📚 Analyzing documentation...');
    const docFiles = await this.findDocFiles();
    for (const file of docFiles) {
      try {
        const content = await fs.readFile(file.path, 'utf8');
        this.analysis.documentation.set(file.relativePath, {
          file: file.relativePath, size: content.length,
          sections: (content.match(/^#+\s/gm) || []).length,
          hasCodeExamples: content.includes('```')
        });
      } catch (e) { /* skip */ }
    }
    this.log(`   Found ${this.analysis.documentation.size} documentation files`);
  }

  async identifyGaps() {
    this.log('🔍 Identifying gaps...');
    const gaps = [];
    
    if (this.analysis.documentation.size < this.analysis.components.size * 0.3) {
      gaps.push({ type: 'documentation', severity: 'high', description: 'Insufficient documentation coverage', priority: 1 });
    }
    if (this.analysis.metrics.quality.testCoverage < 50) {
      gaps.push({ type: 'testing', severity: 'medium', description: 'Low test coverage', priority: 2 });
    }
    if (this.analysis.patterns.architectural.length === 0) {
      gaps.push({ type: 'architecture', severity: 'medium', description: 'No clear architectural pattern', priority: 3 });
    }
    
    this.analysis.gaps = gaps.sort((a, b) => a.priority - b.priority);
    this.log(`   Found ${gaps.length} improvement opportunities`);
  }

  async runPlugins() {
    for (const plugin of this.plugins) {
      try {
        const result = await plugin.analyze(this.analysis);
        if (result) this.analysis.pluginResults = { ...this.analysis.pluginResults, [result.name]: result };
      } catch (e) { /* skip failed plugins */ }
    }
  }

  // Helper methods
  async fileExists(p) { try { await fs.access(p); return true; } catch { return false; } }
  
  async findCodeFiles() {
    const files = [];
    const collect = async (tree) => {
      for (const [name, item] of Object.entries(tree)) {
        if (item.type === 'file' && this.languageMap[item.extension]) files.push(item);
        else if (item.type === 'directory' && item.children) await collect(item.children);
      }
    };
    await collect(this.analysis.structure.tree);
    return files;
  }

  async findDocFiles() {
    const files = [];
    const collect = async (tree) => {
      for (const [name, item] of Object.entries(tree)) {
        if (item.type === 'file' && ['.md', '.txt', '.rst'].includes(item.extension)) files.push(item);
        else if (item.type === 'directory' && item.children) await collect(item.children);
      }
    };
    await collect(this.analysis.structure.tree);
    return files;
  }

  hasDir(tree, name) {
    for (const [k, v] of Object.entries(tree)) {
      if (k === name && v.type === 'directory') return true;
      if (v.type === 'directory' && v.children && this.hasDir(v.children, name)) return true;
    }
    return false;
  }

  calculateTreeDepth(tree, d = 0) {
    let max = d;
    for (const v of Object.values(tree)) {
      if (v.type === 'directory' && v.children) max = Math.max(max, this.calculateTreeDepth(v.children, d + 1));
    }
    return max;
  }

  countFiles(tree) {
    let count = 0;
    for (const v of Object.values(tree)) {
      if (v.type === 'file') count++;
      else if (v.type === 'directory' && v.children) count += this.countFiles(v.children);
    }
    return count;
  }

  countDirectories(tree) {
    let count = 0;
    for (const v of Object.values(tree)) {
      if (v.type === 'directory') { count++; if (v.children) count += this.countDirectories(v.children); }
    }
    return count;
  }

  identifyLanguages(tree) {
    const langs = {};
    const count = (t) => {
      for (const v of Object.values(t)) {
        if (v.type === 'file' && v.language) langs[v.language] = (langs[v.language] || 0) + 1;
        else if (v.type === 'directory' && v.children) count(v.children);
      }
    };
    count(tree);
    return langs;
  }

  async identifyFrameworks() {
    const frameworks = [];
    const pkgPath = path.join(this.projectRoot, 'package.json');
    if (await this.fileExists(pkgPath)) {
      const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps.react) frameworks.push('React');
      if (deps.vue) frameworks.push('Vue');
      if (deps.angular) frameworks.push('Angular');
      if (deps.express) frameworks.push('Express');
      if (deps.next) frameworks.push('Next.js');
      if (deps.nuxt) frameworks.push('Nuxt');
      if (deps.svelte) frameworks.push('Svelte');
      if (deps.fastify) frameworks.push('Fastify');
      if (deps.nestjs || deps['@nestjs/core']) frameworks.push('NestJS');
    }
    return frameworks;
  }

  async detectProjectType() {
    const pkgPath = path.join(this.projectRoot, 'package.json');
    if (await this.fileExists(pkgPath)) {
      const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps.react || deps.vue || deps.angular) return 'web-frontend';
      if (deps.express || deps.fastify || deps.koa) return 'api-service';
      if (deps.electron) return 'desktop-app';
      if (pkg.bin) return 'cli-tool';
    }
    return 'unknown';
  }

  estimateComplexity() {
    const files = this.analysis.structure.totalFiles;
    const components = this.analysis.components.size;
    if (files < 20 && components < 10) return 'low';
    if (files < 100 && components < 50) return 'medium';
    return 'high';
  }

  async estimateTestCoverage() {
    const testFiles = await this.findTestFiles();
    const codeFiles = await this.findCodeFiles();
    if (codeFiles.length === 0) return 0;
    return Math.min(100, Math.round((testFiles.length / codeFiles.length) * 100));
  }

  async findTestFiles() {
    const files = [];
    const collect = (tree) => {
      for (const [name, item] of Object.entries(tree)) {
        if (item.type === 'file' && (name.includes('.test.') || name.includes('.spec.') || name.includes('_test.'))) {
          files.push(item);
        } else if (item.type === 'directory' && item.children) collect(item.children);
      }
    };
    collect(this.analysis.structure.tree);
    return files;
  }

  calculateDocCoverage() {
    const docCount = this.analysis.documentation.size;
    const componentCount = this.analysis.components.size;
    if (componentCount === 0) return 100;
    return Math.min(100, Math.round((docCount / componentCount) * 100));
  }

  getAnalysisResult() {
    return {
      ...this.analysis,
      components: Object.fromEntries(this.analysis.components),
      documentation: Object.fromEntries(this.analysis.documentation)
    };
  }
}

export default ProjectAnalyzer;
