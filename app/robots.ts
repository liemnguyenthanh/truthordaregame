import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/seo';
export default function robots(): MetadataRoute.Robots {
  return {
    rules:
      process.env.VERCEL_ENV === 'preview'
        ? { userAgent: '*', disallow: '/' }
        : { userAgent: '*', allow: '/', disallow: ['/api/', '/admin'] },
    sitemap: siteUrl + '/sitemap.xml',
  };
}
