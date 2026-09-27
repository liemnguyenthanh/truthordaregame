'use client';
import { useEffect, useRef, useState } from 'react';
import { Star, MessageCircle } from 'lucide-react';
import { useI18n } from './locale-provider';
import type { Review, ReviewPage } from '@/lib/reviews';
import { ReviewModal } from './review-modal';
import styles from './reviews.module.css';
export function Reviews() {
  const { locale } = useI18n();
  const en = locale === 'en';
  const [reviews, setReviews] = useState<Review[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [modal, setModal] = useState(false);
  const inFlight = useRef(false);
  async function load(after: number | null = null, signal?: AbortSignal) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(false);
    try {
      const response = await fetch(`/api/reviews${after ? `?cursor=${after}` : ''}`, { signal });
      if (!response.ok) throw new Error();
      const data: ReviewPage = await response.json();
      setReviews((previous) =>
        after
          ? [
              ...previous,
              ...data.reviews.filter((item) => !previous.some((old) => old.id === item.id)),
            ]
          : data.reviews,
      );
      setCursor(data.nextCursor);
      setLoaded(true);
    } catch {
      if (!signal?.aborted) setError(true);
    } finally {
      inFlight.current = false;
      if (!signal?.aborted) setBusy(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  return (
    <>
      <header className={styles.header}>
        <span className="eyebrow">
          {en ? 'A LITTLE FEEDBACK, A LOT OF JOY' : 'MỘT CHÚT CẢM NHẬN, THÊM NHIỀU NIỀM VUI'}
        </span>
        <h1>{en ? 'What players say' : 'Chơi rồi, kể tụi mình nghe.'}</h1>
        <p>
          {en
            ? 'Little moments and honest words from our players.'
            : 'Những khoảnh khắc vui, những lời chia sẻ thật lòng từ người chơi.'}
        </p>
        <button className="button button-primary" onClick={() => setModal(true)}>
          <Star size={17} />
          {en ? 'Write a review' : 'Viết đánh giá'}
        </button>
      </header>
      <div className={styles.list} aria-busy={busy}>
        {reviews.map((review) => (
          <article className={styles.card} key={review.id}>
            <div className={styles.cardTop}>
              <div className={styles.avatar}>{Array.from(review.name)[0]?.toUpperCase()}</div>
              <div>
                <h2>{review.name}</h2>
                <time dateTime={review.created_at}>
                  {new Date(review.created_at).toLocaleDateString(en ? 'en-US' : 'vi-VN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </time>
              </div>
            </div>
            <div
              className={styles.rating}
              aria-label={en ? `${review.rating} out of 5 stars` : `${review.rating} trên 5 sao`}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  aria-hidden="true"
                  key={n}
                  size={16}
                  fill={n <= review.rating ? 'currentColor' : 'none'}
                />
              ))}
            </div>
            <p>{review.comment}</p>
          </article>
        ))}
      </div>
      <div className={styles.more} aria-live="polite">
        {busy && <p role="status">{en ? 'Loading reviews…' : 'Đang tải đánh giá…'}</p>}
        {!busy && error && (
          <>
            <p role="alert">{en ? 'Could not load reviews.' : 'Chưa tải được đánh giá.'}</p>
            <button
              className="button button-secondary"
              onClick={() => void load(loaded ? cursor : null)}
            >
              {en ? 'Try again' : 'Thử lại'}
            </button>
          </>
        )}
        {!busy && !error && loaded && !reviews.length && (
          <div className={styles.empty}>
            <MessageCircle size={32} />
            <h2>{en ? 'Be the first to share' : 'Lời chia sẻ đầu tiên là của bạn'}</h2>
            <p>
              {en
                ? 'Played a round? Tell us how it went.'
                : 'Vừa chơi xong? Kể tụi mình nghe cảm nhận nhé.'}
            </p>
          </div>
        )}
        {!busy && !error && cursor !== null && (
          <button className="button button-secondary" onClick={() => void load(cursor)}>
            {en ? 'Load more' : 'Tải thêm đánh giá'}
          </button>
        )}
      </div>
      {modal && (
        <ReviewModal
          onClose={() => {
            setModal(false);
            void load();
          }}
        />
      )}
    </>
  );
}
