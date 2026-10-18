/**
 * Вердикт пробы: что движок вернул по сравнению с тем, что было сказано.
 *
 * Чистый модуль: его импортирует страница пробы, и он же гоняется в Node
 * (`node research/vi-probe-verdict.test.mjs`) — на телефоне ошибку в разборе
 * тонов не отличить от ошибки движка.
 *
 * Тон сравнивается по слогу, а не по позиции знака: `hoà` и `hòa` — одно и
 * то же слово в старой и новой орфографии, и движок вправе вернуть любое.
 */

/** Знаки тона в NFD. Бреве, циркумфлекс и рожок — часть буквы, не тон. */
const TONE_MARKS = {
  '́': 1, // sắc
  '̀': 2, // huyền
  '̉': 3, // hỏi
  '̃': 4, // ngã
  '̣': 5, // nặng
};
export const TONE_NAMES = ['ngang', 'sắc', 'huyền', 'hỏi', 'ngã', 'nặng'];

/** Слова в нижнем регистре, NFC, без пунктуации. Цифры остаются. */
export function words(text) {
  return text
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/** Слог → основа без тона и номер тона. */
export function syllable(word) {
  let tone = 0;
  const base = [...word.normalize('NFD')]
    .filter((ch) => {
      const t = TONE_MARKS[ch];
      if (t === undefined) return true;
      tone = t;
      return false;
    })
    .join('')
    .normalize('NFC');
  return { base, tone };
}

/** Полная свёртка, как в профиле `vi` матчера: без тонов и без надстрочных знаков. */
export function fold(word) {
  return word
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd');
}

export function hasDiacritics(text) {
  return /[̀-ͯ]/.test(text.normalize('NFD')) || /đ/i.test(text);
}

export function hasDigits(text) {
  return /\d/.test(text);
}

/**
 * Насколько близко ожидаемая последовательность слогов встречается в
 * услышанном: `exact` → `tone` (буквы те же, тон другой) → `fold` (совпало
 * только после полной свёртки) → `none`. Ищется лучшее окно.
 */
export function compareSequence(heard, expected) {
  const n = expected.length;
  if (!n || heard.length < n) return { level: 'none' };
  const want = expected.map(syllable);
  let best = { level: 'none' };
  const rank = { exact: 3, tone: 2, fold: 1, none: 0 };

  for (let i = 0; i + n <= heard.length; i++) {
    const got = heard.slice(i, i + n).map(syllable);
    let level = 'exact';
    const toneDiffs = [];
    for (let k = 0; k < n; k++) {
      const a = got[k];
      const b = want[k];
      if (a.base === b.base) {
        if (a.tone !== b.tone) {
          toneDiffs.push({ at: k, heard: TONE_NAMES[a.tone], said: TONE_NAMES[b.tone] });
          if (level === 'exact') level = 'tone';
        }
      } else if (fold(a.base) === fold(b.base)) {
        level = 'fold';
      } else {
        level = 'none';
        break;
      }
    }
    if (rank[level] > rank[best.level]) {
      best = level === 'tone' ? { level, toneDiffs, at: i } : { level, at: i };
      if (level === 'exact') break;
    }
  }
  return best;
}

/**
 * Итог по заданию.
 *
 * Для `wrongTone` важна не близость к сказанному, а чья версия победила:
 * записал ли движок неверный тон как есть или подставил слово, которое
 * «должно было» прозвучать. Только в первом случае подсказка «тон другой»
 * в приложении будет честной.
 */
export function verdict(prompt, heardText) {
  const heard = words(heardText);
  const said = compareSequence(heard, words(prompt.text));
  const result = {
    said: said.level,
    toneDiffs: said.toneDiffs ?? [],
    digits: hasDigits(heardText),
    diacritics: hasDiacritics(heardText),
    empty: heard.length === 0,
  };
  if (prompt.corrected) {
    result.corrected = compareSequence(heard, words(prompt.corrected)).level;
  }
  return result;
}

/** Короткая подпись для человека. */
export function verdictLabel(prompt, v) {
  if (v.empty) return 'ничего не пришло';
  if (prompt.group === 'number' && v.digits) return 'цифрами';
  if (prompt.corrected) {
    if (v.said === 'exact') return 'записал как сказано';
    if (v.corrected === 'exact') return 'исправил по смыслу';
  }
  switch (v.said) {
    case 'exact':
      return 'совпало с тонами';
    case 'tone':
      return `тон другой: ${v.toneDiffs.map((d) => `${d.said} → ${d.heard}`).join(', ')}`;
    case 'fold':
      return 'совпало только без знаков';
    default:
      return 'не совпало';
  }
}
