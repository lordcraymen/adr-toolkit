#!/usr/bin/env node
import { Command } from 'commander';
import { createRequire } from 'node:module';
import process from 'node:process';
import { initWorkspace } from './init.js';
import { runBuild } from './build.js';
import { runCheck } from './check.js';
import { runAffected } from './affected.js';
import { runPrComment } from './pr-comment.js';
import { createAdr, parseCliInput, parseJsonInput } from './create.js';

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

program
  .command('create')
  .description('Create a new ADR from structured input')
  .option('-t, --title <title>', 'ADR title (required)')
  .option('-s, --summary <summary>', 'ADR summary (required)')
  .option('--status <status>', 'ADR status (default: Proposed)')
  .option('--tags <tags>', 'Comma-separated list of tags')
  .option('--modules <modules>', 'Comma-separated list of modules')
  .option('-d, --date <date>', 'ADR date (default: today)')
  .option('--context <context>', 'Context section content')
  .option('--decision <decision>', 'Decision section content')
  .option('--consequences <consequences>', 'Consequences section content')
  .option('--references <references>', 'References section content')
  .option('--json <json>', 'JSON input string (overrides other options)')
  .option('--json-stdin', 'Read JSON input from stdin')
  .action(async (options: {
    title?: string;
    summary?: string;
    status?: string;
    tags?: string;
    modules?: string;
    date?: string;
    context?: string;
    decision?: string;
    consequences?: string;
    references?: string;
    json?: string;
    jsonStdin?: boolean;
  }) => {
    try {
      let input;

      if (options.jsonStdin) {
        // Read from stdin
        const { stdin } = process;
        let jsonData = '';
        
        stdin.setEncoding('utf8');
        for await (const chunk of stdin) {
          jsonData += chunk;
        }
        
        if (!jsonData.trim()) {
          console.error('Error: No JSON input provided via stdin');
          process.exitCode = 1;
          return;
        }
        
        input = parseJsonInput(jsonData);
      } else if (options.json) {
        // Parse JSON from command line option
        input = parseJsonInput(options.json);
      } else {
        // Use CLI options
        input = parseCliInput(options);
      }

      // Validate required fields
      if (!input.title || !input.summary) {
        console.error('Error: Both title and summary are required');
        console.error('Usage: adrx create --title "..." --summary "..."');
        console.error('   or: adrx create --json \'{"title": "...", "summary": "..."}\'');
        process.exitCode = 1;
        return;
      }

      const result = await createAdr(input);
      console.log(`Created ADR: ${result.id}`);
      console.log(`File: ${result.path}`);
    } catch (error: unknown) {
      console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exitCode = 1;
    }
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
