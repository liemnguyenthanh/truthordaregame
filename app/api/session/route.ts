import { api, guest, sameOrigin, limit, hash } from '@/lib/payments/server';
export const dynamic = 'force-dynamic';
export async function POST(req: Request) {
  return api(async () => {
    sameOrigin(req);
    await limit(
      'session:' + hash(req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'),
      30,
    );
    await guest(true);
    return { ok: true };
  });
}
