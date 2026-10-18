import { useEffect, useState } from 'preact/hooks';
import { useRegisterSW } from 'virtual:pwa-register/preact';
import { recognitionBlocker } from './speech/recognizer.js';
import { t } from './strings.js';

type StatusState = 'ok' | 'wait' | 'off';

function Status({ state, children }: { state: StatusState; children: preact.ComponentChildren }) {
  return (
    <div class="status" data-state={state}>
      <span class="status__dot" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

/** Сеть. Без неё нет распознавания — это показываем, а не молча зависаем. */
function useOnline(): boolean {
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
      <div class="card">
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

const SPEECH: Record<ReturnType<typeof recognitionBlocker>, { state: StatusState; text: string }> = {
  none: { state: 'ok', text: t('speech.ok') },
  insecure: { state: 'off', text: t('speech.insecure') },
  unsupported: { state: 'off', text: t('speech.unsupported') },
};

export function App() {
  const online = useOnline();
  const speech = SPEECH[recognitionBlocker()];

  return (
    <main class="screen home">
      <header class="home__hero">
        <h1 class="display">{t('appName')}</h1>
        <p class="lead">{t('home.lead')}</p>
      </header>

      <section class="home__status">
        <p class="eyebrow">{t('status.title')}</p>
        <Status state={speech.state}>{speech.text}</Status>
        <Status state={online ? 'ok' : 'off'}>{online ? t('net.online') : t('net.offline')}</Status>
        <AppUpdate />
      </section>

      <footer class="home__foot">
        <button class="btn btn--cta" type="button" disabled>
          {t('home.start')}
        </button>
        <p class="caption">{t('home.soon')}</p>
      </footer>
    </main>
  );
}
