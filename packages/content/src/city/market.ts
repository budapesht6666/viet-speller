/** Рынок: фрукты, вес, свежее ли, торг, морепродукты. */

import type { Item, Topic } from '@viet/core';
import { phrase, word } from '../define.js';

export const marketItems: Item[] = [
  // ── фрукты
  word('market-trai-cay', 'trái cây', 'фрукты', {
    alt: ['hoa quả'],
    dialect: { north: 'hoa quả', south: 'trái cây' },
    note: 'На Севере фрукты — hoa quả. Засчитывается любое.',
  }),
  word('market-xoai', 'xoài', 'манго'),
  word('market-chuoi', 'chuối', 'банан'),
  word('market-dua', 'dứa', 'ананас', { alt: ['thơm'], dialect: { north: 'dứa', south: 'thơm' }, note: 'На Юге ананас — thơm. Засчитывается любое.' }),
  word('market-dua-hau', 'dưa hấu', 'арбуз'),
  word('market-sau-rieng', 'sầu riêng', 'дуриан'),
  word('market-thanh-long', 'thanh long', 'питахайя'),

  // ── сколько и почём
  word('market-ky', 'ký', 'килограмм', {
    alt: ['cân'],
    dialect: { north: 'cân', south: 'ký' },
    note: 'На Севере килограмм — cân. Засчитывается любое.',
  }),
  word('market-nua', 'nửa', 'половина'),
  word('market-cai-nay', 'cái này', 'вот это'),
  word('market-tuoi', 'tươi', 'свежий'),
  word('market-bot', 'bớt', 'сбавить, уступить'),
  phrase('market-mot-ky', 'một ký', 'один килограмм', { alt: ['một cân'] }),
  phrase('market-nua-ky', 'nửa ký', 'полкило', { alt: ['nửa cân'] }),
  phrase('market-co-tuoi', 'có tươi không', 'свежее?', { note: 'Có … không — так строится вопрос «да или нет».' }),
  phrase('market-bot-di', 'bớt đi', 'уступите', { note: 'Так торгуются. Đi здесь — побуждение: «ну же».' }),
  phrase('market-order', 'cho tôi một ký xoài', 'дайте килограмм манго', { alt: ['cho tôi một cân xoài'] }),

  // ── морепродукты
  word('market-hai-san', 'hải sản', 'морепродукты'),
  word('market-tom', 'tôm', 'креветки'),
  word('market-muc', 'mực', 'кальмар'),
  word('market-cua', 'cua', 'краб'),
  word('market-oc', 'ốc', 'улитки, ракушки'),
  phrase('market-hai-san-tuoi', 'hải sản tươi', 'свежие морепродукты'),
];

export const market: Topic = {
  id: 'market',
  title: 'Рынок',
  summary: 'Фрукты, вес, торг и морепродукты',
  lessons: [
    {
      id: 'market-1',
      title: 'Фрукты',
      items: ['market-trai-cay', 'market-xoai', 'market-chuoi', 'market-dua', 'market-dua-hau', 'market-sau-rieng', 'market-thanh-long'],
    },
    {
      id: 'market-2',
      title: 'Сколько и почём',
      items: ['market-ky', 'market-nua', 'market-cai-nay', 'market-tuoi', 'market-bot', 'market-mot-ky', 'market-nua-ky', 'market-co-tuoi', 'market-bot-di', 'market-order'],
    },
    {
      id: 'market-3',
      title: 'Рыба и морепродукты',
      items: ['market-hai-san', 'market-tom', 'market-muc', 'market-cua', 'market-oc', 'market-hai-san-tuoi'],
    },
  ],
};
