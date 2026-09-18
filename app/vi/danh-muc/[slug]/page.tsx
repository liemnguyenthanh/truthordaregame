import { notFound } from 'next/navigation';
import Link from 'next/link';
import { SiteShell } from '@/components/site-shell';
import { PackCard } from '@/components/pack-card';
import { getCategory, getPacks } from '@/lib/live-content';
import { pageMetadata, siteUrl } from '@/lib/seo';
import { StructuredData } from '@/components/structured-data';
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getCategory(slug);
  return c
    ? pageMetadata(`Câu hỏi cho ${c.name.toLowerCase()}`, c.description, `/vi/danh-muc/${slug}`)
    : {};
}
export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getCategory(slug);
  if (!c) notFound();
  const packs = (await getPacks()).filter((p) => p.categoryIds.includes(c.id));
  return (
    <SiteShell>
      <main id="main" className="page-width content-page">
        <Link className="back-link" href="/vi">
          ← Tất cả bộ câu hỏi
        </Link>
        <span className="eyebrow">{c.icon} CHỌN CHỦ ĐỀ</span>
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
          url: `${siteUrl}/vi/danh-muc/${slug}`,
          mainEntity: {
            '@type': 'ItemList',
            itemListElement: packs.map((p, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              url: `${siteUrl}/vi/bo-cau-hoi/${p.slug}`,
              name: p.title,
            })),
          },
        }}
      />
    </SiteShell>
  );
}
