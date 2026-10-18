import { expect, test, type Page } from '@playwright/test';
import { item, lessons } from '@viet/content';
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
      const r = indexedDB.open('viet-speller', 1);
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
});

test('без микрофона урок не просит говорить', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Не могу говорить' }).click();
  await expect(page.getByRole('button', { name: /Снова говорить/ })).toBeVisible();
  await page.getByRole('button', { name: 'Начать первый урок' }).click();
  await expect(page.locator('main.lesson')).toBeVisible();
  await expect(page.getByText('Урок без микрофона')).toBeVisible();
});
