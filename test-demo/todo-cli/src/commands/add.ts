import { categorizeTodo } from '../ai-categorize';
import { addTodo } from '../storage';

export async function handleAdd(description: string, apiKey?: string): Promise<void> {
  if (!description.trim()) {
    console.error('Error: description cannot be empty.');
    process.exit(1);
    return;
  }
  const category = await categorizeTodo(description, apiKey);
  const todo = addTodo(description, category);
  console.log(`Added todo #${todo.id} (category: ${category}): ${description}`);
}
