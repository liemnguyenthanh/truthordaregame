import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getPacks,
  getQuestionSet,
  getCategories,
  bundledTranslation,
  resolveTranslation,
} from '../lib/content';
import { generationInput } from '../lib/ai/input';
import { assemble, slots } from '../lib/ai/slots';
import { validatePack } from '../lib/admin/validation';
import { validateContent } from '../scripts/validate-content';

test('both language catalogs validate and preserve commerce and question identities', () => {
  assert.deepEqual(validateContent('en'), validateContent('vi'));
  for (const vi of getPacks('vi')) {
    const en = getPacks('en').find((p) => p.id === vi.id)!;
    assert.ok(en);
    assert.equal(en.productId, vi.productId);
    assert.equal(en.priceHintVnd, vi.priceHintVnd);
    const source = getQuestionSet(vi),
      translated = getQuestionSet(en);
    assert.deepEqual(translated.trialQuestionIds, source.trialQuestionIds);
    assert.deepEqual(
      translated.questions.map((q) => [q.id, q.type]),
      source.questions.map((q) => [q.id, q.type]),
    );
    assert.ok(translated.questions.every((q, i) => q.text !== source.questions[i].text));
  }
  assert.deepEqual(
    getCategories('en').map((c) => c.id),
    getCategories('vi').map((c) => c.id),
  );
});
test('AI language defaults to Vietnamese and rejects unsupported language', () => {
  const raw = {
    group: {
      id: 'group-1',
      name: 'Friends',
      players: [
        { id: 'a', name: 'Alice' },
        { id: 'b', name: 'Bob' },
      ],
    },
    mood: 'friendly',
    adultsConfirmed: false,
  };
  assert.equal(generationInput(raw).locale, 'vi');
  assert.throws(() => generationInput({ ...raw, locale: 'fr' }));
  const input = generationInput({ ...raw, locale: 'en' });
  const output = assemble('generated', input, new Date().toISOString(), {
    questions: slots(input).map((s) => ({
      id: s.id,
      text: `${s.actor}, give ${s.partner} a sincere compliment.`,
    })),
  });
  assert.equal(output.questionSet?.locale, 'en');
  assert.equal(output.pack?.locale, 'en');
  assert.match(output.pack!.title, /custom pack/);
  assert.notEqual(JSON.stringify(input), JSON.stringify(generationInput(raw)));
});
test('translation editor emits locale-specific immutable question URL', () => {
  const pack = getPacks('en')[0];
  const { metadata, questionSet } = validatePack(
    { ...pack, questions: getQuestionSet(pack).questions, expected: null },
    'revision-2',
  );
  assert.equal(metadata.questionFile, `/content/questions/${pack.id}/revision-2?locale=en`);
  assert.equal(questionSet.locale, 'en');
  assert.throws(() => validatePack({ ...pack, locale: 'fr' }, 'v2'));
});

test('bundled fallback accepts imported versions only for identical source and semantics', () => {
  const pack = getPacks('vi')[0],
    source = getQuestionSet(pack);
  assert.equal(bundledTranslation(pack, source, 'en')?.locale, 'en');
  assert.equal(
    bundledTranslation(
      { ...pack, contentVersion: 'imported-uuid', priceHintVnd: 99000 },
      source,
      'en',
    )?.priceHintVnd,
    99000,
  );
  assert.equal(bundledTranslation({ ...pack, title: 'Edited title' }, source, 'en'), undefined);
  assert.equal(
    bundledTranslation(
      pack,
      {
        ...source,
        questions: source.questions.map((q, i) => (i === 0 ? { ...q, text: 'Changed source' } : q)),
      },
      'en',
    ),
    undefined,
  );
  assert.equal(
    bundledTranslation(pack, { ...source, questions: source.questions.slice(1) }, 'en'),
    undefined,
  );
  assert.equal(
    bundledTranslation(pack, { ...source, trialQuestionIds: ['unknown'] }, 'en'),
    undefined,
  );
});

test('draft or stale database translations never republish bundled content', () => {
  const pack = getPacks('vi')[0],
    source = getQuestionSet(pack),
    metadata = getPacks('en')[0];
  assert.ok(resolveTranslation(pack, source, 'en'));
  assert.equal(
    resolveTranslation(pack, source, 'en', {
      metadata,
      source_revision: pack.contentVersion,
      published: false,
    }),
    undefined,
  );
  assert.equal(
    resolveTranslation(pack, source, 'en', {
      metadata,
      source_revision: 'old-revision',
      published: true,
    }),
    undefined,
  );
  assert.equal(
    resolveTranslation(pack, source, 'en', {
      metadata,
      source_revision: pack.contentVersion,
      published: true,
    })?.locale,
    'en',
  );
});
