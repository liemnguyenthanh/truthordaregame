import test from 'node:test';
import assert from 'node:assert/strict';
import { activeOwnership } from '../lib/ownership';

test('cached ownership requires a valid future deadline, including offline and legacy cache', () => {
  const now = Date.parse('2026-09-23T00:00:00Z');
  assert.deepEqual(activeOwnership(['old-permanent-pack'], now), []);
  assert.deepEqual(
    activeOwnership(
      [
        { packId: 'expired', expiresAt: new Date(now - 1).toISOString() },
        { packId: 'boundary', expiresAt: new Date(now).toISOString() },
        { packId: 'invalid', expiresAt: 'bad' },
        { packId: 'missing' },
        { packId: 'active', expiresAt: new Date(now + 1).toISOString() },
      ],
      now,
    ),
    [{ packId: 'active', expiresAt: new Date(now + 1).toISOString() }],
  );
});
