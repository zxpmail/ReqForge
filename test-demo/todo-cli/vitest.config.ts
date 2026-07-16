import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: '.',
  test: {
    include: ['src/__tests__/**/*.test.ts'],
    setupFiles: ['src/__tests__/setup.ts'],
    // Shared todo.json / storage races if files run in parallel (PR #8 / smoke gate).
    fileParallelism: false,
  },
});
