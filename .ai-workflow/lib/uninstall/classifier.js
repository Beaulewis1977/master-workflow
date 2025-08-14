/**
 * File Classification Module - Phase 2 Enhanced Version
 * Categorizes files into remove/keep/unknown based on manifests and heuristics
 * with comprehensive pattern matching, git protection, and detailed logging
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class FileClassifier {
    constructor(projectRoot, manifests) {
        this.projectRoot = projectRoot;
        this.manifests = manifests;
        this.classification = {
            remove: [],
            keep: [],
            unknown: []
        };
        
        // Enhanced heuristic patterns based on UNINSTALLER-PLAN.md
        this.defaultRemovePatterns = [
            '.ai-workflow/**',
            'ai-workflow',  // symlink in project root
            '.ai-workflow/logs/**',
            '.ai-workflow/supervisor/**',
            '.ai-workflow/tmux-scripts/**',
            '.ai-workflow/cache/**',
            '.ai-workflow/tmp/**'
        ];
        
        this.defaultKeepPatterns = [
            '.claude/CLAUDE.md',
            '.agent-os/**',
            '.ai-dev/**',
            'src/**',
            'lib/**',  // User libraries (except our uninstall lib)
            'test/**',
            'tests/**',
            'docs/**',
            '*.md',  // Project documentation
            'package.json',
            'package-lock.json',
            'yarn.lock',
            '.gitignore',
            'README*',
            'LICENSE*'
        ];
        
        this.unknownPatterns = [
            '.claude/agents/**',
            '.claude/commands/**',
            '.claude-flow/memory/**',
            '.claude-flow/hive-config.json'
        ];
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
     * Classify using manifests (primary method) - Enhanced Phase 2 Implementation
     */
    async classifyWithManifests() {
        console.log('📋 Processing classification with manifests...');
        
        // Process installation manifest with comprehensive validation
        if (this.manifests.installation && this.manifests.installation.items) {
            console.log(`📦 Processing ${this.manifests.installation.items.length} installation manifest items...`);
            
            for (const item of this.manifests.installation.items) {
                // Validate file existence before classification
                const exists = await this.pathExists(path.join(this.projectRoot, item.path));
                
                if (item.origin === 'installed_system_asset' || 
                    item.origin === 'symlink_executable' ||
                    item.origin === 'ephemeral_cache_log') {
                    
                    // Apply git protection check
                    const gitProtected = await this.isGitTracked(item.path);
                    
                    if (gitProtected && item.origin !== 'installed_system_asset') {
                        console.log(`⚠️  Git-tracked file requires review: ${item.path}`);
                        this.classification.unknown.push({
                            path: item.path,
                            origin: item.origin,
                            source: 'manifest',
                            reason: 'git_tracked_file',
                            exists
                        });
                    } else {
                        console.log(`🗑️  Marked for removal (${item.origin}): ${item.path}`);
                        this.classification.remove.push({
                            path: item.path,
                            origin: item.origin,
                            source: 'manifest',
                            exists
                        });
                    }
                } else {
                    // Non-removable items are kept
                    console.log(`✅ Keeping (${item.origin}): ${item.path}`);
                    this.classification.keep.push({
                        path: item.path,
                        origin: item.origin,
                        source: 'manifest',
                        exists
                    });
                }
            }
        }

        // Process generation manifest - these are kept by default with user modification checks
        if (this.manifests.generation && this.manifests.generation.updates) {
            console.log(`📝 Processing ${this.manifests.generation.updates.length} generation manifest items...`);
            
            for (const item of this.manifests.generation.updates) {
                const exists = await this.pathExists(path.join(this.projectRoot, item.path));
                
                // Check if file has been modified since generation
                const isModified = await this.checkIfUserModified(item.path);
                
                console.log(`✅ Keeping generated file (${item.strategy || 'unknown'}): ${item.path}`);
                this.classification.keep.push({
                    path: item.path,
                    origin: item.origin || 'generated_document',
                    source: 'manifest',
                    strategy: item.strategy,
                    userModified: isModified,
                    exists
                });
            }
        }

        // Apply heuristics for files not in manifests
        await this.applyHeuristicsForUnmanifested();
        
        console.log('📋 Manifest-based classification complete.');
    }

    /**
     * Classify using heuristics (fallback method) - Enhanced Phase 2 Implementation
     */
    async classifyWithHeuristics() {
        console.log('📦 Using enhanced heuristic classification (no manifests found)');
        
        // Process removal patterns with git protection
        console.log('🗑️  Processing default removal patterns...');
        for (const pattern of this.defaultRemovePatterns) {
            const files = await this.findFiles(pattern);
            for (const file of files) {
                if (!this.isAlreadyClassified(file)) {
                    const isGitTracked = await this.isGitTracked(file);
                    const exists = await this.pathExists(path.join(this.projectRoot, file));
                    
                    if (isGitTracked) {
                        console.log(`⚠️  Git-tracked file requires review: ${file}`);
                        this.classification.unknown.push({
                            path: file,
                            origin: 'heuristic',
                            source: 'default_removal_git_protected',
                            reason: 'Git-tracked file in removal pattern',
                            exists
                        });
                    } else {
                        console.log(`🗑️  Marked for removal: ${file}`);
                        this.classification.remove.push({
                            path: file,
                            origin: 'heuristic',
                            source: 'default_removal',
                            exists
                        });
                    }
                }
            }
        }

        // Process keep patterns
        console.log('✅ Processing default keep patterns...');
        for (const pattern of this.defaultKeepPatterns) {
            const files = await this.findFiles(pattern);
            for (const file of files) {
                if (!this.isAlreadyClassified(file)) {
                    const exists = await this.pathExists(path.join(this.projectRoot, file));
                    console.log(`✅ Keeping: ${file}`);
                    this.classification.keep.push({
                        path: file,
                        origin: 'heuristic',
                        source: 'default_keep',
                        exists
                    });
                }
            }
        }

        // Process unknown patterns with enhanced user modification detection
        console.log('❓ Processing patterns requiring review...');
        for (const pattern of this.unknownPatterns) {
            const files = await this.findFiles(pattern);
            for (const file of files) {
                if (!this.isAlreadyClassified(file)) {
                    const isModified = await this.checkIfUserModified(file);
                    const isGitTracked = await this.isGitTracked(file);
                    const exists = await this.pathExists(path.join(this.projectRoot, file));
                    
                    if (isModified || isGitTracked) {
                        console.log(`❓ Requires review (modified=${isModified}, git=${isGitTracked}): ${file}`);
                        this.classification.unknown.push({
                            path: file,
                            origin: 'heuristic',
                            source: 'requires_review',
                            reason: isModified ? 'User modifications detected' : 'Git-tracked file',
                            userModified: isModified,
                            gitTracked: isGitTracked,
                            exists
                        });
                    } else {
                        console.log(`🗑️  Conditional removal (unmodified): ${file}`);
                        this.classification.remove.push({
                            path: file,
                            origin: 'heuristic',
                            source: 'conditional_removal',
                            exists
                        });
                    }
                }
            }
        }
        
        console.log('📦 Heuristic classification complete.');
    }

    /**
     * Apply heuristics for files not in manifests - Enhanced Phase 2 Implementation
     */
    async applyHeuristicsForUnmanifested() {
        console.log('🧮 Applying heuristics for unmanifested files...');
        
        // Get all files in relevant directories that aren't in manifests
        const manifestedPaths = new Set([
            ...(this.manifests.installation?.items || []).map(i => i.path),
            ...(this.manifests.generation?.updates || []).map(i => i.path)
        ]);
        
        console.log(`📝 Found ${manifestedPaths.size} manifested paths to exclude from heuristics`);
        
        // Scan .ai-workflow directory for unmanifested files
        const aiWorkflowFiles = await this.findFiles('.ai-workflow/**');
        
        for (const file of aiWorkflowFiles) {
            if (!manifestedPaths.has(file) && !this.isAlreadyClassified(file)) {
                // Enhanced classification logic
                const isSystem = this.isSystemFile(file);
                const isGitTracked = await this.isGitTracked(file);
                const exists = await this.pathExists(path.join(this.projectRoot, file));
                
                if (isSystem && !isGitTracked) {
                    console.log(`🗑️  Unmanifested system file marked for removal: ${file}`);
                    this.classification.remove.push({
                        path: file,
                        origin: 'heuristic',
                        source: 'unmanifested_system',
                        exists
                    });
                } else if (isGitTracked) {
                    console.log(`⚠️  Git-tracked unmanifested file requires review: ${file}`);
                    this.classification.unknown.push({
                        path: file,
                        origin: 'heuristic',
                        source: 'unmanifested_git_tracked',
                        reason: 'git_protection',
                        exists
                    });
                } else {
                    console.log(`❓ Unknown unmanifested file requires review: ${file}`);
                    this.classification.unknown.push({
                        path: file,
                        origin: 'heuristic',
                        source: 'unmanifested_unknown',
                        exists
                    });
                }
            }
        }
        
        // Apply additional heuristic patterns for project-wide scanning
        await this.applyProjectWideHeuristics(manifestedPaths);
        
        console.log('🧮 Heuristic classification complete.');
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
     * Apply project-wide heuristic patterns for files not covered by directory scanning
     */
    async applyProjectWideHeuristics(manifestedPaths) {
        console.log('🔍 Applying project-wide heuristic patterns...');
        
        // Check for common workflow artifacts that might be outside .ai-workflow
        const projectWidePatterns = [
            'ai-workflow',  // Symlink in project root
            '.claude-flow/hive-config.json',
            '.claude/agents/**',
            '.claude/commands/**'
        ];
        
        for (const pattern of projectWidePatterns) {
            const files = await this.findFiles(pattern);
            for (const file of files) {
                if (!manifestedPaths.has(file) && !this.isAlreadyClassified(file)) {
                    const isGitTracked = await this.isGitTracked(file);
                    const isModified = await this.checkIfUserModified(file);
                    const exists = await this.pathExists(path.join(this.projectRoot, file));
                    
                    if (pattern === 'ai-workflow') {
                        // Symlink should be removed unless git-tracked
                        if (isGitTracked) {
                            console.log(`⚠️  Git-tracked symlink requires review: ${file}`);
                            this.classification.unknown.push({
                                path: file,
                                origin: 'heuristic',
                                source: 'symlink_git_tracked',
                                reason: 'Symlink is git-tracked',
                                exists
                            });
                        } else {
                            console.log(`🗑️  Removing symlink: ${file}`);
                            this.classification.remove.push({
                                path: file,
                                origin: 'heuristic',
                                source: 'symlink_removal',
                                exists
                            });
                        }
                    } else if (isModified || isGitTracked) {
                        console.log(`❓ Project-wide file requires review: ${file}`);
                        this.classification.unknown.push({
                            path: file,
                            origin: 'heuristic',
                            source: 'project_wide_review',
                            reason: isModified ? 'User modifications detected' : 'Git-tracked file',
                            userModified: isModified,
                            gitTracked: isGitTracked,
                            exists
                        });
                    } else {
                        console.log(`🗑️  Project-wide file marked for removal: ${file}`);
                        this.classification.remove.push({
                            path: file,
                            origin: 'heuristic',
                            source: 'project_wide_removal',
                            exists
                        });
                    }
                }
            }
        }
    }

    /**
     * Check if a file is git-tracked using simple git commands
     */
    async isGitTracked(filePath) {
        try {
            const fullPath = path.join(this.projectRoot, filePath);
            const { stdout } = await execAsync(`git ls-files --error-unmatch "${fullPath}"`, {
                cwd: this.projectRoot,
                stdio: 'pipe'
            });
            return stdout.trim().length > 0;
        } catch (error) {
            // File is not git-tracked or git is not available
            return false;
        }
    }

    /**
     * Check if a file has already been classified
     */
    isAlreadyClassified(filePath) {
        return this.classification.remove.some(item => item.path === filePath) ||
               this.classification.keep.some(item => item.path === filePath) ||
               this.classification.unknown.some(item => item.path === filePath);
    }

    /**
     * Enhanced pattern matching using minimatch-like logic
     */
    async findFiles(pattern) {
        try {
            const results = [];
            
            // Handle different pattern types
            if (pattern === '.ai-workflow/**') {
                const aiWorkflowPath = path.join(this.projectRoot, '.ai-workflow');
                if (await this.pathExists(aiWorkflowPath)) {
                    results.push('.ai-workflow');
                    const subItems = await this.getAllFiles(aiWorkflowPath, '.ai-workflow');
                    results.push(...subItems);
                }
            } else if (pattern === 'ai-workflow') {
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
                // Enhanced glob-like pattern matching
                const baseDir = pattern.split('*')[0];
                if (baseDir && await this.pathExists(path.join(this.projectRoot, baseDir))) {
                    const matchedFiles = await this.globMatch(pattern);
                    results.push(...matchedFiles);
                }
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
     * Simple glob-like matching for common patterns
     */
    async globMatch(pattern) {
        const results = [];
        try {
            // Convert pattern to regex for basic matching
            const regexPattern = pattern
                .replace(/\*\*/g, '.*')
                .replace(/\*/g, '[^/]*')
                .replace(/\./g, '\\.');
            
            const regex = new RegExp(`^${regexPattern}$`);
            
            // Scan the project root for matches
            const allFiles = await this.getAllFiles(this.projectRoot, '');
            for (const file of allFiles) {
                if (regex.test(file)) {
                    results.push(file);
                }
            }
        } catch (error) {
            console.warn(`Warning: Glob matching failed for pattern ${pattern}:`, error.message);
        }
        
        return results;
    }

    /**
     * Enhanced user modification check with better heuristics
     */
    async checkIfUserModified(filePath) {
        try {
            const fullPath = path.join(this.projectRoot, filePath);
            
            // Check if file exists first
            if (!await this.pathExists(fullPath)) {
                return false;
            }
            
            // Check if it's a directory
            const stats = await fs.stat(fullPath);
            if (stats.isDirectory()) {
                // For directories, check if they contain user-modified files or are git-tracked
                const isGitTracked = await this.isGitTracked(filePath);
                return isGitTracked; // Conservative: consider git-tracked directories as user-modified
            }
            
            const content = await fs.readFile(fullPath, 'utf8');
            
            // Enhanced system-generated markers
            const systemMarkers = [
                'AUTO-GENERATED',
                'DO NOT EDIT',
                'Generated by AI Workflow',
                '@generated',
                'This file is auto-generated',
                '// AUTO_GENERATED',
                '<!-- AUTO-GENERATED -->',
                '# AUTO-GENERATED'
            ];
            
            // Check for system markers (indicates not user-modified)
            for (const marker of systemMarkers) {
                if (content.includes(marker)) {
                    return false;
                }
            }
            
            // Check git status for modifications
            try {
                const { stdout } = await execAsync(`git status --porcelain "${fullPath}"`, {
                    cwd: this.projectRoot,
                    stdio: 'pipe'
                });
                
                // If file shows up in git status, it's been modified
                if (stdout.trim().length > 0) {
                    return true;
                }
            } catch (gitError) {
                // Git not available or file not tracked
            }
            
            // Check file timestamps and patterns for user edits
            const now = Date.now();
            const ageMinutes = (now - stats.mtime.getTime()) / (1000 * 60);
            
            // If file is very recent (< 5 minutes) and small, likely system-generated
            if (ageMinutes < 5 && stats.size < 1000) {
                return false;
            }
            
            // If no clear markers, assume user modified (conservative approach)
            return true;
        } catch (error) {
            console.warn(`Warning: Could not check modification status for ${filePath}:`, error.message);
            // If we can't read it, be conservative and mark as user-modified
            return true;
        }
    }

    /**
     * Enhanced system file detection
     */
    isSystemFile(file) {
        const systemExtensions = ['.log', '.pid', '.lock', '.tmp', '.cache', '.sock'];
        const systemDirs = ['logs', 'tmp', 'cache', 'supervisor', 'tmux-scripts', 'node_modules'];
        const systemFiles = ['package-lock.json', '.DS_Store', 'Thumbs.db'];
        
        // Check extension
        const ext = path.extname(file);
        if (systemExtensions.includes(ext)) {
            return true;
        }
        
        // Check filename
        const basename = path.basename(file);
        if (systemFiles.includes(basename)) {
            return true;
        }
        
        // Check if in system directory
        const parts = file.split(path.sep);
        for (const dir of systemDirs) {
            if (parts.includes(dir)) {
                return true;
            }
        }
        
        // Check for common log/temp patterns
        if (basename.match(/\.(log|tmp|temp|cache)$/i) || 
            basename.match(/^(temp|tmp|cache)-/i) ||
            basename.match(/\.(pid|lock)$/)) {
            return true;
        }
        
        return false;
    }

    /**
     * Get enhanced classification summary with detailed statistics
     */
    getSummary() {
        const summary = {
            remove: this.classification.remove.length,
            keep: this.classification.keep.length,
            unknown: this.classification.unknown.length,
            total: this.classification.remove.length + 
                   this.classification.keep.length + 
                   this.classification.unknown.length
        };
        
        // Add source breakdown
        summary.breakdown = {
            manifest: {
                remove: this.classification.remove.filter(i => i.source === 'manifest').length,
                keep: this.classification.keep.filter(i => i.source === 'manifest').length,
                unknown: this.classification.unknown.filter(i => i.source === 'manifest').length
            },
            heuristic: {
                remove: this.classification.remove.filter(i => i.source !== 'manifest').length,
                keep: this.classification.keep.filter(i => i.source !== 'manifest').length,
                unknown: this.classification.unknown.filter(i => i.source !== 'manifest').length
            }
        };
        
        // Add git protection stats
        summary.gitProtected = {
            total: [...this.classification.remove, ...this.classification.keep, ...this.classification.unknown]
                .filter(i => i.gitTracked).length,
            requiresReview: this.classification.unknown.filter(i => i.reason?.includes('git')).length
        };
        
        return summary;
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