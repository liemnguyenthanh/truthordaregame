'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw, SkipForward, LockKeyhole, WifiOff, Users, Pencil, UserRound } from 'lucide-react';
import { getAvailableQuestions } from '@/lib/game';
import { createGroupGameState, drawGroupQuestion, groupFingerprint, type GroupGameState } from '@/lib/group-game';
import { GROUP_STORAGE_KEY, readSavedGroup } from '@/lib/groups';
import { GroupEditor } from './group-editor';
import { AnimatedReveal } from './animated-reveal';
import type { Pack, PlayGroup, QuestionSet, QuestionType } from '@/lib/types';
import styles from './game.module.css';

type Progress = GroupGameState;
type GameProps = { pack: Pack; initialSet?: QuestionSet; fixedGroup?: PlayGroup };
const ownershipKey = 'tod:owned:v1';
function readOwned(): string[] { try { const value = JSON.parse(localStorage.getItem(ownershipKey) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; } }
export function Game({ pack, initialSet, fixedGroup }: GameProps) {
  return <PackGame key={`${pack.id}:${pack.contentVersion}:${groupFingerprint(fixedGroup)}`} pack={pack} initialSet={initialSet} fixedGroup={fixedGroup} />;
}
function PackGame({ pack, initialSet, fixedGroup }: GameProps) {
  const [set, setSet] = useState<QuestionSet | null>(null);
  const [group, setGroup] = useState<PlayGroup | null>(fixedGroup ?? null);
  const [editingGroup, setEditingGroup] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [unlocked, setUnlocked] = useState(pack.tier === 'free');
  const [error, setError] = useState('');
  const [storageWarning, setStorageWarning] = useState(false);
  const [offline, setOffline] = useState(false);
  const [paywall, setPaywall] = useState(false);
  const [notice, setNotice] = useState('');
  const [attempt, setAttempt] = useState(0);
  const lastDraw = useRef(0);
  const paywallHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (paywall && !unlocked) { paywallHeading.current?.focus({ preventScroll: true }); paywallHeading.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' }); } }, [paywall, unlocked]);
  const stateKey = `tod:game:v1:${pack.id}`;
  useEffect(() => {
    const controller = new AbortController();
    setError('');
    const questionData = initialSet ? Promise.resolve(initialSet) : fetch(pack.questionFile, { signal: controller.signal }).then(response => { if (!response.ok) throw new Error(); return response.json(); });
    questionData.then((data: QuestionSet) => {
      if (controller.signal.aborted) return;
      const savedGroup = fixedGroup ?? readSavedGroup();
      setGroup(savedGroup);
      if (!fixedGroup && new URLSearchParams(window.location.search).get('group') === '1') setEditingGroup(true);
      let saved: Progress | null = null;
      try { saved = JSON.parse(localStorage.getItem(stateKey) || 'null'); } catch { setStorageWarning(true); }
      const valid = saved && saved.packId === data.packId && saved.contentVersion === data.contentVersion && Array.isArray(saved.seenIds) && Array.isArray(saved.trialSeenIds) && (saved.groupFingerprint ?? '') === groupFingerprint(savedGroup) && (!saved.actorId || savedGroup?.players.some(player => player.id === saved.actorId));
      setProgress(valid ? saved : createGroupGameState(data, savedGroup, Array.isArray(saved?.trialSeenIds) ? saved.trialSeenIds : [])); setSet(data);
    }).catch(() => { if (!controller.signal.aborted) setError('Chưa tải được bộ câu hỏi. Kết nối mạng rồi thử lại nhé.'); });
    return () => controller.abort();
  }, [pack.questionFile, stateKey, attempt, initialSet, fixedGroup]);
  useEffect(() => {
    let active = true;
    const updateNetwork = () => setOffline(!navigator.onLine);
    const sync = async () => {
      updateNetwork();
      if (pack.tier === 'free') return;
      setUnlocked(readOwned().includes(pack.id));
      if (!navigator.onLine) return;
      try {
        const response = await fetch('/api/entitlements', { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json();
        if (!active) return;
        const owned: string[] = data.packIds ?? data.entitlements?.map((item: { packId: string }) => item.packId) ?? [];
        setUnlocked(owned.includes(pack.id));
        try { localStorage.setItem(ownershipKey, JSON.stringify(owned)); } catch { setStorageWarning(true); }
      } catch { /* Retain the last verified local entitlement while offline. */ }
    };
    void sync();
    window.addEventListener('online', sync); window.addEventListener('offline', updateNetwork); window.addEventListener('focus', sync);
    return () => { active = false; window.removeEventListener('online', sync); window.removeEventListener('offline', updateNetwork); window.removeEventListener('focus', sync); };
  }, [pack.id, pack.tier]);
  function persist(next: Progress) { setProgress(next); try { localStorage.setItem(stateKey, JSON.stringify(next)); } catch { setStorageWarning(true); } }
  function saveGroup(next: PlayGroup | null) {
    setGroup(next); setEditingGroup(false); setPaywall(false);
    try { if (next) localStorage.setItem(GROUP_STORAGE_KEY, JSON.stringify(next)); else localStorage.removeItem(GROUP_STORAGE_KEY); } catch { setStorageWarning(true); }
    if (set) persist(createGroupGameState(set, next, progress?.trialSeenIds ?? []));
    setNotice(next ? `Đã bắt đầu ván mới với nhóm ${next.name}.` : 'Đã bắt đầu ván mới không chia lượt theo tên.');
    lastDraw.current = 0;
  }
  function draw(type: QuestionType, skip = false) {
    if (!set || !progress || Date.now() - lastDraw.current < 260) return;
    lastDraw.current = Date.now();
    const result = drawGroupQuestion(set, progress, type, unlocked, group, skip);
    if (result.status === 'actor-exhausted') { setNotice('Thành viên này đã hết câu cùng loại. Chọn Thật hoặc Thách để chuyển sang lượt tiếp theo nhé.'); return; }
    if (result.status === 'trial-exhausted') { setPaywall(true); setNotice('Bạn đã xem hết các câu chơi thử.'); return; }
    if (result.status === 'type-exhausted') { setNotice(`Bạn đã xem hết câu ${type === 'truth' ? 'Thật' : 'Thách'}${unlocked ? '' : ' chơi thử'}. Hãy chọn loại còn lại nhé.`); return; }
    if (result.status === 'complete') { setNotice('Đã xem hết bộ này. Xáo trộn để bắt đầu ván mới nhé!'); return; }
    persist(result.state); setNotice(''); setPaywall(false);
  }
  const current = set?.questions.find(question => question.id === progress?.currentId);
  const actor = group?.players.find(player => player.id === (current?.playerId ?? progress?.actorId));
  const nextActor = group?.players[((group.players.findIndex(player => player.id === progress?.actorId)) + 1) % group.players.length];
  const truthSeen = set?.questions.filter(q => q.type === 'truth' && progress?.seenIds.includes(q.id)).length ?? 0;
  const dareSeen = set?.questions.filter(q => q.type === 'dare' && progress?.seenIds.includes(q.id)).length ?? 0;
  const truthRemaining = set && progress ? getAvailableQuestions(set, progress, 'truth', unlocked).length : 0;
  const dareRemaining = set && progress ? getAvailableQuestions(set, progress, 'dare', unlocked).length : 0;
  const complete = Boolean(set && progress && truthRemaining + dareRemaining === 0);
  const price = new Intl.NumberFormat('vi-VN').format(pack.priceHintVnd);
  return <section className={styles.game}>
    <div className={styles.top}><Link href={fixedGroup ? '/vi/tao-bo-ai' : `/vi/bo-cau-hoi/${pack.slug}`} className={styles.back}><ArrowLeft size={18} /> {pack.title}</Link><div className={styles.topActions}><span className={styles.badge}>{pack.tier === 'free' ? 'Miễn phí' : unlocked ? 'Đã mở khóa' : 'Chơi thử 8 câu'}</span>{!group && !fixedGroup && <button className={styles.createGroup} disabled={!set} onClick={() => setEditingGroup(value => !value)}><Users size={15} /> Tạo nhóm</button>}</div></div>
    <div className={styles.heading}><h1>{pack.title}</h1></div>
    {group && <div className={styles.groupBar}><div><Users size={16} /><span><strong>{group.name}</strong><small>{group.players.length} thành viên · {group.players.map(player => player.name).join(', ')}</small></span></div>{fixedGroup ? <Link href="/vi/tao-bo-ai">Tạo bộ mới</Link> : <button onClick={() => setEditingGroup(value => !value)}><Pencil size={14} /> Sửa nhóm</button>}</div>}
    {editingGroup && !fixedGroup && <div><GroupEditor key={groupFingerprint(group)} initialGroup={group ?? undefined} onSave={saveGroup} onCancel={() => setEditingGroup(false)} /><p className={styles.groupHint}>Lưu thay đổi sẽ bắt đầu ván mới. Lượt chơi thử đã dùng vẫn được giữ.</p>{group && <button className={styles.leaveGroup} onClick={() => saveGroup(null)}>Bỏ chia lượt & bắt đầu ván mới</button>}</div>}
    {offline && <p className={styles.network}><WifiOff size={16} /> Bạn đang chơi offline · thanh toán cần mạng</p>}
    {error ? <div className={styles.error} role="alert"><p>{error}</p><button className="button button-primary" onClick={() => setAttempt(value => value + 1)}>Thử lại</button></div> : <>
      <AnimatedReveal animationKey={current?.id ?? 'ready'} className={`${styles.card} ${current?.type === 'dare' ? styles.dareCard : styles.truthCard}`} aria-live="polite" aria-atomic="true">
        {group && <span className={styles.actor} data-testid="current-actor"><UserRound size={14} /> {actor ? `Lượt của ${actor.name}` : `Bắt đầu với ${nextActor?.name}`}</span>}
        <span className={styles.cardIndex}>{current ? `CÂU ${truthSeen + dareSeen < 10 ? '0' : ''}${truthSeen + dareSeen}` : 'SẴN SÀNG CHƯA?'}</span>
        <div className={styles.cardContent}><div className={styles.cardEmoji}>{current ? current.type === 'truth' ? '☁️' : '💖' : '✨'}</div><h2>{current ? current.type === 'truth' ? 'Thật' : 'Thách' : 'Một lựa chọn.\nNhiều bất ngờ.'}</h2><p key={current?.id}>{current?.text ?? (set ? 'Chọn Thật để kể một điều chưa ai biết.\nChọn Thách để thử một điều mới.' : 'Đang chuẩn bị cuộc vui…')}</p></div>
      </AnimatedReveal>
      <div className={styles.controls}><p>{group && current ? (fixedGroup ? 'Chọn loại câu để chuyển lượt tiếp theo' : `Lượt tiếp: ${nextActor?.name} · chọn Thật hay Thách`) : `Chọn loại câu ${current ? 'tiếp theo' : 'đầu tiên'}`}</p><div className={styles.choices}>
        <button className={`${styles.choice} ${styles.truth}`} disabled={!set || (unlocked && !truthRemaining)} onClick={() => draw('truth')}><span>☁️</span> Thật <ArrowRight size={17} /></button>
        <button className={`${styles.choice} ${styles.dare}`} disabled={!set || (unlocked && !dareRemaining)} onClick={() => draw('dare')}><span>💖</span> Thách <ArrowRight size={17} /></button>
      </div><div className={styles.smallActions}><button disabled={!current || complete} onClick={() => current && draw(current.type, true)}><SkipForward size={15} /> Bỏ qua</button><button disabled={!set} onClick={() => { if (set) { persist(createGroupGameState(set, group, progress?.trialSeenIds ?? [])); setPaywall(false); setNotice('Đã xáo trộn. Cùng bắt đầu ván mới!'); } }}><RotateCcw size={15} /> Ván mới</button></div>{group && <p className={styles.skipHint}>Bỏ qua giữ nguyên người chơi · Thật / Thách chuyển lượt.</p>}</div>
      <div className={styles.progress}><div><span>☁️ Thật: <b>{truthSeen}</b></span><span>💖 Thách: <b>{dareSeen}</b></span></div><p>{unlocked ? `Đã xem ${truthSeen + dareSeen}/${pack.questionCount} câu` : `Đã thử ${progress?.trialSeenIds.length ?? 0}/8 câu miễn phí`}</p><div className={styles.track}><span style={{ width: `${Math.min(100, (truthSeen + dareSeen) / (unlocked ? pack.questionCount : 8) * 100)}%` }} /></div></div>
      <p className={styles.status} role="status">{notice || (complete && unlocked ? 'Bạn đã khám phá hết bộ này. Bấm Ván mới để chơi lại.' : '')}</p>
      {!unlocked && pack.tier === 'premium' && <div className={styles.premium}><LockKeyhole size={18} /><span>Mở toàn bộ {pack.questionCount} câu · dự kiến {price}đ</span><button onClick={() => setPaywall(true)}>Xem thêm <ArrowRight size={14} /></button></div>}
      {paywall && !unlocked && <aside className={styles.paywall} aria-label="Mở khóa bộ câu hỏi"><button className={styles.dismiss} onClick={() => setPaywall(false)} aria-label="Đóng thông tin mở khóa">×</button><span className="eyebrow">CUỘC VUI VẪN CÒN PHÍA TRƯỚC</span><h2 ref={paywallHeading} tabIndex={-1}>Mở khóa {pack.title}</h2><p>Toàn bộ {pack.questionCount} câu. Thanh toán một lần, chơi lại không giới hạn. Giữ mã khôi phục để đổi điện thoại.</p><Link className="button button-primary" href={`/vi/thanh-toan?pack=${encodeURIComponent(pack.id)}`}>Mở khóa · dự kiến {price}đ <ArrowRight size={18} /></Link><p className={styles.fine}>Giá chính thức được xác nhận ở bước thanh toán.</p><div className={styles.links}><Link href="/vi/danh-muc">Chọn bộ khác</Link><Link href="/vi/khoi-phuc">Đã mua? Khôi phục</Link></div></aside>}
    </>}
    {storageWarning && <p className="notice">Trình duyệt chưa cho lưu tiến độ. Bạn vẫn chơi được, nhưng có thể mất ván khi đóng trang.</p>}
  </section>;
}
