import { Command } from 'commander';
import { loadStorage } from '../storage';
import { Todo } from '../types';

export function addListCommand(program: Command): void {
  program
    .command('list')
    .description('List all todos')
    .option('-a, --all', 'Show all todos (default)', true)
    .option('-c, --completed', 'Show only completed')
    .option('-p, --pending', 'Show only pending')
    .option('-C, --category <category>', 'Filter by category')
    .action((options) => {
      const storage = loadStorage();
      let { todos } = storage;

      // Filter based on options
      if (options.completed) {
        todos = todos.filter(t => t.completed);
      } else if (options.pending) {
        todos = todos.filter(t => !t.completed);
      }

      if (options.category) {
        todos = todos.filter(t => t.category === options.category);
      }

      if (todos.length === 0) {
        console.log('No todos matching your criteria.');
        return;
      }

      // Group by category
      const grouped: Record<string, Todo[]> = {};
      for (const todo of todos) {
        if (!grouped[todo.category]) {
          grouped[todo.category] = [];
        }
        grouped[todo.category].push(todo);
      }

      // Sort by creation time (newest first)
      for (const category of Object.keys(grouped)) {
        grouped[category].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }

      // Output
      console.log();
      for (const [category, categoryTodos] of Object.entries(grouped)) {
        console.log(`\x1b[1m${category.toUpperCase()}\x1b[0m`);
        for (const todo of categoryTodos) {
          const status = todo.completed ? '\x1b[32m✓\x1b[0m' : '\x1b[31m○\x1b[0m';
          console.log(`  ${status} #${todo.id} ${todo.description}`);
        }
        console.log();
      }
    });
}
