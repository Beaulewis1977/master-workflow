# Nushell Configuration for WINDOWS - Project Aliases
# Copy this to C:\Users\kngpn\AppData\Roaming\nushell\config.nu

# ========================================
# PROJECT NAVIGATION - WINDOWS PATHS
# ========================================

# Main directories
alias dev = cd C:\dev
alias home = cd ~
alias docs = cd ~/Documents

# Project shortcuts - WINDOWS PATHS
alias mwf = cd C:\dev\MASTER-WORKFLOW
alias lb = cd C:\dev\legacy-bridge
alias lgb = cd C:\dev\legacy-bridge\legacybridge
alias n8n = cd C:\dev\n8n_workflow_windows
alias ocr = cd C:\dev\ocr_reader
alias fd = cd C:\dev\financial-dashboard
alias recipe = cd C:\dev\recipe-slot-app-2
alias zen = cd C:\dev\zen-mcp-server
alias dj = cd C:\dev\dj_app
alias cal = cd C:\dev\calendar_app
alias dash = cd C:\dev\ai_dashboard

# Navigate + List combos
alias mwfl = cd C:\dev\MASTER-WORKFLOW; ls -la
alias lbl = cd C:\dev\legacy-bridge; ls -la
alias ocrl = cd C:\dev\ocr_reader; ls -la

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

# ========================================
# CUSTOM COMMANDS - NUSHELL WINDOWS
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

# Project switcher with Windows paths
def proj [name: string] {
    match $name {
        "mwf" => { cd C:\dev\MASTER-WORKFLOW }
        "legacy" => { cd C:\dev\legacy-bridge }
        "n8n" => { cd C:\dev\n8n_workflow_windows }
        "ocr" => { cd C:\dev\ocr_reader }
        "recipe" => { cd C:\dev\recipe-slot-app-2 }
        "zen" => { cd C:\dev\zen-mcp-server }
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