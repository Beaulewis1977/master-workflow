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
     * Calculate file sizes
     */
    async calculateSizes() {
        let totalSize = 0;
        
        // Calculate size of files to be removed
        for (const item of this.plan.remove) {
            try {
                const fullPath = path.join(this.detectionData.projectRoot || process.cwd(), item.path);
                const stats = await fs.stat(fullPath);
                item.size = stats.size;
                totalSize += stats.size;
            } catch (error) {
                item.size = 0;  // File might not exist
            }
        }
        
        this.plan.summary.totalSize = totalSize;
        this.plan.summary.totalSizeFormatted = this.formatSize(totalSize);
    }

    /**
     * Sort removal order for safe deletion
     */
    sortRemovalOrder() {
        // Sort so that:
        // 1. Symlinks are removed first
        // 2. Files are removed before directories
        // 3. Deeper paths are removed before shallower ones
        
        this.plan.remove.sort((a, b) => {
            // Symlinks first
            if (a.origin === 'symlink_executable' && b.origin !== 'symlink_executable') return -1;
            if (b.origin === 'symlink_executable' && a.origin !== 'symlink_executable') return 1;
            
            // Then by depth (deeper first)
            const depthA = a.path.split('/').length;
            const depthB = b.path.split('/').length;
            return depthB - depthA;
        });
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
     * Generate human-readable summary
     */
    generateSummaryText() {
        const lines = [
            '═'.repeat(60),
            '📊 UNINSTALL PLAN SUMMARY',
            '═'.repeat(60),
            '',
            `Mode: ${this.plan.mode.toUpperCase()}`,
            `Timestamp: ${new Date(this.plan.timestamp).toLocaleString()}`,
            '',
            '📁 File Operations:',
            `  • Files to remove: ${this.plan.summary.remove}`,
            `  • Files to keep: ${this.plan.summary.keep}`,
            `  • Files needing review: ${this.plan.summary.unknown}`,
            `  • Total size to free: ${this.plan.summary.totalSizeFormatted || '0 B'}`,
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
}

// Export main function
module.exports = {
    buildPlan: async (detectionData, config) => {
        const builder = new PlanBuilder(detectionData, config);
        const plan = await builder.build();
        
        // Print summary if not in JSON mode
        if (!config.jsonOutput) {
            console.log(builder.generateSummaryText());
        }
        
        return plan;
    },
    PlanBuilder
};