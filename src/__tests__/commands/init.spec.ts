import * as fsModule from 'node:fs/promises';
import prompts from 'prompts';
import type { MockedFunction } from 'vitest';

import { executeInitCommand } from '../../commands/init';

vi.mock('prompts', () => {
  return {
    default: vi.fn(),
  };
});

vi.mock('node:fs/promises', () => {
  return {
    access: vi.fn(),
    readdir: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    appendFile: vi.fn(),
  };
});

function createPromptsAnswer(techStacks: string[]): { techStacks: string[] } {
  return {
    techStacks,
  };
}

type TReadFilePath = Parameters<typeof import('node:fs/promises').readFile>[0];

describe('#executeInitCommand', () => {
  let mockedPrompts: MockedFunction<typeof prompts>;
  let mockedAccess: MockedFunction<typeof fsModule.access>;
  let mockedReadDir: MockedFunction<typeof fsModule.readdir>;
  let mockedReadFile: MockedFunction<typeof fsModule.readFile>;

  beforeEach(async () => {
    vi.clearAllMocks();

    mockedPrompts = vi.mocked(prompts);
    mockedAccess = vi.mocked(fsModule.access);
    mockedReadDir = vi.mocked(fsModule.readdir);
    mockedReadFile = vi.mocked(fsModule.readFile);

    mockedAccess.mockResolvedValue(undefined);
  });

  afterEach(() => {
    delete process.env.GIT_IGNORE_DEV;
  });

  function mockDevTemplateFlow(existingGitignoreContent: string): void {
    mockedReadDir.mockResolvedValue(['Node.js', 'Vitest'] as unknown as Awaited<
      ReturnType<typeof import('node:fs/promises')['readdir']>
    >);
    mockedPrompts.mockResolvedValue(createPromptsAnswer(['Node.js', 'Vitest']));
    mockedReadFile.mockImplementation(async (filePath: TReadFilePath) => {
      const filePathValue = String(filePath);

      if (filePathValue.endsWith('/.gitignore-local')) {
        return existingGitignoreContent;
      }

      if (filePathValue.endsWith('/common.ignore')) {
        return '.DS_Store\n';
      }

      if (filePathValue.endsWith('/templates/Node.js')) {
        return 'node_modules\n';
      }

      if (filePathValue.endsWith('/templates/Vitest')) {
        return 'coverage\n';
      }

      throw new Error(`Unexpected file path: ${filePathValue}`);
    });
  }

  function mockRemoteTemplateFlow(existingGitignoreContent: string): void {
    mockedPrompts.mockResolvedValue(createPromptsAnswer(['osx.ignore']));
    mockedReadFile.mockImplementation(async (filePath: TReadFilePath) => {
      const filePathValue = String(filePath);

      if (filePathValue.endsWith('/.gitignore')) {
        return existingGitignoreContent;
      }

      if (filePathValue.endsWith('/common.ignore')) {
        return '.DS_Store\n';
      }

      throw new Error(`Unexpected file path: ${filePathValue}`);
    });
  }

  describe('when GIT_IGNORE_DEV is true', () => {
    suite('when .gitignore-local has no custom block', () => {
      it('writes only common and selected template sections', async () => {
        process.env.GIT_IGNORE_DEV = 'true';

        mockDevTemplateFlow('old-rule\n');

        await executeInitCommand();

        expect(fsModule.readdir).toHaveBeenCalledTimes(1);
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
          '#\n# -- Vitest\n#\ncoverage\n',
          'utf8',
        );
        expect(fsModule.appendFile).toHaveBeenCalledTimes(3);
      });
    });

    suite('when .gitignore-local has a custom block', () => {
      it('restores the custom block at the end', async () => {
        process.env.GIT_IGNORE_DEV = 'true';

        mockDevTemplateFlow('old-rule\n#\n# ---\n#\ncustom-local\n');

        await executeInitCommand();

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
          '#\n# -- Vitest\n#\ncoverage\n',
          'utf8',
        );
        expect(fsModule.appendFile).toHaveBeenNthCalledWith(
          4,
          expect.stringMatching(/\.gitignore-local$/),
          '#\n# ---\n#\ncustom-local\n',
          'utf8',
        );
        expect(fsModule.appendFile).toHaveBeenCalledTimes(4);
      });
    });
  });

  describe('when GIT_IGNORE_DEV is not true', () => {
    suite('when .gitignore has no custom block', () => {
      it('writes only common and selected template sections', async () => {
        mockRemoteTemplateFlow('old-rule\n');

        await executeInitCommand();

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
        expect(fsModule.appendFile).toHaveBeenCalledTimes(2);
      });
    });

    suite('when .gitignore has a custom block', () => {
      it('restores the custom block at the end', async () => {
        mockRemoteTemplateFlow('old-rule\n#\n# ---\n#\ncustom-remote\n');

        await executeInitCommand();

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
        expect(fsModule.appendFile).toHaveBeenCalledTimes(3);
      });
    });
  });
});
