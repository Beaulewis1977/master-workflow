# React Project Template Customization Example

## Input: React Frontend Project Detection

```bash
# Project structure detected:
src/
├── components/
│   ├── App.jsx
│   └── Header.jsx
├── hooks/
│   └── useApi.js
├── pages/
│   └── Home.jsx
├── styles/
│   └── global.css
├── package.json
├── vite.config.js
└── README.md
```

```json
// package.json dependencies detected:
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "axios": "^1.3.0"
  },
  "devDependencies": {
    "vite": "^4.1.0",
    "@vitejs/plugin-react": "^3.1.0",
    "eslint": "^8.35.0"
  }
}
```

## Analysis Results

```javascript
// Automated analysis output:
{
  "complexity": 35,
  "stage": "active",
  "languages": ["JavaScript", "JSX"],
  "frameworks": ["React", "Vite"],
  "testingTools": ["ESLint"],
  "patterns": {
    "hooks": ["useState", "useEffect", "useApi"],
    "routing": ["react-router-dom"],
    "stateManagement": "built-in-hooks",
    "styling": "CSS"
  },
  "architecture": "component-based-spa"
}
```

## Generated CLAUDE.md

```markdown
# Claude Configuration - React Frontend Project (active Stage)

## Phase 3 Complete: Deep Analysis & Document Generation ✅
- **Implementation Date**: August 14, 2025
- **Implementer**: Claude (Autonomous Workflow System)
- **Status**: Successfully completed with comprehensive analysis

### Queen Controller Features
- **6 Concurrent Sub-Agents**: Optimal for frontend development
- **200k Context Windows**: Each agent tracks individual context
- **Hierarchical Management**: Queen Controller orchestrates all agents
- **Shared Memory Store**: Cross-agent data sharing with SQLite persistence
- **Event-Driven Architecture**: Real-time agent coordination

## Project Analysis
- **Complexity Score**: 35/100
- **Stage**: active
- **Selected Approach**: hive-mind
- **Architecture**: component-based-spa
- **Command**: `npx --yes claude-flow@latest hive-mind spawn "React-App" --agents 6 --claude`

## Technology Stack
### Languages
- JavaScript
- JSX

### Frameworks
- React
- Vite
- React Router DOM

## Sub-Agent Architecture & Responsibilities

### 1. complexity-analyzer-agent
- Pattern extraction and analysis
- Component architecture detection
- Hook usage analysis
- State management patterns

### 2. frontend-specialist-agent
- React component optimization
- Hook implementation best practices
- Performance optimization (React.memo, useMemo)
- Accessibility compliance (ARIA, semantic HTML)

### 3. code-analyzer-agent
- ESLint rule enforcement
- Component prop validation
- Custom hook extraction opportunities
- Code splitting recommendations

### 4. api-builder-agent
- API integration patterns
- Axios configuration optimization
- Error handling strategies
- Data fetching with custom hooks

### 5. security-scanner-agent
- XSS vulnerability prevention
- Dependency vulnerability scanning
- CSP policy recommendations
- Safe innerHTML usage

### 6. doc-generator-agent
- Component documentation (JSDoc)
- Storybook story generation
- README maintenance
- API documentation updates

## MCP Server Configuration
### Active Servers (12/87)

#### ESSENTIAL
- context7: {"enabled":true}
- filesystem: {"enabled":true}
- git: {"enabled":true}

#### DEVELOPMENT
- npm: {"enabled":true}
- github: {"enabled":true}
- vite: {"enabled":true}

#### TESTING
- jest: {"enabled":true}
- cypress: {"enabled":true}

#### CLOUD
- vercel: {"enabled":true}

## Project-Specific Instructions
- Use functional components with hooks exclusively
- Implement proper error boundaries for component trees
- Follow React 18 concurrent features best practices
- Use Vite for fast development builds
- Implement proper prop validation with PropTypes or TypeScript
- Use React Router for navigation patterns
- Optimize bundle size with code splitting
- Implement responsive design patterns
- Use CSS modules or styled-components for styling
- Follow accessibility guidelines (WCAG 2.1)

## Workflow Configuration
### hive-mind Workflow
1. Queen Controller initialization
2. Sub-agent spawning (6 concurrent)
3. Component analysis and optimization
4. API integration and testing
5. Performance monitoring and optimization
6. Documentation generation and updates

## Quality Metrics
- **Test Coverage Target**: 80%+
- **Performance Benchmarks**: First Contentful Paint < 1.5s
- **Security Score**: No high/critical vulnerabilities
- **Documentation Coverage**: All components documented

## React-Specific Development Guidelines
### Component Architecture
- Use functional components with hooks
- Extract custom hooks for reusable logic
- Implement proper component composition
- Use React.memo for performance optimization

### State Management
- Use useState for local component state
- Use useContext for app-wide state
- Consider Zustand or Redux for complex state

### Performance
- Implement lazy loading for routes
- Use React.memo and useMemo appropriately
- Optimize re-renders with useCallback
- Monitor bundle size with webpack-bundle-analyzer

### Testing Strategy
- Unit tests for components with React Testing Library
- Integration tests for user flows
- E2E tests with Cypress for critical paths
- Visual regression testing with Chromatic

---

*Generated by CLAUDE.md Generator v3.0*
*Date: 2025-08-14T20:30:45.000Z*
*Phase 3: Deep Analysis & Document Generation Complete*
```

## Agent Configuration Customization

```javascript
// Generated agent assignments for React project:
const agentAssignments = new Map([
  ['frontend-specialist-agent', [
    'React component architecture optimization',
    'Hook patterns and custom hook extraction',
    'Performance optimization (memo, callback)',
    'Accessibility implementation (ARIA, semantic)',
    'Responsive design and CSS optimization'
  ]],
  
  ['code-analyzer-agent', [
    'ESLint configuration and rule enforcement',
    'Component prop validation analysis',
    'JSX syntax and pattern optimization',
    'Import/export optimization',
    'Code splitting opportunity identification'
  ]],
  
  ['api-builder-agent', [
    'API integration with Axios patterns',
    'Custom hook creation for data fetching',
    'Error handling and loading states',
    'API response caching strategies',
    'Mock API setup for development'
  ]],
  
  ['security-scanner-agent', [
    'XSS prevention in JSX rendering',
    'Dependency vulnerability scanning',
    'CSP header configuration',
    'Input validation and sanitization',
    'Authentication flow security'
  ]],
  
  ['doc-generator-agent', [
    'Component JSDoc documentation',
    'Storybook story generation',
    'README and setup documentation',
    'API endpoint documentation',
    'Deployment guide creation'
  ]],
  
  ['recovery-specialist-agent', [
    'Error boundary implementation',
    'Fallback component strategies',
    'Loading and error state handling',
    'Route-level error recovery',
    'Development debugging tools'
  ]]
]);
```

## MCP Server Selection Logic

```javascript
// React project specific MCP server selection:
function selectMCPServersForReact(analysis) {
  const servers = new Set(['context7', 'filesystem', 'git']); // Always include
  
  // Frontend specific
  servers.add('npm'); // Package management
  servers.add('vite'); // Build tool
  servers.add('github'); // Version control
  
  // Testing (detected React Testing Library pattern)
  if (analysis.testingTools.includes('Jest')) {
    servers.add('jest');
  }
  
  // E2E testing if components detected
  if (analysis.patterns.components.length > 5) {
    servers.add('cypress');
    servers.add('playwright');
  }
  
  // Deployment (common React deployment targets)
  servers.add('vercel'); // Most common for React
  servers.add('netlify'); // Alternative deployment
  
  // API integration
  if (analysis.patterns.api.axios) {
    servers.add('http'); // HTTP client testing
    servers.add('openapi'); // API documentation
  }
  
  // Performance monitoring
  servers.add('lighthouse'); // Performance auditing
  
  // Cloud services (if environment variables detected)
  if (analysis.patterns.envVars.includes('REACT_APP_API_URL')) {
    servers.add('aws'); // Common backend
  }
  
  return Array.from(servers);
}
```

## Workflow Commands Generated

```bash
# Initial setup command:
npx claude-flow@2.0.0 hive-mind spawn "React-App" --agents 6 --claude

# Development workflow:
npx claude-flow@2.0.0 develop --watch --hot-reload

# Testing workflow:
npx claude-flow@2.0.0 test --coverage --e2e

# Build and deployment:
npx claude-flow@2.0.0 build --optimize --deploy vercel

# Performance audit:
npx claude-flow@2.0.0 audit --lighthouse --bundle-size
```

This example shows how the Claude Flow 2.0 system automatically:

1. **Detects React patterns** - JSX files, React dependencies, component structure
2. **Selects appropriate agents** - Frontend specialist, API builder for React patterns
3. **Configures React-specific tools** - Vite, ESLint, React Testing Library
4. **Generates React-specific instructions** - Hooks, components, performance
5. **Customizes workflow approach** - Hive-mind with 6 agents for medium complexity
6. **Sets up deployment pipeline** - Vercel and Netlify for React deployments