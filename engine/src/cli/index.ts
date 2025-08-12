#!/usr/bin/env node
import { Command } from 'commander';
import { migrate } from '../core/db.js';
import buildServer from '../api/server.js';

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

program.parse(process.argv);


