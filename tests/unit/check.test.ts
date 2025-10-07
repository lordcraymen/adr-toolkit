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
});