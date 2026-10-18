import { useEffect, useRef } from 'preact/hooks';
import { Badges } from '../components/Badges.js';
import { Icon } from '../components/ui.js';
import { go, type Summary } from '../store/app.js';
import { t } from '../strings.js';
import { pop } from '../ui/motion.js';

export function Done({ summary }: { summary: Summary }) {
  const hero = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (hero.current) pop(hero.current);
  }, []);
  return (
    <main class="screen done">
      <div class="done__hero" ref={hero}>
        <Icon name="star-medal-1" size={96} />
        <h1 class="display">{t(summary.kind === 'lesson' ? 'done.lesson' : 'done.review')}</h1>
        <p class="lead">{summary.title}</p>
      </div>
      <section class="stats">
        <div class="card stat">
          <p class="stat__value">{Math.round(summary.accuracy * 100)}%</p>
          <p class="caption">{t('done.accuracy')}</p>
        </div>
        <div class="card stat">
          <p class="stat__value">{Math.max(1, Math.round(summary.seconds / 60))}</p>
          <p class="caption">{t('done.minutes')}</p>
        </div>
        <div class="card stat">
          <p class="stat__value">{summary.items}</p>
          <p class="caption">{t('done.items')}</p>
        </div>
      </section>
      {summary.newAchievements.length > 0 && (
        <section class="done__badges">
          <p class="eyebrow">{t('done.newAchievements')}</p>
          <Badges earned={new Set(summary.newAchievements)} only={summary.newAchievements} />
        </section>
      )}
      {!summary.saved && <p class="caption done__warn">{t('done.saveFailed')}</p>}
      <button class="btn btn--cta done__home" type="button" onClick={() => go({ name: 'home' })}>
        {t('done.home')}
      </button>
    </main>
  );
}
