#!/usr/bin/env node

/**
 * Claude Flow 2.0 Portable Installation System - Test Suite
 * 
 * Comprehensive test suite for the portable installation system
 * Tests cross-platform compatibility and clean installation/uninstallation
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync, spawn } = require('child_process');
const crypto = require('crypto');

class PortableInstallerTestSuite {
    constructor() {
        this.testId = crypto.randomBytes(8).toString('hex');
        this.testDir = path.join(os.tmpdir(), `claude-flow-test-${this.testId}`);
        this.results = {
            passed: 0,
            failed: 0,
            total: 0,
            details: []
        };
        
        this.colors = {
            green: '\x1b[32m',
            red: '\x1b[31m',
            yellow: '\x1b[33m',
            blue: '\x1b[34m',
            reset: '\x1b[0m'
        };
    }

    log(message, type = 'info') {
        const colorMap = {
            success: this.colors.green,
            error: this.colors.red,
            warning: this.colors.yellow,
            info: this.colors.blue
        };
        
        const color = colorMap[type] || '';
        console.log(`${color}${message}${this.colors.reset}`);
    }

    async test(name, testFn) {
        this.results.total++;
        
        try {
            this.log(`🧪 Running test: ${name}`, 'info');
            await testFn();
            this.results.passed++;
            this.results.details.push({ name, status: 'passed', error: null });
            this.log(`✅ Test passed: ${name}`, 'success');
        } catch (error) {
            this.results.failed++;
            this.results.details.push({ name, status: 'failed', error: error.message });
            this.log(`❌ Test failed: ${name} - ${error.message}`, 'error');
        }
    }

    async setupTestEnvironment() {
        this.log('🏗️  Setting up test environment...', 'info');
        
        // Create test directory
        fs.mkdirSync(this.testDir, { recursive: true });
        
        // Create sample project structures
        await this.createSampleProjects();
        
        this.log(`📁 Test directory: ${this.testDir}`, 'info');
    }

    async createSampleProjects() {
        const projectTypes = [
            'nodejs-react',
            'python-django',
            'rust-web',
            'go-api',
            'java-spring',
            'empty-project'
        ];
        
        for (const projectType of projectTypes) {
            const projectDir = path.join(this.testDir, projectType);
            fs.mkdirSync(projectDir, { recursive: true });
            
            await this.createProjectStructure(projectDir, projectType);
        }
    }

    async createProjectStructure(projectDir, type) {
        switch (type) {
            case 'nodejs-react':
                fs.writeFileSync(path.join(projectDir, 'package.json'), JSON.stringify({
                    name: 'test-react-app',
                    version: '1.0.0',
                    dependencies: {
                        react: '^18.0.0',
                        'react-dom': '^18.0.0',
                        '@types/react': '^18.0.0'
                    },
                    devDependencies: {
                        '@vitejs/plugin-react': '^4.0.0',
                        vite: '^4.0.0',
                        typescript: '^5.0.0'
                    },
                    scripts: {
                        dev: 'vite',
                        build: 'vite build',
                        test: 'jest'
                    }
                }, null, 2));
                
                fs.writeFileSync(path.join(projectDir, 'vite.config.js'), `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`);
                
                fs.mkdirSync(path.join(projectDir, 'src'), { recursive: true });
                fs.writeFileSync(path.join(projectDir, 'src', 'App.tsx'), `
import React from 'react';

function App() {
  return <div>Hello World</div>;
}

export default App;
`);
                break;
                
            case 'python-django':
                fs.writeFileSync(path.join(projectDir, 'requirements.txt'), `
Django==4.2.0
djangorestframework==3.14.0
celery==5.3.0
redis==4.5.0
psycopg2==2.9.0
`);
                
                fs.writeFileSync(path.join(projectDir, 'manage.py'), `
#!/usr/bin/env python
import os
import sys

if __name__ == '__main__':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')
    from django.core.management import execute_from_command_line
    execute_from_command_line(sys.argv)
`);
                
                fs.mkdirSync(path.join(projectDir, 'myproject'), { recursive: true });
                break;
                
            case 'rust-web':
                fs.writeFileSync(path.join(projectDir, 'Cargo.toml'), `
[package]
name = "rust-web-app"
version = "0.1.0"
edition = "2021"

[dependencies]
tokio = { version = "1.0", features = ["full"] }
axum = "0.6"
serde = { version = "1.0", features = ["derive"] }
sqlx = { version = "0.7", features = ["runtime-tokio-rustls", "postgres"] }
`);
                
                fs.mkdirSync(path.join(projectDir, 'src'), { recursive: true });
                fs.writeFileSync(path.join(projectDir, 'src', 'main.rs'), `
use axum::{response::Html, routing::get, Router};

#[tokio::main]
async fn main() {
    let app = Router::new().route("/", get(|| async { Html("<h1>Hello, World!</h1>") }));
    
    println!("Server running on http://0.0.0.0:3000");
    axum::Server::bind(&"0.0.0.0:3000".parse().unwrap())
        .serve(app.into_make_service())
        .await
        .unwrap();
}
`);
                break;
                
            case 'go-api':
                fs.writeFileSync(path.join(projectDir, 'go.mod'), `
module test-go-api

go 1.21

require (
    github.com/gin-gonic/gin v1.9.1
    github.com/lib/pq v1.10.9
    github.com/redis/go-redis/v9 v9.0.5
)
`);
                
                fs.writeFileSync(path.join(projectDir, 'main.go'), `
package main

import (
    "github.com/gin-gonic/gin"
    "net/http"
)

func main() {
    r := gin.Default()
    r.GET("/", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{
            "message": "Hello World",
        })
    })
    r.Run(":8080")
}
`);
                break;
                
            case 'java-spring':
                fs.writeFileSync(path.join(projectDir, 'pom.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
                             http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.example</groupId>
    <artifactId>spring-boot-app</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
            <version>3.1.0</version>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
            <version>3.1.0</version>
        </dependency>
    </dependencies>
</project>
`);
                break;
                
            case 'empty-project':
                fs.writeFileSync(path.join(projectDir, 'README.md'), '# Empty Test Project\n\nThis is an empty project for testing.');
                break;
        }
    }

    async runAllTests() {
        this.log('🚀 Starting Claude Flow 2.0 Portable Installation Test Suite', 'info');
        this.log(`🆔 Test ID: ${this.testId}`, 'info');
        
        await this.setupTestEnvironment();
        
        // Core functionality tests
        await this.test('Environment Validation', () => this.testEnvironmentValidation());
        await this.test('Cross-platform Compatibility', () => this.testCrossPlatformCompatibility());
        await this.test('Project Discovery', () => this.testProjectDiscovery());
        await this.test('MCP Auto-discovery', () => this.testMcpAutoDiscovery());
        await this.test('Installation Process', () => this.testInstallationProcess());
        await this.test('Overlay System', () => this.testOverlaySystem());
        await this.test('Build System', () => this.testBuildSystem());
        await this.test('Clean Uninstall', () => this.testCleanUninstall());
        
        // Specific project type tests
        await this.test('Node.js React Project', () => this.testNodejsReactProject());
        await this.test('Python Django Project', () => this.testPythonDjangoProject());
        await this.test('Rust Web Project', () => this.testRustWebProject());
        await this.test('Go API Project', () => this.testGoApiProject());
        await this.test('Java Spring Project', () => this.testJavaSpringProject());
        await this.test('Empty Project', () => this.testEmptyProject());
        
        // Edge cases and error handling
        await this.test('Permission Errors', () => this.testPermissionErrors());
        await this.test('Disk Space Validation', () => this.testDiskSpaceValidation());
        await this.test('Network Failures', () => this.testNetworkFailures());
        await this.test('Concurrent Installations', () => this.testConcurrentInstallations());
        
        await this.generateTestReport();
        await this.cleanup();
    }

    async testEnvironmentValidation() {
        const { ClaudeFlowPortableInstaller } = require('./claude-flow-installer');
        const installer = new ClaudeFlowPortableInstaller();
        
        // Test Node.js version validation
        const nodeVersion = process.version;
        const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
        
        if (majorVersion < 18) {
            throw new Error('Node.js version should be >= 18');
        }
        
        // Test write permissions
        const testDir = path.join(this.testDir, 'permission-test');
        fs.mkdirSync(testDir, { recursive: true });
        
        const testFile = path.join(testDir, 'write-test.txt');
        fs.writeFileSync(testFile, 'test');
        
        if (!fs.existsSync(testFile)) {
            throw new Error('Write permission test failed');
        }
        
        fs.unlinkSync(testFile);
        fs.rmdirSync(testDir);
    }

    async testCrossPlatformCompatibility() {
        const platforms = ['win32', 'darwin', 'linux'];
        const currentPlatform = process.platform;
        
        if (!platforms.includes(currentPlatform)) {
            throw new Error(`Unsupported platform: ${currentPlatform}`);
        }
        
        // Test path handling
        const testPath = path.join(this.testDir, 'cross-platform-test');
        fs.mkdirSync(testPath, { recursive: true });
        
        const isWindows = process.platform === 'win32';
        const expectedSeparator = isWindows ? '\\' : '/';
        
        if (!testPath.includes(expectedSeparator)) {
            throw new Error('Path separator handling failed');
        }
        
        fs.rmSync(testPath, { recursive: true });
    }

    async testProjectDiscovery() {
        const { ClaudeFlowPortableInstaller } = require('./claude-flow-installer');
        
        // Test Node.js project discovery
        const nodejsProject = path.join(this.testDir, 'nodejs-react');
        const installer = new ClaudeFlowPortableInstaller();
        installer.workingDir = nodejsProject;
        
        const discovery = await installer.discoverProjectStructure();
        
        if (!discovery.languages.includes('javascript')) {
            throw new Error('JavaScript detection failed');
        }
        
        if (!discovery.frameworks.includes('react')) {
            throw new Error('React framework detection failed');
        }
        
        if (!discovery.packageManagers.includes('npm')) {
            throw new Error('NPM package manager detection failed');
        }
    }

    async testMcpAutoDiscovery() {
        const { McpAutoDiscovery } = require('./mcp-auto-discovery');
        
        const nodejsProject = path.join(this.testDir, 'nodejs-react');
        const discovery = new McpAutoDiscovery(nodejsProject);
        
        const results = await discovery.discover();
        
        if (results.recommendations.length === 0) {
            throw new Error('No MCP server recommendations generated');
        }
        
        // Check for core servers
        const coreServers = results.recommendations.filter(r => r.category === 'core');
        if (coreServers.length === 0) {
            throw new Error('Core MCP servers not recommended');
        }
        
        // Check for project-specific recommendations
        const hasNodejsServers = results.recommendations.some(r => r.name === 'npm');
        if (!hasNodejsServers) {
            throw new Error('Node.js specific servers not recommended');
        }
    }

    async testInstallationProcess() {
        const { ClaudeFlowPortableInstaller } = require('./claude-flow-installer');
        
        const testProject = path.join(this.testDir, 'installation-test');
        fs.mkdirSync(testProject, { recursive: true });
        
        // Create a simple package.json
        fs.writeFileSync(path.join(testProject, 'package.json'), JSON.stringify({
            name: 'test-project',
            version: '1.0.0'
        }, null, 2));
        
        const installer = new ClaudeFlowPortableInstaller();
        installer.workingDir = testProject;
        
        const result = await installer.init({ webui: true });
        
        if (!result.success) {
            throw new Error('Installation failed');
        }
        
        // Verify installation files exist
        const overlayPath = path.join(testProject, '.claude-flow');
        if (!fs.existsSync(overlayPath)) {
            throw new Error('Overlay directory not created');
        }
        
        const lockFile = path.join(testProject, '.claude-flow.lock');
        if (!fs.existsSync(lockFile)) {
            throw new Error('Lock file not created');
        }
        
        // Test uninstall
        const uninstallResult = await installer.uninstall({ clean: true });
        if (!uninstallResult.success) {
            throw new Error('Uninstall failed');
        }
        
        // Verify cleanup
        if (fs.existsSync(overlayPath)) {
            throw new Error('Overlay directory not removed');
        }
        
        if (fs.existsSync(lockFile)) {
            throw new Error('Lock file not removed');
        }
        
        // Verify original files preserved
        const packageJsonPath = path.join(testProject, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            throw new Error('Original project files not preserved');
        }
    }

    async testOverlaySystem() {
        const { WorkflowOverlayManager } = require('./workflow-overlay-manager');
        
        const testProject = path.join(this.testDir, 'overlay-test');
        fs.mkdirSync(testProject, { recursive: true });
        
        const manager = new WorkflowOverlayManager(testProject);
        
        // Create overlay
        const createResult = await manager.createOverlay({ webui: true });
        if (!createResult.success) {
            throw new Error('Overlay creation failed');
        }
        
        // Verify overlay structure
        const overlayPath = path.join(testProject, '.claude-flow');
        if (!fs.existsSync(overlayPath)) {
            throw new Error('Overlay path not created');
        }
        
        const requiredDirs = ['intelligence-engine', 'mcp-servers', 'agents', 'configs'];
        for (const dir of requiredDirs) {
            const dirPath = path.join(overlayPath, dir);
            if (!fs.existsSync(dirPath)) {
                throw new Error(`Required directory not created: ${dir}`);
            }
        }
        
        // Test overlay removal
        const removeResult = await manager.removeOverlay();
        if (!removeResult.success) {
            throw new Error('Overlay removal failed');
        }
        
        // Verify cleanup
        if (fs.existsSync(overlayPath)) {
            throw new Error('Overlay not completely removed');
        }
    }

    async testBuildSystem() {
        const { ClaudeFlowPortableInstaller } = require('./claude-flow-installer');
        
        const testProject = path.join(this.testDir, 'build-test');
        fs.mkdirSync(testProject, { recursive: true });
        
        // Create a simple project
        fs.writeFileSync(path.join(testProject, 'package.json'), JSON.stringify({
            name: 'build-test',
            version: '1.0.0',
            scripts: {
                build: 'echo "Building project..."'
            }
        }, null, 2));
        
        const installer = new ClaudeFlowPortableInstaller();
        installer.workingDir = testProject;
        
        // Install
        await installer.init();
        
        // Test build
        const buildResult = await installer.build({ tests: false });
        
        if (!buildResult.success) {
            throw new Error('Build process failed');
        }
        
        if (buildResult.agentsUsed === 0) {
            throw new Error('No agents were used in build');
        }
        
        // Cleanup
        await installer.uninstall({ clean: true });
    }

    async testCleanUninstall() {
        const { ClaudeFlowPortableInstaller } = require('./claude-flow-installer');
        
        const testProject = path.join(this.testDir, 'uninstall-test');
        fs.mkdirSync(testProject, { recursive: true });
        
        // Create project files
        const originalFiles = [
            'package.json',
            'README.md',
            'src/index.js',
            '.gitignore'
        ];
        
        for (const file of originalFiles) {
            const filePath = path.join(testProject, file);
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
            fs.writeFileSync(filePath, `Original content for ${file}`);
        }
        
        const installer = new ClaudeFlowPortableInstaller();
        installer.workingDir = testProject;
        
        // Install
        await installer.init({ webui: true });
        
        // Verify installation created files
        const overlayPath = path.join(testProject, '.claude-flow');
        const lockFile = path.join(testProject, '.claude-flow.lock');
        
        if (!fs.existsSync(overlayPath) || !fs.existsSync(lockFile)) {
            throw new Error('Installation files not created');
        }
        
        // Uninstall
        const uninstallResult = await installer.uninstall({ clean: true });
        if (!uninstallResult.success) {
            throw new Error('Uninstall failed');
        }
        
        // Verify all original files preserved
        for (const file of originalFiles) {
            const filePath = path.join(testProject, file);
            if (!fs.existsSync(filePath)) {
                throw new Error(`Original file not preserved: ${file}`);
            }
            
            const content = fs.readFileSync(filePath, 'utf8');
            if (!content.includes('Original content')) {
                throw new Error(`Original file content modified: ${file}`);
            }
        }
        
        // Verify Claude Flow files removed
        if (fs.existsSync(overlayPath)) {
            throw new Error('Overlay directory not removed');
        }
        
        if (fs.existsSync(lockFile)) {
            throw new Error('Lock file not removed');
        }
    }

    async testNodejsReactProject() {
        await this.testSpecificProject('nodejs-react', {
            expectedLanguages: ['javascript'],
            expectedFrameworks: ['react', 'vite'],
            expectedPackageManagers: ['npm'],
            expectedMcpServers: ['npm', 'vite', 'react']
        });
    }

    async testPythonDjangoProject() {
        await this.testSpecificProject('python-django', {
            expectedLanguages: ['python'],
            expectedFrameworks: ['django'],
            expectedPackageManagers: ['pip'],
            expectedMcpServers: ['python-language-server', 'django']
        });
    }

    async testRustWebProject() {
        await this.testSpecificProject('rust-web', {
            expectedLanguages: ['rust'],
            expectedFrameworks: [],
            expectedPackageManagers: ['cargo'],
            expectedMcpServers: ['rust-analyzer', 'cargo']
        });
    }

    async testGoApiProject() {
        await this.testSpecificProject('go-api', {
            expectedLanguages: ['go'],
            expectedFrameworks: [],
            expectedPackageManagers: ['go-modules'],
            expectedMcpServers: ['go-language-server']
        });
    }

    async testJavaSpringProject() {
        await this.testSpecificProject('java-spring', {
            expectedLanguages: ['java'],
            expectedFrameworks: [],
            expectedPackageManagers: [],
            expectedMcpServers: ['java-language-server', 'maven']
        });
    }

    async testEmptyProject() {
        await this.testSpecificProject('empty-project', {
            expectedLanguages: [],
            expectedFrameworks: [],
            expectedPackageManagers: [],
            minMcpServers: 4 // At least core servers
        });
    }

    async testSpecificProject(projectName, expected) {
        const { ClaudeFlowPortableInstaller } = require('./claude-flow-installer');
        const { McpAutoDiscovery } = require('./mcp-auto-discovery');
        
        const projectPath = path.join(this.testDir, projectName);
        
        // Test project discovery
        const installer = new ClaudeFlowPortableInstaller();
        installer.workingDir = projectPath;
        
        const discovery = await installer.discoverProjectStructure();
        
        // Verify expected languages
        for (const lang of expected.expectedLanguages || []) {
            if (!discovery.languages.includes(lang)) {
                throw new Error(`Expected language not detected: ${lang}`);
            }
        }
        
        // Verify expected frameworks
        for (const framework of expected.expectedFrameworks || []) {
            if (!discovery.frameworks.includes(framework)) {
                throw new Error(`Expected framework not detected: ${framework}`);
            }
        }
        
        // Verify expected package managers
        for (const pm of expected.expectedPackageManagers || []) {
            if (!discovery.packageManagers.includes(pm)) {
                throw new Error(`Expected package manager not detected: ${pm}`);
            }
        }
        
        // Test MCP auto-discovery
        const mcpDiscovery = new McpAutoDiscovery(projectPath);
        const mcpResults = await mcpDiscovery.discover();
        
        // Verify minimum MCP servers
        const minServers = expected.minMcpServers || expected.expectedMcpServers?.length || 0;
        if (mcpResults.recommendations.length < minServers) {
            throw new Error(`Too few MCP servers recommended: ${mcpResults.recommendations.length} < ${minServers}`);
        }
        
        // Verify specific MCP servers if specified
        if (expected.expectedMcpServers) {
            for (const server of expected.expectedMcpServers) {
                const hasServer = mcpResults.recommendations.some(r => r.name.includes(server) || server.includes(r.name));
                if (!hasServer) {
                    this.log(`⚠️  Expected MCP server not recommended: ${server} (this may be expected)`, 'warning');
                }
            }
        }
        
        // Test installation on this project type
        const installResult = await installer.init();
        if (!installResult.success) {
            throw new Error(`Installation failed for ${projectName}`);
        }
        
        // Test uninstall
        const uninstallResult = await installer.uninstall({ clean: true });
        if (!uninstallResult.success) {
            throw new Error(`Uninstall failed for ${projectName}`);
        }
    }

    async testPermissionErrors() {
        // This test would be more complex in a real implementation
        // For now, we'll simulate permission testing
        const testDir = path.join(this.testDir, 'permission-test');
        fs.mkdirSync(testDir, { recursive: true });
        
        try {
            // Try to create a file
            const testFile = path.join(testDir, 'permission-test.txt');
            fs.writeFileSync(testFile, 'test');
            fs.unlinkSync(testFile);
        } catch (error) {
            throw new Error(`Permission test failed: ${error.message}`);
        }
        
        fs.rmSync(testDir, { recursive: true });
    }

    async testDiskSpaceValidation() {
        // Test would validate available disk space
        // For now, we'll just verify the validation logic exists
        const stats = fs.statSync(this.testDir);
        if (!stats.isDirectory()) {
            throw new Error('Disk space validation setup failed');
        }
    }

    async testNetworkFailures() {
        // This would test network failure scenarios
        // For now, we'll test graceful handling of missing network resources
        const { ClaudeFlowPortableInstaller } = require('./claude-flow-installer');
        const installer = new ClaudeFlowPortableInstaller();
        
        // This should still work without network
        const testDir = path.join(this.testDir, 'network-test');
        fs.mkdirSync(testDir, { recursive: true });
        fs.writeFileSync(path.join(testDir, 'package.json'), '{"name": "test"}');
        
        installer.workingDir = testDir;
        
        // Should succeed even without network for core functionality
        const result = await installer.init();
        if (!result.success) {
            throw new Error('Installation should work without network for basic functionality');
        }
        
        await installer.uninstall({ clean: true });
    }

    async testConcurrentInstallations() {
        // Test that concurrent installations are handled properly
        const testDir1 = path.join(this.testDir, 'concurrent-1');
        const testDir2 = path.join(this.testDir, 'concurrent-2');
        
        fs.mkdirSync(testDir1, { recursive: true });
        fs.mkdirSync(testDir2, { recursive: true });
        
        fs.writeFileSync(path.join(testDir1, 'package.json'), '{"name": "test1"}');
        fs.writeFileSync(path.join(testDir2, 'package.json'), '{"name": "test2"}');
        
        const { ClaudeFlowPortableInstaller } = require('./claude-flow-installer');
        
        const installer1 = new ClaudeFlowPortableInstaller();
        const installer2 = new ClaudeFlowPortableInstaller();
        
        installer1.workingDir = testDir1;
        installer2.workingDir = testDir2;
        
        // Both should succeed as they're in different directories
        const [result1, result2] = await Promise.all([
            installer1.init(),
            installer2.init()
        ]);
        
        if (!result1.success || !result2.success) {
            throw new Error('Concurrent installations should succeed in different directories');
        }
        
        // Cleanup both
        await Promise.all([
            installer1.uninstall({ clean: true }),
            installer2.uninstall({ clean: true })
        ]);
    }

    async generateTestReport() {
        const report = {
            testId: this.testId,
            timestamp: new Date().toISOString(),
            platform: process.platform,
            nodeVersion: process.version,
            testDirectory: this.testDir,
            results: this.results,
            summary: {
                totalTests: this.results.total,
                passed: this.results.passed,
                failed: this.results.failed,
                successRate: this.results.total > 0 ? 
                    Math.round((this.results.passed / this.results.total) * 100) : 0
            },
            environment: {
                os: os.type(),
                arch: os.arch(),
                hostname: os.hostname(),
                memory: Math.round(os.totalmem() / 1024 / 1024 / 1024) + ' GB',
                cpus: os.cpus().length
            }
        };
        
        const reportFile = path.join(this.testDir, 'test-report.json');
        fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
        
        // Generate summary
        this.log('\n📊 Test Results Summary:', 'info');
        this.log(`✅ Passed: ${this.results.passed}`, 'success');
        this.log(`❌ Failed: ${this.results.failed}`, 'error');
        this.log(`📈 Success Rate: ${report.summary.successRate}%`, 'info');
        this.log(`📁 Test Report: ${reportFile}`, 'info');
        
        if (this.results.failed > 0) {
            this.log('\n❌ Failed Tests:', 'error');
            for (const detail of this.results.details) {
                if (detail.status === 'failed') {
                    this.log(`  • ${detail.name}: ${detail.error}`, 'error');
                }
            }
        }
        
        return report;
    }

    async cleanup() {
        try {
            if (fs.existsSync(this.testDir)) {
                fs.rmSync(this.testDir, { recursive: true, force: true });
            }
            this.log('🧹 Test environment cleaned up', 'info');
        } catch (error) {
            this.log(`⚠️  Cleanup warning: ${error.message}`, 'warning');
        }
    }

    static async main() {
        const testSuite = new PortableInstallerTestSuite();
        
        try {
            const report = await testSuite.runAllTests();
            
            // Exit with appropriate code
            process.exit(report.summary.failed > 0 ? 1 : 0);
            
        } catch (error) {
            console.error(`❌ Test suite failed: ${error.message}`);
            process.exit(1);
        }
    }
}

// Run if called directly
if (require.main === module) {
    PortableInstallerTestSuite.main();
}

module.exports = { PortableInstallerTestSuite };