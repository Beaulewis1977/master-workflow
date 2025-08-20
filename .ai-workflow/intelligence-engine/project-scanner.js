#!/usr/bin/env node

/**
 * Project Scanner
 * Scans projects for incomplete work, TODOs, FIXMEs, and other patterns
 * Used by recovery mode to identify what needs to be completed
 */

const fs = require('fs');
const path = require('path');

class ProjectScanner {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.results = {
      todos: [],
      fixmes: [],
      hacks: [],
      notImplemented: [],
      failingTests: [],
      missingDocs: [],
      uncommitted: [],
      total: 0
    };

    // Patterns to search for
    this.patterns = {
      todos: [/TODO[:\s].*$/gmi, /@todo\s.*$/gmi],
      fixmes: [/FIXME[:\s].*$/gmi, /FIX\s?ME[:\s].*$/gmi, /@fixme\s.*$/gmi],
      hacks: [/HACK[:\s].*$/gmi, /XXX[:\s].*$/gmi, /UGLY[:\s].*$/gmi],
      notImplemented: [
        /throw.*Error.*not.*implemented/gi,
        /NotImplementedError/gi,
        /TODO.*implement/gi,
        /raise\s+NotImplementedError/gi,
        /panic.*not\s+implemented/gi,
        /unimplemented!/gi
      ],
      incomplete: [
        /\/\/\s*\.\.\./g,
        /#\s*\.\.\./g,
        /pass\s*#\s*TODO/gi,
        /return\s*#\s*TODO/gi,
        /\/\/\s*Implement\s+this/gi,
        /\/\/\s*Complete\s+this/gi
      ],
      failingTests: [
        /\.(skip|only)\(/g,
        /xit\(/g,
        /xtest\(/g,
        /test\.todo\(/g,
        /it\.todo\(/g,
        /describe\.skip\(/g
      ]
    };

    // Directories to exclude
    this.excludedDirs = [
      'node_modules',
      '.git',
      '.ai-workflow',
      '.ai-dev',
      'dist',
      'build',
      'coverage',
      'vendor',
      '.next',
      '.cache',
      '__pycache__',
      '.pytest_cache'
    ];

    // File extensions to scan
    this.includedExtensions = [
      '.js', '.jsx', '.ts', '.tsx',
      '.py', '.rb', '.go', '.rs',
      '.java', '.cpp', '.c', '.h',
      '.php', '.cs', '.swift',
      '.vue', '.svelte',
      '.md', '.txt', '.yml', '.yaml',
      '.json', '.xml', '.html', '.css'
    ];
  }

  /**
   * Scan the entire project
   */
  async scan() {
    console.log(`Scanning project: ${this.projectPath}`);

    // Scan files
    await this.scanDirectory(this.projectPath);

    // Check for uncommitted changes
    await this.checkGitStatus();

    // Check for missing documentation
    await this.checkDocumentation();

    // Calculate totals
    this.calculateTotals();

    return this.results;
  }

  /**
   * Recursively scan a directory
   */
  async scanDirectory(dirPath, depth = 0) {
    // Prevent infinite recursion
    if (depth > 20) return;

    try {
      const files = fs.readdirSync(dirPath);

      for (const file of files) {
        const fullPath = path.join(dirPath, file);
        const relativePath = path.relative(this.projectPath, fullPath);

        // Skip excluded directories
        if (this.excludedDirs.includes(file)) continue;

        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          await this.scanDirectory(fullPath, depth + 1);
        } else if (stat.isFile()) {
          // Check if file should be scanned
          const ext = path.extname(file);
          if (!this.includedExtensions.includes(ext)) continue;

          await this.scanFile(fullPath, relativePath);
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}:`, error.message);
    }
  }

  /**
   * Scan a single file for patterns
   */
  async scanFile(filePath, relativePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');

      // Search for each pattern type
      for (const [type, patterns] of Object.entries(this.patterns)) {
        for (const pattern of patterns) {
          const matches = content.match(pattern) || [];

          for (const match of matches) {
            // Find line number
            let lineNum = 1;
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].includes(match.trim())) {
                lineNum = i + 1;
                break;
              }
            }

            this.results[type].push({
              file: relativePath,
              line: lineNum,
              match: match.trim(),
              type: type
            });
          }
        }
      }

      // Check for test files
      if (relativePath.includes('test') || relativePath.includes('spec')) {
        this.scanTestFile(content, relativePath);
      }

    } catch (error) {
      // Ignore files that can't be read
    }
  }

  /**
   * Scan test files for failing/skipped tests
   */
  scanTestFile(content, relativePath) {
    const skippedPatterns = [
      /describe\.skip\(/g,
      /it\.skip\(/g,
      /test\.skip\(/g,
      /xit\(/g,
      /xtest\(/g,
      /xdescribe\(/g
    ];

    for (const pattern of skippedPatterns) {
      const matches = content.match(pattern) || [];
      if (matches.length > 0) {
        this.results.failingTests.push({
          file: relativePath,
          count: matches.length,
          type: 'skipped'
        });
      }
    }
  }

  /**
   * Check git status for uncommitted changes
   */
  async checkGitStatus() {
    const gitPath = path.join(this.projectPath, '.git');

    if (!fs.existsSync(gitPath)) {
      return;
    }

    try {
      const { execSync } = require('child_process');
      const status = execSync('git status --porcelain', {
        cwd: this.projectPath,
        encoding: 'utf8'
      });

      const lines = status.split('\n').filter(line => line.trim());

      for (const line of lines) {
        const [status, file] = line.trim().split(/\s+/);
        if (file) {
          this.results.uncommitted.push({
            file: file,
            status: status
          });
        }
      }
    } catch (error) {
      // Git command failed, ignore
    }
  }

  /**
   * Check for missing documentation
   */
  async checkDocumentation() {
    const docFiles = ['README.md', 'CONTRIBUTING.md', 'LICENSE'];

    for (const docFile of docFiles) {
      const docPath = path.join(this.projectPath, docFile);

      if (!fs.existsSync(docPath)) {
        this.results.missingDocs.push(docFile);
      } else {
        // Check if file is empty or minimal
        const content = fs.readFileSync(docPath, 'utf8');
        if (content.length < 100) {
          this.results.missingDocs.push(`${docFile} (minimal content)`);
        }
      }
    }
  }

  /**
   * Calculate total incomplete items
   */
  calculateTotals() {
    this.results.total =
      this.results.todos.length +
      this.results.fixmes.length +
      this.results.hacks.length +
      this.results.notImplemented.length +
      this.results.failingTests.length +
      this.results.uncommitted.length;
  }

  /**
   * Generate a summary report
   */
  generateReport() {
    const report = {
      summary: {
        todos: this.results.todos.length,
        fixmes: this.results.fixmes.length,
        hacks: this.results.hacks.length,
        notImplemented: this.results.notImplemented.length,
        failingTests: this.results.failingTests.length,
        uncommitted: this.results.uncommitted.length,
        missingDocs: this.results.missingDocs.length,
        total: this.results.total
      },
      details: this.results,
      recommendations: []
    };

    // Add recommendations based on findings
    if (this.results.notImplemented.length > 0) {
      report.recommendations.push({
        priority: 1,
        action: 'Implement stub functions',
        reason: `Found ${this.results.notImplemented.length} not implemented functions`
      });
    }

    if (this.results.failingTests.length > 0) {
      report.recommendations.push({
        priority: 2,
        action: 'Fix failing/skipped tests',
        reason: `Found ${this.results.failingTests.length} test issues`
      });
    }

    if (this.results.fixmes.length > 0) {
      report.recommendations.push({
        priority: 3,
        action: 'Address FIXME items',
        reason: `Found ${this.results.fixmes.length} items marked for fixing`
      });
    }

    if (this.results.todos.length > 5) {
      report.recommendations.push({
        priority: 4,
        action: 'Complete TODO items',
        reason: `Found ${this.results.todos.length} TODO items`
      });
    }

    if (this.results.uncommitted.length > 0) {
      report.recommendations.push({
        priority: 5,
        action: 'Commit pending changes',
        reason: `Found ${this.results.uncommitted.length} uncommitted files`
      });
    }

    return report;
  }
}

// CLI usage
if (require.main === module) {
  const scanner = new ProjectScanner();

  scanner.scan().then(results => {
    const report = scanner.generateReport();

    // Output results
    console.log('\n📊 Project Scan Results:');
    console.log('─'.repeat(40));
    console.log(`TODOs:           ${report.summary.todos}`);
    console.log(`FIXMEs:          ${report.summary.fixmes}`);
    console.log(`HACKs:           ${report.summary.hacks}`);
    console.log(`Not Implemented: ${report.summary.notImplemented}`);
    console.log(`Test Issues:     ${report.summary.failingTests}`);
    console.log(`Uncommitted:     ${report.summary.uncommitted}`);
    console.log(`Missing Docs:    ${report.summary.missingDocs}`);
    console.log('─'.repeat(40));
    console.log(`Total Issues:    ${report.summary.total}`);

    if (report.recommendations.length > 0) {
      console.log('\n📋 Recommendations:');
      report.recommendations.forEach(rec => {
        console.log(`${rec.priority}. ${rec.action}`);
        console.log(`   ${rec.reason}`);
      });
    }

    // Save detailed report
    const outputPath = path.join(process.cwd(), '.ai-dev', 'scan-report.json');

    // Ensure directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`\n📁 Detailed report saved to: ${outputPath}`);
  });
}

module.exports = ProjectScanner;