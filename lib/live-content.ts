import 'server-only';
import { cache } from 'react';
import { db, check } from './db/server';
import { getPacks as localPacks, getQuestionSet as localSet } from './content';
import type { Pack, QuestionSet } from './types';
export { getCategories, getCategory } from './content';
const configured = () => !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
export const getPacks = cache(async (): Promise<Pack[]> => {
  if (!configured()) return localPacks();

  try {
    const { data, error } = await db()
      .from('content_packs')
      .select('metadata')
      .eq('published', true)
      .order('id');
    check(error);
    const packs = (data || []).map((row) => row.metadata as Pack);
    return packs.length > 0 ? packs : localPacks();
  } catch (error) {
    console.error('[content] Falling back to bundled packs:', error);
    return localPacks();
  }
});
export async function getPack(slug: string) {
  return (await getPacks()).find((p) => p.slug === slug);
}
export async function getQuestionSet(pack: Pack): Promise<QuestionSet> {
  if (!configured()) return localSet(pack);

  try {
    const { data, error } = await db()
      .from('content_pack_versions')
      .select('question_set')
      .eq('pack_id', pack.id)
      .eq('version', pack.contentVersion)
      .single();
    check(error);
    return data!.question_set as QuestionSet;
  } catch (error) {
    console.error(`[content] Falling back to bundled questions for ${pack.slug}:`, error);
    return localSet(pack);
  }
}
