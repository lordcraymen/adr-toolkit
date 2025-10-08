import { loadAdrs } from './adr.js';
import { ADR_DIRECTORY } from './constants.js';
import { gitDiffNames } from './git.js';
import type { OutputFormat, AffectedResult } from './types.js';

export async function runAffected(baseRef: string, cwd: string = process.cwd(), format: OutputFormat = 'json'): Promise<AffectedResult> {
  if (!baseRef) {
    throw new Error('Missing --base <ref> option.');
  }

  const diffFiles = await gitDiffNames(baseRef, cwd);
  const adrs = await loadAdrs(cwd);
  const affected = new Set<string>();

  const normalisedDiff = diffFiles.map((file) => file.replaceAll('\\', '/'));

  for (const adr of adrs) {
    if (normalisedDiff.includes(adr.relativePath)) {
      affected.add(adr.relativePath);
      continue;
    }
    const matchesModule = adr.modules.some((moduleName) =>
      normalisedDiff.some((file) => isPathMatch(file, moduleName))
    );
    const matchesTag = adr.tags.some((tag) =>
      normalisedDiff.some((file) => file.includes(tag))
    );
    if (matchesModule || matchesTag) {
      affected.add(adr.relativePath);
    }
  }

  const result: AffectedResult = { changed: normalisedDiff, affected: Array.from(affected).sort() };

  if (format === 'json') {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`Changed files: ${result.changed.length}`);
    for (const file of result.changed) {
      console.log(`  - ${file}`);
    }
    console.log(`Affected ADRs: ${result.affected.length}`);
    for (const adr of result.affected) {
      console.log(`  - ${adr}`);
    }
  }

  return result;
}

function isPathMatch(file: string, moduleName: string): boolean {
  if (!moduleName) {
    return false;
  }
  const normalisedModule = moduleName.replaceAll('\\', '/').replace(/\/+$/, '');
  if (!normalisedModule) {
    return false;
  }
  if (normalisedModule.startsWith(ADR_DIRECTORY)) {
    return file.startsWith(normalisedModule);
  }
  return file.includes(normalisedModule);
}
