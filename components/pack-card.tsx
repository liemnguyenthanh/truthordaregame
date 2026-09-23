'use client';

import { useI18n } from './locale-provider';

import Link from 'next/link';
import { ArrowUpRight, Users, Layers, Crown } from 'lucide-react';
import type { Pack } from '@/lib/types';
export function PackCard({ pack, index = 0 }: { pack: Pack; index?: number }) {
  const { t, path } = useI18n();
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
            t('MIỄN PHÍ')
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
            {pack.questionCount} {t('câu hỏi')}{' '}
          </span>
          <span>
            <Users size={14} />
            {pack.playerRange.min}–{pack.playerRange.max} {t('người')}{' '}
          </span>
        </div>
        <h3>
          <Link href={path(`/vi/bo-cau-hoi/${pack.slug}`)}>{pack.title}</Link>
        </h3>
        <p>{pack.description}</p>
        <div className="pack-bottom">
          <a className="pack-play" href={path(`/vi/choi/${pack.slug}`)}>
            {pack.tier === 'free'
              ? t('Chơi ngay')
              : t('Thử {v0} câu miễn phí', { v0: pack.trialCount })}
            <ArrowUpRight size={18} />
          </a>
          <span>{pack.tier === 'free' ? t('Không giới hạn lượt') : t('Mở khóa cả bộ')}</span>
        </div>
      </div>
    </article>
  );
}
