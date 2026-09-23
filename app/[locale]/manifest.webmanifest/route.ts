import { isLocale } from '@/lib/i18n';
import manifest from '@/app/manifest';

export function generateStaticParams() {
  return [{ locale: 'vi' }, { locale: 'en' }];
}

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return new Response('Not found', { status: 404 });
  const data = manifest();
  return Response.json(
    {
      ...data,
      // Same application identity so changing language does not create a second installed app.
      id: '/vi',
      name: locale === 'en' ? 'Truth or Dare' : data.name,
      short_name: locale === 'en' ? 'Truth.Dare' : data.short_name,
      description:
        locale === 'en'
          ? 'One question, a little closer. Play with friends and couples.'
          : data.description,
      lang: locale,
      start_url: `/${locale}`,
    },
    {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=3600',
        'X-Robots-Tag': 'noindex',
      },
    },
  );
}
