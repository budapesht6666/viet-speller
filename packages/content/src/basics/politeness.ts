/**
 * Вежливость и обращения.
 *
 * Во вьетнамском нет нейтрального «вы»: к человеку обращаются как к
 * родственнику — по возрасту относительно себя. Без обращения фраза звучит
 * грубо, поэтому обращения идут раньше «спасибо».
 */

import type { Item, Topic } from '@viet/core';
import { phrase, word } from '../define.js';

export const politenessItems: Item[] = [
  // ── приветствие и обращения
  word('pol-chao', 'chào', 'здравствуй; привет', { note: 'С обращением — вежливо: chào anh, chào chị.' }),
  word('pol-anh', 'anh', 'вы — мужчине чуть старше себя', { note: 'Дословно «старший брат». Так же обращаются к водителю, мастеру.' }),
  word('pol-chi', 'chị', 'вы — женщине чуть старше себя', { note: 'Дословно «старшая сестра». Так обращаются к продавщице, администратору.' }),
  word('pol-em', 'em', 'ты — тому, кто младше', { note: 'Так зовут официанта или продавца младше вас.' }),
  word('pol-co', 'cô', 'вы — женщине возраста родителей', { note: 'Ещё так обращаются к учительнице.' }),
  word('pol-chu', 'chú', 'вы — мужчине возраста родителей'),
  phrase('pol-xin-chao', 'xin chào', 'здравствуйте', { note: 'Нейтрально, без обращения. В жизни чаще говорят chào + обращение.' }),
  phrase('pol-chao-anh', 'chào anh', 'здравствуйте (мужчине)'),
  phrase('pol-chao-chi', 'chào chị', 'здравствуйте (женщине)'),

  // ── спасибо, извините
  word('pol-cam-on', 'cảm ơn', 'спасибо'),
  word('pol-xin-loi', 'xin lỗi', 'извините'),
  word('pol-gi', 'gì', 'что'),
  word('pol-tam-biet', 'tạm biệt', 'до свидания'),
  phrase('pol-cam-on-anh', 'cảm ơn anh', 'спасибо (мужчине)'),
  phrase('pol-cam-on-chi', 'cảm ơn chị', 'спасибо (женщине)'),
  phrase('pol-cam-on-em', 'cảm ơn em', 'спасибо (младшему)'),
  phrase('pol-khong-co-gi', 'không có gì', 'не за что', { note: 'Дословно «нет ничего».' }),

  // ── если не понимаю
  word('pol-hieu', 'hiểu', 'понимать'),
  word('pol-noi', 'nói', 'говорить'),
  word('pol-cham', 'chậm', 'медленно'),
  word('pol-mot-chut', 'một chút', 'немного'),
  word('pol-la', 'là', 'быть, являться', { note: 'Связка: tôi là… — я…' }),
  word('pol-nguoi', 'người', 'человек'),
  word('pol-nga', 'Nga', 'Россия'),
  phrase('pol-khong-hieu', 'tôi không hiểu', 'я не понимаю'),
  phrase('pol-noi-cham', 'anh nói chậm một chút', 'говорите помедленнее (мужчине)'),
  phrase('pol-nguoi-nga', 'tôi là người Nga', 'я из России', { note: 'Дословно «я — русский человек».' }),
];

export const politeness: Topic = {
  id: 'politeness',
  title: 'Вежливость и обращения',
  summary: 'Здравствуйте, спасибо — и как обратиться к человеку',
  lessons: [
    {
      id: 'politeness-1',
      title: 'Приветствие и обращения',
      items: ['pol-chao', 'pol-anh', 'pol-chi', 'pol-em', 'pol-co', 'pol-chu', 'pol-xin-chao', 'pol-chao-anh', 'pol-chao-chi'],
    },
    {
      id: 'politeness-2',
      title: 'Спасибо, извините, до свидания',
      items: ['pol-cam-on', 'pol-xin-loi', 'pol-gi', 'pol-tam-biet', 'pol-cam-on-anh', 'pol-cam-on-chi', 'pol-cam-on-em', 'pol-khong-co-gi'],
    },
    {
      id: 'politeness-3',
      title: 'Если не понимаю',
      items: ['pol-hieu', 'pol-noi', 'pol-cham', 'pol-mot-chut', 'pol-la', 'pol-nguoi', 'pol-nga', 'pol-khong-hieu', 'pol-noi-cham', 'pol-nguoi-nga'],
    },
  ],
};
