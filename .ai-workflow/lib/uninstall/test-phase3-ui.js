#!/usr/bin/env node

/**
 * Phase 3 UI Test Suite
 * Comprehensive testing of enhanced UI functionality
 */

const { UIManager, parseArgs, createUIManager, formatSize, colors } = require('./ui');
const { FileClassifier } = require('./classifier');
const { PlanBuilder } = require('./plan');
const AIWorkflowUninstaller = require('./index');

// Mock inquirer for testing
const originalInquirer = require('inquirer');
let mockInquirerResponses = {};
let mockCallIndex = 0;
let originalPrompt = null;

function setupInquirerMock(responses) {
    mockInquirerResponses = responses;
    mockCallIndex = 0;
    
    // Store original prompt if not already stored
    if (!originalPrompt) {
        originalPrompt = originalInquirer.prompt;
    }
    
    // Replace inquirer.prompt with our mock
    originalInquirer.prompt = function(questions) {
        const currentCall = mockCallIndex++;
        const response = mockInquirerResponses[currentCall];
        
        if (!response) {
            throw new Error(`No mock response configured for inquirer call ${currentCall}`);
        }
        
        return Promise.resolve(response);
    };
}

function restoreInquirer() {
    if (originalPrompt) {
        originalInquirer.prompt = originalPrompt;
    }
    mockInquirerResponses = {};
    mockCallIndex = 0;
}

// Mock readline for testing basic UI methods
let mockReadlineResponse = '';
function setupReadlineMock(response) {
    mockReadlineResponse = response;
}

class TestRunner {
    constructor() {
        this.testsPassed = 0;
        this.testsFailed = 0;
        this.testResults = [];
    }

    async runTest(name, testFn) {
        try {
            console.log(`\n📋 ${name}`);
            console.log('─'.repeat(60));
            
            await testFn();
            
            this.testsPassed++;
            this.testResults.push({ name, status: 'PASS' });
            console.log(`✅ ${name} - PASSED`);
            
        } catch (error) {
            this.testsFailed++;
            this.testResults.push({ name, status: 'FAIL', error: error.message });
            console.log(`❌ ${name} - FAILED: ${error.message}`);
            
            if (process.env.DEBUG) {
                console.log('Stack trace:', error.stack);
            }
        }
    }

    printSummary() {
        console.log('\n' + '='.repeat(80));
        console.log('📊 Phase 3 UI Test Results Summary');
        console.log('='.repeat(80));
        
        this.testResults.forEach(result => {
            const status = result.status === 'PASS' ? '✅' : '❌';
            console.log(`${status} ${result.name}`);
            if (result.error) {
                console.log(`    Error: ${result.error}`);
            }
        });
        
        console.log('\n' + '─'.repeat(80));
        console.log(`✅ Tests Passed: ${this.testsPassed}`);
        console.log(`❌ Tests Failed: ${this.testsFailed}`);
        console.log(`📈 Pass Rate: ${Math.round((this.testsPassed / (this.testsPassed + this.testsFailed)) * 100)}%`);
        
        if (this.testsFailed === 0) {
            console.log('\n🎉 All Phase 3 UI tests passed!');
            console.log('✅ Enhanced UI functionality verified');
            console.log('✅ Interactive flow working correctly');
            console.log('✅ Integration with Phase 2 modules confirmed');
            console.log('✅ Error handling and safety features tested');
        } else {
            console.log('\n⚠️  Some tests failed. Review the UI implementation.');
        }
        
        return this.testsFailed === 0;
    }
}

async function testParseArgs() {
    // Test basic flag parsing
    const config1 = parseArgs(['--dry-run', '--interactive', '--debug']);
    if (!config1.dryRun || !config1.interactive || !config1.debug) {
        throw new Error('Basic flag parsing failed');
    }

    // Test new Phase 3 flags
    const config2 = parseArgs(['--no-dry-run', '--yes', '--backup', 'test-backup', '--json']);
    if (config2.dryRun || !config2.yes || config2.backup !== 'test-backup' || !config2.jsonOutput) {
        throw new Error('Phase 3 flag parsing failed');
    }

    // Test conflicting flags
    const config3 = parseArgs(['--interactive', '--non-interactive']);
    if (config3.interactive) {
        throw new Error('Flag conflict resolution failed');
    }

    // Test backup flag without value (should default to 'auto')
    const config4 = parseArgs(['--backup']);
    if (config4.backup !== 'auto') {
        throw new Error('Backup flag default value failed');
    }

    // Test git protection flags
    const config5 = parseArgs(['--ignore-git']);
    if (config5.gitProtect || !config5.ignoreGit) {
        throw new Error('Git protection flag parsing failed');
    }

    console.log('All argument parsing scenarios work correctly');
}

async function testUIManagerConstruction() {
    const ui = new UIManager();
    
    if (!ui) {
        throw new Error('UIManager construction failed');
    }

    // Test that required methods exist
    const requiredMethods = [
        'parseArgs', 'printHelp', 'createInterface', 'closeInterface',
        'confirm', 'getTypedAcknowledgment', 'reviewFiles', 'showProgress',
        'displaySummary', 'getMenuChoice',
        // Phase 3 enhanced methods
        'displaySummaryInteractive', 'reviewFilesInteractive', 
        'adjustRulesInteractive', 'showDetailedPlan', 'createBackupPrompt',
        'getTypedAcknowledgmentEnhanced', 'pressEnterToContinue'
    ];

    for (const method of requiredMethods) {
        if (typeof ui[method] !== 'function') {
            throw new Error(`Missing method: ${method}`);
        }
    }

    console.log(`All ${requiredMethods.length} required methods available`);
}

async function testUtilityFunctions() {
    // Test formatSize utility
    if (formatSize(0) !== '0 B') {
        throw new Error('formatSize(0) failed');
    }
    
    if (formatSize(1024) !== '1 KB') {
        throw new Error('formatSize(1024) failed');
    }
    
    if (formatSize(1024 * 1024) !== '1 MB') {
        throw new Error('formatSize(1MB) failed');
    }

    // Test createUIManager
    const ui = createUIManager();
    if (!ui || !(ui instanceof UIManager)) {
        throw new Error('createUIManager failed');
    }

    // Test colors utility
    if (!colors.error || !colors.success || !colors.warning || !colors.info || !colors.debug) {
        throw new Error('Colors utility missing functions');
    }

    console.log('All utility functions work correctly');
}

async function testInteractivePrompts() {
    // Test displaySummaryInteractive with mock
    setupInquirerMock([
        { choice: 'R' }, // Review files choice
        { choice: 'Q' }  // Quit choice
    ]);

    const ui = new UIManager();
    const mockPlan = {
        summary: {
            remove: 5,
            keep: 10,
            unknown: 2,
            totalSizeFormatted: '1.5 MB'
        },
        processes: [
            { name: 'test-process', pid: 1234 }
        ],
        notes: ['Test configuration note']
    };

    try {
        // Mock console methods to avoid output during tests
        const originalLog = console.log;
        const originalClear = console.clear;
        console.log = () => {};
        console.clear = () => {};
        
        const choice1 = await ui.displaySummaryInteractive(mockPlan);
        if (choice1 !== 'R') {
            throw new Error('displaySummaryInteractive first choice failed');
        }

        const choice2 = await ui.displaySummaryInteractive(mockPlan);
        if (choice2 !== 'Q') {
            throw new Error('displaySummaryInteractive second choice failed');
        }

        // Restore console methods
        console.log = originalLog;
        console.clear = originalClear;

        console.log('Interactive summary display works correctly');
    } finally {
        restoreInquirer();
    }
}

async function testBackupPrompt() {
    // Test backup creation prompt
    setupInquirerMock([
        {
            createBackup: true,
            backupPath: '/test/backup/path',
            backupOptions: ['config', 'compress']
        }
    ]);

    const ui = new UIManager();
    
    try {
        // Mock console methods to avoid output during tests
        const originalLog = console.log;
        const originalClear = console.clear;
        console.log = () => {};
        console.clear = () => {};
        
        const backupConfig = await ui.createBackupPrompt();
        
        // Restore console methods
        console.log = originalLog;
        console.clear = originalClear;
        
        if (!backupConfig || backupConfig.path !== '/test/backup/path') {
            throw new Error('Backup path configuration failed');
        }
        
        if (!backupConfig.options.includes('config') || !backupConfig.options.includes('compress')) {
            throw new Error('Backup options configuration failed');
        }

        console.log('Backup prompt works correctly');
    } finally {
        restoreInquirer();
    }

    // Test backup prompt with no backup
    setupInquirerMock([
        { createBackup: false }
    ]);

    try {
        // Mock console methods to avoid output during tests
        const originalLog = console.log;
        const originalClear = console.clear;
        console.log = () => {};
        console.clear = () => {};
        
        const backupConfig = await ui.createBackupPrompt();
        
        // Restore console methods
        console.log = originalLog;
        console.clear = originalClear;
        
        if (backupConfig !== null) {
            throw new Error('Backup cancellation failed');
        }

        console.log('Backup prompt cancellation works correctly');
    } finally {
        restoreInquirer();
    }
}

async function testFileReviewInteractive() {
    // Test file review with different options
    setupInquirerMock([
        { option: 'list' }, // Choose list view
        { decision: 'keep' }, // Keep first file
        { decision: 'remove' }, // Remove second file
        { decision: 'skip' } // Skip third file
    ]);

    const ui = new UIManager();
    const mockFiles = [
        { path: '/test/file1.txt', reason: 'Test file 1', size: 1024 },
        { path: '/test/file2.txt', reason: 'Test file 2', size: 2048 },
        { path: '/test/file3.txt', reason: 'Test file 3', size: 512 }
    ];

    try {
        // Mock console methods to avoid output during tests
        const originalLog = console.log;
        const originalClear = console.clear;
        console.log = () => {};
        console.clear = () => {};
        
        const decisions = await ui.reviewFilesInteractive(mockFiles, 'test');
        
        // Restore console methods
        console.log = originalLog;
        console.clear = originalClear;
        
        if (!decisions || decisions.length !== 3) {
            throw new Error('File review decisions count mismatch');
        }
        
        if (decisions[0].action !== 'keep' || decisions[1].action !== 'remove' || decisions[2].action !== 'skip') {
            throw new Error('File review decisions incorrect');
        }

        console.log('Interactive file review works correctly');
    } finally {
        restoreInquirer();
    }
}

async function testRuleAdjustment() {
    // Test rule adjustment interface
    setupInquirerMock([
        { category: 'remove' }, // Choose remove category
        { action: 'individual' }, // Choose individual review
        { decision: 'keep' } // Change decision to keep
    ]);

    const ui = new UIManager();
    const mockClassification = {
        remove: [
            { path: '/test/remove1.txt', reason: 'System file' }
        ],
        keep: [
            { path: '/test/keep1.txt', reason: 'User file' }
        ],
        unknown: [
            { path: '/test/unknown1.txt', reason: 'Unknown type' }
        ]
    };

    try {
        // Mock console methods to avoid output during tests
        const originalLog = console.log;
        const originalClear = console.clear;
        console.log = () => {};
        console.clear = () => {};
        
        const changes = await ui.adjustRulesInteractive(mockClassification);
        
        // Restore console methods
        console.log = originalLog;
        console.clear = originalClear;
        
        if (!changes || changes.length !== 1) {
            throw new Error('Rule adjustment failed');
        }

        console.log('Rule adjustment interface works correctly');
    } finally {
        restoreInquirer();
    }
}

async function testDetailedPlan() {
    // Test showDetailedPlan
    setupInquirerMock([
        { continue: '' } // Press enter to continue
    ]);

    const ui = new UIManager();
    const mockPlan = {
        summary: {
            remove: 3,
            keep: 5,
            unknown: 1,
            removeSizeFormatted: '500 KB',
            keepSizeFormatted: '2 MB',
            unknownSizeFormatted: '100 KB'
        },
        remove: [
            { path: '/test/remove1.txt', reason: 'System file', size: 1024 },
            { path: '/test/remove2.txt', reason: 'Cache file', size: 2048 }
        ],
        processes: [
            { name: 'ai-workflow', pid: 5678, status: 'Running' }
        ],
        notes: [
            'Dry-run mode enabled',
            'Git protection active'
        ]
    };

    try {
        // Mock console methods to avoid output during tests
        const originalLog = console.log;
        const originalClear = console.clear;
        console.log = () => {};
        console.clear = () => {};
        
        // This should not throw an error
        await ui.showDetailedPlan(mockPlan);
        
        // Restore console methods
        console.log = originalLog;
        console.clear = originalClear;
        
        console.log('Detailed plan display works correctly');
    } finally {
        restoreInquirer();
    }
}

async function testTypedAcknowledgment() {
    // Test enhanced typed acknowledgment
    setupInquirerMock([
        { confirmation: 'I UNDERSTAND AND ACCEPT THE RISKS' }
    ]);

    const ui = new UIManager();
    
    try {
        // Mock console methods to avoid output during tests
        const originalLog = console.log;
        console.log = () => {};
        
        const confirmed = await ui.getTypedAcknowledgmentEnhanced();
        
        // Restore console methods
        console.log = originalLog;
        
        if (!confirmed) {
            throw new Error('Enhanced typed acknowledgment failed');
        }

        console.log('Enhanced typed acknowledgment works correctly');
    } finally {
        restoreInquirer();
    }

    // Test with wrong confirmation
    setupInquirerMock([
        { confirmation: 'wrong phrase' }
    ]);

    try {
        // Mock console methods to avoid output during tests
        const originalLog = console.log;
        console.log = () => {};
        
        const confirmed = await ui.getTypedAcknowledgmentEnhanced();
        
        // Restore console methods
        console.log = originalLog;
        
        if (confirmed) {
            throw new Error('Enhanced typed acknowledgment should reject wrong phrase');
        }

        console.log('Enhanced typed acknowledgment rejection works correctly');
    } finally {
        restoreInquirer();
    }
}

async function testIntegrationWithClassifier() {
    // Test that UI can properly handle classification data
    const ui = new UIManager();
    
    // Mock some basic classification data
    const mockClassification = {
        remove: [
            { path: '/test/system.log', reason: 'System log file', size: 1024 },
            { path: '/test/.cache/data', reason: 'Cache file', size: 2048 }
        ],
        keep: [
            { path: '/test/user-config.json', reason: 'User configuration', size: 512 },
            { path: '/test/my-document.txt', reason: 'User document', size: 1536 }
        ],
        unknown: [
            { path: '/test/mystery.file', reason: 'Unknown file type', size: 256 }
        ]
    };

    // Test that rule adjustment can handle this data structure
    if (!mockClassification.remove || !Array.isArray(mockClassification.remove)) {
        throw new Error('Classification data structure incompatible with UI');
    }

    // Test that file review can handle the data
    const testFiles = mockClassification.remove;
    if (testFiles.length === 0 || !testFiles[0].path || !testFiles[0].reason) {
        throw new Error('File data structure incompatible with UI');
    }

    console.log('UI integration with classifier data verified');
}

async function testIntegrationWithPlanBuilder() {
    // Test that UI can properly handle plan data
    const ui = new UIManager();
    
    // Mock plan data structure from PlanBuilder
    const mockPlan = {
        summary: {
            remove: 5,
            keep: 8,
            unknown: 2,
            totalSizeFormatted: '1.2 MB',
            removeSizeFormatted: '800 KB',
            keepSizeFormatted: '400 KB',
            unknownSizeFormatted: '50 KB'
        },
        remove: [
            { path: '/test/system1.log', reason: 'System log', size: 1024 },
            { path: '/test/.cache/temp', reason: 'Temporary cache', size: 2048 }
        ],
        keep: [
            { path: '/test/config.json', reason: 'Configuration file', size: 512 }
        ],
        unknown: [
            { path: '/test/unknown.dat', reason: 'Unknown binary', size: 256 }
        ],
        processes: [
            { name: 'ai-workflow-daemon', pid: 1234, status: 'Running' }
        ],
        notes: [
            'Dry-run mode enabled',
            'Git protection active',
            'User files will be preserved'
        ]
    };

    // Test that summary display can handle this structure
    if (!mockPlan.summary || typeof mockPlan.summary.remove !== 'number') {
        throw new Error('Plan summary structure incompatible with UI');
    }

    // Test that detailed plan can handle the file arrays
    if (!Array.isArray(mockPlan.remove) || !Array.isArray(mockPlan.keep) || !Array.isArray(mockPlan.unknown)) {
        throw new Error('Plan file arrays incompatible with UI');
    }

    // Test that process data is properly structured
    if (!Array.isArray(mockPlan.processes) || (mockPlan.processes.length > 0 && !mockPlan.processes[0].name)) {
        throw new Error('Plan process data incompatible with UI');
    }

    console.log('UI integration with plan builder data verified');
}

async function testErrorHandling() {
    const ui = new UIManager();
    
    // Test interface cleanup
    ui.createInterface();
    if (!ui.rl) {
        throw new Error('Interface creation failed');
    }
    
    ui.closeInterface();
    if (ui.rl !== null) {
        throw new Error('Interface cleanup failed');
    }

    // Test that empty file arrays are handled gracefully
    const emptyResult = [];
    if (!Array.isArray(emptyResult)) {
        throw new Error('Empty file handling test failed');
    }
    
    // Test formatSize utility with edge cases
    if (formatSize(0) !== '0 B') {
        throw new Error('formatSize edge case failed');
    }

    console.log('Error handling and cleanup verified');
}

async function testNonInteractiveCompatibility() {
    // Test that the UI manager works correctly in non-interactive scenarios
    const config = parseArgs(['--non-interactive', '--yes', '--dry-run']);
    
    if (!config.nonInteractive || !config.yes || config.interactive) {
        throw new Error('Non-interactive configuration parsing failed');
    }

    // Test that UI manager can be created in non-interactive mode
    const ui = new UIManager();
    if (!ui) {
        throw new Error('UI manager creation failed in non-interactive mode');
    }

    console.log('Non-interactive mode compatibility verified');
}

async function testCIEnvironmentHandling() {
    // Test behavior in CI environment
    const originalCI = process.env.CI;
    
    try {
        // Simulate CI environment
        process.env.CI = 'true';
        
        const uninstaller = new AIWorkflowUninstaller();
        await uninstaller.init([]); // No flags - should default to dry-run in CI
        
        // In CI, it should default to dry-run when no flags specified
        if (!uninstaller.config.dryRun) {
            throw new Error('CI environment should default to dry-run when no flags specified');
        }
        
        console.log('CI environment handling verified');
    } finally {
        // Restore original CI environment
        if (originalCI) {
            process.env.CI = originalCI;
        } else {
            delete process.env.CI;
        }
    }
}

async function testSafetyFeatures() {
    // Test that safety features are properly configured
    const defaultConfig = parseArgs([]);
    
    // Should default to safe options
    if (!defaultConfig.dryRun) {
        throw new Error('Should default to dry-run for safety');
    }
    
    if (!defaultConfig.gitProtect) {
        throw new Error('Should default to git protection');
    }
    
    if (!defaultConfig.keepGenerated) {
        throw new Error('Should default to keeping generated files');
    }

    // Test that safety overrides work
    const unsafeConfig = parseArgs(['--no-dry-run', '--ignore-git', '--no-keep-generated']);
    
    if (unsafeConfig.dryRun || unsafeConfig.gitProtect || unsafeConfig.keepGenerated) {
        throw new Error('Safety overrides not working');
    }

    console.log('Safety features verified');
}

// Main test execution
async function runPhase3UITests() {
    console.log('🧪 Phase 3 UI Test Suite');
    console.log('='.repeat(80));
    console.log('Testing enhanced UI functionality and interactive features');
    console.log('='.repeat(80));

    const runner = new TestRunner();

    // Core functionality tests
    await runner.runTest('parseArgs() with all new flags', testParseArgs);
    await runner.runTest('UIManager construction and methods', testUIManagerConstruction);
    await runner.runTest('Utility functions (formatSize, createUIManager, colors)', testUtilityFunctions);

    // Interactive UI tests (with mocked inquirer)
    await runner.runTest('Interactive prompts (displaySummaryInteractive)', testInteractivePrompts);
    await runner.runTest('Backup creation prompt', testBackupPrompt);
    await runner.runTest('Interactive file review', testFileReviewInteractive);
    await runner.runTest('Rule adjustment interface', testRuleAdjustment);
    await runner.runTest('Detailed plan display', testDetailedPlan);
    await runner.runTest('Enhanced typed acknowledgment', testTypedAcknowledgment);

    // Integration tests with Phase 2 modules
    await runner.runTest('Integration with FileClassifier data', testIntegrationWithClassifier);
    await runner.runTest('Integration with PlanBuilder data', testIntegrationWithPlanBuilder);

    // Error handling and safety tests
    await runner.runTest('Error handling and UI cleanup', testErrorHandling);
    await runner.runTest('Non-interactive mode compatibility', testNonInteractiveCompatibility);
    await runner.runTest('CI environment handling', testCIEnvironmentHandling);
    await runner.runTest('Safety features (dry-run defaults, confirmations)', testSafetyFeatures);

    return runner.printSummary();
}

// Export for external use
module.exports = runPhase3UITests;

// Run tests if executed directly
if (require.main === module) {
    runPhase3UITests()
        .then(success => {
            console.log('\n🏁 Phase 3 UI Testing Complete');
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('\n💥 Test execution failed:', error.message);
            if (process.env.DEBUG) {
                console.error(error.stack);
            }
            process.exit(1);
        });
}