import { getPacks } from '@/lib/live-content';
import { api } from '@/lib/payments/server';
export const dynamic = 'force-dynamic';
export async function GET() {
  return api(async () => ({ packs: await getPacks() }));
}
