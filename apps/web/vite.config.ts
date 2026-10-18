import { fileURLToPath } from 'node:url';
import preact from '@preact/preset-vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const local = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  plugins: [
    preact(),
    VitePWA({
      // Обновление не ставится само посреди урока — показываем кнопку.
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'icons/*.svg', 'icons/*.png'],
      manifest: {
        name: 'Viet Speller',
        short_name: 'Viet Speller',
        description: 'Вьетнамский с нуля для тех, кто живёт во Вьетнаме',
        lang: 'ru',
        start_url: '/',
        display: 'standalone',
        // Совпадает с --c-paper и с theme-color в index.html.
        background_color: '#ffffff',
        theme_color: '#ffffff',
        icons: [
          { src: '/icons/pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: '/icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Озвучка — в предзагрузку целиком: без неё разговорник не работает
        // без сети, а это его единственное обещание (PLAN.md, этап 9).
        // Иконки Streamline (их почти 400) — по мере показа, а не все сразу.
        globPatterns: ['**/*.{js,css,html,png,ico,woff2,mp3}', 'icons/*.svg'],
        globIgnores: ['design-system.html'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/assets/'),
            handler: 'CacheFirst',
            options: { cacheName: 'streamline', expiration: { maxEntries: 400 } },
          },
        ],
        // API и проверка здоровья — это сервер, а не оболочка приложения.
        navigateFallbackDenylist: [/^\/api\//, /^\/health/],
      },
    }),
  ],
  resolve: {
    // Пакеты монорепо берём из исходников: правка в ядре видна сразу, без
    // пересборки dist. Сервер (Node) берёт собранный dist.
    alias: {
      '@viet/core': local('../../packages/core/src/index.ts'),
      '@viet/content': local('../../packages/content/src/index.ts'),
    },
  },
  build: {
    // Приложение и стенд дизайн-системы — две точки входа. Стенд не служебная
    // страница: он собирается вместе с приложением и не может протухнуть.
    rolldownOptions: {
      input: {
        main: local('index.html'),
        'design-system': local('design-system.html'),
      },
    },
  },
  server: {
    // Свой порт и без перебора: 5173 обычно занят Speller, 5174 — пробой
    // этапа 0. Сдвинувшийся сервер увёл бы туннель на чужое приложение.
    port: 5180,
    strictPort: true,
    // Распознавание проверяется только на живом телефоне через туннель,
    // поэтому слушаем все интерфейсы.
    host: true,
    // Cloudflare quick tunnel приходит с чужим Host — без этого Vite отвечает
    // «Blocked request», и на телефоне пустая страница.
    allowedHosts: true,
    proxy: {
      '/api': 'http://localhost:3000',
      '/health': 'http://localhost:3000',
    },
  },
});
