/**
 * Журнал распознавания на телефоне: каждая попытка сказать в уроке
 * записывается и уходит на сервер вместе с синхронизацией. Из попыток всей
 * семьи сервер считает, пишет ли движок тон и слышит ли слог
 * (packages/core/src/speech.ts) — без отдельных замеров.
 *
 * Запись не мешает уроку: не записалось — урок идёт дальше, а попытка
 * просто не попадёт в отчёт.
 */

import { speechEngine, type SpeechAttempt } from '@viet/core';
import { newId } from './app.js';
import { appendSpeech, markSpeechSent, pendingSpeech } from './db.js';

/** Движок этого телефона: его выбирает браузер, за сессию он не меняется. */
const engine = speechEngine(navigator.userAgent, navigator.maxTouchPoints ?? 0);

/** Сервер не примет длиннее — DTO режет на 300. */
const MAX_HEARD = 300;

export function logAttempt(itemId: string, heard: string): void {
  const attempt: SpeechAttempt = { id: newId(), at: new Date().toISOString(), itemId, heard: heard.slice(0, MAX_HEARD), engine };
  void appendSpeech(attempt).catch(() => undefined);
}

const BATCH = 500;

/**
 * Отправить накопленное. Вызывает синхронизация, когда человек вошёл.
 * Ошибка — попытки остаются на телефоне и уйдут со следующей синхронизацией.
 */
export async function sendSpeech(post: (attempts: SpeechAttempt[]) => Promise<unknown>): Promise<void> {
  let rest = await pendingSpeech();
  while (rest.length) {
    const batch = rest.slice(0, BATCH);
    rest = rest.slice(BATCH);
    await post(batch);
    await markSpeechSent(batch.map((a) => a.id));
  }
}
