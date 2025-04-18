import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// Remove imports related to verification
// import { verifyFirebaseToken } from './lib/firebase/admin';
// import { db } from './server/db';
// import { RoleName } from '@prisma/client';
// import type { DecodedIdToken } from 'firebase-admin/auth';

const ADMIN_LOGIN_PATH = '/admin/login';
const CUSTOMER_LOGIN_PATH = '/login';
const SIGNUP_PATH = '/signup';
const ADMIN_BASE_PATH = '/admin';
// const ADMIN_DASHBOARD_PATH = '/admin/dashboard'; // Not needed for redirect logic here now
const ACCOUNT_PATH = '/account'; // Example protected path

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const tokenCookie = request.cookies.get('firebaseIdToken');
  const token = tokenCookie?.value;

  console.log(`[Middleware] Path: ${pathname}, Token found: ${!!token}`);

  const publicPaths = [
    '/',
    CUSTOMER_LOGIN_PATH,
    ADMIN_LOGIN_PATH,
    SIGNUP_PATH,
    '/api/trpc',
    '/favicon.ico',
    '/images',
    '/product'
  ];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path) || pathname === path);

  // Always pass token header if present
  const requestHeaders = new Headers(request.headers);
  if (token) {
    requestHeaders.set('x-firebase-token', token);
  }

  // 1. Handle public paths - allow access
  if (isPublicPath) {
    // Redirect logged-in users away from auth pages (simple redirect to '/')
    if (token && [CUSTOMER_LOGIN_PATH, ADMIN_LOGIN_PATH, SIGNUP_PATH].includes(pathname)) {
        console.log(`[Middleware] Redirecting authenticated user from ${pathname} to /`);
        return NextResponse.redirect(new URL('/', request.url));
    }
    // Allow access to public paths
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // 2. Handle protected paths - require token
  if (!token) {
    const redirectUrl = pathname.startsWith(ADMIN_BASE_PATH) ? ADMIN_LOGIN_PATH : CUSTOMER_LOGIN_PATH;
    console.log(`[Middleware] Redirecting unauthenticated user from ${pathname} to ${redirectUrl}`);
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // 3. Allow all other authenticated requests (Admin check happens in tRPC)
  // Middleware no longer blocks /admin/* based on role here.
  // Protection will be handled by procedures used on admin pages.
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const runtime = 'nodejs';

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images/|api/auth).*)',
  ],
}; 