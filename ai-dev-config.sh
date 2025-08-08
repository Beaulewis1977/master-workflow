#!/bin/bash

# AI Development OS - Configuration Manager
# Easily enable/disable features and permissions

AI_DEV_HOME="$HOME/.ai-dev-os"
CLAUDE_HOME="$HOME/.claude"
CONFIG_FILE="$AI_DEV_HOME/configs/system.conf"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

# Ensure config directory exists
mkdir -p "$AI_DEV_HOME/configs"

# Create default config if doesn't exist
if [ ! -f "$CONFIG_FILE" ]; then
    cat > "$CONFIG_FILE" << 'EOF'
# AI Development OS Configuration
# Change these values to enable/disable features

# Permissions
SKIP_PERMISSIONS=false          # Set to true to enable --dangerously-skip-permissions
AUTO_APPROVE=false              # Auto-approve all AI actions

# Systems
AGENT_OS_ENABLED=true          # Agent OS planning system
CLAUDE_FLOW_ENABLED=true       # Claude-Flow multi-agent coordination
TMUX_ORCHESTRATOR_ENABLED=true # 24/7 autonomous operation
SUB_AGENTS_ENABLED=true        # Specialized sub-agents

# Automation
AUTO_START_TMUX=false          # Auto-start tmux sessions
AUTO_PLAN_NEW_PROJECTS=false  # Auto-run /plan-product on new projects
AUTO_SYNC_CONFIGS=true        # Auto-sync configurations across systems

# Logging
ENABLE_LOGGING=true            # Log all activities
VERBOSE_LOGGING=false          # Detailed logging
LOG_TO_FILE=true              # Save logs to file

# Performance
MAX_CONCURRENT_AGENTS=3        # Maximum parallel agents
MEMORY_LIMIT_GB=4             # Memory limit for Claude-Flow
API_RATE_LIMIT=100            # API calls per minute limit

# Development Mode
DEV_MODE=false                # Enable development/debug features
SHOW_WARNINGS=true            # Show warning messages
EOF
fi

show_menu() {
    clear
    echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${CYAN}║         AI Development OS Configuration             ║${NC}"
    echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════════╝${NC}\n"
    
    # Load current config
    source "$CONFIG_FILE"
    
    echo -e "${BOLD}Current Settings:${NC}\n"
    
    # Permissions Section
    echo -e "${YELLOW}Permissions:${NC}"
    if [ "$SKIP_PERMISSIONS" = "true" ]; then
        echo -e "  1. Skip Permissions:        ${GREEN}✅ ENABLED${NC} (--dangerously-skip-permissions)"
    else
        echo -e "  1. Skip Permissions:        ${RED}❌ DISABLED${NC} (will ask for approval)"
    fi
    
    if [ "$AUTO_APPROVE" = "true" ]; then
        echo -e "  2. Auto-Approve:           ${GREEN}✅ ENABLED${NC}"
    else
        echo -e "  2. Auto-Approve:           ${RED}❌ DISABLED${NC}"
    fi
    
    # Systems Section
    echo -e "\n${YELLOW}Systems:${NC}"
    [ "$AGENT_OS_ENABLED" = "true" ] && \
        echo -e "  3. Agent OS:               ${GREEN}✅ ENABLED${NC}" || \
        echo -e "  3. Agent OS:               ${RED}❌ DISABLED${NC}"
    
    [ "$CLAUDE_FLOW_ENABLED" = "true" ] && \
        echo -e "  4. Claude-Flow:            ${GREEN}✅ ENABLED${NC}" || \
        echo -e "  4. Claude-Flow:            ${RED}❌ DISABLED${NC}"
    
    [ "$TMUX_ORCHESTRATOR_ENABLED" = "true" ] && \
        echo -e "  5. Tmux-Orchestrator:      ${GREEN}✅ ENABLED${NC}" || \
        echo -e "  5. Tmux-Orchestrator:      ${RED}❌ DISABLED${NC}"
    
    [ "$SUB_AGENTS_ENABLED" = "true" ] && \
        echo -e "  6. Sub-Agents:             ${GREEN}✅ ENABLED${NC}" || \
        echo -e "  6. Sub-Agents:             ${RED}❌ DISABLED${NC}"
    
    # Automation Section
    echo -e "\n${YELLOW}Automation:${NC}"
    [ "$AUTO_START_TMUX" = "true" ] && \
        echo -e "  7. Auto-Start Tmux:        ${GREEN}✅ ENABLED${NC}" || \
        echo -e "  7. Auto-Start Tmux:        ${RED}❌ DISABLED${NC}"
    
    [ "$AUTO_PLAN_NEW_PROJECTS" = "true" ] && \
        echo -e "  8. Auto-Plan Projects:     ${GREEN}✅ ENABLED${NC}" || \
        echo -e "  8. Auto-Plan Projects:     ${RED}❌ DISABLED${NC}"
    
    # Development Mode
    echo -e "\n${YELLOW}Development:${NC}"
    [ "$DEV_MODE" = "true" ] && \
        echo -e "  9. Development Mode:       ${GREEN}✅ ENABLED${NC}" || \
        echo -e "  9. Development Mode:       ${RED}❌ DISABLED${NC}"
    
    echo -e "\n${CYAN}Commands:${NC}"
    echo -e "  ${BOLD}Q${NC}. Quick Toggle Skip-Permissions"
    echo -e "  ${BOLD}A${NC}. Enable All Systems"
    echo -e "  ${BOLD}D${NC}. Disable All Automation"
    echo -e "  ${BOLD}S${NC}. Save & Apply Changes"
    echo -e "  ${BOLD}R${NC}. Reset to Defaults"
    echo -e "  ${BOLD}E${NC}. Edit Config File Directly"
    echo -e "  ${BOLD}X${NC}. Exit"
    
    echo -e "\n${CYAN}Enter choice (1-9, Q, A, D, S, R, E, X): ${NC}"
}

toggle_setting() {
    local setting=$1
    local current=$(grep "^$setting=" "$CONFIG_FILE" | cut -d'=' -f2)
    
    if [ "$current" = "true" ]; then
        sed -i "s/^$setting=true/$setting=false/" "$CONFIG_FILE"
        echo "false"
    else
        sed -i "s/^$setting=false/$setting=true/" "$CONFIG_FILE"
        echo "true"
    fi
}

apply_settings() {
    source "$CONFIG_FILE"
    
    echo -e "\n${CYAN}Applying settings...${NC}"
    
    # Update Claude settings.json based on config
    if [ "$SKIP_PERMISSIONS" = "true" ]; then
        # Enable dangerous skip permissions
        if [ -f "$CLAUDE_HOME/settings.json" ]; then
            # Backup current settings
            cp "$CLAUDE_HOME/settings.json" "$CLAUDE_HOME/settings.json.bak"
            
            # Update the setting using a temporary file
            jq '.dangerouslySkipPermissions = true' "$CLAUDE_HOME/settings.json" > "$CLAUDE_HOME/settings.json.tmp"
            mv "$CLAUDE_HOME/settings.json.tmp" "$CLAUDE_HOME/settings.json"
            
            echo -e "${GREEN}✅ Enabled --dangerously-skip-permissions${NC}"
        fi
        
        # Also set for project if in project directory
        if [ -f ".claude/settings.json" ]; then
            jq '.dangerouslySkipPermissions = true' ".claude/settings.json" > ".claude/settings.json.tmp"
            mv ".claude/settings.json.tmp" ".claude/settings.json"
            echo -e "${GREEN}✅ Enabled for current project${NC}"
        fi
    else
        # Disable dangerous skip permissions
        if [ -f "$CLAUDE_HOME/settings.json" ]; then
            jq '.dangerouslySkipPermissions = false' "$CLAUDE_HOME/settings.json" > "$CLAUDE_HOME/settings.json.tmp"
            mv "$CLAUDE_HOME/settings.json.tmp" "$CLAUDE_HOME/settings.json"
            
            echo -e "${YELLOW}⚠️  Disabled --dangerously-skip-permissions${NC}"
        fi
        
        if [ -f ".claude/settings.json" ]; then
            jq '.dangerouslySkipPermissions = false' ".claude/settings.json" > ".claude/settings.json.tmp"
            mv ".claude/settings.json.tmp" ".claude/settings.json"
            echo -e "${YELLOW}⚠️  Disabled for current project${NC}"
        fi
    fi
    
    # Update integrations.json based on enabled systems
    if [ -f "$CLAUDE_HOME/integrations.json" ]; then
        TEMP_FILE="$CLAUDE_HOME/integrations.json.tmp"
        
        jq --arg agent_os "$AGENT_OS_ENABLED" \
           --arg claude_flow "$CLAUDE_FLOW_ENABLED" \
           --arg tmux_orch "$TMUX_ORCHESTRATOR_ENABLED" \
           --arg sub_agents "$SUB_AGENTS_ENABLED" \
           '.systems["agent-os"].enabled = ($agent_os == "true") |
            .systems["claude-flow"].enabled = ($claude_flow == "true") |
            .systems["tmux-orchestrator"].enabled = ($tmux_orch == "true") |
            .systems["sub-agents"].enabled = ($sub_agents == "true")' \
           "$CLAUDE_HOME/integrations.json" > "$TEMP_FILE"
        
        mv "$TEMP_FILE" "$CLAUDE_HOME/integrations.json"
        echo -e "${GREEN}✅ Updated system integrations${NC}"
    fi
    
    echo -e "${GREEN}✅ Settings applied successfully!${NC}"
}

quick_toggle_permissions() {
    local new_value=$(toggle_setting "SKIP_PERMISSIONS")
    apply_settings
    
    if [ "$new_value" = "true" ]; then
        echo -e "\n${GREEN}✅ Skip-Permissions ENABLED${NC}"
        echo -e "${YELLOW}Warning: Claude Code will now execute without asking for permission!${NC}"
    else
        echo -e "\n${YELLOW}✅ Skip-Permissions DISABLED${NC}"
        echo -e "${GREEN}Claude Code will now ask for permission before executing commands.${NC}"
    fi
    
    echo -e "\nPress Enter to continue..."
    read
}

enable_all_systems() {
    sed -i 's/^AGENT_OS_ENABLED=.*/AGENT_OS_ENABLED=true/' "$CONFIG_FILE"
    sed -i 's/^CLAUDE_FLOW_ENABLED=.*/CLAUDE_FLOW_ENABLED=true/' "$CONFIG_FILE"
    sed -i 's/^TMUX_ORCHESTRATOR_ENABLED=.*/TMUX_ORCHESTRATOR_ENABLED=true/' "$CONFIG_FILE"
    sed -i 's/^SUB_AGENTS_ENABLED=.*/SUB_AGENTS_ENABLED=true/' "$CONFIG_FILE"
    
    echo -e "${GREEN}✅ All systems enabled${NC}"
    apply_settings
    echo -e "\nPress Enter to continue..."
    read
}

disable_all_automation() {
    sed -i 's/^AUTO_START_TMUX=.*/AUTO_START_TMUX=false/' "$CONFIG_FILE"
    sed -i 's/^AUTO_PLAN_NEW_PROJECTS=.*/AUTO_PLAN_NEW_PROJECTS=false/' "$CONFIG_FILE"
    sed -i 's/^AUTO_APPROVE=.*/AUTO_APPROVE=false/' "$CONFIG_FILE"
    sed -i 's/^AUTO_SYNC_CONFIGS=.*/AUTO_SYNC_CONFIGS=false/' "$CONFIG_FILE"
    
    echo -e "${YELLOW}✅ All automation disabled${NC}"
    apply_settings
    echo -e "\nPress Enter to continue..."
    read
}

reset_to_defaults() {
    echo -e "${YELLOW}Resetting to default configuration...${NC}"
    
    cat > "$CONFIG_FILE" << 'EOF'
# AI Development OS Configuration
# Change these values to enable/disable features

# Permissions
SKIP_PERMISSIONS=false          # Set to true to enable --dangerously-skip-permissions
AUTO_APPROVE=false              # Auto-approve all AI actions

# Systems
AGENT_OS_ENABLED=true          # Agent OS planning system
CLAUDE_FLOW_ENABLED=true       # Claude-Flow multi-agent coordination
TMUX_ORCHESTRATOR_ENABLED=true # 24/7 autonomous operation
SUB_AGENTS_ENABLED=true        # Specialized sub-agents

# Automation
AUTO_START_TMUX=false          # Auto-start tmux sessions
AUTO_PLAN_NEW_PROJECTS=false  # Auto-run /plan-product on new projects
AUTO_SYNC_CONFIGS=true        # Auto-sync configurations across systems

# Logging
ENABLE_LOGGING=true            # Log all activities
VERBOSE_LOGGING=false          # Detailed logging
LOG_TO_FILE=true              # Save logs to file

# Performance
MAX_CONCURRENT_AGENTS=3        # Maximum parallel agents
MEMORY_LIMIT_GB=4             # Memory limit for Claude-Flow
API_RATE_LIMIT=100            # API calls per minute limit

# Development Mode
DEV_MODE=false                # Enable development/debug features
SHOW_WARNINGS=true            # Show warning messages
EOF
    
    echo -e "${GREEN}✅ Reset to defaults${NC}"
    apply_settings
    echo -e "\nPress Enter to continue..."
    read
}

# Main loop
while true; do
    show_menu
    read -n 1 choice
    echo
    
    case $choice in
        1) toggle_setting "SKIP_PERMISSIONS" ;;
        2) toggle_setting "AUTO_APPROVE" ;;
        3) toggle_setting "AGENT_OS_ENABLED" ;;
        4) toggle_setting "CLAUDE_FLOW_ENABLED" ;;
        5) toggle_setting "TMUX_ORCHESTRATOR_ENABLED" ;;
        6) toggle_setting "SUB_AGENTS_ENABLED" ;;
        7) toggle_setting "AUTO_START_TMUX" ;;
        8) toggle_setting "AUTO_PLAN_NEW_PROJECTS" ;;
        9) toggle_setting "DEV_MODE" ;;
        q|Q) quick_toggle_permissions ;;
        a|A) enable_all_systems ;;
        d|D) disable_all_automation ;;
        s|S) apply_settings; echo -e "\nPress Enter to continue..."; read ;;
        r|R) reset_to_defaults ;;
        e|E) ${EDITOR:-nano} "$CONFIG_FILE"; apply_settings ;;
        x|X) echo -e "${CYAN}Goodbye!${NC}"; exit 0 ;;
        *) echo -e "${RED}Invalid choice${NC}"; sleep 1 ;;
    esac
done