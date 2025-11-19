#!/usr/bin/env node

/**
 * Simple script to run comprehensive fullstack-modern template tests
 * Uses the modular test runner for complete technology stack validation
 */

const FullstackModernTestRunner = require('./fullstack-modern-test-runner');

async function main() {
  console.log('🔥 Fullstack-Modern Template Comprehensive Test Suite');
  console.log('Testing: Next.js 14, React 18, Tailwind CSS, shadcn/ui, Zustand, Supabase, Rust');
  console.log('');
  
  const testRunner = new FullstackModernTestRunner();
  
  try {
    await testRunner.runComprehensiveTests();
    
    // Exit with appropriate code
    const passRate = testRunner.results.summary.passRate;
    if (passRate >= 80) {
      console.log('\n✅ Tests passed with good quality score!');
      process.exit(0);
    } else if (passRate >= 60) {
      console.log('\n⚠️ Tests completed with warnings. Review recommendations.');
      process.exit(0);
    } else {
      console.log('\n❌ Tests failed. Significant issues need attention.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 Test suite execution failed:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⏹️ Test suite interrupted by user');
  process.exit(130);
});

process.on('SIGTERM', () => {
  console.log('\n\n⏹️ Test suite terminated');
  process.exit(143);
});

// Run the tests
if (require.main === module) {
  main();
}