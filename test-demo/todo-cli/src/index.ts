#!/usr/bin/env node

import { Command } from 'commander';
import { handleAdd } from './commands/add';
import { handleList } from './commands/list';
import { handleComplete } from './commands/complete';
import { handleDelete } from './commands/delete';

const program = new Command();

program
  .name('todo')
  .description('A simple CLI todo list tool with AI categorization')
  .version('1.0.0')
  .option('--ai-key <key>', 'AI API key for categorization');

program
  .command('add <description>')
  .description('Add a new todo (AI categorizes automatically)')
  .action(async (description: string) => {
    const options = program.opts();
    await handleAdd(description, options.aiKey);
  });

program
  .command('list')
  .description('List all todos grouped by category')
  .action(() => {
    handleList();
  });

program
  .command('complete <id>')
  .description('Mark a todo as completed')
  .action((id: string) => {
    handleComplete(id);
  });

program
  .command('delete <id>')
  .description('Delete a todo')
  .action((id: string) => {
    handleDelete(id);
  });

program.parse(process.argv);
