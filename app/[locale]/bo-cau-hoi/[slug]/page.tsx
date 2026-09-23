import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Users, Layers, Check } from 'lucide-react';
import { SiteShell } from '@/components/site-shell';
import { StructuredData } from '@/components/structured-data';
import { getPack, getQuestionSet } from '@/lib/live-content';
import { pageMetadata, siteUrl } from '@/lib/seo';
import { localePath, type Locale } from '@/lib/i18n';
import { pageLocale, copy } from '@/lib/i18n/pages';
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const locale = await pageLocale(params);
  const p = await getPack((await params).slug, locale);
  const available: Locale[] = p
    ? (
        await Promise.all(
          (['vi', 'en'] as const).map(async (l) => ((await getPack(p.slug, l)) ? l : undefined)),
        )
      ).filter((l): l is Locale => l !== undefined)
    : [];
  return p
    ? pageMetadata(p.title, p.description, `/vi/bo-cau-hoi/${p.slug}`, locale, available)
    : {};
}
export default async function PackPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const locale = await pageLocale(params);
  const t = (vi: string, en: string) => copy(locale, vi, en);
  const p = await getPack((await params).slug, locale);
  if (!p) notFound();
  const otherLocale = locale === 'vi' ? 'en' : 'vi';
  const [set, alternatePack] = await Promise.all([getQuestionSet(p), getPack(p.slug, otherLocale)]);
  const alternateHref = alternatePack ? undefined : localePath(otherLocale, '/vi/danh-muc');
  const samples = set.questions
    .filter((q) => p.tier === 'free' || set.trialQuestionIds.includes(q.id))
    .slice(0, 2);
  return (
    <SiteShell alternateHref={alternateHref}>
      <main id="main" className="page-width content-page">
        <Link className="back-link" href={localePath(locale, '/vi')}>
          {t('← Khám phá bộ câu hỏi', '← Browse question packs')}
        </Link>
        <div className="pack-detail">
          <div className={`detail-art ${p.color}`}>
            <span>{p.icon}</span>
            <strong>{p.title}</strong>
            <small>{t('THẬT HAY THÁCH', 'TRUTH OR DARE')}</small>
          </div>
          <div className="detail-copy">
            <span className="eyebrow">
              {p.tier === 'free'
                ? t('MỞ MIỄN PHÍ TOÀN BỘ', 'ALL QUESTIONS FREE')
                : t('THỬ 8 CÂU MIỄN PHÍ', 'TRY 8 FREE QUESTIONS')}
            </span>
            <h1>{p.title}</h1>
            <p>{p.description}</p>
            <div className="detail-facts">
              <span>
                <Layers size={17} />
                {p.questionCount} {t('câu', 'questions')} · {p.truthCount} {t('Thật', 'Truth')} +{' '}
                {p.dareCount} {t('Thách', 'Dare')}
              </span>
              <span>
                <Users size={17} />
                {p.playerRange.min}–{p.playerRange.max} {t('người', 'players')} · {p.ageLabel}
              </span>
            </div>
            <a href={localePath(locale, `/vi/choi/${p.slug}`)} className="button button-primary">
              {p.tier === 'free'
                ? t('Bắt đầu chơi', 'Start playing')
                : t('Chơi thử ngay', 'Try it now')}
              <ArrowRight size={18} />
            </a>
            <p className="small-note">
              {p.tier === 'free'
                ? t(
                    'Chơi thoải mái. Không cần đăng ký.',
                    'Play at your own pace. No account needed.',
                  )
                : t(
                    'Mua một lần để mở bộ này. Giá được xác nhận tại thanh toán.',
                    'One purchase unlocks this pack. The price is confirmed at checkout.',
                  )}
            </p>
          </div>
        </div>
        <section className="detail-section">
          <span className="eyebrow">{t('MỘT CHÚT BẬT MÍ', 'A SNEAK PEEK')}</span>
          <h2>{t('Có gì trong bộ này?', 'What is in this pack?')}</h2>
          <div className="sample-grid">
            {samples.map((q) => (
              <div className={`sample-card ${q.type}`} key={q.id}>
                <span>
                  {q.type === 'truth' ? t('💭 Thật', '💭 Truth') : t('💖 Thách', '💖 Dare')}
                </span>
                <p>{q.text}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="detail-section two-column">
          <div>
            <h2>{t('Chơi theo cách của bạn', 'Play your way')}</h2>
            <p>
              {t(
                'Mọi người ngồi thành vòng tròn, lần lượt chọn Thật hoặc Thách. Đọc to câu hỏi và cùng tận hưởng những câu chuyện bất ngờ.',
                'Sit together and take turns choosing Truth or Dare. Read each prompt aloud and enjoy the stories that follow.',
              )}
            </p>
            <Link href={localePath(locale, '/vi/cach-choi')} className="text-link">
              {t('Đọc hướng dẫn chơi →', 'Read the rules →')}
            </Link>
          </div>
          <ul className="benefit-list">
            <li>
              <Check size={18} />
              {t('Câu hỏi không lặp trong cùng ván', 'No repeated questions in a round')}
            </li>
            <li>
              <Check size={18} />
              {t('Luôn có thể bỏ qua', 'You can always skip')}
            </li>
            <li>
              <Check size={18} />
              {t('Lưu bộ để chơi khi không có mạng', 'Save a pack for offline play')}
            </li>
            <li>
              <Check size={18} />
              {p.tier === 'free'
                ? t('Chơi lại miễn phí bất cứ lúc nào', 'Replay for free anytime')
                : t(
                    'Giữ mã khôi phục để đổi thiết bị',
                    'Keep your recovery code to switch devices',
                  )}
            </li>
          </ul>
        </section>
      </main>
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: t('Trang chủ', 'Home'),
              item: siteUrl + localePath(locale, '/vi'),
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: p.title,
              item: siteUrl + localePath(locale, '/vi/bo-cau-hoi/' + p.slug),
            },
          ],
        }}
      />
    </SiteShell>
  );
}
