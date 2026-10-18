/**
 * Ачивки (PLAN.md, этап 8). Проверка — packages/core/src/achievements.ts.
 * Иконки — Streamline, эмодзи не используются нигде; тест проверяет, что
 * файл иконки существует.
 */

import type { Achievement } from '@viet/core';

export const achievements: Achievement[] = [
  { id: 'streak-3', title: 'Три дня подряд', description: 'Занимайся три дня без пропуска', icon: { set: 'ui', name: 'calendar-check' }, rule: { kind: 'streak', days: 3 } },
  { id: 'streak-7', title: 'Неделя без пропусков', description: 'Семь дней подряд', icon: { set: 'ui', name: 'calendar-heart' }, rule: { kind: 'streak', days: 7 } },
  { id: 'streak-30', title: 'Месяц подряд', description: 'Тридцать дней без пропуска', icon: { set: 'ui', name: 'multiple-stars' }, rule: { kind: 'streak', days: 30 } },
  { id: 'streak-100', title: 'Сто дней', description: 'Сто дней подряд — это уже привычка', icon: { set: 'ui', name: 'star-circle' }, rule: { kind: 'streak', days: 100 } },

  { id: 'perfect', title: 'Без единой ошибки', description: 'Пройди урок без ошибок', icon: { set: 'ui', name: 'star-medal-1' }, rule: { kind: 'perfect-lesson' } },
  { id: 'phrase', title: 'Первая фраза вслух', description: 'Скажи фразу голосом без ошибки', icon: { set: 'ui', name: 'voice-typing-word-convert' }, rule: { kind: 'phrase-spoken' } },

  { id: 'cards-20', title: '20 слов', description: 'Двадцать слов и фраз в повторении', icon: { set: 'ui', name: 'book-1' }, rule: { kind: 'cards', count: 20 } },
  { id: 'cards-100', title: '100 слов', description: 'Сто слов и фраз в повторении', icon: { set: 'objects', name: 'graduation-cap' }, rule: { kind: 'cards', count: 100 } },
  { id: 'reviews-7', title: 'Семь тренировок', description: 'Повторяй в семь разных дней', icon: { set: 'ui', name: 'reset-clock' }, rule: { kind: 'reviews', count: 7 } },

  { id: 'topic-alphabet', title: 'Буквы и звуки', description: 'Пройди тему «Алфавит и звуки»', icon: { set: 'objects', name: 'global-learning' }, rule: { kind: 'topic', topicId: 'alphabet' } },
  { id: 'topic-tones', title: 'Слышу тоны', description: 'Пройди тему «Тоны»', icon: { set: 'objects', name: 'ear-speciality' }, rule: { kind: 'topic', topicId: 'tones' } },
  { id: 'topic-numbers', title: 'Знаю цены', description: 'Пройди тему «Цифры и цены»', icon: { set: 'objects', name: 'dollar-coin' }, rule: { kind: 'topic', topicId: 'numbers' } },
  { id: 'topic-politeness', title: 'Вежливый', description: 'Пройди тему «Вежливость и обращения»', icon: { set: 'ui', name: 'user-feedback-heart' }, rule: { kind: 'topic', topicId: 'politeness' } },
  { id: 'topic-cafe', title: 'Свой в кафе', description: 'Пройди тему «Кафе и уличная еда»', icon: { set: 'objects', name: 'coffee-mug' }, rule: { kind: 'topic', topicId: 'cafe' } },
  { id: 'topic-market', title: 'На рынке', description: 'Пройди тему «Рынок»', icon: { set: 'objects', name: 'shopping-basket-1' }, rule: { kind: 'topic', topicId: 'market' } },
  { id: 'topic-grab', title: 'Сам доеду', description: 'Пройди тему «Grab и такси»', icon: { set: 'objects', name: 'location-pin' }, rule: { kind: 'topic', topicId: 'grab' } },
  { id: 'topic-family', title: 'Рассказал о семье', description: 'Пройди тему «Я и семья»', icon: { set: 'ui', name: 'user-sticker-square' }, rule: { kind: 'topic', topicId: 'family' } },
  { id: 'topic-time', title: 'Не опоздаю', description: 'Пройди тему «Время и дни»', icon: { set: 'ui', name: 'calendar-mark' }, rule: { kind: 'topic', topicId: 'time' } },
  { id: 'topic-central', title: 'Понимаю соседей', description: 'Пройди тему «Говор Центра»', icon: { set: 'objects', name: 'location-heart-pin' }, rule: { kind: 'topic', topicId: 'central' } },

  { id: 'family-day', title: 'Все вместе', description: 'Вся семья позанималась в один день', icon: { set: 'ui', name: 'user-multiple-accounts' }, rule: { kind: 'family-same-day' } },
  { id: 'family-week', title: 'Семейный час', description: 'Семья вместе набрала 60 минут за неделю', icon: { set: 'objects', name: 'gift' }, rule: { kind: 'family-week', minutes: 60 } },
];
