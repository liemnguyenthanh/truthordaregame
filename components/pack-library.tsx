'use client';

import { useI18n } from './locale-provider';

import { PackCard } from './pack-card';
import type { Pack } from '@/lib/types';

export function PackLibrary({ packs }: { packs: Pack[] }) {
  const { t } = useI18n();
  return (
    <section className="library" aria-labelledby="library-title">
      <div className="section-heading">
        <div>
          <h2 id="library-title">{t('Chơi ngay miễn phí')}</h2>
        </div>
      </div>
      <div className="pack-grid">
        {packs.map((pack, index) => (
          <PackCard key={pack.id} pack={pack} index={index} />
        ))}
      </div>
    </section>
  );
}
