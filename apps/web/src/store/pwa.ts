/**
 * Service worker и обновления — без кнопки «Обновить».
 *
 * Новая версия ставится в фоне и сразу берёт управление (autoUpdate в
 * vite.config.ts). Открытая страница при этом живёт на старом коде, пока
 * её не перезагрузят. Перезагружаем сами, но только когда приложение
 * свёрнуто: так человек не увидит перестройку на глазах (CLAUDE.md,
 * «Правила интерфейса») и урок не оборвётся на полуслове. Вернулся —
 * уже новая версия.
 *
 * Регистрация своя, а не из virtual:pwa-register: плагин в режиме
 * autoUpdate перезагружает страницу сразу, где бы человек ни был.
 */

import { signal } from '@preact/signals';

export type PwaState = 'pending' | 'ready' | 'error' | 'off';
export const pwa = signal<PwaState>('pending');

/**
 * Идёт ли сейчас фоновая установка — первая или обновление. Пока новый
 * service worker качает предзагрузку (вся озвучка — десятки мегабайт) и
 * встаёт на место, в шапке крутится значок.
 */
export const updating = signal(false);

type Worker = Pick<ServiceWorker, 'state' | 'addEventListener'>;

/**
 * Следит за service worker'ами, которые ещё не встали: `installing` (качает),
 * `installed` (скачал, ждёт), `activating` (занимает место). `activated` и
 * `redundant` — конец, значок гаснет. Воркеров бывает больше одного: новое
 * обновление может прийти, пока ставится прошлое.
 */
export function workerTracker(onChange: (busy: boolean) => void): (worker: Worker | null | undefined) => void {
  const busy = new Set<Worker>();
  const watched = new WeakSet<Worker>();
  return (worker) => {
    if (!worker || watched.has(worker)) return;
    watched.add(worker);
    const sync = () => {
      if (worker.state === 'installing' || worker.state === 'installed' || worker.state === 'activating') busy.add(worker);
      else busy.delete(worker);
      onChange(busy.size > 0);
    };
    worker.addEventListener('statechange', sync);
    sync();
  };
}

export function startPwa(): void {
  // В разработке и в e2e service worker'а нет — и состояния тоже.
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) {
    pwa.value = 'off';
    return;
  }
  const sw = navigator.serviceWorker;
  // Смена контроллера на странице, у которой он уже был, — обновление.
  // Первая установка (контроллера не было) перезагрузки не требует.
  let controlled = Boolean(sw.controller);
  let reloadPending = false;
  const reloadWhenHidden = () => {
    if (document.visibilityState === 'hidden') location.reload();
  };
  sw.addEventListener('controllerchange', () => {
    pwa.value = 'ready';
    if (!controlled) {
      controlled = true;
      return;
    }
    if (reloadPending) return;
    reloadPending = true;
    if (document.visibilityState === 'hidden') location.reload();
    else document.addEventListener('visibilitychange', reloadWhenHidden);
  });

  const track = workerTracker((busy) => (updating.value = busy));
  const register = () => {
    sw.register('/sw.js', { scope: '/' })
      .then(async (reg) => {
        // До ожидания ready: первая установка идёт как раз сейчас.
        track(reg.installing ?? reg.waiting);
        reg.addEventListener('updatefound', () => track(reg.installing));
        await sw.ready;
        pwa.value = 'ready';
        // Приложение на домашнем экране живёт днями, не перезапускаясь:
        // проверяем новую версию при каждом возвращении в него.
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') void reg.update().catch(() => undefined);
        });
      })
      .catch(() => (pwa.value = 'error'));
  };
  // После load — чтобы установка не отнимала сеть у первой отрисовки.
  if (document.readyState === 'complete') register();
  else addEventListener('load', register);
}
