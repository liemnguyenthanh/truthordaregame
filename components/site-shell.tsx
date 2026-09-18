import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, RotateCcw, ArrowUpRight } from 'lucide-react';
export function SiteHeader() {
  return (
    <header className="site-header page-width">
      <Link className="brand" href="/vi" aria-label="Thật hay Thách — Trang chủ">
        <span className="brand-mark">
          <Image src="/icon.png" alt="" width={32} height={32} priority />
        </span>
        <span>
          thật<span className="brand-dot">.</span>thách
        </span>
      </Link>
      <nav aria-label="Điều hướng chính">
        <Link href="/vi/tao-bo-ai" className="nav-ai">
          <Sparkles size={15} />
          <span>Tạo bộ AI</span>
        </Link>
        <Link href="/vi/cach-choi" className="nav-guide">
          Cách chơi
        </Link>
        <Link href="/vi/khoi-phuc" className="nav-restore" aria-label="Bộ đã mua">
          <RotateCcw size={16} />
          <span>Bộ đã mua</span>
        </Link>
      </nav>
    </header>
  );
}
export function SiteFooter() {
  return (
    <footer className="site-footer page-width">
      <span>Một câu hỏi. Thêm một chút gần nhau.</span>
      <nav aria-label="Thông tin">
        <Link href="/vi/cach-choi">
          Cách chơi <ArrowUpRight size={13} />
        </Link>
        <Link href="/vi/chinh-sach-thanh-toan">Thanh toán</Link>
        <Link href="/vi/quyen-rieng-tu">Quyền riêng tư</Link>
      </nav>
    </footer>
  );
}
export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}
