#!/usr/bin/env node
import { Command } from 'commander';
import { migrate } from '../core/db.js';
import buildServer from '../api/server.js';
import { listComponents } from '../modules/components-registry.js';
import { planInstall } from '../modules/installer.js';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const program = new Command();
program.name('mw-engine').description('Master Workflow Engine CLI').version('0.1.0');

program
  .command('migrate')
  .description('Apply database migrations')
  .action(() => {
    migrate();
    console.log('Migrations applied.');
  });

program
  .command('api')
  .description('Start API server')
  .option('-p, --port <port>', 'Port to listen on', process.env.MW_ENGINE_PORT || '13800')
  .action(async (opts) => {
    process.env.MW_ENGINE_PORT = String(opts.port);
    const app = await buildServer();
    await app.listen({ port: Number(opts.port), host: '0.0.0.0' });
    console.log(`API listening on http://localhost:${opts.port}`);
  });

program
  .command('plan')
  .description('Create an install plan (non-interactive)')
  .requiredOption('-s, --selections <ids>', 'Comma-separated component ids (e.g., core,claude-code)')
  .option('-m, --mode <mode>', 'Mode: guided|express|advanced', 'guided')
  .option('--yolo', 'Enable YOLO mode', false)
  .option('--dangerously-skip-permissions', 'Dangerously skip permissions', false)
  .option('--ack <text>', 'Acknowledgement text when enabling YOLO', '')
  .action((opts) => {
    const selections = String(opts.selections).split(',').map((s: string) => s.trim()).filter(Boolean);
    const plan = planInstall({
      selections,
      mode: opts.mode,
      options: {
        yolo: !!opts.yolo,
        dangerouslySkipPermissions: !!opts.dangerouslySkipPermissions,
        nonInteractive: true,
        ack: opts.ack,
      }
    });
    console.log(JSON.stringify(plan, null, 2));
  });

program
  .command('wizard')
  .description('Interactive installation wizard (planning only)')
  .action(async () => {
    const rl = createInterface({ input, output });
    try {
      console.log('\nAvailable components:');
      const comps = listComponents();
      comps.forEach(c => console.log(`- ${c.id}: ${c.name}`));
      const selInput = await rl.question('\nEnter component ids (comma-separated): ');
      const selections = selInput.split(',').map(s => s.trim()).filter(Boolean);
      const mode = (await rl.question('Mode [guided|express|advanced] (default guided): ')) || 'guided';
      const yoloAns = (await rl.question('Enable YOLO? [y/N]: ')).trim().toLowerCase();
      const yolo = yoloAns === 'y' || yoloAns === 'yes';
      let ack = '';
      if (yolo) {
        ack = await rl.question('Type ack text (must be "I-ACCEPT-RISK"): ');
      }
      const plan = planInstall({
        selections,
        mode: mode as any,
        options: { yolo, dangerouslySkipPermissions: yolo, nonInteractive: false, ack }
      });
      console.log('\nPlanned steps:\n' + JSON.stringify(plan, null, 2));
    } catch (e: any) {
      console.error('Wizard error:', e.message);
      process.exitCode = 1;
    } finally {
      rl.close();
    }
  });

program.parse(process.argv);


