import test from 'node:test';
import assert from 'node:assert/strict';
import { issueToken, validToken, equalSecret } from '../lib/admin/token';
import { validatePack, parseQuestions } from '../lib/admin/validation';
const input = {
  id: 'new-pack',
  slug: 'new-pack',
  title: 'Bộ mới',
  description: 'Mô tả',
  tier: 'premium',
  priceHintVnd: 30000,
  published: true,
  icon: '🎉',
  color: 'purple',
  categoryIds: ['friends'],
  ageLabel: '16+',
  playerRange: { min: 2, max: 8 },
  expected: null,
  questions: Array.from({ length: 12 }, (_, i) => ({
    id: `q-${i}`,
    type: i < 6 ? 'truth' : 'dare',
    text: `Câu ${i}`,
  })),
};
test('admin tokens reject tampering, expiry, password rotation and missing signatures', () => {
  const password = 'a-very-long-password';
  const now = 1800000000000;
  const token = issueToken(password, now);
  assert.equal(validToken(token, password, now + 1), true);
  assert.equal(validToken(token + 'x', password, now), false);
  assert.equal(validToken(token, 'changed-password', now), false);
  assert.equal(validToken(token, password, now + 8 * 60 * 60 * 1000), false);
  assert.equal(validToken('', password, now), false);
  assert.equal(equalSecret('abc', 'abd'), false);
});
test('content validation computes counts, balanced trial IDs and versioned route', () => {
  const { metadata, questionSet } = validatePack(input, 'v2');
  assert.equal(metadata.questionCount, 12);
  assert.equal(metadata.priceHintVnd, 30000);
  assert.equal(questionSet.trialQuestionIds.length, 8);
  assert.equal(metadata.questionFile, '/content/questions/new-pack/v2');
  assert.equal(questionSet.trialQuestionIds.filter((id) => Number(id.slice(2)) < 6).length, 4);
  assert.equal(validatePack({ ...input, tier: 'free' }, 'v2').metadata.priceHintVnd, 0);
});
test('invalid imports and metadata cannot reach database', () => {
  for (const change of [
    { slug: '../escape' },
    { priceHintVnd: -1 },
    { priceHintVnd: 1.5 },
    { questions: input.questions.slice(0, 8) },
    { categoryIds: ['unknown'] },
    { playerRange: { min: 4, max: 2 } },
    { expected: undefined },
  ])
    assert.throws(() => validatePack({ ...input, ...change }, 'v2'));
  assert.throws(() =>
    parseQuestions([
      { id: 'same', type: 'truth', text: 'A' },
      { id: 'same', type: 'dare', text: 'B' },
    ]),
  );
  assert.throws(() =>
    parseQuestions([
      { type: 'invalid', text: 'A' },
      { type: 'dare', text: 'B' },
    ]),
  );
  assert.equal(
    parseQuestions({
      questions: [
        { type: 'truth', text: 'A' },
        { type: 'dare', text: 'B' },
      ],
    })[0].id,
    'q-1',
  );
});

import { hasSameOrigin } from '../lib/request-origin';
test('same-origin validation handles Next host normalization without allowing foreign origins', () => {
  const req = (origin: string, host = '127.0.0.1:3100') =>
    new Request('http://localhost:3100/api/admin/packs', {
      headers: { Origin: origin, Host: host },
    });
  assert.equal(hasSameOrigin(req('http://127.0.0.1:3100')), true);
  assert.equal(hasSameOrigin(req('https://evil.example')), false);
  assert.equal(hasSameOrigin(req('http://127.0.0.1:3100/extra')), false);
  assert.equal(hasSameOrigin(req('null')), false);
  assert.equal(hasSameOrigin(req('https://127.0.0.1:3100')), false);
  assert.equal(hasSameOrigin(new Request('https://example.org/api/admin/packs')), false);
});
