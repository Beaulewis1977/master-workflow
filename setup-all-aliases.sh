#!/bin/bash

# Complete Bash Aliases Setup for All Your Projects
# Run this script: bash setup-all-aliases.sh

cat >> ~/.bashrc << 'EOF'

# ========================================
# MASTER NAVIGATION ALIASES
# ========================================

# Main directories
alias dev='cd /mnt/c/dev'
alias home='cd ~'
alias docs='cd /mnt/c/Users/$USER/Documents'
alias downloads='cd /mnt/c/Users/$USER/Downloads'
alias desktop='cd /mnt/c/Users/$USER/Desktop'

# ========================================
# PROJECT ALIASES - Quick Navigation
# ========================================

# Main Projects
alias mwf='cd /mnt/c/dev/MASTER-WORKFLOW'
alias ccw='cd /mnt/c/dev/CLAUDE_CODE_WORKFLOWS'
alias lb='cd /mnt/c/dev/legacy-bridge'
alias lgb='cd /mnt/c/dev/legacybridge'
alias n8n='cd /mnt/c/dev/n8n_workflow_windows'
alias n8nmcp='cd /mnt/c/dev/n8n-mcp-server'
alias ocr='cd /mnt/c/dev/ocr_reader'
alias fd='cd /mnt/c/dev/financial-dashboard'
alias recipe='cd /mnt/c/dev/recipe-slot-app-2'
alias recipe1='cd /mnt/c/dev/recipe-slot-app'
alias recipe2='cd /mnt/c/dev/recipe-slot-app-test'
alias recipeapp='cd /mnt/c/dev/recipe_app'
alias recipeclone='cd /mnt/c/dev/recipe-app-clone'

# MCP Servers
alias zen='cd /mnt/c/dev/zen-mcp-server'
alias mcptool='cd /mnt/c/dev/mcpserver_tool'
alias quickdata='cd /mnt/c/dev/quick_data_mcp'

# App Projects
alias dj='cd /mnt/c/dev/dj_app'
alias cal='cd /mnt/c/dev/calendar_app'
alias dash='cd /mnt/c/dev/ai_dashboard'
alias pft='cd /mnt/c/dev/PersonalFinanceTracker'
alias neuro='cd /mnt/c/dev/neurodock_app'
alias synapse='cd /mnt/c/dev/synapse_app'
alias safety='cd /mnt/c/dev/safetyapp'
alias workout='cd /mnt/c/dev/workout_app'
alias token='cd /mnt/c/dev/token_counter'
alias uocr='cd /mnt/c/dev/universal-ocr-converter'
alias oh='cd /mnt/c/dev/openhands'

# Sub-directories shortcuts
alias swf='cd /mnt/c/dev/MASTER-WORKFLOW/simple-workflow'
alias lbmain='cd /mnt/c/dev/legacy-bridge/legacy-bridge-main'
alias lbtest='cd /mnt/c/dev/legacy-bridge/test_mcp'
alias ocrtest='cd /mnt/c/dev/ocr_reader/test_profile.json'

# ========================================
# COMBO ALIASES - Navigate + List
# ========================================

alias mwfl='cd /mnt/c/dev/MASTER-WORKFLOW && ls -la'
alias lbl='cd /mnt/c/dev/legacy-bridge && ls -la'
alias ocrl='cd /mnt/c/dev/ocr_reader && ls -la'
alias n8nl='cd /mnt/c/dev/n8n_workflow_windows && ls -la'
alias recipel='cd /mnt/c/dev/recipe-slot-app-2 && ls -la'

# ========================================
# QUICK STATUS ALIASES
# ========================================

alias gs='git status'
alias gp='git pull'
alias gpu='git push'
alias gl='git log --oneline -10'
alias gb='git branch'

# ========================================
# PROJECT SPECIFIC COMMANDS
# ========================================

# Master Workflow specific
alias mwftest='cd /mnt/c/dev/MASTER-WORKFLOW && npm test'
alias mwfrun='cd /mnt/c/dev/MASTER-WORKFLOW && npm run dev'

# N8N specific
alias n8nstart='cd /mnt/c/dev/n8n_workflow_windows && npm start'
alias n8ndash='cd /mnt/c/dev/n8n_workflow_windows && npm run dashboard'

# OCR specific
alias ocrrun='cd /mnt/c/dev/ocr_reader && python main_app.py'
alias ocrtest='cd /mnt/c/dev/ocr_reader && python test_ocr_functionality.py'

# ========================================
# UTILITY ALIASES
# ========================================

alias ll='ls -la'
alias la='ls -A'
alias l='ls -CF'
alias ..='cd ..'
alias ...='cd ../..'
alias ....='cd ../../..'
alias cls='clear'
alias h='history'
alias hg='history | grep'
alias ports='netstat -tuln'
alias myip='curl ifconfig.me'

# ========================================
# DOCKER SHORTCUTS (if using Docker)
# ========================================

alias dps='docker ps'
alias dpsa='docker ps -a'
alias di='docker images'
alias dstop='docker stop $(docker ps -q)'
alias dclean='docker system prune -a'

# ========================================
# NPM/NODE SHORTCUTS
# ========================================

alias ni='npm install'
alias nid='npm install --save-dev'
alias nr='npm run'
alias ns='npm start'
alias nt='npm test'
alias nb='npm run build'

# ========================================
# PYTHON SHORTCUTS
# ========================================

alias py='python'
alias py3='python3'
alias pip='pip3'
alias venv='python -m venv venv'
alias activate='source venv/bin/activate'

# ========================================
# QUICK EDIT ALIASES
# ========================================

alias bashrc='nano ~/.bashrc'
alias aliases='nano ~/.bash_aliases'
alias reload='source ~/.bashrc'

# ========================================
# COLORED OUTPUT
# ========================================

alias ls='ls --color=auto'
alias grep='grep --color=auto'
alias fgrep='fgrep --color=auto'
alias egrep='egrep --color=auto'

# ========================================
# FUNCTION: Quick project switcher
# ========================================

function proj() {
    case $1 in
        mwf) mwf ;;
        legacy) lb ;;
        n8n) n8n ;;
        ocr) ocr ;;
        recipe) recipe ;;
        zen) zen ;;
        fd) fd ;;
        *) echo "Unknown project. Available: mwf, legacy, n8n, ocr, recipe, zen, fd" ;;
    esac
}

# ========================================
# FUNCTION: Quick git commit
# ========================================

function gac() {
    git add -A && git commit -m "$1"
}

# ========================================
# FUNCTION: Create and enter directory
# ========================================

function mkcd() {
    mkdir -p "$1" && cd "$1"
}

EOF

echo "✅ Aliases added to ~/.bashrc"
echo "Reloading bash configuration..."
source ~/.bashrc

echo "
========================================
ALIASES INSTALLED SUCCESSFULLY!
========================================

Main Project Shortcuts:
  mwf     → MASTER-WORKFLOW
  lb      → legacy-bridge
  n8n     → n8n_workflow_windows
  ocr     → ocr_reader
  recipe  → recipe-slot-app-2
  zen     → zen-mcp-server
  fd      → financial-dashboard
  
Quick Commands:
  proj [name]  → Switch to project
  gac 'msg'    → Git add all + commit
  mkcd [dir]   → Make and enter directory
  reload       → Reload aliases

Type any alias to jump to that directory!
"