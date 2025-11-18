# PowerShell Aliases Setup Script
# Run as Administrator: .\Setup-PowerShellAliases.ps1

# Check if profile exists, create if not
if (!(Test-Path -Path $PROFILE)) {
    New-Item -ItemType File -Path $PROFILE -Force
    Write-Host "Created PowerShell profile at: $PROFILE" -ForegroundColor Green
}

# Add aliases to PowerShell profile
Add-Content -Path $PROFILE -Value @'

# ========================================
# PROJECT NAVIGATION FUNCTIONS
# ========================================

# Main directories
function dev { Set-Location "C:\dev" }
function home { Set-Location $HOME }
function docs { Set-Location "$HOME\Documents" }
function downloads { Set-Location "$HOME\Downloads" }
function desktop { Set-Location "$HOME\Desktop" }

# Project shortcuts
function mwf { Set-Location "C:\dev\MASTER-WORKFLOW" }
function ccw { Set-Location "C:\dev\CLAUDE_CODE_WORKFLOWS" }
function lb { Set-Location "C:\dev\legacy-bridge" }
function lgb { Set-Location "C:\dev\legacybridge" }
function n8n { Set-Location "C:\dev\n8n_workflow_windows" }
function n8nmcp { Set-Location "C:\dev\n8n-mcp-server" }
function ocr { Set-Location "C:\dev\ocr_reader" }
function fd { Set-Location "C:\dev\financial-dashboard" }
function recipe { Set-Location "C:\dev\recipe-slot-app-2" }
function recipe1 { Set-Location "C:\dev\recipe-slot-app" }
function recipe2 { Set-Location "C:\dev\recipe-slot-app-test" }
function zen { Set-Location "C:\dev\zen-mcp-server" }
function mcptool { Set-Location "C:\dev\mcpserver_tool" }
function quickdata { Set-Location "C:\dev\quick_data_mcp" }
function dj { Set-Location "C:\dev\dj_app" }
function cal { Set-Location "C:\dev\calendar_app" }
function dash { Set-Location "C:\dev\ai_dashboard" }
function pft { Set-Location "C:\dev\PersonalFinanceTracker" }
function neuro { Set-Location "C:\dev\neurodock_app" }
function synapse { Set-Location "C:\dev\synapse_app" }
function safety { Set-Location "C:\dev\safetyapp" }
function workout { Set-Location "C:\dev\workout_app" }
function token { Set-Location "C:\dev\token_counter" }
function uocr { Set-Location "C:\dev\universal-ocr-converter" }
function oh { Set-Location "C:\dev\openhands" }
function lgb { Set-Location "C:\dev\legacy-bridge\legacybridge" }

# Navigate + List combos
function mwfl { 
    Set-Location "C:\dev\MASTER-WORKFLOW"
    Get-ChildItem
}

function lbl { 
    Set-Location "C:\dev\legacy-bridge"
    Get-ChildItem
}

function ocrl { 
    Set-Location "C:\dev\ocr_reader"
    Get-ChildItem
}

# ========================================
# GIT ALIASES
# ========================================

function gs { git status }
function gp { git pull }
function gpu { git push }
function gl { git log --oneline -10 }
function gb { git branch }
function gac {
    param([string]$message)
    git add -A
    git commit -m $message
}

# ========================================
# UTILITY FUNCTIONS
# ========================================

function ll { Get-ChildItem -Force }
function la { Get-ChildItem -Force | Format-Wide }
function .. { Set-Location .. }
function ... { Set-Location ..\.. }
function .... { Set-Location ..\..\.. }
function cls { Clear-Host }
function h { Get-History }
function myip { (Invoke-WebRequest -Uri "https://ifconfig.me").Content }

# ========================================
# NPM/NODE SHORTCUTS
# ========================================

function ni { npm install }
function nid { npm install --save-dev }
function nr { npm run }
function ns { npm start }
function nt { npm test }
function nb { npm run build }

# ========================================
# PYTHON SHORTCUTS
# ========================================

function py { python }
function py3 { python3 }
function venv { python -m venv venv }
function activate { .\venv\Scripts\Activate.ps1 }

# ========================================
# PROJECT SWITCHER
# ========================================

function proj {
    param([string]$name)
    
    switch ($name) {
        "mwf" { mwf }
        "legacy" { lb }
        "n8n" { n8n }
        "ocr" { ocr }
        "recipe" { recipe }
        "zen" { zen }
        "fd" { fd }
        default { 
            Write-Host "Unknown project. Available: mwf, legacy, n8n, ocr, recipe, zen, fd" -ForegroundColor Yellow
        }
    }
}

# ========================================
# CREATE AND ENTER DIRECTORY
# ========================================

function mkcd {
    param([string]$path)
    New-Item -ItemType Directory -Force -Path $path
    Set-Location $path
}

# ========================================
# ALIASES (shorter versions)
# ========================================

Set-Alias -Name mw -Value mwf
Set-Alias -Name lg -Value lgb
Set-Alias -Name g -Value git
Set-Alias -Name n -Value npm
Set-Alias -Name p -Value python

Write-Host "✨ PowerShell aliases loaded!" -ForegroundColor Green
Write-Host "Type 'Get-Alias' to see all aliases" -ForegroundColor Cyan

'@

Write-Host @"

========================================
POWERSHELL ALIASES INSTALLED!
========================================

Profile location: $PROFILE

Main shortcuts:
  mwf     → C:\dev\MASTER-WORKFLOW
  lb      → C:\dev\legacy-bridge
  n8n     → C:\dev\n8n_workflow_windows
  ocr     → C:\dev\ocr_reader
  recipe  → C:\dev\recipe-slot-app-2
  
Commands:
  proj [name]   → Switch projects
  gac 'message' → Git add + commit
  mkcd [path]   → Make and enter directory

Restart PowerShell or run:
  . `$PROFILE

"@ -ForegroundColor Green