import '@fontsource-variable/nunito';
import './styles/base.css';
import './styles/app.css';
import { render } from 'preact';
import { App } from './app.js';
import { hideBoot } from './ui/motion.js';

render(<App />, document.getElementById('app')!);

/**
 * Заставка снимается, когда интерфейс собран и шрифт готов: без этого первый
 * кадр показывает текст системным шрифтом, а потом он прыгает по ширине.
 *
 * Потолок ожидания обязателен. Шрифт может не приехать вовсе (плохая сеть,
 * блокировщик), и тогда заставка без потолка висела бы вечно — хуже любого
 * мигания.
 */
const CAP = new Promise<void>((resolve) => setTimeout(resolve, 2500));

async function ready(): Promise<void> {
  await document.fonts?.ready;
}

void Promise.race([ready(), CAP]).then(() => {
  const boot = document.getElementById('boot');
  if (boot) hideBoot(boot);
});
