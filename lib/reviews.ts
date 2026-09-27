export type Review = {
  id: number;
  name: string;
  comment: string;
  rating: number;
  created_at: string;
};
export type ReviewPage = { reviews: Review[]; nextCursor: number | null };
export const REVIEW_PAGE_SIZE = 12;
export function reviewInput(value: unknown) {
  if (!value || typeof value !== 'object') return null;
  const { name, comment, rating } = value as Record<string, unknown>;
  if (typeof name !== 'string' || typeof comment !== 'string' || typeof rating !== 'number')
    return null;
  const clean = { name: name.trim(), comment: comment.trim(), rating };
  return clean.name.length >= 1 &&
    clean.name.length <= 60 &&
    clean.comment.length >= 1 &&
    clean.comment.length <= 1000 &&
    Number.isInteger(rating) &&
    rating >= 1 &&
    rating <= 5
    ? clean
    : null;
}
