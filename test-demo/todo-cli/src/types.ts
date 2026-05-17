export type TodoCategory = 'feature' | 'bug' | 'refactor' | 'chore' | 'docs' | 'test';

export interface Todo {
  id: number;
  description: string;
  category: TodoCategory;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
}

export interface TodoStore {
  todos: Todo[];
}
