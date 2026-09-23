import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { englishMessages, localizedError } from '../lib/i18n/messages';
import { interpolate } from '../lib/i18n';
import { LocaleProvider, useI18n } from '../components/locale-provider';
import { PackCard } from '../components/pack-card';
import type { Pack } from '../lib/types';

function GroupLabels() {
  const { t } = useI18n();
  return createElement(
    'p',
    null,
    [
      t('Ai cùng chơi hôm nay?'),
      t('Tên nhóm'),
      t('Ví dụ: Minh'),
      t('Lưu nhóm & bắt đầu ván mới'),
      t('Hội bạn thân'),
    ].join(' · '),
  );
}

const pack: Pack = {
  id: 'friends',
  slug: 'friends',
  title: 'Friends',
  description: 'Play together.',
  tier: 'premium',
  productId: 'friends',
  priceHintVnd: 30000,
  ageLabel: '16+',
  playerRange: { min: 2, max: 8 },
  published: true,
  icon: '🎉',
  color: 'purple',
  categoryIds: ['friends'],
  questionCount: 100,
  truthCount: 50,
  dareCount: 50,
  trialCount: 8,
  questionFile: '/questions/en/friends.json',
  contentVersion: '1',
};

test('all UI translations preserve interpolation variables', () => {
  const variables = (text: string) =>
    [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
  for (const [source, translation] of Object.entries(englishMessages)) {
    assert.ok(translation.trim(), `Empty English translation: ${source}`);
    assert.deepEqual(variables(translation), variables(source), source);
  }
});

test('interpolation handles zero and repeated names without rewriting unrelated braces', () => {
  assert.equal(
    interpolate('{count}/{count} · {name} · {unknown}', { count: 0, name: 'Alex' }),
    '0/0 · Alex · {unknown}',
  );
  assert.equal(
    interpolate(englishMessages['Thử {v0} câu miễn phí'], { v0: 8 }),
    'Try 8 questions free',
  );
});

test('errors retain Vietnamese copy and translate actionable validation, quota and recovery failures', () => {
  for (const message of [
    'Nhóm cần từ 2 đến 8 thành viên.',
    'Đã hết lượt tạo AI hôm nay. Hãy quay lại ngày mai hoặc chơi bộ có sẵn.',
    'Mã khôi phục không hợp lệ hoặc không còn hiệu lực.',
    'Tạo bộ câu hỏi AI chưa được cấu hình. Bạn vẫn có thể chơi các bộ có sẵn.',
  ]) {
    assert.equal(localizedError('vi', message), message);
    assert.equal(localizedError('en', message), englishMessages[message]);
  }
  assert.equal(
    localizedError('en', 'Lỗi máy chủ chưa được dịch'),
    'Something went wrong. Please check your details and try again.',
  );
  assert.equal(localizedError('en', 'Unsupported language.'), 'Unsupported language.');
});

test('locale provider renders English labels during server rendering', () => {
  const html = renderToStaticMarkup(
    createElement(LocaleProvider, {
      locale: 'en',
      children: createElement(GroupLabels),
    }),
  );
  assert.match(html, /Who is playing today\?/);
  assert.match(html, /Group name/);
  assert.match(html, /For example: Alex/);
  assert.match(html, /Save group &amp; start a new round/);
  assert.doesNotMatch(html, /Tên nhóm|Hội bạn thân|Thêm thành viên/);
});

test('locale provider retains the existing Vietnamese labels during server rendering', () => {
  const html = renderToStaticMarkup(
    createElement(LocaleProvider, {
      locale: 'vi',
      children: createElement(GroupLabels),
    }),
  );
  assert.match(html, /Ai cùng chơi hôm nay\?/);
  assert.match(html, /Tên nhóm/);
  assert.match(html, /Hội bạn thân/);
});

test('English pack cards render canonical localized links and the shared product trial count', () => {
  const html = renderToStaticMarkup(
    createElement(LocaleProvider, { locale: 'en', children: createElement(PackCard, { pack }) }),
  );
  assert.match(html, /href="\/en\/packs\/friends"/);
  assert.match(html, /href="\/en\/play\/friends"/);
  assert.match(html, /Try 8 questions free/);
  assert.match(html, /100<!-- --> <!-- -->questions|100 questions/);
  assert.doesNotMatch(html, /href="\/vi/);
});
