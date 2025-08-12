#!/usr/bin/env node

/**
 * Cross-platform command execution helper
 * - Preserves quoting by default (shell execution)
 * - Returns Promise with { code, stdout, stderr }
 * - Provides sequential execution for arrays of commands
 */

const { spawn } = require('child_process');

function runCommand(command, options = {}) {
  const {
    cwd = process.cwd(),
    env = process.env,
    shell = true,
    detached = false,
    stdio = ['ignore', 'pipe', 'pipe'],
    timeoutMs = 0,
  } = options;

  return new Promise((resolve, reject) => {
    let cmdString;
    if (Array.isArray(command)) {
      // Convert [file, ...args] to a single string when shell
      const [file, ...args] = command;
      cmdString = [file, ...args].join(' ');
    } else {
      cmdString = String(command);
    }

    const child = spawn(cmdString, { cwd, env, shell, detached, stdio });
    let stdout = '';
    let stderr = '';
    let timeoutRef = null;

    if (child.stdout) child.stdout.on('data', (d) => (stdout += d.toString()));
    if (child.stderr) child.stderr.on('data', (d) => (stderr += d.toString()));

    const onExit = (code) => {
      if (timeoutRef) clearTimeout(timeoutRef);
      resolve({ code, stdout, stderr });
    };

    child.on('error', reject);
    child.on('exit', onExit);

    if (timeoutMs > 0) {
      timeoutRef = setTimeout(() => {
        try { child.kill('SIGKILL'); } catch {}
        reject(new Error(`Command timed out after ${timeoutMs}ms: ${cmdString}`));
      }, timeoutMs);
    }
  });
}

async function runCommandsSequentially(commands, options = {}) {
  const results = [];
  for (const cmd of commands) {
    const res = await runCommand(cmd, options);
    results.push({ command: cmd, ...res });
    if (res.code !== 0) {
      const err = new Error(`Command failed (${res.code}): ${cmd}\n${res.stderr || res.stdout}`);
      err.results = results;
      throw err;
    }
  }
  return results;
}

module.exports = {
  runCommand,
  runCommandsSequentially,
};


