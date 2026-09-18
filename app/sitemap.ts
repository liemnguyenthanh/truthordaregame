export const dynamic = 'force-dynamic';
import type { MetadataRoute } from 'next';
import { getCategories, getPacks } from '@/lib/live-content';
import { siteUrl } from '@/lib/seo';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [
    '/vi',
    '/vi/danh-muc',
    '/vi/cach-choi',
    '/vi/chinh-sach-thanh-toan',
    '/vi/quyen-rieng-tu',
    '/vi/lien-he',
    ...getCategories().map((c) => `/vi/danh-muc/${c.slug}`),
    ...(await getPacks()).map((p) => `/vi/bo-cau-hoi/${p.slug}`),
  ].map((path) => ({
    url: siteUrl + path,
    changeFrequency: 'monthly',
    priority: path === '/vi' ? 1 : 0.7,
  }));
}
