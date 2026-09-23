import 'server-only';
import { headers } from 'next/headers';
import { isLocale, type Locale } from './i18n';

export async function requestLocale(): Promise<Locale> {
  const value = (await headers()).get('x-app-locale');
  return isLocale(value) ? value : 'vi';
}
