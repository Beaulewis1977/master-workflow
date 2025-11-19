# Fullstack Modern Template - Production Testing Suite

A comprehensive production deployment testing framework that validates all aspects of your application's readiness for production deployment across Vercel, CI/CD pipelines, Docker, security, monitoring, and more.

## 🎯 Overview

This testing suite provides **8 specialized test modules** covering all critical production deployment scenarios:

- **Vercel Configuration & Deployment** - Validates hosting setup and serverless functions
- **CI/CD Pipeline Testing** - GitHub Actions workflows and automation validation  
- **Docker Production Builds** - Container optimization and security scanning
- **Production Environment** - Database, SSL/TLS, and infrastructure validation
- **Deployment Automation** - Blue-green, canary, and zero-downtime strategies
- **Performance Monitoring** - APM, alerting, and SLA compliance testing
- **Security Compliance** - HTTPS, authentication, vulnerability scanning, OWASP compliance
- **Master Orchestration** - Unified execution and production readiness assessment

## 🚀 Quick Start

### Prerequisites

```bash
# Required tools
node --version    # >= 18.0.0
docker --version  # For container testing
vercel --version  # For deployment testing (optional)

# Security tools (optional but recommended)
trivy --version   # Container security scanning
snyk --version    # Dependency vulnerability scanning
```

### Installation

```bash
cd templates/fullstack-modern/tests
npm install
```

### Run Complete Test Suite

```bash
# Full production readiness validation
npm test

# Parallel execution (faster)
npm run test:parallel

# Stop on critical failures
npm run test:production
```

## 📋 Test Modules

### 1. Vercel Configuration Testing

Validates Vercel deployment configuration and settings.

```bash
npm run test:vercel-config    # Configuration validation
npm run test:vercel-deployment # Deployment testing
npm run test:vercel           # Both tests
```

**Tests:**
- `vercel.json` syntax and structure validation
- Build settings and environment variables
- Serverless function configuration
- Edge function setup
- Security headers and CORS
- Domain and SSL configuration

### 2. CI/CD Pipeline Testing

Validates GitHub Actions workflows and automation.

```bash
npm run test:cicd
```

**Tests:**
- Workflow syntax validation (YAML parsing)
- Build automation and dependency caching
- Security scanning integration
- Performance regression testing
- Multi-environment deployment validation
- Secret management and permissions

### 3. Docker Production Testing

Validates container builds and production optimization.

```bash
npm run test:docker
```

**Tests:**
- Multi-stage Dockerfile optimization
- Container security scanning (Trivy, Docker Scout)
- Image size optimization
- Layer caching efficiency
- Production runtime configuration
- Health checks and monitoring setup

### 4. Production Environment Testing

Validates production infrastructure and services.

```bash
npm run test:production-env
```

**Tests:**
- Database configuration (PostgreSQL, Redis, Supabase)
- SSL/TLS certificate validation
- CDN and static asset optimization
- Performance monitoring setup
- Error tracking configuration (Sentry)
- Backup and disaster recovery

### 5. Deployment Automation Testing

Validates automated deployment strategies.

```bash
npm run test:deployment
```

**Tests:**
- Blue-green deployment validation
- Canary release testing
- Zero-downtime deployment verification
- Database migration automation
- Rollback and recovery procedures
- Health check validation

### 6. Performance Monitoring Testing

Validates monitoring and alerting systems.

```bash
npm run test:monitoring
```

**Tests:**
- Metrics collection (application & infrastructure)
- Alert rule configuration and testing
- Synthetic monitoring and uptime checks
- Dashboard and visualization setup
- Log aggregation and analysis
- SLA/SLO compliance monitoring

### 7. Security Compliance Testing

Validates security posture and compliance.

```bash
npm run test:security
```

**Tests:**
- HTTPS enforcement and TLS configuration
- Authentication and authorization security
- Vulnerability scanning (dependencies & containers)
- Security headers and CSP validation
- API security and rate limiting
- OWASP Top 10 compliance
- Data protection and privacy controls

### 8. Master Test Orchestration

Runs all test modules with unified reporting.

```bash
npm run test:all               # Complete suite with reports
npm run validate:production-ready  # Production gate validation
```

## 📊 Reports and Analysis

### Generated Reports

The test suite generates comprehensive reports in the `reports/` directory:

```
reports/
├── master-test-report.json     # Complete test results
├── master-test-report.html     # Visual dashboard
├── executive-summary.json      # High-level summary
└── individual-suite-reports/   # Detailed module reports
```

### Viewing Reports

```bash
npm run reports:open      # Open HTML report
npm run reports:summary   # Display executive summary
npm run reports:clean     # Clean old reports
```

### Production Readiness Score

The suite calculates an overall production readiness score based on:

- **Security Compliance** (30% weight) - Must achieve 85%+ for production
- **Deployment Automation** (25% weight) - Critical for reliable releases
- **Production Environment** (20% weight) - Infrastructure must be production-ready
- **Performance Monitoring** (15% weight) - Essential for operations
- **CI/CD Pipeline** (10% weight) - Automation quality

**Production Ready Criteria:**
- Overall score ≥ 85%
- Zero critical security failures
- All deployment automation tests pass
- Production environment validated

## ⚙️ Configuration

### Environment Variables

```bash
# Vercel Testing
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id
VERCEL_PROJECT_ID=your-project-id

# GitHub Testing
GITHUB_TOKEN=your-github-token
GITHUB_OWNER=your-org
GITHUB_REPO=your-repo

# Database Testing
DATABASE_URL=postgresql://user:pass@host:port/db
REDIS_URL=redis://host:port
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Monitoring Testing
SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

### Test Configuration

Create `test-config.json` for custom settings:

```json
{
  "timeout": 600000,
  "parallel": true,
  "stopOnCriticalFailure": false,
  "securityThreshold": "medium",
  "performanceTargets": {
    "responseTime": 2000,
    "errorRate": 0.05
  }
}
```

## 🔧 Individual Test Execution

### Quick Validation

```bash
npm run quick:smoke         # Fast configuration and security check
npm run quick:security      # Security validation only
npm run quick:config        # Configuration validation only
```

### Development Testing

```bash
npm run legacy:docker       # Docker Compose testing
npm run legacy:hot-reload   # Development hot reload
npm run legacy:websocket    # WebSocket functionality
npm run legacy:api          # API integration tests
npm run legacy:auth         # Authentication flows
```

### Production Validation

```bash
npm run validate:security     # Security compliance gate
npm run validate:deployment   # Deployment readiness
npm run validate:monitoring   # Monitoring setup
```

## 🛠️ Extending the Test Suite

### Adding Custom Tests

1. Create test file in appropriate directory:
```javascript
// custom/my-custom-tests.js
class MyCustomTester {
  async runCustomTests() {
    // Your test implementation
    return { status: 'success', results: {} };
  }
}
```

2. Add to master orchestrator:
```javascript
// In master-test-orchestrator.js
this.testSuites.customTests = new MyCustomTester();
```

3. Add npm script:
```json
{
  "scripts": {
    "test:custom": "node custom/my-custom-tests.js"
  }
}
```

### Custom Validation Rules

```javascript
// Example: Custom security rule
class CustomSecurityValidator {
  async validateCustomPolicy() {
    // Implement your specific security requirements
    return {
      compliant: true,
      findings: [],
      recommendations: []
    };
  }
}
```

## 🎯 Best Practices

### Before Production Deployment

1. **Run complete test suite**: `npm run validate:production-ready`
2. **Review security findings**: Address all critical and high-priority issues
3. **Verify monitoring setup**: Ensure alerts and dashboards are configured
4. **Test deployment automation**: Validate rollback procedures
5. **Check environment parity**: Ensure staging matches production

### Continuous Integration

```yaml
# .github/workflows/production-tests.yml
name: Production Readiness Tests
on: [push, pull_request]
jobs:
  production-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: cd templates/fullstack-modern/tests && npm ci
      - run: cd templates/fullstack-modern/tests && npm run test:ci
```

### Performance Optimization

- Use `npm run test:parallel` for faster execution
- Set appropriate timeouts for your environment
- Use `--stop-on-critical` to fail fast on critical issues
- Cache dependencies in CI/CD pipelines

## 🔍 Troubleshooting

### Common Issues

**Docker tests failing:**
```bash
# Check Docker daemon
docker info

# Verify Docker permissions
docker run hello-world
```

**Vercel tests skipped:**
```bash
# Install Vercel CLI
npm i -g vercel

# Configure credentials
vercel login
```

**Security scans incomplete:**
```bash
# Install security tools
curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin
```

**Network timeouts:**
```bash
# Increase timeout in test-config.json
{
  "timeout": 900000
}
```

### Debug Mode

```bash
# Enable verbose logging
DEBUG=* npm test

# Test specific module only
npm run test:security -- --verbose

# Skip prerequisites check
npm test -- --skip-prerequisites
```

## 📈 Metrics and Monitoring

### Test Execution Metrics

- **Total execution time** - Should be < 15 minutes
- **Parallel efficiency** - Measures parallel execution benefits
- **Pass rate** - Overall test success percentage
- **Coverage** - Production readiness coverage

### Production Health Indicators

- **Security compliance score** - Target: 85%+
- **Deployment automation coverage** - Target: 100%
- **Monitoring completeness** - Target: 90%+
- **Performance SLA compliance** - Target: 99%+

## 🤝 Contributing

1. Follow existing patterns for new test modules
2. Include comprehensive error handling
3. Add appropriate timeouts and retries
4. Update documentation for new tests
5. Ensure cross-platform compatibility

## 📄 License

MIT License - see LICENSE file for details.

---

**Built with Claude Code** - Comprehensive production testing for reliable deployments.