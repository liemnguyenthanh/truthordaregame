import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Locale } from './i18n';
import type { Category, Pack, QuestionSet } from './types';

function readPublicJson<T>(file: string): T {
  const root = path.resolve(process.cwd(), 'public');
  const target = path.resolve(root, file.replace(/^\//, ''));
  if (!target.startsWith(`${root}${path.sep}`)) throw new Error('Invalid content path');
  return JSON.parse(readFileSync(target, 'utf8')) as T;
}

export function getPacks(locale: Locale = 'vi'): Pack[] {
  return readPublicJson<{ packs: Pack[] }>(`/${locale}/packs.json`)
    .packs.filter((pack) => pack.published)
    .map((pack) => ({ ...pack, locale }));
}
export function getCategories(locale: Locale = 'vi'): Category[] {
  return readPublicJson<{ categories: Category[] }>(`/${locale}/categories.json`).categories.sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
}
export function getPack(slug: string, locale: Locale = 'vi'): Pack | undefined {
  return getPacks(locale).find((pack) => pack.slug === slug);
}
export function getCategory(slug: string, locale: Locale = 'vi'): Category | undefined {
  return getCategories(locale).find((category) => category.slug === slug);
}
export function getQuestionSet(pack: Pack): QuestionSet {
  return readPublicJson<QuestionSet>(pack.questionFile);
}

/** Imported revisions can differ; fallback requires demonstrably identical source content. */
export function bundledTranslation(
  pack: Pack,
  source: QuestionSet,
  locale: Locale,
): Pack | undefined {
  const canonical = getPacks('vi').find((p) => p.id === pack.id);
  const translated = getPacks(locale).find((p) => p.id === pack.id);
  if (!canonical || !translated) return;
  const original = getQuestionSet(canonical);
  const semanticKeys = [
    'slug',
    'title',
    'description',
    'tier',
    'categoryIds',
    'ageLabel',
    'playerRange',
    'questionCount',
    'truthCount',
    'dareCount',
    'trialCount',
  ] as const;
  if (
    semanticKeys.some((key) => JSON.stringify(pack[key]) !== JSON.stringify(canonical[key])) ||
    source.locale !== 'vi' ||
    source.packId !== pack.id ||
    JSON.stringify(source.questions.map(({ id, type, text }) => ({ id, type, text }))) !==
      JSON.stringify(original.questions.map(({ id, type, text }) => ({ id, type, text }))) ||
    JSON.stringify(source.trialQuestionIds) !== JSON.stringify(original.trialQuestionIds)
  )
    return;
  return {
    ...pack,
    title: translated.title,
    description: translated.description,
    locale,
    contentVersion: translated.contentVersion,
    questionFile: translated.questionFile,
  };
}

export type TranslationRecord = { metadata: Pack; source_revision: string; published: boolean };
/** An editor's draft or stale translation is authoritative; never replace it with bundled copy. */
export function resolveTranslation(
  pack: Pack,
  source: QuestionSet,
  locale: Locale,
  row?: TranslationRecord,
): Pack | undefined {
  if (row) {
    if (!row.published || row.source_revision !== pack.contentVersion) return;
    return {
      ...row.metadata,
      locale,
      tier: pack.tier,
      priceHintVnd: pack.priceHintVnd,
      productId: pack.productId,
    };
  }
  return bundledTranslation(pack, source, locale);
}
