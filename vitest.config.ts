import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json', 'html'],
    },
    globals: true,
    include: ['**/__tests__/**/*.spec.ts'],
    reporters: 'verbose',
    setupFiles: ['src/__tests__/setup.ts'],
  },
});
