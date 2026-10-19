/**
 * Примитивы интерфейса. Компоненты не знают про распознавание и про
 * движок урока: получают состояние и отдают касания.
 */

import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { playSample, type PlayResult } from '../audio/samples.js';
import { t } from '../strings.js';
import type { ListenStatus } from '../speech/listen.js';

/** Иконка Streamline. Размер проставлен всегда: без него SVG рисуется 300×150. */
export function Icon({ name, size = 24, set = 'ui' }: { name: string; size?: number; set?: 'ui' | 'objects' }) {
  return <img class="icon" src={`/assets/${set}/${name}.svg`} width={size} height={size} alt="" aria-hidden="true" />;
}

/** Кружок с первой буквой имени — примета того, что человек вошёл. */
export function Avatar({ name, large }: { name: string; large?: boolean }) {
  return (
    <span class={large ? 'avatar avatar--large' : 'avatar'} aria-hidden="true">
      {[...name.trim()][0]?.toUpperCase() ?? '?'}
    </span>
  );
}

export type StatusState = 'ok' | 'wait' | 'off' | 'live';

export function Status({ state, children }: { state: StatusState; children: ComponentChildren }) {
  return (
    <div class="status" data-state={state}>
      <span class="status__dot" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

/**
 * Обычный и медленный образец. Отказ виден на кнопке: «нажал — тишина»
 * без объяснения выглядит как сломанное приложение.
 */
export function PlayButtons({ text, autoPlay }: { text: string; autoPlay?: boolean }) {
  const [result, setResult] = useState<PlayResult | 'playing' | null>(null);
  const play = async (speed: 'normal' | 'slow') => {
    setResult('playing');
    setResult(await playSample(text, speed));
  };
  // Автоматически — один раз при появлении шага. Звук после первого касания
  // в уроке уже разблокирован (Player.unlock в «Начать урок»).
  useEffect(() => {
    if (autoPlay) void play('normal');
  }, [text]);
  return (
    <div class="play">
      <div class="play__row">
        <button class="btn btn--quiet play__btn" type="button" onClick={() => play('normal')} aria-label={t('lesson.play')}>
          <Icon name="volume-level-high" set="objects" size={28} />
          {t('lesson.play')}
        </button>
        <button class="btn btn--quiet play__btn" type="button" onClick={() => play('slow')}>
          {t('lesson.slow')}
        </button>
      </div>
      {result === 'missing' && <p class="caption">{t('lesson.audioMissing')}</p>}
      {(result === 'network' || result === 'decode') && <p class="caption">{t('lesson.audioFailed')}</p>}
      {result === 'no-audio-api' && <p class="caption">{t('lesson.audioBlocked')}</p>}
    </div>
  );
}

export function MicButton({ status, onTap, disabled }: { status: ListenStatus; onTap: () => void; disabled?: boolean }) {
  const live = status === 'listening' || status === 'starting';
  return (
    <button class="mic" type="button" data-live={live} onClick={onTap} disabled={live || disabled}>
      <span class="mic__ring" aria-hidden="true">
        <Icon name="voice-typing-word-convert" size={40} />
      </span>
      <span class="mic__label">{status === 'listening' ? t('lesson.speaking') : status === 'starting' ? t('lesson.starting') : t('lesson.speak')}</span>
    </button>
  );
}

export interface OptionView {
  id: string;
  label: string;
  /** После ответа: верный вариант и выбранный неверный подсвечиваются. */
  mark?: 'right' | 'wrong';
}

export function Options({ options, onPick, disabled, lang }: { options: OptionView[]; onPick: (id: string) => void; disabled: boolean; lang: 'vi' | 'ru' }) {
  // Две колонки — только для коротких вьетнамских слов; русский перевод и
  // фразы в полстроки не влезают.
  const cols = lang === 'vi' && options.every((o) => o.label.length <= 12) ? 2 : 1;
  return (
    <div class="options" data-cols={cols}>
      {options.map((o) => (
        <button key={o.id} class="option" type="button" lang={lang} data-id={o.id} data-mark={o.mark} disabled={disabled} onClick={() => onPick(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Плитки: касание добавляет слово в ответ, касание по ответу — убирает. */
export function Tiles({ tiles, onCheck, disabled }: { tiles: string[]; onCheck: (answer: string[]) => void; disabled: boolean }) {
  const [picked, setPicked] = useState<number[]>([]);
  return (
    <div class="tiles">
      <div class="tiles__answer" lang="vi">
        {picked.length === 0 && <span class="caption">…</span>}
        {picked.map((i, k) => (
          <button key={k} class="tile tile--placed" type="button" disabled={disabled} onClick={() => setPicked(picked.filter((_, j) => j !== k))}>
            {tiles[i]}
          </button>
        ))}
      </div>
      <div class="tiles__pool" lang="vi">
        {tiles.map((tile, i) => (
          <button key={i} class="tile" type="button" disabled={disabled || picked.includes(i)} onClick={() => setPicked([...picked, i])}>
            {tile}
          </button>
        ))}
      </div>
      <button class="btn btn--cta" type="button" disabled={disabled || !picked.length} onClick={() => onCheck(picked.map((i) => tiles[i]!))}>
        {t('lesson.check')}
      </button>
    </div>
  );
}
