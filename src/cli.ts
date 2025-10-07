#!/usr/bin/env node
import { Command } from 'commander';
import { createRequire } from 'node:module';
import process from 'node:process';
import { initWorkspace } from './init.js';
import { runBuild } from './build.js';
import { runCheck } from './check.js';
import { runAffected } from './affected.js';
import { runPrComment } from './pr-comment.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json') as { version?: string; description?: string };

const program = new Command();
program
  .name('adrx')
  .description(pkg.description ?? 'ADR workflow companion CLI')
  .version(pkg.version ?? '0.0.0');

program
  .command('init')
  .description('Create ADR directories and supporting templates')
  .action(async () => {
    const { created, skipped } = await initWorkspace();
    if (created.length > 0) {
      console.log(`Created: ${created.join(', ')}`);
    }
    if (skipped.length > 0) {
      console.log(`Skipped existing: ${skipped.join(', ')}`);
    }
  });

program
  .command('build')
  .description('Generate ADR indexes and digest files')
  .action(async () => {
    await runBuild();
  });

program
  .command('check')
  .description('Validate ADR frontmatter and summary constraints')
  .action(async () => {
    const { ok } = await runCheck();
    if (!ok) {
      process.exitCode = 1;
    }
  });

program
  .command('affected')
  .description('List ADRs affected by changes compared to a base git ref')
  .requiredOption('-b, --base <ref>', 'Base git reference')
  .action(async (options: { base: string }) => {
    const result = await runAffected(options.base);
    console.log(JSON.stringify(result, null, 2));
  });

program
  .command('pr-comment')
  .description('Post the ADR digest as a pull request comment (no-op without GitHub context)')
  .action(async () => {
    await runPrComment();
  });

// Configuration management commands (TODO: implement when config system is ready)
const configCmd = program
  .command('config')
  .description('Manage ADR configuration');

configCmd
  .command('init')
  .description('Initialize default .adrx.config.json configuration file')
  .action(async () => {
    console.log('TODO: Implement config init command');
    console.log('This will create .adrx.config.json with default status configuration');
  });

configCmd
  .command('validate')
  .description('Validate current configuration file')
  .action(async () => {
    console.log('TODO: Implement config validate command');
    console.log('This will validate .adrx.config.json against the schema');
  });

configCmd
  .command('show')
  .description('Display current configuration')
  .action(async () => {
    console.log('TODO: Implement config show command');
    console.log('This will display the effective configuration being used');
  });

program.parseAsync(process.argv).catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
