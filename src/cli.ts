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
  .option('--dry-run', 'Show what files would be created without creating them')
  .action(async (options: { dryRun?: boolean }) => {
    const { created, skipped } = await initWorkspace(process.cwd(), { dryRun: options.dryRun });
    if (options.dryRun) {
      console.log('Files that would be created:');
      if (created.length > 0) {
        console.log(`  ${created.join('\n  ')}`);
      } else {
        console.log('  (none - all files already exist)');
      }
      if (skipped.length > 0) {
        console.log('\nFiles that would be skipped (already exist):');
        console.log(`  ${skipped.join('\n  ')}`);
      }
    } else {
      if (created.length > 0) {
        console.log(`Created: ${created.join(', ')}`);
      }
      if (skipped.length > 0) {
        console.log(`Skipped existing: ${skipped.join(', ')}`);
      }
    }
  });

program
  .command('build')
  .description('Generate ADR indexes and digest files')
  .option('-f, --format <format>', 'Output format (json|text)', 'text')
  .action(async (options: { format: string }) => {
    const format = options.format === 'json' ? 'json' : 'text';
    const result = await runBuild(process.cwd(), format);
    if (!result.ok) {
      process.exitCode = 1;
    }
  });

program
  .command('check')
  .description('Validate ADR frontmatter and summary constraints')
  .option('-f, --format <format>', 'Output format (json|text)', 'text')
  .action(async (options: { format: string }) => {
    const format = options.format === 'json' ? 'json' : 'text';
    const result = await runCheck(process.cwd(), format);
    if (!result.ok) {
      process.exitCode = 1;
    }
  });

program
  .command('affected')
  .description('List ADRs affected by changes compared to a base git ref')
  .requiredOption('-b, --base <ref>', 'Base git reference')
  .option('-f, --format <format>', 'Output format (json|text)', 'json')
  .action(async (options: { base: string; format: string }) => {
    const format = options.format === 'text' ? 'text' : 'json';
    await runAffected(options.base, process.cwd(), format);
  });

program
  .command('pr-comment')
  .description('Post the ADR digest as a pull request comment (no-op without GitHub context)')
  .action(async () => {
    await runPrComment();
  });

// Configuration management commands
const configCmd = program
  .command('config')
  .description('Manage ADR configuration');

configCmd
  .command('init')
  .description('Initialize default .adrx.config.json configuration file')
  .action(async () => {
    const { runConfigInit } = await import('./config-cli.js');
    await runConfigInit();
  });

configCmd
  .command('validate')
  .description('Validate current configuration file')
  .action(async () => {
    const { runConfigValidate } = await import('./config-cli.js');
    await runConfigValidate();
  });

configCmd
  .command('show')
  .description('Display current configuration')
  .action(async () => {
    const { runConfigShow } = await import('./config-cli.js');
    await runConfigShow();
  });

program.parseAsync(process.argv).catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
