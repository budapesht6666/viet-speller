/**
 * Бытовые услуги: доставка, прачечная, парикмахерская. То, что в Дананге
 * нужно каждую неделю и где разговор короткий и всегда один и тот же.
 */

import type { Item, Topic } from '@viet/core';
import { phrase, word } from '../define.js';

export const deliveryItems: Item[] = [
  // ── курьер у двери
  word('del-giao-hang', 'giao hàng', 'доставка; доставить'),
  word('del-shipper', 'shipper', 'курьер', { note: 'Так и говорят — английским словом. Пишут тоже латиницей.' }),
  word('del-don-hang', 'đơn hàng', 'заказ'),
  word('del-goi', 'gọi', 'звонить; звать'),
  word('del-dien-thoai', 'điện thoại', 'телефон'),
  word('del-so-dien-thoai', 'số điện thoại', 'номер телефона'),
  word('del-cho', 'chờ', 'ждать', { alt: ['đợi'], dialect: { north: 'đợi', south: 'chờ' }, note: 'На Севере чаще đợi. Засчитывается любое.' }),
  word('del-xuong', 'xuống', 'спуститься'),
  word('del-ngay', 'ngay', 'сразу, сейчас же'),
  phrase('del-cho-mot-chut', 'anh chờ một chút', 'подождите минутку (мужчине)', { alt: ['anh đợi một chút'] }),
  phrase('del-xuong-ngay', 'tôi xuống ngay', 'я сейчас спущусь'),
  phrase('del-goi-cho-toi', 'gọi cho tôi', 'позвоните мне'),

  // ── куда и как оплачено
  word('del-cong', 'cổng', 'ворота'),
  word('del-tang', 'tầng', 'этаж', {
    alt: ['lầu'],
    dialect: { north: 'tầng', south: 'lầu' },
    note: 'На Юге — lầu, и считают его от первого этажа над землёй: lầu một — это второй этаж. Засчитывается любое.',
  }),
  word('del-de', 'để', 'оставить, положить'),
  word('del-phi', 'phí', 'плата, сбор'),
  word('del-mien-phi', 'miễn phí', 'бесплатно'),
  word('del-sap', 'sắp', 'вот-вот, скоро'),
  word('del-chua', 'chưa', 'ещё нет; в конце вопроса — «уже?»'),
  word('del-roi', 'rồi', 'уже; готово'),
  word('del-da', 'đã', 'уже (о том, что случилось)'),
  phrase('del-de-o-cong', 'để ở cổng', 'оставьте у ворот'),
  phrase('del-sap-den-chua', 'anh sắp đến chưa', 'вы скоро приедете? (мужчине)'),
  phrase('del-da-tra-tien', 'đã trả tiền rồi', 'уже оплачено'),
];

export const delivery: Topic = {
  id: 'delivery',
  title: 'Доставка',
  summary: 'Курьер звонит, ты спускаешься или просишь оставить у ворот',
  lessons: [
    {
      id: 'delivery-1',
      title: 'Курьер у двери',
      items: ['del-giao-hang', 'del-shipper', 'del-don-hang', 'del-goi', 'del-dien-thoai', 'del-so-dien-thoai', 'del-cho', 'del-xuong', 'del-ngay', 'del-cho-mot-chut', 'del-xuong-ngay', 'del-goi-cho-toi'],
    },
    {
      id: 'delivery-2',
      title: 'Куда и как оплачено',
      items: ['del-cong', 'del-tang', 'del-de', 'del-phi', 'del-mien-phi', 'del-sap', 'del-chua', 'del-roi', 'del-da', 'del-de-o-cong', 'del-sap-den-chua', 'del-da-tra-tien'],
    },
  ],
};

export const laundryItems: Item[] = [
  // ── сдать в стирку
  word('lau-giat', 'giặt', 'стирать'),
  word('lau-quan-ao', 'quần áo', 'одежда'),
  word('lau-ao', 'áo', 'рубашка, кофта — всё, что сверху'),
  word('lau-quan', 'quần', 'брюки, шорты'),
  word('lau-do', 'đồ', 'вещи'),
  word('lau-ui', 'ủi', 'гладить', { alt: ['là'], dialect: { north: 'là', south: 'ủi' }, note: 'На Севере гладить — là. Засчитывается любое.' }),
  word('lau-giat-ui', 'giặt ủi', 'стирка с глажкой; прачечная', {
    alt: ['giặt là'],
    dialect: { north: 'giặt là', south: 'giặt ủi' },
    note: 'На Севере — giặt là. Засчитывается любое.',
  }),
  word('lau-say', 'sấy', 'сушить (в машине)'),
  phrase('lau-muon-giat', 'tôi muốn giặt quần áo', 'я хочу постирать одежду'),
  phrase('lau-bao-nhieu-mot-ky', 'bao nhiêu tiền một ký', 'сколько стоит килограмм?', { alt: ['bao nhiêu tiền một cân'] }),

  // ── забрать
  word('lau-lay', 'lấy', 'забрать, взять'),
  word('lau-rieng', 'riêng', 'отдельно'),
  word('lau-trang', 'trắng', 'белый'),
  word('lau-mau', 'màu', 'цвет; цветной'),
  word('lau-ban', 'bẩn', 'грязный', { alt: ['dơ'], dialect: { north: 'bẩn', south: 'dơ' }, note: 'На Юге — dơ. Засчитывается любое.' }),
  phrase('lau-khi-nao-lay', 'khi nào lấy được', 'когда можно забрать?', { alt: ['bao giờ lấy được'] }),
  phrase('lau-ngay-mai-lay', 'ngày mai lấy được không', 'завтра можно забрать?'),
  phrase('lau-giat-rieng', 'giặt riêng đồ trắng', 'белое постирайте отдельно'),
  phrase('lau-ao-bi-ban', 'áo này bị bẩn', 'эта рубашка испачкалась', { alt: ['áo này bị dơ'] }),
];

export const laundry: Topic = {
  id: 'laundry',
  title: 'Прачечная',
  summary: 'Сдать вещи по весу, попросить погладить, забрать завтра',
  lessons: [
    {
      id: 'laundry-1',
      title: 'Сдать в стирку',
      items: ['lau-giat', 'lau-quan-ao', 'lau-ao', 'lau-quan', 'lau-do', 'lau-ui', 'lau-giat-ui', 'lau-say', 'lau-muon-giat', 'lau-bao-nhieu-mot-ky'],
    },
    {
      id: 'laundry-2',
      title: 'Забрать',
      items: ['lau-lay', 'lau-rieng', 'lau-trang', 'lau-mau', 'lau-ban', 'lau-khi-nao-lay', 'lau-ngay-mai-lay', 'lau-giat-rieng', 'lau-ao-bi-ban'],
    },
  ],
};

export const barberItems: Item[] = [
  // ── как подстричь
  word('bar-toc', 'tóc', 'волосы'),
  word('bar-cat-toc', 'cắt tóc', 'стричься, стрижка', {
    alt: ['hớt tóc'],
    dialect: { north: 'cắt tóc', south: 'hớt tóc' },
    note: 'На Юге часто говорят hớt tóc. Засчитывается любое.',
  }),
  word('bar-ngan', 'ngắn', 'короткий'),
  word('bar-dai', 'dài', 'длинный'),
  word('bar-hai-ben', 'hai bên', 'по бокам'),
  word('bar-tren', 'trên', 'сверху, на'),
  phrase('bar-muon-cat-toc', 'tôi muốn cắt tóc', 'я хочу подстричься', { alt: ['tôi muốn hớt tóc'] }),
  phrase('bar-cat-ngan', 'cắt ngắn một chút', 'покороче немного'),
  phrase('bar-hai-ben-ngan', 'hai bên cắt ngắn', 'по бокам коротко'),
  phrase('bar-tren-de-dai', 'trên để dài', 'сверху оставьте длинными'),

  // ── мытьё и бритьё
  word('bar-goi-dau', 'gội đầu', 'мыть голову'),
  word('bar-cao', 'cạo', 'брить'),
  word('bar-rau', 'râu', 'борода, усы'),
  word('bar-dung', 'đừng', 'не надо, не (просьба)'),
  word('bar-duoc-roi', 'được rồi', 'хорошо, так нормально'),
  phrase('bar-cao-rau', 'cạo râu', 'побрить бороду'),
  phrase('bar-dung-ngan-qua', 'đừng cắt ngắn quá', 'не слишком коротко'),
  phrase('bar-goi-dau-bao-nhieu', 'gội đầu bao nhiêu tiền', 'сколько стоит помыть голову?'),
];

export const barber: Topic = {
  id: 'barber',
  title: 'Парикмахерская',
  summary: 'Объяснить, как подстричь, и остановить, пока не поздно',
  lessons: [
    {
      id: 'barber-1',
      title: 'Как подстричь',
      items: ['bar-toc', 'bar-cat-toc', 'bar-ngan', 'bar-dai', 'bar-hai-ben', 'bar-tren', 'bar-muon-cat-toc', 'bar-cat-ngan', 'bar-hai-ben-ngan', 'bar-tren-de-dai'],
    },
    {
      id: 'barber-2',
      title: 'Мытьё и бритьё',
      items: ['bar-goi-dau', 'bar-cao', 'bar-rau', 'bar-dung', 'bar-duoc-roi', 'bar-cao-rau', 'bar-dung-ngan-qua', 'bar-goi-dau-bao-nhieu'],
    },
  ],
};
