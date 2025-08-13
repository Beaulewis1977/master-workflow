/**
 * MCP Server Presets Index
 * Provides programmatic access to all available server preset configurations
 */

const fs = require('fs');
const path = require('path');

class MCPPresetManager {
  constructor() {
    this.presetsPath = __dirname;
    this.presets = this.loadAllPresets();
  }

  /**
   * Load all preset configurations from JSON files
   * @returns {Object} Map of preset names to configurations
   */
  loadAllPresets() {
    const presets = {};
    const presetFiles = fs.readdirSync(this.presetsPath)
      .filter(file => file.endsWith('.json'));

    for (const file of presetFiles) {
      try {
        const presetName = path.basename(file, '.json');
        const filePath = path.join(this.presetsPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        presets[presetName] = JSON.parse(content);
      } catch (error) {
        console.error(`Error loading preset ${file}:`, error.message);
      }
    }

    return presets;
  }

  /**
   * Get a specific preset configuration
   * @param {string} presetName - Name of the preset
   * @returns {Object|null} Preset configuration or null if not found
   */
  getPreset(presetName) {
    return this.presets[presetName] || null;
  }

  /**
   * Get all available preset names
   * @returns {string[]} Array of preset names
   */
  getAvailablePresets() {
    return Object.keys(this.presets);
  }

  /**
   * Get presets by category
   * @param {string} category - Category to filter by
   * @returns {Object} Map of preset names to configurations in the category
   */
  getPresetsByCategory(category) {
    const categoryPresets = {};
    for (const [name, config] of Object.entries(this.presets)) {
      if (config.category === category) {
        categoryPresets[name] = config;
      }
    }
    return categoryPresets;
  }

  /**
   * Get presets that include a specific MCP server
   * @param {string} serverName - Name of the MCP server
   * @returns {string[]} Array of preset names that include the server
   */
  getPresetsWithServer(serverName) {
    const matchingPresets = [];
    for (const [name, config] of Object.entries(this.presets)) {
      if (config.enabled_servers && config.enabled_servers[serverName]) {
        matchingPresets.push(name);
      }
    }
    return matchingPresets;
  }

  /**
   * Merge multiple presets with priority resolution
   * @param {string[]} presetNames - Array of preset names to merge
   * @returns {Object} Merged configuration
   */
  mergePresets(presetNames) {
    if (presetNames.length === 0) {
      throw new Error('At least one preset name is required');
    }

    const basePreset = this.getPreset(presetNames[0]);
    if (!basePreset) {
      throw new Error(`Preset not found: ${presetNames[0]}`);
    }

    const merged = JSON.parse(JSON.stringify(basePreset));
    merged.name = `Merged: ${presetNames.join(', ')}`;
    merged.description = `Merged configuration from: ${presetNames.join(', ')}`;

    // Merge additional presets
    for (let i = 1; i < presetNames.length; i++) {
      const preset = this.getPreset(presetNames[i]);
      if (!preset) {
        console.warn(`Preset not found, skipping: ${presetNames[i]}`);
        continue;
      }

      // Merge enabled servers (preserve highest priority)
      for (const [serverName, serverConfig] of Object.entries(preset.enabled_servers || {})) {
        if (!merged.enabled_servers[serverName] || 
            serverConfig.priority < merged.enabled_servers[serverName].priority) {
          merged.enabled_servers[serverName] = serverConfig;
        }
      }

      // Merge environment variables
      merged.environment_variables.required = [
        ...new Set([
          ...merged.environment_variables.required,
          ...(preset.environment_variables?.required || [])
        ])
      ];

      merged.environment_variables.optional = [
        ...new Set([
          ...merged.environment_variables.optional,
          ...(preset.environment_variables?.optional || [])
        ])
      ];

      // Merge recommended tools
      merged.recommended_tools = [
        ...new Set([
          ...merged.recommended_tools,
          ...(preset.recommended_tools || [])
        ])
      ];
    }

    return merged;
  }

  /**
   * Create a custom preset configuration
   * @param {Object} options - Configuration options
   * @returns {Object} Custom preset configuration
   */
  createCustomPreset(options) {
    const {
      name = 'Custom Preset',
      description = 'Custom MCP server configuration',
      category = 'custom',
      servers = [],
      environmentVars = {},
      tools = []
    } = options;

    const enabledServers = {};
    servers.forEach((server, index) => {
      if (typeof server === 'string') {
        enabledServers[server] = {
          enabled: true,
          priority: index + 1,
          description: `Custom ${server} configuration`
        };
      } else if (typeof server === 'object' && server.name) {
        enabledServers[server.name] = {
          enabled: true,
          priority: server.priority || index + 1,
          description: server.description || `Custom ${server.name} configuration`,
          config: server.config || {}
        };
      }
    });

    return {
      name,
      description,
      category,
      version: '1.0.0',
      priority_level: 'medium',
      enabled_servers: enabledServers,
      environment_variables: {
        required: environmentVars.required || [],
        optional: environmentVars.optional || []
      },
      recommended_tools: tools,
      project_structure: {},
      common_configurations: {}
    };
  }

  /**
   * Export preset to file
   * @param {string} presetName - Name of preset to export
   * @param {string} outputPath - Output file path
   */
  exportPreset(presetName, outputPath) {
    const preset = this.getPreset(presetName);
    if (!preset) {
      throw new Error(`Preset not found: ${presetName}`);
    }

    fs.writeFileSync(outputPath, JSON.stringify(preset, null, 2));
  }

  /**
   * Get preset statistics
   * @returns {Object} Statistics about all presets
   */
  getStatistics() {
    const stats = {
      total_presets: Object.keys(this.presets).length,
      categories: {},
      servers: {},
      total_servers: 0,
      total_tools: 0
    };

    for (const [name, config] of Object.entries(this.presets)) {
      // Count categories
      const category = config.category || 'uncategorized';
      stats.categories[category] = (stats.categories[category] || 0) + 1;

      // Count servers
      for (const serverName of Object.keys(config.enabled_servers || {})) {
        stats.servers[serverName] = (stats.servers[serverName] || 0) + 1;
        stats.total_servers++;
      }

      // Count tools
      stats.total_tools += (config.recommended_tools || []).length;
    }

    return stats;
  }
}

// Export singleton instance
const presetManager = new MCPPresetManager();

module.exports = {
  MCPPresetManager,
  presetManager,
  
  // Convenience methods
  getPreset: (name) => presetManager.getPreset(name),
  getAvailablePresets: () => presetManager.getAvailablePresets(),
  getPresetsByCategory: (category) => presetManager.getPresetsByCategory(category),
  getPresetsWithServer: (server) => presetManager.getPresetsWithServer(server),
  mergePresets: (presets) => presetManager.mergePresets(presets),
  createCustomPreset: (options) => presetManager.createCustomPreset(options),
  getStatistics: () => presetManager.getStatistics()
};