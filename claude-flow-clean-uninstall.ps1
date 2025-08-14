# Claude Flow 2.0 Clean Uninstall Script (PowerShell)
# Cross-platform PowerShell script for easy uninstallation on Windows

param(
    [switch]$DryRun,
    [switch]$Force,
    [switch]$NoBackup,
    [switch]$Verbose,
    [switch]$Help,
    [string]$Recover,
    [string]$FromBackup
)

# Color functions
function Write-Info { param($Message) Write-Host "[INFO] $Message" -ForegroundColor Cyan }
function Write-Success { param($Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Warning { param($Message) Write-Host "[WARNING] $Message" -ForegroundColor Yellow }
function Write-Error-Custom { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }

# Function to show help
function Show-Help {
    @"
Claude Flow 2.0 Clean Uninstaller (PowerShell)

USAGE:
    .\claude-flow-clean-uninstall.ps1 [OPTIONS]
    .\claude-flow-clean-uninstall.ps1 -Recover -FromBackup <backup-path>

OPTIONS:
    -DryRun         Preview what will be removed without actually removing
    -Force          Skip confirmation prompts and stop running processes
    -NoBackup       Skip backup creation (not recommended)
    -Verbose        Show detailed output during uninstall
    -Help           Show this help message

RECOVERY:
    -Recover -FromBackup <path>    Restore from a backup directory

EXAMPLES:
    .\claude-flow-clean-uninstall.ps1 -DryRun
    .\claude-flow-clean-uninstall.ps1 -Force -Verbose
    .\claude-flow-clean-uninstall.ps1 -NoBackup
    .\claude-flow-clean-uninstall.ps1 -Recover -FromBackup "C:\Temp\claude-flow-backup-123456"

DESCRIPTION:
    This script safely removes ALL Claude Flow 2.0 components while preserving
    100% of your original project files. It includes:
    
    - Comprehensive backup system
    - Component scanner to find all Claude Flow files
    - Safe removal with verification
    - Project integrity checks
    - Recovery system for failed uninstalls
    - Windows compatibility

SAFETY FEATURES:
    - Creates backup before removal (unless -NoBackup)
    - Scans for running processes and stops them safely
    - Verifies project integrity after removal
    - Can restore from backup if anything goes wrong
    - Never removes user's source code or project files

"@
}

# Show help if requested
if ($Help) {
    Show-Help
    exit 0
}

# Check if Node.js is available
try {
    $nodeVersion = node --version 2>$null
    Write-Info "Found Node.js: $nodeVersion"
} catch {
    Write-Error-Custom "Node.js is required but not installed. Please install Node.js first."
    exit 1
}

# Get the directory where this script is located
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$UninstallerJs = Join-Path $ScriptDir "claude-flow-uninstaller.js"

# Check if the uninstaller exists
if (-not (Test-Path $UninstallerJs)) {
    Write-Error-Custom "claude-flow-uninstaller.js not found in $ScriptDir"
    Write-Error-Custom "Please ensure both files are in the same directory."
    exit 1
}

# Handle recovery command
if ($Recover -and $FromBackup) {
    if (-not (Test-Path $FromBackup -PathType Container)) {
        Write-Error-Custom "Backup directory does not exist: $FromBackup"
        exit 1
    }
    
    Write-Info "Starting recovery from backup: $FromBackup"
    $result = node $UninstallerJs recover --from-backup $FromBackup
    exit $LASTEXITCODE
}

if ($Recover -and -not $FromBackup) {
    Write-Error-Custom "Recovery requires -FromBackup parameter"
    Write-Error-Custom "Usage: .\claude-flow-clean-uninstall.ps1 -Recover -FromBackup <backup-path>"
    exit 1
}

# Build command line arguments for Node.js script
$NodeArgs = @()

if ($DryRun) { $NodeArgs += "--dry-run" }
if ($Force) { $NodeArgs += "--force" }
if ($NoBackup) { $NodeArgs += "--no-backup" }
if ($Verbose) { $NodeArgs += "--verbose" }

# Pre-flight checks
Write-Info "Claude Flow 2.0 Clean Uninstaller"
Write-Info "Performing pre-flight checks..."

# Check if we're in a valid directory
$hasPackageJson = Test-Path "package.json"
$hasClaudeFlow = Test-Path ".claude-flow" -PathType Container
$hasClaudeFlowCli = Test-Path "claude-flow-cli.js"

if (-not ($hasPackageJson -or $hasClaudeFlow -or $hasClaudeFlowCli)) {
    Write-Warning "This doesn't appear to be a Claude Flow project directory."
    Write-Warning "No package.json, .claude-flow directory, or claude-flow-cli.js found."
    
    if (-not $Force) {
        $response = Read-Host "Continue anyway? (y/N)"
        if ($response -notmatch "^[Yy]$") {
            Write-Info "Uninstall cancelled."
            exit 0
        }
    }
}

# Check for running processes before starting
Write-Info "Checking for running Claude Flow processes..."

function Test-RunningProcesses {
    $processNames = @("claude-flow", "hive-mind", "queen-controller")
    $foundProcesses = @()
    
    foreach ($processName in $processNames) {
        $processes = Get-Process | Where-Object { $_.Name -like "*$processName*" -or $_.ProcessName -like "*$processName*" }
        if ($processes) {
            $foundProcesses += $processName
        }
    }
    
    # Also check for Node.js processes running Claude Flow
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
        $_.CommandLine -like "*claude-flow*"
    }
    if ($nodeProcesses) {
        $foundProcesses += "node (claude-flow)"
    }
    
    if ($foundProcesses.Count -gt 0) {
        Write-Warning "Found running Claude Flow processes: $($foundProcesses -join ', ')"
        if ($Force) {
            Write-Info "Force mode enabled - processes will be terminated during uninstall"
        } else {
            Write-Warning "Please stop these processes before uninstalling, or use -Force to terminate them automatically."
            $response = Read-Host "Continue with force termination? (y/N)"
            if ($response -match "^[Yy]$") {
                $script:NodeArgs += "--force"
            } else {
                Write-Info "Please stop the processes manually and try again."
                exit 1
            }
        }
    }
}

# Only check processes if not in dry-run mode
if (-not $DryRun) {
    Test-RunningProcesses
}

# Show what will be done
if ($DryRun) {
    Write-Info "DRY RUN MODE - Nothing will actually be removed"
} else {
    Write-Info "Starting Claude Flow 2.0 uninstallation..."
}

# Create error handling
$ErrorActionPreference = "Stop"

try {
    # Run the Node.js uninstaller
    Write-Info "Executing uninstaller..."
    
    # Use Start-Process to better handle the execution
    $processArgs = @($UninstallerJs) + $NodeArgs
    $process = Start-Process -FilePath "node" -ArgumentList $processArgs -Wait -PassThru -NoNewWindow
    
    if ($process.ExitCode -eq 0) {
        if ($DryRun) {
            Write-Success "Dry run completed successfully!"
            Write-Info "Use '.\claude-flow-clean-uninstall.ps1' without -DryRun to perform the actual uninstall."
        } else {
            Write-Success "Claude Flow 2.0 has been successfully uninstalled!"
            Write-Info "Your project files have been preserved."
            
            # Check if backup was created
            if (Test-Path ".claude-flow-backup-location.txt") {
                $backupLoc = Get-Content ".claude-flow-backup-location.txt"
                Write-Info "Backup created at: $backupLoc"
                Write-Info "You can recover using: .\claude-flow-clean-uninstall.ps1 -Recover -FromBackup '$backupLoc'"
                
                # Clean up the backup location file
                Remove-Item ".claude-flow-backup-location.txt" -Force -ErrorAction SilentlyContinue
            }
            
            # Check if uninstall report was created
            if (Test-Path "claude-flow-uninstall-report.json") {
                Write-Info "Uninstall report available: claude-flow-uninstall-report.json"
            }
        }
    } else {
        Write-Error-Custom "Uninstall failed with exit code $($process.ExitCode)"
        
        # Check if backup exists for recovery
        if (Test-Path ".claude-flow-backup-location.txt") {
            $backupLoc = Get-Content ".claude-flow-backup-location.txt"
            Write-Info "Backup available at: $backupLoc"
            Write-Info "You can attempt recovery using: .\claude-flow-clean-uninstall.ps1 -Recover -FromBackup '$backupLoc'"
        }
        
        exit $process.ExitCode
    }
} catch {
    Write-Error-Custom "Uninstall failed with error: $($_.Exception.Message)"
    
    # Check if backup exists for recovery
    if (Test-Path ".claude-flow-backup-location.txt") {
        $backupLoc = Get-Content ".claude-flow-backup-location.txt"
        Write-Info "Backup available at: $backupLoc"
        Write-Info "You can attempt recovery using: .\claude-flow-clean-uninstall.ps1 -Recover -FromBackup '$backupLoc'"
    }
    
    exit 1
}