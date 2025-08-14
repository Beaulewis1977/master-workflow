/**
 * Cross-Platform Shell Integration for Claude Flow 2.0
 * Universal shell integration supporting cmd, PowerShell, bash, zsh, fish
 * Provides seamless CLI experience across Windows, macOS, and Linux
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const { promisify } = require('util');
const PlatformDetector = require('./platform-detector');
const pathHandler = require('./path-handler').default;

const execAsync = promisify(exec);

/**
 * Cross-Platform Shell Integration Manager
 */
class ShellIntegrationManager {
  constructor(options = {}) {
    this.options = {
      enableAliases: options.enableAliases !== false,
      enableCompletion: options.enableCompletion !== false,
      enablePromptIntegration: options.enablePromptIntegration || false,
      enableHistory: options.enableHistory || false,
      customAliases: options.customAliases || {},
      installPath: options.installPath || null,
      ...options
    };

    this.platformDetector = new PlatformDetector();
    this.platform = null;
    this.supportedShells = new Map();
    this.installedIntegrations = new Set();
  }

  /**
   * Initialize shell integration system
   */
  async initialize() {
    console.log('🐚 Initializing Cross-Platform Shell Integration...');
    
    this.platform = await this.platformDetector.initialize();
    await this.detectAvailableShells();
    await this.setupShellConfigurations();
    
    console.log(`✅ Shell Integration initialized for ${this.platformDetector.getPlatformDisplay()}`);
    console.log(`🔍 Detected shells: ${Array.from(this.supportedShells.keys()).join(', ')}`);
  }

  /**
   * Install shell integration for all detected shells
   */
  async installIntegrations() {
    console.log('📦 Installing shell integrations...');
    
    const results = [];
    
    for (const [shellName, shellInfo] of this.supportedShells) {
      if (shellInfo.available) {
        try {
          const result = await this.installShellIntegration(shellName, shellInfo);
          results.push({ shell: shellName, success: true, ...result });
          this.installedIntegrations.add(shellName);
          console.log(`✅ ${shellName} integration installed`);
        } catch (error) {
          results.push({ shell: shellName, success: false, error: error.message });
          console.error(`❌ Failed to install ${shellName} integration:`, error.message);
        }
      }
    }
    
    console.log(`📦 Installation complete: ${this.installedIntegrations.size}/${this.supportedShells.size} shells integrated`);
    
    return results;
  }

  /**
   * Uninstall shell integration for all shells
   */
  async uninstallIntegrations() {
    console.log('🗑️ Uninstalling shell integrations...');
    
    const results = [];
    
    for (const shellName of this.installedIntegrations) {
      try {
        await this.uninstallShellIntegration(shellName);
        results.push({ shell: shellName, success: true });
        console.log(`✅ ${shellName} integration removed`);
      } catch (error) {
        results.push({ shell: shellName, success: false, error: error.message });
        console.error(`❌ Failed to remove ${shellName} integration:`, error.message);
      }
    }
    
    this.installedIntegrations.clear();
    console.log('🗑️ Shell integrations uninstalled');
    
    return results;
  }

  /**
   * Get shell integration status
   */
  getStatus() {
    return {
      platform: this.platformDetector.getPlatformDisplay(),
      detectedShells: Array.from(this.supportedShells.entries()).map(([name, info]) => ({
        name,
        available: info.available,
        version: info.version,
        path: info.path
      })),
      installedIntegrations: Array.from(this.installedIntegrations),
      options: this.options
    };
  }

  /**
   * Generate shell completion script for a specific shell
   * @param {string} shellName - Shell name
   * @returns {string} Completion script
   */
  generateCompletionScript(shellName) {
    switch (shellName) {
      case 'bash':
        return this.generateBashCompletion();
      case 'zsh':
        return this.generateZshCompletion();
      case 'fish':
        return this.generateFishCompletion();
      case 'powershell':
        return this.generatePowerShellCompletion();
      case 'cmd':
        return null; // CMD doesn't support advanced completion
      default:
        return null;
    }
  }

  // Private methods

  /**
   * Detect available shells on the system
   * @private
   */
  async detectAvailableShells() {
    const shellTests = [
      { name: 'bash', command: 'bash --version' },
      { name: 'zsh', command: 'zsh --version' },
      { name: 'fish', command: 'fish --version' },
      { name: 'powershell', command: 'powershell -Command "$PSVersionTable.PSVersion"' },
      { name: 'pwsh', command: 'pwsh -Command "$PSVersionTable.PSVersion"' },
      { name: 'cmd', command: 'cmd /c ver', windows: true }
    ];

    for (const shellTest of shellTests) {
      // Skip Windows-only shells on non-Windows platforms
      if (shellTest.windows && !this.platformDetector.isWindows()) {
        continue;
      }

      try {
        const { stdout, stderr } = await execAsync(shellTest.command, { timeout: 5000 });
        const output = (stdout || stderr).trim();
        const version = this.extractVersion(output);
        const shellPath = await this.findShellPath(shellTest.name);

        this.supportedShells.set(shellTest.name, {
          available: true,
          version,
          path: shellPath,
          output
        });
      } catch (error) {
        this.supportedShells.set(shellTest.name, {
          available: false,
          error: error.message
        });
      }
    }
  }

  /**
   * Setup shell-specific configurations
   * @private
   */
  async setupShellConfigurations() {
    this.shellConfigs = {
      bash: {
        configFiles: ['.bashrc', '.bash_profile'],
        aliasFormat: 'alias {alias}="{command}"',
        completionDir: '/etc/bash_completion.d/',
        userCompletionDir: '~/.bash_completion.d/',
        sourceCompletion: 'source ~/.bash_completion.d/claude-flow'
      },
      
      zsh: {
        configFiles: ['.zshrc'],
        aliasFormat: 'alias {alias}="{command}"',
        completionDir: '/usr/share/zsh/site-functions/',
        userCompletionDir: '~/.zsh/completions/',
        sourceCompletion: 'fpath=(~/.zsh/completions $fpath)'
      },
      
      fish: {
        configFiles: ['config.fish'],
        configPath: '~/.config/fish/',
        aliasFormat: 'alias {alias} "{command}"',
        completionDir: '~/.config/fish/completions/',
        functionDir: '~/.config/fish/functions/'
      },
      
      powershell: {
        configFiles: ['Microsoft.PowerShell_profile.ps1'],
        profilePath: await this.getPowerShellProfilePath(),
        aliasFormat: 'Set-Alias -Name {alias} -Value {command}',
        functionFormat: 'function {alias} {{ {command} @args }}'
      },
      
      cmd: {
        configFiles: [],
        batchDir: this.platformDetector.isWindows() ? 
          path.join(process.env.USERPROFILE, 'claude-flow-cmd') : null,
        aliasFormat: '@echo off\n{command} %*'
      }
    };
  }

  /**
   * Install shell integration for a specific shell
   * @private
   */
  async installShellIntegration(shellName, shellInfo) {
    const config = this.shellConfigs[shellName];
    if (!config) {
      throw new Error(`No configuration found for shell: ${shellName}`);
    }

    const integrationFiles = [];

    // Install aliases
    if (this.options.enableAliases) {
      const aliasFile = await this.installAliases(shellName, config);
      if (aliasFile) integrationFiles.push(aliasFile);
    }

    // Install completion
    if (this.options.enableCompletion) {
      const completionFile = await this.installCompletion(shellName, config);
      if (completionFile) integrationFiles.push(completionFile);
    }

    // Add integration to shell configuration
    await this.updateShellConfiguration(shellName, config);

    return {
      integrationFiles,
      configurationUpdated: true
    };
  }

  /**
   * Install aliases for a shell
   * @private
   */
  async installAliases(shellName, config) {
    const aliases = this.generateAliases();
    
    if (shellName === 'cmd') {
      return await this.installCmdAliases(aliases);
    } else if (shellName === 'powershell' || shellName === 'pwsh') {
      return await this.installPowerShellAliases(aliases, config);
    } else {
      return await this.installUnixAliases(shellName, aliases, config);
    }
  }

  /**
   * Install completion for a shell
   * @private
   */
  async installCompletion(shellName, config) {
    const completionScript = this.generateCompletionScript(shellName);
    if (!completionScript) return null;

    const completionFile = await this.getCompletionFilePath(shellName, config);
    await fs.writeFile(completionFile, completionScript);
    
    console.log(`📝 Completion installed: ${completionFile}`);
    return completionFile;
  }

  /**
   * Generate common aliases
   * @private
   */
  generateAliases() {
    const baseAliases = {
      'cf': 'npx claude-flow@2.0.0',
      'cf-start': 'npx claude-flow@2.0.0 hive-mind spawn "MASTER-WORKFLOW"',
      'cf-status': 'npx claude-flow@2.0.0 status',
      'cf-stop': 'npx claude-flow@2.0.0 stop',
      'cf-agents': 'npx claude-flow@2.0.0 agents list',
      'cf-logs': 'npx claude-flow@2.0.0 logs',
      'cf-help': 'npx claude-flow@2.0.0 --help'
    };

    return { ...baseAliases, ...this.options.customAliases };
  }

  /**
   * Install CMD aliases (batch files)
   * @private
   */
  async installCmdAliases(aliases) {
    const batchDir = this.shellConfigs.cmd.batchDir;
    if (!batchDir) return null;

    await fs.mkdir(batchDir, { recursive: true });
    const batchFiles = [];

    for (const [alias, command] of Object.entries(aliases)) {
      const batchContent = `@echo off\n${command} %*\n`;
      const batchFile = path.join(batchDir, `${alias}.bat`);
      await fs.writeFile(batchFile, batchContent);
      batchFiles.push(batchFile);
    }

    // Add batch directory to PATH
    await this.addToWindowsPath(batchDir);

    console.log(`📝 CMD aliases installed: ${batchFiles.length} batch files`);
    return batchFiles;
  }

  /**
   * Install PowerShell aliases
   * @private
   */
  async installPowerShellAliases(aliases, config) {
    if (!config.profilePath) {
      console.warn('PowerShell profile path not found');
      return null;
    }

    const profileDir = path.dirname(config.profilePath);
    await fs.mkdir(profileDir, { recursive: true });

    const aliasScript = this.generatePowerShellAliasScript(aliases);
    const aliasFile = path.join(profileDir, 'claude-flow-aliases.ps1');
    
    await fs.writeFile(aliasFile, aliasScript);
    console.log(`📝 PowerShell aliases installed: ${aliasFile}`);
    
    return aliasFile;
  }

  /**
   * Install Unix shell aliases
   * @private
   */
  async installUnixAliases(shellName, aliases, config) {
    const aliasScript = Object.entries(aliases)
      .map(([alias, command]) => config.aliasFormat
        .replace('{alias}', alias)
        .replace('{command}', command))
      .join('\n');

    const aliasFile = pathHandler.join(
      pathHandler.homedir(), 
      `.claude-flow-${shellName}-aliases`
    );

    const fullScript = `# Claude Flow 2.0 Shell Aliases\n# Generated on ${new Date().toISOString()}\n\n${aliasScript}\n`;
    await fs.writeFile(aliasFile, fullScript);
    
    console.log(`📝 ${shellName} aliases installed: ${aliasFile}`);
    return aliasFile;
  }

  /**
   * Update shell configuration to source aliases and completions
   * @private
   */
  async updateShellConfiguration(shellName, config) {
    if (shellName === 'cmd') {
      // CMD doesn't have a configuration file to update
      return;
    }

    const configFile = await this.getShellConfigFile(shellName, config);
    if (!configFile) return;

    const integrationLine = this.generateIntegrationLine(shellName, config);
    const marker = '# Claude Flow 2.0 Integration';
    
    try {
      let configContent = '';
      
      try {
        configContent = await fs.readFile(configFile, 'utf8');
      } catch (error) {
        // File doesn't exist, create it
        configContent = '';
      }

      // Check if integration is already present
      if (configContent.includes(marker)) {
        console.log(`⚠️ Integration already exists in ${configFile}`);
        return;
      }

      // Add integration
      const integration = `\n${marker}\n${integrationLine}\n${marker} End\n`;
      const updatedContent = configContent + integration;
      
      await fs.writeFile(configFile, updatedContent);
      console.log(`📝 Updated shell configuration: ${configFile}`);
      
    } catch (error) {
      console.warn(`Failed to update ${configFile}:`, error.message);
    }
  }

  /**
   * Get shell configuration file path
   * @private
   */
  async getShellConfigFile(shellName, config) {
    if (!config.configFiles) return null;

    const homeDir = pathHandler.homedir();
    
    for (const configFile of config.configFiles) {
      const fullPath = shellName === 'fish' && config.configPath
        ? pathHandler.join(pathHandler.expandTilde(config.configPath), configFile)
        : pathHandler.join(homeDir, configFile);
      
      // Use the first existing config file, or create the first one
      try {
        await fs.access(fullPath);
        return fullPath;
      } catch (error) {
        // File doesn't exist, continue to next or use this path
      }
    }

    // Return the first config file path for creation
    const firstConfig = config.configFiles[0];
    return shellName === 'fish' && config.configPath
      ? pathHandler.join(pathHandler.expandTilde(config.configPath), firstConfig)
      : pathHandler.join(homeDir, firstConfig);
  }

  /**
   * Generate integration line for shell config
   * @private
   */
  generateIntegrationLine(shellName, config) {
    const aliasFile = pathHandler.join(pathHandler.homedir(), `.claude-flow-${shellName}-aliases`);
    
    const lines = [];
    
    // Source aliases
    if (shellName === 'fish') {
      lines.push(`source ${aliasFile}`);
    } else {
      lines.push(`[[ -f "${aliasFile}" ]] && source "${aliasFile}"`);
    }
    
    // Add completion sourcing
    if (this.options.enableCompletion && config.sourceCompletion) {
      lines.push(config.sourceCompletion);
    }
    
    return lines.join('\n');
  }

  /**
   * Generate PowerShell alias script
   * @private
   */
  generatePowerShellAliasScript(aliases) {
    const functions = Object.entries(aliases)
      .map(([alias, command]) => {
        return `function ${alias} { ${command} @args }`;
      })
      .join('\n');

    return `# Claude Flow 2.0 PowerShell Aliases
# Generated on ${new Date().toISOString()}

${functions}

Write-Host "Claude Flow 2.0 aliases loaded" -ForegroundColor Green
`;
  }

  /**
   * Generate bash completion script
   * @private
   */
  generateBashCompletion() {
    return `# Claude Flow 2.0 Bash Completion
# Generated on ${new Date().toISOString()}

_claude_flow_completions() {
    local cur prev words cword
    _init_completion || return
    
    case $prev in
        hive-mind|sparc|swarm)
            COMPREPLY=( $(compgen -W "spawn stop status" -- "$cur") )
            return
            ;;
        spawn)
            COMPREPLY=( $(compgen -W "MASTER-WORKFLOW" -- "$cur") )
            return
            ;;
        --agents)
            COMPREPLY=( $(compgen -W "10 50 100 500 1000 4462" -- "$cur") )
            return
            ;;
    esac
    
    if [[ $cur == -* ]]; then
        COMPREPLY=( $(compgen -W "--help --version --agents --webui --claude --verbose" -- "$cur") )
        return
    fi
    
    COMPREPLY=( $(compgen -W "init hive-mind sparc swarm status stop agents logs help" -- "$cur") )
}

complete -F _claude_flow_completions npx
complete -F _claude_flow_completions claude-flow
complete -F _claude_flow_completions cf
`;
  }

  /**
   * Generate zsh completion script
   * @private
   */
  generateZshCompletion() {
    return `#compdef claude-flow cf npx
# Claude Flow 2.0 Zsh Completion
# Generated on ${new Date().toISOString()}

_claude_flow() {
    local context state line
    typeset -A opt_args
    
    _arguments \
        '--help[Show help]' \
        '--version[Show version]' \
        '--agents[Number of agents]:agents:(10 50 100 500 1000 4462)' \
        '--webui[Enable Web UI]' \
        '--claude[Enable Claude integration]' \
        '--verbose[Verbose output]' \
        '*::arg:->args'
    
    case $state in
        args)
            case $words[1] in
                hive-mind|sparc|swarm)
                    _arguments \
                        '1:command:(spawn stop status)' \
                        '2:workflow:(MASTER-WORKFLOW)'
                    ;;
                *)
                    _values 'commands' \
                        'init[Initialize Claude Flow]' \
                        'hive-mind[Multi-agent coordination]' \
                        'sparc[SPARC methodology]' \
                        'swarm[Agent swarm]' \
                        'status[Show status]' \
                        'stop[Stop agents]' \
                        'agents[Agent management]' \
                        'logs[View logs]' \
                        'help[Show help]'
                    ;;
            esac
            ;;
    esac
}

_claude_flow "$@"
`;
  }

  /**
   * Generate fish completion script
   * @private
   */
  generateFishCompletion() {
    return `# Claude Flow 2.0 Fish Completion
# Generated on ${new Date().toISOString()}

# Main commands
complete -c claude-flow -n '__fish_use_subcommand' -a 'init' -d 'Initialize Claude Flow'
complete -c claude-flow -n '__fish_use_subcommand' -a 'hive-mind' -d 'Multi-agent coordination'
complete -c claude-flow -n '__fish_use_subcommand' -a 'sparc' -d 'SPARC methodology'
complete -c claude-flow -n '__fish_use_subcommand' -a 'swarm' -d 'Agent swarm'
complete -c claude-flow -n '__fish_use_subcommand' -a 'status' -d 'Show status'
complete -c claude-flow -n '__fish_use_subcommand' -a 'stop' -d 'Stop agents'
complete -c claude-flow -n '__fish_use_subcommand' -a 'agents' -d 'Agent management'
complete -c claude-flow -n '__fish_use_subcommand' -a 'logs' -d 'View logs'
complete -c claude-flow -n '__fish_use_subcommand' -a 'help' -d 'Show help'

# Options
complete -c claude-flow -l help -d 'Show help'
complete -c claude-flow -l version -d 'Show version'
complete -c claude-flow -l agents -d 'Number of agents' -a '10 50 100 500 1000 4462'
complete -c claude-flow -l webui -d 'Enable Web UI'
complete -c claude-flow -l claude -d 'Enable Claude integration'
complete -c claude-flow -l verbose -d 'Verbose output'

# Subcommand completions
complete -c claude-flow -n '__fish_seen_subcommand_from hive-mind sparc swarm' -a 'spawn stop status'
complete -c claude-flow -n '__fish_seen_subcommand_from spawn' -a 'MASTER-WORKFLOW'

# Copy completions for aliases
complete -c cf -w claude-flow
complete -c npx -n '__fish_seen_subcommand_from claude-flow' -w claude-flow
`;
  }

  /**
   * Generate PowerShell completion script
   * @private
   */
  generatePowerShellCompletion() {
    return `# Claude Flow 2.0 PowerShell Completion
# Generated on ${new Date().toISOString()}

Register-ArgumentCompleter -CommandName 'claude-flow', 'cf', 'npx' -ScriptBlock {
    param($commandName, $wordToComplete, $commandAst, $fakeBoundParameter)
    
    $commands = @(
        'init', 'hive-mind', 'sparc', 'swarm', 'status', 'stop', 'agents', 'logs', 'help'
    )
    
    $options = @(
        '--help', '--version', '--agents', '--webui', '--claude', '--verbose'
    )
    
    if ($wordToComplete.StartsWith('--')) {
        $options | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
            [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
        }
    }
    elseif ($commandAst.CommandElements.Count -eq 1) {
        $commands | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
            [System.Management.Automation.CompletionResult]::new($_, $_, 'Command', $_)
        }
    }
}

Write-Host "Claude Flow 2.0 PowerShell completion loaded" -ForegroundColor Green
`;
  }

  // Utility methods

  /**
   * Extract version from command output
   * @private
   */
  extractVersion(output) {
    const versionMatch = output.match(/(\d+\.[\d.]+)/);
    return versionMatch ? versionMatch[1] : 'unknown';
  }

  /**
   * Find shell executable path
   * @private
   */
  async findShellPath(shellName) {
    try {
      const command = this.platformDetector.isWindows() 
        ? `where ${shellName}`
        : `which ${shellName}`;
      
      const { stdout } = await execAsync(command, { timeout: 2000 });
      return stdout.trim().split('\n')[0];
    } catch (error) {
      return null;
    }
  }

  /**
   * Get PowerShell profile path
   * @private
   */
  async getPowerShellProfilePath() {
    try {
      const { stdout } = await execAsync('powershell -Command "$PROFILE"', { timeout: 2000 });
      return stdout.trim();
    } catch (error) {
      return null;
    }
  }

  /**
   * Get completion file path
   * @private
   */
  async getCompletionFilePath(shellName, config) {
    const homeDir = pathHandler.homedir();
    
    switch (shellName) {
      case 'bash':
        const bashCompDir = pathHandler.expandTilde(config.userCompletionDir);
        await fs.mkdir(bashCompDir, { recursive: true });
        return pathHandler.join(bashCompDir, 'claude-flow');
        
      case 'zsh':
        const zshCompDir = pathHandler.expandTilde(config.userCompletionDir);
        await fs.mkdir(zshCompDir, { recursive: true });
        return pathHandler.join(zshCompDir, '_claude-flow');
        
      case 'fish':
        const fishCompDir = pathHandler.expandTilde(config.completionDir);
        await fs.mkdir(fishCompDir, { recursive: true });
        return pathHandler.join(fishCompDir, 'claude-flow.fish');
        
      case 'powershell':
        if (config.profilePath) {
          const profileDir = path.dirname(config.profilePath);
          await fs.mkdir(profileDir, { recursive: true });
          return pathHandler.join(profileDir, 'claude-flow-completion.ps1');
        }
        return null;
        
      default:
        return null;
    }
  }

  /**
   * Add directory to Windows PATH
   * @private
   */
  async addToWindowsPath(directory) {
    if (!this.platformDetector.isWindows()) return;
    
    try {
      // Get current user PATH
      const { stdout } = await execAsync('reg query "HKCU\\Environment" /v PATH', { timeout: 5000 });
      const pathMatch = stdout.match(/PATH\s+REG_SZ\s+(.+)/);
      
      if (pathMatch) {
        const currentPath = pathMatch[1];
        if (!currentPath.includes(directory)) {
          const newPath = `${currentPath};${directory}`;
          await execAsync(`reg add "HKCU\\Environment" /v PATH /t REG_SZ /d "${newPath}" /f`);
          console.log(`📝 Added to Windows PATH: ${directory}`);
        }
      } else {
        // PATH doesn't exist, create it
        await execAsync(`reg add "HKCU\\Environment" /v PATH /t REG_SZ /d "${directory}" /f`);
        console.log(`📝 Created Windows PATH with: ${directory}`);
      }
    } catch (error) {
      console.warn(`Failed to add to Windows PATH: ${error.message}`);
    }
  }

  /**
   * Uninstall shell integration
   * @private
   */
  async uninstallShellIntegration(shellName) {
    const config = this.shellConfigs[shellName];
    if (!config) return;

    // Remove alias files
    const aliasFile = pathHandler.join(pathHandler.homedir(), `.claude-flow-${shellName}-aliases`);
    try {
      await fs.unlink(aliasFile);
      console.log(`🗑️ Removed: ${aliasFile}`);
    } catch (error) {
      // File may not exist
    }

    // Remove completion files
    const completionFile = await this.getCompletionFilePath(shellName, config);
    if (completionFile) {
      try {
        await fs.unlink(completionFile);
        console.log(`🗑️ Removed: ${completionFile}`);
      } catch (error) {
        // File may not exist
      }
    }

    // Remove integration from shell configuration
    await this.removeFromShellConfiguration(shellName, config);
  }

  /**
   * Remove integration from shell configuration
   * @private
   */
  async removeFromShellConfiguration(shellName, config) {
    const configFile = await this.getShellConfigFile(shellName, config);
    if (!configFile) return;

    try {
      const configContent = await fs.readFile(configFile, 'utf8');
      const marker = '# Claude Flow 2.0 Integration';
      
      // Remove integration block
      const startIndex = configContent.indexOf(marker);
      if (startIndex !== -1) {
        const endMarker = `${marker} End`;
        const endIndex = configContent.indexOf(endMarker, startIndex);
        
        if (endIndex !== -1) {
          const before = configContent.substring(0, startIndex);
          const after = configContent.substring(endIndex + endMarker.length);
          const updatedContent = (before + after).replace(/\n\n\n+/g, '\n\n').trim();
          
          await fs.writeFile(configFile, updatedContent);
          console.log(`🗑️ Removed integration from: ${configFile}`);
        }
      }
    } catch (error) {
      console.warn(`Failed to update ${configFile}:`, error.message);
    }
  }
}

module.exports = ShellIntegrationManager;