import { getPacks } from '@/lib/live-content';
import { isLocale } from '@/lib/i18n';
import { api, HttpError } from '@/lib/payments/server';
export const dynamic = 'force-dynamic';
export async function GET(req: Request) {
  return api(async () => {
    const locale = new URL(req.url).searchParams.get('locale') ?? 'vi';
    if (!isLocale(locale)) throw new HttpError(400, 'Unsupported language.');
    return { packs: await getPacks(locale) };
  });
}
