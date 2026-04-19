import * as fsModule from 'node:fs/promises';
import type { MockedFunction } from 'vitest';

import { resolveCommonIgnorePath } from '../../utils/common-ignore';

vi.mock('node:fs/promises', () => {
  return {
    access: vi.fn(),
  };
});

describe('#resolveCommonIgnorePath', () => {
  let mockedAccess: MockedFunction<typeof fsModule.access>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockedAccess = vi.mocked(fsModule.access);
  });

  it('returns first existing common.ignore path', async () => {
    mockedAccess.mockResolvedValue(undefined);

    const result = await resolveCommonIgnorePath();

    expect(result).toMatch(/common\.ignore$/);
    expect(mockedAccess).toHaveBeenCalledTimes(1);
  });

  it('returns fallback path when first path does not exist', async () => {
    mockedAccess
      .mockRejectedValueOnce(new Error('ENOENT'))
      .mockResolvedValueOnce(undefined);

    const result = await resolveCommonIgnorePath();

    expect(result).toMatch(/common\.ignore$/);
    expect(mockedAccess).toHaveBeenCalledTimes(2);
  });

  it('throws when no path exists', async () => {
    mockedAccess.mockRejectedValue(new Error('ENOENT'));

    await expect(resolveCommonIgnorePath()).rejects.toThrow(
      'Cannot find common.ignore file',
    );
  });
});
