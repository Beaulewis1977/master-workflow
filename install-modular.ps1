#!/usr/bin/env pwsh
# PowerShell wrapper for the modular installer on Windows
# Delegates to install-modular.sh using Git Bash if available, otherwise uses PowerShell-native guidance.

param(
  [string]$ProjectPath = (Get-Location).Path
)

function Find-GitBash {
  $candidates = @(
    "$Env:ProgramFiles\Git\bin\bash.exe",
    "$Env:ProgramFiles\Git\usr\bin\bash.exe",
    "$Env:ProgramFiles(x86)\Git\bin\bash.exe",
    "$Env:ProgramFiles(x86)\Git\usr\bin\bash.exe"
  )
  foreach ($p in $candidates) { if (Test-Path $p) { return $p } }
  return $null
}

$bash = Find-GitBash
if ($bash) {
  Write-Host "Using Git Bash: $bash"
  & $bash -lc "'$(Split-Path -Leaf $PSCommandPath)'; exit" | Out-Null
  & $bash -lc "cd '$ProjectPath'; bash '$(Join-Path (Get-Location) 'install-modular.sh')'"
  if ($LASTEXITCODE -eq 0) {
    Write-Host "Starting Windows supervisor (FileSystemWatcher)..."
    $sup = Join-Path (Get-Location) 'supervisor-windows.ps1'
    if (Test-Path $sup) {
      Start-Process pwsh -ArgumentList "-NoProfile","-File","$sup" -WindowStyle Hidden | Out-Null
      Write-Host "Supervisor started."
    } else {
      Write-Host "Supervisor script not found at $sup (optional)."
    }
  }
  exit $LASTEXITCODE
}

Write-Host "Git Bash not found. Please install Git for Windows (includes Bash) or run under WSL."
Write-Host "Alternatively, run the installer from PowerShell manually:"
Write-Host "  bash install-modular.sh"
exit 1
