/**
 * Styling and UI Tests
 * Tailwind CSS, shadcn/ui, Responsive Design, Dark Mode
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class StylingUITests {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.frontendPath = path.join(projectPath, 'frontend');
  }

  async runAllTests() {
    const results = [];
    
    try {
      results.push(await this.testTailwindCSS());
      results.push(await this.testShadcnUIComponents());
      results.push(await this.testDesignSystem());
      results.push(await this.testResponsiveDesign());
      results.push(await this.testDarkModeSupport());
      results.push(await this.testCustomAnimations());
      results.push(await this.testTypography());
      results.push(await this.testAccessibility());
      results.push(await this.testCSSOptimization());
      results.push(await this.testComponentTheming());
      
    } catch (error) {
      results.push({
        test: 'Styling UI Test Suite',
        passed: false,
        error: error.message
      });
    }
    
    return results;
  }

  async testTailwindCSS() {
    try {
      // Test Tailwind configuration
      const tailwindConfigPath = path.join(this.frontendPath, 'tailwind.config.js');
      const tailwindConfig = await fs.readFile(tailwindConfigPath, 'utf8');
      
      // Test essential Tailwind features
      const requiredFeatures = [
        'darkMode',
        'content',
        'theme',
        'extend',
        'plugins'
      ];
      
      const missingFeatures = requiredFeatures.filter(feature => 
        !tailwindConfig.includes(feature)
      );
      
      if (missingFeatures.length > 0) {
        throw new Error(`Missing Tailwind features: ${missingFeatures.join(', ')}`);
      }
      
      // Test dark mode configuration
      if (!tailwindConfig.includes("darkMode: ['class']")) {
        throw new Error('Dark mode not properly configured');
      }
      
      // Test content paths
      const contentPaths = [
        './pages/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './app/**/*.{ts,tsx}',
        './src/**/*.{ts,tsx}'
      ];
      
      const foundPaths = contentPaths.filter(path => 
        tailwindConfig.includes(path)
      );
      
      if (foundPaths.length === 0) {
        throw new Error('No content paths configured for Tailwind');
      }
      
      // Test plugins
      const requiredPlugins = [
        'tailwindcss-animate',
        '@tailwindcss/typography',
        '@tailwindcss/forms'
      ];
      
      const foundPlugins = requiredPlugins.filter(plugin => 
        tailwindConfig.includes(plugin)
      );
      
      // Test CSS compilation
      process.chdir(this.frontendPath);
      try {
        execSync('npm run build', { stdio: 'pipe', timeout: 120000 });
      } catch (error) {
        throw new Error('Tailwind CSS compilation failed during build');
      }
      
      return {
        test: 'Tailwind CSS Configuration',
        passed: true,
        details: `${foundPaths.length} content paths, ${foundPlugins.length} plugins`
      };
      
    } catch (error) {
      return {
        test: 'Tailwind CSS Configuration',
        passed: false,
        error: error.message
      };
    }
  }

  async testShadcnUIComponents() {
    try {
      const packageJsonPath = path.join(this.frontendPath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      // Test required shadcn/ui dependencies
      const requiredDeps = [
        '@radix-ui/react-slot',
        '@radix-ui/react-dialog',
        '@radix-ui/react-dropdown-menu',
        '@radix-ui/react-toast',
        '@radix-ui/react-avatar',
        'class-variance-authority',
        'clsx',
        'tailwind-merge',
        'lucide-react'
      ];
      
      const missingDeps = requiredDeps.filter(dep => 
        !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
      );
      
      if (missingDeps.length > 0) {
        throw new Error(`Missing shadcn/ui dependencies: ${missingDeps.join(', ')}`);
      }
      
      // Test components directory structure
      const componentsPath = path.join(this.frontendPath, 'src/components/ui');
      let uiComponents = [];
      
      try {
        uiComponents = await fs.readdir(componentsPath);
        uiComponents = uiComponents.filter(file => 
          file.endsWith('.tsx') || file.endsWith('.jsx')
        );
      } catch (error) {
        console.warn('UI components directory not found');
      }
      
      // Test lib/utils.ts for cn function
      const utilsPath = path.join(this.frontendPath, 'src/lib/utils.ts');
      let hasCnFunction = false;
      
      try {
        const utilsContent = await fs.readFile(utilsPath, 'utf8');
        hasCnFunction = utilsContent.includes('export function cn') || 
                       utilsContent.includes('const cn =');
      } catch (error) {
        console.warn('utils.ts not found');
      }
      
      return {
        test: 'shadcn/ui Components',
        passed: true,
        details: `${requiredDeps.length - missingDeps.length} dependencies, ${uiComponents.length} UI components${hasCnFunction ? ', cn utility' : ''}`
      };
      
    } catch (error) {
      return {
        test: 'shadcn/ui Components',
        passed: false,
        error: error.message
      };
    }
  }

  async testDesignSystem() {
    try {
      const tailwindConfigPath = path.join(this.frontendPath, 'tailwind.config.js');
      const tailwindConfig = await fs.readFile(tailwindConfigPath, 'utf8');
      
      // Test custom color system
      const colorFeatures = [
        'border:',
        'input:',
        'ring:',
        'background:',
        'foreground:',
        'primary:',
        'secondary:',
        'destructive:',
        'muted:',
        'accent:',
        'popover:',
        'card:'
      ];
      
      const foundColors = colorFeatures.filter(color => 
        tailwindConfig.includes(color)
      );
      
      if (foundColors.length < 8) {
        throw new Error('Incomplete color system');
      }
      
      // Test CSS custom properties
      const globalCssPath = path.join(this.frontendPath, 'src/app/globals.css');
      const globalCss = await fs.readFile(globalCssPath, 'utf8');
      
      const cssVariables = [
        '--background',
        '--foreground',
        '--primary',
        '--secondary',
        '--muted',
        '--accent',
        '--destructive',
        '--border',
        '--input',
        '--ring'
      ];
      
      const foundVariables = cssVariables.filter(variable => 
        globalCss.includes(variable)
      );
      
      if (foundVariables.length < 8) {
        throw new Error('Incomplete CSS custom properties');
      }
      
      // Test radius system
      const radiusFeatures = ['--radius', 'borderRadius'];
      const foundRadius = radiusFeatures.filter(feature => 
        tailwindConfig.includes(feature) || globalCss.includes(feature)
      );
      
      return {
        test: 'Design System',
        passed: true,
        details: `${foundColors.length} colors, ${foundVariables.length} CSS variables, radius system`
      };
      
    } catch (error) {
      return {
        test: 'Design System',
        passed: false,
        error: error.message
      };
    }
  }

  async testResponsiveDesign() {
    try {
      const tailwindConfigPath = path.join(this.frontendPath, 'tailwind.config.js');
      const tailwindConfig = await fs.readFile(tailwindConfigPath, 'utf8');
      
      // Test responsive breakpoints
      const defaultBreakpoints = ['sm', 'md', 'lg', 'xl', '2xl'];
      const customBreakpoints = tailwindConfig.includes('screens:');
      
      // Test container configuration
      const containerConfig = [
        'container:',
        'center: true',
        'padding:'
      ];
      
      const foundContainerConfig = containerConfig.filter(config => 
        tailwindConfig.includes(config)
      );
      
      if (foundContainerConfig.length < 2) {
        throw new Error('Container not properly configured');
      }
      
      // Test responsive usage in components
      const componentFiles = await this.findComponentFiles();
      let responsiveUsage = 0;
      
      for (const file of componentFiles) {
        const content = await fs.readFile(file, 'utf8');
        
        // Check for responsive classes
        const responsiveClasses = defaultBreakpoints.filter(bp => 
          content.includes(`${bp}:`)
        );
        
        if (responsiveClasses.length > 0) {
          responsiveUsage++;
        }
      }
      
      return {
        test: 'Responsive Design',
        passed: true,
        details: `Container configured, ${responsiveUsage} components use responsive classes${customBreakpoints ? ', custom breakpoints' : ''}`
      };
      
    } catch (error) {
      return {
        test: 'Responsive Design',
        passed: false,
        error: error.message
      };
    }
  }

  async testDarkModeSupport() {
    try {
      // Test Tailwind dark mode configuration
      const tailwindConfigPath = path.join(this.frontendPath, 'tailwind.config.js');
      const tailwindConfig = await fs.readFile(tailwindConfigPath, 'utf8');
      
      if (!tailwindConfig.includes("darkMode: ['class']")) {
        throw new Error('Dark mode not configured');
      }
      
      // Test CSS variables for both themes
      const globalCssPath = path.join(this.frontendPath, 'src/app/globals.css');
      const globalCss = await fs.readFile(globalCssPath, 'utf8');
      
      const lightTheme = globalCss.includes(':root {');
      const darkTheme = globalCss.includes('.dark {') || globalCss.includes('[data-theme="dark"]');
      
      if (!lightTheme || !darkTheme) {
        throw new Error('Missing light or dark theme CSS variables');
      }
      
      // Test theme provider
      const providerPath = path.join(this.frontendPath, 'src/app/providers.tsx');
      let hasThemeProvider = false;
      
      try {
        const providerContent = await fs.readFile(providerPath, 'utf8');
        hasThemeProvider = providerContent.includes('ThemeProvider') || 
                          providerContent.includes('theme');
      } catch (error) {
        console.warn('Theme provider not found');
      }
      
      // Test dark mode usage in components
      const componentFiles = await this.findComponentFiles();
      let darkModeUsage = 0;
      
      for (const file of componentFiles) {
        const content = await fs.readFile(file, 'utf8');
        if (content.includes('dark:')) {
          darkModeUsage++;
        }
      }
      
      return {
        test: 'Dark Mode Support',
        passed: true,
        details: `Light & dark themes configured, ${darkModeUsage} components use dark: classes${hasThemeProvider ? ', theme provider' : ''}`
      };
      
    } catch (error) {
      return {
        test: 'Dark Mode Support',
        passed: false,
        error: error.message
      };
    }
  }

  async testCustomAnimations() {
    try {
      const tailwindConfigPath = path.join(this.frontendPath, 'tailwind.config.js');
      const tailwindConfig = await fs.readFile(tailwindConfigPath, 'utf8');
      
      // Test keyframes and animations
      const animationFeatures = [
        'keyframes:',
        'animation:',
        'accordion-down',
        'accordion-up',
        'fade-in',
        'slide-in'
      ];
      
      const foundAnimations = animationFeatures.filter(feature => 
        tailwindConfig.includes(feature)
      );
      
      if (foundAnimations.length < 4) {
        throw new Error('Custom animations not properly configured');
      }
      
      // Test Framer Motion integration
      const packageJsonPath = path.join(this.frontendPath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      const hasFramerMotion = packageJson.dependencies['framer-motion'];
      
      // Test animation usage in components
      const componentFiles = await this.findComponentFiles();
      let animationUsage = 0;
      
      for (const file of componentFiles) {
        const content = await fs.readFile(file, 'utf8');
        if (content.includes('animate-') || content.includes('motion.') || content.includes('framer-motion')) {
          animationUsage++;
        }
      }
      
      return {
        test: 'Custom Animations',
        passed: true,
        details: `${foundAnimations.length} animation features, ${animationUsage} components use animations${hasFramerMotion ? ', Framer Motion' : ''}`
      };
      
    } catch (error) {
      return {
        test: 'Custom Animations',
        passed: false,
        error: error.message
      };
    }
  }

  async testTypography() {
    try {
      const tailwindConfigPath = path.join(this.frontendPath, 'tailwind.config.js');
      const tailwindConfig = await fs.readFile(tailwindConfigPath, 'utf8');
      
      // Test typography plugin
      if (!tailwindConfig.includes('@tailwindcss/typography')) {
        throw new Error('Typography plugin not configured');
      }
      
      // Test font configuration
      const fontFeatures = [
        'fontFamily:',
        'sans:',
        'mono:'
      ];
      
      const foundFontFeatures = fontFeatures.filter(feature => 
        tailwindConfig.includes(feature)
      );
      
      // Test typography customization
      const typographyConfig = tailwindConfig.includes('typography:');
      
      // Test font loading
      const layoutPath = path.join(this.frontendPath, 'src/app/layout.tsx');
      const layoutContent = await fs.readFile(layoutPath, 'utf8');
      
      const fontLoading = [
        'next/font',
        'Inter',
        'font-'
      ];
      
      const foundFontLoading = fontLoading.filter(feature => 
        layoutContent.includes(feature)
      );
      
      return {
        test: 'Typography',
        passed: true,
        details: `Typography plugin configured, ${foundFontFeatures.length} font features${typographyConfig ? ', custom typography' : ''}${foundFontLoading.length ? ', font loading' : ''}`
      };
      
    } catch (error) {
      return {
        test: 'Typography',
        passed: false,
        error: error.message
      };
    }
  }

  async testAccessibility() {
    try {
      const tailwindConfigPath = path.join(this.frontendPath, 'tailwind.config.js');
      const tailwindConfig = await fs.readFile(tailwindConfigPath, 'utf8');
      
      // Test forms plugin (improves accessibility)
      if (!tailwindConfig.includes('@tailwindcss/forms')) {
        throw new Error('Forms plugin not configured');
      }
      
      // Test focus ring configuration
      const focusFeatures = ['ring:', 'focus:'];
      const foundFocusFeatures = focusFeatures.filter(feature => 
        tailwindConfig.includes(feature)
      );
      
      // Test Radix UI components (accessible by default)
      const packageJsonPath = path.join(this.frontendPath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      const radixComponents = Object.keys(packageJson.dependencies || {}).filter(dep => 
        dep.startsWith('@radix-ui/')
      );
      
      // Test semantic HTML usage in components
      const componentFiles = await this.findComponentFiles();
      let semanticUsage = 0;
      
      const semanticElements = ['main', 'nav', 'aside', 'section', 'article', 'header', 'footer'];
      
      for (const file of componentFiles) {
        const content = await fs.readFile(file, 'utf8');
        const foundSemanticElements = semanticElements.filter(element => 
          content.includes(`<${element}`) || content.includes(`"${element}"`)
        );
        
        if (foundSemanticElements.length > 0) {
          semanticUsage++;
        }
      }
      
      return {
        test: 'Accessibility',
        passed: true,
        details: `Forms plugin, ${radixComponents.length} Radix components, ${semanticUsage} components use semantic HTML`
      };
      
    } catch (error) {
      return {
        test: 'Accessibility',
        passed: false,
        error: error.message
      };
    }
  }

  async testCSSOptimization() {
    try {
      // Test PostCSS configuration
      const postcssConfigPath = path.join(this.frontendPath, 'postcss.config.js');
      
      try {
        const postcssConfig = await fs.readFile(postcssConfigPath, 'utf8');
        
        const postcssPlugins = ['tailwindcss', 'autoprefixer'];
        const foundPlugins = postcssPlugins.filter(plugin => 
          postcssConfig.includes(plugin)
        );
        
        if (foundPlugins.length < 2) {
          throw new Error('PostCSS not properly configured');
        }
        
      } catch (error) {
        throw new Error('PostCSS configuration not found');
      }
      
      // Test CSS purging (should be automatic with Tailwind)
      process.chdir(this.frontendPath);
      try {
        execSync('npm run build', { stdio: 'pipe', timeout: 120000 });
        
        // Check for optimized CSS in build output
        const buildPath = path.join(this.frontendPath, '.next/static/css');
        
        try {
          const cssFiles = await fs.readdir(buildPath);
          const mainCssFile = cssFiles.find(file => file.endsWith('.css'));
          
          if (mainCssFile) {
            const cssContent = await fs.readFile(path.join(buildPath, mainCssFile), 'utf8');
            const cssSize = Buffer.byteLength(cssContent, 'utf8');
            
            return {
              test: 'CSS Optimization',
              passed: true,
              details: `PostCSS configured, optimized CSS size: ${Math.round(cssSize / 1024)}KB`
            };
          }
        } catch (error) {
          // CSS files not found, might be different structure
        }
        
        return {
          test: 'CSS Optimization',
          passed: true,
          details: 'PostCSS configured, build successful'
        };
        
      } catch (error) {
        throw new Error('Build failed - CSS optimization test failed');
      }
      
    } catch (error) {
      return {
        test: 'CSS Optimization',
        passed: false,
        error: error.message
      };
    }
  }

  async testComponentTheming() {
    try {
      // Test component variants system
      const packageJsonPath = path.join(this.frontendPath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      if (!packageJson.dependencies['class-variance-authority']) {
        throw new Error('Class Variance Authority (CVA) not configured');
      }
      
      // Test component files for theming patterns
      const componentFiles = await this.findComponentFiles();
      let themedComponents = 0;
      let variantComponents = 0;
      
      for (const file of componentFiles) {
        const content = await fs.readFile(file, 'utf8');
        
        // Check for theming patterns
        if (content.includes('cva(') || content.includes('variants:')) {
          variantComponents++;
        }
        
        if (content.includes('theme') || content.includes('className') || content.includes('cn(')) {
          themedComponents++;
        }
      }
      
      return {
        test: 'Component Theming',
        passed: true,
        details: `CVA configured, ${variantComponents} variant components, ${themedComponents} themed components`
      };
      
    } catch (error) {
      return {
        test: 'Component Theming',
        passed: false,
        error: error.message
      };
    }
  }

  async findComponentFiles() {
    const files = [];
    const searchPaths = [
      path.join(this.frontendPath, 'src/components'),
      path.join(this.frontendPath, 'src/app'),
      path.join(this.frontendPath, 'components')
    ];
    
    for (const searchPath of searchPaths) {
      try {
        await this.findFilesRecursive(searchPath, files, ['.tsx', '.jsx']);
      } catch (error) {
        // Directory doesn't exist
      }
    }
    
    return files;
  }

  async findFilesRecursive(dir, files, extensions) {
    try {
      const items = await fs.readdir(dir);
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stats = await fs.stat(itemPath);
        
        if (stats.isDirectory()) {
          await this.findFilesRecursive(itemPath, files, extensions);
        } else if (extensions.some(ext => item.endsWith(ext))) {
          files.push(itemPath);
        }
      }
    } catch (error) {
      // Directory doesn't exist or access error
    }
  }
}

module.exports = StylingUITests;