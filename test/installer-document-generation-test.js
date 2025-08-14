#!/usr/bin/env node

/**
 * Installer Document Generation and Customization Test Suite
 * 
 * Tests the installer's capability to:
 * 1. Analyze projects and detect technology stacks
 * 2. Generate customized CLAUDE.md configurations
 * 3. Create agent configurations based on project analysis
 * 4. Build proper scaffolding directory structures
 * 5. Place documents in correct locations
 * 6. Integrate with complexity analyzer and approach selector
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

// Mock implementations for testing (since actual installer components aren't available)
class MockComplexityAnalyzer {
  constructor(projectPath) {
    this.projectPath = projectPath;
  }

  async analyze() {
    // Simulate project analysis
    const packageJsonPath = path.join(this.projectPath, 'package.json');
    let score = 10;
    let stage = 'idea';
    let detectedTechnologies = [];
    let features = {};

    try {
      const packageContent = await fs.readFile(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(packageContent);
      
      // Analyze dependencies for complexity
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      score = Object.keys(deps).length * 3;
      
      // Detect technologies
      if (deps.react) detectedTechnologies.push('React');
      if (deps.express) detectedTechnologies.push('Express.js');
      if (deps.typescript) detectedTechnologies.push('TypeScript');
      if (deps.mongoose || deps.mongodb) detectedTechnologies.push('MongoDB');
      if (deps.postgresql || deps.pg) detectedTechnologies.push('PostgreSQL');
      if (deps.redis) detectedTechnologies.push('Redis');
      
      // Detect features
      if (deps.jsonwebtoken || deps['@auth0/auth0-react']) features.authentication = true;
      if (deps['socket.io'] || deps.ws) features.realtime = true;
      if (deps.stripe) features.payments = true;
      
      // Determine stage
      const files = await fs.readdir(this.projectPath);
      if (files.includes('src') && files.includes('package.json')) {
        stage = files.includes('dist') || files.includes('build') ? 'mature' : 'active';
      }
      
      score += detectedTechnologies.length * 5;
      
    } catch (error) {
      // Fallback for projects without package.json
      const files = await fs.readdir(this.projectPath);
      if (files.some(f => f.endsWith('.md'))) {
        stage = 'idea';
        score = 5;
      }
    }

    return {
      score: Math.min(score, 100),
      stage,
      detectedTechnologies,
      features,
      factors: {
        fileCount: (await this.getFileCount()),
        complexity: score,
        features: { detected: features }
      }
    };
  }

  async getFileCount() {
    try {
      const files = await fs.readdir(this.projectPath, { recursive: true });
      return files.length;
    } catch {
      return 0;
    }
  }
}

class MockApproachSelector {
  selectApproach(analysis, userChoice = null) {
    if (userChoice) {
      return {
        selected: userChoice === 'simple-swarm' ? 'simpleSwarm' : 
                 userChoice === 'hive-mind' ? 'hiveMind' : 'hiveMindSparc',
        name: userChoice,
        command: `npx --yes claude-flow@latest ${userChoice}`,
        mismatch: this.checkMismatch(analysis.score, userChoice)
      };
    }

    if (analysis.score < 30) {
      return {
        selected: 'simpleSwarm',
        name: 'Simple Swarm',
        command: 'npx --yes claude-flow@latest simple-swarm',
        mismatch: false
      };
    } else if (analysis.score < 70) {
      return {
        selected: 'hiveMind',
        name: 'Hive-Mind',
        command: 'npx --yes claude-flow@latest hive-mind',
        mismatch: false
      };
    } else {
      return {
        selected: 'hiveMindSparc',
        name: 'Hive-Mind with SPARC',
        command: 'npx --yes claude-flow@latest hive-mind --sparc',
        mismatch: false
      };
    }
  }

  checkMismatch(score, userChoice) {
    if (score < 30 && userChoice !== 'simple-swarm') return true;
    if (score >= 70 && userChoice === 'simple-swarm') return true;
    return false;
  }
}

class MockDocumentCustomizer {
  constructor() {
    this.templates = {
      'CLAUDE.md': this.generateClaudeTemplate,
      'agent-os/instructions.md': this.generateAgentOsTemplate,
      'workflows/config.json': this.generateWorkflowConfig,
      'CONTRIBUTING.md': this.generateContributingTemplate,
      'ARCHITECTURE.md': this.generateArchitectureTemplate
    };
  }

  async generateDocuments(projectPath, analysis, approach) {
    const documents = {};
    
    for (const [filename, generator] of Object.entries(this.templates)) {
      documents[filename] = await generator.call(this, projectPath, analysis, approach);
    }
    
    return documents;
  }

  generateClaudeTemplate(projectPath, analysis, approach) {
    return `# Claude Configuration - ${analysis.stage} Stage Project

## Project Analysis
- **Complexity Score**: ${analysis.score}/100
- **Stage**: ${analysis.stage}
- **Selected Approach**: ${approach.name}
- **Command**: \`${approach.command}\`

## Technology Stack
${analysis.detectedTechnologies.map(tech => `- **${tech}**: Detected and configured`).join('\n')}

## Detected Features
${Object.entries(analysis.features).map(([feature, enabled]) => 
  enabled ? `- **${feature.charAt(0).toUpperCase() + feature.slice(1)}**: Enabled` : ''
).filter(Boolean).join('\n')}

## Development Guidelines
- Follow established patterns for ${analysis.detectedTechnologies.join(', ')}
- Use async/await for asynchronous operations
- Implement proper error handling
- Maintain consistent code quality

## Stage-Specific Instructions (${analysis.stage})
${this.getStageInstructions(analysis.stage)}

## Architecture: ${analysis.detectedTechnologies.includes('React') ? 'frontend' : 'backend'}
${this.getArchitectureGuidelines(analysis.detectedTechnologies)}

## Workflow Configuration
${approach.selected === 'simpleSwarm' ? '- Single-agent execution' : 
  approach.selected === 'hiveMind' ? '- Multi-agent coordination\n- Parallel task execution' :
  '- Multi-agent coordination\n- SPARC methodology\n- Advanced planning and refinement'}
`;
  }

  generateAgentOsTemplate(projectPath, analysis, approach) {
    return `# Agent-OS Integration Instructions

## Project Specifications

### Core Features
${Object.keys(analysis.features).map(feature => `- ${feature.charAt(0).toUpperCase() + feature.slice(1)}`).join('\n')}

### Architecture Pattern
- **Type**: ${analysis.detectedTechnologies.includes('React') ? 'Frontend Application' : 'Backend Service'}
- **Approach**: ${approach.name}
- **Complexity**: ${analysis.score}/100

### Planning Commands
- \`/analyze-project\` - Analyze current codebase
- \`/plan-features\` - Generate feature roadmap
- \`/create-spec [feature]\` - Create feature specification
- \`/execute-tasks\` - Execute planned tasks

## Workflow Integration
1. Analyze with complexity-analyzer: ${analysis.score}/100
2. Generate specifications based on detected technologies
3. Create implementation plan for ${approach.name}
4. Execute with ${approach.selected} approach
`;
  }

  generateWorkflowConfig(projectPath, analysis, approach) {
    return JSON.stringify({
      workflow: {
        type: approach.selected,
        version: "2.0",
        project: {
          name: path.basename(projectPath),
          type: analysis.detectedTechnologies.includes('React') ? 'web-app' : 'api-service',
          technologies: analysis.detectedTechnologies,
          complexity: analysis.score,
          stage: analysis.stage
        },
        execution: {
          command: approach.command,
          timeout: "30m",
          retries: 2,
          maxAgents: approach.selected === 'simpleSwarm' ? 1 : 10
        },
        features: analysis.features
      }
    }, null, 2);
  }

  generateContributingTemplate(projectPath, analysis, approach) {
    return `# Contributing to ${path.basename(projectPath)}

## Development Setup

### Prerequisites
${analysis.detectedTechnologies.includes('Node.js') || analysis.detectedTechnologies.some(t => ['React', 'Express.js'].includes(t)) ? '- Node.js (v18+)' : ''}
${analysis.detectedTechnologies.includes('TypeScript') ? '- TypeScript knowledge' : ''}
${analysis.detectedTechnologies.includes('MongoDB') ? '- MongoDB running locally' : ''}
${analysis.detectedTechnologies.includes('PostgreSQL') ? '- PostgreSQL running locally' : ''}

### Installation
\`\`\`bash
npm install
${analysis.features.authentication ? 'cp .env.example .env  # Configure auth secrets' : ''}
${analysis.features.payments ? '# Configure Stripe keys in .env' : ''}
\`\`\`

## Development Workflow
This project uses **${approach.name}** for AI-assisted development.

### Commands
- \`${approach.command}\` - Start AI workflow
- \`npm test\` - Run tests
- \`npm run build\` - Build for production

## Technology Guidelines

${analysis.detectedTechnologies.map(tech => this.getTechGuidelines(tech)).join('\n\n')}

## Features
${Object.keys(analysis.features).map(feature => `- **${feature}**: Follow security best practices`).join('\n')}
`;
  }

  generateArchitectureTemplate(projectPath, analysis, approach) {
    return `# Architecture Overview - ${path.basename(projectPath)}

## System Design

### Technology Stack
${analysis.detectedTechnologies.map(tech => `- **${tech}**`).join('\n')}

### Architecture Type
${analysis.detectedTechnologies.includes('React') ? 
  '- **Frontend**: Single Page Application (SPA)' : 
  '- **Backend**: RESTful API Service'}

### Complexity Analysis
- **Score**: ${analysis.score}/100
- **Stage**: ${analysis.stage}
- **Approach**: ${approach.name}

## Components

### Core Services
${this.getComponentsList(analysis.detectedTechnologies)}

### Features
${Object.entries(analysis.features).map(([feature, enabled]) => 
  `- **${feature}**: ${enabled ? 'Implemented' : 'Planned'}`
).join('\n')}

## Deployment Architecture
${approach.selected === 'simpleSwarm' ? 
  '- Single deployment unit' : 
  '- Multi-service deployment\n- Container orchestration ready'}

## Data Flow
${this.getDataFlowDescription(analysis.detectedTechnologies, analysis.features)}

## Security Considerations
${analysis.features.authentication ? '- JWT-based authentication' : ''}
${analysis.features.payments ? '- PCI compliance for payment processing' : ''}
- Input validation and sanitization
- Rate limiting and DDoS protection
`;
  }

  getStageInstructions(stage) {
    switch (stage) {
      case 'idea':
        return '- Focus on planning and specification\n- Create detailed requirements\n- Set up basic project structure';
      case 'active':
        return '- Maintain consistent code quality\n- Add features systematically\n- Ensure adequate test coverage';
      case 'mature':
        return '- Focus on optimization and scaling\n- Maintain backward compatibility\n- Implement advanced monitoring';
      default:
        return '- Follow general best practices\n- Document all changes';
    }
  }

  getArchitectureGuidelines(technologies) {
    const guidelines = [];
    
    if (technologies.includes('React')) {
      guidelines.push('- Component-based architecture');
      guidelines.push('- State management with hooks or Redux');
    }
    
    if (technologies.includes('Express.js')) {
      guidelines.push('- RESTful API design');
      guidelines.push('- Middleware pattern for cross-cutting concerns');
    }
    
    if (technologies.includes('MongoDB')) {
      guidelines.push('- Document-based data modeling');
      guidelines.push('- Mongoose ODM for schema validation');
    }
    
    if (technologies.includes('PostgreSQL')) {
      guidelines.push('- Relational data modeling');
      guidelines.push('- SQL query optimization');
    }
    
    return guidelines.join('\n') || '- Follow established architecture patterns';
  }

  getTechGuidelines(tech) {
    switch (tech) {
      case 'React':
        return `### ${tech}
- Use functional components with hooks
- Follow JSX best practices
- Implement proper prop validation`;
      case 'Express.js':
        return `### ${tech}
- Use middleware for common functionality
- Implement proper error handling
- Follow RESTful conventions`;
      case 'TypeScript':
        return `### ${tech}
- Use strict mode
- Define interfaces for data structures
- Leverage type inference when possible`;
      case 'MongoDB':
        return `### ${tech}
- Design schemas with Mongoose
- Use indexes for performance
- Implement proper data validation`;
      default:
        return `### ${tech}
- Follow ${tech} best practices
- Keep dependencies up to date`;
    }
  }

  getComponentsList(technologies) {
    const components = [];
    
    if (technologies.includes('Express.js')) {
      components.push('- **API Server**: Express.js application');
      components.push('- **Routes**: RESTful endpoint handlers');
      components.push('- **Middleware**: Authentication, logging, validation');
    }
    
    if (technologies.includes('React')) {
      components.push('- **UI Components**: React functional components');
      components.push('- **State Management**: Context API or Redux');
      components.push('- **Routing**: React Router for SPA navigation');
    }
    
    if (technologies.includes('MongoDB')) {
      components.push('- **Database**: MongoDB with Mongoose ODM');
      components.push('- **Models**: Data schemas and validation');
    }
    
    if (technologies.includes('PostgreSQL')) {
      components.push('- **Database**: PostgreSQL with connection pooling');
      components.push('- **Queries**: SQL queries with prepared statements');
    }
    
    return components.join('\n') || '- **Core Application**: Main application logic';
  }

  getDataFlowDescription(technologies, features) {
    let flow = [];
    
    if (technologies.includes('React')) {
      flow.push('1. **Client**: React application in browser');
      flow.push('2. **API Calls**: HTTP requests to backend');
    }
    
    if (technologies.includes('Express.js')) {
      flow.push('3. **API Layer**: Express.js routes and middleware');
      flow.push('4. **Business Logic**: Service layer processing');
    }
    
    if (technologies.includes('MongoDB') || technologies.includes('PostgreSQL')) {
      flow.push('5. **Data Layer**: Database operations and persistence');
    }
    
    if (features.authentication) {
      flow.push('- **Authentication**: JWT validation on protected routes');
    }
    
    if (features.realtime) {
      flow.push('- **Real-time**: WebSocket connections for live updates');
    }
    
    return flow.join('\n') || 'Standard request-response cycle';
  }
}

class InstallerDocumentTester {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      errors: []
    };
    this.tempDirs = [];
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',    // cyan
      success: '\x1b[32m', // green
      error: '\x1b[31m',   // red
      warning: '\x1b[33m', // yellow
      reset: '\x1b[0m'
    };
    
    console.log(`${colors[type]}${message}${colors.reset}`);
  }

  async createSampleProject(type, basePath) {
    const projectPath = path.join(basePath, type);
    await fs.mkdir(projectPath, { recursive: true });

    switch (type) {
      case 'react-express-app':
        await this.createReactExpressProject(projectPath);
        break;
      case 'simple-api':
        await this.createSimpleApiProject(projectPath);
        break;
      case 'idea-project':
        await this.createIdeaProject(projectPath);
        break;
      case 'complex-ecommerce':
        await this.createComplexEcommerceProject(projectPath);
        break;
    }

    return projectPath;
  }

  async createReactExpressProject(projectPath) {
    // Package.json
    await fs.writeFile(path.join(projectPath, 'package.json'), JSON.stringify({
      name: 'react-express-app',
      version: '1.0.0',
      description: 'Full-stack React and Express application',
      scripts: {
        start: 'node server.js',
        dev: 'concurrently "npm run server" "npm run client"',
        server: 'nodemon server.js',
        client: 'cd client && npm start',
        build: 'cd client && npm run build'
      },
      dependencies: {
        express: '^4.18.0',
        mongoose: '^7.0.0',
        jsonwebtoken: '^9.0.0',
        bcryptjs: '^2.4.3',
        cors: '^2.8.5'
      },
      devDependencies: {
        nodemon: '^2.0.20',
        concurrently: '^7.6.0'
      }
    }, null, 2));

    // Client package.json
    await fs.mkdir(path.join(projectPath, 'client'), { recursive: true });
    await fs.writeFile(path.join(projectPath, 'client', 'package.json'), JSON.stringify({
      name: 'client',
      version: '1.0.0',
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0',
        'react-router-dom': '^6.8.0',
        axios: '^1.3.0'
      }
    }, null, 2));

    // Create directory structure
    const dirs = [
      'client/src/components',
      'client/src/pages',
      'client/public',
      'server/routes',
      'server/models',
      'server/middleware'
    ];

    for (const dir of dirs) {
      await fs.mkdir(path.join(projectPath, dir), { recursive: true });
    }

    // Sample files
    await fs.writeFile(path.join(projectPath, 'server.js'), `
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/auth', require('./server/routes/auth'));
app.use('/api/users', require('./server/routes/users'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log('Server running on port ' + PORT));
`);

    await fs.writeFile(path.join(projectPath, 'client/src/App.js'), `
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
`);
  }

  async createSimpleApiProject(projectPath) {
    await fs.writeFile(path.join(projectPath, 'package.json'), JSON.stringify({
      name: 'simple-api',
      version: '1.0.0',
      description: 'Simple REST API',
      main: 'index.js',
      scripts: {
        start: 'node index.js',
        dev: 'nodemon index.js',
        test: 'jest'
      },
      dependencies: {
        express: '^4.18.0',
        cors: '^2.8.5'
      },
      devDependencies: {
        nodemon: '^2.0.20',
        jest: '^29.0.0'
      }
    }, null, 2));

    await fs.writeFile(path.join(projectPath, 'index.js'), `
const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('API server running on port ' + PORT));
`);
  }

  async createIdeaProject(projectPath) {
    await fs.writeFile(path.join(projectPath, 'README.md'), `# E-Commerce Platform Idea

## Overview
A modern e-commerce platform with the following features:

## Planned Features
- User authentication and authorization
- Product catalog with search and filtering
- Shopping cart and checkout process
- Payment integration with Stripe
- Order management system
- Admin dashboard
- Real-time notifications
- Mobile-responsive design

## Technology Stack (Planned)
- Frontend: React.js with TypeScript
- Backend: Node.js with Express.js
- Database: MongoDB with Mongoose
- Authentication: JWT
- Payments: Stripe API
- Real-time: Socket.io
- Deployment: Docker + AWS

## Timeline
- Phase 1: Basic setup and user auth (2 weeks)
- Phase 2: Product catalog (3 weeks)
- Phase 3: Shopping cart and checkout (3 weeks)
- Phase 4: Payment integration (2 weeks)
- Phase 5: Admin dashboard (2 weeks)
- Phase 6: Testing and deployment (1 week)
`);

    await fs.writeFile(path.join(projectPath, 'REQUIREMENTS.md'), `# Requirements Document

## Functional Requirements

### User Management
- Users can register with email and password
- Users can login and logout
- Password reset functionality
- User profile management

### Product Management
- Browse products by category
- Search products by name/description
- View product details
- Product reviews and ratings

### Shopping Cart
- Add/remove products from cart
- Update quantities
- Persist cart across sessions
- Calculate totals with taxes

### Checkout Process
- Guest and registered checkout
- Multiple payment methods
- Order confirmation
- Email notifications

## Non-Functional Requirements
- Support 1000+ concurrent users
- 99.9% uptime
- Mobile-first design
- WCAG 2.1 accessibility
- PCI DSS compliance for payments
`);
  }

  async createComplexEcommerceProject(projectPath) {
    await fs.writeFile(path.join(projectPath, 'package.json'), JSON.stringify({
      name: 'complex-ecommerce-platform',
      version: '2.1.0',
      description: 'Enterprise e-commerce platform',
      scripts: {
        start: 'node server/index.js',
        dev: 'concurrently "npm run server:dev" "npm run client:dev" "npm run admin:dev"',
        'server:dev': 'nodemon server/index.js',
        'client:dev': 'cd client && npm start',
        'admin:dev': 'cd admin && npm start',
        build: 'npm run build:client && npm run build:admin',
        'build:client': 'cd client && npm run build',
        'build:admin': 'cd admin && npm run build',
        test: 'jest --coverage',
        'test:e2e': 'cypress run',
        lint: 'eslint .',
        deploy: 'docker-compose up -d'
      },
      dependencies: {
        express: '^4.18.0',
        mongoose: '^7.0.0',
        redis: '^4.6.0',
        'socket.io': '^4.6.0',
        jsonwebtoken: '^9.0.0',
        bcryptjs: '^2.4.3',
        stripe: '^12.0.0',
        nodemailer: '^6.9.0',
        'express-rate-limit': '^6.7.0',
        helmet: '^6.1.0',
        cors: '^2.8.5',
        dotenv: '^16.0.0'
      },
      devDependencies: {
        nodemon: '^2.0.20',
        concurrently: '^7.6.0',
        jest: '^29.0.0',
        cypress: '^12.0.0',
        eslint: '^8.36.0',
        prettier: '^2.8.0'
      }
    }, null, 2));

    // Create complex directory structure
    const dirs = [
      'server/controllers',
      'server/models',
      'server/routes',
      'server/middleware',
      'server/services',
      'server/utils',
      'client/src/components',
      'client/src/pages',
      'client/src/hooks',
      'client/src/context',
      'client/src/services',
      'admin/src/components',
      'admin/src/pages',
      'tests/unit',
      'tests/integration',
      'tests/e2e',
      'docs',
      'scripts',
      'k8s',
      '.github/workflows'
    ];

    for (const dir of dirs) {
      await fs.mkdir(path.join(projectPath, dir), { recursive: true });
    }

    // Client package.json
    await fs.writeFile(path.join(projectPath, 'client/package.json'), JSON.stringify({
      name: 'ecommerce-client',
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0',
        'react-router-dom': '^6.8.0',
        'react-query': '^3.39.0',
        axios: '^1.3.0',
        'socket.io-client': '^4.6.0',
        '@stripe/stripe-js': '^1.52.0',
        '@stripe/react-stripe-js': '^2.1.0',
        'react-hook-form': '^7.43.0',
        'react-toastify': '^9.1.0'
      }
    }, null, 2));

    // Admin package.json
    await fs.writeFile(path.join(projectPath, 'admin/package.json'), JSON.stringify({
      name: 'ecommerce-admin',
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0',
        'react-router-dom': '^6.8.0',
        'react-admin': '^4.8.0',
        '@mui/material': '^5.11.0',
        'recharts': '^2.5.0'
      }
    }, null, 2));

    // Docker files
    await fs.writeFile(path.join(projectPath, 'Dockerfile'), `
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
`);

    await fs.writeFile(path.join(projectPath, 'docker-compose.yml'), `
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/ecommerce
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongo
      - redis

  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  mongo_data:
`);

    // Kubernetes deployment
    await fs.writeFile(path.join(projectPath, 'k8s/deployment.yaml'), `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ecommerce-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ecommerce-api
  template:
    metadata:
      labels:
        app: ecommerce-api
    spec:
      containers:
      - name: api
        image: ecommerce-platform:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
`);

    // GitHub Actions workflow
    await fs.writeFile(path.join(projectPath, '.github/workflows/ci.yml'), `
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run test:e2e

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to AWS
        run: |
          # Deployment script here
`);
  }

  async testProjectAnalysis(projectPath, expectedType) {
    try {
      this.log(`\n🔍 Testing project analysis for ${path.basename(projectPath)}`, 'info');
      
      const analyzer = new MockComplexityAnalyzer(projectPath);
      const analysis = await analyzer.analyze();
      
      this.log(`  - Complexity Score: ${analysis.score}/100`, 'info');
      this.log(`  - Stage: ${analysis.stage}`, 'info');
      this.log(`  - Technologies: ${analysis.detectedTechnologies.join(', ') || 'None detected'}`, 'info');
      this.log(`  - Features: ${Object.keys(analysis.features).join(', ') || 'None detected'}`, 'info');
      
      // Verify analysis results
      if (analysis.score === undefined || analysis.stage === undefined) {
        throw new Error('Analysis missing required fields');
      }
      
      if (expectedType === 'complex' && analysis.score < 50) {
        throw new Error(`Expected complex project to have score > 50, got ${analysis.score}`);
      }
      
      if (expectedType === 'simple' && analysis.score > 30) {
        throw new Error(`Expected simple project to have score < 30, got ${analysis.score}`);
      }
      
      this.testResults.passed++;
      this.log('  ✅ Project analysis test passed', 'success');
      
      return analysis;
    } catch (error) {
      this.testResults.failed++;
      this.testResults.errors.push(`Project analysis failed: ${error.message}`);
      this.log(`  ❌ Project analysis test failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async testApproachSelection(analysis, expectedApproach) {
    try {
      this.log('\n🎯 Testing approach selection', 'info');
      
      const selector = new MockApproachSelector();
      const recommendation = selector.selectApproach(analysis);
      
      this.log(`  - Selected: ${recommendation.name}`, 'info');
      this.log(`  - Command: ${recommendation.command}`, 'info');
      this.log(`  - Mismatch: ${recommendation.mismatch}`, 'info');
      
      if (!recommendation.selected || !recommendation.command) {
        throw new Error('Approach selection missing required fields');
      }
      
      if (expectedApproach && recommendation.selected !== expectedApproach) {
        this.log(`  ⚠️ Expected ${expectedApproach}, got ${recommendation.selected}`, 'warning');
      }
      
      this.testResults.passed++;
      this.log('  ✅ Approach selection test passed', 'success');
      
      return recommendation;
    } catch (error) {
      this.testResults.failed++;
      this.testResults.errors.push(`Approach selection failed: ${error.message}`);
      this.log(`  ❌ Approach selection test failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async testDocumentGeneration(projectPath, analysis, approach) {
    try {
      this.log('\n📝 Testing document generation', 'info');
      
      const customizer = new MockDocumentCustomizer();
      const documents = await customizer.generateDocuments(projectPath, analysis, approach);
      
      // Verify all expected documents were generated
      const expectedDocs = ['CLAUDE.md', 'agent-os/instructions.md', 'workflows/config.json', 'CONTRIBUTING.md', 'ARCHITECTURE.md'];
      const generatedDocs = Object.keys(documents);
      
      for (const expectedDoc of expectedDocs) {
        if (!generatedDocs.includes(expectedDoc)) {
          throw new Error(`Missing expected document: ${expectedDoc}`);
        }
        
        if (!documents[expectedDoc] || documents[expectedDoc].length < 100) {
          throw new Error(`Document ${expectedDoc} is empty or too short`);
        }
      }
      
      // Verify document content includes project-specific information
      const claudeDoc = documents['CLAUDE.md'];
      if (!claudeDoc.includes(analysis.stage) || !claudeDoc.includes(approach.name)) {
        throw new Error('CLAUDE.md missing project-specific information');
      }
      
      // Verify technology-specific content
      for (const tech of analysis.detectedTechnologies) {
        if (!claudeDoc.includes(tech)) {
          this.log(`  ⚠️ Technology ${tech} not mentioned in CLAUDE.md`, 'warning');
        }
      }
      
      // Verify JSON configuration is valid
      const workflowConfig = documents['workflows/config.json'];
      try {
        const parsedConfig = JSON.parse(workflowConfig);
        if (!parsedConfig.workflow || !parsedConfig.workflow.type) {
          throw new Error('Invalid workflow configuration structure');
        }
      } catch (parseError) {
        throw new Error(`Invalid JSON in workflow config: ${parseError.message}`);
      }
      
      this.testResults.passed++;
      this.log('  ✅ Document generation test passed', 'success');
      this.log(`  - Generated ${generatedDocs.length} documents`, 'info');
      this.log(`  - CLAUDE.md: ${documents['CLAUDE.md'].length} characters`, 'info');
      this.log(`  - CONTRIBUTING.md: ${documents['CONTRIBUTING.md'].length} characters`, 'info');
      this.log(`  - ARCHITECTURE.md: ${documents['ARCHITECTURE.md'].length} characters`, 'info');
      
      return documents;
    } catch (error) {
      this.testResults.failed++;
      this.testResults.errors.push(`Document generation failed: ${error.message}`);
      this.log(`  ❌ Document generation test failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async testScaffoldingAndPlacement(projectPath, documents) {
    try {
      this.log('\n🏗️ Testing scaffolding and document placement', 'info');
      
      // Create scaffolding directories
      const scaffoldDirs = [
        '.claude',
        '.agent-os/instructions',
        'workflows',
        'docs'
      ];
      
      for (const dir of scaffoldDirs) {
        const dirPath = path.join(projectPath, dir);
        await fs.mkdir(dirPath, { recursive: true });
        
        // Verify directory was created
        const stats = await fs.stat(dirPath);
        if (!stats.isDirectory()) {
          throw new Error(`Failed to create directory: ${dir}`);
        }
      }
      
      // Place documents in correct locations
      const documentPlacements = {
        'CLAUDE.md': '.claude/CLAUDE.md',
        'agent-os/instructions.md': '.agent-os/instructions/instructions.md',
        'workflows/config.json': 'workflows/config.json',
        'CONTRIBUTING.md': 'docs/CONTRIBUTING.md',
        'ARCHITECTURE.md': 'docs/ARCHITECTURE.md'
      };
      
      for (const [docKey, filePath] of Object.entries(documentPlacements)) {
        const fullPath = path.join(projectPath, filePath);
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, documents[docKey]);
        
        // Verify file was created and has content
        const stats = await fs.stat(fullPath);
        if (stats.size === 0) {
          throw new Error(`Empty file created: ${filePath}`);
        }
      }
      
      // Verify all files are in correct locations
      for (const filePath of Object.values(documentPlacements)) {
        const fullPath = path.join(projectPath, filePath);
        try {
          await fs.access(fullPath);
        } catch {
          throw new Error(`File not found in expected location: ${filePath}`);
        }
      }
      
      this.testResults.passed++;
      this.log('  ✅ Scaffolding and placement test passed', 'success');
      this.log(`  - Created ${scaffoldDirs.length} scaffold directories`, 'info');
      this.log(`  - Placed ${Object.keys(documentPlacements).length} documents`, 'info');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.errors.push(`Scaffolding and placement failed: ${error.message}`);
      this.log(`  ❌ Scaffolding and placement test failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async testIntegrationWithComplexityAnalyzer(projectPath) {
    try {
      this.log('\n🔗 Testing integration with complexity analyzer', 'info');
      
      // Test that complexity analyzer correctly identifies project characteristics
      const analyzer = new MockComplexityAnalyzer(projectPath);
      const analysis = await analyzer.analyze();
      
      // Test approach selector uses analysis results
      const selector = new MockApproachSelector();
      const recommendation = selector.selectApproach(analysis);
      
      // Verify integration: approach should match complexity
      if (analysis.score < 30 && recommendation.selected !== 'simpleSwarm') {
        this.log('  ⚠️ Low complexity project not assigned to Simple Swarm', 'warning');
      }
      
      if (analysis.score > 70 && recommendation.selected === 'simpleSwarm') {
        this.log('  ⚠️ High complexity project assigned to Simple Swarm', 'warning');
      }
      
      // Test that document generation uses both analysis and recommendation
      const customizer = new MockDocumentCustomizer();
      const documents = await customizer.generateDocuments(projectPath, analysis, recommendation);
      
      const claudeDoc = documents['CLAUDE.md'];
      
      // Verify integration: documents should reflect both analysis and recommendation
      if (!claudeDoc.includes(analysis.score.toString()) || !claudeDoc.includes(recommendation.name)) {
        throw new Error('Documents do not reflect integrated analysis and recommendation');
      }
      
      this.testResults.passed++;
      this.log('  ✅ Integration test passed', 'success');
      this.log(`  - Analysis score: ${analysis.score} → ${recommendation.name}`, 'info');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.errors.push(`Integration test failed: ${error.message}`);
      this.log(`  ❌ Integration test failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async runFullTest(projectType, expectedComplexity, expectedApproach) {
    try {
      this.log(`\n🚀 Starting full installer test for ${projectType}`, 'info');
      
      // Create temporary directory
      const tempDir = path.join(os.tmpdir(), `installer-test-${Date.now()}`);
      this.tempDirs.push(tempDir);
      await fs.mkdir(tempDir, { recursive: true });
      
      // Create sample project
      const projectPath = await this.createSampleProject(projectType, tempDir);
      
      // Run all tests in sequence
      const analysis = await this.testProjectAnalysis(projectPath, expectedComplexity);
      const approach = await this.testApproachSelection(analysis, expectedApproach);
      const documents = await this.testDocumentGeneration(projectPath, analysis, approach);
      await this.testScaffoldingAndPlacement(projectPath, documents);
      await this.testIntegrationWithComplexityAnalyzer(projectPath);
      
      this.log(`\n✅ Full installer test for ${projectType} completed successfully`, 'success');
      
      return {
        projectType,
        projectPath,
        analysis,
        approach,
        documents
      };
      
    } catch (error) {
      this.log(`\n❌ Full installer test for ${projectType} failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async cleanup() {
    for (const tempDir of this.tempDirs) {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (error) {
        this.log(`Warning: Failed to cleanup ${tempDir}: ${error.message}`, 'warning');
      }
    }
  }

  generateReport() {
    const total = this.testResults.passed + this.testResults.failed;
    const passRate = total > 0 ? (this.testResults.passed / total) * 100 : 0;
    
    this.log('\n📊 Test Results Summary', 'info');
    this.log('================================', 'info');
    this.log(`✅ Passed: ${this.testResults.passed}`, 'success');
    this.log(`❌ Failed: ${this.testResults.failed}`, 'error');
    this.log(`📈 Pass Rate: ${passRate.toFixed(1)}%`, passRate >= 90 ? 'success' : 'warning');
    
    if (this.testResults.errors.length > 0) {
      this.log('\n❌ Error Details:', 'error');
      this.testResults.errors.forEach((error, index) => {
        this.log(`${index + 1}. ${error}`, 'error');
      });
    }
    
    return {
      passed: this.testResults.passed,
      failed: this.testResults.failed,
      passRate,
      errors: this.testResults.errors
    };
  }
}

// Main test runner
async function runInstallerDocumentTests() {
  const tester = new InstallerDocumentTester();
  
  try {
    tester.log('🔧 Installer Document Generation and Customization Test Suite', 'info');
    tester.log('================================================================', 'info');
    
    // Test different project types
    const testCases = [
      { type: 'simple-api', complexity: 'simple', approach: 'simpleSwarm' },
      { type: 'react-express-app', complexity: 'medium', approach: 'hiveMind' },
      { type: 'idea-project', complexity: 'simple', approach: 'simpleSwarm' },
      { type: 'complex-ecommerce', complexity: 'complex', approach: 'hiveMindSparc' }
    ];
    
    const results = [];
    
    for (const testCase of testCases) {
      try {
        const result = await tester.runFullTest(testCase.type, testCase.complexity, testCase.approach);
        results.push(result);
      } catch (error) {
        tester.log(`Test case ${testCase.type} failed: ${error.message}`, 'error');
      }
    }
    
    // Generate final report
    const report = tester.generateReport();
    
    if (report.passRate >= 90) {
      tester.log('\n🎉 Installer document generation tests PASSED!', 'success');
      tester.log('All core functionality is working correctly.', 'success');
    } else {
      tester.log('\n⚠️ Some installer tests failed', 'warning');
      tester.log('Review the errors above for details.', 'warning');
    }
    
    return {
      report,
      results,
      success: report.passRate >= 90
    };
    
  } finally {
    await tester.cleanup();
  }
}

// Export for module usage
module.exports = {
  InstallerDocumentTester,
  MockComplexityAnalyzer,
  MockApproachSelector,
  MockDocumentCustomizer,
  runInstallerDocumentTests
};

// Run tests if executed directly
if (require.main === module) {
  runInstallerDocumentTests()
    .then((result) => {
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}