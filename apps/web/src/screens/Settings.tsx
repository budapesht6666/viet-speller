/**
 * Настройки — шестерёнка в шапке «Учёбы»: фото профиля и голос озвучки.
 *
 * Фото живёт на сервере, его видит семья в рейтинге. Поэтому оно — только
 * после входа; гостю вместо выбора фото — кнопка «Войти».
 *
 * Голос у каждого свой: кому-то понятнее женский, кому-то мужской. Весь
 * контент записан обоими, поэтому смена голоса работает и без сети.
 * Касание варианта сразу его озвучивает: выбирают на слух, а не по названию.
 */

import { VOICE_SAMPLE, VOICES, type Voice } from '@viet/content';
import { useState } from 'preact/hooks';
import { playSample, player, type PlayResult } from '../audio/samples.js';
import { Avatar, Icon, Status } from '../components/ui.js';
import { go, setVoice, voice } from '../store/app.js';
import { ImageError, removeAvatar, uploadAvatar } from '../store/avatar.js';
import { account, ApiError } from '../store/sync.js';
import { t, type StringKey } from '../strings.js';

const LABEL: Record<Voice, StringKey> = {
  'vi-VN-HoaiMyNeural': 'settings.voice.female',
  'vi-VN-NamMinhNeural': 'settings.voice.male',
};

function Photo() {
  const a = account.value;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async (job: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await job();
    } catch (e) {
      setError(e instanceof ImageError ? t('settings.photoBad') : e instanceof ApiError ? e.message : t('family.failed'));
    } finally {
      setBusy(false);
    }
  };

  const pick = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    // Сброс: тот же файл, выбранный ещё раз, снова даст change.
    input.value = '';
    if (file) void run(() => uploadAvatar(file));
  };

  return (
    <section class="settings__group" aria-labelledby="settings-photo">
      <p class="eyebrow" id="settings-photo">
        {t('settings.photo')}
      </p>
      {a.state === 'unknown' && <Status state="wait">{t('family.loading')}</Status>}
      {a.state === 'offline' && <Status state="off">{t('family.offline')}</Status>}
      {a.state === 'guest' && (
        <button class="btn btn--quiet settings__login" type="button" onClick={() => go({ name: 'family' })}>
          {t('settings.photoLogin')}
        </button>
      )}
      {a.state === 'user' && (
        <div class="settings__photo">
          <Avatar name={a.me.name} src={a.me.avatarUrl} size="large" />
          <label class="btn btn--quiet settings__pick" data-busy={busy}>
            {busy ? t('settings.photoBusy') : a.me.avatarUrl ? t('settings.photoChange') : t('settings.photoPick')}
            <input class="settings__file" type="file" accept="image/*" disabled={busy} onChange={pick} />
          </label>
          {a.me.avatarUrl && (
            <button class="btn btn--quiet settings__remove" type="button" disabled={busy} onClick={() => void run(removeAvatar)}>
              {t('settings.photoRemove')}
            </button>
          )}
        </div>
      )}
      {error && <Status state="off">{error}</Status>}
    </section>
  );
}

export function Settings() {
  const [played, setPlayed] = useState<PlayResult | null>(null);

  const choose = async (next: Voice) => {
    // Касание — единственный момент, когда iPhone разрешает звук.
    player.unlock();
    setVoice(next);
    setPlayed(null);
    setPlayed(await playSample(VOICE_SAMPLE, 'normal', next));
  };

  return (
    <main class="screen screen--tabbed settings">
      <header class="home__hero">
        <h1 class="display">{t('settings.title')}</h1>
      </header>

      <Photo />

      <section class="settings__group" aria-labelledby="settings-voice">
        <p class="eyebrow" id="settings-voice">
          {t('settings.voice')}
        </p>
        <div class="settings__choices" role="radiogroup" aria-labelledby="settings-voice">
          {VOICES.map((v) => (
            <button key={v} class="option settings__choice" type="button" role="radio" aria-checked={voice.value === v} onClick={() => void choose(v)}>
              <Icon name="volume-level-high" set="objects" size={28} />
              <span>{t(LABEL[v])}</span>
            </button>
          ))}
        </div>
        {played === 'missing' && <p class="caption">{t('lesson.audioMissing')}</p>}
        {(played === 'network' || played === 'decode') && <p class="caption">{t('lesson.audioFailed')}</p>}
        {played === 'no-audio-api' && <p class="caption">{t('lesson.audioBlocked')}</p>}
      </section>
    </main>
  );
}
