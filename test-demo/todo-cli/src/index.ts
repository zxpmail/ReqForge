#!/usr/bin/env node

import { Command } from 'commander';
import { addAddCommand } from './commands/add';
import { addListCommand } from './commands/list';
import { addCompleteCommand } from './commands/complete';
import { addDeleteCommand } from './commands/delete';

const program = new Command();

program
  .name('todo')
  .description('Simple command-line todo list with AI categorization')
  .version('1.0.0');

addAddCommand(program);
addListCommand(program);
addCompleteCommand(program);
addDeleteCommand(program);

program.parse(process.argv);
