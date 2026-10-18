import { describe, expect, it } from 'vitest';
import { findHits, normalize } from '../src/matcher.js';
import { digitsToWords, spellNumber } from '../src/numbers.js';

const norm = (s: string) => normalize(s).join(' ');

describe('числа словами', () => {
  it.each([
    [0, 'không'],
    [10, 'mười'],
    [15, 'mười lăm'],
    [21, 'hai mươi mốt'],
    [25, 'hai mươi lăm'],
    [101, 'một trăm lẻ một'],
    [50000, 'năm mươi nghìn'],
    [1000000, 'một triệu'],
  ])('%i → %s', (n, words) => {
    expect(spellNumber(n)).toBe(words);
  });

  it('понимает разделители тысяч', () => {
    expect(norm('50.000')).toBe('năm mươi nghìn');
    expect(norm('50,000')).toBe('năm mươi nghìn');
    expect(norm('1 000 000')).toBe('một triệu');
  });

  it('понимает k с ценника', () => {
    expect(norm('50k')).toBe('năm mươi nghìn');
    expect(norm('200 K')).toBe('hai trăm nghìn');
  });

  it('не трогает текст без цифр', () => {
    expect(digitsToWords('bao nhiêu tiền')).toBe('bao nhiêu tiền');
  });
});

describe('цена цифрами засчитывается за цену словами', () => {
  it('50.000 = năm mươi nghìn', () => {
    const hits = findHits(normalize('50.000 đồng'), [{ id: 'price', words: ['năm mươi nghìn'] }]);
    expect(hits[0]).toMatchObject({ id: 'price', how: 'exact', tone: 'same' });
  });
});
