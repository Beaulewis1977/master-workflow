/**
 * AI Workflow Uninstaller - Backup Manager
 * 
 * Handles creation of backup archives with platform detection,
 * progress reporting, and comprehensive error handling.
 * 
 * Phase 4: Backup & Restore Points Implementation
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { exec } = require('child_process');
const { promisify } = require('util');

// Platform-specific archive libraries
let tar, archiver;
try {
    tar = require('tar');
} catch (err) {
    console.warn('Warning: tar module not available, will use fallback for Linux/macOS');
}

try {
    archiver = require('archiver');
} catch (err) {
    console.warn('Warning: archiver module not available, will use fallback for Windows');
}

const execAsync = promisify(exec);

/**
 * Main backup manager class for AI Workflow Uninstaller
 */
class BackupManager {
    constructor(ui = null) {
        this.ui = ui;
        this.platform = this.detectPlatform();
        this.progressCallback = null;
    }

    /**
     * Create a backup archive with the specified configuration
     * @param {Object} config - Backup configuration from UI
     * @param {Object} classification - File classification data
     * @param {Object} plan - Removal plan data
     * @returns {Promise<Object>} Backup result with path and metadata
     */
    async createBackup(config, classification, plan) {
        try {
            // Validate inputs
            if (!config || !classification || !plan) {
                throw new Error('Missing required backup parameters: config, classification, or plan');
            }

            // Determine backup path and create directory
            const backupPath = await this.getBackupPath(config.projectName || 'ai-workflow');
            const backupDir = path.dirname(backupPath);
            
            await this.ensureDirectory(backupDir);

            // Check available disk space
            await this.checkDiskSpace(backupDir);

            // Gather files to backup
            const filesToBackup = await this.gatherBackupFiles(config, classification, plan);

            // Create temporary staging directory
            const stagingDir = await this.createStagingDirectory();

            try {
                // Stage files for backup
                await this.stageFiles(filesToBackup, stagingDir);

                // Create metadata
                const metadata = this.generateMetadata(config, classification, plan, filesToBackup);
                await this.writeMetadata(stagingDir, metadata);

                // Create restore instructions
                await this.createRestoreInstructions(stagingDir, backupPath, metadata);

                // Determine archive type and create backup
                const archiveType = this.determineArchiveType();
                let finalBackupPath;

                if (archiveType === 'tar.gz') {
                    finalBackupPath = await this.createTarGzArchive(stagingDir, backupPath);
                } else {
                    finalBackupPath = await this.createZipArchive(stagingDir, backupPath);
                }

                // Verify backup integrity
                await this.verifyBackupIntegrity(finalBackupPath);

                // Clean up staging directory
                await this.cleanupDirectory(stagingDir);

                return {
                    success: true,
                    path: finalBackupPath,
                    size: await this.getFileSize(finalBackupPath),
                    archiveType,
                    metadata,
                    created: new Date().toISOString()
                };

            } catch (error) {
                // Clean up staging directory on error
                await this.cleanupDirectory(stagingDir).catch(() => {});
                throw error;
            }

        } catch (error) {
            console.error('Backup creation failed:', error.message);
            throw error;
        }
    }

    /**
     * Detect platform and determine appropriate archive format
     * @returns {string} Archive type: 'tar.gz' or 'zip'
     */
    determineArchiveType() {
        const platform = os.platform();
        
        // Use tar.gz for Unix-like systems (Linux, macOS, WSL)
        if (platform === 'linux' || platform === 'darwin') {
            return 'tar.gz';
        }
        
        // Check for WSL on Windows
        if (platform === 'win32') {
            try {
                // Check if we're in WSL
                const release = os.release();
                if (release.includes('Microsoft') || release.includes('WSL')) {
                    return 'tar.gz';
                }
            } catch (err) {
                // Ignore and default to zip
            }
            return 'zip';
        }
        
        // Default to tar.gz for other Unix-like systems
        return 'tar.gz';
    }

    /**
     * Create tar.gz archive (Linux/macOS/WSL)
     * @param {string} sourceDir - Directory to archive
     * @param {string} outputPath - Output archive path
     * @returns {Promise<string>} Final archive path
     */
    async createTarGzArchive(sourceDir, outputPath) {
        const finalPath = outputPath.endsWith('.tar.gz') ? outputPath : `${outputPath}.tar.gz`;

        if (tar) {
            // Use tar module if available
            await this.reportProgress(0, 100, 'Creating tar.gz archive...');
            
            await tar.create(
                {
                    gzip: true,
                    file: finalPath,
                    cwd: path.dirname(sourceDir)
                },
                [path.basename(sourceDir)]
            );

            await this.reportProgress(100, 100, 'Archive created successfully');
        } else {
            // Fallback to system tar command
            await this.reportProgress(0, 100, 'Creating tar.gz archive using system tar...');
            
            const tarCommand = `tar -czf "${finalPath}" -C "${path.dirname(sourceDir)}" "${path.basename(sourceDir)}"`;
            await execAsync(tarCommand);

            await this.reportProgress(100, 100, 'Archive created successfully');
        }

        return finalPath;
    }

    /**
     * Create zip archive (Windows)
     * @param {string} sourceDir - Directory to archive
     * @param {string} outputPath - Output archive path
     * @returns {Promise<string>} Final archive path
     */
    async createZipArchive(sourceDir, outputPath) {
        const finalPath = outputPath.endsWith('.zip') ? outputPath : `${outputPath}.zip`;

        if (archiver) {
            // Use archiver module
            return new Promise((resolve, reject) => {
                const output = fsSync.createWriteStream(finalPath);
                const archive = archiver('zip', {
                    zlib: { level: 9 } // Maximum compression
                });

                let totalFiles = 0;
                let processedFiles = 0;

                output.on('close', () => {
                    this.reportProgress(100, 100, 'Archive created successfully');
                    resolve(finalPath);
                });

                archive.on('error', (err) => {
                    reject(err);
                });

                archive.on('entry', () => {
                    processedFiles++;
                    const progress = Math.floor((processedFiles / Math.max(totalFiles, 1)) * 100);
                    this.reportProgress(progress, 100, `Archiving files... (${processedFiles}/${totalFiles})`);
                });

                archive.pipe(output);

                // Count files first
                this.countFilesInDirectory(sourceDir).then(count => {
                    totalFiles = count;
                    this.reportProgress(0, 100, 'Creating zip archive...');
                    
                    // Add directory to archive
                    archive.directory(sourceDir, false);
                    archive.finalize();
                }).catch(reject);
            });
        } else {
            // Fallback using system commands (if available)
            await this.reportProgress(0, 100, 'Creating zip archive using system tools...');
            
            try {
                // Try PowerShell on Windows
                if (os.platform() === 'win32') {
                    const psCommand = `Compress-Archive -Path "${sourceDir}\\*" -DestinationPath "${finalPath}" -Force`;
                    await execAsync(`powershell -Command "${psCommand}"`);
                } else {
                    // Try zip command on Unix-like systems
                    const zipCommand = `cd "${path.dirname(sourceDir)}" && zip -r "${finalPath}" "${path.basename(sourceDir)}"`;
                    await execAsync(zipCommand);
                }
                
                await this.reportProgress(100, 100, 'Archive created successfully');
            } catch (error) {
                throw new Error(`Failed to create zip archive: ${error.message}. Please install archiver module for better zip support.`);
            }
        }

        return finalPath;
    }

    /**
     * Verify backup archive integrity
     * @param {string} backupPath - Path to backup archive
     * @returns {Promise<boolean>} True if backup is valid
     */
    async verifyBackupIntegrity(backupPath) {
        try {
            await this.reportProgress(0, 100, 'Verifying backup integrity...');

            // Check if file exists and is readable
            const stats = await fs.stat(backupPath);
            if (!stats.isFile() || stats.size === 0) {
                throw new Error('Backup file is empty or corrupted');
            }

            // Basic archive validation based on type
            if (backupPath.endsWith('.tar.gz')) {
                await this.verifyTarGzIntegrity(backupPath);
            } else if (backupPath.endsWith('.zip')) {
                await this.verifyZipIntegrity(backupPath);
            }

            await this.reportProgress(100, 100, 'Backup verification complete');
            return true;

        } catch (error) {
            throw new Error(`Backup verification failed: ${error.message}`);
        }
    }

    /**
     * Generate backup path with timestamp
     * @param {string} projectName - Name of the project
     * @returns {Promise<string>} Backup file path
     */
    async getBackupPath(projectName) {
        const homeDir = os.homedir();
        const backupDir = path.join(homeDir, '.ai-workflow-uninstall-backups');
        
        // Ensure backup directory exists
        await this.ensureDirectory(backupDir);

        // Generate timestamp with milliseconds for uniqueness
        const now = new Date();
        const timestamp = now.toISOString()
            .replace(/[:.]/g, '-')
            .replace('T', '_')
            .substring(0, 19) + '-' + now.getMilliseconds().toString().padStart(3, '0');

        // Clean project name for filename
        const cleanName = projectName.replace(/[^a-zA-Z0-9-_]/g, '_');
        
        const filename = `${cleanName}-${timestamp}`;
        return path.join(backupDir, filename);
    }

    /**
     * Detect current platform for backup decisions
     * @returns {string} Platform identifier
     */
    detectPlatform() {
        const platform = os.platform();
        const arch = os.arch();
        const release = os.release();

        return {
            platform,
            arch,
            release,
            isWSL: platform === 'win32' && (release.includes('Microsoft') || release.includes('WSL')),
            nodeVersion: process.version
        };
    }

    /**
     * Gather files to include in backup based on configuration
     * @private
     */
    async gatherBackupFiles(config, classification, plan) {
        const files = [];

        // Always include manifests
        files.push({
            type: 'manifest',
            name: 'installation-record.json',
            content: JSON.stringify(classification.manifests?.installation || {}, null, 2)
        });

        files.push({
            type: 'manifest',
            name: 'generation-record.json',
            content: JSON.stringify(classification.manifests?.generation || {}, null, 2)
        });

        // Include removal plan
        files.push({
            type: 'plan',
            name: 'removal-plan.json',
            content: JSON.stringify(plan, null, 2)
        });

        // Include configuration if requested
        if (config.options && config.options.includes('config')) {
            files.push({
                type: 'config',
                name: 'uninstall-config.json',
                content: JSON.stringify(config, null, 2)
            });
        }

        return files;
    }

    /**
     * Create staging directory for backup preparation
     * @private
     */
    async createStagingDirectory() {
        const tmpDir = os.tmpdir();
        const stagingDir = path.join(tmpDir, `ai-workflow-backup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
        await this.ensureDirectory(stagingDir);
        return stagingDir;
    }

    /**
     * Stage files in temporary directory with proper structure
     * @private
     */
    async stageFiles(files, stagingDir) {
        await this.reportProgress(0, 100, 'Staging files for backup...');

        const totalFiles = files.length;
        let processedFiles = 0;

        for (const file of files) {
            const targetDir = path.join(stagingDir, file.type === 'manifest' ? 'manifests' : file.type);
            await this.ensureDirectory(targetDir);

            const targetPath = path.join(targetDir, file.name);
            await fs.writeFile(targetPath, file.content, 'utf8');

            processedFiles++;
            const progress = Math.floor((processedFiles / totalFiles) * 100);
            await this.reportProgress(progress, 100, `Staging files... (${processedFiles}/${totalFiles})`);
        }
    }

    /**
     * Generate backup metadata
     * @private
     */
    generateMetadata(config, classification, plan, files) {
        return {
            version: '1.0.0',
            created: new Date().toISOString(),
            platform: this.platform,
            projectName: config.projectName || 'ai-workflow',
            backupType: 'ai-workflow-uninstaller',
            fileCount: files.length,
            archiveType: this.determineArchiveType(),
            options: config.options || [],
            checksum: this.generateContentChecksum(files),
            instructions: {
                restore: 'See RESTORE-INSTRUCTIONS.txt for detailed restoration steps',
                contact: 'Refer to AI Workflow documentation for support'
            }
        };
    }

    /**
     * Write metadata to staging directory
     * @private
     */
    async writeMetadata(stagingDir, metadata) {
        const metadataPath = path.join(stagingDir, 'metadata.json');
        await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
    }

    /**
     * Create restore instructions file
     * @private
     */
    async createRestoreInstructions(stagingDir, backupPath, metadata) {
        const instructions = `AI Workflow Uninstaller - Backup Restore Instructions
=====================================================

Backup Information:
- Created: ${metadata.created}
- Platform: ${metadata.platform.platform} (${metadata.platform.arch})
- Archive Type: ${metadata.archiveType}
- Project: ${metadata.projectName}

Contents:
- Installation manifests
- Generation manifests  
- Removal plan
- Configuration files (if selected)

Restoration Steps:
1. Extract this archive to a safe location
2. Review the manifests/ directory for installation records
3. Check plan/removal-plan.json for what would have been removed
4. Use the information to manually restore files if needed

IMPORTANT NOTES:
- This backup does NOT contain the actual workflow files
- This is a record of what was installed and planned for removal
- Manual restoration may be required based on your specific setup
- Always review the removal plan before attempting restoration

Files Included:
${metadata.fileCount} files backed up

For support, refer to AI Workflow documentation.

Generated by AI Workflow Uninstaller v1.0.0
Backup created: ${new Date().toLocaleString()}
`;

        const instructionsPath = path.join(stagingDir, 'RESTORE-INSTRUCTIONS.txt');
        await fs.writeFile(instructionsPath, instructions, 'utf8');
    }

    /**
     * Utility methods
     */

    async ensureDirectory(dirPath) {
        try {
            await fs.mkdir(dirPath, { recursive: true });
        } catch (error) {
            if (error.code !== 'EEXIST') {
                throw new Error(`Failed to create directory ${dirPath}: ${error.message}`);
            }
        }
    }

    async checkDiskSpace(targetDir) {
        // Basic disk space check - implement platform-specific logic if needed
        try {
            const stats = await fs.stat(targetDir);
            // For now, just verify the directory is writable
            await fs.access(targetDir, fs.constants.W_OK);
        } catch (error) {
            throw new Error(`Insufficient permissions or disk space in ${targetDir}: ${error.message}`);
        }
    }

    async cleanupDirectory(dirPath) {
        try {
            await fs.rm(dirPath, { recursive: true, force: true });
        } catch (error) {
            console.warn(`Warning: Failed to cleanup temporary directory ${dirPath}: ${error.message}`);
        }
    }

    async getFileSize(filePath) {
        try {
            const stats = await fs.stat(filePath);
            return stats.size;
        } catch (error) {
            return 0;
        }
    }

    async countFilesInDirectory(dirPath) {
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            let count = 0;
            
            for (const entry of entries) {
                if (entry.isFile()) {
                    count++;
                } else if (entry.isDirectory()) {
                    const subPath = path.join(dirPath, entry.name);
                    count += await this.countFilesInDirectory(subPath);
                }
            }
            
            return count;
        } catch (error) {
            return 0;
        }
    }

    generateContentChecksum(files) {
        const content = files.map(f => f.content).join('');
        return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
    }

    async verifyTarGzIntegrity(archivePath) {
        if (tar) {
            // Use tar module to list contents
            await tar.list({ file: archivePath, onentry: () => {} });
        } else {
            // Use system tar command
            await execAsync(`tar -tzf "${archivePath}" > /dev/null`);
        }
    }

    async verifyZipIntegrity(archivePath) {
        if (archiver) {
            // Basic file size check for now
            const stats = await fs.stat(archivePath);
            if (stats.size < 100) {
                throw new Error('Archive appears to be too small');
            }
        } else {
            // Use system unzip command to test
            if (os.platform() === 'win32') {
                // Use PowerShell on Windows
                await execAsync(`powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::OpenRead('${archivePath}').Dispose()"`);
            } else {
                // Use unzip command on Unix-like systems
                await execAsync(`unzip -t "${archivePath}" > /dev/null`);
            }
        }
    }

    async reportProgress(current, total, message) {
        if (this.ui && this.ui.showProgress) {
            this.ui.showProgress(current, total, message);
        } else if (this.progressCallback) {
            this.progressCallback(current, total, message);
        }
        
        // Small delay for visual feedback
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    /**
     * Set progress callback for non-UI usage
     * @param {Function} callback - Progress callback function
     */
    setProgressCallback(callback) {
        this.progressCallback = callback;
    }
}

module.exports = { BackupManager };