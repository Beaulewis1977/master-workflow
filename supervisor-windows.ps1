#!/usr/bin/env pwsh
# Windows FileSystemWatcher-based supervisor

param(
  [int]$Interval = 1800
)

$installDir = Join-Path (Get-Location) '.ai-workflow'
$projectDir = Get-Location
$analysisFile = Join-Path $projectDir '.ai-dev/analysis.json'
approachJson = Join-Path $installDir 'configs/approach.json'
$logFile = Join-Path $installDir 'logs/supervisor.log'

function Log($msg) { "[$(Get-Date -Format o)] $msg" | Tee-Object -FilePath $logFile -Append }

# Initial interval-based refresh
function Refresh {
  Log "Supervisor tick - re-analyzing project"
  $analyzer = Join-Path $installDir 'intelligence-engine/complexity-analyzer.js'
  if (Test-Path $analyzer) {
    node $analyzer 2>> $logFile | Out-File -FilePath $analysisFile -Encoding utf8
  }
  if (Test-Path $analysisFile) {
    $selector = Join-Path $installDir 'lib/select-approach.js'
    $docs = Join-Path $installDir 'lib/generate-docs.js'
    $env:CLAUDE_FLOW_VERSION = $env:CLAUDE_FLOW_VERSION -ne $null ? $env:CLAUDE_FLOW_VERSION : 'alpha'
    node $selector $analysisFile $approachJson >> $logFile 2>&1
    node $docs $analysisFile $approachJson >> $logFile 2>&1
  }
}

# File watcher
$fsw = New-Object System.IO.FileSystemWatcher
$fsw.Path = $projectDir.Path
$fsw.IncludeSubdirectories = $true
$fsw.EnableRaisingEvents = $true
$fsw.Filter = '*.*'

$onChanged = Register-ObjectEvent $fsw Changed -Action { Refresh }
$onCreated = Register-ObjectEvent $fsw Created -Action { Refresh }
$onDeleted = Register-ObjectEvent $fsw Deleted -Action { Refresh }

# Periodic refresh
while ($true) {
  Refresh
  Start-Sleep -Seconds $Interval
}
