import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import axios from 'axios';

import type {
  IGithubTemplateFile,
  ITemplateFileSource,
} from '../commands/interface';
import {
  GITHUB_TEMPLATES_API_URL,
  GITHUB_TEMPLATES_RAW_BASE_URL,
} from '../constants';
import { isDevMode } from './env';

interface ILoadTemplateFilesResult {
  templatesDirectoryPath: string;
  templateFiles: ITemplateFileSource[];
}

export async function loadTemplateFiles(): Promise<ILoadTemplateFilesResult> {
  const isDev = isDevMode();
  let templatesDirectoryPath = '';
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
      GITHUB_TEMPLATES_API_URL,
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

  return {
    templateFiles,
    templatesDirectoryPath,
  };
}

interface IFetchTemplateContentsParams {
  templatesDirectoryPath: string;
  selectedTemplateFiles: string[];
  templateFiles: ITemplateFileSource[];
}

export interface IFetchedTemplate {
  content: string;
  templateFile: string;
}

export async function fetchTemplateContents({
  templateFiles,
  selectedTemplateFiles,
  templatesDirectoryPath,
}: IFetchTemplateContentsParams): Promise<IFetchedTemplate[]> {
  const isDev = isDevMode();

  return Promise.all(
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
          `${GITHUB_TEMPLATES_RAW_BASE_URL}/${templateFile}`;

        const response = await axios.get<string>(templateUrl);

        content = response.data;
      }

      return {
        content,
        templateFile,
      };
    }),
  );
}
