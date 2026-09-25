import { revalidatePath, revalidateTag } from 'next/cache';
import { CONTENT_CACHE_TAG } from '@/lib/live-content';
import { isLocale } from '@/lib/i18n';
import { randomUUID } from 'node:crypto';
import { api, sameOrigin, db, check, HttpError } from '@/lib/payments/server';
import { requireAdmin } from '@/lib/admin/server';
import { validatePack } from '@/lib/admin/validation';
export async function GET(req: Request) {
  return api(async () => {
    await requireAdmin();
    const locale = new URL(req.url).searchParams.get('locale') ?? 'vi';
    if (!isLocale(locale)) throw new HttpError(400, 'Unsupported language.');
    const query = db()
      .from(locale === 'vi' ? 'content_packs' : 'content_pack_translations')
      .select(
        locale === 'vi'
          ? 'metadata,question_set,revision'
          : 'metadata,question_set,revision,source_revision',
      )
      .order('updated_at', { ascending: false });
    if (locale !== 'vi') query.eq('locale', locale);
    const { data, error } = await query;
    check(error);
    return { packs: data };
  });
}
export async function POST(req: Request) {
  return api(async () => {
    sameOrigin(req);
    await requireAdmin();
    const raw = await req.text();
    if (Buffer.byteLength(raw) > 2_000_000) throw new HttpError(413, 'Nội dung vượt quá 2 MB.');
    let input;
    let rawInput: Record<string, unknown>;
    try {
      rawInput = JSON.parse(raw);
      input = validatePack(rawInput, randomUUID());
    } catch (e) {
      throw new HttpError(400, e instanceof Error ? e.message : 'JSON không hợp lệ.');
    }
    const translated = input.metadata.locale === 'en';
    if (translated && typeof rawInput.sourceRevision !== 'string')
      throw new HttpError(400, 'Source revision is required.');
    const { data, error } = await db().rpc(
      translated ? 'save_content_translation' : 'save_content_pack',
      {
        p_metadata: input.metadata,
        p_questions: input.questionSet,
        p_expected: input.expected,
        ...(translated ? { p_source_revision: rawInput.sourceRevision } : {}),
      },
    );
    if (error?.code === '23505') throw new HttpError(409, 'Mã bộ hoặc đường dẫn đã tồn tại.');
    check(error);
    if (data?.error)
      throw new HttpError(
        409,
        'Bộ đã được chỉnh sửa ở phiên khác hoặc đường dẫn bị thay đổi. Hãy tải lại trước khi sửa.',
      );
    // Expire both locales together: source edits can invalidate a translation.
    revalidateTag(CONTENT_CACHE_TAG, { expire: 0 });
    revalidatePath('/[locale]', 'layout');
    return {
      record: {
        metadata: data?.metadata ?? input.metadata,
        ...(translated ? { source_revision: rawInput.sourceRevision } : {}),
        question_set: input.questionSet,
        revision: input.metadata.contentVersion,
      },
    };
  });
}
