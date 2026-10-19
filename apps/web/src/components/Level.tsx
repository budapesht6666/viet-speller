import { TOPIC_LEVELS } from '@viet/core';
import { t } from '../strings.js';

/** Четыре ступени уровня темы. Что значит каждая — в подсказке. */
export function Level({ level }: { level: number }) {
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
