/**
 * Cross-Platform Compatibility System for Claude Flow 2.0
 * Universal platform detection and adaptation system
 * Supports Windows, macOS, and Linux with native optimizations
 */

const os = require('os');
const path = require('path');
const fs = require('fs');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

/**
 * Comprehensive Platform Detection and Adaptation System
 */
class PlatformDetector {
  constructor() {
    this.platform = process.platform;
    this.arch = process.arch;
    this.osVersion = os.release();
    this.nodeVersion = process.version;
    this.capabilities = new Map();
    this.platformConfig = null;
  }

  /**
   * Initialize platform detection and configuration
   */
  async initialize() {
    console.log('🔍 Initializing Cross-Platform Compatibility System...');
    
    await this.detectPlatform();
    await this.detectCapabilities();
    await this.loadPlatformConfig();
    await this.validateEnvironment();
    
    console.log(`✅ Platform: ${this.getPlatformDisplay()}`);
    console.log(`✅ Architecture: ${this.arch}`);
    console.log(`✅ Capabilities: ${this.capabilities.size} detected`);
    
    return this.platformConfig;
  }

  /**
   * Detect detailed platform information
   */
  async detectPlatform() {
    const platformDetails = {
      name: this.platform,
      type: this.getPlatformType(),
      display: this.getPlatformDisplay(),
      version: this.osVersion,
      arch: this.arch,
      isWindows: this.isWindows(),
      isMacOS: this.isMacOS(),
      isLinux: this.isLinux(),
      isWSL: await this.detectWSL(),
      shell: await this.detectShell(),
      packageManager: await this.detectPackageManager(),
      pythonPath: await this.detectPython(),
      nodePath: process.execPath,
      homedir: os.homedir(),
      tmpdir: os.tmpdir()
    };

    // Detect specific OS variants
    if (this.isWindows()) {
      platformDetails.windowsVersion = await this.detectWindowsVersion();
      platformDetails.powershellVersion = await this.detectPowerShellVersion();
    } else if (this.isLinux()) {
      platformDetails.distro = await this.detectLinuxDistro();
      platformDetails.initSystem = await this.detectInitSystem();
    } else if (this.isMacOS()) {
      platformDetails.macOSVersion = await this.detectMacOSVersion();
      platformDetails.isAppleSilicon = this.arch === 'arm64';
    }

    this.platformDetails = platformDetails;
    return platformDetails;
  }

  /**
   * Detect system capabilities and tools
   */
  async detectCapabilities() {
    const capabilities = [
      { name: 'git', command: 'git --version', required: true },
      { name: 'node', command: 'node --version', required: true },
      { name: 'npm', command: 'npm --version', required: true },
      { name: 'docker', command: 'docker --version', required: false },
      { name: 'python', command: 'python --version', required: false },
      { name: 'python3', command: 'python3 --version', required: false },
      { name: 'curl', command: 'curl --version', required: false },
      { name: 'wget', command: 'wget --version', required: false },
      { name: 'tmux', command: 'tmux -V', required: false }
    ];

    // Platform-specific tools
    if (this.isWindows()) {
      capabilities.push(
        { name: 'powershell', command: 'powershell -Command "$PSVersionTable.PSVersion"', required: true },
        { name: 'cmd', command: 'cmd /c ver', required: true },
        { name: 'wsl', command: 'wsl --version', required: false }
      );
    } else {
      capabilities.push(
        { name: 'bash', command: 'bash --version', required: false },
        { name: 'zsh', command: 'zsh --version', required: false },
        { name: 'fish', command: 'fish --version', required: false }
      );
    }

    for (const capability of capabilities) {
      try {
        const { stdout, stderr } = await execAsync(capability.command, { 
          timeout: 5000,
          windowsHide: true 
        });
        this.capabilities.set(capability.name, {
          available: true,
          version: (stdout || stderr).trim().split('\n')[0],
          required: capability.required
        });
      } catch (error) {
        this.capabilities.set(capability.name, {
          available: false,
          error: error.message,
          required: capability.required
        });
        
        if (capability.required) {
          console.warn(`⚠️ Required tool missing: ${capability.name}`);
        }
      }
    }
  }

  /**
   * Load platform-specific configuration
   */
  async loadPlatformConfig() {
    this.platformConfig = {
      // Path configuration
      paths: {
        separator: path.sep,
        delimiter: path.delimiter,
        configDir: this.getConfigDir(),
        dataDir: this.getDataDir(),
        tempDir: os.tmpdir(),
        homeDir: os.homedir()
      },

      // Command configuration
      commands: {
        shell: this.getDefaultShell(),
        packageManager: this.getPackageManager(),
        processManager: this.getProcessManager(),
        serviceManager: this.getServiceManager()
      },

      // File system configuration
      filesystem: {
        caseSensitive: !this.isWindows(),
        maxPathLength: this.isWindows() ? 260 : 4096,
        supportedEncodings: ['utf8', 'ascii'],
        lineEndings: this.isWindows() ? 'crlf' : 'lf'
      },

      // Network configuration
      network: {
        defaultPorts: this.getDefaultPorts(),
        firewallRules: this.getFirewallConfig(),
        dnsServers: await this.getDNSServers()
      },

      // Process configuration
      processes: {
        maxFileDescriptors: await this.getMaxFileDescriptors(),
        defaultTimeout: 30000,
        processSpawnOptions: this.getProcessSpawnOptions()
      },

      // Security configuration
      security: {
        requiresElevation: this.requiresElevation(),
        supportsSandboxing: this.supportsSandboxing(),
        defaultPermissions: this.getDefaultPermissions()
      },

      // Performance configuration
      performance: {
        cpuCount: os.cpus().length,
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        optimizations: this.getPerformanceOptimizations()
      }
    };

    return this.platformConfig;
  }

  /**
   * Validate environment and dependencies
   */
  async validateEnvironment() {
    const validationResults = {
      platform: true,
      requirements: true,
      permissions: true,
      network: true,
      issues: []
    };

    // Check required capabilities
    for (const [name, capability] of this.capabilities.entries()) {
      if (capability.required && !capability.available) {
        validationResults.requirements = false;
        validationResults.issues.push(`Missing required tool: ${name}`);
      }
    }

    // Check permissions
    try {
      const testFile = path.join(os.tmpdir(), 'claude-flow-permission-test');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
    } catch (error) {
      validationResults.permissions = false;
      validationResults.issues.push(`File system permissions issue: ${error.message}`);
    }

    // Check network connectivity (basic)
    try {
      await execAsync(this.isWindows() ? 'ping -n 1 8.8.8.8' : 'ping -c 1 8.8.8.8', { timeout: 5000 });
    } catch (error) {
      validationResults.network = false;
      validationResults.issues.push('Network connectivity issues detected');
    }

    this.validationResults = validationResults;
    
    if (validationResults.issues.length > 0) {
      console.warn('⚠️ Environment validation issues:');
      validationResults.issues.forEach(issue => console.warn(`   - ${issue}`));
    }

    return validationResults;
  }

  // Platform detection helpers
  isWindows() { return this.platform === 'win32'; }
  isMacOS() { return this.platform === 'darwin'; }
  isLinux() { return this.platform === 'linux'; }

  getPlatformType() {
    if (this.isWindows()) return 'windows';
    if (this.isMacOS()) return 'macos';
    if (this.isLinux()) return 'linux';
    return 'unknown';
  }

  getPlatformDisplay() {
    const displays = {
      'win32': 'Windows',
      'darwin': 'macOS',
      'linux': 'Linux'
    };
    return displays[this.platform] || this.platform;
  }

  /**
   * Detect Windows Subsystem for Linux (WSL)
   */
  async detectWSL() {
    if (!this.isLinux()) return false;
    
    try {
      const { stdout } = await execAsync('uname -r');
      return stdout.toLowerCase().includes('microsoft') || stdout.toLowerCase().includes('wsl');
    } catch (error) {
      return false;
    }
  }

  /**
   * Detect default shell
   */
  async detectShell() {
    if (this.isWindows()) {
      // Check for PowerShell Core, then Windows PowerShell, then cmd
      const shells = ['pwsh', 'powershell', 'cmd'];
      for (const shell of shells) {
        try {
          await execAsync(`${shell} -Command "echo test"`, { timeout: 2000 });
          return shell;
        } catch (error) {
          continue;
        }
      }
      return 'cmd';
    } else {
      // Unix-like systems
      return process.env.SHELL || '/bin/sh';
    }
  }

  /**
   * Detect package manager
   */
  async detectPackageManager() {
    const managers = this.isWindows() 
      ? ['chocolatey', 'winget', 'scoop']
      : this.isMacOS()
        ? ['brew', 'macports']
        : ['apt', 'yum', 'dnf', 'pacman', 'zypper', 'apk'];

    for (const manager of managers) {
      try {
        const command = manager === 'chocolatey' ? 'choco --version' : `${manager} --version`;
        await execAsync(command, { timeout: 2000 });
        return manager;
      } catch (error) {
        continue;
      }
    }
    
    return null;
  }

  /**
   * Detect Python installation
   */
  async detectPython() {
    const pythonCommands = ['python3', 'python', 'py'];
    
    for (const cmd of pythonCommands) {
      try {
        const { stdout } = await execAsync(`${cmd} -c "import sys; print(sys.executable)"`, { timeout: 2000 });
        return stdout.trim();
      } catch (error) {
        continue;
      }
    }
    
    return null;
  }

  /**
   * Get configuration directory
   */
  getConfigDir() {
    if (this.isWindows()) {
      return path.join(process.env.APPDATA, 'claude-flow');
    } else if (this.isMacOS()) {
      return path.join(os.homedir(), 'Library', 'Application Support', 'claude-flow');
    } else {
      return path.join(os.homedir(), '.config', 'claude-flow');
    }
  }

  /**
   * Get data directory
   */
  getDataDir() {
    if (this.isWindows()) {
      return path.join(process.env.LOCALAPPDATA, 'claude-flow');
    } else if (this.isMacOS()) {
      return path.join(os.homedir(), 'Library', 'Application Support', 'claude-flow');
    } else {
      return path.join(os.homedir(), '.local', 'share', 'claude-flow');
    }
  }

  /**
   * Get default shell command
   */
  getDefaultShell() {
    if (this.isWindows()) {
      return this.capabilities.get('powershell')?.available ? 'powershell' : 'cmd';
    } else {
      return process.env.SHELL || '/bin/bash';
    }
  }

  /**
   * Get package manager command
   */
  getPackageManager() {
    return this.platformDetails?.packageManager || 'npm';
  }

  /**
   * Get process manager
   */
  getProcessManager() {
    if (this.isWindows()) {
      return 'tasklist';
    } else {
      return this.capabilities.get('tmux')?.available ? 'tmux' : 'screen';
    }
  }

  /**
   * Get service manager
   */
  getServiceManager() {
    if (this.isWindows()) {
      return 'sc';
    } else if (this.isMacOS()) {
      return 'launchctl';
    } else {
      return 'systemctl'; // Most modern Linux distros use systemd
    }
  }

  /**
   * Get default ports configuration
   */
  getDefaultPorts() {
    return {
      http: 3000,
      https: 3443,
      websocket: 3001,
      mcp: 3002,
      webui: 3003
    };
  }

  /**
   * Get firewall configuration
   */
  getFirewallConfig() {
    if (this.isWindows()) {
      return {
        tool: 'netsh',
        commands: {
          allow: 'netsh advfirewall firewall add rule name="Claude Flow" dir=in action=allow protocol=TCP localport='
        }
      };
    } else if (this.isMacOS()) {
      return {
        tool: 'pfctl',
        commands: {
          allow: 'sudo pfctl -e'
        }
      };
    } else {
      return {
        tool: 'ufw',
        commands: {
          allow: 'sudo ufw allow'
        }
      };
    }
  }

  /**
   * Get DNS servers
   */
  async getDNSServers() {
    try {
      if (this.isWindows()) {
        const { stdout } = await execAsync('nslookup 127.0.0.1', { timeout: 2000 });
        return ['8.8.8.8', '8.8.4.4']; // Fallback
      } else {
        const { stdout } = await execAsync('cat /etc/resolv.conf', { timeout: 2000 });
        const matches = stdout.match(/nameserver\s+(\d+\.\d+\.\d+\.\d+)/g);
        return matches ? matches.map(m => m.split(' ')[1]) : ['8.8.8.8', '8.8.4.4'];
      }
    } catch (error) {
      return ['8.8.8.8', '8.8.4.4'];
    }
  }

  /**
   * Get maximum file descriptors
   */
  async getMaxFileDescriptors() {
    try {
      if (this.isWindows()) {
        return 2048; // Windows default
      } else {
        const { stdout } = await execAsync('ulimit -n', { timeout: 1000 });
        return parseInt(stdout.trim()) || 1024;
      }
    } catch (error) {
      return 1024;
    }
  }

  /**
   * Get process spawn options
   */
  getProcessSpawnOptions() {
    return {
      windowsVerbatimArguments: this.isWindows(),
      windowsHide: this.isWindows(),
      shell: this.isWindows(),
      env: { ...process.env }
    };
  }

  /**
   * Check if platform requires elevation for certain operations
   */
  requiresElevation() {
    return this.isWindows(); // Windows typically requires elevation for system operations
  }

  /**
   * Check if platform supports sandboxing
   */
  supportsSandboxing() {
    return !this.isWindows(); // Unix-like systems have better sandboxing support
  }

  /**
   * Get default permissions
   */
  getDefaultPermissions() {
    if (this.isWindows()) {
      return {
        file: '644',
        directory: '755',
        executable: '755'
      };
    } else {
      return {
        file: 0o644,
        directory: 0o755,
        executable: 0o755
      };
    }
  }

  /**
   * Get performance optimizations
   */
  getPerformanceOptimizations() {
    const cpuCount = os.cpus().length;
    const totalMemory = os.totalmem();
    
    return {
      maxWorkers: Math.min(cpuCount, 8),
      memoryLimit: Math.floor(totalMemory * 0.8), // Use 80% of available memory
      gcFrequency: totalMemory < 4 * 1024 * 1024 * 1024 ? 'high' : 'low', // More frequent GC on low memory
      cacheSize: Math.floor(totalMemory / (1024 * 1024 * 10)), // Cache size in MB
      concurrency: Math.min(cpuCount * 2, 16)
    };
  }

  // Additional detection methods for specific platforms
  
  async detectWindowsVersion() {
    try {
      const { stdout } = await execAsync('wmic os get Caption,Version /value', { timeout: 2000 });
      const lines = stdout.split('\n').filter(line => line.includes('='));
      const version = {};
      lines.forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) version[key.trim()] = value.trim();
      });
      return version;
    } catch (error) {
      return { Caption: 'Windows', Version: 'Unknown' };
    }
  }

  async detectPowerShellVersion() {
    try {
      const { stdout } = await execAsync('powershell -Command "$PSVersionTable.PSVersion"', { timeout: 2000 });
      return stdout.trim();
    } catch (error) {
      return 'Unknown';
    }
  }

  async detectLinuxDistro() {
    try {
      const { stdout } = await execAsync('lsb_release -a 2>/dev/null || cat /etc/os-release', { timeout: 2000 });
      return stdout;
    } catch (error) {
      return 'Unknown Linux';
    }
  }

  async detectInitSystem() {
    try {
      const { stdout } = await execAsync('ps -p 1 -o comm=', { timeout: 1000 });
      return stdout.trim();
    } catch (error) {
      return 'unknown';
    }
  }

  async detectMacOSVersion() {
    try {
      const { stdout } = await execAsync('sw_vers', { timeout: 2000 });
      return stdout;
    } catch (error) {
      return 'Unknown macOS';
    }
  }

  /**
   * Get platform summary for logging/debugging
   */
  getSummary() {
    return {
      platform: this.getPlatformDisplay(),
      arch: this.arch,
      version: this.osVersion,
      node: this.nodeVersion,
      capabilities: Object.fromEntries(
        Array.from(this.capabilities.entries()).map(([k, v]) => [k, v.available])
      ),
      config: this.platformConfig ? 'loaded' : 'not loaded',
      validation: this.validationResults ? 'completed' : 'pending'
    };
  }
}

module.exports = PlatformDetector;