/**
 * Проигрывание образцов озвучки.
 *
 * Правила перенесены из `sound.ts` Speller, проверено на iPhone:
 *
 * - **Громкость — через GainNode.** На iOS `audio.volume` только читается:
 *   присваивание молча игнорируется, и «тихо» означает «в полную силу».
 * - **AudioContext до жеста создаётся `suspended`**, и на iOS разбудить его
 *   больше нечем. Поэтому `unlock()` вызывается из обработчика касания.
 * - Беззвучный режим iOS глушит и это. Обход через сессию `playback`
 *   конфликтует с микрофоном — не трогаем: молчание при включённой качельке —
 *   правильное поведение телефона, а не поломка.
 *
 * В разговорнике громкость полная: там озвучка для собеседника, а микрофон
 * в этот момент не слушает.
 */

type AudioContextCtor = typeof AudioContext;

function audioContextCtor(): AudioContextCtor | null {
  const w = window as unknown as { AudioContext?: AudioContextCtor; webkitAudioContext?: AudioContextCtor };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

/** Почему образец не прозвучал. У каждого отказа свой вид в интерфейсе. */
export type PlayFailure = 'no-audio-api' | 'network' | 'decode';

export class Player {
  private context: AudioContext | null = null;
  private readonly buffers = new Map<string, Promise<AudioBuffer>>();
  private current: AudioBufferSourceNode | null = null;

  /** Только из обработчика касания. */
  unlock(): void {
    if (!this.context) {
      const Ctor = audioContextCtor();
      if (!Ctor) return;
      this.context = new Ctor();
    }
    void this.context.resume();
  }

  private load(url: string): Promise<AudioBuffer> {
    let buffer = this.buffers.get(url);
    if (!buffer) {
      const context = this.context!;
      buffer = fetch(url)
        .then((r) => {
          if (!r.ok) throw new PlayError('network');
          return r.arrayBuffer();
        }, () => {
          throw new PlayError('network');
        })
        .then((data) => context.decodeAudioData(data).catch(() => {
          throw new PlayError('decode');
        }));
      // Неудачная загрузка не кешируется: сеть вернётся, и повтор должен
      // пойти заново, а не отдать прошлый отказ.
      buffer.catch(() => this.buffers.delete(url));
      this.buffers.set(url, buffer);
    }
    return buffer;
  }

  /** Заранее подгрузить образцы шага, чтобы первое касание не ждало сеть. */
  prefetch(urls: string[]): void {
    if (!this.context) return;
    for (const url of urls) void this.load(url).catch(() => undefined);
  }

  /**
   * Играет образец; промис выполняется, когда он доиграл. Новый образец
   * обрывает прежний: два голоса разом не разобрать.
   */
  async play(url: string, volume = 1): Promise<void> {
    this.unlock();
    const context = this.context;
    if (!context) throw new PlayError('no-audio-api');
    const buffer = await this.load(url);

    this.current?.stop();
    const source = context.createBufferSource();
    const gain = context.createGain();
    gain.gain.value = volume;
    source.buffer = buffer;
    source.connect(gain).connect(context.destination);
    this.current = source;
    await new Promise<void>((resolve) => {
      source.onended = () => {
        if (this.current === source) this.current = null;
        resolve();
      };
      source.start();
    });
  }

  stop(): void {
    this.current?.stop();
    this.current = null;
  }
}

export class PlayError extends Error {
  constructor(readonly reason: PlayFailure) {
    super(reason);
  }
}
