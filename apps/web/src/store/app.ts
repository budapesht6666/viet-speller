/**
 * Состояние приложения — сигналы. Источник правды один: журнал событий.
 * Прогресс, серия, карточки — `computed` из него тем же `replay`, что
 * считает сервер.
 */

import { computed, signal } from '@preact/signals';
import { replay, type ProgressEvent } from '@viet/core';
import { appendEvent, loadEvents, openStorage, readSetting, writeSetting, type Storage } from './db.js';

export const storage = signal<Storage | 'pending'>('pending');
export const events = signal<ProgressEvent[]>([]);
export const progress = computed(() => replay(events.value));

/** Часы приложения: серия дней и режим «не могу говорить» зависят от времени. */
export const now = signal(new Date());
setInterval(() => (now.value = new Date()), 30_000);

/** Режим «не могу говорить» — до этого момента (мс). Как у Duolingo: на 15 минут. */
export const NO_MIC_MINUTES = 15;
export const noMicUntil = signal(0);
export const noMic = computed(() => now.value.getTime() < noMicUntil.value);

/** Ежедневная цель в минутах: 5, 10 или 20. */
export const GOALS = [5, 10, 20] as const;
export const dailyGoal = signal<number>(10);

export interface Summary {
  kind: 'lesson' | 'review';
  title: string;
  lessonId?: string;
  accuracy: number;
  seconds: number;
  items: number;
  /** Итог записан в журнал. Нет — это видно на экране, а не теряется молча. */
  saved: boolean;
  /** Ачивки, полученные этим уроком. */
  newAchievements: string[];
}

export type Route =
  | { name: 'home' }
  | { name: 'lesson'; lessonId: string }
  | { name: 'review' }
  | { name: 'done'; summary: Summary }
  | { name: 'phrasebook' }
  | { name: 'progress' }
  | { name: 'talk' }
  | { name: 'family' };

/** Экраны с нижней панелью вкладок. Урок и итог идут без неё: там не отвлекаем. */
export type TabName = 'home' | 'phrasebook' | 'progress' | 'family';
export const TAB_NAMES: ReadonlySet<Route['name']> = new Set<TabName>(['home', 'phrasebook', 'progress', 'family']);

export const route = signal<Route>({ name: 'home' });

export function go(next: Route): void {
  route.value = next;
  window.scrollTo(0, 0);
}

/** UUID события. `crypto.randomUUID` есть только в защищённом контексте. */
export function newId(): string {
  if (crypto.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6]! & 0x0f) | 0x40;
  b[8] = (b[8]! & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export async function boot(): Promise<void> {
  storage.value = await openStorage();
  events.value = await loadEvents();
  noMicUntil.value = (await readSetting<number>('noMicUntil')) ?? 0;
  dailyGoal.value = (await readSetting<number>('dailyGoal')) ?? 10;
}

export async function record(event: ProgressEvent): Promise<void> {
  events.value = [...events.value, event];
  await appendEvent(event);
}

export function setNoMic(on: boolean): void {
  noMicUntil.value = on ? Date.now() + NO_MIC_MINUTES * 60_000 : 0;
  now.value = new Date();
  void writeSetting('noMicUntil', noMicUntil.value);
}

export function setDailyGoal(minutes: number): void {
  dailyGoal.value = minutes;
  void writeSetting('dailyGoal', minutes);
}
