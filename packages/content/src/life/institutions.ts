/** Учреждения: врач и аптека, банк и документы. */

import type { Item, Topic } from '@viet/core';
import { phrase, word } from '../define.js';

export const doctorItems: Item[] = [
  // ── что болит
  word('doc-bac-si', 'bác sĩ', 'врач'),
  word('doc-dau', 'đau', 'болеть; боль'),
  word('doc-head', 'đầu', 'голова'),
  word('doc-bung', 'bụng', 'живот'),
  word('doc-tooth', 'răng', 'зуб', { note: 'В Центре răng — ещё и «почему»: răng rứa? — почему так?' }),
  word('doc-sot', 'sốt', 'температура, жар'),
  phrase('doc-bi-sot', 'tôi bị sốt', 'у меня температура'),
  phrase('doc-dau-dau', 'tôi đau đầu', 'у меня болит голова'),
  phrase('doc-dau-bung', 'tôi đau bụng', 'у меня болит живот'),
  phrase('doc-dau-rang', 'đau răng', 'болит зуб'),

  // ── аптека и запись
  word('doc-thuoc', 'thuốc', 'лекарство'),
  word('doc-nha-thuoc', 'nhà thuốc', 'аптека'),
  word('doc-dat-lich', 'đặt lịch', 'записаться (на время)'),
  word('doc-kham', 'khám', 'осмотреть (о враче)'),
  word('doc-uong', 'uống', 'пить; принимать (лекарство)'),
  word('doc-lan', 'lần', 'раз'),
  phrase('doc-dat-lich-kham', 'tôi muốn đặt lịch khám', 'я хочу записаться на приём'),
  phrase('doc-uong-thuoc', 'uống thuốc', 'принимать лекарство'),
  phrase('doc-may-lan', 'một ngày mấy lần', 'сколько раз в день?'),
];

export const bankItems: Item[] = [
  // ── деньги
  word('bank-ngan-hang', 'ngân hàng', 'банк'),
  word('bank-tai-khoan', 'tài khoản', 'счёт (в банке)'),
  word('bank-chuyen-khoan', 'chuyển khoản', 'перевод на счёт', { note: 'Так платят почти везде — по QR-коду на кассе.' }),
  word('bank-the', 'thẻ', 'карта'),
  word('bank-tien-mat', 'tiền mặt', 'наличные'),
  word('bank-rut-tien', 'rút tiền', 'снять деньги'),
  word('bank-tra', 'trả', 'платить'),
  word('bank-duoc-khong', 'được không', 'можно?', { note: 'Ставят в конце просьбы: chuyển khoản được không? — можно переводом?' }),
  phrase('bank-ck-duoc-khong', 'chuyển khoản được không', 'можно переводом?'),
  phrase('bank-muon-rut', 'tôi muốn rút tiền', 'я хочу снять деньги'),
  phrase('bank-tra-tien-mat', 'tôi trả tiền mặt', 'я заплачу наличными'),

  // ── документы
  word('bank-ho-chieu', 'hộ chiếu', 'паспорт'),
  word('bank-tam-tru', 'tạm trú', 'временная регистрация'),
  word('bank-cong-an', 'công an', 'полиция'),
  word('bank-dang-ky', 'đăng ký', 'регистрировать, записывать'),
  phrase('bank-dang-ky-tam-tru', 'đăng ký tạm trú', 'встать на временную регистрацию'),
];

export const doctor: Topic = {
  id: 'doctor',
  title: 'Врач и аптека',
  summary: 'Что болит, температура, записаться, как пить лекарство',
  lessons: [
    {
      id: 'doctor-1',
      title: 'Что болит',
      items: ['doc-bac-si', 'doc-dau', 'doc-head', 'doc-bung', 'doc-tooth', 'doc-sot', 'doc-bi-sot', 'doc-dau-dau', 'doc-dau-bung', 'doc-dau-rang'],
    },
    {
      id: 'doctor-2',
      title: 'Аптека и запись',
      items: ['doc-thuoc', 'doc-nha-thuoc', 'doc-dat-lich', 'doc-kham', 'doc-uong', 'doc-lan', 'doc-dat-lich-kham', 'doc-uong-thuoc', 'doc-may-lan'],
    },
  ],
};

export const bank: Topic = {
  id: 'bank',
  title: 'Банк и документы',
  summary: 'Перевод, наличные, паспорт, регистрация',
  lessons: [
    {
      id: 'bank-1',
      title: 'Деньги и перевод',
      items: [
        'bank-ngan-hang',
        'bank-tai-khoan',
        'bank-chuyen-khoan',
        'bank-the',
        'bank-tien-mat',
        'bank-rut-tien',
        'bank-tra',
        'bank-duoc-khong',
        'bank-ck-duoc-khong',
        'bank-muon-rut',
        'bank-tra-tien-mat',
      ],
    },
    { id: 'bank-2', title: 'Документы', items: ['bank-ho-chieu', 'bank-tam-tru', 'bank-cong-an', 'bank-dang-ky', 'bank-dang-ky-tam-tru'] },
  ],
};
