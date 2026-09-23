import type { Metadata } from 'next';
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(
  /\/$/,
  '',
);
export function pageMetadata(
  title: string,
  description: string,
  path: string,
): Metadata {
  const url = siteUrl + path;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      locale: 'vi_VN',
      type: 'website',
      siteName: 'Thật hay Thách',
      images: [
        {
          url: '/share.png',
          width: 1200,
          height: 630,
          type: 'image/png',
          alt: 'Thật hay Thách',
        },
      ],
    },
    twitter: { card: 'summary_large_image', title, description, images: ['/share.png'] },
  };
}
