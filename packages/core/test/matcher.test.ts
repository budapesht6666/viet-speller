/**
 * Тесты матчера.
 *
 * Механика хвоста `interim` проверена журналами Speller на `en-US` (там же
 * настоящий поток `Bow → Bowl`). Вьетнамские случаи пока построены по
 * правилам письма, а не по журналам: журналов vi-VN ещё нет. После замера
 * этапа 0 сюда переезжают настоящие промахи движка — придуманные примеры
 * проверяют представление о том, как ошибается движок, а не то, как он
 * ошибается.
 */

import { describe, expect, it } from 'vitest';
import { collidingWords, compare, findHits, levenshtein, normalize, Utterance } from '../src/matcher.js';

const targets = (...pairs: Array<[string, string[]]>) => pairs.map(([id, words]) => ({ id, words }));
const norm = (s: string) => normalize(s).join(' ');

describe('normalize', () => {
  it('сохраняет вьетнамские буквы и тоны', () => {
    // `[^a-z]` в Speller съедал всё это до пустоты.
    expect(normalize('Xe đạp')).toEqual(['xe', 'đạp']);
    expect(normalize('Cảm ơn anh!')).toEqual(['cảm', 'ơn', 'anh']);
  });

  it('приводит к NFC: буква, собранная из знаков, равна готовой', () => {
    expect(normalize('à')).toEqual(normalize('à'));
  });

  it('превращает цифры в слова — цену движок может вернуть числом', () => {
    expect(normalize('50.000 đồng')).toEqual(['năm', 'mươi', 'nghìn', 'đồng']);
  });
});

describe('levenshtein', () => {
  it('считает вставку, удаление и замену', () => {
    expect(levenshtein('pho', 'pho')).toBe(0);
    expect(levenshtein('pho', 'phoi')).toBe(1);
    expect(levenshtein('ca', 'ba')).toBe(1);
  });
});

describe('compare: два прохода — с тонами и без', () => {
  it('те же буквы и тот же тон', () => {
    expect(compare(norm('cảm ơn'), norm('cảm ơn'))).toEqual({ how: 'exact', tone: 'same' });
  });

  it('те же буквы, другой тон — «почти»', () => {
    expect(compare(norm('cám ơn'), norm('cảm ơn'))).toEqual({ how: 'exact', tone: 'different' });
  });

  it('тон не зависит от того, над какой буквой стоит знак', () => {
    // Старая и новая орфография: движок вправе вернуть любую.
    expect(compare(norm('hoà'), norm('hòa'))).toEqual({ how: 'exact', tone: 'same' });
  });

  it('ответ без знаков вовсе не объявляется «другим тоном»', () => {
    // Иначе подсказка про тон хвалила бы и ругала то, чего в ответе нет.
    expect(compare(norm('cam on'), norm('cảm ơn'))).toEqual({ how: 'folded', tone: 'unknown' });
    expect(compare(norm('ma'), norm('má'))).toEqual({ how: 'exact', tone: 'unknown' });
  });

  it('другая гласная засчитывается только после свёртки', () => {
    expect(compare(norm('mo'), norm('mơ'))?.how).toBe('folded');
  });

  it('короткий слог не прощает опечатку', () => {
    expect(compare(norm('ba'), norm('ca'))).toBeNull();
  });

  it('длинная фраза прощает одну ошибку движка', () => {
    expect(compare(norm('bao nhiu tiền'), norm('bao nhiêu tiền'))?.how).toBe('fuzzy');
  });
});

describe('findHits', () => {
  it('находит фразу внутри длинной расшифровки', () => {
    const hits = findHits(normalize('à cảm ơn anh nhé'), targets(['thanks', ['cảm ơn anh']]));
    expect(hits).toHaveLength(1);
    expect(hits[0]).toMatchObject({ id: 'thanks', wordStart: 1, wordEnd: 3, how: 'exact', tone: 'same' });
  });

  it('засчитывает синоним из alt наравне с основным', () => {
    const hits = findHits(normalize('dạ'), targets(['yes', ['vâng', 'dạ']]));
    expect(hits[0]?.id).toBe('yes');
  });

  it('берёт самое точное совпадение, а не первое попавшееся', () => {
    // Окно в одно слово `cảm` совпало бы мягко с чем-нибудь; полная фраза
    // с верным тоном должна победить.
    const hits = findHits(normalize('cảm ơn'), targets(['thanks', ['cám ơn', 'cảm ơn']]));
    expect(hits[0]).toMatchObject({ how: 'exact', tone: 'same' });
  });

  it('две цели не делят одно слово: побеждает более точная', () => {
    // Без тонов `ma` и `má` совпадают с одним и тем же словом. Засчитать оба
    // значило бы похвалить за вариант, которого человек не говорил.
    const hits = findHits(normalize('má'), targets(['ghost', ['ma']], ['mother', ['má']]));
    expect(hits.map((h) => h.id)).toEqual(['mother']);
  });

  it('ловит фразу, которую движок склеил', () => {
    expect(findHits(normalize('xinchào'), targets(['hi', ['xin chào']]))).toHaveLength(1);
  });

  it('не засчитывает одну цель дважды', () => {
    expect(findHits(normalize('phở phở phở'), targets(['pho', ['phở']]))).toHaveLength(1);
  });

  it('фраза из семи слогов помещается в окно', () => {
    const hits = findHits(normalize('cho tôi một cà phê sữa đá'), targets(['coffee', ['cho tôi một cà phê sữa đá']]));
    expect(hits).toHaveLength(1);
  });
});

describe('collidingWords', () => {
  it('ma и má неразличимы без тонов — в один вопрос их не ставить', () => {
    const map = collidingWords(targets(['ghost', ['ma']], ['mother', ['má']], ['tea', ['trà']]));
    expect(map.get('ghost')?.has('mother')).toBe(true);
    expect(map.has('tea')).toBe(false);
  });
});

describe('Utterance: растущий хвост interim', () => {
  function play(stream: string[], active: Array<{ id: string; words: string[] }>) {
    const utterance = new Utterance();
    const seen: string[] = [];
    for (const transcript of stream) {
      const { words, positions } = utterance.pending(0, transcript);
      const hits = findHits(
        words,
        active.filter((t) => !seen.includes(t.id)),
      );
      for (const hit of hits) {
        seen.push(hit.id);
        utterance.consume(positions.slice(hit.wordStart, hit.wordEnd + 1));
      }
    }
    return seen;
  }

  it('засчитывает слово, которое движок дописал позже', () => {
    // Тот же сценарий, что `Bow → Bowl` в журнале Speller: первое событие
    // ещё не совпадает ни с чем.
    const seen = play(
      ['ph', 'ph trà', 'phở trà'],
      targets(['pho', ['phở']], ['tea', ['trà']]),
    );
    expect(seen.sort()).toEqual(['pho', 'tea']);
  });

  it('не засчитывает одну цель дважды при дописывании хвоста', () => {
    const seen = play(['phở', 'phở trà', 'phở trà gà'], targets(['pho', ['phở']], ['tea', ['trà']], ['chicken', ['gà']]));
    expect(new Set(seen).size).toBe(seen.length);
    expect(seen).toHaveLength(3);
  });

  it('не даёт закрытому слову засчитаться заново', () => {
    const utterance = new Utterance();
    const pho = targets(['pho', ['phở']]);
    const first = utterance.pending(0, 'phở');
    const hits = findHits(first.words, pho);
    utterance.consume(first.positions.slice(hits[0]!.wordStart, hits[0]!.wordEnd + 1));
    expect(findHits(utterance.pending(0, 'phở').words, pho)).toEqual([]);
  });

  it('начинает заново на новой пачке и после обрыва сессии', () => {
    const utterance = new Utterance();
    utterance.consume(utterance.pending(0, 'phở').positions);
    expect(utterance.pending(1, 'phở').words).toEqual(['phở']);
    utterance.consume(utterance.pending(1, 'phở').positions);
    utterance.reset();
    expect(utterance.pending(1, 'phở').words).toEqual(['phở']);
  });
});
