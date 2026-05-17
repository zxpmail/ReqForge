import { getAllTodos } from '../storage';
import { TodoCategory } from '../types';

const CATEGORY_LABELS: Record<TodoCategory, string> = {
  feature: 'FEATURE',
  bug: 'BUG',
  refactor: 'REFACTOR',
  chore: 'CHORE',
  docs: 'DOCS',
  test: 'TEST',
};

const CATEGORY_ORDER: TodoCategory[] = ['feature', 'bug', 'refactor', 'chore', 'docs', 'test'];

export function handleList(): void {
  const todos = getAllTodos();

  if (todos.length === 0) {
    console.log('No todos found.');
    return;
  }

  const grouped: Partial<Record<TodoCategory, typeof todos>> = {};
  for (const cat of CATEGORY_ORDER) {
    grouped[cat] = [];
  }
  for (const todo of todos) {
    grouped[todo.category]?.push(todo);
  }

  for (const cat of CATEGORY_ORDER) {
    const items = grouped[cat];
    if (!items || items.length === 0) continue;

    console.log(`\x1b[1m${CATEGORY_LABELS[cat]}\x1b[0m`);
    for (const todo of items) {
      const status = todo.completed ? '\x1b[32m✓\x1b[0m' : '\x1b[31m○\x1b[0m';
      console.log(`  ${status} #${todo.id} ${todo.description}`);
    }
  }
}
