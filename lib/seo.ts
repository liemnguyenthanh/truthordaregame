import type { Metadata } from 'next';
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
export function pageMetadata(title: string, description: string, path: string): Metadata {
  return { title, description, alternates: { canonical: `${siteUrl}${path}` }, openGraph: { title, description, url: `${siteUrl}${path}`, locale: 'vi_VN', type: 'website', siteName: 'Thật hay Thách' }, twitter: { card: 'summary', title, description } };
}
