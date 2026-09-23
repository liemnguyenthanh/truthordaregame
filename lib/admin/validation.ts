import { isLocale } from '../i18n';
import type { Pack, Question, QuestionSet } from '../types';
export type ContentRecord = { metadata: Pack; question_set: QuestionSet; revision: string };
const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
function fail(message: string): never {
  throw new Error(message);
}
function text(value: unknown, label: string, max: number) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max)
    fail(`${label} không hợp lệ (tối đa ${max} ký tự).`);
  return value.trim();
}
export function parseQuestions(value: unknown): Question[] {
  const rows = Array.isArray(value)
    ? value
    : value && typeof value === 'object'
      ? (value as Record<string, unknown>).questions
      : null;
  if (!Array.isArray(rows) || rows.length < 2 || rows.length > 2000)
    fail('Cần từ 2 đến 2.000 câu hỏi.');
  const ids = new Set<string>();
  return rows.map((row, i) => {
    if (!row || typeof row !== 'object') fail(`Câu ${i + 1} không hợp lệ.`);
    const id = row.id === undefined ? `q-${i + 1}` : text(row.id, `ID câu ${i + 1}`, 100);
    if (ids.has(id)) fail(`Trùng ID câu hỏi: ${id}`);
    ids.add(id);
    if (row.type !== 'truth' && row.type !== 'dare')
      fail(`Câu ${i + 1}: loại phải là truth hoặc dare.`);
    return { id, type: row.type, text: text(row.text, `Nội dung câu ${i + 1}`, 2000) };
  });
}
export function validatePack(
  value: unknown,
  version: string,
): { metadata: Pack; questionSet: QuestionSet; expected: string | null } {
  if (!value || typeof value !== 'object') fail('Dữ liệu không hợp lệ.');
  const v = value as Record<string, unknown>;
  const locale = v.locale ?? 'vi';
  if (!isLocale(locale)) fail('Unsupported language.');
  const id = text(v.id, 'Mã bộ', 80),
    route = text(v.slug, 'Đường dẫn', 80);
  if (!slug.test(id) || !slug.test(route))
    fail('Mã bộ và đường dẫn chỉ gồm chữ thường không dấu, số và dấu gạch ngang.');
  if (v.tier !== 'free' && v.tier !== 'premium') fail('Loại bộ không hợp lệ.');
  const price = v.tier === 'free' ? 0 : v.priceHintVnd;
  if (
    typeof price !== 'number' ||
    !Number.isSafeInteger(price) ||
    price < (v.tier === 'free' ? 0 : 1000) ||
    price > 100000000
  )
    fail('Giá bán phải là số nguyên từ 1.000 đến 100.000.000 VND.');
  if (typeof v.published !== 'boolean') fail('Trạng thái không hợp lệ.');
  const questions = parseQuestions(v.questions);
  const truths = questions.filter((q) => q.type === 'truth'),
    dares = questions.filter((q) => q.type === 'dare');
  if (!truths.length || !dares.length) fail('Bộ cần có cả câu Thật và câu Thách.');
  if (v.tier === 'premium' && (truths.length < 5 || dares.length < 5))
    fail('Bộ trả phí cần ít nhất 5 câu Thật và 5 câu Thách (4 câu mỗi loại dành cho chơi thử).');
  if (
    !Array.isArray(v.categoryIds) ||
    !v.categoryIds.length ||
    v.categoryIds.some((c) => !['friends', 'couples'].includes(c))
  )
    fail('Chọn ít nhất một danh mục.');
  const range = v.playerRange as { min: number; max: number } | undefined;
  if (
    !range ||
    !Number.isInteger(range.min) ||
    !Number.isInteger(range.max) ||
    range.min < 2 ||
    range.max < range.min ||
    range.max > 100
  )
    fail('Số người chơi phải từ 2 đến 100; tối đa không nhỏ hơn tối thiểu.');
  if (!['purple', 'pink', 'orange'].includes(String(v.color))) fail('Màu không hợp lệ.');
  if (!['16+', '18+'].includes(String(v.ageLabel))) fail('Độ tuổi không hợp lệ.');
  if (v.expected !== null && (typeof v.expected !== 'string' || v.expected.length > 100))
    fail('Phiên bản không hợp lệ.');
  const trialQuestionIds =
    v.tier === 'premium' ? [...truths.slice(0, 4), ...dares.slice(0, 4)].map((q) => q.id) : [];
  const metadata: Pack = {
    id,
    locale,
    slug: route,
    title: text(v.title, 'Tên bộ', 120),
    description: text(v.description, 'Mô tả', 1000),
    tier: v.tier,
    questionFile: `/content/questions/${id}/${version}${locale === 'vi' ? '' : '?locale=' + locale}`,
    contentVersion: version,
    questionCount: questions.length,
    truthCount: truths.length,
    dareCount: dares.length,
    trialCount: trialQuestionIds.length,
    priceHintVnd: price,
    productId: v.tier === 'premium' ? id : null,
    ageLabel: String(v.ageLabel),
    playerRange: range,
    published: v.published,
    icon: text(v.icon, 'Biểu tượng', 16),
    color: v.color as Pack['color'],
    categoryIds: [...new Set(v.categoryIds as string[])],
  };
  return {
    metadata,
    questionSet: {
      schemaVersion: 1,
      packId: id,
      locale,
      contentVersion: version,
      trialQuestionIds,
      questions,
    },
    expected: v.expected as string | null,
  };
}
