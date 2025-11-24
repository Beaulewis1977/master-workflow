/**
 * ProgressTracker - Progress Monitoring System
 * =============================================
 * Tracks implementation progress against plans.
 * Part of the Autonomous Documentation & Spec-Driven Development System.
 */

import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';

export class ProgressTracker extends EventEmitter {
  constructor(plan, options = {}) {
    super();
    this.plan = plan;
    this.options = {
      outputDir: options.outputDir || './progress',
      autoSave: options.autoSave !== false,
      saveInterval: options.saveInterval || 60000, // 1 minute
      verbose: options.verbose || false
    };

    this.progress = {
      startTime: null,
      lastUpdate: null,
      phases: new Map(),
      tasks: new Map(),
      milestones: new Map(),
      metrics: {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        blockedTasks: 0
      },
      history: []
    };

    this.saveTimer = null;
  }

  log(msg) { if (this.options.verbose) console.log(msg); }

  async start() {
    this.log('🚀 Starting progress tracking...');
    this.progress.startTime = new Date().toISOString();
    this.emit('tracking:start');

    if (this.options.autoSave) {
      this.saveTimer = setInterval(() => this.autoSave(), this.options.saveInterval);
    }

    // Initialize from plan if provided
    if (this.plan) {
      await this.initializeFromPlan();
    }
  }

  async stop() {
    this.log('🛑 Stopping progress tracking...');
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
      this.saveTimer = null;
    }
    await this.save();
    this.emit('tracking:stop');
  }

  async initializeFromPlan() {
    // Initialize phases
    if (this.plan.phases) {
      for (const phase of this.plan.phases) {
        this.progress.phases.set(phase.name, {
          name: phase.name,
          status: 'pending',
          progress: 0,
          startTime: null,
          endTime: null,
          tasks: phase.tasks?.map(t => t.id) || []
        });
      }
    }

    // Initialize tasks
    if (this.plan.tasks) {
      for (const task of this.plan.tasks) {
        this.progress.tasks.set(task.id, {
          id: task.id,
          name: task.name,
          status: 'pending',
          progress: 0,
          assignee: task.assignee || null,
          startTime: null,
          endTime: null,
          blockedBy: [],
          notes: []
        });
        this.progress.metrics.totalTasks++;
      }
    }

    // Initialize milestones
    if (this.plan.milestones) {
      for (const milestone of this.plan.milestones) {
        this.progress.milestones.set(milestone.id, {
          id: milestone.id,
          name: milestone.name,
          status: 'pending',
          targetDate: milestone.target,
          completedDate: null,
          criteria: milestone.criteria?.map(c => ({ text: c, completed: false })) || []
        });
      }
    }
  }

  // Phase management
  updatePhase(phaseName, status, progress = null) {
    const phase = this.progress.phases.get(phaseName);
    if (!phase) {
      this.log(`Phase not found: ${phaseName}`);
      return false;
    }

    const oldStatus = phase.status;
    phase.status = status;
    if (progress !== null) phase.progress = progress;
    
    if (status === 'in-progress' && !phase.startTime) {
      phase.startTime = new Date().toISOString();
    }
    if (status === 'completed' && !phase.endTime) {
      phase.endTime = new Date().toISOString();
      phase.progress = 100;
    }

    this.progress.lastUpdate = new Date().toISOString();
    this.addHistoryEntry('phase', phaseName, oldStatus, status);
    this.emit('phase:updated', { phase: phaseName, status, progress: phase.progress });
    
    return true;
  }

  // Task management
  updateTask(taskId, status, progress = null) {
    const task = this.progress.tasks.get(taskId);
    if (!task) {
      this.log(`Task not found: ${taskId}`);
      return false;
    }

    const oldStatus = task.status;
    task.status = status;
    if (progress !== null) task.progress = progress;

    if (status === 'in-progress' && !task.startTime) {
      task.startTime = new Date().toISOString();
      this.progress.metrics.inProgressTasks++;
    }
    if (status === 'completed' && !task.endTime) {
      task.endTime = new Date().toISOString();
      task.progress = 100;
      this.progress.metrics.completedTasks++;
      if (oldStatus === 'in-progress') this.progress.metrics.inProgressTasks--;
    }
    if (status === 'blocked') {
      this.progress.metrics.blockedTasks++;
      if (oldStatus === 'in-progress') this.progress.metrics.inProgressTasks--;
    }

    this.progress.lastUpdate = new Date().toISOString();
    this.addHistoryEntry('task', taskId, oldStatus, status);
    this.emit('task:updated', { task: taskId, status, progress: task.progress });

    // Update parent phase progress
    this.recalculatePhaseProgress();
    
    return true;
  }

  assignTask(taskId, assignee) {
    const task = this.progress.tasks.get(taskId);
    if (!task) return false;
    
    task.assignee = assignee;
    this.progress.lastUpdate = new Date().toISOString();
    this.emit('task:assigned', { task: taskId, assignee });
    return true;
  }

  blockTask(taskId, blockedBy, reason = '') {
    const task = this.progress.tasks.get(taskId);
    if (!task) return false;

    task.status = 'blocked';
    task.blockedBy.push({ by: blockedBy, reason, time: new Date().toISOString() });
    this.progress.metrics.blockedTasks++;
    
    this.progress.lastUpdate = new Date().toISOString();
    this.emit('task:blocked', { task: taskId, blockedBy, reason });
    return true;
  }

  unblockTask(taskId) {
    const task = this.progress.tasks.get(taskId);
    if (!task || task.status !== 'blocked') return false;

    task.status = 'pending';
    this.progress.metrics.blockedTasks--;
    
    this.progress.lastUpdate = new Date().toISOString();
    this.emit('task:unblocked', { task: taskId });
    return true;
  }

  addTaskNote(taskId, note) {
    const task = this.progress.tasks.get(taskId);
    if (!task) return false;

    task.notes.push({ text: note, time: new Date().toISOString() });
    return true;
  }

  // Milestone management
  updateMilestone(milestoneId, status) {
    const milestone = this.progress.milestones.get(milestoneId);
    if (!milestone) return false;

    const oldStatus = milestone.status;
    milestone.status = status;
    
    if (status === 'completed') {
      milestone.completedDate = new Date().toISOString();
    }

    this.progress.lastUpdate = new Date().toISOString();
    this.addHistoryEntry('milestone', milestoneId, oldStatus, status);
    this.emit('milestone:updated', { milestone: milestoneId, status });
    return true;
  }

  completeMilestoneCriteria(milestoneId, criteriaIndex) {
    const milestone = this.progress.milestones.get(milestoneId);
    if (!milestone || !milestone.criteria[criteriaIndex]) return false;

    milestone.criteria[criteriaIndex].completed = true;
    
    // Check if all criteria completed
    if (milestone.criteria.every(c => c.completed)) {
      this.updateMilestone(milestoneId, 'completed');
    }

    this.emit('milestone:criteria-completed', { milestone: milestoneId, criteriaIndex });
    return true;
  }

  // Progress calculations
  recalculatePhaseProgress() {
    for (const [phaseName, phase] of this.progress.phases) {
      if (phase.tasks.length === 0) continue;

      let totalProgress = 0;
      for (const taskId of phase.tasks) {
        const task = this.progress.tasks.get(taskId);
        if (task) totalProgress += task.progress;
      }
      
      phase.progress = Math.round(totalProgress / phase.tasks.length);
    }
  }

  getOverallProgress() {
    const { totalTasks, completedTasks } = this.progress.metrics;
    if (totalTasks === 0) return 0;
    return Math.round((completedTasks / totalTasks) * 100);
  }

  // History tracking
  addHistoryEntry(type, id, oldStatus, newStatus) {
    this.progress.history.push({
      type,
      id,
      oldStatus,
      newStatus,
      timestamp: new Date().toISOString()
    });

    // Keep history manageable
    if (this.progress.history.length > 1000) {
      this.progress.history = this.progress.history.slice(-500);
    }
  }

  // Reporting
  getProgressReport() {
    const overall = this.getOverallProgress();
    const phases = Array.from(this.progress.phases.values());
    const tasks = Array.from(this.progress.tasks.values());
    const milestones = Array.from(this.progress.milestones.values());

    return {
      overall: {
        percentage: overall,
        status: overall === 100 ? 'completed' : overall > 0 ? 'in-progress' : 'not-started'
      },
      metrics: this.progress.metrics,
      phases: phases.map(p => ({
        name: p.name,
        status: p.status,
        progress: p.progress
      })),
      tasks: {
        total: tasks.length,
        byStatus: {
          pending: tasks.filter(t => t.status === 'pending').length,
          inProgress: tasks.filter(t => t.status === 'in-progress').length,
          completed: tasks.filter(t => t.status === 'completed').length,
          blocked: tasks.filter(t => t.status === 'blocked').length
        }
      },
      milestones: {
        total: milestones.length,
        completed: milestones.filter(m => m.status === 'completed').length,
        upcoming: milestones.filter(m => m.status === 'pending').slice(0, 3)
      },
      timeline: {
        startTime: this.progress.startTime,
        lastUpdate: this.progress.lastUpdate,
        elapsed: this.calculateElapsed()
      }
    };
  }

  calculateElapsed() {
    if (!this.progress.startTime) return '0d 0h';
    const start = new Date(this.progress.startTime);
    const now = new Date();
    const diff = now - start;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h`;
  }

  async generateProgressReport() {
    const report = this.getProgressReport();

    let content = `# Progress Report\n\n`;
    content += `**Generated:** ${new Date().toISOString()}\n`;
    content += `**Elapsed Time:** ${report.timeline.elapsed}\n\n`;

    content += `## Overall Progress\n\n`;
    content += `**${report.overall.percentage}%** - ${report.overall.status}\n\n`;
    content += this.generateProgressBar(report.overall.percentage) + '\n\n';

    content += `## Metrics\n\n`;
    content += `| Metric | Value |\n`;
    content += `|--------|-------|\n`;
    content += `| Total Tasks | ${report.metrics.totalTasks} |\n`;
    content += `| Completed | ${report.metrics.completedTasks} |\n`;
    content += `| In Progress | ${report.metrics.inProgressTasks} |\n`;
    content += `| Blocked | ${report.metrics.blockedTasks} |\n\n`;

    content += `## Phase Progress\n\n`;
    for (const phase of report.phases) {
      content += `### ${phase.name}\n`;
      content += `Status: ${phase.status} | Progress: ${phase.progress}%\n`;
      content += this.generateProgressBar(phase.progress) + '\n\n';
    }

    content += `## Task Summary\n\n`;
    content += `| Status | Count |\n`;
    content += `|--------|-------|\n`;
    content += `| Pending | ${report.tasks.byStatus.pending} |\n`;
    content += `| In Progress | ${report.tasks.byStatus.inProgress} |\n`;
    content += `| Completed | ${report.tasks.byStatus.completed} |\n`;
    content += `| Blocked | ${report.tasks.byStatus.blocked} |\n\n`;

    content += `## Milestones\n\n`;
    content += `Completed: ${report.milestones.completed}/${report.milestones.total}\n\n`;
    if (report.milestones.upcoming.length > 0) {
      content += `### Upcoming Milestones\n\n`;
      for (const m of report.milestones.upcoming) {
        content += `- **${m.name}** - Target: ${m.targetDate}\n`;
      }
    }

    return content;
  }

  generateProgressBar(percentage, width = 30) {
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${percentage}%`;
  }

  // Persistence
  async save() {
    const dir = this.options.outputDir;
    await fs.mkdir(dir, { recursive: true });

    const data = {
      ...this.progress,
      phases: Object.fromEntries(this.progress.phases),
      tasks: Object.fromEntries(this.progress.tasks),
      milestones: Object.fromEntries(this.progress.milestones)
    };

    const filePath = path.join(dir, 'progress.json');
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    
    // Also save markdown report
    const report = await this.generateProgressReport();
    await fs.writeFile(path.join(dir, 'PROGRESS_REPORT.md'), report, 'utf8');

    this.log(`💾 Progress saved to ${dir}`);
    this.emit('progress:saved');
  }

  async autoSave() {
    try {
      await this.save();
    } catch (error) {
      this.log(`Auto-save failed: ${error.message}`);
    }
  }

  async load(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(content);

      this.progress = {
        ...data,
        phases: new Map(Object.entries(data.phases || {})),
        tasks: new Map(Object.entries(data.tasks || {})),
        milestones: new Map(Object.entries(data.milestones || {}))
      };

      this.log(`📂 Progress loaded from ${filePath}`);
      this.emit('progress:loaded');
      return true;
    } catch (error) {
      this.log(`Failed to load progress: ${error.message}`);
      return false;
    }
  }
}

export default ProgressTracker;
