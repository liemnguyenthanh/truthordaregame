import type { GenerationInput, GeneratedPack, Question } from '@/lib/types';
export type Slot = {
  id: string;
  playerId: string;
  partnerId: string;
  type: 'truth' | 'dare';
  actor: string;
  partner: string;
};
export type AIOutput = { questions: Array<{ id: string; text: string }> };
export function slots(input: GenerationInput): Slot[] {
  return input.group.players.flatMap((player, index) =>
    Array.from({ length: 4 }, (_, round) => {
      const partner =
        input.group.players[
          (index + 1 + (round % (input.group.players.length - 1))) % input.group.players.length
        ];
      return {
        id: `p${index + 1}-${round + 1}`,
        playerId: player.id,
        partnerId: partner.id,
        type: round < 2 ? 'truth' : 'dare',
        actor: player.name,
        partner: partner.name,
      };
    }),
  );
}
export function validateOutput(value: unknown, expected: Slot[]): AIOutput {
  if (!value || typeof value !== 'object' || !Array.isArray((value as AIOutput).questions))
    throw new Error('Invalid output');
  const rows = (value as AIOutput).questions;
  if (rows.length !== expected.length) throw new Error('Incorrect question count');
  const ids = new Set<string>();
  for (const slot of expected) {
    const row = rows.find((q) => q.id === slot.id);
    if (
      !row ||
      typeof row.text !== 'string' ||
      row.text.length < 12 ||
      row.text.length > 400 ||
      !row.text.normalize('NFC').includes(slot.actor.normalize('NFC')) ||
      !row.text.normalize('NFC').includes(slot.partner.normalize('NFC')) ||
      ids.has(row.id)
    )
      throw new Error('Missing personalized slot');
    ids.add(row.id);
  }
  return {
    questions: expected.map((slot) => ({
      id: slot.id,
      text: rows.find((q) => q.id === slot.id)!.text.trim(),
    })),
  };
}
export function assemble(
  id: string,
  input: GenerationInput,
  createdAt: string,
  output: AIOutput,
): GeneratedPack {
  const expected = slots(input);
  const checked = validateOutput(output, expected);
  const questions: Question[] = expected.map((slot, index) => ({
    id: slot.id,
    type: slot.type,
    text: checked.questions[index].text,
    playerId: slot.playerId,
    partnerId: slot.partnerId,
  }));
  return {
    id,
    status: 'complete',
    group: input.group,
    mood: input.mood,
    createdAt,
    pack: {
      id: `ai-${id}`,
      slug: id,
      title: `Bộ riêng của ${input.group.name}`,
      description: 'Câu hỏi AI dành riêng cho nhóm của bạn. Luôn có thể bỏ qua.',
      tier: 'free',
      questionFile: '',
      contentVersion: '1',
      questionCount: questions.length,
      truthCount: questions.length / 2,
      dareCount: questions.length / 2,
      trialCount: 0,
      priceHintVnd: 0,
      productId: null,
      ageLabel: input.mood === 'flirty' ? '18+' : '16+',
      playerRange: { min: 2, max: input.group.players.length },
      published: false,
      icon: '✨',
      color: 'purple',
      categoryIds: [],
    },
    questionSet: {
      schemaVersion: 1,
      packId: `ai-${id}`,
      locale: 'vi',
      contentVersion: '1',
      trialQuestionIds: [],
      questions,
    },
  };
}
