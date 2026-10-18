/**
 * Сопоставление услышанного с ожидаемым.
 *
 * Перенесено из Speller (`lang-game_research/src/core/matcher.ts`) и сужено до
 * одного языка. Задача та же: не «распознать речь», а закрытый словарь — на
 * экране одна фраза или несколько вариантов, и надо понять, названа ли одна
 * из них. Поэтому сравнение мягкое: ошибиться в пользу одного из пяти
 * вариантов гораздо труднее, чем угадать слово из всего языка.
 *
 * Отличие от Speller — тон. Сравнение идёт в два прохода: с тонами и без.
 * Совпало без тонов, но не с ними — это «почти, тон другой». Честно это только
 * если движок возвращает слово с неверным тоном, а не «исправляет» его по
 * смыслу; ответ даёт замер этапа 0 (`research/VI-PROBE-CHECKLIST.md`). Матчер
 * считает признак всегда, а показывать ли его — решает интерфейс.
 *
 * Модуль чистый: ни DOM, ни распознавания. Его импортируют и клиент, и сервер.
 */

import { fold, stripTone, syllable } from './tone.js';

export interface MatchProfile {
  /** Слова не длиннее — только точное совпадение, без опечаток. */
  shortWordLength: number;
  /** Допуск Левенштейна для выражений средней длины. */
  maxDistanceMedium: number;
  /** Допуск Левенштейна для длинных выражений. */
  maxDistanceLong: number;
  /** Граница между «средним» и «длинным». */
  longWordLength: number;
  /**
   * Сколько слогов подряд склеивать в поисках фразы. Фраза длиннее окна не
   * засчитается никогда, а на глаз этого не видно — поэтому тест контента
   * сверяет окно с самой длинной фразой.
   */
  maxWindow: number;
}

/**
 * Значения из Speller. Double Metaphone выключен: это алгоритм английского
 * произношения, на вьетнамском он не значит ничего, и решение принимает
 * Левенштейн после свёртки.
 */
export const VI: MatchProfile = {
  shortWordLength: 3,
  maxDistanceMedium: 1,
  maxDistanceLong: 2,
  longWordLength: 6,
  maxWindow: 8,
};

export interface Target<T> {
  id: T;
  /** Все выражения, которые засчитываются: основное плюс `alt`. */
  words: string[];
}

/**
 * Чем именно засчитано, от строгого к мягкому:
 * - `exact` — те же буквы (тон проверяется отдельно, см. `tone`);
 * - `folded` — совпало только без надстрочных знаков (`mơ` услышано как `mo`);
 * - `fuzzy` — в пределах допуска Левенштейна после свёртки.
 */
export type HitHow = 'exact' | 'folded' | 'fuzzy';

/**
 * Тон: `same` — совпал у всех слогов, `different` — буквы те же, тон другой
 * хотя бы у одного, `unknown` — сравнивать было не по чему (буквы разошлись
 * или движок вернул текст без знаков).
 */
export type ToneMatch = 'same' | 'different' | 'unknown';

export interface Comparison {
  how: HitHow;
  tone: ToneMatch;
}

export interface Hit<T> extends Comparison {
  id: T;
  /** Первое слово расшифровки, вошедшее в попадание. */
  wordStart: number;
  /** Последнее слово расшифровки, вошедшее в попадание. */
  wordEnd: number;
}

/**
 * Разбирает расшифровку на слова: нижний регистр, NFC, без пунктуации.
 *
 * Вьетнамские буквы и знаки тона сохраняются — `[^a-z]` в Speller съедал
 * вьетнамскую расшифровку до пустоты. Цифры тоже остаются: движок может
 * вернуть цену цифрами, и выбросить её значит потерять ответ.
 */
export function normalize(text: string): string[] {
  return text
    .normalize('NFC')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/** Расстояние Левенштейна. Своё, потому что это десять строк. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j - 1]! + 1, prev[j]! + 1, prev[j - 1]! + cost);
    }
    prev = row;
  }
  return prev[b.length]!;
}

function allowedDistance(folded: string, profile: MatchProfile): number {
  if (folded.length <= profile.shortWordLength) return 0;
  if (folded.length < profile.longWordLength) return profile.maxDistanceMedium;
  return profile.maxDistanceLong;
}

const sylls = (s: string) => s.split(' ');

/** Есть ли в строке хоть один знак — тоновый или буквенный. */
function marked(s: string): boolean {
  return fold(s) !== s;
}

/**
 * Сравнивает одно услышанное выражение с одним ожидаемым. Оба — уже
 * нормализованные слова через пробел.
 */
export function compare(spoken: string, expected: string, profile: MatchProfile = VI): Comparison | null {
  if (!spoken || !expected) return null;

  const a = sylls(spoken);
  const b = sylls(expected);
  if (a.length === b.length && a.every((w, i) => stripTone(w) === stripTone(b[i]!))) {
    const same = a.every((w, i) => syllable(w).tone === syllable(b[i]!).tone);
    // Движок без знаков вовсе — тогда «тон другой» был бы враньём: тона в
    // ответе просто нет.
    if (!same && !marked(spoken)) return { how: 'exact', tone: 'unknown' };
    return { how: 'exact', tone: same ? 'same' : 'different' };
  }

  const fa = fold(spoken);
  const fb = fold(expected);
  if (fa === fb) return { how: 'folded', tone: 'unknown' };

  const limit = allowedDistance(fb, profile);
  if (limit > 0 && levenshtein(fa, fb) <= limit) return { how: 'fuzzy', tone: 'unknown' };

  return null;
}

/** Строже — лучше: из нескольких совпадений одной цели берём самое точное. */
const RANK: Record<HitHow, number> = { exact: 3, folded: 2, fuzzy: 1 };
const TONE_RANK: Record<ToneMatch, number> = { same: 2, unknown: 1, different: 0 };
function better(a: Comparison, b: Comparison | null): boolean {
  if (!b) return true;
  if (RANK[a.how] !== RANK[b.how]) return RANK[a.how] > RANK[b.how];
  return TONE_RANK[a.tone] > TONE_RANK[b.tone];
}

/**
 * Ищет попадания в расшифровке.
 *
 * Проверяются окна от одного слова до `maxWindow`: фраза состоит из
 * нескольких слогов, а движок к тому же охотно режет и склеивает их.
 * Многословное окно сравнивается и как есть, и слитно.
 *
 * Для каждой цели берётся лучшее совпадение по всем позициям, а не первое
 * попавшееся. В Speller побеждала первая позиция, и `à cảm ơn anh` засчитывалось
 * мягко с нулевого слова (слитно оно отличается от фразы одной буквой), хотя
 * со следующего совпадало точно, с тоном. При равной точности побеждает более
 * ранняя позиция.
 *
 * Возвращаются все попадания, а не первое: за одно событие человек успевает
 * сказать два варианта, и терять второе нельзя. Но два попадания не делят
 * одни и те же слова — их разбирают по точности.
 */
export function findHits<T>(words: string[], targets: Target<T>[], profile: MatchProfile = VI): Hit<T>[] {
  const candidates: Hit<T>[] = [];

  for (const target of targets) {
    let best: Hit<T> | null = null;
    for (const expected of target.words) {
      const wanted = normalize(expected).join(' ');
      if (!wanted) continue;
      const joined = wanted.replace(/\s+/g, '');
      for (let i = 0; i < words.length; i++) {
        for (let n = 0; n < profile.maxWindow && i + n < words.length; n++) {
          const text = words.slice(i, i + n + 1).join(' ');
          const c = compare(text, wanted, profile) ?? compare(text.replace(/\s+/g, ''), joined, profile);
          if (c && better(c, best)) best = { id: target.id, wordStart: i, wordEnd: i + n, ...c };
        }
      }
    }
    if (best) candidates.push(best);
  }

  candidates.sort((a, b) => (better(a, b) ? -1 : better(b, a) ? 1 : a.wordStart - b.wordStart));
  const used = new Set<number>();
  const hits: Hit<T>[] = [];
  for (const hit of candidates) {
    const span = Array.from({ length: hit.wordEnd - hit.wordStart + 1 }, (_, k) => hit.wordStart + k);
    if (span.some((p) => used.has(p))) continue;
    span.forEach((p) => used.add(p));
    hits.push(hit);
  }
  return hits.sort((a, b) => a.wordStart - b.wordStart);
}

/**
 * Пары выражений, которые матчер не в состоянии различить.
 *
 * Сравнение идёт без тонов, поэтому `ma` и `má` неразличимы, и это так и
 * задумано. Ограничение переносится в упражнение: два неразличимых варианта
 * не ставятся в один вопрос на выбор (кроме тренировки тонов, где в этом
 * и смысл). Проверяет тест контента.
 */
export function collidingWords(
  vocabulary: Array<{ id: string; words: string[] }>,
  profile: MatchProfile = VI,
): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  const link = (a: string, b: string) => {
    if (!map.has(a)) map.set(a, new Set());
    map.get(a)!.add(b);
  };

  const prepared = vocabulary.map((entry) => ({
    id: entry.id,
    words: entry.words.map((w) => normalize(w).join(' ')).filter(Boolean),
  }));

  for (let i = 0; i < prepared.length; i++) {
    for (let j = i + 1; j < prepared.length; j++) {
      const a = prepared[i]!;
      const b = prepared[j]!;
      const clash = a.words.some((wa) => b.words.some((wb) => compare(wa, wb, profile) !== null));
      if (clash) {
        link(a.id, b.id);
        link(b.id, a.id);
      }
    }
  }
  return map;
}

/**
 * Следит за растущим хвостом промежуточных результатов.
 *
 * Хвост `interim` дописывается, а не переписывается заново, поэтому наивная
 * проверка всей расшифровки засчитывала бы одно слово многократно. Но и
 * «брать только новые слова» нельзя: последние слова хвоста ещё правятся
 * движком — в журнале Speller `Bow` превращается в `Bowl` уже после появления.
 *
 * Закрываются поэтому не слова «до границы», а конкретные позиции, по которым
 * было попадание.
 */
export class Utterance {
  private consumed = new Set<number>();
  private segment = -1;

  /**
   * Слова, ещё не закрытые попаданием, вместе с исходными позициями: без них
   * вызывающий не сможет сказать, что именно закрывать.
   */
  pending(segmentIndex: number, transcript: string): { words: string[]; positions: number[] } {
    if (segmentIndex !== this.segment) {
      this.segment = segmentIndex;
      this.consumed.clear();
    }
    const all = normalize(transcript);
    const words: string[] = [];
    const positions: number[] = [];
    for (let i = 0; i < all.length; i++) {
      if (this.consumed.has(i)) continue;
      words.push(all[i]!);
      positions.push(i);
    }
    return { words, positions };
  }

  /** Закрывает исходные позиции, вошедшие в попадание. */
  consume(positions: number[]): void {
    for (const p of positions) this.consumed.add(p);
  }

  /** Сессия распознавания оборвалась — нумерация пачек начнётся заново. */
  reset(): void {
    this.consumed.clear();
    this.segment = -1;
  }
}
