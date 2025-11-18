#!/usr/bin/env node

/**
 * Agent CLI
 * Command-line interface for running individual agents
 */

import { AgentOS } from '../agent-os/core/agent-runtime.js';

async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  const options = parseArgs(args);

  if (options.help || !options.task) {
    showHelp();
    process.exit(options.help ? 0 : 1);
  }

  console.log('🤖 Agent OS - AI Agent Execution\n');

  try {
    // Create agent
    const agent = new AgentOS({
      type: options.type || 'general',
      memory: !options.noMemory,
      planning: !options.noPlanning,
      verbose: options.verbose
    });

    console.log(`Agent Type: ${options.type || 'general'}`);
    console.log(`Task: ${options.task}`);
    console.log(`Memory: ${!options.noMemory ? 'enabled' : 'disabled'}`);
    console.log(`Planning: ${!options.noPlanning ? 'enabled' : 'disabled'}`);
    console.log('');

    // Listen to events
    agent.on('plan:created', (plan) => {
      console.log(`\n📋 Plan created with ${plan.steps.length} steps`);
    });

    agent.on('step:start', (step) => {
      console.log(`  ⚡ ${step.description || step.action}`);
    });

    agent.on('step:complete', ({ step, result }) => {
      console.log(`  ✓ Complete`);
    });

    // Execute task
    console.log('🚀 Executing task...\n');
    const startTime = Date.now();

    const result = await agent.execute({
      task: options.task,
      context: options.context || {},
      constraints: options.constraints || {}
    });

    const duration = Date.now() - startTime;

    // Show results
    console.log('\n' + '='.repeat(50));

    if (result.success) {
      console.log('✅ Task completed successfully!');
      console.log(`Duration: ${(duration / 1000).toFixed(2)}s`);
      console.log(`Iterations: ${result.iterations}`);
      console.log('\nResults:');
      console.log(JSON.stringify(result.results, null, 2));
    } else {
      console.log('❌ Task failed!');
      console.log(`Error: ${result.error}`);
      process.exit(1);
    }

    // Show agent stats
    const stats = agent.getStatus();
    console.log('\nAgent Stats:');
    console.log(`  Status: ${stats.status}`);
    console.log(`  Uptime: ${(stats.uptime / 1000).toFixed(2)}s`);

    // Cleanup
    await agent.shutdown();

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

function parseArgs(args) {
  const options = {
    type: 'general',
    task: null,
    context: {},
    noMemory: false,
    noPlanning: false,
    verbose: false,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--type' || arg === '-t') {
      options.type = args[++i];
    } else if (arg === '--task') {
      options.task = args[++i];
    } else if (arg === '--no-memory') {
      options.noMemory = true;
    } else if (arg === '--no-planning') {
      options.noPlanning = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    }
  }

  return options;
}

function showHelp() {
  console.log(`
🤖 Agent OS CLI - AI Agent Execution

Usage:
  node src/cli/agent-cli.js --task "<task>" [options]

Options:
  --task <string>         Task description (required)
  --type, -t <type>       Agent type (default: general)
                          Types: general, developer, planner, tester, reviewer
  --no-memory             Disable memory system
  --no-planning           Disable planning system
  --verbose, -v           Enable verbose logging
  --help, -h              Show this help message

Examples:
  # Run a general task
  node src/cli/agent-cli.js --task "Analyze the codebase structure"

  # Run with specific agent type
  node src/cli/agent-cli.js --type developer --task "Refactor the auth module"

  # Run without planning
  node src/cli/agent-cli.js --task "Quick test" --no-planning

  # Verbose output
  node src/cli/agent-cli.js --task "Debug the API" -v
`);
}

main();
