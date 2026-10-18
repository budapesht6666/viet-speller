import { audioFile, type Speed } from '@viet/content';
import { Player, PlayError, type PlayFailure } from './player.js';

/** Один проигрыватель на приложение: новый образец обрывает прежний. */
export const player = new Player();

export function sampleUrl(text: string, speed: Speed = 'normal'): string | null {
  const file = audioFile(text, speed);
  return file ? `/audio/${file}` : null;
}

export type PlayResult = 'ok' | PlayFailure | 'missing';

/** Играет образец. Результат — для вида кнопки: отказ не должен выглядеть как тишина. */
export async function playSample(text: string, speed: Speed = 'normal'): Promise<PlayResult> {
  const url = sampleUrl(text, speed);
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
