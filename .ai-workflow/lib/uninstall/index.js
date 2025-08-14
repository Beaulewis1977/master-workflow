#!/usr/bin/env node

/**
 * AI Workflow Uninstaller - Main Entry Point
 * Safe, interactive uninstaller for the AI Workflow System
 * Version: 1.0.0
 * 
 * This uninstaller preserves user-generated content while removing 
 * only system-installed components.
 */

const path = require('path');
const fs = require('fs');
const { parseArgs, UIManager } = require('./ui');
const { loadManifests } = require('./manifest');
const { classifyFiles, FileClassifier } = require('./classifier');
const { buildPlan, PlanBuilder } = require('./plan');
const { detectProcesses } = require('./process');
const { executeRemoval } = require('./exec');
const { generateReport } = require('./report');

const FEATURE_FLAG = process.env.AIWF_UNINSTALLER === 'true';

class AIWorkflowUninstaller {
    constructor() {
        this.projectRoot = process.cwd();
        this.config = {
            dryRun: true,
            interactive: true,
            keepGenerated: true,
            purgeCaches: true,
            gitProtect: true,
            backup: null,
            ignoreGit: false,
            nonInteractive: false,
            yes: false
        };
        this.plan = null;
        this.classification = null;
        this.ui = new UIManager();
    }

    async init(args) {
        // Check feature flag
        if (!FEATURE_FLAG && !args.includes('--force-enable')) {
            console.log('⚠️  Uninstaller is currently in preview mode.');
            console.log('Set AIWF_UNINSTALLER=true to enable or use --force-enable flag.');
            process.exit(0);
        }

        // Parse command line arguments
        this.config = { ...this.config, ...parseArgs(args) };

        // In CI environment, default to dry-run unless explicitly disabled
        if (process.env.CI && !args.includes('--no-dry-run')) {
            this.config.dryRun = true;
        }

        return this;
    }

    async detectPhase() {
        if (!this.config.nonInteractive) {
            console.log('\n📊 Detection Phase\n' + '─'.repeat(50));
        }
        
        // Load manifests
        const manifests = await loadManifests(this.projectRoot);
        
        // Create classifier instance for Phase 3 integration
        const classifier = new FileClassifier(this.projectRoot, manifests);
        this.classification = await classifier.classify();
        
        // Detect active processes
        const processes = await detectProcesses();
        
        return { manifests, classification: this.classification, processes };
    }

    async buildRemovalPlan(detectionData) {
        if (!this.config.nonInteractive) {
            console.log('\n📋 Building Removal Plan\n' + '─'.repeat(50));
        }
        
        // Create plan builder instance for Phase 3 integration
        const planBuilder = new PlanBuilder(detectionData, this.config);
        this.plan = await planBuilder.build();
        
        if (this.config.dryRun && this.config.nonInteractive) {
            console.log('\n🔍 DRY RUN MODE - No changes will be made\n');
            if (this.config.jsonOutput) {
                console.log(JSON.stringify(this.plan, null, 2));
            } else {
                console.log(`Files to remove: ${this.plan.summary.remove}`);
                console.log(`Files to keep: ${this.plan.summary.keep}`);
                console.log(`Files to review: ${this.plan.summary.unknown}`);
            }
            return this.plan;
        }
        
        return this.plan;
    }

    async interactivePhase() {
        // Skip interactive phase if non-interactive mode or if no interactive plan display needed
        if (this.config.nonInteractive || this.config.yes) {
            return true; // Continue to execution
        }

        let choice;
        let modifications = {};

        do {
            try {
                // Display interactive summary
                choice = await this.ui.displaySummaryInteractive(this.plan);

                switch (choice) {
                    case 'R': // Review files
                        await this.handleFileReview(modifications);
                        break;
                    case 'B': // Create backup
                        await this.handleBackupCreation();
                        break;
                    case 'K': // Adjust rules
                        await this.handleRuleAdjustment(modifications);
                        break;
                    case 'D': // Show detailed plan
                        await this.ui.showDetailedPlan(this.plan);
                        break;
                    case 'C': // Continue with uninstall
                        return await this.handleFinalConfirmation();
                    case 'Q': // Quit
                        console.log('\n👋 Uninstaller cancelled by user.');
                        process.exit(0);
                        break;
                    default:
                        console.log('\n❓ Invalid choice, please try again.');
                }
            } catch (error) {
                if (error.message.includes('canceled') || error.message.includes('SIGINT')) {
                    console.log('\n👋 Uninstaller cancelled by user.');
                    process.exit(0);
                }
                throw error;
            }
        } while (choice !== 'C');

        return false; // Should not reach here
    }

    async handleFileReview(modifications) {
        const categories = [
            { name: `📥 Files to Remove (${this.plan.remove.length})`, value: 'remove' },
            { name: `📦 Files to Keep (${this.plan.keep.length})`, value: 'keep' },
            { name: `❓ Unknown Files (${this.plan.unknown.length})`, value: 'unknown' }
        ];

        const categoryChoice = await this.ui.getMenuChoice();
        // Simplified implementation - use the first available category for demo
        const category = this.plan.remove.length > 0 ? 'remove' : 
                        this.plan.unknown.length > 0 ? 'unknown' : 'keep';
        
        const files = this.plan[category] || [];
        if (files.length === 0) {
            console.log(`\n📂 No files in ${category} category.`);
            await this.ui.pressEnterToContinue();
            return;
        }

        const decisions = await this.ui.reviewFilesInteractive(files, category);
        if (decisions && decisions.length > 0) {
            this.applyFileDecisions(decisions, modifications);
        }
    }

    async handleBackupCreation() {
        const backupConfig = await this.ui.createBackupPrompt();
        if (backupConfig) {
            console.log(`\n💾 Backup will be created at: ${backupConfig.path}`);
            console.log(`📦 Options: ${backupConfig.options.join(', ')}`);
            this.config.backup = backupConfig.path;
            this.config.backupOptions = backupConfig.options;
        }
    }

    async handleRuleAdjustment(modifications) {
        if (!this.classification) {
            console.log('\n❌ Classification data not available for rule adjustment.');
            await this.ui.pressEnterToContinue();
            return;
        }

        const changes = await this.ui.adjustRulesInteractive(this.classification);
        if (changes) {
            this.applyRuleChanges(changes, modifications);
        }
    }

    async handleFinalConfirmation() {
        if (!this.config.dryRun) {
            const confirmed = await this.ui.getTypedAcknowledgmentEnhanced();
            if (!confirmed) {
                console.log('\n❌ Uninstallation cancelled - confirmation not provided.');
                return false;
            }
        } else {
            console.log('\n🔍 DRY RUN MODE - Review completed.');
        }
        return true;
    }

    applyFileDecisions(decisions, modifications) {
        decisions.forEach(({ file, action }) => {
            if (!modifications.files) modifications.files = [];
            modifications.files.push({ file: file.path, action });
        });
        
        console.log(`\n✅ Applied ${decisions.length} file decision(s).`);
    }

    applyRuleChanges(changes, modifications) {
        if (changes.type === 'custom_patterns') {
            if (!modifications.patterns) modifications.patterns = [];
            modifications.patterns.push(...changes.patterns);
            console.log(`\n✅ Added ${changes.patterns.length} custom pattern(s).`);
        } else {
            console.log('\n✅ Rule changes applied.');
        }
    }

    async execute() {
        if (this.config.dryRun) {
            console.log('\n✅ Dry run completed. No files were modified.');
            console.log('Remove --dry-run flag to perform actual uninstallation.');
            return;
        }

        // For now, in Phase 0, we don't execute any actual removals
        console.log('\n⚠️  Execution phase is not yet implemented.');
        console.log('This is a safety feature during development.');
        
        // Placeholder for future phases
        // await executeRemoval(this.plan, this.config);
        // await generateReport(this.plan, this.config);
    }

    async run() {
        try {
            // Ensure proper cleanup on exit
            process.on('SIGINT', () => {
                this.ui.closeInterface();
                console.log('\n👋 Uninstaller interrupted by user.');
                process.exit(0);
            });

            if (!this.config.nonInteractive) {
                console.log('🚀 AI Workflow Uninstaller v1.0.0');
                console.log('=' .repeat(50));
            }
            
            // Phase 1: Detection
            const detectionData = await this.detectPhase();
            
            // Phase 2: Build Plan
            await this.buildRemovalPlan(detectionData);
            
            // Phase 3: Interactive UI (if enabled)
            let shouldContinue = true;
            if (this.config.interactive && !this.config.nonInteractive) {
                shouldContinue = await this.interactivePhase();
            }
            
            // Phase 4: Execute (if confirmed and not dry-run)
            if (shouldContinue) {
                await this.execute();
            }
            
            // Cleanup UI
            this.ui.closeInterface();
            
            if (!this.config.nonInteractive) {
                console.log('\n✨ Uninstaller completed successfully');
            }
            process.exit(0);
        } catch (error) {
            // Cleanup UI on error
            this.ui.closeInterface();
            
            console.error('\n❌ Uninstaller Error:', error.message);
            if (this.config.debug) {
                console.error(error.stack);
            }
            process.exit(1);
        }
    }
}

// Main execution
if (require.main === module) {
    const uninstaller = new AIWorkflowUninstaller();
    uninstaller
        .init(process.argv.slice(2))
        .then(u => u.run())
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = AIWorkflowUninstaller;