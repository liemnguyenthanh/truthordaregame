import { notFound } from 'next/navigation';
import { Game } from '@/components/game';
import { OfflinePack } from '@/components/pwa';
import { getPacks,getPack } from '@/lib/content';
export const dynamicParams=false;
export function generateStaticParams(){return getPacks().map(p=>({packSlug:p.slug}));}
export async function generateMetadata({params}:{params:Promise<{packSlug:string}>}){const p=getPack((await params).packSlug);return {title:p?`Chơi ${p.title}`:'Chơi',robots:{index:false,follow:true}};}
export default async function GamePage({params}:{params:Promise<{packSlug:string}>}){const p=getPack((await params).packSlug);if(!p)notFound();return <main id="main"><Game pack={p}/><OfflinePack pack={p}/></main>;}
