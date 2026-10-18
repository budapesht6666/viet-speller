/**
 * Обёртка над Web Speech API. Перенесено из Speller.
 *
 * Поведение продиктовано замерами на живом iPhone, а не документацией
 * (`../lang-game_research/research/PROBE-RESULTS.md`). Замеры сняты на
 * `en-US`; для `vi-VN` их повторяет этап 0 (`research/VI-PROBE-CHECKLIST.md`),
 * и до его итогов правила ниже — гипотеза:
 *
 * - слушаем `interim`, а не `FINAL`: первый даёт реакцию за 0.2–0.4 с, второй
 *   приходит через ~2 с после того, как человек замолчал;
 * - `confidence` не используем нигде — в `interim` он всегда 0.00;
 * - запускать можно только из жеста пользователя, иначе Safari не отдаст
 *   микрофон;
 * - сессия живёт больше минуты даже в тишине, поэтому авторестарт по `onend` —
 *   страховка, а не основной механизм.
 *
 * Язык один и не меняется: обучение только вьетнамскому. Менять его на лету
 * было бы и нельзя — после `track.stop()` следующий захват микрофона на
 * Safari приходит мёртвым, без единой ошибки.
 */

export const LANG = 'vi-VN';

export type RecognizerState = 'idle' | 'starting' | 'listening' | 'blocked' | 'error';

export interface RecognizerEvents {
  /** Промежуточная или финальная расшифровка: индекс пачки и её текст. */
  onTranscript(segmentIndex: number, transcript: string, isFinal: boolean): void;
  /**
   * Состояние микрофона. `detail` — код ошибки движка (`network`,
   * `audio-capture`) и только он: тексты для человека живут в strings.ts.
   */
  onStateChange(state: RecognizerState, detail?: string): void;
  /** Сессия оборвалась и вот-вот перезапустится: хвост надо сбросить. */
  onSessionEnd(): void;
}

/* Минимальные описания: в стандартной библиотеке TypeScript этих типов нет,
   а тянуть пакет ради трёх интерфейсов не стоит. */
interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionResultLike {
  readonly length: number;
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternativeLike;
}
interface SpeechRecognitionResultListLike {
  readonly length: number;
  [index: number]: SpeechRecognitionResultLike;
}
interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
}
interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
  message?: string;
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((e: Event) => void) | null;
  onend: ((e: Event) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getConstructor(): SpeechRecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Что именно мешает распознаванию прямо сейчас. */
export type RecognitionBlocker = 'none' | 'insecure' | 'unsupported';

/**
 * Проверка перед показом упражнений с микрофоном.
 *
 * Защищённый контекст проверяется первым, и это главное. По http
 * распознавания нет ни в одном браузере, причём WebKit в этом случае просто не
 * заводит конструктор — то есть отсутствие конструктора на телефоне означает
 * «открыто по http», а вовсе не «браузер не умеет». Совет сменить браузер в
 * этой ситуации отправляет человека чинить не то.
 */
export function recognitionBlocker(): RecognitionBlocker {
  if (!window.isSecureContext) return 'insecure';
  return getConstructor() ? 'none' : 'unsupported';
}

export class Recognizer {
  private recognition: SpeechRecognitionLike | null = null;
  private wanted = false;
  private restartTimer: ReturnType<typeof setTimeout> | null = null;
  private state: RecognizerState = 'idle';

  constructor(private readonly events: RecognizerEvents) {}

  /** Обязан вызываться из обработчика касания: Safari иначе не даст микрофон. */
  start(): void {
    if (this.wanted) return;
    const Ctor = getConstructor();
    if (!Ctor) {
      this.setState('error');
      return;
    }
    this.wanted = true;
    this.setState('starting');
    this.spawn(Ctor);
  }

  stop(): void {
    this.wanted = false;
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    try {
      this.recognition?.stop();
    } catch {
      /* остановка уже остановленной сессии — не повод падать */
    }
    this.recognition = null;
    this.setState('idle');
  }

  private setState(state: RecognizerState, detail?: string): void {
    if (this.state === state) return;
    this.state = state;
    this.events.onStateChange(state, detail);
  }

  private spawn(Ctor: SpeechRecognitionCtor): void {
    const recognition = new Ctor();
    recognition.lang = LANG;
    recognition.continuous = true;
    recognition.interimResults = true;
    // В `interim` альтернатива всегда одна, но на финале они появляются,
    // и терять их незачем.
    recognition.maxAlternatives = 5;

    recognition.onstart = () => this.setState('listening');

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const best = result?.[0];
        if (!result || !best) continue;
        this.events.onTranscript(i, best.transcript, result.isFinal);
      }
    };

    recognition.onerror = (event) => {
      // Отказ в доступе — единственная ошибка, после которой перезапуск
      // бессмыслен: она требует действий человека.
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        this.wanted = false;
        this.setState('blocked');
        return;
      }
      // `no-speech` и `aborted` — рабочий шум: так движок сообщает о паузе.
      // Реагировать на них сообщением значило бы мигать ошибкой каждые
      // несколько секунд молчания.
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        this.setState('error', event.error);
      }
    };

    recognition.onend = () => {
      this.recognition = null;
      this.events.onSessionEnd();
      if (!this.wanted) {
        this.setState('idle');
        return;
      }
      // Пауза перед перезапуском обязательна: мгновенный start() после end()
      // Safari отвергает как повторный запуск уже идущей сессии.
      this.restartTimer = setTimeout(() => {
        if (!this.wanted) return;
        try {
          this.spawn(Ctor);
        } catch {
          this.setState('error');
        }
      }, 150);
    };

    this.recognition = recognition;
    try {
      recognition.start();
    } catch {
      // Единственный ожидаемый случай — сессия уже идёт. Она и есть то, что нужно.
      this.setState('listening');
    }
  }
}
