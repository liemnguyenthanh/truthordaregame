'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Game } from './game';
import { useI18n } from './locale-provider';
import {
  CUSTOM_PACK_STORAGE_KEY,
  customPackFromSet,
  validateCustomQuestionSet,
  type CustomQuestionSet,
} from '@/lib/custom-pack';

export function CustomPackGame() {
  const { path, t } = useI18n();
  const router = useRouter();
  const [set, setSet] = useState<CustomQuestionSet | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_PACK_STORAGE_KEY);
      if (!saved) throw new Error('Chưa có bộ câu hỏi tùy chỉnh.');
      setSet(validateCustomQuestionSet(JSON.parse(saved)));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể mở bộ câu hỏi.');
    }
  }, []);
  if (error)
    return (
      <section style={{ maxWidth: 600, margin: '80px auto', padding: 24 }}>
        <h1>{t('Không thể mở bộ câu hỏi')}</h1>
        <p role="alert">{error}</p>
        <button className="button button-primary" onClick={() => router.push(path('/vi/nhap-bo'))}>
          {t('Nhập lại bộ câu hỏi')}
        </button>
      </section>
    );
  if (!set)
    return (
      <p role="status" style={{ textAlign: 'center', padding: 80 }}>
        {t('Đang mở bộ câu hỏi…')}
      </p>
    );
  return <Game pack={customPackFromSet(set)} initialSet={set} />;
}
