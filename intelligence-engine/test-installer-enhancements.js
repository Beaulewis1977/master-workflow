#!/usr/bin/env node

/**
 * Test Script for Installer Enhancements
 * Validates the integration of Phase 4 document intelligence features
 */

const fs = require('fs').promises;
const path = require('path');

class InstallerEnhancementTester {
  constructor() {
    this.rootDir = '/workspaces/MASTER-WORKFLOW';
    this.installerPath = path.join(this.rootDir, 'install-modular.sh');
    this.engineDir = path.join(this.rootDir, 'intelligence-engine');
  }

  async runTests() {
    console.log('🧪 Testing Enhanced Installer Integration\n');
    
    const tests = [
      () => this.testInstallerFunctions(),
      () => this.testPhase4Components(),
      () => this.testFunctionIntegration(),
      () => this.testDocumentIntelligence()
    ];
    
    for (const test of tests) {
      try {
        await test();
      } catch (error) {
        console.error(`❌ Test failed: ${error.message}`);
      }
    }
    
    console.log('\n✅ All tests completed!');
  }

  async testInstallerFunctions() {
    console.log('📋 Testing installer function definitions...');
    
    const installerContent = await fs.readFile(this.installerPath, 'utf8');
    
    const requiredFunctions = [
      'analyze_existing_project',
      'create_agent_os_structure',
      'customize_templates',
      'interactive_document_update',
      'backup_existing_documents',
      'generate_all_documents',
      'update_existing_documents',
      'selective_document_update',
      'view_existing_documents'
    ];
    
    for (const func of requiredFunctions) {
      const functionPattern = new RegExp(`^${func}\\(\\)\\s*{`, 'm');
      if (functionPattern.test(installerContent)) {
        console.log(`  ✅ ${func}() - defined`);
      } else {
        throw new Error(`Function ${func}() not found`);
      }
    }
  }

  async testPhase4Components() {
    console.log('\n🏗️  Testing Phase 4 components...');
    
    const requiredComponents = [
      'agent-os-structure-handler.js',
      'agent-os-template-manager.js', 
      'agent-os-document-analyzer.js',
      'interactive-document-updater.js',
      'user-choice-handler.sh'
    ];
    
    for (const component of requiredComponents) {
      const componentPath = path.join(this.engineDir, component);
      try {
        await fs.access(componentPath);
        console.log(`  ✅ ${component} - exists`);
      } catch (error) {
        console.log(`  ⚠️  ${component} - missing`);
      }
    }
  }

  async testFunctionIntegration() {
    console.log('\n🔗 Testing function integration in install_agent_os_components...');
    
    const installerContent = await fs.readFile(this.installerPath, 'utf8');
    
    // Extract the install_agent_os_components function
    const funcStart = installerContent.indexOf('install_agent_os_components() {');
    const funcEnd = installerContent.indexOf('\n}', funcStart + installerContent.slice(funcStart).indexOf('\n# Load project analysis'));
    const functionContent = installerContent.slice(funcStart, funcEnd);
    
    const expectedCalls = [
      'analyze_existing_project',
      'create_agent_os_structure', 
      'customize_templates',
      'interactive_document_update'
    ];
    
    for (const call of expectedCalls) {
      if (functionContent.includes(call)) {
        console.log(`  ✅ ${call} - integrated`);
      } else {
        console.log(`  ⚠️  ${call} - not integrated`);
      }
    }
  }

  async testDocumentIntelligence() {
    console.log('\n📄 Testing document intelligence features...');
    
    // Test analysis.json exists (created by previous processes)
    const analysisPath = path.join(this.rootDir, '.ai-dev', 'analysis.json');
    try {
      const analysisContent = await fs.readFile(analysisPath, 'utf8');
      const analysis = JSON.parse(analysisContent);
      console.log(`  ✅ analysis.json - exists (complexity: ${analysis.score || 'unknown'})`);
    } catch (error) {
      console.log('  ⚠️  analysis.json - missing or invalid');
    }
    
    // Test Phase 4 documentation
    const docsToCheck = [
      'AGENT-OS-DOCUMENT-ANALYZER-README.md',
      'SHARED-MEMORY-README.md'
    ];
    
    for (const doc of docsToCheck) {
      const docPath = path.join(this.engineDir, doc);
      try {
        await fs.access(docPath);
        console.log(`  ✅ ${doc} - exists`);
      } catch (error) {
        console.log(`  ⚠️  ${doc} - missing`);
      }
    }
  }
}

// Run tests
const tester = new InstallerEnhancementTester();
tester.runTests().catch(console.error);