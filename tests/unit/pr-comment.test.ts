import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { runPrComment } from '../../src/pr-comment.js';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('PR Comment Functionality', () => {
  let tempDir: string;
  let originalEnv: NodeJS.ProcessEnv;
  
  beforeEach(async () => {
    tempDir = join(tmpdir(), `adr-pr-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });
    await mkdir(join(tempDir, 'docs', 'adr'), { recursive: true });
    
    // Save original environment
    originalEnv = { ...process.env };
    
    // Reset mocks
    mockFetch.mockReset();
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
    
    // Restore original environment
    process.env = originalEnv;
  });

  describe('runPrComment', () => {
    it('should skip comment when GITHUB_TOKEN is missing', async () => {
      delete process.env.GITHUB_TOKEN;
      process.env.GITHUB_REPOSITORY = 'owner/repo';
      process.env.GITHUB_REF = 'refs/pull/123/merge';

      const result = await runPrComment(tempDir);

      expect(result.posted).toBe(false);
      expect(result.reason).toContain('GITHUB_TOKEN missing');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should skip comment when GITHUB_REPOSITORY is missing', async () => {
      process.env.GITHUB_TOKEN = 'token';
      delete process.env.GITHUB_REPOSITORY;
      process.env.GITHUB_REF = 'refs/pull/123/merge';

      const result = await runPrComment(tempDir);

      expect(result.posted).toBe(false);
      expect(result.reason).toContain('GITHUB_REPOSITORY missing');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should skip comment when PR context is missing', async () => {
      process.env.GITHUB_TOKEN = 'token';
      process.env.GITHUB_REPOSITORY = 'owner/repo';
      delete process.env.GITHUB_REF;
      delete process.env.PR_NUMBER;
      delete process.env.GITHUB_EVENT_NUMBER;

      const result = await runPrComment(tempDir);

      expect(result.posted).toBe(false);
      expect(result.reason).toContain('Pull request context missing');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should detect PR number from GITHUB_REF', async () => {
      process.env.GITHUB_TOKEN = 'token';
      process.env.GITHUB_REPOSITORY = 'owner/repo';
      process.env.GITHUB_REF = 'refs/pull/456/merge';

      // Create accepted ADR
      const adr = `---
title: "Test Decision"
status: "Accepted"
summary: "Test summary"
---
# Test Decision`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-test.md'), adr);

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200
      });

      const result = await runPrComment(tempDir);

      expect(result.posted).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo/issues/456/comments',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer token'
          })
        })
      );
    });

    it('should detect PR number from PR_NUMBER', async () => {
      process.env.GITHUB_TOKEN = 'token';
      process.env.GITHUB_REPOSITORY = 'owner/repo';
      process.env.PR_NUMBER = '789';

      // Create accepted ADR
      const adr = `---
title: "Test Decision"
status: "Accepted"
summary: "Test summary"
---
# Test Decision`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-test.md'), adr);

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200
      });

      await runPrComment(tempDir);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo/issues/789/comments',
        expect.anything()
      );
    });

    it('should skip comment when no accepted ADRs exist', async () => {
      process.env.GITHUB_TOKEN = 'token';
      process.env.GITHUB_REPOSITORY = 'owner/repo';
      process.env.GITHUB_REF = 'refs/pull/123/merge';

      // Create non-accepted ADR
      const adr = `---
title: "Test Decision"
status: "Proposed"
summary: "Test summary"
---
# Test Decision`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-test.md'), adr);

      const result = await runPrComment(tempDir);

      expect(result.posted).toBe(false);
      expect(result.reason).toContain('No accepted ADRs found');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should post comment with accepted ADRs', async () => {
      process.env.GITHUB_TOKEN = 'token';
      process.env.GITHUB_REPOSITORY = 'owner/repo';
      process.env.GITHUB_REF = 'refs/pull/123/merge';

      // Create accepted ADRs
      const adr1 = `---
title: "First Decision"
status: "Accepted"
summary: "First summary"
---
# First Decision`;

      const adr2 = `---
title: "Second Decision"
status: "Approved"
summary: "Second summary"
---
# Second Decision`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-first.md'), adr1);
      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0002-second.md'), adr2);

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200
      });

      const result = await runPrComment(tempDir);

      expect(result.posted).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo/issues/123/comments',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer token'
          })
        })
      );

      const callArgs = mockFetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      expect(body.body).toContain('ADR Digest');
      expect(body.body).toContain('First Decision');
      expect(body.body).toContain('Second Decision');
    });

    it('should handle GitHub API failure gracefully', async () => {
      process.env.GITHUB_TOKEN = 'token';
      process.env.GITHUB_REPOSITORY = 'owner/repo';
      process.env.GITHUB_REF = 'refs/pull/123/merge';

      // Create accepted ADR
      const adr = `---
title: "Test Decision"
status: "Accepted"
summary: "Test summary"
---
# Test Decision`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-test.md'), adr);

      mockFetch.mockResolvedValue({
        ok: false,
        status: 401
      });

      const result = await runPrComment(tempDir);

      expect(result.posted).toBe(false);
      expect(result.reason).toContain('GitHub API request failed with status 401');
    });

    it('should format comment correctly', async () => {
      process.env.GITHUB_TOKEN = 'token';
      process.env.GITHUB_REPOSITORY = 'owner/repo';
      process.env.GITHUB_REF = 'refs/pull/123/merge';

      // Create ADR with pipe characters in summary
      const adr = `---
title: "Decision with | Pipes"
status: "Accepted"
summary: "Summary with | pipe characters | in it"
---
# Decision`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-pipes.md'), adr);

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200
      });

      await runPrComment(tempDir);

      const callArgs = mockFetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      
      // Check that pipes are escaped
      expect(body.body).toContain('Summary with \\| pipe characters \\| in it');
      
      // Check table format
      expect(body.body).toContain('| ID | Title | Summary |');
      expect(body.body).toContain('| --- | --- | --- |');
      
      // Check footer
      expect(body.body).toContain('_(automated comment via adrx)_');
    });

    it('should truncate long summaries', async () => {
      process.env.GITHUB_TOKEN = 'token';
      process.env.GITHUB_REPOSITORY = 'owner/repo';
      process.env.GITHUB_REF = 'refs/pull/123/merge';

      // Create ADR with very long summary
      const longSummary = 'x'.repeat(200);
      const adr = `---
title: "Long Summary Decision"
status: "Accepted"
summary: "${longSummary}"
---
# Decision`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-long.md'), adr);

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200
      });

      await runPrComment(tempDir);

      const callArgs = mockFetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      
      // Summary should be truncated and end with ellipsis
      expect(body.body).toContain('…');
      expect(body.body).not.toContain(longSummary);
    });

    it('should include generation timestamp', async () => {
      process.env.GITHUB_TOKEN = 'token';
      process.env.GITHUB_REPOSITORY = 'owner/repo';
      process.env.GITHUB_REF = 'refs/pull/123/merge';

      // Create accepted ADR
      const adr = `---
title: "Test Decision"
status: "Accepted"
summary: "Test summary"
---
# Test Decision`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-test.md'), adr);

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200
      });

      await runPrComment(tempDir);

      const callArgs = mockFetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      
      expect(body.body).toMatch(/Generated at \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);
    });
  });
});