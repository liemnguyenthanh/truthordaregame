'use client';

import { formatLocale } from '@/lib/i18n';
import { localizedError } from '@/lib/i18n/messages';
import { useI18n } from './locale-provider';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  LockKeyhole,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import type { Pack } from '@/lib/types';
import styles from './commerce.module.css';

type Order = {
  id: string;
  packId: string;
  status: string;
  amountVnd: number;
  expiresAt: string;
  paymentCode: string;
  qrUrl: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  recoveryCode?: string;
};
type Product = { packId: string; priceVnd: number; available: boolean };

async function api(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, cache: 'no-store' });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Chưa thể kết nối. Vui lòng thử lại.');
  return data;
}
function saveOwnership(packId: string) {
  try {
    const stored = JSON.parse(localStorage.getItem('tod:owned:v1') || '[]');
    localStorage.setItem(
      'tod:owned:v1',
      JSON.stringify([...new Set([...(Array.isArray(stored) ? stored : []), packId])]),
    );
  } catch {
    /* Purchase remains on server. */
  }
}
export function Checkout() {
  const params = useSearchParams();
  return <PackCheckout key={params.get('pack') || ''} packId={params.get('pack') || ''} />;
}
function PackCheckout({ packId }: { packId: string }) {
  const { t, path, locale } = useI18n();
  const money = (value: number) =>
    new Intl.NumberFormat(formatLocale(locale), { style: 'currency', currency: 'VND' }).format(
      value,
    );
  const [pack, setPack] = useState<Pack | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [owned, setOwned] = useState(false);
  const [recovery, setRecovery] = useState('');
  const [retry, setRetry] = useState(0);
  const requestKey = useRef('');
  const inFlight = useRef(false);
  const active = useRef(false);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  const syncOrder = useCallback(
    async (id: string) => {
      try {
        const data = await api(`/api/orders/${encodeURIComponent(id)}`);
        if (!active.current || data.order.packId !== packId) return;
        setOrder(data.order);
        if (data.order.status === 'paid') {
          saveOwnership(data.order.packId);
          setRecovery(data.order.recoveryCode || '');
        }
        setError('');
      } catch (cause) {
        if (active.current)
          setError(
            cause instanceof Error
              ? localizedError(locale, cause.message)
              : t('Chưa thể kiểm tra thanh toán.'),
          );
      }
    },
    [packId, locale, t],
  );
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    if (!packId) {
      setError(t('Hãy chọn một bộ câu hỏi trước khi thanh toán.'));
      setLoading(false);
      return;
    }
    const setup = async () => {
      try {
        const [catalog, currentProduct] = await Promise.all([
          api(`/api/catalog?locale=${locale}`),
          api(`/api/products/${encodeURIComponent(packId)}`),
        ]);
        const selected = catalog.packs.find((item: Pack) => item.id === packId);
        if (!selected || selected.tier !== 'premium')
          throw new Error(t('Bộ câu hỏi này không cần thanh toán hoặc không còn mở bán.'));
        if (cancelled) return;
        setPack(selected);
        setProduct(currentProduct);
        await api('/api/session', { method: 'POST' });
        const entitlements = await api('/api/entitlements');
        if (cancelled) return;
        if (entitlements.packIds.includes(packId)) {
          setOwned(true);
          saveOwnership(packId);
          setRecovery(
            entitlements.purchases.find(
              (item: { packId: string; recoveryCode: string }) => item.packId === packId,
            )?.recoveryCode || '',
          );
        } else {
          try {
            const id = localStorage.getItem(`tod:order:v1:${packId}`);
            if (id) await syncOrder(id);
          } catch {
            /* Creating a new order remains possible. */
          }
        }
      } catch (cause) {
        if (!cancelled)
          setError(
            cause instanceof Error
              ? localizedError(locale, cause.message)
              : t('Thanh toán chưa sẵn sàng.'),
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void setup();
    return () => {
      cancelled = true;
    };
  }, [packId, retry, syncOrder, locale, t]);
  useEffect(() => {
    if (!order || order.status !== 'pending') return;
    const check = () => {
      if (navigator.onLine && document.visibilityState === 'visible') void syncOrder(order.id);
    };
    const timer = window.setInterval(check, 4000);
    window.addEventListener('focus', check);
    window.addEventListener('online', check);
    document.addEventListener('visibilitychange', check);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', check);
      window.removeEventListener('online', check);
      document.removeEventListener('visibilitychange', check);
    };
  }, [order?.id, order?.status, syncOrder]);
  async function createOrder() {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    try {
      if (!navigator.onLine) throw new Error(t('Bạn cần kết nối mạng để tạo mã thanh toán.'));
      await api('/api/session', { method: 'POST' });
      if (!requestKey.current) requestKey.current = crypto.randomUUID();
      const data = await api('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': requestKey.current },
        body: JSON.stringify({ packId }),
      });
      if (!active.current) return;
      if (data.alreadyOwned) {
        setOwned(true);
        saveOwnership(packId);
      } else {
        setOrder(data.order);
        try {
          localStorage.setItem(`tod:order:v1:${packId}`, data.order.id);
        } catch {
          /* Owned order is persisted server-side. */
        }
      }
    } catch (cause) {
      if (active.current)
        setError(
          cause instanceof Error ? localizedError(locale, cause.message) : t('Chưa thể tạo đơn.'),
        );
    } finally {
      if (active.current) {
        setBusy(false);
        inFlight.current = false;
      }
    }
  }
  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
    } catch {
      setCopied(t('Không thể sao chép tự động. Hãy chọn và sao chép nội dung bên dưới.'));
    }
  }
  const paid = owned || order?.status === 'paid';
  return (
    <section className={styles.shell}>
      <Link href={path(pack ? `/vi/choi/${pack.slug}` : '/vi/danh-muc')} className={styles.back}>
        <ArrowLeft size={17} /> {t('Quay lại cuộc vui')}{' '}
      </Link>
      <div className={styles.title}>
        <span className={styles.icon}>{paid ? <Check /> : <LockKeyhole />}</span>
        <p className="eyebrow">
          {paid ? t('SẴN SÀNG CHƠI TIẾP') : t('THÊM CÂU HỎI. THÊM KẾT NỐI.')}
        </p>
        <h1>{paid ? t('Bộ câu hỏi đã mở khóa!') : t('Mở khóa cuộc vui')}</h1>
        <p>
          {paid
            ? t('Cảm ơn bạn đã đồng hành. Ván chơi vẫn ở đúng nơi bạn dừng lại.')
            : t('Một lần thanh toán. Những cuộc vui không giới hạn.')}
        </p>
      </div>
      {loading && (
        <p className="notice" role="status">
          {t('Đang kiểm tra giá và quyền mua…')}{' '}
        </p>
      )}
      {error && (
        <div className={styles.error} role="alert">
          <p>{error}</p>
          <button className={styles.textButton} onClick={() => setRetry((value) => value + 1)}>
            <RefreshCw size={15} /> {t('Thử lại kết nối')}{' '}
          </button>
        </div>
      )}
      {paid ? (
        <div className={styles.panel}>
          <div className={styles.success}>
            <ShieldCheck size={32} />
            <h2>{pack?.title ?? t('Đã thanh toán thành công')}</h2>
            <p>{t('Quyền mua đã được lưu trên thiết bị này.')}</p>
          </div>
          {recovery ? (
            <div className={styles.recovery}>
              <h3>{t('Lưu mã khôi phục của bạn')}</h3>
              <p>
                {t('Dùng mã này để mở bộ đã mua trên thiết bị khác. Hãy giữ mã riêng cho mình.')}
              </p>
              <code>{recovery}</code>
              <button
                className="button button-secondary"
                onClick={() => copy(recovery, t('Đã sao chép mã khôi phục'))}
              >
                <Copy size={16} /> {t('Sao chép mã')}{' '}
              </button>
            </div>
          ) : (
            <p className="notice">
              {t('Mã khôi phục có trong trang Khôi phục quyền mua khi kết nối được máy chủ.')}{' '}
            </p>
          )}
          <Link
            className={`button button-primary ${styles.full}`}
            href={path(pack ? `/vi/choi/${pack.slug}` : '/vi/danh-muc')}
          >
            {t('Chơi tiếp')} <ArrowRight size={18} />
          </Link>
          <Link href={path('/vi/khoi-phuc')} className={styles.bottomLink}>
            {t('Quản lý mã khôi phục')}{' '}
          </Link>
        </div>
      ) : (
        <>
          {pack && product && (
            <div className={styles.panel}>
              <div className={styles.summary}>
                <span className={styles.packIcon}>{pack.icon}</span>
                <div>
                  <p className="eyebrow">{t('BỘ PREMIUM')}</p>
                  <h2>{pack.title}</h2>
                  <p>
                    {pack.questionCount} {t('câu ·')} {pack.truthCount} {t('Thật +')}{' '}
                    {pack.dareCount} {t('Thách')}{' '}
                  </p>
                </div>
                <strong>{money(order?.amountVnd ?? product.priceVnd)}</strong>
              </div>
              <ul className={styles.features}>
                <li>
                  <Check size={16} /> {t('Mở toàn bộ câu hỏi của bộ này')}{' '}
                </li>
                <li>
                  <Check size={16} /> {t('Chơi lại không giới hạn, không cần tài khoản')}{' '}
                </li>
                <li>
                  <Check size={16} /> {t('Đổi thiết bị bằng mã khôi phục')}{' '}
                </li>
              </ul>
              {!order && (
                <>
                  <button
                    className={`button button-primary ${styles.full}`}
                    disabled={busy || loading || !product.available}
                    onClick={createOrder}
                  >
                    {busy
                      ? t('Đang tạo mã thanh toán…')
                      : product.available
                        ? t('Tạo mã QR · {v0}', { v0: money(product.priceVnd) })
                        : t('Bộ này tạm ngừng mở bán')}{' '}
                    <ArrowRight size={18} />
                  </button>
                  <p className={styles.fine}>
                    {t(
                      'Chuyển khoản ngân hàng qua SePay. Giá và quyền mua áp dụng riêng cho bộ này.',
                    )}{' '}
                  </p>
                </>
              )}
            </div>
          )}
          {order && (
            <div className={styles.panel}>
              <h2>{t('Chuyển khoản để mở khóa')}</h2>
              {order.status === 'pending' ? (
                <>
                  <p className={styles.muted}>
                    {t(
                      'Quét QR bằng ứng dụng ngân hàng. Giữ nguyên số tiền và nội dung chuyển khoản.',
                    )}{' '}
                  </p>
                  <div className={styles.qr}>
                    <img
                      src={order.qrUrl}
                      width="260"
                      height="260"
                      alt={t('Mã QR thanh toán {v0} cho bộ câu hỏi', {
                        v0: money(order.amountVnd),
                      })}
                    />
                  </div>
                  <dl className={styles.details}>
                    <div>
                      <dt>{t('Ngân hàng')}</dt>
                      <dd>{order.bankName}</dd>
                    </div>
                    <div>
                      <dt>{t('Chủ tài khoản')}</dt>
                      <dd>{order.accountName}</dd>
                    </div>
                    <div>
                      <dt>{t('Số tài khoản')}</dt>
                      <dd>
                        {order.accountNumber}
                        <button
                          aria-label={t('Sao chép số tài khoản')}
                          onClick={() => copy(order.accountNumber, t('Đã sao chép số tài khoản'))}
                        >
                          <Copy size={15} />
                        </button>
                      </dd>
                    </div>
                    <div>
                      <dt>{t('Số tiền')}</dt>
                      <dd>{money(order.amountVnd)}</dd>
                    </div>
                    <div>
                      <dt>{t('Nội dung')}</dt>
                      <dd>
                        {order.paymentCode}
                        <button
                          aria-label={t('Sao chép nội dung chuyển khoản')}
                          onClick={() =>
                            copy(order.paymentCode, t('Đã sao chép nội dung chuyển khoản'))
                          }
                        >
                          <Copy size={15} />
                        </button>
                      </dd>
                    </div>
                  </dl>
                  <p className={styles.waiting} role="status">
                    <span /> {t('Đang chờ ngân hàng xác nhận')}{' '}
                  </p>
                  <p className={styles.fine}>
                    {t('Đơn có hiệu lực đến')}{' '}
                    {new Date(order.expiresAt).toLocaleTimeString(formatLocale(locale), {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {t('. Trang tự kiểm tra khi bạn quay lại từ ứng dụng ngân hàng.')}{' '}
                  </p>
                  <button className={styles.textButton} onClick={() => void syncOrder(order.id)}>
                    <RefreshCw size={15} /> {t('Kiểm tra thanh toán')}{' '}
                  </button>
                </>
              ) : (
                <>
                  <p className="notice">
                    {order.status === 'expired'
                      ? t(
                          'Đơn đã hết hạn. Nếu đã chuyển khoản, hãy kiểm tra lại trạng thái hoặc liên hệ hỗ trợ trước khi tạo đơn khác.',
                        )
                      : order.status === 'refunded'
                        ? t('Đơn này đã được hoàn tiền.')
                        : t(
                            'Giao dịch cần được đối soát. Vui lòng liên hệ hỗ trợ và cung cấp mã đơn bên dưới.',
                          )}
                  </p>
                  <p className={styles.fine}>
                    {t('Mã đơn:')} {order.id}
                  </p>
                  <div className={styles.actions}>
                    <button
                      className="button button-secondary"
                      onClick={() => void syncOrder(order.id)}
                    >
                      {t('Kiểm tra lại')}{' '}
                    </button>
                    <Link className="button button-secondary" href={path('/vi/lien-he')}>
                      {t('Liên hệ hỗ trợ')}{' '}
                    </Link>
                  </div>
                  {order.status === 'expired' && (
                    <button
                      className={styles.textButton}
                      onClick={() => {
                        requestKey.current = '';
                        setOrder(null);
                        try {
                          localStorage.removeItem(`tod:order:v1:${packId}`);
                        } catch {}
                      }}
                    >
                      {t('Tôi chưa chuyển khoản · tạo đơn mới')}{' '}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
      <p className={styles.copied} role="status">
        {copied}
      </p>
      <p className={styles.footer}>
        <ShieldCheck size={15} /> {t('Chỉ mở khóa sau khi ngân hàng xác nhận.')}{' '}
      </p>
      <Link className={styles.bottomLink} href={path('/vi/chinh-sach-thanh-toan')}>
        {t('Chính sách thanh toán')}{' '}
      </Link>
    </section>
  );
}
