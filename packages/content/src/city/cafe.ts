/** Кафе и уличная еда: заказать, попросить без льда и не острое, посчитать. */

import type { Item, Topic } from '@viet/core';
import { phrase, word } from '../define.js';

export const cafeItems: Item[] = [
  // ── кофе
  word('cafe-ca-phe', 'cà phê', 'кофе'),
  word('cafe-den', 'đen', 'чёрный'),
  word('cafe-ca-phe-den', 'cà phê đen', 'чёрный кофе'),
  word('cafe-ca-phe-sua', 'cà phê sữa', 'кофе со сгущёнкой', { note: 'Молоко во вьетнамском кофе — сгущёнка.' }),
  word('cafe-ca-phe-sua-da', 'cà phê sữa đá', 'кофе со сгущёнкой и льдом'),
  word('cafe-tra-da', 'trà đá', 'холодный чай со льдом'),
  word('cafe-cho', 'cho', 'дать', { note: 'Cho tôi… — «дайте мне…»: так начинается заказ.' }),
  phrase('cafe-order', 'cho tôi một cà phê sữa đá', 'мне один кофе со сгущёнкой и льдом'),

  // ── как заказать
  word('cafe-it', 'ít', 'мало'),
  word('cafe-duong', 'đường', 'сахар', { note: 'То же слово значит «дорога».' }),
  word('cafe-cay', 'cay', 'острый'),
  word('cafe-ngon', 'ngon', 'вкусный'),
  word('cafe-tinh-tien', 'tính tiền', 'посчитайте', { note: 'Так просят счёт. Tính — считать, tiền — деньги.' }),
  phrase('cafe-khong-da', 'không đá', 'без льда'),
  phrase('cafe-it-duong', 'ít đường', 'поменьше сахара'),
  phrase('cafe-khong-cay', 'không cay', 'не острое'),
  phrase('cafe-ngon-qua', 'ngon quá', 'очень вкусно'),

  // ── уличная еда
  word('cafe-banh-mi', 'bánh mì', 'бутерброд в багете'),
  word('cafe-bun', 'bún', 'рисовая лапша'),
  word('cafe-com', 'cơm', 'рис; еда', { note: 'Варёный рис — и обед вообще.' }),
  word('cafe-mi-quang', 'mì Quảng', 'лапша по-куангнамски — блюдо Дананга'),
  word('cafe-cao-lau', 'cao lầu', 'лапша из Хойана'),
  word('cafe-nuoc', 'nước', 'вода'),
  word('cafe-ly', 'ly', 'стакан', { alt: ['cốc'], dialect: { north: 'cốc', south: 'ly' }, note: 'На Севере стакан — cốc. Засчитывается любое.' }),
  phrase('cafe-ly-nuoc', 'cho tôi một ly nước', 'дайте стакан воды', { alt: ['cho tôi một cốc nước'] }),
];

export const cafe: Topic = {
  id: 'cafe',
  title: 'Кафе и уличная еда',
  summary: 'Заказать кофе, без льда, не острое, счёт',
  lessons: [
    {
      id: 'cafe-1',
      title: 'Кофе',
      items: ['cafe-ca-phe', 'cafe-den', 'cafe-ca-phe-den', 'cafe-ca-phe-sua', 'cafe-ca-phe-sua-da', 'cafe-tra-da', 'cafe-cho', 'cafe-order'],
    },
    {
      id: 'cafe-2',
      title: 'Без льда и не острое',
      items: ['cafe-it', 'cafe-duong', 'cafe-cay', 'cafe-ngon', 'cafe-tinh-tien', 'cafe-khong-da', 'cafe-it-duong', 'cafe-khong-cay', 'cafe-ngon-qua'],
    },
    {
      id: 'cafe-3',
      title: 'Уличная еда',
      items: ['cafe-banh-mi', 'cafe-bun', 'cafe-com', 'cafe-mi-quang', 'cafe-cao-lau', 'cafe-nuoc', 'cafe-ly', 'cafe-ly-nuoc'],
    },
  ],
};
