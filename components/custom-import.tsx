'use client';

import { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  FileJson,
  Link2,
  Play,
  Upload,
  WandSparkles,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useI18n } from './locale-provider';
import {
  customPackFromSet,
  CUSTOM_PACK_STORAGE_KEY,
  validateCustomQuestionSet,
  type CustomQuestionSet,
} from '@/lib/custom-pack';
import styles from './ai-builder.module.css';

type Source = 'paste' | 'url';

const PROMPT_EXAMPLE = `Bạn là người thiết kế bộ câu hỏi cho game Truth or Dare.
Hãy tạo một bộ câu hỏi bằng JSON hợp lệ theo đúng schema sau:

{
  "title": "Tên bộ câu hỏi",
  "description": "Mô tả ngắn",
  "questions": [
    { "type": "truth", "text": "Một câu hỏi thật lòng" },
    { "type": "dare", "text": "Một thử thách vui" }
  ]
}

Yêu cầu:
- Chủ đề: [điền chủ đề của bạn]
- Đối tượng: [ví dụ: bạn thân, cặp đôi, gia đình]
- Tạo 10 câu truth và 10 câu dare.
- type chỉ được là "truth" hoặc "dare".
- Mỗi text là một chuỗi câu hỏi/thử thách bằng tiếng Việt.
- Chỉ trả về JSON, không thêm markdown hay lời giải thích.`;

export function CustomImport() {
  const { path, t } = useI18n();
  const [showPrompt, setShowPrompt] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const [source, setSource] = useState<Source>('paste');
  const [value, setValue] = useState('');
  const [set, setSet] = useState<CustomQuestionSet | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function inspect() {
    setBusy(true);
    setError('');
    setSet(null);
    try {
      let input: unknown;
      if (source === 'url') {
        if (!value.trim()) throw new Error('Hãy nhập link JSON.');
        const response = await fetch(value.trim(), { cache: 'no-store' });
        if (!response.ok) throw new Error('Không thể tải link JSON này.');
        input = await response.json();
      } else {
        if (!value.trim()) throw new Error('Hãy dán nội dung JSON.');
        try {
          input = JSON.parse(value);
        } catch {
          throw new Error('Nội dung chưa phải JSON hợp lệ.');
        }
      }
      setSet(validateCustomQuestionSet(input));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể đọc bộ câu hỏi.');
    } finally {
      setBusy(false);
    }
  }

  async function copyPrompt() {
    await navigator.clipboard.writeText(PROMPT_EXAMPLE);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function play() {
    if (!set) return;
    localStorage.setItem(CUSTOM_PACK_STORAGE_KEY, JSON.stringify(set));
    router.push(path('/vi/choi/tuy-chinh'));
  }

  const truth = set?.questions.filter((question) => question.type === 'truth').length ?? 0;
  const dare = set?.questions.filter((question) => question.type === 'dare').length ?? 0;
  return (
    <main className={styles.shell}>
      <Link href={path('/vi')} className={styles.back}>
        <ArrowLeft size={17} /> {t('Về thư viện')}
      </Link>
      <header className={styles.hero}>
        <span className={styles.heroIcon}>
          <FileJson size={29} />
        </span>
        <p className="eyebrow">BỘ CÂU HỎI CỦA BẠN</p>
        <h1>
          {t('Dán vào,')} <em>{t('chơi ngay.')}</em>
        </h1>
        <p>
          {t(
            'Dùng JSON mẫu hoặc link JSON của bạn. App sẽ kiểm tra dữ liệu trước khi bắt đầu ván chơi.',
          )}
        </p>
      </header>
      <section className={styles.panel}>
        <div className={styles.step}>
          <span>01</span>
          <h2>{t('Nhập bộ câu hỏi')}</h2>
        </div>
        <div className={styles.moods} role="tablist" aria-label="Nguồn dữ liệu">
          <button
            type="button"
            className={`${styles.mood} ${source === 'paste' ? styles.selected : ''}`}
            onClick={() => setSource('paste')}
          >
            <FileJson size={22} />
            <strong>Dán JSON</strong>
            <span>Dán trực tiếp nội dung bộ câu hỏi</span>
          </button>
          <button
            type="button"
            className={`${styles.mood} ${source === 'url' ? styles.selected : ''}`}
            onClick={() => setSource('url')}
          >
            <Link2 size={22} />
            <strong>Link JSON</strong>
            <span>Fetch một URL trả về JSON</span>
          </button>
        </div>
        {source === 'paste' ? (
          <textarea
            aria-label="JSON bộ câu hỏi"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={
              '{\n  "title": "Nhóm bạn thân",\n  "questions": [\n    { "type": "truth", "text": "..." },\n    { "type": "dare", "text": "..." }\n  ]\n}'
            }
            rows={12}
            style={{ width: '100%', marginTop: 18, fontFamily: 'monospace', fontSize: 12 }}
          />
        ) : (
          <label style={{ display: 'block', marginTop: 18 }}>
            URL JSON
            <input
              aria-label="Link JSON"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="https://example.com/questions.json"
              style={{ width: '100%', marginTop: 8 }}
            />
          </label>
        )}
        {source === 'paste' && (
          <div className={styles.promptActions}>
            <button type="button" className={styles.textButton} onClick={() => setShowPrompt(true)}>
              <WandSparkles size={14} /> Dùng prompt mẫu với AI
            </button>
          </div>
        )}
        <button
          type="button"
          className="button button-secondary"
          onClick={inspect}
          disabled={busy}
          style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}
        >
          <Upload size={17} /> {busy ? 'Đang kiểm tra…' : 'Kiểm tra bộ câu hỏi'}
        </button>
        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}
      </section>
      {set && (
        <section className={styles.panel}>
          <div className={styles.step}>
            <span>02</span>
            <h2>{set.title}</h2>
          </div>
          <p>{set.description}</p>
          <p className={styles.fine}>
            {set.questions.length} câu · {truth} Thật · {dare} Thách
          </p>
          <ul>
            {set.questions.slice(0, 3).map((question) => (
              <li key={question.id}>
                {question.type === 'truth' ? 'Thật' : 'Thách'}: {question.text}
              </li>
            ))}
          </ul>
          <button
            type="button"
            className={`button button-primary ${styles.generate}`}
            onClick={play}
          >
            <Play size={17} /> Chơi ngay
          </button>
        </section>
      )}
      {showPrompt && (
        <div
          className={styles.promptModal}
          role="presentation"
          onMouseDown={() => setShowPrompt(false)}
        >
          <section
            className={styles.promptDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="prompt-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className={styles.promptHeader}>
              <div>
                <h2 id="prompt-title">Prompt tạo bộ câu hỏi</h2>
                <p>
                  Dán prompt này vào ChatGPT, Claude hoặc AI bạn đang dùng, rồi copy JSON trả về vào
                  ô nhập.
                </p>
              </div>
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => setShowPrompt(false)}
                aria-label="Đóng"
              >
                <X size={17} />
              </button>
            </div>
            <textarea
              className={styles.promptCode}
              value={PROMPT_EXAMPLE}
              readOnly
              aria-label="Prompt mẫu"
            />
            <div className={styles.promptFooter}>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setShowPrompt(false)}
              >
                Đóng
              </button>
              <button type="button" className="button button-primary" onClick={copyPrompt}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Đã copy' : 'Copy prompt'}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
