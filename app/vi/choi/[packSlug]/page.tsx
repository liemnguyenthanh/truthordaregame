import { notFound } from 'next/navigation';
import { Game } from '@/components/game';
import { OfflinePack } from '@/components/pwa';
import { getPack } from '@/lib/live-content';
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ packSlug: string }> }) {
  const p = await getPack((await params).packSlug);
  return { title: p ? `Chơi ${p.title}` : 'Chơi', robots: { index: false, follow: true } };
}
export default async function GamePage({ params }: { params: Promise<{ packSlug: string }> }) {
  const p = await getPack((await params).packSlug);
  if (!p) notFound();
  return (
    <main id="main">
      <Game pack={p} />
      <OfflinePack pack={p} />
    </main>
  );
}
