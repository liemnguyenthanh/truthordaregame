import test from 'node:test';
import assert from 'node:assert/strict';
import type { QuestionSet } from '../lib/types';
import { createGameState, drawQuestion, getAvailableQuestions, shuffle } from '../lib/game';
const premium: QuestionSet = {
  schemaVersion: 1,
  packId: 'test-premium',
  locale: 'vi',
  contentVersion: '1',
  trialQuestionIds: ['t1', 't2', 't3', 't4', 'd1', 'd2', 'd3', 'd4'],
  questions: (['truth', 'dare'] as const).flatMap((type) =>
    Array.from({ length: 6 }, (_, index) => ({
      id: `${type === 'truth' ? 't' : 'd'}${index + 1}`,
      type,
      text: `Question ${index + 1}`,
    })),
  ),
};
test('trial cannot reveal a fifth truth; all eight remain readable before paywall', () => {
  let state = createGameState(premium);
  for (let i = 0; i < 4; i++) state = drawQuestion(premium, state, 'truth', false, () => 0).state;
  assert.equal(drawQuestion(premium, state, 'truth', false).status, 'type-exhausted');
  for (let i = 0; i < 4; i++) {
    const next = drawQuestion(premium, state, 'dare', false, () => 0);
    assert.equal(next.status, 'drawn');
    state = next.state;
  }
  assert.equal(state.seenIds.length, 8);
  assert.ok(state.currentId);
  assert.deepEqual(new Set(state.seenIds), new Set(premium.trialQuestionIds));
  const exhausted = drawQuestion(premium, state, 'dare', false);
  assert.equal(exhausted.status, 'trial-exhausted');
  assert.equal(exhausted.state.currentId, state.currentId);
});
test('unlock continues the same game without repeating preview questions', () => {
  let state = createGameState(premium);
  for (const type of ['truth', 'dare'] as const)
    for (let i = 0; i < 4; i++) state = drawQuestion(premium, state, type, false).state;
  const previews = [...state.seenIds];
  for (const type of ['truth', 'dare'] as const)
    for (let i = 0; i < 2; i++) {
      const result = drawQuestion(premium, state, type, true);
      assert.equal(result.status, 'drawn');
      assert.ok(!previews.includes(result.question!.id));
      state = result.state;
    }
  assert.equal(new Set(state.seenIds).size, 12);
  assert.equal(drawQuestion(premium, state, 'truth', true).status, 'complete');
});
test('restart replays only fixed previews, retaining lifetime trial history', () => {
  const state = createGameState(premium, premium.trialQuestionIds);
  assert.deepEqual(state.trialSeenIds, premium.trialQuestionIds);
  assert.equal(getAvailableQuestions(premium, state, 'truth', false).length, 4);
  assert.deepEqual(JSON.parse(JSON.stringify(state)), state);
});
test('drawing never mutates state and refuses a mismatched content version', () => {
  const state = createGameState(premium);
  drawQuestion(premium, state, 'truth', false);
  assert.deepEqual(state.seenIds, []);
  assert.throws(() => drawQuestion(premium, { ...state, contentVersion: 'old' }, 'truth', false));
});
test('shuffle preserves input and every element', () => {
  const original = [1, 2, 3, 4];
  const output = shuffle(original, () => 0);
  assert.deepEqual(original, [1, 2, 3, 4]);
  assert.deepEqual([...output].sort(), original);
  assert.notDeepEqual(output, original);
});
