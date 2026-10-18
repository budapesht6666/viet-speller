import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { achievements, topics } from '../src/index.js';

const ASSETS = fileURLToPath(new URL('../../../apps/web/public/assets/', import.meta.url));

describe('ачивки', () => {
  it('id уникальны', () => {
    const ids = achievements.map((a) => a.id);
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
  });

  it('иконка каждой ачивки существует', () => {
    // Опечатка в имени дала бы вместо значка знак вопроса.
    const missing = achievements.filter((a) => !existsSync(`${ASSETS}${a.icon.set}/${a.icon.name}.svg`)).map((a) => a.id);
    expect(missing).toEqual([]);
  });

  it('ачивка темы ссылается на существующую тему, и у каждой темы есть ачивка', () => {
    const topicRules = achievements.flatMap((a) => (a.rule.kind === 'topic' ? [a.rule.topicId] : []));
    expect(topicRules.filter((id) => !topics.some((t) => t.id === id))).toEqual([]);
    expect(topics.filter((t) => !topicRules.includes(t.id)).map((t) => t.id)).toEqual([]);
  });

  it('эмодзи нет нигде', () => {
    const emoji = /\p{Extended_Pictographic}/u;
    expect(achievements.filter((a) => emoji.test(a.title + a.description)).map((a) => a.id)).toEqual([]);
  });
});
