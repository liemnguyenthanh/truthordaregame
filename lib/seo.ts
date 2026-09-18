import type { Metadata } from 'next';
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
export function pageMetadata(title: string, description: string, path: string): Metadata {
  return { title, description, alternates: { canonical: `${siteUrl}${path}` }, openGraph: { title, description, url: `${siteUrl}${path}`, locale: 'vi_VN', type: 'website', siteName: 'Thật hay Thách', images: [{ url: '/thumbnail.png', width: 1672, height: 941, type: 'image/png', alt: 'Thật hay Thách' }] }, twitter: { card: 'summary_large_image', title, description, images: ['/thumbnail.png'] } };
}
