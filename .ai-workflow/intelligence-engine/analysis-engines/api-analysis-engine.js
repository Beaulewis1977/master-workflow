/**
 * API Analysis Engine
 * Advanced system for analyzing APIs (REST, GraphQL, gRPC, WebSocket)
 * 
 * @author Claude Code Analyzer Agent
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');

class APIAnalysisEngine {
  constructor(sharedMemory) {
    this.sharedMemory = sharedMemory;
    this.apiEndpoints = new Map();
    this.schemas = new Map();
    this.authMechanisms = new Map();
    this.middlewares = new Map();
    
    // API patterns and frameworks
    this.restPatterns = {
      express: ['app.get', 'app.post', 'app.put', 'app.delete', 'router.'],
      fastify: ['fastify.get', 'fastify.post', 'server.route'],
      nestjs: ['@Get', '@Post', '@Put', '@Delete', '@Controller'],
      koa: ['router.get', 'router.post'],
      spring: ['@RestController', '@GetMapping', '@PostMapping'],
      django: ['def get', 'def post', 'path('],
      flask: ['@app.route', '@bp.route']
    };
    
    this.graphqlPatterns = [
      'GraphQLSchema', 'GraphQLObjectType', 'gql`', 'typeDefs',
      'resolvers', '@Query', '@Mutation', '@Subscription'
    ];
    
    this.grpcPatterns = [
      '.proto', 'grpc.', 'rpc ', 'service ', 'message '
    ];
    
    this.websocketPatterns = [
      'socket.io', 'ws.', 'WebSocket', 'socketIO', 'io.emit',
      'socket.on', 'socket.emit'
    ];
    
    this.authPatterns = {
      jwt: ['jwt.', 'jsonwebtoken', 'JWT', 'Bearer'],
      oauth: ['oauth', 'OAuth', 'passport'],
      basic: ['Basic', 'basicAuth'],
      apikey: ['apikey', 'api-key', 'x-api-key'],
      session: ['session', 'cookie-session', 'express-session']
    };
  }
  
  /**
   * Main API analysis entry point
   */
  async analyzeAPIs(projectPath, options = {}) {
    const analysisId = `api-${Date.now()}`;
    
    try {
      // Parallel analysis using specialized agents
      const analyses = await Promise.all([
        this.analyzeRESTAPIs(projectPath, analysisId),
        this.analyzeGraphQLAPIs(projectPath, analysisId),
        this.analyzeGRPCAPIs(projectPath, analysisId),
        this.analyzeWebSocketAPIs(projectPath, analysisId),
        this.analyzeAuthentication(projectPath, analysisId),
        this.analyzeMiddlewares(projectPath, analysisId),
        this.analyzeAPIDocumentation(projectPath, analysisId)
      ]);
      
      const results = {
        rest: analyses[0],
        graphql: analyses[1],
        grpc: analyses[2],
        websocket: analyses[3],
        authentication: analyses[4],
        middlewares: analyses[5],
        documentation: analyses[6],
        summary: {
          totalEndpoints: 0,
          apiTypes: [],
          authMethods: [],
          complexity: 0,
          coverage: 0,
          security: 0
        },
        recommendations: [],
        openapi: null
      };
      
      // Calculate summary and generate OpenAPI spec
      results.summary = this.calculateSummary(results);
      results.recommendations = await this.generateRecommendations(results);
      results.openapi = await this.generateOpenAPISpec(results);
      
      // Store results using MCP integration specialist
      await this.storeResults(analysisId, results);
      
      return results;
      
    } catch (error) {
      console.error('API analysis error:', error);
      throw error;
    }
  }
  
  /**
   * Analyze REST APIs
   */
  async analyzeRESTAPIs(projectPath, analysisId) {
    const restAPIs = {
      endpoints: [],
      routes: [],
      controllers: [],
      middlewares: [],
      frameworks: [],
      patterns: {
        resourceBased: 0,
        verbBased: 0,
        nested: 0
      }
    };
    
    const files = await this.scanCodeFiles(projectPath);
    
    for (const filePath of files) {
      await this.analyzeFileForREST(filePath, restAPIs);
    }
    
    // Analyze route patterns
    this.analyzeRoutePatterns(restAPIs);
    
    return restAPIs;
  }
  
  /**
   * Analyze file for REST patterns
   */
  async analyzeFileForREST(filePath, restAPIs) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const fileName = path.basename(filePath);
      
      // Check for framework usage
      for (const [framework, patterns] of Object.entries(this.restPatterns)) {
        if (patterns.some(pattern => content.includes(pattern))) {
          if (!restAPIs.frameworks.find(f => f.name === framework)) {
            restAPIs.frameworks.push({
              name: framework,
              file: filePath,
              confidence: this.calculateFrameworkConfidence(content, patterns)
            });
          }
        }
      }
      
      // Analyze with pattern matching (simplified approach)
      await this.analyzeFileForRESTPatterns(content, filePath, restAPIs);
      
    } catch (error) {
      console.warn(`Failed to analyze ${filePath} for REST APIs:`, error.message);
    }
  }
  
  /**
   * Analyze file for REST patterns (simplified pattern matching)
   */
  async analyzeFileForRESTPatterns(content, filePath, restAPIs) {
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Express.js patterns
      const expressMatch = line.match(/(app|router)\.(get|post|put|delete|patch)\s*\(['"]([^'"]+)['"]/);
      if (expressMatch) {
        const [, object, method, path] = expressMatch;
        restAPIs.endpoints.push({
          method: method.toUpperCase(),
          path: path,
          file: filePath,
          line: i + 1,
          framework: 'express',
          type: 'rest-endpoint'
        });
      }
      
      // NestJS decorators
      const nestMatch = line.match(/@(Get|Post|Put|Delete|Patch)\s*\(['"]?([^'"\)]*)['"]?\)/);
      if (nestMatch) {
        const [, method, path] = nestMatch;
        restAPIs.endpoints.push({
          method: method.toUpperCase(),
          path: path || '/',
          file: filePath,
          line: i + 1,
          framework: 'nestjs',
          type: 'rest-endpoint'
        });
      }
      
      // FastAPI patterns
      const fastApiMatch = line.match(/@app\.(get|post|put|delete|patch)\s*\(['"]([^'"]+)['"]/);
      if (fastApiMatch) {
        const [, method, path] = fastApiMatch;
        restAPIs.endpoints.push({
          method: method.toUpperCase(),
          path: path,
          file: filePath,
          line: i + 1,
          framework: 'fastapi',
          type: 'rest-endpoint'
        });
      }
      
      // Spring Boot patterns
      const springMatch = line.match(/@(GetMapping|PostMapping|PutMapping|DeleteMapping|PatchMapping)\s*\(['"]?([^'"\)]*)['"]?\)/);
      if (springMatch) {
        const [, annotation, path] = springMatch;
        const method = annotation.replace('Mapping', '').toUpperCase();
        restAPIs.endpoints.push({
          method: method,
          path: path || '/',
          file: filePath,
          line: i + 1,
          framework: 'spring',
          type: 'rest-endpoint'
        });
      }
    }
  }
  
  /**
   * Analyze GraphQL APIs
   */
  async analyzeGraphQLAPIs(projectPath, analysisId) {
    const graphqlAPIs = {
      schemas: [],
      resolvers: [],
      queries: [],
      mutations: [],
      subscriptions: [],
      types: [],
      directives: [],
      frameworks: []
    };
    
    const files = await this.scanCodeFiles(projectPath);
    
    // Look for GraphQL files and code patterns
    for (const filePath of files) {
      if (path.extname(filePath) === '.graphql' || path.extname(filePath) === '.gql') {
        await this.analyzeGraphQLSchema(filePath, graphqlAPIs);
      } else {
        await this.analyzeFileForGraphQL(filePath, graphqlAPIs);
      }
    }
    
    return graphqlAPIs;
  }
  
  /**
   * Analyze GraphQL schema files
   */
  async analyzeGraphQLSchema(filePath, graphqlAPIs) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      const schema = {
        file: filePath,
        types: this.extractGraphQLTypes(content),
        queries: this.extractGraphQLQueries(content),
        mutations: this.extractGraphQLMutations(content),
        subscriptions: this.extractGraphQLSubscriptions(content),
        directives: this.extractGraphQLDirectives(content)
      };
      
      graphqlAPIs.schemas.push(schema);
      
    } catch (error) {
      console.warn(`Failed to analyze GraphQL schema ${filePath}:`, error.message);
    }
  }
  
  /**
   * Analyze gRPC APIs
   */
  async analyzeGRPCAPIs(projectPath, analysisId) {
    const grpcAPIs = {
      services: [],
      messages: [],
      protoFiles: [],
      methods: [],
      frameworks: []
    };
    
    // Look for .proto files
    const protoFiles = await this.findProtoFiles(projectPath);
    
    for (const protoFile of protoFiles) {
      await this.analyzeProtoFile(protoFile, grpcAPIs);
    }
    
    // Look for gRPC client/server code
    const codeFiles = await this.scanCodeFiles(projectPath);
    for (const filePath of codeFiles) {
      await this.analyzeFileForGRPC(filePath, grpcAPIs);
    }
    
    return grpcAPIs;
  }
  
  /**
   * Analyze WebSocket APIs
   */
  async analyzeWebSocketAPIs(projectPath, analysisId) {
    const websocketAPIs = {
      connections: [],
      events: [],
      namespaces: [],
      rooms: [],
      middlewares: [],
      frameworks: []
    };
    
    const files = await this.scanCodeFiles(projectPath);
    
    for (const filePath of files) {
      await this.analyzeFileForWebSocket(filePath, websocketAPIs);
    }
    
    return websocketAPIs;
  }
  
  /**
   * Analyze authentication mechanisms
   */
  async analyzeAuthentication(projectPath, analysisId) {
    const auth = {
      methods: [],
      middleware: [],
      guards: [],
      strategies: [],
      tokens: [],
      sessions: []
    };
    
    const files = await this.scanCodeFiles(projectPath);
    
    for (const filePath of files) {
      await this.analyzeFileForAuth(filePath, auth);
    }
    
    return auth;
  }
  
  /**
   * Analyze middlewares
   */
  async analyzeMiddlewares(projectPath, analysisId) {
    const middlewares = {
      auth: [],
      validation: [],
      cors: [],
      rateLimit: [],
      logging: [],
      error: [],
      custom: []
    };
    
    const files = await this.scanCodeFiles(projectPath);
    
    for (const filePath of files) {
      await this.analyzeFileForMiddlewares(filePath, middlewares);
    }
    
    return middlewares;
  }
  
  /**
   * Analyze API documentation
   */
  async analyzeAPIDocumentation(projectPath, analysisId) {
    const documentation = {
      swagger: [],
      openapi: [],
      comments: [],
      examples: [],
      postman: [],
      coverage: 0
    };
    
    // Look for documentation files
    const docFiles = await this.findDocumentationFiles(projectPath);
    
    for (const docFile of docFiles) {
      await this.analyzeDocumentationFile(docFile, documentation);
    }
    
    return documentation;
  }
  
  // Helper methods
  
  async scanCodeFiles(projectPath) {
    const files = [];
    const extensions = [
      '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cs', '.go', '.php',
      '.graphql', '.gql', '.proto'
    ];
    
    const scan = async (dir) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            if (!['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
              await scan(fullPath);
            }
          } else if (extensions.some(ext => entry.name.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Ignore permission errors
      }
    };
    
    await scan(projectPath);
    return files;
  }
  
  // Removed AST parsing - using pattern matching instead
  
  isJavaScriptFile(fileName) {
    return ['.js', '.ts', '.jsx', '.tsx'].some(ext => fileName.endsWith(ext));
  }
  
  isHTTPMethodCall(callee) {
    if (callee.type === 'MemberExpression') {
      const methodName = callee.property.name;
      return ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(methodName);
    }
    return false;
  }
  
  extractHTTPMethod(callee) {
    return callee.property.name.toUpperCase();
  }
  
  extractRoutePath(argument) {
    if (argument && argument.type === 'StringLiteral') {
      return argument.value;
    }
    return '[dynamic]';
  }
  
  extractHandlers(handlerArgs) {
    return handlerArgs.map(arg => {
      if (arg.type === 'FunctionExpression' || arg.type === 'ArrowFunctionExpression') {
        return 'inline';
      }
      if (arg.type === 'Identifier') {
        return arg.name;
      }
      return 'unknown';
    });
  }
  
  extractRouteParameters(pathArg) {
    if (pathArg && pathArg.type === 'StringLiteral') {
      const path = pathArg.value;
      const paramMatches = path.match(/:([a-zA-Z0-9_]+)/g);
      return paramMatches ? paramMatches.map(match => match.substring(1)) : [];
    }
    return [];
  }
  
  analyzeResponsePatterns(content, startLine = 0) {
    const responses = [];
    const lines = content.split('\n');
    
    // Look for response patterns in the next few lines
    for (let i = startLine; i < Math.min(startLine + 10, lines.length); i++) {
      const line = lines[i];
      if (line.includes('.json(') || line.includes('.send(') || 
          line.includes('.status(') || line.includes('.redirect(')) {
        const method = line.match(/\.(json|send|status|redirect)\(/)?.[1];
        if (method) {
          responses.push({
            type: method,
            line: i + 1
          });
        }
      }
    }
    
    return responses;
  }
  
  calculateFrameworkConfidence(content, patterns) {
    const matches = patterns.filter(pattern => content.includes(pattern)).length;
    return Math.min(1, matches / patterns.length * 2);
  }
  
  analyzeRoutePatterns(restAPIs) {
    const paths = restAPIs.endpoints.map(e => e.path).filter(p => p && p !== '[dynamic]');
    
    // Analyze RESTful patterns
    const resourcePaths = paths.filter(p => this.isResourceBasedPath(p));
    const verbPaths = paths.filter(p => this.isVerbBasedPath(p));
    const nestedPaths = paths.filter(p => this.isNestedPath(p));
    
    restAPIs.patterns.resourceBased = resourcePaths.length / paths.length;
    restAPIs.patterns.verbBased = verbPaths.length / paths.length;
    restAPIs.patterns.nested = nestedPaths.length / paths.length;
  }
  
  isResourceBasedPath(path) {
    // Check if path follows resource-based pattern like /users, /users/:id
    const segments = path.split('/').filter(s => s.length > 0);
    return segments.length > 0 && !segments[0].startsWith(':') && 
           !['api', 'v1', 'v2'].includes(segments[0]);
  }
  
  isVerbBasedPath(path) {
    // Check if path includes verbs like /getUser, /createUser
    const verbs = ['get', 'create', 'update', 'delete', 'list', 'search'];
    return verbs.some(verb => path.toLowerCase().includes(verb));
  }
  
  isNestedPath(path) {
    // Check if path has nested resources like /users/:id/posts
    const segments = path.split('/').filter(s => s.length > 0);
    return segments.length > 2;
  }
  
  calculateSummary(results) {
    const restEndpoints = results.rest.endpoints.length;
    const graphqlOperations = results.graphql.queries.length + 
                             results.graphql.mutations.length + 
                             results.graphql.subscriptions.length;
    const grpcMethods = results.grpc.methods.length;
    const wsEvents = results.websocket.events.length;
    
    const totalEndpoints = restEndpoints + graphqlOperations + grpcMethods + wsEvents;
    
    const apiTypes = [];
    if (restEndpoints > 0) apiTypes.push('REST');
    if (graphqlOperations > 0) apiTypes.push('GraphQL');
    if (grpcMethods > 0) apiTypes.push('gRPC');
    if (wsEvents > 0) apiTypes.push('WebSocket');
    
    const authMethods = results.authentication.methods.map(m => m.type);
    
    return {
      totalEndpoints,
      apiTypes,
      authMethods: [...new Set(authMethods)],
      complexity: this.calculateComplexity(results),
      coverage: this.calculateCoverage(results),
      security: this.calculateSecurityScore(results)
    };
  }
  
  calculateComplexity(results) {
    // Calculate API complexity based on various factors
    const endpointComplexity = results.rest.endpoints.length * 0.1;
    const schemaComplexity = results.graphql.types.length * 0.2;
    const authComplexity = results.authentication.methods.length * 0.3;
    const middlewareComplexity = Object.values(results.middlewares).flat().length * 0.1;
    
    return Math.min(10, endpointComplexity + schemaComplexity + authComplexity + middlewareComplexity);
  }
  
  calculateCoverage(results) {
    const documented = results.documentation.swagger.length + results.documentation.openapi.length;
    const total = results.summary.totalEndpoints;
    return total > 0 ? documented / total : 0;
  }
  
  calculateSecurityScore(results) {
    let score = 0;
    
    if (results.authentication.methods.length > 0) score += 0.3;
    if (results.middlewares.auth.length > 0) score += 0.2;
    if (results.middlewares.cors.length > 0) score += 0.1;
    if (results.middlewares.rateLimit.length > 0) score += 0.2;
    if (results.middlewares.validation.length > 0) score += 0.2;
    
    return Math.min(1, score);
  }
  
  async generateRecommendations(results) {
    const recommendations = [];
    
    if (results.summary.totalEndpoints === 0) {
      recommendations.push({
        priority: 'low',
        category: 'api-detection',
        title: 'No APIs Detected',
        description: 'No API endpoints were found. If APIs exist, they may use unsupported patterns.',
        impact: 'analysis'
      });
    }
    
    if (results.summary.security < 0.5) {
      recommendations.push({
        priority: 'high',
        category: 'security',
        title: 'Improve API Security',
        description: 'Add authentication, rate limiting, input validation, and CORS protection.',
        impact: 'security'
      });
    }
    
    if (results.summary.coverage < 0.3) {
      recommendations.push({
        priority: 'medium',
        category: 'documentation',
        title: 'Add API Documentation',
        description: 'Generate OpenAPI/Swagger documentation for better API discoverability.',
        impact: 'maintainability'
      });
    }
    
    if (results.rest.patterns.verbBased > 0.5) {
      recommendations.push({
        priority: 'medium',
        category: 'design',
        title: 'Follow RESTful Conventions',
        description: 'Consider using resource-based URLs instead of verb-based URLs.',
        impact: 'maintainability'
      });
    }
    
    return recommendations;
  }
  
  async generateOpenAPISpec(results) {
    if (results.rest.endpoints.length === 0) {
      return null;
    }
    
    const spec = {
      openapi: '3.0.0',
      info: {
        title: 'Generated API Documentation',
        version: '1.0.0',
        description: 'Auto-generated from code analysis'
      },
      paths: {},
      components: {
        schemas: {},
        securitySchemes: {}
      }
    };
    
    // Add endpoints to spec
    for (const endpoint of results.rest.endpoints) {
      if (endpoint.path && endpoint.path !== '[dynamic]') {
        const pathKey = endpoint.path.replace(/:([^/]+)/g, '{$1}');
        
        if (!spec.paths[pathKey]) {
          spec.paths[pathKey] = {};
        }
        
        spec.paths[pathKey][endpoint.method.toLowerCase()] = {
          summary: `${endpoint.method} ${endpoint.path}`,
          parameters: endpoint.parameters?.map(param => ({
            name: param,
            in: 'path',
            required: true,
            schema: { type: 'string' }
          })) || [],
          responses: {
            '200': {
              description: 'Successful response'
            }
          }
        };
      }
    }
    
    return spec;
  }
  
  /**
   * Store results in shared memory
   */
  async storeResults(analysisId, results) {
    try {
      await this.sharedMemory.set(
        `api-analysis:${analysisId}`,
        results,
        {
          namespace: this.sharedMemory.namespaces?.TASK_RESULTS || 'task-results',
          dataType: this.sharedMemory.dataTypes?.PERSISTENT || 'persistent',
          ttl: 3600000 // 1 hour
        }
      );
      
      // Also store OpenAPI spec separately
      if (results.openapi) {
        await this.sharedMemory.set(
          `openapi-spec:${analysisId}`,
          results.openapi,
          {
            namespace: this.sharedMemory.namespaces?.TASK_RESULTS || 'task-results',
            dataType: this.sharedMemory.dataTypes?.PERSISTENT || 'persistent',
            ttl: 3600000
          }
        );
      }
      
    } catch (error) {
      console.warn('Failed to store API analysis results:', error);
    }
  }
  
  // Placeholder methods for detailed implementations
  
  analyzeNonJSFileForREST(content, filePath, restAPIs) {
    // Implementation for analyzing non-JavaScript files (Python, Java, etc.)
    return Promise.resolve();
  }
  
  extractInlineMiddleware(args) {
    return []; // Simplified
  }
  
  isHTTPDecorator(expression) {
    const decoratorNames = ['Get', 'Post', 'Put', 'Delete', 'Patch'];
    return decoratorNames.some(name => 
      expression.callee && expression.callee.name === name
    );
  }
  
  extractDecoratorHTTPMethod(decorator) {
    return decorator.expression.callee.name.toUpperCase();
  }
  
  extractDecoratorPath(decorator) {
    const args = decorator.expression.arguments;
    if (args && args[0] && args[0].type === 'StringLiteral') {
      return args[0].value;
    }
    return '';
  }
  
  findControllerClass(methodPath) {
    let parent = methodPath.parent;
    while (parent && parent.type !== 'ClassDeclaration') {
      parent = parent.parent;
    }
    return parent?.id?.name || 'Unknown';
  }
  
  extractMethodParameters(params) {
    return params.map(param => ({
      name: param.name || 'param',
      type: param.typeAnnotation?.typeAnnotation?.type || 'any'
    }));
  }
  
  getDecoratorName(decorator) {
    return decorator.expression.callee?.name || 'unknown';
  }
  
  analyzeFileForGraphQL(filePath, graphqlAPIs) {
    // Implementation for GraphQL code analysis
    return Promise.resolve();
  }
  
  extractGraphQLTypes(content) {
    return []; // Simplified
  }
  
  extractGraphQLQueries(content) {
    return []; // Simplified
  }
  
  extractGraphQLMutations(content) {
    return []; // Simplified
  }
  
  extractGraphQLSubscriptions(content) {
    return []; // Simplified
  }
  
  extractGraphQLDirectives(content) {
    return []; // Simplified
  }
  
  findProtoFiles(projectPath) {
    return this.scanCodeFiles(projectPath).then(files => 
      files.filter(f => f.endsWith('.proto'))
    );
  }
  
  analyzeProtoFile(filePath, grpcAPIs) {
    // Implementation for .proto file analysis
    return Promise.resolve();
  }
  
  analyzeFileForGRPC(filePath, grpcAPIs) {
    // Implementation for gRPC code analysis
    return Promise.resolve();
  }
  
  analyzeFileForWebSocket(filePath, websocketAPIs) {
    // Implementation for WebSocket analysis
    return Promise.resolve();
  }
  
  analyzeFileForAuth(filePath, auth) {
    // Implementation for authentication analysis
    return Promise.resolve();
  }
  
  analyzeFileForMiddlewares(filePath, middlewares) {
    // Implementation for middleware analysis
    return Promise.resolve();
  }
  
  findDocumentationFiles(projectPath) {
    return this.scanCodeFiles(projectPath).then(files => 
      files.filter(f => 
        f.includes('swagger') || 
        f.includes('openapi') || 
        f.includes('postman') ||
        f.endsWith('.yml') ||
        f.endsWith('.yaml')
      )
    );
  }
  
  analyzeDocumentationFile(filePath, documentation) {
    // Implementation for documentation analysis
    return Promise.resolve();
  }
}

module.exports = APIAnalysisEngine;