/**
 * Алфавит и звуки.
 *
 * Буквы учим не по названиям (`bê`, `xê` в быту не нужны никому), а по
 * звуку в частом слове. Пояснение — что читается не так, как ждёт русский
 * глаз. Транскрипции кириллицей нет (PLAN.md, этап 3): сравнение с русским
 * звуком — только там, где оно честное, остальное — на слух, по образцу.
 *
 * Уроки только на слух: одиночный слог голосом не проверяем (этап 0).
 */

import type { Item, Topic } from '@viet/core';
import { word } from '../define.js';

export const alphabetItems: Item[] = [
  // ── a, ă, â, e, ê
  word('abc-xa', 'xa', 'далеко', { note: 'a — как русское «а». x — как «с».' }),
  word('abc-an', 'ăn', 'есть, кушать', { note: 'ă — короткое «а».' }),
  word('abc-can', 'cân', 'весы; взвешивать', { note: 'â — короткий неясный звук, как безударная «а» в слове «комната».' }),
  word('abc-xe', 'xe', 'машина, мотобайк — любой транспорт', { note: 'e — открытое «э», рот шире, чем в русском.' }),
  word('abc-ve', 'về', 'вернуться (домой)', { note: 'ê — узкое «э», ближе к «и», чем e.' }),

  // ── o, ô, ơ, i, u, ư
  word('abc-co', 'có', 'есть, иметь', { note: 'o — открытое «о», рот шире, чем в русском.' }),
  word('abc-toi', 'tôi', 'я', { note: 'ô — узкое «о», губы округлены сильнее.' }),
  word('abc-mo', 'mở', 'открыть; включить', { note: 'ơ — долгий неясный звук, что-то среднее между «э» и «ы».' }),
  word('abc-di', 'đi', 'идти, ехать', { note: 'i — как «и».' }),
  word('abc-mua', 'mua', 'покупать', { note: 'u — как «у».' }),
  word('abc-sua', 'sữa', 'молоко', { note: 'ư — близко к русскому «ы».' }),

  // ── đ, d, gi, x, s
  word('abc-da-ice', 'đá', 'лёд; камень', { note: 'đ — как русское «д». В кафе đá — это лёд.' }),
  word('abc-da-skin', 'da', 'кожа', {
    note: 'd — не «д». На Севере звучит как «з», на Юге и в Центре — как «й».',
  }),
  word('abc-gia', 'giá', 'цена', { note: 'gi — так же, как d: на Севере «з», на Юге и в Центре «й».' }),
  word('abc-xin', 'xin', 'просить (вежливо)', { note: 'x — как «с». Xin перед просьбой — вежливое «пожалуйста».' }),
  word('abc-sach', 'sạch', 'чистый', { note: 's — на Севере как «с», на Юге и в Центре многие говорят ближе к «ш».' }),

  // ── ph, kh, th, tr, ch, nh
  word('abc-pho', 'phở', 'фо — суп с лапшой', { note: 'ph — «ф».' }),
  word('abc-kho', 'khô', 'сухой', { note: 'kh — как русское «х».' }),
  word('abc-thit', 'thịt', 'мясо', { note: 'th — «т» с выдохом, а не английское th.' }),
  word('abc-tra', 'trà', 'чай', { note: 'tr — на Севере как «ч», на Юге и в Центре твёрже, с языком, загнутым назад.' }),
  word('abc-cho', 'chợ', 'рынок', { note: 'ch — мягкое «ч».' }),
  word('abc-nha', 'nhà', 'дом', { note: 'nh — как «нь».' }),

  // ── ng, ngh, g, gh, qu, r, v
  word('abc-ngu', 'ngủ', 'спать', { note: 'ng — носовой звук, как в английском «sing», только в начале слова.' }),
  word('abc-nghe', 'nghe', 'слушать, слышать', { note: 'ngh — тот же звук, что ng; так пишут перед i, e, ê.' }),
  word('abc-ga', 'gà', 'курица', { note: 'g — мягкое фрикативное «г», как в южнорусском говоре.' }),
  word('abc-ghe', 'ghế', 'стул', { note: 'gh — тот же звук, что g; так пишут перед i, e, ê.' }),
  word('abc-qua', 'quá', 'слишком, очень', { note: 'qu — «кв». На Юге часто звучит просто как «в».' }),
  word('abc-rau', 'rau', 'зелень, овощи', { note: 'r — на Севере как «з», на Юге и в Центре ближе к русскому «р».' }),
  word('abc-vang', 'vâng', 'да (вежливо)', {
    alt: ['dạ'],
    dialect: { north: 'vâng', south: 'dạ' },
    note: 'v — «в». Вежливое «да» на Севере — vâng, на Юге — dạ. Засчитывается любое.',
  }),
];

export const alphabet: Topic = {
  id: 'alphabet',
  title: 'Алфавит и звуки',
  summary: 'Что читается не так, как кажется',
  lessons: [
    { id: 'alphabet-1', title: 'a, ă, â, e, ê', items: ['abc-xa', 'abc-an', 'abc-can', 'abc-xe', 'abc-ve'], listenOnly: true },
    { id: 'alphabet-2', title: 'o, ô, ơ, i, u, ư', items: ['abc-co', 'abc-toi', 'abc-mo', 'abc-di', 'abc-mua', 'abc-sua'], listenOnly: true },
    { id: 'alphabet-3', title: 'đ, d, gi, x, s', items: ['abc-da-ice', 'abc-da-skin', 'abc-gia', 'abc-xin', 'abc-sach'], listenOnly: true },
    { id: 'alphabet-4', title: 'ph, kh, th, tr, ch, nh', items: ['abc-pho', 'abc-kho', 'abc-thit', 'abc-tra', 'abc-cho', 'abc-nha'], listenOnly: true },
    { id: 'alphabet-5', title: 'ng, g, qu, r, v', items: ['abc-ngu', 'abc-nghe', 'abc-ga', 'abc-ghe', 'abc-qua', 'abc-rau', 'abc-vang'], listenOnly: true },
  ],
};
