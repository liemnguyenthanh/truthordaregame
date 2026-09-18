import Link from 'next/link';
import { SiteShell } from '@/components/site-shell';
import { getCategories } from '@/lib/content';
import { pageMetadata } from '@/lib/seo';
export const metadata = pageMetadata('Danh mục câu hỏi','Chọn câu hỏi Thật hay Thách theo chủ đề bạn bè hoặc cặp đôi.','/vi/danh-muc');
export default function Categories() { return <SiteShell><main id="main" className="page-width content-page"><span className="eyebrow">TÌM ĐÚNG KHÔNG KHÍ</span><h1>Chơi cùng ai?</h1><div className="category-grid">{getCategories().map(c=><Link className="category-tile" href={`/vi/danh-muc/${c.slug}`} key={c.id}><span>{c.icon}</span><h2>{c.name}</h2><p>{c.description}</p><small>{c.packIds.length} bộ câu hỏi →</small></Link>)}</div></main></SiteShell> }
