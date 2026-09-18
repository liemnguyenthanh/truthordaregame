'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Clock3, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { GroupEditor } from './group-editor';
import type { GeneratedPack, GroupMood, PlayGroup } from '@/lib/types';
import { GROUP_STORAGE_KEY, MOODS, validateGroup } from '@/lib/groups';
import styles from './ai-builder.module.css';

const GROUP_KEY = GROUP_STORAGE_KEY;
const REQUEST_KEY = 'tod:generation-request:v1';
const HISTORY_KEY = 'tod:generated-history:v1';
const choices = MOODS.map(mood => ({ ...mood, title: mood.name }));
async function api(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, cache: 'no-store' });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Chưa thể kết nối. Hãy thử lại.');
  return data;
}
export function AiBuilder() {
  const router = useRouter();
  const [group, setGroup] = useState<PlayGroup | null>(null);
  const [editing, setEditing] = useState(true);
  const [mood, setMood] = useState<GroupMood>('friendly');
  const [adults, setAdults] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [storageWarning, setStorageWarning] = useState(false);
  const [history, setHistory] = useState<GeneratedPack[]>([]);
  const [limit, setLimit] = useState<number | null>(null);
  const [serviceNotice, setServiceNotice] = useState('');
  const [ready, setReady] = useState(false);
  const request = useRef<{ key: string; body: string } | null>(null);
  const inFlight = useRef(false);
  useEffect(() => {
    let cancelled = false;
    try {
      const saved = JSON.parse(localStorage.getItem(GROUP_KEY) || 'null');
      if (saved) { setGroup(validateGroup(saved)); setEditing(false); }
      const savedHistory = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      if (Array.isArray(savedHistory)) setHistory(savedHistory);
      const savedRequest = JSON.parse(localStorage.getItem(REQUEST_KEY) || 'null');
      if (savedRequest?.key && savedRequest?.body) {
        const pendingInput = JSON.parse(savedRequest.body);
        if (MOODS.some(item => item.id === pendingInput.mood)) {
          setGroup(validateGroup(pendingInput.group)); setEditing(false);
          setMood(pendingInput.mood); setAdults(pendingInput.adultsConfirmed === true); request.current = savedRequest;
        }
      }
    } catch { setStorageWarning(true); }
    setReady(true);
    void api('/api/generations/config').then(data => {
      if (cancelled) return;
      if (Number.isInteger(data.dailyLimit)) setLimit(data.dailyLimit);
      setServiceNotice('');
    }).catch(cause => { if (!cancelled) setServiceNotice(cause instanceof Error ? cause.message : 'Tính năng AI chưa sẵn sàng.'); });
    void (async () => {
      try {
        await api('/api/session', { method: 'POST' });
        const data = await api('/api/generations');
        if (cancelled) return;
        if (Array.isArray(data.generations)) {
          setHistory(data.generations);
          try { localStorage.setItem(HISTORY_KEY, JSON.stringify(data.generations)); } catch { setStorageWarning(true); }
        }
        if (Number.isInteger(data.limitPerDay)) setLimit(data.limitPerDay);
      } catch { /* History is optional; generation reports configuration errors explicitly. */ }
    })();
    return () => { cancelled = true; };
  }, []);
  function saveGroup(value: PlayGroup) {
    setGroup(value); setEditing(false); setError('');
    try { localStorage.setItem(GROUP_KEY, JSON.stringify(value)); } catch { setStorageWarning(true); }
  }
  async function generate() {
    if (!group || inFlight.current || (mood === 'flirty' && !adults)) return;
    inFlight.current = true; setBusy(true); setError('');
    try {
      if (!navigator.onLine) throw new Error('Cần kết nối mạng để tạo bộ câu hỏi bằng AI.');
      const body = JSON.stringify({ group, mood, adultsConfirmed: mood === 'flirty' && adults });
      if (!request.current || request.current.body !== body) request.current = { key: crypto.randomUUID(), body };
      try { localStorage.setItem(REQUEST_KEY, JSON.stringify(request.current)); } catch { setStorageWarning(true); }
      const config = await api('/api/generations/config');
      if (!config.available) throw new Error('Tính năng AI đang tạm ngừng. Vui lòng thử lại sau.');
      if (Number.isInteger(config.dailyLimit)) setLimit(config.dailyLimit);
      setServiceNotice('');
      await api('/api/session', { method: 'POST' });
      const data = await api('/api/generations', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': request.current.key }, body });
      const generation: GeneratedPack = data.generation;
      if (!generation?.id) throw new Error('Máy chủ chưa trả về bộ câu hỏi. Hãy thử lại cùng yêu cầu.');
      try {
        localStorage.setItem('tod:generation-pending:v1', generation.id);
        const nextHistory = [generation, ...history.filter(item => item.id !== generation.id)].slice(0, 30);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
        if (generation.status === 'complete') localStorage.setItem(`tod:generated:v1:${generation.id}`, JSON.stringify(generation));
        // Once addressable, retries use the saved ID rather than making another request.
        localStorage.removeItem(REQUEST_KEY);
      } catch { setStorageWarning(true); }
      request.current = null;
      router.push(`/vi/bo-ai?id=${encodeURIComponent(generation.id)}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Chưa tạo được bộ câu hỏi. Thử lại sẽ tiếp tục cùng yêu cầu.'); }
    finally { setBusy(false); inFlight.current = false; }
  }
  return <section className={styles.shell}>
    <Link href="/vi" className={styles.back}><ArrowLeft size={17} /> Về thư viện</Link>
    <header className={styles.hero}><span className={styles.heroIcon}><Sparkles size={29} /></span><p className="eyebrow">CÂU CHUYỆN CỦA RIÊNG NHÓM BẠN</p><h1>Một nhóm bạn.<br /><em>Một bộ câu hỏi riêng.</em></h1><p>Thêm tên, chọn tâm trạng. AI kết nối các thành viên qua những câu Thật và Thách dành riêng cho nhóm.</p></header>
    {!ready ? <p role="status" className="notice">Đang chuẩn bị nhóm…</p> : <>
      <section className={styles.panel}><div className={styles.step}><span>01</span><h2>Hôm nay có những ai?</h2></div>
        {editing ? <GroupEditor initialGroup={group ?? undefined} onSave={saveGroup} onCancel={group ? () => setEditing(false) : undefined} submitLabel="Lưu nhóm và chọn tâm trạng" /> : group && <div className={styles.group}><div><Users size={22} /><h3>{group.name}</h3><button className={styles.textButton} disabled={busy} onClick={() => setEditing(true)}>Sửa nhóm</button></div><ul>{group.players.map(player => <li key={player.id}>{player.name}</li>)}</ul></div>}
      </section>
      <section className={styles.panel}><div className={styles.step}><span>02</span><h2>Chọn tâm trạng cuộc vui</h2></div><div className={styles.moods} role="radiogroup" aria-label="Tâm trạng của nhóm">{choices.map(choice => <label key={choice.id} className={`${styles.mood} ${mood === choice.id ? styles.selected : ''}`}><input type="radio" name="mood" value={choice.id} checked={mood === choice.id} disabled={busy} onChange={() => { setMood(choice.id); setAdults(false); }} /><span className={styles.moodIcon}>{choice.icon}</span><strong>{choice.title}</strong><span>{choice.description}</span>{mood === choice.id && <Check size={16} className={styles.selectedCheck} />}</label>)}</div>
        {mood === 'flirty' && <label className={styles.adults}><input type="checkbox" checked={adults} disabled={busy} onChange={event => setAdults(event.target.checked)} /><span>Tất cả thành viên đều từ 18 tuổi và đồng ý chơi chủ đề thả thính.</span></label>}
      </section>
      <div className={styles.privacy}><ShieldCheck size={20} /><p>Tên hoặc biệt danh và tâm trạng của nhóm được gửi đến AI để tạo câu hỏi. Bộ đã tạo được lưu riêng cho thiết bị này qua phiên khách, không đăng vào thư viện công khai. Nên dùng biệt danh và không nhập thông tin nhạy cảm.</p></div>
      {serviceNotice && !error && <p className="notice" role="status">{serviceNotice}</p>}
      {limit !== null && <p className={styles.limit}>Tạo miễn phí · tối đa {limit} bộ mỗi ngày theo cấu hình hiện tại.</p>}
      {error && <div role="alert" className={styles.error}>{error}<p>Thử lại sẽ dùng cùng mã yêu cầu để tránh tạo trùng khi mất kết nối.</p></div>}
      <button className={`button button-primary ${styles.generate}`} disabled={busy || !group || editing || (mood === 'flirty' && !adults)} onClick={() => void generate()}><Sparkles size={19} />{busy ? 'AI đang viết câu hỏi cho nhóm…' : 'Tạo bộ câu hỏi của nhóm'}{!busy && <ArrowRight size={18} />}</button>
      {busy && <p className={styles.waiting} role="status">Có thể mất khoảng một phút. Bạn không cần bấm lại; yêu cầu đang được xử lý.</p>}
      <p className={styles.fine}>Luôn có thể bỏ qua câu hỏi. Nội dung AI có thể chưa phù hợp; cả nhóm quyết định điều gì khiến mình thoải mái.</p>
    </>}
    {history.length > 0 && <section className={styles.history}><div className={styles.step}><Clock3 size={19} /><h2>Những bộ của nhóm</h2></div>{history.map(item => <Link href={`/vi/bo-ai?id=${encodeURIComponent(item.id)}`} key={item.id}><span>{item.pack?.icon || '✨'}</span><div><strong>{item.pack?.title || item.group?.name || 'Bộ câu hỏi AI'}</strong><small>{item.status === 'complete' ? 'Sẵn sàng chơi' : item.status === 'failed' ? 'Chưa tạo thành công' : 'Đang tạo'} · {new Date(item.createdAt).toLocaleDateString('vi-VN')}</small></div><ArrowRight size={17} /></Link>)}</section>}
    {storageWarning && <p className="notice">Trình duyệt chưa cho lưu dữ liệu. Bộ đã tạo cần kết nối và phiên khách để mở lại.</p>}
  </section>;
}
