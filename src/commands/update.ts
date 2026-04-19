import { readFile } from 'node:fs/promises';
import { Command } from 'commander';

import {
  extractSectionNames,
  fetchTemplateContents,
  getCustomIgnoreSection,
  getGitIgnorePath,
  loadTemplateFiles,
  resolveCommonIgnorePath,
  writeGeneratedGitIgnore,
} from '../utils';

export const updateCommand = new Command('update')
  .description('Update existing .gitignore template sections')
  .action(executeUpdateCommand);

export async function executeUpdateCommand(): Promise<void> {
  const gitIgnorePath = getGitIgnorePath();

  const currentGitIgnoreContent = await readFile(gitIgnorePath, 'utf8');
  const customIgnoreSection = await getCustomIgnoreSection({
    gitIgnorePath,
  });
  const { templateFiles, templatesDirectoryPath } = await loadTemplateFiles();

  const allSectionNames = extractSectionNames({
    content: currentGitIgnoreContent,
  });
  const selectedTemplateFiles = allSectionNames.filter((sectionName) => {
    return (
      sectionName !== 'common' &&
      sectionName !== '---' &&
      templateFiles.some(
        (templateFile) => templateFile.fileName === sectionName,
      )
    );
  });

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
