import { mkdir, stat, writeFile, copyFile, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

export async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

export async function writeFileSafe(path: string, content: string): Promise<void> {
  await ensureDir(dirname(path));
  await writeFile(path, content, 'utf8');
}

export async function copyFileIfMissing(source: string, target: string): Promise<boolean> {
  if (await pathExists(target)) {
    return false;
  }
  await ensureDir(dirname(target));
  await copyFile(source, target);
  return true;
}

export async function filesHaveSameContent(path1: string, path2: string): Promise<boolean> {
  try {
    const [content1, content2] = await Promise.all([
      readFile(path1, 'utf8'),
      readFile(path2, 'utf8')
    ]);
    return content1 === content2;
  } catch {
    return false;
  }
}
