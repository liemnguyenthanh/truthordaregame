'use client';
import { useEffect, useRef, useState } from 'react';
import type { Locale } from '@/lib/i18n';
import { useRouter } from 'next/navigation';
import type { Pack, Question } from '@/lib/types';
import type { ContentRecord } from '@/lib/admin/validation';
import { parseQuestions } from '@/lib/admin/validation';
import { Plus, LogOut, Upload, Save, ArrowLeft, Trash2, LockKeyhole } from 'lucide-react';
type AdminRecord = ContentRecord & { source_revision?: string; untranslated?: boolean };
type Draft = Omit<
  Pack,
  | 'questionFile'
  | 'contentVersion'
  | 'questionCount'
  | 'truthCount'
  | 'dareCount'
  | 'trialCount'
  | 'productId'
> & { questions: Question[]; expected: string | null; sourceRevision?: string };
function empty(): Draft {
  return {
    id: '',
    slug: '',
    title: '',
    description: '',
    tier: 'free',
    priceHintVnd: 0,
    ageLabel: '16+',
    playerRange: { min: 2, max: 8 },
    published: false,
    icon: '🎉',
    color: 'purple',
    categoryIds: ['friends'],
    questions: [],
    expected: null,
  };
}
async function request(url: string, method = 'GET', body?: unknown) {
  const response = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Không thể kết nối.');
  return data;
}
export function AdminPanel({ authenticated }: { authenticated: boolean }) {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>('vi');
  const refreshId = useRef(0);
  const [password, setPassword] = useState(''),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState('');
  const [records, setRecords] = useState<AdminRecord[]>([]),
    [draft, setDraft] = useState<Draft | null>(null),
    [dirty, setDirty] = useState(false),
    [loading, setLoading] = useState(authenticated);
  const [json, setJson] = useState(''),
    [showImport, setShowImport] = useState(false);
  const patch = (value: Partial<Draft>) => {
    setDraft((d) => (d ? { ...d, ...value } : d));
    setDirty(true);
    setMessage('');
  };
  async function refresh() {
    const requestId = ++refreshId.current;
    setLoading(true);
    try {
      const translated = (await request(`/api/admin/packs?locale=${locale}`))
        .packs as AdminRecord[];
      const source =
        locale === 'en'
          ? ((await request('/api/admin/packs?locale=vi')).packs as ContentRecord[])
          : [];
      if (requestId !== refreshId.current) return;
      setRecords(
        locale === 'vi'
          ? translated
          : source.map((record) => {
              const translation = translated.find(
                (item) => item.metadata.id === record.metadata.id,
              );
              return translation
                ? { ...translation, source_revision: record.revision }
                : {
                    ...record,
                    metadata: { ...record.metadata, published: false },
                    source_revision: record.revision,
                    untranslated: true,
                  };
            }),
      );
      setError('');
    } catch (e) {
      if (requestId === refreshId.current) setError((e as Error).message);
    } finally {
      if (requestId === refreshId.current) setLoading(false);
    }
  }
  useEffect(() => {
    if (authenticated) void refresh();
    return () => {
      refreshId.current += 1;
    };
  }, [authenticated, locale]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  function open(record?: AdminRecord) {
    if (dirty && !confirm('Bỏ các thay đổi chưa lưu?')) return;
    setDraft(
      record
        ? {
            ...record.metadata,
            questions: record.question_set.questions,
            expected: record.untranslated ? null : record.revision,
            sourceRevision: record.source_revision,
          }
        : empty(),
    );
    setDirty(false);
    setMessage('');
    setError('');
    setShowImport(false);
    setJson('');
  }
  async function save() {
    if (!draft) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const data = await request('/api/admin/packs', 'POST', { ...draft, locale });
      const r = data.record as AdminRecord;
      setDraft({
        ...r.metadata,
        questions: r.question_set.questions,
        expected: r.revision,
        sourceRevision: r.source_revision ?? draft.sourceRevision,
      });
      setDirty(false);
      setRecords((old) => [r, ...old.filter((x) => x.metadata.id !== r.metadata.id)]);
      setMessage(
        r.metadata.published
          ? 'Đã xuất bản. Bộ câu hỏi đã có trên website.'
          : 'Đã lưu nháp. Bộ này đang ẩn khỏi website.',
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function importJson(raw: string) {
    try {
      const questions = parseQuestions(JSON.parse(raw));
      if (draft?.questions.length && !confirm('Thay toàn bộ câu hỏi hiện tại bằng nội dung nhập?'))
        return;
      patch({ questions });
      setShowImport(false);
      setError('');
      setMessage(`Đã nhập ${questions.length} câu. Bấm Lưu bộ để lưu vào Supabase.`);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  if (!authenticated)
    return (
      <main id="main" className="admin-login">
        <a href="/vi" className="back-link">
          ← Về trò chơi
        </a>
        <div className="admin-lock">
          <LockKeyhole />
        </div>
        <span className="eyebrow">KHÔNG GIAN QUẢN TRỊ</span>
        <h1>Chào bạn trở lại.</h1>
        <p>Đăng nhập để chăm chút những bộ câu hỏi và tạo thêm cuộc vui.</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError('');
            try {
              await request('/api/admin/session', 'POST', { password });
              setPassword('');
              router.refresh();
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Mật khẩu quản trị
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && (
            <p role="alert" className="admin-error">
              {error}
            </p>
          )}
          <button className="button button-primary" disabled={busy}>
            {busy ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </button>
        </form>
        <small>Phiên đăng nhập có hiệu lực trong 8 giờ.</small>
      </main>
    );
  return (
    <main id="main" className="admin-page">
      <header className="admin-header">
        <div>
          <a className="back-link" href="/vi">
            ← Về trò chơi
          </a>
          <span className="eyebrow">THẬT HAY THÁCH / QUẢN TRỊ</span>
          <h1>Bộ câu hỏi</h1>
          <p>Từ một ý tưởng nhỏ, đến một cuộc vui mới.</p>
        </div>
        <button
          className="button button-secondary"
          disabled={busy}
          onClick={async () => {
            if (dirty && !confirm('Đăng xuất và bỏ các thay đổi chưa lưu?')) return;
            setBusy(true);
            try {
              await request('/api/admin/session', 'DELETE');
              setDraft(null);
              setRecords([]);
              setDirty(false);
              router.refresh();
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <LogOut size={16} />
          Đăng xuất
        </button>
      </header>
      <label className="admin-toolbar">
        Ngôn ngữ nội dung
        <select
          aria-label="Ngôn ngữ nội dung"
          value={locale}
          disabled={busy}
          onChange={(event) => {
            if (dirty && !confirm('Bỏ các thay đổi chưa lưu để đổi ngôn ngữ?')) return;
            setLocale(event.target.value as Locale);
            setDraft(null);
            setDirty(false);
            setRecords([]);
            setMessage('');
            setError('');
          }}
        >
          <option value="vi">Tiếng Việt — bản gốc</option>
          <option value="en">English — bản dịch</option>
        </select>
      </label>
      {locale === 'en' && (
        <p className="admin-hint">
          Chọn một bộ tiếng Việt để tạo bản dịch. Dịch tên, mô tả và nội dung; giữ nguyên mã, loại
          câu hỏi, thứ tự câu và quyền mua. Chỉ xuất bản sau khi duyệt bản dịch.
        </p>
      )}
      {error && (
        <p role="alert" className="admin-error">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="admin-success">
          {message}
        </p>
      )}
      {!draft ? (
        <>
          <div className="admin-toolbar">
            <span>
              {records.length} bộ · {records.filter((r) => r.metadata.published).length} đang xuất
              bản
            </span>
            <button
              className="button button-primary"
              disabled={locale === 'en'}
              onClick={() => open()}
            >
              <Plus size={18} />
              Tạo bộ mới
            </button>
          </div>
          {loading ? (
            <p>Đang tải các bộ câu hỏi…</p>
          ) : (
            <div className="admin-list">
              {records.map((r) => (
                <button className="admin-pack" key={r.metadata.id} onClick={() => open(r)}>
                  <span className={`admin-pack-icon ${r.metadata.color}`}>{r.metadata.icon}</span>
                  <span>
                    <strong>{r.metadata.title}</strong>
                    <small>
                      {r.metadata.questionCount} câu ·{' '}
                      {r.metadata.tier === 'free'
                        ? 'Miễn phí'
                        : r.metadata.priceHintVnd.toLocaleString('vi-VN') + ' ₫'}
                    </small>
                  </span>
                  <span className={r.metadata.published ? 'admin-badge live' : 'admin-badge'}>
                    {r.untranslated
                      ? 'Chưa dịch — tạo bản dịch'
                      : r.metadata.published
                        ? 'Đã xuất bản'
                        : 'Bản nháp'}
                  </span>
                  <span aria-hidden>→</span>
                </button>
              ))}
              {!records.length && !error && (
                <div className="admin-empty">Chưa có bộ câu hỏi. Tạo bộ đầu tiên của bạn.</div>
              )}
            </div>
          )}
          <button className="text-link" disabled={loading} onClick={() => void refresh()}>
            Tải lại danh sách
          </button>
        </>
      ) : (
        <>
          <div className="admin-toolbar">
            <button
              className="button button-secondary"
              disabled={busy}
              onClick={() => {
                if (!dirty || confirm('Bỏ các thay đổi chưa lưu?')) {
                  setDraft(null);
                  setDirty(false);
                  setError('');
                  setMessage('');
                }
              }}
            >
              <ArrowLeft size={16} />
              Danh sách
            </button>
            <span>{dirty ? 'Có thay đổi chưa lưu' : draft.expected ? 'Đã lưu' : 'Bộ mới'}</span>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <fieldset disabled={busy} className="admin-fields">
              <div className="admin-editor">
                <section className="admin-card">
                  <h2>Thông tin bộ</h2>
                  <label>
                    Tên bộ
                    <input
                      required
                      maxLength={120}
                      value={draft.title}
                      onChange={(e) => patch({ title: e.target.value })}
                      placeholder="Một tối cùng hội bạn"
                    />
                  </label>
                  <div className="admin-two">
                    <label>
                      Mã bộ
                      <input
                        required
                        disabled={locale === 'en' || !!draft.expected}
                        pattern="[a-z0-9]+(-[a-z0-9]+)*"
                        maxLength={80}
                        value={draft.id}
                        onChange={(e) =>
                          patch({
                            id: e.target.value,
                            ...(!draft.expected ? { slug: e.target.value } : {}),
                          })
                        }
                        placeholder="mot-toi-cung-ban"
                      />
                    </label>
                    <label>
                      Đường dẫn
                      <input
                        required
                        disabled={locale === 'en' || !!draft.expected}
                        pattern="[a-z0-9]+(-[a-z0-9]+)*"
                        maxLength={80}
                        value={draft.slug}
                        onChange={(e) => patch({ slug: e.target.value })}
                      />
                    </label>
                  </div>
                  <small>
                    Mã bộ và đường dẫn giữ nguyên sau lần lưu đầu để bảo toàn liên kết và quyền mua.
                  </small>
                  <label>
                    Mô tả
                    <textarea
                      required
                      maxLength={1000}
                      rows={3}
                      value={draft.description}
                      onChange={(e) => patch({ description: e.target.value })}
                      placeholder="Bộ này dành cho ai, mang lại điều gì?"
                    />
                  </label>
                  <div className="admin-two">
                    <label>
                      Biểu tượng
                      <input
                        required
                        maxLength={16}
                        disabled={locale === 'en'}
                        value={draft.icon}
                        onChange={(e) => patch({ icon: e.target.value })}
                      />
                    </label>
                    <label>
                      Màu sắc
                      <select
                        disabled={locale === 'en'}
                        value={draft.color}
                        onChange={(e) => patch({ color: e.target.value as Pack['color'] })}
                      >
                        <option value="purple">Tím</option>
                        <option value="pink">Hồng</option>
                        <option value="orange">Cam</option>
                      </select>
                    </label>
                  </div>
                  <div className="admin-two">
                    <label>
                      Loại bộ
                      <select
                        disabled={locale === 'en'}
                        value={draft.tier}
                        onChange={(e) =>
                          patch({
                            tier: e.target.value as Pack['tier'],
                            priceHintVnd: e.target.value === 'free' ? 0 : 30000,
                          })
                        }
                      >
                        <option value="free">Miễn phí</option>
                        <option value="premium">Trả phí</option>
                      </select>
                    </label>
                    {draft.tier === 'premium' && (
                      <label>
                        Giá bán (VND)
                        <input
                          type="number"
                          min={1000}
                          max={100000000}
                          step={1}
                          required
                          disabled={locale === 'en'}
                          value={draft.priceHintVnd}
                          onChange={(e) => patch({ priceHintVnd: Number(e.target.value) })}
                        />
                      </label>
                    )}
                  </div>
                  <div className="admin-two">
                    <label>
                      Ít nhất (người)
                      <input
                        type="number"
                        min={2}
                        max={100}
                        disabled={locale === 'en'}
                        value={draft.playerRange.min}
                        onChange={(e) =>
                          patch({
                            playerRange: { ...draft.playerRange, min: Number(e.target.value) },
                          })
                        }
                      />
                    </label>
                    <label>
                      Nhiều nhất (người)
                      <input
                        type="number"
                        min={draft.playerRange.min}
                        max={100}
                        disabled={locale === 'en'}
                        value={draft.playerRange.max}
                        onChange={(e) =>
                          patch({
                            playerRange: { ...draft.playerRange, max: Number(e.target.value) },
                          })
                        }
                      />
                    </label>
                  </div>
                  <label>
                    Độ tuổi
                    <select
                      disabled={locale === 'en'}
                      value={draft.ageLabel}
                      onChange={(e) => patch({ ageLabel: e.target.value })}
                    >
                      <option>16+</option>
                      <option>18+</option>
                    </select>
                  </label>
                  <div className="admin-categories">
                    <span>Danh mục</span>
                    {[
                      { id: 'friends', name: 'Bạn bè' },
                      { id: 'couples', name: 'Cặp đôi' },
                    ].map((c) => (
                      <label key={c.id} className="admin-check">
                        <input
                          type="checkbox"
                          disabled={locale === 'en'}
                          checked={draft.categoryIds.includes(c.id)}
                          onChange={(e) =>
                            patch({
                              categoryIds: e.target.checked
                                ? [...draft.categoryIds, c.id]
                                : draft.categoryIds.filter((id) => id !== c.id),
                            })
                          }
                        />
                        {c.name}
                      </label>
                    ))}
                  </div>
                  <label>
                    Trạng thái
                    <select
                      value={draft.published ? 'published' : 'draft'}
                      onChange={(e) => patch({ published: e.target.value === 'published' })}
                    >
                      <option value="draft">Bản nháp — ẩn khỏi website</option>
                      <option value="published">Xuất bản — hiển thị trên website</option>
                    </select>
                  </label>
                  <small>
                    Lưu bản nháp sẽ ẩn bộ khỏi website và dừng bán. Bản đã tải offline vẫn còn trên
                    thiết bị.
                  </small>
                </section>
                <section className="admin-card admin-questions">
                  <div className="admin-toolbar">
                    <div>
                      <h2>Nội dung câu hỏi</h2>
                      <small>
                        {draft.questions.filter((q) => q.type === 'truth').length} Thật ·{' '}
                        {draft.questions.filter((q) => q.type === 'dare').length} Thách
                      </small>
                    </div>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => setShowImport(!showImport)}
                    >
                      <Upload size={16} />
                      Nhập JSON
                    </button>
                  </div>
                  {draft.tier === 'premium' && (
                    <p className="admin-hint">
                      4 câu Thật và 4 câu Thách đầu tiên là câu chơi thử. Cần ít nhất 5 câu mỗi
                      loại.
                    </p>
                  )}
                  {showImport && (
                    <div className="admin-import">
                      <label>
                        Chọn file JSON
                        <input
                          type="file"
                          accept=".json,application/json"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 2000000) {
                              setError('File vượt quá 2 MB.');
                              return;
                            }
                            try {
                              importJson(await file.text());
                            } catch {
                              setError('Không đọc được file.');
                            }
                            e.target.value = '';
                          }}
                        />
                      </label>
                      <label>
                        Hoặc dán JSON
                        <textarea
                          rows={7}
                          value={json}
                          onChange={(e) => setJson(e.target.value)}
                          placeholder={
                            '{"questions":[{"type":"truth","text":"Điều gì làm bạn vui?"},{"type":"dare","text":"Hát một câu!"}]}'
                          }
                        />
                      </label>
                      <small>
                        {locale === 'en'
                          ? 'Bản dịch phải giữ nguyên ID, loại và thứ tự câu hỏi của bản gốc. JSON chỉ thay nội dung text.'
                          : 'Nhận file bộ cũ có trường questions hoặc mảng câu hỏi. Nếu chưa có ID, hệ thống tự tạo.'}
                      </small>
                      <button
                        type="button"
                        className="button button-secondary"
                        onClick={() => importJson(json)}
                      >
                        Áp dụng JSON
                      </button>
                    </div>
                  )}
                  <div className="admin-question-list">
                    {draft.questions.map((q, i) => (
                      <div className="admin-question" key={q.id}>
                        <div className="admin-question-heading">
                          <span>Câu {i + 1}</span>
                          <select
                            aria-label={`Loại câu ${i + 1}`}
                            disabled={locale === 'en'}
                            value={q.type}
                            onChange={(e) =>
                              patch({
                                questions: draft.questions.map((x, j) =>
                                  j === i ? { ...x, type: e.target.value as Question['type'] } : x,
                                ),
                              })
                            }
                          >
                            <option value="truth">💭 Thật</option>
                            <option value="dare">💖 Thách</option>
                          </select>
                          <button
                            type="button"
                            className="admin-delete"
                            disabled={locale === 'en'}
                            aria-label={`Xóa câu ${i + 1}`}
                            onClick={() =>
                              patch({ questions: draft.questions.filter((_, j) => j !== i) })
                            }
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                        <textarea
                          aria-label={`Nội dung câu ${i + 1}`}
                          required
                          maxLength={2000}
                          rows={2}
                          value={q.text}
                          onChange={(e) =>
                            patch({
                              questions: draft.questions.map((x, j) =>
                                j === i ? { ...x, text: e.target.value } : x,
                              ),
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="button button-secondary"
                    disabled={locale === 'en'}
                    onClick={() =>
                      patch({
                        questions: [
                          ...draft.questions,
                          { id: crypto.randomUUID(), type: 'truth', text: '' },
                        ],
                      })
                    }
                  >
                    <Plus size={17} />
                    Thêm câu hỏi
                  </button>
                  {!draft.questions.length && (
                    <p className="admin-empty">Nhập JSON hoặc thêm câu hỏi để bắt đầu.</p>
                  )}
                </section>
              </div>
              <footer className="admin-save">
                <span>
                  {draft.questions.length} câu ·{' '}
                  {draft.published ? 'Sẽ xuất bản khi lưu' : 'Sẽ lưu bản nháp'}
                </span>
                <button className="button button-primary" disabled={busy}>
                  <Save size={18} />
                  {busy ? 'Đang lưu…' : 'Lưu bộ'}
                </button>
              </footer>
            </fieldset>
          </form>
        </>
      )}
    </main>
  );
}
