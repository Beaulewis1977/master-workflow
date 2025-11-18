#!/usr/bin/env node

/**
 * Agent-OS Structure Handler
 * Phase 4 Implementation - MASTER-WORKFLOW v3.0
 * 
 * Handles creation and management of Agent-OS folder structure
 * according to buildermethods.com/agent-os specifications.
 * 
 * Features:
 * - Creates global ~/.agent-os/ structure
 * - Creates project-specific .agent-os/ structure  
 * - Manages folder permissions and structure verification
 * - Handles both initial creation and updates
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const EventEmitter = require('events');

class AgentOSStructureHandler extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Configuration
    this.config = {
      homeDir: options.homeDir || os.homedir(),
      projectDir: options.projectDir || process.cwd(),
      createGlobal: options.createGlobal !== false,
      createProject: options.createProject !== false,
      overwrite: options.overwrite || false,
      verbose: options.verbose || false,
      ...options
    };
    
    // Define Agent-OS structure
    this.globalStructure = {
      base: path.join(this.config.homeDir, '.agent-os'),
      folders: {
        standards: {
          path: 'standards',
          files: [
            'tech-stack.md',
            'code-style.md',
            'best-practices.md'
          ],
          subfolders: {
            'code-style': {
              files: [
                'html-style.md',
                'css-style.md',
                'javascript-style.md'
              ]
            }
          }
        },
        instructions: {
          path: 'instructions',
          subfolders: {
            core: {
              files: [
                'plan-product.md',
                'create-spec.md',
                'execute-tasks.md',
                'execute-task.md',
                'analyze-product.md'
              ]
            },
            meta: {
              files: [
                'pre-flight.md'
              ]
            }
          }
        }
      }
    };
    
    this.projectStructure = {
      base: path.join(this.config.projectDir, '.agent-os'),
      folders: {
        product: {
          path: 'product',
          files: [
            'mission.md',
            'roadmap.md',
            'decisions.md'
          ]
        },
        specs: {
          path: 'specs',
          subfolders: {
            // Dynamic spec folders will be created as needed
            // Format: YYYY-MM-DD-feature-name/
          }
        }
      }
    };
    
    // Track created structures
    this.createdPaths = {
      global: [],
      project: []
    };
  }
  
  /**
   * Create complete Agent-OS structure
   */
  async createCompleteStructure() {
    const results = {
      global: null,
      project: null,
      errors: []
    };
    
    try {
      // Create global structure
      if (this.config.createGlobal) {
        results.global = await this.createGlobalStructure();
      }
      
      // Create project structure
      if (this.config.createProject) {
        results.project = await this.createProjectStructure();
      }
      
      // Verify structure
      const verification = await this.verifyStructure();
      results.verification = verification;
      
      this.emit('structure-created', results);
      return results;
      
    } catch (error) {
      results.errors.push(error);
      this.emit('error', error);
      throw error;
    }
  }
  
  /**
   * Create global ~/.agent-os structure
   */
  async createGlobalStructure() {
    const created = {
      folders: [],
      files: [],
      skipped: []
    };
    
    try {
      // Create base directory
      const baseDir = this.globalStructure.base;
      await this.ensureDirectory(baseDir);
      created.folders.push(baseDir);
      
      // Create folder structure recursively
      for (const [key, folder] of Object.entries(this.globalStructure.folders)) {
        await this.createFolderStructure(
          baseDir,
          folder,
          created
        );
      }
      
      // Also create Claude-specific directory if needed
      const claudeDir = path.join(this.config.homeDir, '.claude');
      if (!(await this.pathExists(claudeDir))) {
        await this.ensureDirectory(claudeDir);
        created.folders.push(claudeDir);
      }
      
      this.createdPaths.global = created;
      this.emit('global-structure-created', created);
      return created;
      
    } catch (error) {
      this.emit('error', { phase: 'global-structure', error });
      throw error;
    }
  }
  
  /**
   * Create project-specific .agent-os structure
   */
  async createProjectStructure() {
    const created = {
      folders: [],
      files: [],
      skipped: []
    };
    
    try {
      // Create base directory
      const baseDir = this.projectStructure.base;
      await this.ensureDirectory(baseDir);
      created.folders.push(baseDir);
      
      // Create folder structure
      for (const [key, folder] of Object.entries(this.projectStructure.folders)) {
        await this.createFolderStructure(
          baseDir,
          folder,
          created
        );
      }
      
      // Create a sample spec folder with current date
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      const sampleSpecDir = path.join(baseDir, 'specs', `${dateStr}-initial-setup`);
      
      if (!(await this.pathExists(sampleSpecDir))) {
        await this.ensureDirectory(sampleSpecDir);
        created.folders.push(sampleSpecDir);
        
        // Create spec template files
        const specFiles = ['srd.md', 'technical-specs.md', 'tasks.md'];
        for (const file of specFiles) {
          const filePath = path.join(sampleSpecDir, file);
          if (!(await this.pathExists(filePath))) {
            await this.createTemplateFile(filePath, this.getSpecTemplate(file));
            created.files.push(filePath);
          }
        }
      }
      
      // Also create Cursor rules directory if needed
      const cursorDir = path.join(this.config.projectDir, '.cursor', 'rules');
      if (!(await this.pathExists(cursorDir))) {
        await this.ensureDirectory(cursorDir);
        created.folders.push(cursorDir);
      }
      
      this.createdPaths.project = created;
      this.emit('project-structure-created', created);
      return created;
      
    } catch (error) {
      this.emit('error', { phase: 'project-structure', error });
      throw error;
    }
  }
  
  /**
   * Create folder structure recursively
   */
  async createFolderStructure(basePath, folder, tracking) {
    const folderPath = path.join(basePath, folder.path || '');
    
    // Create main folder
    if (!(await this.pathExists(folderPath))) {
      await this.ensureDirectory(folderPath);
      tracking.folders.push(folderPath);
    }
    
    // Create files in folder
    if (folder.files) {
      for (const file of folder.files) {
        const filePath = path.join(folderPath, file);
        if (!(await this.pathExists(filePath)) || this.config.overwrite) {
          const template = this.getTemplateContent(file);
          await this.createTemplateFile(filePath, template);
          tracking.files.push(filePath);
        } else {
          tracking.skipped.push(filePath);
        }
      }
    }
    
    // Create subfolders recursively
    if (folder.subfolders) {
      for (const [subKey, subfolder] of Object.entries(folder.subfolders)) {
        const subfolderPath = path.join(folderPath, subKey);
        
        if (!(await this.pathExists(subfolderPath))) {
          await this.ensureDirectory(subfolderPath);
          tracking.folders.push(subfolderPath);
        }
        
        // Create files in subfolder
        if (subfolder.files) {
          for (const file of subfolder.files) {
            const filePath = path.join(subfolderPath, file);
            if (!(await this.pathExists(filePath)) || this.config.overwrite) {
              const template = this.getTemplateContent(file);
              await this.createTemplateFile(filePath, template);
              tracking.files.push(filePath);
            } else {
              tracking.skipped.push(filePath);
            }
          }
        }
        
        // Handle nested subfolders if needed
        if (subfolder.subfolders) {
          await this.createFolderStructure(subfolderPath, subfolder, tracking);
        }
      }
    }
  }
  
  /**
   * Verify that structure exists and is complete
   */
  async verifyStructure() {
    const verification = {
      global: {
        complete: true,
        missing: []
      },
      project: {
        complete: true,
        missing: []
      }
    };
    
    // Verify global structure
    if (this.config.createGlobal) {
      const globalChecks = await this.verifyFolderStructure(
        this.globalStructure.base,
        this.globalStructure.folders
      );
      verification.global = globalChecks;
    }
    
    // Verify project structure
    if (this.config.createProject) {
      const projectChecks = await this.verifyFolderStructure(
        this.projectStructure.base,
        this.projectStructure.folders
      );
      verification.project = projectChecks;
    }
    
    this.emit('structure-verified', verification);
    return verification;
  }
  
  /**
   * Verify folder structure recursively
   */
  async verifyFolderStructure(basePath, folders) {
    const result = {
      complete: true,
      missing: [],
      found: []
    };
    
    // Check base path
    if (!(await this.pathExists(basePath))) {
      result.complete = false;
      result.missing.push(basePath);
      return result;
    }
    
    // Check each folder
    for (const [key, folder] of Object.entries(folders)) {
      const folderPath = path.join(basePath, folder.path || key);
      
      if (!(await this.pathExists(folderPath))) {
        result.complete = false;
        result.missing.push(folderPath);
      } else {
        result.found.push(folderPath);
      }
      
      // Check files
      if (folder.files) {
        for (const file of folder.files) {
          const filePath = path.join(folderPath, file);
          if (!(await this.pathExists(filePath))) {
            result.complete = false;
            result.missing.push(filePath);
          } else {
            result.found.push(filePath);
          }
        }
      }
      
      // Check subfolders
      if (folder.subfolders) {
        const subResults = await this.verifyFolderStructure(folderPath, folder.subfolders);
        if (!subResults.complete) {
          result.complete = false;
          result.missing.push(...subResults.missing);
        }
        result.found.push(...subResults.found);
      }
    }
    
    return result;
  }
  
  /**
   * Get template content for a file
   */
  getTemplateContent(filename) {
    const templates = {
      // Standards templates
      'tech-stack.md': `# Tech Stack Standards

## Overview
This document defines the technology stack preferences and standards for this project.

## Languages
<!-- Define preferred programming languages -->
- Primary: [Language]
- Secondary: [Language]

## Frameworks
<!-- List frameworks and libraries -->
- Frontend: [Framework]
- Backend: [Framework]
- Testing: [Framework]

## Tools
<!-- Development tools and utilities -->
- Version Control: Git
- Package Manager: [npm/yarn/pnpm]
- Build Tool: [Tool]

## Database
<!-- Database preferences -->
- Primary: [Database]
- Cache: [Cache]

## Infrastructure
<!-- Infrastructure and deployment -->
- Cloud Provider: [Provider]
- Container: Docker
- CI/CD: [Platform]
`,
      
      'code-style.md': `# Code Style Guide

## General Principles
- Write clean, readable, and maintainable code
- Follow consistent naming conventions
- Keep functions small and focused
- Comment complex logic

## Formatting
- Indentation: [2/4] spaces
- Line length: [80/100/120] characters
- File encoding: UTF-8

## Naming Conventions
- Variables: camelCase
- Constants: UPPER_SNAKE_CASE
- Classes: PascalCase
- Files: kebab-case

## Best Practices
<!-- Add language-specific best practices -->
`,
      
      'best-practices.md': `# Development Best Practices

## Code Quality
- Write tests for all new features
- Maintain >80% code coverage
- Regular code reviews
- Use linting and formatting tools

## Git Workflow
- Feature branches from main
- Descriptive commit messages
- PR reviews before merge
- Squash commits when merging

## Documentation
- Document all public APIs
- Keep README up to date
- Add inline comments for complex logic
- Maintain changelog

## Security
- Never commit secrets
- Use environment variables
- Regular dependency updates
- Security scanning in CI/CD
`,
      
      // Code style templates
      'html-style.md': `# HTML Style Guide

## Structure
- Use semantic HTML5 elements
- Maintain proper document outline
- Include accessibility attributes
- Valid HTML structure

## Formatting
- 2 spaces indentation
- Lowercase element names
- Quote attribute values
- Self-close void elements
`,
      
      'css-style.md': `# CSS Style Guide

## Organization
- Mobile-first approach
- Component-based structure
- Use CSS custom properties
- Consistent naming (BEM/other)

## Best Practices
- Avoid !important
- Minimize specificity
- Use relative units
- Optimize for performance
`,
      
      'javascript-style.md': `# JavaScript Style Guide

## ES6+ Features
- Use const/let, no var
- Arrow functions where appropriate
- Template literals
- Destructuring

## Code Structure
- One component per file
- Named exports preferred
- Consistent import order
- Error handling
`,
      
      // Instruction templates
      'plan-product.md': `# Plan Product Instruction

## Purpose
Guide the AI in planning product features and architecture.

## Process
1. Analyze requirements
2. Define scope
3. Create feature list
4. Prioritize features
5. Define MVP

## Output
- Feature roadmap
- Technical requirements
- Timeline estimates
`,
      
      'create-spec.md': `# Create Specification Instruction

## Purpose
Generate detailed specifications for features.

## Process
1. Gather requirements
2. Define acceptance criteria
3. Create technical design
4. Identify dependencies
5. Estimate effort

## Output
- SRD document
- Technical specs
- Task breakdown
`,
      
      'execute-tasks.md': `# Execute Tasks Instruction

## Purpose
Guide execution of multiple related tasks.

## Process
1. Review task list
2. Identify dependencies
3. Execute in order
4. Test each component
5. Integrate and verify

## Best Practices
- Complete one task before starting another
- Test incrementally
- Document changes
`,
      
      'execute-task.md': `# Execute Single Task Instruction

## Purpose
Guide execution of individual tasks.

## Process
1. Understand requirements
2. Plan implementation
3. Write code
4. Test thoroughly
5. Document

## Quality Checks
- Code passes tests
- Follows style guide
- Properly documented
`,
      
      'analyze-product.md': `# Analyze Product Instruction

## Purpose
Analyze existing codebase and product.

## Process
1. Scan codebase structure
2. Identify patterns
3. Detect tech stack
4. Find pain points
5. Suggest improvements

## Output
- Analysis report
- Recommendations
- Priority items
`,
      
      'pre-flight.md': `# Pre-Flight Checklist

## Before Starting
- [ ] Project requirements clear
- [ ] Development environment ready
- [ ] Dependencies installed
- [ ] Tests passing

## Configuration
- [ ] Agent-OS structure created
- [ ] Standards documents reviewed
- [ ] Git repository initialized
- [ ] CI/CD configured

## Ready Check
- [ ] All tools available
- [ ] Documentation accessible
- [ ] Team aligned
`,
      
      // Product templates
      'mission.md': `# Product Mission

## Vision
[What is the long-term vision for this product?]

## Mission Statement
[Clear, concise mission statement]

## Core Values
- Value 1: [Description]
- Value 2: [Description]
- Value 3: [Description]

## Success Metrics
- Metric 1: [Target]
- Metric 2: [Target]
- Metric 3: [Target]
`,
      
      'roadmap.md': `# Product Roadmap

## Current Phase
[Phase name and description]

## Completed Features
- [ ] Feature 1
- [ ] Feature 2

## In Progress
- [ ] Feature 3
- [ ] Feature 4

## Planned
### Short Term (1-3 months)
- [ ] Feature 5
- [ ] Feature 6

### Medium Term (3-6 months)
- [ ] Feature 7
- [ ] Feature 8

### Long Term (6+ months)
- [ ] Feature 9
- [ ] Feature 10
`,
      
      'decisions.md': `# Technical Decisions Log

## Decision Template
### Date: YYYY-MM-DD
### Decision: [Title]
### Context
[Why was this decision needed?]

### Options Considered
1. Option A: [Description]
2. Option B: [Description]

### Decision
[What was decided and why]

### Consequences
[What are the implications?]

---

## Decision History
<!-- Add new decisions below -->
`
    };
    
    return templates[filename] || `# ${filename}\n\n<!-- Template content to be customized -->`;
  }
  
  /**
   * Get spec template content
   */
  getSpecTemplate(filename) {
    const templates = {
      'srd.md': `# Specification Requirements Document

## Feature Name
[Feature name]

## Overview
[Brief description of the feature]

## User Stories
- As a [user type], I want to [action] so that [benefit]
- As a [user type], I want to [action] so that [benefit]

## Functional Requirements
1. [Requirement 1]
2. [Requirement 2]
3. [Requirement 3]

## Non-Functional Requirements
- Performance: [Requirements]
- Security: [Requirements]
- Accessibility: [Requirements]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Dependencies
- [List any dependencies]

## Timeline
- Start Date: [Date]
- End Date: [Date]
- Milestones: [List]
`,
      
      'technical-specs.md': `# Technical Specifications

## Architecture Overview
[High-level architecture description]

## Components
### Component 1
- Purpose: [Description]
- Technology: [Tech stack]
- Interfaces: [APIs/Methods]

### Component 2
- Purpose: [Description]
- Technology: [Tech stack]
- Interfaces: [APIs/Methods]

## Data Model
[Database schema or data structures]

## API Design
[Endpoint definitions and contracts]

## Security Considerations
[Security measures and requirements]

## Testing Strategy
- Unit Tests: [Approach]
- Integration Tests: [Approach]
- E2E Tests: [Approach]

## Deployment
[Deployment process and requirements]
`,
      
      'tasks.md': `# Task Breakdown

## Task List
- [ ] Task 1: [Description] (Est: Xh)
- [ ] Task 2: [Description] (Est: Xh)
- [ ] Task 3: [Description] (Est: Xh)
- [ ] Task 4: [Description] (Est: Xh)
- [ ] Task 5: [Description] (Est: Xh)

## Task Dependencies
\`\`\`mermaid
graph TD
    Task1 --> Task2
    Task2 --> Task3
    Task3 --> Task4
    Task4 --> Task5
\`\`\`

## Assigned To
- Task 1: [Developer]
- Task 2: [Developer]
- Task 3: [Developer]

## Notes
[Any additional notes or considerations]
`
    };
    
    return templates[filename] || `# ${filename}\n\n<!-- Spec template content -->`;
  }
  
  /**
   * Helper: Create template file
   */
  async createTemplateFile(filePath, content) {
    try {
      await fs.writeFile(filePath, content, 'utf8');
      if (this.config.verbose) {
        console.log(`Created: ${filePath}`);
      }
    } catch (error) {
      console.error(`Failed to create ${filePath}:`, error);
      throw error;
    }
  }
  
  /**
   * Helper: Ensure directory exists
   */
  async ensureDirectory(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
      if (this.config.verbose) {
        console.log(`Ensured directory: ${dirPath}`);
      }
    } catch (error) {
      console.error(`Failed to create directory ${dirPath}:`, error);
      throw error;
    }
  }
  
  /**
   * Helper: Check if path exists
   */
  async pathExists(pathToCheck) {
    try {
      await fs.access(pathToCheck);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Get summary of created structure
   */
  getSummary() {
    return {
      global: {
        base: this.globalStructure.base,
        created: this.createdPaths.global
      },
      project: {
        base: this.projectStructure.base,
        created: this.createdPaths.project
      }
    };
  }
}

module.exports = AgentOSStructureHandler;

// CLI usage if run directly
if (require.main === module) {
  const handler = new AgentOSStructureHandler({
    verbose: true,
    createGlobal: true,
    createProject: true
  });
  
  handler.createCompleteStructure()
    .then(results => {
      console.log('\n✅ Agent-OS structure created successfully!');
      console.log('\nSummary:', JSON.stringify(handler.getSummary(), null, 2));
    })
    .catch(error => {
      console.error('\n❌ Failed to create Agent-OS structure:', error);
      process.exit(1);
    });
}