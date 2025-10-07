import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadAdrs, validateAdrs, createIndex, createDigest, createActiveMarkdown } from '../../src/adr.js';
import type { AdrDocument } from '../../src/types.js';

describe('ADR Loading and Parsing', () => {
  let tempDir: string;
  
  beforeEach(async () => {
    tempDir = join(tmpdir(), `adr-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });
    await mkdir(join(tempDir, 'docs', 'adr'), { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('loadAdrs', () => {
    it('should load valid ADR files', async () => {
      const adrContent = `---
title: "Use TypeScript"
status: "Accepted"
date: "2024-01-01"
tags:
  - typescript
  - development
modules:
  - src/
summary: "We will use TypeScript for better type safety and developer experience."
---

# Context

We need to choose a programming language for our project.

# Decision

We will use TypeScript.

# Consequences

Better type safety and tooling.
`;
      
      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-use-typescript.md'), adrContent);
      
      const adrs = await loadAdrs(tempDir);
      
      expect(adrs).toHaveLength(1);
      expect(adrs[0]).toMatchObject({
        id: 'ADR-0001',
        title: 'Use TypeScript',
        status: 'Accepted',
        summary: 'We will use TypeScript for better type safety and developer experience.',
        date: '2024-01-01',
        tags: ['typescript', 'development'],
        modules: ['src/']
      });
    });

    it('should infer ID from filename', async () => {
      const testCases = [
        { filename: 'ADR-0001-test.md', expectedId: 'ADR-0001' },
        { filename: 'adr_002_example.md', expectedId: 'ADR-0002' },
        { filename: 'adr-003-another.md', expectedId: 'ADR-0003' },
        { filename: '0004-simple.md', expectedId: 'ADR-0004' },
        { filename: 'no-number.md', expectedId: 'no-number' }
      ];

      for (const testCase of testCases) {
        const adrContent = `---
title: "Test Decision"
status: "Proposed"
summary: "Test summary"
---
# Test`;
        
        await writeFile(join(tempDir, 'docs', 'adr', testCase.filename), adrContent);
      }

      const adrs = await loadAdrs(tempDir);
      
      expect(adrs).toHaveLength(testCases.length);
      testCases.forEach((testCase, index) => {
        expect(adrs[index].id).toBe(testCase.expectedId);
      });
    });

    it('should infer title from heading when not in frontmatter', async () => {
      const adrContent = `---
status: "Accepted"
summary: "Test summary"
---

# Use React for Frontend

This is the content.
`;
      
      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-react.md'), adrContent);
      
      const adrs = await loadAdrs(tempDir);
      
      expect(adrs[0].title).toBe('Use React for Frontend');
    });

    it('should handle missing frontmatter gracefully', async () => {
      const adrContent = `# Simple Decision

This is a decision without frontmatter.
`;
      
      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-simple.md'), adrContent);
      
      const adrs = await loadAdrs(tempDir);
      
      expect(adrs[0]).toMatchObject({
        title: 'Simple Decision',
        status: '',
        summary: '',
        tags: [],
        modules: []
      });
    });

    it('should normalize array fields from strings', async () => {
      const adrContent = `---
title: "Array Test"
status: "Accepted"
summary: "Test summary"
tags: "tag1, tag2, tag3"
modules: "module1,module2"
---
# Test`;
      
      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-arrays.md'), adrContent);
      
      const adrs = await loadAdrs(tempDir);
      
      expect(adrs[0].tags).toEqual(['tag1', 'tag2', 'tag3']);
      expect(adrs[0].modules).toEqual(['module1', 'module2']);
    });

    it('should ignore template and system files', async () => {
      const validAdr = `---
title: "Valid ADR"
status: "Accepted"
summary: "Valid ADR"
---
# Valid`;

      const templateContent = `---
title: "Template"
status: "Proposed"
summary: "Template file"
---
# Template`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-valid.md'), validAdr);
      await mkdir(join(tempDir, 'docs', 'adr', 'templates'), { recursive: true });
      await writeFile(join(tempDir, 'docs', 'adr', 'templates', 'ADR-0000-template.md'), templateContent);
      await writeFile(join(tempDir, 'docs', 'adr', 'README.md'), '# README');
      await writeFile(join(tempDir, 'docs', 'adr', 'ACTIVE.md'), '# ACTIVE');
      await writeFile(join(tempDir, 'docs', 'adr', 'index.json'), '{}');

      const adrs = await loadAdrs(tempDir);
      
      expect(adrs).toHaveLength(1);
      expect(adrs[0].title).toBe('Valid ADR');
    });
  });

  describe('validateAdrs', () => {
    const createMockAdr = (overrides: Partial<AdrDocument> = {}): AdrDocument => ({
      id: 'ADR-0001',
      title: 'Test Decision',
      status: 'Accepted',
      summary: 'Test summary',
      date: '2024-01-01',
      tags: [],
      modules: [],
      path: '/test/path',
      relativePath: 'docs/adr/test.md',
      body: 'Test body',
      ...overrides
    });

    it('should validate correct ADRs', () => {
      const adrs = [createMockAdr()];
      const errors = validateAdrs(adrs);
      
      expect(errors).toHaveLength(0);
    });

    it('should detect missing title', () => {
      const adrs = [createMockAdr({ title: '' })];
      const errors = validateAdrs(adrs);
      
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Missing title');
    });

    it('should detect missing status', () => {
      const adrs = [createMockAdr({ status: '' })];
      const errors = validateAdrs(adrs);
      
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Missing status');
    });

    it('should detect invalid status', () => {
      const adrs = [createMockAdr({ status: 'InvalidStatus' })];
      const errors = validateAdrs(adrs);
      
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Unknown status');
    });

    it('should validate all allowed statuses', () => {
      const validStatuses = ['accepted', 'approved', 'proposed', 'draft', 'rejected', 'deprecated', 'superseded'];
      
      for (const status of validStatuses) {
        const adrs = [createMockAdr({ status })];
        const errors = validateAdrs(adrs);
        expect(errors).toHaveLength(0);
      }
    });

    it('should detect missing summary', () => {
      const adrs = [createMockAdr({ summary: '' })];
      const errors = validateAdrs(adrs);
      
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Missing summary');
    });

    it('should detect summary too long', () => {
      const longSummary = 'x'.repeat(301);
      const adrs = [createMockAdr({ summary: longSummary })];
      const errors = validateAdrs(adrs);
      
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Summary too long');
    });

    it('should accumulate multiple errors', () => {
      const adrs = [
        createMockAdr({ title: '', status: '', summary: '' })
      ];
      const errors = validateAdrs(adrs);
      
      expect(errors.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('createIndex', () => {
    it('should create ADR index', () => {
      const adrs = [
        {
          id: 'ADR-0001',
          title: 'First Decision',
          status: 'Accepted',
          summary: 'First summary',
          date: '2024-01-01',
          tags: ['tag1'],
          modules: ['src/'],
          path: '/path/ADR-0001.md',
          relativePath: 'docs/adr/ADR-0001.md',
          body: 'body'
        }
      ] as AdrDocument[];

      const generatedAt = '2024-01-01T00:00:00.000Z';
      const index = createIndex(adrs, generatedAt);

      expect(index).toMatchObject({
        generatedAt,
        total: 1,
        adrs: [{
          id: 'ADR-0001',
          title: 'First Decision',
          status: 'Accepted',
          summary: 'First summary',
          date: '2024-01-01',
          tags: ['tag1'],
          modules: ['src/'],
          path: 'docs/adr/ADR-0001.md'
        }]
      });
    });
  });

  describe('createDigest', () => {
    it('should include only accepted/approved ADRs', () => {
      const adrs = [
        { status: 'Accepted', id: 'ADR-0001', title: 'Accepted', summary: 'summary', relativePath: 'path1' },
        { status: 'Approved', id: 'ADR-0002', title: 'Approved', summary: 'summary', relativePath: 'path2' },
        { status: 'Proposed', id: 'ADR-0003', title: 'Proposed', summary: 'summary', relativePath: 'path3' },
        { status: 'Rejected', id: 'ADR-0004', title: 'Rejected', summary: 'summary', relativePath: 'path4' }
      ] as AdrDocument[];

      const generatedAt = '2024-01-01T00:00:00.000Z';
      const digest = createDigest(adrs, generatedAt);

      expect(digest.count).toBe(2);
      expect(digest.adrs).toHaveLength(2);
      expect(digest.adrs[0].title).toBe('Accepted');
      expect(digest.adrs[1].title).toBe('Approved');
    });
  });

  describe('createActiveMarkdown', () => {
    it('should exclude closed statuses', () => {
      const adrs = [
        { status: 'Accepted', id: 'ADR-0001', title: 'Active', summary: 'summary' },
        { status: 'Proposed', id: 'ADR-0002', title: 'Proposed', summary: 'summary' },
        { status: 'Rejected', id: 'ADR-0003', title: 'Rejected', summary: 'summary' },
        { status: 'Deprecated', id: 'ADR-0004', title: 'Deprecated', summary: 'summary' },
        { status: 'Superseded', id: 'ADR-0005', title: 'Superseded', summary: 'summary' }
      ] as AdrDocument[];

      const generatedAt = '2024-01-01T00:00:00.000Z';
      const markdown = createActiveMarkdown(adrs, generatedAt);

      expect(markdown).toContain('Active');
      expect(markdown).toContain('Proposed');
      expect(markdown).not.toContain('Rejected');
      expect(markdown).not.toContain('Deprecated');
      expect(markdown).not.toContain('Superseded');
    });

    it('should escape pipe characters in summaries', () => {
      const adrs = [
        { status: 'Accepted', id: 'ADR-0001', title: 'Test', summary: 'summary with | pipe' }
      ] as AdrDocument[];

      const generatedAt = '2024-01-01T00:00:00.000Z';
      const markdown = createActiveMarkdown(adrs, generatedAt);

      expect(markdown).toContain('summary with \\| pipe');
    });
  });
});