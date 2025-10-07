import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { runBuild } from '../../src/build.js';
import { pathExists } from '../../src/fs-utils.js';

describe('Build Integration', () => {
  let tempDir: string;
  
  beforeEach(async () => {
    tempDir = join(tmpdir(), `adr-build-integration-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });
    await mkdir(join(tempDir, 'docs', 'adr'), { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('Full Build Process', () => {
    it('should generate all artifacts from ADR files', async () => {
      // Create sample ADR files
      const acceptedAdr = `---
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
We need to choose a programming language.

# Decision
Use TypeScript.

# Consequences
Better type safety.
`;

      const proposedAdr = `---
title: "Use React"
status: "Proposed"
date: "2024-01-02"
tags:
  - react
  - ui
modules:
  - src/ui/
summary: "We propose using React for the user interface."
---

# Context
We need a UI framework.

# Decision
Use React.

# Consequences
Modern UI development.
`;

      const rejectedAdr = `---
title: "Use Angular"
status: "Rejected"
date: "2024-01-03"
tags:
  - angular
  - ui
modules:
  - src/ui/
summary: "We rejected Angular in favor of React."
---

# Context
We considered Angular.

# Decision
Rejected Angular.

# Consequences
Consistency with React choice.
`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-typescript.md'), acceptedAdr);
      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0002-react.md'), proposedAdr);
      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0003-angular.md'), rejectedAdr);

      // Run build
      await runBuild(tempDir);

      // Verify all artifacts are created
      expect(await pathExists(join(tempDir, 'docs', 'adr', 'index.json'))).toBe(true);
      expect(await pathExists(join(tempDir, 'docs', 'adr', 'ACTIVE.md'))).toBe(true);
      expect(await pathExists(join(tempDir, 'dist', 'adr-digest.json'))).toBe(true);
    });

    it('should generate correct index.json content', async () => {
      const adr = `---
title: "Test Decision"
status: "Accepted"
date: "2024-01-01"
tags:
  - test
modules:
  - src/test/
summary: "Test summary for integration test."
---

# Test Decision
Content.
`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-test.md'), adr);

      await runBuild(tempDir);

      const indexContent = await readFile(join(tempDir, 'docs', 'adr', 'index.json'), 'utf8');
      const index = JSON.parse(indexContent);

      expect(index).toMatchObject({
        total: 1,
        adrs: [{
          id: 'ADR-0001',
          title: 'Test Decision',
          status: 'Accepted', 
          summary: 'Test summary for integration test.',
          date: '2024-01-01',
          tags: ['test'],
          modules: ['src/test/'],
          path: 'docs/adr/ADR-0001-test.md'
        }]
      });

      expect(index.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should generate correct ACTIVE.md content', async () => {
      const acceptedAdr = `---
title: "Accepted Decision"
status: "Accepted"
summary: "This decision is accepted."
---
# Accepted Decision`;

      const proposedAdr = `---
title: "Proposed Decision"
status: "Proposed"
summary: "This decision is proposed."
---
# Proposed Decision`;

      const rejectedAdr = `---
title: "Rejected Decision"
status: "Rejected"
summary: "This decision is rejected."
---
# Rejected Decision`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-accepted.md'), acceptedAdr);
      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0002-proposed.md'), proposedAdr);
      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0003-rejected.md'), rejectedAdr);

      await runBuild(tempDir);

      const activeContent = await readFile(join(tempDir, 'docs', 'adr', 'ACTIVE.md'), 'utf8');

      expect(activeContent).toContain('# Active Architecture Decisions');
      expect(activeContent).toContain('Accepted Decision');
      expect(activeContent).toContain('Proposed Decision'); 
      expect(activeContent).not.toContain('Rejected Decision');
      expect(activeContent).toMatch(/Generated at \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);
    });

    it('should generate correct digest.json content', async () => {
      const acceptedAdr = `---
title: "Accepted Decision"
status: "Accepted"
summary: "This decision is accepted."
---
# Accepted Decision`;

      const approvedAdr = `---
title: "Approved Decision"
status: "Approved"
summary: "This decision is approved."
---
# Approved Decision`;

      const proposedAdr = `---
title: "Proposed Decision"
status: "Proposed"
summary: "This decision is proposed."
---
# Proposed Decision`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-accepted.md'), acceptedAdr);
      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0002-approved.md'), approvedAdr);
      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0003-proposed.md'), proposedAdr);

      await runBuild(tempDir);

      const digestContent = await readFile(join(tempDir, 'dist', 'adr-digest.json'), 'utf8');
      const digest = JSON.parse(digestContent);

      expect(digest).toMatchObject({
        count: 2,
        adrs: [
          {
            id: 'ADR-0001',
            title: 'Accepted Decision',
            summary: 'This decision is accepted.',
            path: 'docs/adr/ADR-0001-accepted.md'
          },
          {
            id: 'ADR-0002',
            title: 'Approved Decision',
            summary: 'This decision is approved.',
            path: 'docs/adr/ADR-0002-approved.md'
          }
        ]
      });

      expect(digest.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should handle empty ADR directory', async () => {
      await runBuild(tempDir);

      const indexContent = await readFile(join(tempDir, 'docs', 'adr', 'index.json'), 'utf8');
      const index = JSON.parse(indexContent);
      expect(index.total).toBe(0);
      expect(index.adrs).toEqual([]);

      const activeContent = await readFile(join(tempDir, 'docs', 'adr', 'ACTIVE.md'), 'utf8');
      expect(activeContent).toContain('# Active Architecture Decisions');

      const digestContent = await readFile(join(tempDir, 'dist', 'adr-digest.json'), 'utf8');
      const digest = JSON.parse(digestContent);
      expect(digest.count).toBe(0);
      expect(digest.adrs).toEqual([]);
    });

    it('should create directories if they do not exist', async () => {
      // Remove dist directory if it exists
      await rm(join(tempDir, 'dist'), { recursive: true, force: true });

      const adr = `---
title: "Test Decision"
status: "Accepted"
summary: "Test summary"
---
# Test Decision`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-test.md'), adr);

      await runBuild(tempDir);

      expect(await pathExists(join(tempDir, 'dist'))).toBe(true);
      expect(await pathExists(join(tempDir, 'dist', 'adr-digest.json'))).toBe(true);
    });

    it('should overwrite existing artifacts', async () => {
      // Create initial ADR
      const initialAdr = `---
title: "Initial Decision"
status: "Accepted"
summary: "Initial summary"
---
# Initial Decision`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-initial.md'), initialAdr);

      // First build
      await runBuild(tempDir);

      const firstDigestContent = await readFile(join(tempDir, 'dist', 'adr-digest.json'), 'utf8');
      const firstDigest = JSON.parse(firstDigestContent);

      // Add another ADR
      const secondAdr = `---
title: "Second Decision"
status: "Accepted"
summary: "Second summary"
---
# Second Decision`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0002-second.md'), secondAdr);

      // Second build
      await runBuild(tempDir);

      const secondDigestContent = await readFile(join(tempDir, 'dist', 'adr-digest.json'), 'utf8');
      const secondDigest = JSON.parse(secondDigestContent);

      expect(firstDigest.count).toBe(1);
      expect(secondDigest.count).toBe(2);
      expect(secondDigest.adrs[1].title).toBe('Second Decision');
    });

    it('should handle special characters in content', async () => {
      const adrWithSpecialChars = `---
title: "Decision with | Pipes & Ampersands"
status: "Accepted"
summary: "Summary with | pipes & ampersands < > brackets"
---

# Decision with | Pipes & Ampersands

Content with special characters: | & < > " '
`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-special.md'), adrWithSpecialChars);

      await runBuild(tempDir);

      const activeContent = await readFile(join(tempDir, 'docs', 'adr', 'ACTIVE.md'), 'utf8');
      expect(activeContent).toContain('Summary with \\| pipes & ampersands < > brackets');

      const indexContent = await readFile(join(tempDir, 'docs', 'adr', 'index.json'), 'utf8');
      const index = JSON.parse(indexContent);
      expect(index.adrs[0].title).toBe('Decision with | Pipes & Ampersands');
    });
  });
});