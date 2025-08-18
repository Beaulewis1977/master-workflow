---
description: Recover and complete partially finished projects
argument-hint: "[analyze|plan|execute]"
allowed-tools: Read, Write, MultiEdit, Grep, Glob, Task, TodoWrite, Bash
---

# Project Recovery Command

Analyzes incomplete projects and creates a recovery plan.

## Usage
- `/recover analyze` - Find all incomplete work
- `/recover plan` - Create completion plan
- `/recover execute` - Start recovery process

## What This Does
1. Scans for TODO/FIXME/incomplete code
2. Identifies failing tests
3. Finds missing documentation
4. Creates prioritized task list
5. Executes recovery plan

Use recovery-specialist agent for this workflow.
