#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

function ok(name, cond) { console.log((cond? '✓':'✗') + ' ' + name); if (!cond) process.exitCode = 1; }

// approach-selector smoke
try {
  const selPath = path.resolve('.ai-workflow/intelligence-engine/approach-selector.js');
  const analysis = { score: 25, stage: 'early' };
  const Selector = (await import('file://' + selPath)).default || (await import('file://' + selPath));
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
