import { expect, test, type Page } from '@playwright/test';
import { lessons } from '@viet/content';
import { fakeSpeech } from './fake-speech.js';

const stamp = Date.now().toString(36);

/** Всё до рынка включительно — пройдено: журнал кладётся прямо в IndexedDB. */
async function seedUntilMarket(page: Page) {
  const ids = lessons.slice(0, lessons.findIndex((l) => l.id === 'market-1') + 1).map((l) => l.id);
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
  }, ids);
  await page.reload();
}

async function register(page: Page) {
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.getByLabel('Логин (латиница)').fill(`talk-${stamp}`);
  await page.getByLabel('Пароль (от 8 символов)').fill('long-password');
  await page.getByLabel('Имя в семейном рейтинге').fill('Павел');
  await page.locator('form').getByRole('button', { name: 'Регистрация' }).click();
  await expect(page.locator('.family__code')).toBeVisible();
  await page.getByRole('button', { name: 'Учёба' }).click();
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(fakeSpeech);
});

test('собеседник: гостя просит войти, разговор идёт до конца, лимит виден как «отдыхает»', async ({ page }) => {
  const sent: unknown[] = [];
  let mode: 'ok' | 'resting' = 'ok';
  await page.route('**/api/talk', async (route) => {
    const body = route.request().postDataJSON() as { turns: unknown[] };
    sent.push(body);
    if (mode === 'resting') return route.fulfill({ status: 503, json: { statusCode: 503, message: 'Собеседник отдыхает: лимит бесплатного тарифа. Попробуй через минуту, а если не выйдет — завтра' } });
    const first = body.turns.length === 0;
    return route.fulfill({
      json: first
        ? { vi: 'Chào anh, mua gì?', ru: 'Здравствуйте, что берёте?', hint: 'cho tôi một ký xoài', hintRu: 'дайте килограмм манго', done: false }
        : { vi: 'Dạ, cảm ơn anh. Tạm biệt!', ru: 'Спасибо, до свидания!', hint: 'tạm biệt', hintRu: 'до свидания', done: true },
    });
  });

  await page.goto('/');
  await page.getByRole('button', { name: /^Собеседник/ }).click();
  await expect(page.getByText(/работает только после входа/)).toBeVisible();
  await page.getByRole('button', { name: 'Закрыть' }).click();

  await seedUntilMarket(page);
  await register(page);
  await page.getByRole('button', { name: /^Собеседник/ }).click();
  // Рынок открыт, парикмахер — нет: его тема ещё не пройдена.
  await expect(page.getByRole('button', { name: /Парикмахер/ })).toBeDisabled();
  await page.getByRole('button', { name: /Рынок/ }).click();

  await expect(page.locator('.talk__bubble[data-who="npc"]')).toHaveText('Chào anh, mua gì?');
  await page.getByRole('switch', { name: 'Подсказка' }).click();
  await expect(page.locator('.talk__hint')).toContainText('cho tôi một ký xoài');
  if (process.env.SHOTS) await page.screenshot({ path: 'test-results/shots/09-talk-start.png' });
  await page.getByPlaceholder('или напиши').fill('cho tôi một ký xoài');
  await page.getByRole('button', { name: 'Отправить' }).click();
  await expect(page.locator('.talk__bubble[data-who="me"]')).toHaveText('cho tôi một ký xoài');
  await expect(page.getByText('Разговор окончен')).toBeVisible();
  if (process.env.SHOTS) await page.screenshot({ path: 'test-results/shots/09-talk.png' });
  expect(sent[1]).toMatchObject({ scenarioId: 'market', turns: [{ who: 'npc', vi: 'Chào anh, mua gì?' }, { who: 'me', vi: 'cho tôi một ký xoài' }] });

  mode = 'resting';
  await page.getByRole('button', { name: 'Другой разговор' }).click();
  await page.getByRole('button', { name: /Рынок/ }).click();
  await expect(page.getByText(/Собеседник отдыхает/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Повторить' })).toBeVisible();
});
