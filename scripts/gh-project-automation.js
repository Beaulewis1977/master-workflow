#!/usr/bin/env node
// Phase 11: GitHub Project Management Automation via gh CLI (idempotent)
import { execSync } from 'node:child_process';

function sh(cmd) {
  return execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
}

function getRepo(provided) {
  if (provided) return provided;
  try {
    const url = sh('git config --get remote.origin.url');
    const m = url.match(/github\.com[:/](.+?)(\.git)?$/);
    if (m) return m[1];
  } catch {}
  throw new Error('Unable to determine repo. Pass --repo owner/repo');
}

function ensureLabel(repo, name, color) {
  const out = sh(`gh label list --repo ${repo} --json name`);
  const list = JSON.parse(out);
  if (!list.find(l => l.name === name)) {
    sh(`gh label create ${JSON.stringify(name)} --color ${color} --repo ${repo}`);
  }
}

function ensureMilestone(repo, title) {
  const ms = JSON.parse(sh(`gh api repos/${repo}/milestones`));
  if (!ms.find(m => m.title === title)) {
    sh(`gh api -X POST repos/${repo}/milestones -f title=${JSON.stringify(title)} -f state=open`);
  }
}

function ensureIssue(repo, title, body, milestone) {
  const issues = JSON.parse(sh(`gh issue list --repo ${repo} --state all --limit 200 --json number,title`));
  let found = issues.find(i => i.title === title);
  if (!found) {
    sh(`gh issue create --repo ${repo} -t ${JSON.stringify(title)} -b ${JSON.stringify(body)} -l phase -l automation -m ${JSON.stringify(milestone)}`);
    const newIssues = JSON.parse(sh(`gh issue list --repo ${repo} --state open --limit 50 --json number,title`));
    found = newIssues.find(i => i.title === title);
  }
  return found?.number;
}

function main() {
  const args = process.argv.slice(2);
  const repoArg = args.find(a => a.startsWith('--repo='))?.split('=')[1];
  const phaseArg = args.find(a => a.startsWith('--phase='))?.split('=')[1] || '11';
  const repo = getRepo(repoArg);

  ensureLabel(repo, 'phase', 'BFD4F2');
  ensureLabel(repo, 'automation', '5319E7');
  ensureLabel(repo, 'priority:high', 'B60205');

  if (phaseArg === '11') {
    const title = 'Phase 11 — GitHub Project Management Automation';
    ensureMilestone(repo, title);
    const body = [
      '# Phase 11 — GitHub Project Management Automation',
      '',
      '## Scope',
      '- Create labels, milestones, and tracking issues for phases',
      '- Avoid duplicates; idempotent operations',
      '',
      '## Acceptance Criteria',
      '- Labels exist (phase, automation, priority)',
      '- Milestones created for active phase(s)',
      '- Issues created only if missing',
      '',
      `References: GPT5-PLAN.MD Phase 11`
    ].join('\n');
    const num = ensureIssue(repo, title, body, title);
    console.log(JSON.stringify({ repo, createdOrFoundIssue: num }, null, 2));
  } else if (phaseArg === '12') {
    const title = 'Phase 12 — Documentation, E2E, Performance & Release';
    ensureMilestone(repo, title);
    const body = [
      '# Phase 12 — Documentation, E2E, Performance & Release',
      '',
      '## Scope',
      '- Docs, E2E and perf tests, release artifacts',
      '',
      '## Acceptance Criteria',
      '- Docs updated',
      '- E2E/perf baselines recorded',
      '- Release assets prepared',
      '',
      `References: GPT5-PLAN.MD Phase 12`
    ].join('\n');
    const num = ensureIssue(repo, title, body, title);
    console.log(JSON.stringify({ repo, createdOrFoundIssue: num }, null, 2));
  } else {
    throw new Error('Unsupported phase. Use --phase=11 or --phase=12');
  }
}

main();


