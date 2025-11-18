#!/bin/bash

# Zsh Aliases Setup (for Warp, Oh My Zsh, etc.)
# Run: bash setup-zsh-aliases.sh

cat >> ~/.zshrc << 'EOF'

# ========================================
# PROJECT NAVIGATION - ZSH
# ========================================

# Main directories
alias dev='cd /mnt/c/dev'
alias mwf='cd /mnt/c/dev/MASTER-WORKFLOW'
alias lb='cd /mnt/c/dev/legacy-bridge'
alias lgb='cd /mnt/c/dev/legacy-bridge/legacybridge'
alias n8n='cd /mnt/c/dev/n8n_workflow_windows'
alias ocr='cd /mnt/c/dev/ocr_reader'
alias fd='cd /mnt/c/dev/financial-dashboard'
alias recipe='cd /mnt/c/dev/recipe-slot-app-2'
alias zen='cd /mnt/c/dev/zen-mcp-server'

# Quick nav + list
alias mwfl='cd /mnt/c/dev/MASTER-WORKFLOW && ls -la'
alias lbl='cd /mnt/c/dev/legacy-bridge && ls -la'

# Git shortcuts
alias gs='git status'
alias gp='git pull'
alias gpu='git push'
alias gac='git add -A && git commit -m'

# Utils
alias ll='ls -la'
alias ..='cd ..'
alias ...='cd ../..'
alias reload='source ~/.zshrc'

EOF

echo "✅ Zsh aliases added! Run: source ~/.zshrc"