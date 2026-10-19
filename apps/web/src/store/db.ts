/**
 * Журнал на телефоне — IndexedDB (local-first, CLAUDE.md «Устройство»).
 *
 * Два хранилища: `events` — весь журнал, из него вычисляется прогресс;
 * `outbox` — то, что ещё не ушло на сервер. Событие пишется в оба одной
 * транзакцией: записанное, но не поставленное в очередь событие не дошло
 * бы до семейного рейтинга никогда.
 *
 * Отдельно — `speech`: попытки сказать, ещё не ушедшие на сервер. Это не
 * прогресс, а журнал распознавания (packages/core/src/speech.ts), и на
 * телефоне он не нужен после отправки.
 *
 * IndexedDB бывает недоступна (приватный режим, запрет хранилища). Тогда
 * журнал живёт в памяти до закрытия вкладки, и интерфейс об этом говорит.
 */

import type { ProgressEvent, SpeechAttempt } from '@viet/core';
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

interface Schema extends DBSchema {
  events: { key: string; value: ProgressEvent };
  outbox: { key: string; value: ProgressEvent };
  settings: { key: string; value: unknown };
  speech: { key: string; value: SpeechAttempt };
}

export type Storage = 'idb' | 'memory';

let db: IDBPDatabase<Schema> | null = null;
const memory = {
  events: new Map<string, ProgressEvent>(),
  outbox: new Map<string, ProgressEvent>(),
  settings: new Map<string, unknown>(),
  speech: new Map<string, SpeechAttempt>(),
};

/** Открывает базу. Возвращает, где на самом деле живёт журнал. */
export async function openStorage(): Promise<Storage> {
  try {
    db = await openDB<Schema>('viet-speller', 2, {
      // Создаётся только недостающее: у семьи уже лежит база версии 1 с
      // журналом, и обновление не должно её трогать.
      upgrade(d) {
        if (!d.objectStoreNames.contains('events')) d.createObjectStore('events', { keyPath: 'id' });
        if (!d.objectStoreNames.contains('outbox')) d.createObjectStore('outbox', { keyPath: 'id' });
        if (!d.objectStoreNames.contains('settings')) d.createObjectStore('settings');
        if (!d.objectStoreNames.contains('speech')) d.createObjectStore('speech', { keyPath: 'id' });
      },
    });
    return 'idb';
  } catch {
    db = null;
    return 'memory';
  }
}

export async function loadEvents(): Promise<ProgressEvent[]> {
  return db ? db.getAll('events') : [...memory.events.values()];
}

export async function appendEvent(event: ProgressEvent): Promise<void> {
  if (!db) {
    memory.events.set(event.id, event);
    memory.outbox.set(event.id, event);
    return;
  }
  const tx = db.transaction(['events', 'outbox'], 'readwrite');
  await Promise.all([tx.objectStore('events').put(event), tx.objectStore('outbox').put(event), tx.done]);
}

/** События с сервера (с другого телефона того же человека) — в журнал, без очереди. */
export async function mergeEvents(events: ProgressEvent[]): Promise<void> {
  if (!db) {
    for (const e of events) memory.events.set(e.id, e);
    return;
  }
  const tx = db.transaction('events', 'readwrite');
  await Promise.all([...events.map((e) => tx.store.put(e)), tx.done]);
}

export async function pendingOutbox(): Promise<ProgressEvent[]> {
  return db ? db.getAll('outbox') : [...memory.outbox.values()];
}

export async function markSent(ids: string[]): Promise<void> {
  if (!db) {
    for (const id of ids) memory.outbox.delete(id);
    return;
  }
  const tx = db.transaction('outbox', 'readwrite');
  await Promise.all([...ids.map((id) => tx.store.delete(id)), tx.done]);
}

export async function readSetting<T>(key: string): Promise<T | undefined> {
  return (db ? await db.get('settings', key) : memory.settings.get(key)) as T | undefined;
}

export async function writeSetting(key: string, value: unknown): Promise<void> {
  if (db) await db.put('settings', value, key);
  else memory.settings.set(key, value);
}

export async function appendSpeech(attempt: SpeechAttempt): Promise<void> {
  if (db) await db.put('speech', attempt);
  else memory.speech.set(attempt.id, attempt);
}

export async function pendingSpeech(): Promise<SpeechAttempt[]> {
  return db ? db.getAll('speech') : [...memory.speech.values()];
}

export async function markSpeechSent(ids: string[]): Promise<void> {
  if (!db) {
    for (const id of ids) memory.speech.delete(id);
    return;
  }
  const tx = db.transaction('speech', 'readwrite');
  await Promise.all([...ids.map((id) => tx.store.delete(id)), tx.done]);
}
