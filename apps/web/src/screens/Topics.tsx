/**
 * «Темы»: открытые темы пути. Касание — тема открывается на «Учёбе».
 * Закрытые не показываем: откроются по ходу, а список из двадцати замков
 * только пугает.
 */

import { topicLevel } from '@viet/core';
import { topics } from '@viet/content';
import { Level } from '../components/Level.js';
import { go, progress } from '../store/app.js';
import { chooseTopic, openTopics, shownTopic } from '../store/path.js';
import { t } from '../strings.js';

export function Topics() {
  const p = progress.value;
  const open = openTopics(p);
  const shown = shownTopic(p);
  const ahead = topics.length - open.length;
  return (
    <main class="screen screen--tabbed home">
      <header class="home__hero">
        <h1 class="display">{t('tab.topics')}</h1>
      </header>
      <ul class="topics">
        {open.map((topic) => {
          const done = topic.lessons.filter((l) => p.doneLessons.has(l.id)).length;
          return (
            <li key={topic.id}>
              <button
                class="card topics__item"
                type="button"
                aria-current={topic.id === shown.id ? 'true' : undefined}
                onClick={() => {
                  chooseTopic(topic.id, p);
                  go({ name: 'home' });
                }}
              >
                <span class="h2">{topic.title}</span>
                <span class="caption">{topic.summary}</span>
                <span class="topics__meta">
                  <span class="caption">
                    {t('topics.lessons')}: {done} {t('home.of')} {topic.lessons.length}
                  </span>
                  <Level level={topicLevel(topic, p)} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {ahead > 0 && (
        <p class="caption">
          {t('topics.ahead')}: {ahead}
        </p>
      )}
    </main>
  );
}
