import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { getCategories, getPacks, getQuestionSet } from '../lib/content';

export function validateContent() {
  const packs = getPacks();
  const categories = getCategories();
  for (const [name, values] of [
    ['pack IDs', packs.map((p) => p.id)],
    ['pack slugs', packs.map((p) => p.slug)],
    ['category IDs', categories.map((c) => c.id)],
    ['category slugs', categories.map((c) => c.slug)],
  ] as const) {
    assert.equal(new Set(values).size, values.length, `Duplicate ${name}`);
  }
  assert.equal(
    new Set(packs.map((p) => p.questionFile)).size,
    packs.length,
    'Every pack requires a separate question file',
  );
  for (const pack of packs) {
    const set = getQuestionSet(pack);
    assert.equal(set.schemaVersion, 1);
    assert.equal(set.packId, pack.id);
    assert.equal(set.locale, 'vi');
    assert.equal(set.contentVersion, pack.contentVersion);
    assert.match(pack.questionFile, /^\/vi\/questions\/[a-z0-9-]+\.v[\w.-]+\.json$/);
    assert.equal(
      new Set(set.questions.map((q) => q.id)).size,
      set.questions.length,
      `${pack.id}: duplicate questions`,
    );
    assert.equal(pack.questionCount, set.questions.length);
    assert.equal(pack.truthCount, set.questions.filter((q) => q.type === 'truth').length);
    assert.equal(pack.dareCount, set.questions.filter((q) => q.type === 'dare').length);
    assert.equal(pack.questionCount, pack.truthCount + pack.dareCount);
    for (const question of set.questions) {
      assert.ok(question.id && question.text.trim(), `${pack.id}: empty question`);
      assert.ok(['truth', 'dare'].includes(question.type));
    }
    assert.equal(new Set(set.trialQuestionIds).size, set.trialQuestionIds.length);
    assert.equal(pack.trialCount, set.trialQuestionIds.length);
    for (const id of set.trialQuestionIds)
      assert.ok(
        set.questions.some((q) => q.id === id),
        `Unknown trial ID ${id}`,
      );
    if (pack.tier === 'premium') {
      assert.equal(pack.trialCount, 8);
      for (const type of ['truth', 'dare'])
        assert.equal(
          set.questions.filter((q) => q.type === type && set.trialQuestionIds.includes(q.id))
            .length,
          4,
        );
      assert.ok(pack.productId && Number.isInteger(pack.priceHintVnd) && pack.priceHintVnd > 0);
    } else {
      assert.equal(pack.trialCount, 0);
      assert.equal(pack.priceHintVnd, 0);
      assert.equal(pack.productId, null);
    }
    for (const id of pack.categoryIds)
      assert.ok(
        categories.some((c) => c.id === id && c.packIds.includes(pack.id)),
        `Category relationship missing for ${pack.id}`,
      );
  }
  for (const category of categories)
    for (const id of category.packIds)
      assert.ok(
        packs.some((p) => p.id === id && p.categoryIds.includes(category.id)),
        `Unknown pack relationship ${id}`,
      );
  return {
    packs: packs.length,
    categories: categories.length,
    questions: packs.reduce((sum, pack) => sum + pack.questionCount, 0),
  };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  console.log('Content valid:', validateContent());
