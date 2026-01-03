import { createMiddlewareClient } from 'next-client';
import { NextResponse } from 'next/server';
import { api } from './lib/api-client';

export default async function middleware(request: Request) {
  const pathname = request.nextUrl.pathname;

  // 1. Public paths
  if (pathname.startsWith('/login') ||
      pathname.startsWith('/register') ||
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // 2. Check session cookie
  const sessionCookie = request.cookies.get('session');
  if (!sessionCookie) {
    // Redirect to login if trying to access protected route
    if (pathname.startsWith('/dashboard/owner') || pathname.startsWith('/dashboard/admin')) {
      const loginUrl = new URL('/login', request.nextUrl);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Verify session with backend (Short cache TTL 10s is handled on backend or via Next.js cache if needed, but direct call is safer for auth check)
  try {
    const me = await api.get('/api/auth/me'); // Assuming /api/auth/me exists
    
    // 4. Owner-only routes check
    if (pathname.startsWith('/dashboard/owner')) {
      if (!me || me.role !== 'OWNER') {
        const loginUrl = new URL('/login', request.nextUrl);
        return NextResponse.redirect(loginUrl);
      }
    }

    // 5. Admin-only routes check
    if (pathname.startsWith('/dashboard/admin')) {
      if (!me || (me.role !== 'ADMIN' && me.role !== 'OWNER')) {
        const loginUrl = new URL('/login', request.nextUrl);
        return NextResponse.redirect(loginUrl);
      }
    }

    // 6. Redirect to home if authenticated but on login page
    if (pathname.startsWith('/login') && me) {
      const homeUrl = new URL('/', request.nextUrl);
      return NextResponse.redirect(homeUrl);
    }

  } catch (error) {
    // Allow request if /api/auth/me fails (e.g. 401) - let the page handle it
    // But strictly redirect owner pages if unverified
    if (pathname.startsWith('/dashboard/owner')) {
      const loginUrl = new URL('/login', request.nextUrl);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}
