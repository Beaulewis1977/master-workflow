/**
 * Claude Code Bridge
 * Integration layer for Claude Code CLI commands and workflows
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { EventEmitter } from 'events';

const execAsync = promisify(exec);

export class ClaudeCodeBridge extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      claudeCodePath: config.claudeCodePath || 'claude',
      timeout: config.timeout || 300000, // 5 minutes default
      verbose: config.verbose || false,
      ...config
    };

    this.commandHistory = [];
  }

  /**
   * Execute a Claude Code command
   */
  async executeCommand(command, options = {}) {
    const fullCommand = `${this.config.claudeCodePath} ${command}`;

    this._log(`Executing command: ${fullCommand}`);
    this.emit('command:start', { command: fullCommand });

    const startTime = Date.now();

    try {
      const { stdout, stderr } = await execAsync(fullCommand, {
        timeout: options.timeout || this.config.timeout,
        maxBuffer: 10 * 1024 * 1024, // 10MB
        cwd: options.cwd || process.cwd(),
        env: { ...process.env, ...options.env }
      });

      const result = {
        success: true,
        command: fullCommand,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        duration: Date.now() - startTime
      };

      this.commandHistory.push(result);
      this.emit('command:complete', result);

      return result;

    } catch (error) {
      const result = {
        success: false,
        command: fullCommand,
        error: error.message,
        stdout: error.stdout?.trim() || '',
        stderr: error.stderr?.trim() || '',
        duration: Date.now() - startTime
      };

      this.commandHistory.push(result);
      this.emit('command:error', result);

      throw new Error(`Claude Code command failed: ${error.message}`);
    }
  }

  /**
   * Execute a task using Claude Code
   */
  async executeTask(task, options = {}) {
    const prompt = typeof task === 'string' ? task : task.description;

    // Escape quotes in the prompt
    const escapedPrompt = prompt.replace(/"/g, '\\"');

    const command = options.command || `code "${escapedPrompt}"`;

    return await this.executeCommand(command, options);
  }

  /**
   * Read a file using Claude Code
   */
  async readFile(filePath) {
    return await this.executeCommand(`read "${filePath}"`);
  }

  /**
   * Write a file using Claude Code
   */
  async writeFile(filePath, content) {
    // For safety, we'll use standard fs operations
    // Claude Code integration would be through slash commands
    const { writeFile } = await import('fs/promises');
    await writeFile(filePath, content, 'utf-8');

    return {
      success: true,
      filePath,
      operation: 'write'
    };
  }

  /**
   * Execute a slash command
   */
  async slashCommand(commandName, args = []) {
    const argsStr = args.join(' ');
    const command = `/${commandName} ${argsStr}`.trim();

    this._log(`Executing slash command: ${command}`);

    // Note: Actual slash command execution would need Claude Code API integration
    // This is a placeholder that demonstrates the interface

    return {
      success: true,
      command,
      message: 'Slash command queued (requires Claude Code API)',
      simulated: true
    };
  }

  /**
   * Create a workflow definition file for Claude Code
   */
  async createWorkflowFile(workflow, outputPath) {
    const { writeFile } = await import('fs/promises');
    const yaml = await import('yaml');

    const workflowYaml = yaml.stringify(workflow);
    await writeFile(outputPath, workflowYaml, 'utf-8');

    return {
      success: true,
      path: outputPath,
      workflow
    };
  }

  /**
   * Get command history
   */
  getHistory() {
    return this.commandHistory;
  }

  /**
   * Get command statistics
   */
  getStats() {
    return {
      totalCommands: this.commandHistory.length,
      successfulCommands: this.commandHistory.filter(c => c.success).length,
      failedCommands: this.commandHistory.filter(c => !c.success).length,
      averageDuration: this.commandHistory.length > 0
        ? this.commandHistory.reduce((sum, c) => sum + c.duration, 0) / this.commandHistory.length
        : 0
    };
  }

  /**
   * Clear command history
   */
  clearHistory() {
    this.commandHistory = [];
  }

  /**
   * Internal logging
   */
  _log(message, data = {}) {
    if (this.config.verbose) {
      console.log(`[ClaudeCodeBridge] ${message}`, data);
    }
    this.emit('log', { message, data, timestamp: Date.now() });
  }
}

export default ClaudeCodeBridge;
