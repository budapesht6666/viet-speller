/**
 * Прогресс как журнал событий (CLAUDE.md, «Устройство»).
 *
 * Хранится только журнал: «урок пройден», «карточка повторена». Всё
 * остальное — пройденные уроки, карточки FSRS, серия дней, минуты за
 * неделю — вычисляется из него функцией `replay`. Её же вызывает сервер:
 * две реализации одного правила разъехались бы, и в семейном рейтинге
 * оказалось бы не то, что на телефоне.
 *
 * Поэтому здесь нет ничего, что зависит от машины: часовой пояс один —
 * Вьетнама, а у планировщика выключен случайный разброс интервалов.
 */

import { createEmptyCard, fsrs, type Card } from 'ts-fsrs';
import type { Lesson, Topic } from './content.js';
import type { Grade } from './lesson.js';

/** Семья живёт во Вьетнаме: «сегодня» одно и то же на телефоне и на сервере. */
export const TIME_ZONE = 'Asia/Ho_Chi_Minh';

interface EventBase {
  /** UUID: сервер принимает событие идемпотентно, повторная отправка не удваивает. */
  id: string;
  /** ISO-время на телефоне. */
  at: string;
  /** Сколько секунд заняло — для минут практики и рейтинга. */
  seconds: number;
}

export interface LessonDoneEvent extends EventBase {
  type: 'lesson-done';
  lessonId: string;
  /** Оценка по каждому элементу урока: lessonGrades. */
  grades: Record<string, Grade>;
  accuracy: number;
  /** Урок шёл с микрофоном — для ачивок «сказал сам». */
  mic: boolean;
}

export interface ReviewEvent extends EventBase {
  type: 'review';
  itemId: string;
  grade: Grade;
}

export type ProgressEvent = LessonDoneEvent | ReviewEvent;

export interface Progress {
  doneLessons: Set<string>;
  /** Лучшая точность по уроку. */
  bestAccuracy: Map<string, number>;
  cards: Map<string, Card>;
  /** День (YYYY-MM-DD по Вьетнаму) → секунд практики. */
  days: Map<string, number>;
  events: ProgressEvent[];
}

const scheduler = fsrs({ enable_fuzz: false });

const dayFormat = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' });

/** Дата по Вьетнаму: 2026-10-18. */
export function dayKey(at: Date | string): string {
  return dayFormat.format(typeof at === 'string' ? new Date(at) : at);
}

/** Тот же порядок на любой машине: по времени, при равенстве — по id. */
export function sortEvents(events: ProgressEvent[]): ProgressEvent[] {
  return [...events].sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id));
}

function review(cards: Map<string, Card>, itemId: string, grade: Grade, at: Date): void {
  const card: Card = cards.get(itemId) ?? createEmptyCard<Card>(at);
  cards.set(itemId, scheduler.next(card, at, grade).card);
}

export function replay(events: ProgressEvent[]): Progress {
  const sorted = sortEvents(events);
  const p: Progress = { doneLessons: new Set(), bestAccuracy: new Map(), cards: new Map(), days: new Map(), events: sorted };
  for (const e of sorted) {
    const at = new Date(e.at);
    const day = dayKey(at);
    p.days.set(day, (p.days.get(day) ?? 0) + e.seconds);
    if (e.type === 'lesson-done') {
      p.doneLessons.add(e.lessonId);
      p.bestAccuracy.set(e.lessonId, Math.max(p.bestAccuracy.get(e.lessonId) ?? 0, e.accuracy));
      for (const [itemId, grade] of Object.entries(e.grades)) review(p.cards, itemId, grade, at);
    } else {
      review(p.cards, e.itemId, e.grade, at);
    }
  }
  return p;
}

/** Элементы, которые пора повторить, — сначала самые просроченные. */
export function dueItems(p: Progress, now: Date): string[] {
  return [...p.cards.entries()]
    .filter(([, c]) => c.due.getTime() <= now.getTime())
    .sort(([, a], [, b]) => a.due.getTime() - b.due.getTime())
    .map(([id]) => id);
}

function shiftDay(day: string, delta: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

/**
 * Серия дней подряд с практикой. Сегодняшний день, пока в нём ничего нет,
 * серию не обрывает: утром она ещё жива, оборвётся только завтра.
 */
export function streak(p: Progress, now: Date): number {
  let day = dayKey(now);
  if (!p.days.has(day)) day = shiftDay(day, -1);
  let n = 0;
  while (p.days.has(day)) {
    n++;
    day = shiftDay(day, -1);
  }
  return n;
}

export function minutesOn(p: Progress, day: string): number {
  return Math.round((p.days.get(day) ?? 0) / 60);
}

/** Понедельник недели (YYYY-MM-DD), в которую попадает день. Неделя рейтинга — с понедельника. */
export function weekStart(day: string): string {
  const weekday = new Date(`${day}T12:00:00Z`).getUTCDay(); // 0 — воскресенье
  return shiftDay(day, -((weekday + 6) % 7));
}

/** Минуты практики за неделю, которой принадлежит `now`. */
export function minutesThisWeek(p: Progress, now: Date): number {
  const start = weekStart(dayKey(now));
  let seconds = 0;
  for (let i = 0; i < 7; i++) seconds += p.days.get(shiftDay(start, i)) ?? 0;
  return Math.round(seconds / 60);
}

/**
 * Какие уроки открыты. Путь линейный: открыт первый урок и каждый, перед
 * которым пройден предыдущий. Пройденный открыт всегда — к нему можно
 * вернуться.
 */
export function unlockedLessons(path: Lesson[], p: Progress): Set<string> {
  const open = new Set<string>();
  path.forEach((l, i) => {
    if (i === 0 || p.doneLessons.has(l.id) || p.doneLessons.has(path[i - 1]!.id)) open.add(l.id);
  });
  return open;
}

/**
 * Уровень темы (PLAN.md, этап 5): 0 — не пройдена, 1 «Узнаю» — все уроки
 * пройдены, 2 «Повторяю» — каждый элемент повторён хотя бы раз после урока,
 * 3 «Говорю сам» — всё держится в памяти не меньше месяца, 4 «Свободно» —
 * не меньше четырёх месяцев.
 *
 * Пороги — по росту стабильности FSRS-6 при ответах вовремя: 2 → 11 → 46 →
 * 163 дня. Месяц — это около четырёх удачных повторений за две недели;
 * неделя давалась бы на второй день и ничего бы не значила.
 *
 * Мерило — память по FSRS (стабильность карточки), а не способ ответа:
 * журнал не отличает сказанное голосом от выбранного касанием, и уровень
 * не обещает больше, чем проверяет.
 */
export const TOPIC_LEVELS = ['Не пройдена', 'Узнаю', 'Повторяю', 'Говорю сам', 'Свободно'] as const;
export type TopicLevel = 0 | 1 | 2 | 3 | 4;

/** Стабильность карточки в днях для «Говорю сам» и «Свободно». */
const SPEAK_DAYS = 30;
const FLUENT_DAYS = 120;

export function topicLevel(topic: Topic, p: Progress): TopicLevel {
  if (!topic.lessons.every((l) => p.doneLessons.has(l.id))) return 0;
  const cards = topic.lessons.flatMap((l) => l.items).map((id) => p.cards.get(id));
  if (cards.some((c) => !c)) return 1;
  const all = cards as Card[];
  // Первая оценка карточки — в самом уроке; «повторено» — значит, была ещё одна.
  if (all.some((c) => c.reps < 2)) return 1;
  const weakest = Math.min(...all.map((c) => c.stability));
  if (weakest >= FLUENT_DAYS) return 4;
  if (weakest >= SPEAK_DAYS) return 3;
  return 2;
}

/** Следующий урок по пути: первый открытый и не пройденный. */
export function nextLesson(path: Lesson[], p: Progress): Lesson | null {
  const open = unlockedLessons(path, p);
  return path.find((l) => open.has(l.id) && !p.doneLessons.has(l.id)) ?? null;
}
