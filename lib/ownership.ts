export type Ownership = { packId: string; expiresAt: string };
export const OWNERSHIP_KEY = 'tod:owned:v2';
export function activeOwnership(value: unknown, now = Date.now()): Ownership[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Ownership =>
      item &&
      typeof item.packId === 'string' &&
      typeof item.expiresAt === 'string' &&
      Date.parse(item.expiresAt) > now,
  );
}
export function readOwnership(): Ownership[] {
  try {
    return activeOwnership(JSON.parse(localStorage.getItem(OWNERSHIP_KEY) || '[]'));
  } catch {
    return [];
  }
}
export function saveOwnership(value: unknown) {
  localStorage.removeItem('tod:owned:v1');
  localStorage.setItem(OWNERSHIP_KEY, JSON.stringify(activeOwnership(value)));
}
