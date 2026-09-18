import { createGameState, drawQuestion, getAvailableQuestions, type GameState, type DrawResult } from './game';
import type { PlayGroup, QuestionSet, QuestionType } from './types';

export type GroupGameState = GameState & { actorId?: string | null; groupFingerprint?: string };
export type GroupDrawResult = Omit<DrawResult, 'state' | 'status'> & { state: GroupGameState; status: DrawResult['status'] | 'actor-exhausted' };

/** Includes names so edited groups cannot silently inherit old actor-bound progress. */
export function groupFingerprint(group?: PlayGroup | null): string {
  return group ? JSON.stringify([group.id, group.name, group.players.map(player => [player.id, player.name])]) : '';
}
export function createGroupGameState(set: QuestionSet, group?: PlayGroup | null, previousTrialSeenIds: string[] = []): GroupGameState {
  return { ...createGameState(set, previousTrialSeenIds), actorId: null, groupFingerprint: groupFingerprint(group) };
}

/** Normal packs rotate members; personalized packs only draw questions tagged to the selected member. */
export function drawGroupQuestion(set: QuestionSet, state: GroupGameState, type: QuestionType, unlocked: boolean, group?: PlayGroup | null, skip = false, rng: () => number = Math.random): GroupDrawResult {
  if (!group?.players.length) return drawQuestion(set, state, type, unlocked, rng);
  const available = getAvailableQuestions(set, state, type, unlocked);
  if (!available.length) {
    const exhausted = drawQuestion(set, state, type, unlocked, rng);
    return { ...exhausted, state };
  }
  const tagged = set.questions.some(question => Boolean(question.playerId));
  const currentIndex = group.players.findIndex(player => player.id === state.actorId);
  let actor = group.players[(currentIndex + 1) % group.players.length];
  if (skip && currentIndex >= 0) actor = group.players[currentIndex];
  if (tagged) {
    if (skip && currentIndex >= 0) {
      if (!available.some(question => question.playerId === actor.id)) return { state, status: 'actor-exhausted' };
    } else {
      // Walk in seating order, passing members with no remaining question of this type.
      const eligible = Array.from({ length: group.players.length }, (_, offset) => group.players[(currentIndex + 1 + offset) % group.players.length]).find(player => available.some(question => question.playerId === player.id));
      if (!eligible) return { state, status: 'actor-exhausted' };
      actor = eligible;
    }
  }
  const actorSet = tagged ? { ...set, questions: set.questions.filter(question => question.playerId === actor.id) } : set;
  const result = drawQuestion(actorSet, state, type, unlocked, rng);
  if (result.status !== 'drawn') return { ...result, state };
  return { ...result, state: { ...result.state, actorId: actor.id, groupFingerprint: groupFingerprint(group) } };
}
