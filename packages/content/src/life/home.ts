/** Квартира и ремонт: аренда, счета, сломалось — когда придёт мастер. */

import type { Item, Topic } from '@viet/core';
import { phrase, word } from '../define.js';

export const homeItems: Item[] = [
  // ── квартира
  word('home-phong', 'phòng', 'комната'),
  word('home-chu-nha', 'chủ nhà', 'хозяин жилья'),
  word('home-thue', 'thuê', 'снимать, арендовать'),
  word('home-muon', 'muốn', 'хотеть'),
  word('home-dien', 'điện', 'электричество'),
  word('home-tien-nha', 'tiền nhà', 'плата за жильё'),
  word('home-tien-dien', 'tiền điện', 'счёт за свет'),
  word('home-tien-nuoc', 'tiền nước', 'счёт за воду'),
  word('home-hoa-don', 'hóa đơn', 'счёт, квитанция'),
  phrase('home-muon-thue', 'tôi muốn thuê nhà', 'я хочу снять жильё'),

  // ── сломалось
  word('home-may-lanh', 'máy lạnh', 'кондиционер', {
    alt: ['điều hòa'],
    dialect: { north: 'điều hòa', south: 'máy lạnh' },
    note: 'На Севере кондиционер — điều hòa. Засчитывается любое.',
  }),
  word('home-hu', 'hư', 'сломанный', { alt: ['hỏng'], dialect: { north: 'hỏng', south: 'hư' }, note: 'На Севере — hỏng. Засчитывается любое.' }),
  word('home-bi', 'bị', '(случилось плохое)', { note: 'Ставят, когда случилось неприятное: bị hư — сломалось, bị sốt — температура.' }),
  word('home-sua', 'sửa', 'чинить'),
  word('home-tho', 'thợ', 'мастер'),
  word('home-khi-nao', 'khi nào', 'когда', { alt: ['bao giờ'], dialect: { north: 'bao giờ', south: 'khi nào' }, note: 'На Севере — bao giờ. Засчитывается любое.' }),
  word('home-den', 'đến', 'прийти, приехать'),
  phrase('home-may-lanh-hu', 'máy lạnh bị hư', 'сломался кондиционер', { alt: ['điều hòa bị hỏng', 'máy lạnh bị hỏng', 'điều hòa bị hư'] }),
  phrase('home-khi-nao-tho-den', 'khi nào thợ đến', 'когда придёт мастер?', { alt: ['bao giờ thợ đến'] }),
];

export const home: Topic = {
  id: 'home',
  title: 'Квартира и ремонт',
  summary: 'Аренда, счета, сломалось — когда придёт мастер',
  lessons: [
    {
      id: 'home-1',
      title: 'Квартира и счета',
      items: ['home-phong', 'home-chu-nha', 'home-thue', 'home-muon', 'home-dien', 'home-tien-nha', 'home-tien-dien', 'home-tien-nuoc', 'home-hoa-don', 'home-muon-thue'],
    },
    {
      id: 'home-2',
      title: 'Сломалось',
      items: ['home-may-lanh', 'home-hu', 'home-bi', 'home-sua', 'home-tho', 'home-khi-nao', 'home-den', 'home-may-lanh-hu', 'home-khi-nao-tho-den'],
    },
  ],
};
