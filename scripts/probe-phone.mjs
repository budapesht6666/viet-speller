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

import { Tunnel } from 'cloudflared';
import QRCode from 'qrcode';
import { createServer } from 'vite';

const PORT = 5174;
const PAGE = '/vi-probe.html';

const server = await createServer({ configFile: new URL('../research/vite.config.mjs', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'), logLevel: 'warn' });
await server.listen();
console.log(`Проба запущена: http://localhost:${PORT}${PAGE}  (с этого адреса ноутбук играет образцы)`);
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
