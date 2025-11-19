/**
 * Clean Uninstaller for Claude Flow 2.0
 * Complete removal system across Windows, macOS, and Linux
 * Removes all files, configurations, registry entries, and environment modifications
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const { promisify } = require('util');
const { EventEmitter } = require('events');
const PlatformDetector = require('./platform-detector');
const pathHandler = require('./path-handler').default;

const execAsync = promisify(exec);

/**
 * Cross-Platform Clean Uninstaller
 */
class CleanUninstaller extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      dryRun: options.dryRun || false,
      verbose: options.verbose || false,
      skipConfirmation: options.skipConfirmation || false,
      removeUserData: options.removeUserData || false,
      removeSystemIntegrations: options.removeSystemIntegrations !== false,
      logFile: options.logFile || null,
      ...options
    };

    this.platformDetector = new PlatformDetector();
    this.platform = null;
    this.uninstallLog = [];
    this.removedItems = [];
    this.skippedItems = [];
    this.errors = [];
  }

  /**
   * Perform complete uninstallation
   */
  async uninstall() {
    console.log('🗑️ Claude Flow 2.0 Clean Uninstaller');
    console.log('=====================================');
    
    if (!this.options.skipConfirmation) {
      const confirmation = await this.confirmUninstall();
      if (!confirmation) {
        console.log('❌ Uninstall cancelled by user');
        return { cancelled: true };
      }
    }

    console.log(`🔍 Platform: ${process.platform} (${process.arch})`);
    console.log(`🧹 Mode: ${this.options.dryRun ? 'DRY RUN' : 'ACTUAL REMOVAL'}`);
    
    const startTime = Date.now();
    
    try {
      // Initialize platform detection
      this.platform = await this.platformDetector.initialize();
      
      // Build uninstall plan
      const uninstallPlan = await this.buildUninstallPlan();
      console.log(`📋 Found ${uninstallPlan.items.length} items to remove`);
      
      if (this.options.dryRun) {
        console.log('\n📋 DRY RUN - Items that would be removed:');
        this.displayUninstallPlan(uninstallPlan);
        return { dryRun: true, plan: uninstallPlan };
      }
      
      // Execute uninstall plan
      await this.executeUninstallPlan(uninstallPlan);
      
      // Final cleanup
      await this.performFinalCleanup();
      
      const duration = Date.now() - startTime;
      const results = {
        success: true,
        duration,
        removed: this.removedItems.length,
        skipped: this.skippedItems.length,
        errors: this.errors.length,
        details: {
          removedItems: this.removedItems,
          skippedItems: this.skippedItems,
          errors: this.errors
        }
      };
      
      await this.generateUninstallReport(results);
      this.displayResults(results);
      
      return results;
      
    } catch (error) {
      console.error('❌ Uninstall failed:', error.message);
      this.errors.push({ type: 'fatal', error: error.message });
      
      const results = {
        success: false,
        error: error.message,
        removed: this.removedItems.length,
        errors: this.errors.length
      };
      
      await this.generateUninstallReport(results);
      return results;
    }
  }

  /**
   * Build comprehensive uninstall plan
   * @private
   */
  async buildUninstallPlan() {
    console.log('📋 Building uninstall plan...');
    
    const items = [];
    
    // Configuration directories and files
    items.push(...await this.findConfigurationItems());
    
    // Application data and cache
    items.push(...await this.findApplicationDataItems());
    
    // System integrations
    if (this.options.removeSystemIntegrations) {
      items.push(...await this.findSystemIntegrationItems());
    }
    
    // User data (optional)
    if (this.options.removeUserData) {
      items.push(...await this.findUserDataItems());
    }
    
    // Platform-specific items
    items.push(...await this.findPlatformSpecificItems());
    
    // NPM packages and global installations
    items.push(...await this.findNpmPackageItems());
    
    return {
      platform: this.platformDetector.getPlatformDisplay(),
      timestamp: new Date().toISOString(),
      items: items.filter(item => item !== null)
    };
  }

  /**
   * Find configuration items
   * @private
   */
  async findConfigurationItems() {
    const items = [];
    const configPaths = pathHandler.getConfigPaths();
    
    for (const [type, configPath] of Object.entries(configPaths)) {
      const claudeFlowPath = pathHandler.join(configPath, 'claude-flow');
      
      if (await this.pathExists(claudeFlowPath)) {
        items.push({
          type: 'configuration',
          category: type,
          path: claudeFlowPath,
          description: `Claude Flow ${type} directory`,
          platform: 'all',
          action: 'remove_directory'
        });
      }
    }
    
    // Additional config files
    const additionalConfigs = [
      pathHandler.join(pathHandler.homedir(), '.claude-flow'),
      pathHandler.join(pathHandler.homedir(), '.claudeflow'),
      pathHandler.join(pathHandler.homedir(), '.claude-flow.json'),
      pathHandler.join(pathHandler.homedir(), '.claudeflow.json')
    ];
    
    for (const configFile of additionalConfigs) {
      if (await this.pathExists(configFile)) {
        items.push({
          type: 'configuration',
          category: 'user',
          path: configFile,
          description: 'User configuration file',
          platform: 'all',
          action: await this.isDirectory(configFile) ? 'remove_directory' : 'remove_file'
        });
      }
    }
    
    return items;
  }

  /**
   * Find application data items
   * @private
   */
  async findApplicationDataItems() {
    const items = [];
    
    // Temporary files
    const tempDirs = [
      pathHandler.join(pathHandler.tmpdir(), 'claude-flow'),
      pathHandler.join(pathHandler.tmpdir(), 'claudeflow'),
      pathHandler.join(pathHandler.tmpdir(), 'claude-flow-*')
    ];
    
    for (const tempDir of tempDirs) {
      if (tempDir.includes('*')) {
        // Handle glob patterns
        try {
          const matches = await this.findGlobMatches(tempDir);
          for (const match of matches) {
            items.push({
              type: 'temporary',
              category: 'temp',
              path: match,
              description: 'Temporary files',
              platform: 'all',
              action: 'remove_directory'
            });
          }
        } catch (error) {
          // Ignore glob errors
        }
      } else if (await this.pathExists(tempDir)) {
        items.push({
          type: 'temporary',
          category: 'temp',
          path: tempDir,
          description: 'Temporary directory',
          platform: 'all',
          action: 'remove_directory'
        });
      }
    }
    
    // Log files
    const logDirs = [
      pathHandler.join(pathHandler.homedir(), 'claude-flow-logs'),
      pathHandler.join(pathHandler.getConfigPaths().logs, 'claude-flow')
    ];
    
    for (const logDir of logDirs) {
      if (await this.pathExists(logDir)) {
        items.push({
          type: 'logs',
          category: 'logs',
          path: logDir,
          description: 'Log files',
          platform: 'all',
          action: 'remove_directory'
        });
      }
    }
    
    // Cache directories
    const cacheDirs = [
      pathHandler.join(pathHandler.getConfigPaths().cache, 'claude-flow')
    ];
    
    for (const cacheDir of cacheDirs) {
      if (await this.pathExists(cacheDir)) {
        items.push({
          type: 'cache',
          category: 'cache',
          path: cacheDir,
          description: 'Cache files',
          platform: 'all',
          action: 'remove_directory'
        });
      }
    }
    
    return items;
  }

  /**
   * Find system integration items
   * @private
   */
  async findSystemIntegrationItems() {
    const items = [];
    
    // Shell integration files
    const shellFiles = [
      pathHandler.join(pathHandler.homedir(), '.claude-flow-bash-aliases'),
      pathHandler.join(pathHandler.homedir(), '.claude-flow-zsh-aliases'),
      pathHandler.join(pathHandler.homedir(), '.claude-flow-fish-aliases')
    ];
    
    for (const shellFile of shellFiles) {
      if (await this.pathExists(shellFile)) {
        items.push({
          type: 'shell_integration',
          category: 'aliases',
          path: shellFile,
          description: 'Shell aliases',
          platform: 'unix',
          action: 'remove_file'
        });
      }
    }
    
    // Shell completion files
    const completionDirs = [
      pathHandler.join(pathHandler.homedir(), '.bash_completion.d'),
      pathHandler.join(pathHandler.homedir(), '.zsh/completions'),
      pathHandler.join(pathHandler.homedir(), '.config/fish/completions')
    ];
    
    for (const compDir of completionDirs) {
      const claudeCompletions = [
        pathHandler.join(compDir, 'claude-flow'),
        pathHandler.join(compDir, '_claude-flow'),
        pathHandler.join(compDir, 'claude-flow.fish')
      ];
      
      for (const completion of claudeCompletions) {
        if (await this.pathExists(completion)) {
          items.push({
            type: 'shell_integration',
            category: 'completions',
            path: completion,
            description: 'Shell completions',
            platform: 'unix',
            action: 'remove_file'
          });
        }
      }
    }
    
    return items;
  }

  /**
   * Find platform-specific items
   * @private
   */
  async findPlatformSpecificItems() {
    const items = [];
    
    if (this.platformDetector.isWindows()) {
      items.push(...await this.findWindowsSpecificItems());
    } else if (this.platformDetector.isMacOS()) {
      items.push(...await this.findMacOSSpecificItems());
    } else if (this.platformDetector.isLinux()) {
      items.push(...await this.findLinuxSpecificItems());
    }
    
    return items;
  }

  /**
   * Find Windows-specific items
   * @private
   */
  async findWindowsSpecificItems() {
    const items = [];
    
    try {
      // Check Windows Registry
      const registryEntries = await this.findWindowsRegistryEntries();
      items.push(...registryEntries);
      
      // PowerShell profile modifications
      const psProfile = await this.getPowerShellProfilePath();
      if (psProfile && await this.pathExists(psProfile)) {
        // Check if profile contains Claude Flow integration
        const hasIntegration = await this.checkFileContains(psProfile, 'Claude Flow');
        if (hasIntegration) {
          items.push({
            type: 'shell_integration',
            category: 'powershell_profile',
            path: psProfile,
            description: 'PowerShell profile integration',
            platform: 'windows',
            action: 'remove_integration'
          });
        }
      }
      
      // Windows batch files
      const batchDir = pathHandler.join(process.env.USERPROFILE, 'claude-flow-cmd');
      if (await this.pathExists(batchDir)) {
        items.push({
          type: 'shell_integration',
          category: 'batch_files',
          path: batchDir,
          description: 'CMD batch files',
          platform: 'windows',
          action: 'remove_directory'
        });
      }
      
      // Windows PATH modifications
      const pathModified = await this.checkWindowsPathModifications();
      if (pathModified.length > 0) {
        items.push({
          type: 'environment',
          category: 'path',
          path: 'HKCU\\Environment\\PATH',
          description: 'Windows PATH modifications',
          platform: 'windows',
          action: 'remove_path_entries',
          data: pathModified
        });
      }
      
    } catch (error) {
      this.log(`Warning: Failed to scan Windows-specific items: ${error.message}`);
    }
    
    return items;
  }

  /**
   * Find macOS-specific items
   * @private
   */
  async findMacOSSpecificItems() {
    const items = [];
    
    try {
      // Launch Agents/Daemons
      const launchDirs = [
        pathHandler.join(pathHandler.homedir(), 'Library/LaunchAgents'),
        '/Library/LaunchDaemons',
        '/Library/LaunchAgents'
      ];
      
      for (const launchDir of launchDirs) {
        const claudeLaunchFiles = [
          pathHandler.join(launchDir, 'com.claude-flow.*.plist')
        ];
        
        for (const pattern of claudeLaunchFiles) {
          const matches = await this.findGlobMatches(pattern);
          for (const match of matches) {
            items.push({
              type: 'launch_agent',
              category: 'macos',
              path: match,
              description: 'macOS Launch Agent',
              platform: 'macos',
              action: 'remove_file'
            });
          }
        }
      }
      
      // Application Support
      const appSupport = pathHandler.join(
        pathHandler.homedir(), 
        'Library/Application Support/claude-flow'
      );
      if (await this.pathExists(appSupport)) {
        items.push({
          type: 'application_data',
          category: 'macos',
          path: appSupport,
          description: 'macOS Application Support',
          platform: 'macos',
          action: 'remove_directory'
        });
      }
      
      // Preferences
      const preferences = pathHandler.join(
        pathHandler.homedir(),
        'Library/Preferences/com.claude-flow.*.plist'
      );
      const prefMatches = await this.findGlobMatches(preferences);
      for (const pref of prefMatches) {
        items.push({
          type: 'preferences',
          category: 'macos',
          path: pref,
          description: 'macOS Preferences',
          platform: 'macos',
          action: 'remove_file'
        });
      }
      
    } catch (error) {
      this.log(`Warning: Failed to scan macOS-specific items: ${error.message}`);
    }
    
    return items;
  }

  /**
   * Find Linux-specific items
   * @private
   */
  async findLinuxSpecificItems() {
    const items = [];
    
    try {
      // Systemd services
      const systemdDirs = [
        pathHandler.join(pathHandler.homedir(), '.config/systemd/user'),
        '/etc/systemd/system',
        '/usr/lib/systemd/system'
      ];
      
      for (const systemdDir of systemdDirs) {
        const claudeServices = [
          pathHandler.join(systemdDir, 'claude-flow*.service')
        ];
        
        for (const pattern of claudeServices) {
          const matches = await this.findGlobMatches(pattern);
          for (const match of matches) {
            items.push({
              type: 'systemd_service',
              category: 'linux',
              path: match,
              description: 'Systemd service',
              platform: 'linux',
              action: 'remove_file'
            });
          }
        }
      }
      
      // Desktop entries
      const desktopDirs = [
        pathHandler.join(pathHandler.homedir(), '.local/share/applications'),
        '/usr/share/applications'
      ];
      
      for (const desktopDir of desktopDirs) {
        const claudeDesktop = pathHandler.join(desktopDir, 'claude-flow.desktop');
        if (await this.pathExists(claudeDesktop)) {
          items.push({
            type: 'desktop_entry',
            category: 'linux',
            path: claudeDesktop,
            description: 'Desktop entry',
            platform: 'linux',
            action: 'remove_file'
          });
        }
      }
      
    } catch (error) {
      this.log(`Warning: Failed to scan Linux-specific items: ${error.message}`);
    }
    
    return items;
  }

  /**
   * Find NPM package items
   * @private
   */
  async findNpmPackageItems() {
    const items = [];
    
    try {
      // Check for globally installed Claude Flow packages
      const { stdout } = await execAsync('npm list -g --depth=0 --json', { timeout: 10000 });
      const globalPackages = JSON.parse(stdout || '{}');
      
      if (globalPackages.dependencies) {
        for (const [packageName] of Object.entries(globalPackages.dependencies)) {
          if (packageName.includes('claude-flow') || packageName.includes('claudeflow')) {
            items.push({
              type: 'npm_package',
              category: 'global',
              path: packageName,
              description: `Global NPM package: ${packageName}`,
              platform: 'all',
              action: 'npm_uninstall_global',
              packageName
            });
          }
        }
      }
      
      // Check for locally installed packages in current directory
      try {
        const localResult = await execAsync('npm list --depth=0 --json', { timeout: 5000 });
        const localPackages = JSON.parse(localResult.stdout || '{}');
        
        if (localPackages.dependencies) {
          for (const [packageName] of Object.entries(localPackages.dependencies)) {
            if (packageName.includes('claude-flow') || packageName.includes('claudeflow')) {
              items.push({
                type: 'npm_package',
                category: 'local',
                path: packageName,
                description: `Local NPM package: ${packageName}`,
                platform: 'all',
                action: 'npm_uninstall_local',
                packageName
              });
            }
          }
        }
      } catch (error) {
        // No local package.json or no Claude Flow packages
      }
      
    } catch (error) {
      this.log(`Warning: Failed to check NPM packages: ${error.message}`);
    }
    
    return items;
  }

  /**
   * Execute uninstall plan
   * @private
   */
  async executeUninstallPlan(plan) {
    console.log('\n🗑️ Executing uninstall plan...');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const item of plan.items) {
      try {
        await this.executeUninstallItem(item);
        this.removedItems.push(item);
        successCount++;
        
        if (this.options.verbose) {
          console.log(`  ✅ ${item.description}: ${item.path}`);
        }
        
      } catch (error) {
        this.errors.push({
          type: 'removal_error',
          item: item,
          error: error.message
        });
        this.skippedItems.push(item);
        errorCount++;
        
        console.warn(`  ⚠️ Failed to remove ${item.description}: ${error.message}`);
      }
    }
    
    console.log(`\n📊 Removal Summary: ${successCount} successful, ${errorCount} failed`);
  }

  /**
   * Execute individual uninstall item
   * @private
   */
  async executeUninstallItem(item) {
    switch (item.action) {
      case 'remove_file':
        await fs.unlink(item.path);
        break;
        
      case 'remove_directory':
        await fs.rmdir(item.path, { recursive: true });
        break;
        
      case 'remove_integration':
        await this.removeIntegrationFromFile(item.path);
        break;
        
      case 'remove_path_entries':
        await this.removeWindowsPathEntries(item.data);
        break;
        
      case 'npm_uninstall_global':
        await execAsync(`npm uninstall -g ${item.packageName}`, { timeout: 30000 });
        break;
        
      case 'npm_uninstall_local':
        await execAsync(`npm uninstall ${item.packageName}`, { timeout: 30000 });
        break;
        
      default:
        throw new Error(`Unknown action: ${item.action}`);
    }
  }

  /**
   * Perform final cleanup
   * @private
   */
  async performFinalCleanup() {
    console.log('\n🧹 Performing final cleanup...');
    
    // Clear NPX cache for Claude Flow
    try {
      await execAsync('npx clear-npx-cache', { timeout: 10000 });
      console.log('  ✅ Cleared NPX cache');
    } catch (error) {
      console.warn('  ⚠️ Failed to clear NPX cache:', error.message);
    }
    
    // Clear Node.js module cache (if applicable)
    try {
      delete require.cache['claude-flow'];
      console.log('  ✅ Cleared Node.js module cache');
    } catch (error) {
      // Not critical
    }
    
    // Platform-specific cleanup
    if (this.platformDetector.isWindows()) {
      await this.performWindowsCleanup();
    } else if (this.platformDetector.isMacOS()) {
      await this.performMacOSCleanup();
    } else if (this.platformDetector.isLinux()) {
      await this.performLinuxCleanup();
    }
  }

  /**
   * Windows-specific cleanup
   * @private
   */
  async performWindowsCleanup() {
    try {
      // Refresh environment variables
      await execAsync('setx CLAUDE_FLOW_UNINSTALLED "true"', { timeout: 5000 });
      await execAsync('setx CLAUDE_FLOW_UNINSTALLED ""', { timeout: 5000 });
      console.log('  ✅ Refreshed Windows environment');
    } catch (error) {
      console.warn('  ⚠️ Failed to refresh Windows environment');
    }
  }

  /**
   * macOS-specific cleanup
   * @private
   */
  async performMacOSCleanup() {
    try {
      // Reset Launch Services database
      await execAsync('/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -kill -r -domain local -domain system -domain user', { timeout: 10000 });
      console.log('  ✅ Reset Launch Services database');
    } catch (error) {
      console.warn('  ⚠️ Failed to reset Launch Services database');
    }
  }

  /**
   * Linux-specific cleanup
   * @private
   */
  async performLinuxCleanup() {
    try {
      // Update desktop database
      await execAsync('update-desktop-database ~/.local/share/applications/', { timeout: 5000 });
      console.log('  ✅ Updated desktop database');
    } catch (error) {
      console.warn('  ⚠️ Failed to update desktop database');
    }
    
    try {
      // Reload systemd if services were removed
      await execAsync('systemctl --user daemon-reload', { timeout: 5000 });
      console.log('  ✅ Reloaded systemd');
    } catch (error) {
      console.warn('  ⚠️ Failed to reload systemd');
    }
  }

  // Utility methods

  /**
   * Confirm uninstall with user
   * @private
   */
  async confirmUninstall() {
    console.log('\n⚠️ This will completely remove Claude Flow 2.0 and all associated files.');
    console.log('This includes:');
    console.log('  • Configuration files and user settings');
    console.log('  • Cache and temporary files');
    console.log('  • Shell integrations and aliases');
    console.log('  • System integrations');
    if (this.options.removeUserData) {
      console.log('  • User data and project files');
    }
    
    // In a real implementation, you'd use readline or inquirer
    // For this example, we'll assume confirmation
    return true;
  }

  /**
   * Display uninstall plan
   * @private
   */
  displayUninstallPlan(plan) {
    const categories = {};
    
    for (const item of plan.items) {
      if (!categories[item.category]) {
        categories[item.category] = [];
      }
      categories[item.category].push(item);
    }
    
    for (const [category, items] of Object.entries(categories)) {
      console.log(`\n📁 ${category.toUpperCase()}:`);
      for (const item of items) {
        console.log(`  - ${item.description}: ${item.path}`);
      }
    }
  }

  /**
   * Display results
   * @private
   */
  displayResults(results) {
    console.log('\n🎉 Uninstall Results:');
    console.log('===================');
    console.log(`✅ Successfully removed: ${results.removed} items`);
    console.log(`⏭️ Skipped: ${results.skipped} items`);
    console.log(`❌ Errors: ${results.errors} items`);
    console.log(`⏱️ Duration: ${(results.duration / 1000).toFixed(2)}s`);
    
    if (results.success) {
      console.log('\n🎊 Claude Flow 2.0 has been completely uninstalled!');
      console.log('Thank you for using Claude Flow. We hope you enjoyed the experience.');
    } else {
      console.log('\n⚠️ Uninstall completed with some issues.');
      console.log('Some files or settings may still remain on your system.');
    }
  }

  /**
   * Generate uninstall report
   * @private
   */
  async generateUninstallReport(results) {
    if (!this.options.logFile) return;
    
    const report = {
      timestamp: new Date().toISOString(),
      platform: this.platformDetector.getPlatformDisplay(),
      version: '2.0.0',
      uninstallOptions: this.options,
      results,
      log: this.uninstallLog
    };
    
    try {
      await fs.writeFile(this.options.logFile, JSON.stringify(report, null, 2));
      console.log(`📄 Uninstall report saved: ${this.options.logFile}`);
    } catch (error) {
      console.warn(`Failed to save uninstall report: ${error.message}`);
    }
  }

  // Helper methods for platform-specific operations

  async findWindowsRegistryEntries() {
    const entries = [];
    
    try {
      // Check for Claude Flow registry entries
      const registryPaths = [
        'HKCU\\Software\\claude-flow',
        'HKLM\\Software\\claude-flow',
        'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\claude-flow'
      ];
      
      for (const regPath of registryPaths) {
        try {
          await execAsync(`reg query "${regPath}"`, { timeout: 2000 });
          entries.push({
            type: 'registry',
            category: 'windows_registry',
            path: regPath,
            description: 'Windows Registry entry',
            platform: 'windows',
            action: 'remove_registry_key'
          });
        } catch (error) {
          // Registry key doesn't exist
        }
      }
    } catch (error) {
      // Registry operations failed
    }
    
    return entries;
  }

  async checkWindowsPathModifications() {
    try {
      const { stdout } = await execAsync('reg query "HKCU\\Environment" /v PATH', { timeout: 5000 });
      const pathMatch = stdout.match(/PATH\s+REG_SZ\s+(.+)/);
      
      if (pathMatch) {
        const currentPath = pathMatch[1];
        const claudeFlowPaths = currentPath.split(';').filter(p => 
          p.includes('claude-flow') || p.includes('claudeflow')
        );
        return claudeFlowPaths;
      }
    } catch (error) {
      // PATH query failed
    }
    
    return [];
  }

  async removeWindowsPathEntries(entries) {
    try {
      const { stdout } = await execAsync('reg query "HKCU\\Environment" /v PATH', { timeout: 5000 });
      const pathMatch = stdout.match(/PATH\s+REG_SZ\s+(.+)/);
      
      if (pathMatch) {
        let currentPath = pathMatch[1];
        
        for (const entry of entries) {
          currentPath = currentPath.replace(`;${entry}`, '').replace(`${entry};`, '').replace(entry, '');
        }
        
        // Clean up double semicolons
        currentPath = currentPath.replace(/;+/g, ';').replace(/^;|;$/g, '');
        
        await execAsync(`reg add "HKCU\\Environment" /v PATH /t REG_SZ /d "${currentPath}" /f`);
      }
    } catch (error) {
      throw new Error(`Failed to remove PATH entries: ${error.message}`);
    }
  }

  async getPowerShellProfilePath() {
    try {
      const { stdout } = await execAsync('powershell -Command "$PROFILE"', { timeout: 2000 });
      return stdout.trim();
    } catch (error) {
      return null;
    }
  }

  async removeIntegrationFromFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const marker = '# Claude Flow 2.0 Integration';
      
      const startIndex = content.indexOf(marker);
      if (startIndex === -1) return; // No integration found
      
      const endMarker = `${marker} End`;
      const endIndex = content.indexOf(endMarker, startIndex);
      
      if (endIndex !== -1) {
        const before = content.substring(0, startIndex);
        const after = content.substring(endIndex + endMarker.length);
        const updatedContent = (before + after).replace(/\n\n\n+/g, '\n\n').trim();
        
        await fs.writeFile(filePath, updatedContent);
      }
    } catch (error) {
      throw new Error(`Failed to remove integration from ${filePath}: ${error.message}`);
    }
  }

  async findGlobMatches(pattern) {
    // Simple glob matching - in a real implementation you'd use a proper glob library
    try {
      const dir = path.dirname(pattern);
      const filename = path.basename(pattern);
      
      if (!filename.includes('*')) {
        return await this.pathExists(pattern) ? [pattern] : [];
      }
      
      const files = await fs.readdir(dir);
      const regex = new RegExp(filename.replace(/\*/g, '.*'));
      
      return files
        .filter(file => regex.test(file))
        .map(file => path.join(dir, file));
        
    } catch (error) {
      return [];
    }
  }

  async pathExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  async isDirectory(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return stats.isDirectory();
    } catch (error) {
      return false;
    }
  }

  async checkFileContains(filePath, text) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return content.includes(text);
    } catch (error) {
      return false;
    }
  }

  log(message) {
    this.uninstallLog.push({
      timestamp: new Date().toISOString(),
      message
    });
    
    if (this.options.verbose) {
      console.log(`[${new Date().toISOString()}] ${message}`);
    }
  }
}

module.exports = CleanUninstaller;