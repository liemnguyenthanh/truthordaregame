import { Sparkles } from 'lucide-react';
import { PackCard } from './pack-card';
import type { Pack } from '@/lib/types';

export function PackLibrary({ packs }: { packs: Pack[] }) {
  return (
    <section className="library" aria-labelledby="library-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">BẮT ĐẦU THẬT DỄ</span>
          <h2 id="library-title">Chọn một bộ và chơi ngay</h2>
        </div>
        <span className="library-note">
          <Sparkles aria-hidden="true" /> {packs.length} bộ được chọn sẵn cho bạn
        </span>
      </div>
      <div className="pack-grid">
        {packs.map((pack, index) => (
          <PackCard key={pack.id} pack={pack} index={index} />
        ))}
      </div>
    </section>
  );
}
