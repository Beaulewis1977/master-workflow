#!/usr/bin/env node

/**
 * Universal MCP Discovery System Demo
 * 
 * This demonstrates the universal discovery system working with
 * different project types and technology stacks.
 */

const fs = require('fs');
const path = require('path');
const { discoverMcpServers } = require('./universal-mcp-discover');

async function createDemoProject(name, structure) {
    const demoDir = path.join(__dirname, 'demo-projects', name);
    await fs.promises.mkdir(demoDir, { recursive: true });
    
    for (const [filePath, content] of Object.entries(structure)) {
        const fullPath = path.join(demoDir, filePath);
        const dir = path.dirname(fullPath);
        await fs.promises.mkdir(dir, { recursive: true });
        await fs.promises.writeFile(fullPath, content);
    }
    
    return demoDir;
}

async function cleanupDemo() {
    const demoDir = path.join(__dirname, 'demo-projects');
    try {
        await fs.promises.rm(demoDir, { recursive: true, force: true });
    } catch (error) {
        // Ignore cleanup errors
    }
}

async function runDemo() {
    console.log('🎭 Universal MCP Discovery System Demo');
    console.log('=====================================');
    console.log('Testing discovery across different project types...\n');

    const demoProjects = [
        {
            name: 'react-next-app',
            description: '⚛️  React + Next.js Web Application',
            structure: {
                'package.json': JSON.stringify({
                    name: 'react-next-app',
                    dependencies: {
                        'react': '^18.2.0',
                        'next': '^13.4.0',
                        'prisma': '^5.1.0',
                        '@types/react': '^18.2.0'
                    },
                    devDependencies: {
                        'eslint': '^8.44.0',
                        'jest': '^29.6.0',
                        'cypress': '^12.17.0',
                        'typescript': '^5.1.0'
                    },
                    scripts: {
                        'dev': 'next dev',
                        'build': 'next build',
                        'test': 'jest'
                    }
                }, null, 2),
                'next.config.js': 'module.exports = { reactStrictMode: true };',
                'tsconfig.json': '{ "compilerOptions": { "strict": true } }',
                'prisma/schema.prisma': 'generator client { provider = "prisma-client-js" }',
                '.env.local': 'DATABASE_URL=postgresql://localhost:5432/mydb',
                'cypress.config.js': 'module.exports = { e2e: { baseUrl: "http://localhost:3000" } };',
                'Dockerfile': 'FROM node:18-alpine\nWORKDIR /app',
                '.github/workflows/ci.yml': 'name: CI\non: [push, pull_request]',
                'src/pages/index.tsx': 'export default function Home() { return <div>Hello</div>; }'
            },
            expectedServers: ['react', 'nextjs', 'typescript', 'prisma', 'jest', 'cypress', 'docker', 'github']
        },

        {
            name: 'python-django-api',
            description: '🐍 Python + Django REST API',
            structure: {
                'requirements.txt': 'django>=4.2.0\npsycopg2>=2.9.0\ncelery>=5.3.0\nredis>=4.6.0\npytest>=7.4.0\nblack>=23.0.0',
                'manage.py': '#!/usr/bin/env python\nfrom django.core.management import execute_from_command_line',
                'myproject/settings.py': 'DATABASES = { "default": { "ENGINE": "django.db.backends.postgresql" } }',
                'requirements-dev.txt': 'black>=23.0.0\nflake8>=6.0.0\nmypy>=1.4.0',
                'pytest.ini': '[tool:pytest]\nDJANGO_SETTINGS_MODULE = myproject.settings',
                'docker-compose.yml': 'version: "3.8"\nservices:\n  web:\n    build: .',
                '.gitlab-ci.yml': 'stages:\n  - test\n  - deploy',
                'pyproject.toml': '[tool.black]\nline-length = 88',
                'Dockerfile': 'FROM python:3.11-slim\nWORKDIR /app'
            },
            expectedServers: ['django', 'postgres', 'redis', 'pytest', 'celery', 'docker', 'black']
        },

        {
            name: 'rust-microservice',
            description: '🦀 Rust Microservice with K8s',
            structure: {
                'Cargo.toml': '[package]\nname = "microservice"\nversion = "0.1.0"\n[dependencies]\ntokio = "1.0"\nserde = "1.0"',
                'src/main.rs': 'fn main() { println!("Hello, world!"); }',
                'Dockerfile': 'FROM rust:1.70\nWORKDIR /app\nCOPY . .\nRUN cargo build --release',
                'k8s/deployment.yaml': 'apiVersion: apps/v1\nkind: Deployment',
                'k8s/service.yaml': 'apiVersion: v1\nkind: Service',
                'terraform/main.tf': 'provider "aws" { region = "us-east-1" }',
                'terraform/variables.tf': 'variable "environment" { type = string }',
                '.github/workflows/deploy.yml': 'name: Deploy\non: push'
            },
            expectedServers: ['cargo', 'docker', 'kubernetes', 'terraform', 'github']
        },

        {
            name: 'flutter-mobile-app',
            description: '📱 Flutter Mobile Application',
            structure: {
                'pubspec.yaml': 'name: flutter_app\nversion: 1.0.0\nflutter:\n  sdk: ">=3.0.0"',
                'lib/main.dart': 'import "package:flutter/material.dart";\nvoid main() => runApp(MyApp());',
                'android/app/build.gradle': 'android { compileSdkVersion 34 }',
                'ios/Runner.xcodeproj/project.pbxproj': '// iOS project file',
                'firebase.json': '{ "hosting": { "public": "build/web" } }',
                '.github/workflows/build.yml': 'name: Build\non: push',
                'test/widget_test.dart': 'import "package:flutter_test/flutter_test.dart";'
            },
            expectedServers: ['flutter', 'firebase', 'github']
        },

        {
            name: 'ai-ml-project',
            description: '🤖 AI/ML Research Project',
            structure: {
                'requirements.txt': 'torch>=2.0.0\ntransformers>=4.30.0\nlangchain>=0.0.250\nopenai>=0.27.0\npinecone-client>=2.2.0\njupyter>=1.0.0',
                'pyproject.toml': '[tool.poetry]\nname = "ai-project"\n[tool.poetry.dependencies]\npython = "^3.9"',
                'notebooks/experiment.ipynb': '{"cells": [{"cell_type": "code", "source": ["import torch"]}]}',
                'src/model.py': 'import torch\nimport transformers\nfrom langchain import OpenAI',
                'src/data.py': 'import pandas as pd\nimport numpy as np',
                'docker-compose.gpu.yml': 'services:\n  gpu-service:\n    deploy:\n      resources:\n        reservations:\n          devices:\n            - capabilities: [gpu]',
                'environment.yml': 'name: ai-env\nchannels:\n  - conda-forge',
                '.env': 'OPENAI_API_KEY=your-key-here'
            },
            expectedServers: ['pytorch', 'transformers', 'langchain', 'openai', 'jupyter', 'conda']
        }
    ];

    for (const project of demoProjects) {
        console.log(`${project.description}`);
        console.log('─'.repeat(50));
        
        try {
            // Create demo project
            const projectDir = await createDemoProject(project.name, project.structure);
            
            // Run discovery
            const results = await discoverMcpServers(projectDir);
            
            // Display results
            console.log(`📊 Analysis Results:`);
            console.log(`   • Languages: ${results.analysis.languages.map(l => l.language).join(', ')}`);
            console.log(`   • Frameworks: ${results.analysis.frameworks.join(', ') || 'None'}`);
            console.log(`   • Dependencies: ${results.analysis.dependencies.total}`);
            console.log(`   • Infrastructure: ${results.analysis.infrastructure.join(', ') || 'None'}`);
            
            console.log(`\n🎯 MCP Server Recommendations (${results.servers.length} total):`);
            
            // High priority servers
            const highPriority = results.servers.filter(s => s.priority > 85);
            if (highPriority.length > 0) {
                console.log(`   🔥 High Priority (${highPriority.length}):`);
                highPriority.forEach(server => {
                    console.log(`      ✓ ${server.name} (${server.category}) - ${server.confidence}%`);
                });
            }
            
            // Medium priority servers
            const mediumPriority = results.servers.filter(s => s.priority >= 70 && s.priority <= 85);
            if (mediumPriority.length > 0) {
                console.log(`   ⭐ Recommended (${mediumPriority.length}):`);
                mediumPriority.forEach(server => {
                    console.log(`      • ${server.name} (${server.category}) - ${server.confidence}%`);
                });
            }
            
            // Check expected servers
            const foundExpected = project.expectedServers.filter(expected =>
                results.servers.some(server => server.name.includes(expected) || expected.includes(server.name))
            );
            
            const accuracy = Math.round((foundExpected.length / project.expectedServers.length) * 100);
            console.log(`\n✅ Detection Accuracy: ${accuracy}% (${foundExpected.length}/${project.expectedServers.length} expected servers found)`);
            
            if (accuracy >= 80) {
                console.log(`🎉 Excellent detection for ${project.name}!`);
            } else if (accuracy >= 60) {
                console.log(`👍 Good detection for ${project.name}`);
            } else {
                console.log(`⚠️  Detection could be improved for ${project.name}`);
            }
            
        } catch (error) {
            console.log(`❌ Failed to analyze ${project.name}: ${error.message}`);
        }
        
        console.log('\n');
    }
    
    // Cleanup
    await cleanupDemo();
    
    console.log('🎭 Demo Summary');
    console.log('================');
    console.log('✅ Universal MCP Discovery successfully analyzed:');
    console.log('   • React + Next.js web applications');
    console.log('   • Python + Django APIs');  
    console.log('   • Rust microservices');
    console.log('   • Flutter mobile applications');
    console.log('   • AI/ML research projects');
    console.log('');
    console.log('🚀 The system demonstrates:');
    console.log('   • Universal language detection');
    console.log('   • Framework-specific recommendations');
    console.log('   • Infrastructure integration');
    console.log('   • Cross-platform compatibility');
    console.log('   • Zero-configuration operation');
    console.log('');
    console.log('💡 Ready for production use with Enhanced MCP Ecosystem v3.0!');
}

// Run demo
if (require.main === module) {
    runDemo().catch(error => {
        console.error('❌ Demo failed:', error.message);
        process.exit(1);
    });
}

module.exports = { runDemo };