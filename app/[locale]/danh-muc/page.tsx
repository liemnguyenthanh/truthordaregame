import Link from 'next/link';
import { SiteShell } from '@/components/site-shell';
import { getCategories, getPacks } from '@/lib/live-content';
import { pageMetadata } from '@/lib/seo';
import { localePath } from '@/lib/i18n';
import { pageLocale, copy } from '@/lib/i18n/pages';
export const revalidate = 300;
type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props) {
  const l = await pageLocale(params);
  return pageMetadata(
    copy(l, 'Danh mục câu hỏi', 'Truth or Dare Categories'),
    copy(
      l,
      'Chọn câu hỏi Thật hay Thách theo chủ đề bạn bè hoặc cặp đôi.',
      'Find Truth or Dare question packs for friends or couples.',
    ),
    '/vi/danh-muc',
    l,
  );
}
export default async function Categories({ params }: Props) {
  const l = await pageLocale(params);
  const packs = await getPacks(l);
  return (
    <SiteShell>
      <main id="main" className="page-width content-page">
        <span className="eyebrow">{copy(l, 'TÌM ĐÚNG KHÔNG KHÍ', 'FIND YOUR MOOD')}</span>
        <h1>{copy(l, 'Chơi cùng ai?', 'Who are you playing with?')}</h1>
        <div className="category-grid">
          {getCategories(l).map((c) => (
            <Link
              className="category-tile"
              href={localePath(l, `/vi/danh-muc/${c.slug}`)}
              key={c.id}
            >
              <span>{c.icon}</span>
              <h2>{c.name}</h2>
              <p>{c.description}</p>
              <small>
                {packs.filter((p) => p.categoryIds.includes(c.id)).length}{' '}
                {copy(l, 'bộ câu hỏi →', 'question packs →')}
              </small>
            </Link>
          ))}
        </div>
      </main>
    </SiteShell>
  );
}
