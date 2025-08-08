# Setting Up Claude Code GitHub Action

## Prerequisites
- GitHub repository with Actions enabled
- Anthropic API key from [console.anthropic.com](https://console.anthropic.com)

## Setup Instructions

### 1. Get Your Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Navigate to API Keys section
3. Create a new API key or use an existing one
4. Copy the key (starts with `sk-ant-api...`)

### 2. Add the Secret to Your GitHub Repository

1. Go to your repository on GitHub: https://github.com/Beaulewis1977/master-workflow
2. Click on **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add the following secret:
   - **Name**: `ANTHROPIC_API_KEY`
   - **Value**: Your Anthropic API key from step 1
6. Click **Add secret**

### 3. Using Claude Code in Pull Requests

Once configured, you can use Claude Code in several ways:

#### Automatic PR Review
- Claude will automatically review all new pull requests
- Reviews focus on code quality, security, and best practices

#### Manual Commands (in PR comments)
- `/claude` - Trigger a code review
- `/claude fix` - Apply Claude's suggested fixes automatically
- `/claude test` - Generate tests for the changed code

### 4. Customizing Claude Code Behavior

Edit `.github/workflows/claude-code.yml` to customize:
- Review focus areas
- Custom instructions
- Auto-fix behavior
- Test generation settings

## Troubleshooting

### Common Issues

1. **"Bad credentials" error**
   - Verify the `ANTHROPIC_API_KEY` secret is correctly set
   - Ensure the API key is valid and active

2. **Claude Code not responding**
   - Check Actions tab for workflow runs
   - Verify the workflow is enabled in Actions settings

3. **Rate limiting**
   - Claude API has rate limits
   - Consider implementing retry logic or reducing frequency

## Security Notes

- Never commit API keys directly to the repository
- Use GitHub Secrets for all sensitive information
- Regularly rotate API keys for security
- Review Claude's suggestions before auto-merging

## Support

- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code/github-actions)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Report Issues](https://github.com/anthropics/claude-code-action/issues)