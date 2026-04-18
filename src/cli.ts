#!/usr/bin/env node

import { program } from 'commander';

import { initCommand } from './commands/init';

program
  .name('git-ignore')
  .description('Create .gitignore for specific TechStacks')
  .version('0.0.1');

program.addCommand(initCommand);

program.parseAsync(process.argv);
