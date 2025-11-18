/**
 * AUTONOMOUS CONTEXT COMPACTOR
 * =============================
 * Intelligently manages context windows to enable continuous building without human intervention.
 *
 * Features:
 * - Monitors context usage in real-time
 * - Intelligently compacts/summarizes when approaching limits
 * - Preserves CRITICAL information needed to continue
 * - Removes redundant/obsolete context
 * - Creates checkpoints for recovery
 * - Enables unlimited autonomous building sessions
 *
 * This is what allows the system to build continuously without stopping.
 */

import { EventEmitter } from 'events';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import crypto from 'crypto';

export class ContextCompactor extends EventEmitter {
  constructor(options = {}) {
    super();

    this.maxTokens = options.maxTokens || 200000; // 200k default (Claude's limit)
    this.compactionThreshold = options.compactionThreshold || 0.80; // Compact at 80%
    this.criticalThreshold = options.criticalThreshold || 0.95; // Emergency at 95%
    this.preservePercent = options.preservePercent || 0.40; // Keep 40% of most important

    this.projectPath = options.projectPath || process.cwd();
    this.checkpointDir = join(this.projectPath, '.context-checkpoints');

    // Current context state
    this.context = {
      conversation: [],
      codeSnippets: [],
      decisions: [],
      tasks: [],
      errors: [],
      learnings: [],
      checkpoints: []
    };

    this.currentTokens = 0;
    this.compactionCount = 0;
    this.preservedSessions = [];

    // Intelligence for scoring importance
    this.importanceWeights = {
      recentMessages: 2.0,      // Recent is important
      decisions: 3.0,           // Architectural decisions are critical
      errors: 2.5,              // Error context is important
      activeTasks: 3.5,         // Current work is most important
      completedTasks: 1.0,      // Completed work less important
      codeSnippets: 1.5,        // Code is moderately important
      learnings: 2.0            // Learnings are important
    };

    console.log('\n🗜️  Context Compactor initialized');
    console.log(`   Max tokens: ${this.maxTokens.toLocaleString()}`);
    console.log(`   Will compact at: ${(this.compactionThreshold * 100).toFixed(0)}%`);
  }

  /**
   * ADD TO CONTEXT - Add new information to context
   */
  addToContext(type, data) {
    const entry = {
      type,
      data,
      timestamp: Date.now(),
      tokens: this._estimateTokens(data),
      importance: this._calculateImportance(type, data),
      id: this._generateId()
    };

    // Add to appropriate context category
    switch (type) {
      case 'message':
        this.context.conversation.push(entry);
        break;
      case 'code':
        this.context.codeSnippets.push(entry);
        break;
      case 'decision':
        this.context.decisions.push(entry);
        break;
      case 'task':
        this.context.tasks.push(entry);
        break;
      case 'error':
        this.context.errors.push(entry);
        break;
      case 'learning':
        this.context.learnings.push(entry);
        break;
    }

    // Update token count
    this.currentTokens += entry.tokens;

    // Check if we need to compact
    this._checkCompactionNeeded();

    return entry.id;
  }

  /**
   * CHECK COMPACTION - See if we need to compact
   */
  _checkCompactionNeeded() {
    const usage = this.currentTokens / this.maxTokens;

    if (usage >= this.criticalThreshold) {
      console.log('\n🚨 CRITICAL: Context at 95% - Emergency compaction!');
      this._emergencyCompact();
    } else if (usage >= this.compactionThreshold) {
      console.log('\n🗜️  Context at 80% - Smart compaction starting...');
      this._smartCompact();
    }
  }

  /**
   * SMART COMPACT - Intelligently reduce context while preserving critical info
   */
  async _smartCompact() {
    console.log('\n📊 SMART COMPACTION IN PROGRESS...\n');

    const beforeTokens = this.currentTokens;

    // Step 1: Create checkpoint BEFORE compaction
    await this._createCheckpoint();

    // Step 2: Score all context entries by importance
    console.log('⚖️  Step 1: Scoring all context entries...');
    const scored = this._scoreAllEntries();
    console.log(`   Scored ${scored.length} entries\n`);

    // Step 3: Determine what to keep vs compact
    console.log('🎯 Step 2: Determining what to preserve...');
    const targetTokens = Math.floor(this.maxTokens * this.preservePercent);
    const { keep, compact } = this._selectEntriesForCompaction(scored, targetTokens);
    console.log(`   Keeping ${keep.length} entries, compacting ${compact.length}\n`);

    // Step 4: Compact the low-importance entries
    console.log('🔄 Step 3: Compacting low-importance entries...');
    const summary = this._compactEntries(compact);
    console.log(`   Created summary: ${summary.tokens} tokens\n`);

    // Step 5: Rebuild context with kept entries + summary
    console.log('🏗️  Step 4: Rebuilding context...');
    this._rebuildContext(keep, summary);
    console.log('   Context rebuilt\n');

    const afterTokens = this.currentTokens;
    const saved = beforeTokens - afterTokens;
    const savedPercent = (saved / beforeTokens * 100).toFixed(1);

    this.compactionCount++;

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ SMART COMPACTION COMPLETE!\n');
    console.log(`📊 Statistics:`);
    console.log(`   Before: ${beforeTokens.toLocaleString()} tokens`);
    console.log(`   After:  ${afterTokens.toLocaleString()} tokens`);
    console.log(`   Saved:  ${saved.toLocaleString()} tokens (${savedPercent}%)`);
    console.log(`   Usage:  ${(afterTokens / this.maxTokens * 100).toFixed(1)}%\n`);

    this.emit('compaction:complete', {
      before: beforeTokens,
      after: afterTokens,
      saved,
      savedPercent: parseFloat(savedPercent)
    });
  }

  /**
   * EMERGENCY COMPACT - Aggressive compaction for critical situations
   */
  async _emergencyCompact() {
    console.log('\n🚨 EMERGENCY COMPACTION IN PROGRESS...\n');

    // In emergency, only keep absolutely critical info
    const targetTokens = Math.floor(this.maxTokens * 0.25); // Only 25%

    // Prioritize: active tasks > recent errors > decisions > everything else
    const critical = [
      ...this.context.tasks.filter(t => t.data.status !== 'completed'),
      ...this.context.errors.slice(-5), // Last 5 errors
      ...this.context.decisions.slice(-10), // Last 10 decisions
      ...this.context.learnings.slice(-5) // Last 5 learnings
    ];

    // Compact everything else aggressively
    const summary = {
      type: 'emergency_summary',
      data: {
        compactedAt: Date.now(),
        originalTokens: this.currentTokens,
        conversation: `Compacted ${this.context.conversation.length} messages`,
        codeSnippets: `Compacted ${this.context.codeSnippets.length} code snippets`,
        tasks: `${this.context.tasks.filter(t => t.data.status === 'completed').length} completed tasks`,
        note: 'Emergency compaction - only critical context preserved'
      },
      tokens: 500,
      importance: 1.5
    };

    this.context = {
      conversation: [summary],
      codeSnippets: [],
      decisions: this.context.decisions.slice(-10),
      tasks: this.context.tasks.filter(t => t.data.status !== 'completed'),
      errors: this.context.errors.slice(-5),
      learnings: this.context.learnings.slice(-5),
      checkpoints: this.context.checkpoints
    };

    this._recalculateTokens();

    console.log('✅ Emergency compaction complete\n');
    console.log(`   Reduced to ${this.currentTokens.toLocaleString()} tokens\n`);

    this.emit('compaction:emergency', {
      tokensAfter: this.currentTokens
    });
  }

  /**
   * CREATE CHECKPOINT - Save current context state for recovery
   */
  async _createCheckpoint() {
    await mkdir(this.checkpointDir, { recursive: true });

    const checkpoint = {
      id: this._generateId(),
      timestamp: Date.now(),
      tokens: this.currentTokens,
      context: JSON.parse(JSON.stringify(this.context)), // Deep clone
      compactionCount: this.compactionCount
    };

    const filename = `checkpoint-${checkpoint.id}.json`;
    const filepath = join(this.checkpointDir, filename);

    await writeFile(filepath, JSON.stringify(checkpoint, null, 2));

    this.context.checkpoints.push({
      id: checkpoint.id,
      timestamp: checkpoint.timestamp,
      tokens: checkpoint.tokens,
      file: filename
    });

    console.log(`   💾 Checkpoint created: ${filename}`);

    return checkpoint;
  }

  /**
   * RESTORE FROM CHECKPOINT - Recover from a checkpoint
   */
  async restoreFromCheckpoint(checkpointId) {
    const filename = `checkpoint-${checkpointId}.json`;
    const filepath = join(this.checkpointDir, filename);

    const data = await readFile(filepath, 'utf-8');
    const checkpoint = JSON.parse(data);

    this.context = checkpoint.context;
    this.currentTokens = checkpoint.tokens;
    this.compactionCount = checkpoint.compactionCount;

    console.log(`\n✅ Restored from checkpoint: ${checkpointId}`);
    console.log(`   Tokens: ${this.currentTokens.toLocaleString()}\n`);

    this.emit('checkpoint:restored', checkpoint);

    return checkpoint;
  }

  /**
   * SCORE ALL ENTRIES - Calculate importance scores for all context
   */
  _scoreAllEntries() {
    const all = [
      ...this.context.conversation.map(e => ({ ...e, category: 'conversation' })),
      ...this.context.codeSnippets.map(e => ({ ...e, category: 'code' })),
      ...this.context.decisions.map(e => ({ ...e, category: 'decisions' })),
      ...this.context.tasks.map(e => ({ ...e, category: 'tasks' })),
      ...this.context.errors.map(e => ({ ...e, category: 'errors' })),
      ...this.context.learnings.map(e => ({ ...e, category: 'learnings' }))
    ];

    // Recalculate importance with recency bonus
    const now = Date.now();
    all.forEach(entry => {
      const ageHours = (now - entry.timestamp) / (1000 * 60 * 60);
      const recencyBonus = Math.max(0, 1 - (ageHours / 24)); // Decays over 24 hours
      entry.finalScore = entry.importance * (1 + recencyBonus);
    });

    // Sort by final score descending
    return all.sort((a, b) => b.finalScore - a.finalScore);
  }

  /**
   * SELECT ENTRIES FOR COMPACTION - Choose what to keep vs compact
   */
  _selectEntriesForCompaction(scored, targetTokens) {
    const keep = [];
    const compact = [];

    let currentTokens = 0;

    for (const entry of scored) {
      if (currentTokens < targetTokens) {
        keep.push(entry);
        currentTokens += entry.tokens;
      } else {
        compact.push(entry);
      }
    }

    return { keep, compact };
  }

  /**
   * COMPACT ENTRIES - Create summary from entries to be compacted
   */
  _compactEntries(entries) {
    const summary = {
      type: 'compacted_summary',
      data: {
        compactedAt: Date.now(),
        entriesCompacted: entries.length,
        categories: {},
        keyPoints: []
      },
      timestamp: Date.now(),
      tokens: 0,
      importance: 1.0,
      id: this._generateId()
    };

    // Group by category
    for (const entry of entries) {
      if (!summary.data.categories[entry.category]) {
        summary.data.categories[entry.category] = 0;
      }
      summary.data.categories[entry.category]++;
    }

    // Extract key points from decisions and learnings
    const importantEntries = entries
      .filter(e => e.category === 'decisions' || e.category === 'learnings')
      .slice(0, 10);

    for (const entry of importantEntries) {
      summary.data.keyPoints.push({
        category: entry.category,
        summary: this._summarizeEntry(entry),
        timestamp: entry.timestamp
      });
    }

    summary.tokens = this._estimateTokens(summary.data);

    return summary;
  }

  /**
   * REBUILD CONTEXT - Rebuild context with kept entries + summary
   */
  _rebuildContext(keep, summary) {
    // Clear all context
    this.context = {
      conversation: [],
      codeSnippets: [],
      decisions: [],
      tasks: [],
      errors: [],
      learnings: [],
      checkpoints: this.context.checkpoints
    };

    // Add summary
    this.context.conversation.push(summary);

    // Re-add kept entries
    for (const entry of keep) {
      switch (entry.category) {
        case 'conversation':
          this.context.conversation.push(entry);
          break;
        case 'code':
          this.context.codeSnippets.push(entry);
          break;
        case 'decisions':
          this.context.decisions.push(entry);
          break;
        case 'tasks':
          this.context.tasks.push(entry);
          break;
        case 'errors':
          this.context.errors.push(entry);
          break;
        case 'learnings':
          this.context.learnings.push(entry);
          break;
      }
    }

    this._recalculateTokens();
  }

  /**
   * RECALCULATE TOKENS - Recalculate total token count
   */
  _recalculateTokens() {
    this.currentTokens = 0;

    const allEntries = [
      ...this.context.conversation,
      ...this.context.codeSnippets,
      ...this.context.decisions,
      ...this.context.tasks,
      ...this.context.errors,
      ...this.context.learnings
    ];

    for (const entry of allEntries) {
      this.currentTokens += entry.tokens;
    }
  }

  /**
   * ESTIMATE TOKENS - Rough estimation (1 token ≈ 4 characters)
   */
  _estimateTokens(data) {
    const str = typeof data === 'string' ? data : JSON.stringify(data);
    return Math.ceil(str.length / 4);
  }

  /**
   * CALCULATE IMPORTANCE - Score importance of entry
   */
  _calculateImportance(type, data) {
    switch (type) {
      case 'message':
        return this.importanceWeights.recentMessages;
      case 'decision':
        return this.importanceWeights.decisions;
      case 'error':
        return this.importanceWeights.errors;
      case 'task':
        return data.status === 'active'
          ? this.importanceWeights.activeTasks
          : this.importanceWeights.completedTasks;
      case 'code':
        return this.importanceWeights.codeSnippets;
      case 'learning':
        return this.importanceWeights.learnings;
      default:
        return 1.0;
    }
  }

  /**
   * SUMMARIZE ENTRY - Create brief summary of entry
   */
  _summarizeEntry(entry) {
    if (typeof entry.data === 'string') {
      return entry.data.substring(0, 100) + '...';
    }
    return JSON.stringify(entry.data).substring(0, 100) + '...';
  }

  /**
   * GENERATE ID - Generate unique ID
   */
  _generateId() {
    return crypto.randomBytes(8).toString('hex');
  }

  /**
   * GET STATUS - Get current compactor status
   */
  getStatus() {
    return {
      currentTokens: this.currentTokens,
      maxTokens: this.maxTokens,
      usage: (this.currentTokens / this.maxTokens * 100).toFixed(1),
      compactionCount: this.compactionCount,
      checkpoints: this.context.checkpoints.length,
      context: {
        conversation: this.context.conversation.length,
        code: this.context.codeSnippets.length,
        decisions: this.context.decisions.length,
        tasks: this.context.tasks.length,
        errors: this.context.errors.length,
        learnings: this.context.learnings.length
      }
    };
  }

  /**
   * CLEAR CONTEXT - Reset context (use with caution!)
   */
  clearContext() {
    this.context = {
      conversation: [],
      codeSnippets: [],
      decisions: [],
      tasks: [],
      errors: [],
      learnings: [],
      checkpoints: []
    };
    this.currentTokens = 0;
    console.log('\n🗑️  Context cleared\n');
  }
}

export default ContextCompactor;
