import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ADR_DIRECTORY, ADR_TEMPLATE_NAME } from './constants.js';
import { copyFileIfMissing, ensureDir, pathExists } from './fs-utils.js';

const templateRoot = fileURLToPath(new URL('../templates/', import.meta.url));

export interface InitResult {
  created: string[];
  skipped: string[];
}

const FILES_TO_COPY: Array<{ source: string; target: string }> = [
  { source: `adr/${ADR_TEMPLATE_NAME}`, target: path.join(ADR_DIRECTORY, 'templates', ADR_TEMPLATE_NAME) },
  { source: '.dependency-cruiser.js', target: '.dependency-cruiser.js' },
  { source: 'PULL_REQUEST_TEMPLATE.md', target: '.github/PULL_REQUEST_TEMPLATE.md' },
  { source: 'AGENT_RULES-snippet.md', target: 'AGENT_RULES-snippet.md' },
  { source: 'adrx.config.json', target: '.adrx.config.json' }
];

export async function initWorkspace(cwd: string = process.cwd()): Promise<InitResult> {
  const created: string[] = [];
  const skipped: string[] = [];

  await ensureDir(path.join(cwd, ADR_DIRECTORY));
  await ensureDir(path.join(cwd, ADR_DIRECTORY, 'templates'));
  await ensureDir(path.join(cwd, '.github'));

  for (const item of FILES_TO_COPY) {
    const source = path.join(templateRoot, item.source);
    const target = path.join(cwd, item.target);
    const wasCreated = await copyFileIfMissing(source, target);
    if (wasCreated) {
      created.push(item.target);
    } else {
      skipped.push(item.target);
    }
  }

  const adrIndexPath = path.join(cwd, ADR_DIRECTORY, 'README.md');
  if (!(await pathExists(adrIndexPath))) {
    await copyFileIfMissing(path.join(templateRoot, 'adr', 'README.seed.md'), adrIndexPath);
    created.push(path.relative(cwd, adrIndexPath));
  }

  return { created, skipped };
}
