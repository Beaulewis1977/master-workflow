#!/usr/bin/env node

/**
 * Workflow Runner - Core Orchestration Engine
 * Manages the complete intelligent workflow system
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const http = require('http');

class WorkflowRunner {
  constructor() {
    this.projectDir = process.cwd();
    this.installDir = path.join(this.projectDir, '.ai-workflow');
    this.logDir = path.join(this.installDir, 'logs');
    this.recoveryDir = path.join(this.installDir, 'recovery');
    
    // Ensure directories exist
    this.ensureDirectories();
    
    // Load configurations
    this.loadConfigurations();
    
    // Initialize components
    this.agents = {};
    this.sessions = {};
    this.tasks = [];
    this.errors = [];
    this.yolo = { enabled: false, dangerouslySkipPermissions: false, ack: null };
  }

  ensureDirectories() {
    const dirs = [
      this.logDir,
      path.join(this.logDir, 'agents'),
      path.join(this.logDir, 'sessions'),
      this.recoveryDir,
      path.join(this.recoveryDir, 'checkpoints'),
      path.join(this.recoveryDir, 'backups')
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  loadConfigurations() {
    try {
      // Load orchestration config
      const orchPath = path.join(this.installDir, 'configs', 'orchestration.json');
      if (fs.existsSync(orchPath)) {
        this.orchestrationConfig = JSON.parse(fs.readFileSync(orchPath, 'utf8'));
      }
      
      // Load agent mappings
      const mappingsPath = path.join(this.installDir, 'configs', 'agent-mappings.json');
      if (fs.existsSync(mappingsPath)) {
        this.agentMappings = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));
      }
      
      // Load existing analysis if available
      const analysisPath = path.join(this.projectDir, '.ai-dev', 'analysis.json');
      if (fs.existsSync(analysisPath)) {
        this.analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));
      }
    } catch (error) {
      this.log('error', `Failed to load configurations: ${error.message}`);
    }
  }

  log(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      context
    };
    
    // Console output
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m'
    };
    
    console.log(`${colors[level] || ''}[${timestamp}] ${level.toUpperCase()}: ${message}${colors.reset}`);
    
    // File logging
    const logFile = path.join(this.logDir, 'workflow.log');
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
    
    // Error tracking
    if (level === 'error') {
      this.errors.push(logEntry);
      const errorFile = path.join(this.logDir, 'errors.log');
      fs.appendFileSync(errorFile, JSON.stringify(logEntry) + '\n');
    }

    // Publish to status server (best-effort)
    this.publishEvent('log', { level, message, context }).catch(() => {});
  }

  publishEvent(type, payload) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({ type, payload });
      const req = http.request({
        host: '127.0.0.1',
        port: process.env.AGENT_BUS_PORT ? Number(process.env.AGENT_BUS_PORT) : 8787,
        path: '/events/publish',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
      }, res => {
        // 204 expected
        res.on('data', () => {});
        res.on('end', resolve);
      });
      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  execSafe(command, options = {}) {
    const allowlist = [
      'npm', 'node', 'npx', 'bash', 'sh', 'pwsh', 'powershell',
      'git', 'tmux', 'jq', 'claude', 'claude-flow'
    ];
    const cmd = Array.isArray(command) ? command[0] : String(command).trim().split(/\s+/)[0];
    if (!allowlist.includes(cmd)) {
      throw new Error(`Command not allowed: ${cmd}`);
    }
    const maxRetries = options.retries ?? 2;
    const backoffMs = options.backoffMs ?? 500;
    const shell = options.shell ?? true;
    const cwd = options.cwd ?? this.projectDir;

    return new Promise((resolve, reject) => {
      let attempt = 0;
      const run = () => {
        attempt++;
        const child = spawn(Array.isArray(command) ? command.join(' ') : command, { cwd, shell: true });
        let stdout = '', stderr = '';
        child.stdout.on('data', d => (stdout += d.toString()));
        child.stderr.on('data', d => (stderr += d.toString()));
        child.on('exit', code => {
          if (code === 0) return resolve({ stdout, stderr, code });
          if (attempt <= maxRetries) {
            setTimeout(run, backoffMs * attempt);
          } else {
            reject(new Error(`Command failed (${code}): ${stderr || stdout}`));
          }
        });
      };
      run();
    });
  }

  async analyzeProject() {
    this.log('info', 'Starting project analysis...');
    this.publishEvent('status', { phase: 'analyze:start' }).catch(() => {});
    
    try {
      // Run complexity analyzer
      const analyzerPath = path.join(this.installDir, 'intelligence-engine', 'complexity-analyzer.js');
      const { stdout } = await execAsync(`node "${analyzerPath}" "${this.projectDir}"`);
      
      const analysis = JSON.parse(stdout);
      this.analysis = analysis;
      
      // Save analysis
      const analysisPath = path.join(this.projectDir, '.ai-dev', 'analysis.json');
      fs.writeFileSync(analysisPath, JSON.stringify(analysis, null, 2));
      
      this.log('success', `Analysis complete: Score ${analysis.score}/100, Stage: ${analysis.stage}`);
      this.publishEvent('status', { phase: 'analyze:complete', analysis }).catch(() => {});
      
      // Check for incomplete work
      if (await this.detectIncompleteWork()) {
        analysis.hasIncompleteWork = true;
        analysis.score = Math.min(100, analysis.score + 20); // Increase complexity for messy projects
      }
      
      return analysis;
    } catch (error) {
      this.log('error', `Analysis failed: ${error.message}`);
      this.publishEvent('status', { phase: 'analyze:error', error: error.message }).catch(() => {});
      throw error;
    }
  }

  async detectIncompleteWork() {
    this.log('info', 'Scanning for incomplete work...');
    
    const incomplete = {
      todos: [],
      fixmes: [],
      hacks: [],
      notImplemented: [],
      failingTests: [],
      missingDocs: [],
      uncommitted: []
    };
    
    try {
      // Replace grep-based scanning with portable Node scanner
      const scannerPath = path.join(this.installDir, 'intelligence-engine', 'project-scanner.js');
      let results;
      try {
        // Use require to load scanner class
        const Scanner = require(scannerPath);
        const scanner = new Scanner(this.projectDir);
        results = await scanner.scan();
      } catch (e) {
        this.log('warning', `Project scanner unavailable (${e.message}); skipping detailed scan`);
      }

      if (results) {
        incomplete.todos = results.todos || [];
        incomplete.fixmes = results.fixmes || [];
        incomplete.hacks = results.hacks || [];
        incomplete.notImplemented = results.notImplemented || [];
        incomplete.failingTests = results.failingTests || [];
        incomplete.uncommitted = results.uncommitted || [];
        
        // Log counts
        const counters = {
          TODOS: incomplete.todos.length,
          FIXMES: incomplete.fixmes.length,
          HACKS: incomplete.hacks.length,
          NOT_IMPLEMENTED: incomplete.notImplemented.length,
          TEST_ISSUES: incomplete.failingTests.length,
          UNCOMMITTED: incomplete.uncommitted.length
        };
        Object.entries(counters).forEach(([k, v]) => v > 0 && this.log('warning', `Found ${v} ${k}`));
      }
      
      // Optional: lightweight failing test detection is handled by scanner
      
      // Check for uncommitted changes
      try {
        const { stdout } = await execAsync('git status --porcelain', { cwd: this.projectDir });
        if (stdout) {
          incomplete.uncommitted = stdout.split('\n').filter(line => line.trim());
          this.log('warning', `Found ${incomplete.uncommitted.length} uncommitted files`);
        }
      } catch (e) {
        // Not a git repo, that's ok
      }
      
      // Save incomplete work analysis
      const incompletePath = path.join(this.projectDir, '.ai-dev', 'incomplete-work.json');
      fs.writeFileSync(incompletePath, JSON.stringify(incomplete, null, 2));
      
      // Calculate total incomplete items
      const totalIncomplete = Object.values(incomplete).reduce((sum, arr) => sum + arr.length, 0);
      
      if (totalIncomplete > 0) {
        this.log('warning', `Total incomplete items: ${totalIncomplete}`);
        this.incomplete = incomplete;
        return true;
      }
      
      return false;
    } catch (error) {
      this.log('error', `Failed to detect incomplete work: ${error.message}`);
      return false;
    }
  }

  async selectApproach() {
    this.log('info', 'Selecting optimal approach...');
    this.publishEvent('status', { phase: 'approach:start' }).catch(() => {});
    
    try {
      const selectorPath = path.join(this.installDir, 'intelligence-engine', 'approach-selector.js');
      const analysisPath = path.join(this.projectDir, '.ai-dev', 'analysis.json');
      
      const { stdout } = await execAsync(`node "${selectorPath}" "${analysisPath}"`);
      const approach = JSON.parse(stdout);
      
      // Adjust for incomplete work
      if (this.analysis.hasIncompleteWork) {
        if (approach.selected === 'simpleSwarm') {
          approach.selected = 'hiveMind';
          approach.reason = 'Upgraded to Hive-Mind due to incomplete work';
        }
        
        // Add recovery specialist to agent list
        approach.agents = approach.agents || [];
        if (!approach.agents.includes('recovery-specialist')) {
          approach.agents.push('recovery-specialist');
        }
      }
      
      // Save approach
      const approachPath = path.join(this.projectDir, '.ai-dev', 'approach.json');
      fs.writeFileSync(approachPath, JSON.stringify(approach, null, 2));
      
      this.approach = approach;
      this.log('success', `Selected approach: ${approach.name} (${approach.selected})`);
      this.publishEvent('status', { phase: 'approach:complete', approach }).catch(() => {});
      
      return approach;
    } catch (error) {
      this.log('error', `Approach selection failed: ${error.message}`);
      this.publishEvent('status', { phase: 'approach:error', error: error.message }).catch(() => {});
      throw error;
    }
  }

  async initializeAgents() {
    this.log('info', 'Initializing agents...');
    this.publishEvent('status', { phase: 'agents:init' }).catch(() => {});
    
    const agentDir = path.join(this.projectDir, '.claude', 'agents');
    const agents = fs.readdirSync(agentDir).filter(f => f.endsWith('.md'));
    
    for (const agentFile of agents) {
      const agentName = path.basename(agentFile, '.md');
      const agentPath = path.join(agentDir, agentFile);
      
      // Check if agent is needed for this complexity
      if (this.shouldActivateAgent(agentName)) {
        this.agents[agentName] = {
          name: agentName,
          path: agentPath,
          status: 'ready',
          tasks: []
        };
        
        this.log('info', `Activated agent: ${agentName}`);
      }
    }
    
    return this.agents;
  }

  shouldActivateAgent(agentName) {
    const complexity = this.analysis?.score || 0;
    
    // Always activate orchestrator
    if (agentName === 'workflow-orchestrator') return true;
    
    // Activate based on complexity
    if (complexity > 20 && ['complexity-analyzer-agent', 'approach-selector-agent'].includes(agentName)) {
      return true;
    }
    
    if (complexity > 40 && ['document-customizer-agent', 'integration-coordinator-agent'].includes(agentName)) {
      return true;
    }
    
    if (complexity > 70 && agentName === 'sparc-methodology-agent') {
      return true;
    }
    
    // Always activate recovery specialist if incomplete work detected
    if (this.analysis?.hasIncompleteWork && agentName === 'recovery-specialist') {
      return true;
    }
    
    return false;
  }

  async createTmuxSessions() {
    this.log('info', 'Creating TMux sessions...');
    this.publishEvent('status', { phase: 'tmux:start' }).catch(() => {});
    
    const sessionName = `workflow-${Date.now()}`;
    
    try {
      // Create main session
      await execAsync(`tmux new-session -d -s ${sessionName}`);
      
      // Create windows based on approach
      const windowCount = this.approach.selected === 'simpleSwarm' ? 1 :
                         this.approach.selected === 'hiveMind' ? 4 : 6;
      
      for (let i = 1; i <= windowCount; i++) {
        await execAsync(`tmux new-window -t ${sessionName}:${i} -n "window-${i}"`);
      }
      
      this.sessions.main = sessionName;
      this.log('success', `Created TMux session: ${sessionName}`);
      this.publishEvent('status', { phase: 'tmux:created', session: sessionName }).catch(() => {});
      
      return sessionName;
    } catch (error) {
      this.log('warning', `TMux session creation failed: ${error.message}`);
      this.publishEvent('status', { phase: 'tmux:error', error: error.message }).catch(() => {});
      return null;
    }
  }

  async executeClaudeFlow() {
    this.log('info', 'Executing Claude Flow command...');
    this.publishEvent('status', { phase: 'exec:start' }).catch(() => {});
    
    const version = process.env.CLAUDE_FLOW_VERSION || 'alpha';
    let command;
    
    switch (this.approach.selected) {
      case 'simpleSwarm':
        command = `npx claude-flow@${version} swarm "${this.approach.task || 'Development task'}"`;
        break;
      
      case 'hiveMind':
        const agentCount = this.approach.agentCount || 5;
        command = `npx claude-flow@${version} hive-mind spawn "${path.basename(this.projectDir)}" --agents ${agentCount} --claude`;
        break;
      
      case 'hiveMindSparc':
        const sparcAgents = this.approach.agentCount || 10;
        command = `npx claude-flow@${version} hive-mind spawn "${path.basename(this.projectDir)}" --sparc --agents ${sparcAgents} --claude`;
        break;
      
      default:
        throw new Error(`Unknown approach: ${this.approach.selected}`);
    }
    
    this.log('info', `Executing: ${command}`);
    
    // Execute via execSafe
    this.execSafe(command, { retries: 2, backoffMs: 750 }).then(({ stdout }) => {
      if (stdout) this.log('info', `Claude Flow: ${stdout.trim()}`);
      this.publishEvent('status', { phase: 'exec:complete' }).catch(() => {});
    }).catch(err => {
      this.log('error', `Claude Flow failed: ${err.message}`);
      this.publishEvent('status', { phase: 'exec:error', error: err.message }).catch(() => {});
    });
    
    return command;
  }

  async planDryRun() {
    const plan = {
      dag: [
        { id: 'analyze', dependsOn: [] },
        { id: 'select-approach', dependsOn: ['analyze'] },
        { id: 'init-agents', dependsOn: ['select-approach'] },
        { id: 'create-sessions', dependsOn: ['init-agents'] },
        { id: 'execute', dependsOn: ['create-sessions'] }
      ],
      rollback: [
        'stop-processes', 'remove-sessions', 'restore-configs', 'cleanup-temp'
      ],
      risks: [
        'network-failure', 'permission-denied', 'tool-missing'
      ]
    };
    const outPath = path.join(this.projectDir, '.ai-dev', 'dry-run-plan.json');
    const outDir = path.dirname(outPath);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(plan, null, 2));
    this.log('success', `Dry-run plan written to ${outPath}`);
    this.publishEvent('status', { phase: 'dry-run:ready', planPath: outPath }).catch(() => {});
    return plan;
  }

  enforceYoloAck() {
    // Gate YOLO/skip-permissions behind explicit env guard and ack
    const yoloBlocked = process.env.CI === 'true' || process.env.BLOCK_YOLO === 'true';
    if (yoloBlocked && (this.yolo.enabled || this.yolo.dangerouslySkipPermissions)) {
      throw new Error('YOLO mode is blocked in CI or when BLOCK_YOLO=true');
    }
    if ((this.yolo.enabled || this.yolo.dangerouslySkipPermissions) && this.yolo.ack !== 'I-ACCEPT-RISK') {
      throw new Error('YOLO mode requires --ack I-ACCEPT-RISK');
    }
    if (this.yolo.enabled || this.yolo.dangerouslySkipPermissions) {
      this.log('warning', 'YOLO mode enabled. Proceed with caution.');
    }
  }

  async createRecoveryPlan() {
    this.log('info', 'Creating recovery plan for incomplete project...');
    
    const plan = {
      phase: 'recovery',
      tasks: [],
      priority: 'high',
      estimatedTime: '2-4 hours'
    };
    
    // Prioritize tasks
    if (this.incomplete.failingTests.length > 0) {
      plan.tasks.push({
        type: 'fix-tests',
        priority: 1,
        count: this.incomplete.failingTests.length,
        description: 'Fix failing tests'
      });
    }
    
    if (this.incomplete.notImplemented.length > 0) {
      plan.tasks.push({
        type: 'implement-functions',
        priority: 2,
        count: this.incomplete.notImplemented.length,
        description: 'Implement stub functions'
      });
    }
    
    if (this.incomplete.todos.length > 0) {
      plan.tasks.push({
        type: 'complete-todos',
        priority: 3,
        count: this.incomplete.todos.length,
        description: 'Complete TODO items'
      });
    }
    
    if (this.incomplete.fixmes.length > 0) {
      plan.tasks.push({
        type: 'fix-issues',
        priority: 4,
        count: this.incomplete.fixmes.length,
        description: 'Fix FIXME issues'
      });
    }
    
    // Save recovery plan
    const planPath = path.join(this.projectDir, '.ai-dev', 'recovery-plan.json');
    fs.writeFileSync(planPath, JSON.stringify(plan, null, 2));
    
    this.recoveryPlan = plan;
    this.log('success', `Recovery plan created with ${plan.tasks.length} task categories`);
    
    return plan;
  }

  async executeRecovery() {
    this.log('info', 'Starting recovery execution...');
    
    if (!this.recoveryPlan) {
      await this.createRecoveryPlan();
    }
    
    // Create checkpoint before starting
    await this.createCheckpoint('pre-recovery');
    
    // Execute recovery tasks
    for (const task of this.recoveryPlan.tasks) {
      this.log('info', `Executing: ${task.description}`);
      
      try {
        // Route task to appropriate agent
        const agent = task.type.includes('test') ? 'recovery-specialist' :
                     task.type.includes('implement') ? 'recovery-specialist' :
                     'workflow-orchestrator';
        
        await this.routeTaskToAgent(task, agent);
        
        this.log('success', `Completed: ${task.description}`);
      } catch (error) {
        this.log('error', `Failed: ${task.description} - ${error.message}`);
      }
    }
    
    this.log('success', 'Recovery execution complete');
  }

  async routeTaskToAgent(task, agentName) {
    // This would normally communicate with the agent
    // For now, we'll simulate the routing
    this.log('info', `Routing task to ${agentName}: ${task.description}`);
    
    // Log to agent-specific file
    const agentLog = path.join(this.logDir, 'agents', `${agentName}.log`);
    const logEntry = {
      timestamp: new Date().toISOString(),
      task,
      status: 'assigned'
    };
    
    fs.appendFileSync(agentLog, JSON.stringify(logEntry) + '\n');
    
    // Simulate task execution
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  }

  async createCheckpoint(name) {
    this.log('info', `Creating checkpoint: ${name}`);
    
    const checkpointDir = path.join(this.recoveryDir, 'checkpoints', name);
    
    if (!fs.existsSync(checkpointDir)) {
      fs.mkdirSync(checkpointDir, { recursive: true });
    }
    
    // Save current state
    const state = {
      timestamp: new Date().toISOString(),
      analysis: this.analysis,
      approach: this.approach,
      agents: Object.keys(this.agents),
      tasks: this.tasks,
      errors: this.errors
    };
    
    fs.writeFileSync(
      path.join(checkpointDir, 'state.json'),
      JSON.stringify(state, null, 2)
    );
    
    this.log('success', `Checkpoint created: ${name}`);
    
    return checkpointDir;
  }

  async showStatus() {
    console.log('\n=== Workflow System Status ===\n');
    
    // Project info
    console.log('Project:', this.projectDir);
    
    // Analysis
    if (this.analysis) {
      console.log('\nAnalysis:');
      console.log(`  Score: ${this.analysis.score}/100`);
      console.log(`  Stage: ${this.analysis.stage}`);
      console.log(`  Has Incomplete Work: ${this.analysis.hasIncompleteWork || false}`);
    }
    
    // Approach
    if (this.approach) {
      console.log('\nApproach:');
      console.log(`  Selected: ${this.approach.selected}`);
      console.log(`  Confidence: ${this.approach.confidence}`);
    }
    
    // Agents
    console.log('\nAgents:');
    for (const [name, agent] of Object.entries(this.agents)) {
      console.log(`  ${name}: ${agent.status}`);
    }
    
    // Sessions
    if (this.sessions.main) {
      console.log('\nTMux Sessions:');
      console.log(`  Main: ${this.sessions.main}`);
    }
    
    // Errors
    if (this.errors.length > 0) {
      console.log(`\nErrors: ${this.errors.length}`);
      this.errors.slice(-3).forEach(err => {
        console.log(`  - ${err.message}`);
      });
    }
    
    console.log('\n');
  }

  async init(mode = 'interactive', task = '') {
    this.log('info', `Initializing workflow in ${mode} mode...`);
    this.enforceYoloAck();
    
    try {
      // Step 1: Analyze
      await this.analyzeProject();
      
      // Step 2: Select approach
      await this.selectApproach();
      
      // Step 3: Initialize agents
      await this.initializeAgents();
      
      // Step 4: Create recovery plan if needed
      if (this.analysis.hasIncompleteWork) {
        await this.createRecoveryPlan();
      }
      
      // Step 5: Create TMux sessions
      await this.createTmuxSessions();
      
      // Step 6: Execute workflow
      if (mode === 'auto' || mode === 'interactive') {
        await this.executeClaudeFlow();
      }
      
      this.log('success', 'Workflow initialization complete!');
      
      // Show summary
      await this.showStatus();
      
    } catch (error) {
      this.log('error', `Initialization failed: ${error.message}`);
      throw error;
    }
  }

  async recover(action = 'analyze') {
    this.log('info', `Recovery mode: ${action}`);
    
    try {
      switch (action) {
        case 'analyze':
          await this.analyzeProject();
          await this.detectIncompleteWork();
          
          if (this.incomplete) {
            console.log('\n=== Incomplete Work Found ===\n');
            console.log(`TODOs: ${this.incomplete.todos.length}`);
            console.log(`FIXMEs: ${this.incomplete.fixmes.length}`);
            console.log(`HACKs: ${this.incomplete.hacks.length}`);
            console.log(`Not Implemented: ${this.incomplete.notImplemented.length}`);
            console.log(`Failing Tests: ${this.incomplete.failingTests.length}`);
            console.log(`Uncommitted Files: ${this.incomplete.uncommitted.length}`);
            console.log('\nRun "ai-workflow recover plan" to create recovery plan');
          } else {
            console.log('No incomplete work detected!');
          }
          break;
        
        case 'plan':
          await this.analyzeProject();
          await this.detectIncompleteWork();
          await this.createRecoveryPlan();
          
          console.log('\n=== Recovery Plan ===\n');
          console.log(JSON.stringify(this.recoveryPlan, null, 2));
          console.log('\nRun "ai-workflow recover execute" to start recovery');
          break;
        
        case 'execute':
          await this.analyzeProject();
          await this.detectIncompleteWork();
          await this.selectApproach();
          await this.initializeAgents();
          await this.executeRecovery();
          break;
        
        default:
          console.log('Usage: ai-workflow recover [analyze|plan|execute]');
      }
    } catch (error) {
      this.log('error', `Recovery failed: ${error.message}`);
      throw error;
    }
  }
}

// CLI execution
if (require.main === module) {
  const runner = new WorkflowRunner();
  const command = process.argv[2];
  const args = process.argv.slice(3);

  // Parse global flags
  if (args.includes('--yolo')) runner.yolo.enabled = true;
  if (args.includes('--dangerously-skip-permissions')) runner.yolo.dangerouslySkipPermissions = true;
  const ackIdx = args.indexOf('--ack');
  if (ackIdx !== -1 && args[ackIdx + 1]) runner.yolo.ack = args[ackIdx + 1];
  
  switch (command) {
    case 'init':
      const modeFlag = args.find(a => a.startsWith('--mode='));
      const mode = modeFlag ? modeFlag.split('=')[1] : 'interactive';
      const task = args.find(a => !a.startsWith('--') && !a.startsWith('mode=')) || '';
      if (args.includes('--dry-run')) {
        runner.planDryRun().catch(console.error);
      } else {
        runner.init(mode, task).catch(console.error);
      }
      break;
    
    case 'recover':
      runner.recover(args[0] || 'analyze').catch(console.error);
      break;
    
    case 'status':
      runner.showStatus();
      break;
    
    case 'agents':
      if (args[0] === 'status') {
        runner.initializeAgents().then(() => {
          console.log('\nAgents Status:');
          for (const [name, agent] of Object.entries(runner.agents)) {
            console.log(`  ${name}: ${agent.status}`);
          }
        }).catch(console.error);
      }
      break;
    
    default:
      console.log('Usage: workflow-runner.js [init|recover|status|agents] [options]');
      process.exit(1);
  }
}

module.exports = WorkflowRunner;