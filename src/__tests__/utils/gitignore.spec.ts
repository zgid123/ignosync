import * as fsModule from 'node:fs/promises';
import type { MockedFunction } from 'vitest';

import {
  extractSectionNames,
  getCustomIgnoreSection,
  getGitIgnorePath,
  writeGeneratedGitIgnore,
} from '../../utils/gitignore';

vi.mock('node:fs/promises', () => {
  return {
    appendFile: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
  };
});

describe('#getGitIgnorePath', () => {
  afterEach(() => {
    delete process.env.GIT_IGNORE_DEV;
  });

  it('returns .gitignore-local when GIT_IGNORE_DEV is true', () => {
    process.env.GIT_IGNORE_DEV = 'true';

    expect(getGitIgnorePath()).toMatch(/\.gitignore-local$/);
  });

  it('returns .gitignore when GIT_IGNORE_DEV is not true', () => {
    process.env.GIT_IGNORE_DEV = 'false';

    expect(getGitIgnorePath()).toMatch(/\.gitignore$/);
  });
});

describe('#writeGeneratedGitIgnore', () => {
  let mockedWriteFile: MockedFunction<typeof fsModule.writeFile>;
  let mockedAppendFile: MockedFunction<typeof fsModule.appendFile>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockedWriteFile = vi.mocked(fsModule.writeFile);
    mockedAppendFile = vi.mocked(fsModule.appendFile);
  });

  it('writes common, template sections, and custom section', async () => {
    await writeGeneratedGitIgnore({
      gitIgnorePath: '/tmp/.gitignore',
      commonIgnoreContent: '.DS_Store\n',
      fetchedTemplates: [
        {
          templateFile: 'Node.js',
          content: 'node_modules\n',
        },
      ],
      customIgnoreSection: '#\n# ---\n#\nmy-custom\n',
    });

    expect(mockedWriteFile).toHaveBeenCalledWith('/tmp/.gitignore', '', 'utf8');
    expect(mockedAppendFile).toHaveBeenNthCalledWith(
      1,
      '/tmp/.gitignore',
      '#\n# -- common\n#\n.DS_Store\n',
      'utf8',
    );
    expect(mockedAppendFile).toHaveBeenNthCalledWith(
      2,
      '/tmp/.gitignore',
      '#\n# -- Node.js\n#\nnode_modules\n',
      'utf8',
    );
    expect(mockedAppendFile).toHaveBeenNthCalledWith(
      3,
      '/tmp/.gitignore',
      '#\n# ---\n#\nmy-custom\n',
      'utf8',
    );
  });
});

describe('#extractSectionNames', () => {
  it('extracts unique section names from content', () => {
    const content = [
      '#',
      '# -- common',
      '#',
      'x',
      '#',
      '# -- Node.js',
      '#',
      'x',
      '#',
      '# -- Node.js',
      '#',
      'x',
    ].join('\n');

    expect(extractSectionNames({ content })).toEqual(['common', 'Node.js']);
  });
});

describe('#getCustomIgnoreSection', () => {
  let mockedReadFile: MockedFunction<typeof fsModule.readFile>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockedReadFile = vi.mocked(fsModule.readFile);
  });

  it('returns empty string when file cannot be read', async () => {
    mockedReadFile.mockRejectedValue(new Error('ENOENT'));

    await expect(
      getCustomIgnoreSection({ gitIgnorePath: '/tmp/.gitignore' }),
    ).resolves.toBe('');
  });

  it('returns empty string when custom section does not exist', async () => {
    mockedReadFile.mockResolvedValue('node_modules\n');

    await expect(
      getCustomIgnoreSection({ gitIgnorePath: '/tmp/.gitignore' }),
    ).resolves.toBe('');
  });

  it('returns normalized custom section when exists', async () => {
    mockedReadFile.mockResolvedValue('foo\n#\n# ---\n#\nmy-custom\n\n');

    await expect(
      getCustomIgnoreSection({ gitIgnorePath: '/tmp/.gitignore' }),
    ).resolves.toBe('#\n# ---\n#\nmy-custom\n');
  });
});
