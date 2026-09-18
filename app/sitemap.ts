import type { MetadataRoute } from 'next';
import { getCategories, getPacks } from '@/lib/content';
import { siteUrl } from '@/lib/seo';
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    '/vi',
    '/vi/danh-muc',
    '/vi/cach-choi',
    '/vi/chinh-sach-thanh-toan',
    '/vi/quyen-rieng-tu',
    '/vi/lien-he',
    ...getCategories().map((c) => `/vi/danh-muc/${c.slug}`),
    ...getPacks().map((p) => `/vi/bo-cau-hoi/${p.slug}`),
  ].map((path) => ({
    url: siteUrl + path,
    lastModified: '2026-09-17',
    changeFrequency: 'monthly',
    priority: path === '/vi' ? 1 : 0.7,
  }));
}
