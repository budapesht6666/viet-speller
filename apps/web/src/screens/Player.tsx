/**
 * Проигрыватель урока и тренировки.
 *
 * Состояние шага — из движка (packages/core/src/lesson.ts), здесь только
 * вид. У каждого побочного эффекта есть вид (CLAUDE.md): микрофон
 * включается, слушает, запрещён, нет сети; звук не воспроизвёлся.
 */

import {
  currentStep,
  dropMic,
  judgeSpeech,
  needsMic,
  reduce,
  startLesson,
  type LessonContext,
  type LessonEvent,
  type LessonState,
  type Step,
} from '@viet/core';
import { item } from '@viet/content';
import { useEffect, useRef, useState } from 'preact/hooks';
import { player, prefetch } from '../audio/samples.js';
import { Icon, MicButton, Options, PlayButtons, Tiles, type OptionView } from '../components/ui.js';
import { Listener, type ListenStatus } from '../speech/listen.js';
import { t, type StringKey } from '../strings.js';
import { pop } from '../ui/motion.js';

const PROMPT: Record<Step['kind'], StringKey> = {
  intro: 'lesson.listen',
  repeat: 'lesson.repeat',
  say: 'lesson.say',
  hear: 'lesson.hear',
  meaning: 'lesson.meaning',
  build: 'lesson.build',
  tone: 'lesson.tone',
};

export interface PlayerProps {
  lessonId: string;
  steps: Step[];
  /** Для dropMic: если микрофон пропадёт посреди урока. */
  context: LessonContext;
  mic: boolean;
  onExit: () => void;
  onFinish: (state: LessonState, seconds: number) => void;
}

export function Player({ lessonId, steps, context, mic, onExit, onFinish }: PlayerProps) {
  const [state, setState] = useState(() => startLesson(lessonId, steps));
  const [listen, setListen] = useState<ListenStatus>('idle');
  const [heard, setHeard] = useState('');
  const [chosen, setChosen] = useState<string | null>(null);
  const [micLost, setMicLost] = useState<ListenStatus | null>(null);
  const startedAt = useRef(Date.now());
  const listener = useRef(new Listener());
  const verdictRef = useRef<HTMLDivElement>(null);

  const dispatch = (e: LessonEvent) => setState((s) => reduce(s, e));
  const step = currentStep(state);

  useEffect(() => () => listener.current.cancel(), []);

  useEffect(() => {
    setHeard('');
    setListen('idle');
    setChosen(null);
    listener.current.cancel();
    const upcoming = state.steps.slice(state.index, state.index + 3).map((s) => item(s.itemId).vi);
    prefetch(upcoming);
  }, [state.index]);

  useEffect(() => {
    if (state.phase === 'done') onFinish(state, Math.round((Date.now() - startedAt.current) / 1000));
    if (state.phase === 'feedback' && state.outcome !== 'miss' && verdictRef.current) pop(verdictRef.current);
  }, [state.phase]);

  if (!step || state.phase === 'done') return null;
  const target = item(step.itemId);
  const feedback = state.phase === 'feedback';

  const speak = () => {
    player.stop();
    setHeard('');
    listener.current.start({
      onText: (text) => {
        setHeard(text);
        const judged = judgeSpeech(target, text);
        if (judged) dispatch({ type: 'heard', outcome: judged.outcome });
        return Boolean(judged);
      },
      onStatus: (s) => {
        setListen(s);
        if (s === 'blocked' || s === 'offline' || s === 'error') setMicLost(s);
      },
      onMiss: () => dispatch({ type: 'not-heard' }),
    });
  };

  const continueWithoutMic = () => {
    listener.current.cancel();
    setMicLost(null);
    setState((s) => dropMic(s, context));
  };

  const pick = (id: string) => {
    setChosen(id);
    dispatch({ type: 'choose', itemId: id });
  };

  const optionViews = (step.options ?? []).map((o): OptionView => {
    const mark = feedback ? (o.itemId === step.itemId ? 'right' : o.itemId === chosen ? 'wrong' : undefined) : undefined;
    return mark ? { id: o.itemId, label: o.label, mark } : { id: o.itemId, label: o.label };
  });

  // Что показывать вверху: в «скажи сам» и «собери» вьетнамский — ответ, его не видно до итога.
  const showVi = step.kind === 'intro' || step.kind === 'repeat' || step.kind === 'meaning' || feedback;
  const showRu = step.kind === 'intro' || step.kind === 'repeat' || step.kind === 'say' || step.kind === 'build' || feedback;
  const autoPlay = step.kind !== 'say' && step.kind !== 'build';

  return (
    <main class="screen lesson" data-step={step.kind} data-item={step.itemId} data-phase={state.phase}>
      <header class="lesson__top">
        <button class="lesson__close" type="button" aria-label={t('lesson.close')} onClick={onExit}>
          <span aria-hidden="true">×</span>
        </button>
        <div class="progress" role="progressbar" aria-valuemin={0} aria-valuemax={state.steps.length} aria-valuenow={state.index}>
          <div class="progress__bar" style={{ width: `${(state.index / state.steps.length) * 100}%` }} />
        </div>
      </header>

      {!mic && <p class="caption lesson__note">{t('lesson.noMicNote')}</p>}

      <section class="lesson__body">
        <p class="eyebrow">{t(PROMPT[step.kind])}</p>
        {showVi && (
          <p class="phrase" lang="vi">
            {target.vi}
          </p>
        )}
        {showRu && <p class={showVi ? 'phrase__ru' : 'phrase phrase--ru'}>{target.ru}</p>}
        {(step.kind === 'intro' || feedback) && target.note && <p class="lesson__hint">{target.note}</p>}
        {(step.kind === 'intro' || feedback) && target.dialect && <Dialect dialect={target.dialect} />}

        {step.kind !== 'say' && step.kind !== 'build' && <PlayButtons text={target.vi} autoPlay={autoPlay && !feedback} />}
        {feedback && (step.kind === 'say' || step.kind === 'build') && <PlayButtons text={target.vi} />}

        {step.options && (
          <Options options={optionViews} onPick={pick} disabled={feedback} lang={step.kind === 'meaning' ? 'ru' : 'vi'} />
        )}
        {step.kind === 'build' && !feedback && <Tiles tiles={step.tiles!} onCheck={(tiles) => dispatch({ type: 'build', tiles })} disabled={feedback} />}

        {needsMic(step) && !feedback && (
          <div class="lesson__mic">
            {heard && (
              <p class="lesson__heard" lang="vi">
                {heard}
              </p>
            )}
            {state.attempts > 0 && listen === 'idle' && <p class="caption">{t('lesson.notHeard')}</p>}
            {micLost ? (
              <div class="card lesson__micLost">
                <p>{t(micLost === 'blocked' ? 'lesson.blocked' : micLost === 'offline' ? 'lesson.offline' : 'lesson.micError')}</p>
                <button class="btn btn--cta" type="button" onClick={continueWithoutMic}>
                  {t('lesson.withoutMic')}
                </button>
              </div>
            ) : (
              <MicButton status={listen} onTap={speak} />
            )}
            <button class="btn btn--quiet" type="button" onClick={() => dispatch({ type: 'skip' })}>
              {t('lesson.skip')}
            </button>
          </div>
        )}
      </section>

      <footer class="lesson__foot">
        {feedback && (
          <div ref={verdictRef} class="verdict" data-result={state.outcome}>
            {t(state.outcome === 'success' ? 'verdict.success' : state.outcome === 'almost' ? 'verdict.almost' : 'verdict.miss')}
            {state.outcome === 'almost' && heard && (
              <span class="verdict__extra">
                {t('verdict.heard')} <span lang="vi">{heard}</span>
              </span>
            )}
          </div>
        )}
        {(feedback || step.kind === 'intro') && (
          <button class="btn btn--cta" type="button" onClick={() => dispatch({ type: 'next' })}>
            {t('lesson.next')}
            <Icon name="tailless-line-arrow-right-circle" size={22} />
          </button>
        )}
      </footer>
    </main>
  );
}

function Dialect({ dialect }: { dialect: NonNullable<ReturnType<typeof item>['dialect']> }) {
  const parts = (['north', 'south', 'center'] as const).filter((k) => dialect[k]).map((k) => `${t(`dialect.${k}`)} — ${dialect[k]}`);
  return <p class="lesson__dialect">{parts.join(' · ')}</p>;
}
