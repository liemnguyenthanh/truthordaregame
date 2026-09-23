'use client';

import { formatLocale } from '@/lib/i18n';
import { localizedError } from '@/lib/i18n/messages';
import { useI18n } from './locale-provider';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Clock3, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { GroupEditor } from './group-editor';
import type { GeneratedPack, GroupMood, PlayGroup } from '@/lib/types';
import { GROUP_STORAGE_KEY, MOODS, validateGroup } from '@/lib/groups';
import styles from './ai-builder.module.css';

const GROUP_KEY = GROUP_STORAGE_KEY;
const HISTORY_KEY = 'tod:generated-history:v1';
const choices = MOODS.map((mood) => ({ ...mood, title: mood.name }));
async function api(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, cache: 'no-store' });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Chưa thể kết nối. Hãy thử lại.');
  return data;
}
export function AiBuilder() {
  const { t, path, locale } = useI18n();
  const router = useRouter();
  const requestKey = `tod:generation-request:v1:${locale}`;
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
  const [serviceAvailable, setServiceAvailable] = useState(false);
  const [configAttempt, setConfigAttempt] = useState(0);
  const [ready, setReady] = useState(false);
  const request = useRef<{ key: string; body: string } | null>(null);
  const inFlight = useRef(false);
  useEffect(() => {
    let cancelled = false;
    try {
      const saved = JSON.parse(localStorage.getItem(GROUP_KEY) || 'null');
      if (saved) {
        setGroup(validateGroup(saved));
        setEditing(false);
      }
      const savedHistory = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      if (Array.isArray(savedHistory)) setHistory(savedHistory);
      const savedRequest = JSON.parse(localStorage.getItem(requestKey) || 'null');
      if (savedRequest?.key && savedRequest?.body) {
        const pendingInput = JSON.parse(savedRequest.body);
        if (MOODS.some((item) => item.id === pendingInput.mood)) {
          setGroup(validateGroup(pendingInput.group));
          setEditing(false);
          setMood(pendingInput.mood);
          setAdults(pendingInput.adultsConfirmed === true);
          request.current = savedRequest;
        }
      }
    } catch {
      setStorageWarning(true);
    }
    setReady(true);
    void (async () => {
      try {
        await api('/api/session', { method: 'POST' });
        const data = await api('/api/generations');
        if (cancelled) return;
        if (Array.isArray(data.generations)) {
          setHistory(data.generations);
          try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(data.generations));
          } catch {
            setStorageWarning(true);
          }
        }
        if (Number.isInteger(data.limitPerDay)) setLimit(data.limitPerDay);
      } catch {
        /* History is optional; generation reports configuration errors explicitly. */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [locale, requestKey, t]);
  useEffect(() => {
    let cancelled = false;
    setServiceAvailable(false);
    void api('/api/generations/config')
      .then((data) => {
        if (cancelled) return;
        if (Number.isInteger(data.dailyLimit)) setLimit(data.dailyLimit);
        setServiceAvailable(data.available === true);
        setServiceNotice(
          data.available === true ? '' : t('Tính năng AI đang tạm ngừng. Vui lòng thử lại sau.'),
        );
      })
      .catch((cause) => {
        if (!cancelled)
          setServiceNotice(
            cause instanceof Error
              ? localizedError(locale, cause.message)
              : t('Tính năng AI chưa sẵn sàng.'),
          );
      });
    return () => {
      cancelled = true;
    };
  }, [locale, t, configAttempt]);
  function saveGroup(value: PlayGroup) {
    setGroup(value);
    setEditing(false);
    setError('');
    try {
      localStorage.setItem(GROUP_KEY, JSON.stringify(value));
    } catch {
      setStorageWarning(true);
    }
  }
  async function generate() {
    if (!group || !serviceAvailable || inFlight.current || (mood === 'flirty' && !adults)) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    try {
      if (!navigator.onLine) throw new Error(t('Cần kết nối mạng để tạo bộ câu hỏi bằng AI.'));
      const body = JSON.stringify({
        group,
        mood,
        locale,
        adultsConfirmed: mood === 'flirty' && adults,
      });
      if (!request.current || request.current.body !== body)
        request.current = { key: crypto.randomUUID(), body };
      try {
        localStorage.setItem(requestKey, JSON.stringify(request.current));
      } catch {
        setStorageWarning(true);
      }
      const config = await api('/api/generations/config');
      if (!config.available)
        throw new Error(t('Tính năng AI đang tạm ngừng. Vui lòng thử lại sau.'));
      if (Number.isInteger(config.dailyLimit)) setLimit(config.dailyLimit);
      setServiceNotice('');
      await api('/api/session', { method: 'POST' });
      const data = await api('/api/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': request.current.key },
        body,
      });
      const generation: GeneratedPack = data.generation;
      if (!generation?.id)
        throw new Error(t('Máy chủ chưa trả về bộ câu hỏi. Hãy thử lại cùng yêu cầu.'));
      try {
        localStorage.setItem(`tod:generation-pending:v1:${locale}`, generation.id);
        const nextHistory = [
          generation,
          ...history.filter((item) => item.id !== generation.id),
        ].slice(0, 30);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
        if (generation.status === 'complete')
          localStorage.setItem(`tod:generated:v1:${generation.id}`, JSON.stringify(generation));
        // Once addressable, retries use the saved ID rather than making another request.
        localStorage.removeItem(requestKey);
      } catch {
        setStorageWarning(true);
      }
      request.current = null;
      router.push(path(`/vi/bo-ai?id=${encodeURIComponent(generation.id)}`));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? localizedError(locale, cause.message)
          : t('Chưa tạo được bộ câu hỏi. Thử lại sẽ tiếp tục cùng yêu cầu.'),
      );
    } finally {
      setBusy(false);
      inFlight.current = false;
    }
  }
  return (
    <section className={styles.shell}>
      <Link href={path('/vi')} className={styles.back}>
        <ArrowLeft size={17} /> {t('Về thư viện')}{' '}
      </Link>
      <header className={styles.hero}>
        <span className={styles.heroIcon}>
          <Sparkles size={29} />
        </span>
        <p className="eyebrow">{t('CÂU CHUYỆN CỦA RIÊNG NHÓM BẠN')}</p>
        <h1>
          {t('Một nhóm bạn.')} <br />
          <em>{t('Một bộ câu hỏi riêng.')}</em>
        </h1>
        <p>
          {t(
            'Thêm tên, chọn tâm trạng. AI kết nối các thành viên qua những câu Thật và Thách dành riêng cho nhóm.',
          )}{' '}
        </p>
      </header>
      {!ready ? (
        <p role="status" className="notice">
          {t('Đang chuẩn bị nhóm…')}{' '}
        </p>
      ) : (
        <>
          <section className={styles.panel}>
            <div className={styles.step}>
              <span>01</span>
              <h2>{t('Hôm nay có những ai?')}</h2>
            </div>
            {editing ? (
              <GroupEditor
                initialGroup={group ?? undefined}
                onSave={saveGroup}
                onCancel={group ? () => setEditing(false) : undefined}
                submitLabel={t('Lưu nhóm và chọn tâm trạng')}
              />
            ) : (
              group && (
                <div className={styles.group}>
                  <div>
                    <Users size={22} />
                    <h3>{group.name}</h3>
                    <button
                      className={styles.textButton}
                      disabled={busy}
                      onClick={() => setEditing(true)}
                    >
                      {t('Sửa nhóm')}{' '}
                    </button>
                  </div>
                  <ul>
                    {group.players.map((player) => (
                      <li key={player.id}>{player.name}</li>
                    ))}
                  </ul>
                </div>
              )
            )}
          </section>
          <section className={styles.panel}>
            <div className={styles.step}>
              <span>02</span>
              <h2>{t('Chọn tâm trạng cuộc vui')}</h2>
            </div>
            <div className={styles.moods} role="radiogroup" aria-label={t('Tâm trạng của nhóm')}>
              {choices.map((choice) => (
                <label
                  key={choice.id}
                  className={`${styles.mood} ${mood === choice.id ? styles.selected : ''}`}
                >
                  <input
                    type="radio"
                    name="mood"
                    value={choice.id}
                    checked={mood === choice.id}
                    disabled={busy}
                    onChange={() => {
                      setMood(choice.id);
                      setAdults(false);
                    }}
                  />
                  <span className={styles.moodIcon}>{choice.icon}</span>
                  <strong>{t(choice.title)}</strong>
                  <span>{t(choice.description)}</span>
                  {mood === choice.id && <Check size={16} className={styles.selectedCheck} />}
                </label>
              ))}
            </div>
            {mood === 'flirty' && (
              <label className={styles.adults}>
                <input
                  type="checkbox"
                  checked={adults}
                  disabled={busy}
                  onChange={(event) => setAdults(event.target.checked)}
                />
                <span>
                  {t('Tất cả thành viên đều từ 18 tuổi và đồng ý chơi chủ đề thả thính.')}
                </span>
              </label>
            )}
          </section>
          <div className={styles.privacy}>
            <ShieldCheck size={20} />
            <p>
              {t(
                'Tên hoặc biệt danh và tâm trạng của nhóm được gửi đến AI để tạo câu hỏi. Bộ đã tạo được lưu riêng cho thiết bị này qua phiên khách, không đăng vào thư viện công khai. Nên dùng biệt danh và không nhập thông tin nhạy cảm.',
              )}{' '}
            </p>
          </div>
          {serviceNotice && !error && (
            <div className="notice" role="status">
              <p>{serviceNotice}</p>
              <button
                className={styles.textButton}
                type="button"
                onClick={() => setConfigAttempt((value) => value + 1)}
              >
                {t('Kiểm tra lại')}
              </button>
            </div>
          )}
          {limit !== null && (
            <p className={styles.limit}>
              {t('Tạo miễn phí · tối đa')} {limit} {t('bộ mỗi ngày theo cấu hình hiện tại.')}{' '}
            </p>
          )}
          {error && (
            <div role="alert" className={styles.error}>
              {error}
              <p>{t('Thử lại sẽ dùng cùng mã yêu cầu để tránh tạo trùng khi mất kết nối.')}</p>
            </div>
          )}
          <button
            className={`button button-primary ${styles.generate}`}
            disabled={
              busy || !serviceAvailable || !group || editing || (mood === 'flirty' && !adults)
            }
            onClick={() => void generate()}
          >
            <Sparkles size={19} />
            {busy ? t('AI đang viết câu hỏi cho nhóm…') : t('Tạo bộ câu hỏi của nhóm')}
            {!busy && <ArrowRight size={18} />}
          </button>
          {busy && (
            <p className={styles.waiting} role="status">
              {t(
                'Có thể mất khoảng một phút. Bạn không cần bấm lại; yêu cầu đang được xử lý.',
              )}{' '}
            </p>
          )}
          <p className={styles.fine}>
            {t(
              'Luôn có thể bỏ qua câu hỏi. Nội dung AI có thể chưa phù hợp; cả nhóm quyết định điều gì khiến mình thoải mái.',
            )}{' '}
          </p>
        </>
      )}
      {history.length > 0 && (
        <section className={styles.history}>
          <div className={styles.step}>
            <Clock3 size={19} />
            <h2>{t('Những bộ của nhóm')}</h2>
          </div>
          {history.map((item) => (
            <Link href={path(`/vi/bo-ai?id=${encodeURIComponent(item.id)}`)} key={item.id}>
              <span>{item.pack?.icon || '✨'}</span>
              <div>
                <strong>{item.pack?.title || item.group?.name || t('Bộ câu hỏi AI')}</strong>
                <small>
                  {item.status === 'complete'
                    ? t('Sẵn sàng chơi')
                    : item.status === 'failed'
                      ? t('Chưa tạo thành công')
                      : t('Đang tạo')}{' '}
                  · {new Date(item.createdAt).toLocaleDateString(formatLocale(locale))} ·{' '}
                  {(item.questionSet?.locale ?? item.locale ?? 'vi') === 'en'
                    ? 'English'
                    : 'Tiếng Việt'}
                </small>
              </div>
              <ArrowRight size={17} />
            </Link>
          ))}
        </section>
      )}
      {storageWarning && (
        <p className="notice">
          {t(
            'Trình duyệt chưa cho lưu dữ liệu. Bộ đã tạo cần kết nối và phiên khách để mở lại.',
          )}{' '}
        </p>
      )}
    </section>
  );
}
