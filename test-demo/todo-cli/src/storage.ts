import * as fs from 'fs';
import * as path from 'path';
import { Todo, TodoStorage } from './types';

const STORAGE_FILE = 'todo.json';

export function getStoragePath(): string {
  return path.join(process.cwd(), STORAGE_FILE);
}

export function loadStorage(): TodoStorage {
  const filePath = getStoragePath();

  if (!fs.existsSync(filePath)) {
    return { todos: [] };
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content) as TodoStorage;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, (error as Error).message);
    return { todos: [] };
  }
}

export function saveStorage(storage: TodoStorage): void {
  const filePath = getStoragePath();
  const content = JSON.stringify(storage, null, 2);
  fs.writeFileSync(filePath, content, 'utf8');
}

export function getNextId(storage: TodoStorage): number {
  if (storage.todos.length === 0) {
    return 1;
  }
  return Math.max(...storage.todos.map(t => t.id)) + 1;
}

export function findTodoById(storage: TodoStorage, id: number): Todo | undefined {
  return storage.todos.find(t => t.id === id);
}
