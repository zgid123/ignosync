#!/usr/bin/env node

import { program } from 'commander';

import { initCommand } from './commands/init';
import { updateCommand } from './commands/update';

program
  .name('ignosync')
  .description('Create .gitignore for specific TechStacks')
  .version('0.0.1');

program.addCommand(initCommand);
program.addCommand(updateCommand);

program.parseAsync(process.argv);
