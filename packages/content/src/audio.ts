/**
 * Озвучка контента.
 *
 * Файлы генерирует `npm run tts` (scripts/tts.mjs) и кладёт в
 * `apps/web/public/audio`, а манифест «голос|скорость|текст → файл» — сюда,
 * в `audio.json`. В рантайме синтеза нет: тон учат по записанному образцу.
 */

import manifest from './audio.json' with { type: 'json' };

/**
 * Голоса озвучки. Весь контент записан каждым, а какой звучит — человек
 * выбирает в настройках под себя. Первый — голос по умолчанию.
 */
export const VOICES = ['vi-VN-HoaiMyNeural', 'vi-VN-NamMinhNeural'] as const;
export type Voice = (typeof VOICES)[number];
export const DEFAULT_VOICE: Voice = VOICES[0];

/** Чем голос звучит в настройках, когда его выбирают на слух. */
export const VOICE_SAMPLE = 'xin chào';

export function isVoice(value: unknown): value is Voice {
  return VOICES.includes(value as Voice);
}

/** Обычная скорость и медленная — «черепаха», как у Falou. */
export const SPEEDS = { normal: '+0%', slow: '-35%' } as const;
export type Speed = keyof typeof SPEEDS;

const files = manifest as Record<string, string>;

export function audioKey(text: string, speed: Speed, voice: Voice = DEFAULT_VOICE): string {
  return `${voice}|${SPEEDS[speed]}|${text.normalize('NFC')}`;
}

/** Имя файла образца или null, если его нет — тест контента не даёт этому случиться. */
export function audioFile(text: string, speed: Speed = 'normal', voice: Voice = DEFAULT_VOICE): string | null {
  return files[audioKey(text, speed, voice)] ?? null;
}
