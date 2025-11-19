/**
 * Cross-Platform Installation System for Claude Flow 2.0
 * Universal installer that works across Windows, macOS, and Linux
 * Handles platform-specific requirements and optimizations
 */

const fs = require('fs').promises;
const path = require('path');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const PlatformDetector = require('./platform-detector');

const execAsync = promisify(exec);

/**
 * Cross-Platform Installation System
 */
class CrossPlatformInstaller {
  constructor(options = {}) {
    this.options = {
      version: '2.0.0',
      registry: 'https://registry.npmjs.org',
      webui: false,
      claude: false,
      agents: 10,
      verbose: false,
      ...options
    };
    
    this.platformDetector = new PlatformDetector();
    this.platform = null;
    this.installationLog = [];
  }

  /**
   * Main installation entry point
   */
  async install() {
    console.log('🚀 Starting Claude Flow 2.0 Cross-Platform Installation...\n');
    
    try {
      await this.initializePlatform();
      await this.checkSystemRequirements();
      await this.installDependencies();
      await this.installClaudeFlow();
      await this.setupConfiguration();
      await this.verifyInstallation();
      await this.generateInstallationReport();
      
      console.log('\n✅ Claude Flow 2.0 installation completed successfully!');
      console.log(`🌐 Platform: ${this.platform.platformDetails.display}`);
      console.log(`⚡ Ready for: ${this.options.agents} agents with Queen Controller`);
      
      if (this.options.webui) {
        console.log('🎨 Web UI will be available after first run');
      }
      
      return { success: true, platform: this.platform.getSummary() };
      
    } catch (error) {
      console.error('\n❌ Installation failed:', error.message);
      await this.handleInstallationFailure(error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Initialize platform detection and configuration
   */
  async initializePlatform() {
    this.log('Initializing platform detection...');
    this.platform = await this.platformDetector.initialize();
    this.log(`Platform detected: ${this.platformDetector.getPlatformDisplay()}`);
  }

  /**
   * Check system requirements
   */
  async checkSystemRequirements() {
    this.log('Checking system requirements...');
    
    const requirements = [
      { name: 'Node.js', version: '>=18.0.0', current: process.version },
      { name: 'npm', version: '>=8.0.0', current: await this.getNpmVersion() },
      { name: 'git', required: true, current: await this.getGitVersion() }
    ];

    // Platform-specific requirements
    if (this.platformDetector.isWindows()) {
      requirements.push(
        { name: 'PowerShell', version: '>=5.0', current: await this.getPowerShellVersion() }
      );
    }

    for (const req of requirements) {
      if (req.required && !req.current) {
        throw new Error(`${req.name} is required but not found`);
      }
      
      if (req.version && req.current) {
        const satisfied = this.compareVersions(req.current, req.version);
        if (!satisfied) {
          console.warn(`⚠️ ${req.name} ${req.current} is below recommended ${req.version}`);
        }
      }
    }

    // Check available memory and disk space
    await this.checkResourceRequirements();
    
    this.log('System requirements check completed');
  }

  /**
   * Install platform-specific dependencies
   */
  async installDependencies() {
    this.log('Installing platform-specific dependencies...');

    const dependencies = this.getPlatformDependencies();
    
    for (const dep of dependencies) {
      try {
        await this.installDependency(dep);
        this.log(`✅ Installed: ${dep.name}`);
      } catch (error) {
        if (dep.required) {
          throw new Error(`Failed to install required dependency ${dep.name}: ${error.message}`);
        } else {
          console.warn(`⚠️ Optional dependency ${dep.name} failed to install: ${error.message}`);
        }
      }
    }
  }

  /**
   * Install Claude Flow 2.0
   */
  async installClaudeFlow() {
    this.log('Installing Claude Flow 2.0...');

    const installCommand = this.buildInstallCommand();
    
    console.log(`📦 Running: ${installCommand}`);
    
    try {
      const { stdout, stderr } = await execAsync(installCommand, {
        timeout: 300000, // 5 minutes
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        env: { ...process.env, NODE_ENV: 'production' }
      });
      
      if (stdout) this.log(`Install output: ${stdout}`);
      if (stderr) this.log(`Install stderr: ${stderr}`);
      
    } catch (error) {
      throw new Error(`Claude Flow installation failed: ${error.message}`);
    }

    this.log('Claude Flow 2.0 installation completed');
  }

  /**
   * Setup platform-specific configuration
   */
  async setupConfiguration() {
    this.log('Setting up configuration...');

    const configDir = this.platform.platformConfig.paths.configDir;
    
    // Ensure config directory exists
    await fs.mkdir(configDir, { recursive: true });

    // Create main configuration
    const config = {
      version: this.options.version,
      platform: this.platform.platformDetails,
      installation: {
        timestamp: new Date().toISOString(),
        options: this.options,
        paths: this.platform.platformConfig.paths
      },
      runtime: {
        maxAgents: this.options.agents,
        webui: this.options.webui,
        claude: this.options.claude
      },
      performance: this.platform.platformConfig.performance
    };

    await fs.writeFile(
      path.join(configDir, 'claude-flow.json'),
      JSON.stringify(config, null, 2)
    );

    // Create platform-specific scripts
    await this.createPlatformScripts();

    // Setup shell integration
    if (this.options.shellIntegration !== false) {
      await this.setupShellIntegration();
    }

    this.log('Configuration setup completed');
  }

  /**
   * Verify installation
   */
  async verifyInstallation() {
    this.log('Verifying installation...');

    const verificationTests = [
      { name: 'Claude Flow CLI', command: 'npx claude-flow@2.0.0 --version' },
      { name: 'Node.js modules', command: 'node -e "console.log(\'Node.js working\')"' },
      { name: 'File permissions', test: () => this.testFilePermissions() },
      { name: 'Network connectivity', test: () => this.testNetworkConnectivity() }
    ];

    for (const test of verificationTests) {
      try {
        if (test.command) {
          const { stdout } = await execAsync(test.command, { timeout: 10000 });
          this.log(`✅ ${test.name}: ${stdout.trim()}`);
        } else if (test.test) {
          await test.test();
          this.log(`✅ ${test.name}: OK`);
        }
      } catch (error) {
        throw new Error(`Verification failed for ${test.name}: ${error.message}`);
      }
    }

    this.log('Installation verification completed');
  }

  /**
   * Generate installation report
   */
  async generateInstallationReport() {
    const report = {
      timestamp: new Date().toISOString(),
      platform: this.platform.getSummary(),
      installation: {
        version: this.options.version,
        options: this.options,
        duration: this.getInstallationDuration(),
        logEntries: this.installationLog.length
      },
      paths: this.platform.platformConfig.paths,
      capabilities: Object.fromEntries(this.platform.capabilities.entries()),
      nextSteps: this.getNextSteps()
    };

    const reportPath = path.join(
      this.platform.platformConfig.paths.configDir,
      'installation-report.json'
    );

    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📋 Installation report saved to: ${reportPath}`);
  }

  /**
   * Handle installation failure
   */
  async handleInstallationFailure(error) {
    const failureReport = {
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack
      },
      platform: this.platform ? this.platform.getSummary() : 'unknown',
      log: this.installationLog,
      troubleshooting: this.getTroubleshootingSteps(error)
    };

    try {
      const reportPath = path.join(
        this.platform?.platformConfig?.paths?.configDir || process.cwd(),
        'installation-failure.json'
      );
      
      await fs.writeFile(reportPath, JSON.stringify(failureReport, null, 2));
      console.log(`❌ Failure report saved to: ${reportPath}`);
    } catch (writeError) {
      console.error('Could not save failure report:', writeError.message);
    }
  }

  // Helper methods

  /**
   * Get platform-specific dependencies
   */
  getPlatformDependencies() {
    const baseDependencies = [
      { name: 'sqlite3', required: false, npm: true },
      { name: 'node-gyp', required: false, npm: true }
    ];

    if (this.platformDetector.isWindows()) {
      return [
        ...baseDependencies,
        { name: 'windows-build-tools', required: false, npm: true, global: true },
        { name: 'node-pre-gyp', required: false, npm: true }
      ];
    } else if (this.platformDetector.isMacOS()) {
      return [
        ...baseDependencies,
        { name: 'xcode-select', required: false, system: true }
      ];
    } else {
      return [
        ...baseDependencies,
        { name: 'build-essential', required: false, system: true },
        { name: 'python3-dev', required: false, system: true }
      ];
    }
  }

  /**
   * Install a single dependency
   */
  async installDependency(dep) {
    if (dep.npm) {
      const command = dep.global 
        ? `npm install -g ${dep.name}`
        : `npm install ${dep.name}`;
      await execAsync(command, { timeout: 120000 });
    } else if (dep.system) {
      // System dependencies require platform-specific package managers
      const packageManager = this.platform.platformDetails.packageManager;
      if (packageManager) {
        const command = this.getSystemInstallCommand(packageManager, dep.name);
        if (command) {
          await execAsync(command, { timeout: 120000 });
        }
      }
    }
  }

  /**
   * Build the main Claude Flow install command
   */
  buildInstallCommand() {
    let command = `npx --yes claude-flow@${this.options.version} init`;
    
    if (this.options.claude) command += ' --claude';
    if (this.options.webui) command += ' --webui';
    if (this.options.agents !== 10) command += ` --agents ${this.options.agents}`;
    
    return command;
  }

  /**
   * Create platform-specific scripts
   */
  async createPlatformScripts() {
    const scriptsDir = path.join(this.platform.platformConfig.paths.configDir, 'scripts');
    await fs.mkdir(scriptsDir, { recursive: true });

    if (this.platformDetector.isWindows()) {
      await this.createWindowsScripts(scriptsDir);
    } else {
      await this.createUnixScripts(scriptsDir);
    }
  }

  /**
   * Create Windows-specific scripts
   */
  async createWindowsScripts(scriptsDir) {
    // PowerShell script
    const psScript = `
# Claude Flow 2.0 - Windows Management Script
param(
    [string]$Action = "status"
)

switch ($Action) {
    "start" { 
        Write-Host "Starting Claude Flow 2.0..."
        npx claude-flow@2.0.0 hive-mind spawn "MASTER-WORKFLOW" --agents ${this.options.agents}
    }
    "stop" { 
        Write-Host "Stopping Claude Flow..."
        Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*claude-flow*" } | Stop-Process
    }
    "status" { 
        Write-Host "Claude Flow 2.0 Status:"
        npx claude-flow@2.0.0 status
    }
    default { 
        Write-Host "Usage: claude-flow.ps1 [start|stop|status]"
    }
}
`;

    await fs.writeFile(path.join(scriptsDir, 'claude-flow.ps1'), psScript);

    // Batch script for CMD compatibility
    const batScript = `
@echo off
set ACTION=%1
if "%ACTION%"=="" set ACTION=status

if "%ACTION%"=="start" (
    echo Starting Claude Flow 2.0...
    npx claude-flow@2.0.0 hive-mind spawn "MASTER-WORKFLOW" --agents ${this.options.agents}
) else if "%ACTION%"=="stop" (
    echo Stopping Claude Flow...
    taskkill /f /im node.exe /fi "WINDOWTITLE eq *claude-flow*"
) else if "%ACTION%"=="status" (
    echo Claude Flow 2.0 Status:
    npx claude-flow@2.0.0 status
) else (
    echo Usage: claude-flow.bat [start^|stop^|status]
)
`;

    await fs.writeFile(path.join(scriptsDir, 'claude-flow.bat'), batScript);
  }

  /**
   * Create Unix-specific scripts
   */
  async createUnixScripts(scriptsDir) {
    const shellScript = `#!/bin/bash
# Claude Flow 2.0 - Unix Management Script

ACTION=\${1:-status}

case "\$ACTION" in
    start)
        echo "Starting Claude Flow 2.0..."
        npx claude-flow@2.0.0 hive-mind spawn "MASTER-WORKFLOW" --agents ${this.options.agents}
        ;;
    stop)
        echo "Stopping Claude Flow..."
        pkill -f "claude-flow" || true
        ;;
    status)
        echo "Claude Flow 2.0 Status:"
        npx claude-flow@2.0.0 status
        ;;
    *)
        echo "Usage: \$0 [start|stop|status]"
        exit 1
        ;;
esac
`;

    await fs.writeFile(path.join(scriptsDir, 'claude-flow.sh'), shellScript);
    
    // Make executable
    await fs.chmod(path.join(scriptsDir, 'claude-flow.sh'), 0o755);
  }

  /**
   * Setup shell integration
   */
  async setupShellIntegration() {
    if (this.platformDetector.isWindows()) {
      // Windows PowerShell profile integration
      await this.setupPowerShellIntegration();
    } else {
      // Unix shell integration
      await this.setupUnixShellIntegration();
    }
  }

  /**
   * Setup PowerShell integration
   */
  async setupPowerShellIntegration() {
    try {
      const profilePath = await this.getPowerShellProfilePath();
      if (profilePath) {
        const integration = `
# Claude Flow 2.0 Integration
function Start-ClaudeFlow { npx claude-flow@2.0.0 hive-mind spawn "MASTER-WORKFLOW" --agents ${this.options.agents} }
function Stop-ClaudeFlow { Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*claude-flow*" } | Stop-Process }
function Get-ClaudeFlowStatus { npx claude-flow@2.0.0 status }

# Aliases
Set-Alias -Name cf-start -Value Start-ClaudeFlow
Set-Alias -Name cf-stop -Value Stop-ClaudeFlow
Set-Alias -Name cf-status -Value Get-ClaudeFlowStatus
`;

        await fs.appendFile(profilePath, integration);
        this.log('PowerShell integration added');
      }
    } catch (error) {
      console.warn('⚠️ Could not setup PowerShell integration:', error.message);
    }
  }

  /**
   * Setup Unix shell integration
   */
  async setupUnixShellIntegration() {
    const shells = ['bash', 'zsh', 'fish'];
    const homeDir = this.platform.platformConfig.paths.homeDir;

    for (const shell of shells) {
      try {
        let rcFile;
        switch (shell) {
          case 'bash':
            rcFile = path.join(homeDir, '.bashrc');
            break;
          case 'zsh':
            rcFile = path.join(homeDir, '.zshrc');
            break;
          case 'fish':
            rcFile = path.join(homeDir, '.config/fish/config.fish');
            break;
        }

        if (rcFile && await this.fileExists(rcFile)) {
          const integration = `
# Claude Flow 2.0 Integration
alias cf-start='npx claude-flow@2.0.0 hive-mind spawn "MASTER-WORKFLOW" --agents ${this.options.agents}'
alias cf-stop='pkill -f claude-flow'
alias cf-status='npx claude-flow@2.0.0 status'
`;

          await fs.appendFile(rcFile, integration);
          this.log(`${shell} integration added`);
        }
      } catch (error) {
        console.warn(`⚠️ Could not setup ${shell} integration:`, error.message);
      }
    }
  }

  // Utility methods

  async getNpmVersion() {
    try {
      const { stdout } = await execAsync('npm --version');
      return stdout.trim();
    } catch (error) {
      return null;
    }
  }

  async getGitVersion() {
    try {
      const { stdout } = await execAsync('git --version');
      return stdout.trim();
    } catch (error) {
      return null;
    }
  }

  async getPowerShellVersion() {
    try {
      const { stdout } = await execAsync('powershell -Command "$PSVersionTable.PSVersion"');
      return stdout.trim();
    } catch (error) {
      return null;
    }
  }

  async getPowerShellProfilePath() {
    try {
      const { stdout } = await execAsync('powershell -Command "$PROFILE"');
      return stdout.trim();
    } catch (error) {
      return null;
    }
  }

  compareVersions(current, required) {
    // Simple semantic version comparison
    const cleanVersion = (v) => v.replace(/^v/, '').replace(/[^\d.]/g, '');
    const currentParts = cleanVersion(current).split('.').map(Number);
    const requiredParts = cleanVersion(required.replace('>=', '')).split('.').map(Number);
    
    for (let i = 0; i < Math.max(currentParts.length, requiredParts.length); i++) {
      const curr = currentParts[i] || 0;
      const req = requiredParts[i] || 0;
      
      if (curr > req) return true;
      if (curr < req) return false;
    }
    
    return true;
  }

  async checkResourceRequirements() {
    const totalMemory = Math.floor(this.platform.platformConfig.performance.totalMemory / 1024 / 1024);
    const freeMemory = Math.floor(this.platform.platformConfig.performance.freeMemory / 1024 / 1024);
    
    if (totalMemory < 2048) {
      console.warn('⚠️ Low total memory detected. Claude Flow may not perform optimally.');
    }
    
    if (freeMemory < 1024) {
      console.warn('⚠️ Low available memory. Consider closing other applications.');
    }

    this.log(`Memory: ${freeMemory}MB free / ${totalMemory}MB total`);
  }

  getSystemInstallCommand(packageManager, packageName) {
    const commands = {
      'apt': `sudo apt-get install -y ${packageName}`,
      'yum': `sudo yum install -y ${packageName}`,
      'dnf': `sudo dnf install -y ${packageName}`,
      'pacman': `sudo pacman -S --noconfirm ${packageName}`,
      'brew': `brew install ${packageName}`,
      'chocolatey': `choco install -y ${packageName}`,
      'winget': `winget install ${packageName}`
    };
    
    return commands[packageManager];
  }

  async testFilePermissions() {
    const testFile = path.join(this.platform.platformConfig.paths.tempDir, 'claude-flow-test');
    await fs.writeFile(testFile, 'test');
    await fs.unlink(testFile);
  }

  async testNetworkConnectivity() {
    const command = this.platformDetector.isWindows() 
      ? 'ping -n 1 registry.npmjs.org'
      : 'ping -c 1 registry.npmjs.org';
    await execAsync(command, { timeout: 5000 });
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  getInstallationDuration() {
    // Calculate from first log entry to now
    if (this.installationLog.length > 0) {
      const startTime = new Date(this.installationLog[0].timestamp);
      const endTime = new Date();
      return Math.floor((endTime - startTime) / 1000); // seconds
    }
    return 0;
  }

  getNextSteps() {
    const steps = [
      'Run "npx claude-flow@2.0.0 --help" to see available commands',
      `Start with "npx claude-flow@2.0.0 hive-mind spawn MASTER-WORKFLOW --agents ${this.options.agents}"`
    ];

    if (this.options.webui) {
      steps.push('Access the Web UI at http://localhost:3003 after starting');
    }

    steps.push('Check the documentation at https://github.com/your-repo/claude-flow');

    return steps;
  }

  getTroubleshootingSteps(error) {
    const steps = [
      'Check system requirements and dependencies',
      'Ensure sufficient disk space and memory',
      'Verify network connectivity',
      'Try running with elevated permissions if needed'
    ];

    if (error.message.includes('EACCES')) {
      steps.push('Permission error detected - try running with sudo/administrator privileges');
    }

    if (error.message.includes('ENOTFOUND')) {
      steps.push('Network error detected - check internet connection and proxy settings');
    }

    if (error.message.includes('node-gyp')) {
      steps.push('Native module compilation error - ensure build tools are installed');
    }

    return steps;
  }

  log(message) {
    const entry = {
      timestamp: new Date().toISOString(),
      message
    };
    
    this.installationLog.push(entry);
    
    if (this.options.verbose) {
      console.log(`[${entry.timestamp}] ${message}`);
    }
  }
}

module.exports = CrossPlatformInstaller;