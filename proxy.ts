import { NextResponse, type NextRequest } from 'next/server';
import { localeFromPath } from './lib/i18n';

export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  // Derive this from the URL, never trust an incoming client-supplied locale header.
  headers.set('x-app-locale', localeFromPath(request.nextUrl.pathname));
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ['/((?!api/|content/|_next/|.*\\.[^/]+$).*)'],
};
