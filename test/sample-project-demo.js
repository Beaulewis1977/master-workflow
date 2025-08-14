#!/usr/bin/env node

/**
 * Sample Project Demo - Shows Generated Documents
 * 
 * This script demonstrates what documents would be generated
 * for a typical React/Express project by the installer.
 */

const { MockComplexityAnalyzer, MockApproachSelector, MockDocumentCustomizer } = require('./installer-document-generation-test.js');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

async function createSampleProject() {
  const tempDir = path.join(os.tmpdir(), `sample-demo-${Date.now()}`);
  await fs.mkdir(tempDir, { recursive: true });
  
  // Create a typical React/Express project structure
  const projectPath = path.join(tempDir, 'my-fullstack-app');
  await fs.mkdir(projectPath, { recursive: true });
  
  // Package.json for a full-stack application
  const packageJson = {
    name: 'my-fullstack-app',
    version: '1.0.0',
    description: 'A full-stack web application with React frontend and Express backend',
    scripts: {
      start: 'node server/index.js',
      dev: 'concurrently "npm run server:dev" "npm run client:dev"',
      'server:dev': 'nodemon server/index.js',
      'client:dev': 'cd client && npm start',
      build: 'cd client && npm run build',
      test: 'jest',
      deploy: 'docker-compose up -d'
    },
    dependencies: {
      express: '^4.18.0',
      mongoose: '^7.0.0',
      redis: '^4.6.0',
      jsonwebtoken: '^9.0.0',
      bcryptjs: '^2.4.3',
      'socket.io': '^4.6.0',
      stripe: '^12.0.0',
      cors: '^2.8.5',
      helmet: '^6.1.0'
    },
    devDependencies: {
      nodemon: '^2.0.20',
      concurrently: '^7.6.0',
      jest: '^29.0.0',
      cypress: '^12.0.0'
    }
  };
  
  await fs.writeFile(
    path.join(projectPath, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  
  // Client package.json
  await fs.mkdir(path.join(projectPath, 'client'), { recursive: true });
  await fs.writeFile(path.join(projectPath, 'client/package.json'), JSON.stringify({
    name: 'client',
    dependencies: {
      react: '^18.2.0',
      'react-dom': '^18.2.0',
      'react-router-dom': '^6.8.0',
      typescript: '^5.0.0',
      '@stripe/stripe-js': '^1.52.0',
      axios: '^1.3.0',
      'socket.io-client': '^4.6.0'
    }
  }, null, 2));
  
  // Create directory structure
  const dirs = [
    'server/controllers',
    'server/models',
    'server/routes',
    'server/middleware',
    'client/src/components',
    'client/src/pages',
    'client/src/hooks',
    'tests/unit',
    'tests/e2e',
    'docs'
  ];
  
  for (const dir of dirs) {
    await fs.mkdir(path.join(projectPath, dir), { recursive: true });
  }
  
  // Add some sample files to increase complexity
  await fs.writeFile(path.join(projectPath, 'server/index.js'), `
const express = require('express');
const mongoose = require('mongoose');
const redis = require('redis');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const server = require('http').createServer(app);
const io = new Server(server);

// Middleware
app.use(express.json());
app.use(require('helmet')());
app.use(require('cors')());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payments', require('./routes/payments'));

// WebSocket handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-room', (room) => {
    socket.join(room);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log('Server running on port ' + PORT));
`);
  
  await fs.writeFile(path.join(projectPath, 'client/src/App.tsx'), `
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import Home from './pages/Home';
import Login from './pages/Login';
import Products from './pages/Products';
import Checkout from './pages/Checkout';
import Dashboard from './pages/Dashboard';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY!);

function App() {
  return (
    <Elements stripe={stripePromise}>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/products" element={<Products />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </div>
      </Router>
    </Elements>
  );
}

export default App;
`);
  
  // Docker and deployment files
  await fs.writeFile(path.join(projectPath, 'Dockerfile'), `
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
`);
  
  await fs.writeFile(path.join(projectPath, 'docker-compose.yml'), `
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/myapp
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
  
  return projectPath;
}

async function demonstrateDocumentGeneration() {
  console.log('\n🚀 Document Generation Demo for Sample Project');
  console.log('================================================\n');
  
  try {
    // Create sample project
    console.log('📁 Creating sample full-stack project...');
    const projectPath = await createSampleProject();
    console.log(`   Created at: ${projectPath}`);
    
    // Analyze the project
    console.log('\n🔍 Analyzing project complexity and features...');
    const analyzer = new MockComplexityAnalyzer(projectPath);
    const analysis = await analyzer.analyze();
    
    console.log(`   Complexity Score: ${analysis.score}/100`);
    console.log(`   Stage: ${analysis.stage}`);
    console.log(`   Technologies: ${analysis.detectedTechnologies.join(', ')}`);
    console.log(`   Features: ${Object.keys(analysis.features).join(', ')}`);
    
    // Select approach
    console.log('\n🎯 Selecting optimal workflow approach...');
    const selector = new MockApproachSelector();
    const approach = selector.selectApproach(analysis);
    
    console.log(`   Selected: ${approach.name}`);
    console.log(`   Command: ${approach.command}`);
    
    // Generate documents
    console.log('\n📝 Generating customized documents...');
    const customizer = new MockDocumentCustomizer();
    const documents = await customizer.generateDocuments(projectPath, analysis, approach);
    
    console.log(`   Generated ${Object.keys(documents).length} documents`);
    
    // Display sample documents
    console.log('\n📄 Generated Documents Preview:');
    console.log('================================\n');
    
    // Show CLAUDE.md
    console.log('📋 CLAUDE.md (Project Configuration):');
    console.log('─'.repeat(50));
    console.log(documents['CLAUDE.md'].split('\n').slice(0, 25).join('\n'));
    console.log('...\n');
    
    // Show ARCHITECTURE.md
    console.log('🏗️ ARCHITECTURE.md (System Overview):');
    console.log('─'.repeat(50));
    console.log(documents['ARCHITECTURE.md'].split('\n').slice(0, 20).join('\n'));
    console.log('...\n');
    
    // Show workflow config
    console.log('⚙️ workflows/config.json (Workflow Configuration):');
    console.log('─'.repeat(50));
    const workflowConfig = JSON.parse(documents['workflows/config.json']);
    console.log(JSON.stringify(workflowConfig, null, 2));
    console.log('\n');
    
    // Show Agent-OS instructions
    console.log('🤖 .agent-os/instructions/instructions.md (Agent Instructions):');
    console.log('─'.repeat(50));
    console.log(documents['agent-os/instructions.md'].split('\n').slice(0, 15).join('\n'));
    console.log('...\n');
    
    // Summary
    console.log('📊 Generation Summary:');
    console.log('─'.repeat(50));
    console.log(`✅ Project analyzed successfully`);
    console.log(`✅ Optimal approach selected: ${approach.name}`);
    console.log(`✅ ${Object.keys(documents).length} documents generated`);
    console.log(`✅ All documents customized for ${analysis.detectedTechnologies.length} technologies`);
    console.log(`✅ ${Object.keys(analysis.features).length} features detected and configured`);
    
    // Cleanup
    await fs.rm(path.dirname(projectPath), { recursive: true, force: true });
    
    console.log('\n🎉 Document generation demo completed successfully!');
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    process.exit(1);
  }
}

// Run demo if executed directly
if (require.main === module) {
  demonstrateDocumentGeneration();
}

module.exports = { demonstrateDocumentGeneration };