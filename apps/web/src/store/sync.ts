/**
 * Аккаунт и синхронизация журнала с сервером.
 *
 * Приложение local-first: без входа работает всё, кроме семьи. Вход нужен
 * ради семейного рейтинга и восстановления прогресса на новом телефоне.
 *
 * Синхронизация — пачкой из outbox на POST /api/sync. Сервер принимает
 * событие идемпотентно по UUID, поэтому повторная отправка после обрыва
 * безопасна: отправили, не дождались ответа — отправим ещё раз.
 */

import { signal } from '@preact/signals';
import type { ProgressEvent } from '@viet/core';
import { markSent, mergeEvents, pendingOutbox, readSetting, writeSetting } from './db.js';
import { events } from './app.js';
import { sendSpeech } from './speech.js';

export interface Me {
  id: string;
  login: string;
  name: string;
  family: { id: string; name: string; inviteCode: string };
}

/** unknown — ещё не спросили сервер; guest — не вошёл; offline — сервер недоступен. */
export type Account = { state: 'unknown' } | { state: 'guest' } | { state: 'offline' } | { state: 'user'; me: Me };
export const account = signal<Account>({ state: 'unknown' });

export type SyncState = 'idle' | 'syncing' | 'ok' | 'offline' | 'error';
export const syncState = signal<{ state: SyncState; at?: Date; pending: number }>({ state: 'idle', pending: 0 });

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Запрос к API. Сообщение ошибки — от сервера, если он его прислал. */
export async function api<T>(path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? null : JSON.stringify(body),
      credentials: 'same-origin',
    });
  } catch {
    throw new ApiError(0, 'Нет связи с сервером');
  }
  const data = (await res.json().catch(() => ({}))) as { message?: string | string[] };
  if (!res.ok) {
    const msg = Array.isArray(data.message) ? data.message[0] : data.message;
    throw new ApiError(res.status, msg ?? `Ошибка ${res.status}`);
  }
  return data as T;
}

export async function loadAccount(): Promise<void> {
  try {
    account.value = { state: 'user', me: await api<Me>('/auth/me') };
  } catch (e) {
    account.value = e instanceof ApiError && e.status === 401 ? { state: 'guest' } : { state: 'offline' };
  }
}

const BATCH = 500;
let running: Promise<void> | null = null;

/** Отправить outbox и забрать события с других телефонов. Вызовы не накладываются. */
export function syncNow(): Promise<void> {
  running ??= doSync().finally(() => (running = null));
  return running;
}

async function doSync(): Promise<void> {
  const outbox = await pendingOutbox();
  syncState.value = { ...syncState.value, pending: outbox.length };
  if (account.value.state !== 'user') return;
  if (!navigator.onLine) {
    syncState.value = { state: 'offline', pending: outbox.length };
    return;
  }
  syncState.value = { state: 'syncing', pending: outbox.length };
  try {
    let since = (await readSetting<number>('syncCursor')) ?? 0;
    let rest = outbox;
    do {
      const batch = rest.slice(0, BATCH);
      rest = rest.slice(BATCH);
      const res = await api<{ events: ProgressEvent[]; cursor: number }>('/sync', { since, events: batch });
      if (res.events.length) {
        await mergeEvents(res.events);
        const known = new Set(events.value.map((e) => e.id));
        events.value = [...events.value, ...res.events.filter((e) => !known.has(e.id))];
      }
      await markSent(batch.map((e) => e.id));
      since = res.cursor;
      await writeSetting('syncCursor', since);
    } while (rest.length);
    syncState.value = { state: 'ok', at: new Date(), pending: 0 };
    // Журнал распознавания — следом и молча: это диагностика, а не прогресс,
    // и её отказ не должен выглядеть как «прогресс не отправился».
    await sendSpeech((attempts) => api('/speech', { attempts })).catch(() => undefined);
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) account.value = { state: 'guest' };
    syncState.value = { state: e instanceof ApiError && e.status === 0 ? 'offline' : 'error', pending: outbox.length };
  }
}

/** Вход или регистрация: после них журнал этого телефона уходит на сервер, чужой — приходит. */
export async function signIn(kind: 'login' | 'register', body: Record<string, string>): Promise<void> {
  await api(`/auth/${kind}`, body);
  await loadAccount();
  // Новый аккаунт на этом телефоне: курсор прошлого аккаунта не годится.
  await writeSetting('syncCursor', 0);
  await syncNow();
}

export async function signOut(): Promise<void> {
  await api('/auth/logout', {});
  account.value = { state: 'guest' };
}

/** Запуск: узнать, кто вошёл, и синхронизироваться — при старте, по сети и раз в две минуты. */
export function startSync(): void {
  void loadAccount().then(syncNow);
  addEventListener('online', () => void loadAccount().then(syncNow));
  setInterval(() => void syncNow(), 120_000);
}
