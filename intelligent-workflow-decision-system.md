# Intelligent Workflow Decision System
## AI-Powered + User-Controlled Approach Selection for Claude Flow 2.0 + SPARC

### Executive Summary
The Intelligent Workflow Decision System provides both **automatic analysis** and **user choice** for selecting the optimal Claude Flow approach (Simple Swarm, Hive-Mind, or Hive-Mind + SPARC). Users can rely on AI recommendations or manually select their preferred approach based on their needs and preferences.

## Dual-Mode Operation

### 🤖 **Automatic Mode** (AI Decides)
```bash
./ai-workflow init --auto "Build REST API"     # AI analyzes and chooses automatically
./ai-workflow init --auto                      # Analyze current project automatically
CLAUDE_FLOW_VERSION=beta ./ai-workflow init --auto  # Use specific Claude Flow version
```

### 👤 **Interactive Mode** (User Chooses)
```bash
./ai-workflow init --interactive       # Show options and let user choose (default)
./ai-workflow init                     # Same as --interactive
./ai-workflow init --choose            # Present approaches with recommendations
```

### 🔍 **Analysis Mode** (Recommend Only)
```bash
./ai-workflow analyze           # Analyze project complexity and show details
./ai-workflow status            # Show current configuration and approach
./ai-workflow customize         # Generate customized documentation
```

## Enhanced Command Structure

### **Smart Initialization Options**
```bash
# Automatic (AI decides based on analysis)
ai-dev init --auto "Build a social media platform"
ai-dev init --smart             # Analyze current project automatically

# Interactive (User chooses with AI guidance)
ai-dev init --interactive "Create REST API"
ai-dev init --choose            # Show all options with recommendations

# Manual (Direct approach selection)
ai-dev init --swarm             # Force Simple Swarm
ai-dev init --hive              # Force Hive-Mind
ai-dev init --sparc             # Force Hive-Mind + SPARC

# Analysis only (No execution)
ai-dev init --analyze-only      # Show recommendation without setup
```

## Interactive User Experience Flow

### **Example: Interactive Mode**
```bash
$ ai-dev init --interactive "Build e-commerce platform with real-time features"

🧠 Analyzing project complexity...
📊 Analysis Complete!

Project Complexity Score: 85/100

🎯 AI Recommendation: Hive-Mind + SPARC (Enterprise)
📋 Reasoning:
  ✓ High feature complexity detected (real-time, e-commerce)
  ✓ Multi-system architecture required
  ✓ Enterprise-level planning recommended
  ✓ SPARC methodology ideal for systematic development

Available Approaches:

1. ⚡ Simple Swarm
   • Best for: Quick prototypes, single features
   • Time: 5-30 minutes
   • Resources: Low
   • Agents: 1
   • Match Score: 15% (Not recommended for this complexity)

2. 🐝 Hive-Mind
   • Best for: Multi-feature development, coordination
   • Time: 30 minutes - 4 hours
   • Resources: Medium
   • Agents: 4-6
   • Match Score: 70% (Good fit)

3. 🏛️ Hive-Mind + SPARC (⭐ RECOMMENDED)
   • Best for: Enterprise projects, systematic development
   • Time: 4+ hours
   • Resources: High
   • Agents: 8-12
   • Match Score: 95% (Excellent fit)

Choose your approach:
[1] Simple Swarm  [2] Hive-Mind  [3] Hive-Mind + SPARC  [R] Use Recommended  [A] Analyze More

Your choice:
```

### **User Choice Handling**
```bash
# File: enhanced-ai-dev/interactive-handler.sh

handle_user_choice() {
  local analysis="$1"
  local user_input="$2"

  case "$user_input" in
    "1"|"swarm"|"simple")
      echo "⚡ You selected: Simple Swarm"
      confirm_choice "simpleSwarm" "$analysis"
      ;;
    "2"|"hive"|"hivemind")
      echo "🐝 You selected: Hive-Mind"
      confirm_choice "hiveMind" "$analysis"
      ;;
    "3"|"sparc"|"enterprise")
      echo "🏛️ You selected: Hive-Mind + SPARC"
      confirm_choice "hiveMindSparc" "$analysis"
      ;;
    "R"|"r"|"recommended"|"")
      echo "⭐ Using AI recommendation"
      local recommended=$(echo "$analysis" | jq -r '.recommendedApproach')
      confirm_choice "$recommended" "$analysis"
      ;;
    "A"|"a"|"analyze")
      show_detailed_analysis "$analysis"
      prompt_user_choice "$analysis"
      ;;
    "Q"|"q"|"quit")
      echo "👋 Setup cancelled"
      exit 0
      ;;
    *)
      echo "❌ Invalid choice. Please try again."
      prompt_user_choice "$analysis"
      ;;
  esac
}

confirm_choice() {
  local approach="$1"
  local analysis="$2"

  local approach_info=$(get_approach_info "$approach")

  echo ""
  echo "📋 Setup Summary:"
  echo "   Approach: $(echo "$approach_info" | jq -r '.name')"
  echo "   Estimated Time: $(echo "$approach_info" | jq -r '.estimatedTime')"
  echo "   Resource Usage: $(echo "$approach_info" | jq -r '.resources')"
  echo "   Agent Count: $(echo "$approach_info" | jq -r '.agentCount')"
  echo ""

  read -p "Proceed with this setup? (Y/n): " confirm
  case "$confirm" in
    "n"|"N"|"no"|"No")
      echo "🔄 Let's choose again..."
      prompt_user_choice "$analysis"
      ;;
    *)
      proceed_with_approach "$approach" "$analysis"
      ;;
  esac
}
```

## Approach Information System

### **Detailed Approach Descriptions**
```javascript
// File: enhanced-ai-dev/approach-info.js
const approachDetails = {
  simpleSwarm: {
    name: "Simple Swarm",
    icon: "⚡",
    description: "Quick AI coordination for straightforward tasks",
    bestFor: [
      "Single feature development",
      "Quick prototypes",
      "Bug fixes",
      "Simple integrations",
      "Learning and experimentation"
    ],
    timeRange: "5-30 minutes",
    resources: "Low",
    agentCount: "1",
    tmuxWindows: 1,
    commands: [
      "npx claude-flow@alpha swarm 'task description'"
    ],
    whenToUse: "When you need quick results for simple, well-defined tasks",
    limitations: [
      "No persistent memory",
      "Limited coordination",
      "Single-threaded execution"
    ]
  },

  hiveMind: {
    name: "Hive-Mind",
    icon: "🐝",
    description: "Intelligent multi-agent coordination with specialized roles",
    bestFor: [
      "Multi-feature development",
      "Fullstack applications",
      "Complex integrations",
      "Team-based development",
      "Medium-scale projects"
    ],
    timeRange: "30 minutes - 4 hours",
    resources: "Medium",
    agentCount: "4-6",
    tmuxWindows: 4,
    commands: [
      "npx claude-flow@alpha hive-mind spawn 'project' --agents 6 --claude"
    ],
    whenToUse: "When you need intelligent coordination for multi-part projects",
    features: [
      "Specialized agent roles",
      "Cross-session memory",
      "Parallel execution",
      "Intelligent coordination"
    ]
  },

  hiveMindSparc: {
    name: "Hive-Mind + SPARC",
    icon: "🏛️",
    description: "Enterprise methodology with systematic development phases",
    bestFor: [
      "Enterprise applications",
      "Complex system architecture",
      "Long-term projects",
      "Systematic development",
      "Professional documentation"
    ],
    timeRange: "4+ hours",
    resources: "High",
    agentCount: "8-12",
    tmuxWindows: 6,
    commands: [
      "npx claude-flow@alpha hive-mind spawn 'project' --sparc --agents 10 --claude",
      "npx claude-flow@alpha sparc wizard --interactive"
    ],
    whenToUse: "When you need comprehensive planning and systematic development",
    sparcPhases: [
      "Specification - Requirements and planning",
      "Pseudocode - Algorithm design",
      "Architecture - System design",
      "Refinement - Iterative improvement",
      "Completion - Final implementation"
    ],
    features: [
      "Structured SPARC methodology",
      "Comprehensive documentation",
      "Neural pattern learning",
      "Enterprise-grade coordination",
      "Cross-phase memory"
    ]
  }
};
```

## Quick Start Examples

### **Automatic Mode Examples**
```bash
# Let AI decide everything
ai-dev init --auto "Build a todo app with real-time sync"
# → AI chooses Hive-Mind based on real-time requirements

# Smart orchestration
ai-dev orchestrate --smart "Add user authentication system"
# → AI analyzes existing project and chooses appropriate approach

# Adaptive workflow
ai-dev flow --adaptive "Optimize database queries"
# → AI routes to Simple Swarm for focused optimization task
```

### **Interactive Mode Examples**
```bash
# Full interactive setup
ai-dev init --interactive "Create microservices architecture"
# → Shows analysis, presents options, lets user choose

# Quick choice with guidance
ai-dev init --choose
# → Analyzes current directory, shows recommendations

# Manual override with confirmation
ai-dev init --sparc --confirm
# → Forces SPARC but asks for confirmation with analysis
```

### **Mixed Mode Examples**
```bash
# Analyze first, then choose
ai-dev analyze --recommend "Build ML pipeline"
ai-dev init --use-analysis

# Override with explanation
ai-dev init --swarm --explain-mismatch "Complex enterprise system"
# → Uses Simple Swarm but explains why it might not be optimal
```

## Integration with Existing Workflow

### **Backward Compatibility**
```bash
# Old commands work with intelligent defaults
ai-dev init                    # → Interactive mode with recommendations
ai-dev orchestrate            # → Smart analysis and approach selection
ai-dev flow swarm "task"      # → Direct Simple Swarm usage (unchanged)

# Enhanced versions
ai-dev init --smart           # → Automatic intelligent selection
ai-dev orchestrate --adaptive # → AI-driven approach selection
ai-dev flow --auto "task"     # → Intelligent routing
```

### **Configuration Options**
```bash
# Set default behavior
ai-dev config set default-mode interactive  # Always show choices
ai-dev config set default-mode auto        # Always use AI decision
ai-dev config set default-mode manual      # Always prompt for approach

# Set complexity thresholds
ai-dev config set swarm-threshold 30       # Use swarm for scores 0-30
ai-dev config set hive-threshold 70        # Use hive for scores 31-70
ai-dev config set sparc-threshold 71       # Use SPARC for scores 71+

# User experience preferences
ai-dev config set show-analysis true       # Always show detailed analysis
ai-dev config set confirm-choices true     # Always confirm before proceeding
ai-dev config set collect-feedback true    # Ask for feedback after sessions
```
