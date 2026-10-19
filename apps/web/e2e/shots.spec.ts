/**
 * Снимки экранов для глаз, не проверка: `npx playwright test shots`.
 * Кладутся в test-results/shots (в git не попадают).
 */

import { test } from '@playwright/test';
import { fakeSpeech } from './fake-speech.js';

const OUT = 'test-results/shots';

test.skip(!process.env.SHOTS, 'снимки — только по SHOTS=1');
// Chromium, а не WebKit: сборка WebKit для Windows не знает ось веса
// вариативного шрифта и AudioContext — снимки врали бы о виде на iPhone.
test.use({ browserName: 'chromium' });

test('снимки', async ({ page }) => {
  await page.addInitScript(fakeSpeech);
  await page.goto('/');
  await page.waitForSelector('.path__lesson');
  await page.waitForSelector('#boot', { state: 'detached' });
  await page.screenshot({ path: `${OUT}/01-home.png`, fullPage: true });

  await page.getByRole('button', { name: 'Начать первый урок' }).click();
  const seen = new Set<string>();
  for (let i = 0; i < 40; i++) {
    const main = page.locator('main.lesson');
    if (!(await main.count())) break;
    const kind = (await main.getAttribute('data-step'))!;
    const phase = (await main.getAttribute('data-phase'))!;
    const key = `${kind}-${phase}`;
    if (!seen.has(key)) {
      seen.add(key);
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${OUT}/02-${key}.png` });
    }
    const itemId = (await main.getAttribute('data-item'))!;
    if (phase === 'feedback' || kind === 'intro') await page.getByRole('button', { name: 'Дальше' }).click();
    else {
      // Нарочно ошибаемся один раз — чтобы увидеть вид промаха.
      const wrong = seen.has('miss') ? null : page.locator(`.option:not([data-id="${itemId}"])`).first();
      if (wrong && (await wrong.count())) {
        seen.add('miss');
        await wrong.click();
        await page.screenshot({ path: `${OUT}/03-miss.png` });
      } else await page.locator(`.option[data-id="${itemId}"]`).click();
    }
  }
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/04-done.png` });

  await page.getByRole('button', { name: 'На главную' }).click();
  await page.screenshot({ path: `${OUT}/05-tab-learn.png` });
  for (const [tab, file] of [['Разговорник', '06-tab-book'], ['Успехи', '07-tab-progress'], ['Войти', '08-tab-profile']] as const) {
    await page.locator('.tabbar').getByRole('button', { name: tab }).click();
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${OUT}/${file}.png` });
  }
});
