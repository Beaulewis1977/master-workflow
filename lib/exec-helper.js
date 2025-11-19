#!/usr/bin/env node

/**
 * Cross-platform command execution helper - SECURITY HARDENED
 * - Implements strict command validation and sanitization
 * - Prevents command injection attacks (CWE-78)
 * - Uses parameterized execution instead of shell mode
 * - Provides comprehensive input validation
 * - Returns Promise with { code, stdout, stderr }
 * - Provides sequential execution for arrays of commands
 */

const { spawn } = require('child_process');
const path = require('path');
const crypto = require('crypto');

// Security: Strict allowlist of permitted commands
const ALLOWED_COMMANDS = new Set([
  'npm', 'node', 'npx', 'bash', 'sh', 'pwsh', 'powershell',
  'git', 'tmux', 'jq', 'claude', 'claude-flow', 'python', 'python3',
  'pip', 'pip3', 'yarn', 'pnpm', 'docker', 'kubectl', 'helm',
  'terraform', 'aws', 'gcloud', 'az', 'curl', 'wget', 'ls', 'cd',
  'mkdir', 'rm', 'cp', 'mv', 'grep', 'find', 'sed', 'awk'
]);

// Security: Commands that require additional validation
const RESTRICTED_COMMANDS = new Set([
  'cat', 'rm', 'cp', 'mv' // These need path validation
]);

// Security: Dangerous characters that should be escaped or rejected
const DANGEROUS_CHARS = /[;&|`$(){}[\]<>\\'"]/;
const INJECTION_PATTERNS = [
  /;\s*rm\s+-rf/i,
  /;\s*curl.*\|.*sh/i,
  /;\s*wget.*\|.*sh/i,
  /&&.*rm/i,
  /\|\|.*rm/i,
  /`.*`/,
  /\$\(.*\)/,
  />\s*\/dev\/null.*&/
];

/**
 * Security logging for command execution
 */
function securityLog(level, message, context = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    context,
    component: 'exec-helper-security'
  };
  
  // Log to console and file
  console.log(`[SECURITY ${level}] ${message}`, context);
  
  // In production, this should integrate with your security monitoring system
  if (level === 'CRITICAL' || level === 'HIGH') {
    console.error('SECURITY ALERT:', logEntry);
  }
}

/**
 * Validate and sanitize command input
 */
function validateCommand(command, options = {}) {
  const validation = {
    isValid: false,
    sanitizedCommand: null,
    errors: [],
    warnings: []
  };

  try {
    // Convert command to array format for analysis
    let cmdArray;
    if (Array.isArray(command)) {
      cmdArray = command.map(arg => String(arg).trim());
    } else {
      // Basic parsing - more secure than shell parsing
      cmdArray = String(command).trim().split(/\s+/);
    }

    if (cmdArray.length === 0) {
      validation.errors.push('Empty command not allowed');
      return validation;
    }

    const baseCommand = cmdArray[0];
    const args = cmdArray.slice(1);

    // Security: Check if base command is allowed
    if (!ALLOWED_COMMANDS.has(baseCommand)) {
      validation.errors.push(`Command '${baseCommand}' is not in allowlist`);
      securityLog('HIGH', 'Blocked unauthorized command', { 
        command: baseCommand,
        fullCommand: command,
        caller: options.caller || 'unknown'
      });
      return validation;
    }

    // Security: Additional validation for restricted commands
    if (RESTRICTED_COMMANDS.has(baseCommand)) {
      for (const arg of args) {
        // Check for dangerous paths in arguments
        if (arg.startsWith('/etc/') || arg.startsWith('/root/') || 
            arg.startsWith('/var/log/') || arg.includes('/passwd') ||
            arg.includes('/shadow') || arg.includes('/.ssh/')) {
          validation.errors.push(`Access to system path not allowed: ${arg}`);
          securityLog('HIGH', 'Blocked access to system path', {
            command: baseCommand,
            path: arg,
            caller: options.caller || 'unknown'
          });
          return validation;
        }
      }
    }

    // Security: Check for dangerous characters
    const fullCommand = cmdArray.join(' ');
    if (DANGEROUS_CHARS.test(fullCommand)) {
      validation.errors.push('Command contains dangerous characters');
      securityLog('HIGH', 'Blocked command with dangerous characters', {
        command: fullCommand,
        caller: options.caller || 'unknown'
      });
      return validation;
    }

    // Security: Check for injection patterns
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(fullCommand)) {
        validation.errors.push('Command matches injection pattern');
        securityLog('CRITICAL', 'Blocked potential command injection', {
          command: fullCommand,
          pattern: pattern.toString(),
          caller: options.caller || 'unknown'
        });
        return validation;
      }
    }

    // Security: Validate arguments
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      // Check for null bytes
      if (arg.includes('\0')) {
        validation.errors.push(`Argument ${i} contains null byte`);
        return validation;
      }
      
      // Warn about potential issues
      if (arg.startsWith('-') && arg.length > 10) {
        validation.warnings.push(`Long flag detected: ${arg}`);
      }
      
      if (arg.includes('..')) {
        validation.warnings.push(`Path traversal pattern in argument: ${arg}`);
      }
    }

    // Command passed all checks
    validation.isValid = true;
    validation.sanitizedCommand = cmdArray;
    
    // Log successful validation
    securityLog('INFO', 'Command validation passed', {
      command: baseCommand,
      argCount: args.length,
      caller: options.caller || 'unknown'
    });

  } catch (error) {
    validation.errors.push(`Validation error: ${error.message}`);
    securityLog('HIGH', 'Command validation failed', {
      error: error.message,
      command: command,
      caller: options.caller || 'unknown'
    });
  }

  return validation;
}

/**
 * Secure command execution with comprehensive validation
 */
function runCommand(command, options = {}) {
  const {
    cwd = process.cwd(),
    env = process.env,
    shell = false, // Security: Default to false to prevent shell injection
    detached = false,
    stdio = ['ignore', 'pipe', 'pipe'],
    timeoutMs = 30000, // Security: Default timeout of 30 seconds
    maxOutputSize = 10 * 1024 * 1024, // Security: 10MB output limit
    caller = 'unknown'
  } = options;

  return new Promise((resolve, reject) => {
    // Generate execution ID for tracking
    const executionId = crypto.randomBytes(8).toString('hex');
    
    securityLog('INFO', 'Starting command execution', {
      executionId,
      caller,
      cwd: cwd,
      timeout: timeoutMs
    });

    // Security: Validate command
    const validation = validateCommand(command, { caller });
    if (!validation.isValid) {
      const error = new Error(`Command validation failed: ${validation.errors.join(', ')}`);
      securityLog('HIGH', 'Command execution blocked', {
        executionId,
        errors: validation.errors,
        command: command,
        caller
      });
      reject(error);
      return;
    }

    // Log warnings if any
    if (validation.warnings.length > 0) {
      securityLog('WARN', 'Command validation warnings', {
        executionId,
        warnings: validation.warnings,
        caller
      });
    }

    // Security: Use array format to prevent shell injection
    const [baseCommand, ...args] = validation.sanitizedCommand;
    
    // Security: Validate working directory
    try {
      const resolvedCwd = path.resolve(cwd);
      if (!resolvedCwd.startsWith(process.cwd())) {
        throw new Error('Working directory outside project root not allowed');
      }
    } catch (error) {
      securityLog('HIGH', 'Invalid working directory', {
        executionId,
        cwd: cwd,
        error: error.message,
        caller
      });
      reject(new Error(`Invalid working directory: ${error.message}`));
      return;
    }

    // Security: Create clean environment
    const cleanEnv = {
      ...env,
      PATH: env.PATH || process.env.PATH,
      HOME: env.HOME || process.env.HOME,
      USER: env.USER || process.env.USER
    };

    // Remove potentially dangerous environment variables
    delete cleanEnv.LD_PRELOAD;
    delete cleanEnv.LD_LIBRARY_PATH;

    try {
      // Security: Use spawn with array arguments to prevent shell injection
      const child = spawn(baseCommand, args, { 
        cwd: path.resolve(cwd), 
        env: cleanEnv, 
        shell: false, // Never use shell mode
        detached, 
        stdio 
      });

      let stdout = '';
      let stderr = '';
      let outputSize = 0;
      let timeoutRef = null;

      // Security: Monitor output size to prevent memory exhaustion
      const checkOutputSize = (data) => {
        outputSize += data.length;
        if (outputSize > maxOutputSize) {
          try { child.kill('SIGKILL'); } catch {}
          reject(new Error(`Output size limit exceeded: ${outputSize} > ${maxOutputSize}`));
          return false;
        }
        return true;
      };

      if (child.stdout) {
        child.stdout.on('data', (data) => {
          if (checkOutputSize(data)) {
            stdout += data.toString();
          }
        });
      }

      if (child.stderr) {
        child.stderr.on('data', (data) => {
          if (checkOutputSize(data)) {
            stderr += data.toString();
          }
        });
      }

      const onExit = (code) => {
        if (timeoutRef) clearTimeout(timeoutRef);
        
        securityLog('INFO', 'Command execution completed', {
          executionId,
          exitCode: code,
          outputSize,
          caller
        });
        
        resolve({ code, stdout, stderr, executionId });
      };

      child.on('error', (error) => {
        if (timeoutRef) clearTimeout(timeoutRef);
        securityLog('HIGH', 'Command execution error', {
          executionId,
          error: error.message,
          caller
        });
        reject(error);
      });

      child.on('exit', onExit);

      // Security: Implement timeout
      if (timeoutMs > 0) {
        timeoutRef = setTimeout(() => {
          try { 
            child.kill('SIGKILL'); 
            securityLog('WARN', 'Command execution timeout', {
              executionId,
              timeout: timeoutMs,
              caller
            });
          } catch {}
          reject(new Error(`Command timed out after ${timeoutMs}ms (ID: ${executionId})`));
        }, timeoutMs);
      }

    } catch (error) {
      securityLog('HIGH', 'Failed to spawn command', {
        executionId,
        error: error.message,
        command: baseCommand,
        args: args,
        caller
      });
      reject(error);
    }
  });
}

/**
 * Security-hardened sequential command execution
 */
async function runCommandsSequentially(commands, options = {}) {
  const results = [];
  const caller = options.caller || 'runCommandsSequentially';
  
  securityLog('INFO', 'Starting sequential command execution', {
    commandCount: commands.length,
    caller
  });

  for (let i = 0; i < commands.length; i++) {
    const cmd = commands[i];
    
    try {
      securityLog('INFO', `Executing command ${i + 1} of ${commands.length}`, {
        command: Array.isArray(cmd) ? cmd[0] : cmd.toString().split(' ')[0],
        caller
      });

      const res = await runCommand(cmd, { ...options, caller: `${caller}[${i}]` });
      results.push({ command: cmd, ...res });
      
      if (res.code !== 0) {
        securityLog('WARN', 'Command failed in sequence', {
          commandIndex: i,
          command: cmd,
          exitCode: res.code,
          stderr: res.stderr?.substring(0, 200), // Log first 200 chars of stderr
          caller
        });
        
        const err = new Error(`Command failed (${res.code}): ${cmd}\n${res.stderr || res.stdout}`);
        err.results = results;
        throw err;
      }
    } catch (error) {
      securityLog('HIGH', 'Sequential execution failed', {
        commandIndex: i,
        command: cmd,
        error: error.message,
        caller
      });
      throw error;
    }
  }
  
  securityLog('INFO', 'Sequential command execution completed', {
    commandCount: commands.length,
    successfulCommands: results.length,
    caller
  });
  
  return results;
}

/**
 * Security utilities for external use
 */
const SecurityUtils = {
  /**
   * Check if a command is allowed
   */
  isCommandAllowed: (command) => {
    const baseCommand = Array.isArray(command) ? command[0] : String(command).split(' ')[0];
    return ALLOWED_COMMANDS.has(baseCommand);
  },

  /**
   * Validate command without executing
   */
  validateCommand: (command, options = {}) => {
    return validateCommand(command, options);
  },

  /**
   * Get list of allowed commands
   */
  getAllowedCommands: () => {
    return Array.from(ALLOWED_COMMANDS);
  },

  /**
   * Security logging for external modules
   */
  securityLog: securityLog
};

module.exports = {
  runCommand,
  runCommandsSequentially,
  SecurityUtils,
  // Legacy exports for backward compatibility
  validateCommand,
  securityLog
};


