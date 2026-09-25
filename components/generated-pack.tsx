'use client';

import { AI_PACK_CREATION_ENABLED } from '@/lib/features';

import { localizedError } from '@/lib/i18n/messages';
import { useI18n } from './locale-provider';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw, Sparkles } from 'lucide-react';
import type { GeneratedPack } from '@/lib/types';
import { Game } from './game';
import { OfflineAiPack } from './pwa';
import styles from './ai-builder.module.css';

export function GeneratedPackView() {
  const params = useSearchParams();
  const id = params.get('id') || '';
  return <GeneratedPackContent key={id} id={id} />;
}
function GeneratedPackContent({ id }: { id: string }) {
  const { t, path, locale } = useI18n();
  const [generation, setGeneration] = useState<GeneratedPack | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [cached, setCached] = useState(false);
  const [storageWarning, setStorageWarning] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id)) {
      setError(t('Đường dẫn bộ câu hỏi không hợp lệ. Chọn bộ trong lịch sử của nhóm nhé.'));
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    let busy = false;
    let finished = false;
    let local: GeneratedPack | null = null;
    try {
      const data = JSON.parse(localStorage.getItem(`tod:generated:v1:${id}`) || 'null');
      if (
        data?.id === id &&
        data.status === 'complete' &&
        data.pack &&
        data.questionSet &&
        data.group
      ) {
        local = data;
        setGeneration(data);
        setCached(true);
        setLoading(false);
      }
    } catch {
      setStorageWarning(true);
    }
    async function check() {
      if (busy || finished || controller.signal.aborted || document.visibilityState === 'hidden')
        return;
      if (!navigator.onLine) {
        setLoading(false);
        if (!local) setError(t('Bộ này chưa được lưu trên thiết bị. Kết nối mạng để tải và chơi.'));
        return;
      }
      busy = true;
      try {
        const response = await fetch(`/api/generations/${encodeURIComponent(id)}`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) {
          if ([400, 401, 403, 404].includes(response.status)) finished = true;
          throw new Error(data.error || t('Chưa tải được bộ câu hỏi. Hãy thử lại.'));
        }
        const next: GeneratedPack = data.generation;
        if (
          next?.id !== id ||
          !['pending', 'complete', 'failed'].includes(next.status) ||
          (next.status === 'complete' && (!next.pack || !next.questionSet || !next.group))
        )
          throw new Error(t('Máy chủ trả về dữ liệu chưa hợp lệ. Hãy thử lại.'));
        if (controller.signal.aborted) return;
        setGeneration(next);
        setCached(false);
        setError('');
        if (next.status !== 'pending') finished = true;
        if (next.status === 'complete' && next.pack && next.questionSet) {
          local = next;
          try {
            localStorage.setItem(`tod:generated:v1:${id}`, JSON.stringify(next));
          } catch {
            setStorageWarning(true);
          }
        }
        try {
          const old = JSON.parse(localStorage.getItem('tod:generated-history:v1') || '[]');
          localStorage.setItem(
            'tod:generated-history:v1',
            JSON.stringify(
              [
                next,
                ...(Array.isArray(old) ? old.filter((item: GeneratedPack) => item.id !== id) : []),
              ].slice(0, 30),
            ),
          );
          const pendingKey = `tod:generation-pending:v1:${next.questionSet?.locale ?? next.locale ?? 'vi'}`;
          if (next.status !== 'pending' && localStorage.getItem(pendingKey) === id)
            localStorage.removeItem(pendingKey);
        } catch {
          setStorageWarning(true);
        }
      } catch (cause) {
        if (!controller.signal.aborted) {
          if (local) {
            setGeneration(local);
            setCached(true);
          } else
            setError(
              cause instanceof Error
                ? localizedError(locale, cause.message)
                : t('Chưa thể kiểm tra bộ câu hỏi.'),
            );
        }
      } finally {
        busy = false;
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void check();
    const timer = window.setInterval(() => void check(), 4000);
    const resume = () => void check();
    window.addEventListener('online', resume);
    window.addEventListener('focus', resume);
    document.addEventListener('visibilitychange', resume);
    return () => {
      controller.abort();
      clearInterval(timer);
      window.removeEventListener('online', resume);
      window.removeEventListener('focus', resume);
      document.removeEventListener('visibilitychange', resume);
    };
  }, [id, attempt, locale, t]);
  if (generation?.status === 'complete' && generation.pack && generation.questionSet)
    return (
      <>
        <p className={styles.cached}>
          {locale === 'en' ? 'Question language: ' : 'Ngôn ngữ câu hỏi: '}
          {generation.questionSet.locale === 'en' ? 'English' : 'Tiếng Việt'}
        </p>
        {cached && (
          <p className={styles.cached}>
            {t(
              'Đang dùng bộ đã lưu trên thiết bị. Tên và câu hỏi của nhóm được giữ riêng trong trình duyệt này.',
            )}{' '}
          </p>
        )}
        <Game
          pack={generation.pack}
          initialSet={generation.questionSet}
          fixedGroup={generation.group}
        />
        {!storageWarning && <OfflineAiPack />}
        <div className={styles.shell}>
          {AI_PACK_CREATION_ENABLED && (
            <Link className={styles.back} href={path('/vi/tao-bo-ai')}>
              <ArrowLeft size={17} /> {t('Những bộ của nhóm')}{' '}
            </Link>
          )}
          {storageWarning && (
            <p className="notice">
              {t('Chưa thể lưu bộ để mở lại khi offline. Bạn vẫn có thể chơi ngay.')}{' '}
            </p>
          )}
        </div>
      </>
    );
  return (
    <section className={styles.shell}>
      {AI_PACK_CREATION_ENABLED && (
        <Link className={styles.back} href={path('/vi/tao-bo-ai')}>
          <ArrowLeft size={17} /> {t('Về nhóm của bạn')}{' '}
        </Link>
      )}
      <div className={`${styles.panel} ${styles.statusPanel}`}>
        <Sparkles
          size={40}
          className={loading || generation?.status === 'pending' ? styles.spinner : undefined}
        />
        {generation?.status === 'failed' ? (
          <>
            <h1>{t('Chưa tạo được bộ lần này')}</h1>
            <p>
              {(generation.error && localizedError(locale, generation.error)) ||
                t(
                  'AI chưa hoàn tất bộ câu hỏi phù hợp. Bạn có thể kiểm tra lại nhóm rồi chủ động tạo yêu cầu mới.',
                )}
            </p>
            {AI_PACK_CREATION_ENABLED && (
              <Link className="button button-primary" href={path('/vi/tao-bo-ai')}>
                {t('Về nhóm và thử lần mới')}{' '}
              </Link>
            )}
            <p>
              {t('Chỉ tạo lại khi bạn bấm nút. Yêu cầu mới có thể tính vào giới hạn trong ngày.')}
            </p>
          </>
        ) : error ? (
          <>
            <h1>{t('Chưa mở được bộ câu hỏi')}</h1>
            <p role="alert">{error}</p>
            <button
              className="button button-secondary"
              onClick={() => {
                setError('');
                setLoading(true);
                setAttempt((value) => value + 1);
              }}
            >
              <RefreshCw size={17} /> {t('Kiểm tra lại')}{' '}
            </button>
          </>
        ) : (
          <>
            <h1>{loading ? t('Đang tìm bộ của nhóm…') : t('AI đang kết nối cả nhóm')}</h1>
            <p role="status">
              {loading
                ? t('Đang kiểm tra bộ câu hỏi trong phiên của bạn.')
                : t(
                    'Câu hỏi đang được viết riêng cho từng thành viên. Trang tự cập nhật khi hoàn tất.',
                  )}
            </p>
            <p>{t('Bạn có thể quay lại trang này từ lịch sử. Không cần tạo thêm yêu cầu.')}</p>
          </>
        )}
      </div>
      <p className={styles.fine}>
        {t(
          'Bộ riêng tư gắn với phiên khách và dữ liệu trình duyệt. Link này không cấp quyền truy cập cho thiết bị khác.',
        )}{' '}
      </p>
    </section>
  );
}
