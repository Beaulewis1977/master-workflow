/**
 * Plan Builder Module
 * Creates a structured removal plan with file counts and sizes
 */

const fs = require('fs').promises;
const path = require('path');

class PlanBuilder {
    constructor(detectionData, config) {
        this.detectionData = detectionData;
        this.config = config;
        this.plan = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            mode: config.dryRun ? 'dry-run' : 'execute',
            summary: {
                remove: 0,
                keep: 0,
                unknown: 0,
                totalSize: 0
            },
            remove: [],
            keep: [],
            unknown: [],
            processes: [],
            notes: [],
            config: config
        };
    }

    /**
     * Build the complete removal plan
     */
    async build() {
        // Process classification
        await this.processClassification();
        
        // Process active processes
        this.processActiveProcesses();
        
        // Add configuration notes
        this.addConfigurationNotes();
        
        // Calculate sizes
        await this.calculateSizes();
        
        // Sort paths for safe removal order
        this.sortRemovalOrder();
        
        return this.plan;
    }

    /**
     * Process file classification
     */
    async processClassification() {
        const { classification } = this.detectionData;
        
        // Handle remove list
        for (const item of classification.remove || []) {
            // Apply config overrides
            if (this.shouldKeepFile(item)) {
                this.plan.keep.push(item);
            } else {
                this.plan.remove.push(item);
            }
        }
        
        // Handle keep list
        for (const item of classification.keep || []) {
            // Check if user wants to force remove generated docs
            if (!this.config.keepGenerated && item.origin === 'generated_document') {
                this.plan.remove.push(item);
            } else {
                this.plan.keep.push(item);
            }
        }
        
        // Handle unknown list
        for (const item of classification.unknown || []) {
            this.plan.unknown.push(item);
        }
        
        // Update summary
        this.plan.summary.remove = this.plan.remove.length;
        this.plan.summary.keep = this.plan.keep.length;
        this.plan.summary.unknown = this.plan.unknown.length;
    }

    /**
     * Process active processes that need to be stopped
     */
    processActiveProcesses() {
        const { processes } = this.detectionData;
        
        if (processes && processes.length > 0) {
            this.plan.processes = processes;
            this.plan.notes.push(`${processes.length} active processes will be stopped`);
        }
    }

    /**
     * Add configuration notes
     */
    addConfigurationNotes() {
        const notes = [];
        
        if (this.config.gitProtect) {
            notes.push('Git protection enabled - tracked files will be preserved');
        }
        
        if (this.config.keepGenerated) {
            notes.push('Generated documents will be preserved');
        }
        
        if (this.config.purgeCaches) {
            notes.push('Cache and log files will be removed');
        }
        
        if (this.config.backup) {
            notes.push(`Backup will be created at: ${this.config.backup}`);
        }
        
        if (this.config.dryRun) {
            notes.push('DRY RUN MODE - No actual changes will be made');
        }
        
        this.plan.notes = [...this.plan.notes, ...notes];
    }

    /**
     * Calculate file sizes with comprehensive size tracking
     */
    async calculateSizes() {
        console.log('📊 Calculating file and directory sizes...');
        
        let removeSize = 0;
        let keepSize = 0;
        let totalSize = 0;
        
        // Calculate size of files to be removed
        console.log(`   Analyzing ${this.plan.remove.length} items for removal...`);
        for (const item of this.plan.remove) {
            try {
                const fullPath = path.join(this.detectionData.projectRoot || process.cwd(), item.path);
                const size = await this.calculateItemSize(fullPath);
                item.size = size;
                removeSize += size;
                totalSize += size;
            } catch (error) {
                item.size = 0;  // File might not exist or be inaccessible
                console.log(`   ⚠️  Cannot access: ${item.path} - ${error.message}`);
            }
        }
        
        // Calculate size of files to be kept
        console.log(`   Analyzing ${this.plan.keep.length} items to keep...`);
        for (const item of this.plan.keep) {
            try {
                const fullPath = path.join(this.detectionData.projectRoot || process.cwd(), item.path);
                const size = await this.calculateItemSize(fullPath);
                item.size = size;
                keepSize += size;
                totalSize += size;
            } catch (error) {
                item.size = 0;
            }
        }
        
        // Calculate size of unknown items
        console.log(`   Analyzing ${this.plan.unknown.length} unknown items...`);
        for (const item of this.plan.unknown) {
            try {
                const fullPath = path.join(this.detectionData.projectRoot || process.cwd(), item.path);
                const size = await this.calculateItemSize(fullPath);
                item.size = size;
                totalSize += size;
            } catch (error) {
                item.size = 0;
            }
        }
        
        // Update summary with detailed size information
        this.plan.summary.totalSize = totalSize;
        this.plan.summary.removeSize = removeSize;
        this.plan.summary.keepSize = keepSize;
        this.plan.summary.totalSizeFormatted = this.formatSize(totalSize);
        this.plan.summary.removeSizeFormatted = this.formatSize(removeSize);
        this.plan.summary.keepSizeFormatted = this.formatSize(keepSize);
        
        console.log(`   ✅ Size calculation complete: ${this.formatSize(totalSize)} total, ${this.formatSize(removeSize)} to remove`);
    }

    /**
     * Calculate size of a file or directory recursively
     */
    async calculateItemSize(itemPath) {
        try {
            const stats = await fs.stat(itemPath);
            
            if (stats.isFile() || stats.isSymbolicLink()) {
                return stats.size;
            } else if (stats.isDirectory()) {
                return await this.calculateDirectorySize(itemPath);
            }
            
            return 0;
        } catch (error) {
            // Handle permission errors or missing files gracefully
            return 0;
        }
    }
    
    /**
     * Calculate total size of directory recursively
     */
    async calculateDirectorySize(dirPath) {
        let totalSize = 0;
        
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            
            for (const entry of entries) {
                const entryPath = path.join(dirPath, entry.name);
                
                if (entry.isFile() || entry.isSymbolicLink()) {
                    const stats = await fs.stat(entryPath);
                    totalSize += stats.size;
                } else if (entry.isDirectory()) {
                    totalSize += await this.calculateDirectorySize(entryPath);
                }
            }
        } catch (error) {
            // Handle permission errors gracefully
            return 0;
        }
        
        return totalSize;
    }
    
    /**
     * Check if path appears to be a file (has extension or known file patterns)
     */
    isFilePath(filePath) {
        const fileName = path.basename(filePath);
        
        // Has file extension
        if (path.extname(fileName)) {
            return true;
        }
        
        // Known file patterns without extensions
        const filePatterns = [
            'Dockerfile', 'Makefile', 'Gemfile', 'Rakefile',
            'package.json', 'composer.json', 'requirements.txt',
            'README', 'LICENSE', 'CHANGELOG', 'CONTRIBUTING'
        ];
        
        return filePatterns.some(pattern => fileName.toUpperCase().includes(pattern.toUpperCase()));
    }

    /**
     * Sort removal order for safe deletion
     */
    sortRemovalOrder() {
        console.log('🔄 Sorting removal order for safe deletion...');
        
        this.plan.remove.sort((a, b) => {
            // 1. Symlinks first (safest to remove)
            if (a.origin === 'symlink_executable' && b.origin !== 'symlink_executable') return -1;
            if (b.origin === 'symlink_executable' && a.origin !== 'symlink_executable') return 1;
            
            // 2. Files before directories (prevents orphaned files)
            const aIsFile = this.isFilePath(a.path);
            const bIsFile = this.isFilePath(b.path);
            if (aIsFile && !bIsFile) return -1;
            if (!aIsFile && bIsFile) return 1;
            
            // 3. Deeper paths first (child before parent)
            const depthA = a.path.split(path.sep).length;
            const depthB = b.path.split(path.sep).length;
            if (depthA !== depthB) {
                return depthB - depthA;
            }
            
            // 4. Alphabetical order for same depth
            return a.path.localeCompare(b.path);
        });
        
        console.log(`   ✅ Sorted ${this.plan.remove.length} items for safe removal`);
    }

    /**
     * Check if file should be kept based on config
     */
    shouldKeepFile(item) {
        // Check git protection
        if (this.config.gitProtect && item.gitTracked) {
            return true;
        }
        
        // Check if it's a generated doc and we want to keep them
        if (this.config.keepGenerated && item.origin === 'generated_document') {
            return true;
        }
        
        // Check if it's a cache/log and we don't want to purge
        if (!this.config.purgeCaches && 
            (item.origin === 'ephemeral_cache_log' || item.path.includes('/logs/') || item.path.includes('/cache/'))) {
            return true;
        }
        
        return false;
    }

    /**
     * Format size in bytes to human readable
     */
    formatSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }

    /**
     * Generate human-readable summary with enhanced statistics
     */
    generateSummaryText() {
        const lines = [
            '═'.repeat(80),
            '📊 AI WORKFLOW UNINSTALLER - EXECUTION PLAN',
            '═'.repeat(80),
            '',
            `🎯 Mode: ${this.plan.mode.toUpperCase()}`,
            `📅 Generated: ${new Date(this.plan.timestamp).toLocaleString()}`,
            `📂 Project: ${this.detectionData.projectRoot || process.cwd()}`,
            '',
            '📊 SUMMARY STATISTICS',
            '─'.repeat(40),
            `📁 Total items analyzed: ${this.plan.summary.remove + this.plan.summary.keep + this.plan.summary.unknown}`,
            `🗑️  Items to remove: ${this.plan.summary.remove} (${this.plan.summary.removeSizeFormatted || '0 B'})`,
            `🛡️  Items to keep: ${this.plan.summary.keep} (${this.plan.summary.keepSizeFormatted || '0 B'})`,
            `❓ Items needing review: ${this.plan.summary.unknown}`,
            `💾 Total disk space: ${this.plan.summary.totalSizeFormatted || '0 B'}`,
            `🆓 Space to be freed: ${this.plan.summary.removeSizeFormatted || '0 B'}`,
            ''
        ];
        
        if (this.plan.processes.length > 0) {
            lines.push('🔄 Processes to stop:');
            this.plan.processes.forEach(p => {
                lines.push(`  • ${p.name} (PID: ${p.pid})`);
            });
            lines.push('');
        }
        
        if (this.plan.notes.length > 0) {
            lines.push('📝 Notes:');
            this.plan.notes.forEach(note => {
                lines.push(`  • ${note}`);
            });
            lines.push('');
        }
        
        if (this.plan.unknown.length > 0) {
            lines.push('⚠️  Files requiring review:');
            this.plan.unknown.slice(0, 5).forEach(item => {
                lines.push(`  • ${item.path}`);
            });
            if (this.plan.unknown.length > 5) {
                lines.push(`  ... and ${this.plan.unknown.length - 5} more`);
            }
            lines.push('');
        }
        
        lines.push('─'.repeat(60));
        
        return lines.join('\n');
    }

    /**
     * Generate pretty-printed JSON plan for dry-run output
     */
    generateJsonOutput() {
        // Create a clean copy of the plan for JSON output
        const cleanPlan = {
            ...this.plan,
            // Sort arrays for consistent output
            remove: this.plan.remove.sort((a, b) => a.path.localeCompare(b.path)),
            keep: this.plan.keep.sort((a, b) => a.path.localeCompare(b.path)),
            unknown: this.plan.unknown.sort((a, b) => a.path.localeCompare(b.path))
        };

        return JSON.stringify(cleanPlan, null, 2);
    }

    /**
     * Generate detailed breakdown by category
     */
    generateCategoryBreakdown() {
        const breakdown = {
            byOrigin: {},
            byType: { files: 0, directories: 0, symlinks: 0 },
            sizeBuckets: { small: 0, medium: 0, large: 0 }
        };

        // Analyze all items
        [...this.plan.remove, ...this.plan.keep, ...this.plan.unknown].forEach(item => {
            // By origin
            const origin = item.origin || 'unknown';
            if (!breakdown.byOrigin[origin]) {
                breakdown.byOrigin[origin] = { count: 0, size: 0 };
            }
            breakdown.byOrigin[origin].count++;
            breakdown.byOrigin[origin].size += item.size || 0;

            // By type
            if (item.origin === 'symlink_executable') {
                breakdown.byType.symlinks++;
            } else if (this.isFilePath(item.path)) {
                breakdown.byType.files++;
            } else {
                breakdown.byType.directories++;
            }

            // By size buckets
            const size = item.size || 0;
            if (size < 1024 * 1024) { // < 1MB
                breakdown.sizeBuckets.small++;
            } else if (size < 1024 * 1024 * 100) { // < 100MB
                breakdown.sizeBuckets.medium++;
            } else {
                breakdown.sizeBuckets.large++;
            }
        });

        return breakdown;
    }
}

// Export main function
module.exports = {
    buildPlan: async (detectionData, config) => {
        console.log('🚀 Building uninstall execution plan...');
        
        const builder = new PlanBuilder(detectionData, config);
        const plan = await builder.build();
        
        // Print summary if not in JSON mode
        if (!config.jsonOutput) {
            console.log(builder.generateSummaryText());
            
            // Show category breakdown if verbose
            if (config.verbose) {
                const breakdown = builder.generateCategoryBreakdown();
                console.log('\n📈 DETAILED BREAKDOWN');
                console.log('─'.repeat(40));
                console.log('By Origin:');
                Object.entries(breakdown.byOrigin).forEach(([origin, data]) => {
                    console.log(`  • ${origin}: ${data.count} items (${builder.formatSize(data.size)})`);
                });
                console.log('\nBy Type:');
                console.log(`  • Files: ${breakdown.byType.files}`);
                console.log(`  • Directories: ${breakdown.byType.directories}`);
                console.log(`  • Symlinks: ${breakdown.byType.symlinks}`);
            }
        } else {
            // Output pretty JSON for dry-run
            console.log(builder.generateJsonOutput());
        }
        
        console.log('\n✅ Plan building complete');
        return plan;
    },
    PlanBuilder
};