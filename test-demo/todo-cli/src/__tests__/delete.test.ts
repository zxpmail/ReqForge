import { describe, it, expect, vi } from 'vitest';
import { handleDelete } from '../commands/delete';

vi.mock('../storage', () => ({
  deleteTodo: vi.fn((id: number) => id === 1),
}));

describe('handleDelete', () => {
  it('deletes existing todo', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    handleDelete('1');
    expect(logSpy).toHaveBeenCalledWith('Deleted todo #1');
    logSpy.mockRestore();
  });

  it('rejects non-existent todo', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    handleDelete('999');
    expect(errSpy).toHaveBeenCalledWith('Todo #999 not found.');
    errSpy.mockRestore();
  });

  it('rejects non-numeric ID', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    handleDelete('abc');
    expect(errSpy).toHaveBeenCalledWith('Invalid ID. Please provide a numeric ID.');
    errSpy.mockRestore();
  });
});
