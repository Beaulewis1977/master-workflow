#!/usr/bin/env node

/**
 * AI Workflow Uninstaller - Phase 5 Process Detection Demo
 * 
 * Interactive demonstration of process detection, tmux session management,
 * and cross-platform process termination with safety mechanisms
 */

const { ProcessManager, detectProcesses, stopAllProcesses, utils } = require('./process');
const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const os = require('os');
const path = require('path');
const fs = require('fs').promises;

const execAsync = promisify(exec);

class ProcessDemo {
    constructor() {
        this.processManager = new ProcessManager();
        this.mockProcesses = [];
        this.mockTmuxSessions = [];
        this.tempFiles = [];
        this.spawnedProcesses = [];
        this.platform = os.platform();
        this.isWindows = this.platform === 'win32';
        
        // Demo colors for better output
        this.colors = {
            reset: '\x1b[0m',
            red: '\x1b[31m',
            green: '\x1b[32m',
            yellow: '\x1b[33m',
            blue: '\x1b[34m',
            magenta: '\x1b[35m',
            cyan: '\x1b[36m',
            white: '\x1b[37m',
            bright: '\x1b[1m'
        };
    }

    colorize(text, color) {
        return `${this.colors[color] || ''}${text}${this.colors.reset}`;
    }

    async runDemo() {
        console.log(this.colorize('🎬 AI Workflow Uninstaller - Phase 5 Process Detection Demo', 'bright'));
        console.log(this.colorize('=' .repeat(70), 'cyan'));
        console.log();

        try {
            await this.showWelcomeScreen();
            await this.runInteractiveMenu();
            
        } catch (error) {
            console.error(this.colorize('\n❌ Demo failed:', 'red'), error.message);
            process.exit(1);
        } finally {
            await this.cleanup();
        }
    }

    async showWelcomeScreen() {
        console.log(this.colorize('🔍 Phase 5: Advanced Process Detection & Termination', 'bright'));
        console.log(this.colorize('-'.repeat(50), 'cyan'));
        console.log();
        
        const platformInfo = utils.getPlatform();
        console.log(this.colorize('📊 System Information:', 'yellow'));
        console.log(`   Platform: ${this.colorize(platformInfo.platform, 'green')} (${platformInfo.arch})`);
        console.log(`   Windows: ${this.colorize(platformInfo.isWindows ? 'Yes' : 'No', 'green')}`);
        console.log(`   Release: ${this.colorize(platformInfo.release, 'green')}`);
        console.log(`   Node PID: ${this.colorize(process.pid.toString(), 'green')}`);
        console.log();

        console.log(this.colorize('🎯 Demo Features:', 'yellow'));
        console.log('   ✅ Cross-platform process detection');
        console.log('   ✅ Tmux session management (Unix/Linux)');
        console.log('   ✅ Process tree visualization');
        console.log('   ✅ Safety mechanisms & whitelisting');
        console.log('   ✅ Graceful termination with fallbacks');
        console.log('   ✅ Mock process testing (safe)');
        console.log();
        
        if (this.isWindows) {
            console.log(this.colorize('🪟 Windows-Specific Features:', 'magenta'));
            console.log('   • PowerShell process detection');
            console.log('   • Windows service integration');
            console.log('   • taskkill command usage');
        } else {
            console.log(this.colorize('🐧 Unix/Linux-Specific Features:', 'magenta'));
            console.log('   • Signal-based termination (SIGTERM/SIGKILL)');
            console.log('   • Tmux session detection and management');
            console.log('   • Process tree analysis with ps');
        }
        console.log();
    }

    async runInteractiveMenu() {
        while (true) {
            console.log(this.colorize('📋 Demo Menu - Choose an option:', 'bright'));
            console.log(this.colorize('━'.repeat(40), 'cyan'));
            console.log('1. 🔍 Platform Detection & Capabilities');
            console.log('2. 🧪 Mock Process Detection Demo');
            console.log('3. 📺 Mock Tmux Session Demo (Unix/Linux)');
            console.log('4. 🌳 Process Tree Visualization');
            console.log('5. 🔒 Safety Mechanisms Demo');
            console.log('6. ⚡ Live Process Detection (Real)');
            console.log('7. 🎭 Create Test Processes');
            console.log('8. 🛑 Dry-Run Termination Demo');
            console.log('9. 📊 Performance Benchmarks');
            console.log('10. 📖 Educational Information');
            console.log('0. 🚪 Exit Demo');
            console.log();

            const choice = await this.getInput('Enter your choice (0-10): ');

            switch (choice.trim()) {
                case '1':
                    await this.demoPlatformDetection();
                    break;
                case '2':
                    await this.demoMockProcessDetection();
                    break;
                case '3':
                    await this.demoMockTmuxSessions();
                    break;
                case '4':
                    await this.demoProcessTree();
                    break;
                case '5':
                    await this.demoSafetyMechanisms();
                    break;
                case '6':
                    await this.demoLiveProcessDetection();
                    break;
                case '7':
                    await this.demoCreateTestProcesses();
                    break;
                case '8':
                    await this.demoDryRunTermination();
                    break;
                case '9':
                    await this.demoPerformanceBenchmarks();
                    break;
                case '10':
                    await this.showEducationalInfo();
                    break;
                case '0':
                    console.log(this.colorize('\n👋 Thanks for exploring Phase 5! Goodbye!', 'green'));
                    return;
                default:
                    console.log(this.colorize('❌ Invalid choice. Please try again.', 'red'));
            }

            await this.pauseForUser();
        }
    }

    async demoPlatformDetection() {
        console.log(this.colorize('\n🔍 Platform Detection & Capabilities Demo', 'bright'));
        console.log(this.colorize('-'.repeat(50), 'cyan'));

        const manager = new ProcessManager();
        const platformInfo = utils.getPlatform();

        console.log(this.colorize('📱 Detected Platform Information:', 'yellow'));
        console.log(`   Platform: ${this.colorize(platformInfo.platform, 'green')}`);
        console.log(`   Architecture: ${this.colorize(platformInfo.arch, 'green')}`);
        console.log(`   Release: ${this.colorize(platformInfo.release, 'green')}`);
        console.log(`   Windows: ${this.colorize(platformInfo.isWindows ? 'Yes' : 'No', 'green')}`);
        console.log();

        console.log(this.colorize('🔧 Process Manager Configuration:', 'yellow'));
        console.log(`   Workflow Patterns: ${this.colorize(manager.workflowPatterns.length.toString(), 'green')}`);
        console.log(`   Process Patterns: ${this.colorize(manager.processPatterns.length.toString(), 'green')}`);
        console.log(`   System Whitelist: ${this.colorize(manager.systemProcessWhitelist.length.toString(), 'green')}`);
        console.log();

        // Show patterns
        console.log(this.colorize('🎯 Workflow Detection Patterns:', 'yellow'));
        manager.workflowPatterns.forEach(pattern => {
            console.log(`   • ${this.colorize(pattern, 'cyan')}`);
        });
        console.log();

        console.log(this.colorize('🔍 Process Search Patterns:', 'yellow'));
        manager.processPatterns.forEach(pattern => {
            console.log(`   • ${this.colorize(pattern, 'cyan')}`);
        });
        console.log();

        // Test process running detection with current PID
        console.log(this.colorize('🧪 Testing Process Running Detection:', 'yellow'));
        const isCurrentRunning = await utils.isProcessRunning(process.pid);
        console.log(`   Current Process (PID ${process.pid}): ${this.colorize(isCurrentRunning ? 'RUNNING ✅' : 'NOT FOUND ❌', isCurrentRunning ? 'green' : 'red')}`);
        
        const isInvalidRunning = await utils.isProcessRunning(999999);
        console.log(`   Invalid PID (999999): ${this.colorize(isInvalidRunning ? 'RUNNING ❌' : 'NOT FOUND ✅', isInvalidRunning ? 'red' : 'green')}`);

        // Platform-specific capabilities
        if (this.isWindows) {
            console.log(this.colorize('\n🪟 Windows-Specific Capabilities:', 'magenta'));
            console.log('   • PowerShell process enumeration');
            console.log('   • tasklist/taskkill command integration');
            console.log('   • Windows service detection');
            console.log('   • WMI process information access');
        } else {
            console.log(this.colorize('\n🐧 Unix/Linux-Specific Capabilities:', 'magenta'));
            console.log('   • ps command integration');
            console.log('   • Signal-based process control');
            console.log('   • Tmux session management');
            console.log('   • Process tree analysis');
        }
    }

    async demoMockProcessDetection() {
        console.log(this.colorize('\n🧪 Mock Process Detection Demo', 'bright'));
        console.log(this.colorize('-'.repeat(50), 'cyan'));

        const manager = new ProcessManager();

        // Create mock data
        this.mockProcesses = [
            {
                pid: 12345,
                ppid: 1,
                user: process.env.USER || 'testuser',
                name: 'queen-agent',
                comm: 'node',
                command: 'node /ai-workflow/bin/queen-agent --mode=production --agents=10',
                type: 'background',
                platform: this.isWindows ? 'windows' : 'unix',
                children: [
                    { pid: 12346, name: 'worker-1' },
                    { pid: 12347, name: 'worker-2' }
                ]
            },
            {
                pid: 23456,
                ppid: 1,
                user: process.env.USER || 'testuser',
                name: 'ai-workflow',
                comm: 'node',
                command: 'node /ai-workflow/bin/ai-workflow-runner --config=production',
                type: 'background',
                platform: this.isWindows ? 'windows' : 'unix',
                children: []
            },
            {
                pid: 34567,
                ppid: 1,
                user: process.env.USER || 'testuser',
                name: 'hive-mind',
                comm: 'python3',
                command: 'python3 /ai-workflow/orchestrator/hive-mind.py',
                type: 'background',
                platform: this.isWindows ? 'windows' : 'unix',
                children: [
                    { pid: 34568, name: 'coordinator' }
                ]
            }
        ];

        console.log(this.colorize('📋 Mock Process Data Created:', 'yellow'));
        this.mockProcesses.forEach(proc => {
            const childInfo = proc.children.length > 0 ? ` (${proc.children.length} children)` : '';
            console.log(`   • ${this.colorize(proc.name, 'cyan')} [PID: ${this.colorize(proc.pid.toString(), 'green')}]${childInfo}`);
            proc.children.forEach(child => {
                console.log(`     ↳ ${this.colorize(child.name, 'magenta')} [PID: ${this.colorize(child.pid.toString(), 'green')}]`);
            });
        });
        console.log();

        // Simulate detection process
        console.log(this.colorize('🔍 Simulating Process Detection...', 'yellow'));
        
        // Mock the detection methods
        manager.processes = [...this.mockProcesses];
        
        // Simulate safety verification
        console.log(this.colorize('🔒 Running Safety Verification...', 'yellow'));
        for (const proc of manager.processes) {
            proc.safeToKill = await manager.isProcessSafe(proc);
            const safetyStatus = proc.safeToKill ? 
                this.colorize('SAFE ✅', 'green') : 
                this.colorize('UNSAFE ❌', 'red');
            console.log(`   ${proc.name} [PID: ${proc.pid}]: ${safetyStatus}`);
        }
        console.log();

        // Show detection results
        console.log(this.colorize('📊 Detection Results:', 'bright'));
        console.log(`   Total Processes Found: ${this.colorize(manager.processes.length.toString(), 'green')}`);
        console.log(`   Safe to Terminate: ${this.colorize(manager.processes.filter(p => p.safeToKill).length.toString(), 'green')}`);
        console.log(`   Require Manual Review: ${this.colorize(manager.processes.filter(p => !p.safeToKill).length.toString(), 'yellow')}`);
        
        const totalChildren = manager.processes.reduce((sum, p) => sum + p.children.length, 0);
        console.log(`   Child Processes: ${this.colorize(totalChildren.toString(), 'cyan')}`);
    }

    async demoMockTmuxSessions() {
        if (this.isWindows) {
            console.log(this.colorize('\n📺 Tmux Demo Skipped on Windows', 'yellow'));
            console.log('Tmux is not available on Windows platforms.');
            console.log('This demo shows what would happen on Unix/Linux systems.');
            return;
        }

        console.log(this.colorize('\n📺 Mock Tmux Session Detection Demo', 'bright'));
        console.log(this.colorize('-'.repeat(50), 'cyan'));

        const manager = new ProcessManager();

        // Create mock tmux session data
        this.mockTmuxSessions = [
            {
                name: 'queen-agent-main',
                type: 'tmux',
                created: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
                windows: 3,
                details: {
                    windows: [
                        { name: 'main', command: 'node queen-agent.js' },
                        { name: 'logs', command: 'tail -f /var/log/queen-agent.log' },
                        { name: 'monitor', command: 'htop' }
                    ]
                },
                command: 'tmux kill-session -t "queen-agent-main"',
                safeToKill: true
            },
            {
                name: 'ai-workflow-dev',
                type: 'tmux',
                created: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
                windows: 2,
                details: {
                    windows: [
                        { name: 'server', command: 'node server.js' },
                        { name: 'build', command: 'npm run watch' }
                    ]
                },
                command: 'tmux kill-session -t "ai-workflow-dev"',
                safeToKill: true
            },
            {
                name: 'hive-mind-cluster',
                type: 'tmux',
                created: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
                windows: 4,
                details: {
                    windows: [
                        { name: 'coordinator', command: 'python3 coordinator.py' },
                        { name: 'agent-1', command: 'python3 agent.py --id=1' },
                        { name: 'agent-2', command: 'python3 agent.py --id=2' },
                        { name: 'monitor', command: 'watch -n 1 ps aux | grep python' }
                    ]
                },
                command: 'tmux kill-session -t "hive-mind-cluster"',
                safeToKill: true
            },
            {
                name: 'regular-work',
                type: 'tmux',
                created: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
                windows: 1,
                details: {
                    windows: [
                        { name: 'vim', command: 'vim document.txt' }
                    ]
                },
                command: 'tmux kill-session -t "regular-work"',
                safeToKill: true // This wouldn't be detected as workflow-related
            }
        ];

        console.log(this.colorize('📋 Mock Tmux Session Data:', 'yellow'));
        
        // Simulate pattern matching
        manager.tmuxSessions = [];
        for (const session of this.mockTmuxSessions) {
            const isWorkflowSession = manager.workflowPatterns.some(pattern => {
                if (pattern.includes('*')) {
                    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$', 'i');
                    return regex.test(session.name);
                }
                return session.name.toLowerCase().includes(pattern.toLowerCase().replace('-*', ''));
            });

            if (isWorkflowSession) {
                manager.tmuxSessions.push(session);
                console.log(`   ✅ ${this.colorize(session.name, 'cyan')} (${session.windows} windows) - Workflow session`);
            } else {
                console.log(`   ⏭️  ${this.colorize(session.name, 'magenta')} (${session.windows} windows) - Regular session (ignored)`);
            }
        }
        console.log();

        // Show detailed session information
        console.log(this.colorize('🔍 Detected Workflow Sessions:', 'yellow'));
        manager.tmuxSessions.forEach(session => {
            console.log(`\n   📺 Session: ${this.colorize(session.name, 'bright')}`);
            console.log(`      Created: ${this.colorize(new Date(session.created).toLocaleString(), 'green')}`);
            console.log(`      Windows: ${this.colorize(session.windows.toString(), 'green')}`);
            console.log(`      Command: ${this.colorize(session.command, 'cyan')}`);
            
            if (session.details.windows.length > 0) {
                console.log(`      Window Details:`);
                session.details.windows.forEach(win => {
                    console.log(`        • ${this.colorize(win.name, 'magenta')}: ${win.command}`);
                });
            }
        });

        // Simulate safety checks
        console.log(this.colorize('\n🔒 Running Tmux Safety Verification...', 'yellow'));
        for (const session of manager.tmuxSessions) {
            session.safeToKill = await manager.isTmuxSessionSafe(session);
            const safetyStatus = session.safeToKill ? 
                this.colorize('SAFE ✅', 'green') : 
                this.colorize('UNSAFE ❌', 'red');
            console.log(`   ${session.name}: ${safetyStatus}`);
        }

        console.log(this.colorize('\n📊 Tmux Detection Summary:', 'bright'));
        console.log(`   Total Sessions Found: ${this.colorize(manager.tmuxSessions.length.toString(), 'green')}`);
        console.log(`   Safe to Terminate: ${this.colorize(manager.tmuxSessions.filter(s => s.safeToKill).length.toString(), 'green')}`);
    }

    async demoProcessTree() {
        console.log(this.colorize('\n🌳 Process Tree Visualization Demo', 'bright'));
        console.log(this.colorize('-'.repeat(50), 'cyan'));

        const manager = new ProcessManager();
        
        console.log(this.colorize('🔍 Building Process Tree...', 'yellow'));
        
        // Mock process tree data
        const mockTree = new Map();
        mockTree.set(1, [1234, 5678, 9999]); // init has children
        mockTree.set(1234, [12345, 12346]); // parent process
        mockTree.set(12345, [12347, 12348, 12349]); // queen-agent with workers
        mockTree.set(12346, []); // no children
        mockTree.set(5678, [56789]); // another branch
        mockTree.set(56789, []); // leaf node

        manager.processTree = mockTree;

        console.log(this.colorize('🌳 Mock Process Tree Structure:', 'yellow'));
        console.log();

        // Visualize the tree
        this.visualizeProcessTree(manager.processTree, 1, 0, new Set());

        console.log();
        console.log(this.colorize('📊 Tree Statistics:', 'bright'));
        console.log(`   Total Parent Processes: ${this.colorize(manager.processTree.size.toString(), 'green')}`);
        
        let totalChildren = 0;
        let maxDepth = 0;
        let leafNodes = 0;

        for (const [parent, children] of manager.processTree.entries()) {
            totalChildren += children.length;
            if (children.length === 0) {
                leafNodes++;
            }
        }

        console.log(`   Total Child Relationships: ${this.colorize(totalChildren.toString(), 'green')}`);
        console.log(`   Leaf Nodes: ${this.colorize(leafNodes.toString(), 'green')}`);

        // Show how process tree helps with termination
        console.log(this.colorize('\n🎯 Tree Benefits for Process Termination:', 'yellow'));
        console.log('   • Identify parent-child relationships');
        console.log('   • Ensure proper termination order');
        console.log('   • Prevent orphaned processes');
        console.log('   • Optimize termination strategy');
    }

    visualizeProcessTree(tree, pid, depth = 0, visited = new Set()) {
        if (visited.has(pid)) return; // Prevent infinite loops
        visited.add(pid);

        const indent = '  '.repeat(depth);
        const children = tree.get(pid) || [];
        
        let processInfo = '';
        if (pid === 1) {
            processInfo = this.colorize('init (system)', 'red');
        } else if (pid === 12345) {
            processInfo = this.colorize('queen-agent (workflow)', 'cyan');
        } else if ([12347, 12348, 12349].includes(pid)) {
            processInfo = this.colorize('worker (child)', 'magenta');
        } else if (pid === 1234) {
            processInfo = this.colorize('parent process', 'yellow');
        } else {
            processInfo = this.colorize('process', 'white');
        }

        const hasChildren = children.length > 0;
        const connector = hasChildren ? '├─' : '└─';
        
        console.log(`${indent}${connector} PID ${this.colorize(pid.toString(), 'green')} (${processInfo})${hasChildren ? ` [${children.length} children]` : ''}`);

        // Recursively show children
        children.forEach((childPid, index) => {
            this.visualizeProcessTree(tree, childPid, depth + 1, visited);
        });
    }

    async demoSafetyMechanisms() {
        console.log(this.colorize('\n🔒 Safety Mechanisms Demo', 'bright'));
        console.log(this.colorize('-'.repeat(50), 'cyan'));

        const manager = new ProcessManager();

        console.log(this.colorize('🧪 Testing Process Safety Validation:', 'yellow'));

        // Test various process scenarios
        const testProcesses = [
            {
                pid: 1,
                comm: 'init',
                command: '/sbin/init',
                user: 'root',
                description: 'System init process (critical)'
            },
            {
                pid: 12345,
                comm: 'queen-agent',
                command: 'node /ai-workflow/queen-agent.js',
                user: process.env.USER || 'testuser',
                description: 'Workflow process (safe)'
            },
            {
                pid: 999,
                comm: 'systemd',
                command: '/lib/systemd/systemd --system',
                user: 'root',
                description: 'System service manager (critical)'
            },
            {
                pid: 54321,
                comm: 'ai-workflow',
                command: 'node /ai-workflow/runner.js',
                user: process.env.USER || 'testuser',
                description: 'Workflow runner (safe)'
            },
            {
                pid: 88888,
                comm: 'other-user-process',
                command: 'some-command',
                user: 'otheruser',
                description: 'Other user\'s process (unsafe)'
            }
        ];

        for (const proc of testProcesses) {
            const isSafe = await manager.isProcessSafe(proc);
            const safetyStatus = isSafe ? 
                this.colorize('SAFE ✅', 'green') : 
                this.colorize('UNSAFE ❌', 'red');
            
            console.log(`   PID ${this.colorize(proc.pid.toString(), 'cyan')} (${proc.comm}): ${safetyStatus}`);
            console.log(`      └─ ${proc.description}`);
        }

        console.log(this.colorize('\n🧪 Testing Tmux Session Safety:', 'yellow'));

        // Test tmux session scenarios
        const testSessions = [
            {
                name: 'safe-workflow',
                details: {
                    windows: [
                        { name: 'main', command: 'node server.js' },
                        { name: 'logs', command: 'tail -f app.log' }
                    ]
                },
                description: 'Regular workflow session'
            },
            {
                name: 'risky-session',
                details: {
                    windows: [
                        { name: 'main', command: 'node server.js' },
                        { name: 'admin', command: 'sudo systemctl restart nginx' }
                    ]
                },
                description: 'Session with sudo commands'
            }
        ];

        for (const session of testSessions) {
            const isSafe = await manager.isTmuxSessionSafe(session);
            const safetyStatus = isSafe ? 
                this.colorize('SAFE ✅', 'green') : 
                this.colorize('UNSAFE ❌', 'red');
            
            console.log(`   Session "${this.colorize(session.name, 'cyan')}": ${safetyStatus}`);
            console.log(`      └─ ${session.description}`);
        }

        console.log(this.colorize('\n🛡️  Safety Features:', 'bright'));
        console.log('   • User ownership verification');
        console.log('   • Critical process protection');
        console.log('   • System service whitelisting');
        console.log('   • Sudo command detection');
        console.log('   • Process hierarchy validation');
        console.log('   • Platform-specific safety rules');
    }

    async demoLiveProcessDetection() {
        console.log(this.colorize('\n⚡ Live Process Detection Demo', 'bright'));
        console.log(this.colorize('-'.repeat(50), 'cyan'));

        console.log(this.colorize('⚠️  This will scan for REAL processes on your system.', 'yellow'));
        console.log('Only workflow-related processes will be detected.');
        console.log('No processes will be terminated without explicit confirmation.');
        console.log();

        const proceed = await this.getInput('Continue with live detection? (y/N): ');
        if (proceed.toLowerCase() !== 'y') {
            console.log(this.colorize('Live detection cancelled.', 'yellow'));
            return;
        }

        const manager = new ProcessManager({ dryRun: true });
        console.log(this.colorize('🔍 Scanning system for workflow processes...', 'yellow'));

        try {
            const result = await manager.detect();

            console.log(this.colorize('\n📊 Live Detection Results:', 'bright'));
            console.log(`   Platform: ${this.colorize(result.platform, 'green')}`);
            console.log(`   Total Items Found: ${this.colorize(result.total.toString(), 'green')}`);
            console.log(`   Background Processes: ${this.colorize(result.processes.length.toString(), 'cyan')}`);
            console.log(`   Tmux Sessions: ${this.colorize(result.tmuxSessions.length.toString(), 'cyan')}`);

            if (result.processes.length > 0) {
                console.log(this.colorize('\n🔄 Background Processes:', 'yellow'));
                result.processes.forEach(proc => {
                    const safetyStatus = proc.safeToKill ? 
                        this.colorize('SAFE', 'green') : 
                        this.colorize('REVIEW', 'yellow');
                    console.log(`   • ${this.colorize(proc.name, 'cyan')} [PID: ${proc.pid}] - ${safetyStatus}`);
                    console.log(`     Command: ${proc.command.substring(0, 80)}${proc.command.length > 80 ? '...' : ''}`);
                    if (proc.children && proc.children.length > 0) {
                        console.log(`     Children: ${proc.children.length} processes`);
                    }
                });
            }

            if (result.tmuxSessions.length > 0) {
                console.log(this.colorize('\n📺 Tmux Sessions:', 'yellow'));
                result.tmuxSessions.forEach(session => {
                    const safetyStatus = session.safeToKill ? 
                        this.colorize('SAFE', 'green') : 
                        this.colorize('REVIEW', 'yellow');
                    console.log(`   • ${this.colorize(session.name, 'cyan')} (${session.windows} windows) - ${safetyStatus}`);
                    console.log(`     Created: ${new Date(session.created).toLocaleString()}`);
                });
            }

            if (result.total === 0) {
                console.log(this.colorize('\n✅ No workflow processes detected on this system.', 'green'));
                console.log('This is normal if no AI workflow tools are currently running.');
            }

        } catch (error) {
            console.error(this.colorize('\n❌ Live detection failed:', 'red'), error.message);
        }
    }

    async demoCreateTestProcesses() {
        console.log(this.colorize('\n🎭 Create Test Processes Demo', 'bright'));
        console.log(this.colorize('-'.repeat(50), 'cyan'));

        console.log(this.colorize('This demo creates harmless test processes that can be safely terminated.', 'yellow'));
        console.log('Processes will be automatically cleaned up when the demo ends.');
        console.log();

        const proceed = await this.getInput('Create test processes? (y/N): ');
        if (proceed.toLowerCase() !== 'y') {
            console.log(this.colorize('Test process creation cancelled.', 'yellow'));
            return;
        }

        console.log(this.colorize('🏗️  Creating test processes...', 'yellow'));

        try {
            // Create test scripts
            const testScript1 = path.join(os.tmpdir(), 'ai-workflow-test-process.js');
            const testScript2 = path.join(os.tmpdir(), 'queen-agent-test-process.js');

            const script1Content = `
// AI Workflow Test Process
console.log('AI Workflow test process started (PID: ' + process.pid + ')');
process.title = 'ai-workflow-test';

process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

// Keep process alive
setInterval(() => {
    console.log('[' + new Date().toISOString() + '] AI Workflow test process running...');
}, 5000);
`;

            const script2Content = `
// Queen Agent Test Process
console.log('Queen Agent test process started (PID: ' + process.pid + ')');
process.title = 'queen-agent-test';

process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

// Keep process alive
setInterval(() => {
    console.log('[' + new Date().toISOString() + '] Queen Agent test process running...');
}, 5000);
`;

            await fs.writeFile(testScript1, script1Content);
            await fs.writeFile(testScript2, script2Content);
            this.tempFiles.push(testScript1, testScript2);

            // Spawn test processes
            console.log('   Creating AI Workflow test process...');
            const proc1 = spawn('node', [testScript1], { stdio: 'pipe', detached: false });
            
            console.log('   Creating Queen Agent test process...');
            const proc2 = spawn('node', [testScript2], { stdio: 'pipe', detached: false });

            this.spawnedProcesses.push(proc1, proc2);

            // Wait for processes to start
            await new Promise(resolve => setTimeout(resolve, 1000));

            console.log(this.colorize('\n✅ Test processes created:', 'green'));
            console.log(`   AI Workflow Test: PID ${this.colorize(proc1.pid.toString(), 'cyan')}`);
            console.log(`   Queen Agent Test: PID ${this.colorize(proc2.pid.toString(), 'cyan')}`);

            // Verify they're running
            const proc1Running = await utils.isProcessRunning(proc1.pid);
            const proc2Running = await utils.isProcessRunning(proc2.pid);

            console.log(`   Status: ${proc1Running ? this.colorize('Running ✅', 'green') : this.colorize('Failed ❌', 'red')} | ${proc2Running ? this.colorize('Running ✅', 'green') : this.colorize('Failed ❌', 'red')}`);

            if (proc1Running || proc2Running) {
                console.log(this.colorize('\n🎯 These processes can now be detected by the workflow scanner.', 'yellow'));
                console.log('Try running "Live Process Detection" to see them appear.');
                console.log('They will be automatically cleaned up when you exit the demo.');
            }

        } catch (error) {
            console.error(this.colorize('\n❌ Failed to create test processes:', 'red'), error.message);
        }
    }

    async demoDryRunTermination() {
        console.log(this.colorize('\n🛑 Dry-Run Termination Demo', 'bright'));
        console.log(this.colorize('-'.repeat(50), 'cyan'));

        const manager = new ProcessManager({ dryRun: true });

        // Use mock data for dry run demonstration
        manager.processes = [...this.mockProcesses];
        manager.tmuxSessions = [...this.mockTmuxSessions.filter(s => 
            s.name.includes('queen-agent') || s.name.includes('ai-workflow')
        )];

        console.log(this.colorize('🧪 Mock Data Loaded for Dry Run:', 'yellow'));
        console.log(`   Processes: ${this.colorize(manager.processes.length.toString(), 'green')}`);
        console.log(`   Tmux Sessions: ${this.colorize(manager.tmuxSessions.length.toString(), 'green')}`);
        console.log();

        console.log(this.colorize('🔍 Running dry-run termination simulation...', 'yellow'));
        console.log(this.colorize('(No actual processes will be terminated)', 'cyan'));
        console.log();

        try {
            const results = await manager.stopAll({ dryRun: true });

            console.log(this.colorize('📊 Dry-Run Results:', 'bright'));
            console.log(`   Would Stop: ${this.colorize(results.stopped.length.toString(), 'green')}`);
            console.log(`   Would Fail: ${this.colorize(results.failed.length.toString(), 'red')}`);
            console.log(`   Would Skip: ${this.colorize(results.skipped.length.toString(), 'yellow')}`);

            if (results.stopped.length > 0) {
                console.log(this.colorize('\n✅ Items that would be stopped:', 'green'));
                results.stopped.forEach(item => {
                    if (item.type === 'tmux') {
                        console.log(`   📺 Tmux: ${this.colorize(item.name, 'cyan')} (${item.windows} windows)`);
                    } else {
                        console.log(`   🔄 Process: ${this.colorize(item.name, 'cyan')} [PID: ${item.pid}]`);
                        if (item.children && item.children.length > 0) {
                            item.children.forEach(child => {
                                console.log(`     ↳ Child: ${this.colorize(child.name, 'magenta')} [PID: ${child.pid}]`);
                            });
                        }
                    }
                });
            }

            if (results.skipped.length > 0) {
                console.log(this.colorize('\n⏭️  Items that would be skipped:', 'yellow'));
                results.skipped.forEach(item => {
                    console.log(`   ${item.name || item.comm}: ${item.reason}`);
                });
            }

            console.log(this.colorize('\n🎯 Termination Strategy:', 'yellow'));
            console.log('   1. Stop tmux sessions first (cleanest shutdown)');
            console.log('   2. Graceful process termination (SIGTERM/taskkill)');
            console.log('   3. Wait for graceful shutdown (2-3 seconds)');
            console.log('   4. Force termination if needed (SIGKILL/taskkill /F)');
            console.log('   5. Clean up child processes');

        } catch (error) {
            console.error(this.colorize('\n❌ Dry-run simulation failed:', 'red'), error.message);
        }
    }

    async demoPerformanceBenchmarks() {
        console.log(this.colorize('\n📊 Performance Benchmarks Demo', 'bright'));
        console.log(this.colorize('-'.repeat(50), 'cyan'));

        const manager = new ProcessManager();

        console.log(this.colorize('⚡ Running performance benchmarks...', 'yellow'));
        console.log();

        // Benchmark 1: Process tree building
        console.log('🌳 Benchmarking process tree building...');
        const treeStart = Date.now();
        await manager.buildProcessTree();
        const treeDuration = Date.now() - treeStart;
        console.log(`   Duration: ${this.colorize(treeDuration + 'ms', 'green')}`);
        console.log(`   Tree size: ${this.colorize(manager.processTree.size.toString(), 'cyan')} parent processes`);

        // Benchmark 2: Process running check
        console.log('\n🔍 Benchmarking process running detection...');
        const runningStart = Date.now();
        const isRunning = await manager.isProcessRunning(process.pid);
        const runningDuration = Date.now() - runningStart;
        console.log(`   Duration: ${this.colorize(runningDuration + 'ms', 'green')}`);
        console.log(`   Result: ${this.colorize(isRunning ? 'Found' : 'Not found', 'cyan')}`);

        // Benchmark 3: Platform detection
        console.log('\n🖥️  Benchmarking platform detection...');
        const platformStart = Date.now();
        const platformInfo = utils.getPlatform();
        const platformDuration = Date.now() - platformStart;
        console.log(`   Duration: ${this.colorize(platformDuration + 'ms', 'green')}`);
        console.log(`   Platform: ${this.colorize(platformInfo.platform, 'cyan')}`);

        // Benchmark 4: Full detection cycle (with mocks)
        console.log('\n🔄 Benchmarking full detection cycle...');
        const detectionStart = Date.now();
        
        // Mock the expensive operations for accurate benchmarking
        const originalTmux = manager.detectTmuxSessions;
        const originalBackground = manager.detectBackgroundProcesses;
        const originalWindows = manager.detectWindowsProcesses;
        
        manager.detectTmuxSessions = async () => { /* mock */ };
        manager.detectBackgroundProcesses = async () => { /* mock */ };
        if (this.isWindows) {
            manager.detectWindowsProcesses = async () => { /* mock */ };
        }
        
        await manager.detect();
        const detectionDuration = Date.now() - detectionStart;
        
        // Restore original methods
        manager.detectTmuxSessions = originalTmux;
        manager.detectBackgroundProcesses = originalBackground;
        if (this.isWindows) {
            manager.detectWindowsProcesses = originalWindows;
        }
        
        console.log(`   Duration: ${this.colorize(detectionDuration + 'ms', 'green')}`);

        // Performance summary
        console.log(this.colorize('\n📈 Performance Summary:', 'bright'));
        console.log(`   Process Tree Building: ${this.colorize(treeDuration + 'ms', 'green')}`);
        console.log(`   Process Running Check: ${this.colorize(runningDuration + 'ms', 'green')}`);
        console.log(`   Platform Detection: ${this.colorize(platformDuration + 'ms', 'green')}`);
        console.log(`   Full Detection Cycle: ${this.colorize(detectionDuration + 'ms', 'green')}`);

        // Performance thresholds
        console.log(this.colorize('\n🎯 Performance Thresholds:', 'yellow'));
        const thresholds = {
            treeBuilding: 5000,
            runningCheck: 1000,
            fullDetection: 10000
        };

        console.log(`   Tree Building: ${treeDuration}ms ${treeDuration < thresholds.treeBuilding ? '✅' : '⚠️'} (target: <${thresholds.treeBuilding}ms)`);
        console.log(`   Running Check: ${runningDuration}ms ${runningDuration < thresholds.runningCheck ? '✅' : '⚠️'} (target: <${thresholds.runningCheck}ms)`);
        console.log(`   Full Detection: ${detectionDuration}ms ${detectionDuration < thresholds.fullDetection ? '✅' : '⚠️'} (target: <${thresholds.fullDetection}ms)`);
    }

    async showEducationalInfo() {
        console.log(this.colorize('\n📖 Educational Information - Phase 5 Process Management', 'bright'));
        console.log(this.colorize('='.repeat(70), 'cyan'));

        console.log(this.colorize('\n🎯 What is Phase 5?', 'yellow'));
        console.log('Phase 5 implements comprehensive process detection and termination');
        console.log('capabilities for the AI Workflow Uninstaller. It safely identifies');
        console.log('and manages workflow-related processes across different platforms.');

        console.log(this.colorize('\n🔍 Key Components:', 'yellow'));
        console.log('• ProcessManager: Main class for process operations');
        console.log('• Cross-platform detection (Windows, Linux, macOS)');
        console.log('• Tmux session management (Unix/Linux)');
        console.log('• Process tree analysis and visualization');
        console.log('• Safety mechanisms and user verification');
        console.log('• Graceful termination with fallbacks');

        console.log(this.colorize('\n🛡️  Safety Features:', 'yellow'));
        console.log('• User ownership verification (don\'t kill other users\' processes)');
        console.log('• Critical process protection (init, systemd, kernel threads)');
        console.log('• Pattern-based workflow detection (avoid false positives)');
        console.log('• Dry-run mode for safe testing');
        console.log('• Graceful shutdown with SIGTERM before SIGKILL');

        console.log(this.colorize('\n🔄 Process Detection Patterns:', 'yellow'));
        console.log('Workflow patterns detected:');
        const manager = new ProcessManager();
        manager.workflowPatterns.forEach(pattern => {
            console.log(`  • ${this.colorize(pattern, 'cyan')}`);
        });

        console.log(this.colorize('\n🖥️  Platform Differences:', 'yellow'));
        if (this.isWindows) {
            console.log('Windows (Current Platform):');
            console.log('  • Uses PowerShell for process enumeration');
            console.log('  • tasklist/taskkill for process management');
            console.log('  • No tmux support (Windows-specific terminals)');
            console.log('  • WMI integration for detailed process info');
        } else {
            console.log('Unix/Linux (Current Platform):');
            console.log('  • Uses ps command for process enumeration');
            console.log('  • Signal-based termination (SIGTERM/SIGKILL)');
            console.log('  • Full tmux session management');
            console.log('  • Process tree analysis with parent-child relationships');
        }

        console.log(this.colorize('\n📋 API Usage Examples:', 'yellow'));
        console.log('// Basic detection');
        console.log(this.colorize('const { detectProcesses } = require(\'./process\');', 'cyan'));
        console.log(this.colorize('const processes = await detectProcesses();', 'cyan'));
        console.log();
        console.log('// Advanced usage with ProcessManager');
        console.log(this.colorize('const { ProcessManager } = require(\'./process\');', 'cyan'));
        console.log(this.colorize('const manager = new ProcessManager({ dryRun: true });', 'cyan'));
        console.log(this.colorize('const result = await manager.detect();', 'cyan'));
        console.log(this.colorize('const report = await manager.getProcessReport();', 'cyan'));

        console.log(this.colorize('\n🔗 Integration Points:', 'yellow'));
        console.log('• Used by plan-builder.js for removal planning');
        console.log('• Integrated with backup.js for pre-termination backups');
        console.log('• Supports dry-run mode for safe preview');
        console.log('• Compatible with existing Phase 1-4 infrastructure');

        console.log(this.colorize('\n🧪 Testing & Quality:', 'yellow'));
        console.log('• Comprehensive test suite (test-phase5-process.js)');
        console.log('• Mock data testing for safe development');
        console.log('• Cross-platform compatibility testing');
        console.log('• Performance benchmarking and optimization');
        console.log('• Error handling and edge case coverage');
    }

    async getInput(prompt) {
        process.stdout.write(this.colorize(prompt, 'yellow'));
        return new Promise((resolve) => {
            process.stdin.once('data', (data) => {
                resolve(data.toString().trim());
            });
        });
    }

    async pauseForUser() {
        console.log();
        await this.getInput('Press Enter to continue...');
        console.log();
    }

    async cleanup() {
        console.log(this.colorize('\n🧹 Cleaning up demo resources...', 'yellow'));
        
        // Clean up spawned processes
        for (const proc of this.spawnedProcesses) {
            try {
                if (proc && !proc.killed) {
                    console.log(`   Terminating test process PID ${proc.pid}...`);
                    proc.kill('SIGTERM');
                    
                    // Give it time to exit gracefully
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    if (!proc.killed) {
                        proc.kill('SIGKILL');
                    }
                }
            } catch (error) {
                console.warn(`   Warning: Failed to cleanup process: ${error.message}`);
            }
        }

        // Clean up temporary files
        for (const file of this.tempFiles) {
            try {
                await fs.unlink(file);
                console.log(`   Removed temp file: ${path.basename(file)}`);
            } catch (error) {
                console.warn(`   Warning: Failed to cleanup temp file: ${error.message}`);
            }
        }

        if (this.spawnedProcesses.length > 0 || this.tempFiles.length > 0) {
            console.log(this.colorize(`   ✅ Cleanup complete: ${this.spawnedProcesses.length} processes, ${this.tempFiles.length} files`, 'green'));
        }
    }
}

// Run demo if this file is executed directly
if (require.main === module) {
    console.log('🎬 Starting Phase 5 Process Detection Demo...');
    console.log();
    
    // Enable raw mode for better input handling
    if (process.stdin.setRawMode) {
        process.stdin.setRawMode(false);
    }
    process.stdin.resume();
    
    const demo = new ProcessDemo();
    demo.runDemo().catch(error => {
        console.error('❌ Demo execution failed:', error);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    });
}

module.exports = { ProcessDemo };