import { cookies } from 'next/headers';
import { api, sameOrigin, body, limit, HttpError } from '@/lib/payments/server';
import { ADMIN_COOKIE, adminPassword } from '@/lib/admin/server';
import { equalSecret, issueToken } from '@/lib/admin/token';
export async function POST(req: Request) {
  return api(async () => {
    sameOrigin(req);
    const password = adminPassword();
    // Global database-backed limit cannot be bypassed with a spoofed client IP.
    await limit('admin-login', 10);
    const input = await body(req);
    if (typeof input.password !== 'string' || !equalSecret(input.password, password))
      throw new HttpError(401, 'Mật khẩu không đúng.');
    (await cookies()).set(ADMIN_COOKIE, issueToken(password), {
      httpOnly: true,
      secure: new URL(req.url).protocol === 'https:',
      sameSite: 'strict',
      path: '/',
      maxAge: 8 * 60 * 60,
    });
    return { ok: true };
  });
}
export async function DELETE(req: Request) {
  return api(async () => {
    sameOrigin(req);
    (await cookies()).delete(ADMIN_COOKIE);
    return { ok: true };
  });
}
