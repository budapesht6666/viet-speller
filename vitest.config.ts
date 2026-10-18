import { defineConfig } from 'vitest/config';

// Один запуск на все пакеты: `npm test` из корня, он же в pre-commit.
export default defineConfig({
  test: {
    projects: [
      'packages/core',
      'packages/content',
      'apps/web',
      'apps/api/vitest.config.ts',
      'apps/api/vitest.config.e2e.ts',
    ],
  },
});
