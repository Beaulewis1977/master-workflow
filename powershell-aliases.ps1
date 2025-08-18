# PowerShell Profile Setup Instructions
# 
# 1. First, find your PowerShell profile location by running:
#    $PROFILE
#
# 2. Create the profile if it doesn't exist:
#    New-Item -Path $PROFILE -Type File -Force
#
# 3. Add these functions to your profile:

# Directory Navigation Functions (PowerShell uses functions, not aliases for cd)
function mwf { Set-Location "C:\dev\MASTER-WORKFLOW" }
function dev { Set-Location "C:\dev" }
function home { Set-Location $HOME }

# Quick navigation with listing
function mwfl { 
    Set-Location "C:\dev\MASTER-WORKFLOW"
    Get-ChildItem
}

# Shorter cd aliases
function .. { Set-Location .. }
function ... { Set-Location ..\.. }

# Optional: Create shorter alias for the functions
Set-Alias -Name mw -Value mwf

# To install these:
# 1. Open PowerShell as Administrator
# 2. Run: notepad $PROFILE
# 3. Copy the functions above into the file
# 4. Save and restart PowerShell