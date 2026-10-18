/**
 * Проверки контента. Провал блокирует коммит (`.githooks/pre-commit`):
 * неверное слово приложение закрепит молча, и человек об этом не узнает.
 *
 * Здесь — правила, которые не зависят от уроков. Проверки «каждое слово
 * фразы введено раньше», «аудио обеих скоростей» и «нет неразличимых
 * вариантов в одном вопросе» приходят вместе с моделью урока на этапе 3.
 */

import { normalize, VI } from '@viet/core';
import { describe, expect, it } from 'vitest';
import { items } from '../src/index.js';

const expressions = (item: (typeof items)[number]) => [item.vi, ...(item.alt ?? [])];

describe('элементы', () => {
  it('id уникальны — на них ссылаются журнал событий и карточки', () => {
    const ids = items.map((i) => i.id);
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
  });

  it('у каждого есть текст и перевод', () => {
    const empty = items.filter((i) => !i.vi.trim() || !i.ru.trim()).map((i) => i.id);
    expect(empty).toEqual([]);
  });

  it('alt не повторяет основное выражение', () => {
    const dup = items.filter((i) => (i.alt ?? []).some((a) => normalize(a).join(' ') === normalize(i.vi).join(' ')));
    expect(dup.map((i) => i.id)).toEqual([]);
  });

  it('окно матчера не короче самой длинной фразы', () => {
    // Фраза длиннее окна не засчитается никогда, а на глаз этого не видно.
    const tooLong = items.flatMap(expressions).filter((e) => normalize(e).length > VI.maxWindow);
    expect(tooLong).toEqual([]);
  });
});
