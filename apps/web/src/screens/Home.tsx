import { dayKey, dueItems, minutesOn, minutesThisWeek, nextLesson, streak, topicLevel, TOPIC_LEVELS, unlockedLessons } from '@viet/core';
import { achievements, topics } from '@viet/content';
import { lessons } from '@viet/content';
import { useEffect, useState } from 'preact/hooks';
import { useRegisterSW } from 'virtual:pwa-register/preact';
import { player } from '../audio/samples.js';
import { Icon, Status, type StatusState } from '../components/ui.js';
import { recognitionBlocker } from '../speech/recognizer.js';
import { dailyGoal, go, GOALS, noMic, noMicUntil, now, progress, setDailyGoal, setNoMic, storage } from '../store/app.js';
import { Badges } from '../components/Badges.js';
import { allEarned } from '../store/achievements.js';
import { account, syncState } from '../store/sync.js';
import { t } from '../strings.js';

/** Сеть. Без неё нет распознавания — это показываем, а не молча зависаем. */
export function useOnline(): boolean {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    addEventListener('online', on);
    addEventListener('offline', off);
    return () => {
      removeEventListener('online', on);
      removeEventListener('offline', off);
    };
  }, []);
  return online;
}

/**
 * Service worker. Обновление не ставится само посреди урока: перезагрузка
 * на полуслове хуже, чем старая версия ещё пять минут. Поэтому кнопка.
 */
function AppUpdate() {
  const [registered, setRegistered] = useState<'pending' | 'ok' | 'error'>('pending');
  const [updating, setUpdating] = useState(false);
  const {
    offlineReady: [offlineReady],
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW: () => setRegistered('ok'),
    onRegisterError: () => setRegistered('error'),
  });

  if (needRefresh) {
    return (
      <div class="card home__update">
        <Status state="wait">{t('app.updateReady')}</Status>
        <button
          class="btn btn--quiet"
          type="button"
          disabled={updating}
          onClick={() => {
            setUpdating(true);
            void updateServiceWorker(true);
          }}
        >
          {updating ? t('app.updating') : t('app.update')}
        </button>
      </div>
    );
  }
  if (registered === 'error') return <Status state="off">{t('app.swError')}</Status>;
  if (offlineReady || registered === 'ok') return <Status state="ok">{t('app.offlineReady')}</Status>;
  return <Status state="wait">{t('app.swPending')}</Status>;
}

/** Синхронизация с семьёй: у каждого её состояния свой вид. */
function SyncStatus() {
  const a = account.value;
  const s = syncState.value;
  if (a.state === 'guest') return <Status state="off">{t('sync.guest')}</Status>;
  if (a.state === 'unknown') return <Status state="wait">{t('sync.checking')}</Status>;
  if (a.state === 'offline' || s.state === 'offline') return <Status state="wait">{s.pending ? `${t('sync.offlinePending')}: ${s.pending}` : t('sync.offline')}</Status>;
  if (s.state === 'syncing') return <Status state="wait">{t('sync.syncing')}</Status>;
  if (s.state === 'error') return <Status state="off">{t('sync.error')}</Status>;
  return <Status state="ok">{t('sync.ok')}</Status>;
}

const SPEECH: Record<ReturnType<typeof recognitionBlocker>, { state: StatusState; text: string }> = {
  none: { state: 'ok', text: t('speech.ok') },
  insecure: { state: 'off', text: t('speech.insecure') },
  unsupported: { state: 'off', text: t('speech.unsupported') },
};

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
  const online = useOnline();
  const p = progress.value;
  const today = now.value;
  const open = unlockedLessons(lessons, p);
  const next = nextLesson(lessons, p);
  const due = dueItems(p, today);
  const minutesToday = minutesOn(p, dayKey(today));
  const speech = SPEECH[recognitionBlocker()];
  const noMicLeft = Math.max(0, Math.ceil((noMicUntil.value - today.getTime()) / 60_000));

  return (
    <main class="screen home">
      <header class="home__hero">
        <div class="home__title">
          <h1 class="display">{t('appName')}</h1>
          <div class="home__links">
            <button class="home__family" type="button" onClick={() => go({ name: 'phrasebook' })}>
              <Icon name="book-1" size={32} />
              <span class="caption">{t('home.phrasebook')}</span>
            </button>
            <button class="home__family" type="button" onClick={() => go({ name: 'family' })}>
              <Icon name="user-multiple-accounts" size={32} />
              <span class="caption">{t('home.family')}</span>
            </button>
          </div>
        </div>
        <p class="lead">{t('home.lead')}</p>
      </header>

      <section class="stats" aria-label="Статистика">
        <div class="card stat">
          <Icon name="calendar-check" size={24} />
          <p class="stat__value">{streak(p, today)}</p>
          <p class="caption">{t('stats.streak')}</p>
        </div>
        <div class="card stat">
          <Icon name="circle-clock" size={24} />
          <p class="stat__value">
            {minutesToday}
            <span class="stat__of">/{dailyGoal.value}</span>
          </p>
          <p class="caption">{t('stats.today')}</p>
        </div>
        <div class="card stat">
          <Icon name="star-medal-1" size={24} />
          <p class="stat__value">{minutesThisWeek(p, today)}</p>
          <p class="caption">{t('stats.week')}</p>
        </div>
      </section>

      <div class="goal" role="radiogroup" aria-label={t('stats.goal')}>
        <span class="caption">{t('stats.goal')}:</span>
        {GOALS.map((g) => (
          <button key={g} class="chip" type="button" role="radio" aria-checked={dailyGoal.value === g} onClick={() => setDailyGoal(g)}>
            {g} мин
          </button>
        ))}
      </div>

      {next ? (
        <button class="btn btn--cta" type="button" onClick={() => start(next.id)}>
          {p.doneLessons.size ? `${t('home.continue')}: ${next.title}` : t('home.start')}
        </button>
      ) : (
        <p class="caption">{t('home.allDone')}</p>
      )}

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

      <section class="home__badges">
        <p class="eyebrow">
          {t('home.achievements')} · {allEarned.value.size}/{achievements.length}
        </p>
        <Badges earned={allEarned.value} />
      </section>

      <section class="home__status">
        <p class="eyebrow">{t('status.title')}</p>
        <Status state={speech.state}>{speech.text}</Status>
        <Status state={online ? 'ok' : 'off'}>{online ? t('net.online') : t('net.offline')}</Status>
        <Status state={storage.value === 'idb' ? 'ok' : storage.value === 'memory' ? 'off' : 'wait'}>{t(`storage.${storage.value}`)}</Status>
        <SyncStatus />
        <AppUpdate />
      </section>
    </main>
  );
}
