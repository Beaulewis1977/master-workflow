/**
 * Test Integration - Verify all modules load correctly
 */

async function testModules() {
  console.log('Testing module imports...\n');

  try {
    console.log('1. Testing AgentDB...');
    const { AgentDB } = await import('./src/claude-flow/agentdb-integration.js');
    console.log('   ✅ AgentDB loads successfully');

    console.log('\n2. Testing ReasoningBank...');
    const { ReasoningBank } = await import('./src/claude-flow/reasoning-bank.js');
    console.log('   ✅ ReasoningBank loads successfully');

    console.log('\n3. Testing SkillsSystem...');
    const { SkillsSystem } = await import('./src/claude-flow/skills-system.js');
    console.log('   ✅ SkillsSystem loads successfully');

    console.log('\n4. Testing ContextCompactor...');
    const { ContextCompactor } = await import('./src/context/context-compactor.js');
    console.log('   ✅ ContextCompactor loads successfully');

    console.log('\n5. Testing ProjectBootstrapAgent...');
    const { ProjectBootstrapAgent } = await import('./src/bootstrap/project-bootstrap-agent.js');
    console.log('   ✅ ProjectBootstrapAgent loads successfully');

    console.log('\n6. Testing IntegratedQueenController...');
    const { IntegratedQueenController } = await import('./src/integration/queen-integration.js');
    console.log('   ✅ IntegratedQueenController loads successfully');

    console.log('\n7. Testing main index.js...');
    const { MasterWorkflow3 } = await import('./src/index.js');
    console.log('   ✅ MasterWorkflow3 loads successfully');

    console.log('\n═══════════════════════════════════════');
    console.log('✅ ALL MODULES LOAD SUCCESSFULLY!');
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

testModules();
