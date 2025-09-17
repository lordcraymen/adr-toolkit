import { loadAdrs, validateAdrs } from './adr.js';

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
