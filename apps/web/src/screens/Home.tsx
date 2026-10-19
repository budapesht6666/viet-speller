/**
 * «Учёба»: что пройти дальше, тренировка и путь по темам. Статистика —
 * на «Успехах», вход и состояние приложения — в профиле.
 */

import { dayKey, dueItems, minutesOn, nextLesson, topicLevel, TOPIC_LEVELS, unlockedLessons } from '@viet/core';
import { lessons, topics } from '@viet/content';
import { player } from '../audio/samples.js';
import { LessonBlockers } from '../components/AppStatus.js';
import { Icon } from '../components/ui.js';
import { dailyGoal, go, noMic, noMicUntil, now, progress, setNoMic } from '../store/app.js';
import { t } from '../strings.js';

/** Четыре ступени уровня темы. Что значит каждая — в подсказке. */
function Level({ level }: { level: number }) {
  return (
    <span class="level" title={t(`level.${level}` as 'level.0')}>
      <span class="level__steps" aria-hidden="true">
        {[1, 2, 3, 4].map((n) => (
          <span key={n} class="level__step" data-on={n <= level} />
        ))}
      </span>
      <span class="caption">{TOPIC_LEVELS[level]}</span>
    </span>
  );
}

/** Касание «начать» разблокирует звук: дальше образцы играют сами. */
function start(lessonId: string) {
  player.unlock();
  go({ name: 'lesson', lessonId });
}

export function Home() {
  const p = progress.value;
  const today = now.value;
  const open = unlockedLessons(lessons, p);
  const next = nextLesson(lessons, p);
  const due = dueItems(p, today);
  const minutesToday = minutesOn(p, dayKey(today));
  const noMicLeft = Math.max(0, Math.ceil((noMicUntil.value - today.getTime()) / 60_000));

  return (
    <main class="screen screen--tabbed home">
      <header class="home__hero">
        <h1 class="display">{t('appName')}</h1>
        <p class="lead">{t('home.lead')}</p>
      </header>

      <LessonBlockers />

      {next ? (
        <button class="btn btn--cta" type="button" onClick={() => start(next.id)}>
          {p.doneLessons.size ? `${t('home.continue')}: ${next.title}` : t('home.start')}
        </button>
      ) : (
        <p class="caption">{t('home.allDone')}</p>
      )}
      <p class="caption home__today">
        {t('stats.today')}: {minutesToday} {t('home.of')} {dailyGoal.value}
      </p>

      <button
        class="card home__review"
        type="button"
        disabled={!due.length}
        onClick={() => {
          player.unlock();
          go({ name: 'review' });
        }}
      >
        <Icon name="reset-clock" size={32} />
        <span>
          <span class="h2">{t('home.review')}</span>
          <span class="caption">{due.length ? `${t('home.reviewDue')}: ${due.length}` : t('home.reviewNone')}</span>
        </span>
      </button>

      <button class="card home__review" type="button" onClick={() => go({ name: 'talk' })}>
        <Icon name="chat-bubble-square-question" size={32} />
        <span>
          <span class="h2">{t('talk.card')}</span>
          <span class="caption">{t('talk.cardHint')}</span>
        </span>
      </button>

      <div class="home__nomic">
        <button class="btn btn--quiet" type="button" onClick={() => setNoMic(!noMic.value)}>
          {noMic.value ? `${t('noMic.off')} (${t('noMic.active')} ${noMicLeft} мин)` : t('noMic.on')}
        </button>
        {!noMic.value && <p class="caption">{t('noMic.hint')}</p>}
      </div>

      <section class="path" aria-label={t('home.path')}>
        {topics.map((topic) => (
          <div key={topic.id} class="path__topic">
            <div class="path__head">
              <p class="eyebrow">{topic.title}</p>
              <Level level={topicLevel(topic, p)} />
            </div>
            <p class="caption">{topic.summary}</p>
            {topic.lessons.every((l) => l.listenOnly) && <p class="caption path__listen">{t('home.listenOnly')}</p>}
            <ol class="path__lessons">
              {topic.lessons.map((l) => {
                const done = p.doneLessons.has(l.id);
                const locked = !open.has(l.id);
                return (
                  <li key={l.id}>
                    <button class="path__lesson" type="button" data-done={done} disabled={locked} onClick={() => start(l.id)}>
                      <Icon name={done ? 'check-thick' : locked ? 'padlock-key' : 'line-arrow-right-circle-2'} size={28} />
                      <span class="path__title">{l.title}</span>
                      <span class="caption">{done ? t('home.lessonDone') : locked ? t('home.lessonLocked') : ''}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </section>
    </main>
  );
}
