import { Task } from './types';

const tasks: Task[] = [
  { id: 1, title: 'Setup CI', description: 'Configure GitHub Actions', status: 'completed', category: 'chore', createdAt: '2026-01-01T00:00:00Z' },
  { id: 2, title: 'Fix login bug', description: 'Session expires too early', status: 'pending', category: 'bug', createdAt: '2026-01-02T00:00:00Z' },
];

let nextId = 3;

export function getAllTasks(): Task[] {
  return [...tasks];
}

export function getTaskById(id: number): Task | undefined {
  return tasks.find(t => t.id === id);
}

export function addTask(title: string, description: string, category: Task['category']): Task {
  const task: Task = {
    id: nextId++,
    title,
    description,
    status: 'pending',
    category,
    createdAt: new Date().toISOString(),
  };
  tasks.push(task);
  return task;
}

export function deleteTask(id: number): boolean {
  const idx = tasks.findIndex(t => t.id === id);
  if (idx === -1) return false;
  tasks.splice(idx, 1);
  return true;
}
