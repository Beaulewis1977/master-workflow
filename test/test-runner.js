#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const requireCjs = createRequire(import.meta.url);

function ok(name, cond) { console.log((cond? '✓':'✗') + ' ' + name); if (!cond) process.exitCode = 1; }

// approach-selector smoke
try {
  let selPath = path.resolve('.ai-workflow/intelligence-engine/approach-selector.js');
  if (!fs.existsSync(selPath)) {
    selPath = path.resolve('intelligence-engine/approach-selector.js');
  }
  const analysis = { score: 25, stage: 'early' };
  const Selector = requireCjs(selPath);
  const selector = new (Selector.default || Selector)();
  const rec = selector.selectApproach(analysis);
  ok('approach-selector returns object', !!rec && typeof rec === 'object');
} catch (e) { ok('approach-selector load failed: ' + e.message, false); }

// mcp-discover smoke
try {
  const discover = path.resolve('.ai-workflow/lib/mcp-discover.js');
  const mod = await import('file://' + discover);
  ok('mcp-discover module loads', !!mod);
} catch (e) { ok('mcp-discover load failed: ' + e.message, false); }

// bus + scanner smoke
try {
  const mod = await import('file://' + path.resolve('test/test-bus-and-scanner.js'));
  ok('bus+scanner test executed', true);
} catch (e) { ok('bus+scanner test failed: ' + e.message, false); }