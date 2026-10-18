import { describe, expect, it } from 'vitest';
import { earned, type AchievementContext } from '../src/achievements.js';
import type { Achievement, AchievementRule, Item, Topic } from '../src/content.js';
import { replay, type ProgressEvent } from '../src/progress.js';

let n = 0;
const done = (day: string, lessonId: string, extra: Partial<ProgressEvent & { type: 'lesson-done' }> = {}): ProgressEvent => ({
  id: `e${++n}`,
  at: `${day}T03:00:00Z`,
  seconds: 300,
  type: 'lesson-done',
  lessonId,
  grades: {},
  accuracy: 0.8,
  mic: false,
  ...extra,
});
const review = (day: string, itemId: string): ProgressEvent => ({ id: `e${++n}`, at: `${day}T03:00:00Z`, seconds: 20, type: 'review', itemId, grade: 3 });

const items: Item[] = [
  { id: 'w', vi: 'trà', ru: 'чай', kind: 'word' },
  { id: 'p', vi: 'cho tôi trà', ru: 'мне чай', kind: 'phrase' },
];
const topics: Topic[] = [{ id: 't', title: 'Т', summary: '', lessons: [{ id: 'l1', title: '1', items: ['w'] }, { id: 'l2', title: '2', items: ['p'] }] }];
const ctx = (over: Partial<AchievementContext> = {}): AchievementContext => ({
  topics,
  item: (id) => items.find((i) => i.id === id)!,
  now: new Date('2026-10-18T05:00:00Z'),
  ...over,
});
const def = (rule: AchievementRule): Achievement => ({ id: 'a', title: 'A', description: '', icon: { set: 'ui', name: 'x' }, rule });
const has = (rule: AchievementRule, events: ProgressEvent[], over: Partial<AchievementContext> = {}) => earned([def(rule)], replay(events), ctx(over)).has('a');

describe('ачивки', () => {
  it('серия дней — и не отнимается пропуском после', () => {
    const three = ['2026-10-10', '2026-10-11', '2026-10-12'].map((d) => done(d, 'l1'));
    expect(has({ kind: 'streak', days: 3 }, three)).toBe(true);
    expect(has({ kind: 'streak', days: 4 }, three)).toBe(false);
  });

  it('тема пройдена — только когда пройдены все её уроки', () => {
    expect(has({ kind: 'topic', topicId: 't' }, [done('2026-10-10', 'l1')])).toBe(false);
    expect(has({ kind: 'topic', topicId: 't' }, [done('2026-10-10', 'l1'), done('2026-10-11', 'l2')])).toBe(true);
  });

  it('урок без ошибок', () => {
    expect(has({ kind: 'perfect-lesson' }, [done('2026-10-10', 'l1')])).toBe(false);
    expect(has({ kind: 'perfect-lesson' }, [done('2026-10-10', 'l1', { accuracy: 1 })])).toBe(true);
  });

  it('слова в повторении', () => {
    expect(has({ kind: 'cards', count: 2 }, [done('2026-10-10', 'l1', { grades: { w: 3 } })])).toBe(false);
    expect(has({ kind: 'cards', count: 2 }, [done('2026-10-10', 'l1', { grades: { w: 3, p: 2 } })])).toBe(true);
  });

  it('фраза сказана: урок с микрофоном, фраза без ошибок', () => {
    expect(has({ kind: 'phrase-spoken' }, [done('2026-10-10', 'l2', { grades: { p: 3 }, mic: false })])).toBe(false);
    expect(has({ kind: 'phrase-spoken' }, [done('2026-10-10', 'l2', { grades: { p: 2 }, mic: true })])).toBe(false);
    expect(has({ kind: 'phrase-spoken' }, [done('2026-10-10', 'l2', { grades: { p: 3 }, mic: true })])).toBe(true);
  });

  it('элемент, удалённый из контента, не роняет проверку', () => {
    expect(has({ kind: 'phrase-spoken' }, [done('2026-10-10', 'l2', { grades: { gone: 3 }, mic: true })])).toBe(false);
  });

  it('тренировки считаются по дням, а не по карточкам', () => {
    const oneDay = [review('2026-10-10', 'w'), review('2026-10-10', 'p')];
    expect(has({ kind: 'reviews', count: 2 }, oneDay)).toBe(false);
    expect(has({ kind: 'reviews', count: 2 }, [...oneDay, review('2026-10-11', 'w')])).toBe(true);
  });

  it('семья в один день — нужны все и минимум двое', () => {
    const me = replay([done('2026-10-10', 'l1')]);
    const sister = replay([done('2026-10-10', 'l1')]);
    const late = replay([done('2026-10-11', 'l1')]);
    const rule = def({ kind: 'family-same-day' });
    expect(earned([rule], me, ctx({ family: [me] })).size).toBe(0);
    expect(earned([rule], me, ctx({ family: [me, sister] })).size).toBe(1);
    expect(earned([rule], me, ctx({ family: [me, late] })).size).toBe(0);
  });

  it('семейная неделя — сумма минут всех', () => {
    const a = replay([done('2026-10-13', 'l1', { seconds: 1800 })]);
    const b = replay([done('2026-10-14', 'l1', { seconds: 1800 })]);
    const rule = def({ kind: 'family-week', minutes: 60 });
    expect(earned([rule], a, ctx({ family: [a, b] })).size).toBe(1);
    expect(earned([rule], a, ctx({ family: [a] })).size).toBe(0);
  });
});
