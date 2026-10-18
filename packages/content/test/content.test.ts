/**
 * Проверки контента. Провал блокирует коммит (`.githooks/pre-commit`):
 * неверное слово приложение закрепит молча, и человек об этом не узнает.
 */

import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { normalize, stripTone, VI } from '@viet/core';
import { describe, expect, it } from 'vitest';
import { audioFile, item, items, lessons, SPEEDS, topics, type Speed } from '../src/index.js';

const AUDIO_DIR = fileURLToPath(new URL('../../../apps/web/public/audio/', import.meta.url));
const expressions = (i: (typeof items)[number]) => [i.vi, ...(i.alt ?? [])];

describe('элементы', () => {
  it('id уникальны — на них ссылаются журнал событий и карточки', () => {
    const ids = items.map((i) => i.id);
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
  });

  it('у каждого есть текст и перевод', () => {
    const empty = items.filter((i) => !i.vi.trim() || !i.ru.trim()).map((i) => i.id);
    expect(empty).toEqual([]);
  });

  it('во вьетнамском тексте нет кириллицы, в переводе — есть', () => {
    // Перепутанные поля — самая дешёвая и самая незаметная ошибка.
    const bad = items.filter((i) => expressions(i).some((e) => /[а-яё]/i.test(e)) || !/[а-яё0-9]/i.test(i.ru));
    expect(bad.map((i) => i.id)).toEqual([]);
  });

  it('alt не повторяет основное выражение и друг друга', () => {
    const dup = items.filter((i) => {
      const all = expressions(i).map((e) => normalize(e).join(' '));
      return new Set(all).size !== all.length;
    });
    expect(dup.map((i) => i.id)).toEqual([]);
  });

  it('эмодзи нет нигде', () => {
    const emoji = /\p{Extended_Pictographic}/u;
    const bad = items.filter((i) => [i.vi, i.ru, i.note ?? '', ...(i.alt ?? [])].some((t) => emoji.test(t)));
    expect(bad.map((i) => i.id)).toEqual([]);
  });

  it('окно матчера не короче самой длинной фразы', () => {
    // Фраза длиннее окна не засчитается никогда, а на глаз этого не видно.
    const tooLong = items.flatMap(expressions).filter((e) => normalize(e).length > VI.maxWindow);
    expect(tooLong).toEqual([]);
  });
});

describe('уроки', () => {
  it('ссылаются только на существующие элементы', () => {
    const missing = lessons.flatMap((l) => l.items.filter((id) => !items.some((i) => i.id === id)).map((id) => `${l.id}: ${id}`));
    expect(missing).toEqual([]);
  });

  it('каждый элемент вводится ровно в одном уроке', () => {
    const count = new Map<string, number>();
    for (const l of lessons) for (const id of l.items) count.set(id, (count.get(id) ?? 0) + 1);
    const wrong = items.filter((i) => count.get(i.id) !== 1).map((i) => `${i.id}: ${count.get(i.id) ?? 0}`);
    expect(wrong).toEqual([]);
  });

  it('id уроков и тем уникальны', () => {
    const ids = [...lessons.map((l) => l.id), ...topics.map((t) => t.id)];
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
  });

  it('в уроке от 4 до 12 новых элементов', () => {
    // Меньше — урок пустой, больше — за 3–5 минут не запомнить.
    const bad = lessons.filter((l) => l.items.length < 4 || l.items.length > 12).map((l) => `${l.id}: ${l.items.length}`);
    expect(bad).toEqual([]);
  });

  it('каждое слово фразы введено в этом или более раннем уроке', () => {
    // Слог за слогом: слово введено, если его слоги покрыты словами,
    // уже пройденными по пути. Тон учитывается: mua и mùa — разные слова.
    const known = new Set<string>();
    const problems: string[] = [];
    for (const l of lessons) {
      const here = l.items.map(item);
      for (const w of here.filter((i) => i.kind === 'word')) for (const e of expressions(w)) for (const s of normalize(e)) known.add(s);
      for (const p of here.filter((i) => i.kind === 'phrase')) {
        const unknown = normalize(p.vi).filter((s) => !known.has(s));
        if (unknown.length) problems.push(`${l.id} / ${p.id}: ${unknown.join(', ')}`);
      }
    }
    expect(problems).toEqual([]);
  });
});

describe('озвучка', () => {
  const speeds = Object.keys(SPEEDS) as Speed[];

  it('у каждого элемента есть образец обеих скоростей', () => {
    const missing = items.flatMap((i) => speeds.filter((s) => !audioFile(i.vi, s)).map((s) => `${i.id} (${s})`));
    // Нет образца — `npm run tts`.
    expect(missing).toEqual([]);
  });

  it('файлы образцов лежат на месте', () => {
    const missing = items.flatMap((i) => speeds.map((s) => audioFile(i.vi, s)).filter((f) => f && !existsSync(AUDIO_DIR + f)));
    expect(missing).toEqual([]);
  });
});

describe('выговор', () => {
  it('варианты выговора засчитываются: каждое слово из dialect есть в vi или alt', () => {
    // Пометка «на Юге говорят dạ» без dạ в alt значила бы: показали,
    // а сказать так не дали.
    const bad = items
      .filter((i) => i.dialect)
      .filter((i) => {
        const said = new Set(expressions(i).flatMap((e) => normalize(e)).map(stripTone));
        return Object.values(i.dialect!).some((v) => normalize(v).some((s) => !said.has(stripTone(s))));
      });
    expect(bad.map((i) => i.id)).toEqual([]);
  });
});
