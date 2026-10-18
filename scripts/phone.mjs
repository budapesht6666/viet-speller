#!/usr/bin/env node
/**
 * Всё приложение на телефоне одной командой: `npm run phone`.
 *
 * Собирает пакеты, клиент и сервер, поднимает Nest (он раздаёт и клиент)
 * на базе apps/api/data/dev.db и https-туннель к нему — без https iPhone не
 * даёт микрофон. Печатает адрес и QR-код. Ctrl+C останавливает всё.
 *
 * Адрес туннеля при каждом запуске новый: ярлык на домашнем экране от
 * прошлого запуска ведёт в никуда.
 */

import { execSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Tunnel } from 'cloudflared';
import QRCode from 'qrcode';

const root = fileURLToPath(new URL('..', import.meta.url));
const api = `${root}apps/api/`;
const PORT = 3000;

console.log('Собираю приложение (около минуты)…');
execSync('npm run build', { cwd: root, stdio: 'ignore' });
// .env бэкенда читает сам Nest (ConfigModule), миграции — prisma.
execSync('npx prisma migrate deploy', { cwd: api, stdio: 'ignore' });

const server = spawn(process.execPath, ['dist/main.js'], { cwd: api, env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
server.on('exit', (code) => {
  console.error(`Сервер остановился (код ${code}). Проверь apps/api/.env: нужен JWT_SECRET (см. .env.example).`);
  process.exit(1);
});

console.log('Сервер запущен. Поднимаю туннель…');
const tunnel = Tunnel.quick(`http://localhost:${PORT}`);
let url = '';
let shown = false;
tunnel.once('url', (u) => (url = u));
tunnel.on('connected', async () => {
  if (shown || !url) return;
  shown = true;
  console.log('\nНа iPhone открой в Safari (камера → QR-код):\n');
  console.log(await QRCode.toString(url, { type: 'terminal', small: true }));
  console.log(`  ${url}\n`);
  console.log('Не открылось сразу — подожди 10–20 секунд и обнови: новый адрес расходится по DNS не мгновенно.');
  console.log('Распознавание проверяй с иконки: «Поделиться» → «На экран Домой».');
  console.log('Остановить: Ctrl+C.\n');
});
tunnel.on('error', (e) => console.error('Туннель:', e.message));

const stop = () => {
  tunnel.stop();
  server.removeAllListeners('exit');
  server.kill();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
