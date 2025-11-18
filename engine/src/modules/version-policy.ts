const NORMALIZED = new Set(['alpha','beta','latest','stable','2.0','dev']);
const ALIAS: Record<string,string> = {
  alpha: 'alpha', a: 'alpha',
  beta: 'beta', b: 'beta',
  latest: 'latest', l: 'latest',
  stable: 'stable', s: 'stable',
  dev: 'dev', development: 'dev', experimental: 'alpha',
  '2': '2.0', '2.0': '2.0', v2: '2.0', 'v2.0': '2.0',
  release: 'stable'
};

export function normalizeVersionName(input?: string): string {
  if (!input) return 'alpha';
  const key = String(input).trim().toLowerCase();
  if (ALIAS[key]) return ALIAS[key];
  if (NORMALIZED.has(key)) return key;
  return 'alpha';
}

export function suffixFor(name?: string): string { return `@${normalizeVersionName(name)}`; }

export function isExperimental(name?: string): boolean {
  const n = normalizeVersionName(name);
  return n === 'alpha' || n === 'beta' || n === 'dev';
}


