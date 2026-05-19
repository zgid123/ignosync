import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import axios from 'axios';

import { COMMON_IGNORE_RAW_URL } from '../constants';
import { isDevMode } from './env';

export async function getCommonIgnoreContent(): Promise<string> {
  const isDev = isDevMode();

  if (isDev) {
    const commonIgnorePath = resolve(
      __dirname,
      '../../templates/common/common.ignore',
    );

    return await readFile(commonIgnorePath, 'utf8');
  }

  const response = await axios.get<string>(COMMON_IGNORE_RAW_URL);

  return response.data;
}
