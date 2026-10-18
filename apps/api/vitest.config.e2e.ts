import { defineProject } from 'vitest/config';

export default defineProject({
  resolve: { tsconfigPaths: true },
  test: {
    name: 'api-e2e',
    globals: true,
    include: ['test/**/*.e2e-spec.ts'],
  },
});
