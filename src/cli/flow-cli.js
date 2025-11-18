#!/usr/bin/env node

/**
 * Claude Flow CLI
 * Command-line interface for running workflows
 */

import { FlowOrchestrator } from '../claude-flow/orchestrator/flow-orchestrator.js';
import { readFile } from 'fs/promises';
import yaml from 'yaml';

async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  const options = parseArgs(args);

  if (options.help || !options.workflow) {
    showHelp();
    process.exit(options.help ? 0 : 1);
  }

  console.log('🌊 Claude Flow - Workflow Orchestration\n');

  try {
    // Load workflow definition
    console.log(`Loading workflow: ${options.workflow}`);
    const workflowContent = await readFile(options.workflow, 'utf-8');
    const workflow = yaml.parse(workflowContent);

    console.log(`Workflow: ${workflow.name || 'unnamed'}`);
    if (workflow.description) {
      console.log(`Description: ${workflow.description}`);
    }
    console.log('');

    // Create orchestrator
    const orchestrator = new FlowOrchestrator({
      verbose: options.verbose
    });

    // Listen to events for progress tracking
    orchestrator.on('phase:start', ({ phase, index }) => {
      console.log(`\n📍 Phase ${index + 1}: ${phase.name}`);
    });

    orchestrator.on('agent:start', ({ agentId, config }) => {
      console.log(`  🤖 Starting agent: ${config.type} - ${config.task}`);
    });

    orchestrator.on('agent:complete', ({ agentId, result }) => {
      console.log(`  ✓ Agent complete: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    });

    orchestrator.on('phase:complete', ({ phase }) => {
      console.log(`✓ Phase complete: ${phase.name}`);
    });

    // Execute workflow
    console.log('🚀 Executing workflow...\n');
    const startTime = Date.now();

    const result = await orchestrator.executeWorkflow(workflow);

    const duration = Date.now() - startTime;

    // Show results
    console.log('\n' + '='.repeat(50));

    if (result.success) {
      console.log('✅ Workflow completed successfully!');
      console.log(`Duration: ${(duration / 1000).toFixed(2)}s`);
      console.log('\nResults:');
      console.log(JSON.stringify(result.results, null, 2));
    } else {
      console.log('❌ Workflow failed!');
      console.log(`Error: ${result.error}`);
      console.log('\nPartial results:');
      console.log(JSON.stringify(result.results, null, 2));
      process.exit(1);
    }

    // Cleanup
    await orchestrator.shutdown();

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
    workflow: null,
    verbose: false,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--workflow' || arg === '-w') {
      options.workflow = args[++i];
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
🌊 Claude Flow CLI - Workflow Orchestration

Usage:
  node src/cli/flow-cli.js --workflow <path> [options]

Options:
  --workflow, -w <path>   Path to workflow YAML file (required)
  --verbose, -v           Enable verbose logging
  --help, -h              Show this help message

Examples:
  # Run a workflow
  node src/cli/flow-cli.js --workflow workflows/example.yaml

  # Run with verbose output
  node src/cli/flow-cli.js -w workflows/example.yaml -v

Workflow Format:
  See workflows/example-feature-development.yaml for an example.
`);
}

main();
