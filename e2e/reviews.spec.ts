import { test, expect } from '@playwright/test';
test.use({ serviceWorkers: 'block' });
test('finish game opens review; failed send preserves form, success is shown', async ({ page }) => {
  let fail = true;
  await page.route('**/api/reviews', async (route) => {
    const input = route.request().postDataJSON();
    expect(input).toEqual({ name: 'An', comment: 'Chơi rất vui!', rating: 5 });
    await route.fulfill({
      status: fail ? 503 : 200,
      json: fail ? { error: 'Unavailable' } : { review: { id: 1, ...input } },
    });
  });
  await page.goto('/vi/choi/ban-be-khoi-dong');
  await page.getByRole('button', { name: /Thật/ }).click();
  await page.getByRole('button', { name: 'Kết thúc', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('radio', { name: '5 sao', exact: true }).check();
  await page.getByLabel('Tên của bạn').fill('An');
  await page.getByLabel('Nhận xét').fill('Chơi rất vui!');
  await page.getByRole('button', { name: 'Gửi đánh giá', exact: true }).click();
  await expect(page.locator('main [role=alert]')).toContainText('Chưa gửi được');
  await expect(page.getByLabel('Nhận xét')).toHaveValue('Chơi rất vui!');
  fail = false;
  await page.getByRole('button', { name: 'Gửi đánh giá', exact: true }).click();
  await expect(page.getByText('Đánh giá của bạn đã được chia sẻ.')).toBeVisible();
  await page.getByRole('button', { name: 'Xong', exact: true }).click();
  await expect(page).toHaveURL(/\/vi$/);
});
test('reviews load more, retry without losing cards, and mobile dialog closes with Escape', async ({
  page,
}) => {
  const review = (id: number) => ({
    id,
    name: `Người chơi ${id}`,
    rating: 4,
    comment: 'Một buổi tối rất vui.',
    created_at: '2026-09-27T00:00:00Z',
  });
  let failed = false;
  await page.route('**/api/reviews*', async (route) => {
    const next = route.request().url().includes('cursor=2');
    if (next && !failed) {
      failed = true;
      await route.fulfill({ status: 503, json: { error: 'Unavailable' } });
      return;
    }
    await route.fulfill({
      json: next
        ? { reviews: [review(1)], nextCursor: null }
        : { reviews: [review(3), review(2)], nextCursor: 2 },
    });
  });
  await page.goto('/vi/danh-gia');
  await expect(page.getByRole('article')).toHaveCount(2);
  await page.getByRole('button', { name: 'Tải thêm đánh giá' }).click();
  await expect(page.locator('main [role=alert]')).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(2);
  await page.getByRole('button', { name: 'Thử lại' }).click();
  await expect(page.getByRole('article')).toHaveCount(3);
  await expect(page.getByRole('button', { name: 'Tải thêm đánh giá' })).toHaveCount(0);
  await page.setViewportSize({ width: 320, height: 740 });
  await page.getByRole('button', { name: 'Viết đánh giá' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Viết đánh giá' })).toBeFocused();
});
test('English review route renders English copy', async ({ page }) => {
  await page.route('**/api/reviews', (route) =>
    route.fulfill({ json: { reviews: [], nextCursor: null } }),
  );
  await page.goto('/en/reviews');
  await page.getByRole('button', { name: 'Write a review' }).click();
  await expect(page.getByRole('heading', { name: 'How was your game?' })).toBeVisible();
});
