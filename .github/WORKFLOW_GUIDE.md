# GitHub Actions Workflow Guide

## Overview

This repository uses comprehensive GitHub Actions workflows to automate CI/CD, project management, and the 12-phase build plan tracking.

## Available Workflows

### 1. CI/CD Workflows

#### `ci.yml` - Continuous Integration
- **Triggers**: Push to main/develop, PRs, manual dispatch
- **Features**:
  - Runs tests for JavaScript and shell scripts
  - Linting and code quality checks
  - Automated PR comments on success
  - Test artifact archiving
- **Required Secrets**: None

#### `security.yml` - Security Scanning
- **Triggers**: Push to main, PRs, weekly schedule
- **Features**:
  - Trivy vulnerability scanning
  - CodeQL analysis for JavaScript
  - Dependency review on PRs
  - Security alerts in GitHub Security tab
- **Required Secrets**: None

#### `release.yml` - Automated Releases
- **Triggers**: Version tags (v*), manual dispatch
- **Features**:
  - Automated GitHub releases with changelogs
  - Release artifact creation
  - Docker image building and publishing
  - Checksums generation
- **Required Secrets**: None (uses GITHUB_TOKEN)

### 2. Claude Code Integration

#### `claude-code.yml` - AI-Powered Code Review
- **Triggers**: PRs, PR comments with `/claude`
- **Features**:
  - Automatic PR code review
  - `/claude` - Trigger review
  - `/claude fix` - Apply suggested fixes
  - `/claude test` - Generate tests
- **Required Secrets**: `ANTHROPIC_API_KEY` ⚠️

**Setup Instructions**: See [.github/SETUP_CLAUDE_CODE.md](.github/SETUP_CLAUDE_CODE.md)

### 3. Project Management

#### `pr-validation.yml` - PR Quality Gates
- **Triggers**: All PR events
- **Features**:
  - Semantic PR title validation
  - PR size labeling (XS, S, M, L, XL)
  - Merge conflict detection
  - Auto-assign reviewers based on files changed
  - Documentation reminder for significant changes

#### `dependabot.yml` - Dependency Management
- **Triggers**: Dependabot PRs
- **Features**:
  - Auto-approve patch and minor updates
  - Auto-merge patch updates
  - Dependency labeling
- **Configuration**: `.github/dependabot.yml`

### 4. 12-Phase Build Plan Automation

#### `project-automation.yml` - Issue & Phase Management
- **Triggers**: Issue events, PR events, manual phase transitions
- **Features**:
  - Auto-label issues by phase (1-12)
  - Priority detection (low, medium, high, critical)
  - Phase progress tracking
  - Slash commands in issue comments:
    - `/status [todo|in-progress|blocked|review|done]`
    - `/phase [1-12]`
    - `/priority [low|medium|high|critical]`
  - Manual phase transitions via workflow dispatch

#### `phase-reports.yml` - Analytics & Reporting
- **Triggers**: Weekly (Monday 9 AM UTC), manual dispatch
- **Features**:
  - Comprehensive phase progress reports
  - Burndown charts
  - Risk and blocker tracking
  - Velocity metrics
  - Team contributor analysis
  - Dependency mapping
  - Automated report generation in issues

## Using the Workflows

### Quick Start Commands

```bash
# Check workflow status
gh workflow list

# Run a specific workflow manually
gh workflow run ci.yml

# Transition to a new phase
gh workflow run project-automation.yml -f phase=phase-4-core-development

# Generate phase report
gh workflow run phase-reports.yml -f report_type=phase-summary
```

### Issue Management Commands

Use these in issue comments:

```bash
# Update issue status
/status in-progress
/status blocked
/status done

# Assign to phase
/phase 4
/phase 10

# Set priority
/priority high
/priority critical
```

### PR Commands

Use these in PR comments:

```bash
# Trigger Claude Code review
/claude

# Apply Claude's fixes
/claude fix

# Generate tests
/claude test
```

## Phase Workflow

### Phase Structure

The 12-phase build plan includes:

1. **Phase 1**: Planning
2. **Phase 2**: Architecture
3. **Phase 3**: Setup
4. **Phase 4**: Core Development
5. **Phase 5**: Integration
6. **Phase 6**: Testing
7. **Phase 7**: Optimization
8. **Phase 8**: Documentation
9. **Phase 9**: Deployment
10. **Phase 10**: Monitoring
11. **Phase 11**: Maintenance
12. **Phase 12**: Review

### Managing Phases

1. **Create Phase Issues**:
   ```markdown
   Title: Phase 4: Implement core workflow engine
   Body: Details about the phase objectives
   ```
   The automation will auto-label with `phase-4-core-development`

2. **Track Progress**:
   - View the auto-generated progress tracking issue
   - Check weekly reports in the Issues tab
   - Monitor the reports/ directory for detailed analytics

3. **Transition Phases**:
   ```bash
   gh workflow run project-automation.yml -f phase=phase-5-integration
   ```

## Monitoring & Alerts

### Workflow Status Badge

Add to README.md:
```markdown
![CI](https://github.com/Beaulewis1977/master-workflow/workflows/CI/badge.svg)
![Security](https://github.com/Beaulewis1977/master-workflow/workflows/Security%20Scan/badge.svg)
```

### Notifications

Configure in GitHub Settings → Notifications:
- Workflow failures
- Security alerts
- PR reviews
- Phase transitions

## Troubleshooting

### Common Issues

1. **Workflow not triggering**:
   - Check workflow file syntax
   - Verify branch protection rules
   - Ensure workflows are enabled in repository settings

2. **Claude Code not responding**:
   - Verify `ANTHROPIC_API_KEY` secret is set
   - Check API rate limits
   - Review workflow logs in Actions tab

3. **Phase automation issues**:
   - Ensure issue has proper phase label
   - Check for conflicting labels
   - Verify permissions for GitHub token

### Debug Mode

Enable debug logging:
```bash
gh workflow run ci.yml -f debug_enabled=true
```

## Best Practices

1. **Commit Messages**: Use conventional commits (feat:, fix:, docs:, etc.)
2. **PR Titles**: Follow semantic format for auto-validation
3. **Issue Labels**: Always include phase and priority labels
4. **Phase Completion**: Close all phase issues before transitioning
5. **Security**: Never commit secrets; use GitHub Secrets

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code/github-actions)
- [Workflow Syntax](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)
- [GitHub CLI Documentation](https://cli.github.com/)

## Support

For issues or questions:
1. Check workflow logs in the Actions tab
2. Review this documentation
3. Create an issue with the `help-wanted` label
4. Tag @Beaulewis1977 for urgent matters