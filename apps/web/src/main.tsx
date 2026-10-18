import '@fontsource-variable/nunito';
import './styles/base.css';
import './styles/app.css';
import { render } from 'preact';
import { App } from './app.js';
import { boot } from './store/app.js';
import { startSync } from './store/sync.js';
import { hideBoot } from './ui/motion.js';

/**
 * Заставка снимается, когда журнал прочитан, интерфейс собран и шрифт готов:
 * иначе первый кадр показывает пустой путь, а через мгновение — пройденные
 * уроки, и текст прыгает по ширине при смене шрифта.
 *
 * Потолок ожидания обязателен. Шрифт может не приехать вовсе (плохая сеть,
 * блокировщик), и тогда заставка без потолка висела бы вечно — хуже любого
 * мигания.
 */
const CAP = new Promise<void>((resolve) => setTimeout(resolve, 2500));

// Интерфейс рисуется в любом случае, даже если хранилище не ответило за
// потолок: журнал придёт позже через сигналы, а строка «Открываю
// хранилище…» на главной это покажет. Пустой экран под снятой заставкой
// хуже.
let rendered = false;
const show = () => {
  if (rendered) return;
  rendered = true;
  render(<App />, document.getElementById('app')!);
};

const booted = boot().catch(() => undefined).then(show);
// Сеть — после журнала: синхронизация дописывает события в уже прочитанный журнал.
void booted.then(startSync);

void Promise.race([booted.then(() => document.fonts?.ready), CAP]).then(() => {
  show();
  const el = document.getElementById('boot');
  if (el) hideBoot(el);
});
