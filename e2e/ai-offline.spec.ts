import { expect, test } from '@playwright/test';
import type { GeneratedPack } from '../lib/types';

// Seeded content fixture only. Production HTML, JS, service worker, shell caching,
// and offline navigation remain real; this does not exercise an AI provider.
test.use({ serviceWorkers: 'allow' });
const id = '20000000-0000-4000-8000-000000000002';
const generation: GeneratedPack = {
  id,
  status: 'complete',
  createdAt: '2026-09-17T12:00:00Z',
  mood: 'friendly',
  group: {
    id: 'offline-group',
    name: 'Nhóm offline thử nghiệm',
    players: [
      { id: 'an', name: 'An' },
      { id: 'binh', name: 'Bình' },
    ],
  },
  pack: {
    id: `ai-${id}`,
    slug: `ai-${id}`,
    title: 'Bộ riêng offline',
    description: 'Seeded mock content for offline verification',
    tier: 'free',
    questionFile: '',
    contentVersion: '1',
    questionCount: 4,
    truthCount: 2,
    dareCount: 2,
    trialCount: 0,
    priceHintVnd: 0,
    productId: null,
    ageLabel: '16+',
    playerRange: { min: 2, max: 2 },
    published: false,
    icon: '✨',
    color: 'purple',
    categoryIds: [],
  },
  questionSet: {
    schemaVersion: 1,
    packId: `ai-${id}`,
    locale: 'vi',
    contentVersion: '1',
    trialQuestionIds: [],
    questions: [
      {
        id: 't1',
        type: 'truth',
        text: 'An, kỷ niệm nào với Bình khiến bạn vui?',
        playerId: 'an',
        partnerId: 'binh',
      },
      {
        id: 't2',
        type: 'truth',
        text: 'Bình, bạn muốn cùng An đi đâu?',
        playerId: 'binh',
        partnerId: 'an',
      },
      {
        id: 'd1',
        type: 'dare',
        text: 'An, nói một lời khen dành cho Bình.',
        playerId: 'an',
        partnerId: 'binh',
      },
      {
        id: 'd2',
        type: 'dare',
        text: 'Bình, kể chuyện vui cho An nghe.',
        playerId: 'binh',
        partnerId: 'an',
      },
    ],
  },
};

test('SEEDED MOCK AI: real shell cache supports offline reload and a fresh page with correct actors', async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript((value) => {
    localStorage.setItem(`tod:generated:v1:${value.id}`, JSON.stringify(value));
    localStorage.setItem('tod:generated-history:v1', JSON.stringify([value]));
  }, generation);
  await page.goto(`/vi/bo-ai?id=${id}`);
  await expect(page.getByRole('heading', { name: 'Bộ riêng offline', exact: true })).toBeVisible();
  await page
    .getByRole('button', { name: 'Lưu màn chơi để dùng bộ AI offline', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Đã sẵn sàng chơi bộ này offline', exact: true }),
  ).toBeVisible({ timeout: 45000 });
  await expect
    .poll(async () => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Bộ riêng offline', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '☁️ Thật', exact: true }).click();
  await expect(page.getByTestId('current-actor')).toContainText('Lượt của An');
  await expect(
    page.getByText('An, kỷ niệm nào với Bình khiến bạn vui?', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Đã xem 1/4 câu', { exact: true })).toBeVisible();
  const fresh = await context.newPage();
  fresh.on('pageerror', (error) => errors.push(error.message));
  await fresh.goto(`/vi/bo-ai?id=${id}`);
  await expect(
    fresh.getByText('An, kỷ niệm nào với Bình khiến bạn vui?', { exact: true }),
  ).toBeVisible();
  await fresh.getByRole('button', { name: '💖 Thách', exact: true }).click();
  await expect(fresh.getByTestId('current-actor')).toContainText('Lượt của Bình');
  await expect(fresh.getByText('Bình, kể chuyện vui cho An nghe.', { exact: true })).toBeVisible();
  await expect(fresh.getByText('Đã xem 2/4 câu', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
  await context.setOffline(false);
});

test('unconfigured AI reports AI availability honestly and never renders generated success', async ({
  page,
  request,
}) => {
  const response = await request.get('/api/generations/config');
  test.skip(response.status() !== 503, 'This case covers a server without AI configuration.');
  const configError = (await response.json()).error as string;
  expect(configError).toContain('AI');
  await page.addInitScript(
    (group) => localStorage.setItem('tod:group:v1', JSON.stringify(group)),
    generation.group,
  );
  await page.goto('/vi/tao-bo-ai');
  await expect(page.getByRole('main').getByText(configError, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Tạo bộ câu hỏi của nhóm', exact: true }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText(configError);
  await expect(page.getByRole('main').getByRole('alert')).not.toContainText('Thanh toán');
  await expect(page).toHaveURL(/\/vi\/tao-bo-ai$/);
  expect(await page.evaluate(() => localStorage.getItem('tod:generation-pending:v1'))).toBeNull();
});
