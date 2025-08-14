/**
 * Manifest Management Module
 * Handles loading and writing of installation and generation manifests
 */

const fs = require('fs').promises;
const path = require('path');

class ManifestManager {
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
        this.installManifestPath = path.join(projectRoot, '.ai-workflow', 'installation-record.json');
        this.generationManifestPath = path.join(projectRoot, '.ai-workflow', 'generation-record.json');
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
     * Write installation manifest (for installer integration)
     */
    async writeInstallationManifest(items, version = '3.0.0') {
        const manifest = {
            installerVersion: version,
            installedAt: new Date().toISOString(),
            items: items
        };

        // If manifest exists, merge items (avoid duplicates)
        let existingManifest = await this.loadInstallationManifest();
        if (existingManifest) {
            const existingPaths = new Set(existingManifest.items.map(i => i.path));
            const newItems = items.filter(item => !existingPaths.has(item.path));
            manifest.items = [...existingManifest.items, ...newItems];
        }

        await fs.writeFile(
            this.installManifestPath,
            JSON.stringify(manifest, null, 2),
            'utf8'
        );
        
        return manifest;
    }

    /**
     * Write generation manifest (for doc generation integration)
     */
    async writeGenerationManifest(updates) {
        let manifest = {
            updates: []
        };

        // If manifest exists, append updates
        let existingManifest = await this.loadGenerationManifest();
        if (existingManifest) {
            manifest.updates = [...existingManifest.updates, ...updates];
        } else {
            manifest.updates = updates;
        }

        await fs.writeFile(
            this.generationManifestPath,
            JSON.stringify(manifest, null, 2),
            'utf8'
        );
        
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

        // Check if item already exists
        const exists = manifest.items.find(i => i.path === path);
        if (!exists) {
            manifest.items.push(item);
            await fs.writeFile(
                this.installManifestPath,
                JSON.stringify(manifest, null, 2),
                'utf8'
            );
        }

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
            manifest = { updates: [] };
        }

        manifest.updates.push(item);
        await fs.writeFile(
            this.generationManifestPath,
            JSON.stringify(manifest, null, 2),
            'utf8'
        );

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