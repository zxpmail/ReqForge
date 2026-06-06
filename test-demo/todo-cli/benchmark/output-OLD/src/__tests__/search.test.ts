import { describe, it, expect, vi } from 'vitest';
import { handleSearch } from '../commands/search';
import * as storage from '../storage';

vi.mock('../storage', () => ({
  getAllTodos: vi.fn(),
}));

describe('handleSearch', () => {
  it('searches by keyword', () => {
    vi.mocked(storage.getAllTodos).mockReturnValue([
      { id: 1, description: 'fix login bug', category: 'bug', completed: false, createdAt: '2026-01-01T00:00:00.000Z' },
      { id: 2, description: 'add search feature', category: 'feature', completed: false, createdAt: '2026-01-02T00:00:00.000Z' },
    ]);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    handleSearch('bug');
    expect(logSpy.mock.calls[0][0]).toContain('BUG');
    expect(logSpy.mock.calls[1][0]).toContain('fix login bug');
    expect(logSpy).not.toHaveBeenCalledWith(expect.stringContaining('add search feature'));
    logSpy.mockRestore();
  });

  it('shows no match message', () => {
    vi.mocked(storage.getAllTodos).mockReturnValue([
      { id: 1, description: 'fix login bug', category: 'bug', completed: false, createdAt: '2026-01-01T00:00:00.000Z' },
    ]);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    handleSearch('nonexistent');
    expect(logSpy).toHaveBeenCalledWith('No matching todos found.');
    logSpy.mockRestore();
  });

  it('filters by category', () => {
    vi.mocked(storage.getAllTodos).mockReturnValue([
      { id: 1, description: 'fix bug', category: 'bug', completed: false, createdAt: '2026-01-01T00:00:00.000Z' },
      { id: 2, description: 'add feature', category: 'feature', completed: false, createdAt: '2026-01-02T00:00:00.000Z' },
    ]);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    handleSearch('fix', 'bug');
    expect(logSpy.mock.calls[0][0]).toContain('BUG');
    expect(logSpy.mock.calls[1][0]).toContain('fix bug');
    expect(logSpy).not.toHaveBeenCalledWith(expect.stringContaining('add feature'));
    logSpy.mockRestore();
  });

  it('is case insensitive', () => {
    vi.mocked(storage.getAllTodos).mockReturnValue([
      { id: 1, description: 'Fix Login Bug', category: 'bug', completed: false, createdAt: '2026-01-01T00:00:00.000Z' },
    ]);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    handleSearch('fix');
    expect(logSpy.mock.calls[1][0]).toContain('Fix Login Bug');
    logSpy.mockRestore();
  });

  it('rejects empty keyword', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    handleSearch('   ');
    expect(logSpy).toHaveBeenCalledWith('Please provide a search keyword.');
    logSpy.mockRestore();
  });
});
