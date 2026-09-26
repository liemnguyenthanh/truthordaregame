import { expect, test } from '@playwright/test';
import type { Pack } from '../lib/types';

// These checks use the published catalog, so they also work against production.
test('public pages cache HTML, preserve locales, and leave private APIs uncached', async ({
  request,
}) => {
  for (const path of ['/vi', '/en', '/vi/danh-muc', '/en/categories', '/vi/danh-muc/ban-be']) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    const headers = response.headers();
    expect(headers['cache-control'], path).not.toMatch(/private|no-store/);
    expect(headers['x-vercel-cache'] ?? headers['x-nextjs-cache'], path).toMatch(
      /HIT|MISS|STALE|PRERENDER/,
    );
    expect(await response.text()).toContain(`<html lang="${path.startsWith('/en') ? 'en' : 'vi'}"`);
  }
  const privateResponse = await request.get('/api/entitlements');
  expect(privateResponse.headers()['cache-control']).toContain('private, no-store');
  for (const path of ['/fr', '/vi/choi/does-not-exist', '/en/play/does-not-exist', '/admin']) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(path === '/admin' ? 200 : 404);
  }
});

test('home to game uses client navigation with embedded questions and retains progress', async ({
  page,
  request,
}) => {
  const { packs }: { packs: Pack[] } = await (await request.get('/api/catalog?locale=vi')).json();
  const pack = packs.find((item) => item.tier === 'free')!;
  expect(pack).toBeTruthy();
  const errors: string[] = [];
  const questionRequests: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (req) => {
    if (/\/(?:content\/questions|vi\/questions)\//.test(req.url()))
      questionRequests.push(req.url());
  });
  await page.goto('/vi');
  const origin = await page.evaluate(() => performance.timeOrigin);
  await page.getByRole('link', { name: 'Chơi ngay miễn phí', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/vi/choi/${pack.slug}$`));
  const truth = page.getByRole('button', { name: '☁️ Thật', exact: true });
  await expect(truth).toBeEnabled();
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(origin);
  await truth.click();
  const stateKey = `tod:game:v1:${pack.id}`;
  const progress = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), stateKey);
  expect(progress.seenIds).toHaveLength(1);
  await page.reload();
  await expect(truth).toBeEnabled();
  expect(
    await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).currentId, stateKey),
  ).toBe(progress.currentId);
  expect(questionRequests).toEqual([]);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('categories lead to a playable pack and group shortcut still opens the editor', async ({
  page,
}) => {
  await page.goto('/vi/danh-muc');
  await page.locator('.category-tile').first().click();
  await expect(page.locator('.pack-card').first()).toBeVisible();
  await page.locator('.pack-play').first().click();
  await expect(page.getByRole('button', { name: '☁️ Thật', exact: true })).toBeEnabled();
  await page.goto('/vi');
  await page.getByRole('link', { name: 'Tạo nhóm & chơi →', exact: true }).click();
  await expect(page.getByLabel('Tên nhóm', { exact: true })).toBeVisible();
});

test('a saved live pack opens and plays on a fresh offline page', async ({
  page,
  context,
  request,
}) => {
  const { packs }: { packs: Pack[] } = await (await request.get('/api/catalog?locale=vi')).json();
  const pack = packs.find((item) => item.tier === 'free')!;
  const path = `/vi/choi/${pack.slug}`;
  await page.goto(path);
  await page.getByRole('button', { name: 'Lưu bộ để chơi offline', exact: true }).click();
  await expect(page.getByRole('button', { name: /Đã lưu để chơi offline/ })).toBeVisible({
    timeout: 45000,
  });
  await context.setOffline(true);
  const fresh = await context.newPage();
  await fresh.goto(path);
  await fresh.getByRole('button', { name: '☁️ Thật', exact: true }).click();
  await expect
    .poll(() =>
      fresh.evaluate(
        (key) => JSON.parse(localStorage.getItem(key) || 'null')?.seenIds.length,
        `tod:game:v1:${pack.id}`,
      ),
    )
    .toBe(1);
  await fresh.goto('/vi');
  await fresh.getByRole('link', { name: 'Chơi ngay miễn phí', exact: true }).click();
  await expect(fresh.getByRole('button', { name: '☁️ Thật', exact: true })).toBeEnabled();
  await context.setOffline(false);
});

test('embedded premium questions still enforce the trial limit', async ({ page, request }) => {
  const { packs }: { packs: Pack[] } = await (await request.get('/api/catalog?locale=vi')).json();
  const pack = packs.find((item) => item.tier === 'premium')!;
  expect(pack).toBeTruthy();
  await page.goto(`/vi/choi/${pack.slug}`);
  const stateKey = `tod:game:v1:${pack.id}`;
  // Exhaust both trial types without allowing access to the paid questions.
  for (const name of ['☁️ Thật', '💖 Thách']) {
    for (let i = 0; i <= pack.trialCount; i++) {
      const button = page.getByRole('button', { name, exact: true });
      if (!(await button.isEnabled())) break;
      await button.click();
      await page.waitForTimeout(270);
    }
  }
  await expect(page.getByRole('status')).toContainText('Bạn đã xem hết các câu chơi thử.');
  const progress = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), stateKey);
  expect(progress.trialSeenIds).toHaveLength(pack.trialCount);
  expect(progress.seenIds).toHaveLength(pack.trialCount);
});
