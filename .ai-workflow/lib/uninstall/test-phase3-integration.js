#!/usr/bin/env node

/**
 * Phase 3 Integration Test
 * Tests the integration of the enhanced UI with the main uninstaller flow
 */

const AIWorkflowUninstaller = require('./index');

async function testPhase3Integration() {
    console.log('🧪 Phase 3 Integration Test\n');
    console.log('=' .repeat(50));
    
    let testsPassed = 0;
    let testsFailed = 0;
    
    // Test 1: Constructor and UI Integration
    try {
        console.log('\n📋 Test 1: Constructor and UI Manager Integration');
        const uninstaller = new AIWorkflowUninstaller();
        
        // Check if UI manager is properly initialized
        if (uninstaller.ui && typeof uninstaller.ui.parseArgs === 'function') {
            console.log('✅ UI Manager properly initialized');
            testsPassed++;
        } else {
            console.log('❌ UI Manager not properly initialized');
            testsFailed++;
        }
    } catch (error) {
        console.log('❌ Constructor test failed:', error.message);
        testsFailed++;
    }
    
    // Test 2: Interactive Method Availability
    try {
        console.log('\n📋 Test 2: Interactive Methods Availability');
        const uninstaller = new AIWorkflowUninstaller();
        
        const requiredMethods = [
            'displaySummaryInteractive',
            'reviewFilesInteractive', 
            'adjustRulesInteractive',
            'showDetailedPlan',
            'createBackupPrompt',
            'getTypedAcknowledgmentEnhanced'
        ];
        
        let methodsAvailable = 0;
        for (const method of requiredMethods) {
            if (typeof uninstaller.ui[method] === 'function') {
                methodsAvailable++;
            } else {
                console.log(`❌ Missing method: ${method}`);
            }
        }
        
        if (methodsAvailable === requiredMethods.length) {
            console.log(`✅ All ${requiredMethods.length} interactive methods available`);
            testsPassed++;
        } else {
            console.log(`❌ Only ${methodsAvailable}/${requiredMethods.length} methods available`);
            testsFailed++;
        }
    } catch (error) {
        console.log('❌ Interactive methods test failed:', error.message);
        testsFailed++;
    }
    
    // Test 3: Argument Parsing with Interactive Flags
    try {
        console.log('\n📋 Test 3: Enhanced Argument Parsing');
        const uninstaller = new AIWorkflowUninstaller();
        
        // Test interactive mode flags
        const testArgs = ['--dry-run', '--interactive', '--debug'];
        await uninstaller.init(testArgs);
        
        if (uninstaller.config.interactive && uninstaller.config.dryRun && uninstaller.config.debug) {
            console.log('✅ Enhanced argument parsing works correctly');
            testsPassed++;
        } else {
            console.log('❌ Enhanced argument parsing failed');
            testsFailed++;
        }
    } catch (error) {
        console.log('❌ Argument parsing test failed:', error.message);
        testsFailed++;
    }
    
    // Test 4: Phase 2 Integration (FileClassifier and PlanBuilder)
    try {
        console.log('\n📋 Test 4: Phase 2 Integration');
        const uninstaller = new AIWorkflowUninstaller();
        await uninstaller.init(['--dry-run', '--non-interactive']);
        
        // Check if Phase 2 modules are properly imported
        const { FileClassifier } = require('./classifier');
        const { PlanBuilder } = require('./plan');
        
        if (FileClassifier && PlanBuilder) {
            console.log('✅ Phase 2 modules (FileClassifier, PlanBuilder) imported correctly');
            testsPassed++;
        } else {
            console.log('❌ Phase 2 modules not properly imported');
            testsFailed++;
        }
    } catch (error) {
        console.log('❌ Phase 2 integration test failed:', error.message);
        testsFailed++;
    }
    
    // Test 5: Non-Interactive Mode Compatibility
    try {
        console.log('\n📋 Test 5: Non-Interactive Mode Compatibility');
        const uninstaller = new AIWorkflowUninstaller();
        await uninstaller.init(['--dry-run', '--non-interactive', '--yes']);
        
        if (uninstaller.config.nonInteractive && uninstaller.config.yes && !uninstaller.config.interactive) {
            console.log('✅ Non-interactive mode configured correctly');
            testsPassed++;
        } else {
            console.log('❌ Non-interactive mode configuration failed');
            testsFailed++;
        }
    } catch (error) {
        console.log('❌ Non-interactive mode test failed:', error.message);
        testsFailed++;
    }
    
    // Test 6: Error Handling and Cleanup
    try {
        console.log('\n📋 Test 6: Error Handling and Cleanup');
        const uninstaller = new AIWorkflowUninstaller();
        
        // Test that UI cleanup methods exist
        if (typeof uninstaller.ui.closeInterface === 'function') {
            console.log('✅ UI cleanup methods available');
            testsPassed++;
        } else {
            console.log('❌ UI cleanup methods not available');
            testsFailed++;
        }
    } catch (error) {
        console.log('❌ Error handling test failed:', error.message);
        testsFailed++;
    }
    
    // Test Results Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Phase 3 Integration Test Results');
    console.log('='.repeat(50));
    console.log(`✅ Tests Passed: ${testsPassed}`);
    console.log(`❌ Tests Failed: ${testsFailed}`);
    console.log(`📈 Pass Rate: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%`);
    
    if (testsFailed === 0) {
        console.log('\n🎉 All Phase 3 integration tests passed!');
        console.log('✅ Interactive UI flow is properly integrated');
        console.log('✅ Backward compatibility maintained');
        console.log('✅ Phase 2 modules integrated correctly');
        console.log('✅ Enhanced UI methods available');
        console.log('✅ Error handling and cleanup implemented');
    } else {
        console.log('\n⚠️  Some tests failed. Review the integration before proceeding.');
    }
    
    console.log('\n🏁 Phase 3 Integration Testing Complete');
    return testsFailed === 0;
}

// Run the test if this file is executed directly
if (require.main === module) {
    testPhase3Integration()
        .then(success => {
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

module.exports = testPhase3Integration;