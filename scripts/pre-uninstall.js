#!/usr/bin/env node

/**
 * Claude Flow 2.0 - Pre-Uninstall Script
 * 
 * Runs before npm uninstall to clean up and save user data
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const readline = require('readline');

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m'
};

async function preUninstall() {
    console.log(`
${colors.yellow}⚠ Claude Flow 2.0 Uninstall${colors.reset}
    `);

    // Check for active Claude Flow projects
    const projectsWithClaudeFlow = await findClaudeFlowProjects();
    
    if (projectsWithClaudeFlow.length > 0) {
        console.log(`${colors.yellow}Found ${projectsWithClaudeFlow.length} project(s) with Claude Flow:${colors.reset}`);
        
        for (const project of projectsWithClaudeFlow) {
            console.log(`  • ${project}`);
        }
        
        console.log(`
${colors.cyan}Would you like to:${colors.reset}
  1. Create backups of Claude Flow configurations
  2. Remove all Claude Flow files
  3. Keep Claude Flow files (manual cleanup required)
        `);
        
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        const answer = await new Promise(resolve => {
            rl.question('Choose option (1/2/3) [1]: ', (ans) => {
                resolve(ans || '1');
            });
        });
        
        rl.close();
        
        switch (answer) {
            case '1':
                await createBackups(projectsWithClaudeFlow);
                break;
            case '2':
                await removeAllClaudeFlowFiles(projectsWithClaudeFlow);
                break;
            case '3':
                console.log(`${colors.dim}Claude Flow files will be preserved${colors.reset}`);
                break;
            default:
                await createBackups(projectsWithClaudeFlow);
        }
    }
    
    // Save uninstall metadata
    await saveUninstallMetadata();
    
    console.log(`
${colors.green}✓ Pre-uninstall tasks completed${colors.reset}

${colors.cyan}Thank you for using Claude Flow 2.0!${colors.reset}

If you change your mind, you can reinstall with:
  ${colors.bright}npm install -g claude-flow@2.0.0${colors.reset}

${colors.dim}Your feedback is valuable: https://github.com/yourusername/claude-flow-2.0/issues${colors.reset}
    `);
}

async function findClaudeFlowProjects() {
    const projects = [];
    
    // Check common project directories
    const searchPaths = [
        process.cwd(),
        path.join(os.homedir(), 'projects'),
        path.join(os.homedir(), 'Documents'),
        path.join(os.homedir(), 'dev'),
        path.join(os.homedir(), 'code')
    ];
    
    for (const searchPath of searchPaths) {
        try {
            const claudeFlowPath = path.join(searchPath, '.claude-flow');
            await fs.access(claudeFlowPath);
            projects.push(searchPath);
        } catch {
            // Not a Claude Flow project
        }
    }
    
    return projects;
}

async function createBackups(projects) {
    console.log(`${colors.cyan}Creating backups...${colors.reset}`);
    
    const backupDir = path.join(os.homedir(), '.claude-flow-backups');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    await fs.mkdir(backupDir, { recursive: true });
    
    for (const project of projects) {
        const projectName = path.basename(project) || 'project';
        const backupName = `${projectName}-${timestamp}.tar.gz`;
        const backupPath = path.join(backupDir, backupName);
        
        try {
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);
            
            await execAsync(
                `tar -czf "${backupPath}" -C "${project}" .claude-flow`,
                { cwd: project }
            );
            
            console.log(`  ${colors.green}✓${colors.reset} Backed up: ${projectName} → ${backupName}`);
        } catch (error) {
            console.error(`  ${colors.red}✗${colors.reset} Failed to backup ${projectName}: ${error.message}`);
        }
    }
    
    console.log(`${colors.green}✓ Backups saved to: ${backupDir}${colors.reset}`);
}

async function removeAllClaudeFlowFiles(projects) {
    console.log(`${colors.yellow}Removing Claude Flow files...${colors.reset}`);
    
    for (const project of projects) {
        const claudeFlowPath = path.join(project, '.claude-flow');
        
        try {
            await fs.rm(claudeFlowPath, { recursive: true, force: true });
            console.log(`  ${colors.green}✓${colors.reset} Removed: ${project}/.claude-flow`);
        } catch (error) {
            console.error(`  ${colors.red}✗${colors.reset} Failed to remove ${claudeFlowPath}: ${error.message}`);
        }
    }
    
    console.log(`${colors.green}✓ Claude Flow files removed${colors.reset}`);
}

async function saveUninstallMetadata() {
    const metadataDir = path.join(os.homedir(), '.claude-flow');
    const metadataPath = path.join(metadataDir, 'uninstall.json');
    
    try {
        await fs.mkdir(metadataDir, { recursive: true });
        
        const metadata = {
            uninstalledAt: new Date().toISOString(),
            version: '2.0.0',
            reason: 'user-initiated',
            backupsCreated: true
        };
        
        await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    } catch {
        // Silent fail - not critical
    }
}

// Run pre-uninstall
preUninstall().catch(error => {
    // Don't fail uninstallation on pre-uninstall errors
    console.error(`${colors.yellow}Warning: Pre-uninstall script encountered an error${colors.reset}`);
    console.error(error.message);
});