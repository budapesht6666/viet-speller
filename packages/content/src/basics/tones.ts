/**
 * Тоны.
 *
 * Шесть тонов на одном слоге — классический набор `ma`, потом пары частых
 * слов, которые различаются только тоном. Варианты в вопросе здесь нарочно
 * похожи (`toneDrill`), а голосом тон не проверяем: замер не ответил, пишет
 * ли движок тон честно (PLAN.md, этап 0). Тон учится по образцу, на слух.
 */

import type { Item, Topic } from '@viet/core';
import { word } from '../define.js';

const HOI_NGA = 'На Юге и в Центре ngã произносят так же, как hỏi.';

export const toneItems: Item[] = [
  word('tone-ma', 'ma', 'призрак', { note: 'Ровный тон (ngang): голос не поднимается и не падает. Знака нет.' }),
  word('tone-ma-sac', 'má', 'щека; мама (на Юге)', { note: 'Восходящий (sắc): голос идёт вверх.' }),
  word('tone-ma-huyen', 'mà', 'но, а', { note: 'Нисходящий (huyền): низко и плавно вниз.' }),
  word('tone-ma-hoi', 'mả', 'могила', { note: `Вопросительный (hỏi): голос опускается и снова поднимается. ${HOI_NGA}` }),
  word('tone-ma-nga', 'mã', 'код (mã số); лошадь — в составе слов', {
    note: `С надломом (ngã): голос поднимается с заломом посередине. ${HOI_NGA}`,
  }),
  word('tone-ma-nang', 'mạ', 'рисовая рассада', { note: 'Тяжёлый (nặng): коротко, низко, обрывается вниз.' }),

  word('tone-ban-table', 'bàn', 'стол'),
  word('tone-ban-sell', 'bán', 'продавать'),
  word('tone-ban-friend', 'bạn', 'друг; ты (ровеснику)'),
  word('tone-mua-season', 'mùa', 'сезон, время года', { note: 'mua — покупать, mùa — сезон: отличает только тон.' }),
  word('tone-mua-dance', 'múa', 'танцевать'),
  word('tone-ca-fish', 'cá', 'рыба'),
  word('tone-ca-eggplant', 'cà', 'баклажан'),
];

export const tones: Topic = {
  id: 'tones',
  title: 'Тоны',
  summary: 'Шесть тонов и слова, которые различает только тон',
  lessons: [
    {
      id: 'tones-1',
      title: 'Шесть тонов на ma',
      items: ['tone-ma', 'tone-ma-sac', 'tone-ma-huyen', 'tone-ma-hoi', 'tone-ma-nga', 'tone-ma-nang'],
      toneDrill: true,
      listenOnly: true,
    },
    {
      id: 'tones-2',
      title: 'Один слог — разные слова',
      items: ['tone-ban-table', 'tone-ban-sell', 'tone-ban-friend', 'tone-mua-season', 'tone-mua-dance', 'tone-ca-fish', 'tone-ca-eggplant'],
      toneDrill: true,
      listenOnly: true,
    },
  ],
};
