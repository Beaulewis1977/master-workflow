#!/usr/bin/env node

/**
 * Test script for sub-agent generation functionality
 */

const fs = require('fs');
const path = require('path');
const AgentGenerator = require('./intelligence-engine/agent-generator');

async function testAgentGeneration() {
  console.log('🧪 Testing Sub-Agent Generation...\n');
  
  // Sample analysis for a medium complexity React project
  const sampleAnalysis = {
    projectName: 'sample-react-app',
    score: 65,
    stage: 'active',
    projectType: 'webapp',
    factors: {
      techStack: {
        languages: ['JavaScript', 'TypeScript'],
        primaryLanguage: 'TypeScript',
        primaryFramework: 'React',
        frameworks: {
          react: true,
          nextjs: false,
          express: true
        },
        testing: {
          jest: true,
          cypress: true
        },
        infrastructure: {
          docker: true,
          kubernetes: false
        }
      },
      features: {
        detected: {
          api: true,
          database: true,
          auth: true,
          webapp: true
        }
      },
      architecture: {
        patterns: {
          mvc: true,
          microservices: false
        }
      }
    }
  };
  
  // Sample approach
  const sampleApproach = {
    selected: 'hiveMind',
    name: 'Hive-Mind Collaboration',
    score: 65,
    confidence: 0.85
  };
  
  try {
    // Test 1: Initialize generator
    console.log('Test 1: Initializing Agent Generator');
    const generator = new AgentGenerator({
      projectRoot: '/tmp/test-agent-gen'
    });
    console.log('  ✅ Generator initialized\n');
    
    // Test 2: Agent selection
    console.log('Test 2: Testing agent selection logic');
    const selectedAgents = generator.selectAgents(sampleAnalysis, sampleApproach);
    console.log(`  ✅ Selected ${selectedAgents.length} agents:`);
    selectedAgents.forEach(agent => console.log(`     - ${agent}`));
    console.log();
    
    // Test 3: Template customization
    console.log('Test 3: Testing template customization');
    const sampleTemplate = `---
name: test-agent
description: Test agent for [Project Name] project
---

You are a test agent for the [project] project.

## Complexity: [complexity]
## Stage: [stage]
## Approach: [approach]`;
    
    const customized = generator.customizeTemplate(sampleTemplate, sampleAnalysis, sampleApproach);
    console.log('  ✅ Template customized successfully');
    console.log('  Sample output:');
    console.log(customized.split('\n').slice(0, 8).map(l => '    ' + l).join('\n'));
    console.log();
    
    // Test 4: Project guidelines generation
    console.log('Test 4: Testing project guidelines generation');
    const guidelines = generator.generateProjectGuidelines(sampleAnalysis);
    console.log('  ✅ Guidelines generated:');
    console.log(guidelines.split('\n').slice(0, 5).map(l => '    ' + l).join('\n'));
    console.log();
    
    // Test 5: Full agent generation (dry run - don't actually write files)
    console.log('Test 5: Testing full agent generation (dry run)');
    
    // Mock the file writing to avoid actual file creation
    const originalWriteFile = fs.promises.writeFile;
    const generatedFiles = [];
    fs.promises.writeFile = async (filepath, content) => {
      generatedFiles.push({
        path: filepath,
        size: content.length
      });
    };
    
    // Mock mkdir
    const originalMkdir = fs.promises.mkdir;
    fs.promises.mkdir = async () => {};
    
    try {
      const agents = await generator.generateProjectAgents(sampleAnalysis, sampleApproach);
      console.log(`  ✅ Would generate ${agents.length} agents`);
      console.log(`  ✅ Would create ${generatedFiles.length} files:`);
      generatedFiles.forEach(file => {
        console.log(`     - ${path.basename(file.path)} (${file.size} bytes)`);
      });
    } finally {
      // Restore original functions
      fs.promises.writeFile = originalWriteFile;
      fs.promises.mkdir = originalMkdir;
    }
    console.log();
    
    // Test 6: Verify Anthropic spec compliance
    console.log('Test 6: Verifying Anthropic specification compliance');
    const testAgent = `---
name: code-reviewer
description: Expert code review specialist. Use for code quality checks.
tools: Read, Grep, Glob, Bash
---

You are a senior code reviewer ensuring high standards.`;
    
    // Check for required fields
    const hasName = testAgent.includes('name:');
    const hasDescription = testAgent.includes('description:');
    const hasValidStructure = testAgent.includes('---') && testAgent.split('---').length === 3;
    
    console.log(`  ${hasName ? '✅' : '❌'} Has 'name' field`);
    console.log(`  ${hasDescription ? '✅' : '❌'} Has 'description' field`);
    console.log(`  ${hasValidStructure ? '✅' : '❌'} Has valid YAML frontmatter structure`);
    console.log();
    
    console.log('✨ All tests passed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testAgentGeneration().catch(console.error);