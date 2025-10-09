/**
 * Test to verify that key TypeScript types are properly exported for downstream integrations
 */

import { describe, it, expect } from 'vitest';
import type {
  AdrIndex,
  AdrDigest,
  AdrIndexEntry,
  AdrDigestEntry,
  AdrDocument,
  AdrFrontmatter,
  CheckResult,
  BuildResult,
  AffectedResult,
  ValidationError,
  OutputFormat
} from '../../src/index.js';

describe('Type Exports for Public API', () => {
  it('should export AdrIndex type for downstream tools', () => {
    const exampleIndex: AdrIndex = {
      generatedAt: new Date().toISOString(),
      total: 0,
      adrs: []
    };
    
    expect(exampleIndex).toBeDefined();
    expect(typeof exampleIndex.generatedAt).toBe('string');
    expect(typeof exampleIndex.total).toBe('number');
    expect(Array.isArray(exampleIndex.adrs)).toBe(true);
  });

  it('should export AdrDigest type for downstream tools', () => {
    const exampleDigest: AdrDigest = {
      generatedAt: new Date().toISOString(),
      count: 0,
      adrs: []
    };
    
    expect(exampleDigest).toBeDefined();
    expect(typeof exampleDigest.generatedAt).toBe('string');
    expect(typeof exampleDigest.count).toBe('number');
    expect(Array.isArray(exampleDigest.adrs)).toBe(true);
  });

  it('should export AdrDocument type for downstream tools', () => {
    const exampleDocument: AdrDocument = {
      id: 'ADR-0001',
      title: 'Example ADR',
      status: 'accepted',
      summary: 'This is an example',
      tags: [],
      modules: [],
      path: '/absolute/path/to/adr',
      relativePath: 'docs/adr/ADR-0001-example.md',
      body: 'Content of the ADR'
    };
    
    expect(exampleDocument).toBeDefined();
    expect(exampleDocument.id).toBe('ADR-0001');
    expect(Array.isArray(exampleDocument.tags)).toBe(true);
  });

  it('should export CheckResult type for CLI integrations', () => {
    const exampleResult: CheckResult = {
      ok: true,
      adrCount: 5
    };
    
    expect(exampleResult).toBeDefined();
    expect(typeof exampleResult.ok).toBe('boolean');
    expect(typeof exampleResult.adrCount).toBe('number');
  });

  it('should export BuildResult type for CLI integrations', () => {
    const exampleResult: BuildResult = {
      ok: true,
      adrCount: 5,
      artifactsGenerated: ['index.json', 'ACTIVE.md']
    };
    
    expect(exampleResult).toBeDefined();
    expect(typeof exampleResult.ok).toBe('boolean');
    expect(Array.isArray(exampleResult.artifactsGenerated)).toBe(true);
  });

  it('should export OutputFormat type for CLI integrations', () => {
    const jsonFormat: OutputFormat = 'json';
    const textFormat: OutputFormat = 'text';
    
    expect(jsonFormat).toBe('json');
    expect(textFormat).toBe('text');
  });
});