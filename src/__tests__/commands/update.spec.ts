import * as fsModule from 'node:fs/promises';
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
  let mockedAccess: MockedFunction<typeof fsModule.access>;
  let mockedReadDir: MockedFunction<typeof fsModule.readdir>;
  let mockedReadFile: MockedFunction<typeof fsModule.readFile>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockedAccess = vi.mocked(fsModule.access);
    mockedReadDir = vi.mocked(fsModule.readdir);
    mockedReadFile = vi.mocked(fsModule.readFile);

    mockedAccess.mockResolvedValue(undefined);
  });

  afterEach(() => {
    delete process.env.GIT_IGNORE_DEV;
  });

  suite('when GIT_IGNORE_DEV is true', () => {
    it('updates template sections based on existing .gitignore-local and keeps custom block', async () => {
      process.env.GIT_IGNORE_DEV = 'true';

      mockedReadDir.mockResolvedValue([
        'Node.js',
        'Vitest',
      ] as unknown as Awaited<ReturnType<typeof fsModule.readdir>>);
      mockedReadFile.mockImplementation(async (filePath) => {
        const filePathValue = String(filePath);

        if (filePathValue.endsWith('/.gitignore-local')) {
          return '#\n# -- common\n#\nold-common\n#\n# -- Node.js\n#\nold-node\n#\n# ---\n#\ncustom-local\n';
        }

        if (filePathValue.endsWith('/common.ignore')) {
          return '.DS_Store\n';
        }

        if (filePathValue.endsWith('/templates/Node.js')) {
          return 'node_modules\n';
        }

        throw new Error(`Unexpected file path: ${filePathValue}`);
      });

      await executeUpdateCommand();

      expect(fsModule.writeFile).toHaveBeenCalledWith(
        expect.stringMatching(/\.gitignore-local$/),
        '',
        'utf8',
      );
      expect(fsModule.appendFile).toHaveBeenNthCalledWith(
        1,
        expect.stringMatching(/\.gitignore-local$/),
        '#\n# -- common\n#\n.DS_Store\n',
        'utf8',
      );
      expect(fsModule.appendFile).toHaveBeenNthCalledWith(
        2,
        expect.stringMatching(/\.gitignore-local$/),
        '#\n# -- Node.js\n#\nnode_modules\n',
        'utf8',
      );
      expect(fsModule.appendFile).toHaveBeenNthCalledWith(
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

        if (filePathValue.endsWith('/common.ignore')) {
          return '.DS_Store\n';
        }

        throw new Error(`Unexpected file path: ${filePathValue}`);
      });

      await executeUpdateCommand();

      expect(fsModule.readFile).toHaveBeenCalledWith(
        expect.stringMatching(/common\.ignore$/),
        'utf8',
      );
      expect(fsModule.writeFile).toHaveBeenCalledWith(
        expect.stringMatching(/\.gitignore$/),
        '',
        'utf8',
      );
      expect(fsModule.appendFile).toHaveBeenNthCalledWith(
        1,
        expect.stringMatching(/\.gitignore$/),
        '#\n# -- common\n#\n.DS_Store\n',
        'utf8',
      );
      expect(fsModule.appendFile).toHaveBeenNthCalledWith(
        2,
        expect.stringMatching(/\.gitignore$/),
        '#\n# -- osx.ignore\n#\n.DS_Store\n',
        'utf8',
      );
      expect(fsModule.appendFile).toHaveBeenNthCalledWith(
        3,
        expect.stringMatching(/\.gitignore$/),
        '#\n# ---\n#\ncustom-remote\n',
        'utf8',
      );
    });
  });
});
