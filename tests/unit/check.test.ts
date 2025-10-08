import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { runCheck } from '../../src/check.js';

describe('ADR Check Functionality', () => {
  let tempDir: string;
  
  beforeEach(async () => {
    tempDir = join(tmpdir(), `adr-check-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });
    await mkdir(join(tempDir, 'docs', 'adr'), { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('runCheck', () => {
    it('should pass validation for valid ADRs', async () => {
      const validAdr = `---
title: "Valid Decision"
status: "Accepted"
summary: "This is a valid decision with proper summary that meets all requirements."
---
# Valid Decision

This is a valid ADR.
`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-valid.md'), validAdr);

      const result = await runCheck(tempDir);

      expect(result.ok).toBe(true);
    });

    it('should fail validation for invalid ADRs', async () => {
      const invalidAdr = `---
title: ""
status: "InvalidStatus"
summary: ""
---
# Invalid ADR
`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-invalid.md'), invalidAdr);

      const result = await runCheck(tempDir);

      expect(result.ok).toBe(false);
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
# Invalid Decision with bad status`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-valid.md'), validAdr);
      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0002-invalid.md'), invalidAdr);

      const result = await runCheck(tempDir);

      expect(result.ok).toBe(false);
    });

    it('should handle empty ADR directory', async () => {
      const result = await runCheck(tempDir);

      expect(result.ok).toBe(true);
    });

    it('should validate all required fields', async () => {
      const testCases = [
        {
          name: 'valid ADR with frontmatter title',
          adr: `---
title: "Valid Title"
status: "Accepted"
summary: "Valid summary"
---
# Content Heading`,
          shouldFail: false
        },
        {
          name: 'valid ADR with inferred title from heading',
          adr: `---
status: "Accepted"
summary: "Valid summary"
---
# Inferred Title`,
          shouldFail: false
        },
        {
          name: 'missing status', 
          adr: `---
title: "Valid Title"
summary: "Valid summary"
---
# Valid Title`,
          shouldFail: true
        },
        {
          name: 'missing summary',
          adr: `---
title: "Valid Title"
status: "Accepted"
---
# Valid Title`,
          shouldFail: true
        },
        {
          name: 'invalid status',
          adr: `---
title: "Valid Title"
status: "NotValidStatus"
summary: "Valid summary"
---
# Valid Title`,
          shouldFail: true
        },
        {
          name: 'summary too long',
          adr: `---
title: "Valid Title"
status: "Accepted"
summary: "${'x'.repeat(301)}"
---
# Valid Title`,
          shouldFail: true
        }
      ];

      for (const testCase of testCases) {
        // Clean up before each test
        await rm(join(tempDir, 'docs', 'adr'), { recursive: true, force: true });
        await mkdir(join(tempDir, 'docs', 'adr'), { recursive: true });

        await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-test.md'), testCase.adr);

        const result = await runCheck(tempDir);

        if (testCase.shouldFail) {
          expect(result.ok).toBe(false);
        } else {
          expect(result.ok).toBe(true);
        }
      }
    });

    it('should validate all allowed statuses', async () => {
      const validStatuses = ['Accepted', 'Approved', 'Proposed', 'Draft', 'Rejected', 'Deprecated', 'Superseded'];

      for (const status of validStatuses) {
        // Clean up before each test
        await rm(join(tempDir, 'docs', 'adr'), { recursive: true, force: true });
        await mkdir(join(tempDir, 'docs', 'adr'), { recursive: true });

        const adr = `---
title: "Status Test"
status: "${status}"
summary: "Testing status validation"
---
# Status Test`;

        await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-status.md'), adr);

        const result = await runCheck(tempDir);

        expect(result.ok).toBe(true);
      }
    });

    it('should work with explicit directory parameter', async () => {
      const validAdr = `---
title: "Valid Decision"
status: "Accepted"
summary: "Valid summary"
---
# Valid Decision`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-valid.md'), validAdr);

      const result = await runCheck(tempDir);
      expect(result.ok).toBe(true);
    });
  });

  describe('runCheck with JSON format', () => {
    it('should return structured CheckResult for valid ADRs with JSON format', async () => {
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

      const result = await runCheck(tempDir, 'json');

      console.log = originalLog;

      // Check the return value structure
      expect(result).toMatchObject({
        ok: true,
        adrCount: 1,
        errors: undefined
      });

      // Check that JSON was output to console
      expect(consoleLogs).toHaveLength(1);
      const outputJson = JSON.parse(consoleLogs[0]);
      expect(outputJson).toMatchObject({
        ok: true,
        adrCount: 1
      });
      expect(outputJson.errors).toBeUndefined();
    });

    it('should return structured CheckResult for invalid ADRs with JSON format', async () => {
      const invalidAdr = `---
title: ""
status: "InvalidStatus"
summary: ""
---
# Invalid ADR
`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-invalid.md'), invalidAdr);

      // Mock console.log to capture JSON output
      const consoleLogs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => {
        consoleLogs.push(args.join(' '));
      };

      const result = await runCheck(tempDir, 'json');

      console.log = originalLog;

      // Check the return value structure
      expect(result.ok).toBe(false);
      expect(result.adrCount).toBe(1);
      expect(result.errors).toBeDefined();
      expect(result.errors).toHaveLength(2); // Missing title and invalid status

      // Check that JSON was output to console
      expect(consoleLogs).toHaveLength(1);
      const outputJson = JSON.parse(consoleLogs[0]);
      expect(outputJson).toMatchObject({
        ok: false,
        adrCount: 1
      });
      expect(outputJson.errors).toBeDefined();
      expect(outputJson.errors).toHaveLength(2);
    });

    it('should return structured CheckResult for empty directory with JSON format', async () => {
      // Mock console.log to capture JSON output
      const consoleLogs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => {
        consoleLogs.push(args.join(' '));
      };

      const result = await runCheck(tempDir, 'json');

      console.log = originalLog;

      // Check the return value structure
      expect(result).toMatchObject({
        ok: true,
        adrCount: 0,
        errors: undefined
      });

      // Check that JSON was output to console
      expect(consoleLogs).toHaveLength(1);
      const outputJson = JSON.parse(consoleLogs[0]);
      expect(outputJson).toMatchObject({
        ok: true,
        adrCount: 0
      });
      expect(outputJson.errors).toBeUndefined();
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

      const result = await runCheck(tempDir, 'text');

      console.log = originalLog;

      // Check that text was output (not JSON)
      expect(consoleLogs).toHaveLength(1);
      expect(consoleLogs[0]).toContain('✓ All 1 ADRs look good.');
      
      // JSON parsing should fail
      expect(() => JSON.parse(consoleLogs[0])).toThrow();
    });
  });

  describe('Error scenarios with JSON format', () => {
    it('should return proper error structure for multiple validation errors', async () => {
      const invalidAdr1 = `---
title: "Valid Title"
status: "InvalidStatus"
summary: ""
---
# Invalid ADR 1`;

      const invalidAdr2 = `---
title: ""
status: "Accepted"
summary: "Valid summary but missing title"
---
# Invalid ADR 2`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-invalid1.md'), invalidAdr1);
      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0002-invalid2.md'), invalidAdr2);

      // Mock console.log to capture JSON output
      const consoleLogs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => {
        consoleLogs.push(args.join(' '));
      };

      const result = await runCheck(tempDir, 'json');

      console.log = originalLog;

      // Check the return value structure
      expect(result.ok).toBe(false);
      expect(result.adrCount).toBe(2);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);

      // Verify each error has proper structure
      for (const error of result.errors!) {
        expect(error).toHaveProperty('file');
        expect(error).toHaveProperty('message');
        expect(typeof error.file).toBe('string');
        expect(typeof error.message).toBe('string');
      }

      // Check JSON output structure
      expect(consoleLogs).toHaveLength(1);
      const outputJson = JSON.parse(consoleLogs[0]);
      expect(outputJson).toMatchObject({
        ok: false,
        adrCount: 2
      });
      expect(outputJson.errors).toBeDefined();
      expect(Array.isArray(outputJson.errors)).toBe(true);
    });

    it('should handle configuration errors with JSON format', async () => {
      // Create an invalid config file
      const invalidConfig = `{
        "invalid": "json structure"
        "missing": "comma"
      }`;
      
      await writeFile(join(tempDir, '.adrx.config.json'), invalidConfig);

      const validAdr = `---
title: "Valid Decision"
status: "Accepted"  
summary: "Valid summary"
---
# Valid Decision`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-valid.md'), validAdr);

      // Mock console.log to capture JSON output
      const consoleLogs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => {
        consoleLogs.push(args.join(' '));
      };

      // Use runCheckWithConfig to test configuration error handling
      const { runCheckWithConfig } = await import('../../src/check.js');
      const result = await runCheckWithConfig(tempDir, 'json');

      console.log = originalLog;

      // Should handle config error gracefully
      expect(result.ok).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('Configuration error');

      // Check JSON output
      expect(consoleLogs).toHaveLength(1);
      const outputJson = JSON.parse(consoleLogs[0]);
      expect(outputJson.ok).toBe(false);
      expect(outputJson.errors).toBeDefined();
    });

    it('should preserve error details in JSON format', async () => {
      const longSummaryAdr = `---
title: "Test Decision"
status: "Accepted"
summary: "${'A'.repeat(301)}" # Summary over 300 characters
---
# Test Decision`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-long.md'), longSummaryAdr);

      // Mock console.log to capture JSON output
      const consoleLogs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => {
        consoleLogs.push(args.join(' '));
      };

      const result = await runCheck(tempDir, 'json');

      console.log = originalLog;

      expect(result.ok).toBe(false);
      expect(result.errors).toBeDefined();
      
      // Find the summary length error
      const summaryError = result.errors!.find(e => e.message.includes('too long'));
      expect(summaryError).toBeDefined();
      expect(summaryError!.file).toContain('ADR-0001-long.md');

      // Check JSON preserves the exact error message
      const outputJson = JSON.parse(consoleLogs[0]);
      const jsonSummaryError = outputJson.errors.find((e: any) => e.message.includes('too long'));
      expect(jsonSummaryError).toBeDefined();
      expect(jsonSummaryError.message).toBe(summaryError!.message);
    });
  });
});