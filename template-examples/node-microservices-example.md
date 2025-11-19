# Node.js Microservices Project Template Customization Example

## Input: Microservices Architecture Detection

```bash
# Project structure detected:
services/
├── api-gateway/
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── user-service/
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── order-service/
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── notification-service/
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── shared/
│   ├── lib/
│   └── types/
├── docker-compose.yml
├── kubernetes/
│   ├── deployments/
│   └── services/
├── monitoring/
│   ├── prometheus/
│   └── grafana/
└── docs/
    └── api/
```

```json
// Common package.json patterns detected across services:
{
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "helmet": "^6.1.0",
    "mongoose": "^7.3.0",
    "redis": "^4.6.0",
    "jsonwebtoken": "^9.0.0",
    "axios": "^1.4.0",
    "winston": "^3.9.0",
    "prometheus-register": "^0.2.0"
  },
  "devDependencies": {
    "jest": "^29.5.0",
    "supertest": "^6.3.0",
    "nodemon": "^2.0.22"
  }
}
```

## Analysis Results

```javascript
// Automated analysis output:
{
  "complexity": 85,
  "stage": "mature",
  "languages": ["JavaScript", "TypeScript"],
  "frameworks": ["Express", "Mongoose"],
  "databases": ["MongoDB", "Redis"],
  "deployment": ["Docker", "Kubernetes"],
  "patterns": {
    "microservices": {
      "serviceCount": 4,
      "sharedLibraries": true,
      "apiGateway": true,
      "serviceDiscovery": "kubernetes",
      "monitoring": ["prometheus", "grafana"]
    },
    "communication": ["REST", "async-messaging"],
    "authentication": "JWT",
    "containerization": "docker",
    "orchestration": "kubernetes"
  },
  "architecture": "microservices"
}
```

## Generated CLAUDE.md

```markdown
# Claude Configuration - Node.js Microservices Project (mature Stage)

## Phase 3 Complete: Deep Analysis & Document Generation ✅
- **Implementation Date**: August 14, 2025
- **Implementer**: Claude (Autonomous Workflow System)
- **Status**: Successfully completed with microservices architecture analysis

### Queen Controller Features
- **10 Concurrent Sub-Agents**: Full enterprise capacity for complex microservices
- **200k Context Windows**: Each agent tracks individual context
- **Hierarchical Management**: Queen Controller orchestrates all agents
- **Shared Memory Store**: Cross-agent data sharing with SQLite persistence
- **Event-Driven Architecture**: Real-time agent coordination

## Project Analysis
- **Complexity Score**: 85/100
- **Stage**: mature
- **Selected Approach**: hive-mind-sparc
- **Architecture**: microservices
- **Command**: `npx --yes claude-flow@latest hive-mind spawn "Microservices-Platform" --sparc --agents 10 --claude`

## Technology Stack
### Languages
- JavaScript (Node.js)
- TypeScript

### Frameworks & Libraries
- Express.js (API Framework)
- Mongoose (MongoDB ODM)
- Redis (Caching & Session Store)
- JWT (Authentication)

### Infrastructure
- Docker (Containerization)
- Kubernetes (Orchestration)
- MongoDB (Primary Database)
- Redis (Cache/Queue)

### Monitoring & Observability
- Prometheus (Metrics)
- Grafana (Visualization)
- Winston (Logging)

## Sub-Agent Architecture & Responsibilities

### 1. complexity-analyzer-agent
- Service dependency analysis
- Inter-service communication patterns
- Performance bottleneck identification
- Scalability assessment

### 2. microservices-architect-agent
- Service boundary definition
- API contract design
- Event-driven architecture patterns
- Service mesh configuration

### 3. api-builder-agent
- REST API development
- OpenAPI specification generation
- API versioning strategies
- Gateway configuration

### 4. database-architect-agent
- Database per service pattern
- Data consistency strategies
- CQRS/Event Sourcing implementation
- Database sharding and replication

### 5. security-scanner-agent
- Service-to-service authentication
- API security (rate limiting, CORS)
- Container security scanning
- Secrets management

### 6. deployment-engineer-agent
- Kubernetes deployment configuration
- CI/CD pipeline setup
- Blue-green deployment strategies
- Auto-scaling configuration

### 7. performance-optimizer-agent
- Load balancing optimization
- Caching strategies
- Database query optimization
- Resource allocation tuning

### 8. monitoring-specialist-agent
- Distributed tracing setup
- Metrics collection and alerting
- Log aggregation
- Health check implementation

### 9. test-automation-engineer
- Integration testing across services
- Contract testing (Pact)
- Load testing strategies
- Chaos engineering implementation

### 10. recovery-specialist-agent
- Circuit breaker patterns
- Retry and timeout strategies
- Disaster recovery procedures
- Data backup and restoration

## MCP Server Configuration
### Active Servers (25/87)

#### ESSENTIAL
- context7: {"enabled":true}
- filesystem: {"enabled":true}
- git: {"enabled":true}
- grep: {"enabled":true}
- http: {"enabled":true}

#### DEVELOPMENT
- npm: {"enabled":true}
- github: {"enabled":true}
- docker: {"enabled":true}
- kubernetes: {"enabled":true}

#### DATABASE
- mongodb: {"enabled":true}
- redis: {"enabled":true}
- postgres: {"enabled":true}

#### CLOUD
- aws: {"enabled":true}
- gcp: {"enabled":true}
- azure: {"enabled":true}

#### MONITORING
- prometheus: {"enabled":true}
- grafana: {"enabled":true}
- datadog: {"enabled":true}
- sentry: {"enabled":true}

#### COMMUNICATION
- slack: {"enabled":true}
- webhook: {"enabled":true}

#### TESTING
- jest: {"enabled":true}
- playwright: {"enabled":true}

## Project-Specific Instructions
- Follow microservices design patterns and principles
- Implement proper service boundaries and data ownership
- Use API-first development approach with OpenAPI specs
- Implement distributed tracing for observability
- Use container orchestration best practices
- Implement proper error handling and circuit breakers
- Follow 12-factor app methodology
- Use infrastructure as code (Terraform/Helm)
- Implement proper logging and monitoring
- Use event-driven communication patterns
- Implement proper security measures (OAuth2, mTLS)
- Follow semantic versioning for services

## SPARC Methodology Workflow
### Phase S: Specification
1. Service boundary analysis and definition
2. API contract specification with OpenAPI
3. Data flow and event modeling
4. Non-functional requirements definition

### Phase P: Pseudocode
1. Service interaction pseudocode
2. Database operation algorithms
3. Event handling workflows
4. Error recovery procedures

### Phase A: Architecture
1. Microservices architecture implementation
2. Container orchestration setup
3. Service mesh configuration
4. Data persistence layer design

### Phase R: Refinement
1. Performance optimization and tuning
2. Security hardening and compliance
3. Monitoring and alerting enhancement
4. Code quality and technical debt reduction

### Phase C: Completion
1. Production deployment automation
2. Comprehensive testing and validation
3. Documentation and runbooks
4. Maintenance and support procedures

## Quality Metrics
- **Test Coverage Target**: 85%+ (unit + integration)
- **Performance Benchmarks**: 
  - API Response Time: < 200ms (95th percentile)
  - Service Availability: 99.9% uptime
  - Error Rate: < 0.1%
- **Security Score**: OWASP compliance + container security
- **Documentation Coverage**: All APIs documented with OpenAPI

## Microservices-Specific Guidelines

### Service Design
- Single Responsibility Principle per service
- Database per service pattern
- Stateless service design
- Idempotent operations

### Communication Patterns
- Synchronous: REST APIs for request/response
- Asynchronous: Event-driven messaging
- API Gateway for external communication
- Service mesh for internal communication

### Data Management
- Event Sourcing for audit trails
- CQRS for read/write separation
- Saga pattern for distributed transactions
- Data replication strategies

### Deployment & Operations
- Blue-green deployments
- Canary releases
- Auto-scaling based on metrics
- Health checks and readiness probes

### Monitoring & Observability
- Distributed tracing (Jaeger/Zipkin)
- Centralized logging (ELK stack)
- Metrics collection (Prometheus)
- APM integration (New Relic/Datadog)

---

*Generated by CLAUDE.md Generator v3.0*
*Date: 2025-08-14T20:30:45.000Z*
*Phase 3: Deep Analysis & Document Generation Complete*
```

## Agent Configuration Customization

```javascript
// Generated agent assignments for microservices project:
const microservicesAgentAssignments = new Map([
  ['microservices-architect-agent', [
    'Service boundary analysis and optimization',
    'API contract design with OpenAPI',
    'Event-driven architecture implementation',
    'Service mesh configuration (Istio/Linkerd)',
    'Inter-service communication patterns'
  ]],
  
  ['api-builder-agent', [
    'RESTful API development with Express.js',
    'GraphQL federation setup',
    'API gateway configuration',
    'Rate limiting and throttling',
    'API versioning and backward compatibility'
  ]],
  
  ['database-architect-agent', [
    'Database per service implementation',
    'Data consistency and transaction management',
    'Event sourcing and CQRS patterns',
    'Database scaling and sharding',
    'Data migration strategies'
  ]],
  
  ['deployment-engineer-agent', [
    'Kubernetes deployment manifests',
    'Helm chart development',
    'CI/CD pipeline automation',
    'Blue-green deployment strategies',
    'Auto-scaling configuration'
  ]],
  
  ['monitoring-specialist-agent', [
    'Distributed tracing implementation',
    'Prometheus metrics collection',
    'Grafana dashboard creation',
    'Log aggregation with ELK stack',
    'Alert management and escalation'
  ]],
  
  ['security-scanner-agent', [
    'Container image security scanning',
    'Network policy enforcement',
    'Secrets management with Vault',
    'mTLS configuration',
    'OAuth2/OIDC implementation'
  ]],
  
  ['performance-optimizer-agent', [
    'Load balancer configuration',
    'Cache layer optimization (Redis)',
    'Database query optimization',
    'Resource allocation tuning',
    'Connection pool management'
  ]],
  
  ['test-automation-engineer', [
    'Contract testing with Pact',
    'Integration testing across services',
    'Load testing with K6',
    'Chaos engineering with Chaos Monkey',
    'End-to-end testing automation'
  ]],
  
  ['recovery-specialist-agent', [
    'Circuit breaker pattern implementation',
    'Retry and timeout strategies',
    'Disaster recovery automation',
    'Service mesh resilience patterns',
    'Data backup and restoration'
  ]],
  
  ['doc-generator-agent', [
    'OpenAPI specification generation',
    'Service documentation and runbooks',
    'Architecture decision records (ADRs)',
    'Deployment and operations guides',
    'API consumer documentation'
  ]]
]);
```

## MCP Server Selection Logic

```javascript
// Microservices project specific MCP server selection:
function selectMCPServersForMicroservices(analysis) {
  const servers = new Set(['context7', 'filesystem', 'git', 'http']); // Always include
  
  // Node.js specific
  servers.add('npm'); // Package management
  servers.add('github'); // Version control
  
  // Containerization & Orchestration
  servers.add('docker'); // Container management
  servers.add('kubernetes'); // Orchestration
  
  // Databases (detected from services)
  if (analysis.databases.includes('MongoDB')) {
    servers.add('mongodb');
  }
  if (analysis.databases.includes('Redis')) {
    servers.add('redis');
  }
  if (analysis.databases.includes('PostgreSQL')) {
    servers.add('postgres');
  }
  
  // Cloud providers (based on deployment patterns)
  if (analysis.patterns.cloud) {
    servers.add('aws');
    servers.add('gcp');
    servers.add('azure');
  }
  
  // Monitoring & Observability
  servers.add('prometheus'); // Metrics
  servers.add('grafana'); // Dashboards
  servers.add('datadog'); // APM
  servers.add('sentry'); // Error tracking
  
  // Communication
  servers.add('slack'); // Team communication
  servers.add('webhook'); // Service webhooks
  
  // Testing
  servers.add('jest'); // Unit testing
  servers.add('playwright'); // E2E testing
  
  // API management
  servers.add('openapi'); // API documentation
  
  return Array.from(servers);
}
```

## Generated Docker & Kubernetes Configurations

```yaml
# docker-compose.yml (auto-generated for development)
version: '3.8'
services:
  api-gateway:
    build: ./services/api-gateway
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
      - mongodb
  
  user-service:
    build: ./services/user-service
    environment:
      - NODE_ENV=development
      - MONGODB_URL=mongodb://mongodb:27017/users
    depends_on:
      - mongodb
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
  
  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=root
      - MONGO_INITDB_ROOT_PASSWORD=password
```

```yaml
# kubernetes/api-gateway-deployment.yaml (auto-generated)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  labels:
    app: api-gateway
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: myregistry/api-gateway:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: url
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

## Workflow Commands for Microservices

```bash
# Initial microservices setup with SPARC methodology:
npx claude-flow@2.0.0 hive-mind spawn "Microservices-Platform" --sparc --agents 10 --claude

# Service development workflow:
npx claude-flow@2.0.0 develop --service user-service --hot-reload

# Integration testing across services:
npx claude-flow@2.0.0 test --integration --services all

# Container build and deployment:
npx claude-flow@2.0.0 build --containerize --deploy k8s

# Service monitoring and health checks:
npx claude-flow@2.0.0 monitor --distributed-tracing --alerts

# Load testing:
npx claude-flow@2.0.0 load-test --target api-gateway --concurrent 100
```

This Node.js microservices example demonstrates how Claude Flow 2.0:

1. **Detects microservices patterns** - Multiple services, Docker, Kubernetes, service mesh
2. **Configures enterprise agents** - 10 specialized agents for complex architecture
3. **Selects SPARC methodology** - Systematic approach for high complexity (85/100)
4. **Generates microservices configs** - Docker, Kubernetes, monitoring, security
5. **Sets up distributed systems tools** - Service mesh, tracing, monitoring
6. **Configures enterprise deployment** - Multi-environment, auto-scaling, resilience