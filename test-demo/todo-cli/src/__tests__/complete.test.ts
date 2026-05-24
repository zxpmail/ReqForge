import { describe, it, expect, vi } from 'vitest';
import { handleComplete } from '../commands/complete';

vi.mock('../storage', () => ({
  completeTodo: vi.fn((id: number) => {
    if (id === 1) return { id, description: 'test', category: 'feature', completed: true, createdAt: new Date().toISOString(), completedAt: new Date().toISOString() };
    return null;
  }),
}));

describe('handleComplete', () => {
  it('completes existing todo', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    handleComplete('1');
    expect(logSpy).toHaveBeenCalledWith('Marked todo #1 as completed');
    logSpy.mockRestore();
  });

  it('rejects non-existent todo', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    handleComplete('999');
    expect(errSpy).toHaveBeenCalledWith('Todo #999 not found.');
    errSpy.mockRestore();
  });

  it('rejects non-numeric ID', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    handleComplete('abc');
    expect(errSpy).toHaveBeenCalledWith('Invalid ID. Please provide a numeric ID.');
    errSpy.mockRestore();
  });
});
