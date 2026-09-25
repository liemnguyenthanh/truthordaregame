'use client';

import { useI18n } from './locale-provider';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { localePath } from '@/lib/i18n';
import { Sparkles, RotateCcw, ArrowUpRight } from 'lucide-react';
export function LanguageSwitch({ alternateHref }: { alternateHref?: string } = {}) {
  const { locale } = useI18n();
  const pathname = usePathname();
  const otherLocale = locale === 'vi' ? 'en' : 'vi';
  const translatedPathname = localePath(otherLocale, pathname);
  const languageHref = alternateHref ?? translatedPathname;
  return (
    <a
      className="language-switch"
      href={languageHref}
      hrefLang={otherLocale}
      lang={otherLocale}
      aria-label={locale === 'vi' ? 'Switch to English' : 'Chuyển sang tiếng Việt'}
      onClick={(event) => {
        // Keep pack/group IDs only when switching to the same translated page.
        // Availability fallbacks lead to the library without stale query state.
        event.currentTarget.href =
          languageHref === translatedPathname
            ? languageHref + window.location.search + window.location.hash
            : languageHref;
      }}
    >
      {locale === 'vi' ? 'EN' : 'VI'}
    </a>
  );
}

export function SiteHeader({ alternateHref }: { alternateHref?: string } = {}) {
  const { t, path } = useI18n();
  return (
    <header className="site-header page-width">
      <Link className="brand" href={path('/vi')} aria-label={t('Thật hay Thách — Trang chủ')}>
        <span className="brand-mark">
          <Image src="/icon.png" alt="" width={32} height={32} priority />
        </span>
        <span>
          {t('Thật')}
          <span className="brand-dot">.</span>
          {t('Thách')}{' '}
        </span>
      </Link>
      <nav aria-label={t('Điều hướng chính')}>
        <Link href={path('/vi/nhap-bo')} className="nav-ai">
          <Sparkles size={15} />
          <span>{t('Nhập bộ câu hỏi')}</span>
        </Link>
        <Link href={path('/vi/cach-choi')} className="nav-guide">
          {t('Cách chơi')}{' '}
        </Link>
        <Link href={path('/vi/khoi-phuc')} className="nav-restore" aria-label={t('Bộ đã mua')}>
          <RotateCcw size={16} />
          <span>{t('Bộ đã mua')}</span>
        </Link>
        <LanguageSwitch alternateHref={alternateHref} />
      </nav>
    </header>
  );
}
export function SiteFooter() {
  const { t, path } = useI18n();
  return (
    <footer className="site-footer page-width">
      <span>{t('Một câu hỏi. Thêm một chút gần nhau.')}</span>
      <nav aria-label={t('Thông tin')}>
        <Link href={path('/vi/cach-choi')}>
          {t('Cách chơi')} <ArrowUpRight size={13} />
        </Link>
        <Link href={path('/vi/chinh-sach-thanh-toan')}>{t('Thanh toán')}</Link>
        <Link href={path('/vi/quyen-rieng-tu')}>{t('Quyền riêng tư')}</Link>
      </nav>
    </footer>
  );
}
export function SiteShell({
  children,
  alternateHref,
}: {
  children: React.ReactNode;
  alternateHref?: string;
}) {
  return (
    <>
      <SiteHeader alternateHref={alternateHref} />
      {children}
      <SiteFooter />
    </>
  );
}
