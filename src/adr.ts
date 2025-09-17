import fg from 'fast-glob';
import matter from 'gray-matter';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  ACTIVE_PATH,
  ADR_DIRECTORY,
  ADR_GLOB,
  DIGEST_PATH,
  INDEX_PATH,
  SUMMARY_LIMIT,
  CLOSED_STATUSES,
  ACCEPTED_STATUSES
} from './constants.js';
import { AdrDocument, AdrFrontmatter, ValidationError } from './types.js';
import { ensureDir, writeFileSafe } from './fs-utils.js';

const ADR_IGNORE = ['**/templates/**', '**/README.md', '**/ACTIVE.md', '**/index.json', '**/ADR-0000-template.md'];

export interface AdrIndexEntry {
  id: string;
  title: string;
  status: string;
  summary: string;
  date?: string;
  tags: string[];
  modules: string[];
  path: string;
}

export interface AdrIndex {
  generatedAt: string;
  total: number;
  adrs: AdrIndexEntry[];
}

export interface AdrDigestEntry {
  id: string;
  title: string;
  summary: string;
  path: string;
}

export interface AdrDigest {
  generatedAt: string;
  count: number;
  adrs: AdrDigestEntry[];
}

export async function loadAdrs(cwd: string = process.cwd()): Promise<AdrDocument[]> {
  const entries = await fg(ADR_GLOB, {
    cwd,
    ignore: ADR_IGNORE,
    absolute: true
  });

  const documents = await Promise.all(
    entries.map(async (absolutePath) => {
      const relativePath = path.relative(cwd, absolutePath);
      const source = await readFile(absolutePath, 'utf8');
      const { data, content } = matter(source) as { data: AdrFrontmatter; content: string };
      const basename = path.basename(relativePath, path.extname(relativePath));
      const inferredId = inferAdrId(basename, data);
      const title = inferTitle(data, content, basename);
      const status = String(data.status ?? '').trim();
      const summary = String(data.summary ?? '').trim();

      return {
        id: inferredId,
        title,
        status,
        summary,
        date: typeof data.date === 'string' ? data.date : undefined,
        tags: normaliseArrayField(data.tags),
        modules: normaliseArrayField(data.modules),
        path: absolutePath,
        relativePath: relativePath.replaceAll('\\', '/'),
        body: content.trim()
      } satisfies AdrDocument;
    })
  );

  documents.sort((a, b) => a.id.localeCompare(b.id));
  return documents;
}

function inferAdrId(basename: string, data: AdrFrontmatter): string {
  if (typeof data.id === 'string' && data.id.trim()) {
    return data.id.trim();
  }
  const match = basename.match(/adr[-_ ]?(\d+)/i);
  if (match) {
    return `ADR-${match[1].padStart(4, '0')}`;
  }
  const numeric = basename.match(/(\d{2,})/);
  if (numeric) {
    return `ADR-${numeric[1]}`;
  }
  return basename;
}

function inferTitle(data: AdrFrontmatter, content: string, fallback: string): string {
  if (typeof data.title === 'string' && data.title.trim()) {
    return data.title.trim();
  }
  const headingMatch = content.match(/^#\s+(.+)$/m);
  if (headingMatch) {
    return headingMatch[1].trim();
  }
  return fallback;
}

function normaliseArrayField(value: AdrFrontmatter['tags'] | AdrFrontmatter['modules']): string[] {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }
  return String(value)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function validateAdrs(adrs: AdrDocument[]): ValidationError[] {
  const errors: ValidationError[] = [];
  for (const doc of adrs) {
    if (!doc.title) {
      errors.push({ file: doc.relativePath, message: 'Missing title in frontmatter or heading.' });
    }
    if (!doc.status) {
      errors.push({ file: doc.relativePath, message: 'Missing status in frontmatter.' });
    } else {
      const normalised = doc.status.toLowerCase();
      const allowed = ['accepted', 'approved', 'proposed', 'draft', 'rejected', 'deprecated', 'superseded'];
      if (!allowed.includes(normalised)) {
        errors.push({ file: doc.relativePath, message: `Unknown status "${doc.status}".` });
      }
    }
    if (!doc.summary) {
      errors.push({ file: doc.relativePath, message: 'Missing summary in frontmatter.' });
    } else if (doc.summary.length > SUMMARY_LIMIT) {
      errors.push({
        file: doc.relativePath,
        message: `Summary too long (${doc.summary.length} > ${SUMMARY_LIMIT}).`
      });
    }
  }
  return errors;
}

export function createIndex(adrs: AdrDocument[], generatedAt: string): AdrIndex {
  return {
    generatedAt,
    total: adrs.length,
    adrs: adrs.map((adr) => ({
      id: adr.id,
      title: adr.title,
      status: adr.status,
      summary: adr.summary,
      date: adr.date,
      tags: adr.tags,
      modules: adr.modules,
      path: adr.relativePath
    }))
  };
}

export function createActiveMarkdown(adrs: AdrDocument[], generatedAt: string): string {
  const activeAdrs = adrs.filter((adr) => !CLOSED_STATUSES.has(adr.status.toLowerCase()));
  const tableRows = activeAdrs
    .map((adr) => `| ${adr.id} | ${adr.title} | ${adr.status} | ${escapePipes(adr.summary)} |`)
    .join('\n');
  const header = `# Active Architecture Decisions\n\nGenerated at ${generatedAt}\n\n| ID | Title | Status | Summary |\n| --- | --- | --- | --- |`;
  return `${header}${tableRows ? `\n${tableRows}` : ''}\n`;
}

export function createDigest(adrs: AdrDocument[], generatedAt: string): AdrDigest {
  const accepted = adrs.filter((adr) => ACCEPTED_STATUSES.has(adr.status.toLowerCase()));
  return {
    generatedAt,
    count: accepted.length,
    adrs: accepted.map((adr) => ({
      id: adr.id,
      title: adr.title,
      summary: adr.summary,
      path: adr.relativePath
    }))
  };
}

export async function buildArtifacts(adrs: AdrDocument[], cwd: string = process.cwd()): Promise<void> {
  await ensureDir(path.join(cwd, ADR_DIRECTORY));
  await ensureDir(path.join(cwd, 'dist'));
  const generatedAt = new Date().toISOString();

  const indexPayload = createIndex(adrs, generatedAt);
  await writeFileSafe(path.join(cwd, INDEX_PATH), `${JSON.stringify(indexPayload, null, 2)}\n`);

  const activeContent = createActiveMarkdown(adrs, generatedAt);
  await writeFileSafe(path.join(cwd, ACTIVE_PATH), activeContent);

  const digestPayload = createDigest(adrs, generatedAt);
  await writeFileSafe(path.join(cwd, DIGEST_PATH), `${JSON.stringify(digestPayload, null, 2)}\n`);
}

function escapePipes(value: string): string {
  return value.replace(/\|/g, '\\|');
}
