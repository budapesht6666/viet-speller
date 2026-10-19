/**
 * Профиль: вход, семья с кодом-приглашением, недельный рейтинг по минутам
 * практики и состояние приложения.
 *
 * Шапка сразу говорит, вошёл ли человек: имя и буква в кружке — вошёл,
 * «Вход» — нет. Та же примета — на вкладке внизу.
 */

import { useEffect, useState } from 'preact/hooks';
import { AppStatus } from '../components/AppStatus.js';
import { Avatar, Icon, Status } from '../components/ui.js';
import { account, api, ApiError, signIn, signOut, syncState, type Me } from '../store/sync.js';
import { t } from '../strings.js';

interface Standing {
  userId: string;
  name: string;
  weekMinutes: number;
  todayMinutes: number;
  streak: number;
  lessonsDone: number;
}

function SignIn() {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ login: '', password: '', name: '', inviteCode: '' });
  const field = (key: keyof typeof form) => ({
    value: form[key],
    onInput: (e: Event) => setForm({ ...form, [key]: (e.target as HTMLInputElement).value }),
  });

  const submit = async (e: Event) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const body: Record<string, string> = { login: form.login.trim(), password: form.password };
      if (mode === 'register') {
        body.name = form.name.trim();
        if (form.inviteCode.trim()) body.inviteCode = form.inviteCode.trim().toUpperCase();
      }
      await signIn(mode, body);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('family.failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form class="form" onSubmit={submit}>
      <p class="lead">{t('family.why')}</p>
      <div class="seg" role="radiogroup">
        <button type="button" class="chip" role="radio" aria-checked={mode === 'register'} onClick={() => setMode('register')}>
          {t('family.register')}
        </button>
        <button type="button" class="chip" role="radio" aria-checked={mode === 'login'} onClick={() => setMode('login')}>
          {t('family.login')}
        </button>
      </div>
      <label class="field">
        <span class="caption">{t('family.loginField')}</span>
        <input class="input" autocomplete="username" autocapitalize="none" required minLength={2} maxLength={32} {...field('login')} />
      </label>
      <label class="field">
        <span class="caption">{t('family.password')}</span>
        <input class="input" type="password" autocomplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={8} {...field('password')} />
      </label>
      {mode === 'register' && (
        <>
          <label class="field">
            <span class="caption">{t('family.name')}</span>
            <input class="input" autocomplete="nickname" required maxLength={40} {...field('name')} />
          </label>
          <label class="field">
            <span class="caption">{t('family.invite')}</span>
            <input class="input input--code" autocapitalize="characters" maxLength={6} {...field('inviteCode')} />
            <span class="caption">{t('family.inviteHint')}</span>
          </label>
        </>
      )}
      {error && <p class="form__error">{error}</p>}
      <button class="btn btn--cta" type="submit" disabled={busy}>
        {busy ? t('family.busy') : mode === 'register' ? t('family.register') : t('family.login')}
      </button>
    </form>
  );
}

function Board({ me }: { me: Me }) {
  const [standings, setStandings] = useState<Standing[] | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api<{ standings: Standing[] }>('/leaderboard')
      .then((r) => setStandings(r.standings))
      .catch((e) => setError(e instanceof ApiError ? e.message : t('family.failed')));
  }, [syncState.value.at?.getTime()]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(me.family.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* буфер недоступен — код и так на экране */
    }
  };

  return (
    <>
      <section class="card family__invite">
        <p class="eyebrow">{t('family.inviteTitle')}</p>
        <p class="family__code" lang="en">
          {me.family.inviteCode}
        </p>
        <button class="btn btn--quiet" type="button" onClick={copy}>
          {copied ? t('family.copied') : t('family.copy')}
        </button>
        <p class="caption">{t('family.inviteShare')}</p>
      </section>

      <section class="board">
        <p class="eyebrow">{t('family.week')}</p>
        {error && <Status state="off">{error}</Status>}
        {!standings && !error && <Status state="wait">{t('family.loading')}</Status>}
        <ol class="board__list">
          {standings?.map((s, i) => (
            <li key={s.userId} class="board__row" data-me={s.userId === me.id}>
              <span class="board__place">{i + 1}</span>
              <span class="board__name">{s.name}</span>
              <span class="board__minutes">
                <span class="stat__value">{s.weekMinutes}</span>
                <span class="caption"> мин</span>
              </span>
              <span class="caption board__meta">
                {t('family.streak')}: {s.streak} · {t('family.lessons')}: {s.lessonsDone}
              </span>
            </li>
          ))}
        </ol>
        <p class="caption">{t('family.byMinutes')}</p>
      </section>

      <button class="btn btn--quiet" type="button" onClick={() => void signOut()}>
        {t('family.logout')} ({me.name})
      </button>
    </>
  );
}

export function Family() {
  const a = account.value;
  return (
    <main class="screen screen--tabbed family">
      {a.state === 'user' ? (
        <header class="profile">
          <Avatar name={a.me.name} large />
          <div class="profile__who">
            <h1 class="h2">{a.me.name}</h1>
            <p class="caption">
              {t('profile.family')}: {a.me.family.name} · {t('profile.login')}: {a.me.login}
            </p>
          </div>
        </header>
      ) : (
        <header class="profile">
          <Icon name={a.state === 'guest' ? 'login-1' : 'user-single-neutral-male'} size={48} />
          <div class="profile__who">
            <h1 class="h2">{a.state === 'guest' ? t('profile.guest') : t('tab.profile')}</h1>
            {a.state === 'guest' && <p class="caption">{t('profile.guestHint')}</p>}
          </div>
        </header>
      )}
      {a.state === 'unknown' && <Status state="wait">{t('family.loading')}</Status>}
      {a.state === 'offline' && <Status state="off">{t('family.offline')}</Status>}
      {a.state === 'guest' && <SignIn />}
      {a.state === 'user' && <Board me={a.me} />}
      <AppStatus />
    </main>
  );
}
