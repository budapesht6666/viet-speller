/** Связка контента с движком: контекст урока и тренировки. */

import { buildLesson, buildReview, type Item, type Lesson, type LessonContext, type ReviewContext } from '@viet/core';
import { item, lessons } from '@viet/content';

/** Элементы, пройденные по пути до этого урока. */
export function knownBefore(lessonId: string): Item[] {
  const idx = lessons.findIndex((l) => l.id === lessonId);
  return lessons.slice(0, idx < 0 ? lessons.length : idx).flatMap((l) => l.items.map(item));
}

export function lessonContext(lessonId: string, mic: boolean): LessonContext {
  return { lookup: item, known: knownBefore(lessonId), mic };
}

const lessonByItem = new Map<string, Lesson>(lessons.flatMap((l) => l.items.map((id) => [id, l] as const)));

export function stepsForLesson(lesson: Lesson, mic: boolean) {
  return buildLesson(lesson, lessonContext(lesson.id, mic));
}

export function reviewContext(itemIds: string[], mic: boolean): ReviewContext {
  // Обманки — из всего пройденного: тренировка идёт по всему пути сразу.
  const known = [...new Set(itemIds.map((id) => lessonByItem.get(id)).filter((l): l is Lesson => Boolean(l)))].flatMap((l) => l.items.map(item));
  return { lookup: item, known, mic, lessonOf: (id) => lessonByItem.get(id) ?? {} };
}

export function stepsForReview(itemIds: string[], mic: boolean) {
  return buildReview(itemIds, reviewContext(itemIds, mic));
}
