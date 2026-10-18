/**
 * Всё движение приложения собрано здесь.
 *
 * Кривая одна на весь проект и продублирована из tokens.css: GSAP не умеет
 * читать CSS-переменные как ease, поэтому значение приходится держать в двух
 * местах. Расходиться им нельзя — это проверяет test/motion.test.ts.
 */

import { gsap } from 'gsap';

/** Те же четыре числа, что `--ease-out` в tokens.css. */
export const EASE_OUT_POINTS = [0.16, 1, 0.3, 1] as const;
export const EASE_OUT = `cubic-bezier(${EASE_OUT_POINTS.join(', ')})`;
/** `--ease-pop`: отдача при засчитанном шаге, и только она. */
export const EASE_POP = 'back.out(1.7)';

/** Уважение к prefers-reduced-motion решается один раз и в одном месте. */
export const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

gsap.defaults({ ease: EASE_OUT, duration: 0.45 });

/**
 * Снимает заставку загрузки.
 *
 * Узел удаляется, а не прячется: он больше не понадобится никогда, а `hidden`
 * оставил бы поверх приложения элемент во весь экран — ровно ту вещь, которая
 * однажды всплывёт как «клики не проходят».
 */
export function hideBoot(node: HTMLElement): void {
  if (calm) {
    node.remove();
    return;
  }
  gsap.to(node, { opacity: 0, duration: 0.4, onComplete: () => node.remove() });
}

/** Засчитанный шаг отзывается отдачей: без неё успех проходит незамеченным. */
export function pop(node: HTMLElement): void {
  if (calm) return;
  gsap.fromTo(node, { scale: 1 }, { scale: 1.08, duration: 0.14, yoyo: true, repeat: 1, ease: EASE_POP });
}

/** Индикатор «слушаю» тихо дышит, пока микрофон открыт. */
export function pulse(node: HTMLElement): gsap.core.Tween | null {
  if (calm) return null;
  return gsap.to(node, { opacity: 0.45, duration: 0.9, repeat: -1, yoyo: true, ease: 'sine.inOut' });
}
