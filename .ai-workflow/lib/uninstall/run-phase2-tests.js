#!/usr/bin/env node

/**
 * Phase 2 Test Runner - Quick runner for classifier and plan builder tests
 * Run with: node run-phase2-tests.js
 */

const Phase2TestSuite = require('./test-phase2-classifier-plan');

async function main() {
  console.log('🚀 Running Phase 2 Test Suite - Classifier & Plan Builder');
  console.log('═'.repeat(60));
  
  const suite = new Phase2TestSuite();
  const exitCode = await suite.runTests();
  
  console.log('\n' + '═'.repeat(60));
  console.log('🎯 Phase 2 Testing Complete');
  
  if (exitCode === 0) {
    console.log('✅ All Phase 2 tests passed successfully!');
    console.log('🎉 Enhanced classifier and plan builder modules are working correctly.');
  } else {
    console.log('❌ Some Phase 2 tests failed. Check output above for details.');
  }
  
  process.exit(exitCode);
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Phase 2 test runner error:', error);
    process.exit(1);
  });
}

module.exports = main;