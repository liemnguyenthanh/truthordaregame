import test from 'node:test';
import assert from 'node:assert/strict';
import { validateGroup } from '../lib/groups';
const sample = {
  id: 'group-1',
  name: '  Bạn   thân ',
  players: [
    { id: 'p1', name: ' An ' },
    { id: 'p2', name: 'Bình' },
  ],
};
test('group validation normalizes names and preserves identity', () => {
  assert.deepEqual(validateGroup(sample), {
    id: 'group-1',
    name: 'Bạn thân',
    players: [
      { id: 'p1', name: 'An' },
      { id: 'p2', name: 'Bình' },
    ],
  });
});
test('groups reject duplicate people, invalid counts and missing names', () => {
  assert.throws(() => validateGroup({ ...sample, players: [sample.players[0]] }));
  assert.throws(
    () =>
      validateGroup({
        ...sample,
        players: [
          { id: 'p1', name: 'An' },
          { id: 'p2', name: 'an' },
        ],
      }),
    /trùng/,
  );
  assert.throws(
    () =>
      validateGroup({
        ...sample,
        players: [
          { id: 'p1', name: 'An' },
          { id: 'p1', name: 'Bình' },
        ],
      }),
    /trùng/,
  );
  assert.throws(() =>
    validateGroup({
      ...sample,
      players: [
        { id: 'p1', name: '' },
        { id: 'p2', name: 'Bình' },
      ],
    }),
  );
  assert.throws(() =>
    validateGroup({
      ...sample,
      players: [
        { id: 'p1', name: '<script>' },
        { id: 'p2', name: 'Bình' },
      ],
    }),
  );
  assert.throws(() =>
    validateGroup({
      ...sample,
      players: Array.from({ length: 9 }, (_, i) => ({ id: `p${i}`, name: `Bạn ${i}` })),
    }),
  );
});
