#!/usr/bin/env node

/**
 * Basic Test for Intelligent Decision System
 * Tests core functionality without external dependencies
 */

const fs = require('fs');
const path = require('path');
const ComplexityAnalyzer = require('../intelligence-engine/complexity-analyzer.js');
const ApproachSelector = require('../intelligence-engine/approach-selector.js');

// Colors for output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
};

let testsPassed = 0;
let testsFailed = 0;

// Test helper functions
function printHeader(text) {
    console.log(`\n${colors.bold}${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}  ${text}${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}\n`);
}

function printTestResult(testName, passed, details = '') {
    if (passed) {
        console.log(`${colors.green}✅ PASS${colors.reset}: ${testName}`);
        testsPassed++;
    } else {
        console.log(`${colors.red}❌ FAIL${colors.reset}: ${testName}${details ? ` - ${details}` : ''}`);
        testsFailed++;
    }
}

function createTestProject(type, tempDir) {
    const projectDir = path.join(tempDir, type);
    
    // Clean up if exists
    if (fs.existsSync(projectDir)) {
        fs.rmSync(projectDir, { recursive: true });
    }
    
    fs.mkdirSync(projectDir, { recursive: true });
    
    switch (type) {
        case 'simple':
            // Create simple project
            fs.writeFileSync(path.join(projectDir, 'package.json'), JSON.stringify({
                name: 'simple-app',
                version: '1.0.0',
                dependencies: {
                    express: '^4.18.0'
                }
            }, null, 2));
            
            fs.mkdirSync(path.join(projectDir, 'src'), { recursive: true });
            fs.writeFileSync(path.join(projectDir, 'src', 'index.js'), 'console.log("Hello");');
            break;
            
        case 'medium':
            // Create medium complexity project
            fs.writeFileSync(path.join(projectDir, 'package.json'), JSON.stringify({
                name: 'medium-app',
                version: '1.0.0',
                dependencies: {
                    express: '^4.18.0',
                    mongoose: '^6.0.0',
                    jsonwebtoken: '^8.5.1'
                },
                devDependencies: {
                    jest: '^27.0.0'
                }
            }, null, 2));
            
            // Create directory structure
            ['src/controllers', 'src/models', 'src/routes', 'tests'].forEach(dir => {
                fs.mkdirSync(path.join(projectDir, dir), { recursive: true });
            });
            
            // Add files
            fs.writeFileSync(path.join(projectDir, 'src/controllers/userController.js'), '// User controller');
            fs.writeFileSync(path.join(projectDir, 'tests/user.test.js'), '// User tests');
            break;
            
        case 'complex':
            // Create complex project
            fs.writeFileSync(path.join(projectDir, 'package.json'), JSON.stringify({
                name: 'complex-app',
                version: '1.0.0',
                dependencies: {
                    express: '^4.18.0',
                    react: '^18.2.0',
                    mongoose: '^6.0.0',
                    'socket.io': '^4.0.0',
                    redis: '^4.0.0'
                },
                devDependencies: {
                    jest: '^27.0.0',
                    cypress: '^10.0.0'
                }
            }, null, 2));
            
            // Create complex structure
            [
                'src/frontend/components',
                'src/backend/controllers',
                'src/backend/models',
                'tests/unit',
                'tests/e2e',
                'k8s',
                '.github/workflows'
            ].forEach(dir => {
                fs.mkdirSync(path.join(projectDir, dir), { recursive: true });
            });
            
            // Add deployment files
            fs.writeFileSync(path.join(projectDir, 'Dockerfile'), 'FROM node:18');
            fs.writeFileSync(path.join(projectDir, 'docker-compose.yml'), 'version: "3"');
            fs.writeFileSync(path.join(projectDir, 'k8s/deployment.yaml'), 'apiVersion: apps/v1');
            
            // Add many component files
            for (let i = 1; i <= 20; i++) {
                fs.writeFileSync(
                    path.join(projectDir, `src/frontend/components/Component${i}.jsx`),
                    `// Component ${i}`
                );
            }
            break;
            
        case 'idea':
            // Create documentation-only project
            fs.writeFileSync(path.join(projectDir, 'README.md'), `# Project Idea

This project will be a REST API with:
- User authentication
- MongoDB database
- Real-time features
- Docker deployment`);
            
            fs.writeFileSync(path.join(projectDir, 'requirements.md'), `## Requirements
- Node.js with Express
- React frontend
- PostgreSQL database`);
            break;
    }
    
    return projectDir;
}

// Test functions
async function testComplexityAnalysis() {
    printHeader('Test 1: Complexity Analysis');
    
    const tempDir = path.join(__dirname, 'temp-test-projects');
    fs.mkdirSync(tempDir, { recursive: true });
    
    try {
        // Test simple project
        const simplePath = createTestProject('simple', tempDir);
        const simpleAnalyzer = new ComplexityAnalyzer(simplePath);
        const simpleAnalysis = await simpleAnalyzer.analyze();
        
        printTestResult(
            'Simple project complexity',
            simpleAnalysis.score < 30,
            `Score: ${simpleAnalysis.score}`
        );
        
        // Test medium project
        const mediumPath = createTestProject('medium', tempDir);
        const mediumAnalyzer = new ComplexityAnalyzer(mediumPath);
        const mediumAnalysis = await mediumAnalyzer.analyze();
        
        printTestResult(
            'Medium project complexity',
            mediumAnalysis.score >= 10 && mediumAnalysis.score <= 40, // Adjusted for new weights
            `Score: ${mediumAnalysis.score}`
        );
        
        // Test complex project
        const complexPath = createTestProject('complex', tempDir);
        const complexAnalyzer = new ComplexityAnalyzer(complexPath);
        const complexAnalysis = await complexAnalyzer.analyze();
        
        printTestResult(
            'Complex project complexity',
            complexAnalysis.score > 28, // Adjusted for new glob-based feature detection
            `Score: ${complexAnalysis.score}`
        );
        
        // Test idea stage
        const ideaPath = createTestProject('idea', tempDir);
        const ideaAnalyzer = new ComplexityAnalyzer(ideaPath);
        const ideaAnalysis = await ideaAnalyzer.analyze();
        
        printTestResult(
            'Idea stage detection',
            ideaAnalysis.stage === 'idea',
            `Stage: ${ideaAnalysis.stage}`
        );
        
    } catch (error) {
        console.error('Error in complexity analysis test:', error);
        testsFailed++;
    } finally {
        // Cleanup
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true });
        }
    }
}

async function testApproachSelection() {
    printHeader('Test 2: Approach Selection');
    
    const selector = new ApproachSelector();
    
    // Test simple project approach
    const simpleAnalysis = {
        score: 20,
        stage: 'early',
        factors: {}
    };
    
    const simpleRecommendation = selector.selectApproach(simpleAnalysis);
    printTestResult(
        'Simple project → Simple Swarm',
        simpleRecommendation.selected === 'simpleSwarm',
        `Selected: ${simpleRecommendation.name}`
    );
    
    // Test medium project approach
    const mediumAnalysis = {
        score: 50,
        stage: 'active',
        factors: {}
    };
    
    const mediumRecommendation = selector.selectApproach(mediumAnalysis);
    printTestResult(
        'Medium project → Hive-Mind',
        mediumRecommendation.selected === 'hiveMind',
        `Selected: ${mediumRecommendation.name}`
    );
    
    // Test complex project approach
    const complexAnalysis = {
        score: 85,
        stage: 'mature',
        factors: {}
    };
    
    const complexRecommendation = selector.selectApproach(complexAnalysis);
    printTestResult(
        'Complex project → Hive-Mind + SPARC',
        complexRecommendation.selected === 'hiveMindSparc',
        `Selected: ${complexRecommendation.name}`
    );
}

async function testUserOverride() {
    printHeader('Test 3: User Choice Override');
    
    const selector = new ApproachSelector();
    
    // Test forcing Simple Swarm on complex project
    const complexAnalysis = {
        score: 85,
        stage: 'mature',
        factors: {}
    };
    
    const overrideResult = selector.selectApproach(complexAnalysis, 'simple-swarm');
    printTestResult(
        'User override with mismatch warning',
        overrideResult.selected === 'simpleSwarm' && overrideResult.mismatch === true,
        `Mismatch: ${overrideResult.mismatch}`
    );
    
    // Test command generation
    printTestResult(
        'Command generation',
        overrideResult.command && overrideResult.command.includes('npx claude-flow'),
        `Command: ${overrideResult.command}`
    );
}

async function testDetection() {
    printHeader('Test 4: Language & Feature Detection');
    
    const tempDir = path.join(__dirname, 'temp-test-features');
    fs.mkdirSync(tempDir, { recursive: true });
    
    try {
        // Create project with specific features
        const projectDir = path.join(tempDir, 'features');
        fs.mkdirSync(projectDir, { recursive: true });
        fs.mkdirSync(path.join(projectDir, 'src'), { recursive: true });
        
        // Add package.json with auth and realtime deps
        fs.writeFileSync(path.join(projectDir, 'package.json'), JSON.stringify({
            name: 'feature-test',
            dependencies: {
                jsonwebtoken: '^8.5.1',
                'socket.io': '^4.0.0',
                mongoose: '^6.0.0'
            }
        }, null, 2));
        
        // Add files with feature keywords
        fs.writeFileSync(path.join(projectDir, 'src/auth.js'), '// JWT authentication\nconst jwt = require("jsonwebtoken");');
        fs.writeFileSync(path.join(projectDir, 'src/websocket.js'), '// WebSocket handler\nconst io = require("socket.io");');
        fs.writeFileSync(path.join(projectDir, 'Dockerfile'), 'FROM node:18');
        
        const analyzer = new ComplexityAnalyzer(projectDir);
        const analysis = await analyzer.analyze();
        
        const features = analysis.factors.features?.detected || {};
        
        printTestResult(
            'Authentication detection',
            features.authentication === true,
            `Detected: ${features.authentication}`
        );
        
        printTestResult(
            'Real-time detection',
            features.realtime === true,
            `Detected: ${features.realtime}`
        );
        
        printTestResult(
            'Docker detection',
            features.docker === true,
            `Detected: ${features.docker}`
        );

        // Test new language detection
        fs.writeFileSync(path.join(projectDir, 'src/index.php'), '<?php echo "Hello"; ?>');
        const analysisWithPhp = await analyzer.analyze();
        const languages = analysisWithPhp.factors.techStack?.languages || [];

        printTestResult(
            'PHP language detection',
            languages.includes('PHP'),
            `Detected languages: ${languages.join(', ')}`
        );

        // Test Dart and HTML detection
        fs.writeFileSync(path.join(projectDir, 'src/main.dart'), 'void main() {}');
        fs.writeFileSync(path.join(projectDir, 'index.html'), '<html></html>');
        const analysisWithDart = await analyzer.analyze();
        const dartLanguages = analysisWithDart.factors.techStack?.languages || [];

        printTestResult(
            'Dart language detection',
            dartLanguages.includes('Dart'),
            `Detected languages: ${dartLanguages.join(', ')}`
        );

        printTestResult(
            'HTML file detection',
            dartLanguages.includes('HTML'),
            `Detected languages: ${dartLanguages.join(', ')}`
        );
        
    } catch (error) {
        console.error('Error in detection test:', error);
        testsFailed++;
    } finally {
        // Cleanup
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true });
        }
    }
}

// Main test runner
async function runTests() {
    console.log(`${colors.bold}${colors.magenta}╔══════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bold}${colors.magenta}║     Intelligent Workflow Decision System Tests      ║${colors.reset}`);
    console.log(`${colors.bold}${colors.magenta}╚══════════════════════════════════════════════════════╝${colors.reset}`);
    
    await testComplexityAnalysis();
    await testApproachSelection();
    await testUserOverride();
    await testDetection();
    
    // Print summary
    console.log(`\n${colors.bold}${colors.blue}════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bold}Test Summary:${colors.reset}`);
    console.log(`${colors.green}  Passed: ${testsPassed}${colors.reset}`);
    console.log(`${colors.red}  Failed: ${testsFailed}${colors.reset}`);
    
    if (testsFailed === 0) {
        console.log(`\n${colors.bold}${colors.green}✅ All tests passed!${colors.reset}`);
        process.exit(0);
    } else {
        console.log(`\n${colors.bold}${colors.red}❌ Some tests failed${colors.reset}`);
        process.exit(1);
    }
}

// Run tests
runTests().catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
});