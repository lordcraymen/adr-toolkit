import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createAdr, parseJsonInput, parseCliInput, type CreateAdrInput } from '../../src/create.js';
import { pathExists } from '../../src/fs-utils.js';

describe('ADR Create Functionality', () => {
  let tempDir: string;
  
  beforeEach(async () => {
    tempDir = join(tmpdir(), `adr-create-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });
    await mkdir(join(tempDir, 'docs', 'adr'), { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('createAdr', () => {
    it('should create a new ADR with minimal input', async () => {
      const input: CreateAdrInput = {
        title: 'Test Decision',
        summary: 'This is a test decision summary'
      };

      const result = await createAdr(input, tempDir);

      expect(result.id).toBe('ADR-0001');
      expect(result.path).toMatch(/docs[\\\/]adr[\\\/]ADR-0001-test-decision\.md/);
      expect(result.created).toBe(true);

      // Verify file was created
      const fullPath = join(tempDir, result.path);
      expect(await pathExists(fullPath)).toBe(true);

      // Verify content
      const content = await readFile(fullPath, 'utf8');
      expect(content).toContain('title: "ADR-0001: Test Decision"');
      expect(content).toContain('status: Proposed');
      expect(content).toContain('summary: >-');
      expect(content).toContain('This is a test decision summary');
    });

    it('should create ADR with all optional fields', async () => {
      const input: CreateAdrInput = {
        title: 'Complex Decision',
        summary: 'A more complex decision with all fields',
        status: 'Draft',
        tags: ['architecture', 'performance'],
        modules: ['src/api', 'src/db'],
        date: '2024-01-01',
        context: 'We need to make this decision because...',
        decision: 'We decided to do this...',
        consequences: 'The positive outcomes are...',
        references: '- Link to RFC-123'
      };

      const result = await createAdr(input, tempDir);
      const content = await readFile(join(tempDir, result.path), 'utf8');

      expect(content).toContain('status: Draft');
      expect(content).toContain('tags:');
      expect(content).toContain('  - architecture');
      expect(content).toContain('  - performance');
      expect(content).toContain('modules:');
      expect(content).toContain('  - src/api');
      expect(content).toContain('  - src/db');
      expect(content).toContain('date: "2024-01-01"');
      expect(content).toContain('We need to make this decision because...');
      expect(content).toContain('We decided to do this...');
      expect(content).toContain('The positive outcomes are...');
      expect(content).toContain('- Link to RFC-123');
    });

    it('should generate sequential ADR IDs', async () => {
      // Create first ADR
      const input1: CreateAdrInput = {
        title: 'First Decision',
        summary: 'First summary'
      };
      const result1 = await createAdr(input1, tempDir);
      expect(result1.id).toBe('ADR-0001');

      // Create second ADR
      const input2: CreateAdrInput = {
        title: 'Second Decision',
        summary: 'Second summary'
      };
      const result2 = await createAdr(input2, tempDir);
      expect(result2.id).toBe('ADR-0002');
    });

    it('should handle existing ADRs and generate next ID', async () => {
      // Create an existing ADR file manually
      const existingAdr = `---
title: "ADR-0005: Existing Decision"
status: "Accepted"
summary: "This already exists"
---
# Existing Decision`;
      
      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0005-existing.md'), existingAdr);

      // Create new ADR should be ADR-0006
      const input: CreateAdrInput = {
        title: 'New Decision',
        summary: 'New summary'
      };
      const result = await createAdr(input, tempDir);
      expect(result.id).toBe('ADR-0006');
    });

    it('should validate required fields', async () => {
      const input: CreateAdrInput = {
        title: '',
        summary: 'Valid summary'
      };

      await expect(createAdr(input, tempDir)).rejects.toThrow('Validation failed: Title is required');
    });

    it('should validate summary length', async () => {
      const longSummary = 'a'.repeat(301); // Exceeds 300 char limit
      const input: CreateAdrInput = {
        title: 'Valid Title',
        summary: longSummary
      };

      await expect(createAdr(input, tempDir)).rejects.toThrow('Summary exceeds maximum length');
    });

    it('should create unique filenames even with existing non-ADR files', async () => {
      // This test verifies that the system handles existing files gracefully
      const conflictingFilename = 'ADR-0001-test-decision.md';
      await writeFile(join(tempDir, 'docs', 'adr', conflictingFilename), 'This is not a valid ADR file');

      const input: CreateAdrInput = {
        title: 'Test Decision',
        summary: 'Test summary'
      };

      // The system should detect the existing file as ADR-0001 and create ADR-0002
      const result = await createAdr(input, tempDir);
      expect(result.id).toBe('ADR-0002');
      expect(result.path).toMatch(/ADR-0002-test-decision\.md$/);
    });

    it('should handle workspace without existing ADRs', async () => {
      // Remove the ADR directory
      await rm(join(tempDir, 'docs'), { recursive: true, force: true });

      const input: CreateAdrInput = {
        title: 'First Decision Ever',
        summary: 'First summary ever'
      };

      const result = await createAdr(input, tempDir);
      expect(result.id).toBe('ADR-0001');
    });

    it('should use default values appropriately', async () => {
      const input: CreateAdrInput = {
        title: 'Default Values Test',
        summary: 'Testing default values'
      };

      const result = await createAdr(input, tempDir);
      const content = await readFile(join(tempDir, result.path), 'utf8');

      expect(content).toContain('status: Proposed'); // Default status
      expect(content).toContain(`date: "${new Date().toISOString().split('T')[0]}"`); // Default to today
      expect(content).toContain('Describe the forces at play'); // Default context
      expect(content).toContain('State the decision that was made'); // Default decision
      expect(content).toContain('Explain the positive and negative outcomes'); // Default consequences
      expect(content).toContain('- Link to related ADRs'); // Default references
    });
  });

  describe('parseJsonInput', () => {
    it('should parse valid JSON input', () => {
      const json = JSON.stringify({
        title: 'JSON Decision',
        summary: 'This came from JSON',
        status: 'Accepted',
        tags: ['json', 'test'],
        modules: ['src/']
      });

      const result = parseJsonInput(json);

      expect(result.title).toBe('JSON Decision');
      expect(result.summary).toBe('This came from JSON');
      expect(result.status).toBe('Accepted');
      expect(result.tags).toEqual(['json', 'test']);
      expect(result.modules).toEqual(['src/']);
    });

    it('should handle minimal JSON input', () => {
      const json = JSON.stringify({
        title: 'Minimal',
        summary: 'Minimal summary'
      });

      const result = parseJsonInput(json);

      expect(result.title).toBe('Minimal');
      expect(result.summary).toBe('Minimal summary');
      expect(result.status).toBeUndefined();
      expect(result.tags).toBeUndefined();
    });

    it('should throw on invalid JSON', () => {
      expect(() => parseJsonInput('invalid json')).toThrow('Invalid JSON input');
    });

    it('should throw on non-object JSON', () => {
      expect(() => parseJsonInput('"string"')).toThrow('JSON input must be an object');
      expect(() => parseJsonInput('123')).toThrow('JSON input must be an object');
      expect(() => parseJsonInput('null')).toThrow('JSON input must be an object');
    });

    it('should convert all values to strings', () => {
      const json = JSON.stringify({
        title: 123,
        summary: true,
        status: 'accepted',
        date: 456
      });

      const result = parseJsonInput(json);

      expect(result.title).toBe('123');
      expect(result.summary).toBe('true');
      expect(result.status).toBe('accepted');
      expect(result.date).toBe('456');
    });

    it('should handle null and undefined values correctly', () => {
      const json = JSON.stringify({
        title: 'Valid Title',
        summary: 'Valid Summary',
        status: null,
        date: undefined
      });

      const result = parseJsonInput(json);

      expect(result.title).toBe('Valid Title');
      expect(result.summary).toBe('Valid Summary');
      expect(result.status).toBeUndefined();
      expect(result.date).toBeUndefined();
    });
  });

  describe('parseCliInput', () => {
    it('should parse CLI options correctly', () => {
      const options = {
        title: 'CLI Decision',
        summary: 'From CLI',
        status: 'Proposed',
        tags: 'tag1, tag2, tag3',
        modules: 'src/api,src/db',
        date: '2024-01-01'
      };

      const result = parseCliInput(options);

      expect(result.title).toBe('CLI Decision');
      expect(result.summary).toBe('From CLI');
      expect(result.status).toBe('Proposed');
      expect(result.tags).toEqual(['tag1', 'tag2', 'tag3']);
      expect(result.modules).toEqual(['src/api', 'src/db']);
      expect(result.date).toBe('2024-01-01');
    });

    it('should handle empty options', () => {
      const result = parseCliInput({});

      expect(result.title).toBe('');
      expect(result.summary).toBe('');
      expect(result.status).toBeUndefined();
      expect(result.tags).toBeUndefined();
      expect(result.modules).toBeUndefined();
    });

    it('should parse comma-separated values correctly', () => {
      const options = {
        title: 'Test',
        summary: 'Test',
        tags: 'a,b, c , d',
        modules: 'mod1 , mod2,mod3'
      };

      const result = parseCliInput(options);

      expect(result.tags).toEqual(['a', 'b', 'c', 'd']);
      expect(result.modules).toEqual(['mod1', 'mod2', 'mod3']);
    });
  });
});