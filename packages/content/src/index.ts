/**
 * Контент заводится волнами, по теме за раз (PLAN.md, этап 7), и каждая
 * волна проходит тесты из `test/`. Порядок тем — порядок пути: по нужности
 * в первую неделю в Дананге.
 */

import type { Item, Lesson, Topic } from '@viet/core';
import { alphabet, alphabetItems } from './basics/alphabet.js';
import { numberItems, numbers } from './basics/numbers.js';
import { family, familyItems } from './basics/family.js';
import { politeness, politenessItems } from './basics/politeness.js';
import { central, centralItems } from './central/dialect.js';
import { toneItems, tones } from './basics/tones.js';
import { cafe, cafeItems } from './city/cafe.js';
import { grab, grabItems } from './city/grab.js';
import { market, marketItems } from './city/market.js';
import { time, timeItems } from './city/time.js';
import { home, homeItems } from './life/home.js';
import { bank, bankItems, doctor, doctorItems } from './life/institutions.js';
import { leisure, leisureItems, smalltalk, smalltalkItems } from './life/leisure.js';
import { barber, barberItems, delivery, deliveryItems, laundry, laundryItems } from './life/services.js';

export { achievements } from './achievements.js';
export { scenario, scenarios } from './scenarios.js';
export type { Scenario } from './scenarios.js';
export { audioFile, audioKey, SPEEDS, VOICE } from './audio.js';
export type { Speed } from './audio.js';

export const topics: Topic[] = [alphabet, tones, numbers, politeness, family, cafe, market, grab, time, home, doctor, bank, delivery, laundry, barber, leisure, smalltalk, central];

export const items: Item[] = [
  ...alphabetItems,
  ...toneItems,
  ...numberItems,
  ...politenessItems,
  ...familyItems,
  ...cafeItems,
  ...marketItems,
  ...grabItems,
  ...timeItems,
  ...homeItems,
  ...doctorItems,
  ...bankItems,
  ...deliveryItems,
  ...laundryItems,
  ...barberItems,
  ...leisureItems,
  ...smalltalkItems,
  ...centralItems,
];

const byId = new Map(items.map((i) => [i.id, i]));

export function item(id: string): Item {
  const found = byId.get(id);
  if (!found) throw new Error(`нет элемента ${id}`);
  return found;
}

/** Все уроки в порядке пути. */
export const lessons: Lesson[] = topics.flatMap((t) => t.lessons);

export function lesson(id: string): Lesson {
  const found = lessons.find((l) => l.id === id);
  if (!found) throw new Error(`нет урока ${id}`);
  return found;
}

/** Тема, к которой относится урок. */
export function topicOf(lessonId: string): Topic {
  const found = topics.find((t) => t.lessons.some((l) => l.id === lessonId));
  if (!found) throw new Error(`урок ${lessonId} вне тем`);
  return found;
}
