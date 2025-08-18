#!/usr/bin/env node
// Simple test for Claude Flow 2.0 Clean Uninstaller

const fs = require('fs').promises;
const path = require('path');

async function testFiles() {
    const files = [
        'claude-flow-uninstaller.js',
        'claude-flow-clean-uninstall.sh',
        'claude-flow-clean-uninstall.ps1',
        'UNINSTALL.md'
    ];
    
    console.log('Testing Claude Flow 2.0 Clean Uninstaller...');
    console.log('='.repeat(50));
    
    let allPassed = true;
    
    for (const file of files) {
        try {
            await fs.access(file);
            console.log(`✓ ${file} exists`);
        } catch (error) {
            console.log(`✗ ${file} missing`);
            allPassed = false;
        }
    }
    
    // Test uninstaller module
    try {
        const UninstallerClass = require('./claude-flow-uninstaller.js');
        if (typeof UninstallerClass === 'function') {
            console.log('✓ Uninstaller module loads correctly');
        } else {
            console.log('✗ Uninstaller module invalid');
            allPassed = false;
        }
    } catch (error) {
        console.log(`✗ Uninstaller module error: ${error.message}`);
        allPassed = false;
    }
    
    console.log('='.repeat(50));
    
    if (allPassed) {
        console.log('🎉 All basic tests passed!');
        console.log('Run: node claude-flow-uninstaller.js --dry-run to test full functionality');
        return true;
    } else {
        console.log('❌ Some tests failed');
        return false;
    }
}

if (require.main === module) {
    testFiles()
        .then(success => process.exit(success ? 0 : 1))
        .catch(error => {
            console.error('Test failed:', error.message);
            process.exit(1);
        });
}

module.exports = testFiles;