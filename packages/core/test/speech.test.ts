import { describe, expect, it } from 'vitest';
import type { Item } from '../src/content.js';
import { classifyAttempt, speechEngine, speechReport, SPEECH_THRESHOLDS, syllableVerdict, toneVerdict, type SpeechAttempt } from '../src/speech.js';

const item = (id: string, vi: string, alt?: string[]): Item => ({ id, vi, ru: '—', kind: 'word', ...(alt ? { alt } : {}) });
const ca = item('ca', 'cá');
const camOn = item('cam-on', 'cảm ơn');
const items = new Map([ca, camOn].map((i) => [i.id, i]));
const lookup = (id: string) => items.get(id);

let n = 0;
const attempt = (itemId: string, heard: string, engine: SpeechAttempt['engine'] = 'apple'): SpeechAttempt => ({
  id: `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`,
  at: new Date(Date.UTC(2026, 9, 19, 0, 0, n)).toISOString(),
  itemId,
  heard,
  engine,
});
const times = (k: number, make: () => SpeechAttempt) => Array.from({ length: k }, make);

describe('speechEngine', () => {
  it('iPhone в любом браузере — Apple', () => {
    expect(speechEngine('Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 Version/27.0 Mobile/15E148 Safari/604.1')).toBe('apple');
    expect(speechEngine('Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 CriOS/141.0 Mobile/15E148 Safari/604.1')).toBe('apple');
  });

  it('iPad, который называет себя Macintosh, — по касаниям', () => {
    const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/27.0 Safari/605.1.15';
    expect(speechEngine(ua, 5)).toBe('apple');
    expect(speechEngine(ua, 0)).toBe('apple');
  });

  it('Android и Chrome на компьютере — Google', () => {
    expect(speechEngine('Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 Chrome/141.0 Mobile Safari/537.36')).toBe('google');
    expect(speechEngine('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/141.0 Safari/537.36')).toBe('google');
  });

  it('остальное — other', () => {
    expect(speechEngine('Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0')).toBe('other');
  });
});

describe('classifyAttempt', () => {
  it('буквы и тон совпали', () => {
    expect(classifyAttempt(ca, 'cá')).toEqual({ syllables: 1, letters: 'exact', tone: 'same' });
  });

  it('буквы те же, тон другой — то, ради чего журнал', () => {
    expect(classifyAttempt(ca, 'cà')).toEqual({ syllables: 1, letters: 'exact', tone: 'different' });
    expect(classifyAttempt(camOn, 'cám ơn')).toEqual({ syllables: 2, letters: 'exact', tone: 'different' });
  });

  it('движок без знаков — тон не сравнить', () => {
    expect(classifyAttempt(camOn, 'cam on')).toMatchObject({ letters: 'folded', tone: null });
  });

  it('слово внутри фразы находится, лишнее вокруг не мешает', () => {
    expect(classifyAttempt(ca, 'à cá')).toMatchObject({ letters: 'exact', tone: 'same' });
  });

  it('пусто и мимо — не услышано', () => {
    expect(classifyAttempt(ca, '')).toEqual({ syllables: 1, letters: 'none', tone: null });
    expect(classifyAttempt(camOn, 'xin chào')).toEqual({ syllables: 2, letters: 'none', tone: null });
  });

  it('alt засчитывается наравне', () => {
    const vang = item('vang', 'vâng', ['dạ']);
    expect(classifyAttempt(vang, 'dạ')).toMatchObject({ letters: 'exact', tone: 'same' });
  });
});

describe('toneVerdict', () => {
  const th = SPEECH_THRESHOLDS;
  it('пока попыток мало — собираем, какой бы ни была доля', () => {
    expect(toneVerdict(th.toneMin - 1, th.toneMin - 1)).toBe('collecting');
    expect(toneVerdict(0, 0)).toBe('collecting');
  });

  it('границы порогов', () => {
    expect(toneVerdict(100, 5)).toBe('writes');
    expect(toneVerdict(100, 4)).toBe('unclear');
    expect(toneVerdict(100, 2)).toBe('unclear');
    expect(toneVerdict(100, 1)).toBe('corrects');
    expect(toneVerdict(100, 0)).toBe('corrects');
  });
});

describe('syllableVerdict', () => {
  const g = (attempts: number, heard: number) => ({ attempts, heard });
  it('мало попыток в любой из групп — собираем', () => {
    expect(syllableVerdict(g(39, 39), g(100, 100))).toBe('collecting');
    expect(syllableVerdict(g(100, 100), g(39, 39))).toBe('collecting');
  });

  it('слог слышен почти как фраза — слышит', () => {
    expect(syllableVerdict(g(50, 40), g(50, 45))).toBe('recognized');
  });

  it('слог сильно отстаёт или слышен редко — плохо', () => {
    expect(syllableVerdict(g(50, 15), g(50, 45))).toBe('poor');
    expect(syllableVerdict(g(50, 19), g(50, 20))).toBe('poor');
  });

  it('между порогами — неясно', () => {
    expect(syllableVerdict(g(50, 28), g(50, 40))).toBe('unclear');
  });
});

describe('speechReport', () => {
  it('движки считаются врозь, пустые не показываются', () => {
    const r = speechReport([attempt('ca', 'cá'), attempt('ca', 'cá', 'google'), attempt('ca', 'cá', 'google')], lookup);
    expect(r.map((e) => [e.engine, e.attempts])).toEqual([
      ['google', 2],
      ['apple', 1],
    ]);
  });

  it('элемент, которого нет в контенте, не считается', () => {
    expect(speechReport([attempt('removed', 'cá')], lookup)).toEqual([]);
  });

  it('тон: сравнимые, отличающиеся, без знаков; примеры — свежие первыми', () => {
    const r = speechReport([attempt('ca', 'cá'), attempt('ca', 'cà'), attempt('cam-on', 'cam on'), attempt('cam-on', 'cám ơn'), attempt('ca', '')], lookup)[0]!;
    expect(r.tone).toMatchObject({ compared: 3, different: 2, unmarked: 0, verdict: 'collecting' });
    expect(r.tone.examples).toEqual([
      { expected: 'cảm ơn', heard: 'cám ơn' },
      { expected: 'cá', heard: 'cà' },
    ]);
    expect(r.syllables.single).toEqual({ attempts: 3, heard: 2 });
    expect(r.syllables.multi).toEqual({ attempts: 2, heard: 2 });
  });

  it('движок пишет тон как услышал — вердикт writes', () => {
    const data = [...times(90, () => attempt('ca', 'cá')), ...times(10, () => attempt('ca', 'cà'))];
    expect(speechReport(data, lookup)[0]!.tone.verdict).toBe('writes');
  });

  it('движок подправляет тон — вердикт corrects', () => {
    const data = [...times(100, () => attempt('ca', 'cá')), attempt('ca', 'cà')];
    expect(speechReport(data, lookup)[0]!.tone.verdict).toBe('corrects');
  });

  it('текст без знаков не засчитывается ни в одну сторону', () => {
    const data = times(200, () => attempt('cam-on', 'cam on'));
    const r = speechReport(data, lookup)[0]!;
    expect(r.tone).toMatchObject({ compared: 0, unmarked: 0, verdict: 'collecting' });
  });

  it('одиночный слог против фраз', () => {
    const data = [...times(45, () => attempt('ca', 'cá')), ...times(5, () => attempt('ca', ''))];
    data.push(...times(50, () => attempt('cam-on', 'cảm ơn')));
    expect(speechReport(data, lookup)[0]!.syllables.verdict).toBe('recognized');
  });
});
