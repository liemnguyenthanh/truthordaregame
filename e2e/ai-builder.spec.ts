import { expect, test, type Page } from '@playwright/test';
import type { GeneratedPack, GenerationInput, PlayGroup } from '../lib/types';

test.use({ serviceWorkers: 'block' });
const id = '10000000-0000-4000-8000-000000000001';
const group: PlayGroup = { id: 'group-test', name: 'Hội cuối tuần', players: [{ id: 'an', name: 'An' }, { id: 'binh', name: 'Bình' }] };
function completed(input: GenerationInput): GeneratedPack {
  return { id, status: 'complete', group: input.group, mood: input.mood, createdAt: '2026-09-17T12:00:00Z',
    pack: { id: `ai-${id}`, slug: `ai-${id}`, title: 'Hội cuối tuần · Vui vẻ', description: 'Bộ thử nghiệm API', tier: 'free', questionFile: '', contentVersion: '1', questionCount: 4, truthCount: 2, dareCount: 2, trialCount: 0, priceHintVnd: 0, productId: null, ageLabel: '16+', playerRange: { min: 2, max: 2 }, published: false, icon: '✨', color: 'purple', categoryIds: [] },
    questionSet: { schemaVersion: 1, packId: `ai-${id}`, locale: 'vi', contentVersion: '1', trialQuestionIds: [], questions: [
      { id: 't1', type: 'truth', text: 'An, bạn thích điều gì ở Bình?', playerId: input.group.players[0].id, partnerId: input.group.players[1].id },
      { id: 't2', type: 'truth', text: 'Bình, kỷ niệm nào cùng An khiến bạn vui?', playerId: input.group.players[1].id, partnerId: input.group.players[0].id },
      { id: 'd1', type: 'dare', text: 'An, nói một lời cảm ơn với Bình.', playerId: input.group.players[0].id, partnerId: input.group.players[1].id },
      { id: 'd2', type: 'dare', text: 'Bình, diễn tả một con vật để An đoán.', playerId: input.group.players[1].id, partnerId: input.group.players[0].id },
    ] },
  };
}
async function seedGroup(page: Page) {
  await page.addInitScript(value => { localStorage.setItem('tod:group:v1', JSON.stringify(value)); }, group);
}
test('MOCK AI: group and adult mood consent sent, generated actor questions persist on reload', async ({ page }) => {
  await seedGroup(page);
  let generation: GeneratedPack | undefined;
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/generations/config') return route.fulfill({ json: { available: true, dailyLimit: 3, billing: 'free' } });
    if (url.pathname === '/api/session') return route.fulfill({ json: { ok: true } });
    if (url.pathname === '/api/generations' && route.request().method() === 'GET') return route.fulfill({ json: { generations: [], limitPerDay: 3 } });
    if (url.pathname === '/api/generations' && route.request().method() === 'POST') {
      const input = route.request().postDataJSON() as GenerationInput;
      expect(input.group).toEqual(group); expect(input.mood).toBe('flirty'); expect(input.adultsConfirmed).toBe(true);
      expect(route.request().headers()['idempotency-key']).toBeTruthy();
      generation = completed(input); return route.fulfill({ json: { generation } });
    }
    if (url.pathname === `/api/generations/${id}`) return route.fulfill({ json: { generation } });
    return route.fulfill({ status: 404, json: { error: 'Unexpected mock' } });
  });
  await page.goto('/vi/tao-bo-ai');
  await expect(page.getByText('Hội cuối tuần', { exact: true })).toBeVisible();
  await page.getByRole('radio', { name: /Táo bạo/ }).check();
  await expect(page.getByRole('button', { name: 'Tạo bộ câu hỏi của nhóm' })).toBeDisabled();
  await page.getByRole('checkbox', { name: /Tất cả thành viên/ }).check();
  await page.getByRole('button', { name: 'Tạo bộ câu hỏi của nhóm' }).click();
  await expect(page).toHaveURL(new RegExp(`/vi/bo-ai\\?id=${id}`));
  await page.getByRole('button', { name: /Thật/ }).click();
  await expect(page.getByText('An, bạn thích điều gì ở Bình?', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('An, bạn thích điều gì ở Bình?', { exact: true })).toBeVisible();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(`tod:generated:v1:${key}`) || 'null')?.status, id)).toBe('complete');
});
test('MOCK AI: lost response retries with same idempotency key and no fake pack', async ({ page }) => {
  await seedGroup(page); const keys: string[] = [];
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/generations/config') return route.fulfill({ json: { available: true, dailyLimit: 3, billing: 'free' } });
    if (url.pathname === '/api/session') return route.fulfill({ json: { ok: true } });
    if (route.request().method() === 'GET') return route.fulfill({ json: { generations: [] } });
    keys.push(route.request().headers()['idempotency-key']);
    return route.fulfill({ status: 503, json: { error: 'AI chưa được cấu hình.' } });
  });
  await page.goto('/vi/tao-bo-ai');
  await page.getByRole('button', { name: 'Tạo bộ câu hỏi của nhóm' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('AI chưa được cấu hình.');
  await page.reload();
  await page.getByRole('button', { name: 'Tạo bộ câu hỏi của nhóm' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('AI chưa được cấu hình.');
  expect(keys).toHaveLength(2); expect(keys[0]).toBe(keys[1]);
  await expect(page).toHaveURL(/\/vi\/tao-bo-ai$/);
});
test('MOCK AI: pending result polls to complete; no regeneration request', async ({ page }) => {
  let reads = 0;
  const input: GenerationInput = { group, mood: 'friendly', adultsConfirmed: false };
  const full = completed(input);
  await page.route('**/api/generations/**', async route => {
    expect(route.request().method()).toBe('GET'); reads++;
    await route.fulfill({ json: { generation: reads === 1 ? { id, group, mood: 'friendly', status: 'pending', createdAt: full.createdAt } : full } });
  });
  await page.goto(`/vi/bo-ai?id=${id}`);
  await expect(page.getByRole('heading', { name: 'AI đang kết nối cả nhóm' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Thật/ })).toBeVisible({ timeout: 10000 });
  expect(reads).toBeGreaterThanOrEqual(2);
});
test('MOCK AI: failed result is explicit and never auto-regenerated', async ({ page }) => {
  let calls = 0;
  await page.route('**/api/generations/**', async route => { calls++; expect(route.request().method()).toBe('GET'); await route.fulfill({ json: { generation: { id, group, mood: 'friendly', status: 'failed', createdAt: '2026-09-17T12:00:00Z', error: 'AI không tạo đủ câu hợp lệ.' } } }); });
  await page.goto(`/vi/bo-ai?id=${id}`);
  await expect(page.getByRole('heading', { name: 'Chưa tạo được bộ lần này' })).toBeVisible();
  await expect(page.getByText('AI không tạo đủ câu hợp lệ.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Về nhóm và thử lần mới' })).toBeVisible();
  expect(calls).toBe(1);
});
