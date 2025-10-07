import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { initWorkspace } from '../../src/init.js';
import { pathExists } from '../../src/fs-utils.js';

describe('Workspace Initialization', () => {
  let tempDir: string;
  
  beforeEach(async () => {
    tempDir = join(tmpdir(), `adr-init-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('initWorkspace', () => {
    it('should create all required files and directories', async () => {
      const result = await initWorkspace(tempDir, { interactive: false });

      expect(result.created).toContain('docs/adr/templates/ADR-0000-template.md');
      expect(result.created).toContain('.dependency-cruiser.js');
      expect(result.created).toContain('.github/PULL_REQUEST_TEMPLATE.md');
      expect(result.created).toContain('docs/ADR_GUIDELINES.md');
      expect(result.created).toContain('docs/adr/README.md');

      // Verify files actually exist
      expect(await pathExists(join(tempDir, 'docs', 'adr'))).toBe(true);
      expect(await pathExists(join(tempDir, 'docs', 'adr', 'templates'))).toBe(true);
      expect(await pathExists(join(tempDir, '.github'))).toBe(true);
    });

    it('should skip existing files', async () => {
      // Create some files first
      await mkdir(join(tempDir, 'docs', 'adr'), { recursive: true });
      await writeFile(join(tempDir, '.dependency-cruiser.js'), 'Custom config');

      const result = await initWorkspace(tempDir, { interactive: false });

      expect(result.skipped).toContain('.dependency-cruiser.js');
      
      // Verify custom content is preserved
      const { readFile } = await import('node:fs/promises');
      const configContent = await readFile(join(tempDir, '.dependency-cruiser.js'), 'utf8');
      expect(configContent).toBe('Custom config');
    });

    it('should create directories recursively', async () => {
      await initWorkspace(tempDir, { interactive: false });

      expect(await pathExists(join(tempDir, 'docs', 'adr', 'templates'))).toBe(true);
      expect(await pathExists(join(tempDir, '.github'))).toBe(true);
    });

    it('should handle empty directory', async () => {
      const emptyDir = join(tempDir, 'empty');
      await mkdir(emptyDir);

      const result = await initWorkspace(emptyDir, { interactive: false });

      expect(result.created.length).toBeGreaterThan(0);
      expect(result.skipped.length).toBe(0);
    });

    it('should work with absolute paths', async () => {
      const result = await initWorkspace(tempDir, { interactive: false });
      expect(result.created.length).toBeGreaterThan(0);
    });
  });
});