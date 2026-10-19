#!/usr/bin/env node
/**
 * Бэкенд для e2e: собранный Nest на чистой базе в apps/api/data/e2e.db.
 * Запускает Playwright (playwright.config.ts) — руками не нужен.
 */

import { execSync, spawn } from 'node:child_process';
import { rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const api = fileURLToPath(new URL('../apps/api/', import.meta.url));
const env = {
  ...process.env,
  DATABASE_URL: 'file:./data/e2e.db',
  JWT_SECRET: 'e2e-secret-not-for-production',
  WEB_DIST: '../web/dist',
  PORT: '3000',
  // Настоящий ИИ в e2e не зовём: ответы подменяет сам тест (talk.spec.ts),
  // а пустые ключи сильнее тех, что лежат в apps/api/.env.
  GEMINI_API_KEY: '',
  GROQ_API_KEY: '',
};
rmSync(`${api}data/e2e.db`, { force: true });
execSync('npx prisma migrate deploy', { cwd: api, env, stdio: 'ignore' });
execSync('npm run build', { cwd: api, env, stdio: 'ignore' });
const server = spawn(process.execPath, ['dist/main.js'], { cwd: api, env, stdio: 'inherit' });
const stop = () => server.kill();
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
server.on('exit', (code) => process.exit(code ?? 0));
