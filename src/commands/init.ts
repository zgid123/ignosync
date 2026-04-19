import {
  access,
  appendFile,
  readdir,
  readFile,
  writeFile,
} from 'node:fs/promises';
import { resolve } from 'node:path';
import axios from 'axios';
import { Command } from 'commander';
import prompts from 'prompts';

export interface IGithubTemplateFile {
  name: string;
  // biome-ignore lint/style/useNamingConvention: ignore
  download_url: string | null;
  type: 'file' | 'dir' | 'symlink' | 'submodule';
}

interface ITemplateFileSource {
  fileName: string;
  downloadUrl: string | null;
}

export const initCommand = new Command('init')
  .description('Initialize git-ignore in current project')
  .action(executeInitCommand);

export async function executeInitCommand(): Promise<void> {
  const isDev = process.env.GIT_IGNORE_DEV === 'true';
  let templatesDirectoryPath = '';
  const commonIgnorePath = await resolveCommonIgnorePath();
  const gitIgnorePath = resolve(
    process.cwd(),
    isDev ? '.gitignore-local' : '.gitignore',
  );

  let templateFiles: ITemplateFileSource[] = [];

  if (isDev) {
    templatesDirectoryPath = resolve(__dirname, '../../templates');

    const localTemplateFiles = await readdir(templatesDirectoryPath);

    templateFiles = localTemplateFiles.sort().map((fileName) => {
      return {
        fileName,
        downloadUrl: null,
      };
    });
  } else {
    const response = await axios.get<IGithubTemplateFile[]>(
      'https://api.github.com/repos/zgid123/git-ignore/contents/templates',
    );
    templateFiles = response.data
      .filter((file) => file.type === 'file')
      .map((file) => {
        return {
          fileName: file.name,
          downloadUrl: file.download_url,
        };
      });
  }

  const choices = templateFiles.map((templateFile) => {
    return {
      title: templateFile.fileName,
      value: templateFile.fileName,
    };
  });

  const answer = await prompts({
    choices,
    name: 'techStacks',
    type: 'multiselect',
    instructions: false,
    message: 'Select templates:',
  });

  const selectedTemplateFiles: string[] = answer.techStacks ?? [];

  const fetchedTemplates = await Promise.all(
    selectedTemplateFiles.map(async (templateFile) => {
      let content = '';

      if (isDev) {
        content = await readFile(
          resolve(templatesDirectoryPath, templateFile),
          'utf8',
        );
      } else {
        const templateFileSource = templateFiles.find((fileSource) => {
          return fileSource.fileName === templateFile;
        });
        const templateUrl =
          templateFileSource?.downloadUrl ??
          `https://raw.githubusercontent.com/zgid123/git-ignore/main/templates/${templateFile}`;

        const response = await axios.get<string>(templateUrl);

        content = response.data;
      }

      return {
        content,
        templateFile,
      };
    }),
  );

  await writeFile(gitIgnorePath, '', 'utf8');
  const commonIgnoreContent = await readFile(commonIgnorePath, 'utf8');
  const normalizedCommonIgnoreContent = commonIgnoreContent.trimEnd();
  const commonSection = `#\n# -- common\n#\n${normalizedCommonIgnoreContent}\n`;

  await appendFile(gitIgnorePath, commonSection, 'utf8');

  for (const fetchedTemplate of fetchedTemplates) {
    const { templateFile, content } = fetchedTemplate;
    const normalizedContent = content.trimEnd();
    const section = `#\n# -- ${templateFile}\n#\n${normalizedContent}\n`;

    await appendFile(gitIgnorePath, section, 'utf8');
  }

  console.log('Process completed.');
}

async function resolveCommonIgnorePath(): Promise<string> {
  const commonIgnorePaths = [
    resolve(__dirname, './common.ignore'),
    resolve(__dirname, '../common.ignore'),
  ];

  for (const commonIgnorePath of commonIgnorePaths) {
    try {
      await access(commonIgnorePath);
      return commonIgnorePath;
    } catch (_error) {}
  }

  throw new Error('Cannot find common.ignore file');
}
