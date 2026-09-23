import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n';
export async function pageLocale(params: Promise<{ locale: string }>): Promise<Locale> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return locale;
}
export const copy = (locale: Locale, vi: string, en: string) => (locale === 'en' ? en : vi);
export const homeFaq = (locale: Locale) =>
  locale === 'en'
    ? [
        [
          'How do you play Truth or Dare?',
          'Take turns choosing Truth to answer a question or Dare to do a challenge. Anyone can skip at any time. There are no scores or winners.',
        ],
        [
          'Do I need to download an app or register?',
          'No. Play directly in your browser without an account. You can add the app to your home screen and save a pack for offline play.',
        ],
        [
          'What is the difference between free and premium packs?',
          'Free packs include every question. Premium packs offer 8 trial questions; a one-time payment unlocks the rest for replay. The price is confirmed before checkout.',
        ],
      ]
    : [
        [
          'Thật hay Thách chơi như thế nào?',
          'Mỗi người lần lượt chọn Thật để trả lời một câu hỏi hoặc Thách để thực hiện thử thách. Mọi người có thể bỏ qua bất cứ lúc nào. Không có điểm số hay người thắng cuộc.',
        ],
        [
          'Có cần tải ứng dụng hoặc đăng ký không?',
          'Không. Bạn chơi ngay trong trình duyệt, không cần tài khoản. Có thể thêm vào màn hình chính và lưu bộ câu hỏi để chơi khi không có mạng.',
        ],
        [
          'Bộ premium khác gì bộ miễn phí?',
          'Bộ miễn phí mở toàn bộ câu hỏi. Mỗi bộ premium có 8 câu chơi thử; thanh toán một lần để mở phần còn lại và chơi lại không giới hạn. Giá được xác nhận trước khi thanh toán.',
        ],
      ];
