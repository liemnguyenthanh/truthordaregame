import { db, check } from '@/lib/db/server';
import { api, HttpError } from '@/lib/payments/server';
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string; version: string }> },
) {
  return api(async () => {
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
    const { data, error } = await client
      .from('content_pack_versions')
      .select('question_set')
      .eq('pack_id', id)
      .eq('version', version)
      .maybeSingle();
    check(error);
    if (!data) throw new HttpError(404, 'Không tìm thấy phiên bản.');
    return data.question_set;
  });
}
