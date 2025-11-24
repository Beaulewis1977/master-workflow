/**
 * ImplementationPlanner - Project Planning Engine
 * ================================================
 * Creates detailed implementation plans from project analysis.
 * Part of the Autonomous Documentation & Spec-Driven Development System.
 */

import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';

export class ImplementationPlanner extends EventEmitter {
  constructor(projectAnalysis, options = {}) {
    super();
    this.analysis = projectAnalysis;
    this.options = {
      outputDir: options.outputDir || './plans',
      strategy: options.strategy || 'incremental', // incremental, parallel, waterfall
      defaultPhaseDuration: options.defaultPhaseDuration || '1 week',
      maxParallelTasks: options.maxParallelTasks || 5,
      includeBuffer: options.includeBuffer !== false,
      bufferPercentage: options.bufferPercentage || 20,
      riskTolerance: options.riskTolerance || 'medium',
      verbose: options.verbose || false
    };
    this.plans = new Map();
  }

  log(msg) { if (this.options.verbose) console.log(msg); }

  async generateAllPlans() {
    this.log('📅 Generating implementation plans...');
    this.emit('planning:start');

    try {
      await this.generateMasterPlan();
      await this.generatePhasePlans();
      await this.generateResourceAllocation();
      await this.generateRiskAssessment();
      await this.generateTimeline();
      await this.generateMilestones();

      this.log('✅ Implementation planning completed');
      this.emit('planning:complete', { plans: Array.from(this.plans.keys()) });
      return this.plans;
    } catch (error) {
      this.emit('planning:error', error);
      throw error;
    }
  }

  async generateMasterPlan() {
    this.log('📋 Generating master implementation plan...');
    const gaps = this.analysis.gaps || [];
    const components = Object.values(this.analysis.components || {});
    const metrics = this.analysis.metrics || {};

    let content = `# Master Implementation Plan\n\n`;
    content += `**Generated:** ${new Date().toISOString()}\n`;
    content += `**Strategy:** ${this.options.strategy}\n`;
    content += `**Risk Tolerance:** ${this.options.riskTolerance}\n\n`;

    // Executive Summary
    content += `## Executive Summary\n\n`;
    content += `This plan outlines the implementation strategy for the project based on automated analysis.\n\n`;
    content += `### Key Metrics\n\n`;
    content += `| Metric | Value |\n`;
    content += `|--------|-------|\n`;
    content += `| Total Components | ${components.length} |\n`;
    content += `| Identified Gaps | ${gaps.length} |\n`;
    content += `| Estimated Complexity | ${metrics.complexity?.estimated || 'medium'} |\n`;
    content += `| Test Coverage | ~${metrics.quality?.testCoverage || 0}% |\n\n`;

    // Priorities
    content += `## Priorities\n\n`;
    content += `Based on gap analysis, the following priorities are identified:\n\n`;
    
    const prioritizedGaps = [...gaps].sort((a, b) => a.priority - b.priority);
    for (const gap of prioritizedGaps) {
      content += `### Priority ${gap.priority}: ${gap.type}\n\n`;
      content += `- **Severity:** ${gap.severity}\n`;
      content += `- **Description:** ${gap.description}\n`;
      content += `- **Recommendation:** ${gap.recommendation || 'Address this gap'}\n\n`;
    }

    // Phases Overview
    content += `## Implementation Phases\n\n`;
    const phases = this.calculatePhases();
    
    content += `| Phase | Focus | Duration | Dependencies |\n`;
    content += `|-------|-------|----------|-------------|\n`;
    for (const phase of phases) {
      content += `| ${phase.name} | ${phase.focus} | ${phase.duration} | ${phase.dependencies.join(', ') || 'None'} |\n`;
    }
    content += '\n';

    // Success Criteria
    content += `## Success Criteria\n\n`;
    content += `| Criterion | Target | Measurement |\n`;
    content += `|-----------|--------|-------------|\n`;
    content += `| Test Coverage | 80% | Automated coverage report |\n`;
    content += `| Documentation | 90% | Doc coverage analysis |\n`;
    content += `| Code Quality | A grade | Linting + static analysis |\n`;
    content += `| Performance | Baseline +20% | Benchmark tests |\n\n`;

    // Risks Summary
    content += `## Risk Summary\n\n`;
    const risks = this.identifyRisks();
    content += `| Risk | Impact | Probability | Mitigation |\n`;
    content += `|------|--------|-------------|------------|\n`;
    for (const risk of risks.slice(0, 5)) {
      content += `| ${risk.name} | ${risk.impact} | ${risk.probability} | ${risk.mitigation} |\n`;
    }
    content += '\n';

    this.plans.set('IMPLEMENTATION_PLAN.md', content);
    this.emit('plan:generated', { name: 'IMPLEMENTATION_PLAN.md' });
  }

  async generatePhasePlans() {
    this.log('📊 Generating phase plans...');
    const phases = this.calculatePhases();

    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      let content = `# Phase ${i + 1}: ${phase.name}\n\n`;
      content += `**Duration:** ${phase.duration}\n`;
      content += `**Focus:** ${phase.focus}\n`;
      content += `**Dependencies:** ${phase.dependencies.join(', ') || 'None'}\n\n`;

      content += `## Objectives\n\n`;
      for (const obj of phase.objectives) {
        content += `- ${obj}\n`;
      }
      content += '\n';

      content += `## Tasks\n\n`;
      content += `| ID | Task | Priority | Estimate | Assignee |\n`;
      content += `|----|------|----------|----------|----------|\n`;
      for (const task of phase.tasks) {
        content += `| ${task.id} | ${task.name} | ${task.priority} | ${task.estimate} | TBD |\n`;
      }
      content += '\n';

      content += `## Deliverables\n\n`;
      for (const del of phase.deliverables) {
        content += `- [ ] ${del}\n`;
      }
      content += '\n';

      content += `## Exit Criteria\n\n`;
      for (const criteria of phase.exitCriteria) {
        content += `- [ ] ${criteria}\n`;
      }
      content += '\n';

      this.plans.set(`PHASE_${i + 1}_PLAN.md`, content);
    }
  }

  async generateResourceAllocation() {
    this.log('👥 Generating resource allocation...');
    const components = Object.values(this.analysis.components || {});
    const complexity = this.analysis.metrics?.complexity?.estimated || 'medium';

    let content = `# Resource Allocation\n\n`;
    content += `**Generated:** ${new Date().toISOString()}\n\n`;

    content += `## Team Structure\n\n`;
    const teamSize = this.estimateTeamSize(complexity, components.length);
    
    content += `### Recommended Team\n\n`;
    content += `| Role | Count | Responsibilities |\n`;
    content += `|------|-------|------------------|\n`;
    content += `| Tech Lead | 1 | Architecture, code review, mentoring |\n`;
    content += `| Senior Developer | ${teamSize.senior} | Core implementation, complex features |\n`;
    content += `| Developer | ${teamSize.mid} | Feature implementation, testing |\n`;
    content += `| QA Engineer | ${teamSize.qa} | Testing, quality assurance |\n`;
    content += `| DevOps | ${teamSize.devops} | CI/CD, deployment, monitoring |\n\n`;

    content += `## Skill Requirements\n\n`;
    const skills = this.identifyRequiredSkills();
    content += `| Skill | Level | Priority |\n`;
    content += `|-------|-------|----------|\n`;
    for (const skill of skills) {
      content += `| ${skill.name} | ${skill.level} | ${skill.priority} |\n`;
    }
    content += '\n';

    content += `## Time Allocation\n\n`;
    content += `| Activity | Percentage |\n`;
    content += `|----------|------------|\n`;
    content += `| Development | 50% |\n`;
    content += `| Testing | 20% |\n`;
    content += `| Code Review | 15% |\n`;
    content += `| Documentation | 10% |\n`;
    content += `| Meetings | 5% |\n\n`;

    content += `## Budget Considerations\n\n`;
    content += `- Development tools and licenses\n`;
    content += `- Cloud infrastructure costs\n`;
    content += `- Third-party service subscriptions\n`;
    content += `- Training and upskilling\n`;

    this.plans.set('RESOURCE_ALLOCATION.md', content);
    this.emit('plan:generated', { name: 'RESOURCE_ALLOCATION.md' });
  }

  async generateRiskAssessment() {
    this.log('⚠️ Generating risk assessment...');
    const risks = this.identifyRisks();

    let content = `# Risk Assessment\n\n`;
    content += `**Generated:** ${new Date().toISOString()}\n\n`;

    content += `## Risk Matrix\n\n`;
    content += `| ID | Risk | Category | Impact | Probability | Score | Status |\n`;
    content += `|----|------|----------|--------|-------------|-------|--------|\n`;
    
    for (let i = 0; i < risks.length; i++) {
      const risk = risks[i];
      const score = this.calculateRiskScore(risk);
      content += `| R-${String(i + 1).padStart(3, '0')} | ${risk.name} | ${risk.category} | ${risk.impact} | ${risk.probability} | ${score} | Open |\n`;
    }
    content += '\n';

    content += `## Risk Details\n\n`;
    for (let i = 0; i < risks.length; i++) {
      const risk = risks[i];
      content += `### R-${String(i + 1).padStart(3, '0')}: ${risk.name}\n\n`;
      content += `- **Category:** ${risk.category}\n`;
      content += `- **Impact:** ${risk.impact}\n`;
      content += `- **Probability:** ${risk.probability}\n`;
      content += `- **Description:** ${risk.description}\n`;
      content += `- **Mitigation:** ${risk.mitigation}\n`;
      content += `- **Contingency:** ${risk.contingency}\n`;
      content += `- **Owner:** TBD\n\n`;
    }

    content += `## Risk Response Strategies\n\n`;
    content += `| Strategy | When to Use |\n`;
    content += `|----------|-------------|\n`;
    content += `| Avoid | High impact, high probability risks |\n`;
    content += `| Mitigate | Medium-high risks with clear actions |\n`;
    content += `| Transfer | Risks better handled by third parties |\n`;
    content += `| Accept | Low impact or low probability risks |\n`;

    this.plans.set('RISK_ASSESSMENT.md', content);
    this.emit('plan:generated', { name: 'RISK_ASSESSMENT.md' });
  }

  async generateTimeline() {
    this.log('📆 Generating timeline...');
    const phases = this.calculatePhases();

    let content = `# Project Timeline\n\n`;
    content += `**Generated:** ${new Date().toISOString()}\n\n`;

    content += `## Timeline Overview\n\n`;
    content += `\`\`\`\n`;
    
    let weekOffset = 0;
    for (const phase of phases) {
      const weeks = this.parseDuration(phase.duration);
      const bar = '█'.repeat(weeks * 2);
      const spaces = ' '.repeat(weekOffset * 2);
      content += `${phase.name.padEnd(20)} ${spaces}${bar} (Week ${weekOffset + 1}-${weekOffset + weeks})\n`;
      weekOffset += weeks;
    }
    content += `\`\`\`\n\n`;

    const totalWeeks = weekOffset;
    const bufferWeeks = this.options.includeBuffer ? Math.ceil(totalWeeks * this.options.bufferPercentage / 100) : 0;

    content += `## Summary\n\n`;
    content += `| Metric | Value |\n`;
    content += `|--------|-------|\n`;
    content += `| Total Phases | ${phases.length} |\n`;
    content += `| Estimated Duration | ${totalWeeks} weeks |\n`;
    content += `| Buffer | ${bufferWeeks} weeks (${this.options.bufferPercentage}%) |\n`;
    content += `| Total with Buffer | ${totalWeeks + bufferWeeks} weeks |\n\n`;

    content += `## Detailed Schedule\n\n`;
    content += `| Phase | Start | End | Duration |\n`;
    content += `|-------|-------|-----|----------|\n`;
    
    let currentWeek = 1;
    for (const phase of phases) {
      const weeks = this.parseDuration(phase.duration);
      content += `| ${phase.name} | Week ${currentWeek} | Week ${currentWeek + weeks - 1} | ${phase.duration} |\n`;
      currentWeek += weeks;
    }
    if (bufferWeeks > 0) {
      content += `| Buffer | Week ${currentWeek} | Week ${currentWeek + bufferWeeks - 1} | ${bufferWeeks} weeks |\n`;
    }
    content += '\n';

    content += `## Key Dates\n\n`;
    content += `- **Project Start:** Week 1\n`;
    content += `- **MVP Ready:** Week ${Math.ceil(totalWeeks * 0.6)}\n`;
    content += `- **Feature Complete:** Week ${totalWeeks}\n`;
    content += `- **Final Delivery:** Week ${totalWeeks + bufferWeeks}\n`;

    this.plans.set('TIMELINE.md', content);
    this.emit('plan:generated', { name: 'TIMELINE.md' });
  }

  async generateMilestones() {
    this.log('🎯 Generating milestones...');
    const phases = this.calculatePhases();

    let content = `# Project Milestones\n\n`;
    content += `**Generated:** ${new Date().toISOString()}\n\n`;

    content += `## Milestone Overview\n\n`;
    content += `| ID | Milestone | Target | Status | Criteria |\n`;
    content += `|----|-----------|--------|--------|----------|\n`;

    let weekOffset = 0;
    const milestones = [];

    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      const weeks = this.parseDuration(phase.duration);
      weekOffset += weeks;

      const milestone = {
        id: `M-${String(i + 1).padStart(3, '0')}`,
        name: `${phase.name} Complete`,
        target: `Week ${weekOffset}`,
        criteria: phase.exitCriteria
      };
      milestones.push(milestone);
      
      content += `| ${milestone.id} | ${milestone.name} | ${milestone.target} | Pending | ${milestone.criteria.length} criteria |\n`;
    }
    content += '\n';

    content += `## Milestone Details\n\n`;
    for (const milestone of milestones) {
      content += `### ${milestone.id}: ${milestone.name}\n\n`;
      content += `**Target:** ${milestone.target}\n\n`;
      content += `**Success Criteria:**\n`;
      for (const criteria of milestone.criteria) {
        content += `- [ ] ${criteria}\n`;
      }
      content += '\n';
    }

    content += `## Critical Path\n\n`;
    content += `The following milestones are on the critical path:\n\n`;
    for (const milestone of milestones) {
      content += `1. **${milestone.name}** - ${milestone.target}\n`;
    }

    this.plans.set('MILESTONES.md', content);
    this.emit('plan:generated', { name: 'MILESTONES.md' });
  }

  async savePlans(outputDir) {
    const dir = outputDir || this.options.outputDir;
    this.log(`💾 Saving plans to ${dir}...`);

    await fs.mkdir(dir, { recursive: true });

    for (const [filename, content] of this.plans) {
      const filePath = path.join(dir, filename);
      await fs.writeFile(filePath, content, 'utf8');
      this.log(`   ✅ Saved: ${filePath}`);
    }

    this.emit('save:complete', { dir, files: Array.from(this.plans.keys()) });
  }

  // Helper methods
  calculatePhases() {
    const gaps = this.analysis.gaps || [];
    const complexity = this.analysis.metrics?.complexity?.estimated || 'medium';
    const phases = [];

    // Phase 1: Foundation
    phases.push({
      name: 'Foundation',
      focus: 'Setup and infrastructure',
      duration: complexity === 'high' ? '2 weeks' : '1 week',
      dependencies: [],
      objectives: ['Set up development environment', 'Configure CI/CD', 'Establish coding standards'],
      tasks: [
        { id: 'T-001', name: 'Environment setup', priority: 'High', estimate: '2d' },
        { id: 'T-002', name: 'CI/CD configuration', priority: 'High', estimate: '2d' },
        { id: 'T-003', name: 'Code standards documentation', priority: 'Medium', estimate: '1d' }
      ],
      deliverables: ['Development environment', 'CI/CD pipeline', 'Coding standards doc'],
      exitCriteria: ['All team members can build locally', 'CI pipeline runs on commits', 'Standards documented']
    });

    // Phase 2: Core Implementation
    phases.push({
      name: 'Core Implementation',
      focus: 'Core features and functionality',
      duration: complexity === 'high' ? '4 weeks' : complexity === 'medium' ? '3 weeks' : '2 weeks',
      dependencies: ['Foundation'],
      objectives: ['Implement core features', 'Write unit tests', 'Initial documentation'],
      tasks: [
        { id: 'T-004', name: 'Core module implementation', priority: 'High', estimate: '1w' },
        { id: 'T-005', name: 'Unit test coverage', priority: 'High', estimate: '3d' },
        { id: 'T-006', name: 'API documentation', priority: 'Medium', estimate: '2d' }
      ],
      deliverables: ['Core modules', 'Unit tests', 'API docs'],
      exitCriteria: ['Core features working', '70% test coverage', 'API documented']
    });

    // Phase 3: Integration
    phases.push({
      name: 'Integration',
      focus: 'Component integration and testing',
      duration: '2 weeks',
      dependencies: ['Core Implementation'],
      objectives: ['Integrate components', 'Integration testing', 'Performance baseline'],
      tasks: [
        { id: 'T-007', name: 'Component integration', priority: 'High', estimate: '1w' },
        { id: 'T-008', name: 'Integration tests', priority: 'High', estimate: '3d' },
        { id: 'T-009', name: 'Performance benchmarks', priority: 'Medium', estimate: '2d' }
      ],
      deliverables: ['Integrated system', 'Integration tests', 'Performance baseline'],
      exitCriteria: ['All components integrated', 'Integration tests pass', 'Baseline established']
    });

    // Phase 4: Polish
    phases.push({
      name: 'Polish & Release',
      focus: 'Quality assurance and release prep',
      duration: '1 week',
      dependencies: ['Integration'],
      objectives: ['Bug fixes', 'Documentation completion', 'Release preparation'],
      tasks: [
        { id: 'T-010', name: 'Bug fixes', priority: 'High', estimate: '3d' },
        { id: 'T-011', name: 'Documentation review', priority: 'Medium', estimate: '2d' },
        { id: 'T-012', name: 'Release preparation', priority: 'High', estimate: '2d' }
      ],
      deliverables: ['Stable release', 'Complete documentation', 'Release notes'],
      exitCriteria: ['No critical bugs', 'Documentation complete', 'Release ready']
    });

    return phases;
  }

  identifyRisks() {
    const risks = [];
    const gaps = this.analysis.gaps || [];
    const metrics = this.analysis.metrics || {};

    // Technical risks
    if (metrics.quality?.testCoverage < 50) {
      risks.push({
        name: 'Low Test Coverage',
        category: 'Technical',
        impact: 'High',
        probability: 'High',
        description: 'Current test coverage is below 50%, increasing regression risk',
        mitigation: 'Implement comprehensive test suite before major changes',
        contingency: 'Manual testing for critical paths'
      });
    }

    if (gaps.find(g => g.type === 'documentation')) {
      risks.push({
        name: 'Documentation Gap',
        category: 'Knowledge',
        impact: 'Medium',
        probability: 'High',
        description: 'Insufficient documentation may slow onboarding and maintenance',
        mitigation: 'Generate and maintain documentation alongside code',
        contingency: 'Pair programming for knowledge transfer'
      });
    }

    // Standard risks
    risks.push({
      name: 'Scope Creep',
      category: 'Project',
      impact: 'High',
      probability: 'Medium',
      description: 'Uncontrolled changes to project scope',
      mitigation: 'Strict change control process',
      contingency: 'Prioritize and defer non-critical features'
    });

    risks.push({
      name: 'Technical Debt',
      category: 'Technical',
      impact: 'Medium',
      probability: 'High',
      description: 'Accumulation of shortcuts and workarounds',
      mitigation: 'Regular refactoring sprints',
      contingency: 'Document debt for future resolution'
    });

    risks.push({
      name: 'Resource Availability',
      category: 'Resource',
      impact: 'High',
      probability: 'Low',
      description: 'Key team members unavailable',
      mitigation: 'Cross-training and documentation',
      contingency: 'Contractor backup plan'
    });

    return risks;
  }

  calculateRiskScore(risk) {
    const impactScores = { 'Low': 1, 'Medium': 2, 'High': 3 };
    const probScores = { 'Low': 1, 'Medium': 2, 'High': 3 };
    const score = (impactScores[risk.impact] || 2) * (probScores[risk.probability] || 2);
    if (score >= 6) return 'Critical';
    if (score >= 4) return 'High';
    if (score >= 2) return 'Medium';
    return 'Low';
  }

  estimateTeamSize(complexity, componentCount) {
    if (complexity === 'high' || componentCount > 100) {
      return { senior: 2, mid: 3, qa: 2, devops: 1 };
    }
    if (complexity === 'medium' || componentCount > 50) {
      return { senior: 1, mid: 2, qa: 1, devops: 1 };
    }
    return { senior: 1, mid: 1, qa: 1, devops: 0 };
  }

  identifyRequiredSkills() {
    const skills = [];
    const deps = this.analysis.dependencies?.node?.production || {};
    const frameworks = this.analysis.structure?.frameworks || [];

    skills.push({ name: 'JavaScript/TypeScript', level: 'Advanced', priority: 'Required' });
    
    if (frameworks.includes('React')) skills.push({ name: 'React', level: 'Intermediate', priority: 'Required' });
    if (frameworks.includes('Vue')) skills.push({ name: 'Vue.js', level: 'Intermediate', priority: 'Required' });
    if (frameworks.includes('Express') || frameworks.includes('Fastify')) {
      skills.push({ name: 'Node.js Backend', level: 'Advanced', priority: 'Required' });
    }
    if (deps.mongodb || deps.mongoose) skills.push({ name: 'MongoDB', level: 'Intermediate', priority: 'Required' });
    if (deps.pg) skills.push({ name: 'PostgreSQL', level: 'Intermediate', priority: 'Required' });
    
    skills.push({ name: 'Git', level: 'Intermediate', priority: 'Required' });
    skills.push({ name: 'Testing', level: 'Intermediate', priority: 'Required' });
    skills.push({ name: 'CI/CD', level: 'Basic', priority: 'Preferred' });

    return skills;
  }

  parseDuration(duration) {
    const match = duration.match(/(\d+)\s*(weeks?|days?|months?)/i);
    if (!match) return 1;
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    if (unit.startsWith('day')) return Math.ceil(value / 5);
    if (unit.startsWith('month')) return value * 4;
    return value; // weeks
  }
}

export default ImplementationPlanner;
