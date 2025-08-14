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
const { parseArgs } = require('./ui');
const { loadManifests } = require('./manifest');
const { classifyFiles } = require('./classifier');
const { buildPlan } = require('./plan');
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
        console.log('\n📊 Detection Phase\n' + '─'.repeat(50));
        
        // Load manifests
        const manifests = await loadManifests(this.projectRoot);
        
        // Classify files
        const classification = await classifyFiles(this.projectRoot, manifests);
        
        // Detect active processes
        const processes = await detectProcesses();
        
        return { manifests, classification, processes };
    }

    async buildRemovalPlan(detectionData) {
        console.log('\n📋 Building Removal Plan\n' + '─'.repeat(50));
        
        this.plan = await buildPlan(detectionData, this.config);
        
        if (this.config.dryRun) {
            console.log('\n🔍 DRY RUN MODE - No changes will be made\n');
            console.log(JSON.stringify(this.plan, null, 2));
            return this.plan;
        }
        
        return this.plan;
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
            console.log('🚀 AI Workflow Uninstaller v1.0.0');
            console.log('=' .repeat(50));
            
            // Phase 1: Detection
            const detectionData = await this.detectPhase();
            
            // Phase 2: Build Plan
            await this.buildRemovalPlan(detectionData);
            
            // Phase 3: Execute (if not dry-run)
            await this.execute();
            
            console.log('\n✨ Uninstaller completed successfully');
            process.exit(0);
        } catch (error) {
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