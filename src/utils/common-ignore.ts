import { access } from 'node:fs/promises';
import { resolve } from 'node:path';

export async function resolveCommonIgnorePath(): Promise<string> {
  const commonIgnorePaths = [
    resolve(__dirname, '../common.ignore'),
    resolve(__dirname, '../../src/common.ignore'),
  ];

  for (const commonIgnorePath of commonIgnorePaths) {
    try {
      await access(commonIgnorePath);

      return commonIgnorePath;
    } catch {
      // Ignore ENOENT errors
    }
  }

  throw new Error('Cannot find common.ignore file');
}
