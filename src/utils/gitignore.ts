import { appendFile, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { isDevMode } from './env';
import type { IFetchedTemplate } from './template-files';

export function getGitIgnorePath(): string {
  return resolve(
    process.cwd(),
    isDevMode() ? '.gitignore-local' : '.gitignore',
  );
}

interface IWriteGeneratedGitIgnoreParams {
  gitIgnorePath: string;
  commonIgnoreContent: string;
  customIgnoreSection: string;
  fetchedTemplates: IFetchedTemplate[];
}

export async function writeGeneratedGitIgnore({
  gitIgnorePath,
  fetchedTemplates,
  commonIgnoreContent,
  customIgnoreSection,
}: IWriteGeneratedGitIgnoreParams): Promise<void> {
  const normalizedCommonIgnoreContent = commonIgnoreContent.trimEnd();
  const commonSection = `#\n# -- common\n#\n${normalizedCommonIgnoreContent}\n`;

  await writeFile(gitIgnorePath, '', 'utf8');
  await appendFile(gitIgnorePath, commonSection, 'utf8');

  for (const fetchedTemplate of fetchedTemplates) {
    const { templateFile, content } = fetchedTemplate;
    const normalizedContent = content.trimEnd();
    const section = `#\n# -- ${templateFile}\n#\n${normalizedContent}\n`;

    await appendFile(gitIgnorePath, section, 'utf8');
  }

  if (customIgnoreSection.length > 0) {
    await appendFile(gitIgnorePath, customIgnoreSection, 'utf8');
  }
}

interface IExtractSectionNamesParams {
  content: string;
}

export function extractSectionNames({
  content,
}: IExtractSectionNamesParams): string[] {
  const sectionNames: string[] = [];
  const sectionPattern = /(^|\n)#\n# -- ([^\n]+)\n#\n/g;
  let match: RegExpExecArray | null = null;

  while (true) {
    match = sectionPattern.exec(content);

    if (!match) {
      break;
    }

    const sectionName = match[2];

    if (!sectionName) {
      continue;
    }

    if (!sectionNames.includes(sectionName)) {
      sectionNames.push(sectionName);
    }
  }

  return sectionNames;
}

interface IGetCustomIgnoreSectionParams {
  gitIgnorePath: string;
}

export async function getCustomIgnoreSection({
  gitIgnorePath,
}: IGetCustomIgnoreSectionParams): Promise<string> {
  try {
    const existingGitIgnoreContent = await readFile(gitIgnorePath, 'utf8');
    const customSectionMatch = existingGitIgnoreContent.match(
      /(^|\n)#\n# ---\n#\n[\s\S]*$/,
    );

    if (!customSectionMatch) {
      return '';
    }

    const rawCustomSection = customSectionMatch[0].startsWith('\n')
      ? customSectionMatch[0].slice(1)
      : customSectionMatch[0];

    return `${rawCustomSection.trimEnd()}\n`;
  } catch {
    return '';
  }
}
