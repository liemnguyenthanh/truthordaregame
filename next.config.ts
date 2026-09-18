import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: '/vi/:file(categories|packs).json', headers: [
        { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        { key: 'Vercel-CDN-Cache-Control', value: 'public, s-maxage=300, stale-while-revalidate=600' },
        { key: 'X-Robots-Tag', value: 'noindex' },
      ] },
      { source: '/vi/questions/:file*', headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        { key: 'X-Robots-Tag', value: 'noindex' },
      ] },
      { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache' }, { key: 'Service-Worker-Allowed', value: '/' }] },
      { source: '/api/:path*', headers: [{ key: 'Cache-Control', value: 'private, no-store' }, { key: 'X-Robots-Tag', value: 'noindex' }] },
      { source: '/:path*', headers: [{ key: 'X-Content-Type-Options', value: 'nosniff' }, { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }] },
    ];
  },
};
export default nextConfig;
