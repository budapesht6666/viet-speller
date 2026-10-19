/**
 * «Учёба»: что пройти дальше, тренировка и одна тема — последняя открытая
 * или выбранная на вкладке «Темы». Статистика — на «Успехах», настройки и
 * вход — кнопками справа сверху.
 */

import { dayKey, dueItems, minutesOn, nextLesson, topicLevel, unlockedLessons } from '@viet/core';
import { lessons } from '@viet/content';
import { player } from '../audio/samples.js';
import { LessonBlockers } from '../components/AppStatus.js';
import { Level } from '../components/Level.js';
import { ProfileButton, SettingsButton, UpdateIndicator } from '../components/TabBar.js';
import { Icon } from '../components/ui.js';
import { dailyGoal, go, noMic, noMicUntil, now, progress, setNoMic } from '../store/app.js';
import { openTopics, shownTopic } from '../store/path.js';
import { t } from '../strings.js';

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
  const topic = shownTopic(p);
  const openCount = openTopics(p).length;

  return (
    <main class="screen screen--tabbed home">
      <header class="home__hero home__title">
        <h1 class="display">{t('appName')}</h1>
        <div class="home__actions">
          <UpdateIndicator />
          <SettingsButton />
          <ProfileButton />
        </div>
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

      <div class="home__tiles">
        <button
          class="card home__tile"
          type="button"
          disabled={!due.length}
          onClick={() => {
            player.unlock();
            go({ name: 'review' });
          }}
        >
          <Icon name="reset-clock" size={28} />
          <span class="home__tileTitle">{t('home.review')}</span>
          <span class="caption">{due.length ? `${t('home.reviewDue')}: ${due.length}` : t('home.reviewNone')}</span>
        </button>
        <button class="card home__tile" type="button" onClick={() => go({ name: 'talk' })}>
          <Icon name="chat-bubble-square-question" size={28} />
          <span class="home__tileTitle">{t('talk.title')}</span>
        </button>
      </div>

      <div class="home__nomic">
        <button class="chip" type="button" role="switch" aria-checked={noMic.value} onClick={() => setNoMic(!noMic.value)}>
          {noMic.value ? `${t('noMic.off')} (${t('noMic.active')} ${noMicLeft} мин)` : t('noMic.on')}
        </button>
      </div>

      <section class="path" aria-label={t('home.path')}>
        <div class="path__topic">
          <div class="path__head">
            <p class="eyebrow">{topic.title}</p>
            <Level level={topicLevel(topic, p)} />
          </div>
          <p class="caption">{topic.summary}</p>
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
          {openCount > 1 && (
            <button class="btn btn--quiet path__all" type="button" onClick={() => go({ name: 'topics' })}>
              {t('home.allTopics')} ({openCount})
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
