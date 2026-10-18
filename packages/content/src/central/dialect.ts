/**
 * Говор Центра — только на понимание (CLAUDE.md, «Контент»; PLAN.md, тема F).
 *
 * Соседи в Дананге и Хойане говорят mô, tê, răng, rứa. Голоса с центральным
 * выговором нет ни у одного сервиса, а учить произносить без образца
 * нельзя. Поэтому уроки только на слух: узнать слово и понять, что оно
 * значит. Озвучка — стандартным голосом: само слово, а не выговор.
 */

import type { Item, Topic } from '@viet/core';
import { phrase, word } from '../define.js';

export const centralItems: Item[] = [
  word('mid-mo', 'mô', 'где (в Центре)', { alt: ['đâu'], dialect: { center: 'mô', north: 'đâu', south: 'đâu' }, note: 'Стандартно — đâu.' }),
  word('mid-te', 'tê', 'там, тот (в Центре)', { alt: ['kia'], dialect: { center: 'tê', north: 'kia', south: 'kia' }, note: 'Стандартно — kia.' }),
  word('mid-rang', 'răng', 'почему; как (в Центре)', { alt: ['sao'], dialect: { center: 'răng', north: 'sao', south: 'sao' }, note: 'Стандартно — sao.' }),
  word('mid-rua', 'rứa', 'так (в Центре)', { alt: ['thế', 'vậy'], dialect: { center: 'rứa', north: 'thế', south: 'vậy' }, note: 'Стандартно — thế (Север) или vậy (Юг).' }),
  word('mid-ni', 'ni', 'этот (в Центре)', { alt: ['này'], dialect: { center: 'ni', north: 'này', south: 'này' }, note: 'Стандартно — này.' }),
  word('mid-chi', 'chi', 'что (в Центре)', { alt: ['gì'], dialect: { center: 'chi', north: 'gì', south: 'gì' }, note: 'Стандартно — gì.' }),
  phrase('mid-di-mo', 'đi mô', 'куда идёшь?', { note: 'Так здороваются в Центре — ответа подробного не ждут.' }),
  phrase('mid-rang-rua', 'răng rứa', 'почему так?'),
  phrase('mid-cai-chi', 'cái chi', 'что это?'),
];

export const central: Topic = {
  id: 'central',
  title: 'Говор Центра',
  summary: 'Понимать соседей в Дананге и Хойане — на слух',
  lessons: [
    {
      id: 'central-1',
      title: 'mô, tê, răng, rứa, ni, chi',
      items: ['mid-mo', 'mid-te', 'mid-rang', 'mid-rua', 'mid-ni', 'mid-chi', 'mid-di-mo', 'mid-rang-rua', 'mid-cai-chi'],
      listenOnly: true,
    },
  ],
};
