# Claude Flow 2.0 Installation Guide

This comprehensive guide covers all installation methods for Claude Flow 2.0, from the simple one-command setup to advanced enterprise configurations.

## Table of Contents

- [Quick Installation](#quick-installation)
- [System Requirements](#system-requirements)
- [Installation Methods](#installation-methods)
- [Platform-Specific Instructions](#platform-specific-instructions)
- [Verification](#verification)
- [Configuration](#configuration)
- [Uninstallation](#uninstallation)
- [Troubleshooting](#troubleshooting)

## Quick Installation

The fastest way to get started with Claude Flow 2.0:

```bash
# Navigate to your project
cd your-project-directory

# Install and start Claude Flow 2.0
npx claude-flow@2.0.0 init --claude --webui
```

This single command will:
- Download and install Claude Flow 2.0
- Analyze your project structure
- Configure appropriate MCP servers
- Launch the Web UI dashboard
- Start the agent orchestration system

## System Requirements

### Minimum Requirements
- **Operating System**: Windows 10+, macOS 10.14+, or Linux (any modern distribution)
- **Node.js**: Version 14.0.0 or higher
- **npm**: Version 6.0.0 or higher
- **Memory**: 4GB RAM minimum (8GB recommended)
- **Disk Space**: 500MB for core system, additional space for MCP servers
- **Internet Connection**: Required for initial installation and MCP server discovery

### Recommended Requirements
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher
- **Memory**: 16GB RAM for optimal performance
- **CPU**: Multi-core processor for concurrent agent execution

### Compatibility Check
Before installation, verify your system meets requirements:

```bash
# Check Node.js version
node --version
# Should output: v14.0.0 or higher

# Check npm version
npm --version
# Should output: 6.0.0 or higher

# Check available memory
free -h  # Linux
top -l 1 -s 0 | grep PhysMem  # macOS
wmic memorychip get size  # Windows
```

## Installation Methods

### Method 1: Quick Start (Recommended for Most Users)

This method automatically detects your project type and configures everything:

```bash
npx claude-flow@2.0.0 init --claude --webui
```

**Features Enabled:**
- Automatic project analysis
- Web UI dashboard
- Standard agent configuration (10 agents)
- Auto-discovered MCP servers
- Production-ready defaults

### Method 2: Custom Configuration

For users who want to specify configuration options:

```bash
# Specify agent approach and count
npx claude-flow@2.0.0 init --approach hive --agents 25

# With Web UI and Claude integration
npx claude-flow@2.0.0 init --approach hive --agents 25 --claude --webui

# Enterprise SPARC methodology
npx claude-flow@2.0.0 init --approach sparc --agents 50 --claude --webui
```

**Available Approaches:**
- `hive`: Multi-agent coordination (recommended for most projects)
- `sparc`: Enterprise methodology with structured phases
- `swarm`: Simple agent swarm for smaller tasks

### Method 3: Advanced Configuration

For power users and enterprise setups:

```bash
# Maximum agent configuration
npx claude-flow@2.0.0 init --approach sparc --agents 100 --claude --webui --experimental

# Custom MCP server configuration
npx claude-flow@2.0.0 init --mcp-preset enterprise --claude --webui

# Offline installation (after initial setup)
npx claude-flow@2.0.0 init --offline --claude
```

### Method 4: Global Installation (Not Recommended)

While possible, we recommend per-project installation:

```bash
# Global installation
npm install -g claude-flow@2.0.0

# Then initialize in any project
cd your-project
claude-flow init --claude --webui
```

## Platform-Specific Instructions

### Windows

#### Using Command Prompt or PowerShell

```cmd
# Navigate to your project
cd C:\path\to\your\project

# Install Claude Flow 2.0
npx claude-flow@2.0.0 init --claude --webui
```

#### Using Git Bash (Recommended)

```bash
# Git Bash provides better compatibility
cd /c/path/to/your/project
npx claude-flow@2.0.0 init --claude --webui
```

#### Windows-Specific Notes
- PowerShell execution policy may need adjustment: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`
- Windows Defender may require exclusions for optimal performance
- WSL2 is recommended for the best experience

### macOS

```bash
# Standard installation
cd ~/path/to/your/project
npx claude-flow@2.0.0 init --claude --webui
```

#### macOS-Specific Notes
- Xcode Command Line Tools may be required: `xcode-select --install`
- Homebrew installation of Node.js is recommended
- File system watchers work optimally on APFS

### Linux

```bash
# Standard installation
cd ~/path/to/your/project
npx claude-flow@2.0.0 init --claude --webui
```

#### Linux-Specific Notes
- Some distributions may require additional development packages
- inotify file system watchers provide excellent performance
- Docker integration works seamlessly

## Verification

After installation, verify everything is working correctly:

### 1. Check Installation Status
```bash
npx claude-flow@2.0.0 status
```

Expected output:
```
✅ Claude Flow 2.0 Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏗️  Installation: ✅ Complete
🤖 Agents: ✅ 10 active agents
🔌 MCP Servers: ✅ 25 connected servers
🌐 Web UI: ✅ Running at http://localhost:3000
📊 Performance: ✅ All systems optimal

🚀 Ready for development!
```

### 2. Test Web UI Access
Open your browser and navigate to:
- **Dashboard**: http://localhost:3000
- **Agent Monitor**: http://localhost:3000/agents
- **MCP Status**: http://localhost:3000/mcp

### 3. Test Agent Communication
```bash
npx claude-flow@2.0.0 test
```

This command runs a comprehensive system test including:
- Agent spawn and communication
- MCP server connectivity
- File system integration
- Web UI responsiveness

### 4. Verify MCP Server Discovery
```bash
npx claude-flow@2.0.0 mcp list
```

Expected output showing discovered servers:
```
🔌 Discovered MCP Servers (127 total)

📊 Databases (12 servers)
  ✅ postgresql - PostgreSQL database operations
  ✅ mysql - MySQL database operations
  ✅ redis - Redis cache operations
  ...

☁️ Cloud Services (23 servers)
  ✅ aws - Amazon Web Services integration
  ✅ gcp - Google Cloud Platform integration
  ✅ azure - Microsoft Azure integration
  ...
```

## Configuration

### Basic Configuration

Claude Flow 2.0 works out-of-the-box, but you can customize behavior by creating a configuration file:

```bash
# Generate default configuration
npx claude-flow@2.0.0 config generate
```

This creates `.claude-flow/config.json`:

```json
{
  "version": "2.0.0",
  "agents": {
    "count": 10,
    "approach": "hive",
    "scaling": {
      "enabled": true,
      "min": 5,
      "max": 100,
      "threshold": 80
    }
  },
  "webui": {
    "enabled": true,
    "port": 3000,
    "host": "localhost"
  },
  "mcp": {
    "autoDiscovery": true,
    "preset": "standard",
    "customServers": []
  },
  "performance": {
    "memoryLimit": "2GB",
    "cpuLimit": 80,
    "concurrency": 10
  }
}
```

### Advanced Configuration

#### Custom Agent Configuration
```json
{
  "agents": {
    "types": [
      {
        "name": "code-analyzer",
        "count": 2,
        "priority": "high"
      },
      {
        "name": "test-runner",
        "count": 3,
        "priority": "medium"
      },
      {
        "name": "security-scanner",
        "count": 1,
        "priority": "high"
      }
    ]
  }
}
```

#### Custom MCP Servers
```json
{
  "mcp": {
    "customServers": [
      {
        "name": "company-api",
        "url": "http://internal-api.company.com",
        "auth": {
          "type": "bearer",
          "token": "${COMPANY_API_TOKEN}"
        }
      }
    ]
  }
}
```

### Environment Variables

Customize behavior with environment variables:

```bash
# Agent configuration
export CLAUDE_FLOW_AGENTS=20
export CLAUDE_FLOW_APPROACH=sparc

# Web UI configuration
export CLAUDE_FLOW_WEBUI_PORT=4000
export CLAUDE_FLOW_WEBUI_HOST=0.0.0.0

# Performance tuning
export CLAUDE_FLOW_MEMORY_LIMIT=4GB
export CLAUDE_FLOW_CPU_LIMIT=90

# MCP configuration
export CLAUDE_FLOW_MCP_PRESET=enterprise
export CLAUDE_FLOW_MCP_TIMEOUT=30000

# Development mode
export CLAUDE_FLOW_DEBUG=true
export CLAUDE_FLOW_LOG_LEVEL=debug
```

## Uninstallation

Claude Flow 2.0 provides a clean, complete uninstallation process:

### Quick Uninstall
```bash
npx claude-flow@2.0.0 uninstall --clean
```

### Manual Uninstall
If the automatic uninstall fails:

```bash
# Stop all processes
npx claude-flow@2.0.0 stop

# Remove configuration and data
rm -rf .claude-flow/
rm -rf node_modules/.claude-flow-cache/
rm -rf ~/.claude-flow-global/

# Remove global installation (if used)
npm uninstall -g claude-flow
```

### Verification of Uninstall
```bash
# Check no processes remain
ps aux | grep claude-flow

# Check no files remain
find . -name "*claude-flow*" -type f 2>/dev/null

# Check no network ports are in use
lsof -i :3000
```

## Troubleshooting

### Common Issues and Solutions

#### Issue: "npx command not found"
**Solution:**
```bash
# Install/update npm
npm install -g npm@latest

# On macOS with Homebrew
brew install node

# On Ubuntu/Debian
sudo apt-get install nodejs npm

# On CentOS/RHEL
sudo yum install nodejs npm
```

#### Issue: Permission denied errors
**Solution:**
```bash
# Fix npm permissions
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH

# Or use sudo (not recommended)
sudo npx claude-flow@2.0.0 init --claude --webui
```

#### Issue: Port 3000 already in use
**Solution:**
```bash
# Use different port
npx claude-flow@2.0.0 init --claude --webui --port 4000

# Or kill existing process
lsof -ti:3000 | xargs kill -9
```

#### Issue: MCP servers not discovered
**Solution:**
```bash
# Manual refresh
npx claude-flow@2.0.0 mcp refresh

# Check network connectivity
curl -I https://registry.npmjs.org/

# Reset MCP cache
rm -rf .claude-flow/mcp-cache/
npx claude-flow@2.0.0 mcp discover
```

#### Issue: High memory usage
**Solution:**
```bash
# Reduce agent count
npx claude-flow@2.0.0 config set agents.count 5

# Set memory limit
export CLAUDE_FLOW_MEMORY_LIMIT=1GB

# Enable memory optimization
npx claude-flow@2.0.0 config set performance.optimization true
```

### Getting Help

If you encounter issues not covered here:

1. **Check the logs**:
   ```bash
   npx claude-flow@2.0.0 logs
   ```

2. **Run diagnostics**:
   ```bash
   npx claude-flow@2.0.0 diagnose
   ```

3. **Create a support bundle**:
   ```bash
   npx claude-flow@2.0.0 support-bundle
   ```

4. **Get community help**:
   - [GitHub Issues](https://github.com/yourusername/claude-flow-2.0/issues)
   - [Community Discord](https://discord.gg/claude-flow)
   - [Documentation](./README.md)

## Next Steps

After successful installation:
1. **[Usage Guide](./USAGE.md)** - Learn how to use all features
2. **[Examples](./EXAMPLES.md)** - See real-world project examples
3. **[Advanced Features](./ADVANCED.md)** - Explore unlimited scaling and customization
4. **[Troubleshooting](./TROUBLESHOOTING.md)** - Solve common issues

---

**Installation complete!** Your project is now powered by Claude Flow 2.0. Start building with AI assistance by running your first command:

```bash
npx claude-flow@2.0.0 help
```