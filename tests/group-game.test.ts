import test from 'node:test';
import assert from 'node:assert/strict';
import { createGroupGameState, drawGroupQuestion, groupFingerprint } from '../lib/group-game';
import type { PlayGroup, QuestionSet } from '../lib/types';

const group: PlayGroup = {
  id: 'group',
  name: 'Bạn thân',
  players: [
    { id: 'a', name: 'An' },
    { id: 'b', name: 'Bình' },
    { id: 'c', name: 'Chi' },
  ],
};
const set: QuestionSet = {
  schemaVersion: 1,
  packId: 'free',
  locale: 'vi',
  contentVersion: '1',
  trialQuestionIds: [],
  questions: Array.from({ length: 8 }, (_, i) => ({
    id: `q${i}`,
    text: `Câu ${i}`,
    type: 'truth',
  })),
};

test('normal group rotates in order, skip retains actor, persisted reload keeps next turn', () => {
  let state = createGroupGameState(set, group);
  state = drawGroupQuestion(set, state, 'truth', true, group, false, () => 0).state;
  assert.equal(state.actorId, 'a');
  state = drawGroupQuestion(set, state, 'truth', true, group, true, () => 0).state;
  assert.equal(state.actorId, 'a');
  state = drawGroupQuestion(
    set,
    JSON.parse(JSON.stringify(state)),
    'truth',
    true,
    group,
    false,
    () => 0,
  ).state;
  assert.equal(state.actorId, 'b');
  state = drawGroupQuestion(set, state, 'truth', true, group, false, () => 0).state;
  assert.equal(state.actorId, 'c');
  state = drawGroupQuestion(set, state, 'truth', true, group, false, () => 0).state;
  assert.equal(state.actorId, 'a');
  assert.equal(new Set(state.seenIds).size, 5);
});

test('exhausted and trial requests do not change actor or progress', () => {
  const premium = { ...set, trialQuestionIds: ['q0'] };
  let state = createGroupGameState(premium, group);
  state = drawGroupQuestion(premium, state, 'truth', false, group).state;
  const exhausted = drawGroupQuestion(premium, state, 'truth', false, group);
  assert.equal(exhausted.status, 'trial-exhausted');
  assert.deepEqual(exhausted.state, state);
  const restarted = createGroupGameState(premium, group, state.trialSeenIds);
  assert.equal(restarted.actorId, null);
  assert.deepEqual(restarted.trialSeenIds, ['q0']);
});

test('personalized draws always match actor and partner remains text metadata', () => {
  const personalized: QuestionSet = {
    ...set,
    questions: [
      { id: 'a1', type: 'truth', playerId: 'a', partnerId: 'b', text: 'An hỏi Bình một điều.' },
      { id: 'b1', type: 'truth', playerId: 'b', text: 'Bình chia sẻ một kỷ niệm.' },
      { id: 'c1', type: 'dare', playerId: 'c', text: 'Chi tạo dáng vui.' },
      { id: 'a2', type: 'truth', playerId: 'a', text: 'An kể một bí mật nhỏ.' },
    ],
  };
  let state = createGroupGameState(personalized, group);
  const first = drawGroupQuestion(personalized, state, 'truth', true, group, false, () => 0);
  assert.equal(first.state.actorId, first.question?.playerId);
  assert.equal(first.question?.partnerId, 'b');
  state = first.state;
  const skipped = drawGroupQuestion(personalized, state, 'truth', true, group, true, () => 0);
  assert.equal(skipped.state.actorId, 'a');
  const cannotSkip = drawGroupQuestion(personalized, skipped.state, 'truth', true, group, true);
  assert.equal(cannotSkip.status, 'actor-exhausted');
  assert.deepEqual(cannotSkip.state, skipped.state);
  const next = drawGroupQuestion(personalized, skipped.state, 'truth', true, group);
  assert.equal(next.state.actorId, 'b');
  assert.equal(next.question?.playerId, 'b');
  const dare = drawGroupQuestion(personalized, next.state, 'dare', true, group);
  assert.equal(dare.state.actorId, 'c');
  assert.equal(dare.question?.playerId, 'c');
});

test('group fingerprint changes for renamed and reordered players; no group preserves classic gameplay', () => {
  assert.notEqual(
    groupFingerprint(group),
    groupFingerprint({ ...group, players: [...group.players].reverse() }),
  );
  assert.notEqual(
    groupFingerprint(group),
    groupFingerprint({
      ...group,
      players: [{ id: 'a', name: 'An mới' }, ...group.players.slice(1)],
    }),
  );
  assert.equal(groupFingerprint(null), '');
  const state = createGroupGameState(set);
  const result = drawGroupQuestion(set, state, 'truth', true, undefined, false, () => 0);
  assert.equal(result.status, 'drawn');
  assert.equal(result.question?.id, 'q0');
});
