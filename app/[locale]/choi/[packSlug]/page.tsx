import { notFound } from 'next/navigation';
import { localePath } from '@/lib/i18n';
import { Game } from '@/components/game';
import { OfflinePack } from '@/components/pwa';
import { getPack, getPacks, getQuestionSet } from '@/lib/live-content';
import { pageLocale, copy } from '@/lib/i18n/pages';
export const revalidate = 300;
export async function generateStaticParams() {
  // Both locales share source slugs. Prebuild unavailable translations as 404s;
  // publishing invalidates them. Returning [] for an empty locale prevents Next
  // from prebuilding even the populated locale when params come from a parent.
  return (await getPacks('vi')).map((pack) => ({ packSlug: pack.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ packSlug: string; locale: string }>;
}) {
  const locale = await pageLocale(params);
  const p = await getPack((await params).packSlug, locale);
  return {
    title: p ? copy(locale, `Chơi ${p.title}`, `Play ${p.title}`) : copy(locale, 'Chơi', 'Play'),
    robots: { index: false, follow: true },
  };
}
export default async function GamePage({
  params,
}: {
  params: Promise<{ packSlug: string; locale: string }>;
}) {
  const locale = await pageLocale(params);
  const otherLocale = locale === 'vi' ? 'en' : 'vi';
  const { packSlug } = await params;
  const [p, alternatePack] = await Promise.all([
    getPack(packSlug, locale),
    getPack(packSlug, otherLocale),
  ]);
  if (!p) notFound();
  const initialSet = await getQuestionSet(p);
  const alternateHref = alternatePack ? undefined : localePath(otherLocale, '/vi/danh-muc');
  return (
    <main id="main">
      <Game pack={p} initialSet={initialSet} alternateHref={alternateHref} />
      <OfflinePack pack={p} />
    </main>
  );
}
