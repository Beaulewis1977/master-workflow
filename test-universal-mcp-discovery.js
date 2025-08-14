#!/usr/bin/env node

/**
 * Test Suite for Universal MCP Discovery System v4.0
 * 
 * Comprehensive testing of the universal MCP server discovery system
 * across different project structures and technology stacks
 */

const fs = require('fs');
const path = require('path');
const { UniversalMcpDiscovery } = require('./universal-mcp-discovery');
const { UniversalMcpConfigGenerator } = require('./universal-mcp-config-generator');

class UniversalMcpDiscoveryTest {
    constructor() {
        this.testResults = [];
        this.testProjects = [];
        this.createTestProjects();
    }

    // Create various test project structures
    createTestProjects() {
        const testDir = path.join(__dirname, 'test-projects');
        
        this.testProjects = [
            {
                name: 'react-nextjs-app',
                structure: {
                    'package.json': JSON.stringify({
                        name: 'react-nextjs-app',
                        dependencies: {
                            'react': '^18.2.0',
                            'next': '^13.4.0',
                            'prisma': '^5.1.0',
                            'axios': '^1.4.0'
                        },
                        devDependencies: {
                            'eslint': '^8.44.0',
                            'jest': '^29.6.0',
                            'cypress': '^12.17.0'
                        },
                        scripts: {
                            'dev': 'next dev',
                            'build': 'next build',
                            'test': 'jest'
                        }
                    }, null, 2),
                    'next.config.js': 'module.exports = { reactStrictMode: true };',
                    'prisma/schema.prisma': 'generator client { provider = "prisma-client-js" }',
                    '.env.local': 'DATABASE_URL=postgresql://localhost:5432/mydb',
                    'cypress.config.js': 'module.exports = { e2e: { baseUrl: "http://localhost:3000" } };',
                    'Dockerfile': 'FROM node:18-alpine\nWORKDIR /app\nCOPY . .\nRUN npm install',
                    '.github/workflows/ci.yml': 'name: CI\non: [push, pull_request]'
                },
                expectedServers: ['react', 'nextjs', 'prisma', 'jest', 'cypress', 'docker', 'github'],
                expectedCategories: ['frameworks', 'databases', 'testing', 'cloud', 'devtools']
            },
            
            {
                name: 'python-django-api',
                structure: {
                    'requirements.txt': 'django>=4.2.0\npsycopg2>=2.9.0\ncelery>=5.3.0\nredis>=4.6.0\npytest>=7.4.0',
                    'manage.py': '#!/usr/bin/env python\nfrom django.core.management import execute_from_command_line',
                    'myproject/settings.py': 'DATABASES = { "default": { "ENGINE": "django.db.backends.postgresql" } }',
                    'requirements-dev.txt': 'black>=23.0.0\nflake8>=6.0.0\nmypy>=1.4.0',
                    'pytest.ini': '[tool:pytest]\nDJANGO_SETTINGS_MODULE = myproject.settings',
                    'docker-compose.yml': 'version: "3.8"\nservices:\n  web:\n    build: .',
                    '.gitlab-ci.yml': 'stages:\n  - test\n  - deploy'
                },
                expectedServers: ['django', 'postgres', 'redis', 'pytest', 'celery', 'docker'],
                expectedCategories: ['frameworks', 'databases', 'testing', 'cloud']
            },

            {
                name: 'rust-microservice',
                structure: {
                    'Cargo.toml': '[package]\nname = "microservice"\n[dependencies]\ntokio = "1.0"\nserde = "1.0"',
                    'src/main.rs': 'fn main() { println!("Hello, world!"); }',
                    'Dockerfile': 'FROM rust:1.70\nWORKDIR /app\nCOPY . .\nRUN cargo build --release',
                    'k8s/deployment.yaml': 'apiVersion: apps/v1\nkind: Deployment',
                    'terraform/main.tf': 'provider "aws" { region = "us-east-1" }'
                },
                expectedServers: ['cargo', 'docker', 'kubernetes', 'terraform'],
                expectedCategories: ['languages', 'cloud', 'infrastructure']
            },

            {
                name: 'flutter-mobile-app',
                structure: {
                    'pubspec.yaml': 'name: flutter_app\nflutter:\n  sdk: ">=3.0.0"',
                    'lib/main.dart': 'import "package:flutter/material.dart";',
                    'android/app/build.gradle': 'android { compileSdkVersion 34 }',
                    'ios/Runner.xcodeproj/project.pbxproj': '// iOS project file',
                    'firebase.json': '{ "hosting": { "public": "build/web" } }',
                    '.github/workflows/build.yml': 'name: Build\non: push'
                },
                expectedServers: ['flutter', 'firebase', 'github'],
                expectedCategories: ['frameworks', 'mobile', 'cloud', 'devtools']
            },

            {
                name: 'go-serverless',
                structure: {
                    'go.mod': 'module serverless-app\ngo 1.21',
                    'main.go': 'package main\nfunc main() {}',
                    'serverless.yml': 'service: go-serverless\nprovider:\n  name: aws',
                    'Makefile': 'build:\n\tgo build -o main main.go'
                },
                expectedServers: ['go', 'aws', 'serverless'],
                expectedCategories: ['languages', 'cloud']
            },

            {
                name: 'ai-ml-project',
                structure: {
                    'requirements.txt': 'torch>=2.0.0\ntransformers>=4.30.0\nlangchain>=0.0.250\nopenai>=0.27.0\npinecone-client>=2.2.0',
                    'pyproject.toml': '[tool.poetry]\nname = "ai-project"',
                    'notebooks/experiment.ipynb': '{"cells": []}',
                    'src/model.py': 'import torch\nimport transformers',
                    'docker-compose.gpu.yml': 'services:\n  gpu-service:\n    deploy:\n      resources:\n        reservations:\n          devices:\n            - capabilities: [gpu]'
                },
                expectedServers: ['pytorch', 'transformers', 'langchain', 'openai', 'pinecone'],
                expectedCategories: ['ai', 'languages']
            }
        ];
    }

    async runAllTests() {
        console.log('🧪 Universal MCP Discovery Test Suite v4.0');
        console.log('🔍 Testing discovery across multiple project types...\n');

        for (const project of this.testProjects) {
            console.log(`📋 Testing project: ${project.name}`);
            const result = await this.testProject(project);
            this.testResults.push(result);
            
            if (result.passed) {
                console.log(`✅ ${project.name}: PASSED`);
            } else {
                console.log(`❌ ${project.name}: FAILED`);
                console.log(`   Issues: ${result.issues.join(', ')}`);
            }
            console.log('');
        }

        this.displaySummary();
        return this.generateTestReport();
    }

    async testProject(project) {
        const testDir = await this.createTestProjectStructure(project);
        const result = {
            name: project.name,
            passed: false,
            issues: [],
            discoveredServers: [],
            discoveredCategories: [],
            performance: {},
            timestamp: new Date().toISOString()
        };

        try {
            // Run discovery
            const startTime = Date.now();
            const discovery = new UniversalMcpDiscovery(testDir);
            const results = await discovery.discover();
            const endTime = Date.now();

            result.performance.discoveryTime = endTime - startTime;
            result.discoveredServers = results.servers.map(s => s.name);
            result.discoveredCategories = [...new Set(results.servers.map(s => s.category))];

            // Validate expected servers are found
            const missingServers = project.expectedServers.filter(expected => 
                !result.discoveredServers.some(discovered => discovered.includes(expected))
            );

            const missingCategories = project.expectedCategories.filter(expected => 
                !result.discoveredCategories.some(discovered => discovered.includes(expected))
            );

            if (missingServers.length > 0) {
                result.issues.push(`Missing expected servers: ${missingServers.join(', ')}`);
            }

            if (missingCategories.length > 0) {
                result.issues.push(`Missing expected categories: ${missingCategories.join(', ')}`);
            }

            // Test configuration generation
            try {
                const generator = new UniversalMcpConfigGenerator(results);
                const configStartTime = Date.now();
                await generator.generateAllConfigurations(testDir);
                result.performance.configTime = Date.now() - configStartTime;
            } catch (configError) {
                result.issues.push(`Configuration generation failed: ${configError.message}`);
            }

            // Performance checks
            if (result.performance.discoveryTime > 10000) {
                result.issues.push('Discovery took longer than 10 seconds');
            }

            if (results.servers.length === 0) {
                result.issues.push('No servers discovered');
            }

            result.passed = result.issues.length === 0;
            result.serversFound = results.servers.length;
            result.enabledServers = results.servers.filter(s => s.enabled).length;
            result.averageConfidence = Math.round(
                results.recommendations.reduce((sum, r) => sum + r.confidence, 0) / results.recommendations.length
            );

        } catch (error) {
            result.issues.push(`Discovery failed: ${error.message}`);
        } finally {
            // Cleanup test directory
            await this.cleanupTestDirectory(testDir);
        }

        return result;
    }

    async createTestProjectStructure(project) {
        const testDir = path.join(__dirname, 'test-tmp', project.name);
        await fs.promises.mkdir(testDir, { recursive: true });

        for (const [filePath, content] of Object.entries(project.structure)) {
            const fullPath = path.join(testDir, filePath);
            const dir = path.dirname(fullPath);
            
            await fs.promises.mkdir(dir, { recursive: true });
            await fs.promises.writeFile(fullPath, content);
        }

        return testDir;
    }

    async cleanupTestDirectory(testDir) {
        try {
            await fs.promises.rm(testDir, { recursive: true, force: true });
        } catch (error) {
            console.warn(`Failed to cleanup test directory ${testDir}: ${error.message}`);
        }
    }

    displaySummary() {
        const passed = this.testResults.filter(r => r.passed).length;
        const total = this.testResults.length;
        const avgDiscoveryTime = Math.round(
            this.testResults.reduce((sum, r) => sum + (r.performance.discoveryTime || 0), 0) / total
        );
        const avgServersFound = Math.round(
            this.testResults.reduce((sum, r) => sum + (r.serversFound || 0), 0) / total
        );

        console.log('📊 Test Summary');
        console.log('================');
        console.log(`Tests Passed: ${passed}/${total} (${Math.round(passed/total*100)}%)`);
        console.log(`Average Discovery Time: ${avgDiscoveryTime}ms`);
        console.log(`Average Servers Found: ${avgServersFound}`);
        console.log('');

        // Show failed tests
        const failed = this.testResults.filter(r => !r.passed);
        if (failed.length > 0) {
            console.log('❌ Failed Tests:');
            for (const result of failed) {
                console.log(`   • ${result.name}: ${result.issues.join(', ')}`);
            }
            console.log('');
        }

        // Show performance metrics
        console.log('⚡ Performance Metrics:');
        for (const result of this.testResults) {
            console.log(`   • ${result.name}: ${result.performance.discoveryTime}ms (${result.serversFound} servers)`);
        }
    }

    generateTestReport() {
        const report = {
            testSuite: 'Universal MCP Discovery Test Suite v4.0',
            timestamp: new Date().toISOString(),
            summary: {
                totalTests: this.testResults.length,
                passed: this.testResults.filter(r => r.passed).length,
                failed: this.testResults.filter(r => !r.passed).length,
                passRate: Math.round(this.testResults.filter(r => r.passed).length / this.testResults.length * 100),
                avgDiscoveryTime: Math.round(
                    this.testResults.reduce((sum, r) => sum + (r.performance.discoveryTime || 0), 0) / this.testResults.length
                ),
                avgServersFound: Math.round(
                    this.testResults.reduce((sum, r) => sum + (r.serversFound || 0), 0) / this.testResults.length
                ),
                avgConfidence: Math.round(
                    this.testResults.reduce((sum, r) => sum + (r.averageConfidence || 0), 0) / this.testResults.length
                )
            },
            results: this.testResults,
            recommendations: this.generateRecommendations()
        };

        return report;
    }

    generateRecommendations() {
        const recommendations = [];
        const failed = this.testResults.filter(r => !r.passed);
        
        if (failed.length > 0) {
            recommendations.push('Fix failing test cases to improve discovery accuracy');
        }

        const slowTests = this.testResults.filter(r => (r.performance.discoveryTime || 0) > 5000);
        if (slowTests.length > 0) {
            recommendations.push('Optimize discovery performance for large projects');
        }

        const lowConfidenceTests = this.testResults.filter(r => (r.averageConfidence || 0) < 70);
        if (lowConfidenceTests.length > 0) {
            recommendations.push('Improve confidence scoring for better recommendations');
        }

        if (recommendations.length === 0) {
            recommendations.push('All tests passed! Universal MCP Discovery is working correctly');
        }

        return recommendations;
    }

    // Specific test methods for edge cases

    async testEdgeCases() {
        console.log('🔬 Testing Edge Cases...');

        const edgeCases = [
            {
                name: 'empty-project',
                structure: {},
                shouldNotFail: true
            },
            {
                name: 'invalid-package-json',
                structure: {
                    'package.json': 'invalid json {'
                },
                shouldNotFail: true
            },
            {
                name: 'very-large-project',
                structure: this.generateLargeProjectStructure(),
                performanceTest: true,
                maxTime: 30000
            },
            {
                name: 'deep-nested-project',
                structure: this.generateDeepNestedStructure(),
                performanceTest: true,
                maxTime: 15000
            }
        ];

        for (const testCase of edgeCases) {
            console.log(`   Testing: ${testCase.name}`);
            const result = await this.testEdgeCase(testCase);
            console.log(`   ${result.passed ? '✅' : '❌'} ${testCase.name}: ${result.passed ? 'PASSED' : 'FAILED'}`);
            
            if (!result.passed) {
                console.log(`      Issues: ${result.issues.join(', ')}`);
            }
        }
    }

    async testEdgeCase(testCase) {
        const testDir = await this.createTestProjectStructure(testCase);
        const result = {
            name: testCase.name,
            passed: false,
            issues: [],
            timestamp: new Date().toISOString()
        };

        try {
            const startTime = Date.now();
            const discovery = new UniversalMcpDiscovery(testDir);
            const results = await discovery.discover();
            const endTime = Date.now();
            const executionTime = endTime - startTime;

            if (testCase.performanceTest && executionTime > testCase.maxTime) {
                result.issues.push(`Execution time ${executionTime}ms exceeded limit ${testCase.maxTime}ms`);
            }

            result.passed = result.issues.length === 0;

        } catch (error) {
            if (testCase.shouldNotFail) {
                result.issues.push(`Unexpected error: ${error.message}`);
            } else {
                result.passed = true; // Expected to fail
            }
        } finally {
            await this.cleanupTestDirectory(testDir);
        }

        return result;
    }

    generateLargeProjectStructure() {
        const structure = {};
        
        // Generate many files
        for (let i = 0; i < 1000; i++) {
            structure[`src/component${i}.js`] = `export default function Component${i}() { return null; }`;
        }
        
        // Add various config files
        structure['package.json'] = JSON.stringify({
            name: 'large-project',
            dependencies: Object.fromEntries(
                Array.from({length: 100}, (_, i) => [`package${i}`, '^1.0.0'])
            )
        }, null, 2);
        
        return structure;
    }

    generateDeepNestedStructure() {
        const structure = {};
        let currentPath = 'src';
        
        // Create deep nesting (20 levels)
        for (let i = 0; i < 20; i++) {
            currentPath += `/level${i}`;
            structure[`${currentPath}/index.js`] = `export * from './component';`;
            structure[`${currentPath}/component.js`] = `export default function Level${i}() {}`;
        }
        
        structure['package.json'] = JSON.stringify({ name: 'deep-nested' }, null, 2);
        return structure;
    }

    // Cross-platform compatibility tests
    async testCrossPlatformCompatibility() {
        console.log('🖥️  Testing Cross-Platform Compatibility...');
        
        const platforms = ['win32', 'darwin', 'linux'];
        const originalPlatform = process.platform;
        
        for (const platform of platforms) {
            console.log(`   Testing on: ${platform}`);
            
            // Mock platform
            Object.defineProperty(process, 'platform', { value: platform });
            
            try {
                const discovery = new UniversalMcpDiscovery(__dirname);
                const results = await discovery.discover();
                console.log(`   ✅ ${platform}: Discovery successful (${results.servers.length} servers)`);
            } catch (error) {
                console.log(`   ❌ ${platform}: Discovery failed - ${error.message}`);
            }
        }
        
        // Restore original platform
        Object.defineProperty(process, 'platform', { value: originalPlatform });
    }
}

// Run tests if called directly
if (require.main === module) {
    const testSuite = new UniversalMcpDiscoveryTest();
    
    (async () => {
        try {
            // Run main tests
            const report = await testSuite.runAllTests();
            
            // Run edge case tests
            await testSuite.testEdgeCases();
            
            // Run cross-platform tests
            await testSuite.testCrossPlatformCompatibility();
            
            // Save test report
            const reportPath = path.join(__dirname, 'test-results.json');
            await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2));
            
            console.log(`📊 Test report saved to: ${reportPath}`);
            
            // Exit with appropriate code
            process.exit(report.summary.failed > 0 ? 1 : 0);
            
        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
            process.exit(1);
        }
    })();
}

module.exports = { UniversalMcpDiscoveryTest };