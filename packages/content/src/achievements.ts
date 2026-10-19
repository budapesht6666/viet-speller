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
  { id: 'topic-home', title: 'Сам договорюсь с мастером', description: 'Пройди тему «Квартира и ремонт»', icon: { set: 'ui', name: 'tool-box' }, rule: { kind: 'topic', topicId: 'home' } },
  { id: 'topic-doctor', title: 'Объясню врачу', description: 'Пройди тему «Врач и аптека»', icon: { set: 'objects', name: 'medical-bag' }, rule: { kind: 'topic', topicId: 'doctor' } },
  { id: 'topic-bank', title: 'В банке', description: 'Пройди тему «Банк и документы»', icon: { set: 'objects', name: 'piggy-bank' }, rule: { kind: 'topic', topicId: 'bank' } },
  { id: 'topic-delivery', title: 'Курьер не заблудится', description: 'Пройди тему «Доставка»', icon: { set: 'objects', name: 'shipping-box-1' }, rule: { kind: 'topic', topicId: 'delivery' } },
  { id: 'topic-laundry', title: 'Чистые рубашки', description: 'Пройди тему «Прачечная»', icon: { set: 'ui', name: 'clean-broom-wipe' }, rule: { kind: 'topic', topicId: 'laundry' } },
  { id: 'topic-barber', title: 'Подстригли как надо', description: 'Пройди тему «Парикмахерская»', icon: { set: 'ui', name: 'scissors' }, rule: { kind: 'topic', topicId: 'barber' } },
  { id: 'topic-leisure', title: 'На корте и на пляже', description: 'Пройди тему «Пиклбол и пляж»', icon: { set: 'objects', name: 'ball' }, rule: { kind: 'topic', topicId: 'leisure' } },
  { id: 'topic-smalltalk', title: 'Знакомлюсь', description: 'Пройди тему «Знакомство»', icon: { set: 'ui', name: 'chat-bubble-square-question' }, rule: { kind: 'topic', topicId: 'smalltalk' } },
  { id: 'topic-central', title: 'Понимаю соседей', description: 'Пройди тему «Говор Центра»', icon: { set: 'objects', name: 'location-heart-pin' }, rule: { kind: 'topic', topicId: 'central' } },

  { id: 'family-day', title: 'Все вместе', description: 'Вся семья позанималась в один день', icon: { set: 'ui', name: 'user-multiple-accounts' }, rule: { kind: 'family-same-day' } },
  { id: 'family-week', title: 'Семейный час', description: 'Семья вместе набрала 60 минут за неделю', icon: { set: 'objects', name: 'gift' }, rule: { kind: 'family-week', minutes: 60 } },
];
