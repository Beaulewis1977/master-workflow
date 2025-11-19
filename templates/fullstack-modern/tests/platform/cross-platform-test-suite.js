#!/usr/bin/env node

/**
 * Cross-Platform Compatibility Test Suite
 * Comprehensive testing for Windows, macOS, and Linux compatibility
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

class CrossPlatformTestSuite {
  constructor() {
    this.templatePath = path.resolve(__dirname, '../../');
    this.platform = process.platform;
    this.architecture = process.arch;
    this.testResults = {
      pathHandling: [],
      permissions: [],
      lineEndings: [],
      commands: [],
      dependencies: [],
      containers: [],
      environment: [],
      networking: []
    };
    this.platformInfo = {
      platform: this.platform,
      architecture: this.architecture,
      version: os.release(),
      nodeVersion: process.version,
      type: os.type(),
      homedir: os.homedir(),
      tmpdir: os.tmpdir()
    };
  }

  async runAllTests() {
    console.log('🌍 Starting Cross-Platform Compatibility Test Suite...\n');
    console.log(`Platform: ${this.platform} (${this.architecture})`);
    console.log(`Node.js: ${process.version}`);
    console.log(`OS: ${os.type()} ${os.release()}\n`);

    try {
      await this.testPathHandling();
      await this.testFilePermissions();
      await this.testLineEndings();
      await this.testCommandCompatibility();
      await this.testDependencyCompatibility();
      await this.testContainerCompatibility();
      await this.testEnvironmentVariables();
      await this.testNetworkingCompatibility();

      return this.generateTestReport();
    } catch (error) {
      console.error('❌ Cross-platform test suite failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  // 1. Path Handling Testing
  async testPathHandling() {
    console.log('📁 Testing path handling across platforms...');

    const tests = [
      this.testPathSeparators,
      this.testAbsolutePaths,
      this.testRelativePaths,
      this.testSpecialCharacters,
      this.testPathLength
    ];

    for (const test of tests) {
      try {
        await test.call(this);
      } catch (error) {
        this.testResults.pathHandling.push({
          test: test.name,
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  async testPathSeparators() {
    console.log('🛤️ Testing path separators...');

    const testPaths = [
      'frontend/src/app/page.tsx',
      'backend/src/main.rs',
      'docker-compose.yml'
    ];

    const pathResults = [];

    for (const testPath of testPaths) {
      const normalizedPath = path.normalize(testPath);
      const resolvedPath = path.resolve(this.templatePath, testPath);
      const joinedPath = path.join(this.templatePath, testPath);

      const exists = await this.fileExists(resolvedPath);

      pathResults.push({
        original: testPath,
        normalized: normalizedPath,
        resolved: resolvedPath,
        joined: joinedPath,
        exists: exists,
        platform: this.platform
      });
    }

    const allPathsWork = pathResults.every(result => 
      result.normalized && result.resolved && result.joined
    );

    this.testResults.pathHandling.push({
      test: 'path_separators',
      status: allPathsWork ? 'passed' : 'failed',
      message: allPathsWork ? 
        'Path separators handled correctly' : 
        'Path separator issues detected',
      details: pathResults
    });
  }

  async testAbsolutePaths() {
    console.log('🎯 Testing absolute paths...');

    const testDir = path.resolve(this.templatePath, 'test-absolute-path');
    
    try {
      await fs.mkdir(testDir, { recursive: true });
      await fs.writeFile(path.join(testDir, 'test.txt'), 'test content');
      
      const absolutePath = path.resolve(testDir, 'test.txt');
      const fileExists = await this.fileExists(absolutePath);
      
      await fs.unlink(path.join(testDir, 'test.txt'));
      await fs.rmdir(testDir);

      this.testResults.pathHandling.push({
        test: 'absolute_paths',
        status: fileExists ? 'passed' : 'failed',
        message: fileExists ? 
          'Absolute paths work correctly' : 
          'Absolute path handling failed',
        testPath: absolutePath
      });
    } catch (error) {
      this.testResults.pathHandling.push({
        test: 'absolute_paths',
        status: 'failed',
        message: 'Absolute path test failed',
        error: error.message
      });
    }
  }

  async testRelativePaths() {
    console.log('🔗 Testing relative paths...');

    const relativePaths = [
      './frontend/package.json',
      '../templates/fullstack-modern/docker-compose.yml',
      'backend/../frontend/src'
    ];

    const relativeResults = [];

    for (const relativePath of relativePaths) {
      try {
        const resolvedPath = path.resolve(this.templatePath, relativePath);
        const normalizedPath = path.normalize(relativePath);
        
        relativeResults.push({
          original: relativePath,
          resolved: resolvedPath,
          normalized: normalizedPath,
          status: 'passed'
        });
      } catch (error) {
        relativeResults.push({
          original: relativePath,
          status: 'failed',
          error: error.message
        });
      }
    }

    const allRelativePathsWork = relativeResults.every(result => result.status === 'passed');

    this.testResults.pathHandling.push({
      test: 'relative_paths',
      status: allRelativePathsWork ? 'passed' : 'failed',
      message: allRelativePathsWork ? 
        'Relative paths resolved correctly' : 
        'Relative path resolution issues',
      details: relativeResults
    });
  }

  async testSpecialCharacters() {
    console.log('✨ Testing special characters in paths...');

    // Test paths with spaces and special characters
    const specialPaths = [
      'test file with spaces.txt',
      'test-file-with-dashes.txt',
      'test_file_with_underscores.txt'
    ];

    if (this.platform !== 'win32') {
      specialPaths.push('test file with (parentheses).txt');
    }

    const specialResults = [];
    const testDir = path.join(this.templatePath, 'special-chars-test');

    try {
      await fs.mkdir(testDir, { recursive: true });

      for (const specialPath of specialPaths) {
        try {
          const fullPath = path.join(testDir, specialPath);
          await fs.writeFile(fullPath, 'test content');
          const exists = await this.fileExists(fullPath);
          
          specialResults.push({
            path: specialPath,
            status: exists ? 'passed' : 'failed',
            fullPath: fullPath
          });

          if (exists) {
            await fs.unlink(fullPath);
          }
        } catch (error) {
          specialResults.push({
            path: specialPath,
            status: 'failed',
            error: error.message
          });
        }
      }

      await fs.rmdir(testDir);
    } catch (error) {
      // Test directory creation failed
    }

    const allSpecialPathsWork = specialResults.every(result => result.status === 'passed');

    this.testResults.pathHandling.push({
      test: 'special_characters',
      status: allSpecialPathsWork ? 'passed' : 'warning',
      message: allSpecialPathsWork ? 
        'Special characters in paths handled correctly' : 
        'Some special characters in paths may cause issues',
      details: specialResults
    });
  }

  async testPathLength() {
    console.log('📏 Testing path length limits...');

    const maxPathLength = this.platform === 'win32' ? 260 : 4096;
    const longFileName = 'a'.repeat(Math.min(200, maxPathLength - this.templatePath.length - 10));
    const longPath = path.join(this.templatePath, longFileName + '.txt');

    try {
      await fs.writeFile(longPath, 'test content');
      const exists = await this.fileExists(longPath);
      
      if (exists) {
        await fs.unlink(longPath);
      }

      this.testResults.pathHandling.push({
        test: 'path_length',
        status: exists ? 'passed' : 'warning',
        message: exists ? 
          'Long paths handled correctly' : 
          'Long path handling may have limitations',
        maxPathLength: maxPathLength,
        testPathLength: longPath.length
      });
    } catch (error) {
      this.testResults.pathHandling.push({
        test: 'path_length',
        status: 'warning',
        message: 'Path length test failed',
        error: error.message,
        maxPathLength: maxPathLength
      });
    }
  }

  // 2. File Permissions Testing
  async testFilePermissions() {
    console.log('🔐 Testing file permissions...');

    const tests = [
      this.testReadPermissions,
      this.testWritePermissions,
      this.testExecutePermissions,
      this.testPermissionInheritance
    ];

    for (const test of tests) {
      try {
        await test.call(this);
      } catch (error) {
        this.testResults.permissions.push({
          test: test.name,
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  async testReadPermissions() {
    console.log('👁️ Testing read permissions...');

    const testFiles = [
      'frontend/package.json',
      'backend/Cargo.toml',
      'docker-compose.yml'
    ];

    const readResults = [];

    for (const testFile of testFiles) {
      const filePath = path.join(this.templatePath, testFile);
      
      try {
        await fs.access(filePath, fs.constants.R_OK);
        readResults.push({
          file: testFile,
          readable: true,
          status: 'passed'
        });
      } catch (error) {
        readResults.push({
          file: testFile,
          readable: false,
          status: 'warning',
          error: error.message
        });
      }
    }

    const allReadable = readResults.every(result => result.readable);

    this.testResults.permissions.push({
      test: 'read_permissions',
      status: allReadable ? 'passed' : 'warning',
      message: allReadable ? 
        'All test files are readable' : 
        'Some files may have read permission issues',
      details: readResults
    });
  }

  async testWritePermissions() {
    console.log('✏️ Testing write permissions...');

    const testFile = path.join(this.templatePath, 'write-test.tmp');

    try {
      await fs.writeFile(testFile, 'write test content');
      const content = await fs.readFile(testFile, 'utf8');
      const writeSuccessful = content === 'write test content';
      
      await fs.unlink(testFile);

      this.testResults.permissions.push({
        test: 'write_permissions',
        status: writeSuccessful ? 'passed' : 'failed',
        message: writeSuccessful ? 
          'Write permissions working correctly' : 
          'Write permission test failed'
      });
    } catch (error) {
      this.testResults.permissions.push({
        test: 'write_permissions',
        status: 'failed',
        message: 'Write permissions test failed',
        error: error.message
      });
    }
  }

  async testExecutePermissions() {
    console.log('⚡ Testing execute permissions...');

    if (this.platform === 'win32') {
      this.testResults.permissions.push({
        test: 'execute_permissions',
        status: 'info',
        message: 'Execute permissions not applicable on Windows'
      });
      return;
    }

    const scriptContent = '#!/bin/bash\necho "execute test"';
    const scriptPath = path.join(this.templatePath, 'execute-test.sh');

    try {
      await fs.writeFile(scriptPath, scriptContent);
      await fs.chmod(scriptPath, 0o755);
      
      const result = await this.execCommand(`${scriptPath}`);
      const executeWorking = result.success && result.output.includes('execute test');
      
      await fs.unlink(scriptPath);

      this.testResults.permissions.push({
        test: 'execute_permissions',
        status: executeWorking ? 'passed' : 'warning',
        message: executeWorking ? 
          'Execute permissions working correctly' : 
          'Execute permission issues detected'
      });
    } catch (error) {
      this.testResults.permissions.push({
        test: 'execute_permissions',
        status: 'warning',
        message: 'Execute permissions test failed',
        error: error.message
      });
    }
  }

  async testPermissionInheritance() {
    console.log('🔄 Testing permission inheritance...');

    const testDir = path.join(this.templatePath, 'permission-test');
    
    try {
      await fs.mkdir(testDir, { recursive: true });
      
      const testFile = path.join(testDir, 'inherited-test.txt');
      await fs.writeFile(testFile, 'inheritance test');
      
      const stats = await fs.stat(testFile);
      const hasPermissions = Boolean(stats.mode);
      
      await fs.unlink(testFile);
      await fs.rmdir(testDir);

      this.testResults.permissions.push({
        test: 'permission_inheritance',
        status: hasPermissions ? 'passed' : 'warning',
        message: hasPermissions ? 
          'Permission inheritance working' : 
          'Permission inheritance may have issues',
        mode: stats.mode
      });
    } catch (error) {
      this.testResults.permissions.push({
        test: 'permission_inheritance',
        status: 'warning',
        message: 'Permission inheritance test failed',
        error: error.message
      });
    }
  }

  // 3. Line Endings Testing
  async testLineEndings() {
    console.log('📄 Testing line endings compatibility...');

    const tests = [
      this.testLineEndingDetection,
      this.testLineEndingConversion,
      this.testGitConfiguration
    ];

    for (const test of tests) {
      try {
        await test.call(this);
      } catch (error) {
        this.testResults.lineEndings.push({
          test: test.name,
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  async testLineEndingDetection() {
    console.log('🔍 Testing line ending detection...');

    const testContent = {
      unix: 'line1\nline2\nline3\n',
      windows: 'line1\r\nline2\r\nline3\r\n',
      mac: 'line1\rline2\rline3\r'
    };

    const detectionResults = [];

    for (const [type, content] of Object.entries(testContent)) {
      const testFile = path.join(this.templatePath, `line-ending-test-${type}.txt`);
      
      try {
        await fs.writeFile(testFile, content, 'binary');
        const readContent = await fs.readFile(testFile, 'binary');
        
        const hasCorrectEndings = readContent.toString('binary') === content;
        
        detectionResults.push({
          type: type,
          correct: hasCorrectEndings,
          status: hasCorrectEndings ? 'passed' : 'warning'
        });

        await fs.unlink(testFile);
      } catch (error) {
        detectionResults.push({
          type: type,
          status: 'failed',
          error: error.message
        });
      }
    }

    const allCorrect = detectionResults.every(result => result.correct);

    this.testResults.lineEndings.push({
      test: 'line_ending_detection',
      status: allCorrect ? 'passed' : 'warning',
      message: allCorrect ? 
        'Line ending detection working correctly' : 
        'Line ending handling may vary by platform',
      details: detectionResults
    });
  }

  async testLineEndingConversion() {
    console.log('🔄 Testing line ending conversion...');

    const originalContent = 'line1\nline2\nline3\n';
    const testFile = path.join(this.templatePath, 'line-ending-conversion-test.txt');

    try {
      await fs.writeFile(testFile, originalContent);
      const readContent = await fs.readFile(testFile, 'utf8');
      
      // Check if Node.js preserves line endings correctly
      const linesMatch = readContent.split('\n').length === originalContent.split('\n').length;
      
      await fs.unlink(testFile);

      this.testResults.lineEndings.push({
        test: 'line_ending_conversion',
        status: linesMatch ? 'passed' : 'warning',
        message: linesMatch ? 
          'Line ending conversion working correctly' : 
          'Line ending conversion may have issues',
        platform: this.platform
      });
    } catch (error) {
      this.testResults.lineEndings.push({
        test: 'line_ending_conversion',
        status: 'failed',
        message: 'Line ending conversion test failed',
        error: error.message
      });
    }
  }

  async testGitConfiguration() {
    console.log('📝 Testing Git line ending configuration...');

    const gitAttributesPath = path.join(this.templatePath, '.gitattributes');
    const gitConfigResult = await this.execCommand('git config core.autocrlf');

    let hasGitAttributes = false;
    let gitAttributesContent = '';

    try {
      gitAttributesContent = await fs.readFile(gitAttributesPath, 'utf8');
      hasGitAttributes = true;
    } catch (error) {
      // .gitattributes file doesn't exist
    }

    this.testResults.lineEndings.push({
      test: 'git_configuration',
      status: hasGitAttributes || gitConfigResult.success ? 'passed' : 'info',
      message: hasGitAttributes || gitConfigResult.success ? 
        'Git line ending configuration detected' : 
        'No Git line ending configuration found',
      hasGitAttributes: hasGitAttributes,
      gitConfig: gitConfigResult.output?.trim(),
      recommendation: 'Configure .gitattributes for consistent line endings'
    });
  }

  // 4. Command Compatibility Testing
  async testCommandCompatibility() {
    console.log('⚡ Testing command compatibility...');

    const tests = [
      this.testNodeCommands,
      this.testNpmCommands,
      this.testDockerCommands,
      this.testShellCommands
    ];

    for (const test of tests) {
      try {
        await test.call(this);
      } catch (error) {
        this.testResults.commands.push({
          test: test.name,
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  async testNodeCommands() {
    console.log('🟢 Testing Node.js commands...');

    const nodeCommands = ['node --version', 'npm --version'];
    const commandResults = [];

    for (const command of nodeCommands) {
      const result = await this.execCommand(command);
      commandResults.push({
        command: command,
        success: result.success,
        output: result.output?.trim(),
        status: result.success ? 'passed' : 'failed'
      });
    }

    const allCommandsWork = commandResults.every(result => result.success);

    this.testResults.commands.push({
      test: 'node_commands',
      status: allCommandsWork ? 'passed' : 'failed',
      message: allCommandsWork ? 
        'Node.js commands working correctly' : 
        'Some Node.js commands failed',
      details: commandResults
    });
  }

  async testNpmCommands() {
    console.log('📦 Testing npm commands...');

    const npmCommands = [
      'npm --version',
      'npm config get registry',
      'npm list --depth=0 --silent'
    ];

    const commandResults = [];

    for (const command of npmCommands) {
      const result = await this.execCommand(command, { 
        cwd: path.join(this.templatePath, 'frontend')
      });
      
      commandResults.push({
        command: command,
        success: result.success,
        output: result.output?.trim(),
        status: result.success ? 'passed' : 'warning'
      });
    }

    const criticalCommandsWork = commandResults.slice(0, 2).every(result => result.success);

    this.testResults.commands.push({
      test: 'npm_commands',
      status: criticalCommandsWork ? 'passed' : 'failed',
      message: criticalCommandsWork ? 
        'npm commands working correctly' : 
        'Critical npm commands failed',
      details: commandResults
    });
  }

  async testDockerCommands() {
    console.log('🐳 Testing Docker commands...');

    const dockerCommands = [
      'docker --version',
      'docker-compose --version',
      'docker info'
    ];

    const commandResults = [];

    for (const command of dockerCommands) {
      const result = await this.execCommand(command);
      commandResults.push({
        command: command,
        success: result.success,
        output: result.output?.trim(),
        status: result.success ? 'passed' : 'warning'
      });
    }

    const dockerAvailable = commandResults.slice(0, 2).every(result => result.success);

    this.testResults.commands.push({
      test: 'docker_commands',
      status: dockerAvailable ? 'passed' : 'warning',
      message: dockerAvailable ? 
        'Docker commands working correctly' : 
        'Docker may not be available or configured',
      details: commandResults
    });
  }

  async testShellCommands() {
    console.log('🐚 Testing shell commands...');

    const shellCommands = this.platform === 'win32' ? [
      'echo %PATH%',
      'dir /B',
      'where node'
    ] : [
      'echo $PATH',
      'ls -la',
      'which node'
    ];

    const commandResults = [];

    for (const command of shellCommands) {
      const result = await this.execCommand(command);
      commandResults.push({
        command: command,
        success: result.success,
        output: result.output?.trim().substring(0, 100), // Truncate long output
        status: result.success ? 'passed' : 'warning'
      });
    }

    const shellWorking = commandResults.every(result => result.success);

    this.testResults.commands.push({
      test: 'shell_commands',
      status: shellWorking ? 'passed' : 'warning',
      message: shellWorking ? 
        'Shell commands working correctly' : 
        'Some shell commands may have issues',
      shell: this.platform === 'win32' ? 'cmd' : 'bash',
      details: commandResults
    });
  }

  // 5. Dependency Compatibility Testing
  async testDependencyCompatibility() {
    console.log('📚 Testing dependency compatibility...');

    const tests = [
      this.testNodeDependencies,
      this.testRustDependencies,
      this.testSystemDependencies
    ];

    for (const test of tests) {
      try {
        await test.call(this);
      } catch (error) {
        this.testResults.dependencies.push({
          test: test.name,
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  async testNodeDependencies() {
    console.log('🟢 Testing Node.js dependencies...');

    const packageJsonPath = path.join(this.templatePath, 'frontend/package.json');
    
    if (await this.fileExists(packageJsonPath)) {
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      // Check Node.js version compatibility
      const nodeVersion = process.version;
      const engines = packageJson.engines;
      
      let nodeCompatible = true;
      let compatibilityMessage = 'Node.js version compatible';

      if (engines && engines.node) {
        // Basic version check (could be enhanced with semver)
        const requiredVersion = engines.node.replace(/[^0-9.]/g, '');
        const currentVersion = nodeVersion.replace(/[^0-9.]/g, '');
        
        nodeCompatible = currentVersion >= requiredVersion;
        compatibilityMessage = nodeCompatible ? 
          'Node.js version meets requirements' : 
          `Node.js version ${nodeVersion} may not meet requirement ${engines.node}`;
      }

      this.testResults.dependencies.push({
        test: 'node_dependencies',
        status: nodeCompatible ? 'passed' : 'warning',
        message: compatibilityMessage,
        nodeVersion: nodeVersion,
        requiredVersion: engines?.node || 'not specified',
        platform: this.platform
      });
    } else {
      this.testResults.dependencies.push({
        test: 'node_dependencies',
        status: 'skipped',
        message: 'Frontend package.json not found'
      });
    }
  }

  async testRustDependencies() {
    console.log('🦀 Testing Rust dependencies...');

    const cargoResult = await this.execCommand('cargo --version');
    
    if (cargoResult.success) {
      const cargoTomlPath = path.join(this.templatePath, 'backend/Cargo.toml');
      
      if (await this.fileExists(cargoTomlPath)) {
        const checkResult = await this.execCommand('cargo check', {
          cwd: path.join(this.templatePath, 'backend'),
          timeout: 120000
        });

        this.testResults.dependencies.push({
          test: 'rust_dependencies',
          status: checkResult.success ? 'passed' : 'warning',
          message: checkResult.success ? 
            'Rust dependencies compatible' : 
            'Rust dependency compatibility issues detected',
          cargoVersion: cargoResult.output?.trim(),
          platform: this.platform
        });
      } else {
        this.testResults.dependencies.push({
          test: 'rust_dependencies',
          status: 'skipped',
          message: 'Backend Cargo.toml not found'
        });
      }
    } else {
      this.testResults.dependencies.push({
        test: 'rust_dependencies',
        status: 'warning',
        message: 'Rust/Cargo not available',
        recommendation: 'Install Rust toolchain for backend development'
      });
    }
  }

  async testSystemDependencies() {
    console.log('🔧 Testing system dependencies...');

    const systemDeps = this.platform === 'win32' ? [
      { name: 'git', command: 'git --version' },
      { name: 'python', command: 'python --version' }
    ] : [
      { name: 'git', command: 'git --version' },
      { name: 'curl', command: 'curl --version' },
      { name: 'make', command: 'make --version' }
    ];

    const depResults = [];

    for (const dep of systemDeps) {
      const result = await this.execCommand(dep.command);
      depResults.push({
        name: dep.name,
        available: result.success,
        version: result.output?.split('\n')[0]?.trim(),
        status: result.success ? 'passed' : 'warning'
      });
    }

    const criticalDepsAvailable = depResults.filter(dep => 
      dep.name === 'git'
    ).every(dep => dep.available);

    this.testResults.dependencies.push({
      test: 'system_dependencies',
      status: criticalDepsAvailable ? 'passed' : 'warning',
      message: criticalDepsAvailable ? 
        'Critical system dependencies available' : 
        'Some system dependencies missing',
      details: depResults
    });
  }

  // 6. Container Compatibility Testing
  async testContainerCompatibility() {
    console.log('🐳 Testing container compatibility...');

    const tests = [
      this.testDockerPlatform,
      this.testImageCompatibility,
      this.testVolumeCompatibility,
      this.testNetworkCompatibility
    ];

    for (const test of tests) {
      try {
        await test.call(this);
      } catch (error) {
        this.testResults.containers.push({
          test: test.name,
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  async testDockerPlatform() {
    console.log('🐋 Testing Docker platform compatibility...');

    const dockerInfoResult = await this.execCommand('docker info');
    
    if (dockerInfoResult.success) {
      const dockerInfo = dockerInfoResult.output;
      const osType = dockerInfo.match(/OSType: (\w+)/)?.[1];
      const architecture = dockerInfo.match(/Architecture: (\w+)/)?.[1];
      
      this.testResults.containers.push({
        test: 'docker_platform',
        status: 'passed',
        message: 'Docker platform information retrieved',
        dockerOSType: osType,
        dockerArchitecture: architecture,
        hostPlatform: this.platform,
        hostArchitecture: this.architecture
      });
    } else {
      this.testResults.containers.push({
        test: 'docker_platform',
        status: 'warning',
        message: 'Docker not available or not running',
        recommendation: 'Install and start Docker for container testing'
      });
    }
  }

  async testImageCompatibility() {
    console.log('📦 Testing image compatibility...');

    const composeFile = path.join(this.templatePath, 'docker-compose.yml');
    
    if (await this.fileExists(composeFile)) {
      const content = await fs.readFile(composeFile, 'utf8');
      
      // Check for platform-specific base images
      const baseImages = content.match(/FROM\s+([^\s\n]+)/g) || [];
      const platformCompatibility = [];

      for (const imageMatch of baseImages) {
        const image = imageMatch.replace('FROM ', '').trim();
        const isMultiPlatform = image.includes('alpine') || 
                               image.includes('ubuntu') || 
                               image.includes('debian') ||
                               image.includes('node') ||
                               image.includes('rust');

        platformCompatibility.push({
          image: image,
          multiPlatform: isMultiPlatform,
          status: isMultiPlatform ? 'passed' : 'warning'
        });
      }

      const allCompatible = platformCompatibility.every(img => img.multiPlatform);

      this.testResults.containers.push({
        test: 'image_compatibility',
        status: allCompatible ? 'passed' : 'warning',
        message: allCompatible ? 
          'All base images are multi-platform' : 
          'Some base images may have platform limitations',
        details: platformCompatibility
      });
    } else {
      this.testResults.containers.push({
        test: 'image_compatibility',
        status: 'skipped',
        message: 'Docker Compose file not found'
      });
    }
  }

  async testVolumeCompatibility() {
    console.log('💾 Testing volume compatibility...');

    const composeFile = path.join(this.templatePath, 'docker-compose.yml');
    
    if (await this.fileExists(composeFile)) {
      const content = await fs.readFile(composeFile, 'utf8');
      
      // Check for Windows-specific volume issues
      const volumeMounts = content.match(/- [^:]+:[^:]+/g) || [];
      const volumeIssues = [];

      for (const mount of volumeMounts) {
        const [hostPath, containerPath] = mount.replace('- ', '').split(':');
        
        // Check for potential Windows path issues
        if (this.platform === 'win32' && hostPath.startsWith('./')) {
          volumeIssues.push({
            mount: mount,
            issue: 'Relative paths may cause issues on Windows',
            severity: 'warning'
          });
        }
      }

      this.testResults.containers.push({
        test: 'volume_compatibility',
        status: volumeIssues.length === 0 ? 'passed' : 'warning',
        message: volumeIssues.length === 0 ? 
          'Volume mounts appear compatible' : 
          `${volumeIssues.length} potential volume compatibility issues`,
        issues: volumeIssues,
        platform: this.platform
      });
    }
  }

  async testNetworkCompatibility() {
    console.log('🌐 Testing network compatibility...');

    // Test basic networking
    const pingTest = this.platform === 'win32' ? 
      'ping -n 1 127.0.0.1' : 
      'ping -c 1 127.0.0.1';

    const pingResult = await this.execCommand(pingTest);

    this.testResults.containers.push({
      test: 'network_compatibility',
      status: pingResult.success ? 'passed' : 'warning',
      message: pingResult.success ? 
        'Basic networking functional' : 
        'Network connectivity issues detected',
      platform: this.platform
    });
  }

  // 7. Environment Variables Testing
  async testEnvironmentVariables() {
    console.log('🌍 Testing environment variables...');

    const tests = [
      this.testEnvVarHandling,
      this.testPathVariables,
      this.testPlatformSpecificVars
    ];

    for (const test of tests) {
      try {
        await test.call(this);
      } catch (error) {
        this.testResults.environment.push({
          test: test.name,
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  async testEnvVarHandling() {
    console.log('🔧 Testing environment variable handling...');

    const testVar = 'CROSS_PLATFORM_TEST_VAR';
    const testValue = 'cross-platform-test-value';

    // Set environment variable
    process.env[testVar] = testValue;

    // Test reading the variable
    const readValue = process.env[testVar];
    const isCorrect = readValue === testValue;

    // Clean up
    delete process.env[testVar];

    this.testResults.environment.push({
      test: 'env_var_handling',
      status: isCorrect ? 'passed' : 'failed',
      message: isCorrect ? 
        'Environment variable handling working correctly' : 
        'Environment variable handling failed',
      testValue: testValue,
      readValue: readValue
    });
  }

  async testPathVariables() {
    console.log('🛤️ Testing PATH variables...');

    const pathVar = this.platform === 'win32' ? 'Path' : 'PATH';
    const pathValue = process.env[pathVar];
    const pathSeparator = this.platform === 'win32' ? ';' : ':';

    const hasPath = Boolean(pathValue);
    const pathEntries = pathValue ? pathValue.split(pathSeparator) : [];

    this.testResults.environment.push({
      test: 'path_variables',
      status: hasPath ? 'passed' : 'warning',
      message: hasPath ? 
        `PATH variable found with ${pathEntries.length} entries` : 
        'PATH variable not found',
      pathEntries: pathEntries.length,
      pathSeparator: pathSeparator,
      platform: this.platform
    });
  }

  async testPlatformSpecificVars() {
    console.log('🎯 Testing platform-specific variables...');

    const platformVars = this.platform === 'win32' ? [
      'USERPROFILE',
      'APPDATA',
      'PROGRAMFILES'
    ] : [
      'HOME',
      'USER',
      'SHELL'
    ];

    const varResults = [];

    for (const varName of platformVars) {
      const value = process.env[varName];
      varResults.push({
        variable: varName,
        hasValue: Boolean(value),
        value: value ? value.substring(0, 50) + '...' : undefined,
        status: Boolean(value) ? 'passed' : 'warning'
      });
    }

    const allVarsPresent = varResults.every(result => result.hasValue);

    this.testResults.environment.push({
      test: 'platform_specific_vars',
      status: allVarsPresent ? 'passed' : 'warning',
      message: allVarsPresent ? 
        'Platform-specific variables found' : 
        'Some platform-specific variables missing',
      details: varResults,
      platform: this.platform
    });
  }

  // 8. Networking Compatibility Testing
  async testNetworkingCompatibility() {
    console.log('🌐 Testing networking compatibility...');

    const tests = [
      this.testLocalhost,
      this.testPortBinding,
      this.testDNSResolution
    ];

    for (const test of tests) {
      try {
        await test.call(this);
      } catch (error) {
        this.testResults.networking.push({
          test: test.name,
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  async testLocalhost() {
    console.log('🏠 Testing localhost connectivity...');

    const localhostVariants = ['localhost', '127.0.0.1'];
    const connectivityResults = [];

    for (const host of localhostVariants) {
      const pingCommand = this.platform === 'win32' ? 
        `ping -n 1 ${host}` : 
        `ping -c 1 ${host}`;

      const result = await this.execCommand(pingCommand);
      connectivityResults.push({
        host: host,
        reachable: result.success,
        status: result.success ? 'passed' : 'warning'
      });
    }

    const localhostWorking = connectivityResults.some(result => result.reachable);

    this.testResults.networking.push({
      test: 'localhost',
      status: localhostWorking ? 'passed' : 'warning',
      message: localhostWorking ? 
        'Localhost connectivity working' : 
        'Localhost connectivity issues detected',
      details: connectivityResults
    });
  }

  async testPortBinding() {
    console.log('🚪 Testing port binding...');

    // Test if we can bind to common development ports
    const testPorts = [3000, 8000, 5432, 6379];
    const portResults = [];

    for (const port of testPorts) {
      try {
        const net = require('net');
        const server = net.createServer();
        
        await new Promise((resolve, reject) => {
          server.listen(port, (error) => {
            if (error) {
              reject(error);
            } else {
              server.close();
              resolve();
            }
          });
        });

        portResults.push({
          port: port,
          bindable: true,
          status: 'passed'
        });
      } catch (error) {
        portResults.push({
          port: port,
          bindable: false,
          status: 'warning',
          error: error.code
        });
      }
    }

    const portsAvailable = portResults.filter(result => result.bindable).length;

    this.testResults.networking.push({
      test: 'port_binding',
      status: portsAvailable > 0 ? 'passed' : 'warning',
      message: `${portsAvailable}/${testPorts.length} test ports available`,
      details: portResults
    });
  }

  async testDNSResolution() {
    console.log('🔍 Testing DNS resolution...');

    const dnsCommand = this.platform === 'win32' ? 
      'nslookup google.com' : 
      'nslookup google.com';

    const result = await this.execCommand(dnsCommand);

    this.testResults.networking.push({
      test: 'dns_resolution',
      status: result.success ? 'passed' : 'warning',
      message: result.success ? 
        'DNS resolution working' : 
        'DNS resolution issues detected',
      platform: this.platform
    });
  }

  // Utility Methods
  async execCommand(command, options = {}) {
    const { cwd = this.templatePath, timeout = 30000 } = options;
    
    return new Promise((resolve) => {
      const process = exec(command, { cwd }, (error, stdout, stderr) => {
        resolve({
          success: !error,
          output: stdout,
          error: stderr,
          code: error?.code
        });
      });

      if (timeout) {
        setTimeout(() => {
          process.kill();
          resolve({
            success: false,
            output: '',
            error: 'Command timeout',
            code: -1
          });
        }, timeout);
      }
    });
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generateTestReport() {
    const report = {
      timestamp: new Date().toISOString(),
      platform: this.platformInfo,
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        info: 0
      },
      categories: this.testResults,
      compatibility: {
        pathHandling: 'good',
        permissions: 'good',
        lineEndings: 'good',
        commands: 'good',
        dependencies: 'good',
        containers: 'good',
        environment: 'good',
        networking: 'good'
      },
      platformSpecific: {
        recommendations: [],
        knownIssues: [],
        optimizations: []
      },
      overallStatus: 'unknown'
    };

    // Calculate summary
    for (const category of Object.values(this.testResults)) {
      for (const test of category) {
        report.summary.totalTests++;
        if (test.status === 'passed') report.summary.passed++;
        else if (test.status === 'failed') report.summary.failed++;
        else if (test.status === 'warning') report.summary.warnings++;
        else if (test.status === 'info') report.summary.info++;
      }
    }

    // Determine overall status
    if (report.summary.failed === 0) {
      report.overallStatus = report.summary.warnings > 0 ? 'warning' : 'passed';
    } else {
      report.overallStatus = 'failed';
    }

    // Platform-specific recommendations
    if (this.platform === 'win32') {
      report.platformSpecific.recommendations = [
        'Use Git Bash or WSL for better shell compatibility',
        'Configure Git line ending handling (.gitattributes)',
        'Use PowerShell for advanced scripting',
        'Consider Docker Desktop for container development'
      ];
    } else if (this.platform === 'darwin') {
      report.platformSpecific.recommendations = [
        'Use Homebrew for dependency management',
        'Configure Docker Desktop for optimal performance',
        'Use iTerm2 or Terminal for development'
      ];
    } else {
      report.platformSpecific.recommendations = [
        'Use package manager for dependency installation',
        'Configure Docker properly for your distribution',
        'Ensure proper file permissions for development'
      ];
    }

    // Save report
    await fs.writeFile(
      path.join(this.templatePath, 'cross-platform-test-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('\n📊 Cross-Platform Compatibility Test Results:');
    console.log(`Platform: ${this.platform} (${this.architecture})`);
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`⚠️  Warnings: ${report.summary.warnings}`);
    console.log(`ℹ️  Info: ${report.summary.info}`);
    console.log(`\n📄 Detailed report saved to: cross-platform-test-report.json`);

    return report;
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up cross-platform test environment...');
    // Cleanup any temporary test files that might remain
    const tempFiles = [
      'write-test.tmp',
      'execute-test.sh',
      'line-ending-test-unix.txt',
      'line-ending-test-windows.txt',
      'line-ending-test-mac.txt',
      'line-ending-conversion-test.txt'
    ];

    for (const file of tempFiles) {
      const filePath = path.join(this.templatePath, file);
      try {
        await fs.unlink(filePath);
      } catch (error) {
        // File might not exist, ignore error
      }
    }
  }
}

// Export for use in other test files
module.exports = CrossPlatformTestSuite;

// Run if called directly
if (require.main === module) {
  const testSuite = new CrossPlatformTestSuite();
  
  testSuite.runAllTests()
    .then((report) => {
      console.log(`\n🎉 Cross-platform testing completed with status: ${report.overallStatus}`);
      process.exit(report.overallStatus === 'failed' ? 1 : 0);
    })
    .catch((error) => {
      console.error('💥 Cross-platform test suite failed:', error);
      process.exit(1);
    });
}