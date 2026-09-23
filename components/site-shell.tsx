'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Sparkles, RotateCcw, ArrowUpRight } from 'lucide-react';
export function LanguageSwitch({ alternateHref }: { alternateHref?: string } = {}) {
  const pathname = usePathname();
  return (
    <a
      className="language-switch"
      href={alternateHref ?? pathname}
      hrefLang="vi"
      lang="vi"
      aria-label="Tiếng Việt"
      onClick={(event) => {
        event.currentTarget.href =
          pathname + window.location.search + window.location.hash;
      }}
    >
      VI
    </a>
  );
}

export function SiteHeader({ alternateHref }: { alternateHref?: string } = {}) {
  return (
    <header className="site-header page-width">
      <Link className="brand" href="/" aria-label="Thật hay Thách — Trang chủ">
        <span className="brand-mark">
          <Image src="/icon.png" alt="" width={32} height={32} priority />
        </span>
        <span>
          Thật
          <span className="brand-dot">.</span>
          Thách{' '}
        </span>
      </Link>
      <nav aria-label="Điều hướng chính">
        <Link href="/tao-bo-ai" className="nav-ai">
          <Sparkles size={15} />
          <span>Tạo bộ AI</span>
        </Link>
        <Link href="/cach-choi" className="nav-guide">
          Cách chơi{' '}
        </Link>
        <Link href="/khoi-phuc" className="nav-restore" aria-label="Bộ đã mua">
          <RotateCcw size={16} />
          <span>Bộ đã mua</span>
        </Link>
        <LanguageSwitch alternateHref={alternateHref} />
      </nav>
    </header>
  );
}
export function SiteFooter() {
  return (
    <footer className="site-footer page-width">
      <span>Một câu hỏi. Thêm một chút gần nhau.</span>
      <nav aria-label="Thông tin">
        <Link href="/cach-choi">
          Cách chơi <ArrowUpRight size={13} />
        </Link>
        <Link href="/chinh-sach-thanh-toan">Thanh toán</Link>
        <Link href="/quyen-rieng-tu">Quyền riêng tư</Link>
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
