import { buildArtifacts, buildArtifactsWithConfig, loadAdrs } from './adr.js';
import { loadConfig } from './config.js';

export async function runBuild(cwd: string = process.cwd()): Promise<void> {
  const adrs = await loadAdrs(cwd);
  await buildArtifacts(adrs, cwd);
  console.log(`Generated ADR artifacts for ${adrs.length} decisions.`);
}

/**
 * Run build using configuration-driven rules
 */
export async function runBuildWithConfig(cwd: string = process.cwd()): Promise<void> {
  try {
    const [adrs, config] = await Promise.all([
      loadAdrs(cwd),
      loadConfig(cwd)
    ]);
    
    await buildArtifactsWithConfig(adrs, config, cwd);
    console.log(`Generated ADR artifacts for ${adrs.length} decisions using custom configuration.`);
  } catch (error) {
    throw new Error(`Build failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
