import { Command } from 'commander';
import { loadStorage, saveStorage, getNextId } from '../storage';
import { categorizeTodo } from '../ai-categorize';
import { Todo } from '../types';

export function addAddCommand(program: Command): void {
  program
    .command('add <description...>')
    .description('Add a new todo')
    .option('-c, --category <category>', 'Override category (auto-categorized by default)')
    .action((descriptionParts, options) => {
      const description = descriptionParts.join(' ');
      const storage = loadStorage();
      const nextId = getNextId(storage);
      const category = options.category || categorizeTodo(description);

      const newTodo: Todo = {
        id: nextId,
        description,
        category,
        completed: false,
        createdAt: new Date().toISOString(),
      };

      storage.todos.push(newTodo);
      saveStorage(storage);

      console.log(`Added todo #${nextId} (category: ${category}): ${description}`);
    });
}
