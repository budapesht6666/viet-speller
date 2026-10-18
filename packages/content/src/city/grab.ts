/** Grab и такси: куда ехать, налево-направо, остановите здесь. */

import type { Item, Topic } from '@viet/core';
import { phrase, word } from '../define.js';

const TURN = { north: 'rẽ', south: 'quẹo' };

export const grabItems: Item[] = [
  // ── направо, налево
  word('grab-re-trai', 'rẽ trái', 'налево', { alt: ['quẹo trái'], dialect: TURN, note: 'На Юге поворачивают quẹo. Засчитывается любое.' }),
  word('grab-re-phai', 'rẽ phải', 'направо', { alt: ['quẹo phải'], dialect: TURN }),
  word('grab-thang', 'thẳng', 'прямо'),
  word('grab-dung', 'dừng', 'остановиться'),
  word('grab-o-day', 'ở đây', 'здесь'),
  word('grab-thoi', 'thôi', 'хватит', { note: 'В просьбе смягчает: chậm thôi — «помедленнее».' }),
  phrase('grab-di-thang', 'đi thẳng', 'прямо (езжайте)'),
  phrase('grab-dung-o-day', 'dừng ở đây', 'остановите здесь'),
  phrase('grab-cham-thoi', 'chậm thôi', 'помедленнее'),

  // ── куда едем
  word('grab-san-bay', 'sân bay', 'аэропорт'),
  word('grab-khach-san', 'khách sạn', 'гостиница'),
  word('grab-bai-bien', 'bãi biển', 'пляж'),
  word('grab-benh-vien', 'bệnh viện', 'больница'),
  word('grab-dia-chi', 'địa chỉ', 'адрес'),
  phrase('grab-di-san-bay', 'đi sân bay', 'в аэропорт', { note: 'Đi + место — «едем в…».' }),
  phrase('grab-di-bai-bien', 'đi bãi biển', 'на пляж'),

  // ── сколько ехать
  word('grab-may', 'mấy', 'сколько (о небольшом числе)'),
  word('grab-phut', 'phút', 'минута'),
  word('grab-nua', 'nữa', 'ещё'),
  phrase('grab-may-phut', 'mấy phút nữa', 'через сколько минут?', { note: 'Водитель ответит: năm phút nữa — «ещё пять минут».' }),
  phrase('grab-nam-phut', 'năm phút nữa', 'ещё пять минут'),
];

export const grab: Topic = {
  id: 'grab',
  title: 'Grab и такси',
  summary: 'Куда ехать, налево-направо, остановите здесь',
  lessons: [
    {
      id: 'grab-1',
      title: 'Налево, направо, здесь',
      items: ['grab-re-trai', 'grab-re-phai', 'grab-thang', 'grab-dung', 'grab-o-day', 'grab-thoi', 'grab-di-thang', 'grab-dung-o-day', 'grab-cham-thoi'],
    },
    {
      id: 'grab-2',
      title: 'Куда едем',
      items: ['grab-san-bay', 'grab-khach-san', 'grab-bai-bien', 'grab-benh-vien', 'grab-dia-chi', 'grab-di-san-bay', 'grab-di-bai-bien'],
    },
    {
      id: 'grab-3',
      title: 'Сколько ехать',
      items: ['grab-may', 'grab-phut', 'grab-nua', 'grab-may-phut', 'grab-nam-phut'],
    },
  ],
};
