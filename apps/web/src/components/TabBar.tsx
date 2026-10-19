/**
 * Нижняя панель вкладок: учёба, темы, разговорник, успехи. Профиль — кнопкой
 * в шапке «Учёбы», справа сверху.
 */

import { go, route, type TabName } from '../store/app.js';
import { account } from '../store/sync.js';
import { t } from '../strings.js';
import { Avatar, Icon } from './ui.js';

/** Шестерёнка настроек — рядом с профилем, в шапке «Учёбы». */
export function SettingsButton() {
  return (
    <button class="profile-btn settings-btn" type="button" onClick={() => go({ name: 'settings' })}>
      <Icon name="cog-1" size={32} />
      <span class="caption">{t('tab.settings')}</span>
    </button>
  );
}

/**
 * Вход и профиль. Видно, вошёл ли человек: гость видит «Войти», вошедший —
 * кружок со своей буквой и имя. Одна и та же иконка в обоих случаях не
 * говорила бы ничего.
 */
export function ProfileButton() {
  const a = account.value;
  return (
    <button class="profile-btn" type="button" onClick={() => go({ name: 'family' })}>
      {a.state === 'user' ? <Avatar name={a.me.name} large /> : <Icon name={a.state === 'guest' ? 'login-1' : 'user-single-neutral-male'} size={32} />}
      <span class="caption">{a.state === 'user' ? a.me.name : a.state === 'guest' ? t('tab.signIn') : t('tab.profile')}</span>
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
