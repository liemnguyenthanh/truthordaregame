import { expect, test, type Page } from '@playwright/test';
import { getPack, getQuestionSet } from '../lib/content';
const freeSet = getQuestionSet(getPack('ban-be-khoi-dong')!);
const freeTruthCount = freeSet.questions.filter((question) => question.type === 'truth').length;

// API interception is deterministic here; dedicated PWA tests exercise the worker.
test.use({ serviceWorkers: 'block' });

const freeRoute = '/vi/choi/ban-be-khoi-dong';
const premiumRoute = '/vi/choi/ban-be-gan-ket';
async function readProgress(page: Page, packId: string) {
  return page.evaluate(
    (id) => JSON.parse(localStorage.getItem(`tod:game:v1:${id}`) || 'null'),
    packId,
  );
}
async function draw(page: Page, kind: 'Thật' | 'Thách', expected: number, packId: string) {
  // The game intentionally ignores double taps for 260 ms.
  await page.waitForTimeout(270);
  await page.getByRole('button', { name: new RegExp(kind) }).click();
  await expect.poll(async () => (await readProgress(page, packId))?.seenIds.length).toBe(expected);
}

test('free game draws, persists exactly across refresh, exhausts truth and continues dare', async ({
  page,
}) => {
  await page.goto(freeRoute);
  await expect(page.getByRole('button', { name: /Thật/ })).toBeEnabled();
  await draw(page, 'Thật', 1, 'friends-free');
  const first = await readProgress(page, 'friends-free');
  await page.reload();
  await expect
    .poll(async () => (await readProgress(page, 'friends-free'))?.currentId)
    .toBe(first.currentId);
  await expect(
    page.getByText(`Đã xem 1/${freeSet.questions.length} câu`, { exact: true }),
  ).toBeVisible();
  for (let index = 2; index <= freeTruthCount; index++)
    await draw(page, 'Thật', index, 'friends-free');
  await expect(page.getByRole('button', { name: /Thật/ })).toBeDisabled();
  await expect(page.getByRole('button', { name: /Thách/ })).toBeEnabled();
  await draw(page, 'Thách', freeTruthCount + 1, 'friends-free');
  const progress = await readProgress(page, 'friends-free');
  expect(new Set(progress.seenIds).size).toBe(freeTruthCount + 1);
});

test('premium fixed 4/4 trial leaves eighth card readable; next request reveals paywall', async ({
  page,
}) => {
  await page.goto(premiumRoute);
  await expect(page.getByRole('button', { name: /Thật/ })).toBeEnabled();
  for (let index = 1; index <= 4; index++) await draw(page, 'Thật', index, 'friends-premium');
  await page.waitForTimeout(270);
  await page.getByRole('button', { name: /Thật/ }).click();
  await expect(page.getByText(/Bạn đã xem hết câu Thật chơi thử/)).toBeVisible();
  expect((await readProgress(page, 'friends-premium')).seenIds).toHaveLength(4);
  for (let index = 5; index <= 8; index++) await draw(page, 'Thách', index, 'friends-premium');
  const eighth = await readProgress(page, 'friends-premium');
  await expect(page.getByRole('complementary', { name: 'Mở khóa bộ câu hỏi' })).toHaveCount(0);
  await expect(page.getByText('Đã thử 8/8 câu miễn phí', { exact: true })).toBeVisible();
  await page.waitForTimeout(270);
  await page.getByRole('button', { name: /Thách/ }).click();
  await expect(page.getByRole('complementary', { name: 'Mở khóa bộ câu hỏi' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Mở khóa Bạn bè gắn kết' })).toBeFocused();
  expect((await readProgress(page, 'friends-premium')).currentId).toBe(eighth.currentId);
  await page.getByRole('button', { name: 'Đóng thông tin mở khóa' }).click();
  await page.getByRole('button', { name: 'Ván mới' }).click();
  await expect(page.getByText('Đã thử 8/8 câu miễn phí', { exact: true })).toBeVisible();
  await draw(page, 'Thật', 1, 'friends-premium');
  expect(eighth.trialSeenIds).toContain((await readProgress(page, 'friends-premium')).currentId);
});

test('unconfigured checkout shows honest unavailable state and no paid success', async ({
  page,
  request,
}) => {
  const product = await request.get('/api/products/friends-premium');
  test.skip(
    product.status() !== 503,
    'This scenario is specific to a local server without payment configuration.',
  );
  await page.goto('/vi/thanh-toan?pack=friends-premium');
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    /chưa được cấu hình|chưa sẵn sàng|gián đoạn/,
  );
  await expect(page.getByRole('heading', { name: 'Bộ câu hỏi đã mở khóa!' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Tạo mã QR/ })).toHaveCount(0);
});

test('320px game and trial paywall have no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto(premiumRoute);
  await expect(page.getByRole('button', { name: /Thật/ })).toBeEnabled();
  await draw(page, 'Thật', 1, 'friends-premium');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('button', { name: /Xem thêm/ }).click();
  await expect(page.getByRole('complementary', { name: 'Mở khóa bộ câu hỏi' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('MOCK API: checkout QR to verified paid response, recovery code and continue', async ({
  page,
}) => {
  // Browser-only contract simulation; this test does not exercise SePay or move money.
  let paid = false;
  const recoveryCode = 'TEST-RECOVERY-CODE';
  const order = {
    id: 'test-order',
    packId: 'friends-premium',
    status: 'pending',
    amountVnd: 30000,
    currency: 'VND',
    expiresAt: new Date(Date.now() + 900_000).toISOString(),
    paymentCode: 'TODTEST1234',
    qrUrl: '/icons/icon-192.png',
    bankName: 'Ngân hàng thử nghiệm',
    accountNumber: '123456789',
    accountName: 'TAI KHOAN THU NGHIEM',
  };
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    let body: unknown;
    if (url.pathname === '/api/session') body = { ok: true };
    else if (url.pathname.startsWith('/api/products/'))
      body = {
        packId: 'friends-premium',
        priceVnd: 30000,
        currency: 'VND',
        available: true,
        priceVersion: 1,
      };
    else if (url.pathname === '/api/entitlements')
      body = {
        packIds: paid ? ['friends-premium'] : [],
        purchases: paid ? [{ packId: 'friends-premium', recoveryCode }] : [],
      };
    else if (url.pathname === '/api/orders') {
      expect(route.request().postDataJSON()).toEqual({ packId: 'friends-premium' });
      expect(route.request().headers()['idempotency-key']).toBeTruthy();
      body = { order };
    } else if (url.pathname === '/api/orders/test-order')
      body = {
        order: { ...order, status: paid ? 'paid' : 'pending', ...(paid ? { recoveryCode } : {}) },
      };
    else return route.fulfill({ status: 404, json: { error: 'Unexpected mock request' } });
    await route.fulfill({ status: 200, json: body });
  });
  await page.goto('/vi/thanh-toan?pack=friends-premium');
  await page.getByRole('button', { name: /Tạo mã QR/ }).click();
  await expect(page.getByRole('img', { name: /Mã QR thanh toán/ })).toBeVisible();
  await expect(page.getByText('TODTEST1234', { exact: true })).toBeVisible();
  await expect(page.getByText('Đang chờ ngân hàng xác nhận')).toBeVisible();
  paid = true;
  await page.getByRole('button', { name: 'Kiểm tra thanh toán', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Bộ câu hỏi đã mở khóa!' })).toBeVisible();
  await expect(page.getByText(recoveryCode, { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Chơi tiếp', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${premiumRoute}$`));
  await expect(page.getByText('Đã mở khóa', { exact: true })).toBeVisible();
});
