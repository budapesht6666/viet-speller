/**
 * Числа словами.
 *
 * Распознавание может вернуть цену цифрами (`50.000`, `50000`, `50k`), а
 * может словами (`năm mươi nghìn`). Замер этапа 0 не ответил, как именно,
 * поэтому матчер принимает оба: цифры перед сравнением превращаются в слова.
 *
 * Слова — из `read-vietnamese-number` с настройками по умолчанию: `nghìn`,
 * `lẻ`, `tư` после десятков (`hai mươi tư`). Варианты выговора (`ngàn`,
 * `linh`, `hai mươi bốn`) живут в `alt` элементов контента, а не здесь:
 * какие из них засчитывать — решение контента.
 */

import { doReadNumber, ReadingConfig } from 'read-vietnamese-number';

const config = new ReadingConfig();
config.unit = [];

/** 50000 → «năm mươi nghìn». */
export function spellNumber(n: number | bigint | string): string {
  return doReadNumber(String(n), config);
}

/**
 * Число в записи: группы по три через точку, запятую или пробел (`50.000`,
 * `1 000 000`) или сплошные цифры. Суффикс `k` — тысячи: так пишут цены на
 * ценниках и в чатах (`50k`).
 */
const NUMBER = /(\d{1,3}(?:[.,  ]\d{3})+|\d+)(\s?[kK]\b)?/g;

/** Заменяет числа в тексте на слова: «giá 50.000» → «giá năm mươi nghìn». */
export function digitsToWords(text: string): string {
  return text.replace(NUMBER, (_, digits: string, k: string | undefined) => {
    let value = BigInt(digits.replace(/[.,  ]/g, ''));
    if (k) value *= 1000n;
    return ` ${spellNumber(value)} `;
  });
}
