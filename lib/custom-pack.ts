import type { Question, QuestionSet, QuestionType } from './types';

export const CUSTOM_PACK_STORAGE_KEY = 'tod:custom-pack:v1';

export type CustomQuestionSet = QuestionSet & {
  title: string;
  description: string;
};

function isType(value: unknown): value is QuestionType {
  return value === 'truth' || value === 'dare';
}

function text(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

export function validateCustomQuestionSet(input: unknown): CustomQuestionSet {
  const source = Array.isArray(input) ? { questions: input } : input;
  if (!source || typeof source !== 'object')
    throw new Error('JSON phải là một object hoặc mảng câu hỏi.');
  const data = source as Record<string, unknown>;
  if (!Array.isArray(data.questions) || data.questions.length === 0)
    throw new Error('Bộ câu hỏi cần có mảng questions và ít nhất một câu hỏi.');

  const questions: Question[] = data.questions.map((item, index) => {
    if (!item || typeof item !== 'object')
      throw new Error(`Câu hỏi thứ ${index + 1} không hợp lệ.`);
    const value = item as Record<string, unknown>;
    const questionText = text(value.text);
    if (!questionText || !isType(value.type))
      throw new Error(`Câu hỏi thứ ${index + 1} cần có type là truth/dare và text không rỗng.`);
    return { id: text(value.id) ?? `custom-${index + 1}`, type: value.type, text: questionText };
  });

  const ids = new Set<string>();
  for (const question of questions) {
    if (ids.has(question.id)) throw new Error(`ID bị trùng: ${question.id}.`);
    ids.add(question.id);
  }
  const title = text(data.title) ?? 'Bộ câu hỏi của tôi';
  const description = text(data.description) ?? 'Bộ câu hỏi tùy chỉnh';
  return {
    schemaVersion: 1,
    packId: 'custom-import',
    locale: text(data.locale) ?? 'vi',
    contentVersion: `custom-${questions.length}-${Date.now()}`,
    trialQuestionIds: questions.map((question) => question.id),
    questions,
    title,
    description,
  };
}

export function countQuestionTypes(set: QuestionSet) {
  return {
    truth: set.questions.filter((question) => question.type === 'truth').length,
    dare: set.questions.filter((question) => question.type === 'dare').length,
  };
}

export function customPackFromSet(set: CustomQuestionSet) {
  const counts = countQuestionTypes(set);
  return {
    id: set.packId,
    slug: 'tuy-chinh',
    title: set.title,
    description: set.description,
    tier: 'free' as const,
    questionFile: '',
    contentVersion: set.contentVersion,
    questionCount: set.questions.length,
    truthCount: counts.truth,
    dareCount: counts.dare,
    trialCount: set.questions.length,
    priceHintVnd: 0,
    productId: null,
    ageLabel: 'Tùy chỉnh',
    playerRange: { min: 1, max: 99 },
    published: true,
    icon: '✦',
    color: 'purple' as const,
    categoryIds: [],
  };
}
