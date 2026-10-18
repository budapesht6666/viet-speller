import { fileURLToPath } from 'node:url';
import { defineProject } from 'vitest/config';

export default defineProject({
  // Ядро берём из исходников: тесты контента не должны зависеть от того,
  // собран ли dist.
  resolve: {
    alias: { '@viet/core': fileURLToPath(new URL('../core/src/index.ts', import.meta.url)) },
  },
  test: {
    name: 'content',
    include: ['test/**/*.test.ts'],
  },
});
