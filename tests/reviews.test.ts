import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reviewInput } from '../lib/reviews';
test('review accepts only bounded, trimmed text and integer stars', () => {
  assert.deepEqual(reviewInput({ name: ' An ', comment: ' Vui! ', rating: 5 }), {
    name: 'An',
    comment: 'Vui!',
    rating: 5,
  });
  for (const value of [
    null,
    [],
    { name: ' ', comment: 'x', rating: 5 },
    { name: 'An', comment: ' ', rating: 5 },
    { name: 'x'.repeat(61), comment: 'x', rating: 5 },
    { name: 'An', comment: 'x'.repeat(1001), rating: 5 },
    ...[0, 6, 1.5, '5'].map((rating) => ({ name: 'An', comment: 'x', rating })),
  ])
    assert.equal(reviewInput(value), null);
});
