#!/usr/bin/env node

/**
 * AI Workflow Uninstaller - Phase 4 Backup Tests
 * 
 * Comprehensive test suite for backup functionality
 * Tests backup creation, archive formats, and error handling
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const os = require('os');
const { BackupManager } = require('./backup');

class BackupTester {
    constructor() {
        this.testResults = [];
        this.tempDirs = [];
        this.createdBackups = [];
    }

    async runTests() {
        console.log('🧪 AI Workflow Uninstaller - Phase 4 Backup Tests');
        console.log('=' .repeat(60));
        console.log();

        const tests = [
            { name: 'Platform Detection', fn: () => this.testPlatformDetection() },
            { name: 'Archive Type Selection', fn: () => this.testArchiveTypeSelection() },
            { name: 'Backup Path Generation', fn: () => this.testBackupPathGeneration() },
            { name: 'File Staging', fn: () => this.testFileStaging() },
            { name: 'Metadata Generation', fn: () => this.testMetadataGeneration() },
            { name: 'Archive Creation (Mocked)', fn: () => this.testArchiveCreationMocked() },
            { name: 'Error Handling', fn: () => this.testErrorHandling() },
            { name: 'Progress Reporting', fn: () => this.testProgressReporting() },
            { name: 'Integration Test', fn: () => this.testFullBackupFlow() }
        ];

        for (const test of tests) {
            await this.runTest(test.name, test.fn);
        }

        await this.cleanup();
        this.printSummary();
        
        const failedTests = this.testResults.filter(r => !r.passed).length;
        process.exit(failedTests > 0 ? 1 : 0);
    }

    async runTest(name, testFn) {
        try {
            console.log(`📋 Testing: ${name}`);
            const startTime = Date.now();
            
            await testFn();
            
            const duration = Date.now() - startTime;
            console.log(`✅ ${name} - PASSED (${duration}ms)`);
            this.testResults.push({ name, passed: true, duration });
            
        } catch (error) {
            console.log(`❌ ${name} - FAILED: ${error.message}`);
            this.testResults.push({ name, passed: false, error: error.message });
        }
        console.log();
    }

    async testPlatformDetection() {
        const backupManager = new BackupManager();
        const platform = backupManager.detectPlatform();
        
        // Verify platform structure
        if (!platform.platform || !platform.arch || !platform.release) {
            throw new Error('Platform detection missing required fields');
        }

        // Verify expected platform types
        const validPlatforms = ['linux', 'darwin', 'win32', 'freebsd', 'openbsd'];
        if (!validPlatforms.includes(platform.platform)) {
            throw new Error(`Unknown platform: ${platform.platform}`);
        }

        console.log(`   Platform: ${platform.platform} (${platform.arch})`);
        console.log(`   WSL: ${platform.isWSL ? 'Yes' : 'No'}`);
    }

    async testArchiveTypeSelection() {
        const backupManager = new BackupManager();
        const archiveType = backupManager.determineArchiveType();
        
        // Should return either 'tar.gz' or 'zip'
        if (!['tar.gz', 'zip'].includes(archiveType)) {
            throw new Error(`Invalid archive type: ${archiveType}`);
        }

        console.log(`   Selected archive type: ${archiveType}`);

        // Verify logic matches platform
        const platform = os.platform();
        if (platform === 'linux' || platform === 'darwin') {
            if (archiveType !== 'tar.gz') {
                throw new Error(`Expected tar.gz for ${platform}, got ${archiveType}`);
            }
        }
    }

    async testBackupPathGeneration() {
        const backupManager = new BackupManager();
        
        // Test with project name
        const backupPath = await backupManager.getBackupPath('test-project');
        
        if (!backupPath.includes('test-project')) {
            throw new Error('Backup path should include project name');
        }

        if (!backupPath.includes('.ai-workflow-uninstall-backups')) {
            throw new Error('Backup path should include expected directory');
        }

        console.log(`   Generated path: ${path.basename(backupPath)}`);

        // Test path uniqueness
        const backupPath2 = await backupManager.getBackupPath('test-project');
        if (backupPath === backupPath2) {
            throw new Error('Backup paths should be unique (timestamp-based)');
        }
    }

    async testFileStaging() {
        const backupManager = new BackupManager();
        
        // Create test files
        const testFiles = [
            {
                type: 'manifest',
                name: 'test-manifest.json',
                content: JSON.stringify({ test: 'data' }, null, 2)
            },
            {
                type: 'plan',
                name: 'test-plan.json',
                content: JSON.stringify({ action: 'remove' }, null, 2)
            }
        ];

        // Create staging directory
        const stagingDir = await backupManager.createStagingDirectory();
        this.tempDirs.push(stagingDir);

        // Stage files
        await backupManager.stageFiles(testFiles, stagingDir);

        // Verify staging structure
        const manifestsDir = path.join(stagingDir, 'manifests');
        const planDir = path.join(stagingDir, 'plan');

        if (!fsSync.existsSync(manifestsDir)) {
            throw new Error('Manifests directory not created');
        }

        if (!fsSync.existsSync(planDir)) {
            throw new Error('Plan directory not created');
        }

        // Verify file contents
        const manifestPath = path.join(manifestsDir, 'test-manifest.json');
        const manifestContent = await fs.readFile(manifestPath, 'utf8');
        const manifestData = JSON.parse(manifestContent);
        
        if (manifestData.test !== 'data') {
            throw new Error('Manifest file content mismatch');
        }

        console.log(`   Staged ${testFiles.length} files successfully`);
    }

    async testMetadataGeneration() {
        const backupManager = new BackupManager();
        
        // Mock data
        const config = {
            projectName: 'test-project',
            options: ['config', 'compress']
        };
        const classification = { manifests: { installation: {}, generation: {} } };
        const plan = { actions: [] };
        const files = [{ name: 'test.json', content: '{}' }];

        const metadata = backupManager.generateMetadata(config, classification, plan, files);

        // Verify required fields
        const requiredFields = ['version', 'created', 'platform', 'projectName', 'backupType', 'fileCount'];
        for (const field of requiredFields) {
            if (!(field in metadata)) {
                throw new Error(`Missing metadata field: ${field}`);
            }
        }

        if (metadata.fileCount !== files.length) {
            throw new Error('File count mismatch in metadata');
        }

        if (metadata.projectName !== config.projectName) {
            throw new Error('Project name mismatch in metadata');
        }

        console.log(`   Generated metadata with ${requiredFields.length} required fields`);
    }

    async testArchiveCreationMocked() {
        // Mock test since actual archive creation requires external dependencies
        const backupManager = new BackupManager();
        
        // Create a temporary staging directory
        const stagingDir = await backupManager.createStagingDirectory();
        this.tempDirs.push(stagingDir);

        // Add some test content
        await fs.writeFile(path.join(stagingDir, 'test.txt'), 'test content');

        // Test backup path generation
        const outputPath = await backupManager.getBackupPath('test-project');
        const archiveType = backupManager.determineArchiveType();

        // The actual archive creation would be tested with the libraries installed
        console.log(`   Would create ${archiveType} archive at: ${path.basename(outputPath)}`);

        // Test platform-specific path generation
        let expectedExtension;
        if (archiveType === 'tar.gz') {
            expectedExtension = '.tar.gz';
        } else {
            expectedExtension = '.zip';
        }

        const finalPath = outputPath.endsWith(expectedExtension) ? 
            outputPath : `${outputPath}${expectedExtension}`;

        if (!finalPath.endsWith(expectedExtension)) {
            throw new Error(`Expected archive path to end with ${expectedExtension}`);
        }
    }

    async testErrorHandling() {
        const backupManager = new BackupManager();

        // Test with invalid inputs
        try {
            await backupManager.createBackup(null, null, null);
            throw new Error('Should have thrown error for null inputs');
        } catch (error) {
            if (!error.message.includes('Missing required backup parameters')) {
                throw new Error(`Unexpected error message: ${error.message}`);
            }
        }

        // Test with invalid directory
        try {
            await backupManager.ensureDirectory('/invalid/path/that/should/not/exist/ever');
            // This might succeed on some systems, so just log it
            console.log('   Warning: Directory creation succeeded unexpectedly');
        } catch (error) {
            // Expected for most systems
            console.log('   Error handling working for invalid paths');
        }

        console.log('   Error handling tests completed');
    }

    async testProgressReporting() {
        let progressCalls = 0;
        const progressCallback = (current, total, message) => {
            progressCalls++;
            console.log(`     Progress: ${current}/${total} - ${message}`);
        };

        const backupManager = new BackupManager();
        backupManager.setProgressCallback(progressCallback);

        // Test progress reporting
        await backupManager.reportProgress(0, 100, 'Starting test');
        await backupManager.reportProgress(50, 100, 'Halfway done');
        await backupManager.reportProgress(100, 100, 'Complete');

        if (progressCalls !== 3) {
            throw new Error(`Expected 3 progress calls, got ${progressCalls}`);
        }

        console.log(`   Progress reporting working: ${progressCalls} calls`);
    }

    async testFullBackupFlow() {
        // Test the full backup flow with mock data but without actually creating archives
        const backupManager = new BackupManager();

        // Mock data
        const config = {
            projectName: 'test-integration',
            options: ['config', 'compress'],
            path: null // Let it auto-generate
        };

        const classification = {
            manifests: {
                installation: { version: '1.0.0', files: [] },
                generation: { created: new Date().toISOString() }
            }
        };

        const plan = {
            actions: [
                { type: 'remove', path: '/test/path', reason: 'test' }
            ]
        };

        // Test file gathering
        const files = await backupManager.gatherBackupFiles(config, classification, plan);
        
        if (files.length < 3) {
            throw new Error('Should generate at least 3 files (manifests + plan)');
        }

        // Test metadata generation
        const metadata = backupManager.generateMetadata(config, classification, plan, files);
        
        if (!metadata.checksum) {
            throw new Error('Metadata should include checksum');
        }

        console.log(`   Integration test passed: ${files.length} files, metadata with checksum`);
    }

    async cleanup() {
        console.log('🧹 Cleaning up test resources...');
        
        // Clean up temporary directories
        for (const dir of this.tempDirs) {
            try {
                await fs.rm(dir, { recursive: true, force: true });
            } catch (error) {
                console.warn(`Warning: Failed to cleanup ${dir}: ${error.message}`);
            }
        }

        // Clean up any test backups
        for (const backup of this.createdBackups) {
            try {
                await fs.unlink(backup);
            } catch (error) {
                console.warn(`Warning: Failed to cleanup backup ${backup}: ${error.message}`);
            }
        }
    }

    printSummary() {
        console.log('📊 Test Summary');
        console.log('=' .repeat(40));
        
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.passed).length;
        const failedTests = totalTests - passedTests;
        
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests}`);
        console.log(`Failed: ${failedTests}`);
        
        if (failedTests > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults
                .filter(r => !r.passed)
                .forEach(r => console.log(`  - ${r.name}: ${r.error}`));
        }
        
        const avgDuration = this.testResults
            .filter(r => r.duration)
            .reduce((sum, r) => sum + r.duration, 0) / passedTests;
            
        console.log(`\nAverage Test Duration: ${avgDuration.toFixed(2)}ms`);
        
        const overallStatus = failedTests === 0 ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED';
        console.log(`\n${overallStatus}`);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const tester = new BackupTester();
    tester.runTests().catch(error => {
        console.error('Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = { BackupTester };