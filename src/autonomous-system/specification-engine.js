/**
 * SpecificationEngine - Technical Specification Generation
 * =========================================================
 * Generates technical specifications from project analysis.
 * Part of the Autonomous Documentation & Spec-Driven Development System.
 */

import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';

export class SpecificationEngine extends EventEmitter {
  constructor(projectAnalysis, options = {}) {
    super();
    this.analysis = projectAnalysis;
    this.options = {
      outputDir: options.outputDir || './specs',
      detailLevel: options.detailLevel || 'comprehensive',
      includeTesting: options.includeTesting !== false,
      includePerformance: options.includePerformance !== false,
      includeSecurity: options.includeSecurity !== false,
      verbose: options.verbose || false
    };
    this.specifications = new Map();
  }

  log(msg) { if (this.options.verbose) console.log(msg); }

  async generateAllSpecifications() {
    this.log('📋 Generating technical specifications...');
    this.emit('generation:start');

    try {
      await this.generateSystemSpecifications();
      await this.generateComponentSpecifications();
      await this.generateIntegrationSpecifications();
      if (this.options.includePerformance) await this.generatePerformanceSpecifications();
      if (this.options.includeSecurity) await this.generateSecuritySpecifications();
      if (this.options.includeTesting) await this.generateTestingSpecifications();

      this.log('✅ Specification generation completed');
      this.emit('generation:complete', { specs: Array.from(this.specifications.keys()) });
      return this.specifications;
    } catch (error) {
      this.emit('generation:error', error);
      throw error;
    }
  }

  async generateSystemSpecifications() {
    this.log('🖥️ Generating system specifications...');
    const structure = this.analysis.structure || {};
    const deps = this.analysis.dependencies || {};
    const patterns = this.analysis.patterns || {};
    const metadata = deps.node?.metadata || {};

    let content = `# System Specifications\n\n`;
    content += `**Document Version:** 1.0.0\n`;
    content += `**Generated:** ${new Date().toISOString()}\n`;
    content += `**Project:** ${metadata.name || 'Unknown'}\n\n`;

    // Overview
    content += `## 1. System Overview\n\n`;
    content += `### 1.1 Purpose\n\n`;
    content += `${metadata.description || 'This document specifies the technical requirements and architecture of the system.'}\n\n`;

    content += `### 1.2 Scope\n\n`;
    content += `This specification covers:\n`;
    content += `- System architecture and design\n`;
    content += `- Component interfaces and behaviors\n`;
    content += `- Integration requirements\n`;
    content += `- Performance and security requirements\n\n`;

    // System Requirements
    content += `## 2. System Requirements\n\n`;
    content += `### 2.1 Functional Requirements\n\n`;
    content += `| ID | Requirement | Priority | Status |\n`;
    content += `|----|-------------|----------|--------|\n`;
    
    const components = Object.values(this.analysis.components || {});
    components.slice(0, 10).forEach((comp, i) => {
      content += `| FR-${String(i + 1).padStart(3, '0')} | ${comp.name} component functionality | High | Implemented |\n`;
    });
    content += '\n';

    content += `### 2.2 Non-Functional Requirements\n\n`;
    content += `| ID | Requirement | Target | Measurement |\n`;
    content += `|----|-------------|--------|-------------|\n`;
    content += `| NFR-001 | Response Time | < 200ms | 95th percentile |\n`;
    content += `| NFR-002 | Availability | 99.9% | Monthly uptime |\n`;
    content += `| NFR-003 | Scalability | 10x current load | Load testing |\n`;
    content += `| NFR-004 | Security | OWASP Top 10 | Security audit |\n\n`;

    // Architecture
    content += `## 3. System Architecture\n\n`;
    content += `### 3.1 Architectural Style\n\n`;
    if (patterns.architectural?.length > 0) {
      for (const pattern of patterns.architectural) {
        content += `- **${pattern.name}** (Confidence: ${Math.round(pattern.confidence * 100)}%)\n`;
      }
    } else {
      content += `- Custom architecture\n`;
    }
    content += '\n';

    content += `### 3.2 Technology Stack\n\n`;
    content += `| Layer | Technology |\n`;
    content += `|-------|------------|\n`;
    if (structure.frameworks?.length > 0) {
      content += `| Framework | ${structure.frameworks.join(', ')} |\n`;
    }
    content += `| Runtime | Node.js |\n`;
    content += `| Languages | ${Object.keys(structure.languages || {}).join(', ') || 'JavaScript'} |\n\n`;

    content += `### 3.3 Component Overview\n\n`;
    content += `Total Components: ${components.length}\n\n`;
    content += `| Type | Count |\n`;
    content += `|------|-------|\n`;
    const typeCounts = {};
    components.forEach(c => { typeCounts[c.type] = (typeCounts[c.type] || 0) + 1; });
    for (const [type, count] of Object.entries(typeCounts)) {
      content += `| ${type} | ${count} |\n`;
    }
    content += '\n';

    // Data Models
    content += `## 4. Data Models\n\n`;
    content += `### 4.1 Core Entities\n\n`;
    const classes = components.filter(c => c.type === 'class');
    if (classes.length > 0) {
      for (const cls of classes.slice(0, 5)) {
        content += `#### ${cls.name}\n\n`;
        content += `- **File:** \`${cls.file}\`\n`;
        if (cls.properties?.length > 0) {
          content += `- **Properties:** ${cls.properties.join(', ')}\n`;
        }
        if (cls.methods?.length > 0) {
          content += `- **Methods:** ${cls.methods.map(m => m.name).join(', ')}\n`;
        }
        content += '\n';
      }
    } else {
      content += `No class-based entities detected.\n\n`;
    }

    // Interfaces
    content += `## 5. Interfaces\n\n`;
    content += `### 5.1 External Interfaces\n\n`;
    const prodDeps = deps.node?.production || {};
    if (Object.keys(prodDeps).length > 0) {
      content += `| Interface | Type | Description |\n`;
      content += `|-----------|------|-------------|\n`;
      if (prodDeps.express || prodDeps.fastify) content += `| REST API | HTTP | Primary API interface |\n`;
      if (prodDeps.graphql) content += `| GraphQL | HTTP | GraphQL API interface |\n`;
      if (prodDeps.ws || prodDeps['socket.io']) content += `| WebSocket | WS | Real-time communication |\n`;
      if (prodDeps.mongodb || prodDeps.mongoose) content += `| MongoDB | Database | Data persistence |\n`;
      if (prodDeps.redis) content += `| Redis | Cache | Caching layer |\n`;
      content += '\n';
    }

    this.specifications.set('SYSTEM_SPECS.md', content);
    this.emit('spec:generated', { name: 'SYSTEM_SPECS.md' });
  }

  async generateComponentSpecifications() {
    this.log('🧩 Generating component specifications...');
    const components = Object.entries(this.analysis.components || {});

    let content = `# Component Specifications\n\n`;
    content += `**Generated:** ${new Date().toISOString()}\n\n`;
    content += `## Overview\n\nThis document specifies the behavior and interfaces of ${components.length} system components.\n\n`;

    // Group by type
    const grouped = {};
    for (const [name, comp] of components) {
      const type = comp.type || 'unknown';
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push({ name, ...comp });
    }

    for (const [type, comps] of Object.entries(grouped)) {
      content += `## ${this.capitalizeType(type)} Components\n\n`;

      for (const comp of comps.slice(0, 15)) {
        content += `### ${comp.name}\n\n`;
        content += `**Specification ID:** COMP-${comp.name.toUpperCase().slice(0, 8)}\n\n`;

        content += `#### Purpose\n\n`;
        content += `${this.inferPurpose(comp)}\n\n`;

        content += `#### Interface\n\n`;
        content += `| Property | Value |\n`;
        content += `|----------|-------|\n`;
        content += `| Type | ${comp.type} |\n`;
        content += `| File | \`${comp.file}\` |\n`;
        content += `| Exported | ${comp.isExported ? 'Yes' : 'No'} |\n\n`;

        if (comp.methods?.length > 0) {
          content += `#### Methods\n\n`;
          content += `| Method | Parameters | Description |\n`;
          content += `|--------|------------|-------------|\n`;
          for (const m of comp.methods.slice(0, 10)) {
            const params = (m.parameters || []).join(', ') || 'none';
            content += `| ${m.name} | ${params} | ${this.inferMethodDescription(m.name)} |\n`;
          }
          content += '\n';
        }

        content += `#### Dependencies\n\n`;
        content += `- Internal: ${this.findInternalDeps(comp)}\n`;
        content += `- External: ${this.findExternalDeps(comp)}\n\n`;

        content += `---\n\n`;
      }
    }

    this.specifications.set('COMPONENT_SPECS.md', content);
    this.emit('spec:generated', { name: 'COMPONENT_SPECS.md' });
  }

  async generateIntegrationSpecifications() {
    this.log('🔗 Generating integration specifications...');
    const deps = this.analysis.dependencies || {};
    const codeImports = deps.codeImports || {};

    let content = `# Integration Specifications\n\n`;
    content += `**Generated:** ${new Date().toISOString()}\n\n`;

    content += `## 1. Internal Integration\n\n`;
    content += `### 1.1 Module Dependencies\n\n`;
    
    const internalDeps = new Map();
    for (const [file, data] of Object.entries(codeImports)) {
      const internal = data.internal || [];
      if (internal.length > 0) {
        internalDeps.set(file, internal);
      }
    }

    if (internalDeps.size > 0) {
      content += `| Module | Dependencies |\n`;
      content += `|--------|-------------|\n`;
      for (const [file, deps] of Array.from(internalDeps).slice(0, 20)) {
        content += `| \`${file}\` | ${deps.slice(0, 3).join(', ')}${deps.length > 3 ? '...' : ''} |\n`;
      }
      content += '\n';
    }

    content += `### 1.2 Communication Patterns\n\n`;
    content += `| Pattern | Usage | Description |\n`;
    content += `|---------|-------|-------------|\n`;
    content += `| Direct Import | High | ES6/CommonJS module imports |\n`;
    content += `| Event Emitter | Medium | Async event-based communication |\n`;
    content += `| Dependency Injection | Low | Constructor-based DI |\n\n`;

    content += `## 2. External Integration\n\n`;
    content += `### 2.1 Third-Party Services\n\n`;
    
    const prodDeps = deps.node?.production || {};
    const integrations = this.identifyExternalIntegrations(prodDeps);
    
    if (integrations.length > 0) {
      content += `| Service | Package | Protocol | Purpose |\n`;
      content += `|---------|---------|----------|----------|\n`;
      for (const int of integrations) {
        content += `| ${int.service} | ${int.package} | ${int.protocol} | ${int.purpose} |\n`;
      }
      content += '\n';
    }

    content += `### 2.2 API Contracts\n\n`;
    content += `#### Request/Response Format\n\n`;
    content += `\`\`\`json\n{\n  "status": "success|error",\n  "data": {},\n  "message": "string",\n  "timestamp": "ISO8601"\n}\n\`\`\`\n\n`;

    content += `### 2.3 Error Handling\n\n`;
    content += `| Error Code | Description | Action |\n`;
    content += `|------------|-------------|--------|\n`;
    content += `| 400 | Bad Request | Validate input |\n`;
    content += `| 401 | Unauthorized | Check authentication |\n`;
    content += `| 403 | Forbidden | Check permissions |\n`;
    content += `| 404 | Not Found | Verify resource exists |\n`;
    content += `| 500 | Server Error | Check logs, retry |\n\n`;

    this.specifications.set('INTEGRATION_SPECS.md', content);
    this.emit('spec:generated', { name: 'INTEGRATION_SPECS.md' });
  }

  async generatePerformanceSpecifications() {
    this.log('⚡ Generating performance specifications...');

    let content = `# Performance Specifications\n\n`;
    content += `**Generated:** ${new Date().toISOString()}\n\n`;

    content += `## 1. Performance Requirements\n\n`;
    content += `### 1.1 Response Time Targets\n\n`;
    content += `| Operation | Target | Maximum | Measurement |\n`;
    content += `|-----------|--------|---------|-------------|\n`;
    content += `| API Response | < 100ms | 500ms | 95th percentile |\n`;
    content += `| Database Query | < 50ms | 200ms | Average |\n`;
    content += `| Page Load | < 2s | 5s | Time to interactive |\n`;
    content += `| Background Job | < 30s | 5min | Completion time |\n\n`;

    content += `### 1.2 Throughput Targets\n\n`;
    content += `| Metric | Target | Measurement |\n`;
    content += `|--------|--------|-------------|\n`;
    content += `| Requests/sec | 1000 | Under normal load |\n`;
    content += `| Concurrent Users | 500 | Simultaneous connections |\n`;
    content += `| Data Processing | 10MB/s | Batch operations |\n\n`;

    content += `## 2. Resource Limits\n\n`;
    content += `### 2.1 Memory\n\n`;
    content += `| Component | Limit | Warning |\n`;
    content += `|-----------|-------|--------|\n`;
    content += `| Application | 512MB | 400MB |\n`;
    content += `| Per Request | 50MB | 40MB |\n`;
    content += `| Cache | 256MB | 200MB |\n\n`;

    content += `### 2.2 CPU\n\n`;
    content += `| Metric | Target | Maximum |\n`;
    content += `|--------|--------|--------|\n`;
    content += `| Average Usage | < 50% | 80% |\n`;
    content += `| Peak Usage | < 80% | 95% |\n\n`;

    content += `## 3. Scalability\n\n`;
    content += `### 3.1 Horizontal Scaling\n\n`;
    content += `- Minimum instances: 2\n`;
    content += `- Maximum instances: 10\n`;
    content += `- Scale-up threshold: 70% CPU\n`;
    content += `- Scale-down threshold: 30% CPU\n\n`;

    content += `### 3.2 Caching Strategy\n\n`;
    content += `| Cache Type | TTL | Invalidation |\n`;
    content += `|------------|-----|-------------|\n`;
    content += `| API Response | 5min | On update |\n`;
    content += `| Session | 30min | On logout |\n`;
    content += `| Static Assets | 1day | On deploy |\n\n`;

    this.specifications.set('PERFORMANCE_SPECS.md', content);
    this.emit('spec:generated', { name: 'PERFORMANCE_SPECS.md' });
  }

  async generateSecuritySpecifications() {
    this.log('🔒 Generating security specifications...');

    let content = `# Security Specifications\n\n`;
    content += `**Generated:** ${new Date().toISOString()}\n\n`;

    content += `## 1. Authentication\n\n`;
    content += `### 1.1 Requirements\n\n`;
    content += `| Requirement | Specification |\n`;
    content += `|-------------|---------------|\n`;
    content += `| Method | JWT / OAuth 2.0 |\n`;
    content += `| Token Expiry | 1 hour (access), 7 days (refresh) |\n`;
    content += `| Password Policy | Min 8 chars, mixed case, numbers |\n`;
    content += `| MFA | Optional, TOTP-based |\n\n`;

    content += `## 2. Authorization\n\n`;
    content += `### 2.1 Access Control\n\n`;
    content += `| Role | Permissions |\n`;
    content += `|------|-------------|\n`;
    content += `| Admin | Full access |\n`;
    content += `| User | Read/Write own data |\n`;
    content += `| Guest | Read public data |\n\n`;

    content += `## 3. Data Protection\n\n`;
    content += `### 3.1 Encryption\n\n`;
    content += `| Data State | Method |\n`;
    content += `|------------|--------|\n`;
    content += `| In Transit | TLS 1.3 |\n`;
    content += `| At Rest | AES-256 |\n`;
    content += `| Passwords | bcrypt (cost 12) |\n\n`;

    content += `### 3.2 Sensitive Data Handling\n\n`;
    content += `- PII must be encrypted at rest\n`;
    content += `- Logs must not contain sensitive data\n`;
    content += `- API responses must not expose internal IDs\n\n`;

    content += `## 4. Security Headers\n\n`;
    content += `| Header | Value |\n`;
    content += `|--------|-------|\n`;
    content += `| Content-Security-Policy | default-src 'self' |\n`;
    content += `| X-Frame-Options | DENY |\n`;
    content += `| X-Content-Type-Options | nosniff |\n`;
    content += `| Strict-Transport-Security | max-age=31536000 |\n\n`;

    content += `## 5. Input Validation\n\n`;
    content += `- All user input must be validated\n`;
    content += `- SQL injection prevention via parameterized queries\n`;
    content += `- XSS prevention via output encoding\n`;
    content += `- CSRF protection via tokens\n\n`;

    this.specifications.set('SECURITY_SPECS.md', content);
    this.emit('spec:generated', { name: 'SECURITY_SPECS.md' });
  }

  async generateTestingSpecifications() {
    this.log('🧪 Generating testing specifications...');
    const metrics = this.analysis.metrics || {};

    let content = `# Testing Specifications\n\n`;
    content += `**Generated:** ${new Date().toISOString()}\n\n`;

    content += `## 1. Testing Strategy\n\n`;
    content += `### 1.1 Test Pyramid\n\n`;
    content += `| Level | Coverage Target | Tools |\n`;
    content += `|-------|-----------------|-------|\n`;
    content += `| Unit | 80% | Jest, Mocha |\n`;
    content += `| Integration | 60% | Supertest, Playwright |\n`;
    content += `| E2E | 40% | Cypress, Playwright |\n\n`;

    content += `### 1.2 Current Coverage\n\n`;
    content += `- Estimated Test Coverage: ~${metrics.quality?.testCoverage || 0}%\n\n`;

    content += `## 2. Test Categories\n\n`;
    content += `### 2.1 Unit Tests\n\n`;
    content += `- Test individual functions and methods\n`;
    content += `- Mock external dependencies\n`;
    content += `- Fast execution (< 100ms per test)\n\n`;

    content += `### 2.2 Integration Tests\n\n`;
    content += `- Test component interactions\n`;
    content += `- Use test database\n`;
    content += `- Verify API contracts\n\n`;

    content += `### 2.3 End-to-End Tests\n\n`;
    content += `- Test complete user flows\n`;
    content += `- Run against staging environment\n`;
    content += `- Include critical paths only\n\n`;

    content += `## 3. Test Requirements\n\n`;
    content += `### 3.1 Mandatory Tests\n\n`;
    content += `| Component | Test Type | Requirement |\n`;
    content += `|-----------|-----------|-------------|\n`;
    content += `| API Endpoints | Integration | All endpoints |\n`;
    content += `| Business Logic | Unit | 80% coverage |\n`;
    content += `| Authentication | E2E | Login/logout flows |\n`;
    content += `| Data Validation | Unit | All validators |\n\n`;

    content += `### 3.2 Quality Gates\n\n`;
    content += `- All tests must pass before merge\n`;
    content += `- Coverage must not decrease\n`;
    content += `- No critical security issues\n`;
    content += `- Performance benchmarks met\n\n`;

    this.specifications.set('TESTING_SPECS.md', content);
    this.emit('spec:generated', { name: 'TESTING_SPECS.md' });
  }

  async saveSpecifications(outputDir) {
    const dir = outputDir || this.options.outputDir;
    this.log(`💾 Saving specifications to ${dir}...`);

    await fs.mkdir(dir, { recursive: true });

    for (const [filename, content] of this.specifications) {
      const filePath = path.join(dir, filename);
      await fs.writeFile(filePath, content, 'utf8');
      this.log(`   ✅ Saved: ${filePath}`);
    }

    this.emit('save:complete', { dir, files: Array.from(this.specifications.keys()) });
  }

  // Helper methods
  capitalizeType(type) {
    return type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  inferPurpose(comp) {
    const name = comp.name.toLowerCase();
    if (name.includes('controller')) return 'Handles HTTP requests and responses';
    if (name.includes('service')) return 'Contains business logic';
    if (name.includes('repository')) return 'Manages data persistence';
    if (name.includes('model')) return 'Defines data structure';
    if (name.includes('util') || name.includes('helper')) return 'Provides utility functions';
    if (name.includes('middleware')) return 'Processes requests/responses';
    if (name.includes('validator')) return 'Validates input data';
    if (name.includes('handler')) return 'Handles specific events or actions';
    return `Provides ${comp.name} functionality`;
  }

  inferMethodDescription(methodName) {
    const name = methodName.toLowerCase();
    if (name.startsWith('get')) return 'Retrieves data';
    if (name.startsWith('set')) return 'Sets/updates data';
    if (name.startsWith('create') || name.startsWith('add')) return 'Creates new resource';
    if (name.startsWith('update')) return 'Updates existing resource';
    if (name.startsWith('delete') || name.startsWith('remove')) return 'Removes resource';
    if (name.startsWith('find') || name.startsWith('search')) return 'Searches for resources';
    if (name.startsWith('validate')) return 'Validates input';
    if (name.startsWith('init')) return 'Initializes component';
    return 'Performs operation';
  }

  findInternalDeps(comp) {
    const codeImports = this.analysis.dependencies?.codeImports || {};
    const fileImports = codeImports[comp.file];
    if (fileImports?.internal?.length > 0) {
      return fileImports.internal.slice(0, 3).join(', ');
    }
    return 'None detected';
  }

  findExternalDeps(comp) {
    const codeImports = this.analysis.dependencies?.codeImports || {};
    const fileImports = codeImports[comp.file];
    if (fileImports?.external?.length > 0) {
      return fileImports.external.slice(0, 3).join(', ');
    }
    return 'None detected';
  }

  identifyExternalIntegrations(deps) {
    const integrations = [];
    
    if (deps.express) integrations.push({ service: 'Express', package: 'express', protocol: 'HTTP', purpose: 'Web framework' });
    if (deps.fastify) integrations.push({ service: 'Fastify', package: 'fastify', protocol: 'HTTP', purpose: 'Web framework' });
    if (deps.mongodb || deps.mongoose) integrations.push({ service: 'MongoDB', package: 'mongoose', protocol: 'TCP', purpose: 'Database' });
    if (deps.redis || deps.ioredis) integrations.push({ service: 'Redis', package: 'redis', protocol: 'TCP', purpose: 'Cache' });
    if (deps.pg) integrations.push({ service: 'PostgreSQL', package: 'pg', protocol: 'TCP', purpose: 'Database' });
    if (deps.axios || deps['node-fetch']) integrations.push({ service: 'HTTP Client', package: 'axios', protocol: 'HTTP', purpose: 'External APIs' });
    if (deps['socket.io']) integrations.push({ service: 'Socket.IO', package: 'socket.io', protocol: 'WebSocket', purpose: 'Real-time' });
    if (deps.graphql) integrations.push({ service: 'GraphQL', package: 'graphql', protocol: 'HTTP', purpose: 'API' });

    return integrations;
  }
}

export default SpecificationEngine;
