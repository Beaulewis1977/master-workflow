#!/usr/bin/env node

/**
 * Autonomous Documentation & Spec-Driven Development System - CLI
 * ================================================================
 * Command-line interface for the autonomous system.
 */

import { AutonomousSystem } from './index.js';
import path from 'path';

const args = process.argv.slice(2);

function printHelp() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║     Autonomous Documentation & Spec-Driven System CLI        ║
╚══════════════════════════════════════════════════════════════╝

Usage: node cli.js [command] [options]

Commands:
  analyze       Analyze project structure and components
  docs          Generate documentation
  specs         Generate technical specifications
  plans         Generate implementation plans
  quality       Run quality validation
  all           Run complete pipeline (default)
  
  Build Loop Commands:
  loop          Run a build loop (auto-selects best profile)
  loop:select   Show recommended loop profile without running
  loop:planning Run Architecture & Planning loop
  loop:spec     Run Spec-Driven Build loop
  loop:tdd      Run TDD loop
  loop:legacy   Run Legacy Rescue loop
  loop:polish   Run Polish & Optimization loop
  loops         List all available loop profiles

Options:
  --project, -p <path>    Project path (default: current directory)
  --output, -o <path>     Output directory (default: ./output)
  --verbose, -v           Enable verbose logging
  --help, -h              Show this help message

Examples:
  node cli.js all --project ./my-project --output ./docs
  node cli.js analyze -p ./src -v
  node cli.js loop --project ./my-project -v
  node cli.js loop:planning -p ./new-project
  node cli.js loop:select -v
`);
}

function parseArgs(args) {
  const options = {
    command: 'all',
    projectPath: process.cwd(),
    outputDir: './output',
    verbose: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
    
    if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
      continue;
    }
    
    if (arg === '--project' || arg === '-p') {
      options.projectPath = path.resolve(args[++i] || '.');
      continue;
    }
    
    if (arg === '--output' || arg === '-o') {
      options.outputDir = args[++i] || './output';
      continue;
    }
    
    // Command
    if (!arg.startsWith('-')) {
      options.command = arg;
    }
  }

  return options;
}

async function main() {
  const options = parseArgs(args);

  if (args.length === 0) {
    printHelp();
    process.exit(0);
  }

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║     Autonomous Documentation & Spec-Driven System            ║
╚══════════════════════════════════════════════════════════════╝
  `);

  console.log(`📁 Project: ${options.projectPath}`);
  console.log(`📂 Output: ${options.outputDir}`);
  console.log(`🔧 Command: ${options.command}`);
  console.log(`📢 Verbose: ${options.verbose}`);
  console.log('');

  const system = new AutonomousSystem({
    projectPath: options.projectPath,
    outputDir: options.outputDir,
    verbose: options.verbose
  });

  await system.initialize();

  try {
    switch (options.command) {
      case 'analyze': {
        console.log('🔍 Running project analysis...\n');
        const analysis = await system.analyzeOnly();
        console.log('\n✅ Analysis complete!');
        console.log(`   Components: ${Object.keys(analysis.components || {}).length}`);
        console.log(`   Files: ${analysis.structure?.totalFiles || 0}`);
        console.log(`   Gaps: ${analysis.gaps?.length || 0}`);
        break;
      }

      case 'docs': {
        console.log('📚 Generating documentation...\n');
        const docs = await system.generateDocs();
        console.log('\n✅ Documentation generated!');
        console.log(`   Files: ${docs.size}`);
        break;
      }

      case 'specs': {
        console.log('📋 Generating specifications...\n');
        const specs = await system.generateSpecs();
        console.log('\n✅ Specifications generated!');
        console.log(`   Files: ${specs.size}`);
        break;
      }

      case 'plans': {
        console.log('📅 Generating implementation plans...\n');
        const plans = await system.generatePlans();
        console.log('\n✅ Plans generated!');
        console.log(`   Files: ${plans.size}`);
        break;
      }

      case 'quality': {
        console.log('🔍 Running quality validation...\n');
        const quality = await system.validateQuality();
        console.log('\n✅ Quality validation complete!');
        console.log(`   Grade: ${quality.overall?.grade || 'N/A'}`);
        console.log(`   Score: ${quality.overall?.score || 0}%`);
        console.log(`   Issues: ${quality.issues?.length || 0}`);
        break;
      }

      case 'loops': {
        console.log('📋 Available loop profiles:\n');
        const loops = await system.getAvailableLoops();
        for (const loop of loops) {
          console.log(`  • ${loop.name} (${loop.key})`);
          console.log(`    Phases: ${loop.phases.join(' → ')}`);
          console.log(`    Max iterations: ${loop.maxIterations}\n`);
        }
        break;
      }

      case 'loop:select': {
        console.log('🔍 Selecting best loop profile...\n');
        const selection = await system.selectLoop();
        console.log(`\n✅ Recommended Loop: ${selection.profileData?.name || selection.profile}`);
        console.log(`   Confidence: ${Math.round(selection.confidence * 100)}%`);
        console.log(`   Reason: ${selection.reason}`);
        if (selection.factors?.length > 0) {
          console.log(`   Factors: ${selection.factors.join(', ')}`);
        }
        console.log(`\n   Alternatives:`);
        for (const alt of selection.alternatives || []) {
          console.log(`     - ${alt.name} (${alt.profile})`);
        }
        break;
      }

      case 'loop': {
        console.log('🔄 Running auto-selected build loop...\n');
        const loopResult = await system.runLoop();
        console.log(`\n✅ Loop complete!`);
        console.log(`   Profile: ${loopResult.profile}`);
        console.log(`   Success: ${loopResult.success}`);
        console.log(`   Exit reason: ${loopResult.exitReason}`);
        break;
      }

      case 'loop:planning':
        console.log('🏗️ Running Architecture & Planning loop...\n');
        await system.runLoop({ profile: 'planning' });
        break;

      case 'loop:spec':
        console.log('📋 Running Spec-Driven Build loop...\n');
        await system.runLoop({ profile: 'spec-driven' });
        break;

      case 'loop:tdd':
        console.log('🧪 Running TDD loop...\n');
        await system.runLoop({ profile: 'tdd' });
        break;

      case 'loop:legacy':
        console.log('🏚️ Running Legacy Rescue loop...\n');
        await system.runLoop({ profile: 'legacy-rescue' });
        break;

      case 'loop:polish':
        console.log('✨ Running Polish & Optimization loop...\n');
        await system.runLoop({ profile: 'polish' });
        break;

      case 'all':
      default:
        await system.runCompletePipeline();
        break;
    }

    console.log('\n🎉 Done!\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
