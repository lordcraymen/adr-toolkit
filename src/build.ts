import { buildArtifacts, loadAdrs } from './adr.js';

export async function runBuild(cwd: string = process.cwd()): Promise<void> {
  const adrs = await loadAdrs(cwd);
  await buildArtifacts(adrs, cwd);
  console.log(`Generated ADR artifacts for ${adrs.length} decisions.`);
}
