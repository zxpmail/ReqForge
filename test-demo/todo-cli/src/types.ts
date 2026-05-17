export interface Todo {
  id: number;
  description: string;
  category: string;
  completed: boolean;
  createdAt: string;
}

export interface TodoStorage {
  todos: Todo[];
}

export const DEFAULT_CATEGORIES = [
  'feature',
  'bug',
  'refactor',
  'chore',
  'docs',
  'test',
] as const;

export type Category = typeof DEFAULT_CATEGORIES[number];
