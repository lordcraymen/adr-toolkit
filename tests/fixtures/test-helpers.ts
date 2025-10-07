import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export interface TestAdrFixture {
  filename: string;
  title: string;
  status: string;
  summary: string;
  date?: string;
  tags?: string[];
  modules?: string[];
  body?: string;
}

export async function createTestAdr(baseDir: string, adr: TestAdrFixture): Promise<void> {
  const frontmatter = [
    '---',
    `title: "${adr.title}"`,
    `status: "${adr.status}"`,
    adr.date ? `date: "${adr.date}"` : null,
    adr.tags && adr.tags.length > 0 ? `tags:\n${adr.tags.map(tag => `  - ${tag}`).join('\n')}` : null,
    adr.modules && adr.modules.length > 0 ? `modules:\n${adr.modules.map(mod => `  - ${mod}`).join('\n')}` : null,
    `summary: "${adr.summary}"`,
    '---'
  ].filter(Boolean).join('\n');

  const body = adr.body || `# ${adr.title}\n\nThis is the content of the ADR.`;
  const content = `${frontmatter}\n\n${body}`;

  const adrDir = join(baseDir, 'docs', 'adr');
  await mkdir(adrDir, { recursive: true });
  await writeFile(join(adrDir, adr.filename), content);
}

export async function createMultipleTestAdrs(baseDir: string, adrs: TestAdrFixture[]): Promise<void> {
  for (const adr of adrs) {
    await createTestAdr(baseDir, adr);
  }
}

export const sampleAdrs: TestAdrFixture[] = [
  {
    filename: 'ADR-0001-use-typescript.md',
    title: 'Use TypeScript',
    status: 'Accepted',
    date: '2024-01-01',
    tags: ['typescript', 'development', 'tooling'],
    modules: ['src/', 'tests/'],
    summary: 'We will use TypeScript for better type safety and developer experience across the entire codebase.'
  },
  {
    filename: 'ADR-0002-react-frontend.md',
    title: 'Use React for Frontend',
    status: 'Accepted',
    date: '2024-01-02',
    tags: ['react', 'frontend', 'ui'],
    modules: ['src/ui/', 'src/components/'],
    summary: 'React will be our primary frontend framework for building user interfaces.'
  },
  {
    filename: 'ADR-0003-express-backend.md',
    title: 'Use Express for Backend API',
    status: 'Proposed',
    date: '2024-01-03',
    tags: ['express', 'backend', 'api'],
    modules: ['src/api/', 'src/routes/'],
    summary: 'Express.js is proposed as our backend framework for REST API development.'
  },
  {
    filename: 'ADR-0004-postgresql-database.md',
    title: 'Use PostgreSQL as Primary Database',
    status: 'Accepted',
    date: '2024-01-04',
    tags: ['postgresql', 'database', 'persistence'],
    modules: ['src/database/', 'migrations/'],
    summary: 'PostgreSQL is chosen as our primary database for its reliability and feature set.'
  },
  {
    filename: 'ADR-0005-mongodb-rejected.md',
    title: 'MongoDB Considered but Rejected',
    status: 'Rejected',
    date: '2024-01-05',
    tags: ['mongodb', 'database', 'nosql'],
    modules: ['src/database/'],
    summary: 'MongoDB was considered but rejected in favor of PostgreSQL for consistency.'
  },
  {
    filename: 'ADR-0006-deprecated-jquery.md',
    title: 'jQuery Usage Deprecated',
    status: 'Deprecated',
    date: '2024-01-06',
    tags: ['jquery', 'frontend', 'legacy'],
    modules: ['src/legacy/'],
    summary: 'jQuery usage is deprecated in favor of modern JavaScript and React.'
  }
];

export const invalidAdrs: Array<{ filename: string; content: string; expectedErrors: string[] }> = [
  {
    filename: 'ADR-0001-missing-title.md',
    content: `---
status: "Accepted"
summary: "Summary without title"
---

Content without title heading.`,
    expectedErrors: ['Missing title']
  },
  {
    filename: 'ADR-0002-missing-status.md',
    content: `---
title: "Decision Without Status"
summary: "Summary without status"
---

# Decision Without Status`,
    expectedErrors: ['Missing status']
  },
  {
    filename: 'ADR-0003-missing-summary.md',
    content: `---
title: "Decision Without Summary"
status: "Accepted"
---

# Decision Without Summary`,
    expectedErrors: ['Missing summary']
  },
  {
    filename: 'ADR-0004-invalid-status.md',
    content: `---
title: "Invalid Status Decision"
status: "NotAValidStatus"
summary: "Decision with invalid status"
---

# Invalid Status Decision`,
    expectedErrors: ['Unknown status']
  },
  {
    filename: 'ADR-0005-summary-too-long.md',
    content: `---
title: "Long Summary Decision"
status: "Accepted"
summary: "${'x'.repeat(301)}"
---

# Long Summary Decision`,
    expectedErrors: ['Summary too long']
  },
  {
    filename: 'ADR-0006-multiple-errors.md',
    content: `---
title: ""
status: "InvalidStatus"
summary: ""
---

Content with multiple validation errors.`,
    expectedErrors: ['Missing title', 'Unknown status', 'Missing summary']
  }
];

export async function createInvalidTestAdr(baseDir: string, invalidAdr: typeof invalidAdrs[0]): Promise<void> {
  const adrDir = join(baseDir, 'docs', 'adr');
  await mkdir(adrDir, { recursive: true });
  await writeFile(join(adrDir, invalidAdr.filename), invalidAdr.content);
}

export async function createTestWorkspace(baseDir: string): Promise<void> {
  // Create basic directory structure
  await mkdir(join(baseDir, 'docs', 'adr', 'templates'), { recursive: true });
  await mkdir(join(baseDir, 'src', 'components'), { recursive: true });
  await mkdir(join(baseDir, 'src', 'ui'), { recursive: true });
  await mkdir(join(baseDir, 'src', 'api'), { recursive: true });
  await mkdir(join(baseDir, 'migrations'), { recursive: true });
  await mkdir(join(baseDir, 'tests'), { recursive: true });

  // Create README template
  await writeFile(join(baseDir, 'docs', 'adr', 'README.md'), `# Architecture Decision Records

Store your ADRs in this directory.
`);

  // Create ADR template
  await writeFile(join(baseDir, 'docs', 'adr', 'templates', 'ADR-0000-template.md'), `---
title: "ADR-0000: Meaningful title"
date: "2024-01-01"
status: Proposed
tags:
  - architecture
modules:
  - src/
summary: >-
  Short summary describing the decision.
---

# Context

Describe the context.

# Decision

State the decision.

# Consequences

Explain the consequences.
`);

  // Create some source files
  await writeFile(join(baseDir, 'src', 'components', 'Button.tsx'), 'export const Button = () => <button />;');
  await writeFile(join(baseDir, 'src', 'ui', 'App.tsx'), 'export const App = () => null;');
  await writeFile(join(baseDir, 'src', 'api', 'server.ts'), 'import express from "express";');
  await writeFile(join(baseDir, 'migrations', '001_init.sql'), 'CREATE TABLE users (id SERIAL PRIMARY KEY);');
  await writeFile(join(baseDir, 'tests', 'example.test.ts'), 'test("example", () => {});');
}

export function createMockGitEnvironment(): Record<string, string> {
  return {
    GITHUB_TOKEN: 'fake-github-token',
    GITHUB_REPOSITORY: 'owner/test-repo',
    GITHUB_REF: 'refs/pull/123/merge'
  };
}

export function createMockPrEnvironment(prNumber: number = 123): Record<string, string> {
  return {
    GITHUB_TOKEN: 'fake-github-token',
    GITHUB_REPOSITORY: 'owner/test-repo',
    GITHUB_REF: `refs/pull/${prNumber}/merge`,
    PR_NUMBER: prNumber.toString()
  };
}