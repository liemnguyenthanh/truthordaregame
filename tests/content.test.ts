import test from 'node:test';
import assert from 'node:assert/strict';
import { getPack, getCategory } from '../lib/content';
import { validateContent } from '../scripts/validate-content';
test('published catalogs agree with question counts, trial balance and relationships', () => {
  const result = validateContent();
  assert.ok(result.packs > 0);
  assert.ok(result.categories > 0);
  assert.ok(result.questions > 0);
});
test('unknown routes resolve to undefined for real 404s', () => {
  assert.equal(getPack('missing'), undefined);
  assert.equal(getCategory('missing'), undefined);
});
