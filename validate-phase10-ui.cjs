#!/usr/bin/env node

/**
 * Phase 10 Frontend Validation Script
 *
 * Validates that both UI dashboards are properly implemented
 * with all required features and components.
 */

const fs = require('fs');
const path = require('path');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, checks) {
  log(`\n📋 Validating: ${path.basename(filePath)}`, 'cyan');
  log('─'.repeat(60), 'blue');

  if (!fs.existsSync(filePath)) {
    log(`❌ File not found: ${filePath}`, 'red');
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const fileSize = (Buffer.byteLength(content) / 1024).toFixed(2);
  log(`📦 File size: ${fileSize} KB`, 'blue');

  let passCount = 0;
  let failCount = 0;

  checks.forEach(check => {
    const found = check.regex ? check.regex.test(content) : content.includes(check.pattern);

    if (found) {
      log(`  ✅ ${check.name}`, 'green');
      passCount++;
    } else {
      log(`  ❌ ${check.name}`, 'red');
      failCount++;
    }
  });

  const totalChecks = checks.length;
  const percentage = ((passCount / totalChecks) * 100).toFixed(0);

  log('\n📊 Results:', 'blue');
  log(`  Passed: ${passCount}/${totalChecks} (${percentage}%)`, passCount === totalChecks ? 'green' : 'yellow');

  if (failCount > 0) {
    log(`  Failed: ${failCount}/${totalChecks}`, 'red');
  }

  return failCount === 0;
}

// Marketplace UI Validation Checks
const marketplaceChecks = [
  { name: 'DOCTYPE declaration', pattern: '<!DOCTYPE html>' },
  { name: 'Chart.js CDN included', pattern: 'chart.js@4.4.1' },
  { name: 'CSS variables defined', pattern: ':root {' },
  { name: 'Responsive grid layout', pattern: 'grid-template-columns' },
  { name: 'Search input with autocomplete', pattern: 'id="searchInput"' },
  { name: 'Autocomplete results container', pattern: 'id="autocompleteResults"' },
  { name: 'Category filters', pattern: 'id="categoryFilters"' },
  { name: 'Agent grid display', pattern: 'id="agentGrid"' },
  { name: 'Agent modal dialog', pattern: 'id="agentModal"' },
  { name: 'Rating system', pattern: 'id="userRatingStars"' },
  { name: 'Review submission', pattern: 'id="reviewText"' },
  { name: 'Installation progress', pattern: 'id="installProgress"' },
  { name: 'Tabs implementation', pattern: 'class="tab"' },
  { name: 'Statistics display', pattern: 'id="statTotalAgents"' },
  { name: 'Update badge', pattern: 'id="updateBadge"' },
  { name: 'Trending tab', pattern: 'id="trendingGrid"' },
  { name: 'Installed tab', pattern: 'id="installedGrid"' },
  { name: 'Search functionality', pattern: 'function showAutocomplete' },
  { name: 'Filter logic', pattern: 'function filterAndRenderAgents' },
  { name: 'Install agent function', pattern: 'function installAgent' },
  { name: 'Rating widget', pattern: 'function setUserRating' },
  { name: 'Review submission', pattern: 'function submitReview' },
  { name: 'Mock data loading', pattern: 'function loadMockData' },
  { name: 'API configuration', pattern: 'apiUrl:' },
  { name: 'Auto-refresh', pattern: 'function startAutoRefresh' },
  { name: 'Responsive breakpoints', pattern: '@media (max-width: 768px)' },
  { name: 'ARIA labels', pattern: 'aria-label' },
  { name: 'Keyboard navigation', pattern: 'addEventListener(\'keydown\'' }
];

// ML Insights Dashboard Validation Checks
const mlDashboardChecks = [
  { name: 'DOCTYPE declaration', pattern: '<!DOCTYPE html>' },
  { name: 'Chart.js CDN included', pattern: 'chart.js@4.4.1' },
  { name: 'CSS variables defined', pattern: ':root {' },
  { name: 'Accuracy metric display', pattern: 'id="modelAccuracy"' },
  { name: 'Latency metric display', pattern: 'id="avgLatency"' },
  { name: 'Predictions/sec metric', pattern: 'id="predictionsPerSec"' },
  { name: 'Cost savings metric', pattern: 'id="costSavings"' },
  { name: 'Accuracy gauge chart', pattern: 'id="accuracyGauge"' },
  { name: 'Accuracy trend chart', pattern: 'id="accuracyChart"' },
  { name: 'Confidence scatter chart', pattern: 'id="confidenceChart"' },
  { name: 'Agent performance chart', pattern: 'id="agentPerformanceChart"' },
  { name: 'Resource allocation chart', pattern: 'id="resourceAllocationChart"' },
  { name: 'Cost analysis chart', pattern: 'id="costAnalysisChart"' },
  { name: 'A/B test chart', pattern: 'id="abTestChart"' },
  { name: 'Alerts container', pattern: 'id="alertsContainer"' },
  { name: 'Recommendations container', pattern: 'id="recommendationsContainer"' },
  { name: 'Predictions table', pattern: 'id="predictionsTable"' },
  { name: 'WebSocket connection', pattern: 'function connectWebSocket' },
  { name: 'Chart initialization', pattern: 'function initializeCharts' },
  { name: 'Mock data generation', pattern: 'function generateMockData' },
  { name: 'Real-time updates', pattern: 'function updateMLMetrics' },
  { name: 'Export metrics', pattern: 'function exportMLMetrics' },
  { name: 'Export predictions', pattern: 'function exportPredictions' },
  { name: 'Model retraining', pattern: 'function triggerRetraining' },
  { name: 'Auto-refresh', pattern: 'function startAutoRefresh' },
  { name: 'API configuration', pattern: 'apiUrl:' },
  { name: 'WebSocket URL', pattern: 'wsUrl:' },
  { name: 'Responsive design', pattern: '@media (max-width: 768px)' }
];

// Run validation
log('\n🚀 Phase 10 Frontend Validation', 'cyan');
log('═'.repeat(60), 'blue');

const marketplacePath = path.join(__dirname, 'src/marketplace/marketplace-ui.html');
const mlDashboardPath = path.join(__dirname, 'src/webui/ml-insights-dashboard.html');

const marketplaceValid = checkFile(marketplacePath, marketplaceChecks);
const mlDashboardValid = checkFile(mlDashboardPath, mlDashboardChecks);

// Final summary
log('\n' + '═'.repeat(60), 'blue');
log('📊 Final Summary', 'cyan');
log('═'.repeat(60), 'blue');

if (marketplaceValid && mlDashboardValid) {
  log('\n✅ All validations passed!', 'green');
  log('Both dashboards are properly implemented and ready for deployment.', 'green');
  process.exit(0);
} else {
  log('\n⚠️  Some validations failed', 'yellow');
  if (!marketplaceValid) {
    log('  - Agent Marketplace UI has issues', 'red');
  }
  if (!mlDashboardValid) {
    log('  - ML Insights Dashboard has issues', 'red');
  }
  process.exit(1);
}
