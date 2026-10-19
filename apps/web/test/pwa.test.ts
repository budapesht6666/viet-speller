import { describe, expect, it } from 'vitest';
import { workerTracker } from '../src/store/pwa.js';

class FakeWorker {
  state: ServiceWorkerState = 'installing';
  private listeners: Array<() => void> = [];
  addEventListener(_: string, fn: () => void) {
    this.listeners.push(fn);
  }
  to(state: ServiceWorkerState) {
    this.state = state;
    this.listeners.forEach((fn) => fn());
  }
}

describe('значок фонового обновления', () => {
  const setup = () => {
    const seen: boolean[] = [];
    const track = workerTracker((busy) => seen.push(busy));
    return { seen, track, now: () => seen.at(-1) };
  };

  it('горит, пока воркер качает и встаёт, гаснет, когда встал', () => {
    const { track, now } = setup();
    const w = new FakeWorker();
    track(w as unknown as ServiceWorker);
    expect(now()).toBe(true);
    w.to('installed');
    expect(now()).toBe(true);
    w.to('activating');
    expect(now()).toBe(true);
    w.to('activated');
    expect(now()).toBe(false);
  });

  it('гаснет и при неудаче установки', () => {
    const { track, now } = setup();
    const w = new FakeWorker();
    track(w as unknown as ServiceWorker);
    w.to('redundant');
    expect(now()).toBe(false);
  });

  it('два обновления подряд: горит, пока не встанут оба', () => {
    const { track, now } = setup();
    const a = new FakeWorker();
    const b = new FakeWorker();
    track(a as unknown as ServiceWorker);
    track(b as unknown as ServiceWorker);
    a.to('redundant');
    expect(now()).toBe(true);
    b.to('activated');
    expect(now()).toBe(false);
  });

  it('нет воркера — нет значка; тот же воркер дважды не считается', () => {
    const { track, seen } = setup();
    track(null);
    expect(seen).toEqual([]);
    const w = new FakeWorker();
    w.state = 'activated';
    track(w as unknown as ServiceWorker);
    track(w as unknown as ServiceWorker);
    expect(seen).toEqual([false]);
  });
});
