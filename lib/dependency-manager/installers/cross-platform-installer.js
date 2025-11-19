#!/usr/bin/env node

/**
 * Cross-Platform Installation Scripts for Claude Flow 2.0 Dependencies
 * 
 * This module provides specialized installation methods for each dependency
 * across Windows, macOS, and Linux platforms with intelligent fallbacks.
 */

const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const chalk = require('chalk');

const execAsync = promisify(exec);

class CrossPlatformInstaller {
  constructor(options = {}) {
    this.platform = process.platform;
    this.arch = process.arch;
    this.verbose = options.verbose || false;
    this.dryRun = options.dryRun || false;
    this.tempDir = path.join(process.cwd(), '.claude-flow-temp');
  }

  /**
   * Install Node.js across platforms
   */
  async installNodejs(version = '18.16.0') {
    console.log(chalk.cyan(`Installing Node.js v${version}...`));
    
    switch (this.platform) {
      case 'win32':
        return await this.installNodejsWindows(version);
      case 'darwin':
        return await this.installNodejsMacOS(version);
      case 'linux':
        return await this.installNodejsLinux(version);
      default:
        throw new Error(`Unsupported platform: ${this.platform}`);
    }
  }

  async installNodejsWindows(version) {
    // Try Chocolatey first
    if (await this.isChocoAvailable()) {
      console.log('  Using Chocolatey...');
      return await this.executeCommand('choco install nodejs --version=' + version + ' -y');
    }
    
    // Try winget
    if (await this.isWingetAvailable()) {
      console.log('  Using winget...');
      return await this.executeCommand('winget install OpenJS.NodeJS');
    }
    
    // Manual download fallback
    console.log('  Downloading installer...');
    const installerUrl = `https://nodejs.org/dist/v${version}/node-v${version}-x64.msi`;
    const installerPath = await this.downloadFile(installerUrl, 'nodejs-installer.msi');
    
    console.log('  Running installer (requires admin permissions)...');
    return await this.executeCommand(`msiexec /i "${installerPath}" /quiet`);
  }

  async installNodejsMacOS(version) {
    // Try Homebrew first
    if (await this.isBrewAvailable()) {
      console.log('  Using Homebrew...');
      return await this.executeCommand('brew install node');
    }
    
    // Try MacPorts
    if (await this.isMacPortsAvailable()) {
      console.log('  Using MacPorts...');
      return await this.executeCommand('sudo port install nodejs18');
    }
    
    // Manual download fallback
    console.log('  Downloading installer...');
    const installerUrl = `https://nodejs.org/dist/v${version}/node-v${version}.pkg`;
    const installerPath = await this.downloadFile(installerUrl, 'nodejs-installer.pkg');
    
    console.log('  Running installer...');
    return await this.executeCommand(`sudo installer -pkg "${installerPath}" -target /`);
  }

  async installNodejsLinux(version) {
    // Try distribution-specific package managers
    const distro = await this.detectLinuxDistribution();
    
    switch (distro) {
      case 'ubuntu':
      case 'debian':
        return await this.installNodejsUbuntu(version);
      case 'centos':
      case 'rhel':
      case 'fedora':
        return await this.installNodejsRedHat(version);
      case 'arch':
        return await this.installNodejsArch();
      default:
        return await this.installNodejsGenericLinux(version);
    }
  }

  async installNodejsUbuntu(version) {
    console.log('  Using apt package manager...');
    
    // Add NodeSource repository
    await this.executeCommand('curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -');
    
    // Install Node.js
    return await this.executeCommand('sudo apt-get install -y nodejs');
  }

  async installNodejsRedHat(version) {
    console.log('  Using dnf/yum package manager...');
    
    // Try dnf first (Fedora)
    try {
      await this.executeCommand('sudo dnf install -y nodejs npm');
      return;
    } catch (error) {
      // Fall back to yum (CentOS/RHEL)
      return await this.executeCommand('sudo yum install -y nodejs npm');
    }
  }

  async installNodejsArch() {
    console.log('  Using pacman package manager...');
    return await this.executeCommand('sudo pacman -S nodejs npm');
  }

  async installNodejsGenericLinux(version) {
    console.log('  Using binary distribution...');
    
    const binaryUrl = `https://nodejs.org/dist/v${version}/node-v${version}-linux-${this.arch}.tar.xz`;
    const binaryPath = await this.downloadFile(binaryUrl, 'nodejs-binary.tar.xz');
    
    // Extract and install
    await this.executeCommand(`tar -xf "${binaryPath}" -C /tmp/`);
    const extractedDir = `/tmp/node-v${version}-linux-${this.arch}`;
    
    // Copy to system directories (requires sudo)
    await this.executeCommand(`sudo cp -r "${extractedDir}"/* /usr/local/`);
    
    return true;
  }

  /**
   * Install Git across platforms
   */
  async installGit() {
    console.log(chalk.cyan('Installing Git...'));
    
    switch (this.platform) {
      case 'win32':
        return await this.installGitWindows();
      case 'darwin':
        return await this.installGitMacOS();
      case 'linux':
        return await this.installGitLinux();
      default:
        throw new Error(`Unsupported platform: ${this.platform}`);
    }
  }

  async installGitWindows() {
    // Try Chocolatey
    if (await this.isChocoAvailable()) {
      console.log('  Using Chocolatey...');
      return await this.executeCommand('choco install git -y');
    }
    
    // Try winget
    if (await this.isWingetAvailable()) {
      console.log('  Using winget...');
      return await this.executeCommand('winget install Git.Git');
    }
    
    // Manual download
    console.log('  Downloading Git installer...');
    const installerUrl = 'https://github.com/git-for-windows/git/releases/latest/download/Git-2.42.0-64-bit.exe';
    const installerPath = await this.downloadFile(installerUrl, 'git-installer.exe');
    
    return await this.executeCommand(`"${installerPath}" /VERYSILENT /NORESTART`);
  }

  async installGitMacOS() {
    // Try Homebrew
    if (await this.isBrewAvailable()) {
      console.log('  Using Homebrew...');
      return await this.executeCommand('brew install git');
    }
    
    // Try Xcode Command Line Tools
    console.log('  Installing Xcode Command Line Tools...');
    return await this.executeCommand('xcode-select --install');
  }

  async installGitLinux() {
    const distro = await this.detectLinuxDistribution();
    
    switch (distro) {
      case 'ubuntu':
      case 'debian':
        console.log('  Using apt...');
        return await this.executeCommand('sudo apt-get update && sudo apt-get install -y git');
      case 'centos':
      case 'rhel':
      case 'fedora':
        console.log('  Using dnf/yum...');
        try {
          return await this.executeCommand('sudo dnf install -y git');
        } catch (error) {
          return await this.executeCommand('sudo yum install -y git');
        }
      case 'arch':
        console.log('  Using pacman...');
        return await this.executeCommand('sudo pacman -S git');
      default:
        throw new Error(`Unsupported Linux distribution: ${distro}`);
    }
  }

  /**
   * Install Claude Code CLI
   */
  async installClaudeCodeCLI() {
    console.log(chalk.cyan('Installing Claude Code CLI...'));
    
    // Check if npm is available
    if (!(await this.isNpmAvailable())) {
      throw new Error('npm is required to install Claude Code CLI. Please install Node.js first.');
    }
    
    // Install globally via npm
    return await this.executeCommand('npm install -g @anthropic/claude-code');
  }

  /**
   * Install Claude Flow 2.0
   */
  async installClaudeFlow() {
    console.log(chalk.cyan('Installing Claude Flow 2.0...'));
    
    if (!(await this.isNpmAvailable())) {
      throw new Error('npm is required to install Claude Flow. Please install Node.js first.');
    }
    
    // Try global installation first
    try {
      return await this.executeCommand('npm install -g claude-flow@2.0.0');
    } catch (error) {
      console.log('  Global installation failed, Claude Flow will be available via npx');
      return true; // npx can handle on-demand execution
    }
  }

  /**
   * Install Agent-OS
   */
  async installAgentOS() {
    console.log(chalk.cyan('Installing Agent-OS...'));
    
    if (!(await this.isNpmAvailable())) {
      throw new Error('npm is required to install Agent-OS. Please install Node.js first.');
    }
    
    return await this.executeCommand('npm install -g @agent-os/cli');
  }

  /**
   * Install TMux
   */
  async installTmux() {
    console.log(chalk.cyan('Installing TMux...'));
    
    switch (this.platform) {
      case 'win32':
        return await this.installTmuxWindows();
      case 'darwin':
        return await this.installTmuxMacOS();
      case 'linux':
        return await this.installTmuxLinux();
      default:
        throw new Error(`Unsupported platform: ${this.platform}`);
    }
  }

  async installTmuxWindows() {
    console.log('  Note: TMux has limited support on Windows');
    console.log('  Consider using Windows Terminal with tabs as an alternative');
    
    // Try Windows Subsystem for Linux
    if (await this.isWSLAvailable()) {
      console.log('  Installing via WSL...');
      return await this.executeCommand('wsl sudo apt-get update && wsl sudo apt-get install -y tmux');
    }
    
    // Try Chocolatey (unofficial package)
    if (await this.isChocoAvailable()) {
      console.log('  Using Chocolatey (unofficial package)...');
      return await this.executeCommand('choco install tmux -y');
    }
    
    throw new Error('TMux installation not available on Windows. Use Windows Terminal as alternative.');
  }

  async installTmuxMacOS() {
    if (await this.isBrewAvailable()) {
      console.log('  Using Homebrew...');
      return await this.executeCommand('brew install tmux');
    }
    
    if (await this.isMacPortsAvailable()) {
      console.log('  Using MacPorts...');
      return await this.executeCommand('sudo port install tmux');
    }
    
    throw new Error('Please install Homebrew or MacPorts to install TMux on macOS');
  }

  async installTmuxLinux() {
    const distro = await this.detectLinuxDistribution();
    
    switch (distro) {
      case 'ubuntu':
      case 'debian':
        return await this.executeCommand('sudo apt-get update && sudo apt-get install -y tmux');
      case 'centos':
      case 'rhel':
      case 'fedora':
        try {
          return await this.executeCommand('sudo dnf install -y tmux');
        } catch (error) {
          return await this.executeCommand('sudo yum install -y tmux');
        }
      case 'arch':
        return await this.executeCommand('sudo pacman -S tmux');
      default:
        throw new Error(`Unsupported Linux distribution: ${distro}`);
    }
  }

  // Utility methods for checking available package managers

  async isChocoAvailable() {
    try {
      await execAsync('choco --version');
      return true;
    } catch (error) {
      return false;
    }
  }

  async isWingetAvailable() {
    try {
      await execAsync('winget --version');
      return true;
    } catch (error) {
      return false;
    }
  }

  async isBrewAvailable() {
    try {
      await execAsync('brew --version');
      return true;
    } catch (error) {
      return false;
    }
  }

  async isMacPortsAvailable() {
    try {
      await execAsync('port version');
      return true;
    } catch (error) {
      return false;
    }
  }

  async isNpmAvailable() {
    try {
      await execAsync('npm --version');
      return true;
    } catch (error) {
      return false;
    }
  }

  async isWSLAvailable() {
    try {
      await execAsync('wsl --list');
      return true;
    } catch (error) {
      return false;
    }
  }

  async detectLinuxDistribution() {
    try {
      const { stdout } = await execAsync('cat /etc/os-release');
      
      if (stdout.includes('Ubuntu') || stdout.includes('ubuntu')) return 'ubuntu';
      if (stdout.includes('Debian') || stdout.includes('debian')) return 'debian';
      if (stdout.includes('CentOS') || stdout.includes('centos')) return 'centos';
      if (stdout.includes('Red Hat') || stdout.includes('rhel')) return 'rhel';
      if (stdout.includes('Fedora') || stdout.includes('fedora')) return 'fedora';
      if (stdout.includes('Arch') || stdout.includes('arch')) return 'arch';
      
      return 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  async downloadFile(url, filename) {
    await fs.mkdir(this.tempDir, { recursive: true });
    const filePath = path.join(this.tempDir, filename);
    
    return new Promise((resolve, reject) => {
      const file = require('fs').createWriteStream(filePath);
      
      https.get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // Handle redirects
          return this.downloadFile(response.headers.location, filename)
            .then(resolve)
            .catch(reject);
        }
        
        if (response.statusCode !== 200) {
          reject(new Error(`Download failed with status ${response.statusCode}`));
          return;
        }
        
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          resolve(filePath);
        });
        
        file.on('error', reject);
      }).on('error', reject);
    });
  }

  async executeCommand(command) {
    if (this.dryRun) {
      console.log(chalk.gray(`  [DRY RUN] ${command}`));
      return true;
    }
    
    if (this.verbose) {
      console.log(chalk.gray(`  Executing: ${command}`));
    }
    
    try {
      const { stdout, stderr } = await execAsync(command, { 
        timeout: 300000, // 5 minutes timeout
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });
      
      if (this.verbose && stdout) {
        console.log(chalk.gray('  Output:', stdout.trim()));
      }
      
      return true;
    } catch (error) {
      if (this.verbose) {
        console.error(chalk.red('  Error:', error.message));
      }
      throw error;
    }
  }

  async cleanup() {
    try {
      await fs.rmdir(this.tempDir, { recursive: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

module.exports = CrossPlatformInstaller;