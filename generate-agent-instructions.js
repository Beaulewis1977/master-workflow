#!/usr/bin/env node

/**
 * Generate All Agent Instructions
 * Creates JSON and XML instructions for precise agent execution
 */

import AgentInstructionGenerator from './src/autonomous-system/agent-instruction-generator.js';

console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🎯 Agent Instruction Generator - Master Workflow 3.0     ║
║                                                              ║
║   Creating structured JSON/XML instructions for agents     ║
║   to follow precisely during autonomous implementation     ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`);

async function generateInstructions() {
    try {
        // Initialize the instruction generator
        const generator = new AgentInstructionGenerator({
            outputDir: './instructions',
            generateJSON: true,
            generateXML: true,
            includeValidation: true,
            includeMonitoring: true
        });

        // Generate all instructions
        await generator.generateAllInstructions();

        console.log('\n✅ Success! All agent instructions have been generated.');
        console.log('\n📁 You can now find the instructions in:');
        console.log('   ./instructions/tasks/          - Individual task instructions');
        console.log('   ./instructions/workflows/      - Workflow definitions');
        console.log('   ./instructions/agents/         - Agent configurations');
        console.log('   ./instructions/validation/     - Validation schemas');
        console.log('   ./instructions/monitoring/     - Monitoring configurations');
        
        console.log('\n🚀 Ready to execute with:');
        console.log('   node workflow-runner-modular.js --workflow implement-engine-improvements');
        console.log('   node workflow-runner-modular.js --workflow implement-autonomous-docs');

    } catch (error) {
        console.error('\n❌ Failed to generate instructions:', error);
        process.exit(1);
    }
}

// Run the generator
generateInstructions();
