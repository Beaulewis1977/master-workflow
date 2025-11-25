#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';

function hasBaseLintScript() {
  if (!fs.existsSync('package.json')) return false;
  try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    // Look for a dedicated base lint script to avoid recursion
    return pkg.scripts && typeof pkg.scripts['lint:base'] === 'string';
  } catch {
    return false;
  }
}

if (hasBaseLintScript()) {
  try {
    execSync('npm run lint:base', { stdio: 'inherit' });
    process.exit(0);
  } catch (e) {
    process.exit(e.status || 1);
  }
} else {
  console.log('No base lint script found. Skipping.');
  process.exit(0);
}
