# AI Workflow Uninstaller - PowerShell Shim
# Cross-platform uninstaller for Windows
# Version: 1.0.0

param(
    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$Arguments
)

# Set strict mode
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Colors for output
$Host.UI.RawUI.ForegroundColor = "White"

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    $previousColor = $Host.UI.RawUI.ForegroundColor
    $Host.UI.RawUI.ForegroundColor = $Color
    Write-Host $Message
    $Host.UI.RawUI.ForegroundColor = $previousColor
}

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $ScriptDir)

# Check if Node.js is available
try {
    $nodeVersion = node --version 2>$null
    if (-not $nodeVersion) {
        throw "Node.js not found"
    }
} catch {
    Write-ColorOutput "❌ Error: Node.js is not installed" "Red"
    Write-ColorOutput "Please install Node.js to use the uninstaller" "Yellow"
    exit 1
}

# Check feature flag
$featureFlag = $env:AIWF_UNINSTALLER
$forceEnable = $Arguments -contains "--force-enable"

if ($featureFlag -ne "true" -and -not $forceEnable) {
    Write-ColorOutput "⚠️  Uninstaller is currently in preview mode" "Yellow"
    Write-ColorOutput "Set `$env:AIWF_UNINSTALLER='true' to enable or use --force-enable flag" "Gray"
    exit 0
}

# Function to print banner
function Show-Banner {
    Write-ColorOutput @"
╔════════════════════════════════════════════════════════╗
║         AI WORKFLOW UNINSTALLER v1.0.0                 ║
║         Safe removal of system components              ║
╚════════════════════════════════════════════════════════╝
"@ "Cyan"
}

# Function to check prerequisites
function Test-Prerequisites {
    $issues = 0
    
    # Check if we're in the right directory
    if (-not (Test-Path "$ProjectRoot\.ai-workflow")) {
        Write-ColorOutput "⚠️  Warning: .ai-workflow directory not found" "Yellow"
        Write-ColorOutput "Are you in the correct project directory?" "Gray"
        $issues++
    }
    
    # Check for write permissions
    try {
        $testFile = Join-Path $ProjectRoot ".uninstall-test"
        New-Item -Path $testFile -ItemType File -Force | Out-Null
        Remove-Item $testFile -Force
    } catch {
        Write-ColorOutput "❌ Error: No write permission in project directory" "Red"
        $issues++
    }
    
    # Check if git repo
    if (Test-Path "$ProjectRoot\.git") {
        Write-ColorOutput "✓ Git repository detected - git protection enabled" "Green"
    }
    
    return $issues
}

# Function to detect OS
function Get-OSInfo {
    $os = [System.Environment]::OSVersion.Platform
    $version = [System.Environment]::OSVersion.Version
    
    if ($os -eq "Win32NT") {
        $osName = "Windows"
        
        # Check if running in WSL
        if (Test-Path "/proc/version") {
            $procVersion = Get-Content "/proc/version" -ErrorAction SilentlyContinue
            if ($procVersion -match "microsoft") {
                $osName = "WSL"
            }
        }
    } else {
        $osName = "Unknown"
    }
    
    Write-ColorOutput "ℹ️  Detected OS: $osName $version" "Cyan"
    return $osName
}

# Function to run Node.js uninstaller
function Start-Uninstaller {
    param(
        [string[]]$Args
    )
    
    $uninstallerPath = Join-Path $ScriptDir "..\lib\uninstall\index.js"
    
    # Ensure path uses forward slashes for Node.js
    $uninstallerPath = $uninstallerPath -replace '\\', '/'
    
    # Build command
    $nodeArgs = @($uninstallerPath) + $Args
    
    # Change to project root
    Push-Location $ProjectRoot
    
    try {
        # Run Node.js uninstaller
        $process = Start-Process -FilePath "node" -ArgumentList $nodeArgs -NoNewWindow -PassThru -Wait
        $exitCode = $process.ExitCode
        
        if ($exitCode -eq 0) {
            Write-ColorOutput "✨ Uninstaller completed successfully" "Green"
        } else {
            Write-ColorOutput "❌ Uninstaller exited with code: $exitCode" "Red"
        }
        
        return $exitCode
    } finally {
        Pop-Location
    }
}

# Main execution
function Main {
    Show-Banner
    $os = Get-OSInfo
    
    Write-ColorOutput "📋 Pre-flight checks..." "Cyan"
    $issues = Test-Prerequisites
    
    if ($issues -gt 0) {
        Write-ColorOutput "⚠️  Some issues detected, but continuing..." "Yellow"
    }
    
    Write-Host ""
    Write-ColorOutput "🚀 Starting uninstaller..." "Green"
    Write-ColorOutput ("─" * 57) "Gray"
    
    # Run the uninstaller
    $exitCode = Start-Uninstaller -Args $Arguments
    
    exit $exitCode
}

# Handle interrupts
trap {
    Write-ColorOutput "`n⚠️  Uninstall interrupted by user" "Yellow"
    exit 130
}

# Error handling
try {
    Main
} catch {
    Write-ColorOutput "❌ Fatal error: $_" "Red"
    if ($env:DEBUG -eq "true") {
        Write-ColorOutput $_.ScriptStackTrace "Gray"
    }
    exit 1
}