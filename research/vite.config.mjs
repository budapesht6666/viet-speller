import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from 'vite';

const ROOT = import.meta.dirname;

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve(null);
      }
    });
  });
}

function send(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

/**
 * Проигрывает файл колонками ноутбука. Окно ffplay не открывается.
 * `PROBE_SILENT=1` — только изобразить проигрывание: для тестов пробы, чтобы
 * они не заговорили из колонок посреди чужой работы.
 */
function play(file) {
  if (process.env.PROBE_SILENT) return new Promise((r) => setTimeout(() => r({ ok: true }), 600));
  return new Promise((resolve) => {
    const p = spawn('ffplay', ['-nodisp', '-autoexit', '-loglevel', 'error', file], { stdio: 'ignore' });
    p.on('error', (e) => resolve({ ok: false, error: `ffplay не запустился: ${e.message}` }));
    p.on('close', (code) => resolve(code === 0 ? { ok: true } : { ok: false, error: `ffplay завершился с кодом ${code}` }));
  });
}

/**
 * Автозамер: телефон слушает, ноутбук говорит.
 *
 * - `POST /probe-play {text, voice}` — сыграть образец колонками ноутбука.
 *   Ответ приходит, когда образец доиграл: по нему телефон знает, когда
 *   звук кончился, и меряет задержку распознавания от этого момента.
 *   Играет сам сервер (ffplay), а не вкладка браузера: браузер без касания
 *   звук не даёт, а касаться ноутбука во время замера никто не должен.
 * - `POST /probe-report {name, text}` — сохранить отчёт прогона в
 *   `research/runs/`, чтобы его не надо было копировать с телефона.
 */
function probeServer() {
  return {
    name: 'probe-server',
    configureServer(server) {
      // console.log, а не logger Vite: probe:phone запускает сервер с logLevel 'warn'.
      const say = (msg) => console.log(`[${new Date().toLocaleTimeString('ru')}] ${msg}`);

      server.middlewares.use('/probe-play', async (req, res) => {
        if (req.method !== 'POST') return send(res, 405, { ok: false });
        const cmd = await readBody(req);
        if (!cmd?.text || !cmd?.voice) return send(res, 400, { ok: false, error: 'нужны text и voice' });
        const manifest = JSON.parse(readFileSync(join(ROOT, 'audio', 'manifest.json'), 'utf8'));
        const file = manifest[`${cmd.voice}|+0%|${cmd.text.normalize('NFC')}`];
        if (!file) return send(res, 404, { ok: false, error: `нет образца для «${cmd.text}»` });
        // Пауза: телефону нужно мгновение, чтобы сессия начала слушать.
        await new Promise((r) => setTimeout(r, 400));
        say(`играю: ${cmd.text}`);
        const result = await play(join(ROOT, 'audio', file));
        if (!result.ok) say(`не сыграло: ${result.error}`);
        send(res, 200, result);
      });

      // Телефону нужно касание: пискнуть колонками, чтобы человек подошёл.
      server.middlewares.use('/probe-beep', (req, res) => {
        say('>>> КОСНИСЬ ЭКРАНА ТЕЛЕФОНА <<<');
        if (!process.env.PROBE_SILENT) {
          spawn('ffplay', ['-nodisp', '-autoexit', '-loglevel', 'error', '-f', 'lavfi', '-i', 'sine=frequency=880:duration=0.25'], { stdio: 'ignore' }).on('error', () => {});
        }
        send(res, 200, { ok: true });
      });

      server.middlewares.use('/probe-report', async (req, res) => {
        if (req.method !== 'POST') return send(res, 405, { ok: false });
        const report = await readBody(req);
        if (!report?.text) return send(res, 400, { ok: false });
        const dir = join(ROOT, 'runs');
        mkdirSync(dir, { recursive: true });
        const d = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
        const name = `${stamp}-${String(report.name || 'run').replace(/[^\p{L}\p{N}_-]+/gu, '_')}.md`;
        writeFileSync(join(dir, name), report.text, 'utf8');
        say(`отчёт сохранён: research/runs/${name}`);
        send(res, 200, { ok: true, path: `research/runs/${name}` });
      });
    },
  };
}

// Пробы раздаются отдельным сервером: им не нужен ни Preact, ни сборка
// приложения, а открывать их надо с телефона через туннель.
export default defineConfig({
  root: ROOT,
  plugins: [probeServer()],
  server: {
    port: 5174,
    strictPort: true,
    // Туннель подключается к дев-серверу снаружи, поэтому слушаем все интерфейсы.
    host: true,
    // Cloudflare quick tunnel приходит с чужим Host — без этого Vite отвечает
    // «Blocked request», и на телефоне пустая страница.
    allowedHosts: true,
  },
});
