/**
 * Слушать один ответ: касание → одна сессия → засчитано или нет.
 *
 * Решение принимается по interim, как в Speller: засчитали — сессия
 * закрывается сразу, не дожидаясь финала. Не засчитали — ждём финал и
 * немного тишины после него, потом «не расслышал». Потолок ожидания
 * обязателен: человек может молчать, а сессия — не закрыться.
 *
 * Компоненты интерфейса не знают про SpeechRecognition (CLAUDE.md,
 * «Устройство»): они получают состояние отсюда.
 */

import { Recognizer, type RecognizerState } from './recognizer.js';

export type ListenStatus = 'idle' | 'starting' | 'listening' | 'blocked' | 'offline' | 'error';

export interface ListenHandlers {
  /** Всё услышанное за сессию; вернуть true — засчитано, сессия закрывается. */
  onText(text: string, final: boolean): boolean;
  onStatus(status: ListenStatus): void;
  /** Сессия кончилась, а засчитать нечего. */
  onMiss(): void;
}

/** После финала ждём, не скажет ли человек ещё. */
const AFTER_FINAL_MS = 1200;
/** Потолок одной попытки. */
const MAX_MS = 9000;

export class Listener {
  private recognizer: Recognizer | null = null;
  private parts = new Map<number, string>();
  private settled = false;
  private timers: ReturnType<typeof setTimeout>[] = [];

  /** Только из обработчика касания: иначе iPhone даст глухую сессию. */
  start(h: ListenHandlers): void {
    this.cancel();
    this.settled = false;
    this.parts.clear();
    const finish = (hit: boolean) => {
      if (this.settled) return;
      this.settled = true;
      this.clearTimers();
      this.recognizer?.stop();
      if (!hit) h.onMiss();
    };
    this.recognizer = new Recognizer(
      {
        onTranscript: (segment, text, final) => {
          if (this.settled) return;
          this.parts.set(segment, text);
          const all = [...this.parts.entries()].sort(([a], [b]) => a - b).map(([, t]) => t).join(' ');
          if (h.onText(all, final)) return finish(true);
          if (final) {
            this.clearTimers();
            this.timers.push(setTimeout(() => finish(false), AFTER_FINAL_MS));
          }
        },
        onStateChange: (state: RecognizerState, detail) => {
          if (state === 'listening') {
            h.onStatus('listening');
            this.timers.push(setTimeout(() => finish(false), MAX_MS));
          } else if (state === 'starting') h.onStatus('starting');
          else if (state === 'blocked') {
            this.settled = true;
            h.onStatus('blocked');
          } else if (state === 'error') {
            this.settled = true;
            this.clearTimers();
            h.onStatus(detail === 'network' ? 'offline' : 'error');
          } else if (state === 'idle') h.onStatus('idle');
        },
        onSessionEnd: () => finish(false),
      },
      { restart: false },
    );
    this.recognizer.start();
  }

  cancel(): void {
    this.settled = true;
    this.clearTimers();
    this.recognizer?.stop();
    this.recognizer = null;
  }

  private clearTimers(): void {
    for (const t of this.timers) clearTimeout(t);
    this.timers = [];
  }
}
