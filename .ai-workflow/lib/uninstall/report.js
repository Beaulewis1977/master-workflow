/**
 * Report Generation Module
 * Creates detailed uninstall reports and logs
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class ReportGenerator {
    constructor(plan, config, results = {}) {
        this.plan = plan;
        this.config = config;
        this.results = results;
        this.report = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            startedAt: plan.timestamp,
            finishedAt: new Date().toISOString(),
            mode: config.dryRun ? 'dry-run' : 'execute',
            summary: {},
            details: {},
            configuration: config,
            exitCode: 0
        };
    }

    /**
     * Generate complete report
     */
    async generate() {
        // Build report structure
        this.buildSummary();
        this.buildDetails();
        this.addSystemInfo();
        
        // Save report to file
        const reportPath = await this.saveReport();
        
        // Print summary to console
        this.printSummary();
        
        return {
            report: this.report,
            path: reportPath
        };
    }

    /**
     * Build summary section
     */
    buildSummary() {
        const removed = this.results.removed || [];
        const failed = this.results.failed || [];
        const skipped = this.results.skipped || [];
        
        this.report.summary = {
            totalPlanned: this.plan.remove.length,
            removed: removed.length,
            failed: failed.length,
            skipped: skipped.length,
            kept: this.plan.keep.length,
            unknown: this.plan.unknown.length,
            spaceFree: this.plan.summary.totalSizeFormatted || '0 B',
            duration: this.calculateDuration()
        };

        // Add process summary
        if (this.plan.processes && this.plan.processes.length > 0) {
            this.report.summary.processesStopped = this.plan.processes.length;
        }

        // Add backup info
        if (this.config.backup) {
            this.report.summary.backupCreated = this.config.backup;
        }
    }

    /**
     * Build details section
     */
    buildDetails() {
        this.report.details = {
            removed: this.results.removed || [],
            failed: this.results.failed || [],
            skipped: this.results.skipped || [],
            kept: this.plan.keep || [],
            unknown: this.plan.unknown || [],
            processes: this.plan.processes || [],
            notes: this.plan.notes || []
        };

        // Add error details for failed items
        if (this.results.failed && this.results.failed.length > 0) {
            this.report.details.errors = this.results.failed.map(item => ({
                path: item.path,
                error: item.error || 'Unknown error'
            }));
        }
    }

    /**
     * Add system information
     */
    addSystemInfo() {
        this.report.system = {
            platform: os.platform(),
            arch: os.arch(),
            nodeVersion: process.version,
            user: os.userInfo().username,
            hostname: os.hostname(),
            projectRoot: process.cwd()
        };
    }

    /**
     * Calculate duration
     */
    calculateDuration() {
        const start = new Date(this.report.startedAt);
        const end = new Date(this.report.finishedAt);
        const duration = end - start;
        
        const seconds = Math.floor(duration / 1000);
        const minutes = Math.floor(seconds / 60);
        
        if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        }
        return `${seconds}s`;
    }

    /**
     * Save report to file
     */
    async saveReport() {
        // Create logs directory
        const logsDir = path.join(
            os.homedir(),
            '.ai-workflow-uninstall-logs'
        );
        
        try {
            await fs.mkdir(logsDir, { recursive: true });
        } catch (error) {
            console.warn('Could not create logs directory:', error.message);
            return null;
        }

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `uninstall-report-${timestamp}.json`;
        const reportPath = path.join(logsDir, filename);

        try {
            await fs.writeFile(
                reportPath,
                JSON.stringify(this.report, null, 2),
                'utf8'
            );
            console.log(`\n📄 Report saved to: ${reportPath}`);
            return reportPath;
        } catch (error) {
            console.error('Could not save report:', error.message);
            return null;
        }
    }

    /**
     * Print summary to console
     */
    printSummary() {
        console.log('\n' + '═'.repeat(60));
        console.log('📊 UNINSTALL REPORT');
        console.log('═'.repeat(60));
        
        console.log(`\nMode: ${this.report.mode.toUpperCase()}`);
        console.log(`Duration: ${this.report.summary.duration}`);
        console.log(`Exit Code: ${this.report.exitCode}`);
        
        console.log('\n📁 File Operations:');
        console.log(`  • Planned removals: ${this.report.summary.totalPlanned}`);
        console.log(`  • Successfully removed: ${this.report.summary.removed}`);
        console.log(`  • Failed: ${this.report.summary.failed}`);
        console.log(`  • Skipped: ${this.report.summary.skipped}`);
        console.log(`  • Kept: ${this.report.summary.kept}`);
        console.log(`  • Space freed: ${this.report.summary.spaceFree}`);
        
        if (this.report.summary.processesStopped) {
            console.log(`\n🔄 Processes stopped: ${this.report.summary.processesStopped}`);
        }
        
        if (this.report.summary.backupCreated) {
            console.log(`\n💾 Backup created: ${this.report.summary.backupCreated}`);
        }
        
        if (this.report.details.errors && this.report.details.errors.length > 0) {
            console.log('\n❌ Errors:');
            this.report.details.errors.forEach(error => {
                console.log(`  • ${error.path}: ${error.error}`);
            });
        }
        
        console.log('\n' + '─'.repeat(60));
        
        // Add restore instructions if backup was created
        if (this.report.summary.backupCreated) {
            console.log('\n📦 To restore from backup:');
            console.log(`  tar -xzf ${this.report.summary.backupCreated} -C /`);
            console.log('  (Adjust path as needed for your system)');
        }
        
        // Add next steps
        console.log('\n✨ Next Steps:');
        if (this.config.dryRun) {
            console.log('  • Review the plan above');
            console.log('  • Run with --no-dry-run to perform actual uninstallation');
        } else {
            console.log('  • AI Workflow has been uninstalled');
            console.log('  • Your generated documents have been preserved');
            console.log('  • To reinstall, run the appropriate installer script');
        }
        
        console.log('\n' + '═'.repeat(60));
    }

    /**
     * Generate CSV report (optional format)
     */
    async generateCSV() {
        const headers = ['Action', 'Path', 'Type', 'Status', 'Size'];
        const rows = [];
        
        // Add removed files
        for (const item of this.results.removed || []) {
            rows.push(['Remove', item.path, item.origin || 'unknown', 'Success', item.size || 0]);
        }
        
        // Add failed files
        for (const item of this.results.failed || []) {
            rows.push(['Remove', item.path, item.origin || 'unknown', 'Failed', item.size || 0]);
        }
        
        // Add kept files
        for (const item of this.plan.keep || []) {
            rows.push(['Keep', item.path, item.origin || 'unknown', 'Preserved', item.size || 0]);
        }
        
        // Convert to CSV format
        const csv = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        
        return csv;
    }
}

// Export main function
module.exports = {
    generateReport: async (plan, config, results = {}) => {
        const generator = new ReportGenerator(plan, config, results);
        return await generator.generate();
    },
    ReportGenerator
};