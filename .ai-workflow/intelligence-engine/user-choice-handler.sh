#!/bin/bash

# User Choice Handler for Intelligent Workflow Decision System
# Provides interactive selection of Claude Flow approaches with AI guidance

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Configuration
INTELLIGENCE_ENGINE_DIR="$(dirname "$0")"
AI_DEV_HOME="$HOME/.ai-dev-os"
ANALYSIS_CACHE="$AI_DEV_HOME/analysis-cache.json"

# Function to display header
print_header() {
    echo -e "\n${BOLD}${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${CYAN}  $1${NC}"
    echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════${NC}\n"
}

# Function to display approach details
show_approach_details() {
    local approach="$1"
    local match_score="$2"
    local icon="$3"
    local name="$4"
    local description="$5"
    local time_estimate="$6"
    local agent_count="$7"
    local best_for="$8"
    
    echo -e "${BOLD}${icon} ${name}${NC}"
    echo -e "  ${CYAN}Description:${NC} ${description}"
    echo -e "  ${CYAN}Time Estimate:${NC} ${time_estimate}"
    echo -e "  ${CYAN}Agent Count:${NC} ${agent_count}"
    echo -e "  ${CYAN}Match Score:${NC} ${match_score}%"
    echo -e "  ${CYAN}Best For:${NC}"
    echo "$best_for" | while IFS= read -r line; do
        echo -e "    • $line"
    done
    echo ""
}

# Function to analyze project
analyze_project() {
    local project_path="${1:-$(pwd)}"
    local task_description="${2:-}"
    
    echo -e "${CYAN}🧠 Analyzing project complexity...${NC}" >&2
    
    # Run complexity analyzer
    local analysis=$(node "$INTELLIGENCE_ENGINE_DIR/complexity-analyzer.js" "$project_path")
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Analysis failed${NC}"
        return 1
    fi
    
    # Cache analysis result
    mkdir -p "$AI_DEV_HOME"
    echo "$analysis" > "$ANALYSIS_CACHE"
    
    # Display analysis summary
    local score=$(echo "$analysis" | jq -r '.score')
    local stage=$(echo "$analysis" | jq -r '.stage')
    local confidence=$(echo "$analysis" | jq -r '.confidence')
    
    echo -e "${GREEN}📊 Analysis Complete!${NC}" >&2
    echo -e "\n${BOLD}Project Analysis Summary:${NC}" >&2
    echo -e "  ${CYAN}Complexity Score:${NC} ${score}/100" >&2
    echo -e "  ${CYAN}Project Stage:${NC} ${stage}" >&2
    echo -e "  ${CYAN}Analysis Confidence:${NC} ${confidence}%" >&2
    
    # Show detected features if available
    if [ "$(echo "$analysis" | jq -r '.factors.features')" != "null" ]; then
        echo -e "\n${BOLD}Detected Features:${NC}" >&2
        echo "$analysis" | jq -r '.factors.features.detected | to_entries[] | select(.value == true) | "  ✓ \(.key)"' >&2
    fi
    
    echo "$analysis"
}

# Function to get approach recommendation
get_recommendation() {
    local analysis="$1"
    local user_choice="${2:-}"
    local task_description="${3:-}"
    local claude_flow_version="${4:-alpha}"
    
    # Run approach selector with version
    local temp_analysis="/tmp/analysis_$$.json"
    echo "$analysis" > "$temp_analysis"
    
    local recommendation=$(node "$INTELLIGENCE_ENGINE_DIR/approach-selector.js" "$temp_analysis" "$user_choice" "$task_description" "$claude_flow_version")
    
    rm -f "$temp_analysis"
    
    echo "$recommendation"
}

# Function to display interactive menu
show_interactive_menu() {
    local analysis="$1"
    local task_description="${2:-}"
    
    print_header "🎯 AI Workflow Approach Selection"
    
    # Get AI recommendation
    local recommendation=$(get_recommendation "$analysis" "" "$task_description")
    
    local selected=$(echo "$recommendation" | jq -r '.selected')
    local reasoning=$(echo "$recommendation" | jq -r '.reasoning[]' | sed 's/^/  • /')
    
    echo -e "${BOLD}${GREEN}🎯 AI Recommendation:${NC}"
    case "$selected" in
        "simpleSwarm")
            echo -e "${BOLD}⚡ Simple Swarm${NC}"
            ;;
        "hiveMind")
            echo -e "${BOLD}🐝 Hive-Mind${NC}"
            ;;
        "hiveMindSparc")
            echo -e "${BOLD}🏛️ Hive-Mind + SPARC${NC}"
            ;;
    esac
    
    echo -e "\n${CYAN}📋 Reasoning:${NC}"
    echo "$reasoning"
    
    echo -e "\n${BOLD}${BLUE}════════════════════════════════════════════════════════${NC}"
    echo -e "\n${BOLD}Available Approaches:${NC}\n"
    
    # Display Simple Swarm option (compute match via jq to avoid inline JS injection)
    local swarm_match=$(printf '%s' "$recommendation" | jq -r '(.alternatives[]? | select(.name=="Simple Swarm") | .matchScore) // .matchScore // 0')
    
    echo -e "${BOLD}1. ⚡ Simple Swarm${NC}"
    echo -e "   • Best for: Quick prototypes, single features, bug fixes"
    echo -e "   • Time: 5-30 minutes"
    echo -e "   • Resources: Low (1 agent)"
    if [ "$selected" = "simpleSwarm" ]; then
        echo -e "   • Match Score: ${GREEN}${swarm_match}% (⭐ RECOMMENDED)${NC}"
    else
        echo -e "   • Match Score: ${swarm_match}%"
    fi
    echo ""
    
    # Display Hive-Mind option
    local hive_match=$(printf '%s' "$recommendation" | jq -r '(.alternatives[]? | select(.name=="Hive-Mind") | .matchScore) // .matchScore // 0')
    
    echo -e "${BOLD}2. 🐝 Hive-Mind${NC}"
    echo -e "   • Best for: Multi-feature development, coordination"
    echo -e "   • Time: 30 minutes - 4 hours"
    echo -e "   • Resources: Medium (4-6 agents)"
    if [ "$selected" = "hiveMind" ]; then
        echo -e "   • Match Score: ${GREEN}${hive_match}% (⭐ RECOMMENDED)${NC}"
    else
        echo -e "   • Match Score: ${hive_match}%"
    fi
    echo ""
    
    # Display Hive-Mind + SPARC option
    local sparc_match=$(printf '%s' "$recommendation" | jq -r '(.alternatives[]? | select(.name=="Hive-Mind + SPARC") | .matchScore) // .matchScore // 0')
    
    echo -e "${BOLD}3. 🏛️ Hive-Mind + SPARC${NC}"
    echo -e "   • Best for: Enterprise projects, systematic development"
    echo -e "   • Time: 4+ hours"
    echo -e "   • Resources: High (8-12 agents)"
    if [ "$selected" = "hiveMindSparc" ]; then
        echo -e "   • Match Score: ${GREEN}${sparc_match}% (⭐ RECOMMENDED)${NC}"
    else
        echo -e "   • Match Score: ${sparc_match}%"
    fi
    echo ""
    
    echo -e "${BOLD}${BLUE}════════════════════════════════════════════════════════${NC}"
    echo -e "\n${BOLD}Choose your approach:${NC}"
    echo -e "[${BOLD}1${NC}] Simple Swarm  [${BOLD}2${NC}] Hive-Mind  [${BOLD}3${NC}] Hive-Mind + SPARC"
    echo -e "[${BOLD}R${NC}] Use AI Recommendation  [${BOLD}A${NC}] Show More Analysis  [${BOLD}Q${NC}] Quit"
    echo -e "\n${CYAN}Your choice: ${NC}"
}

# Function to show detailed analysis
show_detailed_analysis() {
    local analysis="$1"
    
    print_header "📊 Detailed Project Analysis"
    
    echo -e "${BOLD}Complexity Factors:${NC}\n"
    
    # Show all factors with scores
    for factor in size dependencies architecture techStack features team deployment testing; do
        local factor_score=$(echo "$analysis" | jq -r ".factors.$factor.score // 0")
        local factor_desc=$(echo "$analysis" | jq -r ".factors.$factor.description // 'N/A'")
        
        # Determine color based on score
        local color=""
        if [ "$factor_score" -lt 30 ]; then
            color="${GREEN}"
        elif [ "$factor_score" -lt 70 ]; then
            color="${YELLOW}"
        else
            color="${RED}"
        fi
        
        echo -e "  ${BOLD}$(echo $factor | sed 's/.*/\u&/'):${NC}"
        echo -e "    Score: ${color}${factor_score}/100${NC}"
        echo -e "    Details: ${factor_desc}"
        echo ""
    done
    
    echo -e "${CYAN}Press Enter to continue...${NC}"
    read
}

# Function to confirm user choice
confirm_choice() {
    local approach_key="$1"
    local analysis="$2"
    local recommendation="$3"
    
    echo -e "\n${BOLD}${BLUE}════════════════════════════════════════════════════════${NC}"
    echo -e "\n${BOLD}📋 Setup Summary:${NC}"
    
    local name=$(echo "$recommendation" | jq -r '.name')
    local time=$(echo "$recommendation" | jq -r '.timeEstimate')
    local agents=$(echo "$recommendation" | jq -r '.agentCount')
    local command=$(echo "$recommendation" | jq -r '.command')
    
    echo -e "  ${CYAN}Approach:${NC} $name"
    echo -e "  ${CYAN}Estimated Time:${NC} $time"
    echo -e "  ${CYAN}Agent Count:${NC} $agents"
    echo -e "  ${CYAN}Command:${NC} $command"
    
    # Show warning if there's a mismatch
    if [ "$(echo "$recommendation" | jq -r '.mismatch')" = "true" ]; then
        echo -e "\n${YELLOW}⚠️  Warning: Choice doesn't match AI recommendation${NC}"
        echo "$recommendation" | jq -r '.warning.messages[]' | while IFS= read -r msg; do
            echo -e "  ${YELLOW}• $msg${NC}"
        done
    fi
    
    echo -e "\n${CYAN}Proceed with this setup? (Y/n): ${NC}"
    read -n 1 confirm
    echo ""
    
    case "$confirm" in
        n|N)
            echo -e "${YELLOW}🔄 Let's choose again...${NC}"
            return 1
            ;;
        *)
            return 0
            ;;
    esac
}

# Function to execute selected approach
execute_approach() {
    local recommendation="$1"
    local project_path="${2:-$(pwd)}"
    
    local approach=$(echo "$recommendation" | jq -r '.selected')
    local command=$(echo "$recommendation" | jq -r '.command')
    local name=$(echo "$recommendation" | jq -r '.name')
    
    print_header "🚀 Initializing $name"
    
    # Save user selection for learning
    node "$INTELLIGENCE_ENGINE_DIR/approach-selector.js" "$ANALYSIS_CACHE" "$approach" > /dev/null 2>&1
    
    # Execute setup steps
    echo "$recommendation" | jq -r '.setupSteps[]' | while IFS= read -r step; do
        echo -e "${GREEN}✓${NC} $step"
        sleep 0.5
    done
    
    echo -e "\n${BOLD}${GREEN}✅ Setup Complete!${NC}"
    echo -e "\n${CYAN}Ready to execute:${NC}"
    echo -e "${BOLD}$command${NC}"
    
    # Create project configuration
    mkdir -p "$project_path/.ai-dev"
    echo "$recommendation" > "$project_path/.ai-dev/approach-selection.json"
    
    echo -e "\n${CYAN}Next steps:${NC}"
    echo -e "1. Run the command above to start AI coordination"
    echo -e "2. For tmux session: ${BOLD}tmux attach -t ai-dev-session${NC}"
    echo -e "3. Monitor progress in ${BOLD}.ai-dev/logs/${NC}"

  # Auto-run the recommended command unless disabled
  if [ "${AIWF_AUTORUN:-true}" = "true" ]; then
    echo -e "\n${CYAN}Launching now (set AIWF_AUTORUN=false to disable auto-run) ...${NC}"
    # Use a login shell to preserve PATH/npx behavior
    bash -lc "$command"
  else
    echo -e "\n${YELLOW}Auto-run disabled (AIWF_AUTORUN=false). You can run the command manually above.${NC}"
  fi
}

# Main execution function
main() {
    local mode="${1:-interactive}"
    local task_description="${2:-}"
    local project_path="${3:-$(pwd)}"
    local claude_flow_version="${CLAUDE_FLOW_VERSION:-alpha}"  # Can be set via environment variable
    
    case "$mode" in
        --auto|--automatic)
            # Automatic mode - AI decides everything
            echo -e "${CYAN}🤖 Automatic mode - AI will select optimal approach${NC}\n"
            
            local analysis=$(analyze_project "$project_path" "$task_description")
            if [ $? -ne 0 ]; then
                exit 1
            fi
            
            local recommendation=$(get_recommendation "$analysis" "" "$task_description")
            execute_approach "$recommendation" "$project_path"
            ;;
            
        --interactive|--choose)
            # Interactive mode - show options and let user choose
            local analysis=$(analyze_project "$project_path" "$task_description")
            if [ $? -ne 0 ]; then
                exit 1
            fi
            
            while true; do
                show_interactive_menu "$analysis" "$task_description"
                read -n 1 choice
                echo ""
                
                case "$choice" in
                    1)
                        recommendation=$(get_recommendation "$analysis" "simple-swarm" "$task_description")
                        if confirm_choice "simpleSwarm" "$analysis" "$recommendation"; then
                            execute_approach "$recommendation" "$project_path"
                            break
                        fi
                        ;;
                    2)
                        recommendation=$(get_recommendation "$analysis" "hive-mind" "$task_description")
                        if confirm_choice "hiveMind" "$analysis" "$recommendation"; then
                            execute_approach "$recommendation" "$project_path"
                            break
                        fi
                        ;;
                    3)
                        recommendation=$(get_recommendation "$analysis" "hive-mind-sparc" "$task_description")
                        if confirm_choice "hiveMindSparc" "$analysis" "$recommendation"; then
                            execute_approach "$recommendation" "$project_path"
                            break
                        fi
                        ;;
                    r|R)
                        recommendation=$(get_recommendation "$analysis" "" "$task_description")
                        local selected=$(echo "$recommendation" | jq -r '.selected')
                        if confirm_choice "$selected" "$analysis" "$recommendation"; then
                            execute_approach "$recommendation" "$project_path"
                            break
                        fi
                        ;;
                    a|A)
                        show_detailed_analysis "$analysis"
                        ;;
                    q|Q)
                        echo -e "${YELLOW}👋 Setup cancelled${NC}"
                        exit 0
                        ;;
                    *)
                        echo -e "${RED}❌ Invalid choice. Please try again.${NC}"
                        sleep 1
                        ;;
                esac
            done
            ;;
            
        --analyze-only|--recommend)
            # Analysis only mode - show recommendation without executing
            local analysis=$(analyze_project "$project_path" "$task_description")
            if [ $? -ne 0 ]; then
                exit 1
            fi
            
            local recommendation=$(get_recommendation "$analysis" "" "$task_description")
            
            print_header "📊 Analysis & Recommendation"
            echo "$recommendation" | jq '.'
            ;;
            
        --swarm|--simple)
            # Force Simple Swarm
            echo -e "${CYAN}⚡ Forcing Simple Swarm approach${NC}\n"
            local analysis=$(analyze_project "$project_path" "$task_description")
            local recommendation=$(get_recommendation "$analysis" "simple-swarm" "$task_description")
            
            if [ "$(echo "$recommendation" | jq -r '.mismatch')" = "true" ]; then
                echo -e "${YELLOW}⚠️  Warning: Simple Swarm may not be optimal for this project${NC}"
                if ! confirm_choice "simpleSwarm" "$analysis" "$recommendation"; then
                    exit 1
                fi
            fi
            
            execute_approach "$recommendation" "$project_path"
            ;;
            
        --hive|--hivemind)
            # Force Hive-Mind
            echo -e "${CYAN}🐝 Forcing Hive-Mind approach${NC}\n"
            local analysis=$(analyze_project "$project_path" "$task_description")
            local recommendation=$(get_recommendation "$analysis" "hive-mind" "$task_description")
            
            if [ "$(echo "$recommendation" | jq -r '.mismatch')" = "true" ]; then
                echo -e "${YELLOW}⚠️  Warning: Hive-Mind may not be optimal for this project${NC}"
                if ! confirm_choice "hiveMind" "$analysis" "$recommendation"; then
                    exit 1
                fi
            fi
            
            execute_approach "$recommendation" "$project_path"
            ;;
            
        --sparc|--enterprise)
            # Force Hive-Mind + SPARC
            echo -e "${CYAN}🏛️ Forcing Hive-Mind + SPARC approach${NC}\n"
            local analysis=$(analyze_project "$project_path" "$task_description")
            local recommendation=$(get_recommendation "$analysis" "hive-mind-sparc" "$task_description")
            
            if [ "$(echo "$recommendation" | jq -r '.mismatch')" = "true" ]; then
                echo -e "${YELLOW}⚠️  Warning: SPARC may be overkill for this project${NC}"
                if ! confirm_choice "hiveMindSparc" "$analysis" "$recommendation"; then
                    exit 1
                fi
            fi
            
            execute_approach "$recommendation" "$project_path"
            ;;
            
        --help|-h)
            echo "Usage: $0 [mode] [task-description] [project-path]"
            echo ""
            echo "Modes:"
            echo "  --auto, --automatic     AI selects optimal approach automatically"
            echo "  --interactive, --choose Show analysis and let user choose"
            echo "  --analyze-only         Analyze and show recommendation only"
            echo "  --swarm, --simple      Force Simple Swarm approach"
            echo "  --hive, --hivemind     Force Hive-Mind approach"
            echo "  --sparc, --enterprise  Force Hive-Mind + SPARC approach"
            echo "  --help, -h             Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 --auto \"Build REST API\""
            echo "  $0 --interactive"
            echo "  $0 --sparc \"Complex enterprise system\""
            ;;
            
        *)
            # Default to interactive mode
            main "--interactive" "$mode" "$task_description"
            ;;
    esac
}

# Check dependencies
check_dependencies() {
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is required but not installed${NC}"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        echo -e "${RED}❌ jq is required but not installed${NC}"
        echo "Install with: sudo apt-get install jq"
        exit 1
    fi
    
    if [ ! -f "$INTELLIGENCE_ENGINE_DIR/complexity-analyzer.js" ]; then
        echo -e "${RED}❌ complexity-analyzer.js not found${NC}"
        exit 1
    fi
    
    if [ ! -f "$INTELLIGENCE_ENGINE_DIR/approach-selector.js" ]; then
        echo -e "${RED}❌ approach-selector.js not found${NC}"
        exit 1
    fi
}

# Run dependency check
check_dependencies

# Execute main function
main "$@"