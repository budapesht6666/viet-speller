/**
 * Движок урока (PLAN.md, этап 4) — механика Falou.
 *
 * Чистые функции: урок собирается из элементов (`buildLesson`), дальше
 * живёт на событиях (`reduce`). Интерфейс только показывает состояние и
 * присылает события — так урок тестируется без браузера, а сервер при
 * желании пересчитает итог тем же кодом.
 *
 * Шаги:
 * - `repeat` — послушай и повтори (микрофон); без микрофона — `intro`, просто послушать;
 * - `say` — видишь русский, говоришь сам (микрофон);
 * - `hear` — что ты услышал: звук → один из вариантов;
 * - `meaning` — что значит: вьетнамский → русский вариант;
 * - `build` — собери фразу из плиток;
 * - `tone` — какой тон: варианты отличаются только тоном.
 *
 * Слушать начинаем только по касанию (CLAUDE.md, «Факты о распознавании»):
 * на iPhone сессия без касания глухая. Движку это всё равно, но поэтому у
 * шагов с микрофоном нет автозапуска — его нет и в интерфейсе.
 */

import type { Item, Lesson } from './content.js';
import { findHits, normalize, type HitHow } from './matcher.js';
import { stripTone } from './tone.js';

export type StepKind = 'intro' | 'repeat' | 'say' | 'hear' | 'meaning' | 'build' | 'tone';

export interface Option {
  /** id элемента, которому принадлежит вариант. */
  itemId: string;
  label: string;
}

export interface Step {
  kind: StepKind;
  itemId: string;
  /** Варианты для hear, meaning, tone. Правильный — среди них. */
  options?: Option[];
  /** Плитки для build, перемешанные. */
  tiles?: string[];
  /** Правильный порядок плиток для build — слоги элемента. */
  answer?: string[];
  /** Шаг поставлен повторно после ошибки. */
  retry?: boolean;
}

export const MIC_STEPS: ReadonlySet<StepKind> = new Set(['repeat', 'say']);
export const needsMic = (step: Step): boolean => MIC_STEPS.has(step.kind);

/** Итог шага. `seen` — у шага без проверки (intro). */
export type Outcome = 'success' | 'almost' | 'miss' | 'seen';

export interface LessonContext {
  /** Все элементы по id: и урока, и пройденные раньше — из них варианты-обманки. */
  lookup: (id: string) => Item;
  /** Элементы, пройденные до этого урока, в порядке пути. */
  known: Item[];
  /** Говорить можно: микрофон есть, разрешён, и не включён режим «не могу говорить». */
  mic: boolean;
  /** Источник случайности. В тестах — с зерном. */
  random?: () => number;
}

/** Сколько элементов урока доходят до шага «скажи сам» или «собери». */
const PRODUCE_MAX = 5;
/** Сколько вариантов в вопросе на выбор. */
const OPTIONS = 4;
/** Попыток сказать, после которых шаг засчитывается промахом. */
export const SPEECH_ATTEMPTS = 3;

/** Генератор с зерном — mulberry32. Достаточно для перемешивания. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(list: T[], random: () => number): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Всё, что засчитывается за элемент: основное выражение и `alt`. */
export const accepted = (i: Item): string[] => [i.vi, ...(i.alt ?? [])];
const syllables = (i: Item) => normalize(i.vi);

/**
 * Варианты для вопроса на выбор.
 *
 * Обманки сначала из того же урока, потом из пройденного. Варианты,
 * совпадающие без тонов (`ma` и `má`), в один вопрос не ставятся — ни с
 * правильным ответом, ни между собой, — кроме тренировки тонов, где в этом
 * и смысл (CLAUDE.md, «Контент»). Мерило — именно тон, а не свёртка
 * матчера: `đá` и `da` на слух различаются, и в уроке про đ и d их нарочно
 * ставят рядом. Для `meaning` варианты различаются по-русски: два
 * одинаковых перевода — нечестный вопрос.
 */
function pickOptions(target: Item, pool: Item[], kind: 'hear' | 'meaning', toneDrill: boolean, random: () => number): Option[] {
  const label = (i: Item) => (kind === 'meaning' ? i.ru : i.vi);
  const base = (i: Item) => accepted(i).map((e) => normalize(e).map(stripTone).join(' '));
  const sameWithoutTone = (a: Item, b: Item) => base(a).some((x) => base(b).includes(x));
  const chosen: Item[] = [target];
  for (const candidate of pool) {
    if (chosen.length >= OPTIONS) break;
    if (candidate.id === target.id) continue;
    if (chosen.some((c) => label(c) === label(candidate))) continue;
    if (!toneDrill && chosen.some((c) => sameWithoutTone(c, candidate))) continue;
    chosen.push(candidate);
  }
  return shuffle(chosen, random).map((i) => ({ itemId: i.id, label: label(i) }));
}

/** Варианты для `tone`: элементы с тем же слогом без тона. */
function toneOptions(target: Item, pool: Item[], random: () => number): Option[] | null {
  const base = stripTone(target.vi);
  const same = [target, ...pool.filter((i) => i.id !== target.id && stripTone(i.vi) === base)];
  const unique = same.filter((i, k) => same.findIndex((j) => j.vi === i.vi) === k);
  if (unique.length < 2) return null;
  return shuffle(unique.slice(0, 6), random).map((i) => ({ itemId: i.id, label: i.vi }));
}

function buildTiles(target: Item, pool: Item[], random: () => number): string[] {
  const own = syllables(target);
  const others = shuffle(
    [...new Set(pool.flatMap(syllables))].filter((s) => !own.includes(s)),
    random,
  ).slice(0, 2);
  return shuffle([...own, ...others], random);
}

/** Собирает шаги урока. */
export function buildLesson(lesson: Lesson, ctx: LessonContext): Step[] {
  const random = ctx.random ?? Math.random;
  const fresh = lesson.items.map(ctx.lookup);
  // Обманки: сначала свой урок, потом пройденное — от недавнего к давнему.
  const pool = (target: Item) => [...shuffle(fresh, random), ...[...ctx.known].reverse()].filter((i) => i.id !== target.id);
  const speak = ctx.mic && !lesson.listenOnly;
  const steps: Step[] = [];

  const quiz = (item: Item, k: number): Step => {
    if (lesson.toneDrill) {
      const options = toneOptions(item, pool(item), random);
      if (options) return { kind: 'tone', itemId: item.id, options };
    }
    const kind = k % 2 === 0 ? 'hear' : 'meaning';
    return { kind, itemId: item.id, options: pickOptions(item, pool(item), kind, Boolean(lesson.toneDrill), random) };
  };

  // Новое — парами: послушать два, проверить два. Так новое не копится
  // больше чем на два элемента без проверки.
  for (let i = 0; i < fresh.length; i += 2) {
    const pair = fresh.slice(i, i + 2);
    for (const item of pair) steps.push({ kind: speak ? 'repeat' : 'intro', itemId: item.id });
    pair.forEach((item, k) => steps.push(quiz(item, i + k)));
  }

  // В конце — произвести самому: сказать или собрать. Фразы — в первую
  // очередь: ради них и учим слова.
  const produce = [...fresh].sort((a, b) => Number(b.kind === 'phrase') - Number(a.kind === 'phrase')).slice(0, PRODUCE_MAX);
  for (const item of shuffle(produce, random)) {
    if (speak) steps.push({ kind: 'say', itemId: item.id });
    else if (syllables(item).length > 1) steps.push({ kind: 'build', itemId: item.id, tiles: buildTiles(item, pool(item), random), answer: syllables(item) });
    else steps.push({ ...quiz(item, 1), kind: lesson.toneDrill ? 'tone' : 'meaning' });
  }
  return steps;
}

/** Сколько элементов в одной тренировке: 3–5 минут, как урок. */
export const REVIEW_MAX = 15;

export interface ReviewContext extends LessonContext {
  /** Флаги урока, в котором элемент вводился: тоны и звуки — на слух. */
  lessonOf: (itemId: string) => Pick<Lesson, 'listenOnly' | 'toneDrill'>;
}

/**
 * Ежедневная тренировка: по одному вопросу на элемент, которому подошёл
 * срок. Вопросы те же, что в уроке, но без знакомства — элемент уже знаком.
 * Сказать вслух — каждый третий, если можно говорить.
 */
export function buildReview(itemIds: string[], ctx: ReviewContext): Step[] {
  const random = ctx.random ?? Math.random;
  const pool = (target: Item) => shuffle(ctx.known, random).filter((i) => i.id !== target.id);
  return itemIds.slice(0, REVIEW_MAX).map((id, k): Step => {
    const target = ctx.lookup(id);
    const flags = ctx.lessonOf(id);
    if (flags.toneDrill) {
      const options = toneOptions(target, pool(target), random);
      if (options) return { kind: 'tone', itemId: id, options };
    }
    if (ctx.mic && !flags.listenOnly && k % 3 === 2) return { kind: 'say', itemId: id };
    const kind = k % 2 === 0 ? 'hear' : 'meaning';
    return { kind, itemId: id, options: pickOptions(target, pool(target), kind, false, random) };
  });
}

/**
 * Микрофон пропал посреди урока: запретили, кончилась сеть, человек
 * включил «не могу говорить». Оставшиеся шаги с микрофоном меняются на
 * шаги без него — урок продолжается, а не начинается заново. «Повтори» →
 * послушать, «скажи сам» → что значит.
 */
export function dropMic(state: LessonState, ctx: LessonContext): LessonState {
  const random = ctx.random ?? Math.random;
  const lessonItems = [...new Set(state.steps.map((s) => s.itemId))].map(ctx.lookup);
  const pool = (target: Item) => [...shuffle(lessonItems, random), ...[...ctx.known].reverse()].filter((i) => i.id !== target.id);
  const steps = state.steps.map((step, i): Step => {
    if (i < state.index || !needsMic(step)) return step;
    if (step.kind === 'repeat') return { ...step, kind: 'intro' };
    const target = ctx.lookup(step.itemId);
    return { ...step, kind: 'meaning', options: pickOptions(target, pool(target), 'meaning', false, random) };
  });
  return { ...state, steps, attempts: 0 };
}

/** Как засчитать услышанное. null — пока не похоже, слушаем дальше. */
export function judgeSpeech(item: Item, transcript: string): { outcome: 'success' | 'almost'; how: HitHow } | null {
  const [hit] = findHits(normalize(transcript), [{ id: item.id, words: accepted(item) }]);
  if (!hit) return null;
  // Тон не оцениваем: замер не ответил, честно ли движок пишет тон
  // (PLAN.md, этап 0). Буквы те же — засчитано.
  return { outcome: hit.how === 'fuzzy' ? 'almost' : 'success', how: hit.how };
}

// ── Состояние урока ────────────────────────────────────────────────────

export type Phase = 'question' | 'feedback' | 'done';

export interface StepResult {
  itemId: string;
  kind: StepKind;
  outcome: Outcome;
  retry: boolean;
}

export interface LessonState {
  lessonId: string;
  steps: Step[];
  index: number;
  phase: Phase;
  /** Попыток сказать на текущем шаге. */
  attempts: number;
  /** Итог текущего шага в фазе feedback. */
  outcome: Outcome | null;
  results: StepResult[];
}

export type LessonEvent =
  /** Выбран вариант (hear, meaning, tone): itemId варианта. */
  | { type: 'choose'; itemId: string }
  /** Плитки собраны в этом порядке (build). */
  | { type: 'build'; tiles: string[] }
  /** Распознавание засчитало сказанное (judgeSpeech). */
  | { type: 'heard'; outcome: 'success' | 'almost' }
  /** Сессия закончилась, а засчитать нечего. */
  | { type: 'not-heard' }
  /** «Пропустить» — шаг засчитывается промахом. */
  | { type: 'skip' }
  /** Дальше: после intro или после показа итога. */
  | { type: 'next' };

export function startLesson(lessonId: string, steps: Step[]): LessonState {
  return { lessonId, steps, index: 0, phase: steps.length ? 'question' : 'done', attempts: 0, outcome: null, results: [] };
}

export const currentStep = (s: LessonState): Step | null => s.steps[s.index] ?? null;

function settle(state: LessonState, outcome: Outcome): LessonState {
  const step = currentStep(state)!;
  const results = [...state.results, { itemId: step.itemId, kind: step.kind, outcome, retry: Boolean(step.retry) }];
  let steps = state.steps;
  // Ошибка ставит элемент ещё раз в конец урока — один раз, вопросом на
  // слух: человек уходит из урока, хотя бы раз ответив верно.
  if (outcome === 'miss' && !step.retry) {
    const again = state.steps.find((s) => s.itemId === step.itemId && s.options && (s.kind === 'hear' || s.kind === 'tone'));
    const retry: Step = again ? { ...again, retry: true } : { ...step, retry: true };
    steps = [...steps, retry];
  }
  return { ...state, steps, results, phase: 'feedback', outcome };
}

function advance(state: LessonState): LessonState {
  const index = state.index + 1;
  return { ...state, index, phase: index >= state.steps.length ? 'done' : 'question', attempts: 0, outcome: null };
}

export function reduce(state: LessonState, event: LessonEvent): LessonState {
  if (state.phase === 'done') return state;
  const step = currentStep(state)!;

  if (state.phase === 'feedback') return event.type === 'next' ? advance(state) : state;

  switch (event.type) {
    case 'next':
      if (step.kind !== 'intro') return state;
      return advance({ ...state, results: [...state.results, { itemId: step.itemId, kind: 'intro', outcome: 'seen', retry: false }] });
    case 'choose':
      if (!step.options) return state;
      return settle(state, event.itemId === step.itemId ? 'success' : 'miss');
    case 'build':
      if (step.kind !== 'build' || !step.answer) return state;
      return settle(state, event.tiles.join(' ') === step.answer.join(' ') ? 'success' : 'miss');
    case 'heard':
      if (!needsMic(step)) return state;
      return settle(state, event.outcome);
    case 'not-heard': {
      if (!needsMic(step)) return state;
      const attempts = state.attempts + 1;
      return attempts >= SPEECH_ATTEMPTS ? settle({ ...state, attempts }, 'miss') : { ...state, attempts };
    }
    case 'skip':
      return step.kind === 'intro' ? state : settle(state, 'miss');
  }
}

// ── Итог ───────────────────────────────────────────────────────────────

/** Оценка для повторения: 1 — забыл, 2 — с трудом, 3 — помню. */
export type Grade = 1 | 2 | 3;

/**
 * Итог урока по элементам — для карточек повторения. Берётся худший исход:
 * один промах на элементе важнее двух верных ответов, иначе ошибка
 * растворится в среднем.
 */
export function lessonGrades(state: LessonState): Map<string, Grade> {
  const grade = new Map<string, Grade>();
  for (const r of state.results) {
    if (r.outcome === 'seen') {
      if (!grade.has(r.itemId)) grade.set(r.itemId, 3);
      continue;
    }
    const g: Grade = r.outcome === 'success' ? 3 : r.outcome === 'almost' ? 2 : 1;
    grade.set(r.itemId, Math.min(grade.get(r.itemId) ?? 3, g) as Grade);
  }
  return grade;
}

/** Доля верных ответов среди проверок (intro не считается). */
export function accuracy(state: LessonState): number {
  const checked = state.results.filter((r) => r.outcome !== 'seen');
  if (!checked.length) return 1;
  return checked.filter((r) => r.outcome !== 'miss').length / checked.length;
}
