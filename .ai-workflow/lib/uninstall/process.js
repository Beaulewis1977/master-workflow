/**
 * Process Management Module
 * Detects and manages tmux sessions and background processes
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class ProcessManager {
    constructor() {
        this.processes = [];
        this.tmuxSessions = [];
    }

    /**
     * Detect all workflow-related processes
     */
    async detect() {
        await this.detectTmuxSessions();
        await this.detectBackgroundProcesses();
        
        return {
            processes: this.processes,
            tmuxSessions: this.tmuxSessions,
            total: this.processes.length + this.tmuxSessions.length
        };
    }

    /**
     * Detect tmux sessions with queen-agent-* prefix
     */
    async detectTmuxSessions() {
        try {
            // Check if tmux is available
            const { stdout: tmuxCheck } = await execAsync('which tmux 2>/dev/null');
            if (!tmuxCheck.trim()) {
                console.log('ℹ️  tmux not found, skipping session detection');
                return;
            }

            // List tmux sessions
            const { stdout } = await execAsync('tmux list-sessions 2>/dev/null || true');
            const sessions = stdout.split('\n').filter(line => line.trim());
            
            for (const session of sessions) {
                // Parse session name
                const sessionName = session.split(':')[0];
                
                // Check if it's a workflow session
                if (sessionName.startsWith('queen-agent-') || 
                    sessionName.startsWith('ai-workflow-') ||
                    sessionName.includes('workflow')) {
                    this.tmuxSessions.push({
                        name: sessionName,
                        type: 'tmux',
                        command: `tmux kill-session -t ${sessionName}`
                    });
                }
            }
            
            if (this.tmuxSessions.length > 0) {
                console.log(`📺 Found ${this.tmuxSessions.length} tmux session(s)`);
            }
        } catch (error) {
            // tmux might not be installed or no sessions
            console.log('ℹ️  No tmux sessions detected');
        }
    }

    /**
     * Detect background processes (supervisor, watchers, etc.)
     */
    async detectBackgroundProcesses() {
        try {
            // Look for workflow-related processes
            const patterns = [
                'ai-workflow',
                'queen-controller',
                'supervisor',
                'workflow-runner',
                'orchestrator'
            ];
            
            for (const pattern of patterns) {
                try {
                    // Use ps to find processes
                    const { stdout } = await execAsync(
                        `ps aux | grep -i "${pattern}" | grep -v grep | grep -v "uninstall" || true`
                    );
                    
                    const lines = stdout.split('\n').filter(line => line.trim());
                    for (const line of lines) {
                        const parts = line.split(/\s+/);
                        const pid = parts[1];
                        const command = parts.slice(10).join(' ');
                        
                        // Skip if it's our own uninstall process
                        if (command.includes('uninstall')) {
                            continue;
                        }
                        
                        this.processes.push({
                            pid: parseInt(pid),
                            name: pattern,
                            command: command.substring(0, 100),  // Truncate long commands
                            type: 'background'
                        });
                    }
                } catch (error) {
                    // Process search failed, continue
                }
            }
            
            if (this.processes.length > 0) {
                console.log(`🔄 Found ${this.processes.length} background process(es)`);
            }
        } catch (error) {
            console.log('ℹ️  No background processes detected');
        }
    }

    /**
     * Stop all detected processes (Phase 5 implementation)
     */
    async stopAll(config = {}) {
        const results = {
            stopped: [],
            failed: []
        };

        // Stop tmux sessions
        for (const session of this.tmuxSessions) {
            try {
                if (!config.dryRun) {
                    await execAsync(session.command);
                }
                results.stopped.push(session);
                console.log(`✅ Stopped tmux session: ${session.name}`);
            } catch (error) {
                results.failed.push({ ...session, error: error.message });
                console.error(`❌ Failed to stop tmux session: ${session.name}`);
            }
        }

        // Stop background processes
        for (const process of this.processes) {
            try {
                if (!config.dryRun) {
                    // Try graceful shutdown first (SIGTERM)
                    await execAsync(`kill -TERM ${process.pid} 2>/dev/null || true`);
                    
                    // Wait a moment
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    // Force kill if still running (SIGKILL)
                    await execAsync(`kill -9 ${process.pid} 2>/dev/null || true`);
                }
                results.stopped.push(process);
                console.log(`✅ Stopped process: ${process.name} (PID: ${process.pid})`);
            } catch (error) {
                results.failed.push({ ...process, error: error.message });
                console.error(`❌ Failed to stop process: ${process.name} (PID: ${process.pid})`);
            }
        }

        return results;
    }

    /**
     * Check if specific process is running
     */
    async isProcessRunning(pid) {
        try {
            const { stdout } = await execAsync(`ps -p ${pid} -o pid= 2>/dev/null || true`);
            return stdout.trim() !== '';
        } catch (error) {
            return false;
        }
    }

    /**
     * Get process details
     */
    async getProcessDetails(pid) {
        try {
            const { stdout } = await execAsync(`ps -p ${pid} -o pid,ppid,user,comm,args 2>/dev/null || true`);
            const lines = stdout.split('\n').filter(line => line.trim());
            if (lines.length > 1) {
                return lines[1];  // Skip header
            }
            return null;
        } catch (error) {
            return null;
        }
    }
}

// Export main function
module.exports = {
    detectProcesses: async () => {
        const manager = new ProcessManager();
        const result = await manager.detect();
        
        // Return combined list for plan builder
        return [...result.tmuxSessions, ...result.processes];
    },
    ProcessManager
};