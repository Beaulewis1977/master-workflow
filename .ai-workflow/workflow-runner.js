#!/usr/bin/env node

/**
 * Modular Workflow Runner - Core Orchestration Engine
 * Works with or without TMux, adapts to installed components
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const http = require('http');
const { promisify } = require('util');
const execAsync = promisify(exec);
const { runCommand, runCommandsSequentially } = require('./lib/exec-helper');
const versionPolicy = require('./lib/version-policy');

class ModularWorkflowRunner {
  constructor() {
    this.projectDir = process.cwd();
    this.installDir = path.join(this.projectDir, '.ai-workflow');
    this.logDir = path.join(this.installDir, 'logs');
    this.recoveryDir = path.join(this.installDir, 'recovery');
    
    // Load installation configuration
    this.loadInstallationConfig();
    
    // Ensure directories exist
    this.ensureDirectories();
    
    // Load workflow configurations
    this.loadConfigurations();
    
    // Initialize components based on what's installed
    this.agents = {};
    this.sessions = {};
    this.tasks = [];
    this.errors = [];
    this.processes = {}; // For non-TMux process management
    // Load Claude auto-delegation settings if present
    this.claudeSettings = this.loadClaudeSettings();
  }

  loadInstallationConfig() {
    const configPath = path.join(this.installDir, 'installation-config.json');
    
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      this.components = config.components || {};
      this.executionMode = config.executionMode || 'process';
      this.initialPromptPath = config.initialPrompt;
      this.claudeCommand = config.claudeCommand || 'claude';
      this.skipPermissions = config.skipPermissions || false;
    } else {
      // Default configuration if no config file exists
      this.components = {
        core: true,
        claudeCode: false,
        agentOS: false,
        claudeFlow: false,
        tmux: false
      };
      this.executionMode = 'process';
      this.claudeCommand = 'claude';
      this.skipPermissions = false;
    }
    
    // Set execution mode based on TMux availability
    if (!this.components.tmux) {
      this.executionMode = 'process';
    }
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
    const configDir = path.join(this.installDir, 'configs');
    
    // Load approach configuration
    const approachPath = path.join(configDir, 'approaches.json');
    if (fs.existsSync(approachPath)) {
      this.approachConfig = JSON.parse(fs.readFileSync(approachPath, 'utf8'));
    }
    
    // Load orchestration configuration
    const orchestrationPath = path.join(configDir, 'orchestration.json');
    if (fs.existsSync(orchestrationPath)) {
      this.orchestrationConfig = JSON.parse(fs.readFileSync(orchestrationPath, 'utf8'));
    }
    
    // Load recovery configuration
    const recoveryPath = path.join(configDir, 'recovery-config.json');
    if (fs.existsSync(recoveryPath)) {
      this.recoveryConfig = JSON.parse(fs.readFileSync(recoveryPath, 'utf8'));
    }
  }

  loadClaudeSettings() {
    try {
      const p = path.join(this.projectDir, '.claude', 'settings.json');
      if (fs.existsSync(p)) {
        return JSON.parse(fs.readFileSync(p, 'utf8'));
      }
    } catch {}
    return { autoDelegation: { enabled: false, rules: [] } };
  }

  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...data
    };
    
    // Console output
    const colors = {
      error: '\x1b[31m',
      warning: '\x1b[33m',
      success: '\x1b[32m',
      info: '\x1b[36m',
      reset: '\x1b[0m'
    };
    
    const color = colors[level] || colors.reset;
    console.log(`${color}[${level.toUpperCase()}]${colors.reset} ${message}`);
    
    // File logging
    const logFile = path.join(this.logDir, 'workflow.log');
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');

    // Publish to status server (best-effort)
    this.publishEvent('log', { level, message, context: data }).catch(() => {});
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
        res.on('data', () => {});
        res.on('end', resolve);
      });
      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  async executePrompt() {
    // Execute saved initial prompt
    if (!this.initialPromptPath || !fs.existsSync(this.initialPromptPath)) {
      this.log('error', 'No saved prompt found');
      console.log('Use "ai-workflow prompt edit" to create a prompt');
      return;
    }
    
    const prompt = fs.readFileSync(this.initialPromptPath, 'utf8');
    this.log('info', 'Executing saved prompt', { promptLength: prompt.length });
    
    // Analyze prompt to determine approach
    const analysis = await this.analyzePrompt(prompt);
    
    // Initialize with determined approach
    await this.init(analysis.mode || 'auto', prompt);
  }

  async analyzePrompt(prompt) {
    const promptLength = prompt.length;
    const hasCode = /```[\s\S]*```/.test(prompt);
    const hasTasks = /\d+\.\s+/g.test(prompt);
    const complexity = this.calculatePromptComplexity(prompt);
    
    let mode = 'auto';
    let approach = 'standard';
    
    if (complexity > 70) {
      approach = 'hiveMindSparc';
      mode = 'sparc';
    } else if (complexity > 30) {
      approach = 'hiveMind';
      mode = 'hive';
    } else {
      approach = 'simpleSwarm';
      mode = 'swarm';
    }
    
    return { mode, approach, complexity };
  }

  calculatePromptComplexity(prompt) {
    let score = 0;
    
    // Length factor
    if (prompt.length > 2000) score += 30;
    else if (prompt.length > 500) score += 15;
    else score += 5;
    
    // Task count
    const tasks = (prompt.match(/\d+\.\s+/g) || []).length;
    score += Math.min(tasks * 5, 30);
    
    // Technical keywords
    const techKeywords = ['api', 'database', 'authentication', 'deployment', 'microservice', 'kubernetes'];
    techKeywords.forEach(keyword => {
      if (prompt.toLowerCase().includes(keyword)) score += 5;
    });
    
    // Code blocks
    const codeBlocks = (prompt.match(/```/g) || []).length / 2;
    score += Math.min(codeBlocks * 10, 20);
    
    return Math.min(score, 100);
  }

  async init(mode = 'interactive', task = '') {
    this.log('info', 'Initializing workflow', { mode, task });
    
    // Load or analyze project
    const analysisPath = path.join(this.projectDir, '.ai-dev', 'analysis.json');
    let analysis;
    
    if (fs.existsSync(analysisPath)) {
      analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));
    } else {
      analysis = await this.analyzeProject();
    }
    
    // Determine approach
    this.approach = await this.selectApproach(analysis, mode, task);
    this.publishEvent('approach_change', { selected: this.approach.selected, score: this.approach.score }).catch(() => {});
    
    // Generate project-specific sub-agents
    try {
      const AgentGenerator = require(path.join(this.installDir, 'intelligence-engine', 'agent-generator.js'));
      const agentGenerator = new AgentGenerator({ projectRoot: this.projectDir });
      const generatedAgents = await agentGenerator.generateProjectAgents(analysis, this.approach);
      this.log('success', `Generated ${generatedAgents.length} project-specific sub-agents`);
      this.publishEvent('agents_generated', { count: generatedAgents.length, agents: generatedAgents.map(a => a.name) }).catch(() => {});
    } catch (error) {
      this.log('warning', 'Failed to generate project-specific agents', { error: error.message });
      // Continue without agents - not critical for workflow
    }
    
    // Execute based on available components
    if (this.components.claudeFlow) {
      await this.executeWithClaudeFlow();
    } else if (this.components.claudeCode) {
      await this.executeWithClaudeCode();
    } else {
      await this.executeBasicWorkflow();
    }
  }

  async analyzeProject() {
    this.log('info', 'Analyzing project...');
    
    const analyzer = spawn('node', [
      path.join(this.installDir, 'intelligence-engine', 'complexity-analyzer.js')
    ]);
    
    return new Promise((resolve) => {
      let output = '';
      
      analyzer.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      analyzer.on('close', () => {
        try {
          const analysis = JSON.parse(output);
          resolve(analysis);
        } catch {
          resolve({ score: 50, approach: 'standard' });
        }
      });
    });
  }

  async selectApproach(analysis, mode, task) {
    const score = analysis.score || 50;
    let selected;
    
    switch (mode) {
      case 'auto':
        if (score <= 30) selected = 'simpleSwarm';
        else if (score <= 70) selected = 'hiveMind';
        else selected = 'hiveMindSparc';
        break;
      
      case 'swarm':
        selected = 'simpleSwarm';
        break;
      
      case 'hive':
        selected = 'hiveMind';
        break;
      
      case 'sparc':
        selected = 'hiveMindSparc';
        break;
      
      case 'interactive':
        selected = await this.promptUserSelection(analysis);
        break;
      
      default:
        selected = 'standard';
    }
    
    return {
      selected,
      score,
      task,
      agentCount: selected === 'simpleSwarm' ? 1 : selected === 'hiveMind' ? 5 : 10
    };
  }

  async promptUserSelection(analysis) {
    console.log('\n📊 Project Analysis:');
    console.log(`  Complexity Score: ${analysis.score}/100`);
    console.log(`  Recommended: ${analysis.recommendedApproach || 'standard'}`);
    console.log('\nSelect approach:');
    console.log('  1. Simple Swarm (Quick tasks)');
    console.log('  2. Hive-Mind (Multi-agent coordination)');
    console.log('  3. Hive-Mind + SPARC (Enterprise methodology)');
    console.log('  4. Use recommendation');
    
    // In real implementation, would use readline or inquirer
    // For now, return recommendation
    return analysis.recommendedApproach || 'hiveMind';
  }

  async executeWithClaudeFlow() {
    this.log('info', 'Executing with Claude Flow 2.0');
    
    const versionName = versionPolicy.getSelectedVersionName({});
    const versionSuffix = versionPolicy.getSuffixForName(versionName);
    let command;
    
    switch (this.approach.selected) {
      case 'simpleSwarm':
        command = `npx claude-flow${versionSuffix} swarm "${this.approach.task || 'Development task'}"`;
        break;
      
      case 'hiveMind':
        command = `npx claude-flow${versionSuffix} hive-mind spawn "${path.basename(this.projectDir)}" --agents ${this.approach.agentCount} --claude`;
        break;
      
      case 'hiveMindSparc':
        command = `npx claude-flow${versionSuffix} hive-mind spawn "${path.basename(this.projectDir)}" --sparc --agents ${this.approach.agentCount} --claude`;
        break;
      
      default:
        command = `npx claude-flow${versionSuffix} swarm "Complete project tasks"`;
    }
    
    // Execute based on execution mode
    // Optional experimental features (training, memory ops)
    const commands = [command];
    const enableTraining = process.env.ENABLE_CF_TRAINING === 'true'
      || (process.env.CF_ENABLE_EXPERIMENTAL === 'true' && versionPolicy.isExperimentalName(versionName));
    if (enableTraining) {
      const epochs = Number(process.env.CF_TRAINING_EPOCHS || 3);
      commands.push(`npx claude-flow${versionSuffix} training neural-train --epochs ${epochs}`);
    }

    const enableMemory = process.env.ENABLE_CF_MEMORY_OPS === 'true';
    if (enableMemory) {
      const action = (process.env.CF_MEMORY_ACTION || 'summarize').toLowerCase();
      const projectName = path.basename(this.projectDir);
      if (action === 'sync') {
        commands.push(`npx claude-flow${versionSuffix} memory sync --project "${projectName}"`);
      } else if (action === 'gc') {
        commands.push(`npx claude-flow${versionSuffix} memory gc --project "${projectName}"`);
      } else {
        commands.push(`npx claude-flow${versionSuffix} memory summarize --project "${projectName}"`);
      }
    }

    if (this.executionMode === 'tmux' && this.components.tmux) {
      // In tmux mode, chain via new lines
      await this.executeInTmux(commands.join(' && '));
    } else {
      await runCommandsSequentially(commands, { cwd: this.projectDir, shell: true });
    }
    this.publishEvent('exec_complete', { mode: 'claude-flow', commands }).catch(() => {});
  }

  async executeWithClaudeCode() {
    this.log('info', 'Executing with Claude Code agents');
    
    // Use Claude Code with installed agents
    const agentPath = path.join(this.projectDir, '.claude', 'agents');
    
    if (!fs.existsSync(agentPath)) {
      this.log('error', 'Claude Code agents not found');
      return;
    }
    
    // Auto-delegation based on settings
    const delegation = this.maybeDelegateTask(this.approach.task || '', []);
    let command = this.claudeCommand;
    if (delegation?.agent) {
      command = `${command} --agent ${delegation.agent}`;
      this.log('info', `Auto-delegating to sub-agent: ${delegation.agent} (rule: ${delegation.ruleId})`);
    } else {
      this.log('info', `Using Claude command: ${command}`);
    }
    
    if (this.executionMode === 'tmux' && this.components.tmux) {
      await this.executeInTmux(command);
    } else {
      await this.executeViaHelper(command);
    }
    this.publishEvent('exec_complete', { mode: 'claude-code', command }).catch(() => {});
  }

  // Phase 4: Auto-delegation engine (simple heuristic based on settings.json)
  maybeDelegateTask(taskDescription, fileHints = []) {
    const settings = this.claudeSettings?.autoDelegation;
    if (!settings?.enabled || !Array.isArray(settings.rules)) return null;

    const text = (taskDescription || '').toLowerCase();
    for (const rule of settings.rules) {
      const when = rule.when || {};
      const keywords = (when.taskKeywords || []).map(k => String(k).toLowerCase());
      const matchesKeyword = keywords.length > 0 && keywords.some(k => text.includes(k));
      const patterns = when.filePatterns || [];
      const matchesFiles = patterns.length > 0 && fileHints.some(f => patterns.some(pattern => this.fileLikeMatches(f, pattern)));
      if (matchesKeyword || matchesFiles) {
        return { agent: rule.delegateTo, ruleId: rule.id, threshold: rule.confidenceThreshold ?? 0.5 };
      }
    }
    return null;
  }

  fileLikeMatches(filename, pattern) {
    // Very lightweight matcher: supports **, * and suffix wildcards
    const esc = s => s.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    const regex = '^' + esc(pattern).replace(/\\\*\\\*/g, '.*').replace(/\\\*/g, '[^/]*') + '$';
    return new RegExp(regex).test(filename);
  }

  async executeBasicWorkflow() {
    this.log('info', 'Executing basic workflow');
    
    // Basic execution without specific integrations
    console.log('\n📋 Basic Workflow Execution:');
    console.log('1. Project analyzed');
    console.log('2. Approach selected:', this.approach.selected);
    console.log('3. Ready for manual execution');
    console.log('\nTo add more capabilities:');
    console.log('  ai-workflow add claude-flow   # Add multi-agent support');
    console.log('  ai-workflow add claude-code   # Add Claude Code integration');
    console.log('  ai-workflow add tmux          # Add 24/7 operation');
  }

  async executeInTmux(command) {
    this.log('info', 'Executing in TMux session');
    
    const sessionName = `workflow-${Date.now()}`;
    
    try {
      // Create TMux session
      await execAsync(`tmux new-session -d -s ${sessionName}`);
      
      // Send command to session
      await execAsync(`tmux send-keys -t ${sessionName} "${command}" C-m`);
      
      this.sessions.main = sessionName;
      this.log('success', `TMux session created: ${sessionName}`);
      
      console.log(`\n✅ Workflow running in TMux session: ${sessionName}`);
      console.log(`   Attach with: tmux attach -t ${sessionName}`);
      
    } catch (error) {
      this.log('error', 'TMux execution failed', { error: error.message });
      // Fallback to process execution
      await this.executeInProcess(command);
    }
  }

  async executeViaHelper(command) {
    this.log('info', 'Executing via helper', { command });
    const result = await runCommand(command, { cwd: this.projectDir, shell: true });
    if (result.code !== 0) {
      this.log('error', 'Execution failed', { code: result.code, stderr: result.stderr });
      throw new Error(`Execution failed: ${result.stderr || result.stdout}`);
    }
    this.log('success', 'Execution complete');
    return result;
  }

  async recover(action = 'analyze') {
    this.log('info', 'Starting recovery mode', { action });
    
    const scanner = require(path.join(this.installDir, 'intelligence-engine', 'project-scanner.js'));
    
    switch (action) {
      case 'analyze':
        const incomplete = await this.detectIncompleteWork();
        
        // Save analysis
        const incompletePath = path.join(this.projectDir, '.ai-dev', 'incomplete-work.json');
        fs.writeFileSync(incompletePath, JSON.stringify(incomplete, null, 2));
        
        console.log('\n📊 Incomplete Work Analysis:');
        console.log(`  TODOs: ${incomplete.todos.length}`);
        console.log(`  FIXMEs: ${incomplete.fixmes.length}`);
        console.log(`  HACKs: ${incomplete.hacks.length}`);
        console.log(`  Not Implemented: ${incomplete.notImplemented.length}`);
        console.log(`  Failing Tests: ${incomplete.failingTests.length}`);
        
        if (incomplete.total > 0) {
          console.log('\nRun "ai-workflow recover execute" to start recovery');
        }
        break;
      
      case 'plan':
        const plan = await this.createRecoveryPlan();
        console.log('\n📋 Recovery Plan Created:');
        plan.forEach((task, i) => {
          console.log(`  ${i + 1}. ${task.description} (Priority: ${task.priority})`);
        });
        break;
      
      case 'execute':
        await this.executeRecovery();
        break;
      
      default:
        console.log('Usage: ai-workflow recover [analyze|plan|execute]');
    }
  }

  async detectIncompleteWork() {
    const incomplete = {
      todos: [],
      fixmes: [],
      hacks: [],
      notImplemented: [],
      failingTests: [],
      total: 0
    };
    
    // Scan project files
    const scanDir = (dir) => {
      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        // Skip excluded directories
        const excluded = ['node_modules', '.git', '.ai-workflow', 'dist', 'build'];
        if (excluded.includes(file)) return;
        
        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else if (stat.isFile() && !file.endsWith('.log')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          
          // Find patterns
          const todoMatches = content.match(/TODO[:\s].*$/gm) || [];
          const fixmeMatches = content.match(/FIXME[:\s].*$/gm) || [];
          const hackMatches = content.match(/(HACK|XXX)[:\s].*$/gm) || [];
          const notImplMatches = content.match(/throw.*Error.*not.*implemented/gi) || [];
          
          incomplete.todos.push(...todoMatches.map(m => ({ file: fullPath, match: m })));
          incomplete.fixmes.push(...fixmeMatches.map(m => ({ file: fullPath, match: m })));
          incomplete.hacks.push(...hackMatches.map(m => ({ file: fullPath, match: m })));
          incomplete.notImplemented.push(...notImplMatches.map(m => ({ file: fullPath, match: m })));
        }
      });
    };
    
    scanDir(this.projectDir);
    
    incomplete.total = 
      incomplete.todos.length +
      incomplete.fixmes.length +
      incomplete.hacks.length +
      incomplete.notImplemented.length +
      incomplete.failingTests.length;
    
    return incomplete;
  }

  async createRecoveryPlan() {
    const incompletePath = path.join(this.projectDir, '.ai-dev', 'incomplete-work.json');
    
    if (!fs.existsSync(incompletePath)) {
      await this.detectIncompleteWork();
    }
    
    const incomplete = JSON.parse(fs.readFileSync(incompletePath, 'utf8'));
    const plan = [];
    
    // Prioritize tasks
    const priorities = this.recoveryConfig?.recovery?.prioritization?.rules || [];
    
    // Add tasks to plan
    if (incomplete.notImplemented.length > 0) {
      plan.push({
        type: 'not_implemented',
        description: `Implement ${incomplete.notImplemented.length} stub functions`,
        priority: 1,
        items: incomplete.notImplemented
      });
    }
    
    if (incomplete.fixmes.length > 0) {
      plan.push({
        type: 'fixmes',
        description: `Fix ${incomplete.fixmes.length} known issues`,
        priority: 2,
        items: incomplete.fixmes
      });
    }
    
    if (incomplete.todos.length > 0) {
      plan.push({
        type: 'todos',
        description: `Complete ${incomplete.todos.length} TODO items`,
        priority: 3,
        items: incomplete.todos
      });
    }
    
    // Save plan
    const planPath = path.join(this.projectDir, '.ai-dev', 'recovery-plan.json');
    fs.writeFileSync(planPath, JSON.stringify(plan, null, 2));
    
    return plan;
  }

  async executeRecovery() {
    this.log('info', 'Executing recovery plan');
    
    // Create checkpoint
    await this.createCheckpoint('pre-recovery');
    
    // Load or create plan
    const planPath = path.join(this.projectDir, '.ai-dev', 'recovery-plan.json');
    
    if (!fs.existsSync(planPath)) {
      await this.createRecoveryPlan();
    }
    
    const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
    
    console.log('\n🔧 Starting Recovery Process...');
    console.log(`  ${plan.length} task groups to complete`);
    
    // Execute based on available components
    if (this.components.claudeCode) {
      // Use recovery specialist agent with configured command
      const command = `${this.claudeCommand} --agent recovery-specialist`;
      this.log('info', `Starting recovery with command: ${command}`);
      await this.executeInProcess(command);
    } else if (this.components.claudeFlow) {
      // Use Claude Flow for recovery
      const command = `npx claude-flow@alpha hive-mind spawn recovery --agents 5 --claude`;
      await this.executeInProcess(command);
    } else {
      console.log('\n📋 Recovery Plan:');
      plan.forEach((task, i) => {
        console.log(`\n${i + 1}. ${task.description}`);
        console.log(`   Files affected: ${task.items.length}`);
      });
      console.log('\nManual recovery required. Consider adding:');
      console.log('  ai-workflow add claude-code   # For automated recovery');
    }
  }

  async createCheckpoint(name) {
    const checkpointDir = path.join(this.recoveryDir, 'checkpoints', name);
    
    if (!fs.existsSync(checkpointDir)) {
      fs.mkdirSync(checkpointDir, { recursive: true });
    }
    
    // Save current state
    const state = {
      timestamp: new Date().toISOString(),
      name,
      approach: this.approach,
      tasks: this.tasks,
      errors: this.errors
    };
    
    fs.writeFileSync(
      path.join(checkpointDir, 'state.json'),
      JSON.stringify(state, null, 2)
    );
    
    this.log('info', 'Checkpoint created', { name });
  }

  showStatus() {
    console.log('\n📊 Workflow Status:');
    console.log('─────────────────────────');
    
    console.log('\n🔧 Installed Components:');
    Object.entries(this.components).forEach(([name, installed]) => {
      const status = installed ? '✓' : '✗';
      const color = installed ? '\x1b[32m' : '\x1b[31m';
      console.log(`  ${color}${status}\x1b[0m ${name}`);
    });
    
    console.log('\n⚙️  Execution Mode:', this.executionMode);
    
    if (Object.keys(this.processes).length > 0) {
      console.log('\n📋 Running Processes:');
      Object.entries(this.processes).forEach(([pid, info]) => {
        console.log(`  PID ${pid}: ${info.command.substring(0, 50)}...`);
        console.log(`    Started: ${info.startTime}`);
        console.log(`    Logs: ${info.logFile}`);
      });
    }
    
    if (Object.keys(this.sessions).length > 0 && this.components.tmux) {
      console.log('\n🖥️  TMux Sessions:');
      Object.entries(this.sessions).forEach(([name, session]) => {
        console.log(`  ${name}: ${session}`);
      });
    }
    
    const analysisPath = path.join(this.projectDir, '.ai-dev', 'analysis.json');
    if (fs.existsSync(analysisPath)) {
      const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));
      console.log('\n📈 Project Analysis:');
      console.log(`  Complexity Score: ${analysis.score}/100`);
      console.log(`  Recommended Approach: ${analysis.recommendedApproach || 'standard'}`);
    }
  }
}

// CLI Interface
if (require.main === module) {
  const runner = new ModularWorkflowRunner();
  const command = process.argv[2];
  const args = process.argv.slice(3);
  
  switch (command) {
    case 'init':
      const mode = args.find(a => a.startsWith('--'))?.replace('--', '') || 'interactive';
      const task = args.find(a => !a.startsWith('--')) || '';
      runner.init(mode, task).catch(console.error);
      break;
    
    case 'execute-prompt':
      runner.executePrompt().catch(console.error);
      break;
    
    case 'recover':
      runner.recover(args[0] || 'analyze').catch(console.error);
      break;
    
    case 'status':
      runner.showStatus();
      break;
    
    default:
      console.log('Modular Workflow Runner');
      console.log('Usage: workflow-runner.js [command] [options]');
      console.log('\nCommands:');
      console.log('  init [mode] [task]     Initialize workflow');
      console.log('  execute-prompt         Execute saved prompt');
      console.log('  recover [action]       Recovery mode');
      console.log('  status                 Show system status');
      break;
  }
}

module.exports = ModularWorkflowRunner;