import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { PwaControls } from '@/components/pwa';
import { siteUrl } from '@/lib/seo';
import { LocaleProvider } from '@/components/locale-provider';
import { requestLocale } from '@/lib/request-locale';
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
      { url: '/vi/share.png', width: 1200, height: 630, type: 'image/png', alt: 'Thật hay Thách' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Thật hay Thách — Chọn một câu, gần nhau hơn',
    description: 'Chơi Thật hay Thách cùng bạn bè và người thương.',
    images: ['/vi/share.png'],
  },
  appleWebApp: { capable: true, title: 'Thật hay Thách', statusBarStyle: 'black-translucent' },
  robots: process.env.VERCEL_ENV === 'preview' ? { index: false, follow: false } : undefined,
};
export const viewport: Viewport = { themeColor: '#151d2b', width: 'device-width', initialScale: 1 };
export async function generateMetadata(): Promise<Metadata> {
  const locale = await requestLocale();
  if (locale === 'vi') return vietnameseMetadata;
  const title = 'Truth or Dare — One question, a little closer';
  const description =
    'Play Truth or Dare with friends and couples. Choose a question pack and play free in your browser. No account required.';
  return {
    ...vietnameseMetadata,
    title: { default: title, template: '%s | Truth or Dare' },
    description,
    applicationName: 'Truth or Dare',
    manifest: '/en/manifest.webmanifest',
    openGraph: {
      ...vietnameseMetadata.openGraph,
      title,
      description,
      siteName: 'Truth or Dare',
      locale: 'en_US',
      url: `${siteUrl}/en`,
      images: [
        {
          url: '/en/share.png',
          width: 1200,
          height: 630,
          type: 'image/png',
          alt: 'Truth or Dare',
        },
      ],
    },
    twitter: { card: 'summary_large_image', title, description, images: ['/en/share.png'] },
    appleWebApp: { capable: true, title: 'Truth or Dare', statusBarStyle: 'black-translucent' },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await requestLocale();
  return (
    <html lang={locale}>
      <body>
        <Script id="google-tag-manager" strategy="beforeInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-5FP2P39P');`}
        </Script>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-5FP2P39P"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
            title="Google Tag Manager"
          />
        </noscript>
        <LocaleProvider locale={locale}>
          <a href="#main" className="skip-link">
            {locale === 'en' ? 'Skip to content' : 'Đến nội dung'}
          </a>
          {children}
          <PwaControls />
        </LocaleProvider>
      </body>
    </html>
  );
}
