# Claude Flow 2.0 Dependency Manager

A comprehensive, cross-platform dependency checking and installation system for Claude Flow 2.0. Ensures all required dependencies are properly installed and configured before running any Claude Flow operations.

## Features

### 🔍 **Intelligent Dependency Detection**
- Automatic version checking with compatibility validation
- Support for multiple package managers (npm, yarn, pnpm)
- Cross-platform detection (Windows, macOS, Linux)
- Enterprise/offline environment support

### 📦 **Automated Installation**
- Cross-platform installation scripts
- Interactive user prompts with progress indicators
- Fallback options for failed installations
- Non-interactive mode for CI/CD environments

### ✅ **Post-Installation Verification**
- Comprehensive functionality testing
- Performance benchmarking
- Health checks and diagnostics
- Recovery suggestions for failed components

### 🎨 **Beautiful User Experience**
- Interactive installation wizard
- Real-time progress indicators
- Detailed status reporting
- Platform-specific guidance

## Supported Dependencies

### Required Dependencies
- **Node.js** (v16+) - JavaScript runtime environment
- **Git** (v2.20+) - Version control system
- **Claude Code CLI** - Core AI coding platform
- **Claude Flow 2.0** - Workflow orchestration engine
- **Agent-OS** - Specialized agents system
- **npm** (v8+) - Package manager

### Optional Dependencies
- **TMux** - Terminal multiplexing (Linux/macOS)
- **Windows Terminal** - Enhanced terminal (Windows)

## Installation

### As part of Claude Flow 2.0
```bash
# Automatically runs dependency check during initialization
npx claude-flow@2.0.0 init --claude --webui
```

### Standalone Usage
```bash
# Install the dependency manager
npm install -g @claude-flow/dependency-manager

# Run dependency check and installation
claude-flow-deps
```

### Development Usage
```bash
# Clone and use locally
git clone https://github.com/claude-flow/claude-flow-2.0.git
cd claude-flow-2.0/lib/dependency-manager
node claude-flow-deps.js
```

## Usage Examples

### Basic Usage
```bash
# Check and install all dependencies (interactive)
claude-flow-deps

# Check dependencies only (no installation)
claude-flow-deps check

# Install dependencies non-interactively
claude-flow-deps install -y

# Verify installed dependencies
claude-flow-deps verify

# Run test suite
claude-flow-deps test
```

### Advanced Options
```bash
# Verbose output with detailed information
claude-flow-deps install --verbose

# Skip optional dependencies
claude-flow-deps install --skip-optional

# Dry run (show what would be done)
claude-flow-deps install --dry-run

# Offline mode (skip network-dependent features)
claude-flow-deps check --offline

# Quiet mode (minimal output)
claude-flow-deps install --quiet
```

### Integration Examples

#### Programmatic Usage
```javascript
const { ClaudeFlowDependencyManager } = require('@claude-flow/dependency-manager');

const manager = new ClaudeFlowDependencyManager({
  nonInteractive: true,
  verbose: false
});

const result = await manager.ensureDependencies('init');
if (result.success) {
  console.log('✅ All dependencies ready!');
} else {
  console.error('❌ Dependency issues detected');
}
```

#### CI/CD Integration
```yaml
# GitHub Actions example
- name: Check Claude Flow Dependencies
  run: |
    npx @claude-flow/dependency-manager check --non-interactive
    
- name: Install Dependencies if Needed
  run: |
    npx @claude-flow/dependency-manager install --non-interactive --skip-optional
```

#### Docker Integration
```dockerfile
# Dockerfile example
FROM node:18-slim

# Install system dependencies
RUN apt-get update && apt-get install -y git curl

# Install Claude Flow dependency manager
RUN npm install -g @claude-flow/dependency-manager

# Check dependencies
RUN claude-flow-deps check --non-interactive

# Your application code
COPY . /app
WORKDIR /app
```

## Platform Support

### Windows
- **Package Managers**: Chocolatey, winget, manual installers
- **Terminal**: Windows Terminal, PowerShell, Command Prompt
- **Special Notes**: TMux replaced with Windows Terminal tabs

### macOS
- **Package Managers**: Homebrew, MacPorts, manual installers
- **Terminal**: Terminal.app, iTerm2, tmux
- **Special Notes**: May prompt for Xcode Command Line Tools

### Linux
- **Distributions**: Ubuntu, Debian, CentOS, RHEL, Fedora, Arch
- **Package Managers**: apt, yum, dnf, pacman
- **Terminal**: Any terminal emulator with tmux support

## Configuration

### Configuration File
The dependency manager creates a `.claude-flow-config.json` file to track:
- Last dependency check timestamp
- Installation history
- System configuration
- User preferences

### Environment Variables
```bash
# Force specific Claude Flow version
export CLAUDE_FLOW_VERSION=2.0.0

# Enable debug mode
export CLAUDE_FLOW_DEBUG=true

# Set custom config file location
export CLAUDE_FLOW_CONFIG=/path/to/config.json
```

## API Reference

### ClaudeFlowDependencyManager

Main class for dependency management operations.

```javascript
const manager = new ClaudeFlowDependencyManager(options);
```

#### Options
- `nonInteractive` (boolean) - Disable interactive prompts
- `verbose` (boolean) - Enable detailed output
- `offline` (boolean) - Skip network-dependent operations
- `skipOptional` (boolean) - Skip optional dependencies
- `dryRun` (boolean) - Show actions without executing

#### Methods

##### `ensureDependencies(command)`
Main entry point for dependency management.
- **Parameters**: `command` (string) - Claude Flow command being executed
- **Returns**: Promise<{success: boolean, error?: string}>

##### `checkAllDependencies()`
Check all dependencies without installation.
- **Returns**: Promise<object> - Detailed dependency status

##### `runInstallation(plan)`
Execute installation plan.
- **Parameters**: `plan` (object) - Installation plan
- **Returns**: Promise<object> - Installation results

### DependencyChecker

Handles dependency detection and version checking.

```javascript
const checker = new DependencyChecker(options);
await checker.checkAllDependencies();
```

### CrossPlatformInstaller

Manages cross-platform installation processes.

```javascript
const installer = new CrossPlatformInstaller(options);
await installer.installNodejs('18.16.0');
```

### PostInstallVerifier

Verifies installed dependencies functionality.

```javascript
const verifier = new PostInstallVerifier(options);
await verifier.verifyAllDependencies(dependencies);
```

## Troubleshooting

### Common Issues

#### Permission Errors
```bash
# Linux/macOS: Run with sudo for system installations
sudo claude-flow-deps install

# Windows: Run PowerShell as Administrator
```

#### Network Issues
```bash
# Use offline mode
claude-flow-deps check --offline

# Configure proxy if needed
export HTTP_PROXY=http://proxy.company.com:8080
```

#### Node.js Not Found
```bash
# Check PATH
echo $PATH

# Reinstall Node.js
# Visit: https://nodejs.org/download/
```

#### Git Configuration Missing
```bash
# Configure Git
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Debug Mode
```bash
# Enable debug output
CLAUDE_FLOW_DEBUG=true claude-flow-deps install --verbose
```

### Support Resources
- 📚 **Documentation**: https://docs.claude-flow.dev/dependencies
- 🐛 **Bug Reports**: https://github.com/claude-flow/claude-flow-2.0/issues
- 💬 **Community**: https://discord.gg/claude-flow
- 📧 **Support**: support@claude-flow.dev

## Development

### Running Tests
```bash
# Run full test suite
npm test

# Run specific test categories
node test/dependency-manager-test.js

# Run with verbose output
node test/dependency-manager-test.js --verbose
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

### Project Structure
```
lib/dependency-manager/
├── claude-flow-dependency-manager.js   # Main manager class
├── claude-flow-deps.js                 # CLI interface
├── dependency-checker.js               # Dependency detection
├── installers/
│   └── cross-platform-installer.js     # Installation scripts
├── ui/
│   └── interactive-installer-ui.js     # User interface
├── verification/
│   └── post-install-verifier.js        # Post-install checks
└── test/
    └── dependency-manager-test.js       # Test suite
```

## License

MIT License - see [LICENSE](../../LICENSE) file for details.

## Changelog

### v2.0.0
- Initial release with Claude Flow 2.0
- Cross-platform dependency management
- Interactive installation wizard
- Comprehensive verification system
- Integration with Claude Flow init process

---

**Made with ❤️ by the Claude Flow Team**