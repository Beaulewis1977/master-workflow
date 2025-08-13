# MCP Server Preset Configurations

This directory contains 8 specialized MCP (Model Context Protocol) server preset configurations optimized for different development environments and project types.

## Available Presets

### 1. Web Development (`web-development.json`)
- **Focus**: React, Next.js, Vercel, modern web development
- **Key Servers**: context7, filesystem, git, github, browser, http, openapi
- **Best For**: Frontend applications, full-stack web projects, SPA development
- **Testing**: Cypress, Playwright, Jest integration

### 2. API Backend (`api-backend.json`)
- **Focus**: Express.js, databases, Redis, authentication services
- **Key Servers**: context7, filesystem, postgres, redis, http, openapi, docker
- **Best For**: REST APIs, GraphQL services, microservices architecture
- **Features**: Database management, caching, API documentation

### 3. Data Science (`data-science.json`)
- **Focus**: Python tools, Jupyter notebooks, ML services, analytics
- **Key Servers**: context7, filesystem, postgres, s3, aws, gcp, kubernetes
- **Best For**: Machine learning projects, data analysis, AI/ML pipelines
- **Tools**: Pandas, TensorFlow, PyTorch, MLflow, Jupyter integration

### 4. DevOps (`devops.json`)
- **Focus**: Docker, Kubernetes, CI/CD, infrastructure monitoring
- **Key Servers**: docker, kubernetes, aws, gcp, azure, git, github
- **Best For**: Infrastructure automation, deployment pipelines, monitoring
- **Features**: Multi-cloud support, GitOps workflows, monitoring stack

### 5. Enterprise (`enterprise.json`)
- **Focus**: All major cloud services, compliance tools, enterprise integrations
- **Key Servers**: All available servers with enterprise-grade configurations
- **Best For**: Large-scale enterprise applications, compliance-heavy projects
- **Features**: SOX, HIPAA, GDPR compliance, advanced security

### 6. Mobile Development (`mobile-development.json`)
- **Focus**: React Native, Flutter, Firebase, cross-platform development
- **Key Servers**: context7, filesystem, git, github, aws, gcp, browser
- **Best For**: iOS/Android apps, cross-platform mobile development
- **Features**: App store deployment, mobile testing, push notifications

### 7. Game Development (`game-development.json`)
- **Focus**: Unity, Unreal Engine, game services, multimedia tools
- **Key Servers**: context7, filesystem, git, aws, gcp, docker, kubernetes
- **Best For**: Game development, interactive media, real-time applications
- **Features**: Game server orchestration, multiplayer support, asset pipeline

### 8. Blockchain & Web3 (`blockchain.json`)
- **Focus**: Ethereum, Solidity, DeFi protocols, blockchain infrastructure
- **Key Servers**: context7, filesystem, git, github, http, docker, aws, postgres
- **Best For**: Smart contracts, DeFi applications, Web3 frontend development
- **Features**: Multi-chain support, security auditing, wallet integration

## Configuration Structure

Each preset includes:

```json
{
  "name": "Preset Name",
  "description": "Detailed description",
  "category": "preset_category",
  "version": "1.0.0",
  "priority_level": "high|critical",
  "enabled_servers": {
    "server_name": {
      "enabled": true,
      "priority": 1,
      "description": "Server purpose",
      "config": { /* server-specific config */ }
    }
  },
  "environment_variables": {
    "required": ["ENV_VAR_1"],
    "optional": ["OPTIONAL_VAR"],
    "development": { /* dev-specific vars */ },
    "production": { /* prod-specific vars */ }
  },
  "recommended_tools": ["tool1", "tool2"],
  "project_structure": { /* expected file structure */ },
  "common_configurations": { /* framework defaults */ },
  "integration_points": { /* service integrations */ }
}
```

## Usage Examples

### Loading a Preset
```bash
# Copy preset to your project
cp templates/mcp-configs/server-presets/web-development.json .mcp-config.json

# Or use with Claude Flow 2.0
claude-flow init --preset web-development
```

### Customizing Presets
1. Copy the closest matching preset
2. Modify server priorities and configurations
3. Add/remove servers based on your needs
4. Adjust environment variables

### Environment-Specific Overrides
```json
{
  "environment_overrides": {
    "development": {
      "enabled_servers": {
        "context7": { "priority": 1 }
      }
    },
    "production": {
      "enabled_servers": {
        "monitoring": { "enabled": true }
      }
    }
  }
}
```

## Server Priority System

- **Priority 1-3**: Critical servers (always enabled)
- **Priority 4-8**: High priority servers (recommended)
- **Priority 9+**: Optional/specialized servers

## Integration with Claude Flow 2.0

These presets are designed to work seamlessly with [Claude Flow 2.0](https://github.com/ruvnet/claude-flow), supporting:

- Automatic server discovery and configuration
- Environment-specific overrides
- Dynamic priority adjustment
- Hot-swappable server configurations

## Security Considerations

All presets include:
- Environment variable validation
- Secure default configurations
- Compliance framework support (where applicable)
- Security scanning integration

## Contributing

To add a new preset:
1. Copy an existing preset as a template
2. Modify for your specific use case
3. Update this README with the new preset details
4. Test with your target development environment

## Support

For issues or questions:
- Check the [Claude Flow 2.0 documentation](https://github.com/ruvnet/claude-flow)
- Review server-specific configuration options
- Validate environment variables and dependencies