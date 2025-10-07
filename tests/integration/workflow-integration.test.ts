import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { initWorkspace } from '../../src/init.js';
import { runCheck } from '../../src/check.js';
import { runBuild } from '../../src/build.js';
import { runAffected } from '../../src/affected.js';
import { loadAdrs } from '../../src/adr.js';

const execFileAsync = promisify(execFile);

describe('Workflow Integration', () => {
  let tempDir: string;
  
  beforeEach(async () => {
    tempDir = join(tmpdir(), `adr-workflow-integration-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('Complete ADR Workflow', () => {
    it('should support full ADR lifecycle', async () => {
      // Step 1: Initialize workspace
      const initResult = await initWorkspace(tempDir, { interactive: false });
      expect(initResult.created.length).toBeGreaterThan(0);

      // Step 2: Create an ADR
      const newAdr = `---
title: "Use PostgreSQL Database"
status: "Proposed"
date: "2024-01-01"
tags:
  - database
  - postgresql
modules:
  - src/database/
summary: "We propose using PostgreSQL as our primary database for its reliability and feature set."
---

# Context

We need to choose a database system for our application.

# Decision

We will use PostgreSQL as our primary database.

# Consequences

- Reliable ACID transactions
- Rich feature set
- Strong community support
- Need to learn PostgreSQL-specific features
`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-postgresql.md'), newAdr);

      // Step 3: Check validation (should pass)
      const checkResult = await runCheck(tempDir);
      expect(checkResult.ok).toBe(true);

      // Step 4: Build artifacts
      await runBuild(tempDir);

      // Step 5: Update ADR status
      const updatedAdr = newAdr.replace('status: "Proposed"', 'status: "Accepted"');
      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-postgresql.md'), updatedAdr);

      // Step 6: Check validation again (should still pass)
      const checkResult2 = await runCheck(tempDir);
      expect(checkResult2.ok).toBe(true);

      // Step 7: Rebuild artifacts
      await runBuild(tempDir);

      // Verify the complete workflow worked
      expect(checkResult.ok).toBe(true);
      expect(checkResult2.ok).toBe(true);
    });

    it('should handle invalid ADR creation and correction', async () => {
      // Initialize workspace
      await initWorkspace(tempDir, { interactive: false });

      // Create invalid ADR (missing required fields)
      const invalidAdr = `---
title: ""
status: "InvalidStatus"
summary: ""
---

# Invalid ADR

This ADR has validation errors.
`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-invalid.md'), invalidAdr);

      // Check should fail
      const failedCheck = await runCheck(tempDir);
      expect(failedCheck.ok).toBe(false);

      // Correct the ADR
      const correctedAdr = `---
title: "Corrected Decision"
status: "Accepted"
summary: "This ADR has been corrected to meet validation requirements."
---

# Corrected Decision

This ADR is now valid.
`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-invalid.md'), correctedAdr);

      // Check should now pass
      const passedCheck = await runCheck(tempDir);
      expect(passedCheck.ok).toBe(true);

      // Build should work
      await runBuild(tempDir);
    });

    it('should handle multiple ADRs with different statuses', async () => {
      await initWorkspace(tempDir, { interactive: false });

      // Create multiple ADRs with different statuses
      const adrs = [
        {
          filename: 'ADR-0001-accepted.md',
          content: `---
title: "Accepted Decision"
status: "Accepted"
summary: "This decision has been accepted."
---
# Accepted Decision`
        },
        {
          filename: 'ADR-0002-proposed.md',
          content: `---
title: "Proposed Decision"
status: "Proposed"
summary: "This decision is under consideration."
---
# Proposed Decision`
        },
        {
          filename: 'ADR-0003-rejected.md',
          content: `---
title: "Rejected Decision"
status: "Rejected"
summary: "This decision was rejected."
---
# Rejected Decision`
        },
        {
          filename: 'ADR-0004-deprecated.md',
          content: `---
title: "Deprecated Decision"
status: "Deprecated"
summary: "This decision is no longer relevant."
---
# Deprecated Decision`
        }
      ];

      for (const adr of adrs) {
        await writeFile(join(tempDir, 'docs', 'adr', adr.filename), adr.content);
      }

      // All ADRs should pass validation
      const checkResult = await runCheck(tempDir);
      expect(checkResult.ok).toBe(true);

      // Build should work
      await runBuild(tempDir);

      // Verify different status handling in artifacts
      const { readFile } = await import('node:fs/promises');
      
      // Check ACTIVE.md excludes closed statuses
      const activeContent = await readFile(join(tempDir, 'docs', 'adr', 'ACTIVE.md'), 'utf8');
      expect(activeContent).toContain('Accepted Decision');
      expect(activeContent).toContain('Proposed Decision');
      expect(activeContent).not.toContain('Rejected Decision');
      expect(activeContent).not.toContain('Deprecated Decision');

      // Check digest includes only accepted/approved
      const digestContent = await readFile(join(tempDir, 'dist', 'adr-digest.json'), 'utf8');
      const digest = JSON.parse(digestContent);
      expect(digest.count).toBe(1);
      expect(digest.adrs[0].title).toBe('Accepted Decision');
    });
  });

  describe('Git Integration Workflow', () => {
    it('should validate ADR module structure without git operations', async () => {
      // Initialize ADR workspace
      await initWorkspace(tempDir, { interactive: false });

      // Create ADR with module dependencies
      const adr = `---
title: "Frontend Architecture"
status: "Accepted"
tags:
  - frontend
  - react
modules:
  - src/components/
  - src/ui/
summary: "Architecture decisions for frontend development."
---

# Frontend Architecture

We use React for frontend development.
`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-frontend.md'), adr);

      // Test that the ADR system can parse module dependencies correctly
      const adrs = await loadAdrs(tempDir);
      expect(adrs).toHaveLength(1);
      expect(adrs[0].modules).toContain('src/components/');
      expect(adrs[0].modules).toContain('src/ui/');
      expect(adrs[0].title).toBe('Frontend Architecture');
      expect(adrs[0].status).toBe('Accepted');
    });

    it('should handle ADR parsing and validation correctly', async () => {
      await initWorkspace(tempDir, { interactive: false });

      // Create ADR with various metadata
      const adr = `---
title: "Database Choice"
status: "Accepted"
tags: ["database", "postgres"]
modules: ["src/database/", "migrations/"]
summary: "Choosing database technology."
---
# Database Choice`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-database.md'), adr);

      // Verify ADR can be loaded and parsed correctly
      const adrs = await loadAdrs(tempDir);
      expect(adrs).toHaveLength(1);
      expect(adrs[0].title).toBe('Database Choice');
      expect(adrs[0].status).toBe('Accepted');
      expect(adrs[0].tags).toContain('database');
      expect(adrs[0].tags).toContain('postgres');
      expect(adrs[0].modules).toContain('src/database/');
      expect(adrs[0].modules).toContain('migrations/');
    });

    it('should support multiple ADRs with different metadata', async () => {
      await initWorkspace(tempDir, { interactive: false });

      // Create multiple ADRs with different dependencies
      const frontendAdr = `---
title: "Frontend Framework"
status: "Accepted"
tags: ["frontend", "react"]
modules: ["src/ui/", "src/components/"]
summary: "Use React for frontend."
---
# Frontend Framework`;

      const backendAdr = `---
title: "Backend Framework"
status: "Accepted"
tags: ["backend", "api"]
modules: ["src/api/", "src/services/"]
summary: "Use Express for backend."
---
# Backend Framework`;

      const databaseAdr = `---
title: "Database Technology"
status: "Accepted"
tags: ["database", "postgres"]
modules: ["src/database/", "migrations/"]
summary: "Use PostgreSQL for database."
---
# Database Technology`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-frontend.md'), frontendAdr);
      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0002-backend.md'), backendAdr);
      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0003-database.md'), databaseAdr);

      // Verify all ADRs can be loaded and have correct metadata
      const adrs = await loadAdrs(tempDir);
      expect(adrs).toHaveLength(3);

      // Find each ADR and verify its properties
      const frontendDoc = adrs.find(adr => adr.id === 'ADR-0001');
      const backendDoc = adrs.find(adr => adr.id === 'ADR-0002');  
      const databaseDoc = adrs.find(adr => adr.id === 'ADR-0003');

      expect(frontendDoc?.title).toBe('Frontend Framework');
      expect(frontendDoc?.tags).toContain('frontend');
      expect(frontendDoc?.modules).toContain('src/ui/');

      expect(backendDoc?.title).toBe('Backend Framework');
      expect(backendDoc?.tags).toContain('backend');
      expect(backendDoc?.modules).toContain('src/api/');

      expect(databaseDoc?.title).toBe('Database Technology');
      expect(databaseDoc?.tags).toContain('database');
      expect(databaseDoc?.modules).toContain('src/database/');
    });
  });
});