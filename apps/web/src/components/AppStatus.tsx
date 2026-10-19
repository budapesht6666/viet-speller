/**
 * Что работает сейчас: распознавание, сеть, хранилище, синхронизация,
 * офлайн-версия. Полный список — в профиле, а на «Учёбе» — только то, что
 * мешает уроку прямо сейчас.
 */

import { useEffect, useState } from 'preact/hooks';
import { recognitionBlocker } from '../speech/recognizer.js';
import { storage } from '../store/app.js';
import { pwa } from '../store/pwa.js';
import { account, syncState } from '../store/sync.js';
import { t } from '../strings.js';
import { Status, type StatusState } from './ui.js';

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

/** Офлайн-версия. Обновления ставятся сами (store/pwa.ts), кнопки нет. */
function OfflineStatus() {
  const state = pwa.value;
  if (state === 'off') return null;
  if (state === 'error') return <Status state="off">{t('app.swError')}</Status>;
  if (state === 'ready') return <Status state="ok">{t('app.offlineReady')}</Status>;
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

/** Полный список — для профиля. */
export function AppStatus() {
  const online = useOnline();
  const speech = SPEECH[recognitionBlocker()];
  return (
    <section class="home__status">
      <p class="eyebrow">{t('status.title')}</p>
      <Status state={speech.state}>{speech.text}</Status>
      <Status state={online ? 'ok' : 'off'}>{online ? t('net.online') : t('net.offline')}</Status>
      <Status state={storage.value === 'idb' ? 'ok' : storage.value === 'memory' ? 'off' : 'wait'}>{t(`storage.${storage.value}`)}</Status>
      <SyncStatus />
      <OfflineStatus />
    </section>
  );
}

/**
 * Для «Учёбы»: только то, что мешает уроку. Когда всё в порядке, блока нет —
 * зелёные строки на главной каждый день никто не читает.
 */
export function LessonBlockers() {
  const online = useOnline();
  const speech = SPEECH[recognitionBlocker()];
  const problems = [
    speech.state !== 'ok' && <Status key="speech" state="off">{speech.text}</Status>,
    !online && <Status key="net" state="off">{t('net.offline')}</Status>,
    storage.value === 'memory' && <Status key="storage" state="off">{t('storage.memory')}</Status>,
  ].filter(Boolean);
  if (!problems.length) return null;
  return <section class="home__status">{problems}</section>;
}
