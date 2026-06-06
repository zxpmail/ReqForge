import { describe, it, expect, vi } from 'vitest';
import { handleSearch } from '../commands/search';
import * as storage from '../storage';

vi.mock('../storage', () => ({
  getAllTodos: vi.fn(),
}));

describe('handleSearch', () => {
  const makeTodo = (id: number, description: string, category: string, completed = false) => ({
    id, description, category, completed,
    createdAt: `2026-01-0${id}T00:00:00.000Z`,
  });

  it('finds todos by keyword', () => {
    vi.mocked(storage.getAllTodos).mockReturnValue([
      makeTodo(1, 'fix login bug', 'bug'),
      makeTodo(2, 'add search feature', 'feature'),
    ]);
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    handleSearch('bug');
    expect(spy.mock.calls[0][0]).toContain('BUG');
    expect(spy.mock.calls[1][0]).toContain('fix login bug');
    spy.mockRestore();
  });

  it('shows empty state', () => {
    vi.mocked(storage.getAllTodos).mockReturnValue([
      makeTodo(1, 'fix login bug', 'bug'),
    ]);
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    handleSearch('nonexistent');
    expect(spy).toHaveBeenCalledWith('No matching todos found.');
    spy.mockRestore();
  });

  it('supports category filter', () => {
    vi.mocked(storage.getAllTodos).mockReturnValue([
      makeTodo(1, 'fix bug', 'bug'),
      makeTodo(2, 'add feature', 'feature'),
    ]);
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    handleSearch('fix', 'bug');
    expect(spy.mock.calls[0][0]).toContain('BUG');
    expect(spy.mock.calls[1][0]).toContain('fix bug');
    spy.mockRestore();
  });

  it('is case insensitive', () => {
    vi.mocked(storage.getAllTodos).mockReturnValue([
      makeTodo(1, 'Fix Login Bug', 'bug'),
    ]);
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    handleSearch('fix');
    expect(spy.mock.calls[1][0]).toContain('Fix Login Bug');
    spy.mockRestore();
  });

  it('rejects empty keyword', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    handleSearch('   ');
    expect(spy).toHaveBeenCalledWith('Please provide a search keyword.');
    spy.mockRestore();
  });
});
