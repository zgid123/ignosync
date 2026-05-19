import {
  access,
  appendFile,
  readdir,
  readFile,
  writeFile,
} from 'node:fs/promises';
import type { MockedFunction } from 'vitest';

import { executeUpdateCommand } from '../../commands/update';

vi.mock('node:fs/promises', () => {
  return {
    access: vi.fn(),
    readdir: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    appendFile: vi.fn(),
  };
});

describe('#executeUpdateCommand', () => {
  let mockedAccess: MockedFunction<typeof access>;
  let mockedReadDir: MockedFunction<typeof readdir>;
  let mockedReadFile: MockedFunction<typeof readFile>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockedAccess = vi.mocked(access);
    mockedReadDir = vi.mocked(readdir);
    mockedReadFile = vi.mocked(readFile);

    mockedAccess.mockResolvedValue(undefined);
  });

  afterEach(() => {
    delete process.env.GIT_IGNORE_DEV;
  });

  suite('when GIT_IGNORE_DEV is true', () => {
    it('updates template sections based on existing .gitignore-local and keeps custom block', async () => {
      process.env.GIT_IGNORE_DEV = 'true';

      mockedReadDir.mockResolvedValue([
        {
          name: 'Node.js',
          isFile: () => true,
        },
        {
          name: 'Vitest',
          isFile: () => true,
        },
        {
          name: 'common',
          isFile: () => false,
        },
      ] as unknown as Awaited<ReturnType<typeof readdir>>);
      mockedReadFile.mockImplementation(async (filePath) => {
        const filePathValue = String(filePath);

        if (filePathValue.endsWith('/.gitignore-local')) {
          return '#\n# -- common\n#\nold-common\n#\n# -- Node.js\n#\nold-node\n#\n# ---\n#\ncustom-local\n';
        }

        if (filePathValue.endsWith('/templates/common/common.ignore')) {
          return '.DS_Store\n';
        }

        if (filePathValue.endsWith('/templates/Node.js')) {
          return 'node_modules\n';
        }

        throw new Error(`Unexpected file path: ${filePathValue}`);
      });

      await executeUpdateCommand();

      expect(writeFile).toHaveBeenCalledWith(
        expect.stringMatching(/\.gitignore-local$/),
        '',
        'utf8',
      );
      expect(appendFile).toHaveBeenNthCalledWith(
        1,
        expect.stringMatching(/\.gitignore-local$/),
        '#\n# -- common\n#\n.DS_Store\n',
        'utf8',
      );
      expect(appendFile).toHaveBeenNthCalledWith(
        2,
        expect.stringMatching(/\.gitignore-local$/),
        '#\n# -- Node.js\n#\nnode_modules\n',
        'utf8',
      );
      expect(appendFile).toHaveBeenNthCalledWith(
        3,
        expect.stringMatching(/\.gitignore-local$/),
        '#\n# ---\n#\ncustom-local\n',
        'utf8',
      );
    });
  });

  suite('when GIT_IGNORE_DEV is not true', () => {
    it('updates remote template sections based on existing .gitignore and keeps custom block', async () => {
      mockedReadFile.mockImplementation(async (filePath) => {
        const filePathValue = String(filePath);

        if (filePathValue.endsWith('/.gitignore')) {
          return '#\n# -- common\n#\nold-common\n#\n# -- osx.ignore\n#\nold-osx\n#\n# ---\n#\ncustom-remote\n';
        }

        throw new Error(`Unexpected file path: ${filePathValue}`);
      });

      await executeUpdateCommand();

      expect(writeFile).toHaveBeenCalledWith(
        expect.stringMatching(/\.gitignore$/),
        '',
        'utf8',
      );
      expect(appendFile).toHaveBeenNthCalledWith(
        1,
        expect.stringMatching(/\.gitignore$/),
        '#\n# -- common\n#\nnode_modules\n',
        'utf8',
      );
      expect(appendFile).toHaveBeenNthCalledWith(
        2,
        expect.stringMatching(/\.gitignore$/),
        '#\n# -- osx.ignore\n#\n.DS_Store\n',
        'utf8',
      );
      expect(appendFile).toHaveBeenNthCalledWith(
        3,
        expect.stringMatching(/\.gitignore$/),
        '#\n# ---\n#\ncustom-remote\n',
        'utf8',
      );
    });
  });
});
