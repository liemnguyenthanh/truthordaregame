import { Suspense } from 'react';
import { GeneratedPackView } from '@/components/generated-pack';
import { SiteHeader } from '@/components/site-shell';
export const metadata={title:'Bộ câu hỏi riêng của nhóm',robots:{index:false,follow:false}};
export default function AiPackPage(){return <><SiteHeader/><main id="main"><Suspense fallback={<p className="notice page-width">Đang mở bộ câu hỏi của nhóm…</p>}><GeneratedPackView/></Suspense></main></>;}
