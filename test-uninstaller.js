#!/usr/bin/env node
/**
 * Test script for Claude Flow 2.0 Clean Uninstaller
 * Validates all components and functionality
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class UninstallerTest {
    constructor() {
        this.testResults = [];
        this.errors = [];
        this.projectRoot = process.cwd();
    }
    
    log(message, type = 'info') {
        const colors = {
            info: '\x1b[36m',
            success: '\x1b[32m',
            warning: '\x1b[33m',
            error: '\x1b[31m',
            reset: '\x1b[0m'
        };
        console.log(`${colors[type]}[${type.toUpperCase()}]${colors.reset} ${message}`);
    }
    
    async test(name, testFn) {
        try {
            this.log(`Running: ${name}`, 'info');
            await testFn();
            this.testResults.push({ name, status: 'PASS' });
            this.log(`✓ ${name}`, 'success');
        } catch (error) {
            this.testResults.push({ name, status: 'FAIL', error: error.message });
            this.errors.push({ test: name, error: error.message });
            this.log(`✗ ${name}: ${error.message}`, 'error');
        }
    }
    
    async testFileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
    
    async runTests() {
        this.log('Starting Claude Flow 2.0 Uninstaller Test Suite', 'info');
        console.log('='.repeat(60));
        
        // Test 1: Core uninstaller file exists
        await this.test('Core uninstaller exists', async () => {
            const exists = await this.testFileExists(path.join(this.projectRoot, 'claude-flow-uninstaller.js'));
            if (!exists) throw new Error('claude-flow-uninstaller.js not found');
        });
        
        // Test 2: Shell script exists and is executable
        await this.test('Shell script exists and executable', async () => {
            const scriptPath = path.join(this.projectRoot, 'claude-flow-clean-uninstall.sh');
            const exists = await this.testFileExists(scriptPath);
            if (!exists) throw new Error('claude-flow-clean-uninstall.sh not found');
            
            const stats = await fs.stat(scriptPath);
            if (!(stats.mode & parseInt('111', 8))) {
                throw new Error('Shell script is not executable');
            }
        });
        
        // Test 3: PowerShell script exists
        await this.test('PowerShell script exists', async () => {
            const exists = await this.testFileExists(path.join(this.projectRoot, 'claude-flow-clean-uninstall.ps1'));
            if (!exists) throw new Error('claude-flow-clean-uninstall.ps1 not found');
        });
        
        // Test 4: Documentation exists
        await this.test('Documentation exists', async () => {
            const exists = await this.testFileExists(path.join(this.projectRoot, 'UNINSTALL.md'));
            if (!exists) throw new Error('UNINSTALL.md not found');
        });
        
        // Test 5: Uninstaller can load without errors
        await this.test('Uninstaller module loads', async () => {
            try {
                const UninstallerClass = require('./claude-flow-uninstaller.js');
                if (typeof UninstallerClass !== 'function') {
                    throw new Error('Uninstaller is not a valid class');
                }
            } catch (error) {
                throw new Error(`Failed to load uninstaller: ${error.message}`);
            }
        });\n        \n        // Test 6: Help command works\n        await this.test('Help command works', async () => {\n            try {\n                execSync('node claude-flow-uninstaller.js --help', { stdio: 'pipe' });\n            } catch (error) {\n                throw new Error(`Help command failed: ${error.message}`);\n            }\n        });\n        \n        // Test 7: Dry run works\n        await this.test('Dry run mode works', async () => {\n            try {\n                const output = execSync('node claude-flow-uninstaller.js --dry-run', { \n                    stdio: 'pipe', \n                    encoding: 'utf8',\n                    timeout: 30000\n                });\n                \n                if (!output.includes('DRY RUN MODE')) {\n                    throw new Error('Dry run mode not detected in output');\n                }\n                \n                if (!output.includes('UNINSTALL SUMMARY')) {\n                    throw new Error('Summary not generated in dry run');\n                }\n            } catch (error) {\n                if (error.code === 'ETIMEDOUT') {\n                    throw new Error('Dry run timed out (>30s)');\n                }\n                throw new Error(`Dry run failed: ${error.message}`);\n            }\n        });\n        \n        // Test 8: Shell script help works\n        await this.test('Shell script help works', async () => {\n            try {\n                const output = execSync('bash claude-flow-clean-uninstall.sh --help', { \n                    stdio: 'pipe', \n                    encoding: 'utf8' \n                });\n                \n                if (!output.includes('Claude Flow 2.0 Clean Uninstaller')) {\n                    throw new Error('Help output not correct');\n                }\n            } catch (error) {\n                throw new Error(`Shell script help failed: ${error.message}`);\n            }\n        });\n        \n        // Test 9: Component scanning works\n        await this.test('Component scanning works', async () => {\n            const UninstallerClass = require('./claude-flow-uninstaller.js');\n            const uninstaller = new UninstallerClass({ dryRun: true, backup: false, verbose: false });\n            \n            const components = await uninstaller.scanComponents();\n            \n            if (!components || typeof components !== 'object') {\n                throw new Error('Component scanning returned invalid result');\n            }\n            \n            if (!Array.isArray(components.directories) || !Array.isArray(components.files)) {\n                throw new Error('Component scanning missing required arrays');\n            }\n        });\n        \n        // Test 10: Backup system initializes\n        await this.test('Backup system initializes', async () => {\n            const UninstallerClass = require('./claude-flow-uninstaller.js');\n            const uninstaller = new UninstallerClass({ dryRun: true, backup: true, verbose: false });\n            \n            // Test that backup directory path is generated\n            if (!uninstaller.backupDir || typeof uninstaller.backupDir !== 'string') {\n                throw new Error('Backup directory not properly initialized');\n            }\n            \n            if (!uninstaller.backupDir.includes('claude-flow-backup-')) {\n                throw new Error('Backup directory name format incorrect');\n            }\n        });\n        \n        // Summary\n        console.log('\\n' + '='.repeat(60));\n        this.log('Test Suite Complete', 'info');\n        console.log('='.repeat(60));\n        \n        const passedTests = this.testResults.filter(r => r.status === 'PASS').length;\n        const failedTests = this.testResults.filter(r => r.status === 'FAIL').length;\n        const totalTests = this.testResults.length;\n        \n        console.log(`Total Tests: ${totalTests}`);\n        console.log(`Passed: ${passedTests}`);\n        console.log(`Failed: ${failedTests}`);\n        \n        if (failedTests === 0) {\n            this.log('🎉 All tests passed! Uninstaller is ready for use.', 'success');\n        } else {\n            this.log(`❌ ${failedTests} test(s) failed. Please review errors above.`, 'error');\n            \n            console.log('\\nFailed Tests:');\n            this.errors.forEach(({ test, error }) => {\n                console.log(`  ❌ ${test}: ${error}`);\n            });\n        }\n        \n        console.log('='.repeat(60));\n        \n        return failedTests === 0;\n    }\n}\n\n// Run tests if called directly\nif (require.main === module) {\n    const tester = new UninstallerTest();\n    tester.runTests()\n        .then(success => process.exit(success ? 0 : 1))\n        .catch(error => {\n            console.error('Test suite failed:', error.message);\n            process.exit(1);\n        });\n}\n\nmodule.exports = UninstallerTest;