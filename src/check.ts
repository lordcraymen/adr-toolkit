import { loadAdrs, validateAdrs, validateAdrsWithConfig } from './adr.js';
import { loadConfig } from './config.js';

export async function runCheck(cwd: string = process.cwd()): Promise<{ ok: boolean }> {
  const adrs = await loadAdrs(cwd);
  const errors = validateAdrs(adrs);
  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`✖ ${error.file}: ${error.message}`);
    }
    return { ok: false };
  }
  console.log(`✓ All ${adrs.length} ADRs look good.`);
  return { ok: true };
}

/**
 * Run ADR validation using configuration-driven rules
 */
export async function runCheckWithConfig(cwd: string = process.cwd()): Promise<{ ok: boolean; errors?: string[] }> {
  try {
    const [adrs, config] = await Promise.all([
      loadAdrs(cwd),
      loadConfig(cwd)
    ]);
    
    const errors = validateAdrsWithConfig(adrs, config);
    
    if (errors.length > 0) {
      for (const error of errors) {
        console.error(`✖ ${error.file}: ${error.message}`);
      }
      return { ok: false, errors: errors.map(e => `${e.file}: ${e.message}`) };
    }
    
    console.log(`✓ All ${adrs.length} ADRs look good.`);
    return { ok: true };
  } catch (error) {
    console.error(`✖ Configuration error: ${error instanceof Error ? error.message : String(error)}`);
    return { ok: false, errors: [`Configuration error: ${error instanceof Error ? error.message : String(error)}`] };
  }
}
