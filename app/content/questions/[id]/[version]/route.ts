import { isLocale } from '@/lib/i18n';
import { db, check } from '@/lib/db/server';
import { api, HttpError } from '@/lib/payments/server';
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; version: string }> },
) {
  return api(async () => {
    const locale = new URL(req.url).searchParams.get('locale') ?? 'vi';
    if (!isLocale(locale)) throw new HttpError(400, 'Unsupported language.');
    const { id, version } = await params;
    const client = db();
    const { data: pack, error: pe } = await client
      .from('content_packs')
      .select('id')
      .eq('id', id)
      .eq('published', true)
      .maybeSingle();
    check(pe);
    if (!pack) throw new HttpError(404, 'Không tìm thấy bộ câu hỏi.');
    const query = client
      .from(locale === 'vi' ? 'content_pack_versions' : 'content_pack_translation_versions')
      .select('question_set')
      .eq('pack_id', id)
      .eq('version', version);
    if (locale !== 'vi') query.eq('locale', locale);
    const { data, error } = await query.maybeSingle();
    check(error);
    if (!data) throw new HttpError(404, 'Không tìm thấy phiên bản.');
    if (data.question_set.locale !== locale) throw new HttpError(404, 'Language unavailable.');
    return data.question_set;
  });
}
