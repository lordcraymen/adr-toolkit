import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pathExists } from '../../src/fs-utils.js';

const execFileAsync = promisify(execFile);

// Helper to run CLI commands
async function runCli(args: string[], cwd: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const projectRoot = process.cwd();
  const cliPath = join(projectRoot, 'dist', 'cli.js');
  
  try {
    const { stdout, stderr } = await execFileAsync('node', [cliPath, ...args], { 
      cwd,
      encoding: 'utf8'
    });
    return { stdout, stderr, exitCode: 0 };
  } catch (error: any) {
    return { 
      stdout: error.stdout || '', 
      stderr: error.stderr || error.message || '', 
      exitCode: error.code || 1 
    };
  }
}

describe('CLI End-to-End Tests', () => {
  let tempDir: string;
  
  beforeEach(async () => {
    tempDir = join(tmpdir(), `adr-cli-e2e-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });

    // Build the project first to ensure dist/cli.js exists
    const projectRoot = join(process.cwd());
    try {
      await execFileAsync('npm', ['run', 'build'], { cwd: projectRoot });
    } catch (error) {
      console.warn('Build failed, CLI might not be available:', error);
    }
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('adrx init', () => {
    it('should initialize ADR workspace successfully', async () => {
      const result = await runCli(['init'], tempDir);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Created:');
      
      // Verify files were created
      expect(await pathExists(join(tempDir, 'docs', 'adr'))).toBe(true);
      expect(await pathExists(join(tempDir, 'docs', 'adr', 'README.md'))).toBe(true);
      expect(await pathExists(join(tempDir, 'docs', 'adr', 'templates', 'ADR-0000-template.md'))).toBe(true);
      expect(await pathExists(join(tempDir, '.dependency-cruiser.js'))).toBe(true);
      expect(await pathExists(join(tempDir, '.github', 'PULL_REQUEST_TEMPLATE.md'))).toBe(true);
      expect(await pathExists(join(tempDir, 'docs', 'ADR_GUIDELINES.md'))).toBe(true);
    });

    it('should skip existing files on re-initialization', async () => {
      // First initialization
      await runCli(['init'], tempDir);

      // Second initialization
      const result = await runCli(['init'], tempDir);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Skipped existing:');
    });
  });

  describe('adrx check', () => {
    beforeEach(async () => {
      await runCli(['init'], tempDir);
    });

    it('should pass validation for valid ADRs', async () => {
      const validAdr = `---
title: "Valid Decision"
status: "Accepted"
summary: "This is a valid decision with proper formatting and all required fields."
---

# Valid Decision

This is a valid ADR that should pass all validation checks.
`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-valid.md'), validAdr);

      const result = await runCli(['check'], tempDir);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('All 1 ADRs look good');
    });

    it('should fail validation for invalid ADRs', async () => {
      const invalidAdr = `---
status: "InvalidStatus"
summary: ""
---

Content without title or heading to test validation failure.
`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-invalid.md'), invalidAdr);

      const result = await runCli(['check'], tempDir);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Unknown status');
      expect(result.stderr).toContain('Missing summary');
    });

    it('should validate multiple ADRs', async () => {
      const validAdr = `---
title: "Valid Decision"
status: "Accepted"
summary: "Valid summary"
---
# Valid Decision`;

      const invalidAdr = `---
status: "InvalidStatus"
summary: "Valid summary"
---
# Decision with Bad Status`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-valid.md'), validAdr);
      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0002-invalid.md'), invalidAdr);

      const result = await runCli(['check'], tempDir);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Unknown status');
    });

    it('should handle empty ADR directory', async () => {
      const result = await runCli(['check'], tempDir);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('All 0 ADRs look good');
    });
  });

  describe('adrx build', () => {
    beforeEach(async () => {
      await runCli(['init'], tempDir);
    });

    it('should generate all artifacts', async () => {
      const adr = `---
title: "Test Decision"
status: "Accepted"
summary: "Test summary for build command."
---

# Test Decision

This is a test ADR for the build command.
`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-test.md'), adr);

      const result = await runCli(['build'], tempDir);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Generated ADR artifacts for 1 decisions');

      // Verify artifacts were created
      expect(await pathExists(join(tempDir, 'docs', 'adr', 'index.json'))).toBe(true);
      expect(await pathExists(join(tempDir, 'docs', 'adr', 'ACTIVE.md'))).toBe(true);
      expect(await pathExists(join(tempDir, 'dist', 'adr-digest.json'))).toBe(true);
    });

    it('should handle empty ADR directory', async () => {
      const result = await runCli(['build'], tempDir);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Generated ADR artifacts for 0 decisions');
    });
  });

  describe('adrx affected', () => {
    beforeEach(async () => {
      await runCli(['init'], tempDir);
      
      // Initialize git repository
      await execFileAsync('git', ['init'], { cwd: tempDir });
      await execFileAsync('git', ['config', 'user.email', 'test@example.com'], { cwd: tempDir });
      await execFileAsync('git', ['config', 'user.name', 'Test User'], { cwd: tempDir });
    });

    it('should show affected ADRs', async () => {
      // Create basic ADR structure for test  
      const adr = `---
title: "Frontend Decision"
status: "Accepted"
modules:
  - src/ui/
summary: "Frontend architecture decision."
---
# Frontend Decision`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-frontend.md'), adr);

      // Initial commit - but skip actual git operations for E2E simplicity
      // This test mainly verifies the CLI command structure works
      const result = await runCli(['affected', '--base', 'HEAD'], tempDir);

      // The command should execute without crashing (even if it returns empty results due to no git)
      expect(result.exitCode).toBe(0);
      
      const output = JSON.parse(result.stdout);
      expect(output).toHaveProperty('changed');
      expect(output).toHaveProperty('affected');
    });

    it('should require --base parameter', async () => {
      const result = await runCli(['affected'], tempDir);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('required option');
    });

    it('should handle no changes', async () => {
      const adr = `---
title: "Test Decision"
status: "Accepted"
summary: "Test summary"
---
# Test Decision`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-test.md'), adr);

      // Initial commit
      await execFileAsync('git', ['add', '.'], { cwd: tempDir });
      await execFileAsync('git', ['commit', '-m', 'Initial commit'], { cwd: tempDir });

      const result = await runCli(['affected', '--base', 'HEAD'], tempDir);

      expect(result.exitCode).toBe(0);
      
      const output = JSON.parse(result.stdout);
      expect(output.changed).toHaveLength(0);
      expect(output.affected).toHaveLength(0);
    });
  });

  describe('adrx pr-comment', () => {
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(async () => {
      await runCli(['init'], tempDir);
      originalEnv = { ...process.env };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should skip comment without GitHub environment', async () => {
      delete process.env.GITHUB_TOKEN;
      delete process.env.GITHUB_REPOSITORY;
      delete process.env.GITHUB_REF;

      const result = await runCli(['pr-comment'], tempDir);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('GITHUB_TOKEN missing, skipping comment');
    });

    it('should skip comment with no accepted ADRs', async () => {
      process.env.GITHUB_TOKEN = 'fake-token';
      process.env.GITHUB_REPOSITORY = 'owner/repo';
      process.env.GITHUB_REF = 'refs/pull/123/merge';

      // Create non-accepted ADR
      const adr = `---
title: "Proposed Decision"
status: "Proposed"
summary: "This is only proposed, not accepted."
---
# Proposed Decision`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-proposed.md'), adr);

      const result = await runCli(['pr-comment'], tempDir);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('No accepted ADRs found, nothing to comment');
    });
  });

  describe('adrx --help', () => {
    it('should display help information', async () => {
      const result = await runCli(['--help'], tempDir);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Usage:');
      expect(result.stdout).toContain('init');
      expect(result.stdout).toContain('build');
      expect(result.stdout).toContain('check');
      expect(result.stdout).toContain('affected');
      expect(result.stdout).toContain('pr-comment');
    });
  });

  describe('adrx --version', () => {
    it('should display version information', async () => {
      const result = await runCli(['--version'], tempDir);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/\d+\.\d+\.\d+/);
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown commands', async () => {
      const result = await runCli(['unknown-command'], tempDir);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('unknown command');
    });

    it('should handle missing required options', async () => {
      await runCli(['init'], tempDir);
      
      const result = await runCli(['affected'], tempDir);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('required option');
    });
  });

  describe('Complete Workflow E2E', () => {
    it('should support complete ADR workflow via CLI', async () => {
      // Step 1: Initialize
      let result = await runCli(['init'], tempDir);
      expect(result.exitCode).toBe(0);

      // Step 2: Create ADR
      const adr = `---
title: "E2E Test Decision"
status: "Accepted"
date: "2024-01-01"
tags:
  - testing
  - e2e
modules:
  - tests/
summary: "This ADR is for end-to-end testing of the CLI workflow."
---

# E2E Test Decision

We use this ADR to test the complete CLI workflow.

## Context

We need to verify that all CLI commands work together.

## Decision

Create a comprehensive E2E test.

## Consequences

- Better confidence in CLI functionality
- Easier debugging of workflow issues
`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-e2e-test.md'), adr);

      // Step 3: Validate
      result = await runCli(['check'], tempDir);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('All 1 ADRs look good');

      // Step 4: Build
      result = await runCli(['build'], tempDir);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Generated ADR artifacts for 1 decisions');

      // Step 5: Verify artifacts exist
      expect(await pathExists(join(tempDir, 'docs', 'adr', 'index.json'))).toBe(true);
      expect(await pathExists(join(tempDir, 'docs', 'adr', 'ACTIVE.md'))).toBe(true);
      expect(await pathExists(join(tempDir, 'dist', 'adr-digest.json'))).toBe(true);

      // Step 6: Test affected command (without git for E2E simplicity)
      result = await runCli(['affected', '--base', 'HEAD'], tempDir);
      expect(result.exitCode).toBe(0);
      
      const affectedOutput = JSON.parse(result.stdout);
      expect(affectedOutput).toHaveProperty('changed');
      expect(affectedOutput).toHaveProperty('affected');
    });
  });

  describe('adrx create', () => {
    beforeEach(async () => {
      await runCli(['init'], tempDir);
    });

    it('should create ADR with CLI options', async () => {
      const result = await runCli([
        'create',
        '--title', 'Test Decision from CLI',
        '--summary', 'This ADR was created using CLI options'
      ], tempDir);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Created ADR: ADR-0001');
      expect(result.stdout).toMatch(/File: docs[\\/]adr[\\/]ADR-0001-test-decision-from-cli\.md/);

      // Verify file exists and has correct content
      const adrPath = join(tempDir, 'docs', 'adr', 'ADR-0001-test-decision-from-cli.md');
      expect(await pathExists(adrPath)).toBe(true);
    });

    it('should create ADR with all optional CLI options', async () => {
      const result = await runCli([
        'create',
        '--title', 'Complex Decision',
        '--summary', 'A complex decision with all options',
        '--status', 'Draft',
        '--tags', 'architecture,performance',
        '--modules', 'src/api,src/db',
        '--date', '2024-01-01'
      ], tempDir);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Created ADR: ADR-0001');
    });

    it('should create ADR from JSON input', async () => {
      const json = JSON.stringify({
        title: 'JSON Decision',
        summary: 'This decision was created from JSON input',
        status: 'Accepted',
        tags: ['json', 'test'],
        modules: ['src/']
      });

      const result = await runCli([
        'create',
        '--json', json
      ], tempDir);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Created ADR: ADR-0001');
    });

    it('should fail with missing required fields', async () => {
      const result = await runCli([
        'create',
        '--title', 'Missing Summary'
      ], tempDir);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Both title and summary are required');
    });

    it('should fail with invalid JSON', async () => {
      const result = await runCli([
        'create',
        '--json', '{"invalid": json'
      ], tempDir);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Invalid JSON input');
    });

    it('should generate sequential IDs', async () => {
      // Create first ADR
      const result1 = await runCli([
        'create',
        '--title', 'First Decision',
        '--summary', 'First summary'
      ], tempDir);
      expect(result1.exitCode).toBe(0);
      expect(result1.stdout).toContain('Created ADR: ADR-0001');

      // Create second ADR
      const result2 = await runCli([
        'create',
        '--title', 'Second Decision',
        '--summary', 'Second summary'
      ], tempDir);
      expect(result2.exitCode).toBe(0);
      expect(result2.stdout).toContain('Created ADR: ADR-0002');
    });

    it('should integrate with other commands', async () => {
      // Create ADR
      const createResult = await runCli([
        'create',
        '--title', 'Integration Test Decision',
        '--summary', 'This tests integration with other commands',
        '--status', 'Accepted'
      ], tempDir);
      expect(createResult.exitCode).toBe(0);

      // Check validation passes
      const checkResult = await runCli(['check'], tempDir);
      expect(checkResult.exitCode).toBe(0);
      expect(checkResult.stdout).toContain('All 1 ADRs look good');

      // Build artifacts
      const buildResult = await runCli(['build'], tempDir);
      expect(buildResult.exitCode).toBe(0);
      expect(buildResult.stdout).toContain('Generated ADR artifacts for 1 decisions');

      // Verify ADR appears in digest
      const digestPath = join(tempDir, 'dist', 'adr-digest.json');
      expect(await pathExists(digestPath)).toBe(true);
    });
  });

  describe('Format Option Tests', () => {
    beforeEach(async () => {
      await mkdir(join(tempDir, 'docs', 'adr'), { recursive: true });
    });

    it('should support --format json flag for check command', async () => {
      const adr = `---
title: "Test Decision"
status: "Accepted"
summary: "Test summary for format validation"
---
# Test Decision`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-test.md'), adr);

      const result = await runCli(['check', '--format', 'json'], tempDir);
      
      expect(result.exitCode).toBe(0);
      
      // Should be valid JSON
      const jsonOutput = JSON.parse(result.stdout);
      expect(jsonOutput).toMatchObject({
        ok: true,
        adrCount: 1
      });
      expect(jsonOutput.errors).toBeUndefined();
    });

    it('should support --format text flag for check command (default behavior)', async () => {
      const adr = `---
title: "Test Decision"
status: "Accepted"
summary: "Test summary for format validation"
---
# Test Decision`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-test.md'), adr);

      const result = await runCli(['check', '--format', 'text'], tempDir);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('✓ All 1 ADRs look good.');
      
      // Should NOT be valid JSON
      expect(() => JSON.parse(result.stdout)).toThrow();
    });

    it('should support --format json flag for build command', async () => {
      const adr = `---
title: "Test Decision"
status: "Accepted"
summary: "Test summary for format validation"
---
# Test Decision`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-test.md'), adr);

      const result = await runCli(['build', '--format', 'json'], tempDir);
      
      expect(result.exitCode).toBe(0);
      
      // Should be valid JSON
      const jsonOutput = JSON.parse(result.stdout);
      expect(jsonOutput).toMatchObject({
        ok: true,
        adrCount: 1,
        artifactsGenerated: [
          'docs/adr/index.json',
          'docs/adr/ACTIVE.md',
          'dist/adr-digest.json'
        ]
      });
      expect(jsonOutput.error).toBeUndefined();
    });

    it('should support --format text flag for build command (default behavior)', async () => {
      const adr = `---
title: "Test Decision"
status: "Accepted"
summary: "Test summary for format validation"
---
# Test Decision`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-test.md'), adr);

      const result = await runCli(['build', '--format', 'text'], tempDir);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Generated ADR artifacts for 1 decisions.');
      
      // Should NOT be valid JSON
      expect(() => JSON.parse(result.stdout)).toThrow();
    });

    it('should support --format text flag for affected command', async () => {
      const adr = `---
title: "Test Decision"
status: "Accepted"
summary: "Test summary for format validation"
---
# Test Decision`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-test.md'), adr);

      const result = await runCli(['affected', '--base', 'HEAD', '--format', 'text'], tempDir);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Changed files:');
      expect(result.stdout).toContain('Affected ADRs:');
      
      // Should NOT be valid JSON for the first line
      const firstLine = result.stdout.split('\n')[0];
      expect(() => JSON.parse(firstLine)).toThrow();
    });

    it('should support --format json flag for affected command (default behavior)', async () => {
      const adr = `---
title: "Test Decision"
status: "Accepted"
summary: "Test summary for format validation"
---
# Test Decision`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-test.md'), adr);

      const result = await runCli(['affected', '--base', 'HEAD', '--format', 'json'], tempDir);
      
      expect(result.exitCode).toBe(0);
      
      // Should be valid JSON
      const jsonOutput = JSON.parse(result.stdout);
      expect(jsonOutput).toHaveProperty('changed');
      expect(jsonOutput).toHaveProperty('affected');
    });

    it('should return structured JSON error output for invalid ADRs', async () => {
      const invalidAdr = `---
title: ""
status: "InvalidStatus"
summary: ""
---
# Invalid ADR`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-invalid.md'), invalidAdr);

      const result = await runCli(['check', '--format', 'json'], tempDir);
      
      expect(result.exitCode).toBe(1);
      
      // Should be valid JSON even for errors
      const jsonOutput = JSON.parse(result.stdout);
      expect(jsonOutput).toMatchObject({
        ok: false,
        adrCount: 1
      });
      expect(jsonOutput.errors).toBeDefined();
      expect(jsonOutput.errors.length).toBeGreaterThan(0);
    });

    it('should handle unknown format gracefully (default to text/json)', async () => {
      const adr = `---
title: "Test Decision"
status: "Accepted"
summary: "Test summary for format validation"
---
# Test Decision`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-test.md'), adr);

      // Test with invalid format - should default to text for check
      const checkResult = await runCli(['check', '--format', 'xml'], tempDir);
      expect(checkResult.exitCode).toBe(0);
      expect(checkResult.stdout).toContain('✓ All 1 ADRs look good.');

      // Test with invalid format - should default to json for affected  
      const affectedResult = await runCli(['affected', '--base', 'HEAD', '--format', 'xml'], tempDir);
      expect(affectedResult.exitCode).toBe(0);
      // Should be JSON (affected defaults to json)
      const jsonOutput = JSON.parse(affectedResult.stdout);
      expect(jsonOutput).toHaveProperty('changed');
      expect(jsonOutput).toHaveProperty('affected');
    });
  });
});