#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');

function hasLintScript() {
  if (!fs.existsSync('package.json')) return false;
  try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    return pkg.scripts && typeof pkg.scripts.lint === 'string';
  } catch {
    return false;
  }
}

if (hasLintScript()) {
  try {
    execSync('npm run lint', { stdio: 'inherit' });
    process.exit(0);
  } catch (e) {
    process.exit(e.status || 1);
  }
} else {
  console.log('No lint script found. Skipping.');
  process.exit(0);
}


