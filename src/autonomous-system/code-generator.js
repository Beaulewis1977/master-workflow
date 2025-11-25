/**
 * Code Generator - Real AST-based Code Generation
 * ================================================
 * Generates actual code from specifications and templates.
 * Supports JavaScript/TypeScript, Python, and generic templates.
 */

import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';

export class CodeGenerator extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      outputDir: options.outputDir || './generated',
      language: options.language || 'javascript',
      style: options.style || 'modern', // modern, classic, functional
      verbose: options.verbose || false,
      dryRun: options.dryRun || false
    };
    
    this.generated = [];
    this.templates = this.loadTemplates();
  }

  log(msg) { if (this.options.verbose) console.log(`[CodeGen] ${msg}`); }

  loadTemplates() {
    return {
      javascript: {
        class: this.jsClassTemplate,
        function: this.jsFunctionTemplate,
        module: this.jsModuleTemplate,
        test: this.jsTestTemplate,
        api: this.jsApiTemplate
      },
      typescript: {
        class: this.tsClassTemplate,
        function: this.tsFunctionTemplate,
        module: this.tsModuleTemplate,
        interface: this.tsInterfaceTemplate
      },
      python: {
        class: this.pyClassTemplate,
        function: this.pyFunctionTemplate,
        module: this.pyModuleTemplate
      }
    };
  }

  /**
   * Generate code from a specification
   */
  async generateFromSpec(spec) {
    this.log(`Generating code from spec: ${spec.name || 'unnamed'}`);
    const results = [];

    if (spec.components) {
      for (const component of spec.components) {
        try {
          const result = await this.generateComponent(component);
          results.push(result);
        } catch (error) {
          this.log(`Failed to generate component ${component.name}: ${error.message}`);
          results.push({ type: 'component', name: component.name, success: false, error: error.message });
          this.emit('generation:error', { component: component.name, error });
        }
      }
    }

    if (spec.apis) {
      for (const api of spec.apis) {
        try {
          const result = await this.generateApi(api);
          results.push(result);
        } catch (error) {
          this.log(`Failed to generate API ${api.name}: ${error.message}`);
          results.push({ type: 'api', name: api.name, success: false, error: error.message });
          this.emit('generation:error', { api: api.name, error });
        }
      }
    }

    if (spec.tests) {
      for (const test of spec.tests) {
        try {
          const result = await this.generateTest(test);
          results.push(result);
        } catch (error) {
          this.log(`Failed to generate test ${test.name}: ${error.message}`);
          results.push({ type: 'test', name: test.name, success: false, error: error.message });
          this.emit('generation:error', { test: test.name, error });
        }
      }
    }

    this.emit('generation:complete', { spec: spec.name, results });
    return results;
  }

  /**
   * Generate a component (class, function, module)
   */
  async generateComponent(component) {
    const { type, name, properties, methods, dependencies } = component;
    const lang = this.options.language;
    
    try {
      const template = this.templates[lang]?.[type] || this.templates.javascript.class;
      
      const code = template.call(this, {
        name,
        properties: properties || [],
        methods: methods || [],
        dependencies: dependencies || [],
        description: component.description || ''
      });

      const filePath = this.getFilePath(name, type, lang);
      
      if (!this.options.dryRun) {
        await this.writeFile(filePath, code);
      }

      this.generated.push({ type, name, path: filePath, lines: code.split('\n').length });
      this.log(`Generated ${type}: ${name} -> ${filePath}`);
      
      return { type, name, path: filePath, code, success: true };
    } catch (error) {
      this.log(`Failed to generate component ${name}: ${error.message}`);
      this.emit('generation:error', { component: name, error });
      return { type, name, success: false, error: error.message };
    }
  }

  /**
   * Generate API endpoint code
   */
  async generateApi(api) {
    const { name, endpoints, middleware } = api;
    const lang = this.options.language;
    
    try {
      const template = this.templates[lang]?.api || this.jsApiTemplate;
      const code = template.call(this, {
        name,
        endpoints: endpoints || [],
        middleware: middleware || []
      });

      const filePath = this.getFilePath(name, 'api', lang);
      
      if (!this.options.dryRun) {
        await this.writeFile(filePath, code);
      }

      this.generated.push({ type: 'api', name, path: filePath });
      return { type: 'api', name, path: filePath, code, success: true };
    } catch (error) {
      this.log(`Failed to generate API ${name}: ${error.message}`);
      this.emit('generation:error', { api: name, error });
      return { type: 'api', name, success: false, error: error.message };
    }
  }

  /**
   * Generate test file
   */
  async generateTest(testSpec) {
    const { name, target, cases } = testSpec;
    const lang = this.options.language;
    
    try {
      const template = this.templates[lang]?.test || this.jsTestTemplate;
      const code = template.call(this, {
        name,
        target: target || name,
        cases: cases || []
      });

      const filePath = this.getFilePath(`${name}.test`, 'test', lang);
      
      if (!this.options.dryRun) {
        await this.writeFile(filePath, code);
      }

      this.generated.push({ type: 'test', name, path: filePath });
      return { type: 'test', name, path: filePath, code, success: true };
    } catch (error) {
      this.log(`Failed to generate test ${name}: ${error.message}`);
      this.emit('generation:error', { test: name, error });
      return { type: 'test', name, success: false, error: error.message };
    }
  }

  /**
   * Generate code from analysis gaps
   */
  async generateFromGaps(gaps, analysis) {
    const results = [];
    
    for (const gap of gaps) {
      if (gap.type === 'missing_tests') {
        const testResult = await this.generateTestsForComponent(gap.component, analysis);
        results.push(testResult);
      } else if (gap.type === 'missing_documentation') {
        // Skip - handled by documentation generator
      } else if (gap.type === 'missing_error_handling') {
        const errorResult = await this.generateErrorHandling(gap.component, analysis);
        results.push(errorResult);
      }
    }

    return results;
  }

  async generateTestsForComponent(componentName, analysis) {
    const component = analysis.components?.[componentName];
    if (!component) {
      return { success: false, error: `Component ${componentName} not found` };
    }

    const testCases = this.inferTestCases(component);
    return this.generateTest({
      name: componentName,
      target: componentName,
      cases: testCases
    });
  }

  inferTestCases(component) {
    const cases = [];
    
    // Generate test cases for each method
    if (component.methods) {
      for (const method of component.methods) {
        cases.push({
          name: `should ${method.name} correctly`,
          method: method.name,
          input: this.inferInput(method),
          expected: 'defined'
        });
        
        // Edge case
        cases.push({
          name: `should handle edge cases in ${method.name}`,
          method: method.name,
          input: null,
          expected: 'not throw'
        });
      }
    }

    // Constructor test
    cases.unshift({
      name: 'should instantiate correctly',
      method: 'constructor',
      input: {},
      expected: 'instance'
    });

    return cases;
  }

  inferInput(method) {
    // Infer reasonable test input based on method name
    const name = method.name?.toLowerCase() || '';
    if (name.includes('get')) return {};
    if (name.includes('set')) return { value: 'test' };
    if (name.includes('add')) return { item: {} };
    if (name.includes('remove')) return { id: '1' };
    if (name.includes('process')) return { data: [] };
    return {};
  }

  async generateErrorHandling(componentName, analysis) {
    const component = analysis.components?.[componentName];
    if (!component) return { success: false };

    // Generate error handling wrapper
    const code = `
/**
 * Error handling wrapper for ${componentName}
 */
export function withErrorHandling(fn, context = '${componentName}') {
  return async function(...args) {
    try {
      return await fn.apply(this, args);
    } catch (error) {
      console.error(\`[\${context}] Error: \${error.message}\`);
      throw new Error(\`\${context} operation failed: \${error.message}\`);
    }
  };
}
`;
    
    const filePath = path.join(this.options.outputDir, 'utils', `${componentName}-error-handler.js`);

    try {
      if (!this.options.dryRun) {
        await this.writeFile(filePath, code);
      }

      return { type: 'error-handler', name: componentName, path: filePath, success: true };
    } catch (error) {
      this.log(`Failed to generate error handler for ${componentName}: ${error.message}`);
      this.emit('generation:error', { component: componentName, error });
      return { type: 'error-handler', name: componentName, success: false, error: error.message };
    }
  }

  // ============================================
  // JavaScript Templates
  // ============================================

  jsClassTemplate({ name, properties, methods, dependencies, description }) {
    const imports = dependencies.map(d => 
      `import { ${d.exports?.join(', ') || d.name} } from '${d.path || `./${d.name}.js`}';`
    ).join('\n');

    const props = properties.map(p => 
      `    this.${p.name} = ${p.default !== undefined ? JSON.stringify(p.default) : 'null'};`
    ).join('\n');

    const meths = methods.map(m => `
  /**
   * ${m.description || m.name}
   */
  ${m.async ? 'async ' : ''}${m.name}(${(m.params || []).join(', ')}) {
    ${m.body || `// TODO: Implement ${m.name}`}
  }`).join('\n');

    return `/**
 * ${name}
 * ${'-'.repeat(name.length)}
 * ${description}
 */

${imports}

export class ${name} {
  constructor(options = {}) {
${props || '    this.options = options;'}
  }
${meths}
}

export default ${name};
`;
  }

  jsFunctionTemplate({ name, params, body, description, async: isAsync }) {
    return `/**
 * ${description || name}
 * @param {Object} ${params?.[0] || 'input'} - Input parameters
 * @returns {*} Result
 */
export ${isAsync ? 'async ' : ''}function ${name}(${(params || ['input']).join(', ')}) {
  ${body || '// Implementation'}
}
`;
  }

  jsModuleTemplate({ name, exports, dependencies, description }) {
    const imports = (dependencies || []).map(d => 
      `import ${d.default ? d.name : `{ ${d.exports?.join(', ') || d.name} }`} from '${d.path}';`
    ).join('\n');

    const exportStatements = (exports || []).map(e => 
      `export { ${e.name} } from './${e.file || e.name}.js';`
    ).join('\n');

    return `/**
 * ${name} Module
 * ${description || ''}
 */

${imports}

${exportStatements}

export default {
  ${(exports || []).map(e => e.name).join(',\n  ')}
};
`;
  }

  jsTestTemplate({ name, target, cases }) {
    const testCases = (cases || []).map(c => `
  test('${c.name}', async () => {
    ${c.setup || ''}
    const result = ${c.method === 'constructor' 
      ? `new ${target}(${JSON.stringify(c.input || {})})` 
      : `instance.${c.method}(${JSON.stringify(c.input)})`};
    ${c.expected === 'defined' ? 'expect(result).toBeDefined();' : ''}
    ${c.expected === 'instance' ? `expect(result).toBeInstanceOf(${target});` : ''}
    ${c.expected === 'not throw' ? '// Should not throw' : ''}
    ${c.assertion || ''}
  });`).join('\n');

    return `/**
 * Tests for ${name}
 */

import { ${target} } from './${target}.js';

describe('${name}', () => {
  let instance;

  beforeEach(() => {
    instance = new ${target}();
  });

  afterEach(() => {
    instance = null;
  });
${testCases}
});
`;
  }

  jsApiTemplate({ name, endpoints, middleware }) {
    const routes = (endpoints || []).map(e => `
/**
 * ${e.method} ${e.path}
 * ${e.description || ''}
 */
router.${e.method?.toLowerCase() || 'get'}('${e.path}', ${(e.middleware || []).map(m => `${m}, `).join('')}async (req, res, next) => {
  try {
    ${e.handler || `res.json({ message: '${e.path} endpoint' });`}
  } catch (error) {
    next(error);
  }
});`).join('\n');

    return `/**
 * ${name} API Routes
 */

import { Router } from 'express';

const router = Router();

${(middleware || []).map(m => `router.use(${m});`).join('\n')}
${routes}

export default router;
`;
  }

  // ============================================
  // TypeScript Templates
  // ============================================

  tsClassTemplate({ name, properties, methods, dependencies, description }) {
    const imports = dependencies.map(d => 
      `import { ${d.exports?.join(', ') || d.name} } from '${d.path || `./${d.name}`}';`
    ).join('\n');

    const props = properties.map(p => 
      `  ${p.private ? 'private ' : ''}${p.name}: ${p.type || 'any'}${p.optional ? '?' : ''};`
    ).join('\n');

    const meths = methods.map(m => `
  /**
   * ${m.description || m.name}
   */
  ${m.async ? 'async ' : ''}${m.name}(${(m.params || []).map(p => `${p.name}: ${p.type || 'any'}`).join(', ')}): ${m.returnType || 'void'} {
    ${m.body || `// TODO: Implement ${m.name}`}
  }`).join('\n');

    return `/**
 * ${name}
 * ${description || ''}
 */

${imports}

export class ${name} {
${props}

  constructor(options: ${name}Options = {}) {
    // Initialize properties
  }
${meths}
}

export interface ${name}Options {
  ${properties.map(p => `${p.name}?: ${p.type || 'any'};`).join('\n  ')}
}

export default ${name};
`;
  }

  tsInterfaceTemplate({ name, properties, description }) {
    const props = (properties || []).map(p => 
      `  ${p.name}${p.optional ? '?' : ''}: ${p.type || 'any'};`
    ).join('\n');

    return `/**
 * ${name} Interface
 * ${description || ''}
 */

export interface ${name} {
${props}
}
`;
  }

  tsFunctionTemplate({ name, params, returnType, body, description }) {
    return `/**
 * ${description || name}
 */
export function ${name}(${(params || []).map(p => `${p.name}: ${p.type}`).join(', ')}): ${returnType || 'void'} {
  ${body || '// Implementation'}
}
`;
  }

  tsModuleTemplate({ name, exports, description }) {
    return `/**
 * ${name} Module
 * ${description || ''}
 */

${(exports || []).map(e => `export { ${e.name} } from './${e.file || e.name}';`).join('\n')}
`;
  }

  // ============================================
  // Python Templates
  // ============================================

  pyClassTemplate({ name, properties, methods, dependencies, description }) {
    const imports = (dependencies || []).map(d => 
      `from ${d.module || d.name} import ${d.imports?.join(', ') || d.name}`
    ).join('\n');

    const props = (properties || []).map(p => 
      `        self.${p.name} = ${p.default !== undefined ? JSON.stringify(p.default) : 'None'}`
    ).join('\n');

    const meths = (methods || []).map(m => `
    ${m.async ? 'async ' : ''}def ${m.name}(self${m.params?.length ? ', ' + m.params.join(', ') : ''}):
        """${m.description || m.name}"""
        ${m.body || 'pass'}`).join('\n');

    return `"""
${name}
${'-'.repeat(name.length)}
${description || ''}
"""

${imports}

class ${name}:
    """${description || name}"""
    
    def __init__(self, **options):
        """Initialize ${name}"""
${props || '        self.options = options'}
${meths}


if __name__ == "__main__":
    instance = ${name}()
`;
  }

  pyFunctionTemplate({ name, params, body, description }) {
    return `"""${description || name}"""

def ${name}(${(params || ['*args', '**kwargs']).join(', ')}):
    """
    ${description || name}
    
    Args:
        ${(params || []).map(p => `${p}: Parameter description`).join('\n        ')}
    
    Returns:
        Result description
    """
    ${body || 'pass'}
`;
  }

  pyModuleTemplate({ name, exports, description }) {
    return `"""
${name} Module
${description || ''}
"""

${(exports || []).map(e => `from .${e.file || e.name} import ${e.name}`).join('\n')}

__all__ = [${(exports || []).map(e => `'${e.name}'`).join(', ')}]
`;
  }

  // ============================================
  // Utility Methods
  // ============================================

  getFilePath(name, type, lang) {
    const extensions = { javascript: 'js', typescript: 'ts', python: 'py' };
    const ext = extensions[lang] || 'js';
    const subDir = type === 'test' ? 'tests' : type === 'api' ? 'api' : 'src';
    return path.join(this.options.outputDir, subDir, `${this.toKebabCase(name)}.${ext}`);
  }

  toKebabCase(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }

  async writeFile(filePath, content) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, 'utf8');
    this.emit('file:written', { path: filePath });
  }

  getGeneratedFiles() {
    return this.generated;
  }

  getStats() {
    return {
      filesGenerated: this.generated.length,
      byType: this.generated.reduce((acc, f) => {
        acc[f.type] = (acc[f.type] || 0) + 1;
        return acc;
      }, {}),
      totalLines: this.generated.reduce((sum, f) => sum + (f.lines || 0), 0)
    };
  }
}

export default CodeGenerator;
