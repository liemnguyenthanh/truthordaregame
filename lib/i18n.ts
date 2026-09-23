export const locales = ['vi', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'vi';

export function isLocale(value: unknown): value is Locale {
  return value === 'vi' || value === 'en';
}

export function formatLocale(locale: Locale) {
  return locale === 'en' ? 'en-US' : 'vi-VN';
}

export const routeSegments = {
  choi: 'play',
  'bo-cau-hoi': 'packs',
  'danh-muc': 'categories',
  'cach-choi': 'how-to-play',
  'tao-bo-ai': 'create-ai-pack',
  'bo-ai': 'ai-pack',
  'thanh-toan': 'checkout',
  'khoi-phuc': 'restore',
  'lien-he': 'contact',
  'chinh-sach-thanh-toan': 'payment-policy',
  'quyen-rieng-tu': 'privacy',
} as const;

/** Localize internal page URLs without changing pack IDs, query values or fragments. */
export function localePath(locale: Locale, href: string): string {
  if (!href.startsWith('/') || href.startsWith('//')) return href;
  const match = href.match(/^([^?#]*)(.*)$/)!;
  const parts = match[1].split('/').filter(Boolean);
  if (parts.length && !isLocale(parts[0])) return href;
  if (parts.length) parts.shift();
  if (parts[0]) {
    const entry = Object.entries(routeSegments).find(
      ([vi, en]) => parts[0] === vi || parts[0] === en,
    );
    if (entry) parts[0] = entry[locale === 'vi' ? 0 : 1];
  }
  return `/${[locale, ...parts].join('/')}${match[2]}`;
}

export function localeFromPath(pathname: string): Locale {
  return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'vi';
}

export type MessageVariables = Record<string, string | number>;
export function interpolate(message: string, variables?: MessageVariables): string {
  return message.replace(/\{(\w+)\}/g, (match, key: string) =>
    variables && Object.hasOwn(variables, key) ? String(variables[key]) : match,
  );
}
