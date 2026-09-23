import 'server-only';
import { cache } from 'react';
import { db, check } from './db/server';
import { getPacks as localPacks, getQuestionSet as localSet, resolveTranslation } from './content';
import type { Locale } from './i18n';
import type { Pack, QuestionSet } from './types';
export { getCategories, getCategory } from './content';
const configured = () => !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;

export const getPacks = cache(async (locale: Locale = 'vi'): Promise<Pack[]> => {
  if (!configured()) return localPacks(locale);
  let rows: Array<{ metadata: Pack; question_set: QuestionSet }>;
  try {
    const { data, error } = await db()
      .from('content_packs')
      .select('metadata,question_set')
      .eq('published', true)
      .order('id');
    check(error);
    rows = data || [];
  } catch (error) {
    console.error('[content] Falling back to bundled packs:', error);
    return locale === 'vi' ? localPacks(locale) : [];
  }
  if (!rows.length) return locale === 'vi' ? localPacks(locale) : [];
  if (locale === 'vi') return rows.map(({ metadata }) => ({ ...metadata, locale }));
  const { data, error } = await db()
    .from('content_pack_translations')
    .select('metadata,source_revision,published')
    .eq('locale', locale);
  // Before the additive migration is applied, show only source-compatible bundled translations.
  if (error) {
    console.error('[content] Translation storage unavailable:', error.message);
    // Missing additive schema permits compatible bundled content; other errors fail closed.
    if (!['42P01', 'PGRST205'].includes(error.code)) return [];
  }
  return rows.flatMap(({ metadata: pack, question_set }) => {
    const row = data?.find((r) => r.metadata.id === pack.id);
    const translated = resolveTranslation(pack, question_set, locale, row);
    return translated ? [translated] : [];
  });
});
export async function getPack(slug: string, locale: Locale = 'vi') {
  return (await getPacks(locale)).find((p) => p.slug === slug);
}
export async function getQuestionSet(pack: Pack): Promise<QuestionSet> {
  const locale = pack.locale ?? 'vi';
  if (!configured() || pack.questionFile.startsWith(`/${locale}/questions/`)) return localSet(pack);
  const query = db()
    .from(locale === 'vi' ? 'content_pack_versions' : 'content_pack_translation_versions')
    .select('question_set')
    .eq('pack_id', pack.id)
    .eq('version', pack.contentVersion);
  if (locale !== 'vi') query.eq('locale', locale);
  const { data, error } = await query.single();
  check(error);
  const set = data!.question_set as QuestionSet;
  if (set.locale !== locale) throw new Error('Question language does not match requested locale');
  return set;
}
