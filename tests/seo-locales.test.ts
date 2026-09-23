import test from 'node:test';
import assert from 'node:assert/strict';
import { languageAlternates, pageMetadata, siteUrl } from '../lib/seo';
import config from '../next.config';

test('English canonical and reciprocal alternates use public English route segments', () => {
  const metadata = pageMetadata(
    'Friends',
    'A pack for friends',
    '/vi/bo-cau-hoi/ban-be-khoi-dong',
    'en',
  );
  assert.equal(metadata.alternates?.canonical, siteUrl + '/en/packs/ban-be-khoi-dong');
  assert.deepEqual(metadata.alternates?.languages, {
    vi: siteUrl + '/vi/bo-cau-hoi/ban-be-khoi-dong',
    en: siteUrl + '/en/packs/ban-be-khoi-dong',
    'x-default': siteUrl + '/vi/bo-cau-hoi/ban-be-khoi-dong',
  });
  assert.deepEqual(
    pageMetadata('Bạn bè', 'Một bộ', '/vi/bo-cau-hoi/ban-be-khoi-dong', 'vi').alternates?.languages,
    metadata.alternates?.languages,
  );
});
test('unpublished English translations are not advertised', () => {
  assert.deepEqual(languageAlternates('/vi/bo-cau-hoi/draft', ['vi']), {
    vi: siteUrl + '/vi/bo-cau-hoi/draft',
    'x-default': siteUrl + '/vi/bo-cau-hoi/draft',
  });
});
test('canonical English routes rewrite internally and old English paths redirect permanently', async () => {
  const redirects = await config.redirects!();
  assert.ok(
    redirects.some(
      (r) =>
        r.source === '/en/cach-choi/:path*' &&
        r.destination === '/en/how-to-play/:path*' &&
        r.permanent,
    ),
  );
  const rewrites = await config.rewrites!();
  assert.ok(
    Array.isArray(rewrites) &&
      rewrites.some(
        (r) => r.source === '/en/packs/:path*' && r.destination === '/en/bo-cau-hoi/:path*',
      ),
  );
});

test('preview responses have a global noindex safeguard even if child metadata changes', async () => {
  const previous = process.env.VERCEL_ENV;
  try {
    process.env.VERCEL_ENV = 'preview';
    const headers = await config.headers!();
    assert.ok(
      headers.some(
        (rule) =>
          rule.source === '/:path*' &&
          rule.headers.some(
            (header) => header.key === 'X-Robots-Tag' && header.value === 'noindex, nofollow',
          ),
      ),
    );
  } finally {
    if (previous === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = previous;
  }
});
