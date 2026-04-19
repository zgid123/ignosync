import { HttpResponse, http } from 'msw';
import { afterEach, beforeEach, describe, expect, it, suite, vi } from 'vitest';

import {
  executeInitCommand,
  type IGithubTemplateFile,
} from '../../commands/init';
import { server } from '../mocks/server';

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

describe('#executeInitCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.GIT_IGNORE_DEV;
  });

  suite('when GIT_IGNORE_DEV is true', () => {
    it('reads templates from local folder and writes .gitignore-local', async () => {
      process.env.GIT_IGNORE_DEV = 'true';

      const promptsModule = await import('prompts');
      const fsModule = await import('node:fs/promises');

      const mockedPrompts = vi.mocked(promptsModule.default);
      const mockedAccess = vi.mocked(fsModule.access);
      const mockedReadDir = vi.mocked(fsModule.readdir);
      const mockedReadFile = vi.mocked(fsModule.readFile);

      mockedAccess.mockResolvedValue(undefined);
      mockedReadDir.mockResolvedValue([
        'Node.js',
        'Vitest',
      ] as unknown as Awaited<ReturnType<typeof fsModule.readdir>>);
      mockedPrompts.mockResolvedValue(
        createPromptsAnswer(['Node.js', 'Vitest']),
      );

      mockedReadFile.mockImplementation(async (filePath) => {
        const filePathValue = String(filePath);

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
    });
  });

  suite('when GIT_IGNORE_DEV is not true', () => {
    it('fetches template list first and then selected template files', async () => {
      const promptsModule = await import('prompts');
      const fsModule = await import('node:fs/promises');

      const mockedPrompts = vi.mocked(promptsModule.default);
      const mockedAccess = vi.mocked(fsModule.access);
      const mockedReadFile = vi.mocked(fsModule.readFile);
      const githubTemplateList: IGithubTemplateFile[] = [
        {
          type: 'file',
          name: 'osx.ignore',
          // biome-ignore lint/style/useNamingConvention: ignore
          download_url:
            'https://raw.githubusercontent.com/zgid123/git-ignore/main/templates/osx.ignore',
        },
      ];
      const githubApiUrl =
        'https://api.github.com/repos/zgid123/git-ignore/contents/templates';
      const githubTemplateRawUrl =
        'https://raw.githubusercontent.com/zgid123/git-ignore/main/templates/osx.ignore';

      server.use(
        http.get(githubApiUrl, () => {
          return HttpResponse.json(githubTemplateList);
        }),
        http.get(githubTemplateRawUrl, () => {
          return new HttpResponse('.DS_Store\n');
        }),
      );

      mockedAccess.mockResolvedValue(undefined);
      mockedPrompts.mockResolvedValue(createPromptsAnswer(['osx.ignore']));
      mockedReadFile.mockResolvedValue('.DS_Store\n');

      await executeInitCommand();

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
    });
  });
});
