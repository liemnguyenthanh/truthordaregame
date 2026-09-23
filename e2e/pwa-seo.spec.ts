import { test, expect } from '@playwright/test';

test('Server HTML exposes useful text, canonical and accurate sitemap', async ({ request }) => {
  const response = await request.get('/vi/bo-cau-hoi/ban-be-gan-ket');
  const html = await response.text();
  expect(response.status()).toBe(200);
  expect(html).toContain('Bạn bè gắn kết');
  expect(html).toContain('application/ld+json');
  expect(html).toContain('rel="canonical"');
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).toContain('/vi/bo-cau-hoi/');
  expect(sitemap).not.toContain('/vi/choi/');
  expect(sitemap).not.toContain('/vi/thanh-toan');
  const missing = await request.get('/vi/bo-cau-hoi/khong-ton-tai');
  expect(missing.status()).toBe(404);
  const game = await (await request.get('/vi/choi/ban-be-khoi-dong')).text();
  expect(game).toMatch(/name="robots" content="noindex/);
});
test('JSON headers and private payment API are isolated', async ({ request }) => {
  const catalog = await request.get('/vi/categories.json');
  expect(catalog.headers()['cache-control']).toContain('max-age=0');
  expect(catalog.headers()['x-robots-tag']).toBe('noindex');
  const packs = await (await request.get('/vi/packs.json')).json();
  const pack = await request.get(packs.packs[0].questionFile);
  expect(pack.headers()['cache-control']).toContain('immutable');
  const api = await request.get('/api/entitlements');
  expect(api.headers()['cache-control']).toBe('private, no-store');
});
test('saved pack survives a fresh page offline and still draws questions', async ({
  page,
  context,
}) => {
  await page.goto('/vi/choi/ban-be-khoi-dong');
  await page.getByRole('button', { name: 'Lưu bộ để chơi offline', exact: true }).click();
  await expect(page.getByRole('button', { name: /Đã lưu để chơi offline/ })).toBeVisible({
    timeout: 45000,
  });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('link', { name: 'Bạn bè khởi động', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '☁️ Thật', exact: true }).click();
  await expect(page.getByText('Đã xem 1/100 câu', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
  const fresh = await context.newPage();
  await fresh.goto('/vi');
  await expect(fresh.getByRole('heading', { name: 'Chơi ngay miễn phí' })).toBeVisible();
  await fresh.getByRole('link', { name: 'Chơi ngay miễn phí', exact: true }).click();
  await expect(fresh.getByText('Đã xem 1/100 câu', { exact: true })).toBeVisible();
  await context.setOffline(false);
});
