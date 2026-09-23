import { expect, test } from '@playwright/test';
import { getPacks } from '../lib/content';

test.use({ serviceWorkers: 'block' });
for (const locale of ['vi', 'en'] as const) {
  test(`${locale}: compact checkout, manual transfer, offline and late payment`, async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width: 320, height: 740 });
    let status = 'pending';
    let reads = 0;
    const packs = getPacks(locale);
    const pack = packs.find((p) => p.tier === 'premium')!;
    const order = {
      id: 'ux-order',
      packId: pack.id,
      status: 'pending',
      amountVnd: 30000,
      expiresAt: new Date(Date.now() + 900000).toISOString(),
      paymentCode: 'TOD123456ABCD',
      qrUrl: '/icons/icon-192.png',
      bankName: 'MBBank',
      accountNumber: '1234567890123456',
      accountName: 'NGUYEN VAN TEST',
      recoveryCode: 'ABCD'.repeat(8),
    };
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.route('**/api/**', async (route) => {
      const url = new URL(route.request().url());
      let data: unknown;
      if (url.pathname === '/api/catalog') data = { packs };
      else if (url.pathname.startsWith('/api/products/'))
        data = { packId: pack.id, priceVnd: 30000, available: true };
      else if (url.pathname === '/api/session') data = { ok: true };
      else if (url.pathname === '/api/entitlements') data = { packIds: [], purchases: [] };
      else if (url.pathname === '/api/orders') data = { order };
      else if (url.pathname === '/api/orders/ux-order') {
        reads++;
        data = { order: { ...order, status } };
      } else return route.fulfill({ status: 404, json: { error: 'Unexpected request' } });
      await route.fulfill({ json: data });
    });
    await page.goto(`${locale === 'vi' ? '/vi/thanh-toan' : '/en/checkout'}?pack=${pack.id}`);
    await page.getByRole('button', { name: locale === 'vi' ? /Tạo mã QR ·/ : /Create QR/ }).click();
    await expect(
      page.getByRole('img', { name: locale === 'vi' ? /Mã QR thanh toán/ : /QR payment code/ }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: locale === 'vi' ? /Tạo mã QR ·/ : /Create QR/ }),
    ).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: `test-results/checkout-${locale}-qr.png`, fullPage: true });
    await page
      .getByRole('button', {
        name: locale === 'vi' ? 'Chuyển khoản thủ công' : 'Transfer manually',
        exact: true,
      })
      .click();
    await expect(page.getByText(order.paymentCode, { exact: true })).toBeVisible();
    await expect(
      page.getByRole('button', {
        name: locale === 'vi' ? 'Sao chép số tiền' : 'Copy amount',
        exact: true,
      }),
    ).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await context.setOffline(true);
    await expect(
      page.getByRole('main').getByText(locale === 'vi' ? /Bạn đang offline/ : /You are offline/),
    ).toBeVisible();
    const check = page.getByRole('button', {
      name: locale === 'vi' ? 'Tôi đã chuyển khoản · Kiểm tra' : 'I have paid · Check status',
      exact: true,
    });
    await expect(check).toBeDisabled();
    status = 'expired';
    await context.setOffline(false);
    await expect(
      page.getByRole('button', {
        name: locale === 'vi' ? 'Kiểm tra lại' : 'Check again',
        exact: true,
      }),
    ).toBeVisible();
    const before = reads;
    status = 'paid';
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await expect(
      page.getByRole('heading', {
        name: locale === 'vi' ? 'Bộ câu hỏi đã mở khóa!' : 'Your question pack is unlocked!',
        exact: true,
      }),
    ).toBeVisible();
    expect(reads).toBeGreaterThan(before);
    const play = page.getByRole('link', {
      name: locale === 'vi' ? 'Chơi tiếp' : 'Keep playing',
      exact: true,
    });
    await expect(play).toBeVisible();
    await expect(page.getByText(order.recoveryCode, { exact: true })).toBeVisible();
    expect((await play.boundingBox())!.y).toBeLessThan(
      (await page.getByText(order.recoveryCode, { exact: true }).boundingBox())!.y,
    );
    expect(errors).toEqual([]);
  });
}
