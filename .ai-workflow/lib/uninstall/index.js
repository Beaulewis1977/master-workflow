#!/usr/bin/env node

/**
 * AI Workflow Uninstaller - Main Entry Point
 * Safe, interactive uninstaller for the AI Workflow System
 * Version: 1.1.0 - Phase 5 Process Management Integration
 * 
 * This uninstaller preserves user-generated content while removing 
 * only system-installed components. Phase 5 adds comprehensive
 * process detection and management capabilities.
 * 
 * New Features (Phase 5):
 * - Enhanced process detection (tmux sessions, background processes)
 * - Cross-platform process management (Windows/Unix)
 * - Safe process termination with grace periods
 * - Process information display in interactive mode
 * - Integrated process handling in uninstall workflow
 */

const path = require('path');
const fs = require('fs');
const { parseArgs, UIManager } = require('./ui');
const { loadManifests } = require('./manifest');
const { classifyFiles, FileClassifier } = require('./classifier');
const { buildPlan, PlanBuilder } = require('./plan');
const { detectProcesses, detectProcessesDetailed, stopAllProcesses, ProcessManager } = require('./process');
const { executeRemoval } = require('./exec');
const { generateReport } = require('./report');
const { BackupManager } = require('./backup');

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
        this.processData = null;
        this.ui = new UIManager();
        this.backupManager = new BackupManager(this.ui);
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
        
        // Detect active processes with enhanced Phase 5 capabilities
        this.processData = await detectProcessesDetailed({ dryRun: this.config.dryRun });
        
        // Display process detection summary
        if (!this.config.nonInteractive && this.processData.total > 0) {
            this.displayProcessSummary(this.processData);
        }
        
        // For backward compatibility, return original format
        const processes = [...this.processData.tmuxSessions, ...this.processData.processes];
        
        return { manifests, classification: this.classification, processes };
    }

    /**
     * Display detected process summary in an organized format
     * @private
     */
    displayProcessSummary(processData) {
        console.log('\n🔄 Active Process Detection Summary');
        console.log('─'.repeat(50));
        
        // Tmux sessions
        if (processData.tmuxSessions.length > 0) {
            console.log(`\n📺 Tmux Sessions (${processData.tmuxSessions.length}):`);
            processData.tmuxSessions.forEach(session => {
                const safeIndicator = session.safeToKill ? '✅' : '⚠️ ';
                const windowInfo = session.windows > 0 ? ` (${session.windows} windows)` : '';
                console.log(`   ${safeIndicator} ${session.name}${windowInfo}`);
            });
        }
        
        // Background processes
        if (processData.processes.length > 0) {
            console.log(`\n🔄 Background Processes (${processData.processes.length}):`);
            processData.processes.forEach(proc => {
                const safeIndicator = proc.safeToKill ? '✅' : '⚠️ ';
                const childInfo = proc.children?.length > 0 ? ` (+${proc.children.length} children)` : '';
                console.log(`   ${safeIndicator} ${proc.name} [PID: ${proc.pid}]${childInfo}`);
            });
        }
        
        // Safety summary
        const unsafeCount = [...processData.tmuxSessions, ...processData.processes]
            .filter(item => !item.safeToKill).length;
        
        if (unsafeCount > 0) {
            console.log(`\n⚠️  ${unsafeCount} processes marked as potentially unsafe for termination`);
        }
        
        console.log(`\n📊 Total detected: ${processData.total} workflow-related items`);
        console.log('   (These will be terminated after backup creation)');
    }

    /**
     * Show detailed process information in interactive mode
     * @private
     */
    async showProcessDetails() {
        if (!this.processData || this.processData.total === 0) {
            console.log('\n📊 No workflow processes detected.');
            await this.ui.pressEnterToContinue();
            return;
        }

        console.log('\n🔍 Detailed Process Information');
        console.log('═'.repeat(60));

        // Tmux Sessions Detail
        if (this.processData.tmuxSessions.length > 0) {
            console.log('\n📺 Tmux Sessions:');
            this.processData.tmuxSessions.forEach((session, index) => {
                console.log(`\n   ${index + 1}. ${session.name}`);
                console.log(`      Safety: ${session.safeToKill ? '✅ Safe to terminate' : '⚠️  Potentially unsafe'}`);
                console.log(`      Windows: ${session.windows || 0}`);
                console.log(`      Created: ${session.created || 'Unknown'}`);
                
                if (session.details?.windows?.length > 0) {
                    console.log(`      Active Windows:`);
                    session.details.windows.forEach(window => {
                        console.log(`         - ${window.name}: ${window.command || 'No command'}`);
                    });
                }
                
                console.log(`      Termination: ${session.command}`);
            });
        }

        // Background Processes Detail
        if (this.processData.processes.length > 0) {
            console.log('\n🔄 Background Processes:');
            this.processData.processes.forEach((proc, index) => {
                console.log(`\n   ${index + 1}. ${proc.name} [PID: ${proc.pid}]`);
                console.log(`      Safety: ${proc.safeToKill ? '✅ Safe to terminate' : '⚠️  Potentially unsafe'}`);
                console.log(`      User: ${proc.user || 'Unknown'}`);
                console.log(`      Command: ${proc.command?.substring(0, 80)}${proc.command?.length > 80 ? '...' : ''}`);
                console.log(`      Platform: ${proc.platform || 'Unknown'}`);
                
                if (proc.children && proc.children.length > 0) {
                    console.log(`      Child Processes:`);
                    proc.children.forEach(child => {
                        console.log(`         - ${child.name} [PID: ${child.pid}]`);
                    });
                }
            });
        }

        // Safety Summary
        const unsafeCount = [...this.processData.tmuxSessions, ...this.processData.processes]
            .filter(item => !item.safeToKill).length;

        console.log('\n🔒 Safety Analysis:');
        console.log(`   Total items: ${this.processData.total}`);
        console.log(`   Safe to terminate: ${this.processData.total - unsafeCount}`);
        console.log(`   Potentially unsafe: ${unsafeCount}`);

        if (unsafeCount > 0) {
            console.log('\n⚠️  Potentially unsafe items require careful review.');
            console.log('   They may be owned by other users or be critical system processes.');
        }

        console.log('\n📝 Note: Process termination occurs after backup creation but before file removal.');
        
        await this.ui.pressEnterToContinue('\nPress Enter to return to main menu...');
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
                
                // Show process summary in dry-run mode
                if (this.processData && this.processData.total > 0) {
                    console.log(`Processes to terminate: ${this.processData.total}`);
                    console.log(`  - Tmux sessions: ${this.processData.tmuxSessions.length}`);
                    console.log(`  - Background processes: ${this.processData.processes.length}`);
                }
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
                    case 'P': // Show process information
                        await this.showProcessDetails();
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
            try {
                console.log(`\n💾 Creating backup...`);
                console.log(`📦 Options: ${backupConfig.options.join(', ')}`);
                
                // Add project name to config for backup path generation
                const enhancedConfig = {
                    ...backupConfig,
                    projectName: path.basename(this.projectRoot)
                };

                // Create the backup
                const backupResult = await this.backupManager.createBackup(
                    enhancedConfig,
                    this.classification,
                    this.plan
                );

                console.log(`\n✅ Backup created successfully!`);
                console.log(`📁 Location: ${backupResult.path}`);
                console.log(`📊 Size: ${this.formatFileSize(backupResult.size)}`);
                console.log(`🗜️  Format: ${backupResult.archiveType}`);
                
                // Store backup info in config for report generation
                this.config.backup = backupResult.path;
                this.config.backupOptions = backupConfig.options;
                this.config.backupMetadata = backupResult.metadata;
                
                await this.ui.pressEnterToContinue('\nPress Enter to continue...');
                
            } catch (error) {
                console.error(`\n❌ Backup creation failed: ${error.message}`);
                console.log('\n⚠️  Continuing without backup. This is not recommended!');
                
                const continueWithoutBackup = await this.ui.confirmAction(
                    'Continue without backup? (This could result in data loss)',
                    false
                );
                
                if (!continueWithoutBackup) {
                    console.log('\n🛑 Uninstall cancelled by user.');
                    process.exit(0);
                }
            }
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
        // Show process termination warning if processes detected
        if (this.processData && this.processData.total > 0) {
            console.log('\n⚠️  Process Termination Warning');
            console.log('─'.repeat(50));
            console.log('The following workflow processes will be terminated:');
            
            if (this.processData.tmuxSessions.length > 0) {
                console.log(`\n📺 Tmux Sessions: ${this.processData.tmuxSessions.length}`);
                this.processData.tmuxSessions.forEach(session => {
                    console.log(`   - ${session.name}`);
                });
            }
            
            if (this.processData.processes.length > 0) {
                console.log(`\n🔄 Background Processes: ${this.processData.processes.length}`);
                this.processData.processes.forEach(proc => {
                    console.log(`   - ${proc.name} [PID: ${proc.pid}]`);
                });
            }

            if (!this.config.dryRun) {
                const processConfirmed = await this.ui.confirmAction(
                    '\nDo you want to proceed with terminating these processes?',
                    false
                );
                
                if (!processConfirmed) {
                    console.log('\n❌ Uninstallation cancelled - process termination not confirmed.');
                    return false;
                }
            }
        }

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

    /**
     * Terminate detected workflow processes
     * Phase 5: Process Management Integration
     * @private
     */
    async terminateProcesses() {
        if (!this.processData || this.processData.total === 0) {
            return;
        }

        console.log('\n🛑 Process Termination Phase');
        console.log('─'.repeat(50));

        try {
            // Use the enhanced stopAllProcesses function from ProcessManager
            const results = await stopAllProcesses({
                dryRun: this.config.dryRun,
                force: false // Use graceful termination by default
            });

            // Store process termination results for reporting
            this.config.processTerminationResults = results;

            if (!this.config.nonInteractive) {
                if (this.config.dryRun) {
                    console.log('🔍 DRY RUN: Process termination simulation completed');
                } else {
                    console.log(`✅ Process termination completed successfully`);
                    console.log(`📊 Summary: ${results.stopped.length} stopped, ${results.failed.length} failed, ${results.skipped.length} skipped`);
                }
            }

            // Log any failures for user attention
            if (results.failed.length > 0 && !this.config.nonInteractive) {
                console.log('\n⚠️  Some processes could not be terminated:');
                results.failed.forEach(item => {
                    console.log(`   - ${item.name}: ${item.error}`);
                });
                console.log('\n   This may require manual intervention after uninstallation.');
            }

        } catch (error) {
            console.error(`\n❌ Process termination failed: ${error.message}`);
            
            if (!this.config.nonInteractive) {
                const continueAnyway = await this.ui.confirmAction(
                    'Continue with file removal despite process termination failure?',
                    false
                );
                
                if (!continueAnyway) {
                    console.log('\n🛑 Uninstallation stopped due to process termination failure.');
                    process.exit(1);
                }
            } else {
                // In non-interactive mode, log but continue
                console.log('⚠️  Continuing with file removal despite process termination failure.');
            }
        }
    }

    async execute() {
        if (this.config.dryRun) {
            console.log('\n✅ Dry run completed. No files were modified.');
            console.log('Remove --dry-run flag to perform actual uninstallation.');
            return;
        }

        // For now, in Phase 0, we don't execute any actual removals
        console.log('\n⚠️  File removal execution phase is not yet implemented.');
        console.log('This is a safety feature during development.');
        
        // Generate report with process information included
        await this.generateFinalReport();
        
        // Placeholder for future phases
        // await executeRemoval(this.plan, this.config);
    }

    /**
     * Generate comprehensive final report including process information
     * @private
     */
    async generateFinalReport() {
        if (!this.config.nonInteractive) {
            console.log('\n📊 Final Report');
            console.log('─'.repeat(50));
        }

        const report = {
            timestamp: new Date().toISOString(),
            config: {
                dryRun: this.config.dryRun,
                interactive: this.config.interactive,
                backup: !!this.config.backup
            },
            files: {
                total: this.plan?.summary?.total || 0,
                toRemove: this.plan?.summary?.remove || 0,
                toKeep: this.plan?.summary?.keep || 0,
                unknown: this.plan?.summary?.unknown || 0
            },
            processes: {
                detected: this.processData?.total || 0,
                tmuxSessions: this.processData?.tmuxSessions?.length || 0,
                backgroundProcesses: this.processData?.processes?.length || 0,
                terminated: this.config.processTerminationResults?.stopped?.length || 0,
                failed: this.config.processTerminationResults?.failed?.length || 0,
                skipped: this.config.processTerminationResults?.skipped?.length || 0
            },
            backup: this.config.backupMetadata ? {
                created: true,
                path: this.config.backup,
                size: this.config.backupMetadata.originalSize || 0
            } : { created: false }
        };

        if (!this.config.nonInteractive) {
            console.log('\n📂 File Summary:');
            console.log(`   Total files analyzed: ${report.files.total}`);
            console.log(`   Files to remove: ${report.files.toRemove}`);
            console.log(`   Files to keep: ${report.files.toKeep}`);
            console.log(`   Unknown files: ${report.files.unknown}`);

            if (report.processes.detected > 0) {
                console.log('\n🔄 Process Summary:');
                console.log(`   Total detected: ${report.processes.detected}`);
                console.log(`   Tmux sessions: ${report.processes.tmuxSessions}`);
                console.log(`   Background processes: ${report.processes.backgroundProcesses}`);
                
                if (this.config.processTerminationResults) {
                    console.log(`   Successfully terminated: ${report.processes.terminated}`);
                    console.log(`   Failed to terminate: ${report.processes.failed}`);
                    console.log(`   Skipped (unsafe): ${report.processes.skipped}`);
                }
            }

            if (report.backup.created) {
                console.log('\n💾 Backup Summary:');
                console.log(`   Location: ${report.backup.path}`);
                console.log(`   Size: ${this.formatFileSize(report.backup.size)}`);
            }

            console.log(`\n🕒 Completed at: ${new Date().toLocaleString()}`);
        }

        // Store report for potential external use
        this.finalReport = report;
        return report;
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
            
            // Phase 4: Backup (if requested and not already done)
            if (shouldContinue && this.config.backup && !this.config.backupMetadata) {
                await this.performCommandLineBackup();
            }
            
            // Phase 5: Process Termination (if processes detected and not dry-run)
            if (shouldContinue && this.processData && this.processData.total > 0) {
                await this.terminateProcesses();
            }
            
            // Phase 6: Execute File Removal (if confirmed and not dry-run)
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

    /**
     * Perform backup when requested via command line
     * @private
     */
    async performCommandLineBackup() {
        try {
            if (!this.config.nonInteractive) {
                console.log('\n💾 Creating backup as requested...');
            }

            // Prepare backup configuration
            const backupConfig = {
                path: this.config.backup === 'auto' ? null : this.config.backup,
                options: ['config', 'compress'], // Default options for command line
                projectName: path.basename(this.projectRoot)
            };

            // Create the backup
            const backupResult = await this.backupManager.createBackup(
                backupConfig,
                this.classification,
                this.plan
            );

            if (!this.config.nonInteractive) {
                console.log(`✅ Backup created successfully!`);
                console.log(`📁 Location: ${backupResult.path}`);
                console.log(`📊 Size: ${this.formatFileSize(backupResult.size)}`);
                console.log(`🗜️  Format: ${backupResult.archiveType}`);
                
                // Show process summary if processes detected
                if (this.processData && this.processData.total > 0) {
                    console.log(`\n📊 Detected processes will be terminated next:`);
                    console.log(`   Tmux sessions: ${this.processData.tmuxSessions.length}`);
                    console.log(`   Background processes: ${this.processData.processes.length}`);
                }
            }

            // Store backup info in config for report generation
            this.config.backup = backupResult.path;
            this.config.backupMetadata = backupResult.metadata;

        } catch (error) {
            console.error(`❌ Backup creation failed: ${error.message}`);
            
            if (this.config.nonInteractive) {
                // In non-interactive mode, fail the operation
                throw new Error(`Backup creation failed: ${error.message}`);
            } else {
                // In interactive mode, ask user if they want to continue
                console.log('\n⚠️  Continuing without backup. This is not recommended!');
                
                const continueWithoutBackup = await this.ui.confirmAction(
                    'Continue without backup? (This could result in data loss)',
                    false
                );
                
                if (!continueWithoutBackup) {
                    console.log('\n🛑 Uninstall cancelled by user.');
                    process.exit(0);
                }
            }
        }
    }

    /**
     * Format file size in human-readable format
     * @param {number} bytes - Size in bytes
     * @returns {string} Formatted size string
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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