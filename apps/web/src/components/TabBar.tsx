/**
 * Нижняя панель вкладок: учёба, темы, разговорник, успехи. Профиль — кнопкой
 * в шапке «Учёбы», справа сверху.
 */

import { go, route, type TabName } from '../store/app.js';
import { updating } from '../store/pwa.js';
import { account } from '../store/sync.js';
import { t } from '../strings.js';
import { Avatar, Icon } from './ui.js';

/** Шестерёнка настроек — рядом с профилем, в шапке «Учёбы». Без подписи. */
export function SettingsButton() {
  return (
    <button class="profile-btn settings-btn" type="button" aria-label={t('tab.settings')} onClick={() => go({ name: 'settings' })}>
      <Icon name="cog-1" size={32} />
    </button>
  );
}

/**
 * Фоновая установка приложения — первая или обновление (store/pwa.ts). Место
 * под значок занято всегда: появление не сдвигает шапку.
 */
export function UpdateIndicator() {
  return (
    <span class="update-indicator" data-on={updating.value} role="status" aria-label={updating.value ? t('app.updating') : undefined}>
      <Icon name="triangle-arrow-synchronize-2" size={24} />
    </span>
  );
}

/**
 * Вход и профиль. Видно, вошёл ли человек: гость видит значок входа,
 * вошедший — своё фото или букву. Одна и та же иконка в обоих случаях не
 * говорила бы ничего. Подписи нет, имя — в aria-label.
 */
export function ProfileButton() {
  const a = account.value;
  const label = a.state === 'user' ? a.me.name : a.state === 'guest' ? t('tab.signIn') : t('tab.profile');
  return (
    <button class="profile-btn" type="button" aria-label={label} onClick={() => go({ name: 'family' })}>
      {a.state === 'user' ? <Avatar name={a.me.name} src={a.me.avatarUrl} size="head" /> : <Icon name={a.state === 'guest' ? 'login-1' : 'user-single-neutral-male'} size={32} />}
    </button>
  );
}

const TABS: { name: TabName; icon: string; label: string }[] = [
  { name: 'home', icon: 'triangle-arrow-roadmap', label: t('tab.learn') },
  { name: 'topics', icon: 'layers-1', label: t('tab.topics') },
  { name: 'phrasebook', icon: 'book-1', label: t('tab.phrasebook') },
  { name: 'progress', icon: 'star-medal-1', label: t('tab.progress') },
];

export function TabBar() {
  const current = route.value.name;
  return (
    <nav class="tabbar" aria-label={t('tab.nav')}>
      {TABS.map((tab) => (
        <button key={tab.name} class="tabbar__tab" type="button" aria-current={current === tab.name ? 'page' : undefined} onClick={() => go({ name: tab.name })}>
          <Icon name={tab.icon} size={28} />
          <span class="tabbar__label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
