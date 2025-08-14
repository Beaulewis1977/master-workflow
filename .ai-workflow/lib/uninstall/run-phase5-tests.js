#!/usr/bin/env node

/**
 * AI Workflow Uninstaller - Phase 5 Test Runner
 * 
 * Simplified test runner for Phase 5 Process Management tests
 * Follows the pattern established by other phase test runners
 */

const { ProcessTester } = require('./test-phase5-process');

async function runPhase5Tests() {
    console.log('🚀 Starting Phase 5 Process Management Tests');
    console.log('=' .repeat(60));
    
    try {
        const tester = new ProcessTester();
        await tester.runTests();
    } catch (error) {
        console.error('❌ Phase 5 test execution failed:', error);
        process.exit(1);
    }
}

// Auto-run if called directly
if (require.main === module) {
    runPhase5Tests();
}

module.exports = { runPhase5Tests };