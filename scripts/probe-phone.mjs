#!/usr/bin/env node
/**
 * Проба этапа 0 для телефона — одной командой: `npm run probe:phone`.
 *
 * Поднимает две вещи, и обе нужны:
 * - дев-сервер пробы на http://localhost:5174 — он отдаёт страницу и образцы;
 * - Cloudflare quick tunnel к нему — даёт адрес https://….trycloudflare.com.
 *   Без https iPhone не даёт ни микрофон, ни распознавание, а адрес вида
 *   http://192.168.x.x защищённым не считается.
 *
 * Адрес печатается вместе с QR-кодом, когда туннель уже подключён: открытый
 * раньше времени адрес отвечает ошибкой DNS, и кажется, что сломано всё.
 *
 * Ctrl+C останавливает оба. Адрес туннеля при каждом запуске новый.
 */

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Tunnel } from 'cloudflared';
import QRCode from 'qrcode';
import { createServer } from 'vite';

const PORT = 5174;
const PAGE = '/vi-probe.html';

// Образцы играет сам сервер через ffplay (из ffmpeg). Без него автозамер
// молчал бы — лучше сказать об этом сразу, чем через пять минут.
if (spawnSync('ffplay', ['-version'], { stdio: 'ignore' }).status !== 0) {
  console.error('Не найден ffplay — он играет образцы. Поставь ffmpeg: winget install Gyan.FFmpeg');
  process.exit(1);
}

const server = await createServer({
  configFile: fileURLToPath(new URL('../research/vite.config.mjs', import.meta.url)),
  logLevel: 'warn',
});
await server.listen();
console.log('Проба запущена. Образцы играют колонки этого ноутбука: громкость средняя, без наушников.');
console.log('Поднимаю туннель…');

const tunnel = Tunnel.quick(`http://localhost:${PORT}`);
let url = '';
let shown = false;

tunnel.once('url', (u) => (url = u));
tunnel.on('connected', async () => {
  if (shown || !url) return;
  shown = true;
  const phone = `${url}${PAGE}`;
  console.log('\nНа iPhone открой в Safari (камера → QR-код):\n');
  console.log(await QRCode.toString(phone, { type: 'terminal', small: true }));
  console.log(`  ${phone}\n`);
  console.log('Дальше на телефоне одна кнопка — «Начать автозамер». Телефон положи в метре от ноутбука.');
  console.log('Отчёт сохранится сам в research/runs/.');
  console.log('Если страница не открылась сразу — подожди 10–20 секунд и обнови: новый адрес расходится по DNS не мгновенно.');
  console.log('Остановить: Ctrl+C. Пока окно открыто, адрес живёт.\n');
});
tunnel.on('error', (e) => console.error('Туннель:', e.message));
tunnel.on('exit', (code) => {
  console.error(`cloudflared завершился (код ${code}). Телефон больше не достучится до пробы.`);
  void server.close().then(() => process.exit(1));
});

const stop = () => {
  tunnel.stop();
  void server.close().then(() => process.exit(0));
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
