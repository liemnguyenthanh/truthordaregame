import test from 'node:test';
import assert from 'node:assert/strict';
import { createDecipheriv, createHash } from 'node:crypto';
import { createHandler } from '../supabase/functions/sepay-webhook/handler';

const config: Record<string, string> = {
  SEPAY_WEBHOOK_API_KEY: 'test-key',
  SEPAY_BANK_NAME: 'MBBank',
  SEPAY_ACCOUNT_NUMBER: '1234',
  RECOVERY_ENCRYPTION_KEY: 'ab'.repeat(32),
  SUPABASE_SERVICE_ROLE_KEY: 'test-service',
  SUPABASE_URL: 'https://test.supabase.co',
};
const payload = {
  id: 123,
  transferAmount: 30000,
  transferType: 'in',
  accountNumber: '1234',
  gateway: 'MBBank',
  transactionDate: '2026-09-23 12:00:00',
  content: 'TOD123456ABCD',
};
const request = (body: unknown = payload, auth = 'Apikey test-key') =>
  new Request('https://test/webhook', {
    method: 'POST',
    headers: { Authorization: auth },
    body: JSON.stringify(body),
  });
test('Edge rejects invalid auth/body before calling database', async () => {
  const handler = createHandler(
    (n) => config[n],
    async () => {
      throw new Error('must not fetch');
    },
  );
  assert.equal((await handler(request(payload, 'Bearer test-key'))).status, 401);
  assert.equal((await handler(request({}))).status, 400);
  assert.equal((await handler(request('x'.repeat(17000)))).status, 413);
  assert.equal((await handler(new Request('https://test/webhook'))).status, 405);
});
test('Edge sends atomic RPC arguments and website-compatible encrypted recovery', async () => {
  const handler = createHandler(
    (n) => config[n],
    async (url, init) => {
      assert.equal(url, 'https://test.supabase.co/rest/v1/rpc/apply_payment');
      const args = JSON.parse(String(init?.body));
      assert.equal(args.p_code, 'TOD123456ABCD');
      assert.equal(args.p_bank_time, '2026-09-23T05:00:00.000Z');
      assert.equal(args.p_account_valid, true);
      const bytes = Buffer.from(args.p_recovery_ciphertext, 'base64');
      const decipher = createDecipheriv(
        'aes-256-gcm',
        Buffer.from(config.RECOVERY_ENCRYPTION_KEY, 'hex'),
        bytes.subarray(0, 12),
      );
      decipher.setAuthTag(bytes.subarray(12, 28));
      const raw = Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString();
      assert.match(raw, /^[A-F0-9]{32}$/);
      assert.equal(createHash('sha256').update(raw).digest('hex'), args.p_recovery_hash);
      return Response.json('paid');
    },
  );
  const response = await handler(request());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true });
});
test('Edge marks mismatched bank invalid and acknowledges duplicates', async () => {
  const handler = createHandler(
    (n) => config[n],
    async (_url, init) => {
      assert.equal(JSON.parse(String(init?.body)).p_account_valid, false);
      return Response.json('duplicate');
    },
  );
  assert.equal((await handler(request({ ...payload, accountNumber: 'other' }))).status, 200);
});
test('Edge leaves database failures retryable and fails closed without secrets', async () => {
  const handler = createHandler(
    (n) => config[n],
    async () => Response.json({}, { status: 500 }),
  );
  assert.equal((await handler(request())).status, 503);
  const missing = createHandler(() => undefined);
  assert.equal((await missing(request())).status, 503);
});
