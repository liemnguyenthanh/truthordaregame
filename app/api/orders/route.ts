import { randomBytes } from 'node:crypto';
import {
  api,
  guest,
  sameOrigin,
  body,
  db,
  check,
  HttpError,
  bank,
  recovery,
  orderView,
  limit,
  env,
} from '@/lib/payments/server';
export const dynamic = 'force-dynamic';
export async function POST(req: Request) {
  return api(async () => {
    sameOrigin(req);
    const id = await guest();
    await limit('order:' + id, 15);
    bank();
    env('SEPAY_WEBHOOK_API_KEY');
    recovery();
    const input = await body(req);
    const key = req.headers.get('Idempotency-Key');
    if (typeof input.packId !== 'string' || !key || !/^[\w-]{16,100}$/.test(key))
      throw new HttpError(400, 'Thiếu bộ câu hỏi hoặc mã yêu cầu.');
    // A shorter provider-compatible suffix still has a DB uniqueness guarantee.
    for (let attempt = 0; attempt < 4; attempt++) {
      const { data, error } = await db().rpc('create_order', {
        p_guest: id,
        p_pack: input.packId,
        p_key: key,
        p_code: 'TOD' + randomBytes(5).toString('hex').toUpperCase(),
      });
      if (error?.code === '23505' && error.message.includes('orders_payment_code_key')) continue;
      check(error);
      if (data?.error)
        throw new HttpError(
          data.error === 'conflict' ? 409 : 404,
          data.error === 'conflict'
            ? 'Mã yêu cầu đã được dùng cho bộ khác.'
            : 'Bộ câu hỏi chưa được mở bán.',
        );
      if (data?.alreadyOwned) return { alreadyOwned: true, packId: input.packId };
      return { order: await orderView(data) };
    }
    throw new HttpError(503, 'Chưa tạo được mã chuyển khoản. Vui lòng thử lại.');
  });
}
