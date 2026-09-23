import type { Metadata } from 'next';
import { localePath, type Locale } from '@/lib/i18n';
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(
  /\/$/,
  '',
);
export function languageAlternates(path: string, available: readonly Locale[] = ['vi', 'en']) {
  const languages: Record<string, string> = {};
  for (const locale of available) languages[locale] = siteUrl + localePath(locale, path);
  if (available.includes('vi')) languages['x-default'] = siteUrl + localePath('vi', path);
  return languages;
}
export function pageMetadata(
  title: string,
  description: string,
  path: string,
  locale: Locale = 'vi',
  available: readonly Locale[] = ['vi', 'en'],
): Metadata {
  const url = siteUrl + localePath(locale, path);
  return {
    title,
    description,
    alternates: { canonical: url, languages: languageAlternates(path, available) },
    openGraph: {
      title,
      description,
      url,
      locale: locale === 'en' ? 'en_US' : 'vi_VN',
      alternateLocale: available
        .filter((l) => l !== locale)
        .map((l) => (l === 'en' ? 'en_US' : 'vi_VN')),
      type: 'website',
      siteName: locale === 'en' ? 'Truth or Dare' : 'Thật hay Thách',
      images: [
        {
          url: `/${locale}/share.png`,
          width: 1200,
          height: 630,
          type: 'image/png',
          alt: locale === 'en' ? 'Truth or Dare' : 'Thật hay Thách',
        },
      ],
    },
    twitter: { card: 'summary_large_image', title, description, images: [`/${locale}/share.png`] },
  };
}
