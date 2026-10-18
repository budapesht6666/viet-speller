/**
 * Тоны вьетнамского слога.
 *
 * Тон — это один из пяти надстрочных или подстрочных знаков (шестой тон,
 * ровный, знака не имеет). Бреве, циркумфлекс и рожок (`ă â ê ô ơ ư`) — часть
 * самой буквы, а не тон: `ăn` и `ân` — разные слоги с одним тоном.
 *
 * Разбор идёт по слогу, а не по позиции знака. `hoà` и `hòa` — одно слово в
 * старой и новой орфографии, и движок распознавания вправе вернуть любое.
 */

export type Tone = 'ngang' | 'sac' | 'huyen' | 'hoi' | 'nga' | 'nang';

/** Знаки тона в NFD. */
const TONE_MARKS: Record<string, Tone> = {
  '́': 'sac',
  '̀': 'huyen',
  '̉': 'hoi',
  '̃': 'nga',
  '̣': 'nang',
};

export interface Syllable {
  /** Слог без знака тона, но с буквами `ă â ê ô ơ ư đ`. NFC. */
  base: string;
  tone: Tone;
}

export function syllable(word: string): Syllable {
  let tone: Tone = 'ngang';
  let base = '';
  for (const ch of word.normalize('NFD')) {
    const t = TONE_MARKS[ch];
    if (t) tone = t;
    else base += ch;
  }
  return { base: base.normalize('NFC'), tone };
}

/** Слово без тона, но с вьетнамскими буквами. */
export function stripTone(word: string): string {
  return syllable(word).base;
}

/**
 * Полная свёртка: без тонов и без надстрочных знаков букв, `đ` → `d`.
 *
 * `đ` не раскладывается по NFD — это отдельная буква, а не `d` со знаком,
 * поэтому её приходится заменять руками.
 */
export function fold(word: string): string {
  return word
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}
