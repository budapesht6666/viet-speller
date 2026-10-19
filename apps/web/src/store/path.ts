/**
 * Какую тему показывать на «Учёбе». Закрытые темы не показываем вовсе:
 * урок открывается после предыдущего, и путь целиком только загромождал
 * главный экран.
 *
 * По умолчанию — последняя открытая тема. Человек может выбрать другую на
 * вкладке «Темы»; выбор держится, пока не откроется новая тема, — тогда
 * снова показываем её.
 */

import { signal } from '@preact/signals';
import { unlockedLessons, type Progress, type Topic } from '@viet/core';
import { lessons, topics } from '@viet/content';

const chosen = signal<{ id: string; open: number } | null>(null);

/** Темы, где открыт хотя бы один урок, — в порядке пути. */
export function openTopics(p: Progress): Topic[] {
  const open = unlockedLessons(lessons, p);
  return topics.filter((tp) => tp.lessons.some((l) => open.has(l.id)));
}

export function shownTopic(p: Progress): Topic {
  const list = openTopics(p);
  const c = chosen.value;
  const picked = c && c.open === list.length ? list.find((tp) => tp.id === c.id) : undefined;
  return picked ?? list[list.length - 1] ?? topics[0]!;
}

export function chooseTopic(id: string, p: Progress): void {
  chosen.value = { id, open: openTopics(p).length };
}
