'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Copy, KeyRound } from 'lucide-react';
import type { Pack } from '@/lib/types';
import styles from './commerce.module.css';

export function Restore() {
  const [code, setCode] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState(''); const [packs, setPacks] = useState<Pack[]>([]); const [purchases, setPurchases] = useState<{ packId: string; recoveryCode: string }[]>([]); const [copied, setCopied] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    fetch('/vi/packs.json', { signal: controller.signal }).then(r => r.json()).then(data => setPacks(data.packs)).catch(() => {});
    fetch('/api/entitlements', { cache: 'no-store', signal: controller.signal }).then(r => r.ok ? r.json() : null).then(data => { if (data) setPurchases(data.purchases ?? []); }).catch(() => {});
    return () => controller.abort();
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return; setBusy(true); setError(''); setSuccess('');
    try {
      if (!navigator.onLine) throw new Error('Kết nối mạng để khôi phục quyền mua nhé.');
      const session = await fetch('/api/session', { method: 'POST', cache: 'no-store' }); if (!session.ok) { const data = await session.json(); throw new Error(data.error || 'Khôi phục chưa sẵn sàng.'); }
      const response = await fetch('/api/entitlements/restore', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recoveryCode: code.trim() }), cache: 'no-store' }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Không thể khôi phục bằng mã này. Vui lòng kiểm tra lại.');
      setSuccess(data.packId);
      setPurchases(current => [...current.filter(purchase => purchase.packId !== data.packId), { packId: data.packId, recoveryCode: code.trim() }]);
      setCode('');
      void fetch('/api/entitlements', { cache: 'no-store' }).then(response => response.ok ? response.json() : null).then(current => { if (current) setPurchases(current.purchases ?? []); }).catch(() => {});
      try { const old = JSON.parse(localStorage.getItem('tod:owned:v1') || '[]'); localStorage.setItem('tod:owned:v1', JSON.stringify([...new Set([...(Array.isArray(old) ? old : []), data.packId])])); } catch { /* The server retains this grant. */ }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Chưa thể kết nối. Vui lòng thử lại.'); } finally { setBusy(false); }
  }
  const restored = packs.find(pack => pack.id === success);
  return <section className={styles.shell}><Link href="/vi" className={styles.back}><ArrowLeft size={17} /> Về thư viện</Link><div className={styles.title}><span className={styles.icon}><KeyRound /></span><p className="eyebrow">ĐỔI THIẾT BỊ, GIỮ CUỘC VUI</p><h1>Khôi phục quyền mua</h1><p>Không cần tài khoản. Chỉ cần mã khôi phục đã lưu khi thanh toán.</p></div><div className={styles.panel}>
    {success ? <div className={styles.success} role="status"><Check size={34} /><h2>Đã khôi phục thành công</h2><p>{restored?.title ?? 'Bộ câu hỏi của bạn'} đã sẵn sàng trên thiết bị này.</p><Link href={restored ? `/vi/choi/${restored.slug}` : '/vi/danh-muc'} className="button button-primary">Chơi ngay <ArrowRight size={17} /></Link><button className={styles.textButton} onClick={() => setSuccess('')}>Khôi phục bộ khác</button></div> : <form onSubmit={submit}><label className={styles.label} htmlFor="recovery-code">Mã khôi phục</label><input className={styles.input} id="recovery-code" value={code} onChange={event => setCode(event.target.value)} required maxLength={200} placeholder="Nhập mã bạn đã lưu" spellCheck={false} autoComplete="off" autoCapitalize="characters" aria-describedby="recovery-help" /><p className={styles.fine} id="recovery-help">Mỗi bộ đã mua có một mã riêng. Không chia sẻ mã công khai.</p>{error && <p className={styles.error} role="alert">{error}</p>}<button className={`button button-primary ${styles.full}`} disabled={busy || !code.trim()} type="submit">{busy ? 'Đang khôi phục…' : 'Khôi phục bộ đã mua'} <ArrowRight size={17} /></button></form>}
    </div>{purchases.length > 0 && <div className={styles.panel}><h2>Các bộ trên thiết bị này</h2><p className={styles.muted}>Lưu mã trước khi đổi điện thoại hoặc xóa dữ liệu trình duyệt.</p>{purchases.map(purchase => <div className={styles.recovery} key={purchase.packId}><h3>{packs.find(pack => pack.id === purchase.packId)?.title ?? purchase.packId}</h3><code>{purchase.recoveryCode}</code><button className={styles.textButton} onClick={async () => { try { await navigator.clipboard.writeText(purchase.recoveryCode); setCopied('Đã sao chép mã khôi phục.'); } catch { setCopied('Hãy chọn và sao chép mã trực tiếp.'); } }}><Copy size={15} /> Sao chép mã</button></div>)}</div>}<p className={styles.copied} role="status">{copied}</p><p className={styles.footer}>Mất mã? Giữ thông tin giao dịch để được hỗ trợ.</p><Link className={styles.bottomLink} href="/vi/lien-he">Liên hệ hỗ trợ</Link></section>;
}
