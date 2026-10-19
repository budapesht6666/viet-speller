/**
 * «Успехи»: серия, минуты, ежедневная цель и ачивки.
 */

import { dayKey, minutesOn, minutesThisWeek, streak } from '@viet/core';
import { achievements } from '@viet/content';
import { Badges } from '../components/Badges.js';
import { Icon } from '../components/ui.js';
import { allEarned } from '../store/achievements.js';
import { dailyGoal, GOALS, now, progress, setDailyGoal } from '../store/app.js';
import { t } from '../strings.js';

export function Progress() {
  const p = progress.value;
  const today = now.value;
  return (
    <main class="screen screen--tabbed home">
      <header class="home__hero">
        <h1 class="display">{t('tab.progress')}</h1>
      </header>

      <section class="stats" aria-label={t('tab.progress')}>
        <div class="card stat">
          <Icon name="calendar-check" size={24} />
          <p class="stat__value">{streak(p, today)}</p>
          <p class="caption">{t('stats.streak')}</p>
        </div>
        <div class="card stat">
          <Icon name="circle-clock" size={24} />
          <p class="stat__value">
            {minutesOn(p, dayKey(today))}
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

      <section class="home__badges">
        <p class="eyebrow">
          {t('home.achievements')} · {allEarned.value.size}/{achievements.length}
        </p>
        <Badges earned={allEarned.value} />
      </section>
    </main>
  );
}
