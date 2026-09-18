'use client';

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
const money = (value: number) => `${new Intl.NumberFormat('vi-VN').format(value)}đ`;
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
          setError(cause instanceof Error ? cause.message : 'Chưa thể kiểm tra thanh toán.');
      }
    },
    [packId],
  );
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    if (!packId) {
      setError('Hãy chọn một bộ câu hỏi trước khi thanh toán.');
      setLoading(false);
      return;
    }
    const setup = async () => {
      try {
        const [catalog, currentProduct] = await Promise.all([
          api('/api/catalog'),
          api(`/api/products/${encodeURIComponent(packId)}`),
        ]);
        const selected = catalog.packs.find((item: Pack) => item.id === packId);
        if (!selected || selected.tier !== 'premium')
          throw new Error('Bộ câu hỏi này không cần thanh toán hoặc không còn mở bán.');
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
          setError(cause instanceof Error ? cause.message : 'Thanh toán chưa sẵn sàng.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void setup();
    return () => {
      cancelled = true;
    };
  }, [packId, retry, syncOrder]);
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
      if (!navigator.onLine) throw new Error('Bạn cần kết nối mạng để tạo mã thanh toán.');
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
      if (active.current) setError(cause instanceof Error ? cause.message : 'Chưa thể tạo đơn.');
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
      setCopied('Không thể sao chép tự động. Hãy chọn và sao chép nội dung bên dưới.');
    }
  }
  const paid = owned || order?.status === 'paid';
  return (
    <section className={styles.shell}>
      <Link href={pack ? `/vi/choi/${pack.slug}` : '/vi/danh-muc'} className={styles.back}>
        <ArrowLeft size={17} /> Quay lại cuộc vui
      </Link>
      <div className={styles.title}>
        <span className={styles.icon}>{paid ? <Check /> : <LockKeyhole />}</span>
        <p className="eyebrow">{paid ? 'SẴN SÀNG CHƠI TIẾP' : 'THÊM CÂU HỎI. THÊM KẾT NỐI.'}</p>
        <h1>{paid ? 'Bộ câu hỏi đã mở khóa!' : 'Mở khóa cuộc vui'}</h1>
        <p>
          {paid
            ? 'Cảm ơn bạn đã đồng hành. Ván chơi vẫn ở đúng nơi bạn dừng lại.'
            : 'Một lần thanh toán. Những cuộc vui không giới hạn.'}
        </p>
      </div>
      {loading && (
        <p className="notice" role="status">
          Đang kiểm tra giá và quyền mua…
        </p>
      )}
      {error && (
        <div className={styles.error} role="alert">
          <p>{error}</p>
          <button className={styles.textButton} onClick={() => setRetry((value) => value + 1)}>
            <RefreshCw size={15} /> Thử lại kết nối
          </button>
        </div>
      )}
      {paid ? (
        <div className={styles.panel}>
          <div className={styles.success}>
            <ShieldCheck size={32} />
            <h2>{pack?.title ?? 'Đã thanh toán thành công'}</h2>
            <p>Quyền mua đã được lưu trên thiết bị này.</p>
          </div>
          {recovery ? (
            <div className={styles.recovery}>
              <h3>Lưu mã khôi phục của bạn</h3>
              <p>Dùng mã này để mở bộ đã mua trên thiết bị khác. Hãy giữ mã riêng cho mình.</p>
              <code>{recovery}</code>
              <button
                className="button button-secondary"
                onClick={() => copy(recovery, 'Đã sao chép mã khôi phục')}
              >
                <Copy size={16} /> Sao chép mã
              </button>
            </div>
          ) : (
            <p className="notice">
              Mã khôi phục có trong trang Khôi phục quyền mua khi kết nối được máy chủ.
            </p>
          )}
          <Link
            className={`button button-primary ${styles.full}`}
            href={pack ? `/vi/choi/${pack.slug}` : '/vi/danh-muc'}
          >
            Chơi tiếp <ArrowRight size={18} />
          </Link>
          <Link href="/vi/khoi-phuc" className={styles.bottomLink}>
            Quản lý mã khôi phục
          </Link>
        </div>
      ) : (
        <>
          {pack && product && (
            <div className={styles.panel}>
              <div className={styles.summary}>
                <span className={styles.packIcon}>{pack.icon}</span>
                <div>
                  <p className="eyebrow">BỘ PREMIUM</p>
                  <h2>{pack.title}</h2>
                  <p>
                    {pack.questionCount} câu · {pack.truthCount} Thật + {pack.dareCount} Thách
                  </p>
                </div>
                <strong>{money(order?.amountVnd ?? product.priceVnd)}</strong>
              </div>
              <ul className={styles.features}>
                <li>
                  <Check size={16} /> Mở toàn bộ câu hỏi của bộ này
                </li>
                <li>
                  <Check size={16} /> Chơi lại không giới hạn, không cần tài khoản
                </li>
                <li>
                  <Check size={16} /> Đổi thiết bị bằng mã khôi phục
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
                      ? 'Đang tạo mã thanh toán…'
                      : product.available
                        ? `Tạo mã QR · ${money(product.priceVnd)}`
                        : 'Bộ này tạm ngừng mở bán'}{' '}
                    <ArrowRight size={18} />
                  </button>
                  <p className={styles.fine}>
                    Chuyển khoản ngân hàng qua SePay. Giá và quyền mua áp dụng riêng cho bộ này.
                  </p>
                </>
              )}
            </div>
          )}
          {order && (
            <div className={styles.panel}>
              <h2>Chuyển khoản để mở khóa</h2>
              {order.status === 'pending' ? (
                <>
                  <p className={styles.muted}>
                    Quét QR bằng ứng dụng ngân hàng. Giữ nguyên số tiền và nội dung chuyển khoản.
                  </p>
                  <div className={styles.qr}>
                    <img
                      src={order.qrUrl}
                      width="260"
                      height="260"
                      alt={`Mã QR thanh toán ${money(order.amountVnd)} cho bộ câu hỏi`}
                    />
                  </div>
                  <dl className={styles.details}>
                    <div>
                      <dt>Ngân hàng</dt>
                      <dd>{order.bankName}</dd>
                    </div>
                    <div>
                      <dt>Chủ tài khoản</dt>
                      <dd>{order.accountName}</dd>
                    </div>
                    <div>
                      <dt>Số tài khoản</dt>
                      <dd>
                        {order.accountNumber}
                        <button
                          aria-label="Sao chép số tài khoản"
                          onClick={() => copy(order.accountNumber, 'Đã sao chép số tài khoản')}
                        >
                          <Copy size={15} />
                        </button>
                      </dd>
                    </div>
                    <div>
                      <dt>Số tiền</dt>
                      <dd>{money(order.amountVnd)}</dd>
                    </div>
                    <div>
                      <dt>Nội dung</dt>
                      <dd>
                        {order.paymentCode}
                        <button
                          aria-label="Sao chép nội dung chuyển khoản"
                          onClick={() =>
                            copy(order.paymentCode, 'Đã sao chép nội dung chuyển khoản')
                          }
                        >
                          <Copy size={15} />
                        </button>
                      </dd>
                    </div>
                  </dl>
                  <p className={styles.waiting} role="status">
                    <span /> Đang chờ ngân hàng xác nhận
                  </p>
                  <p className={styles.fine}>
                    Đơn có hiệu lực đến{' '}
                    {new Date(order.expiresAt).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    . Trang tự kiểm tra khi bạn quay lại từ ứng dụng ngân hàng.
                  </p>
                  <button className={styles.textButton} onClick={() => void syncOrder(order.id)}>
                    <RefreshCw size={15} /> Kiểm tra thanh toán
                  </button>
                </>
              ) : (
                <>
                  <p className="notice">
                    {order.status === 'expired'
                      ? 'Đơn đã hết hạn. Nếu đã chuyển khoản, hãy kiểm tra lại trạng thái hoặc liên hệ hỗ trợ trước khi tạo đơn khác.'
                      : order.status === 'refunded'
                        ? 'Đơn này đã được hoàn tiền.'
                        : 'Giao dịch cần được đối soát. Vui lòng liên hệ hỗ trợ và cung cấp mã đơn bên dưới.'}
                  </p>
                  <p className={styles.fine}>Mã đơn: {order.id}</p>
                  <div className={styles.actions}>
                    <button
                      className="button button-secondary"
                      onClick={() => void syncOrder(order.id)}
                    >
                      Kiểm tra lại
                    </button>
                    <Link className="button button-secondary" href="/vi/lien-he">
                      Liên hệ hỗ trợ
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
                      Tôi chưa chuyển khoản · tạo đơn mới
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
        <ShieldCheck size={15} /> Chỉ mở khóa sau khi ngân hàng xác nhận.
      </p>
      <Link className={styles.bottomLink} href="/vi/chinh-sach-thanh-toan">
        Chính sách thanh toán
      </Link>
    </section>
  );
}
