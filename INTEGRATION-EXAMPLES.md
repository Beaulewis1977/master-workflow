# 🔗 Integration Examples: Combining Both Systems

This guide shows how to use the clean Agent OS architecture alongside the production Claude Flow 2.0 system.

## 🎯 Example 1: Memory-Enhanced Agent Pool

Combine Queen Controller's scaling with Agent OS memory:

```javascript
// examples/memory-enhanced-scaling.js
const { QueenController } = require('../src/platform/queen-controller');
const { MemoryManager } = require('../src/agent-os/memory/memory-manager');

class MemoryEnhancedQueen extends QueenController {
  constructor(options = {}) {
    super(options);
    this.memory = new MemoryManager({
      memoryPath: './.claude-flow/agent-memory'
    });
  }

  async spawnAgent(task) {
    // Recall similar tasks from memory
    const context = await this.memory.recall({ task });

    // Spawn agent with historical context
    const agent = await super.spawnAgent({
      ...task,
      context: context.found ? context : {}
    });

    return agent;
  }

  async completeTask(agentId, result) {
    // Store successful patterns in memory
    await this.memory.store({
      task: this.runningTasks.get(agentId),
      results: [result],
      timestamp: Date.now()
    });

    return await super.completeTask(agentId, result);
  }
}

// Usage
const queen = new MemoryEnhancedQueen({
  maxAgents: 100,
  memoryEnabled: true
});

await queen.initialize();
await queen.spawnAgent({
  task: 'Build authentication system',
  framework: 'react'
});
```

## 🎯 Example 2: Intelligent Workflow with Planning

Combine Flow Orchestrator with Task Planner:

```javascript
// examples/intelligent-workflow.js
const { FlowOrchestrator } = require('../src/claude-flow/orchestrator/flow-orchestrator');
const { TaskPlanner } = require('../src/agent-os/planning/task-planner');

class IntelligentFlowOrchestrator extends FlowOrchestrator {
  constructor(options = {}) {
    super(options);
    this.planner = new TaskPlanner();
  }

  async executeWorkflow(workflow) {
    // Enhance workflow with AI planning
    for (let phase of workflow.phases) {
      for (let agent of phase.agents) {
        // Auto-generate execution plan
        const plan = await this.planner.plan({
          task: agent.task,
          context: agent.context
        });

        agent.executionPlan = plan;
        agent.recoveryEnabled = true;
      }
    }

    // Execute enhanced workflow
    return await super.executeWorkflow(workflow);
  }
}

// Usage
const orchestrator = new IntelligentFlowOrchestrator({ verbose: true });

const workflow = {
  name: 'full-stack-development',
  phases: [
    {
      name: 'backend',
      agents: [{
        type: 'developer',
        task: 'Create REST API with authentication'
      }]
    },
    {
      name: 'frontend',
      agents: [{
        type: 'developer',
        task: 'Build React dashboard'
      }]
    }
  ]
};

await orchestrator.executeWorkflow(workflow);
```

## 🎯 Example 3: Autonomous Builder with MCP Integration

Combine Autonomous Builder with MCP Discovery:

```javascript
// examples/mcp-enhanced-builder.js
const { AutonomousBuilder } = require('../src/builder/autonomous-builder');
const { MCPDiscoverySystem } = require('../src/platform/mcp-discovery');

class MCPEnhancedBuilder extends AutonomousBuilder {
  constructor(options = {}) {
    super(options);
    this.mcpDiscovery = new MCPDiscoverySystem();
  }

  async buildApp(description, options = {}) {
    // Discover relevant MCP servers for the project
    const mcpServers = await this.mcpDiscovery.discoverRelevantServers({
      description,
      framework: options.stack
    });

    console.log(`🔌 Discovered ${mcpServers.length} relevant MCP servers`);

    // Build app with MCP integration
    const result = await super.buildApp(description, {
      ...options,
      mcpServers
    });

    // Configure MCP servers in project
    await this._configureMCPServers(result.projectPath, mcpServers);

    return result;
  }

  async _configureMCPServers(projectPath, servers) {
    // Add MCP server configuration to project
    const config = {
      mcpServers: servers.map(s => ({
        name: s.name,
        command: s.command,
        args: s.args
      }))
    };

    await writeFile(
      join(projectPath, '.claude-mcp.json'),
      JSON.stringify(config, null, 2)
    );
  }
}

// Usage
const builder = new MCPEnhancedBuilder({
  outputDir: './generated-apps',
  verbose: true
});

const app = await builder.buildApp(
  'A blog platform with real-time comments and user authentication',
  { stack: 'React, Node.js, PostgreSQL' }
);

console.log(`✅ App created at: ${app.projectPath}`);
console.log(`🔌 MCP servers configured: ${app.mcpServers.length}`);
```

## 🎯 Example 4: Complete Integrated System

Full integration of all components:

```javascript
// examples/complete-integration.js
const { QueenController } = require('../src/platform/queen-controller');
const { FlowOrchestrator } = require('../src/claude-flow/orchestrator/flow-orchestrator');
const { AgentOS } = require('../src/agent-os/core/agent-runtime');
const { AutonomousBuilder } = require('../src/builder/autonomous-builder');

class MasterWorkflowSystem {
  constructor() {
    this.queen = new QueenController({ maxAgents: 1000 });
    this.orchestrator = new FlowOrchestrator({ verbose: true });
    this.builder = new AutonomousBuilder({ verbose: true });
  }

  async initialize() {
    console.log('🚀 Initializing Master Workflow System...\n');

    await this.queen.initialize();
    console.log('✅ Queen Controller ready\n');

    console.log('✅ Flow Orchestrator ready\n');
    console.log('✅ Autonomous Builder ready\n');

    console.log('🎉 Master Workflow System fully initialized!\n');
  }

  async buildAndDeploy(description, options = {}) {
    console.log(`📝 Building: ${description}\n`);

    // Step 1: Build the app
    const app = await this.builder.buildApp(description, options);
    console.log(`✅ App created at: ${app.projectPath}\n`);

    // Step 2: Create deployment workflow
    const deployWorkflow = {
      name: 'deploy-application',
      phases: [
        {
          name: 'test',
          agents: [{
            type: 'tester',
            task: `Run tests for ${app.projectPath}`,
            context: { projectPath: app.projectPath }
          }]
        },
        {
          name: 'deploy',
          agents: [{
            type: 'deployer',
            task: `Deploy to production`,
            context: { projectPath: app.projectPath }
          }]
        }
      ]
    };

    // Step 3: Execute deployment
    const deployResult = await this.orchestrator.executeWorkflow(deployWorkflow);

    return {
      app,
      deployment: deployResult
    };
  }

  async scaleAgents(count) {
    console.log(`📈 Scaling to ${count} agents...\n`);

    for (let i = 0; i < count; i++) {
      const agent = new AgentOS({
        type: 'developer',
        memory: true,
        planning: true,
        verbose: false
      });

      await this.queen.registerAgent(agent);
    }

    console.log(`✅ ${count} intelligent agents ready!\n`);
  }

  async shutdown() {
    console.log('🛑 Shutting down system...\n');
    await this.queen.shutdown();
    await this.orchestrator.shutdown();
    await this.builder.shutdown();
    console.log('✅ Shutdown complete\n');
  }
}

// Main execution
async function main() {
  const system = new MasterWorkflowSystem();

  try {
    // Initialize
    await system.initialize();

    // Build an app
    const result = await system.buildAndDeploy(
      'A real-time chat application with video calls',
      { stack: 'React, Node.js, WebRTC, PostgreSQL' }
    );

    console.log('🎉 Success!');
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await system.shutdown();
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { MasterWorkflowSystem };
```

## 🎯 Example 5: CLI Integration

Unified CLI combining both systems:

```bash
# Use existing Claude Flow commands
npx claude-flow@2.0.0 init --claude --webui

# Use new Agent OS commands
node src/cli/agent-cli.js --type developer --task "Refactor authentication"

# Use new Flow commands
node src/cli/flow-cli.js --workflow workflows/deployment.yaml

# Combined usage
npx claude-flow@2.0.0 create my-app --template fullstack-modern
cd my-app
node ../src/cli/agent-cli.js --type analyzer --task "Analyze project structure"
```

## 📚 Usage Patterns

### Pattern 1: Learning from History

```javascript
const agent = new AgentOS({ memory: true });

// Agent remembers successful patterns
await agent.execute({ task: 'Add user authentication' });
// ... time passes ...
await agent.execute({ task: 'Add OAuth authentication' });
// Agent recalls the previous auth implementation!
```

### Pattern 2: Automatic Recovery

```javascript
const orchestrator = new IntelligentFlowOrchestrator();

// If a step fails, planning system auto-recovers
const workflow = {
  phases: [{ agents: [{ task: 'Deploy to production' }] }]
};

// Handles failures gracefully with replanning
await orchestrator.executeWorkflow(workflow);
```

### Pattern 3: Massive Scaling with Intelligence

```javascript
const queen = new MemoryEnhancedQueen({ maxAgents: 4462 });

// Spawn thousands of agents that learn from each other
for (let i = 0; i < 1000; i++) {
  await queen.spawnAgent({
    task: `Implement feature ${i}`,
    memory: true // Agents share learned patterns
  });
}
```

## 🚀 Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Try the examples:**
   ```bash
   node examples/memory-enhanced-scaling.js
   node examples/intelligent-workflow.js
   node examples/complete-integration.js
   ```

3. **Build your own integration:**
   - Extend the base classes
   - Mix and match features
   - Create custom workflows

## 💡 Best Practices

1. **Use memory for repetitive tasks** - Let agents learn patterns
2. **Enable planning for complex workflows** - Automatic decomposition
3. **Scale intelligently** - Use Queen Controller for resource management
4. **Monitor in real-time** - Connect to WebUI for visibility
5. **Clean architecture** - Separate concerns, compose features

---

**The power of both systems combined!** 🚀
