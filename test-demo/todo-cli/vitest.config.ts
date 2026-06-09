import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: '.',
  test: {
    include: ['src/__tests__/**/*.test.ts'],
    fileParallelism: false,
  },
});
