import 'server-only';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { db, check } from './db/server';
import { getPacks as localPacks, getQuestionSet as localSet, resolveTranslation } from './content';
import type { Locale } from './i18n';
import type { Pack, QuestionSet } from './types';
export { catalogVersion, getCategories, getCategory } from './content';
const configured = () => !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
export const CONTENT_CACHE_TAG = 'published-content';
const cacheOptions = { revalidate: 300, tags: [CONTENT_CACHE_TAG] };

// Shared across requests and locales. Lists never load every pack's question payload.
const publishedPacks = unstable_cache(
  async (): Promise<Pack[]> => {
    const { data, error } = await db()
      .from('content_packs')
      .select('metadata')
      .eq('published', true)
      .order('id');
    check(error);
    return (data || []).map(({ metadata }) => ({ ...metadata, locale: 'vi' }));
  },
  ['published-pack-metadata-v1'],
  cacheOptions,
);

const translatedPacks = unstable_cache(
  async (locale: Locale, packs: Pack[]): Promise<Pack[]> => {
    const { data, error } = await db()
      .from('content_pack_translations')
      .select('metadata,source_revision,published')
      .eq('locale', locale);
    if (error) {
      // Only a missing additive schema permits compatible bundled translations.
      if (!['42P01', 'PGRST205'].includes(error.code)) check(error);
    }
    const translated = await Promise.all(
      packs.map(async (pack) => {
        const row = data?.find((r) => r.metadata.id === pack.id);
        if (row) {
          if (!row.published || row.source_revision !== pack.contentVersion) return;
          return {
            ...row.metadata,
            locale,
            tier: pack.tier,
            priceHintVnd: pack.priceHintVnd,
            productId: pack.productId,
          } as Pack;
        }
        // Legacy fallback must compare source questions; fetch only missing translations.
        return resolveTranslation(pack, await getQuestionSet(pack), locale);
      }),
    );
    return translated.filter((pack): pack is Pack => !!pack);
  },
  ['published-translations-v1'],
  cacheOptions,
);

export const getPacks = cache(async (locale: Locale = 'vi'): Promise<Pack[]> => {
  if (!configured()) return localPacks(locale);
  // A failed refresh must preserve the last good ISR page, not cache bundled
  // fallback content. An empty published catalog must also stay empty.
  const packs = await publishedPacks();
  if (locale === 'vi') return packs;
  return translatedPacks(locale, packs);
});
export async function getPack(slug: string, locale: Locale = 'vi') {
  return (await getPacks(locale)).find((p) => p.slug === slug);
}
const versionedQuestions = unstable_cache(
  async (id: string, version: string, locale: Locale): Promise<QuestionSet> => {
    const query = db()
      .from(locale === 'vi' ? 'content_pack_versions' : 'content_pack_translation_versions')
      .select('question_set')
      .eq('pack_id', id)
      .eq('version', version);
    if (locale !== 'vi') query.eq('locale', locale);
    const { data, error } = await query.single();
    check(error);
    const set = data!.question_set as QuestionSet;
    if (set.locale !== locale) throw new Error('Question language does not match requested locale');
    return set;
  },
  ['versioned-questions-v1'],
  cacheOptions,
);

export async function getQuestionSet(pack: Pack): Promise<QuestionSet> {
  const locale = pack.locale ?? 'vi';
  if (!configured() || pack.questionFile.startsWith(`/${locale}/questions/`)) return localSet(pack);
  return versionedQuestions(pack.id, pack.contentVersion, locale);
}
