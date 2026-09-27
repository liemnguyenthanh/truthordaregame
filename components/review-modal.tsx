'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, Star, X } from 'lucide-react';
import { useI18n } from './locale-provider';
import styles from './reviews.module.css';
export function ReviewModal({ onClose }: { onClose: () => void }) {
  const { locale, path } = useI18n();
  const en = locale === 'en';
  const dialog = useRef<HTMLDialogElement>(null);
  const closing = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const sending = useRef(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    dialog.current?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      clearTimeout(timer.current);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  function close() {
    if (sending.current || closing.current) return;
    closing.current = true;
    dialog.current?.setAttribute('data-closing', 'true');
    timer.current = setTimeout(onClose, 180);
  }
  return (
    <dialog
      ref={dialog}
      className={styles.modal}
      aria-labelledby="review-title"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const rect = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          )
            close();
        }
      }}
    >
      <button
        className={styles.close}
        onClick={close}
        disabled={busy}
        aria-label={en ? 'Close' : 'Đóng'}
      >
        <X size={20} />
      </button>
      <div className={styles.emblem}>{done ? <Check size={28} /> : <Star size={28} />}</div>
      <h2 id="review-title">
        {done
          ? en
            ? 'Thanks for playing!'
            : 'Cảm ơn bạn đã chơi!'
          : en
            ? 'How was your game?'
            : 'Cuộc vui hôm nay thế nào?'}
      </h2>
      <p>
        {done
          ? en
            ? 'Your review is now public.'
            : 'Đánh giá của bạn đã được chia sẻ.'
          : en
            ? 'A few words from you mean a lot to us.'
            : 'Một chút cảm nhận, thêm động lực cho tụi mình.'}
      </p>
      {done ? (
        <div className={styles.success}>
          <Link className="button button-primary" href={path('/vi/danh-gia')}>
            {en ? 'See reviews' : 'Xem đánh giá'}
          </Link>
          <button className={styles.skip} onClick={close}>
            {en ? 'Done' : 'Xong'}
          </button>
        </div>
      ) : (
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            if (sending.current) return;
            if (!rating) {
              setError(en ? 'Please choose a star rating.' : 'Bạn chọn số sao nhé.');
              return;
            }
            const form = new FormData(event.currentTarget);
            sending.current = true;
            setBusy(true);
            setError('');
            try {
              const response = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: form.get('name'),
                  comment: form.get('comment'),
                  rating,
                }),
              });
              if (!response.ok) throw new Error();
              setDone(true);
            } catch {
              setError(
                en ? 'Could not send. Please try again.' : 'Chưa gửi được. Bạn thử lại nhé.',
              );
            } finally {
              sending.current = false;
              setBusy(false);
            }
          }}
        >
          <fieldset className={styles.stars} disabled={busy}>
            <legend>{en ? 'Your rating' : 'Bạn chấm mấy sao?'}</legend>
            <div onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((value) => (
                <label
                  key={value}
                  onMouseEnter={() => setHover(value)}
                  className={(hover || rating) >= value ? styles.selected : ''}
                >
                  <input
                    type="radio"
                    name="rating"
                    value={value}
                    checked={rating === value}
                    onChange={() => setRating(value)}
                    aria-label={en ? `${value} stars` : `${value} sao`}
                  />
                  <Star size={32} />
                </label>
              ))}
            </div>
          </fieldset>
          <label className={styles.field}>
            {en ? 'Name' : 'Tên của bạn'}
            <input
              name="name"
              autoComplete="given-name"
              placeholder={en ? 'What should we call you?' : 'Tụi mình gọi bạn là…'}
              required
              maxLength={60}
              disabled={busy}
            />
          </label>
          <label className={styles.field}>
            {en ? 'Comment' : 'Nhận xét'}
            <textarea
              name="comment"
              placeholder={en ? 'Tell us about your game…' : 'Điều gì làm bạn thích thú hôm nay?'}
              required
              maxLength={1000}
              rows={3}
              disabled={busy}
            />
          </label>
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          <button className="button button-primary" disabled={busy} type="submit">
            {busy ? (en ? 'Sending…' : 'Đang gửi…') : en ? 'Send review' : 'Gửi đánh giá'}
          </button>
          <button type="button" className={styles.skip} disabled={busy} onClick={close}>
            {en ? 'Maybe later' : 'Để lần sau nhé'}
          </button>
        </form>
      )}
    </dialog>
  );
}
