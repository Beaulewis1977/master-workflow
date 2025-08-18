#!/usr/bin/env node

/**
 * Interactive Document Updater
 * Handles interactive document update UI and user choices
 * 
 * Features:
 * - Interactive CLI for document updates
 * - Batch operations for similar documents
 * - User preference learning
 * - Progress tracking and rollback
 * - Integration with SharedMemory
 */

const readline = require('readline');
const chalk = require('chalk');
const EventEmitter = require('events');

class InteractiveDocumentUpdater extends EventEmitter {
  constructor(sharedMemory) {
    super();
    
    this.sharedMemory = sharedMemory;
    this.rl = null;
    this.userPreferences = new Map();
    this.sessionHistory = [];
    this.isActive = false;
    
    // Load user preferences from memory
    this.loadUserPreferences();
  }
  
  /**
   * Initialize readline interface
   */
  initializeInterface() {
    if (!this.rl) {
      this.rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true
      });
      
      // Setup keyboard shortcuts
      this.rl.on('SIGINT', () => {
        this.handleCancel();
      });
    }
    
    this.isActive = true;
  }
  
  /**
   * Cleanup readline interface
   */
  cleanup() {
    if (this.rl) {
      this.rl.close();
      this.rl = null;
    }
    
    this.isActive = false;
    this.saveUserPreferences();
  }
  
  /**
   * Present update options with enhanced UI
   */
  async presentUpdateOptions(updatePlan) {
    try {
      this.initializeInterface();
      
      const docCount = updatePlan.documents.length;
      const customCount = updatePlan.documents.reduce(
        (sum, doc) => sum + (doc.customizations?.length || 0), 
        0
      );
      
      // Enhanced display
      this.displayUpdateHeader(docCount, customCount);
      this.displayDocumentSummary(updatePlan.documents);
      this.displayOptions();
      
      // Check for user preferences
      const preferredAction = await this.checkUserPreferences(updatePlan);
      if (preferredAction && await this.confirmPreferredAction(preferredAction)) {
        return preferredAction;
      }
      
      // Get user choice
      const choice = await this.getUserChoice(['1', '2', '3', '4', '5', 'h']);
      
      // Record choice for learning
      this.recordUserChoice(updatePlan, choice);
      
      const choices = {
        '1': 'update',
        '2': 'skip',
        '3': 'preview',
        '4': 'customize',
        '5': 'batch',
        'h': 'help'
      };
      
      const action = choices[choice];
      
      if (action === 'help') {
        await this.showHelp();
        return await this.presentUpdateOptions(updatePlan);
      }
      
      return action;
      
    } catch (error) {
      this.emit('error', new Error(`Failed to present update options: ${error.message}`));
      throw error;
    }
  }
  
  /**
   * Display update header with styling
   */
  displayUpdateHeader(docCount, customCount) {
    console.log(chalk.cyan('\n' + '='.repeat(60)));
    console.log(chalk.cyan('📄 DOCUMENT UPDATE ASSISTANT'));
    console.log(chalk.cyan('='.repeat(60)));
    
    console.log(chalk.yellow(`\n📝 ${docCount} document(s) have updates available`));
    
    if (customCount > 0) {
      console.log(chalk.magenta(`✨ ${customCount} customization(s) detected and will be preserved`));
    }
  }
  
  /**
   * Display document summary
   */
  displayDocumentSummary(documents) {
    console.log(chalk.gray('\n📋 Documents to update:'));
    
    documents.forEach((doc, index) => {
      const status = doc.customizations?.length > 0 ? 
        chalk.magenta(' (customized)') : 
        chalk.gray(' (standard)');
        
      console.log(chalk.gray(`  ${index + 1}. ${doc.path}${status}`));
      
      if (doc.diff && doc.diff.length > 0) {
        const changeCount = doc.diff.filter(change => change.added || change.removed).length;
        console.log(chalk.gray(`     ${changeCount} change(s) detected`));
      }
    });
  }
  
  /**
   * Display available options
   */
  displayOptions() {
    console.log(chalk.white('\n📋 Available Actions:'));
    console.log('  1) ' + chalk.green('Update') + ' - Apply updates while preserving customizations');
    console.log('  2) ' + chalk.yellow('Skip') + ' - Keep existing documents unchanged');
    console.log('  3) ' + chalk.cyan('Preview') + ' - Show detailed diff of changes');
    console.log('  4) ' + chalk.blue('Customize') + ' - Choose specific changes to apply');
    console.log('  5) ' + chalk.magenta('Batch') + ' - Apply same action to all similar documents');
    console.log('  h) ' + chalk.gray('Help') + ' - Show detailed help information');
  }
  
  /**
   * Handle batch operations
   */
  async handleBatchOperation(updatePlan) {
    try {
      console.log(chalk.magenta('\n🔄 Batch Operation Mode'));
      
      // Group documents by type
      const groups = this.groupDocumentsByType(updatePlan.documents);
      
      console.log(chalk.gray(`\nFound ${groups.length} document group(s):`));
      
      groups.forEach((group, index) => {
        console.log(chalk.gray(`  ${index + 1}. ${group.type} (${group.documents.length} files)`));
        group.documents.forEach(doc => {
          console.log(chalk.gray(`     - ${doc.path}`));
        });
      });
      
      console.log(chalk.white('\nBatch Actions:'));
      console.log('  1) Update all groups');
      console.log('  2) Skip all groups');
      console.log('  3) Choose per group');
      console.log('  4) Back to document list');
      
      const choice = await this.getUserChoice(['1', '2', '3', '4']);
      
      switch (choice) {
        case '1':
          return { action: 'update-all', groups };
        case '2':
          return { action: 'skip-all', groups };
        case '3':
          return await this.handlePerGroupChoice(groups);
        case '4':
          return null; // Return to main menu
      }
      
    } catch (error) {
      this.emit('error', new Error(`Failed to handle batch operation: ${error.message}`));
      throw error;
    }
  }
  
  /**
   * Handle per-group choice in batch mode
   */
  async handlePerGroupChoice(groups) {
    const groupChoices = {};
    
    for (const group of groups) {
      console.log(chalk.cyan(`\n📁 ${group.type} Group (${group.documents.length} files):`));
      
      group.documents.forEach(doc => {
        console.log(chalk.gray(`  - ${doc.path}`));
      });
      
      console.log('\nAction for this group:');
      console.log('  1) Update all files in group');
      console.log('  2) Skip all files in group');
      console.log('  3) Preview all files in group');
      
      const choice = await this.getUserChoice(['1', '2', '3']);
      
      const actions = {
        '1': 'update',
        '2': 'skip',
        '3': 'preview'
      };
      
      groupChoices[group.type] = actions[choice];
    }
    
    return { action: 'per-group', choices: groupChoices, groups };
  }
  
  /**
   * Show progress during operations
   */
  showProgress(current, total, operation = 'Processing') {
    const percentage = Math.round((current / total) * 100);
    const barLength = 30;
    const filledLength = Math.round((percentage / 100) * barLength);
    const bar = '█'.repeat(filledLength) + '-'.repeat(barLength - filledLength);
    
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(
      chalk.cyan(`${operation}: [${bar}] ${percentage}% (${current}/${total})`)
    );
    
    if (current === total) {
      process.stdout.write('\n');
    }
  }
  
  /**
   * Confirm dangerous operations
   */
  async confirmDangerousOperation(operation, details = '') {
    console.log(chalk.red(`\n⚠️  Warning: ${operation}`));
    
    if (details) {
      console.log(chalk.gray(details));
    }
    
    console.log(chalk.white('\nThis operation cannot be easily undone.'));
    console.log('Type "yes" to confirm, or anything else to cancel:');
    
    const confirmation = await this.getTextInput();
    return confirmation.toLowerCase() === 'yes';
  }
  
  /**
   * Handle rollback operations
   */
  async handleRollback() {
    try {
      console.log(chalk.yellow('\n↶ Rollback Assistant'));
      
      // Get available rollback points from shared memory
      const rollbackPoints = await this.getRollbackPoints();
      
      if (rollbackPoints.length === 0) {
        console.log(chalk.gray('No rollback points available.'));
        return null;
      }
      
      console.log(chalk.gray('\nAvailable rollback points:'));
      
      rollbackPoints.forEach((point, index) => {
        const date = new Date(point.timestamp).toLocaleString();
        console.log(chalk.gray(`  ${index + 1}. ${date} - ${point.description}`));
      });
      
      console.log('  0. Cancel rollback');
      
      const choices = rollbackPoints.map((_, i) => (i + 1).toString()).concat(['0']);
      const choice = await this.getUserChoice(choices);
      
      if (choice === '0') {
        return null;
      }
      
      const selectedPoint = rollbackPoints[parseInt(choice) - 1];
      
      const confirmed = await this.confirmDangerousOperation(
        'Rollback to previous state',
        `This will restore documents to state from: ${new Date(selectedPoint.timestamp).toLocaleString()}`
      );
      
      return confirmed ? selectedPoint : null;
      
    } catch (error) {
      this.emit('error', new Error(`Failed to handle rollback: ${error.message}`));
      throw error;
    }
  }
  
  /**
   * Show detailed help information
   */
  async showHelp() {
    console.log(chalk.cyan('\n' + '='.repeat(60)));
    console.log(chalk.cyan('📖 DOCUMENT UPDATE HELP'));
    console.log(chalk.cyan('='.repeat(60)));
    
    console.log(chalk.white('\n🔧 Update Actions:'));
    console.log(chalk.green('Update') + ' - Applies all changes while preserving your customizations');
    console.log('  • Safe operation that merges new content with your changes');
    console.log('  • Automatically creates backups before updating');
    console.log('  • Preserves custom sections, comments, and modifications');
    
    console.log(chalk.yellow('\nSkip') + ' - Keeps documents unchanged');
    console.log('  • No changes are made to existing files');
    console.log('  • Useful when you want to handle updates manually');
    
    console.log(chalk.cyan('\nPreview') + ' - Shows detailed diff of all changes');
    console.log('  • View exactly what will change before deciding');
    console.log('  • Color-coded additions (green) and removals (red)');
    console.log('  • Shows preserved customizations');
    
    console.log(chalk.blue('\nCustomize') + ' - Choose specific changes to apply');
    console.log('  • Review each change individually');
    console.log('  • Accept or reject specific modifications');
    console.log('  • Maximum control over the update process');
    
    console.log(chalk.magenta('\nBatch') + ' - Apply same action to similar documents');
    console.log('  • Groups documents by type (config, docs, rules, etc.)');
    console.log('  • Apply same action to entire groups');
    console.log('  • Efficient for large document sets');
    
    console.log(chalk.white('\n⌨️  Keyboard Shortcuts:'));
    console.log('  Ctrl+C - Cancel current operation');
    console.log('  Enter  - Confirm current selection');
    
    console.log(chalk.white('\n💡 Tips:'));
    console.log('  • Your preferences are remembered for similar updates');
    console.log('  • All updates create automatic backups');
    console.log('  • Customizations are detected and preserved automatically');
    console.log('  • Use Preview to understand changes before applying');
    
    await this.getUserChoice(['']); // Wait for enter
  }
  
  /**
   * Get text input from user
   */
  async getTextInput(prompt = '') {
    return new Promise(resolve => {
      this.rl.question(prompt, answer => {
        resolve(answer.trim());
      });
    });
  }
  
  /**
   * Get user choice from options
   */
  async getUserChoice(options, prompt = null) {
    if (!this.rl) {
      throw new Error('Interface not initialized');
    }
    
    const defaultPrompt = `Choose option (${options.filter(o => o).join('/')}): `;
    
    return new Promise(resolve => {
      this.rl.question(prompt || defaultPrompt, answer => {
        const normalizedAnswer = answer.toLowerCase().trim();
        
        if (options.includes(normalizedAnswer) || options.includes(answer)) {
          resolve(answer);
        } else {
          console.log(chalk.red('Invalid option. Please try again.'));
          resolve(this.getUserChoice(options, prompt));
        }
      });
    });
  }
  
  /**
   * Handle user cancellation
   */
  handleCancel() {
    console.log(chalk.yellow('\n\n🚫 Operation cancelled by user'));
    this.cleanup();
    process.exit(0);
  }
  
  /**
   * Load user preferences from shared memory
   */
  async loadUserPreferences() {
    try {
      const preferences = await this.sharedMemory.get('interactive-updater:preferences');
      if (preferences) {
        this.userPreferences = new Map(preferences);
      }
    } catch (error) {
      // Preferences don't exist yet, that's ok
    }
  }
  
  /**
   * Save user preferences to shared memory
   */
  async saveUserPreferences() {
    try {
      await this.sharedMemory.set(
        'interactive-updater:preferences',
        Array.from(this.userPreferences.entries()),
        {
          namespace: this.sharedMemory.namespaces.CONFIG,
          dataType: this.sharedMemory.dataTypes.PERSISTENT
        }
      );
    } catch (error) {
      this.emit('error', new Error(`Failed to save user preferences: ${error.message}`));
    }
  }
  
  /**
   * Check for learned user preferences
   */
  async checkUserPreferences(updatePlan) {
    const documentTypes = this.groupDocumentsByType(updatePlan.documents);
    
    for (const group of documentTypes) {
      const preferenceKey = `default-action:${group.type}`;
      if (this.userPreferences.has(preferenceKey)) {
        return this.userPreferences.get(preferenceKey);
      }
    }
    
    return null;
  }
  
  /**
   * Confirm if user wants to use preferred action
   */
  async confirmPreferredAction(action) {
    console.log(chalk.cyan(`\n🤖 Based on your previous choices, I suggest: ${chalk.bold(action)}`));
    const confirm = await this.getUserChoice(['y', 'n'], 'Use this suggestion? (y/n): ');
    return confirm === 'y';
  }
  
  /**
   * Record user choice for learning
   */
  recordUserChoice(updatePlan, choice) {
    const documentTypes = this.groupDocumentsByType(updatePlan.documents);
    const actions = {
      '1': 'update',
      '2': 'skip', 
      '3': 'preview',
      '4': 'customize',
      '5': 'batch'
    };
    
    const action = actions[choice];
    if (action && documentTypes.length === 1) {
      // Learn preference for single document type
      const preferenceKey = `default-action:${documentTypes[0].type}`;
      this.userPreferences.set(preferenceKey, action);
    }
    
    // Record in session history
    this.sessionHistory.push({
      timestamp: Date.now(),
      updatePlan: updatePlan.documents.map(doc => ({ path: doc.path, type: this.getDocumentType(doc.path) })),
      choice,
      action
    });
  }
  
  /**
   * Group documents by type for batch operations
   */
  groupDocumentsByType(documents) {
    const groups = new Map();
    
    documents.forEach(doc => {
      const type = this.getDocumentType(doc.path);
      
      if (!groups.has(type)) {
        groups.set(type, {
          type,
          documents: []
        });
      }
      
      groups.get(type).documents.push(doc);
    });
    
    return Array.from(groups.values());
  }
  
  /**
   * Get document type for grouping
   */
  getDocumentType(path) {
    const basename = path.split('/').pop();
    
    if (basename === 'CLAUDE.md') return 'claude-config';
    if (basename === 'Agent-OS.md') return 'agent-os';
    if (basename.endsWith('.rules')) return 'rules';
    if (basename.endsWith('.md')) return 'documentation';
    if (basename.endsWith('.json')) return 'config';
    if (basename.endsWith('.yml') || basename.endsWith('.yaml')) return 'config';
    
    return 'other';
  }
  
  /**
   * Get rollback points from shared memory
   */
  async getRollbackPoints() {
    try {
      const points = await this.sharedMemory.get('document-versioning:rollback-points');
      return points || [];
    } catch (error) {
      return [];
    }
  }
  
  /**
   * Display session summary
   */
  displaySessionSummary() {
    if (this.sessionHistory.length === 0) {
      return;
    }
    
    console.log(chalk.cyan('\n📊 Session Summary:'));
    
    const actionCounts = {};
    this.sessionHistory.forEach(entry => {
      actionCounts[entry.action] = (actionCounts[entry.action] || 0) + 1;
    });
    
    Object.entries(actionCounts).forEach(([action, count]) => {
      console.log(chalk.gray(`  ${action}: ${count} times`));
    });
  }
  
  /**
   * Cleanup and finalize
   */
  async finalize() {
    this.displaySessionSummary();
    await this.saveUserPreferences();
    this.cleanup();
  }
}

module.exports = InteractiveDocumentUpdater;