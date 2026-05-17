import { completeTodo } from '../storage';

export function handleComplete(id: string): void {
  const todoId = parseInt(id, 10);
  if (isNaN(todoId)) {
    console.error('Invalid ID. Please provide a numeric ID.');
    return;
  }
  const todo = completeTodo(todoId);
  if (!todo) {
    console.error(`Todo #${todoId} not found.`);
    return;
  }
  console.log(`Marked todo #${todoId} as completed`);
}
