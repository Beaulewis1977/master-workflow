import Installer from '../install.js';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTest() {
    console.log(chalk.blue.bold('Running Installer Smoke Test...'));
    const tempDir = path.join(__dirname, 'temp-installer-test');
    const originalCwd = process.cwd();
    let testPassed = true;

    try {
        // 1. Setup
        console.log(chalk.gray('  - Setting up test environment...'));
        await fs.ensureDir(tempDir);
        process.chdir(tempDir);

        // 2. Mock Data
        const mockConfig = {
            components: ['agentOS', 'claudeCode'],
            answers: {
                PRODUCT_NAME: 'Smoke Test SaaS',
                PRODUCT_MISSION: 'Verify installer functionality.',
                TARGET_AUDIENCE: 'Automated Testers',
                CLOUD_PROVIDER: 'AWS',
                factors: { techStack: { languages: ['JavaScript', 'Python'] } },
                DATE: new Date().toLocaleDateString(),
            }
        };

        // 3. Run Installer Headlessly
        console.log(chalk.gray('  - Running headless installation...'));
        const installer = new Installer();
        installer.SCRIPT_DIR = path.resolve(originalCwd);

        // Provide mock analysis data since we are not running the real analyzer in the test
        mockConfig.mockAnalysis = {
            factors: {
                techStack: { languages: ['JavaScript', 'Python'] },
                deployment: { cloudProvider: 'AWS' }
            }
        };

        await installer.runHeadless(mockConfig);

        // 4. Verification
        console.log(chalk.gray('  - Verifying results...'));
        const missionPath = path.join(tempDir, '.agent-os', 'product', 'mission.md');
        const missionExists = await fs.pathExists(missionPath);
        if (!missionExists) {
            console.error(chalk.red('  ✗ FAIL: mission.md was not created.'));
            testPassed = false;
        } else {
            const missionContent = await fs.readFile(missionPath, 'utf8');
            if (!missionContent.includes(mockConfig.answers.PRODUCT_MISSION)) {
                console.error(chalk.red('  ✗ FAIL: mission.md content is incorrect.'));
                testPassed = false;
            } else {
                console.log(chalk.green('  ✓ PASS: mission.md created and customized correctly.'));
            }
        }

        const architecturePath = path.join(tempDir, '.agent-os', 'product', 'docs', 'ARCHITECTURE.md');
        const archExists = await fs.pathExists(architecturePath);
        if (!archExists) {
            console.error(chalk.red('  ✗ FAIL: ARCHITECTURE.md was not created.'));
            testPassed = false;
        } else {
             console.log(chalk.green('  ✓ PASS: ARCHITECTURE.md created.'));
        }


    } catch (error) {
        console.error(chalk.red('  ✗ An error occurred during the smoke test:'), error);
        testPassed = false;
    } finally {
        // 5. Cleanup
        console.log(chalk.gray('  - Cleaning up...'));
        process.chdir(originalCwd);
        await fs.remove(tempDir);
    }

    if (testPassed) {
        console.log(chalk.green.bold('\n✅ Installer Smoke Test Passed!'));
        process.exit(0);
    } else {
        console.log(chalk.red.bold('\n❌ Installer Smoke Test Failed!'));
        process.exit(1);
    }
}

runTest();
