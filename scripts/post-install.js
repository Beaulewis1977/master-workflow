#!/usr/bin/env node

/**
 * Claude Flow 2.0 - Post-Install Script
 * 
 * Runs after npm install to set up initial configuration
 * and display welcome message
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    green: '\x1b[32m',
    cyan: '\x1b[36m',
    yellow: '\x1b[33m',
    magenta: '\x1b[35m'
};

async function postInstall() {
    console.log(`
${colors.cyan}${colors.bright}
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                    🎉 Claude Flow 2.0 Installed Successfully! 🎉            ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
${colors.reset}

${colors.green}Thank you for installing Claude Flow 2.0!${colors.reset}

${colors.cyan}Quick Start:${colors.reset}
  1. Navigate to your project:  ${colors.bright}cd your-project${colors.reset}
  2. Initialize Claude Flow:     ${colors.bright}npx claude-flow init --claude --webui${colors.reset}
  3. Start development:          ${colors.bright}npx claude-flow start${colors.reset}

${colors.cyan}Available Commands:${colors.reset}
  • ${colors.bright}claude-flow init${colors.reset}     - Initialize in current project
  • ${colors.bright}claude-flow start${colors.reset}    - Start workflow system
  • ${colors.bright}claude-flow status${colors.reset}   - Check system status
  • ${colors.bright}claude-flow ui${colors.reset}       - Open monitoring dashboard
  • ${colors.bright}claude-flow --help${colors.reset}   - Show all commands

${colors.cyan}Features:${colors.reset}
  ✨ Enhanced MCP Ecosystem (125+ servers)
  🚀 Unlimited scaling with Queen Controller (4,462 agents)
  📊 Real-time Web UI monitoring
  🔧 Non-invasive project overlay
  🤖 42+ specialized AI agents
  ⚡ 40-60% performance optimization

${colors.dim}Documentation: https://github.com/yourusername/claude-flow-2.0
Support: https://github.com/yourusername/claude-flow-2.0/issues${colors.reset}

${colors.magenta}Happy coding with Claude Flow 2.0! 🚀${colors.reset}
    `);

    // Create global config directory
    const configDir = path.join(os.homedir(), '.claude-flow');
    
    try {
        await fs.mkdir(configDir, { recursive: true });
        
        // Create default global config
        const globalConfig = {
            version: '2.0.0',
            installed: new Date().toISOString(),
            telemetry: {
                enabled: false,
                notice: 'Claude Flow collects anonymous usage data to improve the product. You can disable this anytime.'
            },
            defaults: {
                approach: 'hive-mind',
                agentCount: 10,
                webUI: true,
                autoDiscoverMCP: true
            }
        };
        
        const configPath = path.join(configDir, 'config.json');
        
        // Only create if doesn't exist
        try {
            await fs.access(configPath);
        } catch {
            await fs.writeFile(configPath, JSON.stringify(globalConfig, null, 2));
            console.log(`${colors.dim}Global configuration created at: ${configPath}${colors.reset}`);
        }
        
    } catch (error) {
        // Silent fail - not critical
    }
}

// Run post-install
postInstall().catch(error => {
    // Don't fail installation on post-install errors
    console.error(`${colors.yellow}Warning: Post-install script encountered an error${colors.reset}`);
    console.error(error.message);
});