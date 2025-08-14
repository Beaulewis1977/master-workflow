#!/usr/bin/env node

/**
 * AI Workflow Uninstaller - Phase 4 Backup Demo
 * 
 * Demonstrates the backup functionality with mock data
 */

const { BackupManager } = require('./backup');
const path = require('path');

class BackupDemo {
    constructor() {
        this.backupManager = new BackupManager();
        this.backupManager.setProgressCallback((current, total, message) => {
            const percent = Math.round((current / total) * 100);
            const bar = '█'.repeat(Math.floor(percent / 2)) + '░'.repeat(50 - Math.floor(percent / 2));
            process.stdout.write(`\r[${bar}] ${percent}% - ${message}`);
            if (current === total) {
                console.log(); // New line when complete
            }
        });
    }

    async runDemo() {
        console.log('🎬 AI Workflow Uninstaller - Backup Demo');
        console.log('=' .repeat(50));
        console.log();

        try {
            // Demo 1: Platform Detection
            await this.demoPlatformDetection();
            
            // Demo 2: Backup Configuration
            await this.demoBackupConfiguration();
            
            // Demo 3: Mock Backup Creation
            await this.demoMockBackupCreation();
            
            console.log('\n🎉 Demo completed successfully!');
            console.log('✨ Phase 4 backup functionality is ready for production use.');
            
        } catch (error) {
            console.error('\n❌ Demo failed:', error.message);
            process.exit(1);
        }
    }

    async demoPlatformDetection() {
        console.log('🔍 Platform Detection Demo');
        console.log('-'.repeat(30));
        
        const platform = this.backupManager.detectPlatform();
        const archiveType = this.backupManager.determineArchiveType();
        
        console.log(`📱 Platform: ${platform.platform}`);
        console.log(`🏗️  Architecture: ${platform.arch}`);
        console.log(`🔧 Release: ${platform.release}`);
        console.log(`💻 WSL: ${platform.isWSL ? 'Yes' : 'No'}`);
        console.log(`📦 Selected Archive Type: ${archiveType}`);
        console.log(`🔗 Node Version: ${platform.nodeVersion}`);
        console.log();
    }

    async demoBackupConfiguration() {
        console.log('⚙️  Backup Configuration Demo');
        console.log('-'.repeat(30));
        
        // Generate backup path
        const backupPath = await this.backupManager.getBackupPath('demo-project');
        
        console.log(`📂 Backup Directory: ${path.dirname(backupPath)}`);
        console.log(`📄 Backup Filename: ${path.basename(backupPath)}`);
        console.log(`🔗 Full Path: ${backupPath}`);
        
        // Show what the final archive would be named
        const archiveType = this.backupManager.determineArchiveType();
        const extension = archiveType === 'tar.gz' ? '.tar.gz' : '.zip';
        const finalPath = backupPath + extension;
        
        console.log(`📦 Final Archive: ${path.basename(finalPath)}`);
        console.log();
    }

    async demoMockBackupCreation() {
        console.log('💾 Mock Backup Creation Demo');
        console.log('-'.repeat(30));
        
        // Create mock data
        const config = {
            projectName: 'demo-ai-workflow',
            options: ['config', 'compress', 'logs'],
            path: null // Auto-generate
        };

        const classification = {
            manifests: {
                installation: {
                    version: '3.0.0',
                    installer: 'master-workflow',
                    files: [
                        '.ai-workflow/bin/ai-workflow',
                        '.ai-workflow/lib/exec-helper.js',
                        '.ai-workflow/configs/mcp-catalog.json'
                    ],
                    created: '2025-08-14T04:30:00Z'
                },
                generation: {
                    generator: 'claude-code',
                    documents: [
                        'README.md',
                        'CLAUDE.md',
                        'docs/USER-GUIDE.md'
                    ],
                    timestamp: '2025-08-14T04:35:00Z'
                }
            }
        };

        const plan = {
            version: '1.0.0',
            created: new Date().toISOString(),
            actions: [
                {
                    type: 'remove',
                    path: '.ai-workflow/',
                    reason: 'System directory',
                    fileCount: 25
                },
                {
                    type: 'keep',
                    path: 'user-config.json',
                    reason: 'User configuration'
                },
                {
                    type: 'remove',
                    path: 'node_modules/claude-flow/',
                    reason: 'Installed package',
                    fileCount: 150
                }
            ],
            summary: {
                toRemove: 175,
                toKeep: 1,
                estimatedSize: '2.3 MB'
            }
        };

        console.log('📋 Mock Data Prepared:');
        console.log(`   📁 Project: ${config.projectName}`);
        console.log(`   📄 Installation Files: ${classification.manifests.installation.files.length}`);
        console.log(`   📄 Generated Documents: ${classification.manifests.generation.documents.length}`);
        console.log(`   🎯 Planned Actions: ${plan.actions.length}`);
        console.log();

        console.log('🏗️  Creating backup (simulation)...');
        
        // Simulate the backup process steps
        await this.simulateBackupStep('Validating input parameters', 100);
        await this.simulateBackupStep('Determining backup path', 100);
        await this.simulateBackupStep('Creating staging directory', 200);
        await this.simulateBackupStep('Gathering files for backup', 300);
        await this.simulateBackupStep('Staging manifests', 250);
        await this.simulateBackupStep('Staging removal plan', 150);
        await this.simulateBackupStep('Generating metadata', 200);
        await this.simulateBackupStep('Creating restore instructions', 180);
        await this.simulateBackupStep('Creating archive', 800);
        await this.simulateBackupStep('Verifying backup integrity', 300);
        await this.simulateBackupStep('Cleaning up temporary files', 100);

        // Generate the metadata that would be created
        const files = await this.backupManager.gatherBackupFiles(config, classification, plan);
        const metadata = this.backupManager.generateMetadata(config, classification, plan, files);
        
        console.log('\n✅ Backup Creation Complete (Simulated)');
        console.log('-'.repeat(40));
        console.log(`📦 Archive Type: ${metadata.archiveType}`);
        console.log(`📄 Files Included: ${metadata.fileCount}`);
        console.log(`🔒 Checksum: ${metadata.checksum}`);
        console.log(`📅 Created: ${metadata.created}`);
        console.log(`🖥️  Platform: ${metadata.platform.platform} (${metadata.platform.arch})`);
        
        console.log('\n📁 Backup Structure:');
        console.log('   backup-<timestamp>.tar.gz/');
        console.log('   ├── manifests/');
        console.log('   │   ├── installation-record.json');
        console.log('   │   └── generation-record.json');
        console.log('   ├── plan/');
        console.log('   │   └── removal-plan.json');
        console.log('   ├── metadata.json');
        console.log('   └── RESTORE-INSTRUCTIONS.txt');
        
        console.log('\n🔧 Command Line Usage Examples:');
        console.log('   # Create backup interactively');
        console.log('   AIWF_UNINSTALLER=true ./ai-workflow uninstall --interactive');
        console.log('   ');
        console.log('   # Create backup with auto-generated path');
        console.log('   AIWF_UNINSTALLER=true ./ai-workflow uninstall --backup');
        console.log('   ');
        console.log('   # Create backup at specific location');
        console.log('   AIWF_UNINSTALLER=true ./ai-workflow uninstall --backup=/tmp/my-backup');
        console.log('   ');
        console.log('   # Non-interactive with backup');
        console.log('   AIWF_UNINSTALLER=true ./ai-workflow uninstall --yes --backup');
    }

    async simulateBackupStep(message, duration) {
        const steps = 20;
        const stepDuration = duration / steps;
        
        for (let i = 0; i <= steps; i++) {
            await this.backupManager.reportProgress(i, steps, message);
            await new Promise(resolve => setTimeout(resolve, stepDuration));
        }
    }
}

// Run demo if this file is executed directly
if (require.main === module) {
    const demo = new BackupDemo();
    demo.runDemo().catch(error => {
        console.error('Demo execution failed:', error);
        process.exit(1);
    });
}

module.exports = { BackupDemo };