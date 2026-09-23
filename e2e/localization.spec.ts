import { expect, test } from '@playwright/test';

const enGame = '/en/play/ban-be-khoi-dong';
const viGame = '/vi/choi/ban-be-khoi-dong';

test('both languages expose server-rendered content, reciprocal SEO and English canonical redirects', async ({
  request,
  baseURL,
}) => {
  for (const locale of ['vi', 'en']) {
    const response = await request.get(`/${locale}`);
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain(`<html lang="${locale}"`);
    expect(html).toContain(`rel="canonical" href="${baseURL}/${locale}"`);
    expect(html).toContain('hrefLang="vi"');
    expect(html).toContain('hrefLang="en"');
    expect(html).toContain('hrefLang="x-default"');
    expect(html).toContain(locale === 'en' ? 'Less awkward.' : 'Bớt ngại ngùng.');
  }
  const redirect = await request.get('/en/cach-choi', { maxRedirects: 0 });
  expect(redirect.status()).toBe(308);
  expect(redirect.headers().location).toBe('/en/how-to-play');
  expect((await request.get('/en/how-to-play')).status()).toBe(200);
  expect((await request.get('/fr')).status()).toBe(404);
  const catalog = await request.get('/api/catalog?locale=en');
  const data = await catalog.json();
  expect(data.packs).toHaveLength(3);
  expect(data.packs.every((pack: { locale: string }) => pack.locale === 'en')).toBe(true);
  expect((await request.get('/api/catalog?locale=fr')).status()).toBe(400);
});

test('sitemap contains only real editorial pages and every private flow remains noindex', async ({
  request,
}) => {
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).toContain('/en/packs/ban-be-khoi-dong');
  expect(sitemap).toContain('/vi/bo-cau-hoi/ban-be-khoi-dong');
  expect(sitemap).not.toContain('/en/play/');
  for (const path of [enGame, '/en/checkout', '/en/restore', '/en/create-ai-pack', '/en/ai-pack']) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect(await response.text(), path).toMatch(/name="robots" content="noindex/);
  }
  const manifest = await (await request.get('/en/manifest.webmanifest')).json();
  expect(manifest.lang).toBe('en');
  expect(manifest.start_url).toBe('/en');
  expect(manifest.id).toBe('/vi');
});

test('switching language retains the current question, group query, and shared progress', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(enGame);
  await page.getByRole('button', { name: '☁️ Truth', exact: true }).click();
  const progress = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('tod:game:v1:friends-free') || 'null'),
  );
  expect(progress.seenIds).toHaveLength(1);
  await page.getByRole('link', { name: 'Chuyển sang tiếng Việt' }).click();
  await expect(page).toHaveURL(new RegExp(`${viGame}$`));
  await expect(page.locator('html')).toHaveAttribute('lang', 'vi');
  await expect(page.getByText('Đã xem 1/100 câu', { exact: true })).toBeVisible();
  const after = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('tod:game:v1:friends-free') || 'null'),
  );
  expect(after.currentId).toBe(progress.currentId);
  await page.goto(`${viGame}?group=1`);
  await page.getByRole('link', { name: 'Switch to English' }).click();
  await expect(page).toHaveURL(new RegExp(`${enGame}\\?group=1$`));
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByLabel('Group name', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('English gameplay and language switch fit a narrow mobile screen', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/en');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('link', { name: 'Play for free', exact: true }).click();
  await page.getByRole('button', { name: '☁️ Truth', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByRole('link', { name: 'Chuyển sang tiếng Việt' })).toBeVisible();
});

test('English pack and fallback remain English on a new offline page', async ({
  page,
  context,
}) => {
  await page.goto(enGame);
  await page.getByRole('button', { name: 'Save pack for offline play', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Saved for offline play · Save again', exact: true }),
  ).toBeVisible({ timeout: 45000 });
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBe(true);
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('tod:offline:v1') || '[]'),
  );
  expect(saved[0].locale).toBe('en');
  await context.setOffline(true);
  const fresh = await context.newPage();
  await fresh.goto(enGame);
  await expect(fresh.locator('html')).toHaveAttribute('lang', 'en');
  await fresh.getByRole('button', { name: '☁️ Truth', exact: true }).click();
  await expect
    .poll(() =>
      fresh.evaluate(
        () =>
          JSON.parse(localStorage.getItem('tod:game:v1:friends-free') || 'null')?.seenIds.length,
      ),
    )
    .toBe(1);
  await fresh.goto('/en/not-cached');
  await expect(fresh.locator('html')).toHaveAttribute('lang', 'en');
  await expect(
    fresh.getByRole('heading', { name: 'No connection? Keep the game going.' }),
  ).toBeVisible();
  await expect(fresh.locator('#packs a').first()).toHaveAttribute('href', enGame);
  await context.setOffline(false);
});
