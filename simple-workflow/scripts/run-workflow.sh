#!/bin/bash

# Simple Workflow Runner
# Executes JSON-based AI development workflows
# Version: 1.0

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="${BASE_DIR}/config.json"
WORKFLOWS_DIR="${BASE_DIR}/workflows"
OUTPUTS_DIR="${BASE_DIR}/outputs"
CHECKPOINTS_DIR="${BASE_DIR}/checkpoints"
LOGS_DIR="${BASE_DIR}/logs"

# Default settings
INTERACTIVE=true
VERBOSE=false
DRY_RUN=false
AUTO_CONFIRM=false
CHECKPOINT=false
RESUME=false
FROM_STEP=""
ONLY_STEP=""

# Create necessary directories
mkdir -p "$OUTPUTS_DIR" "$CHECKPOINTS_DIR" "$LOGS_DIR"

# Functions
print_header() {
    echo -e "\n${BOLD}${BLUE}═══════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${CYAN}  $1${NC}"
    echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════${NC}\n"
}

print_step() {
    echo -e "${BOLD}${MAGENTA}▶ Step $1: $2${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# Show usage
show_help() {
    cat << EOF
${BOLD}Simple Workflow Runner${NC}

Usage: $0 [workflow-file] [options]

Options:
    --auto              Run without prompts
    --verbose           Show detailed output
    --dry-run          Show what would run without executing
    --checkpoint       Enable save/resume
    --from-step <id>   Start from specific step
    --only-step <id>   Run only specific step
    --var <key=value>  Set workflow variables
    --output <dir>     Output directory
    --config <file>    Use custom config
    --resume <id>      Resume from checkpoint
    --list             List available workflows
    --help            Show this help

Examples:
    $0 workflows/create-api.json
    $0 workflows/add-feature.json --var feature_name=auth
    $0 workflows/complex.json --checkpoint
    $0 --resume last

EOF
}

# List available workflows
list_workflows() {
    print_header "Available Workflows"
    
    for workflow in "$WORKFLOWS_DIR"/*.json; do
        if [ -f "$workflow" ]; then
            name=$(basename "$workflow" .json)
            desc=$(jq -r '.description // "No description"' "$workflow" 2>/dev/null || echo "Invalid JSON")
            echo -e "${BOLD}${CYAN}$name${NC}"
            echo -e "  $desc"
            echo
        fi
    done
}

# Parse command line arguments
parse_args() {
    WORKFLOW_FILE=""
    VARS=()
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --auto)
                AUTO_CONFIRM=true
                INTERACTIVE=false
                shift
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --checkpoint)
                CHECKPOINT=true
                shift
                ;;
            --from-step)
                FROM_STEP="$2"
                shift 2
                ;;
            --only-step)
                ONLY_STEP="$2"
                shift 2
                ;;
            --var)
                VARS+=("$2")
                shift 2
                ;;
            --output)
                OUTPUTS_DIR="$2"
                shift 2
                ;;
            --config)
                CONFIG_FILE="$2"
                shift 2
                ;;
            --resume)
                RESUME=true
                CHECKPOINT_ID="$2"
                shift 2
                ;;
            --list)
                list_workflows
                exit 0
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                if [ -z "$WORKFLOW_FILE" ]; then
                    WORKFLOW_FILE="$1"
                else
                    print_error "Unknown option: $1"
                    show_help
                    exit 1
                fi
                shift
                ;;
        esac
    done
}

# Load configuration
load_config() {
    if [ ! -f "$CONFIG_FILE" ]; then
        print_warning "Config file not found. Using defaults."
        return
    fi
    
    # Load settings from config
    if [ "$VERBOSE" = true ]; then
        print_info "Loading config from: $CONFIG_FILE"
    fi
}

# Replace variables in text
replace_variables() {
    local text="$1"
    
    # Replace workflow variables
    for var in "${WORKFLOW_VARS[@]}"; do
        key=$(echo "$var" | cut -d'=' -f1)
        value=$(echo "$var" | cut -d'=' -f2-)
        text="${text//\{\{$key\}\}/$value}"
    done
    
    # Replace command-line variables
    for var in "${VARS[@]}"; do
        key=$(echo "$var" | cut -d'=' -f1)
        value=$(echo "$var" | cut -d'=' -f2-)
        text="${text//\{\{$key\}\}/$value}"
    done
    
    echo "$text"
}

# Execute Claude command
run_claude() {
    local prompt="$1"
    prompt=$(replace_variables "$prompt")
    
    if [ "$DRY_RUN" = true ]; then
        echo -e "${CYAN}[DRY RUN] Would execute Claude with prompt:${NC}"
        echo "$prompt"
        return 0
    fi
    
    if [ "$VERBOSE" = true ]; then
        echo -e "${CYAN}Executing Claude...${NC}"
    fi
    
    echo "$prompt" | claude
}

# Execute Agent OS command
run_agent_os() {
    local command="$1"
    local prompt="$2"
    prompt=$(replace_variables "$prompt")
    
    if [ "$DRY_RUN" = true ]; then
        echo -e "${CYAN}[DRY RUN] Would execute Agent OS command: /$command${NC}"
        echo "Prompt: $prompt"
        return 0
    fi
    
    if [ "$VERBOSE" = true ]; then
        echo -e "${CYAN}Executing Agent OS: /$command${NC}"
    fi
    
    echo -e "/$command\n$prompt" | claude
}

# Execute Claude-Flow command
run_claude_flow() {
    local mode="$1"
    local prompt="$2"
    prompt=$(replace_variables "$prompt")
    
    if [ "$DRY_RUN" = true ]; then
        echo -e "${CYAN}[DRY RUN] Would execute Claude-Flow in $mode mode${NC}"
        echo "Prompt: $prompt"
        return 0
    fi
    
    if [ "$VERBOSE" = true ]; then
        echo -e "${CYAN}Executing Claude-Flow: $mode${NC}"
    fi
    
    npx claude-flow@alpha "$mode" "$prompt"
}

# Execute Sub-Agent command
run_sub_agent() {
    local agent="$1"
    local prompt="$2"
    prompt=$(replace_variables "$prompt")
    
    if [ "$DRY_RUN" = true ]; then
        echo -e "${CYAN}[DRY RUN] Would execute Sub-Agent: @$agent${NC}"
        echo "Prompt: $prompt"
        return 0
    fi
    
    if [ "$VERBOSE" = true ]; then
        echo -e "${CYAN}Executing Sub-Agent: @$agent${NC}"
    fi
    
    echo -e "@$agent: $prompt" | claude
}

# Save checkpoint
save_checkpoint() {
    local step_id="$1"
    local checkpoint_file="$CHECKPOINTS_DIR/checkpoint-$(date +%Y%m%d-%H%M%S).json"
    
    if [ "$CHECKPOINT" = true ]; then
        echo "{\"step\": \"$step_id\", \"time\": \"$(date -Iseconds)\"}" > "$checkpoint_file"
        ln -sf "$checkpoint_file" "$CHECKPOINTS_DIR/last"
        print_info "Checkpoint saved: $checkpoint_file"
    fi
}

# Execute a workflow step
execute_step() {
    local step_json="$1"
    local step_num="$2"
    local total_steps="$3"
    
    # Extract step details
    local id=$(echo "$step_json" | jq -r '.id')
    local name=$(echo "$step_json" | jq -r '.name // .id')
    local type=$(echo "$step_json" | jq -r '.type')
    local prompt=$(echo "$step_json" | jq -r '.prompt // ""')
    
    # Check if we should skip this step
    if [ -n "$FROM_STEP" ] && [ "$id" != "$FROM_STEP" ] && [ "$SKIP_UNTIL_FOUND" = true ]; then
        print_info "Skipping step: $name"
        return 0
    elif [ "$id" = "$FROM_STEP" ]; then
        SKIP_UNTIL_FOUND=false
    fi
    
    if [ -n "$ONLY_STEP" ] && [ "$id" != "$ONLY_STEP" ]; then
        print_info "Skipping step: $name"
        return 0
    fi
    
    print_step "$step_num/$total_steps" "$name"
    
    # Interactive confirmation
    if [ "$INTERACTIVE" = true ] && [ "$AUTO_CONFIRM" = false ]; then
        echo -e "${YELLOW}Execute this step? (y/n/e=edit/s=skip)${NC}"
        read -n 1 -r response
        echo
        
        case $response in
            n|N)
                print_warning "Step cancelled by user"
                exit 1
                ;;
            s|S)
                print_info "Step skipped"
                return 0
                ;;
            e|E)
                echo "Enter new prompt (or press Enter to keep original):"
                read -r new_prompt
                if [ -n "$new_prompt" ]; then
                    prompt="$new_prompt"
                fi
                ;;
            *)
                # Continue with execution
                ;;
        esac
    fi
    
    # Execute based on type
    case $type in
        claude)
            run_claude "$prompt"
            ;;
        agent-os)
            local command=$(echo "$step_json" | jq -r '.command')
            run_agent_os "$command" "$prompt"
            ;;
        claude-flow)
            local mode=$(echo "$step_json" | jq -r '.mode // "swarm"')
            run_claude_flow "$mode" "$prompt"
            ;;
        sub-agent)
            local agent=$(echo "$step_json" | jq -r '.agent')
            run_sub_agent "$agent" "$prompt"
            ;;
        *)
            print_error "Unknown step type: $type"
            return 1
            ;;
    esac
    
    # Save checkpoint after successful execution
    save_checkpoint "$id"
    
    print_success "Step completed: $name"
}

# Main workflow execution
execute_workflow() {
    local workflow_file="$1"
    
    if [ ! -f "$workflow_file" ]; then
        print_error "Workflow file not found: $workflow_file"
        exit 1
    fi
    
    # Load workflow
    local workflow_json=$(cat "$workflow_file")
    local workflow_name=$(echo "$workflow_json" | jq -r '.workflow')
    local workflow_desc=$(echo "$workflow_json" | jq -r '.description // ""')
    
    print_header "Running Workflow: $workflow_name"
    if [ -n "$workflow_desc" ]; then
        print_info "$workflow_desc"
    fi
    
    # Load workflow variables
    WORKFLOW_VARS=()
    while IFS= read -r line; do
        WORKFLOW_VARS+=("$line")
    done < <(echo "$workflow_json" | jq -r '.variables // {} | to_entries[] | "\(.key)=\(.value)"')
    
    # Get steps
    local steps=$(echo "$workflow_json" | jq -c '.steps[]')
    local total_steps=$(echo "$workflow_json" | jq '.steps | length')
    
    # Execute each step
    local step_num=1
    SKIP_UNTIL_FOUND=true
    
    if [ -z "$FROM_STEP" ]; then
        SKIP_UNTIL_FOUND=false
    fi
    
    while IFS= read -r step; do
        execute_step "$step" "$step_num" "$total_steps"
        ((step_num++))
    done <<< "$steps"
    
    # Success message
    local success_msg=$(echo "$workflow_json" | jq -r '.on_success // "Workflow completed successfully!"')
    success_msg=$(replace_variables "$success_msg")
    print_success "$success_msg"
}

# Resume from checkpoint
resume_from_checkpoint() {
    local checkpoint_id="$1"
    
    if [ "$checkpoint_id" = "last" ]; then
        checkpoint_file="$CHECKPOINTS_DIR/last"
    else
        checkpoint_file="$CHECKPOINTS_DIR/$checkpoint_id"
    fi
    
    if [ ! -f "$checkpoint_file" ]; then
        print_error "Checkpoint not found: $checkpoint_id"
        exit 1
    fi
    
    # Load checkpoint
    local step_id=$(jq -r '.step' "$checkpoint_file")
    print_info "Resuming from step: $step_id"
    FROM_STEP="$step_id"
}

# Main execution
main() {
    parse_args "$@"
    
    # Check for resume
    if [ "$RESUME" = true ]; then
        resume_from_checkpoint "$CHECKPOINT_ID"
    fi
    
    # Validate workflow file
    if [ -z "$WORKFLOW_FILE" ] && [ "$RESUME" = false ]; then
        print_error "No workflow file specified"
        show_help
        exit 1
    fi
    
    # Load configuration
    load_config
    
    # Execute workflow
    if [ -n "$WORKFLOW_FILE" ]; then
        execute_workflow "$WORKFLOW_FILE"
    fi
}

# Run main function
main "$@"