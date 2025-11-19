/**
 * Test System Initialization - Full integration test
 */

async function testSystemInitialization() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('   MASTER WORKFLOW 3.0 - SYSTEM INITIALIZATION TEST');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    console.log('1️⃣  Importing MasterWorkflow3...');
    const { MasterWorkflow3 } = await import('./src/index.js');
    console.log('   ✅ Module imported successfully\n');

    console.log('2️⃣  Creating Master Workflow instance...');
    const system = new MasterWorkflow3({
      verbose: false,
      maxConcurrent: 10
    });
    console.log('   ✅ Instance created successfully\n');

    console.log('3️⃣  Initializing all systems...');
    await system.initialize();
    console.log('   ✅ All systems initialized successfully\n');

    console.log('4️⃣  Getting system status...');
    const status = await system.getStatus();
    console.log('   ✅ System status retrieved\n');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('                  SYSTEM STATUS');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(JSON.stringify(status, null, 2));

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ MASTER WORKFLOW 3.0 - ALL SYSTEMS OPERATIONAL!');
    console.log('═══════════════════════════════════════════════════════════\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

testSystemInitialization();
