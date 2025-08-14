/**
 * File Classification Module
 * Categorizes files into remove/keep/unknown based on manifests and heuristics
 */

const fs = require('fs').promises;
const path = require('path');

class FileClassifier {
    constructor(projectRoot, manifests) {
        this.projectRoot = projectRoot;
        this.manifests = manifests;
        this.classification = {
            remove: [],
            keep: [],
            unknown: []
        };
    }

    /**
     * Main classification entry point
     */
    async classify() {
        if (this.manifests.hasManifests) {
            await this.classifyWithManifests();
        } else {
            await this.classifyWithHeuristics();
        }
        
        return this.classification;
    }

    /**
     * Classify using manifests (primary method)
     */
    async classifyWithManifests() {
        // Process installation manifest
        if (this.manifests.installation) {
            for (const item of this.manifests.installation.items) {
                if (item.origin === 'installed_system_asset' || 
                    item.origin === 'symlink_executable' ||
                    item.origin === 'ephemeral_cache_log') {
                    this.classification.remove.push({
                        path: item.path,
                        origin: item.origin,
                        source: 'manifest'
                    });
                }
            }
        }

        // Process generation manifest - these are kept by default
        if (this.manifests.generation) {
            for (const item of this.manifests.generation.updates) {
                this.classification.keep.push({
                    path: item.path,
                    origin: item.origin,
                    source: 'manifest',
                    strategy: item.strategy
                });
            }
        }

        // Apply heuristics for files not in manifests
        await this.applyHeuristicsForUnmanifested();
    }

    /**
     * Classify using heuristics (fallback method)
     */
    async classifyWithHeuristics() {
        console.log('📦 Using heuristic classification (no manifests found)');
        
        // Default removals - system files
        const removePatterns = [
            '.ai-workflow/**',
            'ai-workflow',  // symlink in project root
            '.ai-workflow/logs/**',
            '.ai-workflow/supervisor/**',
            '.ai-workflow/tmux-scripts/**'
        ];

        // Default keeps - generated documents
        const keepPatterns = [
            '.claude/CLAUDE.md',
            '.agent-os/**',
            '.ai-dev/**',
            '*.md',  // Most markdown docs outside system folders
            'src/**',  // User code
            'lib/**',  // User libraries (except our uninstall lib)
            'test/**'  // User tests
        ];

        // Patterns requiring user confirmation
        const unknownPatterns = [
            '.claude/agents/**',
            '.claude/commands/**',
            '.claude-flow/memory/**',
            '.claude-flow/hive-config.json'
        ];

        // Process removal patterns
        for (const pattern of removePatterns) {
            const files = await this.findFiles(pattern);
            for (const file of files) {
                // Skip if it's in the keep list
                if (!this.isInKeepList(file)) {
                    this.classification.remove.push({
                        path: file,
                        origin: 'heuristic',
                        source: 'default_removal'
                    });
                }
            }
        }

        // Process keep patterns
        for (const pattern of keepPatterns) {
            const files = await this.findFiles(pattern);
            for (const file of files) {
                this.classification.keep.push({
                    path: file,
                    origin: 'heuristic',
                    source: 'default_keep'
                });
            }
        }

        // Process unknown patterns
        for (const pattern of unknownPatterns) {
            const files = await this.findFiles(pattern);
            for (const file of files) {
                // Check if file has been modified by user
                const isModified = await this.checkIfUserModified(file);
                if (isModified) {
                    this.classification.unknown.push({
                        path: file,
                        origin: 'heuristic',
                        source: 'requires_review',
                        reason: 'User modifications detected'
                    });
                } else {
                    this.classification.remove.push({
                        path: file,
                        origin: 'heuristic',
                        source: 'conditional_removal'
                    });
                }
            }
        }
    }

    /**
     * Apply heuristics for files not in manifests
     */
    async applyHeuristicsForUnmanifested() {
        // Get all files in .ai-workflow that aren't in manifests
        const aiWorkflowFiles = await this.findFiles('.ai-workflow/**');
        const manifestedPaths = new Set([
            ...(this.manifests.installation?.items || []).map(i => i.path),
            ...(this.manifests.generation?.updates || []).map(i => i.path)
        ]);

        for (const file of aiWorkflowFiles) {
            if (!manifestedPaths.has(file)) {
                // Check if it's a known system file type
                if (this.isSystemFile(file)) {
                    this.classification.remove.push({
                        path: file,
                        origin: 'heuristic',
                        source: 'unmanifested_system'
                    });
                } else {
                    this.classification.unknown.push({
                        path: file,
                        origin: 'heuristic',
                        source: 'unmanifested_unknown'
                    });
                }
            }
        }
    }

    /**
     * Find files matching a simple pattern (simplified glob replacement)
     */
    async findFiles(pattern) {
        try {
            // Simple pattern matching for Phase 0
            // Full glob support will be added in a later phase
            const results = [];
            
            // Handle specific patterns for Phase 0
            if (pattern === '.ai-workflow/**') {
                // Check if .ai-workflow directory exists
                const aiWorkflowPath = path.join(this.projectRoot, '.ai-workflow');
                if (await this.pathExists(aiWorkflowPath)) {
                    results.push('.ai-workflow');
                    // Add all subdirectories and files recursively
                    const subItems = await this.getAllFiles(aiWorkflowPath, '.ai-workflow');
                    results.push(...subItems);
                }
            } else if (pattern === 'ai-workflow') {
                // Check for the symlink/launcher
                const launcherPath = path.join(this.projectRoot, 'ai-workflow');
                if (await this.pathExists(launcherPath)) {
                    results.push('ai-workflow');
                }
            } else if (pattern.endsWith('/**')) {
                // Handle directory recursive patterns
                const dirPath = pattern.slice(0, -3);
                const fullPath = path.join(this.projectRoot, dirPath);
                if (await this.pathExists(fullPath)) {
                    results.push(dirPath);
                    const subItems = await this.getAllFiles(fullPath, dirPath);
                    results.push(...subItems);
                }
            } else if (pattern.includes('*')) {
                // Skip complex patterns for Phase 0
                console.log(`Complex pattern ${pattern} will be supported in a later phase`);
            } else {
                // Direct file/directory check
                const fullPath = path.join(this.projectRoot, pattern);
                if (await this.pathExists(fullPath)) {
                    results.push(pattern);
                }
            }
            
            return results;
        } catch (error) {
            console.warn(`Warning: Could not process pattern ${pattern}:`, error.message);
            return [];
        }
    }
    
    /**
     * Check if path exists
     */
    async pathExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
    
    /**
     * Get all files in a directory recursively
     */
    async getAllFiles(dirPath, prefix = '') {
        const results = [];
        try {
            const items = await fs.readdir(dirPath, { withFileTypes: true });
            
            for (const item of items) {
                const itemPath = path.join(dirPath, item.name);
                const relativePath = prefix ? path.join(prefix, item.name) : item.name;
                
                if (item.isDirectory()) {
                    results.push(relativePath);
                    const subItems = await this.getAllFiles(itemPath, relativePath);
                    results.push(...subItems);
                } else {
                    results.push(relativePath);
                }
            }
        } catch (error) {
            console.warn(`Could not read directory ${dirPath}:`, error.message);
        }
        
        return results;
    }

    /**
     * Check if file has been modified by user
     */
    async checkIfUserModified(filePath) {
        try {
            const fullPath = path.join(this.projectRoot, filePath);
            const content = await fs.readFile(fullPath, 'utf8');
            
            // Check for common system-generated markers
            const systemMarkers = [
                'AUTO-GENERATED',
                'DO NOT EDIT',
                'Generated by AI Workflow',
                '@generated'
            ];
            
            for (const marker of systemMarkers) {
                if (content.includes(marker)) {
                    return false;  // System generated, not user modified
                }
            }
            
            // If no markers, assume user modified
            return true;
        } catch (error) {
            // If we can't read it, be conservative and mark as unknown
            return true;
        }
    }

    /**
     * Check if file is in keep list
     */
    isInKeepList(file) {
        return this.classification.keep.some(item => item.path === file);
    }

    /**
     * Check if file is a known system file
     */
    isSystemFile(file) {
        const systemExtensions = ['.log', '.pid', '.lock', '.tmp', '.cache'];
        const systemDirs = ['logs', 'tmp', 'cache', 'supervisor', 'tmux-scripts'];
        
        // Check extension
        const ext = path.extname(file);
        if (systemExtensions.includes(ext)) {
            return true;
        }
        
        // Check if in system directory
        const parts = file.split(path.sep);
        for (const dir of systemDirs) {
            if (parts.includes(dir)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Get classification summary
     */
    getSummary() {
        return {
            remove: this.classification.remove.length,
            keep: this.classification.keep.length,
            unknown: this.classification.unknown.length,
            total: this.classification.remove.length + 
                   this.classification.keep.length + 
                   this.classification.unknown.length
        };
    }
}

// Export main function
module.exports = {
    classifyFiles: async (projectRoot, manifests) => {
        const classifier = new FileClassifier(projectRoot, manifests);
        return await classifier.classify();
    },
    FileClassifier
};