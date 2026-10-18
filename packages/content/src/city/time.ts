/** Время и дни: который час, сегодня-завтра, дни недели. */

import type { Item, Topic } from '@viet/core';
import { phrase, word } from '../define.js';

export const timeItems: Item[] = [
  // ── сегодня, завтра
  word('time-hom-nay', 'hôm nay', 'сегодня'),
  word('time-ngay-mai', 'ngày mai', 'завтра'),
  word('time-hom-qua', 'hôm qua', 'вчера'),
  word('time-bay-gio', 'bây giờ', 'сейчас'),
  word('time-sang', 'sáng', 'утро'),
  word('time-chieu', 'chiều', 'день после полудня'),
  word('time-toi', 'tối', 'вечер'),

  // ── который час
  word('time-gio', 'giờ', 'час (на часах)'),
  word('time-may-gio', 'mấy giờ', 'во сколько; который час'),
  phrase('time-bay-gio-may-gio', 'bây giờ là mấy giờ', 'который сейчас час?'),
  phrase('time-ba-gio', 'ba giờ', 'три часа'),
  phrase('time-ba-gio-chieu', 'ba giờ chiều', 'три часа дня'),
  phrase('time-sang-mai', 'sáng mai', 'завтра утром', { note: 'Порядок обратный русскому: «утро завтра».' }),
  phrase('time-toi-nay', 'tối nay', 'сегодня вечером', { note: 'nay — «этот, нынешний».' }),

  // ── дни недели
  word('time-thu-hai', 'thứ hai', 'понедельник', { note: 'Дословно «второй»: неделя считается с воскресенья.' }),
  word('time-thu-ba', 'thứ ba', 'вторник'),
  word('time-thu-tu', 'thứ tư', 'среда', { note: 'Здесь четыре — всегда tư, не bốn.' }),
  word('time-thu-nam', 'thứ năm', 'четверг'),
  word('time-thu-sau', 'thứ sáu', 'пятница'),
  word('time-thu-bay', 'thứ bảy', 'суббота'),
  word('time-chu-nhat', 'chủ nhật', 'воскресенье'),
];

export const time: Topic = {
  id: 'time',
  title: 'Время и дни',
  summary: 'Который час, сегодня-завтра, дни недели',
  lessons: [
    { id: 'time-1', title: 'Сегодня, завтра, вечер', items: ['time-hom-nay', 'time-ngay-mai', 'time-hom-qua', 'time-bay-gio', 'time-sang', 'time-chieu', 'time-toi'] },
    {
      id: 'time-2',
      title: 'Который час',
      items: ['time-gio', 'time-may-gio', 'time-bay-gio-may-gio', 'time-ba-gio', 'time-ba-gio-chieu', 'time-sang-mai', 'time-toi-nay'],
    },
    { id: 'time-3', title: 'Дни недели', items: ['time-thu-hai', 'time-thu-ba', 'time-thu-tu', 'time-thu-nam', 'time-thu-sau', 'time-thu-bay', 'time-chu-nhat'] },
  ],
};
