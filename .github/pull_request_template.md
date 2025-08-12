## Summary

Describe the change and the motivation. Link related issues.

## Checklist

- [ ] Tests added/updated (`npm test` passes on Node 18/20)
- [ ] Docs updated (`README.md`, relevant guides)
- [ ] Security reviewed (no secrets; no YOLO flags committed)
- [ ] References to `GPT5-PLAN.MD` phases where applicable

## Screenshots / Logs

Paste relevant output if helpful.

## Summary

Describe the changes and why they are needed.

## Checklist

- [ ] Linked Task IDs in `GPT5-EXECUTION-PLAN.MD` Tracking & Index
- [ ] Tests updated/added and passing locally (`node test/test-runner.js`)
- [ ] Docs updated (`README.md` or guides) if behavior changes
- [ ] Safety: No `--dangerously-skip-permissions` or YOLO usage in CI paths
- [ ] Cross-platform: No Linux-only tools without guards; Windows defaults to process mode

## Screenshots/Logs

Attach screenshots or logs if helpful.

## Summary

Describe the change and its purpose.

## Linked Tasks / Phase

- Phase: <!-- e.g., Phase 1: Quick Wins -->
- Tasks: <!-- e.g., P1-T1, P1-T2 -->

## Checklists

- [ ] Tests updated/added and passing locally
- [ ] Docs updated where appropriate
- [ ] Updated `GPT5-EXECUTION-PLAN.MD` (Status, End-of-Phase Summary, Tracking & Index)
- [ ] YOLO gated (no `--dangerously-skip-permissions` in CI)
- [ ] Cross-platform safe (no unguarded Linux-only tools)

## Risk / Rollback

- Risk level: low/medium/high
- Rollback: revert this PR

## Summary

Describe the change and why it’s needed.

## Changes
-

## Tests
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E (if applicable)

## Security
- [ ] No secrets committed; uses GitHub Secrets
- [ ] Commands respect allowlists and write-root constraints

## Rollback
Explain how to revert safely (scripts/configs/files/packages).

## Docs
- [ ] README and guides updated if user-facing changes
- [ ] `GPT5-PLAN.MD`/`GPT5-REPORT.MD` references updated if needed

