import { readFile } from 'node:fs/promises';
import { Command } from 'commander';
import prompts from 'prompts';

import {
  fetchTemplateContents,
  getCustomIgnoreSection,
  getGitIgnorePath,
  loadTemplateFiles,
  resolveCommonIgnorePath,
  writeGeneratedGitIgnore,
} from '../utils';

export const initCommand = new Command('init')
  .description('Initialize ignorify in current project')
  .action(executeInitCommand);

export async function executeInitCommand(): Promise<void> {
  const gitIgnorePath = getGitIgnorePath();

  const customIgnoreSection = await getCustomIgnoreSection({
    gitIgnorePath,
  });
  const { templateFiles, templatesDirectoryPath } = await loadTemplateFiles();

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

  const fetchedTemplates = await fetchTemplateContents({
    templateFiles,
    selectedTemplateFiles,
    templatesDirectoryPath,
  });
  const commonIgnorePath = await resolveCommonIgnorePath();
  const commonIgnoreContent = await readFile(commonIgnorePath, 'utf8');
  await writeGeneratedGitIgnore({
    gitIgnorePath,
    fetchedTemplates,
    commonIgnoreContent,
    customIgnoreSection,
  });

  console.log('Process completed.');
}
