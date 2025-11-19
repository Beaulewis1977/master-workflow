#!/usr/bin/env node

/**
 * Claude Flow 2.0 Dependency Manager Integration Example
 * 
 * This example demonstrates how to integrate the dependency management
 * system with Claude Flow 2.0 init and other workflows.
 */

const path = require('path');
const chalk = require('chalk');
const { 
  integrateWithClaudeFlow, 
  quickDependencyCheck 
} = require('../claude-flow-deps');

/**
 * Example 1: Integration with Claude Flow 2.0 init
 */
async function exampleClaudeFlowInit() {
  console.log(chalk.cyan.bold('\n🚀 Example 1: Claude Flow 2.0 Init Integration'));
  console.log('═'.repeat(60));

  console.log('Simulating: npx claude-flow@2.0.0 init --claude --webui');
  
  // This would be called at the beginning of Claude Flow init
  const dependenciesReady = await integrateWithClaudeFlow('init', {
    nonInteractive: false,
    verbose: true
  });

  if (dependenciesReady) {
    console.log(chalk.green('✅ Dependencies verified - proceeding with Claude Flow init'));
    
    // Simulate Claude Flow initialization steps
    console.log('📁 Creating project structure...');
    console.log('🤖 Setting up agents...');
    console.log('⚙️  Configuring workflows...');
    console.log('🎉 Claude Flow 2.0 initialized successfully!');
  } else {
    console.log(chalk.red('❌ Dependencies not ready - aborting Claude Flow init'));
    console.log('Please run: npx claude-flow-deps install');
  }
}

/**
 * Example 2: Quick check for CI/CD
 */
async function exampleCICDCheck() {
  console.log(chalk.cyan.bold('\n🔧 Example 2: CI/CD Dependency Check'));
  console.log('═'.repeat(60));

  console.log('Simulating CI/CD environment check...');
  
  const isReady = await quickDependencyCheck();
  
  if (isReady) {
    console.log(chalk.green('✅ CI/CD: All dependencies available'));
    console.log('Proceeding with automated workflows...');
  } else {
    console.log(chalk.red('❌ CI/CD: Dependencies missing'));
    console.log('Build failed - dependency requirements not met');
    process.exit(1);
  }
}

/**
 * Example 3: Custom integration with your own project
 */
async function exampleCustomIntegration() {
  console.log(chalk.cyan.bold('\n🎨 Example 3: Custom Project Integration'));
  console.log('═'.repeat(60));

  const { ClaudeFlowDependencyManager } = require('../claude-flow-dependency-manager');
  
  // Create a custom dependency manager with your project's requirements
  const manager = new ClaudeFlowDependencyManager({
    nonInteractive: true,
    skipOptional: true, // Skip TMux in containerized environments
    configFile: '.my-project-deps.json'
  });

  console.log('Checking dependencies for custom project...');
  
  try {
    const result = await manager.ensureDependencies('custom-workflow');
    
    if (result.success) {
      console.log(chalk.green('✅ Custom project dependencies ready'));
      
      // Your project-specific initialization here
      console.log('🔧 Initializing custom workflow...');
      console.log('📋 Loading project configuration...');
      console.log('🚀 Starting application...');
      
    } else {
      console.log(chalk.yellow('⚠️  Some dependencies need attention'));
      console.log('Project may run with limited functionality');
    }
  } catch (error) {
    console.error(chalk.red('❌ Dependency check failed:'), error.message);
  }
}

/**
 * Example 4: Docker integration
 */
async function exampleDockerIntegration() {
  console.log(chalk.cyan.bold('\n🐳 Example 4: Docker Environment'));
  console.log('═'.repeat(60));

  // Simulate Docker environment detection
  const isDocker = process.env.DOCKER_CONTAINER === 'true' || 
                   require('fs').existsSync('/.dockerenv');

  if (isDocker) {
    console.log('🐳 Docker environment detected');
  }

  const { ClaudeFlowDependencyManager } = require('../claude-flow-dependency-manager');
  
  const manager = new ClaudeFlowDependencyManager({
    nonInteractive: true,
    offline: isDocker, // Assume limited internet in containers
    skipOptional: true,
    verbose: false
  });

  console.log('Checking dependencies in containerized environment...');
  
  const result = await manager.ensureDependencies('docker-init');
  
  if (result.success || result.skipped) {
    console.log(chalk.green('✅ Container ready for Claude Flow operations'));
  } else {
    console.log(chalk.red('❌ Container missing critical dependencies'));
  }
}

/**
 * Example 5: Development environment setup
 */
async function exampleDevelopmentSetup() {
  console.log(chalk.cyan.bold('\n👩‍💻 Example 5: Development Environment Setup'));
  console.log('═'.repeat(60));

  const { ClaudeFlowDependencyManager } = require('../claude-flow-dependency-manager');
  
  const manager = new ClaudeFlowDependencyManager({
    nonInteractive: false, // Interactive for developers
    verbose: true,
    includeOptional: true // Include all development tools
  });

  console.log('Setting up development environment...');
  
  const result = await manager.ensureDependencies('development');
  
  if (result.success) {
    console.log(chalk.green('\n🎉 Development environment ready!'));
    console.log(chalk.cyan('Available commands:'));
    console.log('  • npx claude-flow@2.0.0 init --claude --webui');
    console.log('  • npx claude-flow@2.0.0 hive-mind --agents 10');
    console.log('  • claude-flow-deps verify');
    
    console.log(chalk.cyan('\nDevelopment tools:'));
    console.log('  • Claude Code CLI for AI assistance');
    console.log('  • Agent-OS for workflow management');
    console.log('  • TMux for session management');
    console.log('  • Git for version control');
  }
}

/**
 * Example 6: Enterprise environment with proxy
 */
async function exampleEnterpriseSetup() {
  console.log(chalk.cyan.bold('\n🏢 Example 6: Enterprise Environment'));
  console.log('═'.repeat(60));

  // Simulate enterprise environment variables
  process.env.HTTP_PROXY = process.env.HTTP_PROXY || 'http://proxy.company.com:8080';
  process.env.NPM_REGISTRY = process.env.NPM_REGISTRY || 'https://npm.company.com';

  const { ClaudeFlowDependencyManager } = require('../claude-flow-dependency-manager');
  
  const manager = new ClaudeFlowDependencyManager({
    nonInteractive: true,
    offline: false,
    enterprise: true, // Custom enterprise mode
    configFile: '/etc/claude-flow/enterprise-config.json'
  });

  console.log('🏢 Enterprise environment detected');
  console.log(`   Proxy: ${process.env.HTTP_PROXY}`);
  console.log(`   Registry: ${process.env.NPM_REGISTRY}`);
  
  const result = await manager.ensureDependencies('enterprise-init');
  
  if (result.success) {
    console.log(chalk.green('✅ Enterprise deployment ready'));
    console.log('Compliance and security requirements satisfied');
  }
}

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log(chalk.magenta.bold('🎯 Claude Flow 2.0 Dependency Manager Integration Examples'));
  console.log('═'.repeat(80));
  
  try {
    await exampleClaudeFlowInit();
    await exampleCICDCheck();
    await exampleCustomIntegration();
    await exampleDockerIntegration();
    await exampleDevelopmentSetup();
    await exampleEnterpriseSetup();
    
    console.log(chalk.green.bold('\n🎉 All examples completed successfully!'));
    
  } catch (error) {
    console.error(chalk.red('\n💥 Example failed:'), error.message);
    process.exit(1);
  }
}

// Command line interface
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'init':
      exampleClaudeFlowInit();
      break;
    case 'cicd':
      exampleCICDCheck();
      break;
    case 'custom':
      exampleCustomIntegration();
      break;
    case 'docker':
      exampleDockerIntegration();
      break;
    case 'dev':
      exampleDevelopmentSetup();
      break;
    case 'enterprise':
      exampleEnterpriseSetup();
      break;
    default:
      runAllExamples();
  }
}

module.exports = {
  exampleClaudeFlowInit,
  exampleCICDCheck,
  exampleCustomIntegration,
  exampleDockerIntegration,
  exampleDevelopmentSetup,
  exampleEnterpriseSetup
};