/**
 * Настройки — шестерёнка в шапке «Учёбы». Пока одна: голос озвучки.
 *
 * Голос у каждого свой: кому-то понятнее женский, кому-то мужской. Весь
 * контент записан обоими, поэтому смена голоса работает и без сети.
 * Касание варианта сразу его озвучивает: выбирают на слух, а не по названию.
 */

import { VOICE_SAMPLE, VOICES, type Voice } from '@viet/content';
import { useState } from 'preact/hooks';
import { playSample, player, type PlayResult } from '../audio/samples.js';
import { Icon } from '../components/ui.js';
import { setVoice, voice } from '../store/app.js';
import { t, type StringKey } from '../strings.js';

const LABEL: Record<Voice, StringKey> = {
  'vi-VN-HoaiMyNeural': 'settings.voice.female',
  'vi-VN-NamMinhNeural': 'settings.voice.male',
};

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

      <section class="settings__group" aria-labelledby="settings-voice">
        <p class="eyebrow" id="settings-voice">
          {t('settings.voice')}
        </p>
        <p class="caption">{t('settings.voiceHint')}</p>
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
