#!/usr/bin/env node

import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { execa } from 'execa';

const SCRIPT_DIR = path.dirname(new URL(import.meta.url).pathname);
const PROJECT_DIR = process.cwd();
const INSTALL_DIR = path.join(PROJECT_DIR, '.ai-workflow');

const components = {
  claudeCode: { name: 'Claude Code Integration', value: 'claudeCode', checked: false },
  agentOS: { name: 'Agent-OS Planning System', value: 'agentOS', checked: false },
  claudeFlow: { name: 'Claude Flow 2.0 Multi-Agent', value: 'claudeFlow', checked: false },
  tmux: { name: `TMux Orchestrator ${chalk.dim('(24/7 operation)')}`, value: 'tmux', checked: false },
};

class Installer {
  constructor() {
    this.selectedComponents = [];
  }

  printHeader() {
    console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════'));
    console.log(chalk.cyan.bold('  Intelligent Workflow System - Modular Node.js Installer'));
    console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════\n'));
  }

  async showComponentSelection() {
    const { selected } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selected',
        message: 'Select components to install:',
        choices: [
          { name: `Core Workflow System ${chalk.dim('(required)')}`, value: 'core', checked: true, disabled: true },
          new inquirer.Separator(),
          ...Object.values(components)
        ],
        pageSize: 10,
      }
    ]);
    this.selectedComponents = selected;
  }

  summarizeSelection() {
    console.log(chalk.cyan('\nSelected Components:'));
    console.log(chalk.green('  ✓ Core Workflow System'));
    for (const key in components) {
        if (this.selectedComponents.includes(key)) {
            console.log(chalk.green(`  ✓ ${components[key].name}`));
        }
    }
    console.log('');
  }

  async checkDependencies() {
    console.log(chalk.blue('\nChecking dependencies...'));
    try {
      const { stdout } = await execa('node', ['--version']);
      const nodeVersion = stdout.trim().substring(1);
      const majorVersion = parseInt(nodeVersion.split('.')[0], 10);
      if (majorVersion >= 18) {
        console.log(chalk.green(`  ✓ Node.js found (version ${nodeVersion})`));
      } else {
        console.error(chalk.red(`  ✗ Node.js version ${nodeVersion} found, but v18+ is required.`));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('  ✗ Node.js is not installed. Please install Node.js 18+ and try again.'));
      process.exit(1);
    }
    // TODO: Add optional dependency checks for tmux, jq, etc.
  }

  async createDirectoryStructure() {
    console.log(chalk.blue('\nCreating directory structure...'));
    try {
      // Core directories
      await fs.mkdirp(path.join(INSTALL_DIR, 'intelligence-engine'));
      await fs.mkdirp(path.join(INSTALL_DIR, 'bin'));
      await fs.mkdirp(path.join(INSTALL_DIR, 'logs'));
      await fs.mkdirp(path.join(INSTALL_DIR, 'configs'));
      await fs.mkdirp(path.join(PROJECT_DIR, '.ai-dev'));
      console.log(chalk.green('  ✓ Core directories created.'));

      // Component-specific directories
      if (this.selectedComponents.includes('claudeCode')) {
        await fs.mkdirp(path.join(PROJECT_DIR, '.claude', 'agents'));
        await fs.mkdirp(path.join(PROJECT_DIR, '.claude', 'commands'));
        console.log(chalk.green('  ✓ Claude Code directories created.'));
      }
      if (this.selectedComponents.includes('agentOS')) {
        await fs.mkdirp(path.join(PROJECT_DIR, '.agent-os', 'specs'));
        await fs.mkdirp(path.join(PROJECT_DIR, '.agent-os', 'plans'));
        console.log(chalk.green('  ✓ Agent-OS directories created.'));
      }
      // Add other component dirs here later

      console.log(chalk.green.bold('Directory structure created successfully.'));
    } catch (error) {
      console.error(chalk.red('  ✗ Error creating directory structure:'), error);
      process.exit(1);
    }
  }

  async installCoreSystem() {
    console.log(chalk.blue('\nInstalling core system files...'));
    try {
      const sourceEngineDir = path.join(SCRIPT_DIR, 'intelligence-engine');
      const destEngineDir = path.join(INSTALL_DIR, 'intelligence-engine');
      await fs.copy(sourceEngineDir, destEngineDir);
      console.log(chalk.green('  ✓ Intelligence engine copied.'));

      const sourceConfigsDir = path.join(SCRIPT_DIR, 'configs');
      const destConfigsDir = path.join(INSTALL_DIR, 'configs');
      await fs.copy(sourceConfigsDir, destConfigsDir);
      console.log(chalk.green('  ✓ Configuration files copied.'));

      // Copy workflow runner
      const runnerSource = path.join(SCRIPT_DIR, 'workflow-runner.js');
      const runnerDest = path.join(INSTALL_DIR, 'workflow-runner.js');
      if (await fs.pathExists(runnerSource)) {
          await fs.copy(runnerSource, runnerDest);
          console.log(chalk.green('  ✓ Workflow runner copied.'));
      }

      console.log(chalk.green.bold('Core system installed successfully.'));
    } catch (error) {
      console.error(chalk.red('  ✗ Error installing core system:'), error);
      process.exit(1);
    }
  }

  async collectInitialPrompt() {
    const { wantsPrompt } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'wantsPrompt',
            message: 'Would you like to enter an initial project prompt now?',
            default: true,
        }
    ]);

    if (wantsPrompt) {
        console.log(chalk.cyan('\nEnter your project requirements and initial task.'));
        console.log(chalk.dim('You can paste or type multiple lines. Press Ctrl+D when done on Unix, or Ctrl+Z on Windows.'));

        const { promptContent } = await inquirer.prompt([
            {
                type: 'editor',
                name: 'promptContent',
                message: 'Initial Prompt:',
                waitUserInput: true,
            }
        ]);

        const promptFile = path.join(INSTALL_DIR, 'initial-prompt.md');
        await fs.writeFile(promptFile, promptContent);
        console.log(chalk.green(`  ✓ Prompt saved to ${promptFile}`));
    }
  }

  async createCli() {
    console.log(chalk.blue('\nCreating ai-workflow CLI...'));
    const cliPath = path.join(INSTALL_DIR, 'bin', 'ai-workflow');

    const cliScript = `#!/bin/bash

# Modular AI Workflow CLI (Generated by install.js)
# Adapts based on installed components

INSTALL_DIR="$(dirname "$(dirname "$(readlink -f "$0" || echo "$0")")")"
PROJECT_DIR="$(pwd)"
CONFIG_FILE="$INSTALL_DIR/installation-config.json"

# Load configuration
if [ -f "$CONFIG_FILE" ]; then
    HAS_CLAUDE_CODE=$(jq -r '.components.claudeCode' "$CONFIG_FILE" 2>/dev/null || echo "false")
    HAS_AGENT_OS=$(jq -r '.components.agentOS' "$CONFIG_FILE" 2>/dev/null || echo "false")
    HAS_CLAUDE_FLOW=$(jq -r '.components.claudeFlow' "$CONFIG_FILE" 2>/dev/null || echo "false")
    HAS_TMUX=$(jq -r '.components.tmux' "$CONFIG_FILE" 2>/dev/null || echo "false")
else
    # Fallback if config is missing
    HAS_CLAUDE_CODE="false"
    HAS_AGENT_OS="false"
    HAS_CLAUDE_FLOW="false"
    HAS_TMUX="false"
fi

case "$1" in
    init)
        shift
        node "$INSTALL_DIR/workflow-runner.js" init "$@"
        ;;
    analyze)
        shift
        node "$INSTALL_DIR/intelligence-engine/complexity-analyzer.js" "$@"
        ;;
    prompt)
        shift
        if [ "$1" = "edit" ]; then
            ${EDITOR:-nano} "$INSTALL_DIR/initial-prompt.md"
        else
            echo "Executing saved prompt..."
            # This part needs the workflow-runner to be implemented
            # node "$INSTALL_DIR/workflow-runner.js" execute-prompt
            cat "$INSTALL_DIR/initial-prompt.md"
        fi
        ;;
    components)
        echo "Installed Components:"
        echo "  Core Workflow: ✓"
        [ "$HAS_CLAUDE_CODE" = "true" ] && echo "  Claude Code: ✓" || echo "  Claude Code: ✗"
        [ "$HAS_AGENT_OS" = "true" ] && echo "  Agent-OS: ✓" || echo "  Agent-OS: ✗"
        [ "$HAS_CLAUDE_FLOW" = "true" ] && echo "  Claude Flow: ✓" || echo "  Claude Flow: ✗"
        [ "$HAS_TMUX" = "true" ] && echo "  TMux Orchestrator: ✓" || echo "  TMux Orchestrator: ✗"
        ;;
    add)
        shift
        if [ -z "$1" ]; then
            echo "Please specify a component to add."
            echo "Available: claude-code, agent-os, claude-flow, tmux"
            exit 1
        fi
        # Find the path to the installer script itself to run it
        INSTALLER_SCRIPT_PATH="$(dirname "$INSTALL_DIR")/install.js"
        if [ -f "$INSTALLER_SCRIPT_PATH" ]; then
            node "$INSTALLER_SCRIPT_PATH" --add "$1"
        else
            echo "Error: Could not find the installer script at $INSTALLER_SCRIPT_PATH"
            exit 1
        fi
        ;;
    help|--help|-h)
        echo "Modular AI Workflow System"
        echo ""
        echo "Core Commands:"
        echo "  init [options]          Initialize workflow"
        echo "  analyze [path]          Analyze project complexity"
        echo "  prompt [edit]           View/edit saved prompt"
        echo "  components              List installed components"
        echo "  add [component]         Add component post-install (coming soon)"
        echo "  help                    Show this help"
        # Add more help sections based on installed components
        ;;
    *)
        echo "Unknown command: $1"
        echo "Run './ai-workflow help' for usage"
        exit 1
        ;;
esac
`;

    try {
      await fs.writeFile(cliPath, cliScript);
      await fs.chmod(cliPath, '755'); // Make it executable

      const symlinkPath = path.join(PROJECT_DIR, 'ai-workflow');
      // Create symlink, overwriting if it exists
      await fs.remove(symlinkPath);
      await fs.symlink(cliPath, symlinkPath);

      console.log(chalk.green('  ✓ CLI script created and symlinked to project root.'));
    } catch (error) {
      console.error(chalk.red('  ✗ Error creating CLI:'), error);
      process.exit(1);
    }
  }

  async saveInstallationConfig() {
    console.log(chalk.blue('\nSaving installation configuration...'));
    const configFile = path.join(INSTALL_DIR, 'installation-config.json');
    const config = {
        version: "2.0.0",
        components: {
            core: true,
            ...this.selectedComponents.reduce((acc, comp) => ({ ...acc, [comp]: true }), {})
        },
        installedAt: new Date().toISOString(),
        projectDir: PROJECT_DIR,
        installDir: INSTALL_DIR,
    };

    try {
        await fs.writeJson(configFile, config, { spaces: 2 });
        console.log(chalk.green('  ✓ Configuration saved.'));
    } catch (error) {
        console.error(chalk.red('  ✗ Error saving configuration:'), error);
        process.exit(1);
    }
  }

  async installComponent(name, installFn) {
    if (this.selectedComponents.includes(name)) {
      await installFn.call(this);
    }
  }

  async installNpmDependency(packageName, isDev = false) {
    const packageJsonPath = path.join(PROJECT_DIR, 'package.json');
    if (!await fs.pathExists(packageJsonPath)) {
      console.log(chalk.yellow(`  - No package.json found. Initializing a new one...`));
      await execa('npm', ['init', '-y'], { cwd: PROJECT_DIR });
    }

    console.log(chalk.blue(`  - Installing ${packageName}...`));
    const args = ['install', packageName];
    if (isDev) {
      args.push('--save-dev');
    }
    try {
      await execa('npm', args, { cwd: PROJECT_DIR });
      console.log(chalk.green(`  ✓ ${packageName} installed locally.`));
    } catch (error) {
      console.error(chalk.red(`  ✗ Failed to install ${packageName}:`), error.stderr);
      // Don't exit, just warn the user.
      console.log(chalk.yellow(`  - Please try installing it manually: npm install ${packageName}`));
    }
  }

  async installClaudeCodeComponents() {
    console.log(chalk.blue('\nInstalling Claude Code components...'));
    await this.installNpmDependency('@anthropic-ai/claude-code');

    // This is a simplified version. We will just copy templates.
    const agentTemplatesDir = path.join(SCRIPT_DIR, 'agent-templates');
    const destAgentsDir = path.join(PROJECT_DIR, '.claude', 'agents');
    await fs.copy(agentTemplatesDir, destAgentsDir);
    console.log(chalk.green('  ✓ Agent templates copied.'));

    const slashCommandsDir = path.join(SCRIPT_DIR, 'slash-commands');
    const destCommandsDir = path.join(PROJECT_DIR, '.claude', 'commands');
    await fs.copy(slashCommandsDir, destCommandsDir);
    console.log(chalk.green('  ✓ Slash commands copied.'));
  }

  async installAgentOsComponents() {
    console.log(chalk.blue('\nInstalling Agent-OS components...'));
    // Create a default customized instructions file
    const instructionsPath = path.join(PROJECT_DIR, '.agent-os', 'instructions.md');
    const instructionsContent = `# Agent-OS Instructions\n\nThis project is in the **early** stage. Focus on building a solid foundation.`;
    await fs.writeFile(instructionsPath, instructionsContent);
    console.log(chalk.green('  ✓ Default Agent-OS instructions created.'));
  }

  async installClaudeFlowComponents() {
    console.log(chalk.blue('\nInstalling Claude Flow components...'));
    await this.installNpmDependency('claude-flow@alpha');

    console.log(chalk.blue('  - Initializing Claude Flow...'));
    try {
      await execa('npx', ['claude-flow@alpha', 'init', '--quiet'], { cwd: PROJECT_DIR });
      console.log(chalk.green('  ✓ Claude Flow initialized.'));
    } catch (error) {
      console.error(chalk.red('  ✗ Failed to initialize Claude Flow:'), error.stderr);
      console.log(chalk.yellow('  - You may need to run "npx claude-flow init" manually.'));
    }
  }

  async installTmuxComponents() {
    console.log(chalk.blue('\nInstalling TMux components...'));
    const tmuxScriptsDir = path.join(SCRIPT_DIR, 'tmux-scripts');
    const destTmuxDir = path.join(INSTALL_DIR, 'tmux-scripts');
    await fs.copy(tmuxScriptsDir, destTmuxDir);
    console.log(chalk.green('  ✓ TMux scripts copied.'));
  }

  async run() {
    this.printHeader();
    await this.showComponentSelection();
    this.summarizeSelection();

    await this.checkDependencies();
    await this.collectInitialPrompt();

    // Setup directories and core system first
    await this.createDirectoryStructure();
    await this.installCoreSystem();

    // Install selected optional components
    await this.installComponent('claudeCode', this.installClaudeCodeComponents);
    await this.installComponent('agentOS', this.installAgentOsComponents);
    await this.installComponent('claudeFlow', this.installClaudeFlowComponents);
    await this.installComponent('tmux', this.installTmuxComponents);

    // Create CLI and save config at the end
    await this.createCli();
    await this.saveInstallationConfig();

    console.log(chalk.green.bold('\n✅ Installation Complete!'));
    console.log(chalk.cyan('\n🚀 Quick Start:'));
    console.log(chalk.bold('  ./ai-workflow analyze') + '   - Analyze project complexity');
    console.log(chalk.bold('  ./ai-workflow prompt') + '     - View saved prompt');
  }
}

  async addComponent(componentName) {
    console.log(chalk.blue(`\nAdding component: ${componentName}...`));

    const validComponents = Object.keys(components);
    if (!validComponents.includes(componentName)) {
      console.error(chalk.red(`  ✗ Invalid component '${componentName}'.`));
      console.log(chalk.yellow(`  Available components: ${validComponents.join(', ')}`));
      process.exit(1);
    }

    const configFile = path.join(INSTALL_DIR, 'installation-config.json');
    if (!await fs.pathExists(configFile)) {
      console.error(chalk.red('  ✗ No installation found. Please run the installer first.'));
      process.exit(1);
    }

    const config = await fs.readJson(configFile);
    if (config.components[componentName]) {
      console.log(chalk.yellow(`  - Component '${componentName}' is already installed.`));
      return;
    }

    // Set selectedComponents to the one we are adding to trigger the right installers
    this.selectedComponents = [componentName];

    // Create directories and install the component
    await this.createDirectoryStructure();
    await this.installComponent(componentName, this[`install${componentName.charAt(0).toUpperCase() + componentName.slice(1)}Components`]);

    // Update and save the configuration
    config.components[componentName] = true;
    await fs.writeJson(configFile, config, { spaces: 2 });

    console.log(chalk.green.bold(`\n✅ Component '${componentName}' added successfully!`));
  }
}

// Main execution logic
const main = async () => {
    const args = process.argv.slice(2);
    const installer = new Installer();

    if (args[0] === '--add' && args[1]) {
        await installer.addComponent(args[1]);
    } else {
        await installer.run();
    }
};

main().catch(error => {
  console.error(chalk.red('\nAn unexpected error occurred:'), error);
  process.exit(1);
});
