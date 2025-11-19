# Contributing to Claude Flow 2.0

We welcome contributions from developers of all skill levels! Claude Flow 2.0 is an open-source project that thrives on community involvement. Whether you're fixing bugs, adding features, improving documentation, or extending the MCP ecosystem, your contributions make a difference.

## Table of Contents

- [Getting Started](#getting-started)
- [Ways to Contribute](#ways-to-contribute)
- [Development Setup](#development-setup)
- [Contribution Workflow](#contribution-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [MCP Server Development](#mcp-server-development)
- [Community Guidelines](#community-guidelines)
- [Recognition](#recognition)

## Getting Started

### Quick Start for Contributors

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Install Claude Flow 2.0** development environment
4. **Make your changes** following our guidelines
5. **Submit a pull request** for review

```bash
# Fork and clone
git clone https://github.com/YOUR-USERNAME/claude-flow-2.0.git
cd claude-flow-2.0

# Set up development environment
npx claude-flow@2.0.0 init --claude --webui --preset contributor
```

### Prerequisites

- **Node.js 18+** (Required)
- **npm 6+** (Required)
- **Git** (Required)
- **Docker** (Optional, for MCP server development)
- **Python 3.8+** (Optional, for Python-based contributions)

### Development Tools

We recommend these tools for the best development experience:

- **VS Code** with Claude Flow extension
- **GitHub CLI** for pull request management
- **Docker Desktop** for containerized development
- **Postman** or **Insomnia** for API testing

## Ways to Contribute

### 🐛 Bug Reports and Fixes
- Report bugs using GitHub Issues
- Include reproduction steps and system information
- Fix existing bugs and submit pull requests

### ✨ Feature Development
- Propose new features through GitHub Discussions
- Implement approved features following our architecture
- Enhance existing features with backward compatibility

### 📚 Documentation
- Improve existing documentation clarity
- Add examples and tutorials
- Translate documentation (coming soon)
- Create video tutorials and guides

### 🔌 MCP Server Development
- Create new MCP servers for popular tools/services
- Improve existing MCP server capabilities
- Add authentication methods and security features

### 🧪 Testing and Quality Assurance
- Write and improve test coverage
- Performance testing and optimization
- Security testing and vulnerability assessment

### 🎨 User Experience
- Improve Web UI design and functionality
- Enhance CLI user experience
- Create better error messages and help text

### 🏗️ Infrastructure and DevOps
- Improve CI/CD pipelines
- Enhance deployment processes
- Optimize performance and resource usage

## Development Setup

### Local Development Environment

```bash
# Clone the repository
git clone https://github.com/YOUR-USERNAME/claude-flow-2.0.git
cd claude-flow-2.0

# Install dependencies
npm install

# Set up development environment
npm run setup-dev

# Initialize Claude Flow for development
npx claude-flow@2.0.0 init --claude --webui --preset development
```

### Development Configuration

Create a `.env.development` file:

```env
# Development environment variables
NODE_ENV=development
DEBUG=claude-flow:*
CLAUDE_FLOW_LOG_LEVEL=debug
CLAUDE_FLOW_PORT=3001
CLAUDE_FLOW_AGENTS=10

# Test database
DATABASE_URL=postgresql://localhost:5432/claude_flow_dev

# Optional: Enable experimental features
CLAUDE_FLOW_EXPERIMENTAL=true
```

### Docker Development Environment

For consistent development experience:

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# Access development container
docker-compose exec claude-flow-dev bash

# Run Claude Flow in container
npx claude-flow@2.0.0 init --claude --webui
```

## Contribution Workflow

### 1. Planning Your Contribution

#### For Bug Fixes
1. Check if the bug is already reported
2. Comment on the existing issue or create a new one
3. Wait for maintainer acknowledgment
4. Start working on the fix

#### For New Features
1. Create a GitHub Discussion for feature proposals
2. Wait for community and maintainer feedback
3. Create a detailed GitHub Issue with specifications
4. Get approval before starting development

#### For Documentation
1. Check existing documentation structure
2. Identify gaps or improvements needed
3. Create an issue or start working directly
4. Follow our documentation style guide

### 2. Making Changes

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes
# Follow our coding standards (see below)

# Test your changes
npm test
npm run test:integration

# Commit your changes
git add .
git commit -m "feat: add amazing new feature

- Implement core functionality
- Add comprehensive tests
- Update documentation"

# Push to your fork
git push origin feature/your-feature-name
```

### 3. Submitting Pull Requests

#### Pull Request Checklist

- [ ] **Code Quality**: Follows coding standards and conventions
- [ ] **Tests**: Includes appropriate test coverage (minimum 80%)
- [ ] **Documentation**: Updates relevant documentation
- [ ] **Backward Compatibility**: Doesn't break existing functionality
- [ ] **Performance**: No significant performance regressions
- [ ] **Security**: No security vulnerabilities introduced
- [ ] **Accessibility**: UI changes meet accessibility standards

#### Pull Request Template

```markdown
## Description
Brief description of changes and motivation.

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that causes existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Refactoring (no functional changes)

## Testing
Describe how you tested these changes.

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
```

### 4. Review Process

1. **Automated Checks**: CI/CD pipeline runs tests, linting, security scans
2. **Maintainer Review**: Core maintainers review code quality and architecture
3. **Community Review**: Community members can provide feedback
4. **Approval**: Two approvals required for merge (one maintainer + one reviewer)
5. **Merge**: Squash and merge with descriptive commit message

## Coding Standards

### JavaScript/TypeScript Standards

#### Code Style
```javascript
// Use modern JavaScript features
const analyzeProject = async (projectPath, options = {}) => {
  try {
    // Use descriptive variable names
    const projectAnalysis = await deep_analyze(projectPath);
    const optimizationSuggestions = generateOptimizations(projectAnalysis);
    
    return {
      success: true,
      data: {
        analysis: projectAnalysis,
        suggestions: optimizationSuggestions,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    // Proper error handling
    logger.error('Project analysis failed', { projectPath, error: error.message });
    throw new AnalysisError(`Failed to analyze project: ${error.message}`);
  }
};

// Export with clear documentation
export { analyzeProject };
```

#### TypeScript Interfaces
```typescript
// Define clear interfaces
interface ProjectAnalysisResult {
  complexity: number;
  techStack: TechStack[];
  recommendations: Recommendation[];
  metadata: AnalysisMetadata;
}

interface AgentConfiguration {
  readonly name: string;
  readonly capabilities: Capability[];
  readonly resourceLimits: ResourceLimits;
  readonly priority: Priority;
}

// Use enums for constants
enum AgentStatus {
  IDLE = 'idle',
  BUSY = 'busy',
  ERROR = 'error',
  STOPPING = 'stopping'
}
```

#### Error Handling
```javascript
// Custom error classes
class ClaudeFlowError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'ClaudeFlowError';
    this.code = code;
    this.details = details;
  }
}

class AgentError extends ClaudeFlowError {
  constructor(message, agentId, details = {}) {
    super(message, 'AGENT_ERROR', { agentId, ...details });
    this.name = 'AgentError';
  }
}

// Proper error handling in async functions
const safeExecute = async (operation, context) => {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof ClaudeFlowError) {
      throw error; // Re-throw our custom errors
    }
    
    // Wrap unknown errors
    throw new ClaudeFlowError(
      `Operation failed: ${error.message}`,
      'UNKNOWN_ERROR',
      { context, originalError: error }
    );
  }
};
```

### Code Organization

#### File Structure
```
src/
├── agents/           # Agent implementations
│   ├── base/         # Base agent classes
│   ├── specialists/  # Specialized agents
│   └── index.ts      # Agent exports
├── core/             # Core system components
│   ├── orchestrator/ # Orchestration logic
│   ├── mcp/          # MCP server integration
│   └── api/          # API endpoints
├── utils/            # Utility functions
│   ├── logger.ts     # Logging utilities
│   ├── config.ts     # Configuration management
│   └── validation.ts # Input validation
├── types/            # TypeScript type definitions
└── tests/            # Test files
    ├── unit/         # Unit tests
    ├── integration/  # Integration tests
    └── e2e/          # End-to-end tests
```

#### Naming Conventions
- **Files**: kebab-case (`project-analyzer.ts`)
- **Functions**: camelCase (`analyzeProject`)
- **Classes**: PascalCase (`ProjectAnalyzer`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_AGENT_COUNT`)
- **Interfaces**: PascalCase with 'I' prefix optional (`ProjectAnalysisResult`)

### Documentation Standards

#### JSDoc Comments
```javascript
/**
 * Analyzes a project to determine optimal Claude Flow configuration
 * 
 * @param {string} projectPath - Absolute path to project directory
 * @param {AnalysisOptions} [options={}] - Analysis configuration options
 * @param {boolean} [options.deep=false] - Enable deep analysis (slower but more accurate)
 * @param {string[]} [options.excludePaths=[]] - Paths to exclude from analysis
 * @returns {Promise<ProjectAnalysisResult>} Analysis results with recommendations
 * 
 * @throws {ValidationError} When projectPath is invalid
 * @throws {AnalysisError} When analysis fails due to project issues
 * 
 * @example
 * ```javascript
 * const analysis = await analyzeProject('/path/to/project', {
 *   deep: true,
 *   excludePaths: ['node_modules', '.git']
 * });
 * 
 * console.log(`Project complexity: ${analysis.complexity}`);
 * console.log(`Recommended agents: ${analysis.recommendedAgents}`);
 * ```
 * 
 * @since 2.0.0
 */
```

## Testing Guidelines

### Test Structure

#### Unit Tests
```javascript
// tests/unit/project-analyzer.test.js
import { describe, it, expect, beforeEach, afterEach } from 'jest';
import { ProjectAnalyzer } from '../src/core/project-analyzer';
import { createMockFileSystem } from './helpers/mock-fs';

describe('ProjectAnalyzer', () => {
  let analyzer;
  let mockFs;
  
  beforeEach(() => {
    mockFs = createMockFileSystem();
    analyzer = new ProjectAnalyzer({ fileSystem: mockFs });
  });
  
  afterEach(() => {
    mockFs.cleanup();
  });
  
  describe('analyzeComplexity', () => {
    it('should calculate complexity correctly for React projects', async () => {
      // Arrange
      mockFs.createProject({
        'package.json': { dependencies: { react: '^18.0.0' } },
        'src/components/Button.jsx': 'export const Button = () => <button>Click</button>;',
        'src/utils/helpers.js': 'export const format = (str) => str.trim();'
      });
      
      // Act
      const result = await analyzer.analyzeComplexity('/mock/project');
      
      // Assert
      expect(result.complexity).toBe(25);
      expect(result.techStack).toContain('react');
      expect(result.recommendations).toHaveLength(3);
    });
    
    it('should handle empty projects gracefully', async () => {
      // Arrange
      mockFs.createProject({});
      
      // Act & Assert
      await expect(analyzer.analyzeComplexity('/mock/empty'))
        .rejects.toThrow('Project appears to be empty');
    });
  });
});
```

#### Integration Tests
```javascript
// tests/integration/workflow-execution.test.js
import { describe, it, expect, beforeAll, afterAll } from 'jest';
import { ClaudeFlow } from '../src/core/claude-flow';
import { TestEnvironment } from './helpers/test-environment';

describe('Workflow Execution Integration', () => {
  let claudeFlow;
  let testEnv;
  
  beforeAll(async () => {
    testEnv = new TestEnvironment();
    await testEnv.setup();
    
    claudeFlow = new ClaudeFlow({
      agents: 5,
      mcp: { enabled: false }, // Disable for tests
      webui: { enabled: false }
    });
    
    await claudeFlow.initialize();
  });
  
  afterAll(async () => {
    await claudeFlow.shutdown();
    await testEnv.cleanup();
  });
  
  it('should execute complete React development workflow', async () => {
    // This test simulates a full workflow from project analysis to deployment
    const project = testEnv.createReactProject();
    
    const workflow = await claudeFlow.createWorkflow('react-development', {
      projectPath: project.path,
      target: 'production'
    });
    
    const result = await workflow.execute();
    
    expect(result.success).toBe(true);
    expect(result.stages.completed).toBe(5);
    expect(result.artifacts).toHaveProperty('build');
    expect(result.artifacts).toHaveProperty('tests');
  }, 30000); // 30 second timeout for integration tests
});
```

### Test Coverage Requirements

- **Minimum Coverage**: 80% overall
- **Critical Paths**: 95% coverage required
- **New Code**: 100% coverage required
- **Integration Tests**: Cover all major workflows
- **E2E Tests**: Cover user-facing features

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Run with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run performance benchmarks
npm run test:benchmark
```

## Documentation

### Documentation Structure

- **README.md**: Main project overview and quick start
- **INSTALLATION.md**: Detailed installation instructions
- **USAGE.md**: Comprehensive usage guide
- **EXAMPLES.md**: Real-world examples and use cases
- **ADVANCED.md**: Advanced features and configuration
- **TROUBLESHOOTING.md**: Common issues and solutions
- **API.md**: API reference documentation
- **MCP.md**: MCP server development guide

### Writing Documentation

#### Style Guidelines
- **Clear and Concise**: Easy to understand for all skill levels
- **Action-Oriented**: Use active voice and imperative mood
- **Examples**: Include practical examples for all features
- **Code Blocks**: Use proper syntax highlighting
- **Links**: Link to related documentation and external resources

#### Markdown Standards
```markdown
# Primary Heading (H1) - Only one per document

## Secondary Heading (H2) - Main sections

### Tertiary Heading (H3) - Subsections

#### Quaternary Heading (H4) - Details

**Bold text** for emphasis and *italic text* for names/terms

`Inline code` for commands, variables, and short code snippets

```bash
# Code blocks for commands
npx claude-flow@2.0.0 init --claude --webui
```

```javascript
// Code blocks for programming examples
const config = {
  agents: 10,
  approach: 'hive'
};
```

> **Note**: Important information that users should know

> **Warning**: Critical information about potential issues

> **Tip**: Helpful suggestions to improve user experience
```

## MCP Server Development

### Creating New MCP Servers

MCP servers extend Claude Flow 2.0's capabilities by integrating with external tools and services.

#### Server Template Generation
```bash
# Generate MCP server template
npx claude-flow@2.0.0 mcp create-server \
  --name my-awesome-server \
  --template typescript \
  --capabilities read,write,execute

# Server structure
my-awesome-server/
├── src/
│   ├── server.ts         # Main server implementation
│   ├── handlers/         # Request handlers
│   ├── types.ts          # Type definitions
│   └── utils/            # Utility functions
├── tests/
│   ├── unit/             # Unit tests
│   └── integration/      # Integration tests
├── docs/
│   ├── README.md         # Server documentation
│   └── API.md            # API reference
├── package.json
└── mcp-config.json       # MCP server configuration
```

#### Server Implementation Example
```typescript
// src/server.ts
import { MCPServer, Request, Response } from '@claude-flow/mcp-sdk';

interface MyAwesomeServerConfig {
  apiKey: string;
  baseUrl: string;
  timeout?: number;
}

export class MyAwesomeServer extends MCPServer {
  private config: MyAwesomeServerConfig;
  
  constructor(config: MyAwesomeServerConfig) {
    super({
      name: 'my-awesome-server',
      version: '1.0.0',
      capabilities: ['read', 'write', 'execute']
    });
    
    this.config = config;
  }
  
  async handleRequest(request: Request): Promise<Response> {
    switch (request.method) {
      case 'list_resources':
        return this.listResources(request);
      case 'read_resource':
        return this.readResource(request);
      case 'execute_tool':
        return this.executeTool(request);
      default:
        throw new Error(`Unsupported method: ${request.method}`);
    }
  }
  
  private async listResources(request: Request): Promise<Response> {
    // Implementation for listing available resources
    const resources = await this.fetchResources();
    
    return {
      success: true,
      data: {
        resources: resources.map(resource => ({
          name: resource.name,
          type: resource.type,
          description: resource.description
        }))
      }
    };
  }
  
  private async readResource(request: Request): Promise<Response> {
    const { resourceId } = request.params;
    const resource = await this.fetchResource(resourceId);
    
    return {
      success: true,
      data: {
        content: resource.content,
        metadata: resource.metadata
      }
    };
  }
  
  private async executeTool(request: Request): Promise<Response> {
    const { tool, parameters } = request.params;
    
    try {
      const result = await this.runTool(tool, parameters);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'TOOL_EXECUTION_ERROR',
          message: error.message
        }
      };
    }
  }
}
```

#### Testing MCP Servers
```typescript
// tests/unit/server.test.ts
import { MyAwesomeServer } from '../src/server';

describe('MyAwesomeServer', () => {
  let server: MyAwesomeServer;
  
  beforeEach(() => {
    server = new MyAwesomeServer({
      apiKey: 'test-api-key',
      baseUrl: 'https://api.example.com'
    });
  });
  
  describe('listResources', () => {
    it('should return available resources', async () => {
      const request = {
        method: 'list_resources',
        params: {}
      };
      
      const response = await server.handleRequest(request);
      
      expect(response.success).toBe(true);
      expect(response.data.resources).toBeArray();
    });
  });
});
```

#### Publishing MCP Servers
```bash
# Test server locally
npx claude-flow@2.0.0 mcp test-server ./my-awesome-server

# Publish to npm
cd my-awesome-server
npm publish

# Register with Claude Flow registry
npx claude-flow@2.0.0 mcp register-server \
  --name my-awesome-server \
  --npm-package @myusername/my-awesome-server \
  --category integration
```

### Contributing to Existing MCP Servers

1. **Find the Server**: Browse existing MCP servers in the registry
2. **Fork Repository**: Fork the server's GitHub repository  
3. **Make Improvements**: Add features, fix bugs, improve documentation
4. **Test Changes**: Ensure all tests pass and add new tests
5. **Submit PR**: Follow the server's contribution guidelines

## Community Guidelines

### Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please read and follow our [Code of Conduct](./CODE_OF_CONDUCT.md).

#### Our Values
- **Respect**: Treat all community members with respect and kindness
- **Inclusivity**: Welcome contributors from all backgrounds and skill levels
- **Collaboration**: Work together to build amazing software
- **Learning**: Help each other learn and grow
- **Quality**: Strive for high-quality code and documentation

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General discussions, questions, and ideas
- **Discord**: Real-time chat and community support
- **Stack Overflow**: Technical questions (tag: `claude-flow-2.0`)
- **Twitter**: Follow [@ClaudeFlow](https://twitter.com/ClaudeFlow) for updates

### Best Practices for Community Interaction

#### Asking for Help
1. **Search First**: Check existing issues and documentation
2. **Provide Context**: Include relevant details about your environment
3. **Be Specific**: Describe the problem clearly with steps to reproduce
4. **Share Code**: Include relevant code snippets or configuration
5. **Follow Up**: Update the issue when the problem is resolved

#### Providing Help
1. **Be Patient**: Remember that everyone is learning
2. **Be Constructive**: Provide actionable suggestions
3. **Share Knowledge**: Link to relevant documentation or examples
4. **Encourage**: Help build confidence in new contributors

## Recognition

### Contributor Recognition

We believe in recognizing the valuable contributions of our community members:

#### Contribution Types
- **Code Contributors**: Bug fixes, features, performance improvements
- **Documentation Contributors**: Guides, tutorials, translations
- **Community Leaders**: Helping others, moderating discussions
- **MCP Server Developers**: Creating and maintaining MCP servers
- **Testers**: Finding bugs, performance testing, security testing
- **Designers**: UI/UX improvements, branding, visual assets

#### Recognition Levels

**🌱 First-Time Contributor**
- First merged pull request
- Welcome package with swag
- Mention in release notes

**🌿 Regular Contributor** 
- 5+ merged pull requests
- Contributor badge on GitHub profile
- Early access to new features

**🌳 Core Contributor**
- 25+ merged pull requests or significant contributions
- Listed on project website
- Input on project direction

**🌟 Maintainer**
- Extensive contributions over time
- Commit access to repository
- Decision-making authority

### Hall of Fame

Our contributors make Claude Flow 2.0 possible. Check out our [Contributors Hall of Fame](./CONTRIBUTORS.md) to see all the amazing people who have contributed to the project.

### Contribution Rewards

- **Swag**: Stickers, t-shirts, and other goodies for contributors
- **Conference Talks**: Opportunities to speak about Claude Flow 2.0
- **Beta Access**: Early access to new features and versions
- **Mentorship**: Connect with other experienced contributors
- **Job Opportunities**: Many contributors have found career opportunities

---

## Quick Reference

### Useful Commands

```bash
# Development setup
npm run setup-dev
npm run dev

# Testing
npm test
npm run test:coverage
npm run test:watch

# Linting and formatting
npm run lint
npm run lint:fix
npm run format

# Building
npm run build
npm run build:docs

# MCP development
npx claude-flow@2.0.0 mcp create-server
npx claude-flow@2.0.0 mcp test-server
```

### Resources

- **Documentation**: [Full Documentation](./README.md)
- **API Reference**: [API Documentation](./API.md)
- **Examples**: [Real-world Examples](./EXAMPLES.md)
- **Troubleshooting**: [Common Issues](./TROUBLESHOOTING.md)
- **Advanced Features**: [Advanced Guide](./ADVANCED.md)

### Getting Help

- **GitHub Issues**: [Report bugs or request features](https://github.com/yourusername/claude-flow-2.0/issues)
- **Discord**: [Join our community chat](https://discord.gg/claude-flow)
- **Stack Overflow**: [Ask technical questions](https://stackoverflow.com/questions/tagged/claude-flow-2.0)
- **Email**: [Contact maintainers](mailto:maintainers@claude-flow.com)

---

**Thank you for contributing to Claude Flow 2.0!** 🚀

Your contributions help make AI-powered development accessible to developers around the world.
