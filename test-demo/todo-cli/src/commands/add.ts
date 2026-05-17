import { addTodo } from '../storage';
import { categorizeTodo } from '../ai-categorize';

export async function handleAdd(description: string, apiKey?: string): Promise<void> {
  const category = await categorizeTodo(description, apiKey);
  const todo = addTodo(description, category);
  console.log(`Added todo #${todo.id} (category: ${category}): ${description}`);
}
