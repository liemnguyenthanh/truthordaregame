import Link from 'next/link';
import { getPacks } from '@/lib/live-content';
import { SiteShell } from '@/components/site-shell';
import { pageMetadata } from '@/lib/seo';
import { localePath } from '@/lib/i18n';
import { pageLocale, copy } from '@/lib/i18n/pages';
type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props) {
  const l = await pageLocale(params);
  return pageMetadata(
    copy(l, 'Cách chơi Thật hay Thách', 'How to Play Truth or Dare'),
    copy(
      l,
      'Luật chơi Thật hay Thách đơn giản cho nhóm bạn và cặp đôi: chọn bộ, chọn câu và tôn trọng quyền bỏ qua.',
      'Simple Truth or Dare rules for friends and couples: choose a pack, take turns, and respect everyone’s right to skip.',
    ),
    '/vi/cach-choi',
    l,
  );
}
export default async function Guide({ params }: Props) {
  const l = await pageLocale(params);
  const t = (vi: string, en: string) => copy(l, vi, en);
  const starter = (await getPacks(l)).find((p) => p.tier === 'free');
  const steps = [
    [
      t('Chọn đúng không khí', 'Choose your mood'),
      t(
        'Chọn bộ dành cho bạn bè hoặc cặp đôi. Bộ miễn phí mở tất cả câu; bộ premium cho thử 8 câu trước khi quyết định mua.',
        'Pick a pack for friends or couples. Free packs include all questions; premium packs offer 8 trial questions before you decide to buy.',
      ),
    ],
    [
      t('Thật hay Thách?', 'Truth or Dare?'),
      t(
        'Chuyền điện thoại đến người tiếp theo. Chọn “Thật” để trả lời, hoặc “Thách” để thử một điều vui. Mỗi lần bấm sẽ có một câu mới.',
        'Pass the phone to the next player. Choose Truth to answer a question or Dare to try a challenge. Each tap draws a new prompt.',
      ),
    ],
    [
      t('Thoải mái mới là vui', 'Keep it comfortable'),
      t(
        'Không ai bắt buộc phải trả lời hoặc làm thử thách. Bấm “Bỏ qua” bất cứ lúc nào. Không gây áp lực và không cần chứng minh mình can đảm.',
        'Nobody has to answer a question or do a dare. Tap Skip at any time. Avoid pressure: you never need to prove your courage.',
      ),
    ],
  ];
  return (
    <SiteShell>
      <main id="main" className="page-width article-page">
        <Link className="back-link" href={localePath(l, '/vi')}>
          {t('← Về chọn bộ', '← Choose a pack')}
        </Link>
        <span className="eyebrow">
          {t('CHỈ CẦN MỘT CHIẾC ĐIỆN THOẠI', 'ALL YOU NEED IS ONE PHONE')}
        </span>
        <h1>{t('Cách chơi Thật hay Thách', 'How to play Truth or Dare')}</h1>
        <p className="article-lead">
          {t(
            'Thật hay Thách là trò chơi trong đó mỗi người chọn trả lời một câu hỏi thật lòng hoặc thực hiện một thử thách vui. Có thể chơi từ hai người, không cần tính điểm.',
            'Truth or Dare is a game where each player chooses to answer an honest question or complete a fun challenge. You can play with two or more people, with no scoring.',
          )}
        </p>
        <ol className="guide-steps">
          {steps.map(([title, text], i) => (
            <li key={title}>
              <span>0{i + 1}</span>
              <div>
                <h2>{title}</h2>
                <p>{text}</p>
              </div>
            </li>
          ))}
        </ol>
        <h2>{t('Khi hết câu hỏi thì sao?', 'What happens when the questions run out?')}</h2>
        <p>
          {t(
            'Bạn có thể xáo trộn để chơi lại hoặc đổi bộ khác. Các câu không lặp trong cùng ván. Bộ đếm chỉ là số câu đã xem, không phải điểm số.',
            'Shuffle to start again or choose another pack. Questions do not repeat within a round. The counter tracks prompts you have seen, not a score.',
          )}
        </p>
        <h2>{t('Có chơi offline được không?', 'Can I play offline?')}</h2>
        <p>
          {t(
            'Trong màn chơi, chọn lưu bộ để chơi offline. Khi có thông báo đã lưu, bạn có thể mở lại ứng dụng và bộ đó khi mất mạng. Thanh toán và khôi phục vẫn cần kết nối.',
            'Save the pack for offline play from the game screen. After saving is confirmed, you can reopen the app and that pack without a connection. Checkout and purchase recovery still require internet access.',
          )}
        </p>
        <a
          href={localePath(l, starter ? `/vi/choi/${starter.slug}` : '/vi')}
          className="button button-primary"
        >
          {starter
            ? t('Thử một ván ngay →', 'Try a round now →')
            : t('Khám phá bộ câu hỏi →', 'Browse question packs →')}
        </a>
        <p className="editorial-note">
          {t(
            'Biên tập bởi Thật hay Thách · Cập nhật 23/09/2026',
            'Edited by Truth or Dare · Updated 23 September 2026',
          )}
        </p>
      </main>
    </SiteShell>
  );
}
