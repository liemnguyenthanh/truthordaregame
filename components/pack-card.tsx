import Link from 'next/link';
import { ArrowUpRight, Users, Layers, Crown } from 'lucide-react';
import type { Pack } from '@/lib/types';
export function PackCard({ pack, index = 0 }: { pack: Pack; index?: number }) {
  return (
    <article
      className={`pack-card ${pack.color}`}
      style={{ '--delay': `${index * 65}ms` } as React.CSSProperties}
    >
      <div className="pack-art">
        <span className="pack-emoji" aria-hidden="true">
          {pack.icon}
        </span>
        <span className={`tier-badge ${pack.tier}`}>
          {pack.tier === 'free' ? (
            'MIỄN PHÍ'
          ) : (
            <>
              <Crown size={12} /> PREMIUM
            </>
          )}
        </span>
        <span className="art-word" aria-hidden="true">
          {pack.color === 'purple' ? 'LET’S PLAY' : pack.color === 'pink' ? 'GO DEEPER' : 'JUST US'}
        </span>
      </div>
      <div className="pack-body">
        <div className="pack-meta">
          <span>
            <Layers size={14} />
            {pack.questionCount} câu hỏi
          </span>
          <span>
            <Users size={14} />
            {pack.playerRange.min}–{pack.playerRange.max} người
          </span>
        </div>
        <h3>
          <Link href={`/vi/bo-cau-hoi/${pack.slug}`}>{pack.title}</Link>
        </h3>
        <p>{pack.description}</p>
        <div className="pack-bottom">
          <a className="pack-play" href={`/vi/choi/${pack.slug}`}>
            {pack.tier === 'free' ? 'Chơi ngay' : `Thử ${pack.trialCount} câu miễn phí`}
            <ArrowUpRight size={18} />
          </a>
          <span>{pack.tier === 'free' ? 'Không giới hạn lượt' : 'Mở khóa cả bộ'}</span>
        </div>
      </div>
    </article>
  );
}
