# Quick Start Guide

## Welcome to Claude Flow 2.0 + Agent-OS + Claude Code Integration

This guide will get you up and running with the fully integrated system in under 30 minutes. Follow the step-by-step instructions to configure and deploy your intelligent workflow automation platform.

## Prerequisites

### System Requirements
```bash
# Minimum requirements
CPU: 4 cores, 2.5GHz
Memory: 8GB RAM
Storage: 10GB available
Node.js: v16+ (recommended v18+)
Git: Latest version

# Recommended for production
CPU: 8+ cores, 3.0GHz+ (SIMD support)
Memory: 16GB+ RAM
Storage: 25GB+ SSD
```

### Quick System Check
```bash
# Run system compatibility check
./ai-workflow system check

# Expected output:
✅ Node.js v18.17.0 detected
✅ Git 2.41.0 detected
✅ 16GB RAM available
✅ SIMD support detected
✅ All prerequisites met
```

## Step 1: Installation (5 minutes)

### Option A: Automatic Installation (Recommended)
```bash
# Clone and install everything in one command
curl -sSL https://raw.githubusercontent.com/your-repo/install.sh | bash

# Or download and run installer
wget https://raw.githubusercontent.com/your-repo/install-modular.sh
chmod +x install-modular.sh
./install-modular.sh --full-integration
```

### Option B: Manual Installation
```bash
# Clone repository
git clone https://github.com/your-repo/master-workflow.git
cd master-workflow

# Install dependencies
npm install

# Install Claude Flow 2.0 integration
npx --yes claude-flow@latest hive-mind spawn "MASTER-WORKFLOW" --sparc --agents 10 --claude

# Configure Agent-OS
./ai-workflow configure agent-os --enable

# Initialize Queen Controller
./ai-workflow queen init --agents 10 --context 200k
```

### Verification
```bash
# Verify installation
./ai-workflow verify --full

# Expected output:
✅ Claude Flow 2.0 integration active
✅ Agent-OS configured and ready
✅ Queen Controller initialized
✅ 50+ specialized agents available
✅ WASM core module loaded
✅ Neural learning system active
```

## Step 2: Basic Configuration (10 minutes)

### Initialize Your First Project
```bash
# Create new project
./ai-workflow init my-first-project --type web-app

# Configure project settings
./ai-workflow configure project \
  --name "My First Project" \
  --type "full-stack-web-app" \
  --complexity "medium" \
  --topology "hierarchical"
```

### Configure Agent-OS Specifications
```bash
# Generate product specifications
./ai-workflow plan-product create \
  --type "web-application" \
  --requirements "User authentication, product catalog, shopping cart" \
  --output ".agent-os/product/"

# Create detailed specifications
./ai-workflow create-spec generate \
  --feature "user-authentication" \
  --context ".agent-os/product/" \
  --output ".agent-os/specs/"
```

### Set Up Auto-Delegation
```bash
# Configure intelligent agent selection
./ai-workflow delegation configure \
  --confidence-threshold 0.7 \
  --enable-neural-selection \
  --fallback-strategy "queue"

# Test delegation rules
./ai-workflow delegation test --task-type "api-development"
```

## Step 3: Your First Workflow (10 minutes)

### Simple Task Execution
```bash
# Execute a simple task
./ai-workflow execute-tasks run \
  --spec ".agent-os/specs/user-authentication.yaml" \
  --agent "api-builder" \
  --monitor

# Watch the progress
./ai-workflow monitor tasks --real-time
```

### Multi-Agent Workflow
```bash
# Execute complex workflow with multiple agents
./ai-workflow workflows create full-stack-feature \
  --tasks "analyze,design,implement,test,document" \
  --parallel-where-possible

./ai-workflow workflows execute full-stack-feature \
  --monitor \
  --quality-gates
```

### Check Results
```bash
# View workflow status
./ai-workflow workflows status

# Check agent performance
./ai-workflow agents stats --summary

# View generated files
ls -la ./output/
```

## Step 4: Advanced Features (5 minutes)

### Enable Neural Learning
```bash
# Enable and configure neural learning
./ai-workflow neural enable \
  --learning-rate 0.001 \
  --model-path ".hive-mind/neural-data/"

# Start training with example data
./ai-workflow neural train --initial-dataset
```

### Configure WASM Acceleration
```bash
# Enable WASM core module
./ai-workflow configure wasm \
  --enable \
  --simd-acceleration \
  --core-module "claude-flow-core.wasm"

# Verify WASM performance
./ai-workflow benchmark wasm --performance-test
```

### Set Up Real-Time Monitoring
```bash
# Enable comprehensive monitoring
./ai-workflow monitor enable \
  --real-time \
  --performance-metrics \
  --health-checks

# Access monitoring dashboard
./ai-workflow monitor dashboard --open
```

## Common Workflow Examples

### Example 1: Build a REST API
```bash
# Quick API development workflow
./ai-workflow workflows execute api-development \
  --spec "Build REST API for user management" \
  --includes "authentication,crud,validation,docs" \
  --agent "api-builder" \
  --test-coverage 80

# Expected completion: 5-10 minutes
```

### Example 2: Full-Stack Web Application
```bash
# Comprehensive web app development
./ai-workflow workflows execute full-stack-app \
  --frontend "react" \
  --backend "express" \
  --database "postgresql" \
  --features "auth,dashboard,admin" \
  --topology "hierarchical"

# Expected completion: 15-30 minutes
```

### Example 3: Microservices Architecture
```bash
# Microservices development with multiple agents
./ai-workflow workflows execute microservices \
  --services "user-service,product-service,order-service" \
  --topology "mesh" \
  --parallel-execution \
  --docker-containerization

# Expected completion: 20-40 minutes
```

### Example 4: Security Audit and Fixes
```bash
# Security analysis and remediation
./ai-workflow workflows execute security-audit \
  --scan-types "vulnerability,dependency,code-quality" \
  --auto-fix "medium-risk" \
  --generate-report \
  --agent "security-scanner"

# Expected completion: 10-15 minutes
```

## Configuration Templates

### Basic Project Configuration
```yaml
# .agent-os/product/config.yaml
project:
  name: "my-project"
  type: "web-application"
  complexity: "medium"
  
features:
  - authentication
  - user-management
  - data-visualization
  
architecture:
  frontend: "react"
  backend: "express"
  database: "postgresql"
  
quality:
  test_coverage: 80
  code_quality: "high"
  security: "standard"
```

### Agent-OS Workflow Template
```yaml
# .agent-os/specs/feature-template.yaml
specification:
  id: "feature-001"
  name: "User Authentication"
  complexity: 6
  
requirements:
  functional:
    - "User registration with email validation"
    - "Login/logout functionality"
    - "JWT token management"
  
  non_functional:
    - "Response time < 200ms"
    - "99.9% availability"
    - "OWASP security compliance"

implementation:
  agent_type: "api-builder"
  dependencies: ["database-setup"]
  estimated_duration: 3600000  # 1 hour

validation:
  test_coverage: 90
  security_scan: true
  performance_test: true
```

### Auto-Delegation Configuration
```json
{
  "delegation": {
    "confidence_threshold": 0.7,
    "neural_selection": true,
    "rules": {
      "api_development": {
        "primary": ["api-builder", "backend-specialist"],
        "fallback": ["code-analyzer"],
        "min_confidence": 0.6
      },
      "frontend_development": {
        "primary": ["frontend-specialist"],
        "fallback": ["doc-generator"],
        "min_confidence": 0.5
      },
      "database_design": {
        "primary": ["database-architect"],
        "fallback": ["system-integration-specialist"],
        "min_confidence": 0.8
      }
    }
  }
}
```

## Performance Tuning Tips

### Context Window Optimization
```bash
# Optimize context windows for better performance
./ai-workflow context optimize \
  --strategy "aggressive" \
  --compression true \
  --deduplication true

# Monitor context usage
./ai-workflow context monitor --threshold 80
```

### Agent Pool Management
```bash
# Configure optimal agent pool
./ai-workflow agents configure \
  --max-concurrent 8 \
  --warm-pool 3 \
  --auto-scaling true

# Monitor agent utilization
./ai-workflow agents monitor --utilization
```

### Neural Learning Optimization
```bash
# Optimize neural learning performance
./ai-workflow neural optimize \
  --batch-size 100 \
  --learning-rate 0.001 \
  --cache-predictions true

# Monitor learning accuracy
./ai-workflow neural monitor --accuracy
```

## Troubleshooting Guide

### Quick Fixes for Common Issues

#### Installation Problems
```bash
# Permission issues
sudo chown -R $USER:$USER ~/.ai-workflow/
chmod +x ./ai-workflow

# Dependency conflicts
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Port conflicts
./ai-workflow configure --port 8081
```

#### Agent Spawn Failures
```bash
# Check system resources
./ai-workflow system resources

# Clear agent cache
./ai-workflow agents cache --clear

# Restart Queen Controller
./ai-workflow queen restart
```

#### Context Window Issues
```bash
# Clear context overflow
./ai-workflow context clear --overflow

# Optimize context usage
./ai-workflow context optimize --aggressive

# Check context stats
./ai-workflow context stats --detailed
```

#### Performance Issues
```bash
# Run performance diagnostic
./ai-workflow diagnose performance

# Clear caches
./ai-workflow cache clear --all

# Restart services
./ai-workflow restart --full
```

### Getting Help
```bash
# Built-in help system
./ai-workflow help                    # General help
./ai-workflow help [command]          # Command-specific help
./ai-workflow examples               # Usage examples
./ai-workflow troubleshoot           # Interactive troubleshooting

# System diagnostics
./ai-workflow diagnose --full        # Complete system diagnosis
./ai-workflow health --check         # Health check
./ai-workflow status --all           # System status
```

## Next Steps

### Explore Advanced Features
```bash
# Custom agent creation
./ai-workflow agents create custom-agent --template

# Workflow customization
./ai-workflow workflows customize --advanced

# Integration with external tools
./ai-workflow integrations configure --mcp-servers
```

### Monitor and Optimize
```bash
# Set up monitoring dashboard
./ai-workflow dashboard setup

# Configure alerts
./ai-workflow alerts configure --email your@email.com

# Enable analytics
./ai-workflow analytics enable --detailed
```

### Scale Your System
```bash
# Configure for production
./ai-workflow production configure

# Set up load balancing
./ai-workflow scaling configure --auto

# Enable distributed processing
./ai-workflow distributed enable
```

## Useful Resources

### Documentation
- **Full Integration Guide**: `/docs/integration/CLAUDE-FLOW-2.0-COMPLETE-INTEGRATION-GUIDE.md`
- **Agent-OS Workflow Guide**: `/docs/integration/AGENT-OS-WORKFLOW-GUIDE.md`
- **Specialized Agents Manual**: `/docs/integration/SPECIALIZED-AGENTS-INTEGRATION-MANUAL.md`
- **Queen Controller Guide**: `/docs/guides/QUEEN-CONTROLLER-GUIDE.md`

### CLI Reference
```bash
./ai-workflow commands              # List all commands
./ai-workflow shortcuts            # Common shortcuts
./ai-workflow aliases setup        # Set up shell aliases
```

### Support and Community
- **GitHub Issues**: Report bugs and request features
- **Documentation**: Complete guides and references
- **Examples**: Sample projects and workflows
- **CLI Help**: Built-in help and examples

## Success Metrics

After completing this quick start, you should have:

✅ **System installed and configured** (< 30 minutes)
✅ **First workflow executed successfully**
✅ **Multi-agent coordination working**
✅ **Neural learning system active**
✅ **Real-time monitoring enabled**
✅ **Auto-delegation configured**

### Performance Benchmarks
- **Agent spawn time**: < 200ms
- **Task distribution**: < 100ms
- **Neural predictions**: < 50ms
- **Context optimization**: 60-80% reduction
- **Workflow completion**: 3x faster than manual

## Conclusion

Congratulations! You now have a fully operational Claude Flow 2.0 + Agent-OS + Claude Code integration system. The platform combines:

- **50+ specialized agents** for comprehensive development coverage
- **Intelligent orchestration** with Queen Controller
- **Spec-driven development** with Agent-OS
- **Neural-enhanced decision making** for optimal performance
- **Real-time monitoring and optimization**

You're ready to tackle complex development projects with unprecedented automation and intelligence.

---

**Quick Start Complete** ✅  
**Time to Production**: < 30 minutes  
**Next Step**: Explore advanced workflows and customization  
**Support**: Use `./ai-workflow help` for assistance