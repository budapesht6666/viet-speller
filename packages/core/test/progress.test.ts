import { describe, expect, it } from 'vitest';
import type { Lesson } from '../src/content.js';
import {
  dayKey,
  dueItems,
  minutesThisWeek,
  nextLesson,
  replay,
  streak,
  unlockedLessons,
  weekStart,
  type ProgressEvent,
} from '../src/progress.js';

let n = 0;
const done = (at: string, lessonId: string, grades: Record<string, 1 | 2 | 3> = {}, seconds = 180): ProgressEvent => ({
  id: `e${++n}`,
  at,
  seconds,
  type: 'lesson-done',
  lessonId,
  grades,
  accuracy: 1,
  mic: true,
});
const reviewed = (at: string, itemId: string, grade: 1 | 2 | 3, seconds = 10): ProgressEvent => ({ id: `e${++n}`, at, seconds, type: 'review', itemId, grade });

const path: Lesson[] = [
  { id: 'l1', title: '1', items: ['a'] },
  { id: 'l2', title: '2', items: ['b'] },
  { id: 'l3', title: '3', items: ['c'] },
];

describe('день — по Вьетнаму', () => {
  it('23:30 по Москве 18-го — это уже 19-е в Дананге', () => {
    expect(dayKey('2026-10-18T20:30:00Z')).toBe('2026-10-19');
    expect(dayKey('2026-10-18T16:00:00Z')).toBe('2026-10-18');
  });

  it('неделя — с понедельника', () => {
    expect(weekStart('2026-10-18')).toBe('2026-10-12'); // воскресенье → понедельник 12-го
    expect(weekStart('2026-10-19')).toBe('2026-10-19');
  });
});

describe('журнал → состояние', () => {
  it('порядок событий в журнале не важен: итог тот же', () => {
    const events = [done('2026-10-10T03:00:00Z', 'l1', { a: 3 }), reviewed('2026-10-12T03:00:00Z', 'a', 1), reviewed('2026-10-11T03:00:00Z', 'a', 3)];
    const a = replay(events);
    const b = replay([...events].reverse());
    expect(a.cards.get('a')).toEqual(b.cards.get('a'));
  });

  it('пройденный урок открывает следующий', () => {
    const p = replay([done('2026-10-10T03:00:00Z', 'l1')]);
    expect([...unlockedLessons(path, p)]).toEqual(['l1', 'l2']);
    expect(nextLesson(path, p)?.id).toBe('l2');
  });

  it('промах ставит карточку на повтор раньше, чем верный ответ', () => {
    const p = replay([done('2026-10-10T03:00:00Z', 'l1', { a: 1, b: 3 })]);
    expect(p.cards.get('a')!.due.getTime()).toBeLessThan(p.cards.get('b')!.due.getTime());
  });

  it('карточки с подошедшим сроком — сначала самые просроченные', () => {
    const p = replay([done('2026-10-10T03:00:00Z', 'l1', { a: 3, b: 1 })]);
    expect(dueItems(p, new Date('2026-10-20T00:00:00Z'))).toEqual(['b', 'a']);
    expect(dueItems(p, new Date('2026-10-10T03:00:01Z'))).toEqual([]);
  });
});

describe('серия дней', () => {
  const days = ['2026-10-15', '2026-10-16', '2026-10-17'].map((d) => done(`${d}T03:00:00Z`, 'l1'));

  it('считает дни подряд', () => {
    expect(streak(replay(days), new Date('2026-10-17T10:00:00Z'))).toBe(3);
  });

  it('сегодня ещё не занимался — серия жива до конца дня', () => {
    expect(streak(replay(days), new Date('2026-10-18T10:00:00Z'))).toBe(3);
  });

  it('пропущенный день обрывает серию', () => {
    expect(streak(replay(days), new Date('2026-10-19T10:00:00Z'))).toBe(0);
  });
});

describe('минуты за неделю', () => {
  it('суммирует только текущую неделю', () => {
    const p = replay([
      done('2026-10-11T03:00:00Z', 'l1', {}, 600), // прошлая неделя
      done('2026-10-12T03:00:00Z', 'l2', {}, 300),
      reviewed('2026-10-14T03:00:00Z', 'a', 3, 120),
    ]);
    expect(minutesThisWeek(p, new Date('2026-10-15T03:00:00Z'))).toBe(7);
  });
});

describe('уровень темы', () => {
  const topic = { id: 't', title: 'T', summary: '', lessons: [path[0]!, path[1]!] };

  it('0 — пока пройдены не все уроки, 1 — когда все', async () => {
    const { topicLevel } = await import('../src/progress.js');
    expect(topicLevel(topic, replay([done('2026-10-01T03:00:00Z', 'l1', { a: 3 })]))).toBe(0);
    expect(topicLevel(topic, replay([done('2026-10-01T03:00:00Z', 'l1', { a: 3 }), done('2026-10-01T04:00:00Z', 'l2', { b: 3 })]))).toBe(1);
  });

  it('2 — каждое слово повторено после урока; дальше — по тому, сколько держится в памяти', async () => {
    const { topicLevel } = await import('../src/progress.js');
    const base = [done('2026-09-01T03:00:00Z', 'l1', { a: 3 }), done('2026-09-01T04:00:00Z', 'l2', { b: 3 })];
    expect(topicLevel(topic, replay([...base, reviewed('2026-09-02T03:00:00Z', 'a', 3), reviewed('2026-09-02T03:00:00Z', 'b', 3)]))).toBe(2);
    // Много удачных повторений с растущими промежутками — память окрепла.
    const later = ['2026-09-05', '2026-09-15', '2026-10-10', '2026-12-20'].flatMap((d) => [reviewed(`${d}T03:00:00Z`, 'a', 3), reviewed(`${d}T03:00:00Z`, 'b', 3)]);
    expect(topicLevel(topic, replay([...base, ...later]))).toBeGreaterThanOrEqual(3);
  });
});
