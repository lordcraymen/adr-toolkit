import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export async function gitDiffNames(baseRef: string, cwd: string): Promise<string[]> {
  try {
    const { stdout } = await execFileAsync('git', ['diff', '--name-only', `${baseRef}...HEAD`], { cwd });
    return stdout
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  } catch (error: unknown) {
    const err = error as NodeJS.ErrnoException & { stderr?: string };
    if (err.code === 'ENOENT') {
      console.warn('git executable not found. Returning empty diff.');
      return [];
    }
    const stderr = 'stderr' in err && typeof err.stderr === 'string' ? err.stderr : undefined;
    console.warn(`Unable to read git diff: ${stderr ?? err.message}`);
    return [];
  }
}
