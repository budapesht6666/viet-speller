/**
 * Цифры и цены.
 *
 * Цены слышат каждый день и путают чаще всего, поэтому раздел доходит до
 * того, как цену на самом деле говорят на рынке. Числа здесь — слова
 * (`word`), даже составные: `năm mươi nghìn` — одна лексическая единица.
 *
 * Матчер принимает и цифры от распознавания: `50.000` засчитывается за
 * `năm mươi nghìn` (packages/core/src/numbers.ts).
 */

import type { Item, Topic } from '@viet/core';
import { phrase, word } from '../define.js';

const NGHIN = { north: 'nghìn', south: 'ngàn' };

export const numberItems: Item[] = [
  // ── 0–5
  word('num-0', 'không', 'ноль', { note: 'То же слово значит «нет», «не».' }),
  word('num-1', 'một', 'один'),
  word('num-2', 'hai', 'два'),
  word('num-3', 'ba', 'три', { note: 'На Юге ba — ещё и «папа».' }),
  word('num-4', 'bốn', 'четыре'),
  word('num-5', 'năm', 'пять', { note: 'То же слово значит «год».' }),

  // ── 6–10
  word('num-6', 'sáu', 'шесть'),
  word('num-7', 'bảy', 'семь'),
  word('num-8', 'tám', 'восемь'),
  word('num-9', 'chín', 'девять'),
  word('num-10', 'mười', 'десять', { note: 'mười — с нисходящим тоном. Не путать с mươi в десятках.' }),

  // ── 11–19
  word('num-11', 'mười một', 'одиннадцать', { note: '«Десять один».' }),
  word('num-12', 'mười hai', 'двенадцать'),
  word('num-14', 'mười bốn', 'четырнадцать'),
  word('num-15', 'mười lăm', 'пятнадцать', { note: 'Пять после десятка — lăm, а не năm.' }),
  word('num-19', 'mười chín', 'девятнадцать'),

  // ── десятки
  word('num-20', 'hai mươi', 'двадцать', { note: 'В десятках mươi — ровный тон, без знака.' }),
  word('num-30', 'ba mươi', 'тридцать'),
  word('num-50', 'năm mươi', 'пятьдесят'),
  word('num-21', 'hai mươi mốt', 'двадцать один', { note: 'Один после десятков — mốt, а не một.' }),
  word('num-24', 'hai mươi bốn', 'двадцать четыре', {
    alt: ['hai mươi tư'],
    note: 'Четыре после десятков часто говорят tư, особенно на Юге. Засчитывается любое.',
  }),
  word('num-25', 'hai mươi lăm', 'двадцать пять'),
  word('num-99', 'chín mươi chín', 'девяносто девять'),

  // ── сотни и тысячи
  word('num-100', 'một trăm', 'сто'),
  word('num-200', 'hai trăm', 'двести'),
  word('num-500', 'năm trăm', 'пятьсот'),
  word('num-101', 'một trăm lẻ một', 'сто один', {
    alt: ['một trăm linh một'],
    dialect: { north: 'linh', south: 'lẻ' },
    note: 'Ноль в середине числа читают lẻ на Юге и linh на Севере.',
  }),
  word('num-1000', 'một nghìn', 'тысяча', {
    alt: ['một ngàn'],
    dialect: NGHIN,
    note: 'Тысяча — nghìn на Севере, ngàn на Юге. Засчитывается любое.',
  }),
  word('num-10000', 'mười nghìn', 'десять тысяч', { alt: ['mười ngàn'], dialect: NGHIN }),
  word('num-1m', 'một triệu', 'миллион'),

  // ── цены
  word('price-tien', 'tiền', 'деньги'),
  word('price-dong', 'đồng', 'донг'),
  word('price-bao-nhieu', 'bao nhiêu', 'сколько'),
  word('price-dat', 'đắt', 'дорогой'),
  word('price-re', 'rẻ', 'дешёвый'),
  word('price-50k', 'năm mươi nghìn', '50 000', {
    alt: ['năm mươi ngàn'],
    dialect: NGHIN,
    note: 'На ценнике пишут 50k или 50.000đ.',
  }),
  word('price-chuc', 'năm chục', '50 тысяч — так говорят на рынке', {
    note: 'chục — десяток. В цене «năm chục» значит пятьдесят тысяч донгов: тысячи не договаривают.',
  }),
  phrase('price-how-much', 'bao nhiêu tiền', 'сколько стоит?'),
  phrase('price-200k', 'hai trăm nghìn đồng', '200 000 донгов', { alt: ['hai trăm ngàn đồng'] }),
  phrase('price-too-expensive', 'đắt quá', 'слишком дорого'),
  phrase('price-cheap', 'rẻ quá', 'очень дёшево'),
];

export const numbers: Topic = {
  id: 'numbers',
  title: 'Цифры и цены',
  summary: 'От нуля до миллиона — и как цену говорят на рынке',
  lessons: [
    { id: 'numbers-1', title: '0–5', items: ['num-0', 'num-1', 'num-2', 'num-3', 'num-4', 'num-5'] },
    { id: 'numbers-2', title: '6–10', items: ['num-6', 'num-7', 'num-8', 'num-9', 'num-10'] },
    { id: 'numbers-3', title: '11–19', items: ['num-11', 'num-12', 'num-14', 'num-15', 'num-19'] },
    { id: 'numbers-4', title: 'Десятки', items: ['num-20', 'num-30', 'num-50', 'num-21', 'num-24', 'num-25', 'num-99'] },
    { id: 'numbers-5', title: 'Сотни, тысячи, миллион', items: ['num-100', 'num-200', 'num-500', 'num-101', 'num-1000', 'num-10000', 'num-1m'] },
    {
      id: 'numbers-6',
      title: 'Сколько стоит',
      items: [
        'price-tien',
        'price-dong',
        'price-bao-nhieu',
        'price-dat',
        'price-re',
        'price-50k',
        'price-chuc',
        'price-how-much',
        'price-200k',
        'price-too-expensive',
        'price-cheap',
      ],
    },
  ],
};
