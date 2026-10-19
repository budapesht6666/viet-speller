/**
 * Разговорник «показать» (PLAN.md, этап 9).
 *
 * Всё пройденное — по темам, с поиском по-русски и по-вьетнамски и
 * избранным. Режим показа: фраза на весь экран, озвучка в полную
 * громкость (микрофон в этот момент не слушает), русский мелко внизу.
 * Не можешь сказать — покажи врачу или мастеру.
 *
 * Работает без сети: тексты в сборке, озвучка в precache service worker.
 * Это единственная часть приложения, которой сеть не нужна, и экран это
 * говорит.
 */

import { fold, type Item } from '@viet/core';
import { item, topics } from '@viet/content';
import { createPortal } from 'preact/compat';
import { useEffect, useState } from 'preact/hooks';
import { player } from '../audio/samples.js';
import { Icon, PlayButtons } from '../components/ui.js';
import { readSetting, writeSetting } from '../store/db.js';
import { progress } from '../store/app.js';
import { t } from '../strings.js';

const norm = (s: string) => fold(s.toLowerCase()).replace(/ё/g, 'е');

/**
 * Показ — порталом в body: внутри экрана он оказался бы в его слое, и панель
 * вкладок легла бы поверх кнопок.
 */
function Show({ entry, onClose }: { entry: Item; onClose: () => void }) {
  const [flipped, setFlipped] = useState(false);
  return createPortal(
    <div class="show" role="dialog" aria-label={entry.ru}>
      <div class="show__card" data-flipped={flipped}>
        <p class="show__vi" lang="vi">
          {entry.vi}
        </p>
        <p class="show__ru">{entry.ru}</p>
      </div>
      <div class="show__bar">
        <PlayButtons text={entry.vi} autoPlay />
        <div class="show__actions">
          <button class="btn btn--quiet" type="button" onClick={() => setFlipped(!flipped)}>
            {t('book.flip')}
          </button>
          <button class="btn btn--quiet" type="button" onClick={onClose}>
            {t('book.close')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function Phrasebook() {
  const [query, setQuery] = useState('');
  const [onlyFav, setOnlyFav] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showing, setShowing] = useState<Item | null>(null);

  useEffect(() => {
    void readSetting<string[]>('favorites').then((f) => setFavorites(new Set(f ?? [])));
  }, []);

  const toggleFav = (id: string) => {
    const next = new Set(favorites);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setFavorites(next);
    void writeSetting('favorites', [...next]);
  };

  const done = progress.value.doneLessons;
  const q = norm(query.trim());
  const groups = topics
    .map((topic) => ({
      topic,
      entries: topic.lessons
        .filter((l) => done.has(l.id))
        .flatMap((l) => l.items.map(item))
        .filter((e) => !onlyFav || favorites.has(e.id))
        .filter((e) => !q || norm(e.ru).includes(q) || [e.vi, ...(e.alt ?? [])].some((v) => norm(v).includes(q))),
    }))
    .filter((g) => g.entries.length);
  const learned = topics.flatMap((tp) => tp.lessons).filter((l) => done.has(l.id)).length;

  return (
    <main class="screen screen--tabbed book">
      <header class="home__hero">
        <h1 class="display">{t('home.phrasebook')}</h1>
      </header>

      {learned === 0 ? (
        <p class="lead">{t('book.empty')}</p>
      ) : (
        <>
          <input class="input" type="search" placeholder={t('book.search')} value={query} onInput={(e) => setQuery((e.target as HTMLInputElement).value)} />
          <div class="goal">
            <button class="chip" type="button" role="switch" aria-checked={onlyFav} onClick={() => setOnlyFav(!onlyFav)}>
              {t('book.favorites')}
            </button>
          </div>
          {groups.length === 0 && <p class="caption">{t('book.nothing')}</p>}
          {groups.map(({ topic, entries }) => (
            <section key={topic.id} class="book__group">
              <p class="eyebrow">{topic.title}</p>
              <ul class="book__list">
                {entries.map((e) => (
                  <li key={e.id} class="book__row">
                    <button
                      class="book__entry"
                      type="button"
                      onClick={() => {
                        player.unlock();
                        setShowing(e);
                      }}
                    >
                      <span class="book__vi" lang="vi">
                        {e.vi}
                      </span>
                      <span class="caption">{e.ru}</span>
                    </button>
                    <button class="book__fav" type="button" aria-pressed={favorites.has(e.id)} aria-label={t('book.favorite')} onClick={() => toggleFav(e.id)}>
                      <Icon name={favorites.has(e.id) ? 'multiple-stars' : 'half-star-2'} size={28} />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
      {showing && <Show entry={showing} onClose={() => setShowing(null)} />}
    </main>
  );
}
