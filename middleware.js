import { NextResponse } from 'next/server';

// Page guard: no session cookie -> /login. Real session check happens in every API route.
export function middleware(req) {
  const { pathname } = req.nextUrl;
  const hasSession = req.cookies.has('session');

  if (pathname.startsWith('/login')) {
    if (hasSession) return NextResponse.redirect(new URL('/dashboard', req.url));
    return NextResponse.next();
  }
  if (!hasSession) return NextResponse.redirect(new URL('/login', req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|icons|brand|push|manifest.json|sw.js|offline.html|favicon.ico).*)'],
};
