import { describe, it, expect, vi } from 'vitest';
import { handleList } from '../commands/list';
import * as storage from '../storage';

vi.mock('../storage', () => ({
  getAllTodos: vi.fn(),
}));

describe('handleList', () => {
  it('shows empty message when no todos', () => {
    vi.mocked(storage.getAllTodos).mockReturnValue([]);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    handleList();
    expect(logSpy).toHaveBeenCalledWith('No todos found.');
    logSpy.mockRestore();
  });

  it('groups and displays todos by category', () => {
    vi.mocked(storage.getAllTodos).mockReturnValue([
      { id: 1, description: 'task1', category: 'feature', completed: false, createdAt: '2026-01-01T00:00:00.000Z' },
      { id: 2, description: 'task2', category: 'bug', completed: true, createdAt: '2026-01-02T00:00:00.000Z' },
    ]);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    handleList();
    expect(logSpy).toHaveBeenCalledTimes(4);
    expect(logSpy.mock.calls[0][0]).toContain('FEATURE');
    expect(logSpy.mock.calls[1][0]).toContain('task1');
    expect(logSpy.mock.calls[2][0]).toContain('BUG');
    expect(logSpy.mock.calls[3][0]).toContain('task2');
    logSpy.mockRestore();
  });
});
