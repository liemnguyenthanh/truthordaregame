import { AI_PACK_CREATION_ENABLED } from '@/lib/features';
import Link from 'next/link';
import { ArrowRight, Zap, Download, Heart } from 'lucide-react';
import { SiteShell } from '@/components/site-shell';
import { PackLibrary } from '@/components/pack-library';
import { StructuredData } from '@/components/structured-data';
import { getPacks } from '@/lib/live-content';
import { pageMetadata, siteUrl } from '@/lib/seo';
import { localePath } from '@/lib/i18n';
import { pageLocale, copy, homeFaq } from '@/lib/i18n/pages';
export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props) {
  const l = await pageLocale(params);
  return pageMetadata(
    copy(
      l,
      'Thật hay Thách — Chọn một câu, gần nhau hơn',
      'Truth or Dare — Questions for Friends and Couples',
    ),
    copy(
      l,
      'Bộ câu hỏi Thật hay Thách cho bạn bè và cặp đôi. Chơi miễn phí, không cần đăng nhập, ngay trên điện thoại.',
      'Play Truth or Dare online with friends or your partner. Free question packs, no account needed, on one phone.',
    ),
    '/vi',
    l,
  );
}
export default async function Home({ params }: Props) {
  const l = await pageLocale(params);
  const t = (vi: string, en: string) => copy(l, vi, en);
  const path = (p: string) => localePath(l, p);
  const packs = await getPacks(l);
  const starter = packs.find((p) => p.tier === 'free');
  const faq = homeFaq(l);
  return (
    <SiteShell>
      <main id="main" className="page-width home">
        <section className="intro">
          <div className="intro-copy">
            <span className="eyebrow">
              <span className="tiny-spark">✦</span>{' '}
              {t('CUỘC VUI BẮT ĐẦU TỪ MỘT CÂU HỎI', 'GOOD TIMES START WITH A QUESTION')}
            </span>
            <h1>
              {t('Bớt ngại ngùng.', 'Less awkward.')}
              <br />
              <span>{t('Thêm gần nhau.', 'More connected.')}</span>
            </h1>
            <p>
              {t(
                'Chọn Thật để hiểu nhau hơn, chọn Thách để cùng bật cười.',
                'Choose Truth to get to know each other, or Dare for a shared laugh.',
              )}
              <br className="desktop-break" />{' '}
              {t(
                'Một chiếc điện thoại là đủ cho cả cuộc vui.',
                'One phone is all you need to play together.',
              )}
            </p>
            <div className="intro-actions">
              <a
                className="button button-primary"
                href={path(starter ? `/vi/choi/${starter.slug}` : '/vi/cach-choi')}
              >
                {starter
                  ? t('Chơi ngay miễn phí', 'Play for free')
                  : t('Xem cách chơi', 'How to play')}
                <ArrowRight size={19} />
              </a>
              <a
                className="group-start"
                href={path(starter ? `/vi/choi/${starter.slug}?group=1` : '/vi/danh-muc')}
              >
                {starter
                  ? t('Tạo nhóm & chơi →', 'Create a group & play →')
                  : t('Khám phá danh mục →', 'Browse categories →')}
              </a>
              {AI_PACK_CREATION_ENABLED && (
                <a className="button button-secondary ai-start" href={path('/vi/tao-bo-ai')}>
                  {t('Tạo bộ câu hỏi bằng AI', 'Create an AI question pack')}
                  <ArrowRight size={17} />
                </a>
              )}
            </div>
            <div className="intro-notes">
              <span>
                <Zap size={14} />
                {t('Không cần tài khoản', 'No account needed')}
              </span>
              <span>
                <Download size={14} />
                {t('Chơi cả khi offline', 'Save packs for offline play')}
              </span>
            </div>
          </div>
          <div className="intro-cards" aria-hidden="true">
            <div className="mini-card mini-truth">
              <span>💭 {t('THẬT', 'TRUTH')}</span>
              <p>
                {t('Ấn tượng đầu tiên của bạn về mình?', 'What was your first impression of me?')}
              </p>
              <small>{t('THÀNH THẬT MỘT CHÚT', 'A LITTLE HONESTY')}</small>
            </div>
            <div className="mini-card mini-dare">
              <span>💖 {t('THÁCH', 'DARE')}</span>
              <p>
                {t('Thử làm cả nhóm cười trong 10 giây.', 'Make the group laugh in 10 seconds.')}
              </p>
              <small>{t('CAN ĐẢM MỘT CHÚT', 'A LITTLE COURAGE')}</small>
            </div>
            <span className="floating-spark">✦</span>
          </div>
        </section>
        {packs.length ? (
          <PackLibrary packs={packs} />
        ) : (
          <section className="library">
            <h2>{t('Bộ câu hỏi đang được chuẩn bị', 'Question packs are being prepared')}</h2>
            <p>
              {t(
                'Chưa có bộ câu hỏi được xuất bản bằng ngôn ngữ này. Bạn có thể đọc cách chơi trong lúc chờ.',
                'No question packs are published in this language yet. You can read the rules while they are being prepared.',
              )}
            </p>
            <Link href={path('/vi/cach-choi')}>{t('Xem cách chơi →', 'Read the rules →')}</Link>
          </section>
        )}
        <section className="how-strip">
          <div className="how-heart">
            <Heart size={22} />
          </div>
          <div>
            <h2>
              {t(
                'Không cần giỏi chơi. Chỉ cần là chính mình.',
                'No special skills. Just be yourself.',
              )}
            </h2>
            <p>
              {t(
                'Chọn một bộ, chuyền điện thoại và lần lượt chọn Thật hoặc Thách. Luôn có thể bỏ qua khi bạn không thoải mái.',
                'Pick a pack, pass the phone, and take turns choosing Truth or Dare. Skip anything that makes you uncomfortable.',
              )}
            </p>
          </div>
          <Link href={path('/vi/cach-choi')}>
            {t('Xem cách chơi', 'How to play')}
            <ArrowRight size={17} />
          </Link>
        </section>
        <section className="home-faq">
          <h2>{t('Một chút trước khi chơi', 'Before you play')}</h2>
          {faq.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </section>
      </main>
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'WebSite',
              '@id': siteUrl + path('/vi') + '#website',
              name: t('Thật hay Thách', 'Truth or Dare'),
              url: siteUrl + path('/vi'),
              inLanguage: l,
            },
            {
              '@type': 'FAQPage',
              inLanguage: l,
              mainEntity: faq.map(([q, a]) => ({
                '@type': 'Question',
                name: q,
                acceptedAnswer: { '@type': 'Answer', text: a },
              })),
            },
          ],
        }}
      />
    </SiteShell>
  );
}
