import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// We no longer need verifyFirebaseToken or db access here
// import { verifyFirebaseToken } from './lib/firebase/admin';
// import { db } from './server/db';
// import { RoleName } from '@prisma/client';
// import type { DecodedIdToken } from 'firebase-admin/auth';

const ADMIN_LOGIN_PATH = '/admin/login';
const CUSTOMER_LOGIN_PATH = '/login';
const ADMIN_BASE_PATH = '/admin';
const ACCOUNT_PATH = '/account'; // Example protected path

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const tokenCookie = request.cookies.get('firebaseIdToken');
  const token = tokenCookie?.value;

  console.log(`[Middleware] Path: ${pathname}, Token found: ${!!token}`);

  // Define public paths
  const publicPaths = [
    '/',
    CUSTOMER_LOGIN_PATH,
    ADMIN_LOGIN_PATH,
    '/api/trpc',
    '/favicon.ico',
    '/images',
    '/signup',
    '/product'
  ];

  const isPublicPath = publicPaths.some(path => pathname.startsWith(path) || pathname === path);
  const requestHeaders = new Headers(request.headers);

  // Pass the raw token in a header for tRPC context to verify
  if (token) {
    requestHeaders.set('x-firebase-token', token);
  }

  // --- Basic Route Protection Logic (can be refined later) ---
  // If trying to access a protected route without any token cookie, redirect to login
  if (!isPublicPath && !token) {
    const redirectUrl = pathname.startsWith(ADMIN_BASE_PATH) ? ADMIN_LOGIN_PATH : CUSTOMER_LOGIN_PATH;
    console.log(`Redirecting unauthenticated user from ${pathname} to ${redirectUrl}`);
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // If user has a token but tries to access a login page, redirect them away
  // Note: We don't know their role here, so redirecting to '/' is safest default
  if (token && (pathname === CUSTOMER_LOGIN_PATH || pathname === ADMIN_LOGIN_PATH)) {
      console.log(`Redirecting authenticated user from ${pathname} to /`);
      return NextResponse.redirect(new URL('/', request.url));
  }
  // --- End Basic Route Protection ---

  // Allow the request to proceed, potentially with the token header
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Force Node.js runtime (still needed for other potential Node APIs used by Next.js itself)
export const runtime = 'nodejs';

// Matcher config remains the same
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images/|api/auth).*)',
  ],
}; 