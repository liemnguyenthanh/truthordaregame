'use client';

import { localizedError } from '@/lib/i18n/messages';
import { useI18n } from './locale-provider';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Copy, KeyRound } from 'lucide-react';
import type { Pack } from '@/lib/types';
import styles from './commerce.module.css';

export function Restore() {
  const { t, path, locale } = useI18n();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [packs, setPacks] = useState<Pack[]>([]);
  const [purchases, setPurchases] = useState<{ packId: string; recoveryCode: string }[]>([]);
  const [copied, setCopied] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/catalog?locale=${locale}`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error('Catalog unavailable');
        return r.json();
      })
      .then((data) => setPacks(data.packs))
      .catch(() => {});
    fetch('/api/entitlements', { cache: 'no-store', signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setPurchases(data.purchases ?? []);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [locale]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      if (!navigator.onLine) throw new Error(t('Kết nối mạng để khôi phục quyền mua nhé.'));
      const session = await fetch('/api/session', { method: 'POST', cache: 'no-store' });
      if (!session.ok) {
        const data = await session.json();
        throw new Error(data.error || t('Khôi phục chưa sẵn sàng.'));
      }
      const response = await fetch('/api/entitlements/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recoveryCode: code.trim() }),
        cache: 'no-store',
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || t('Không thể khôi phục bằng mã này. Vui lòng kiểm tra lại.'));
      setSuccess(data.packId);
      setPurchases((current) => [
        ...current.filter((purchase) => purchase.packId !== data.packId),
        { packId: data.packId, recoveryCode: code.trim() },
      ]);
      setCode('');
      void fetch('/api/entitlements', { cache: 'no-store' })
        .then((response) => (response.ok ? response.json() : null))
        .then((current) => {
          if (current) setPurchases(current.purchases ?? []);
        })
        .catch(() => {});
      try {
        const old = JSON.parse(localStorage.getItem('tod:owned:v1') || '[]');
        localStorage.setItem(
          'tod:owned:v1',
          JSON.stringify([...new Set([...(Array.isArray(old) ? old : []), data.packId])]),
        );
      } catch {
        /* The server retains this grant. */
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? localizedError(locale, cause.message)
          : t('Chưa thể kết nối. Vui lòng thử lại.'),
      );
    } finally {
      setBusy(false);
    }
  }
  const restored = packs.find((pack) => pack.id === success);
  return (
    <section className={styles.shell}>
      <Link href={path('/vi')} className={styles.back}>
        <ArrowLeft size={17} /> {t('Về thư viện')}{' '}
      </Link>
      <div className={styles.title}>
        <span className={styles.icon}>
          <KeyRound />
        </span>
        <p className="eyebrow">{t('ĐỔI THIẾT BỊ, GIỮ CUỘC VUI')}</p>
        <h1>{t('Khôi phục quyền mua')}</h1>
        <p>{t('Không cần tài khoản. Chỉ cần mã khôi phục đã lưu khi thanh toán.')}</p>
      </div>
      <div className={styles.panel}>
        {success ? (
          <div className={styles.success} role="status">
            <Check size={34} />
            <h2>{t('Đã khôi phục thành công')}</h2>
            <p>
              {restored?.title ?? t('Bộ câu hỏi của bạn')} {t('đã sẵn sàng trên thiết bị này.')}
            </p>
            <Link
              href={path(restored ? `/vi/choi/${restored.slug}` : '/vi/danh-muc')}
              className="button button-primary"
            >
              {t('Chơi ngay')} <ArrowRight size={17} />
            </Link>
            <button className={styles.textButton} onClick={() => setSuccess('')}>
              {t('Khôi phục bộ khác')}{' '}
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <label className={styles.label} htmlFor="recovery-code">
              {t('Mã khôi phục')}{' '}
            </label>
            <input
              className={styles.input}
              id="recovery-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              required
              maxLength={200}
              placeholder={t('Nhập mã bạn đã lưu')}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="characters"
              aria-describedby="recovery-help"
            />
            <p className={styles.fine} id="recovery-help">
              {t('Mỗi bộ đã mua có một mã riêng. Không chia sẻ mã công khai.')}{' '}
            </p>
            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}
            <button
              className={`button button-primary ${styles.full}`}
              disabled={busy || !code.trim()}
              type="submit"
            >
              {busy ? t('Đang khôi phục…') : t('Khôi phục bộ đã mua')} <ArrowRight size={17} />
            </button>
          </form>
        )}
      </div>
      {purchases.length > 0 && (
        <div className={styles.panel}>
          <h2>{t('Các bộ trên thiết bị này')}</h2>
          <p className={styles.muted}>
            {t('Lưu mã trước khi đổi điện thoại hoặc xóa dữ liệu trình duyệt.')}{' '}
          </p>
          {purchases.map((purchase) => (
            <div className={styles.recovery} key={purchase.packId}>
              <h3>{packs.find((pack) => pack.id === purchase.packId)?.title ?? purchase.packId}</h3>
              <code>{purchase.recoveryCode}</code>
              <button
                className={styles.textButton}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(purchase.recoveryCode);
                    setCopied(t('Đã sao chép mã khôi phục.'));
                  } catch {
                    setCopied(t('Hãy chọn và sao chép mã trực tiếp.'));
                  }
                }}
              >
                <Copy size={15} /> {t('Sao chép mã')}{' '}
              </button>
            </div>
          ))}
        </div>
      )}
      <p className={styles.copied} role="status">
        {copied}
      </p>
      <p className={styles.footer}>{t('Mất mã? Giữ thông tin giao dịch để được hỗ trợ.')}</p>
      <Link className={styles.bottomLink} href={path('/vi/lien-he')}>
        {t('Liên hệ hỗ trợ')}{' '}
      </Link>
    </section>
  );
}
