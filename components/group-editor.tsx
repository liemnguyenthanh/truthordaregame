'use client';

import { localizedError } from '@/lib/i18n/messages';
import { useI18n } from './locale-provider';

import { useState, type FormEvent } from 'react';
import { Plus, Users, X } from 'lucide-react';
import { createGroup, validateGroup } from '@/lib/groups';
import type { PlayGroup } from '@/lib/types';
import styles from './group-editor.module.css';

type Props = {
  initialGroup?: PlayGroup;
  onSave: (group: PlayGroup) => void;
  onCancel?: () => void;
  submitLabel?: string;
};
export function GroupEditor({
  initialGroup,
  onSave,
  onCancel,
  submitLabel = 'Lưu nhóm & bắt đầu ván mới',
}: Props) {
  const { t, locale } = useI18n();
  const [name, setName] = useState(initialGroup?.name ?? t('Hội bạn thân'));
  const [players, setPlayers] = useState(
    initialGroup?.players.map((player) => ({ ...player })) ?? [
      { id: 'first', name: '' },
      { id: 'second', name: '' },
    ],
  );
  const [error, setError] = useState('');
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    try {
      const group = initialGroup
        ? validateGroup({ id: initialGroup.id, name, players })
        : createGroup(
            name,
            players.map((player) => player.name),
          );
      onSave(group);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? localizedError(locale, cause.message)
          : t('Kiểm tra lại thông tin nhóm nhé.'),
      );
    }
  }
  return (
    <form className={styles.editor} onSubmit={submit} aria-label={t('Thông tin nhóm chơi')}>
      <div className={styles.header}>
        <Users size={19} />
        <h2>{initialGroup ? t('Chỉnh sửa nhóm') : t('Ai cùng chơi hôm nay?')}</h2>
      </div>
      <label className={styles.label} htmlFor="group-name">
        {t('Tên nhóm')}{' '}
      </label>
      <input
        id="group-name"
        className={styles.input}
        value={name}
        onChange={(event) => setName(event.target.value)}
        required
        maxLength={50}
        autoComplete="off"
      />
      <div className={styles.players}>
        {players.map((player, index) => (
          <div className={styles.player} key={player.id}>
            <span className={styles.number} aria-hidden="true">
              {index + 1}
            </span>
            <div>
              <label className={styles.visuallyHidden} htmlFor={`player-${player.id}`}>
                {t('Thành viên')} {index + 1}
              </label>
              <input
                id={`player-${player.id}`}
                className={styles.input}
                value={player.name}
                onChange={(event) =>
                  setPlayers((current) =>
                    current.map((item) =>
                      item.id === player.id ? { ...item, name: event.target.value } : item,
                    ),
                  )
                }
                required
                maxLength={30}
                placeholder={
                  index === 0
                    ? t('Ví dụ: Minh')
                    : index === 1
                      ? t('Ví dụ: Linh')
                      : t('Tên hoặc biệt danh')
                }
                autoComplete="off"
              />
            </div>
            <button
              className={styles.remove}
              type="button"
              disabled={players.length <= 2}
              onClick={() =>
                setPlayers((current) => current.filter((item) => item.id !== player.id))
              }
              aria-label={t('Xóa thành viên {v0}', { v0: index + 1 })}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
      <button
        className={styles.add}
        type="button"
        disabled={players.length >= 8}
        onClick={() => setPlayers((current) => [...current, { id: crypto.randomUUID(), name: '' }])}
      >
        <Plus size={17} /> {players.length >= 8 ? t('Đã đủ 8 thành viên') : t('Thêm thành viên')}
      </button>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <div className={styles.actions}>
        <button className="button button-primary" type="submit">
          {t(submitLabel)}
        </button>
        {onCancel && (
          <button className="button button-secondary" type="button" onClick={onCancel}>
            {t('Hủy')}{' '}
          </button>
        )}
      </div>
    </form>
  );
}
