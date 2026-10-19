/**
 * Урок и тренировка поверх проигрывателя: собирают шаги и пишут итог в
 * журнал. Событие — единственное, что остаётся от урока; всё остальное
 * (карточки, серия, рейтинг) из него вычисляется.
 */

import { accuracy, dueItems, lessonGrades, type LessonState } from '@viet/core';
import { lesson as lessonById } from '@viet/content';
import { useState } from 'preact/hooks';
import { useOnline } from '../components/AppStatus.js';
import { Player } from './Player.js';
import { lessonContext, reviewContext, stepsForLesson, stepsForReview } from '../lessons.js';
import { recognitionBlocker } from '../speech/recognizer.js';
import { go, newId, noMic, now, progress, record } from '../store/app.js';
import { allEarned, newlyEarned } from '../store/achievements.js';
import { syncNow } from '../store/sync.js';
import { t } from '../strings.js';

/** Говорить можно: браузер умеет, есть сеть и не включено «не могу говорить». */
function useMic(): boolean {
  const online = useOnline();
  const [mic] = useState(() => recognitionBlocker() === 'none' && online && !noMic.value);
  return mic;
}

export function LessonScreen({ lessonId }: { lessonId: string }) {
  const lesson = lessonById(lessonId);
  const mic = useMic();
  const [steps] = useState(() => stepsForLesson(lesson, mic));

  const finish = async (state: LessonState, seconds: number) => {
    const grades = Object.fromEntries(lessonGrades(state));
    const acc = accuracy(state);
    const before = allEarned.value;
    let saved = true;
    try {
      await record({ id: newId(), at: new Date().toISOString(), seconds, type: 'lesson-done', lessonId, grades, accuracy: acc, mic });
    } catch {
      saved = false;
    }
    void syncNow();
    const newAchievements = newlyEarned(before, allEarned.value);
    go({ name: 'done', summary: { kind: 'lesson', title: lesson.title, lessonId, accuracy: acc, seconds, items: lesson.items.length, saved, newAchievements } });
  };

  return <Player lessonId={lessonId} steps={steps} context={lessonContext(lessonId, mic)} mic={mic} onExit={() => go({ name: 'home' })} onFinish={finish} />;
}

export function ReviewScreen() {
  const mic = useMic();
  const [ids] = useState(() => dueItems(progress.value, now.value).slice(0, 15));
  const [steps] = useState(() => stepsForReview(ids, mic));

  const finish = async (state: LessonState, seconds: number) => {
    const grades = lessonGrades(state);
    const each = Math.max(1, Math.round(seconds / Math.max(1, grades.size)));
    const before = allEarned.value;
    let saved = true;
    try {
      for (const [itemId, grade] of grades) await record({ id: newId(), at: new Date().toISOString(), seconds: each, type: 'review', itemId, grade });
    } catch {
      saved = false;
    }
    void syncNow();
    const newAchievements = newlyEarned(before, allEarned.value);
    go({ name: 'done', summary: { kind: 'review', title: t('home.review'), accuracy: accuracy(state), seconds, items: grades.size, saved, newAchievements } });
  };

  return <Player lessonId="review" steps={steps} context={reviewContext(ids, mic)} mic={mic} onExit={() => go({ name: 'home' })} onFinish={finish} />;
}
