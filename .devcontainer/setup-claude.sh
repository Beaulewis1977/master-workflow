#!/bin/bash

# Setup script for Claude Code in devcontainer
set -e

echo "Setting up Claude Code..."

# Create npm global directory for user
mkdir -p /home/node/.npm-global

# Configure npm to use user directory
npm config set prefix /home/node/.npm-global

# Add to PATH in bashrc if not already there
if ! grep -q "/.npm-global/bin" /home/node/.bashrc; then
    echo 'export PATH=/home/node/.npm-global/bin:$PATH' >> /home/node/.bashrc
fi

# Install Claude Code globally
npm install -g @anthropic-ai/claude-code

# Create claude alias if it doesn't exist
if ! grep -q "alias claude=" /home/node/.bashrc; then
    echo 'alias claude="claude-code"' >> /home/node/.bashrc
fi

# Make sure the binary is executable
chmod +x /home/node/.npm-global/bin/claude-code

echo "Claude Code setup complete!"
echo "You may need to restart your terminal or run 'source ~/.bashrc' to use the 'claude' command."
