import { Command } from 'commander';
import { loadStorage, saveStorage, findTodoById } from '../storage';

export function addDeleteCommand(program: Command): void {
  program
    .command('delete <id>')
    .description('Delete a todo')
    .action((idStr) => {
      const id = parseInt(idStr, 10);

      if (isNaN(id)) {
        console.error('Error: ID must be a number');
        process.exit(1);
      }

      const storage = loadStorage();
      const todo = findTodoById(storage, id);

      if (!todo) {
        console.error(`Error: Todo #${id} not found`);
        process.exit(1);
      }

      storage.todos = storage.todos.filter(t => t.id !== id);
      saveStorage(storage);

      console.log(`Deleted todo #${id}`);
    });
}
