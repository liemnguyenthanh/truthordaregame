import 'server-only';
import { cache } from 'react';
import { db, check } from './db/server';
import { getPacks as localPacks, getQuestionSet as localSet } from './content';
import type { Pack, QuestionSet } from './types';
export { getCategories, getCategory } from './content';
const configured = () => !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
export const getPacks = cache(async (): Promise<Pack[]> => {
  if (!configured()) return localPacks();
  const { data, error } = await db()
    .from('content_packs')
    .select('metadata')
    .eq('published', true)
    .order('id');
  check(error);
  return (data || []).map((row) => row.metadata as Pack);
});
export async function getPack(slug: string) {
  return (await getPacks()).find((p) => p.slug === slug);
}
export async function getQuestionSet(pack: Pack): Promise<QuestionSet> {
  if (!configured()) return localSet(pack);
  const { data, error } = await db()
    .from('content_pack_versions')
    .select('question_set')
    .eq('pack_id', pack.id)
    .eq('version', pack.contentVersion)
    .single();
  check(error);
  return data!.question_set as QuestionSet;
}
