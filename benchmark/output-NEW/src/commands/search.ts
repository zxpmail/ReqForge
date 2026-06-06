import { getAllTodos } from '../storage';
import { TodoCategory } from '../types';

const CATEGORY_LABELS: Record<string, string> = {
  feature: 'FEATURE',
  bug: 'BUG',
  refactor: 'REFACTOR',
  chore: 'CHORE',
  docs: 'DOCS',
  test: 'TEST',
};

const CATEGORY_ORDER: TodoCategory[] = ['feature', 'bug', 'refactor', 'chore', 'docs', 'test'];

export function handleSearch(keyword: string, category?: string): void {
  const trimmed = keyword.trim();
  if (!trimmed) {
    console.log('Please provide a search keyword.');
    return;
  }

  const todos = getAllTodos();
  const lowerKeyword = trimmed.toLowerCase();

  const filtered = todos.filter(t => {
    const matchesKeyword = t.description.toLowerCase().includes(lowerKeyword);
    if (!category) return matchesKeyword;
    return matchesKeyword && t.category === category;
  });

  if (filtered.length === 0) {
    console.log('No matching todos found.');
    return;
  }

  for (const cat of CATEGORY_ORDER) {
    const items = filtered.filter(t => t.category === cat);
    if (items.length === 0) continue;

    console.log(`\x1b[1m${CATEGORY_LABELS[cat]}\x1b[0m`);
    for (const todo of items) {
      const status = todo.completed ? '\x1b[32m✓\x1b[0m' : '\x1b[31m○\x1b[0m';
      console.log(`  ${status} #${todo.id} ${todo.description}`);
    }
  }
}
