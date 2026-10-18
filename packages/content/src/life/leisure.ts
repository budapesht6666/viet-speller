/** Досуг: пиклбол, пляж и море, знакомство. */

import type { Item, Topic } from '@viet/core';
import { phrase, word } from '../define.js';

export const leisureItems: Item[] = [
  // ── пиклбол
  word('lei-choi', 'chơi', 'играть'),
  word('lei-san', 'sân', 'корт, площадка'),
  word('lei-dat-san', 'đặt sân', 'забронировать корт'),
  word('lei-bong', 'bóng', 'мяч'),
  word('lei-giao-bong', 'giao bóng', 'подача'),
  word('lei-diem', 'điểm', 'очко'),
  word('lei-cua', 'của', 'чей; принадлежит', { note: 'bóng của bạn — «мяч твой».' }),
  word('lei-hay', 'hay', 'хороший, классный'),
  phrase('lei-bong-cua-ban', 'bóng của bạn', 'твой мяч'),
  phrase('lei-hay-qua', 'hay quá', 'отлично!'),

  // ── пляж и море
  word('lei-bien', 'biển', 'море'),
  word('lei-boi', 'bơi', 'плавать'),
  word('lei-song', 'sóng', 'волна'),
  word('lei-to', 'to', 'большой'),
  word('lei-kem-chong-nang', 'kem chống nắng', 'солнцезащитный крем'),
  phrase('lei-song-to', 'sóng to quá', 'очень большие волны'),
  phrase('lei-di-boi', 'đi bơi', 'пойти поплавать'),
];

export const smalltalkItems: Item[] = [
  word('st-ten', 'tên', 'имя'),
  word('st-song', 'sống', 'жить'),
  word('st-rat', 'rất', 'очень'),
  word('st-vui', 'vui', 'радостный'),
  word('st-gap', 'gặp', 'встретить'),
  word('st-tu', 'từ', 'из, от'),
  word('st-dau', 'đâu', 'где'),
  word('st-da-nang', 'Đà Nẵng', 'Дананг'),
  phrase('st-ten-gi', 'bạn tên là gì', 'как тебя зовут?'),
  phrase('st-rat-vui', 'rất vui được gặp bạn', 'очень рад знакомству'),
  phrase('st-song-o', 'tôi sống ở Đà Nẵng', 'я живу в Дананге'),
  phrase('st-tu-dau', 'bạn đến từ đâu', 'откуда ты?'),
];

export const leisure: Topic = {
  id: 'leisure',
  title: 'Пиклбол и пляж',
  summary: 'Бронь корта, подача, твой мяч — и море',
  lessons: [
    {
      id: 'leisure-1',
      title: 'Пиклбол',
      items: ['lei-choi', 'lei-san', 'lei-dat-san', 'lei-bong', 'lei-giao-bong', 'lei-diem', 'lei-cua', 'lei-hay', 'lei-bong-cua-ban', 'lei-hay-qua'],
    },
    { id: 'leisure-2', title: 'Пляж и море', items: ['lei-bien', 'lei-boi', 'lei-song', 'lei-to', 'lei-kem-chong-nang', 'lei-song-to', 'lei-di-boi'] },
  ],
};

export const smalltalk: Topic = {
  id: 'smalltalk',
  title: 'Знакомство',
  summary: 'Как зовут, откуда, рад знакомству',
  lessons: [
    { id: 'smalltalk-1', title: 'Знакомство', items: ['st-ten', 'st-song', 'st-rat', 'st-vui', 'st-gap', 'st-tu', 'st-dau', 'st-da-nang', 'st-ten-gi', 'st-rat-vui', 'st-song-o', 'st-tu-dau'] },
  ],
};
