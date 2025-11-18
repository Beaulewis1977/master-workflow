# Terminal Aliases Setup Guide

## 🎯 Quick Setup by Terminal

### Bash (WSL, Git Bash)
```bash
bash /mnt/c/dev/MASTER-WORKFLOW/setup-all-aliases.sh
source ~/.bashrc
```

### PowerShell
```powershell
C:\dev\MASTER-WORKFLOW\Setup-PowerShellAliases.ps1
. $PROFILE
```

### Zsh (Warp, Oh My Zsh)
```bash
bash /mnt/c/dev/MASTER-WORKFLOW/setup-zsh-aliases.sh
source ~/.zshrc
```

### Nushell
```bash
# Find config location
nu -c '$nu.config-path'

# Append the config
cat /mnt/c/dev/MASTER-WORKFLOW/nushell-config.nu >> ~/.config/nushell/config.nu

# Restart nushell
nu
```

## 📁 Manual Setup Locations

| Terminal | Config File Location |
|----------|---------------------|
| **Bash** | `~/.bashrc` or `~/.bash_aliases` |
| **Zsh** | `~/.zshrc` |
| **PowerShell** | `$PROFILE` (usually `~/Documents/WindowsPowerShell/Microsoft.PowerShell_profile.ps1`) |
| **Nushell** | `~/.config/nushell/config.nu` |
| **Warp** | Uses your shell's config (Bash/Zsh) |
| **Fish** | `~/.config/fish/config.fish` |

## 🚀 Universal Shortcuts

All terminals get these core aliases:

| Alias | Destination |
|-------|------------|
| `mwf` | MASTER-WORKFLOW |
| `lb` | legacy-bridge |
| `lgb` | legacy-bridge/legacybridge |
| `n8n` | n8n_workflow_windows |
| `ocr` | ocr_reader |
| `recipe` | recipe-slot-app-2 |
| `zen` | zen-mcp-server |
| `fd` | financial-dashboard |

## 🎨 Terminal-Specific Features

### Warp Terminal
- Automatically uses Bash/Zsh aliases
- Native autocomplete support
- Works with both WSL and native shells

### Nushell
- Structured data pipelines
- Custom `proj` command for smart switching
- `aliases` command shows all shortcuts in a table

### PowerShell
- Windows-native paths (C:\dev\...)
- PowerShell functions instead of aliases
- Works in Windows Terminal, VS Code terminal

## 💡 Tips

1. **Test your setup**: After installing, type `mwf` to test
2. **Reload config**: 
   - Bash/Zsh: `source ~/.bashrc` or `source ~/.zshrc`
   - PowerShell: `. $PROFILE`
   - Nushell: Restart shell
3. **Check aliases**:
   - Bash/Zsh: `alias`
   - PowerShell: `Get-Alias`
   - Nushell: `aliases` (custom command)

## 🔧 Troubleshooting

### "Command not found"
- Make sure you reloaded the config
- Check if the alias was added to the right file
- Verify the path exists

### Warp not recognizing aliases
- Check which shell Warp is using: `echo $SHELL`
- Make sure aliases are in the corresponding config file

### Nushell syntax errors
- Nushell uses `=` not `:`
- Paths need to be strings or bare words
- Commands are separated by `;` not `&&`