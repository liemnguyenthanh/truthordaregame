import { expect, test, type Page } from '@playwright/test';

test.use({ serviceWorkers: 'block' });
const route = '/vi/choi/ban-be-khoi-dong';
async function progress(page: Page) { return page.evaluate(() => JSON.parse(localStorage.getItem('tod:game:v1:friends-free') || 'null')); }
async function draw(page: Page, name: 'Thật' | 'Thách' | 'Bỏ qua', count: number) {
  // Respect the intentional 260 ms double-tap guard.
  await page.waitForTimeout(270);
  await page.getByRole('button', { name: name === 'Bỏ qua' ? name : new RegExp(name), exact: name === 'Bỏ qua' }).click();
  await expect.poll(async () => (await progress(page))?.seenIds.length).toBe(count);
}

test('optional group names rotate; skip retains actor; reload and editing preserve/reset the intended state', async ({ page }) => {
  await page.goto(route);
  await expect(page.getByRole('button', { name: 'Tạo nhóm', exact: true })).toBeEnabled();
  await expect(page.getByTestId('current-actor')).toHaveCount(0);
  await page.getByRole('button', { name: 'Tạo nhóm', exact: true }).click();
  await page.getByLabel('Tên nhóm', { exact: true }).fill('Hội cuối tuần');
  await page.getByLabel('Thành viên 1', { exact: true }).fill('An');
  await page.getByLabel('Thành viên 2', { exact: true }).fill('Bình');
  await page.getByRole('button', { name: 'Thêm thành viên', exact: true }).click();
  await page.getByLabel('Thành viên 3', { exact: true }).fill('Chi');
  await page.getByRole('button', { name: 'Lưu nhóm & bắt đầu ván mới', exact: true }).click();
  await expect(page.getByTestId('current-actor')).toHaveText('Bắt đầu với An');
  await draw(page, 'Thật', 1);
  await expect(page.getByTestId('current-actor')).toHaveText('Lượt của An');
  await draw(page, 'Bỏ qua', 2);
  await expect(page.getByTestId('current-actor')).toHaveText('Lượt của An');
  await draw(page, 'Thách', 3);
  await expect(page.getByTestId('current-actor')).toHaveText('Lượt của Bình');
  const beforeReload = await progress(page);
  await page.reload();
  await expect(page.getByTestId('current-actor')).toHaveText('Lượt của Bình');
  expect((await progress(page)).currentId).toBe(beforeReload.currentId);
  await draw(page, 'Thật', 4);
  await expect(page.getByTestId('current-actor')).toHaveText('Lượt của Chi');
  await page.getByRole('button', { name: 'Sửa nhóm', exact: true }).click();
  await page.getByLabel('Thành viên 1', { exact: true }).fill('An mới');
  await page.getByRole('button', { name: 'Lưu nhóm & bắt đầu ván mới', exact: true }).click();
  await expect(page.getByTestId('current-actor')).toHaveText('Bắt đầu với An mới');
  expect((await progress(page)).seenIds).toHaveLength(0);
  await draw(page, 'Thật', 1);
  await expect(page.getByTestId('current-actor')).toHaveText('Lượt của An mới');
});

test('group shortcut opens editor, rejects normalized duplicate names, fits 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto(`${route}?group=1`);
  await expect(page.getByRole('form', { name: 'Thông tin nhóm chơi' })).toBeVisible();
  await page.getByLabel('Thành viên 1', { exact: true }).fill('An');
  await page.getByLabel('Thành viên 2', { exact: true }).fill(' an ');
  await page.getByRole('button', { name: 'Lưu nhóm & bắt đầu ván mới', exact: true }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Tên thành viên bị trùng');
  expect(await page.evaluate(() => localStorage.getItem('tod:group:v1'))).toBeNull();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByLabel('Thành viên 2', { exact: true }).fill('Bình');
  await page.getByRole('button', { name: 'Lưu nhóm & bắt đầu ván mới', exact: true }).click();
  await draw(page, 'Thật', 1);
  await expect(page.getByTestId('current-actor')).toHaveText('Lượt của An');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
