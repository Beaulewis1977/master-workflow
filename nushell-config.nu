# Nushell Configuration - Project Aliases
# Copy this to ~/.config/nushell/config.nu or $nu.config-path

# ========================================
# PROJECT NAVIGATION - NUSHELL
# ========================================

# Main directories
alias dev = cd /mnt/c/dev
alias home = cd ~
alias docs = cd ~/Documents

# Project shortcuts
alias mwf = cd /mnt/c/dev/MASTER-WORKFLOW
alias lb = cd /mnt/c/dev/legacy-bridge
alias lgb = cd /mnt/c/dev/legacy-bridge/legacybridge
alias n8n = cd /mnt/c/dev/n8n_workflow_windows
alias ocr = cd /mnt/c/dev/ocr_reader
alias fd = cd /mnt/c/dev/financial-dashboard
alias recipe = cd /mnt/c/dev/recipe-slot-app-2
alias zen = cd /mnt/c/dev/zen-mcp-server
alias dj = cd /mnt/c/dev/dj_app
alias cal = cd /mnt/c/dev/calendar_app
alias dash = cd /mnt/c/dev/ai_dashboard

# Navigate + List combos
alias mwfl = cd /mnt/c/dev/MASTER-WORKFLOW; ls -la
alias lbl = cd /mnt/c/dev/legacy-bridge; ls -la
alias ocrl = cd /mnt/c/dev/ocr_reader; ls -la

# Git shortcuts
alias gs = git status
alias gp = git pull
alias gpu = git push
alias gl = git log --oneline -10
alias gb = git branch

# Utility aliases
alias ll = ls -la
alias la = ls -a
alias cls = clear

# NPM shortcuts
alias ni = npm install
alias ns = npm start
alias nt = npm test
alias nb = npm run build

# Python shortcuts  
alias py = python
alias py3 = python3
alias venv = python -m venv venv

# ========================================
# CUSTOM COMMANDS - NUSHELL
# ========================================

# Quick git add + commit
def gac [message: string] {
    git add -A
    git commit -m $message
}

# Make directory and enter it
def mkcd [path: string] {
    mkdir $path
    cd $path
}

# Project switcher
def proj [name: string] {
    match $name {
        "mwf" => { cd /mnt/c/dev/MASTER-WORKFLOW }
        "legacy" => { cd /mnt/c/dev/legacy-bridge }
        "n8n" => { cd /mnt/c/dev/n8n_workflow_windows }
        "ocr" => { cd /mnt/c/dev/ocr_reader }
        "recipe" => { cd /mnt/c/dev/recipe-slot-app-2 }
        "zen" => { cd /mnt/c/dev/zen-mcp-server }
        _ => { print "Unknown project. Available: mwf, legacy, n8n, ocr, recipe, zen" }
    }
}

# Show all custom aliases
def aliases [] {
    print "
    ╭─────────────────────────────────╮
    │     PROJECT SHORTCUTS           │
    ├─────────────────────────────────┤
    │ mwf    → MASTER-WORKFLOW        │
    │ lb     → legacy-bridge          │
    │ lgb    → legacybridge subfolder │
    │ n8n    → n8n_workflow_windows   │
    │ ocr    → ocr_reader             │
    │ recipe → recipe-slot-app-2      │
    │ zen    → zen-mcp-server         │
    ╰─────────────────────────────────╯
    "
}