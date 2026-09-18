import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
try {
  process.loadEnvFile('.env');
} catch {}
// Never record admin credentials in a trace artifact.
test.use({ trace: 'off', actionTimeout: 10000 });
test('admin login, JSON import, publish, pricing, conflict protection, unpublish and logout', async ({
  page,
  request,
  baseURL,
}) => {
  test.skip(
    !process.env.ADMIN_PASSWORD || !process.env.SUPABASE_SERVICE_ROLE_KEY,
    'Requires local admin and database configuration',
  );
  const id = 'admin-check-' + Date.now();
  const client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const origin = baseURL!;
  const questions = Array.from({ length: 12 }, (_, i) => ({
    id: `test-q-${i}`,
    type: i < 6 ? 'truth' : 'dare',
    text: `Câu kiểm tra ${i + 1}`,
  }));
  try {
    expect((await request.get('/api/admin/packs')).status()).toBe(401);
    expect(
      (await request.post('/api/admin/packs', { headers: { Origin: origin }, data: {} })).status(),
    ).toBe(401);
    await page.goto('/admin');
    await page.getByLabel('Mật khẩu quản trị').fill('incorrect-password');
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await expect(page.locator('#main').getByRole('alert')).toContainText('Mật khẩu không đúng');
    await page.getByLabel('Mật khẩu quản trị').fill(process.env.ADMIN_PASSWORD!);
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Bộ câu hỏi', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Tạo bộ mới' }).click();
    await page.getByLabel('Tên bộ', { exact: true }).fill('Bộ kiểm tra quản trị');
    await page.getByLabel('Mã bộ', { exact: true }).fill(id);
    await page
      .getByLabel('Mô tả', { exact: true })
      .fill('Bộ kiểm tra tạm thời, được dọn sau khi xác minh.');
    await page.getByRole('combobox', { name: 'Loại bộ', exact: true }).selectOption('premium');
    await page.getByLabel('Giá bán (VND)', { exact: true }).fill('45000');
    await page.getByRole('button', { name: 'Nhập JSON', exact: true }).click();
    await page.getByLabel('Chọn file JSON').setInputFiles({
      name: 'questions.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({ questions })),
    });
    await expect(page.getByLabel('Nội dung câu 1', { exact: true })).toHaveValue('Câu kiểm tra 1');
    await page.getByRole('button', { name: 'Lưu bộ', exact: true }).click();
    await expect(page.locator('#main').getByRole('status')).toContainText('Đã lưu nháp');
    expect(
      (await (await request.get('/api/catalog')).json()).packs.some(
        (p: { id: string }) => p.id === id,
      ),
    ).toBe(false);
    await page.getByRole('combobox', { name: 'Trạng thái', exact: true }).selectOption('published');
    await page.getByRole('button', { name: 'Lưu bộ', exact: true }).click();
    await expect(page.locator('#main').getByRole('status')).toContainText('Đã xuất bản');
    const catalog = await (await request.get('/api/catalog')).json();
    const published = catalog.packs.find((p: { id: string }) => p.id === id);
    expect(published.questionCount).toBe(12);
    const questionSet = await (await request.get(published.questionFile)).json();
    expect(questionSet.trialQuestionIds.length).toBe(8);
    const quote = await (await request.get('/api/products/' + id)).json();
    expect(quote.priceVnd).toBe(45000);
    expect(quote.available).toBe(true);
    const { data, error } = await client
      .from('content_packs')
      .select('revision,question_set')
      .eq('id', id)
      .single();
    expect(error).toBeNull();
    expect(data!.question_set.questions).toHaveLength(12);
    // Cookie authenticated requests still reject a foreign origin and stale edits.
    const csrf = await page.request.post('/api/admin/packs', {
      headers: { Origin: 'https://example.org' },
      data: {},
    });
    expect(csrf.status()).toBe(403);
    const stale = await page.request.post('/api/admin/packs', {
      headers: { Origin: origin },
      data: { ...published, questions, expected: 'outdated' },
    });
    expect(stale.status()).toBe(409);
    await page.getByLabel('Giá bán (VND)', { exact: true }).fill('50000');
    await page.getByRole('button', { name: 'Lưu bộ', exact: true }).click();
    await expect(page.locator('#main').getByRole('status')).toContainText('Đã xuất bản');
    const nextQuote = await (await request.get('/api/products/' + id)).json();
    expect(nextQuote.priceVnd).toBe(50000);
    expect(nextQuote.priceVersion).toBe(quote.priceVersion + 1);
    expect((await request.get(published.questionFile)).status()).toBe(200);
    await page.screenshot({ path: 'test-results/admin-editor.png', fullPage: true });
    const game = await page.context().newPage();
    await game.goto('/vi');
    await expect(
      game.getByRole('heading', { name: 'Bộ kiểm tra quản trị', exact: true }),
    ).toBeVisible();
    await game.goto('/vi/choi/' + id);
    await game.getByRole('button', { name: '☁️ Thật', exact: true }).click();
    await expect(game.getByText(/Câu kiểm tra [1-6]$/)).toBeVisible();
    await game.close();
    await page.getByRole('combobox', { name: 'Trạng thái', exact: true }).selectOption('draft');
    await page.getByRole('button', { name: 'Lưu bộ', exact: true }).click();
    await expect(page.locator('#main').getByRole('status')).toContainText('Đã lưu nháp');
    expect((await request.get(published.questionFile)).status()).toBe(404);
    expect((await (await request.get('/api/products/' + id)).json()).available).toBe(false);
    await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
    await expect(page.getByLabel('Mật khẩu quản trị')).toBeVisible();
    expect((await page.request.get('/api/admin/packs')).status()).toBe(401);
    expect(errors).toEqual([]);
  } finally {
    for (const table of ['content_pack_versions', 'content_packs', 'products']) {
      const { error } = await client
        .from(table)
        .delete()
        .eq(table === 'content_packs' ? 'id' : 'pack_id', id);
      if (error) throw new Error(`Cleanup ${table} failed: ${error.code}`);
    }
  }
});
