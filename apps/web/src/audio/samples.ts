import { audioFile, type Speed, type Voice } from '@viet/content';
import { voice } from '../store/app.js';
import { Player, PlayError, type PlayFailure } from './player.js';

/** Один проигрыватель на приложение: новый образец обрывает прежний. */
export const player = new Player();

/** Образец голосом из настроек, если голос не назван явно (пример в настройках). */
export function sampleUrl(text: string, speed: Speed = 'normal', as: Voice = voice.value): string | null {
  const file = audioFile(text, speed, as);
  return file ? `/audio/${file}` : null;
}

export type PlayResult = 'ok' | PlayFailure | 'missing';

/** Играет образец. Результат — для вида кнопки: отказ не должен выглядеть как тишина. */
export async function playSample(text: string, speed: Speed = 'normal', as: Voice = voice.value): Promise<PlayResult> {
  const url = sampleUrl(text, speed, as);
  if (!url) return 'missing';
  try {
    await player.play(url);
    return 'ok';
  } catch (e) {
    return e instanceof PlayError ? e.reason : 'decode';
  }
}

/** Подгрузить образцы шага заранее, чтобы касание не ждало сеть. */
export function prefetch(texts: string[]): void {
  player.prefetch(texts.flatMap((t) => [sampleUrl(t), sampleUrl(t, 'slow')]).filter((u): u is string => Boolean(u)));
}
