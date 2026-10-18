import { defineConfig, devices } from '@playwright/test';

/**
 * E2E клиента в эмуляции iPhone: `npm run e2e`. Распознавание здесь —
 * заглушка (apps/web/e2e/fake-speech.ts): настоящее проверяется только на
 * телефоне (CLAUDE.md, «Проверка на устройстве»).
 */
export default defineConfig({
  testDir: 'apps/web/e2e',
  timeout: 60_000,
  fullyParallel: false,
  reporter: 'list',
  use: {
    ...devices['iPhone 15'],
    baseURL: 'http://localhost:5180',
    // Service worker в тестах только мешает: кэширует прошлую сборку.
    serviceWorkers: 'block',
  },
  webServer: [
    {
      command: 'npm run dev -w @viet/web',
      url: 'http://localhost:5180',
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      // Настоящий бэкенд на своей базе: e2e семьи и синхронизации. База
      // пересоздаётся на каждый запуск (scripts/e2e-api.mjs).
      command: 'node scripts/e2e-api.mjs',
      url: 'http://localhost:3000/health',
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
