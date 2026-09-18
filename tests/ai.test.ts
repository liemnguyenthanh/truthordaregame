import test from 'node:test';
import assert from 'node:assert/strict';
import { slots, validateOutput, assemble } from '../lib/ai/slots';
import { generationInput } from '../lib/ai/input';
import { estimatedCost } from '../lib/ai/cost';
const input = generationInput({
  group: {
    id: 'g',
    name: 'Bạn thân',
    players: [
      { id: 'a', name: 'An' },
      { id: 'b', name: 'Bình' },
      { id: 'c', name: 'Chi' },
    ],
  },
  mood: 'friendly',
  adultsConfirmed: false,
});
test('slots give each member 2 truths and 2 dares, rotate partners and never self-pair', () => {
  const rows = slots(input);
  assert.equal(rows.length, 12);
  for (const p of input.group.players) {
    const own = rows.filter((r) => r.playerId === p.id);
    assert.equal(own.filter((r) => r.type === 'truth').length, 2);
    assert.equal(own.filter((r) => r.type === 'dare').length, 2);
    assert.equal(new Set(own.map((r) => r.partnerId)).size, 2);
    assert.ok(own.every((r) => r.playerId !== r.partnerId));
  }
});
test('output refuses missing, duplicate, unknown slots and absent named member', () => {
  const expected = slots(input),
    valid = {
      questions: expected.map((s) => ({
        id: s.id,
        text: `${s.actor} hãy kể cho ${s.partner} một kỷ niệm vui nhé.`,
      })),
    };
  assert.equal(validateOutput(valid, expected).questions.length, 12);
  assert.throws(() => validateOutput({ questions: valid.questions.slice(1) }, expected));
  assert.throws(() =>
    validateOutput(
      { questions: valid.questions.map((r, i) => (i ? r : valid.questions[1])) },
      expected,
    ),
  );
  assert.throws(() =>
    validateOutput(
      {
        questions: valid.questions.map((r, i) =>
          i ? r : { ...r, text: 'Cả nhóm hãy kể một kỷ niệm vui.' },
        ),
      },
      expected,
    ),
  );
  const built = assemble('123', input, '2026-09-17', valid);
  assert.equal(built.questionSet?.questions[0].playerId, 'a');
  assert.equal(built.pack?.tier, 'free');
});
test('flirty requires explicit adult confirmation; unknown mood rejected', () => {
  assert.throws(() => generationInput({ ...input, mood: 'flirty' }));
  assert.equal(generationInput({ ...input, mood: 'flirty', adultsConfirmed: true }).mood, 'flirty');
  assert.throws(() => generationInput({ ...input, mood: 'unknown' }));
});
test('unknown provider cost stays null, supplied verified rates use real token usage', () => {
  assert.equal(estimatedCost(100, 100, undefined, undefined), null);
  assert.equal(estimatedCost(100, 100, '', ''), null);
  assert.equal(estimatedCost(100, 200, '1', '2'), 0.0005);
  assert.equal(estimatedCost(undefined, 1, '1', '1'), null);
});

import { retryPersistence } from '../lib/ai/persistence';
test('transient save error retries storage while preserving the already generated output', async () => {
  const output = { questions: ['already generated'] };
  let saves = 0;
  const saved = await retryPersistence(
    async () => {
      saves++;
      if (saves === 1) throw new Error('temporary DB outage');
      return output;
    },
    async () => {},
  );
  assert.equal(saves, 2);
  assert.equal(saved, output);
});
test('persistent DB outage stops after three storage attempts', async () => {
  let saves = 0;
  await assert.rejects(
    retryPersistence(
      async () => {
        saves++;
        throw new Error('DB unavailable');
      },
      async () => {},
    ),
  );
  assert.equal(saves, 3);
});
