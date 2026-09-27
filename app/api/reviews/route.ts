import { api, body, check, db, HttpError, sameOrigin } from '@/lib/payments/server';
import { REVIEW_PAGE_SIZE, reviewInput } from '@/lib/reviews';
export const dynamic = 'force-dynamic';
export async function GET(req: Request) {
  return api(async () => {
    const raw = new URL(req.url).searchParams.get('cursor');
    if (raw !== null && (!/^[1-9]\d*$/.test(raw) || Number(raw) > 2147483647))
      throw new HttpError(400, 'Cursor không hợp lệ.');
    let query = db()
      .from('reviews')
      .select('id,name,comment,rating,created_at')
      .order('id', { ascending: false })
      .limit(REVIEW_PAGE_SIZE + 1);
    if (raw) query = query.lt('id', Number(raw));
    const { data, error } = await query;
    check(error);
    const reviews = (data ?? []).slice(0, REVIEW_PAGE_SIZE);
    return {
      reviews,
      nextCursor: (data?.length ?? 0) > REVIEW_PAGE_SIZE ? reviews.at(-1)!.id : null,
    };
  }, 'reviews.list');
}
export async function POST(req: Request) {
  return api(async () => {
    sameOrigin(req);
    const input = reviewInput(await body(req));
    if (!input) throw new HttpError(400, 'Vui lòng nhập tên, nhận xét và chọn từ 1 đến 5 sao.');
    const { data, error } = await db()
      .from('reviews')
      .insert(input)
      .select('id,name,comment,rating,created_at')
      .single();
    check(error);
    return { review: data };
  }, 'reviews.create');
}
