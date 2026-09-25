import { CustomImport } from '@/components/custom-import';
import { pageLocale, copy } from '@/lib/i18n/pages';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await pageLocale(params);
  return {
    title: copy(locale, 'Nhập bộ câu hỏi', 'Import question set'),
    robots: { index: false, follow: true },
  };
}

export default function ImportPage() {
  return <CustomImport />;
}
