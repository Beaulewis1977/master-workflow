# CLAUDE.md — Project Standards and AI Agent Guidance

This repository uses Claude Code and subagents for automation. Follow these rules for AI-driven changes.

## Code
- Prefer JavaScript/TypeScript; write POSIX shell where possible
- Use descriptive names; keep modules single-responsibility
- Handle errors explicitly; include remediation hints
- Use structured JSON logs; redact secrets at source
- Add tests for critical logic; target ≥80% coverage on core paths

## Security
- Never commit secrets; use GitHub Secrets and Environments
- Respect command allowlists and filesystem write-root constraints
- YOLO allowed with explicit ack and full journaling; ensure rollback is implemented for every destructive action

## Pull Requests
- Include: problem statement, solution summary, tests, rollback plan, security notes
- Reference relevant plan phases in `GPT5-PLAN.MD`

## Layout
- `.github/workflows/` CI/CD and quality gates
- `engine/` installer engine (CLI/API/DB)
- `.agent-os/` canonical docs; `.claude/agents/` least-privilege subagents

## Subagents
- Use minimal tool sets per role
- Default MCP server for libraries/context: context7

## Checklist
- [ ] Tests pass locally
- [ ] Coverage thresholds met for critical paths
- [ ] Secrets handled securely
- [ ] Rollback steps included and verified
- [ ] Docs updated (README/guides/runbooks)

## Performance budgets
- Install ≤10m (standard), ≤5m (express)
- CPU ≤10%, RAM ≤500MB during installation

## Notes
- Prefer additive, non-destructive edits
- If editing generated files, update upstream sources/templates
