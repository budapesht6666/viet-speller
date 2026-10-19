/**
 * ИИ-собеседник (PLAN.md, этап 11): ролевой разговор голосом.
 *
 * Модель — на сервере, ключ — там же. Телефон хранит разговор у себя и
 * присылает его целиком: сервер ничего не запоминает. Говорит человек
 * голосом, а если микрофона нет — пишет. Реплики собеседника — текстом:
 * синтеза в рантайме нет (CLAUDE.md, «Озвучка»).
 *
 * Лимит бесплатного тарифа — не поломка: у него свой вид.
 */

import { scenarios, topics, type Scenario } from '@viet/content';
import { useEffect, useRef, useState } from 'preact/hooks';
import { useOnline } from '../components/AppStatus.js';
import { MicButton, Status } from '../components/ui.js';
import { Listener, type ListenStatus } from '../speech/listen.js';
import { recognitionBlocker } from '../speech/recognizer.js';
import { go, noMic, progress } from '../store/app.js';
import { account, api, ApiError } from '../store/sync.js';
import { t } from '../strings.js';

interface NpcTurn {
  who: 'npc';
  vi: string;
  ru: string;
  hint: string;
  hintRu: string;
}
interface MyTurn {
  who: 'me';
  vi: string;
}
type Turn = NpcTurn | MyTurn;

type Reply = { vi: string; ru: string; hint: string; hintRu: string; done: boolean };

/** Сценарий открыт, когда пройден первый урок его темы. */
function opensAfter(sc: Scenario) {
  return topics.find((tp) => tp.id === sc.topicId)!.lessons[0]!;
}

function Picker({ onPick }: { onPick: (sc: Scenario) => void }) {
  const done = progress.value.doneLessons;
  return (
    <>
      <ul class="talk__list">
        {scenarios.map((sc) => {
          const first = opensAfter(sc);
          const open = done.has(first.id);
          return (
            <li key={sc.id}>
              <button class="card talk__scenario" type="button" disabled={!open} onClick={() => onPick(sc)}>
                <span class="h2">{sc.title}</span>
                <span class="caption">{open ? sc.goal : `${t('talk.locked')} «${first.title}»`}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <p class="caption">{t('talk.privacy')}</p>
    </>
  );
}

function Chat({ sc, onBack }: { sc: Scenario; onBack: () => void }) {
  const online = useOnline();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState<{ text: string; resting: boolean } | null>(null);
  const [finished, setFinished] = useState(false);
  const [showRu, setShowRu] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [listen, setListen] = useState<ListenStatus>('idle');
  const [heard, setHeard] = useState<'none' | 'miss'>('none');
  const [typed, setTyped] = useState('');
  const listener = useRef(new Listener());
  const end = useRef<HTMLDivElement>(null);
  const canSpeak = !noMic.value && recognitionBlocker() === 'none';

  useEffect(() => () => listener.current.cancel(), []);
  useEffect(() => end.current?.scrollIntoView({ block: 'end' }), [turns.length, waiting, error]);

  const ask = async (history: Turn[]) => {
    setWaiting(true);
    setError(null);
    try {
      const r = await api<Reply>('/talk', { scenarioId: sc.id, turns: history.map(({ who, vi }) => ({ who, vi })) });
      setTurns([...history, { who: 'npc', vi: r.vi, ru: r.ru, hint: r.hint, hintRu: r.hintRu }]);
      setShowHint(false);
      setFinished(r.done);
    } catch (e) {
      const resting = e instanceof ApiError && e.status === 503;
      setError({ text: e instanceof ApiError ? e.message : t('talk.failed'), resting });
    } finally {
      setWaiting(false);
    }
  };

  // Собеседник начинает первым.
  useEffect(() => void ask([]), []);

  const say = (text: string) => {
    const vi = text.trim();
    if (!vi || waiting) return;
    const next: Turn[] = [...turns, { who: 'me', vi }];
    setTurns(next);
    setTyped('');
    void ask(next);
  };

  /** Только из касания: сессия без касания на iPhone глухая. */
  const speak = () => {
    setHeard('none');
    let text = '';
    listener.current.start({
      onText: (all) => {
        text = all;
        return false;
      },
      onStatus: setListen,
      onMiss: () => {
        setListen('idle');
        if (text.trim()) say(text);
        else setHeard('miss');
      },
    });
  };

  const last = [...turns].reverse().find((x): x is NpcTurn => x.who === 'npc');

  return (
    <>
      <div class="card talk__goal">
        <p class="eyebrow">{sc.title}</p>
        <p class="caption">{sc.goal}</p>
      </div>

      <div class="talk__log" aria-live="polite">
        {turns.map((turn, i) =>
          turn.who === 'npc' ? (
            <div key={i} class="talk__bubble" data-who="npc">
              <p class="talk__vi" lang="vi">
                {turn.vi}
              </p>
              {showRu && <p class="caption">{turn.ru}</p>}
            </div>
          ) : (
            <div key={i} class="talk__bubble" data-who="me">
              <p class="talk__vi" lang="vi">
                {turn.vi}
              </p>
            </div>
          ),
        )}
        {waiting && <Status state="wait">{t('talk.thinking')}</Status>}
        {error && (
          <div class="talk__error">
            <Status state={error.resting ? 'wait' : 'off'}>{error.text}</Status>
            <button class="btn btn--quiet" type="button" onClick={() => void ask(turns)}>
              {t('talk.retry')}
            </button>
          </div>
        )}
        <div ref={end} />
      </div>

      {!online && <Status state="off">{t('talk.offline')}</Status>}

      {finished ? (
        <div class="talk__bar">
          <Status state="ok">{t('talk.finished')}</Status>
          <button class="btn btn--cta" type="button" onClick={onBack}>
            {t('talk.another')}
          </button>
        </div>
      ) : (
        <div class="talk__bar">
          <div class="goal">
            <button class="chip" type="button" role="switch" aria-checked={showRu} onClick={() => setShowRu(!showRu)}>
              {t('talk.translation')}
            </button>
            <button class="chip" type="button" role="switch" aria-checked={showHint} disabled={!last} onClick={() => setShowHint(!showHint)}>
              {t('talk.hint')}
            </button>
          </div>
          {showHint && last && (
            <p class="talk__hint">
              <span lang="vi">{last.hint}</span>
              <span class="caption"> — {last.hintRu}</span>
            </p>
          )}
          {canSpeak && (
            <>
              <MicButton status={listen} onTap={speak} disabled={waiting} />
              {listen === 'blocked' && <p class="caption">{t('lesson.blocked')}</p>}
              {listen === 'offline' && <p class="caption">{t('lesson.offline')}</p>}
              {listen === 'error' && <p class="caption">{t('lesson.micError')}</p>}
              {heard === 'miss' && listen === 'idle' && <p class="caption">{t('talk.notHeard')}</p>}
            </>
          )}
          <form
            class="talk__type"
            onSubmit={(e) => {
              e.preventDefault();
              say(typed);
            }}
          >
            <input class="input" lang="vi" placeholder={canSpeak ? t('talk.orType') : t('talk.type')} value={typed} onInput={(e) => setTyped((e.target as HTMLInputElement).value)} />
            <button class="btn btn--quiet" type="submit" disabled={!typed.trim() || waiting}>
              {t('talk.send')}
            </button>
          </form>
        </div>
      )}
    </>
  );
}

export function Talk() {
  const a = account.value;
  const [sc, setSc] = useState<Scenario | null>(null);
  return (
    <main class="screen talk">
      <header class="lesson__top">
        <button class="lesson__close" type="button" aria-label={t('talk.close')} onClick={() => (sc ? setSc(null) : go({ name: 'home' }))}>
          <span aria-hidden="true">×</span>
        </button>
        <h1 class="h2">{t('talk.title')}</h1>
      </header>
      {a.state === 'unknown' && <Status state="wait">{t('family.loading')}</Status>}
      {a.state === 'offline' && <Status state="off">{t('talk.offline')}</Status>}
      {a.state === 'guest' && (
        <>
          <p class="lead">{t('talk.needLogin')}</p>
          <button class="btn btn--cta" type="button" onClick={() => go({ name: 'family' })}>
            {t('tab.signIn')}
          </button>
        </>
      )}
      {a.state === 'user' && (sc ? <Chat key={sc.id} sc={sc} onBack={() => setSc(null)} /> : <Picker onPick={setSc} />)}
    </main>
  );
}
