/**
 * Ачивки на телефоне: личные — из своего журнала тем же `earned`, что на
 * сервере; семейные — только с сервера, телефон чужих журналов не видит.
 */

import { computed, effect, signal } from '@preact/signals';
import { earned } from '@viet/core';
import { achievements, item, topics } from '@viet/content';
import { now, progress } from './app.js';
import { account, api, syncState } from './sync.js';

export const familyEarned = signal<Set<string>>(new Set());

export const mineEarned = computed(() => earned(achievements, progress.value, { topics, item, now: now.value }));

export const allEarned = computed(() => new Set([...mineEarned.value, ...familyEarned.value]));

/** Семейные ачивки — после каждой удачной синхронизации. */
effect(() => {
  const at = syncState.value.at;
  if (account.value.state !== 'user' || !at) return;
  void api<{ family: string[] }>('/achievements')
    .then((r) => (familyEarned.value = new Set(r.family)))
    .catch(() => undefined);
});

/** Что добавилось между двумя наборами — для экрана итога. */
export function newlyEarned(before: Set<string>, after: Set<string>): string[] {
  return achievements.filter((a) => after.has(a.id) && !before.has(a.id)).map((a) => a.id);
}
