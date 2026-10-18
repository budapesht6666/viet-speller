import { describe, expect, it } from 'vitest';
import type { Item, Lesson } from '../src/content.js';
import {
  accuracy,
  buildLesson,
  currentStep,
  judgeSpeech,
  lessonGrades,
  needsMic,
  reduce,
  seeded,
  SPEECH_ATTEMPTS,
  startLesson,
  type LessonContext,
  type LessonState,
} from '../src/lesson.js';

const items: Item[] = [
  { id: 'ma', vi: 'ma', ru: 'призрак', kind: 'word' },
  { id: 'ma-sac', vi: 'má', ru: 'щека', kind: 'word' },
  { id: 'tra', vi: 'trà', ru: 'чай', kind: 'word' },
  { id: 'pho', vi: 'phở', ru: 'фо', kind: 'word' },
  { id: 'ga', vi: 'gà', ru: 'курица', kind: 'word' },
  { id: 'cam-on', vi: 'cảm ơn', ru: 'спасибо', kind: 'word' },
  { id: 'anh', vi: 'anh', ru: 'ты (мужчине старше)', kind: 'word' },
  { id: 'cam-on-anh', vi: 'cảm ơn anh', ru: 'спасибо (ему)', kind: 'phrase' },
];
const lookup = (id: string) => items.find((i) => i.id === id)!;
const ctx = (over: Partial<LessonContext> = {}): LessonContext => ({ lookup, known: [], mic: true, random: seeded(1), ...over });

const words: Lesson = { id: 'w', title: 'слова', items: ['ma', 'ma-sac', 'tra', 'pho', 'ga'] };
const phrases: Lesson = { id: 'p', title: 'фразы', items: ['cam-on', 'anh', 'cam-on-anh'] };
const toneLesson: Lesson = { id: 't', title: 'тоны', items: ['ma', 'ma-sac'], toneDrill: true, listenOnly: true };

describe('сборка урока', () => {
  it('новое вводится до проверки: каждый элемент сначала звучит', () => {
    const steps = buildLesson(words, ctx());
    for (const id of words.items) {
      const first = steps.findIndex((s) => s.itemId === id);
      expect(['repeat', 'intro']).toContain(steps[first]!.kind);
    }
  });

  it('с микрофоном есть «повтори» и «скажи», без него — ни одного шага с микрофоном', () => {
    expect(buildLesson(phrases, ctx()).some(needsMic)).toBe(true);
    expect(buildLesson(phrases, ctx({ mic: false })).some(needsMic)).toBe(false);
  });

  it('урок «только на слух» без микрофона, даже когда микрофон есть', () => {
    expect(buildLesson(toneLesson, ctx()).some(needsMic)).toBe(false);
  });

  it('варианты содержат правильный ответ и не больше четырёх', () => {
    for (const step of buildLesson(words, ctx()).filter((s) => s.options)) {
      expect(step.options!.map((o) => o.itemId)).toContain(step.itemId);
      expect(step.options!.length).toBeLessThanOrEqual(4);
    }
  });

  it('ma и má не стоят в одном вопросе вне тренировки тонов', () => {
    for (let seed = 1; seed < 30; seed++) {
      for (const step of buildLesson(words, ctx({ random: seeded(seed) })).filter((s) => s.options)) {
        const ids = step.options!.map((o) => o.itemId);
        expect(ids.includes('ma') && ids.includes('ma-sac')).toBe(false);
      }
    }
  });

  it('в тренировке тонов варианты отличаются только тоном', () => {
    const tone = buildLesson(toneLesson, ctx()).find((s) => s.kind === 'tone')!;
    expect(tone.options!.map((o) => o.label).sort()).toEqual(['ma', 'má']);
  });

  it('без микрофона фраза собирается из плиток, и среди них есть все её слоги', () => {
    const build = buildLesson(phrases, ctx({ mic: false })).find((s) => s.kind === 'build' && s.itemId === 'cam-on-anh')!;
    expect(build.answer).toEqual(['cảm', 'ơn', 'anh']);
    for (const s of build.answer!) expect(build.tiles).toContain(s);
  });
});

/** Проходит урок, отвечая на всё верно. */
function passAll(state: LessonState): LessonState {
  let s = state;
  for (let guard = 0; s.phase !== 'done' && guard < 200; guard++) {
    const step = currentStep(s)!;
    if (s.phase === 'feedback' || step.kind === 'intro') s = reduce(s, { type: 'next' });
    else if (step.options) s = reduce(s, { type: 'choose', itemId: step.itemId });
    else if (step.kind === 'build') s = reduce(s, { type: 'build', tiles: step.answer! });
    else s = reduce(s, { type: 'heard', outcome: 'success' });
  }
  return s;
}

describe('ход урока', () => {
  it('верные ответы доводят урок до конца без повторов', () => {
    const steps = buildLesson(words, ctx());
    const end = passAll(startLesson('w', steps));
    expect(end.phase).toBe('done');
    expect(end.steps).toHaveLength(steps.length);
    expect(accuracy(end)).toBe(1);
  });

  it('ошибка ставит элемент ещё раз в конец урока — один раз', () => {
    const steps = buildLesson(words, ctx({ mic: false }));
    let s = startLesson('w', steps);
    while (!currentStep(s)!.options) s = reduce(s, { type: 'next' });
    const step = currentStep(s)!;
    const wrong = step.options!.find((o) => o.itemId !== step.itemId)!;
    s = reduce(s, { type: 'choose', itemId: wrong.itemId });
    expect(s.phase).toBe('feedback');
    expect(s.outcome).toBe('miss');
    expect(s.steps).toHaveLength(steps.length + 1);
    expect(s.steps.at(-1)).toMatchObject({ itemId: step.itemId, retry: true });
    const end = passAll(s);
    expect(end.steps).toHaveLength(steps.length + 1);
    expect(lessonGrades(end).get(step.itemId)).toBe(1);
  });

  it(`после ${SPEECH_ATTEMPTS} нерасслышанных попыток шаг — промах`, () => {
    let s = startLesson('p', [{ kind: 'say', itemId: 'anh' }]);
    for (let i = 1; i < SPEECH_ATTEMPTS; i++) {
      s = reduce(s, { type: 'not-heard' });
      expect(s.phase).toBe('question');
      expect(s.attempts).toBe(i);
    }
    s = reduce(s, { type: 'not-heard' });
    expect(s.outcome).toBe('miss');
  });

  it('«почти» засчитывается, но оценка карточки ниже', () => {
    let s = startLesson('p', [{ kind: 'say', itemId: 'anh' }]);
    s = reduce(s, { type: 'heard', outcome: 'almost' });
    expect(s.outcome).toBe('almost');
    s = reduce(s, { type: 'next' });
    expect(s.phase).toBe('done');
    expect(lessonGrades(s).get('anh')).toBe(2);
  });

  it('пропуск — промах, и элемент возвращается', () => {
    let s = startLesson('p', [{ kind: 'say', itemId: 'anh' }]);
    s = reduce(s, { type: 'skip' });
    expect(s.outcome).toBe('miss');
    expect(s.steps).toHaveLength(2);
  });

  it('события не того шага игнорируются', () => {
    const s = startLesson('p', [{ kind: 'intro', itemId: 'anh' }]);
    expect(reduce(s, { type: 'heard', outcome: 'success' })).toBe(s);
    expect(reduce(s, { type: 'choose', itemId: 'anh' })).toBe(s);
  });
});

describe('распознанная речь', () => {
  it('фраза засчитывается внутри длинной расшифровки', () => {
    expect(judgeSpeech(lookup('cam-on-anh'), 'à cảm ơn anh nhé')).toMatchObject({ outcome: 'success' });
  });

  it('одна ошибка движка — «почти»', () => {
    expect(judgeSpeech(lookup('cam-on-anh'), 'cảm ơn ann')).toMatchObject({ outcome: 'almost' });
  });

  it('другая фраза — пока не засчитано', () => {
    expect(judgeSpeech(lookup('cam-on-anh'), 'xin chào')).toBeNull();
  });
});
