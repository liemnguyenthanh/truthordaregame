import { test, expect } from '@playwright/test';

test('premium access expires while the game remains open offline and legacy cache cannot unlock', async ({
  page,
  request,
  context,
}) => {
  const catalog = await (await request.get('/api/catalog?locale=vi')).json();
  const pack = catalog.packs.find((p: { tier: string }) => p.tier === 'premium');
  const now = Date.now();
  await page.clock.install({ time: new Date(now) });
  await page.route('**/api/entitlements', (route) =>
    route.fulfill({
      json: {
        packIds: [pack.id],
        purchases: [{ packId: pack.id, expiresAt: new Date(now + 60000).toISOString() }],
      },
    }),
  );
  await page.goto(`/vi/choi/${pack.slug}`);
  await expect(page.getByText('Đã mở khóa', { exact: true })).toBeVisible();
  await context.setOffline(true);
  await page.clock.fastForward(60001);
  await expect(page.getByText('Đã mở khóa', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Mua/ }).first()).toBeVisible();
  await context.setOffline(false);
  await page.unroute('**/api/entitlements');
  await page.route('**/api/entitlements', (route) => route.abort());
  await page.evaluate((id) => {
    localStorage.removeItem('tod:owned:v2');
    localStorage.setItem('tod:owned:v1', JSON.stringify([id]));
  }, pack.id);
  await page.reload();
  await expect(page.getByText('Đã mở khóa', { exact: true })).toHaveCount(0);
});

test('an old paid order with expired access allows a new purchase', async ({ page, request }) => {
  const catalog = await (await request.get('/api/catalog?locale=vi')).json();
  const pack = catalog.packs.find((p: { tier: string }) => p.tier === 'premium');
  await page.addInitScript((id) => localStorage.setItem(`tod:order:v1:${id}`, 'old-paid'), pack.id);
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/catalog') return route.fulfill({ json: catalog });
    if (path === '/api/session') return route.fulfill({ json: { ok: true } });
    if (path === '/api/entitlements')
      return route.fulfill({ json: { packIds: [], purchases: [] } });
    if (path.startsWith('/api/products/'))
      return route.fulfill({ json: { packId: pack.id, priceVnd: 30000, available: true } });
    if (path === '/api/orders/old-paid')
      return route.fulfill({
        json: {
          order: {
            id: 'old-paid',
            packId: pack.id,
            status: 'paid',
            accessExpiresAt: new Date(Date.now() - 1000).toISOString(),
          },
        },
      });
    if (path === '/api/orders')
      return route.fulfill({
        json: {
          order: {
            id: 'renewal',
            packId: pack.id,
            status: 'pending',
            amountVnd: 30000,
            expiresAt: new Date(Date.now() + 900000).toISOString(),
            qrUrl: '/icons/icon-192.png',
            paymentCode: 'TODRENEW',
            bankName: 'TEST',
            accountNumber: '123',
            accountName: 'TEST',
          },
        },
      });
    return route.abort();
  });
  await page.goto(`/vi/thanh-toan?pack=${pack.id}`);
  await expect(page.getByRole('heading', { name: 'Bộ câu hỏi đã mở khóa!' })).toHaveCount(0);
  await page.getByRole('button', { name: /Tạo mã QR/ }).click();
  await expect(page.getByRole('img', { name: /Mã QR thanh toán/ })).toBeVisible();
});
