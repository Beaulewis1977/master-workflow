# Claude Flow 2.0 Troubleshooting Guide

This comprehensive troubleshooting guide helps you quickly identify and resolve common issues with Claude Flow 2.0. Issues are organized by category with step-by-step solutions and preventive measures.

## Table of Contents

- [Quick Diagnostics](#quick-diagnostics)
- [Installation Issues](#installation-issues)
- [Agent Management Issues](#agent-management-issues)
- [Web UI Problems](#web-ui-problems)
- [MCP Server Issues](#mcp-server-issues)
- [Performance Problems](#performance-problems)
- [Network and Connectivity](#network-and-connectivity)
- [Configuration Issues](#configuration-issues)
- [Platform-Specific Problems](#platform-specific-problems)
- [Advanced Troubleshooting](#advanced-troubleshooting)
- [Getting Help](#getting-help)

## Quick Diagnostics

Before diving into specific issues, run these diagnostic commands:

### System Health Check
```bash
# Complete system diagnostics
npx claude-flow@2.0.0 diagnose

# Quick health check
npx claude-flow@2.0.0 healthcheck

# System status with details
npx claude-flow@2.0.0 status --verbose
```

### Log Analysis
```bash
# View recent logs with errors
npx claude-flow@2.0.0 logs --level error --tail 100

# Export diagnostic bundle
npx claude-flow@2.0.0 support-bundle
```

### Common Quick Fixes
```bash
# Restart all services
npx claude-flow@2.0.0 restart

# Clear cache and restart
npx claude-flow@2.0.0 restart --clear-cache

# Reset to default configuration
npx claude-flow@2.0.0 reset --config-only
```

## Installation Issues

### Issue: "npx command not found"

**Symptoms:**
- `npx: command not found` error
- `npm: command not found` error

**Solutions:**

1. **Install/Update Node.js:**
   ```bash
   # Check current version
   node --version
   npm --version
   
   # Install Node.js 18+ from nodejs.org
   # Or using package managers:
   
   # macOS with Homebrew
   brew install node
   
   # Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install nodejs npm
   
   # CentOS/RHEL
   sudo yum install nodejs npm
   
   # Windows with Chocolatey
   choco install nodejs
   ```

2. **Fix npm Path:**
   ```bash
   # Add npm to PATH
   export PATH=$PATH:$(npm config get prefix)/bin
   
   # Make permanent (add to ~/.bashrc or ~/.zshrc)
   echo 'export PATH=$PATH:$(npm config get prefix)/bin' >> ~/.bashrc
   ```

### Issue: "Permission Denied" Errors

**Symptoms:**
- `EACCES: permission denied` errors
- Cannot write to directories

**Solutions:**

1. **Fix npm Permissions (Recommended):**
   ```bash
   # Create npm global directory in home folder
   mkdir ~/.npm-global
   npm config set prefix '~/.npm-global'
   
   # Add to PATH
   export PATH=~/.npm-global/bin:$PATH
   echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
   source ~/.bashrc
   ```

2. **Alternative: Use Sudo (Not Recommended):**
   ```bash
   sudo npx claude-flow@2.0.0 init --claude --webui
   ```

3. **Windows PowerShell Execution Policy:**
   ```powershell
   # Check current policy
   Get-ExecutionPolicy
   
   # Set policy for current user
   Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
   ```

### Issue: "Package Not Found" or "Version Not Available"

**Symptoms:**
- `404 Not Found` errors
- `Version 2.0.0 not found` errors

**Solutions:**

1. **Clear npm Cache:**
   ```bash
   npm cache clean --force
   npx clear-npx-cache
   ```

2. **Use Specific Registry:**
   ```bash
   npx --registry https://registry.npmjs.org/ claude-flow@2.0.0 init
   ```

3. **Check Network Connectivity:**
   ```bash
   curl -I https://registry.npmjs.org/
   npm config get registry
   ```

### Issue: Installation Hangs or Times Out

**Symptoms:**
- Installation process freezes
- Network timeout errors

**Solutions:**

1. **Increase Timeout:**
   ```bash
   npm config set timeout 120000
   npx --timeout 120000 claude-flow@2.0.0 init
   ```

2. **Use Different Network:**
   ```bash
   # Corporate networks may block npm registry
   # Try mobile hotspot or different network
   
   # Configure corporate proxy if needed
   npm config set proxy http://proxy.company.com:8080
   npm config set https-proxy http://proxy.company.com:8080
   ```

## Agent Management Issues

### Issue: Agents Not Starting

**Symptoms:**
- "No active agents" in status
- Agents stuck in "starting" state

**Solutions:**

1. **Check System Resources:**
   ```bash
   # Check available memory and CPU
   npx claude-flow@2.0.0 diagnose --resource-check
   
   # Reduce agent count if low on resources
   npx claude-flow@2.0.0 config set agents.count 5
   ```

2. **Clear Agent State:**
   ```bash
   # Reset all agents
   npx claude-flow@2.0.0 agents reset
   
   # Restart with fresh state
   npx claude-flow@2.0.0 restart --reset-agents
   ```

3. **Check Agent Configuration:**
   ```bash
   # Validate agent configuration
   npx claude-flow@2.0.0 validate agents
   
   # Reset to default agent config
   npx claude-flow@2.0.0 agents configure --reset
   ```

### Issue: Agents Crashing or Becoming Unresponsive

**Symptoms:**
- Agents showing "crashed" status
- No response from specific agents
- High memory usage by agents

**Solutions:**

1. **Analyze Agent Logs:**
   ```bash
   # View logs for specific agent
   npx claude-flow@2.0.0 logs --agent [agent-id]
   
   # Look for memory or error patterns
   npx claude-flow@2.0.0 logs --level error --agent [agent-id]
   ```

2. **Restart Problematic Agents:**
   ```bash
   # Restart specific agent
   npx claude-flow@2.0.0 agents restart [agent-id]
   
   # Restart all agents of specific type
   npx claude-flow@2.0.0 agents restart --type code-analyzer
   ```

3. **Adjust Resource Limits:**
   ```bash
   # Set memory limits for agents
   npx claude-flow@2.0.0 config set agents.memoryLimit 1GB
   
   # Reduce concurrent tasks per agent
   npx claude-flow@2.0.0 config set agents.concurrency 3
   ```

### Issue: Poor Agent Performance

**Symptoms:**
- Slow task completion
- High CPU usage
- Agents timing out

**Solutions:**

1. **Performance Optimization:**
   ```bash
   # Enable performance mode
   npx claude-flow@2.0.0 config set performance.mode optimized
   
   # Adjust agent priorities
   npx claude-flow@2.0.0 agents configure --priority-balancing true
   ```

2. **Resource Monitoring:**
   ```bash
   # Monitor agent performance
   npx claude-flow@2.0.0 monitor agents --interval 5s
   
   # Generate performance report
   npx claude-flow@2.0.0 agents report --performance
   ```

## Web UI Problems

### Issue: Web UI Not Loading

**Symptoms:**
- "Cannot connect to localhost:3000"
- Web UI shows blank page
- Connection refused errors

**Solutions:**

1. **Check UI Service Status:**
   ```bash
   # Verify Web UI is running
   npx claude-flow@2.0.0 status --component webui
   
   # Restart Web UI specifically
   npx claude-flow@2.0.0 restart --component webui
   ```

2. **Port Conflicts:**
   ```bash
   # Check if port 3000 is in use
   lsof -i :3000
   netstat -an | grep :3000
   
   # Use different port
   npx claude-flow@2.0.0 config set webui.port 4000
   npx claude-flow@2.0.0 restart
   ```

3. **Firewall Issues:**
   ```bash
   # Check firewall on macOS
   sudo pfctl -sr | grep 3000
   
   # Check firewall on Linux
   sudo iptables -L | grep 3000
   
   # Windows firewall
   # Check Windows Defender Firewall settings
   ```

### Issue: Web UI Partially Loading

**Symptoms:**
- Some sections not displaying
- JavaScript errors in browser console
- Incomplete data in dashboard

**Solutions:**

1. **Browser Cache:**
   ```bash
   # Clear browser cache and cookies
   # Chrome: Ctrl+Shift+Delete (Cmd+Shift+Delete on Mac)
   # Firefox: Ctrl+Shift+Delete (Cmd+Shift+Delete on Mac)
   
   # Force refresh
   # Ctrl+F5 (Cmd+Shift+R on Mac)
   ```

2. **Check Browser Compatibility:**
   ```bash
   # Supported browsers:
   # - Chrome 90+
   # - Firefox 85+
   # - Safari 14+
   # - Edge 90+
   
   # Update your browser to latest version
   ```

3. **WebSocket Connection Issues:**
   ```bash
   # Check WebSocket connectivity
   npx claude-flow@2.0.0 test --websocket
   
   # Try different host binding
   npx claude-flow@2.0.0 config set webui.host 127.0.0.1
   ```

### Issue: Web UI Performance Problems

**Symptoms:**
- Slow page loads
- Unresponsive interface
- High CPU usage in browser

**Solutions:**

1. **Reduce Update Frequency:**
   ```bash
   # Slow down real-time updates
   npx claude-flow@2.0.0 config set webui.updateInterval 2000
   
   # Disable auto-refresh for large datasets
   npx claude-flow@2.0.0 config set webui.autoRefresh false
   ```

2. **Browser Optimization:**
   ```bash
   # Close other browser tabs
   # Disable unnecessary browser extensions
   # Use incognito/private mode for testing
   ```

## MCP Server Issues

### Issue: MCP Servers Not Discovered

**Symptoms:**
- "No MCP servers found" message
- Expected servers missing from list
- Discovery process fails

**Solutions:**

1. **Manual Discovery:**
   ```bash
   # Force MCP server discovery
   npx claude-flow@2.0.0 mcp discover --force
   
   # Clear MCP cache and rediscover
   npx claude-flow@2.0.0 mcp discover --clear-cache
   
   # Check specific categories
   npx claude-flow@2.0.0 mcp discover --categories database,cloud
   ```

2. **Network Connectivity:**
   ```bash
   # Test internet connection
   curl -I https://registry.npmjs.org/
   
   # Check proxy settings
   npm config get proxy
   npm config get https-proxy
   
   # Test with different DNS
   nslookup registry.npmjs.org 8.8.8.8
   ```

3. **Environment Variables:**
   ```bash
   # Check required environment variables
   env | grep -E "(DATABASE_URL|AWS_|GCP_|AZURE_)"
   
   # Set missing variables
   export DATABASE_URL="postgresql://localhost:5432/mydb"
   npx claude-flow@2.0.0 mcp refresh
   ```

### Issue: MCP Server Connection Failures

**Symptoms:**
- "Connection failed" for specific servers
- Servers showing "offline" status
- Timeout errors when connecting

**Solutions:**

1. **Test Individual Servers:**
   ```bash
   # Test specific server connectivity
   npx claude-flow@2.0.0 mcp test postgresql
   
   # Check server configuration
   npx claude-flow@2.0.0 mcp info postgresql
   
   # Reconfigure server
   npx claude-flow@2.0.0 mcp configure postgresql
   ```

2. **Authentication Issues:**
   ```bash
   # Check credentials
   npx claude-flow@2.0.0 mcp auth --server postgresql --test
   
   # Reset credentials
   npx claude-flow@2.0.0 mcp auth --server postgresql --reset
   
   # Use environment variables for auth
   export POSTGRESQL_URL="postgresql://user:pass@host:port/db"
   ```

3. **Network and Firewall:**
   ```bash
   # Test direct connection
   telnet localhost 5432
   nc -zv localhost 5432
   
   # Check for firewall blocking
   sudo iptables -L | grep 5432
   ```

### Issue: Slow MCP Server Performance

**Symptoms:**
- Long response times from servers
- Timeouts on complex operations
- High latency warnings

**Solutions:**

1. **Optimize Connection Settings:**
   ```bash
   # Increase timeout limits
   npx claude-flow@2.0.0 config set mcp.timeout 30000
   
   # Enable connection pooling
   npx claude-flow@2.0.0 config set mcp.pool.enabled true
   npx claude-flow@2.0.0 config set mcp.pool.max 10
   ```

2. **Server-Specific Optimization:**
   ```bash
   # Database server optimization
   npx claude-flow@2.0.0 mcp optimize --server postgresql
   
   # Enable caching
   npx claude-flow@2.0.0 config set mcp.cache.enabled true
   ```

## Performance Problems

### Issue: High Memory Usage

**Symptoms:**
- System running out of memory
- "Out of memory" errors
- Slow system performance

**Solutions:**

1. **Memory Analysis:**
   ```bash
   # Check memory usage by component
   npx claude-flow@2.0.0 diagnose --memory
   
   # Monitor memory usage over time
   npx claude-flow@2.0.0 monitor --memory --interval 10s
   ```

2. **Reduce Memory Footprint:**
   ```bash
   # Reduce agent count
   npx claude-flow@2.0.0 config set agents.count 10
   
   # Set memory limits
   npx claude-flow@2.0.0 config set performance.memoryLimit 4GB
   
   # Enable memory optimization
   npx claude-flow@2.0.0 config set performance.memoryOptimization true
   ```

3. **Clean Up Resources:**
   ```bash
   # Clear caches
   npx claude-flow@2.0.0 cache clear --all
   
   # Garbage collection
   npx claude-flow@2.0.0 maintenance --gc
   ```

### Issue: High CPU Usage

**Symptoms:**
- 100% CPU utilization
- System becomes unresponsive
- Fan noise on laptops

**Solutions:**

1. **CPU Usage Analysis:**
   ```bash
   # Check CPU usage by agent
   npx claude-flow@2.0.0 diagnose --cpu
   
   # Find CPU-intensive processes
   top -p $(pgrep -f claude-flow)
   ```

2. **CPU Optimization:**
   ```bash
   # Limit CPU usage
   npx claude-flow@2.0.0 config set performance.cpuLimit 80
   
   # Reduce concurrency
   npx claude-flow@2.0.0 config set agents.concurrency 2
   
   # Enable CPU throttling
   npx claude-flow@2.0.0 config set performance.throttling true
   ```

### Issue: Slow Task Execution

**Symptoms:**
- Tasks taking longer than expected
- Queue building up
- Timeout errors

**Solutions:**

1. **Performance Tuning:**
   ```bash
   # Increase agent count for more parallelism
   npx claude-flow@2.0.0 agents scale 20
   
   # Optimize task distribution
   npx claude-flow@2.0.0 config set orchestration.loadBalancing true
   
   # Enable performance mode
   npx claude-flow@2.0.0 config set performance.mode high
   ```

2. **Task Prioritization:**
   ```bash
   # Enable task prioritization
   npx claude-flow@2.0.0 config set tasks.prioritization true
   
   # Adjust queue settings
   npx claude-flow@2.0.0 config set tasks.queue.maxSize 1000
   ```

## Network and Connectivity

### Issue: Cannot Access Web UI from External Network

**Symptoms:**
- Web UI only accessible from localhost
- Connection refused from other devices

**Solutions:**

1. **Configure External Access:**
   ```bash
   # Bind to all interfaces
   npx claude-flow@2.0.0 config set webui.host 0.0.0.0
   
   # Restart with new configuration
   npx claude-flow@2.0.0 restart
   ```

2. **Firewall Configuration:**
   ```bash
   # Open port in firewall (Linux)
   sudo ufw allow 3000
   sudo iptables -I INPUT -p tcp --dport 3000 -j ACCEPT
   
   # macOS
   sudo pfctl -f /etc/pf.conf
   
   # Windows
   # Use Windows Defender Firewall to allow port 3000
   ```

3. **Security Considerations:**
   ```bash
   # Enable authentication for external access
   npx claude-flow@2.0.0 config set security.auth.enabled true
   npx claude-flow@2.0.0 config set security.auth.method basic
   
   # Set username and password
   npx claude-flow@2.0.0 auth set-credentials
   ```

### Issue: Proxy and Corporate Network Problems

**Symptoms:**
- Cannot download packages
- MCP server discovery fails
- Network timeout errors

**Solutions:**

1. **Configure Proxy Settings:**
   ```bash
   # Set npm proxy
   npm config set proxy http://proxy.company.com:8080
   npm config set https-proxy http://proxy.company.com:8080
   
   # Set proxy for Claude Flow
   export HTTP_PROXY=http://proxy.company.com:8080
   export HTTPS_PROXY=http://proxy.company.com:8080
   ```

2. **Certificate Issues:**
   ```bash
   # Disable SSL verification (not recommended for production)
   npm config set strict-ssl false
   
   # Add corporate certificate
   npm config set cafile /path/to/corporate-cert.pem
   ```

## Configuration Issues

### Issue: Configuration Not Persisting

**Symptoms:**
- Settings reset after restart
- Configuration changes don't take effect
- Config file not found

**Solutions:**

1. **Check Configuration File:**
   ```bash
   # Verify config file location
   npx claude-flow@2.0.0 config path
   
   # Check file permissions
   ls -la .claude-flow/config.json
   
   # Validate configuration
   npx claude-flow@2.0.0 config validate
   ```

2. **Fix Permissions:**
   ```bash
   # Fix file permissions
   chmod 644 .claude-flow/config.json
   
   # Fix directory permissions
   chmod 755 .claude-flow/
   ```

3. **Regenerate Configuration:**
   ```bash
   # Backup existing config
   cp .claude-flow/config.json .claude-flow/config.json.backup
   
   # Generate fresh configuration
   npx claude-flow@2.0.0 config generate --force
   ```

### Issue: Invalid Configuration Values

**Symptoms:**
- "Invalid configuration" errors
- System fails to start
- Unexpected behavior

**Solutions:**

1. **Validate Configuration:**
   ```bash
   # Check configuration validity
   npx claude-flow@2.0.0 config validate
   
   # Show configuration with validation
   npx claude-flow@2.0.0 config show --validate
   ```

2. **Fix Common Issues:**
   ```bash
   # Reset invalid values to defaults
   npx claude-flow@2.0.0 config reset --invalid-only
   
   # Fix specific sections
   npx claude-flow@2.0.0 config reset agents
   npx claude-flow@2.0.0 config reset webui
   ```

## Platform-Specific Problems

### Windows Issues

#### PowerShell Execution Policy
```powershell
# Check current policy
Get-ExecutionPolicy

# Set execution policy
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned

# Bypass execution policy for single command
PowerShell -ExecutionPolicy Bypass -Command "npx claude-flow@2.0.0 init"
```

#### Windows Defender Issues
```powershell
# Add exclusion for Node.js processes
Add-MpPreference -ExclusionProcess "node.exe"
Add-MpPreference -ExclusionProcess "npx.exe"

# Add exclusion for project directory
Add-MpPreference -ExclusionPath "C:\path\to\your\project"
```

#### File Path Issues
```bash
# Use forward slashes or double backslashes
npx claude-flow@2.0.0 init --project-path "C:/Projects/MyApp"
# or
npx claude-flow@2.0.0 init --project-path "C:\\Projects\\MyApp"
```

### macOS Issues

#### Permission Issues
```bash
# Fix permissions for Node.js
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}

# Use Homebrew for Node.js (recommended)
brew install node
```

#### Gatekeeper Issues
```bash
# Allow unsigned applications (temporary)
sudo spctl --master-disable

# Re-enable after installation
sudo spctl --master-enable
```

### Linux Issues

#### Missing Dependencies
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install build-essential python3-dev

# CentOS/RHEL
sudo yum groupinstall "Development Tools"
sudo yum install python3-devel

# Alpine Linux
apk add --no-cache make gcc g++ python3-dev
```

#### SELinux Issues
```bash
# Check SELinux status
sestatus

# Set permissive mode temporarily
sudo setenforce 0

# Create permanent exception
sudo setsebool -P httpd_can_network_connect 1
```

## Advanced Troubleshooting

### Debug Mode

Enable debug mode for detailed logging:

```bash
# Enable debug mode
npx claude-flow@2.0.0 debug enable

# Run with debug output
DEBUG=claude-flow:* npx claude-flow@2.0.0 init

# Save debug logs
npx claude-flow@2.0.0 logs --level debug --export debug.log
```

### Performance Profiling

```bash
# Generate performance profile
npx claude-flow@2.0.0 profile generate

# Analyze performance bottlenecks
npx claude-flow@2.0.0 profile analyze

# Export profile for analysis
npx claude-flow@2.0.0 profile export --format json
```

### System Recovery

```bash
# Safe mode startup
npx claude-flow@2.0.0 start --safe-mode

# Recovery mode
npx claude-flow@2.0.0 recovery --auto-fix

# Complete system reset (preserves data)
npx claude-flow@2.0.0 reset --keep-data

# Nuclear option: complete clean slate
npx claude-flow@2.0.0 reset --complete
```

### Creating Support Bundle

When reporting issues, create a comprehensive support bundle:

```bash
# Generate support bundle
npx claude-flow@2.0.0 support-bundle

# Include additional diagnostic info
npx claude-flow@2.0.0 support-bundle --include-system-info --include-logs --include-config
```

The support bundle will contain:
- System configuration
- Recent logs
- Performance metrics
- Diagnostic reports
- System information

## Getting Help

### Community Resources

1. **GitHub Issues**: [Report bugs and request features](https://github.com/yourusername/claude-flow-2.0/issues)
2. **Discord Community**: [Join discussions and get help](https://discord.gg/claude-flow)
3. **Documentation**: [Complete documentation](./README.md)
4. **Stack Overflow**: Tag questions with `claude-flow-2.0`

### When Reporting Issues

Include the following information:

1. **Environment Information:**
   ```bash
   npx claude-flow@2.0.0 info --system
   ```

2. **Support Bundle:**
   ```bash
   npx claude-flow@2.0.0 support-bundle
   ```

3. **Steps to Reproduce:**
   - Exact commands used
   - Expected behavior
   - Actual behavior
   - Error messages

4. **Configuration:**
   ```bash
   npx claude-flow@2.0.0 config show --sanitized
   ```

### Enterprise Support

For enterprise users, professional support is available:
- **Priority Support**: 4-hour response time
- **Dedicated Support Engineer**: Direct access to experts
- **Custom Configuration**: Tailored setup assistance
- **Performance Optimization**: Custom tuning for your environment

Contact enterprise support at: support@claude-flow.com

---

**Remember**: Most issues can be resolved quickly by restarting the system or clearing caches. Always try the simple solutions first before diving into complex troubleshooting.