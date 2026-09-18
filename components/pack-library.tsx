'use client';
import { useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { PackCard } from './pack-card';
import type { Category, Pack } from '@/lib/types';
export function PackLibrary({ packs, categories }: { packs: Pack[]; categories: Category[] }) {
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const visible = packs.filter(
    (pack) =>
      (category === 'all' ||
        (category === 'free' ? pack.tier === 'free' : pack.categoryIds.includes(category))) &&
      `${pack.title} ${pack.description}`
        .toLocaleLowerCase('vi')
        .includes(query.toLocaleLowerCase('vi').trim()),
  );
  return (
    <section className="library" aria-labelledby="library-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">CHỌN KHÔNG KHÍ CHO CUỘC VUI</span>
          <h2 id="library-title">Hôm nay, chơi cùng ai?</h2>
        </div>
        <label className="search">
          <Search size={17} />
          <input
            aria-label="Tìm bộ câu hỏi"
            placeholder="Tìm bộ câu hỏi…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      <div className="filter-row">
        <div className="filters" aria-label="Lọc bộ câu hỏi">
          {[
            { id: 'all', name: 'Tất cả', icon: '✦' },
            ...categories,
            { id: 'free', name: 'Miễn phí', icon: '↗' },
          ].map((item) => (
            <button
              key={item.id}
              aria-pressed={category === item.id}
              className={category === item.id ? 'active' : ''}
              onClick={() => setCategory(item.id)}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.name}
            </button>
          ))}
        </div>
        <span className="result-count">
          <SlidersHorizontal size={14} />
          {visible.length} bộ câu hỏi
        </span>
      </div>
      <div className="pack-grid">
        {visible.map((pack, index) => (
          <PackCard key={pack.id} pack={pack} index={index} />
        ))}
      </div>
      {!visible.length && (
        <div className="empty-result">
          <h3>Chưa tìm thấy bộ phù hợp</h3>
          <p>Thử từ khóa khác hoặc xem lại tất cả bộ câu hỏi.</p>
          <button
            className="button button-secondary"
            onClick={() => {
              setQuery('');
              setCategory('all');
            }}
          >
            Xem tất cả
          </button>
        </div>
      )}
    </section>
  );
}
