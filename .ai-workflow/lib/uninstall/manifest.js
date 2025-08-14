/**
 * Manifest Management Module - Phase 1 Enhanced Version
 * Handles loading and writing of installation and generation manifests
 * with deduplication, versioning, and atomic operations
 */

const fs = require('fs').promises;
const path = require('path');

class ManifestManager {
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
        this.installManifestPath = path.join(projectRoot, '.ai-workflow', 'installation-record.json');
        this.generationManifestPath = path.join(projectRoot, '.ai-workflow', 'generation-record.json');
        this.lockFile = path.join(projectRoot, '.ai-workflow', '.manifest.lock');
    }

    /**
     * Load all manifests
     */
    async loadManifests(projectRoot) {
        const manager = new ManifestManager(projectRoot);
        const installation = await manager.loadInstallationManifest();
        const generation = await manager.loadGenerationManifest();
        
        return {
            installation,
            generation,
            hasManifests: !!(installation || generation)
        };
    }

    /**
     * Load installation manifest
     */
    async loadInstallationManifest() {
        try {
            const data = await fs.readFile(this.installManifestPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log('⚠️  No installation manifest found. Will use heuristic fallback.');
                return null;
            }
            throw error;
        }
    }

    /**
     * Load generation manifest
     */
    async loadGenerationManifest() {
        try {
            const data = await fs.readFile(this.generationManifestPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log('⚠️  No generation manifest found. Will use heuristic fallback.');
                return null;
            }
            throw error;
        }
    }

    /**
     * Ensure .ai-workflow directory exists
     */
    async ensureAiWorkflowDirectory() {
        const aiWorkflowDir = path.dirname(this.installManifestPath);
        try {
            await fs.mkdir(aiWorkflowDir, { recursive: true });
        } catch (error) {
            // Directory might already exist, ignore EEXIST errors
            if (error.code !== 'EEXIST') {
                throw error;
            }
        }
    }

    /**
     * Atomic write with lock file
     */
    async atomicWrite(filePath, data) {
        // Ensure the directory exists before writing
        await this.ensureAiWorkflowDirectory();
        
        const tempPath = `${filePath}.tmp`;
        await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf8');
        await fs.rename(tempPath, filePath);
    }

    /**
     * Write installation manifest (for installer integration)
     */
    async writeInstallationManifest(items, version = '3.0.0') {
        // Add timestamps to items if not present
        const timestampedItems = items.map(item => ({
            ...item,
            timestamp: item.timestamp || new Date().toISOString(),
            version: version
        }));

        const manifest = {
            installerVersion: version,
            installedAt: new Date().toISOString(),
            items: timestampedItems
        };

        // If manifest exists, merge items with deduplication
        let existingManifest = await this.loadInstallationManifest();
        if (existingManifest) {
            // Create a map for efficient deduplication
            const itemMap = new Map();
            
            // Add existing items
            existingManifest.items.forEach(item => {
                itemMap.set(item.path, item);
            });
            
            // Add new items (will overwrite if path exists)
            timestampedItems.forEach(item => {
                itemMap.set(item.path, {
                    ...item,
                    timestamp: new Date().toISOString(),
                    version: version
                });
            });
            
            manifest.items = Array.from(itemMap.values());
            manifest.installerVersion = version;
            manifest.lastUpdated = new Date().toISOString();
            manifest.installedAt = existingManifest.installedAt;
        }

        await this.atomicWrite(this.installManifestPath, manifest);
        
        return manifest;
    }

    /**
     * Write generation manifest (for doc generation integration)
     */
    async writeGenerationManifest(updates) {
        let manifest = {
            generatedAt: new Date().toISOString(),
            updates: []
        };

        // If manifest exists, merge with deduplication based on path and timestamp
        let existingManifest = await this.loadGenerationManifest();
        if (existingManifest) {
            // Use map for deduplication, keeping latest update per path
            const updateMap = new Map();
            
            // Add existing updates
            if (existingManifest.updates) {
                existingManifest.updates.forEach(update => {
                    const key = update.path;
                    updateMap.set(key, update);
                });
            }
            
            // Add new updates (will overwrite if path exists)
            updates.forEach(update => {
                const key = update.path;
                updateMap.set(key, {
                    ...update,
                    timestamp: new Date().toISOString()
                });
            });
            
            manifest.updates = Array.from(updateMap.values());
            manifest.generatedAt = existingManifest.generatedAt || new Date().toISOString();
            manifest.lastUpdated = new Date().toISOString();
        } else {
            manifest.updates = updates;
        }

        await this.atomicWrite(this.generationManifestPath, manifest);
        
        return manifest;
    }

    /**
     * Add item to installation manifest
     */
    async addInstalledItem(path, origin) {
        const item = {
            path,
            origin, // 'installed_system_asset' | 'symlink_executable' | 'ephemeral_cache_log'
            timestamp: new Date().toISOString()
        };

        let manifest = await this.loadInstallationManifest();
        if (!manifest) {
            manifest = {
                installerVersion: '3.0.0',
                installedAt: new Date().toISOString(),
                items: []
            };
        }

        // Check if item already exists and update it, or add new
        const existingIndex = manifest.items.findIndex(i => i.path === path);
        if (existingIndex >= 0) {
            // Update existing item with new timestamp
            manifest.items[existingIndex] = { ...manifest.items[existingIndex], ...item };
        } else {
            // Add new item
            manifest.items.push(item);
        }

        await this.atomicWrite(this.installManifestPath, manifest);
        return manifest;
    }

    /**
     * Add item to generation manifest
     */
    async addGeneratedItem(path, strategy, backupPath = null) {
        const item = {
            path,
            origin: 'generated_document',
            strategy, // 'merge' | 'intelligent' | 'replace'
            backup: backupPath,
            timestamp: new Date().toISOString()
        };

        let manifest = await this.loadGenerationManifest();
        if (!manifest) {
            manifest = { 
                generatedAt: new Date().toISOString(),
                updates: [] 
            };
        }

        // Check for existing item and update or add
        const existingIndex = manifest.updates.findIndex(u => u.path === path);
        if (existingIndex >= 0) {
            manifest.updates[existingIndex] = { ...manifest.updates[existingIndex], ...item };
        } else {
            manifest.updates.push(item);
        }

        await this.atomicWrite(this.generationManifestPath, manifest);
        return manifest;
    }
}

// Export functions for use in other modules
module.exports = {
    loadManifests: (projectRoot) => {
        const manager = new ManifestManager(projectRoot);
        return manager.loadManifests(projectRoot);
    },
    ManifestManager
};