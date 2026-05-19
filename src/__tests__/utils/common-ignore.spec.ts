import { readFile } from 'node:fs/promises';
import type { MockedFunction } from 'vitest';

import { getCommonIgnoreContent } from '../../utils/common-ignore';
import { isDevMode } from '../../utils/env';

vi.mock('node:fs/promises', () => {
  return {
    readFile: vi.fn(),
  };
});

vi.mock('../../utils/env', () => {
  return {
    isDevMode: vi.fn(),
  };
});

describe('#getCommonIgnoreContent', () => {
  let mockedReadFile: MockedFunction<typeof readFile>;
  let mockedIsDevMode: MockedFunction<typeof isDevMode>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockedReadFile = vi.mocked(readFile);
    mockedIsDevMode = vi.mocked(isDevMode);
  });

  it('reads from local file when in dev mode', async () => {
    mockedIsDevMode.mockReturnValue(true);
    mockedReadFile.mockResolvedValue('local content');

    const result = await getCommonIgnoreContent();

    expect(result).toBe('local content');
    expect(mockedReadFile).toHaveBeenCalledWith(
      expect.stringMatching(/templates\/common\/common\.ignore$/),
      'utf8',
    );
  });

  it('fetches from remote URL when not in dev mode', async () => {
    mockedIsDevMode.mockReturnValue(false);

    const result = await getCommonIgnoreContent();

    expect(result).toBe('node_modules\n');
    expect(mockedReadFile).not.toHaveBeenCalled();
  });
});
