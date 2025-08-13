---
description: Create a new specialized sub-agent using the agent-config-generator
allowed-tools: Task
---

# Make Agent Command

Task: Use the agent-config-generator to create a new sub-agent for: $ARGUMENTS

The agent-config-generator will:
1. Analyze the requirements
2. Consult with expert models via Zen MCP
3. Select appropriate tools and MCP servers
4. Generate comprehensive workflows
5. Write the complete agent configuration to `.claude/agents/`