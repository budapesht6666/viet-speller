import { defineConfig } from 'vite';

/**
 * Ретранслятор «телефон → ноутбук-колонка». Телефон, открывая окно задания,
 * кладёт сюда команду (POST), колонка забирает её опросом (GET) и играет
 * образец. Так номер задания задаёт один телефон, и на двух устройствах он
 * разойтись не может. Хранится одна последняя команда, в памяти.
 */
function probeRelay() {
  let last = { seq: 0 };
  return {
    name: 'probe-relay',
    configureServer(server) {
      server.middlewares.use('/probe-relay', (req, res) => {
        res.setHeader('Cache-Control', 'no-store');
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', () => {
            try {
              last = JSON.parse(body);
              res.end('ok');
            } catch {
              res.statusCode = 400;
              res.end('bad json');
            }
          });
          return;
        }
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(last));
      });
    },
  };
}

// Пробы раздаются отдельным сервером: им не нужен ни Preact, ни сборка
// приложения, а открывать их надо с телефона через туннель.
export default defineConfig({
  root: import.meta.dirname,
  plugins: [probeRelay()],
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
