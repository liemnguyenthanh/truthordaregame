import { createRecovery } from '../../supabase/functions/_shared/payment-recovery';
import 'server-only';
import { hasSameOrigin } from '@/lib/request-origin';
import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { db, env, check, HttpError } from '@/lib/db/server';
export { db, env, check, HttpError };
const COOKIE = 'tod_guest';
export const hash = (value: string) => createHash('sha256').update(value).digest('hex');
function key() {
  const v = env('RECOVERY_ENCRYPTION_KEY');
  if (!/^[a-f\d]{64}$/i.test(v)) throw new HttpError(503, 'Cấu hình khôi phục chưa sẵn sàng.');
  return Buffer.from(v, 'hex');
}
export function encrypt(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64');
}
export function decrypt(value: string) {
  const b = Buffer.from(value, 'base64');
  const cipher = createDecipheriv('aes-256-gcm', key(), b.subarray(0, 12));
  cipher.setAuthTag(b.subarray(12, 28));
  return Buffer.concat([cipher.update(b.subarray(28)), cipher.final()]).toString('utf8');
}
export function recovery() {
  return createRecovery(env('RECOVERY_ENCRYPTION_KEY'));
}
export async function guest(create = false) {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  const client = db();
  if (token && /^[a-f0-9]{64}$/.test(token)) {
    const { data, error } = await client
      .from('guest_sessions')
      .select('id')
      .eq('token_hash', hash(token))
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();
    check(error);
    if (data) return data.id as string;
  }
  if (!create) throw new HttpError(401, 'Phiên thiết bị đã hết hạn. Vui lòng thử lại.');
  const fresh = randomBytes(32).toString('hex');
  const { data, error } = await client
    .from('guest_sessions')
    .insert({ token_hash: hash(fresh) })
    .select('id')
    .single();
  check(error);
  jar.set(COOKIE, fresh, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 31536000,
  });
  return data!.id as string;
}
export async function limit(scope: string, count: number) {
  const { data, error } = await db().rpc('take_rate_limit', { p_key: scope, p_limit: count });
  check(error);
  if (!data) throw new HttpError(429, 'Bạn thao tác quá nhanh. Vui lòng thử lại sau một phút.');
}
export function sameOrigin(req: Request) {
  if (!hasSameOrigin(req)) throw new HttpError(403, 'Yêu cầu không hợp lệ.');
}
export async function body(req: Request) {
  const text = await req.text();
  if (text.length > 16384) throw new HttpError(400, 'Dữ liệu quá lớn.');
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new HttpError(400, 'Dữ liệu không hợp lệ.');
  }
}
export async function api(fn: () => Promise<unknown>, context = 'api') {
  try {
    return NextResponse.json(await fn(), {
      headers: { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex' },
    });
  } catch (e) {
    if (!(e instanceof HttpError)) {
      // Keep unexpected failures visible in runtime logs, never in the response.
      // Do not log request bodies, cookies or authorization headers.
      console.error(`[${context}] Unexpected server error`, e);
    }
    return NextResponse.json(
      {
        error: e instanceof HttpError ? e.message : 'Dịch vụ tạm thời gián đoạn. Vui lòng thử lại.',
      },
      {
        status: e instanceof HttpError ? e.status : 503,
        headers: { 'Cache-Control': 'private, no-store' },
      },
    );
  }
}
export function bank() {
  return {
    bankName: env('SEPAY_BANK_NAME'),
    accountNumber: env('SEPAY_ACCOUNT_NUMBER'),
    accountName: env('SEPAY_ACCOUNT_NAME'),
  };
}
export async function orderView(row: Record<string, unknown>) {
  const b = bank();
  const status =
    row.status === 'pending' && Date.parse(String(row.expires_at)) < Date.now()
      ? 'expired'
      : row.status;
  const query = new URLSearchParams({
    acc: b.accountNumber,
    bank: b.bankName,
    amount: String(row.amount_vnd),
    des: String(row.payment_code),
  });
  let recoveryCode: string | undefined;
  if (status === 'paid') {
    const { data, error } = await db()
      .from('purchases')
      .select('recovery_ciphertext')
      .eq('order_id', row.id)
      .eq('status', 'active')
      .maybeSingle();
    check(error);
    if (data) recoveryCode = decrypt(data.recovery_ciphertext);
  }
  return {
    id: row.id,
    packId: row.pack_id,
    status,
    amountVnd: row.amount_vnd,
    currency: 'VND',
    expiresAt: row.expires_at,
    paymentCode: row.payment_code,
    qrUrl: `https://qr.sepay.vn/img?${query}`,
    ...b,
    recoveryCode,
  };
}
