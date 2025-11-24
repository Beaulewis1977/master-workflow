/**
 * LoopSelector - Automatic Loop Profile Recommendation
 * =====================================================
 * Analyzes project state and recommends the best build loop profile.
 * Part of the Build Loop System for Master Workflow 3.0.
 */

import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';

export class LoopSelector extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      configPath: options.configPath || './configs/build-loops.yaml',
      verbose: options.verbose || false
    };
    
    this.profiles = null;
    this.projectConfig = null;
  }

  log(msg) { if (this.options.verbose) console.log(msg); }

  async loadProfiles() {
    // Use built-in profiles (YAML config is optional enhancement)
    this.profiles = this.getBuiltInProfiles();
    this.log(`✅ Loaded ${Object.keys(this.profiles).length} loop profiles`);
    return this.profiles;
  }

  getBuiltInProfiles() {
    return {
      planning: {
        name: 'Architecture & Planning Loop',
        shortName: 'planning',
        maxIterations: 8,
        phases: ['gather', 'architecture', 'prd', 'roadmap']
      },
      'spec-driven': {
        name: 'Spec-Driven App Build Loop',
        shortName: 'spec-driven',
        maxIterations: 10,
        phases: ['intent', 'analysis', 'specs', 'implementation', 'testing', 'refinement']
      },
      tdd: {
        name: 'Incremental TDD Loop',
        shortName: 'tdd',
        maxIterations: 20,
        phases: ['red', 'green', 'refactor', 'coverage']
      },
      'legacy-rescue': {
        name: 'Legacy Rescue Loop',
        shortName: 'legacy-rescue',
        maxIterations: 30,
        phases: ['discovery', 'characterization', 'strangler', 'modernize', 'validate']
      },
      polish: {
        name: 'Polish & Optimization Loop',
        shortName: 'polish',
        maxIterations: 15,
        phases: ['baseline', 'analyze', 'optimize', 'measure', 'document']
      }
    };
  }

  async loadProjectConfig(projectPath) {
    try {
      const configPath = path.join(projectPath, '.ai-workflow', 'configs', 'build-loop.json');
      const content = await fs.readFile(configPath, 'utf8');
      this.projectConfig = JSON.parse(content);
      this.log(`✅ Loaded project-specific loop config`);
      return this.projectConfig;
    } catch {
      this.projectConfig = null;
      return null;
    }
  }

  /**
   * Select the best loop profile based on project analysis
   * @param {Object} analysis - Project analysis from ProjectAnalyzer
   * @param {Object} options - Selection options
   * @returns {Object} Recommended loop profile with reasoning
   */
  async selectLoop(analysis, options = {}) {
    if (!this.profiles) await this.loadProfiles();
    
    this.log('🔍 Analyzing project to select best loop profile...');
    
    // Calculate project characteristics
    const characteristics = this.analyzeCharacteristics(analysis);
    
    // Check for user override
    if (options.forceLoop && this.profiles[options.forceLoop]) {
      return {
        profile: options.forceLoop,
        profileData: this.profiles[options.forceLoop],
        confidence: 1.0,
        reason: 'User specified loop profile',
        characteristics,
        alternatives: []
      };
    }

    // Check project-level config override
    if (this.projectConfig?.defaultProfile) {
      const profile = this.projectConfig.defaultProfile;
      if (this.profiles[profile]) {
        return {
          profile,
          profileData: this.profiles[profile],
          confidence: 0.95,
          reason: 'Project configuration default',
          characteristics,
          alternatives: this.getAlternatives(profile)
        };
      }
    }

    // Apply selection rules
    const selection = this.applySelectionRules(characteristics);
    
    this.emit('loop:selected', selection);
    return selection;
  }

  analyzeCharacteristics(analysis) {
    const structure = analysis.structure || {};
    const metrics = analysis.metrics || {};
    const gaps = analysis.gaps || [];
    const patterns = analysis.patterns || {};
    const docs = analysis.documentation || {};
    const components = analysis.components || {};

    // Calculate complexity score (0-100)
    const fileCount = structure.totalFiles || 0;
    const componentCount = Object.keys(components).length;
    let complexityScore = 0;
    
    if (fileCount > 500) complexityScore += 30;
    else if (fileCount > 100) complexityScore += 20;
    else if (fileCount > 20) complexityScore += 10;
    
    if (componentCount > 200) complexityScore += 30;
    else if (componentCount > 50) complexityScore += 20;
    else if (componentCount > 10) complexityScore += 10;
    
    const depth = structure.depth || 0;
    if (depth > 8) complexityScore += 20;
    else if (depth > 5) complexityScore += 10;
    
    complexityScore = Math.min(100, complexityScore);

    // Determine project stage
    let stage = 'idea';
    if (fileCount > 100 && componentCount > 50) stage = 'mature';
    else if (fileCount > 20 && componentCount > 10) stage = 'active';
    else if (fileCount > 5) stage = 'early';

    // Calculate documentation quality
    const docCount = Object.keys(docs).length;
    const hasReadme = Object.keys(docs).some(k => k.toLowerCase().includes('readme'));
    const hasArchDocs = Object.keys(docs).some(k => 
      k.toLowerCase().includes('architecture') || k.toLowerCase().includes('design')
    );
    
    let docQuality = 0;
    if (hasReadme) docQuality += 30;
    if (hasArchDocs) docQuality += 30;
    if (docCount > 10) docQuality += 20;
    else if (docCount > 5) docQuality += 10;
    docQuality = Math.min(100, docQuality);

    // Test coverage
    const testCoverage = metrics.quality?.testCoverage || 0;

    // Architecture clarity
    const hasArchPattern = (patterns.architectural?.length || 0) > 0;

    // Check for legacy indicators
    const isLegacy = this.detectLegacyIndicators(analysis);

    return {
      complexityScore,
      stage,
      docQuality,
      testCoverage,
      hasArchPattern,
      isLegacy,
      fileCount,
      componentCount,
      gapCount: gaps.length,
      frameworks: structure.frameworks || [],
      languages: structure.languages || {}
    };
  }

  detectLegacyIndicators(analysis) {
    const indicators = [];
    const structure = analysis.structure || {};
    const metrics = analysis.metrics || {};
    const deps = analysis.dependencies || {};

    // Low test coverage
    if ((metrics.quality?.testCoverage || 0) < 20) {
      indicators.push('low_test_coverage');
    }

    // High file count with low structure
    if ((structure.totalFiles || 0) > 200 && (structure.depth || 0) < 4) {
      indicators.push('flat_structure');
    }

    // Old dependencies (check for common old patterns)
    const prodDeps = deps.node?.production || {};
    if (prodDeps.jquery || prodDeps.backbone || prodDeps.angular && !prodDeps['@angular/core']) {
      indicators.push('old_frameworks');
    }

    // No clear architecture
    if ((analysis.patterns?.architectural?.length || 0) === 0 && (structure.totalFiles || 0) > 50) {
      indicators.push('no_architecture');
    }

    return {
      isLegacy: indicators.length >= 2,
      indicators,
      score: indicators.length
    };
  }

  applySelectionRules(characteristics) {
    const {
      complexityScore,
      stage,
      docQuality,
      testCoverage,
      hasArchPattern,
      isLegacy
    } = characteristics;

    let profile, confidence, reason;
    const factors = [];

    // Rule 1: Legacy rescue for problematic codebases
    if (isLegacy.isLegacy && complexityScore >= 70) {
      profile = 'legacy-rescue';
      confidence = 0.85;
      reason = 'Legacy codebase detected with high complexity';
      factors.push('legacy indicators', 'high complexity');
    }
    // Rule 2: Planning loop for early stage or poor documentation
    else if (stage === 'idea' || stage === 'early' || docQuality < 30) {
      profile = 'planning';
      confidence = 0.9;
      reason = 'Early stage project or insufficient documentation';
      factors.push(`stage: ${stage}`, `doc quality: ${docQuality}%`);
    }
    // Rule 3: Spec-driven for new/low complexity with decent docs
    else if (complexityScore <= 40 && (stage === 'early' || stage === 'active') && docQuality >= 30) {
      profile = 'spec-driven';
      confidence = 0.85;
      reason = 'New or active project with manageable complexity';
      factors.push(`complexity: ${complexityScore}`, `stage: ${stage}`);
    }
    // Rule 4: TDD for active/mature with decent coverage
    else if ((stage === 'active' || stage === 'mature') && testCoverage >= 30) {
      profile = 'tdd';
      confidence = 0.8;
      reason = 'Active project with existing test infrastructure';
      factors.push(`stage: ${stage}`, `test coverage: ${testCoverage}%`);
    }
    // Rule 5: Polish for mature projects
    else if (stage === 'mature' && testCoverage >= 50 && hasArchPattern) {
      profile = 'polish';
      confidence = 0.85;
      reason = 'Mature project ready for optimization';
      factors.push('mature stage', 'good test coverage', 'clear architecture');
    }
    // Rule 6: Legacy rescue for high complexity without tests
    else if (complexityScore >= 70 && testCoverage < 30) {
      profile = 'legacy-rescue';
      confidence = 0.75;
      reason = 'High complexity with low test coverage';
      factors.push(`complexity: ${complexityScore}`, `test coverage: ${testCoverage}%`);
    }
    // Default: spec-driven
    else {
      profile = 'spec-driven';
      confidence = 0.7;
      reason = 'Default recommendation for general development';
      factors.push('default selection');
    }

    return {
      profile,
      profileData: this.profiles[profile],
      confidence,
      reason,
      factors,
      characteristics,
      alternatives: this.getAlternatives(profile)
    };
  }

  getAlternatives(selectedProfile) {
    const allProfiles = Object.keys(this.profiles);
    return allProfiles
      .filter(p => p !== selectedProfile)
      .map(p => ({
        profile: p,
        name: this.profiles[p].name || p
      }));
  }

  /**
   * Get profile for a specific path/module (supports per-area overrides)
   */
  getProfileForPath(filePath) {
    if (!this.projectConfig?.overrides) return null;

    for (const [pattern, profile] of Object.entries(this.projectConfig.overrides)) {
      // Escape regex special chars except *, then convert * to .*
      const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped.replace(/\*/g, '.*'));
      if (regex.test(filePath)) {
        return {
          profile,
          profileData: this.profiles[profile],
          reason: `Path override: ${pattern}`
        };
      }
    }
    return null;
  }

  /**
   * Get all available profiles
   */
  getAvailableProfiles() {
    if (!this.profiles) this.loadProfiles();
    return Object.entries(this.profiles).map(([key, profile]) => ({
      key,
      name: profile.name,
      shortName: profile.shortName,
      description: profile.description,
      maxIterations: profile.maxIterations,
      phases: profile.phases?.map(p => p.name || p) || []
    }));
  }

  /**
   * Validate a profile exists
   */
  isValidProfile(profileName) {
    if (!this.profiles) this.loadProfiles();
    return !!this.profiles[profileName];
  }

  /**
   * Get profile details
   */
  getProfile(profileName) {
    if (!this.profiles) this.loadProfiles();
    return this.profiles[profileName] || null;
  }
}

export default LoopSelector;
