import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const sessionCookie = request.cookies.get('rootwise_session')?.value;
  const isAuthenticated = Boolean(sessionCookie);

  // Protected route: Rootwise dashboard (/)
  if (pathname === '/') {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', '/');
      return NextResponse.redirect(loginUrl);
    }
  }

  // Auth pages: /login and /signup
  if (pathname === '/login' || pathname === '/signup') {
    if (isAuthenticated) {
      const returnUrl = searchParams.get('redirect') || '/';
      return NextResponse.redirect(new URL(returnUrl, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/signup'],
};
