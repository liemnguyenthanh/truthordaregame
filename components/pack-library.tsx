import { PackCard } from './pack-card';
import type { Pack } from '@/lib/types';

export function PackLibrary({ packs }: { packs: Pack[] }) {
  return (
    <section className="library" aria-labelledby="library-title">
      <div className="section-heading">
        <div>
          <h2 id="library-title">Chơi ngay miễn phí</h2>
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
