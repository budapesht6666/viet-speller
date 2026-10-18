import { describe, expect, it } from 'vitest';
import { fold, stripTone, syllable } from '../src/tone.js';

describe('тон слога', () => {
  it('различает все шесть тонов на ma', () => {
    expect(['ma', 'má', 'mà', 'mả', 'mã', 'mạ'].map((w) => syllable(w).tone)).toEqual([
      'ngang',
      'sac',
      'huyen',
      'hoi',
      'nga',
      'nang',
    ]);
  });

  it('бреве, циркумфлекс и рожок — часть буквы, а не тон', () => {
    expect(syllable('ăn')).toEqual({ base: 'ăn', tone: 'ngang' });
    expect(syllable('ấy')).toEqual({ base: 'ây', tone: 'sac' });
    expect(syllable('ượt')).toEqual({ base: 'ươt', tone: 'nang' });
  });

  it('не зависит от позиции знака', () => {
    expect(syllable('hoà')).toEqual(syllable('hòa'));
  });

  it('stripTone оставляет вьетнамские буквы', () => {
    expect(stripTone('đường')).toBe('đương');
  });
});

describe('полная свёртка', () => {
  it('снимает все знаки и заменяет đ', () => {
    // đ не раскладывается по NFD — без отдельной замены она пережила бы свёртку.
    expect(fold('Đà Nẵng')).toBe('Da Nang');
    expect(fold('phở')).toBe('pho');
  });
});
