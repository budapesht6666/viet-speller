/**
 * Озвучка контента.
 *
 * Файлы генерирует `npm run tts` (scripts/tts.mjs) и кладёт в
 * `apps/web/public/audio`, а манифест «голос|скорость|текст → файл» — сюда,
 * в `audio.json`. В рантайме синтеза нет: тон все учат по одному образцу.
 */

import manifest from './audio.json' with { type: 'json' };

/**
 * Голос приложения. Выбирается слепым прослушиванием
 * (research/voice-compare.html), а не по названию движка. До голосования —
 * HoaiMy.
 */
export const VOICE = 'vi-VN-HoaiMyNeural';

/** Обычная скорость и медленная — «черепаха», как у Falou. */
export const SPEEDS = { normal: '+0%', slow: '-35%' } as const;
export type Speed = keyof typeof SPEEDS;

const files = manifest as Record<string, string>;

export function audioKey(text: string, speed: Speed, voice = VOICE): string {
  return `${voice}|${SPEEDS[speed]}|${text.normalize('NFC')}`;
}

/** Имя файла образца или null, если его нет — тест контента не даёт этому случиться. */
export function audioFile(text: string, speed: Speed = 'normal'): string | null {
  return files[audioKey(text, speed)] ?? null;
}
