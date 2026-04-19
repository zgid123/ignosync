import { isDevMode } from '../../utils/env';

describe('#isDevMode', () => {
  afterEach(() => {
    delete process.env.GIT_IGNORE_DEV;
  });

  it('returns true when GIT_IGNORE_DEV is true', () => {
    process.env.GIT_IGNORE_DEV = 'true';

    expect(isDevMode()).toBe(true);
  });

  it('returns false when GIT_IGNORE_DEV is not true', () => {
    process.env.GIT_IGNORE_DEV = 'false';

    expect(isDevMode()).toBe(false);
  });
});
