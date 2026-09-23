import { notFound } from 'next/navigation';
import Link from 'next/link';
import { SiteShell } from '@/components/site-shell';
import { PackCard } from '@/components/pack-card';
import { getCategory, getPacks } from '@/lib/live-content';
import { pageMetadata, siteUrl } from '@/lib/seo';
import { StructuredData } from '@/components/structured-data';
import { localePath } from '@/lib/i18n';
import { pageLocale, copy } from '@/lib/i18n/pages';
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug } = await params;
  const locale = await pageLocale(params);
  const c = getCategory(slug, locale);
  return c
    ? pageMetadata(
        copy(locale, `Câu hỏi cho ${c.name.toLowerCase()}`, `Truth or Dare for ${c.name}`),
        c.description,
        `/vi/danh-muc/${slug}`,
        locale,
      )
    : {};
}
export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug } = await params;
  const locale = await pageLocale(params);
  const c = getCategory(slug, locale);
  if (!c) notFound();
  const packs = (await getPacks(locale)).filter((p) => p.categoryIds.includes(c.id));
  return (
    <SiteShell>
      <main id="main" className="page-width content-page">
        <Link className="back-link" href={localePath(locale, '/vi')}>
          {copy(locale, '← Tất cả bộ câu hỏi', '← All question packs')}
        </Link>
        <span className="eyebrow">
          {c.icon} {copy(locale, 'CHỌN CHỦ ĐỀ', 'CHOOSE A CATEGORY')}
        </span>
        <h1>{c.name}</h1>
        <p className="page-description">{c.description}</p>
        <div className="pack-grid">
          {packs.map((p) => (
            <PackCard pack={p} key={p.id} />
          ))}
        </div>
      </main>
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: c.name,
          description: c.description,
          url: siteUrl + localePath(locale, `/vi/danh-muc/${slug}`),
          mainEntity: {
            '@type': 'ItemList',
            itemListElement: packs.map((p, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              url: siteUrl + localePath(locale, `/vi/bo-cau-hoi/${p.slug}`),
              name: p.title,
            })),
          },
        }}
      />
    </SiteShell>
  );
}
