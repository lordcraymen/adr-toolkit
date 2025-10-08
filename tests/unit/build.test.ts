import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { runBuild } from '../../src/build.js';

describe('ADR Build Functionality', () => {
  let tempDir: string;
  
  beforeEach(async () => {
    tempDir = join(tmpdir(), `adr-build-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });
    await mkdir(join(tempDir, 'docs', 'adr'), { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('runBuild with text format', () => {
    it('should build artifacts and return success for valid ADRs', async () => {
      const validAdr = `---
title: "Valid Decision"
status: "Accepted"
summary: "This is a valid decision with proper summary that meets all requirements."
---
# Valid Decision

This is a valid ADR.
`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-valid.md'), validAdr);

      const result = await runBuild(tempDir, 'text');

      expect(result.ok).toBe(true);
      expect(result.adrCount).toBe(1);
      expect(result.artifactsGenerated).toEqual([
        'docs/adr/index.json',
        'docs/adr/ACTIVE.md', 
        'dist/adr-digest.json'
      ]);
      expect(result.error).toBeUndefined();
    });
  });

  describe('runBuild with JSON format', () => {
    it('should return structured BuildResult for valid ADRs with JSON format', async () => {
      const validAdr = `---
title: "Valid Decision"
status: "Accepted"
summary: "This is a valid decision with proper summary that meets all requirements."
---
# Valid Decision

This is a valid ADR.
`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-valid.md'), validAdr);

      // Mock console.log to capture JSON output
      const consoleLogs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => {
        consoleLogs.push(args.join(' '));
      };

      const result = await runBuild(tempDir, 'json');

      console.log = originalLog;

      // Check the return value structure
      expect(result).toMatchObject({
        ok: true,
        adrCount: 1,
        artifactsGenerated: [
          'docs/adr/index.json',
          'docs/adr/ACTIVE.md',
          'dist/adr-digest.json'
        ]
      });
      expect(result.error).toBeUndefined();

      // Check that JSON was output to console
      expect(consoleLogs).toHaveLength(1);
      const outputJson = JSON.parse(consoleLogs[0]);
      expect(outputJson).toMatchObject({
        ok: true,
        adrCount: 1,
        artifactsGenerated: [
          'docs/adr/index.json',
          'docs/adr/ACTIVE.md',
          'dist/adr-digest.json'
        ]
      });
      expect(outputJson.error).toBeUndefined();
    });

    it('should return structured BuildResult for empty directory with JSON format', async () => {
      // Mock console.log to capture JSON output
      const consoleLogs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => {
        consoleLogs.push(args.join(' '));
      };

      const result = await runBuild(tempDir, 'json');

      console.log = originalLog;

      // Check the return value structure
      expect(result).toMatchObject({
        ok: true,
        adrCount: 0,
        artifactsGenerated: [
          'docs/adr/index.json',
          'docs/adr/ACTIVE.md',
          'dist/adr-digest.json'
        ]
      });

      // Check that JSON was output to console
      expect(consoleLogs).toHaveLength(1);
      const outputJson = JSON.parse(consoleLogs[0]);
      expect(outputJson).toMatchObject({
        ok: true,
        adrCount: 0
      });
    });

    it('should maintain text format behavior as default', async () => {
      const validAdr = `---
title: "Valid Decision"
status: "Accepted"
summary: "Valid summary"
---
# Valid Decision`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-valid.md'), validAdr);

      // Mock console.log to capture text output
      const consoleLogs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => {
        consoleLogs.push(args.join(' '));
      };

      const result = await runBuild(tempDir, 'text');

      console.log = originalLog;

      // Check that text was output (not JSON)
      expect(consoleLogs).toHaveLength(1);
      expect(consoleLogs[0]).toContain('Generated ADR artifacts for 1 decisions.');
      
      // JSON parsing should fail
      expect(() => JSON.parse(consoleLogs[0])).toThrow();
    });
  });
});