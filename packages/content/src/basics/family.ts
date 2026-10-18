/** Я и семья: рассказать о себе и о родных. */

import type { Item, Topic } from '@viet/core';
import { phrase, word } from '../define.js';

export const familyItems: Item[] = [
  word('fam-gia-dinh', 'gia đình', 'семья'),
  word('fam-vo', 'vợ', 'жена'),
  word('fam-chong', 'chồng', 'муж'),
  word('fam-con', 'con', 'ребёнок (сын или дочь)'),
  word('fam-con-trai', 'con trai', 'сын'),
  word('fam-con-gai', 'con gái', 'дочь'),
  word('fam-bo', 'bố', 'папа', { alt: ['ba'], dialect: { north: 'bố', south: 'ba' }, note: 'На Юге папа — ba. Засчитывается любое.' }),
  word('fam-me', 'mẹ', 'мама', { alt: ['má'], dialect: { north: 'mẹ', south: 'má' }, note: 'На Юге мама — má. Засчитывается любое.' }),
  phrase('fam-vo-toi', 'vợ tôi', 'моя жена', { note: 'Принадлежность — после слова: «жена я».' }),
  phrase('fam-chong-toi', 'chồng tôi', 'мой муж'),
  phrase('fam-hai-con', 'tôi có hai con', 'у меня двое детей'),
  phrase('fam-day-la', 'đây là vợ tôi', 'это моя жена', { note: 'Đây là… — «это…», когда показываешь на человека рядом.' }),
  word('fam-day', 'đây', 'это, вот (рядом)'),
];

export const family: Topic = {
  id: 'family',
  title: 'Я и семья',
  summary: 'Жена, муж, дети — и как о них рассказать',
  lessons: [
    { id: 'family-1', title: 'Родные', items: ['fam-gia-dinh', 'fam-vo', 'fam-chong', 'fam-con', 'fam-con-trai', 'fam-con-gai', 'fam-bo', 'fam-me'] },
    { id: 'family-2', title: 'Рассказать о семье', items: ['fam-day', 'fam-vo-toi', 'fam-chong-toi', 'fam-hai-con', 'fam-day-la'] },
  ],
};
