/**
 * User Interface Module
 * Handles interactive prompts and command-line argument parsing
 */

const readline = require('readline');
const { stdin, stdout } = process;

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
}

// Export functions
module.exports = {
    parseArgs: (args) => {
        const ui = new UIManager();
        return ui.parseArgs(args);
    },
    UIManager
};