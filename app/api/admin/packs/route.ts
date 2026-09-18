import { randomUUID } from 'node:crypto';
import { api, sameOrigin, db, check, HttpError } from '@/lib/payments/server';
import { requireAdmin } from '@/lib/admin/server';
import { validatePack } from '@/lib/admin/validation';
export async function GET() {
  return api(async () => {
    await requireAdmin();
    const { data, error } = await db()
      .from('content_packs')
      .select('metadata,question_set,revision')
      .order('updated_at', { ascending: false });
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
    try {
      input = validatePack(JSON.parse(raw), randomUUID());
    } catch (e) {
      throw new HttpError(400, e instanceof Error ? e.message : 'JSON không hợp lệ.');
    }
    const { data, error } = await db().rpc('save_content_pack', {
      p_metadata: input.metadata,
      p_questions: input.questionSet,
      p_expected: input.expected,
    });
    if (error?.code === '23505') throw new HttpError(409, 'Mã bộ hoặc đường dẫn đã tồn tại.');
    check(error);
    if (data?.error)
      throw new HttpError(
        409,
        'Bộ đã được chỉnh sửa ở phiên khác hoặc đường dẫn bị thay đổi. Hãy tải lại trước khi sửa.',
      );
    return {
      record: {
        metadata: input.metadata,
        question_set: input.questionSet,
        revision: input.metadata.contentVersion,
      },
    };
  });
}
