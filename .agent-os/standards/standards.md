# Coding Standards - Claude Flow Workflow System

## Overview
Standards for the Claude Flow 2.0 autonomous workflow system with Queen Controller architecture and 10 concurrent sub-agents.

## Agent-OS Integration Standards
- **Context Optimization**: Target 75% context reduction through conditional loading
- **Agent Communication**: Use event-driven architecture with shared SQLite memory
- **Specification Driven**: All features must have Agent-OS specifications before implementation
- **Three-Layer Architecture**: Separate standards, product, and specification contexts

## Code Style

### JavaScript/TypeScript Standards
- Use 2 spaces for indentation
- Use single quotes for strings
- Add semicolons at the end of statements
- Use camelCase for variables and functions
- Use PascalCase for classes and components
- Use UPPER_SNAKE_CASE for constants
- Prefer async/await over Promises for asynchronous code
- Use ES6+ features (destructuring, arrow functions, template literals)
- Implement proper error handling with try/catch blocks

### Node.js Standards
- Use strict mode ('use strict')
- Implement proper module exports/imports
- Use EventEmitter for pub/sub patterns
- Implement graceful shutdown handling
- Use appropriate logging levels (debug, info, warn, error)

### Database Standards (SQLite)
- Use parameterized queries to prevent SQL injection
- Implement proper connection pooling
- Use transactions for atomic operations
- Include migration scripts for schema changes
- Implement proper backup strategies

### Testing Standards
- Maintain >80% test coverage
- Use Jest for unit testing
- Implement integration tests for APIs
- Use meaningful test descriptions
- Mock external dependencies properly

### Documentation Standards
- Document all public APIs with JSDoc
- Include usage examples in documentation
- Maintain up-to-date README files
- Document architecture decisions
- Include troubleshooting guides

### Performance Standards
- Optimize for 200k token context windows per agent
- Implement caching where appropriate
- Monitor memory usage and optimize
- Use efficient algorithms and data structures
- Profile performance-critical code paths

### Security Standards
- Validate all inputs
- Use environment variables for sensitive data
- Implement proper authentication/authorization
- Regular dependency security audits
- Follow OWASP security guidelines
