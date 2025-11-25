/**
 * Claude-Flow Components Test Suite
 * ==================================
 * Tests for AgentDB, ReasoningBank, and Skills System
 */

import { AgentDB } from '../src/claude-flow/agentdb-integration.js';
import { ReasoningBank } from '../src/claude-flow/reasoning-bank.js';
import { SkillsSystem } from '../src/claude-flow/skills-system.js';

const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function test(name, fn) {
  try {
    fn();
    results.passed++;
    results.tests.push({ name, status: 'PASSED' });
    console.log(`  ✅ ${name}`);
  } catch (error) {
    results.failed++;
    results.tests.push({ name, status: 'FAILED', error: error.message });
    console.log(`  ❌ ${name}: ${error.message}`);
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    results.passed++;
    results.tests.push({ name, status: 'PASSED' });
    console.log(`  ✅ ${name}`);
  } catch (error) {
    results.failed++;
    results.tests.push({ name, status: 'FAILED', error: error.message });
    console.log(`  ❌ ${name}: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

async function runTests() {
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║           🧪 Claude-Flow Components Test Suite 🧪               ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  // ========== AgentDB Tests ==========
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🗄️  AgentDB v1.6.1 Tests');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const agentDB = new AgentDB({
    dbPath: '/tmp/test-agentdb.db',
    quantization: 'scalar',
    rlAlgorithm: 'ppo'
  });

  test('AgentDB: Constructor creates instance', () => {
    assert(agentDB instanceof AgentDB, 'Should be AgentDB instance');
    assert(agentDB.quantization === 'scalar', 'Should have scalar quantization');
    assert(agentDB.rlAlgorithm === 'ppo', 'Should have PPO algorithm');
  });

  await testAsync('AgentDB: Initialize', async () => {
    await agentDB.initialize();
    assert(agentDB.isInitialized, 'Should be initialized');
  });

  await testAsync('AgentDB: storeVector', async () => {
    const result = await agentDB.storeVector('test-1', 'Authentication patterns for OAuth2', {
      namespace: 'auth',
      type: 'pattern'
    });
    assert(result.id === 'test-1', 'Should store with correct ID');
    assert(agentDB.vectors.has('test-1'), 'Should be in vectors map');
  });

  await testAsync('AgentDB: storeMemory', async () => {
    const result = await agentDB.storeMemory({
      content: 'Use bcrypt for password hashing',
      namespace: 'security'
    });
    assert(result.id, 'Should have ID');
    assert(result.metadata.namespace === 'security', 'Should have namespace');
  });

  await testAsync('AgentDB: semanticSearch', async () => {
    const results = await agentDB.semanticSearch('authentication', { limit: 5 });
    assert(results.query === 'authentication', 'Should have query');
    assert(Array.isArray(results.results), 'Should have results array');
    assert(typeof results.latency === 'number', 'Should have latency');
  });

  await testAsync('AgentDB: retrieveMemories (v2.7 API)', async () => {
    const memories = await agentDB.retrieveMemories('authentication', {
      namespace: 'auth',
      limit: 10
    });
    assert(Array.isArray(memories), 'Should return array');
  });

  await testAsync('AgentDB: learnFromExperience', async () => {
    const result = await agentDB.learnFromExperience({
      task: 'Implement OAuth2 flow',
      actions: [{ type: 'research' }, { type: 'implement' }, { type: 'test' }],
      outcome: { quality: 0.9 },
      success: true,
      feedback: 'Well implemented'
    });
    assert(result.trajectory, 'Should have trajectory');
    assert(result.patterns.length > 0, 'Should extract patterns');
  });

  await testAsync('AgentDB: getBestApproach', async () => {
    const approach = await agentDB.getBestApproach('Implement caching');
    assert(approach.approach, 'Should have approach');
    assert(typeof approach.confidence === 'number', 'Should have confidence');
  });

  test('AgentDB: getStats', () => {
    const stats = agentDB.getStats();
    assert(typeof stats.queries === 'number', 'Should have queries count');
    assert(typeof stats.patterns === 'number', 'Should have patterns count');
    assert(typeof stats.skills === 'number', 'Should have skills count');
  });

  // ========== ReasoningBank Tests ==========
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🏦 ReasoningBank Tests');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const reasoningBank = new ReasoningBank({
    dbPath: '/tmp/test-reasoning.db',
    agentDB: agentDB
  });

  test('ReasoningBank: Constructor creates instance', () => {
    assert(reasoningBank instanceof ReasoningBank, 'Should be ReasoningBank instance');
    assert(reasoningBank.agentDB === agentDB, 'Should have AgentDB reference');
  });

  await testAsync('ReasoningBank: Initialize', async () => {
    await reasoningBank.initialize();
    assert(reasoningBank.isInitialized, 'Should be initialized');
  });

  await testAsync('ReasoningBank: store', async () => {
    const result = await reasoningBank.store({
      content: 'Always validate user input',
      metadata: { category: 'security' }
    }, 'best-practices');
    assert(result.id, 'Should have ID');
    assert(result.namespace === 'best-practices', 'Should have namespace');
  });

  await testAsync('ReasoningBank: search', async () => {
    const results = await reasoningBank.search('validate input', {
      namespace: 'best-practices',
      limit: 5
    });
    assert(results.query === 'validate input', 'Should have query');
    assert(Array.isArray(results.results), 'Should have results');
    assert(typeof results.latency === 'number', 'Should have latency');
  });

  await testAsync('ReasoningBank: retrieveMemories (v2.7 API)', async () => {
    const memories = await reasoningBank.retrieveMemories('security', {
      namespace: 'best-practices'
    });
    assert(Array.isArray(memories), 'Should return array');
  });

  await testAsync('ReasoningBank: learnPattern', async () => {
    const result = await reasoningBank.learnPattern({
      type: 'deployment',
      trigger: 'Production deployment',
      actions: ['test', 'build', 'deploy'],
      success: true,
      reward: 1.0
    });
    assert(result.id, 'Should have ID');
    assert(result.pattern.type === 'deployment', 'Should have pattern type');
  });

  await testAsync('ReasoningBank: createLink', async () => {
    const link = await reasoningBank.createLink(
      'poor error handling',
      'production crashes',
      'leads-to'
    );
    assert(link.from === 'poor error handling', 'Should have from');
    assert(link.to === 'production crashes', 'Should have to');
  });

  test('ReasoningBank: getReasoningChain', () => {
    const chain = reasoningBank.getReasoningChain('poor error handling', 'production crashes');
    assert(typeof chain.found === 'boolean', 'Should have found flag');
    assert(Array.isArray(chain.chain), 'Should have chain array');
  });

  test('ReasoningBank: getStats', () => {
    const stats = reasoningBank.getStats();
    assert(typeof stats.queries === 'number', 'Should have queries');
    assert(typeof stats.memories === 'number', 'Should have memories');
    assert(typeof stats.hitRate === 'string', 'Should have hitRate');
  });

  // ========== Skills System Tests ==========
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎯 Skills System Tests');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const skillsSystem = new SkillsSystem({
    agentDB: agentDB,
    reasoningBank: reasoningBank
  });

  test('SkillsSystem: Constructor creates instance', () => {
    assert(skillsSystem instanceof SkillsSystem, 'Should be SkillsSystem instance');
    assert(skillsSystem.skills.size > 0, 'Should have skills registered');
  });

  test('SkillsSystem: Has 25 skills', () => {
    assert(skillsSystem.skills.size >= 25, `Should have at least 25 skills, got ${skillsSystem.skills.size}`);
  });

  test('SkillsSystem: getSkills returns all skills', () => {
    const skills = skillsSystem.getSkills();
    assert(Array.isArray(skills), 'Should return array');
    assert(skills.length >= 25, 'Should have at least 25 skills');
  });

  test('SkillsSystem: Skills have required properties', () => {
    const skills = skillsSystem.getSkills();
    for (const skill of skills) {
      assert(skill.id, `Skill should have id`);
      assert(skill.name, `Skill ${skill.id} should have name`);
      assert(skill.category, `Skill ${skill.id} should have category`);
      assert(Array.isArray(skill.triggers), `Skill ${skill.id} should have triggers array`);
    }
  });

  await testAsync('SkillsSystem: activate with matching trigger', async () => {
    const result = await skillsSystem.activate('sparc methodology');
    assert(result, 'Should return result');
    assert(result.activated || result.noMatch, 'Should have activated or noMatch');
  });

  // ========== Summary ==========
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                    📊 Test Results 📊                            ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log(`   ✅ Passed: ${results.passed}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log(`   📊 Total:  ${results.passed + results.failed}`);
  console.log(`\n   Status: ${results.failed === 0 ? '🎉 ALL TESTS PASSED!' : '⚠️  Some tests failed'}\n`);

  // Cleanup
  try {
    const fs = await import('fs/promises');
    await fs.unlink('/tmp/test-agentdb.db').catch(() => {});
    await fs.unlink('/tmp/test-reasoning.db').catch(() => {});
  } catch (e) {
    // Ignore cleanup errors
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
