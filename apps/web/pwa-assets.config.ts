import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

/**
 * Иконки PWA из одного SVG: `npm run icons -w @viet/web`, результат коммитится.
 *
 * Поля убраны у Apple и maskable: исходник уже залит во весь квадрат, а буква
 * стоит внутри безопасной зоны maskable (круг 80 %). С полями по умолчанию iOS
 * показывала бы оранжевый квадрат в белой рамке внутри своего скругления.
 */
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    apple: { ...minimal2023Preset.apple, padding: 0 },
    maskable: { ...minimal2023Preset.maskable, padding: 0 },
  },
  images: ['public/icons/icon.svg'],
});
