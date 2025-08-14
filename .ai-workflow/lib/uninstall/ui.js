/**
 * User Interface Module - Phase 3 Enhanced Version
 * Handles interactive prompts, rich UI, and command-line argument parsing
 */

const readline = require('readline');
const { stdin, stdout } = process;
const inquirer = require('inquirer');
const chalk = require('chalk');
const Table = require('cli-table3');
const { FileClassifier } = require('./classifier');
const { PlanBuilder } = require('./plan');

class UIManager {
    constructor() {
        this.rl = null;
    }

    /**
     * Parse command-line arguments
     */
    parseArgs(args) {
        const config = {
            dryRun: true,  // Default to dry-run for safety
            interactive: true,
            keepGenerated: true,
            purgeCaches: true,
            gitProtect: true,
            backup: null,
            ignoreGit: false,
            nonInteractive: false,
            yes: false,
            jsonOutput: false,
            debug: false,
            forceEnable: false
        };

        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            
            switch (arg) {
                case '--dry-run':
                    config.dryRun = true;
                    break;
                case '--no-dry-run':
                    config.dryRun = false;
                    break;
                case '--yes':
                case '-y':
                    config.yes = true;
                    config.nonInteractive = true;
                    break;
                case '--interactive':
                    config.interactive = true;
                    config.nonInteractive = false;
                    break;
                case '--non-interactive':
                    config.nonInteractive = true;
                    config.interactive = false;
                    break;
                case '--keep-generated':
                    config.keepGenerated = true;
                    break;
                case '--no-keep-generated':
                    config.keepGenerated = false;
                    break;
                case '--purge-caches':
                    config.purgeCaches = true;
                    break;
                case '--no-purge-caches':
                    config.purgeCaches = false;
                    break;
                case '--git-protect':
                    config.gitProtect = true;
                    break;
                case '--ignore-git':
                    config.ignoreGit = true;
                    config.gitProtect = false;
                    break;
                case '--backup':
                    if (i + 1 < args.length) {
                        config.backup = args[++i];
                    } else {
                        config.backup = 'auto';  // Generate automatic backup path
                    }
                    break;
                case '--json':
                    config.jsonOutput = true;
                    break;
                case '--debug':
                    config.debug = true;
                    break;
                case '--force-enable':
                    config.forceEnable = true;
                    break;
                case '--help':
                case '-h':
                    this.printHelp();
                    process.exit(0);
                    break;
                default:
                    if (arg.startsWith('-')) {
                        console.error(`Unknown option: ${arg}`);
                        this.printHelp();
                        process.exit(1);
                    }
            }
        }

        return config;
    }

    /**
     * Print help message
     */
    printHelp() {
        const help = `
AI Workflow Uninstaller v1.0.0

Safe, interactive uninstaller that preserves user-generated content
while removing only system-installed components.

USAGE:
    ./ai-workflow uninstall [OPTIONS]

OPTIONS:
    --dry-run              Preview what would be removed (default)
    --no-dry-run           Actually perform the uninstallation
    --yes, -y              Skip all prompts (non-interactive mode)
    --interactive          Enable interactive mode with enhanced UI
    --non-interactive      Run without prompts
    
    --keep-generated       Keep generated documents (default)
    --no-keep-generated    Remove generated documents too
    
    --purge-caches         Remove cache and log files (default)
    --no-purge-caches      Keep cache and log files
    
    --git-protect          Protect git-tracked files (default)
    --ignore-git           Allow removal of git-tracked files
    
    --backup [path]        Create backup before removal
    --json                 Output plan in JSON format
    --debug                Enable debug output
    --force-enable         Bypass feature flag check
    --help, -h             Show this help message

EXAMPLES:
    # Preview what would be removed (safe)
    ./ai-workflow uninstall
    
    # Actually uninstall with backup
    ./ai-workflow uninstall --no-dry-run --backup
    
    # Non-interactive uninstall (CI/automation)
    ./ai-workflow uninstall --no-dry-run --yes
    
    # Keep all generated files and caches
    ./ai-workflow uninstall --no-dry-run --keep-generated --no-purge-caches

SAFETY FEATURES:
    • Dry-run by default
    • Preserves user-generated content
    • Git-tracked file protection
    • Backup creation option
    • Typed acknowledgment required
`;
        console.log(help);
    }

    /**
     * Create readline interface
     */
    createInterface() {
        if (!this.rl) {
            this.rl = readline.createInterface({
                input: stdin,
                output: stdout
            });
        }
        return this.rl;
    }

    /**
     * Close readline interface
     */
    closeInterface() {
        if (this.rl) {
            this.rl.close();
            this.rl = null;
        }
    }

    /**
     * Prompt for user confirmation
     */
    async confirm(message, defaultValue = false) {
        return new Promise((resolve) => {
            const rl = this.createInterface();
            const defaultText = defaultValue ? 'Y/n' : 'y/N';
            
            rl.question(`${message} [${defaultText}]: `, (answer) => {
                const response = answer.toLowerCase().trim();
                if (response === '') {
                    resolve(defaultValue);
                } else {
                    resolve(response === 'y' || response === 'yes');
                }
            });
        });
    }

    /**
     * Prompt for typed acknowledgment
     */
    async getTypedAcknowledgment() {
        return new Promise((resolve) => {
            const rl = this.createInterface();
            console.log('\n⚠️  WARNING: This will remove AI Workflow system files.');
            console.log('To confirm, please type: I UNDERSTAND AND ACCEPT\n');
            
            rl.question('> ', (answer) => {
                resolve(answer.trim() === 'I UNDERSTAND AND ACCEPT');
            });
        });
    }

    /**
     * Interactive file review
     */
    async reviewFiles(files, category) {
        console.log(`\n📋 Reviewing ${category} files:`);
        console.log('─'.repeat(50));
        
        const decisions = [];
        const rl = this.createInterface();
        
        for (const file of files) {
            const decision = await new Promise((resolve) => {
                console.log(`\nFile: ${file.path}`);
                if (file.reason) {
                    console.log(`Reason: ${file.reason}`);
                }
                
                rl.question('Action? [K]eep / [R]emove / [S]kip (default: Skip): ', (answer) => {
                    const response = answer.toUpperCase().trim();
                    switch (response) {
                        case 'K':
                            resolve({ file, action: 'keep' });
                            break;
                        case 'R':
                            resolve({ file, action: 'remove' });
                            break;
                        default:
                            resolve({ file, action: 'skip' });
                    }
                });
            });
            
            decisions.push(decision);
        }
        
        return decisions;
    }

    /**
     * Show progress bar
     */
    showProgress(current, total, message = '') {
        const barLength = 40;
        const progress = Math.floor((current / total) * barLength);
        const bar = '█'.repeat(progress) + '░'.repeat(barLength - progress);
        const percentage = Math.floor((current / total) * 100);
        
        process.stdout.write(`\r[${bar}] ${percentage}% ${message}`);
        
        if (current === total) {
            process.stdout.write('\n');
        }
    }

    /**
     * Display summary screen
     */
    async displaySummary(plan) {
        console.clear();
        console.log('╔════════════════════════════════════════════════════════╗');
        console.log('║         AI WORKFLOW UNINSTALLER - SUMMARY              ║');
        console.log('╚════════════════════════════════════════════════════════╝');
        console.log();
        
        console.log('📊 File Operations Summary:');
        console.log(`   📥 Files to remove: ${plan.summary.remove}`);
        console.log(`   📦 Files to keep: ${plan.summary.keep}`);
        console.log(`   ❓ Files to review: ${plan.summary.unknown}`);
        console.log(`   💾 Total size to free: ${plan.summary.totalSizeFormatted || '0 B'}`);
        console.log();
        
        if (plan.processes && plan.processes.length > 0) {
            console.log('🔄 Processes to stop:');
            plan.processes.forEach(p => {
                console.log(`   • ${p.name}${p.pid ? ` (PID: ${p.pid})` : ''}`);
            });
            console.log();
        }
        
        console.log('⚙️  Configuration:');
        plan.notes.forEach(note => {
            console.log(`   • ${note}`);
        });
        console.log();
        
        console.log('─'.repeat(60));
        console.log('Options:');
        console.log('  [R] Review file lists');
        console.log('  [B] Create backup');
        console.log('  [K] Adjust keep/remove rules');
        console.log('  [D] Show detailed plan');
        console.log('  [C] Continue with uninstall');
        console.log('  [Q] Quit');
        console.log('─'.repeat(60));
        
        return await this.getMenuChoice();
    }

    /**
     * Get menu choice
     */
    async getMenuChoice() {
        return new Promise((resolve) => {
            const rl = this.createInterface();
            
            rl.question('Select option: ', (answer) => {
                resolve(answer.toUpperCase().trim());
            });
        });
    }

    // ========================
    // PHASE 3 ENHANCED METHODS
    // ========================

    /**
     * Enhanced interactive summary display using inquirer
     */
    async displaySummaryInteractive(plan) {
        console.clear();
        console.log(chalk.cyan.bold('╔════════════════════════════════════════════════════════╗'));
        console.log(chalk.cyan.bold('║         AI WORKFLOW UNINSTALLER - SUMMARY              ║'));
        console.log(chalk.cyan.bold('╚════════════════════════════════════════════════════════╝'));
        console.log();
        
        // Display summary with colors
        console.log(chalk.blue.bold('📊 File Operations Summary:'));
        console.log(`   ${chalk.red('📥 Files to remove:')} ${chalk.red.bold(plan.summary.remove)}`);
        console.log(`   ${chalk.green('📦 Files to keep:')} ${chalk.green.bold(plan.summary.keep)}`);
        console.log(`   ${chalk.yellow('❓ Files to review:')} ${chalk.yellow.bold(plan.summary.unknown)}`);
        console.log(`   ${chalk.blue('💾 Total size to free:')} ${chalk.blue.bold(plan.summary.totalSizeFormatted || '0 B')}`);
        console.log();
        
        if (plan.processes && plan.processes.length > 0) {
            console.log(chalk.orange.bold('🔄 Processes to stop:'));
            plan.processes.forEach(p => {
                console.log(`   ${chalk.orange('•')} ${p.name}${p.pid ? chalk.gray(` (PID: ${p.pid})`) : ''}`);
            });
            console.log();
        }
        
        console.log(chalk.gray.bold('⚙️  Configuration:'));
        plan.notes.forEach(note => {
            console.log(`   ${chalk.gray('•')} ${note}`);
        });
        console.log();

        // Use inquirer for menu selection
        const choices = [
            { name: chalk.blue('📋 Review file lists'), value: 'R' },
            { name: chalk.green('💾 Create backup'), value: 'B' },
            { name: chalk.yellow('⚙️  Adjust keep/remove rules'), value: 'K' },
            { name: chalk.cyan('📊 Show detailed plan'), value: 'D' },
            { name: chalk.red('▶️  Continue with uninstall'), value: 'C' },
            { name: chalk.gray('❌ Quit'), value: 'Q' }
        ];

        const answer = await inquirer.prompt([
            {
                type: 'list',
                name: 'choice',
                message: 'What would you like to do?',
                choices: choices,
                pageSize: 10
            }
        ]);

        return answer.choice;
    }

    /**
     * Interactive file review with search and filtering
     */
    async reviewFilesInteractive(files, category) {
        console.clear();
        console.log(chalk.blue.bold(`📋 Reviewing ${category} files`));
        console.log(chalk.gray('─'.repeat(60)));
        
        if (files.length === 0) {
            console.log(chalk.yellow(`No ${category} files found.`));
            await this.pressEnterToContinue();
            return [];
        }

        // Show overview first
        console.log(chalk.cyan(`Found ${files.length} ${category} files:`));
        console.log();

        // Options for file review
        const reviewOptions = [
            { name: chalk.green('📝 View all files in list'), value: 'list' },
            { name: chalk.blue('🔍 Search/filter files'), value: 'search' },
            { name: chalk.yellow('📁 Browse by directory'), value: 'directory' },
            { name: chalk.red('⚡ Quick review (approve all)'), value: 'quick' },
            { name: chalk.gray('⏪ Back to summary'), value: 'back' }
        ];

        const viewChoice = await inquirer.prompt([
            {
                type: 'list',
                name: 'option',
                message: `How would you like to review ${category} files?`,
                choices: reviewOptions
            }
        ]);

        switch (viewChoice.option) {
            case 'list':
                return await this._reviewFilesList(files, category);
            case 'search':
                return await this._reviewFilesWithSearch(files, category);
            case 'directory':
                return await this._reviewFilesByDirectory(files, category);
            case 'quick':
                return await this._quickReviewFiles(files, category);
            case 'back':
                return null; // Signal to go back
            default:
                return [];
        }
    }

    /**
     * Adjust keep/remove rules interactively
     */
    async adjustRulesInteractive(classification) {
        console.clear();
        console.log(chalk.yellow.bold('⚙️  Adjust Keep/Remove Rules'));
        console.log(chalk.gray('─'.repeat(60)));
        
        const categories = [
            { name: chalk.red(`📥 Files to Remove (${classification.remove.length})`), value: 'remove' },
            { name: chalk.green(`📦 Files to Keep (${classification.keep.length})`), value: 'keep' },
            { name: chalk.yellow(`❓ Unknown Files (${classification.unknown.length})`), value: 'unknown' },
            { name: chalk.blue('🎯 Add custom patterns'), value: 'patterns' },
            { name: chalk.gray('⏪ Back to summary'), value: 'back' }
        ];

        const categoryChoice = await inquirer.prompt([
            {
                type: 'list',
                name: 'category',
                message: 'Which category would you like to adjust?',
                choices: categories
            }
        ]);

        if (categoryChoice.category === 'back') {
            return null;
        }

        if (categoryChoice.category === 'patterns') {
            return await this._adjustCustomPatterns();
        }

        return await this._adjustCategoryRules(classification, categoryChoice.category);
    }

    /**
     * Show detailed plan in table format
     */
    async showDetailedPlan(plan) {
        console.clear();
        console.log(chalk.cyan.bold('📊 Detailed Uninstall Plan'));
        console.log(chalk.gray('─'.repeat(80)));
        console.log();

        // Summary table
        const summaryTable = new Table({
            head: [chalk.blue.bold('Category'), chalk.blue.bold('Count'), chalk.blue.bold('Size')],
            colWidths: [20, 10, 15]
        });

        summaryTable.push(
            [chalk.red('Remove'), chalk.red.bold(plan.summary.remove), chalk.red(plan.summary.removeSizeFormatted || '0 B')],
            [chalk.green('Keep'), chalk.green.bold(plan.summary.keep), chalk.green(plan.summary.keepSizeFormatted || '0 B')],
            [chalk.yellow('Unknown'), chalk.yellow.bold(plan.summary.unknown), chalk.yellow(plan.summary.unknownSizeFormatted || '0 B')]
        );

        console.log(chalk.blue.bold('📈 Summary:'));
        console.log(summaryTable.toString());
        console.log();

        // Files to remove table (top 20)
        if (plan.remove.length > 0) {
            console.log(chalk.red.bold('📥 Files to Remove:'));
            const removeTable = new Table({
                head: [chalk.red.bold('Path'), chalk.red.bold('Reason'), chalk.red.bold('Size')],
                colWidths: [50, 30, 10],
                wordWrap: true
            });

            const displayFiles = plan.remove.slice(0, 20);
            displayFiles.forEach(file => {
                removeTable.push([
                    file.path,
                    file.reason || 'System file',
                    this._formatSize(file.size || 0)
                ]);
            });

            console.log(removeTable.toString());
            
            if (plan.remove.length > 20) {
                console.log(chalk.gray(`... and ${plan.remove.length - 20} more files`));
            }
            console.log();
        }

        // Processes table
        if (plan.processes.length > 0) {
            console.log(chalk.orange.bold('🔄 Processes to Stop:'));
            const processTable = new Table({
                head: [chalk.orange.bold('Name'), chalk.orange.bold('PID'), chalk.orange.bold('Status')],
                colWidths: [30, 10, 20]
            });

            plan.processes.forEach(proc => {
                processTable.push([
                    proc.name,
                    proc.pid || 'N/A',
                    proc.status || 'Running'
                ]);
            });

            console.log(processTable.toString());
            console.log();
        }

        // Configuration notes
        if (plan.notes.length > 0) {
            console.log(chalk.gray.bold('⚙️  Configuration Notes:'));
            plan.notes.forEach((note, index) => {
                console.log(`${chalk.gray((index + 1).toString().padStart(2))}. ${note}`);
            });
            console.log();
        }

        await this.pressEnterToContinue();
    }

    /**
     * Interactive backup configuration
     */
    async createBackupPrompt() {
        console.clear();
        console.log(chalk.green.bold('💾 Backup Configuration'));
        console.log(chalk.gray('─'.repeat(60)));
        console.log();

        const backupQuestions = [
            {
                type: 'confirm',
                name: 'createBackup',
                message: 'Would you like to create a backup before uninstalling?',
                default: true
            },
            {
                type: 'input',
                name: 'backupPath',
                message: 'Enter backup location (leave empty for auto-generated):',
                when: (answers) => answers.createBackup,
                validate: (input) => {
                    if (!input.trim()) return true; // Allow empty for auto-generation
                    // Basic path validation
                    return input.length > 0 || 'Please enter a valid path';
                }
            },
            {
                type: 'checkbox',
                name: 'backupOptions',
                message: 'Select backup options:',
                when: (answers) => answers.createBackup,
                choices: [
                    { name: 'Include configuration files', value: 'config', checked: true },
                    { name: 'Include generated documents', value: 'docs', checked: false },
                    { name: 'Include cache files', value: 'cache', checked: false },
                    { name: 'Include logs', value: 'logs', checked: false },
                    { name: 'Compress backup', value: 'compress', checked: true }
                ]
            }
        ];

        const answers = await inquirer.prompt(backupQuestions);
        
        if (!answers.createBackup) {
            return null;
        }

        // Generate auto path if not provided
        if (!answers.backupPath || !answers.backupPath.trim()) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            answers.backupPath = `./ai-workflow-backup-${timestamp}`;
        }

        return {
            path: answers.backupPath.trim(),
            options: answers.backupOptions || []
        };
    }

    /**
     * Enhanced typed acknowledgment with better formatting
     */
    async getTypedAcknowledgmentEnhanced() {
        console.log();
        console.log(chalk.red.bold('⚠️  FINAL CONFIRMATION WARNING'));
        console.log(chalk.red('═'.repeat(50)));
        console.log();
        console.log(chalk.yellow('This action will permanently remove AI Workflow system files.'));
        console.log(chalk.yellow('This action cannot be undone without a backup.'));
        console.log();
        console.log(chalk.white.bold('To confirm this destructive action, please type exactly:'));
        console.log(chalk.green.bold('I UNDERSTAND AND ACCEPT THE RISKS'));
        console.log();

        const answer = await inquirer.prompt([
            {
                type: 'input',
                name: 'confirmation',
                message: chalk.red('Type confirmation phrase:'),
                validate: (input) => {
                    if (input.trim() === 'I UNDERSTAND AND ACCEPT THE RISKS') {
                        return true;
                    }
                    return chalk.red('Please type the exact phrase: I UNDERSTAND AND ACCEPT THE RISKS');
                }
            }
        ]);

        return answer.confirmation.trim() === 'I UNDERSTAND AND ACCEPT THE RISKS';
    }

    // ========================
    // HELPER METHODS
    // ========================

    /**
     * Review files in a simple list format
     */
    async _reviewFilesList(files, category) {
        const decisions = [];
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            console.clear();
            console.log(chalk.blue.bold(`📋 Reviewing ${category} files (${i + 1}/${files.length})`));
            console.log(chalk.gray('─'.repeat(60)));
            console.log();
            console.log(chalk.white.bold(`File: ${file.path}`));
            if (file.reason) {
                console.log(chalk.gray(`Reason: ${file.reason}`));
            }
            if (file.size) {
                console.log(chalk.cyan(`Size: ${this._formatSize(file.size)}`));
            }
            console.log();

            const action = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'decision',
                    message: 'What should we do with this file?',
                    choices: [
                        { name: chalk.green('💾 Keep this file'), value: 'keep' },
                        { name: chalk.red('🗑️  Remove this file'), value: 'remove' },
                        { name: chalk.yellow('⏭️  Skip this file'), value: 'skip' },
                        { name: chalk.blue('📋 Show file content preview'), value: 'preview' },
                        { name: chalk.gray('⏪ Back to review options'), value: 'back' }
                    ]
                }
            ]);

            if (action.decision === 'back') {
                return null;
            }

            if (action.decision === 'preview') {
                await this._showFilePreview(file);
                i--; // Repeat this file
                continue;
            }

            decisions.push({ file, action: action.decision });
        }

        return decisions;
    }

    /**
     * Review files with search functionality
     */
    async _reviewFilesWithSearch(files, category) {
        const searchAnswer = await inquirer.prompt([
            {
                type: 'input',
                name: 'pattern',
                message: 'Enter search pattern (filename, extension, or path):',
                validate: (input) => input.trim().length > 0 || 'Please enter a search pattern'
            }
        ]);

        const pattern = searchAnswer.pattern.toLowerCase();
        const filteredFiles = files.filter(file => 
            file.path.toLowerCase().includes(pattern) ||
            file.reason?.toLowerCase().includes(pattern)
        );

        console.log();
        console.log(chalk.cyan(`Found ${filteredFiles.length} files matching "${pattern}"`));
        
        if (filteredFiles.length === 0) {
            await this.pressEnterToContinue();
            return this.reviewFilesInteractive(files, category);
        }

        return await this._reviewFilesList(filteredFiles, `${category} (filtered)`);
    }

    /**
     * Review files grouped by directory
     */
    async _reviewFilesByDirectory(files, category) {
        // Group files by directory
        const directories = {};
        files.forEach(file => {
            const dir = require('path').dirname(file.path);
            if (!directories[dir]) {
                directories[dir] = [];
            }
            directories[dir].push(file);
        });

        const dirChoices = Object.keys(directories)
            .sort()
            .map(dir => ({
                name: `${dir} (${directories[dir].length} files)`,
                value: dir
            }));

        dirChoices.push({ name: chalk.gray('⏪ Back to review options'), value: 'back' });

        const dirAnswer = await inquirer.prompt([
            {
                type: 'list',
                name: 'directory',
                message: 'Select directory to review:',
                choices: dirChoices,
                pageSize: 15
            }
        ]);

        if (dirAnswer.directory === 'back') {
            return null;
        }

        return await this._reviewFilesList(directories[dirAnswer.directory], `${category} in ${dirAnswer.directory}`);
    }

    /**
     * Quick review with bulk operations
     */
    async _quickReviewFiles(files, category) {
        const quickChoices = [
            { name: chalk.green(`✅ Keep all ${files.length} files`), value: 'keep_all' },
            { name: chalk.red(`❌ Remove all ${files.length} files`), value: 'remove_all' },
            { name: chalk.yellow(`⏭️  Skip all ${files.length} files`), value: 'skip_all' },
            { name: chalk.blue('📋 Review individually'), value: 'individual' },
            { name: chalk.gray('⏪ Back to review options'), value: 'back' }
        ];

        const quickAnswer = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: `Quick action for all ${category} files:`,
                choices: quickChoices
            }
        ]);

        switch (quickAnswer.action) {
            case 'keep_all':
                return files.map(file => ({ file, action: 'keep' }));
            case 'remove_all':
                return files.map(file => ({ file, action: 'remove' }));
            case 'skip_all':
                return files.map(file => ({ file, action: 'skip' }));
            case 'individual':
                return await this._reviewFilesList(files, category);
            case 'back':
                return null;
            default:
                return [];
        }
    }

    /**
     * Show file content preview
     */
    async _showFilePreview(file) {
        console.clear();
        console.log(chalk.blue.bold(`📄 Preview: ${file.path}`));
        console.log(chalk.gray('─'.repeat(60)));
        
        try {
            const fs = require('fs').promises;
            const path = require('path');
            const fullPath = path.resolve(file.path);
            const stats = await fs.stat(fullPath);
            
            if (stats.size > 1024 * 10) { // > 10KB
                console.log(chalk.yellow('File is too large to preview (>10KB)'));
            } else {
                const content = await fs.readFile(fullPath, 'utf8');
                const lines = content.split('\n').slice(0, 20); // First 20 lines
                console.log(lines.join('\n'));
                if (content.split('\n').length > 20) {
                    console.log(chalk.gray('... (content truncated)'));
                }
            }
        } catch (error) {
            console.log(chalk.red(`Error reading file: ${error.message}`));
        }
        
        console.log();
        await this.pressEnterToContinue();
    }

    /**
     * Adjust rules for specific category
     */
    async _adjustCategoryRules(classification, category) {
        const files = classification[category];
        
        if (files.length === 0) {
            console.log(chalk.yellow(`No files in ${category} category.`));
            await this.pressEnterToContinue();
            return null;
        }

        console.log(chalk.blue(`Files in ${category} category: ${files.length}`));
        console.log();

        const actionChoices = [
            { name: `📝 Review files individually`, value: 'individual' },
            { name: `📋 Bulk move to different category`, value: 'bulk_move' },
            { name: `🔍 Filter and move files`, value: 'filter_move' },
            { name: chalk.gray('⏪ Back'), value: 'back' }
        ];

        const actionAnswer = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: `How would you like to adjust ${category} files?`,
                choices: actionChoices
            }
        ]);

        switch (actionAnswer.action) {
            case 'individual':
                return await this._reviewFilesList(files, category);
            case 'bulk_move':
                return await this._bulkMoveFiles(files, category);
            case 'filter_move':
                return await this._filterAndMoveFiles(files, category);
            case 'back':
                return null;
            default:
                return [];
        }
    }

    /**
     * Bulk move files between categories
     */
    async _bulkMoveFiles(files, fromCategory) {
        const targetChoices = [
            { name: chalk.red('📥 Move to Remove'), value: 'remove' },
            { name: chalk.green('📦 Move to Keep'), value: 'keep' },
            { name: chalk.yellow('❓ Move to Unknown'), value: 'unknown' }
        ].filter(choice => choice.value !== fromCategory);

        const targetAnswer = await inquirer.prompt([
            {
                type: 'list',
                name: 'target',
                message: `Move all ${files.length} files from ${fromCategory} to:`,
                choices: targetChoices
            }
        ]);

        return files.map(file => ({ file, action: targetAnswer.target }));
    }

    /**
     * Filter and move files
     */
    async _filterAndMoveFiles(files, category) {
        const filterAnswer = await inquirer.prompt([
            {
                type: 'input',
                name: 'pattern',
                message: 'Enter filter pattern (files matching this will be moved):',
                validate: (input) => input.trim().length > 0 || 'Please enter a filter pattern'
            }
        ]);

        const pattern = filterAnswer.pattern.toLowerCase();
        const matchingFiles = files.filter(file => 
            file.path.toLowerCase().includes(pattern)
        );

        if (matchingFiles.length === 0) {
            console.log(chalk.yellow(`No files match pattern "${pattern}"`));
            await this.pressEnterToContinue();
            return null;
        }

        console.log(chalk.cyan(`Found ${matchingFiles.length} files matching "${pattern}"`));

        const targetChoices = [
            { name: chalk.red('📥 Move to Remove'), value: 'remove' },
            { name: chalk.green('📦 Move to Keep'), value: 'keep' },
            { name: chalk.yellow('❓ Move to Unknown'), value: 'unknown' }
        ].filter(choice => choice.value !== category);

        const targetAnswer = await inquirer.prompt([
            {
                type: 'list',
                name: 'target',
                message: `Move ${matchingFiles.length} matching files to:`,
                choices: targetChoices
            }
        ]);

        return matchingFiles.map(file => ({ file, action: targetAnswer.target }));
    }

    /**
     * Adjust custom patterns
     */
    async _adjustCustomPatterns() {
        console.log(chalk.blue.bold('🎯 Custom Pattern Management'));
        console.log(chalk.gray('─'.repeat(60)));
        console.log();
        console.log(chalk.yellow('Define custom patterns to automatically categorize files.'));
        console.log(chalk.gray('Examples: *.log, temp/**, **/.cache/**'));
        console.log();

        const patterns = [];
        let addMore = true;

        while (addMore) {
            const patternAnswer = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'pattern',
                    message: 'Enter file pattern (or press Enter to finish):',
                    validate: (input) => {
                        if (!input.trim()) return true; // Allow empty to finish
                        return input.includes('*') || input.includes('/') || 'Pattern should contain wildcards (* or /)'
                    }
                }
            ]);

            if (!patternAnswer.pattern.trim()) {
                addMore = false;
                continue;
            }

            const actionAnswer = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'action',
                    message: `Files matching "${patternAnswer.pattern}" should be:`,
                    choices: [
                        { name: chalk.red('📥 Removed'), value: 'remove' },
                        { name: chalk.green('📦 Kept'), value: 'keep' },
                        { name: chalk.yellow('❓ Marked as Unknown'), value: 'unknown' }
                    ]
                }
            ]);

            patterns.push({
                pattern: patternAnswer.pattern.trim(),
                action: actionAnswer.action
            });

            const continueAnswer = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'continue',
                    message: 'Add another pattern?',
                    default: false
                }
            ]);

            addMore = continueAnswer.continue;
        }

        return { type: 'custom_patterns', patterns };
    }

    /**
     * Format file size for display
     */
    _formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
    }

    /**
     * Press Enter to continue prompt
     */
    async pressEnterToContinue() {
        await inquirer.prompt([
            {
                type: 'input',
                name: 'continue',
                message: chalk.gray('Press Enter to continue...'),
                validate: () => true
            }
        ]);
    }
}

// Export functions
module.exports = {
    parseArgs: (args) => {
        const ui = new UIManager();
        return ui.parseArgs(args);
    },
    UIManager,
    
    // Phase 3 Enhanced exports for direct access
    createUIManager: () => new UIManager(),
    
    // Utility functions for external use
    formatSize: (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
    },
    
    // Colored console helpers
    colors: {
        error: (msg) => chalk.red(msg),
        success: (msg) => chalk.green(msg),
        warning: (msg) => chalk.yellow(msg),
        info: (msg) => chalk.blue(msg),
        debug: (msg) => chalk.gray(msg)
    }
};