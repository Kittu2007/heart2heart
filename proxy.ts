import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware runs in Edge Runtime — firebase-admin (Node.js) is NOT allowed here.
 * We simply forward the Authorization header downstream.
 * Actual Firebase token verification happens in Node.js API route handlers
 * via lib/auth/verify-token.ts.
 */
export function proxy(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);

  // Forward raw Bearer token so route handlers can verify it server-side
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    requestHeaders.set('x-auth-token', authHeader.replace(/^Bearer\s+/i, ''));
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/api/:path*'],
};
