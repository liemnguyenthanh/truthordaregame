import type { Metadata, Viewport } from 'next';
import { PwaControls } from '@/components/pwa';
import { siteUrl } from '@/lib/seo';
import './globals.css';

const vietnameseMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Thật hay Thách — Chọn một câu, gần nhau hơn',
    template: '%s | Thật hay Thách',
  },
  description:
    'Chơi Thật hay Thách cùng bạn bè và người thương. Chọn bộ câu hỏi, chơi ngay không cần tài khoản.',
  applicationName: 'Thật hay Thách',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/icon.png', type: 'image/png', sizes: '240x240' }],
    shortcut: ['/icon.png'],
    apple: [{ url: '/icon.png', type: 'image/png', sizes: '240x240' }],
  },
  openGraph: {
    title: 'Thật hay Thách — Chọn một câu, gần nhau hơn',
    description:
      'Chơi Thật hay Thách cùng bạn bè và người thương. Chọn bộ câu hỏi, chơi ngay không cần tài khoản.',
    url: siteUrl,
    siteName: 'Thật hay Thách',
    locale: 'vi_VN',
    type: 'website',
    images: [
      { url: '/share.png', width: 1200, height: 630, type: 'image/png', alt: 'Thật hay Thách' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Thật hay Thách — Chọn một câu, gần nhau hơn',
    description: 'Chơi Thật hay Thách cùng bạn bè và người thương.',
    images: ['/share.png'],
  },
  appleWebApp: { capable: true, title: 'Thật hay Thách', statusBarStyle: 'black-translucent' },
  robots: process.env.VERCEL_ENV === 'preview' ? { index: false, follow: false } : undefined,
};
export const viewport: Viewport = { themeColor: '#151d2b', width: 'device-width', initialScale: 1 };
export async function generateMetadata(): Promise<Metadata> {
  return vietnameseMetadata;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <a href="#main" className="skip-link">
          Đến nội dung
        </a>
        {children}
        <PwaControls />
      </body>
    </html>
  );
}
