import { defineProject } from 'vitest/config';

export default defineProject({
  // Пути из tsconfig.json (их добавляет `nest g library`). Vite 8 умеет
  // это сам, плагин vite-tsconfig-paths из шаблона Nest больше не нужен.
  resolve: { tsconfigPaths: true },
  test: {
    name: 'api',
    globals: true,
    include: ['src/**/*.spec.ts'],
    passWithNoTests: true,
  },
});
