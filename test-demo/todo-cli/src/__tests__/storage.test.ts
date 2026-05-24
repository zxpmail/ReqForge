import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { addTodo, getAllTodos, completeTodo, deleteTodo } from '../storage';

const TEST_FILE = path.resolve(process.cwd(), 'todo.json');

describe('storage', () => {
  beforeEach(() => {
    if (fs.existsSync(TEST_FILE)) fs.unlinkSync(TEST_FILE);
  });

  afterEach(() => {
    if (fs.existsSync(TEST_FILE)) fs.unlinkSync(TEST_FILE);
  });

  it('starts with empty list when no file exists', () => {
    expect(getAllTodos()).toEqual([]);
  });

  it('adds a todo and assigns incrementing IDs', () => {
    const t1 = addTodo('first', 'feature');
    expect(t1.id).toBe(1);
    expect(t1.description).toBe('first');
    expect(t1.completed).toBe(false);

    const t2 = addTodo('second', 'bug');
    expect(t2.id).toBe(2);
  });

  it('resets ID to 1 after all todos are deleted', () => {
    addTodo('temp', 'feature');
    addTodo('temp2', 'bug');
    deleteTodo(1);
    deleteTodo(2);
    const t = addTodo('fresh', 'test');
    expect(t.id).toBe(1);
  });

  it('returns all todos sorted by addition order', () => {
    addTodo('a', 'feature');
    addTodo('b', 'bug');
    const all = getAllTodos();
    expect(all).toHaveLength(2);
    expect(all[0].description).toBe('a');
    expect(all[1].description).toBe('b');
  });

  it('completes a todo with timestamp', () => {
    const added = addTodo('do something', 'feature');
    const completed = completeTodo(added.id);
    expect(completed).not.toBeNull();
    expect(completed!.completed).toBe(true);
    expect(completed!.completedAt).toBeDefined();
  });

  it('returns null when completing non-existent todo', () => {
    expect(completeTodo(999)).toBeNull();
  });

  it('deletes a todo and returns true', () => {
    const added = addTodo('delete me', 'chore');
    expect(deleteTodo(added.id)).toBe(true);
    expect(getAllTodos()).toHaveLength(0);
  });

  it('returns false when deleting non-existent todo', () => {
    expect(deleteTodo(999)).toBe(false);
  });

  it('handles corrupted JSON gracefully', () => {
    fs.writeFileSync(TEST_FILE, '{invalid}', 'utf-8');
    expect(getAllTodos()).toEqual([]);
  });

  it('handles missing todos array gracefully', () => {
    fs.writeFileSync(TEST_FILE, '{"not":"todos"}', 'utf-8');
    expect(getAllTodos()).toEqual([]);
  });
});
