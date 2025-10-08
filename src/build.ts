import { buildArtifacts, buildArtifactsWithConfig, loadAdrs } from './adr.js';
import { loadConfig } from './config.js';
import type { OutputFormat, BuildResult } from './types.js';

export async function runBuild(cwd: string = process.cwd(), format: OutputFormat = 'text'): Promise<BuildResult> {
  try {
    const adrs = await loadAdrs(cwd);
    await buildArtifacts(adrs, cwd);
    
    const result: BuildResult = {
      ok: true,
      adrCount: adrs.length,
      artifactsGenerated: ['docs/adr/index.json', 'docs/adr/ACTIVE.md', 'dist/adr-digest.json']
    };

    if (format === 'json') {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`Generated ADR artifacts for ${adrs.length} decisions.`);
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const result: BuildResult = {
      ok: false,
      adrCount: 0,
      artifactsGenerated: [],
      error: errorMessage
    };

    if (format === 'json') {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.error(`Build failed: ${errorMessage}`);
    }

    return result;
  }
}

/**
 * Run build using configuration-driven rules
 */
export async function runBuildWithConfig(cwd: string = process.cwd(), format: OutputFormat = 'text'): Promise<BuildResult> {
  try {
    const [adrs, config] = await Promise.all([
      loadAdrs(cwd),
      loadConfig(cwd)
    ]);
    
    await buildArtifactsWithConfig(adrs, config, cwd);
    
    const result: BuildResult = {
      ok: true,
      adrCount: adrs.length,
      artifactsGenerated: ['docs/adr/index.json', 'docs/adr/ACTIVE.md', 'dist/adr-digest.json']
    };

    if (format === 'json') {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`Generated ADR artifacts for ${adrs.length} decisions using custom configuration.`);
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const result: BuildResult = {
      ok: false,
      adrCount: 0,
      artifactsGenerated: [],
      error: errorMessage
    };

    if (format === 'json') {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.error(`Build failed: ${errorMessage}`);
    }

    return result;
  }
}
