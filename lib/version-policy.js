#!/usr/bin/env node

/**
 * Centralized Claude Flow Version Policy
 */

const NORMALIZED_NAMES = new Set(['alpha', 'beta', 'latest', 'stable', '2.0', 'dev']);

const ALIAS_TO_NAME = {
  alpha: 'alpha', a: 'alpha',
  beta: 'beta', b: 'beta',
  latest: 'latest', l: 'latest',
  stable: 'stable', s: 'stable',
  dev: 'dev', development: 'dev', experimental: 'alpha',
  '2': '2.0', '2.0': '2.0', v2: '2.0', 'v2.0': '2.0',
  release: 'stable',
};

function normalizeVersionName(input) {
  if (!input || typeof input !== 'string') return 'alpha';
  const key = String(input).trim().toLowerCase();
  if (ALIAS_TO_NAME[key]) return ALIAS_TO_NAME[key];
  if (NORMALIZED_NAMES.has(key)) return key;
  return 'alpha';
}

function getSuffixForName(name) {
  const n = normalizeVersionName(name);
  return `@${n}`;
}

function isExperimentalName(name) {
  const n = normalizeVersionName(name);
  return n === 'alpha' || n === 'beta' || n === 'dev';
}

function chooseDefaultFromAnalysis(analysis) {
  try {
    const stage = analysis?.stage;
    const score = Number(analysis?.score ?? 0);
    if (stage === 'mature') return 'stable';
    if (stage === 'active' && score >= 80) return 'latest';
  } catch (_) {}
  return 'alpha';
}

function getSelectedVersionName(opts = {}) {
  const { input, analysis } = opts;
  if (input) return normalizeVersionName(input);
  const fromEnv = process.env.CLAUDE_FLOW_VERSION
    ? normalizeVersionName(process.env.CLAUDE_FLOW_VERSION)
    : null;
  if (fromEnv) return fromEnv;
  return chooseDefaultFromAnalysis(analysis);
}

function getSelectedVersionSuffix(opts = {}) {
  return getSuffixForName(getSelectedVersionName(opts));
}

function getPolicySummary() {
  return {
    canonicalNames: Array.from(NORMALIZED_NAMES.values()).sort(),
    examples: {
      env: 'CLAUDE_FLOW_VERSION=stable',
      npx: 'npx claude-flow@alpha swarm',
    },
    experimental: ['alpha', 'beta', 'dev'],
  };
}

module.exports = {
  normalizeVersionName,
  getSuffixForName,
  isExperimentalName,
  chooseDefaultFromAnalysis,
  getSelectedVersionName,
  getSelectedVersionSuffix,
  getPolicySummary,
};


