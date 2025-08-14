/**
 * Enhanced Process Management Module
 * Detects and manages tmux sessions, background processes, and Windows processes
 * Phase 5 Implementation: Comprehensive Process Detection & Management
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const os = require('os');
const path = require('path');
const execAsync = promisify(exec);

class ProcessManager {
    constructor(options = {}) {
        this.processes = [];
        this.tmuxSessions = [];
        this.processTree = new Map(); // PID -> child PIDs mapping
        this.platform = os.platform();
        this.isWindows = this.platform === 'win32';
        this.dryRun = options.dryRun || false;
        
        // Enhanced patterns for better detection
        this.workflowPatterns = [
            'queen-agent-*',
            'ai-workflow-*',
            'workflow-*',
            'hive-mind-*',
            'claude-flow-*',
            'sparc-*'
        ];

        // Process name patterns for background detection
        this.processPatterns = [
            'ai-workflow',
            'queen-controller',
            'queen-agent',
            'supervisor',
            'workflow-runner',
            'orchestrator',
            'hive-mind',
            'claude-flow',
            'sparc'
        ];

        // System process whitelist to avoid false positives
        this.systemProcessWhitelist = [
            'systemd',
            'kernel',
            'kthreadd',
            'init',
            'dbus',
            'networkd',
            'resolved'
        ];
    }

    /**
     * Detect all workflow-related processes with enhanced capabilities
     */
    async detect() {
        console.log(`🔍 Starting comprehensive process detection on ${this.platform}`);
        
        // Build process tree first for better analysis
        await this.buildProcessTree();
        
        // Detect different types of processes
        await this.detectTmuxSessions();
        await this.detectBackgroundProcesses();
        
        // Windows-specific detection
        if (this.isWindows) {
            await this.detectWindowsProcesses();
        }
        
        // Verify process ownership and context
        await this.verifyProcessSafety();
        
        const result = {
            processes: this.processes,
            tmuxSessions: this.tmuxSessions,
            processTree: this.processTree,
            platform: this.platform,
            total: this.processes.length + this.tmuxSessions.length
        };
        
        if (result.total > 0) {
            console.log(`📊 Detection complete: ${result.total} workflow-related items found`);
        } else {
            console.log(`✅ No workflow processes detected`);
        }
        
        return result;
    }

    /**
     * Enhanced tmux session detection with improved patterns
     */
    async detectTmuxSessions() {
        // Skip tmux detection on Windows
        if (this.isWindows) {
            console.log('ℹ️  Skipping tmux detection on Windows');
            return;
        }

        try {
            // Check if tmux is available
            const { stdout: tmuxCheck } = await execAsync('which tmux 2>/dev/null || echo ""');
            if (!tmuxCheck.trim()) {
                console.log('ℹ️  tmux not found, skipping session detection');
                return;
            }

            // List tmux sessions with detailed format
            const { stdout } = await execAsync('tmux list-sessions -F "#{session_name}:#{session_created}:#{session_windows}" 2>/dev/null || true');
            const sessions = stdout.split('\n').filter(line => line.trim());
            
            for (const sessionLine of sessions) {
                const [sessionName, created, windows] = sessionLine.split(':');
                
                if (!sessionName) continue;
                
                // Enhanced pattern matching for workflow sessions
                const isWorkflowSession = this.workflowPatterns.some(pattern => {
                    // Handle wildcard patterns
                    if (pattern.includes('*')) {
                        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$', 'i');
                        return regex.test(sessionName);
                    }
                    // Exact match or contains check
                    return sessionName.toLowerCase().includes(pattern.toLowerCase().replace('-*', ''));
                });
                
                if (isWorkflowSession) {
                    // Get additional session details
                    const sessionDetails = await this.getTmuxSessionDetails(sessionName);
                    
                    this.tmuxSessions.push({
                        name: sessionName,
                        type: 'tmux',
                        created: created ? new Date(parseInt(created) * 1000).toISOString() : 'unknown',
                        windows: parseInt(windows) || 0,
                        details: sessionDetails,
                        command: `tmux kill-session -t "${sessionName}"`,
                        safeToKill: true // Will be verified later
                    });
                }
            }
            
            if (this.tmuxSessions.length > 0) {
                console.log(`📺 Found ${this.tmuxSessions.length} workflow tmux session(s)`);
                this.tmuxSessions.forEach(session => {
                    console.log(`   - ${session.name} (${session.windows} windows)`);
                });
            }
        } catch (error) {
            console.log(`ℹ️  Tmux session detection failed: ${error.message}`);
        }
    }

    /**
     * Get detailed information about a tmux session
     */
    async getTmuxSessionDetails(sessionName) {
        try {
            const { stdout } = await execAsync(`tmux list-windows -t "${sessionName}" -F "#{window_name}:#{pane_current_command}" 2>/dev/null || true`);
            const windows = stdout.split('\n')
                .filter(line => line.trim())
                .map(line => {
                    const [name, command] = line.split(':');
                    return { name, command };
                });
            return { windows };
        } catch (error) {
            return { windows: [] };
        }
    }

    /**
     * Enhanced background process detection with cross-platform support
     */
    async detectBackgroundProcesses() {
        try {
            console.log('🔍 Scanning for workflow background processes...');
            
            for (const pattern of this.processPatterns) {
                try {
                    let processes = [];
                    
                    if (this.isWindows) {
                        // Windows process detection will be handled separately
                        continue;
                    } else {
                        // Unix-like systems: use ps with enhanced filtering
                        processes = await this.findUnixProcesses(pattern);
                    }
                    
                    // Process the found processes
                    for (const proc of processes) {
                        if (this.isValidWorkflowProcess(proc)) {
                            // Get child processes for this parent
                            const children = await this.getChildProcesses(proc.pid);
                            
                            this.processes.push({
                                ...proc,
                                children: children,
                                safeToKill: true // Will be verified later
                            });
                        }
                    }
                } catch (error) {
                    console.log(`⚠️  Error scanning for ${pattern}: ${error.message}`);
                }
            }
            
            if (this.processes.length > 0) {
                console.log(`🔄 Found ${this.processes.length} workflow background process(es)`);
                this.processes.forEach(proc => {
                    const childInfo = proc.children.length > 0 ? ` (${proc.children.length} children)` : '';
                    console.log(`   - ${proc.name} [PID: ${proc.pid}]${childInfo}`);
                });
            }
        } catch (error) {
            console.log(`ℹ️  Background process detection failed: ${error.message}`);
        }
    }

    /**
     * Find Unix/Linux processes matching a pattern
     */
    async findUnixProcesses(pattern) {
        const processes = [];
        
        try {
            // Use ps with detailed format for better analysis
            const { stdout } = await execAsync(
                `ps axo pid,ppid,user,comm,args | grep -i "${pattern}" | grep -v grep | grep -v "uninstall" || true`
            );
            
            const lines = stdout.split('\n').filter(line => line.trim());
            
            for (const line of lines) {
                const match = line.trim().match(/^\s*(\d+)\s+(\d+)\s+(\S+)\s+(\S+)\s+(.*)$/);
                if (match) {
                    const [, pid, ppid, user, comm, args] = match;
                    
                    processes.push({
                        pid: parseInt(pid),
                        ppid: parseInt(ppid),
                        user: user,
                        name: pattern,
                        comm: comm,
                        command: args.substring(0, 150), // Truncate long commands
                        type: 'background',
                        platform: 'unix'
                    });
                }
            }
        } catch (error) {
            // Process search failed for this pattern
        }
        
        return processes;
    }

    /**
     * Validate if a process is actually a workflow process
     */
    isValidWorkflowProcess(proc) {
        // Skip if it's our own uninstall process
        if (proc.command.toLowerCase().includes('uninstall')) {
            return false;
        }
        
        // Skip system processes
        if (this.systemProcessWhitelist.some(sys => 
            proc.comm.toLowerCase().includes(sys) || 
            proc.command.toLowerCase().includes(sys)
        )) {
            return false;
        }
        
        // Check if process has workflow-related arguments or names
        const workflowIndicators = [
            'ai-workflow', 'queen-', 'hive-mind', 'claude-flow', 
            'sparc', 'workflow-runner', 'orchestrator'
        ];
        
        return workflowIndicators.some(indicator => 
            proc.command.toLowerCase().includes(indicator) ||
            proc.comm.toLowerCase().includes(indicator)
        );
    }

    /**
     * Windows PowerShell process detection
     */
    async detectWindowsProcesses() {
        try {
            console.log('🔍 Scanning Windows processes with PowerShell...');
            
            for (const pattern of this.processPatterns) {
                try {
                    // Use PowerShell to find processes with detailed information
                    const psCommand = `Get-Process | Where-Object {$_.ProcessName -like "*${pattern}*" -or $_.Path -like "*${pattern}*"} | Select-Object Id,ProcessName,Path,StartTime | ConvertTo-Json`;
                    
                    const { stdout } = await execAsync(`powershell -Command "${psCommand}" 2>nul || echo "[]"`);
                    
                    let processes = [];
                    try {
                        const parsed = JSON.parse(stdout || '[]');
                        processes = Array.isArray(parsed) ? parsed : [parsed];
                    } catch (e) {
                        continue; // Invalid JSON, skip
                    }
                    
                    for (const proc of processes) {
                        if (proc && proc.Id && this.isValidWindowsProcess(proc, pattern)) {
                            // Get child processes
                            const children = await this.getWindowsChildProcesses(proc.Id);
                            
                            this.processes.push({
                                pid: proc.Id,
                                name: pattern,
                                processName: proc.ProcessName,
                                path: proc.Path || 'Unknown',
                                command: proc.Path || proc.ProcessName,
                                startTime: proc.StartTime,
                                children: children,
                                type: 'background',
                                platform: 'windows',
                                safeToKill: true
                            });
                        }
                    }
                } catch (error) {
                    console.log(`⚠️  Error scanning Windows processes for ${pattern}: ${error.message}`);
                }
            }
        } catch (error) {
            console.log(`ℹ️  Windows process detection failed: ${error.message}`);
        }
    }

    /**
     * Validate Windows processes
     */
    isValidWindowsProcess(proc, pattern) {
        if (!proc.ProcessName) return false;
        
        // Skip system processes
        const systemProcesses = ['System', 'smss', 'csrss', 'wininit', 'winlogon', 'services', 'lsass'];
        if (systemProcesses.includes(proc.ProcessName)) {
            return false;
        }
        
        // Check for workflow indicators
        const name = proc.ProcessName.toLowerCase();
        const path = (proc.Path || '').toLowerCase();
        
        return name.includes(pattern.toLowerCase()) || path.includes(pattern.toLowerCase());
    }

    /**
     * Get Windows child processes using PowerShell
     */
    async getWindowsChildProcesses(parentPid) {
        try {
            const psCommand = `Get-CimInstance Win32_Process | Where-Object {$_.ParentProcessId -eq ${parentPid}} | Select-Object ProcessId,Name | ConvertTo-Json`;
            const { stdout } = await execAsync(`powershell -Command "${psCommand}" 2>nul || echo "[]"`);
            
            const parsed = JSON.parse(stdout || '[]');
            const children = Array.isArray(parsed) ? parsed : [parsed];
            
            return children.filter(child => child && child.ProcessId).map(child => ({
                pid: child.ProcessId,
                name: child.Name
            }));
        } catch (error) {
            return [];
        }
    }

    /**
     * Build process tree for better analysis
     */
    async buildProcessTree() {
        try {
            if (this.isWindows) {
                await this.buildWindowsProcessTree();
            } else {
                await this.buildUnixProcessTree();
            }
        } catch (error) {
            console.log(`⚠️  Process tree building failed: ${error.message}`);
        }
    }

    /**
     * Build Unix process tree
     */
    async buildUnixProcessTree() {
        try {
            const { stdout } = await execAsync('ps axo pid,ppid 2>/dev/null || true');
            const lines = stdout.split('\n').filter(line => line.trim());
            
            // Skip header line
            for (let i = 1; i < lines.length; i++) {
                const match = lines[i].trim().match(/^\s*(\d+)\s+(\d+)$/);
                if (match) {
                    const [, pid, ppid] = match;
                    const pidNum = parseInt(pid);
                    const ppidNum = parseInt(ppid);
                    
                    if (!this.processTree.has(ppidNum)) {
                        this.processTree.set(ppidNum, []);
                    }
                    this.processTree.get(ppidNum).push(pidNum);
                }
            }
        } catch (error) {
            // Process tree building failed
        }
    }

    /**
     * Build Windows process tree
     */
    async buildWindowsProcessTree() {
        try {
            const psCommand = 'Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId | ConvertTo-Json';
            const { stdout } = await execAsync(`powershell -Command "${psCommand}" 2>nul || echo "[]"`);
            
            const parsed = JSON.parse(stdout || '[]');
            const processes = Array.isArray(parsed) ? parsed : [parsed];
            
            for (const proc of processes) {
                if (proc && proc.ProcessId && proc.ParentProcessId) {
                    const ppid = proc.ParentProcessId;
                    const pid = proc.ProcessId;
                    
                    if (!this.processTree.has(ppid)) {
                        this.processTree.set(ppid, []);
                    }
                    this.processTree.get(ppid).push(pid);
                }
            }
        } catch (error) {
            // Process tree building failed
        }
    }

    /**
     * Get child processes for a given PID
     */
    async getChildProcesses(pid) {
        const children = [];
        
        try {
            if (this.isWindows) {
                return await this.getWindowsChildProcesses(pid);
            } else {
                // Unix systems
                const { stdout } = await execAsync(`ps --ppid ${pid} -o pid,comm --no-headers 2>/dev/null || true`);
                const lines = stdout.split('\n').filter(line => line.trim());
                
                for (const line of lines) {
                    const match = line.trim().match(/^\s*(\d+)\s+(.+)$/);
                    if (match) {
                        const [, childPid, comm] = match;
                        children.push({
                            pid: parseInt(childPid),
                            name: comm
                        });
                    }
                }
            }
        } catch (error) {
            // Child process detection failed
        }
        
        return children;
    }

    /**
     * Verify process safety before termination
     */
    async verifyProcessSafety() {
        console.log('🔒 Verifying process ownership and safety...');
        
        // Verify tmux sessions
        for (const session of this.tmuxSessions) {
            session.safeToKill = await this.isTmuxSessionSafe(session);
        }
        
        // Verify background processes
        for (const process of this.processes) {
            process.safeToKill = await this.isProcessSafe(process);
        }
        
        const unsafeCount = [...this.tmuxSessions, ...this.processes]
            .filter(item => !item.safeToKill).length;
        
        if (unsafeCount > 0) {
            console.log(`⚠️  ${unsafeCount} items marked as potentially unsafe to terminate`);
        }
    }

    /**
     * Check if tmux session is safe to kill
     */
    async isTmuxSessionSafe(session) {
        try {
            // Check if session has any critical processes
            for (const window of session.details.windows || []) {
                if (window.command) {
                    const criticalCommands = ['sudo', 'root', 'system', 'kernel'];
                    if (criticalCommands.some(cmd => window.command.toLowerCase().includes(cmd))) {
                        return false;
                    }
                }
            }
            return true;
        } catch (error) {
            return false; // If we can't verify, err on the side of caution
        }
    }

    /**
     * Check if process is safe to kill
     */
    async isProcessSafe(process) {
        try {
            // Check if process is owned by current user
            const currentUser = process.env?.USER || process.env?.USERNAME || 'unknown';
            if (process.user && process.user !== currentUser && process.user !== 'root') {
                return false; // Don't kill other users' processes
            }
            
            // Check if it's a critical system process
            const criticalProcesses = ['init', 'kernel', 'systemd', 'dbus'];
            if (criticalProcesses.some(crit => 
                process.comm?.toLowerCase().includes(crit) ||
                process.command?.toLowerCase().includes(crit)
            )) {
                return false;
            }
            
            // Additional safety checks
            if (process.pid === 1 || process.pid === 0) {
                return false; // Never kill init or kernel
            }
            
            return true;
        } catch (error) {
            return false; // If we can't verify, don't kill
        }
    }

    /**
     * Enhanced stop all detected processes (Phase 5 implementation)
     */
    async stopAll(config = {}) {
        const results = {
            stopped: [],
            failed: [],
            skipped: []
        };

        console.log(`🛑 ${config.dryRun ? '[DRY RUN] ' : ''}Stopping detected workflow processes...`);

        // Stop tmux sessions first
        await this.stopTmuxSessions(results, config);
        
        // Stop background processes (including children)
        await this.stopBackgroundProcesses(results, config);

        // Summary
        const total = results.stopped.length + results.failed.length + results.skipped.length;
        console.log(`📊 Process termination summary:`);
        console.log(`   ✅ Stopped: ${results.stopped.length}`);
        console.log(`   ❌ Failed: ${results.failed.length}`);
        console.log(`   ⏭️  Skipped: ${results.skipped.length}`);
        console.log(`   📈 Total: ${total}`);

        return results;
    }

    /**
     * Stop tmux sessions with safety checks
     */
    async stopTmuxSessions(results, config) {
        for (const session of this.tmuxSessions) {
            try {
                // Safety check
                if (!session.safeToKill) {
                    results.skipped.push({ ...session, reason: 'Safety check failed' });
                    console.log(`⏭️  Skipped tmux session: ${session.name} (unsafe)`);
                    continue;
                }

                if (!config.dryRun) {
                    await execAsync(session.command);
                    
                    // Verify session was terminated
                    const { stdout } = await execAsync(`tmux has-session -t "${session.name}" 2>/dev/null && echo "exists" || echo "gone"`);
                    if (stdout.trim() === "exists") {
                        throw new Error("Session still exists after termination attempt");
                    }
                }
                
                results.stopped.push(session);
                console.log(`✅ ${config.dryRun ? '[DRY RUN] ' : ''}Stopped tmux session: ${session.name}`);
            } catch (error) {
                results.failed.push({ ...session, error: error.message });
                console.error(`❌ Failed to stop tmux session: ${session.name} - ${error.message}`);
            }
        }
    }

    /**
     * Stop background processes with graceful shutdown
     */
    async stopBackgroundProcesses(results, config) {
        for (const process of this.processes) {
            try {
                // Safety check
                if (!process.safeToKill) {
                    results.skipped.push({ ...process, reason: 'Safety check failed' });
                    console.log(`⏭️  Skipped process: ${process.name} [PID: ${process.pid}] (unsafe)`);
                    continue;
                }

                if (!config.dryRun) {
                    await this.terminateProcessGracefully(process);
                }
                
                results.stopped.push(process);
                console.log(`✅ ${config.dryRun ? '[DRY RUN] ' : ''}Stopped process: ${process.name} [PID: ${process.pid}]`);
                
                // Stop child processes if any
                if (process.children && process.children.length > 0) {
                    await this.stopChildProcesses(process.children, results, config);
                }
            } catch (error) {
                results.failed.push({ ...process, error: error.message });
                console.error(`❌ Failed to stop process: ${process.name} [PID: ${process.pid}] - ${error.message}`);
            }
        }
    }

    /**
     * Gracefully terminate a process
     */
    async terminateProcessGracefully(process) {
        if (this.isWindows) {
            // Windows: Use taskkill with graceful and force options
            try {
                // Try graceful termination first
                await execAsync(`taskkill /PID ${process.pid} 2>nul`);
                
                // Wait and check if process is still running
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const isRunning = await this.isProcessRunning(process.pid);
                if (isRunning) {
                    // Force kill if still running
                    await execAsync(`taskkill /F /PID ${process.pid} 2>nul`);
                }
            } catch (error) {
                // Force kill as fallback
                await execAsync(`taskkill /F /PID ${process.pid} 2>nul`);
            }
        } else {
            // Unix: Use signal escalation
            try {
                // Try graceful shutdown first (SIGTERM)
                await execAsync(`kill -TERM ${process.pid} 2>/dev/null`);
                
                // Wait for graceful shutdown
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                // Check if process is still running
                const isRunning = await this.isProcessRunning(process.pid);
                if (isRunning) {
                    // Force kill if still running (SIGKILL)
                    await execAsync(`kill -9 ${process.pid} 2>/dev/null`);
                }
            } catch (error) {
                // Process might already be dead
                if (!error.message.includes('No such process')) {
                    throw error;
                }
            }
        }
    }

    /**
     * Stop child processes
     */
    async stopChildProcesses(children, results, config) {
        for (const child of children) {
            try {
                if (!config.dryRun) {
                    if (this.isWindows) {
                        await execAsync(`taskkill /F /PID ${child.pid} 2>nul || true`);
                    } else {
                        await execAsync(`kill -9 ${child.pid} 2>/dev/null || true`);
                    }
                }
                
                console.log(`   ↳ ${config.dryRun ? '[DRY RUN] ' : ''}Stopped child: ${child.name} [PID: ${child.pid}]`);
            } catch (error) {
                console.log(`   ↳ ❌ Failed to stop child: ${child.name} [PID: ${child.pid}]`);
            }
        }
    }

    /**
     * Enhanced cross-platform process running check
     */
    async isProcessRunning(pid) {
        try {
            if (this.isWindows) {
                const { stdout } = await execAsync(`tasklist /FI "PID eq ${pid}" /FO CSV 2>nul | find "${pid}" || echo ""`);
                return stdout.trim() !== '';
            } else {
                const { stdout } = await execAsync(`ps -p ${pid} -o pid= 2>/dev/null || echo ""`);
                return stdout.trim() !== '';
            }
        } catch (error) {
            return false;
        }
    }

    /**
     * Enhanced cross-platform process details
     */
    async getProcessDetails(pid) {
        try {
            if (this.isWindows) {
                const psCommand = `Get-Process -Id ${pid} | Select-Object Id,ProcessName,Path,StartTime,WorkingSet | ConvertTo-Json`;
                const { stdout } = await execAsync(`powershell -Command "${psCommand}" 2>nul || echo "null"`);
                
                try {
                    return JSON.parse(stdout);
                } catch (e) {
                    return null;
                }
            } else {
                const { stdout } = await execAsync(`ps -p ${pid} -o pid,ppid,user,comm,args 2>/dev/null || echo ""`);
                const lines = stdout.split('\n').filter(line => line.trim());
                if (lines.length > 1) {
                    return lines[1];  // Skip header
                }
                return null;
            }
        } catch (error) {
            return null;
        }
    }

    /**
     * Get comprehensive process report for debugging
     */
    async getProcessReport() {
        const report = {
            platform: this.platform,
            timestamp: new Date().toISOString(),
            summary: {
                totalProcesses: this.processes.length,
                totalTmuxSessions: this.tmuxSessions.length,
                processTreeSize: this.processTree.size
            },
            processes: this.processes.map(p => ({
                pid: p.pid,
                name: p.name,
                command: p.command.substring(0, 50) + (p.command.length > 50 ? '...' : ''),
                safeToKill: p.safeToKill,
                childCount: p.children ? p.children.length : 0
            })),
            tmuxSessions: this.tmuxSessions.map(s => ({
                name: s.name,
                windows: s.windows || 0,
                safeToKill: s.safeToKill
            })),
            safetyChecks: {
                unsafeProcesses: this.processes.filter(p => !p.safeToKill).length,
                unsafeTmuxSessions: this.tmuxSessions.filter(s => !s.safeToKill).length
            }
        };

        return report;
    }

    /**
     * Force refresh detection (re-run all detection methods)
     */
    async refresh() {
        // Clear previous results
        this.processes = [];
        this.tmuxSessions = [];
        this.processTree.clear();
        
        // Re-run detection
        return await this.detect();
    }
}

// Enhanced exports with backward compatibility
module.exports = {
    /**
     * Main detection function for backward compatibility
     * Used by the plan builder and other existing code
     */
    detectProcesses: async (options = {}) => {
        const manager = new ProcessManager(options);
        const result = await manager.detect();
        
        // Return combined list for plan builder (backward compatibility)
        return [...result.tmuxSessions, ...result.processes];
    },

    /**
     * Enhanced detection function that returns full details
     * For new code that needs comprehensive process information
     */
    detectProcessesDetailed: async (options = {}) => {
        const manager = new ProcessManager(options);
        return await manager.detect();
    },

    /**
     * Stop all workflow processes
     * For Phase 5 implementation and integration
     */
    stopAllProcesses: async (config = {}) => {
        const manager = new ProcessManager(config);
        await manager.detect();
        return await manager.stopAll(config);
    },

    /**
     * Get comprehensive process report
     * For debugging and monitoring
     */
    getProcessReport: async (options = {}) => {
        const manager = new ProcessManager(options);
        await manager.detect();
        return await manager.getProcessReport();
    },

    /**
     * ProcessManager class export for advanced usage
     */
    ProcessManager,

    /**
     * Utility functions
     */
    utils: {
        /**
         * Check if a specific PID is running
         */
        isProcessRunning: async (pid) => {
            const manager = new ProcessManager();
            return await manager.isProcessRunning(pid);
        },

        /**
         * Get details for a specific PID
         */
        getProcessDetails: async (pid) => {
            const manager = new ProcessManager();
            return await manager.getProcessDetails(pid);
        },

        /**
         * Platform detection
         */
        getPlatform: () => {
            return {
                platform: os.platform(),
                isWindows: os.platform() === 'win32',
                arch: os.arch(),
                release: os.release()
            };
        }
    }
};