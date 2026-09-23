import type { MetadataRoute } from 'next';
import { getCategories, getPacks } from '@/lib/live-content';
import { siteUrl } from '@/lib/seo';
export const dynamic = 'force-dynamic';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const packs = await getPacks('vi');
  const categories = getCategories('vi');
  const paths = [
    '/',
    '/danh-muc',
    '/cach-choi',
    '/chinh-sach-thanh-toan',
    '/quyen-rieng-tu',
    '/lien-he',
    ...categories.map((c) => `/danh-muc/${c.slug}`),
  ];
  const entries: MetadataRoute.Sitemap = paths.map((path) => ({
    url: siteUrl + path,
    changeFrequency: 'monthly',
    priority: path === '/' ? 1 : 0.7,
  }));
  for (const pack of packs) {
    const path = `/bo-cau-hoi/${pack.slug}`;
    entries.push({
      url: siteUrl + path,
      changeFrequency: 'monthly',
      priority: 0.8,
    });
  }
  return entries;
}
