import {
  api,
  guest,
  sameOrigin,
  body,
  db,
  check,
  HttpError,
  hash,
  limit,
} from '@/lib/payments/server';
import { normalizeRecovery } from '@/lib/payments/validation';
export const dynamic = 'force-dynamic';
export async function POST(req: Request) {
  return api(async () => {
    sameOrigin(req);
    const id = await guest();
    await limit('restore:' + id, 8);
    await limit(
      'restore-ip:' + hash(req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'),
      20,
    );
    const input = await body(req);
    const code = normalizeRecovery(String(input.recoveryCode ?? ''));
    if (!/^[A-F0-9]{32}$/.test(code))
      throw new HttpError(400, 'Mã khôi phục không hợp lệ hoặc không còn hiệu lực.');
    const { data, error } = await db().rpc('restore_purchase', { p_guest: id, p_hash: hash(code) });
    check(error);
    if (!data) throw new HttpError(400, 'Mã khôi phục không hợp lệ hoặc không còn hiệu lực.');
    return { ok: true, packId: data };
  });
}
