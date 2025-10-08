import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { runAffected } from '../../src/affected.js';

// Mock the git module
vi.mock('../../src/git.js', () => ({
  gitDiffNames: vi.fn()
}));

import { gitDiffNames } from '../../src/git.js';

const mockGitDiffNames = vi.mocked(gitDiffNames);

describe('Affected Analysis', () => {
  let tempDir: string;
  
  beforeEach(async () => {
    tempDir = join(tmpdir(), `adr-affected-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });
    await mkdir(join(tempDir, 'docs', 'adr'), { recursive: true });
    
    // Reset mocks
    mockGitDiffNames.mockReset();
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('runAffected', () => {
    it('should detect ADRs affected by direct file changes', async () => {
      // Create ADR files
      const adr1 = `---
title: "First Decision"
status: "Accepted"
summary: "First summary"
---
# First Decision`;

      const adr2 = `---
title: "Second Decision" 
status: "Accepted"
summary: "Second summary"
---
# Second Decision`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-first.md'), adr1);
      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0002-second.md'), adr2);

      // Mock git diff to return the changed ADR file
      mockGitDiffNames.mockResolvedValue(['docs/adr/ADR-0001-first.md']);

      const result = await runAffected('HEAD~1', tempDir);

      expect(result.changed).toContain('docs/adr/ADR-0001-first.md');
      expect(result.affected).toContain('docs/adr/ADR-0001-first.md');
      expect(result.affected).not.toContain('docs/adr/ADR-0002-second.md');
    });

    it('should detect ADRs affected by module changes', async () => {
      const adrWithModules = `---
title: "Frontend Architecture"
status: "Accepted"
summary: "Frontend decisions"
modules:
  - src/components/
  - src/ui/
---
# Frontend Architecture`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-frontend.md'), adrWithModules);

      // Mock git diff to return changed component file
      mockGitDiffNames.mockResolvedValue(['src/components/Button.tsx']);

      const result = await runAffected('HEAD~1', tempDir);

      expect(result.changed).toContain('src/components/Button.tsx');
      expect(result.affected).toContain('docs/adr/ADR-0001-frontend.md');
    });

    it('should detect ADRs affected by tag matches', async () => {
      const adrWithTags = `---
title: "Database Architecture"
status: "Accepted"
summary: "Database decisions"
tags:
  - database
  - postgres
---
# Database Architecture`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-database.md'), adrWithTags);

      // Mock git diff to return database-related file
      mockGitDiffNames.mockResolvedValue(['database-config.yml']);

      const result = await runAffected('HEAD~1', tempDir);

      expect(result.changed).toContain('database-config.yml');
      expect(result.affected).toContain('docs/adr/ADR-0001-database.md');
    });

    it('should handle no changes', async () => {
      const adr = `---
title: "Test Decision"
status: "Accepted"
summary: "Test summary"
---
# Test Decision`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-test.md'), adr);

      // Mock git diff to return no changes
      mockGitDiffNames.mockResolvedValue([]);

      const result = await runAffected('HEAD', tempDir);

      expect(result.changed).toHaveLength(0);
      expect(result.affected).toHaveLength(0);
    });

    it('should normalize paths correctly', async () => {
      const adrWithBackslashModules = `---
title: "Windows Path Test"
status: "Accepted"
summary: "Test with backslash paths"
modules:
  - src\\components\\
---
# Windows Path Test`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-paths.md'), adrWithBackslashModules);

      // Mock git diff to return forward slash path that should match backslash module
      mockGitDiffNames.mockResolvedValue(['src/components/Test.tsx']);

      const result = await runAffected('HEAD~1', tempDir);

      expect(result.affected).toContain('docs/adr/ADR-0001-paths.md');
    });

    it('should throw error for missing base reference', async () => {
      await expect(runAffected('', tempDir)).rejects.toThrow('Missing --base <ref> option');
    });

    it('should handle invalid git reference gracefully', async () => {
      const adr = `---
title: "Test Decision"
status: "Accepted"
summary: "Test summary"
---
# Test Decision`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-test.md'), adr);

      // Mock git diff to return empty array for invalid reference
      mockGitDiffNames.mockResolvedValue([]);

      const result = await runAffected('nonexistent-ref', tempDir);

      expect(result.changed).toHaveLength(0);
      expect(result.affected).toHaveLength(0);
    });
  });

  describe('runAffected with different output formats', () => {
    it('should produce JSON output by default', async () => {
      const adr = `---
title: "Test Decision"
status: "Accepted"
summary: "Test summary"
modules: ["src/components"]
---
# Test Decision`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-test.md'), adr);

      // Mock git diff to return changed files
      mockGitDiffNames.mockResolvedValue(['src/components/Button.tsx']);

      // Mock console.log to capture JSON output
      const consoleLogs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => {
        consoleLogs.push(args.join(' '));
      };

      const result = await runAffected('main', tempDir, 'json');

      console.log = originalLog;

      expect(result.changed).toEqual(['src/components/Button.tsx']);
      expect(result.affected).toEqual(['docs/adr/ADR-0001-test.md']);

      // Check that JSON was output to console
      expect(consoleLogs).toHaveLength(1);
      const outputJson = JSON.parse(consoleLogs[0]);
      expect(outputJson).toMatchObject({
        changed: ['src/components/Button.tsx'],
        affected: ['docs/adr/ADR-0001-test.md']
      });
    });

    it('should produce human-readable text output when format is text', async () => {
      const adr = `---
title: "Test Decision"
status: "Accepted"
summary: "Test summary"
modules: ["src/components"]
---
# Test Decision`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-test.md'), adr);

      // Mock git diff to return changed files
      mockGitDiffNames.mockResolvedValue(['src/components/Button.tsx', 'README.md']);

      // Mock console.log to capture text output
      const consoleLogs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => {
        consoleLogs.push(args.join(' '));
      };

      const result = await runAffected('main', tempDir, 'text');

      console.log = originalLog;

      expect(result.changed).toEqual(['src/components/Button.tsx', 'README.md']);
      expect(result.affected).toEqual(['docs/adr/ADR-0001-test.md']);

      // Check that text was output (not JSON)
      expect(consoleLogs.length).toBeGreaterThan(0);
      const allOutput = consoleLogs.join('\n');
      expect(allOutput).toContain('Changed files: 2');
      expect(allOutput).toContain('- src/components/Button.tsx');
      expect(allOutput).toContain('- README.md');
      expect(allOutput).toContain('Affected ADRs: 1');
      expect(allOutput).toContain('- docs/adr/ADR-0001-test.md');
      
      // JSON parsing should fail for the first log (which should be human readable)
      expect(() => JSON.parse(consoleLogs[0])).toThrow();
    });

    it('should handle empty results with text format', async () => {
      const adr = `---
title: "Test Decision"
status: "Accepted"
summary: "Test summary"
---
# Test Decision`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-test.md'), adr);

      // Mock git diff to return empty array
      mockGitDiffNames.mockResolvedValue([]);

      // Mock console.log to capture text output
      const consoleLogs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => {
        consoleLogs.push(args.join(' '));
      };

      const result = await runAffected('main', tempDir, 'text');

      console.log = originalLog;

      expect(result.changed).toEqual([]);
      expect(result.affected).toEqual([]);

      // Check that text was output showing zero counts
      expect(consoleLogs.length).toBeGreaterThan(0);
      const allOutput = consoleLogs.join('\n');
      expect(allOutput).toContain('Changed files: 0');
      expect(allOutput).toContain('Affected ADRs: 0');
    });
  });
});