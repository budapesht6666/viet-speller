import { expect, test, type Page } from '@playwright/test';
import { audioFile, item, lessons } from '@viet/content';
import { fakeSpeech } from './fake-speech.js';

/** Отвечает на текущий шаг верно. Возвращает false, когда урок кончился. */
async function answerStep(page: Page): Promise<boolean> {
  const main = page.locator('main.lesson');
  if (!(await main.count())) return false;
  const kind = await main.getAttribute('data-step');
  const itemId = (await main.getAttribute('data-item'))!;
  const phase = await main.getAttribute('data-phase');
  if (phase === 'feedback' || kind === 'intro') {
    await page.getByRole('button', { name: 'Дальше' }).click();
    return true;
  }
  if (kind === 'hear' || kind === 'meaning' || kind === 'tone') {
    await page.locator(`.option[data-id="${itemId}"]`).click();
    return true;
  }
  if (kind === 'build') {
    for (const tile of item(itemId).vi.toLowerCase().split(/\s+/)) {
      await page.locator('.tiles__pool .tile:not([disabled])', { hasText: new RegExp(`^${tile}$`) }).first().click();
    }
    await page.getByRole('button', { name: 'Проверить' }).click();
    return true;
  }
  // repeat / say: «сказать» верно
  await page.evaluate((text) => ((window as unknown as { __say: string }).__say = text), item(itemId).vi);
  await page.locator('button.mic').click();
  await expect(main).toHaveAttribute('data-phase', 'feedback', { timeout: 5000 });
  return true;
}

async function playLesson(page: Page) {
  for (let guard = 0; guard < 200 && (await answerStep(page)); guard++);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(fakeSpeech);
});

test('первый урок: проходится, итог сохраняется и переживает перезагрузку', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/');
  await page.getByRole('button', { name: 'Начать первый урок' }).click();
  await expect(page.locator('main.lesson')).toBeVisible();
  // Первый урок — только на слух: кнопки «Сказать» в нём нет.
  await expect(page.locator('button.mic')).toHaveCount(0);
  await playLesson(page);

  await expect(page.getByRole('heading', { name: 'Урок пройден' })).toBeVisible();
  await expect(page.locator('.stat__value').first()).toHaveText('100%');
  // Урок без ошибок — ачивка видна сразу на итоге.
  await expect(page.locator('.done__badges')).toContainText('Без единой ошибки');
  await page.getByRole('button', { name: 'На главную' }).click();

  const first = page.locator('.path__lesson').first();
  await expect(first).toContainText('пройден');
  await page.getByRole('button', { name: 'Успехи' }).click();
  await expect(page.locator('.stat__value').first()).toHaveText('1'); // серия дней
  await page.reload();
  await expect(page.locator('.path__lesson').first()).toContainText('пройден');
  await expect(page.getByRole('button', { name: /Продолжить/ })).toContainText(lessons[1]!.title);
  expect(errors).toEqual([]);
});

test('урок с микрофоном: «повтори» и «скажи» засчитываются, сессии — только по касанию', async ({ page }) => {
  await page.goto('/');
  // Всё до цифр — пройдено: журнал кладётся прямо в IndexedDB.
  const before = lessons.slice(0, lessons.findIndex((l) => l.id === 'numbers-1')).map((l) => l.id);
  await page.evaluate(async (ids) => {
    const db = await new Promise<IDBDatabase>((ok, fail) => {
      const r = indexedDB.open('viet-speller');
      r.onsuccess = () => ok(r.result);
      r.onerror = () => fail(r.error);
    });
    const tx = db.transaction('events', 'readwrite');
    ids.forEach((lessonId, i) =>
      tx.objectStore('events').put({ id: `seed-${i}`, at: new Date(Date.now() - 86_400_000).toISOString(), seconds: 120, type: 'lesson-done', lessonId, grades: {}, accuracy: 1, mic: false }),
    );
    await new Promise((ok) => (tx.oncomplete = ok));
  }, before);
  await page.reload();

  await page.getByRole('button', { name: /Продолжить: 0–5/ }).click();
  await expect(page.locator('main.lesson[data-step="repeat"]')).toBeVisible();
  await playLesson(page);
  await expect(page.getByRole('heading', { name: 'Урок пройден' })).toBeVisible();

  const { sessions, deaf } = await page.evaluate(() => ({ sessions: (window as any).__sessions, deaf: (window as any).__deaf }));
  expect(sessions).toBeGreaterThan(0);
  // Ни одной сессии без касания: на iPhone они глухие.
  expect(deaf).toBe(0);

  // Каждая попытка — в журнале распознавания: что услышано и чей движок.
  const attempts = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((ok, fail) => {
      const r = indexedDB.open('viet-speller');
      r.onsuccess = () => ok(r.result);
      r.onerror = () => fail(r.error);
    });
    const req = db.transaction('speech').objectStore('speech').getAll();
    return new Promise<Array<{ itemId: string; heard: string; engine: string }>>((ok) => (req.onsuccess = () => ok(req.result)));
  });
  expect(attempts).toHaveLength(sessions);
  for (const a of attempts) expect(a).toMatchObject({ heard: item(a.itemId).vi, engine: 'apple' });
});

test('без микрофона урок не просит говорить', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('switch', { name: 'Не могу говорить' }).click();
  await expect(page.getByRole('switch', { name: /Снова говорить/ })).toBeVisible();
  await page.getByRole('button', { name: 'Начать первый урок' }).click();
  await expect(page.locator('main.lesson')).toBeVisible();
  await expect(page.getByText('Урок без микрофона')).toBeVisible();
});

test('разговорник: пройденное ищется по-русски, показывается собеседнику, избранное сохраняется', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Начать первый урок' }).click();
  await playLesson(page);
  await page.getByRole('button', { name: 'На главную' }).click();

  await page.getByRole('button', { name: 'Разговорник' }).click();
  await expect(page.locator('.book__entry')).toHaveCount(5);
  await page.getByPlaceholder('Поиск по-русски или по-вьетнамски').fill('далеко');
  await expect(page.locator('.book__entry')).toHaveCount(1);
  // Поиск по-вьетнамски — и без знаков: на телефоне без вьетнамской клавиатуры их не набрать.
  await page.getByPlaceholder('Поиск по-русски или по-вьетнамски').fill('ve');
  await expect(page.locator('.book__vi')).toHaveText(['về']);

  await page.locator('.book__fav').first().click();
  await page.locator('.book__entry').first().click();
  await expect(page.locator('.show__vi')).toHaveText('về');
  await page.getByRole('button', { name: 'Перевернуть для собеседника' }).click();
  await expect(page.locator('.show__card')).toHaveAttribute('data-flipped', 'true');
  await page.getByRole('button', { name: 'Закрыть' }).click();

  await page.reload();
  await page.getByRole('button', { name: 'Разговорник' }).click();
  await page.getByRole('switch', { name: 'Только избранное' }).click();
  await expect(page.locator('.book__vi')).toHaveText(['về']);
});

test('главная: только последняя открытая тема, закрытых не видно, другую выбирают на «Темах»', async ({ page }) => {
  await page.goto('/');
  // Новичок: одна тема — алфавит, кнопки «Все темы» нет.
  await expect(page.locator('.path__topic .eyebrow')).toHaveText('Алфавит и звуки');
  await expect(page.getByRole('button', { name: /Все темы/ })).toHaveCount(0);

  const before = lessons.slice(0, lessons.findIndex((l) => l.id === 'numbers-1')).map((l) => l.id);
  await page.evaluate(async (ids) => {
    const db = await new Promise<IDBDatabase>((ok, fail) => {
      const r = indexedDB.open('viet-speller');
      r.onsuccess = () => ok(r.result);
      r.onerror = () => fail(r.error);
    });
    const tx = db.transaction('events', 'readwrite');
    ids.forEach((lessonId, i) =>
      tx.objectStore('events').put({ id: `seed-${i}`, at: new Date(Date.now() - 86_400_000).toISOString(), seconds: 120, type: 'lesson-done', lessonId, grades: {}, accuracy: 1, mic: false }),
    );
    await new Promise((ok) => (tx.oncomplete = ok));
  }, before);
  await page.reload();

  await expect(page.locator('.path__topic .eyebrow')).toHaveText('Цифры и цены');
  await expect(page.getByText('Кафе и уличная еда')).toHaveCount(0);
  await page.getByRole('button', { name: /Все темы \(3\)/ }).click();
  await expect(page.locator('.topics__item')).toHaveCount(3);
  await page.locator('.topics__item', { hasText: 'Алфавит и звуки' }).click();
  await expect(page.locator('.path__topic .eyebrow')).toHaveText('Алфавит и звуки');
});

test('настройки: голос выбирается на слух, запоминается и звучит в уроке', async ({ page }) => {
  // В сборке WebKit для Windows нет AudioContext, образец играет <audio>, а
  // его загрузку Playwright не видит. Поэтому запоминаем, что ему дали играть.
  await page.addInitScript(() => {
    const played: string[] = [];
    (window as unknown as { __played: string[] }).__played = played;
    HTMLMediaElement.prototype.play = function () {
      played.push(this.src);
      return Promise.resolve();
    };
  });
  const played = () => page.evaluate(() => (window as unknown as { __played: string[] }).__played);
  const file = (text: string) => `/audio/${audioFile(text, 'normal', 'vi-VN-NamMinhNeural')}`;

  await page.goto('/');
  await page.getByRole('button', { name: 'Настройки' }).click();
  await expect(page.getByRole('radio', { name: 'Женский' })).toHaveAttribute('aria-checked', 'true');

  // Касание варианта сразу его озвучивает — образцом этого голоса.
  await page.getByRole('radio', { name: 'Мужской' }).click();
  await expect(page.getByRole('radio', { name: 'Мужской' })).toHaveAttribute('aria-checked', 'true');
  await expect.poll(played).toEqual([expect.stringContaining(file('xin chào'))]);

  await page.reload();
  await page.getByRole('button', { name: 'Настройки' }).click();
  await expect(page.getByRole('radio', { name: 'Мужской' })).toHaveAttribute('aria-checked', 'true');

  // В уроке — тот же голос: первый образец первого урока.
  await page.getByRole('button', { name: 'Учёба' }).click();
  await page.getByRole('button', { name: 'Начать первый урок' }).click();
  await expect.poll(played).toEqual([expect.stringContaining(file(item(lessons[0]!.items[0]!).vi))]);
});

test('обновление базы телефона: журнал версии 1 переживает переход на версию 2', async ({ page }) => {
  // База, как у семьи до журнала распознавания: создаётся на странице без приложения.
  await page.goto('/icons/icon.svg');
  await page.evaluate(async (lessonId) => {
    const db = await new Promise<IDBDatabase>((ok, fail) => {
      const r = indexedDB.open('viet-speller', 1);
      r.onupgradeneeded = () => {
        r.result.createObjectStore('events', { keyPath: 'id' });
        r.result.createObjectStore('outbox', { keyPath: 'id' });
        r.result.createObjectStore('settings');
      };
      r.onsuccess = () => ok(r.result);
      r.onerror = () => fail(r.error);
    });
    const tx = db.transaction(['events', 'settings'], 'readwrite');
    tx.objectStore('events').put({ id: 'old-1', at: new Date().toISOString(), seconds: 120, type: 'lesson-done', lessonId, grades: {}, accuracy: 1, mic: false });
    tx.objectStore('settings').put(20, 'dailyGoal');
    await new Promise((ok) => (tx.oncomplete = ok));
    db.close();
  }, lessons[0]!.id);

  await page.goto('/');
  await expect(page.locator('.path__lesson').first()).toContainText('пройден');
  await expect(page.locator('.home__today')).toContainText('из 20');
  const stores = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((ok) => {
      const r = indexedDB.open('viet-speller');
      r.onsuccess = () => ok(r.result);
    });
    return { version: db.version, stores: [...db.objectStoreNames].sort() };
  });
  expect(stores).toEqual({ version: 2, stores: ['events', 'outbox', 'settings', 'speech'] });
});
