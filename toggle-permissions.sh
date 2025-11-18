#!/bin/bash

# Quick Toggle for --dangerously-skip-permissions
# Usage: ./toggle-permissions.sh [on|off|status]

CLAUDE_HOME="$HOME/.claude"
AI_DEV_HOME="$HOME/.ai-dev-os"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

# Function to get current status
get_status() {
    if [ -f "$CLAUDE_HOME/settings.json" ]; then
        local status=$(jq -r '.dangerouslySkipPermissions' "$CLAUDE_HOME/settings.json" 2>/dev/null)
        if [ "$status" = "true" ]; then
            echo "enabled"
        else
            echo "disabled"
        fi
    else
        echo "not-configured"
    fi
}

# Function to enable skip permissions
enable_skip() {
    echo -e "${YELLOW}Enabling --dangerously-skip-permissions...${NC}"
    
    # Update global settings
    if [ -f "$CLAUDE_HOME/settings.json" ]; then
        jq '.dangerouslySkipPermissions = true' "$CLAUDE_HOME/settings.json" > "$CLAUDE_HOME/settings.json.tmp"
        mv "$CLAUDE_HOME/settings.json.tmp" "$CLAUDE_HOME/settings.json"
        echo -e "${GREEN}✅ Global: Skip-permissions ENABLED${NC}"
    fi
    
    # Update project settings if exists
    if [ -f ".claude/settings.json" ]; then
        jq '.dangerouslySkipPermissions = true' ".claude/settings.json" > ".claude/settings.json.tmp"
        mv ".claude/settings.json.tmp" ".claude/settings.json"
        echo -e "${GREEN}✅ Project: Skip-permissions ENABLED${NC}"
    fi
    
    # Update system config
    if [ -f "$AI_DEV_HOME/configs/system.conf" ]; then
        sed -i 's/^SKIP_PERMISSIONS=.*/SKIP_PERMISSIONS=true/' "$AI_DEV_HOME/configs/system.conf"
    fi
    
    echo -e "\n${BOLD}${YELLOW}⚠️  WARNING: Claude Code will now execute commands without asking permission!${NC}"
    echo -e "${CYAN}To disable, run: ${BOLD}./toggle-permissions.sh off${NC}"
}

# Function to disable skip permissions
disable_skip() {
    echo -e "${CYAN}Disabling --dangerously-skip-permissions...${NC}"
    
    # Update global settings
    if [ -f "$CLAUDE_HOME/settings.json" ]; then
        jq '.dangerouslySkipPermissions = false' "$CLAUDE_HOME/settings.json" > "$CLAUDE_HOME/settings.json.tmp"
        mv "$CLAUDE_HOME/settings.json.tmp" "$CLAUDE_HOME/settings.json"
        echo -e "${GREEN}✅ Global: Skip-permissions DISABLED${NC}"
    fi
    
    # Update project settings if exists
    if [ -f ".claude/settings.json" ]; then
        jq '.dangerouslySkipPermissions = false' ".claude/settings.json" > ".claude/settings.json.tmp"
        mv ".claude/settings.json.tmp" ".claude/settings.json"
        echo -e "${GREEN}✅ Project: Skip-permissions DISABLED${NC}"
    fi
    
    # Update system config
    if [ -f "$AI_DEV_HOME/configs/system.conf" ]; then
        sed -i 's/^SKIP_PERMISSIONS=.*/SKIP_PERMISSIONS=false/' "$AI_DEV_HOME/configs/system.conf"
    fi
    
    echo -e "\n${GREEN}✅ Claude Code will now ask for permission before executing commands${NC}"
    echo -e "${CYAN}To enable, run: ${BOLD}./toggle-permissions.sh on${NC}"
}

# Function to show status
show_status() {
    local status=$(get_status)
    
    echo -e "\n${BOLD}${CYAN}═══════════════════════════════════════════${NC}"
    echo -e "${BOLD}${CYAN}  Skip-Permissions Status${NC}"
    echo -e "${BOLD}${CYAN}═══════════════════════════════════════════${NC}\n"
    
    if [ "$status" = "enabled" ]; then
        echo -e "Global Status: ${GREEN}✅ ENABLED${NC}"
        echo -e "${YELLOW}Claude Code is executing without asking permission${NC}"
    elif [ "$status" = "disabled" ]; then
        echo -e "Global Status: ${RED}❌ DISABLED${NC}"
        echo -e "${GREEN}Claude Code will ask for permission before executing${NC}"
    else
        echo -e "Status: ${YELLOW}⚠️  NOT CONFIGURED${NC}"
        echo -e "Run the installer first: ${BOLD}bash install-ai-dev-os.sh${NC}"
    fi
    
    # Check project status
    if [ -f ".claude/settings.json" ]; then
        local project_status=$(jq -r '.dangerouslySkipPermissions' ".claude/settings.json" 2>/dev/null)
        if [ "$project_status" = "true" ]; then
            echo -e "Project Status: ${GREEN}✅ ENABLED${NC}"
        else
            echo -e "Project Status: ${RED}❌ DISABLED${NC}"
        fi
    fi
    
    echo -e "\n${CYAN}Commands:${NC}"
    echo -e "  ${BOLD}./toggle-permissions.sh on${NC}     - Enable skip-permissions"
    echo -e "  ${BOLD}./toggle-permissions.sh off${NC}    - Disable skip-permissions"
    echo -e "  ${BOLD}./toggle-permissions.sh toggle${NC} - Toggle current state"
    echo ""
}

# Function to toggle
toggle() {
    local status=$(get_status)
    if [ "$status" = "enabled" ]; then
        disable_skip
    else
        enable_skip
    fi
}

# Main logic
case "${1:-status}" in
    on|enable|yes|true)
        enable_skip
        ;;
    off|disable|no|false)
        disable_skip
        ;;
    toggle|switch)
        toggle
        ;;
    status|check|*)
        show_status
        ;;
esac