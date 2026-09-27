'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  FileJson,
  Link2,
  Play,
  ArrowRight,
  WandSparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useI18n } from './locale-provider';
import {
  CUSTOM_PACK_STORAGE_KEY,
  validateCustomQuestionSet,
  type CustomQuestionSet,
} from '@/lib/custom-pack';
import styles from './custom-import.module.css';

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
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const [source, setSource] = useState<Source>('paste');
  const [values, setValues] = useState({ paste: '', url: '' });
  const value = values[source];
  function updateValue(next: string) {
    setValues((current) => ({ ...current, [source]: next }));
    setSet(null);
    setError('');
  }
  function changeSource(next: Source) {
    setSource(next);
    setSet(null);
    setError('');
  }
  const [set, setSet] = useState<CustomQuestionSet | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const previewRef = useRef<HTMLHeadingElement>(null);
  const inputRef = useRef<HTMLTextAreaElement & HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (set) {
      previewRef.current?.focus();
      window.scrollTo({ top: 0, behavior: 'instant' });
    } else if (editing) {
      inputRef.current?.focus();
    }
  }, [set, editing]);

  async function inspect() {
    setBusy(true);
    setError('');
    setSet(null);
    try {
      let input: unknown;
      if (source === 'url') {
        if (!value.trim()) throw new Error('Hãy nhập link JSON.');
        const response = await fetch(value.trim(), {
          cache: 'no-store',
          signal: AbortSignal.timeout(15000),
        });
        if (!response.ok) throw new Error('Không thể tải link JSON này.');
        input = await response.json();
      } else {
        if (!value.trim()) throw new Error('Hãy dán nội dung JSON.');
        try {
          input = JSON.parse(value);
        } catch {
          throw new Error(
            'Chưa đọc được nội dung. Hãy dán đầy đủ JSON, từ dấu { đầu tiên đến dấu } cuối cùng, hoặc chọn Thử bộ mẫu.',
          );
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
    try {
      await navigator.clipboard.writeText(PROMPT_EXAMPLE);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError('Không thể sao chép tự động. Bạn có thể chọn và sao chép hướng dẫn bên dưới.');
    }
  }

  function play() {
    if (!set) return;
    try {
      localStorage.setItem(CUSTOM_PACK_STORAGE_KEY, JSON.stringify(set));
      router.push(path('/vi/choi/tuy-chinh'));
    } catch {
      setError('Trình duyệt chưa cho phép lưu bộ câu hỏi. Hãy bật lưu trữ và thử lại.');
    }
  }

  const truth = set?.questions.filter((question) => question.type === 'truth').length ?? 0;
  const dare = set?.questions.filter((question) => question.type === 'dare').length ?? 0;
  return (
    <main className={styles.shell}>
      <Link href={path('/vi')} className={styles.back}>
        <ArrowLeft size={17} /> {t('Về thư viện')}
      </Link>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>BỘ CÂU HỎI CỦA BẠN</p>
        <h1>{set ? 'Sẵn sàng chơi!' : 'Câu hỏi riêng. Cuộc vui riêng.'}</h1>
        <p>
          {set
            ? 'Xem qua câu hỏi, rồi rủ mọi người cùng chơi.'
            : 'Dán bộ câu hỏi của bạn để chơi Thật hay Thách.'}
        </p>
      </header>
      {!set && (
        <section className={styles.panel} aria-label="Nhập bộ câu hỏi">
          <div className={styles.sources} role="group" aria-label="Cách nhập bộ câu hỏi">
            <button
              type="button"
              aria-pressed={source === 'paste'}
              disabled={busy}
              onClick={() => changeSource('paste')}
            >
              <FileJson size={17} /> Dán nội dung
            </button>
            <button
              type="button"
              aria-pressed={source === 'url'}
              disabled={busy}
              onClick={() => changeSource('url')}
            >
              <Link2 size={17} /> Nhập bằng link
            </button>
          </div>
          <label className={styles.label} htmlFor="question-input">
            {source === 'paste' ? 'Nội dung bộ câu hỏi' : 'Link bộ câu hỏi'}
          </label>
          {source === 'paste' ? (
            <textarea
              ref={inputRef}
              id="question-input"
              value={value}
              disabled={busy}
              onChange={(event) => updateValue(event.target.value)}
              placeholder="Dán nội dung JSON từ AI hoặc bộ câu hỏi đã lưu…"
              rows={5}
              spellCheck={false}
              autoCapitalize="off"
              className={styles.input}
              aria-describedby="input-help"
              aria-invalid={!!error}
            />
          ) : (
            <input
              ref={inputRef}
              id="question-input"
              type="url"
              value={value}
              disabled={busy}
              onChange={(event) => updateValue(event.target.value)}
              placeholder="https://example.com/questions.json"
              className={styles.input}
              aria-describedby="input-help"
              aria-invalid={!!error}
            />
          )}
          <div className={styles.inputHelp} id="input-help">
            <span>
              {source === 'paste'
                ? 'Định dạng JSON'
                : 'Dùng link công khai chứa JSON, không phải link cuộc trò chuyện AI.'}
            </span>
            {source === 'paste' && (
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  updateValue(
                    JSON.stringify(
                      {
                        title: 'Nhóm bạn thân',
                        description: 'Một vài câu hỏi để cả nhóm khởi động.',
                        questions: [
                          { type: 'truth', text: 'Kỷ niệm nào với nhóm bạn khiến bạn nhớ nhất?' },
                          { type: 'dare', text: 'Hát một đoạn bài hát yêu thích của bạn.' },
                          { type: 'truth', text: 'Điều nhỏ bé nào luôn khiến bạn vui?' },
                          { type: 'dare', text: 'Tạo dáng hài hước để cả nhóm chụp một tấm ảnh.' },
                        ],
                      },
                      null,
                      2,
                    ),
                  )
                }
              >
                Thử bộ mẫu
              </button>
            )}
          </div>
          {error && (
            <div className={styles.error} role="alert">
              {error}
            </div>
          )}
          <button
            type="button"
            className={`button button-primary ${styles.primary}`}
            onClick={inspect}
            disabled={busy || !value.trim()}
          >
            {busy ? 'Đang đọc bộ câu hỏi…' : 'Xem trước'} <ArrowRight size={17} />
          </button>
        </section>
      )}
      {set && (
        <section
          className={`${styles.panel} ${styles.preview}`}
          aria-labelledby="preview-title"
          aria-live="polite"
        >
          <h2 id="preview-title" ref={previewRef} tabIndex={-1}>
            {set.title}
          </h2>
          <p className={styles.intro}>{set.description}</p>
          <div className={styles.counts}>
            <span>{set.questions.length} câu hỏi</span>
            <span>{truth} Thật</span>
            <span>{dare} Thách</span>
          </div>
          <p className={styles.label}>Xem trước {Math.min(3, set.questions.length)} câu đầu tiên</p>
          <ul className={styles.questions}>
            {set.questions.slice(0, 3).map((question) => (
              <li key={question.id}>
                <span data-type={question.type}>
                  {question.type === 'truth' ? 'Thật' : 'Thách'}
                </span>
                <p>{question.text}</p>
              </li>
            ))}
          </ul>
          {error && (
            <div className={styles.error} role="alert">
              {error}
            </div>
          )}
          <button
            type="button"
            className={`button button-primary ${styles.primary}`}
            onClick={play}
          >
            <Play size={17} /> Bắt đầu chơi
          </button>
          <button
            className={styles.edit}
            type="button"
            onClick={() => {
              setSet(null);
              setError('');
              setEditing(true);
            }}
          >
            Chỉnh sửa bộ câu hỏi
          </button>
          <p className={styles.note}>Lưu trên trình duyệt này khi bắt đầu chơi.</p>
        </section>
      )}
      {!set && (
        <details className={styles.help}>
          <summary>
            <WandSparkles size={18} /> Chưa có câu hỏi? Nhờ AI tạo
          </summary>
          <div className={styles.helpBody}>
            <ol>
              <li>Sao chép hướng dẫn bên dưới vào ChatGPT, Claude hoặc AI bạn dùng.</li>
              <li>Điền chủ đề và đối tượng, rồi gửi cho AI.</li>
              <li>Dán phần JSON AI trả về vào ô nhập phía trên.</li>
            </ol>
            <textarea
              className={styles.promptCode}
              value={PROMPT_EXAMPLE}
              readOnly
              aria-label="Hướng dẫn tạo bộ câu hỏi bằng AI"
            />
            <button type="button" className="button button-secondary" onClick={copyPrompt}>
              {copied ? <Check size={16} /> : <Copy size={16} />}{' '}
              {copied ? 'Đã sao chép' : 'Sao chép hướng dẫn'}
            </button>
          </div>
        </details>
      )}
    </main>
  );
}
