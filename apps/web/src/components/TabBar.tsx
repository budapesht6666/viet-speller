/**
 * Нижняя панель вкладок: учёба, разговорник, успехи, профиль.
 *
 * Вкладка профиля показывает, вошёл ли человек: гость видит «Войти», вошедший —
 * кружок со своей буквой и имя. Одна и та же иконка в обоих случаях не
 * говорила бы ничего.
 */

import { go, route, type TabName } from '../store/app.js';
import { account } from '../store/sync.js';
import { t } from '../strings.js';
import { Avatar, Icon } from './ui.js';

function ProfileTab() {
  const a = account.value;
  if (a.state === 'user') {
    return (
      <>
        <Avatar name={a.me.name} />
        <span class="tabbar__label">{a.me.name}</span>
      </>
    );
  }
  return (
    <>
      <Icon name={a.state === 'guest' ? 'login-1' : 'user-single-neutral-male'} size={28} />
      <span class="tabbar__label">{a.state === 'guest' ? t('tab.signIn') : t('tab.profile')}</span>
    </>
  );
}

const TABS: { name: TabName; icon: string; label: string }[] = [
  { name: 'home', icon: 'triangle-arrow-roadmap', label: t('tab.learn') },
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
      <button class="tabbar__tab" type="button" aria-current={current === 'family' ? 'page' : undefined} onClick={() => go({ name: 'family' })}>
        <ProfileTab />
      </button>
    </nav>
  );
}
