import { pageLocale } from '@/lib/i18n/pages';
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  await pageLocale(params);
  return children;
}
