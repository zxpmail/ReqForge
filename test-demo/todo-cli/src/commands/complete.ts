import { Command } from 'commander';
import { loadStorage, saveStorage, findTodoById } from '../storage';

export function addCompleteCommand(program: Command): void {
  program
    .command('complete <id>')
    .description('Mark a todo as completed')
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

      todo.completed = true;
      saveStorage(storage);

      console.log(`Marked todo #${id} as completed`);
    });
}
