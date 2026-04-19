/** biome-ignore-all lint/style/useNamingConvention: ignore */
import * as fsModule from 'node:fs/promises';
import axios from 'axios';
import type { MockedFunction } from 'vitest';

import { GITHUB_TEMPLATES_API_URL } from '../../constants';
import {
  fetchTemplateContents,
  loadTemplateFiles,
} from '../../utils/template-files';

vi.mock('axios', () => {
  return {
    default: {
      get: vi.fn(),
    },
  };
});

vi.mock('node:fs/promises', () => {
  return {
    readdir: vi.fn(),
    readFile: vi.fn(),
  };
});

describe('#loadTemplateFiles', () => {
  let mockedReadDir: MockedFunction<typeof fsModule.readdir>;
  let mockedAxiosGet: MockedFunction<typeof axios.get>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockedReadDir = vi.mocked(fsModule.readdir);
    mockedAxiosGet = vi.mocked(axios.get);
  });

  afterEach(() => {
    delete process.env.GIT_IGNORE_DEV;
  });

  it('loads local templates in dev mode', async () => {
    process.env.GIT_IGNORE_DEV = 'true';
    mockedReadDir.mockResolvedValue(['Vitest', 'Node.js'] as unknown as Awaited<
      ReturnType<typeof fsModule.readdir>
    >);

    const result = await loadTemplateFiles();

    expect(result.templatesDirectoryPath).toMatch(/templates$/);
    expect(result.templateFiles).toEqual([
      { fileName: 'Node.js', downloadUrl: null },
      { fileName: 'Vitest', downloadUrl: null },
    ]);
  });

  it('loads remote templates in non-dev mode', async () => {
    mockedAxiosGet.mockResolvedValue({
      data: [
        {
          name: 'osx.ignore',
          type: 'file',
          download_url: 'https://raw.githubusercontent.com/x/osx.ignore',
        },
        {
          name: 'templates',
          type: 'dir',
          download_url: null,
        },
      ],
    });

    const result = await loadTemplateFiles();

    expect(mockedAxiosGet).toHaveBeenCalledWith(GITHUB_TEMPLATES_API_URL);
    expect(result.templateFiles).toEqual([
      {
        fileName: 'osx.ignore',
        downloadUrl: 'https://raw.githubusercontent.com/x/osx.ignore',
      },
    ]);
  });
});

describe('#fetchTemplateContents', () => {
  let mockedReadFile: MockedFunction<typeof fsModule.readFile>;
  let mockedAxiosGet: MockedFunction<typeof axios.get>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockedReadFile = vi.mocked(fsModule.readFile);
    mockedAxiosGet = vi.mocked(axios.get);
  });

  afterEach(() => {
    delete process.env.GIT_IGNORE_DEV;
  });

  it('reads selected template files locally in dev mode', async () => {
    process.env.GIT_IGNORE_DEV = 'true';
    mockedReadFile.mockResolvedValue('node_modules\n');

    const result = await fetchTemplateContents({
      selectedTemplateFiles: ['Node.js'],
      templateFiles: [{ fileName: 'Node.js', downloadUrl: null }],
      templatesDirectoryPath: '/tmp/templates',
    });

    expect(mockedReadFile).toHaveBeenCalledWith(
      '/tmp/templates/Node.js',
      'utf8',
    );
    expect(result).toEqual([
      { templateFile: 'Node.js', content: 'node_modules\n' },
    ]);
  });

  it('fetches selected template files remotely in non-dev mode', async () => {
    mockedAxiosGet.mockResolvedValue({ data: '.DS_Store\n' });

    const result = await fetchTemplateContents({
      selectedTemplateFiles: ['osx.ignore'],
      templateFiles: [
        {
          fileName: 'osx.ignore',
          downloadUrl: 'https://raw.githubusercontent.com/x/osx.ignore',
        },
      ],
      templatesDirectoryPath: '',
    });

    expect(mockedAxiosGet).toHaveBeenCalledWith(
      'https://raw.githubusercontent.com/x/osx.ignore',
    );
    expect(result).toEqual([
      { templateFile: 'osx.ignore', content: '.DS_Store\n' },
    ]);
  });
});
