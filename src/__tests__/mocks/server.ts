import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';

import type { IGithubTemplateFile } from '../../commands/interface';
import {
  GITHUB_TEMPLATES_API_URL,
  GITHUB_TEMPLATES_RAW_BASE_URL,
} from '../../constants';

const defaultGithubTemplateList: IGithubTemplateFile[] = [
  {
    type: 'file',
    name: 'osx.ignore',
    // biome-ignore lint/style/useNamingConvention: ignore
    download_url: `${GITHUB_TEMPLATES_RAW_BASE_URL}/osx.ignore`,
  },
];

const defaultFileContentsByName: Record<string, string> = {
  'osx.ignore': '.DS_Store\n',
};

export const server = setupServer(
  http.get(GITHUB_TEMPLATES_API_URL, () => {
    return HttpResponse.json(defaultGithubTemplateList);
  }),
  http.get(`${GITHUB_TEMPLATES_RAW_BASE_URL}/:fileName`, ({ params }) => {
    const fileName = String(params.fileName);
    const content = defaultFileContentsByName[fileName] ?? '';

    return new HttpResponse(content);
  }),
);
