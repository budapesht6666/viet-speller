import { expect, test, type Page } from '@playwright/test';
import { item, lessons } from '@viet/content';
import { fakeSpeech } from './fake-speech.js';

const stamp = Date.now().toString(36);

async function register(page: Page, login: string, name: string, invite = '') {
  await page.goto('/');
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.getByLabel('Логин (латиница)').fill(login);
  await page.getByLabel('Пароль (от 8 символов)').fill('long-password');
  await page.getByLabel('Имя в семейном рейтинге').fill(name);
  if (invite) await page.getByLabel('Код семьи').fill(invite);
  await page.locator('form').getByRole('button', { name: 'Регистрация' }).click();
  await expect(page.locator('.family__code')).toHaveText(/^[A-Z2-9]{6}$/);
  // Вход виден на вкладке: имя вместо «Войти».
  await page.getByRole('button', { name: 'Учёба' }).click();
  await expect(page.locator('.profile-btn:not(.settings-btn)')).toContainText(name);
  await expect(page.locator('.profile-btn:not(.settings-btn)')).not.toContainText('Войти');
  await page.locator('.profile-btn:not(.settings-btn)').click();
}

/** Проходит первый урок верными ответами. */
async function passFirstLesson(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /Начать первый урок/ }).click();
  for (let i = 0; i < 100; i++) {
    const main = page.locator('main.lesson');
    if (!(await main.count())) break;
    const kind = await main.getAttribute('data-step');
    const phase = await main.getAttribute('data-phase');
    const itemId = await main.getAttribute('data-item');
    if (phase === 'feedback' || kind === 'intro') await page.getByRole('button', { name: 'Дальше' }).click();
    else await page.locator(`.option[data-id="${itemId}"]`).click();
  }
  await expect(page.getByRole('heading', { name: 'Урок пройден' })).toBeVisible();
  await page.getByRole('button', { name: 'На главную' }).click();
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(fakeSpeech);
});

test('семья: регистрация, приглашение, рейтинг, восстановление на новом телефоне', async ({ browser }) => {
  // Телефон Павла: прогресс до входа, потом регистрация — журнал уходит на сервер.
  const phone1 = await browser.newPage();
  await phone1.addInitScript(fakeSpeech);
  await phone1.goto('/');
  await phone1.getByRole('button', { name: 'Войти' }).click();
  await expect(phone1.getByText(/Прогресс только на этом телефоне/)).toBeVisible();
  await passFirstLesson(phone1);
  await register(phone1, `pavel-${stamp}`, 'Павел');
  const invite = (await phone1.locator('.family__code').textContent())!;
  await expect(phone1.locator('.board__row')).toHaveCount(1);
  await expect(phone1.locator('.board__row').first()).toContainText('уроков: 1');

  // Телефон Ани: регистрация по коду — попадает в ту же семью.
  const phone2 = await browser.newPage();
  await phone2.addInitScript(fakeSpeech);
  await register(phone2, `anna-${stamp}`, 'Аня', invite);
  await expect(phone2.locator('.family__code')).toHaveText(invite);
  await expect(phone2.locator('.board__name')).toHaveText(['Павел', 'Аня']);

  // Новый телефон Павла: вход — и пройденный урок на месте.
  const phone3 = await browser.newPage();
  await phone3.goto('/');
  await phone3.getByRole('button', { name: 'Войти' }).click();
  await phone3.getByRole('radio', { name: 'Вход' }).click();
  await phone3.getByLabel('Логин (латиница)').fill(`pavel-${stamp}`);
  await phone3.getByLabel('Пароль (от 8 символов)').fill('long-password');
  await phone3.locator('form').getByRole('button', { name: 'Вход' }).click();
  await expect(phone3.locator('.family__code')).toHaveText(invite);
  await expect(phone3.getByText('Прогресс в семье')).toBeVisible();
  await phone3.getByRole('button', { name: 'Учёба' }).click();
  await expect(phone3.locator('.path__lesson').first()).toContainText('пройден');
});

test('неверный пароль — понятная ошибка, а не тишина', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.getByRole('radio', { name: 'Вход' }).click();
  await page.getByLabel('Логин (латиница)').fill('nobody-here');
  await page.getByLabel('Пароль (от 8 символов)').fill('wrong-password');
  await page.locator('form').getByRole('button', { name: 'Вход' }).click();
  await expect(page.locator('.form__error')).toHaveText('Неверный логин или пароль');
});

test('журнал распознавания: попытки гостя уходят на сервер после входа и видны в профиле', async ({ page }) => {
  await page.goto('/');
  // Всё до цифр — пройдено, чтобы открылся урок с микрофоном.
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
  let said = 0;
  for (let i = 0; i < 100; i++) {
    const main = page.locator('main.lesson');
    if (!(await main.count())) break;
    const kind = await main.getAttribute('data-step');
    const phase = await main.getAttribute('data-phase');
    const itemId = (await main.getAttribute('data-item'))!;
    if (phase === 'feedback' || kind === 'intro') await page.getByRole('button', { name: 'Дальше' }).click();
    else if (kind === 'repeat' || kind === 'say') {
      await page.evaluate((text) => ((window as unknown as { __say: string }).__say = text), item(itemId).vi);
      await page.locator('button.mic').click();
      await expect(main).toHaveAttribute('data-phase', 'feedback', { timeout: 5000 });
      said++;
    } else await page.locator(`.option[data-id="${itemId}"]`).click();
  }
  await expect(page.getByRole('heading', { name: 'Урок пройден' })).toBeVisible();
  expect(said).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'На главную' }).click();

  await register(page, `speech-${stamp}`, 'Голос');
  await expect(page.locator('.speech__name')).toContainText('iPhone');
  await expect(page.locator('.speech__name')).toContainText(`попыток: ${said}`);
});
