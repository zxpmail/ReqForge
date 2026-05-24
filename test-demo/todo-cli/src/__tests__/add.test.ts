import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleAdd } from '../commands/add';

vi.mock('../storage', () => ({
  addTodo: vi.fn((desc: string, cat: string) => ({
    id: 1, description: desc, category: cat, completed: false,
    createdAt: new Date().toISOString(),
  })),
}));

vi.mock('../ai-categorize', () => ({
  categorizeTodo: vi.fn(() => Promise.resolve('feature' as const)),
}));

describe('handleAdd', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects empty description', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await handleAdd('');
    expect(errorSpy).toHaveBeenCalledWith('Error: description cannot be empty.');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('rejects whitespace-only description', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await handleAdd('   ');
    expect(errorSpy).toHaveBeenCalledWith('Error: description cannot be empty.');
    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('accepts valid description', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await handleAdd('valid task');
    expect(logSpy).toHaveBeenCalledWith('Added todo #1 (category: feature): valid task');
    logSpy.mockRestore();
  });
});
