/**
 * Отчёт журнала распознавания в профиле: сколько попыток собрано и что из
 * них следует. Так видно «до и после» без отдельных замеров: пока данных
 * мало, отчёт так и говорит — «собираю».
 */

import { SPEECH_THRESHOLDS, type EngineReport, type SpeechEngine } from '@viet/core';
import { useEffect, useState } from 'preact/hooks';
import { api, ApiError, syncState } from '../store/sync.js';
import { t, type StringKey } from '../strings.js';
import { Status } from './ui.js';

const ENGINE: Record<SpeechEngine, StringKey> = {
  apple: 'speech.engine.apple',
  google: 'speech.engine.google',
  other: 'speech.engine.other',
};

const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);

/** Строка с подстановками: {a} → значение. Строки живут в strings.ts целиком. */
function fill(key: StringKey, values: Record<string, string | number>): string {
  return t(key).replace(/\{(\w+)\}/g, (_, k: string) => String(values[k] ?? ''));
}

function Tone({ tone }: { tone: EngineReport['tone'] }) {
  const v = { n: tone.compared, d: tone.different, min: SPEECH_THRESHOLDS.toneMin, p: pct(tone.different, tone.compared) };
  return (
    <>
      <p>{fill(`speech.tone.${tone.verdict}`, v)}</p>
      {tone.examples.length > 0 && (
        <ul class="speech__examples">
          {tone.examples.map((e, i) => (
            <li key={i} class="caption">
              <span lang="vi">{e.expected}</span> → <span lang="vi">{e.heard}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Syllables({ s }: { s: EngineReport['syllables'] }) {
  const v = {
    one: s.single.attempts,
    many: s.multi.attempts,
    min: SPEECH_THRESHOLDS.syllableMin,
    p1: pct(s.single.heard, s.single.attempts),
    pm: pct(s.multi.heard, s.multi.attempts),
  };
  return <p>{fill(`speech.syllable.${s.verdict}`, v)}</p>;
}

export function SpeechReport() {
  const [engines, setEngines] = useState<EngineReport[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<{ engines: EngineReport[] }>('/speech/report')
      .then((r) => setEngines(r.engines))
      .catch((e) => setError(e instanceof ApiError ? e.message : t('family.failed')));
  }, [syncState.value.at?.getTime()]);

  return (
    <section class="card speech">
      <p class="eyebrow">{t('speech.title')}</p>
      <p class="caption">{t('speech.lead')}</p>
      {error && <Status state="off">{error}</Status>}
      {!engines && !error && <Status state="wait">{t('family.loading')}</Status>}
      {engines?.length === 0 && <p>{t('speech.empty')}</p>}
      {engines?.map((e) => (
        <div key={e.engine} class="speech__engine">
          <p class="speech__name">
            {t(ENGINE[e.engine])} · {fill('speech.attempts', { n: e.attempts })}
          </p>
          <Tone tone={e.tone} />
          <Syllables s={e.syllables} />
        </div>
      ))}
    </section>
  );
}
