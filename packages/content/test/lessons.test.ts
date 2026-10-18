/**
 * Все настоящие уроки через движок: то, что на глаз не проверить. Разные
 * зёрна случайности — потому что варианты в вопросах перемешиваются.
 */

import { buildLesson, needsMic, normalize, seeded, stripTone, type Item } from '@viet/core';
import { describe, expect, it } from 'vitest';
import { item, lessons } from '../src/index.js';

const SEEDS = Array.from({ length: 20 }, (_, i) => i + 1);

function knownBefore(lessonId: string): Item[] {
  const idx = lessons.findIndex((l) => l.id === lessonId);
  return lessons.slice(0, idx).flatMap((l) => l.items.map(item));
}

const builds = lessons.flatMap((l) =>
  [true, false].flatMap((mic) => SEEDS.map((seed) => ({ lesson: l, mic, seed, steps: buildLesson(l, { lookup: item, known: knownBefore(l.id), mic, random: seeded(seed) }) }))),
);

describe('уроки на движке', () => {
  it('каждый новый элемент урока встречается в шагах', () => {
    const missing = builds.flatMap(({ lesson, steps }) => lesson.items.filter((id) => !steps.some((s) => s.itemId === id)).map((id) => `${lesson.id}: ${id}`));
    expect([...new Set(missing)]).toEqual([]);
  });

  it('в вопросе на выбор всегда есть правильный ответ и хотя бы ещё один', () => {
    const bad = builds.flatMap(({ lesson, steps }) =>
      steps.filter((s) => s.options && (!s.options.some((o) => o.itemId === s.itemId) || s.options.length < 2)).map((s) => `${lesson.id}: ${s.itemId}`),
    );
    expect([...new Set(bad)]).toEqual([]);
  });

  it('вне тренировки тонов в одном вопросе нет вариантов, неразличимых без тонов', () => {
    // ma / má в одном вопросе — только в тренировке тонов (CLAUDE.md, «Контент»).
    const base = (i: Item) => [i.vi, ...(i.alt ?? [])].map((e) => normalize(e).map(stripTone).join(' '));
    const bad: string[] = [];
    for (const { lesson, steps } of builds) {
      if (lesson.toneDrill) continue;
      for (const s of steps.filter((x) => x.options)) {
        const opts = s.options!.map((o) => item(o.itemId));
        const clash = opts.some((a, i) => opts.some((b, j) => i < j && base(a).some((x) => base(b).includes(x))));
        if (clash) bad.push(`${lesson.id}: ${opts.map((i) => i.vi).join(' / ')}`);
      }
    }
    expect([...new Set(bad)]).toEqual([]);
  });

  it('в тренировке тонов варианты отличаются только тоном', () => {
    const bad = builds.flatMap(({ lesson, steps }) =>
      steps.filter((s) => s.kind === 'tone' && new Set(s.options!.map((o) => stripTone(o.label))).size !== 1).map(() => lesson.id),
    );
    expect([...new Set(bad)]).toEqual([]);
  });

  it('в вопросе «что значит» переводы различаются', () => {
    const bad = builds.flatMap(({ lesson, steps }) =>
      steps.filter((s) => s.kind === 'meaning' && new Set(s.options!.map((o) => o.label)).size !== s.options!.length).map((s) => `${lesson.id}: ${s.itemId}`),
    );
    expect([...new Set(bad)]).toEqual([]);
  });

  it('плитки собираются в правильный ответ', () => {
    const bad = builds.flatMap(({ lesson, steps }) =>
      steps
        .filter((s) => s.kind === 'build')
        .filter((s) => s.answer!.join(' ') !== normalize(item(s.itemId).vi).join(' ') || s.answer!.some((t) => !s.tiles!.includes(t)))
        .map((s) => `${lesson.id}: ${s.itemId}`),
    );
    expect([...new Set(bad)]).toEqual([]);
  });

  it('уроки «только на слух» и режим без микрофона не просят говорить', () => {
    const bad = builds.filter(({ lesson, mic, steps }) => (lesson.listenOnly || !mic) && steps.some(needsMic)).map((b) => b.lesson.id);
    expect([...new Set(bad)]).toEqual([]);
  });

  it('урок укладывается в 3–5 минут: от 8 до 30 шагов', () => {
    const bad = builds.filter(({ steps }) => steps.length < 8 || steps.length > 30).map((b) => `${b.lesson.id}: ${b.steps.length}`);
    expect([...new Set(bad)]).toEqual([]);
  });
});
