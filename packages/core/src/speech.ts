/**
 * Журнал распознавания: что телефон услышал в уроках.
 *
 * Этап 0 оставил два вопроса без ответа (PLAN.md): пишет ли движок тон так,
 * как услышал, или подправляет его под слово, и слышит ли он одиночный слог.
 * Отдельных замеров больше нет — ответ собирается из обычных уроков: каждая
 * попытка сказать («Сказать» → услышано или нет) записывается сырой, а
 * разбирает её этот модуль. Сырые данные, а не готовый вывод: поменяется
 * правило — отчёт пересчитается по тем же попыткам.
 *
 * Модуль чистый. Отчёт считает сервер по попыткам всей семьи.
 */

import type { Item } from './content.js';
import { accepted } from './lesson.js';
import { findHits, normalize, type HitHow, type ToneMatch } from './matcher.js';

/**
 * Чей движок распознавания. Его выбирает браузер, а не мы: на iPhone в
 * любом браузере — Apple, в Chrome на Android и компьютере — Google.
 * Отвечают они по-разному, поэтому и считаются врозь.
 */
export type SpeechEngine = 'apple' | 'google' | 'other';
export const SPEECH_ENGINES: readonly SpeechEngine[] = ['apple', 'google', 'other'];

/** Одна попытка сказать: от касания «Сказать» до «засчитано» или «не расслышал». */
export interface SpeechAttempt {
  /** UUID: сервер принимает попытку идемпотентно, как событие журнала. */
  id: string;
  /** ISO-время на телефоне. */
  at: string;
  itemId: string;
  /** Что движок вернул к концу попытки. Пусто — не вернул ничего. */
  heard: string;
  engine: SpeechEngine;
}

/** По браузеру — чей движок. Только userAgent: он есть и на сервере, и в тесте. */
export function speechEngine(userAgent: string, touchPoints = 0): SpeechEngine {
  // iPadOS называет себя Macintosh, отличается только касаниями.
  if (/iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && touchPoints > 1)) return 'apple';
  if (/Android/.test(userAgent)) return 'google';
  if (/Chrome|Chromium|Edg\//.test(userAgent)) return 'google';
  if (/Safari/.test(userAgent)) return 'apple';
  return 'other';
}

export interface AttemptClass {
  /** Слогов в образце. */
  syllables: number;
  /** Как совпали буквы: лучшее из `vi` и `alt`. `none` — не совпали вовсе. */
  letters: HitHow | 'none';
  /** Тон — только когда буквы совпали точно; иначе сравнивать не по чему. */
  tone: ToneMatch | null;
}

/** Разбор попытки тем же матчером, что засчитывает её в уроке. */
export function classifyAttempt(item: Item, heard: string): AttemptClass {
  const syllables = normalize(item.vi).length;
  const [hit] = findHits(normalize(heard), [{ id: item.id, words: accepted(item) }]);
  if (!hit) return { syllables, letters: 'none', tone: null };
  return { syllables, letters: hit.how, tone: hit.how === 'exact' ? hit.tone : null };
}

// ── Отчёт ──────────────────────────────────────────────────────────────

/**
 * Пороги вердикта. Попыток нужно столько, чтобы доля не прыгала от одного
 * удачного вечера.
 *
 * Тон. Взрослый новичок путает тон постоянно. Если движок пишет, что
 * услышал, тон расходится с образцом заметно часто; если подправляет под
 * слово — почти никогда. Между порогами — честное «пока неясно».
 *
 * Слог. Сравнивается не с идеалом, а с фразами того же человека: в доле
 * неуслышанных сидят и тихий голос, и шум, и они одинаковы для обоих.
 */
export const SPEECH_THRESHOLDS = {
  /** Попыток с точно совпавшими буквами, чтобы судить о тоне. */
  toneMin: 100,
  /** Тон отличается не реже — движок пишет тон, как услышал. */
  toneWrites: 0.05,
  /** Тон отличается реже — движок подправляет тон под слово. */
  toneCorrects: 0.02,
  /** Попыток и с одним слогом, и с несколькими. */
  syllableMin: 40,
  /** Одиночный слог услышан не реже этого… */
  syllableGood: 0.6,
  /** …и отстаёт от фраз не больше чем на это. */
  syllableGap: 0.15,
  /** Хуже этого или отстаёт больше чем на `syllableBadGap` — слышит плохо. */
  syllableBad: 0.4,
  syllableBadGap: 0.3,
} as const;

export type ToneVerdict = 'collecting' | 'writes' | 'corrects' | 'unclear';
export type SyllableVerdict = 'collecting' | 'recognized' | 'poor' | 'unclear';

export interface ToneExample {
  expected: string;
  heard: string;
}

export interface EngineReport {
  engine: SpeechEngine;
  attempts: number;
  tone: {
    /** Буквы совпали точно, и у обоих есть знаки — тон сравним. */
    compared: number;
    /** Из них тон отличается хотя бы в одном слоге. */
    different: number;
    /** Буквы совпали, но движок вернул текст без знаков — тон не сравнить. */
    unmarked: number;
    verdict: ToneVerdict;
    /** Последние случаи «буквы те же, тон другой» — чтобы проверить глазами. */
    examples: ToneExample[];
  };
  syllables: {
    single: { attempts: number; heard: number };
    multi: { attempts: number; heard: number };
    verdict: SyllableVerdict;
  };
}

const EXAMPLES = 8;

export function toneVerdict(compared: number, different: number, th = SPEECH_THRESHOLDS): ToneVerdict {
  if (compared < th.toneMin) return 'collecting';
  const share = different / compared;
  if (share >= th.toneWrites) return 'writes';
  if (share < th.toneCorrects) return 'corrects';
  return 'unclear';
}

export function syllableVerdict(single: { attempts: number; heard: number }, multi: { attempts: number; heard: number }, th = SPEECH_THRESHOLDS): SyllableVerdict {
  if (single.attempts < th.syllableMin || multi.attempts < th.syllableMin) return 'collecting';
  const one = single.heard / single.attempts;
  const many = multi.heard / multi.attempts;
  if (one >= th.syllableGood && one >= many - th.syllableGap) return 'recognized';
  if (one < th.syllableBad || one < many - th.syllableBadGap) return 'poor';
  return 'unclear';
}

/**
 * Отчёт по движкам — только по тем, у которых есть попытки. Попытка с
 * элементом, которого больше нет в контенте, не считается: сравнить её не
 * с чем.
 */
export function speechReport(attempts: SpeechAttempt[], lookup: (id: string) => Item | undefined): EngineReport[] {
  const sorted = [...attempts].sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id));
  const reports: EngineReport[] = [];
  for (const engine of SPEECH_ENGINES) {
    const r: EngineReport = {
      engine,
      attempts: 0,
      tone: { compared: 0, different: 0, unmarked: 0, verdict: 'collecting', examples: [] },
      syllables: { single: { attempts: 0, heard: 0 }, multi: { attempts: 0, heard: 0 }, verdict: 'collecting' },
    };
    for (const a of sorted) {
      if (a.engine !== engine) continue;
      const item = lookup(a.itemId);
      if (!item) continue;
      r.attempts++;
      const c = classifyAttempt(item, a.heard);
      const group = c.syllables === 1 ? r.syllables.single : r.syllables.multi;
      group.attempts++;
      if (c.letters !== 'none') group.heard++;
      if (c.tone === 'unknown') r.tone.unmarked++;
      if (c.tone === 'same' || c.tone === 'different') r.tone.compared++;
      if (c.tone === 'different') {
        r.tone.different++;
        r.tone.examples.push({ expected: item.vi, heard: a.heard });
      }
    }
    if (!r.attempts) continue;
    r.tone.examples = r.tone.examples.slice(-EXAMPLES).reverse();
    r.tone.verdict = toneVerdict(r.tone.compared, r.tone.different);
    r.syllables.verdict = syllableVerdict(r.syllables.single, r.syllables.multi);
    reports.push(r);
  }
  return reports.sort((a, b) => b.attempts - a.attempts);
}
