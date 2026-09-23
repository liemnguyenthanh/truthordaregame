'use client';

import { useI18n } from './locale-provider';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  SkipForward,
  LockKeyhole,
  WifiOff,
  Users,
  Pencil,
  UserRound,
} from 'lucide-react';
import { readOwnership, saveOwnership, activeOwnership } from '@/lib/ownership';
import { getAvailableQuestions } from '@/lib/game';
import {
  createGroupGameState,
  drawGroupQuestion,
  groupFingerprint,
  type GroupGameState,
} from '@/lib/group-game';
import { GROUP_STORAGE_KEY, readSavedGroup } from '@/lib/groups';
import { GroupEditor } from './group-editor';
import { AnimatedReveal } from './animated-reveal';
import Image from 'next/image';
import type { Pack, PlayGroup, QuestionSet, QuestionType } from '@/lib/types';
import styles from './game.module.css';

type Progress = GroupGameState & { locale?: string };
type GameProps = {
  pack: Pack;
  initialSet?: QuestionSet;
  fixedGroup?: PlayGroup;
  alternateHref?: string;
};
export function Game({ pack, initialSet, fixedGroup, alternateHref }: GameProps) {
  return (
    <PackGame
      key={`${pack.id}:${pack.contentVersion}:${groupFingerprint(fixedGroup)}`}
      pack={pack}
      initialSet={initialSet}
      fixedGroup={fixedGroup}
      alternateHref={alternateHref}
    />
  );
}
function PackGame({ pack, initialSet, fixedGroup, alternateHref }: GameProps) {
  const { t, path, locale } = useI18n();
  const [set, setSet] = useState<QuestionSet | null>(null);
  const [group, setGroup] = useState<PlayGroup | null>(fixedGroup ?? null);
  const [editingGroup, setEditingGroup] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [unlocked, setUnlocked] = useState(pack.tier === 'free');
  const [error, setError] = useState('');
  const [storageWarning, setStorageWarning] = useState(false);
  const [offline, setOffline] = useState(false);
  const [notice, setNotice] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [showDonate, setShowDonate] = useState(false);
  const lastDraw = useRef(0);
  const accessUntil = useRef(0);
  const stateKey = `tod:game:v1:${pack.id}`;
  useEffect(() => {
    const controller = new AbortController();
    setError('');
    const questionData = initialSet
      ? Promise.resolve(initialSet)
      : fetch(pack.questionFile, { signal: controller.signal }).then((response) => {
          if (!response.ok) throw new Error();
          return response.json();
        });
    questionData
      .then((data: QuestionSet) => {
        if (controller.signal.aborted) return;
        const savedGroup = fixedGroup ?? readSavedGroup();
        setGroup(savedGroup);
        if (!fixedGroup && new URLSearchParams(window.location.search).get('group') === '1')
          setEditingGroup(true);
        let saved: Progress | null = null;
        try {
          saved = JSON.parse(localStorage.getItem(stateKey) || 'null');
        } catch {
          setStorageWarning(true);
        }
        const questionIds = new Set(data.questions.map((question) => question.id));
        const translatedProgress =
          saved &&
          (saved.locale ?? 'vi') !== data.locale &&
          Array.isArray(saved.seenIds) &&
          saved.seenIds.every((id) => questionIds.has(id)) &&
          (!saved.currentId || questionIds.has(saved.currentId));
        const valid =
          saved &&
          saved.packId === data.packId &&
          (saved.contentVersion === data.contentVersion || translatedProgress) &&
          Array.isArray(saved.seenIds) &&
          Array.isArray(saved.trialSeenIds) &&
          (saved.groupFingerprint ?? '') === groupFingerprint(savedGroup) &&
          (!saved.actorId || savedGroup?.players.some((player) => player.id === saved.actorId));
        setProgress(
          valid && saved
            ? { ...saved, contentVersion: data.contentVersion, locale: data.locale }
            : createGroupGameState(
                data,
                savedGroup,
                Array.isArray(saved?.trialSeenIds) ? saved.trialSeenIds : [],
              ),
        );
        setSet(data);
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError(t('Chưa tải được bộ câu hỏi. Kết nối mạng rồi thử lại nhé.'));
      });
    return () => controller.abort();
  }, [pack.questionFile, stateKey, attempt, initialSet, fixedGroup, t]);
  useEffect(() => {
    let active = true;
    let expiryTimer: ReturnType<typeof setTimeout> | undefined;
    const applyOwnership = (value: unknown) => {
      clearTimeout(expiryTimer);
      accessUntil.current = Math.max(
        0,
        ...activeOwnership(value)
          .filter((item) => item.packId === pack.id)
          .map((item) => Date.parse(item.expiresAt)),
      );
      setUnlocked(accessUntil.current > Date.now());
      if (accessUntil.current > Date.now())
        expiryTimer = setTimeout(() => {
          accessUntil.current = 0;
          setUnlocked(false);
        }, accessUntil.current - Date.now());
    };
    const updateNetwork = () => setOffline(!navigator.onLine);
    const sync = async () => {
      updateNetwork();
      if (pack.tier === 'free') return;
      applyOwnership(readOwnership());
      if (!navigator.onLine) return;
      try {
        const response = await fetch('/api/entitlements', { cache: 'no-store' });
        if (!response.ok) {
          if (response.status === 401 && active) {
            applyOwnership([]);
            saveOwnership([]);
          }
          return;
        }
        const data = await response.json();
        if (!active) return;
        applyOwnership(data.purchases);
        try {
          saveOwnership(data.purchases);
        } catch {
          setStorageWarning(true);
        }
      } catch {
        /* Retain the last verified local entitlement while offline. */
      }
    };
    void sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', updateNetwork);
    window.addEventListener('focus', sync);
    return () => {
      active = false;
      clearTimeout(expiryTimer);
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', updateNetwork);
      window.removeEventListener('focus', sync);
    };
  }, [pack.id, pack.tier]);
  function persist(next: Progress) {
    next = { ...next, locale: set?.locale ?? locale };
    setProgress(next);
    try {
      localStorage.setItem(stateKey, JSON.stringify(next));
    } catch {
      setStorageWarning(true);
    }
  }
  function saveGroup(next: PlayGroup | null) {
    setGroup(next);
    setEditingGroup(false);
    try {
      if (next) localStorage.setItem(GROUP_STORAGE_KEY, JSON.stringify(next));
      else localStorage.removeItem(GROUP_STORAGE_KEY);
    } catch {
      setStorageWarning(true);
    }
    if (set) persist(createGroupGameState(set, next, progress?.trialSeenIds ?? []));
    setNotice(
      next
        ? t('Đã bắt đầu ván mới với nhóm {v0}.', { v0: next.name })
        : t('Đã bắt đầu ván mới không chia lượt theo tên.'),
    );
    lastDraw.current = 0;
  }
  function draw(type: QuestionType, skip = false) {
    if (!set || !progress || Date.now() - lastDraw.current < 260) return;
    lastDraw.current = Date.now();
    const canPlay = pack.tier === 'free' || accessUntil.current > Date.now();
    if (!canPlay) setUnlocked(false);
    const result = drawGroupQuestion(set, progress, type, canPlay, group, skip);
    if (result.status === 'actor-exhausted') {
      setNotice(
        t(
          'Thành viên này đã hết câu cùng loại. Chọn Thật hoặc Thách để chuyển sang lượt tiếp theo nhé.',
        ),
      );
      return;
    }
    if (result.status === 'trial-exhausted') {
      setNotice(t('Bạn đã xem hết các câu chơi thử. Hãy chọn Mua ngay để mở khóa bộ này.'));
      return;
    }
    if (result.status === 'type-exhausted') {
      setNotice(
        t('Bạn đã xem hết câu {v0}{v1}. H��y chọn loại còn lại nhé.', {
          v0: type === 'truth' ? t('Thật') : t('Thách'),
          v1: String(unlocked ? '' : t(' chơi thử')),
        }),
      );
      return;
    }
    if (result.status === 'complete') {
      setNotice(t('Đã xem hết bộ này. Xáo trộn để bắt đầu ván mới nhé!'));
      return;
    }
    persist(result.state);
    setNotice('');
  }
  const current = set?.questions.find(
    (question) =>
      question.id === progress?.currentId &&
      (unlocked || set.trialQuestionIds.includes(question.id)),
  );
  const actor = group?.players.find(
    (player) => player.id === (current?.playerId ?? progress?.actorId),
  );
  const nextActor =
    group?.players[
      (group.players.findIndex((player) => player.id === progress?.actorId) + 1) %
        group.players.length
    ];
  const truthSeen =
    set?.questions.filter((q) => q.type === 'truth' && progress?.seenIds.includes(q.id)).length ??
    0;
  const dareSeen =
    set?.questions.filter((q) => q.type === 'dare' && progress?.seenIds.includes(q.id)).length ?? 0;
  const truthRemaining =
    set && progress ? getAvailableQuestions(set, progress, 'truth', unlocked).length : 0;
  const dareRemaining =
    set && progress ? getAvailableQuestions(set, progress, 'dare', unlocked).length : 0;
  const complete = Boolean(set && progress && truthRemaining + dareRemaining === 0);
  const price = new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'vi-VN').format(
    pack.priceHintVnd,
  );
  return (
    <section className={styles.game}>
      <div className={styles.top}>
        <Link
          href={path(fixedGroup ? '/vi/tao-bo-ai' : `/vi/bo-cau-hoi/${pack.slug}`)}
          className={styles.back}
        >
          <ArrowLeft size={18} /> {pack.title}
        </Link>
        <div className={styles.topActions}>
          {!fixedGroup && (
            <button className={styles.donateBtn} onClick={() => setShowDonate(true)}>
              {t('Donate')}
            </button>
          )}
          <span className={styles.badge}>
            {pack.tier === 'free'
              ? t('Miễn phí')
              : unlocked
                ? t('Đã mở khóa')
                : t('Chơi thử 8 câu')}
          </span>
          {!group && !fixedGroup && (
            <button
              className={styles.createGroup}
              disabled={!set}
              onClick={() => setEditingGroup((value) => !value)}
            >
              <Users size={15} /> {t('Tạo nhóm')}{' '}
            </button>
          )}
        </div>
      </div>
      {group && (
        <div className={styles.groupBar}>
          <div>
            <Users size={16} />
            <span>
              <strong>{group.name}</strong>
              <small>
                {group.players.length} {t('thành viên ·')}{' '}
                {group.players.map((player) => player.name).join(', ')}
              </small>
            </span>
          </div>
          {fixedGroup ? (
            <Link href={path('/vi/tao-bo-ai')}>{t('Tạo bộ mới')}</Link>
          ) : (
            <button onClick={() => setEditingGroup((value) => !value)}>
              <Pencil size={14} /> {t('Sửa nhóm')}{' '}
            </button>
          )}
        </div>
      )}
      {editingGroup && !fixedGroup && (
        <div>
          <GroupEditor
            key={groupFingerprint(group)}
            initialGroup={group ?? undefined}
            onSave={saveGroup}
            onCancel={() => setEditingGroup(false)}
          />
          <p className={styles.groupHint}>
            {t('Lưu thay đổi sẽ bắt đầu ván mới. Lượt chơi thử đã dùng vẫn được giữ.')}{' '}
          </p>
          {group && (
            <button className={styles.leaveGroup} onClick={() => saveGroup(null)}>
              {t('Bỏ chia lượt & bắt đầu ván mới')}{' '}
            </button>
          )}
        </div>
      )}
      {offline && (
        <p className={styles.network}>
          <WifiOff size={16} /> {t('Bạn đang chơi offline · thanh toán cần mạng')}{' '}
        </p>
      )}
      {error ? (
        <div className={styles.error} role="alert">
          <p>{error}</p>
          <button
            className="button button-primary"
            onClick={() => setAttempt((value) => value + 1)}
          >
            {t('Thử lại')}{' '}
          </button>
        </div>
      ) : (
        <>
          <AnimatedReveal
            animationKey={current?.id ?? 'ready'}
            className={`${styles.card} ${current?.type === 'dare' ? styles.dareCard : styles.truthCard}`}
            aria-live="polite"
            aria-atomic="true"
          >
            {group && (
              <span className={styles.actor} data-testid="current-actor">
                <UserRound size={14} />{' '}
                {actor
                  ? t('Lượt của {v0}', { v0: actor.name })
                  : t('Bắt đầu với {v0}', { v0: nextActor?.name ?? '' })}
              </span>
            )}
            <span className={styles.cardIndex}>
              {current
                ? t('CÂU {v0}{v1}', {
                    v0: truthSeen + dareSeen < 10 ? '0' : '',
                    v1: String(truthSeen + dareSeen),
                  })
                : t('SẴN SÀNG CHƯA?')}
            </span>
            <div className={styles.cardContent}>
              <div className={styles.cardEmoji}>
                {current ? (current.type === 'truth' ? '☁️' : '💖') : '✨'}
              </div>
              <h2>
                {current
                  ? current.type === 'truth'
                    ? t('Thật')
                    : t('Thách')
                  : t('Một lựa chọn.\nNhiều bất ngờ.')}
              </h2>
              <p key={current?.id}>
                {current?.text ??
                  (set
                    ? t('Chọn Thật để kể một điều chưa ai biết.\nChọn Thách để thử một điều mới.')
                    : t('Đang chuẩn bị cuộc vui…'))}
              </p>
            </div>
          </AnimatedReveal>
          <div className={styles.controls}>
            <p>
              {group && current
                ? fixedGroup
                  ? t('Chọn loại câu để chuyển lượt tiếp theo')
                  : t('Lượt tiếp: {v0} · chọn Thật hay Thách', { v0: nextActor?.name ?? '' })
                : t('Chọn loại câu {v0}', { v0: current ? t('tiếp theo') : t('đầu tiên') })}
            </p>
            <div className={styles.choices}>
              <button
                className={`${styles.choice} ${styles.truth}`}
                disabled={!set || (unlocked && !truthRemaining)}
                onClick={() => draw('truth')}
              >
                <span>☁️</span> {t('Thật')} <ArrowRight size={17} />
              </button>
              <button
                className={`${styles.choice} ${styles.dare}`}
                disabled={!set || (unlocked && !dareRemaining)}
                onClick={() => draw('dare')}
              >
                <span>💖</span> {t('Thách')} <ArrowRight size={17} />
              </button>
            </div>
            <div className={styles.smallActions}>
              <button
                disabled={!current || complete}
                onClick={() => current && draw(current.type, true)}
              >
                <SkipForward size={15} /> {t('Bỏ qua')}{' '}
              </button>
              <button
                disabled={!set}
                onClick={() => {
                  if (set) {
                    persist(createGroupGameState(set, group, progress?.trialSeenIds ?? []));
                    setNotice(t('Đã xáo trộn. Cùng bắt đầu ván mới!'));
                  }
                }}
              >
                <RotateCcw size={15} /> {t('Ván mới')}{' '}
              </button>
            </div>
            {group && (
              <p className={styles.skipHint}>
                {t('Bỏ qua giữ nguyên người chơi · Thật / Thách chuyển lượt.')}{' '}
              </p>
            )}
          </div>
          <div className={styles.progress}>
            <div>
              <span>
                {t('☁️ Thật:')} <b>{truthSeen}</b>
              </span>
              <span>
                {t('💖 Thách:')} <b>{dareSeen}</b>
              </span>
            </div>
            <p>
              {unlocked
                ? t('Đã xem {v0}/{v1} câu', {
                    v0: truthSeen + dareSeen,
                    v1: String(pack.questionCount),
                  })
                : t('Đã thử {v0}/8 câu miễn phí', { v0: progress?.trialSeenIds.length ?? 0 })}
            </p>
            <div className={styles.track}>
              <span
                style={{
                  width: `${Math.min(100, ((truthSeen + dareSeen) / (unlocked ? pack.questionCount : 8)) * 100)}%`,
                }}
              />
            </div>
          </div>
          <p className={styles.status} role="status">
            {notice ||
              (complete && unlocked
                ? t('Bạn đã khám phá hết bộ này. Bấm Ván mới để chơi lại.')
                : '')}
          </p>
          {!unlocked && pack.tier === 'premium' && (
            <div className={styles.premium}>
              <LockKeyhole size={18} />
              <span>
                {t('Mở toàn bộ')} {pack.questionCount} {t('câu · dự kiến')} {price}
                {t('đ')}{' '}
              </span>
              <Link
                href={path(`/vi/thanh-toan?pack=${encodeURIComponent(pack.id)}`)}
                className={styles.buyNow}
              >
                {t('Mua ngay')} <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </>
      )}
      {storageWarning && (
        <p className="notice">
          {t(
            'Trình duyệt chưa cho lưu tiến độ. Bạn vẫn chơi được, nhưng có thể mất ván khi đóng trang.',
          )}{' '}
        </p>
      )}
      {showDonate && (
        <div className={styles.modalOverlay} onClick={() => setShowDonate(false)}>
          <div className={styles.donateModal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeModal} onClick={() => setShowDonate(false)}>
              ✕
            </button>
            <h2>{t('Donate')}</h2>
            <p>{t('Momo nhé cạ nhà !!')}</p>
            <div className={styles.qrCode}>
              <Image src="/donate.png" alt={t('Mã QR donate')} width={240} height={240} priority />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
