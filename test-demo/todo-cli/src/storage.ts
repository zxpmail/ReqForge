import * as fs from 'fs';
import * as path from 'path';
import { Todo, TodoStore } from './types';

const STORAGE_FILE = path.resolve(process.cwd(), 'todo.json');

const DEFAULT_STORE: TodoStore = { todos: [] };

function readStore(): TodoStore {
  try {
    const data = fs.readFileSync(STORAGE_FILE, 'utf-8');
    const parsed = JSON.parse(data) as TodoStore;
    if (!Array.isArray(parsed.todos)) {
      console.warn('todo.json is corrupted. Starting with an empty list.');
      return { ...DEFAULT_STORE, todos: [] };
    }
    return parsed;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return { ...DEFAULT_STORE, todos: [] };
    }
    console.warn('todo.json is corrupted. Starting with an empty list.');
    return { ...DEFAULT_STORE, todos: [] };
  }
}

function writeStore(store: TodoStore): void {
  fs.writeFileSync(STORAGE_FILE, JSON.stringify(store, null, 2), 'utf-8');
}

let nextId = 0;

function calculateNextId(todos: Todo[]): number {
  if (todos.length === 0) return 1;
  return Math.max(...todos.map(t => t.id)) + 1;
}

export function getAllTodos(): Todo[] {
  const store = readStore();
  return store.todos;
}

export function addTodo(description: string, category: Todo['category']): Todo {
  const store = readStore();
  const id = calculateNextId(store.todos);
  const todo: Todo = {
    id,
    description,
    category,
    completed: false,
    createdAt: new Date().toISOString(),
  };
  store.todos.push(todo);
  writeStore(store);
  return todo;
}

export function completeTodo(id: number): Todo | null {
  const store = readStore();
  const todo = store.todos.find(t => t.id === id);
  if (!todo) return null;
  todo.completed = true;
  todo.completedAt = new Date().toISOString();
  writeStore(store);
  return todo;
}

export function deleteTodo(id: number): boolean {
  const store = readStore();
  const index = store.todos.findIndex(t => t.id === id);
  if (index === -1) return false;
  store.todos.splice(index, 1);
  writeStore(store);
  return true;
}
