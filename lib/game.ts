import type { Question, QuestionSet, QuestionType } from './types';

export type GameState = {
  packId: string;
  contentVersion: string;
  seenIds: string[];
  currentId: string | null;
  trialSeenIds: string[];
};
export type DrawResult = {
  state: GameState;
  question?: Question;
  status: 'drawn' | 'type-exhausted' | 'trial-exhausted' | 'complete';
};

/** Fisher–Yates; never mutates the input. Pass rng for deterministic tests. */
export function shuffle<T>(items: readonly T[], rng: () => number = Math.random): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const target = Math.min(index, Math.max(0, Math.floor(rng() * (index + 1))));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

/** Restart preserves lifetime preview history; fixed preview IDs remain replayable. */
export function createGameState(set: QuestionSet, previousTrialSeen: string[] = []): GameState {
  return {
    packId: set.packId,
    contentVersion: set.contentVersion,
    seenIds: [],
    currentId: null,
    trialSeenIds: [...new Set(previousTrialSeen)].filter((id) => set.trialQuestionIds.includes(id)),
  };
}

/** unlocked must be true for a free pack or a purchased premium pack. */
export function getAvailableQuestions(
  set: QuestionSet,
  state: GameState,
  type: QuestionType,
  unlocked: boolean,
): Question[] {
  return set.questions.filter(
    (question) =>
      question.type === type &&
      !state.seenIds.includes(question.id) &&
      (unlocked || set.trialQuestionIds.includes(question.id)),
  );
}

/** Draw randomly without replacement; a purchase keeps existing seen IDs intact. */
export function drawQuestion(
  set: QuestionSet,
  state: GameState,
  type: QuestionType,
  unlocked: boolean,
  rng: () => number = Math.random,
): DrawResult {
  if (state.packId !== set.packId || state.contentVersion !== set.contentVersion)
    throw new Error('Game state content version mismatch');
  const available = getAvailableQuestions(set, state, type, unlocked);
  if (!available.length) {
    const other = getAvailableQuestions(set, state, type === 'truth' ? 'dare' : 'truth', unlocked);
    return {
      state,
      status: other.length ? 'type-exhausted' : unlocked ? 'complete' : 'trial-exhausted',
    };
  }
  const question =
    available[Math.min(available.length - 1, Math.max(0, Math.floor(rng() * available.length)))];
  return {
    status: 'drawn',
    question,
    state: {
      ...state,
      currentId: question.id,
      seenIds: [...state.seenIds, question.id],
      trialSeenIds: set.trialQuestionIds.includes(question.id)
        ? [...new Set([...state.trialSeenIds, question.id])]
        : state.trialSeenIds,
    },
  };
}
