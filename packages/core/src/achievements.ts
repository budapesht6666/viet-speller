/**
 * Ачивки — чистая функция над журналом (PLAN.md, этап 8).
 *
 * Определения лежат в packages/content, проверка — здесь. Её вызывают и
 * телефон, и сервер (семейные ачивки сервер считает по журналам всех
 * участников), поэтому никакого состояния «выдано» нигде не хранится:
 * ачивка есть, пока журнал это подтверждает.
 */

import type { Achievement, AchievementRule, Item, Topic } from './content.js';
import { dayKey, minutesThisWeek, streak, type Progress } from './progress.js';

export interface AchievementContext {
  topics: Topic[];
  item: (id: string) => Item;
  now: Date;
  /** Журналы всей семьи, включая свой. Нет — семейные ачивки не проверяются. */
  family?: Progress[];
}

/** Самая длинная серия за всю историю, а не только текущая: ачивку за 7 дней не отнимает пропуск. */
function longestStreak(p: Progress): number {
  const days = [...p.days.keys()].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const day of days) {
    const expected = prev ? new Date(new Date(`${prev}T12:00:00Z`).getTime() + 86_400_000).toISOString().slice(0, 10) : null;
    run = expected === day ? run + 1 : 1;
    best = Math.max(best, run);
    prev = day;
  }
  return best;
}

function check(rule: AchievementRule, p: Progress, ctx: AchievementContext): boolean {
  switch (rule.kind) {
    case 'streak':
      return Math.max(longestStreak(p), streak(p, ctx.now)) >= rule.days;
    case 'topic': {
      const topic = ctx.topics.find((t) => t.id === rule.topicId);
      return Boolean(topic && topic.lessons.every((l) => p.doneLessons.has(l.id)));
    }
    case 'perfect-lesson':
      return p.events.some((e) => e.type === 'lesson-done' && e.accuracy >= 1);
    case 'cards':
      return p.cards.size >= rule.count;
    case 'phrase-spoken':
      return p.events.some(
        (e) => e.type === 'lesson-done' && e.mic && Object.entries(e.grades).some(([id, g]) => g === 3 && safeKind(ctx, id) === 'phrase'),
      );
    case 'reviews': {
      // Тренировка — день с повторениями: десять карточек за одну тренировку
      // считаются одной тренировкой, а не десятью.
      const days = new Set(p.events.filter((e) => e.type === 'review').map((e) => dayKey(e.at)));
      return days.size >= rule.count;
    }
    case 'family-same-day': {
      const family = ctx.family;
      if (!family || family.length < 2) return false;
      const [first, ...rest] = family.map((m) => new Set(m.days.keys()));
      return [...first!].some((day) => rest.every((s) => s.has(day)));
    }
    case 'family-week': {
      const family = ctx.family;
      if (!family || family.length < 2) return false;
      return family.reduce((sum, m) => sum + minutesThisWeek(m, ctx.now), 0) >= rule.minutes;
    }
  }
}

function safeKind(ctx: AchievementContext, id: string): Item['kind'] | null {
  try {
    return ctx.item(id).kind;
  } catch {
    // Элемент из журнала удалили из контента — ачивку он не даёт, но и не роняет.
    return null;
  }
}

/** Ачивки, которые журнал подтверждает. */
export function earned(defs: Achievement[], p: Progress, ctx: AchievementContext): Set<string> {
  return new Set(defs.filter((a) => check(a.rule, p, ctx)).map((a) => a.id));
}

export const isFamilyRule = (rule: AchievementRule): boolean => rule.kind === 'family-same-day' || rule.kind === 'family-week';
