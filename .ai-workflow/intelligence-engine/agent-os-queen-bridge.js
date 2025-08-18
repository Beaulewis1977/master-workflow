/**
 * Agent-OS Queen Controller Bridge
 * Bridges Agent-OS context management with Queen Controller sub-agent execution
 * Ensures optimal context distribution across 10 concurrent agents with 200k context windows
 */

const AgentOSIntegration = require('./agent-os-integration');
const path = require('path');
const fs = require('fs').promises;

class AgentOSQueenBridge {
  constructor(queenController, options = {}) {
    this.queenController = queenController;
    this.agentOS = new AgentOSIntegration(options);
    
    this.config = {
      maxContextPerAgent: 200000, // 200k tokens
      maxConcurrentAgents: 10,
      contextOptimizationTarget: 75, // 75% reduction
      agentAssignmentStrategy: 'capability-based',
      ...options
    };

    this.activeContexts = new Map(); // Track context per agent
    this.agentCapabilities = new Map(); // Map agents to their capabilities
    
    this.initializeAgentCapabilities();
  }

  /**
   * Initialize agent capabilities mapping from .claude/agents/
   */
  async initializeAgentCapabilities() {
    try {
      const agentsPath = path.join(process.cwd(), '.claude', 'agents');
      const agentFiles = await fs.readdir(agentsPath);
      
      for (const file of agentFiles) {
        if (file.endsWith('.md') && file.startsWith('1-')) {
          const agentName = file.replace('.md', '');
          const capabilities = await this.extractAgentCapabilities(
            path.join(agentsPath, file)
          );
          this.agentCapabilities.set(agentName, capabilities);
        }
      }
      
      console.log(`Initialized capabilities for ${this.agentCapabilities.size} specialized agents`);
    } catch (error) {
      console.warn('Failed to initialize agent capabilities:', error.message);
    }
  }

  /**
   * Extract capabilities from agent markdown files
   */
  async extractAgentCapabilities(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const capabilities = {
        specializations: [],
        keywords: [],
        complexity: 'medium',
        contextRequirements: 'standard'
      };

      // Extract from YAML frontmatter
      const yamlMatch = content.match(/---\n([\s\S]*?)\n---/);
      if (yamlMatch) {
        const yamlContent = yamlMatch[1];
        if (yamlContent.includes('description:')) {
          const descMatch = yamlContent.match(/description: (.*)/);
          if (descMatch) {
            capabilities.description = descMatch[1];
            capabilities.keywords = this.extractKeywords(descMatch[1]);
          }
        }
      }

      // Extract specializations from content
      const specializationMatch = content.match(/## Core Competencies[\\s\\S]*?### Competencies[\\s\\S]*?(?=###|\n## )/);
      if (specializationMatch) {
        const competencies = specializationMatch[0];
        capabilities.specializations = this.extractSpecializations(competencies);
      }

      return capabilities;
    } catch (error) {
      console.warn(`Failed to extract capabilities from ${filePath}:`, error.message);
      return { specializations: [], keywords: [], complexity: 'medium' };
    }
  }

  /**
   * Extract keywords from description text
   */
  extractKeywords(description) {
    const keywords = [];
    const keywordPatterns = [
      /\\b(api|rest|graphql|database|frontend|backend|ui|ux)\\b/gi,
      /\\b(test|testing|automation|deployment|security|performance)\\b/gi,
      /\\b(integration|documentation|monitoring|optimization)\\b/gi
    ];

    keywordPatterns.forEach(pattern => {
      const matches = description.match(pattern) || [];
      keywords.push(...matches.map(m => m.toLowerCase()));
    });

    return [...new Set(keywords)]; // Remove duplicates
  }

  /**
   * Extract specializations from competencies section
   */
  extractSpecializations(competencies) {
    const specializations = [];
    const lines = competencies.split('\n');
    
    lines.forEach(line => {
      if (line.startsWith('- **') && line.includes('**:')) {
        const specialization = line.match(/- \\*\\*([^*]+)\\*\\*/);
        if (specialization) {
          specializations.push(specialization[1].toLowerCase());
        }
      }
    });
    
    return specializations;
  }

  /**
   * Execute Agent-OS command through Queen Controller
   */
  async executeCommand(command, args = {}) {
    console.log(`Executing Agent-OS command: ${command}`);
    
    // Initialize Agent-OS context
    const agentOSResult = await this.agentOS.initialize(command, args);
    
    // Select optimal agent based on command type and capabilities
    const selectedAgent = await this.selectOptimalAgent(command, agentOSResult.context);
    
    // Prepare context for agent execution
    const optimizedContext = await this.prepareAgentContext(
      selectedAgent,
      agentOSResult.context,
      command
    );
    
    // Execute through Queen Controller
    const executionResult = await this.executeViaQueenController(
      selectedAgent,
      command,
      optimizedContext,
      args
    );
    
    return {
      success: true,
      command,
      selectedAgent: selectedAgent.name,
      contextReduction: agentOSResult.reduction,
      contextSize: optimizedContext.size,
      executionResult,
      agentOSContext: agentOSResult.context
    };
  }

  /**
   * Select optimal agent based on command type and capabilities
   */
  async selectOptimalAgent(command, context) {
    const commandAgentMap = {
      'plan-product': '1-orchestration-coordinator',
      'create-spec': '1-documentation-generator', 
      'execute-tasks': '1-neural-swarm-architect',
      'analyze-product': '1-intelligence-analyzer'
    };

    // Get primary agent recommendation
    const primaryAgentName = commandAgentMap[command] || '1-neural-swarm-architect';
    const primaryAgent = this.agentCapabilities.get(primaryAgentName);

    if (primaryAgent) {
      return {
        name: primaryAgentName,
        capabilities: primaryAgent,
        contextWindow: this.config.maxContextPerAgent,
        priority: 'high'
      };
    }

    // Fallback to capability-based selection
    return await this.selectByCapability(command, context);
  }

  /**
   * Select agent by capability matching
   */
  async selectByCapability(command, context) {
    const commandKeywords = {
      'plan-product': ['planning', 'architecture', 'coordination', 'orchestration'],
      'create-spec': ['documentation', 'specification', 'analysis'],
      'execute-tasks': ['implementation', 'execution', 'development'],
      'analyze-product': ['analysis', 'intelligence', 'assessment']
    };

    const keywords = commandKeywords[command] || ['general'];
    let bestMatch = null;
    let bestScore = 0;

    for (const [agentName, capabilities] of this.agentCapabilities) {
      const score = this.calculateCapabilityMatch(keywords, capabilities);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = {
          name: agentName,
          capabilities,
          contextWindow: this.config.maxContextPerAgent,
          matchScore: score
        };
      }
    }

    return bestMatch || {
      name: '1-neural-swarm-architect',
      capabilities: { specializations: ['general'], keywords: [] },
      contextWindow: this.config.maxContextPerAgent,
      matchScore: 0
    };
  }

  /**
   * Calculate capability match score
   */
  calculateCapabilityMatch(commandKeywords, capabilities) {
    let score = 0;
    
    // Check specialization matches
    commandKeywords.forEach(keyword => {
      if (capabilities.specializations.some(spec => 
        spec.includes(keyword) || keyword.includes(spec)
      )) {
        score += 3;
      }
      
      if (capabilities.keywords.includes(keyword)) {
        score += 2;
      }
    });

    // Check description matches
    if (capabilities.description) {
      commandKeywords.forEach(keyword => {
        if (capabilities.description.toLowerCase().includes(keyword)) {
          score += 1;
        }
      });
    }

    return score;
  }

  /**
   * Prepare optimized context for agent execution
   */
  async prepareAgentContext(selectedAgent, agentOSContext, command) {
    const contextElements = [];
    let totalSize = 0;

    // Add standards if loaded
    if (agentOSContext.standards) {
      const standardsText = Object.values(agentOSContext.standards).join('\n\n');
      contextElements.push({
        type: 'standards',
        content: standardsText,
        size: standardsText.length
      });
      totalSize += standardsText.length;
    }

    // Add product context if loaded
    if (agentOSContext.product) {
      const productText = Object.values(agentOSContext.product).join('\n\n');
      contextElements.push({
        type: 'product',
        content: productText,
        size: productText.length
      });
      totalSize += productText.length;
    }

    // Add relevant specifications
    if (agentOSContext.specifications.size > 0) {
      const specsArray = Array.from(agentOSContext.specifications.values());
      const specsText = specsArray.join('\n\n');
      contextElements.push({
        type: 'specifications',
        content: specsText,
        size: specsText.length
      });
      totalSize += specsText.length;
    }

    // Optimize if context is too large
    if (totalSize > selectedAgent.contextWindow * 0.8) {
      contextElements = await this.optimizeContextSize(
        contextElements,
        selectedAgent.contextWindow * 0.8
      );
      totalSize = contextElements.reduce((sum, elem) => sum + elem.size, 0);
    }

    return {
      elements: contextElements,
      size: totalSize,
      optimized: totalSize < selectedAgent.contextWindow * 0.8,
      utilization: (totalSize / selectedAgent.contextWindow) * 100
    };
  }

  /**
   * Optimize context size by intelligently reducing content
   */
  async optimizeContextSize(contextElements, targetSize) {
    const optimized = [];
    let currentSize = 0;

    // Priority order: standards, specifications, product
    const priorityOrder = ['standards', 'specifications', 'product'];

    for (const type of priorityOrder) {
      const element = contextElements.find(e => e.type === type);
      if (element) {
        const availableSpace = targetSize - currentSize;
        
        if (element.size <= availableSpace) {
          optimized.push(element);
          currentSize += element.size;
        } else {
          // Truncate content intelligently
          const truncatedContent = this.intelligentTruncation(
            element.content,
            availableSpace
          );
          optimized.push({
            type: element.type,
            content: truncatedContent,
            size: truncatedContent.length,
            truncated: true
          });
          currentSize += truncatedContent.length;
          break; // No more space available
        }
      }
    }

    return optimized;
  }

  /**
   * Intelligently truncate content while preserving important information
   */
  intelligentTruncation(content, maxSize) {
    if (content.length <= maxSize) return content;

    // Try to preserve headers, important sections, and key information
    const lines = content.split('\n');
    let truncated = [];
    let currentSize = 0;

    for (const line of lines) {
      // Always include headers and important markers
      if (line.startsWith('#') || line.startsWith('##') || 
          line.startsWith('-') || line.includes('**')) {
        if (currentSize + line.length + 1 <= maxSize) {
          truncated.push(line);
          currentSize += line.length + 1;
        }
      } else if (currentSize + line.length + 1 <= maxSize) {
        truncated.push(line);
        currentSize += line.length + 1;
      } else {
        break;
      }
    }

    return truncated.join('\n') + '\n\n[Context truncated for optimization]';
  }

  /**
   * Execute command via Queen Controller with optimized context
   */
  async executeViaQueenController(selectedAgent, command, optimizedContext, args) {
    try {
      // Prepare execution context for Queen Controller
      const executionContext = {
        agentId: selectedAgent.name,
        contextWindow: selectedAgent.contextWindow,
        command,
        args,
        context: optimizedContext,
        timestamp: Date.now()
      };

      // Track active context
      this.activeContexts.set(selectedAgent.name, executionContext);

      // Execute via Queen Controller (this would integrate with the actual implementation)
      console.log(`Executing ${command} via ${selectedAgent.name} with ${optimizedContext.utilization.toFixed(1)}% context utilization`);

      // Simulated execution result - in real implementation, this would call queenController
      const result = {
        success: true,
        agentId: selectedAgent.name,
        command,
        contextUtilization: optimizedContext.utilization,
        executionTime: Date.now(),
        outputs: await this.generateMockOutput(command, args)
      };

      // Clean up context tracking
      this.activeContexts.delete(selectedAgent.name);

      return result;
    } catch (error) {
      this.activeContexts.delete(selectedAgent.name);
      throw new Error(`Queen Controller execution failed: ${error.message}`);
    }
  }

  /**
   * Generate mock output for testing (replace with actual implementation)
   */
  async generateMockOutput(command, args) {
    const outputs = {
      'plan-product': {
        productPlan: 'Product structure and planning completed',
        architecture: 'System architecture documented',
        milestones: 'Development milestones defined'
      },
      'create-spec': {
        specification: 'Feature specification generated',
        testCases: 'Test cases defined',
        implementationPlan: 'Implementation tasks outlined'
      },
      'execute-tasks': {
        completedTasks: 'Development tasks completed',
        testResults: 'Tests passing',
        deploymentStatus: 'Ready for deployment'
      },
      'analyze-product': {
        analysisReport: 'Codebase analysis completed',
        recommendations: 'Optimization recommendations provided',
        complexityScore: 'Complexity assessment updated'
      }
    };

    return outputs[command] || { result: 'Command executed successfully' };
  }

  /**
   * Get current system status
   */
  getSystemStatus() {
    return {
      agentOS: {
        version: '2.0',
        contextReductionTarget: this.config.contextOptimizationTarget,
        activeContexts: this.activeContexts.size
      },
      queenController: {
        maxConcurrent: this.config.maxConcurrentAgents,
        contextWindowSize: this.config.maxContextPerAgent,
        availableAgents: this.agentCapabilities.size
      },
      bridge: {
        initialized: true,
        agentCapabilities: Array.from(this.agentCapabilities.keys()),
        activeExecutions: this.activeContexts.size
      }
    };
  }
}

module.exports = AgentOSQueenBridge;