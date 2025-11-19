#!/usr/bin/env node

/**
 * Quick validation script for fullstack-modern template
 * Tests configuration and structure without building
 */

const fs = require('fs').promises;
const path = require('path');

class QuickValidator {
  constructor() {
    this.templatePath = path.resolve(__dirname, '../templates/fullstack-modern');
    this.results = [];
  }

  async validateTemplate() {
    console.log('🔍 Quick Validation: Fullstack-Modern Template');
    console.log('=' .repeat(50));

    try {
      await this.validateStructure();
      await this.validateConfigurations();
      await this.validateDependencies();
      await this.generateQuickReport();
      
    } catch (error) {
      console.error('❌ Validation failed:', error);
      throw error;
    }
  }

  async validateStructure() {
    console.log('\n📁 Validating template structure...');
    
    const requiredPaths = [
      'frontend/package.json',
      'frontend/next.config.js',
      'frontend/tailwind.config.js',
      'frontend/src/app/layout.tsx',
      'frontend/src/app/page.tsx',
      'frontend/src/store/app-store.ts',
      'backend/Cargo.toml',
      'backend/src/main.rs',
      'template.config.json',
      'README.md'
    ];

    let foundPaths = 0;
    for (const requiredPath of requiredPaths) {
      try {
        await fs.access(path.join(this.templatePath, requiredPath));
        foundPaths++;
        this.recordResult('Structure', `${requiredPath} exists`, true);
      } catch (error) {
        this.recordResult('Structure', `${requiredPath} missing`, false, 'File not found');
      }
    }

    console.log(`✅ Structure validation: ${foundPaths}/${requiredPaths.length} required files found`);
  }

  async validateConfigurations() {
    console.log('\n⚙️ Validating configurations...');

    // Validate Next.js config
    try {
      const nextConfigPath = path.join(this.templatePath, 'frontend/next.config.js');
      const nextConfig = await fs.readFile(nextConfigPath, 'utf8');
      
      const requiredFeatures = ['images', 'headers', 'webpack'];
      const foundFeatures = requiredFeatures.filter(feature => nextConfig.includes(feature));
      
      this.recordResult('Config', 'Next.js configuration', foundFeatures.length >= 2, 
        `${foundFeatures.length}/${requiredFeatures.length} features configured`);
    } catch (error) {
      this.recordResult('Config', 'Next.js configuration', false, 'Config file not readable');
    }

    // Validate Tailwind config
    try {
      const tailwindConfigPath = path.join(this.templatePath, 'frontend/tailwind.config.js');
      const tailwindConfig = await fs.readFile(tailwindConfigPath, 'utf8');
      
      const requiredFeatures = ['darkMode', 'content', 'extend', 'plugins'];
      const foundFeatures = requiredFeatures.filter(feature => tailwindConfig.includes(feature));
      
      this.recordResult('Config', 'Tailwind CSS configuration', foundFeatures.length >= 3,
        `${foundFeatures.length}/${requiredFeatures.length} features configured`);
    } catch (error) {
      this.recordResult('Config', 'Tailwind CSS configuration', false, 'Config file not readable');
    }

    // Validate Cargo config
    try {
      const cargoPath = path.join(this.templatePath, 'backend/Cargo.toml');
      const cargoContent = await fs.readFile(cargoPath, 'utf8');
      
      const requiredDeps = ['axum', 'tokio', 'sqlx', 'serde'];
      const foundDeps = requiredDeps.filter(dep => cargoContent.includes(dep));
      
      this.recordResult('Config', 'Rust backend configuration', foundDeps.length >= 3,
        `${foundDeps.length}/${requiredDeps.length} dependencies configured`);
    } catch (error) {
      this.recordResult('Config', 'Rust backend configuration', false, 'Cargo.toml not readable');
    }

    console.log('✅ Configuration validation completed');
  }

  async validateDependencies() {
    console.log('\n📦 Validating dependencies...');

    // Validate frontend dependencies
    try {
      const packageJsonPath = path.join(this.templatePath, 'frontend/package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      const requiredDeps = [
        'next',
        'react',
        'react-dom',
        '@supabase/supabase-js',
        'zustand',
        'tailwindcss',
        '@radix-ui/react-slot'
      ];
      
      const foundDeps = requiredDeps.filter(dep => 
        packageJson.dependencies[dep] || packageJson.devDependencies[dep]
      );
      
      this.recordResult('Dependencies', 'Frontend dependencies', foundDeps.length >= 6,
        `${foundDeps.length}/${requiredDeps.length} required dependencies found`);
        
      // Check versions
      const hasNext14 = packageJson.dependencies['next']?.includes('14');
      const hasReact18 = packageJson.dependencies['react']?.includes('18');
      
      this.recordResult('Dependencies', 'Modern versions', hasNext14 && hasReact18,
        `Next.js 14: ${hasNext14}, React 18: ${hasReact18}`);
      
    } catch (error) {
      this.recordResult('Dependencies', 'Frontend dependencies', false, 'package.json not readable');
    }

    console.log('✅ Dependencies validation completed');
  }

  recordResult(category, test, passed, details = '') {
    this.results.push({
      category,
      test,
      passed,
      details,
      timestamp: new Date().toISOString()
    });

    const emoji = passed ? '✅' : '❌';
    console.log(`  ${emoji} ${test}${details ? ` - ${details}` : ''}`);
  }

  async generateQuickReport() {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = this.results.filter(r => !r.passed).length;
    const passRate = Math.round((passedTests / totalTests) * 100);

    console.log('\n' + '='.repeat(50));
    console.log('📊 QUICK VALIDATION RESULTS');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Pass Rate: ${passRate}%`);

    // Categorize results
    const categories = [...new Set(this.results.map(r => r.category))];
    console.log('\n📋 Category Breakdown:');
    
    categories.forEach(category => {
      const categoryResults = this.results.filter(r => r.category === category);
      const categoryPassed = categoryResults.filter(r => r.passed).length;
      const categoryTotal = categoryResults.length;
      const categoryRate = Math.round((categoryPassed / categoryTotal) * 100);
      
      const status = categoryRate >= 80 ? '✅' : categoryRate >= 60 ? '⚠️' : '❌';
      console.log(`  ${status} ${category}: ${categoryPassed}/${categoryTotal} (${categoryRate}%)`);
    });

    // Assessment
    let assessment = '';
    if (passRate >= 90) {
      assessment = '🎉 Excellent - Template is well configured';
    } else if (passRate >= 75) {
      assessment = '👍 Good - Minor issues to address';
    } else if (passRate >= 60) {
      assessment = '⚠️ Fair - Several issues need attention';
    } else {
      assessment = '❌ Poor - Significant issues present';
    }

    console.log(`\n${assessment}`);

    // Show failed tests
    const failedResults = this.results.filter(r => !r.passed);
    if (failedResults.length > 0) {
      console.log('\n❌ Failed Validations:');
      failedResults.forEach(result => {
        console.log(`  • ${result.category}: ${result.test} - ${result.details}`);
      });
    }

    // Save quick report
    const reportPath = path.join(__dirname, `quick-validation-${Date.now()}.json`);
    await fs.writeFile(reportPath, JSON.stringify({
      summary: { totalTests, passedTests, failedTests, passRate, assessment },
      results: this.results,
      timestamp: new Date().toISOString()
    }, null, 2));

    console.log(`\n📄 Report saved: ${reportPath}`);
    console.log('='.repeat(50));

    return passRate >= 75;
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new QuickValidator();
  validator.validateTemplate()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Validation failed:', error);
      process.exit(1);
    });
}

module.exports = QuickValidator;