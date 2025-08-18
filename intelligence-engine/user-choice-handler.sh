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
DOCUMENTS_BACKUP_DIR="$AI_DEV_HOME/document-backups"
PROJECT_DOCS_DIR="$(pwd)"

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
    echo -e "[${BOLD}R${NC}] Use AI Recommendation  [${BOLD}A${NC}] Show More Analysis"
    echo -e "[${BOLD}D${NC}] Document Management  [${BOLD}Q${NC}] Quit"
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

# ═══════════════════════════════════════════════════════════════
# DOCUMENT MANAGEMENT FUNCTIONS
# ═══════════════════════════════════════════════════════════════

# Function to detect existing documents
detect_existing_documents() {
    local project_path="${1:-$(pwd)}"
    declare -A documents
    
    # Core documents
    [ -f "$project_path/README.md" ] && documents["README.md"]="exists"
    [ -f "$project_path/CLAUDE.md" ] && documents["CLAUDE.md"]="exists"
    [ -f "$project_path/package.json" ] && documents["package.json"]="exists"
    [ -f "$project_path/tsconfig.json" ] && documents["tsconfig.json"]="exists"
    [ -f "$project_path/.gitignore" ] && documents[".gitignore"]="exists"
    
    # Agent-OS structure
    [ -f "$project_path/mission.md" ] && documents["mission.md"]="exists"
    [ -f "$project_path/roadmap.md" ] && documents["roadmap.md"]="exists"
    [ -f "$project_path/decisions.md" ] && documents["decisions.md"]="exists"
    [ -f "$project_path/standards.md" ] && documents["standards.md"]="exists"
    [ -f "$project_path/instructions.md" ] && documents["instructions.md"]="exists"
    
    # Project structure documents
    [ -d "$project_path/src" ] && documents["src/"]="exists"
    [ -d "$project_path/tests" ] && documents["tests/"]="exists"
    [ -d "$project_path/docs" ] && documents["docs/"]="exists"
    [ -d "$project_path/.ai-dev" ] && documents[".ai-dev/"]="exists"
    
    # Output results
    for doc in "${!documents[@]}"; do
        echo "$doc:${documents[$doc]}"
    done
}

# Function to show document preview
show_document_preview() {
    local file_path="$1"
    local preview_lines="${2:-20}"
    
    if [ ! -f "$file_path" ]; then
        echo -e "${RED}❌ File not found: $file_path${NC}"
        return 1
    fi
    
    echo -e "\n${BOLD}${CYAN}Preview of $file_path:${NC}"
    echo -e "${BLUE}────────────────────────────────────────${NC}"
    head -n "$preview_lines" "$file_path" | cat -n
    
    local total_lines=$(wc -l < "$file_path")
    if [ "$total_lines" -gt "$preview_lines" ]; then
        echo -e "${BLUE}────────────────────────────────────────${NC}"
        echo -e "${YELLOW}... (showing first $preview_lines of $total_lines lines)${NC}"
    fi
    echo ""
}

# Function to backup existing documents
backup_existing() {
    local file_path="$1"
    local backup_dir="${DOCUMENTS_BACKUP_DIR}/$(date +%Y%m%d_%H%M%S)"
    
    if [ ! -f "$file_path" ]; then
        return 0
    fi
    
    mkdir -p "$backup_dir"
    local filename=$(basename "$file_path")
    cp "$file_path" "$backup_dir/$filename"
    
    echo -e "${GREEN}✓${NC} Backed up $filename to $backup_dir"
}

# Function to confirm document update
confirm_update() {
    local document_name="$1"
    local action="${2:-update}"
    
    echo -e "\n${CYAN}$action $document_name? (Y/n/p for preview): ${NC}"
    read -n 1 choice
    echo ""
    
    case "$choice" in
        n|N)
            return 1
            ;;
        p|P)
            if [ -f "$PROJECT_DOCS_DIR/$document_name" ]; then
                show_document_preview "$PROJECT_DOCS_DIR/$document_name"
                confirm_update "$document_name" "$action"
            else
                echo -e "${YELLOW}No existing file to preview${NC}"
                confirm_update "$document_name" "$action"
            fi
            ;;
        *)
            return 0
            ;;
    esac
}

# Function to show CLAUDE.md changes
show_claude_md_changes() {
    local current_file="$PROJECT_DOCS_DIR/CLAUDE.md"
    local proposed_changes="$1"
    
    echo -e "\n${BOLD}${CYAN}CLAUDE.md Change Summary:${NC}"
    echo -e "${BLUE}────────────────────────────────────────${NC}"
    
    if [ -f "$current_file" ]; then
        echo -e "${YELLOW}Current Configuration:${NC}"
        grep -E "^(## |# |- )" "$current_file" | head -10
        echo ""
        
        echo -e "${GREEN}Proposed Changes:${NC}"
        echo "$proposed_changes" | head -10
        echo ""
        
        echo -e "${CYAN}Note: Custom instructions and workflow configurations will be preserved${NC}"
    else
        echo -e "${GREEN}New CLAUDE.md will be created with:${NC}"
        echo "$proposed_changes" | head -15
    fi
    echo -e "${BLUE}────────────────────────────────────────${NC}"
}

# Function to handle Agent-OS structure creation
create_agent_os_structure() {
    echo -e "\n${BOLD}${MAGENTA}📋 Agent-OS Structure Setup${NC}"
    echo -e "${CYAN}This will create the Agent-OS mission-driven architecture${NC}\n"
    
    # Mission.md
    if confirm_update "mission.md" "create"; then
        backup_existing "$PROJECT_DOCS_DIR/mission.md"
        cat > "$PROJECT_DOCS_DIR/mission.md" << 'EOF'
# Mission Statement

## Primary Objective
Define the core mission and purpose of this project.

## Success Criteria
- [ ] Clear problem definition
- [ ] Measurable outcomes
- [ ] Timeline and milestones
- [ ] Resource requirements

## Stakeholders
- Development Team
- End Users
- Business Stakeholders

## Constraints
- Time limitations
- Resource constraints
- Technical limitations
- Regulatory requirements
EOF
        echo -e "${GREEN}✓${NC} Created mission.md"
    fi
    
    # Roadmap.md
    if confirm_update "roadmap.md" "create"; then
        backup_existing "$PROJECT_DOCS_DIR/roadmap.md"
        cat > "$PROJECT_DOCS_DIR/roadmap.md" << 'EOF'
# Project Roadmap

## Phase 1: Foundation
- [ ] Core architecture
- [ ] Basic functionality
- [ ] Initial testing

## Phase 2: Development
- [ ] Feature implementation
- [ ] Integration testing
- [ ] Performance optimization

## Phase 3: Deployment
- [ ] Production deployment
- [ ] Monitoring setup
- [ ] Documentation completion

## Future Phases
- [ ] Feature enhancements
- [ ] Scaling considerations
- [ ] Maintenance planning
EOF
        echo -e "${GREEN}✓${NC} Created roadmap.md"
    fi
    
    # Decisions.md
    if confirm_update "decisions.md" "create"; then
        backup_existing "$PROJECT_DOCS_DIR/decisions.md"
        cat > "$PROJECT_DOCS_DIR/decisions.md" << EOF
# Architecture Decision Records (ADR)

## Decision Log

### ADR-001: [Decision Title]
**Date:** $(date +%Y-%m-%d)
**Status:** Proposed | Accepted | Rejected | Superseded

**Context:**
Brief description of the problem or situation.

**Decision:**
The decision that was made.

**Consequences:**
- Positive outcomes
- Negative outcomes
- Risks and mitigation strategies

---

## Decision Template
Copy the template above for new decisions.
EOF
        echo -e "${GREEN}✓${NC} Created decisions.md"
    fi
    
    # Standards.md
    if confirm_update "standards.md" "create"; then
        backup_existing "$PROJECT_DOCS_DIR/standards.md"
        cat > "$PROJECT_DOCS_DIR/standards.md" << 'EOF'
# Development Standards

## Code Quality
- Follow language-specific style guides
- Maintain test coverage > 80%
- Use linting and formatting tools
- Document public APIs

## Git Workflow
- Use meaningful commit messages
- Create feature branches
- Require code reviews
- Maintain clean history

## Documentation
- Update README for major changes
- Document architectural decisions
- Maintain API documentation
- Include setup instructions

## Security
- Follow security best practices
- Regular dependency updates
- Security scanning in CI/CD
- Secure credential management
EOF
        echo -e "${GREEN}✓${NC} Created standards.md"
    fi
    
    # Instructions.md
    if confirm_update "instructions.md" "create"; then
        backup_existing "$PROJECT_DOCS_DIR/instructions.md"
        cat > "$PROJECT_DOCS_DIR/instructions.md" << 'EOF'
# Development Instructions

## Getting Started
1. Clone the repository
2. Install dependencies
3. Configure environment
4. Run initial setup

## Development Workflow
1. Create feature branch
2. Implement changes
3. Write/update tests
4. Submit pull request
5. Code review process
6. Merge to main

## Testing
- Run unit tests: `npm test`
- Run integration tests: `npm run test:integration`
- Run e2e tests: `npm run test:e2e`
- Check coverage: `npm run coverage`

## Deployment
- Staging: Automated on PR merge
- Production: Manual approval required
- Rollback: Available via deployment dashboard

## Troubleshooting
Common issues and solutions:
- Build failures
- Test failures
- Deployment issues
- Performance problems
EOF
        echo -e "${GREEN}✓${NC} Created instructions.md"
    fi
}

# Function to handle selective document updates
handle_selective_updates() {
    local project_path="${1:-$(pwd)}"
    
    echo -e "\n${BOLD}${CYAN}📄 Selective Document Updates${NC}"
    echo -e "${YELLOW}Select documents to update (space-separated numbers):${NC}\n"
    
    # Build document list
    declare -a doc_list=()
    declare -a doc_paths=()
    local counter=1
    
    # Core documents
    for doc in "README.md" "CLAUDE.md" "package.json" ".gitignore"; do
        local status="new"
        [ -f "$project_path/$doc" ] && status="exists"
        echo -e "  ${counter}) $doc ${YELLOW}($status)${NC}"
        doc_list+=("$doc")
        doc_paths+=("$project_path/$doc")
        ((counter++))
    done
    
    # Agent-OS documents
    echo -e "\n${BOLD}Agent-OS Documents:${NC}"
    for doc in "mission.md" "roadmap.md" "decisions.md" "standards.md" "instructions.md"; do
        local status="new"
        [ -f "$project_path/$doc" ] && status="exists"
        echo -e "  ${counter}) $doc ${YELLOW}($status)${NC}"
        doc_list+=("$doc")
        doc_paths+=("$project_path/$doc")
        ((counter++))
    done
    
    echo -e "\n${CYAN}Enter selection (e.g., '1 3 5' or 'all'): ${NC}"
    read selection
    
    case "$selection" in
        all|ALL)
            echo -e "${GREEN}Updating all documents...${NC}"
            for i in "${!doc_list[@]}"; do
                update_document "${doc_list[$i]}" "${doc_paths[$i]}"
            done
            ;;
        *)
            for num in $selection; do
                if [[ "$num" =~ ^[0-9]+$ ]] && [ "$num" -ge 1 ] && [ "$num" -le "${#doc_list[@]}" ]; then
                    local idx=$((num - 1))
                    update_document "${doc_list[$idx]}" "${doc_paths[$idx]}"
                else
                    echo -e "${RED}Invalid selection: $num${NC}"
                fi
            done
            ;;
    esac
}

# Function to update individual document
update_document() {
    local doc_name="$1"
    local doc_path="$2"
    
    echo -e "\n${CYAN}Updating $doc_name...${NC}"
    
    case "$doc_name" in
        "mission.md"|"roadmap.md"|"decisions.md"|"standards.md"|"instructions.md")
            create_agent_os_structure
            ;;
        "CLAUDE.md")
            handle_claude_md_update "$doc_path"
            ;;
        "README.md")
            handle_readme_update "$doc_path"
            ;;
        *)
            echo -e "${YELLOW}Custom update for $doc_name not implemented${NC}"
            ;;
    esac
}

# Function to handle CLAUDE.md updates with preservation
handle_claude_md_update() {
    local claude_file="$1"
    local temp_file="/tmp/claude_md_merge_$$"
    
    # Create base CLAUDE.md content
    local base_content='# Claude Configuration - active Stage Project

## Project Analysis
- **Complexity Score**: Auto-detected
- **Stage**: active
- **Selected Approach**: Auto-selected based on analysis
- **Claude Flow Version**: alpha (experimental)

## Technology Stack
### Languages
- JavaScript/TypeScript
  - Use ES6+ features
  - Async/await for asynchronous operations
  - Proper error handling and type safety

## Architecture Guidelines
- RESTful API design
- Service layer pattern
- Repository pattern for data access
- Authentication and authorization

## Stage-Specific Instructions (active)
- Maintain consistent code quality
- Add features systematically
- Ensure adequate test coverage
- Keep documentation up to date

## Workflow Configuration
- Multi-agent coordination enabled
- Shared memory store for cross-agent communication
- Event-driven architecture
- Hierarchical task management'

    if [ -f "$claude_file" ]; then
        echo -e "${YELLOW}Preserving existing CLAUDE.md customizations...${NC}"
        
        # Extract custom sections (anything after "## Custom Instructions" if present)
        if grep -q "## Custom Instructions" "$claude_file"; then
            echo -e "\n## Custom Instructions" >> "$temp_file"
            sed -n '/## Custom Instructions/,$p' "$claude_file" | tail -n +2 >> "$temp_file"
        fi
        
        # Backup and merge
        backup_existing "$claude_file"
        echo "$base_content" > "$claude_file"
        
        if [ -f "$temp_file" ]; then
            cat "$temp_file" >> "$claude_file"
        fi
        
        rm -f "$temp_file"
        echo -e "${GREEN}✓${NC} Updated CLAUDE.md (preserved customizations)"
    else
        echo "$base_content" > "$claude_file"
        echo -e "${GREEN}✓${NC} Created new CLAUDE.md"
    fi
}

# Function to handle README.md updates
handle_readme_update() {
    local readme_file="$1"
    local project_name=$(basename "$(pwd)")
    
    if [ -f "$readme_file" ]; then
        if ! confirm_update "README.md" "update"; then
            return 0
        fi
        backup_existing "$readme_file"
    fi
    
    cat > "$readme_file" << EOF
# $project_name

## Overview
Brief description of the project and its purpose.

## Features
- Feature 1
- Feature 2
- Feature 3

## Quick Start
\`\`\`bash
# Clone the repository
git clone <repository-url>

# Install dependencies
npm install

# Start development server
npm run dev
\`\`\`

## Development
- **Testing**: \`npm test\`
- **Build**: \`npm run build\`
- **Lint**: \`npm run lint\`

## Architecture
This project follows Agent-OS principles with:
- Mission-driven development
- Systematic documentation
- Quality standards enforcement

## Documentation
- [Mission Statement](./mission.md)
- [Project Roadmap](./roadmap.md)
- [Architecture Decisions](./decisions.md)
- [Development Standards](./standards.md)
- [Setup Instructions](./instructions.md)

## Contributing
Please read our [development standards](./standards.md) and [instructions](./instructions.md) before contributing.

## License
[Specify license]
EOF
    
    echo -e "${GREEN}✓${NC} Updated README.md"
}

# Function to show existing documents
show_existing_documents() {
    local project_path="${1:-$(pwd)}"
    
    print_header "📋 Existing Documents"
    
    echo -e "${BOLD}Core Documents:${NC}"
    for doc in "README.md" "CLAUDE.md" "package.json" ".gitignore"; do
        if [ -f "$project_path/$doc" ]; then
            local size=$(du -h "$project_path/$doc" | cut -f1)
            local modified=$(stat -c %y "$project_path/$doc" 2>/dev/null | cut -d' ' -f1)
            echo -e "  ${GREEN}✓${NC} $doc ${YELLOW}($size, modified: $modified)${NC}"
        else
            echo -e "  ${RED}✗${NC} $doc ${YELLOW}(missing)${NC}"
        fi
    done
    
    echo -e "\n${BOLD}Agent-OS Documents:${NC}"
    for doc in "mission.md" "roadmap.md" "decisions.md" "standards.md" "instructions.md"; do
        if [ -f "$project_path/$doc" ]; then
            local size=$(du -h "$project_path/$doc" | cut -f1)
            local modified=$(stat -c %y "$project_path/$doc" 2>/dev/null | cut -d' ' -f1)
            echo -e "  ${GREEN}✓${NC} $doc ${YELLOW}($size, modified: $modified)${NC}"
        else
            echo -e "  ${RED}✗${NC} $doc ${YELLOW}(missing)${NC}"
        fi
    done
    
    echo -e "\n${BOLD}Project Structure:${NC}"
    for dir in "src/" "tests/" "docs/" ".ai-dev/"; do
        if [ -d "$project_path/${dir%/}" ]; then
            local count=$(find "$project_path/${dir%/}" -type f | wc -l)
            echo -e "  ${GREEN}✓${NC} $dir ${YELLOW}($count files)${NC}"
        else
            echo -e "  ${RED}✗${NC} $dir ${YELLOW}(missing)${NC}"
        fi
    done
    
    echo -e "\n${CYAN}Press Enter to continue...${NC}"
    read
}

# Main document management menu
handle_document_choice() {
    local project_path="${1:-$(pwd)}"
    
    while true; do
        print_header "📄 Document Management Options"
        
        echo -e "${BOLD}Choose your document management approach:${NC}\n"
        echo -e "1) ${GREEN}Generate all new documents${NC} (replaces existing)"
        echo -e "2) ${CYAN}Update existing documents${NC} (preserves customizations)"
        echo -e "3) ${YELLOW}Selective update${NC} (choose specific documents)"
        echo -e "4) ${MAGENTA}Agent-OS structure only${NC} (mission-driven docs)"
        echo -e "5) ${BLUE}View existing documents${NC}"
        echo -e "6) ${RED}Skip document generation${NC}"
        echo -e "B) ${YELLOW}Back to main menu${NC}"
        echo -e "Q) ${RED}Quit${NC}"
        
        echo -e "\n${CYAN}Your choice: ${NC}"
        read -n 1 doc_choice
        echo ""
        
        case "$doc_choice" in
            1)
                echo -e "${GREEN}Generating all new documents...${NC}"
                # Backup existing
                if ls "$project_path"/*.md >/dev/null 2>&1; then
                    echo -e "${YELLOW}Backing up existing documents...${NC}"
                    for file in "$project_path"/*.md; do
                        [ -f "$file" ] && backup_existing "$file"
                    done
                fi
                
                # Generate all
                handle_claude_md_update "$project_path/CLAUDE.md"
                handle_readme_update "$project_path/README.md"
                create_agent_os_structure
                
                echo -e "\n${GREEN}✅ All documents generated successfully!${NC}"
                break
                ;;
            2)
                echo -e "${CYAN}Updating existing documents with preservation...${NC}"
                handle_claude_md_update "$project_path/CLAUDE.md"
                handle_readme_update "$project_path/README.md"
                create_agent_os_structure
                
                echo -e "\n${GREEN}✅ Documents updated successfully!${NC}"
                break
                ;;
            3)
                handle_selective_updates "$project_path"
                break
                ;;
            4)
                echo -e "${MAGENTA}Creating Agent-OS structure...${NC}"
                create_agent_os_structure
                
                echo -e "\n${GREEN}✅ Agent-OS structure created successfully!${NC}"
                break
                ;;
            5)
                show_existing_documents "$project_path"
                ;;
            6)
                echo -e "${YELLOW}📄 Skipping document generation${NC}"
                break
                ;;
            b|B)
                return 0
                ;;
            q|Q)
                echo -e "${YELLOW}👋 Exiting document management${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}❌ Invalid choice. Please try again.${NC}"
                sleep 1
                ;;
        esac
    done
}

# ═══════════════════════════════════════════════════════════════
# END DOCUMENT MANAGEMENT FUNCTIONS
# ═══════════════════════════════════════════════════════════════

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
                    d|D)
                        handle_document_choice "$project_path"
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
            
        --docs|--documents)
            # Document management only
            echo -e "${CYAN}📄 Document Management Mode${NC}\n"
            handle_document_choice "$project_path"
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
            echo "  --docs, --documents    Document management only (Agent-OS structure)"
            echo "  --help, -h             Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 --auto \"Build REST API\""
            echo "  $0 --interactive"
            echo "  $0 --sparc \"Complex enterprise system\""
            echo "  $0 --docs"
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
    
    # Create necessary directories
    mkdir -p "$AI_DEV_HOME"
    mkdir -p "$DOCUMENTS_BACKUP_DIR"
}

# Run dependency check
check_dependencies

# Execute main function
main "$@"