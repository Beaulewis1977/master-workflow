# Claude Flow 2.0 - Windows Installation Guide

🪟 Complete installation and setup guide for Windows 10/11 and Windows Server

## 🎯 Quick Start

```powershell
# One-command install (PowerShell)
npx claude-flow@2.0.0 init --claude --webui --platform windows
```

## 📋 System Requirements

### Minimum Requirements
- **OS**: Windows 10 version 1809 or later, Windows 11, Windows Server 2019/2022
- **Architecture**: x64 (64-bit) or ARM64
- **Memory**: 512MB RAM (2GB recommended for 100+ agents)
- **Storage**: 100MB free disk space (1GB recommended)
- **Network**: Internet connection for MCP server discovery

### Required Software
- **Node.js**: 18.0.0 or later ([Download](https://nodejs.org/))
- **PowerShell**: 5.1 or later (included with Windows)
- **NPM**: 8.0.0 or later (included with Node.js)

### Optional but Recommended
- **Windows Terminal**: For enhanced CLI experience
- **PowerShell 7**: Latest PowerShell Core
- **Git**: For development and updates
- **Windows Subsystem for Linux (WSL)**: For hybrid workflows

## 🚀 Installation Methods

### Method 1: PowerShell Script (Recommended)

```powershell
# Run as Administrator (recommended) or regular user
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force

# Download and run installer
irm https://get.claude-flow.dev/windows.ps1 | iex

# Or manual download and run
Invoke-WebRequest -Uri "https://get.claude-flow.dev/windows.ps1" -OutFile "install-claude-flow.ps1"
.\install-claude-flow.ps1
```

### Method 2: NPM Installation

```powershell
# Install globally via NPM
npm install -g claude-flow@2.0.0

# Initialize with Windows optimizations
claude-flow init --claude --webui --platform windows
```

### Method 3: Chocolatey Package Manager

```powershell
# Install Chocolatey if not already installed
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install Claude Flow
choco install claude-flow -y
```

### Method 4: Windows Package Manager (winget)

```cmd
# Install via winget (Windows 10 1809+ or Windows 11)
winget install ClaudeFlow.ClaudeFlow
```

### Method 5: Manual Installation

1. Download the latest Windows release from [GitHub Releases](https://github.com/your-org/claude-flow/releases)
2. Extract `claude-flow-2.0.0-windows-x64.zip` to `C:\Program Files\claude-flow\`
3. Add `C:\Program Files\claude-flow\bin\` to your PATH
4. Run `claude-flow init --claude --webui`

## 🔧 Configuration

### Automatic Configuration

After installation, Claude Flow automatically configures:

```powershell
# Configuration locations
$env:APPDATA\claude-flow\                    # User configuration
$env:LOCALAPPDATA\claude-flow\              # User data and cache
$env:ProgramData\claude-flow\               # System-wide configuration (if admin)
$env:TEMP\claude-flow\                      # Temporary files
```

### PowerShell Profile Integration

Claude Flow automatically adds to your PowerShell profile:

```powershell
# View your PowerShell profile
notepad $PROFILE

# Manual addition (if needed)
@"
# Claude Flow 2.0 Integration
function Start-ClaudeFlow { npx claude-flow@2.0.0 hive-mind spawn "MASTER-WORKFLOW" --agents $args[0] }
function Stop-ClaudeFlow { Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*claude-flow*" } | Stop-Process }
function Get-ClaudeFlowStatus { npx claude-flow@2.0.0 status }

# Aliases
Set-Alias -Name cf-start -Value Start-ClaudeFlow
Set-Alias -Name cf-stop -Value Stop-ClaudeFlow
Set-Alias -Name cf-status -Value Get-ClaudeFlowStatus
"@ | Add-Content $PROFILE
```

### Windows Registry Integration

Claude Flow stores Windows-specific settings in the registry:

```powershell
# View Claude Flow registry settings
Get-ItemProperty -Path "HKCU:\Software\claude-flow" -ErrorAction SilentlyContinue

# Registry locations:
# HKEY_CURRENT_USER\Software\claude-flow          # User settings
# HKEY_LOCAL_MACHINE\Software\claude-flow         # System settings (if admin)
```

## 🎨 Windows Terminal Integration

### Profile Configuration

Add Claude Flow to Windows Terminal:

```json
// In Windows Terminal settings.json
{
    "profiles": {
        "list": [
            {
                "name": "Claude Flow PowerShell",
                "commandline": "powershell.exe -NoExit -Command \"Import-Module claude-flow; Start-ClaudeFlow\"",
                "icon": "https://claude-flow.dev/favicon.ico",
                "colorScheme": "Claude Flow Dark"
            }
        ]
    },
    "schemes": [
        {
            "name": "Claude Flow Dark",
            "background": "#1E1E2E",
            "foreground": "#CDD6F4",
            "cursorColor": "#F38BA8"
        }
    ]
}
```

### Custom Actions

```json
// Windows Terminal actions
{
    "actions": [
        {
            "command": {
                "action": "sendInput",
                "input": "claude-flow status\r"
            },
            "keys": "ctrl+shift+f1",
            "name": "Claude Flow Status"
        },
        {
            "command": {
                "action": "sendInput", 
                "input": "claude-flow webui\r"
            },
            "keys": "ctrl+shift+f2",
            "name": "Open Claude Flow Web UI"
        }
    ]
}
```

## 🚀 First Run

### Initialize Claude Flow

```powershell
# Basic initialization
claude-flow init

# Full initialization with Web UI
claude-flow init --claude --webui

# Advanced initialization with custom settings
claude-flow init --claude --webui --agents 1000 --port 3003
```

### Start Queen Controller

```powershell
# Start with default settings (10 agents)
claude-flow hive-mind spawn "MASTER-WORKFLOW"

# Start with custom agent count
claude-flow hive-mind spawn "MASTER-WORKFLOW" --agents 500

# Start with Web UI
claude-flow hive-mind spawn "MASTER-WORKFLOW" --agents 100 --webui

# Start in background (Windows Service style)
claude-flow hive-mind spawn "MASTER-WORKFLOW" --agents 100 --daemon
```

### Access Web UI

```powershell
# Open Web UI in default browser
claude-flow webui

# Or manually navigate to:
# http://localhost:3003/dashboard
```

## 🔍 Windows-Specific Features

### Windows Service Integration

```powershell
# Install as Windows Service (requires Administrator)
claude-flow service install

# Start/Stop service
net start ClaudeFlowService
net stop ClaudeFlowService

# Remove service
claude-flow service uninstall
```

### Windows Defender Configuration

Add exclusions to prevent false positives:

```powershell
# Add Windows Defender exclusions
Add-MpPreference -ExclusionPath "$env:APPDATA\claude-flow"
Add-MpPreference -ExclusionPath "$env:LOCALAPPDATA\claude-flow"
Add-MpPreference -ExclusionProcess "claude-flow.exe"
```

### Firewall Configuration

```powershell
# Allow Claude Flow through Windows Firewall
netsh advfirewall firewall add rule name="Claude Flow Web UI" dir=in action=allow protocol=TCP localport=3003
netsh advfirewall firewall add rule name="Claude Flow MCP" dir=in action=allow protocol=TCP localport=3002
```

### Performance Optimizations

```powershell
# Optimize Windows for Claude Flow
# Enable high-performance power plan
powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c

# Increase process priority (optional)
Get-Process -Name "node" | Where-Object { $_.ProcessName -like "*claude-flow*" } | ForEach-Object { $_.PriorityClass = "High" }
```

## 🧪 Testing Installation

### Basic Tests

```powershell
# Test CLI
claude-flow --version
claude-flow --help

# Test platform detection
claude-flow platform-info

# Test MCP discovery
claude-flow mcp discover --timeout 30

# Test agent spawning (dry run)
claude-flow hive-mind spawn "TEST" --agents 10 --dry-run
```

### Advanced Tests

```powershell
# Performance test
claude-flow benchmark --agents 100 --duration 60

# Memory test
claude-flow memory-test --size 1GB

# Network test
claude-flow network-test --host localhost --port 3003
```

## 🔧 Troubleshooting

### Common Issues

#### PowerShell Execution Policy Error
```powershell
# Error: "cannot be loaded because running scripts is disabled"
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force

# Or run specific command with bypass
powershell -ExecutionPolicy Bypass -Command "claude-flow init"
```

#### Node.js Not Found
```powershell
# Install Node.js
winget install OpenJS.NodeJS

# Or download from https://nodejs.org/
# Restart PowerShell after installation
```

#### Permission Denied Errors
```powershell
# Run PowerShell as Administrator
Start-Process PowerShell -Verb RunAs

# Or fix npm permissions
npm config set prefix "$env:APPDATA\npm"
[Environment]::SetEnvironmentVariable("PATH", "$env:PATH;$env:APPDATA\npm", "User")
```

#### Port Already in Use
```powershell
# Find process using port
netstat -ano | findstr :3003

# Kill process (replace PID)
taskkill /F /PID 1234

# Or use different port
claude-flow init --port 3004
```

#### Windows Defender Blocking
```powershell
# Check Windows Defender logs
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Windows Defender/Operational'; ID=1116}

# Add exclusion
Add-MpPreference -ExclusionPath "$env:APPDATA\claude-flow"
```

### Performance Issues

#### High Memory Usage
```powershell
# Monitor memory usage
Get-Process -Name "node" | Select-Object Name, CPU, WorkingSet, VirtualMemorySize

# Restart with memory limits
claude-flow hive-mind spawn "MASTER-WORKFLOW" --agents 100 --memory-limit 2048
```

#### Slow Startup
```powershell
# Profile startup time
Measure-Command { claude-flow init }

# Clear cache
claude-flow cache clear

# Reinstall
npm uninstall -g claude-flow
npm install -g claude-flow@2.0.0
```

### Network Issues

#### Can't Access Web UI
```powershell
# Check if service is running
claude-flow status

# Test local connection
Test-NetConnection -ComputerName localhost -Port 3003

# Check Windows Firewall
Get-NetFirewallRule -DisplayName "*Claude Flow*"
```

## 🗑️ Uninstallation

### Complete Removal

```powershell
# Stop all Claude Flow processes
claude-flow stop --force

# Uninstall via Claude Flow
claude-flow uninstall --remove-all

# Or manual NPM uninstall
npm uninstall -g claude-flow

# Remove configuration (optional)
Remove-Item -Recurse -Force "$env:APPDATA\claude-flow" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\claude-flow" -ErrorAction SilentlyContinue

# Remove registry entries (optional)
Remove-Item -Path "HKCU:\Software\claude-flow" -Recurse -Force -ErrorAction SilentlyContinue

# Remove from PATH (if manually added)
$path = [Environment]::GetEnvironmentVariable("PATH", "User")
$newPath = $path -replace ";.*claude-flow.*", ""
[Environment]::SetEnvironmentVariable("PATH", $newPath, "User")
```

### Clean PowerShell Profile

```powershell
# Remove from PowerShell profile
$profileContent = Get-Content $PROFILE -Raw
$cleanContent = $profileContent -replace "(?s)# Claude Flow.*?# Claude Flow.*?\r?\n", ""
$cleanContent | Set-Content $PROFILE
```

## 📚 Additional Resources

### Windows-Specific Documentation
- [PowerShell Integration Guide](./powershell-integration.md)
- [Windows Terminal Setup](./windows-terminal.md)
- [WSL Integration Guide](./wsl-integration.md)
- [Windows Service Configuration](./windows-service.md)

### Support Resources
- [Windows Issues on GitHub](https://github.com/your-org/claude-flow/labels/windows)
- [PowerShell Gallery](https://www.powershellgallery.com/packages/claude-flow)
- [Windows Community Forum](https://community.claude-flow.dev/windows)
- [Video Tutorials](https://youtube.com/claude-flow-windows)

### Performance Guides  
- [Windows Performance Optimization](./windows-performance.md)
- [Memory Management on Windows](./windows-memory.md)
- [Scaling on Windows Server](./windows-server-scaling.md)

---

## ✅ Installation Checklist

- [ ] Windows 10/11 or Server 2019/2022
- [ ] Node.js 18.0.0+ installed
- [ ] PowerShell execution policy configured
- [ ] Claude Flow installed and initialized
- [ ] Web UI accessible at http://localhost:3003
- [ ] PowerShell integration working
- [ ] Windows Terminal configured (optional)
- [ ] Windows Defender exclusions added
- [ ] First agents spawned successfully

**🎉 Welcome to Claude Flow 2.0 on Windows!**