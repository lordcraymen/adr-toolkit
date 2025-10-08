import { loadAdrs, validateAdrs, validateAdrsWithConfig } from './adr.js';
import { loadConfig } from './config.js';
import type { OutputFormat, CheckResult } from './types.js';

export async function runCheck(cwd: string = process.cwd(), format: OutputFormat = 'text'): Promise<CheckResult> {
  const adrs = await loadAdrs(cwd);
  const errors = validateAdrs(adrs);
  
  const result: CheckResult = {
    ok: errors.length === 0,
    adrCount: adrs.length,
    errors: errors.length > 0 ? errors : undefined
  };

  if (format === 'json') {
    console.log(JSON.stringify(result, null, 2));
  } else {
    if (errors.length > 0) {
      for (const error of errors) {
        console.error(`✖ ${error.file}: ${error.message}`);
      }
    } else {
      console.log(`✓ All ${adrs.length} ADRs look good.`);
    }
  }

  return result;
}

/**
 * Run ADR validation using configuration-driven rules
 */
export async function runCheckWithConfig(cwd: string = process.cwd(), format: OutputFormat = 'text'): Promise<{ ok: boolean; errors?: string[] }> {
  try {
    const [adrs, config] = await Promise.all([
      loadAdrs(cwd),
      loadConfig(cwd)
    ]);
    
    const errors = validateAdrsWithConfig(adrs, config);
    
    if (format === 'json') {
      const result: CheckResult = {
        ok: errors.length === 0,
        adrCount: adrs.length,
        errors: errors.length > 0 ? errors : undefined
      };
      console.log(JSON.stringify(result, null, 2));
    } else {
      if (errors.length > 0) {
        for (const error of errors) {
          console.error(`✖ ${error.file}: ${error.message}`);
        }
      } else {
        console.log(`✓ All ${adrs.length} ADRs look good.`);
      }
    }

    return {
      ok: errors.length === 0,
      errors: errors.length > 0 ? errors.map(e => `${e.file}: ${e.message}`) : undefined
    };
  } catch (error) {
    const errorMessage = `Configuration error: ${error instanceof Error ? error.message : String(error)}`;
    
    if (format === 'json') {
      const result: CheckResult = {
        ok: false,
        adrCount: 0,
        errors: [{ file: 'configuration', message: errorMessage }]
      };
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.error(`✖ ${errorMessage}`);
    }

    return { ok: false, errors: [errorMessage] };
  }
}
