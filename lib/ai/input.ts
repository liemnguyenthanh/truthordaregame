import { isLocale } from '@/lib/i18n';
import { validateGroup, MOODS } from '@/lib/groups';
import type { GenerationInput } from '@/lib/types';
export function generationInput(value: Record<string, unknown>): GenerationInput {
  const locale = value.locale ?? 'vi';
  if (!isLocale(locale)) throw new Error('Unsupported language.');
  const group = validateGroup(value.group);
  const mood = MOODS.find((m) => m.id === value.mood);
  if (!mood)
    throw new Error(
      locale === 'en' ? 'Choose a mood for your group.' : 'Hãy chọn không khí cho nhóm.',
    );
  if (mood.adultOnly && value.adultsConfirmed !== true)
    throw new Error(
      locale === 'en'
        ? 'All players must be 18 or older and agree to this theme.'
        : 'Tất cả thành viên cần đủ 18 tuổi và đồng ý với chủ đề này.',
    );
  return { locale, group, mood: mood.id, adultsConfirmed: value.adultsConfirmed === true };
}
