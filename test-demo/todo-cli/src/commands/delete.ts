import { deleteTodo } from '../storage';

export function handleDelete(id: string): void {
  const todoId = parseInt(id, 10);
  if (isNaN(todoId)) {
    console.error('Invalid ID. Please provide a numeric ID.');
    return;
  }

  const deleted = deleteTodo(todoId);
  if (!deleted) {
    console.error(`Todo #${todoId} not found.`);
    return;
  }

  console.log(`Deleted todo #${todoId}`);
}
