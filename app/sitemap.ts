import type { MetadataRoute } from 'next';
import { getCategories, getPacks } from '@/lib/live-content';
import { siteUrl, languageAlternates } from '@/lib/seo';
import { localePath, locales, type Locale } from '@/lib/i18n';
export const dynamic = 'force-dynamic';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const catalogs = await Promise.all(
    locales.map(async (locale) => ({ locale, packs: await getPacks(locale) })),
  );
  const entries: MetadataRoute.Sitemap = [];
  for (const { locale, packs } of catalogs) {
    const paths = [
      '/vi',
      '/vi/danh-muc',
      '/vi/cach-choi',
      '/vi/chinh-sach-thanh-toan',
      '/vi/quyen-rieng-tu',
      '/vi/lien-he',
      ...getCategories(locale).map((c) => `/vi/danh-muc/${c.slug}`),
    ];
    for (const path of paths)
      entries.push({
        url: siteUrl + localePath(locale, path),
        alternates: { languages: languageAlternates(path) },
        changeFrequency: 'monthly',
        priority: path === '/vi' ? 1 : 0.7,
      });
    for (const pack of packs) {
      const path = `/vi/bo-cau-hoi/${pack.slug}`;
      const available: Locale[] = catalogs
        .filter((c) => c.packs.some((p) => p.slug === pack.slug))
        .map((c) => c.locale);
      entries.push({
        url: siteUrl + localePath(locale, path),
        alternates: { languages: languageAlternates(path, available) },
        changeFrequency: 'monthly',
        priority: 0.8,
      });
    }
  }
  return entries;
}
