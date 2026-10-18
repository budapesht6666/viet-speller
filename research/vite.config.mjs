import { defineConfig } from 'vite';

// Пробы раздаются отдельным сервером: им не нужен ни Preact, ни сборка
// приложения, а открывать их надо с телефона через туннель.
export default defineConfig({
  root: import.meta.dirname,
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
