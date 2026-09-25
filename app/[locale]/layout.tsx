import { pageLocale } from '@/lib/i18n/pages';
import { DocumentLayout, documentMetadata } from '@/components/document-layout';
export { viewport } from '@/components/document-layout';
type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };
export function generateStaticParams() {
  return [{ locale: 'vi' }, { locale: 'en' }];
}
export async function generateMetadata({ params }: Props) {
  return documentMetadata(await pageLocale(params));
}
export default async function LocaleLayout({ children, params }: Props) {
  return <DocumentLayout locale={await pageLocale(params)}>{children}</DocumentLayout>;
}
