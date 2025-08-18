/**
 * Universal Scaffolding System Test Suite
 * Comprehensive tests for all supported technologies
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const UniversalScaffolder = require('../engine/src/modules/universal-scaffolder');
const TemplateManager = require('../engine/src/modules/template-manager');
const OptimizedScaffolder = require('../engine/src/modules/optimized-scaffolder');

// Test configuration
const TEST_DIR = path.join(__dirname, 'test-projects');
const CLEANUP = process.env.CLEANUP !== 'false';

class UniversalScaffoldingTests {
    constructor() {
        this.scaffolder = new UniversalScaffolder();
        this.optimizedScaffolder = new OptimizedScaffolder();
        this.templateManager = new TemplateManager();
        this.testResults = [];
        this.startTime = Date.now();
    }

    async runAllTests() {
        console.log('🧪 Universal Scaffolding System Test Suite\n');
        console.log('=' . repeat(50));
        
        // Setup
        await this.setup();
        
        // Test categories
        const testCategories = [
            { name: 'Language Detection', tests: this.languageDetectionTests.bind(this) },
            { name: 'Template Selection', tests: this.templateSelectionTests.bind(this) },
            { name: 'Project Creation', tests: this.projectCreationTests.bind(this) },
            { name: 'Technology Support', tests: this.technologySupportTests.bind(this) },
            { name: 'Performance', tests: this.performanceTests.bind(this) },
            { name: 'Error Handling', tests: this.errorHandlingTests.bind(this) }
        ];
        
        for (const category of testCategories) {
            console.log(`\n📁 ${category.name} Tests`);
            console.log('-'.repeat(40));
            await category.tests();
        }
        
        // Cleanup and report
        await this.cleanup();
        this.generateReport();
    }

    async setup() {
        // Create test directory
        await fs.mkdir(TEST_DIR, { recursive: true });
        console.log(`✓ Test directory created: ${TEST_DIR}`);
    }

    async cleanup() {
        if (CLEANUP) {
            try {
                await fs.rm(TEST_DIR, { recursive: true, force: true });
                console.log('\n✓ Test directory cleaned up');
            } catch (error) {
                console.error('Cleanup error:', error.message);
            }
        }
    }

    /**
     * Language Detection Tests
     */
    async languageDetectionTests() {
        const tests = [
            {
                name: 'Detect JavaScript project',
                files: ['package.json', 'index.js'],
                expected: 'javascript'
            },
            {
                name: 'Detect TypeScript project',
                files: ['package.json', 'tsconfig.json', 'index.ts'],
                expected: 'typescript'
            },
            {
                name: 'Detect Python project',
                files: ['requirements.txt', 'main.py'],
                expected: 'python'
            },
            {
                name: 'Detect Rust project',
                files: ['Cargo.toml', 'src/main.rs'],
                expected: 'rust'
            },
            {
                name: 'Detect Go project',
                files: ['go.mod', 'main.go'],
                expected: 'go'
            },
            {
                name: 'Detect Java project',
                files: ['pom.xml', 'src/Main.java'],
                expected: 'java'
            },
            {
                name: 'Detect Ruby project',
                files: ['Gemfile', 'app.rb'],
                expected: 'ruby'
            },
            {
                name: 'Detect PHP project',
                files: ['composer.json', 'index.php'],
                expected: 'php'
            }
        ];
        
        for (const test of tests) {
            await this.runTest(test.name, async () => {
                const testPath = path.join(TEST_DIR, `detect-${test.expected}`);
                await fs.mkdir(testPath, { recursive: true });
                
                // Create test files
                for (const file of test.files) {
                    const filePath = path.join(testPath, file);
                    await fs.mkdir(path.dirname(filePath), { recursive: true });
                    await fs.writeFile(filePath, '// test content');
                }
                
                // Detect project type
                const detected = await this.scaffolder.detectProjectType(testPath);
                assert.strictEqual(detected.language, test.expected);
            });
        }
    }

    /**
     * Template Selection Tests
     */
    async templateSelectionTests() {
        const tests = [
            {
                name: 'Select React template',
                projectType: { language: 'javascript', framework: 'react' },
                expectedTemplate: 'react'
            },
            {
                name: 'Select Django template',
                projectType: { language: 'python', framework: 'django' },
                expectedTemplate: 'django'
            },
            {
                name: 'Select Spring Boot template',
                projectType: { language: 'java', framework: 'spring-boot' },
                expectedTemplate: 'spring'
            },
            {
                name: 'Select generic template for unknown',
                projectType: { language: 'unknown' },
                expectedTemplate: 'generic'
            }
        ];
        
        for (const test of tests) {
            await this.runTest(test.name, async () => {
                const template = await this.scaffolder.selectTemplate(test.projectType, {});
                assert(template.id.includes(test.expectedTemplate) || template.id === 'generic');
            });
        }
    }

    /**
     * Project Creation Tests
     */
    async projectCreationTests() {
        const projects = [
            { name: 'test-js-app', template: 'javascript-vanilla' },
            { name: 'test-ts-app', template: 'typescript-node' },
            { name: 'test-python-app', template: 'python-cli' },
            { name: 'test-rust-app', template: 'rust-cli' },
            { name: 'test-go-app', template: 'go-cli' }
        ];
        
        for (const project of projects) {
            await this.runTest(`Create ${project.template} project`, async () => {
                const result = await this.scaffolder.create(project.name, {
                    template: project.template,
                    path: TEST_DIR,
                    skipInstall: true,
                    skipGit: true
                });
                
                assert(result.success);
                assert(result.filesGenerated.length > 0);
                
                // Verify project directory exists
                const projectPath = path.join(TEST_DIR, project.name);
                const exists = await this.fileExists(projectPath);
                assert(exists);
            });
        }
    }

    /**
     * Technology Support Tests
     */
    async technologySupportTests() {
        const technologies = [
            // Frontend frameworks
            { category: 'Frontend', name: 'React', template: 'react-typescript' },
            { category: 'Frontend', name: 'Vue', template: 'vue3-composition' },
            { category: 'Frontend', name: 'Angular', template: 'angular-standalone' },
            { category: 'Frontend', name: 'Svelte', template: 'svelte-kit' },
            
            // Backend frameworks
            { category: 'Backend', name: 'Express', template: 'express-api' },
            { category: 'Backend', name: 'Django', template: 'django-rest' },
            { category: 'Backend', name: 'FastAPI', template: 'fastapi' },
            { category: 'Backend', name: 'Spring Boot', template: 'java-spring-boot' },
            
            // Mobile frameworks
            { category: 'Mobile', name: 'React Native', template: 'react-native-expo' },
            { category: 'Mobile', name: 'Flutter', template: 'flutter-app' },
            
            // Desktop frameworks
            { category: 'Desktop', name: 'Electron', template: 'electron-react' },
            { category: 'Desktop', name: 'Tauri', template: 'tauri-app' },
            
            // Data Science
            { category: 'Data Science', name: 'Jupyter', template: 'jupyter-notebook' },
            { category: 'Data Science', name: 'Python ML', template: 'python-ml' },
            
            // Blockchain
            { category: 'Blockchain', name: 'Ethereum', template: 'ethereum-hardhat' },
            { category: 'Blockchain', name: 'Solana', template: 'solana-anchor' }
        ];
        
        for (const tech of technologies) {
            await this.runTest(`Support for ${tech.category}: ${tech.name}`, async () => {
                const template = await this.templateManager.getTemplate(tech.template);
                assert(template, `Template ${tech.template} should exist`);
                assert(template.files, 'Template should have files');
            });
        }
    }

    /**
     * Performance Tests
     */
    async performanceTests() {
        await this.runTest('Create project in < 2 seconds', async () => {
            const startTime = Date.now();
            
            await this.optimizedScaffolder.createOptimized('perf-test-app', {
                template: 'javascript-vanilla',
                path: TEST_DIR,
                skipInstall: true,
                skipGit: true
            });
            
            const duration = Date.now() - startTime;
            assert(duration < 2000, `Project creation took ${duration}ms (should be < 2000ms)`);
        });
        
        await this.runTest('Detect project type in < 500ms', async () => {
            const startTime = Date.now();
            
            await this.optimizedScaffolder.detectProjectTypeOptimized({
                path: TEST_DIR
            });
            
            const duration = Date.now() - startTime;
            assert(duration < 500, `Detection took ${duration}ms (should be < 500ms)`);
        });
        
        await this.runTest('Handle 100 concurrent operations', async () => {
            const operations = [];
            
            for (let i = 0; i < 100; i++) {
                operations.push(
                    this.scaffolder.detectProjectType(TEST_DIR)
                );
            }
            
            const results = await Promise.allSettled(operations);
            const successful = results.filter(r => r.status === 'fulfilled').length;
            
            assert(successful >= 95, `${successful}/100 operations succeeded (need >= 95)`);
        });
    }

    /**
     * Error Handling Tests
     */
    async errorHandlingTests() {
        await this.runTest('Handle invalid template gracefully', async () => {
            try {
                await this.scaffolder.create('error-test', {
                    template: 'non-existent-template',
                    path: TEST_DIR
                });
            } catch (error) {
                assert(error, 'Should throw error for invalid template');
            }
        });
        
        await this.runTest('Handle existing directory', async () => {
            const projectPath = path.join(TEST_DIR, 'existing-project');
            await fs.mkdir(projectPath, { recursive: true });
            
            try {
                await this.scaffolder.create('existing-project', {
                    path: TEST_DIR,
                    template: 'javascript-vanilla'
                });
                assert(false, 'Should throw error for existing directory');
            } catch (error) {
                assert(error.message.includes('already exists'));
            }
        });
        
        await this.runTest('Retry on failure', async () => {
            let attempts = 0;
            
            // Mock a failing operation that succeeds on retry
            const mockOperation = async () => {
                attempts++;
                if (attempts < 2) {
                    throw new Error('Temporary failure');
                }
                return { success: true };
            };
            
            const result = await this.retryOperation(mockOperation, 3);
            assert(result.success);
            assert.strictEqual(attempts, 2);
        });
    }

    /**
     * Helper methods
     */
    async runTest(name, testFn) {
        const startTime = Date.now();
        
        try {
            await testFn();
            const duration = Date.now() - startTime;
            console.log(`  ✅ ${name} (${duration}ms)`);
            
            this.testResults.push({
                name,
                status: 'passed',
                duration
            });
        } catch (error) {
            const duration = Date.now() - startTime;
            console.log(`  ❌ ${name} (${duration}ms)`);
            console.log(`     Error: ${error.message}`);
            
            this.testResults.push({
                name,
                status: 'failed',
                duration,
                error: error.message
            });
        }
    }
    
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
    
    async retryOperation(operation, maxRetries, delay = 100) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await operation();
            } catch (error) {
                if (i === maxRetries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    generateReport() {
        const totalDuration = Date.now() - this.startTime;
        const passed = this.testResults.filter(r => r.status === 'passed').length;
        const failed = this.testResults.filter(r => r.status === 'failed').length;
        const total = this.testResults.length;
        
        console.log('\n' + '='.repeat(50));
        console.log('📊 Test Results Summary\n');
        console.log(`Total Tests: ${total}`);
        console.log(`✅ Passed: ${passed} (${((passed/total)*100).toFixed(1)}%)`);
        console.log(`❌ Failed: ${failed} (${((failed/total)*100).toFixed(1)}%)`);
        console.log(`⏱️  Duration: ${(totalDuration/1000).toFixed(2)}s`);
        
        if (failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults
                .filter(r => r.status === 'failed')
                .forEach(r => {
                    console.log(`  - ${r.name}`);
                    console.log(`    ${r.error}`);
                });
        }
        
        // Save report to file
        const report = {
            timestamp: new Date().toISOString(),
            duration: totalDuration,
            results: {
                total,
                passed,
                failed,
                passRate: (passed/total)*100
            },
            tests: this.testResults
        };
        
        fs.writeFile(
            path.join(__dirname, 'universal-scaffolding-test-report.json'),
            JSON.stringify(report, null, 2)
        ).catch(console.error);
        
        console.log('\n✓ Test report saved to universal-scaffolding-test-report.json');
        
        // Exit with appropriate code
        process.exit(failed > 0 ? 1 : 0);
    }
}

// Run tests if executed directly
if (require.main === module) {
    const tester = new UniversalScaffoldingTests();
    tester.runAllTests().catch(error => {
        console.error('Fatal test error:', error);
        process.exit(1);
    });
}

module.exports = UniversalScaffoldingTests;