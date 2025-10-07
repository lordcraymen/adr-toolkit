import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ADR_DIRECTORY, ADR_TEMPLATE_NAME } from './constants.js';
import { copyFileIfMissing, ensureDir, pathExists, filesHaveSameContent } from './fs-utils.js';
import { promptYesNo } from './prompt-utils.js';

const templateRoot = fileURLToPath(new URL('../templates/', import.meta.url));

export interface InitResult {
  created: string[];
  skipped: string[];
}

async function handleAdrGuidelines(cwd: string, options: { interactive?: boolean } = {}): Promise<{ created: boolean; skipped: boolean }> {
  const templateSource = path.join(templateRoot, 'ADR_GUIDELINES.md');
  const targetPath = path.join(cwd, 'docs', 'ADR_GUIDELINES.md');
  
  if (!(await pathExists(targetPath))) {
    // File doesn't exist, create it
    await copyFileIfMissing(templateSource, targetPath);
    return { created: true, skipped: false };
  }
  
  // File exists, check if it's the unchanged template
  if (await filesHaveSameContent(templateSource, targetPath)) {
    // It's the same as template, leave it as-is (idempotent)
    return { created: false, skipped: true };
  }
  
  // File exists and has been modified
  if (options.interactive === false) {
    // Non-interactive mode (tests): don't overwrite, just skip
    return { created: false, skipped: true };
  }
  
  // Interactive mode: prompt user
  const shouldOverwrite = await promptYesNo(
    'An ADR_GUIDELINES.md already exists in /docs and has been modified. Do you want to overwrite it?',
    false // Default to 'No' for safety
  );
  
  if (shouldOverwrite) {
    await copyFileIfMissing(templateSource, targetPath); // This won't copy since file exists
    // We need to actually overwrite
    await ensureDir(path.dirname(targetPath));
    const { copyFile } = await import('node:fs/promises');
    await copyFile(templateSource, targetPath);
    return { created: true, skipped: false };
  }
  
  return { created: false, skipped: true };
}

const FILES_TO_COPY: Array<{ source: string; target: string }> = [
  { source: `adr/${ADR_TEMPLATE_NAME}`, target: path.join(ADR_DIRECTORY, 'templates', ADR_TEMPLATE_NAME) },
  { source: '.dependency-cruiser.js', target: '.dependency-cruiser.js' },
  { source: 'PULL_REQUEST_TEMPLATE.md', target: '.github/PULL_REQUEST_TEMPLATE.md' },
  { source: 'adrx.config.json', target: '.adrx.config.json' }
];

export async function initWorkspace(cwd: string = process.cwd(), options: { interactive?: boolean } = {}): Promise<InitResult> {
  const created: string[] = [];
  const skipped: string[] = [];

  await ensureDir(path.join(cwd, ADR_DIRECTORY));
  await ensureDir(path.join(cwd, ADR_DIRECTORY, 'templates'));
  await ensureDir(path.join(cwd, '.github'));
  await ensureDir(path.join(cwd, 'docs'));

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

  // Handle ADR README
  const adrIndexPath = path.join(cwd, ADR_DIRECTORY, 'README.md');
  if (!(await pathExists(adrIndexPath))) {
    await copyFileIfMissing(path.join(templateRoot, 'adr', 'README.seed.md'), adrIndexPath);
    created.push(path.relative(cwd, adrIndexPath));
  } else {
    skipped.push(path.relative(cwd, adrIndexPath));
  }

  // Handle ADR Guidelines with smart prompting
  const guidelinesResult = await handleAdrGuidelines(cwd, options);
  if (guidelinesResult.created) {
    created.push('docs/ADR_GUIDELINES.md');
  } else if (guidelinesResult.skipped) {
    skipped.push('docs/ADR_GUIDELINES.md');
  }

  return { created, skipped };
}
