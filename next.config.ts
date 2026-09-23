import type { NextConfig } from 'next';
import { routeSegments } from './lib/i18n';
const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  poweredByHeader: false,
  outputFileTracingIncludes: {
    '/*/share.png': ['./node_modules/@fontsource/be-vietnam-pro/files/*-700-normal.woff'],
  },
  async redirects() {
    return Object.entries(routeSegments).map(([vi, en]) => ({
      source: `/en/${vi}/:path*`,
      destination: `/en/${en}/:path*`,
      permanent: true,
    }));
  },
  async rewrites() {
    return Object.entries(routeSegments).map(([vi, en]) => ({
      source: `/en/${en}/:path*`,
      destination: `/en/${vi}/:path*`,
    }));
  },
  async headers() {
    return [
      {
        source: '/:locale(vi|en)/:file(categories|packs).json',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          {
            key: 'Vercel-CDN-Cache-Control',
            value: 'public, s-maxage=300, stale-while-revalidate=600',
          },
          { key: 'X-Robots-Tag', value: 'noindex' },
        ],
      },
      {
        source: '/:locale(vi|en)/questions/:file*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          { key: 'X-Robots-Tag', value: 'noindex' },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/content/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex' }],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'private, no-store' },
          { key: 'X-Robots-Tag', value: 'noindex' },
        ],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          ...(process.env.VERCEL_ENV === 'preview'
            ? [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]
            : []),
        ],
      },
    ];
  },
};
export default nextConfig;
