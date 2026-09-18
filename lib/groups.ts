import type { GroupMood, PlayGroup } from './types';

export const GROUP_STORAGE_KEY = 'tod:group:v1';
export const MOODS: {
  id: GroupMood;
  name: string;
  icon: string;
  description: string;
  adultOnly: boolean;
}[] = [
  {
    id: 'friendly',
    name: 'Vui vẻ',
    icon: '🎉',
    description: 'Phá băng, trêu vui và cùng bật cười.',
    adultOnly: false,
  },
  {
    id: 'deep',
    name: 'Gắn kết',
    icon: '💜',
    description: 'Kể chuyện, hiểu nhau và nói lời chân thành.',
    adultOnly: false,
  },
  {
    id: 'party',
    name: 'Quậy một chút',
    icon: '🪩',
    description: 'Thử thách sáng tạo, nhiều tương tác cả nhóm.',
    adultOnly: false,
  },
  {
    id: 'flirty',
    name: 'Táo bạo · 18+',
    icon: '🔥',
    description: 'Tán tỉnh và trò chuyện thân mật, luôn có quyền bỏ qua.',
    adultOnly: true,
  },
];

export function validateGroup(value: unknown): PlayGroup {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Thông tin nhóm chưa hợp lệ.');
  const group = value as Record<string, unknown>;
  if (typeof group.id !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(group.id))
    throw new Error('Mã nhóm chưa hợp lệ.');
  if (typeof group.name !== 'string') throw new Error('Hãy đặt tên nhóm.');
  const name = group.name.normalize('NFC').trim().replace(/\s+/g, ' ');
  if (!name || name.length > 50 || /[<>\x00-\x1f]/.test(name))
    throw new Error('Tên nhóm cần từ 1 đến 50 ký tự, không chứa ký tự đặc biệt < hoặc >.');
  if (!Array.isArray(group.players) || group.players.length < 2 || group.players.length > 8)
    throw new Error('Nhóm cần từ 2 đến 8 thành viên.');
  const names = new Set<string>();
  const ids = new Set<string>();
  const players = group.players.map((item: unknown) => {
    if (!item || typeof item !== 'object' || Array.isArray(item))
      throw new Error('Thông tin thành viên chưa hợp lệ.');
    const player = item as Record<string, unknown>;
    if (
      typeof player.id !== 'string' ||
      !/^[a-zA-Z0-9_-]{1,64}$/.test(player.id) ||
      ids.has(player.id)
    )
      throw new Error('Mã thành viên chưa hợp lệ hoặc bị trùng.');
    if (typeof player.name !== 'string') throw new Error('Hãy nhập tên từng thành viên.');
    const normalized = player.name.normalize('NFC').trim().replace(/\s+/g, ' ');
    if (!normalized || normalized.length > 30 || /[<>\x00-\x1f]/.test(normalized))
      throw new Error('Tên thành viên cần từ 1 đến 30 ký tự, không chứa < hoặc >.');
    const key = normalized.toLocaleLowerCase('vi');
    if (names.has(key))
      throw new Error('Tên thành viên bị trùng. Thêm biệt danh để phân biệt nhé.');
    names.add(key);
    ids.add(player.id);
    return { id: player.id, name: normalized };
  });
  return { id: group.id, name, players };
}

export function createGroup(name: string, names: string[]): PlayGroup {
  return validateGroup({
    id: crypto.randomUUID(),
    name,
    players: names.map((name) => ({ id: crypto.randomUUID(), name })),
  });
}

export function readSavedGroup(): PlayGroup | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(GROUP_STORAGE_KEY);
    return raw ? validateGroup(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}
