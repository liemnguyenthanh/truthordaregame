'use client';

import { createContext, useContext, useMemo } from 'react';
import { englishMessages } from '@/lib/i18n/messages';
import { interpolate, localePath, type Locale, type MessageVariables } from '@/lib/i18n';

type LocaleContextValue = {
  locale: Locale;
  t: (source: string, variables?: MessageVariables) => string;
  path: (href: string) => string;
};

function contextValue(locale: Locale): LocaleContextValue {
  return {
    locale,
    t: (source, variables) =>
      interpolate(locale === 'en' ? (englishMessages[source] ?? source) : source, variables),
    path: (href) => localePath(locale, href),
  };
}

const LocaleContext = createContext<LocaleContextValue>(contextValue('vi'));

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const value = useMemo(() => contextValue(locale), [locale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useI18n() {
  return useContext(LocaleContext);
}
